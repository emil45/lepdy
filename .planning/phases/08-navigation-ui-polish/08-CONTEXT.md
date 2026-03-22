# Phase 8: Navigation & UI Polish - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add consistent back/exit navigation to all chess game screens, fix RTL arrow direction in piece introduction, apply Lepdy's pastel visual style to chess components, and add fade transitions between views.

</domain>

<decisions>
## Implementation Decisions

### Navigation
- Small X button in top corner for exiting puzzle screens and piece introduction back to level map
- No confirmation dialog when exiting mid-puzzle — kids tap impatiently, puzzles are short and progress resets are cheap
- Same X button pattern for PieceIntroduction exit — consistent with puzzle screens
- No exit button during completion celebration screen — auto-returns to map after 3 seconds

### RTL Arrow Direction
- Use `useDirection()` hook to swap ArrowForward/ArrowBack icons in PieceIntroduction — in Hebrew (RTL), Next shows left arrow, Back shows right arrow
- MUI handles `startIcon`/`endIcon` position flipping automatically in RTL — just swap the icon components
- Progress dots order stays left-to-right (sequential progress, not reading direction)

### Visual Polish
- Use Lepdy's existing theme pastels from `theme.ts` (`palette.colors`) — consistent with the rest of the app
- Rounded corners (`borderRadius: 3-4`), soft shadows (`boxShadow: '0 2px 8px rgba(0,0,0,0.1)'`) for puzzle cards and instruction panels, matching the LevelMapCard pattern
- Wrap chess board area in a soft-shadow card with rounded corners, matching the piece introduction card style
- Keep existing layout padding and spacing (`py: 2, px: 1, maxWidth: 520`) — already consistent with Lepdy games

### Screen Transitions
- Fade transitions between map↔level view changes using MUI's `<Fade>` component (already in dependency tree, zero bundle cost)
- 300ms duration — fast enough to feel snappy, slow enough to be visible
- No transitions between puzzles within a level — only full view swaps animate

### Claude's Discretion
- Exact X button icon choice (CloseIcon vs custom)
- Exact shadow values and border radius fine-tuning
- Fade implementation details (key-based remounting vs conditional rendering)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/BackButton.tsx` — existing back button component using `RoundFunButton` + `ArrowBackIcon`, accepts `href` prop
- `hooks/useDirection.ts` — hook for getting current locale direction (RTL/LTR)
- `theme/theme.ts` — MUI theme with pastel color palette (`palette.colors`)
- MUI `Fade` component — already available, CSS-only transition

### Established Patterns
- Level map page (`ChessGameContent.tsx`) already uses `BackButton href="/games"` — this is the correct pattern for the main chess page
- `ChessGameContent` manages views via `useState<ChessView>('map')` with conditional rendering
- Level cards already use rounded corners (`borderRadius: 3`) and pastel colors
- Puzzle components receive `onComplete` callback to return to map

### Integration Points
- `ChessGameContent.tsx` — add Fade wrapper around view rendering, view-switch logic
- `PieceIntroduction.tsx` — add X exit button, fix RTL arrow icons, add soft card styling
- `MovementPuzzle.tsx` — add X exit button, add soft card styling to board/instruction areas
- `CapturePuzzle.tsx` — add X exit button, add soft card styling to board/instruction areas

</code_context>

<specifics>
## Specific Ideas

- The main chess page `BackButton` already matches other game pages (NAV-03/UI-03 already satisfied)
- `onComplete` callbacks exist on all 3 sub-views — can be reused for the X exit button

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
