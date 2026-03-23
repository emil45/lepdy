# Milestones

## v1.4 Complete Puzzle Experience (Shipped: 2026-03-23)

**Phases completed:** 5 phases, 10 plans, 15 tasks

**Key accomplishments:**

- Replaced chess level map (3 numbered cards + daily card) with a 2x2 hub grid of 4 labeled tiles (Learn/Challenge/Practice/Daily) using MUI Grid and pastel colors
- Wired SUCCESS/WRONG_ANSWER sounds to every puzzle answer callback, fixed daily puzzle wrong-answer silence, and added full-screen confetti + random celebration sound at streak milestones 3, 5, and 10
- usePracticeSession hook filters puzzle pools to a single piece and loops infinitely, paired with PracticePicker 2x3 grid showing SVG pieces, Hebrew names, mastery bands, and one-tap audio+select
- ChessGameContent wired with two new views (practice-picker, practice) connecting usePracticeSession + PracticePicker into a fully functional infinite practice drill accessible from the hub menu
- One-liner:
- One-liner:
- chessCheckmateEnabled feature flag, CHESS_PUZZLE_ANSWERED Amplitude event, and checkmate-aware session queue building with hydration — all type-safe and gated by remote config
- Amplitude CHESS_PUZZLE_ANSWERED events wired for all puzzle types and double-sound fixed with checkmate-specific handler — 44 E2E tests green
- One-liner:
- One-liner:

---

## v1.3 Infinite Replayability (Shipped: 2026-03-22)

**Phases completed:** 5 phases, 10 plans, 19 tasks

**Key accomplishments:**

- chess.js-based puzzle validation script that catches ambiguous distractors and validTarget mismatches, plus fixed capture-rook-1 bug (bishop c3 to c2)
- 95 chess puzzles (61 movement + 34 capture) across 6 piece types and 3 difficulty tiers, all validated by chess.js with 0 errors and 0 warnings
- Pure puzzle selection with 15-entry dedup window and per-piece adaptive difficulty tier persistence via localStorage and session-frozen tier via useRef
- Hebrew piece name with audio tap wired into MovementPuzzle (always visible) and CapturePuzzle (post-answer reveal), with recordCorrect/recordWrong updating per-piece difficulty tiers on every answer
- usePuzzleSession hook with 10-puzzle queue, sessionStorage persistence, and StreakBadge component with bounce animation using functional setState for streak tracking
- MovementPuzzle and CapturePuzzle refactored to pure renderers, wired into ChessGameContent via usePuzzleSession with StreakBadge, N/10 progress indicator, and session complete screen
- usePuzzleSession extended with firstTryCount tracking and forwarded tier data, plus 2 Firebase Remote Config star threshold flags and session complete translation keys in all 3 locales
- Full session reward screen with 1-3 stars from Firebase-tunable thresholds, mastery band chips per piece, tier advancement arrows, and confetti on 3-star result
- Date-seeded daily puzzle hook (djb2 hash) and warm-orange DailyPuzzleCard with completion tracking via date-keyed localStorage
- Daily puzzle card wired into chess level map with standalone play/complete flow using useDailyPuzzle and DailyPuzzleCard from Plan 01

---

## v1.2 Board Facelift (Shipped: 2026-03-22)

**Phases completed:** 3 phases, 4 plans, 8 tasks

**Key accomplishments:**

- Pastel board squares (beigePastel/purplePastel) and 50%-opacity coordinate labels applied to both MovementPuzzle and CapturePuzzle via react-chessboard options props
- Staunty SVG pieces from lichess integrated into chess board and piece introduction via extensible factory-pattern theme registry
- Horsey SVGs from lichess added as second piece theme, proving extensibility with only 1 line of code + 12 SVG files
- MUI settings drawer with SVG knight thumbnails lets users switch between Classic/Playful chess piece themes, with selection persisted to localStorage via useChessPieceTheme hook

---

## v1.1 Polish & Fixes (Shipped: 2026-03-22)

**Phases completed:** 4 phases, 5 plans, 10 tasks

**Key accomplishments:**

- Fixed chess piece double-namespace translation bug and removed 3 orphaned Phase 2 files plus 5 unused i18n keys across all 3 locales
- X exit buttons on all 3 chess sub-screens plus RTL-aware Next/Back arrows in PieceIntroduction walkthrough
- Fade transitions on all chess view switches and soft-shadow pastel cards on all chess game components
- FEN manipulation helper (`moveFenPiece`) and slide-animation wiring for both puzzle types using react-chessboard's built-in 200ms animation triggered by updating a `displayFen` state prop
- 3 chess stickers on Page 4 (Games) unlocked by completing chess levels 1-3, wired via useChessProgress into existing sticker system with translations in Hebrew, English, and Russian

---

## v1.0 Lepdy Chess (Shipped: 2026-03-22)

**Phases completed:** 6 phases, 11 plans, 22 tasks

**Key accomplishments:**

- Chess piece data file with 6 typed pieces (ChessPieceConfig), Hebrew audio paths, FEN characters, and i18n translations in Hebrew/English/Russian
- 18 movement puzzles and 8 capture puzzles with hand-curated FEN positions covering all 6 chess piece types
- Interactive chess board with react-chessboard v5 and chess.js, featuring tap-select interaction, green dot/ring legal move highlights, responsive sizing (448-480px), RTL isolation, and SSR-safe dynamic loading
- Chess game page route at /games/chess-game with ChessBoardDynamic, SEO metadata in 3 locales, and E2E test confirming page loads
- useChessProgress hook with localStorage persistence and level-unlock logic, plus chess game button wired into /games in all 3 locales
- Level map UI with 3 MUI Card levels (locked/unlocked/completed), client-side view routing, and 4 Playwright E2E tests covering navigation and localStorage persistence
- PieceIntroduction component with 6-piece Hebrew navigation, audio, confetti celebration, and shared progress state wired into ChessGameContent
- MovementPuzzle component with 18-puzzle state machine (6 pieces x 3 difficulties), correct/wrong/hint feedback loop, and tapToMove i18n key in all 3 locales
- Level 2 wired into chess game shell via dynamic SSR-safe import, with 3 E2E smoke tests covering puzzle board render, wrong-tap feedback, and hint activation after 2 wrong taps
- CapturePuzzle component with target-ring board rendering, correct/wrong tap state machine, green hint after 2 wrong taps, and enhanced "You learned chess!" completion screen — plus targetPieceId on all 8 puzzle records and tapToCapture/learnedChess i18n keys
- CapturePuzzle dynamically imported and routed from ChessGameContent, Coming soon placeholder removed, 3 E2E tests cover Level 3 load/wrong-tap/hint flow

---
