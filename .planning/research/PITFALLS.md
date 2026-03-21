# Domain Pitfalls

**Domain:** Kids chess learning game (ages 5-9) integrated into Next.js Hebrew learning app
**Project:** Lepdy Chess
**Researched:** 2026-03-21

---

## Critical Pitfalls

Mistakes that cause rewrites, abandoned sessions, or broken UX at the foundation level.

---

### Pitfall 1: react-chessboard SSR Hydration Crash in Next.js App Router

**What goes wrong:** react-chessboard uses react-dnd internally and accesses browser APIs during initialization. In Next.js App Router, importing it without `'use client'` or without dynamic import with `{ ssr: false }` causes hydration mismatch errors or outright crashes. The chessboard renders on the server, then client hydration sees a different DOM, causing React to throw.

**Why it happens:** react-chessboard is a pure client-side library — it needs the DOM, window, and event listeners. The App Router renders server components by default. The project already follows a `page.tsx` (server) + `*Content.tsx` (client) split, but even within the client component the board component itself may need to be loaded dynamically to avoid SSR.

**Consequences:** White screen or hydration error on first load. Can be subtle in dev (StrictMode double-render) and catastrophic in prod.

**Prevention:**
- Import the chessboard component via `next/dynamic` with `{ ssr: false }` inside the client Content component.
- The `ChessBoardGame.tsx` component file should carry `'use client'` at the top.
- Wrap with `ChessBoardDndProvider` (included in the library) — do not install a separate react-dnd version as it will cause a version conflict.

**Detection:** Hydration error in browser console on first load. StrictMode double-invoke exposing the state sync bug (see Pitfall 2).

**Phase:** Phase implementing the board rendering.

---

### Pitfall 2: Dual State Sources Causing Board Position Flicker/Reset

**What goes wrong:** Keeping a `chess.js` Chess instance and a separate `position` state string causes them to desync. The board shows the correct position, then immediately snaps back to a previous state. This is a confirmed bug pattern in react-chessboard (issue #119).

**Why it happens:** React re-renders can fire state updates in sequence — the Chess instance updates first, then the position string lags one render behind. React.StrictMode's double-invocation makes this happen in dev even when it wouldn't in prod.

**Consequences:** Puzzle positions don't persist. Kids see a piece move, then watch it snap back. Catastrophic for a puzzle-based learning game.

**Prevention:**
- Single source of truth: `const [game, setGame] = useState(new Chess())`.
- Pass `game.fen()` directly as the board position prop — no separate position state.
- Update state by creating a new Chess instance and calling `setGame(new Chess(gameCopy))` — never mutate the Chess instance directly.

**Detection:** Board snaps back to previous position after a valid move. Only happens intermittently in dev (StrictMode), consistently in prod once puzzle state gets more complex.

**Phase:** Phase implementing puzzle logic and piece interaction.

---

### Pitfall 3: 8x8 Board Squares Are Too Small for Tablet Tap Accuracy at Ages 5-9

**What goes wrong:** A standard 8x8 board filling a mobile/tablet viewport gives each square approximately 40-48px. Children aged 5-7 have significantly lower motor precision than adults. Chess.com users on touch devices report needing to tap "dead center" multiple times before a piece registers. For young children, this is not a UX annoyance — it is a session-ending frustration.

**Why it happens:** A responsive board that simply fills available width distributes space evenly across 64 squares, producing small squares. CSS `touch-action`, click vs. drag interaction modes, and no tap-tolerance padding compound the issue.

**Consequences:** Kids give up before completing a single puzzle. Parents uninstall. The game never gets a chance to teach chess.

**Prevention:**
- Constrain the board to a minimum 56px per square (448px total board width minimum on mobile).
- Use tap-to-select then tap-to-place interaction (not drag-and-drop) for touch devices — react-chessboard supports this via the `onSquareClick` prop alongside `onPieceDrop`.
- On tablets (primary device per project constraints), aim for 60-70px squares.
- Test on actual iPad and Android tablet, not just browser devtools resize.

**Detection:** Testing on a real device with ages 5-8 children. Early warning: any puzzle where kids must select a specific square and miss on first tap more than 50% of the time.

**Phase:** Phase implementing board UI and mobile layout.

---

### Pitfall 4: RTL Layout Breaking Chess Board Orientation

**What goes wrong:** Hebrew is the default locale and uses RTL direction. Applying `direction: rtl` to the page or a parent container can mirror the chess board coordinates — columns appear reversed, or rank/file labels render backwards. This makes the board look wrong and confuses kids who later see a physical chess board.

**Why it happens:** CSS `direction: rtl` applied at a high level propagates into all children including absolutely positioned board squares. react-chessboard renders the board with internal CSS that is not RTL-aware by design. MUI's RTL theming (which Lepdy already uses) applies direction globally.

**Consequences:** Board is visually mirrored in Hebrew locale. File a on the left becomes file h on the left. Piece movement appears wrong. Lessons learned in Hebrew don't transfer to real-board play.

**Prevention:**
- Wrap the chessboard component in a container with explicit `direction: ltr` — chess notation is language-agnostic and always LTR.
- The board itself, coordinate labels, and piece interaction zone must all be inside this LTR wrapper.
- Only text around the board (instructions, piece names in Hebrew) should inherit RTL from the page.

**Detection:** Render the board in Hebrew locale and verify file 'a' is on the left (white's queenside) and rank 1 is at the bottom.

**Phase:** Phase implementing board rendering, verified during i18n integration.

---

## Moderate Pitfalls

---

### Pitfall 5: Cognitive Overload from All-Pieces-at-Once Level Design

**What goes wrong:** Displaying the full board (all 16 pieces per side) when teaching piece movements overwhelms children. Research confirms that unstructured, all-at-once instruction causes frustration and makes chess "feel like homework." Young children need single-concept focus per session.

**Why it happens:** Developers think "real chess uses a full board" so they start with a full board even in learning mode. The PROJECT.md correctly notes a full 8x8 board but doesn't specify how many pieces are on it during lessons.

**Consequences:** Level 2 movement puzzles become impossible for ages 5-6. Kids cannot identify which piece to tap among 32 pieces on a crowded board.

**Prevention:**
- Level 1 (learn pieces): Single piece on an empty board, centered.
- Level 2 (movement): One piece at the center, empty board, legal move squares highlighted.
- Level 3 (capture): Introduce one target piece to capture, still mostly empty board.
- Only introduce multiple pieces once each piece's movement is established individually.

**Detection:** A child cannot identify the piece being discussed within 3 seconds = too much visual noise on the board.

**Phase:** Phase designing puzzle content and level structure.

---

### Pitfall 6: Audio Pronunciation Never Playing or Clashing with Game Sounds

**What goes wrong:** Hebrew piece name audio fails to play because it is triggered simultaneously with a game sound effect (correct/wrong move feedback), the previous audio is still playing and there is no queuing system, or autoplay policy blocks audio on first interaction.

**Why it happens:** Lepdy's audio system uses `playAudio()` for category audio and `playSound()` for game effects — these are separate systems that can clash. New audio files in `/public/audio/chess/he/` must match the expected file naming and path conventions. Browsers block audio until a user gesture has occurred on the page.

**Consequences:** Kids never hear Hebrew piece names — the core educational feature of the game fails silently.

**Prevention:**
- Always trigger first audio from a direct user tap/click (not on component mount).
- Queue audio: if a sound is playing, wait for it to finish before playing the next.
- Use the existing `playAudio()` system from `utils/audio.ts` — do not create a separate audio implementation.
- Audio file naming: match the convention in other categories (e.g., `king.mp3`, `queen.mp3`) — check `/public/audio/letters/he/` for reference.
- Record all 6 piece names before starting Level 1 implementation: King, Queen, Rook, Bishop, Knight, Pawn in Hebrew.

**Detection:** Open browser devtools console — autoplay policy errors appear as `DOMException: play() failed because the user didn't interact with the document first`.

**Phase:** Phase implementing piece introduction (Level 1). Audio files needed before this phase begins.

---

### Pitfall 7: Progress Persisting Incorrectly Across Devices / Incognito

**What goes wrong:** Progress saved to localStorage is invisible in incognito mode and unavailable when a child switches from tablet to phone. A child who completes Level 1 in Safari on an iPad starts from scratch in Chrome. In some browsers, localStorage throws in private browsing mode, crashing the progress read/write code.

**Why it happens:** localStorage is device- and browser-specific. The project explicitly chooses local progress (no leaderboard), which is correct for Lepdy's model, but the implementation needs graceful fallback handling.

**Consequences:** Repeated re-completion of already-mastered levels. The progression system appears broken. Parents interpret it as a bug and lose trust.

**Prevention:**
- Wrap all `localStorage.getItem/setItem` calls in try/catch — incognito in some browsers throws on write.
- Fall back to in-memory state when localStorage is unavailable (progress resets on reload, but doesn't crash).
- Make re-doing completed levels frictionless (not punitive) — treat it as "practice mode" rather than failure.
- Use a progress schema that is forwards-compatible: `{ version: 1, completedLevels: string[] }` so adding new levels doesn't corrupt existing saves.

**Detection:** Test in incognito mode — if the page throws a JS error, the localStorage handling is broken.

**Phase:** Phase implementing progression system.

---

### Pitfall 8: Immediate Wrong-Answer Feedback That Punishes and Discourages

**What goes wrong:** Displaying a red X or loud buzzer sound when a child taps the wrong square creates anxiety and shame. Research on chess pedagogy confirms this causes early dropout — children already uncertain about chess rules interpret negative feedback as "I am bad at this."

**Why it happens:** Developers apply standard quiz-game feedback patterns (green check / red X / buzzer). Lepdy's existing games likely have this for older content, but 5-9 year olds respond very differently to negative signals than adults.

**Consequences:** Children abandon sessions after first wrong answer. Parents report the app is "too hard" even when puzzles are objectively simple.

**Prevention:**
- For wrong answers: gentle visual reset (piece returns to origin) with a soft sound — no red X, no buzzer.
- Use encouraging language: "Try again!" not "Wrong!".
- Show a hint highlight (legal move squares) after 2-3 failed attempts rather than failing the puzzle outright.
- Match Lepdy's existing supportive tone — look at how guess-game handles wrong answers for reference.

**Detection:** Watch a 5-6 year old attempt a puzzle for the first time. If they show frustration or hesitate to try again after a wrong answer, the feedback is too harsh.

**Phase:** Phase implementing puzzle interaction and feedback system.

---

## Minor Pitfalls

---

### Pitfall 9: Legal Move Highlighting Not Shown = Kids Have No Idea What to Tap

**What goes wrong:** A movement puzzle asks "where can this Knight move?" but gives no visual guidance on how to interpret the board. Children ages 5-6 have no idea that Knights move in an L-shape. Without highlighted squares, the puzzle is a random-tap exercise, not a learning exercise.

**Prevention:** Always show legal move highlights for the piece in question during Level 2 puzzles. Gradually fade them out (less prominent) as the child progresses through pieces, not off entirely. Highlights are not "cheating" for this age group — they are the teaching mechanism.

**Phase:** Phase implementing movement puzzles (Level 2).

---

### Pitfall 10: Board Not Accessible via Keyboard or Screen Reader

**What goes wrong:** react-chessboard has a stated accessibility roadmap but implementation is incomplete. If a child uses assistive technology, or if an automated accessibility audit runs during QA, the board fails.

**Prevention:** react-chessboard provides some aria labels out of the box — verify they render in the DOM. For the puzzle use-case (not a full chess game), supplement with visible labels on each piece showing its Hebrew name for screen reader users. Do not block deployment over this — but do not strip out the library's default accessibility attributes.

**Phase:** Minor — address after core puzzle mechanics work.

---

### Pitfall 11: Teaching Pawn Promotion, En Passant, and Castling Before Basics

**What goes wrong:** Developers who know chess include all legal moves in the chess.js validation. Pawn promotion prompts, castling, and en passant are legal moves that chess.js will compute — if they appear in Level 2 or 3 puzzles, they will confuse children who have not learned these rules yet.

**Prevention:** Build custom puzzle FEN positions where these special moves cannot occur. Filter out castling (`chess.get()` piece check on rooks/kings) and do not include pawns near the 8th rank in early puzzles. Introduce special moves only if a Level 4+ is added later.

**Phase:** Phase implementing puzzle FEN data design.

---

### Pitfall 12: i18n Translation Keys Missing Causing Fallback English in Hebrew Locale

**What goes wrong:** Adding chess-specific UI text (piece names, level instructions, feedback messages) to `messages/he.json` but forgetting to add the same keys to `messages/en.json` and `messages/ru.json` causes next-intl to throw a missing translation warning, and in strict mode, an error.

**Prevention:** Add all chess translation keys to all three locale files simultaneously. Use a placeholder value (English copy) in `en.json` and `ru.json` immediately — get Russian/English translations polished later.

**Phase:** Relevant to every phase that introduces new UI text.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Board rendering | SSR hydration crash (Pitfall 1) | `next/dynamic` with `ssr: false` from day one |
| Board rendering | RTL flipping board (Pitfall 4) | Explicit `direction: ltr` wrapper on board container |
| Board rendering | Touch targets too small (Pitfall 3) | Enforce 56px minimum square size, test on physical tablet |
| Puzzle logic | State desync board reset (Pitfall 2) | Single `game` state, pass `game.fen()` directly |
| Level 1 (piece intro) | Audio never plays (Pitfall 6) | Record all 6 audio files first; trigger only from user interaction |
| Level 2 (movement) | No highlights = confusion (Pitfall 9) | Always highlight legal squares; they are the lesson |
| Level 2 (movement) | Cognitive overload (Pitfall 5) | Single piece on empty board only |
| Level 2/3 (puzzles) | Special move confusion (Pitfall 11) | Curate FEN positions to exclude castling/en passant/promotion |
| Feedback design | Punishment discourages retry (Pitfall 8) | Soft reset + hint system; no buzzer |
| Progression system | localStorage crash in incognito (Pitfall 7) | try/catch wrapper with in-memory fallback |
| Any phase | Missing i18n keys (Pitfall 12) | Always update all 3 locale files together |

---

## Sources

- [10 Common Mistakes Parents Make While Teaching Chess to Kids - Kingdom of Chess](https://kingdomofchess.com/mistakes-parents-make-while-teaching-chess/)
- [react-chessboard GitHub (Clariity/react-chessboard)](https://github.com/Clariity/react-chessboard)
- [Board resets to previous state despite value of position — react-chessboard issue #119](https://github.com/Clariity/react-chessboard/issues/119)
- [Touch Targets on Touchscreens — Nielsen Norman Group](https://www.nngroup.com/articles/touch-target-size/)
- [Chess.com forum: touch screen response problems](https://www.chess.com/forum/view/help-support/touch-screen-response-problems-new)
- [Next.js hydration error documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [Chess puzzles children cognitive load — Kingdom of Chess](https://kingdomofchess.com/mistakes-parents-make-while-teaching-chess/)
- [Creative UI/UX Design in Chess Applications — chesschest.com](https://chesschest.com/creative-ui-ux-design-in-chess-applications/)
- [Designing for Kids UX — Ungrammary](https://www.ungrammary.com/post/designing-for-kids-ux-design-tips-for-children-apps)
- [Using local storage for high scores and game progress — Gamedev.js](https://gamedevjs.com/articles/using-local-storage-for-high-scores-and-game-progress/)
- [Top 10 Chess Apps and Websites for Kids: 2025 Reviews — Fable Chess](https://www.fablechess.com/post/top-10-chess-apps-and-websites-for-kids-2025-reviews)
