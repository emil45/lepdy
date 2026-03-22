# Requirements: Lepdy Chess

**Defined:** 2026-03-21
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1 Requirements

### Board & Rendering

- [x] **BOARD-01**: Classic 8x8 chess board renders using react-chessboard with clean, colorful pieces
- [x] **BOARD-02**: Board squares are 56px+ minimum for tablet touch targets (ages 5-9)
- [x] **BOARD-03**: Tapping a piece highlights all valid squares it can move to
- [x] **BOARD-04**: Board uses tap-select-then-tap-destination interaction (no drag-and-drop)
- [x] **BOARD-05**: Board renders correctly in RTL (Hebrew) locale — explicitly set `direction: ltr` on board container
- [x] **BOARD-06**: Board loads without SSR hydration crash — use `next/dynamic` with `ssr: false`

### Piece Introduction (Level 1)

- [x] **INTRO-01**: Each of the 6 chess pieces is introduced individually (one at a time)
- [x] **INTRO-02**: Piece introduction shows Hebrew name, piece image, and plays audio pronunciation (when audio file exists)
- [x] **INTRO-03**: Audio is optional — game works fully without audio files; MP3 paths are placeholder references for later recording
- [x] **INTRO-04**: Pieces are introduced in progressive order: King → Rook → Bishop → Queen → Knight → Pawn

### Movement Puzzles (Level 2)

- [x] **MOVE-01**: User sees a single piece on an otherwise empty board and taps where it can move
- [x] **MOVE-02**: Correct taps are celebrated with animation and sound
- [x] **MOVE-03**: Wrong taps get gentle "try again" feedback (no harsh punishment)
- [x] **MOVE-04**: After 2 wrong attempts, a hint highlights valid squares
- [x] **MOVE-05**: Movement puzzles exist for all 6 piece types
- [x] **MOVE-06**: No timer pressure during puzzles

### Capture Puzzles (Level 3)

- [ ] **CAPT-01**: User sees multiple pieces on board and identifies which piece can capture a target
- [ ] **CAPT-02**: Correct captures are celebrated with animation and sound
- [ ] **CAPT-03**: Wrong selections get gentle feedback with hint after 2 attempts
- [ ] **CAPT-04**: Capture puzzles use curated FEN positions (static JSON, not generated)

### Progression System

- [x] **PROG-01**: Levels unlock sequentially — must complete previous level to access next
- [x] **PROG-02**: Visual progress indicator shows which levels are completed (checkmarks/stars)
- [x] **PROG-03**: Progress is saved to localStorage and persists across sessions
- [x] **PROG-04**: Level map screen shows all levels with locked/unlocked/completed state

### Feedback & Polish

- [x] **FEED-01**: Correct answers trigger celebration animation (stars/sparkles) and cheerful sound
- [x] **FEED-02**: Wrong answers show encouraging "try again" message — no buzzer, no score penalty
- [x] **FEED-03**: Hint system activates after 2 wrong taps on the same puzzle

### Integration

- [x] **INTG-01**: Chess game appears in the existing /games list page
- [x] **INTG-02**: Game route follows existing pattern: `app/[locale]/games/chess-game/`
- [x] **INTG-03**: i18n support for Hebrew (default), English, Russian via next-intl
- [x] **INTG-04**: Game fits Lepdy's visual language (MUI theming, pastel colors)
- [x] **INTG-05**: Back button navigates to /games (matching other game pages)
- [x] **INTG-06**: Audio file paths reference `/public/audio/chess/he/*.mp3` — files added later

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
| BOARD-01 | Phase 2 | Complete |
| BOARD-02 | Phase 2 | Complete |
| BOARD-03 | Phase 2 | Complete |
| BOARD-04 | Phase 2 | Complete |
| BOARD-05 | Phase 2 | Complete |
| BOARD-06 | Phase 2 | Complete |
| INTRO-01 | Phase 4 | Complete |
| INTRO-02 | Phase 4 | Complete |
| INTRO-03 | Phase 4 | Complete |
| INTRO-04 | Phase 4 | Complete |
| MOVE-01 | Phase 5 | Complete |
| MOVE-02 | Phase 5 | Complete |
| MOVE-03 | Phase 5 | Complete |
| MOVE-04 | Phase 5 | Complete |
| MOVE-05 | Phase 5 | Complete |
| MOVE-06 | Phase 5 | Complete |
| CAPT-01 | Phase 6 | Pending |
| CAPT-02 | Phase 6 | Pending |
| CAPT-03 | Phase 6 | Pending |
| CAPT-04 | Phase 6 | Pending |
| PROG-01 | Phase 3 | Complete |
| PROG-02 | Phase 3 | Complete |
| PROG-03 | Phase 3 | Complete |
| PROG-04 | Phase 3 | Complete |
| FEED-01 | Phase 5 | Complete |
| FEED-02 | Phase 5 | Complete |
| FEED-03 | Phase 5 | Complete |
| INTG-01 | Phase 3 | Complete |
| INTG-02 | Phase 3 | Complete |
| INTG-03 | Phase 1 | Complete |
| INTG-04 | Phase 3 | Complete |
| INTG-05 | Phase 3 | Complete |
| INTG-06 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
