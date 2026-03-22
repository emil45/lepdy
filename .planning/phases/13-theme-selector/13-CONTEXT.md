# Phase 13: Theme Selector - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a settings drawer to the chess game with a piece theme selector that lets users switch between available themes, with the choice persisted across sessions.

</domain>

<decisions>
## Implementation Decisions

### Settings UI
- Gear icon in top-right corner of the chess main page (LevelMap) — consistent with Lepdy's home settings pattern
- MUI Drawer component (bottom sheet on mobile) — matches existing Lepdy SettingsDrawer pattern
- Theme selector shows visual thumbnails with a sample piece (knight) from each theme — tap to select, instant visual identification
- Each thumbnail shows a knight piece from the respective theme for quick recognition

### Behavior
- Theme switches immediately on tap — no "save" button, `selectTheme()` already persists to localStorage
- Selected theme gets a colored border (using Lepdy's primary color `#f0003c`), unselected themes have subtle gray border
- Add i18n translation keys: "Piece Theme" section header, "Classic" for staunty, "Playful" for horsey — in all 3 locales (he, en, ru)

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/SettingsDrawer.tsx` — existing Lepdy settings drawer on home page (reference for pattern)
- `hooks/useChessPieceTheme.ts` — already provides `{ theme, pieces, selectTheme }` with localStorage persistence
- `app/[locale]/games/chess-game/pieceThemes.tsx` — exports `ThemeName`, `PIECE_CODES`, `pieceThemes` record
- MUI `Drawer`, `IconButton`, `Box` components

### Established Patterns
- Settings gear icon in `HomeHeader.tsx` using MUI `IconButton` + `SettingsIcon`
- Drawer with `anchor="right"` (or "left" for RTL) pattern in SettingsDrawer
- Chess game uses `useChessPieceTheme` hook in all 3 components (MovementPuzzle, CapturePuzzle, PieceIntroduction)

### Integration Points
- Chess game main page: `app/[locale]/games/chess-game/ChessGameContent.tsx` (or equivalent LevelMap component)
- `useChessPieceTheme` hook — already has `selectTheme(name)` API
- Theme names available from `pieceThemes.tsx` exports
- SVG thumbnails at `public/chess/pieces/{theme}/wN.svg` (knight for preview)
- Translation files: `messages/he.json`, `messages/en.json`, `messages/ru.json`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches using the accepted patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
