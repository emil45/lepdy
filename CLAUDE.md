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

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Lepdy Chess — Kids Chess Learning Game**

A new chess learning game for Lepdy, the Hebrew learning web app for kids. The game teaches chess through progressive levels — starting with learning piece names in Hebrew, then movement puzzles, then capture challenges — until kids are ready to play a real chess game. Targets ages 5-9.

**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary — piece names spoken aloud and displayed as text, matching the Lepdy learning pattern.

### Constraints

- **Tech stack**: Next.js 16, React, MUI, TypeScript — must use existing stack
- **i18n**: Must support Hebrew (RTL, default), English, Russian via next-intl
- **Audio**: Hebrew pronunciation audio files needed for all 6 piece names
- **Performance**: Must work well on tablets (primary device for young kids)
- **Accessibility**: Large touch targets for young children
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5 - Core language for all application code
- JavaScript/JSX - React component syntax
- CSS-in-JS via Emotion (MUI) - Styling
- HTML5 - Markup (Next.js SSR/SSG)
- JSON - Configuration, translation files, data
## Runtime
- Node.js (maintained versions per browserslist)
- npm
- Lockfile: `package-lock.json` (present)
## Frameworks
- Next.js 16.1.1 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering
- next-intl 4.7.0 - Next.js i18n plugin supporting 3 locales (Hebrew/RTL, English, Russian)
- Uses `next-intl/plugin` integration in `next.config.ts`
- Material-UI (MUI) 7.3.7 - Component library
- MUI Icons 7.3.7 - Icon set
- Emotion 11.14.0 & 11.14.1 - CSS-in-JS for MUI theming with RTL support
- react-confetti 6.4.0 - Celebration effects
- Playwright Test 1.57.0 - E2E testing framework
- Config: `playwright.config.ts` - single worker, Chromium only, HTML reporter
- TypeScript 5 - Type checking and compilation
- ESLint 9 - Code linting
- eslint-config-next 16.1.1 - Next.js/React linting rules
- eslint-config-next/core-web-vitals - Core Web Vitals rules
- eslint-config-next/typescript - TypeScript support
## Key Dependencies
- firebase 12.8.0 - Backend as a Service for leaderboards, Remote Config, authentication
- @amplitude/analytics-browser 2.33.1 - Product analytics with type-safe event tracking
- next-intl 4.7.0 - Handles locale routing, translation injection, RTL/LTR direction
- @mui/material 7.3.7 - Complete design system with 40+ components, MUI theming
- @emotion/react & @emotion/styled 11.14.x - Styling engine for MUI
## Configuration
- Firebase config: Hardcoded in `lib/firebaseApp.ts` (public keys only - safe for frontend)
- Analytics: Amplitude API key hardcoded in `utils/amplitude.ts` (public key)
- Feature flags: Firebase Remote Config minimumFetchInterval=0 in dev, 1 minute in prod
- NODE_ENV: Development vs production checked for feature flag fetch intervals
- `tsconfig.json` - Target ES2020, strict mode enabled, path alias `@/*` maps to project root
- `next.config.ts` - Uses next-intl plugin wrapper
- `eslint.config.mjs` - Flat config format (ESLint 9), ignores `.next/`, `out/`, `build/`
## Platform Requirements
- Node.js (latest maintained versions)
- npm for package management
- Playwright for running E2E tests locally
- Browser: Chrome/Chromium
- Node.js runtime environment
- Deployment target: https://lepdy.com (Vercel or Node.js hosting)
- Firebase project: `lepdy-c29da` (Realtime Database, Remote Config)
- Google Analytics 4 ID: `G-XMN00ZGJH4`
- Google Ads conversion: `AW-17878894842`
- Amplitude project for product analytics
## Dev Commands
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (e.g., `ItemCard.tsx`, `BackButton.tsx`, `CategoryPage.tsx`)
- Content components (client-side paired with server pages): `*Content.tsx` (e.g., `MyWordsContent.tsx`, `GuessGameContent.tsx`, `StickersContent.tsx`)
- Pages: `page.tsx` (Next.js App Router convention)
- Hooks: camelCase with `use` prefix (e.g., `useStreak.ts`, `useDirection.ts`, `useCategoryProgress.ts`)
- Utilities: camelCase (e.g., `amplitude.ts`, `audio.ts`, `celebrations.ts`)
- Contexts: `*Context.tsx` (e.g., `StreakContext.tsx`, `WordCollectionContext.tsx`)
- Models/Types: PascalCase (e.g., `amplitudeEvents.ts`, `VoiceCharacter.ts`)
- React components: PascalCase (capitalized)
- Regular functions: camelCase (e.g., `getItemName()`, `recordActivity()`, `getTodayDate()`)
- Event handlers: `handle*` prefix in camelCase (e.g., `handleItemTap()`, `handleClick()`)
- Getters/helpers: descriptive camelCase (e.g., `getWeekStartDate()`, `hoursSinceDate()`, `loadStreakData()`)
- Constants: UPPER_SNAKE_CASE when module-scoped (e.g., `STORAGE_KEY`, `HOURS_UNTIL_STREAK_BREAK`, `API_KEY`)
- Regular variables: camelCase (e.g., `streakData`, `isInitialized`, `filteredWords`)
- Boolean flags: descriptive camelCase, often prefixed with `is`, `has`, `should` (e.g., `isCollected`, `hasActivityToday`, `freezeUsedThisWeek`)
- Collections (arrays/maps): plural camelCase (e.g., `collectedWordsWithData`, `availableCategories`, `milestones`)
- Interface names: PascalCase, typically end with suffix or describe the shape (e.g., `ItemTappedProperties`, `StreakData`, `CategoryPageProps`)
- Type unions: descriptive PascalCase (e.g., `CategoryType`, `GameType`, `LocaleType`, `RenderMode`)
- Enum names: PascalCase with values in UPPER_SNAKE_CASE (e.g., `AmplitudeEventsEnum`, `AudioSounds`)
## Code Style
- Next.js project uses ESLint with TypeScript and Next.js core Web Vitals configurations
- No Prettier config file present; ESLint provides linting only
- Indentation: 2 spaces (inferred from code samples)
- Line length: Project code uses flexible lines with some exceeding 100 characters
- Tool: ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config file: `eslint.config.mjs` (modern flat config format)
- Run: `npm run lint`
- Enforces Next.js and TypeScript best practices automatically
## Import Organization
- Single alias configured: `@/*` maps to project root
- All project imports use `@/` prefix (universal convention across codebase)
- Examples: `@/components/ItemCard`, `@/hooks/useStreak`, `@/models/amplitudeEvents`, `@/utils/amplitude`
## Error Handling
- Context hooks validate consumer usage via `useContext` with error throw pattern
- Server-side functions use try-catch for localStorage/persistence operations
- Guard clauses for client-only code check `typeof window === 'undefined'`
- Analytics calls silently fail if window is undefined or localhost (no error thrown)
- No global error boundary pattern detected; individual functions handle their own errors
## Logging
- Error logging used for data persistence failures (localStorage read/write)
- Example in `useStreak.ts`: `console.error('Failed to load streak data:', error)`
- No structured logging or dedicated logger library used
- Amplitude used for user event tracking, not general logging
## Comments
- Code is generally self-documenting with clear naming
- Comments used sparingly for non-obvious logic
- Example: `useStreak.ts` includes comment explaining 48-hour grace period: `// More forgiving than 24h for families`
- Inline comments explain specific calculations (e.g., date math in `getWeekStartDate()`)
- No JSDoc annotations observed in codebase
- TypeScript interfaces serve as documentation
- Function signatures are explicit and typed
## Function Design
- Functions generally kept small and focused
- Complex logic broken into helper functions (e.g., `getTodayDate()`, `hoursSinceDate()`, `getWeekStartDate()` all isolated in `useStreak.ts`)
- React components stay focused on single responsibility via `*Content.tsx` split pattern
- Destructuring used for props (React components)
- Type annotations required on all function parameters
- Optional parameters use TypeScript optional syntax (`?`) not defaults when semantically important
- Example: `BackButton({ href = '/' })` uses default assignment for optional routing prop
- All functions have explicit return types (TypeScript strict mode)
- Components return JSX.Element or null
- Custom hooks return typed objects or interfaces
- Early returns used for guard clauses and error states
## Module Design
- Default exports used for React components (pages and primary component files)
- Named exports used for hooks, utilities, contexts, and types
- Example: `export function useStreak()` and `export interface StreakData`
- Context providers export both provider component and hook via named exports
- Feature flags use barrel pattern: `lib/featureFlags/index.ts` exports public API
- Feature flag provider uses factory pattern via `lib/featureFlags/providers/index.ts` for provider switching
- Not consistently used across all directories (components, hooks are imported directly)
## Type Strictness
- `strict: true` enforced (all strict mode checks enabled)
- `noEmit: true` (type checking only, no output files)
- `moduleResolution: "bundler"` (modern module resolution)
- Targets ES2020
- Generics used where appropriate (e.g., `CategoryPage<T extends CategoryItem>`)
- Union types for exclusive states (e.g., `FilterType = 'all' | 'recent' | string`)
- Discriminated unions for event properties (e.g., `EventMap[T]` in amplitude.ts)
- Type assertions rare; strongly typed throughout
## Special Patterns
- Pages are server components by default
- Call `setRequestLocale()` for i18n support
- Generate metadata via `generatePageMetadata()`
- Render a single `*Content.tsx` client component
- Pattern: `page.tsx` (server) → `*Content.tsx` (client with `'use client'`)
- Context created with TypeScript strict typing
- Hook wraps context with error validation
- Examples: `StreakContext` → `useStreakContext()`, `FeatureFlagContext` → `useFeatureFlagContext()`
- Providers wrap children in middleware pattern
- Theme colors use MUI theme system
- RTL support via `direction` prop through theme
- Responsive design via breakpoints in `sx` prop (`xs`, `sm`, etc.)
- Custom colors defined as constants in component files when not in theme
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Server/Client component split pattern for optimal performance
- Locale-based routing with next-intl for i18n (Hebrew RTL default, English/Russian LTR)
- Context-based state management for learning progress and user engagement
- Feature flag system abstracted from provider implementation (Firebase Remote Config)
- Centralized analytics with Amplitude and Google Analytics
- MUI theming with directional support (RTL/LTR)
## Layers
- Purpose: Request context setup, metadata generation, i18n configuration, SEO optimization
- Location: `app/layout.tsx`, `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`
- Contains: Root layout, locale layout with script injection (GA, JSON-LD), metadata generators
- Depends on: next-intl, MUI theme, SEO utilities
- Used by: Browser requests for all routes
- Purpose: Initialize global client context, analytics, theming, feature flags
- Location: `app/providers.tsx`
- Contains: Multi-layer context nesting (Feature Flags, Progress contexts, Streak, Stickers, Word Collection)
- Depends on: Emotion cache, MUI ThemeProvider, all context providers
- Used by: All client components via context inheritance
- Purpose: Locale validation, page metadata, server-side data prep
- Location: `app/[locale]/*/page.tsx` files
- Contains: `setRequestLocale()`, `generateMetadata()`, render calls to *Content.tsx
- Depends on: next-intl server functions, SEO utilities
- Used by: Next.js routing system
- Purpose: Interactive UI, state management, user interactions
- Location: `app/[locale]/*/[ComponentName]Content.tsx`
- Contains: `'use client'` directive, hooks, event handlers
- Depends on: React hooks, context consumers, UI components
- Used by: Page.tsx files
- Purpose: Shared interactive and display components
- Location: `components/`
- Contains: ItemCard, CategoryPage, GuessGame, StickerCard, etc.
- Depends on: MUI, hooks, utilities, contexts
- Used by: Page Content components and other components
- Purpose: Learning content definitions and category data
- Location: `data/` - TypeScript arrays (letters.ts, numbers.ts, animals.ts, colors.ts, shapes.tsx, food.ts)
- Contains: Item configs with id, audioFile, color, translationKey
- Depends on: Models and enums for type safety
- Used by: CategoryPage component and game components
- Purpose: Reusable state logic and calculations
- Location: `hooks/` - Custom React hooks, `utils/` - Utility functions
- Contains: Progress tracking (useCategoryProgress), celebrations, audio management, analytics
- Depends on: React, localStorage API, external APIs (Amplitude, Firebase)
- Used by: Components and Content layers
- Purpose: Global state for learning progress, achievements, feature flags
- Location: `contexts/` - React Context providers
- Contains: FeatureFlagContext, StreakContext, progress contexts (Letters, Numbers, Animals, Games, Words)
- Depends on: Custom hooks for state logic, localStorage
- Used by: Client components via useContext hooks
- Purpose: App configuration and environment setup
- Location: `i18n/config.ts` (locales, directions), `lib/` (Firebase, feature flags)
- Contains: Supported languages, i18n routes, feature flag types
- Depends on: Firebase SDK, next-intl
- Used by: Layout, providers, hooks
## Data Flow
## Key Abstractions
- Purpose: Reusable template for any learning category (letters, numbers, animals, colors, shapes, food)
- Examples: `app/[locale]/letters/page.tsx`, `app/[locale]/numbers/page.tsx`
- Pattern: Generic component accepts items array, translation prefix, audio path, render mode (text/image/element/color)
- State: Uses category-specific progress hooks to track which items child has heard
- Integrates: Streak tracking, progress recording, analytics events on item interaction
- Purpose: Generic progress tracking for any learning category
- Examples: useLettersProgress, useNumbersProgress, useAnimalsProgress wrap this
- Pattern: Stores heardItemIds and totalClicks in localStorage, migrates legacy data formats
- Interface: recordItemHeard(id), hasHeardItem(id), heardItemIds set, totalHeard count, hasHeardAll boolean
- Handles: Storage errors gracefully, O(1) item lookup with Set, sticker unlock triggers
- Purpose: Runtime feature control without code deployment
- Pattern: Provider-agnostic factory (`lib/featureFlags/providers/index.ts`) allows swapping providers
- Types: `lib/featureFlags/types.ts` defines FeatureFlags interface and DEFAULT_FLAGS
- Implementation: Firebase Remote Config in `lib/featureFlags/providers/firebaseRemoteConfig.ts`
- Usage: `const { getFlag } = useFeatureFlagContext()` in any client component
- Purpose: Isolate state domains and enable efficient re-rendering
- Pattern: Each context provider wraps children without circular dependencies
- Order: FeatureFlagProvider → StreakProvider → ProgressProviders → StickerProviders → children
- Benefit: Feature flags load first, progress providers load independently, reduces full app re-renders
- Purpose: Optimize for Largest Contentful Paint (LCP) and server-side rendering
- Pattern: page.tsx (server) → *Content.tsx (client) split
- Server responsibility: Locale validation, metadata generation, message fetching
- Client responsibility: Interactive state, hooks, event handlers, animations
## Entry Points
- Location: `app/layout.tsx`
- Triggers: Every HTTP request
- Responsibilities: Root metadata, children passthrough to locale layout
- Location: `app/[locale]/layout.tsx`
- Triggers: Dynamic segment [locale] invoked for he|en|ru
- Responsibilities: Locale validation, message loading, Google Analytics/Ads injection, styled body wrapper, Providers initialization
- Location: `app/[locale]/page.tsx`
- Triggers: GET / (he default) or /en or /ru
- Responsibilities: Home metadata, renders HomeHeader + CategoryButtons via FunButton
- Location: `app/[locale]/[category]/page.tsx` where category ∈ {letters, numbers, colors, shapes, animals, food, learn, stickers, my-words, contact, about, safety}
- Triggers: GET /letters etc.
- Responsibilities: Render CategoryPage component with category-specific data and config
- Location: `app/[locale]/games/page.tsx` and `app/[locale]/games/[game-name]/page.tsx`
- Triggers: GET /games and GET /games/guess-game etc.
- Responsibilities: Load game content component with game-specific logic
## Error Handling
- Progress context catches JSON parse errors, returns default empty progress
- Feature flag provider returns DEFAULT_FLAGS if remote config fetch fails
- Audio playback wrapped in AbortError handling (rapid clicking doesn't error)
- localStorage access wrapped in try-catch
- StorageError state tracked in useCategoryProgress hook
- UI can check `storageError` property to show gentle indicator
- Fallback: Session state used if storage unavailable
- Amplitude/GA4 errors silently logged to console, don't affect app functionality
- Events queued; if send fails, subsequent events still attempt to send
- No retry mechanism; events may be lost if network down (acceptable for non-critical events)
- Score submission catches error, logs to console, doesn't crash game
- Leaderboard fetch returns null on error, UI shows placeholder
- Games playable offline; leaderboard just not shown
## Cross-Cutting Concerns
- Amplitude initialized in `app/providers.tsx` on mount
- `logEvent()` type-safe wrapper in `utils/amplitude.ts`
- Events logged on user interactions (item tap, game complete, session start)
- Console errors for audio playback and API failures
- Locale validated at `app/[locale]/layout.tsx`, returns 404 if invalid
- Category data typed with TypeScript interfaces (LetterConfig, NumberConfig, etc.)
- Form inputs validated before sending to API (e.g., contact form)
- Props validated at component boundaries with TypeScript types
- Anonymous user session tracking via localStorage (first visit timestamp, progress)
- No server-side auth; pure client-side session via browser storage
- Firebase anonymous auth available for leaderboard but not required for gameplay
- Parent gate via age verification modal in SettingsDrawer component
- Supported locales: he (Hebrew RTL default), en (English LTR), ru (Russian LTR)
- Messages in `messages/{he,en,ru}.json`
- Server-side `getTranslations()` from next-intl in page.tsx
- Client-side `useTranslations()` hook in *Content.tsx
- Direction prop passed through Providers → MUI theme created with correct RTL/LTR
- MUI theme factory in `theme/theme.ts` takes direction parameter
- Theme colors defined in palette.colors: pastels (red, purple, beige, green, blue, orange)
- Components styled with sx prop or Emotion
- RTL/LTR automatically handled by MUI; components mirror correctly
- Background images preloaded in layout head for responsive breakpoints (640, 1024, 1920)
- Fixed background attachment on desktop, scroll on mobile (repaint perf)
- Font optimization with next/font (Roboto with swap display)
- Audio lazy-initialized only on client, preloaded on demand
- Emotion emotion cache for SSR-safe CSS injection
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
