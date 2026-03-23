# Phase 24: Firebase Auth Foundation - Research

**Researched:** 2026-03-24
**Domain:** Firebase Authentication (Google Sign-In), React Context, SSR-safe lazy loading, feature flag gating
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None locked — all implementation choices are at Claude's discretion (pure infrastructure phase).

### Claude's Discretion
All implementation choices at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-04 | Auth UI is gated behind `cloudSyncEnabled` Firebase Remote Config flag | Feature flag section: add `cloudSyncEnabled: boolean` to FeatureFlags interface, default `false`; AuthProvider reads flag to conditionally expose sign-in |
| AUTH-05 | Sign-in uses redirect fallback when popup is blocked (iOS Safari) | iOS Safari detection via `navigator.userAgent`; `signInWithRedirect` on iOS, `signInWithPopup` on desktop; `next.config.ts` rewrite for `/__/auth/:path*` to make redirect work on Safari 16.1+ |
| AUTH-06 | Sign-in UI is framed as a parent action for COPPA compliance | COPPA copy constants in translation files under `home.cloudSync.*`; copy explicitly says this is a parent action, not for children |
</phase_requirements>

---

## Summary

This phase builds the auth infrastructure that all cloud sync features depend on. The deliverables are: a `lib/firebaseAuth.ts` lazy-loading singleton (identical pattern to `lib/firebase.ts`), a `contexts/AuthContext.tsx` provider exposing `{ user, loading }`, a `hooks/useAuth.ts` hook, the `cloudSyncEnabled` feature flag, and COPPA-framed sign-in copy in all three locale message files.

The most significant technical constraint is the iOS Safari popup issue. Popups are blocked by iOS Safari (and by iOS in general when the app is added to the home screen), so the sign-in function must detect the platform and choose between `signInWithPopup` (desktop) and `signInWithRedirect` (iOS). The redirect path also requires a `next.config.ts` rewrite to proxy `/__/auth/:path*` to `https://lepdy-c29da.firebaseapp.com/__/auth/:path*` — without this proxy, Safari 16.1+ blocks the cross-domain redirect due to third-party cookie restrictions.

The SSR safety requirement is solved by the existing codebase pattern: Firebase Auth must only be imported inside async functions behind a `typeof window === 'undefined'` guard or via dynamic `import()`. The codebase already does this for `lib/firebase.ts` (RTDB) and `lib/featureFlags` providers. The new `lib/firebaseAuth.ts` follows the same pattern.

**Primary recommendation:** Create `lib/firebaseAuth.ts` following the `lib/firebase.ts` singleton pattern, wire `AuthProvider` inside `FeatureFlagProvider` in `app/providers.tsx`, add `cloudSyncEnabled` to the feature flag system, add a `/__/auth/:path*` rewrite in `next.config.ts`, and add COPPA copy constants to all three message files under `home.cloudSync`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/auth | 12.8.0 (installed) | Google Sign-In, auth state observation | Already in project; same Firebase SDK used for RTDB and Remote Config |
| React Context + hook | React 19.2.3 | Auth state distribution | Project-wide pattern for all cross-cutting state (StreakContext, FeatureFlagContext, etc.) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-intl | 4.7.0 (installed) | COPPA copy in translation files | All user-facing strings go through next-intl translation files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `lib/firebaseAuth.ts` singleton | Direct import in AuthContext | Singleton prevents SSR import; matches existing codebase pattern |
| iOS detection via user agent | `signInWithPopup` try/catch on popup failure | User agent detection is synchronous; try/catch requires async wait for failure which degrades UX |

**Installation:** No new packages needed — `firebase` 12.8.0 is already installed with auth module.

**Version verification:** Firebase 12.8.0 (confirmed via `npm view firebase version`). Exports `signInWithPopup`, `signInWithRedirect`, `getAuth`, `initializeAuth`, `onAuthStateChanged`, `signOut`, `GoogleAuthProvider`, `browserPopupRedirectResolver`, `indexedDBLocalPersistence`, `browserLocalPersistence` — all confirmed present via Node.js introspection.

---

## Architecture Patterns

### Recommended Project Structure

New files this phase creates:
```
lib/
└── firebaseAuth.ts         # Lazy-loaded Auth singleton (mirrors lib/firebase.ts)

contexts/
└── AuthContext.tsx          # AuthProvider + useAuthContext() hook

hooks/
└── useAuth.ts              # Auth state hook (mirrors useStreak.ts pattern)
```

Modified files:
```
lib/featureFlags/types.ts                            # Add cloudSyncEnabled flag
lib/featureFlags/providers/firebaseRemoteConfig.ts   # Add cloudSyncEnabled to fetchFlags()
app/providers.tsx                                    # Add AuthProvider
next.config.ts                                       # Add /__/auth/:path* rewrite
messages/{he,en,ru}.json                             # Add cloudSync section with COPPA copy
```

### Pattern 1: Firebase Auth Lazy Singleton

Mirrors `lib/firebase.ts`. Never imported at module scope — always via async call inside a `useEffect` or async function.

```typescript
// lib/firebaseAuth.ts
import type { Auth } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';

let auth: Auth | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const app = await getFirebaseApp();
    const { getAuth } = await import('firebase/auth');
    auth = getAuth(app);
  }
  return auth;
}
```

Confidence: HIGH — directly mirrors the verified `lib/firebase.ts` pattern in this codebase.

### Pattern 2: AuthContext + useAuthContext Hook

Mirrors `StreakContext.tsx` / `FeatureFlagContext.tsx`. Provider wraps `useAuth()` hook; consumer hook throws if used outside provider.

```typescript
// contexts/AuthContext.tsx
'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from '@/hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authValue = useAuth();
  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
```

Confidence: HIGH — exact pattern used by all existing context providers.

### Pattern 3: useAuth Hook with Three Auth States

```typescript
// hooks/useAuth.ts
'use client';
import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      if (typeof window === 'undefined') return;
      const { getFirebaseAuth } = await import('@/lib/firebaseAuth');
      const { onAuthStateChanged } = await import('firebase/auth');
      const auth = await getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    };

    init();
    return () => unsubscribe?.();
  }, []);

  const signInWithGoogle = async () => { /* see Pattern 4 */ };
  const signOut = async () => { /* lazy-load and call firebase signOut */ };

  return { user, loading, signInWithGoogle, signOut };
}
```

The three states the hook produces:
- `loading: true, user: null` — initial state before Firebase Auth resolves
- `loading: false, user: null` — unauthenticated
- `loading: false, user: User` — authenticated

Confidence: HIGH — standard Firebase Auth `onAuthStateChanged` pattern, verified against Firebase SDK 12.8.0 exports.

### Pattern 4: Popup vs Redirect iOS Detection

iOS Safari (and iOS in general) blocks popups. The correct strategy per success criteria is: **popup on desktop, redirect on iOS Safari**.

```typescript
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

async function signInWithGoogle(): Promise<void> {
  const { getFirebaseAuth } = await import('@/lib/firebaseAuth');
  const {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    browserPopupRedirectResolver,
  } = await import('firebase/auth');

  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();

  if (isIOS()) {
    await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
  } else {
    await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  }
}
```

**Critical:** `getRedirectResult()` must be called on app load to complete the redirect flow (the user returns to the app after Google auth). `onAuthStateChanged` will fire automatically after `getRedirectResult()` resolves, so no separate handling is needed for auth state — but `getRedirectResult` must be called to avoid the redirect result being discarded.

```typescript
// In useAuth's useEffect, after setting up onAuthStateChanged:
const { getRedirectResult } = await import('firebase/auth');
try {
  await getRedirectResult(auth);
} catch (e) {
  // Ignore — not a redirect flow
}
```

Confidence: MEDIUM — iOS detection via user agent is a widely-used pattern; the `getRedirectResult` requirement is documented Firebase behavior. The exact user agent string for iOS Safari is stable.

### Pattern 5: next.config.ts Rewrite for Safari Redirect

Safari 16.1+ blocks Firebase Auth redirect because it redirects to `lepdy-c29da.firebaseapp.com` (a different domain), which fails third-party cookie checks. The fix is a Next.js rewrite that proxies the `/__/auth/` path from the app's own domain to Firebase's domain:

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://lepdy-c29da.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
```

This makes the redirect appear to come from the same domain (`lepdy.com/__/auth/...`) so Safari's third-party cookie restriction does not apply.

Confidence: MEDIUM — This is the official Firebase recommendation for apps not hosted on Firebase Hosting. Verified via the codejam.info article (2024, Next.js-specific) and official Firebase redirect best practices doc. The `lepdy-c29da.firebaseapp.com` domain is confirmed in `lib/firebaseApp.ts`.

### Pattern 6: cloudSyncEnabled Feature Flag

Add to `lib/featureFlags/types.ts`:

```typescript
export interface FeatureFlags {
  // ... existing flags ...
  /** Gate all cloud sync UI. When false, auth UI is invisible. */
  cloudSyncEnabled: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  // ... existing defaults ...
  cloudSyncEnabled: false,
};
```

Add to `fetchFlags()` in `lib/featureFlags/providers/firebaseRemoteConfig.ts`:
```typescript
cloudSyncEnabled: this.getBooleanFlag('cloudSyncEnabled', getValue),
```

Confidence: HIGH — identical to how existing boolean flags (`showStickersButton`, `chessCheckmateEnabled`) are added. Verified against existing file structure.

### Pattern 7: Provider Nesting Order

`AuthProvider` must nest **inside** `FeatureFlagProvider` (it needs to read `cloudSyncEnabled` to know whether to initialize Auth) and **outside** all progress providers (sync providers in later phases will consume auth state).

```tsx
// app/providers.tsx
<FeatureFlagProvider>
  <AuthProvider>          {/* NEW: inside FeatureFlagProvider, outside everything else */}
    <StreakProvider>
      {/* ... rest of providers unchanged ... */}
    </StreakProvider>
  </AuthProvider>
</FeatureFlagProvider>
```

Confidence: HIGH — consistent with CONTEXT.md integration point guidance and the existing provider order in `app/providers.tsx`.

### Pattern 8: COPPA Copy in Translation Files

Add a `cloudSync` section under `home` in all three message files. Copy must explicitly frame sign-in as a parent action.

```json
// messages/en.json — add under "home":
"cloudSync": {
  "signInTitle": "Save Your Child's Progress",
  "signInDescription": "Parents: sign in with your Google account to save progress across all devices.",
  "signInButton": "Sign in with Google (Parents only)",
  "signedInAs": "Signed in as {name}",
  "signOutButton": "Sign out",
  "parentNote": "This feature is for parents. Your child's learning data is saved to your account."
}
```

Hebrew (`he.json`) and Russian (`ru.json`) equivalents needed. Phase 24 delivers the copy constants — the UI that renders them is Phase 25.

Confidence: HIGH — translation key structure matches the project's existing `messages/*.json` pattern.

### Anti-Patterns to Avoid

- **Importing Firebase Auth at module top level in any file:** This will cause `window is not defined` during SSR. Always use `await import('firebase/auth')` inside `useEffect` or async functions.
- **Calling `getAuth()` without first calling `getFirebaseApp()`:** Firebase throws if you call `getAuth()` before the app is initialized. The `getFirebaseAuth()` singleton handles this.
- **Assuming popup works on all platforms:** iOS Safari and iOS home screen apps block popups. The popup/redirect split is required per AUTH-05.
- **Using `signInWithRedirect` without the Next.js proxy rewrite:** On Safari 16.1+, the redirect will silently fail — user returns to the app, `getRedirectResult()` returns null, no error thrown.
- **Putting AuthProvider outside FeatureFlagProvider:** The AuthProvider needs to read the `cloudSyncEnabled` flag to decide whether to initialize Firebase Auth at all. If it's outside, it can't access the flag.
- **Initializing Auth eagerly on page load:** Firebase Auth initialization adds network overhead. Only initialize when `cloudSyncEnabled` is true.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth state persistence across sessions | Custom localStorage token storage | Firebase Auth's built-in `browserLocalPersistence` | Token refresh, expiry, security — all handled by SDK |
| Google OAuth token exchange | Custom OAuth 2.0 PKCE flow | `GoogleAuthProvider` + `signInWithPopup`/`signInWithRedirect` | Firebase handles token exchange, refresh, revocation |
| Cross-browser popup/redirect detection | Complex capability detection | Simple iOS user agent check | The platform split (iOS vs desktop) is the correct split; capability detection is brittle |
| SSR-safe Firebase singleton | Re-implementing lazy import guards | The `getFirebaseApp()` + dynamic `import()` pattern from `lib/firebaseApp.ts` | Already in codebase, battle-tested |

---

## Common Pitfalls

### Pitfall 1: `window is not defined` at Build Time
**What goes wrong:** Build fails with `ReferenceError: window is not defined` during Next.js static generation.
**Why it happens:** Firebase Auth SDK accesses `window` at import time (not just at call time). Importing `firebase/auth` at module scope in any file that gets executed server-side triggers this.
**How to avoid:** All Firebase Auth imports must be inside `async function` bodies or inside `useEffect`. The `getFirebaseAuth()` singleton pattern ensures this — it only calls `import('firebase/auth')` when the function is called, which only happens inside effects.
**Warning signs:** Build output shows `Error occurred prerendering page` or `window is not defined`. Also seen when running `npm run build` — test with a production build before declaring complete.

### Pitfall 2: Redirect Result Discarded on iOS
**What goes wrong:** User completes Google sign-in on iOS, returns to app, but appears unauthenticated.
**Why it happens:** `signInWithRedirect` stores the auth result in IndexedDB. When the app reloads after redirect, `getRedirectResult()` must be called to consume that stored result and emit it to `onAuthStateChanged`. If `getRedirectResult()` is not called, the pending result is silently dropped.
**How to avoid:** Call `getRedirectResult(auth)` in `useAuth`'s `useEffect` after setting up `onAuthStateChanged`. Wrap in try/catch — it throws a specific error code when there's no pending redirect, which is the normal (non-iOS) case.
**Warning signs:** Auth state is correct on desktop but null after iOS redirect flow.

### Pitfall 3: Safari 16.1+ Redirect Silently Fails Without Proxy
**What goes wrong:** `signInWithRedirect` is called on iOS, user goes to Google, returns to app, but `getRedirectResult()` returns null user (not an error, just null).
**Why it happens:** Without the Next.js `/__/auth/:path*` proxy rewrite, the redirect crosses domains (`lepdy.com` → `lepdy-c29da.firebaseapp.com`), and Safari's third-party cookie restriction blocks the auth state handoff.
**How to avoid:** Add the rewrite to `next.config.ts` BEFORE testing iOS auth. This must be deployed to production — `localhost` does not trigger the Safari cross-domain restriction.
**Warning signs:** iOS redirect appears to complete but `user` is always null after the flow.

### Pitfall 4: AuthProvider Inside FeatureFlagProvider Cannot Read Flags
**What goes wrong:** `useFeatureFlagContext()` throws "must be used within a FeatureFlagProvider".
**Why it happens:** If `AuthProvider` is placed outside `FeatureFlagProvider` in the provider tree, it can't consume the flag context.
**How to avoid:** `AuthProvider` must be a child of `FeatureFlagProvider` in `app/providers.tsx`. This is the correct nesting per CONTEXT.md's integration point guidance.
**Warning signs:** Runtime error on mount in development.

### Pitfall 5: AUTH-04 Gating: Auth Initializes Even When Flag Is Off
**What goes wrong:** Even with `cloudSyncEnabled: false`, Firebase Auth initializes on every page load, adding latency and network requests.
**Why it happens:** If `AuthProvider` always calls `getFirebaseAuth()` in its `useEffect` regardless of the flag value, Firebase Auth initializes unconditionally.
**How to avoid:** In `useAuth`, check `cloudSyncEnabled` flag before initializing Firebase Auth. If the flag is off, immediately set `loading: false` and `user: null` without ever touching Firebase.
**Warning signs:** Network requests to Firebase Auth endpoints visible in DevTools even when flag is off.

---

## Code Examples

### Complete `lib/firebaseAuth.ts`

```typescript
// Source: mirrors lib/firebase.ts in this codebase
import type { Auth } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';

let auth: Auth | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const app = await getFirebaseApp();
    const { getAuth } = await import('firebase/auth');
    auth = getAuth(app);
  }
  return auth;
}
```

### iOS Detection Utility

```typescript
// Can live in lib/firebaseAuth.ts or utils/platform.ts
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
```

### `getRedirectResult` in `useEffect`

```typescript
// In useAuth.ts useEffect, after onAuthStateChanged subscription:
const { getRedirectResult } = await import('firebase/auth');
try {
  await getRedirectResult(auth);
} catch {
  // auth/null-user or auth/no-redirect-operation — normal on desktop
}
```

### Flag Gating in useAuth

```typescript
// Inside useAuth.ts
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';

export function useAuth(): UseAuthReturn {
  const { getFlag } = useFeatureFlagContext();
  const cloudSyncEnabled = getFlag('cloudSyncEnabled');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cloudSyncEnabled) {
      setLoading(false);
      return;
    }
    // ... Firebase Auth init only when flag is on
  }, [cloudSyncEnabled]);
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `signInWithRedirect` on all platforms | `signInWithPopup` on desktop, `signInWithRedirect` on iOS | Safari 16.1 (2022), Chrome M115 (2024) | Redirect must use proxy rewrite or custom authDomain |
| `firebase/app` direct imports | Lazy dynamic `import()` inside functions | Next.js SSR adoption | Required for SSR-safe Firebase usage |
| `initializeApp()` called at module init | `getApps().length > 0 ? getApp() : initializeApp()` guard | Multi-instance Firebase bug | Prevents "duplicate app" error on hot reload |

**Deprecated/outdated:**
- Firebase compat SDK (`firebase/compat/*`): Do not use. Codebase correctly uses modular SDK.
- `firebase.auth()` namespaced API: Replaced by `getAuth()` from `firebase/auth` in Firebase 9+.

---

## Open Questions

1. **Should `AuthProvider` skip Firebase Auth init until `cloudSyncEnabled` flag finishes loading?**
   - What we know: Feature flags have a `loading` state (`isLoading: boolean`)
   - What's unclear: Whether the auth provider should wait for flags to finish loading, or read the default `false` value immediately
   - Recommendation: Read the current (possibly default) flag value immediately — if the flag is off by default, Auth will not initialize during flag loading, and will initialize once flags resolve if the value becomes true. This is the correct behavior: conservative default, no early Firebase init.

2. **COPPA copy in Hebrew — translation needed**
   - What we know: English and Russian copy can be drafted by Claude; Hebrew requires careful translation for appropriate child/parent framing
   - What's unclear: Whether the existing "Noa" voice actor needs to record any audio for auth (Phase 24 has no audio — that's Phase 25 if needed)
   - Recommendation: Draft Hebrew copy for the RESEARCH file and note it needs native review. Phase 24 only stores the string constants; Phase 25 renders them.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| firebase/auth module | `lib/firebaseAuth.ts` | Yes | 12.8.0 (installed) | — |
| Node.js | Build | Yes | v24.12.0 | — |
| Firebase project `lepdy-c29da` | Auth provider registration | Yes (existing) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

**Pre-condition for iOS redirect to work in production:** The `/__/auth/:path*` rewrite must be deployed. This works correctly in development against `localhost` (the proxy routes locally), but the cross-domain restriction only triggers on production Safari. The rewrite itself is zero-risk: it is a passthrough proxy and does not affect any existing routes.

**Firebase console configuration needed (out-of-code step):** Google sign-in provider must be enabled in the Firebase console under Authentication > Sign-in methods. The `lepdy-c29da` project already uses Firebase, but this step must be done manually if not already enabled.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-04 | `cloudSyncEnabled` flag added to FeatureFlags; when `false`, no Firebase Auth initializes | manual-only (flag off = no auth UI to interact with; no regression to existing tests) | `npm test` (verifies app loads without crash) | Yes — existing `app.spec.ts` |
| AUTH-05 | Redirect/popup split compiles without error; iOS path does not crash | smoke | `npm test` | Yes — existing `app.spec.ts` |
| AUTH-06 | COPPA copy constants exist in all three message files | manual-only (visual review of copy framing) | `npm test` (verifies pages load) | Yes — existing `app.spec.ts` |

**Why tests are manual-only for most requirements:** Phase 24 delivers infrastructure (hooks, context, flags, copy), not user-visible UI. The sign-in button UI is Phase 25. AUTH-05 iOS redirect flow cannot be automated in Playwright (requires real iOS device or iOS Safari simulator; Playwright uses Chromium only per `playwright.config.ts`). AUTH-06 is copy review.

**Critical E2E gate:** `npm test` must pass without regression after all changes. The existing test suite covers 30+ scenarios including page loads, navigation, and game functionality. Any SSR error (the `window is not defined` pitfall) will cause `npm test` to fail on game page tests.

### Sampling Rate
- **Per task commit:** `npm test` (full suite — single worker, ~2 min)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing `app.spec.ts` covers the regression test requirement. No new test files needed for this infrastructure phase (auth UI is Phase 25, which will add tests).

---

## Project Constraints (from CLAUDE.md)

| Constraint | Source | Impact on This Phase |
|------------|--------|---------------------|
| No new npm packages — use existing stack | CLAUDE.md Tech Stack | Firebase Auth is already installed (firebase 12.8.0); no new dependencies needed |
| Must support Hebrew RTL (default), English, Russian via next-intl | CLAUDE.md i18n | COPPA copy must be added to all three `messages/*.json` files |
| Context + hook pattern required | CLAUDE.md Architecture | `AuthContext.tsx` + `useAuth.ts` is the correct shape |
| Lazy dynamic imports for Firebase | CLAUDE.md Architecture | `lib/firebaseAuth.ts` must follow the dynamic import singleton pattern |
| `'use client'` directive on all context/hook files | CLAUDE.md Architecture | `AuthContext.tsx` and `useAuth.ts` must have `'use client'` at top |
| All project imports use `@/` alias | CLAUDE.md Conventions | Use `@/lib/firebaseAuth`, `@/hooks/useAuth`, `@/contexts/AuthContext` |
| Default exports for React components, named exports for hooks/utils | CLAUDE.md Module Design | `AuthProvider` as named export, `useAuthContext` as named export, `useAuth` as named export |
| E2E tests must pass before deploying | CLAUDE.md Testing | Run `npm test` after all changes; no SSR breaks allowed |
| GSD workflow enforcement | CLAUDE.md | Work through GSD commands only |

---

## Sources

### Primary (HIGH confidence)
- Firebase SDK 12.8.0 — introspected directly via `node -e` to confirm all auth exports (`signInWithPopup`, `signInWithRedirect`, `getAuth`, `onAuthStateChanged`, `GoogleAuthProvider`, `browserPopupRedirectResolver`, `browserLocalPersistence`, `indexedDBLocalPersistence`)
- `lib/firebaseApp.ts`, `lib/firebase.ts` — verified lazy singleton patterns in this codebase
- `lib/featureFlags/types.ts`, `lib/featureFlags/providers/firebaseRemoteConfig.ts` — verified flag addition pattern
- `contexts/FeatureFlagContext.tsx`, `contexts/StreakContext.tsx` — verified context + hook pattern
- `app/providers.tsx` — verified provider nesting structure

### Secondary (MEDIUM confidence)
- [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) — confirmed: Safari 16.1+ blocks cross-domain redirect without proxy; next.config.ts rewrite is a valid solution
- [Next.js Firebase Auth Safari solution (2024)](https://www.codejam.info/2024/05/nextjs-firebase-auth-safari.html) — confirmed: `rewrites` in `next.config.ts` is the correct Next.js approach

### Tertiary (LOW confidence)
- WebSearch results confirming iOS user agent detection pattern — widely used, but specific string `/iPad|iPhone|iPod/` should be validated against current iOS versions if edge cases emerge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed and working
- Architecture: HIGH — all patterns directly verified against existing codebase files
- Pitfalls: HIGH for SSR issues (verified against existing code); MEDIUM for iOS Safari redirect (requires production deployment to trigger Safari cross-domain restriction)
- COPPA copy: HIGH for structure; LOW for Hebrew translation quality (needs native review)

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (Firebase SDK versioning stable; iOS Safari behavior may change with iOS updates)
