# Project Research Summary

**Project:** Lepdy Chess — Kids Chess Learning Game
**Domain:** Educational chess game (ages 5-9) integrated into existing Hebrew vocabulary app
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

Lepdy Chess is a milestone addition to an existing Next.js Hebrew learning app, not a standalone product. The goal is to teach chess fundamentals to children aged 5-9 while reinforcing Hebrew vocabulary — a combination with no direct competitors in the market. Research confirms that successful kids chess apps (ChessKid, Magnus Kingdom of Chess, ChessWorld) share a common pattern: introduce one piece at a time, show movement visually before asking the child to demonstrate it, and keep feedback positive. The recommended approach mirrors this pattern across three levels: introduce each piece with its Hebrew name (Level 1), let children explore where it can move (Level 2), and practice captures in simple positions (Level 3). Scope is intentionally constrained — no AI opponent, no multiplayer, no timers during learning.

The technical implementation is straightforward for this codebase. Two libraries handle chess concerns: `react-chessboard` (v5.10.0, React 19 compatible, actively maintained) for board rendering and `chess.js` (v1.4.0, TypeScript-native) for move validation. Both integrate cleanly into Lepdy's existing `page.tsx` + `*Content.tsx` server/client split and reuse existing audio, i18n, progress, and analytics infrastructure. Puzzle content is hand-curated static TypeScript — no external puzzle database needed at this scope (~10-15 puzzles per level).

The primary risks are technical rather than product: react-chessboard requires explicit SSR suppression in Next.js App Router (hydration crash without it), board state must flow through chess.js as single source of truth (board flicker if two sources exist), and the Hebrew RTL layout must be isolated from the chess board container (CSS direction inheritance mirrors the board). All three are well-documented gotchas with clear prevention steps. The second class of risk is pedagogical: board squares must be large enough for young hands (56px minimum), feedback must be gentle (no buzzers, no red X), and puzzles must use nearly-empty boards so cognitive load stays low. These are design constraints that need explicit attention during every phase.

---

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, React 19, MUI 7, TypeScript 5, next-intl) requires only two additions. No server-side components, no external APIs, no new state management. The chess-specific work lives entirely in client components following existing patterns.

**Core technologies:**
- `react-chessboard` v5.10.0: Board rendering — only actively maintained React chess board with React 19 peer dep confirmed, click/tap interaction model for kids
- `chess.js` v1.4.0: Move validation and FEN handling — headless, TypeScript-native, canonical pair for react-chessboard
- Static TypeScript puzzle data (`/data/chess/`): Puzzle definitions — hand-curated from Lichess CC0 positions, no runtime dependency, works offline

**What to explicitly not install:**
- `chessboardjsx` — unmaintained since 2021
- `js-chess-engine` — ships an AI engine (unused overhead) targeting Node 24
- `@react-chess-tools/react-chess-puzzle` — too opinionated about UX flow, fights the custom tap-target model needed here

See `.planning/research/STACK.md` for full rationale and alternatives considered.

### Expected Features

Research across ChessKid, Magnus Kingdom of Chess, ChessWorld, and Chess Academy for Kids confirms a clear set of table stakes. The differentiators are Lepdy-specific and achievable at low complexity.

**Must have (table stakes):**
- Visual move highlighting when a piece is selected — without this kids cannot interact with puzzles
- Each piece introduced individually, not all at once — standard across every reviewed app
- Correct answer celebration (animation + sound) — Duolingo/Khan Kids/ChessKid universal pattern
- Gentle wrong-answer handling ("try again" + hint) — harsh failure causes session dropout in ages 5-7
- Progressive level unlock (complete Level 1 to access Level 2) — creates accomplishment, prevents overwhelm
- Large touch targets (56px+ per square) — tablets are primary device for this age group
- Progress indicator showing current position and what's ahead
- No timer pressure during piece learning — timers are for advanced modes only
- Audio pronunciation of Hebrew piece names — core Lepdy educational model

**Should have (differentiators):**
- Hebrew piece names as primary vocabulary (no other chess app does this)
- Hebrew text + transliteration + native language display — reduces parent anxiety
- Single-piece boards in learning phases — less visual noise than full 32-piece boards
- Level completion summary with Hebrew vocabulary recap — bridges chess and Hebrew goals
- Lepdy visual language (pastel, familiar UI) — immediate comfort for returning users

**Defer to v2+:**
- Full chess game vs AI opponent — scope is "fundamentals", not "play chess"
- Capture puzzle narrative framing ("help the pawn escape!") — can ship as plain puzzle first
- Hebrew vocabulary recap summary screens after each piece
- Transliteration display

**Hard anti-features (never build for this milestone):**
- ELO / competitive rating, online multiplayer, parent dashboard/accounts, custom board themes, video lessons, special moves (castling, en passant, promotion) in the core learning flow

See `.planning/research/FEATURES.md` for full feature table with complexity and rationale.

### Architecture Approach

The chess game slots into Lepdy's established architecture without requiring any new infrastructure. The `page.tsx` (server) + `ChessContent.tsx` (client) pattern is identical to every existing game. chess.js is the single source of truth for board state; react-chessboard is a pure renderer that receives `chess.fen()` as its position prop. A `useChessGame` hook bridges the two libraries, paralleling how other games bridge their logic to rendering. Progress uses localStorage via the existing `useCategoryProgress` pattern. Audio uses existing `playAudio()` and `playSound()` utilities.

**Major components:**
1. `ChessContent.tsx` — top-level state machine with a discriminated union type (`ChessPhase`) routing between level-map, piece-intro, movement-puzzle, capture-puzzle, and level-complete screens
2. `ChessBoard.tsx` — thin wrapper around react-chessboard with Lepdy styling; receives position, highlight map, and click handler; emits square clicks only
3. `useChessGame.ts` — chess.js instance management, legal move computation, puzzle answer validation; all chess logic lives here, never in components
4. `PieceIntroCard.tsx` — Level 1 display component: large piece visual, Hebrew name, audio button
5. `MovementPuzzle.tsx` / `CapturePuzzle.tsx` — Level 2/3 puzzle components; tap interaction, use ChessBoard and useChessGame
6. `LevelMap.tsx` — entry screen showing 3 levels with locked/unlocked/complete state from useChessProgress

**Key patterns to follow:**
- chess.js is single source of truth: `const [game, setGame] = useState(new Chess())`, pass `game.fen()` to board position prop
- Legal squares are computed on demand (`getLegalSquares(square)` called on tap), never stored in state
- Square highlights are derived values during render via `customSquareStyles` prop, not React state
- `'use client'` on all chess components; board loaded via `next/dynamic` with `{ ssr: false }`
- All chess piece data follows the `letters.ts` / `numbers.ts` interface shape for compatibility with existing hooks

See `.planning/research/ARCHITECTURE.md` for component directory structure, data flow diagrams, and full build order.

### Critical Pitfalls

1. **SSR hydration crash** — react-chessboard accesses browser APIs on init; must import via `next/dynamic` with `{ ssr: false }` from day one. White screen in prod if missed.

2. **Dual state sources causing board flicker** — confirmed react-chessboard issue #119; prevent by making chess.js the only state (`setGame(new Chess(copy))`), never storing a separate position string in React state.

3. **Board squares too small for young hands** — a default-sized board gives ~40px squares, unacceptable for ages 5-7; enforce minimum 56px per square (448px total board width), use click/tap not drag, test on a physical tablet.

4. **RTL mirroring the chess board** — Hebrew locale propagates `direction: rtl` from MUI theme; wrap board container with explicit `direction: ltr` or the board files are reversed (a-file on right instead of left).

5. **Harsh wrong-answer feedback causing dropout** — red X + buzzer causes abandonment in ages 5-7; use gentle visual reset + soft sound + hint after 2-3 failures, matching ChessKid's approach.

See `.planning/research/PITFALLS.md` for 12 pitfalls including moderate (audio clash, localStorage crash in incognito, cognitive overload from full-board puzzles) and minor (special moves confusing beginners, missing i18n keys).

---

## Implications for Roadmap

The ARCHITECTURE.md build order (bottom-up dependency graph) is the correct phase structure. Each layer is a prerequisite for the next. Phases should not be combined — the board must work before puzzles are built on top of it.

### Phase 1: Foundation — Libraries, Data, and Translations

**Rationale:** Everything else depends on this. Audio files are the longest lead-time item (requires a Hebrew speaker) and must be identified as a hard dependency before Level 1 work begins. Chess data structures and i18n keys should be locked before any component work starts to avoid retrofit costs.
**Delivers:** npm deps installed, `chessPieces.ts` data file, `puzzles.ts` (movement + capture definitions with curated FEN positions), all chess translation keys in `messages/{he,en,ru}.json`, Hebrew audio files in `/public/audio/chess/he/`
**Addresses:** Audio pronunciation (table stakes), i18n for all locales (pitfall 12 prevention)
**Avoids:** Starting Level 1 before audio exists (Pitfall 6 — audio files are a hard dependency)
**Research flag:** None — data structures and FEN format are well-documented

### Phase 2: Board Infrastructure

**Rationale:** The board is the foundation all game phases render on. SSR and RTL issues (Pitfalls 1 and 4) must be resolved here before any puzzle logic is added on top. Getting the board rendering correct in Hebrew locale before proceeding eliminates a category of bug from all later phases.
**Delivers:** `ChessBoard.tsx` wrapping react-chessboard with `next/dynamic ssr: false`, explicit `direction: ltr` container, touch-optimized square sizing (56px minimum), `useChessGame.ts` hook with chess.js integration, `useChessProgress.ts` and `useChessAudio.ts` hooks
**Uses:** `react-chessboard` v5.10.0, `chess.js` v1.4.0
**Implements:** ChessBoard component, all three custom hooks
**Avoids:** SSR crash (Pitfall 1), RTL board flip (Pitfall 4), dual state sources (Pitfall 2), touch target size (Pitfall 3)
**Research flag:** None — all patterns are documented and the library APIs are confirmed

### Phase 3: Game Entry Point and Navigation Shell

**Rationale:** Before building individual levels, the state machine container and navigation must exist. ChessContent.tsx and the chess route need to be wired up so levels can be tested in isolation as they are built. The games list entry point is low effort and enables integration testing early.
**Delivers:** `app/[locale]/games/chess/page.tsx`, `ChessContent.tsx` with `ChessPhase` state machine, `LevelMap.tsx` with locked/unlocked/complete states, chess button in `GamesContent.tsx`, `BackButton href="/games"`, feature flag `chessGameEnabled`
**Addresses:** Progressive level lock (table stakes), Lepdy visual language (differentiator)
**Research flag:** None — state machine pattern mirrors existing letter-tracing and guess-game patterns exactly

### Phase 4: Level 1 — Piece Introduction

**Rationale:** Level 1 is the lowest technical risk and highest educational value. It mirrors the existing `CategoryPage` pattern (audio + card display). It must come before Level 2 because the piece introduction establishes the Hebrew vocabulary that Level 2 assumes the child has begun to learn. Audio files must exist before this phase starts (established in Phase 1).
**Delivers:** `PieceIntroCard.tsx`, `ChessPieceLabel.tsx`, all 6 pieces with Hebrew audio playback, Level 1 completion tracking in useChessProgress
**Addresses:** Hebrew piece names (primary differentiator), audio pronunciation (table stakes), piece-by-piece introduction (table stakes)
**Avoids:** Audio clash with game sounds (Pitfall 6 — trigger from user tap only, use existing playAudio() system)
**Research flag:** None — audio + card pattern is the most established pattern in the existing codebase

### Phase 5: Level 2 — Movement Puzzles

**Rationale:** This is the core interactive mechanic that makes the game educational rather than presentational. The two-tap interaction model (select piece → tap destination) plus legal move highlighting is the primary teaching mechanism. Single-piece empty boards are required to avoid cognitive overload.
**Delivers:** `MovementPuzzle.tsx`, legal move highlight rendering via `customSquareStyles`, two-tap interaction flow, correct/wrong answer feedback (gentle), hint system after 2-3 failures, Level 2 completion tracking
**Addresses:** Move highlighting (table stakes), hint system (table stakes), celebration on correct answer (table stakes), gentle wrong-answer feedback (table stakes)
**Avoids:** Cognitive overload (Pitfall 5 — single piece on empty board only), harsh feedback (Pitfall 8 — soft reset + hint), missing highlights (Pitfall 9), special moves in puzzles (Pitfall 11 — curate FEN positions carefully)
**Research flag:** Puzzle FEN curation — the 10-15 movement puzzles need to be designed to avoid edge cases (no pawns near 8th rank, no rook/king on starting squares to prevent castling hints). Low research burden but requires careful data work.

### Phase 6: Level 3 — Capture Puzzles

**Rationale:** Builds directly on Level 2 mechanics (board + useChessGame) but introduces a new question type: which piece can capture a target? Complexity increases incrementally — still mostly empty boards, still gentle feedback, but introduces piece identity selection rather than square selection.
**Delivers:** `CapturePuzzle.tsx`, attacker identification logic in useChessGame (using `chess.moves()` with `.captured` filter), capture puzzle FEN positions (~10-15), Level 3 completion tracking
**Addresses:** Capture puzzles (core feature per MVP recommendation in FEATURES.md)
**Avoids:** Special move confusion (Pitfall 11 — FEN positions must exclude castling/en passant/promotion scenarios), cognitive overload (Pitfall 5 — still minimal pieces on board)
**Research flag:** None — capture logic using chess.js `moves()` with verbose mode and `.captured` property is fully documented

### Phase 7: Polish and Integration

**Rationale:** Cross-cutting concerns that apply to all levels but are best addressed after core mechanics are proven correct. localStorage crash prevention, analytics events, celebration animations, and the Hebrew vocabulary recap screens are all low-dependency improvements.
**Delivers:** localStorage try/catch with in-memory fallback, `useGameAnalytics` GAME_STARTED/GAME_COMPLETED events, Celebration component on level complete, accessible aria labels on board squares, Hebrew vocabulary recap screen after each piece's Level 2 completion (nice-to-have from FEATURES.md)
**Addresses:** Progress persistence reliability (Pitfall 7), analytics integration (existing Lepdy pattern)
**Research flag:** None — all patterns are established in the existing codebase

### Phase Ordering Rationale

- Data and audio (Phase 1) must precede all level implementation because audio files require a human Hebrew speaker with lead time; FEN puzzle design requires careful review before code is written against it
- Board infrastructure (Phase 2) resolves all four critical pitfalls before any puzzle logic is layered on; these pitfalls are catastrophic and hardest to retrofit
- Navigation shell (Phase 3) enables isolated level testing and prevents the entire game from being untestable until all levels are complete
- Levels 1 → 2 → 3 (Phases 4-6) follow the dependency graph: Level 1 is prerequisite to Level 2 (same piece data), Level 2 is prerequisite to Level 3 (same board and game hook)
- Polish (Phase 7) deferred intentionally; analytics and localStorage edge cases do not block educational value

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1:** Data structures, i18n keys, FEN format — all established
- **Phase 2:** Library integration — both libraries have clear docs; patterns are defined in ARCHITECTURE.md
- **Phase 3:** State machine and routing — mirrors existing Lepdy game patterns exactly
- **Phase 4:** Level 1 piece intro — mirrors CategoryPage pattern with audio
- **Phase 6:** Capture puzzle logic — chess.js API for attacker detection is documented
- **Phase 7:** Polish pass — all patterns exist in codebase

Phases that may benefit from brief research:
- **Phase 5 (Level 2 movement puzzles):** The specific FEN positions for 10-15 movement puzzles per piece (6 pieces = up to 90 puzzle positions) need to be designed carefully to avoid special move edge cases. Recommend a FEN design session using Lichess puzzle database as source material before implementation begins.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | react-chessboard v5.10.0 React 19 peer dep confirmed, chess.js v1.4.0 TypeScript native confirmed, static JSON approach is a design choice with no technical risk |
| Features | HIGH | Table stakes confirmed across 5+ kids chess apps; anti-features supported by PROJECT.md and UX research; Hebrew vocabulary medium confidence (see gap below) |
| Architecture | HIGH | All patterns derived from existing Lepdy codebase conventions; build order follows confirmed library API shapes; single source of truth pattern documented in react-chessboard issue #119 |
| Pitfalls | HIGH | Critical pitfalls sourced from library issue trackers, Next.js hydration docs, NNG touch target research, and confirmed chess app UX patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **Hebrew chess piece terminology:** Piece names sourced from WordReference forum, not verified against Israeli Chess Federation official terminology. Before recording audio, confirm names with a native Hebrew speaker familiar with chess: מלך (king), מלכה (queen), צריח (rook), רץ (bishop), פרש (knight), חייל/רגלי (pawn). This is a hard dependency for Level 1.

- **Puzzle count per level:** Research suggests 10-15 puzzles per level as sufficient for the educational goals, but the exact count for Level 2 movement puzzles (6 pieces × N puzzles) needs to be decided during puzzle data design. Recommend starting with 3-5 positions per piece (18-30 total) to keep scope bounded.

- **Pawn treatment in Level 2:** Pawns have asymmetric movement (move forward, capture diagonally, cannot move backward). This is the most confusing piece for beginners. Research does not resolve whether to include pawns in Level 2 at all, or defer them to a simplified sub-level. Flag for design decision during Phase 5 planning.

---

## Sources

### Primary (HIGH confidence)
- react-chessboard GitHub (Clariity/react-chessboard) — v5.10.0, React 19 peer dep, feature set confirmed
- chess.js official docs (jhlywa.github.io/chess.js) — v1.4.0 API, TypeScript native
- react-chessboard issue #119 — dual state desync pattern confirmed
- Next.js hydration error documentation — SSR prevention pattern
- Nielsen Norman Group: Touch Target Size — 56px minimum for children

### Secondary (MEDIUM confidence)
- ChessKid.com — table stakes features, UX patterns for ages 5-9
- Magnus Kingdom of Chess (Dragonbox) reviews — single-piece introduction pattern
- ChessWorld (Alterman) — Google Play — progressive unlock pattern
- Lichess puzzle database (database.lichess.org) — FEN format, CC0 license confirmed
- Kingdom of Chess blog — cognitive load research on kids chess instruction

### Tertiary (LOW confidence — needs validation)
- WordReference Forums — Hebrew chess piece names (not from authoritative chess federation source)
- Community chess UX discussions — touch screen response problems (anecdotal, not study-based)

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
