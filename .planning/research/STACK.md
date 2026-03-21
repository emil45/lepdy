# Technology Stack: Chess Learning Game

**Project:** Lepdy Chess — Kids Chess Learning Game (milestone addition)
**Researched:** 2026-03-21
**Scope:** Libraries needed on top of existing stack (Next.js 16, React 19, MUI 7, TypeScript 5)

---

## Summary

This is a milestone addition to an existing app, not a new project. The existing stack handles routing, i18n, theming, audio, and state. What's needed is specifically: (1) a chess board rendering component, (2) chess logic / move generation, and (3) a hand-curated puzzle dataset strategy. No AI opponent, no multiplayer, no puzzle server — just interactive board + logic.

**Recommended additions:**

| Purpose | Library | Version |
|---------|---------|---------|
| Board rendering | `react-chessboard` | ^5.10.0 |
| Chess logic | `chess.js` | ^1.4.0 |
| Puzzle data | Hand-curated static JSON (Lichess CC0 source) | — |

---

## Recommended Libraries

### Board Rendering: react-chessboard

**Install:** `npm install react-chessboard`

**Why this one:**

react-chessboard (Clariity) is the clear incumbent in the React chess board space as of 2026. It was created specifically to replace `chessboardjsx`, which is unmaintained. It is actively maintained (v5.10.0 released February 2026, 89 releases total, ~3,400 dependent packages). It explicitly requires React `^19.0.0` as a peer dependency — a perfect match with Lepdy's React 19.2.3.

Key capabilities that matter for this project:

- `onSquareClick` handler — enables click-to-select / click-to-move interaction without drag and drop, which is essential for young children (ages 5-9) on tablets
- `customSquareStyles` prop — map of square IDs to CSS style objects, used to highlight legal moves, target squares, and selection state (required for movement puzzles)
- `customPieces` prop — render arbitrary React nodes as pieces, enabling future custom piece art or highlighting a selected piece
- `arePiecesDraggable` — can be set to `false` to force click-only interaction for young users
- `boardWidth` prop — explicit pixel width, enables consistent sizing on tablet viewports
- TypeScript support built-in (the library is authored in TypeScript)
- Must be wrapped in a `'use client'` component in Next.js App Router — this matches the existing `*Content.tsx` client component pattern Lepdy already uses

**What NOT to use:**

- `chessboardjsx` — unmaintained since ~2021, do not use
- `chessground` — the Lichess board, designed for full chess games with server-side logic, heavier than needed, and has more complex integration requirements
- `gchessboard` — a Web Component wrapper, not native React, adds impedance mismatch with MUI and React state
- `react-chessboard-svg` — static SVG renderer only, no interactivity
- Building a custom board from scratch — unnecessary complexity; react-chessboard's `customPieces` and `customSquareStyles` provide all the customization needed

**Confidence:** HIGH — verified via GitHub (active releases through Feb 2026), peer dependency confirmed as React ^19.0.0, feature set confirmed via multiple sources

---

### Chess Logic: chess.js

**Install:** `npm install chess.js`

**Why this one:**

chess.js v1.4.0 is the standard TypeScript chess logic library. It is headless (no UI), pairs canonically with react-chessboard, and provides exactly the operations needed for the puzzle modes:

| API Method | Use in Lepdy Chess |
|------------|-------------------|
| `new Chess(fen)` | Load a puzzle starting position from FEN string |
| `chess.moves({ square: 'e2' })` | Get all legal moves for a piece — highlight valid tap targets in movement puzzles |
| `chess.move({ from, to })` | Validate and apply a player's chosen move |
| `chess.get(square)` | Read what piece is on a square — determine piece identity for "learn the pieces" level |
| `chess.put({ type, color }, square)` | Programmatically place pieces to set up puzzle positions |
| `chess.turn()` | Know whose turn it is |
| `chess.isCheckmate()`, `chess.isDraw()` | Detect puzzle completion states if needed |

TypeScript types are native (the library is authored in TypeScript). Square notation (`'e2'`, `'a1'`) and piece types (`'p'`, 'n'`, `'b'`, `'r'`, `'q'`, `'k'`) are typed.

The `moves({ square })` method is especially important: for the movement puzzle level ("tap where this piece can move"), you call `chess.moves({ square: selectedSquare, verbose: true })` to get an array of valid target squares, then pass those to `customSquareStyles` on the board for visual highlighting.

**What NOT to use:**

- `js-chess-engine` — includes an AI engine (unnecessary overhead), primarily aimed at Node.js >= 24
- `chess.ts` — a fork of chess.js with TypeScript rewrite, much smaller ecosystem, not necessary when chess.js already ships TypeScript types natively
- Writing custom move validation — chess rules are subtle (en passant, castling, promotion); always delegate to a tested library

**Confidence:** HIGH — version 1.4.0 confirmed on npm and official docs (jhlywa.github.io/chess.js), TypeScript native confirmed, `moves({ square })` API confirmed

---

### Puzzle Data: Hand-Curated Static JSON

**No additional library needed.**

**Why static JSON:**

The puzzle requirements are narrow: three level types (learn pieces, movement puzzles, capture puzzles). This is not a puzzle-solving app with a progression through thousands of rated puzzles — it's a few carefully chosen positions that demonstrate concepts. Static JSON is the correct approach:

- Zero runtime dependency
- Full control over difficulty, piece composition, and Hebrew/educational annotations
- Works entirely offline
- No API calls, no loading states to manage for kids

**Puzzle position format (FEN-based):**

Each puzzle entry in `/data/chess/puzzles.ts` (matching Lepdy's data pattern):

```typescript
interface ChessPuzzle {
  id: string;
  type: 'movement' | 'capture';
  piece: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  fen: string;           // Board position
  targetSquare: string;  // For capture puzzles: square to capture
  hint?: string;         // Translation key for hint text
}
```

**Where puzzle positions come from:**

Lichess publishes a CC0-licensed puzzle database (5.7M+ puzzles with FEN, moves, themes, and ratings) at `database.lichess.org/#puzzles`. This is a research/inspiration source — manually extract and simplify 5-10 positions per puzzle type. Do not import the dataset programmatically; curate by hand.

For the "learn pieces" level (Level 1), no puzzle logic is needed at all — it's a presentation layer (audio + piece display), analogous to Lepdy's existing `CategoryPage` pattern.

**What NOT to use:**

- `@react-chess-tools/react-chess-puzzle` — a higher-level puzzle component that wraps react-chessboard and chess.js together. It handles full puzzle flows (play both sides, detect solution). This is more than needed and less controllable. The Lepdy puzzle model is custom (tap a destination square, not play full sequences), so dropping in a puzzle component would fight against the UX requirements.
- Lichess puzzle API at runtime — latency, dependency, and overkill for a curated set of ~30 positions

**Confidence:** MEDIUM — puzzle format and data source are well-established; the decision to hand-curate rather than programmatically import is a design choice, not a technical constraint

---

## Integration Notes for Lepdy's Existing Stack

### Next.js App Router

react-chessboard is a client-only library (uses browser drag-and-drop APIs). Wrap it in a `'use client'` component. This is already the pattern for all Lepdy games (`*Content.tsx`). The board component goes inside the Content file, not the page.tsx.

### RTL / MUI

react-chessboard renders with absolute positioning inside a container div. It does not use Emotion or MUI's theming system, so RTL direction (`dir="rtl"`) on the document does not affect the board layout. This is correct — a chess board should always render left-to-right (a-h files). MUI layout wrappers around the board (for controls, piece labels, feedback text) should use `dir="rtl"` normally.

### TypeScript

Both react-chessboard and chess.js ship native TypeScript types. No `@types/` packages needed.

### Board Width on Tablets

Pass an explicit `boardWidth` prop calculated from viewport. A safe approach: `Math.min(window.innerWidth - 32, 480)` for tablets. Use a `useEffect` + `useState` to measure on mount, since `window` is not available during SSR.

---

## Installation

```bash
npm install react-chessboard chess.js
```

No dev-only dependencies needed — both are runtime libraries.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Board rendering | react-chessboard | chessboardjsx | Unmaintained since ~2021 |
| Board rendering | react-chessboard | chessground | Lichess-specific, heavier, complex integration |
| Board rendering | react-chessboard | Custom SVG board | Unnecessary effort; library covers all needs |
| Chess logic | chess.js | js-chess-engine | Ships with AI engine (unused overhead), Node 24 target |
| Chess logic | chess.js | chess.ts | Tiny ecosystem, no advantage over chess.js v1.x TypeScript |
| Puzzle delivery | Static JSON | @react-chess-tools/react-chess-puzzle | Too opinionated about UX flow, fights the custom tap-target model |
| Puzzle delivery | Static JSON | Lichess API at runtime | Network dependency, latency, overkill for ~30 positions |

---

## Sources

- react-chessboard GitHub (Clariity): https://github.com/Clariity/react-chessboard — version v5.10.0, peer deps React ^19.0.0, active through Feb 2026
- react-chessboard npm: https://www.npmjs.com/package/react-chessboard — 3,400 dependents
- chess.js official docs: https://jhlywa.github.io/chess.js/ — v1.4.0
- chess.js GitHub: https://github.com/jhlywa/chess.js — TypeScript native
- Lichess puzzle database: https://database.lichess.org/#puzzles — CC0 license, 5.7M puzzles with FEN
- Lichess puzzles on Hugging Face: https://huggingface.co/datasets/Lichess/chess-puzzles — updated Dec 2025
