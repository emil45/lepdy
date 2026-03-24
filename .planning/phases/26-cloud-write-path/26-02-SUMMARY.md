---
phase: 26-cloud-write-path
plan: 02
subsystem: database
tags: [firebase, rtdb, react-contexts, cloud-sync, typescript]

# Dependency graph
requires:
  - phase: 26-cloud-write-path
    plan: 01
    provides: useProgressSync hook and getFirebaseDatabase singleton
  - phase: 24-firebase-auth-foundation
    provides: Firebase Auth foundation with useAuthContext() hook
provides:
  - Letters progress synced to RTDB at users/{uid}/progress/letters
  - Numbers progress synced to RTDB at users/{uid}/progress/numbers
  - Animals progress synced to RTDB at users/{uid}/progress/animals
  - Games progress synced to RTDB at users/{uid}/progress/games
  - Word collection synced to RTDB at users/{uid}/progress/words
  - Streak data synced to RTDB at users/{uid}/streak
affects:
  - 27 (merge-on-login) — all 6 cloud paths are now populated; merge phase can read them

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Category-specific Set field names (heardLetterIds, heardNumberIds, heardAnimalIds) must be used — generic heardItemIds is internal to useCategoryProgress"
    - "useMemo wraps syncData object to prevent unstable reference triggering JSON.stringify on every render"
    - "Streak syncs directly as state object — no useMemo needed since streakData is a useState reference"

key-files:
  modified:
    - contexts/LettersProgressContext.tsx
    - contexts/NumbersProgressContext.tsx
    - contexts/AnimalsProgressContext.tsx
    - contexts/GamesProgressContext.tsx
    - contexts/WordCollectionContext.tsx
    - contexts/StreakContext.tsx

key-decisions:
  - "Use category-specific Set field names from each hook's return type rather than generic heardItemIds — the generic name is internal to useCategoryProgress and not re-exported"
  - "Streak path is 'streak' not 'progress/streak' — streak is conceptually separate from item-heard progress for cleaner Phase 27 merge"
  - "No useMemo for StreakContext — streakData is a useState<StreakData> reference, already stable between updates"

requirements-completed: [SYNC-01, SYNC-04]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 26 Plan 02: Context Providers Sync Summary

**useProgressSync wired into all 6 context providers — authenticated users' progress syncs to Firebase RTDB for letters, numbers, animals, games, words, and streak**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-24T22:38:00Z
- **Completed:** 2026-03-24T22:43:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Wired `useProgressSync` into `LettersProgressContext`, `NumbersProgressContext`, and `AnimalsProgressContext` — each converts the category-specific Set to an Array and passes it with `totalClicks` under `progress/{category}`
- Wired `useProgressSync` into `GamesProgressContext` — serializes all 8 fields including `Array.from(completedGameTypes)` under `progress/games`
- Wired `useProgressSync` into `WordCollectionContext` — passes `collectedWords` + `totalWordsBuilt` under `progress/words`
- Wired `useProgressSync` into `StreakContext` — passes `streakData` directly (stable `useState` reference) under `streak`
- All 6 providers read `user?.uid` from `useAuthContext`; null uid = zero Firebase interaction

## Task Commits

1. **Task 1: Wire useProgressSync into Letters, Numbers, Animals contexts** — `e4a8d9d`
2. **Task 2: Wire useProgressSync into Games, WordCollection, Streak contexts** — `c78226a`

## Files Modified

- `contexts/LettersProgressContext.tsx` — Added useProgressSync + useAuthContext, useMemo syncData with heardLetterIds array
- `contexts/NumbersProgressContext.tsx` — Added useProgressSync + useAuthContext, useMemo syncData with heardNumberIds array
- `contexts/AnimalsProgressContext.tsx` — Added useProgressSync + useAuthContext, useMemo syncData with heardAnimalIds array
- `contexts/GamesProgressContext.tsx` — Added useProgressSync + useAuthContext, useMemo syncData with all 8 GamesProgressData fields
- `contexts/WordCollectionContext.tsx` — Added useProgressSync + useAuthContext, useMemo syncData with collectedWords + totalWordsBuilt
- `contexts/StreakContext.tsx` — Added useProgressSync + useAuthContext, passes streakData directly (no useMemo needed)

## Decisions Made

- **Category-specific field names:** `UseLettersProgressReturn` exposes `heardLetterIds`, not `heardItemIds` — the generic name is internal to `useCategoryProgress`. Discovered during TypeScript check. Applied fix (Rule 1 deviation).
- **Streak path:** `streak` not `progress/streak` — keeps streak conceptually separate from item-heard progress for cleaner Phase 27 merge logic
- **No useMemo for StreakContext:** `streakData` is a `useState<StreakData>` object — same reference between renders until `setStreakData` fires, so no wrapper needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected category-specific Set field names**
- **Found during:** Task 1 TypeScript verification
- **Issue:** Plan instructions used generic `heardItemIds` field name, but `UseLettersProgressReturn`, `UseNumbersProgressReturn`, and `UseAnimalsProgressReturn` expose category-specific names (`heardLetterIds`, `heardNumberIds`, `heardAnimalIds`) — `heardItemIds` is internal to `useCategoryProgress`
- **Fix:** Updated useMemo references in all three contexts to use the correct field names from each hook's return type
- **Files modified:** `contexts/LettersProgressContext.tsx`, `contexts/NumbersProgressContext.tsx`, `contexts/AnimalsProgressContext.tsx`
- **Commits:** Included in Task 1 commit `e4a8d9d`

## Phase 26 Complete

With Plan 02 complete, Phase 26 (cloud-write-path) is fully implemented:
- Plan 01: `useProgressSync` hook + `getFirebaseDatabase` export + RTDB security rules
- Plan 02: All 6 context providers wired to use `useProgressSync`

When a user signs in, all progress changes will be debounced and written to `users/{uid}/` in Firebase RTDB within 30 seconds. Signed-out users experience zero behavior change.

**Next phase readiness:**
- Phase 27 (merge-on-login) can now read from the 6 RTDB paths and merge with localStorage on first sign-in
- All RTDB paths are populated: `progress/letters`, `progress/numbers`, `progress/animals`, `progress/games`, `progress/words`, `streak`

---
*Phase: 26-cloud-write-path*
*Completed: 2026-03-24*
