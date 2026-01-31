# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lepdy is a Hebrew learning web application for children. It teaches Hebrew letters, numbers, colors, shapes, animals, and food through interactive cards and educational games.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm test         # Run E2E tests (Playwright)
npm run test:ui  # Run tests with Playwright UI for debugging
```

## Architecture

### Next.js App Router with Internationalization

- Uses Next.js 16 with App Router and `next-intl` for i18n
- Locales: Hebrew (he, default, RTL), English (en), Russian (ru)
- Routes: `app/[locale]/` - locale is a dynamic segment
- Hebrew is the default locale and uses the root path (`/`), other locales use prefix (`/en`, `/ru`)
- Configuration: `i18n/config.ts` (locales, directions), `i18n/request.ts` (next-intl setup)
- Translation files: `messages/{he,en,ru}.json`

### Page Pattern

Pages follow a consistent server/client split:
- `page.tsx`: Server component that sets locale with `setRequestLocale()`, generates metadata via `lib/seo.ts`, renders a `*Content.tsx` client component
- `*Content.tsx`: Client component with `'use client'` directive containing interactive logic

### Learning Categories

Content in `data/` directory as TypeScript arrays with items containing:
- `id`, `translationKey`, `audioFile`, `color`
- Categories: letters, numbers, colors, shapes, animals, food

The `CategoryPage` component (`components/CategoryPage.tsx`) renders category items as interactive cards with audio playback. It supports multiple render modes: text, image, element, color.

### Games

Located in `app/[locale]/games/`:
- **guess-game**: Quiz-style game to identify items
- **memory-match-game**: Card matching game
- **simon-game**: Sequence memory game (has Firebase leaderboard)
- **speed-challenge**: Timed challenge
- **word-builder**: Word construction game
- **counting-game**: Count objects and select correct number
- **letter-rain**: Falling letters game, ages 5-7 (has Firebase leaderboard)

### Audio

- Category audio: `/public/audio/{category}/he/{filename}.mp3`
- Game sounds: `/public/audio/common/` - managed via `utils/audio.ts` with `AudioSounds` enum
- Use `playSound(AudioSounds.X)` for game effects, `playAudio(path)` for category item audio
- **Note**: Animals category plays animal sounds, not Hebrew pronunciation (unlike other categories)

### Theming

- MUI (Material-UI) theming with RTL/LTR support
- Theme defined in `theme/theme.ts` with custom pastel color palette
- Direction passed through `Providers` component which creates directional MUI theme

### Feature Flags

Provider-agnostic feature flag system using Firebase Remote Config. Architecture allows easy provider switching.

**Files:**
- `lib/featureFlags/types.ts` - Flag definitions and defaults
- `lib/featureFlags/providers/index.ts` - Provider factory (change this file to switch providers)
- `hooks/useFeatureFlags.ts` - React hook
- `contexts/FeatureFlagContext.tsx` - Context wrapper

**Usage:**
```tsx
const { getFlag } = useFeatureFlagContext();
if (getFlag('myFeature')) { /* render feature */ }
```

**Adding a new flag:**
1. Add to `FeatureFlags` interface in `lib/featureFlags/types.ts`
2. Add default value `false` in `DEFAULT_FLAGS` (features behind FF are disabled by default, enabled via Firebase)
3. Add to `fetchFlags()` in `lib/featureFlags/providers/firebaseRemoteConfig.ts`
4. Configure in [Firebase Remote Config console](https://console.firebase.google.com/project/lepdy-c29da/remoteconfig)

### Analytics & Backend

- Amplitude: initialized in `providers.tsx`, events defined in `models/amplitudeEvents.ts`
- Google Analytics 4 + Google Ads: loaded in locale layout
- Firebase: used for leaderboards (`lib/firebase.ts`), Remote Config for feature flags, functions `submitScore()` and `getTopScore()`

### Navigation

- `BackButton` component accepts optional `href` prop (defaults to `/`)
- Category pages: back goes to home (`/`)
- Game pages: back goes to games list (`/games`)

### Production

- URL: https://lepdy.com
- Hebrew uses root path, English at `/en`, Russian at `/ru`

## Testing

E2E tests using Playwright in `e2e/app.spec.ts`. Tests run with 1 worker to avoid resource issues. Tests verify the site isn't broken - not every feature.

**Current coverage:**
- Homepage loads with category buttons
- Letters page loads with cards
- Games page loads with game buttons
- Navigation between pages works
- A game page loads without crashing
- English and Russian locales work

**When to update tests:**
1. **New page/route added** → Add a test that the page loads without crashing
2. **New game added** → Add a test that the game page loads
3. **Major UI change** → Update selectors if tests break
4. **Bug found that tests missed** → Consider adding a test for that case

**When NOT to add tests:**
- Small copy/text changes
- Styling changes
- Adding items to existing categories (same component)

**Run tests before deploying** - if all pass, site works.

## Memory System

Claude Code uses a two-layer memory system to maintain context across sessions.

### Memory Files

- `.claude/MEMORY.md` - Long-term curated knowledge (user preferences, important decisions, key contacts)
- `.claude/memory/YYYY-MM-DD.md` - Daily logs (session notes, running narrative)

### Every Session

At the start of each session:
1. Read `.claude/MEMORY.md` for long-term context
2. Read today's daily log (`.claude/memory/YYYY-MM-DD.md`) if it exists
3. Read yesterday's daily log for recent context

### When to Write to Memory

| Trigger | Destination |
|---------|-------------|
| User says "remember this" or similar | `.claude/memory/YYYY-MM-DD.md` |
| Day-to-day notes, session activities | `.claude/memory/YYYY-MM-DD.md` |
| Durable facts, user preferences, important decisions | `.claude/MEMORY.md` |
| Lessons learned about this codebase | `CLAUDE.md` |

### Writing Guidelines

- Include context: who, what, when, why
- For daily logs: append with timestamp headers (e.g., `## 2:30 PM - Topic`)
- For long-term memory: organize under appropriate sections
- Confirm to user when something is recorded

