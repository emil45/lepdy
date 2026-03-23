---
phase: 20-practice-mode
plan: 02
subsystem: ui
tags: [chess, practice-mode, wiring, react, mui, e2e, playwright, typescript]

# Dependency graph
requires:
  - phase: 20-01
    provides: usePracticeSession hook and PracticePicker component
  - phase: 19-menu-redesign-sound-celebrations
    provides: ChessHubMenu hub view with Practice tile, StreakBadge, SessionCompleteScreen
provides:
  - Practice mode fully wired into ChessGameContent — hub Practice tile opens piece picker, piece selection starts infinite practice loop
  - E2E smoke tests for practice mode (practice picker + piece selection)
affects: [PRAC-01, PRAC-02, PRAC-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aliased hook destructuring to avoid naming collisions (practicePuzzle, practiceStreak, practiceOnAnswer)"
    - "Dual useEffect pattern for streak milestones — one for challenge session, one for practice"
    - "practice-picker view as intermediary — hub -> picker -> practice, exit returns to picker (not hub)"

key-files:
  created: []
  modified:
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - app/[locale]/games/chess-game/ChessHubMenu.tsx
    - e2e/app.spec.ts

key-decisions:
  - "Exit from practice returns to practice-picker (not hub) — per locked PRAC-03 decision"
  - "Practice view has no progress counter and no session complete screen — infinite drill, no session cap"
  - "Shared showMilestoneConfetti state used for both session and practice streak effects"

patterns-established:
  - "Practice mode wiring: hub tile -> practice-picker view -> practice view, back navigates one level up"
  - "E2E practice tests use data-testid=practice-piece-card and data-testid=exit-button selectors"

requirements-completed: [PRAC-01, PRAC-02, PRAC-03]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 20 Plan 02: Wire Practice Mode and E2E Tests Summary

**ChessGameContent wired with two new views (practice-picker, practice) connecting usePracticeSession + PracticePicker into a fully functional infinite practice drill accessible from the hub menu**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23
- **Completed:** 2026-03-23
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Updated ChessView union type in both ChessGameContent.tsx and ChessHubMenu.tsx to include 'practice-picker' (and 'practice' in ChessGameContent)
- Wired Hub Practice tile to navigate to 'practice-picker' instead of 'session'
- Added usePracticeSession hook call with aliased destructuring to avoid collision with usePuzzleSession
- Added handlePracticeAnswer callback with SUCCESS/WRONG_ANSWER sound effects
- Added second useEffect for practice streak milestones (same STREAK_MILESTONES Set, same confetti logic)
- Added 'practice-picker' view block rendering PracticePicker with full navigation props
- Added 'practice' view block: renders MovementPuzzle or CapturePuzzle, no progress counter, no session complete screen, exit goes to 'practice-picker'
- TypeScript assertNever at bottom covers all 6 ChessView cases — TypeScript strict mode passes
- Added E2E smoke tests: 'practice picker shows 6 piece cards' and 'practice piece selection starts puzzle'
- All 42 E2E tests pass (40 existing + 2 new practice tests)
- Production build succeeded

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire practice views into ChessGameContent and update ChessHubMenu** - `4f806fd` (feat)
2. **Task 2: Add E2E smoke tests and verify build** - `97a941b` (feat)

## Files Created/Modified
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - Added practice-picker and practice view blocks, usePracticeSession hook call, handlePracticeAnswer, practice streak useEffect
- `app/[locale]/games/chess-game/ChessHubMenu.tsx` - Updated ChessView type and Practice tile to route to 'practice-picker'
- `e2e/app.spec.ts` - Added 'Chess practice mode' describe block with 2 practice tests

## Decisions Made
- Exit from practice returns to practice-picker (not hub) — per locked PRAC-03 decision from context
- Shared showMilestoneConfetti state for both challenge session and practice — avoids adding a second boolean state, both views are mutually exclusive (only one renders at a time)
- Practice view has no session complete screen — practice is infinite drilling, no session size cap

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data flows are wired. usePracticeSession provides real filtered puzzle pools from chessPuzzles data.

## Self-Check: PASSED

- FOUND: ChessGameContent.tsx
- FOUND: ChessHubMenu.tsx
- FOUND: app.spec.ts
- FOUND: 20-02-SUMMARY.md
- FOUND commit: 4f806fd (Task 1)
- FOUND commit: 97a941b (Task 2)

---
*Phase: 20-practice-mode*
*Completed: 2026-03-23*
