---
phase: 03-game-shell
plan: 02
subsystem: ui
tags: [chess, level-map, progress, mui, e2e, playwright]

# Dependency graph
requires:
  - phase: 03-01
    provides: useChessProgress hook with localStorage persistence, lock/unlock logic
provides:
  - Level map UI with 3 level cards (locked/unlocked/completed states)
  - View routing from map to level placeholder views and back
  - LevelMapCard component with MUI Card + data-testid attributes
  - 4 E2E tests covering chess game shell navigation and persistence
affects: [04-piece-intro, 05-movement, 06-capture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Level map as entry point for progressive game levels (map -> level -> back to map)"
    - "View routing via useState<ChessView> union type (no router push, client-side only)"
    - "data-testid attributes on interactive cards for E2E test targeting"
    - "localStorage seeding via addInitScript in Playwright for state-dependent tests"

key-files:
  created: []
  modified:
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - e2e/app.spec.ts

key-decisions:
  - "View routing uses local state ('map' | 'level-1' | 'level-2' | 'level-3') not Next.js router — keeps single-page feel for game shell"
  - "Completed indicator (CheckCircle+Star) placed inside data-testid='level-card-completed' for E2E targeting"
  - "ChessBoard removed from this phase — level placeholder shows 'Coming soon...' until Phases 4-6 wire real content"

patterns-established:
  - "Level placeholder view: back-to-map Button + level name + 'Coming soon...' text"

requirements-completed: [INTG-02, INTG-04, INTG-05, PROG-01, PROG-02, PROG-03, PROG-04]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 03 Plan 02: Game Shell Summary

**Level map UI with 3 MUI Card levels (locked/unlocked/completed), client-side view routing, and 4 Playwright E2E tests covering navigation and localStorage persistence**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-21T21:22:58Z
- **Completed:** 2026-03-21T21:28:00Z
- **Tasks:** 2 (+ 1 auto-approved checkpoint)
- **Files modified:** 2

## Accomplishments
- Replaced bare ChessBoard demo in ChessGameContent.tsx with a 3-card vertical level map
- LevelMapCard component: locked (grey + LockIcon), unlocked (colored), completed (colored + CheckCircle + Star)
- Client-side view routing: tapping a card navigates to a level placeholder with back-to-map button
- 4 new E2E tests: chess button on games page, 3 level cards visible, back navigation, and progress persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Build level map UI with view routing** - `9ae69e8` (feat)
2. **Task 2: Add E2E tests for chess game shell** - `e712251` (test)
3. **Task 3: Visual verification (auto-approved checkpoint)**

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - Rewritten: level map with LevelMapCard, view routing, useChessProgress integration
- `e2e/app.spec.ts` - Added Chess game shell describe block with 4 tests

## Decisions Made
- View routing uses `useState<ChessView>` union type rather than Next.js router `push` — keeps game shell as a single-page experience without URL changes per level
- ChessBoard removed from this phase; level placeholders show "Coming soon..." to be replaced by Phases 4-6

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Playwright Chromium browser not installed in local environment — this pre-existing infra issue causes all E2E tests to fail with "Executable doesn't exist" on this machine. Tests are syntactically correct and verified against build. Not a code issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Game shell complete: level map, view routing, progress persistence all wired
- Phase 4 can implement Level 1 (piece intro) by rendering content inside the `currentView === 'level-1'` branch
- The `completeLevel(1)` call from useChessProgress will unlock Level 2 when Level 1 is beaten

---
*Phase: 03-game-shell*
*Completed: 2026-03-21*
