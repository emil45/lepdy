# Architecture Research

**Domain:** v1.4 Complete Puzzle Experience — new menu, practice mode, check/checkmate puzzles, visual polish, progress engagement layered onto existing chess game
**Researched:** 2026-03-23
**Confidence:** HIGH — based on direct codebase reading of all existing chess files

---

## Existing Architecture (as-shipped, v1.3)

The foundation all v1.4 features must integrate with.

### Current System Overview

```
app/[locale]/games/chess-game/
├── page.tsx                    (Server: locale, metadata)
├── ChessGameContent.tsx        (Client: state machine — 'map' | 'level-1' | 'session' | 'daily')
├── PieceIntroduction.tsx       (View: swipe through 6 pieces, Hebrew names + audio)
├── MovementPuzzle.tsx          (View: pure renderer — tap where piece can move)
├── CapturePuzzle.tsx           (View: pure renderer — tap which piece can capture)
├── SessionCompleteScreen.tsx   (View: 1-3 stars, per-piece mastery chips, next/back)
├── DailyPuzzleCard.tsx         (UI atom: daily puzzle entry on map)
├── StreakBadge.tsx             (UI atom: consecutive correct counter)
├── ChessSettingsDrawer.tsx     (Settings: piece theme selector)
└── pieceThemes.tsx             (Factory: staunty/horsey SVG render objects)

hooks/
├── useChessProgress.ts         (localStorage: completedLevels[], currentLevel)
├── useChessPieceTheme.ts       (localStorage: 'staunty' | 'horsey')
├── usePuzzleProgress.ts        (localStorage: per-piece tier + streak counters)
├── usePuzzleSession.ts         (sessionStorage: 10-puzzle queue, head index, streak)
└── useDailyPuzzle.ts           (localStorage: date-keyed completion flag)

data/
├── chessPieces.ts              (6 piece configs: id, translationKey, audioFile, fenChar, order)
└── chessPuzzles.ts             (movementPuzzles[61] + capturePuzzles[34], difficulty 1|2|3)

utils/
├── chessFen.ts                 (moveFenPiece: FEN piece-placement string manipulation)
└── puzzleGenerator.ts          (selectNextPuzzle: tier-aware random with 15-dedup window)
```

### Current State Machine (ChessGameContent)

```
ChessView = 'map' | 'level-1' | 'session' | 'daily'

'map'     → LevelMapCard × 3 (unlock: level N requires N-1 complete)
            DailyPuzzleCard (always visible, date-keyed)
'level-1' → <PieceIntroduction onComplete={() => setView('map')} completeLevel />
'session' → if isSessionComplete → <SessionCompleteScreen />
            else → <MovementPuzzle> or <CapturePuzzle> (dispatched by currentPuzzle.type)
'daily'   → <MovementPuzzle> or <CapturePuzzle> (dispatched by dailyPuzzle.type)
```

The `session` view is currently entered from Level 2 OR Level 3 on the map — both route to the same mixed session (5 movement + 5 capture interleaved). This is the "broken 1/2/3/daily structure" the redesigned menu must fix.

### Key Data Structures

```typescript
// ChessView type — will be extended for new views
type ChessView = 'map' | 'level-1' | 'session' | 'daily';

// SessionPuzzle — current union type; check/checkmate types will extend this
type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle };

// PiecePuzzleProgress — per-piece adaptive difficulty data
interface PiecePuzzleProgress {
  tier: 1 | 2 | 3;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

// MovementPuzzle + CapturePuzzle — the current puzzle data contracts
interface MovementPuzzle { id, pieceId, fen, pieceSquare, validTargets, difficulty }
interface CapturePuzzle  { id, fen, targetSquare, correctPieceSquare, correctPieceId,
                           targetPieceId, distractorSquares, difficulty }
```

---

## v1.4 Integration Map: Feature by Feature

### 1. Redesigned Game Menu

**What changes:** The current map has a flat list: Daily Puzzle + Level 1 + Level 2 + Level 3. Levels 2 and 3 both launch the same mixed session, which is confusing. The redesign replaces this with a clear, intuitive structure.

**Integration approach — minimum shell surgery:**

The `ChessView` union type is extended, and `ChessGameContent.tsx` gets new view branches. The existing `LevelMapCard` component is replaced or augmented with a new menu layout component. The LEVELS constant and the `map` render branch are the only code paths that change.

```
BEFORE: ChessView = 'map' | 'level-1' | 'session' | 'daily'
AFTER:  ChessView = 'menu' | 'learn' | 'practice' | 'challenge' | 'daily'
```

The `'map'` view becomes `'menu'`. The `'level-1'` view becomes `'learn'`. A new `'practice'` view enables per-piece drilling. The `'session'` view becomes `'challenge'` (or the session concept is embedded in the renamed view).

**New component:**
- `ChessMenuScreen.tsx` — replaces the inline map render in `ChessGameContent.tsx`. Owns the layout of menu tiles (Learn, Practice, Challenge, Daily). Receives unlock state and completion callbacks as props.

**Existing components that remain unchanged:**
- `DailyPuzzleCard.tsx` — reused in `ChessMenuScreen`
- `PieceIntroduction.tsx` — still renders for `'learn'` view
- `ChessSettingsDrawer.tsx` — still opened from menu header

**Modified:**
- `ChessGameContent.tsx` — extend `ChessView` type, add new view branches, replace inline map JSX with `<ChessMenuScreen />`

---

### 2. Practice Mode (Per-Piece Drilling)

**What it does:** User selects a specific piece, then drills movement and/or capture puzzles for that piece only — no mixed sessions.

**Integration approach:**

Practice mode reuses `usePuzzleSession` with a filtered puzzle pool. The key change is that `buildSessionQueue` in `usePuzzleSession.ts` currently hardcodes a 5+5 mixed interleave. For practice mode, the queue needs to be piece-filtered and configurable.

**Two options:**

Option A — Parameterize `usePuzzleSession`:
Pass a `pieceFilter?: ChessPieceId` option. When set, `buildSessionQueue` uses only puzzles for that piece. This is the lower-risk change — no new hook, existing session persistence logic is reused.

Option B — New `usePracticeSession` hook:
Separate hook with simplified logic (no mixed interleave, no sessionStorage persistence needed for practice). Cleaner interface, more testable.

**Recommendation: Option A.** The session queue builder is a pure function inside `usePuzzleSession.ts`. Adding a `pieceFilter` parameter to `buildSessionQueue` is a 10-line change. The rest of the session machinery (queue persistence, onAnswer, startNewSession, streak counting) is unchanged.

**New components:**
- `PieceSelectorScreen.tsx` — grid of 6 pieces, tap to start drilling. Receives `onSelect: (pieceId: ChessPieceId) => void`.
- ChessGameContent adds `'practice'` view branch that renders `PieceSelectorScreen`, then on piece select transitions to `'session'` view with `pieceFilter` prop threaded through.

**Modified:**
- `usePuzzleSession.ts` — add optional `pieceFilter?: ChessPieceId` parameter to `buildSessionQueue` call
- `ChessGameContent.tsx` — add `'practice'` view, thread `selectedPiece` state down to session

**Data flow:**
```
User taps Practice on menu
  → setView('practice')
  → PieceSelectorScreen renders 6 piece tiles
  → User taps "Rook"
  → setSelectedPiece('rook'), setView('session')
  → usePuzzleSession({ pieceFilter: 'rook' })
      → buildSessionQueue filters: only rook movement + rook capture puzzles
  → Normal session flow (streak, onAnswer, SessionCompleteScreen)
```

---

### 3. New Puzzle Types: Check and Checkmate-in-1

**What these are:**
- Check puzzle: Board position where the player must tap the piece currently giving check, or tap the king's escape square.
- Checkmate-in-1: Board position where one move delivers checkmate. Player taps the attacking piece and target square.

**Architecture fit:**

The existing `SessionPuzzle` discriminated union must be extended:

```typescript
// BEFORE
type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle };

// AFTER — additive extension
type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle }
  | { type: 'check'; puzzle: CheckPuzzle }
  | { type: 'checkmate'; puzzle: CheckmatePuzzle };
```

**New data interfaces:**

```typescript
export interface CheckPuzzle {
  id: string;
  fen: string;
  checkingPieceSquare: string;   // piece giving check — player taps this
  kingSquare: string;            // king in check (highlight target)
  difficulty: 1 | 2 | 3;
}

export interface CheckmatePuzzle {
  id: string;
  fen: string;
  attackingPieceSquare: string;  // piece that delivers checkmate
  targetSquare: string;          // square the piece moves to
  difficulty: 1 | 2 | 3;
}
```

**New renderer components:**
- `CheckPuzzle.tsx` — board renderer: highlights king in check, player taps checking piece
- `CheckmatePuzzle.tsx` — board renderer: player taps attacking piece then target square (two-tap interaction)

Both follow the existing renderer pattern: pure components, receive `puzzle`, `onAnswer`, `onExit` props, use `useChessPieceTheme`, `moveFenPiece`, and confetti on correct.

**Modified:**
- `data/chessPuzzles.ts` — add `checkPuzzles[]` and `checkmatePuzzles[]` arrays
- `hooks/usePuzzleSession.ts` — extend `buildSessionQueue` to optionally include check/checkmate types
- `ChessGameContent.tsx` — add dispatch branches for `type === 'check'` and `type === 'checkmate'` in the session render block

**chess.js usage for validation:**
Check and checkmate puzzles use chess.js for validation during authoring (data file creation), not at runtime. The FEN positions are pre-validated and stored statically, matching the existing curated puzzle approach. No new chess.js runtime dependency.

---

### 4. Visual Polish: Animations, Sounds, Celebrations

**What changes:**

This is not a new architecture layer — it's enhancement of existing component internals. Each polished element targets a specific component.

**Animation enhancements:**

| Location | Current | v1.4 |
|----------|---------|-------|
| `MovementPuzzle.tsx` | 200ms FEN slide (react-chessboard built-in) + confetti on correct | Add entrance animation for new puzzle (board slide-in or fade-scale), piece highlight pulse on load |
| `CapturePuzzle.tsx` | Same as MovementPuzzle | Same enhancements |
| `SessionCompleteScreen.tsx` | Confetti on 3 stars, Fade in | Add star reveal animation (stars appear one-by-one with 300ms stagger via MUI Grow) |
| `ChessMenuScreen.tsx` (new) | N/A | Tile entrance stagger (Grow × 4 tiles, 80ms delay offset) |
| `PieceSelectorScreen.tsx` (new) | N/A | Grid entrance stagger (Grow × 6 pieces) |

MUI's `Grow` and `Fade` are already used in the codebase (Fade in `ChessGameContent`, Grow in existing Lepdy components). No new animation library needed.

**Sound effects:**

The existing `playSound(AudioSounds.X)` system covers celebration sounds (`playRandomCelebration()`). The `AudioSounds` enum in `utils/audio.ts` may need new values for:
- Wrong-answer soft "thud" (currently silent per FEED-02 — evaluate if a gentle sound fits v1.4)
- Session complete fanfare (distinct from single-puzzle celebration)
- Tier advance notification sound ("getting harder!")

**Integration:** Callers already exist in `MovementPuzzle.tsx` and `CapturePuzzle.tsx`. Adding new `AudioSounds` values and calling `playSound()` at the right moments is self-contained. The `utils/audio.ts` file defines the enum — add values there, add audio files to `public/audio/common/`, done.

**Micro-rewards:**

The `StreakBadge.tsx` component already renders at streak milestones. Visual polish here means: add a brief scale-bounce animation when streak count increments (CSS keyframe via MUI's `sx` prop or a local `@keyframes` block). This is fully self-contained in `StreakBadge.tsx`.

---

### 5. Progress and Engagement (Visible Mastery, Return Motivation)

**What changes:**

The current `SessionCompleteScreen` already shows per-piece mastery bands (Beginner/Intermediate/Expert via chips with tier colors). The gap is that this mastery is invisible on the menu — kids don't know what level they're at when they arrive.

**Mastery display on menu:**

The `ChessMenuScreen.tsx` (new) should render visible mastery indicators for each piece directly on the menu. This requires reading from `usePuzzleProgress` — the hook that tracks `PiecePuzzleProgress` (tier + streaks) per piece.

`usePuzzleProgress` is currently only consumed inside `usePuzzleSession`. The menu can consume it directly — it's a standalone hook with no side effects when read.

**Return motivation (daily streak / visit counter):**

The Lepdy app already has `useStreak` for the broader app. The chess game has `useDailyPuzzle` which tracks per-day completion. v1.4 can surface the daily puzzle more prominently on the menu (e.g., highlight when uncompleted, show "come back tomorrow" state with a countdown or date).

No new storage needed — `useDailyPuzzle` already provides `isCompleted` and `dateKey`. The `ChessMenuScreen` just needs to render a more prominent daily card.

**Progress persistence — no changes needed to the storage layer.** The following hooks already cover everything:

| Hook | Stores | v1.4 Reads |
|------|--------|-----------|
| `usePuzzleProgress` | Per-piece tier (1/2/3) + consecutive counts | Menu mastery display |
| `useDailyPuzzle` | Date-keyed completion flag | Menu daily status |
| `useChessProgress` | Completed levels, currentLevel | Menu unlock state |
| `usePuzzleSession` | sessionStorage queue (session continuity) | Session resume |

---

## Recommended Component Structure (v1.4)

```
app/[locale]/games/chess-game/
├── page.tsx                      (unchanged)
├── ChessGameContent.tsx          (modified: extend ChessView, add view branches)
├── ChessMenuScreen.tsx           (new: replaces inline map JSX)
├── PieceSelectorScreen.tsx       (new: 6-piece grid for practice mode entry)
├── PieceIntroduction.tsx         (unchanged)
├── MovementPuzzle.tsx            (light polish: entrance animation, sound)
├── CapturePuzzle.tsx             (light polish: entrance animation, sound)
├── CheckPuzzle.tsx               (new: check detection renderer)
├── CheckmatePuzzle.tsx           (new: checkmate-in-1 renderer)
├── SessionCompleteScreen.tsx     (modified: star reveal animation, sounds)
├── DailyPuzzleCard.tsx           (modified: more prominent, contextual states)
├── StreakBadge.tsx               (modified: bounce animation on increment)
├── ChessSettingsDrawer.tsx       (unchanged)
└── pieceThemes.tsx               (unchanged)

hooks/
├── useChessProgress.ts           (unchanged — level gating)
├── useChessPieceTheme.ts         (unchanged)
├── usePuzzleProgress.ts          (unchanged — mastery tiers)
├── usePuzzleSession.ts           (modified: add pieceFilter param to buildSessionQueue)
└── useDailyPuzzle.ts             (unchanged)

data/
├── chessPieces.ts                (unchanged)
└── chessPuzzles.ts               (modified: add checkPuzzles[], checkmatePuzzles[])

utils/
├── chessFen.ts                   (unchanged)
└── puzzleGenerator.ts            (unchanged)
```

---

## Data Flow

### New View Routing Flow (ChessGameContent)

```
User opens chess game
  → ChessGameContent renders 'menu' view
  → <ChessMenuScreen> shows: Learn | Practice | Challenge | Daily + mastery summary

User taps Learn
  → setView('learn')
  → <PieceIntroduction onComplete={() => setView('menu')} completeLevel />
  → on complete: back to 'menu'

User taps Practice
  → setView('practice')
  → <PieceSelectorScreen onSelect={(pieceId) => { setSelectedPiece(pieceId); setView('session'); }} />

User taps Challenge
  → setView('session')
  → usePuzzleSession (no pieceFilter — mixed session)
  → normal 10-puzzle session flow

User taps Piece in PieceSelectorScreen
  → setSelectedPiece('rook')
  → setView('session')
  → usePuzzleSession({ pieceFilter: 'rook' })
  → filtered session flow — same SessionCompleteScreen on finish
```

### New Puzzle Type Dispatch (Session View)

```typescript
// ChessGameContent session view render block — extended
if (currentPuzzle.type === 'movement') return <MovementPuzzle ... />;
if (currentPuzzle.type === 'capture')  return <CapturePuzzle ... />;
if (currentPuzzle.type === 'check')    return <CheckPuzzle puzzle={currentPuzzle.puzzle} ... />;
if (currentPuzzle.type === 'checkmate') return <CheckmatePuzzle puzzle={currentPuzzle.puzzle} ... />;
```

### Check/Checkmate Puzzle Flow

```
usePuzzleSession builds queue
  → if check/checkmate types enabled (feature flag or unlock condition):
      buildSessionQueue may include CheckPuzzle or CheckmatePuzzle entries
  → currentPuzzle.type dispatched in ChessGameContent
  → CheckPuzzle or CheckmatePuzzle renderer mounts
  → User interaction → onAnswer(correct: boolean)
  → usePuzzleProgress.recordCorrect/recordWrong (same as movement/capture)
  → advance to next puzzle
```

---

## Component Boundary Contracts

| Component | Props In | Calls Out | Notes |
|-----------|----------|-----------|-------|
| `ChessMenuScreen` | `onSelectLearn`, `onSelectPractice`, `onSelectChallenge`, `onSelectDaily`, `isLevelUnlocked`, `isLevelCompleted`, `isDailyCompleted` | Reads `usePuzzleProgress` directly for mastery display | New component, pure UI + read-only hook access |
| `PieceSelectorScreen` | `onSelect: (pieceId: ChessPieceId) => void`, `onExit: () => void` | None | Pure UI picker; reads `usePuzzleProgress` for per-piece mastery badges |
| `CheckPuzzle` | `puzzle: CheckPuzzle`, `onAnswer: (correct: boolean) => void`, `onExit: () => void` | `playAudio`, `playRandomCelebration` | Mirrors MovementPuzzle structure |
| `CheckmatePuzzle` | `puzzle: CheckmatePuzzle`, `onAnswer: (correct: boolean) => void`, `onExit: () => void` | `playAudio`, `playRandomCelebration` | Two-tap interaction: piece then target square |
| `usePuzzleSession` | `pieceFilter?: ChessPieceId` (new optional param) | `usePuzzleProgress`, `selectNextPuzzle` | Additive change — no breaking change to existing callers |

---

## Architectural Patterns

### Pattern 1: Additive Extension of Discriminated Unions

**What:** New puzzle types (`check`, `checkmate`) are added to the `SessionPuzzle` union without removing existing members.
**When to use:** Any time a new puzzle type is added. TypeScript exhaustiveness checking will catch unhandled cases.
**Trade-offs:** ChessGameContent dispatch block grows, but remains explicit and type-safe. Each type is independently testable.

```typescript
// Extending the union — existing type narrowing in ChessGameContent continues to work
type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle }
  | { type: 'check'; puzzle: CheckPuzzle }      // new
  | { type: 'checkmate'; puzzle: CheckmatePuzzle }; // new
```

### Pattern 2: View-as-State (Existing Pattern, Extended)

**What:** `currentView` state in `ChessGameContent` drives which component renders. Each view is a full-screen component with its own exit callback.
**When to use:** All new screens follow this pattern. Add a new `ChessView` union member, add a render branch.
**Trade-offs:** Keeps ChessGameContent as a single-source-of-truth router. Risk is ChessGameContent growing — acceptable for this codebase size.

### Pattern 3: Pure Renderer Components

**What:** `MovementPuzzle`, `CapturePuzzle`, and new `CheckPuzzle`, `CheckmatePuzzle` are pure renderers. They receive `puzzle`, `onAnswer`, `onExit` via props. State is local feedback state (flash, hints, isAdvancing). No hooks for session logic.
**When to use:** Every new puzzle type renderer.
**Trade-offs:** Session coordination lives in `usePuzzleSession`, not scattered across renderers. Clean separation.

### Pattern 4: Optional Filter Parameterization

**What:** `usePuzzleSession` accepts an optional `pieceFilter` that narrows the puzzle pool. Default (undefined) preserves current mixed-session behavior.
**When to use:** Practice mode, or any future "drill this specific thing" mode.
**Trade-offs:** One hook serves both session modes. The `buildSessionQueue` function inside the hook needs a conditional — straightforward.

---

## Build Order (Phase Dependencies)

Dependencies flow bottom-up. Items later in the list depend on items above.

```
Phase A: Redesigned menu (no new data dependencies)
  ChessMenuScreen.tsx — new layout component
  ChessGameContent.tsx — extend ChessView, replace inline map JSX
  DailyPuzzleCard.tsx — visual enhancement
  i18n: new menu label keys
  [Depends on: nothing new — reads existing hooks]
  [Enables: visible foundation for other features; kids see the new menu immediately]

Phase B: Practice mode (depends on Phase A: 'practice' view exists in ChessView)
  PieceSelectorScreen.tsx — new component
  usePuzzleSession.ts — add pieceFilter param (additive)
  ChessGameContent.tsx — add 'practice' → PieceSelectorScreen flow
  [Depends on: Phase A (new view routing), usePuzzleSession]

Phase C: Check/checkmate puzzle data (independent of Phase A/B)
  data/chessPuzzles.ts — add checkPuzzles[], checkmatePuzzles[]
  SessionPuzzle type — extend union (additive)
  [Depends on: nothing — pure data + type addition]
  [Enables: Phase D renderers and Phase E session inclusion]

Phase D: Check/checkmate renderers (depends on Phase C data)
  CheckPuzzle.tsx — new renderer
  CheckmatePuzzle.tsx — new renderer
  ChessGameContent.tsx — add dispatch branches for new types
  [Depends on: Phase C (data + types)]

Phase E: Include check/checkmate in sessions (depends on C + D)
  usePuzzleSession.ts — include check/checkmate in buildSessionQueue
  Feature flag gate (chessCheckPuzzles) recommended during rollout
  [Depends on: Phase C data, Phase D renderers]

Phase F: Visual polish (can run in parallel with any phase)
  MovementPuzzle.tsx — entrance animation
  CapturePuzzle.tsx — entrance animation
  StreakBadge.tsx — bounce on increment
  SessionCompleteScreen.tsx — star reveal stagger
  AudioSounds enum — new values (session complete fanfare, tier advance)
  [Depends on: nothing new — internal component polish]

Phase G: Progress engagement (depends on Phase A: new menu exists)
  ChessMenuScreen.tsx — mastery summary section (reads usePuzzleProgress)
  PieceSelectorScreen.tsx — per-piece mastery badges (reads usePuzzleProgress)
  DailyPuzzleCard.tsx — streak/return motivation display
  [Depends on: Phase A (ChessMenuScreen), Phase B (PieceSelectorScreen)]
```

**Recommended shipping order:**
1. Phase A + F together (menu redesign + visual polish — immediately visible improvement)
2. Phase B (practice mode — high value, low risk)
3. Phase C + D together (data + renderers)
4. Phase E (wired into sessions, feature-flagged)
5. Phase G (engagement layer, informed by Phase A/B being stable)

---

## What Must NOT Change

These components and hooks are stable, well-tested, and should not be modified for v1.4:

| File | Reason to Preserve |
|------|-------------------|
| `PieceIntroduction.tsx` | Level 1 learning phase — correct and complete |
| `useChessProgress.ts` | Level gating logic — works correctly |
| `useChessPieceTheme.ts` + `pieceThemes.tsx` | Theme system — well-designed, no new themes needed |
| `ChessSettingsDrawer.tsx` | Settings UI — adequate for v1.4 |
| `useDailyPuzzle.ts` | Daily puzzle logic — deterministic hash is correct |
| `usePuzzleProgress.ts` | Adaptive difficulty per piece — working correctly |
| `utils/chessFen.ts` | FEN manipulation — tested |
| `utils/puzzleGenerator.ts` | Random selection with dedup — working |
| `data/chessPieces.ts` | Piece data — complete and stable |
| `localStorage` keys | All existing keys must be preserved — no migration needed |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Rebuilding usePuzzleSession Instead of Extending It

**What people do:** Create `usePracticeSession` as a new hook because practice mode "feels different" from challenge mode.
**Why it's wrong:** The session machinery (queue persistence, onAnswer flow, streak counting, SessionCompleteScreen integration) is identical. Duplicating it creates maintenance burden and inconsistent behavior.
**Do this instead:** Add `pieceFilter?: ChessPieceId` to the existing hook. The `buildSessionQueue` function is a pure helper — filtering by piece is a one-liner.

### Anti-Pattern 2: Storing New View State as Multiple useState Flags

**What people do:** `const [isPractice, setIsPractice] = useState(false)` alongside `const [isLearn, setIsLearn] = useState(false)`.
**Why it's wrong:** Mutually exclusive views as boolean flags create impossible states (both true) and make flow hard to follow.
**Do this instead:** Extend the existing `ChessView` union: `'menu' | 'learn' | 'practice' | 'challenge' | 'daily'`. One state, exhaustive type.

### Anti-Pattern 3: Dynamic Puzzle Generation for Check/Checkmate

**What people do:** Use chess.js to algorithmically generate check/checkmate positions at runtime.
**Why it's wrong:** The existing architecture is entirely curated-FEN-based. Runtime generation requires chess.js position evaluation, filtering for "kid-appropriate" complexity, and adds latency. The curated pattern is proven to work well for this age group.
**Do this instead:** Author check/checkmate puzzles as hand-curated FEN arrays (same as `movementPuzzles` and `capturePuzzles`). Validate with chess.js during authoring, not at runtime.

### Anti-Pattern 4: Putting Mastery Display Logic in ChessGameContent

**What people do:** Read `usePuzzleProgress` in `ChessGameContent` and pass mastery data down via props to the menu.
**Why it's wrong:** ChessGameContent is already a busy coordination shell. Prop-threading mastery data through it increases coupling.
**Do this instead:** Let `ChessMenuScreen` and `PieceSelectorScreen` consume `usePuzzleProgress` directly. These are client components — direct hook access is clean and follows the existing pattern (e.g., MovementPuzzle and CapturePuzzle both call `useChessPieceTheme` directly).

### Anti-Pattern 5: Feature-Flagging Visual Polish

**What people do:** Put animation additions behind feature flags to allow "safe rollback."
**Why it's wrong:** Animations are cosmetic and additive. Feature-flagging them adds complexity without meaningful benefit. If an animation causes an issue, it's a CSS fix.
**Do this instead:** Ship visual polish directly. Reserve feature flags for behavioral changes (new puzzle types entering session queues, practice mode until stable).

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `ChessGameContent` ↔ `ChessMenuScreen` | Props: unlock state, completion state, navigation callbacks | ChessGameContent remains the coordinator |
| `ChessGameContent` ↔ `PieceSelectorScreen` | Props: `onSelect`, `onExit` | selectedPiece lives in ChessGameContent state |
| `ChessGameContent` ↔ new puzzle renderers | Props: `puzzle`, `onAnswer`, `onExit` — same contract as existing renderers | New types slot into existing dispatch pattern |
| `usePuzzleSession` ↔ `buildSessionQueue` | `pieceFilter?: ChessPieceId` parameter — additive | Existing callers pass nothing — unchanged behavior |
| `ChessMenuScreen` ↔ `usePuzzleProgress` | Direct hook read for mastery display | No writes — read-only consumption |
| `PieceSelectorScreen` ↔ `usePuzzleProgress` | Direct hook read for per-piece badges | No writes — read-only consumption |
| `CheckPuzzle/CheckmatePuzzle` ↔ `chessFen.ts` | `moveFenPiece` for animation on correct answer | Same pattern as MovementPuzzle/CapturePuzzle |

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| Firebase Remote Config | `chessCheckPuzzles` flag to gate check/checkmate types entering sessions | Use existing `useFeatureFlagContext()` in `usePuzzleSession` |
| Amplitude | New events: `practice_mode_started`, `piece_selected_for_practice`, `check_puzzle_solved` | Use existing `logEvent()` pattern |
| localStorage | No new keys — all existing keys preserved | `lepdy_chess_progress`, `lepdy_chess_puzzle_progress`, `lepdy_chess_daily_*`, `lepdy_chess_piece_theme` |
| sessionStorage | `lepdy_chess_session` — no change | Session persistence continues to work; practice sessions also persist across page refresh |

---

## Scaling Considerations

| Concern | v1.4 | Future |
|---------|-------|--------|
| Puzzle pool for check/checkmate | 20-30 curated FEN positions per type (sufficient for "feels infinite" at 10 per session) | Could expand like movement/capture; algorithmic generation possible but not needed |
| Practice mode session variety | Piece filter + 3 tiers per piece × 10 puzzles per session = meaningful repetition before fatigue | Add "mixed" mode per piece (movement + capture for same piece) as a filter option |
| Visual animation performance | MUI Grow/Fade are CSS-based, zero JS overhead | Board entrance animations should use CSS transform, not layout-triggering properties |
| New puzzle type authoring | Manual FEN authoring with chess.js validation script | A simple CLI tool (`scripts/validatePuzzles.ts`) could auto-validate all FENs — already implicit in the codebase pattern |

---

## Sources

- Direct codebase reading: `ChessGameContent.tsx`, `MovementPuzzle.tsx`, `CapturePuzzle.tsx` (HIGH confidence — first-hand)
- Direct codebase reading: `usePuzzleSession.ts`, `usePuzzleProgress.ts`, `useChessProgress.ts`, `useDailyPuzzle.ts` (HIGH confidence — first-hand)
- Direct codebase reading: `data/chessPieces.ts`, `data/chessPuzzles.ts`, `utils/puzzleGenerator.ts` (HIGH confidence — first-hand)
- Direct codebase reading: `messages/en.json` (HIGH confidence — first-hand)
- PROJECT.md v1.4 milestone description (HIGH confidence — first-hand)
- Existing `.planning/research/ARCHITECTURE.md` (v1.3 research — HIGH confidence — first-hand)

---

*Architecture research for: v1.4 Complete Puzzle Experience — chess learning game*
*Researched: 2026-03-23*
