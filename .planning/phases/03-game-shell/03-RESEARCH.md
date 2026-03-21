# Phase 3: Game Shell - Research

**Researched:** 2026-03-21
**Domain:** Next.js React component integration, localStorage persistence, MUI level map UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Level Map Visual Design:**
- Vertical stack layout — 3 large cards top-to-bottom, simple for kids to scan
- Locked levels appear greyed out with a lock icon — universal pattern kids recognize
- Completed levels show green checkmark + star — matches Lepdy's visual language
- Each level card shows: level number, name, and piece icon preview for context

**Chess Progress Data Model:**
- Dedicated `lepdy_chess_progress` localStorage key — matches existing category progress pattern
- Data shape: `{ completedLevels: number[], currentLevel: number }` — simple, extensible
- `useChessProgress` custom hook — mirrors `useCategoryProgress` pattern
- No dedicated context provider — hook used directly in chess game, not app-wide

**Games List Integration:**
- Chess game button added last in the games list — new game, let it earn its position
- Chess knight piece icon — instantly recognizable as chess
- No feature flag — game is always visible once deployed
- Translation key `games.chessGame` — matches existing `games.simonGame` etc. pattern

### Claude's Discretion
- Exact level card dimensions and spacing
- Animation on level unlock (if any)
- Level map header/title styling
- Internal component decomposition

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTG-01 | Chess game appears in the existing /games list page | GamesContent.tsx pattern documented — add FunButton last in list with `games.buttons.chessGame` translation key |
| INTG-02 | Game route follows existing pattern: `app/[locale]/games/chess-game/` | Route already exists from Phase 2; page.tsx + ChessGameContent.tsx already in place |
| INTG-04 | Game fits Lepdy's visual language (MUI theming, pastel colors) | MUI palette documented — use bluePastel/beigePastel for level cards; LockIcon, CheckCircleIcon, StarIcon already imported in project |
| INTG-05 | Back button navigates to /games (matching other game pages) | BackButton with `href="/games"` already in ChessGameContent.tsx from Phase 2 |
| PROG-01 | Levels unlock sequentially — must complete previous level to access next | useChessProgress hook pattern documented; locked guard implemented in LevelMap component |
| PROG-02 | Visual progress indicator shows which levels are completed (checkmarks/stars) | MUI CheckCircleIcon + StarIcon used elsewhere in project; greyed locked state via opacity/color |
| PROG-03 | Progress saved to localStorage and persists across sessions | useCategoryProgress load-on-mount/save-on-change pattern directly reusable |
| PROG-04 | Level map screen shows all levels with locked/unlocked/completed state | 3-card vertical layout with distinct locked/unlocked/completed visual states |
</phase_requirements>

## Summary

Phase 3 delivers the game shell: the chess game becomes visible in the games list, and the chess route shows a level map instead of a bare chessboard. The level map lets kids navigate to levels 1-3, with progress persisted to localStorage. No gameplay logic ships in this phase.

All work builds on proven project patterns. The existing `useCategoryProgress` hook is the direct model for `useChessProgress`. `GamesContent.tsx` already shows the pattern for adding a new FunButton. `ChessGameContent.tsx` from Phase 2 has the shell to transform. The translation namespaces are already established (`chessGame.levels.*`, `games.buttons.*`). Icons needed (LockIcon, CheckCircleIcon, StarIcon) are already imported elsewhere in the project — no new @mui/icons-material entries needed.

The key architectural decision is that `ChessGameContent.tsx` transforms from "show board" to "show level map OR show level content" — a view-routing pattern driven by a `currentView` state that starts at `'map'` and navigates to `'level-1'`, `'level-2'`, or `'level-3'` on card tap.

**Primary recommendation:** Build `useChessProgress` mirroring `useCategoryProgress`, then build `LevelMapCard` as a reusable card component, then wire up `ChessGameContent` to conditionally render the map or the level view, and finally add the games list button.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component and state management | Project standard |
| @mui/material | 7.3.7 | Card, Box, Typography, IconButton | Project design system |
| @mui/icons-material | 7.3.7 | LockIcon, CheckCircleIcon, StarIcon | Already used project-wide |
| next-intl | 4.7.0 | `useTranslations` for level names | i18n pattern for all UI text |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | browser API | Chess progress persistence | Load on mount, save on state change |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New custom useChessProgress hook | React Context | No context needed — hook used only in chess game; adding context is overhead without benefit |
| Vertical stack Card layout | react-flow / custom SVG map | Cards are simpler, faster to build, and match Lepdy's existing visual language |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
app/[locale]/games/chess-game/
├── page.tsx                    # Already exists — no change
├── ChessGameContent.tsx        # Transform: level map + conditional level view
└── (future) level components   # Phases 4-6 add content here

hooks/
└── useChessProgress.ts         # New — mirrors useCategoryProgress pattern

components/chess/
├── ChessBoardDynamic.tsx       # Already exists from Phase 2
└── (no new components needed for level map — inline in ChessGameContent or small sub-component)
```

### Pattern 1: View Routing in ChessGameContent
**What:** `ChessGameContent` holds a `currentView` state that determines whether to render the level map or a specific level. No Next.js route changes — levels are sub-views within the chess-game route.
**When to use:** When level content doesn't need its own URL (levels are ephemeral game state, not bookmarkable pages).

```typescript
// Source: mirrors pattern used in GuessGameContent and other stateful games
type ChessView = 'map' | 'level-1' | 'level-2' | 'level-3';

export default function ChessGameContent() {
  const [currentView, setCurrentView] = useState<ChessView>('map');
  const { completedLevels, completeLevel } = useChessProgress();

  if (currentView === 'map') {
    return <LevelMap
      completedLevels={completedLevels}
      onSelectLevel={(n) => setCurrentView(`level-${n}` as ChessView)}
    />;
  }

  // Level views (Phases 4-6 fill these in)
  return <Box>Level {currentView} — coming soon</Box>;
}
```

### Pattern 2: useChessProgress Hook
**What:** Standalone hook following `useCategoryProgress` load-on-mount/save-on-change pattern, with chess-specific data shape `{ completedLevels: number[], currentLevel: number }`.
**When to use:** Any component that needs to read or write chess level progress.

```typescript
// Source: mirrors useCategoryProgress.ts structure
const STORAGE_KEY = 'lepdy_chess_progress';

export interface ChessProgressData {
  completedLevels: number[];
  currentLevel: number;
}

export function useChessProgress() {
  const [data, setData] = useState<ChessProgressData>({ completedLevels: [], currentLevel: 1 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.completedLevels)) {
          setData({ completedLevels: parsed.completedLevels, currentLevel: parsed.currentLevel ?? 1 });
        }
      }
    } catch (e) {
      console.error('[chess] Failed to load progress:', e);
    }
    setIsInitialized(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[chess] Failed to save progress:', e);
    }
  }, [data, isInitialized]);

  const completeLevel = useCallback((levelNum: number) => {
    setData(prev => ({
      completedLevels: prev.completedLevels.includes(levelNum)
        ? prev.completedLevels
        : [...prev.completedLevels, levelNum],
      currentLevel: Math.max(prev.currentLevel, levelNum + 1),
    }));
  }, []);

  const isLevelUnlocked = useCallback((levelNum: number) => {
    if (levelNum === 1) return true;
    return data.completedLevels.includes(levelNum - 1);
  }, [data.completedLevels]);

  const isLevelCompleted = useCallback((levelNum: number) => {
    return data.completedLevels.includes(levelNum);
  }, [data.completedLevels]);

  return { completedLevels: data.completedLevels, completeLevel, isLevelUnlocked, isLevelCompleted };
}
```

### Pattern 3: Level Map Card Visual States
**What:** A single card component that renders locked/unlocked/completed states using MUI components and icons already available in the project.
**When to use:** Each of the 3 level cards in the vertical stack.

```typescript
// Source: MUI Card pattern, icon imports verified in codebase
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import { Card, CardActionArea, Box, Typography } from '@mui/material';

interface LevelMapCardProps {
  levelNumber: number;
  levelName: string;       // from useTranslations('chessGame').('levels.*')
  pieceEmoji: string;      // chess piece emoji as visual hint
  isUnlocked: boolean;
  isCompleted: boolean;
  onSelect: () => void;
}
```

**Visual state rules:**
- Locked: grey background (`grey[300]`), `LockIcon`, disabled tap, opacity 0.6
- Unlocked (not completed): pastel color background (e.g., `bluePastel`), tap enabled, no check icon
- Completed: green background or `greenPastel`, `CheckCircleIcon` + `StarIcon`, tap enabled (revisit)

### Pattern 4: Games List Button Addition
**What:** Add one FunButton to GamesContent.tsx and one translation entry per locale.
**When to use:** Standard pattern used for all 8 existing game buttons.

```typescript
// Source: GamesContent.tsx — append after countingGame button
<FunButton to="/games/chess-game" text={t('games.buttons.chessGame')} />
```

Translation entries to add to `messages/{he,en,ru}.json` under `games.buttons`:
- `he.json`: `"chessGame": "♟️ שחמט"` (chess emoji + Hebrew "chess")
- `en.json`: `"chessGame": "♟️ Chess Game"`
- `ru.json`: `"chessGame": "♟️ Шахматы"`

### Anti-Patterns to Avoid
- **Separate Next.js routes per level:** Level 1/2/3 do not need their own URL segments — they are game views, not pages. Routing via state within ChessGameContent is correct.
- **New context provider for chess progress:** The hook is only consumed by the chess game. A context provider would add complexity with no benefit.
- **Using `next/dynamic` for the level map:** Only `ChessBoardDynamic` needs SSR-off. The level map has no chess.js dependency and can render normally.
- **Saving progress synchronously in event handlers:** Always use the `useEffect` on data change pattern (load-on-mount / save-on-change) to avoid hydration issues, matching `useCategoryProgress`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Level card visual lock state | Custom SVG lock graphic | `LockIcon` from @mui/icons-material | Already installed, consistent visual language |
| Completion indicator | Custom check animation | `CheckCircleIcon` + `StarIcon` | Project already uses these for sticker/achievement UI |
| Progress persistence | Custom storage class | Inline localStorage in hook, mirroring existing hooks | Every other progress hook does this — consistency matters |
| i18n level names | Hardcoded strings | `useTranslations('chessGame')` with existing `levels.*` keys | Keys already exist in all 3 locale files |

**Key insight:** The translation keys (`chessGame.levels.pieceIntro`, `chessGame.levels.movement`, `chessGame.levels.capture`) were defined in Phase 1 and exist in all three locale files already. The level map just needs to read them.

## Common Pitfalls

### Pitfall 1: SSR Hydration from localStorage
**What goes wrong:** Reading localStorage during render causes SSR/client mismatch — "Text content does not match server-rendered HTML".
**Why it happens:** Server renders with empty progress; client renders with stored progress; React sees mismatch.
**How to avoid:** `typeof window === 'undefined'` guard in load function, identical to `useCategoryProgress`. Initialize state with defaults; populate in `useEffect` (runs client-only). Mark `isInitialized` flag before rendering progress-dependent UI.
**Warning signs:** React hydration warning in console.

### Pitfall 2: RTL Direction on Level Map
**What goes wrong:** Lock icons and checkmarks appear on wrong side; card layout breaks in Hebrew locale.
**Why it happens:** Hebrew is RTL (`direction: rtl`) — MUI uses logical properties but absolute positioning can break.
**How to avoid:** Use MUI's `sx` prop with flexbox (not absolute positioning) for icon placement. Test with Hebrew locale. MUI components handle RTL automatically when direction is set on theme.
**Warning signs:** Icons visually mirror/flip in Hebrew that shouldn't (LockIcon is symmetric; CheckCircle is fine).

### Pitfall 3: Locked Level Tap Handling
**What goes wrong:** Locked level cards accept taps and navigate to level content.
**Why it happens:** Forgetting to disable `CardActionArea` or check unlock state in `onSelect`.
**How to avoid:** Pass `disabled` prop to `CardActionArea` for locked levels, or guard in `onSelect`: `if (!isUnlocked) return;`. Visual greying is not sufficient — the click handler must also guard.
**Warning signs:** Manually testing tap on a locked card enters level content.

### Pitfall 4: Missing Translation Keys for chessGame button
**What goes wrong:** `t('games.buttons.chessGame')` returns key string or throws.
**Why it happens:** Adding FunButton without adding translation entry to all 3 locale files.
**How to avoid:** Update all three files — `messages/he.json`, `messages/en.json`, `messages/ru.json` — before or in the same task as the GamesContent.tsx change.
**Warning signs:** Button text shows raw key string like `"games.buttons.chessGame"`.

### Pitfall 5: currentLevel vs completedLevels Drift
**What goes wrong:** `currentLevel` in storage gets out of sync with `completedLevels` array after partial data corruption or migration.
**Why it happens:** Storing two derived pieces of state separately.
**How to avoid:** Derive `currentLevel` from `completedLevels` in the hook return value — don't rely on stored `currentLevel` for unlock logic. The stored `currentLevel` can be treated as informational only; `isLevelUnlocked(n)` checks `completedLevels.includes(n - 1)`.
**Warning signs:** Level 2 shows as locked even after completing level 1.

## Code Examples

### Full useChessProgress Interface

```typescript
// hooks/useChessProgress.ts
export interface UseChessProgressReturn {
  completedLevels: number[];           // e.g. [1, 2]
  completeLevel: (n: number) => void;  // called when a level is finished
  isLevelUnlocked: (n: number) => boolean; // level 1 always true; others need prev complete
  isLevelCompleted: (n: number) => boolean;
}
```

### Level Name Translation Mapping

Existing keys in `chessGame.levels.*` (confirmed present in he/en/ru):
- `chessGame.levels.pieceIntro` → Level 1 name ("Meet the Pieces" / "הכר את הכלים")
- `chessGame.levels.movement` → Level 2 name ("Where Can It Go?" / "לאן הכלי זז?")
- `chessGame.levels.capture` → Level 3 name ("Who Can Capture?" / "מי יכול לתפוס?")

### Piece Emoji for Level Cards

From `chessPieces.ts` — use `emoji` field as visual hint on cards:
- Level 1 (Piece Intro): `♔` king or mix — represent all 6 pieces
- Level 2 (Movement): `♖` rook — illustrates movement concept
- Level 3 (Capture): `♙` pawn — smallest piece, most common capture learner

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Route-per-level (separate pages) | View state within single route | Phase 3 design decision | Simpler navigation, no URL bookmarking needed for levels |

## Open Questions

1. **Level card tap for completed levels**
   - What we know: Requirements say "locked levels cannot be entered" — doesn't explicitly address completed level re-entry
   - What's unclear: Should completed levels be re-enterable? Likely yes (kids replay), but not explicitly specified
   - Recommendation: Allow re-entry (tap on completed level goes to level content). Revisit = false risk.

2. **Placeholder level content for Phase 3**
   - What we know: Phases 4-6 fill in actual level content; Phase 3 just needs the shell
   - What's unclear: What should show when a user taps an unlocked level in Phase 3?
   - Recommendation: Show a `<Box>` with level title and a "Back to map" button — placeholder that won't confuse kids but won't crash either. Phase 4 replaces this.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTG-01 | Chess game button visible on /games page | smoke | `npm test` (games page loads test covers button presence) | ✅ `e2e/app.spec.ts` |
| INTG-02 | Chess game route loads without crash | smoke | `npm test` (chess-game page loads test in game pages loop) | ✅ `e2e/app.spec.ts` |
| INTG-04 | Chess game visually fits Lepdy style | manual | Visual review | manual-only |
| INTG-05 | Back button on chess game navigates to /games | smoke | New E2E test recommended | ❌ Wave 0 gap |
| PROG-01 | Locked levels cannot be tapped into | manual | Manual tap test on locked card | manual-only |
| PROG-02 | Completed levels show checkmark/star | manual | Visual review after completeLevel call | manual-only |
| PROG-03 | Progress persists across page reload | smoke | New E2E test recommended (set localStorage, reload, verify state) | ❌ Wave 0 gap |
| PROG-04 | Level map shows locked/unlocked/completed state | smoke | `npm test` (chess-game page loads, level map visible) | ✅ partial via INTG-02 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] E2E test for back button on chess-game page navigating to /games — covers INTG-05
- [ ] E2E test for localStorage persistence: set `lepdy_chess_progress`, reload, verify level map reflects stored state — covers PROG-03

*(Existing test `chess-game page loads` in `app.spec.ts` handles INTG-02 and partial INTG-04/PROG-04 by verifying the page doesn't crash. The two gaps above should be added in Wave 0 of execution.)*

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `GamesContent.tsx` — exact button pattern for games list integration
- Direct code inspection of `hooks/useCategoryProgress.ts` — authoritative localStorage hook pattern
- Direct code inspection of `hooks/useGamesProgress.ts` — games-specific hook pattern for comparison
- Direct code inspection of `ChessGameContent.tsx` — current Phase 2 state, starting point for transformation
- Direct code inspection of `messages/{he,en,ru}.json` — confirms all chessGame translation keys exist, games.buttons.* pattern
- Direct code inspection of `data/chessPieces.ts` — confirms emoji and translation keys available for level cards
- Direct code inspection of `e2e/app.spec.ts` — confirms existing chess-game test coverage

### Secondary (MEDIUM confidence)
- MUI 7.x Card, CardActionArea, Box, Typography, LockIcon, CheckCircleIcon, StarIcon — confirmed imported in project codebase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries needed; all patterns verified in existing codebase
- Architecture: HIGH — directly derived from existing code, not assumptions
- Pitfalls: HIGH — based on actual code reading (e.g., SSR guard in useCategoryProgress, RTL direction in theme)

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable stack, no fast-moving dependencies)
