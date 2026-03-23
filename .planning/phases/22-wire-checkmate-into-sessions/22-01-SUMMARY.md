---
phase: 22-wire-checkmate-into-sessions
plan: 01
subsystem: chess-game
tags: [chess, feature-flags, firebase-remote-config, amplitude, typescript, session-management]

# Dependency graph
requires:
  - phase: 21-checkmate-puzzle-data-renderers
    provides: CheckmatePuzzle type and checkmatePuzzles array in data/chessPuzzles.ts
  - phase: 19-menu-redesign-sound-celebrations
    provides: usePuzzleSession hook and session architecture
provides:
  - chessCheckmateEnabled feature flag in FeatureFlags interface with safe false default
  - Firebase Remote Config fetch wired for chessCheckmateEnabled
  - CHESS_PUZZLE_ANSWERED Amplitude event with puzzle_type discriminator
  - SessionPuzzle union extended with checkmate variant
  - buildSessionQueue injects one checkmate puzzle at slot 9 when flag is true
  - hydrateSession restores checkmate entries from sessionStorage
  - PersistedSession type supports checkmate entries
  - ChessGameContent renders CheckmatePuzzle component in challenge sessions
affects: [23-checkmate-ui-polish, future-amplitude-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Feature flag gates new puzzle type injection in buildSessionQueue
    - Discriminated union with 3 variants (movement | capture | checkmate) for exhaustive type narrowing
    - Explicit type narrowing guards before each puzzle component render

key-files:
  created: []
  modified:
    - lib/featureFlags/types.ts
    - lib/featureFlags/providers/firebaseRemoteConfig.ts
    - models/amplitudeEvents.ts
    - hooks/usePuzzleSession.ts
    - hooks/usePracticeSession.ts
    - app/[locale]/games/chess-game/ChessGameContent.tsx

key-decisions:
  - "chessCheckmateEnabled defaults to false — safe rollout, no existing sessions affected"
  - "Checkmate injected at slot 9 (last slot, i===4) with fixed tier 1 — checkmate spans all pieces so per-piece tier is not applicable"
  - "ChessGameContent renders existing CheckmatePuzzle component for session checkmate slots — no new UI component needed"
  - "Practice sessions remain capture/movement only — usePracticeSession fallback to activePieceId for unreachable checkmate branch"

patterns-established:
  - "Pattern 1: When extending SessionPuzzle union, update PersistedSession type, hydrateSession, onAnswer pieceId extraction, and all rendering switch branches simultaneously"

requirements-completed: [MATE-03]

# Metrics
duration: 6min
completed: 2026-03-23
---

# Phase 22 Plan 01: Wire Checkmate Into Sessions Summary

**chessCheckmateEnabled feature flag, CHESS_PUZZLE_ANSWERED Amplitude event, and checkmate-aware session queue building with hydration — all type-safe and gated by remote config**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-23T08:41:00Z
- **Completed:** 2026-03-23T08:47:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- chessCheckmateEnabled boolean flag added to FeatureFlags interface with false default, wired into Firebase Remote Config fetchFlags
- CHESS_PUZZLE_ANSWERED Amplitude event fully typed with puzzle_type ('movement' | 'capture' | 'checkmate'), piece_id, difficulty, correct, session_index
- SessionPuzzle union extended to 3 variants; buildSessionQueue injects one checkmate puzzle at last capture slot when flag is true
- PersistedSession and hydrateSession handle checkmate entries for session persistence across page reloads
- ChessGameContent challenge session renders CheckmatePuzzle component for checkmate slots

## Task Commits

Each task was committed atomically:

1. **Task 1: Add feature flag + Amplitude event definitions** - `4d5dfcf` (feat)
2. **Task 2: Extend usePuzzleSession hook for checkmate puzzles** - `346526a` (feat)

## Files Created/Modified
- `lib/featureFlags/types.ts` - Added chessCheckmateEnabled boolean flag with JSDoc
- `lib/featureFlags/providers/firebaseRemoteConfig.ts` - Added getBooleanFlag fetch for chessCheckmateEnabled
- `models/amplitudeEvents.ts` - Added CHESS_PUZZLE_ANSWERED enum, ChessPuzzleAnsweredProperties interface, EventMap entry
- `hooks/usePuzzleSession.ts` - Extended SessionPuzzle union, PersistedSession, buildSessionQueue, hydrateSession, onAnswer, added feature flag read
- `hooks/usePracticeSession.ts` - Fixed onAnswer pieceId extraction for expanded SessionPuzzle union
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - Added CheckmatePuzzle dynamic import, explicit type narrowing in challenge and practice session render branches

## Decisions Made
- chessCheckmateEnabled defaults to false: safe rollout, no existing sessions affected until flag enabled in Firebase Remote Config console
- Checkmate injected at slot 9 (i===4 in the for loop) with fixed difficulty tier 1 — checkmate puzzles span all piece types so per-piece tier tracking is not applicable
- Practice sessions remain capture/movement only — the checkmate branch in usePracticeSession is unreachable but required for TypeScript exhaustiveness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed type narrowing errors in ChessGameContent and usePracticeSession caused by expanded SessionPuzzle union**
- **Found during:** Task 2 (Extend usePuzzleSession hook)
- **Issue:** Adding `checkmate` to SessionPuzzle union caused TypeScript errors at catch-all `capture` render branches in ChessGameContent (2 locations) and in usePracticeSession onAnswer pieceId extraction, since `CheckmatePuzzle` is not assignable to `CapturePuzzle`
- **Fix:** Added explicit `type === 'checkmate'` branch in challenge session view rendering CheckmatePuzzle component; added `type !== 'capture'` guard before practice session capture render; updated usePracticeSession onAnswer to use three-way conditional with activePieceId fallback for unreachable checkmate case; added CheckmatePuzzle dynamic import
- **Files modified:** app/[locale]/games/chess-game/ChessGameContent.tsx, hooks/usePracticeSession.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors; eslint on modified files passes clean
- **Committed in:** 346526a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: type narrowing cascade from union extension)
**Impact on plan:** Fix was necessary for TypeScript correctness — the plan extended the union but did not update all downstream consumers. The fix also delivers a bonus: CheckmatePuzzle is now rendered in challenge sessions (expected goal of Phase 22) rather than requiring a separate follow-up.

## Issues Encountered
None beyond the auto-fixed type narrowing cascade.

## User Setup Required
None - no external service configuration required.
The chessCheckmateEnabled flag must be added to Firebase Remote Config console before it will activate for users. Default is false, so no action needed for safe deploy.

## Next Phase Readiness
- Data layer complete: feature flag, Amplitude event, session queue building, hydration all wired
- CheckmatePuzzle already rendered in challenge sessions when flag is true
- Phase 22-02 can focus on UI polish, sound effects, and Amplitude event emission for chess puzzle answers
- Enable chessCheckmateEnabled in Firebase Remote Config console to activate for users

---
*Phase: 22-wire-checkmate-into-sessions*
*Completed: 2026-03-23*
