# Phase 27: Cloud Read and Merge - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Signing in on a new device loads existing progress, and first-time sign-in never loses locally-earned progress. Delivers: cloud read on sign-in, union merge strategy (most progress wins), one-time merge per sign-in transition, localStorage update after merge.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/useProgressSync.ts` — debounced write-through hook (Phase 26), knows RTDB paths
- `lib/firebase.ts` — `getFirebaseDatabase()` export for RTDB access (Phase 26)
- `contexts/AuthContext.tsx` — `useAuthContext()` returns `{ user, loading }` with sign-in state transitions
- All 6 context providers already have `useProgressSync` wired in (Phase 26)
- `hooks/useCategoryProgress.ts` — localStorage read/write for category progress

### Established Patterns
- Progress stored in localStorage: `heardItemIds` (Set), `totalClicks` (number) per category
- Streak stored in localStorage: `streakData` with `currentStreak`, `bestStreak`, dates
- Firebase RTDB paths: `users/{uid}/progress/{category}`, `users/{uid}/streak`
- Dynamic imports for Firebase modules (SSR-safe)

### Integration Points
- Merge hook needs to trigger on `user` state transition (null → User object) in AuthContext
- After merge, update localStorage so existing context providers pick up merged data
- Merge result feeds into existing `useProgressSync` (which will then write merged data back to cloud)
- `sessionStorage` can track "already merged this session" to prevent repeated merges

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
