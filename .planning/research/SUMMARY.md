# Project Research Summary

**Project:** Lepdy v1.5 — Firebase Auth + Cloud Sync
**Domain:** Optional Google sign-in with offline-first progress sync for a kids learning app
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

Lepdy v1.5 adds optional Google sign-in and cross-device progress sync to an existing offline-first kids learning app. The architecture is well-understood: the app already uses Firebase (`firebase@12.8.0`) and all required APIs — `firebase/auth` and `firebase/firestore` (or RTDB) — ship inside the installed package. Zero new npm dependencies are needed. The recommended approach is strictly additive: localStorage remains the runtime source of truth, the sync layer runs as a side-effect service, and logged-out behavior must remain byte-for-byte identical to today. The primary value proposition — cross-device progress continuity — is delivered through a union-merge strategy on first login combined with debounced write-through sync on subsequent sessions.

The most significant architectural decision is where sync state lives. All existing progress hooks (8+ hooks across 14 localStorage keys) must remain unmodified. A new `AuthContext` wraps the entire provider stack, and a new `CloudSyncProvider` sits inside all existing progress providers, observing their state changes and mirroring writes to cloud storage. The sync layer reads from contexts (or directly from localStorage) and writes to Firebase — never the reverse at runtime. The only cloud-to-local read occurs at login time, completing the merge before the user touches any learning content.

The key risks are correctness risks, not technical feasibility risks. First-login merge must use additive union semantics (never discard, always take the max) or the child loses earned progress — the single most trust-destroying outcome for a kids app. Firestore/RTDB write costs can explode without debouncing (20K writes/day free tier is easily exhausted without batching). iOS Safari blocks `signInWithPopup`, which is the primary target device for this audience, so `signInWithRedirect` must be the primary or fallback path from day one. COPPA compliance requires that sign-in UI be explicitly framed as a parent action — this is a copy/UX constraint with legal implications if ignored.

---

## Key Findings

### Recommended Stack

No new packages are required. `firebase@12.8.0` already ships `firebase/auth` and `firebase/firestore`. The stack research recommends **Cloud Firestore** (not Realtime Database) for user progress storage because it has first-class offline persistence via IndexedDB using the modern `persistentLocalCache` API. However, the architecture research takes the opposite view, preferring RTDB (already used for leaderboards) to avoid adding a second Firebase service. This is a decision point — see Gaps section below.

**Core technologies:**
- `firebase/auth` — Google sign-in, auth state listener — already in installed package, zero bundle cost beyond tree-shaken imports
- `firebase/firestore` OR `firebase/database` — cloud progress storage — both available; RTDB is already initialized for leaderboards
- `initializeFirestore` with `persistentLocalCache` — offline queuing if Firestore is chosen; replaces deprecated `enableIndexedDbPersistence()` which must NOT be used
- React Context (`AuthContext`, `CloudSyncContext`) — follows existing `FeatureFlagContext`/`StreakContext` patterns already in the codebase
- `next-intl` (existing) — all auth UI strings need he/en/ru translation
- MUI (existing) — sign-in button, user avatar chip in settings drawer

**Critical version note:** `initializeFirestore` with `localCache` must be called before any reads or writes. `getFirestore()` alone returns a memory-only instance that cannot have offline persistence added after init. Top-level `import { getAuth }` in any file imported by a server component will crash the Next.js build with `window is not defined`.

### Expected Features

See `.planning/research/FEATURES.md` for full competitor analysis and compliance sourcing.

**Must have (table stakes — v1.5 core):**
- Google sign-in button in settings drawer — parents expect a trusted identity provider, not username/password
- Sign-out action — device-sharing families need this; missing it breaks parent trust
- Progress persists across devices after sign-in — the entire value proposition of the feature
- Zero behavior change when logged out — no friction, no paywalls, no locked features for anonymous users
- First-login union merge (localStorage → cloud) — losing 6 weeks of a child's earned progress on first login is unrecoverable trust damage
- Offline access to all features — non-negotiable for a kids app used on tablets in cars and planes
- Feature flag gate (`cloudSyncEnabled`) — safe rollout via existing Remote Config infrastructure

**Should have (v1.5.x polish after core is validated):**
- Sync status indicator — subtle "saved" state in settings, not in game flow
- Offline detection note in settings — "progress saved locally" when network absent
- Sync on app resume — re-fetch cloud state on tab focus via Visibility API

**Defer to v2+:**
- Per-child profiles under one parent account — fundamentally different product scope
- Parent progress dashboard — requires separate auth view
- Email/password accounts — COPPA compliance burden is high; Google-only covers target audience
- Real-time sync during active sessions — race conditions, high write cost, no meaningful benefit

**Compliance constraints (non-negotiable):**
- Sign-in UI must be explicitly labeled as a parent action ("Parent: save progress to your Google account")
- COPPA 2025 (updated rules, effective April 2026) requires verifiable parental consent before collecting personal information from under-13 users
- Data deletion path is required — Firebase Auth `deleteUser()` + Firestore/RTDB document deletion, documented in privacy policy
- Store only Firebase UID and display name — never email in child-visible storage

### Architecture Approach

The architecture follows strict layering: `AuthProvider` wraps the full context tree outermost (auth must resolve before sync runs), the existing provider stack is unchanged in the middle, and `CloudSyncProvider` sits innermost (must be inside all progress providers to read their state). All 8+ existing progress hooks are untouched — they continue to read/write localStorage identically to today. The `useCloudSync` hook observes context state (or reads localStorage directly for contexts that do not expose raw data) and mirrors changes to the cloud via debounced writes. The merge on first login is a pure function (`mergeProgressData`) that is independently testable.

**Major components (all new, existing hooks and contexts unchanged):**
1. `lib/auth.ts` — lazy Firebase Auth singleton, `signInWithGoogle()`, `signOut()` — mirrors the existing `lib/firebase.ts` lazy pattern
2. `contexts/AuthContext.tsx` — `AuthProvider` with three-state auth (`loading`, `null`, `User`), outermost provider wrap
3. `lib/firebaseSync.ts` — RTDB/Firestore read/write for progress data; pure `mergeProgressData(key, local, cloud)` function per storage key
4. `hooks/useCloudSync.ts` — sync orchestration: merge on login, debounced write on context change, fire-and-forget on failures
5. `contexts/CloudSyncContext.tsx` — mounts `useCloudSync`, exposes `syncStatus`; positioned inside all existing progress providers
6. `components/GoogleSignInButton.tsx` — MUI button with loading/error state, settings drawer only
7. `components/UserAccountChip.tsx` — avatar + display name + sign-out; replaces sign-in button when authenticated

**Modified files (minimal surface area):**
- `app/providers.tsx` — wrap with `AuthProvider` (outermost) and add `CloudSyncProvider` (innermost)
- `components/SettingsDrawer.tsx` — add auth section with sign-in button or user chip
- `next.config.ts` — add `/__/auth/:path*` rewrite proxy for Vercel-hosted popup auth
- `lib/firebaseApp.ts` — change `authDomain` to `'lepdy.com'` so the rewrite proxy works

**Build order is strictly sequential by dependency:** Auth foundation → Sign-in UI → Cloud write path → Merge/read path. No phase can start before the prior one delivers its output.

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full detail, prevention checklists, recovery strategies, and a "looks done but isn't" test suite.

1. **First login overwrites local progress instead of union-merging it** — Implement two-phase merge: read local AND cloud, compute union (max of numeric fields, union of array/set fields, true wins for boolean unlocks), write merged result to both. Never treat an empty cloud document as authoritative. Test explicitly on a device with 6 weeks of existing data before shipping.

2. **`signInWithPopup` blocked on iOS Safari and home-screen mode** — The primary device for this app is iPad. `signInWithPopup` silently fails on iOS Safari 16.1+ and is fully blocked in home-screen/PWA mode. Use `signInWithRedirect` as primary or immediate fallback. Also requires a Next.js rewrite proxy (`/__/auth/*`) to resolve Vercel COOP header issues, and `lepdy.com` added to Firebase Auth authorized domains.

3. **Firestore write cost explosion without debouncing** — A child hearing 20 letters in one session could trigger 20 Firestore writes. Debounce writes to once per 30-60 seconds per storage key; batch multiple key updates into one round-trip; guarantee a write on session complete and on `visibilitychange: hidden`. Debounce strategy must be designed before any write hook is implemented.

4. **`onAuthStateChanged` hydration mismatch and UI flash** — Firebase Auth reads from IndexedDB (browser-only). SSR renders "not authenticated." The async gap causes a 200-500ms flicker. Use a three-state model: `loading` (initial, render neutral placeholder), `null` (signed out), `User` (signed in). Auth-dependent UI in the settings drawer must not render until `loading = false`.

5. **Auth context memoization** — `onAuthStateChanged` fires on every 60-minute token refresh, returning a new user object reference even when the UID has not changed. Without `useMemo` keyed on `user.uid`, all 8 progress context consumers re-render hourly. Memoize the context value before wiring in `AuthProvider`.

6. **Open security rules shipped to production** — Define per-user Firestore/RTDB security rules in the same commit that creates the user data structure. Commit the rules file to the repository (not only managed in the Firebase console). Test with Firebase Emulator before shipping.

7. **COPPA framing gap** — Sign-in UI copy must state this is a parent action before the component is designed. "Sign in to continue" on a directed-at-children app is non-compliant. "Parent: save progress to your Google account" with an acknowledgment step is the minimum viable approach. Low implementation complexity, high legal risk if ignored.

---

## Implications for Roadmap

Based on combined research, the feature has a strict dependency chain that dictates four sequential phases with an optional fifth polish phase. There is no meaningful parallelization — each phase's output is an input to the next.

### Phase 1: Firebase Auth Foundation

**Rationale:** Auth state (`user`, `loading`) must exist in the context tree before any other sync feature can be built. UI cannot show a sign-in button without an `AuthContext`. Sync cannot write without a user UID. This phase has zero user-visible output — it is pure infrastructure — but it is the prerequisite for everything else and contains the most non-obvious technical risks.

**Delivers:** `AuthProvider` wrapping the full app; `useAuthContext()` available everywhere; `signInWithGoogle()` and `signOut()` functions with popup + redirect handling; Next.js rewrite proxy; Firebase Auth console configuration; feature flag gate wired.

**Addresses (from FEATURES.md):** Prerequisite for all P1 features. `cloudSyncEnabled` feature flag established here.

**Avoids (from PITFALLS.md):** Pitfall 5 (SSR `window is not defined`) — all Firebase imports lazy-loaded via async dynamic import; Pitfall 3 (hydration flash) — three-state auth with `loading` guard established from the start; Pitfall 9 (context re-render propagation) — context value memoized by `user.uid`; Pitfall 4 (iOS popup blocking) — `signInWithRedirect` configured as primary/fallback path.

### Phase 2: Sign-In UI in Settings Drawer

**Rationale:** Depends on Phase 1. Delivers the user-visible affordance that enables end-to-end testing of the auth flow — especially on real mobile/iPad devices — before any sync logic exists. Catching iOS Safari sign-in issues here (not after sync is built) prevents expensive rework.

**Delivers:** `GoogleSignInButton` component, `UserAccountChip` component, auth section in `SettingsDrawer`, i18n keys for auth strings in he/en/ru message files.

**Addresses (from FEATURES.md):** Google sign-in button (P1), Sign-out action (P1), Visual sign-in state indicator (P1).

**Avoids (from PITFALLS.md):** Pitfall 10 (COPPA) — sign-in UI copy reviewed and approved before any implementation; UX pitfall — sign-in only in settings/parent area, never in child-facing game flow.

### Phase 3: Cloud Write Path (Local to Cloud)

**Rationale:** Depends on Phase 2 — need a signed-in user to test writes. The write path is implemented before the read/merge path because: (1) write-only sync already delivers partial value (progress is saved from one device), (2) the write data structure in Firestore/RTDB determines what the merge logic must read, and (3) write bugs (a missing write) are less dangerous than merge bugs (overwriting a child's progress). Security rules ship in this same phase.

**Delivers:** `lib/firebaseSync.ts` with write functions, `hooks/useCloudSync.ts` with debounced writes, `CloudSyncContext`, security rules file committed to repository.

**Addresses (from FEATURES.md):** Write-through sync on authenticated writes (P1), Firestore/RTDB schema defined and deployed (P1).

**Avoids (from PITFALLS.md):** Pitfall 6 (write cost explosion) — debounce and batching strategy implemented from day one, not retrofitted; Pitfall 8 (open security rules) — rules shipped in the same commit as the first write path.

### Phase 4: Cloud Read and Merge Path (Cloud to Local, First Login)

**Rationale:** Depends on Phase 3 — write path must exist and cloud must have data before merge is meaningful. This is the highest-complexity phase: the merge function must handle all 14 storage keys with per-type semantics. It is also the highest-risk phase — a merge bug that discards a child's progress is not recoverable.

**Delivers:** `readProgressFromCloud()` in `lib/firebaseSync.ts`, `mergeProgressData(key, local, cloud)` pure function (independently testable with unit tests), merge-on-login logic in `useCloudSync`, page reload after merge to refresh context state from updated localStorage.

**Addresses (from FEATURES.md):** First-login merge (P1), Read Firestore on login (P1), Device-agnostic session continuity (differentiator).

**Avoids (from PITFALLS.md):** Pitfall 1 (first login overwrites local data) — union semantics enforced; Pitfall 2 (last-write-wins on second device) — per-type merge rules defined for all 14 keys; Pitfall 4 (merge on every app load) — merge runs only on auth state transition from null to User, not on page refresh.

### Phase 5: Polish (Post-Validation, Optional)

**Rationale:** Deliver only after core sync is confirmed reliable in production. Low complexity additions, meaningful parent-facing UX.

**Delivers:** Sync status indicator in settings (subtle "saved" state, 2s duration), offline detection note in settings, sync-on-app-resume via Visibility API.

**Addresses (from FEATURES.md):** All P2 features.

### Phase Ordering Rationale

- Auth foundation before UI: The `AuthContext` contract (three-state model, memoization strategy) must be established before any component uses it to avoid retrofitting the loading guard pattern across multiple components.
- UI before sync: Testing sign-in on real iOS/iPad devices in Phase 2 validates the popup/redirect path before investing in complex sync logic in Phases 3-4.
- Write before read/merge: The write data structure is the contract that the merge logic must read. Defining it in Phase 3 prevents schema changes that break Phase 4 merge code.
- Merge isolated to Phase 4: Separating write (Phase 3) from read/merge (Phase 4) means a merge bug does not require rolling back write functionality — the phases are independently deployable.

### Research Flags

Phases needing deeper research during planning:

- **Phase 4 (merge logic):** Per-key merge semantics for all 14 storage keys are documented in ARCHITECTURE.md but have not been implemented or tested. The `mergeProgressData` function needs careful design for `PuzzleProgressData` (nested per-piece tier and streak data) and the `StreakData` edge case where both devices have independent recent activity in the same week.
- **Phase 3 (Firestore vs RTDB):** STACK.md and ARCHITECTURE.md give conflicting recommendations (see Gaps). This decision must be resolved before Phase 3 begins — it affects the write API, offline persistence configuration, and the security rules format.

Phases with standard patterns (skip research-phase):

- **Phase 1:** Firebase Auth lazy init, `onAuthStateChanged`, `signInWithRedirect` — official docs are thorough, existing `lib/firebase.ts` is the direct template.
- **Phase 2:** MUI button + avatar chip in settings drawer — standard component work against an existing integration point.
- **Phase 5:** Visibility API + sync indicator — minimal new surface area with clear patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All required APIs confirmed in `firebase@12.8.0`; official Firebase docs verified. One open decision: Firestore vs RTDB (see Gaps). |
| Features | HIGH | Firebase official docs, COPPA/GDPR-K 2025 legal sources (Loeb legal publication), competitor analysis (Duolingo, Khan Academy Kids, Prodigy). Feature list is stable. |
| Architecture | HIGH | Based on direct codebase reading of all 11 hooks and 14 storage keys plus verified Firebase Auth patterns. Component boundaries and provider placement are clear. |
| Pitfalls | HIGH | 10 critical pitfalls documented with prevention strategies. iOS Safari `signInWithPopup` and first-login merge are the two non-obvious risks that could cause shipped bugs without this research. |

**Overall confidence:** HIGH

### Gaps to Address

- **Firestore vs Realtime Database:** STACK.md recommends Firestore (better offline persistence API, `persistentLocalCache`). ARCHITECTURE.md recommends RTDB (already initialized for leaderboards, simpler, no second Firebase service). This must be decided before Phase 3. Recommended default: RTDB. The app's offline guarantee already comes from localStorage — Firestore's IndexedDB offline cache is a nice-to-have, not a necessity. Only choose Firestore if the offline cache is specifically needed for a scenario localStorage does not cover.

- **`StreakData` merge edge case:** Both research files define merge rules for streaks (keep longer streak, most recent activity date). The edge case where two devices have independent active streaks from different days in the same week is not fully specified. Define a concrete rule before the merge function is coded — recommendation: keep the streak with the higher `currentStreak` count; use the more recent `lastActivityDate`.

- **Page reload UX on first login merge:** The recommended approach for applying merged cloud data is `window.location.reload()` after first login merge. This is simple and correct but may be jarring for a user who just signed in. Validate this UX on a real device before committing to it — alternative is exposing a `reload()` function from each context, which is more code but avoids the reload.

- **Security rules file format:** Firestore rules use CEL expression syntax; RTDB rules use JSON. The file to commit to the repository depends on the Firestore vs RTDB decision. Do not finalize the rules file until that decision is made.

---

## Sources

### Primary (HIGH confidence)
- Firebase JS SDK official docs — Auth (`signInWithPopup`, `signInWithRedirect`, `onAuthStateChanged`, `getRedirectResult`, persistence), Firestore (offline persistence, `persistentLocalCache`, `initializeFirestore`), RTDB security rules
- Firebase JS SDK release notes — confirmed `firebase@12.8.0` includes all required Auth and Firestore APIs
- COPPA 2025 amended rules (loeb.com legal publication, May 2025) — compliance constraints for directed-at-children apps
- Direct codebase analysis — 11 hooks, 14 localStorage keys, existing provider stack, `lib/firebaseApp.ts`, `lib/firebase.ts`, `components/SettingsDrawer.tsx` (first-hand)

### Secondary (MEDIUM confidence)
- Vercel/Next.js COOP + `signInWithPopup` issue (GitHub firebase-js-sdk discussions, vercel/next.js discussions) — popup blocking on Vercel-hosted apps; `/__/auth/*` rewrite proxy approach
- Firebase Auth proxy pattern for Vercel (duncanleung.com) — same-origin popup via Next.js rewrite
- Local-first with Firestore architecture patterns (captaincodeman.com, tigerabrodi.blog) — write-through cache mechanics
- React auth context loading patterns (LogRocket blog) — `onAuthStateChanged` flicker handling in Next.js
- Competitor analysis (Duolingo, Khan Academy Kids, Prodigy) — optional login baseline and compliance framing

### Tertiary (LOW confidence — validate before relying on)
- COPPA/GDPR-K practical kids app guidance (Andromo blog, 2025) — general guidance only; verify specifics with legal counsel before shipping the auth feature

---

*Research completed: 2026-03-23*
*Ready for roadmap: yes*
