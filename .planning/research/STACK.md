# Stack Research

**Domain:** Firebase Auth + Cloud Sync — optional Google login with offline-first progress sync
**Project:** Lepdy v1.5 Cloud Sync
**Researched:** 2026-03-23
**Confidence:** HIGH

---

## Verdict: No New npm Packages Required

**Zero new npm packages needed for v1.5.** Firebase Auth and Cloud Firestore are already included in the installed `firebase@12.8.0` package. All required APIs — `firebase/auth`, `firebase/firestore` — ship inside the existing dependency.

---

## Context: What Already Exists

| Already In Place | Version | Purpose |
|-----------------|---------|---------|
| `firebase` | 12.8.0 (latest: 12.11.0) | Auth + Firestore modules included; no new install |
| `firebase/database` | — | Realtime Database — used for leaderboards |
| `firebase/remote-config` | — | Feature flags |
| `lib/firebaseApp.ts` | — | Lazy-init singleton pattern (`getFirebaseApp()`) |
| `lib/firebase.ts` | — | Lazy `getFirebaseDatabase()` pattern to follow |
| `contexts/*Context.tsx` | — | Pattern for auth context (matches `FeatureFlagContext`) |
| `localStorage` (12 keys) | — | All user progress; remains the immediate source of truth |

---

## Recommended Stack

### Core Technologies (New Modules, No New Packages)

| Technology | Module | Purpose | Why Recommended |
|------------|--------|---------|-----------------|
| Firebase Auth | `firebase/auth` | Google sign-in, user identity, auth state listener | Already in `firebase@12.8.0`. `onAuthStateChanged` is the standard pattern for React. Handles token refresh automatically. Zero additional bundle cost beyond what's tree-shaken in. |
| Cloud Firestore | `firebase/firestore` | Cloud document store for per-user progress sync | Already in `firebase@12.8.0`. Chosen over Realtime Database (already used for leaderboards) because Firestore has first-class web offline persistence via IndexedDB, structured document model, and per-document merge writes. |
| Firestore Offline Cache | `initializeFirestore` + `persistentLocalCache` | IndexedDB-backed offline cache so reads/writes work without connection | Modern API (Firebase 10+). The deprecated `enableIndexedDbPersistence()` must NOT be used. Supports multi-tab via `persistentMultipleTabManager()`. Offline persistence is a Firestore differentiator vs RTDB on web. |

### Supporting Libraries (All Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@mui/material` | 7.3.7 | Google sign-in button, auth state UI in settings drawer | For the login/logout UI affordance in existing settings drawer |
| `next-intl` | 4.7.0 | Translate auth UI strings (sign in, sign out, syncing...) | All user-visible auth text needs he/en/ru translations |
| `react` context | 19.2.3 | Auth state context (`AuthContext.tsx`) | Follows existing `FeatureFlagContext` / `StreakContext` pattern |

### Development Tools (No Changes Needed)

| Tool | Purpose | Notes |
|------|---------|-------|
| Firebase Console | Configure Firestore Security Rules, enable Auth providers | Enable Google sign-in in Firebase Console → Authentication → Sign-in providers |
| Firebase Emulator Suite | Local Firestore + Auth emulation for dev/test | Optional but useful; `firebase emulators:start` |

---

## Implementation Patterns

### Firebase Auth Initialization (Follow Existing Pattern)

```typescript
// lib/firebaseAuth.ts — mirrors lib/firebase.ts pattern
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

**Why lazy import:** `firebase/auth` must never be imported at module top-level in Next.js — it accesses browser APIs and breaks SSR. The `getFirebaseAuth()` pattern matches `getFirebaseDatabase()` already in `lib/firebase.ts`.

### Google Sign-In: Popup + Redirect Split

```typescript
// Use popup on desktop, redirect on mobile
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
if (isMobile) {
  // Redirect avoids popup-blocking on iOS Safari and Android
  await signInWithRedirect(auth, provider);
  // Result handled via getRedirectResult() on next page load
} else {
  // Popup is better UX on desktop (no full-page nav)
  const result = await signInWithPopup(auth, provider);
}
```

**Why the split:** `signInWithPopup` fails silently on iOS Safari and some Android browsers. On Vercel (non-Firebase-Hosting), the default `Cross-Origin-Opener-Policy: same-origin` header blocks the popup's `window.closed` polling, breaking the auth flow. `signInWithRedirect` bypasses both issues.

**Vercel COOP fix if popup is used on desktop** (add to `next.config.ts`):
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }],
  }];
}
```

### Firestore Initialization with Offline Persistence

```typescript
// lib/firebaseFirestore.ts
import type { Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './firebaseApp';

let firestoreInstance: Firestore | null = null;

export async function getFirestoreDb(): Promise<Firestore> {
  if (!firestoreInstance) {
    const app = await getFirebaseApp();
    const {
      initializeFirestore,
      persistentLocalCache,
      persistentMultipleTabManager,
    } = await import('firebase/firestore');
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return firestoreInstance;
}
```

**Why `initializeFirestore` not `getFirestore`:** The `localCache` option is only settable at init time. `getFirestore()` returns the default memory-only instance. Initialization must happen before any reads or writes.

### Auth Context (New File, Follows Existing Pattern)

```typescript
// contexts/AuthContext.tsx
// Exposes: user (User | null), isLoading, signInWithGoogle(), signOut()
// Wrap in app/providers.tsx before progress providers
// Uses onAuthStateChanged for reactive state
```

In `app/providers.tsx`, wrap outside all progress providers — auth must resolve before sync can run.

### Firestore Document Shape (1:1 Mapping from localStorage Keys)

```
Firestore path: users/{uid}/progress/{key}

Each localStorage key → one Firestore document:
  users/{uid}/progress/lepdy_letters_progress
  users/{uid}/progress/lepdy_numbers_progress
  users/{uid}/progress/lepdy_animals_progress
  users/{uid}/progress/lepdy_chess_progress
  users/{uid}/progress/lepdy_chess_puzzle_progress
  users/{uid}/progress/lepdy_sticker_data
  users/{uid}/progress/lepdy_word_collection
  users/{uid}/progress/lepdy_streak_data
  users/{uid}/progress/lepdy_games_progress

Preferences (not merged, last-write-wins):
  users/{uid}/settings/lepdy_chess_piece_theme   → { value: "staunty" }
  users/{uid}/settings/lepdy_chess_board_theme   → { value: "pastel" }
```

**Why direct key mapping:** No data transformation needed. Sync layer is a thin wrapper. First-login merge is at document level: union `heardItemIds` arrays, take `max` of numeric counters.

**Sync writes use `setDoc` with `{ merge: true }`:** Prevents overwriting concurrent edits.

### First-Login Merge Strategy

```typescript
// On first login (cloud doc exists + localStorage exists):
// 1. Read localStorage data
// 2. Read Firestore document
// 3. heardItemIds: new Set([...local.heardItemIds, ...cloud.heardItemIds])
// 4. totalClicks: Math.max(local.totalClicks, cloud.totalClicks)
// 5. Write merged result to both Firestore and localStorage
```

### Offline-First Flow

```
User interaction → localStorage (immediate, synchronous)
                 → Firestore write (async, queued if offline)
Reconnect       → Firestore flushes queued writes automatically
New device login → Read Firestore → hydrate localStorage → hooks read localStorage as normal
```

Progress hooks (`useCategoryProgress`, `useChessProgress`, etc.) never change — they continue reading from localStorage. The sync layer runs alongside them as a side effect.

---

## Installation

No new packages required. All Firebase modules are already available in `firebase@12.8.0`:

```bash
# Nothing to install — firebase@12.8.0 already includes:
# firebase/auth        → Auth, getAuth, GoogleAuthProvider, signInWithPopup,
#                        signInWithRedirect, getRedirectResult, signOut,
#                        onAuthStateChanged
# firebase/firestore   → initializeFirestore, persistentLocalCache,
#                        persistentMultipleTabManager, doc, getDoc, setDoc,
#                        updateDoc, onSnapshot, collection, getFirestore
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Cloud Firestore | Realtime Database (already used for leaderboards) | RTDB is fine for simple key/value leaderboards (always-online). Firestore is better here because its web offline persistence (IndexedDB, multi-tab) is more mature; RTDB web offline support is less robust and less documented for complex data structures. |
| No new npm packages | `next-firebase-auth` | Use `next-firebase-auth` when you need SSR session cookies (e.g., protecting server-rendered pages behind auth). Lepdy is fully client-rendered; no SSR auth requirements. Adds session cookie complexity with no benefit. |
| No new npm packages | `firebase-admin` SDK | Use Admin SDK only in server-side routes (API routes, server actions) for privileged operations. Lepdy has no server-side auth requirements — all sync is client-side. |
| `signInWithPopup` + `signInWithRedirect` split | `signInWithPopup` only | Use popup-only if you control hosting headers (e.g., Firebase Hosting) and only target desktop. Lepdy is on Vercel and must support mobile tablets (primary device for kids). |
| `initializeFirestore` with `persistentLocalCache` | `enableIndexedDbPersistence()` (deprecated) | Deprecated since Firebase 10; will be removed. Do not use. |
| Lazy dynamic imports (`firebase/auth`, `firebase/firestore`) | Top-level imports | Top-level imports break Next.js SSR (server components access browser APIs, crash). Lazy pattern already proven by `lib/firebase.ts` and `lib/firebaseApp.ts`. |
| Client-side auth only | `FirebaseServerApp` + server sessions | `FirebaseServerApp` (introduced Firebase 10.10.0) enables SSR auth for protected server-rendered pages. Not needed here — Lepdy is fully client-rendered and no pages require server-side auth. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `enableIndexedDbPersistence()` | Deprecated since Firebase 10; will be removed | `initializeFirestore(app, { localCache: persistentLocalCache() })` |
| `enableMultiTabIndexedDbPersistence()` | Deprecated since Firebase 10 | `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` |
| `getFirestore()` without `initializeFirestore` first | Returns memory-only instance; offline persistence cannot be added after init | `initializeFirestore()` with `localCache` option (call once, before any reads/writes) |
| `signInWithPopup` on mobile without fallback | Fails on iOS Safari; triggers Vercel COOP errors breaking the auth flow | Detect mobile and use `signInWithRedirect` |
| `firebase-admin` | Server-only; crashes in browser bundle | Client SDK (`firebase/auth`, `firebase/firestore`) |
| `next-firebase-auth` npm package | Adds session cookie complexity; Lepdy has no SSR auth requirements | Direct `firebase/auth` + client-side `onAuthStateChanged` |
| `setDoc(ref, data)` without `{ merge: true }` | Overwrites entire document; risks clobbering concurrent writes from another device | `setDoc(ref, data, { merge: true })` or `updateDoc` for partial updates |
| Top-level `import` of `firebase/auth` or `firebase/firestore` | Accesses browser APIs; breaks Next.js SSR and server component rendering | Lazy `await import('firebase/auth')` inside async functions (pattern in `lib/firebase.ts`) |

---

## Stack Patterns by Variant

**If user is NOT logged in:**
- Pure localStorage, zero behavior change from today
- No Firestore reads or writes occur
- Auth context exposes `user: null`
- Progress hooks are unchanged

**If user logs in for the first time (has existing localStorage data):**
1. Read all `lepdy_*` localStorage keys
2. Read matching Firestore documents
3. Merge: `heardItemIds` → union; `totalClicks` → max
4. Write merged result to Firestore (`setDoc` with `{ merge: true }`)
5. Update localStorage with merged result
6. Progress hooks continue reading from localStorage as before

**If user logs in on a new device (empty localStorage):**
1. Auth resolves → `onAuthStateChanged` fires
2. Read Firestore documents for user
3. Hydrate localStorage from cloud data
4. Progress hooks read from localStorage as normal — zero change to hook code

**If device goes offline after login:**
- Firestore `persistentLocalCache` serves reads from IndexedDB
- Writes queue locally, flush automatically on reconnect
- localStorage remains the immediate, synchronous UI source throughout

---

## Version Compatibility

| Package | Installed | Latest | Notes |
|---------|-----------|--------|-------|
| `firebase` | 12.8.0 | 12.11.0 | 12.8.0 supports all required Auth + Firestore APIs including `persistentLocalCache`. Upgrade to 12.11.0 optional. No breaking changes in Auth or Firestore between 12.8 and 12.11. |

---

## Firestore Security Rules Needed

Before going live, configure Firestore security rules to allow only the authenticated user to read/write their own data:

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This is a Firebase Console configuration step, not a code change.

---

## Sources

- [Firebase JS SDK Release Notes](https://firebase.google.com/support/release-notes/js) — Confirmed 12.11.0 latest; 12.8.0 contains all required APIs (HIGH confidence, official)
- [Firebase Auth Google Sign-In Web docs](https://firebase.google.com/docs/auth/web/google-signin) — `signInWithPopup` / `signInWithRedirect` import patterns confirmed (HIGH confidence, official)
- [Firebase Redirect Best Practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) — Mobile redirect recommendation (HIGH confidence, official)
- [Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline) — `persistentLocalCache` modern API, deprecation of `enableIndexedDbPersistence`, IndexedDB, browser support (HIGH confidence, official)
- [Firestore vs Realtime Database](https://firebase.google.com/docs/firestore/rtdb-vs-firestore) — Firestore recommended for new features; better web offline support (HIGH confidence, official)
- [Vercel/Next.js COOP + signInWithPopup issue discussion](https://github.com/vercel/next.js/discussions/51135) — COOP header blocking popup flow on Vercel (MEDIUM confidence, GitHub community discussion)
- [Firebase SDK Issue #8541](https://github.com/firebase/firebase-js-sdk/issues/8541) — COOP/popup issue confirmed in Firebase SDK (MEDIUM confidence, GitHub issue)
- [Firebase Modular JS SDK docs](https://modularfirebase.web.app/reference/firestore_.enableindexeddbpersistence) — Deprecation of `enableIndexedDbPersistence` confirmed (HIGH confidence)

---

*Stack research for: Lepdy v1.5 Cloud Sync (Firebase Auth + Firestore)*
*Researched: 2026-03-23*
