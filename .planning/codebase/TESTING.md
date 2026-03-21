# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework

**Runner:**
- Playwright `@playwright/test` version 1.57.0
- Config: `playwright.config.ts`

**Assertion Library:**
- Playwright's built-in assertion API (`expect()`)

**Run Commands:**
```bash
npm test              # Run all E2E tests (Playwright, 1 worker, minimal output in CI)
npm run test:ui       # Run tests with Playwright UI for debugging and inspection
npm run test:headed   # Run tests in headed mode (browser visible)
```

## Test File Organization

**Location:**
- Separate directory from source code: `e2e/` directory at project root
- Single test file: `e2e/app.spec.ts`
- No co-located component tests

**Naming:**
- Single file pattern: `app.spec.ts` (Playwright convention: `*.spec.ts`)
- Test groups use `test.describe()` blocks by feature/page

**Structure:**
```
e2e/
└── app.spec.ts       # All E2E tests organized by describe blocks
```

## Test Structure

**Suite Organization:**
```typescript
// From e2e/app.spec.ts - typical structure

test.beforeEach(async ({ page }) => {
  // Setup: Skip first-visit modal for all tests
  await page.addInitScript(() => {
    localStorage.setItem('lepdy_start_here_completed', new Date().toISOString());
  });
});

test.describe('Homepage', () => {
  test('loads with category buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button:has-text("אותיות")')).toBeVisible();
    await expect(page.locator('button:has-text("משחקים")')).toBeVisible();
  });
});

test.describe('Category pages load', () => {
  const categories = ['letters', 'numbers', 'colors', 'shapes', 'animals', 'food'];
  for (const category of categories) {
    test(`${category} page loads`, async ({ page }) => {
      await page.goto(`/${category}`);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});
```

**Patterns:**
- Setup: `test.beforeEach()` used to initialize state (localStorage) before each test
- Teardown: Not used (Playwright cleans up automatically)
- Assertion pattern: Direct `expect()` on page locators with matchers like `.toBeVisible()`, `.toHaveURL()`

## Mocking

**Framework:** No mocking framework used

**Patterns:**
- localStorage mocking via `page.addInitScript()` in beforeEach
- No API mocking; tests run against live server
- No component mocking; all tests are full-page E2E

**What to Mock:**
- First-visit modals (using localStorage setup in `beforeEach`)
- Time-dependent features if needed (not currently done)

**What NOT to Mock:**
- API calls (tests run against live server)
- Components (full integration tests only)
- Navigation (tests verify real routing)

## Locator Strategies

**Patterns from `e2e/app.spec.ts`:**
- Text-based selectors: `page.locator('button:has-text("text")')`
- Role-based selectors: `page.locator('h1').first()`
- General selectors: `page.locator('button').first()`, `page.locator('body')`
- URL assertions: `page.toHaveURL(/\/letters/)`

## Coverage

**Requirements:** No coverage enforcement

**Current Coverage:**
- Homepage: loads category buttons
- Category pages: all 6 categories load without crashing
- Games page: loads with buttons
- Game pages: 8 games verified loading (letter-rain, simon-game, guess-game, memory-match-game, speed-challenge, word-builder, sound-matching, counting-game)
- Info pages: learn, about, safety, contact
- Collection pages: stickers, my-words
- Navigation: category navigation verified
- Locales: English and Russian locales work
- All tests verify basic rendering, not functionality

**View Results:**
```bash
# Results automatically displayed after test run
# For debugging: use test:ui or test:headed commands
```

## Test Types

**Unit Tests:**
- Not used. No unit test framework configured (no Jest, Vitest, etc.)

**Integration Tests:**
- Not used in traditional sense

**E2E Tests:**
- Framework: Playwright
- Scope: Full application pages, navigation, rendering, locale support
- Approach: Navigate to pages, verify elements visible/loaded, check URL changes
- Goal: Verify site doesn't crash, major routes work, all locales supported

## Test Configuration

**Playwright Config (`playwright.config.ts`):**

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                    // Critical: 1 worker to avoid resource issues
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Key Settings:**
- `workers: 1` prevents resource exhaustion (note from CLAUDE.md: "Tests run with 1 worker to avoid resource issues")
- `baseURL: 'http://localhost:3000'` - local development server
- `webServer` auto-starts dev server if not running
- CI adds retries (2) and forbids `only` in commits
- HTML reporter for local debugging

## Common Patterns

**Async Testing:**
```typescript
test('page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button')).toBeVisible();
});
```
- All tests are async
- `await` used for navigation and assertions
- Playwright waits for elements by default

**Navigation Testing:**
```typescript
test('can navigate to letters and back', async ({ page }) => {
  await page.goto('/');
  await page.locator('button:has-text("אותיות")').click();
  await expect(page).toHaveURL(/\/letters/);
});
```

**Locale Testing:**
```typescript
test('English locale works', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('button:has-text("Letters")')).toBeVisible();
});
```

## When to Add/Update Tests

**When to add tests:**
1. **New page/route added** → Add test that verifies page loads and renders main heading/content
2. **New game added** → Add test to `test.describe('Game pages load')` for-loop (add to games array)
3. **Major UI change** → Update selectors if tests break, verify still passing
4. **Bug found that tests missed** → Consider adding specific test case to prevent regression

**When NOT to add tests:**
- Small copy/text changes (don't break layout)
- Styling changes (don't affect rendering)
- Adding items to existing categories (CategoryPage component handles all items, same test coverage)
- Minor refactors without behavior changes

## Pre-Deployment Checklist

**Run tests before deploying:**
```bash
npm test
```

**Success criteria:**
- All tests pass
- No flaky tests (consistent results)
- If all pass, site is confirmed working

---

*Testing analysis: 2026-03-21*
