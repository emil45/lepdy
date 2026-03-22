# Roadmap: Lepdy Chess

## Milestones

- ✅ **v1.0 Lepdy Chess** — Phases 1-6 (shipped 2026-03-22)
- 🚧 **v1.1 Polish & Fixes** — Phases 7-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Lepdy Chess (Phases 1-6) — SHIPPED 2026-03-22</summary>

- [x] Phase 1: Foundation (2/2 plans) — chess data, puzzles, i18n
- [x] Phase 2: Board Infrastructure (2/2 plans) — chess board component
- [x] Phase 3: Game Shell (2/2 plans) — level map, progress, games list
- [x] Phase 4: Level 1 — Piece Introduction (1/1 plan) — 6-piece walkthrough
- [x] Phase 5: Level 2 — Movement Puzzles (2/2 plans) — 18 tap-to-move puzzles
- [x] Phase 6: Level 3 — Capture Puzzles (2/2 plans) — 8 capture identification puzzles

**Total:** 6 phases, 11 plans, 33 requirements satisfied
**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Polish & Fixes (In Progress)

**Milestone Goal:** Fix v1.0 bugs and polish the chess game UI to match Lepdy's playful visual style

- [ ] **Phase 7: Bug Fixes & Cleanup** — Remove broken translation keys and orphaned v1.0 files
- [ ] **Phase 8: Navigation & UI Polish** — Consistent back navigation on all screens, RTL-aware controls, and Lepdy pastel styling with smooth transitions
- [ ] **Phase 9: Puzzle Animations** — Piece movement animation on correct puzzle answers
- [ ] **Phase 10: Sticker Integration** — Chess level completions earn stickers via the existing Lepdy sticker system

## Phase Details

### Phase 7: Bug Fixes & Cleanup
**Goal**: The chess game renders all text correctly and contains no orphaned code
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: FIX-01, FIX-02
**Success Criteria** (what must be TRUE):
  1. All chess piece names display their translated text (not raw key paths like "chessGame.chessPieces.king") in Hebrew, English, and Russian
  2. The codebase contains no references to ChessBoard.tsx, ChessBoardDynamic.tsx, or useChessGame.ts
  3. Unused translation keys under chessGame.ui.* are removed and the translation files still pass lint
**Plans:** 1 plan
Plans:
- [x] 07-01-PLAN.md — Fix translation key double-namespace and remove orphaned files/unused keys

### Phase 8: Navigation & UI Polish
**Goal**: Every chess game screen has consistent back navigation and Lepdy's playful visual style
**Depends on**: Phase 7
**Requirements**: NAV-01, NAV-02, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. A child can exit to the level map from any puzzle screen without using the browser back button
  2. A child can exit the piece introduction walkthrough at any point and return to the level map
  3. The chess game main page back button looks and behaves identically to the back button on other Lepdy game pages
  4. The Next/Back arrows in piece introduction point in the correct direction — left arrow advances in Hebrew (RTL), right arrow advances in English and Russian (LTR)
  5. The chess game uses Lepdy's pastel color palette with rounded cards and soft shadows, and screens transition with a smooth fade or slide instead of an instant swap
**Plans:** 2 plans
Plans:
- [ ] 08-01-PLAN.md — Add X exit buttons to all sub-screens and fix RTL arrow direction
- [ ] 08-02-PLAN.md — Apply Lepdy pastel styling with soft shadows and fade transitions

### Phase 9: Puzzle Animations
**Goal**: Correct puzzle answers show the piece physically moving to the target square before celebrating
**Depends on**: Phase 8
**Requirements**: PFEED-01, PFEED-02
**Success Criteria** (what must be TRUE):
  1. When a child taps the correct movement square, the selected piece visibly slides to that square before the celebration fires
  2. When a child taps the correct capturing piece, that piece visibly moves to the target square before the celebration fires
  3. The animation completes in under one second and does not block the next puzzle from loading
**Plans**: TBD

### Phase 10: Sticker Integration
**Goal**: Completing each chess level earns a sticker, visible in the Lepdy stickers collection
**Depends on**: Phase 9
**Requirements**: STICK-01
**Success Criteria** (what must be TRUE):
  1. Completing Level 1 (all 6 pieces introduced) awards a chess sticker visible in the Lepdy stickers page
  2. Completing Level 2 (all movement puzzles) awards a second chess sticker
  3. Completing Level 3 (all capture puzzles) awards a third chess sticker
  4. Stickers persist across browser sessions (localStorage) and are not re-awarded on replay
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-03-21 |
| 2. Board Infrastructure | v1.0 | 2/2 | Complete | 2026-03-21 |
| 3. Game Shell | v1.0 | 2/2 | Complete | 2026-03-21 |
| 4. Level 1 — Piece Introduction | v1.0 | 1/1 | Complete | 2026-03-22 |
| 5. Level 2 — Movement Puzzles | v1.0 | 2/2 | Complete | 2026-03-22 |
| 6. Level 3 — Capture Puzzles | v1.0 | 2/2 | Complete | 2026-03-22 |
| 7. Bug Fixes & Cleanup | v1.1 | 0/1 | Not started | - |
| 8. Navigation & UI Polish | v1.1 | 0/2 | Not started | - |
| 9. Puzzle Animations | v1.1 | 0/TBD | Not started | - |
| 10. Sticker Integration | v1.1 | 0/TBD | Not started | - |
