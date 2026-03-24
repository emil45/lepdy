---
phase: 27-cloud-read-and-merge
plan: "02"
subsystem: cloud-sync
tags: [firebase, rtdb, merge, auth, localStorage, hooks]

requires:
  - phase: 27-01
    provides: "lib/mergeProgress.ts with mergeCategoryProgress, mergeGamesProgress, mergeWordCollection, mergeStreak"
  - phase: 24-firebase-auth-foundation
    provides: "hooks/useAuth.ts with user/loading state, contexts/AuthContext.tsx"
  - phase: 26-cloud-write-path
    provides: "hooks/useProgressSync.ts, RTDB paths under users/{uid}/"

provides:
  - hooks/useMergeOnSignIn.ts — hook that detects sign-in transition and merges cloud into localStorage
  - AuthProvider now calls useMergeOnSignIn on every sign-in

affects:
  - all context providers (pick up merged localStorage data after page reload)
  - contexts/StreakContext.tsx
  - contexts/LettersProgressContext.tsx
  - contexts/NumbersProgressContext.tsx
  - contexts/AnimalsProgressContext.tsx
  - contexts/GamesProgressContext.tsx
  - contexts/WordCollectionContext.tsx

tech-stack:
  added: []
  patterns:
    - prevUidRef pattern for detecting null-to-User auth transition without re-triggering on token refresh
    - sessionStorage guard (lepdy_merge_done) for idempotent merge per uid per session
    - Promise.all for parallel RTDB reads across all 6 paths
    - page reload after merge so all React contexts re-initialize from merged localStorage

key-files:
  created:
    - hooks/useMergeOnSignIn.ts
  modified:
    - contexts/AuthContext.tsx

key-decisions:
  - "page reload (window.location.reload) chosen over context invalidation — simpler, guaranteed all 6 providers re-read localStorage, no risk of stale state"
  - "merge guard uses sessionStorage not localStorage — intentional: user should re-merge after closing and reopening the tab to catch any new cloud data written from another device"
  - "fetchCloudData returns null on failure, runMerge exits early — never partially-merge (all-or-nothing to avoid data corruption)"
  - "hook is fire-and-forget in AuthProvider — no return value needed, all state is in localStorage/sessionStorage"

requirements-completed:
  - SYNC-02
  - SYNC-03

duration: 326s
completed: "2026-03-25"
---

# Phase 27 Plan 02: Cloud Read and Merge Summary

**useMergeOnSignIn hook that fetches all 6 RTDB paths in parallel on Google sign-in, merges with localStorage using union strategy, and reloads the page to activate merged state across all context providers.**

## Performance

- **Duration:** 326s (~5.4 min)
- **Started:** 2026-03-24T23:05:31Z
- **Completed:** 2026-03-25T00:00:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `hooks/useMergeOnSignIn.ts` (217 lines) with sign-in transition detection, parallel RTDB reads, union merge, and sessionStorage idempotency guard
- Wired the hook into `AuthProvider` in `contexts/AuthContext.tsx` — fires on every genuine sign-in, no-op when signed out
- All 46 E2E tests pass, vitest 25 unit tests (Plan 27-01) still pass, build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useMergeOnSignIn hook** - `2a06eb2` (feat)
2. **Task 2: Wire useMergeOnSignIn into AuthProvider** - `7ea236d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `hooks/useMergeOnSignIn.ts` — Hook: detects null-to-User auth transition via prevUidRef, fetches all 6 RTDB paths via Promise.all, calls 4 merge functions from lib/mergeProgress, writes merged data to 6 localStorage keys, reloads page, guards against re-merge via sessionStorage
- `contexts/AuthContext.tsx` — Added `useMergeOnSignIn(authValue.user, authValue.loading)` call inside AuthProvider

## Decisions Made

- **page reload vs context invalidation**: Chose `window.location.reload()` after merge. Simpler than invalidating 6 separate contexts, guarantees all providers re-read localStorage from scratch, no risk of stale state from React reconciler.
- **sessionStorage for merge guard**: Uses `sessionStorage` (not `localStorage`) so the user re-merges after closing/reopening the tab — this catches any new cloud data from another device that arrived since last session.
- **all-or-nothing fetch**: If `fetchCloudData` fails, `runMerge` exits immediately without touching localStorage. Prevents partial merge.
- **RTDB read only, no write**: This hook only reads from RTDB. After reload, the existing `useProgressSync` hooks in each context provider write the merged localStorage back to RTDB via the debounced write path. Avoids duplicate write logic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed redundant TypeScript comparison in isSignInTransition**
- **Found during:** Task 1 (useMergeOnSignIn hook creation)
- **Issue:** TypeScript strict mode flagged `prevUid !== currentUid` as an error because the types `null | undefined` and `string` have no overlap. The condition was already guaranteed true by the preceding `(prevUid === undefined || prevUid === null)` check, making the comparison redundant.
- **Fix:** Removed the redundant `&& prevUid !== currentUid` condition from `isSignInTransition` expression.
- **Files modified:** hooks/useMergeOnSignIn.ts
- **Verification:** `npm run build` passed cleanly after fix.
- **Committed in:** 2a06eb2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug, TypeScript type error)
**Impact on plan:** Minor inline fix. No scope change.

## Issues Encountered

- **Worktree merge required:** This worktree was missing Plan 27-01 commits (mergeProgress.ts, AuthContext.tsx, useAuth.ts, etc.). Resolved by merging from main repo's `971ad86` commit before starting execution.
- **node_modules missing:** Worktree had no `node_modules`. Ran `npm install` before first build.
- **Flaky E2E test:** "Wrong tap on distractor shows try again feedback" failed once then passed on subsequent runs. Pre-existing timing flakiness unrelated to this plan.

## Next Phase Readiness

- Cloud read-and-merge path is complete: sign-in triggers fetch, merge, reload
- All 6 progress categories (letters, numbers, animals, games, words, streak) participate in merge
- Phase 27 is fully complete — merge functions (Plan 01) + merge hook wired to auth (Plan 02)
- Next: Phase 28 (cloud sync for chess progress, or milestone wrap-up)

---
*Phase: 27-cloud-read-and-merge*
*Completed: 2026-03-25*

## Self-Check

- [x] `hooks/useMergeOnSignIn.ts` — exists, 217 lines, exports `useMergeOnSignIn`
- [x] `contexts/AuthContext.tsx` — contains `import { useMergeOnSignIn }` and `useMergeOnSignIn(authValue.user, authValue.loading)`
- [x] Commit 2a06eb2 — Task 1 feat commit
- [x] Commit 7ea236d — Task 2 feat commit
- [x] `npm run build` — passes
- [x] `npm test` — 46 tests pass
- [x] `npx vitest run` — 25 merge unit tests pass

## Self-Check: PASSED
