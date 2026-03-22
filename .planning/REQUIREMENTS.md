# Requirements: Lepdy Chess v1.2

**Defined:** 2026-03-22
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1.2 Requirements

### Board Theme

- [ ] **BOARD-01**: Board squares use a pastel color pair from Lepdy's palette instead of default brown/beige
- [ ] **BOARD-02**: Board coordinate labels (a-h, 1-8) use a color that complements the pastel squares

### Piece Themes

- [ ] **PIECE-01**: Staunty piece theme — all 12 pieces (6 white, 6 black) sourced from lichess staunty SVGs and integrated into the chess game
- [ ] **PIECE-02**: Horsey piece theme — all 12 pieces sourced from lichess horsey SVGs and integrated as an alternative theme
- [ ] **PIECE-03**: Piece themes render correctly at all board sizes (320px–480px responsive range)
- [ ] **PIECE-04**: Extensible theme system — adding a new piece set requires only dropping SVGs in a folder and adding a theme entry (no code changes beyond registration)

### Settings

- [ ] **SET-01**: Settings drawer in chess game includes a piece theme selector to switch between available themes
- [ ] **SET-02**: Selected theme persists across browser sessions (localStorage)

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
| BOARD-01 | TBD | Pending |
| BOARD-02 | TBD | Pending |
| PIECE-01 | TBD | Pending |
| PIECE-02 | TBD | Pending |
| PIECE-03 | TBD | Pending |
| PIECE-04 | TBD | Pending |
| SET-01 | TBD | Pending |
| SET-02 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 8 total
- Mapped to phases: 0
- Unmapped: 8 ⚠️

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after scope expansion (piece theme selector)*
