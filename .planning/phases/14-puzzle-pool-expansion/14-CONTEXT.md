# Phase 14: Puzzle Pool Expansion - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the static puzzle data pools from 18 movement / 8 capture puzzles to 60+ movement / 30+ capture puzzles with 3 difficulty tiers. No UI changes — pure data expansion with automated generation and verification.

</domain>

<decisions>
## Implementation Decisions

### Puzzle Generation Strategy
- Algorithmically generate valid positions per piece type using chess rules, then hand-verify edge cases
- Algorithmically generate capture puzzles — place target, correct attacker, and distractors using chess.js validation
- Generation script lives in `scripts/` as a dev-only tool — reproducible, auditable, can regenerate if rules change
- Automated test validates every puzzle: correct FEN, valid targets match chess.js output, difficulty tag present

### Difficulty Tier Definitions
- Tier 1 (easy): Piece on center/open square, empty board, simple pieces (king, rook, pawn) — few concepts to process
- Tier 3 (hard): Piece near edge with blocking pieces on board — child must understand pieces can't jump through others (except knight)
- Capture difficulty: Easy = 1 distractor, obvious attacker. Hard = 2-3 distractors, attacker requires diagonal/L-shape vision
- Blocking pieces appear in tier 2-3 movement puzzles only — tier 1 stays empty board (matches current pattern)

### Piece & Content Distribution
- 10 movement puzzles per piece (60 total) — equal coverage across all 3 tiers
- 5 capture puzzles per piece as correct attacker (30 total) — every piece well-represented
- Capture targets mix pawns, minor pieces, and major pieces for variety
- Puzzle IDs follow `{piece}-move-{tier}-{n}` and `capture-{piece}-{tier}-{n}` convention — sortable, debuggable

### Claude's Discretion
- Specific board positions and piece placements for generated puzzles
- Exact distribution of puzzles across tiers within each piece (roughly equal)
- Choice of blocking piece types for tier 2-3 puzzles

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/chessPuzzles.ts` — existing puzzle arrays with `MovementPuzzle` and `CapturePuzzle` interfaces (already have `difficulty` field)
- `data/chessPieces.ts` — `ChessPieceId` type for piece identification
- Helper functions `getMovementPuzzlesByPiece()` and `getCapturePuzzlesByDifficulty()` already exist

### Established Patterns
- Movement puzzles: single piece on board, FEN placement-only, `validTargets` lists all legal destination squares
- Capture puzzles: one black target piece, one correct white attacker, N white distractor pieces that can't reach target
- Difficulty field: `1 | 2 | 3` TypeScript literal union type
- IDs: kebab-case with piece name prefix

### Integration Points
- `chessPuzzles.ts` exports consumed by `MovementPuzzle.tsx` and `CapturePuzzle.tsx` components
- Phase 15 will consume expanded pools via random generator — data shape must be preserved

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for puzzle generation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
