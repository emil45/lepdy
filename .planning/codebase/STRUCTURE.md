# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
lepdy/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout with metadata
│   ├── providers.tsx              # Client context providers
│   ├── ThemeRegistry.tsx          # Emotion cache setup
│   ├── favicon.ico
│   ├── manifest.ts                # PWA manifest
│   ├── robots.ts                  # robots.txt
│   ├── sitemap.ts                 # sitemap.xml
│   └── [locale]/                  # Locale dynamic segment
│       ├── layout.tsx             # Locale layout with GA, JSON-LD, Providers
│       ├── page.tsx               # Home page
│       ├── letters/               # Learning category
│       │   └── page.tsx
│       ├── numbers/
│       │   └── page.tsx
│       ├── colors/
│       │   └── page.tsx
│       ├── shapes/
│       │   └── page.tsx
│       ├── animals/
│       │   └── page.tsx
│       ├── food/
│       │   └── page.tsx
│       ├── games/                 # Games hub and game routes
│       │   ├── page.tsx
│       │   ├── GamesContent.tsx
│       │   ├── guess-game/
│       │   │   ├── page.tsx
│       │   │   └── GuessGameContent.tsx
│       │   ├── memory-match-game/
│       │   ├── simon-game/
│       │   ├── speed-challenge/
│       │   ├── counting-game/
│       │   ├── letter-rain/
│       │   ├── word-builder/
│       │   ├── sound-matching/
│       │   └── letter-tracing/
│       ├── learn/                 # Info pages
│       ├── stickers/
│       ├── my-words/
│       ├── contact/
│       ├── about/
│       └── safety/
├── components/                    # Reusable React components
│   ├── CategoryPage.tsx           # Template for category pages
│   ├── ItemCard.tsx               # Clickable item with audio
│   ├── GuessGame.tsx              # Guess game logic
│   ├── MemoryMatchCard.tsx        # Memory match card
│   ├── FunButton.tsx              # Primary CTA button
│   ├── RoundFunButton.tsx         # Round button variant
│   ├── BackButton.tsx             # Back navigation
│   ├── PageHeader.tsx
│   ├── PageIntro.tsx
│   ├── HomeHeader.tsx             # Home page header
│   ├── StartHere.tsx              # Intro section
│   ├── Footer.tsx
│   ├── StickerCard.tsx            # Sticker display
│   ├── StickerPeelAnimation.tsx   # Peel animation
│   ├── StickerToast.tsx           # Toast notification for unlocks
│   ├── StreakIndicator.tsx        # Streak display widget
│   ├── VoiceIndicator.tsx         # Voice character indicator
│   ├── SettingsDrawer.tsx         # Settings/parent gate
│   ├── InstallPrompt.tsx          # PWA install prompt
│   ├── ParentGate.tsx             # Age verification
│   ├── Celebration.tsx            # Celebration animation
│   └── BreadcrumbJsonLd.tsx       # Structured data
├── contexts/                      # React Context providers
│   ├── FeatureFlagContext.tsx     # Feature flags
│   ├── StreakContext.tsx          # Daily streak tracking
│   ├── LettersProgressContext.tsx # Letters progress
│   ├── NumbersProgressContext.tsx # Numbers progress
│   ├── AnimalsProgressContext.tsx # Animals progress
│   ├── GamesProgressContext.tsx   # Games progress
│   ├── WordCollectionContext.tsx  # Word builder collection
│   ├── StickerContext.tsx         # Sticker state
│   └── StickerToastContext.tsx    # Toast notifications
├── hooks/                         # Custom React hooks
│   ├── useDirection.ts            # Get RTL/LTR direction
│   ├── useFeatureFlags.ts         # Get feature flags
│   ├── useCategoryProgress.ts     # Generic category progress tracker
│   ├── useLettersProgress.ts      # Letters-specific wrapper
│   ├── useNumbersProgress.ts      # Numbers-specific wrapper
│   ├── useAnimalsProgress.ts      # Animals-specific wrapper
│   ├── useGamesProgress.ts        # Games-specific progress
│   ├── useStreak.ts               # Streak management
│   ├── useStickers.ts             # Sticker unlocks
│   ├── useStickerUnlockDetector.ts # Sticker unlock logic
│   ├── useCelebration.ts          # Celebration trigger
│   ├── useGameAnalytics.ts        # Game event tracking
│   └── useWordCollectionProgress.ts # Word collection state
├── data/                          # Content data
│   ├── letters.ts                 # Hebrew letters array
│   ├── numbers.ts                 # Numbers array
│   ├── colors.ts                  # Colors array
│   ├── shapes.tsx                 # Shapes with SVG elements
│   ├── animals.ts                 # Animals array
│   ├── food.ts                    # Food items array
│   ├── stickers.ts                # Sticker definitions and unlock conditions
│   ├── hebrewWords.ts             # Hebrew word list (for word-builder game)
│   └── voiceCharacters.ts         # Voice character configs
├── lib/                           # Library and utility functions
│   ├── firebase.ts                # Firebase leaderboard operations
│   ├── firebaseApp.ts             # Firebase app initialization
│   ├── seo.ts                     # SEO metadata helper
│   └── featureFlags/              # Feature flag system
│       ├── index.ts               # Feature flag exports
│       ├── types.ts               # Flag interfaces and defaults
│       └── providers/
│           ├── index.ts           # Provider factory
│           └── firebaseRemoteConfig.ts # Firebase provider implementation
├── utils/                         # Utility functions
│   ├── amplitude.ts               # Analytics logging
│   ├── audio.ts                   # Audio playback (AudioSounds enum, playSound/playAudio/playRandomCelebration)
│   ├── celebrations.ts            # Celebration text/effects
│   ├── common.ts                  # Common utilities
│   └── languageRoutes.ts          # Locale routing helpers
├── models/                        # Type definitions
│   ├── amplitudeEvents.ts         # Event taxonomy and type-safe events
│   ├── MemoryMatchCardModel.ts    # Card model
│   ├── SimonGameModels.ts         # Simon game models
│   └── VoiceCharacter.ts          # Voice character type
├── i18n/                          # Internationalization
│   ├── config.ts                  # Locales, directions, language config
│   └── request.ts                 # next-intl request setup
├── theme/                         # MUI theming
│   └── theme.ts                   # Theme factory with RTL/LTR support
├── messages/                      # Translation files
│   ├── he.json                    # Hebrew translations
│   ├── en.json                    # English translations
│   └── ru.json                    # Russian translations
├── public/                        # Static assets
│   ├── audio/                     # Audio files
│   │   ├── letters/he/            # Hebrew letter audio (per-category)
│   │   ├── numbers/he/
│   │   ├── animals/he/            # Animal sounds (not Hebrew)
│   │   ├── colors/he/
│   │   ├── shapes/he/
│   │   ├── food/he/
│   │   └── common/                # Game sounds, celebration sounds
│   ├── images/                    # Background images (responsive sizes)
│   │   ├── background-640.webp
│   │   ├── background-1024.webp
│   │   ├── background-1920.webp
│   │   ├── og-image.png
│   │   ├── android-chrome-*.png
│   │   ├── apple-touch-icon.png
│   │   └── favicon-*.png
│   └── [other PWA icons]
├── e2e/                           # End-to-end tests
│   └── app.spec.ts                # Playwright tests
├── .planning/                     # Planning documents
│   └── codebase/                  # Architecture/structure analysis
├── .claude/                       # Claude Code memory and agents
├── playwright.config.ts           # Playwright test config
├── next.config.ts                 # Next.js config
├── tsconfig.json                  # TypeScript config
├── eslint.config.mjs              # ESLint config (flat config)
├── package.json                   # Dependencies and scripts
├── CLAUDE.md                      # Project instructions for Claude Code
└── [other config files]
```

## Directory Purposes

**app/**
- Purpose: Next.js App Router pages and layouts
- Contains: Server components (page.tsx, layout.tsx), client content wrapper components
- Key files: `[locale]/layout.tsx` (entry point for locale routing)

**components/**
- Purpose: Reusable React components
- Contains: UI components (buttons, cards), game logic components, layout components
- Key files: `CategoryPage.tsx` (template for 6 learning categories), `GuessGame.tsx`, `ItemCard.tsx`

**contexts/**
- Purpose: React Context providers for global state
- Contains: Context creation, provider components, state management
- Key files: `FeatureFlagContext.tsx` (feature control), progress contexts (learning progress)

**hooks/**
- Purpose: Custom React hooks for reusable logic
- Contains: State management, side effects, API integration
- Key files: `useCategoryProgress.ts` (generic progress hook), `useStreak.ts`, `useStickers.ts`

**data/**
- Purpose: Static learning content
- Contains: TypeScript arrays with category items, sticker configs, word lists
- Key files: `letters.ts` (22 Hebrew letters), `stickers.ts` (unlock conditions)

**lib/**
- Purpose: Server-side utilities and configuration
- Contains: Firebase API wrappers, SEO helpers, feature flag system
- Key files: `featureFlags/types.ts` (flag definitions), `firebase.ts` (leaderboard API)

**utils/**
- Purpose: Shared utility functions
- Contains: Analytics, audio management, celebrations, language routing
- Key files: `audio.ts` (AudioSounds enum, playSound function), `amplitude.ts` (analytics)

**models/**
- Purpose: Type definitions and event schemas
- Contains: TypeScript interfaces, enums, type-safe event logging
- Key files: `amplitudeEvents.ts` (event taxonomy with type safety)

**i18n/**
- Purpose: Internationalization configuration
- Contains: Supported locales, direction per locale, next-intl setup
- Key files: `config.ts` (SUPPORTED_LANGUAGES array, getDirection function)

**theme/**
- Purpose: MUI theme configuration
- Contains: Color palette, typography, theme factory
- Key files: `theme.ts` (getTheme function returns direction-aware theme)

**messages/**
- Purpose: Translation strings
- Contains: Locale-specific JSON files with all UI text
- Key files: `he.json` (Hebrew), `en.json`, `ru.json`

**public/**
- Purpose: Static assets
- Contains: Audio files (category + game sounds), images (backgrounds, favicons, PWA icons)
- Key files: Audio organized by category, backgrounds in 3 responsive sizes

**e2e/**
- Purpose: End-to-end tests
- Contains: Playwright test specs
- Key files: `app.spec.ts` (smoke tests for homepage, category, games pages)

## Key File Locations

**Entry Points:**
- `app/[locale]/layout.tsx`: Locale validation, Google Analytics, Providers initialization, NextIntlClientProvider
- `app/[locale]/page.tsx`: Home page with category buttons
- `app/providers.tsx`: Root context providers, analytics init

**Configuration:**
- `i18n/config.ts`: Locales (he|en|ru), directions, language config
- `theme/theme.ts`: MUI theme factory with RTL support
- `lib/featureFlags/types.ts`: Feature flag definitions and defaults

**Core Logic:**
- `components/CategoryPage.tsx`: Template for learning categories (renders items with audio)
- `hooks/useCategoryProgress.ts`: Generic progress tracking with localStorage
- `lib/firebase.ts`: Leaderboard API (submitScore, getTopScore)

**Testing:**
- `e2e/app.spec.ts`: Smoke tests (homepage, category page, games page load without crashing)

## Naming Conventions

**Files:**
- Page components: `page.tsx` (server component in route directories)
- Content wrappers: `[Category]Content.tsx` (client component wrapping page content)
- Components: PascalCase `ItemCard.tsx`, `CategoryPage.tsx`
- Hooks: camelCase `useFeatureFlags.ts`, `useCategoryProgress.ts`
- Utilities: camelCase `audio.ts`, `amplitude.ts`
- Types/Models: PascalCase `MemoryMatchCardModel.ts`, `VoiceCharacter.ts`
- Contexts: PascalCase `FeatureFlagContext.tsx`

**Directories:**
- Routes: kebab-case `[locale]/games/guess-game/`
- Feature: PascalCase `components/`, `contexts/`, `hooks/`
- Data: `data/` contains TypeScript files, not folders per category

**Imports/Aliases:**
- Absolute imports with `@/` prefix configured in tsconfig.json
- Examples: `@/components/ItemCard`, `@/hooks/useCategoryProgress`, `@/data/letters`

## Where to Add New Code

**New Learning Category:**
1. Add category data: `data/[category].ts` with item array
2. Create page: `app/[locale]/[category]/page.tsx` calling CategoryPage with category data
3. Add translations: Keys in `messages/{he,en,ru}.json` under `[category].*`
4. Add audio: Files in `public/audio/[category]/he/`
5. Add to home menu: Update `messages/*/home.json` button list

**New Game:**
1. Create directory: `app/[locale]/games/[game-name]/`
2. Create page: `page.tsx` with server-side metadata generation
3. Create content: `[GameName]Content.tsx` with game logic
4. Add game to GamesContent: Include button in games list
5. Add translations: Game-specific text in `messages/{he,en,ru}.json`
6. Add analytics: Fire GAME_STARTED and GAME_COMPLETED events with appropriate properties

**New Sticker:**
1. Add to `data/stickers.ts`: Define sticker object with id, name, unlock condition
2. Add to `data/stickers.ts` unlock logic: Example `{ category: 'letters', itemsHeard: 22 }` for all letters
3. Create sticker image: `/public/images/stickers/[sticker-id].png`
4. Add translations: Sticker name in `messages/{he,en,ru}.json` under `stickers.*`
5. Test: Open stickers page, verify unlocks trigger after meeting condition

**New Feature Flag:**
1. Add to interface: `lib/featureFlags/types.ts` in `FeatureFlags`
2. Add default: `DEFAULT_FLAGS` in same file
3. Add to provider: `lib/featureFlags/providers/firebaseRemoteConfig.ts` in `fetchFlags()` function
4. Configure remote: Firebase Remote Config console
5. Use: `const { getFlag } = useFeatureFlagContext(); if (getFlag('myFeature')) { ... }`

**New Context/State:**
1. Create provider: `contexts/[Feature]Context.tsx` with createContext and Provider component
2. Create hook: `hooks/use[Feature].ts` wrapping the context
3. Add to providers: `app/providers.tsx` nesting the new FeatureProvider
4. Use in components: Import hook and call useContext

**Utilities:**
- Shared helpers: `utils/[domain].ts` (audio.ts, amplitude.ts, common.ts)
- Reusable hooks: `hooks/[useFeature].ts`
- Exports: Both have index files exporting all (check if needed)

## Special Directories

**node_modules/**
- Purpose: Dependencies
- Generated: Yes (npm install)
- Committed: No

**.next/**
- Purpose: Build output
- Generated: Yes (npm run build)
- Committed: No

**public/**
- Purpose: Static files served at root
- Generated: No (user-created)
- Committed: Yes

**messages/**
- Purpose: i18n translation files
- Generated: No (manually maintained)
- Committed: Yes

**test-results/ & playwright-report/**
- Purpose: Test artifacts
- Generated: Yes (npm test)
- Committed: No

**.claude/**
- Purpose: Claude Code agent memory and configs
- Generated: Yes (agent creation)
- Committed: No

**.planning/codebase/**
- Purpose: Architecture and structure analysis
- Generated: Yes (GSD analysis tools)
- Committed: No (planning documents only, not implementation)

---

*Structure analysis: 2026-03-21*
