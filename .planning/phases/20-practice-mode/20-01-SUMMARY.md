---
phase: 20-practice-mode
plan: 01
subsystem: ui
tags: [chess, practice-mode, hooks, react, mui, next-intl, typescript]

# Dependency graph
requires:
  - phase: 19-menu-redesign-sound-celebrations
    provides: ChessHubMenu hub view with Practice tile wired to a view transition
  - phase: 18-puzzle-session-system
    provides: usePuzzleSession, usePuzzleProgress, puzzleGenerator, SessionPuzzle type
  - phase: 17-puzzle-data-foundation
    provides: chessPuzzles data (movementPuzzles, capturePuzzles), chessPieces data
provides:
  - usePracticeSession hook — infinite practice loop for a single filtered piece, no sessionStorage
  - PracticePicker component — 2x3 grid of piece cards with SVG, Hebrew name, mastery band, audio on tap
affects: [20-02-PLAN.md, ChessGameContent.tsx wiring of practice view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dedicated practice hook (separate file) avoids modifying tested challenge session hook"
    - "buildPracticeBatch generates filtered puzzle pool per piece with graceful empty-pool handling"
    - "Continuous loop: batch exhausted triggers fresh buildPracticeBatch, no session size cap"
    - "PracticePicker follows ChessHubMenu layout pattern (Grid size=4 for 3 columns)"

key-files:
  created:
    - hooks/usePracticeSession.ts
    - app/[locale]/games/chess-game/PracticePicker.tsx
  modified: []

key-decisions:
  - "Separate usePracticeSession hook (not a parameter on usePuzzleSession) — avoids challenge session corruption, matches research recommendation"
  - "buildPracticeBatch falls back to all-movement if no capture puzzles for piece — guards infinite loop"
  - "Single-tap plays Hebrew audio AND selects piece — one-tap flow per locked PRAC-03 decision"
  - "Duplicate getBandKey/getTierColor helpers locally — extraction to shared file is optional cleanup deferred to later"

patterns-established:
  - "Practice-mode hook pattern: filtered pool + continuous batch loop with no sessionStorage"
  - "Piece picker grid: Grid size=4 (3 columns) with Card/CardActionArea pattern from ChessHubMenu"

requirements-completed: [PRAC-01, PRAC-02, PRAC-03]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 20 Plan 01: Practice Session Hook and Piece Picker Summary

**usePracticeSession hook filters puzzle pools to a single piece and loops infinitely, paired with PracticePicker 2x3 grid showing SVG pieces, Hebrew names, mastery bands, and one-tap audio+select**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T06:54:49Z
- **Completed:** 2026-03-23T06:56:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `usePracticeSession` hook that filters movementPuzzles/capturePuzzles to a single piece ID, generates batches of 3 movement + 2 capture puzzles, and loops continuously with no session-size cap and zero sessionStorage writes
- Created `PracticePicker` component with 2x3 MUI Grid of piece cards — each card shows SVG piece image, Hebrew name, mastery band Chip, and plays audio + calls onSelectPiece in a single tap
- Both files compile cleanly with TypeScript strict mode, no new lint errors introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Create usePracticeSession hook** - `28dd672` (feat)
2. **Task 2: Create PracticePicker component** - `320986d` (feat)

## Files Created/Modified
- `hooks/usePracticeSession.ts` - Practice-mode hook with single-piece filtered puzzle pool and continuous batch loop
- `app/[locale]/games/chess-game/PracticePicker.tsx` - 2x3 piece selection grid with SVG, Hebrew name, mastery band, audio on tap

## Decisions Made
- Separate hook file (not modifying usePuzzleSession) — preserves tested challenge session behavior and prevents sessionStorage corruption
- buildPracticeBatch gracefully handles empty capture pools (pawn has no capture puzzles in early data) by filling all 5 slots with movement puzzles
- getBandKey/getTierColor duplicated locally (same as SessionCompleteScreen) — extraction deferred, not required for this phase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Worktree was 83 commits behind main at start — merged main via fast-forward before reading source files. No conflict.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `usePracticeSession` and `PracticePicker` are both ready to wire into ChessGameContent in Plan 02
- Plan 02 needs to: add 'practice' and 'practice-picker' to ChessView union, route hub Practice tile to PracticePicker, connect PracticePicker.onSelectPiece to startPractice, render puzzle session view with practice hook

---
*Phase: 20-practice-mode*
*Completed: 2026-03-23*
