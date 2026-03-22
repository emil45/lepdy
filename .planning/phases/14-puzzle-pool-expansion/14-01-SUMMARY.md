---
phase: 14-puzzle-pool-expansion
plan: 01
subsystem: testing
tags: [chess, chess.js, validation, puzzles, typescript]

requires:
  - phase: 13-theme-selector
    provides: chess game with puzzle system in data/chessPuzzles.ts

provides:
  - scripts/validate-puzzles.ts — chess.js-based puzzle validation script with getValidTargets()
  - Fixed capture-rook-1 puzzle (bishop moved from c3 to c2)

affects:
  - 14-02 (puzzle authoring — all new puzzles must pass this validation script)
  - 15-puzzle-session (puzzle session hook uses the same puzzle data)

tech-stack:
  added: []
  patterns:
    - "Dummy-king FEN pattern: insert K at a1/h1 and k at h8/a8 (preferring squares the piece cannot reach) to satisfy chess.js king requirement without blocking valid moves"
    - "Exclude dummy king squares from move comparison: when a dummy king must sit on a reachable square, those squares are excluded from both sides of the comparison"
    - "Warnings for count shortfalls (not errors): pool counts below targets are expected during expansion; script distinguishes errors (bad puzzles) from warnings (incomplete pool)"

key-files:
  created:
    - scripts/validate-puzzles.ts
  modified:
    - data/chessPuzzles.ts

key-decisions:
  - "Dummy king placement prefers squares the piece cannot reach to avoid blocking valid moves; falls back to any free corner with dummy-square exclusion from comparison"
  - "Count shortfall warnings (not errors) — pool is intentionally small until Plan 02"

patterns-established:
  - "Run npx tsx scripts/validate-puzzles.ts after any puzzle authoring to catch bugs before commit"
  - "All puzzle IDs in capture/movement arrays must be unique (script enforces this)"

requirements-completed:
  - PGEN-01
  - PGEN-02

duration: 5min
completed: 2026-03-22
---

# Phase 14 Plan 01: Puzzle Validation Script Summary

**chess.js-based puzzle validation script that catches ambiguous distractors and validTarget mismatches, plus fixed capture-rook-1 bug (bishop c3 to c2)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T19:15:00Z
- **Completed:** 2026-03-22T19:19:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `scripts/validate-puzzles.ts` using chess.js `moves()` as the authoritative movement source — no hand-rolled movement tables
- Correctly detected the pre-existing capture-rook-1 ambiguous distractor (bishop c3 can reach a5 via b4) during Task 1 run
- Fixed capture-rook-1 by moving bishop to c2 — all 26 existing puzzles now pass with 0 errors
- Script validates movement puzzle validTargets, capture puzzle solvability, pool count minimums, and duplicate IDs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create puzzle validation script** - `adec8b7` (feat)
2. **Task 2: Fix capture-rook-1 ambiguous distractor** - `87e4def` (fix)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `scripts/validate-puzzles.ts` — Validation script using chess.js dummy-king pattern; validates all 26 existing puzzles; detects capture-rook-1 bug
- `data/chessPuzzles.ts` — Fixed capture-rook-1: FEN changed from `'8/8/8/p7/8/2B5/8/R7'` to `'8/8/8/p7/8/8/2B5/R7'`, distractorSquares from `['c3']` to `['c2']`

## Decisions Made

**Dummy king placement strategy:** The RESEARCH.md suggests placing dummy kings at a1/h1 and h8/a8, but this blocks moves for pieces that can reach those corners (e.g., rook at a1, queen at a1). Implemented a smart finder that prefers corners unreachable by the piece, then falls back with dummy-square exclusion in the comparison. This correctly handles all 18 existing movement puzzles without false failures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dummy king corner blocking valid moves for rook-move-2 and queen-move-2**
- **Found during:** Task 1 (Create validation script)
- **Issue:** The simple "place dummy king at a1 or h1" approach blocked h1 for rook-move-2 (rook on a1) and queen-move-2 (queen on a1), causing false FAIL on those puzzles
- **Fix:** Added `findSafeKingCorner()` that prefers unreachable corners; added dummy-square exclusion in movement puzzle comparison so forced-corner dummy kings don't cause false failures
- **Files modified:** scripts/validate-puzzles.ts
- **Verification:** All 18 movement puzzles pass; capture-rook-1 correctly still FAILs (task 1 done criteria satisfied)
- **Committed in:** adec8b7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (bug in validation logic)
**Impact on plan:** Required fix was internal to the validation script logic. No scope creep. All acceptance criteria met.

## Issues Encountered
- Dummy king placement in the research pattern blocked valid moves in 5 movement puzzles on first run. Fixed by preferring unreachable corners with fallback exclusion. Validated fix restores all 18 movement puzzles to PASS.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Validation script is ready for Plan 02 puzzle authoring — every new puzzle must pass `npx tsx scripts/validate-puzzles.ts`
- capture-rook-1 fixed — no ambiguous puzzles in the current pool
- Count warnings for the current pool (18/60 movement, 8/30 capture) are expected and will be resolved in Plan 02

---
*Phase: 14-puzzle-pool-expansion*
*Completed: 2026-03-22*
