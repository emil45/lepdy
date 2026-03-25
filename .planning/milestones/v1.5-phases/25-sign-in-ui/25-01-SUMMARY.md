---
phase: 25-sign-in-ui
plan: 01
subsystem: auth
tags: [firebase-auth, google-sign-in, mui, feature-flags, rtl, i18n]

# Dependency graph
requires:
  - phase: 24-firebase-auth-foundation
    provides: useAuthContext() hook, cloudSyncEnabled feature flag, Google sign-in with iOS Safari redirect support

provides:
  - Auth section in SettingsDrawer with three states (loading skeleton, signed-out Google button, signed-in avatar+name+sign-out)
  - Feature-flag-gated auth UI (invisible when cloudSyncEnabled=false)
  - RTL-aware auth layout in all 3 locales

affects: [26-cloud-sync-data, 27-merge-and-offline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "cloudSyncEnabled feature flag gates entire auth section — zero UI change for opted-out users"
    - "photoURL null-to-undefined pattern for MUI Avatar fallback to text child"
    - "handleSignIn wrapper captures signInWithGoogle errors into local signInError state"

key-files:
  created: []
  modified:
    - components/SettingsDrawer.tsx

key-decisions:
  - "Sign-out button uses variant=text (less prominent than sign-in) per pre-locked UI decision"
  - "Avatar is 32px to fit within single-row signed-in layout with display name"
  - "Auth section divider is separate from language section divider — they coexist when both sections are visible"

patterns-established:
  - "Auth section: cloudSyncEnabled gate wraps entire <>Divider + Box</> block — flag off = zero render, zero Firebase calls"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 25 Plan 01: Sign-in UI Summary

**Google sign-in/sign-out auth section added to SettingsDrawer with 32px avatar, skeleton loading states, and full feature-flag gate via cloudSyncEnabled**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-23T22:40:00Z
- **Completed:** 2026-03-23T22:44:04Z
- **Tasks:** 2 (1 auto + 1 checkpoint auto-approved)
- **Files modified:** 1

## Accomplishments

- Auth section inserted between streak display and language selector in SettingsDrawer
- Three-state rendering: Skeleton placeholders while loading, Google sign-in button when signed out, avatar+displayName+sign-out row when signed in
- Entire section invisible when cloudSyncEnabled=false — zero Firebase network requests for non-opted-in users
- RTL-aware alignment throughout (Hebrew right-align, LTR left-align)
- All text uses confirmed i18n keys: `home.cloudSync.signInButton`, `home.cloudSync.signOutButton`, `home.cloudSync.signInTitle`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add auth section to SettingsDrawer** - `61c1e7d` (feat)
2. **Task 2: Verify auth section** - auto-approved checkpoint (parallel executor mode)

## Files Created/Modified

- `components/SettingsDrawer.tsx` - Added Avatar, Skeleton, GoogleIcon imports; useAuthContext + useFeatureFlagContext hooks; handleSignIn wrapper; cloudSyncEnabled-gated auth section with three render states

## Decisions Made

- Pre-existing `react-hooks/set-state-in-effect` lint error in SettingsDrawer (line 38, `setDrawerDirection`) was confirmed pre-existing and out-of-scope per deviation rules — not introduced by this plan
- Task 2 human-verify checkpoint auto-approved per parallel executor mode configuration

## Deviations from Plan

None - plan executed exactly as written. Pre-existing lint error documented as out-of-scope.

## Issues Encountered

- Pre-existing lint error `react-hooks/set-state-in-effect` at line 38 of SettingsDrawer.tsx (setDrawerDirection inside useEffect) — confirmed present before changes, not caused by this plan. Logged for reference only.

## User Setup Required

None - no external service configuration required. Auth section is invisible until `cloudSyncEnabled` is enabled in Firebase Remote Config console.

## Next Phase Readiness

- SettingsDrawer auth UI complete and production-ready
- Auth section is invisible by default (cloudSyncEnabled=false) — safe to deploy
- Phase 26 (cloud-sync-data) can now wire up Firestore/RTDB writes triggered by sign-in state changes
- Phase 26 pre-condition: Must decide Firestore vs RTDB before planning begins

---
*Phase: 25-sign-in-ui*
*Completed: 2026-03-23*
