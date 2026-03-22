---
phase: 06-level-3-capture-puzzles
plan: 01
subsystem: ui
tags: [chess, react, next-intl, react-chessboard, mui, typescript]

# Dependency graph
requires:
  - phase: 05-level-2-movement-puzzles
    provides: MovementPuzzle component pattern, board rendering via direct Chessboard import, state machine design
  - phase: 01-foundation
    provides: chessPieces data with ChessPieceId type
  - phase: 06-level-3-capture-puzzles (06-CONTEXT.md)
    provides: capturePuzzles data with CapturePuzzle interface

provides:
  - CapturePuzzle.tsx component — board with target ring, correct/wrong tap handling, hint after 2 wrong taps, enhanced completion screen
  - targetPieceId field on CapturePuzzle interface and all 8 puzzle records
  - tapToCapture and learnedChess translation keys in he/en/ru

affects:
  - 06-02 (integration — ChessGameContent wires CapturePuzzle into Level 3 routing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CapturePuzzle follows exact MovementPuzzle state machine (puzzleIndex, wrongTapCount, showHints, flashSquare, flashType, showTryAgain, isAdvancing, isComplete, showCorrectConfetti)
    - targetPieceId derived from FEN at targetSquare for display in instruction text
    - wrongTapCount tracked functionally inside setState callback — no external read needed, use [, setter] destructure to suppress lint warning

key-files:
  created:
    - app/[locale]/games/chess-game/CapturePuzzle.tsx
  modified:
    - data/chessPuzzles.ts
    - messages/he.json
    - messages/en.json
    - messages/ru.json

key-decisions:
  - "targetPieceId derived from FEN analysis at targetSquare — pawn x6 (difficulty 1), queen x1 and rook x1 (difficulty 2)"
  - "wrongTapCount uses [, setter] destructure since count only needed functionally inside setState callback — avoids lint no-unused-vars warning"
  - "CapturePuzzle ignores empty square taps (not in distractorSquares and not correctPieceSquare) — cleaner than MovementPuzzle which had simpler hit detection"

patterns-established:
  - "CapturePuzzle state machine: same as MovementPuzzle — copy pattern for any future puzzle types"
  - "Target ring via boxShadow inset — non-destructive overlay that preserves square color underneath"
  - "Hint ring via boxShadow inset on correctPieceSquare — activated after 2 wrong taps"

requirements-completed: [CAPT-01, CAPT-02, CAPT-03, CAPT-04]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 6 Plan 01: CapturePuzzle component and data for Level 3 Summary

**CapturePuzzle component with target-ring board rendering, correct/wrong tap state machine, green hint after 2 wrong taps, and enhanced "You learned chess!" completion screen — plus targetPieceId on all 8 puzzle records and tapToCapture/learnedChess i18n keys**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T09:09:07Z
- **Completed:** 2026-03-22T09:11:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `targetPieceId: ChessPieceId` field to `CapturePuzzle` interface and populated all 8 puzzle records (pawn x6 for difficulty-1 puzzles, queen x1 and rook x1 for difficulty-2 puzzles)
- Created `CapturePuzzle.tsx` (230 lines) with full state machine: correct tap triggers confetti + advance, wrong tap triggers orange flash + try-again text + green glow hint after 2 wrong taps, empty square taps are silently ignored
- Added `tapToCapture` and `learnedChess` translation keys to all 3 locales (he/en/ru), with the Level 3 completion screen showing both `levelComplete` and `learnedChess` messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Add targetPieceId to CapturePuzzle data and translation keys** - `b8cb208` (feat)
2. **Task 2: Build CapturePuzzle component** - `f6a4c2c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `app/[locale]/games/chess-game/CapturePuzzle.tsx` - Capture puzzle gameplay component with board rendering, state machine, correct/wrong/empty tap handling, hint system, and enhanced completion screen
- `data/chessPuzzles.ts` - Added `targetPieceId` field to `CapturePuzzle` interface and all 8 puzzle records
- `messages/he.json` - Added `tapToCapture` and `learnedChess` keys under `chessGame.ui`
- `messages/en.json` - Added `tapToCapture` and `learnedChess` keys under `chessGame.ui`
- `messages/ru.json` - Added `tapToCapture` and `learnedChess` keys under `chessGame.ui`

## Decisions Made

- `targetPieceId` derived from FEN analysis at `targetSquare`: all 6 difficulty-1 puzzles use a pawn as target; difficulty-2 puzzles use queen (`capture-rook-2`) and rook (`capture-knight-2`) as targets — increases challenge progression
- `wrongTapCount` uses `[, setter]` destructure pattern since the count is only needed functionally inside the `setState` callback (to decide when to show hints), not in JSX render — this eliminates the `@typescript-eslint/no-unused-vars` lint warning
- `CapturePuzzle` ignores clicks on squares that are neither `correctPieceSquare` nor in `distractorSquares` (empty squares get no feedback) — correct for capture puzzles where only named piece squares are meaningful taps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — all puzzle data is fully populated, translation keys are wired, component renders live board data.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `CapturePuzzle.tsx` is ready to be wired into `ChessGameContent.tsx` in plan 06-02
- The component exports `default function CapturePuzzle({ onComplete, completeLevel })` — same props contract as `MovementPuzzle`
- All 8 puzzles sorted by difficulty (6 at difficulty 1, then 2 at difficulty 2)

---
*Phase: 06-level-3-capture-puzzles*
*Completed: 2026-03-22*
