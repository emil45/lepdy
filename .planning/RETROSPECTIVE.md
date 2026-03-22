# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Lepdy Chess

**Shipped:** 2026-03-22
**Phases:** 6 | **Plans:** 11 | **Sessions:** 1

### What Was Built
- Complete chess learning game with 3 progressive levels (piece intro, movement puzzles, capture puzzles)
- 26 hand-curated puzzles (18 movement + 8 capture) covering all 6 chess piece types
- Kid-friendly feedback system: celebration on correct, gentle "try again" on wrong, hints after 2 attempts
- Full i18n support (Hebrew RTL, English, Russian) with ~22 translation keys
- Progress persistence via localStorage with level-unlock progression
- 39 E2E tests covering all levels and game shell

### What Worked
- **Autonomous workflow** executed all 6 phases (discuss → plan → execute) without major blockers
- **Smart discuss** with batch table proposals was efficient — user accepted recommended defaults for most grey areas
- **Phase 5-6 pattern reuse** — MovementPuzzle and CapturePuzzle followed nearly identical architecture, making planning and execution fast
- **Existing puzzle data** from Phase 1 meant Phases 5-6 needed zero data work
- **Single-session execution** — entire milestone completed in one continuous autonomous run

### What Was Inefficient
- **Phase 2 ChessBoard wrapper was orphaned** — built a reusable abstraction that Phases 5-6 bypassed in favor of direct react-chessboard imports. The decision was correct (puzzle mode is read-only) but the initial abstraction was wasted work
- **5 orphaned translation keys** — forward-planning stubs that were never used
- **Stale test selector** in Phase 3 E2E test needed fixing in Phase 4 (strict mode violation from duplicate elements)

### Patterns Established
- **Puzzle component pattern**: direct Chessboard import + state machine (idle/correct/wrong/hint/complete) + `{onComplete, completeLevel}` props
- **View routing**: `useState<ChessView>` union type for single-page game navigation
- **Progress hook**: standalone `useChessProgress` with localStorage, no context provider needed
- **Prop-threading completeLevel** from parent to prevent stale state across view switches

### Key Lessons
1. **Don't build abstractions before you know the consumers** — ChessBoard wrapper assumed game levels would need chess.js move execution, but puzzles are read-only
2. **Batch table proposals in smart discuss save significant time** — most grey areas have obvious recommended answers that users accept
3. **Consistent component patterns across levels enable fast execution** — Phase 6 was the fastest because it followed Phase 5's exact template

### Cost Observations
- Model mix: ~30% opus (planning), ~70% sonnet (research, execution, verification)
- Sessions: 1 continuous autonomous session
- Notable: 6 phases executed in a single session with no context resets needed

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 6 | First milestone — autonomous mode with smart discuss |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 39 | E2E smoke | 0 (react-chessboard + chess.js added) |

### Top Lessons (Verified Across Milestones)

1. Build abstractions after you know the consumers, not before
2. Consistent component patterns across similar features enable fast parallel execution
