# Lepdy Chess — Kids Chess Learning Game

## What This Is

A new chess learning game for Lepdy, the Hebrew learning web app for kids. The game teaches chess through progressive levels — starting with learning piece names in Hebrew, then movement puzzles, then capture challenges — until kids are ready to play a real chess game. Targets ages 5-9.

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

### Active

- [x] Classic 8x8 chess board rendered for kids with tap interaction, RTL-safe, SSR-safe — Validated in Phase 2: Board Infrastructure
- [x] Chess piece data structures with Hebrew names and audio path references — Validated in Phase 1: Foundation
- [x] All 6 chess pieces with Hebrew names, audio pronunciation, and visual display — Validated in Phase 4: Level 1 Piece Introduction
- [ ] Level-based progression system (learn pieces → movement puzzles → capture puzzles)
- [x] Level 1: Learn each piece — name, appearance, Hebrew audio — Validated in Phase 4: Level 1 Piece Introduction
- [x] Level 2: Movement puzzles — "tap where this piece can move" — Validated in Phase 5: Level 2 Movement Puzzles
- [ ] Level 3: Capture puzzles — "which piece can capture the target?"
- [ ] Progress tracking — which levels are completed (local, no leaderboard)
- [ ] Adaptive difficulty for ages 5-9
- [ ] Game integrates into existing /games route and games list
- [ ] Audio for Hebrew piece names (like other Lepdy categories)
- [x] Chess i18n translation keys (Hebrew, English, Russian) — Validated in Phase 1: Foundation
- [ ] i18n support (Hebrew, English, Russian) via existing next-intl setup

### Out of Scope

- Full chess game (AI opponent or multiplayer) — too complex for v1, goal is learning fundamentals
- Leaderboard / competitive scoring — this is about personal progress, not competition
- Custom piece themes or board skins — keep it simple, classic board
- Online multiplayer — not aligned with Lepdy's learning model
- Advanced tactics (forks, pins, checkmate patterns) — beyond "ready to play" goal

## Context

- Lepdy is a live Hebrew learning app at lepdy.com for kids
- Existing games: guess-game, memory-match, simon-game, speed-challenge, word-builder, counting-game, letter-rain
- Games follow a consistent pattern: page.tsx (server) + Content.tsx (client)
- Audio system exists with `playSound()` for game effects and `playAudio()` for category items
- Hebrew piece names will need new audio files recorded in `/public/audio/chess/he/`
- Progress tracking can use existing context patterns (ProgressContext, etc.)
- The game should feel like a natural extension of Lepdy — same visual language, same learning approach

## Constraints

- **Tech stack**: Next.js 16, React, MUI, TypeScript — must use existing stack
- **i18n**: Must support Hebrew (RTL, default), English, Russian via next-intl
- **Audio**: Hebrew pronunciation audio files needed for all 6 piece names
- **Performance**: Must work well on tablets (primary device for young kids)
- **Accessibility**: Large touch targets for young children

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Level-based progression over free-pick | Guided journey ensures kids learn fundamentals in order | — Pending |
| Classic 8x8 board (not simplified) | Kids should learn real chess, not a simplified version | — Pending |
| No leaderboard | Focus on personal learning progress, not competition | — Pending |
| Audio + text for Hebrew piece names | Matches Lepdy's learning pattern across all categories | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after Phase 5: Level 2 Movement Puzzles complete*
