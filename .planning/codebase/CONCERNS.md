# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**Production debugging logs in Firebase integration:**
- Issue: `console.log()` statement left in production code for score submission
- Files: `lib/firebase.ts:27`
- Impact: Logs score data to console on every successful submission, minor performance impact, exposes user data in browser console
- Fix approach: Remove `console.log('Score submitted:', score)` from `lib/firebase.ts` line 27 - keep only error logging

**Type safety compromises with `as unknown` casts:**
- Issue: Multiple `as unknown as` casts bypassing TypeScript's type system throughout the codebase
- Files: `utils/audio.ts:68`, `utils/amplitude.ts:27,36`, `hooks/useCategoryProgress.ts`, `app/[locale]/games/speed-challenge/page.tsx`, `app/[locale]/games/memory-match-game/page.tsx`
- Impact: Reduces compile-time type safety, makes refactoring riskier, harder to catch bugs early
- Fix approach: Replace type assertions with proper type definitions - particularly in `audio.ts` where enum iteration is unsafe, and in game components with `any[]` casts

**Untyped theme object in Modal styling:**
- Issue: Theme object typed as `any` in callback parameter
- Files: `app/[locale]/games/memory-match-game/page.tsx:35`
- Impact: Loses IDE autocomplete and type checking for theme properties
- Fix approach: Import and use MUI `Theme` type instead of `any`

**Disabled analytics in letter-tracing game:**
- Issue: Analytics hooks commented out, game marked as disabled but code not removed
- Files: `app/[locale]/games/letter-tracing/LetterTracingContent.tsx:18-22,40-42`
- Impact: Orphaned code, maintenance confusion, unclear game status
- Fix approach: Either fully remove letter-tracing game code or re-enable it properly with full analytics support

## Known Bugs

**Letter-tracing game explicitly disabled:**
- Symptoms: Game page loads but game is non-functional, excluded from E2E tests
- Files: `e2e/app.spec.ts:37` (excluded from games list), `app/[locale]/games/letter-tracing/LetterTracingContent.tsx`
- Trigger: Navigate to `/games/letter-tracing`
- Workaround: Game still accessible but untested - disable via feature flag rather than code comments

**Audio race condition in rapid game transitions:**
- Issue: `playAudio()` creates new Audio element on every call without cleanup; rapid calls can leave dangling audio players
- Files: `utils/audio.ts:92-102`
- Impact: Memory leak from unreleased audio elements, potential browser resource exhaustion in long play sessions
- Fix approach: Implement audio pool pattern - reuse HTMLAudioElement instances instead of creating new ones

**Feature flag initialization race condition:**
- Issue: If `useFeatureFlagContext()` is called before provider initializes, throws error immediately
- Files: `hooks/useFeatureFlags.ts`, `contexts/FeatureFlagContext.tsx:40-45`
- Impact: Components requiring flags on mount will crash if context initialization is slow
- Fix approach: Add `isLoading` check before accessing flags in context consumers, provide fallback defaults

## Security Considerations

**Amplitude API key exposed in source code:**
- Risk: Public API key visible in repository, could be abused to submit fake analytics events
- Files: `utils/amplitude.ts:10`
- Current mitigation: Key is already published but rate-limited by Amplitude
- Recommendations: Move to environment variable even though public; set up API key rotation in Amplitude console if compromised

**Firebase configuration publicly exposed:**
- Risk: Firebase config (projectId, databaseURL, apiKey) visible in source - allows direct database access
- Files: `lib/firebaseApp.ts:3-11`
- Current mitigation: Database has security rules; client-only SDK doesn't allow direct auth
- Recommendations: Verify Firebase Realtime Database rules are restrictive (whitelist leaderboard writes only); monitor for unexpected writes

**Console errors expose internal data:**
- Risk: Stack traces and error details visible to users in console
- Files: Multiple error logging statements
- Impact: Could leak implementation details about game structure
- Recommendations: In production, log errors to analytics instead of console; use generic user-facing messages

## Performance Bottlenecks

**Large game files with complex state management:**
- Problem: Letter-rain game is 887 lines with complex bubble spawning logic; counting-game is 647 lines
- Files: `app/[locale]/games/letter-rain/page.tsx`, `app/[locale]/games/counting-game/page.tsx`
- Cause: All game logic in single file, heavy DOM updates during animations
- Improvement path: Extract animation logic to custom hooks, memoize item generation, use requestAnimationFrame for pixel-perfect timing

**Audio preloading creates all 28 sounds on init:**
- Problem: All celebration sounds + game sounds preloaded regardless of current game
- Files: `utils/audio.ts:104-111`
- Cause: `preloadSounds()` called in layout-level providers, blocking initial render
- Improvement path: Lazy-load sounds per game, use intersection observer for background preload

**LocalStorage serialization on every game completion:**
- Problem: Full game progress object serialized and written on every game completion
- Files: `hooks/useGamesProgress.ts`, `hooks/useStickers.ts`, `hooks/useWordCollectionProgress.ts`
- Cause: No debouncing or batching of storage writes
- Improvement path: Debounce storage writes (500ms), batch multiple completion events, consider IndexedDB for large datasets

**Feature flag refresh creates new provider instance:**
- Problem: Each refresh call can potentially create overhead in provider singleton
- Files: `hooks/useFeatureFlags.ts:42-56`
- Cause: Provider initialized lazily but init promise stored globally
- Improvement path: Add caching with TTL for flag values, prevent concurrent fetch requests

## Fragile Areas

**Memory game card generation with `any` casts:**
- Files: `app/[locale]/games/memory-match-game/page.tsx:56-75`
- Why fragile: Uses `as any[]` on heterogeneous config array; refactoring item shapes breaks silently
- Safe modification: Add proper types for `CARD_CONFIGS` items, use discriminated unions for item types
- Test coverage: Only basic "page loads" E2E test; no card generation validation tests

**Letter-rain bubble spawning logic:**
- Files: `app/[locale]/games/letter-rain/page.tsx:35-97`
- Why fragile: Complex target spawn config with warmup/hardMax guardrails; off-by-one errors in probability calculations
- Safe modification: Unit test spawn timing independently; add console assertions (remove before deploy)
- Test coverage: No unit tests, only E2E load test

**localStorage schema changes across multiple hooks:**
- Files: `hooks/useGamesProgress.ts`, `hooks/useStickers.ts`, `hooks/useWordCollectionProgress.ts`, etc.
- Why fragile: Each hook has own storage key; no migration strategy when adding fields
- Safe modification: Add schema version field before adding optional fields; implement migration functions
- Test coverage: No storage migration tests

**Firebase scoresubmission without validation:**
- Files: `lib/firebase.ts:21-31`
- Why fragile: No input validation; stores any score value directly to database
- Safe modification: Add score range validation, timestamp sanity checks before write
- Test coverage: No Firebase integration tests

## Scaling Limits

**Real-time leaderboard storage model:**
- Current capacity: Handles individual scores per user per game (overwrite-only)
- Limit: Cannot track score history or per-user rankings; only latest score stored
- Scaling path: If needing historical data, migrate to timestamp-keyed entries; implement cleanup for old entries

**Sticker unlock system with multiple progress checks:**
- Current capacity: 8 different game types × 15 stickers ÷ completion conditions ~= 120 unlock checks per game
- Limit: Performance degrades as sticker count increases; `useStickerUnlockDetector` recalculates all conditions on every progress update
- Scaling path: Move unlock validation to game completion service, cache sticker unlock state with invalidation

**Audio asset duplication:**
- Current capacity: 28 game sounds + per-category pronunciation audio
- Limit: Creates separate Audio element per sound; memory grows linearly with sound count
- Scaling path: Implement shared AudioContext API, use single audio buffer for multiple playback instances

## Dependencies at Risk

**Firebase SDK major version dependency:**
- Risk: Major version bump (12.8.0) could have breaking API changes; limited testing of Firebase failures
- Impact: Leaderboard and Remote Config features would break
- Migration plan: Pin Firebase to `^12.x` in package.json; test against next major before upgrading; maintain fallback for network failures

**next-intl dependency without offline fallback:**
- Risk: Language pack loading at runtime; no cached fallback if CDN fails
- Impact: Site could be untranslatable if i18n service unavailable
- Migration plan: Build language packs into bundle instead of lazy-loading; reduce CDN dependency

**React 19.2.3 - recent version, limited LTS:**
- Risk: Cutting-edge version with potential hooks API changes
- Impact: Future Next.js updates might require React major version bump
- Migration plan: Monitor React changelogs; version pin at team discretion; test new Next.js releases in CI

## Missing Critical Features

**No error boundary for game crashes:**
- Problem: Games can crash without graceful fallback UI
- Blocks: Cannot safely launch new games without risk of breaking entire page
- Impact: Users lose progress if game crashes mid-session

**No offline mode for gameplay:**
- Problem: Games require full internet (analytics, feature flags, leaderboards all require network)
- Blocks: Offline/airplane mode gameplay not possible
- Impact: Limits usage in areas with spotty connectivity

**No user authentication or data persistence across devices:**
- Problem: All progress stored in localStorage only; resets on device/browser change
- Blocks: Cannot implement user accounts or cross-device sync
- Impact: Users cannot progress on multiple devices

## Test Coverage Gaps

**Games with complex state not tested:**
- What's not tested: Actual game logic (letter-rain target spawning, counting-game answer validation, simon game sequence progression)
- Files: `app/[locale]/games/letter-rain/page.tsx`, `app/[locale]/games/counting-game/page.tsx`, `app/[locale]/games/simon-game/page.tsx`
- Risk: Game-breaking bugs not caught until users report them
- Priority: High - should add unit tests for game algorithms before shipping new difficulties

**localStorage persistence not tested:**
- What's not tested: Data survives page reload; schema migrations work correctly; quota exceeded behavior
- Files: `hooks/useGamesProgress.ts`, `hooks/useStickers.ts`, `hooks/useWordCollectionProgress.ts`
- Risk: Silent data loss on browser storage quota exceed
- Priority: Medium - add tests for storage error scenarios and recovery

**Analytics event validation not tested:**
- What's not tested: Correct event properties sent; Amplitude initialization idempotence
- Files: `utils/amplitude.ts`, `hooks/useGameAnalytics.ts`
- Risk: Broken analytics silently; invalid event data in reports
- Priority: Low - would need Amplitude SDK mocking

**Localization completeness not tested:**
- What's not tested: Missing translation keys; RTL layout issues; missing locale paths
- Files: `messages/{he,en,ru}.json`, all pages
- Risk: Missing translations shown as keys to users; layout breaks in some locales
- Priority: Medium - add test to verify all `useTranslations()` keys exist in each locale file

---

*Concerns audit: 2026-03-21*
