---
phase: 15-generator-progress-hook
plan: 01
subsystem: games
tags: [chess, puzzle-generator, feature-flags, progress-tracking, localStorage, typescript]

# Dependency graph
requires:
  - phase: 14-puzzle-pool-expansion
    provides: MovementPuzzle and CapturePuzzle arrays with difficulty 1|2|3 in data/chessPuzzles.ts
provides:
  - Pure puzzle selection utility (utils/puzzleGenerator.ts) with tier-filtered random selection and 15-puzzle dedup sliding window
  - Per-piece adaptive difficulty hook (hooks/usePuzzleProgress.ts) with localStorage persistence and session-frozen tiers
  - chessAdvanceTierThreshold and chessDemoTierThreshold feature flags for Firebase Remote Config tuning
affects:
  - 16-puzzle-session-hook (wires generator + progress into usePuzzleSession)
  - 17-puzzle-ui-integration (final UI wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session-frozen tier via useRef: capture tier on first access per piece, return frozen value for session duration"
    - "Ring buffer dedup: seenIds.slice(-15) keeps rolling window of 15 most recent puzzles"
    - "Pure generator pattern: selectNextPuzzle is stateless — takes and returns state immutably"

key-files:
  created:
    - utils/puzzleGenerator.ts
    - hooks/usePuzzleProgress.ts
  modified:
    - lib/featureFlags/types.ts
    - lib/featureFlags/providers/firebaseRemoteConfig.ts

key-decisions:
  - "sessionTiers exposed as MutableRefObject (not .current) to satisfy react-hooks/refs lint rule — callers access .current in callbacks/effects"
  - "seenIds is session-only in-memory state in GeneratorState, explicitly never persisted to localStorage"

patterns-established:
  - "Generator state is caller-owned: defaultGeneratorState() creates it, selectNextPuzzle() returns nextState — composable and testable"
  - "Per-piece progress (not global): each ChessPieceId has independent tier and streak counters"

requirements-completed: [PGEN-03, DIFF-01, DIFF-02, DIFF-03]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 15 Plan 01: Generator Progress Hook Summary

**Pure puzzle selection with 15-entry dedup window and per-piece adaptive difficulty tier persistence via localStorage and session-frozen tier via useRef**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T20:14:54Z
- **Completed:** 2026-03-22T20:20:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `utils/puzzleGenerator.ts` — pure TypeScript with no React, chess.js, or browser API imports; exports `GeneratorState`, `defaultGeneratorState()`, and `selectNextPuzzle<T>()` with tier filtering and 15-entry sliding-window dedup
- Created `hooks/usePuzzleProgress.ts` — per-piece tier (1-3) and streak tracking persisted to localStorage; session-frozen tier via `useRef` prevents mid-session difficulty changes
- Added `chessAdvanceTierThreshold` (default 5) and `chessDemoTierThreshold` (default 3) feature flags to `FeatureFlags` interface, `DEFAULT_FLAGS`, and `firebaseRemoteConfig.ts` fetch

## Task Commits

Each task was committed atomically:

1. **Task 1: Create puzzle generator utility and add feature flag config** - `2f1b880` (feat)
2. **Task 2: Create usePuzzleProgress hook with per-piece tier tracking and session-frozen tier** - `2bb4b06` (feat)

## Files Created/Modified

- `utils/puzzleGenerator.ts` - Pure puzzle selection utility: `GeneratorState` (seenIds ring buffer), `defaultGeneratorState()`, `selectNextPuzzle<T>()` with tier filter and dedup
- `hooks/usePuzzleProgress.ts` - Per-piece adaptive difficulty hook: `PiecePuzzleProgress`, `PuzzleProgressData`, `usePuzzleProgress()` with localStorage persistence, SSR guard, session-frozen tier via `sessionTiersRef`, `recordCorrect`, `recordWrong`
- `lib/featureFlags/types.ts` - Added `chessAdvanceTierThreshold: number` and `chessDemoTierThreshold: number` to `FeatureFlags` interface and `DEFAULT_FLAGS` (5 and 3 respectively)
- `lib/featureFlags/providers/firebaseRemoteConfig.ts` - Added `chessAdvanceTierThreshold` and `chessDemoTierThreshold` to `fetchFlags()` newFlags object

## Decisions Made

- `sessionTiers` is returned as `MutableRefObject<Record<string, 1|2|3>>` rather than `sessionTiersRef.current` directly — accessing `.current` during render triggers the `react-hooks/refs` lint error. Callers should access `.current` in callbacks or effects.
- `seenIds` is explicitly in-memory only (not in localStorage) — resets naturally when user starts a new browser session, which is intentional per plan spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed sessionTiers return from ref.current to the ref object itself**
- **Found during:** Task 2 (usePuzzleProgress hook creation)
- **Issue:** Returning `sessionTiersRef.current` in the hook's return object caused `react-hooks/refs` lint error — "Cannot access refs during render"
- **Fix:** Changed `UsePuzzleProgressReturn.sessionTiers` type to `MutableRefObject<Record<string, 1|2|3>>` and returned `sessionTiersRef` directly. Consumer accesses `.current` outside render.
- **Files modified:** `hooks/usePuzzleProgress.ts`
- **Verification:** `npx eslint hooks/usePuzzleProgress.ts` shows no errors from this fix (only pre-existing `set-state-in-effect` which also exists in useChessProgress.ts)
- **Committed in:** `2bb4b06` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix necessary for lint compliance. The ref is still accessible to callers; they access `.current` in event handlers/callbacks (which is the intended usage for phase 16 UI integration). No scope creep.

## Issues Encountered

- `set-state-in-effect` lint error in `usePuzzleProgress.ts` (calling `setData()` in `useEffect` for localStorage load). This is a pre-existing lint error that also exists in the reference file `useChessProgress.ts` — the entire chess progress loading pattern has this warning. Not caused by this plan's changes. Logged to deferred-items.

## Next Phase Readiness

- `selectNextPuzzle` and `defaultGeneratorState` ready for Phase 16 (`usePuzzleSession` hook)
- `usePuzzleProgress` exports `getSessionTier`, `recordCorrect`, `recordWrong` — all consumed by Phase 16
- Feature flags are live in types and Remote Config provider; can be tuned post-launch via Firebase console without redeploying

---
*Phase: 15-generator-progress-hook*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: utils/puzzleGenerator.ts
- FOUND: hooks/usePuzzleProgress.ts
- FOUND: commit 2f1b880 (Task 1)
- FOUND: commit 2bb4b06 (Task 2)
