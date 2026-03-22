# Phase 18: Daily Featured Puzzle - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a daily featured puzzle that gives kids a reason to return every day — deterministic per calendar day, accessible from the level map, with completion tracking and "come back tomorrow" state.

</domain>

<decisions>
## Implementation Decisions

### Daily Puzzle Generation
- Deterministic per day using seeded random: hashCode(YYYY-MM-DD) mod puzzle pool size. No server needed, same result for all users
- Draw from all 95 puzzles (movement + capture) — full pool, random selection rotates daily
- UTC timezone for midnight rotation — consistent for all users, no timezone ambiguity
- Any difficulty tier — variety keeps it interesting, some days easy, some hard

### Level Map Entry Point
- New 4th card above the existing 3 levels — prominent position, always accessible, distinct visual
- Visual: calendar emoji + "Daily Puzzle" label + today's date — clear purpose, fresh every day
- Always available regardless of level progress — gives new users something to do immediately
- Warm orange/gold color to draw attention as something special, distinct from level cards

### Completion & "Come Back Tomorrow"
- Track completion via localStorage key `lepdy_chess_daily_YYYY-MM-DD` — simple, auto-expires
- Completed state: same card with checkmark overlay + "Come back tomorrow!" text, card disabled
- On completion: celebration (confetti + sound), then card shows completed state
- Daily puzzle is standalone — separate from 10-puzzle sessions, does not count toward session progress

### Claude's Discretion
- Exact hash function implementation for date-seeded random
- Animation details for daily puzzle celebration
- Exact layout positioning of the daily card relative to level cards
- Whether to show the puzzle type (movement/capture) on the daily card

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/chessPuzzles.ts` — 95 puzzles (61 movement + 34 capture) with difficulty tiers
- `app/[locale]/games/chess-game/ChessGameContent.tsx` — level map with LevelMapCard components
- `app/[locale]/games/chess-game/MovementPuzzle.tsx` / `CapturePuzzle.tsx` — pure puzzle renderers (Phase 16 refactor)
- `react-confetti` — already used for celebrations
- `utils/audio.ts` — `playRandomCelebration()` for success sounds

### Established Patterns
- LevelMapCard component with emoji, label, color, lock/complete states
- localStorage for progress tracking (useChessProgress, usePuzzleProgress patterns)
- `'use client'` directive for interactive components
- View state management in ChessGameContent via `ChessView` type

### Integration Points
- ChessGameContent manages view routing — add 'daily' to ChessView type
- Daily card sits in the level map alongside existing 3 level cards
- Daily puzzle renders using existing MovementPuzzle or CapturePuzzle (based on puzzle type)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
