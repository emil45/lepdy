# Phase 11: Board Theme - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the default react-chessboard brown/beige square colors with Lepdy's pastel palette, and style coordinate labels to complement the new board look.

</domain>

<decisions>
## Implementation Decisions

### Board Square Colors
- Light squares use beigePastel (`#f5ede1`) from Lepdy's existing theme palette
- Dark squares use purplePastel (`#dbc3e2`) from Lepdy's existing theme palette
- Use exact palette values (no tinted variants) — consistency with existing Lepdy UI
- Update highlight colors (valid moves, selected square) to complement the new pastel pair — softer green/yellow highlights instead of react-chessboard defaults

### Coordinate Labels
- Label color: blackPastel (`#434243`) at ~50% opacity — readable on both light and dark squares without being distracting
- Coordinates shown (not hidden) — chess learning context, kids need to learn notation
- Default react-chessboard font size — age-appropriate for learning context

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `theme/theme.ts` — Lepdy pastel palette with `palette.colors.beigePastel`, `palette.colors.purplePastel`, `palette.colors.blackPastel`
- `react-chessboard` component used in `MovementPuzzle.tsx` and `CapturePuzzle.tsx` with `options` prop for styling

### Established Patterns
- Board wrapped in `<Box sx={{ direction: 'ltr' }}>` for RTL safety
- Board width managed via state + container ref (responsive 320px-480px)
- `squareStyles` object used for highlight overlays (valid moves, selected)
- `boardStyle` prop controls board container sizing

### Integration Points
- `MovementPuzzle.tsx` — Chessboard component at line ~242
- `CapturePuzzle.tsx` — Chessboard component at line ~227
- Both use `customBoardStyle`, `squareStyles` via `options` prop
- react-chessboard supports `customDarkSquareStyle` and `customLightSquareStyle` props for square colors

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches using the accepted color pair.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
