# Phase 28: Polish - Research

**Researched:** 2026-03-25
**Domain:** React UI state feedback patterns, Browser Visibility API, offline detection
**Confidence:** HIGH

## Summary

Phase 28 is a pure UI polish phase that adds three feedback mechanisms to the existing settings drawer: a "saved" indicator after cloud writes, a "saved locally" offline note, and a visibility-change re-fetch. All building blocks (hooks, contexts, components, translation namespace) already exist in the codebase from Phases 24–27. No new libraries are needed.

The scope is tightly contained: two additions to `useProgressSync` (optional `onSyncComplete` callback + return type change), one new hook for online/offline status + visibility-change re-fetch, and a new UI section added to the existing `cloudSyncEnabled` block in `SettingsDrawer.tsx`.

**Primary recommendation:** Add `onSyncComplete` callback to `useProgressSync`, create `useSyncStatus` hook encapsulating online/offline detection and visibility-change re-fetch, then surface both states in `SettingsDrawer` using `<Typography variant="caption">`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Sync Status Indicator Style
- Small caption text below auth section in settings drawer — `<Typography variant="caption" color="success.main">` with checkmark icon, 2s fade out
- Offline indicator uses same caption area with amber/warning color — `color="warning.main"` with offline icon
- Simple opacity fade for transitions — CSS `opacity 0.3s`, no MUI animation library
- Positioned between auth divider and language section in the drawer

#### Sync State Management
- Sync write success detected via callback from `useProgressSync` — add optional `onSyncComplete` callback to existing hook
- Offline status detected via `navigator.onLine` + `online`/`offline` event listeners — built-in browser API
- Visibility change triggers re-fetch via `document.addEventListener('visibilitychange')` in auth context area
- Tab return does full merge using `useMergeOnSignIn` logic — but skip reload, update localStorage + contexts directly

#### Translations & Edge Cases
- Translation keys: `home.cloudSync.saved`, `home.cloudSync.savedLocally` — extends existing `home.cloudSync` namespace
- On sign-out: immediately hide all sync indicators — auth section disappears, status goes with it
- Sync indicators only show for authenticated users with `cloudSyncEnabled` flag on — no indicators for signed-out users
- Visibility-change re-fetch throttled to 5 minute cooldown — prevents excessive RTDB reads on rapid tab switching

### Claude's Discretion
- Exact icon choices for checkmark and offline indicators
- CSS transition timing details beyond the 0.3s opacity fade
- Error handling for failed re-fetch on visibility change

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLSH-01 | Subtle "saved" sync status indicator appears in settings after successful cloud write | `onSyncComplete` callback on `useProgressSync` → `showSaved` state → caption in drawer |
| POLSH-02 | "Progress saved locally" note shown in settings when device is offline | `navigator.onLine` + event listeners → `isOnline` state → caption in drawer |
| POLSH-03 | App re-fetches cloud state on tab focus (Visibility API) for cross-device pickup | `document.visibilitychange` listener → throttled `fetchCloudData` + localStorage write (no reload) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | `useState`, `useEffect`, `useRef` for local UI state and event listeners | Already in use |
| MUI | 7.3.7 | `Typography variant="caption"`, color tokens (`success.main`, `warning.main`) | Already in use throughout drawer |
| next-intl | 4.7.0 | `useTranslations()` for `home.cloudSync.saved` / `home.cloudSync.savedLocally` | Already in use in SettingsDrawer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MUI Icons | 7.3.7 | Checkmark and offline icon beside caption text | Icon choice is Claude's discretion — `CheckCircleOutline` and `CloudOffOutlined` are reasonable defaults |

No new installs required. The entire implementation is built from already-installed dependencies.

**Installation:** None needed.

## Architecture Patterns

### Recommended Project Structure

The changes touch three files plus translation files:

```
hooks/
├── useProgressSync.ts      # Add optional onSyncComplete callback
├── useSyncStatus.ts        # NEW: online/offline + visibility-change re-fetch
components/
├── SettingsDrawer.tsx      # Add sync status caption block below auth section
messages/
├── he.json                 # Add home.cloudSync.saved, home.cloudSync.savedLocally
├── en.json                 # Same keys
└── ru.json                 # Same keys
```

### Pattern 1: onSyncComplete Callback on useProgressSync

**What:** Add an optional `onSyncComplete?: () => void` parameter. Call it after `await set(...)` succeeds, before the try/catch closes. The hook signature widens from `void` return to still `void` return — caller passes the callback.

**When to use:** Whenever a consumer needs to react to a completed write (e.g., show a "saved" indicator).

**Example:**
```typescript
// Source: existing hooks/useProgressSync.ts pattern
export function useProgressSync(
  uid: string | null,
  path: string,
  data: unknown,
  onSyncComplete?: () => void   // NEW: optional, called after successful RTDB write
): void {
  const onSyncCompleteRef = useRef(onSyncComplete);
  onSyncCompleteRef.current = onSyncComplete;  // always current, no dep array churn

  // ...existing logic...
  timerRef.current = setTimeout(async () => {
    try {
      // ...existing write...
      await set(ref(db, `users/${uid}/${path}`), dataRef.current);
      onSyncCompleteRef.current?.();  // fire callback on success
    } catch (error) {
      console.error(`[sync:${path}] Write failed:`, error);
    }
  }, DEBOUNCE_MS);
}
```

**Why use a ref for the callback:** Avoids adding `onSyncComplete` to the `useEffect` dep array, which would reset the debounce timer on every render. The ref pattern (`onSyncCompleteRef.current = onSyncComplete` outside the effect) is the established pattern for stable callbacks — same approach `dataRef.current` uses today.

### Pattern 2: useSyncStatus Hook

**What:** A single hook that owns two concerns — (a) online/offline state via `navigator.onLine` + event listeners, (b) visibility-change re-fetch with 5-minute throttle.

**When to use:** Called once in `SettingsDrawer` (or in a small new hook consumed by the drawer).

```typescript
// hooks/useSyncStatus.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const VISIBILITY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface UseSyncStatusOptions {
  uid: string | null;
  enabled: boolean;  // false when cloudSyncEnabled flag is off or user is signed out
  onVisibilityRefetch?: () => void;  // callback when visibility re-fetch completes
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;  // for "saved" indicator — set externally via showSaved trigger
}

export function useSyncStatus({ uid, enabled, onVisibilityRefetch }: UseSyncStatusOptions): {
  isOnline: boolean;
} {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const lastVisibilityFetchRef = useRef<number>(0);
  const onVisibilityRefetchRef = useRef(onVisibilityRefetch);
  onVisibilityRefetchRef.current = onVisibilityRefetch;

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Visibility-change re-fetch (POLSH-03)
  useEffect(() => {
    if (!enabled || !uid) return;

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastVisibilityFetchRef.current < VISIBILITY_COOLDOWN_MS) return;
      lastVisibilityFetchRef.current = now;

      // Fetch cloud data and merge into localStorage (no reload — write directly)
      // Reuse fetchCloudData + merge logic from useMergeOnSignIn
      onVisibilityRefetchRef.current?.();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled, uid]);

  return { isOnline };
}
```

### Pattern 3: Visibility Re-fetch Without Reload

**What:** POLSH-03 requires re-fetching cloud state on tab focus, but the CONTEXT.md decision is to skip the `window.location.reload()` — update localStorage and contexts directly instead.

**The challenge:** `useMergeOnSignIn.runMerge()` ends with `window.location.reload()`. For the visibility-change path, we need the same fetch + merge + localStorage write, without the reload.

**How to implement:** Extract a `runMergeNoReload(uid: string): Promise<void>` function from `useMergeOnSignIn.ts`, or duplicate the fetch+merge+write portion in the new visibility hook. The extract approach is cleaner.

```typescript
// Extracted helper (stays in useMergeOnSignIn.ts or moves to lib/mergeProgress.ts)
export async function fetchAndMergeToLocalStorage(uid: string): Promise<boolean> {
  const cloud = await fetchCloudData(uid);
  if (cloud === null) return false;

  const local = readLocalStorage();
  // ...same merge calls...
  writeLocalStorage(mergedLetters, mergedNumbers, mergedAnimals, mergedGames, mergedWords, mergedStreak);
  return true;
}
```

The calling code in `useSyncStatus` (or `AuthContext`) invokes this on visibility, then signals contexts to re-read localStorage. Since contexts read from localStorage on mount but don't re-subscribe, the simplest approach is to accept that visibility-change merged data only reflects on the next full page load for in-memory context state — but localStorage is immediately up to date. This is the tradeoff the decisions accept: "update localStorage + contexts directly." If live context refresh is desired, it requires either reload or context invalidation signals.

**Decision clarification needed:** The CONTEXT.md says "update localStorage + contexts directly" — but the existing 6 context providers each independently read from localStorage on mount (they do not subscribe to localStorage changes). There is no shared invalidation signal. Options are:
1. Write to localStorage only — contexts stay stale until next reload/page navigation. Simple, safe.
2. Expose a `refresh()` function on each context provider and call them after merge. Complex, requires touching 6 files.
3. Do a reload (consistent with existing sign-in path). Contradicts CONTEXT.md.

The safest interpretation: write merged data to localStorage (so the next time the user navigates or refreshes, data is current), and accept that in-memory context state stays as-is for the current tab session. This matches how Phase 27 handles sign-in for same-session re-opens.

### Pattern 4: "Saved" Indicator State in SettingsDrawer

**What:** `showSaved` boolean state, set to `true` when `onSyncComplete` fires, auto-cleared after 2 seconds via `setTimeout`.

```typescript
// Inside SettingsDrawer (or a parent that passes it down)
const [showSaved, setShowSaved] = useState(false);
const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleSyncComplete = useCallback(() => {
  setShowSaved(true);
  if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
  savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
}, []);
```

**Challenge:** `useProgressSync` is called inside each category progress context (e.g., `useLettersProgress`), not inside `SettingsDrawer`. The `onSyncComplete` callback must flow from `SettingsDrawer` → context → `useProgressSync`. Options:
1. Pass `onSyncComplete` down through context providers (complex, couples UI concerns to data layer).
2. Use a shared callback registered via context (e.g., add `onSyncComplete` to `AuthContext` or a new `SyncStatusContext`).
3. Move the "saved" state into a new `SyncStatusContext`, expose a `notifySaved()` function, call it from each progress hook's `onSyncComplete`.

**Recommended approach:** Create a minimal `SyncStatusContext` that holds `showSaved` state and exposes `notifySaved()`. Each progress hook reads `notifySaved` from the context and passes it as `onSyncComplete` to `useProgressSync`. `SettingsDrawer` reads `showSaved` from the context.

This avoids prop-drilling across 6 context providers and keeps sync UI concerns isolated.

### Pattern 5: Caption UI in SettingsDrawer

Placed below the `user ?` block, inside the `cloudSyncEnabled && user` guard:

```tsx
{/* Sync status indicators — only for signed-in users */}
{user && (
  <Box sx={{ mt: 1, minHeight: 20 }}>
    {showSaved && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: showSaved ? 1 : 0, transition: 'opacity 0.3s' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'success.main' }} />
        <Typography variant="caption" color="success.main">
          {t('home.cloudSync.saved')}
        </Typography>
      </Box>
    )}
    {!isOnline && !showSaved && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CloudOffOutlinedIcon sx={{ fontSize: 14, color: 'warning.main' }} />
        <Typography variant="caption" color="warning.main">
          {t('home.cloudSync.savedLocally')}
        </Typography>
      </Box>
    )}
  </Box>
)}
```

### Anti-Patterns to Avoid

- **Adding `onSyncComplete` to the `useEffect` dep array in `useProgressSync`:** Causes the 30s debounce to reset on every render. Use the ref pattern instead (matching the existing `dataRef` approach in the hook).
- **Calling `window.location.reload()` in the visibility-change path:** Contradicts the CONTEXT.md locked decision. Jarring UX if the user is mid-interaction.
- **Showing sync indicators when `cloudSyncEnabled` is false or user is signed out:** Extra guards needed; both indicators must be inside the `cloudSyncEnabled && user` block.
- **Attaching the visibilitychange listener in `SettingsDrawer`:** The drawer is not always mounted. The listener must live in a always-mounted component (AuthContext/AuthProvider or a top-level hook called from providers.tsx).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Online/offline detection | Custom polling or service worker ping | `navigator.onLine` + `window.addEventListener('online'/'offline')` | Built-in browser API, reliable, no extra dependencies |
| Visibility detection | Focus/blur events, polling | `document.visibilitychange` + `document.visibilityState` | Standard Page Visibility API, handles tab switch vs window focus |
| Fade-out animation | MUI Fade component, framer-motion | CSS `opacity` + `transition: 'opacity 0.3s'` in `sx` prop | CONTEXT.md locked: "Simple opacity fade, no MUI animation library" |
| Translation interpolation | String concatenation | next-intl `useTranslations()` with new keys | Already established in this namespace |

**Key insight:** This phase is pure integration work — all primitives exist in the browser or in the installed stack. No new library evaluation needed.

## Runtime State Inventory

Step 2.5: SKIPPED — this is a UI polish phase, not a rename/refactor/migration phase. No runtime state requires inventory.

## Common Pitfalls

### Pitfall 1: onSyncComplete Closure Stale Reference
**What goes wrong:** `onSyncComplete` callback passed to `useProgressSync` captures a stale closure (e.g., wrong `showSaved` setter or old notifySaved reference).
**Why it happens:** `useEffect` dep arrays in the hook would re-fire on each new callback identity, resetting the 30s debounce.
**How to avoid:** Use `useRef` to store the latest callback (same pattern as `dataRef.current`). Update the ref outside the effect; never add the callback to the dep array.
**Warning signs:** The 30s debounce timer resets on every render cycle — visible in React DevTools profiler.

### Pitfall 2: visibilitychange Listener on Unmounted Component
**What goes wrong:** The listener fires after the component unmounts, causing `setState` on an unmounted component or memory leaks.
**Why it happens:** Drawer closes while user tabs away; listener references state from closed drawer.
**How to avoid:** Attach the listener in `AuthProvider` or in a top-level hook called unconditionally from `providers.tsx`, not inside `SettingsDrawer`. Always return the cleanup function from `useEffect`.
**Warning signs:** Console warning "Can't perform a React state update on an unmounted component."

### Pitfall 3: SSR Access to navigator.onLine
**What goes wrong:** `navigator is not defined` on server-side render.
**Why it happens:** Next.js pre-renders; `navigator` is browser-only.
**How to avoid:** Initialize state with a lazy initializer: `useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)`. This is safe in `'use client'` components too since it gracefully handles the case.
**Warning signs:** Build-time or hydration errors mentioning `navigator`.

### Pitfall 4: Visibility Re-fetch Triggering During Sign-in Redirect
**What goes wrong:** Auth redirect causes `visibilitychange` to fire → re-fetch triggers before auth state resolves → `uid` is null → early exit, but guard logic must be explicit.
**Why it happens:** Google OAuth redirect temporarily leaves the page, triggering visibility events.
**How to avoid:** The `enabled && uid` guard in the hook handles this — the listener is a no-op when `uid` is null or `enabled` is false. Verify these guards are in place.
**Warning signs:** RTDB reads appearing in Firebase console during sign-in with no valid uid.

### Pitfall 5: showSaved and isOffline Showing Simultaneously
**What goes wrong:** Both indicators display at the same time (user is offline but a queued write just fired).
**Why it happens:** `showSaved` state from a prior online session still in the 2s window when connectivity drops.
**How to avoid:** Prioritize `showSaved` — when it's true, hide offline indicator (user sees "saved" first, then if still offline, sees "locally saved"). The example pattern `!isOnline && !showSaved` handles this.
**Warning signs:** Both caption elements visible simultaneously in the UI.

## Code Examples

### Adding onSyncComplete to useProgressSync (verified against existing source)
```typescript
// Source: hooks/useProgressSync.ts (current implementation)
// Change: add optional onSyncComplete param + ref pattern to avoid dep array churn

export function useProgressSync(
  uid: string | null,
  path: string,
  data: unknown,
  onSyncComplete?: () => void
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<unknown>(data);
  const onSyncCompleteRef = useRef(onSyncComplete);  // NEW

  dataRef.current = data;
  onSyncCompleteRef.current = onSyncComplete;  // NEW — always current

  const serialized = JSON.stringify(data);

  useEffect(() => {
    if (!uid) return;
    if (timerRef.current !== null) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const { getFirebaseDatabase } = await import('@/lib/firebase');
        const { ref, set } = await import('firebase/database');
        const db = await getFirebaseDatabase();
        await set(ref(db, `users/${uid}/${path}`), dataRef.current);
        onSyncCompleteRef.current?.();  // NEW — fire after successful write
      } catch (error) {
        console.error(`[sync:${path}] Write failed:`, error);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [uid, path, serialized]);  // onSyncComplete intentionally NOT in deps
}
```

### Online/Offline Detection (verified pattern — browser built-in API)
```typescript
// Source: MDN Web Docs — navigator.onLine, online/offline events
const [isOnline, setIsOnline] = useState(() =>
  typeof navigator !== 'undefined' ? navigator.onLine : true
);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### Visibility Change with Throttle (verified pattern — Page Visibility API)
```typescript
// Source: MDN Web Docs — Page Visibility API
const lastFetchRef = useRef<number>(0);
const COOLDOWN_MS = 5 * 60 * 1000;

useEffect(() => {
  if (!enabled || !uid) return;

  const handleVisibility = async () => {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - lastFetchRef.current < COOLDOWN_MS) return;
    lastFetchRef.current = now;
    // trigger re-fetch
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, [enabled, uid]);
```

### Translation Keys to Add (all 3 locales)
```json
// he.json — under home.cloudSync
"saved": "נשמר ✓",
"savedLocally": "נשמר במכשיר"

// en.json — under home.cloudSync
"saved": "Saved",
"savedLocally": "Progress saved locally"

// ru.json — under home.cloudSync
"saved": "Сохранено",
"savedLocally": "Прогресс сохранён на устройстве"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Page reload after merge (Phase 27) | No reload for visibility-change re-fetch (Phase 28) | Phase 28 decision | Less disruptive; localStorage updated immediately; in-memory contexts stay as-is until next navigation |
| No sync feedback | Caption indicators in settings drawer | Phase 28 | Parents can trust progress is safe |

**Deprecated/outdated:**

- `runMerge()` internal to `useMergeOnSignIn` is partially reused — the fetch+merge+write portion should be extractable without the `window.location.reload()` for the visibility path.

## Open Questions

1. **Where exactly does the visibilitychange listener live?**
   - What we know: CONTEXT.md says "in auth context area"
   - What's unclear: `AuthContext.tsx` vs `AuthProvider` in `providers.tsx` vs a new `useSyncStatus` hook
   - Recommendation: Place in `AuthProvider` since it's always mounted, or in a `useSyncStatus` hook called from `AuthProvider`. Either approach is clean.

2. **Do in-memory context providers refresh after visibility-change merge?**
   - What we know: CONTEXT.md says "update localStorage + contexts directly" but doesn't specify mechanism. Current providers read localStorage only on mount.
   - What's unclear: "directly" may mean "write localStorage and accept that contexts stay stale until next navigation" vs "actually call context refresh functions"
   - Recommendation: Write to localStorage only (simple, safe). Add a comment explaining why. If live refresh is later desired, add a SyncStatusContext invalidation signal.

3. **How many progress hooks call `useProgressSync`?**
   - What we know: Phase 26 wired up letters, numbers, animals, games, words, streak = 6 hooks
   - What's unclear: Whether `onSyncComplete` should fire on *any* successful write (first one = show saved) or aggregate all
   - Recommendation: Fire on any one write — "saved" means at least one write succeeded. Use a shared `notifySaved` callback.

## Environment Availability

Step 2.6: SKIPPED — phase has no new external dependencies. All runtime APIs (Visibility API, navigator.onLine, online/offline events) are browser built-ins available in all supported browsers (Chrome/Chromium, as per Playwright config).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x (present as `vitest.config.ts`) + Playwright 1.57.0 |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (E2E) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLSH-01 | `onSyncComplete` callback fires after successful RTDB write | unit | `npx vitest run hooks/useProgressSync.test.ts` | ❌ Wave 0 |
| POLSH-02 | `isOnline` state reflects `navigator.onLine` + events | unit | `npx vitest run hooks/useSyncStatus.test.ts` | ❌ Wave 0 |
| POLSH-03 | Visibility re-fetch throttled at 5-minute cooldown | unit | `npx vitest run hooks/useSyncStatus.test.ts` | ❌ Wave 0 |

Note: POLSH-01 and POLSH-02 UI rendering (caption appearance, color, opacity) are best verified by manual visual inspection or a Playwright smoke test. The unit tests cover the hook logic (state transitions, callback firing) which is the automatable portion.

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run && npm run lint`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `hooks/useProgressSync.test.ts` — covers POLSH-01 (`onSyncComplete` callback fires, does not reset debounce, ref pattern)
- [ ] `hooks/useSyncStatus.test.ts` — covers POLSH-02 (online/offline state transitions) and POLSH-03 (visibility cooldown throttle)

*(Existing `lib/mergeProgress.test.ts` covers merge logic — no new test file needed for the extracted `fetchAndMergeToLocalStorage` if it's a thin wrapper.)*

## Sources

### Primary (HIGH confidence)
- Codebase direct read — `hooks/useProgressSync.ts`, `hooks/useMergeOnSignIn.ts`, `components/SettingsDrawer.tsx`, `contexts/AuthContext.tsx`, all three `messages/*.json`
- `.planning/phases/28-polish/28-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — POLSH-01, POLSH-02, POLSH-03

### Secondary (MEDIUM confidence)
- MDN Page Visibility API — `document.visibilitychange`, `document.visibilityState` (well-known browser standard, no cross-browser issues for Chromium target)
- MDN Network Information — `navigator.onLine`, `online`/`offline` events (browser standard, supported universally)

### Tertiary (LOW confidence)

None — all findings are from direct codebase inspection or browser standards.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct codebase read; no new libraries
- Architecture: HIGH — patterns derived from existing hooks in codebase + browser standards
- Pitfalls: HIGH — derived from known React patterns (stale closures, SSR guards) + codebase-specific concerns

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable tech — MUI, React, browser APIs)
