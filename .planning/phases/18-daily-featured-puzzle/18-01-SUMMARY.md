---
phase: 18-daily-featured-puzzle
plan: 01
subsystem: ui
tags: [chess, hooks, localStorage, i18n, next-intl, mui]

# Dependency graph
requires:
  - phase: 14-puzzle-pool-expansion
    provides: movementPuzzles and capturePuzzles arrays in data/chessPuzzles.ts
provides:
  - useDailyPuzzle hook with deterministic date-seeded puzzle selection and localStorage completion tracking
  - DailyPuzzleCard component with available/completed visual states
  - chessGame.daily translation keys in he/en/ru
affects: [18-02-wire-daily-puzzle-into-map]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - djb2-style polynomial hash for deterministic date-to-puzzle mapping
    - Date-keyed localStorage key prefix pattern (lepdy_chess_daily_YYYY-MM-DD)

key-files:
  created:
    - hooks/useDailyPuzzle.ts
    - app/[locale]/games/chess-game/DailyPuzzleCard.tsx
  modified:
    - messages/en.json
    - messages/he.json
    - messages/ru.json

key-decisions:
  - "getDailyPuzzle is a pure function — no React, no side effects, fully deterministic for same dateStr input"
  - "useEffect for localStorage read (not lazy initializer) to avoid react-hooks/set-state-in-effect lint error"
  - "DailyPuzzleCard disabled (not hidden) when completed — users see the card but cannot re-enter"

patterns-established:
  - "Daily puzzle storage key: lepdy_chess_daily_YYYY-MM-DD (date-keyed, auto-expires semantically)"

requirements-completed: [SESS-04]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 18 Plan 01: Daily Featured Puzzle — Hook and Card Summary

**Date-seeded daily puzzle hook (djb2 hash) and warm-orange DailyPuzzleCard with completion tracking via date-keyed localStorage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T21:43:33Z
- **Completed:** 2026-03-22T21:45:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `useDailyPuzzle` hook exporting `getDailyPuzzle` (pure, deterministic), `getTodayUTC`, and `useDailyPuzzle` hook with completion tracking
- Created `DailyPuzzleCard` component matching LevelMapCard visual structure — warm orange (#ffb74d), calendar emoji, CheckCircleIcon when done, disabled when completed
- Added `chessGame.daily` translation keys to all 3 locale files (he/en/ru)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useDailyPuzzle hook and DailyPuzzleCard component** - `1e3fc93` (feat)
2. **Task 2: Add daily puzzle translation keys to all 3 locales** - `6b0208f` (feat)

## Files Created/Modified
- `hooks/useDailyPuzzle.ts` - Date-seeded puzzle selection hook with localStorage completion tracking
- `app/[locale]/games/chess-game/DailyPuzzleCard.tsx` - Level-map card for daily puzzle entry point
- `messages/en.json` - Added chessGame.daily.{label,comeBackTomorrow,completed}
- `messages/he.json` - Added chessGame.daily with Hebrew translations
- `messages/ru.json` - Added chessGame.daily with Russian translations

## Decisions Made
- `getDailyPuzzle` is a pure function — callers can test it without mocking React or storage
- Used `useEffect` (not lazy initializer) to read localStorage to satisfy `react-hooks/set-state-in-effect` lint rule — same pattern as useChessProgress
- `DailyPuzzleCard` takes `dateLabel` as a pre-formatted string prop so parent controls formatting per locale

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed setState from lazy initializer to avoid react-hooks/set-state-in-effect lint error**
- **Found during:** Task 1 (useDailyPuzzle.ts)
- **Issue:** Original code had both lazy initializer AND a useEffect calling setIsCompleted synchronously — the lint rule `react-hooks/set-state-in-effect` flags synchronous setState calls inside effects
- **Fix:** Initialized state to `false`, used single useEffect to read localStorage on mount (matches useChessProgress.ts pattern)
- **Files modified:** hooks/useDailyPuzzle.ts
- **Verification:** `npx eslint hooks/useDailyPuzzle.ts` — 0 errors
- **Committed in:** 1e3fc93 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix required for lint compliance; behavior identical to plan spec.

## Issues Encountered
None beyond the lint fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useDailyPuzzle` hook ready to wire into ChessGameContent in Plan 02
- `DailyPuzzleCard` ready to render above LEVELS in the level map
- Translation keys in place for all 3 locales

---
*Phase: 18-daily-featured-puzzle*
*Completed: 2026-03-22*
