# Phase 26: Cloud Write Path - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Authenticated users' progress is continuously mirrored to Firebase so it is never lost. Delivers: debounced write-through from localStorage to Firebase RTDB, offline queueing, signed-out user isolation (zero behavior change), and Firebase security rules for user data isolation.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/firebase.ts` — lazy-loaded `getFirebaseDatabase()` singleton for RTDB access
- `lib/firebaseAuth.ts` — `getFirebaseAuth()` singleton (Phase 24)
- `contexts/AuthContext.tsx` — `useAuthContext()` returns `{ user, loading, signInWithGoogle, signOut }` (Phase 24)
- `hooks/useCategoryProgress.ts` — existing localStorage progress tracking (letters, numbers, animals, etc.)
- `hooks/useStreak.ts` — existing streak state management with localStorage
- `contexts/FeatureFlagContext.tsx` — `getFlag('cloudSyncEnabled')` gates sync features

### Established Patterns
- Progress stored in localStorage via `useCategoryProgress` pattern: `heardItemIds`, `totalClicks`, storage key per category
- Streak stored in localStorage via `useStreak`: `streakData` with `currentStreak`, `bestStreak`, dates
- Firebase RTDB already used for leaderboards (`lib/firebase.ts` with `getFirebaseDatabase()`)
- All context providers nested in `app/providers.tsx`

### Integration Points
- Write-through hooks need to intercept `recordItemHeard()` calls in existing progress hooks
- `useAuthContext().user?.uid` provides the Firebase user ID for RTDB path
- Firebase RTDB path: `users/{uid}/progress/{category}` (standard pattern)
- Firebase security rules in `database.rules.json` or Firebase console

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
