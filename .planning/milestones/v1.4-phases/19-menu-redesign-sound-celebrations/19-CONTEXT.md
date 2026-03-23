# Phase 19: Menu Redesign + Sound & Celebrations - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the chess game's numbered level map (1/2/3 + Daily) with a clear hub menu featuring large navigation tiles, add sound effects on every puzzle answer, and trigger mini-celebrations at streak milestones during sessions.

</domain>

<decisions>
## Implementation Decisions

### Hub Menu Layout & Tile Design
- 2x2 grid layout for navigation tiles — maximizes visual impact, fits 4 tiles above fold on tablets
- Large emoji/icon + Hebrew label per tile — matches existing Lepdy FunButton/category page pattern
- Distinct pastel color per tile: blue=Learn, purple=Challenge, green=Practice, gold=Daily
- Replace numbered levels entirely — Level 1 becomes "Learn", Levels 2+3 merge into "Challenge" (session already mixes both)

### Sound Effects
- Reuse `AudioSounds.SUCCESS` (short-success.mp3) for correct answers — already exists, tested, kid-friendly
- Reuse `AudioSounds.WRONG_ANSWER` (wrong-answer.mp3) for wrong answers — gentle tone
- Play sounds on every puzzle answer in both session and daily puzzle modes
- Keep existing `playRandomCelebration()` for daily puzzle completion

### Streak Celebrations
- Confetti burst + celebration sound at streak milestones (3, 5, 10 consecutive correct)
- Same celebration intensity at all milestones — kids love consistency
- Full-screen confetti overlay (same pattern as SessionCompleteScreen)
- Streak badge scale bounce animation (CSS transform 1→1.3→1 over 300ms) at milestones

### Claude's Discretion
No items deferred to Claude's discretion — all grey areas resolved by user.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AudioSounds.SUCCESS` / `AudioSounds.WRONG_ANSWER` — existing sound effects in `utils/audio.ts`
- `playRandomCelebration()` — randomly picks from 4 celebration sounds
- `react-confetti` — already a dependency, used in `SessionCompleteScreen.tsx`
- `StreakBadge` component — already renders streak count during sessions
- `RoundFunButton` — existing styled button component used on chess map
- `DailyPuzzleCard` — existing daily puzzle entry point component

### Established Patterns
- `ChessView` union type for view routing in `ChessGameContent.tsx`
- `Fade` transitions (300ms) between views
- `usePuzzleSession` hook manages session state (currentPuzzle, consecutiveCorrect, onAnswer)
- `playSound(AudioSounds.X)` for game sound effects
- MUI `Card`/`CardActionArea` for interactive tiles

### Integration Points
- `ChessGameContent.tsx` — main routing component, currently renders LevelMapCard list
- `ChessView` type needs updating: 'map' → 'hub', add 'practice' view (Phase 20)
- `onAnswer` callback in puzzle components — wire sound effects here
- `consecutiveCorrect` from `usePuzzleSession` — trigger celebrations at milestones

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches using existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
