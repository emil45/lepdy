# Requirements: Lepdy Chess v1.2

**Defined:** 2026-03-22
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1.2 Requirements

### Board Theme

- [x] **BOARD-01**: Board squares use a pastel color pair from Lepdy's palette instead of default brown/beige
- [x] **BOARD-02**: Board coordinate labels (a-h, 1-8) use a color that complements the pastel squares

### Piece Themes

- [x] **PIECE-01**: Staunty piece theme — all 12 pieces (6 white, 6 black) sourced from lichess staunty SVGs and integrated into the chess game
- [x] **PIECE-02**: Horsey piece theme — all 12 pieces sourced from lichess horsey SVGs and integrated as an alternative theme
- [x] **PIECE-03**: Piece themes render correctly at all board sizes (320px–480px responsive range)
- [x] **PIECE-04**: Extensible theme system — adding a new piece set requires only dropping SVGs in a folder and adding a theme entry (no code changes beyond registration)

### Settings

- [x] **SET-01**: Settings drawer in chess game includes a piece theme selector to switch between available themes
- [x] **SET-02**: Selected theme persists across browser sessions (localStorage)

## v2 Requirements

### Enhanced Learning

- **LEARN-01**: Hebrew + transliteration + native language display for piece names
- **LEARN-02**: Vocabulary recap summary screen after completing all pieces
- **ADV-01**: Special moves introduction (castling, en passant, promotion) as bonus levels
- **ADV-02**: Speed challenge mode for practiced pieces (timed, competitive)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full chess game (AI opponent) | Too complex; goal is learning fundamentals |
| Online multiplayer | Not aligned with Lepdy's learning model |
| Animated piece designs (bouncing, wiggling) | Keep SVGs static for performance on tablets |
| Board color theme switcher | One pastel board theme is sufficient for v1.2 — piece themes are the user choice |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOARD-01 | Phase 11 | Complete |
| BOARD-02 | Phase 11 | Complete |
| PIECE-01 | Phase 12 | Complete |
| PIECE-02 | Phase 12 | Complete |
| PIECE-03 | Phase 12 | Complete |
| PIECE-04 | Phase 12 | Complete |
| SET-01 | Phase 13 | Complete |
| SET-02 | Phase 13 | Complete |

**Coverage:**
- v1.2 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap expanded to 3 phases (11-13)*
