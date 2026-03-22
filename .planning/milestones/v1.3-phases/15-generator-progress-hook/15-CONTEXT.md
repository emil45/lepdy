# Phase 15: Generator + Progress Hook - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a random puzzle generator that selects puzzles at the right difficulty, skips recently seen puzzles, remembers player progress across sessions, and shows Hebrew piece names with pronunciation on every puzzle.

</domain>

<decisions>
## Implementation Decisions

### Generator Architecture
- Puzzle generator lives in `utils/puzzleGenerator.ts` — pure functions, no React dependency, testable. chess.js SSR guard needed (client-only import)
- Recently-seen window: sliding window of last 15 puzzle IDs stored in session state — resets on new session, prevents repetition within a play session
- Selection pipeline: filter pool by difficulty tier → exclude recently seen → random pick
- New `hooks/usePuzzleProgress.ts` for difficulty/progress state — extends existing useChessProgress pattern with localStorage, separate storage key

### Difficulty Adaptation
- Difficulty increases after 5 consecutive correct answers — stored per-piece in progress hook, advances tier next session
- Difficulty decreases after 3 consecutive incorrect answers — de-escalates tier next session
- Thresholds stored in Firebase Remote Config for post-launch tuning without deploy
- Difficulty changes between sessions only — mid-session changes feel jarring for kids; tier locked when session starts

### Progress Migration & Hebrew Integration
- Keep `useChessProgress` as-is for level unlock state. New `usePuzzleProgress` is additive — no migration, zero data loss risk
- Hebrew piece name displayed above the board, same position as current piece name display — consistent with PieceIntroduction pattern
- Tap piece name text to play audio pronunciation, matching how category pages work
- Show piece type context on capture puzzles — "Which piece captures?" with Hebrew name of correct piece shown after answer

### Claude's Discretion
- Exact Remote Config key names for difficulty thresholds
- Internal data structure of usePuzzleProgress localStorage format
- Whether to use chess.js dynamic import or conditional require for SSR guard

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/useChessProgress.ts` — localStorage pattern with SSR guard, level completion tracking
- `data/chessPuzzles.ts` — 95 puzzles (61 movement + 34 capture) with difficulty 1|2|3 field
- `data/chessPieces.ts` — piece data with Hebrew names and audio paths
- `utils/audio.ts` — `playAudio(path)` for pronunciation playback
- `lib/featureFlags/` — Firebase Remote Config integration for configurable thresholds

### Established Patterns
- Hooks use `useState` + `useEffect` with localStorage, SSR guarded via `typeof window !== 'undefined'`
- Dynamic imports with `{ ssr: false }` for chess components (react-chessboard)
- `MovementPuzzle` currently uses `ORDERED_PUZZLES` static list with `puzzleIndex` state
- `CapturePuzzle` uses similar sequential puzzle iteration

### Integration Points
- `MovementPuzzle.tsx` and `CapturePuzzle.tsx` consume puzzles from `data/chessPuzzles.ts`
- `ChessGameContent.tsx` manages view state and passes `onComplete`/`completeLevel` to puzzle components
- Phase 16 will consume the generator via `usePuzzleSession` hook — data shape must support session-based consumption

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
