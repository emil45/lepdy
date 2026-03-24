# Phase 27: Cloud Read and Merge - Research

**Researched:** 2026-03-25
**Domain:** Firebase RTDB read-on-sign-in, union merge strategy, localStorage hydration
**Confidence:** HIGH

## Summary

Phase 27 implements the read side of cloud sync: when a user signs in, their cloud-stored progress is fetched from Firebase RTDB and merged with whatever is in localStorage. The merge strategy is "union / most progress wins" — no item is ever un-heard, no click count regresses, no game achievement is lost. After merge, localStorage is updated so the existing React context providers automatically pick up the merged state on their next read cycle (via a page reload or a targeted setState path).

The data landscape is fully known from Phase 26. Six RTDB paths are written by the existing context providers: `users/{uid}/progress/letters`, `progress/numbers`, `progress/animals`, `progress/games`, `progress/words`, and `streak`. Each path has a well-defined TypeScript shape. A single new hook — `useMergeOnSignIn` — observes the auth state transition `null → User`, fetches all six paths in parallel, merges each against the current localStorage values, writes the merged result back to localStorage, then marks the session as merged using `sessionStorage` to prevent repeat runs.

The trickiest merge is streak: two devices can independently accumulate streaks. The resolution rule is "take the higher currentStreak and higher longestStreak; keep the more-recent lastActivityDate; preserve freeze state from whichever device was more recently active." This rule is deterministic and safe.

**Primary recommendation:** Implement `useMergeOnSignIn` as a standalone hook placed in `AuthProvider` (or called from `useAuth`), triggered by a `null → User` state transition, guarded by `sessionStorage` to run exactly once per sign-in.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYNC-02 | On first sign-in, localStorage progress merges into cloud using union strategy (no progress lost) | Union merge function covers this; local wins for items not in cloud |
| SYNC-03 | On subsequent sign-in, cloud data merges into localStorage for cross-device sync | Same merge hook covers this; union means cloud data enriches local without overwriting |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/database | 12.8.0 (project) | RTDB `ref`, `get` for one-time reads | Already used in `lib/firebase.ts` and `useProgressSync`; no new dependency |
| React hooks | 19.2.3 (project) | `useEffect`, `useRef` for sign-in transition detection | Consistent with every other hook in the codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sessionStorage (browser) | n/a | "merged this session" guard — persists across React re-renders but clears on tab close | Prevents double-merge on token refresh or StrictMode double-invoke |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sessionStorage guard | useRef guard | useRef resets on full page reload; sessionStorage survives soft navigations and React StrictMode double-mounts while still clearing on sign-out (tab close) |
| Single-run useEffect | onAuthStateChanged subscriber inside hook | Same thing under the hood; hook pattern is consistent with `useAuth` |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
The new hook lives alongside existing sync infrastructure:

```
hooks/
├── useProgressSync.ts       # Phase 26 — debounced write-through
└── useMergeOnSignIn.ts      # Phase 27 — read + union merge on auth transition
```

The hook is called once from `useAuth` (or `AuthProvider`) so it benefits from the same lifecycle as auth state.

### Pattern 1: Detect null → User Transition

The key challenge is running merge exactly once when the user transitions from signed-out to signed-in, not on every render where `user` is non-null.

```typescript
// hooks/useMergeOnSignIn.ts
'use client';

import { useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';

const SESSION_KEY = 'lepdy_merge_done';

export function useMergeOnSignIn(user: User | null, loading: boolean): void {
  const prevUidRef = useRef<string | null | undefined>(undefined); // undefined = not yet known

  useEffect(() => {
    // Wait until auth has finished initializing
    if (loading) return;

    const prevUid = prevUidRef.current;
    const currentUid = user?.uid ?? null;

    // Detect transition: was not signed in (null or uninitialized), now is signed in
    const isSignInTransition =
      currentUid !== null &&
      (prevUid === undefined || prevUid === null) &&
      prevUid !== currentUid;

    prevUidRef.current = currentUid;

    if (!isSignInTransition) return;

    // Guard: only merge once per browser session
    if (sessionStorage.getItem(SESSION_KEY) === currentUid) return;

    runMerge(currentUid).then(() => {
      sessionStorage.setItem(SESSION_KEY, currentUid);
    });
  }, [user, loading]);
}
```

**Why `prevUidRef` starts as `undefined`:** On the very first auth resolution, `prevUid` will be `undefined` and `currentUid` will be the UID (user was already signed in from a previous session). This correctly triggers merge for "already signed in on page load" as well as "just clicked sign-in."

### Pattern 2: Parallel RTDB Reads

All six paths fetched in a single `Promise.all` call to minimize latency. Uses the same dynamic-import pattern as `useProgressSync`.

```typescript
async function fetchCloudData(uid: string) {
  const { getFirebaseDatabase } = await import('@/lib/firebase');
  const { ref, get } = await import('firebase/database');
  const db = await getFirebaseDatabase();

  const paths = [
    'progress/letters',
    'progress/numbers',
    'progress/animals',
    'progress/games',
    'progress/words',
    'streak',
  ];

  const snapshots = await Promise.all(
    paths.map((path) => get(ref(db, `users/${uid}/${path}`)))
  );

  return Object.fromEntries(
    paths.map((path, i) => [path, snapshots[i].exists() ? snapshots[i].val() : null])
  );
}
```

### Pattern 3: Union Merge per Data Type

**Category progress** (`progress/letters`, `progress/numbers`, `progress/animals`):

```typescript
function mergeCategoryProgress(
  local: CategoryProgressData | null,
  cloud: { heardItemIds: string[]; totalClicks: number } | null
): CategoryProgressData {
  const localIds = local?.heardItemIds ?? [];
  const cloudIds = cloud?.heardItemIds ?? [];
  return {
    heardItemIds: Array.from(new Set([...localIds, ...cloudIds])),
    totalClicks: Math.max(local?.totalClicks ?? 0, cloud?.totalClicks ?? 0),
  };
}
```

**Games progress** (`progress/games`):

```typescript
function mergeGamesProgress(local: GamesProgressData, cloud: GamesProgressData | null): GamesProgressData {
  if (!cloud) return local;
  return {
    completedGameTypes: Array.from(new Set([...local.completedGameTypes, ...(cloud.completedGameTypes ?? [])])),
    memoryWins: Math.max(local.memoryWins, cloud.memoryWins ?? 0),
    simonHighScore: Math.max(local.simonHighScore, cloud.simonHighScore ?? 0),
    speedChallengeHighScores: Math.max(local.speedChallengeHighScores, cloud.speedChallengeHighScores ?? 0),
    wordBuilderCompletions: Math.max(local.wordBuilderCompletions, cloud.wordBuilderCompletions ?? 0),
    soundMatchingPerfect: Math.max(local.soundMatchingPerfect, cloud.soundMatchingPerfect ?? 0),
    countingGameCompletions: Math.max(local.countingGameCompletions, cloud.countingGameCompletions ?? 0),
    totalGamesCompleted: Math.max(local.totalGamesCompleted, cloud.totalGamesCompleted ?? 0),
  };
}
```

**Word collection** (`progress/words`):

```typescript
function mergeWordCollection(local: WordCollectionData, cloud: WordCollectionData | null): WordCollectionData {
  if (!cloud) return local;
  const merged = new Map<string, CollectedWord>();
  for (const word of [...local.collectedWords, ...(cloud.collectedWords ?? [])]) {
    const existing = merged.get(word.wordId);
    if (!existing) {
      merged.set(word.wordId, word);
    } else {
      merged.set(word.wordId, {
        wordId: word.wordId,
        timesBuilt: existing.timesBuilt + word.timesBuilt,
        firstBuiltDate: existing.firstBuiltDate < word.firstBuiltDate
          ? existing.firstBuiltDate
          : word.firstBuiltDate,
        lastBuiltDate: existing.lastBuiltDate > word.lastBuiltDate
          ? existing.lastBuiltDate
          : word.lastBuiltDate,
      });
    }
  }
  return {
    collectedWords: Array.from(merged.values()),
    totalWordsBuilt: Math.max(local.totalWordsBuilt, cloud.totalWordsBuilt ?? 0),
  };
}
```

**Streak** (`streak`):

```typescript
function mergeStreak(local: StreakData, cloud: StreakData | null): StreakData {
  if (!cloud) return local;
  // Pick the device with more recent last activity as the authoritative base,
  // then take maximums for streak counters.
  const useLocalBase = !cloud.lastActivityDate ||
    (local.lastActivityDate >= cloud.lastActivityDate);
  const base = useLocalBase ? local : cloud;
  return {
    ...base,
    currentStreak: Math.max(local.currentStreak, cloud.currentStreak ?? 0),
    longestStreak: Math.max(local.longestStreak, cloud.longestStreak ?? 0),
  };
}
```

**Note on streak field name:** `useStreak.ts` uses `longestStreak`, not `bestStreak`. The merge function must use the correct field name.

### Pattern 4: Write Merged Data to localStorage

After merge, write each category back to localStorage using the same storage keys used by the existing hooks. This causes the hooks to pick up the merged data on next read.

**localStorage keys (from existing hooks):**
| Data | localStorage key | Hook |
|------|-----------------|------|
| Letters | `lepdy_letters_progress` | `useLettersProgress` → `useCategoryProgress` |
| Numbers | `lepdy_numbers_progress` | `useNumbersProgress` → `useCategoryProgress` |
| Animals | `lepdy_animals_progress` | `useAnimalsProgress` → `useCategoryProgress` |
| Games | `lepdy_games_progress` | `useGamesProgress` |
| Words | `lepdy_word_collection` | `useWordCollectionProgress` |
| Streak | `lepdy_streak_data` | `useStreak` |

**Important:** The context providers have already initialized from localStorage by the time `useMergeOnSignIn` runs (Firebase Auth resolves asynchronously, well after React mount). Writing back to localStorage does NOT automatically update the React state already in memory. Two approaches:

1. **Page reload after merge** — simplest, guarantees consistency, but disruptive UX.
2. **Expose setState setters from each context** — clean but requires touching 6 contexts.
3. **`window.location.reload()` only on first ever sign-in** — acceptable since first sign-in is rare.

**Recommended:** Issue a silent page reload after the merge completes. The `sessionStorage` guard ensures the reload does not trigger another merge. The UX impact is minimal because first sign-in is a one-time event. For subsequent sign-ins (already merged this session), no reload is needed because the user is signing into a fresh session anyway (new tab or new page load).

### Anti-Patterns to Avoid

- **Running merge on every `user` truthy check:** Without the `null → User` transition guard, merge runs on every render where the user is signed in, overwriting fresh local writes with old cloud data.
- **Using a module-level boolean for the "already merged" guard:** Module singletons reset on React Fast Refresh during development and on service worker updates. `sessionStorage` survives these.
- **Mutating RTDB during merge:** The merge hook only writes to localStorage. The merged localStorage data will be picked up by `useProgressSync` and written to RTDB via the existing debounced path — no direct RTDB write needed from the merge hook.
- **Awaiting merge before rendering the app:** Merge must be fire-and-forget with respect to rendering. Progress contexts render from localStorage immediately; merge enriches that data asynchronously.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RTDB one-time read | Custom fetch wrapper | `firebase/database` `get()` | Already used in `lib/firebase.ts`; `get()` resolves once, no live subscription needed |
| Deduplication of string arrays | Custom loop | `new Set([...a, ...b])` | Built-in; handles empty arrays gracefully |
| "Run once per session" guard | React ref + flag | `sessionStorage` | Survives StrictMode double-mounts; resets on tab close / sign-out |

---

## Common Pitfalls

### Pitfall 1: React StrictMode Double-Mount
**What goes wrong:** In development, React 18+ StrictMode mounts components twice. The `useEffect` in `useMergeOnSignIn` fires twice. Without a guard, merge runs twice, potentially causing a race condition where the second run reads stale localStorage (before the first run's writes settle).
**Why it happens:** StrictMode intentionally double-invokes effects to surface side-effect bugs.
**How to avoid:** Check `sessionStorage.getItem(SESSION_KEY) === uid` before starting the merge. The first invocation sets the key; the second invocation sees it and exits immediately.
**Warning signs:** Console logs showing merge running twice in quick succession during dev.

### Pitfall 2: Field Name Mismatch Between localStorage Format and RTDB Format
**What goes wrong:** `useCategoryProgress` stores `heardItemIds` in localStorage. Phase 26 writes the same field to RTDB. However, `useLettersProgress` exposes `heardLetterIds` (a Set) as the public API. The merge function must read from `heardItemIds` (the storage format) not from the public hook return value.
**Why it happens:** `useLettersProgress` wraps `useCategoryProgress` and renames the field for backward compatibility.
**How to avoid:** Read directly from `localStorage.getItem(storageKey)` and parse to `CategoryProgressData`, which always uses `heardItemIds`. Do not attempt to read from context hook return values.

### Pitfall 3: Streak `longestStreak` vs `bestStreak`
**What goes wrong:** `StreakData` interface uses `longestStreak`. A merge function written from memory might use `bestStreak` (a common alternative name), causing the field to be silently dropped from the merged object.
**Why it happens:** Naming inconsistency between common mental models and actual implementation.
**How to avoid:** Read `hooks/useStreak.ts` `StreakData` interface before writing the merge function. Use TypeScript strict mode — the type checker will catch wrong field names at compile time.

### Pitfall 4: Context State Staleness After localStorage Write
**What goes wrong:** After writing merged data to localStorage, React context providers still hold their original in-memory state. The UI shows pre-merge progress until the user navigates to a new page or refreshes.
**Why it happens:** React state is not backed directly by localStorage; hooks read from localStorage only on mount.
**How to avoid:** Issue `window.location.reload()` after the merge write completes (only on the first sign-in, guarded by sessionStorage). On reload, context providers re-mount and read the merged localStorage. `useProgressSync` then picks up the enriched data and queues a debounced RTDB write.

### Pitfall 5: Merge Running on Sign-Out / Sign-In Bounce
**What goes wrong:** If a user signs out and back in within the same tab, the `null → User` transition fires again. Without a guard that is tied to the specific UID, merge could run again for the same user.
**How to avoid:** Store the UID (not just a boolean) in sessionStorage: `sessionStorage.setItem(SESSION_KEY, uid)`. Check `sessionStorage.getItem(SESSION_KEY) === uid` — if the same user signs back in, merge is skipped. If a different user signs in, the key won't match and merge runs correctly for the new user.

---

## Code Examples

### LocalStorage Read Pattern (from useCategoryProgress)
```typescript
// Source: hooks/useCategoryProgress.ts — loadProgressData()
const stored = localStorage.getItem(storageKey);
if (stored) {
  const parsed = JSON.parse(stored);
  // parsed.heardItemIds is string[]
  // parsed.totalClicks is number
}
```

### RTDB One-Time Read Pattern (from lib/firebase.ts)
```typescript
// Source: lib/firebase.ts — getTopScore(), same pattern
const db = await getFirebaseDatabase();
const { ref, get } = await import('firebase/database');
const snapshot = await get(ref(db, `users/${uid}/progress/letters`));
const cloudData = snapshot.exists() ? snapshot.val() : null;
```

### RTDB Paths Written by Phase 26
```
users/{uid}/progress/letters   → { heardItemIds: string[], totalClicks: number }
users/{uid}/progress/numbers   → { heardItemIds: string[], totalClicks: number }
users/{uid}/progress/animals   → { heardItemIds: string[], totalClicks: number }
users/{uid}/progress/games     → { completedGameTypes, memoryWins, simonHighScore, ... }
users/{uid}/progress/words     → { collectedWords: CollectedWord[], totalWordsBuilt: number }
users/{uid}/streak             → { currentStreak, lastActivityDate, longestStreak, freezesRemaining, ... }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual last-write-wins sync | Union merge (most progress wins) | Decision made at milestone planning | No item is ever lost; safe for family shared devices |
| Merge on every page load | Merge only on sign-in transition | Phase 27 decision | Prevents unnecessary RTDB reads and race conditions |

---

## Open Questions

1. **Streak edge case: two devices with independent active streaks in same week**
   - What we know: STATE.md flags this as a pre-condition to resolve before coding
   - What's unclear: Which `currentStreak` value "wins" — the decision is "take the maximum" but if Device A has streak=5 (last active yesterday) and Device B has streak=3 (last active today), the merged result would be `currentStreak=5`, `lastActivityDate=today`. This is correct — the parent's actual streak is 5 since they were active both days.
   - Recommendation: Use `Math.max(local.currentStreak, cloud.currentStreak)` and take the more-recent `lastActivityDate`. This is deterministic, safe, and consistent with the "union / most progress wins" principle. Document the rule as a comment in the merge function.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code-only changes using already-installed Firebase SDK and browser localStorage/sessionStorage APIs.

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
| SYNC-02 | First sign-in preserves local progress (union merge) | unit (merge logic) | n/a — pure function unit test | ❌ Wave 0 |
| SYNC-02 | App does not crash when merge hook mounts | smoke | `npm test` (existing suite) | ✅ |
| SYNC-03 | Cloud data appears in localStorage after merge | unit (merge logic) | n/a — pure function unit test | ❌ Wave 0 |
| SYNC-03 | Merge fires only once per sign-in (sessionStorage guard) | unit | n/a — pure function unit test | ❌ Wave 0 |

**Note on E2E feasibility:** The merge flow requires Firebase Auth — not testable in the current Playwright-only E2E suite without mocking Firebase. The existing E2E suite verifies the app does not crash, which is sufficient for smoke coverage. Unit tests for the pure merge functions (no Firebase dependency) are the appropriate automated validation layer.

### Sampling Rate
- **Per task commit:** `npm test` (existing Playwright suite — smoke coverage)
- **Per wave merge:** `npm test`
- **Phase gate:** Full Playwright suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/mergeProgress.test.ts` — unit tests for all merge functions (category, games, words, streak); pure functions with no Firebase dependency; covers SYNC-02 and SYNC-03
- [ ] Framework install: no new install needed — add `vitest` or use Jest if a unit test runner is desired; alternatively test as pure TypeScript functions inline

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `hooks/useProgressSync.ts`, `hooks/useAuth.ts`, `hooks/useCategoryProgress.ts`, `hooks/useStreak.ts`, `hooks/useGamesProgress.ts`, `hooks/useWordCollectionProgress.ts` — all data shapes and storage keys verified from source
- Direct codebase inspection: `contexts/LettersProgressContext.tsx`, `NumbersProgressContext.tsx`, `AnimalsProgressContext.tsx`, `GamesProgressContext.tsx`, `WordCollectionContext.tsx`, `StreakContext.tsx` — RTDB paths verified from Phase 26 implementation
- Direct codebase inspection: `lib/firebase.ts` — RTDB `get()` pattern verified
- Direct codebase inspection: `app/providers.tsx` — provider hierarchy and AuthProvider placement verified

### Secondary (MEDIUM confidence)
- Firebase RTDB `get()` one-time read: consistent with existing codebase usage; well-established Firebase SDK API

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in the project; no new libraries needed
- Architecture: HIGH — patterns verified against actual code, not hypothetical
- Merge logic: HIGH — data shapes fully known from Phase 26 code; merge rules are deterministic
- Pitfalls: HIGH — derived from direct code reading (field names, hook lifecycle, StrictMode behavior)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — no external API changes expected; internal code is fixed)
