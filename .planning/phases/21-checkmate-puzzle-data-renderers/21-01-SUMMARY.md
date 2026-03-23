---
phase: 21-checkmate-puzzle-data-renderers
plan: "01"
subsystem: chess-game
tags: [chess, puzzles, data, i18n, validation]
dependency_graph:
  requires: []
  provides: [checkmate-puzzle-data, checkmate-validation, checkmate-i18n-keys]
  affects: [data/chessPuzzles.ts, scripts/validate-puzzles.ts, messages]
tech_stack:
  added: []
  patterns: [chess.js isCheckmate validation, full 6-field FEN for checkmate positions]
key_files:
  created: []
  modified:
    - data/chessPuzzles.ts
    - scripts/validate-puzzles.ts
    - messages/he.json
    - messages/en.json
    - messages/ru.json
decisions:
  - Full 6-field FEN used for all CheckmatePuzzle entries (chess.js requires it for isCheckmate)
  - validateCheckmatePuzzle checks isCheck() first, then exactly 1 mating move, then isCheckmate() after move
  - Cross-type ID collision detection added to checkDuplicateIds()
metrics:
  duration: ~5 minutes
  completed: "2026-03-23"
  tasks_completed: 2
  files_modified: 5
---

# Phase 21 Plan 01: Checkmate Puzzle Data + Validation Summary

**One-liner:** 20 validated mate-in-1 positions (queen/rook/bishop/knight) with chess.js-verified isCheckmate() validation and Hebrew/English/Russian i18n keys.

## What Was Built

### Task 1: CheckmatePuzzle Interface + 20 Puzzle Entries

Added `CheckmatePuzzle` interface to `data/chessPuzzles.ts` alongside existing `MovementPuzzle` and `CapturePuzzle` interfaces. Interface includes:
- `id`, `fen` (full 6-field FEN), `correctMove` (SAN), `matingPieceId`, `matingPieceSquare`, `targetSquare`, `difficulty`

Added 20 puzzle entries covering 4 piece types (5 each):
- **Queen (5):** Back-rank mate, long diagonal, lateral box, queen captures defender, step-back mate
- **Rook (5):** Classic back-rank, back-rank with capture, rook endgame push, d-file back-rank, corner step
- **Bishop (5):** Bishop+Rook corner trap (a8), mirror on h-file, farther bishop approach (a8), mirror h-file, longer diagonal
- **Knight (5):** Classic smothered (Nxf7), smothered with bishop blocker, arabesque variant (Ne7), smothered with black knight, knight captures e7 pawn

All 20 entries use full 6-field FEN as required for chess.js validation.

### Task 2: Validation Script Extension + Translation Keys

Extended `scripts/validate-puzzles.ts`:
- Added `validateCheckmatePuzzle()` function — checks not-in-check start, exactly 1 mating move, correct from/to squares, isCheckmate() after move
- Added checkmate puzzles section to `main()` with PASS/FAIL logging
- Updated `checkDuplicateIds()` to include checkmate IDs and detect cross-type collisions
- Added pool count checks for checkmate puzzles (total >= 20, per mating piece >= 5)

Added translation keys under `chessGame.ui` in all 3 locale files:
- `chessmate`: "!שח מט" / "Checkmate!" / "Мат!"
- `tapToCheckmate`: instruction text in Hebrew/English/Russian

## Verification

- `npx tsx scripts/validate-puzzles.ts` exits 0: 115 puzzles checked (61 movement + 34 capture + 20 checkmate), 0 errors, 0 warnings
- All 20 checkmate puzzles print PASS
- ESLint passes on all modified TypeScript files

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 2cad505 | feat(21-01): add CheckmatePuzzle interface and 20 mate-in-1 puzzle entries |
| 2 | fb16903 | feat(21-01): extend validation script for checkmate puzzles and add i18n keys |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — data layer is complete. Plan 02 will build the CheckmatePuzzle.tsx renderer that consumes this data.

## Self-Check: PASSED

- `data/chessPuzzles.ts` exists and contains `CheckmatePuzzle` interface and `checkmatePuzzles` array
- `scripts/validate-puzzles.ts` contains `isCheckmate` and `checkmatePuzzles`
- `messages/he.json`, `messages/en.json`, `messages/ru.json` all contain `tapToCheckmate`
- Commits 2cad505 and fb16903 verified in git log
