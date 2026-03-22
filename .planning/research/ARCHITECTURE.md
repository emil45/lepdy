# Architecture Research

**Domain:** Infinite replayability, random puzzle generation, escalating difficulty, and progression systems for an existing kids chess learning game
**Researched:** 2026-03-22
**Confidence:** HIGH — based on direct codebase reading, not assumptions

---

## Existing Architecture (as-shipped, v1.2)

Understanding what exists is prerequisite to knowing what changes.

### Current System Overview

```
app/[locale]/games/chess-game/
├── page.tsx                    (Server: locale, metadata)
├── ChessGameContent.tsx        (Client: state machine — 'map' | 'level-1' | 'level-2' | 'level-3')
├── PieceIntroduction.tsx       (Level 1: swipe through 6 pieces with Hebrew names + audio)
├── MovementPuzzle.tsx          (Level 2: 18 fixed puzzles from chessPuzzles.ts)
├── CapturePuzzle.tsx           (Level 3: 8 fixed puzzles from chessPuzzles.ts)
├── ChessSettingsDrawer.tsx     (Piece theme selection)
└── pieceThemes.tsx             (Factory: staunty/horsey SVG render objects)

hooks/
├── useChessProgress.ts         (localStorage: completedLevels[], currentLevel)
└── useChessPieceTheme.ts       (localStorage: 'staunty' | 'horsey')

data/
├── chessPieces.ts              (6 piece configs: id, translationKey, audioFile, fenChar, order)
└── chessPuzzles.ts             (movementPuzzles[18] + capturePuzzles[8], hand-curated FEN arrays)

utils/
└── chessFen.ts                 (moveFenPiece: FEN piece-placement string manipulation)
```

### Current State Machine (ChessGameContent)

```
ChessView = 'map' | 'level-1' | 'level-2' | 'level-3'

'map'     → LevelMapCard × 3 (locked/unlocked/completed)
'level-1' → <PieceIntroduction onComplete={() => setView('map')} completeLevel />
'level-2' → <MovementPuzzle onComplete={() => setView('map')} completeLevel />
'level-3' → <CapturePuzzle onComplete={() => setView('map')} completeLevel />
```

### Current Puzzle Consumption Pattern

Both MovementPuzzle and CapturePuzzle share the same internal pattern:

```typescript
// Module-level constant — puzzles ordered at import time
const ORDERED_PUZZLES = [...source].sort(...)

// Component-local state
const [puzzleIndex, setPuzzleIndex] = useState(0);
const puzzle = ORDERED_PUZZLES[puzzleIndex];

// Advance: puzzleIndex++ until puzzleIndex === ORDERED_PUZZLES.length - 1
// Then: completeLevel(N) → onComplete()
```

The critical constraint: puzzles are a **finite ordered array consumed linearly**. When the array ends, the level ends. This is the primary architectural constraint v1.3 must change.

### Current Progress Schema (localStorage)

```typescript
interface ChessProgressData {
  completedLevels: number[];  // [1], [1,2], [1,2,3]
  currentLevel: number;       // max unlocked level
}
// key: 'lepdy_chess_progress'
```

This is minimal — no puzzle attempt counts, no per-session data, no difficulty tracking.

---

## v1.3 Target: What Needs to Change

### What "Infinite Replayability" Requires

1. **Puzzle generation**: Instead of consuming a finite array, generate puzzles on demand — either fully algorithmically or by sampling from a much larger set with smart selection.
2. **Escalating difficulty**: Track how well the child is doing and adjust puzzle difficulty dynamically.
3. **Progression system**: Give kids a reason to return — streaks, stars earned per session, piece mastery badges, or a cumulative score.
4. **Seamless UX**: The child should never hit a "you're done" wall mid-session. Puzzles keep coming.

### What Must NOT Change

- `page.tsx` / `ChessGameContent.tsx` routing pattern — stable, don't touch the shell
- `useChessPieceTheme` — no changes needed
- `ChessSettingsDrawer` — no changes needed
- `PieceIntroduction` (Level 1) — learning phase stays as-is; infinite replayability applies to puzzle levels only
- `chessPieces.ts` — piece data is correct and stable
- `chessFen.ts` — FEN utilities are correct and tested
- Existing localStorage key `lepdy_chess_progress` — must migrate, not replace (existing players have data)

---

## Recommended Architecture for v1.3

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    ChessGameContent.tsx                          │
│   State machine: 'map' | 'level-1' | 'level-2' | 'level-3'     │
│   (unchanged shell — new views slot in without changes here)     │
├──────────────────────────────────────────────────────────────────┤
│    Level 2: MovementPuzzle    │    Level 3: CapturePuzzle        │
│    (refactored internals)     │    (refactored internals)        │
│         ↓                    │         ↓                        │
│    usePuzzleSession           │    usePuzzleSession              │
│    (shared session hook)      │    (shared session hook)         │
├──────────────────────────────────────────────────────────────────┤
│    PuzzleGenerator            │    DifficultyTracker             │
│    (generate next puzzle)     │    (compute next difficulty)     │
│         ↓                    │         ↓                        │
│    chessPuzzles.ts            │    useChessProgress (extended)   │
│    (curated set, expanded)    │    (add difficulty + session data)│
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Status | Responsibility |
|-----------|--------|---------------|
| `ChessGameContent.tsx` | Unchanged | Top-level state machine and view router |
| `MovementPuzzle.tsx` | Refactored | Consumes puzzles from `usePuzzleSession` instead of fixed array |
| `CapturePuzzle.tsx` | Refactored | Same — consumes from `usePuzzleSession` |
| `usePuzzleSession.ts` | New | Per-session state: current puzzle, streak, score, session progress |
| `puzzleGenerator.ts` | New | Select next puzzle from pool based on difficulty level |
| `useChessProgress.ts` | Extended | Add difficulty tracking, session history, total puzzles solved |
| `PieceIntroduction.tsx` | Unchanged | Level 1 learning phase |
| `ChessSettingsDrawer.tsx` | Unchanged | Settings |

---

## New Components: Detailed Design

### 1. `usePuzzleSession.ts` (New Hook)

This replaces the `puzzleIndex` + `ORDERED_PUZZLES` pattern inside puzzle components. It owns all per-session state.

```typescript
interface PuzzleSessionState {
  currentPuzzle: MovementPuzzle | CapturePuzzle;
  puzzlesSolvedThisSession: number;
  streakCount: number;             // consecutive correct first-try answers
  difficultyLevel: 1 | 2 | 3;     // current operating difficulty
  sessionComplete: boolean;        // true after N puzzles (e.g. 10)
}

interface UsePuzzleSessionReturn {
  puzzle: MovementPuzzle | CapturePuzzle;
  puzzleNumber: number;            // 1-based for UI ("Puzzle 3 of 10")
  sessionTotal: number;            // e.g. 10 (configurable)
  streakCount: number;
  difficultyLevel: 1 | 2 | 3;
  recordCorrect(firstTry: boolean): void;  // advance to next puzzle
  recordSkip(): void;                      // skip current puzzle (no penalty)
  isSessionComplete: boolean;
}
```

**Key behavior:**
- Generates the first puzzle on mount by calling `puzzleGenerator.nextPuzzle()`
- On `recordCorrect()`: updates streak, calls progress hook, gets next puzzle
- Session ends after `sessionTotal` puzzles (not when array exhausted)
- Streak breaks on `recordCorrect(firstTry: false)` — resets to 0

**Integration point with existing components:** MovementPuzzle and CapturePuzzle replace their `puzzleIndex` / `ORDERED_PUZZLES` local state with a call to `usePuzzleSession()`. Board render logic, FEN animation, and square highlighting remain unchanged.

### 2. `puzzleGenerator.ts` (New Utility)

Selects the next puzzle from a pool based on the current difficulty level. Pure function — no side effects, no state.

```typescript
function nextPuzzle(
  pool: MovementPuzzle[],   // or CapturePuzzle[]
  difficulty: 1 | 2 | 3,
  recentIds: string[]       // avoid immediate repeats
): MovementPuzzle | CapturePuzzle
```

**Algorithm:** Filter pool by `difficulty`, exclude `recentIds` (last 3-5), pick randomly. If filtered pool is empty (e.g. not enough puzzles at difficulty 3), fall back to difficulty 2 or 1.

**Why not full algorithmic generation?** Generating valid chess puzzles algorithmically for a 5-year-old is a solved but complex problem (requires chess.js legal move computation + position quality checks). Expanding the curated pool from 18→60+ puzzles is faster to ship, easier to tune for kid-friendliness, and produces better results for this age group. Algorithmic generation is a future option — the `puzzleGenerator` abstraction keeps that door open.

### 3. Extended `useChessProgress.ts`

The existing hook tracks only `completedLevels[]`. v1.3 adds difficulty and session history without breaking the existing localStorage format.

**Extended schema:**

```typescript
interface ChessProgressData {
  completedLevels: number[];          // existing — keep as-is
  currentLevel: number;               // existing — keep as-is
  // v1.3 additions:
  movementDifficulty: 1 | 2 | 3;     // current difficulty for movement puzzles
  captureDifficulty: 1 | 2 | 3;      // current difficulty for capture puzzles
  totalPuzzlesSolved: number;         // lifetime counter
  sessionPuzzlesCorrect: number[];    // per-session correct counts (last 5 sessions)
  longestStreak: number;              // lifetime best streak
}
```

**Migration:** On load, if `movementDifficulty` is missing, default to 1. Existing `completedLevels` data is preserved. No breaking change.

**New methods exposed:**

```typescript
interface UseChessProgressReturn {
  // existing
  completedLevels: number[];
  completeLevel: (levelNum: number) => void;
  isLevelUnlocked: (levelNum: number) => boolean;
  isLevelCompleted: (levelNum: number) => boolean;
  // v1.3 additions
  movementDifficulty: 1 | 2 | 3;
  captureDifficulty: 1 | 2 | 3;
  totalPuzzlesSolved: number;
  longestStreak: number;
  recordPuzzleSolved(levelType: 'movement' | 'capture', firstTry: boolean): void;
  recordSessionComplete(levelType: 'movement' | 'capture', score: number): void;
}
```

**Difficulty escalation rule** (inside `recordPuzzleSolved`):
- Track rolling accuracy over last 5 puzzles
- If 5/5 correct on first try at current difficulty → bump difficulty up
- If 3/5 or worse → bump difficulty down (never below 1)
- Difficulty changes are persisted immediately

---

## Data Flow Changes

### New Puzzle Consumption Flow (Movement/Capture)

```
User taps Level 2 on map
  → ChessGameContent renders <MovementPuzzle completeLevel={completeLevel} onComplete={...} />
  → MovementPuzzle calls usePuzzleSession({ pool: movementPuzzles, progress })
      → usePuzzleSession calls puzzleGenerator.nextPuzzle(pool, difficulty, [])
      → returns first puzzle
  → Board renders puzzle.fen
  → User taps correct square
      → handlePuzzleSquareClick → correct path → usePuzzleSession.recordCorrect(firstTry)
          → streak++, puzzlesSolved++
          → if puzzlesSolved < sessionTotal → nextPuzzle() → new puzzle renders
          → if puzzlesSolved === sessionTotal → sessionComplete = true
  → SessionComplete screen shows (star earned, return to map)
  → onComplete() → back to map
```

### Difficulty Escalation Flow

```
usePuzzleSession.recordCorrect(firstTry: boolean)
  → progress.recordPuzzleSolved('movement', firstTry)
      → increments rollingAccuracy[last5]
      → if should bump: setMovementDifficulty(prev + 1) → localStorage
      → if should drop: setMovementDifficulty(prev - 1) → localStorage
  → next puzzle from puzzleGenerator uses new difficulty level
```

### Progress Data Flow

```
useChessProgress (extended)
  ├── reads from localStorage 'lepdy_chess_progress' on mount
  ├── merges new fields with defaults if missing (migration)
  └── writes on every recordPuzzleSolved() and recordSessionComplete()

usePuzzleSession
  ├── reads difficulty from useChessProgress
  ├── calls recordPuzzleSolved() on each correct answer
  └── calls recordSessionComplete() when session ends
```

---

## Progression System: Recommended Approach

After reviewing common patterns for kids learning games (Duolingo Kids, ChessKid, Endless Alphabet), the recommended progression model is **stars per session** rather than points or leaderboards — it aligns with Lepdy's existing sticker/achievement model and avoids competitive pressure for ages 5-9.

### Session Star System

- Each puzzle session is 10 puzzles
- Session earns 1-3 stars based on accuracy:
  - 3 stars: 8+ correct on first try
  - 2 stars: 5-7 correct on first try
  - 1 star: completed session (any accuracy)
- Stars are shown on the session-complete screen and stored in progress
- The level-map cards update to show "best session stars" alongside the existing checkmark

### What NOT to Build

- Per-puzzle scoring / points — creates anxiety in young kids
- Leaderboards — PROJECT.md explicitly out of scope
- Failure states that block progress — always allow retry or skip
- Level locks based on stars — access stays based on level completion only

---

## Structural Changes to Puzzle Components

### Before (MovementPuzzle / CapturePuzzle internal structure)

```typescript
// Module-level constant — runs once at import
const ORDERED_PUZZLES = PIECE_ORDER.flatMap(...)

export default function MovementPuzzle({ onComplete, completeLevel }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = ORDERED_PUZZLES[puzzleIndex];
  // ...advance logic inline with setTimeout chains
  // ...endgame: completeLevel(2) → onComplete()
}
```

### After (using usePuzzleSession)

```typescript
export default function MovementPuzzle({ onComplete, completeLevel }) {
  const progress = useChessProgress();
  const session = usePuzzleSession({
    pool: movementPuzzles,
    levelType: 'movement',
    difficulty: progress.movementDifficulty,
    onPuzzleSolved: (firstTry) => progress.recordPuzzleSolved('movement', firstTry),
    onSessionComplete: (score) => {
      progress.recordSessionComplete('movement', score);
      completeLevel(2);
    },
  });

  const { puzzle, isSessionComplete } = session;
  // ...rest of board render logic unchanged
  // ...handlePuzzleSquareClick calls session.recordCorrect(firstTry) instead of setPuzzleIndex
}
```

The board rendering, FEN manipulation, `squareStyles` computation, and confetti logic are unchanged. Only the puzzle source and advance mechanism changes.

---

## New File Locations

```
app/[locale]/games/chess-game/
├── page.tsx                      (unchanged)
├── ChessGameContent.tsx          (unchanged)
├── PieceIntroduction.tsx         (unchanged)
├── MovementPuzzle.tsx            (refactored — uses usePuzzleSession)
├── CapturePuzzle.tsx             (refactored — uses usePuzzleSession)
├── SessionComplete.tsx           (new — star display screen between sessions)
├── ChessSettingsDrawer.tsx       (unchanged)
└── pieceThemes.tsx               (unchanged)

hooks/
├── useChessProgress.ts           (extended — new fields + methods)
├── useChessPieceTheme.ts         (unchanged)
└── usePuzzleSession.ts           (new)

utils/
├── chessFen.ts                   (unchanged)
└── puzzleGenerator.ts            (new)

data/
├── chessPieces.ts                (unchanged)
└── chessPuzzles.ts               (expanded — 18→60+ puzzles for broader difficulty range)
```

---

## Build Order (Phase Dependencies)

Dependencies flow bottom-up. Each item must exist before items that depend on it.

```
Phase A: Expand puzzle pool
  chessPuzzles.ts: add difficulty-3 puzzles for movement (currently only 1-2-3 but thin)
  chessPuzzles.ts: add difficulty-2 and 3 capture puzzles (currently 8 total)
  Target: 10+ puzzles per difficulty tier per level type
  [No code dependencies — pure data expansion]

Phase B: Puzzle generator utility
  utils/puzzleGenerator.ts: nextPuzzle(pool, difficulty, recentIds) pure function
  [Depends on: chessPuzzles.ts types]
  [Enables: usePuzzleSession]

Phase C: Extended progress hook
  hooks/useChessProgress.ts: add movementDifficulty, captureDifficulty, totalPuzzlesSolved
  hooks/useChessProgress.ts: add recordPuzzleSolved() with escalation logic
  hooks/useChessProgress.ts: localStorage migration (safe — additive only)
  [Depends on: nothing new]
  [Enables: usePuzzleSession difficulty input + session recording]

Phase D: Session hook
  hooks/usePuzzleSession.ts: session state, streak, puzzle advance
  [Depends on: puzzleGenerator, useChessProgress extended API]
  [Enables: refactored puzzle components]

Phase E: Refactor puzzle components
  MovementPuzzle.tsx: replace puzzleIndex + ORDERED_PUZZLES with usePuzzleSession
  CapturePuzzle.tsx: same
  Board render logic: unchanged — only puzzle source changes
  [Depends on: usePuzzleSession]

Phase F: Session complete screen + progression UI
  SessionComplete.tsx: star display, session summary
  LevelMapCard: update to show session stars
  [Depends on: extended useChessProgress, session data]

Phase G: Progression system integration
  useChessProgress: recordSessionComplete, longestStreak
  i18n keys: new strings for session complete, star labels
  [Depends on: SessionComplete component]
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Generating Puzzles Algorithmically Before Expanding the Pool

**What happens:** Algorithmic generation (chess.js + random piece placement + legal move validation) sounds like infinite replayability but is complex to tune for 5-year-olds. Generated positions may have too many or too few valid moves, or place pieces in confusing configurations.

**Do this instead:** Expand the curated pool from 18→60+ movement puzzles and 8→30+ capture puzzles. Each puzzle is hand-verified for clarity. The `puzzleGenerator` randomly samples from the pool. This is sufficient for "feels infinite" with far less complexity.

### Anti-Pattern 2: Storing Difficulty State Inside Puzzle Components

**What happens:** Each puzzle component tracks its own difficulty locally. On unmount (exit game), difficulty resets. Kids who learned at difficulty 2 restart at difficulty 1 every session.

**Do this instead:** Difficulty lives exclusively in `useChessProgress` (localStorage). `usePuzzleSession` reads difficulty as an input, never stores it. Persistence is guaranteed.

### Anti-Pattern 3: Blocking Level Re-entry on Completion

**What happens:** Level 2 and 3 are already marked complete, so the level map disables them or changes click behavior — kids can't replay.

**Do this instead:** Completed levels stay tappable. On re-entry, `usePuzzleSession` starts a fresh session at the player's current difficulty. The `completeLevel()` call on session end is idempotent (useChessProgress already handles duplicate completions).

### Anti-Pattern 4: Replacing useChessProgress Instead of Extending It

**What happens:** Create a new `useChessProgressV2` hook and migrate ChessGameContent to use it. The old hook is abandoned. Existing players lose their progress.

**Do this instead:** Extend the existing hook in-place. The localStorage migration is additive — new fields default gracefully. No player data is lost.

### Anti-Pattern 5: Session Length Too Long

**What happens:** Setting session to 20+ puzzles. Young kids (5-7) lose attention after 5-10 minutes. A 20-puzzle session forces them to either abandon mid-session or complete it resentfully.

**Do this instead:** 10 puzzles per session maximum. This maps to roughly 3-5 minutes of play for this age. The session-complete celebration becomes a natural and satisfying stopping point.

---

## Integration Points (New ↔ Existing)

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `MovementPuzzle` ↔ `usePuzzleSession` | Props: `pool`, `levelType`, `difficulty`, callbacks | Session hook is the single puzzle source |
| `usePuzzleSession` ↔ `puzzleGenerator` | Function call: `nextPuzzle(pool, difficulty, recentIds)` | Pure function, no shared state |
| `usePuzzleSession` ↔ `useChessProgress` | Props in, callbacks out — progress hook is not called directly from session | Clean separation |
| `ChessGameContent` ↔ `MovementPuzzle/CapturePuzzle` | Interface unchanged: `onComplete`, `completeLevel` props | Shell is untouched |
| `useChessProgress` ↔ `localStorage` | Existing key `lepdy_chess_progress`, additive migration | No breaking change |
| `SessionComplete.tsx` ↔ `useChessProgress` | Reads `longestStreak`, session stars for display | Read-only — no writes from this component |

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| Amplitude | Log `puzzle_solved`, `session_complete`, `difficulty_changed` events | Use existing `logEvent()` pattern — no new setup |
| Firebase Remote Config | Feature flag `chessInfiniteMode` during rollout | Use existing `useFeatureFlagContext()` |
| localStorage | Additive schema migration in `useChessProgress` | No new storage keys needed |

---

## Scaling Considerations

| Concern | Now (v1.3) | Future |
|---------|------------|--------|
| Puzzle pool size | 60-80 curated FEN puzzles | Could generate algorithmically via chess.js if pool feels repetitive |
| Difficulty calibration | Simple rolling accuracy (last 5 puzzles) | Spaced repetition (SM-2 algorithm) for per-puzzle retention tracking |
| Progress sync | localStorage only | Firebase anonymous auth + Firestore, same pattern as simon-game leaderboard |
| New puzzle types | Movement + Capture sessions | Check detection, fork identification as new level types using same session architecture |

---

## Sources

- Direct codebase reading: `/Users/emil/code/lepdy/app/[locale]/games/chess-game/` (HIGH confidence — first-hand)
- Direct codebase reading: `/Users/emil/code/lepdy/hooks/useChessProgress.ts` (HIGH confidence — first-hand)
- Direct codebase reading: `/Users/emil/code/lepdy/data/chessPuzzles.ts` (HIGH confidence — first-hand)
- Lepdy PROJECT.md v1.3 milestone description (HIGH confidence — first-hand)
- Pattern reference: Duolingo Kids session model (MEDIUM confidence — industry knowledge)
- Pattern reference: localStorage additive migration pattern from existing Lepdy hooks (HIGH confidence — codebase)

---

*Architecture research for: v1.3 Infinite Replayability — chess learning game*
*Researched: 2026-03-22*
