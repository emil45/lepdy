# Phase 4: Level 1 — Piece Introduction - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A child can step through all 6 chess pieces, see each piece's image and Hebrew name, and hear the pronunciation. This phase delivers the Level 1 gameplay — piece introduction cards with navigation, audio playback, and level completion. No board rendering, no puzzles (those are Phases 5-6).

</domain>

<decisions>
## Implementation Decisions

### Piece Introduction Flow
- Next/Back buttons for linear navigation — one piece at a time, enforcing progressive order (INTRO-04)
- Dot/step progress indicator (1/6, 2/6...) shows position in the sequence
- Back button enabled, skip-ahead disabled — kids can review but must go through in order on first pass
- After 6th piece: celebration screen (react-confetti) + auto-mark Level 1 complete, then return to level map

### Piece Card Visual Design
- Large chess piece Unicode symbol (♔♖♗♕♘♙) from chessPieces.ts as primary visual — no image assets needed
- Large bold Hebrew name text below the piece, using piece's `color` for card background
- Centered audio play button below Hebrew name — large, tap-friendly, speaker icon, uses `playAudio()` pattern
- No board shown during introduction — clean focus on piece name/image only

### Level Completion & Integration
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/chessPieces.ts` — ChessPieceConfig[] with id, translationKey, audioPath, symbol, emoji, color, order
- `hooks/useChessProgress.ts` — `isLevelCompleted()`, `isLevelUnlocked()`, `completeLevel()` for progress tracking
- `app/[locale]/games/chess-game/ChessGameContent.tsx` — View routing with `useState<ChessView>`, level map, back button
- `utils/audio.ts` — `playAudio(path)` for playing audio files, `playSound()` for game effects
- `react-confetti` — Already installed, used in other games for celebrations
- `messages/{he,en,ru}.json` — Translation namespace `chessGame.pieces.*` already has all 6 piece names

### Established Patterns
- View routing: `useState<ChessView>` union type for single-page navigation within chess game
- Audio playback: `playAudio(audioPath)` with graceful failure when files don't exist
- Game sounds: `playSound(AudioSounds.CORRECT)` for celebration effects
- Client components: `'use client'` directive with hooks for state management
- MUI responsive: `sx` prop with breakpoints for tablet sizing

### Integration Points
- `ChessGameContent.tsx` — Replace "Coming soon..." placeholder for `level-1` view with `PieceIntroduction` component
- `useChessProgress` — Call `completeLevel(1)` when all 6 pieces have been viewed
- `chessPieces` array — Import and iterate in order for piece data
- Translation keys — `chessGame.pieces.{king|rook|bishop|queen|knight|pawn}` already defined

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard piece introduction flow following Lepdy's learning pattern (visual + text + audio).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-level-1-piece-introduction*
*Context gathered: 2026-03-22 via smart discuss*
