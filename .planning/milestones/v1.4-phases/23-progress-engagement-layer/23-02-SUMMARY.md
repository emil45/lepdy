---
phase: 23-progress-engagement-layer
plan: "02"
subsystem: chess-game
tags: [per-piece-breakdown, session-complete, engagement, i18n]
dependency_graph:
  requires: ["23-01"]
  provides: [pieceAnswerCounts tracking, SessionCompleteScreen per-piece breakdown]
  affects: [hooks/usePuzzleSession.ts, SessionCompleteScreen.tsx, ChessGameContent.tsx]
tech_stack:
  added: []
  patterns: [prop-threading, functional-state-update]
key_files:
  created: []
  modified:
    - hooks/usePuzzleSession.ts
    - app/[locale]/games/chess-game/SessionCompleteScreen.tsx
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - messages/he.json
    - messages/en.json
    - messages/ru.json
    - e2e/app.spec.ts
decisions:
  - "Use piece.color (not getTierColor) for breakdown cards — matches PracticePicker visual style per CONTEXT.md locked decision"
  - "IIFE pattern (()=>{ ... })() used to avoid extracting sessionPieces into outer scope — keeps component render logic self-contained"
  - "pieceAnswerCounts tracks first-answer-only per puzzle slot (correct flag from onAnswer is first-try-correct since wrong answers don't advance headIndex)"
metrics:
  duration: "~4 min"
  completed_date: "2026-03-23"
  tasks_completed: 1
  files_changed: 7
---

# Phase 23 Plan 02: Per-Piece Answer Breakdown on Session Complete Screen

**One-liner:** Added pieceAnswerCounts tracking to usePuzzleSession and rendered piece-colored breakdown cards (emoji + Hebrew name + X/Y correct) on the session complete screen for each piece that appeared in the session.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add pieceAnswerCounts to usePuzzleSession and wire to SessionCompleteScreen | a324b14 | hooks/usePuzzleSession.ts, SessionCompleteScreen.tsx, ChessGameContent.tsx, he/en/ru.json, e2e/app.spec.ts |

## What Was Built

### hooks/usePuzzleSession.ts
- Added `pieceAnswerCounts: Record<string, { correct: number; total: number }>` to `UsePuzzleSessionReturn` interface
- Added `pieceAnswerCounts` state initialized to `{}`
- In `onAnswer` callback: before `recordCorrect`/`recordWrong`, functional setState updates counts per pieceId
- In `startNewSession`: resets `pieceAnswerCounts` to `{}` alongside `firstTryCount`
- Returns `pieceAnswerCounts` in the hook return object

### ChessGameContent.tsx
- Destructures `pieceAnswerCounts` from `usePuzzleSession()`
- Passes `pieceAnswerCounts={pieceAnswerCounts}` to `SessionCompleteScreen`

### SessionCompleteScreen.tsx
- Added `pieceAnswerCounts` to `SessionCompleteScreenProps` interface
- Added `data-testid="piece-breakdown-section"` Box between score text and mastery section
- Filters `chessPieces` to only pieces that appeared in the session (`pieceAnswerCounts[p.id]`)
- Each piece renders as a colored card using `piece.color` with: emoji, Hebrew name (translated), and `X/Y` count
- Section only renders when `sessionPieces.length > 0`

### i18n
- Added `"pieceAnswerCount": "{correct}/{total}"` to `chessGame.ui` in he.json, en.json, ru.json

## Verification

- `npx tsc --noEmit` — clean
- `npm test -- --grep "Chess"` — 21/21 tests pass (including new session-complete breakdown test)
- All 8 acceptance criteria verified by grep

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. `pieceAnswerCounts` is populated from real `onAnswer` calls during gameplay. The breakdown section simply doesn't render if the session hasn't started (empty counts), which is correct behavior.

## Self-Check: PASSED
