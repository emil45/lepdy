# Phase 28: Polish - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Parents get clear, unobtrusive feedback about sync status and can trust their child's progress is safe. Delivers: "saved" indicator after cloud writes, "saved locally" offline note, and visibility-change re-fetch for cross-device sync.

</domain>

<decisions>
## Implementation Decisions

### Sync Status Indicator Style
- Small caption text below auth section in settings drawer — `<Typography variant="caption" color="success.main">` with checkmark icon, 2s fade out
- Offline indicator uses same caption area with amber/warning color — `color="warning.main"` with offline icon
- Simple opacity fade for transitions — CSS `opacity 0.3s`, no MUI animation library
- Positioned between auth divider and language section in the drawer

### Sync State Management
- Sync write success detected via callback from `useProgressSync` — add optional `onSyncComplete` callback to existing hook
- Offline status detected via `navigator.onLine` + `online`/`offline` event listeners — built-in browser API
- Visibility change triggers re-fetch via `document.addEventListener('visibilitychange')` in auth context area
- Tab return does full merge using `useMergeOnSignIn` logic — but skip reload, update localStorage + contexts directly

### Translations & Edge Cases
- Translation keys: `home.cloudSync.saved`, `home.cloudSync.savedLocally` — extends existing `home.cloudSync` namespace
- On sign-out: immediately hide all sync indicators — auth section disappears, status goes with it
- Sync indicators only show for authenticated users with `cloudSyncEnabled` flag on — no indicators for signed-out users
- Visibility-change re-fetch throttled to 5 minute cooldown — prevents excessive RTDB reads on rapid tab switching

### Claude's Discretion
- Exact icon choices for checkmark and offline indicators
- CSS transition timing details beyond the 0.3s opacity fade
- Error handling for failed re-fetch on visibility change

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/useProgressSync.ts` — debounced RTDB write hook (Phase 26), needs `onSyncComplete` callback addition
- `hooks/useMergeOnSignIn.ts` — merge logic (Phase 27), re-fetch on visibility change can reuse this
- `components/SettingsDrawer.tsx` — auth section already in place (Phase 25)
- `contexts/AuthContext.tsx` — `useAuthContext()` with user state
- `messages/{he,en,ru}.json` — `home.cloudSync.*` namespace already has sign-in/sign-out keys

### Established Patterns
- Settings drawer uses `<Typography variant="caption">` for secondary info
- `<Divider sx={{ my: 2 }} />` separates sections
- RTL alignment via `direction === 'rtl'` checks
- Feature flag gating via `getFlag('cloudSyncEnabled')`

### Integration Points
- `useProgressSync` — add `onSyncComplete` callback parameter
- `SettingsDrawer.tsx` — add sync status display below auth section
- `useMergeOnSignIn` — extract merge logic for visibility-change re-fetch (without reload)
- Translation files — add `home.cloudSync.saved` and `home.cloudSync.savedLocally`

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decided indicator style, state management, and translation choices above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
