---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useChessBoardTheme.ts
  - app/[locale]/games/chess-game/ChessSettingsDrawer.tsx
  - app/[locale]/games/chess-game/MovementPuzzle.tsx
  - app/[locale]/games/chess-game/CapturePuzzle.tsx
  - app/[locale]/games/chess-game/CheckmatePuzzle.tsx
  - messages/en.json
  - messages/he.json
  - messages/ru.json
autonomous: true
requirements: [QUICK-BOARD-THEME]

must_haves:
  truths:
    - "User can select a board color theme from chess settings drawer"
    - "Selected board color theme persists across page reloads"
    - "All 3 puzzle types render with the selected board colors"
  artifacts:
    - path: "hooks/useChessBoardTheme.ts"
      provides: "Board color theme state and persistence"
      exports: ["useChessBoardTheme", "BoardThemeName", "BOARD_THEMES"]
    - path: "app/[locale]/games/chess-game/ChessSettingsDrawer.tsx"
      provides: "Board theme selector UI"
  key_links:
    - from: "hooks/useChessBoardTheme.ts"
      to: "MovementPuzzle.tsx, CapturePuzzle.tsx, CheckmatePuzzle.tsx"
      via: "useChessBoardTheme() hook call"
      pattern: "useChessBoardTheme"
---

<objective>
Add a board color theme selector to the chess game settings drawer, offering 4 fun color schemes for the chessboard squares. Follow the exact same pattern as the existing piece theme selector (useChessPieceTheme hook + localStorage persistence + settings drawer UI).

Purpose: Let kids personalize their chess board appearance alongside piece themes.
Output: New hook, updated settings drawer with board color section, updated puzzle components.
</objective>

<execution_context>
@/Users/emil/code/lepdy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/emil/code/lepdy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useChessPieceTheme.ts
@app/[locale]/games/chess-game/ChessSettingsDrawer.tsx
@app/[locale]/games/chess-game/MovementPuzzle.tsx
@app/[locale]/games/chess-game/CapturePuzzle.tsx
@app/[locale]/games/chess-game/CheckmatePuzzle.tsx

<interfaces>
<!-- Existing piece theme hook pattern to follow exactly -->
From hooks/useChessPieceTheme.ts:
```typescript
const STORAGE_KEY = 'lepdy_chess_piece_theme';

export interface UseChessPieceThemeReturn {
  theme: ThemeName;
  pieces: PieceRenderObject;
  selectTheme: (name: ThemeName) => void;
}

export function useChessPieceTheme(): UseChessPieceThemeReturn { ... }
```

From ChessSettingsDrawer.tsx:
```typescript
interface ChessSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  currentTheme: ThemeName;
  onSelectTheme: (name: ThemeName) => void;
}
```

Current hardcoded board colors in all 3 puzzle components:
```typescript
lightSquareStyle: { backgroundColor: '#f5ede1' },
darkSquareStyle: { backgroundColor: '#dbc3e2' },
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useChessBoardTheme hook and update puzzle components</name>
  <files>hooks/useChessBoardTheme.ts, app/[locale]/games/chess-game/MovementPuzzle.tsx, app/[locale]/games/chess-game/CapturePuzzle.tsx, app/[locale]/games/chess-game/CheckmatePuzzle.tsx</files>
  <action>
Create `hooks/useChessBoardTheme.ts` following the exact same pattern as `hooks/useChessPieceTheme.ts`:

1. Define `BoardThemeName` type union with 4 themes: `'classic' | 'ocean' | 'candy' | 'forest'`
2. Define `BOARD_THEMES` record mapping each theme name to `{ light: string; dark: string }` colors:
   - `classic`: `{ light: '#f5ede1', dark: '#dbc3e2' }` (current default — beige/lavender)
   - `ocean`: `{ light: '#dce9f5', dark: '#7baed4' }` (light blue / medium blue)
   - `candy`: `{ light: '#fce4ec', dark: '#f48fb1' }` (pink pastel / hot pink)
   - `forest`: `{ light: '#e8f5e9', dark: '#81c784' }` (mint / green)
3. Export `BOARD_THEME_NAMES` array: `['classic', 'ocean', 'candy', 'forest']`
4. Hook state: `useState<BoardThemeName>('classic')`, localStorage key `'lepdy_chess_board_theme'`
5. Return `{ boardTheme, boardColors, selectBoardTheme }` where `boardColors` is `BOARD_THEMES[boardTheme]`
6. Same localStorage load/save pattern with try-catch as useChessPieceTheme

Then update all 3 puzzle components (MovementPuzzle.tsx, CapturePuzzle.tsx, CheckmatePuzzle.tsx):
- Add `import { useChessBoardTheme } from '@/hooks/useChessBoardTheme';`
- Call `const { boardColors } = useChessBoardTheme();` alongside existing `useChessPieceTheme()` call
- Replace hardcoded `lightSquareStyle: { backgroundColor: '#f5ede1' }` with `lightSquareStyle: { backgroundColor: boardColors.light }`
- Replace hardcoded `darkSquareStyle: { backgroundColor: '#dbc3e2' }` with `darkSquareStyle: { backgroundColor: boardColors.dark }`
  </action>
  <verify>
    <automated>cd /Users/emil/code/lepdy && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Hook created, all 3 puzzle components use dynamic board colors from hook, TypeScript compiles cleanly</done>
</task>

<task type="auto">
  <name>Task 2: Add board theme section to settings drawer and i18n strings</name>
  <files>app/[locale]/games/chess-game/ChessSettingsDrawer.tsx, app/[locale]/games/chess-game/ChessGameContent.tsx, messages/en.json, messages/he.json, messages/ru.json</files>
  <action>
1. Update ChessSettingsDrawer props to accept board theme state:
   - Add `currentBoardTheme: BoardThemeName` and `onSelectBoardTheme: (name: BoardThemeName) => void` to the props interface
   - Import `BoardThemeName, BOARD_THEMES, BOARD_THEME_NAMES` from `@/hooks/useChessBoardTheme`

2. Add a board theme section BELOW the existing piece theme section in the drawer:
   - Add a section header Typography: `{t('settings.boardTheme')}` with same styling as the pieceTheme header
   - Add a row of 4 color swatches (similar layout to piece theme thumbnails):
     - Each swatch is a Box with `width: 100, height: 60`, `borderRadius: '12px'`
     - Split each swatch into two halves showing light color (top/left) and dark color (bottom/right) — use a simple diagonal or two-row split to preview both colors
     - Selected state: `border: '3px solid #f0003c'`, unselected: `border: '2px solid #e0e0e0'`
     - Theme name label below each swatch using `{t(`settings.board_${name}`)}`
     - onClick calls `onSelectBoardTheme(name)`

3. Update ChessGameContent.tsx:
   - Import and call `useChessBoardTheme()`
   - Pass `boardTheme` and `selectBoardTheme` to ChessSettingsDrawer as `currentBoardTheme` and `onSelectBoardTheme`

4. Add i18n strings to all 3 message files under `chessGame.settings`:

   en.json — add after "xkcd" line:
   ```
   "boardTheme": "Board Colors",
   "board_classic": "Classic",
   "board_ocean": "Ocean",
   "board_candy": "Candy",
   "board_forest": "Forest"
   ```

   he.json — add after the Hebrew "xkcd" equivalent:
   ```
   "boardTheme": "צבעי לוח",
   "board_classic": "קלאסי",
   "board_ocean": "אוקיינוס",
   "board_candy": "סוכריה",
   "board_forest": "יער"
   ```

   ru.json — add after the Russian "xkcd" equivalent:
   ```
   "boardTheme": "Цвета доски",
   "board_classic": "Классика",
   "board_ocean": "Океан",
   "board_candy": "Конфетный",
   "board_forest": "Лес"
   ```
  </action>
  <verify>
    <automated>cd /Users/emil/code/lepdy && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Settings drawer shows board color theme section with 4 color swatches below piece themes, all 3 languages have translations, build passes</done>
</task>

</tasks>

<verification>
- `npm run build` passes without errors
- `npm run lint` passes
- Open chess game settings drawer: shows piece themes section AND board colors section
- Selecting a board color updates the chessboard in puzzles
- Refreshing the page preserves the board color selection
</verification>

<success_criteria>
- 4 board color themes selectable from settings drawer
- Board colors persist via localStorage
- All 3 puzzle types (movement, capture, checkmate) render with the selected board colors
- Default "classic" theme matches the current hardcoded colors (no visual change for existing users)
- i18n strings present for he, en, ru
</success_criteria>

<output>
After completion, create `.planning/quick/260323-vhl-add-board-color-theme-selector-to-chess-/260323-vhl-SUMMARY.md`
</output>
