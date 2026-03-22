---
phase: 13-theme-selector
plan: 01
subsystem: ui
tags: [chess, settings-drawer, piece-theme, MUI, i18n, RTL, localStorage]

# Dependency graph
requires:
  - phase: 12-custom-piece-svgs
    provides: useChessPieceTheme hook, ThemeName type, pieceThemes registry, staunty/horsey SVG assets
provides:
  - ChessSettingsDrawer component with piece theme selector UI
  - Gear icon on chess level map that opens theme drawer
  - i18n keys for theme selector in he/en/ru
  - Theme persistence via useChessPieceTheme (already implemented in hook)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Props-down settings drawer pattern: drawer receives currentTheme+onSelectTheme as props, does not hold hook state itself"
    - "RTL-aware MUI Drawer: anchor and SlideProps direction driven by useDirection()"

key-files:
  created:
    - app/[locale]/games/chess-game/ChessSettingsDrawer.tsx
  modified:
    - app/[locale]/games/chess-game/ChessGameContent.tsx
    - messages/en.json
    - messages/he.json
    - messages/ru.json

key-decisions:
  - "ChessSettingsDrawer receives currentTheme/onSelectTheme as props (not calling hook internally) — clean separation, hook state lives in ChessGameContent"
  - "Gear icon placed in same header row as BackButton using space-between flex — minimal layout change"
  - "Selected theme border uses #f0003c (Lepdy primary) per plan spec"

patterns-established:
  - "Chess settings drawer pattern: RTL-aware MUI Drawer at 300px, beigePastel bg, CloseIcon header, instant-apply theme tiles"

requirements-completed: [SET-01, SET-02]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 13 Plan 01: Theme Selector Summary

**MUI settings drawer with SVG knight thumbnails lets users switch between Classic/Playful chess piece themes, with selection persisted to localStorage via useChessPieceTheme hook**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T16:10:00Z
- **Completed:** 2026-03-22T16:15:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created ChessSettingsDrawer component with RTL-aware MUI Drawer, knight SVG thumbnails, and colored selection border
- Added gear icon to chess level map header row that opens the settings drawer
- Added i18n keys (pieceTheme, staunty, horsey) to all 3 locale files (he, en, ru)
- Theme changes apply immediately on tap and persist across browser refresh via localStorage

## Task Commits

Each task was committed atomically:

1. **Task 1: Add i18n keys and create ChessSettingsDrawer component** - `839a185` (feat)
2. **Task 2: Wire settings drawer into ChessGameContent level map** - `6ad47db` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/[locale]/games/chess-game/ChessSettingsDrawer.tsx` - New drawer component: RTL-aware, knight SVG thumbnails, instant theme selection
- `app/[locale]/games/chess-game/ChessGameContent.tsx` - Added gear IconButton, settingsOpen state, useChessPieceTheme hook, ChessSettingsDrawer render
- `messages/en.json` - Added chessGame.settings.{pieceTheme, staunty, horsey}
- `messages/he.json` - Added chessGame.settings.{pieceTheme, staunty, horsey} in Hebrew
- `messages/ru.json` - Added chessGame.settings.{pieceTheme, staunty, horsey} in Russian

## Decisions Made
- ChessSettingsDrawer takes `currentTheme` and `onSelectTheme` as props rather than calling the hook internally. This keeps hook state in `ChessGameContent` and avoids duplicate localStorage reads.
- Gear icon placed in same row as BackButton with `justifyContent: space-between` — minimal layout disruption.
- No save button needed — tapping a theme tile applies instantly (matches the plan spec).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - TypeScript passed cleanly, ESLint reported only a pre-existing `<img>` warning consistent with the pieceThemes.tsx pattern.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- v1.2 Board Facelift milestone is now complete: pastel board (Phase 11), SVG piece themes (Phase 12), theme selector UI (Phase 13)
- No blockers for future phases

---
*Phase: 13-theme-selector*
*Completed: 2026-03-22*
