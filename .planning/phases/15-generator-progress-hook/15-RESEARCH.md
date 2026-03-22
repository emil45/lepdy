# Phase 15: Generator + Progress Hook - Research

**Researched:** 2026-03-22
**Domain:** Pure TypeScript utility + React hook pattern, localStorage persistence, Firebase Remote Config integration
**Confidence:** HIGH

## Summary

Phase 15 builds two new artefacts: a pure-function puzzle generator (`utils/puzzleGenerator.ts`) and a React hook (`hooks/usePuzzleProgress.ts`). Neither requires new npm packages — the project decided in v1.3 scoping that chess.js `moves()` is the full generation engine, but the generator here operates on the static puzzle pool from `data/chessPuzzles.ts`, not on real-time chess.js generation. This distinction matters: the generator filters and samples from the 95 pre-built puzzles, it does not synthesise new board positions.

The two components serve different consumers: `puzzleGenerator` is consumed by `usePuzzleProgress` (and later `usePuzzleSession` in Phase 16) as a pure, testable function with no React dependency. `usePuzzleProgress` manages per-piece difficulty tier and consecutive-answer streak across sessions via localStorage, following the established `useChessProgress` pattern exactly. Difficulty tier changes are deferred to session boundaries (not mid-session), keeping the implementation straightforward.

The existing puzzle pool is 61 movement + 34 capture = 95 puzzles. With a 15-puzzle dedup window (PGEN-03) the pool is large enough that exhaustion is never a problem for any single tier: tier 1 has 37 puzzles, tier 2 has 34, tier 3 has 27.

**Primary recommendation:** Model `usePuzzleProgress` directly on `useChessProgress` — same SSR guard, same useState+useEffect-on-mount+useEffect-on-change pattern, same try/catch around localStorage. The generator is a plain TypeScript module that takes a pool + state and returns the next puzzle, with no React import.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Puzzle generator lives in `utils/puzzleGenerator.ts` — pure functions, no React dependency, testable. chess.js SSR guard needed (client-only import)
- Recently-seen window: sliding window of last 15 puzzle IDs stored in session state — resets on new session, prevents repetition within a play session
- Selection pipeline: filter pool by difficulty tier → exclude recently seen → random pick
- New `hooks/usePuzzleProgress.ts` for difficulty/progress state — extends existing useChessProgress pattern with localStorage, separate storage key
- Difficulty increases after 5 consecutive correct answers — stored per-piece in progress hook, advances tier next session
- Difficulty decreases after 3 consecutive incorrect answers — de-escalates tier next session
- Thresholds stored in Firebase Remote Config for post-launch tuning without deploy
- Difficulty changes between sessions only — mid-session changes feel jarring for kids; tier locked when session starts
- Keep `useChessProgress` as-is for level unlock state. New `usePuzzleProgress` is additive — no migration, zero data loss risk
- Hebrew piece name displayed above the board, same position as current piece name display — consistent with PieceIntroduction pattern
- Tap piece name text to play audio pronunciation, matching how category pages work
- Show piece type context on capture puzzles — "Which piece captures?" with Hebrew name of correct piece shown after answer

### Claude's Discretion
- Exact Remote Config key names for difficulty thresholds
- Internal data structure of usePuzzleProgress localStorage format
- Whether to use chess.js dynamic import or conditional require for SSR guard

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PGEN-03 | User never sees the same puzzle twice within a session (15-puzzle dedup window) | Sliding window of last 15 IDs in session state; array.filter in generator covers this cleanly |
| PGEN-04 | User sees the Hebrew piece name and can hear pronunciation on every generated puzzle | `chessPieces` has `translationKey` + `audioFile` + `audioPath`; `playAudio(path)` from `utils/audio.ts`; pattern from `PieceIntroduction.tsx` |
| DIFF-01 | User encounters puzzles at 3 difficulty tiers with increasing board complexity | All 95 puzzles already carry `difficulty: 1 | 2 | 3`; generator filters by tier |
| DIFF-02 | User automatically advances to harder puzzles after demonstrating mastery (5 consecutive correct) | `usePuzzleProgress` tracks `consecutiveCorrect` per piece; tier advances on session start when threshold met |
| DIFF-03 | User automatically gets easier puzzles after struggling (3 consecutive incorrect) | Same hook tracks `consecutiveWrong`; tier de-escalates on session start |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | useState + useEffect in hook | Already in project |
| TypeScript 5 | — | Pure generator typings | Strict mode enforced |
| localStorage (browser API) | — | Persist per-piece progress | Same pattern as useChessProgress |
| next-intl | 4.7.0 | `useTranslations` for Hebrew piece name in UI | Same as PieceIntroduction |
| Firebase Remote Config | 12.8.0 | Tuneable difficulty thresholds | Existing featureFlags infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `utils/audio.ts` | — | `playAudio(path)` for Hebrew pronunciation | On piece name tap (PGEN-04) |
| `data/chessPuzzles.ts` | — | Static puzzle pool | Generator input |
| `data/chessPieces.ts` | — | Hebrew name + audioPath lookup | Hebrew UI (PGEN-04) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage | IndexedDB | localStorage is adequate for a few KB of progress data; already the project pattern |
| Static pool filter | chess.js live generation | v1.3 arch decision: static pool; chess.js generation deferred |
| Session state (useState) for seen-window | localStorage | Dedup window intentionally resets per session — React state is correct here |

**Installation:** No new packages needed.

## Architecture Patterns

### New File Locations
```
utils/
└── puzzleGenerator.ts     # Pure functions — no React import

hooks/
└── usePuzzleProgress.ts   # React hook — localStorage, per-piece tier + streak

app/[locale]/games/chess-game/
├── MovementPuzzle.tsx      # Add Hebrew name header + audio tap (PGEN-04)
└── CapturePuzzle.tsx       # Add Hebrew piece name in post-answer reveal (PGEN-04)

lib/featureFlags/
└── types.ts                # Add difficulty threshold flags
```

### Pattern 1: Pure Generator Function
**What:** `selectNextPuzzle(pool, tier, seenIds)` — filter by difficulty, exclude recently seen, pick randomly. Returns a puzzle and the updated seen-window.
**When to use:** Called once per puzzle advance in both MovementPuzzle and CapturePuzzle (via usePuzzleProgress or directly in Phase 16's usePuzzleSession).
**Example:**
```typescript
// utils/puzzleGenerator.ts — no React, no SSR concerns
export interface GeneratorState {
  seenIds: string[];   // sliding window, max 15
}

export function selectNextPuzzle<T extends { id: string; difficulty: 1 | 2 | 3 }>(
  pool: T[],
  tier: 1 | 2 | 3,
  state: GeneratorState
): { puzzle: T; nextState: GeneratorState } {
  const eligible = pool.filter(
    (p) => p.difficulty === tier && !state.seenIds.includes(p.id)
  );
  // Fallback: if entire tier exhausted, reset window and retry
  const source = eligible.length > 0
    ? eligible
    : pool.filter((p) => p.difficulty === tier);
  const puzzle = source[Math.floor(Math.random() * source.length)];
  const seenIds = [...state.seenIds, puzzle.id].slice(-15);
  return { puzzle, nextState: { seenIds } };
}
```

### Pattern 2: usePuzzleProgress Hook
**What:** Mirrors `useChessProgress` exactly — useState for data, useEffect to load from localStorage on mount (SSR guarded), useEffect to save on change, useCallback for mutations.
**When to use:** Provides per-piece `currentTier`, `consecutiveCorrect`, `consecutiveWrong`, and mutations `recordCorrect(pieceId)` / `recordWrong(pieceId)` / `getSessionTier(pieceId)`.
**Example:**
```typescript
// hooks/usePuzzleProgress.ts
'use client';

const STORAGE_KEY = 'lepdy_chess_puzzle_progress';

export interface PiecePuzzleProgress {
  tier: 1 | 2 | 3;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export interface PuzzleProgressData {
  pieces: Record<string, PiecePuzzleProgress>;
}

// Load/save pattern identical to useChessProgress:
useEffect(() => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
    } catch (e) {
      console.error('[chess] Failed to load puzzle progress:', e);
    }
  }
  setIsInitialized(true);
}, []);
```

### Pattern 3: Hebrew Piece Name with Audio Tap (PGEN-04)
**What:** Small block above the board showing Hebrew name + VolumeUpIcon button. Matches `PieceIntroduction` layout exactly.
**When to use:** Both MovementPuzzle (for moving piece) and CapturePuzzle (for correct piece, shown after answer).
**Example:**
```tsx
// Inside MovementPuzzle render — piece name tap pattern from PieceIntroduction.tsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 1 }}>
  <Typography
    variant="h5"
    sx={{ fontWeight: 'bold', cursor: 'pointer' }}
    onClick={() => playAudio(`chess/he/${pieceConfig.audioFile}`)}
  >
    {t(pieceConfig.translationKey as Parameters<typeof t>[0])}
  </Typography>
  <IconButton onClick={() => playAudio(`chess/he/${pieceConfig.audioFile}`)} aria-label="play audio">
    <VolumeUpIcon />
  </IconButton>
</Box>
```

### Pattern 4: Firebase Remote Config for Difficulty Thresholds
**What:** Add two numeric flags to `lib/featureFlags/types.ts` for advance threshold (default 5) and de-escalate threshold (default 3).
**When to use:** `usePuzzleProgress` reads these via `useFeatureFlagContext()` to determine when to change tier.
**Example:**
```typescript
// lib/featureFlags/types.ts additions
export interface FeatureFlags {
  // ... existing flags ...
  chessAdvanceTierThreshold: number;   // default 5
  chessDemoTierThreshold: number;      // default 3
}

export const DEFAULT_FLAGS: FeatureFlags = {
  // ... existing ...
  chessAdvanceTierThreshold: 5,
  chessDemoTierThreshold: 3,
};
```
Remote Config key names: `chessAdvanceTierThreshold`, `chessDemoTierThreshold` (snake_case alternative: `chess_advance_tier_threshold` — but camelCase matches existing pattern `soundMatchingWrongAnswerDelayMs`).

### Anti-Patterns to Avoid
- **Chess.js in puzzleGenerator.ts:** The generator works on the static pool only — no chess.js import needed. The SSR guard concern noted in STATE.md only applies if chess.js is used; it is not needed for pure array filtering.
- **Tier change mid-session:** Confirmed locked decision. Tier is read from localStorage at session start and not changed until next session starts. Do not call `setTier` on every answer.
- **Modifying useChessProgress:** `usePuzzleProgress` is an independent hook with its own storage key. `useChessProgress` remains unchanged.
- **Coupling generator to React:** `selectNextPuzzle` must not import from React or use hooks. The seen-window is passed as a plain object; hook state wraps it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hebrew audio playback | Custom audio manager | `playAudio(path)` from `utils/audio.ts` | Already handles AbortError, rapid-tap race conditions |
| Feature flag number read | Direct localStorage / env var | `useFeatureFlagContext().getFlag(key)` | Tunable post-launch via Firebase without deploy |
| Tier persistence | Custom storage format | Follow `useChessProgress` pattern exactly | Proven SSR guard, error handling, migration-safe JSON shape |

**Key insight:** Every piece of infrastructure already exists. This phase wires them together rather than building new primitives.

## Puzzle Pool Analysis

Verified from `data/chessPuzzles.ts` (95 puzzles total):

| Tier | Count | Pool adequate for 15-window dedup? |
|------|-------|------------------------------------|
| 1 (easy) | 37 | Yes — 2.5x window size |
| 2 (medium) | 34 | Yes — 2.3x window size |
| 3 (hard) | 27 | Yes — 1.8x window size |

Movement puzzles: 61 (10 per piece except king which has 11).
Capture puzzles: 34 (5-6 per attacking piece type).

**Fallback case:** If a tier has fewer than 15 puzzles remaining after dedup exclusion, reset the seen window for that tier and retry. This is only relevant for tier 3 (27 puzzles), and only if all 27 are in the window — practically unreachable in one session but must be coded defensively.

**Piece-specific filtering:** Movement puzzles have `pieceId`; capture puzzles have `correctPieceId`. The generator will receive the appropriate field name or the calling code normalises it. The hook tracks progress per `ChessPieceId`.

## Common Pitfalls

### Pitfall 1: SSR Guard Misapplication
**What goes wrong:** Devs add `chess.js` import to `utils/puzzleGenerator.ts` and face SSR build errors.
**Why it happens:** STATE.md blocker note mentions "chess.js SSR guard needed in new utils/puzzleGenerator.ts" — but Phase 15's generator does not use chess.js. The note was written before the final architecture was locked to static pool filtering.
**How to avoid:** Do not import chess.js into `puzzleGenerator.ts`. The SSR concern is inapplicable if the module only imports from `data/chessPuzzles.ts` (pure TypeScript, no browser APIs).
**Warning signs:** If a chess.js import appears in the generator file during planning, flag it.

### Pitfall 2: Tier Drift Between Sessions
**What goes wrong:** Consecutive counters reset without advancing the tier, or tier advances without resetting counters, leading to drift.
**Why it happens:** The threshold check and the reset are two separate state mutations that must be atomic from the hook's perspective.
**How to avoid:** In `recordCorrect(pieceId)`, compute new consecutiveCorrect, check against threshold, if exceeded: increment tier (capped at 3) AND reset consecutiveCorrect AND consecutiveWrong, then persist. Single `setData` call covers all three fields atomically.

### Pitfall 3: seen-window Growing Unbounded
**What goes wrong:** `seenIds` array grows forever, stale IDs from previous sessions pollute dedup.
**Why it happens:** Developer stores seen-window in localStorage instead of session state.
**How to avoid:** Seen-window lives in React state (`useState`) — it resets when the component unmounts (session ends). Only tier + streaks go to localStorage.

### Pitfall 4: Per-Piece vs. Global Tier
**What goes wrong:** A single global `tier` is tracked instead of per-piece, so mastering the rook incorrectly escalates the bishop.
**Why it happens:** Simpler to implement; easy to miss the per-piece requirement.
**How to avoid:** `PuzzleProgressData.pieces` is a `Record<ChessPieceId, PiecePuzzleProgress>`. Always look up by `pieceId` before reading or writing tier/streaks.

### Pitfall 5: Hebrew Name Missing on Capture Puzzles
**What goes wrong:** PGEN-04 is satisfied on movement puzzles but forgotten on capture puzzles.
**Why it happens:** Capture puzzle shows the *target* piece (what gets captured) in the instruction, not the *attacking* piece. CONTEXT.md specifies showing the attacking piece's Hebrew name **after answer**.
**How to avoid:** For capture puzzles, show the `correctPieceId`'s Hebrew name in the post-answer reveal ("Well done! The [rook] captured!"), not before. Pre-answer instruction already shows the target piece name.

## Code Examples

### selectNextPuzzle — full implementation sketch
```typescript
// utils/puzzleGenerator.ts
// No React import. No chess.js import. No browser API.

export interface GeneratorState {
  seenIds: string[];  // max 15 entries, ring-buffer behaviour
}

export function defaultGeneratorState(): GeneratorState {
  return { seenIds: [] };
}

export function selectNextPuzzle<T extends { id: string; difficulty: 1 | 2 | 3 }>(
  pool: T[],
  tier: 1 | 2 | 3,
  state: GeneratorState
): { puzzle: T; nextState: GeneratorState } {
  const tierPool = pool.filter((p) => p.difficulty === tier);
  const eligible = tierPool.filter((p) => !state.seenIds.includes(p.id));
  const source = eligible.length > 0 ? eligible : tierPool;  // full reset if exhausted
  const puzzle = source[Math.floor(Math.random() * source.length)];
  const seenIds = [...state.seenIds, puzzle.id].slice(-15);
  return { puzzle, nextState: { seenIds } };
}
```

### usePuzzleProgress — key mutation pattern
```typescript
// hooks/usePuzzleProgress.ts
const recordCorrect = useCallback((pieceId: ChessPieceId) => {
  setData((prev) => {
    const current = prev.pieces[pieceId] ?? DEFAULT_PIECE_PROGRESS;
    const next = current.consecutiveCorrect + 1;
    const advanceThreshold = getFlag('chessAdvanceTierThreshold') as number;
    const shouldAdvance = next >= advanceThreshold;
    return {
      pieces: {
        ...prev.pieces,
        [pieceId]: {
          tier: shouldAdvance ? Math.min(3, current.tier + 1) as 1 | 2 | 3 : current.tier,
          consecutiveCorrect: shouldAdvance ? 0 : next,
          consecutiveWrong: 0,  // always reset wrong streak on correct answer
        },
      },
    };
  });
}, [getFlag]);
```

### Feature flag additions — complete diff
```typescript
// lib/featureFlags/types.ts — add to existing FeatureFlags interface
chessAdvanceTierThreshold: number;   // Remote Config key: chessAdvanceTierThreshold
chessDemoTierThreshold: number;      // Remote Config key: chessDemoTierThreshold

// DEFAULT_FLAGS additions
chessAdvanceTierThreshold: 5,
chessDemoTierThreshold: 3,
```

### getSessionTier — tier locked at session start
```typescript
// Called once when a puzzle session begins, not on every puzzle
getSessionTier: (pieceId: ChessPieceId): 1 | 2 | 3 => {
  return (data.pieces[pieceId] ?? DEFAULT_PIECE_PROGRESS).tier;
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Sequential ORDERED_PUZZLES with fixed index | Generator with dedup sliding window | Players never exhaust puzzles; no repetition within session |
| No difficulty tracking | Per-piece tier stored in localStorage | Adaptive difficulty persists across sessions |
| Level completion as binary | Streak-based tier advancement | Gradual mastery curve appropriate for ages 5-9 |

## Integration with Phase 16

Phase 16 will build `usePuzzleSession` (10-puzzle structured sessions). It will consume `usePuzzleProgress` for tier and `selectNextPuzzle` for selection. The data shapes designed in Phase 15 must support this:

- `getSessionTier(pieceId)` called once at session start — returns the locked tier
- `selectNextPuzzle` called per puzzle — caller manages `GeneratorState` in session hook
- `recordCorrect` / `recordWrong` called per answer — updates persistence for NEXT session

**Phase 16 interface contract:** `usePuzzleProgress` must export: `getSessionTier`, `recordCorrect`, `recordWrong`. `puzzleGenerator` must export: `selectNextPuzzle`, `defaultGeneratorState`, `GeneratorState` type.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 (E2E only — no unit test runner detected) |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PGEN-03 | Hebrew name + audio button appear on movement puzzle | E2E smoke | `npm test` (chess-game page loads) | existing |
| PGEN-04 | Hebrew name + audio button appear on movement puzzle | E2E smoke | `npm test` (chess-game page loads) | existing |
| DIFF-01 | Chess game page loads without crash | E2E smoke | `npm test` | existing |
| DIFF-02 | Progress persists after session (localStorage write) | manual | N/A | N/A |
| DIFF-03 | Tier de-escalates after 3 wrong answers | manual | N/A | N/A |

**Note:** The project uses Playwright E2E only (no Jest/Vitest unit tests). Pure functions like `selectNextPuzzle` cannot be covered by the existing test infrastructure. The logical correctness of generator and hook mutations must be verified via code review and manual smoke testing in the dev server.

### Sampling Rate
- **Per task commit:** `npm run lint` (fast, catches type errors)
- **Per wave merge:** `npm test` (full E2E suite — requires dev server)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- None — no new test files needed. Existing chess-game E2E smoke test covers page load. Generator purity means manual inspection is the validation path. Consider adding `data-testid="piece-name-audio-button"` to the Hebrew name area for future E2E targeting.

## Open Questions

1. **chess.js import in puzzleGenerator.ts**
   - What we know: STATE.md mentions "chess.js SSR guard needed" as a blocker for Phase 15. Generator does not actually need chess.js.
   - What's unclear: Was this note written before the static-pool architecture was confirmed, or does the author expect chess.js to appear for some other reason?
   - Recommendation: Do not import chess.js into `puzzleGenerator.ts`. If Phase 16 planning reveals a need, add the SSR guard then. Mark the STATE.md blocker as resolved.

2. **firebaseRemoteConfig.ts requires manual fetchFlags update**
   - What we know: Adding flags to `types.ts` is not enough — `fetchFlags()` in `firebaseRemoteConfig.ts` must also explicitly read the two new keys.
   - What's unclear: The CONTEXT.md decisions do not mention this step.
   - Recommendation: Plan task must include updating `firebaseRemoteConfig.ts`'s `fetchFlags()` to read `chessAdvanceTierThreshold` and `chessDemoTierThreshold` via `getNumberFlag()`.

## Sources

### Primary (HIGH confidence)
- Direct file reads: `hooks/useChessProgress.ts`, `data/chessPuzzles.ts`, `data/chessPieces.ts`, `lib/featureFlags/types.ts`, `lib/featureFlags/providers/firebaseRemoteConfig.ts`, `app/[locale]/games/chess-game/MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `PieceIntroduction.tsx`
- `utils/audio.ts` patterns established in CLAUDE.md and confirmed by PieceIntroduction.tsx usage
- Puzzle counts verified by direct line count and grep

### Secondary (MEDIUM confidence)
- `.planning/phases/15-generator-progress-hook/15-CONTEXT.md` — architectural decisions locked by user discussion
- `.planning/STATE.md` — accumulated decisions and blockers

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture: HIGH — patterns taken directly from existing hooks and components
- Pitfalls: HIGH — derived from code inspection of ORDERED_PUZZLES pattern and existing hooks
- Puzzle pool analysis: HIGH — grep-verified counts from source file

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable, internal codebase — changes only if puzzle data is modified)
