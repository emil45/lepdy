---
phase: 28-polish
plan: 01
subsystem: auth
tags: [firebase, rtdb, sync, hooks, context, react]

# Dependency graph
requires:
  - phase: 27-cloud-merge
    provides: useMergeOnSignIn with runMerge and cloud fetch/merge logic
  - phase: 26-cloud-write-path
    provides: useProgressSync debounced RTDB write hook
provides:
  - useProgressSync with onSyncComplete callback (fires after successful RTDB write)
  - SyncStatusContext with notifySaved/showSaved/isOnline for any consumer
  - useSyncStatus hook with online/offline detection + visibility-change re-fetch
  - fetchAndMergeToLocalStorage exported from useMergeOnSignIn (no page reload)
affects: [28-02-plan, SettingsDrawer, all 6 progress providers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Ref-based callback pattern for stable hook params (onSyncCompleteRef) that must not enter dep arrays
    - SSR-safe navigator.onLine initialization with lazy state initializer
    - Throttled event listeners via useRef timestamp tracking (VISIBILITY_COOLDOWN_MS)

key-files:
  created:
    - contexts/SyncStatusContext.tsx
    - hooks/useSyncStatus.ts
  modified:
    - hooks/useProgressSync.ts
    - hooks/useMergeOnSignIn.ts

key-decisions:
  - "onSyncComplete not added to useEffect dep array — prevents resetting the 30s debounce timer on callback identity changes"
  - "SyncStatusProvider receives isOnline as prop (not computed internally) — parent calls useSyncStatus and passes result"
  - "fetchAndMergeToLocalStorage returns boolean — true=merged, false=cloud fetch failed; caller decides whether to reload"
  - "visibilitychange re-fetch uses lastFetchRef timestamp throttle (5-min) not a debounce — prevents RTDB read flood on rapid tab switching"

patterns-established:
  - "Ref-based optional callback: useRef(callback), keep ref current outside effect, call ref.current?.() inside timer"
  - "Context value shape: { data, isOnline, notifyAction } — boolean flags + imperative notification"

requirements-completed: [POLSH-01, POLSH-02, POLSH-03]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 28 Plan 01: Polish Summary

**Sync status infrastructure: onSyncComplete callback in useProgressSync, SyncStatusContext with notifySaved/showSaved/isOnline, useSyncStatus with online detection + visibility re-fetch, and fetchAndMergeToLocalStorage extracted without reload**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-25T13:02:49Z
- **Completed:** 2026-03-25T13:07:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added optional `onSyncComplete` callback to `useProgressSync` using ref pattern to avoid affecting the 30s debounce dep array
- Created `SyncStatusContext` with `notifySaved()` (2s auto-clear), `showSaved`, and `isOnline` for drawer UI consumption
- Extracted `fetchAndMergeToLocalStorage` from `useMergeOnSignIn` as a public export that merges cloud+local data without triggering page reload
- Created `useSyncStatus` hook with SSR-safe online detection and 5-minute throttled visibility-change re-fetch

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onSyncComplete to useProgressSync + create SyncStatusContext** - `ce236fe` (feat)
2. **Task 2: Create useSyncStatus + extract fetchAndMergeToLocalStorage** - `17ad2ca` (feat)

## Files Created/Modified
- `hooks/useProgressSync.ts` - Added 4th optional param `onSyncComplete?: () => void` with `onSyncCompleteRef` ref pattern; fires after successful RTDB write
- `contexts/SyncStatusContext.tsx` - New context with `SyncStatusProvider` (accepts `isOnline` prop) and `useSyncStatusContext` hook; `notifySaved` sets 2s auto-clear timer
- `hooks/useMergeOnSignIn.ts` - Extracted `fetchAndMergeToLocalStorage(uid): Promise<boolean>` as named export; `runMerge` now calls it then reloads
- `hooks/useSyncStatus.ts` - New hook returning `{ isOnline }` with online/offline events and throttled visibilitychange re-fetch using `VISIBILITY_COOLDOWN_MS = 5 * 60 * 1000`

## Decisions Made
- `onSyncComplete` kept out of `useEffect` dep array — adding it would reset the 30s debounce timer on every render cycle, breaking the debounce guarantee
- `SyncStatusProvider` receives `isOnline` as a prop rather than calling `useSyncStatus` internally — keeps the context pure (no data-fetching inside context) and lets the parent `AuthProvider` or `providers.tsx` wire up the hook
- `fetchAndMergeToLocalStorage` returns `boolean` so callers can decide whether to reload or just update state; `runMerge` uses it then reloads, visibility-change handler uses it silently

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript and ESLint both pass clean on all 4 modified/created files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All infrastructure hooks and context are ready for Plan 02 to wire into the 6 progress providers (`onSyncComplete` → `notifySaved`) and `SettingsDrawer` (consume `useSyncStatusContext` for saved/offline indicator)
- `useSyncStatus` needs to be called in `AuthProvider` or `providers.tsx` and its `isOnline` passed into `SyncStatusProvider`

---
*Phase: 28-polish*
*Completed: 2026-03-25*
