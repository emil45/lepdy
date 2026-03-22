# Feature Research

**Domain:** Kids chess learning game — infinite replayability (v1.3 milestone)
**Researched:** 2026-03-22
**Confidence:** HIGH (competitor mechanics verified against shipped products; library APIs confirmed)

---

## Context: What Already Exists

The following are DONE and must not be re-invented in v1.3:

- 3-level progression: learn pieces → movement puzzles → capture puzzles
- 18 hand-curated movement puzzles, 8 hand-curated capture puzzles (these become seed content)
- Hebrew piece name audio + piece introduction walkthrough
- Pastel board, 2 SVG piece themes (Staunty/Horsey), settings drawer
- Sticker rewards (3 chess stickers), localStorage progress tracking via `useChessProgress`
- Kid-friendly feedback: celebration on correct, gentle try-again, hints after 2 wrong

This research covers only what is needed to add: **infinite replayability, random puzzle generation, escalating difficulty, and a progression system that motivates return visits.**

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that ChessKid, Lichess, Magnus Trainer, and Duolingo have established as baseline expectations. Missing these makes the experience feel thin.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Randomly generated movement puzzles | Fixed 18-puzzle set is exhausted in one session for age 7+; kids replay same puzzles by day 2 | MEDIUM | Place piece on random square, compute legal squares via chess.js `moves({square})`, ask "where can it move?" — no AI |
| Randomly generated capture puzzles | Fixed 8-puzzle set is exhausted in under 10 minutes of play | MEDIUM | Place attacker + target piece, ask "which piece can capture it?" — validated via chess.js |
| Infinite puzzle stream (no terminal end screen) | ChessKid, Lichess, Magnus all loop forever — "you finished all puzzles" is a dead end | LOW | After last curated puzzle, automatically start random generation; never show "all done" as a session-ender |
| Escalating difficulty within puzzle runs | All top apps gate difficulty to player level — flat difficulty causes boredom within 3 sessions | MEDIUM | Start with Rook/Bishop (predictable movement), add Knight last (L-shape is hardest for ages 5-9); add distractor pieces as correct answers accumulate |
| Progress that persists between sessions | Khan Academy Kids, ChessKid both persist progress — kids expect to return to their place | LOW | Already exists via localStorage; extend to track per-piece correct count and current difficulty band |
| No punishment for wrong answers (no lives/hearts) | Duolingo replaced its hearts system with energy in May 2025 specifically because punishment discourages young learners from retrying | LOW | Current "try again" pattern is correct — do NOT add lives, hearts, or energy walls |
| Immediate positive feedback on correct | Every kids edtech app does this: sound + animation | LOW | Partially exists (slide animation); confirm audio confirmation sound plays on correct |

### Differentiators (Competitive Advantage)

Features that align with Lepdy's core value (Hebrew chess vocabulary + fun puzzles) and that competitors do not offer.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hebrew piece name on every generated puzzle | No chess learning competitor ties language vocabulary to procedurally generated puzzles; Lepdy uniquely reinforces Hebrew on every rep | LOW | Pass `pieceName` (Hebrew) and `audioPath` into generated puzzle config — same pattern as curated puzzles; pronunciation button always visible |
| Named piece mastery bands (not Glicko rating) | ChessKid uses named levels (Pawn 1, Knight 5…) — concrete names are motivating for ages 5-9; a numeric rating like "1247" means nothing to a child | MEDIUM | "Rook Beginner → Rook Expert → Knight Beginner…" tracks per-piece mastery; advance after N consecutive correct; celebrate band completion |
| Consecutive-correct run counter | Puzzle games score 85/100 on the 2025 Mobile Gaming Loyalty Index specifically because streak mechanics create urgency — "4 in a row!" motivates one more puzzle | LOW | Display consecutive correct counter during a session; celebrate milestone counts (3, 5, 10); reset on wrong answer (soft, not punishing) |
| Date-seeded daily featured puzzle | Daily puzzle culture (Chess.com Daily Puzzle, Wordle, NYT Connections) drives 2.3x daily return rate; a "today's puzzle" gives kids a talking point and a reason to return | LOW | Seed Math.random() with `new Date().toDateString()` — same puzzle for every player that day, client-side only, no server needed |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Glicko / ELO numeric rating | Seems like a natural progression system — adults love it | Ages 5-9 cannot interpret a rating number; rating drops cause frustration and abandonment; Lichess's system is designed for adults | Named piece mastery bands — "Rook Challenger" is concrete, celebratory, not numeric |
| Lives / Hearts / Energy system | Appears to add tension and make success feel earned | Duolingo replaced hearts with energy in May 2025 precisely because punishment discourages young learners. For ages 5-9 a mistake wall causes abandonment | Unlimited retries with gentle "try again" — the current pattern is already correct |
| Competitive leaderboard | Multiplayer feel, peer comparison seems engaging | Already ruled out in PROJECT.md. Social competition creates anxiety for ages 5-9, not motivation | Personal run counter, session best score displayed locally |
| AI/Stockfish puzzle generation | Complex positions feel "real" and authentic | Stockfish produces positions that are correct but opaque — kids cannot understand why a move is best. Academic research (2025) shows ML puzzle gen produces non-intuitive content for beginners | Rule-based random generation: place piece → compute legal moves via chess.js — transparent, fast, zero server cost |
| Spaced repetition / adaptive ML difficulty | Sounds scientific and personalized | Requires data collection, server infrastructure, and enough signal volume to tune. A kids' web game with no auth cannot collect enough signal | Deterministic difficulty bands: succeed N times → advance to next band. No ML, no server |
| Push notifications / reminders | Standard Duolingo-style retention mechanic | Lepdy is a web app — push notifications require service workers, user permission grants, and COPPA parental consent for under-13. Risk/reward ratio is poor | Date-seeded daily featured puzzle creates natural "come back tomorrow" motivation without notification infrastructure |
| Infinite free play (no structure) | Removes all structure so kids can play anything | Without structure, kids lose the learning signal entirely. Khan Academy Kids research shows purely free-form play reduces retention of educational content | Infinite loop within a puzzle type; difficulty band advances but scaffolding is never removed |

---

## Feature Dependencies

```
[Random Movement Puzzle Generator]
    └──requires──> chess.js moves({square, verbose: true}) API
    └──requires──> Piece Introduction Complete (existing gate — keep it)
    └──enhances──> Hebrew Name on Puzzle (piece is known → show its name)

[Random Capture Puzzle Generator]
    └──requires──> chess.js moves() API
    └──requires──> Piece Introduction Complete

[Infinite Puzzle Stream]
    └──requires──> Random Generator (movement + capture)
    └──requires──> Removal of terminal "all done" end screen

[Difficulty Escalation]
    └──requires──> Random Puzzle Generator (generator must accept difficulty params)
    └──requires──> Per-Piece Correct Answer Tracking (extends existing localStorage hook)

[Named Mastery Bands]
    └──requires──> Per-Piece Correct Answer Tracking
    └──requires──> Difficulty Escalation
    └──conflicts──> Glicko numeric rating (pick one model — bands win for this age group)

[Consecutive-Correct Run Counter]
    └──requires──> Infinite Puzzle Stream (needs a stream to count across)
    └──enhances──> Difficulty Escalation (optional: streak break can soften difficulty reset)

[Date-Seeded Daily Puzzle]
    └──requires──> Random Puzzle Generator
    └──no server needed──> client-side date hash as RNG seed
```

### Dependency Notes

- **chess.js is already available**: react-chessboard has chess.js as a peer dependency; existing codebase already uses it. Call `new Chess()`, place a piece with `.put({type, color}, square)`, then `chess.moves({square, verbose: true})` returns all legal destination squares. No new library install.
- **Difficulty escalation requires tracking extension**: The existing `useChessProgress` hook tracks level completion but not per-piece correct counts. This hook needs extension (add `perPieceCorrectCount` map), not replacement.
- **Daily puzzle requires no server**: `new Date().toDateString()` → simple hash → seed for a deterministic position selector. Same puzzle for all users that day, fully client-side.
- **Streak counter does not conflict with retries**: The run counter resets on wrong answer but there is no penalty — it is positive reinforcement (count up), not negative (count down to zero). These co-exist without conflict.

---

## MVP Definition

This is a subsequent milestone on a shipped product. MVP here means minimum to deliver the stated goal: **make the chess game infinitely replayable**.

### Launch With (v1.3 core)

- [ ] **Random movement puzzle generator** — Place a piece on a random square, compute valid squares via chess.js, ask "where can it move?", generate new puzzle immediately after answer. Without this the experience is still finite. (MEDIUM complexity)
- [ ] **Random capture puzzle generator** — Place attacker + target, ask "which piece can capture it?", validate with chess.js. Level 3 becomes infinite. (MEDIUM complexity)
- [ ] **Infinite puzzle stream** — Remove the terminal "all done" screen after fixed puzzle sets. Generate next puzzle immediately. This is the core of the milestone. (LOW complexity)
- [ ] **Difficulty escalation** — Start with Rook/Bishop (predictable linear movement), delay Knight (L-shape hardest for kids), add distractor pieces to board as correct answer count climbs. Flat difficulty causes boredom by session 2. (MEDIUM complexity)
- [ ] **Hebrew piece name on every generated puzzle** — Show Hebrew name + pronunciation button on every randomly generated puzzle screen. Low effort, directly serves Lepdy's core value. (LOW complexity)
- [ ] **Consecutive-correct run counter** — "3 in a row!" display during a puzzle run. Motivates one more puzzle without any infrastructure. (LOW complexity)

### Add After Validation (v1.3.x)

- [ ] **Named piece mastery bands** — "You've mastered Rook puzzles! Knight unlocked!" — add after confirming random generator works and kids engage. (MEDIUM complexity)
- [ ] **Date-seeded daily featured puzzle** — Add when return visit rate data suggests daily hook is a priority. (LOW complexity)
- [ ] **Puzzle count display** — "Puzzle 47 today" gives cumulative accomplishment. Add once tracking is extended. (LOW complexity)

### Future Consideration (v2+)

- [ ] **Tactic type puzzles (forks, pins)** — For ages 8+. Explicitly out of scope per PROJECT.md "ready to play" goal.
- [ ] **Multi-piece sequence puzzles** — Two pieces, find a two-move sequence. Significant complexity jump; defer until single-piece puzzles are proven.
- [ ] **Parent progress view** — Dashboard showing puzzle count, pieces mastered. Valuable for Lepdy's family audience but requires UX scope beyond the game.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Random movement puzzle generator | HIGH | MEDIUM | P1 |
| Random capture puzzle generator | HIGH | MEDIUM | P1 |
| Infinite puzzle stream (no end screen) | HIGH | LOW | P1 |
| Difficulty escalation | HIGH | MEDIUM | P1 |
| Hebrew name on every generated puzzle | HIGH | LOW | P1 |
| Consecutive-correct run counter | MEDIUM | LOW | P1 |
| Named piece mastery bands | MEDIUM | MEDIUM | P2 |
| Date-seeded daily featured puzzle | MEDIUM | LOW | P2 |
| Puzzle count display | LOW | LOW | P3 |
| Parent progress dashboard | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Required to deliver infinite replayability milestone goal
- P2: Meaningful retention add-on after core is working
- P3: Nice to have; future consideration

---

## Competitor Feature Analysis

| Feature | ChessKid | Lichess | Duolingo | Our Approach |
|---------|----------|---------|----------|--------------|
| Puzzle difficulty model | Named piece-based levels (Pawn 1, Knight 5…) | Glicko2 numeric rating matched to player | Tiered skill bands, no numeric for kids | Named piece mastery bands — concrete, non-numeric, age-appropriate |
| Puzzle supply | 50,000+ curated + daily puzzle | Millions in DB, Glicko-matched | Algorithmically varied exercises | Rule-based random generation — no database, no server |
| Streak / run mechanics | Daily puzzle streak, login streaks | Puzzle streaks | Streak + XP (major retention driver) | Consecutive-correct counter during session; daily featured puzzle for return hook |
| Penalty for mistakes | None in kids mode | None in puzzle mode | Hearts replaced by Energy (May 2025) | No penalty — gentle "try again" (existing pattern, confirmed correct) |
| Language learning integration | English only | English only | Language is the product | Hebrew piece names on every generated puzzle — unique differentiator |
| Difficulty escalation trigger | Completing named lesson sets | Winning/losing vs. Glicko puzzle rating | Mastery threshold (N correct → advance) | N correct answers per piece → advance difficulty band |
| Daily return hook | Daily puzzle on homepage | Daily puzzle | Daily lesson + streak | Date-seeded daily featured puzzle (client-side, no server) |

---

## Implementation Guidance for Roadmap

**chess.js API** (no new install needed — already transitive via react-chessboard):
```typescript
import { Chess } from 'chess.js';
const chess = new Chess();
chess.clear();
chess.put({ type: 'r', color: 'w' }, 'd4'); // place a rook on d4
const moves = chess.moves({ square: 'd4', verbose: true });
// moves[i].to = destination square; use these to render green dots
```

**Difficulty escalation algorithm (recommended bands)**:
- Band 0: Rook or Bishop only, empty board (no distractors) — easiest movement to visualize
- Band 1: Add Queen, 1-2 distractor pieces on board
- Band 2: Add Knight (hardest L-shape for kids), 2-3 distractors
- Band 3: All pieces, 3+ distractors, target piece in non-obvious position
- Advance after 5 consecutive correct answers for current piece; soften back one band after 3 consecutive wrong (not punishing — just recalibrate)

**Hebrew name integration** (low effort):
- Generated puzzle config mirrors curated puzzle config shape
- Pass `piece: 'r'` → look up `{ hebrewName: 'צריח', audioPath: '/audio/chess/he/rook.mp3' }` from existing piece registry
- Render Hebrew name + audio button on puzzle screen — same component pattern as Level 1

**Daily puzzle seeding** (no server):
```typescript
function getDailySeed(): number {
  const dateStr = new Date().toDateString(); // e.g. "Sun Mar 22 2026"
  return dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}
```
Use seed to deterministically pick piece + square — same result for all players on the same day.

---

## Sources

- [ChessKid Levels Feature](https://www.chesskid.com/learn/articles/new-chesskid-feature-release-levels) — named level progression structure; "Pawn 1: Meet the Rook"
- [ChessKid All Lessons Guide](https://www.chesskid.com/learn/articles/lessons-guide-all-levels-topics) — piece-by-piece learning sequence
- [Lichess puzzle rating discussion](https://lichess.org/forum/general-chess-discussion/puzzle-rating-question) — Glicko2 mechanics and why they suit adults, not young children
- [Duolingo gamification case study 2025](https://www.youngurbanproject.com/duolingo-case-study/) — streaks boost engagement 60%, 3.6x retention at 7-day streak
- [Duolingo Energy replaces Hearts May 2025](https://newsgpt.ai/2025/05/14/duolingos-new-energy-system-more-motivation-less-penalty/) — confirmed punishment-free direction; hearts system deprecated
- [Khan Academy Kids Learning Path](https://khankids.zendesk.com/hc/en-us/articles/360048828572-Learn-more-about-the-Learning-Path) — mastery-gated progression, repeat until correct
- [Puzzle game trends and retention 2025 — Mistplay](https://business.mistplay.com/resources/puzzle-game-trends) — daily streak mechanics; puzzle genre scores 85/100 loyalty index
- [chess.js GitHub](https://github.com/jhlywa/chess.js/) — moves() API, square-specific moves, verbose mode with source/target squares
- [Generating Chess Puzzles with Genetic Algorithms](https://www.propelauth.com/post/generating-chess-puzzles-with-genetic-algorithms) — ML approach contrast; confirms rule-based is appropriate for beginner puzzles
- [Magnus Trainer App Store](https://apps.apple.com/us/app/magnus-trainer-train-chess/id1097863089) — bite-sized games, dozens of levels, regular content additions model
- [ChessKid Review — Common Sense Education](https://www.commonsense.org/education/reviews/chesskid) — kids learning structure and safety validation

---
*Feature research for: Lepdy Chess v1.3 Infinite Replayability*
*Researched: 2026-03-22*
