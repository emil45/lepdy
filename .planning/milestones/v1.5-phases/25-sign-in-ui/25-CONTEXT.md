# Phase 25: Sign-In UI - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Parents can sign in and sign out from the settings drawer and see their account state. Delivers: Google sign-in button, sign-out button, avatar+name display, loading skeleton, all gated behind cloudSyncEnabled feature flag, with translations in all 3 locales.

</domain>

<decisions>
## Implementation Decisions

### Auth Section Placement & Layout
- Auth section appears below streak display, above language section (parents see it early but streak stays top)
- Divider above and below auth section — matches existing streak/language pattern
- Compact layout — avatar+name on one line, button below
- Same visual style as other settings sections — pastel background, secondary.main text, consistent look

### Sign-In Button & Google Branding
- MUI outlined button with Google icon from @mui/icons-material — matches existing button style in drawer
- Button text uses COPPA translation keys from Phase 24 (`home.cloudSync.signIn`) — framed as parent action
- Sign-out uses text button (no outline) — less prominent, de-emphasizes destructive action
- Loading state uses MUI `<Skeleton>` placeholder for avatar + text — no flash, smooth appearance

### Signed-In State Display
- 32px circle avatar — compact, matches drawer density
- Display name only shown next to avatar — clean, sufficient to confirm identity
- Single row layout: [Avatar] [Name] ... [Sign Out text button] — efficient use of space
- Fallback when no Google photo: MUI Avatar with first letter of name — standard MUI pattern

### Claude's Discretion
- Exact spacing values (margin/padding) within auth section
- Error state handling (if sign-in fails)
- Animation/transition when switching between signed-in/signed-out states

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/SettingsDrawer.tsx` — existing drawer with language buttons and streak display, 300px wide, beigePastel background
- `contexts/AuthContext.tsx` — `useAuthContext()` returns `{ user, loading, signInWithGoogle, signOut }` (Phase 24)
- `hooks/useAuth.ts` — feature-flag-gated auth hook (Phase 24)
- `messages/{he,en,ru}.json` — `home.cloudSync.*` COPPA-framed translation keys already exist (Phase 24)
- `contexts/FeatureFlagContext.tsx` — `useFeatureFlagContext()` with `getFlag('cloudSyncEnabled')`

### Established Patterns
- Settings drawer uses `useDirection()` for RTL/LTR alignment
- Buttons use MUI `variant="outlined"` or `variant="contained"` with `size="medium"`
- Sections separated by `<Divider sx={{ my: 2 }} />`
- Text uses `color="secondary.main"` or `color="primary.light"`
- RTL alignment via `textAlign: direction === 'rtl' ? 'right' : 'left'`

### Integration Points
- `useAuthContext()` provides all auth state and actions
- `useFeatureFlagContext().getFlag('cloudSyncEnabled')` gates entire auth section visibility
- Translation keys: `home.cloudSync.signIn`, `home.cloudSync.signOut`, `home.cloudSync.parentNote`
- MUI `<Avatar>`, `<Skeleton>`, `<Button>` components
- Google icon: `@mui/icons-material/Google`

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decided layout and styling choices above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
