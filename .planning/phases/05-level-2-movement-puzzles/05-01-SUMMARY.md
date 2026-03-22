---
phase: 05-level-2-movement-puzzles
plan: 01
subsystem: ui
tags: [chess, react-chessboard, next-intl, confetti, i18n, puzzles]

# Dependency graph
requires:
  - phase: 04-level-1-piece-introduction
    provides: PieceIntroduction pattern (completeLevel prop, onComplete flow, Confetti usage)
  - phase: 03-game-shell
    provides: chessPieces data, chessPuzzles data, ChessGameContent wiring pattern
provides:
  - MovementPuzzle component with full 18-puzzle state machine (all 6 piece types)
  - tapToMove translation key in Hebrew, English, Russian with {piece} ICU interpolation
affects:
  - 05-02-wire-movement-puzzle (wires MovementPuzzle into ChessGameContent Level 2 slot)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ORDERED_PUZZLES module-level constant: sort chessPieces by order, flatMap movementPuzzles filtered and sorted by difficulty
    - resetFeedbackState useCallback: resets all 7 feedback state vars atomically when advancing puzzles
    - squareStyles useMemo: builds Record<string, CSSProperties> from puzzle state — piece highlight, hints, flash

key-files:
  created:
    - app/[locale]/games/chess-game/MovementPuzzle.tsx
  modified:
    - messages/he.json
    - messages/en.json
    - messages/ru.json

key-decisions:
  - "Direct Chessboard import from react-chessboard (not ChessBoard.tsx wrapper) — puzzle mode is read-only, no chess.js move execution needed"
  - "No sound on wrong tap (per FEED-02) — gentle try-again text only, no WRONG_ANSWER audio"
  - "Hints appear after 2 wrong taps (not 1 or 3) and remain visible until correct tap — per MOVE-03 and MOVE-04"
  - "completeLevel(2) called before CELEBRATION sound — matches PieceIntroduction pattern for level 1"

patterns-established:
  - "Puzzle ordering: PIECE_ORDER from chessPieces.order, then movementPuzzles filtered per pieceId sorted by difficulty"
  - "Feedback state machine: isAdvancing guard prevents double-taps during 1500ms advance delay"
  - "Wrong tap: dual timeout — 600ms clears flash, 1200ms clears try-again text"

requirements-completed: [MOVE-01, MOVE-02, MOVE-03, MOVE-04, MOVE-05, MOVE-06, FEED-01, FEED-02, FEED-03]

# Metrics
duration: 1min
completed: 2026-03-22
---

# Phase 05 Plan 01: Movement Puzzle Component Summary

**MovementPuzzle component with 18-puzzle state machine (6 pieces x 3 difficulties), correct/wrong/hint feedback loop, and tapToMove i18n key in all 3 locales**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-22T08:45:39Z
- **Completed:** 2026-03-22T08:47:34Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `MovementPuzzle.tsx` with complete puzzle state machine: idle, correct flash + confetti, wrong flash + try-again, hint dots after 2 wrong taps, level complete screen
- Ordered all 18 puzzles (3 per piece type) by chessPieces.order then difficulty — ensures King/Rook/Bishop/Queen/Knight/Pawn sequence with escalating difficulty
- Added `tapToMove` translation key with `{piece}` ICU interpolation to all 3 locale files (he/en/ru)

## Task Commits

1. **Task 1: Add tapToMove translation key to all 3 locales** - `d3a402d` (feat)
2. **Task 2: Create MovementPuzzle component with full puzzle state machine** - `a557919` (feat)

## Files Created/Modified

- `app/[locale]/games/chess-game/MovementPuzzle.tsx` - Core movement puzzle component with full state machine, board rendering, feedback, and level completion
- `messages/he.json` - Added `chessGame.ui.tapToMove` in Hebrew
- `messages/en.json` - Added `chessGame.ui.tapToMove` in English
- `messages/ru.json` - Added `chessGame.ui.tapToMove` in Russian

## Decisions Made

- Direct `Chessboard` import from `react-chessboard` instead of using `ChessBoard.tsx` wrapper — puzzle mode is read-only, chess.js move execution not needed
- No audio on wrong tap (`WRONG_ANSWER` intentionally absent) — per FEED-02 spec, gentle try-again text only
- Hints shown after 2 wrong taps (`wrongTapCount >= 2`) and remain until correct tap — green radial-gradient dots on all validTargets squares

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all puzzle data is wired from `movementPuzzles` in `data/chessPuzzles.ts`. The component is ready to be imported by Plan 05-02.

## Next Phase Readiness

- `MovementPuzzle` exports a default component with `{ onComplete, completeLevel }` props — matches PieceIntroduction interface exactly
- Plan 05-02 can dynamically import `MovementPuzzle` and wire it into `ChessGameContent` Level 2 slot without any changes to this component
- TypeScript compiles clean, no build errors

---
*Phase: 05-level-2-movement-puzzles*
*Completed: 2026-03-22*
