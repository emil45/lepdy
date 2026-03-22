# Lepdy Chess — Kids Chess Learning Game

## What This Is

A chess learning game for Lepdy, the Hebrew learning web app for kids. The game teaches chess through 3 progressive levels — learning piece names in Hebrew, movement puzzles, and capture challenges. Shipped as part of the Lepdy games collection at lepdy.com. Targets ages 5-9.

## Core Value

Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary — piece names spoken aloud and displayed as text, matching the Lepdy learning pattern.

## Requirements

### Validated

- ✓ Next.js App Router with i18n (Hebrew/English/Russian) — existing
- ✓ Game infrastructure (routing, audio system, game sounds) — existing
- ✓ MUI theming with RTL/LTR support — existing
- ✓ Feature flag system (Firebase Remote Config) — existing
- ✓ Analytics (Amplitude, GA4) — existing
- ✓ Server/client component pattern for pages — existing
- ✓ Classic 8x8 chess board with tap interaction, RTL-safe, SSR-safe — v1.0
- ✓ Chess piece data structures with Hebrew names and audio path references — v1.0
- ✓ All 6 chess pieces with Hebrew names, audio pronunciation, and visual display — v1.0
- ✓ Level-based progression system (learn pieces → movement puzzles → capture puzzles) — v1.0
- ✓ Level 1: Learn each piece — name, appearance, Hebrew audio — v1.0
- ✓ Level 2: Movement puzzles — "tap where this piece can move" — v1.0
- ✓ Level 3: Capture puzzles — "which piece can capture the target?" — v1.0
- ✓ Progress tracking with localStorage persistence — v1.0
- ✓ Game integrated into /games route and games list — v1.0
- ✓ Chess i18n translation keys (Hebrew, English, Russian) — v1.0
- ✓ i18n support via next-intl — v1.0
- ✓ Kid-friendly feedback: celebration on correct, gentle "try again" on wrong, hints after 2 attempts — v1.0

### Active

(Defined in REQUIREMENTS.md for v1.1)

## Current Milestone: v1.1 Polish & Fixes

**Goal:** Fix v1.0 bugs and polish the chess game UI to match Lepdy's playful visual style

**Target features:**
- Lepdy-style pastel UI with animations and game polish
- Piece movement animation on correct puzzle answers
- Fix broken translation keys (double namespace prefix)
- Back/exit navigation from every screen (puzzles, piece intro, level map)
- Fix RTL-aware next/back button direction in piece intro
- Align chess game back button with other games
- Clean up orphaned code from v1.0

### Out of Scope

- Full chess game (AI opponent or multiplayer) — too complex for v1, goal is learning fundamentals
- Leaderboard / competitive scoring — this is about personal progress, not competition
- Custom piece themes or board skins — keep it simple, classic board
- Online multiplayer — not aligned with Lepdy's learning model
- Advanced tactics (forks, pins, checkmate patterns) — beyond "ready to play" goal
- Adaptive difficulty — v1 uses fixed puzzle sets per level

## Context

- Lepdy is a live Hebrew learning app at lepdy.com for kids
- Chess game shipped as v1.0 with ~1,500 LOC TypeScript across 6 phases
- Existing games: guess-game, memory-match, simon-game, speed-challenge, word-builder, counting-game, letter-rain, **chess-game**
- 39 E2E tests pass (Playwright)
- Audio files not yet recorded — game works without them (INTRO-03)
- Phase 2 ChessBoard wrapper is orphaned — Phases 5-6 import react-chessboard directly
- 5 unused translation keys in chessGame.ui.* namespace

## Constraints

- **Tech stack**: Next.js 16, React, MUI, TypeScript — must use existing stack
- **i18n**: Must support Hebrew (RTL, default), English, Russian via next-intl
- **Audio**: Hebrew pronunciation audio files needed for all 6 piece names
- **Performance**: Must work well on tablets (primary device for young kids)
- **Accessibility**: Large touch targets for young children

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Level-based progression over free-pick | Guided journey ensures kids learn fundamentals in order | ✓ Good — natural learning flow |
| Classic 8x8 board (not simplified) | Kids should learn real chess, not a simplified version | ✓ Good — real board, real pieces |
| No leaderboard | Focus on personal learning progress, not competition | ✓ Good — reduces complexity |
| Audio + text for Hebrew piece names | Matches Lepdy's learning pattern across all categories | ✓ Good — consistent UX |
| Direct react-chessboard import for puzzles | Puzzle mode is read-only, no chess.js move execution needed | ✓ Good — simpler, orphaned ChessBoard wrapper |
| Single useChessProgress hook (no context provider) | Simpler shape than category progress, no migration logic needed | ✓ Good — less overhead |
| Prop-thread completeLevel from parent | Prevents stale state across views with useState routing | ✓ Good — fixed Phase 4 bug |

---
*Last updated: 2026-03-22 after v1.1 milestone started*
