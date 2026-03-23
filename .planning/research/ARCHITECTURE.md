# Architecture Research

**Domain:** v1.5 Cloud Sync — Firebase Auth + user progress sync layered onto existing Lepdy context/localStorage architecture
**Researched:** 2026-03-23
**Confidence:** HIGH — based on direct codebase reading of all existing hooks/contexts + verified Firebase Auth patterns

---

## Existing Architecture Snapshot (v1.4, as-shipped)

The foundation all v1.5 features integrate with.

### Storage Layer (7 localStorage keys, 1 sessionStorage key)

| Key | Hook | Data |
|-----|------|------|
| `lepdy_streak_data` | `useStreak` | `StreakData` (currentStreak, lastActivityDate, longestStreak, freezes) |
| `lepdy_sticker_data` | `useStickers` | `StickerData` (earnedStickerIds[]) |
| `lepdy_word_collection` | `useWordCollectionProgress` | `WordCollectionData` (collectedWords[], totalWordsBuilt) |
| `lepdy_letters_progress` | `useCategoryProgress` | `CategoryProgressData` (heardItemIds[], totalClicks) |
| `lepdy_numbers_progress` | `useCategoryProgress` | `CategoryProgressData` |
| `lepdy_animals_progress` | `useCategoryProgress` | `CategoryProgressData` |
| `lepdy_chess_progress` | `useChessProgress` | `ChessProgressData` (completedLevels[], currentLevel) |
| `lepdy_chess_puzzle_progress` | `usePuzzleProgress` | `PuzzleProgressData` (pieces: Record<pieceId, tier+streaks>) |
| `lepdy_chess_daily_*` | `useDailyPuzzle` | date-keyed completion flag |
| `lepdy_chess_piece_theme` | `useChessPieceTheme` | `'staunty' \| 'horsey'` |
| `lepdy_chess_session` (sessionStorage) | `usePuzzleSession` | in-progress session queue |
| `lepdy_first_visit` | `providers.tsx` | ISO timestamp |
| `lepdy_games_progress` | `useGamesProgress` | game completion data |

### Context Provider Stack (in `providers.tsx`)

```
ThemeRegistry
  ThemeProvider (MUI)
    FeatureFlagProvider        ← Firebase Remote Config
      StreakProvider           ← useStreak → localStorage
        LettersProgressProvider
          NumbersProgressProvider
            AnimalsProgressProvider
              GamesProgressProvider
                WordCollectionProvider
                  StickerToastProvider
                    StickerProvider   ← useStickers + unlock detector
                      {children}
```

### Firebase Existing Integration

- `lib/firebaseApp.ts` — singleton `getFirebaseApp()`, lazy-initialized, prevents duplicate-app errors
- `lib/firebase.ts` — Realtime Database access: `submitScore()`, `getTopScore()` (leaderboard)
- `lib/featureFlags/providers/firebaseRemoteConfig.ts` — Remote Config feature flag provider
- Firebase project: `lepdy-c29da`, config is public (client keys only — correct for web)

---

## v1.5 Integration Architecture

### Design Principles

1. **Zero behavior change when not logged in.** Every hook continues reading/writing localStorage exactly as today. Auth is opt-in.
2. **localStorage is always the source of truth at runtime.** Cloud is a sync target, not a live data source. No app reads come from Firebase at runtime.
3. **`AuthContext` wraps the existing provider stack.** Auth resolves first; then the existing providers mount as they do today. No changes to the existing provider tree.
4. **Sync layer is a side-effect service.** The cloud sync worker listens to auth state and data changes, then writes to Firebase. It does not sit in the render path.

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      AuthProvider (NEW)                       │   │
│  │  user: FirebaseUser | null   loading: boolean                 │   │
│  │  signInWithGoogle()  signOut()  onAuthStateChanged listener   │   │
│  │                                                               │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │          Existing Provider Stack (UNCHANGED)          │    │   │
│  │  │  FeatureFlagProvider → StreakProvider → ...           │    │   │
│  │  │                                                       │    │   │
│  │  │  ┌───────────────────────────────────────────────┐   │    │   │
│  │  │  │        CloudSyncProvider (NEW)                 │   │    │   │
│  │  │  │  Reads: useAuthContext + all progress contexts │   │    │   │
│  │  │  │  Writes: Firestore/RTDB on data change + login │   │    │   │
│  │  │  │  Merges: localStorage ← cloud on first login   │   │    │   │
│  │  │  │  Status: syncStatus ('idle'|'syncing'|'error') │   │    │   │
│  │  │  └───────────────────────────────────────────────┘   │    │   │
│  │  │                                                       │    │   │
│  │  │     {children}                                        │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                      localStorage (always)                           │
│  lepdy_streak_data | lepdy_sticker_data | lepdy_letters_progress ... │
├─────────────────────────────────────────────────────────────────────┤
│                    Firebase (when logged in)                          │
│  /users/{uid}/progress/{key}    — cloud mirror of localStorage data  │
│  /leaderboard/{game}            — existing (unchanged)               │
└─────────────────────────────────────────────────────────────────────┘
```

### New Files

```
lib/
├── auth.ts                         NEW  Firebase Auth lazy init, GoogleAuthProvider
├── firebaseSync.ts                 NEW  Read/write user progress to RTDB path /users/{uid}/progress/

contexts/
├── AuthContext.tsx                 NEW  AuthProvider, useAuthContext hook

components/
├── GoogleSignInButton.tsx          NEW  "Sign in with Google" button, handles popup + loading state
├── UserAccountChip.tsx             NEW  Avatar + display name + sign-out button for settings drawer

hooks/
├── useCloudSync.ts                 NEW  Orchestrates sync: merge on login, write on change, read on login
```

### Modified Files

```
app/providers.tsx                   MODIFIED  Wrap existing provider stack with AuthProvider
components/SettingsDrawer.tsx       MODIFIED  Add GoogleSignInButton / UserAccountChip section
next.config.ts                      MODIFIED  Add rewrite proxy for Firebase Auth redirect flow
```

---

## Architectural Patterns

### Pattern 1: Auth Context — Outermost Provider

**What:** `AuthProvider` wraps the entire provider stack. All other contexts can read `useAuthContext()` as needed.

**Why outermost:** Firebase Auth state resolves asynchronously. If `AuthProvider` is inside other providers, those providers initialize with `user = null`, then the user resolves and triggers full tree re-renders. Outermost placement ensures the auth state is known before any progress contexts mount.

**Trade-off:** Auth loading (`user === undefined` → loading, `user === null` → signed out, `user instanceof User` → signed in) must be handled carefully to avoid brief "not logged in" flashes that trigger incorrect merges.

**Implementation contract:**

```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;              // true while onAuthStateChanged has not fired yet
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// lib/auth.ts — lazy singleton
async function getFirebaseAuth(): Promise<Auth>
async function getGoogleProvider(): Promise<GoogleAuthProvider>
export async function signInWithGoogle(): Promise<void>
export async function signOut(): Promise<void>
```

### Pattern 2: localStorage-First, Cloud-Mirror Strategy

**What:** Every hook reads and writes localStorage exactly as today. The sync layer observes the React state exposed by contexts and mirrors it to Firebase. No hook ever reads from Firebase at runtime.

**Why:** Eliminates all async data dependencies in the render path. The app renders instantly from localStorage, then sync happens in the background. Network failures do not affect the user experience.

**Data flow:**

```
User action (tap letter)
    ↓
recordItemHeard('aleph')
    ↓
setProgressData(newData)  ←→  localStorage.setItem(key, JSON.stringify(newData))
    ↓
React state update
    ↓ (CloudSyncProvider observes via context)
useCloudSync.ts detects change
    ↓
Firebase RTDB write: set(ref(db, `/users/${uid}/progress/${key}`), newData)
    ↓ (fire and forget — failures are logged, not thrown)
```

**On login (first time or new device):**

```
onAuthStateChanged fires with user
    ↓
useCloudSync: read all keys from /users/{uid}/progress/
    ↓
For each key:
  cloudData = await get(ref(db, `/users/${uid}/progress/${key}`))
  localData = JSON.parse(localStorage.getItem(key))
  merged = mergeProgressData(key, localData, cloudData)
    ↓
localStorage.setItem(key, JSON.stringify(merged))
    ↓
Each context hook's next storage read gets the merged data
    ↓
(contexts do not need to be told about the merge — they use localStorage, which now has merged data)
```

**Limitation:** Contexts have already loaded their initial data on mount. After merge, contexts must re-read localStorage or the merged data only appears on next page load.

**Solution:** `useCloudSync` calls a `reloadAllContexts()` function after merge completes. This is implemented as a `reloadKey` counter in each context, or by exposing a `reload()` function from each context. The simpler alternative: reload the page after first-login merge (acceptable UX, user just signed in).

**Recommended approach:** On first login (no prior cloud data), just write local → cloud. On returning login (cloud data exists), perform merge, then call `window.location.reload()`. This is the simplest correct implementation. Page reload is a one-time event per device per login.

### Pattern 3: Merge Strategy for First Login

**What:** When a user logs in for the first time on a device that has localStorage data, merge local + cloud using union (additive) semantics.

**Rules per data type:**

| Data Type | Merge Rule | Rationale |
|-----------|-----------|-----------|
| `heardItemIds[]` | Union of both arrays (deduplicated) | A heard item is heard on any device |
| `totalClicks` | Sum of both | Total practice count |
| `earnedStickerIds[]` | Union (deduplicated) | An earned sticker stays earned |
| `collectedWords[]` | Union by wordId; on conflict keep higher `timesBuilt` + earliest `firstBuiltDate` | Preserve full history |
| `StreakData` | Keep higher `currentStreak`; keep higher `longestStreak`; take most recent `lastActivityDate` | Optimistic: reward the longer streak |
| `completedLevels[]` | Union | A completed level stays completed |
| `PiecePuzzleProgress` | Per piece: keep higher `tier` | Reward the more advanced device |
| Chess daily flags | Keep `true` over `false` per date key | A completed daily stays completed |
| `lepdy_chess_piece_theme` | Keep cloud (user's chosen preference) | Last-write-wins for preference |

**Implementation:** `lib/firebaseSync.ts` exports a `mergeProgressData(key, local, cloud)` pure function. This is independently testable.

### Pattern 4: Firebase Auth with signInWithPopup (Vercel-hosted)

**What:** Use `signInWithPopup` for Google sign-in. Add a Next.js rewrite proxy so the auth popup origin matches the app domain, eliminating cross-domain storage access failures on mobile browsers (Chrome M115+, Firefox 109+, Safari 16.1+).

**Why not signInWithRedirect:** Redirect causes a full page reload, disrupting the React state and localStorage initialization sequence. Popup is cleaner for this app's UX.

**Required next.config.ts change:**

```typescript
// next.config.ts — rewrite so Firebase auth popup appears same-origin
async rewrites() {
  return [
    {
      source: '/__/auth/:path*',
      destination: `https://lepdy-c29da.firebaseapp.com/__/auth/:path*`,
    },
  ];
}
```

**Required firebaseApp.ts change:** Update `authDomain` from `'lepdy-c29da.firebaseapp.com'` to `'lepdy.com'` (custom domain). This tells the Firebase SDK to use the proxied auth endpoint.

**Required Firebase console change:** Add `lepdy.com` to Authorized Domains in Firebase Auth settings.

**Confidence:** MEDIUM — proxy approach is well-documented for Vercel-hosted apps. The `signInWithPopup` + rewrite pattern resolves cross-origin storage access errors on modern browsers.

### Pattern 5: Firebase Realtime Database Data Path Structure

**What:** All user progress is stored under `/users/{uid}/progress/{storageKey}`.

**Why RTDB over Firestore:** The app already uses RTDB (leaderboard). Adding Firestore adds a second Firebase product, second SDK bundle chunk, and second billing dimension. RTDB is sufficient for key-value progress data.

**Security rules:**

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "leaderboard": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

**Data size estimate:** All progress data combined is well under 50KB per user — trivially within RTDB free tier (1GB stored, 10GB/month transfer).

---

## Component Responsibilities

### New Components

| Component | Responsibility | Location |
|-----------|---------------|----------|
| `AuthProvider` | Firebase Auth state, `onAuthStateChanged` listener, `signInWithGoogle`, `signOut` | `contexts/AuthContext.tsx` |
| `useAuthContext` | Hook to consume auth state in any client component | `contexts/AuthContext.tsx` |
| `useCloudSync` | Reads auth + all progress contexts; writes to RTDB on change; merges on login | `hooks/useCloudSync.ts` |
| `CloudSyncProvider` | Mounts `useCloudSync` inside the provider tree; exposes `syncStatus` | `contexts/CloudSyncContext.tsx` |
| `GoogleSignInButton` | "Sign in with Google" button with loading/error states, calls `signInWithGoogle()` | `components/GoogleSignInButton.tsx` |
| `UserAccountChip` | Shows avatar, display name, "Sign out" when logged in | `components/UserAccountChip.tsx` |
| `lib/auth.ts` | Lazy Firebase Auth singleton, `signInWithGoogle()`, `signOut()` pure async functions | `lib/auth.ts` |
| `lib/firebaseSync.ts` | RTDB read/write for progress data; `mergeProgressData()` pure merge function | `lib/firebaseSync.ts` |

### Modified Components

| Component | What Changes | What Stays the Same |
|-----------|-------------|---------------------|
| `app/providers.tsx` | Add `AuthProvider` outermost; add `CloudSyncProvider` inside existing stack | All existing providers and their order unchanged |
| `components/SettingsDrawer.tsx` | Add login/account section (Google sign-in button or user chip) | Language switching, streak display unchanged |
| `next.config.ts` | Add `/__/auth/:path*` rewrite | All existing config unchanged |
| `lib/firebaseApp.ts` | Change `authDomain` to `'lepdy.com'` | All other config unchanged |

---

## Data Flow

### First Load (Not Logged In)

```
App mounts
  → AuthProvider: onAuthStateChanged fires → user = null, loading = false
  → All existing context providers load from localStorage (unchanged behavior)
  → CloudSyncProvider: user = null → sync idle, no Firebase reads
  → User sees app in <200ms, all data from localStorage
```

### First Load (Logged In, Returning User)

```
App mounts
  → AuthProvider: onAuthStateChanged fires → user = FirebaseUser, loading = false
  → All existing context providers load from localStorage
  → CloudSyncProvider: user !== null → triggers cloud sync check
  → useCloudSync: reads /users/{uid}/progress/* from RTDB
  → If cloud has newer/more data: merge → write merged back to localStorage
  → If merge needed: page.reload() (one-time per device per new-login event)
  → If no merge needed: sync writes local → cloud silently
```

### Sign In Flow

```
User opens SettingsDrawer
  → Sees GoogleSignInButton
  → Taps "Sign in with Google"
  → signInWithGoogle() → signInWithPopup(auth, googleProvider)
  → Google OAuth popup appears (proxied via /__/auth/* rewrite)
  → User approves
  → popup closes → onAuthStateChanged fires in AuthProvider
  → AuthContext: user = FirebaseUser
  → CloudSyncProvider detects auth change
  → useCloudSync: read cloud data, merge with local, write merged to localStorage
  → page.reload() if merge changed any data
  → SettingsDrawer now shows UserAccountChip (avatar + name + sign out)
```

### Ongoing Sync (Logged In)

```
User taps a letter (triggers recordItemHeard)
  → useLettersProgress: state update → localStorage write
  → CloudSyncProvider (via useEffect watching letters context state)
  → Debounced 2s write: set(ref(db, `/users/${uid}/progress/lepdy_letters_progress`), data)
  → Fire and forget — failure logged, not thrown, user not notified
```

### Sign Out Flow

```
User taps "Sign out" in SettingsDrawer
  → signOut() called
  → onAuthStateChanged fires → user = null
  → CloudSyncProvider: sync idle
  → App continues with localStorage data (unchanged)
```

---

## Recommended Project Structure (New Files Only)

```
lib/
├── auth.ts                  Firebase Auth lazy init, GoogleAuthProvider, signIn/signOut
├── firebaseSync.ts          RTDB progress read/write, mergeProgressData() per-key logic

contexts/
├── AuthContext.tsx           AuthProvider + useAuthContext hook
├── CloudSyncContext.tsx      CloudSyncProvider + useSyncStatus hook

components/
├── GoogleSignInButton.tsx    MUI Button with Google icon, loading state
├── UserAccountChip.tsx       Avatar + name + sign-out; shown in SettingsDrawer when logged in

hooks/
├── useCloudSync.ts           Core sync orchestration: merge on login, write on change
```

### Structure Rationale

- **`lib/auth.ts` separate from `lib/firebaseApp.ts`:** Auth and RTDB are distinct Firebase services. Keeps `firebaseApp.ts` unchanged (avoids breaking leaderboard/Remote Config).
- **`lib/firebaseSync.ts` separate from `lib/firebase.ts`:** The existing `lib/firebase.ts` handles leaderboard only. Sync is a new, unrelated concern. Keeps the leaderboard file stable.
- **`useCloudSync.ts` as a hook, not inlined in `CloudSyncContext.tsx`:** Testable in isolation. The hook contains all sync logic; the context provider just mounts it and exposes status.
- **`CloudSyncContext.tsx` inside the existing provider stack:** Must be inside all progress providers to read their context values.

---

## Build Order (Phase Dependencies)

Dependencies flow bottom-up. Build in this order to avoid blocked work.

```
Phase 1: Firebase Auth foundation (no UI yet)
  lib/auth.ts                     — lazy Auth init, signIn/signOut functions
  contexts/AuthContext.tsx         — AuthProvider, useAuthContext
  app/providers.tsx               — wrap with AuthProvider (outermost)
  next.config.ts                  — add /__/auth/* rewrite
  lib/firebaseApp.ts              — change authDomain to lepdy.com
  Firebase console                — add lepdy.com to Authorized Domains
  [Enables: auth state available everywhere; no user-visible change]
  [Risk: authDomain change must be tested on mobile before continuing]

Phase 2: Sign-in UI in SettingsDrawer
  components/GoogleSignInButton.tsx
  components/UserAccountChip.tsx
  components/SettingsDrawer.tsx    — add sign-in section
  i18n: add auth translation keys (he/en/ru)
  [Depends on: Phase 1 (AuthContext)]
  [Enables: users can actually sign in; cloud sync not yet wired]

Phase 3: Cloud sync write path (local → cloud)
  lib/firebaseSync.ts             — writeProgressToCloud() per key
  hooks/useCloudSync.ts           — watch all contexts, debounced write on change
  contexts/CloudSyncContext.tsx   — mount useCloudSync, expose syncStatus
  app/providers.tsx               — add CloudSyncProvider inside existing stack
  Firebase RTDB security rules    — add /users/$uid rules
  [Depends on: Phase 1 (AuthContext), Phase 2 (user can sign in to test)]
  [Enables: progress syncs to cloud; no merge yet]

Phase 4: Cloud sync read + merge path (cloud → local, first login)
  lib/firebaseSync.ts             — readProgressFromCloud(), mergeProgressData() per key
  hooks/useCloudSync.ts           — add merge-on-login logic
  [Depends on: Phase 3 (write path must exist before merge is meaningful)]
  [Enables: multi-device sync complete; progress merges on login]
```

---

## Integration Points

### Placement of CloudSyncProvider in Provider Stack

`CloudSyncProvider` must be **inside all progress providers** (to read their state) and **inside AuthProvider** (to read auth state). It must be **outside `{children}`** (to mount independently of page content).

```typescript
// app/providers.tsx — final nesting order
<AuthProvider>                          // Phase 1
  <FeatureFlagProvider>
    <StreakProvider>
      <LettersProgressProvider>
        <NumbersProgressProvider>
          <AnimalsProgressProvider>
            <GamesProgressProvider>
              <WordCollectionProvider>
                <StickerToastProvider>
                  <StickerProvider>
                    <CloudSyncProvider>   // Phase 3 — inside all progress providers
                      {children}
                      <InstallPrompt />
                    </CloudSyncProvider>
                  </StickerProvider>
                </StickerToastProvider>
              </WordCollectionProvider>
            </GamesProgressProvider>
          </AnimalsProgressProvider>
        </NumbersProgressProvider>
      </LettersProgressProvider>
    </StreakProvider>
  </FeatureFlagProvider>
</AuthProvider>
```

### Hooks That Do NOT Need Modification

All existing progress hooks (`useCategoryProgress`, `useStreak`, `useStickers`, `useWordCollectionProgress`, `useChessProgress`, `usePuzzleProgress`, `useDailyPuzzle`, `useChessPieceTheme`) are **unchanged**. They continue to read/write localStorage exactly as today.

### What `useCloudSync` Reads from Contexts

```typescript
// hooks/useCloudSync.ts — context consumption
const { user } = useAuthContext();                           // NEW
const { streakData } = useStreakContext();
const { stickerData } = useStickerContext();
const { collectedWords, totalWordsBuilt } = useWordCollectionContext();
// letters/numbers/animals: need to expose raw progressData from their contexts
// — or useCloudSync reads localStorage directly (simpler, equivalent)
```

**Recommendation:** For progress contexts that don't expose raw data (letters, numbers, animals, games), `useCloudSync` reads localStorage directly using the known storage keys. This avoids modifying those contexts and is equivalent — they are always in sync with localStorage.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Reading Progress Data from Firebase at Runtime

**What people do:** On app load, check if user is logged in and fetch progress from Firebase before rendering.
**Why it's wrong:** Adds a Firebase round-trip (100–500ms) to every page load. The app currently renders in <200ms from localStorage. Any Firebase read blocks this.
**Do this instead:** Always render from localStorage. Firebase is a write-only sync target at runtime. Reads from Firebase happen only once: during first-login merge.

### Anti-Pattern 2: Putting Auth State in Every Progress Hook

**What people do:** Pass `userId` into `useStreak`, `useCategoryProgress`, etc. and make them conditionally read from Firebase.
**Why it's wrong:** Multiplies sync complexity by the number of hooks (currently 8+). Each hook needs its own Firebase read/write/merge logic. A single centralized sync layer is far simpler and less error-prone.
**Do this instead:** All sync lives in `useCloudSync.ts`. Progress hooks are unmodified.

### Anti-Pattern 3: Using Firestore Instead of RTDB

**What people do:** Choose Firestore because it has more features (queries, subcollections, offline persistence).
**Why it's wrong for this project:** The app already uses RTDB (leaderboard, same Firebase project). Firestore would add a second Firebase service, a larger SDK bundle, and Firestore's offline persistence is designed for structured queries — overkill for flat key-value progress data. localStorage already handles offline persistence.
**Do this instead:** Use RTDB with path `/users/{uid}/progress/{storageKey}`. Simple, already initialized, no bundle cost.

### Anti-Pattern 4: Merge on Every App Load

**What people do:** Every time the app loads for a logged-in user, read cloud data and merge with local.
**Why it's wrong:** Adds a Firebase read to every cold start. Defeats the purpose of localStorage-first. Creates race conditions if the user makes a quick action before the read completes.
**Do this instead:** Merge only on `onAuthStateChanged` firing with a non-null user AND only when the previous auth state was null (i.e., just logged in, not just returning from a page refresh).

### Anti-Pattern 5: Syncing sessionStorage Keys

**What people do:** Include `lepdy_chess_session` (in-progress puzzle session) in the cloud sync set.
**Why it's wrong:** Session state is ephemeral — it represents the current in-progress game. Syncing it across devices creates confusing mid-session state on a different device. It also changes frequently (every puzzle answer), making it expensive to sync.
**Do this instead:** Only sync durable progress keys. The session key (`lepdy_chess_session`) is explicitly excluded from sync.

### Anti-Pattern 6: Not Handling the Auth Loading State

**What people do:** Treat `user = null` as "not logged in" from the first render.
**Why it's wrong:** `onAuthStateChanged` is async. On first render, auth state is unknown (loading). If merge logic runs on `null` user, it may incorrectly treat a returning user as unauthenticated and skip merge.
**Do this instead:** Three-state auth: `loading = true` (initial), `user = null` (signed out), `user = FirebaseUser` (signed in). `useCloudSync` does nothing while `loading = true`.

---

## Scaling Considerations

| Concern | Current scale | Future |
|---------|--------------|--------|
| RTDB data per user | ~50KB total progress data | Grows linearly with new categories; negligible at RTDB pricing |
| Sync write frequency | Max 1 write per context change, debounced 2s | At 10 active users: trivial; at 10K: still trivial (user-specific paths) |
| Auth overhead | `onAuthStateChanged` fires once per app load | Negligible; client-side only |
| Merge complexity | 13 localStorage keys, simple union logic | Grows with new keys — `mergeProgressData` handles one key at a time, extend by adding a case |
| RTDB security | Per-uid read/write rules | Fine for current and foreseeable scale; no cross-user data access |

---

## What Must NOT Change

| File | Reason to Preserve |
|------|-------------------|
| All existing progress hooks | Zero modifications — this is the key architectural constraint |
| All existing progress contexts | Zero modifications — contexts are unchanged |
| `lib/firebase.ts` (leaderboard) | Leaderboard code unchanged; new sync uses separate `lib/firebaseSync.ts` |
| All localStorage storage keys | Must be preserved exactly — cloud sync mirrors them by key name |
| `lib/featureFlags/` | Remote Config unchanged |

---

## Sources

- Direct codebase reading: all hooks in `hooks/`, all contexts in `contexts/`, `app/providers.tsx`, `lib/firebaseApp.ts`, `lib/firebase.ts`, `components/SettingsDrawer.tsx` (HIGH confidence — first-hand)
- Firebase Auth signInWithRedirect best practices: [duncanleung.com proxy guide](https://duncanleung.com/missing-initial-state-firebase-auth-proxy-nextjs-vercel/) (MEDIUM confidence — community, verified against official docs)
- Firebase Auth Vercel hosting issues: [GitHub firebase-js-sdk discussion](https://github.com/firebase/firebase-js-sdk/discussions/6359) (MEDIUM confidence — community, known issue)
- Firebase RTDB security rules: [Firebase documentation](https://firebase.google.com/docs/database/security) (HIGH confidence — official)
- Firebase Auth Google sign-in web: [Firebase documentation](https://firebase.google.com/docs/auth/web/google-signin) (HIGH confidence — official)
- React Context provider pattern for Firebase Auth: [LogRocket blog](https://blog.logrocket.com/implementing-authentication-in-next-js-with-firebase/) (MEDIUM confidence — community, consistent with official docs)
- PROJECT.md v1.5 milestone description (HIGH confidence — first-hand)

---

*Architecture research for: v1.5 Cloud Sync — Firebase Auth + user progress sync*
*Researched: 2026-03-23*
