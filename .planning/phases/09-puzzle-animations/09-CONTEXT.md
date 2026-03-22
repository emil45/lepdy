# Phase 9: Puzzle Animations - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add piece-sliding animations to both movement and capture puzzles. When a child taps the correct answer, the piece visibly moves to the target square before the celebration fires.

</domain>

<decisions>
## Implementation Decisions

### Movement Puzzle Animation
- Update the board FEN to place the piece at the target square — react-chessboard animates position changes automatically via its built-in `animationDurationInMs` prop (already set to 200ms)
- Timing sequence: Tap correct → set `isAdvancing` to block further taps → update FEN (piece slides ~200ms) → wait 300ms → celebration fires → advance after 1500ms total
- Original square clears when piece moves (standard chess move visual — piece disappears from origin, appears at target)

### Capture Puzzle Animation
- Same FEN-update approach — update FEN so the capturing piece is now on the target square, replacing the captured piece. react-chessboard animates this naturally.
- Captured piece visually disappears when FEN updates (capturer replaces it on the square)
- Same animation timing as movement puzzles for consistency (~200ms slide + 300ms pause + celebration)

### Performance & Interaction
- Tapping disabled during animation — `isAdvancing` state already prevents taps, just set it before FEN update instead of after
- The success criterion "under one second" refers to the slide animation (~200ms), not the total celebration delay (1500ms which is intentional, not blocking)

### Claude's Discretion
- Exact FEN manipulation helper function design
- Whether to extract a shared animation utility or keep inline in each component

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `react-chessboard` `Chessboard` component — already has `animationDurationInMs: 200` configured in both puzzle components
- `puzzle.fen` — FEN string defining piece positions on the board
- `puzzle.pieceSquare` (movement) / `puzzle.correctPieceSquare` (capture) — source square of the piece to animate
- `puzzle.validTargets` (movement) / `puzzle.targetSquare` (capture) — destination square

### Established Patterns
- Both puzzles use `isAdvancing` state to block taps during the advance timeout
- Both puzzles have a 1500ms `setTimeout` before advancing to next puzzle or completing the level
- FEN is passed as `position: puzzle.fen` to the Chessboard options
- `flashSquare` + `flashType` state manages visual feedback on squares

### Integration Points
- `MovementPuzzle.tsx` L81-100 — correct tap handler, needs FEN update inserted before celebration
- `CapturePuzzle.tsx` L70-89 — correct tap handler, same modification needed
- FEN format: standard chess FEN piece-placement portion (8 ranks separated by `/`)

</code_context>

<specifics>
## Specific Ideas

- The FEN update approach is zero-dependency — no new libraries needed, just string manipulation to move a piece character from one square to another in the FEN string
- react-chessboard already handles the animation when `position` prop changes — no manual CSS transforms needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
