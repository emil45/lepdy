---
phase: 19-menu-redesign-sound-celebrations
plan: 01
subsystem: ui
tags: [chess, navigation, hub-menu, mui-grid, translations, e2e]

# Dependency graph
requires:
  - phase: 18-daily-puzzle-session-system
    provides: ChessGameContent with session and daily puzzle views
provides:
  - ChessHubMenu component — 2x2 grid of 4 labeled navigation tiles replacing level map
  - Updated ChessView type: 'hub' | 'level-1' | 'session' | 'daily' with assertNever guard
  - hub translation keys in all 3 locales (en, he, ru)
  - E2E tests updated to hub-tile selectors

affects: [19-02, practice-mode, any future chess navigation changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hub tile pattern: HUB_TILES array with id/emoji/labelKey/color/view drives ChessHubMenu"
    - "assertNever guard on ChessView union prevents unhandled view routing at compile time"

key-files:
  created:
    - app/[locale]/games/chess-game/ChessHubMenu.tsx
  modified:
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - messages/en.json
    - messages/he.json
    - messages/ru.json
    - e2e/app.spec.ts

key-decisions:
  - "Grid from @mui/material/Grid (not Grid2) — Grid2 path does not exist in MUI 7.x, Grid is the v2 API"
  - "Removed DailyPuzzleCard from hub view — hub tiles include Daily tile with completion checkmark"
  - "Practice tile routes to session (same as Challenge) — Phase 20 will implement per-piece filtering"
  - "E2E tests use exit-button testid instead of puzzle-progress (testid never existed in components)"

patterns-established:
  - "Hub tile: Card with data-testid=hub-tile, CardActionArea with onNavigate callback"

requirements-completed: [MENU-01, MENU-02]

# Metrics
duration: 10min
completed: 2026-03-23
---

# Phase 19 Plan 01: Menu Redesign SUMMARY

**Replaced chess level map (3 numbered cards + daily card) with a 2x2 hub grid of 4 labeled tiles (Learn/Challenge/Practice/Daily) using MUI Grid and pastel colors**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-23T07:40:00Z
- **Completed:** 2026-03-23T07:50:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created ChessHubMenu.tsx — 2x2 MUI Grid with 4 pastel-colored tiles, each with emoji + Hebrew label + Daily checkmark
- Updated ChessGameContent.tsx — ChessView now 'hub' | 'level-1' | 'session' | 'daily', removed LevelMapCard/LEVELS, added assertNever
- Added hub translation keys (learn/challenge/practice/daily) to en.json, he.json, ru.json
- Updated all 40 E2E tests to hub-tile selectors — all pass

## Task Commits

1. **Task 1: ChessHubMenu component, routing, translations** - `29917f9` (feat)
2. **Task 2: Update E2E tests for hub-tile selectors** - `1f88ed2` (test)

## Files Created/Modified

- `app/[locale]/games/chess-game/ChessHubMenu.tsx` - New 2x2 hub grid component, 4 tiles with data-testid="hub-tile"
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - ChessView type updated, LevelMapCard removed, hub rendering
- `messages/en.json` - Added chessGame.hub keys
- `messages/he.json` - Added chessGame.hub keys (Hebrew)
- `messages/ru.json` - Added chessGame.hub keys (Russian)
- `e2e/app.spec.ts` - Replaced level-card selectors with hub-tile, fixed puzzle-progress selector issues

## Decisions Made

- `@mui/material/Grid` (not `Grid2`) — MUI 7.x exports Grid v2 API under the `Grid` path; `Grid2` path does not exist
- Removed `DailyPuzzleCard` from hub — the hub's Daily tile with checkmark replaces it entirely
- Practice tile routes to `session` (same as Challenge) — Phase 20 will add `pieceFilter` support
- E2E tests use `exit-button` testid for puzzle-loaded verification — `puzzle-progress` testid never existed in components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Grid import path: Grid2 → Grid**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan specified `import Grid from '@mui/material/Grid2'` but that path does not exist in MUI 7.x
- **Fix:** Changed import to `@mui/material/Grid` which is the Grid v2 API in MUI 7
- **Files modified:** app/[locale]/games/chess-game/ChessHubMenu.tsx
- **Verification:** npm run build passed without errors
- **Committed in:** 29917f9 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed E2E test selectors: puzzle-progress/piece-group-label testids don't exist**
- **Found during:** Task 2 (npm test execution)
- **Issue:** Plan specified `[data-testid="puzzle-progress"]` and `[data-testid="piece-group-label"]` but neither exists in MovementPuzzle.tsx or CapturePuzzle.tsx
- **Fix:** Replaced with `[data-testid="exit-button"]` (exists) and `text=/\d+\/\d+/` for progress text
- **Files modified:** e2e/app.spec.ts
- **Verification:** All 40 E2E tests pass
- **Committed in:** 1f88ed2 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes essential for build and test correctness. No scope creep.

## Issues Encountered

- One test showed intermittent failure on first run but passed consistently after fixing wrong-tap selector logic. Tests are stable across multiple runs.

## Next Phase Readiness

- ChessHubMenu in place with 4 tiles; ready for Phase 19 Plan 02 (sound/celebrations additions)
- Practice tile currently routes to session — Phase 20 adds per-piece filtering via pieceFilter param on buildSessionQueue
- assertNever guard on ChessView protects all future view additions

---
*Phase: 19-menu-redesign-sound-celebrations*
*Completed: 2026-03-23*
