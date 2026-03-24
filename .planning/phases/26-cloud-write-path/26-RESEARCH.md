# Phase 26: Cloud Write Path - Research

**Researched:** 2026-03-25
**Domain:** Firebase Realtime Database write-through, offline queueing, security rules
**Confidence:** HIGH

## Summary

Phase 26 adds a cloud write path that mirrors authenticated users' progress to Firebase RTDB. The existing codebase already has all the primitives needed: `getFirebaseDatabase()` singleton, `useAuthContext()` for user identity, and the complete set of progress hooks. The work is purely additive — a new `useCloudSync` hook intercepts `progressData` state changes via a `useEffect`, debounces them, and writes to RTDB under `users/{uid}/progress/{category}` and `users/{uid}/streak`. Signed-out users never touch the new code path. Firebase RTDB's built-in offline persistence handles SYNC-04 automatically via `enableIndexedDbPersistence` (Web v9 Modular SDK equivalent: `enableMultiTabIndexedDbPersistence` is Firestore-only; RTDB uses `goOffline`/`goOnline` or simply built-in queue). Security rules (SYNC-05) are deployed via `database.rules.json`.

The key architectural decision already made upstream: **Firebase RTDB** (not Firestore). This is confirmed by the existing `lib/firebase.ts` using `firebase/database`, the `databaseURL` in `firebaseConfig`, and the STATE.md noting "Open decision: Firestore vs RTDB" — which must be resolved before this phase. Based on the evidence (RTDB already wired for leaderboards, no Firestore SDK present), RTDB is the right choice and this research treats it as the decision.

**Primary recommendation:** Create a single `useProgressSync` hook that accepts `(uid, category, data)` and performs debounced RTDB writes. Wire it into each progress context. Security rules protect `users/{uid}/**` so only the owning UID can read/write.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure phase.

### Claude's Discretion
All implementation choices. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYNC-01 | All progress data writes to Firebase when user is authenticated (debounced) | `useProgressSync` hook reacts to `progressData` state changes; debounce via `useRef` + `setTimeout` in hook; auth gate via `useAuthContext().user?.uid` |
| SYNC-04 | Sync works offline — localStorage as cache, syncs back when connectivity returns | Firebase RTDB SDK has built-in offline queue; writes issued while offline are automatically flushed when connection restores; no manual queue needed |
| SYNC-05 | Firebase security rules restrict users to read/write only their own data | `database.rules.json` with `auth.uid` match rule on `users/$uid`; deployed to Firebase project |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/database | 12.8.0 (installed) | RTDB writes, offline queue | Already used for leaderboards; `getFirebaseDatabase()` singleton exists |
| firebase/auth | 12.8.0 (installed) | User identity (`uid`) | Already wired via `useAuthContext()` from Phase 24/25 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React `useRef` + `setTimeout` | (built-in) | Debouncing writes | Cancel/reschedule on each state change; 30s debounce for progress |
| `navigator.onLine` + `online` event | (Web API) | Connectivity detection | Optional — RTDB handles offline transparently; only needed if explicit UI feedback desired |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firebase RTDB | Firestore | Firestore has better querying but requires separate SDK import; RTDB already wired and simpler for key-value progress blobs |
| useEffect watch on state | Explicit `recordItemHeard` wrapper | Effect-based approach is non-invasive — no need to touch every caller of `recordItemHeard` |
| 30s debounce | 5s or immediate | 30s reduces write cost; activity happens in bursts; 60s success criterion gives ample time |

**Installation:** No new packages required. Firebase 12.8.0 already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── cloudSync.ts          # getFirebaseDatabase() wrapper + writeProgressToCloud()
hooks/
├── useProgressSync.ts    # Generic debounced sync hook
contexts/
├── LettersProgressContext.tsx   # Wire useProgressSync (modify)
├── NumbersProgressContext.tsx   # Wire useProgressSync (modify)
├── AnimalsProgressContext.tsx   # Wire useProgressSync (modify)
├── GamesProgressContext.tsx     # Wire useProgressSync (modify)
├── WordCollectionContext.tsx    # Wire useProgressSync (modify)
├── StreakContext.tsx             # Wire useProgressSync for streak (modify)
database.rules.json              # Firebase security rules (new file in project root)
```

### Pattern 1: useProgressSync — Generic Debounced Sync Hook

**What:** Accepts `(uid: string | null, category: string, data: unknown)` and debounces RTDB writes. When `uid` is null (signed out), it does nothing.

**When to use:** Called from each progress context with the current `progressData` object. Fires after localStorage has already saved (data is safe locally first).

**Example:**

```typescript
// hooks/useProgressSync.ts
'use client';

import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 30_000; // 30s debounce — meets 60s success criterion

/**
 * Debounced cloud sync hook.
 * When uid is null (signed-out) this hook is a no-op — zero code executes.
 * Data flows: localStorage (immediate) → this hook (debounced) → RTDB (30s max).
 */
export function useProgressSync(
  uid: string | null,
  category: string,
  data: unknown
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    // SYNC-01 gate: signed-out users → no-op
    if (!uid) return;

    // Cancel any pending write
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const { getFirebaseDatabase } = await import('@/lib/firebase');
        const { ref, set } = await import('firebase/database');
        const db = await getFirebaseDatabase();
        await set(ref(db, `users/${uid}/progress/${category}`), dataRef.current);
      } catch (error) {
        // Silent fail — localStorage already has data; RTDB will retry offline
        console.error(`[sync:${category}] Write failed:`, error);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [uid, category, data]); // data in dep array triggers debounce on change
}
```

### Pattern 2: Wiring Into Progress Contexts

**What:** Each progress context provider calls `useProgressSync` with its current data and the auth user's UID.

**When to use:** Inside the provider component (e.g., `LettersProgressProvider`), after the existing hook is called.

**Example (LettersProgressContext.tsx):**

```typescript
// contexts/LettersProgressContext.tsx  — additions only
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';

export function LettersProgressProvider({ children }: LettersProgressProviderProps) {
  const lettersProgressValue = useLettersProgress();
  const { user } = useAuthContext();

  // SYNC-01: Mirror to cloud when authenticated
  useProgressSync(
    user?.uid ?? null,
    'letters',
    {
      heardItemIds: Array.from(lettersProgressValue.heardItemIds),
      totalClicks: lettersProgressValue.totalClicks,
    }
  );

  return (
    <LettersProgressContext.Provider value={lettersProgressValue}>
      {children}
    </LettersProgressContext.Provider>
  );
}
```

### Pattern 3: Streak Sync

**What:** `StreakContext.tsx` also syncs — streak data lives at `users/{uid}/streak`.

**Example:**

```typescript
// Inside StreakProvider
useProgressSync(user?.uid ?? null, '../streak', streakValue.streakData);
// Path: users/{uid}/streak  (use literal path, not category sub-key)
```

Or more cleanly, write streak to `users/{uid}/streak` using a separate path argument convention — not under `progress/`. The hook signature should accept an arbitrary RTDB path segment.

### Pattern 4: Firebase Security Rules

**What:** `database.rules.json` enforces user data isolation for SYNC-05.

**Example:**

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

**Key points:**
- `leaderboard` rules remain unchanged (existing feature)
- `users/$uid` wildcards ensure each user can only access their own subtree
- `auth != null` prevents unauthenticated reads even if `cloudSyncEnabled` is off on another device

### Anti-Patterns to Avoid

- **Wrapping `recordItemHeard`:** Do not intercept the write function to trigger sync. The `useEffect` approach watching `progressData` state is non-invasive and picks up all mutations (including future ones) automatically.
- **Top-level firebase/database import:** Must remain dynamic import (`await import('firebase/database')`) to avoid SSR errors — same pattern as existing `lib/firebase.ts`.
- **Writing on every render:** `data` in `useProgressSync`'s dependency array must be a stable reference (the raw `progressData` object from state). Passing a newly constructed object literal on each call will loop infinitely. Pass the internal state object or a memoized copy.
- **Sharing one debounce timer across categories:** Each `useProgressSync` instance is independent — one timer per category. This is correct behavior.
- **Sync before initialization:** Progress hooks use an `isInitialized` flag. Sync must not fire during the initial load from localStorage. The debounce delay naturally handles this, but if `isInitialized` is accessible, use it as an additional guard.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline write queue | Custom IndexedDB queue | Firebase RTDB SDK built-in | RTDB SDK automatically queues writes in memory when offline and flushes on reconnect — this is a core RTDB feature |
| Retry logic | `while` loop with backoff | RTDB SDK built-in | SDK handles transient failures transparently |
| Connection detection | `navigator.onLine` polling | Firebase `onValue(connectedRef)` or just let SDK handle | `.info/connected` reference in RTDB provides authoritative connection state |

**Key insight:** Firebase RTDB's offline behavior is not optional — it is always active. Writes made while offline are queued in memory and applied when connectivity returns. No explicit offline mode needs to be enabled for Web (unlike Firestore which requires `enableIndexedDbPersistence()`).

---

## Common Pitfalls

### Pitfall 1: Infinite Re-render from Unstable Data Reference

**What goes wrong:** `useProgressSync(uid, 'letters', { heardItemIds: Array.from(set), totalClicks })` creates a new object on every render, causing `useEffect` to fire every render, which triggers debounce cancellation on every render — effectively meaning the write never flushes.

**Why it happens:** Object identity comparison in React's dependency array — a new object `{}` !== previous `{}` even with identical contents.

**How to avoid:** Serialize the data to compare by value. Options:
1. Pass the raw `progressData` state object (stable reference, changes only on real updates)
2. Use `useMemo` to memoize the serialized form
3. Pass a JSON string: `JSON.stringify(progressData)` — string comparison by value

**Warning signs:** Debounce timer is cleared and restarted on every keystroke or render.

### Pitfall 2: RTDB Path Collision with Leaderboard

**What goes wrong:** Writing to `users/` accidentally clobbers or is clobbered by leaderboard data at `leaderboard/`.

**Why it happens:** Not a real collision — leaderboard is at `leaderboard/` (not `users/`), so paths don't overlap. But if the rules for `leaderboard` are too permissive and someone accidentally writes to `leaderboard/{uid}`, the rules must keep these namespaces separate.

**How to avoid:** Rules file uses explicit top-level keys: `leaderboard` with existing permissive rules, `users` with auth-gated rules.

### Pitfall 3: Writing Before Auth Resolves

**What goes wrong:** `user` from `useAuthContext()` is initially `null` while auth is loading. A debounced write might attempt to write before the user resolves, then resolve to `null` even though the user is logged in.

**Why it happens:** `useAuth` has a `loading` state that starts `true`. During that window, `user` is `null`.

**How to avoid:** The `uid` guard in `useProgressSync` (`if (!uid) return`) handles this. When `user` resolves from `null` to a real user, `uid` changes, triggering the effect again — the next state change after login will queue a sync.

**Warning signs:** Progress written to RTDB under `null` as UID (impossible if guard is correct — `users/null/` would only appear with a bug).

### Pitfall 4: Double Write on Auth State Change

**What goes wrong:** When the user signs in, `uid` changes from `null` to a real value. This triggers `useEffect` even if the data hasn't changed — a write fires immediately for stale data.

**Why it happens:** `uid` is in the `useEffect` dependency array. When it changes, effect re-runs.

**How to avoid:** This is acceptable behavior — writing current localStorage state to RTDB on sign-in is desirable (it's effectively the write-up that Phase 27 would do as a merge). The debounce still applies so it won't spam writes. If the exact data is already in RTDB, RTDB `set()` is idempotent.

### Pitfall 5: GamesProgressContext Uses Different Data Shape

**What goes wrong:** `useGamesProgress` is not built on `useCategoryProgress` — it has a completely custom data structure (`GamesProgressData`). The sync hook must receive the raw `progressData` object, not a partially computed shape.

**Why it happens:** `GamesProgressContext.tsx` holds internal `progressData` state that is not exported — the context only exposes the computed return value.

**How to avoid:** The context provider component has access to the raw `progressData` via the hook's internal state. Since sync is added inside the provider, it can access the internal hook's raw state OR use the public fields to reconstruct the serializable shape. Given `useGamesProgress` doesn't export its raw data, the sync should reconstruct the serializable object from the return value's fields.

### Pitfall 6: Missing Firebase Security Rules Deployment

**What goes wrong:** `database.rules.json` is created but not deployed — rules remain as the default (open read/write).

**Why it happens:** Rules files are not automatically deployed by `next build` or Vercel.

**How to avoid:** Include deployment instructions in the plan. Rules can be deployed via:
- Firebase CLI: `firebase deploy --only database`
- Firebase Console: Realtime Database → Rules tab → paste and Publish
- Document which method the project uses (no `firebase.json` found in the repo — likely manual console deploy)

**Warning signs:** After deploying the app, any UID can read any other user's data.

---

## Code Examples

Verified patterns from Firebase RTDB Web SDK documentation:

### Writing Data to RTDB

```typescript
// Source: Firebase RTDB Web SDK docs (firebase/database)
import { getDatabase, ref, set } from 'firebase/database';

const db = getDatabase(app);
await set(ref(db, `users/${uid}/progress/letters`), {
  heardItemIds: ['alef', 'bet', 'gimel'],
  totalClicks: 42,
});
```

### Firebase RTDB Offline Behavior (Built-In)

```typescript
// Source: Firebase RTDB docs — offline behavior is automatic in Web SDK
// No explicit enableOfflinePersistence() call needed for RTDB Web SDK
// Writes while offline are queued in memory and flushed on reconnect
// This differs from Firestore which requires enableIndexedDbPersistence()

// If you want to detect connection state:
import { ref as dbRef, onValue } from 'firebase/database';
const connectedRef = dbRef(db, '.info/connected');
onValue(connectedRef, (snapshot) => {
  const isConnected: boolean = snapshot.val() === true;
});
```

### Debounce Pattern with useRef (React)

```typescript
// Standard React debounce pattern — no external library needed
import { useEffect, useRef } from 'react';

function useDebounce<T>(value: T, delay: number): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // action with value
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);
}
```

### Firebase RTDB Security Rules Structure

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

---

## Runtime State Inventory

> This is an additive infrastructure phase (no rename/refactor). No runtime state needs migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | No RTDB data under `users/` exists yet — fresh path | None — writing new data |
| Live service config | Firebase RTDB security rules: currently default (open) | Deploy `database.rules.json` to Firebase console |
| OS-registered state | None | None |
| Secrets/env vars | Firebase config hardcoded in `lib/firebaseApp.ts` (public keys — safe) | None |
| Build artifacts | None | None |

**Key deployment note:** Firebase security rules are NOT in git and NOT deployed by Vercel. They must be manually applied to the Firebase Console (Realtime Database → Rules) or via `firebase deploy --only database`. This is the only out-of-code action required for SYNC-05.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| firebase/database SDK | SYNC-01, SYNC-04 | Yes | 12.8.0 (installed) | — |
| Firebase Auth SDK | uid for writes | Yes | 12.8.0 (installed) | — |
| Firebase RTDB service | Remote writes | Yes | `lepdy-c29da-default-rtdb.firebaseio.com` | Local-only (unsigned-out path) |
| Node.js | Build | Yes | (project runs) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all dependencies are present.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm test -- --grep "cloud-sync"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-01 | Progress write fires after authenticated activity | manual-only | — | N/A |
| SYNC-04 | App works fully offline — no errors | smoke | `npm test` (existing tests run offline-agnostic) | Existing |
| SYNC-05 | Security rules block cross-user reads | manual-only | — | N/A |

**SYNC-01 and SYNC-05 are manual-only** because:
- SYNC-01 requires a real Firebase connection and authenticated user — Playwright tests use `localStorage.setItem` to skip init, not real auth
- SYNC-05 requires deploying security rules and testing with two different auth tokens — not feasible in automated E2E without a test Firebase project

**SYNC-04 smoke coverage:** Existing Playwright tests verify the app loads and is navigable. Since signed-out behavior must be unchanged (and tests run without auth), passing the existing test suite validates zero behavioral regression for the signed-out path.

### Sampling Rate

- **Per task commit:** `npm run lint` — catches TypeScript errors in new sync code
- **Per wave merge:** `npm test` — full Playwright suite confirms no regressions
- **Phase gate:** Full suite green + manual RTDB write verification before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers regression detection. New sync behavior requires manual verification against live Firebase (document in plan as a manual step).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firestore `enableIndexedDbPersistence()` | RTDB — offline is automatic | Firebase v9+ | RTDB does not need explicit offline persistence call; it works by default |
| Firebase compat SDK (`firebase/app` v8) | Firebase Modular SDK (`firebase/app` v9+) | Firebase v9 | Dynamic `await import('firebase/database')` pattern matches existing codebase |

**Deprecated/outdated:**
- `firebase.database().ref()` (compat API): Replaced by `import { ref, set } from 'firebase/database'` — project uses modular SDK.
- `enableOfflinePersistence()`: This is a Firestore API. RTDB offline behavior is always-on in the Web SDK.

---

## Open Questions

1. **Where exactly does streak sync live in the RTDB path?**
   - What we know: Category progress lives at `users/{uid}/progress/{category}`. Streak is not a category.
   - What's unclear: Should streak be at `users/{uid}/streak` (flat sibling) or `users/{uid}/progress/streak` (grouped with progress)?
   - Recommendation: `users/{uid}/streak` as a flat sibling — streak is conceptually different from item-heard progress; this separation makes Phase 27 (merge) cleaner.

2. **Resolve Firestore vs RTDB formally**
   - What we know: RTDB is already in use. No Firestore SDK installed. STATE.md flags it as an open decision.
   - What's unclear: Was this ever formally decided?
   - Recommendation: Treat RTDB as the resolved decision — it is already wired, present in `package.json`, and used for leaderboards. Document the decision in STATE.md as resolved during Phase 26.

3. **Which progress hooks need syncing?**
   - What we know: Letters, Numbers, Animals, Games, WordCollection, Streak exist in contexts. ChessProgress and PuzzleProgress exist as hooks but are not in `providers.tsx`.
   - What's unclear: Should chess/puzzle progress sync in Phase 26?
   - Recommendation: Sync only what lives in `providers.tsx` context providers (the 6 items above). ChessProgress and PuzzleProgress are not globally provided — they are local hook instances. Phase 26 focuses on the provider layer. Chess sync can be deferred.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection: `lib/firebase.ts`, `lib/firebaseAuth.ts`, `hooks/useCategoryProgress.ts`, `hooks/useStreak.ts`, `hooks/useGamesProgress.ts`, `contexts/AuthContext.tsx`, `app/providers.tsx`, `lib/firebaseApp.ts`
- Firebase version verified: `firebase@12.8.0` installed (latest: 12.11.0)
- `package.json` — confirmed no Firestore SDK present

### Secondary (MEDIUM confidence)

- Firebase RTDB Web SDK offline behavior: RTDB offline queue is automatic in Web SDK v9+ (no explicit call needed). Verified by Firebase documentation pattern (Web modular API).
- Firebase security rules wildcard `$uid` pattern: standard RTDB rules pattern documented in Firebase console and official guides.

### Tertiary (LOW confidence)

- None — all critical claims verified against codebase or well-established Firebase behavior.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified installed packages and existing patterns
- Architecture: HIGH — directly inferred from existing hook/context patterns in codebase
- Pitfalls: HIGH — derived from code analysis of unstable references, initialization order, and deployment requirements
- Security rules: MEDIUM — rules syntax is well-established; deployment method not confirmed (no `firebase.json` in repo)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable Firebase RTDB API)
