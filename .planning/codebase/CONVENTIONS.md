# Coding Conventions

**Analysis Date:** 2026-03-21

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `ItemCard.tsx`, `BackButton.tsx`, `CategoryPage.tsx`)
- Content components (client-side paired with server pages): `*Content.tsx` (e.g., `MyWordsContent.tsx`, `GuessGameContent.tsx`, `StickersContent.tsx`)
- Pages: `page.tsx` (Next.js App Router convention)
- Hooks: camelCase with `use` prefix (e.g., `useStreak.ts`, `useDirection.ts`, `useCategoryProgress.ts`)
- Utilities: camelCase (e.g., `amplitude.ts`, `audio.ts`, `celebrations.ts`)
- Contexts: `*Context.tsx` (e.g., `StreakContext.tsx`, `WordCollectionContext.tsx`)
- Models/Types: PascalCase (e.g., `amplitudeEvents.ts`, `VoiceCharacter.ts`)

**Functions:**
- React components: PascalCase (capitalized)
- Regular functions: camelCase (e.g., `getItemName()`, `recordActivity()`, `getTodayDate()`)
- Event handlers: `handle*` prefix in camelCase (e.g., `handleItemTap()`, `handleClick()`)
- Getters/helpers: descriptive camelCase (e.g., `getWeekStartDate()`, `hoursSinceDate()`, `loadStreakData()`)

**Variables:**
- Constants: UPPER_SNAKE_CASE when module-scoped (e.g., `STORAGE_KEY`, `HOURS_UNTIL_STREAK_BREAK`, `API_KEY`)
- Regular variables: camelCase (e.g., `streakData`, `isInitialized`, `filteredWords`)
- Boolean flags: descriptive camelCase, often prefixed with `is`, `has`, `should` (e.g., `isCollected`, `hasActivityToday`, `freezeUsedThisWeek`)
- Collections (arrays/maps): plural camelCase (e.g., `collectedWordsWithData`, `availableCategories`, `milestones`)

**Types:**
- Interface names: PascalCase, typically end with suffix or describe the shape (e.g., `ItemTappedProperties`, `StreakData`, `CategoryPageProps`)
- Type unions: descriptive PascalCase (e.g., `CategoryType`, `GameType`, `LocaleType`, `RenderMode`)
- Enum names: PascalCase with values in UPPER_SNAKE_CASE (e.g., `AmplitudeEventsEnum`, `AudioSounds`)

## Code Style

**Formatting:**
- Next.js project uses ESLint with TypeScript and Next.js core Web Vitals configurations
- No Prettier config file present; ESLint provides linting only
- Indentation: 2 spaces (inferred from code samples)
- Line length: Project code uses flexible lines with some exceeding 100 characters

**Linting:**
- Tool: ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config file: `eslint.config.mjs` (modern flat config format)
- Run: `npm run lint`
- Enforces Next.js and TypeScript best practices automatically

## Import Organization

**Order:**
1. React and Next.js core imports (e.g., `import React`, `import { useState }`)
2. Next.js features (e.g., `import { useLocale }`, `import { useRouter }`)
3. Third-party UI libraries (e.g., `import { Box, Typography } from '@mui/material'`)
4. Third-party utilities (e.g., `import * as amplitude from '@amplitude/analytics-browser'`)
5. Project imports via `@/` alias (e.g., `import BackButton from '@/components/BackButton'`)
6. Type/Model imports (often grouped with project imports)

**Path Aliases:**
- Single alias configured: `@/*` maps to project root
- All project imports use `@/` prefix (universal convention across codebase)
- Examples: `@/components/ItemCard`, `@/hooks/useStreak`, `@/models/amplitudeEvents`, `@/utils/amplitude`

## Error Handling

**Patterns:**
- Context hooks validate consumer usage via `useContext` with error throw pattern
  - Example: `StreakContext.tsx` throws error if used outside provider: `throw new Error('useStreakContext must be used within a StreakProvider')`
- Server-side functions use try-catch for localStorage/persistence operations
  - Example: `useStreak.ts` wraps `JSON.parse()` and `localStorage` access in try-catch, logs errors with `console.error()`
- Guard clauses for client-only code check `typeof window === 'undefined'`
  - Example in `amplitude.ts`, `audio.ts`, and `useStreak.ts`
- Analytics calls silently fail if window is undefined or localhost (no error thrown)
- No global error boundary pattern detected; individual functions handle their own errors

## Logging

**Framework:** Console-based (`console.error()`)

**Patterns:**
- Error logging used for data persistence failures (localStorage read/write)
- Example in `useStreak.ts`: `console.error('Failed to load streak data:', error)`
- No structured logging or dedicated logger library used
- Amplitude used for user event tracking, not general logging

## Comments

**When to Comment:**
- Code is generally self-documenting with clear naming
- Comments used sparingly for non-obvious logic
- Example: `useStreak.ts` includes comment explaining 48-hour grace period: `// More forgiving than 24h for families`
- Inline comments explain specific calculations (e.g., date math in `getWeekStartDate()`)

**JSDoc/TSDoc:**
- No JSDoc annotations observed in codebase
- TypeScript interfaces serve as documentation
- Function signatures are explicit and typed

## Function Design

**Size:**
- Functions generally kept small and focused
- Complex logic broken into helper functions (e.g., `getTodayDate()`, `hoursSinceDate()`, `getWeekStartDate()` all isolated in `useStreak.ts`)
- React components stay focused on single responsibility via `*Content.tsx` split pattern

**Parameters:**
- Destructuring used for props (React components)
- Type annotations required on all function parameters
- Optional parameters use TypeScript optional syntax (`?`) not defaults when semantically important
- Example: `BackButton({ href = '/' })` uses default assignment for optional routing prop

**Return Values:**
- All functions have explicit return types (TypeScript strict mode)
- Components return JSX.Element or null
- Custom hooks return typed objects or interfaces
- Early returns used for guard clauses and error states

## Module Design

**Exports:**
- Default exports used for React components (pages and primary component files)
- Named exports used for hooks, utilities, contexts, and types
- Example: `export function useStreak()` and `export interface StreakData`
- Context providers export both provider component and hook via named exports

**Barrel Files:**
- Feature flags use barrel pattern: `lib/featureFlags/index.ts` exports public API
- Feature flag provider uses factory pattern via `lib/featureFlags/providers/index.ts` for provider switching
- Not consistently used across all directories (components, hooks are imported directly)

## Type Strictness

**TypeScript Config (`tsconfig.json`):**
- `strict: true` enforced (all strict mode checks enabled)
- `noEmit: true` (type checking only, no output files)
- `moduleResolution: "bundler"` (modern module resolution)
- Targets ES2020

**Type Usage Patterns:**
- Generics used where appropriate (e.g., `CategoryPage<T extends CategoryItem>`)
- Union types for exclusive states (e.g., `FilterType = 'all' | 'recent' | string`)
- Discriminated unions for event properties (e.g., `EventMap[T]` in amplitude.ts)
- Type assertions rare; strongly typed throughout

## Special Patterns

**Server/Client Split:**
- Pages are server components by default
- Call `setRequestLocale()` for i18n support
- Generate metadata via `generatePageMetadata()`
- Render a single `*Content.tsx` client component
- Pattern: `page.tsx` (server) → `*Content.tsx` (client with `'use client'`)

**Context + Hooks Pattern:**
- Context created with TypeScript strict typing
- Hook wraps context with error validation
- Examples: `StreakContext` → `useStreakContext()`, `FeatureFlagContext` → `useFeatureFlagContext()`
- Providers wrap children in middleware pattern

**MUI Theming with sx Props:**
- Theme colors use MUI theme system
- RTL support via `direction` prop through theme
- Responsive design via breakpoints in `sx` prop (`xs`, `sm`, etc.)
- Custom colors defined as constants in component files when not in theme

---

*Convention analysis: 2026-03-21*
