---
phase: 27-cloud-read-and-merge
plan: "01"
subsystem: cloud-sync
tags: [merge, progress, tdd, unit-tests, vitest]
dependency_graph:
  requires: []
  provides: [lib/mergeProgress.ts]
  affects: [hooks/useCategoryProgress.ts, hooks/useGamesProgress.ts, hooks/useStreak.ts, hooks/useWordCollectionProgress.ts]
tech_stack:
  added: [vitest]
  patterns: [pure-functions, union-merge, tdd-red-green]
key_files:
  created:
    - lib/mergeProgress.ts
    - lib/mergeProgress.test.ts
    - vitest.config.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Vitest installed as dev dependency for unit test runner (no Playwright for pure functions)"
  - "WordCollectionData re-declared in mergeProgress.ts since it is not exported from useWordCollectionProgress.ts"
  - "mergeStreak base object uses more-recent lastActivityDate side for freeze-related fields"
  - "utils/chessFen.test.ts uses custom console.log runner (not vitest) — pre-existing, out of scope"
metrics:
  duration: "147s"
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 27 Plan 01: Merge Progress Functions Summary

**One-liner:** Pure union-merge functions for all 4 progress types (category, games, word collection, streak) with 25 vitest unit tests using most-progress-wins strategy.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Set up vitest and write failing tests (RED) | 99faa6b | vitest.config.ts, lib/mergeProgress.ts (stub), lib/mergeProgress.test.ts |
| 2 | Implement all merge functions to pass tests (GREEN) | d7d1426 | lib/mergeProgress.ts (full implementation) |

## What Was Built

Four pure merge functions in `lib/mergeProgress.ts`:

- **`mergeCategoryProgress`** — unions `heardItemIds` via `new Set`, takes `Math.max` for `totalClicks`. Handles both-null case returning defaults.
- **`mergeGamesProgress`** — unions `completedGameTypes` via Set, takes `Math.max` for all 7 numeric fields.
- **`mergeWordCollection`** — Map keyed by `wordId`; for duplicates: sums `timesBuilt`, keeps earliest `firstBuiltDate`, keeps latest `lastBuiltDate`. `Math.max` for `totalWordsBuilt`.
- **`mergeStreak`** — `Math.max` for `currentStreak` and `longestStreak`. Base object (freezes, weekStartDate) taken from whichever side has the more recent `lastActivityDate`.

All functions handle `null` inputs gracefully (return the non-null side, or defaults if both null).

## Test Coverage

25 unit tests in `lib/mergeProgress.test.ts`:
- 5 for `mergeCategoryProgress`
- 7 for `mergeGamesProgress`
- 6 for `mergeWordCollection`
- 7 for `mergeStreak`

All 25 tests pass. TypeScript build succeeds with no type errors.

## Deviations from Plan

### Noted Issues (Out of Scope)

**`utils/chessFen.test.ts` uses custom console.log test runner, not vitest.**
- Vitest detects it as a test file (`.test.ts` suffix) but finds no test suite.
- This file predates this plan and is run via `npx tsx utils/chessFen.test.ts`.
- It was not broken by this plan — vitest simply can't run it.
- Deferred: add to `.gitignore` pattern exclusion or convert to vitest in a future quick task.

No plan deviations. Executed as written.

## Self-Check

- [x] `lib/mergeProgress.ts` — exists with 4 exported functions
- [x] `lib/mergeProgress.test.ts` — exists with 25 test cases
- [x] `vitest.config.ts` — exists with `@` alias
- [x] Commit 99faa6b — RED phase
- [x] Commit d7d1426 — GREEN phase
- [x] `npm run build` — passes
- [x] `npx vitest run` — 25 tests pass

## Self-Check: PASSED
