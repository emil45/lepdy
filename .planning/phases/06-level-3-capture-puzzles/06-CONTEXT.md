# Phase 6: Level 3 — Capture Puzzles - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A child can identify which piece on the board can capture a target piece, completing the full learning arc. This phase delivers Level 3 — capture puzzles using the chess board with multiple pieces, "which piece can capture?" interaction, and the final level completion that finishes the chess learning game.

</domain>

<decisions>
## Implementation Decisions

### Capture Puzzle Interaction Model
- Child taps the white piece that can capture the highlighted target — the target (black piece) is visually highlighted with a red/orange ring
- Red/orange ring around the target square — distinct from green dots used for movement hints. Clear "this is the enemy" signal
- Correct tap: same celebration pattern as Level 2 — green flash, confetti burst, `playRandomCelebration()`, auto-advance 1.5s
- Tapping a wrong white piece counts as a wrong tap with same gentle "try again" feedback. Tapping empty squares does nothing

### Puzzle Progression & Hints
- 8 capture puzzles ordered by difficulty (1 → 2) — easier first, harder later. All 8 must be completed
- After 2 wrong taps, the correct piece's square gets a green glow — consistent with Phase 5's hint pattern but adapted for "which piece"
- Instruction text: "Which piece can capture the {target}? Tap it!" using `chessGame.ui.tapToCapture` translation key. Target piece name in Hebrew
- Target piece label shown above the board alongside instruction text

### Level Completion & Final Game State
- Enhanced celebration for final level — same confetti + "Level Complete!" but adds "You learned chess!" message since this is the last level. `completeLevel(3)` marks all levels done
- All 3 level cards show green checkmark + star when complete — existing LevelMapCard already supports this
- New `CapturePuzzle` component in chess-game directory, rendered when `currentView === 'level-3'`
- Level 3 is replayable — same as Levels 1 and 2

### Claude's Discretion
- Exact red/orange ring style for target highlighting
- Whether to animate the correct piece sliding to capture the target
- "You learned chess!" text styling and positioning
- Transition between puzzles
- How distractor pieces are visually distinguished from the correct piece before hints

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/[locale]/games/chess-game/MovementPuzzle.tsx` — Reference pattern for puzzle state machine (245 lines). Same feedback states, same confetti, same `completeLevel` prop pattern
- `components/chess/ChessBoardDynamic.tsx` — SSR-safe wrapper (but likely need direct `Chessboard` import like MovementPuzzle did)
- `data/chessPuzzles.ts` — `CapturePuzzle` type, `capturePuzzles` array (8 puzzles), `getCapturePuzzlesByDifficulty()` helper. Each has `targetSquare`, `correctPieceSquare`, `correctPieceId`, `distractorSquares`
- `utils/audio.ts` — `playRandomCelebration()` for per-puzzle correct, `playSound(AudioSounds.CELEBRATION)` for level complete
- `react-confetti` — Used in both PieceIntroduction and MovementPuzzle

### Established Patterns
- Puzzle component pattern: direct `Chessboard` import from react-chessboard (NOT via ChessBoard.tsx wrapper which auto-executes moves)
- Dynamic import with `ssr: false` in ChessGameContent
- Props: `{ onComplete, completeLevel }` — threading from ChessGameContent's `useChessProgress`
- Feedback state machine: `flashType` (correct/wrong/null), `showHints`, `wrongTapCount`, `showTryAgain`
- Square styles: `squareStyles` object for highlighting via react-chessboard

### Integration Points
- `ChessGameContent.tsx` — Replace "Coming soon..." for `level-3` with `CapturePuzzle` component (last placeholder)
- `chessPuzzles.ts` — Import `capturePuzzles` for puzzle data
- Translation keys — Need `chessGame.ui.tapToCapture` in all 3 locales
- `useChessProgress` — `completeLevel(3)` is the final level completion call

</code_context>

<specifics>
## Specific Ideas

- The `CapturePuzzle` data structure has `correctPieceSquare` and `distractorSquares` — the component needs to detect which white piece was tapped, not which destination square
- Puzzle FEN includes both white and black pieces — react-chessboard will render them all. The `onSquareClick` handler must check if the tapped square contains a white piece
- Target square gets the red/orange ring via `squareStyles`, while hint shows green glow on `correctPieceSquare`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-level-3-capture-puzzles*
*Context gathered: 2026-03-22 via smart discuss*
