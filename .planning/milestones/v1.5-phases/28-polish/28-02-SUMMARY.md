---
phase: 28-polish
plan: 02
subsystem: auth
tags: [firebase, rtdb, sync, context, react, ui, i18n]

# Dependency graph
requires:
  - phase: 28-polish/28-01
    provides: SyncStatusContext with notifySaved/showSaved/isOnline, useSyncStatus hook, useProgressSync with onSyncComplete callback
affects: []

provides:
  - SyncStatusProvider wired inside AuthProvider (always in tree when auth is present)
  - All 6 progress providers pass notifySaved to useProgressSync (saved indicator fires after each RTDB write)
  - SettingsDrawer shows "Saved" checkmark (green) 2s after cloud write
  - SettingsDrawer shows "Saved locally" with cloud-off icon (orange) when offline
  - Translation keys home.cloudSync.saved and home.cloudSync.savedLocally in all 3 locales

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SyncStatusProvider mounted inside AuthProvider so all progress providers (children) can call useSyncStatusContext() without additional wrapping
    - Sync status indicators wrapped in existing user ? (...) ternary branch to guarantee they only render for authenticated users
    - minHeight on sync status box prevents layout shift when indicators appear/disappear

key-files:
  created: []
  modified:
    - contexts/AuthContext.tsx
    - contexts/StreakContext.tsx
    - contexts/LettersProgressContext.tsx
    - contexts/NumbersProgressContext.tsx
    - contexts/AnimalsProgressContext.tsx
    - contexts/GamesProgressContext.tsx
    - contexts/WordCollectionContext.tsx
    - components/SettingsDrawer.tsx
    - messages/he.json
    - messages/en.json
    - messages/ru.json

key-decisions:
  - "SyncStatusProvider mounted inside AuthProvider (not providers.tsx) — keeps sync status lifecycle tied to auth, and AuthProvider is the natural parent of all progress providers in the tree"
  - "Sync status indicators placed inside the user ? (...) ternary branch — cleanest way to guarantee they only show for authenticated users without extra conditional nesting"

patterns-established:
  - "Context-in-context nesting: SyncStatusProvider inside AuthProvider — children access both auth and sync state without an additional wrapper in providers.tsx"

requirements-completed: [POLSH-01, POLSH-02, POLSH-03]

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 28 Plan 02: Polish Summary

**Cloud sync user feedback fully wired: saved indicator after RTDB writes, offline note in SettingsDrawer, and tab-focus re-fetch — all 3 POLSH requirements complete**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-25T13:10:00Z
- **Completed:** 2026-03-25T13:18:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Wired `SyncStatusProvider` inside `AuthProvider` so all 6 progress providers in the tree can call `useSyncStatusContext()` and pass `notifySaved` to `useProgressSync`
- Added sync status caption UI to `SettingsDrawer`: "Saved" with `CheckCircleOutline` (success.main) for 2s after cloud write; "Progress saved locally" with `CloudOffOutlined` (warning.main) when offline
- Added translation keys `home.cloudSync.saved` and `home.cloudSync.savedLocally` to all 3 locales (Hebrew, English, Russian)
- Visibility-change re-fetch (5-min throttle) is live via `useSyncStatus` mounted in `AuthProvider`

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire SyncStatusProvider + notifySaved into all 6 progress providers** - `f5fa0cd` (feat)
2. **Task 2: Add sync status UI to SettingsDrawer + translation keys** - `c89bc6c` (feat)

## Files Created/Modified
- `contexts/AuthContext.tsx` - Added `useSyncStatus`, `SyncStatusProvider` wrapping children, reads `cloudSyncEnabled` flag
- `contexts/StreakContext.tsx` - Added `useSyncStatusContext` import, passes `notifySaved` to `useProgressSync`
- `contexts/LettersProgressContext.tsx` - Same 3-line change (import + destruct + pass)
- `contexts/NumbersProgressContext.tsx` - Same 3-line change
- `contexts/AnimalsProgressContext.tsx` - Same 3-line change
- `contexts/GamesProgressContext.tsx` - Same 3-line change
- `contexts/WordCollectionContext.tsx` - Same 3-line change
- `components/SettingsDrawer.tsx` - Added CheckCircleOutline + CloudOffOutlined icons, useSyncStatusContext, sync status caption UI inside signed-in user branch
- `messages/en.json` - Added `home.cloudSync.saved` and `home.cloudSync.savedLocally`
- `messages/he.json` - Added `home.cloudSync.saved` and `home.cloudSync.savedLocally` (Hebrew)
- `messages/ru.json` - Added `home.cloudSync.saved` and `home.cloudSync.savedLocally` (Russian)

## Decisions Made
- Mounted `SyncStatusProvider` inside `AuthProvider` rather than in `providers.tsx` — keeps sync lifecycle tied to auth state, and since `AuthProvider` already wraps all progress providers, no extra wrapper needed in `providers.tsx`
- Kept sync indicators inside the `user ? (...) : (sign-in)` ternary — cleanest guarantee they render only for authenticated users, matching the `must_haves` spec

## Deviations from Plan

**1. [Rule 1 - Bug] Refactored user auth block from ternary to explicit fragment**

- **Found during:** Task 2 (SettingsDrawer sync UI)
- **Issue:** Plan said to insert sync indicators "after the user row" but the existing code used a single `loading ? ... : user ? ... : sign-in` ternary. Adding the sync block after the ternary would have shown it for non-authenticated users too (since `{!user && (...)}` would fire when `loading=true`).
- **Fix:** Changed `user ? (user row) : (sign-in)` to `user ? (<> user row + sync indicators </>) : (sign-in)` — the sync indicators are now inside the `user` branch of the ternary, never rendered for unauthenticated or loading states.
- **Files modified:** `components/SettingsDrawer.tsx`
- **Committed in:** `c89bc6c` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in placement logic)
**Impact on plan:** Fix was necessary for correctness — sync indicators must only show for signed-in users per the must_haves spec. No scope creep.

## Issues Encountered

None beyond the deviation documented above. TypeScript passed with zero errors on both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All 3 POLSH requirements are implemented:
- POLSH-01: "saved" indicator appears 2s after successful RTDB write (via notifySaved → showSaved in SyncStatusContext)
- POLSH-02: "saved locally" note visible when offline (isOnline=false in SyncStatusContext)
- POLSH-03: tab-focus re-fetch active via useSyncStatus visibility-change listener with 5-min throttle

Phase 28 (Polish) is fully complete. The v1.5 Cloud Sync milestone is ready for verification.

---
*Phase: 28-polish*
*Completed: 2026-03-25*
