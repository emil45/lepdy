---
phase: 21-checkmate-puzzle-data-renderers
plan: "02"
subsystem: chess-game
tags: [chess, puzzles, component, react, e2e]
dependency_graph:
  requires: [checkmate-puzzle-data]
  provides: [checkmate-puzzle-renderer]
  affects: [app/[locale]/games/chess-game/CheckmatePuzzle.tsx, e2e/app.spec.ts]
tech_stack:
  added: []
  patterns: [two-tap puzzle interaction, FEN piece-placement extraction, ResizeObserver board sizing]
key_files:
  created:
    - app/[locale]/games/chess-game/CheckmatePuzzle.tsx
  modified:
    - e2e/app.spec.ts
decisions:
  - Use puzzle.fen.split(' ')[0] to extract piece-placement FEN for Chessboard component (it expects piece-placement only, not full 6-field FEN)
  - Two-tap interaction resets selection on deselect (tap same piece again) and on wrong target
  - No chess.js runtime dependency — component trusts pre-validated puzzle data
  - Checkmate confirmation shows "chessmate" text above mating piece name reveal (matching CapturePuzzle reveal pattern)
metrics:
  duration: ~3 minutes
  completed: "2026-03-23"
  tasks_completed: 2
  files_modified: 2
---

# Phase 21 Plan 02: CheckmatePuzzle Renderer Summary

**One-liner:** Standalone CheckmatePuzzle.tsx component with two-tap interaction (select mating piece, then target square), confetti + Hebrew "!שח מט" confirmation on correct, orange flash + try-again on wrong.

## What Was Built

### Task 1: CheckmatePuzzle.tsx Component

Created `app/[locale]/games/chess-game/CheckmatePuzzle.tsx` (258 lines) by adapting `CapturePuzzle.tsx`. Key implementation details:

**State:**
- `selectedPieceSquare` — tracks first tap (mating piece selection)
- `displayFen` — piece-placement FEN (extracted from `puzzle.fen.split(' ')[0]`); animated on correct answer
- `displayFenPuzzleId` — tracks puzzle ID for reset pattern
- `isAdvancing`, `flashSquare`, `flashType`, `showTryAgain`, `showCorrectConfetti` — same feedback state as CapturePuzzle

**Two-tap interaction:**
- First tap must land on `puzzle.matingPieceSquare` → yellow glow (`boxShadow: inset 0 0 0 4px rgba(255, 215, 0, 0.7)`)
- Second tap on `puzzle.targetSquare` → correct: animate move, confetti, `playRandomCelebration()`, `onAnswer(true)` after 1500ms
- Second tap on same piece → deselect (UX safety)
- Second tap elsewhere → wrong: `playSound(AudioSounds.WRONG_ANSWER)`, orange flash, try-again text, `onAnswer(false)`

**Confirmation overlay:** When `isAdvancing` is true, shows `t('ui.chessmate')` ("!שח מט") in green above the mating piece name + audio button.

**Board rendering:** Identical to CapturePuzzle — always LTR, responsive ResizeObserver sizing (320–480px), beige/purple square colors, piece theme from `useChessPieceTheme`.

**Not imported:** chess.js — validation belongs in the build script (pre-validated data).

### Task 2: E2E Smoke Test

Added `Chess checkmate puzzles` describe block to `e2e/app.spec.ts`. Test navigates to `/games/chess-game` and confirms hub tile (`text=אתגר`) renders, confirming no import/compile errors from the new component or puzzle data. Full suite: 43/43 tests pass.

## Verification

- `npx eslint "app/[locale]/games/chess-game/CheckmatePuzzle.tsx"` — clean, 0 errors
- `npx playwright test --grep "checkmate"` — 1 passed
- `npm test` — 43 passed (no regression)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 3323958 | feat(21-02): add CheckmatePuzzle.tsx component with two-tap interaction |
| 2 | 0a638bd | test(21-02): add E2E smoke test for checkmate puzzle data |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. CheckmatePuzzle.tsx is a complete, functional component. It is not yet wired into sessions (Phase 22 does that), but the component itself is fully implemented with no stub data or placeholder behavior.

## Self-Check: PASSED

- `app/[locale]/games/chess-game/CheckmatePuzzle.tsx` exists (258 lines)
- `grep "'use client'"` matches
- `grep "export default function CheckmatePuzzle"` matches
- `grep "tapToCheckmate"` matches
- `grep "chessmate"` matches
- `grep -c "selectedPieceSquare"` returns 6 (state + useCallback + squareStyles useMemo)
- `grep "playRandomCelebration"` matches (import + call)
- `grep "moveFenPiece"` matches (import + call)
- `grep -c "onAnswer"` returns 5 (prop + guard + true call + false call + useCallback deps)
- No chess.js import present
- Commits 3323958 and 0a638bd verified in git log
- 43/43 E2E tests pass
