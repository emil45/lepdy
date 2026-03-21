# Architecture Patterns

**Domain:** Chess learning game for kids (ages 5-9)
**Researched:** 2026-03-21
**Context:** Adding a chess learning game to an existing Next.js Hebrew learning app (Lepdy)

---

## Recommended Architecture

The chess game follows Lepdy's established server/client split pattern and uses two external libraries for chess concerns:

- **chess.js** (v1.4.0) — pure game logic: legal move generation, FEN parsing, move validation, board state. No rendering.
- **react-chessboard** (v5.x) — React board renderer: drag/drop, click-to-move, square highlighting, custom piece rendering. No logic.

These are combined in a custom `useChessGame` hook that bridges them, exactly paralleling how `useLetterTracing` bridges canvas drawing state in the existing letter-tracing game.

### Component Boundaries

```
app/[locale]/games/chess/
├── page.tsx                        (Server: locale, metadata, renders ChessContent)
├── ChessContent.tsx                (Client: top-level state machine, level routing)
├── components/
│   ├── ChessBoard.tsx              (Pure display: wraps react-chessboard, accepts props)
│   ├── PieceIntroCard.tsx          (Level 1: single piece display with Hebrew name + audio)
│   ├── MovementPuzzle.tsx          (Level 2: "tap where this piece can move")
│   ├── CapturePuzzle.tsx           (Level 3: "which piece can capture the target?")
│   ├── LevelMap.tsx                (Progress overview: which levels are unlocked/done)
│   └── ChessPieceLabel.tsx         (Hebrew name + transliteration display)
├── hooks/
│   ├── useChessGame.ts             (Bridge: chess.js state + board interaction logic)
│   ├── useChessProgress.ts         (Wraps useCategoryProgress for chess level progress)
│   └── useChessAudio.ts            (Piece name audio playback for Hebrew pronunciation)
└── data/
    ├── chessPieces.ts              (6 pieces: id, translationKey, audioFile, FEN symbol)
    └── puzzles.ts                  (Puzzle definitions: FEN + correct answer squares)
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `page.tsx` | Server: locale validation, metadata, renders ChessContent | Next.js routing, next-intl |
| `ChessContent.tsx` | State machine: which level/phase is active, navigation between levels | All child components, useChessProgress |
| `ChessBoard.tsx` | Renders react-chessboard with Lepdy styling, emits square click events | ChessContent, MovementPuzzle, CapturePuzzle |
| `PieceIntroCard.tsx` | Displays one piece with large visual, Hebrew name, audio button | useChessAudio, ChessPieceLabel |
| `MovementPuzzle.tsx` | Shows board with one piece placed, validates player taps correct squares | ChessBoard, useChessGame |
| `CapturePuzzle.tsx` | Shows board with enemy piece, player must tap the piece that can capture it | ChessBoard, useChessGame |
| `LevelMap.tsx` | Shows 3 level buttons with locked/unlocked/completed state | useChessProgress |
| `useChessGame.ts` | chess.js instance, legal move calculation, FEN loading, answer validation | chess.js, MovementPuzzle, CapturePuzzle |
| `useChessProgress.ts` | localStorage progress for each level and puzzle | useCategoryProgress (existing hook) |
| `useChessAudio.ts` | Plays Hebrew audio for piece names via existing playAudio() | utils/audio.ts (existing) |
| `chessPieces.ts` | Static config: 6 pieces with IDs, translation keys, audio filenames | PieceIntroCard, MovementPuzzle, CapturePuzzle |
| `puzzles.ts` | Puzzle definitions per level with FEN string and expected answer set | MovementPuzzle, CapturePuzzle |

---

## Data Flow

### Page Load Flow

```
Browser → app/[locale]/games/chess/page.tsx (Server)
  └── setRequestLocale(locale)
  └── generateMetadata()
  └── render <ChessContent />
        └── useChessProgress() → reads localStorage for level state
        └── render <LevelMap /> showing unlocked/completed levels
```

### Level 1: Piece Introduction

```
User taps piece on LevelMap
  → ChessContent sets activeLevel = 1, activePiece = piece
  → PieceIntroCard renders
  → useChessAudio.playPieceAudio(piece.audioFile)  [auto-plays on mount]
  → User taps audio button → playAudio('/audio/chess/he/{piece}.mp3')
  → User taps "next" → ChessContent advances to next piece or marks level complete
  → useChessProgress.recordLevelComplete('level-1') → localStorage
```

### Level 2: Movement Puzzle Flow

```
User selects Level 2 from LevelMap
  → ChessContent renders MovementPuzzle with puzzle config
  → MovementPuzzle calls useChessGame.loadPuzzle(puzzle.fen)
      → chess.js.load(fen) sets board state
      → chess.js.moves({ square: puzzle.pieceSquare, verbose: true })
      → extracts Set<Square> of legal destination squares
  → ChessBoard renders board from chess.js.fen()
  → User taps a square
      → onSquareClick(square) fires
      → useChessGame.checkAnswer(square)
          → correct: if square in legalSquares → playSound(SUCCESS) → highlight green → advance
          → wrong: playSound(WRONG) → highlight red → try again
  → All correct squares tapped → puzzle complete → next puzzle or level complete
```

### Level 3: Capture Puzzle Flow

```
User selects Level 3 from LevelMap
  → ChessContent renders CapturePuzzle with puzzle config
  → puzzle.fen positions multiple pieces; one is a target (enemy piece)
  → useChessGame.loadPuzzle(fen)
      → chess.js computes which friendly pieces attack the target square
      → builds Set<Square> of correct attacker squares
  → User taps a piece
      → if piece is a valid attacker → SUCCESS, show capture animation
      → if piece cannot capture target → WRONG, try again
  → Puzzle complete → advance
```

### Progress Persistence

```
useChessProgress (wraps existing useCategoryProgress pattern)
  → key: 'lepdy_chess_progress'
  → shape: { completedLevels: Set<string>, completedPuzzles: Set<string> }
  → reads on mount, writes on each completion
  → exposes: isLevelComplete(levelId), isPuzzleComplete(puzzleId), recordCompletion(id)
```

---

## chess.js Integration Pattern

chess.js provides the following API used in `useChessGame.ts`:

```typescript
const chess = new Chess();

// Load a puzzle position
chess.load(fen);                              // throws if invalid FEN

// Get legal moves for a piece
chess.moves({ square: 'e4', verbose: true }) // returns MoveObject[] with .to property

// Get piece at a square
chess.get('e4')                              // returns { type: 'p', color: 'w' } or undefined

// Check board state
chess.turn()                                 // 'w' | 'b'
chess.fen()                                  // current FEN string (passed to react-chessboard)
chess.board()                                // 8x8 array of piece objects
```

For Level 2 (movement puzzles), the flow is: `load(fen)` → `moves({ square, verbose: true })` → extract `.to` squares → compare against player tap.

For Level 3 (capture puzzles), the flow is: `load(fen)` → for each friendly piece, `moves({ square: piece.square, verbose: true })` → find moves where `.captured` is defined and `.to === targetSquare` → those piece squares are correct answers.

---

## Puzzle Data Format

Puzzles are static TypeScript definitions in `data/puzzles.ts`. No external puzzle database needed at v1.

```typescript
interface MovementPuzzle {
  id: string;
  pieceId: string;          // e.g. 'rook' — maps to chessPieces.ts
  fen: string;              // chess.js FEN: piece placement on empty/simple board
  pieceSquare: Square;      // where the piece sits (e.g. 'd4')
  instruction: string;      // i18n key: 'chess.puzzles.movement.rook_open_file'
}

interface CapturePuzzle {
  id: string;
  fen: string;              // positions both friendly pieces and one enemy target
  targetSquare: Square;     // the enemy piece to capture
  correctAttackers: Square[]; // precomputed or derived at runtime from chess.js
  instruction: string;      // i18n key: 'chess.puzzles.capture.knight_fork'
}
```

FEN example for a rook movement puzzle: `8/8/8/8/3R4/8/8/8 w - - 0 1`
(empty board, white Rook on d4)

---

## Patterns to Follow

### Pattern 1: State Machine for Game Phases

`ChessContent.tsx` manages a top-level phase state, paralleling how `LetterTracingContent.tsx` uses `gameState: 'menu' | 'playing' | 'complete'`.

```typescript
type ChessPhase =
  | { type: 'level-map' }
  | { type: 'piece-intro'; pieceIndex: number }
  | { type: 'movement-puzzle'; puzzleIndex: number }
  | { type: 'capture-puzzle'; puzzleIndex: number }
  | { type: 'level-complete'; level: 1 | 2 | 3 };
```

This makes each phase a distinct render path with clear entry/exit, avoids sprawling conditional logic, and matches Lepdy's existing game pattern.

### Pattern 2: Derived Legal Squares (Not Stored State)

Legal move squares are computed from chess.js on demand — never stored in React state. This avoids stale state bugs. `useChessGame` exposes a function `getLegalSquares(square)` that calls chess.js each time.

### Pattern 3: Square Highlighting via react-chessboard customSquareStyles

`react-chessboard` accepts a `customSquareStyles` prop (Record<Square, CSSProperties>). Legal squares are passed as highlight styles when a piece is selected. This keeps highlight logic outside React state — computed as a derived value during render.

```typescript
const highlightedSquares = selectedSquare
  ? Object.fromEntries(
      getLegalSquares(selectedSquare).map(sq => [sq, { backgroundColor: 'rgba(255, 255, 0, 0.4)' }])
    )
  : {};
```

### Pattern 4: Click-Not-Drag for Kids

`react-chessboard` supports `arePiecesDraggable={false}` and `onSquareClick` handler. For ages 5-9 on tablets, click/tap is more reliable than drag. Level 2 uses a two-tap model: tap piece to select (highlights legal squares), tap destination to confirm.

### Pattern 5: Chess Piece Data Follows Lepdy Item Pattern

`chessPieces.ts` mirrors the existing `letters.ts` / `numbers.ts` pattern with the same interface shape, enabling the existing `useCategoryProgress` hook to track which pieces have been introduced in Level 1.

```typescript
interface ChessPieceConfig {
  id: string;                // 'chess_piece_1' .. 'chess_piece_6'
  translationKey: string;    // 'chess.pieces.king'
  audioFile: string;         // 'king.mp3'
  symbol: string;            // FEN symbol: 'K', 'Q', 'R', 'B', 'N', 'P'
  fenSymbolBlack: string;    // 'k', 'q', 'r', 'b', 'n', 'p'
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Board State in React State

**What goes wrong:** Keeping the chess board squares/pieces as React state and syncing with chess.js creates two sources of truth.
**Why bad:** Causes desyncs, hard to reason about, stale state bugs during fast interactions.
**Instead:** chess.js is the single source of truth. Pass `chess.fen()` to react-chessboard's `position` prop. React state holds only: which phase is active, which square is selected, and whether the puzzle is solved.

### Anti-Pattern 2: Building a Custom Board Renderer

**What goes wrong:** Rendering an 8x8 grid with MUI Grid/Box components and custom piece images.
**Why bad:** Handles poorly: drag-and-drop, board orientation, piece SVGs, responsive sizing, accessibility, and touch events — all solved problems in react-chessboard.
**Instead:** Use react-chessboard v5, which is actively maintained, TypeScript-native, mobile-friendly, and composable. Customize via its props only.

### Anti-Pattern 3: Precomputing All Legal Moves on Load

**What goes wrong:** Calling `chess.moves()` for every piece on mount and storing results.
**Why bad:** Wasted computation, stale if position changes, complex cache invalidation.
**Instead:** Compute on demand when a square is selected. chess.js is fast enough for immediate computation on tap.

### Anti-Pattern 4: Deep Puzzle Logic in Components

**What goes wrong:** Puzzle validation logic (is this tap correct?) lives inside MovementPuzzle or CapturePuzzle JSX components.
**Why bad:** Untestable, mixed concerns, duplicated across Level 2 and Level 3.
**Instead:** All chess logic lives in `useChessGame.ts`. Components receive: current position, highlight map, onSquareClick handler. They emit taps, useChessGame decides correctness.

### Anti-Pattern 5: i18n Keys for Piece Names Hardcoded in Components

**What goes wrong:** Using string literals like "מלך" (king in Hebrew) directly in components.
**Why bad:** Breaks Russian/English locales, no central source of piece name data.
**Instead:** All piece names come from `messages/{he,en,ru}.json` via `useTranslations()` with keys like `chess.pieces.king`. Audio files are locale-specific under `/public/audio/chess/he/`.

---

## Integration with Existing Lepdy Architecture

### Fits Existing Patterns Without Modification

| Existing Pattern | Chess Game Usage |
|-----------------|-----------------|
| `page.tsx` (server) + `*Content.tsx` (client) | `chess/page.tsx` + `ChessContent.tsx` — no change to pattern |
| `useCategoryProgress` hook | `useChessProgress` wraps it with chess-specific storage key |
| `playAudio(path)` for pronunciation | `useChessAudio` calls it with `/audio/chess/he/{piece}.mp3` |
| `playSound(AudioSounds.X)` for game effects | Used directly in `useChessGame` for SUCCESS/WRONG/COMPLETE |
| `useTranslations()` for i18n | Used in all chess components — piece names, instructions, UI labels |
| `BackButton href="/games"` | Used in `ChessContent.tsx` — back goes to games list |
| `Celebration` component | Used on level complete and puzzle complete |
| `FunButton` | Used for "Start", "Next", level selection |
| `useGameAnalytics` | Used in `ChessContent.tsx` to fire GAME_STARTED, GAME_COMPLETED |
| Feature flags | Chess game gated behind `chessGameEnabled` flag during rollout |

### New Additions Required

| Addition | Why | Location |
|----------|-----|----------|
| `chess.js` npm dependency | Legal move generation | `package.json` |
| `react-chessboard` npm dependency | Board rendering | `package.json` |
| Hebrew audio files (6 pieces) | Pronunciation: king, queen, rook, bishop, knight, pawn | `/public/audio/chess/he/` |
| Translation keys for chess | Piece names (all 3 locales), UI strings, puzzle instructions | `messages/{he,en,ru}.json` |
| Route `app/[locale]/games/chess/` | Game page | App Router |
| Chess button in GamesContent.tsx | Navigation entry point | Existing GamesContent |

---

## Build Order (Phase Dependencies)

Dependencies flow bottom-up. Each layer must exist before the layer above it builds on it.

```
1. Data + translations
   └── chessPieces.ts (6 piece configs)
   └── messages/*.json chess keys (piece names in he/en/ru)
   └── Hebrew audio files recorded and placed

2. Chess logic hook
   └── useChessGame.ts (chess.js integration)
   └── useChessAudio.ts (audio playback)
   └── useChessProgress.ts (localStorage progress)

3. Board component
   └── ChessBoard.tsx (react-chessboard wrapper with Lepdy styling)
   [depends on: chess.js FEN output, react-chessboard]

4. Level 1: Piece Introduction
   └── PieceIntroCard.tsx (piece display + Hebrew audio)
   └── ChessPieceLabel.tsx (Hebrew name + transliteration)
   [depends on: chessPieces.ts, useChessAudio, translations]

5. Level 2: Movement Puzzles
   └── puzzles.ts (movement puzzle definitions with FEN)
   └── MovementPuzzle.tsx (board + legal move highlighting)
   [depends on: ChessBoard, useChessGame, puzzles.ts]

6. Level 3: Capture Puzzles
   └── CapturePuzzle.tsx (board + attacker identification)
   [depends on: ChessBoard, useChessGame, puzzles.ts]

7. Level navigation
   └── LevelMap.tsx (shows 3 levels, locked/unlocked/complete state)
   [depends on: useChessProgress]

8. Game entry point
   └── ChessContent.tsx (state machine: routes between phases)
   └── chess/page.tsx (server component wrapper)
   └── GamesContent.tsx (add chess button)
   [depends on: all above]
```

---

## Scalability Considerations

| Concern | Now (v1) | Future |
|---------|----------|--------|
| Puzzle count | ~10-15 per level, static TypeScript | Could load from Firebase or JSON file if count grows |
| Piece images | react-chessboard's default SVG pieces | Custom illustrated pieces via `customPieces` prop |
| Additional levels | Level 4+ (e.g. check detection) added to same state machine | New level type added to ChessPhase union, new component |
| Full chess game | Out of scope — would require adding AI (stockfish.js WASM) | Separate route, not a level in this game |
| Progress sync | localStorage only (no account) | Could add Firebase anonymous auth + Firestore, same pattern as simon-game leaderboard |

---

## Sources

- chess.js API documentation: https://jhlywa.github.io/chess.js/
- react-chessboard GitHub (v5, actively maintained): https://github.com/Clariity/react-chessboard
- react-chess-tools monorepo (React 19 + react-chessboard v5 + chess.js): https://github.com/dancamma/react-chess-tools
- Chess puzzle data format (Lichess): https://database.lichess.org/
- Kids chess learning progression (ChessKid, ChessWorld): https://www.chessboardvault.com/best-chess-apps-for-kids/
- FEN notation reference: https://www.chess.com/terms/fen-chess
