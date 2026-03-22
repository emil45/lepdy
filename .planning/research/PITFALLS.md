# Pitfalls Research

**Domain:** Infinite replayability — random puzzle generation, escalating difficulty, and progression/retention systems for a kids' chess learning app (ages 5-9)
**Researched:** 2026-03-22
**Confidence:** HIGH (domain knowledge from kids' educational game patterns, verified against codebase specifics)

---

## Critical Pitfalls

### Pitfall 1: Puzzle Generator Produces Unsolvable or Trivially Easy Boards

**What goes wrong:**
The random board generator places pieces, computes valid targets, and presents the puzzle — but occasionally generates degenerate cases: a rook blocked on all sides by friendly pieces (zero valid moves), a king in the corner with no visible escape, or a queen with 27 valid targets where any tap is essentially random. The game accepts or rejects taps based on `validTargets`, so a procedural generator that gets this wrong produces either unbeatable walls or instant wins with no learning value.

**Why it happens:**
The existing puzzle data (`chessPuzzles.ts`) hand-curates FEN strings and `validTargets` arrays. A generator must reproduce this contract — compute FEN, compute valid targets from game rules — without the safety of manual review. Chess movement rules have corner cases: pawns on starting rank vs. not, king near edge, bishop on a1-h8 vs. a8-h1 diagonal, knight near corners. Teams often verify the "happy path" piece position and miss edge-of-board scenarios that emerge from randomization.

**How to avoid:**
- Build the generator to produce FEN first, then derive `validTargets` from a chess rules engine (chess.js or a minimal rule module), not the other way around. Never handcraft the valid targets array in a generator.
- Enforce constraints during generation: minimum valid targets (e.g., at least 3 for movement puzzles), maximum valid targets (e.g., not more than 14 for difficulty 1), piece placement at least 2 squares from edge for early puzzles.
- Write a validator function that checks every generated puzzle before presenting it. If invalid, regenerate (up to N attempts, then fall back to a curated puzzle).
- Test the generator in isolation with 1000 samples and log any degenerate results before integrating into UI.

**Warning signs:**
- Kid immediately taps wrong every time (board feels impossible)
- Kid taps any square and gets it right on first try consistently (too easy, too many targets)
- "Try Again" shows on empty squares (validTargets computation is wrong)
- Console errors about missing piece or undefined square reference

**Phase to address:** Puzzle generation phase (whichever phase introduces the random generator — this is the foundational phase for the entire milestone).

---

### Pitfall 2: Progress Schema Breakage When Migrating from Linear Levels to Infinite Puzzles

**What goes wrong:**
The existing `useChessProgress` stores `{ completedLevels: number[], currentLevel: number }` under `lepdy_chess_progress`. The new system needs to store difficulty band, total puzzles solved, streak, or similar. Teams write a new hook with a new shape, forget that real kids already have the old key, and either: (a) the new code reads old data and crashes on a type mismatch, or (b) kids lose all existing progress on first load.

**Why it happens:**
The existing hook already has basic safeguards (`Array.isArray` check) but doesn't have a version field. Adding new fields to the same key without a migration guard is the natural path-of-least-resistance. The bug only appears on devices that previously ran the game — always passes on fresh installs.

**How to avoid:**
- Add a `version: number` field to every localStorage schema from the start. The current schema should be treated as `version: 1`.
- When the new hook loads, check the version. If version < 2, migrate: preserve what is meaningful (e.g., `completedLevels` could seed initial difficulty band: if all 3 levels completed, start at difficulty 2), then write the new schema version.
- Use a different storage key for the v2 schema (`lepdy_chess_progress_v2`) to guarantee no collision during rollout.
- Keep reading the old key during migration so returning kids get credit for prior progress.

**Warning signs:**
- Type errors on `parsed.currentLevel` or `parsed.completedLevels` at runtime
- `NaN` difficulty band on first load for returning users
- Kids see level 1 locked again despite having completed it

**Phase to address:** Progress system redesign phase, before any new UI is built on top of the new schema.

---

### Pitfall 3: Difficulty Escalation Is Too Steep or Too Flat — Kids Quit or Get Bored

**What goes wrong:**
The difficulty curve is calibrated on a developer's machine with adult chess knowledge, not on a 6-year-old. Either (a) difficulty ramps fast and kids hit a wall where puzzles feel impossible at puzzle 10, or (b) difficulty never meaningfully escalates and kids are still doing rook-in-center-of-empty-board puzzles at puzzle 50. Both kill retention. The first causes frustration-quit. The second causes boredom-quit.

**Why it happens:**
Teams use simple numeric difficulty labels (1, 2, 3) and ramp by changing a single parameter (more pieces on board, less common piece positions). They don't account for the cognitive difference between "understanding a rule" and "applying it in a crowded board." For ages 5-9 with wide skill variation, difficulty labels that feel smooth to a developer can feel like a cliff to a child.

**How to avoid:**
- Separate difficulty into two independent axes: **board complexity** (how many other pieces on board) and **position novelty** (how far from center, edge cases). Escalate board complexity first, position novelty second — adding more pieces is intuitive; unusual positions are confusing even when movement is "easy."
- Use a puzzle-per-session window: don't escalate difficulty until the kid has solved at least 5 puzzles correctly at the current band. Don't escalate based on consecutive correct answers alone (one lucky streak should not lock a kid into hard puzzles).
- Implement a **softcap**: never advance more than one difficulty tier per session.
- Implement a **de-escalation signal**: after 3 wrong attempts on the same puzzle type, quietly step back one tier. Reset tier on next session start, not immediately during session.

**Warning signs:**
- More than 4 wrong taps before any correct answer on a movement puzzle (too hard)
- Average puzzle solve time drops near zero after puzzle 5 (too easy, reflexive tapping)
- Session duration drops sharply at a specific puzzle number

**Phase to address:** Difficulty engine design phase. The escalation logic should be spec'd and test-driven before any UI that displays difficulty is built.

---

### Pitfall 4: The "Infinite" Label Creates an Endless-Treadmill UX That Kids Abandon

**What goes wrong:**
Teams implement random puzzle generation and declare the game infinite, but provide no milestones, no visible progress markers, no "you got through 10 puzzles today" moment. Kids, especially ages 5-9, need micro-rewards and visible completion signals to feel progress. Without these, "infinite" feels like an empty corridor with no doors. Session length drops after puzzle 3 because there is nothing to look forward to.

**Why it happens:**
The existing game has a satisfying completion arc: Level 1 → Level 2 → Level 3 → "You learned chess!" Each level has a completion screen with confetti. Removing the finite arc and replacing it with pure infinity removes the emotional payoff loops that keep kids engaged. Teams focus on the technical generation system and defer "progression feel" to a later phase that never ships.

**How to avoid:**
- Define micro-milestones before writing any generator code: "Every 5 puzzles" is a session checkpoint. "Every 25 puzzles" is a badge/sticker unlock. These milestones must be specified as success criteria of the generation phase, not deferred.
- Keep the existing Level 1 → Level 2 → Level 3 arc as the onboarding path. Infinite generation starts only after a kid completes Level 3. This preserves the existing completion feel and makes the transition to infinite feel like an unlock ("You've unlocked endless puzzles!").
- Show a visible "puzzle N" counter and a "daily goal" indicator (e.g., "5 puzzles today") so kids know where they are in the session.

**Warning signs:**
- Kids exit after puzzle 3-5 without any error (pure abandonment)
- Play sessions are shorter than the average of v1.0/v1.1 (regression)
- No engagement spike after session 1 (no reason to return)

**Phase to address:** UX/progression design phase. Must be specified before the generation phase so the generator builds milestone hooks into its output from day one.

---

### Pitfall 5: Random Puzzle Generator Repeats the Same Puzzles Immediately

**What goes wrong:**
The simplest random generator picks uniformly from a pool (or generates from a seed without deduplication). Kids see the same position twice in three puzzles. For movement puzzles, this feels like a bug. For capture puzzles, kids memorize the correct answer from the last repetition — zero learning happens. Kids ages 5-7 will notice repetition and lose trust in the game ("it's broken").

**Why it happens:**
Pure random selection has high collision probability with small pools. The existing 18 movement + 8 capture puzzles already had this risk; a generator that produces a limited variety of positions will repeat frequently. Teams test with 5 puzzles and don't notice; kids play 20+ in a session.

**How to avoid:**
- Maintain a **recent-puzzles ring buffer** per session (last 10-15 puzzle hashes). Never regenerate a puzzle whose hash is in the buffer.
- For procedurally generated puzzles: hash the (piece type, piece position, distractor positions) tuple. Two puzzles with the same piece on the same square are "the same puzzle" from a kid's perspective.
- Ensure the generator's effective variety exceeds 30 unique positions per piece type before the feature ships. Validate this in automated tests.

**Warning signs:**
- The same FEN string appears twice within 10 puzzles in a test run
- Kids say "I already did this one" (qualitative signal)

**Phase to address:** Puzzle generation phase. Deduplication must be a built-in contract of the generator, not a post-hoc fix.

---

### Pitfall 6: Progression System Stores State in Component State Instead of the Progress Hook

**What goes wrong:**
A new "session stats" or "streak" feature gets added directly to `ChessGameContent` state (`useState`). Progress is lost when the component unmounts (kid exits to the games menu and comes back). Or worse, progress is duplicated: one source in `useChessProgress` (persisted) and one in local component state (ephemeral), and they diverge.

**Why it happens:**
The existing codebase uses `useChessProgress` as a simple standalone hook without a context provider. The hook was intentionally kept simple ("no migration logic needed" per the Key Decisions table). When adding new fields (difficulty band, session puzzle count, streak), the natural temptation is to add them to the nearest `useState` rather than extend the hook and update the persistence schema.

**How to avoid:**
- All persistent player state (difficulty band, total puzzles solved, current streak, date of last session) must live in an extended `useChessProgress` hook. Nothing that should survive a page reload lives in component state.
- Session-only state (current puzzle index within a session, animation state, hint counters) is fine in component state — it resets correctly on remount.
- Before adding any new `useState` to a game component, ask: "Would losing this state on exit be correct behavior?" If no, move it to the hook.

**Warning signs:**
- Difficulty band resets to 1 every time the games menu is visited
- "Streak" counter always shows 1 despite continuous play
- Progress bar resets on back-navigation

**Phase to address:** Progress system redesign phase, as a design constraint applied before any new UI is coded.

---

### Pitfall 7: The Hint System Breaks Under Infinite/Random Puzzles

**What goes wrong:**
The existing hint system shows green dot overlays on `validTargets` after 2 wrong taps. This works because every `validTargets` array is hand-verified. A generator that produces incorrect `validTargets` will show hints pointing to wrong squares, actively teaching kids incorrect movement rules. This is worse than showing no hint.

**Why it happens:**
Testing the generator's correctness and testing the hint display are treated as separate concerns. The generator passes unit tests for common positions, but edge cases (pawn at rank 8, knight at a1) produce wrong validTargets that only surface during gameplay when the hint reveals the error.

**How to avoid:**
- The generator's validTargets computation must be the single source of truth used by both the hint system AND the tap validation. Never compute them independently in two places.
- Validate generated validTargets against chess.js or an equivalent rule engine in a test suite, not manually.
- If using chess.js: call `chess.moves({ square: pieceSquare, verbose: true })` and extract the `.to` fields. This is authoritative and handles all edge cases.

**Warning signs:**
- Hints appear on squares that correctly produce "wrong tap" feedback
- Tap validation and hints disagree (some validTargets squares show no hint, or non-validTargets squares get hinted)

**Phase to address:** Puzzle generation phase. The rule engine integration must be established before hints or tap validation is wired to generator output.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode difficulty thresholds as magic numbers in generator | Fast to write | Impossible to tune without reading code; breaks when puzzle types change | Never — use named constants minimum |
| Store difficulty band in component state | No hook refactor needed | Resets on every navigation; progression feels broken | Never |
| Skip deduplication buffer | Simpler generator | Kids see repeated puzzles; perceived as bug | Never in shipped code; OK in a generator prototype |
| Use same localStorage key for v2 schema | No migration code needed | Returning kids get corrupt reads or lost progress | Never — always version-gate schemas |
| Generate puzzles at render time (no memoization) | Simple code | Re-renders regenerate new puzzle mid-display; board flickers | Never in puzzle components |
| Reuse `completeLevel(levelNum)` API for new infinite progression | No new hook surface needed | Level 1/2/3 semantic doesn't map to difficulty bands; semantics rot | Only for pure-backward-compat check; deprecate quickly |

---

## Integration Gotchas

Common mistakes when connecting to existing systems and external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| chess.js for move generation | Import full chess.js at module level — causes SSR crash (chess.js reads `window`) | Use `dynamic(() => import('chess.js'), { ssr: false })` or guard in a utility that only runs client-side |
| chess.js FEN validation | Trust that a generated FEN string is valid without checking | Call `chess.validate_fen(fen)` before passing FEN to `react-chessboard`; invalid FEN silently renders empty board |
| react-chessboard position prop | Switch to full FEN (with side-to-move) for infinite puzzles | `react-chessboard` accepts piece-placement FEN — keep this contract; do NOT switch to full FEN unless needed |
| `useChessProgress` hook | Add new fields without migration guard | Always provide defaults for every field; check `typeof parsed.field !== 'undefined'` before using; version the schema |
| Amplitude analytics | Log inline string event names per puzzle | Define all new milestone events in `models/amplitudeEvents.ts` before the feature ships |
| Sticker unlock system | Create a new `chess_infinite` unlock type without checking existing detector | Reuse `chess_level` unlock type pattern; extend the detector with milestone thresholds rather than inventing new types |

---

## Performance Traps

Patterns that work at small scale but fail under real usage.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Generating puzzles inside render body | Board re-renders on any parent state change (settings drawer open/close) produce new random puzzles — board resets mid-play | Generate puzzle once in `useState` initializer or stable `useMemo`; deps must be stable | First time parent re-renders after puzzle is displayed |
| Confetti on every correct tap, no cleanup | Each correct answer mounts a `react-confetti` instance; rapid play accumulates many instances on tablet | Mount confetti, set `recycle={false}`, unmount after 3s — same pattern as existing code, already correct | Sustained correct-answer streaks on low-end tablet |
| chess.js instantiated on every puzzle render | New `Chess(fen)` inside an unstable `useMemo` or render body | Instantiate chess.js once per puzzle in a `useEffect` or `useMemo([fen])`; do not reinstantiate on animation re-renders | High-frequency re-renders during slide animation |
| Large puzzle pool stored in module scope | All puzzles in memory even when not playing chess | Already fine for curated set; for generated puzzles, generate on demand and discard solved puzzles rather than pre-generating all | Only matters if pool exceeds ~1000 objects |

---

## UX Pitfalls

Common user experience mistakes for this domain and age group.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "puzzle N / ∞" | Kids and parents have no sense of completion; infinity is not meaningful to a 6-year-old | Show session progress ("5 puzzles today") and milestone progress ("25 more to next sticker") — finite, achievable goals |
| Escalating difficulty without communicating it | Kid suddenly fails repeatedly with no explanation; feels like the game broke | Show a subtle "Getting harder!" badge when advancing a tier; make escalation feel like achievement, not punishment |
| Resetting to Level 1 after all levels completed | Kid feels punished for finishing; "I already did this" | Transition to infinite mode as an explicit unlock after Level 3; level map celebrates "Endless mode unlocked!" |
| Skipping per-puzzle celebration on infinite puzzles | Kid completes 50 puzzles with no moment of joy | Keep the small confetti burst per correct answer (already in MovementPuzzle/CapturePuzzle); add milestone celebrations at 5/10/25 |
| Hints revealing all valid targets immediately at high difficulty | Kids tap hint squares reflexively; no learning | Maintain existing 2-wrong-tap threshold; consider increasing to 3 on harder difficulty tiers |
| Difficulty change in the middle of a session | Confusing to re-enter mid-session at unexpected difficulty | Persist difficulty band; resume exactly where left off |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Puzzle generator:** Passes automated test with 1000 generated puzzles — zero degenerate results (null validTargets, zero targets, target equals piece square). Verify before connecting to UI.
- [ ] **Progress migration:** Tested on a device with old `lepdy_chess_progress` key present. Returning user must not lose prior level completion state and must not see a crash.
- [ ] **Deduplication:** Session ring buffer tested with 50 consecutive puzzles — no repeated FEN within a window of 15. Verify in unit test.
- [ ] **SSR safety:** Any chess.js usage is wrapped in `dynamic` or client-only guard. Run `npm run build` and confirm zero SSR errors after integration.
- [ ] **Difficulty persistence:** Exit game at difficulty band 2, re-enter game, confirm difficulty band is still 2 (not reset to 1).
- [ ] **Hint correctness:** Every generated puzzle's hint squares produce "correct" tap feedback when tapped. A hinted square that produces "wrong" feedback is a teach-wrong bug.
- [ ] **Level 1-3 path unbroken:** Existing Playwright tests still pass after progress hook refactor. Kids who haven't completed the tutorial still see the lock on Level 2.
- [ ] **Infinite mode gate:** Kids who have NOT completed Level 3 do not see infinite puzzle mode. The gate must survive a localStorage clear (fresh user sees Level 1, not infinite).
- [ ] **Analytics events defined:** All new milestone events added to `amplitudeEvents.ts` before feature ships. No inline string event names in `logEvent` calls.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Generator produces wrong validTargets (teach-wrong bug) | HIGH | Immediately fall back to curated puzzle set via Firebase Remote Config feature flag; fix generator; A/B test before re-enabling |
| Progress schema corruption for returning users | HIGH | Write migration that detects corrupt schema (missing version, unexpected types) and resets to defaults; show "Your progress was reset" in-game |
| Difficulty ramp too steep, kids quit | MEDIUM | Difficulty thresholds must be a config object (not hardcoded) so they can be tuned via Firebase Remote Config without a code deploy |
| Puzzle repetition noticed by users | LOW | Increase ring buffer size; ship as patch; no data loss |
| Existing Level 1-3 regression | MEDIUM | Existing Playwright test coverage will catch this; restore prior hook contract and keep backward compat shim |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Unsolvable or trivial generated puzzles | Puzzle generation phase (first phase of milestone) | 1000-puzzle automated validation test passes before UI integration |
| Progress schema breakage on migration | Progress system redesign phase | Playwright test: load old schema key, open game, confirm no crash and correct level state |
| Difficulty curve miscalibration | Difficulty engine phase | Thresholds in named config object; configurable via Remote Config; manual playtest with child if possible |
| Missing micro-milestones / infinite treadmill | UX/progression design phase | Milestone triggers spec'd before generator is written; milestone fires confirmed in Amplitude test events |
| Puzzle repetition | Puzzle generation phase | Automated: generate 50 puzzles, assert no FEN appears in previous 15 |
| Progression state in component state | Progress system redesign phase | Code review gate: no new puzzle-related `useState` that is not reset-safe on navigation |
| Hints broken on generated puzzles | Puzzle generation phase | Integration test: generated puzzle hint squares all produce "correct" tap response |

---

## Sources

- Codebase direct analysis: `data/chessPuzzles.ts`, `hooks/useChessProgress.ts`, `app/[locale]/games/chess-game/MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `ChessGameContent.tsx` — existing contracts and state shapes
- Pattern: Kids' educational game retention — micro-milestones, difficulty de-escalation, visible session goals (HIGH confidence — well-established in educational game design)
- Pattern: Chess puzzle generator edge cases — pawn, knight near corners, king near edge (HIGH confidence — deterministic chess rules)
- Pattern: localStorage migration without versioning — common returning-user bug in React apps (HIGH confidence — recurrent pattern in web app development)
- Pattern: SSR + chess.js — `window`/`document` access causes Next.js build failures; requires `dynamic` import (HIGH confidence — Next.js App Router constraint, verified against existing codebase SSR patterns)

---
*Pitfalls research for: Infinite replayability — random puzzle generation, escalating difficulty, progression systems*
*Researched: 2026-03-22*
