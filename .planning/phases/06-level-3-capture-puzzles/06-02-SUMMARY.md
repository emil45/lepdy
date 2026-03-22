---
phase: 06-level-3-capture-puzzles
plan: 02
subsystem: ui
tags: [chess, react, next.js, playwright, dynamic-import, e2e-tests]

# Dependency graph
requires:
  - phase: 06-01
    provides: CapturePuzzle component with onComplete/completeLevel props
  - phase: 03-02
    provides: ChessGameContent with ChessView routing and level map
provides:
  - Level 3 fully wired into ChessGameContent — CapturePuzzle renders when clicking Level 3
  - E2E smoke tests for capture puzzle flow (load, wrong tap, hint resilience)
affects: [verifier, future-chess-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dynamic import with ssr:false pattern extended to CapturePuzzle (same as MovementPuzzle)"
    - "localStorage seed pattern in E2E for completedLevels:[1,2] to unlock Level 3"

key-files:
  created:
    - .planning/phases/06-level-3-capture-puzzles/06-02-SUMMARY.md
  modified:
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - e2e/app.spec.ts

key-decisions:
  - "Removed unused Button import from ChessGameContent after eliminating Coming soon block (Rule 1 auto-fix — would have caused lint error)"

patterns-established:
  - "Level handler pattern: explicit if-blocks for each level view, no catch-all needed after all levels wired"

requirements-completed: [CAPT-01, CAPT-02, CAPT-03]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 06 Plan 02: Wire CapturePuzzle Summary

**CapturePuzzle dynamically imported and routed from ChessGameContent, Coming soon placeholder removed, 3 E2E tests cover Level 3 load/wrong-tap/hint flow**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T09:12:34Z
- **Completed:** 2026-03-22T09:15:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Wired CapturePuzzle into ChessGameContent with dynamic import (ssr: false) and explicit level-3 handler
- Removed the Coming soon placeholder block entirely — no dead code remains
- Added 3 E2E smoke tests: Level 3 loads (puzzle-progress shows 1/8), wrong tap feedback, hint resilience after 2 wrong taps
- Full E2E suite: 39/39 tests pass, production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire CapturePuzzle into ChessGameContent** - `4dd4f38` (feat)
2. **Task 2: Add E2E smoke tests for capture puzzles** - `b9ffbd3` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - Added CapturePuzzle dynamic import, level-3 view handler, removed Coming soon block and unused Button import
- `e2e/app.spec.ts` - Added Chess capture puzzles test describe block with 3 tests

## Decisions Made
- Removed unused `Button` import from ChessGameContent after eliminating the Coming soon block — auto-fixed to avoid lint errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused Button import**
- **Found during:** Task 1 (Wire CapturePuzzle)
- **Issue:** Button import from MUI was only used in the Coming soon placeholder block which was removed per plan. Leaving it would cause a lint error.
- **Fix:** Removed `import Button from '@mui/material/Button'`
- **Files modified:** `app/[locale]/games/chess-game/ChessGameContent.tsx`
- **Verification:** TypeScript compiles cleanly, lint passes on modified file
- **Committed in:** `4dd4f38` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - dead import cleanup)
**Impact on plan:** Necessary cleanup, no scope creep.

## Issues Encountered
None — plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 levels of the chess game are now fully playable end-to-end
- Level 3 capture puzzles accessible after completing Levels 1 and 2
- Full E2E test coverage for the chess game (piece introduction, movement puzzles, capture puzzles)
- Phase 06 is complete — all capture puzzle requirements CAPT-01, CAPT-02, CAPT-03 satisfied

---
*Phase: 06-level-3-capture-puzzles*
*Completed: 2026-03-22*
