# Stack Research

**Domain:** Infinite replayability — random puzzle generation, escalating difficulty, progression systems
**Project:** Lepdy Chess v1.3 (milestone addition to existing chess game)
**Researched:** 2026-03-22
**Confidence:** HIGH

---

## Context: What Already Exists

The existing stack is fixed. Do not re-research these:

| Already In Place | Version | Purpose |
|-----------------|---------|---------|
| `chess.js` | ^1.4.0 | Chess logic library (already installed) |
| `react-chessboard` | ^5.10.0 | Board rendering (already installed) |
| `react-confetti` | ^6.4.0 | Celebration effects (already installed) |
| localStorage pattern | — | Progress persistence (established in useChessProgress hook) |
| Difficulty field | — | `difficulty: 1 | 2 | 3` already exists on MovementPuzzle and CapturePuzzle |

The question is: what NEW additions are needed for infinite random puzzles with escalating difficulty and a progression system?

---

## Verdict: No New Dependencies Required

The v1.3 milestone can be delivered entirely using the existing stack. The work is algorithmic, not library-based.

**chess.js already provides everything needed for puzzle generation:**

```typescript
import { Chess } from 'chess.js';

// Load any position from FEN
const chess = new Chess('8/8/8/8/4R3/8/8/8 w - - 0 1');

// Get all legal moves for the rook on e4
const moves = chess.moves({ square: 'e4', verbose: true });
// Returns: [{ from: 'e4', to: 'e1', ... }, { from: 'e4', to: 'e2', ... }, ...]

// Extract valid target squares — these become validTargets in a GeneratedPuzzle
const targets = moves.map(m => m.to);
```

This is the entire puzzle generation engine. No additional library is needed.

---

## Recommended Stack Additions

### Zero new npm dependencies.

All three features — random puzzle generation, escalating difficulty, and progression tracking — are implemented using patterns that already exist in the codebase:

| Feature | Mechanism | Where |
|---------|-----------|-------|
| Random position generation | `Math.random()` + chess.js `Chess` instance | `utils/chessGenerator.ts` (new utility file) |
| Valid move computation | `chess.moves({ square, verbose: true })` | Same utility |
| Difficulty levels | Square count + piece mobility heuristics | Encoded in generator logic |
| Puzzle progression | Extended `useChessProgress` hook | `hooks/useChessProgress.ts` (extended) |
| Session streak | Extended `useChessProgress` hook | Same hook |
| Star/reward state | Extended `useChessProgress` hook | Same hook |

---

## What Changes (Not What's Added)

### 1. Puzzle Generator Utility — `utils/chessGenerator.ts` (new file)

Replace hand-curated static arrays with a generator function:

```typescript
// Generates a valid single-piece movement puzzle for any piece type and difficulty
function generateMovementPuzzle(pieceId: ChessPieceId, difficulty: 1 | 2 | 3): GeneratedMovementPuzzle

// Generates a capture puzzle with 1 correct piece and 1-3 distractors
function generateCapturePuzzle(difficulty: 1 | 2 | 3): GeneratedCapturePuzzle
```

The generator uses `chess.js` to place a piece at a random square appropriate to the difficulty tier, then calls `chess.moves({ square, verbose: true })` to derive valid targets. This is pure TypeScript with no new dependencies.

**Difficulty heuristics for movement puzzles (no library needed — pure logic):**

| Difficulty | Position Rule | Target Count |
|------------|--------------|--------------|
| 1 — Easy | Center-adjacent squares (c3–f6 range) | 8+ valid moves (open positions) |
| 2 — Medium | Edge-adjacent squares | 5–7 valid moves |
| 3 — Hard | Corner/edge squares with restricted mobility | 2–4 valid moves |

For pieces like the rook and bishop, "center vs. edge" naturally produces more/fewer valid targets through chess.js move generation — no custom logic needed beyond choosing the starting square.

**Why NOT a seeded random library (e.g., seedrandom):**
Seeded RNG is only valuable when you need to reproduce the exact same puzzle sequence across sessions (e.g., daily puzzle mode where all players solve the same puzzle). For this project, puzzles should feel fresh every visit — unseeded `Math.random()` is correct. No seeded RNG library needed.

### 2. Extended Progress Schema — `hooks/useChessProgress.ts` (extended)

The current `ChessProgressData` only tracks `completedLevels` and `currentLevel`. Extend it to support infinite mode:

```typescript
interface ChessProgressData {
  // Existing (keep backward-compatible)
  completedLevels: number[];
  currentLevel: number;

  // New for v1.3
  totalPuzzlesSolved: number;       // cumulative counter across all sessions
  currentStreak: number;            // consecutive correct answers in current session
  bestStreak: number;               // all-time best streak
  difficultyLevel: number;          // 1-10 escalating difficulty (persisted)
  lastPlayedDate: string | null;    // ISO date string — for daily streak detection
  totalStars: number;               // star rewards collected (for progression display)
}
```

This extends an existing hook using the established localStorage pattern. No context provider needed (existing decision: "useChessProgress as standalone hook, no context").

**Why NOT an external streak/gamification library:**
Lepdy already has a working streak hook (`useStreak.ts`) and category progress hooks. The chess game's progression needs are simpler (session-scoped streaks + cumulative counters). Adding a gamification library for what amounts to 3 counter fields in localStorage would be over-engineering.

### 3. Difficulty Escalation — Pure Logic, No Library

Implement difficulty as a locally computed value that increases with `totalPuzzlesSolved`:

```typescript
function getDifficultyTier(totalSolved: number): 1 | 2 | 3 {
  if (totalSolved < 10) return 1;
  if (totalSolved < 25) return 2;
  return 3;
}
```

This can be refined with breakpoints (e.g., reset back to easier puzzles when switching piece types), but the core mechanism is a pure function with no dependencies.

**Why NOT an adaptive difficulty library (e.g., ELO rating packages):**
ELO-based adaptive difficulty is appropriate when the system needs to track wrong answers, time-to-solve, and adjust on a per-puzzle basis — the approach used by Chess.com and Lichess. For a kids' app ages 5-9, that level of adaptation is both over-engineered and potentially demotivating (a child who keeps getting hard puzzles feels punished). A simple step-up-by-count approach is correct for this audience.

---

## What NOT to Add

| Do Not Add | Why | Use Instead |
|------------|-----|-------------|
| `seedrandom` or similar | Reproducible puzzles aren't needed — freshness is the goal | `Math.random()` |
| ELO/rating packages (`glicko-two`, etc.) | Sophisticated rating for ages 5-9 is demotivating overkill | Simple difficulty tiers |
| Gamification frameworks (`gamification-js`, `badgerhq`) | These require server state; Lepdy is client-only | Extended localStorage hook |
| Puzzle API / Lichess API at runtime | Network dependency, latency, requires API key management | Generated positions via chess.js |
| External puzzle databases (`432k-chess-puzzles` etc.) | Tactical puzzles are wrong domain — those are "find the best move", not "show where this piece can move" | chess.js move generation |
| State management library (Zustand, Redux) | One hook with localStorage is sufficient; adding a store for 4 counters is overkill | Extended `useChessProgress` hook |
| React Query / SWR | No server data involved | localStorage only |

---

## Integration Points

### chess.js moves() API (already installed, v1.4.0)

```typescript
// Full signature of what the generator uses:
chess.moves({ square: 'e4', verbose: true })
// Returns: Array<{ from: Square, to: Square, piece: PieceSymbol, ... }>

// For placement:
chess.put({ type: 'r', color: 'w' }, 'e4')  // Place white rook on e4
chess.clear()                                  // Clear board before placing
```

This API is confirmed stable in v1.4.0 (the version already installed).

### Backward Compatibility

The extended `ChessProgressData` schema must migrate gracefully. Use the existing guard pattern in `useChessProgress`:

```typescript
// In the localStorage load useEffect:
const totalPuzzlesSolved = typeof parsed.totalPuzzlesSolved === 'number'
  ? parsed.totalPuzzlesSolved
  : 0;
```

This matches the existing migration pattern already used in `useCategoryProgress` hooks.

### Performance on Tablets

chess.js move generation is synchronous and completes in microseconds for single-piece positions. No web worker, no async generation, no loading state needed. Generating a puzzle is fast enough to happen inline before rendering the next board.

---

## Installation

No new packages to install.

```bash
# Nothing to add — chess.js and react-chessboard are already in package.json
```

---

## Alternatives Considered

| Feature | Recommended | Alternative | Why Not |
|---------|-------------|-------------|---------|
| Puzzle generation | chess.js `moves()` API | Hand-curated static data | Finite (hits repeat after ~25 puzzles); adding more requires manual FEN authoring |
| Puzzle generation | chess.js `moves()` API | External puzzle database | Wrong puzzle type — tactical puzzles are move sequences, not movement demonstrations |
| Difficulty tracking | Simple tier counter | ELO rating | Ages 5-9 audience; ELO requires wrong-answer tracking and is demotivating at low levels |
| Progression state | Extended localStorage hook | React Context | Existing decision: chess hooks are standalone (no context); one more counter field doesn't justify adding context |
| Seeding | `Math.random()` | `seedrandom` | No daily puzzle mode planned; fresh randomness preferred over reproducibility |
| Streaks | Extended `useChessProgress` | External streak library | The app already has `useStreak.ts`; a second streak library would conflict with the existing pattern |

---

## Stack Patterns for This Milestone

**If the game needs a "puzzle of the day" mode (same puzzle for all users on same date):**
- Use a date-based seed: `const seed = new Date().toISOString().slice(0, 10)` → derive square index deterministically
- Still no seeded RNG library needed — a simple modulo over date numeric hash is sufficient

**If difficulty should reset when the piece type changes:**
- Track `currentPieceIndex` in the progress data and reset `currentStreak` but not `totalPuzzlesSolved`
- Pure data change, no new dependencies

**If a visual "level-up" moment is needed for escalating difficulty:**
- Use the existing `react-confetti` (already installed) with a brief screen transition
- Use MUI's existing `Fade` component (already in use) for smooth state change

---

## Sources

- chess.js npm: https://www.npmjs.com/package/chess.js — v1.4.0 confirmed current
- chess.js docs: https://jhlywa.github.io/chess.js/ — `moves({ square, verbose })` API confirmed
- chess.js GitHub releases: https://github.com/jhlywa/chess.js/releases — v1.4.0 is latest
- Existing codebase: `/utils/chessFen.ts`, `/hooks/useChessProgress.ts`, `/data/chessPuzzles.ts` — confirmed existing patterns
- Difficulty design: Predicting Chess Puzzle Difficulty research (arxiv.org/html/2410.11078v1) — center/edge heuristic aligns with complexity findings (LOW confidence — domain insight, not direct source)
- Kids progression UX: Duolingo gamification research via orizon.co/blog — streak + milestone mechanics (MEDIUM confidence)

---

*Stack research for: Lepdy Chess v1.3 Infinite Replayability*
*Researched: 2026-03-22*
