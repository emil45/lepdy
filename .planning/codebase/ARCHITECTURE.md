# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Next.js 16 App Router with Server Components, Client Components, and Internationalization

**Key Characteristics:**
- Server/Client component split pattern for optimal performance
- Locale-based routing with next-intl for i18n (Hebrew RTL default, English/Russian LTR)
- Context-based state management for learning progress and user engagement
- Feature flag system abstracted from provider implementation (Firebase Remote Config)
- Centralized analytics with Amplitude and Google Analytics
- MUI theming with directional support (RTL/LTR)

## Layers

**Server Layer (App Router with Layout):**
- Purpose: Request context setup, metadata generation, i18n configuration, SEO optimization
- Location: `app/layout.tsx`, `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`
- Contains: Root layout, locale layout with script injection (GA, JSON-LD), metadata generators
- Depends on: next-intl, MUI theme, SEO utilities
- Used by: Browser requests for all routes

**Provider Layer (Client Root):**
- Purpose: Initialize global client context, analytics, theming, feature flags
- Location: `app/providers.tsx`
- Contains: Multi-layer context nesting (Feature Flags, Progress contexts, Streak, Stickers, Word Collection)
- Depends on: Emotion cache, MUI ThemeProvider, all context providers
- Used by: All client components via context inheritance

**Page Layer (Server Component):**
- Purpose: Locale validation, page metadata, server-side data prep
- Location: `app/[locale]/*/page.tsx` files
- Contains: `setRequestLocale()`, `generateMetadata()`, render calls to *Content.tsx
- Depends on: next-intl server functions, SEO utilities
- Used by: Next.js routing system

**Content Layer (Client Component):**
- Purpose: Interactive UI, state management, user interactions
- Location: `app/[locale]/*/[ComponentName]Content.tsx`
- Contains: `'use client'` directive, hooks, event handlers
- Depends on: React hooks, context consumers, UI components
- Used by: Page.tsx files

**Component Layer (Reusable UI):**
- Purpose: Shared interactive and display components
- Location: `components/`
- Contains: ItemCard, CategoryPage, GuessGame, StickerCard, etc.
- Depends on: MUI, hooks, utilities, contexts
- Used by: Page Content components and other components

**Data Layer (Content Source):**
- Purpose: Learning content definitions and category data
- Location: `data/` - TypeScript arrays (letters.ts, numbers.ts, animals.ts, colors.ts, shapes.tsx, food.ts)
- Contains: Item configs with id, audioFile, color, translationKey
- Depends on: Models and enums for type safety
- Used by: CategoryPage component and game components

**Business Logic Layer (Hooks & Utilities):**
- Purpose: Reusable state logic and calculations
- Location: `hooks/` - Custom React hooks, `utils/` - Utility functions
- Contains: Progress tracking (useCategoryProgress), celebrations, audio management, analytics
- Depends on: React, localStorage API, external APIs (Amplitude, Firebase)
- Used by: Components and Content layers

**Context & State Layer:**
- Purpose: Global state for learning progress, achievements, feature flags
- Location: `contexts/` - React Context providers
- Contains: FeatureFlagContext, StreakContext, progress contexts (Letters, Numbers, Animals, Games, Words)
- Depends on: Custom hooks for state logic, localStorage
- Used by: Client components via useContext hooks

**Configuration Layer:**
- Purpose: App configuration and environment setup
- Location: `i18n/config.ts` (locales, directions), `lib/` (Firebase, feature flags)
- Contains: Supported languages, i18n routes, feature flag types
- Depends on: Firebase SDK, next-intl
- Used by: Layout, providers, hooks

## Data Flow

**Page Load Flow:**

1. Browser requests `[locale]/[category]` route
2. Next.js routes to `app/[locale]/[category]/page.tsx` (Server Component)
3. Server component:
   - Validates locale with `setRequestLocale(locale)`
   - Generates metadata with `generatePageMetadata()`
   - Renders Client Content component
4. `[Category]Content.tsx` initializes:
   - Reads messages from NextIntlClientProvider
   - Initializes hooks (useTranslations, useLocale)
   - Renders interactive UI
5. Browser receives HTML + hydrates with React

**Category Learning Flow:**

1. User taps ItemCard in CategoryPage component
2. Handler calls `recordActivity()` → triggers Streak context update
3. Progress hook (`useLettersProgress`, etc.) records item heard
4. Analytics event fired: `logEvent(ITEM_TAPPED, {...})`
5. Audio plays: `playAudio(audioPath)` or category item audio
6. Progress context notifies subscribers of state change
7. Progress triggers sticker unlock detection if thresholds met
8. UI re-renders with updated progress state

**Game Flow:**

1. User navigates to game page (e.g., `/games/guess-game`)
2. Server page.tsx renders GuessGameContent client component
3. Game component:
   - Tracks game start/completion with analytics
   - Manages game state (current question, score, timer)
   - Records progress to Firebase leaderboard (if applicable)
   - Fires GAME_COMPLETED event with metrics
4. User returns to games list via BackButton

**Feature Flag Resolution:**

1. App initializes: Providers component mounts FeatureFlagProvider
2. useFeatureFlags hook:
   - Calls createFeatureFlagProvider() factory
   - Provider (Firebase Remote Config) loads flag values on mount
   - Returns fallback values from DEFAULT_FLAGS during loading
3. Component calls `getFlag('showStickersButton')`
4. Returns typed boolean with fallback behavior

**Analytics Pipeline:**

1. Client event triggered (item tap, game complete, session start)
2. `logEvent(AmplitudeEventsEnum.EVENT, properties)` called
3. Amplitude SDK buffers event
4. On page unload or batch timeout, events sent to Amplitude
5. GA4 receives events via Google Tag Manager if initialized
6. Data available in Amplitude/GA4 dashboards

## Key Abstractions

**CategoryPage Component:**
- Purpose: Reusable template for any learning category (letters, numbers, animals, colors, shapes, food)
- Examples: `app/[locale]/letters/page.tsx`, `app/[locale]/numbers/page.tsx`
- Pattern: Generic component accepts items array, translation prefix, audio path, render mode (text/image/element/color)
- State: Uses category-specific progress hooks to track which items child has heard
- Integrates: Streak tracking, progress recording, analytics events on item interaction

**useCategoryProgress Hook:**
- Purpose: Generic progress tracking for any learning category
- Examples: useLettersProgress, useNumbersProgress, useAnimalsProgress wrap this
- Pattern: Stores heardItemIds and totalClicks in localStorage, migrates legacy data formats
- Interface: recordItemHeard(id), hasHeardItem(id), heardItemIds set, totalHeard count, hasHeardAll boolean
- Handles: Storage errors gracefully, O(1) item lookup with Set, sticker unlock triggers

**Feature Flag System:**
- Purpose: Runtime feature control without code deployment
- Pattern: Provider-agnostic factory (`lib/featureFlags/providers/index.ts`) allows swapping providers
- Types: `lib/featureFlags/types.ts` defines FeatureFlags interface and DEFAULT_FLAGS
- Implementation: Firebase Remote Config in `lib/featureFlags/providers/firebaseRemoteConfig.ts`
- Usage: `const { getFlag } = useFeatureFlagContext()` in any client component

**Context Nesting Architecture:**
- Purpose: Isolate state domains and enable efficient re-rendering
- Pattern: Each context provider wraps children without circular dependencies
- Order: FeatureFlagProvider → StreakProvider → ProgressProviders → StickerProviders → children
- Benefit: Feature flags load first, progress providers load independently, reduces full app re-renders

**Server/Client Component Pattern:**
- Purpose: Optimize for Largest Contentful Paint (LCP) and server-side rendering
- Pattern: page.tsx (server) → *Content.tsx (client) split
- Server responsibility: Locale validation, metadata generation, message fetching
- Client responsibility: Interactive state, hooks, event handlers, animations

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every HTTP request
- Responsibilities: Root metadata, children passthrough to locale layout

**Locale Layout:**
- Location: `app/[locale]/layout.tsx`
- Triggers: Dynamic segment [locale] invoked for he|en|ru
- Responsibilities: Locale validation, message loading, Google Analytics/Ads injection, styled body wrapper, Providers initialization

**Home Page:**
- Location: `app/[locale]/page.tsx`
- Triggers: GET / (he default) or /en or /ru
- Responsibilities: Home metadata, renders HomeHeader + CategoryButtons via FunButton

**Category Pages:**
- Location: `app/[locale]/[category]/page.tsx` where category ∈ {letters, numbers, colors, shapes, animals, food, learn, stickers, my-words, contact, about, safety}
- Triggers: GET /letters etc.
- Responsibilities: Render CategoryPage component with category-specific data and config

**Game Pages:**
- Location: `app/[locale]/games/page.tsx` and `app/[locale]/games/[game-name]/page.tsx`
- Triggers: GET /games and GET /games/guess-game etc.
- Responsibilities: Load game content component with game-specific logic

## Error Handling

**Strategy:** Client-side try-catch with fallback defaults, localStorage error tracking, graceful feature degradation

**Patterns:**

**Data Loading Errors:**
- Progress context catches JSON parse errors, returns default empty progress
- Feature flag provider returns DEFAULT_FLAGS if remote config fetch fails
- Audio playback wrapped in AbortError handling (rapid clicking doesn't error)

**Storage Errors:**
- localStorage access wrapped in try-catch
- StorageError state tracked in useCategoryProgress hook
- UI can check `storageError` property to show gentle indicator
- Fallback: Session state used if storage unavailable

**Analytics Errors:**
- Amplitude/GA4 errors silently logged to console, don't affect app functionality
- Events queued; if send fails, subsequent events still attempt to send
- No retry mechanism; events may be lost if network down (acceptable for non-critical events)

**Firebase Errors:**
- Score submission catches error, logs to console, doesn't crash game
- Leaderboard fetch returns null on error, UI shows placeholder
- Games playable offline; leaderboard just not shown

## Cross-Cutting Concerns

**Logging:**
- Amplitude initialized in `app/providers.tsx` on mount
- `logEvent()` type-safe wrapper in `utils/amplitude.ts`
- Events logged on user interactions (item tap, game complete, session start)
- Console errors for audio playback and API failures

**Validation:**
- Locale validated at `app/[locale]/layout.tsx`, returns 404 if invalid
- Category data typed with TypeScript interfaces (LetterConfig, NumberConfig, etc.)
- Form inputs validated before sending to API (e.g., contact form)
- Props validated at component boundaries with TypeScript types

**Authentication:**
- Anonymous user session tracking via localStorage (first visit timestamp, progress)
- No server-side auth; pure client-side session via browser storage
- Firebase anonymous auth available for leaderboard but not required for gameplay
- Parent gate via age verification modal in SettingsDrawer component

**Internationalization:**
- Supported locales: he (Hebrew RTL default), en (English LTR), ru (Russian LTR)
- Messages in `messages/{he,en,ru}.json`
- Server-side `getTranslations()` from next-intl in page.tsx
- Client-side `useTranslations()` hook in *Content.tsx
- Direction prop passed through Providers → MUI theme created with correct RTL/LTR

**Theming:**
- MUI theme factory in `theme/theme.ts` takes direction parameter
- Theme colors defined in palette.colors: pastels (red, purple, beige, green, blue, orange)
- Components styled with sx prop or Emotion
- RTL/LTR automatically handled by MUI; components mirror correctly

**Performance:**
- Background images preloaded in layout head for responsive breakpoints (640, 1024, 1920)
- Fixed background attachment on desktop, scroll on mobile (repaint perf)
- Font optimization with next/font (Roboto with swap display)
- Audio lazy-initialized only on client, preloaded on demand
- Emotion emotion cache for SSR-safe CSS injection
