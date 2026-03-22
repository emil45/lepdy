# Phase 17: Session Complete + Progression UI - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the minimal session-complete message from Phase 16 with a satisfying end-of-session reward screen featuring 1-3 stars based on accuracy, named mastery bands per piece, and positive feedback when difficulty advances.

</domain>

<decisions>
## Implementation Decisions

### Session Complete Screen
- 3 stars: 8+ first-try correct out of 10. 2 stars: 5-7. 1 star: 0-4 — generous thresholds for young kids
- Visual elements: big star display (1-3 stars), confetti on 3 stars, score text "N/10 correct!", "Start New Session" button
- Star thresholds configurable via Firebase Remote Config for post-launch tuning with Amplitude data
- First-try accuracy tracked by counting puzzles answered correctly on first tap (usePuzzleSession already tracks this)

### Mastery Bands
- Band names: Beginner (tier 1), Intermediate (tier 2), Expert (tier 3) — maps to existing difficulty tiers
- Shown on session complete screen, listed per piece with piece emoji + band name
- Translated across Hebrew/English/Russian — add translation keys for each band name
- Visual style: colored chip/badge per piece — e.g., "♜ Rook — Expert" with color matching tier

### Difficulty Advancement Feedback
- "Getting harder!" shown on session complete screen when any piece's tier advanced during the session
- Visual: celebratory text + arrow up icon below affected piece's mastery chip in accent color
- No "Getting easier" on de-escalation — positive feedback only per project principle
- Detect tier change by comparing tier before session (getSessionTier at start) vs current tier at end

### Claude's Discretion
- Exact star visual implementation (MUI icons vs custom SVG)
- Color scheme for mastery tier badges
- Exact confetti trigger timing and duration
- Layout of mastery chips on session complete screen

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/usePuzzleSession.ts` — manages session state, tracks `consecutiveCorrect`, `firstTryCorrect` count, `isSessionComplete`
- `hooks/usePuzzleProgress.ts` — `getSessionTier` returns frozen tier per piece, `recordCorrect`/`recordWrong` update progress
- `app/[locale]/games/chess-game/ChessGameContent.tsx` — has minimal session-complete screen (Phase 16)
- `react-confetti` — already used in puzzle components for correct answers
- `data/chessPieces.ts` — piece data with emoji, Hebrew names, IDs

### Established Patterns
- Confetti used in MovementPuzzle/CapturePuzzle on correct answers
- MUI Chip component for badges
- Star icons already imported in ChessGameContent (StarIcon from MUI)
- Firebase Remote Config flags pattern established in Phase 15

### Integration Points
- Session complete screen currently rendered in ChessGameContent when `isSessionComplete` is true
- usePuzzleSession exposes `firstTryCount`, `startNewSession`
- Phase 18 will add daily puzzle entry point to the level map

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
