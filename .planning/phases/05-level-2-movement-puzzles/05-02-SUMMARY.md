---
phase: 05-level-2-movement-puzzles
plan: 02
subsystem: ui
tags: [chess, react, playwright, dynamic-import, e2e]

# Dependency graph
requires:
  - phase: 05-01
    provides: MovementPuzzle component with onComplete/completeLevel props interface
  - phase: 04-01
    provides: PieceIntroduction wiring pattern for level view routing
  - phase: 03-02
    provides: ChessGameContent view routing with ChessView union type

provides:
  - Level 2 fully playable from the chess game level map via dynamic import
  - E2E smoke tests covering puzzle board render, wrong-tap feedback, and hint activation
affects: [06-level-3-capture-puzzles]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dynamic import with ssr:false for Chessboard-dependent components"
    - "level view branch pattern: if (currentView === 'level-N') return <Component ... />"

key-files:
  created:
    - .planning/phases/05-level-2-movement-puzzles/05-02-SUMMARY.md
  modified:
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - e2e/app.spec.ts

key-decisions:
  - "dynamic import with ssr:false for MovementPuzzle — required because react-chessboard renders Chessboard directly (SSR-unsafe)"
  - "Level-2 branch inserted before generic coming-soon fallback — level-3 continues to use fallback until Phase 6"

patterns-established:
  - "Level wiring pattern: add dynamic import, add if-branch mirroring level-1 pattern"

requirements-completed: [MOVE-01, MOVE-02, MOVE-03, MOVE-04, MOVE-05, MOVE-06, FEED-01, FEED-02, FEED-03]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 5 Plan 02: Wire MovementPuzzle + E2E Tests Summary

**Level 2 wired into chess game shell via dynamic SSR-safe import, with 3 E2E smoke tests covering puzzle board render, wrong-tap feedback, and hint activation after 2 wrong taps**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T08:49:19Z
- **Completed:** 2026-03-22T08:53:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- MovementPuzzle wired into ChessGameContent with dynamic import (ssr: false) mirroring PieceIntroduction pattern
- Level 2 card on the map now opens the full movement puzzle flow
- 3 E2E smoke tests added covering: board renders with progress counter, wrong tap shows feedback, hint appears after 2 wrong taps
- All 11 chess E2E tests pass (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire MovementPuzzle into ChessGameContent** - `2f4777d` (feat)
2. **Task 2: Add E2E smoke tests for chess movement puzzles** - `6d7a73a` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - Added dynamic import + level-2 view branch
- `e2e/app.spec.ts` - Added `Chess movement puzzles` describe block with 3 tests

## Decisions Made
- Used dynamic import with `ssr: false` for MovementPuzzle — same requirement as ChessBoard.tsx (react-chessboard is not SSR-safe)
- Level-3 generic "Coming soon" fallback kept as-is — Phase 6 will wire capture puzzles

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Level 2 fully playable and tested
- Phase 6 (capture puzzles) can wire Level 3 using the identical pattern established here
- Level 3 "Coming soon" fallback remains in ChessGameContent for Phase 6 to replace

---
*Phase: 05-level-2-movement-puzzles*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: app/[locale]/games/chess-game/ChessGameContent.tsx
- FOUND: e2e/app.spec.ts
- FOUND: .planning/phases/05-level-2-movement-puzzles/05-02-SUMMARY.md
- FOUND commit: 2f4777d (feat: wire MovementPuzzle)
- FOUND commit: 6d7a73a (test: E2E smoke tests)
