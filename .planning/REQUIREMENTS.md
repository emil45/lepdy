# Requirements: Lepdy Chess

**Defined:** 2026-03-21
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1 Requirements

### Board & Rendering

- [ ] **BOARD-01**: Classic 8x8 chess board renders using react-chessboard with clean, colorful pieces
- [ ] **BOARD-02**: Board squares are 56px+ minimum for tablet touch targets (ages 5-9)
- [ ] **BOARD-03**: Tapping a piece highlights all valid squares it can move to
- [ ] **BOARD-04**: Board uses tap-select-then-tap-destination interaction (no drag-and-drop)
- [ ] **BOARD-05**: Board renders correctly in RTL (Hebrew) locale — explicitly set `direction: ltr` on board container
- [ ] **BOARD-06**: Board loads without SSR hydration crash — use `next/dynamic` with `ssr: false`

### Piece Introduction (Level 1)

- [ ] **INTRO-01**: Each of the 6 chess pieces is introduced individually (one at a time)
- [ ] **INTRO-02**: Piece introduction shows Hebrew name, piece image, and plays audio pronunciation (when audio file exists)
- [ ] **INTRO-03**: Audio is optional — game works fully without audio files; MP3 paths are placeholder references for later recording
- [ ] **INTRO-04**: Pieces are introduced in progressive order: King → Rook → Bishop → Queen → Knight → Pawn

### Movement Puzzles (Level 2)

- [ ] **MOVE-01**: User sees a single piece on an otherwise empty board and taps where it can move
- [ ] **MOVE-02**: Correct taps are celebrated with animation and sound
- [ ] **MOVE-03**: Wrong taps get gentle "try again" feedback (no harsh punishment)
- [ ] **MOVE-04**: After 2 wrong attempts, a hint highlights valid squares
- [ ] **MOVE-05**: Movement puzzles exist for all 6 piece types
- [ ] **MOVE-06**: No timer pressure during puzzles

### Capture Puzzles (Level 3)

- [ ] **CAPT-01**: User sees multiple pieces on board and identifies which piece can capture a target
- [ ] **CAPT-02**: Correct captures are celebrated with animation and sound
- [ ] **CAPT-03**: Wrong selections get gentle feedback with hint after 2 attempts
- [ ] **CAPT-04**: Capture puzzles use curated FEN positions (static JSON, not generated)

### Progression System

- [ ] **PROG-01**: Levels unlock sequentially — must complete previous level to access next
- [ ] **PROG-02**: Visual progress indicator shows which levels are completed (checkmarks/stars)
- [ ] **PROG-03**: Progress is saved to localStorage and persists across sessions
- [ ] **PROG-04**: Level map screen shows all levels with locked/unlocked/completed state

### Feedback & Polish

- [ ] **FEED-01**: Correct answers trigger celebration animation (stars/sparkles) and cheerful sound
- [ ] **FEED-02**: Wrong answers show encouraging "try again" message — no buzzer, no score penalty
- [ ] **FEED-03**: Hint system activates after 2 wrong taps on the same puzzle

### Integration

- [ ] **INTG-01**: Chess game appears in the existing /games list page
- [ ] **INTG-02**: Game route follows existing pattern: `app/[locale]/games/chess-game/`
- [ ] **INTG-03**: i18n support for Hebrew (default), English, Russian via next-intl
- [ ] **INTG-04**: Game fits Lepdy's visual language (MUI theming, pastel colors)
- [ ] **INTG-05**: Back button navigates to /games (matching other game pages)
- [ ] **INTG-06**: Audio file paths reference `/public/audio/chess/he/*.mp3` — files added later

## v2 Requirements

### Enhanced Learning

- **LEARN-01**: Hebrew + transliteration + native language display for piece names
- **LEARN-02**: Vocabulary recap summary screen after completing all pieces
- **LEARN-03**: "Save the target" narrative framing for capture puzzles

### Advanced Content

- **ADV-01**: Special moves introduction (castling, en passant, promotion) as bonus levels
- **ADV-02**: Speed challenge mode for practiced pieces (timed, competitive)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full chess game (AI opponent) | Too complex for v1; goal is learning fundamentals, not playing full games |
| Online multiplayer | Not aligned with Lepdy's learning model |
| ELO / competitive rating | Focus on personal progress, not competition |
| Custom piece/board themes | Keep it simple — classic board sufficient |
| Video lessons | High production cost, outside Lepdy's interaction model |
| Parent dashboard / accounts | Lepdy has no accounts; localStorage is sufficient |
| Advanced special moves (castling, en passant, promotion) | Confuses beginners; deferred to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOARD-01 | Phase 2 | Pending |
| BOARD-02 | Phase 2 | Pending |
| BOARD-03 | Phase 2 | Pending |
| BOARD-04 | Phase 2 | Pending |
| BOARD-05 | Phase 2 | Pending |
| BOARD-06 | Phase 2 | Pending |
| INTRO-01 | Phase 4 | Pending |
| INTRO-02 | Phase 4 | Pending |
| INTRO-03 | Phase 4 | Pending |
| INTRO-04 | Phase 4 | Pending |
| MOVE-01 | Phase 5 | Pending |
| MOVE-02 | Phase 5 | Pending |
| MOVE-03 | Phase 5 | Pending |
| MOVE-04 | Phase 5 | Pending |
| MOVE-05 | Phase 5 | Pending |
| MOVE-06 | Phase 5 | Pending |
| CAPT-01 | Phase 6 | Pending |
| CAPT-02 | Phase 6 | Pending |
| CAPT-03 | Phase 6 | Pending |
| CAPT-04 | Phase 6 | Pending |
| PROG-01 | Phase 3 | Pending |
| PROG-02 | Phase 3 | Pending |
| PROG-03 | Phase 3 | Pending |
| PROG-04 | Phase 3 | Pending |
| FEED-01 | Phase 5 | Pending |
| FEED-02 | Phase 5 | Pending |
| FEED-03 | Phase 5 | Pending |
| INTG-01 | Phase 3 | Pending |
| INTG-02 | Phase 3 | Pending |
| INTG-03 | Phase 1 | Pending |
| INTG-04 | Phase 3 | Pending |
| INTG-05 | Phase 3 | Pending |
| INTG-06 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
