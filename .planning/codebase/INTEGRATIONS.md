# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**Analytics:**
- Amplitude - Product analytics for user engagement and learning progress tracking
  - SDK: @amplitude/analytics-browser 2.33.1
  - API Key: Hardcoded in `utils/amplitude.ts` (public key)
  - Init: `initAmplitude()` called in `app/providers.tsx`
  - Disabled on localhost and during server-side rendering
  - Default tracking enabled (session events, page views)
  - Events: Defined in `models/amplitudeEvents.ts` with TypeScript interface for each event type

**Search & SEO:**
- Google Analytics 4 (GA4) - Traffic and conversion tracking
  - Measurement ID: G-XMN00ZGJH4
  - Loaded in `app/[locale]/layout.tsx` via Google Tag Manager
  - Strategy: lazyOnload (non-critical)
  - Disabled on localhost

- Google Ads - Conversion tracking
  - Conversion ID: AW-17878894842
  - Configured in GA4 script in `app/[locale]/layout.tsx`
  - Letters page tracks conversions via gtag() calls

## Data Storage

**Databases:**
- Firebase Realtime Database
  - Project: lepdy-c29da
  - URL: https://lepdy-c29da-default-rtdb.firebaseio.com
  - Client: firebase SDK 12.8.0
  - Connection: Lazy-initialized via `getFirebaseDatabase()` in `lib/firebase.ts`
  - Usage: Leaderboard storage for games (simon-game, letter-rain)
  - Data structure: `leaderboard/{game}` nodes storing `{score, timestamp}`

**File Storage:**
- Local filesystem only
  - Audio files: `/public/audio/{category}/he/{filename}.mp3` and `/public/audio/common/`
  - Images/Assets: `/public/` directory served by Next.js

**Caching:**
- None detected - relies on HTTP cache headers and Next.js edge caching

## Authentication & Identity

**Auth Provider:**
- Firebase Anonymous Authentication (implicit)
- No explicit user login system - users identified by browser session
- Leaderboards write without authentication (public Realtime Database)

## Monitoring & Observability

**Error Tracking:**
- None detected - console.error() used for logging

**Logs:**
- Console logging only
  - Amplitude errors logged to console
  - Feature flag initialization errors logged
  - Score submission/fetch errors logged to console
  - All in development mode or error catch blocks

## CI/CD & Deployment

**Hosting:**
- Production: https://lepdy.com (Vercel or self-hosted Node.js)
- Staging: Not detected
- Development: localhost:3000

**CI Pipeline:**
- None detected - assumes manual deployment or Vercel Git integration
- Playwright tests run with 1 worker to avoid resource issues (see `playwright.config.ts`)

## Environment Configuration

**Required env vars:**
- None required - all external service keys are hardcoded (public keys only)
- NODE_ENV: Checked for development vs production behavior

**Secrets location:**
- No .env files present or needed
- Firebase config: Public keys in `lib/firebaseApp.ts`
- Amplitude API Key: Public key in `utils/amplitude.ts`
- Google Analytics IDs: Hardcoded in `app/[locale]/layout.tsx`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Firebase Realtime Database writes: `leaderboard/{game}` updates from game pages
  - Triggered by: Game completion in simon-game, letter-rain
  - Function: `submitScore(game, score)` in `lib/firebase.ts`
  - Async, fire-and-forget with error logging

## Feature Flags

**Provider:** Firebase Remote Config

**Files:**
- `lib/featureFlags/types.ts` - Flag definitions and defaults
- `lib/featureFlags/providers/firebaseRemoteConfig.ts` - Firebase Remote Config provider
- `lib/featureFlags/providers/index.ts` - Provider factory (switch providers here)
- `hooks/useFeatureFlags.ts` - React hook for accessing flags
- `contexts/FeatureFlagContext.tsx` - Context provider wrapper

**Current Flags:**
- `showStickersButton` (boolean, default: false)
- `showVoiceIndicator` (boolean, default: false)
- `soundMatchingWrongAnswerDelayMs` (number, default: varies)

**Initialization:**
- Lazy-loaded on client-side only (skips on server)
- Fetch interval: 0ms in development, 1 minute in production
- Default config set in Remote Config
- Subscriber pattern for updates

**Configuration:**
- Set in [Firebase Remote Config console](https://console.firebase.google.com/project/lepdy-c29da/remoteconfig)
- New flags: Add to `FeatureFlags` interface, defaults in `DEFAULT_FLAGS`, fetch in `fetchFlags()`

## Translation Files

**Location:** `messages/{he,en,ru}.json`

**Setup:**
- next-intl integrated via `next.config.ts`
- Locales configured in `i18n/config.ts`
- Request handler in `i18n/request.ts`
- Supported locales: he (default, RTL), en, ru (both LTR)
- Hebrew uses root path `/`, other locales use prefix `/en`, `/ru`

---

*Integration audit: 2026-03-21*
