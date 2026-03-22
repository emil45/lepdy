# Phase 16: Session Hook + Puzzle Refactor - Research

**Researched:** 2026-03-22
**Domain:** React custom hook architecture, sessionStorage persistence, CSS animation, puzzle component refactoring
**Confidence:** HIGH

## Summary

Phase 16 introduces a `usePuzzleSession` hook that replaces the ad-hoc puzzle iteration logic currently embedded in MovementPuzzle and CapturePuzzle. The hook pre-generates all 10 puzzles at session start, tracks a consecutive-correct streak counter, persists mid-session state in sessionStorage, and signals session completion so `ChessGameContent` can call `completeLevel()`. The puzzle components become pure renderers that receive a `puzzle` prop and call back via `onAnswer(correct: boolean)`.

This is a pure refactor + new-feature addition over existing patterns. No new npm dependencies are needed — the project already has `selectNextPuzzle` in `utils/puzzleGenerator.ts`, the MUI `keyframes` API in use by other game pages, and the `localStorage` hook pattern to copy for `sessionStorage`. The streak badge is a single MUI `Chip` or `Box` with a CSS scale-bounce animation identical to what `counting-game` already uses.

**Primary recommendation:** Pre-generate the 10-puzzle queue on session start, store queue + head index + streak counter in sessionStorage as a single JSON blob. Both puzzle components receive a typed `puzzle` prop and call `onAnswer(correct)`. `usePuzzleSession` owns all level-completion and progress-recording logic.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `hooks/usePuzzleSession.ts` manages 10-puzzle queue, current index, streak counter, session completion state. Consumes `selectNextPuzzle` from puzzleGenerator
- Mid-session state persists in sessionStorage — survives navigation within tab, clears on tab close (fresh session)
- All 10 puzzles pre-generated at session start using `selectNextPuzzle` in a loop — guarantees no duplicates
- Movement and capture puzzles mix within a session, respecting per-piece difficulty tier
- Floating badge/chip above the board shows "N in a row!" with animation on increment
- Counter visible only at 2+ consecutive correct — "1 in a row" feels odd
- Scale bounce animation (quick pop to 1.2x then back) on streak increment — matches existing celebration patterns
- Counter disappears silently on wrong answer — no negative feedback per project principle
- MovementPuzzle: replace ORDERED_PUZZLES and puzzleIndex state with props: `puzzle` and `onAnswer(correct: boolean)` — component becomes a pure puzzle renderer
- CapturePuzzle: same pattern — receive `puzzle` + `onAnswer` as props
- `usePuzzleSession` calls `completeLevel(2)` or `completeLevel(3)` after session ends — replaces per-component completion logic
- Phase 16 shows minimal "Session complete!" message. Phase 17 adds stars and mastery UI

### Claude's Discretion
- Exact sessionStorage key name and serialization format
- How to mix movement/capture puzzles within a session (alternating, random, weighted)
- Exact animation CSS for streak bounce
- Whether to show progress indicator (e.g., "5/10") during session

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESS-01 | User plays structured 10-puzzle sessions with a clear start and end | `usePuzzleSession` pre-generates 10-puzzle queue; session-complete screen shown after index reaches 10 |
| SESS-02 | User sees a consecutive-correct streak counter during play ("4 in a row!") | Streak state in `usePuzzleSession`; MUI Chip + keyframes bounce animation above board |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` + `useEffect` | 19.2.3 (project) | Hook state and storage sync | Already used for all chess hooks |
| MUI `Chip` or `Box` | 7.3.7 (project) | Streak badge rendering | Consistent with all game UI |
| MUI `keyframes` | 7.3.7 (project) | Scale-bounce animation | Already imported in `counting-game/page.tsx` |
| Browser `sessionStorage` | Web platform | Mid-session persistence | Clears on tab close — exactly the desired lifecycle |

### No New Dependencies Required
The entire feature is buildable from:
- `utils/puzzleGenerator.ts` (`selectNextPuzzle`, `GeneratorState`) — exists, Phase 15
- `hooks/usePuzzleProgress.ts` (`recordCorrect`, `recordWrong`, `getSessionTier`) — exists, Phase 15
- `hooks/useChessProgress.ts` (`completeLevel`) — exists
- `data/chessPuzzles.ts` (`movementPuzzles`, `capturePuzzles`, types `MovementPuzzle`, `CapturePuzzle`) — exists

**Installation:** none required

## Architecture Patterns

### Recommended File Changes
```
hooks/
└── usePuzzleSession.ts        # NEW — session queue, streak, persistence, completion

app/[locale]/games/chess-game/
├── MovementPuzzle.tsx         # REFACTOR — remove ORDERED_PUZZLES; accept puzzle prop + onAnswer
├── CapturePuzzle.tsx          # REFACTOR — remove ORDERED_PUZZLES; accept puzzle prop + onAnswer
├── StreakBadge.tsx            # NEW (optional inline in session wrapper) — streak display
└── ChessGameContent.tsx       # MINOR EDIT — thread usePuzzleSession between levels and puzzle components
```

### Pattern 1: usePuzzleSession Hook Interface

The hook is instantiated inside ChessGameContent (or a thin session wrapper) and provides:

```typescript
// hooks/usePuzzleSession.ts
import { MovementPuzzle, CapturePuzzle } from '@/data/chessPuzzles';

export type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle };

export interface UsePuzzleSessionReturn {
  /** Current puzzle (null only before first load, never null once started) */
  currentPuzzle: SessionPuzzle | null;
  /** 0-based index within the 10-puzzle session */
  sessionIndex: number;
  /** Consecutive correct answers in a row (session-scoped) */
  consecutiveCorrect: number;
  /** True when all 10 puzzles have been answered */
  isSessionComplete: boolean;
  /** Call after each puzzle is answered — advances to next puzzle */
  onAnswer: (correct: boolean) => void;
  /** Start a fresh session (clears sessionStorage) */
  startNewSession: () => void;
}
```

**Why this shape:** `onAnswer` is the single mutation surface — it handles both puzzle-progress recording and streak updates internally. Components call `onAnswer(true)` or `onAnswer(false)` without knowing about `usePuzzleProgress` at all.

### Pattern 2: sessionStorage Serialization

```typescript
// Recommended key and shape
const SESSION_KEY = 'lepdy_chess_session';

interface PersistedSession {
  /** Pre-generated list of 10 puzzle IDs with type tag */
  queue: Array<{ type: 'movement' | 'capture'; id: string }>;
  /** Index of the next puzzle to answer (0–9; 10 = complete) */
  headIndex: number;
  /** Consecutive correct at point of persist */
  consecutiveCorrect: number;
}
```

The full puzzle objects are NOT stored — only IDs. On hydration, look up puzzles by ID from the static arrays. This keeps the stored payload small (~200 bytes) and avoids stale data if puzzle content ever changes.

**Hydration flow:**
1. Read sessionStorage on mount (SSR guard: `typeof window !== 'undefined'`)
2. If valid session found: restore queue (resolve IDs to puzzle objects) + headIndex + streak
3. If no session / parse error: generate fresh 10-puzzle queue

### Pattern 3: Puzzle Queue Generation

```typescript
// Generate 10 puzzles at session start
// Mix ratio: 50/50 movement + capture (5 each), interleaved — Claude's discretion
function buildSessionQueue(
  movPool: MovementPuzzle[],
  capPool: CapturePuzzle[],
  getSessionTier: (id: ChessPieceId) => 1 | 2 | 3,
  genState: GeneratorState
): { queue: SessionPuzzle[]; finalState: GeneratorState } {
  let state = genState;
  const queue: SessionPuzzle[] = [];
  // 5 movement + 5 capture, alternating so variety is visible to child
  for (let i = 0; i < 5; i++) {
    const movTier = getSessionTier(/* piece sampling logic */);
    const { puzzle: movP, nextState: s1 } = selectNextPuzzle(movPool, movTier, state);
    state = s1;
    const capTier = getSessionTier(/* piece sampling logic */);
    const { puzzle: capP, nextState: s2 } = selectNextPuzzle(capPool, capTier, state);
    state = s2;
    queue.push({ type: 'movement', puzzle: movP });
    queue.push({ type: 'capture', puzzle: capP });
  }
  return { queue, finalState: state };
}
```

**Piece selection for tier:** `getSessionTier` requires a `ChessPieceId`. For each slot, pick a random piece from `chessPieces` and use its session-frozen tier. This is consistent with how `usePuzzleProgress.getSessionTier` already works.

### Pattern 4: Streak Badge Animation (matches existing project patterns)

```typescript
// From counting-game/page.tsx — same keyframes pattern
import { keyframes } from '@mui/material';

const streakBounce = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// Usage on streak counter render — animate via key prop trick
<Box
  key={consecutiveCorrect}  // changes on each increment, re-triggers animation
  sx={{
    animation: `${streakBounce} 0.35s ease-out`,
    // ... positioning, visibility at consecutiveCorrect >= 2
  }}
>
  {consecutiveCorrect} in a row!
</Box>
```

**Key prop trick is the correct React pattern** for re-triggering a CSS animation on state change without resetting component state. Verified in use throughout React animation patterns; the `key` change causes React to unmount/remount just that element, replaying the animation.

### Pattern 5: Refactored MovementPuzzle Props

```typescript
// BEFORE
interface MovementPuzzleProps {
  onComplete: () => void;
  completeLevel: (levelNum: number) => void;
}

// AFTER
interface MovementPuzzleProps {
  puzzle: MovementPuzzle;       // received from usePuzzleSession
  onAnswer: (correct: boolean) => void;  // called after each tap resolution
  onExit: () => void;          // replaces onComplete for the X button
}
```

Remove: `ORDERED_PUZZLES` static array, `puzzleIndex` state, `isComplete` state, `completeLevel` call.
Keep: All board rendering state (`displayFen`, `flashSquare`, `flashType`, `showHints`, `wrongTapCount`, `showTryAgain`, `showCorrectConfetti`, `isAdvancing`, board resize ResizeObserver).

The component's `onAnswer(true)` path replaces the existing `setTimeout(() => { setPuzzleIndex(prev => prev + 1) ... })` block — instead it just calls `onAnswer(true)` after the 1500ms animation delay.

### Pattern 6: Session Complete Screen in ChessGameContent

```typescript
// ChessGameContent renders session-complete after usePuzzleSession signals done
if (isSessionComplete) {
  return <SessionCompleteScreen onDone={() => setCurrentView('map')} />;
}
```

`SessionCompleteScreen` (Phase 16 version): minimal — just "Session complete!" text + return to map button. Phase 17 replaces this with stars.

### Anti-Patterns to Avoid
- **Storing full puzzle objects in sessionStorage:** Only store IDs; resolve on load
- **Calling `recordCorrect`/`recordWrong` inside MovementPuzzle/CapturePuzzle:** These calls move to `usePuzzleSession.onAnswer()` — components must not call them directly after refactor
- **Using `localStorage` for session state:** Session should clear on tab close — use `sessionStorage` only
- **Animating streak badge with `transition` only:** CSS `transition` on a value that jumps from 0 to N doesn't re-animate. Use `key` prop to force remount on each increment
- **Generating one puzzle at a time:** Pre-generate all 10 at session start to guarantee no duplicates within a session (the 15-item ring buffer in `GeneratorState` covers this for a 10-puzzle session)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| De-duplicate puzzles within session | Custom set or ID tracker | `selectNextPuzzle` from `utils/puzzleGenerator.ts` | Already implements 15-item ring buffer dedup |
| Difficulty tier selection | Re-implement tier logic | `getSessionTier` from `usePuzzleProgress` | Session-frozen tier already handles mid-session stability |
| CSS keyframe animation | Inline style manipulation | MUI `keyframes` + `key` prop trick | Project already uses this in counting-game; cross-browser |
| Puzzle type mixing | Weighted random at runtime | Interleave during queue build (5+5) | Simpler, predictable, no runtime re-selection |

**Key insight:** Almost everything needed already exists. Phase 16 is primarily wiring existing utilities into a new coordination layer (`usePuzzleSession`), not building new capabilities.

## Common Pitfalls

### Pitfall 1: Stale Closure Over `consecutiveCorrect` in onAnswer
**What goes wrong:** `onAnswer` captures `consecutiveCorrect` from render time; if called inside a `setTimeout` (after the 1500ms animation), the value is stale.
**Why it happens:** React closures capture state at render time; setTimeout defers execution past the next render.
**How to avoid:** Use the functional form of `setState`: `setConsecutiveCorrect(prev => correct ? prev + 1 : 0)`. OR pass `correct` flag to the hook and let the hook's setState call handle the computation.
**Warning signs:** Streak counter stuck at 0 or jumping by wrong amounts after rapid answers.

### Pitfall 2: SSR Access of sessionStorage
**What goes wrong:** `sessionStorage.getItem(...)` throws "sessionStorage is not defined" during Next.js server render.
**Why it happens:** `sessionStorage` is browser-only. Next.js renders pages on the server.
**How to avoid:** Always guard with `typeof window !== 'undefined'`. The existing `usePuzzleProgress` hook shows the correct pattern (lines 52–68).
**Warning signs:** Build error or hydration mismatch warning in console.

### Pitfall 3: Puzzle ID Resolution Failure on Hydrate
**What goes wrong:** Stored session has IDs from a puzzle array that has changed, causing `find()` to return `undefined`.
**Why it happens:** IDs are stored; puzzle objects are looked up on restore. If a puzzle is removed from the static arrays, the ID goes stale.
**How to avoid:** Null-check after ID lookup. If any puzzle is missing from the queue, discard the entire persisted session and generate a fresh one.
**Warning signs:** `puzzle is undefined` errors on load; TypeScript `!` assertion blowing up at runtime.

### Pitfall 4: MovementPuzzle displayFen Initialization With Prop
**What goes wrong:** `displayFen` state initialized to `ORDERED_PUZZLES[0].fen` (the old pattern) must change to `puzzle.fen` from props. If the component is not unmounted between puzzles, the `useEffect` that resets `displayFen` on `puzzleIndex` change must be updated to depend on `puzzle.id` instead.
**Why it happens:** After refactor, the component no longer controls which puzzle it shows — the parent does. The `useEffect` dependency must change.
**How to avoid:** Replace `useEffect(() => { setDisplayFen(ORDERED_PUZZLES[puzzleIndex].fen) }, [puzzleIndex])` with `useEffect(() => { setDisplayFen(puzzle.fen) }, [puzzle.id])`.
**Warning signs:** Board shows wrong puzzle FEN after first correct answer in a session.

### Pitfall 5: Double completeLevel Call
**What goes wrong:** If the component still has any leftover `completeLevel` call AND the hook also calls it, the level gets recorded twice. The second call is a no-op due to the `alreadyCompleted` guard in `useChessProgress`, but is still sloppy.
**Why it happens:** Incremental refactor — easy to miss a call path.
**How to avoid:** Remove ALL `completeLevel` references from MovementPuzzle and CapturePuzzle. The hook owns this.

### Pitfall 6: Streak Badge RTL Text
**What goes wrong:** "4 in a row!" displays in the wrong direction or with misplaced numbers in Hebrew RTL mode.
**Why it happens:** RTL flips the visual layout, so "4 in a row!" might render as "!wor ni 4".
**How to avoid:** Wrap the badge in `<Box sx={{ direction: 'ltr' }}>` — same pattern used for the chessboard itself in both puzzle components (line 266 of MovementPuzzle).

## Code Examples

### Existing ResizeObserver Pattern (keep in refactored components)
```typescript
// Source: MovementPuzzle.tsx line 54–65 — do not remove during refactor
const containerRef = useRef<HTMLDivElement>(null);
const [boardWidth, setBoardWidth] = useState(480);

useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver((entries) => {
    const w = entries[0].contentRect.width;
    setBoardWidth(Math.min(Math.max(w, 320), 480));
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```

### sessionStorage Load/Save Pattern (modeled on usePuzzleProgress localStorage)
```typescript
// Load on mount
useEffect(() => {
  if (typeof window === 'undefined') return;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed: PersistedSession = JSON.parse(stored);
      // validate shape, resolve IDs to puzzle objects
      // if any ID lookup fails → discard, start fresh
    }
  } catch {
    // parse error → start fresh
  }
  // if nothing valid → build fresh session queue
}, []);

// Save on state change
useEffect(() => {
  if (!isInitialized) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(persistedState));
  } catch {
    // storage full or private mode — silent fail, session still works in memory
  }
}, [persistedState, isInitialized]);
```

### key Prop Animation Trigger (from counting-game pattern)
```typescript
// Source: counting-game/page.tsx lines 53–56 — proven in-project pattern
const streakBounce = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// In render — key changes on every new streak value, replaying animation
{consecutiveCorrect >= 2 && (
  <Box
    key={consecutiveCorrect}
    sx={{ animation: `${streakBounce} 0.35s ease-out` }}
  >
    {consecutiveCorrect} in a row!
  </Box>
)}
```

### Translation Keys to Add (he.json, en.json, ru.json)
```json
"chessGame": {
  "ui": {
    "sessionComplete": "הפעילות הושלמה!",
    "inARow": "{count} ברצף!",
    "puzzleProgress": "{current}/{total}"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ORDERED_PUZZLES` static array in component | `usePuzzleSession` hook provides puzzle via prop | Phase 16 | Components become pure renderers; easier to test |
| Per-component `puzzleIndex` state | Session queue index in `usePuzzleSession` | Phase 16 | Single source of truth for session position |
| Per-component `completeLevel` call | `usePuzzleSession.onAnswer` calls `completeLevel` after index 10 | Phase 16 | Components have zero knowledge of level system |
| Puzzles sourced from ordered list | Puzzles from `selectNextPuzzle` random generator | Phase 16 | Infinite sessions; difficulty adapts per piece |

## Open Questions

1. **Piece sampling for session queue — how to pick `pieceId` for each slot**
   - What we know: `getSessionTier` is keyed by `ChessPieceId`; puzzle pool is already filtered by difficulty in `selectNextPuzzle`
   - What's unclear: Should tier selection use a randomly picked piece per slot, or rotate through all 6 pieces equally?
   - Recommendation (Claude's discretion): Rotate through `chessPieces` sorted by `order` for the movement slots; pick random for capture slots. This ensures every session covers all piece types and avoids over-representing one piece.

2. **Progress indicator ("5/10") — show or omit?**
   - What we know: MovementPuzzle already shows "3/18" progress; CONTEXT marks this as Claude's discretion
   - What's unclear: Does the child want to know session length?
   - Recommendation: Show "5/10" — it gives kids a sense of the session boundary (SESS-01 requires "clear start and end"). Implement as a small `Typography` with `data-testid="session-progress"`.

3. **`isAdvancing` flag interaction with `onAnswer` timing**
   - What we know: Both components set `isAdvancing = true` on correct tap, then wait 1500ms for animation before advancing
   - What's unclear: Should `onAnswer(true)` be called immediately on tap, or after the 1500ms delay?
   - Recommendation: Call `onAnswer(true)` after the delay (inside the setTimeout). The streak and session index should advance after the animation completes, not before — otherwise the streak badge update races with the board animation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "chess"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-01 | Session complete screen appears after 10 puzzles | e2e | manual-only (requires 10 interactions) | ❌ Wave 0 |
| SESS-01 | usePuzzleSession generates 10-item queue | unit | manual-only (no unit test infra) | N/A |
| SESS-02 | Streak badge invisible at 0 correct | e2e | manual-only | ❌ Wave 0 |
| SESS-02 | Streak badge visible at 2+ correct | e2e | manual-only | ❌ Wave 0 |

**Note:** The project has no unit test infrastructure — only Playwright E2E. Full session flow (10 puzzles) cannot be exercised in a sub-30-second automated test. Validation for SESS-01 and SESS-02 is manual: play through 2+ puzzles and verify streak badge; continue to 10 and verify session complete screen. The existing `npm test -- --grep "chess"` suite covers that the chess game page still loads and the level map shows 3 cards.

### Sampling Rate
- **Per task commit:** `npm test -- --grep "chess"` (verifies no regression on existing chess shell)
- **Per wave merge:** `npm test` (full Playwright suite)
- **Phase gate:** Full suite green + manual verification of streak badge and session complete screen

### Wave 0 Gaps
- No new test files required — Playwright smoke tests already cover the chess-game page load
- SESS-01/SESS-02 behavioral verification is manual (10-puzzle walkthrough)

*(Existing test infrastructure covers chess page load; new behavior requires manual play-through)*

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `ChessGameContent.tsx` — current component structure confirmed
- Direct code inspection of `hooks/usePuzzleProgress.ts` — localStorage pattern confirmed
- Direct code inspection of `utils/puzzleGenerator.ts` — `selectNextPuzzle` API confirmed
- Direct code inspection of `data/chessPuzzles.ts` — `MovementPuzzle` and `CapturePuzzle` types confirmed
- Direct code inspection of `app/[locale]/games/counting-game/page.tsx` — `keyframes` bounce animation pattern confirmed
- Direct code inspection of `messages/he.json` — existing translation keys confirmed

### Secondary (MEDIUM confidence)
- MDN Web Docs: `sessionStorage` lifecycle (tab-scoped, cleared on tab close) — standard platform behavior
- React documentation: `key` prop as animation reset trigger — well-established pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed by code inspection; no new deps required
- Architecture: HIGH — hook interface designed from actual component code; all integration points verified
- Pitfalls: HIGH — all pitfalls identified directly from existing code patterns and known React closure/SSR issues

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (stable dependencies — MUI, React, Next.js versions fixed in package.json)
