---
phase: quick
plan: 260323-vhl
subsystem: chess-game
tags: [chess, ui, theming, settings, i18n, localStorage]
dependency_graph:
  requires: [hooks/useChessPieceTheme.ts (pattern reference)]
  provides: [hooks/useChessBoardTheme.ts, board color selector UI]
  affects: [MovementPuzzle.tsx, CapturePuzzle.tsx, CheckmatePuzzle.tsx, ChessSettingsDrawer.tsx]
tech_stack:
  added: []
  patterns: [localStorage persistence hook, settings drawer section]
key_files:
  created:
    - hooks/useChessBoardTheme.ts
  modified:
    - app/[locale]/games/chess-game/ChessSettingsDrawer.tsx
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - app/[locale]/games/chess-game/MovementPuzzle.tsx
    - app/[locale]/games/chess-game/CapturePuzzle.tsx
    - app/[locale]/games/chess-game/CheckmatePuzzle.tsx
    - messages/en.json
    - messages/he.json
    - messages/ru.json
decisions:
  - Board theme hook follows exact same localStorage pattern as useChessPieceTheme for consistency
  - Swatch uses top/bottom split (light on top, dark on bottom) inside rounded card for clean preview
  - Default classic theme colors match previous hardcoded values — no visual change for existing users
metrics:
  duration: ~10 min
  completed_date: "2026-03-23T20:49:18Z"
  tasks_completed: 2
  files_modified: 8
---

# Quick Task 260323-vhl: Add Board Color Theme Selector to Chess Game Summary

**One-liner:** Board color theme selector with 4 themes (classic, ocean, candy, forest) persisted via localStorage and wired to all 3 puzzle types.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useChessBoardTheme hook and update puzzle components | cd4ee11 | hooks/useChessBoardTheme.ts, MovementPuzzle.tsx, CapturePuzzle.tsx, CheckmatePuzzle.tsx |
| 2 | Add board theme section to settings drawer and i18n strings | fd81a34 | ChessSettingsDrawer.tsx, ChessGameContent.tsx, messages/en.json, messages/he.json, messages/ru.json |

## What Was Built

### useChessBoardTheme hook (`hooks/useChessBoardTheme.ts`)

Follows the exact same pattern as `useChessPieceTheme`:
- `BoardThemeName` type union: `'classic' | 'ocean' | 'candy' | 'forest'`
- `BOARD_THEMES` record mapping each name to `{ light: string; dark: string }` colors
- `BOARD_THEME_NAMES` array for iteration
- localStorage key `lepdy_chess_board_theme` with try-catch error handling
- Returns `{ boardTheme, boardColors, selectBoardTheme }`

Color values:
- `classic`: `#f5ede1` / `#dbc3e2` (beige/lavender — matches previous hardcoded values)
- `ocean`: `#dce9f5` / `#7baed4` (light blue / medium blue)
- `candy`: `#fce4ec` / `#f48fb1` (pink pastel / hot pink)
- `forest`: `#e8f5e9` / `#81c784` (mint / green)

### Settings Drawer UI

Added board color section below existing piece theme section. Each theme displayed as:
- A `100x60` rounded card split into two horizontal halves (light color top, dark color bottom)
- Theme name label below the card
- Selected state: `3px solid #f0003c` border; unselected: `2px solid #e0e0e0`
- `ChessSettingsDrawer` now accepts `currentBoardTheme` and `onSelectBoardTheme` props

### Puzzle Components

All 3 puzzle types now call `useChessBoardTheme()` and pass `boardColors.light` / `boardColors.dark` to the `Chessboard` component's `lightSquareStyle` / `darkSquareStyle` options.

### i18n (he, en, ru)

Added under `chessGame.settings`: `boardTheme`, `board_classic`, `board_ocean`, `board_candy`, `board_forest`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `hooks/useChessBoardTheme.ts` — FOUND
- `app/[locale]/games/chess-game/ChessSettingsDrawer.tsx` — modified with board theme section
- Commits cd4ee11 and fd81a34 — FOUND
- TypeScript compiles cleanly — PASSED
- Production build passes — PASSED
