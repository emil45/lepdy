---
phase: 16-session-hook-puzzle-refactor
plan: 01
subsystem: ui
tags: [react, hooks, sessionStorage, mui, next-intl, chess]

# Dependency graph
requires:
  - phase: 15-generator-progress-hook
    provides: usePuzzleProgress hook with getSessionTier/recordCorrect/recordWrong
  - phase: 14-puzzle-pool-expansion
    provides: movementPuzzles and capturePuzzles data arrays
provides:
  - usePuzzleSession hook — 10-puzzle session queue with streak tracking and sessionStorage persistence
  - StreakBadge component — animated bounce badge displaying consecutive correct answers
  - Translation keys for session UI (sessionComplete, inARow, puzzleProgress, newSession) in all 3 locales
affects: [16-02-wire-session-hook, puzzle components, ChessGameContent]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sessionStorage ID-only persistence: store puzzle IDs, resolve to objects on hydration, discard if any ID lookup fails"
    - "Functional setState for streak counter to avoid stale closure: setConsecutiveCorrect(prev => correct ? prev + 1 : 0)"
    - "key={count} on animated Box to re-trigger CSS animation on each streak increment"
    - "direction: ltr wrapper on StreakBadge to prevent RTL text reversal"

key-files:
  created:
    - hooks/usePuzzleSession.ts
    - app/[locale]/games/chess-game/StreakBadge.tsx
  modified:
    - messages/he.json
    - messages/en.json
    - messages/ru.json

key-decisions:
  - "Session queue builds 5 movement + 5 capture interleaved — movement slots rotate through king/rook/bishop/queen/knight by order, capture slots pick random piece"
  - "sessionStorage stores only IDs not full puzzle objects — avoids stale data if puzzle pool changes"
  - "completeLevel NOT called in usePuzzleSession — wired by Plan 02 in ChessGameContent to avoid premature level completion"
  - "StreakBadge returns null at count < 2 — showing '1 in a row' feels odd per user decision"
  - "getSessionTier excluded from mount useEffect deps — session-frozen by design, same pattern as usePuzzleProgress"

patterns-established:
  - "sessionStorage persistence: serialize as IDs, hydrate by lookup, discard-on-miss strategy"
  - "Streak badge re-animation: key={count} trick from counting-game pattern"

requirements-completed: [SESS-01, SESS-02]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 16 Plan 01: Session Hook and Streak Badge Summary

**usePuzzleSession hook with 10-puzzle queue, sessionStorage persistence, and StreakBadge component with bounce animation using functional setState for streak tracking**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T20:42:00Z
- **Completed:** 2026-03-22T20:42:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created usePuzzleSession hook generating exactly 10 puzzles per session (5 movement + 5 capture interleaved)
- sessionStorage persistence stores only puzzle IDs, hydrates on mount with null-check discard strategy
- Streak counter uses functional setState (`prev => correct ? prev + 1 : 0`) to avoid stale closures
- Created StreakBadge with MUI keyframes bounce animation, re-triggered via `key={count}` pattern
- Added 4 translation keys (sessionComplete, inARow, puzzleProgress, newSession) to all 3 locale files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create usePuzzleSession hook** - `88147ee` (feat)
2. **Task 2: Create StreakBadge component and add translation keys** - `5113dc5` (feat)

## Files Created/Modified
- `hooks/usePuzzleSession.ts` - Session queue manager: 10-puzzle generation, sessionStorage persistence, streak tracking
- `app/[locale]/games/chess-game/StreakBadge.tsx` - Animated streak counter badge, renders at count >= 2
- `messages/he.json` - Added sessionComplete, inARow, puzzleProgress, newSession keys
- `messages/en.json` - Added sessionComplete, inARow, puzzleProgress, newSession keys
- `messages/ru.json` - Added sessionComplete, inARow, puzzleProgress, newSession keys

## Decisions Made
- getSessionTier deliberately excluded from mount useEffect dependency array — session-frozen tiers are the intended behavior; re-running on tier change would defeat the purpose
- completeLevel not called in usePuzzleSession — Plan 02 wires this in ChessGameContent where level context is available
- StreakBadge returns null at count < 2 — consistent with user decision that "1 in a row" feels odd

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` shows pre-existing failures in `.claude/get-shit-done/` CJS files and worktree agent files — not caused by this plan's changes. Both new files (usePuzzleSession.ts and StreakBadge.tsx) lint cleanly in isolation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- usePuzzleSession and StreakBadge are complete and ready to be wired in Plan 02
- Plan 02 needs to: import usePuzzleSession in MovementPuzzle/CapturePuzzle or ChessGameContent, wire onAnswer, display StreakBadge with consecutiveCorrect, show session progress and completion screen
- No blockers

---
*Phase: 16-session-hook-puzzle-refactor*
*Completed: 2026-03-22*
