# Phase 23: Progress & Engagement Layer - Research

**Researched:** 2026-03-23
**Domain:** React component modification, localStorage-backed progress display, MUI layout
**Confidence:** HIGH

## Summary

Phase 23 adds visible mastery tracking to two existing screens: the hub menu (`ChessHubMenu.tsx`) and the session complete screen (`SessionCompleteScreen.tsx`). The data layer already exists — `usePuzzleProgress` stores per-piece tiers in localStorage, and the existing `getBandKey()` / `getTierColor()` helpers in `PracticePicker.tsx` and `SessionCompleteScreen.tsx` already encode the display logic. The primary work is (1) threading `currentTiersByPiece` into `ChessHubMenu` and (2) extending `usePuzzleSession` to expose per-piece correct/total counts for the new breakdown section.

PROG-01 (hub mastery display) is pure prop threading plus a new inner component. PROG-02 (session per-piece breakdown) requires a minimal data-model extension to `usePuzzleSession` — adding a `pieceAnswerCounts` map that records correct and total attempts per pieceId during the session. No new npm packages are needed. All display logic reuses patterns already established in `PracticePicker`.

**Primary recommendation:** Extend `usePuzzleSession` to track `pieceAnswerCounts` in parallel with the existing `firstTryCount`, pass this to `SessionCompleteScreen`, and add a mini piece row to `ChessHubMenu` using the same `getTierColor` / `getBandKey` helpers already in the codebase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hub Menu Mastery Display**
- Add a mini piece row below each hub tile's label showing all 6 chess pieces as small emoji with colored backgrounds matching their current mastery tier
- Use `usePuzzleProgress` hook as the data source — already tracks per-piece tiers
- All 4 tiles get an overall mastery summary chip (e.g., "3/6 Expert") below the label
- Success criteria: "all 6 chess pieces displayed on hub menu with their current mastery band as a named label"

**Session Complete Per-Piece Breakdown**
- Show piece emoji + Hebrew name + "X/Y correct" (e.g., "♔ מלך 2/3") for each piece that appeared in the session
- Only include pieces that actually appeared in the session (filter by session puzzle data)
- Place below the stars section, above the existing mastery tier advancement section
- Use piece-colored cards consistent with PracticePicker visual style

**Mastery Label Design**
- Named band only (e.g., "מומחה" / "Expert") — no numeric counter toward next tier (success criteria requirement)
- Reuse existing tier colors: blue (#9ed6ea) = Beginner, purple (#dbc3e2) = Intermediate, gold (#ffcd36) = Expert
- Caption-size labels (Typography variant="caption") on hub mini piece row — 6 pieces must fit on one row

### Claude's Discretion

No items deferred to Claude's discretion — all grey areas resolved by user.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MENU-03 | User sees their per-piece mastery bands displayed on the hub menu | `usePuzzleProgress.data.pieces` provides tier per piece; `ChessGameContent` already lifts `usePuzzleProgress` and passes `currentTiersByPiece` to `SessionCompleteScreen`; same prop can flow to `ChessHubMenu` |
| PROG-01 | User sees a mastery map showing all 6 pieces with current mastery band on the menu | Same as MENU-03 — hub mini-row component reads `chessPieces` array (6 items) and renders emoji + tier chip per piece |
| PROG-02 | User sees a per-piece breakdown on session complete screen (which pieces practiced, how many correct) | Requires new `pieceAnswerCounts: Record<ChessPieceId, { correct: number; total: number }>` state in `usePuzzleSession`; session queue already extracts `pieceId` per puzzle in `onAnswer`; correct/total can be incremented there |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | 7.3.7 | Box, Grid, Chip, Typography | All existing chess UI built with MUI |
| next-intl | 4.7.0 | `useTranslations('chessGame')` | All chess strings already go through this |
| React | 19.2.3 | useState, useCallback, MutableRefObject | Existing hook pattern |

No new packages required.

**Installation:** None.

## Architecture Patterns

### Recommended Project Structure

No new directories. Changes are to existing files:

```
hooks/
  usePuzzleSession.ts        # extend: add pieceAnswerCounts tracking
app/[locale]/games/chess-game/
  ChessHubMenu.tsx           # extend: accept + render mastery props
  ChessGameContent.tsx       # extend: pass currentTiersByPiece to ChessHubMenu
  SessionCompleteScreen.tsx  # extend: accept + render per-piece breakdown
```

### Pattern 1: Prop Threading (Hub Mastery)

**What:** `ChessGameContent` already holds `currentTiersByPiece` (returned from `usePuzzleSession` which delegates to `usePuzzleProgress`). The same value is already passed to `SessionCompleteScreen`. It only needs to be added to the `ChessHubMenuProps` interface and forwarded in the render.

**When to use:** Whenever a stateless display component needs data already available in the parent.

**Example (existing pattern in ChessGameContent hub render):**
```tsx
// Existing — hub render in ChessGameContent.tsx line 368
<ChessHubMenu onNavigate={setCurrentView} isDailyCompleted={isDailyCompleted} />

// Phase 23 extension — add currentTiersByPiece prop
<ChessHubMenu
  onNavigate={setCurrentView}
  isDailyCompleted={isDailyCompleted}
  currentTiersByPiece={currentTiersByPiece}
/>
```

### Pattern 2: Mini Piece Row in Hub Tile

**What:** Each hub tile renders 6 small emoji chips in a single horizontal row. The row uses `display: 'flex'`, `flexWrap: 'nowrap'`, `gap: 0.5` and `justifyContent: 'center'`. Each chip is a small colored Box with the piece emoji and a `Typography variant="caption"` below it for the mastery label.

**Constraint:** 6 pieces must fit in a `maxWidth: 260px` card. Each piece element should be no wider than ~38px, so emoji fontSize ≈ 20–24px and caption text truncated to 3–4 chars (the translation key already gives "מתחיל", "בינוני", "מומחה" — truncate with `noWrap` if needed, or use a single-character abbreviation as fallback).

**Example (pattern from PracticePicker Chip usage):**
```tsx
// Source: PracticePicker.tsx lines 116-119
<Chip
  label={t(getBandKey(tier) as Parameters<typeof t>[0])}
  size="small"
  sx={{ bgcolor: getTierColor(tier), fontWeight: 'bold', fontSize: '0.7rem' }}
/>
```

For the mini row on the hub tile, a `Box` per piece is lighter than a `Chip` — avoids Chip minimum-width constraints that would break 6-across layout:
```tsx
<Box sx={{ bgcolor: getTierColor(tier), borderRadius: 1, px: 0.5, minWidth: 0 }}>
  <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{piece.emoji}</Typography>
  <Typography variant="caption" noWrap sx={{ fontSize: '0.55rem', display: 'block' }}>
    {t(getBandKey(tier))}
  </Typography>
</Box>
```

### Pattern 3: Overall Summary Chip per Hub Tile

**What:** Count how many pieces are at tier 3 ("Expert") and render a chip like "3/6 Expert" below the tile label. Uses the same `Chip` component already imported in hub tiles vicinity.

```tsx
const expertCount = chessPieces.filter(p => (currentTiersByPiece[p.id]?.tier ?? 1) === 3).length;
// Render: <Chip label={`${expertCount}/6 ${t('ui.masteryExpert')}`} size="small" sx={{ bgcolor: '#ffcd36' }} />
```

The summary chip could also reflect the dominant tier (most common across 6 pieces) rather than expert count — this is a Claude's Discretion area but the user specified "3/6 Expert" as the example, so use expert count.

### Pattern 4: Per-Piece Answer Counts in usePuzzleSession

**What:** Extend `UsePuzzleSessionReturn` with `pieceAnswerCounts: Record<string, { correct: number; total: number }>`. In `onAnswer`, increment both `total` and optionally `correct` for the current puzzle's `pieceId` each time any answer is given (not just on correct, so "Y" in "X/Y" reflects total attempts).

**Important nuance:** The current session advances on correct only (`setHeadIndex` only increments when `correct === true`). Wrong answers re-show the same puzzle. The breakdown shows "X/Y correct" where Y = how many times the puzzle was shown / attempted for that piece. Track total separately from correct.

**State shape:**
```typescript
const [pieceAnswerCounts, setPieceAnswerCounts] = useState<Record<string, { correct: number; total: number }>>({});
```

**In `onAnswer` (alongside existing recordCorrect/recordWrong):**
```typescript
setPieceAnswerCounts((prev) => {
  const existing = prev[pieceId] ?? { correct: 0, total: 0 };
  return {
    ...prev,
    [pieceId]: {
      correct: existing.correct + (correct ? 1 : 0),
      total: existing.total + 1,
    },
  };
});
```

**Reset in `startNewSession`:**
```typescript
setPieceAnswerCounts({});
```

### Pattern 5: Per-Piece Breakdown Section in SessionCompleteScreen

**What:** Rendered between the stars section and the existing mastery tier advancement section. Filters `chessPieces` to only include pieces where `pieceAnswerCounts[piece.id]` exists (appeared in session), then renders each as a colored card row.

**Layout:** Each row is a `Box` with `display: 'flex'`, `alignItems: 'center'`, `gap: 1`, `bgcolor: piece.color`, `borderRadius: 2`, `px: 2`, `py: 1`. Content: `{piece.emoji} {t(piece.translationKey)} — {correct}/{total}`.

**Consistency note:** `piece.color` from `chessPieces` (king=#FFD700, rook=#87CEEB, etc.) is distinct from `getTierColor(tier)`. The CONTEXT.md specifies "piece-colored cards consistent with PracticePicker visual style" — PracticePicker uses `piece.color` as card `bgcolor`, so use `piece.color` for the per-piece breakdown rows.

### Anti-Patterns to Avoid

- **Calling `usePuzzleProgress` inside `ChessHubMenu`:** The architecture decision from STATE.md mandates `usePuzzleProgress` is lifted to `ChessGameContent`, never instantiated in child components. Always pass as props.
- **Showing numeric progress toward next tier:** Success criteria explicitly forbids a counter toward the next tier. Display only the named band (Beginner/Intermediate/Expert).
- **Using `Chip` for the 6-piece mini row in hub tiles:** MUI Chip has a minimum width that prevents 6 items fitting in a ~260px card. Use a plain `Box` with `borderRadius` instead.
- **Duplicating getBandKey/getTierColor:** These helpers exist in both `PracticePicker.tsx` and `SessionCompleteScreen.tsx`. Phase 23 should extract them to a shared utility (e.g., `utils/chessMastery.ts`) to avoid a third copy. This is a small refactor within the phase, not a new abstraction layer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tier-to-color mapping | Custom color logic | `getTierColor()` already in `SessionCompleteScreen.tsx` | Already correct, tested in existing UI |
| Tier-to-label mapping | Custom string switch | `getBandKey()` already in `PracticePicker.tsx` | Consistent with i18n, already in use |
| Piece metadata iteration | Hardcoded piece list | `chessPieces` array from `@/data/chessPieces` | Single source of truth for 6 pieces |
| Per-piece progress reads | Direct localStorage access | `usePuzzleProgress().data.pieces` | Already hydrated, avoids duplicate reads |

**Key insight:** Almost everything needed is already built. The pattern for showing "piece + mastery band" was proven in `PracticePicker`. This phase is 80% wiring + 20% new layout.

## Common Pitfalls

### Pitfall 1: Six Pieces Don't Fit in Hub Tile

**What goes wrong:** Rendering 6 MUI `Chip` components in a single row inside a ~260px card (half of 520px max minus padding) causes overflow or wrapping.
**Why it happens:** MUI Chip has a `min-width: 32px` and padding, making 6×~50px = 300px exceed the available space.
**How to avoid:** Use plain `Box` elements with `borderRadius: 1` and `px: 0.5` instead of Chip. Set `fontSize: 18` for emoji and `fontSize: '0.55rem'` for the caption label. Test with the RTL Hebrew locale which uses the same characters.
**Warning signs:** Text overflow, wrapping to two rows, ellipsis on emoji labels.

### Pitfall 2: Pawn Has No Puzzles — Summary Chip Math

**What goes wrong:** Counting "Expert pieces" includes pawn, but pawn never appears in session puzzles (filtered out in `SessionCompleteScreen` line 55: `chessPieces.filter(p => p.id !== 'pawn')`). The hub summary chip "X/6 Expert" would count pawn, which may never reach Expert since it's never practiced.
**Why it happens:** `chessPieces` has 6 items including pawn; mastery data for pawn defaults to tier 1.
**How to avoid:** For the hub summary chip, count across all 6 pieces (pawn always stays Beginner, which is accurate — it genuinely hasn't been practiced). The summary chip "X/6 Expert" is honest. The per-piece breakdown on session complete already filters pawn out correctly.
**Warning signs:** Pawn always shows "Beginner" on hub — this is correct and expected behavior.

### Pitfall 3: pieceAnswerCounts Not Reset Between Sessions

**What goes wrong:** Starting a new session from `SessionCompleteScreen` via `onStartNew` → `startNewSession()` leaves stale `pieceAnswerCounts` from the previous session.
**Why it happens:** New state needs explicit reset in `startNewSession`.
**How to avoid:** Add `setPieceAnswerCounts({})` to `startNewSession` alongside the existing `setFirstTryCount(0)`.
**Warning signs:** Per-piece breakdown on second session shows inflated totals.

### Pitfall 4: RTL Layout Breaks Mini Piece Row Direction

**What goes wrong:** In Hebrew RTL mode, a `display: 'flex'` row with piece emoji reads right-to-left which may reorder pieces unexpectedly (king appears at right end instead of left).
**Why it happens:** MUI respects `direction: rtl` from the theme for flex containers.
**How to avoid:** Add `direction: 'ltr'` on the mini piece row Box to force consistent left-to-right piece order regardless of locale. This follows the same pattern as `SessionCompleteScreen` line 91: `<Box sx={{ direction: 'ltr', display: 'flex', ... }}>` for the star row.
**Warning signs:** Piece order differs between Hebrew and English locales.

### Pitfall 5: TypeScript Errors on New Interface Fields

**What goes wrong:** Adding `pieceAnswerCounts` to `UsePuzzleSessionReturn` without updating the destructuring in `ChessGameContent.tsx` causes a TypeScript error.
**Why it happens:** `ChessGameContent` destructures the full return of `usePuzzleSession()` on line 44.
**How to avoid:** Update destructuring in `ChessGameContent` when adding new fields; pass `pieceAnswerCounts` through to `SessionCompleteScreen`'s props interface.

## Code Examples

### Extracting Shared Helpers (new file)

```typescript
// Source: pattern from PracticePicker.tsx lines 23-33 and SessionCompleteScreen.tsx lines 26-36
// Proposed: utils/chessMastery.ts

export function getBandKey(tier: 1 | 2 | 3): string {
  if (tier === 3) return 'ui.masteryExpert';
  if (tier === 2) return 'ui.masteryIntermediate';
  return 'ui.masteryBeginner';
}

export function getTierColor(tier: 1 | 2 | 3): string {
  if (tier === 3) return '#ffcd36';
  if (tier === 2) return '#dbc3e2';
  return '#9ed6ea';
}
```

### New ChessHubMenuProps signature

```typescript
// Existing interface (ChessHubMenu.tsx line 28-31)
interface ChessHubMenuProps {
  onNavigate: (view: ChessView) => void;
  isDailyCompleted: boolean;
}

// Phase 23 extension
import { PiecePuzzleProgress } from '@/hooks/usePuzzleProgress';

interface ChessHubMenuProps {
  onNavigate: (view: ChessView) => void;
  isDailyCompleted: boolean;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
}
```

### New SessionCompleteScreenProps addition

```typescript
// Existing props (SessionCompleteScreen.tsx line 18-24)
interface SessionCompleteScreenProps {
  firstTryCount: number;
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
  onStartNew: () => void;
  onBackToMap: () => void;
}

// Phase 23 extension
interface SessionCompleteScreenProps {
  firstTryCount: number;
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
  pieceAnswerCounts: Record<string, { correct: number; total: number }>;
  onStartNew: () => void;
  onBackToMap: () => void;
}
```

### Existing i18n keys relevant to Phase 23

All mastery labels already exist in `messages/{he,en,ru}.json` under `chessGame.ui`:
- `ui.masteryBeginner` — "מתחיל" / "Beginner" / "Новичок"
- `ui.masteryIntermediate` — "בינוני" / "Intermediate" / "Средний"
- `ui.masteryExpert` — "מומחה" / "Expert" / "Эксперт"

New i18n keys needed for the "X/Y correct" label text and overall summary chip. These do not exist yet and must be added to all 3 locale files:
- `ui.pieceBreakdownCorrect` — e.g., "{correct}/{total} נכון" (Hebrew), "{correct}/{total} correct" (English), "{correct}/{total} верно" (Russian)
- `ui.overallMastery` — e.g., "{count}/6 {band}" or inline in the chip label

Alternatively the "X/Y" pattern can be composed inline without a new key using template literals or `t('ui.score', { count: correct })` adapted form — but a dedicated key is cleaner and consistent with `ui.score`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-piece mastery only shown in PracticePicker | Mastery shown in hub menu + session complete breakdown | Phase 23 | Mastery becomes visible at all key decision points |
| Session complete shows only global star count | Session complete shows per-piece breakdown + stars | Phase 23 | Kids see which pieces need more practice |

## Open Questions

1. **New i18n key naming for "X/Y correct"**
   - What we know: `ui.score` already handles "{count}/10 נכון!" — not reusable for "2/3"
   - What's unclear: Whether to use a shared `ui.pieceBreakdownCorrect` key with `{correct}` and `{total}` params, or compose inline
   - Recommendation: Add `ui.pieceAnswerCount` = `"{correct}/{total}"` (just the ratio, no label) to keep it flexible. The "correct" label comes from surrounding context.

2. **Overall summary chip: dominant tier vs. expert count**
   - What we know: CONTEXT.md example says "3/6 Expert" — user example explicitly uses expert count
   - What's unclear: Whether "0/6 Expert" on a fresh game feels deflating for a child
   - Recommendation: Use expert count as specified. Fresh game shows "0/6 Expert" which is accurate and gives a clear goal.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — purely in-app UI/state changes, no new tools or services).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright Test 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "Chess"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MENU-03 / PROG-01 | Hub tiles display mini piece mastery row | smoke | `npm test -- --grep "hub mastery"` | No — Wave 0 |
| PROG-02 | Session complete shows per-piece breakdown | smoke | `npm test -- --grep "per-piece breakdown"` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --grep "Chess"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Test: "hub tiles display mastery row for all 6 pieces" — covers MENU-03/PROG-01
  - Approach: set `lepdy_chess_puzzle_progress` in localStorage with known tiers, load `/games/chess-game`, verify `[data-testid="piece-mastery-row"]` contains 6 elements
- [ ] Test: "session complete shows per-piece breakdown" — covers PROG-02
  - Approach: This requires completing a 10-puzzle session which is impractical in E2E. Better: verify the `pieceAnswerCounts` prop is rendered by checking for `data-testid="piece-breakdown-section"` on session complete screen with pre-seeded data. Or: a unit-level test for `usePuzzleSession` pieceAnswerCounts accumulation (if unit tests are introduced).
  - **Pragmatic fallback:** The existing E2E test structure verifies pages load and renders key elements. Add a smoke test that seeds `lepdy_chess_session` with a completed state and verifies the breakdown section renders.

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `ChessHubMenu.tsx`, `SessionCompleteScreen.tsx`, `ChessGameContent.tsx`, `usePuzzleSession.ts`, `usePuzzleProgress.ts`, `PracticePicker.tsx`, `chessPieces.ts`
- Direct read: `messages/he.json`, `messages/en.json`, `messages/ru.json` for all existing translation keys
- Direct read: `e2e/app.spec.ts` for test patterns and existing data-testid conventions

### Secondary (MEDIUM confidence)
- N/A — all findings come from direct codebase inspection, no external sources needed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing stack only, no new packages
- Architecture: HIGH — patterns directly visible in existing chess game components
- Pitfalls: HIGH — derived from actual code (Chip min-width, pawn edge case, RTL direction pattern from line 91 of SessionCompleteScreen)

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (stable domain — internal component patterns don't change)
