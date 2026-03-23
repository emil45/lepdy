# Pitfalls Research

**Domain:** Adding optional Firebase Auth + cloud sync to an existing localStorage-based kids learning app (Next.js SSR, offline-first, union merge on first login)
**Researched:** 2026-03-23
**Confidence:** HIGH (Firebase Auth/Firestore official docs, community issue reports, codebase analysis of 11 localStorage hooks across 14 distinct storage keys)

---

## Critical Pitfalls

### Pitfall 1: First Login Overwrites Local Progress Instead of Union-Merging It

**What goes wrong:**
A parent signs in for the first time on their child's device. The device has 6 weeks of learning progress in localStorage (letters heard, chess tiers, stickers unlocked, streak data). The sign-in flow writes the fresh empty cloud document to localStorage, or the cloud sync reads the empty cloud document and "syncs" it down, overwriting all local data. The child's progress is gone. The parent has no way to recover it.

**Why it happens:**
The sync logic reads the cloud document first, finds it empty (new account), and treats "no cloud data" as authoritative — as if the cloud is the source of truth and the device is a cache to be replaced. This is the natural direction for a sync system that was designed for "returning users who already have cloud data," not for the "first login, migrate local data up" case.

**How to avoid:**
- Implement a first-login check: when a user signs in and their cloud document does not exist yet (or is empty), read ALL localStorage data first, then write it to the cloud. Never read cloud-first on first login.
- Use a two-phase merge on first login: (1) load localStorage data, (2) load cloud data, (3) compute the union (take the MAX for numeric progress fields like `totalClicks`, UNION for set fields like `heardItemIds`), (4) write the merged result to both cloud and localStorage.
- Store a `cloudSyncVersion` field in the cloud document. If absent, treat the document as "new account" and trigger the migration path.
- Test this path explicitly: create a fresh Firebase account, load it on a device with existing localStorage data, sign in, then verify localStorage data is preserved in the cloud and locally.

**Warning signs:**
- After first login, category progress counters reset to 0
- Stickers the child earned are gone after signing in
- Chess tier progress reverts to Beginner after sign-in

**Phase to address:** Auth + sync core phase. The merge contract must be defined and tested before any sync write logic ships.

---

### Pitfall 2: Cloud Sync Overwrites Progress on Second Device (Last-Write-Wins Without Merge)

**What goes wrong:**
A family uses two iPads. iPad A has chess tier data for rook = Expert, pawn = Intermediate. iPad B has pawn = Expert, rook = Beginner (different child played different puzzles). When iPad B comes online and syncs, it writes its full progress object to Firestore. Firestore's `set()` overwrites the document — rook tier is now Beginner again on all devices, and the rook Expert progress from iPad A is permanently lost.

**Why it happens:**
The simplest sync implementation serializes the entire localStorage object and calls `doc.set(localData)` on every change. This is correct for single-device use but destructive for multi-device. Firestore's default `set()` replaces the entire document; `set(data, { merge: true })` only merges at the top level of the document, not deeply nested fields.

**How to avoid:**
- Use field-level merge semantics for progress data. For numeric "max" fields (totalClicks, totalHeard), store as separate Firestore fields and use `doc.update({ 'letters.totalClicks': Math.max(local, cloud) })` rather than replacing the whole object.
- For set fields (heardItemIds arrays), convert to a map (`{ itemId: true }`) in Firestore so individual item completions can be merged without read-modify-write conflicts.
- For streak data (timestamps), the device with the more recent activity wins — but never reduce the longest streak.
- For settings/preferences (chess piece theme, board theme), last-write-wins is acceptable — settings are not progress.
- Add a `lastSyncedAt` timestamp per device to enable conflict detection.

**Warning signs:**
- Progress regresses on one device after another device syncs
- Two children using separate accounts on shared device (shouldn't happen — this is a single-family app — but worth confirming the data model enforces per-UID isolation)
- Firestore document grows larger than expected (duplicate heardItemIds)

**Phase to address:** Auth + sync core phase. Define merge semantics per data type before any write path is implemented.

---

### Pitfall 3: onAuthStateChanged Causes a Loading Flash on Every Page (SSR Hydration Mismatch)

**What goes wrong:**
`onAuthStateChanged` is async. On page load, the Firebase SDK has not yet resolved auth state — the user is neither logged in nor logged out from React's perspective. If the UI renders a "Sign In" button while auth is resolving, and then re-renders to "Signed in as [name]" 200-500ms later, users see a visible flicker. Worse: the server renders no auth state (SSR doesn't know who the user is), the client hydrates with no auth state, then 300ms later Firebase resolves and the auth state appears. This causes a React hydration mismatch warning and a layout shift.

**Why it happens:**
Firebase Auth uses IndexedDB (not cookies) for session persistence. IndexedDB is only available in the browser, not on the server. So the server-rendered HTML always reflects "not authenticated," and the client must wait for the Firebase SDK to initialize and read from IndexedDB before knowing the auth state. This gap is unavoidable — it must be handled gracefully.

**How to avoid:**
- Add an `isAuthLoading` state (initially `true`) to the auth context. Do not render auth-dependent UI (sign-in button, user avatar) until `isAuthLoading` is `false`.
- For the settings sidebar that contains the sign-in option: show a neutral placeholder (no login button, no user name) while `isAuthLoading` is true. The settings content is below-the-fold, so this is not a LCP concern.
- Do NOT make page routes auth-gated (this app's login is optional — never block content behind auth loading).
- Since login is optional and the app is "not logged in" by default, SSR renders the non-logged-in state which is always correct. The transition after auth resolves is "not logged in → logged in" (additive), not "logged in → not logged in" (disruptive). Design the UI so the additive case does not cause layout shift.

**Warning signs:**
- Hydration warnings in the browser console mentioning auth context
- Sign-in button flickers into view then out then back
- Settings sidebar layout shifts after 300ms on page load

**Phase to address:** Auth integration phase. The `isAuthLoading` guard pattern must be established before any auth-dependent UI is added.

---

### Pitfall 4: signInWithPopup Blocked on Mobile Safari and iOS Home Screen Mode

**What goes wrong:**
Google sign-in uses a popup by default (`signInWithPopup`). On iOS Safari 16.1+, popups that are not triggered directly by a user gesture are blocked by the browser. In iOS home-screen mode (add to home screen), popup windows are blocked entirely regardless of user gesture. Firebase itself acknowledges this and recommends `signInWithRedirect` as the fallback. If the app only uses `signInWithPopup`, parent sign-in will silently fail on iPhone and iPad — the primary devices for this kids app.

**Why it happens:**
`signInWithPopup` requires the popup to open in the same event loop as the user's tap. Any async delay (auth context resolution, loading state) between the tap and the `signInWithPopup()` call breaks this requirement. iOS Safari considers it an untrusted popup and blocks it.

**How to avoid:**
- Use `signInWithRedirect` as the primary sign-in method. It redirects the user to Google's auth page, then back to the app — no popup needed, no iOS restrictions.
- After redirect, call `getRedirectResult()` on page load to complete the sign-in and retrieve the credential.
- `signInWithRedirect` requires the authorized domain list in the Firebase Auth console to include `lepdy.com` — verify this before shipping.
- Alternatively: use `signInWithPopup` with a try-catch that falls back to `signInWithRedirect` when `auth/popup-blocked` is thrown. Firebase documents this as the recommended pattern for cross-browser compatibility.

**Warning signs:**
- Sign-in works on desktop but silently does nothing on iPhone
- Error `auth/popup-blocked` in the browser console on iOS
- Parent reports "the sign in button does nothing" on their phone

**Phase to address:** Auth integration phase. Use redirect-first from the start — it is not worth retrofitting after the popup approach ships.

---

### Pitfall 5: Firebase Initialized at Module Level Causes "window is not defined" in SSR

**What goes wrong:**
Firebase Auth, Firestore, and the Firebase App SDK access browser APIs at initialization time (`indexedDB`, `window`, `navigator`). In Next.js App Router, modules are imported on the server during SSR. If `initializeApp()` or `getAuth()` is called at the top level of a module (not inside a function or useEffect), the server throws `ReferenceError: window is not defined` or `ReferenceError: indexedDB is not defined`.

**Why it happens:**
The existing codebase already initializes Firebase at module level in `lib/firebase.ts` and `lib/firebaseApp.ts` — this works currently because those modules are only imported by client components (`'use client'`). Adding Firebase Auth in a way that touches server-side code (layouts, server components, or a context file that is imported from a server component) will trigger this error.

**How to avoid:**
- All Firebase Auth initialization and `getAuth()` calls must stay inside `'use client'` components or hooks. Never import auth from a server component.
- The auth context provider (`AuthContext.tsx`) must have `'use client'` at the top.
- Use the existing `lib/firebase.ts` pattern (already client-safe) as the template for the auth module.
- If Firebase is imported in `app/providers.tsx` (which is already `'use client'`), this is safe — verify the new auth imports follow the same pattern.
- Verify with `npm run build` — Next.js will throw at build time if server components import client-only modules.

**Warning signs:**
- `ReferenceError: window is not defined` in the build output or server logs
- Build succeeds but server-side rendered pages throw 500 errors
- `getAuth()` called outside a function body in a file without `'use client'`

**Phase to address:** Auth integration phase. Run `npm run build` after each Firebase module addition to catch SSR violations immediately.

---

### Pitfall 6: Sync Writes on Every localStorage Change — Firestore Write Cost Explosion

**What goes wrong:**
The naive implementation wraps each localStorage write with a Firestore `doc.update()` call. The `useCategoryProgress` hook updates localStorage on every item tap — a child hearing 20 letters triggers 20 Firestore writes in one session. Across 14 storage keys and active gameplay, this can generate hundreds of writes per session. Firestore's free tier is 20,000 writes/day — a single active user can exhaust this.

**Why it happens:**
The localStorage hooks fire synchronously on every state change. Wrapping them with a Firestore write call (in a useEffect) means every state change triggers a write. Debouncing is not applied because it wasn't needed for localStorage.

**How to avoid:**
- Debounce cloud writes: accumulate local changes and write to Firestore at most once every 30-60 seconds per storage key. Use a `useRef` timer or a write-batching utility.
- Write on visibility change (`document.visibilitychange → hidden`) and on `beforeunload` — these are the natural "session end" moments where a sync must be guaranteed.
- Use Firestore batch writes to merge multiple key updates into a single network round-trip.
- Do NOT write on every item tap. Write at session boundaries (game session complete, page unload, 60-second debounce).
- Firestore free tier: 20,000 writes/day, 50,000 reads/day. With batching, a typical session (15 items, 1 game) = 1-2 writes. Without batching = 50+ writes.

**Warning signs:**
- Firestore usage dashboard shows writes count climbing sharply after a single user plays
- Noticeable lag on item taps because each tap awaits a Firestore write
- Firebase billing alert fires unexpectedly

**Phase to address:** Sync infrastructure phase. Write batching and debounce strategy must be designed before any write hook is added. This is the most significant cost risk for the project.

---

### Pitfall 7: Offline Sync Queue Not Implemented — Progress Lost When App Used Without Network

**What goes wrong:**
The app is used on a plane, in a car, or in a school with no WiFi. The child plays 30 minutes of chess puzzles. The parent's account is signed in. But because Firestore is offline, the sync writes fail silently. When the device goes online, the sync hook sees "up to date" because it has no pending write queue — the changes were never queued, they were simply dropped.

**Why it happens:**
Firestore has built-in offline persistence for its own SDK, but it applies to Firestore reads/writes made through the Firestore SDK. If the app's offline-first path is "write to localStorage, then write to Firestore in a useEffect," the useEffect's Firestore write fails and there is no retry mechanism. The localStorage write succeeded, so the local state is correct, but the cloud is never updated.

**How to avoid:**
- Enable Firestore's offline persistence: `enableIndexedDbPersistence(db)` (or `enableMultiTabIndexedDbPersistence` for multi-tab support). This makes Firestore queue writes locally when offline and flush them when connectivity returns.
- With offline persistence enabled, write to Firestore the same way you would online — Firestore handles the queuing transparently. Do not build a separate write queue.
- Call `enablePersistence` once, early, before any Firestore reads or writes. If called after a read/write has started, it will throw.
- Verify Firestore offline persistence is compatible with the existing Firebase SDK version (firebase 12.8.0 in this project).
- For the Realtime Database (used for leaderboards): it has offline persistence enabled by default. No additional configuration needed.

**Warning signs:**
- Chess puzzle progress not synced after offline session even when device returns to online
- Firestore write errors logged during flight mode test
- Cloud document timestamps show gaps corresponding to offline sessions

**Phase to address:** Sync infrastructure phase. Offline persistence must be enabled before any Firestore write hooks are added — it cannot be retrofitted without risk to existing writes.

---

### Pitfall 8: Firestore Security Rules Left Open — Any User Can Read/Write Any User's Data

**What goes wrong:**
Development starts with open rules (`allow read, write: if true`) for convenience. These rules ship to production. Any authenticated user can read or overwrite any other user's learning progress by knowing (or guessing) their UID. The default Firebase rules after project creation are already `allow read, write: if false` — but the project uses existing Firebase rules that may not include a `users` collection yet.

**Why it happens:**
Open rules are copied from Firebase quickstart documentation. The developer moves to the next feature, the rules are never tightened. The app ships. Because Lepdy is a kids' app, the risk is not financial fraud — it is unauthorized data deletion (a troll deleting a child's progress) or privacy exposure of a child's usage patterns.

**How to avoid:**
- Add Firestore security rules in the same phase that creates the `users/{uid}` data structure.
- Minimal correct rule: `allow read, write: if request.auth.uid == resource.data.uid` or path-based: `match /users/{userId} { allow read, write: if request.auth.uid == userId; }`.
- Include the rules file in the codebase (not only managed via the Firebase console) so they are versioned and reviewed.
- Test rules with the Firebase Emulator's rules testing before shipping to production.
- The Realtime Database already has rules for the leaderboard feature — verify the new `users` path has explicit rules and does not inherit from a top-level open rule.

**Warning signs:**
- Firebase console Security Rules tab shows `allow read, write: if true` for the users path
- No `firestore.rules` file in the repository
- Rules not tested with the Firebase Emulator

**Phase to address:** Auth integration phase. Rules must be defined before the first user data write goes to production.

---

### Pitfall 9: Auth State Propagated Through a New Context That Competes with Existing Context Hierarchy

**What goes wrong:**
The existing context hierarchy in `providers.tsx` nests 8 providers in a specific order (FeatureFlagProvider → StreakProvider → progress providers → sticker providers). A new `AuthProvider` is added at the wrong level — either too deep (auth state not available to a hook that needs it) or too high (re-renders on auth state change cause all 8 nested providers to re-render). Since the app's content is not auth-gated, auth context should not force re-renders of the learning content tree.

**Why it happens:**
Adding a new context provider is typically done at the top of the `providers.tsx` stack for convenience ("it needs to wrap everything"). But `onAuthStateChanged` fires on every auth state change (sign in, sign out, token refresh every hour) — placing it at the top of the provider tree means a token refresh re-renders every context consumer in the app.

**How to avoid:**
- Place `AuthProvider` at the top of the providers stack (it needs to be available everywhere), but ensure the auth context value object is memoized with `useMemo` so that token refresh (which does not change the user object) does not trigger consumer re-renders.
- The auth context should expose: `{ user, isAuthLoading, signIn, signOut }`. The `user` object from Firebase changes reference on every token refresh even if the user has not changed — memoize by `user.uid` to prevent spurious re-renders.
- Progress hooks (`useLettersProgress`, `useChessProgress`, etc.) must not depend on auth context. Their behavior when logged out (pure localStorage) must be identical to their current behavior.

**Warning signs:**
- Category item taps cause unnecessary re-renders in unrelated contexts (visible in React DevTools Profiler)
- Token refresh at 1-hour intervals causes a brief loading state in the settings sidebar
- Error thrown in a progress hook because auth context is undefined (auth provider placed too low in tree)

**Phase to address:** Auth integration phase. Provider placement and memoization strategy must be decided before the AuthProvider is wired in.

---

### Pitfall 10: COPPA Considerations for Google Sign-In on a Kids App

**What goes wrong:**
The app targets ages 5-9. COPPA (Children's Online Privacy Protection Act, updated rules effective June 23, 2025) applies to apps directed at children under 13. Adding Google sign-in collects a Google account's email address and persistent user identifier. If the Google account belongs to a child under 13 (a Google Family account, school Google Workspace account, or an account created without age verification), this triggers COPPA data collection requirements — specifically: verifiable parental consent before collection, data retention limits, and parent access/deletion rights.

**Why it happens:**
Developers focus on the technical implementation and defer legal review. The sign-in is framed as "optional" and for parents — but the app cannot technically verify that the person signing in is a parent rather than the child.

**How to avoid:**
- Frame the Google sign-in explicitly as "parent/guardian login" in all UI copy, with a brief confirmation step: "I am a parent or guardian signing in for my child." This creates a reasonable record of consent context.
- Do NOT collect or display the Google account's email in the child-facing UI. Store only the Firebase UID and display name as needed.
- Firebase's privacy documentation explicitly states that COPPA compliance depends on the app's implementation, not Firebase itself. The app developer is responsible.
- Add a data deletion flow (or at minimum, a contact path) so parents can request data deletion — COPPA 2025 requires honoring this.
- Consult legal counsel before shipping if lepdy.com serves US users. This pitfall has LOW implementation complexity but HIGH legal risk if ignored.

**Warning signs:**
- Sign-in button labeled "Sign in" without any indication it is for parents
- Child's Google account used to sign in (no parent confirmation step)
- No data deletion path in the app or privacy policy

**Phase to address:** Auth integration phase. UI copy and parental consent framing must be decided before the sign-in button is designed.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Write full localStorage object to Firestore on every change | Simple implementation, no debounce logic | Firestore write costs explode with active users; per-tap writes create noticeable lag | Never — debounce from day one |
| `signInWithPopup` only (no redirect fallback) | Simpler flow, no redirect handling | Silently fails on iOS Safari and home-screen mode (the primary device for this app) | Never — redirect fallback is required |
| Open Firestore rules during development | Move fast, no auth friction | Ships to production; any authenticated user can delete any child's progress | Acceptable in local emulator only, never in deployed Firebase project |
| Store all localStorage data as one flat Firestore document | Simple to serialize/deserialize | Whole document must be read/written even for a single field change; 14-key doc grows with every new feature | Acceptable for MVP, must be refactored when write costs become visible |
| Skip offline persistence setup initially | Fewer moving parts | Any offline session drops cloud writes permanently; not recoverable without user action | Never — offline persistence must be enabled before first write |
| Auth provider placed at root without memoization | Auth available everywhere | Token refresh every 60 minutes re-renders entire app tree | Acceptable for prototype; must be fixed before shipping |
| Derive "first login" flag from Firestore document absence | No extra state to manage | A bug that accidentally deletes the cloud document (network error, rule misconfiguration) is treated as "first login" and triggers a re-migration, potentially overwriting cloud with stale local data | Never — use a dedicated `accountCreatedAt` field |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firebase Auth + Next.js SSR | Import `getAuth()` in a server component or module without `'use client'` | All Firebase Auth imports must be in `'use client'` files; auth context must have `'use client'` directive |
| `onAuthStateChanged` | Subscribe inside a component body without unsubscribing | Call inside `useEffect` and return the unsubscribe function: `return onAuthStateChanged(auth, handler)` |
| `signInWithRedirect` + `getRedirectResult` | Only call `getRedirectResult` on the sign-in page | Call `getRedirectResult` on every page load (in the auth context provider) — the redirect can land on any page |
| Firestore `set()` for sync writes | Replace the entire user document on every sync | Use `setDoc(ref, data, { merge: true })` or `updateDoc(ref, fieldUpdates)` to avoid overwriting fields from other devices |
| Firestore offline persistence | Call `enableIndexedDbPersistence` after any Firestore read or write | Enable persistence once, before any other Firestore call, in the Firebase initialization module |
| Realtime Database + Firestore in same app | Mix RTDB and Firestore for user progress | Keep RTDB for leaderboards (already there), Firestore for user sync — do not split a user's progress across both databases |
| Firebase UID as localStorage key | Prefix localStorage keys per user when logged in | Keep single-device localStorage keys as-is (no UID prefix) — the device belongs to one family; use UID only as the Firestore document path |
| Google Auth redirect on `lepdy.com` | Authorized domain not added to Firebase Auth console | Add `lepdy.com` to Firebase Auth → Sign-in method → Authorized domains before testing redirect on production |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Firestore write on every item tap | Item tap latency increases; Firestore write count in dashboard is proportional to items tapped | Debounce writes to 30-60s; batch multiple key updates into one write | Every active gameplay session without batching |
| `onAuthStateChanged` re-render propagation | Profiler shows all context consumers re-rendering every 60 minutes (token refresh) | Memoize auth context value by `user.uid`; only update context when uid actually changes | At 60-minute token refresh cycle on any active session |
| First-login migration reads 14 localStorage keys synchronously | Migration blocks UI while reading and writing all keys | Already synchronous (localStorage reads are fast); the bottleneck is the single Firestore write — ensure it is non-blocking | Only on first login — acceptable one-time cost |
| Firestore `onSnapshot` real-time listener for progress sync | Continuous network connection open; battery drain on tablets | Use `getDoc` (one-time fetch) not `onSnapshot` (real-time listener) for user progress — real-time sync is not needed for this use case | Any session where `onSnapshot` is used instead of `getDoc` |
| Firestore `getDoc` called on every page mount | Redundant reads when user navigates between pages | Fetch cloud data once on sign-in, cache in memory (auth context state); only re-fetch on explicit "refresh" or sync event | Every page navigation if fetch is in page-level useEffect |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Open Firestore rules (`allow read, write: if true`) in production | Any authenticated user can read/write any child's progress | Path-based rules: `match /users/{userId} { allow read, write: if request.auth.uid == userId; }` |
| Storing sensitive parent data (email, Google profile) in Firestore user document | COPPA/GDPR exposure if data is breached | Store only Firebase UID, display name, and app-specific progress data — never email in child-visible storage |
| No data deletion path | COPPA 2025 requires honoring parent deletion requests | Implement `deleteUser()` + Firestore document deletion path; document it in the privacy policy |
| Firebase API keys in client-side code | Exposure risk (low — Firebase public keys are safe for client use) | Firebase client config keys are designed to be public; they are NOT secret keys. Security enforced by Security Rules, not key secrecy. |
| Missing Firestore rules for the `users` collection while RTDB rules exist | New collection inherits default-deny or is accidentally left open | Add explicit Firestore rules for `users/{userId}` in the same commit that creates the collection |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sign-in button visible in child-facing UI | Child taps "Sign in with Google" accidentally, interrupts gameplay | Place sign-in only in the settings/parent drawer, behind a parent gate (age verification tap already exists) |
| Auth loading state shows nothing (blank settings area) | Parent opens settings, sees empty sidebar while Firebase resolves | Show a neutral placeholder (settings icon, no login button text) for 300ms, not a blank space |
| "Sync failed" error shown to child | Child is confused and worried about data loss | Never surface sync errors to the child — log to console only; show subtle indicator only in parent settings area |
| Sign-out deletes local cache | Child's progress disappears from device after parent signs out | Sign-out should preserve localStorage — local data is the offline-first source of truth regardless of auth state |
| Progress sync forces reload to see updated data | Multi-device families see stale progress on second device | Fetch fresh cloud data on every sign-in (not on every page load) and merge with local state at that point |
| Login mandatory to use the app | Friction kills engagement for kids whose parents don't set up accounts | Enforce "not logged in = zero behavior change" throughout — no banners, no prompts, no degraded features |

---

## "Looks Done But Isn't" Checklist

- [ ] **First login union merge:** Sign in on a device with 6 weeks of localStorage data. Verify cloud document contains all local progress. Verify local state was not overwritten. Check each of the 14 storage keys.
- [ ] **Second device merge:** Sign in on a fresh device where cloud has progress from device 1. Verify cloud progress is written to localStorage. Play 2 items. Verify cloud shows merged (not replaced) progress.
- [ ] **Sign-out preserves local data:** Sign out. Verify all 14 localStorage keys still exist with the same values as before sign-out.
- [ ] **Offline session sync:** Enable airplane mode. Play a chess session (complete 5 puzzles). Re-enable network. Verify Firestore document updates within 60 seconds without any user action.
- [ ] **SSR no window errors:** Run `npm run build`. Zero `window is not defined` or `indexedDB is not defined` errors in build output or server logs.
- [ ] **iOS Safari sign-in works:** Test `signInWithRedirect` on an iPhone (Safari). Verify Google auth completes and user is signed in after redirect back.
- [ ] **Security rules lock user data:** Using Firebase Emulator, attempt to read `/users/{uid-A}` while authenticated as uid-B. Verify permission denied.
- [ ] **No sync writes during gameplay:** Open Firestore usage dashboard. Play 20 item taps. Verify write count does not increment by more than 2 (one debounced write, one on session end).
- [ ] **Auth context memoized:** Open React DevTools Profiler during a token refresh (wait 60 minutes or force it). Verify only auth-context consumers re-render, not the entire component tree.
- [ ] **Parent consent framing in UI:** Sign-in UI copy explicitly states this is for parents/guardians. A child-specific account warning is present.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| First login overwrote local progress | HIGH | No automatic recovery — localStorage was overwritten. Prevention is the only option. Implement a backup-before-overwrite: store a `preMigrationBackup` key in localStorage before the first write. |
| Second device last-write-wins destroyed progress | MEDIUM | Add `lastWriteWins` timestamp comparison; restore from Firestore backup if available (Firestore has point-in-time recovery on paid plans). Implement merge-semantics retroactively using `updateDoc` field operations. |
| Firestore rules left open in production | HIGH | Update rules immediately in Firebase console (takes effect within seconds). Audit logs in Firebase console to check if any unauthorized reads/writes occurred. |
| Write cost explosion before debounce implemented | LOW-MEDIUM | Add debounce immediately — one PR. Existing writes are already charged. Enable Firebase billing alerts at $1 and $5 thresholds to catch this early. |
| `signInWithPopup` blocked on iOS, parents can't sign in | MEDIUM | Add `signInWithRedirect` fallback in one PR. No data loss, purely UX regression. Can be fixed in a hotfix without touching sync logic. |
| COPPA compliance gap discovered post-launch | HIGH | Consult legal counsel. Add parental consent UI. Implement data deletion path. Update privacy policy. May require disabling auth feature until compliant. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| First login overwrites local progress | Auth + sync core — define merge contract first | Sign in on device with data; verify 14 keys present in Firestore and localStorage unchanged |
| Second device last-write-wins | Auth + sync core — define field-level merge semantics | Two devices with different progress; sync both; verify no regression on either |
| onAuthStateChanged loading flash | Auth integration — `isAuthLoading` guard in auth context | Settings sidebar shows no flicker during 300ms auth resolution window |
| signInWithPopup blocked on iOS | Auth integration — use redirect-first approach | Test Google sign-in on iPhone Safari before shipping |
| Firebase SSR "window is not defined" | Auth integration — `'use client'` discipline | `npm run build` produces zero SSR window errors |
| Firestore write cost explosion | Sync infrastructure — debounce before first write hook | 20 item taps = max 2 Firestore writes in usage dashboard |
| Offline writes dropped | Sync infrastructure — enable Firestore persistence before writes | Airplane mode session; writes appear in Firestore after reconnect |
| Open Firestore security rules | Auth integration — rules file in repo, tested in emulator | Emulator rules test: cross-user read returns PERMISSION_DENIED |
| Auth context re-render propagation | Auth integration — memoized context value | React Profiler shows no full-tree re-render on 60-minute token refresh |
| COPPA parental consent framing | Auth integration — UI copy reviewed before design | Sign-in UI contains explicit parental consent language; no child-facing sign-in prompt |

---

## Sources

- Firebase Auth SSR/Next.js patterns: [Authenticated server-side rendering with Next.js and Firebase](https://colinhacks.com/essays/nextjs-firebase-authentication) (MEDIUM confidence — pre-2025 but pattern is stable)
- Firebase Auth redirect best practices for Safari 16.1+: [Best practices for using signInWithRedirect](https://firebase.google.com/docs/auth/web/redirect-best-practices) (HIGH confidence — official Firebase docs)
- Firebase Auth state persistence: [Authentication State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) (HIGH confidence — official Firebase docs)
- Firestore vs Realtime Database: [Choose a database](https://firebase.google.com/docs/database/rtdb-vs-firestore) (HIGH confidence — official Firebase docs)
- Firestore offline persistence: [Offline-First with Firestore](https://bootstrapped.app/guide/how-to-use-firebase-firestores-offline-capabilities-with-synchronization) (MEDIUM confidence — community guide, patterns consistent with official docs)
- Firestore conflict resolution strategies: [10 Common Challenges with Firebase Data Syncing](https://moldstud.com/articles/p-10-common-challenges-with-firebase-data-syncing-and-how-to-overcome-them) (MEDIUM confidence — community)
- Firebase security rules user isolation: [Basic Security Rules](https://firebase.google.com/docs/rules/basics) (HIGH confidence — official Firebase docs)
- COPPA 2025 updated rules: [Children's Online Privacy in 2025](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule) (HIGH confidence — legal publication)
- Firebase privacy documentation: [Privacy and Security in Firebase](https://firebase.google.com/support/privacy) (HIGH confidence — official Firebase docs)
- React auth context loading patterns: [onAuthStateChanged flicker patterns](https://blog.logrocket.com/implementing-authentication-in-next-js-with-firebase/) (MEDIUM confidence — community, pattern verified against known Next.js hydration behavior)
- Codebase analysis: 14 localStorage storage keys identified across 11 hooks — direct codebase inspection (HIGH confidence)

---
*Pitfalls research for: v1.5 Cloud Sync — optional Firebase Auth + cloud sync added to existing localStorage-based kids learning app*
*Researched: 2026-03-23*
