# Phase 6: Level 3 — Capture Puzzles - Research

**Researched:** 2026-03-22
**Domain:** React/Next.js chess puzzle UI — internal extension of existing chess game
**Confidence:** HIGH

## Summary

Phase 6 is the final level of the chess learning game. All foundational infrastructure (board, puzzle data, progress hook, feedback state machine, confetti, i18n strings) is already in place from Phases 2-5. This phase is almost entirely an internal cloning-and-adapting exercise with zero new external dependencies.

The work decomposes cleanly into two tasks: (1) a new `CapturePuzzle.tsx` component that mirrors `MovementPuzzle.tsx` with capture-specific interaction logic, and (2) a thin wire-up in `ChessGameContent.tsx` replacing the "Coming soon..." placeholder plus adding the missing `tapToCapture` translation key. The `CapturePuzzle` data type and all 8 puzzle records already exist in `data/chessPuzzles.ts`.

The critical interaction difference from Level 2 is that the player taps a **white piece square** (the capturer) rather than an **empty destination square**. The board contains multiple pieces — both white distractors and a black target — so `onSquareClick` must filter to squares that contain white pieces and match them against `correctPieceSquare` and `distractorSquares`.

**Primary recommendation:** Model `CapturePuzzle.tsx` directly on `MovementPuzzle.tsx` — copy the state machine and board rendering, swap the click handler logic, add target ring + correctPieceSquare glow styles, and add the enhanced final-level completion screen.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Interaction model:** Child taps the white piece that can capture the highlighted target. Target (black piece) has a red/orange ring via `squareStyles`. Tapping wrong white piece = wrong tap with gentle feedback. Tapping empty squares does nothing.
- **Celebration:** Same as Level 2 — green flash, confetti burst (`showCorrectConfetti`), `playRandomCelebration()`, auto-advance after 1.5s.
- **Hint timing:** After 2 wrong taps, correct piece's square gets a green glow — same threshold as Phase 5 but applied to `correctPieceSquare`, not all valid targets.
- **Puzzle count:** 8 puzzles ordered by difficulty (difficulty 1 first, then difficulty 2). All 8 must be completed.
- **Instruction key:** `chessGame.ui.tapToCapture` — target piece name displayed in Hebrew using piece's `translationKey`.
- **Final level completion:** `completeLevel(3)`, then enhanced screen showing "Level Complete!" + "You learned chess!" message. Auto-returns to map after timeout.
- **Level 3 is replayable** — same as Levels 1 and 2.
- **Component location:** `app/[locale]/games/chess-game/CapturePuzzle.tsx`
- **Integration point:** `ChessGameContent.tsx` — replace placeholder for `currentView === 'level-3'` with dynamically imported `CapturePuzzle`.

### Claude's Discretion

- Exact CSS for the red/orange ring on the target square
- Whether to animate the correct piece sliding to capture the target
- "You learned chess!" text styling and positioning
- Transition between puzzles
- How distractor pieces are visually distinguished from the correct piece before hints

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAPT-01 | User sees multiple pieces on board and identifies which piece can capture a target | `CapturePuzzle` data already has `targetSquare`, `correctPieceSquare`, `distractorSquares`; board renders all FEN pieces; click handler discriminates by square type |
| CAPT-02 | Correct captures are celebrated with animation and sound | `playRandomCelebration()` + `react-confetti` pattern identical to MovementPuzzle; `completeLevel(3)` + `playSound(AudioSounds.CELEBRATION)` for final level |
| CAPT-03 | Wrong selections get gentle feedback with hint after 2 attempts | `showTryAgain` / `wrongTapCount` / `showHints` state machine from MovementPuzzle reused; hint shows green glow on `correctPieceSquare` |
| CAPT-04 | Capture puzzles use curated FEN positions (static JSON, not generated) | All 8 puzzles already in `capturePuzzles` array in `data/chessPuzzles.ts`; ordered by difficulty field |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-chessboard | 5.10.0 | Board rendering + square click events | Established in Phase 2; direct `Chessboard` import (not wrapper) per Phase 5 decision |
| react-confetti | 6.4.0 | Per-puzzle correct burst + level complete | Already used in MovementPuzzle and PieceIntroduction |
| next-intl | 4.7.0 | `useTranslations('chessGame')` | All i18n keys in messages/{he,en,ru}.json |
| @mui/material | 7.3.7 | Box, Typography layout | Existing component library |
| next/dynamic | built-in | SSR-safe import for CapturePuzzle | Same pattern as MovementPuzzle — react-chessboard is SSR-unsafe |

**Installation:** None required. All dependencies are already present.

### No Alternatives to Consider

This phase adds no new technology. Every tool decision was made in Phases 2-5.

---

## Architecture Patterns

### File Layout (no new directories)

```
app/[locale]/games/chess-game/
├── CapturePuzzle.tsx     ← NEW — this phase's primary deliverable
├── ChessGameContent.tsx  ← MODIFY — replace placeholder, add dynamic import
├── MovementPuzzle.tsx    ← REFERENCE only
└── PieceIntroduction.tsx ← REFERENCE only

data/
└── chessPuzzles.ts       ← READ ONLY — capturePuzzles array already exists

messages/
├── he.json               ← ADD tapToCapture + learnedChess keys
├── en.json               ← ADD same keys
└── ru.json               ← ADD same keys
```

### Pattern 1: Puzzle State Machine (mirrors MovementPuzzle exactly)

**What:** The same `flashType / wrongTapCount / showHints / isAdvancing / isComplete / showCorrectConfetti` state variables.
**When to use:** Every puzzle component in this game.

```typescript
// Source: app/[locale]/games/chess-game/MovementPuzzle.tsx (established pattern)
const [wrongTapCount, setWrongTapCount] = useState(0);
const [showHints, setShowHints] = useState(false);
const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
const [showTryAgain, setShowTryAgain] = useState(false);
const [isAdvancing, setIsAdvancing] = useState(false);
const [isComplete, setIsComplete] = useState(false);
const [showCorrectConfetti, setShowCorrectConfetti] = useState(false);
```

### Pattern 2: Capture Click Handler (key difference from Level 2)

**What:** `onSquareClick` checks if the tapped square is the `correctPieceSquare` or a `distractorSquare`. Empty squares and the target square itself do nothing.

```typescript
// Source: derived from CONTEXT.md specifics and CapturePuzzle data shape
const handleSquareClick = useCallback(
  ({ square }: { square: string }) => {
    if (isAdvancing || isComplete) return;

    const isCorrect = square === puzzle.correctPieceSquare;
    const isDistractor = puzzle.distractorSquares.includes(square);

    if (!isCorrect && !isDistractor) return; // empty square or target — ignore

    if (isCorrect) {
      // celebrate → auto-advance or level complete
    } else {
      // wrong tap: increment wrongTapCount, show try again, maybe show hint
    }
  },
  [isAdvancing, isComplete, puzzle, ...]
);
```

### Pattern 3: Square Styles for Capture Context

**What:** `squareStyles` object built via `useMemo`. Target gets red/orange ring; after 2 wrong taps, correct piece square gets green glow.

```typescript
// Source: derived from MovementPuzzle squareStyles pattern + CONTEXT.md decisions
const squareStyles = useMemo(() => {
  const styles: Record<string, React.CSSProperties> = {};

  // Red/orange ring on the target black piece
  styles[puzzle.targetSquare] = {
    boxShadow: 'inset 0 0 0 4px rgba(220, 60, 0, 0.85)',
    borderRadius: '4px',
  };

  // After 2 wrong taps — green glow on the correct white piece
  if (showHints) {
    styles[puzzle.correctPieceSquare] = {
      boxShadow: 'inset 0 0 0 4px rgba(0, 180, 0, 0.85)',
      borderRadius: '4px',
    };
  }

  // Flash correct square green on success
  if (flashSquare && flashType === 'correct') {
    styles[flashSquare] = { backgroundColor: 'rgba(0, 200, 0, 0.5)' };
  }

  // Flash wrong square orange on wrong tap
  if (flashSquare && flashType === 'wrong') {
    styles[flashSquare] = { backgroundColor: 'rgba(255, 100, 0, 0.4)' };
  }

  return styles;
}, [puzzle.targetSquare, puzzle.correctPieceSquare, showHints, flashSquare, flashType]);
```

**Note on ring style:** `boxShadow: inset` is the right approach for react-chessboard `squareStyles` — it draws inside the square without affecting layout. `outline` does not work reliably inside the board's positioned context. This is Claude's discretion territory; the exact rgba values can be tuned.

### Pattern 4: Puzzle Ordering

**What:** Use `capturePuzzles` sorted by `difficulty` (ascending). All 8 puzzles run in sequence.

```typescript
// Source: data/chessPuzzles.ts — capturePuzzles array has difficulty 1 and 2 entries
const ORDERED_PUZZLES = [...capturePuzzles].sort((a, b) => a.difficulty - b.difficulty);
```

### Pattern 5: Dynamic Import in ChessGameContent

**What:** Same SSR-safe pattern used for MovementPuzzle.

```typescript
// Source: ChessGameContent.tsx line 18 — established pattern
const CapturePuzzle = dynamic(() => import('./CapturePuzzle'), { ssr: false });
```

Then in the render:
```typescript
if (currentView === 'level-3') {
  return <CapturePuzzle onComplete={() => setCurrentView('map')} completeLevel={completeLevel} />;
}
```

The `currentView !== 'map'` fallback block currently catches `level-3` and shows "Coming soon...". Removing that catch-all is safe because `level-3` will now be handled before reaching it.

### Pattern 6: Enhanced Final Level Completion Screen

**What:** Level 3 is the last level. The completion screen adds a "You learned chess!" line beneath "Level Complete!" — same confetti, same auto-return timing (3s), same `playSound(AudioSounds.CELEBRATION)`.

```typescript
// Source: MovementPuzzle.tsx level-complete screen + CONTEXT.md decisions
if (isComplete) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '100vh', gap: 3 }}>
      <Confetti recycle={false} numberOfPieces={300} />
      <Typography sx={{ fontSize: 96, lineHeight: 1 }}>&#x2605;</Typography>
      <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', px: 2 }}>
        {t('ui.levelComplete')}
      </Typography>
      <Typography variant="h5" sx={{ textAlign: 'center', px: 2, color: 'success.main' }}>
        {t('ui.learnedChess')}
      </Typography>
    </Box>
  );
}
```

### Pattern 7: Translation Key Addition

**What:** Two new keys needed in all three locale files.

| Key | He | En | Ru |
|-----|----|----|-----|
| `chessGame.ui.tapToCapture` | `"איזה כלי יכול לתפוס את ה{piece}? לחץ עליו!"` | `"Which piece can capture the {piece}? Tap it!"` | `"Какая фигура может взять {piece}? Нажми на неё!"` |
| `chessGame.ui.learnedChess` | `"למדת שחמט!"` | `"You learned chess!"` | `"Ты выучил шахматы!"` |

Note: The existing `chessGame.ui.whichCaptures` key already exists (`"מי יכול לתפוס?"`) but is too short for the full instruction. The CONTEXT.md decision specified using `chessGame.ui.tapToCapture` — a new, more descriptive key with a `{piece}` interpolation parameter matching the `tapToMove` pattern.

### Anti-Patterns to Avoid

- **Do not use `chess.js` for capture validation**: The CapturePuzzle data is hand-curated. The component should trust `correctPieceSquare` directly — no runtime legal-move calculation needed. chess.js is only used in the free-play board (Phase 2 code), not in puzzle mode.
- **Do not import `ChessBoardDynamic.tsx` wrapper**: That wrapper auto-executes moves via chess.js. Puzzle mode uses direct `Chessboard` from `react-chessboard`. Established in Phase 5 decision log.
- **Do not call `completeLevel` multiple times**: Guard with `isAdvancing` flag before setting it, identical to MovementPuzzle.
- **Do not add ResizeObserver boilerplate twice**: Copy the containerRef + ResizeObserver boardWidth pattern from MovementPuzzle verbatim — it handles tablet sizing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Board rendering | Custom SVG board | `Chessboard` from react-chessboard | Already installed; handles piece images, square sizing, orientation |
| Capture validity | Chess.js `moves()` | Trust `puzzle.correctPieceSquare` from data | Puzzles are hand-curated; runtime calculation adds complexity with no benefit |
| Celebration confetti | Custom animation | `react-confetti` (already imported) | Established pattern; same visual as Levels 1 and 2 |
| Progress persistence | Custom storage | `useChessProgress` hook via `completeLevel` prop | Already handles localStorage, dedup, and level unlocking |
| i18n string interpolation | String concatenation | `t('ui.tapToCapture', { piece: pieceName })` | next-intl handles RTL/LTR-safe interpolation |

---

## Common Pitfalls

### Pitfall 1: Tapping the Target Square
**What goes wrong:** Player taps the highlighted black piece instead of tapping a white piece. If the handler doesn't guard for `square === puzzle.targetSquare`, it may fall through to the wrong-tap branch.
**Why it happens:** The target square is visually prominent (red ring), and young children may tap it.
**How to avoid:** In `handleSquareClick`, explicitly ignore `puzzle.targetSquare` — return early before the correct/distractor check. This matches the CONTEXT.md decision: "Tapping empty squares does nothing."
**Warning signs:** Test by clicking the target — should produce no feedback.

### Pitfall 2: Hint Logic Targets Wrong Square
**What goes wrong:** Copying hint logic from MovementPuzzle and forgetting to change it from "all `validTargets`" to just `correctPieceSquare`.
**Why it happens:** MovementPuzzle's hint shows ALL valid destination squares. CapturePuzzle's hint shows the SINGLE correct white piece.
**How to avoid:** The `showHints` branch in `squareStyles` should only apply style to `puzzle.correctPieceSquare` — not to any array of squares.

### Pitfall 3: Dynamic Import Timing Race
**What goes wrong:** `CapturePuzzle` renders before the dynamic import resolves — shows blank screen briefly.
**Why it happens:** `next/dynamic` with `ssr: false` defers loading to client.
**How to avoid:** Acceptable behavior — same as MovementPuzzle. No special handling needed. The level map screen covers the loading time.

### Pitfall 4: FEN Piece Detection
**What goes wrong:** The FEN in `capturePuzzles` uses lowercase for black pieces (target) and uppercase for white pieces (capturer). The component doesn't need to parse FEN — `squareStyles` for visual cues and `onSquareClick` handler logic are driven entirely by the puzzle data fields, not by parsing the FEN string.
**Why it happens:** Developers may try to infer piece color from FEN rather than trusting the data model.
**How to avoid:** Trust `correctPieceSquare` and `distractorSquares` from the puzzle object. Never parse FEN in the component.

### Pitfall 5: Translation Key Missing in One Locale
**What goes wrong:** `tapToCapture` or `learnedChess` added to he.json and en.json but forgotten in ru.json (or vice versa). next-intl will fall back silently or throw in strict mode.
**Why it happens:** Three files to update manually.
**How to avoid:** Update all three locale files in one task. Add both keys in one edit pass.

---

## Code Examples

### Verified: Puzzle Data Shape (from data/chessPuzzles.ts)

```typescript
// Source: /Users/emil/code/lepdy/data/chessPuzzles.ts lines 12-20
export interface CapturePuzzle {
  id: string;
  fen: string;
  targetSquare: string;       // the black piece to be captured
  correctPieceSquare: string; // the one white piece that can capture
  correctPieceId: ChessPieceId;
  distractorSquares: string[]; // other white pieces that cannot capture target
  difficulty: 1 | 2 | 3;
}
```

There are 8 puzzles: 6 at difficulty 1 (one distractor each), 2 at difficulty 2 (two distractors each).

### Verified: ChessGameContent placeholder to replace (lines 95-113)

```typescript
// Source: /Users/emil/code/lepdy/app/[locale]/games/chess-game/ChessGameContent.tsx
// Lines 95-114: the catch-all for non-map views currently handles level-3 as "Coming soon"
// This entire block must be replaced by:
if (currentView === 'level-3') {
  return <CapturePuzzle onComplete={() => setCurrentView('map')} completeLevel={completeLevel} />;
}
// The catch-all block below can then be safely removed (no other views exist)
```

### Verified: Existing translation keys (do not duplicate)

```json
// Source: messages/he.json — chessGame.ui section (already present)
"whichCaptures": "מי יכול לתפוס?",
"levelComplete": "השלב הושלם!"
// Need to ADD:
"tapToCapture": "איזה כלי יכול לתפוס את ה{piece}? לחץ עליו!",
"learnedChess": "למדת שחמט!"
```

### Verified: ResizeObserver pattern (copy verbatim from MovementPuzzle)

```typescript
// Source: MovementPuzzle.tsx lines 45-56
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

### Verified: completeLevel call for final level

```typescript
// Source: MovementPuzzle.tsx lines 88-93 (Level 2 pattern)
completeLevel(2);  // → becomes completeLevel(3) in CapturePuzzle
playSound(AudioSounds.CELEBRATION);
setIsComplete(true);
setTimeout(() => onComplete(), 3000);
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright Test 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single worker, Chromium only) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CAPT-01 | Level 3 renders board with multiple pieces and puzzle progress | E2E smoke | `npm test -- --grep "capture"` | ❌ Wave 0 |
| CAPT-02 | Correct piece tap triggers confetti and auto-advances | E2E | `npm test -- --grep "capture"` | ❌ Wave 0 |
| CAPT-03 | Wrong tap shows try-again text; hint appears after 2 wrong taps | E2E | `npm test -- --grep "capture"` | ❌ Wave 0 |
| CAPT-04 | Implicitly verified by data existing in chessPuzzles.ts | Static data | n/a — data already present and typed | ✅ exists |

### Sampling Rate

- **Per task commit:** `npm run lint` (fast, catches TypeScript errors)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Add `test.describe('Chess capture puzzles', ...)` block to `e2e/app.spec.ts` — covers CAPT-01, CAPT-02, CAPT-03
  - Test: Level 3 accessible when levels 1 and 2 completed (localStorage seed)
  - Test: Puzzle progress counter shows "1 / 8"
  - Test: Wrong tap on distractor square shows try-again text
  - Test: Completing all 8 puzzles returns to map with Level 3 completed indicator

---

## Open Questions

1. **Piece name interpolation in tapToCapture**
   - What we know: `correctPieceId` identifies the target piece type (e.g., `'rook'`). The instruction should say the target piece name in Hebrew.
   - What's unclear: CONTEXT.md says "target piece name in Hebrew" — this refers to the *black* piece being attacked, not the white piece doing the capturing. The `correctPieceId` field names the *white* piece. The puzzles currently have no `targetPieceId` field. All current difficulty-1 puzzles target pawns or matching pieces — `capture-rook-1` targets a black pawn at `a5` not a rook.
   - Recommendation: Derive target piece from FEN parsing at the `targetSquare`, OR add a `targetPieceId` field to the `CapturePuzzle` interface in `chessPuzzles.ts`. The second option is cleaner. This is a small data-layer addition that the planner should include as a task. Alternatively, if the instruction is generic ("Tap the piece that can capture!") without naming the target piece, no field is needed — but CONTEXT.md specified "target piece name in Hebrew."

2. **Puzzle progress label**
   - What we know: MovementPuzzle shows "3 / 18" (overall) + piece group label. CapturePuzzle has 8 puzzles and no piece-type grouping.
   - What's unclear: Whether to show "1 / 8" or something else above the board.
   - Recommendation: Show "1 / 8" as overall progress (simple, consistent). No group label needed — capture puzzles don't group by piece type.

---

## Sources

### Primary (HIGH confidence)

- Direct file reads of `MovementPuzzle.tsx`, `ChessGameContent.tsx`, `useChessProgress.ts`, `data/chessPuzzles.ts`, `messages/{he,en,ru}.json` — all implementation patterns verified from source
- `e2e/app.spec.ts` — existing test patterns for chess levels (data-testid conventions confirmed)
- `.planning/STATE.md` — Phase 5 decisions confirmed (direct import, ssr:false, no WRONG_ANSWER sound)

### Secondary (MEDIUM confidence)

- CONTEXT.md Phase 6 discussion — all interaction decisions locked by user

### No External Sources Required

This phase extends existing internal code. No library documentation lookup needed — all APIs already demonstrated in Phases 2-5.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all libraries verified in use
- Architecture: HIGH — patterns copied directly from MovementPuzzle source
- Pitfalls: HIGH — derived from code inspection and data model analysis
- Translation strings: MEDIUM — Hebrew/Russian phrasing for new keys is suggested; native speaker should verify before release (existing concern from Phase 1)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack; no fast-moving dependencies)
