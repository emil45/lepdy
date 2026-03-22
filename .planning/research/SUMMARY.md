# Project Research Summary

**Project:** Lepdy Chess v1.4 Complete Puzzle Experience
**Domain:** Kids chess learning game — progressive puzzle experience for ages 5-9
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

Lepdy Chess v1.4 is a polish-and-expand milestone on a shipped product, not a greenfield build. The existing v1.0–v1.3 codebase already provides a solid foundation: 95 curated puzzles, adaptive per-piece difficulty, Hebrew audio, daily puzzles, and session tracking. The research verdict is clear — zero new npm packages are required, and every v1.4 capability can be built using already-installed stack primitives (chess.js 1.4.0, react-chessboard, MUI 7, react-confetti, Emotion, next-intl). This means v1.4 execution risk is primarily architectural correctness, not technology adoption.

The recommended build strategy is to treat v1.4 as five distinct concerns in dependency order: (1) redesigned game menu as the foundation layer that gives all new features a home; (2) practice mode reusing the existing adaptive session engine with a single filter parameter; (3) check and checkmate-in-1 puzzle data authored as curated FEN arrays (not runtime-generated), validated against chess.js offline; (4) visual polish applied as self-contained component enhancements; and (5) progress engagement features surfacing already-tracked mastery data on the new menu. Each concern is small, well-bounded, and can ship incrementally.

The primary risks are architectural rather than technical: practice mode inadvertently creating parallel state with the existing adaptive difficulty system, check/checkmate puzzles using piece-placement FEN instead of full FEN (causing chess.js evaluation failures), the ChessView state machine routing silently swallowing unhandled views, and the three-locale i18n files drifting out of sync. All risks have concrete prevention strategies documented in the research. The central theme across all four research files is "extend existing contracts, do not duplicate them."

## Key Findings

### Recommended Stack

No new dependencies are needed for v1.4. The installed stack fully covers every capability required by the new features. See `.planning/research/STACK.md` for the full capability mapping.

**Core technologies:**
- `chess.js 1.4.0`: `inCheck()`, `isCheckmate()`, `moves()` — covers all new puzzle type validation; tested against installed version at runtime
- `react-chessboard 5.10.0`: Board rendering for new puzzle components; existing API contract already established in codebase
- `@mui/material 7.3.7`: All layout, animation (Fade, Grow, Zoom, Slide, Collapse), and progress UI components already installed
- `@emotion/react 11.14.0`: CSS keyframe animations for micro-rewards; same pattern as existing `utils/celebrations.ts`
- `react-confetti 6.4.0`: Already in production use in the chess game with React 19.2.3 — confirmed compatible
- `next-intl 4.7.0`: New translation keys for new UI sections; no configuration change needed
- `localStorage` custom hooks pattern: All progress persistence via `usePuzzleProgress`, `useChessProgress`, `useDailyPuzzle` — no new storage schema

**What NOT to add:** framer-motion (143 kB; conflicts with existing MUI transitions), Stockfish WASM (500 kB+; not needed for curated FEN puzzles), Lichess puzzle API (network dependency), Zustand/Redux (over-engineering for this hook-based scope).

### Expected Features

See `.planning/research/FEATURES.md` for full competitor analysis and UX sourcing.

**Must have (table stakes — P1):**
- Redesigned game menu — 3-4 large icon tiles; current 1/2/3/daily structure is broken and navigability is below category baseline (ChessKid, Magnus, ChessMatec all have clear top-level hubs)
- Per-piece practice mode with piece picker — "drill the knight" mode; top feature gap vs. ChessKid and Magnus Trainer for the 5-9 age bracket
- Sound effects on correct/wrong answers — every kids app in the category has this; absence is conspicuous
- Piece mastery map — visual display of Beginner/Intermediate/Expert per piece; makes abstract progress concrete for children
- Celebration milestones during session — mini-confetti at 3, 5, 10 consecutive correct; low effort, high perceived polish
- Checkmate-in-1 puzzles (curated set of 20-30) — foundational puzzle type present in every chess learning competitor

**Should have (P2 — add after P1 validates):**
- Session summary with per-piece breakdown — extend existing SessionCompleteScreen; no new data collection required
- Check puzzles ("put the king in check") — fills gap between capture and checkmate; add after mate-in-1 is stable

**Defer (v2+):**
- Checkmate-in-2 puzzles — inappropriate for ages 5-9 cognitive load (working memory constraint)
- Timer pressure / Puzzle Rush mode — cortisol research shows abandonment for beginning learners ages 5-9
- Parent progress dashboard — high value but large UX scope
- "Find the best move" open puzzles — adult tactical content, requires full position evaluation; out of scope

**Anti-features to explicitly avoid:** lives/hearts/energy system (Duolingo removed hearts in May 2025 for exactly this reason), global leaderboards (documented as creating anxiety for ages 5-9), settings menus with many options, timer pressure on puzzles.

### Architecture Approach

v1.4 is a series of additive extensions to the existing `ChessGameContent` state machine — not a redesign. The dominant pattern across all research is "extend existing contracts rather than create parallel systems." The `ChessView` union type grows from 4 to 5-6 values; the `SessionPuzzle` discriminated union grows from 2 to 4 variants; `usePuzzleSession` gains one optional `pieceFilter` parameter. No new architectural layers, no new state management, no new storage schemas. See `.planning/research/ARCHITECTURE.md` for complete component structure, data flow, and build-order dependency graph.

**Major components (changes and additions only):**
1. `ChessMenuScreen.tsx` (new) — replaces inline map JSX in ChessGameContent; owns menu tile layout; reads `usePuzzleProgress` directly for mastery display
2. `PieceSelectorScreen.tsx` (new) — 6-piece grid for practice mode entry; reads `usePuzzleProgress` for per-piece mastery badges
3. `CheckPuzzle.tsx` / `CheckmatePuzzle.tsx` (new) — puzzle renderers following the existing pure-renderer pattern (`puzzle`, `onAnswer`, `onExit` props)
4. `ChessGameContent.tsx` (modified) — extended `ChessView` type, new view branches, `selectedPiece` state for practice navigation
5. `usePuzzleSession.ts` (modified) — add optional `pieceFilter?: ChessPieceId` parameter to `buildSessionQueue`; additive, no breaking change to existing callers
6. `data/chessPuzzles.ts` (modified) — add `checkPuzzles[]` and `checkmatePuzzles[]` arrays using full FEN format (not piece-placement FEN)

**Unchanged and stable (do not touch):** `PieceIntroduction.tsx`, `useChessProgress.ts`, `useChessPieceTheme.ts`, `useDailyPuzzle.ts`, `usePuzzleProgress.ts`, `utils/chessFen.ts`, `utils/puzzleGenerator.ts`, all existing localStorage keys.

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full detail, prevention checklists, and recovery strategies.

1. **Practice mode creates parallel state with adaptive difficulty** — If practice uses its own puzzle selection outside `usePuzzleSession`, tier progress never updates. Prevention: practice calls `recordCorrect`/`recordWrong` from `usePuzzleProgress` directly and uses a separate `buildPracticeQueue` function; never uses `SESSION_STORAGE_KEY` or `SESSION_SIZE=10`.

2. **Check/Checkmate FEN format mismatch** — Existing puzzles use piece-placement FEN (e.g., `'8/8/4R3/8/8'`). chess.js `load()` requires full FEN (e.g., `'8/8/4R3/8/8 w - - 0 1'`). Passing piece-placement FEN causes `isCheckmate()` to silently return false. Prevention: author all check/checkmate puzzles with full FEN; validate each position with `chess.validate_fen()` before committing to the data file.

3. **ChessView state machine silently drops unhandled views** — The current if-chain routing falls through to the map render for any unhandled `ChessView` value. Prevention: add TypeScript `assertNever` or an explicit error branch when extending `ChessView` in the menu redesign phase. This is a structural fix that protects all subsequent phases.

4. **`usePuzzleProgress` multi-instantiation causes state divergence** — A mastery display screen calling the hook independently from the session creates two copies of the same localStorage state that can show different tier values. Prevention: lift `usePuzzleProgress` to `ChessGameContent` and pass `data.pieces` as props to mastery display components; never call the hook in child components.

5. **i18n locale desync** — New translation keys added to `en.json` but missing in `he.json` (the primary user locale, RTL) cause broken UI for the main user base. Prevention: treat locale file synchronization as a per-phase acceptance criterion; key count under `chessGame` must match across all three locale files before any phase merges.

**Bonus pitfall:** Mastery progress bars toward the next tier incentivize rapid tapping in ages 5-7. Display mastery as a named state (Beginner/Intermediate/Expert), not a numeric counter toward the next level.

## Implications for Roadmap

Based on combined research, the dependency-driven phase order from ARCHITECTURE.md maps cleanly to roadmap phases. The research recommends grouping by delivery value rather than strict sequential phases wherever dependencies permit parallel work.

### Phase 1: Menu Redesign + Visual Polish Foundation

**Rationale:** The menu is the entry point for every new v1.4 feature. Practice mode, mastery map, and new puzzle types have no visible surface until the menu exists. Visual polish (animations, sounds) is self-contained component work with no feature dependencies — shipping it alongside the menu means users see immediate improvement from first phase. This is the Architecture research's recommended "Phase A + F together" grouping.
**Delivers:** New `ChessMenuScreen` with 3-4 clear navigation tiles; entrance animations on menu and session screens; correct/wrong sound effects via extended `AudioSounds` enum; streak badge bounce animation; star reveal stagger on session complete; `ChessView` assertNever protecting all future view routing.
**Addresses features:** Redesigned game menu (P1), Sound effects on correct/wrong (P1), Celebration milestones (P1).
**Avoids pitfalls:** ChessView assertNever added here prevents silent routing failures for all subsequent phases; i18n sync enforced from this first phase.
**Research flag:** Standard patterns — skip phase research. MUI transitions well-documented; existing codebase patterns clear.

### Phase 2: Practice Mode

**Rationale:** Once the menu exists, practice mode is the highest-value feature with the lowest build risk. It reuses the existing adaptive session engine entirely — the change is one optional parameter on `buildSessionQueue`. The two-step navigation structure (menu → picker → drill) must be designed correctly here to avoid the back-navigation pitfall documented in PITFALLS.md.
**Delivers:** `PieceSelectorScreen` with 6-piece grid; filtered puzzle drilling per piece using existing adaptive difficulty engine; correct back-navigation from drill to picker (not to main map); practice answers wired to `usePuzzleProgress` for tier advancement; daily puzzle isolation confirmed.
**Addresses features:** Practice mode with piece picker (P1).
**Avoids pitfalls:** Parallel state pitfall (define hook contract before any UI is written); back-navigation pitfall (use separate `'practice'` and `'practice-drill'` ChessView values, not nested flags).
**Research flag:** Standard patterns — no research needed. The `pieceFilter` parameter approach is straightforward.

### Phase 3: Check and Checkmate-in-1 Puzzle Data + Renderers

**Rationale:** Puzzle data authoring (FEN curation and validation) is the critical path. The FEN format pitfall — full FEN required for chess.js vs. piece-placement FEN used by existing puzzles — is a data authoring concern caught before any components are written. Data and renderers ship together in this phase, but data validation runs first. New puzzle types are not yet included in regular session queues — they are available and testable but not in rotation.
**Delivers:** `checkPuzzles[]` and `checkmatePuzzles[]` data arrays with full FEN; `CheckPuzzle.tsx` and `CheckmatePuzzle.tsx` renderer components following existing pure-renderer pattern; extended `SessionPuzzle` discriminated union; new dispatch branches in `ChessGameContent`; offline validation script confirming each position with chess.js.
**Addresses features:** Checkmate-in-1 puzzles (P1); foundation for Check puzzles (P2).
**Avoids pitfalls:** Full FEN format enforced at authoring time; new puzzle types as separate components (not shoehorned into `MovementPuzzle` with flag props).
**Research flag:** Needs attention during planning — the 20-30 checkmate-in-1 positions need to be sourced or composed. This is content work requiring chess knowledge. Define the validation workflow before the phase executes.

### Phase 4: Wire New Puzzle Types Into Sessions (Feature-Flagged)

**Rationale:** New puzzle types enter regular session queues only after their renderers are stable and validated in isolation (Phase 3). A Firebase Remote Config feature flag (`chessCheckPuzzles`) allows rollout control and quick disable if issues surface post-ship. This separation means Phase 3 can be QA'd before broader session exposure.
**Delivers:** `usePuzzleSession` extended to include check/checkmate in `buildSessionQueue`; feature flag gating via existing `useFeatureFlagContext()`; Amplitude events for new puzzle type interactions.
**Addresses features:** Checkmate-in-1 integrated into play sessions; check puzzles as optional addition.
**Research flag:** Standard patterns — feature flag integration follows an existing well-understood pattern in the codebase.

### Phase 5: Progress and Engagement Layer

**Rationale:** Mastery display builds on the stable menu (Phase 1) and practice mode (Phase 2). By this phase, mastery data has been actively used through real practice sessions. The design constraint documented in PITFALLS.md — show tier as a named state, not a progress counter — prevents metric-gaming behavior identified as a risk for ages 5-7.
**Delivers:** Piece mastery map on `ChessMenuScreen` (6-piece grid with Beginner/Intermediate/Expert badges); per-piece mastery badges on `PieceSelectorScreen`; enhanced `DailyPuzzleCard` with prominent "uncompleted" call-to-action state.
**Addresses features:** Piece mastery map (P1), Session summary per-piece breakdown (P2).
**Avoids pitfalls:** `usePuzzleProgress` lifted to `ChessGameContent` — no multi-instantiation divergence; mastery shown as named state label only, no numeric counter toward next tier.
**Research flag:** Standard patterns — reads from existing hooks; no new data layer.

### Phase Ordering Rationale

- Menu before everything: Practice mode, mastery map, and new puzzle entry points have no surface until the menu component exists.
- Visual polish with Phase 1: Animation and sound enhancements are self-contained and non-blocking; shipping early maximizes perceived quality from first release.
- Puzzle data before renderers: The FEN format pitfall is caught at authoring time; discovering it after renderers are built causes rework.
- Renderers before session inclusion: Validate new puzzle types in isolation before they enter adaptive sessions where kids encounter them in unpredictable rotation.
- Engagement layer last: Progress display is most meaningful after practice mode is stable and mastery data has been actively accumulated through real sessions.

### Research Flags

Phases needing deeper planning attention:
- **Phase 3 (puzzle data authoring):** The 20-30 checkmate-in-1 positions need to be sourced or composed — this is content work requiring chess knowledge. Define whether to hand-compose positions, use public domain puzzle collections, or generate-and-validate with chess.js. Also define the validation workflow (script vs. manual) before execution begins.

Phases with standard patterns (skip research-phase):
- **Phase 1:** MUI transitions, AudioSounds enum extension, menu layout — all established patterns directly visible in the codebase.
- **Phase 2:** `pieceFilter` on existing hook — 10-line change with clear extension point already documented in hooks.
- **Phase 4:** Feature flag integration — existing Remote Config pattern well-understood in codebase.
- **Phase 5:** Read-only hook consumption for display — follows the exact same pattern as the existing `SessionCompleteScreen` which receives `currentTiersByPiece` as props.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies confirmed; all packages verified against installed versions and existing production usage; chess.js methods runtime-tested |
| Features | HIGH | Competitor apps analyzed directly (ChessKid, Magnus Trainer, ChessMatec); UX patterns sourced from published research; age-appropriateness constraints well-documented with 2025 references |
| Architecture | HIGH | Based on direct first-hand codebase reading of all relevant chess game files; extension points explicitly identified with line-level specificity |
| Pitfalls | HIGH | Derived from direct code analysis, not inference; FEN format pitfall verified against chess.js API; state management pitfalls traced to specific hook contracts in the codebase |

**Overall confidence:** HIGH

### Gaps to Address

- **Puzzle content sourcing:** The 20-30 checkmate-in-1 and check puzzle positions need to be authored or sourced. This is a content gap, not a code gap. Resolve in Phase 3 planning: decide whether to compose positions by hand, use public domain collections, or generate-and-validate with chess.js offline.
- **Hebrew instruction text for new puzzle types:** Check and checkmate instruction strings in Hebrew must be authored with care — Hebrew has grammatical gender agreement for chess piece names. Machine-translation is insufficient. Flag for native-speaker review before Phase 3 ships.
- **Celebration coordinator design:** The coordination pattern to prevent concurrent confetti instances is identified as needed but the specific implementation is not yet designed. Define the singleton/ref approach during Phase 1 planning before any new confetti triggers are added.

## Sources

### Primary (HIGH confidence)
- Direct codebase reading — `ChessGameContent.tsx`, `usePuzzleSession.ts`, `usePuzzleProgress.ts`, `MovementPuzzle.tsx`, `CapturePuzzle.tsx`, `data/chessPuzzles.ts`, `hooks/useDailyPuzzle.ts`, `utils/chessFen.ts`, `utils/puzzleGenerator.ts`
- chess.js official API docs (https://jhlywa.github.io/chess.js/) — `inCheck()`, `isCheckmate()`, `moves()` method signatures confirmed
- chess.js runtime test — `inCheck()` and `isCheckmate()` tested directly against installed 1.4.0 in `node_modules/chess.js`
- MUI v7 transitions docs (https://mui.com/material-ui/transitions/) — Fade, Grow, Zoom, Slide, Collapse availability confirmed
- MUI v7 progress docs (https://mui.com/material-ui/react-progress/) — LinearProgress, CircularProgress confirmed
- PROJECT.md v1.4 milestone description

### Secondary (MEDIUM confidence)
- ChessKid App Store review — piece-by-piece lesson structure, sound feedback, celebration patterns
- ChessMatec / ChessWorld App (https://www.chessworld.io/learn-chess-app) — course grid menu, animated check demonstrations
- Best Chess Teaching Apps 2026 — Wise.live — current category feature benchmarks
- UX Design for Children — AufaitUX (https://www.aufaitux.com/blog/ui-ux-designing-for-children/) — 60-80px icons, 3-5 choices per screen standards
- Streaks for Gamification — Plotline (https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps/) — 40-60% higher DAU combining streaks + milestones
- Mate in 1 move puzzles for kids — Korpalski Chess — mate-in-1 as foundational kids puzzle type

### Tertiary (context only)
- Designing for Kids: UX Tips — Ungrammary — button sizing, menu depth
- Top 7 Gamified Learning Apps with Progress Tracking — QuizCat — mastery-gated progression patterns
- How to Find the Best Move — Chess.com — rationale for deferring "best move" puzzles to adult audience

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
