# Feature Landscape: Kids Chess Learning Game

**Domain:** Kids chess learning app (ages 5-9), integrated into existing Hebrew vocabulary app
**Researched:** 2026-03-21
**Reference apps:** ChessKid, ChessKid Adventure, Magnus Kingdom of Chess (Dragonbox), ChessWorld (Alterman), Chess Academy for Kids

---

## Table Stakes

Features users (parents + kids) expect. Missing = app feels broken or too hard to use.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visual piece movement highlighting | Every kids chess app does this — tapping a piece shows where it can move with dots or highlights | Low | Core to learning; without it kids are lost |
| Correct answer celebration (animation + sound) | Immediate positive feedback is universal in kids edtech — Duolingo, Khan Kids, ChessKid all do it | Low | Stars, sparkles, cheerful sound at minimum |
| Gentle wrong answer handling | Harsh failure screens cause kids to quit; standard practice is "try again" with hint, not punishment | Low | No buzzer sounds, no score penalty shown prominently |
| Progressive level lock — unlock by completing previous | ChessKid, ChessWorld, Magnus all gate later content on earlier completion | Low | Prevents overwhelm, creates sense of accomplishment |
| Each piece introduced individually | All major apps introduce pieces one at a time, not all at once | Low | King → Rook → Bishop → Queen → Knight → Pawn is standard ordering by simplicity |
| Piece name displayed clearly (text + image) | Kids need name reinforcement while learning movement | Low | Text under/over piece icon on any intro screen |
| Large touch targets on board squares | Tablets are primary device; small targets cause frustration and mis-taps on age 5-9 hands | Medium | Board squares must be finger-sized, not click-sized |
| Hint system ("try again" or subtle highlight) | Without hints, young kids get stuck and abandon — every reviewed app has some hint mechanism | Low-Med | Can be as simple as "tap the highlighted squares" nudge after 2 wrong attempts |
| No timer pressure for learning phases | Timed challenges are for advanced play, not piece-learning — pressure is demotivating for ages 5-7 | None | Timers belong in separate challenge modes, not core learning |
| Audio pronunciation of piece names | Lepdy's entire model is audio + text — this is doubly expected here for Hebrew vocabulary reinforcement | Low | Already part of PROJECT.md; audio files needed |
| Progress indicator per piece/level | Kids need to see where they are and what's coming — progress dots, bars, or star counts | Low | Can be a simple row of piece icons with checkmarks |

---

## Differentiators

Features that set this product apart. Not expected, but create memorable value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hebrew piece names as primary vocabulary | No other chess learning app teaches Hebrew chess vocabulary — unique to Lepdy's bilingual mission | Low-Med | Requires audio recordings for all 6 pieces in Hebrew; text display in Hebrew script |
| Hebrew + transliteration + native language display | Show Hebrew text, romanized transliteration, and English/Russian — reduces anxiety for parents unfamiliar with Hebrew | Low | Pure presentation layer, no new logic |
| Movement puzzle framing as a question, not a test | "Where can the rook go?" framed as exploration, not quiz — reduces performance anxiety vs ChessKid's quiz mode | Low | Copy/framing choice, not a technical feature |
| Piece-focused single-piece board (no full board noise) | Start learning each piece on an otherwise empty board — less visual complexity than full 8x8 with all pieces | Low | ChessKid Adventure does narrative wrapping; simpler approach works for this age range |
| Capture puzzle as "save the target" framing | "Help the pawn escape — which piece can block the attacker?" instead of dry "find the capture" | Med | Requires story wrapper but same underlying logic as standard capture puzzle |
| Level completion summary with Hebrew vocabulary recap | After completing a piece's levels, show the Hebrew word, play audio, reinforce learning — bridges chess and Hebrew goals | Low | One summary screen per piece, reuses existing Lepdy card pattern |
| Fits Lepdy visual language (pastel, friendly, familiar) | Kids already know Lepdy; a chess game that looks like the rest of the app creates immediate comfort vs alien UI | Low | Design constraint, not a feature — but a real differentiator vs launching a standalone chess app |

---

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full chess game (AI opponent) | Requires legal move generation, check detection, AI engine — enormous scope; not aligned with "fundamentals" goal | Stop at capture puzzles; "ready to play" is the graduation, not "plays against AI" |
| Time-based challenges for piece learning | Pressure is demotivating for ages 5-7 learning new concepts — ChessKid separates speed from learning | Keep time challenges entirely out of learning phases; could revisit in a future speed-challenge variant |
| ELO / competitive rating | ChessKid has this for games; Lepdy's own PROJECT.md explicitly rules it out — adds social pressure not helpful here | Local progress tracking only (level completed, stars earned) |
| Online multiplayer | ChessKid's safe multiplayer took years to build safely; PROJECT.md out-of-scope | Out of scope |
| Advanced special moves (castling, en passant, promotion) | These confuse beginners; Magnus Kingdom of Chess deliberately excludes them at the intro level | Mention they exist when the full game is reached, but don't teach in fundamentals |
| Free-play full game mode | Not the purpose; adds full rules engine complexity | Link out to ChessKid or real chess if kids want to play a game — or flag as future milestone |
| Custom piece/board themes | PROJECT.md explicitly rules this out; classic board is sufficient | One clean, classic-style board matching Lepdy's palette |
| Parent dashboard / accounts | Lepdy has no accounts; adding authentication is a different product | Use localStorage for progress |
| Complex star/gem economy | ChessKid has stars, gems, coins — this adds meta-game complexity not warranted at Lepdy's scale | Simple visual checkmark or star per level is sufficient |
| Video lessons | High production cost, not mobile-friendly, outside Lepdy's interaction model | Interactive board-based teaching outperforms passive video for this age group |

---

## Feature Dependencies

```
Audio recordings (6 Hebrew piece names) → Level 1 piece introduction screens
Level 1 piece introduction (name + shape) → Level 2 movement puzzles
Level 2 movement puzzles (all 6 pieces) → Level 3 capture puzzles
Valid move logic per piece → both Level 2 and Level 3
Board rendering (8x8, touch-optimized) → all interactive levels
Progress persistence (localStorage) → level lock/unlock system
i18n strings (Hebrew, English, Russian) → all UI text
Hint system → Level 2 and Level 3 (not Level 1)
```

---

## MVP Recommendation

Prioritize exactly:

1. **Classic 8x8 board with piece rendering** — foundation everything else requires
2. **Level 1: Piece introduction (name + Hebrew audio + shape)** — matches Lepdy's learn-a-category pattern exactly; lowest technical risk
3. **Valid move highlighting** — tap a piece, squares light up; core mechanic for Level 2
4. **Level 2: Movement puzzles** — "tap where this piece can move" for each of the 6 pieces
5. **Level 3: Capture puzzles** — "which piece can capture the target?"
6. **Progress persistence** — levels unlock in order, progress saved to localStorage
7. **Celebration + gentle wrong-answer feedback** — table stakes for kid retention

Defer:
- Hebrew vocabulary recap summary screens (nice-to-have, can add in polish pass)
- Capture puzzle narrative framing (can ship as plain puzzle first, wrap later)
- Transliteration display (low effort but can be phase 2 polish)

---

## Research Notes on Hebrew Chess Vocabulary

Hebrew piece names for reference (confirmed from WordReference forums and chess terminology sources):
- King: מלך (melekh)
- Queen: מלכה (malka)
- Rook: צריח (tsariakh) — lit. "spire/tower"
- Bishop: רץ (rats) — lit. "runner"
- Knight: פרש (parash) — lit. "horseman"
- Pawn: חייל (khayal) — lit. "soldier" (also רגלי ragli)

Audio files will need to be recorded by a native Hebrew speaker. This is a hard dependency for Level 1 and should be identified as a production blocker early in planning.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes features | HIGH | Consistent across ChessKid, Magnus, ChessWorld — well-documented |
| Hebrew vocabulary | MEDIUM | Chess piece Hebrew names from WordReference forum, not verified against official Israeli chess federation terminology |
| Anti-features | HIGH | Supported by PROJECT.md requirements, standard kids edtech UX research, and multiple app reviews |
| Differentiators | MEDIUM | Reasoning sound; uniqueness claims based on absence of evidence (no Hebrew chess app found), not confirmed absence |
| UX interaction patterns (highlight, feedback) | HIGH | Confirmed across multiple apps and UX resources |

---

## Sources

- [ChessKid App — ChessKid.com](https://www.chesskid.com/app)
- [ChessKid Adventure Launch — ChessKid.com](https://www.chesskid.com/learn/articles/chesskid-adventure-launch)
- [Magnus Kingdom of Chess review — Dad Suggests](https://www.dadsuggests.com/home/2018/8/5/magnus-kingdom-of-chess-teach-your-kids-the-basics-of-chess)
- [ChessWorld Kids Learning Game — Google Play](https://play.google.com/store/apps/details?id=com.altermanchess.AltermanChessEdu&hl=en)
- [Chess Academy for Kids — Common Sense Media](https://www.commonsensemedia.org/app-reviews/chess-academy-for-kids-by-geek-kids)
- [ChessKid Stars and Gems Guide — ChessKid.com](https://www.chesskid.com/learn/articles/parents-guide-chesskid-stars-and-gems)
- [Best Chess Apps for Kids — Educational App Store](https://www.educationalappstore.com/best-apps/best-chess-apps-for-kids)
- [Top 10 Chess Apps for Kids 2025 — Fable Chess](https://www.fablechess.com/post/top-10-chess-apps-and-websites-for-kids-2025-reviews)
- [Chess piece names in Hebrew — WordReference Forums](https://forum.wordreference.com/threads/chess-pieces.158183/)
- [Creative UI/UX in Chess Applications — ChessChest](https://chesschest.com/creative-ui-ux-design-in-chess-applications/)
