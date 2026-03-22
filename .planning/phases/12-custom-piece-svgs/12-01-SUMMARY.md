---
phase: 12-custom-piece-svgs
plan: 01
subsystem: ui
tags: [chess, svg, pieces, theme, react-chessboard, localStorage]

# Dependency graph
requires:
  - phase: 11-board-theme
    provides: react-chessboard pastel board theming via options object
provides:
  - 12 staunty SVG chess piece files in public/chess/pieces/staunty/
  - pieceThemes.tsx registry with buildPieceRenderObject factory
  - useChessPieceTheme hook with localStorage persistence
  - All 3 chess components rendering staunty SVG pieces
affects: [12-02-horsey-theme, any future chess piece theme plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - buildPieceRenderObject factory pattern — adding a theme requires only dropping SVGs in public/chess/pieces/{name}/ and adding one entry to pieceThemes record
    - PieceRenderObject defined inline to avoid react-chessboard subpath import issues

key-files:
  created:
    - public/chess/pieces/staunty/ (12 SVG files)
    - public/chess/pieces/CREDITS.md
    - app/[locale]/games/chess-game/pieceThemes.tsx
    - hooks/useChessPieceTheme.ts
  modified:
    - app/[locale]/games/chess-game/MovementPuzzle.tsx
    - app/[locale]/games/chess-game/CapturePuzzle.tsx
    - app/[locale]/games/chess-game/PieceIntroduction.tsx

key-decisions:
  - "PieceRenderObject type defined inline — react-chessboard/dist/types subpath import not resolvable by TypeScript bundler (package.json exports only root)"
  - "horsey entry included in pieceThemes record even though SVGs not yet downloaded — factory pattern makes it a no-op until plan 02"

patterns-established:
  - "Theme factory: buildPieceRenderObject(theme) loops PIECE_CODES to build PieceRenderObject without hand-writing 12 functions"
  - "PieceIntroduction uses w${fenChar} for the SVG path since it always shows white pieces"

requirements-completed: [PIECE-01, PIECE-03, PIECE-04]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 12 Plan 01: Custom Piece SVGs Summary

**Staunty SVG pieces from lichess integrated into chess board and piece introduction via extensible factory-pattern theme registry**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-22T15:34:00Z
- **Completed:** 2026-03-22T15:38:31Z
- **Tasks:** 2
- **Files modified:** 17 (12 SVGs + 5 code files)

## Accomplishments
- Downloaded all 12 staunty SVGs from lichess (wK/wQ/wR/wB/wN/wP + 6 black pieces)
- Created pieceThemes.tsx with buildPieceRenderObject factory — adding a theme requires one registry line + SVG folder
- Created useChessPieceTheme hook with localStorage persistence for theme selection
- Wired staunty pieces into MovementPuzzle, CapturePuzzle (via Chessboard `pieces` option), and PieceIntroduction (img tag replacing Unicode symbol)

## Task Commits

Each task was committed atomically:

1. **Task 1: Download staunty SVGs and create theme architecture** - `748ca22` (feat)
2. **Task 2: Integrate themed pieces into all 3 chess components** - `3e7a2b7` (feat)

## Files Created/Modified
- `public/chess/pieces/staunty/` - 12 SVG files (wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP)
- `public/chess/pieces/CREDITS.md` - CC BY-NC-SA 4.0 attribution for staunty and horsey
- `app/[locale]/games/chess-game/pieceThemes.tsx` - Theme registry with buildPieceRenderObject factory, exports ThemeName, pieceThemes, PIECE_CODES
- `hooks/useChessPieceTheme.ts` - localStorage-persisted theme hook returning { theme, pieces, selectTheme }
- `app/[locale]/games/chess-game/MovementPuzzle.tsx` - Added useChessPieceTheme, pieces passed to Chessboard options
- `app/[locale]/games/chess-game/CapturePuzzle.tsx` - Added useChessPieceTheme, pieces passed to Chessboard options
- `app/[locale]/games/chess-game/PieceIntroduction.tsx` - Replaced Unicode symbol Typography with staunty SVG img tag

## Decisions Made
- Defined PieceRenderObject type inline rather than importing from `react-chessboard/dist/types` — the package's `exports` field only exposes the root entry, making subpath imports fail TypeScript compilation
- Included horsey in pieceThemes record even though SVGs not downloaded yet — the factory call is valid JavaScript and will only fail at runtime if someone selects horsey before plan 02 ships the SVGs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed react-chessboard subpath import failing TypeScript compilation**
- **Found during:** Task 2 (npm run build verification)
- **Issue:** `import type { PieceRenderObject } from 'react-chessboard/dist/types'` failed — package only exports root path via package.json exports field
- **Fix:** Defined PieceRenderObject type inline in both pieceThemes.tsx and useChessPieceTheme.ts
- **Files modified:** app/[locale]/games/chess-game/pieceThemes.tsx, hooks/useChessPieceTheme.ts
- **Verification:** npm run build passes cleanly
- **Committed in:** 3e7a2b7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- react-chessboard dist subpath import not supported — resolved inline by copying the type definition

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Staunty theme fully wired; board shows kid-friendly SVG pieces on MovementPuzzle and CapturePuzzle
- PieceIntroduction shows staunty SVG instead of Unicode symbol
- Plan 02 can add horsey SVGs by dropping them in public/chess/pieces/horsey/ — the registry entry already exists
- Build passes, theme architecture is extensible

---
*Phase: 12-custom-piece-svgs*
*Completed: 2026-03-22*
