# Phase 17: Session Complete + Progression UI - Research

**Researched:** 2026-03-22
**Domain:** React/MUI UI — session reward screen, mastery badge display, Firebase Remote Config flag addition
**Confidence:** HIGH

## Summary

Phase 17 replaces the minimal session-complete message in `ChessGameContent.tsx` with a full reward screen: 1-3 stars computed from first-try accuracy, mastery band chips per piece, "Getting harder!" advancement feedback, and a "Start New Session" button. All logic hooks already exist; this phase is primarily UI construction plus two targeted code changes: (1) adding `firstTryCount` tracking to `usePuzzleSession`, and (2) adding two new Firebase Remote Config flags for star thresholds.

The key discovery is that **`firstTryCount` does not currently exist** in `usePuzzleSession`. The CONTEXT.md states the hook "already tracks this" but examination of the source reveals it is absent from both the `UsePuzzleSessionReturn` interface and the hook's internal state. Adding it is a small, well-bounded change: increment a counter on the first correct answer per puzzle slot (only when the headIndex advances — wrong answers do not advance headIndex, so any `onAnswer(true)` call is inherently first-try).

Mastery tier detection for "Getting harder!" requires capturing session-start tiers before any puzzles execute and comparing them to end-of-session tiers. `usePuzzleProgress.sessionTiers` (a `MutableRefObject`) holds the session-frozen start tiers. The post-session `data.pieces[pieceId].tier` holds the current tier. Comparing them on the session-complete screen reveals which pieces advanced.

**Primary recommendation:** Implement as a single plan: (1) extend `usePuzzleSession` to expose `firstTryCount`, (2) add Firebase flag `chessStarThresholds`, (3) extract `SessionCompleteScreen` as a standalone component in the chess-game directory, (4) update all three translation files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 3 stars: 8+ first-try correct out of 10. 2 stars: 5-7. 1 star: 0-4 — generous thresholds for young kids
- Visual elements: big star display (1-3 stars), confetti on 3 stars, score text "N/10 correct!", "Start New Session" button
- Star thresholds configurable via Firebase Remote Config for post-launch tuning with Amplitude data
- First-try accuracy tracked by counting puzzles answered correctly on first tap (usePuzzleSession already tracks this)
- Band names: Beginner (tier 1), Intermediate (tier 2), Expert (tier 3) — maps to existing difficulty tiers
- Shown on session complete screen, listed per piece with piece emoji + band name
- Translated across Hebrew/English/Russian — add translation keys for each band name
- Visual style: colored chip/badge per piece — e.g., "♜ Rook — Expert" with color matching tier
- "Getting harder!" shown on session complete screen when any piece's tier advanced during the session
- Visual: celebratory text + arrow up icon below affected piece's mastery chip in accent color
- No "Getting easier" on de-escalation — positive feedback only per project principle
- Detect tier change by comparing tier before session (getSessionTier at start) vs current tier at end

### Claude's Discretion
- Exact star visual implementation (MUI icons vs custom SVG)
- Color scheme for mastery tier badges
- Exact confetti trigger timing and duration
- Layout of mastery chips on session complete screen

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESS-03 | User sees a session complete screen with 1-3 stars based on accuracy | `firstTryCount` added to `usePuzzleSession`; star thresholds via Firebase Remote Config flags; `SessionCompleteScreen` component renders star display + confetti + score text + "Start New Session" button |
| DIFF-04 | User sees their current mastery level as a named band per piece type ("Rook Beginner → Knight Expert") | `usePuzzleProgress.data.pieces[id].tier` exposes current tier; `sessionTiers.current` from `usePuzzleProgress` exposes start-of-session tier; mastery band chips rendered per piece on session complete screen; "Getting harder!" shown when start tier < end tier |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@mui/material` | 7.3.7 | `Box`, `Typography`, `Chip`, `Button`, `Fade` — all used on session complete screen | Existing project standard; RTL-compatible |
| `@mui/icons-material` | 7.3.7 | `StarIcon` (already imported in `ChessGameContent`), `ArrowUpwardIcon` for tier advancement | Already installed; `ArrowUpwardIcon` confirmed present |
| `react-confetti` | 6.4.0 | Full-screen confetti on 3-star session | Already used in `MovementPuzzle`, `CapturePuzzle`, `PieceIntroduction` |
| `next-intl` | 4.7.0 | `useTranslations('chessGame')` for all new strings | Existing i18n system; all 3 locales required |

### Established Pattern: Firebase Remote Config
Two new flags needed:
- `chessStarThreshold3` (number, default: 8) — first-try correct count for 3 stars
- `chessStarThreshold2` (number, default: 5) — first-try correct count for 2 stars

Pattern from existing flags: add to `FeatureFlags` interface in `lib/featureFlags/types.ts`, add to `DEFAULT_FLAGS`, add to `fetchFlags()` in `lib/featureFlags/providers/firebaseRemoteConfig.ts`.

**No new npm dependencies required.**

## Architecture Patterns

### Recommended File Structure
```
app/[locale]/games/chess-game/
├── ChessGameContent.tsx       # Modified: pass firstTryCount, startTiers, currentTiers to SessionCompleteScreen
├── SessionCompleteScreen.tsx  # NEW: extracted session complete UI component
hooks/
├── usePuzzleSession.ts        # Modified: add firstTryCount to state and UsePuzzleSessionReturn
lib/featureFlags/
├── types.ts                   # Modified: add chessStarThreshold3, chessStarThreshold2
├── providers/firebaseRemoteConfig.ts  # Modified: read two new flags
messages/
├── he.json                    # Modified: new keys under chessGame.ui
├── en.json                    # Modified: same keys
├── ru.json                    # Modified: same keys
```

### Pattern 1: firstTryCount in usePuzzleSession

`onAnswer(correct)` currently only advances `headIndex` when `correct === true`. Because wrong answers do not advance `headIndex`, any call to `onAnswer(true)` is definitionally first-try for that slot. Therefore, first-try count increments on every `correct === true` path.

```typescript
// In usePuzzleSession.ts — add to state:
const [firstTryCount, setFirstTryCount] = useState(0);

// In onAnswer — add alongside headIndex advance:
if (correct) {
  setFirstTryCount((prev) => prev + 1);
  setHeadIndex((prev) => prev + 1);
}

// In startNewSession — reset alongside other state:
setFirstTryCount(0);

// In UsePuzzleSessionReturn — add:
firstTryCount: number;
```

PersistedSession does not need to persist `firstTryCount` — on browser refresh mid-session the count resets to 0 gracefully. The session is only 10 puzzles; partial persistence of first-try count would complicate hydration for minimal benefit.

### Pattern 2: Star Calculation

```typescript
// Source: CONTEXT.md locked decisions + Firebase Remote Config pattern
function computeStars(firstTryCount: number, threshold3: number, threshold2: number): 1 | 2 | 3 {
  if (firstTryCount >= threshold3) return 3;
  if (firstTryCount >= threshold2) return 2;
  return 1;
}
```

Defaults: threshold3=8, threshold2=5. Called at render time of `SessionCompleteScreen` using `getFlag('chessStarThreshold3')` and `getFlag('chessStarThreshold2')`.

### Pattern 3: Tier Advancement Detection

`usePuzzleProgress` exposes two sources:
- `sessionTiers.current` — `Record<string, 1|2|3>` frozen at session start (session-start tier per piece)
- `data.pieces` — live current tier per piece (may have advanced during the session)

On the session complete screen, for each piece:
```typescript
const startTier = sessionTiers.current[piece.id] ?? 1;
const currentTier = data.pieces[piece.id]?.tier ?? 1;
const didAdvance = currentTier > startTier;
```

**Important:** `sessionTiers.current` is a `MutableRefObject` (not `.current`). The ref object itself is stable; callers access `.current`. This is per the Phase 15-01 decision: "sessionTiers returned as MutableRefObject (not .current) to satisfy react-hooks/refs lint rule — callers access .current in callbacks/effects."

### Pattern 4: SessionCompleteScreen Component

Extract the session-complete branch from `ChessGameContent` into `SessionCompleteScreen.tsx` following the existing decomposition pattern (the chess game directory already uses this for `StreakBadge`, `PieceIntroduction`, etc.).

Props:
```typescript
interface SessionCompleteScreenProps {
  firstTryCount: number;
  sessionTiers: React.MutableRefObject<Record<string, 1 | 2 | 3>>;
  progressData: PuzzleProgressData;
  onStartNew: () => void;
}
```

`ChessGameContent` passes `sessionTiers` and `progressData` directly from `usePuzzleProgress()`. It already calls `usePuzzleProgress` indirectly via `usePuzzleSession`, but to expose `sessionTiers` and `data` to the parent, `ChessGameContent` must call `usePuzzleProgress()` directly alongside `usePuzzleSession()`. Currently `usePuzzleProgress` is only called inside `usePuzzleSession`. Since `usePuzzleProgress` reads/writes localStorage and uses `getFlag`, calling it twice would create two independent instances — **this is a problem**.

**Solution:** Lift `usePuzzleProgress` to `ChessGameContent` and pass its return value into `usePuzzleSession` as a parameter (dependency injection), or expose `sessionTiers` and `data` directly from `usePuzzleSession`'s return value. The simpler approach: **add `sessionTiers` and `currentTiers` (a snapshot of `data.pieces`) to `UsePuzzleSessionReturn`** so callers don't need a second `usePuzzleProgress` call.

```typescript
// In UsePuzzleSessionReturn — add:
sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
currentTiersByPiece: Record<string, PiecePuzzleProgress>;
```

`usePuzzleSession` already holds a reference to `usePuzzleProgress` — it can forward these fields without creating a second instance.

### Pattern 5: Mastery Band Colors

Reuse `chessPieces[id].color` for piece chip background (already defined per piece). For band tier color: use project pastel palette:
- Tier 1 Beginner: `#9ed6ea` (blue, level 2 card color)
- Tier 2 Intermediate: `#dbc3e2` (purple, level 2 card color variant)
- Tier 3 Expert: `#ffcd36` (gold, level 3 card color)

These colors come from the existing `LEVELS` array in `ChessGameContent.tsx`.

### Pattern 6: Confetti on 3 Stars

Follow `PieceIntroduction.tsx` pattern for full celebration:
```typescript
// PieceIntroduction uses:
{showCelebration && <Confetti recycle={false} numberOfPieces={300} />}
```

For 3-star session complete, use the same pattern: render `<Confetti recycle={false} numberOfPieces={200} gravity={0.25} />` when stars === 3. Mount confetti in a `useState` that is set to true on first render when stars === 3, so it plays once on arrival.

### Pattern 7: New Translation Keys

New keys to add under `chessGame.ui` in all three message files:

```json
"starsEarned": "{count}/10 כוכבים!",
"score": "{count}/10 נכון!",
"masteryBeginner": "מתחיל",
"masteryIntermediate": "בינוני",
"masteryExpert": "מומחה",
"gettingHarder": "מתקשה!",
"sessionStars": "{stars} כוכבים!"
```

English:
```json
"score": "{count}/10 correct!",
"masteryBeginner": "Beginner",
"masteryIntermediate": "Intermediate",
"masteryExpert": "Expert",
"gettingHarder": "Getting harder!",
"sessionStars": "{stars} stars!"
```

Russian:
```json
"score": "{count}/10 правильно!",
"masteryBeginner": "Новичок",
"masteryIntermediate": "Средний",
"masteryExpert": "Эксперт",
"gettingHarder": "Становится сложнее!",
"sessionStars": "{stars} звезды!"
```

### Anti-Patterns to Avoid

- **Double usePuzzleProgress instantiation:** Do not call `usePuzzleProgress()` in both `ChessGameContent` and `usePuzzleSession`. Forward `sessionTiers` and `currentTiersByPiece` through `UsePuzzleSessionReturn` instead.
- **Persisting firstTryCount to sessionStorage:** Unnecessary complexity; mid-session refresh yields a graceful reset to 0 which is acceptable.
- **Using useEffect to trigger confetti:** Mount confetti directly when `stars === 3` using a `useState(stars === 3)` initialized once, following existing PieceIntroduction pattern.
- **RTL text reversal on badge row:** Wrap star row and badge row in `direction: 'ltr'` Box as done in `StreakBadge.tsx` for consistent display.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Star icons | Custom SVG stars | `StarIcon` from `@mui/icons-material` (already imported in ChessGameContent line 14) | Already imported, consistent with MUI icon set |
| Confetti | Custom CSS animation | `react-confetti` (already installed) | Already used in 3 chess components |
| Badge chips | Custom styled div | `MUI Chip` (already used in `MyWordsContent.tsx`) | RTL-safe, MUI consistent |
| Advancement arrow | Custom SVG | `ArrowUpwardIcon` from `@mui/icons-material` (confirmed installed) | Zero dependency cost |

## Common Pitfalls

### Pitfall 1: firstTryCount Not Hydrated from sessionStorage
**What goes wrong:** After a page refresh mid-session, `firstTryCount` reads 0 instead of its actual value, so the session complete screen may show fewer stars than earned.
**Why it happens:** `firstTryCount` is not included in `PersistedSession`.
**How to avoid:** Accept this as a product decision (10-puzzle session, refresh is rare) — do not add it to sessionStorage. Document in code that `firstTryCount` is session-memory-only.
**Warning signs:** If firstTryCount is unexpectedly 0 at session end — mid-session refresh occurred.

### Pitfall 2: sessionTiers.current Empty at Session Complete
**What goes wrong:** `sessionTiers.current` is `{}` because pieces were never individually queried via `getSessionTier` during the session.
**Why it happens:** `getSessionTier` lazily populates the ref on first call per piece. If a piece never appears in the session queue, it has no entry.
**How to avoid:** When comparing start vs end tiers, treat missing `sessionTiers.current[pieceId]` as tier 1 (the default). Only show "Getting harder!" for pieces that both (a) appear in sessionTiers.current AND (b) have a higher current tier.
**Warning signs:** No "Getting harder!" ever shown even after obvious advancement.

### Pitfall 3: MutableRefObject vs .current Misuse
**What goes wrong:** Passing `sessionTiers.current` (a snapshot) as a prop to `SessionCompleteScreen` instead of `sessionTiers` (the ref object). The snapshot captures the value at render time, but the ref is only populated lazily during puzzle answers, so the snapshot may be stale.
**Why it happens:** Phase 15-01 decision established the ref pattern specifically to handle this.
**How to avoid:** Pass the entire `MutableRefObject` (`sessionTiers`) to `SessionCompleteScreen` and access `.current` inside the component at render time — by session-complete time all pieces have been queried.
**Warning signs:** "Getting harder!" never shows despite tier changes visible in localStorage.

### Pitfall 4: Calling usePuzzleProgress Twice
**What goes wrong:** Two hook instances both read from and write to `lepdy_chess_puzzle_progress` in localStorage, causing phantom double-writes and potential state desync.
**Why it happens:** Developer calls `usePuzzleProgress()` in both `ChessGameContent` and inside `usePuzzleSession`.
**How to avoid:** Forward `sessionTiers` and `currentTiersByPiece` through `UsePuzzleSessionReturn` (see Architecture Pattern 4).
**Warning signs:** Progress resets unexpectedly, or console shows double writes to localStorage key.

### Pitfall 5: RTL Star Row Reversal
**What goes wrong:** In Hebrew (RTL), the star row renders right-to-left showing stars in reversed order (e.g., star 3 on the left, star 1 on the right).
**Why it happens:** MUI Box respects the RTL direction from the theme.
**How to avoid:** Wrap star display row in `<Box sx={{ direction: 'ltr' }}>` as done in `StreakBadge.tsx`.
**Warning signs:** In Hebrew locale, the unfilled star appears on the left of the filled stars.

## Code Examples

### Adding firstTryCount to usePuzzleSession
```typescript
// hooks/usePuzzleSession.ts

export interface UsePuzzleSessionReturn {
  currentPuzzle: SessionPuzzle | null;
  sessionIndex: number;
  consecutiveCorrect: number;
  firstTryCount: number;        // NEW: count of puzzles answered correctly on first tap
  isSessionComplete: boolean;
  onAnswer: (correct: boolean) => void;
  startNewSession: () => void;
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;  // NEW: forwarded from usePuzzleProgress
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;   // NEW: forwarded from usePuzzleProgress
}

// In hook body — add state:
const [firstTryCount, setFirstTryCount] = useState(0);

// In onAnswer — extend correct branch:
if (correct) {
  setFirstTryCount((prev) => prev + 1);
  setHeadIndex((prev) => prev + 1);
}

// In startNewSession — reset:
setFirstTryCount(0);

// In return:
return {
  // ...existing fields
  firstTryCount,
  sessionTiers,      // from usePuzzleProgress()
  currentTiersByPiece: data.pieces,  // from usePuzzleProgress()
};
```

### SessionCompleteScreen Component Skeleton
```typescript
// app/[locale]/games/chess-game/SessionCompleteScreen.tsx
'use client';
import { MutableRefObject } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Confetti from 'react-confetti';
import { useTranslations } from 'next-intl';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';
import { chessPieces } from '@/data/chessPieces';
import { PiecePuzzleProgress } from '@/hooks/usePuzzleProgress';

interface SessionCompleteScreenProps {
  firstTryCount: number;
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
  onStartNew: () => void;
}
```

### Firebase Remote Config Flag Addition
```typescript
// lib/featureFlags/types.ts — extend FeatureFlags:
chessStarThreshold3: number;  // default 8 — first-try count for 3 stars
chessStarThreshold2: number;  // default 5 — first-try count for 2 stars

// DEFAULT_FLAGS:
chessStarThreshold3: 8,
chessStarThreshold2: 5,

// firebaseRemoteConfig.ts fetchFlags():
chessStarThreshold3: this.getNumberFlag('chessStarThreshold3', getValue),
chessStarThreshold2: this.getNumberFlag('chessStarThreshold2', getValue),
```

### MUI Chip Pattern for Mastery Badge (from MyWordsContent.tsx)
```typescript
// Existing Chip usage in project:
<Chip
  label={t('filters.all')}
  onClick={() => setActiveFilter('all')}
  // ...sx props
/>

// Phase 17 mastery chip pattern:
<Chip
  label={`${piece.emoji} ${t(`pieces.${piece.id}`)} — ${t(`ui.mastery${bandName}`)}`}
  sx={{ bgcolor: tierColor, fontWeight: 'bold' }}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Minimal "session complete" text + two buttons | Full reward screen with stars, mastery chips, confetti | Phase 17 | User sees satisfying reward and concrete progression goal |
| firstTryCount not tracked | firstTryCount added to UsePuzzleSessionReturn | Phase 17 | Enables star calculation |
| No "Getting harder!" feedback | Tier advancement shown per piece on session complete screen | Phase 17 | Satisfies DIFF-04 |

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. This phase is pure code/UI changes within the existing stack. All required libraries (`react-confetti`, `@mui/icons-material`, Firebase Remote Config) are already installed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "Chess session complete"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-03 | Session complete screen shows stars | E2E smoke | `npm test -- --grep "session complete"` | ❌ Wave 0 |
| SESS-03 | "Start New Session" button restarts session | E2E smoke | `npm test -- --grep "Start New Session"` | ❌ Wave 0 |
| DIFF-04 | Mastery chips visible on session complete screen | E2E smoke | `npm test -- --grep "mastery"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] E2E tests for session complete screen in `e2e/app.spec.ts` — covers SESS-03 and DIFF-04

The existing test suite already loads the chess game page and navigates to puzzles. New tests can follow the established `page.addInitScript` localStorage pattern.

## Sources

### Primary (HIGH confidence)
- Direct code reading: `hooks/usePuzzleSession.ts` — confirmed firstTryCount absent from interface and state
- Direct code reading: `hooks/usePuzzleProgress.ts` — confirmed sessionTiers is MutableRefObject, data.pieces holds current tiers
- Direct code reading: `app/[locale]/games/chess-game/ChessGameContent.tsx` — confirmed minimal session-complete screen at line 119-138
- Direct code reading: `app/[locale]/games/chess-game/MovementPuzzle.tsx` + `CapturePuzzle.tsx` — confirmed Confetti usage pattern (recycle=false, numberOfPieces=80, gravity=0.3)
- Direct code reading: `lib/featureFlags/types.ts` + `firebaseRemoteConfig.ts` — confirmed exact pattern for adding new numeric flags
- Direct code reading: `app/[locale]/games/chess-game/StreakBadge.tsx` — confirmed direction:ltr RTL pattern for badge
- Direct code reading: `messages/he.json`, `en.json`, `ru.json` — confirmed existing chessGame.ui translation keys
- Direct code reading: `data/chessPieces.ts` — confirmed emoji and color per piece
- Direct code reading: `.planning/phases/17-session-complete-progression-ui/17-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` accumulated context — Phase 15-01 decision: sessionTiers as MutableRefObject pattern
- `e2e/app.spec.ts` — established Playwright test patterns for chess game

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present and at specified versions; no new dependencies
- Architecture: HIGH — all hook interfaces and internal state read directly from source; integration points verified
- Pitfalls: HIGH — pitfalls derived from direct code examination, not speculation
- firstTryCount gap: HIGH — confirmed absent from source code despite CONTEXT.md claim

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack; no external API changes)
