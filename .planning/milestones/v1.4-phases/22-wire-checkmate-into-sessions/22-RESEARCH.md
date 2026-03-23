# Phase 22: Wire Checkmate Into Sessions - Research

**Researched:** 2026-03-23
**Domain:** React session hooks, feature flags (Firebase Remote Config), Amplitude analytics
**Confidence:** HIGH

## Summary

Phase 22 wires the already-built `CheckmatePuzzle` component into the Challenge session alongside existing movement and capture puzzles. It requires three coordinated changes: (1) extending the `SessionPuzzle` union type and `buildSessionQueue` in `usePuzzleSession.ts` to include `'checkmate'` entries, (2) adding a `chessCheckmateEnabled` boolean feature flag that lets an operator disable checkmate puzzles via Firebase Remote Config without a code deploy, and (3) adding a new `CHESS_PUZZLE_ANSWERED` Amplitude event (or extending an existing chess event) that carries a `puzzle_type` property so correct/wrong answers for checkmate puzzles can be filtered separately in dashboards.

All three changes sit in files that already exist and are well-understood. No new npm packages are needed. The `puzzleGenerator.ts` utility's `selectNextPuzzle` function is fully generic — it works with any pool typed as `{ id: string; difficulty: 1 | 2 | 3 }[]` — so `checkmatePuzzles` slots in with zero change to the generator.

**Primary recommendation:** Add one checkmate slot per session (slot index 4 in the 10-puzzle interleaved queue, replacing the 5th capture slot), gated by `chessCheckmateEnabled` flag. If the flag is off, fall back to a capture puzzle in that slot. Keep session size at 10.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — discuss phase was skipped (auto-generated infrastructure phase).

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — discuss phase skipped.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MATE-03 | Checkmate puzzles appear in Challenge sessions alongside movement and capture puzzles | `buildSessionQueue` in `usePuzzleSession.ts` must include checkmate slots; `CheckmatePuzzle.tsx` exists and has correct `onAnswer` / `onExit` contract; `selectNextPuzzle` is generic and works with `checkmatePuzzles` pool unchanged |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | State, hooks, rendering | Already in use throughout |
| TypeScript | 5 | Type safety on union extensions | Strict mode enforced |
| Firebase Remote Config | (via firebase 12.8.0) | Feature flag remote delivery | Already used for all existing chess flags |
| Amplitude | @amplitude/analytics-browser 2.33.1 | Event analytics | Already initialized in `providers.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-intl 4.7.0 | — | Translation keys | If any new UI copy needed (unlikely for this phase) |

**Installation:** No new packages needed.

## Architecture Patterns

### Existing Session Queue Structure

`usePuzzleSession.ts` builds a 10-puzzle queue: 5 movement + 5 capture, interleaved (mov, cap, mov, cap ... mov, cap). The `SessionPuzzle` discriminated union is:

```typescript
// Current (usePuzzleSession.ts line 12-15)
export type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle };
```

### Pattern 1: Extend the `SessionPuzzle` Union

Add a third variant:

```typescript
// Source: usePuzzleSession.ts — extend existing type
export type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle }
  | { type: 'checkmate'; puzzle: CheckmatePuzzle };
```

`ChessGameContent.tsx` already uses `assertNever` exhaustiveness check on `ChessView` (line 31-33). The session puzzle rendering (`if (currentPuzzle.type === 'movement')` ... `// Capture puzzle`) ends with an implicit else. Adding a `checkmate` branch before the capture fallback follows the existing conditional chain pattern.

### Pattern 2: Feature Flag — Boolean Flag for `chessCheckmateEnabled`

Following the exact existing 4-step process documented in CLAUDE.md:

**Step 1:** Add to `FeatureFlags` interface in `lib/featureFlags/types.ts`:
```typescript
/** Enable checkmate-in-1 puzzles in Challenge sessions. */
chessCheckmateEnabled: boolean;
```

**Step 2:** Add default value `false` in `DEFAULT_FLAGS`:
```typescript
chessCheckmateEnabled: false,
```
Default `false` means checkmate is disabled until explicitly enabled in Firebase — safe rollout.

**Step 3:** Add to `fetchFlags()` in `lib/featureFlags/providers/firebaseRemoteConfig.ts`:
```typescript
chessCheckmateEnabled: this.getBooleanFlag('chessCheckmateEnabled', getValue),
```

**Step 4:** Configure in Firebase Remote Config console (manual — no code).

Usage in `buildSessionQueue`:
```typescript
// Pass flag value into buildSessionQueue as a parameter
function buildSessionQueue(
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3,
  checkmateEnabled: boolean
): SessionPuzzle[]
```

`buildSessionQueue` is a pure function called inside `usePuzzleSession` and `startNewSession`. The flag value can be read from the `useFeatureFlagContext` hook at the call site in `usePuzzleSession`, then passed down.

### Pattern 3: Amplitude Event for Puzzle Answers

There is currently no chess-specific Amplitude event in `models/amplitudeEvents.ts`. The existing event enum has `GAME_STARTED`, `GAME_COMPLETED`, and others, but nothing for per-puzzle answers.

Add to `AmplitudeEventsEnum`:
```typescript
CHESS_PUZZLE_ANSWERED = 'chess_puzzle_answered',
```

Add properties interface:
```typescript
export interface ChessPuzzleAnsweredProperties {
  puzzle_type: 'movement' | 'capture' | 'checkmate';
  correct: boolean;
  piece_id: string;         // pieceId for movement/capture, matingPieceId for checkmate
  difficulty: 1 | 2 | 3;
  session_index: number;    // 0-9
}
```

Add to `EventMap`:
```typescript
[AmplitudeEventsEnum.CHESS_PUZZLE_ANSWERED]: ChessPuzzleAnsweredProperties;
```

The event is fired from `handleAnswer` in `ChessGameContent.tsx`. The `currentPuzzle` state is available there, so `puzzle_type`, `piece_id`, and `difficulty` can all be extracted at that point.

### Pattern 4: Session Queue Injection of Checkmate Slot

The queue currently interleaves: `[mov0, cap0, mov1, cap1, mov2, cap2, mov3, cap3, mov4, cap4]`.

Recommended approach: inject one checkmate slot replacing `cap4` (index 9) when the flag is enabled. This keeps the session at exactly 10 puzzles and doesn't change the stride logic. The checkmate puzzle uses `selectNextPuzzle(checkmatePuzzles, tier, genState)` where `tier` defaults to `1` (hardcoded, since checkmate difficulty mapping to per-piece tiers is undefined — checkmate puzzles span multiple piece types and use their own `difficulty` field).

Alternative: inject as slot index 2 or 4 (mid-session) for better pacing. This is Claude's discretion.

### Session Persistence (hydrateSession)

`hydrateSession` deserializes persisted sessions using `entry.type === 'movement'` and `entry.type === 'capture'` guards. Adding `'checkmate'` requires a third branch:

```typescript
} else if (entry.type === 'checkmate') {
  const puzzle = checkmatePuzzles.find((p) => p.id === entry.id);
  if (!puzzle) return null; // ID lookup failed — discard session
  queue.push({ type: 'checkmate', puzzle });
}
```

Missing this branch causes `return null` for any session with a checkmate puzzle after a page refresh — the session is discarded and rebuilt fresh. This is safe behavior but adds a new branch to maintain.

### `onAnswer` in `usePuzzleSession` — PieceId Extraction

Current extraction:
```typescript
const pieceId: ChessPieceId =
  current.type === 'movement' ? current.puzzle.pieceId : current.puzzle.correctPieceId;
```

For checkmate puzzles, the relevant piece is `current.puzzle.matingPieceId`. Extend to:
```typescript
const pieceId: ChessPieceId =
  current.type === 'movement'
    ? current.puzzle.pieceId
    : current.type === 'capture'
    ? current.puzzle.correctPieceId
    : current.puzzle.matingPieceId;
```

`usePuzzleProgress` (`recordCorrect`/`recordWrong`) is keyed by `ChessPieceId`. Recording checkmate answers against `matingPieceId` will affect that piece's tier — which may or may not be desired. Since this is Claude's discretion, the cleanest approach is to record checkmate correct/wrong against `matingPieceId`. This is consistent with existing pattern.

### `ChessGameContent.tsx` — Render Branch

The session view already has:
```
if (currentPuzzle.type === 'movement') { ... }
// Capture puzzle (implicit else)
return ( <CapturePuzzle ... /> );
```

Change to three-branch explicit structure:
```
if (currentPuzzle.type === 'movement') { ... }
if (currentPuzzle.type === 'capture') { ... }
if (currentPuzzle.type === 'checkmate') { ... }
return assertNever(currentPuzzle.type as never); // exhaustiveness
```

`CheckmatePuzzle` is already imported via `dynamic()` in `ChessGameContent.tsx` — no new import needed.

Wait — checking current imports: `CheckmatePuzzle.tsx` exists in the same directory but is NOT currently dynamically imported. Only `MovementPuzzle` and `CapturePuzzle` are imported dynamically (lines 26-27). `CheckmatePuzzle` must be added as a third dynamic import:

```typescript
const CheckmatePuzzle = dynamic(() => import('./CheckmatePuzzle'), { ssr: false });
```

### Anti-Patterns to Avoid

- **Don't add checkmate directly to `PersistedSession` type without extending hydrateSession:** The type only allows `'movement' | 'capture'` in the `queue` array — TypeScript will catch this at compile time, but the hydration guard clause must also be updated.
- **Don't use a hardcoded `difficulty: 1` tier for checkmate without documentation:** Document why tier is fixed for checkmate puzzle selection (no per-piece tier exists for checkmate).
- **Don't fire CHESS_PUZZLE_ANSWERED from inside the puzzle component:** Amplitude events should fire from `ChessGameContent.tsx`'s `handleAnswer`, where full session context (index, type) is available. Puzzle components only know about their own puzzle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deduplication of checkmate puzzles | Custom dedup logic | `selectNextPuzzle(checkmatePuzzles, tier, genState)` | Already generic, handles ring-buffer dedup |
| Feature flag storage | localStorage boolean | `getFlag('chessCheckmateEnabled')` via `useFeatureFlagContext` | Remote control, no deploy needed |
| Amplitude event tracking | Direct `amplitude.track()` calls | `logEvent(AmplitudeEventsEnum.CHESS_PUZZLE_ANSWERED, {...})` | Type-safe, consistent with codebase |

## Common Pitfalls

### Pitfall 1: PersistedSession Type Not Updated
**What goes wrong:** TypeScript `queue` entry type is `{ type: 'movement' | 'capture'; id: string }` — adding `'checkmate'` to `SessionPuzzle` without updating `PersistedSession` creates a type error when serializing.
**Why it happens:** `PersistedSession.queue` uses a literal union type that mirrors `SessionPuzzle.type`.
**How to avoid:** Update `PersistedSession` `type` union to `'movement' | 'capture' | 'checkmate'` alongside `SessionPuzzle`.
**Warning signs:** TypeScript error on `queue: queue.map(sp => ({ type: sp.type, id: sp.puzzle.id }))`.

### Pitfall 2: Missing Dynamic Import for CheckmatePuzzle
**What goes wrong:** `CheckmatePuzzle` is not currently dynamically imported in `ChessGameContent.tsx` — it must be added or the component crashes when rendered (since it imports `react-chessboard` which has browser-only APIs).
**Why it happens:** `MovementPuzzle` and `CapturePuzzle` are already dynamically imported (`ssr: false`), but `CheckmatePuzzle` is not.
**How to avoid:** Add `const CheckmatePuzzle = dynamic(() => import('./CheckmatePuzzle'), { ssr: false })`.
**Warning signs:** SSR error about `window` or `document` not defined; build error on `react-chessboard`.

### Pitfall 3: `buildSessionQueue` Flag Access
**What goes wrong:** `buildSessionQueue` is a module-level pure function. It cannot call `useFeatureFlagContext()` (hooks are React-only). If the flag value is read inside the function without being passed in, it breaks the rules of hooks.
**Why it happens:** Developer tries to read the feature flag inside the pure utility function.
**How to avoid:** Read `getFlag('chessCheckmateEnabled')` in `usePuzzleSession` (inside the hook) and pass the boolean as a parameter to `buildSessionQueue`.
**Warning signs:** React hook rules lint error: "Hooks cannot be called outside of React components or custom hooks."

### Pitfall 4: `onAnswer(false)` for Checkmate Already Called Inside Component
**What goes wrong:** `CheckmatePuzzle.tsx` (line 106) calls `playSound(AudioSounds.WRONG_ANSWER)` and `onAnswer(false)` internally for wrong taps. If `ChessGameContent.tsx` also calls `playSound` on the `onAnswer` callback (as it does for movement/capture via `handleAnswer`), the wrong-answer sound plays twice.
**Why it happens:** `handleAnswer` in `ChessGameContent.tsx` wraps `onAnswer` with `playSound(correct ? SUCCESS : WRONG_ANSWER)`. But `CheckmatePuzzle` already plays `WRONG_ANSWER` before calling `onAnswer(false)`.
**How to avoid:** Pass a bare `onAnswer` (not `handleAnswer`) to `CheckmatePuzzle`, or pass a checkmate-specific handler that only plays SUCCESS. Alternatively, remove the internal `playSound` from `CheckmatePuzzle` (makes it consistent with MovementPuzzle/CapturePuzzle which don't self-play sounds).
**Warning signs:** Double WRONG_ANSWER sound on wrong tap during checkmate puzzles in session.

Checking `MovementPuzzle.tsx` and `CapturePuzzle.tsx` sound behavior to confirm: `CheckmatePuzzle.tsx` line 95 calls `playRandomCelebration()` directly for correct answers too, and line 106 calls `playSound(AudioSounds.WRONG_ANSWER)` for wrong. This is different from MovementPuzzle/CapturePuzzle which delegate sound entirely to the parent via `handleAnswer`. The correct approach for session use is to create a checkmate-specific handler in `ChessGameContent.tsx` that suppresses the duplicate wrong sound — or accept the double play and note it as a known limitation.

### Pitfall 5: Amplitude Event Not in EventMap
**What goes wrong:** `logEvent` is typed with `EventMap[T]` — calling it with a new enum value without adding to `EventMap` causes a TypeScript compile error.
**Why it happens:** The event is added to `AmplitudeEventsEnum` but not to `EventMap`.
**How to avoid:** Add both the enum value AND the `EventMap` entry AND the properties interface atomically.
**Warning signs:** TypeScript error: "Property 'chess_puzzle_answered' does not exist on type 'EventMap'."

## Code Examples

Verified patterns from codebase:

### Adding a Feature Flag (exact project pattern)
```typescript
// Step 1: lib/featureFlags/types.ts
export interface FeatureFlags {
  // ... existing flags ...
  /** Enable checkmate-in-1 puzzles in Challenge sessions. */
  chessCheckmateEnabled: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  // ... existing defaults ...
  chessCheckmateEnabled: false,  // disabled by default — safe rollout
};

// Step 2: lib/featureFlags/providers/firebaseRemoteConfig.ts (inside fetchFlags)
const newFlags: FeatureFlags = {
  // ... existing flags ...
  chessCheckmateEnabled: this.getBooleanFlag('chessCheckmateEnabled', getValue),
};
```

### Extending `buildSessionQueue` for checkmate
```typescript
// Source: hooks/usePuzzleSession.ts — extended pattern
function buildSessionQueue(
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3,
  checkmateEnabled: boolean
): SessionPuzzle[] {
  const queue: SessionPuzzle[] = [];
  let genState: GeneratorState = defaultGeneratorState();
  const movementPieces = [...chessPieces].sort((a, b) => a.order - b.order).slice(0, 5);

  for (let i = 0; i < 5; i++) {
    // Movement slot (unchanged)
    const movPiece = movementPieces[i];
    const movTier = getSessionTier(movPiece.id);
    const { puzzle: movPuzzle, nextState: afterMov } = selectNextPuzzle(movementPuzzles, movTier, genState);
    genState = afterMov;
    queue.push({ type: 'movement', puzzle: movPuzzle });

    // Capture or checkmate slot
    if (checkmateEnabled && i === 4) {
      // Last slot: inject one checkmate puzzle at difficulty tier 1
      const { puzzle: matePuzzle, nextState: afterMate } = selectNextPuzzle(checkmatePuzzles, 1, genState);
      genState = afterMate;
      queue.push({ type: 'checkmate', puzzle: matePuzzle });
    } else {
      const capPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
      const capTier = getSessionTier(capPiece.id);
      const { puzzle: capPuzzle, nextState: afterCap } = selectNextPuzzle(capturePuzzles, capTier, genState);
      genState = afterCap;
      queue.push({ type: 'capture', puzzle: capPuzzle });
    }
  }

  return queue;
}
```

### Amplitude Event — new chess puzzle answered event
```typescript
// models/amplitudeEvents.ts — additions
export enum AmplitudeEventsEnum {
  // ... existing ...
  CHESS_PUZZLE_ANSWERED = 'chess_puzzle_answered',
}

export interface ChessPuzzleAnsweredProperties {
  puzzle_type: 'movement' | 'capture' | 'checkmate';
  correct: boolean;
  piece_id: string;
  difficulty: 1 | 2 | 3;
  session_index: number;
}

// In EventMap:
[AmplitudeEventsEnum.CHESS_PUZZLE_ANSWERED]: ChessPuzzleAnsweredProperties;
```

## Environment Availability

Step 2.6: SKIPPED — phase is code/config-only changes with no external dependencies beyond the existing project stack.

## Validation Architecture

nyquist_validation is enabled (config.json `workflow.nyquist_validation: true`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright Test 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATE-03 | Checkmate puzzle appears in Challenge session (no crash, shows exit button) | e2e smoke | `npm test -- --grep "checkmate"` | Partial — `app.spec.ts` has `chess checkmate puzzles` describe block but only tests data loading, not session appearance |
| MATE-03 | Feature flag `chessCheckmateEnabled=false` keeps session as movement+capture only | unit | manual inspection / TypeScript compile | No automated test |
| MATE-03 | Amplitude event fires on checkmate answer (correct and wrong) | manual | check Amplitude dashboard | No automated test |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/app.spec.ts` — expand `Chess checkmate puzzles` describe block: add a test that enters a Challenge session and verifies checkmate puzzle eventually appears (requires mocking `chessCheckmateEnabled=true` in localStorage/session + forcing the queue to place checkmate at index 0 or just navigating to the session and asserting the text `ui.tapToCheckmate` becomes visible at some point). This is difficult to guarantee without queue manipulation, so a simpler test: verify the session renders without crashing when checkmate is in the queue.

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `hooks/usePuzzleSession.ts` — session queue structure, SessionPuzzle type, hydrateSession logic
- Direct codebase read: `lib/featureFlags/types.ts` + `providers/firebaseRemoteConfig.ts` — exact 4-step feature flag pattern
- Direct codebase read: `models/amplitudeEvents.ts` + `utils/amplitude.ts` — Amplitude event taxonomy and logEvent contract
- Direct codebase read: `app/[locale]/games/chess-game/CheckmatePuzzle.tsx` — component API, internal sound behavior
- Direct codebase read: `app/[locale]/games/chess-game/ChessGameContent.tsx` — session rendering, dynamic imports, handleAnswer
- Direct codebase read: `utils/puzzleGenerator.ts` — `selectNextPuzzle` generic signature confirms checkmate pool works
- Direct codebase read: `data/chessPuzzles.ts` — `checkmatePuzzles` array exists, exported, 20+ entries confirmed (starting line 1121)
- CLAUDE.md — 4-step feature flag process documented, tech stack confirmed

### Secondary (MEDIUM confidence)
- None needed — all findings from authoritative codebase reads

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly from codebase
- Architecture: HIGH — patterns extracted from actual code, not assumed
- Pitfalls: HIGH — identified from direct inspection of type contracts and sound handling in CheckmatePuzzle.tsx

**Research date:** 2026-03-23
**Valid until:** 60 days (stable codebase, no fast-moving dependencies)
