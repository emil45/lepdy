# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- TypeScript 5 - Core language for all application code
- JavaScript/JSX - React component syntax
- CSS-in-JS via Emotion (MUI) - Styling

**Secondary:**
- HTML5 - Markup (Next.js SSR/SSG)
- JSON - Configuration, translation files, data

## Runtime

**Environment:**
- Node.js (maintained versions per browserslist)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**Internationalization:**
- next-intl 4.7.0 - Next.js i18n plugin supporting 3 locales (Hebrew/RTL, English, Russian)
- Uses `next-intl/plugin` integration in `next.config.ts`

**UI Components & Styling:**
- Material-UI (MUI) 7.3.7 - Component library
- MUI Icons 7.3.7 - Icon set
- Emotion 11.14.0 & 11.14.1 - CSS-in-JS for MUI theming with RTL support
- react-confetti 6.4.0 - Celebration effects

**Testing:**
- Playwright Test 1.57.0 - E2E testing framework
- Config: `playwright.config.ts` - single worker, Chromium only, HTML reporter

**Build/Dev:**
- TypeScript 5 - Type checking and compilation
- ESLint 9 - Code linting
- eslint-config-next 16.1.1 - Next.js/React linting rules
- eslint-config-next/core-web-vitals - Core Web Vitals rules
- eslint-config-next/typescript - TypeScript support

## Key Dependencies

**Critical:**
- firebase 12.8.0 - Backend as a Service for leaderboards, Remote Config, authentication
- @amplitude/analytics-browser 2.33.1 - Product analytics with type-safe event tracking

**Infrastructure:**
- next-intl 4.7.0 - Handles locale routing, translation injection, RTL/LTR direction
- @mui/material 7.3.7 - Complete design system with 40+ components, MUI theming
- @emotion/react & @emotion/styled 11.14.x - Styling engine for MUI

## Configuration

**Environment:**
- Firebase config: Hardcoded in `lib/firebaseApp.ts` (public keys only - safe for frontend)
- Analytics: Amplitude API key hardcoded in `utils/amplitude.ts` (public key)
- Feature flags: Firebase Remote Config minimumFetchInterval=0 in dev, 1 minute in prod
- NODE_ENV: Development vs production checked for feature flag fetch intervals

**Build:**
- `tsconfig.json` - Target ES2020, strict mode enabled, path alias `@/*` maps to project root
- `next.config.ts` - Uses next-intl plugin wrapper
- `eslint.config.mjs` - Flat config format (ESLint 9), ignores `.next/`, `out/`, `build/`

## Platform Requirements

**Development:**
- Node.js (latest maintained versions)
- npm for package management
- Playwright for running E2E tests locally
- Browser: Chrome/Chromium

**Production:**
- Node.js runtime environment
- Deployment target: https://lepdy.com (Vercel or Node.js hosting)
- Firebase project: `lepdy-c29da` (Realtime Database, Remote Config)
- Google Analytics 4 ID: `G-XMN00ZGJH4`
- Google Ads conversion: `AW-17878894842`
- Amplitude project for product analytics

## Dev Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run Playwright E2E tests
npm run test:ui      # Playwright UI for debugging
npm run test:headed  # Run tests with browser visible
```

---

*Stack analysis: 2026-03-21*
