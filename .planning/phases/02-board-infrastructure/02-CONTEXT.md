# Phase 2: Board Infrastructure - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Source:** Auto-discuss (recommended defaults)

<domain>
## Phase Boundary

A chess board renders correctly on tablet in Hebrew RTL locale with touch-optimized square sizing and no SSR crash. This phase delivers the board component only — no game logic, no levels, no routing. The board is a reusable building block for Phases 4-6.

</domain>

<decisions>
## Implementation Decisions

### Board Sizing & Responsive Behavior
- **D-01:** Board is responsive — fills available container width up to 480px max
- **D-02:** Minimum square size is 56px (BOARD-02 requirement) — on very small screens, board scrolls horizontally rather than shrinking below this
- **D-03:** On tablet (primary device), board will be ~400-480px wide giving 50-60px squares — comfortable for children's fingers
- **D-04:** Board is always square (width === height) — react-chessboard handles this natively

### Board Color Scheme & Piece Style
- **D-05:** Use react-chessboard's default light/dark square colors — classic chess look, don't fight the library
- **D-06:** Lepdy's pastel palette applies to surrounding UI (headers, buttons, feedback), NOT to board squares
- **D-07:** Use react-chessboard's default piece set — no custom SVG pieces needed for v1

### Move Highlight Appearance
- **D-08:** Valid move squares highlighted using react-chessboard's `customSquareStyles` API
- **D-09:** Valid moves shown as semi-transparent green circles (radial gradient dot in center of square)
- **D-10:** Capture squares shown with a larger ring/border highlight to distinguish from regular moves
- **D-11:** Selected piece's square gets a distinct background color to show which piece is active

### Board Orientation in RTL
- **D-12:** Board always uses standard chess orientation — white at bottom, a-file on left
- **D-13:** Board container gets explicit `direction: ltr` to prevent RTL locale from flipping the grid (BOARD-05 requirement)
- **D-14:** Surrounding UI (labels, buttons, text) respects locale direction — only the board grid is forced LTR

### Interaction Model
- **D-15:** Tap-select then tap-destination (BOARD-04 requirement) — no drag-and-drop
- **D-16:** Tapping an empty square or opponent piece while nothing is selected does nothing
- **D-17:** Tapping a different own piece while one is selected switches selection to the new piece
- **D-18:** react-chessboard's drag is disabled; only click/tap events are used

### SSR Safety
- **D-19:** Board component loaded via `next/dynamic` with `ssr: false` to prevent hydration crash (BOARD-06 requirement)
- **D-20:** A loading placeholder (empty Box with board dimensions) shows while the dynamic import resolves

### Claude's Discretion
- Loading placeholder design (color, animation)
- Exact green shade and opacity for move highlights
- Whether to show file/rank labels on the board
- Internal component decomposition

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chess board library
- `package.json` — Check current deps; react-chessboard and chess.js need to be added
- react-chessboard v5 docs — `customSquareStyles`, `onSquareClick`, `boardWidth`, `arePiecesDraggable` props

### Existing patterns
- `app/[locale]/games/guess-game/page.tsx` + `GuessGameContent.tsx` — Server/client page split pattern to follow
- `theme/theme.ts` — `getTheme(direction)` function for RTL theme creation
- `hooks/useDirection.ts` — Direction hook to detect RTL locale
- `components/ItemCard.tsx` lines 129-139 — Example of forcing LTR direction on specific elements in RTL context
- `components/MemoryMatchCard.tsx` — Responsive sizing pattern with MUI `sx` breakpoints

### Phase 1 outputs (dependencies)
- `data/chessPieces.ts` — ChessPieceId type and piece data (used later but establishes the type system)

No external specs — requirements are fully captured in decisions above and REQUIREMENTS.md (BOARD-01 through BOARD-06).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/useDirection.ts` — Detects RTL locale, returns 'ltr' or 'rtl'
- `theme/theme.ts` getTheme() — Creates MUI theme with direction; board wrapper should use this
- MUI responsive `sx` pattern (`{ xs: val, sm: val }`) — used throughout for tablet sizing

### Established Patterns
- Game pages: `page.tsx` (server, setRequestLocale + metadata) → `*Content.tsx` (client, 'use client')
- Touch interactions: simple onClick handlers, no complex gesture libraries
- RTL override: `direction: 'ltr'` on specific containers that shouldn't flip (see ItemCard)
- No `next/dynamic` currently used — this will be the first instance

### Integration Points
- Board component will be imported by Phase 4-6 game components
- chess.js provides legal move validation (Chess class, .moves(), .move())
- react-chessboard provides rendering (Chessboard component)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard chess board with react-chessboard library defaults, optimized for kids' tablet use.

</specifics>

<deferred>
## Deferred Ideas

- Custom piece SVGs in Lepdy's art style — v2 enhancement
- Board animation (piece sliding) — not needed for v1 puzzles
- Board sound effects on move — handled in Phase 5 (FEED-01, FEED-02)
- File/rank coordinate labels — Claude's discretion, can add later if helpful

</deferred>

---

*Phase: 02-board-infrastructure*
*Context gathered: 2026-03-21 via auto-discuss*
