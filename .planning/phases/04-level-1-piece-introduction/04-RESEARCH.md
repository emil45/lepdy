# Phase 4: Level 1 — Piece Introduction - Research

**Researched:** 2026-03-22
**Domain:** React component composition, audio playback, MUI card UI, celebration pattern — all within existing Lepdy/chess codebase
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Piece Introduction Flow**
- Next/Back buttons for linear navigation — one piece at a time, enforcing progressive order (INTRO-04)
- Dot/step progress indicator (1/6, 2/6...) shows position in the sequence
- Back button enabled, skip-ahead disabled — kids can review but must go through in order on first pass
- After 6th piece: celebration screen (react-confetti) + auto-mark Level 1 complete, then return to level map

**Piece Card Visual Design**
- Large chess piece Unicode symbol (♔♖♗♕♘♙) from chessPieces.ts as primary visual — no image assets needed
- Large bold Hebrew name text below the piece, using piece's `color` for card background
- Centered audio play button below Hebrew name — large, tap-friendly, speaker icon, uses `playAudio()` pattern
- No board shown during introduction — clean focus on piece name/image only

**Level Completion & Integration**
- A piece is "introduced" when the child taps Next to advance past it — no quiz, no mandatory audio
- Level completion calls `completeLevel(1)` from existing `useChessProgress` hook
- Level 1 is replayable — tapping the Level 1 card re-enters intro flow from first piece
- New `PieceIntroduction` component rendered inside ChessGameContent when `currentView === 'level-1'` — matches existing view routing pattern

### Claude's Discretion
- Exact card dimensions, padding, and spacing
- Animation on piece transition (fade, slide, or none)
- Celebration screen duration before auto-return
- Audio button icon style and size
- Whether to show English/transliteration alongside Hebrew name

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTRO-01 | Each of the 6 chess pieces is introduced individually (one at a time) | `currentPieceIndex` state drives single-piece display; chessPieces array ordered by `order` field (1-6) |
| INTRO-02 | Piece introduction shows Hebrew name, piece image, and plays audio pronunciation (when audio file exists) | `t('chessGame.pieces.{id}')` for Hebrew name; `piece.symbol` for Unicode image; `playAudio('chess/he/${piece.audioFile}')` for audio |
| INTRO-03 | Audio is optional — game works fully without audio files; MP3 paths are placeholder references | `playAudio()` already catches errors silently (AbortError + generic catch) — missing files produce no crash |
| INTRO-04 | Pieces introduced in progressive order: King → Rook → Bishop → Queen → Knight → Pawn | chessPieces array sorted by `order` field, matches required sequence exactly |
</phase_requirements>

## Summary

Phase 4 is a pure front-end composition task with no new library requirements. All infrastructure is already in place: the chess piece data (`data/chessPieces.ts`), the progress hook (`hooks/useChessProgress.ts`), the view routing (`ChessGameContent.tsx`), and the audio system (`utils/audio.ts`). The celebration library (`react-confetti`) is installed and used in other games.

The primary deliverable is a single new client component: `PieceIntroduction`. It replaces the "Coming soon..." placeholder for `currentView === 'level-1'` in `ChessGameContent.tsx`. The component manages one state variable (`currentPieceIndex: number`) to step through the 6 pieces. When the child advances past piece 6, it calls `completeLevel(1)`, shows confetti, and auto-navigates back to the level map.

The only technical trap in this phase is audio path handling. `playAudio()` in `utils/audio.ts` prepends `/audio/` internally, so callers must pass relative paths like `chess/he/melech.mp3`. The `chessPieces.ts` data provides `piece.audioFile` (bare filename, e.g. `melech.mp3`) — combine as `playAudio(\`chess/he/${piece.audioFile}\`)`. Using `piece.audioPath` directly would result in double-prefix (`/audio//audio/chess/he/melech.mp3`).

**Primary recommendation:** Build `PieceIntroduction` as a single self-contained component in `app/[locale]/games/chess-game/PieceIntroduction.tsx`, import it directly in `ChessGameContent.tsx`, and keep all intro state local to that component.

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component state (`useState`) | Already the framework |
| MUI | 7.3.7 | Box, Typography, Button, IconButton | Existing design system |
| MUI Icons | 7.3.7 | VolumeUp for audio button, ArrowBack/ArrowForward | Already used everywhere |
| react-confetti | 6.4.0 | Celebration animation on level complete | Already installed, used in counting-game |
| next-intl | 4.7.0 | `useTranslations('chessGame')` for piece names | Existing i18n system |

### No New Packages Required

All dependencies are present. No `npm install` step needed for this phase.

## Architecture Patterns

### Recommended Project Structure

```
app/[locale]/games/chess-game/
├── page.tsx                    # (exists) Server component — unchanged
├── ChessGameContent.tsx        # (exists) View routing — minimal edit: replace placeholder
└── PieceIntroduction.tsx       # NEW — single component for all Level 1 logic
```

### Pattern 1: View Routing Integration

**What:** `ChessGameContent.tsx` uses `useState<ChessView>` to decide what to render. The `level-1` branch currently shows a "Coming soon..." placeholder.

**When to use:** Always — this is the established chess game pattern from Phase 3.

**Change required:**
```typescript
// ChessGameContent.tsx — replace the placeholder branch
if (currentView === 'level-1') {
  return (
    <PieceIntroduction
      onComplete={() => setCurrentView('map')}
    />
  );
}
```

The `PieceIntroduction` component receives `onComplete` as its only prop — it manages all internal state.

### Pattern 2: PieceIntroduction Component Structure

**What:** Local `currentPieceIndex` state drives which piece is shown. Next advances the index; at index 5 (last piece), Next triggers completion flow.

**Example:**
```typescript
// app/[locale]/games/chess-game/PieceIntroduction.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { chessPieces } from '@/data/chessPieces';
import { useChessProgress } from '@/hooks/useChessProgress';
import { playAudio, playSound, AudioSounds } from '@/utils/audio';
import { useTranslations } from 'next-intl';
import Confetti from 'react-confetti';

interface Props {
  onComplete: () => void;
}

export default function PieceIntroduction({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const t = useTranslations('chessGame');
  const { completeLevel } = useChessProgress();

  const currentPiece = chessPieces[currentIndex]; // sorted by .order

  const handleNext = () => {
    if (currentIndex < chessPieces.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      completeLevel(1);
      playSound(AudioSounds.LEVEL_UP);
      setIsComplete(true);
      // Auto-return after celebration
      setTimeout(() => onComplete(), 3000);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handlePlayAudio = useCallback(() => {
    playAudio(`chess/he/${currentPiece.audioFile}`);
  }, [currentPiece.audioFile]);

  if (isComplete) {
    return (
      <>
        <Confetti recycle={false} numberOfPieces={300} />
        {/* Celebration screen */}
      </>
    );
  }

  return (/* Piece card + nav UI */);
}
```

### Pattern 3: Audio Path Convention

**What:** `playAudio(path)` in `utils/audio.ts` constructs `new Audio(\`/audio/${path}\`)` — it prepends `/audio/` internally.

**Critical rule:**
```typescript
// CORRECT — uses audioFile (bare filename) with path prefix
playAudio(`chess/he/${piece.audioFile}`);  // → /audio/chess/he/melech.mp3

// WRONG — audioPath already has /audio/ prefix — results in double-prefix
playAudio(piece.audioPath);  // → /audio//audio/chess/he/melech.mp3
```

**Why it doesn't crash:** `playAudio` catches all errors except `AbortError` and logs them to console. Missing files or bad paths fail silently — INTRO-03 is already satisfied by the existing error handling.

### Pattern 4: Confetti Celebration with Auto-Return

**What:** Same pattern as counting-game's `showFinalCelebration` state.

**Example (from counting-game/page.tsx:630):**
```typescript
{showFinalCelebration && <Confetti recycle={false} numberOfPieces={300} />}
```

**Auto-return:** Use `setTimeout(() => onComplete(), 3000)` inside the `handleNext` completion branch. The 3-second delay is at Claude's discretion and matches the feel of other Lepdy celebrations.

### Pattern 5: Dot Progress Indicator

**What:** Row of small circles (filled for current/past, outlined for future) to show 1/6 through 6/6 progress.

**Implementation:** Simple MUI `Box` with `chessPieces.map()` producing small colored `Box` elements. No external library needed.

```typescript
<Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
  {chessPieces.map((_, i) => (
    <Box
      key={i}
      sx={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: i <= currentIndex ? 'primary.main' : 'grey.300',
      }}
    />
  ))}
</Box>
```

### Anti-Patterns to Avoid

- **Fetching piece data on mount:** All piece data is static TypeScript — import `chessPieces` directly, no async needed.
- **Using `piece.audioPath` with `playAudio()`:** Double-prefix bug. Use `piece.audioFile` with manual prefix.
- **Calling `completeLevel` in a useEffect on mount for replays:** Level 1 is replayable; only call `completeLevel(1)` when the child advances past the last piece.
- **Storing `currentIndex` in a parent component:** Keep it internal to `PieceIntroduction`. The parent only needs to know when it's done via `onComplete`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Celebration animation | Custom CSS animation | `react-confetti` (already installed) | Handles window sizing, particle physics, recycle=false auto-stop |
| Audio playback | `new Audio()` directly in component | `playAudio()` from `utils/audio.ts` | Centralized error handling, AbortError suppression, existing convention |
| Game effect sounds | `new Audio()` for level complete | `playSound(AudioSounds.LEVEL_UP)` | Pre-loaded, pre-referenced, correct sound for level completion |
| Progress persistence | Manual localStorage writes | `completeLevel(1)` from `useChessProgress` | Already handles deduplication, currentLevel advancement, save/load lifecycle |
| i18n piece names | Hardcoded Hebrew strings | `t('chessGame.pieces.king')` etc. | Already translated in he/en/ru.json |

**Key insight:** Every problem in this phase already has a solution in the codebase. The phase is about connecting existing pieces, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Double Audio Path Prefix

**What goes wrong:** Piece audio never plays (silently fails) because path resolves to `/audio//audio/chess/he/melech.mp3`.

**Why it happens:** `playAudio()` prepends `/audio/` internally. `chessPieces.ts` has two fields: `audioFile: 'melech.mp3'` (bare filename) and `audioPath: '/audio/chess/he/melech.mp3'` (full path). If you pass `audioPath` to `playAudio()`, you get double prefix.

**How to avoid:** Always use `playAudio(\`chess/he/${piece.audioFile}\`)` — never `playAudio(piece.audioPath)`.

**Warning signs:** Audio silently fails in browser console with 404 for path `/audio//audio/chess/he/...`.

### Pitfall 2: Confetti Component Positioned Wrong in RTL

**What goes wrong:** Confetti renders offset or clipped because the parent container has `direction: rtl` applied.

**Why it happens:** Hebrew locale uses RTL direction in MUI theme. Confetti uses window dimensions and DOM position — RTL can affect its coordinate calculations in some browsers.

**How to avoid:** Render `<Confetti>` at the top level of the component output, not nested inside a Box with explicit direction. Use `recycle={false}` to auto-stop after particles fall.

**Warning signs:** Confetti appears on the wrong side or doesn't fill the screen.

### Pitfall 3: completeLevel Called on Every Replay Visit

**What goes wrong:** Progress data gets re-written every time the child replays Level 1, potentially resetting `currentLevel` in an unexpected way.

**Why it happens:** If `completeLevel(1)` is triggered on mount or via a useEffect watching state, it fires on every re-entry.

**How to avoid:** Only call `completeLevel(1)` inside `handleNext` when `currentIndex === chessPieces.length - 1`. The `useChessProgress` hook already deduplicates (`alreadyCompleted` check), but avoiding unnecessary calls is cleaner.

**Warning signs:** No observable bug (hook deduplicates), but unnecessary state updates on replay.

### Pitfall 4: Audio Button Autoplay Policy Block

**What goes wrong:** Audio silently fails on first page load if triggered automatically (not from user gesture).

**Why it happens:** Browsers block `audio.play()` unless triggered by a direct user interaction (click, tap).

**How to avoid:** `handlePlayAudio` must only be called from a button's `onClick`. Never call `playAudio()` on component mount or in a `useEffect` without user gesture. This is already the pattern in other Lepdy categories.

**Warning signs:** Audio works on second tap but not the first — indicates autoplay policy.

## Code Examples

Verified patterns from existing codebase:

### Confetti usage (from counting-game/page.tsx:630)
```typescript
// Source: app/[locale]/games/counting-game/page.tsx
import Confetti from 'react-confetti';
const [showFinalCelebration, setShowFinalCelebration] = useState(false);

// In JSX:
{showFinalCelebration && <Confetti recycle={false} numberOfPieces={300} />}
```

### Audio playback (from counting-game/page.tsx:261)
```typescript
// Source: app/[locale]/games/counting-game/page.tsx
playAudio(`numbers/he/${numberData.audioFile}`);
// Pattern: playAudio(`{category}/he/${item.audioFile}`)
// For chess: playAudio(`chess/he/${piece.audioFile}`)
```

### Chess progress hook usage (from ChessGameContent.tsx:81)
```typescript
// Source: app/[locale]/games/chess-game/ChessGameContent.tsx
const { isLevelUnlocked, isLevelCompleted } = useChessProgress();
// Add completeLevel to destructuring:
const { isLevelUnlocked, isLevelCompleted, completeLevel } = useChessProgress();
```

### View routing pattern (from ChessGameContent.tsx:83-101)
```typescript
// Source: app/[locale]/games/chess-game/ChessGameContent.tsx
if (currentView !== 'map') {
  // Currently shows "Coming soon..."
  // Replace with: return <PieceIntroduction onComplete={() => setCurrentView('map')} />;
}
```

### chessPieces data shape (from data/chessPieces.ts)
```typescript
// Source: data/chessPieces.ts
const chessPieces: ChessPieceConfig[] = [
  { id: 'king', translationKey: 'chessGame.pieces.king',
    audioFile: 'melech.mp3', audioPath: '/audio/chess/he/melech.mp3',
    symbol: '♔', color: '#FFD700', order: 1 },
  // ... 5 more, ordered 1-6
];
// Order: King(1), Rook(2), Bishop(3), Queen(4), Knight(5), Pawn(6)
// Matches INTRO-04 requirement: King → Rook → Bishop → Queen → Knight → Pawn
```

### Translation keys (from messages/he.json:127-152)
```json
// Source: messages/he.json — all keys verified present in he, en, ru
"chessGame": {
  "pieces": { "king": "מלך", "queen": "מלכה", "rook": "צריח", "bishop": "רץ", "knight": "פרש", "pawn": "חייל" },
  "ui": { "next": "הבא", "back": "חזרה", "tapToHear": "לחצו לשמוע", "levelComplete": "השלב הושלם!" }
}
```

### playSound for level completion (from utils/audio.ts)
```typescript
// Source: utils/audio.ts
import { playSound, AudioSounds } from '@/utils/audio';
playSound(AudioSounds.LEVEL_UP);  // /audio/common/level-up.mp3
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright Test 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "chess"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTRO-01 | 6 piece cards appear one at a time, navigated with Next | E2E | `npm test -- --grep "piece introduction"` | ❌ Wave 0 |
| INTRO-02 | Hebrew name visible, symbol visible, audio button present | E2E | `npm test -- --grep "piece introduction"` | ❌ Wave 0 |
| INTRO-03 | Game does not crash when audio files are absent | E2E (passive) | Covered by test harness — no audio files in test env | ✅ implicit |
| INTRO-04 | First piece shown is King, last is Pawn in order | E2E | `npm test -- --grep "piece introduction"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --grep "chess"` (chess game tests only)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] E2E test block: `test.describe('Chess piece introduction', ...)` in `e2e/app.spec.ts` — covers INTRO-01, INTRO-02, INTRO-04
  - Test: navigating to level-1 shows a piece card with Hebrew name and audio button
  - Test: Next button advances through pieces (verify piece count)
  - Test: completing all 6 pieces returns to level map with Level 1 marked complete

## Sources

### Primary (HIGH confidence)

- Direct codebase read: `app/[locale]/games/chess-game/ChessGameContent.tsx` — view routing pattern confirmed
- Direct codebase read: `data/chessPieces.ts` — piece data structure, order, audioFile field names
- Direct codebase read: `hooks/useChessProgress.ts` — `completeLevel()` API, deduplication logic
- Direct codebase read: `utils/audio.ts` — `playAudio()` prepends `/audio/` (line 95), error handling (lines 96-101)
- Direct codebase read: `messages/he.json:127-152` — all chessGame translation keys verified present
- Direct codebase read: `app/[locale]/games/counting-game/page.tsx` — `<Confetti recycle={false}>` pattern

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` accumulated decisions — confirms audio is placeholder, `playAudio()` pattern, view routing decisions
- `.planning/research/PITFALLS.md` — prior research flagged audio path and autoplay policy pitfalls

### Tertiary (LOW confidence)

None — all findings verified directly from codebase source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified present in package.json and in active use
- Architecture: HIGH — `PieceIntroduction` integration point verified by reading ChessGameContent.tsx directly
- Pitfalls: HIGH — audio double-prefix verified by reading `playAudio()` source; RTL/confetti and autoplay verified from known browser behavior + existing pattern review

**Research date:** 2026-03-22
**Valid until:** Stable — no external APIs; valid until chessPieces.ts, audio.ts, or ChessGameContent.tsx changes
