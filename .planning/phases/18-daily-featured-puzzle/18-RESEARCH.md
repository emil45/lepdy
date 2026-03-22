# Phase 18: Daily Featured Puzzle - Research

**Researched:** 2026-03-22
**Domain:** Client-side deterministic daily puzzle selection, localStorage completion tracking, level map UI extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Deterministic per day using seeded random: `hashCode(YYYY-MM-DD) mod puzzle pool size`. No server needed, same result for all users
- Draw from all 95 puzzles (movement + capture) — full pool, random selection rotates daily
- UTC timezone for midnight rotation — consistent for all users, no timezone ambiguity
- Any difficulty tier — variety keeps it interesting, some days easy, some hard
- New 4th card above the existing 3 levels — prominent position, always accessible, distinct visual
- Visual: calendar emoji + "Daily Puzzle" label + today's date — clear purpose, fresh every day
- Always available regardless of level progress — gives new users something to do immediately
- Warm orange/gold color to draw attention as something special, distinct from level cards
- Track completion via localStorage key `lepdy_chess_daily_YYYY-MM-DD` — simple, auto-expires
- Completed state: same card with checkmark overlay + "Come back tomorrow!" text, card disabled
- On completion: celebration (confetti + sound), then card shows completed state
- Daily puzzle is standalone — separate from 10-puzzle sessions, does not count toward session progress

### Claude's Discretion
- Exact hash function implementation for date-seeded random
- Animation details for daily puzzle celebration
- Exact layout positioning of the daily card relative to level cards
- Whether to show the puzzle type (movement/capture) on the daily card

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESS-04 | User can play a daily featured puzzle that is the same for all players each day | Deterministic seeded selection via `hashCode(YYYY-MM-DD) mod 95`; UTC date key; localStorage completion gate; 'daily' view in ChessView type |
</phase_requirements>

---

## Summary

Phase 18 adds a daily featured puzzle card to the chess level map. The core mechanic is deterministic puzzle selection: a simple string hash of the UTC date `YYYY-MM-DD` modulo the total puzzle count (95) gives the same index for every user on the same calendar day without any server infrastructure.

The implementation touches three areas: (1) a `useDailyPuzzle` hook that owns date hashing, puzzle selection, and localStorage completion tracking under key `lepdy_chess_daily_YYYY-MM-DD`; (2) a `DailyPuzzleCard` component rendering the 4th level map card in warm orange/gold; and (3) `ChessGameContent` extended with a `'daily'` view that renders the selected puzzle through the existing `MovementPuzzle` or `CapturePuzzle` components unchanged.

Because the daily puzzle is entirely standalone — no session queue, no tier advancement — the integration surface is narrow. The puzzle completes after a single correct answer (not a 10-puzzle session), triggers confetti + sound identically to in-session correct answers, then locks the card for the rest of the calendar day.

**Primary recommendation:** Implement as a thin hook + card + view, reusing all existing puzzle renderers, celebration patterns, and localStorage conventions. No new dependencies needed.

---

## Standard Stack

### Core (all already installed — no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React / useState, useEffect | 19.2.3 | Local state for completion flag and view | Existing pattern everywhere |
| react-confetti | 6.4.0 | Celebration on daily completion | Already used in MovementPuzzle and SessionCompleteScreen |
| MUI Card, CardActionArea, Box, Typography | 7.3.7 | DailyPuzzleCard layout | Matches LevelMapCard implementation |
| next-intl useTranslations | 4.7.0 | i18n for new strings (daily label, "Come back tomorrow") | Required by all client components |

**Installation:** No new packages required. All dependencies are present.

---

## Architecture Patterns

### Recommended Project Structure (new files only)
```
hooks/
└── useDailyPuzzle.ts         # date key, hash, puzzle selection, completion tracking

app/[locale]/games/chess-game/
└── DailyPuzzleCard.tsx       # 4th map card, completed/available states
```

**Modified files:**
- `app/[locale]/games/chess-game/ChessGameContent.tsx` — add `'daily'` to ChessView, render daily view branch, mount DailyPuzzleCard
- `messages/he.json`, `messages/en.json`, `messages/ru.json` — add daily puzzle translation keys

---

### Pattern 1: Deterministic Date Hash (useDailyPuzzle hook)

**What:** A pure hash of the UTC date string selects a stable index into the combined puzzle pool.

**Why this works:** `new Date().toISOString().split('T')[0]` already used in `useStreak.ts` for UTC date as `YYYY-MM-DD`. Apply the same pattern.

**Hash choice (Claude's discretion):** Java-style djb2 / polynomial hash. Simple, no dependencies, proven deterministic:

```typescript
// Source: well-known djb2 string hash, no external library needed
function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0; // bitwise OR keeps it 32-bit signed int
  }
  return Math.abs(hash);
}
```

**Combined pool:** `[...movementPuzzles, ...capturePuzzles]` gives indices 0–94 (61 + 34 = 95 total). `hashDate(dateStr) % allPuzzles.length` gives today's puzzle index.

**Confidence:** HIGH — verified pool sizes in `data/chessPuzzles.ts` (line 32: movementPuzzles export; line 737: capturePuzzles export; `grep -c "id:" = 97` includes 2 interface fields, actual puzzle count is 95 items).

```typescript
// Source: verified from data/chessPuzzles.ts structure
import { movementPuzzles, capturePuzzles } from '@/data/chessPuzzles';
import { MovementPuzzle, CapturePuzzle } from '@/data/chessPuzzles';

type DailyPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle };

function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC — matches useStreak pattern
}

function getDailyPuzzle(dateStr: string): DailyPuzzle {
  const allPuzzles: DailyPuzzle[] = [
    ...movementPuzzles.map((p) => ({ type: 'movement' as const, puzzle: p })),
    ...capturePuzzles.map((p) => ({ type: 'capture' as const, puzzle: p })),
  ];
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % allPuzzles.length;
  return allPuzzles[idx];
}
```

---

### Pattern 2: localStorage Completion Tracking (useDailyPuzzle hook)

**What:** Single boolean flag per calendar day. Auto-expires naturally — old keys just stay inert.

**Key format:** `lepdy_chess_daily_YYYY-MM-DD` (locked decision)

**Pattern matches:** `useChessProgress.ts` read-on-mount + save-on-change with try/catch.

```typescript
const DAILY_STORAGE_PREFIX = 'lepdy_chess_daily_';

function getDailyKey(dateStr: string): string {
  return `${DAILY_STORAGE_PREFIX}${dateStr}`;
}

// In hook body:
const [isCompleted, setIsCompleted] = useState(false);

useEffect(() => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(getDailyKey(dateKey));
    if (stored === 'true') setIsCompleted(true);
  } catch (e) {
    console.error('[chess] Failed to load daily puzzle state:', e);
  }
}, [dateKey]);

const markCompleted = useCallback(() => {
  try {
    localStorage.setItem(getDailyKey(dateKey), 'true');
    setIsCompleted(true);
  } catch (e) {
    console.error('[chess] Failed to save daily puzzle state:', e);
  }
}, [dateKey]);
```

---

### Pattern 3: DailyPuzzleCard Component

**What:** A 4th card rendered above (or below) the existing LEVELS map cards in ChessGameContent.

**Locked visual:** Calendar emoji, "Daily Puzzle" label, today's date text, warm orange/gold background. Completed state shows checkmark + "Come back tomorrow!" and disables the card.

**Model from:** `LevelMapCard` in `ChessGameContent.tsx` — same Card + CardActionArea structure.

```typescript
// Mirrors LevelMapCard pattern from ChessGameContent.tsx lines 46-89
// DailyPuzzleCard sits as a distinct component, not using LevelMapCard
// because it has no levelNumber, different completed UI, and always-unlocked state
interface DailyPuzzleCardProps {
  dateLabel: string;     // e.g. "22.3.2026"
  isCompleted: boolean;
  onSelect: () => void;
}
```

**Color (locked):** Warm orange/gold — `'#ffb74d'` fits MUI orange palette and is distinct from existing level colors (`#9ed6ea`, `#dbc3e2`, `#ffcd36`). Alternatively `'#ffa726'` (orange[400]). The exact shade is Claude's discretion.

---

### Pattern 4: ChessView Extension and Daily View Rendering

**What:** Add `'daily'` to the `ChessView` union in `ChessGameContent.tsx`. The daily view renders the puzzle component directly (not via `usePuzzleSession`).

**Current type (line 28):**
```typescript
type ChessView = 'map' | 'level-1' | 'session';
```

**Extended:**
```typescript
type ChessView = 'map' | 'level-1' | 'session' | 'daily';
```

**Daily view branch:** Check `currentView === 'daily'`. No session scaffolding — render `MovementPuzzle` or `CapturePuzzle` directly with a custom `onAnswer` that only cares about `correct === true` to trigger celebration + completion. `onExit` goes back to `'map'`.

**Key insight:** `MovementPuzzle` and `CapturePuzzle` already handle their own confetti per-answer (`showCorrectConfetti` state in MovementPuzzle, `react-confetti` with `recycle={false}`). The daily view does not need its own confetti layer for the correct-answer moment — it can inherit the per-puzzle confetti. A distinct "daily complete" celebration (larger confetti burst or extra sound) can be triggered in the `onAnswer` callback when the daily is finished.

---

### Pattern 5: Translation Keys

New i18n keys needed across `he.json`, `en.json`, `ru.json` under `chessGame`:

```json
"daily": {
  "label": "Daily Puzzle",
  "dateLabel": "{date}",
  "comeBackTomorrow": "Come back tomorrow!",
  "completed": "Done!"
}
```

Hebrew (he.json):
```json
"daily": {
  "label": "פאזל יומי",
  "comeBackTomorrow": "תחזור מחר!",
  "completed": "סיימת!"
}
```

Russian (ru.json):
```json
"daily": {
  "label": "Ежедневная задача",
  "comeBackTomorrow": "Вернись завтра!",
  "completed": "Готово!"
}
```

---

### Anti-Patterns to Avoid

- **Using local timezone for date key:** `new Date().toLocaleDateString()` varies by user locale and timezone. Must use `new Date().toISOString().split('T')[0]` (UTC) — confirmed locked decision and matches `useStreak.ts` pattern.
- **Routing daily through usePuzzleSession:** The daily puzzle is standalone (1 puzzle, no tier progression, no session count). Mixing it into the session hook would break the session queue and firstTryCount. Keep it separate.
- **Advancing puzzle tier on daily correct answer:** Daily puzzles are a fixed slot — they must NOT call `recordCorrect`/`recordWrong` from `usePuzzleProgress`. Tier progression is for the regular session only.
- **Preventing replay after midnight using time check:** The localStorage key is date-specific (`lepdy_chess_daily_2026-03-22`). Old keys expire naturally — no cleanup logic needed, no time arithmetic needed.
- **Placing DailyPuzzleCard inside the LEVELS.map():** The daily card is not a level (no level number, no lock system). It should be rendered as a sibling element outside the `LEVELS.map()`, not by adding an entry to the LEVELS array.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti celebration | Custom CSS animation or keyframe | `react-confetti` (already installed) | Used in MovementPuzzle and SessionCompleteScreen; same props pattern |
| Date-stable selection | Server endpoint or time API | `new Date().toISOString().split('T')[0]` + hash | No server needed; UTC gives global consistency |
| Completion persistence | IndexedDB, cookie, server session | localStorage with date-keyed string | Matches all other chess progress patterns; auto-expires |
| Puzzle type detection | Custom type registry | Union type discriminant `puzzle.type === 'movement'` | `SessionPuzzle` type already uses this; `DailyPuzzle` type can mirror it |

---

## Common Pitfalls

### Pitfall 1: UTC Midnight vs Local Midnight
**What goes wrong:** Using `new Date()` without `.toISOString()` gives local time. A user in UTC+3 at 11 PM local time (8 PM UTC) would see tomorrow's UTC puzzle.
**Why it happens:** JavaScript's `Date` methods like `getDate()`, `getMonth()` use local timezone unless you use UTC methods or ISO string.
**How to avoid:** Always derive the date key as `new Date().toISOString().split('T')[0]`. This is already the established pattern in `useStreak.ts` — follow it exactly.
**Warning signs:** Date keys differ between Hebrew-locale users and English-locale users in different timezones.

### Pitfall 2: Hash Overflow / Negative Index
**What goes wrong:** A simple string hash with `charCodeAt` accumulation can overflow JavaScript's 32-bit integer space and produce negative values.
**Why it happens:** JavaScript numbers are 64-bit floats, but bitwise operations treat them as 32-bit signed ints. `| 0` coercion can yield negative.
**How to avoid:** Wrap with `Math.abs(hash)` before modulo. Use `| 0` for 32-bit wrapping during accumulation to keep numbers manageable, then `Math.abs` at the end.
**Warning signs:** `hashDate()` returns a negative number on some date strings.

### Pitfall 3: Daily View Missing StreakBadge / Progress Indicator Leak
**What goes wrong:** Copying the session view template into the daily view accidentally includes `<StreakBadge count={consecutiveCorrect} />` or `{progressText}` which refers to session state.
**Why it happens:** The session and daily views are siblings in the same component. Copy-paste from the session branch.
**How to avoid:** The daily view renders only the puzzle component (MovementPuzzle or CapturePuzzle) with onAnswer and onExit. No StreakBadge, no progress counter. The puzzle is standalone.

### Pitfall 4: Celebrating Too Early (Before Correct Answer)
**What goes wrong:** Triggering `markCompleted()` and transitioning to the completed card state before the puzzle's internal animation finishes.
**Why it happens:** `onAnswer(true)` is called by MovementPuzzle/CapturePuzzle, but they have a 400-500ms internal animation before advancing (the `isAdvancing` flag).
**How to avoid:** The daily view's `onAnswer` handler should only mark completion and surface the post-completion state — it does not need to navigate away. The user can tap the exit button themselves after seeing the confetti. Alternatively, navigate back to map after a short delay (600-800ms) to let the puzzle's own animation complete.

### Pitfall 5: Daily Card Position Breaks RTL Layout
**What goes wrong:** Hardcoded LTR layout assumptions in the card (e.g., `mr: 2` for margin right) look wrong in Hebrew RTL mode.
**Why it happens:** MUI handles RTL automatically for many props but explicit directional margins (`mr`, `ml`) don't flip.
**How to avoid:** Use MUI `sx` prop with `ms` (margin-start) and `me` (margin-end) instead of `mr`/`ml`. Inspect LevelMapCard — it uses `mr: 2` for the emoji column; follow the same pattern since LevelMapCard already works in RTL.

---

## Code Examples

### useDailyPuzzle hook shape
```typescript
// New file: hooks/useDailyPuzzle.ts
// Source: pattern derived from hooks/useChessProgress.ts and hooks/useStreak.ts
'use client';

export interface UseDailyPuzzleReturn {
  dateKey: string;          // YYYY-MM-DD UTC
  dailyPuzzle: DailyPuzzle; // deterministic for dateKey
  isCompleted: boolean;
  markCompleted: () => void;
}
```

### Rendering the daily view in ChessGameContent
```typescript
// Source: mirrors session view pattern in ChessGameContent.tsx lines 117-178
if (currentView === 'daily') {
  const { dailyPuzzle, isCompleted, markCompleted, dateKey } = useDailyPuzzle();

  // NOTE: hooks can't be called inside conditions — daily hook must be called at top of component
  if (dailyPuzzle.type === 'movement') {
    return (
      <Fade in={true} timeout={300}>
        <div>
          <MovementPuzzle
            puzzle={dailyPuzzle.puzzle}
            onAnswer={(correct) => { if (correct) { markCompleted(); playRandomCelebration(); } }}
            onExit={() => setCurrentView('map')}
          />
        </div>
      </Fade>
    );
  }
  // capture branch analogous
}
```

**Note:** `useDailyPuzzle` must be called unconditionally at the top of `ChessGameContent`, not inside the `if (currentView === 'daily')` block. This is standard React hooks rules.

### LevelMapCard completed state (reference — existing)
```typescript
// Source: ChessGameContent.tsx lines 77-83
{isCompleted && (
  <Box data-testid="level-card-completed" sx={{ display: 'flex', alignItems: 'center' }}>
    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28, mr: 0.5 }} />
    <StarIcon sx={{ color: '#ffd700', fontSize: 28 }} />
  </Box>
)}
```
DailyPuzzleCard completed state replaces stars with "Come back tomorrow!" text.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side daily seed | Client-side deterministic hash | Locked decision | No server needed; works offline |
| Session-based completion | Date-keyed localStorage flag | Phase 18 | Simple; auto-expires; no cleanup |

---

## Open Questions

1. **Exact date label format on the card**
   - What we know: locked decision says "today's date" on the card
   - What's unclear: Format — `22.3.2026` (IL convention) vs `March 22` vs locale-specific formatting
   - Recommendation: Use `new Date().toLocaleDateString(locale, { day: 'numeric', month: 'numeric', year: 'numeric' })` with the current next-intl locale. Falls back to a sane default for all three locales.

2. **Card ordering — daily above or below existing 3 levels**
   - What we know: locked decision says "4th card above the existing 3 levels" — "above" means rendered first, topmost position in the list
   - What's unclear: None — "above" and "4th card" are slightly contradictory (4th implies last) but "prominent position" and "always accessible" suggests top. Treat as top position.
   - Recommendation: Render DailyPuzzleCard first, then LEVELS.map() below it.

3. **After daily completion — stay on puzzle or auto-return to map**
   - What we know: "card shows completed state" after celebration
   - What's unclear: Whether the puzzle view dismisses automatically or requires user to tap exit
   - Recommendation: After `markCompleted()`, navigate back to map after ~800ms delay (enough for puzzle's own confetti to settle). This matches the implicit expectation that the card then shows "Come back tomorrow".

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase uses only existing in-repo code, no new CLI tools, databases, or services).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SESS-04 | Daily puzzle card visible on chess level map | smoke | `npm test -- --grep "chess"` | ✅ existing suite |
| SESS-04 | Daily puzzle card navigates to a puzzle view | smoke | `npm test -- --grep "chess"` | ✅ extending existing spec |
| SESS-04 | Daily puzzle deterministic for same date | unit | manual reasoning / hash purity | n/a — pure function |

**Per CLAUDE.md testing guidelines:** Since this adds a new entry point to an existing game page (not a new route), the existing chess game test can be extended with one check that the daily card renders. No standalone test file needed.

### Wave 0 Gaps
- [ ] Extend `e2e/app.spec.ts` chess section: assert `data-testid="daily-puzzle-card"` is visible on the chess game page — covers SESS-04 entry point requirement.

---

## Sources

### Primary (HIGH confidence)
- `data/chessPuzzles.ts` — verified 61 movement + 34 capture = 95 total puzzles; combined array indices 0–94
- `hooks/useChessProgress.ts` — localStorage read/write pattern with try/catch; `isInitialized` guard
- `hooks/useStreak.ts` line 38 — `getTodayDate()` uses `new Date().toISOString().split('T')[0]` (UTC)
- `app/[locale]/games/chess-game/ChessGameContent.tsx` — `ChessView` type, `LevelMapCard` implementation, view routing pattern
- `app/[locale]/games/chess-game/MovementPuzzle.tsx` — `onAnswer(correct: boolean)` interface, confetti pattern (`recycle={false} numberOfPieces={80}`)
- `app/[locale]/games/chess-game/CapturePuzzle.tsx` — same `onAnswer` / `onExit` props interface
- `app/[locale]/games/chess-game/SessionCompleteScreen.tsx` — `Confetti recycle={false} numberOfPieces={200}` pattern
- `messages/he.json`, `messages/en.json` — existing `chessGame` translation structure

### Secondary (MEDIUM confidence)
- MDN / well-known: djb2-style polynomial hash is a standard deterministic string hash with no external dependency requirement

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json; no new installs
- Architecture: HIGH — patterns read directly from existing source files
- Pitfalls: HIGH — derived from reading actual hook implementations and MUI RTL conventions
- Hash function: HIGH — well-known algorithm, verified edge case (negative overflow) with explicit fix

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack; no fast-moving dependencies)
