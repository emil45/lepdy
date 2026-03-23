# Phase 21: Checkmate Puzzle Data + Renderers - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a validated set of 20+ mate-in-1 chess positions and a dedicated CheckmatePuzzle component that teaches kids the concept of checkmate with clear Hebrew instruction, visual feedback, and difficulty progression.

</domain>

<decisions>
## Implementation Decisions

### Checkmate Puzzle Data Format
- New `CheckmatePuzzle` interface with `id`, `fen` (full 6-field FEN), `correctMove` (algebraic notation e.g. "Qh7"), `matingPieceId`, `difficulty: 1|2|3`
- ~4-5 positions per mating piece type (queen, rook, bishop, knight) = 20+ total
- Build-time validation script using `chess.js` `isCheckmate()` — apply each move, fail build if invalid
- Full FEN format (all 6 fields) required for chess.js move validation and checkmate detection

### Checkmate Puzzle Component
- New `CheckmatePuzzle.tsx` following same pattern as `MovementPuzzle.tsx` and `CapturePuzzle.tsx`
- Two-tap interaction: tap mating piece first, then tap target square — matches existing capture puzzle UX
- Checkmate confirmation: "שח מט!" text + confetti burst + celebration sound (reuse existing patterns)
- Wrong move feedback: shake animation + wrong sound + board reset — same as existing wrong-answer pattern

### Hebrew Instruction & Integration
- Instruction text displayed above the board as a styled Typography banner — same position as existing puzzle instructions
- Hebrew text: "שימו את המלך בשח מט במהלך אחד" ("Put the king in checkmate in one move") — clear, kid-friendly
- Standalone component for now — Phase 22 wires checkmate into sessions
- 3 difficulty tiers: tier 1 (obvious mates), tier 2 (one defender to navigate), tier 3 (multiple defenders)

### Claude's Discretion
No items deferred to Claude's discretion — all grey areas resolved by user.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `chess.js@1.4.0` — already installed, provides move validation, `isCheckmate()`, FEN parsing
- `MovementPuzzle.tsx` and `CapturePuzzle.tsx` — existing puzzle component patterns to follow
- `chessPuzzles.ts` — existing puzzle data file structure (MovementPuzzle, CapturePuzzle interfaces)
- `chessPieces.ts` — piece config with id, translationKey, audioPath, symbol, emoji, color
- Celebration/sound patterns from Phase 19 (confetti, `playRandomCelebration()`, `AudioSounds.SUCCESS/WRONG_ANSWER`)

### Established Patterns
- Puzzle interfaces in `data/chessPuzzles.ts` with `id`, `fen`, `difficulty: 1|2|3`
- FEN uses piece-placement only for movement/capture puzzles, but checkmate needs full FEN
- 8x8 grid CSS for board rendering with `data-testid` attributes
- `playAudio()` for Hebrew pronunciation, `playSound()` for game effects

### Integration Points
- `data/chessPuzzles.ts` — add CheckmatePuzzle interface and data array
- New `CheckmatePuzzle.tsx` component in chess-game directory
- Translation keys for Hebrew instruction text in `messages/{he,en,ru}.json`
- Phase 22 will wire this into session queue

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches using existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
