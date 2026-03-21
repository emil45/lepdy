---
phase: 01-foundation
plan: 01
subsystem: data
tags: [chess, i18n, typescript, next-intl, hebrew]

# Dependency graph
requires: []
provides:
  - ChessPieceConfig interface and ChessPieceId type for chess piece data
  - chessPieces array with 6 typed chess pieces (king, rook, bishop, queen, knight, pawn)
  - chessGame translation keys in all 3 locale files (he, en, ru) with pieces, levels, ui
affects: [02-board-rendering, 03-game-shell, 04-piece-intro, 05-movement-puzzles, 06-capture-puzzles]

# Tech tracking
tech-stack:
  added: []
  patterns: [chess piece data follows existing category data pattern with extended fields]

key-files:
  created:
    - data/chessPieces.ts
  modified:
    - messages/he.json
    - messages/en.json
    - messages/ru.json

key-decisions:
  - "Used Unicode chess symbols (white set U+2654-2659) for symbol field and black set (U+265A-265F) for emoji field"
  - "Chess pieces use their own ChessPieceId type instead of ModelsTypesEnum — chess is a game concept, not a learning category"

patterns-established:
  - "Chess piece data pattern: id, translationKey, audioFile, audioPath, symbol, emoji, fenChar, color, order"
  - "Translation namespace: chessGame.{pieces|levels|ui}.* for all chess-related strings"

requirements-completed: [INTG-03, INTG-06]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 01 Plan 01: Chess Piece Data and Translations Summary

**Chess piece data file with 6 typed pieces (ChessPieceConfig), Hebrew audio paths, FEN characters, and i18n translations in Hebrew/English/Russian**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T20:05:09Z
- **Completed:** 2026-03-21T20:07:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created typed chess piece data file with ChessPieceId union type and ChessPieceConfig interface
- Defined 6 chess pieces with Hebrew audio paths, Unicode symbols, FEN characters, and pastel colors
- Added chessGame translation keys to all 3 locale files with matching key structure (pieces, levels, ui)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create chess piece data file with types and audio paths** - `c982e3f` (feat)
2. **Task 2: Add chess translation keys to all 3 locale files** - `147d5f5` (feat)

## Files Created/Modified
- `data/chessPieces.ts` - Chess piece data array with ChessPieceConfig interface, ChessPieceId type, and 6 piece entries
- `messages/he.json` - Added chessGame key with Hebrew piece names, level titles, and UI strings
- `messages/en.json` - Added chessGame key with English piece names, level titles, and UI strings
- `messages/ru.json` - Added chessGame key with Russian piece names, level titles, and UI strings

## Decisions Made
- Used Unicode chess symbols (white set U+2654-2659) for `symbol` field and black set (U+265A-265F) for `emoji` field to allow rendering both white and black piece variants
- Chess pieces use their own `ChessPieceId` type instead of `ModelsTypesEnum` since chess is a game concept, not a learning category
- Introduction order follows INTRO-04: King, Rook, Bishop, Queen, Knight, Pawn

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data is fully wired with real values.

## Next Phase Readiness
- Chess piece data and translations ready for consumption by board rendering (Phase 2) and game shell (Phase 3)
- Audio files referenced in audioPath do not exist yet (placeholder paths) -- this is expected per STATE.md decision that game must work without audio files
- Hebrew piece names sourced from WordReference need verification with native speaker before audio recording (documented blocker in STATE.md)

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
