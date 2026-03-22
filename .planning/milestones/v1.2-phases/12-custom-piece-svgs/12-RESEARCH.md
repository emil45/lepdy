# Phase 12: Custom Piece SVGs - Research

**Researched:** 2026-03-22
**Domain:** react-chessboard PieceRenderObject API, SVG asset management, theme architecture, lichess SVG sourcing
**Confidence:** HIGH

## Summary

Phase 12 replaces the default react-chessboard pieces with kid-friendly SVG designs from the lichess lila repository. The react-chessboard v5.10.0 `pieces` prop in `ChessboardOptions` accepts a `PieceRenderObject` — a `Record<string, (props?) => JSX.Element>` where each key is a piece code (`wK`, `wQ`, `wR`, `wB`, `wN`, `wP`, `bK`, `bQ`, `bR`, `bB`, `bN`, `bP`). The piece component is rendered inside a `div` with `width: '100%', height: '100%'`, so the SVG image must fill that container.

Both the staunty and horsey piece sets are available from `lichess-org/lila` at `public/piece/staunty/` and `public/piece/horsey/`. Both themes have 12 SVGs using identical naming (`wK.svg`, `bQ.svg`, etc.) matching react-chessboard's piece key format exactly. Both sets are licensed **CC BY-NC-SA 4.0** — non-commercial use with attribution required. Lepdy is an educational children's app and appears non-commercial in scope, but attribution in a CREDITS or COPYING file is required.

The theme architecture consists of three parts: (1) SVG files in `public/chess/pieces/{theme}/`, (2) a `pieceThemes.ts` registry that maps theme names to `PieceRenderObject` factories using `<img>` tags, and (3) a `useChessPieceTheme` hook with localStorage persistence. The Chessboard components in `MovementPuzzle`, `CapturePuzzle`, and `PieceIntroduction` each need the `pieces` prop added to their `options` object. `PieceIntroduction` currently renders Unicode symbols — the update replaces the symbol display with a themed piece image.

**Primary recommendation:** Implement the `<img>` wrapper pattern (not inline SVG parsing) — each piece component renders an `<img>` tag pointing to the public path with `width="100%" height="100%"`. This is browser-cacheable, simple to implement, and avoids any SVG injection issues.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SVG files stored in `public/chess/pieces/{theme-name}/` (e.g., `public/chess/pieces/staunty/wK.svg`)
- FEN piece key naming: `wK.svg`, `wQ.svg`, `wR.svg`, `wB.svg`, `wN.svg`, `wP.svg`, `bK.svg`, `bQ.svg`, `bR.svg`, `bB.svg`, `bN.svg`, `bP.svg` (12 files per theme)
- SVGs sourced from lichess GitHub repo (`lichess-org/lila`) and committed to the project — no external CDN dependency
- SVGs used as-is from lichess — already optimized for web chess rendering
- Single `pieceThemes.ts` file in the chess-game directory exporting a `Record<ThemeName, PieceTheme>` — theme name maps to a loader function returning `PieceRenderObject`
- Themes load SVGs via dynamic `<img>` tags wrapping public/ paths — simple, browser-cacheable
- Staunty is the default theme
- Adding a new theme requires only: dropping 12 SVGs in `public/chess/pieces/{name}/` and adding one entry to the themes registry (PIECE-04)
- New `useChessPieceTheme` hook with localStorage persistence — keeps theme selection separate from game progress
- Pieces passed via the `pieces` prop on `<Chessboard options={{ pieces: ... }}>` — react-chessboard's built-in `PieceRenderObject` API
- All 3 chess components get themed pieces: MovementPuzzle, CapturePuzzle, and PieceIntroduction — consistent piece appearance everywhere

### Claude's Discretion
None — all decisions captured above.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIECE-01 | Staunty piece theme — all 12 pieces (6 white, 6 black) sourced from lichess staunty SVGs and integrated into the chess game | SVGs at `lichess-org/lila/public/piece/staunty/`, `PieceRenderObject` API confirmed in react-chessboard v5.10.0 |
| PIECE-02 | Horsey piece theme — all 12 pieces sourced from lichess horsey SVGs and integrated as an alternative theme | SVGs at `lichess-org/lila/public/piece/horsey/`, same naming convention, same integration path |
| PIECE-03 | Piece themes render correctly at all board sizes (320px–480px responsive range) | Board resizes via ResizeObserver already in all 3 components; `<img width="100%" height="100%">` scales automatically |
| PIECE-04 | Extensible theme system — adding a new piece set requires only dropping SVGs in a folder and adding a theme entry (no code changes beyond registration) | `pieceThemes.ts` registry pattern — `buildPieceRenderObject(themeName)` factory generates all 12 piece components from path convention |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-chessboard | 5.10.0 | Chess board with `pieces` prop for custom piece rendering | Already in project; `PieceRenderObject` API is the canonical extension point |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js static assets (`public/`) | 16.1.1 | Serve SVG files at `/chess/pieces/{theme}/{piece}.svg` | All SVG files committed to `public/chess/pieces/` — served as static assets |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<img>` tag per piece | Inline SVG (fetch + dangerouslySetInnerHTML) | Inline SVG allows CSS color overrides but adds fetch complexity, security considerations, and makes attribution harder |
| `<img>` tag per piece | `next/image` | next/image adds optimization but requires `width`/`height` or `fill` — for chess pieces that fill a cell, plain `<img>` is simpler and avoids layout complexity |

**Installation:** No new packages required. All dependencies already in project.

## Architecture Patterns

### Recommended Project Structure
```
public/
└── chess/
    └── pieces/
        ├── staunty/        # 12 SVG files: wK.svg, wQ.svg, ...
        └── horsey/         # 12 SVG files: wK.svg, wQ.svg, ...

app/[locale]/games/chess-game/
├── pieceThemes.ts          # Registry: ThemeName -> PieceRenderObject factory
├── ChessGameContent.tsx    # (no change needed)
├── MovementPuzzle.tsx      # Add pieces prop to Chessboard options
├── CapturePuzzle.tsx       # Add pieces prop to Chessboard options
└── PieceIntroduction.tsx   # Replace Unicode symbol with themed piece image

hooks/
└── useChessPieceTheme.ts   # localStorage persistence, default = 'staunty'
```

### Pattern 1: PieceRenderObject Factory
**What:** A function that takes a theme name and returns all 12 piece components using `<img>` tags pointing to `public/` paths.
**When to use:** Called once at module load to build the render object for a given theme name.
**Example:**
```typescript
// Source: react-chessboard/dist/ChessboardProvider.d.ts + types.d.ts
// PieceRenderObject = Record<string, (props?) => JSX.Element>

export type ThemeName = 'staunty' | 'horsey';

const PIECE_CODES = ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'] as const;

function buildPieceRenderObject(theme: ThemeName): PieceRenderObject {
  const obj: PieceRenderObject = {};
  for (const code of PIECE_CODES) {
    const src = `/chess/pieces/${theme}/${code}.svg`;
    obj[code] = () => (
      <img
        src={src}
        alt={code}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        draggable={false}
      />
    );
  }
  return obj;
}

export const pieceThemes: Record<ThemeName, PieceRenderObject> = {
  staunty: buildPieceRenderObject('staunty'),
  horsey:  buildPieceRenderObject('horsey'),
};
```

### Pattern 2: useChessPieceTheme Hook
**What:** Thin localStorage hook following the exact same pattern as `useChessProgress`.
**When to use:** Import into all 3 chess components to get the current `PieceRenderObject` to pass as `pieces`.
**Example:**
```typescript
// Source: hooks/useChessProgress.ts (established pattern)
const STORAGE_KEY = 'lepdy_chess_piece_theme';

export function useChessPieceTheme() {
  const [theme, setTheme] = useState<ThemeName>('staunty');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (stored && stored in pieceThemes) setTheme(stored);
    } catch (e) {
      console.error('[chess] Failed to load piece theme:', e);
    }
  }, []);

  const selectTheme = useCallback((name: ThemeName) => {
    setTheme(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (e) {
      console.error('[chess] Failed to save piece theme:', e);
    }
  }, []);

  return { theme, pieces: pieceThemes[theme], selectTheme };
}
```

### Pattern 3: Chessboard Integration
**What:** Add `pieces` to the existing `options` object — one line change per component.
**When to use:** In MovementPuzzle and CapturePuzzle (both already use Chessboard with options object).
**Example:**
```typescript
// Source: existing MovementPuzzle.tsx line 242
const { pieces } = useChessPieceTheme();
// ...
<Chessboard
  options={{
    position: displayFen,
    pieces,   // <-- add this line
    allowDragging: false,
    // ... rest unchanged
  }}
/>
```

### Pattern 4: PieceIntroduction Themed Display
**What:** Replace the Unicode symbol (`currentPiece.symbol`) with a themed piece image. Since PieceIntroduction doesn't use Chessboard, it uses the piece image directly.
**When to use:** In the piece card inside `PieceIntroduction.tsx`.
**Example:**
```typescript
const { theme } = useChessPieceTheme();
// In the piece card (replace the Typography with symbol):
<img
  src={`/chess/pieces/${theme}/w${currentPiece.fenChar}.svg`}
  alt={t(currentPiece.translationKey as Parameters<typeof t>[0])}
  style={{ width: 96, height: 96 }}
/>
```
Note: PieceIntroduction shows the white version of each piece (wK, wQ, etc.) — matching fenChar.

### Anti-Patterns to Avoid
- **Fetching SVG content at runtime:** Don't `fetch()` SVG files to inline them. Static `<img>` tags are simpler and browser-cacheable.
- **Using `next/image` for piece rendering:** next/image is for layout-affecting images; chess piece cells size themselves via the board layout, making fill-mode `next/image` unnecessary complexity.
- **One file per piece code in pieceThemes.ts:** Don't hardcode 12 separate named exports. The factory loop generates all 12 components from the naming convention.
- **Storing PieceRenderObject in React state:** Build the render object at module load time (constant), not inside `useEffect` or `useState` — it doesn't change during a session, only the selected theme name changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom SVG rendering engine | SVG parser, color override system | `<img>` tags pointing to public paths | SVGs already optimized by lichess; color information is baked in per piece |
| Piece image caching | Custom cache layer | Browser HTTP cache | Static files in `public/` are served with cache headers by Next.js/Vercel automatically |
| Theme persistence | Custom storage abstraction | Direct localStorage (same pattern as useChessProgress) | The pattern is already established and tested in this codebase |
| Piece key enumeration | Manual 12-item object | `PIECE_CODES` array + loop in `buildPieceRenderObject` | Ensures no piece is forgotten and makes adding themes trivial |

**Key insight:** The entire theme system is just a path convention + a factory function. The complexity here is in the SVG asset acquisition (downloading from lichess), not in the code.

## Common Pitfalls

### Pitfall 1: SVG Missing `width`/`height` Attributes
**What goes wrong:** The lichess SVGs do not have explicit `width` and `height` attributes — only a `viewBox="0 0 50 50"`. An `<img>` tag without explicit `width="100%" height="100%"` will use the intrinsic size (50x50 CSS pixels) rather than filling the cell.
**Why it happens:** The SVGs are designed to be embedded in a container that controls sizing, same as the default react-chessboard pieces which also use `width="100%" height="100%"` on their `<svg>` elements.
**How to avoid:** Set `width="100%" height="100%"` on every `<img>` tag in the piece render functions. Also `display: 'block'` to avoid inline image baseline gap.
**Warning signs:** Pieces appear tiny (50px) instead of filling the square at any board size.

### Pitfall 2: `draggable` Default on `<img>` Tags
**What goes wrong:** `<img>` elements are draggable by default in HTML. When a user tries to drag a chess piece (which uses react-chessboard's dnd system), the browser's native image drag interferes, showing a ghost image of the `<img>` element.
**Why it happens:** Browsers natively support dragging `<img>` elements.
**How to avoid:** Always set `draggable={false}` on piece `<img>` tags.
**Warning signs:** Visible browser ghost image appears when dragging pieces (distinct from react-chessboard's piece ghost).

### Pitfall 3: PieceRenderObject Keys Must Match react-chessboard Exactly
**What goes wrong:** If a key is missing or misspelled (e.g., `wKing` instead of `wK`), that piece renders as blank/invisible on the board.
**Why it happens:** react-chessboard looks up `pieces[pieceType]` where `pieceType` comes from `fenToPieceCode()` — lowercase FEN = `b` prefix, uppercase = `w` prefix, then uppercase piece letter.
**How to avoid:** Use the verified list: `wK wQ wR wB wN wP bK bQ bR bB bN bP`. All 12 must be present.
**Warning signs:** Some pieces show as empty squares in the game.

### Pitfall 4: Horsey Theme Has Different Visual Style Requiring Verification
**What goes wrong:** Horsey is a cartoon/emoji-style theme where pieces are visually quite different from traditional chess. At small board sizes (320px), the distinctions between piece types need to remain clear for children.
**Why it happens:** Horsey uses illustrative emoji-derived art rather than silhouette-based staunty art — some pieces may be harder to distinguish at small sizes.
**How to avoid:** Visually verify all 12 horsey pieces at 320px board width before finalizing. The success criterion states "a child can tell each piece type apart at both board sizes."
**Warning signs:** Knight and King horsey pieces look similar at small sizes.

### Pitfall 5: PieceIntroduction Uses fenChar for White Pieces
**What goes wrong:** `currentPiece.fenChar` is uppercase (`K`, `Q`, `R`, etc.) — the white piece prefix. For the PieceIntroduction display (showing a single piece to learn), always show the white piece (`w${piece.fenChar}.svg`). Don't show black pieces in the introduction screen.
**Why it happens:** PieceIntroduction teaches piece names, not colors — white pieces are the canonical "learning" representation.
**How to avoid:** Construct path as `` `/chess/pieces/${theme}/w${currentPiece.fenChar}.svg` `` in PieceIntroduction.
**Warning signs:** Piece display in Level 1 shows black pieces instead of white, or alternates unexpectedly.

## Code Examples

### Complete pieceThemes.ts
```typescript
// app/[locale]/games/chess-game/pieceThemes.ts
import { PieceRenderObject } from 'react-chessboard/dist/types';

export type ThemeName = 'staunty' | 'horsey';

const PIECE_CODES = [
  'wK','wQ','wR','wB','wN','wP',
  'bK','bQ','bR','bB','bN','bP',
] as const;

function buildPieceRenderObject(theme: ThemeName): PieceRenderObject {
  const obj: PieceRenderObject = {};
  for (const code of PIECE_CODES) {
    const src = `/chess/pieces/${theme}/${code}.svg`;
    obj[code] = () => (
      <img
        src={src}
        alt={code}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        draggable={false}
      />
    );
  }
  return obj;
}

export const pieceThemes: Record<ThemeName, PieceRenderObject> = {
  staunty: buildPieceRenderObject('staunty'),
  horsey: buildPieceRenderObject('horsey'),
};
```

### SVG Download Commands (for Wave 0)
```bash
# Download staunty
cd public/chess/pieces/staunty
for piece in wK wQ wR wB wN wP bK bQ bR bB bN bP; do
  curl -o "${piece}.svg" "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/staunty/${piece}.svg"
done

# Download horsey
cd public/chess/pieces/horsey
for piece in wK wQ wR wB wN wP bK bQ bR bB bN bP; do
  curl -o "${piece}.svg" "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/horsey/${piece}.svg"
done
```

### Confirmed react-chessboard PieceRenderObject Type
```typescript
// Source: node_modules/react-chessboard/dist/types.d.ts (verified)
export type PieceRenderObject = Record<string, (props?: {
  fill?: string;
  square?: string;
  svgStyle?: React.CSSProperties;
}) => React.JSX.Element>;
```

### Confirmed pieces prop location in ChessboardOptions
```typescript
// Source: node_modules/react-chessboard/dist/ChessboardProvider.d.ts (verified)
export type ChessboardOptions = {
  // ...
  pieces?: PieceRenderObject;   // <-- this is the injection point
  // ...
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-chessboard v3 used `customPieces` prop | react-chessboard v5 uses `pieces` inside `options` object | v5.x migration | All code must use `options.pieces`, not top-level `customPieces` |
| SVG pieces as React components with inline paths | SVG pieces as `<img>` tags pointing to public/ paths | This phase | Simpler, cacheable, no React import overhead per piece |

**Deprecated/outdated:**
- `customPieces` top-level prop: This was the API in older react-chessboard versions. The current version (5.10.0 confirmed) uses `pieces` inside the `options` object.

## Open Questions

1. **License attribution placement**
   - What we know: Both staunty (sadsnake1) and horsey (cham, michael1241) are CC BY-NC-SA 4.0
   - What's unclear: Where in the project to place attribution (in-app credits vs. a COPYING.md vs. footer)
   - Recommendation: Create `public/chess/pieces/CREDITS.md` or add to an existing COPYING file. This is lightweight and satisfies the attribution requirement without affecting UI.

2. **PieceIntroduction — full replacement or augmentation**
   - What we know: PieceIntroduction currently shows `currentPiece.symbol` (Unicode chess symbol) inside a colored card
   - What's unclear: Whether the plan replaces the Unicode symbol entirely or shows both SVG + symbol
   - Recommendation: Replace the Unicode symbol with the SVG image — the CONTEXT.md states "consistent piece appearance everywhere." An `<img style={{ width: 96, height: 96 }}>` at the card's center matches the original symbol sizing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "chess"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIECE-01 | Staunty pieces render on board (no blank squares) | smoke | `npm test -- --grep "chess movement"` — board renders, pieces visible | ✅ existing (movement puzzle test checks board renders) |
| PIECE-02 | Horsey theme renders when selected via localStorage | smoke | `npm test -- --grep "chess"` with localStorage preset | ❌ Wave 0 gap |
| PIECE-03 | Pieces render at 320px and 480px without clipping | manual | Visual inspection — Playwright can't easily verify SVG sizing | manual-only |
| PIECE-04 | Theme registration extension | manual | No automated test for "adding a new theme" — architecture verified by code review | manual-only |

### Sampling Rate
- **Per task commit:** `npm test -- --grep "chess"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add test: chess game renders with custom piece theme (horsey) — load page with `lepdy_chess_piece_theme: 'horsey'` in localStorage, verify board renders without blank squares

## Sources

### Primary (HIGH confidence)
- `node_modules/react-chessboard/dist/ChessboardProvider.d.ts` — `ChessboardOptions.pieces?: PieceRenderObject` confirmed
- `node_modules/react-chessboard/dist/types.d.ts` — `PieceRenderObject` type confirmed
- `node_modules/react-chessboard/dist/index.esm.js` — `fenToPieceCode()` logic confirmed, `pieces[pieceType]` call confirmed, piece div `width: '100%', height: '100%'` confirmed
- `node_modules/react-chessboard/package.json` — version 5.10.0 confirmed
- GitHub: `lichess-org/lila/public/piece/staunty/` — 12 SVG files, naming confirmed
- GitHub: `lichess-org/lila/public/piece/horsey/` — 12 SVG files, naming confirmed

### Secondary (MEDIUM confidence)
- GitHub: `lichess-org/lila/COPYING.md` — CC BY-NC-SA 4.0 license for staunty (sadsnake1) and horsey (cham, michael1241) confirmed via WebFetch
- lichess-org/lila staunty SVG structure: `viewBox="0 0 50 50"`, no explicit width/height, confirmed via WebFetch

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all API types verified from source files in node_modules
- Architecture: HIGH — patterns derived from verified API types and existing codebase patterns
- Pitfalls: HIGH for sizing/draggable/keys (all derived from verified source); MEDIUM for horsey visual distinctness (requires visual verification)
- SVG content/quality: MEDIUM — SVG structure confirmed (viewBox only, no width/height); visual quality of pieces at small sizes requires manual verification

**Research date:** 2026-03-22
**Valid until:** 2026-09-22 (stable libraries; lichess SVGs are stable assets; react-chessboard API unlikely to change at patch level)
