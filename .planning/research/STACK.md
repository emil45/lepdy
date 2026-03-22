# Stack Research

**Domain:** Kids chess puzzle game — v1.4 new features (menu redesign, practice mode, check/checkmate puzzles, visual polish, progress engagement)
**Project:** Lepdy Chess v1.4 Complete Puzzle Experience
**Researched:** 2026-03-23
**Confidence:** HIGH

---

## Verdict: No New Dependencies Required

**Zero new npm packages needed for v1.4.** Every capability required by the new features is already available in the installed stack. This is a build-on-what-exists milestone, identical to the v1.3 precedent.

---

## Context: What Already Exists

| Already In Place | Version | Purpose |
|-----------------|---------|---------|
| `chess.js` | 1.4.0 | `inCheck()`, `isCheckmate()`, `moves()` — covers all new puzzle types |
| `react-chessboard` | 5.10.0 | Board rendering for new puzzle components |
| `react-confetti` | 6.4.0 | Celebration effects — already used in chess game |
| `@mui/material` | 7.3.7 | All layout, animation, and progress UI components |
| `@emotion/react` | 11.14.0 | CSS-in-JS for custom keyframe animations |
| `next-intl` | 4.7.0 | New translation keys for new UI sections |
| `localStorage` pattern | — | Progress persistence in `usePuzzleProgress`, `useChessProgress` |
| Audio system | — | `utils/audio.ts` `AudioSounds` enum + `playSound()` / `playRandomCelebration()` |

---

## Capability Map by Feature

### 1. Menu Redesign

**What's needed:** Replace the broken 1/2/3/daily card stack with an intuitive layout — distinct sections for Practice, Daily Puzzle, and Sessions.

**How the current stack covers it:**

- MUI `Box`, `Card`, `CardActionArea`, `Typography`, `Chip`, `Badge` — all in MUI 7.3.7
- MUI `Fade` — already used for all chess view transitions (`ChessGameContent.tsx`)
- New `ChessView` values (`'practice'`, `'practice-select'`) slot directly into the existing `ChessView` type union and `useState<ChessView>` routing pattern

**Integration point:** `ChessGameContent.tsx` already handles view routing via a `currentView` state string; adding new views is an additive change with no architectural change.

**No new packages.**

---

### 2. Practice Mode (per-piece drilling)

**What's needed:** A mode where the child picks a specific piece and drills movement + capture puzzles for it only, with per-piece mastery progress visible.

**How the current stack covers it:**

- `utils/puzzleGenerator.ts` `selectNextPuzzle()` already accepts any puzzle pool; a filtered single-piece pool is a one-liner
- `hooks/usePuzzleProgress.ts` already tracks tier (1/2/3) per piece and exposes `recordCorrect(pieceId)` / `recordWrong(pieceId)`
- `hooks/usePuzzleSession.ts` already builds a `SessionPuzzle[]` queue; a `usePracticeModeSession` hook wraps the same primitives with a single-piece filter
- Piece picker UI: MUI `Grid2` + `Card` with piece SVGs (already in `pieceThemes.tsx`)
- `usePuzzleProgress` already exposes `data.pieces` (the `currentTiersByPiece` from `usePuzzleSession`) — mastery display reads from here

**No new packages.**

---

### 3. New Puzzle Types: Check and Checkmate-in-1

**What's needed:** (a) Check puzzle — child identifies/resolves a check position; (b) Checkmate-in-1 — child finds the one mating move.

**chess.js 1.4.0 provides (verified via direct test against installed version):**

| Method | Return | Confirmed |
|--------|--------|-----------|
| `inCheck()` | `true` if side to move is in check | YES — tested at runtime |
| `isCheckmate()` | `true` if side to move is checkmated | YES — tested at runtime |
| `moves({ verbose: true })` | All legal moves with full metadata | YES — existing usage in v1.3 |
| `move(san)` / `undo()` | Make and undo moves for brute-force scan | YES — standard chess.js API |

**Checkmate-in-1 validation pattern (no new deps, pure chess.js):**

```typescript
// Used offline during puzzle authoring to validate FEN positions
function isCheckmateIn1(fen: string): { matingMove: string } | null {
  const chess = new Chess(fen);
  for (const move of chess.moves()) {
    chess.move(move);
    if (chess.isCheckmate()) {
      chess.undo();
      return { matingMove: move };
    }
    chess.undo();
  }
  return null;
}
```

**New data types** (extend `data/chessPuzzles.ts`):

```typescript
export interface CheckPuzzle {
  id: string;
  fen: string;              // Position where a piece can deliver check
  pieceSquare: string;      // Piece to move
  checkSquare: string;      // Where to move to deliver check
  difficulty: 1 | 2 | 3;
}

export interface CheckmatePuzzle {
  id: string;
  fen: string;              // Position with exactly one mating move
  pieceSquare: string;      // The mating piece's current square
  matingSquare: string;     // Where to move to checkmate
  difficulty: 1 | 2 | 3;
}
```

**Puzzle authoring workflow:** Same as v1.3 — compose FEN positions, run `isCheckmateIn1()` or `chess.inCheck()` to validate, store as typed arrays. No runtime generation.

**New `SessionPuzzle` union variants** in `usePuzzleSession.ts`:

```typescript
export type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle }
  | { type: 'check'; puzzle: CheckPuzzle }         // new
  | { type: 'checkmate'; puzzle: CheckmatePuzzle } // new
```

**No new packages.**

---

### 4. Visual Polish (animations, sounds, micro-rewards)

**What's needed:** Richer animations on puzzle solve, mastery band upgrades, session completion screen polish, micro-reward moments.

**MUI 7 transition components (all already installed):**

| Component | Use Case | Already Used |
|-----------|----------|--------------|
| `Fade` | View transitions, hint reveals | Yes — chess game throughout |
| `Grow` | "Pop in" rewards, mastery badge reveals | Available |
| `Zoom` | Star reveal on session complete | Available |
| `Slide` | New puzzle sliding in from the side | Available |
| `Collapse` | Expandable mastery details panel | Available |

**Emotion CSS keyframes** (via `@emotion/react`, already installed as MUI's engine) — for custom animations like the existing screen shake in `utils/celebrations.ts`. Same `document.createElement('style')` singleton pattern already in use.

**react-confetti 6.4.0** — already installed and already used in `MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `SessionCompleteScreen.tsx`. Confirmed working with React 19.2.3 in this codebase.

**Audio:** `utils/audio.ts` `AudioSounds` enum already has `LEVEL_UP`, `SUCCESS`, `CELEBRATION*`, `DING`, `SPARKLE`, `WHOOSH`, `POP`, `HINT`. Adding a new chess-specific sound (e.g., a distinct "king in check" tone) only requires adding one `AudioSounds` enum entry + one MP3 file in `/public/audio/common/`. No library change.

**No new packages.**

---

### 5. Progress & Engagement (visible mastery, rewarding feedback)

**What's needed:** Per-piece mastery bars, visible tier (Beginner/Intermediate/Expert), session history indicators, encouragement for daily return.

**MUI 7 progress components (already installed):**

| Component | Use Case |
|-----------|----------|
| `LinearProgress variant="determinate"` | Per-piece mastery fill bar (0–100%) |
| `CircularProgress variant="determinate"` | Optional ring indicator for overall mastery |

**Custom styling:** MUI `sx` prop with Lepdy's pastel palette (already defined in `theme/theme.ts`) — no external CSS library.

**Existing hooks to extend (no new hook files needed):**

- `usePuzzleProgress.ts` — already tracks `tier` (1/2/3) per piece plus `correctCount`/`wrongCount`. Mastery percentage derivable as `(correctCount / (correctCount + wrongCount)) * 100` with no schema migration.
- `usePuzzleSession.ts` — already exposes `currentTiersByPiece` and `sessionTiers`. The `SessionCompleteScreen` already receives these — progress display is a UI extension, not a data change.

**Mastery band display (no new data):**

```typescript
// Derives from existing PiecePuzzleProgress.tier (already persisted)
function getMasteryLabel(tier: 1 | 2 | 3): string {
  return { 1: 'Beginner', 2: 'Intermediate', 3: 'Expert' }[tier];
}
```

**No new packages.**

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` / `motion` | 143 kB gzipped; dual animation system conflicts with MUI transitions already in use | MUI `Fade`/`Grow`/`Zoom`/`Slide` + Emotion keyframes |
| `lottie-react` | Heavy (40+ kB) for a few micro-animations; overkill for this scope | CSS animations + react-confetti already installed |
| `react-spring` | Overlaps with MUI transitions; introduces two animation systems in one codebase | MUI transitions cover all use cases |
| Stockfish WASM | 500 kB+ binary; not needed — puzzles are curated static FENs, not AI-generated | chess.js `isCheckmate()` on static positions |
| Lichess puzzle API at runtime | Network dependency, latency, licensing, API key management | Curated local FEN arrays (proven v1.3 approach) |
| Zustand / Redux | One hook per feature with localStorage is the established pattern; adding a store for this data is over-engineering | React `useState` + custom hooks |
| `react-query` / SWR | No server data fetching involved | localStorage only |
| ELO/Glicko rating packages | Meaningless to ages 5-9; already decided in v1.3 (named mastery bands instead) | Simple tier step-up (already implemented) |

---

## Installation

No new packages are required.

```bash
# Nothing to install — zero new dependencies for v1.4
```

---

## Version Compatibility

| Package | Version | React 19 Compatible | Notes |
|---------|---------|---------------------|-------|
| chess.js | 1.4.0 | Yes (no React dependency) | `inCheck()` and `isCheckmate()` confirmed working via direct runtime test |
| react-confetti | 6.4.0 | Yes (confirmed working) | Already in production use in chess game with React 19.2.3 |
| @mui/material | 7.3.7 | Yes (official support) | MUI v7 officially targets React 18+/19 |
| @emotion/react | 11.14.0 | Yes (confirmed working) | MUI's CSS engine; no issues |
| next-intl | 4.7.0 | Yes (confirmed working) | No changes needed |

---

## Sources

- chess.js official API docs (https://jhlywa.github.io/chess.js/) — `inCheck()`, `isCheckmate()`, `moves()` method signatures (HIGH confidence)
- chess.js runtime test — `inCheck()` and `isCheckmate()` tested directly against installed 1.4.0 in `/Users/emil/code/lepdy/node_modules/chess.js` (HIGH confidence)
- MUI v7 transitions docs (https://mui.com/material-ui/transitions/) — Fade, Grow, Zoom, Slide, Collapse availability confirmed (HIGH confidence)
- MUI v7 progress docs (https://mui.com/material-ui/react-progress/) — LinearProgress, CircularProgress confirmed (HIGH confidence)
- Codebase inspection — react-confetti usage in `MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `SessionCompleteScreen.tsx` confirms React 19.2.3 compatibility in production (HIGH confidence)
- Codebase inspection — `usePuzzleProgress.ts`, `usePuzzleSession.ts`, `puzzleGenerator.ts` show extension points for practice mode (HIGH confidence)

---

*Stack research for: Lepdy Chess v1.4 Complete Puzzle Experience*
*Researched: 2026-03-23*
