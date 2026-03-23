# Phase 20: Practice Mode - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a Practice Mode that lets kids pick any single chess piece from a 6-piece grid and drill unlimited adaptive puzzles for just that piece, building confidence in the pieces they find hardest.

</domain>

<decisions>
## Implementation Decisions

### Piece Picker Grid Layout
- 2x3 grid layout for 6 pieces — shows all pieces above fold, matches hub grid aesthetic
- Each card shows: SVG piece image, Hebrew name text, current mastery band label
- Cards use each piece's existing `color` from `chessPieces.ts` (gold=king, blue=rook, plum=bishop, pink=queen, green=knight, khaki=pawn)
- Tapping a card auto-plays the Hebrew name audio AND selects the piece (one-tap flow, no separate audio button)

### Practice Session Behavior
- Continuous loop — after solving one puzzle, immediately show the next with no end screen
- Reuse `buildSessionQueue` with `pieceFilter` parameter to generate puzzles for the selected piece
- Same adaptive difficulty tier system as Challenge — `usePuzzleProgress` already tracks per-piece tiers
- Exit button returns to the piece picker screen (not straight to the hub menu)

### Practice Mode Integration
- Add `'practice-picker'` and `'practice'` to the `ChessView` union type
- Hub Practice tile navigates to `'practice-picker'` (replacing current `'session'` placeholder)
- Same sound effects as Challenge — reuse existing `handleAnswer` wrapper (SUCCESS/WRONG_ANSWER)
- Same streak celebrations at milestones 3, 5, 10 — `consecutiveCorrect` tracking and confetti already wired

### Claude's Discretion
No items deferred to Claude's discretion — all grey areas resolved by user.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `chessPieces` array in `data/chessPieces.ts` — 6 pieces with id, translationKey, audioPath, symbol, emoji, color, order
- `usePuzzleProgress` hook — tracks per-piece difficulty tiers, mastery bands
- `usePuzzleSession` hook — `buildSessionQueue` already has puzzle generation logic
- `playAudio(audioPath)` — existing audio utility for Hebrew pronunciation
- `handleAnswer` useCallback wrapper in `ChessGameContent.tsx` — already plays SUCCESS/WRONG_ANSWER sounds
- Streak milestone confetti effect — already wired at 3, 5, 10 consecutive correct
- `ChessHubMenu` component — Practice tile already exists, currently routes to `'session'`

### Established Patterns
- `ChessView` union type with `assertNever` guard in `ChessGameContent.tsx`
- `Fade` transitions (300ms) between views
- `PieceIntroduction.tsx` — existing example of iterating over `chessPieces` to display piece cards
- MUI Card/CardActionArea for interactive tiles
- `data-testid` attributes on all interactive elements

### Integration Points
- `ChessView` type in `ChessGameContent.tsx` — add `'practice-picker'` and `'practice'`
- `ChessHubMenu.tsx` — update Practice tile from `view: 'session'` to `view: 'practice-picker'`
- `usePuzzleSession` hook — needs `pieceFilter` parameter for single-piece queue generation
- `assertNever` in `ChessGameContent.tsx` — must handle new view cases

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches using existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
