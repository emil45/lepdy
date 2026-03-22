# Roadmap: Lepdy Chess

## Overview

Six phases build the chess game bottom-up: first the data and translation keys that every component depends on, then the chess board rendering with all its tablet and RTL constraints resolved, then the navigation shell and progression system, then each of the three learning levels in sequence. Every phase delivers a coherent, testable capability before the next phase is built on top of it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Chess piece data, puzzle definitions, i18n keys, and audio file path stubs
- [ ] **Phase 2: Board Infrastructure** - Chess board component working correctly on tablet in Hebrew RTL locale
- [x] **Phase 3: Game Shell** - Routing, level map, progression system, and games list integration (completed 2026-03-21)
- [x] **Phase 4: Level 1 — Piece Introduction** - Each piece introduced individually with Hebrew name and optional audio (completed 2026-03-22)
- [ ] **Phase 5: Level 2 — Movement Puzzles** - Tap-to-move puzzles with legal move highlights, hints, and feedback
- [ ] **Phase 6: Level 3 — Capture Puzzles** - Capture identification puzzles completing the full learning arc

## Phase Details

### Phase 1: Foundation
**Goal**: All chess data structures, puzzle content, translation keys, and audio file path references exist and are ready for components to consume
**Depends on**: Nothing (first phase)
**Requirements**: INTG-03, INTG-06
**Success Criteria** (what must be TRUE):
  1. `chessPieces.ts` exists with all 6 pieces, Hebrew names, and audio file paths referencing `/public/audio/chess/he/*.mp3`
  2. Movement and capture puzzle data exists as static TypeScript with valid FEN positions for all 6 piece types
  3. All chess translation keys are present in `messages/he.json`, `messages/en.json`, and `messages/ru.json` with no missing keys
  4. Audio paths reference expected files even when the MP3 files themselves do not yet exist — game does not crash on missing audio
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Chess piece data, types, and i18n translations for all 3 locales
- [x] 01-02-PLAN.md — Movement and capture puzzle data with curated FEN positions

### Phase 2: Board Infrastructure
**Goal**: A chess board renders correctly on tablet in Hebrew RTL locale with touch-optimized square sizing and no SSR crash
**Depends on**: Phase 1
**Requirements**: BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06
**Success Criteria** (what must be TRUE):
  1. The board loads without a hydration crash in Next.js App Router (`next/dynamic` with `ssr: false` in place)
  2. Board squares are 56px or larger — a child's finger tap lands reliably on the intended square
  3. Board renders with correct file orientation (a-file on left) when the page locale is Hebrew RTL
  4. Tapping a piece on the board highlights all squares it can legally move to
  5. Interaction model is tap-select then tap-destination — no drag-and-drop required
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — Board component with useChessGame hook, react-chessboard rendering, and SSR-safe wrapper
- [x] 02-02-PLAN.md — Chess game page route, E2E test, and visual verification

### Phase 3: Game Shell
**Goal**: The chess game is reachable from the games list, has a working level map, and progress persists across sessions
**Depends on**: Phase 2
**Requirements**: INTG-01, INTG-02, INTG-04, INTG-05, PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):
  1. The chess game appears as a button on the `/games` list page, styled in Lepdy's visual language
  2. Navigating to the chess game shows a level map with Level 1 unlocked and Levels 2-3 locked
  3. The back button on the chess game navigates to `/games`
  4. Progress (which levels are completed) is saved to localStorage and survives a page reload
  5. Completing a level unlocks the next level on the map — locked levels cannot be entered
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md — useChessProgress hook, games list chess button, translation keys
- [x] 03-02-PLAN.md — Level map UI in ChessGameContent, E2E tests, visual verification

### Phase 4: Level 1 — Piece Introduction
**Goal**: A child can step through all 6 chess pieces, see each piece's image and Hebrew name, and hear the pronunciation
**Depends on**: Phase 3
**Requirements**: INTRO-01, INTRO-02, INTRO-03, INTRO-04
**Success Criteria** (what must be TRUE):
  1. Pieces are introduced one at a time in order: King, Rook, Bishop, Queen, Knight, Pawn
  2. Each introduction shows the piece image, Hebrew name text, and a button to play the pronunciation
  3. The game works fully when no audio MP3 files are present — missing audio does not crash or block progress
  4. Completing all 6 piece introductions marks Level 1 as done on the level map
**Plans**: 1 plan
Plans:
- [x] 04-01-PLAN.md — PieceIntroduction component, ChessGameContent wiring, E2E tests

### Phase 5: Level 2 — Movement Puzzles
**Goal**: A child can tap where a piece can move, receive immediate feedback, and get a hint if stuck — for all 6 piece types
**Depends on**: Phase 4
**Requirements**: MOVE-01, MOVE-02, MOVE-03, MOVE-04, MOVE-05, MOVE-06, FEED-01, FEED-02, FEED-03
**Success Criteria** (what must be TRUE):
  1. Each puzzle shows a single piece on an otherwise empty board — no cognitive overload from crowded positions
  2. Tapping a correct destination square triggers a celebration animation and cheerful sound
  3. Tapping a wrong square shows a gentle "try again" message with no buzzer and no score penalty
  4. After 2 wrong taps on the same puzzle, valid destination squares are highlighted as a hint
  5. Puzzles exist for all 6 piece types and no puzzle introduces timer pressure
**Plans**: TBD

### Phase 6: Level 3 — Capture Puzzles
**Goal**: A child can identify which piece on the board can capture a target piece, completing the full learning arc
**Depends on**: Phase 5
**Requirements**: CAPT-01, CAPT-02, CAPT-03, CAPT-04
**Success Criteria** (what must be TRUE):
  1. Each puzzle presents multiple pieces on the board and asks which piece can capture the highlighted target
  2. Selecting the correct capturing piece triggers celebration matching the Level 2 feedback pattern
  3. A wrong selection shows gentle feedback with a hint appearing after 2 wrong attempts
  4. All puzzles use hand-curated FEN positions — no special moves (castling, en passant, promotion) appear in any puzzle
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Planning complete | - |
| 2. Board Infrastructure | 1/2 | In Progress|  |
| 3. Game Shell | 2/2 | Complete   | 2026-03-21 |
| 4. Level 1 — Piece Introduction | 1/1 | Complete   | 2026-03-22 |
| 5. Level 2 — Movement Puzzles | 0/? | Not started | - |
| 6. Level 3 — Capture Puzzles | 0/? | Not started | - |
