# Phase 20: Practice Mode - Research

**Researched:** 2026-03-23
**Domain:** React component architecture — new view states wired into existing ChessGameContent state machine
**Confidence:** HIGH

## Summary

Practice Mode is a shallow extension of the existing chess game architecture. All the heavy machinery (adaptive difficulty tiers, puzzle generation, audio playback, streak celebrations, sound effects) already exists and is wired in `ChessGameContent.tsx`. The work is three focused additions: (1) extend the `ChessView` union type with two new views, (2) create a `PracticePicker.tsx` component that renders a 2x3 piece grid, (3) extend `usePuzzleSession` to accept an optional `pieceFilter` that constrains puzzle generation to a single piece.

The `PieceIntroduction.tsx` component is the canonical reference for the pattern: it iterates `chessPieces`, renders piece SVG images using `/chess/pieces/${theme}/w${fenChar}.svg`, reads translations from `chessGame.pieces.*`, and calls `playAudio()` on interaction. The new `PracticePicker.tsx` follows this same pattern with an added mastery band label per card.

The `buildSessionQueue` function in `usePuzzleSession.ts` currently hard-codes 5 movement + 5 capture slots with a round-robin piece rotation. Adding a `pieceFilter: ChessPieceId | undefined` parameter makes it generate an unlimited single-piece queue (no `SESSION_SIZE` cap) when a filter is provided. Practice mode skips `isSessionComplete` — after `onAnswer(correct)` the hook just advances `headIndex` beyond the queue, so the practice loop must generate a fresh puzzle each time the queue is exhausted.

**Primary recommendation:** Add `pieceFilter` to `buildSessionQueue`, add `'practice-picker'` and `'practice'` to `ChessView`, create `PracticePicker.tsx` from the `PieceIntroduction.tsx` pattern, and render puzzle views inline in `ChessGameContent.tsx` the same way `'session'` view is rendered — with no end-screen and `onExit` returning to `'practice-picker'`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Piece Picker Grid Layout**
- 2x3 grid layout for 6 pieces — shows all pieces above fold, matches hub grid aesthetic
- Each card shows: SVG piece image, Hebrew name text, current mastery band label
- Cards use each piece's existing `color` from `chessPieces.ts` (gold=king, blue=rook, plum=bishop, pink=queen, green=knight, khaki=pawn)
- Tapping a card auto-plays the Hebrew name audio AND selects the piece (one-tap flow, no separate audio button)

**Practice Session Behavior**
- Continuous loop — after solving one puzzle, immediately show the next with no end screen
- Reuse `buildSessionQueue` with `pieceFilter` parameter to generate puzzles for the selected piece
- Same adaptive difficulty tier system as Challenge — `usePuzzleProgress` already tracks per-piece tiers
- Exit button returns to the piece picker screen (not straight to the hub menu)

**Practice Mode Integration**
- Add `'practice-picker'` and `'practice'` to the `ChessView` union type
- Hub Practice tile navigates to `'practice-picker'` (replacing current `'session'` placeholder)
- Same sound effects as Challenge — reuse existing `handleAnswer` wrapper (SUCCESS/WRONG_ANSWER)
- Same streak celebrations at milestones 3, 5, 10 — `consecutiveCorrect` tracking and confetti already wired

### Claude's Discretion
No items deferred to Claude's discretion — all grey areas resolved by user.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRAC-01 | User can select a specific chess piece from a 6-piece grid showing SVG, Hebrew name, and mastery band | `PracticePicker.tsx` — new component following `PieceIntroduction.tsx` pattern; reads `chessPieces`, renders `w{fenChar}.svg`, shows `getBandKey(tier)` label from `usePuzzleProgress.data.pieces` |
| PRAC-02 | User plays infinite adaptive drills for the selected piece with no session limit | `buildSessionQueue` needs `pieceFilter` param; practice view has no `isSessionComplete` check — instead calls `buildNextPracticeQueue(pieceId)` when puzzle is solved |
| PRAC-03 | User hears Hebrew piece name audio on the practice piece picker screen | `playAudio(piece.audioPath)` called in `onClick` of each picker card — same call site pattern as `PieceIntroduction.tsx` line 34 |
</phase_requirements>

## Standard Stack

### Core (no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MUI Grid | 7.3.7 | 2x3 piece picker layout | Already used in `ChessHubMenu.tsx` — confirmed to be MUI v7 API (not Grid2) |
| MUI Card + CardActionArea | 7.3.7 | Tappable piece cards | Exact same pattern used in `ChessHubMenu.tsx` |
| MUI Chip | 7.3.7 | Mastery band label on each card | Already used in `SessionCompleteScreen.tsx` for tier display |
| next-intl useTranslations | 4.7.0 | Piece name + mastery band text | All translations for both already exist in messages files |
| playAudio / playSound | existing | Audio on tap + puzzle sound effects | `playAudio(piece.audioPath)` is the established call pattern |
| react-confetti | 6.4.0 | Streak milestone confetti | Already wired in `ChessGameContent.tsx` — no change needed |

**Installation:** No new packages required.

## Architecture Patterns

### Existing ChessView State Machine (extend, don't replace)

`ChessGameContent.tsx` uses a union-type + `assertNever` guard pattern:

```typescript
// Current type (line 27)
type ChessView = 'hub' | 'level-1' | 'session' | 'daily';

// Extended for Phase 20:
type ChessView = 'hub' | 'level-1' | 'session' | 'daily' | 'practice-picker' | 'practice';
```

Each view is a top-level `if (currentView === '...')` block returning JSX. The `assertNever` guard at the bottom ensures TypeScript errors if a new view case is not handled.

**Note:** `ChessView` is also duplicated as a local type in `ChessHubMenu.tsx`. Both must be updated when adding new views, OR `ChessHubMenu.tsx` only needs to list views that hub tiles can navigate to — check whether `ChessHubMenuProps.onNavigate` type annotation matters for the picker views.

### Practice Picker Component Pattern

`PieceIntroduction.tsx` is the closest existing example of iterating `chessPieces` with SVG images and audio:

```typescript
// Pattern from PieceIntroduction.tsx line 148-167
<img
  src={`/chess/pieces/${theme}/w${currentPiece.fenChar}.svg`}
  alt={t(currentPiece.translationKey as Parameters<typeof t>[0])}
  style={{ width: 96, height: 96, display: 'block' }}
  draggable={false}
/>
// Audio: playAudio(`chess/he/${currentPiece.audioFile}`)
// OR use piece.audioPath directly: playAudio is called with relative path from public/audio/
```

**Audio path note:** `PieceIntroduction.tsx` calls `playAudio('chess/he/${audioFile}')` (relative path). `chessPieces.ts` also exports `audioPath: '/audio/chess/he/melech.mp3'` (absolute public path). Confirm which form `playAudio()` accepts — check `utils/audio.ts` if ambiguous.

### Mastery Band Display Pattern

`SessionCompleteScreen.tsx` shows the established tier-to-label and tier-to-color mapping:

```typescript
// From SessionCompleteScreen.tsx lines 26-36
function getBandKey(tier: 1 | 2 | 3): string {
  if (tier === 3) return 'ui.masteryExpert';
  if (tier === 2) return 'ui.masteryIntermediate';
  return 'ui.masteryBeginner';
}

function getTierColor(tier: 1 | 2 | 3): string {
  if (tier === 3) return '#ffcd36'; // gold
  if (tier === 2) return '#dbc3e2'; // purple
  return '#9ed6ea'; // blue
}
```

These exact helpers should be extracted to a shared utility or duplicated verbatim in `PracticePicker.tsx`. Extraction is cleaner — both `SessionCompleteScreen` and the new picker use them.

### buildSessionQueue pieceFilter Extension

```typescript
// Current signature (usePuzzleSession.ts line 41)
function buildSessionQueue(
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3
): SessionPuzzle[]

// Extended signature:
function buildSessionQueue(
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3,
  pieceFilter?: ChessPieceId
): SessionPuzzle[]
```

When `pieceFilter` is provided, the function generates a small batch (e.g. 5-10 puzzles) for that piece only. The practice session view regenerates this queue each time it empties, creating the continuous loop. The `SESSION_SIZE` constant (10) should NOT apply in practice mode — the `onAnswer` handler must know whether it is in a capped or uncapped session.

**Design choice:** The cleanest approach is a separate `usePracticeSession` hook or an extended `usePuzzleSession` with a `mode: 'challenge' | 'practice'` parameter. Review which approach keeps the existing session persistence logic intact (practice sessions should NOT persist to `SESSION_STORAGE_KEY` to avoid corrupting a mid-challenge session if user switches).

### Infinite Loop Implementation

Practice mode has no session limit. The loop works as:

1. User selects piece P on the picker screen
2. `buildSessionQueue(getSessionTier, P)` generates a small batch (e.g. 5 puzzles)
3. User solves puzzles — `headIndex` advances
4. When `headIndex >= queue.length` (not a fixed `SESSION_SIZE`), generate a fresh batch and reset `headIndex` to 0
5. No `SessionCompleteScreen` — no `isSessionComplete` flag used in practice mode

**Alternative approach:** Generate a longer queue (20+ puzzles) upfront and extend it in the background. For ages 5-9, a 5-puzzle refresh cycle is imperceptible and simpler.

### ChessHubMenu Update

`ChessHubMenu.tsx` currently routes the Practice tile to `view: 'session'`. It must change to `view: 'practice-picker'`. The local `ChessView` type in `ChessHubMenu.tsx` must include `'practice-picker'`.

```typescript
// Change in HUB_TILES array (ChessHubMenu.tsx line 24):
{ id: 'practice', emoji: '♞', labelKey: 'hub.practice', color: '#dee581', view: 'practice-picker' },
```

### File Layout

```
app/[locale]/games/chess-game/
├── ChessGameContent.tsx      // extend ChessView, add practice-picker + practice view blocks
├── ChessHubMenu.tsx          // update practice tile view from 'session' to 'practice-picker'
├── PracticePicker.tsx        // NEW — 2x3 piece selection grid
hooks/
├── usePuzzleSession.ts       // extend buildSessionQueue with pieceFilter
```

### Anti-Patterns to Avoid

- **Modifying ChessView type only in ChessGameContent.tsx** — the type is duplicated in `ChessHubMenu.tsx`. Both files must be updated or the type should be extracted to a shared `types/chess.ts`.
- **Persisting practice session to `SESSION_STORAGE_KEY`** — the challenge session key `lepdy_chess_session` must not be touched by practice mode. Use no persistence or a separate key.
- **Showing a session complete screen after practice** — the locked decision is a continuous loop with no end screen.
- **Adding a separate audio button to picker cards** — the locked decision is one-tap: audio plays AND piece selects simultaneously.
- **Using `isSessionComplete` in practice view** — this flag is based on `headIndex >= SESSION_SIZE` (10). Practice mode uses a different termination condition (none — continuous).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Adaptive tier tracking | Custom per-piece score state | `usePuzzleProgress.recordCorrect/recordWrong` | Already handles advance/demote thresholds, localStorage persistence, feature flags |
| Streak confetti | Custom animation | `showMilestoneConfetti` + `react-confetti` already in `ChessGameContent` | Already triggered by `consecutiveCorrect` state updates |
| Audio playback | Custom Audio API calls | `playAudio(piece.audioPath)` from `utils/audio.ts` | Handles abort errors, rapid-click safety |
| Piece SVG rendering | Inline SVG or external lib | `<img src={/chess/pieces/${theme}/w${fenChar}.svg}>` | Consistent with PieceIntroduction, supports theme switching |
| Mastery band label | Custom tier-to-string logic | `getBandKey` helper (extract from SessionCompleteScreen) | Same color + label scheme used elsewhere |

**Key insight:** Phase 20 is entirely composition of existing pieces. The only genuinely new code is `PracticePicker.tsx` and the `pieceFilter` parameter on `buildSessionQueue`. Everything else is wiring existing state and components.

## Common Pitfalls

### Pitfall 1: ChessView Type Divergence
**What goes wrong:** `ChessView` is defined locally in both `ChessGameContent.tsx` (line 27) and `ChessHubMenu.tsx` (line 11). Adding `'practice-picker'` to only one file causes TypeScript errors where `onNavigate` prop type disagrees.
**Why it happens:** The type was duplicated rather than shared — common in quick-iteration code.
**How to avoid:** Update both type definitions in the same plan step. Alternatively, extract to `types/chess.ts` and import.
**Warning signs:** TypeScript error "Argument of type 'practice-picker' is not assignable to parameter of type ChessView" on the `onNavigate` call.

### Pitfall 2: SESSION_SIZE Cap in Practice Mode
**What goes wrong:** `usePuzzleSession.onAnswer` guards `if (headIndex >= SESSION_SIZE) return;` (line 170). If practice reuses the same hook without modification, answering puzzle 11+ silently does nothing.
**Why it happens:** `SESSION_SIZE = 10` is a constant assumption baked into `onAnswer`.
**How to avoid:** Either pass a `sessionSize` parameter, or use `Infinity` for practice mode, or create a `usePracticeSession` hook that omits the cap.
**Warning signs:** Practice loop stops advancing after 10 correct answers with no visible error.

### Pitfall 3: Practice Polluting Challenge Session State
**What goes wrong:** If practice mode calls `startNewSession()` or writes to `SESSION_STORAGE_KEY`, it overwrites any mid-challenge session the user has open.
**Why it happens:** `usePuzzleSession` couples session storage to a single key.
**How to avoid:** Practice mode must never call `startNewSession()`. If it uses the same hook, add a `mode` parameter that disables persistence. The safest option is a standalone `usePracticeSession` hook with no sessionStorage usage.
**Warning signs:** After switching between practice and challenge, the challenge session position is reset.

### Pitfall 4: Audio Path Format Mismatch
**What goes wrong:** `PieceIntroduction.tsx` calls `playAudio('chess/he/melech.mp3')` using a relative path from `public/audio/`. The `chessPieces` data also exports `audioPath: '/audio/chess/he/melech.mp3'` as an absolute path. Passing the wrong format to `playAudio()` silently fails or loads a 404 URL.
**Why it happens:** Two different path conventions exist in the codebase.
**How to avoid:** Check `utils/audio.ts` to confirm which format `playAudio()` expects. Mirror the pattern from `PieceIntroduction.tsx` exactly.
**Warning signs:** No audio plays on picker tap, browser network tab shows 404 for audio file.

### Pitfall 5: Pawn Excluded in Challenge but Included in Practice
**What goes wrong:** `SessionCompleteScreen.tsx` line 55 notes `chessPieces.filter((p) => p.id !== 'pawn')` because pawn has no puzzles in the session queue. If practice lets users select Pawn but `buildSessionQueue` with `pieceFilter='pawn'` returns zero puzzles, the practice view will show a permanent loading state.
**Why it happens:** Pawn is in `chessPieces` but is not used as a puzzle piece in the existing puzzle data.
**How to avoid:** Verify whether pawn puzzles exist in `chessPuzzles.ts`. If not, either disable the pawn card on the picker or ensure `buildSessionQueue` falls back gracefully. Check `chessPuzzles.ts` before deciding.
**Warning signs:** Practice picker shows all 6 pieces but pawn selection results in an empty puzzle queue.

## Code Examples

### PracticePicker card structure (from ChessHubMenu + SessionCompleteScreen patterns)
```typescript
// Source: ChessHubMenu.tsx (card pattern) + SessionCompleteScreen.tsx (tier display)
<Grid container spacing={2} sx={{ width: '100%', maxWidth: 520 }}>
  {chessPieces.map((piece) => {
    const tier = currentTiersByPiece[piece.id]?.tier ?? 1;
    return (
      <Grid key={piece.id} size={4}> {/* size=4 gives 3 cols in a 12-col grid = 2x3 */}
        <Card
          data-testid="practice-piece-card"
          sx={{ bgcolor: piece.color, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <CardActionArea
            onClick={() => onSelectPiece(piece.id)}
            sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}
          >
            <img
              src={`/chess/pieces/${theme}/w${piece.fenChar}.svg`}
              alt={t(piece.translationKey as Parameters<typeof t>[0])}
              style={{ width: 64, height: 64 }}
              draggable={false}
            />
            <Typography variant="body1" fontWeight="bold" textAlign="center">
              {t(piece.translationKey as Parameters<typeof t>[0])}
            </Typography>
            <Chip
              label={t(getBandKey(tier) as Parameters<typeof t>[0])}
              size="small"
              sx={{ bgcolor: getTierColor(tier), fontWeight: 'bold' }}
            />
          </CardActionArea>
        </Card>
      </Grid>
    );
  })}
</Grid>
```

### buildSessionQueue with pieceFilter
```typescript
// Extend existing signature in usePuzzleSession.ts
function buildSessionQueue(
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3,
  pieceFilter?: ChessPieceId
): SessionPuzzle[] {
  if (pieceFilter) {
    // Practice mode: generate a small batch for one piece only
    const queue: SessionPuzzle[] = [];
    let genState: GeneratorState = defaultGeneratorState();
    const tier = getSessionTier(pieceFilter);
    for (let i = 0; i < 5; i++) {
      const { puzzle, nextState } = selectNextPuzzle(movementPuzzles, tier, genState);
      genState = nextState;
      queue.push({ type: 'movement', puzzle });
    }
    return queue;
  }
  // ... existing logic unchanged
}
```

### ChessGameContent practice-picker view block
```typescript
// Pattern mirrors 'session' view in ChessGameContent.tsx
if (currentView === 'practice-picker') {
  return (
    <Fade in={true} timeout={300}>
      <div>
        <PracticePicker
          currentTiersByPiece={currentTiersByPiece}
          onSelectPiece={(pieceId) => {
            setPracticePieceId(pieceId);
            setCurrentView('practice');
          }}
          onBack={() => setCurrentView('hub')}
        />
      </div>
    </Fade>
  );
}
```

## Open Questions

1. **Does pawn have puzzles in chessPuzzles.ts?**
   - What we know: `SessionCompleteScreen.tsx` explicitly filters pawn out of the display (`chessPieces.filter((p) => p.id !== 'pawn')`), suggesting pawn has no movement/capture puzzles.
   - What's unclear: Whether pawn capture puzzles exist as distractors vs. as the target piece.
   - Recommendation: Read `chessPuzzles.ts` at plan time and either disable pawn in the picker (show grayed out) or confirm it has enough puzzles to drill. The planner should check this before writing tasks.

2. **Shared `ChessView` type vs. duplicate**
   - What we know: The type is currently duplicated in two files.
   - What's unclear: Whether extracting it to `types/chess.ts` is within this phase's scope or out-of-scope cleanup.
   - Recommendation: Update both files in the same plan step. Do not extract (would require changes to both import sites + a new file — more risk for the same benefit).

3. **`usePracticeSession` vs. extending `usePuzzleSession`**
   - What we know: The existing hook has session cap and storage logic that must not apply to practice.
   - What's unclear: Whether a `mode` parameter or a new hook is cleaner.
   - Recommendation: A dedicated `usePracticeSession` hook avoids modifying the tested challenge session hook and eliminates pitfall 3 entirely. This is the lower-risk approach.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is entirely code/config changes to existing Next.js components and hooks).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "Practice"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRAC-01 | Practice picker shows 6 piece cards | smoke | `npm test -- --grep "practice picker shows 6 piece cards"` | Wave 0 |
| PRAC-01 | Each card shows SVG, Hebrew name, mastery band | smoke | `npm test -- --grep "practice picker card content"` | Wave 0 |
| PRAC-02 | Practice session loops without end screen | smoke | `npm test -- --grep "practice session loops"` | Wave 0 |
| PRAC-03 | Tapping a piece card plays audio + navigates to practice | smoke | `npm test -- --grep "practice picker audio"` (audio verified via no-crash) | Wave 0 |
| Hub wiring | Practice hub tile navigates to picker (not challenge session) | smoke | `npm test -- --grep "hub practice tile navigates"` | Wave 0 |
| Existing | Hub shows 4 tiles | regression | `npm test -- --grep "hub shows four tiles"` | ✅ exists |
| Existing | Challenge session still works | regression | `npm test -- --grep "Challenge session renders"` | ✅ exists |

### Sampling Rate
- **Per task commit:** `npm test -- --grep "Chess"` (all chess tests, ~10 tests, <30s)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases for PRAC-01, PRAC-02, PRAC-03 — add to existing `test.describe('Chess game shell')` block in `e2e/app.spec.ts`
- [ ] No new config or fixtures needed — existing Playwright setup covers all new tests

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `ChessGameContent.tsx` — ChessView union, assertNever, view render pattern, handleAnswer, confetti logic
- Direct code inspection: `ChessHubMenu.tsx` — Hub tile structure, MUI Grid usage (confirmed Grid not Grid2 per STATE.md decision)
- Direct code inspection: `usePuzzleSession.ts` — buildSessionQueue signature, SESSION_SIZE, onAnswer guard, session storage key
- Direct code inspection: `usePuzzleProgress.ts` — getSessionTier, recordCorrect, recordWrong, data.pieces shape
- Direct code inspection: `PieceIntroduction.tsx` — SVG image pattern, playAudio call, chessPieces iteration
- Direct code inspection: `SessionCompleteScreen.tsx` — getBandKey, getTierColor helpers, pawn exclusion comment
- Direct code inspection: `chessPieces.ts` — piece colors, audioPath, fenChar, translationKey
- Direct code inspection: `messages/he.json` + `messages/en.json` — existing translations for mastery bands, hub labels; no new translations needed for picker
- Direct code inspection: `e2e/app.spec.ts` — existing test patterns, data-testid conventions

### Secondary (MEDIUM confidence)
- STATE.md: "Grid from @mui/material/Grid (not Grid2) — MUI 7.x Grid2 path does not exist; Grid is the v2 API" — confirmed decision from Phase 19

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all libraries confirmed present at exact versions
- Architecture: HIGH — full source code read, all integration points located and verified
- Pitfalls: HIGH — pawn exclusion and SESSION_SIZE cap identified from direct code inspection, not speculation
- Validation: HIGH — Playwright test infrastructure in place, pattern clear from existing chess tests

**Research date:** 2026-03-23
**Valid until:** Until any of `usePuzzleSession.ts`, `ChessGameContent.tsx`, or `chessPieces.ts` are modified
