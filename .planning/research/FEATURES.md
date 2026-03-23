# Feature Research

**Domain:** Optional auth + cloud sync + offline-first — kids learning web app (v1.5 milestone)
**Researched:** 2026-03-23
**Confidence:** HIGH (Firebase official docs verified; COPPA/GDPR compliance cross-referenced from current legal sources; UX patterns sourced from Duolingo, Khan Academy Kids, and local-first architecture references)

---

## Context: What Already Exists (Do Not Re-invent)

The following features ship in localStorage today and must not be broken:

- Category progress for 6 categories (letters, numbers, colors, shapes, animals, food) — `useCategoryProgress`
- Chess progress: levels, per-piece mastery tiers, session data — `useChessProgress`
- Sticker collection — `useStickers`
- Word collection — `useWordCollectionProgress`
- Streak data — `useStreak`
- Chess piece theme preference — `useChessPieceTheme`
- Daily puzzle completion flag — `useDailyPuzzle`
- Games progress — `useGamesProgress`

All stored in browser localStorage. All are read on mount, written on user interaction. Zero server dependency today. This milestone adds an **optional** cloud layer on top — logged-out behavior must remain identical to today.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that Duolingo, Khan Academy Kids, and any app that lets users "save progress" have established as baseline. Missing these makes the experience feel broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Google sign-in button in settings | Parents expect a recognizable, trusted identity provider — not a username/password form. Duolingo, Khan Academy Kids, and Prodigy all use social sign-in. No Google button = feels half-built | LOW | Firebase Auth `signInWithPopup(GoogleAuthProvider)` with redirect fallback for mobile. Single button in existing settings sidebar |
| Sign-out action | Any app that lets you sign in must let you sign out — parents share devices and expect to sign out after using their account | LOW | Firebase `signOut()` + clear user state. Settings sidebar already exists; sign-out replaces sign-in button when authenticated |
| Progress persists across devices after sign-in | The entire reason to log in — a parent signs in on iPad, expects to see same progress on phone. Without this the feature has no value proposition | HIGH | Firestore document per user, all progress keys stored. localStorage as write-through cache |
| Zero behavior change when logged out | Duolingo lets you use the full app without an account. Users who skip login must get identical experience. No nags, no paywalls, no feature lockouts | LOW | All reads/writes stay localStorage-first. Auth layer is additive, not substitutive. Feature flag controls login UI visibility as rollout safety |
| First-login data merge (localStorage → cloud) | Users arrive with existing progress from anonymous use. Discarding it on first login is the single most common complaint in apps adding sync. "Why did I lose my progress?" kills trust | HIGH | Union merge strategy: take the max of each progress value (e.g., higher heardCount, larger heardItemIds set, true wins over false for boolean unlocks). Never discard cloud data if cloud user already exists on another device |
| Offline access to all features | Kids learn on tablets in cars, on planes, in areas with poor connectivity. Core game must work offline — this is non-negotiable for a kids app | MEDIUM | localStorage remains source-of-truth for reads. Firestore writes queue when offline (built-in SDK behavior). No feature should be blocked by network absence |
| Visual sign-in state indicator | Users need to know if they are logged in. A subtle avatar/name or a checkmark icon prevents confusion — especially relevant for parents managing multiple child profiles in future | LOW | Show Google profile photo thumbnail or first-letter avatar in settings sidebar when authenticated. `onAuthStateChanged` drives this |

### Differentiators (Competitive Advantage)

Features that go beyond baseline sync behavior and add meaningful value for Lepdy's family audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Conflict-free merge that always keeps more progress | Many apps pick "cloud wins" on first login, discarding local progress. Lepdy's union-merge (local OR cloud, pick higher) means no child ever loses earned progress — a parent-trust differentiator | MEDIUM | Per-field max strategy: `heardItemIds` = union of sets; `totalClicks` = max(); boolean unlocks = OR; streak data = take longer streak. Document this clearly in the UI if needed ("Your progress was saved to your account") |
| Sync status indicator (subtle) | A small "syncing..." or "saved" indicator reduces parent anxiety about data loss — similar to how Google Docs shows "All changes saved" | LOW | Minimal: a subtle icon state in settings sidebar. Not a persistent banner. Fires for 2s after write, then disappears |
| Graceful degradation on sync failure | If Firestore write fails (network error, quota), app continues working from localStorage without showing an error to the child. Parents may see a retry indicator in settings | LOW | `onSnapshot` error handling that falls back silently; log to analytics but don't surface to child UI |
| Device-agnostic session continuity | A child starts a puzzle session on the family iPad; picks up on the school tablet. Same progress visible immediately. Sessions themselves don't need real-time sync (they complete atomically) | MEDIUM | Progress sync on login + on session complete (not real-time during a session — too complex and not needed) |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Mandatory login before using app | "Ensures all progress is saved" | COPPA/GDPR-K requires parental consent for under-13 data collection. Mandatory login = mandatory data collection = legal exposure. Also: friction at first visit causes high abandonment in kids apps (Duolingo removed mandatory login from onboarding for exactly this reason) | Optional login only. localStorage for anonymous users. Login prompt in settings sidebar, never in app flow |
| Child account creation with email/password | "More control than Google" | Email accounts for under-13 users require parental consent verification — COPPA compliance burden is significant. Firebase doesn't handle COPPA consent flows; you'd build it yourself | Google sign-in only (account is the parent's Google account — parent controls). If the parent has a Google account, COPPA consent burden shifts to Google's infrastructure |
| Per-child profiles under one parent account | "Multiple kids on one device" | Multi-profile management is a fundamentally different product. Requires profile switcher, per-profile data isolation, profile CRUD UI. Lepdy is a single-player learning app; multi-profile is a v3+ feature if it ever makes sense | Single account = single progress set. Document this as a known limitation. If requested by users, address in a future milestone |
| Real-time sync during active session | "Progress saved even if browser crashes mid-session" | Sessions are 10 puzzles. Mid-session writes create race conditions (two devices with same session open), double-count risk, and Firestore write cost for ephemeral data. Sessions complete atomically — that's the right sync point | Write to Firestore on session complete, not on each puzzle. localStorage handles mid-session persistence as today |
| Offline queue with manual retry UI | "Show user what's pending" | A visible "you have 3 unsynced changes" UI creates anxiety, not confidence, for children. Firestore SDK handles offline queuing automatically and invisibly | Trust Firestore's built-in offline queue. Surface sync status only in settings, not in game flow |
| Cloud backup of settings (locale, theme) | "Sync everything" | Locale is locale-specific to the device/browser (the parent configures it per device). Syncing it would override the device's language setting on re-login. Theme preference is a small UX win but creates override complexity | Sync progress data only (what the child has learned). Leave device-specific preferences (locale, piece theme) in localStorage only |
| Anonymous-to-account upgrade via Firebase anonymous auth | "Start anonymous, upgrade to real account later" | Firebase anonymous auth creates a UID that needs manual upgrade + data migration when linking to Google. Adds code complexity and an extra auth state to maintain. Lepdy already has a clean "no account" path via localStorage | Skip anonymous auth entirely. No-account path = localStorage. Account path = Google sign-in. No upgrade path needed — first login triggers the merge from localStorage |

---

## Feature Dependencies

```
[Google Sign-in UI in Settings]
    └──requires──> Firebase Auth SDK (already in project via firebaseApp.ts)
    └──requires──> AuthContext (new) — wraps onAuthStateChanged
    └──enhances──> Sync Status Indicator (indicator needs auth state)

[AuthContext]
    └──requires──> Firebase Auth SDK
    └──enables──> All sync features (no sync without auth state)
    └──enables──> User UID for Firestore document key

[First-Login Merge]
    └──requires──> AuthContext (to detect first sign-in)
    └──requires──> All localStorage data readable in one pass
    └──requires──> Firestore document schema defined
    └──conflicts──> Real-time sync during merge (merge must complete before writes begin)

[Offline-First Sync Layer]
    └──requires──> AuthContext (user UID)
    └──requires──> Firestore document schema
    └──requires──> First-Login Merge to have run at least once
    └──enhances──> All progress hooks (they write to localStorage + Firestore when authenticated)

[Firestore Document Schema]
    └──required by──> First-Login Merge
    └──required by──> Offline-First Sync Layer
    └──informs──> All progress hook write contracts

[Sign-out]
    └──requires──> AuthContext
    └──requires──> Decision: clear localStorage on sign-out? (Recommendation: NO — keep local cache)
```

### Dependency Notes

- **AuthContext must come first**: Every other sync feature depends on knowing who the user is. It wraps `onAuthStateChanged` and provides `user`, `isLoading`, `signIn()`, `signOut()`.
- **Firestore schema must be defined before any sync code**: All progress hooks write to a document shape. Defining shape upfront prevents migration pain. Recommended: single doc per user at `users/{uid}/progress` with all progress keys flat.
- **First-login merge is a one-time operation, not ongoing**: Detect "first login ever" with a Firestore doc existence check. If doc does not exist: merge localStorage into Firestore. If doc exists: merge Firestore into localStorage (cloud wins for existing data, union for new items). After merge, all writes go to both localStorage + Firestore.
- **Do not sync locale or piece theme**: Locale is per-device (RTL/LTR depends on device language settings). Piece theme is a small preference that would confusingly override per-device choice. Keep these localStorage-only.
- **Firestore offline support is built in**: The Firestore SDK caches writes locally and flushes when online. This is not something to build — it is something to configure (`enablePersistence()` or `enableMultiTabIndexedDbPersistence()` for web). The app's offline-first behavior comes from relying on this SDK capability.

---

## MVP Definition

### Launch With (v1.5 core)

- [ ] **AuthContext with Google sign-in** — `onAuthStateChanged`, `signInWithPopup`, `signOut`. Wraps Firebase Auth. Available app-wide. (LOW complexity — Auth SDK already in project)
- [ ] **Sign-in / sign-out UI in settings sidebar** — Google sign-in button when logged out; avatar + name + sign-out when logged in. No other UI changes. (LOW complexity)
- [ ] **Firestore document schema + security rules** — Define the `users/{uid}/progress` document shape. Write security rules: user can only read/write their own document. (MEDIUM complexity — schema design work, not coding complexity)
- [ ] **First-login merge (localStorage → Firestore)** — On first Google sign-in, read all localStorage keys, merge with any existing Firestore data (union strategy), write merged result to Firestore + update localStorage. (HIGH complexity — must cover all 8 data domains)
- [ ] **Write-through sync on authenticated writes** — All progress hooks (`useCategoryProgress`, `useChessProgress`, `useStickers`, `useStreak`, `useWordCollectionProgress`, `useGamesProgress`) write to localStorage first, then to Firestore when authenticated. (HIGH complexity — 6 hooks to extend, schema must be stable first)
- [ ] **Read Firestore on login** — On successful login (existing user, not first login), read Firestore document and update localStorage cache. Ensures device picks up cross-device changes. (MEDIUM complexity)
- [ ] **Feature flag gate** — Auth UI behind `cloudSyncEnabled` Firebase Remote Config flag. Rollout safely without code deploy. (LOW complexity — existing feature flag infrastructure)

### Add After Validation (v1.5.x)

- [ ] **Sync status indicator** — Subtle "saved" indicator in settings after a Firestore write. Low priority until core sync is confirmed reliable. (LOW complexity)
- [ ] **Offline detection + user feedback** — If the device has been offline for a session, show a subtle "offline — progress saved locally" note in settings. Not in game flow. (LOW complexity)
- [ ] **Sync on app resume** — When the app regains focus (visibility API) and user is authenticated, trigger a Firestore read to pick up any changes from other devices. (LOW complexity — `document.addEventListener('visibilitychange')`)

### Future Consideration (v2+)

- [ ] **Per-child profiles** — Multiple progress sets under one parent account. Requires profile management UI — significant product scope. Only if user research surfaces this as a pain point. (HIGH complexity)
- [ ] **Parent progress dashboard** — Web view of child's progress across all categories. Requires separate auth flow or parent-specific view. (HIGH complexity)
- [ ] **Email/password accounts** — Non-Google sign-in path. Low demand for a kids app where parents have Google accounts; COPPA compliance is more complex. (MEDIUM complexity but high legal overhead)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| AuthContext (Google sign-in/out) | HIGH | LOW | P1 |
| Sign-in UI in settings | HIGH | LOW | P1 |
| Firestore schema + security rules | HIGH | MEDIUM | P1 |
| First-login merge | HIGH | HIGH | P1 |
| Write-through sync (all 6 hooks) | HIGH | HIGH | P1 |
| Read Firestore on login | HIGH | MEDIUM | P1 |
| Feature flag gate | MEDIUM | LOW | P1 |
| Sync status indicator | LOW | LOW | P2 |
| Offline detection note | LOW | LOW | P2 |
| Sync on app resume | MEDIUM | LOW | P2 |
| Per-child profiles | HIGH | HIGH | P3 |
| Parent progress dashboard | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Required to deliver v1.5 "optional cloud sync" goal
- P2: Meaningful polish once core sync is confirmed working
- P3: Future consideration, defer to v2+

---

## Compliance Notes (Non-Negotiable)

These are not features — they are constraints that affect how features must be built.

**COPPA (US, updated April 2025, compliance deadline April 2026):**
- Lepdy targets ages 5-9. This is a "directed at children" app under COPPA.
- COPPA requires verifiable parental consent before collecting personal information from under-13 users.
- Google sign-in collects personal information (Google account email, UID). This requires parental consent.
- **Mitigation**: Frame sign-in as a parent action ("Parent sign-in to save progress"). The Google account is the parent's account. The child does not create an account. The parent's Google account ID is the UID. This is the pattern used by Khan Academy Kids and Prodigy.
- Must have a privacy policy disclosing Firebase/Firestore data collection. Lepdy.com needs to document what is stored (progress data, Google UID) and why.
- Data retention: must delete user data on request. Firebase console deletion + Firestore document delete covers this.

**GDPR-K (EU):**
- Consent age varies by country (13-16). Israel (Lepdy's primary market) follows GDPR-style rules.
- Same mitigation as COPPA: parent Google account, not child account.
- Users must be able to delete their data. Firebase Auth account delete + Firestore document delete.

**Practical implication for roadmap**: The sign-in UI must be labeled as a parent action, not a child action. "Parent: save progress to your Google account" — not "Sign in to continue." This is a copy/UX decision, not an architecture one, but it must be in scope for the sign-in UI phase.

---

## Competitor Feature Analysis

| Feature | Duolingo | Khan Academy Kids | Prodigy | Lepdy v1.5 Approach |
|---------|----------|-------------------|---------|---------------------|
| Login requirement | Optional (full app without account) | Optional (full app without account) | Optional | Optional — zero behavior change when logged out |
| Identity provider | Email, Apple, Google | Google, Apple, email | Google, email | Google only (simplest, covers target audience) |
| First-login data handling | Progress tied to account from start (no anonymous→account migration needed) | Account required for teacher/parent dashboard; kids play anonymously | Anonymous play allowed, progress tied to account | Union merge from localStorage on first login |
| Offline behavior | Full offline gameplay, syncs on reconnect | Full offline, no sync needed (no cloud progress) | Offline works for in-session, syncs on reconnect | localStorage as ground truth; Firestore syncs when online |
| Multi-device sync | Yes — Duolingo streak and XP sync across all devices | No — individual device progress only | Yes — progress syncs to server | Yes — the primary value proposition of v1.5 |
| Compliance framing | Parent creates account for under-13 users | Parent/teacher account controls child profile | "For kids" framing, parental consent in TOS | Parent Google account = parent action, documented in privacy policy |

---

## Implementation Guidance for Roadmap

**Auth SDK already in project (zero new dependencies):**
```typescript
// lib/firebaseApp.ts already initializes Firebase app
// Add to lib/auth.ts:
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
const auth = getAuth(getFirebaseApp());
```

**Firestore document shape (flat, one doc per user):**
```typescript
// users/{uid}/progress
interface UserProgress {
  // Category progress
  heardLetters: string[];        // array of item IDs
  heardNumbers: string[];
  heardAnimals: string[];
  heardColors: string[];
  heardShapes: string[];
  heardFood: string[];
  // Chess
  chessProgress: SerializedChessProgress;
  // Stickers
  unlockedStickers: string[];
  // Word collection
  collectedWords: string[];
  // Streak
  streakData: SerializedStreakData;
  // Games
  gamesProgress: SerializedGamesProgress;
  // Metadata
  lastSyncedAt: number;          // timestamp
  mergedFromLocal: boolean;      // true after first-login merge
}
```

**First-login merge strategy (union, never discard):**
```typescript
// On first sign-in (Firestore doc does not exist):
// 1. Read all localStorage keys
// 2. Write to Firestore — creates doc
// mergedFromLocal = true

// On subsequent sign-in (Firestore doc exists):
// 1. Read Firestore doc
// 2. For array fields: union of localStorage + Firestore arrays
// 3. For boolean unlocks: true wins (OR)
// 4. For streak: keep longer streak
// 5. Write merged result to Firestore
// 6. Update localStorage from merged result
```

**Popup vs redirect for mobile (important for tablet-first app):**
- Use `signInWithPopup` as primary path (simplest code).
- On `auth/popup-blocked` error, fall back to `signInWithRedirect`.
- Handle `getRedirectResult()` on page load for redirect flow.
- Mobile Safari (iOS, iPad OS) blocks popups in certain contexts — redirect fallback is required.

**Firestore offline persistence (configure once):**
```typescript
// In lib/firestore.ts (new file):
import { getFirestore, enablePersistence } from 'firebase/firestore';
const db = getFirestore(app);
enablePersistence(db).catch(() => {
  // Persistence failed (private browsing, multiple tabs) — continue without it
  // localStorage still works; only cross-device sync is affected
});
```

---

## Sources

- [Firebase Auth — Authenticate Using Google (JavaScript)](https://firebase.google.com/docs/auth/web/google-signin) — popup vs redirect, auth state persistence
- [Firebase Auth — Auth State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) — default session persistence behavior
- [Firestore — Access Data Offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — offline persistence configuration
- [Firebase Auth — Redirect Best Practices (Safari/Mobile)](https://firebase.google.com/docs/auth/web/redirect-best-practices) — popup blocking on mobile browsers
- [COPPA Compliance 2025 — Promise.legal](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/) — updated COPPA rules effective April 2025
- [Kid-App Compliance COPPA & GDPR-K 2025 — Andromo](https://www.andromo.com/blog/kid-app-coppa-gdpr/) — practical compliance guidance for kids apps
- [Google Cloud COPPA Compliance](https://cloud.google.com/security/compliance/coppa) — Firebase SDK COPPA status
- [Local First with Cloud Sync — Captain Codeman](https://www.captaincodeman.com/local-first-with-cloud-sync-using-firestore-and-svelte-5-runes) — local-first Firestore architecture patterns
- [Firestore Synchronization & Offline Cache — Tiger Abrodi](https://tigerabrodi.blog/cloud-firestore-synchronization-offline-cache) — write-through cache mechanics
- [Firebase vs Firestore for offline-first — Firebase official](https://firebase.google.com/docs/database/rtdb-vs-firestore) — Firestore recommended for new projects; offline persistence built-in
- [Updating Firebase Auth in Next.js — Medium](https://medium.com/@gg.code.latam/updating-firebase-authentication-in-next-js-solving-mobile-authentication-issues-2024-2025-5a01342bcc13) — mobile authentication issues in Next.js + Firebase

---
*Feature research for: Lepdy v1.5 Firebase Auth + Cloud Sync*
*Researched: 2026-03-23*
