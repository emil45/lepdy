# Phase 23: Progress & Engagement Layer - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visible mastery tracking to the hub menu (mini piece row with tier-colored labels) and a per-piece breakdown to the session complete screen, making abstract progress feel real and rewarding while explicitly avoiding numeric counters.

</domain>

<decisions>
## Implementation Decisions

### Hub Menu Mastery Display
- Add a mini piece row below each hub tile's label showing all 6 chess pieces as small emoji with colored backgrounds matching their current mastery tier
- Use `usePuzzleProgress` hook as the data source — already tracks per-piece tiers
- All 4 tiles get an overall mastery summary chip (e.g., "3/6 Expert") below the label
- Success criteria: "all 6 chess pieces displayed on hub menu with their current mastery band as a named label"

### Session Complete Per-Piece Breakdown
- Show piece emoji + Hebrew name + "X/Y correct" (e.g., "♔ מלך 2/3") for each piece that appeared in the session
- Only include pieces that actually appeared in the session (filter by session puzzle data)
- Place below the stars section, above the existing mastery tier advancement section
- Use piece-colored cards consistent with PracticePicker visual style

### Mastery Label Design
- Named band only (e.g., "מומחה" / "Expert") — no numeric counter toward next tier (success criteria requirement)
- Reuse existing tier colors: blue (#9ed6ea) = Beginner, purple (#dbc3e2) = Intermediate, gold (#ffcd36) = Expert
- Caption-size labels (Typography variant="caption") on hub mini piece row — 6 pieces must fit on one row

### Claude's Discretion
No items deferred to Claude's discretion — all grey areas resolved by user.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePuzzleProgress` hook — tracks per-piece difficulty tiers and mastery bands
- `getBandKey()` utility — maps tier (1/2/3) to translation key (already in PracticePicker + SessionCompleteScreen)
- `getTierColor()` utility — maps tier to color (already in SessionCompleteScreen)
- `chessPieces` array — 6 pieces with emoji, translationKey, color
- `PiecePuzzleProgress` interface — contains tier, correct count, wrong count per piece

### Established Patterns
- MUI Chip for status labels
- `useTranslations('chessGame')` for i18n
- `Box` with `display: 'flex'` for inline layouts
- `Typography` `variant="caption"` for small labels

### Integration Points
- `ChessHubMenu.tsx` — needs `usePuzzleProgress` data passed as prop or consumed via hook
- `SessionCompleteScreen.tsx` — needs per-piece answer breakdown from session data
- `usePuzzleSession.ts` — may need to expose per-piece answer counts from session

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches using existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
