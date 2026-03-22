---
phase: 15-generator-progress-hook
plan: 02
subsystem: ui
tags: [chess, react, mui, useMemo, useCallback, playwright, audio]

requires:
  - phase: 15-01
    provides: usePuzzleProgress hook with recordCorrect/recordWrong/getSessionTier API

provides:
  - Hebrew piece name display with audio tap on every movement puzzle (above board)
  - Hebrew piece name reveal after correct answer on capture puzzles
  - Per-piece difficulty tier updates on correct/wrong answers via recordCorrect/recordWrong

affects: [phase-16, phase-17, usePuzzleSession, puzzle generator integration]

tech-stack:
  added: []
  patterns:
    - "Hebrew name + audio button pattern: Typography onClick + IconButton with data-testid"
    - "usePuzzleProgress destructured inline: const { recordCorrect, recordWrong } = usePuzzleProgress()"
    - "Post-answer reveal: show Hebrew name conditionally on isAdvancing state in CapturePuzzle"

key-files:
  created: []
  modified:
    - app/[locale]/games/chess-game/MovementPuzzle.tsx
    - app/[locale]/games/chess-game/CapturePuzzle.tsx
    - e2e/app.spec.ts

key-decisions:
  - "Hebrew name shown always on MovementPuzzle (above board), shown after correct answer on CapturePuzzle (post-answer reveal)"
  - "correctPieceConfig in CapturePuzzle derived via useMemo on puzzle.correctPieceId"
  - "E2E test pre-existing failures (puzzle count 18->61, 8->34, distractor c3->c2) fixed as Rule 1 auto-fix"

patterns-established:
  - "piece-name-audio-button data-testid: standard testid for Hebrew piece audio button across puzzle components"

requirements-completed: [PGEN-04, DIFF-02, DIFF-03]

duration: 6min
completed: 2026-03-22
---

# Phase 15 Plan 02: Hebrew Piece Name + Audio + Progress Wiring Summary

**Hebrew piece name with audio tap wired into MovementPuzzle (always visible) and CapturePuzzle (post-answer reveal), with recordCorrect/recordWrong updating per-piece difficulty tiers on every answer**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-22T20:16:04Z
- **Completed:** 2026-03-22T20:21:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- MovementPuzzle shows Hebrew piece name + VolumeUp audio button above the board on every puzzle — tapping either the name or the icon plays Hebrew pronunciation
- CapturePuzzle reveals Hebrew name of the attacking piece after a correct answer (isAdvancing state), matching the plan's post-answer reveal design
- Both components wire `recordCorrect(pieceId)` and `recordWrong(pieceId)` into answer handlers, updating per-piece difficulty tiers in localStorage for next session
- E2E test added: `piece-name-audio-button` visibility on movement puzzles (PGEN-04 behavioral coverage)
- Pre-existing E2E failures from Phase 14 puzzle pool expansion fixed as Rule 1 auto-fix (puzzle counts and distractor square corrected)

## Task Commits

1. **Task 1: Hebrew piece name with audio and progress wiring to MovementPuzzle** - `78e96b9` (feat)
2. **Task 2: Hebrew piece reveal and progress wiring to CapturePuzzle, fix E2E tests** - `6d0e2c0` (feat)

## Files Created/Modified

- `app/[locale]/games/chess-game/MovementPuzzle.tsx` - Added playAudio import, VolumeUpIcon, usePuzzleProgress hook, Hebrew name+audio block above board, recordCorrect/recordWrong wiring
- `app/[locale]/games/chess-game/CapturePuzzle.tsx` - Added playAudio import, VolumeUpIcon, usePuzzleProgress hook, correctPieceConfig useMemo, post-answer Hebrew name reveal, recordCorrect/recordWrong wiring
- `e2e/app.spec.ts` - Added piece-name-audio-button visibility test; fixed puzzle count assertions (18->61, 8->34) and distractor square (c3->c2) to match Phase 14 expanded puzzle pool

## Decisions Made

- Hebrew name shown always on MovementPuzzle (above board at all times) vs. shown after correct answer on CapturePuzzle — matches CONTEXT.md decision: pre-answer instruction already shows target piece, post-answer reveal is the Hebrew learning moment
- `correctPieceConfig` derived via `useMemo` (not inline const) in CapturePuzzle to satisfy the plan's explicit requirement
- Pre-existing E2E test failures from Phase 14 fixed inline rather than deferred — they were blocking the full test suite green requirement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing E2E test failures from Phase 14 puzzle pool expansion**
- **Found during:** Task 2 (E2E test verification)
- **Issue:** Three existing tests asserted stale hardcoded puzzle counts (18 movement, 8 capture) and a stale distractor square (c3) that were changed in Phase 14 but tests never updated
- **Fix:** Updated `'1 / 18'` -> `'1 / 61'`, `'1 / 8'` -> `'1 / 34'` (two occurrences), and `c3` -> `c2` distractor in capture puzzle tests
- **Files modified:** e2e/app.spec.ts
- **Verification:** Full E2E suite runs green (40/40 passing)
- **Committed in:** `6d0e2c0` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — pre-existing broken tests from Phase 14)
**Impact on plan:** Fix was necessary for the plan's E2E green requirement. No scope creep.

## Issues Encountered

None in the new code. Pre-existing test failures from Phase 14 resolved as deviation Rule 1.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both puzzle types now display Hebrew piece names with audio and update difficulty tiers
- `usePuzzleProgress` fully wired into the puzzle experience — DIFF-02/DIFF-03 complete
- PGEN-04 complete — Hebrew pronunciation tap is live on movement puzzles
- Phase 16 (puzzle session hook and infinite replay) can now source puzzles using the difficulty tiers updated here

---
*Phase: 15-generator-progress-hook*
*Completed: 2026-03-22*
