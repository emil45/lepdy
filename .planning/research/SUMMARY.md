# Project Research Summary

**Project:** Lepdy Chess v1.3 — Infinite Replayability
**Domain:** Kids chess learning game — random puzzle generation, escalating difficulty, progression systems
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

Lepdy Chess v1.3 adds infinite replayability to a shipped chess learning game (v1.2) that already has a 3-level progression arc, 18 movement puzzles, 8 capture puzzles, and localStorage-based progress tracking. The established approach for kids' educational games (ChessKid, Duolingo, Khan Academy Kids) is to layer infinite generation on top of a curated seed set — not to replace curation — and to replace finite "you finished" dead ends with structured session windows (10 puzzles, 3-5 minutes) that give micro-rewards at completion. The technical conclusion is that no new dependencies are required: chess.js `moves({ square, verbose: true })` provides the entire puzzle generation engine, and all progression mechanics are extensions of the existing localStorage hook pattern.

The recommended implementation strategy is pool expansion first (curated 18 → 60+ movement puzzles; 8 → 30+ capture puzzles), then a `puzzleGenerator` utility that randomly samples from the pool by difficulty tier, then a `usePuzzleSession` hook that replaces the current linear-array-consumed-to-end pattern inside `MovementPuzzle` and `CapturePuzzle`. The existing `useChessProgress` hook is extended with difficulty band, total puzzles solved, and session star tracking — using an additive migration that preserves existing player data. The top-level state machine in `ChessGameContent.tsx` and all rendering logic remain untouched.

The primary risks are not architectural — they are calibration and UX. A difficulty curve tuned on adult reasoning feels like a cliff to a 6-year-old. A generator with no deduplication buffer creates perceived repetition that reads as broken. An "infinite" mode with no session milestones feels like an empty corridor and drives abandonment. All three risks have established mitigations: separate difficulty axes (board complexity first, position novelty second), a ring-buffer dedup (last 10-15 puzzle hashes), and explicit session milestones (5-puzzle checkpoints, 25-puzzle sticker unlocks) that must be specified before the generator is written.

---

## Key Findings

### Recommended Stack

No new npm dependencies are needed. The entire milestone is deliverable using what is already installed: chess.js v1.4.0 (legal move computation via `moves({ square, verbose: true })`), react-confetti (celebration effects), and the existing localStorage hook pattern. Explicitly rejected: seeded RNG libraries (fresh randomness is the goal), ELO/Glicko rating packages (wrong audience — ages 5-9), gamification frameworks (require server state), Stockfish/Lichess puzzle APIs (wrong puzzle type for this domain).

**Core technologies:**
- `chess.js` v1.4.0 — puzzle generation engine via `chess.put()` + `chess.moves({ square, verbose: true })`; already installed; microsecond generation time suitable for inline synchronous use on tablets
- `Math.random()` — unseeded random selection from curated pool; correct for this use case; reproducibility is not a goal
- Extended `useChessProgress` hook — adds difficulty band, streak, total solved; additive localStorage migration preserving existing player data; no new storage key or context provider needed

### Expected Features

**Must have (v1.3 core — table stakes for infinite replayability):**
- Random movement puzzle generator — place piece on random valid square, compute legal targets via chess.js, never exhaust
- Random capture puzzle generator — place attacker + target, validate via chess.js
- Infinite puzzle stream — remove terminal "all done" screen; puzzles continue after fixed set exhausted
- Difficulty escalation — Rook/Bishop first (predictable linear movement), Knight last (L-shape hardest for ages 5-9); more distractor pieces as correct count climbs
- Hebrew piece name on every generated puzzle — pronunciation button always visible; directly serves Lepdy's core differentiator
- Consecutive-correct run counter — "4 in a row!" display; motivates one more puzzle with no infrastructure cost

**Should have (v1.3.x — after core validated):**
- Named piece mastery bands — "Rook Beginner → Rook Expert → Knight Beginner" — concrete, non-numeric, age-appropriate
- Date-seeded daily featured puzzle — same puzzle for all players each day; client-side only; drives return visits
- Puzzle count display — "Puzzle 47 today" — cumulative accomplishment signal

**Defer to v2+:**
- Tactical puzzles (forks, pins) — ages 8+; out of scope per PROJECT.md "ready to play" goal
- Multi-piece sequence puzzles — significant complexity jump
- Parent progress dashboard — valuable but beyond game scope

**Anti-features to avoid:**
- Lives/hearts/energy system — Duolingo removed hearts in May 2025 specifically because punishment discourages young learners; existing "try again" pattern is correct
- Glicko/ELO numeric rating — meaningless to ages 5-9; a dropped rating causes abandonment
- Competitive leaderboard — already ruled out in PROJECT.md; creates anxiety, not motivation for this age group

### Architecture Approach

The architecture is an extension of the existing system, not a rewrite. The current `ChessGameContent.tsx` state machine (`'map' | 'level-1' | 'level-2' | 'level-3'`) is untouched. The key change is replacing the `puzzleIndex` + `ORDERED_PUZZLES` consumed-linearly pattern inside `MovementPuzzle` and `CapturePuzzle` with calls to a new `usePuzzleSession` hook that sources puzzles from `puzzleGenerator.ts` and persists progress via the extended `useChessProgress`. Build order has clear dependencies: data expansion → generator utility → progress hook extension → session hook → puzzle component refactor → session complete screen.

**Major components:**
1. `utils/puzzleGenerator.ts` (new) — pure function; selects next puzzle from pool by difficulty, excludes recent-IDs ring buffer; falls back to easier tier if filtered pool is empty
2. `hooks/usePuzzleSession.ts` (new) — per-session state: current puzzle, streak, puzzles solved, session complete flag; sources puzzles from generator; reports back to `useChessProgress` on each puzzle solved
3. `hooks/useChessProgress.ts` (extended) — adds `movementDifficulty`, `captureDifficulty`, `totalPuzzlesSolved`, `longestStreak`; additive migration with defaults for new fields; existing `completedLevels` data preserved
4. `MovementPuzzle.tsx` / `CapturePuzzle.tsx` (refactored) — replace internal `puzzleIndex` state with `usePuzzleSession`; board rendering, FEN animation, square highlighting unchanged
5. `SessionComplete.tsx` (new) — star display (1-3 stars based on first-try accuracy), session summary screen between sessions; fires `onComplete` to return to map
6. `data/chessPuzzles.ts` (expanded) — 18 → 60+ movement puzzles; 8 → 30+ capture puzzles; 10+ puzzles per difficulty tier per level type

### Critical Pitfalls

1. **Generator produces unsolvable or trivially easy boards** — derive `validTargets` exclusively from chess.js `moves()` output; enforce min/max target counts (at least 3, no more than 14 for difficulty 1); validate with a 1000-puzzle automated test before any UI integration. A wrong `validTargets` array here also corrupts the hint system, actively teaching incorrect movement rules.

2. **Progress schema corruption for returning users** — extend the existing localStorage key additively; provide typed defaults for every new field; add a `version` field; test specifically on a device with the old `lepdy_chess_progress` key present. The bug only appears on returning-user devices, not on fresh installs.

3. **Puzzle repetition within a session** — maintain a ring buffer of last 10-15 puzzle hashes per session; exclude those from generator selection; validate with a 50-consecutive-puzzle automated test asserting no FEN appears within a window of 15. Kids ages 5-7 notice repetition and interpret it as a bug.

4. **Difficulty curve miscalibrated for the target audience** — separate escalation into two independent axes (board complexity first, position novelty second); cap advancement at one tier per session; implement de-escalation after 3 consecutive wrong answers on same type; store thresholds in a named config object accessible via Firebase Remote Config for post-ship tuning without a code deploy.

5. **Infinite treadmill with no milestones** — specify micro-milestones (every 5 puzzles = session checkpoint, every 25 = sticker unlock) as acceptance criteria for the generation phase; the session hook must fire milestone events from day one. "Infinite" with no visible progress signal causes abandonment after puzzle 3-5 in ages 5-9.

---

## Implications for Roadmap

The ARCHITECTURE.md build order defines a clear dependency graph. Phases cannot be reordered arbitrarily — each phase enables the next.

### Phase 1: Puzzle Pool Expansion

**Rationale:** Pure data work with no code dependencies; unblocks all subsequent phases; the pool must exist before the generator can sample from it. Hand-curating is faster to ship and more kid-friendly than algorithmic generation for this audience.
**Delivers:** 60+ movement puzzles and 30+ capture puzzles tagged by difficulty tier (1/2/3); minimum 10 puzzles per tier per type; each position hand-verified for clarity
**Addresses:** Table-stakes feature "infinite puzzle stream requires a non-exhaustible pool"
**Avoids:** Pitfall 3 (repetition) — pool variety must exceed 30 unique positions per piece type before any UI is built on top

### Phase 2: Core Generator + Progress Hook Extension

**Rationale:** These two components are the foundation — everything else depends on them. They can be built in parallel (generator is a pure function; progress hook has no UI dependencies) but must both be complete before the session hook can be written.
**Delivers:** `utils/puzzleGenerator.ts` (next-puzzle selection with dedup ring buffer) and extended `useChessProgress` (difficulty bands, migration guard, `recordPuzzleSolved` method)
**Addresses:** Random puzzle generation (P1 feature), difficulty escalation persistence (P1 feature)
**Avoids:** Pitfall 2 (schema breakage) — migration must be built and tested here; Pitfall 1 (degenerate positions) — validator integrated into generator before any UI

### Phase 3: Session Hook + Puzzle Component Refactor

**Rationale:** `usePuzzleSession` requires both the generator and the extended progress hook to exist. Once the hook is built, refactoring `MovementPuzzle` and `CapturePuzzle` is mechanical — only the puzzle source changes; rendering logic is untouched.
**Delivers:** `hooks/usePuzzleSession.ts` + refactored `MovementPuzzle` / `CapturePuzzle`; infinite puzzle stream operational; consecutive-correct streak counter; Hebrew name on every generated puzzle
**Addresses:** Infinite puzzle stream (P1), consecutive-correct run counter (P1), Hebrew name on every generated puzzle (P1)
**Avoids:** Pitfall 6 (progression state in component state) — session hook owns all persistent state; component state is reset-safe on navigation

### Phase 4: Session Complete Screen + Progression UI

**Rationale:** Milestone UX must ship with the generation feature, not as a deferred enhancement. The "infinite treadmill" pitfall is most acute at launch — without visible session milestones, initial retention data will look artificially low and may be misread as product failure.
**Delivers:** `SessionComplete.tsx` (1-3 star display), puzzle count display, "Getting harder!" tier advancement badge, level-map card updates showing session stars
**Addresses:** Session milestone display (prevents abandonment pitfall), star progression (ties back to existing Lepdy reward model)
**Avoids:** Pitfall 4 (infinite treadmill UX) — every session ends with a visible completion moment and stars earned

### Phase 5: Named Mastery Bands + Daily Featured Puzzle (v1.3.x)

**Rationale:** These are P2 features — add after core validation confirms that kids engage with the random generation and that the difficulty escalation curve is correctly tuned. Named mastery bands built on a mis-tuned curve will have the wrong band boundaries.
**Delivers:** "Rook Beginner → Rook Expert" band display, date-seeded daily puzzle entry point
**Addresses:** Named piece mastery bands (P2), date-seeded daily featured puzzle (P2)
**Uses:** Existing Firebase Remote Config (feature flag for daily puzzle gate), existing `logEvent()` Amplitude pattern

### Phase Ordering Rationale

- Data before code: puzzle pool must exist before generator can be validated against real positions
- Generator and progress hook before session hook: session hook is a consumer of both; it cannot be built in isolation
- Session milestones specified before generator ships: pitfall 4 requires milestone hooks to be a first-class contract of the generator output, not a later addition
- Mastery bands after core validation: band boundaries depend on accurate difficulty calibration data from the shipped generator

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Generator):** Difficulty heuristics for piece placement need validation against actual child behavior; center/edge placement is directionally correct but exact square ranges need empirical tuning. Store thresholds as a Firebase Remote Config object from day one so they can be adjusted without a code deploy.
- **Phase 4 (Progression UI):** Session star thresholds (3 stars at 8/10 first-try) are informed estimates — actual accuracy distribution for ages 5-9 on movement puzzles is unknown until data exists. Flag these thresholds for post-launch adjustment.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Pool Expansion):** Pure content work; quality bar is "hand-verified clarity for age 5"; no technical research needed
- **Phase 3 (Component Refactor):** Architecture is fully specified; the refactor is mechanical — replace puzzle source, leave rendering untouched
- **Phase 5 (Daily Puzzle):** Client-side date hash seeding is well-understood; no research needed

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | chess.js API confirmed stable at v1.4.0; all decisions are "use what exists"; no new dependency evaluation needed |
| Features | HIGH | Competitor mechanics verified against shipped products (ChessKid, Duolingo, Lichess); anti-features backed by published 2025 design decisions (Duolingo hearts removal) |
| Architecture | HIGH | Based on direct codebase reading of existing chess game files; build order derived from actual dependency graph between existing and new components |
| Pitfalls | HIGH | Derived from codebase-specific contracts (existing hook shapes, SSR patterns in Next.js App Router) plus well-established educational game design patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **Difficulty calibration numbers:** The specific thresholds (advance after 5 consecutive correct, de-escalate after 3 wrong) are reasonable estimates but not empirically validated for this audience. Store in a named config object accessible via Firebase Remote Config; plan to tune post-launch using Amplitude data.
- **Minimum pool variety per difficulty tier:** The "10+ puzzles per tier" floor is an estimate for "feels infinite without repetition." Validate via the 50-puzzle automated dedup test before ship — the test result should determine whether the pool needs further expansion.
- **chess.js SSR guard in new utility file:** PITFALLS.md flags that chess.js reads `window` and requires `dynamic` import or client-only guard in Next.js App Router. The existing codebase uses chess.js only in client components; a new `utils/puzzleGenerator.ts` could be imported from a server context. Confirm the guard pattern during Phase 2 implementation.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading: `app/[locale]/games/chess-game/`, `hooks/useChessProgress.ts`, `data/chessPuzzles.ts`, `utils/chessFen.ts` — existing contracts and state shapes confirmed first-hand
- chess.js npm v1.4.0 and docs: `moves({ square, verbose: true })` and `put()` API confirmed
- Lepdy PROJECT.md v1.3 milestone spec and constraints

### Secondary (MEDIUM confidence)
- ChessKid named level progression structure — piece-by-piece learning sequence confirms band model over numeric rating
- Duolingo energy replaces hearts (May 2025) — confirms punishment-free direction; hearts system deprecated
- Khan Academy Kids mastery-gated progression — repeat until correct model
- Puzzle game loyalty index 2025 (Mistplay) — streak mechanics drive engagement (puzzle genre 85/100 loyalty index)
- Generating Chess Puzzles with Genetic Algorithms (PropelAuth blog) — contrast against rule-based approach; confirms rule-based is appropriate for beginner puzzles

### Tertiary (LOW confidence — directional only)
- Predicting Chess Puzzle Difficulty (arxiv.org/html/2410.11078v1) — center/edge heuristic aligns with complexity findings; not a direct source for difficulty threshold values
- Duolingo gamification research (Young Urban Project) — streak boost figures (60% engagement, 3.6x at 7-day); magnitude may not transfer to this specific audience or app type

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
