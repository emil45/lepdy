# Roadmap: Lepdy Chess

## Milestones

- ✅ **v1.0 Lepdy Chess** — Phases 1-6 (shipped 2026-03-22)
- ✅ **v1.1 Polish & Fixes** — Phases 7-10 (shipped 2026-03-22)
- ✅ **v1.2 Board Facelift** — Phases 11-13 (shipped 2026-03-22)
- ✅ **v1.3 Infinite Replayability** — Phases 14-18 (shipped 2026-03-22)
- ✅ **v1.4 Complete Puzzle Experience** — Phases 19-23 (shipped 2026-03-23)
- 🚧 **v1.5 Cloud Sync** — Phases 24-28 (in progress)

## Phases

<details>
<summary>✅ v1.0 Lepdy Chess (Phases 1-6) — SHIPPED 2026-03-22</summary>

- [x] **Phase 1: Foundation** - Chess piece data, puzzle data, i18n translations
- [x] **Phase 2: Board Infrastructure** - Interactive chess board component
- [x] **Phase 3: Game Shell** - Level map, progress hook, games list integration
- [x] **Phase 4: Level 1 — Piece Introduction** - 6-piece Hebrew walkthrough with audio
- [x] **Phase 5: Level 2 — Movement Puzzles** - 18 tap-to-move puzzles
- [x] **Phase 6: Level 3 — Capture Puzzles** - 8 capture identification puzzles

**Total:** 6 phases, 11 plans
**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Polish & Fixes (Phases 7-10) — SHIPPED 2026-03-22</summary>

- [x] **Phase 7: Bug Fixes & Cleanup** - i18n double-namespace fix, orphaned file cleanup
- [x] **Phase 8: Navigation & UI Polish** - Exit buttons, RTL arrows, pastel theme, Fade transitions
- [x] **Phase 9: Puzzle Animations** - Piece slide animation on correct answers
- [x] **Phase 10: Sticker Integration** - 3 chess stickers (one per level)

**Total:** 4 phases, 5 plans
**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Board Facelift (Phases 11-13) — SHIPPED 2026-03-22</summary>

- [x] **Phase 11: Board Theme** - Pastel board colors, coordinate label styling
- [x] **Phase 12: Custom Piece SVGs** - Staunty + Horsey themes from lichess
- [x] **Phase 13: Theme Selector** - Settings drawer with piece theme picker, localStorage persistence

**Total:** 3 phases, 4 plans
**Archive:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 Infinite Replayability (Phases 14-18) — SHIPPED 2026-03-22</summary>

- [x] **Phase 14: Puzzle Pool Expansion** - 95 validated puzzles (61 movement + 34 capture)
- [x] **Phase 15: Generator + Progress Hook** - Random generator, adaptive difficulty, progress tracking
- [x] **Phase 16: Session Hook + Puzzle Refactor** - 10-puzzle sessions, streak counter
- [x] **Phase 17: Session Complete + Progression UI** - Stars, mastery bands, tier advancement
- [x] **Phase 18: Daily Featured Puzzle** - Date-seeded daily puzzle with completion state

**Total:** 5 phases, 10 plans
**Archive:** `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Complete Puzzle Experience (Phases 19-23) — SHIPPED 2026-03-23</summary>

- [x] **Phase 19: Menu Redesign + Sound & Celebrations** - 2x2 hub menu, answer sounds, streak confetti
- [x] **Phase 20: Practice Mode** - 6-piece picker grid, unlimited adaptive drilling
- [x] **Phase 21: Checkmate Puzzle Data + Renderers** - 20 mate-in-1 positions, CheckmatePuzzle component
- [x] **Phase 22: Wire Checkmate Into Sessions** - Feature flag, Amplitude tracking, session injection
- [x] **Phase 23: Progress & Engagement Layer** - Hub mastery display, session complete breakdown

**Total:** 5 phases, 10 plans
**Archive:** `.planning/milestones/v1.4-ROADMAP.md`

</details>

### v1.5 Cloud Sync (In Progress)

**Milestone Goal:** Optional Google login with Firebase Auth that syncs all user progress across devices, with offline-first localStorage caching.

- [x] **Phase 24: Firebase Auth Foundation** - Auth context, lazy Firebase Auth init, Google sign-in/sign-out functions, iOS redirect fallback, feature flag gate (completed 2026-03-23)
- [x] **Phase 25: Sign-In UI** - Google sign-in button and user account chip in settings drawer, COPPA-compliant copy, i18n (completed 2026-03-23)
- [ ] **Phase 26: Cloud Write Path** - Sync service, debounced writes to Firebase, offline queue, security rules
- [ ] **Phase 27: Cloud Read and Merge** - First-login union merge, cross-device sync on subsequent sign-in
- [ ] **Phase 28: Polish** - Sync status indicator, offline detection note, tab-focus re-fetch

## Phase Details

### Phase 24: Firebase Auth Foundation
**Goal**: Auth infrastructure exists in the app so every other sync feature has a signed-in user to work with
**Depends on**: Phase 23
**Requirements**: AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. `useAuthContext()` is available anywhere in the app and returns `{ user, loading }` with three states: loading, null, User
  2. Calling `signInWithGoogle()` uses redirect-based flow on iOS Safari and popup on desktop (no silent failure on iPad)
  3. Auth UI only appears when `cloudSyncEnabled` Firebase Remote Config flag is on — the entire feature is invisible when the flag is off
  4. No `window is not defined` build error — Firebase Auth is lazy-loaded and never imported by server components
  5. Sign-in UI copy explicitly frames the action as a parent task (COPPA framing established before any component renders it)
**Plans:** 2/2 plans complete

Plans:
- [x] 24-01-PLAN.md — Firebase Auth singleton, cloudSyncEnabled flag, Safari proxy rewrite
- [x] 24-02-PLAN.md — useAuth hook, AuthContext provider, provider wiring, COPPA translations

### Phase 25: Sign-In UI
**Goal**: Parents can sign in and sign out from the settings drawer and see their account state
**Depends on**: Phase 24
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Parent can tap a Google sign-in button in the settings drawer and complete sign-in
  2. Parent can tap sign out from the settings drawer and return to the anonymous state
  3. When signed in, parent sees their Google avatar and display name in the settings drawer
  4. Auth section in settings drawer has Hebrew, English, and Russian translations
  5. Settings drawer renders a neutral placeholder (no flash) while auth state is still loading
**Plans:** 1/1 plans complete
**UI hint**: yes

Plans:
- [x] 25-01-PLAN.md — Auth section in settings drawer (sign-in button, avatar+name display, sign-out, loading skeleton)

### Phase 26: Cloud Write Path
**Goal**: Authenticated users' progress is continuously mirrored to Firebase so it is never lost
**Depends on**: Phase 25
**Requirements**: SYNC-01, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. After completing a learning activity while signed in, progress appears in Firebase within 60 seconds (debounced)
  2. The app continues to work fully with no errors when the device is offline — writes are queued and flush when connectivity returns
  3. A signed-out user experiences zero behavior change — no new code paths execute, no errors fire, localStorage works identically to before
  4. Firebase security rules prevent any user from reading or writing another user's progress data
**Plans:** 1/2 plans executed

Plans:
- [x] 26-01-PLAN.md — useProgressSync hook, getFirebaseDatabase export, Firebase security rules
- [ ] 26-02-PLAN.md — Wire sync into all 6 context providers (Letters, Numbers, Animals, Games, Words, Streak)

### Phase 27: Cloud Read and Merge
**Goal**: Signing in on a new device loads existing progress, and first-time sign-in never loses locally-earned progress
**Depends on**: Phase 26
**Requirements**: SYNC-02, SYNC-03
**Success Criteria** (what must be TRUE):
  1. A parent who signs in for the first time on a device with 6 weeks of local progress sees all that progress preserved — nothing is lost or reset
  2. A parent who signs in on a second device sees the same progress they earned on their first device
  3. When two devices have independent progress for the same item, the union (most progress) wins — no item is ever un-heard or un-unlocked
  4. Merge runs only once per sign-in transition (not on every page load or token refresh)
**Plans**: TBD

### Phase 28: Polish
**Goal**: Parents get clear, unobtrusive feedback about sync status and can trust their child's progress is safe
**Depends on**: Phase 27
**Requirements**: POLSH-01, POLSH-02, POLSH-03
**Success Criteria** (what must be TRUE):
  1. After a successful cloud write, a subtle "saved" indicator appears in the settings drawer for 2 seconds then disappears
  2. When the device is offline, a "progress saved locally" note is visible in the settings drawer
  3. When the user returns to the app tab after it was in the background, the app re-fetches cloud state so any progress made on another device is reflected
**Plans**: TBD

## Progress

**Execution Order:** 24 → 25 → 26 → 27 → 28

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 11/11 | Complete | 2026-03-21/22 |
| 7-10 | v1.1 | 5/5 | Complete | 2026-03-22 |
| 11-13 | v1.2 | 4/4 | Complete | 2026-03-22 |
| 14-18 | v1.3 | 10/10 | Complete | 2026-03-22 |
| 19-23 | v1.4 | 10/10 | Complete | 2026-03-23 |
| 24. Firebase Auth Foundation | v1.5 | 2/2 | Complete    | 2026-03-23 |
| 25. Sign-In UI | v1.5 | 1/1 | Complete    | 2026-03-24 |
| 26. Cloud Write Path | v1.5 | 1/2 | In Progress|  |
| 27. Cloud Read and Merge | v1.5 | 0/? | Not started | - |
| 28. Polish | v1.5 | 0/? | Not started | - |
