# Milestones

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
