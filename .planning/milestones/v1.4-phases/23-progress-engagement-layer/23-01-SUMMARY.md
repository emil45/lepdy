---
phase: 23-progress-engagement-layer
plan: "01"
subsystem: chess-game
tags: [mastery, progress, hub-menu, refactor]
dependency_graph:
  requires: []
  provides: [utils/chessMastery.ts, ChessHubMenu mastery row]
  affects: [ChessHubMenu.tsx, PracticePicker.tsx, SessionCompleteScreen.tsx, ChessGameContent.tsx]
tech_stack:
  added: []
  patterns: [shared-utility-extract, prop-threading]
key_files:
  created:
    - utils/chessMastery.ts
  modified:
    - app/[locale]/games/chess-game/ChessHubMenu.tsx
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - app/[locale]/games/chess-game/PracticePicker.tsx
    - app/[locale]/games/chess-game/SessionCompleteScreen.tsx
    - e2e/app.spec.ts
decisions:
  - "Render summary chip on all 4 hub tiles (per CONTEXT.md locked decision)"
  - "Use plain Box elements (not MUI Chip) for piece mastery row to avoid min-width issues in 260px card"
  - "direction: ltr on mastery row for consistent piece order in RTL locales"
  - "Reuse ui.masteryExpert inline for summary chip label — no new i18n key needed"
metrics:
  duration: "~3 min"
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_changed: 5
---

# Phase 23 Plan 01: Per-Piece Mastery Tracking on Hub Menu Summary

**One-liner:** Extracted getBandKey/getTierColor to shared utils/chessMastery.ts and added a 6-piece tier-colored mastery row plus Expert count summary chip to every hub menu tile.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Extract shared mastery helpers | 62bc015 | utils/chessMastery.ts, PracticePicker.tsx, SessionCompleteScreen.tsx |
| 2 | Add mastery row and summary chip to hub menu | 1026b66 | ChessHubMenu.tsx, ChessGameContent.tsx, e2e/app.spec.ts |

## What Was Built

### utils/chessMastery.ts
New shared utility with two exported functions:
- `getBandKey(tier)` — returns the i18n key for Beginner/Intermediate/Expert
- `getTierColor(tier)` — returns pastel color hex for each tier

Eliminates the third copy of these functions (previously duplicated in PracticePicker and SessionCompleteScreen).

### ChessHubMenu mastery row
Every hub tile now shows:
1. A mini piece row (`data-testid="piece-mastery-row"`) with all 6 pieces, each colored by tier
2. An overall Expert count chip (`X/6 Expert`) using the existing `ui.masteryExpert` translation key

### ChessGameContent prop threading
`currentTiersByPiece` (already destructured from `usePuzzleSession()`) is now passed through to `ChessHubMenu`.

## Verification

- `npx tsc --noEmit` — clean
- `npm test -- --grep "Chess"` — 20/20 tests pass (including new mastery test)
- New E2E test: "hub tiles display mastery row for all 6 pieces" — passes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All 6 pieces render with real tier data from localStorage-persisted `usePuzzleProgress`.

## Self-Check: PASSED
