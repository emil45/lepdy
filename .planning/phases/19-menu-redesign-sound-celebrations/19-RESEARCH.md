# Phase 19: Menu Redesign + Sound & Celebrations - Research

**Researched:** 2026-03-23
**Domain:** React/MUI UI refactor — navigation hub, audio wiring, CSS animation
**Confidence:** HIGH

## Summary

This phase replaces the chess game's numbered level list with a 2x2 hub grid, wires answer sound effects to every puzzle answer callback, and adds confetti + badge animation at streak milestones during sessions.

All three deliverables are pure in-app code changes with zero new dependencies. The project already has `react-confetti`, `AudioSounds.SUCCESS`, `AudioSounds.WRONG_ANSWER`, and the `keyframes` API from MUI — every primitive needed is present and working. The main work is (1) a new `ChessHubMenu` component, (2) updating `ChessView` union type, (3) passing `onAnswer` results through a thin sound-playing wrapper in `ChessGameContent`, and (4) a `useStreakCelebration` hook or inline `useEffect` that fires at milestones.

The existing `StreakBadge` already performs a bounce animation on each new `count` value via the `key={count}` trick. The milestone celebration needs an additional confetti overlay distinct from the end-of-session `SessionCompleteScreen` confetti — rendered inline in `ChessGameContent` at the session view level.

**Primary recommendation:** Implement in three atomic units: hub menu component, answer sound wiring, streak milestone celebration — matching the five requirements directly. Keep all logic in `ChessGameContent` to avoid prop-drilling or new context.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Hub Menu Layout & Tile Design
- 2x2 grid layout for navigation tiles — maximizes visual impact, fits 4 tiles above fold on tablets
- Large emoji/icon + Hebrew label per tile — matches existing Lepdy FunButton/category page pattern
- Distinct pastel color per tile: blue=Learn, purple=Challenge, green=Practice, gold=Daily
- Replace numbered levels entirely — Level 1 becomes "Learn", Levels 2+3 merge into "Challenge" (session already mixes both)

#### Sound Effects
- Reuse `AudioSounds.SUCCESS` (short-success.mp3) for correct answers — already exists, tested, kid-friendly
- Reuse `AudioSounds.WRONG_ANSWER` (wrong-answer.mp3) for wrong answers — gentle tone
- Play sounds on every puzzle answer in both session and daily puzzle modes
- Keep existing `playRandomCelebration()` for daily puzzle completion

#### Streak Celebrations
- Confetti burst + celebration sound at streak milestones (3, 5, 10 consecutive correct)
- Same celebration intensity at all milestones — kids love consistency
- Full-screen confetti overlay (same pattern as SessionCompleteScreen)
- Streak badge scale bounce animation (CSS transform 1→1.3→1 over 300ms) at milestones

### Claude's Discretion
No items deferred to Claude's discretion — all grey areas resolved by user.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MENU-01 | User sees a clear hub menu with large icon+label tiles replacing the broken 1/2/3/daily structure | New `ChessHubMenu` component with 2x2 MUI grid replaces `LevelMapCard` list; `ChessView` updated: `'map'` → `'hub'` |
| MENU-02 | User can navigate to Learn, Practice, Challenge, and Daily Puzzle from the hub menu | Hub tiles navigate to `'level-1'`, `'session'`, `'session'`, `'daily'` views; Practice tile labeled but routes to session (Phase 20 adds dedicated mode) |
| SFX-01 | User hears a positive sound effect on correct puzzle answers | Wrap `onAnswer` in `ChessGameContent` to call `playSound(AudioSounds.SUCCESS)` on `correct === true` before forwarding |
| SFX-02 | User hears a gentle sound effect on wrong puzzle answers | Same wrapper calls `playSound(AudioSounds.WRONG_ANSWER)` on `correct === false` |
| SFX-03 | User sees mini-celebration (confetti/animation) at 3, 5, and 10 correct streak during sessions | `useEffect` on `consecutiveCorrect` in `ChessGameContent` detects milestones, sets `showMilestoneConfetti` state, renders `<Confetti recycle={false} />` overlay and calls `playRandomCelebration()` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-confetti` | 6.4.0 (installed) | Confetti burst overlay | Already used in `SessionCompleteScreen`; no new dep |
| `@mui/material` | 7.3.7 (installed) | Grid layout, Card, CardActionArea, keyframes | Entire UI layer; provides `Grid2`, `keyframes`, `Fade` |
| `utils/audio.ts` | in-repo | `playSound`, `playRandomCelebration` | Established audio utility; supports AbortError handling |

### No New Dependencies
This phase adds zero npm packages. All required capabilities are already present.

**Version verification:** No npm installs needed. All versions confirmed from `package.json`.

## Architecture Patterns

### Recommended Component Structure

```
app/[locale]/games/chess-game/
├── ChessGameContent.tsx     # Updated: ChessView union, hub routing, sound wiring, milestone effect
├── ChessHubMenu.tsx         # NEW: 2x2 grid hub with 4 navigation tiles
├── StreakBadge.tsx           # Unchanged (milestone bounce already works via key={count})
├── SessionCompleteScreen.tsx # Unchanged
└── DailyPuzzleCard.tsx       # Unchanged (reused inside ChessHubMenu)
```

### Pattern 1: ChessView Union Update
**What:** Rename `'map'` to `'hub'` in the union type and add `assertNever` guard per STATE.md decision.
**When to use:** Every view routing switch statement needs exhaustive type checking.
**Example:**
```typescript
// Source: STATE.md architectural decision — assertNever in Phase 19
type ChessView = 'hub' | 'level-1' | 'session' | 'daily';

function assertNever(x: never): never {
  throw new Error('Unhandled ChessView: ' + x);
}

// In render:
switch (currentView) {
  case 'hub': return <ChessHubMenu ... />;
  case 'level-1': return <PieceIntroduction ... />;
  case 'session': return <SessionView ... />;
  case 'daily': return <DailyView ... />;
  default: return assertNever(currentView);
}
```

### Pattern 2: ChessHubMenu — 2x2 Grid Layout
**What:** Four large tiles using MUI `Grid2` (2 columns × 2 rows), each a `Card`/`CardActionArea` with emoji + Hebrew label.
**When to use:** Any time a category-style navigation grid is needed.
**Example:**
```typescript
// Pattern based on existing CategoryPage and home page FunButton grid
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';

const HUB_TILES = [
  { id: 'learn',     emoji: '📖', labelKey: 'hub.learn',     color: '#9ed6ea',  view: 'level-1' as ChessView },
  { id: 'challenge', emoji: '⚔️', labelKey: 'hub.challenge', color: '#dbc3e2',  view: 'session' as ChessView },
  { id: 'practice',  emoji: '🏋️', labelKey: 'hub.practice',  color: '#dee581',  view: 'session' as ChessView }, // Phase 20 will change this
  { id: 'daily',     emoji: '📅', labelKey: 'hub.daily',     color: '#ffcd36',  view: 'daily'   as ChessView },
];

// Grid renders as 2x2 on all screen sizes — tiles are large enough for tablet touch
<Grid container spacing={2} sx={{ width: '100%', maxWidth: 520 }}>
  {HUB_TILES.map(tile => (
    <Grid size={6} key={tile.id}>
      <Card sx={{ bgcolor: tile.color, borderRadius: 3, minHeight: 140 }}>
        <CardActionArea onClick={() => setCurrentView(tile.view)} sx={{ minHeight: 140, ... }}>
          ...
        </CardActionArea>
      </Card>
    </Grid>
  ))}
</Grid>
```

**Colors confirmed from `theme/theme.ts`:**
- `bluePastel: '#9ed6ea'` — Learn
- `purplePastel: '#dbc3e2'` — Challenge
- `greenPastel: '#dee581'` — Practice
- `orangePastel: '#ffcd36'` — Daily (theme calls it orange, CONTEXT.md calls it gold — same hex)

### Pattern 3: Sound Wiring via Answer Callback Wrapper
**What:** Wrap `onAnswer` from `usePuzzleSession` with a sound-playing shim in `ChessGameContent`.
**When to use:** Sound effects needed without coupling puzzle components to audio logic.
**Example:**
```typescript
// In ChessGameContent, after usePuzzleSession():
const handleAnswer = useCallback((correct: boolean) => {
  playSound(correct ? AudioSounds.SUCCESS : AudioSounds.WRONG_ANSWER);
  onAnswer(correct);
}, [onAnswer]);

// Pass handleAnswer (not onAnswer) to MovementPuzzle and CapturePuzzle
<MovementPuzzle onAnswer={handleAnswer} ... />
<CapturePuzzle  onAnswer={handleAnswer} ... />
```

**Daily puzzle:** Already has its own `handleDailyAnswer`. Update it to call `playSound(AudioSounds.WRONG_ANSWER)` on wrong, and keep `playRandomCelebration()` on correct (user's decision to keep daily distinct).

### Pattern 4: Streak Milestone Celebration
**What:** `useEffect` watches `consecutiveCorrect`, detects milestones 3/5/10, fires confetti overlay + celebration sound.
**When to use:** Event-driven side effects tied to state thresholds.
**Example:**
```typescript
const STREAK_MILESTONES = new Set([3, 5, 10]);
const [showMilestoneConfetti, setShowMilestoneConfetti] = useState(false);

useEffect(() => {
  if (STREAK_MILESTONES.has(consecutiveCorrect)) {
    setShowMilestoneConfetti(true);
    playRandomCelebration();
    // Auto-dismiss after confetti cycle (~2s)
    const t = setTimeout(() => setShowMilestoneConfetti(false), 2000);
    return () => clearTimeout(t);
  }
}, [consecutiveCorrect]);

// Render inside session view:
{showMilestoneConfetti && (
  <Confetti recycle={false} numberOfPieces={150} gravity={0.3} />
)}
```

**Note:** `StreakBadge` already applies a scale bounce via `key={count}` (re-mounts on each count change, triggering `streakBounce` keyframe). The existing animation already covers the "badge scale bounce at milestone" requirement — no changes needed to `StreakBadge.tsx`.

### Pattern 5: MUI Grid2 for 2x2 Layout
**What:** MUI v7 uses `Grid2` (aliased as `Grid` from `@mui/material/Grid2`).
**When to use:** Any responsive grid layout.

The existing codebase does not currently use Grid2 in chess game files, but uses `Box` flex containers. Both are valid. Grid2 with `size={6}` (out of default 12) gives clean 2-column layout.

Alternative: Two `Box` rows with `display: 'flex'`, `gap: 2` each containing two tiles. Either pattern works. Grid2 is more semantically aligned with a true grid.

### Anti-Patterns to Avoid
- **Putting sound calls inside `MovementPuzzle` / `CapturePuzzle`:** These components call `onAnswer` — they should not import audio utilities. Keep audio at the `ChessGameContent` orchestration layer.
- **Triggering milestone celebration on `consecutiveCorrect` initialization (0):** Guard with `if (consecutiveCorrect === 0) return;` at top of effect, or use a `useRef` to track previous value.
- **Re-creating `onAnswer` wrapper on every render:** Use `useCallback` with `[onAnswer]` dependency.
- **Renaming `'map'` → `'hub'` without finding all references:** Tests in `e2e/app.spec.ts` reference `data-testid="level-card"` which will be replaced. Tests MUST be updated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti burst animation | Custom canvas/CSS animation | `react-confetti` (already installed) | Handles resize, gravity, recycling, `numberOfPieces` — dozens of edge cases |
| Celebration sound variety | Custom shuffle logic | `playRandomCelebration()` in `utils/audio.ts` | Already implements no-repeat shuffle from 5 sounds |
| Correct/wrong answer sounds | New audio utility | `playSound(AudioSounds.SUCCESS / WRONG_ANSWER)` | Handles AbortError, lazy init, already tested |
| Scale animation on StreakBadge | New keyframe | Existing `streakBounce` keyframe in `StreakBadge.tsx` | Already fires on every `count` change via `key={count}` |

**Key insight:** Every audio and animation primitive is already implemented and proven. Phase 19 is orchestration — wiring existing pieces to new trigger points.

## Common Pitfalls

### Pitfall 1: Stale consecutiveCorrect in Milestone Effect
**What goes wrong:** The `useEffect` over `consecutiveCorrect` may fire on mount with `0`, triggering unexpected behavior if the condition isn't guarded.
**Why it happens:** `useEffect` runs after every render including the first.
**How to avoid:** Check `consecutiveCorrect > 0` or `STREAK_MILESTONES.has(consecutiveCorrect)` — the `Set.has(0)` returns `false` since 0 is not in `{3, 5, 10}`, so this is naturally safe. Still worth documenting.
**Warning signs:** Confetti appears on session load before any answer.

### Pitfall 2: Milestone Fires Multiple Times for Same Count
**What goes wrong:** If `consecutiveCorrect` doesn't change between renders (parent re-renders for another reason), the effect won't re-fire. This is correct behavior — `useEffect` only runs when dependency changes. No action needed.
**Why it happens:** React `useEffect` deduplicates identical values. Not actually a problem.
**Warning signs:** N/A — this is correct.

### Pitfall 3: E2E Tests Fail After Level Map Removal
**What goes wrong:** Tests use `[data-testid="level-card"]` and expect `toHaveCount(3)`. After Phase 19, the level map is gone — the hub has tiles, not level cards.
**Why it happens:** Hub tiles replace `LevelMapCard` components which had `data-testid="level-card"`.
**How to avoid:** Update `e2e/app.spec.ts` to use `[data-testid="hub-tile"]` (or whatever testid is assigned to hub tiles). Add new test: "hub shows 4 tiles" replacing "level map shows three levels". Tests for level entry (clicking nth level-card) must be rewritten to click hub tiles.
**Warning signs:** All chess-game E2E tests fail at `[data-testid="level-card"]` selector.

### Pitfall 4: Daily Puzzle Sound Handling
**What goes wrong:** The `handleDailyAnswer` in `ChessGameContent` handles `correct === true` only (calls `markDailyCompleted` + `playRandomCelebration`). A wrong answer on daily puzzle currently plays no sound.
**Why it happens:** Daily puzzle was implemented before SFX requirements.
**How to avoid:** Add `playSound(AudioSounds.WRONG_ANSWER)` to `handleDailyAnswer` for `correct === false` branch. Keep `playRandomCelebration()` on correct (locked decision).
**Warning signs:** Wrong answers on daily puzzle are silent.

### Pitfall 5: Confetti Z-Index During Puzzle
**What goes wrong:** `<Confetti />` renders a full-screen canvas. If z-index is not set, it may appear behind the puzzle board or intercept touch events.
**Why it happens:** `react-confetti` default canvas has `position: fixed` with no explicit z-index override.
**How to avoid:** Pass `style={{ zIndex: 1300 }}` to `<Confetti>` (MUI modal z-index is 1300, ensures confetti appears above board but doesn't block critical UI). After `recycle={false}` completes (~2s), remove from DOM via `showMilestoneConfetti` state.
**Warning signs:** Confetti canvas overlays puzzle board permanently or tap targets become unresponsive during confetti.

### Pitfall 6: Translation Keys for Hub Tiles
**What goes wrong:** New hub tile labels need translation keys in all 3 locale files (he.json, en.json, ru.json). Missing keys cause next-intl to throw.
**Why it happens:** All three locale files must be updated together.
**How to avoid:** Add `chessGame.hub.learn`, `chessGame.hub.challenge`, `chessGame.hub.practice`, `chessGame.hub.daily` to all three message files in the same plan. Hebrew labels need RTL-compatible text.
**Warning signs:** Build error or missing key warning in next-intl.

## Code Examples

### Hub Tile Component Pattern
```typescript
// Source: Verified from existing DailyPuzzleCard.tsx and CategoryPage patterns
interface HubTileProps {
  emoji: string;
  label: string;
  bgColor: string;
  isCompleted?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  'data-testid'?: string;
}

function HubTile({ emoji, label, bgColor, isCompleted, isDisabled, onClick, ...rest }: HubTileProps) {
  return (
    <Card
      data-testid={rest['data-testid'] ?? 'hub-tile'}
      sx={{ bgcolor: bgColor, borderRadius: 3, minHeight: 140, opacity: isDisabled ? 0.5 : 1 }}
    >
      <CardActionArea disabled={isDisabled} onClick={onClick} sx={{ minHeight: 140, p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 56, lineHeight: 1 }}>{emoji}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {label}
          </Typography>
          {isCompleted && <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />}
        </Box>
      </CardActionArea>
    </Card>
  );
}
```

### Answer Wrapper Pattern
```typescript
// Source: Verified from ChessGameContent.tsx onAnswer and utils/audio.ts playSound
import { playSound, playRandomCelebration, AudioSounds } from '@/utils/audio';

// Inside ChessGameContent, after destructuring usePuzzleSession():
const handleAnswer = useCallback((correct: boolean) => {
  playSound(correct ? AudioSounds.SUCCESS : AudioSounds.WRONG_ANSWER);
  onAnswer(correct);
}, [onAnswer]);
```

### Milestone Celebration Effect
```typescript
// Source: Verified from SessionCompleteScreen.tsx confetti pattern + usePuzzleSession.ts
import Confetti from 'react-confetti';

const STREAK_MILESTONES = new Set([3, 5, 10]);
const [showMilestoneConfetti, setShowMilestoneConfetti] = useState(false);

useEffect(() => {
  if (!STREAK_MILESTONES.has(consecutiveCorrect)) return;
  setShowMilestoneConfetti(true);
  playRandomCelebration();
  const timer = setTimeout(() => setShowMilestoneConfetti(false), 2500);
  return () => clearTimeout(timer);
}, [consecutiveCorrect]);

// In session view JSX:
{showMilestoneConfetti && (
  <Confetti
    recycle={false}
    numberOfPieces={150}
    gravity={0.3}
    style={{ zIndex: 1300 }}
  />
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `LevelMapCard` list with numbered levels | 2x2 hub grid with labeled tiles | Phase 19 | Kids see clear mode names, not cryptic numbers |
| No sound on puzzle answers | `playSound` on every `onAnswer` callback | Phase 19 | Immediate audio reinforcement for learning |
| No in-session celebration | Confetti + sound at streak 3/5/10 | Phase 19 | Progressive engagement reward |
| `ChessView = 'map' | ...` | `ChessView = 'hub' | ...` with `assertNever` | Phase 19 | Type-safe exhaustive routing, protects future views |

**Deprecated after Phase 19:**
- `LevelMapCard` component: Remove entirely, replaced by `ChessHubMenu` / hub tile pattern
- `LEVELS` array constant: Remove, hub tiles defined in `ChessHubMenu`
- `LevelMapCardProps` interface: Remove with the component

## Open Questions

1. **Practice tile routing**
   - What we know: Practice tile exists on hub (MENU-02). Practice mode (PRAC-01/02) is Phase 20.
   - What's unclear: Should the Practice tile route to `'session'` as a placeholder, or be visually disabled until Phase 20?
   - Recommendation: Route to `'session'` — same puzzle session already covers practice content. Phase 20 will change the routing to a new `'practice'` view. This avoids a broken/disabled tile on the hub at ship time.

2. **Hub tile for Daily Puzzle vs. DailyPuzzleCard component**
   - What we know: `DailyPuzzleCard` is a standalone component already used on the map. The hub replaces the map.
   - What's unclear: Should the Daily tile be a generic `HubTile` (consistent look) or reuse `DailyPuzzleCard` for its date/completion display?
   - Recommendation: Use a generic `HubTile` matching the 2x2 grid for visual consistency. Pass `isCompleted={isDailyCompleted}` to show the checkmark. The date label from `DailyPuzzleCard` is secondary — the hub doesn't need to show it.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure in-repo code changes, all libraries already installed).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright Test 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "Chess hub"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MENU-01 | Hub shows 4 tiles instead of level cards | e2e | `npm test -- --grep "hub shows four tiles"` | ❌ Wave 0 |
| MENU-02 | Tapping each hub tile navigates to correct view | e2e | `npm test -- --grep "hub tile navigation"` | ❌ Wave 0 |
| SFX-01 | Correct answer plays sound (browser audio API called) | manual-only | n/a — audio playback cannot be reliably asserted in headless Playwright | — |
| SFX-02 | Wrong answer plays sound | manual-only | n/a — audio playback cannot be reliably asserted in headless Playwright | — |
| SFX-03 | Confetti overlay appears at streak 3 | e2e | `npm test -- --grep "milestone celebration"` | ❌ Wave 0 |

**Note on SFX-01/SFX-02:** Audio playback in Playwright headless Chromium is muted by default and `HTMLAudioElement.play()` resolves without error silently. The correct test approach is visual regression (confetti appears) or unit testing the callback wrapper. For this phase, audio correctness is verified manually; the wrapper logic is simple enough that unit risk is low.

### Sampling Rate
- **Per task commit:** `npm test -- --grep "chess"` (existing chess tests + new hub tests)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Update `e2e/app.spec.ts` — replace `"level map shows three levels"` test (selector `[data-testid="level-card"]`) with `"hub shows four tiles"` (selector `[data-testid="hub-tile"]`)
- [ ] Update all `level-card` nth() click tests to use hub tile navigation pattern
- [ ] Add `"hub tile navigation"` tests for Learn, Challenge, Practice, Daily tiles
- [ ] Add `"milestone celebration"` test: trigger 3 correct answers in sequence, verify confetti visible

**Existing tests that will break and need updating (confirmed from `e2e/app.spec.ts`):**
- `'level map shows three levels'` — selector `[data-testid="level-card"]` count=3
- `'completing all pieces returns to level map...'` — returns to `level-card` selector
- `'progress persists across reload'` — checks `level-card-completed`
- Multiple tests that click `[data-testid="level-card"]`.nth(1/2) to enter sessions

These are not new tests — they are test updates that must happen alongside the MENU-01/02 implementation.

## Sources

### Primary (HIGH confidence)
- Direct read of `/Users/emil/code/lepdy/app/[locale]/games/chess-game/ChessGameContent.tsx` — current view routing, `LevelMapCard`, `ChessView` type
- Direct read of `/Users/emil/code/lepdy/utils/audio.ts` — `AudioSounds` enum, `playSound`, `playRandomCelebration` implementations
- Direct read of `/Users/emil/code/lepdy/app/[locale]/games/chess-game/SessionCompleteScreen.tsx` — confetti pattern, `<Confetti recycle={false} numberOfPieces={200} />`
- Direct read of `/Users/emil/code/lepdy/app/[locale]/games/chess-game/StreakBadge.tsx` — `key={count}` bounce animation, `streakBounce` keyframe
- Direct read of `/Users/emil/code/lepdy/hooks/usePuzzleSession.ts` — `consecutiveCorrect` state, `onAnswer` callback, `STREAK_MILESTONES` integration point
- Direct read of `/Users/emil/code/lepdy/theme/theme.ts` — confirmed pastel color hex values
- Direct read of `/Users/emil/code/lepdy/e2e/app.spec.ts` — identified all tests that reference `level-card` selectors (breaking change surface)
- Direct read of `/Users/emil/code/lepdy/messages/en.json` + `he.json` — current `chessGame` translation keys, identifying gap for `hub.*` keys

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — architectural decision to add `assertNever` to `ChessView` in Phase 19

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly inspected in source, no new deps required
- Architecture: HIGH — all integration points traced through actual code (ChessGameContent, usePuzzleSession, audio.ts, StreakBadge)
- Pitfalls: HIGH — broken test surface identified from direct e2e file read, z-index issue from react-confetti usage pattern

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (stable MUI/React stack, 30-day window applies)
