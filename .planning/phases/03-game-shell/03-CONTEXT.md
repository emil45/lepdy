# Phase 3: Game Shell - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

The chess game is reachable from the games list, has a working level map, and progress persists across sessions. This phase delivers the game shell — games list integration, level map screen, and progress persistence. No gameplay logic (that's Phases 4-6).

</domain>

<decisions>
## Implementation Decisions

### Level Map Visual Design
- Vertical stack layout — 3 large cards top-to-bottom, simple for kids to scan
- Locked levels appear greyed out with a lock icon — universal pattern kids recognize
- Completed levels show green checkmark + star — matches Lepdy's visual language
- Each level card shows: level number, name, and piece icon preview for context

### Chess Progress Data Model
- Dedicated `lepdy_chess_progress` localStorage key — matches existing category progress pattern
- Data shape: `{ completedLevels: number[], currentLevel: number }` — simple, extensible
- `useChessProgress` custom hook — mirrors `useCategoryProgress` pattern
- No dedicated context provider — hook used directly in chess game, not app-wide

### Games List Integration
- Chess game button added last in the games list — new game, let it earn its position
- Chess knight piece icon — instantly recognizable as chess
- No feature flag — game is always visible once deployed
- Translation key `games.chessGame` — matches existing `games.simonGame` etc. pattern

### Claude's Discretion
- Exact level card dimensions and spacing
- Animation on level unlock (if any)
- Level map header/title styling
- Internal component decomposition

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/[locale]/games/GamesContent.tsx` — Games list with FunButton components, add chess here
- `app/[locale]/games/chess-game/ChessGameContent.tsx` — Existing chess page shell from Phase 2
- `hooks/useCategoryProgress.ts` — localStorage progress pattern to follow for useChessProgress
- `hooks/useGamesProgress.ts` — Games progress hook pattern reference
- MUI `sx` responsive patterns used throughout for tablet sizing

### Established Patterns
- Game pages: `page.tsx` (server) → `*Content.tsx` (client with 'use client')
- localStorage persistence: load on mount → save on change with try-catch error handling
- Games list: hardcoded FunButton components in GamesContent.tsx (no data-driven list)
- Progress hooks: standalone custom hooks, not all need context providers

### Integration Points
- `GamesContent.tsx` — Add FunButton for chess game
- `ChessGameContent.tsx` — Transform from board-only to level map + board
- `messages/{he,en,ru}.json` — Add `games.chessGame` translation key
- Level map navigates to level-specific views within chess game route

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard level map with locked/unlocked progression, following Lepdy's visual patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-game-shell*
*Context gathered: 2026-03-21 via smart discuss*
