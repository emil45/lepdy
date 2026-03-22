# Requirements: Lepdy Chess

**Defined:** 2026-03-22
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1.3 Requirements

Requirements for Infinite Replayability milestone. Each maps to roadmap phases.

### Puzzle Generation

- [ ] **PGEN-01**: User gets a randomly selected movement puzzle every time (never runs out)
- [ ] **PGEN-02**: User gets a randomly selected capture puzzle every time (never runs out)
- [ ] **PGEN-03**: User never sees the same puzzle twice within a session (15-puzzle dedup window)
- [ ] **PGEN-04**: User sees the Hebrew piece name and can hear pronunciation on every generated puzzle

### Difficulty

- [ ] **DIFF-01**: User encounters puzzles at 3 difficulty tiers (easy, medium, hard) with increasing board complexity
- [ ] **DIFF-02**: User automatically advances to harder puzzles after demonstrating mastery (consecutive correct answers)
- [ ] **DIFF-03**: User automatically gets easier puzzles after struggling (consecutive wrong answers)
- [ ] **DIFF-04**: User sees their current mastery level as a named band per piece type ("Rook Beginner → Knight Expert")

### Session

- [ ] **SESS-01**: User plays structured 10-puzzle sessions with a clear start and end
- [ ] **SESS-02**: User sees a consecutive-correct streak counter during play ("4 in a row!")
- [ ] **SESS-03**: User sees a session complete screen with 1-3 stars based on accuracy
- [ ] **SESS-04**: User can play a daily featured puzzle that is the same for all players each day

## Future Requirements

### Tactical Puzzles

- **TACT-01**: User can solve fork puzzles (ages 8+)
- **TACT-02**: User can solve pin puzzles (ages 8+)
- **TACT-03**: User can solve multi-piece sequence puzzles

### Parent Features

- **PARE-01**: Parent can view child's progress dashboard
- **PARE-02**: Parent can see time spent per session

## Out of Scope

| Feature | Reason |
|---------|--------|
| Lives/hearts/energy system | Punishment discourages young learners — Duolingo removed hearts in May 2025 for this reason |
| Glicko/ELO numeric rating | Meaningless to ages 5-9; a dropped rating causes abandonment |
| Competitive leaderboard | Creates anxiety, not motivation for this age group |
| Stockfish/external puzzle APIs | Wrong puzzle type for beginner domain; adds server dependency |
| Push notifications | Beyond scope of web game; no service worker infrastructure |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PGEN-01 | — | Pending |
| PGEN-02 | — | Pending |
| PGEN-03 | — | Pending |
| PGEN-04 | — | Pending |
| DIFF-01 | — | Pending |
| DIFF-02 | — | Pending |
| DIFF-03 | — | Pending |
| DIFF-04 | — | Pending |
| SESS-01 | — | Pending |
| SESS-02 | — | Pending |
| SESS-03 | — | Pending |
| SESS-04 | — | Pending |

**Coverage:**
- v1.3 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12 ⚠️

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
