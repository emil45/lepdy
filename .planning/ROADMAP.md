# Roadmap: Lepdy Chess

## Milestones

- ✅ **v1.0 Lepdy Chess** — Phases 1-6 (shipped 2026-03-22)
- ✅ **v1.1 Polish & Fixes** — Phases 7-10 (shipped 2026-03-22)
- 🚧 **v1.2 Board Facelift** — Phases 11-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Lepdy Chess (Phases 1-6) — SHIPPED 2026-03-22</summary>

- [x] **Phase 1: Foundation** - Chess piece data, puzzle data, i18n translations
- [x] **Phase 2: Board Infrastructure** - Interactive chess board component
- [x] **Phase 3: Game Shell** - Level map, progress hook, games list integration
- [x] **Phase 4: Level 1 — Piece Introduction** - 6-piece Hebrew walkthrough with audio
- [x] **Phase 5: Level 2 — Movement Puzzles** - 18 tap-to-move puzzles
- [x] **Phase 6: Level 3 — Capture Puzzles** - 8 capture identification puzzles

**Total:** 6 phases, 11 plans
**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Polish & Fixes (Phases 7-10) — SHIPPED 2026-03-22</summary>

- [x] **Phase 7: Bug Fixes & Cleanup** - Fix translation double-namespace, remove orphaned files
- [x] **Phase 8: Navigation & UI Polish** - Exit buttons, RTL arrows, pastel styling, fade transitions
- [x] **Phase 9: Puzzle Animations** - Piece slide animation on correct puzzle answers
- [x] **Phase 10: Sticker Integration** - 3 chess stickers wired into Lepdy sticker collection

**Total:** 4 phases, 5 plans

</details>

### 🚧 v1.2 Board Facelift (In Progress)

**Milestone Goal:** Replace the default react-chessboard visuals with Lepdy's playful pastel style — custom board colors and kid-friendly SVG chess pieces with a theme selector

- [ ] **Phase 11: Board Theme** - Pastel board square colors and complementary coordinate labels
- [ ] **Phase 12: Custom Piece SVGs** - Two kid-friendly SVG piece themes (staunty + horsey) via an extensible theme architecture
- [ ] **Phase 13: Theme Selector** - Settings drawer piece theme selector with localStorage persistence

## Phase Details

### Phase 11: Board Theme
**Goal**: The chess board uses Lepdy's pastel color palette instead of the default brown/beige squares
**Depends on**: Phase 10
**Requirements**: BOARD-01, BOARD-02
**Success Criteria** (what must be TRUE):
  1. The board's light squares and dark squares use a pastel color pair from Lepdy's existing palette (not the default tan/brown)
  2. The board coordinate labels (a-h, 1-8) are visible and use a color that complements the new pastel squares without clashing
  3. The board looks visually consistent with the surrounding chess game UI (cards, buttons, backgrounds)
**Plans**: TBD

Plans:
- [ ] 11-01: Apply pastel square colors and coordinate label color to the chess board

### Phase 12: Custom Piece SVGs
**Goal**: All chess pieces use kid-friendly SVG designs sourced from lichess, delivered through an extensible theme architecture that makes adding future themes trivial
**Depends on**: Phase 11
**Requirements**: PIECE-01, PIECE-02, PIECE-03, PIECE-04
**Success Criteria** (what must be TRUE):
  1. All 12 pieces (6 white + 6 black) render using the staunty SVG theme from lichess — the default react-chessboard pieces are no longer visible
  2. All 12 pieces (6 white + 6 black) render using the horsey SVG theme from lichess when horsey is selected
  3. Piece SVGs render without clipping or distortion at 320px board width (smallest supported) and 480px board width (largest supported)
  4. A child can tell each piece type apart at both board sizes — pieces are visually distinct
  5. Adding a third piece theme requires only dropping SVGs into a folder and adding a single theme registration entry — no other code changes
**Plans**: TBD

Plans:
- [ ] 12-01: Build extensible piece theme architecture and integrate staunty SVGs
- [ ] 12-02: Add horsey SVGs as a second registered theme and verify responsive rendering

### Phase 13: Theme Selector
**Goal**: Users can choose their preferred piece theme from within the chess game and the choice is remembered
**Depends on**: Phase 12
**Requirements**: SET-01, SET-02
**Success Criteria** (what must be TRUE):
  1. The chess game settings drawer contains a piece theme selector that lists all available themes (staunty, horsey)
  2. Tapping a theme in the selector immediately switches the pieces on the board
  3. After closing and reopening the chess game (or refreshing the browser), the previously selected theme is still active
**Plans**: TBD

Plans:
- [ ] 13-01: Add piece theme selector to chess game settings drawer with localStorage persistence

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-03-21 |
| 2. Board Infrastructure | v1.0 | 2/2 | Complete | 2026-03-21 |
| 3. Game Shell | v1.0 | 2/2 | Complete | 2026-03-21 |
| 4. Level 1 — Piece Introduction | v1.0 | 1/1 | Complete | 2026-03-22 |
| 5. Level 2 — Movement Puzzles | v1.0 | 2/2 | Complete | 2026-03-22 |
| 6. Level 3 — Capture Puzzles | v1.0 | 2/2 | Complete | 2026-03-22 |
| 7. Bug Fixes & Cleanup | v1.1 | 1/1 | Complete | 2026-03-22 |
| 8. Navigation & UI Polish | v1.1 | 2/2 | Complete | 2026-03-22 |
| 9. Puzzle Animations | v1.1 | 1/1 | Complete | 2026-03-22 |
| 10. Sticker Integration | v1.1 | 1/1 | Complete | 2026-03-22 |
| 11. Board Theme | v1.2 | 0/1 | Not started | - |
| 12. Custom Piece SVGs | v1.2 | 0/2 | Not started | - |
| 13. Theme Selector | v1.2 | 0/1 | Not started | - |
