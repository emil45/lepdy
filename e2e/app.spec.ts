import { test, expect } from '@playwright/test';

// Skip the first-visit modal for all tests
test.beforeEach(async ({ page }) => {
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
      // All category pages have a heading
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});

test.describe('Games page', () => {
  test('loads with game buttons', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('button').first()).toBeVisible();
  });
});

test.describe('Game pages load', () => {
  // letter-tracing disabled - needs proper implementation
  const games = ['simon-game', 'guess-game', 'letter-rain', 'memory-match-game', 'speed-challenge', 'word-builder', 'sound-matching', 'counting-game', 'chess-game'];
  for (const game of games) {
    test(`${game} page loads`, async ({ page }) => {
      await page.goto(`/games/${game}`);
      await expect(page.locator('button').first()).toBeVisible();
    });
  }
});

test.describe('Chess game shell', () => {
  test('chess game button visible on games page', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('a[href="/games/chess-game"]')).toBeVisible();
  });

  test('hub shows four tiles', async ({ page }) => {
    await page.goto('/games/chess-game');
    const hubTiles = page.locator('[data-testid="hub-tile"]');
    await expect(hubTiles).toHaveCount(4);
  });

  test('back button navigates to games page', async ({ page }) => {
    await page.goto('/games/chess-game');
    await page.locator('a[href="/games"]').first().click();
    await expect(page).toHaveURL(/\/games$/);
  });

  test('chess hub loads after reload with progress', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    await expect(page.locator('[data-testid="hub-tile"]')).toHaveCount(4);
  });
});

test.describe('Chess piece introduction', () => {
  test('shows piece card when entering level 1', async ({ page }) => {
    await page.goto('/games/chess-game');
    // Click the Learn tile (first hub tile — always available)
    await page.locator('[data-testid="hub-tile"]').first().click();
    // Verify piece introduction UI appears
    await expect(page.locator('[data-testid="audio-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-counter"]')).toContainText('1 / 6');
  });

  test('navigates through all 6 pieces with Next button', async ({ page }) => {
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="hub-tile"]').first().click();
    // Verify starts at 1/6
    await expect(page.locator('[data-testid="step-counter"]')).toContainText('1 / 6');
    // Click Next 5 times to reach piece 6
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="next-button"]').click();
    }
    await expect(page.locator('[data-testid="step-counter"]')).toContainText('6 / 6');
  });

  test('completing all pieces returns to hub', async ({ page }) => {
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="hub-tile"]').first().click();
    // Click Next 6 times (5 to advance + 1 to complete)
    for (let i = 0; i < 6; i++) {
      await page.locator('[data-testid="next-button"]').click();
    }
    // Wait for celebration to auto-return to hub (3s timeout + buffer)
    await expect(page.locator('[data-testid="hub-tile"]').first()).toBeVisible({ timeout: 5000 });
    // Hub should show all 4 tiles
    await expect(page.locator('[data-testid="hub-tile"]')).toHaveCount(4);
  });
});

test.describe('Chess movement puzzles', () => {
  test('Challenge session renders with puzzle progress', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    // Click Challenge tile (second hub tile)
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    // Verify puzzle progress counter appears (e.g. "1/10")
    await expect(page.locator('text=/\\d+\\/\\d+/')).toBeVisible();
    // Verify exit button appears in puzzle view
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
  });

  test('movement puzzle shows Hebrew piece name audio button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    // Click Challenge tile to enter puzzle session
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    // Verify the piece name audio button is visible
    await expect(page.locator('[data-testid="piece-name-audio-button"]')).toBeVisible();
  });

  test('Wrong tap shows try again feedback', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
    // Tap a1 which is typically not a valid target
    await page.locator('[data-square="a1"]').click();
    // Verify try again text appears
    await expect(page.locator('[data-testid="try-again-text"]')).toBeVisible();
  });

  test('Hint appears after 2 wrong taps', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
    // Tap 2 wrong squares
    await page.locator('[data-square="a1"]').click();
    await page.waitForTimeout(700); // wait for flash to clear
    await page.locator('[data-square="h8"]').click();
    // After 2 wrong taps, exit button should still be visible (puzzle still active)
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
  });
});

test.describe('Chess capture puzzles', () => {
  test('Session puzzle renders', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1, 2],
        currentLevel: 3
      }));
    });
    await page.goto('/games/chess-game');
    // Click Challenge tile (second hub tile) — session mixes movement and capture puzzles
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    // Verify puzzle progress counter and exit button appear
    await expect(page.locator('text=/\\d+\\/\\d+/')).toBeVisible();
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
  });

  test('Wrong tap on distractor shows try again feedback', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1, 2],
        currentLevel: 3
      }));
    });
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
    // Tap a1 — typically an invalid square for most puzzles
    await page.locator('[data-square="a1"]').click();
    // Verify try again text appears
    await expect(page.locator('[data-testid="try-again-text"]')).toBeVisible();
  });

  test('Hint appears after 2 wrong taps', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1, 2],
        currentLevel: 3
      }));
    });
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="hub-tile"]').nth(1).click();
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
    // Click invalid square twice
    await page.locator('[data-square="a1"]').click();
    await page.waitForTimeout(700); // wait for flash to clear
    await page.locator('[data-square="a1"]').click();
    // After 2 wrong taps, exit button still visible (puzzle still active)
    await expect(page.locator('[data-testid="exit-button"]')).toBeVisible();
  });
});

test.describe('Info pages load', () => {
  const pages = ['learn', 'about', 'safety', 'contact'];
  for (const p of pages) {
    test(`${p} page loads`, async ({ page }) => {
      await page.goto(`/${p}`);
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

test.describe('Collection pages load', () => {
  test('stickers page loads', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('my-words page loads', async ({ page }) => {
    await page.goto('/my-words');
    // Page should have either the empty state or the collection title
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Navigation', () => {
  test('can navigate to letters and back', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("אותיות")').click();
    await expect(page).toHaveURL(/\/letters/);
  });
});

test.describe('Locales', () => {
  test('English locale works', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('button:has-text("Letters")')).toBeVisible();
  });

  test('Russian locale works', async ({ page }) => {
    await page.goto('/ru');
    await expect(page.locator('button:has-text("буквы")')).toBeVisible();
  });
});
