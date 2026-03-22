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

- ✓ Translation key double-namespace bug fixed — v1.1
- ✓ Orphaned Phase 2 files removed, unused translation keys cleaned — v1.1
- ✓ Exit navigation on all chess screens (X button, no browser back needed) — v1.1
- ✓ RTL-aware Next/Back arrows in piece introduction — v1.1
- ✓ BackButton on chess main page matches other Lepdy games — v1.1
- ✓ Pastel color palette, rounded cards, soft shadows across chess game — v1.1
- ✓ Smooth fade transitions between chess game views (300ms) — v1.1
- ✓ Piece slide animation on correct puzzle answers (movement + capture) — v1.1
- ✓ 3 chess stickers (one per level) integrated into Lepdy sticker collection — v1.1

- ✓ Pastel board square colors (beigePastel/purplePastel) replacing default brown/beige — v1.2
- ✓ Coordinate labels styled with blackPastel at 50% opacity — v1.2
- ✓ Staunty SVG piece theme from lichess integrated as default — v1.2
- ✓ Horsey SVG piece theme from lichess as alternative — v1.2
- ✓ Extensible piece theme architecture (add theme = drop SVGs + one registry entry) — v1.2
- ✓ Chess game settings drawer with piece theme selector (Classic/Playful thumbnails) — v1.2
- ✓ Theme selection persists across sessions via localStorage — v1.2

### Active

(No active milestone — run `/gsd:new-milestone` to start next)

## Shipped Milestones

### v1.2 Board Facelift (shipped 2026-03-22)
Replaced default react-chessboard visuals with Lepdy's pastel board colors and kid-friendly SVG chess pieces (staunty + horsey themes) with extensible theme architecture and in-game theme selector.

### v1.1 Polish & Fixes (shipped 2026-03-22)
Fixed bugs, polished UI to match Lepdy's playful style, added piece animations, and integrated chess stickers.

### v1.0 MVP (shipped 2026-03-22)
Chess learning game with 3 progressive levels, Hebrew vocabulary, and kid-friendly feedback.

### Out of Scope

- Full chess game (AI opponent or multiplayer) — too complex for v1, goal is learning fundamentals
- Leaderboard / competitive scoring — this is about personal progress, not competition
- Custom piece themes or board skins — delivered in v1.2 (2 themes + extensible architecture)
- Online multiplayer — not aligned with Lepdy's learning model
- Advanced tactics (forks, pins, checkmate patterns) — beyond "ready to play" goal
- Adaptive difficulty — v1 uses fixed puzzle sets per level

## Context

- Lepdy is a live Hebrew learning app at lepdy.com for kids
- Chess game shipped through v1.2 with pastel board, custom SVG piece themes, and in-game theme selector
- Existing games: guess-game, memory-match, simon-game, speed-challenge, word-builder, counting-game, letter-rain, **chess-game**
- 39 E2E tests pass (Playwright)
- Audio files not yet recorded — game works without them (INTRO-03)
- 48 stickers total across 6 pages (3 chess stickers added in v1.1)

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
| Direct react-chessboard import for puzzles | Puzzle mode is read-only, no chess.js move execution needed | ✓ Good — simpler, wrapper removed in v1.1 |
| Single useChessProgress hook (no context provider) | Simpler shape than category progress, no migration logic needed | ✓ Good — less overhead |
| Prop-thread completeLevel from parent | Prevents stale state across views with useState routing | ✓ Good — fixed Phase 4 bug |
| FEN manipulation for puzzle animation | Update board position to trigger react-chessboard's built-in slide animation | ✓ Good — zero dependencies, 200ms animation |
| chess_level sticker unlock type | Reuses existing sticker detector pattern, no chess-specific sticker logic needed | ✓ Good — clean integration |

| Factory pattern for piece theme registry | One loop generates all 12 piece render functions per theme — adding a theme = 1 line | ✓ Good — PIECE-04 proven by horsey |
| SVGs from lichess (CC BY-NC-SA 4.0) | Self-hosted, no CDN dependency, kid-friendly designs | ✓ Good — attribution in CREDITS.md |
| useChessPieceTheme as standalone hook (no context) | Each component reads localStorage independently — works because settings and puzzles are mutually exclusive React subtrees | ✓ Good — simple, correct |

---
*Last updated: 2026-03-22 after v1.2 Board Facelift shipped*
