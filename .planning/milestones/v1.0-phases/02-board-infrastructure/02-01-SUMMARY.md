---
phase: 02-board-infrastructure
plan: 01
subsystem: ui
tags: [react-chessboard, chess.js, chess, game-component, ssr-safe]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Chess piece data types (ChessPieceId, ChessPieceConfig)
provides:
  - Interactive ChessBoard component with tap-select interaction and legal move highlights
  - ChessBoardDynamic SSR-safe wrapper via next/dynamic
  - useChessGame hook for chess game state management
affects: [03-game-shell, 04-level-one, 05-movement-puzzles, 06-capture-puzzles]

# Tech tracking
tech-stack:
  added: [react-chessboard@5.10.0, chess.js@1.4.0]
  patterns: [ref-based game state with FEN state for renders, ResizeObserver responsive sizing, options-based Chessboard API v5]

key-files:
  created:
    - components/chess/useChessGame.ts
    - components/chess/ChessBoard.tsx
    - components/chess/ChessBoardDynamic.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used ref-based Chess instance with separate FEN state to avoid recreating Chess objects on every render"
  - "Added legalCaptures state to useChessGame hook to avoid accessing ref during render (React lint compliance)"
  - "react-chessboard v5 uses options prop pattern, not flat props — adapted from plan's v4 API"

patterns-established:
  - "Chess component pattern: useChessGame hook + ChessBoard component + ChessBoardDynamic wrapper"
  - "Game state via useRef + useState(fen) for immutable render cycle"

requirements-completed: [BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06]

# Metrics
duration: 4min
completed: 2026-03-21
---

# Phase 02 Plan 01: Board Infrastructure Summary

**Interactive chess board with react-chessboard v5 and chess.js, featuring tap-select interaction, green dot/ring legal move highlights, responsive sizing (448-480px), RTL isolation, and SSR-safe dynamic loading**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-21T20:35:32Z
- **Completed:** 2026-03-21T20:39:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed react-chessboard v5.10.0 and chess.js v1.4.0
- Created useChessGame hook with full game state management: selection, legal moves, captures, move execution, reset
- Created ChessBoard component with responsive sizing, RTL isolation, tap interaction, and move highlighting
- Created ChessBoardDynamic SSR-safe wrapper with loading placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-chessboard and chess.js, create useChessGame hook** - `b42e688` (feat)
2. **Task 2: Create ChessBoard component and SSR-safe dynamic wrapper** - `225ae28` (feat)

## Files Created/Modified
- `components/chess/useChessGame.ts` - Custom hook encapsulating chess.js game state with selection, legal moves, captures, move execution, and reset
- `components/chess/ChessBoard.tsx` - Interactive board component with responsive sizing, RTL isolation, tap-select, and move highlights
- `components/chess/ChessBoardDynamic.tsx` - SSR-safe dynamic import wrapper with aspect-ratio placeholder
- `package.json` - Added react-chessboard and chess.js dependencies
- `package-lock.json` - Lockfile updated

## Decisions Made
- Used ref-based Chess instance (useRef) with separate FEN state (useState) to trigger React re-renders without recreating Chess objects — better performance and avoids stale closure issues
- Added `legalCaptures` array to useChessGame state to track capture squares separately, avoiding the need to access the Chess ref during render (which violates React hooks lint rules)
- Adapted to react-chessboard v5 API which uses `options` prop object instead of flat props, `allowDragging` instead of `arePiecesDraggable`, and `squareStyles` instead of `customSquareStyles`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted to react-chessboard v5 API**
- **Found during:** Task 2 (ChessBoard component)
- **Issue:** Plan specified v4-style flat props (position, arePiecesDraggable, customSquareStyles, animationDuration) but react-chessboard v5.10.0 uses options prop pattern with different property names
- **Fix:** Wrapped all props in `options={{}}`, renamed to v5 API: `allowDragging`, `squareStyles`, `animationDurationInMs`, `onSquareClick` receives `{piece, square}` not just `square`
- **Files modified:** components/chess/ChessBoard.tsx
- **Verification:** TypeScript compiles, ESLint passes
- **Committed in:** 225ae28 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed ref access during render**
- **Found during:** Task 2 (ESLint check)
- **Issue:** `gameState.game.get(sq)` accessed ref during render via useMemo, violating react-hooks/refs lint rule
- **Fix:** Added `legalCaptures` state to useChessGame hook, computed from verbose move data at selection time, used in ChessBoard instead of direct ref access
- **Files modified:** components/chess/useChessGame.ts, components/chess/ChessBoard.tsx
- **Verification:** ESLint passes with no errors on all chess files
- **Committed in:** 225ae28 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct API usage and lint compliance. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ChessBoard and ChessBoardDynamic are ready to be composed into game UIs in Phases 4-6
- useChessGame hook provides full game state interface for level/puzzle logic
- Next plan (02-02) can build on these components

## Known Stubs
None - all components are fully functional with real chess logic.

---
*Phase: 02-board-infrastructure*
*Completed: 2026-03-21*
