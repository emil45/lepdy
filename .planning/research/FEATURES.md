# Feature Research

**Domain:** Kids chess learning game — polished puzzle experience (v1.4 milestone)
**Researched:** 2026-03-23
**Confidence:** HIGH (competitor mechanics verified against shipped products; UX patterns sourced from current design literature)

---

## Context: What Already Exists (Do Not Re-invent)

The following shipped in v1.0–v1.3 and must not be rebuilt:

- 3-level learn/movement/capture progression with 95 validated puzzles
- Infinite random puzzle generator with adaptive per-piece difficulty (5 correct = advance, 3 wrong = soften)
- Named mastery bands: Beginner / Intermediate / Expert per piece
- 10-puzzle structured sessions with streak counter and 1-3 star completion
- Daily featured puzzle (date-seeded, client-side)
- Hebrew piece names + audio on every puzzle
- 2 SVG piece themes (Staunty/Horsey) with settings drawer + localStorage persistence
- 3 chess stickers integrated into Lepdy sticker collection
- Kid-friendly feedback: celebration on correct, gentle try-again, hint after 2 wrong
- Game menu with 1/2/3/daily structure (currently broken per PROJECT.md active requirements)

This research covers only what is needed for v1.4: **redesigned game menu, practice mode, check/checkmate-in-1 puzzles, visual polish, and progress/engagement features.**

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that ChessKid, Magnus Trainer, ChessMatec, and leading kids edtech apps have established as baseline. Missing these makes the experience feel unfinished relative to the category.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Clear, scannable game menu | ChessKid, ChessMatec, Magnus all have top-level hubs with 3-5 large, labeled choices — kids cannot parse nested or text-heavy navigation | LOW | Max 3-4 choices: Play (adaptive session), Practice (per-piece), Daily Puzzle, maybe Learn. Large icon + label tiles, no dropdowns, no multi-level submenus |
| Per-piece practice selection screen | ChessMatec's course structure and Lichess's piece-specific drill paths both show a piece picker (icon + name grid) before starting drills — kids expect to choose "I want to practice the knight" | MEDIUM | 6-tile grid showing each piece SVG + Hebrew name + mastery band label; tap to start infinite drills for that piece |
| Sound feedback on correct answer | Every children's app in this category (ChessKid, Khan Academy Kids, Duolingo) plays a positive sound on correct — absence is jarring | LOW | Already have `playSound(AudioSounds.X)` infrastructure; add a distinct "correct" sound and use consistently |
| Sound feedback on wrong answer | Same apps play a gentle "oops" sound on wrong — not punishing, just tactile confirmation | LOW | Short, low-key sound; not a buzzer or alarm which would feel punishing for ages 5-9 |
| Celebration on session complete | Stars + confetti at end of a puzzle session is universal in the category (ChessKid, Magnus, Duolingo). Already have react-confetti installed | LOW | Already partially implemented for session complete screen — verify confetti fires and stars animate in |
| Visible mastery progress per piece | ChessKid shows named levels, Magnus shows progress bars — kids expect to see "how am I doing on this piece?" | MEDIUM | Mastery bands already exist in data (Beginner/Intermediate/Expert); need a progress display surface in the menu or practice picker |
| Checkmate-in-1 puzzles | Every kids chess puzzle app includes mate-in-1 as a core puzzle type — it is the foundational tactical pattern | HIGH | Requires curated or generated positions where exactly one legal move delivers checkmate; chess.js `isCheckmate()` validates; generation is hard without pre-validation |
| Smooth transitions between screens | MUI + Lepdy v1.1 already added 300ms fade transitions — regression here would feel like a downgrade | LOW | Maintain existing fade transitions; add to any new screens |

### Differentiators (Competitive Advantage)

Features that align with Lepdy's core value and that competitors do not offer, or where Lepdy can do substantially better.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Practice mode with piece picker | ChessKid has structured lessons but no free-pick "drill any piece for as long as I want" mode; Magnus Trainer doesn't isolate by piece. Lepdy can own this for the 5-9 age bracket | MEDIUM | Piece picker screen → infinite adaptive session for that piece only; inherits existing adaptive difficulty engine; no new data needed |
| Check puzzles ("put the king in check") | ChessMatec uses check as a teaching concept in animations, not as an interactive puzzle type. This is a transitional puzzle type between capture puzzles and checkmate-in-1 — filling a gap in kids chess education | HIGH | "Tap where this piece can move to put the king in check" — find a square that results in check. chess.js `isCheck()` validates after hypothetical move. Requires generating positions where check is achievable |
| Piece-specific mastery map on menu | A visual "piece collection" or mastery grid that shows all 6 pieces with their current band gives kids a concrete sense of overall progress — no competitor has this in a clean, kid-readable format | MEDIUM | 6-piece grid on menu or a dedicated progress screen: piece SVG + current mastery band label + simple progress indicator (stars earned, or filled dots) |
| Celebration milestones during session | "5 in a row!" mid-session micro-celebration is a proven retention pattern (streak mechanics in puzzle games score highest on the 2025 Mobile Gaming Loyalty Index) but most chess apps only celebrate at session end | LOW | Trigger mini-confetti or bounce animation at 3, 5, and 10 consecutive correct answers during a session; non-blocking, 1-2 seconds |
| Hebrew audio on every screen | No competitor ties language learning to chess puzzles at all — this is Lepdy's complete differentiator | LOW | Already on puzzle screens; confirm Hebrew piece name + pronunciation button is visible on practice picker, check puzzles, and any new puzzle types |
| Session summary with per-piece breakdown | Magnus Trainer shows a post-session summary; ChessKid does not. Adding "you solved 4 knight puzzles, 3 rook puzzles" connects session activity to mastery progress | LOW | Extend existing session complete screen: show which pieces were practiced, streak count, stars earned; no new data collection required |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Checkmate-in-2 and checkmate-in-3 puzzles | Natural progression from mate-in-1 | Ages 5-9 cannot hold a 2-3 move calculation tree in working memory — these create frustration, not learning. The goal is "ready to play chess," not "tactical genius." Advanced apps like Pocket Chess offer mate-in-2 through mate-in-10 specifically for adult improvers | Mate-in-1 puzzles only; add mate-in-2 only if user research at v1.5 shows kids age 8-9 are ready |
| Timer pressure on puzzles | Duolingo uses timed XP, ChessKid Puzzle Rush uses timers for teen/adult modes | Ages 5-9 under time pressure shows elevated cortisol and abandonment in play research; timer pressure is appropriate for older learners not beginning learners | Streak counter (positive counting up) without timer; optional for v2 as a challenge mode |
| "Find the best move" free-form puzzles | Feels like "real chess puzzles" — authentic to chess.com and Lichess | "Best move" requires the child to evaluate full position and choose among multiple plausible moves. For ages 5-9 with 0-1 year chess experience, this has too many valid-feeling wrong answers and creates confusion about why the hint-move is "best" | Constrained puzzle types with one unambiguous correct answer: tap-to-move, capture-this-piece, check-the-king |
| Hint button requiring tap-then-read | Adults expect a hint button with a text explanation | Ages 5-9 cannot read the explanation fast enough; text hints are ignored in favor of random tapping. Lichess hints work for adults, not kids | After 2 wrong attempts, auto-highlight the correct square with a pulsing animation — same as existing behavior in v1.x |
| Leaderboard / global ranking | Competitive feel, peer comparison | Already ruled out in PROJECT.md. Social comparison creates anxiety for ages 5-9; for any chess game, losing to peers is a known dropout cause | Personal-best session stars and mastery bands — progress is self-referential, not competitive |
| Lives/hearts/energy | Seems to add tension | Duolingo replaced hearts with energy in May 2025 specifically because punishment discourages young learners. For ages 5-9 a mistake wall causes session abandonment | Unlimited retries; the current gentle "try again" pattern is correct and should be maintained |
| Full settings menu with many options | Power users expect customization | Ages 5-9 explore settings destructively (tap everything, change things randomly, get confused). The existing settings drawer already has piece theme; adding more options increases support surface | Keep settings to minimum (piece theme already there); any new options must be parent-accessible only or removed entirely |

---

## Feature Dependencies

```
[Redesigned Game Menu]
    └──requires──> All existing game modes to have stable entry points
    └──requires──> Practice Mode entry point defined
    └──enhances──> Piece Mastery Map (menu is the natural home for progress display)

[Practice Mode]
    └──requires──> Redesigned Game Menu (entry point)
    └──requires──> Piece Picker Screen (new)
    └──requires──> Existing adaptive puzzle engine (already built — reuse, not rebuild)
    └──enhances──> Mastery Bands (practice sessions update same per-piece tracking)

[Check Puzzles]
    └──requires──> Existing puzzle board component (reuse ChessBoard rendering)
    └──requires──> chess.js isCheck() for validation
    └──requires──> Pre-validated positions where check is achievable (generation constraint)
    └──standalone──> can be added to Practice Mode or Play session independently

[Checkmate-in-1 Puzzles]
    └──requires──> Pre-validated position set (cannot rely on pure random generation)
    └──requires──> chess.js isCheckmate() for validation
    └──requires──> Curated puzzle set or validated generator (HIGH complexity)
    └──conflicts──> Checkmate-in-2+ (explicitly defer)

[Visual Polish: Sound Effects]
    └──requires──> AudioSounds enum extension (add CORRECT, WRONG, MILESTONE sounds)
    └──requires──> Audio files (short WAV/MP3)
    └──enhances──> All puzzle types (fire on correct/wrong everywhere)

[Visual Polish: Celebration Milestones]
    └──requires──> Streak counter (already exists in session)
    └──requires──> react-confetti (already installed)
    └──enhances──> Practice Mode and Play sessions

[Piece Mastery Map]
    └──requires──> Named mastery bands (already exist in data)
    └──requires──> Redesigned Game Menu (or Practice screen as display surface)
    └──no new data needed──> reads existing useChessProgress hook

[Session Summary Enhancement]
    └──requires──> Session complete screen (already exists)
    └──requires──> Per-piece puzzle count tracking during session (small extension to usePuzzleSession)
```

### Dependency Notes

- **Redesigned menu must come first**: It is the entry point for all new features. Practice Mode and the Mastery Map have no surface to live in until the menu is redesigned.
- **Practice Mode reuses existing engine**: The adaptive difficulty engine (`usePuzzleSession`) already supports per-piece difficulty bands. Practice Mode just locks `pieceFilter` to one piece and removes the 10-puzzle limit. This is a parameter change, not a rebuild.
- **Check puzzles require chess.js position validation**: A position where a piece can check the king is not guaranteed by placing it on a random square. Either (a) generate positions and test with chess.js until check is possible, or (b) use a small curated set of check positions. Option (b) is lower risk for v1.4.
- **Checkmate-in-1 must be curated or heavily validated**: Pure random generation of legal checkmate-in-1 positions produces rare hits — most random positions have no forced mate. Recommend a curated set of 20-30 mate-in-1 positions validated against chess.js as the v1.4 approach. Infinite random mate generation is a v2 concern.
- **Sound infrastructure already exists**: `utils/audio.ts` + `AudioSounds` enum + `playSound()`. Adding new sounds = new enum values + new audio files. No architecture change.
- **Celebration animations already have infrastructure**: `react-confetti` and `celebrations.ts` utility. Session complete already uses confetti. Milestone celebrations during puzzles are a trigger point change, not new infrastructure.

---

## MVP Definition

This is a subsequent milestone on a shipped product. MVP means minimum to transform the game from "working prototype" into "polished product a parent would recommend."

### Launch With (v1.4 core)

- [ ] **Redesigned game menu** — Replace 1/2/3/daily structure with a clear hub: Play (adaptive session), Practice (per-piece), Daily Puzzle. Large icon tiles, scannable at a glance. Without this the app feels unnavigable. (LOW complexity)
- [ ] **Practice mode with piece picker** — Piece selection screen + infinite single-piece drills using existing adaptive engine. This is the most-requested feature type in kids chess apps and uses already-built infrastructure. (MEDIUM complexity)
- [ ] **Sound effects on correct/wrong** — playSound() calls at correct and wrong answer events across all puzzle types. Audio feedback is expected in every kids app; its absence is conspicuous. (LOW complexity)
- [ ] **Celebration milestones during session** — Mini-confetti or pulse at 3, 5, 10 correct in a row. Low effort, high perceived polish. (LOW complexity)
- [ ] **Piece mastery map** — Display all 6 pieces with current mastery band on menu or practice screen. Makes abstract "progress" concrete and motivating for kids. (MEDIUM complexity)
- [ ] **Checkmate-in-1 puzzles (curated set)** — 20-30 pre-validated mate-in-1 positions. Foundational puzzle type; every chess learning competitor has this. Curated set is lower risk than random generation for v1.4. (HIGH complexity — validation work, not coding complexity)

### Add After Validation (v1.4.x)

- [ ] **Check puzzles** — "Move this piece to put the king in check." Transitional puzzle type between capture and checkmate. Add after verifying mate-in-1 implementation holds up. (HIGH complexity — position generation constraint)
- [ ] **Session summary with per-piece breakdown** — Extend session complete screen to show which pieces were practiced. Low effort once core session tracking is confirmed working. (LOW complexity)
- [ ] **Streak freeze / comeback mechanic** — If session is abandoned mid-puzzle, offer "finish this session" prompt on next visit. Reduces completion drop-off. Defer until data shows where kids abandon. (MEDIUM complexity)

### Future Consideration (v2+)

- [ ] **Checkmate-in-2 puzzles** — For ages 8-9 who have mastered mate-in-1. Requires evidence that v1.4 kids are ready. (HIGH complexity)
- [ ] **"Find the best move" open puzzles** — Adult-style tactical puzzles. Requires age 9+ target; out of scope for current 5-9 range. (HIGH complexity)
- [ ] **Parent progress dashboard** — Summary of session count, pieces mastered, time played. High value for Lepdy's family audience but large UX scope. (HIGH complexity)
- [ ] **Timed challenge mode** — Optional speed mode for ages 8+ who want Puzzle Rush-style play. Opt-in only, never default. (MEDIUM complexity)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Redesigned game menu | HIGH | LOW | P1 |
| Sound effects correct/wrong | HIGH | LOW | P1 |
| Piece mastery map | HIGH | MEDIUM | P1 |
| Practice mode with piece picker | HIGH | MEDIUM | P1 |
| Celebration milestones during session | MEDIUM | LOW | P1 |
| Checkmate-in-1 puzzles (curated) | HIGH | HIGH | P1 |
| Session summary per-piece breakdown | MEDIUM | LOW | P2 |
| Check puzzles | MEDIUM | HIGH | P2 |
| Streak freeze / comeback mechanic | LOW | MEDIUM | P3 |
| Checkmate-in-2 puzzles | LOW | HIGH | P3 |
| Parent progress dashboard | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Required to deliver v1.4 "polished product" goal
- P2: Meaningful add-on after P1 features are working
- P3: Future consideration, defer to v2+

---

## Competitor Feature Analysis

| Feature | ChessKid | ChessMatec (ChessWorld) | Magnus Trainer | Our v1.4 Approach |
|---------|----------|------------------------|----------------|-------------------|
| Game menu structure | Bottom nav + content feed | Course grid (8 courses) | Home with mode tiles | 3-4 large icon tiles: Play / Practice / Daily; no bottom nav (tablet-first) |
| Per-piece practice | Structured lessons per piece (not free-drill) | Adventure stages by concept | No per-piece isolation | Free-drill mode with piece picker; inherits adaptive difficulty engine |
| Check puzzles | Taught in lessons, no dedicated puzzle type | Used in animated demonstrations | Not highlighted | Dedicated "check the king" puzzle type after movement + capture |
| Checkmate-in-1 | Yes, central to puzzle library | Yes, in later stages | Yes, core puzzle type | Curated 20-30 validated positions; same board component as existing puzzles |
| Sound effects | Full audio: move sounds, correct, wrong | Animated + audio feedback | Move sounds, achievement sounds | Correct sound, wrong sound, milestone chime; existing infrastructure |
| Mastery visualization | Named level labels per topic | Stars per stage cleared | XP bar | 6-piece mastery grid with band labels (Beginner/Intermediate/Expert) |
| Session celebration | Star rating at end | Stars per stage | Achievement badges | Stars + confetti already on session complete; add mid-session milestone confetti |
| Language learning | English only | 13 languages, not integrated | English only | Hebrew piece names on every screen — fully integrated differentiator |

---

## Implementation Guidance for Roadmap

**Game menu design constraints (ages 5-9):**
- Maximum 4 choices visible without scrolling
- Each option needs an icon, not just text
- Button minimum 60px height on mobile, 80px on tablet
- 3-option layout (Play / Practice / Daily) fits cleanly within Lepdy's existing card grid pattern

**Practice mode integration (low-effort reuse):**
```typescript
// Existing session hook — add pieceFilter param
usePuzzleSession({ pieceFilter: 'n' }) // Only knight puzzles
// Remove 10-puzzle limit when pieceFilter is set
// Inherit same adaptive difficulty engine — no rebuild needed
```

**Mate-in-1 validation approach:**
```typescript
import { Chess } from 'chess.js';
function isCheckmate(fen: string, move: string): boolean {
  const chess = new Chess(fen);
  chess.move(move);
  return chess.isCheckmate();
}
// Use during content creation to validate curated positions, not at runtime
```

**Sound effect integration (existing infrastructure):**
```typescript
// Add to AudioSounds enum in utils/audio.ts
CHESS_CORRECT = 'chess-correct',
CHESS_WRONG = 'chess-wrong',
CHESS_MILESTONE = 'chess-milestone',
// Call at correct/wrong answer events in puzzle components
playSound(AudioSounds.CHESS_CORRECT);
```

**Mastery map data shape (existing data, new display):**
```typescript
// useChessProgress already tracks perPieceTier — read it
const { perPieceTier } = useChessProgress();
// Map tier (0/1/2) to band label ('Beginner'/'Intermediate'/'Expert')
// Render 6-piece grid: piece SVG + Hebrew name + band label
```

---

## Sources

- [ChessKid App Store Review](https://apps.apple.com/us/app/chess-for-kids-learn-to-play/id629375826) — piece-by-piece lesson structure, sound feedback, celebration patterns
- [ChessMatec / ChessWorld App](https://www.chessworld.io/learn-chess-app) — 2000+ challenges, course grid menu, animated check demonstrations
- [Best Chess Teaching Apps 2026 — Wise.live](https://www.wise.live/blog/best-chess-teaching-apps/) — current category analysis, feature benchmarks
- [Best Chess Apps for Kids — Educational App Store](https://www.educationalappstore.com/best-apps/best-chess-apps-for-kids) — category feature expectations
- [Designing for Kids: UX Tips — Ungrammary](https://www.ungrammary.com/post/designing-for-kids-ux-design-tips-for-children-apps) — button sizing, menu depth, touch target standards
- [UX Design for Children — AufaitUX](https://www.aufaitux.com/blog/ui-ux-designing-for-children/) — 60-80px icons, 3-5 choices per screen, age-appropriate navigation
- [Streaks for Gamification — Plotline](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps/) — 40-60% higher DAU combining streaks + milestones; 2.3x return at 7-day streak
- [Top 7 Gamified Learning Apps with Progress Tracking — QuizCat](https://www.quizcat.ai/blog/top-7-gamified-learning-apps-with-progress-tracking) — mastery-gated progression, visible progress patterns
- [Mate in 1 move puzzles for kids — Korpalski Chess](https://korpalskichess.com/?page_id=61630) — mate-in-1 as foundational kids puzzle type
- [How to Find the Best Move — Chess.com](https://www.chess.com/forum/view/chess-lessons/how-to-find-the-best-move-in-chess) — "find the best move" is adult/intermediate content, not suitable for ages 5-9

---
*Feature research for: Lepdy Chess v1.4 Complete Puzzle Experience*
*Researched: 2026-03-23*
