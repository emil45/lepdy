# Phase 5: Level 2 — Movement Puzzles - Research

**Researched:** 2026-03-22
**Domain:** React interactive puzzle UI, chess.js FEN validation, MUI feedback animation patterns
**Confidence:** HIGH

## Summary

Phase 5 builds the Movement Puzzle gameplay for the chess learning game. A child sees a single piece on an empty board, taps where it can move, and receives immediate feedback. The core technical work is a new `MovementPuzzle` component that wires together already-existing pieces: `ChessBoardDynamic`, `chessPuzzles.ts` data, the `squareStyles` highlight system from `ChessBoard`, `playSound`/`playRandomCelebration` from audio utils, and the `completeLevel` prop pattern established by `PieceIntroduction`.

The phase is largely about composition, not invention. All primitive building blocks exist and are verified working. The main new logic is: (1) puzzle state machine (idle → tapped-correct → tapped-wrong → hinted), (2) a custom `onSquareClick` handler in `MovementPuzzle` that checks against `validTargets` from puzzle data rather than deferring to chess.js legal moves, and (3) level completion after all 18 puzzles are finished.

**Primary recommendation:** Build `MovementPuzzle` as a self-contained component that owns its own puzzle index, wrong-tap counter, and feedback state. Pass `initialFen` and custom `squareStyles` to `ChessBoardDynamic` — do not use `ChessBoard`'s internal `useChessGame` for move execution. Intercept `onSquareClick` at the `MovementPuzzle` level and compare against `validTargets`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Puzzles grouped by piece type in INTRO-04 order (King, Rook, Bishop, Queen, Knight, Pawn) — within each piece, sorted by difficulty
- All 18 puzzles must be completed to finish Level 2 (3 per piece × 6 pieces, matching MOVE-05)
- Pawn puzzles show forward-only movement (e3/e4 from e2, d5 from d4) — no diagonal capture shown (that's Level 3)
- Step counter "3/18" + piece group label ("Rook 2/3") shows progress within Level 2
- Child taps any valid destination square to answer — reuse ChessBoard's `onSquareClick`. Board highlights the piece's square automatically (no tap-piece-first needed)
- Correct: green flash on tapped square + celebration sound (`playSound(AudioSounds.CELEBRATION)`) + brief confetti burst. Auto-advance to next puzzle after 1.5s
- Wrong: square briefly turns red/orange + gentle "try again" text overlay. No buzzer, no score penalty (FEED-02, MOVE-03). Wrong-tap counter increments for hint logic
- Hints after 2 wrong taps: highlight all valid destination squares with green dots — reuse ChessBoard's `squareStyles` highlight pattern (MOVE-04, FEED-03). Hints stay visible until correct tap
- Same celebration pattern as Level 1 — full confetti + "Level Complete!" + auto-return to map after 3s. `completeLevel(2)` unlocks Level 3
- Level 2 is replayable — tapping the card re-enters from first puzzle
- New `MovementPuzzle` component in chess-game directory, rendered when `currentView === 'level-2'`
- Brief instruction text above board — "Where can the {piece name} move? Tap!" using `chessGame.ui.tapToMove` translation key, showing piece name in Hebrew

### Claude's Discretion
- Exact confetti burst size and duration for correct answers
- Transition animation between puzzles
- "Try again" text positioning and duration
- Whether to show the piece name below the board during puzzles
- Board size during puzzles (likely same 480px max as Phase 2)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOVE-01 | User sees a single piece on an otherwise empty board and taps where it can move | `chessPuzzles.ts` has 18 puzzles with `fen`, `pieceSquare`, `validTargets`; `ChessBoardDynamic` renders FEN |
| MOVE-02 | Correct taps are celebrated with animation and sound | `playSound(AudioSounds.CELEBRATION)`, `playRandomCelebration()`, `react-confetti` all available |
| MOVE-03 | Wrong taps get gentle "try again" feedback (no harsh punishment) | `chessGame.ui.tryAgain` key exists in all 3 locales; `AudioSounds.WRONG_ANSWER` available but NOT used per FEED-02 |
| MOVE-04 | After 2 wrong attempts, a hint highlights valid squares | `squareStyles` green dot pattern in ChessBoard; `wrongTapCount` state controls activation |
| MOVE-05 | Movement puzzles exist for all 6 piece types | All 6 piece types covered in `movementPuzzles` (18 total, 3 each) |
| MOVE-06 | No timer pressure during puzzles | Architecture decision only — no timer state needed |
| FEED-01 | Correct answers trigger celebration animation (stars/sparkles) and cheerful sound | `react-confetti` + `playSound(AudioSounds.CELEBRATION)` — same as PieceIntroduction pattern |
| FEED-02 | Wrong answers show encouraging "try again" message — no buzzer, no score penalty | Use visual text overlay only; do NOT call `playSound(AudioSounds.WRONG_ANSWER)` |
| FEED-03 | Hint system activates after 2 wrong taps on the same puzzle | `wrongTapCount >= 2` triggers `squareStyles` with green dots on `validTargets` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-chessboard | 5.10.0 | Chess board rendering | Already in use; Phase 2 decision locked |
| chess.js | 1.4.0 | Chess logic / FEN validation | Already in use; paired with react-chessboard |
| @mui/material | 7.3.7 | UI components, Box, Typography | Project standard |
| react-confetti | 6.4.0 | Celebration effect | Already installed; used in PieceIntroduction |
| next-intl | 4.7.0 | Translation hook | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `utils/audio.ts` | internal | `playSound`, `playRandomCelebration` | Correct answer feedback |
| `data/chessPuzzles.ts` | internal | Puzzle data (`movementPuzzles`, `getMovementPuzzlesByPiece`) | Puzzle content source |
| `data/chessPieces.ts` | internal | Piece ordering + translation keys | Progress label and instruction text |

**No new npm installs required.** All dependencies are present.

## Architecture Patterns

### Recommended Project Structure
```
app/[locale]/games/chess-game/
├── ChessGameContent.tsx     # Add level-2 branch (replace "Coming soon")
├── MovementPuzzle.tsx       # NEW — owns puzzle state machine
├── PieceIntroduction.tsx    # Existing — reference for level component pattern
└── page.tsx                 # Unchanged
```

### Pattern 1: Level Component Props Contract
**What:** Level components receive `onComplete` and `completeLevel` from parent, own all internal state.
**When to use:** Every level screen (established in Phase 4).
**Example:**
```typescript
// Mirrors PieceIntroduction pattern exactly
interface MovementPuzzleProps {
  onComplete: () => void;
  completeLevel: (levelNum: number) => void;
}

export default function MovementPuzzle({ onComplete, completeLevel }: MovementPuzzleProps) { ... }
```

### Pattern 2: Puzzle Ordering — Piece-Group Sequential
**What:** Sort `movementPuzzles` by piece `order` field (from `chessPieces`), then by `difficulty` within each group. This gives King-1, King-2, King-3, Rook-1, Rook-2, ... Pawn-3 (18 total).
**When to use:** Build the sorted array once at module level or inside a `useMemo`.
**Example:**
```typescript
import { chessPieces } from '@/data/chessPieces';
import { movementPuzzles } from '@/data/chessPuzzles';

const PIECE_ORDER = chessPieces
  .slice()
  .sort((a, b) => a.order - b.order)
  .map(p => p.id);

const ORDERED_PUZZLES = PIECE_ORDER.flatMap(pieceId =>
  movementPuzzles
    .filter(p => p.pieceId === pieceId)
    .sort((a, b) => a.difficulty - b.difficulty)
);
```

### Pattern 3: Custom squareStyles for Puzzle Feedback
**What:** `MovementPuzzle` builds its own `squareStyles` record and passes it directly to `ChessBoardDynamic`. Do NOT rely on `ChessBoard`'s internal `useChessGame` highlight logic — that system is for interactive play, not puzzle tap-checking.

**States to style:**
- Piece square: yellow highlight always (`backgroundColor: 'rgba(255, 255, 0, 0.4)'`)
- Hint squares (after 2 wrong): green dot pattern (same as `useChessGame` legal move dots)
- Correct tap flash: green solid flash on correct square (brief, reset after 1.5s)
- Wrong tap flash: orange/red brief flash on wrong square

**Example:**
```typescript
const squareStyles = useMemo(() => {
  const styles: Record<string, React.CSSProperties> = {};

  // Always highlight the piece square
  styles[puzzle.pieceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };

  // Hint mode — green dots on all valid targets
  if (showHints) {
    for (const sq of puzzle.validTargets) {
      styles[sq] = {
        background: 'radial-gradient(circle, rgba(0,128,0,0.4) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    }
  }

  // Feedback flash (correct or wrong)
  if (flashSquare && flashType === 'correct') {
    styles[flashSquare] = { backgroundColor: 'rgba(0, 200, 0, 0.5)' };
  }
  if (flashSquare && flashType === 'wrong') {
    styles[flashSquare] = { backgroundColor: 'rgba(255, 100, 0, 0.4)' };
  }

  return styles;
}, [puzzle.pieceSquare, showHints, puzzle.validTargets, flashSquare, flashType]);
```

### Pattern 4: Tap Interception Without Chess.js Move Execution
**What:** `MovementPuzzle` must NOT execute chess moves. The puzzle uses FEN only for display. Square tap validation happens against `puzzle.validTargets`, not `chess.js` legal moves.

**Why:** `useChessGame` auto-selects pieces and tries to execute moves when tapping a legal destination. In puzzle mode, we want to check the tap but NOT move the piece.

**Implementation:** Pass a custom `onSquareClick`-equivalent through `ChessBoardDynamic`. However, examining the code: `ChessBoard` already accepts `onSquareClick` internally (via `handleSquareClick` → calls `gameState.selectSquare` → calls `onMove`). The board's internal game loop will try to select the piece square and then execute moves.

**Resolution:** Do NOT use `ChessBoard.tsx` for puzzle mode. Instead render `react-chessboard` `Chessboard` component directly inside `MovementPuzzle`, passing custom `squareStyles` and `onSquareClick` via the `options` prop — bypassing `useChessGame` entirely. This is the correct pattern for a read-only puzzle board.

```typescript
import { Chessboard } from 'react-chessboard';

// In MovementPuzzle render:
<Box sx={{ direction: 'ltr', width: 'fit-content', margin: '0 auto', maxWidth: 480 }}>
  <Chessboard
    options={{
      position: puzzle.fen,
      allowDragging: false,
      onSquareClick: handlePuzzleSquareClick,
      squareStyles,
      boardOrientation: 'white',
      animationDurationInMs: 200,
      boardStyle: { width: `${boardWidth}px`, maxWidth: '480px' },
    }}
  />
</Box>
```

Note: Because `MovementPuzzle` renders `Chessboard` directly (not via `ChessBoardDynamic`), the file must either be wrapped in its own `dynamic()` import in `ChessGameContent`, or `MovementPuzzle` itself must be a dynamic import with `ssr: false`. SSR safety is required (BOARD-06).

### Pattern 5: Puzzle State Machine
**What:** Local state in `MovementPuzzle` tracks the lifecycle per puzzle.

```typescript
const [puzzleIndex, setPuzzleIndex] = useState(0);
const [wrongTapCount, setWrongTapCount] = useState(0);  // resets per puzzle
const [showHints, setShowHints] = useState(false);
const [flashSquare, setFlashSquare] = useState<string | null>(null);
const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
const [isComplete, setIsComplete] = useState(false);   // full Level 2 complete
```

**Correct tap flow:**
1. Flash square green
2. `playRandomCelebration()` (variety, matching Lepdy pattern)
3. Brief confetti burst (`<Confetti recycle={false} numberOfPieces={80} />`)
4. After 1.5s: advance `puzzleIndex`, reset `wrongTapCount`, `showHints`, `flashSquare`
5. If last puzzle: `completeLevel(2)` → `setIsComplete(true)` → `setTimeout(onComplete, 3000)`

**Wrong tap flow:**
1. Flash square orange briefly (clear after ~600ms)
2. Show "try again" text (temporary, ~1.2s OR until next tap)
3. `setWrongTapCount(prev => prev + 1)`
4. If `wrongTapCount + 1 >= 2`: `setShowHints(true)` (stays until correct tap)

### Pattern 6: Progress Label
**What:** Two-part label. Global counter "3 / 18" (puzzleIndex + 1 / total). Piece group label "רץ 2/3" (piece Hebrew name + index within piece group).

```typescript
const puzzle = ORDERED_PUZZLES[puzzleIndex];
const pieceConfig = chessPieces.find(p => p.id === puzzle.pieceId)!;
const piecePuzzles = ORDERED_PUZZLES.filter(p => p.pieceId === puzzle.pieceId);
const indexWithinPiece = piecePuzzles.findIndex(p => p.id === puzzle.id) + 1;
const totalForPiece = piecePuzzles.length; // always 3
```

### Pattern 7: SSR Safety for Chessboard in MovementPuzzle
**What:** `react-chessboard` must not render on the server (BOARD-06). Since `MovementPuzzle` renders `Chessboard` directly, `MovementPuzzle` itself must be imported dynamically in `ChessGameContent`.

```typescript
// In ChessGameContent.tsx — replace static import with dynamic
import dynamic from 'next/dynamic';
const MovementPuzzle = dynamic(() => import('./MovementPuzzle'), { ssr: false });
```

### Pattern 8: Instruction Text Translation Key
**What:** The instruction text "Where can the {piece name} move? Tap!" needs a translation key. Per CONTEXT.md, key is `chessGame.ui.tapToMove`. This key does NOT yet exist in the message files — it must be added in all 3 locales.

**Current state of chessGame.ui keys (verified):**
- `correct` ✅
- `tryAgain` ✅
- `hint` ✅
- `next` ✅
- `back` ✅
- `levelComplete` ✅
- `tapToHear` ✅
- `findSquare` ✅
- `whichCaptures` ✅
- `tapToMove` ❌ MISSING — must be added

**Suggested values:**
- he: `"לאן {piece} יכול ללכת? לחץ!"` (or simpler: `"לאן הכלי זז? לחץ!"`)
- en: `"Where can the {piece} move? Tap!"`
- ru: `"Куда может пойти {piece}? Нажми!"`

Note: If using `next-intl` interpolation for the piece name, the key needs ICU message format: `"Where can the {piece} move? Tap!"` and called as `t('ui.tapToMove', { piece: t(pieceConfig.translationKey) })`.

### Anti-Patterns to Avoid
- **Using `useChessGame` inside `MovementPuzzle`:** The hook auto-selects pieces and executes moves. Puzzle mode requires read-only board display + custom tap logic.
- **Importing `ChessBoard` (not `ChessBoardDynamic`) directly:** SSR crash risk (BOARD-06).
- **Using `AudioSounds.WRONG_ANSWER` for wrong taps:** FEED-02 explicitly prohibits buzzer sound on wrong answers.
- **Not resetting `wrongTapCount` between puzzles:** Counter must reset per puzzle, not per session.
- **Clearing hints on wrong tap:** Hints should persist once shown until correct tap, not be hidden on additional wrong taps.
- **Playing `completeLevel` before showing celebration:** Call `completeLevel(2)` before starting the 3s celebration timer so localStorage is written immediately.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Board rendering with piece positions | Custom SVG/canvas board | `Chessboard` from react-chessboard | FEN parsing, piece images, responsive sizing all handled |
| Celebration sound variety | Custom sound picker | `playRandomCelebration()` from utils/audio | Already implements no-repeat logic across 5 celebration sounds |
| Confetti animation | CSS keyframe animation | `react-confetti` (installed) | Physics-based, configurable, used in PieceIntroduction |
| Puzzle ordering by piece group | Custom sort logic | `chessPieces[].order` + `difficulty` field | Both fields exist on the data models |
| Level completion persistence | Custom localStorage | `completeLevel(levelNum)` from `useChessProgress` | Handles deduplication and currentLevel advancement |

**Key insight:** The entire puzzle engine exists as data (`chessPuzzles.ts`) and display primitives (`ChessBoard`, `squareStyles` pattern). This phase is 90% wiring.

## Common Pitfalls

### Pitfall 1: Piece-Placement-Only FEN
**What goes wrong:** `chess.js` `new Chess(fen)` throws if passed a partial FEN (e.g., `'8/8/8/8/4R3/8/8/8'` — missing side to move, castling, en passant, move counts).
**Why it happens:** Standard FEN has 6 fields. The puzzle data intentionally stores only the piece-placement portion (field 1 of 6).
**How to avoid:** When rendering, do NOT pass partial FEN to `new Chess()`. Only pass it to `Chessboard`'s `options.position` — react-chessboard accepts partial FEN for display. Confirmed: react-chessboard renders position-only FEN without error.
**Warning signs:** `Chess` constructor throwing "Invalid FEN" at puzzle load time.

### Pitfall 2: ChessBoard Internal Move Execution Conflicts
**What goes wrong:** If you pass a tap handler to `ChessBoard.tsx` via `onMove`, `useChessGame` will still try to select the piece and execute moves, causing the FEN to update (piece disappears and reappears elsewhere).
**Why it happens:** `ChessBoard`'s `handleSquareClick` calls `gameState.selectSquare` which calls `makeMove` if tapping a legal destination.
**How to avoid:** Render `Chessboard` from react-chessboard directly in `MovementPuzzle`, bypassing `ChessBoard.tsx` entirely. Pass `onSquareClick` directly in options.

### Pitfall 3: Hint State Not Resetting on Puzzle Advance
**What goes wrong:** `showHints` state carries over from one puzzle to the next, so the next puzzle shows hints immediately.
**Why it happens:** `setState` calls in advance logic forget to reset all feedback state.
**How to avoid:** Reset `wrongTapCount`, `showHints`, `flashSquare`, `flashType` together when advancing `puzzleIndex`. Use a helper function `resetFeedbackState()` that resets all four.

### Pitfall 4: Tapping Piece Square During Puzzle
**What goes wrong:** Child taps the piece's own square. It's not a valid target, but it shouldn't count as a wrong answer.
**Why it happens:** `handlePuzzleSquareClick` receives any square click including the piece square itself.
**How to avoid:** Guard: `if (square === puzzle.pieceSquare) return;` at the top of the tap handler.

### Pitfall 5: Double-Tap During Auto-Advance
**What goes wrong:** Child taps another square during the 1.5s auto-advance delay after a correct tap, registering an interaction on the next puzzle before the board updates.
**Why it happens:** State has advanced (`puzzleIndex` incremented) but the flash timer is still counting.
**How to avoid:** Track an `isAdvancing` boolean (`useState(false)`). Set it to `true` on correct tap, back to `false` after advancing. Guard tap handler: `if (isAdvancing) return;`.

### Pitfall 6: Translation Key `tapToMove` Missing
**What goes wrong:** `t('ui.tapToMove')` returns the raw key string `"ui.tapToMove"` in production (next-intl behavior for missing keys).
**Why it happens:** The key does not exist in message files yet (verified by reading he.json, en.json, ru.json).
**How to avoid:** Add `tapToMove` to `chessGame.ui` in all three message files as a Wave 0 task.

## Code Examples

Verified patterns from official sources:

### react-chessboard v5 Direct Usage (Position-Only FEN)
```typescript
// Source: react-chessboard v5 options API (Phase 2 verified pattern)
import { Chessboard } from 'react-chessboard';

<Chessboard
  options={{
    position: '8/8/8/8/4R3/8/8/8',   // piece-placement only — display works
    allowDragging: false,
    onSquareClick: ({ square }) => { /* custom handler */ },
    squareStyles: {
      e4: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },  // piece highlight
      e1: { background: 'radial-gradient(circle, rgba(0,128,0,0.4) 25%, transparent 25%)', borderRadius: '50%' }, // hint dot
    },
    boardOrientation: 'white',
    animationDurationInMs: 200,
    boardStyle: { width: '480px', maxWidth: '480px' },
  }}
/>
```

### Confetti Burst (Correct Answer)
```typescript
// Source: PieceIntroduction.tsx (verified working pattern)
import Confetti from 'react-confetti';

// Render conditionally on correct tap — small burst (not full-page)
{showCorrectConfetti && (
  <Confetti
    recycle={false}
    numberOfPieces={80}       // smaller than Level Complete (300)
    gravity={0.3}
    style={{ position: 'fixed', top: 0, left: 0 }}
  />
)}
```

### Celebration Sound — Variety Pattern
```typescript
// Source: utils/audio.ts — playRandomCelebration already implements no-repeat
import { playRandomCelebration, playSound, AudioSounds } from '@/utils/audio';

// For correct puzzle tap: use variety (matches other Lepdy games pattern)
playRandomCelebration();

// For Level 2 complete: use base CELEBRATION (matching PieceIntroduction)
playSound(AudioSounds.CELEBRATION);
```

### next-intl Interpolation for Piece Name
```typescript
// Source: next-intl v4 docs — interpolation syntax
const t = useTranslations('chessGame');

// In messages/he.json:
// "tapToMove": "לאן {piece} יכול ללכת? לחץ!"

t('ui.tapToMove', { piece: t(pieceConfig.translationKey as Parameters<typeof t>[0]) });
```

### Dynamic Import (SSR Safety for MovementPuzzle)
```typescript
// Source: ChessBoardDynamic.tsx pattern (Phase 2)
import dynamic from 'next/dynamic';

// In ChessGameContent.tsx:
const MovementPuzzle = dynamic(() => import('./MovementPuzzle'), { ssr: false });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-chessboard flat props | react-chessboard v5 `options` prop API | Phase 2 discovery | All board config goes inside `options: {}` |
| Passing `ChessBoard` component everywhere | Direct `Chessboard` import for puzzle/display-only use | Phase 5 decision | Avoids `useChessGame` side effects for non-interactive boards |

## Open Questions

1. **Instruction text piece name: Hebrew only or locale-aware?**
   - What we know: `chessPieces[].translationKey` maps to the locale-appropriate piece name via `t()`
   - What's unclear: CONTEXT.md says "showing piece name in Hebrew" but the component renders locale-aware text via next-intl by default
   - Recommendation: Use `t(pieceConfig.translationKey)` — this gives Hebrew name in Hebrew locale (default) and locale-appropriate name in EN/RU. Simpler, consistent with how PieceIntroduction renders piece names.

2. **"Try again" display duration**
   - What we know: CONTEXT.md leaves this to Claude's discretion
   - What's unclear: Whether to auto-hide after N ms or show until next tap
   - Recommendation: Auto-hide after 1.2s via `setTimeout` — keeps UI clean and avoids stale message during hint display.

3. **Confetti scope during puzzle (not Level Complete)**
   - What we know: PieceIntroduction uses `<Confetti recycle={false} numberOfPieces={300} />` as full-page for Level Complete
   - Recommendation: Use `numberOfPieces={80}` for per-puzzle correct tap confetti — smaller burst, less overwhelming for 18 repetitions. Reserve 300-piece burst for Level Complete screen.

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
| MOVE-01 | Level 2 enters with board showing single piece | E2E smoke | `npm test -- --grep "Movement puzzle"` | ❌ Wave 0 |
| MOVE-02 | Tapping correct square shows celebration | E2E smoke | `npm test -- --grep "correct tap"` | ❌ Wave 0 |
| MOVE-03 | Tapping wrong square shows try again, no penalty | E2E smoke | `npm test -- --grep "wrong tap"` | ❌ Wave 0 |
| MOVE-04 | After 2 wrong taps, hint squares are highlighted | E2E smoke | `npm test -- --grep "hint"` | ❌ Wave 0 |
| MOVE-05 | All 6 piece types have puzzles | Static data | Verify `movementPuzzles` has 18 entries across 6 pieceIds — already in data file | ✅ |
| MOVE-06 | No timer visible during puzzle | E2E smoke | Visual check in smoke test | ❌ Wave 0 |
| FEED-01 | Celebration animation + sound on correct | E2E smoke | Part of MOVE-02 test | ❌ Wave 0 |
| FEED-02 | No buzzer on wrong tap | E2E smoke | Part of MOVE-03 test | ❌ Wave 0 |
| FEED-03 | Hint after 2 wrong taps | E2E smoke | Part of MOVE-04 test | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --grep "chess"` (existing chess tests)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add `test.describe('Chess movement puzzles', ...)` block to `e2e/app.spec.ts`
  - Test: Level 2 board renders when Level 1 completed (via localStorage injection)
  - Test: Correct square tap shows positive feedback UI
  - Test: Wrong square tap shows try-again UI (no advancement)
  - Test: After 2 wrong taps, hint data-testid is visible
- [ ] `tapToMove` translation key in `messages/he.json`, `messages/en.json`, `messages/ru.json`

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection:
  - `components/chess/ChessBoard.tsx` — confirmed `squareStyles` API and `onSquareClick` signature
  - `components/chess/useChessGame.ts` — confirmed `selectSquare`, `legalMoves`, `makeMove` behavior
  - `data/chessPuzzles.ts` — confirmed 18 puzzles, `MovementPuzzle` type, `validTargets` field
  - `data/chessPieces.ts` — confirmed `order` field and `translationKey` on all 6 pieces
  - `hooks/useChessProgress.ts` — confirmed `completeLevel(levelNum)` signature
  - `utils/audio.ts` — confirmed `playRandomCelebration()`, `AudioSounds.CELEBRATION`, `AudioSounds.WRONG_ANSWER`
  - `app/[locale]/games/chess-game/PieceIntroduction.tsx` — confirmed level component props pattern
  - `app/[locale]/games/chess-game/ChessGameContent.tsx` — confirmed `currentView === 'level-2'` renders "Coming soon"
  - `messages/he.json`, `messages/en.json`, `messages/ru.json` — confirmed `chessGame.ui.*` keys present; `tapToMove` MISSING

### Secondary (MEDIUM confidence)
- react-chessboard v5 `options` prop API (verified via Phase 2 codebase pattern; position-only FEN display confirmed working)

### Tertiary (LOW confidence)
- None — all findings are from direct codebase inspection at HIGH confidence.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified in package.json and code
- Architecture: HIGH — all patterns derived from existing working code in the codebase
- Pitfalls: HIGH — derived from reading actual implementation of `useChessGame` and ChessBoard
- Translation gaps: HIGH — verified by reading all three message files

**Research date:** 2026-03-22
**Valid until:** 60 days (stable codebase, no external API dependencies)
