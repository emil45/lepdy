---
phase: 24-firebase-auth-foundation
plan: 02
subsystem: auth
tags: [firebase, firebase-auth, useAuth, AuthContext, COPPA, i18n, feature-flags]

# Dependency graph
requires:
  - 24-01 (getFirebaseAuth and isIOS from lib/firebaseAuth.ts)
  - FeatureFlagContext (cloudSyncEnabled flag)
provides:
  - useAuth hook with three auth states (loading/null/User)
  - AuthContext provider and useAuthContext consumer hook
  - AuthProvider wired into provider tree
  - COPPA-framed cloudSync copy in Hebrew, English, Russian
affects:
  - 25-settings-login-ui (consumes useAuthContext for sign-in UI)
  - 26-cloud-sync-write (consumes useAuthContext for user identity)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Context-wraps-hook pattern for auth state (mirrors FeatureFlagContext)
    - Dynamic import of firebase/auth inside effect bodies — SSR-safe
    - Feature-flag gating to short-circuit Firebase Auth init entirely when flag is false

key-files:
  created:
    - hooks/useAuth.ts
    - contexts/AuthContext.tsx
  modified:
    - app/providers.tsx
    - messages/en.json
    - messages/he.json
    - messages/ru.json

key-decisions:
  - "AuthProvider placed inside FeatureFlagProvider, outside StreakProvider — ensures flag is readable before auth init runs"
  - "cloudSyncEnabled=false causes setLoading(false) immediately — zero Firebase network requests for non-opted-in users"
  - "getRedirectResult called after onAuthStateChanged setup — handles pending iOS Safari redirect flows without race condition"
  - "All firebase/auth imports inside effect/callback bodies only — no top-level firebase/auth to prevent SSR window errors"

requirements-completed: [AUTH-04, AUTH-05, AUTH-06]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 24 Plan 02: useAuth Hook, AuthContext Provider, and COPPA Translations Summary

**useAuth hook with feature-flag-gated Firebase Auth init (popup/redirect split), AuthContext provider wired into provider tree, and COPPA-framed sign-in copy in Hebrew, English, and Russian**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-23T22:23:23Z
- **Completed:** 2026-03-23T22:25:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `hooks/useAuth.ts` with `cloudSyncEnabled` feature flag gate — Firebase Auth never initializes when flag is false; three auth states: loading (true/null), signed-out (false/null), signed-in (false/User)
- iOS/desktop split: `isIOS()` selects `signInWithRedirect` on iOS (popup blocked by WebKit) or `signInWithPopup` on desktop; `getRedirectResult` called on mount to complete any pending redirect flow
- Created `contexts/AuthContext.tsx` mirroring FeatureFlagContext pattern exactly — `AuthProvider` wraps `useAuth()`, `useAuthContext()` throws descriptive error if used outside provider
- Wired `AuthProvider` into `app/providers.tsx` inside `FeatureFlagProvider`, outside `StreakProvider` — correct position ensures flag reads work and auth state is available to all child contexts
- Added COPPA-framed `home.cloudSync` section to `messages/en.json`, `messages/he.json`, `messages/ru.json` — every string explicitly frames sign-in as a parent/guardian action ("Parents only", "להורים בלבד", "только для родителей")

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAuth hook** - `5bce538` (feat)
2. **Task 2: AuthContext, providers.tsx, COPPA translations** - `2dcbe47` (feat)

## Files Created/Modified

- `hooks/useAuth.ts` — Auth state hook with flag gate, redirect result handling, iOS detection
- `contexts/AuthContext.tsx` — Context provider and useAuthContext consumer hook
- `app/providers.tsx` — AuthProvider added to provider tree
- `messages/en.json` — cloudSync section with COPPA-framed English copy
- `messages/he.json` — cloudSync section with COPPA-framed Hebrew copy
- `messages/ru.json` — cloudSync section with COPPA-framed Russian copy

## Decisions Made

- AuthProvider placed inside FeatureFlagProvider, outside StreakProvider — ensures cloudSyncEnabled flag is readable before auth init runs and auth state is available to all progress providers
- `cloudSyncEnabled=false` causes immediate `setLoading(false)` — zero Firebase network requests for non-opted-in users
- `getRedirectResult` called after `onAuthStateChanged` setup to avoid race condition — state listener is registered before result is consumed
- All `firebase/auth` imports inside effect and callback bodies only (no top-level imports) — prevents SSR `window` errors consistent with Plan 01 pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — no UI components created in this plan. The cloudSync translation strings are intentional additions that will be used by Phase 25 sign-in UI components.

## Next Phase Readiness

- `useAuthContext()` is importable from `@/contexts/AuthContext` — ready for Phase 25 (Settings Login UI)
- `cloudSync` translation keys exist in all three locales — Phase 25 can reference `t('home.cloudSync.signInTitle')` etc.
- When `cloudSyncEnabled` is false (default), zero auth-related network requests are made — safe to deploy immediately

---
*Phase: 24-firebase-auth-foundation*
*Completed: 2026-03-24*
