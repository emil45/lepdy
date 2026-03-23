# Requirements: Lepdy Chess

**Defined:** 2026-03-23
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1.4 Requirements

Requirements for Complete Puzzle Experience milestone. Each maps to roadmap phases.

### Menu & Navigation

- [x] **MENU-01**: User sees a clear hub menu with large icon+label tiles replacing the broken 1/2/3/daily structure
- [x] **MENU-02**: User can navigate to Learn, Practice, Challenge, and Daily Puzzle from the hub menu
- [ ] **MENU-03**: User sees their per-piece mastery bands displayed on the hub menu

### Practice Mode

- [x] **PRAC-01**: User can select a specific chess piece from a 6-piece grid showing SVG, Hebrew name, and mastery band
- [x] **PRAC-02**: User plays infinite adaptive drills for the selected piece with no session limit
- [x] **PRAC-03**: User hears Hebrew piece name audio on the practice piece picker screen

### Checkmate Puzzles

- [x] **MATE-01**: User can solve checkmate-in-1 puzzles ("find the move that checkmates")
- [x] **MATE-02**: At least 20 curated mate-in-1 positions validated by chess.js across multiple piece types
- [ ] **MATE-03**: Checkmate puzzles appear in Challenge sessions alongside movement and capture puzzles

### Sound & Celebrations

- [x] **SFX-01**: User hears a positive sound effect on correct puzzle answers
- [x] **SFX-02**: User hears a gentle sound effect on wrong puzzle answers
- [x] **SFX-03**: User sees mini-celebration (confetti/animation) at 3, 5, and 10 correct streak during sessions

### Progress & Engagement

- [ ] **PROG-01**: User sees a mastery map showing all 6 pieces with current mastery band on the menu
- [ ] **PROG-02**: User sees a per-piece breakdown on the session complete screen (which pieces practiced, how many correct)

## v1.3 Requirements (Complete)

### Puzzle Generation

- [x] **PGEN-01**: User gets a randomly selected movement puzzle every time (never runs out)
- [x] **PGEN-02**: User gets a randomly selected capture puzzle every time (never runs out)
- [x] **PGEN-03**: User never sees the same puzzle twice within a session (15-puzzle dedup window)
- [x] **PGEN-04**: User sees the Hebrew piece name and can hear pronunciation on every generated puzzle

### Difficulty

- [x] **DIFF-01**: User encounters puzzles at 3 difficulty tiers (easy, medium, hard) with increasing board complexity
- [x] **DIFF-02**: User automatically advances to harder puzzles after demonstrating mastery (consecutive correct answers)
- [x] **DIFF-03**: User automatically gets easier puzzles after struggling (consecutive wrong answers)
- [x] **DIFF-04**: User sees their current mastery level as a named band per piece type ("Rook Beginner → Knight Expert")

### Session

- [x] **SESS-01**: User plays structured 10-puzzle sessions with a clear start and end
- [x] **SESS-02**: User sees a consecutive-correct streak counter during play ("4 in a row!")
- [x] **SESS-03**: User sees a session complete screen with 1-3 stars based on accuracy
- [x] **SESS-04**: User can play a daily featured puzzle that is the same for all players each day

## Future Requirements

### Advanced Puzzle Types

- **CHECK-01**: User can solve check puzzles ("move this piece to put the king in check")
- **MATE-04**: User can solve checkmate-in-2 puzzles for ages 8-9 who have mastered mate-in-1
- **TACT-01**: User can solve fork puzzles (ages 8+)
- **TACT-02**: User can solve pin puzzles (ages 8+)
- **TACT-03**: User can solve multi-piece sequence puzzles

### Engagement

- **ENG-01**: User sees a "finish this session" prompt when returning after abandoning mid-session
- **ENG-02**: Parent can view a progress dashboard showing session count, pieces mastered, time played

### Challenge Modes

- **CHAL-01**: User can play timed puzzle challenge (optional speed mode for ages 8+)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full chess game (AI opponent) | Lepdy is puzzle-based learning; kids go to lichess/chess.com for real games |
| "Find the best move" puzzles | Too many valid-feeling wrong answers for ages 5-9; creates confusion |
| Checkmate-in-2+ | Ages 5-9 cannot hold multi-move calculation trees; defer until user data confirms readiness |
| Timer pressure on puzzles | Ages 5-9 under time pressure shows elevated stress and abandonment |
| Leaderboard / global ranking | Social comparison creates anxiety for ages 5-9; personal mastery instead |
| Lives/hearts/energy system | Punishment discourages young learners (Duolingo removed May 2025) |
| Glicko/ELO numeric rating | Meaningless to ages 5-9; a dropped rating causes abandonment |
| Push notifications | Beyond scope of web game; no service worker infrastructure |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MENU-01 | Phase 19 | Complete |
| MENU-02 | Phase 19 | Complete |
| MENU-03 | Phase 23 | Pending |
| PRAC-01 | Phase 20 | Complete |
| PRAC-02 | Phase 20 | Complete |
| PRAC-03 | Phase 20 | Complete |
| MATE-01 | Phase 21 | Complete |
| MATE-02 | Phase 21 | Complete |
| MATE-03 | Phase 22 | Pending |
| SFX-01 | Phase 19 | Complete |
| SFX-02 | Phase 19 | Complete |
| SFX-03 | Phase 19 | Complete |
| PROG-01 | Phase 23 | Pending |
| PROG-02 | Phase 23 | Pending |
| PGEN-01 | Phase 14 | Complete |
| PGEN-02 | Phase 14 | Complete |
| PGEN-03 | Phase 15 | Complete |
| PGEN-04 | Phase 15 | Complete |
| DIFF-01 | Phase 15 | Complete |
| DIFF-02 | Phase 15 | Complete |
| DIFF-03 | Phase 15 | Complete |
| DIFF-04 | Phase 17 | Complete |
| SESS-01 | Phase 16 | Complete |
| SESS-02 | Phase 16 | Complete |
| SESS-03 | Phase 17 | Complete |
| SESS-04 | Phase 18 | Complete |

**Coverage:**
- v1.4 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after v1.4 roadmap creation*
