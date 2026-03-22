# Phase 12: Custom Piece SVGs - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the default react-chessboard piece renders with kid-friendly SVG designs from lichess, delivered through an extensible theme architecture supporting staunty and horsey themes.

</domain>

<decisions>
## Implementation Decisions

### SVG Sourcing & File Organization
- SVG files stored in `public/chess/pieces/{theme-name}/` (e.g., `public/chess/pieces/staunty/wK.svg`)
- FEN piece key naming: `wK.svg`, `wQ.svg`, `wR.svg`, `wB.svg`, `wN.svg`, `wP.svg`, `bK.svg`, `bQ.svg`, `bR.svg`, `bB.svg`, `bN.svg`, `bP.svg` (12 files per theme)
- SVGs sourced from lichess GitHub repo (`lichess-org/lila`) and committed to the project — no external CDN dependency
- SVGs used as-is from lichess — already optimized for web chess rendering

### Theme Architecture
- Single `pieceThemes.ts` file in the chess-game directory exporting a `Record<ThemeName, PieceTheme>` — theme name maps to a loader function returning `PieceRenderObject`
- Themes load SVGs via dynamic `<img>` tags wrapping public/ paths — simple, browser-cacheable
- Staunty is the default theme
- Adding a new theme requires only: dropping 12 SVGs in `public/chess/pieces/{name}/` and adding one entry to the themes registry (PIECE-04)

### Integration
- New `useChessPieceTheme` hook with localStorage persistence — keeps theme selection separate from game progress
- Pieces passed via the `pieces` prop on `<Chessboard options={{ pieces: ... }}>` — react-chessboard's built-in `PieceRenderObject` API
- All 3 chess components get themed pieces: MovementPuzzle, CapturePuzzle, and PieceIntroduction — consistent piece appearance everywhere

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `react-chessboard` `pieces` prop accepts `PieceRenderObject = Record<string, (props?) => JSX.Element>` where keys are FEN strings (wK, wQ, etc.)
- `data/chessPieces.ts` — existing piece config with ids matching FEN notation
- `theme/theme.ts` — Lepdy pastel palette (for any theme-related styling)

### Established Patterns
- Chess game components in `app/[locale]/games/chess-game/`
- Hooks pattern: custom hooks in chess-game directory (e.g., useChessProgress)
- localStorage persistence via custom hooks with try-catch error handling
- Chessboard component uses `options` prop object for all configuration

### Integration Points
- `MovementPuzzle.tsx` — Chessboard at line ~242, needs `pieces` prop
- `CapturePuzzle.tsx` — Chessboard at line ~227, needs `pieces` prop
- `PieceIntroduction.tsx` — displays pieces for learning, needs themed piece display
- `react-chessboard` types: `PieceRenderObject` from `node_modules/react-chessboard/dist/types.d.ts`

</code_context>

<specifics>
## Specific Ideas

- Lichess piece SVGs: staunty theme at `lichess-org/lila/public/piece/staunty/` and horsey at `lichess-org/lila/public/piece/horsey/`
- react-chessboard PieceRenderObject type: `Record<string, (props?: { fill?: string; square?: string; svgStyle?: React.CSSProperties }) => React.JSX.Element>`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
