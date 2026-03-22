---
phase: 14-puzzle-pool-expansion
plan: 02
subsystem: data
tags: [chess, chess.js, puzzles, typescript, data]

# Dependency graph
requires:
  - phase: 14-01
    provides: validation script (scripts/validate-puzzles.ts) and capture-rook-1 fix
provides:
  - 61 movement puzzles across 6 piece types and 3 difficulty tiers
  - 34 capture puzzles across 6 piece types and 3 difficulty tiers
  - Full puzzle pool enabling random selection without rapid repetition (PGEN-01, PGEN-02)
affects:
  - phase-15 (usePuzzleSession hook sources from this expanded pool)
  - any future phases that add puzzle selection or difficulty logic

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Movement puzzle tier system: T1=center/empty, T2=edge or 1 blocker, T3=corner/multiple blockers"
    - "Capture puzzle tier system: T1=1 distractor/obvious, T2=1-2/diagonal, T3=2-3/plausible-looking"
    - "All validTargets computed via chess.js moves() with dummy kings, never hand-calculated"
    - "New puzzle IDs follow {piece}-move-{tier}-{n} and capture-{piece}-{tier}-{n} convention"

key-files:
  created:
    - scripts/count-puzzles.ts
  modified:
    - data/chessPuzzles.ts
    - scripts/validate-puzzles.ts

key-decisions:
  - "Pawn T3 uses rank 7 position (e7->e8, 1 move) to represent a near-promotion scenario rather than an additional middle-rank puzzle"
  - "Added 4 extra T1 capture puzzles beyond the 22 required to ensure tier 1 minimum of 10"
  - "Rook on h1 used for capture-rook-2-2 (h-file clear shot) to vary target positions across puzzles"

patterns-established:
  - "Verify every distractor with chess.js before finalizing — bishop diagonals are non-obvious (capture-rook-1 bug class)"
  - "When validator uses different dummy king placement than naive script, include the target square in validTargets (e.g., a1 for queen/rook on a-file)"

requirements-completed:
  - PGEN-01
  - PGEN-02

# Metrics
duration: 15min
completed: 2026-03-22
---

# Phase 14 Plan 02: Puzzle Pool Expansion Summary

**95 chess puzzles (61 movement + 34 capture) across 6 piece types and 3 difficulty tiers, all validated by chess.js with 0 errors and 0 warnings**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-22T19:20:00Z
- **Completed:** 2026-03-22T19:35:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Expanded movement puzzles from 18 to 61 (10+ per piece, T1:24, T2:20, T3:17)
- Expanded capture puzzles from 8 to 34 (5+ per piece, T1:10, T2:14, T3:10)
- Fixed pre-existing TypeScript build error in scripts/validate-puzzles.ts (Square type casts)
- All 95 puzzles pass `npx tsx scripts/validate-puzzles.ts` with 0 errors, 0 warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Author 42 new movement puzzles across 6 pieces and 3 tiers** - `06efa7b` (feat)
2. **Task 2: Author 22 new capture puzzles across 6 pieces and 3 tiers** - `baf42b2` (feat)

## Files Created/Modified
- `data/chessPuzzles.ts` - Expanded from 18+8=26 puzzles to 61+34=95 puzzles
- `scripts/validate-puzzles.ts` - Fixed TypeScript Square type errors (pre-existing build failure)
- `scripts/count-puzzles.ts` - New dev script for reporting puzzle distribution by piece and tier

## Decisions Made
- Added 4 extra tier-1 capture puzzles beyond the 22 required (6+5+6+6+1+1=25 were needed for minimums; ended up at 34 total for better tier balance)
- Used pawn rank 7 for T3 pawn movement (near-promotion, 1 move to e8) — different concept than T2 (middle rank, 1 move)
- Kept king T2 with 4 puzzles and T3 with 3 puzzles to give king more coverage (king is frequently misunderstood by beginners)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type errors in scripts/validate-puzzles.ts**
- **Found during:** Task 1 (build verification)
- **Issue:** chess.js `moves()` `square` parameter and `includes()` called with `string` where `Square` type required — pre-existing bug from Plan 14-01 causing `npm run build` to fail
- **Fix:** Added `Square` type import from chess.js; cast `pieceSquare`, `corner`, distractor strings to `Square` at call sites
- **Files modified:** scripts/validate-puzzles.ts
- **Verification:** `npm run build` passes
- **Committed in:** 06efa7b (Task 1 commit)

**2. [Rule 1 - Bug] Corrected validTargets for 6 movement puzzles**
- **Found during:** Task 1 (first validation run)
- **Issue:** 6 movement puzzles had incorrect validTargets — rook/queen could reach corners the naive dummy-king strategy blocked; bishop blocker positions were miscounted
- **Fix:** Ran validator's exact `findSafeKingCorner` logic on each failing puzzle and added missing squares (a1 for queen/rook on a-file; removed invalid g6/h7 for bishop beyond P blocker; added a2 for bishop-move-3-3 via c4->b3->a2 diagonal)
- **Files modified:** data/chessPuzzles.ts
- **Verification:** `npx tsx scripts/validate-puzzles.ts` shows 0 errors
- **Committed in:** 06efa7b (Task 1 commit)

**3. [Rule 1 - Bug] Fixed 2 ambiguous capture puzzle distractors**
- **Found during:** Task 2 (first validation run)
- **Issue:** `capture-king-2-2` had knight on e6 that CAN reach g5 (knight e6 moves include g5). `capture-king-3-2` had rook on e7 that CAN reach c7 (same rank 7).
- **Fix:** `capture-king-2-2`: replaced with rook on e3 (cannot reach g5). `capture-king-3-2`: replaced rook with bishop on e7 (bishop e7 cannot reach c7 diagonally).
- **Files modified:** data/chessPuzzles.ts
- **Verification:** `npx tsx scripts/validate-puzzles.ts` shows 0 errors
- **Committed in:** baf42b2 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 1 pre-existing bug)
**Impact on plan:** All auto-fixes essential for correctness. No scope creep.

## Issues Encountered
- The validator's `findSafeKingCorner` algorithm places dummy kings differently than a naive "pick first free corner" strategy, causing validTargets to need squares that the naive approach would block. Required running the validator's exact algorithm to get the correct targets.

## Known Stubs
None — all puzzle data is complete and verified by chess.js.

## Next Phase Readiness
- Full puzzle pool ready for Phase 15 (`usePuzzleSession` hook implementation)
- 61 movement + 34 capture = 95 puzzles, all passing chess.js validation
- Tier distribution supports difficulty escalation logic planned for Phase 15

---
*Phase: 14-puzzle-pool-expansion*
*Completed: 2026-03-22*

## Self-Check: PASSED

- data/chessPuzzles.ts: FOUND
- scripts/validate-puzzles.ts: FOUND
- scripts/count-puzzles.ts: FOUND
- Commit 06efa7b: FOUND
- Commit baf42b2: FOUND
