# Phase 25: Sign-In UI - Research

**Researched:** 2026-03-24
**Domain:** MUI Settings Drawer, Firebase Auth state consumption, RTL UI
**Confidence:** HIGH

## Summary

Phase 25 is a pure UI integration task. All auth logic (sign-in, sign-out, state) was built in Phase 24 and is already wired into the app via `useAuthContext()`. This phase adds one new section to `SettingsDrawer.tsx` that reads from that context and renders three states: loading skeleton, signed-out (Google button), and signed-in (avatar + name + sign-out button).

All MUI components needed (`Avatar`, `Skeleton`, `Button`, `Box`, `Typography`, `Divider`) are already imported in the project or available from `@mui/material` v7.3.7. `@mui/icons-material/Google` is confirmed present in `node_modules`. All three translation files already contain the `home.cloudSync.*` keys from Phase 24, including all copy for sign-in, sign-out, signed-in-as, and parent note.

The CONTEXT.md refers to keys `home.cloudSync.signIn` and `home.cloudSync.signOut` in shorthand but the actual keys in `messages/{he,en,ru}.json` are `home.cloudSync.signInButton` and `home.cloudSync.signOutButton`. The planner MUST use the actual keys from the message files.

**Primary recommendation:** Edit `SettingsDrawer.tsx` to add a single auth section block after the streak display and before the language divider, consuming `useAuthContext()` and `useFeatureFlagContext()`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Auth section appears below streak display, above language section
- Divider above and below auth section — matches existing streak/language pattern
- Compact layout — avatar+name on one line, button below
- Same visual style as other settings sections — pastel background, secondary.main text, consistent look
- MUI outlined button with Google icon from @mui/icons-material — matches existing button style in drawer
- Button text uses COPPA translation keys from Phase 24 (`home.cloudSync.signIn`) — framed as parent action
- Sign-out uses text button (no outline) — less prominent, de-emphasizes destructive action
- Loading state uses MUI `<Skeleton>` placeholder for avatar + text — no flash, smooth appearance
- 32px circle avatar — compact, matches drawer density
- Display name only shown next to avatar — clean, sufficient to confirm identity
- Single row layout: [Avatar] [Name] ... [Sign Out text button] — efficient use of space
- Fallback when no Google photo: MUI Avatar with first letter of name — standard MUI pattern

### Claude's Discretion
- Exact spacing values (margin/padding) within auth section
- Error state handling (if sign-in fails)
- Animation/transition when switching between signed-in/signed-out states

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Parent can sign in with Google account from settings sidebar | `signInWithGoogle()` from `useAuthContext()` is the handler; render `<Button variant="outlined" startIcon={<GoogleIcon />}>`; call on click |
| AUTH-02 | Parent can sign out from settings sidebar | `signOut()` from `useAuthContext()` is the handler; render `<Button variant="text">` when `user !== null` |
| AUTH-03 | User can see their Google avatar and name in settings when signed in | `user.photoURL` → `<Avatar src={photoURL} />`, fallback to `user.displayName[0]`; `user.displayName` as `<Typography>` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | 7.3.7 | Avatar, Skeleton, Button, Box, Typography, Divider | Already the design system; all needed components present |
| @mui/icons-material | 7.3.7 | Google icon for sign-in button | Already installed; `/Google` export confirmed present |
| next-intl | 4.7.0 | `useTranslations()` for cloudSync keys | Project i18n standard; keys already exist in all 3 locales |

No new packages are required. This phase is purely additive UI.

**Version verification:** Confirmed via `package.json` and `node_modules` inspection on 2026-03-24.

## Architecture Patterns

### Recommended Project Structure

No new files are needed. One existing component is edited:

```
components/
└── SettingsDrawer.tsx    # Add auth section block here
```

### Pattern 1: Feature-Flag-Gated Section Block

**What:** Wrap the entire auth section in `{cloudSyncEnabled && (...)}` so no auth UI renders when the flag is off — consistent with how Phase 24 zeroed out Firebase activity.

**When to use:** Any UI tied to the `cloudSyncEnabled` flag.

**Example (structure only, spacing at Claude's discretion):**
```tsx
// Source: existing SettingsDrawer streak section pattern
{cloudSyncEnabled && (
  <>
    <Divider sx={{ my: 2 }} />
    {/* auth section content */}
    <Divider sx={{ my: 2 }} />
  </>
)}
```

### Pattern 2: Three-State Auth Render

**What:** Single block with three branches keyed off `loading` and `user`.

```tsx
// Source: useAuth.ts — loading starts true, resolves after onAuthStateChanged fires
const { user, loading, signInWithGoogle, signOut } = useAuthContext();

if (loading) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="text" width={120} />
    </Box>
  );
}

if (!user) {
  return (
    <Button
      variant="outlined"
      size="medium"
      startIcon={<GoogleIcon />}
      onClick={signInWithGoogle}
    >
      {t('home.cloudSync.signInButton')}
    </Button>
  );
}

return (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Avatar src={user.photoURL ?? undefined} sx={{ width: 32, height: 32 }}>
      {user.displayName?.[0] ?? '?'}
    </Avatar>
    <Typography variant="body2" color="secondary.main" sx={{ flex: 1 }}>
      {user.displayName}
    </Typography>
    <Button variant="text" size="small" onClick={signOut}>
      {t('home.cloudSync.signOutButton')}
    </Button>
  </Box>
);
```

### Pattern 3: RTL Alignment in Drawer

**What:** The drawer already uses `direction === 'rtl' ? 'flex-end' : 'flex-start'` for alignment. The auth section must follow the same pattern.

**When to use:** Any text or button elements within the settings drawer.

```tsx
// Source: SettingsDrawer.tsx lines 190-215
sx={{ textAlign: direction === 'rtl' ? 'right' : 'left', width: '100%' }}
```

### Anti-Patterns to Avoid

- **Importing `useAuth` directly in SettingsDrawer:** Always use `useAuthContext()` — it's the public API. Direct hook usage bypasses the context layer.
- **Calling `useAuthContext()` unconditionally when flag is off:** The context is always available (AuthProvider wraps the whole app), but the Skeleton would flash even when cloudSync is off. Gate with `cloudSyncEnabled` check first.
- **Using `home.cloudSync.signIn` or `home.cloudSync.signOut` as translation keys:** These are shorthand from CONTEXT.md. The actual keys in `messages/*.json` are `home.cloudSync.signInButton` and `home.cloudSync.signOutButton`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Avatar with fallback letter | Custom avatar component | MUI `<Avatar src={...}>` with text child | MUI Avatar natively shows text fallback when src is absent/fails; handles image load errors |
| Loading placeholder | Custom CSS shimmer | MUI `<Skeleton>` | Handles animation, theming, RTL without custom CSS |
| Google icon in button | SVG inline or image | `@mui/icons-material/Google` | Already installed, tree-shaken, consistent sizing with MUI Button `startIcon` |

## Common Pitfalls

### Pitfall 1: Stale Translation Key Names
**What goes wrong:** Using `home.cloudSync.signIn` (shorthand) instead of `home.cloudSync.signInButton` throws a next-intl key-not-found error in development.
**Why it happens:** CONTEXT.md described keys conceptually, but Phase 24 named them with `Button` suffix.
**How to avoid:** Use exact keys: `home.cloudSync.signInButton`, `home.cloudSync.signOutButton`, `home.cloudSync.signedInAs`, `home.cloudSync.parentNote`.
**Warning signs:** next-intl logs a warning and renders the key path as the visible string.

### Pitfall 2: `signedInAs` Key Uses a Named Param
**What goes wrong:** `t('home.cloudSync.signedInAs')` renders the literal string `"Signed in as {name}"` — the interpolation is missing.
**Why it happens:** The key uses `{name}` as an ICU message placeholder.
**How to avoid:** Use `t('home.cloudSync.signedInAs', { name: user.displayName })`. But per CONTEXT.md the design shows display name separately from the label — so this key may not be needed in the drawer layout at all (avatar + name is sufficient). Clarify at plan time.
**Warning signs:** Curly-brace placeholder visible in rendered UI.

### Pitfall 3: `photoURL` is `string | null` on Firebase User
**What goes wrong:** `<Avatar src={user.photoURL}>` gets `null` passed to `src`, which renders broken avatar instead of fallback letter.
**Why it happens:** TypeScript `User.photoURL` is typed `string | null`, not `string | undefined`.
**How to avoid:** Pass `src={user.photoURL ?? undefined}` — converting `null` to `undefined` makes MUI Avatar fall back to the text child.

### Pitfall 4: `displayName` May Be Null
**What goes wrong:** `user.displayName[0]` throws if `displayName` is `null` (possible for some Google accounts).
**Why it happens:** Firebase `User.displayName` is typed `string | null`.
**How to avoid:** Use `user.displayName?.[0] ?? '?'` as the Avatar fallback character.

### Pitfall 5: Sign-Out Button Placement in RTL
**What goes wrong:** In RTL the sign-out text button appears on the wrong side if layout uses `flex` without explicit direction awareness.
**Why it happens:** `flex: 1` on the name Typography pushes sign-out to the end — which is visually correct in both LTR and RTL when using `flexDirection: row`. No extra work needed, but verify by testing Hebrew locale.
**Warning signs:** Sign-out appears on the avatar side rather than the far end.

## Code Examples

Verified patterns from official sources:

### MUI Avatar with fallback
```tsx
// Source: MUI Avatar docs — text fallback when src absent or fails to load
<Avatar src={user.photoURL ?? undefined} sx={{ width: 32, height: 32 }}>
  {user.displayName?.[0] ?? '?'}
</Avatar>
```

### MUI Skeleton for loading state
```tsx
// Source: MUI Skeleton docs — circular and text variants
<Skeleton variant="circular" width={32} height={32} />
<Skeleton variant="text" width={120} height={20} />
```

### Translation key reference (confirmed from messages/he.json)
```
home.cloudSync.signInButton     → "התחברות עם Google (להורים בלבד)"
home.cloudSync.signOutButton    → "התנתקות"
home.cloudSync.signedInAs       → "מחובר/ת בתור {name}"   (ICU param)
home.cloudSync.parentNote       → full COPPA note string
home.cloudSync.signInTitle      → section heading
home.cloudSync.signInDescription → descriptor text
```

### Accessing auth from context
```tsx
// Source: contexts/AuthContext.tsx — returns UseAuthReturn
const { user, loading, signInWithGoogle, signOut } = useAuthContext();
```

### Accessing feature flag
```tsx
// Source: contexts/FeatureFlagContext.tsx — standard getFlag pattern
const { getFlag } = useFeatureFlagContext();
const cloudSyncEnabled = getFlag('cloudSyncEnabled');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Build Firebase auth inline in component | Consume pre-built `useAuthContext()` | Phase 24 | No auth logic in this phase at all |

## Open Questions

1. **Does the CONTEXT.md layout include `parentNote` / `signInDescription`?**
   - What we know: These translation keys exist and carry COPPA compliance copy. The CONTEXT.md layout shows only button + avatar row.
   - What's unclear: Whether the small COPPA note should appear in the drawer below the button.
   - Recommendation: Omit parentNote from the drawer — it was likely intended for a modal or dedicated sign-in screen, not the compact drawer layout. Sign-in is already framed as a parent action via the button text.

2. **Should sign-in errors be shown in the drawer?**
   - What we know: CONTEXT.md lists error state as Claude's Discretion.
   - What's unclear: What error states are realistic (popup blocked on iOS is already handled via redirect; network errors are rare).
   - Recommendation: Catch `signInWithGoogle()` errors and render a small `Typography color="error"` below the button. Keep it minimal — one line.

## Environment Availability

Step 2.6: SKIPPED — phase has no new external dependencies. Firebase Auth and MUI already installed and used in production.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Settings drawer shows sign-in button when not signed in | smoke | `npm test` (drawer render, flag=false so button not visible in default) | ✅ (drawer loads via homepage test) |
| AUTH-02 | Sign-out button visible when signed in | manual-only | N/A — requires live Google OAuth flow | N/A |
| AUTH-03 | Avatar and name visible when signed in | manual-only | N/A — requires live Google OAuth flow | N/A |

AUTH-02 and AUTH-03 require a real Google sign-in which cannot be automated in Playwright without OAuth credential injection or Firebase Auth emulation. These are validated manually by enabling the `cloudSyncEnabled` flag in Firebase console and running through the sign-in flow.

The existing Playwright test confirms the homepage loads without crashes. No new automated test file is needed for this phase — the CLAUDE.md says: "When NOT to add tests: Styling changes" and the auth section is invisible behind a feature flag at test time.

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers smoke validation. Manual sign-in testing required for AUTH-02 and AUTH-03 but no new test file needed.

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `components/SettingsDrawer.tsx` — existing drawer structure and patterns
- Direct file inspection: `contexts/AuthContext.tsx`, `hooks/useAuth.ts` — exact API surface
- Direct file inspection: `messages/he.json`, `messages/en.json`, `messages/ru.json` — confirmed translation keys and values
- Direct file inspection: `lib/featureFlags/types.ts` — `cloudSyncEnabled` flag confirmed
- `node_modules/@mui/icons-material/Google.js` — confirmed present

### Secondary (MEDIUM confidence)
- MUI 7.x Avatar docs: `src` + text child fallback behavior is standard and stable across MUI v5-v7
- MUI 7.x Skeleton docs: `variant="circular"` and `variant="text"` are stable API

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed present in node_modules
- Architecture: HIGH — editing one known file with an established pattern
- Pitfalls: HIGH — sourced from TypeScript type signatures (`User.photoURL: string | null`) and next-intl behavior

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack, no fast-moving dependencies in this phase)
