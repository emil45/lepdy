---
phase: 07-bug-fixes-cleanup
plan: 01
subsystem: ui
tags: [chess, i18n, next-intl, translations, cleanup]

# Dependency graph
requires:
  - phase: 01-setup
    provides: "chess piece data structures and translation namespace established"
  - phase: 05-movement-puzzles
    provides: "MovementPuzzle.tsx and CapturePuzzle.tsx direct react-chessboard imports"
provides:
  - "Correct chess piece name display in all 3 locales (Hebrew, English, Russian)"
  - "Clean codebase with no orphaned Phase 2 chess files"
  - "Trimmed translation files with 5 unused chessGame.ui keys removed"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - data/chessPieces.ts
    - messages/he.json
    - messages/en.json
    - messages/ru.json
  deleted:
    - components/chess/ChessBoard.tsx
    - components/chess/ChessBoardDynamic.tsx
    - components/chess/useChessGame.ts

key-decisions:
  - "Orphaned Phase 2 files (ChessBoard wrapper, useChessGame) deleted — Phases 5-6 import react-chessboard directly, wrapper was never loaded in production"
  - "5 unused chessGame.ui translation keys removed (correct, hint, tapToHear, findSquare, whichCaptures) — confirmed absent from all .ts/.tsx consumers"

patterns-established: []

requirements-completed: [FIX-01, FIX-02]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 07 Plan 01: Bug Fixes & Cleanup Summary

**Fixed chess piece double-namespace translation bug and removed 3 orphaned Phase 2 files plus 5 unused i18n keys across all 3 locales**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-22T11:53:01Z
- **Completed:** 2026-03-22T11:55:34Z
- **Tasks:** 2
- **Files modified:** 4 (data + messages), 3 deleted

## Accomplishments

- Fixed raw key path display (e.g. "chessGame.pieces.king") in chess piece introduction — pieces now show translated names in Hebrew, English, and Russian
- Deleted 3 orphaned Phase 2 files (ChessBoard.tsx, ChessBoardDynamic.tsx, useChessGame.ts) that were never imported since Phase 5-6 switched to direct react-chessboard imports
- Removed 5 unused translation keys from chessGame.ui.* in all 3 locale files; 7 actively-used keys retained
- All 39 E2E tests pass; build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix translation key double-namespace in chessPieces.ts** - `9ac5f5b` (fix)
2. **Task 2: Remove orphaned files and unused translation keys** - `d636a38` (chore)

## Files Created/Modified

- `data/chessPieces.ts` - translationKey values changed from 'chessGame.pieces.X' to 'pieces.X' for all 6 pieces
- `messages/he.json` - removed correct, hint, tapToHear, findSquare, whichCaptures from chessGame.ui
- `messages/en.json` - same removals
- `messages/ru.json` - same removals
- `components/chess/ChessBoard.tsx` - deleted (orphaned)
- `components/chess/ChessBoardDynamic.tsx` - deleted (orphaned)
- `components/chess/useChessGame.ts` - deleted (orphaned)

## Decisions Made

- Confirmed no active imports of ChessBoard/ChessBoardDynamic/useChessGame before deletion (grep found zero references outside the chess/ directory itself)
- Lint errors observed are pre-existing in `.claude/get-shit-done/bin/` CJS files — out of scope per deviation scope boundary rules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07 Plan 01 complete — translation bug fixed, dead code removed
- Chess game now displays translated piece names correctly in all 3 locales
- No blockers for subsequent v1.1 polish phases

---
*Phase: 07-bug-fixes-cleanup*
*Completed: 2026-03-22*
