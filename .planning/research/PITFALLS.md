# Pitfalls Research

**Domain:** Adding practice modes, new puzzle types (check/checkmate-in-1), menu redesign, and engagement features to an existing kids chess learning app (ages 5-9) — v1.4 Complete Puzzle Experience
**Researched:** 2026-03-23
**Confidence:** HIGH (direct codebase analysis of existing v1.3 system, chess.js constraints, MUI/RTL patterns, kids' educational game design)

---

## Critical Pitfalls

### Pitfall 1: Practice Mode Bypasses usePuzzleSession Contract, Creating Parallel State

**What goes wrong:**
Practice mode ("pick a piece, drill puzzles for it") is added as a new view in `ChessGameContent` with its own puzzle selection logic outside of `usePuzzleSession`. Progress recorded during practice does not flow through `recordCorrect`/`recordWrong` in `usePuzzleProgress`, so practice answers never advance or de-escalate the adaptive tier. The per-piece tier displayed on `SessionCompleteScreen` becomes stale relative to what the child actually practiced. Alternatively, teams wire practice directly to `usePuzzleSession` and accidentally count practice puzzles toward the 10-puzzle session, triggering a premature session-complete screen mid-practice.

**Why it happens:**
`usePuzzleSession` builds a 10-puzzle queue (`buildSessionQueue`) with interleaved movement and capture puzzles across all 5 pieces. This is the "mixed session" contract. A per-piece drill doesn't fit this queue shape — you need a different selection strategy that filters by `pieceId`. The natural instinct is to either: (a) create a totally separate parallel progress hook, or (b) reuse the session hook but override its queue logic — both routes create divergence.

**How to avoid:**
- Practice mode should call `recordCorrect`/`recordWrong` from `usePuzzleProgress` directly (not through `usePuzzleSession`). This keeps adaptive difficulty synchronized.
- Practice mode needs its own queue builder — a `buildPracticeQueue(pieceId, tier)` function that filters puzzles by `pieceId` and selects from the correct tier. Extract this logic as a util function.
- Practice sessions should NOT use the `SESSION_STORAGE_KEY` or `SESSION_SIZE=10` constants. Use a separate `PRACTICE_STORAGE_KEY` (or no persistence at all, since practice is casual).
- Progress display on `SessionCompleteScreen` continues to work correctly because it reads from `usePuzzleProgress` state, not from the session.

**Warning signs:**
- Piece tier does not change after drilling 5+ correct answers in practice mode
- Practice session triggers `isSessionComplete` after 10 puzzles and shows the SessionCompleteScreen
- Practice exit shows stale mastery bands that don't reflect drilling

**Phase to address:** Practice mode phase. Define the data contract (which hook owns what) before any UI for practice is written.

---

### Pitfall 2: Check/Checkmate Puzzles Require a Different Puzzle Schema but Existing Components Assume MovementPuzzle or CapturePuzzle

**What goes wrong:**
`MovementPuzzle.tsx` and `CapturePuzzle.tsx` both accept their typed puzzle data as a prop (`puzzle: MovementPuzzleData` / `puzzle: CapturePuzzleData`). Check puzzles ask "is the king in check?" — a boolean evaluation, not a tap-a-target interaction. Checkmate-in-1 asks the child to execute a winning move — closer to movement but requires verifying legality via chess.js. Teams try to shoehorn these into the `MovementPuzzle` shape (reuse the component, add a new flag prop like `isCheckPuzzle`) and end up with increasingly conditional render logic that makes the component unmaintainable.

**Why it happens:**
The existing components are clean and focused. The temptation is to add an `if (isCheckPuzzle)` branch rather than create a third component, since the board rendering code is identical. But the interaction model and feedback logic differ enough that branching multiplies bugs.

**How to avoid:**
- Define a new `CheckPuzzle` interface and `CheckmatePuzzle` interface in `chessPuzzles.ts` alongside the existing `MovementPuzzle` and `CapturePuzzle` types.
- Create `CheckPuzzle.tsx` and `CheckmatePuzzle.tsx` as separate components following the existing component contract (`puzzle`, `onAnswer`, `onExit` props). Board rendering code can be extracted to a shared `ChessBoardDisplay` component to avoid duplication.
- Extend the `SessionPuzzle` discriminated union in `usePuzzleSession.ts` with `type: 'check'` and `type: 'checkmate'` to keep the session routing exhaustive.
- Checkmate-in-1 validation: use `chess.js` to verify the child's tap is the correct mating move. `chess.load(fen)`, apply the move, then call `chess.isCheckmate()`.

**Warning signs:**
- `MovementPuzzle.tsx` has more than 2 conditional blocks keyed on a `puzzleType` prop
- `CapturePuzzle.tsx` grows a new boolean prop that changes core interaction behavior
- TypeScript type assertions (`as MovementPuzzle`) used to fit a check puzzle into an existing type

**Phase to address:** New puzzle types phase. Define schemas and components before wiring to session.

---

### Pitfall 3: Menu Redesign Breaks the ChessView State Machine and Leaves Orphan Views

**What goes wrong:**
The current `ChessView` type is `'map' | 'level-1' | 'session' | 'daily'`. A redesigned menu adds entries for practice mode, piece-specific practice, check puzzles, and possibly a progress screen. Teams add new values to `ChessView` inline, but `ChessGameContent` uses an if-chain (`if (currentView === 'level-1')`) not a switch. New views added to the union are silently unhandled and fall through to the map render — the child taps "Practice" and the menu reappears with no feedback.

**Why it happens:**
TypeScript discriminated union exhaustiveness is not enforced in if-chains the way it is in `switch` + `default: assertNever(x)`. The current component has 4 if-blocks returning early, then a final map render. A fifth view falls through silently. This is a pre-existing structural fragility.

**How to avoid:**
- When redesigning the menu, refactor `ChessView` handling to use a `switch` with an `assertNever` fallback so TypeScript flags unhandled states at compile time.
- Or, if staying with if-chains, add an explicit `else` block that renders an error indicator (or at least `console.error`) for unknown views.
- New view values (`'practice'`, `'practice-piece'`, `'check-session'`) must be added to the `ChessView` type AND handled in the routing logic before any component that navigates to them is written.

**Warning signs:**
- Tapping a new menu entry silently returns the child to the map
- TypeScript does not error on unhandled `ChessView` values despite the value existing in the union
- New "view" is a new component that sets `currentView` but `ChessGameContent` has no branch for it

**Phase to address:** Menu redesign phase, as the first structural change before any new feature is added.

---

### Pitfall 4: Per-Piece Progress Screen Reads Stale Data Because usePuzzleProgress Is Not a Context Provider

**What goes wrong:**
A new "progress screen" or "mastery overview" is added to the menu. It imports `usePuzzleProgress` to display tier badges per piece. But `usePuzzleProgress` is a standalone hook — each component that calls it gets its own `useState` + localStorage load cycle. The progress screen and the active puzzle session each hold their own copy of the data, and they can diverge during a session (one sees tier 2, the other sees tier 1 because the puzzle session's recordCorrect has written tier 2 to localStorage but the progress screen's state hasn't been reloaded).

**Why it happens:**
The hook was intentionally designed as standalone (noted in Key Decisions: "Single useChessProgress hook (no context provider)"). This works when only `usePuzzleSession` consumes `usePuzzleProgress`. Adding a second consumer (a mastery display component) creates two independent state machines reading and writing the same localStorage key.

**How to avoid:**
- If a mastery/progress screen is added as a separate view, it should read from the same `usePuzzleProgress` instance as the session. The cleanest solution is to lift `usePuzzleProgress` into `ChessGameContent` and pass `data.pieces` as a prop to the mastery display — no second hook instantiation.
- Do NOT wrap `usePuzzleProgress` in a context just for the mastery screen. The existing design is correct; the mastery screen should be a child that receives data as props.
- The `SessionCompleteScreen` already follows this pattern correctly (receives `currentTiersByPiece` as a prop from `ChessGameContent`).

**Warning signs:**
- Mastery screen shows tier 1 for a piece that was just drilled to tier 2
- Two components both logging `[chess] Failed to save puzzle progress` on the same action
- `usePuzzleProgress` called in more than one component in the chess subtree

**Phase to address:** Progress and engagement phase, when mastery visualization is added.

---

### Pitfall 5: Check/Checkmate Puzzle FEN Validity — chess.js Requires Full FEN, Not Piece-Placement FEN

**What goes wrong:**
All 95 existing puzzles use piece-placement FEN (e.g., `'8/8/8/8/4R3/8/8/8'`) — 8 rank segments separated by `/` without side-to-move, castling rights, or en passant. `react-chessboard` accepts this format. But chess.js `chess.load()` requires full FEN (e.g., `'8/8/8/8/4R3/8/8/8 w - - 0 1'`). Check and checkmate puzzles need chess.js to evaluate position legality (`chess.isCheck()`, `chess.isCheckmate()`, `chess.moves()`). Passing a piece-placement FEN to `chess.load()` silently loads an empty/invalid board in some chess.js versions, causing `isCheckmate()` to always return false.

**Why it happens:**
Teams copy the existing puzzle FEN format (piece-placement) when authoring check/checkmate puzzles, not realizing chess.js has a stricter FEN requirement. The existing `moveFenPiece` utility in `utils/chessFen.ts` works with piece-placement FEN, so the format looks consistent and correct.

**How to avoid:**
- For check and checkmate puzzle types, store full FEN (with side-to-move, castling, en passant) in the puzzle data.
- Write a validation step that calls `chess.load(fullFen)` and asserts `chess.isCheck()` or `chess.isCheckmate()` returns the expected value for each authored puzzle.
- Keep `react-chessboard` receiving only the position portion (or convert full FEN to piece-placement FEN for board display, keep full FEN for chess.js evaluation).
- Do NOT use the `utils/chessFen.ts` FEN manipulation utilities for these new puzzle types — those utilities strip position-only segments and are not designed for full FEN.

**Warning signs:**
- `chess.isCheckmate()` always returns false for authored checkmate positions
- `chess.moves()` returns empty array on a board that visually has legal moves
- Board renders correctly but chess.js evaluation functions behave unexpectedly

**Phase to address:** New puzzle types phase, before any check/checkmate puzzle data is authored.

---

### Pitfall 6: Animation and Sound Layering Causes Cumulative Confetti on Fast Interactions

**What goes wrong:**
Visual polish adds additional `Confetti` instances for milestone moments (5 correct in a row, session complete, tier advance). The existing code already mounts a per-puzzle confetti burst in both `MovementPuzzle.tsx` and `CapturePuzzle.tsx`. If a child taps rapidly through multiple correct answers, each correct answer mounts a new `Confetti` with `recycle={false}`. On low-end tablets (the primary device for ages 5-9), 3-4 concurrent confetti instances cause visible frame drops.

The same layering problem applies to sound effects: the existing `playRandomCelebration()` is called on every correct tap. Additional celebration sounds for milestones can overlap with per-puzzle sounds, creating audio cacophony.

**Why it happens:**
Each puzzle component manages its own confetti state independently (`showCorrectConfetti` local state). Visual polish features add more celebration triggers at the session level (in `ChessGameContent` or `SessionCompleteScreen`). The two systems don't coordinate.

**How to avoid:**
- Implement a celebration coordinator: a lightweight singleton (or a simple `useRef` flag) that prevents more than one confetti instance from being active at once. If a milestone confetti fires, skip the per-puzzle confetti for that answer.
- For audio: classify sounds as "per-puzzle" (low priority) vs. "milestone" (high priority). If a milestone sound fires, it should preempt the per-puzzle sound, not layer on top.
- Limit confetti `numberOfPieces` as difficulty decreases on smaller screens — use `boardWidth` breakpoints already computed in each puzzle component.
- Test on a mid-range Android tablet, not a development machine.

**Warning signs:**
- Confetti visibly stutters or drops to below 30fps during a correct-answer streak
- Multiple audio tracks playing simultaneously (celebration + milestone sound)
- `Confetti` components visible in React DevTools multiple levels of nesting

**Phase to address:** Visual polish phase. Establish the celebration coordinator pattern before adding any new confetti or sound triggers.

---

### Pitfall 7: i18n Translation Keys for New Features Added Inconsistently Across Three Locales

**What goes wrong:**
New features (practice mode, check puzzles, progress screen) add new translation keys to `messages/en.json` but developers either forget to add them to `messages/he.json` and `messages/ru.json`, or add them with placeholder values that ship to production. `next-intl` throws at runtime if a key is missing (in strict mode) or silently falls back, depending on configuration. Hebrew (the primary user locale and RTL) missing a key for the menu redesign means the main user base sees broken UI.

A subtler version: new keys are added under the correct `chessGame` namespace in English but placed under a different namespace in Hebrew/Russian due to copy-paste drift, causing the fallback to the wrong string or a type error in `useTranslations('chessGame')`.

**Why it happens:**
Three JSON files must be kept in sync manually. The existing chess game already has over 30 keys under `chessGame`. With practice mode + new puzzle types + progress screen, this grows significantly. Developers add keys as they code, often forgetting to update all three locale files simultaneously.

**How to avoid:**
- Update all three locale files (`he.json`, `en.json`, `ru.json`) in the same commit that introduces a new translation key. Never add a key to only one locale.
- Hebrew strings for new chess features need care: Hebrew has grammatical gender agreement (piece names are grammatically masculine/feminine), and RTL layout means button placement in instruction strings may need reordering.
- For check/checkmate instruction text in Hebrew, the key phrase "is the king in check?" should be authored by a native speaker — do not machine-translate.
- Add a lint step (or at least a manual check) that verifies the key count under `chessGame` is identical across all three locale files before each phase ships.

**Warning signs:**
- `next-intl` console warnings about missing keys in he.json or ru.json
- Hebrew UI shows English text inline (fallback to English key)
- RTL layout breaks because an instruction string includes inline pieces that need direction override

**Phase to address:** Every phase that adds user-visible text. Treat locale synchronization as a per-phase acceptance criterion.

---

### Pitfall 8: Practice Mode "Pick a Piece" Screen Introduces Stateful Navigation That Conflicts with Existing ChessView Back-Button Behavior

**What goes wrong:**
Practice mode requires a two-step navigation: (1) "Practice" entry on the menu → (2) piece picker → (3) puzzle drill. The existing `ChessView` state machine is flat (`map` → `session` or `map` → `daily`). Adding nested navigation to select a piece before entering the drill requires either: (a) a sub-view within the practice state (adding state variables inside `ChessGameContent` like `selectedPracticepiece`), or (b) additional `ChessView` values (`'practice-picker'`, `'practice-drill'`). Teams choose (a) and leave the "Back" button wired to `onExit={() => setCurrentView('map')}` which skips the picker — pressing Back during a drill goes to the map instead of the piece picker.

**Why it happens:**
The existing exit pattern in `MovementPuzzle.tsx` and `CapturePuzzle.tsx` calls `onExit` which always navigates to `'map'`. This is correct for session mode. Practice mode needs a different back destination. But both puzzle components currently receive `onExit: () => void` with no context about where "back" leads.

**How to avoid:**
- Use separate `ChessView` values for practice navigation states: `'practice'` (the picker) and `'practice-drill'` (the active puzzle). This makes the back-navigation logic explicit in `ChessGameContent`'s routing.
- The `onExit` prop passed to puzzle components during practice should navigate to `'practice'` (the picker), not `'map'`.
- Never encode back-destination logic inside `MovementPuzzle.tsx` or `CapturePuzzle.tsx` — they receive `onExit` as a prop and call it. The correct destination is the caller's responsibility.

**Warning signs:**
- "Back" in a practice drill skips the piece picker and returns to the main menu
- `currentView === 'practice'` path has a nested `if (selectedPiece)` branch rendering a drill view
- `MovementPuzzle.tsx` imports or references `ChessView` — this should never happen

**Phase to address:** Practice mode phase, when the navigation structure is first designed.

---

### Pitfall 9: Progress/Engagement Features Add Visible Mastery Meters That Kids Can Game by Rapid Wrong-Answer Cycling

**What goes wrong:**
A mastery progress bar or "Expert" badge visible on the menu motivates kids — but also motivates rapid tapping. A 6-year-old who sees they are 3 correct answers from "Expert" will tap any square rapidly to get there. The tier system (`consecutiveCorrect >= 5 → advance`) already handles this at the session level, but a prominently displayed "X more correct answers to Expert!" meter creates explicit goal-setting that encourages careless tapping rather than thoughtful play.

A related failure: if the mastery display shows a visible count toward the next tier, kids will notice the bar not filling when they answer wrong, making wrong answers feel more punishing than intended. Ages 5-7 do not handle visible failure signals well.

**Why it happens:**
Progress meters are the standard engagement mechanic in mobile/learning apps. The team adds them without considering the incentive structure specific to chess puzzle play with young children.

**How to avoid:**
- Show mastery level (Beginner/Intermediate/Expert) as a state, not a progress bar toward the next level. Kids see "You are Intermediate" not "3 more to Expert."
- Do not display the consecutive-correct counter or how many answers are needed to advance. The tier advancement message ("Getting harder!") on `SessionCompleteScreen` is sufficient.
- Engagement features should reward completion (played a session today, played 3 days this week) not puzzle-level metrics that encourage gaming.
- Streak is safer than tier progress as a visible metric — it rewards showing up, not rapid tapping.

**Warning signs:**
- Child plays the same piece 50+ times in one sitting without improvement (metric gaming)
- "Getting harder!" badge appears after a session with high wrong-answer count (tier advanced despite poor accuracy because consecutive-correct reset correctly)
- Parent complains the child is "just tapping randomly to get the badge"

**Phase to address:** Progress and engagement phase. Design constraint: visible metrics must reward showing up, not raw puzzle volume.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding `puzzleType: 'check'` flag to existing `MovementPuzzle` type | No new type, no new component | MovementPuzzle grows unbounded conditional logic; breaks discriminated union exhaustiveness for session routing | Never |
| Reusing `SESSION_STORAGE_KEY` for practice sessions | One storage key, simpler code | Practice session persists as a mixed session; re-entering the game after practice tries to restore a practice queue as a regular session | Never |
| Hardcoding practice piece selection as a local `useState` inside `ChessGameContent` | No ChessView changes needed | Back navigation goes to wrong destination; selected piece lost on re-mount | Acceptable only for a demo prototype, never shipped |
| Copying MovementPuzzle.tsx into CheckPuzzle.tsx wholesale | Fast to bootstrap | Board render logic diverges; future board changes must be applied N times | Acceptable only as bootstrap — extract `ChessBoardDisplay` shared component in same PR |
| Adding translation keys only to `en.json` during development | Faster iteration | Hebrew users (primary locale) see broken UI or English text | Never in a shipped PR |
| Showing tier advancement count as a progress bar | Strong visual engagement signal | Encourages metric gaming behavior in ages 5-9 | Never for tier-to-tier progress; acceptable for session-level goals only |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| chess.js for check/checkmate evaluation | Pass piece-placement FEN to `chess.load()` | Pass full FEN (`'{position} w - - 0 1'`) for side-to-move to be valid; validate with `chess.validate_fen()` first |
| chess.js `isCheck()` | Call on a freshly constructed `Chess()` without loading a position | Always `chess.load(fullFen)` before calling any evaluation method; default constructor loads starting position |
| react-chessboard v5 `onSquareClick` | Access `square` directly from event — API changed from `(square) =>` to `({ square }) =>` in v5 | Use destructured `({ square })` — existing codebase already correct, maintain this in all new puzzle components |
| `usePuzzleProgress` in new components | Call the hook inside a practice or mastery component directly | Lift the hook to `ChessGameContent` and pass `data.pieces` as a prop; avoid multiple hook instances reading/writing the same key |
| Confetti (react-confetti 6.x) | Mount multiple instances for simultaneous celebrations | One instance at a time with `recycle={false}`; implement a coordinator to prevent layering |
| next-intl `useTranslations` | Add a translation call with a key that does not exist in all three locale files | Add key to `he.json`, `en.json`, `ru.json` in the same commit; TypeScript `t()` call will catch typos at compile time |
| Hebrew RTL in instruction text | String like "Tap the king to check" renders mirrored in RTL — word order may need adjustment | Author Hebrew instruction strings natively, not as translated word-for-word English; test in RTL mode |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Multiple Confetti instances on milestone + per-puzzle events | Frame drops below 30fps on Android tablet during correct-answer streaks | Confetti coordinator: skip per-puzzle confetti when milestone confetti is active | Any session with 3+ consecutive correct answers |
| chess.js `Chess()` instantiated inside render body for check evaluation | New Chess instance on every re-render during animation state changes | Instantiate in `useMemo([puzzleFen])` or `useEffect`; never in render body | Any animation-triggered re-render (e.g., flashSquare state change) |
| Practice mode generates new puzzle on every wrong answer (regenerates from random) | Board resets mid-animation because state change triggers new puzzle selection | Stabilize puzzle reference in `useState` initializer or `useMemo`; only advance to next puzzle on explicit correct answer | First wrong answer during practice |
| Progress screen re-reads localStorage directly on every render | Perceptible flicker/delay when navigating to progress screen | Progress data flows from parent as props (existing pattern in SessionCompleteScreen); never read localStorage in render | Every navigation to progress screen |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Practice mode shows all 6 pieces as options without progressive disclosure | Overwhelms ages 5-7 with choice; they may pick a piece they don't know yet | Only show pieces the child has unlocked/encountered; pawn can be a bonus unlock |
| "Find the best move" puzzle type with no context about what "best" means | Ages 5-9 cannot reason about positional evaluation; this feels arbitrary | Defer "best move" to a future milestone; for v1.4 stick to check and checkmate-in-1 which have clear right/wrong answers |
| Menu redesign removes the level 1/2/3 structure without a transition | Kids who played v1.3 have a mental model of "I'm on level 2" — removing levels disorientation | Redesigned menu should surface the progression state kids already have (pieces learned, sessions played) rather than erasing the old structure |
| Check puzzle feedback says "wrong" without explaining why | "Try again" is sufficient for movement/capture; check requires understanding "the king is attacked" | Check puzzles need a specific wrong-answer explanation — at minimum, a visual indicator (king square highlighted in red) |
| Session mode and practice mode both use `startNewSession` callback | New session resets streak counter; calling it from practice exit inadvertently resets a mid-session streak | Practice mode should NEVER call `startNewSession` — use a separate reset function scoped to practice |
| Daily puzzle can now appear as "already done" if child did it in practice mode (if same puzzle appears) | Daily puzzle's completion state would be incorrect | Daily puzzle has its own `markCompleted` state separate from session/practice; confirm this isolation holds when new puzzle types are added |

---

## "Looks Done But Isn't" Checklist

- [ ] **Practice mode progress wiring:** Correct and wrong answers during practice change the tier in `usePuzzleProgress` — verify by completing 5 practice puzzles for a piece and confirming its tier advances on the next regular session.
- [ ] **ChessView exhaustiveness:** Add a TypeScript `assertNever` or `default: console.error` to the `currentView` routing block so unhandled views are caught at build or runtime.
- [ ] **Check/Checkmate FEN format:** Every check/checkmate puzzle's FEN passes `chess.validate_fen()` and `chess.load()` without errors. Verify `chess.isCheck()` or `chess.isCheckmate()` returns `true` for each authored position.
- [ ] **Back navigation in practice:** Pressing exit during practice drill returns to the piece picker, not the main map. Confirm the `onExit` prop wired in practice drill view navigates to `'practice'`, not `'map'`.
- [ ] **All three locale files updated:** Run a key-count diff between `he.json`, `en.json`, `ru.json` under `chessGame` namespace before every phase merges. Counts must match.
- [ ] **Confetti coordinator:** During a correct-answer streak in a session, confirm only one Confetti instance is mounted at any time. Check in React DevTools.
- [ ] **Mastery display shows level, not counter:** Progress screen shows "Intermediate" not "3/5 to Expert" — verify no progress bar toward next tier is visible to the child.
- [ ] **No usePuzzleProgress called in child components:** Confirm `usePuzzleProgress` is only instantiated in `ChessGameContent` or `usePuzzleSession`. New mastery/practice components receive data as props.
- [ ] **New puzzle types added to SessionPuzzle union:** If check or checkmate puzzles are added to regular sessions, confirm the `SessionPuzzle` discriminated union includes them and the session routing handles them without falling through to null render.
- [ ] **Daily puzzle completion unaffected by practice:** Completing the daily puzzle piece type in practice mode does not mark the daily puzzle as done. Verify `useDailyPuzzle`'s `isCompleted` state is isolated.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Practice answers not recording to usePuzzleProgress | MEDIUM | Wire `recordCorrect`/`recordWrong` directly — no localStorage migration needed, just hook the calls |
| Check puzzle FEN invalid — chess.js evaluation always wrong | HIGH | Replace puzzle data with corrected full FEN; if already shipped, add a Firebase Remote Config flag to hide check puzzles and disable them until fixed |
| New ChessView value silently falls through to map render | LOW | Add the missing `if/else` branch; no data loss, children just saw wrong screen |
| Three locale files out of sync (Hebrew missing keys) | MEDIUM | Add missing keys to he.json and ru.json; ship as a hotfix; Hebrew users see temporary fallback text (English) which is readable but not ideal |
| Confetti layering causes tablet performance issues | LOW | Reduce `numberOfPieces` via feature flag; or disable celebration at the per-puzzle level (keep only session-level confetti) via Remote Config flag |
| Mastery display incentivizes gaming behavior | MEDIUM | Remove progress-toward-tier display; replace with session-level goals (e.g., "play 1 session today") which are harder to game |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Practice mode parallel state | Practice mode phase — define hook contract before UI | Play 5 practice puzzles for one piece; tier advances on next regular session |
| Check/Checkmate wrong schema type | New puzzle types phase — author interfaces before components | Each new puzzle type: `chess.load(fen)` succeeds + evaluation returns expected result |
| ChessView unhandled states | Menu redesign phase — add assertNever on first structural change | TypeScript compilation catches all unhandled ChessView cases |
| usePuzzleProgress multi-instantiation | Progress/engagement phase — prop-drilling contract established | React DevTools shows usePuzzleProgress hook called from only one component |
| Piece-placement FEN passed to chess.js | New puzzle types phase — FEN format defined before any puzzle authored | Automated validation: all check/checkmate puzzle FENs pass chess.validate_fen() |
| Confetti layering | Visual polish phase — celebration coordinator added before any new confetti trigger | Correct-answer streak test: React DevTools shows max 1 Confetti instance |
| i18n desync across locales | Every phase — per-phase acceptance criterion | Key count under chessGame in he.json == en.json == ru.json before phase merges |
| Back navigation destination in practice | Practice mode phase — ChessView routing designed for two-step navigation | Pressing exit in practice drill navigates to piece picker, not main map |
| Visible tier progress encouraging gaming | Progress/engagement phase — design constraint applied before any mastery meter is built | Progress screen shows tier label only, no numeric counter or progress bar toward next tier |
| Daily puzzle isolation from practice | Practice mode phase — verify useDailyPuzzle state is not touched by practice flow | Complete the daily puzzle piece type in practice; daily puzzle still shows as available |

---

## Sources

- Direct codebase analysis: `app/[locale]/games/chess-game/ChessGameContent.tsx`, `MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `SessionCompleteScreen.tsx`, `hooks/usePuzzleSession.ts`, `hooks/usePuzzleProgress.ts`, `hooks/useChessProgress.ts`, `hooks/useDailyPuzzle.ts`, `data/chessPuzzles.ts`
- chess.js FEN requirements: piece-placement vs. full FEN distinction (HIGH confidence — chess.js v1.x API, verified from codebase usage patterns)
- react-chessboard v5 API: `onSquareClick: ({ square }) =>` destructured form already confirmed in existing codebase
- Pattern: Kids' educational game engagement mechanics — tier visibility anti-patterns for ages 5-9 (HIGH confidence — well-documented in educational game design, Duolingo's hearts removal cited in project key decisions)
- Pattern: Discriminated union exhaustiveness in TypeScript if-chains vs. switch statements (HIGH confidence — TypeScript language specification)
- Pattern: MUI + next-intl i18n file drift with multiple locales (MEDIUM confidence — common React i18n failure mode, observed in existing codebase where translation files must be manually kept in sync)

---
*Pitfalls research for: v1.4 Complete Puzzle Experience — practice modes, check/checkmate puzzles, menu redesign, engagement features added to existing kids chess learning app*
*Researched: 2026-03-23*
