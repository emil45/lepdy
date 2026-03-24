---
phase: 26-cloud-write-path
plan: 01
subsystem: database
tags: [firebase, rtdb, react-hooks, typescript, cloud-sync]

# Dependency graph
requires:
  - phase: 24-firebase-auth-foundation
    provides: Firebase Auth foundation with useAuthContext() and cloudSyncEnabled flag
provides:
  - Debounced cloud sync hook (useProgressSync) for writing user progress to RTDB
  - Exported getFirebaseDatabase singleton for external hook consumption
  - Firebase RTDB security rules (database.rules.json) with owner-only user subtree
affects:
  - 26-02 (context-providers-sync) — consumes useProgressSync and getFirebaseDatabase

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Debounced RTDB write: JSON.stringify dep key + 30s setTimeout + dataRef pattern"
    - "Dynamic firebase/database import inside setTimeout callback prevents SSR errors"
    - "uid null-guard as complete no-op — signed-out users have zero Firebase interaction"

key-files:
  created:
    - hooks/useProgressSync.ts
    - database.rules.json
  modified:
    - lib/firebase.ts

key-decisions:
  - "30-second debounce: balances write cost vs data freshness for background progress sync"
  - "JSON.stringify(data) as useEffect dep key: avoids infinite re-renders from unstable object references (Research pitfall 1)"
  - "dataRef.current = data before effect: ensures timer callback always writes latest data even if dep hasn't changed"
  - "Dynamic import of getFirebaseDatabase inside setTimeout (not top-level) matches existing lib/firebase.ts pattern"

patterns-established:
  - "Debounce pattern: useRef timer + dataRef.current = data + serialized dep key"
  - "Firebase SSR safety: all firebase/database imports are dynamic, never top-level"

requirements-completed: [SYNC-01, SYNC-04, SYNC-05]

# Metrics
duration: 8min
completed: 2026-03-24
---

# Phase 26 Plan 01: Cloud Write Path — useProgressSync Hook Summary

**30-second debounced RTDB write hook with uid null-guard and dynamic firebase imports, plus owner-only RTDB security rules**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-24T22:30:51Z
- **Completed:** 2026-03-24T22:38:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `hooks/useProgressSync.ts` — reusable primitive that context providers call in Plan 02 to debounce cloud writes
- Exported `getFirebaseDatabase` from `lib/firebase.ts` so the hook can dynamically import it without circular deps
- Created `database.rules.json` with owner-only `users/$uid` access and preserved public leaderboard rules

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useProgressSync hook and export getFirebaseDatabase** - `8458b55` (feat)
2. **Task 1 lint fix: Remove spurious eslint-disable** - `c2b3c12` (fix)
3. **Task 2: Firebase RTDB security rules** - `961cb47` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `hooks/useProgressSync.ts` — Debounced RTDB write hook; no-op when uid is null; 30s debounce; dynamic firebase imports
- `lib/firebase.ts` — Added `export` keyword to `getFirebaseDatabase` (single-word change)
- `database.rules.json` — Firebase RTDB rules: leaderboard public, users/$uid owner-only

## Decisions Made

- **30s debounce:** Long enough to batch rapid state changes (typing, clicking) but short enough to persist before tab close on most devices
- **JSON.stringify dep key:** Object identity changes every render; string comparison is stable and cheap
- **dataRef pattern:** Ensures the timer callback always fires with the latest data even when serialized hasn't changed yet

## Deviations from Plan

None — plan executed exactly as written. The only unplanned action was removing a superfluous `eslint-disable` comment detected during lint check (Rule 1 auto-fix, single-line removal).

## User Setup Required

**Manual step required before Plan 02 can be tested end-to-end:**

Deploy `database.rules.json` to Firebase Console:
1. Go to [Firebase Console > Realtime Database > Rules](https://console.firebase.google.com/project/lepdy-c29da/database/lepdy-c29da-default-rtdb/rules)
2. Paste the contents of `database.rules.json`
3. Click "Publish"

Without this step, all writes to `users/$uid` will be rejected by the default deny-all rules.

## Next Phase Readiness

- `useProgressSync` is ready for Plan 02 to wire into context providers
- `getFirebaseDatabase` is exported and accessible
- Security rules file is ready to deploy (manual step above)
- No blockers for Plan 02

---
*Phase: 26-cloud-write-path*
*Completed: 2026-03-24*
