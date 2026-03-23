# Phase 21: Checkmate Puzzle Data + Renderers — Research

**Researched:** 2026-03-23
**Domain:** Chess puzzle data authoring, chess.js validation, React puzzle component patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- `CheckmatePuzzle` interface: `id`, `fen` (full 6-field FEN), `correctMove` (algebraic e.g. "Qh7"), `matingPieceId`, `difficulty: 1|2|3`
- ~4-5 positions per mating piece type (queen, rook, bishop, knight) = 20+ total
- Build-time validation script using `chess.js` `isCheckmate()` — apply each move, fail build if invalid
- Full FEN format (all 6 fields) required for chess.js move validation and checkmate detection
- New `CheckmatePuzzle.tsx` following same pattern as `MovementPuzzle.tsx` and `CapturePuzzle.tsx`
- Two-tap interaction: tap mating piece first, then tap target square — matches existing capture puzzle UX
- Checkmate confirmation: "שח מט!" text + confetti burst + celebration sound (reuse existing patterns)
- Wrong move feedback: shake animation + wrong sound + board reset — same as existing wrong-answer pattern
- Instruction text displayed above the board as a styled Typography banner
- Hebrew text: "שימו את המלך בשח מט במהלך אחד" ("Put the king in checkmate in one move")
- Standalone component for now — Phase 22 wires checkmate into sessions
- 3 difficulty tiers: tier 1 (obvious mates), tier 2 (one defender to navigate), tier 3 (multiple defenders)

### Claude's Discretion

No items deferred to Claude's discretion — all grey areas resolved by user.

### Deferred Ideas (OUT OF SCOPE)

None.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MATE-01 | User can solve checkmate-in-1 puzzles ("find the move that checkmates") | Two-tap interaction in CheckmatePuzzle.tsx follows CapturePuzzle.tsx pattern exactly; chess.js `isCheckmate()` used for correctness detection |
| MATE-02 | At least 20 curated mate-in-1 positions validated by chess.js across multiple piece types | 20 positions pre-validated in this research: 5 queen, 5 rook, 5 bishop, 5 knight — all verified with unique mating moves |
</phase_requirements>

---

## Summary

Phase 21 adds two things: (1) a validated dataset of 20 mate-in-1 chess positions covering four piece types, and (2) a `CheckmatePuzzle.tsx` component that renders them with the two-tap interaction and checkmate feedback already established in the codebase.

The most significant research contribution is the **pre-validated puzzle data**. All 20 positions were verified using chess.js in this research session — each position confirms `isCheck() === false` (valid starting state), exactly one legal mating move exists (`moves().filter('#').length === 1`), and that move passes `isCheckmate() === true` after execution. The validation script the planner will create does nothing novel — it replicates exactly what was done here.

The component design is fully constrained by CONTEXT.md. `CheckmatePuzzle.tsx` is structurally identical to `CapturePuzzle.tsx`: two-tap flow (select piece → select target), flash feedback, confetti on correct, try-again on wrong. The only new element is the "שח מט!" confirmation banner and the `matingPieceId` field in the data interface (which tells the component which white piece the player should tap first).

**Primary recommendation:** Author the 20 validated positions directly into `chessPuzzles.ts`, add the `CheckmatePuzzle` interface alongside existing interfaces, and build `CheckmatePuzzle.tsx` by copying `CapturePuzzle.tsx` and adapting the interaction model — tap mating piece square first, then tap target square, and on success call `chess.js` to confirm checkmate.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chess.js | 1.4.0 | Move validation, `isCheckmate()`, FEN parsing | Already installed; used throughout chess game |
| react-chessboard | (installed) | Board rendering with `Chessboard` + `options.onSquareClick` | Same board component as all other puzzle types |
| react-confetti | 6.4.0 | Confetti burst on checkmate confirmation | Same pattern as CapturePuzzle correct-answer feedback |
| @mui/material | 7.3.7 | Typography, Box, IconButton layout | Project standard |
| next-intl | 4.7.0 | `useTranslations('chessGame')` for instruction text | Same as all chess components |

**Installation:** No new packages required.

---

## Architecture Patterns

### Data File Structure

`CheckmatePuzzle` interface goes in `data/chessPuzzles.ts` alongside the existing `MovementPuzzle` and `CapturePuzzle` interfaces:

```typescript
// Source: data/chessPuzzles.ts (existing file pattern)
export interface CheckmatePuzzle {
  id: string;
  fen: string;               // Full 6-field FEN (required for chess.js)
  correctMove: string;       // SAN without '#', e.g. "Qe8" — chess.js normalizes
  matingPieceId: ChessPieceId;
  matingPieceSquare: string; // Starting square of mating piece (e.g. "e1")
  targetSquare: string;      // Destination square (e.g. "e8")
  difficulty: 1 | 2 | 3;
}
```

The `matingPieceSquare` and `targetSquare` fields enable the two-tap UX directly — the component highlights `matingPieceSquare` on first tap and validates `targetSquare` on second tap. This mirrors how `CapturePuzzle` uses `correctPieceSquare` + `targetSquare`.

### Component Structure

`CheckmatePuzzle.tsx` follows `CapturePuzzle.tsx` exactly:

```typescript
// Source: app/[locale]/games/chess-game/CapturePuzzle.tsx (existing pattern)
interface CheckmatePuzzleProps {
  puzzle: CheckmatePuzzleData;
  onAnswer: (correct: boolean) => void;
  onExit: () => void;
}
```

State variables are identical: `selectedPieceSquare`, `isAdvancing`, `flashSquare`, `flashType`, `showTryAgain`, `showCorrectConfetti`, `displayFen`, `boardWidth`.

### Two-Tap Interaction Model

```
Tap 1: Any square
  - If square === puzzle.matingPieceSquare → highlight piece (yellow glow)
  - Else → ignore (no feedback — kids learn by trying)

Tap 2 (after piece selected): Any square
  - If square === puzzle.targetSquare → correct!
    → animate piece move, show "שח מט!", confetti, playRandomCelebration()
    → setTimeout 1500ms → onAnswer(true)
  - Else → wrong
    → flash orange, show "נסו שוב!", playSound(WRONG_ANSWER)
    → reset selection state
    → onAnswer(false)
```

This two-tap model is the locked decision from CONTEXT.md and directly mirrors the capture puzzle flow.

### Validation Script Pattern

```typescript
// scripts/validateCheckmatePuzzles.ts (new file)
import { Chess } from 'chess.js';
import { checkmatePuzzles } from '../data/chessPuzzles';

let failed = 0;
for (const puzzle of checkmatePuzzles) {
  const chess = new Chess(puzzle.fen);
  if (chess.isCheck()) { console.error('INVALID: already in check', puzzle.id); failed++; continue; }
  const mates = chess.moves({ verbose: true }).filter(m => m.san.includes('#'));
  if (mates.length !== 1) { console.error('NOT_UNIQUE:', puzzle.id, mates.length + ' mates'); failed++; continue; }
  chess.move({ from: puzzle.matingPieceSquare, to: puzzle.targetSquare });
  if (!chess.isCheckmate()) { console.error('NOT_CHECKMATE:', puzzle.id); failed++; }
}
if (failed > 0) process.exit(1);
console.log('All', checkmatePuzzles.length, 'puzzles valid');
```

Run with: `npx ts-node scripts/validateCheckmatePuzzles.ts`

### Anti-Patterns to Avoid

- **Using piece-placement FEN only:** Existing `MovementPuzzle`/`CapturePuzzle` use partial FEN (piece placement only). `CheckmatePuzzle` MUST use full 6-field FEN (includes side to move, castling rights, en passant, halfmove, fullmove). `chess.js` `isCheckmate()` requires the full FEN to know whose turn it is.
- **Reusing `moveFenPiece` from chessFen.ts:** `moveFenPiece` is a simple string manipulator used for animation. For checkmate detection, use `new Chess(puzzle.fen).move()` — it understands captures, en passant, promotions.
- **Calling `chess.js` in the component for validation:** Validation belongs in the data script, not the React component. The component only needs to animate the board and call `onAnswer`. Trust the validated data.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Move legality checking | Custom move validator | `chess.js move()` throws on illegal move | chess.js handles all edge cases (captures, discovered checks, double-check) |
| Checkmate detection | Manual king-escape counting | `chess.js isCheckmate()` | 27 edge cases including en passant and castling blockers |
| Board position animation | String-replace FEN manually | `moveFenPiece()` from `@/utils/chessFen` (existing util) | Already handles all existing puzzle animations |
| Hebrew checkmate text | Custom copy | Add translation key to `messages/{he,en,ru}.json` | Existing i18n pattern handles RTL rendering automatically |

---

## Pre-Validated Puzzle Data

All 20 positions verified with chess.js in this research session. Each satisfies:
1. `isCheck() === false` (valid, non-check starting position)
2. Exactly ONE legal mating move (`moves().filter('#').length === 1`)
3. `isCheckmate() === true` after applying the mating move

### Queen Puzzles (5)

| ID | FEN | Move | From→To | Difficulty | Pattern |
|----|-----|------|---------|------------|---------|
| mate-queen-1 | `6k1/5ppp/8/8/8/8/8/4Q1K1 w - - 0 1` | Qe8# | e1→e8 | 1 | Back rank, queen slides up open file |
| mate-queen-2 | `6k1/6p1/6Kp/8/8/8/8/7Q w - - 0 1` | Qa8# | h1→a8 | 1 | Long diagonal, queen sweeps corner |
| mate-queen-3 | `1k6/8/K1Q5/8/8/8/8/8 w - - 0 1` | Qb7# | c6→b7 | 2 | Queen slides laterally, king and queen box in corner |
| mate-queen-4 | `3r2k1/4Qppp/8/8/8/8/8/6K1 w - - 0 1` | Qxd8# | e7→d8 | 2 | Queen captures defending rook to deliver back-rank mate |
| mate-queen-5 | `6k1/6pp/6Qp/8/8/8/8/6K1 w - - 0 1` | Qe8# | g6→e8 | 3 | Queen steps back to deliver back-rank mate through multiple pawns |

### Rook Puzzles (5)

| ID | FEN | Move | From→To | Difficulty | Pattern |
|----|-----|------|---------|------------|---------|
| mate-rook-1 | `6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1` | Ra8# | a1→a8 | 1 | Classic back-rank, rook slides to 8th rank |
| mate-rook-2 | `r5k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1` | Rxa8# | a1→a8 | 1 | Back rank with capture of defending rook |
| mate-rook-3 | `5k2/7R/5K2/8/8/8/8/8 w - - 0 1` | Rh8# | h7→h8 | 2 | Rook endgame, push to 8th rank with king support |
| mate-rook-4 | `5k2/4pppp/8/8/8/8/8/3R3K w - - 0 1` | Rd8# | d1→d8 | 2 | Back rank through pawn barrier, d-file |
| mate-rook-5 | `k7/2R5/K7/8/8/8/8/8 w - - 0 1` | Rc8# | c7→c8 | 3 | Rook steps forward to trap king in corner with king control |

### Bishop Puzzles (5)

| ID | FEN | Move | From→To | Difficulty | Pattern |
|----|-----|------|---------|------------|---------|
| mate-bishop-1 | `k7/8/KR6/1B6/8/8/8/8 w - - 0 1` | Bc6# | b5→c6 | 1 | Bishop + Rook corner trap: bishop steps to diagonal covering escape |
| mate-bishop-2 | `7k/8/6RK/6B1/8/8/8/8 w - - 0 1` | Bf6# | g5→f6 | 1 | Mirror of B1 on h-file corner |
| mate-bishop-3 | `k7/8/KR6/8/2B5/8/8/8 w - - 0 1` | Bd5# | c4→d5 | 2 | Bishop approaches from farther away, same corner trap |
| mate-bishop-4 | `7k/8/6RK/8/5B2/8/8/8 w - - 0 1` | Be5# | f4→e5 | 2 | Mirror of B3, h-file corner |
| mate-bishop-5 | `7k/8/6RK/8/8/4B3/8/8 w - - 0 1` | Bd4# | e3→d4 | 3 | Bishop travels longer diagonal to deliver corner trap |

### Knight Puzzles (5)

| ID | FEN | Move | From→To | Difficulty | Pattern |
|----|-----|------|---------|------------|---------|
| mate-knight-1 | `6rk/5ppp/7N/8/8/8/8/6K1 w - - 0 1` | Nxf7# | h6→f7 | 1 | Classic smothered: king h8 surrounded by own pawns, knight jumps to f7 |
| mate-knight-2 | `5brk/6pp/6pN/8/8/8/8/6K1 w - - 0 1` | Nf7# | h6→f7 | 2 | Smothered with bishop f8, pawn g6 |
| mate-knight-3 | `5rkr/5ppp/6N1/8/8/8/8/6K1 w - - 0 1` | Ne7# | g6→e7 | 1 | Arabesque variant: knight jumps to e7 covering g8 |
| mate-knight-4 | `6nk/5ppp/7N/8/8/8/8/6K1 w - - 0 1` | Nxf7# | h6→f7 | 2 | Smothered with black knight on g8 |
| mate-knight-5 | `5rkr/4pppp/8/5N2/8/8/8/6K1 w - - 0 1` | Nxe7# | f5→e7 | 3 | Knight captures e7 pawn to deliver mate with rook g8 and rook h8 |

---

## Common Pitfalls

### Pitfall 1: Partial FEN breaks chess.js validation

**What goes wrong:** Using piece-placement-only FEN (like existing movement/capture puzzles) causes `chess.js` to default to white to move on rank 1, not matching the intended position. `isCheckmate()` may return false even for a valid mate.
**Why it happens:** `MovementPuzzle` and `CapturePuzzle` use 8-rank piece-placement FEN only (e.g. `8/8/3R4/8/8/8/8/8`). `chess.js` can parse this but it sets side-to-move to white by default, which may not reflect the position.
**How to avoid:** Always use full 6-field FEN: `<pieces> w - - 0 1` for all `CheckmatePuzzle` entries. The research validates all 20 positions with full FEN.
**Warning signs:** Validation script passes but `isCheckmate()` returns false at runtime.

### Pitfall 2: Multiple mating moves invalidate the puzzle

**What goes wrong:** A position has 2+ mating moves. Any tap on the "correct" target square succeeds, but tapping a different mating target is incorrectly marked wrong.
**Why it happens:** Board positions with an open queen often have several mating moves (all queen moves along a file, all capture variants, etc.).
**How to avoid:** Every puzzle in the validated dataset was constructed to have EXACTLY ONE mating move. The validation script checks `moves().filter('#').length === 1` and fails if not exactly 1.
**Warning signs:** Validation script reports `NOT_UNIQUE` for any puzzle.

### Pitfall 3: Starting position is already in check

**What goes wrong:** `chess.js` considers the puzzle's starting position legal but the black king is already in check. The "find the checkmate move" instruction is confusing — the player may think any check continuation is the answer.
**Why it happens:** Manual FEN composition often places pieces without checking if the black king is currently in check from an existing white piece.
**How to avoid:** Validation script checks `chess.isCheck() === false` before evaluating mates. All 20 positions were validated as non-check starting positions.
**Warning signs:** Validation reports `INVALID: already in check`.

### Pitfall 4: `moveFenPiece` used for checkmate detection

**What goes wrong:** `moveFenPiece` (existing utility) moves a piece in the FEN string for animation purposes. It does not understand captures — if the mating move captures a piece, `moveFenPiece` leaves both pieces on the board.
**Why it happens:** `CapturePuzzle` uses `moveFenPiece` for the board animation after correct tap. The checkmate puzzle also captures (e.g. Rxa8#, Qxd8#).
**How to avoid:** Use `new Chess(puzzle.fen).move({ from, to }).after` or `chess.fen()` after the move for the animation FEN, not `moveFenPiece`. Alternatively: use `moveFenPiece` only for display animation (the rook visually "captures" by overwriting), which is acceptable for cosmetic purposes. The correctness check uses `chess.js`, not FEN comparison.

---

## Code Examples

### Adding translation key for checkmate instruction

```json
// Source: messages/{he,en,ru}.json — add under "chessGame.ui"
"chessmate": "שח מט!",
"tapToCheckmate": "שימו את המלך בשח מט במהלך אחד"
```

English: `"chessmate": "Checkmate!", "tapToCheckmate": "Put the king in checkmate in one move"`
Russian: `"chessmate": "Мат!", "tapToCheckmate": "Поставьте королю мат за один ход"`

### chess.js move validation in CheckmatePuzzle component

```typescript
// Source: verified in research via chess.js@1.4.0
const handleTap = (square: string) => {
  if (!selectedPiece) {
    // Tap 1: select the mating piece
    if (square === puzzle.matingPieceSquare) {
      setSelectedPiece(square);
    }
    return;
  }
  // Tap 2: select target
  if (square === puzzle.targetSquare) {
    // Correct — use chess.js to verify (belt-and-suspenders)
    const chess = new Chess(puzzle.fen);
    const move = chess.move({ from: puzzle.matingPieceSquare, to: puzzle.targetSquare });
    if (move && chess.isCheckmate()) {
      // Correct path
      setIsAdvancing(true);
      // animate move, show שח מט!, confetti
      setTimeout(() => onAnswer(true), 1500);
    }
  } else if (square !== puzzle.matingPieceSquare) {
    // Wrong target
    onAnswer(false);
    // shake + wrong sound + reset selection
  }
};
```

Note: The chess.js validation in the component is a belt-and-suspenders check — the data is already validated. The component could skip it and trust the data.

### chess.js move() accepts both SAN and {from, to} formats

```javascript
// Source: verified in research — chess.js@1.4.0
const chess = new Chess(fen);
chess.move('Qe8');           // SAN without '#' — works, normalizes to 'Qe8#'
chess.move({ from: 'e1', to: 'e8' }); // {from, to} — works identically
chess.isCheckmate();         // true for valid checkmate positions
```

The `#` suffix in SAN is optional for `chess.move()`. The component should use `{ from, to }` format since it has explicit square coordinates from the two-tap interaction.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-tap puzzle interaction | Two-tap: piece select then target | Established in CapturePuzzle (prior phase) | Matches user mental model for checkmate |
| Hand-authored FEN validation | chess.js build-time validation script | This phase | Eliminates silent data errors |

---

## Open Questions

1. **Hebrew grammatical correctness of "שימו את המלך בשח מט במהלך אחד"**
   - What we know: The phrase is grammatically formed and understandable
   - What's unclear: Whether it's the most natural phrasing for ages 5-9 in Hebrew (gender agreement, register)
   - Recommendation: Flag for native-speaker review before phase ships (noted in STATE.md blockers). Use this text in implementation; mark as pending review in a code comment.

2. **Validation script placement (npm script vs CI vs ad-hoc)**
   - What we know: The script should run at build time to fail the build on bad data
   - What's unclear: Whether to add it to `package.json` scripts or only run manually
   - Recommendation: Add as `npm run validate:puzzles` entry in `package.json`. The planner can decide whether to hook into `npm run build`.

---

## Environment Availability

Step 2.6: Environment Availability Audit result — no new external dependencies identified. All tools required (Node.js, chess.js, TypeScript, next-intl) are already installed and confirmed working.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| chess.js | Puzzle validation, runtime checkmate detection | Yes | 1.4.0 | — |
| TypeScript | Validation script (`ts-node`) | Yes | 5.x | Run as .js with `node` |
| Playwright | E2E tests | Yes | 1.57.0 | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "checkmate"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATE-01 | CheckmatePuzzle component renders puzzle board and instruction | smoke | `npm test -- --grep "checkmate puzzle"` | No — Wave 0 |
| MATE-01 | Two-tap interaction: correct tap sequence triggers checkmate confirmation | smoke | `npm test -- --grep "checkmate correct"` | No — Wave 0 |
| MATE-01 | Wrong tap resets selection and shows try-again | smoke | `npm test -- --grep "checkmate wrong"` | No — Wave 0 |
| MATE-02 | 20 puzzle data entries exist in chessPuzzles.ts | unit | `npx ts-node scripts/validateCheckmatePuzzles.ts` | No — Wave 0 |
| MATE-02 | Each puzzle has unique chess.js-verified mating move | unit | `npx ts-node scripts/validateCheckmatePuzzles.ts` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run lint` (fast, catches TypeScript errors in data file)
- **Per wave merge:** `npm test` (full E2E suite)
- **Phase gate:** Full suite green + `npx ts-node scripts/validateCheckmatePuzzles.ts` passes before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `e2e/app.spec.ts` — add "checkmate puzzle" test block (MATE-01 smoke tests)
- [ ] `scripts/validateCheckmatePuzzles.ts` — data validation script (MATE-02)

---

## Sources

### Primary (HIGH confidence)

- chess.js@1.4.0 — verified via `node -e` execution: `move()`, `isCheckmate()`, `isCheck()`, `moves({ verbose: true })`, `{from, to}` format
- All 20 puzzle positions — verified programmatically in this research session (chess.js runtime, not training data)
- `app/[locale]/games/chess-game/CapturePuzzle.tsx` — read directly, component pattern extracted
- `app/[locale]/games/chess-game/MovementPuzzle.tsx` — read directly, confirms identical state structure
- `data/chessPuzzles.ts` — read directly, interface pattern confirmed
- `messages/he.json` chessGame section — read directly, existing translation key structure confirmed

### Secondary (MEDIUM confidence)

- Hebrew phrase "שימו את המלך בשח מט במהלך אחד" — formed from known chess vocabulary; pending native-speaker review

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all verified in-repo
- Architecture: HIGH — direct reading of CapturePuzzle.tsx and MovementPuzzle.tsx; locked by CONTEXT.md
- Puzzle data: HIGH — all 20 positions verified via chess.js runtime execution
- Pitfalls: HIGH — all pitfalls confirmed by direct testing during validation
- Hebrew text: MEDIUM — grammatically reasonable, pending native-speaker sign-off

**Research date:** 2026-03-23
**Valid until:** Stable (chess.js@1.4.0 pinned; no external services)
