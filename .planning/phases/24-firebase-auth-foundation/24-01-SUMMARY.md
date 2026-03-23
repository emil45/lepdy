---
phase: 24-firebase-auth-foundation
plan: 01
subsystem: auth
tags: [firebase, firebase-auth, feature-flags, next-intl, safari, ios]

# Dependency graph
requires: []
provides:
  - Firebase Auth lazy singleton via getFirebaseAuth()
  - isIOS() utility for Safari redirect auth fallback
  - cloudSyncEnabled feature flag (default false) gating all cloud sync UI
  - /__/auth/:path* Next.js proxy rewrite for Safari 16.1+ redirect auth
affects:
  - 24-02 (auth hook/context — consumes getFirebaseAuth and isIOS)
  - 25-settings-login-ui (uses cloudSyncEnabled flag)
  - 26-cloud-sync-write (uses cloudSyncEnabled flag)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy singleton pattern for Firebase Auth (same as lib/firebase.ts for RTDB)
    - Dynamic import inside function body for SSR-safe Firebase initialization
    - Next.js rewrites() proxy for same-domain Safari redirect auth

key-files:
  created:
    - lib/firebaseAuth.ts
  modified:
    - lib/featureFlags/types.ts
    - lib/featureFlags/providers/firebaseRemoteConfig.ts
    - next.config.ts

key-decisions:
  - "Dynamic import of firebase/auth inside getFirebaseAuth() prevents SSR errors — no top-level firebase/auth import"
  - "isIOS() checks navigator.userAgent for iPad/iPhone/iPod — used by useAuth to choose redirect over popup"
  - "cloudSyncEnabled defaults to false — Firebase Auth never initializes until flag is enabled in Firebase console"
  - "/__/auth/:path* proxied to lepdy-c29da.firebaseapp.com — Safari 16.1+ same-domain cookie workaround"

patterns-established:
  - "Firebase service lazy singleton: let service = null; export async function getFirebaseX() { if (!service) { app = await getFirebaseApp(); const { getX } = await import('firebase/x'); service = getX(app); } return service; }"

requirements-completed: [AUTH-04, AUTH-05]

# Metrics
duration: 1min
completed: 2026-03-24
---

# Phase 24 Plan 01: Firebase Auth Foundation Summary

**Firebase Auth lazy singleton with SSR-safe dynamic import, cloudSyncEnabled feature flag (default off), and /__/auth/* proxy rewrite for Safari 16.1+ redirect auth compatibility**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-23T22:20:36Z
- **Completed:** 2026-03-23T22:21:29Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `lib/firebaseAuth.ts` with lazy `getFirebaseAuth()` singleton and `isIOS()` utility — mirrors existing `lib/firebase.ts` RTDB pattern exactly
- Added `cloudSyncEnabled: boolean` (default `false`) to `FeatureFlags` interface and `DEFAULT_FLAGS`, plus Remote Config fetch in `firebaseRemoteConfig.ts`
- Added Next.js `rewrites()` in `next.config.ts` proxying `/__/auth/:path*` to Firebase's own domain — makes redirect auth appear same-domain, bypassing Safari 16.1+ third-party cookie blocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Firebase Auth lazy singleton and isIOS utility** - `008ea00` (feat)
2. **Task 2: Add cloudSyncEnabled feature flag and Safari auth proxy rewrite** - `e8f6182` (feat)

## Files Created/Modified
- `lib/firebaseAuth.ts` - Lazy Firebase Auth singleton; isIOS() device detection
- `lib/featureFlags/types.ts` - cloudSyncEnabled flag added to interface and defaults
- `lib/featureFlags/providers/firebaseRemoteConfig.ts` - cloudSyncEnabled fetched from Remote Config
- `next.config.ts` - rewrites() proxy for Safari redirect auth compatibility

## Decisions Made
- Used dynamic `import('firebase/auth')` inside `getFirebaseAuth()` body — prevents SSR window errors since Firebase Auth references `window` at module scope
- `isIOS()` uses `navigator.userAgent` regex — covers all iOS devices (iPad, iPhone, iPod) where popup auth is blocked by WebKit
- `cloudSyncEnabled` defaults to `false` — auth UI and Firebase Auth initialization are completely invisible until the flag is enabled in Firebase Remote Config console
- Proxy destination is `lepdy-c29da.firebaseapp.com` (the project's own Firebase Hosting domain, which Firebase Auth uses for redirect) — this makes it same-domain from the browser's perspective

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The `cloudSyncEnabled` flag must be enabled in Firebase Remote Config console before auth UI appears, but that is handled by Plan 02 prerequisites.

## Next Phase Readiness
- `getFirebaseAuth()` and `isIOS()` are ready for Plan 02 (useAuth hook + AuthContext)
- `cloudSyncEnabled` flag is registered and defaults to false — safe to deploy immediately
- Safari proxy rewrite is active on next deploy — no manual configuration needed

---
*Phase: 24-firebase-auth-foundation*
*Completed: 2026-03-24*
