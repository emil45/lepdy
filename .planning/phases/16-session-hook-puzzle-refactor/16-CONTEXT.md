# Phase 16: Session Hook + Puzzle Refactor - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the puzzle generator into structured 10-puzzle sessions with a live streak counter, refactor puzzle components to receive puzzles as props from a session hook, and persist mid-session state across navigation.

</domain>

<decisions>
## Implementation Decisions

### Session Architecture
- New `hooks/usePuzzleSession.ts` manages 10-puzzle queue, current index, streak counter, session completion state. Consumes `selectNextPuzzle` from puzzleGenerator
- Mid-session state persists in sessionStorage — survives navigation within tab, clears on tab close (fresh session)
- All 10 puzzles pre-generated at session start using `selectNextPuzzle` in a loop — guarantees no duplicates
- Movement and capture puzzles mix within a session, respecting per-piece difficulty tier

### Streak Counter & UI
- Floating badge/chip above the board shows "N in a row!" with animation on increment
- Counter visible only at 2+ consecutive correct — "1 in a row" feels odd
- Scale bounce animation (quick pop to 1.2x then back) on streak increment — matches existing celebration patterns
- Counter disappears silently on wrong answer — no negative feedback per project principle

### Puzzle Component Refactor
- MovementPuzzle: replace ORDERED_PUZZLES and puzzleIndex state with props: `puzzle` and `onAnswer(correct: boolean)` — component becomes a pure puzzle renderer
- CapturePuzzle: same pattern — receive `puzzle` + `onAnswer` as props
- `usePuzzleSession` calls `completeLevel(2)` or `completeLevel(3)` after session ends — replaces per-component completion logic
- Phase 16 shows minimal "Session complete!" message. Phase 17 adds stars and mastery UI

### Claude's Discretion
- Exact sessionStorage key name and serialization format
- How to mix movement/capture puzzles within a session (alternating, random, weighted)
- Exact animation CSS for streak bounce
- Whether to show progress indicator (e.g., "5/10") during session

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/puzzleGenerator.ts` — `selectNextPuzzle`, `GeneratorState`, `defaultGeneratorState` (Phase 15)
- `hooks/usePuzzleProgress.ts` — `recordCorrect`, `recordWrong`, `getSessionTier` (Phase 15)
- `hooks/useChessProgress.ts` — `completeLevel` for level unlock tracking
- `data/chessPuzzles.ts` — 95 puzzles (61 movement + 34 capture) with difficulty tiers

### Established Patterns
- MovementPuzzle currently uses `ORDERED_PUZZLES` static array with `puzzleIndex` state
- CapturePuzzle uses similar sequential iteration with `capturePuzzles` import
- Both components manage their own puzzle flow and level completion
- `ChessGameContent.tsx` passes `onComplete` and `completeLevel` as props

### Integration Points
- `ChessGameContent.tsx` currently renders MovementPuzzle/CapturePuzzle based on view state
- Session hook will sit between ChessGameContent and puzzle components
- Phase 17 will replace the minimal session-complete message with full stars/mastery UI

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
