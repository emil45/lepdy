# Roadmap: Lepdy Chess

## Milestones

- ✅ **v1.0 Lepdy Chess** — Phases 1-6 (shipped 2026-03-22)
- ✅ **v1.1 Polish & Fixes** — Phases 7-10 (shipped 2026-03-22)
- ✅ **v1.2 Board Facelift** — Phases 11-13 (shipped 2026-03-22)
- 🚧 **v1.3 Infinite Replayability** — Phases 14-18 (in progress)

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
**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Board Facelift (Phases 11-13) — SHIPPED 2026-03-22</summary>

- [x] **Phase 11: Board Theme** - Pastel board square colors and complementary coordinate labels
- [x] **Phase 12: Custom Piece SVGs** - Two kid-friendly SVG piece themes (staunty + horsey) via extensible theme architecture
- [x] **Phase 13: Theme Selector** - Settings drawer piece theme selector with localStorage persistence

**Total:** 3 phases, 4 plans
**Archive:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

### 🚧 v1.3 Infinite Replayability (In Progress)

**Milestone Goal:** Transform the chess game from a finite 3-level experience into an endlessly replayable learning game — random puzzles, escalating difficulty, structured sessions, and named mastery progression — so kids have a reason to return every time.

- [x] **Phase 14: Puzzle Pool Expansion** - Expand curated puzzles to 60+ movement and 30+ capture, tagged by difficulty tier (completed 2026-03-22)
- [x] **Phase 15: Generator + Progress Hook** - Build puzzle generator with dedup ring buffer and extend useChessProgress with difficulty bands and migration (completed 2026-03-22)
- [x] **Phase 16: Session Hook + Puzzle Refactor** - Wire usePuzzleSession into MovementPuzzle and CapturePuzzle, replacing linear puzzle array with infinite random stream (completed 2026-03-22)
- [x] **Phase 17: Session Complete + Progression UI** - Star-based session complete screen and named mastery band display (completed 2026-03-22)
- [ ] **Phase 18: Daily Featured Puzzle** - Date-seeded daily puzzle that is the same for all players each day

## Phase Details

### Phase 14: Puzzle Pool Expansion
**Goal**: Kids never run out of fresh puzzles because the data pool is large enough to support infinite random selection without repetition
**Depends on**: Phase 13
**Requirements**: PGEN-01, PGEN-02
**Success Criteria** (what must be TRUE):
  1. Movement puzzle pool contains 60+ puzzles with at least 10 puzzles in each of 3 difficulty tiers (easy/medium/hard)
  2. Capture puzzle pool contains 30+ puzzles with at least 10 puzzles in each of 3 difficulty tiers
  3. Every puzzle record has a difficulty field (1/2/3) and the existing board/targetSquare/validTargets shape is preserved
  4. Each pool position can be independently verified as solvable and unambiguous for a child age 5-9
**Plans**: 2 plans
Plans:
- [x] 14-01-PLAN.md — Validation script + capture-rook-1 bug fix
- [x] 14-02-PLAN.md — Author 42 movement + 22 capture puzzles

### Phase 15: Generator + Progress Hook
**Goal**: The game engine can randomly select puzzles at the right difficulty, skip recently seen puzzles, and remember how the player is progressing across sessions
**Depends on**: Phase 14
**Requirements**: PGEN-03, PGEN-04, DIFF-01, DIFF-02, DIFF-03
**Success Criteria** (what must be TRUE):
  1. User never sees the same puzzle twice within a 15-puzzle window in a session
  2. User sees the Hebrew piece name and pronunciation button on every randomly generated puzzle
  3. User encounters puzzles matching 3 difficulty tiers, with easy puzzles having fewer distractor squares than hard puzzles
  4. User who answers 5 consecutive puzzles correctly is automatically given harder puzzles in the next session
  5. User who answers 3 consecutive puzzles incorrectly is automatically given easier puzzles in the next session
  6. Returning user's existing level-completion progress is preserved after the hook migration (no data loss)
**Plans**: 2 plans
Plans:
- [x] 15-01-PLAN.md — Puzzle generator utility, progress hook, and feature flag config
- [x] 15-02-PLAN.md — Hebrew piece name + audio on MovementPuzzle and CapturePuzzle

### Phase 16: Session Hook + Puzzle Refactor
**Goal**: Kids play structured 10-puzzle sessions with a live streak counter, sourced entirely from the infinite random generator instead of a fixed ordered list
**Depends on**: Phase 15
**Requirements**: SESS-01, SESS-02
**Success Criteria** (what must be TRUE):
  1. User plays exactly 10 puzzles per session before seeing a session complete screen
  2. User sees a consecutive-correct counter update in real time during a session (e.g., "4 in a row!")
  3. User who navigates away and returns mid-session resumes without duplicate puzzles from that session
  4. Board rendering, FEN animation, square highlighting, and hint behavior are unchanged from v1.2
**Plans**: 2 plans
Plans:
- [x] 16-01-PLAN.md — usePuzzleSession hook, StreakBadge component, translation keys
- [ ] 16-02-PLAN.md — Refactor puzzle components to pure renderers, wire session into ChessGameContent

### Phase 17: Session Complete + Progression UI
**Goal**: Kids see a satisfying end-of-session reward and a named mastery level per piece that gives them a concrete goal to work toward
**Depends on**: Phase 16
**Requirements**: SESS-03, DIFF-04
**Success Criteria** (what must be TRUE):
  1. User sees a 1-3 star session complete screen after finishing 10 puzzles, with star count based on first-try accuracy
  2. User sees their current mastery band per piece type (e.g., "Rook Beginner", "Knight Expert") on the level map or within puzzle flow
  3. User sees "Getting harder!" feedback when their difficulty tier advances
  4. User can start a new session immediately from the session complete screen
**Plans**: 2 plans
Plans:
- [x] 17-01-PLAN.md — Hook extension (firstTryCount, tier forwarding) + Firebase flags + translation keys
- [x] 17-02-PLAN.md — SessionCompleteScreen component with stars, mastery chips, tier advancement, confetti

### Phase 18: Daily Featured Puzzle
**Goal**: Kids have a reason to return to the game every day because there is always a new featured puzzle waiting for them
**Depends on**: Phase 17
**Requirements**: SESS-04
**Success Criteria** (what must be TRUE):
  1. User sees the same daily featured puzzle as every other player on the same calendar day
  2. User can access the daily puzzle from the chess level map as a distinct entry point
  3. User who has already completed today's daily puzzle sees a "Come back tomorrow" state instead of being able to replay it
  4. Daily puzzle rotates at midnight and the next day's puzzle is different
**Plans**: 2 plans
Plans:
- [ ] 18-01-PLAN.md — [to be planned]
- [ ] 18-02-PLAN.md — [to be planned]

## Progress

**Execution Order:** 14 → 15 → 16 → 17 → 18

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
| 11. Board Theme | v1.2 | 1/1 | Complete | 2026-03-22 |
| 12. Custom Piece SVGs | v1.2 | 2/2 | Complete | 2026-03-22 |
| 13. Theme Selector | v1.2 | 1/1 | Complete | 2026-03-22 |
| 14. Puzzle Pool Expansion | v1.3 | 2/2 | Complete    | 2026-03-22 |
| 15. Generator + Progress Hook | v1.3 | 2/2 | Complete   | 2026-03-22 |
| 16. Session Hook + Puzzle Refactor | v1.3 | 1/2 | Complete    | 2026-03-22 |
| 17. Session Complete + Progression UI | v1.3 | 2/2 | Complete    | 2026-03-22 |
| 18. Daily Featured Puzzle | v1.3 | 0/? | Not started | - |
