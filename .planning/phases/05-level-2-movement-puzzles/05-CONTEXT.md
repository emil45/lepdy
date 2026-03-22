# Phase 5: Level 2 — Movement Puzzles - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A child can tap where a piece can move, receive immediate feedback, and get a hint if stuck — for all 6 piece types. This phase delivers the Level 2 gameplay — movement puzzles using the chess board, feedback system (correct/wrong/hint), and level completion. Builds on Phase 2's ChessBoard component and Phase 4's view routing pattern.

</domain>

<decisions>
## Implementation Decisions

### Puzzle Flow & Progression
- Puzzles grouped by piece type in INTRO-04 order (King, Rook, Bishop, Queen, Knight, Pawn) — within each piece, sorted by difficulty
- All 18 puzzles must be completed to finish Level 2 (3 per piece × 6 pieces, matching MOVE-05)
- Pawn puzzles show forward-only movement (e3/e4 from e2, d5 from d4) — no diagonal capture shown (that's Level 3)
- Step counter "3/18" + piece group label ("Rook 2/3") shows progress within Level 2

### Puzzle Interaction & Board Display
- Child taps any valid destination square to answer — reuse ChessBoard's `onSquareClick`. Board highlights the piece's square automatically (no tap-piece-first needed)
- Correct: green flash on tapped square + celebration sound (`playSound(AudioSounds.CELEBRATION)`) + brief confetti burst. Auto-advance to next puzzle after 1.5s
- Wrong: square briefly turns red/orange + gentle "try again" text overlay. No buzzer, no score penalty (FEED-02, MOVE-03). Wrong-tap counter increments for hint logic
- Hints after 2 wrong taps: highlight all valid destination squares with green dots — reuse ChessBoard's `squareStyles` highlight pattern (MOVE-04, FEED-03). Hints stay visible until correct tap

### Level Completion & Component Structure
- Same celebration pattern as Level 1 — full confetti + "Level Complete!" + auto-return to map after 3s. `completeLevel(2)` unlocks Level 3
- Level 2 is replayable — tapping the card re-enters from first puzzle
- New `MovementPuzzle` component in chess-game directory, rendered when `currentView === 'level-2'`
- Brief instruction text above board — "Where can the {piece name} move? Tap!" using `chessGame.ui.tapToMove` translation key, showing piece name in Hebrew

### Claude's Discretion
- Exact confetti burst size and duration for correct answers
- Transition animation between puzzles
- "Try again" text positioning and duration
- Whether to show the piece name below the board during puzzles
- Board size during puzzles (likely same 480px max as Phase 2)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/chess/ChessBoard.tsx` — Full chess board with `onSquareClick`, `squareStyles`, responsive sizing, LTR forced
- `components/chess/ChessBoardDynamic.tsx` — SSR-safe dynamic import wrapper
- `data/chessPuzzles.ts` — `MovementPuzzle` type, `movementPuzzles` array (18 puzzles), `getMovementPuzzlesByPiece()` helper
- `data/chessPieces.ts` — `chessPieces` array with `order` field for piece ordering, `translationKey` for Hebrew names
- `hooks/useChessProgress.ts` — `completeLevel(2)` to mark Level 2 done, `isLevelUnlocked(2)` for gating
- `utils/audio.ts` — `playSound(AudioSounds.CELEBRATION)` for correct feedback
- `react-confetti` — installed, used in PieceIntroduction for celebration

### Established Patterns
- View routing: `useState<ChessView>` in ChessGameContent — `'level-2'` view renders MovementPuzzle
- Level component pattern: props `{ onComplete, completeLevel }` — established by PieceIntroduction
- ChessBoard accepts `initialFen`, `onMove` callback, `gameRef` for state access
- Board highlights via `squareStyles` — green dots for valid moves, yellow for selected square

### Integration Points
- `ChessGameContent.tsx` — Replace "Coming soon..." for `level-2` with `MovementPuzzle` component
- `ChessBoard` — Pass puzzle FEN as `initialFen`, use `onSquareClick` for tap detection
- `chessPuzzles.ts` — Import `movementPuzzles` and `getMovementPuzzlesByPiece` for puzzle data
- Translation keys — Need `chessGame.ui.tapToMove`, `chessGame.ui.tryAgain` in all 3 locales

</code_context>

<specifics>
## Specific Ideas

- The ChessBoard component's existing `squareStyles` can be repurposed for both hint highlights and correct/wrong feedback by dynamically changing styles
- Puzzle FEN is piece-placement-only (no castling/en-passant fields) — ChessBoard may need to handle this format
- The `wrongTapCount` state resets per puzzle, not per Level 2 session

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-level-2-movement-puzzles*
*Context gathered: 2026-03-22 via smart discuss*
