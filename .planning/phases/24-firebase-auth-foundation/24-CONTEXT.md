# Phase 24: Firebase Auth Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Auth infrastructure exists in the app so every other sync feature has a signed-in user to work with. Delivers: useAuthContext() hook, signInWithGoogle() with redirect/popup strategy, cloudSyncEnabled feature flag gating, SSR-safe lazy loading, and COPPA-framed sign-in copy constants.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/firebaseApp.ts` — lazy-loaded Firebase app singleton with `getFirebaseApp()` (dynamic import pattern)
- `lib/firebase.ts` — lazy-loaded RTDB with `getFirebaseDatabase()`, same pattern to follow for Auth
- `lib/featureFlags/types.ts` — FeatureFlags interface, add `cloudSyncEnabled` here
- `contexts/FeatureFlagContext.tsx` — existing provider pattern with `useFeatureFlagContext()` hook
- `app/providers.tsx` — provider nesting order (FeatureFlagProvider is outermost after theme)

### Established Patterns
- Lazy dynamic imports for Firebase modules (prevents SSR issues)
- Context + hook pattern: create context, export provider and `use*Context()` hook with error validation
- Feature flags: add to interface → add default → add to fetchFlags() → configure in Firebase console
- All contexts nested in `app/providers.tsx`

### Integration Points
- New `AuthProvider` wraps inside `FeatureFlagProvider` (needs feature flag to gate auth)
- New `cloudSyncEnabled` flag in `lib/featureFlags/types.ts`
- Auth lazy-loaded via `lib/firebaseAuth.ts` (new file, same pattern as firebaseApp.ts)
- COPPA copy in translation files `messages/{he,en,ru}.json`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
