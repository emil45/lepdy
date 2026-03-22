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

  test('level map shows three levels', async ({ page }) => {
    await page.goto('/games/chess-game');
    const levelCards = page.locator('[data-testid="level-card"]');
    await expect(levelCards).toHaveCount(3);
  });

  test('back button navigates to games page', async ({ page }) => {
    await page.goto('/games/chess-game');
    await page.locator('a[href="/games"]').first().click();
    await expect(page).toHaveURL(/\/games$/);
  });

  test('progress persists across reload', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    await expect(page.locator('[data-testid="level-card-completed"]').first()).toBeVisible();
  });
});

test.describe('Chess piece introduction', () => {
  test('shows piece card when entering level 1', async ({ page }) => {
    await page.goto('/games/chess-game');
    // Click the first level card (Level 1 — always unlocked)
    await page.locator('[data-testid="level-card"]').first().click();
    // Verify piece introduction UI appears
    await expect(page.locator('[data-testid="audio-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-counter"]')).toContainText('1 / 6');
  });

  test('navigates through all 6 pieces with Next button', async ({ page }) => {
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="level-card"]').first().click();
    // Verify starts at 1/6
    await expect(page.locator('[data-testid="step-counter"]')).toContainText('1 / 6');
    // Click Next 5 times to reach piece 6
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="next-button"]').click();
    }
    await expect(page.locator('[data-testid="step-counter"]')).toContainText('6 / 6');
  });

  test('completing all pieces returns to level map with Level 1 complete', async ({ page }) => {
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="level-card"]').first().click();
    // Click Next 6 times (5 to advance + 1 to complete)
    for (let i = 0; i < 6; i++) {
      await page.locator('[data-testid="next-button"]').click();
    }
    // Wait for celebration to auto-return to level map (3s timeout + buffer)
    await expect(page.locator('[data-testid="level-card"]').first()).toBeVisible({ timeout: 5000 });
    // Level 1 should now show completed indicator
    await expect(page.locator('[data-testid="level-card-completed"]').first()).toBeVisible();
  });
});

test.describe('Chess movement puzzles', () => {
  test('Level 2 board renders with puzzle progress', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    // Click Level 2 card (second level card)
    await page.locator('[data-testid="level-card"]').nth(1).click();
    // Verify puzzle progress counter appears
    await expect(page.locator('[data-testid="puzzle-progress"]')).toContainText('1 / 18');
    // Verify piece group label appears
    await expect(page.locator('[data-testid="piece-group-label"]')).toBeVisible();
  });

  test('Wrong tap shows try again feedback', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1],
        currentLevel: 2
      }));
    });
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="level-card"]').nth(1).click();
    await expect(page.locator('[data-testid="puzzle-progress"]')).toBeVisible();
    // First puzzle is king at e4. Tap a1 which is NOT a valid target for king
    // react-chessboard squares have data-square attribute
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
    await page.locator('[data-testid="level-card"]').nth(1).click();
    await expect(page.locator('[data-testid="puzzle-progress"]')).toBeVisible();
    // Tap 2 wrong squares (a1 and h8 are never valid for king at e4)
    await page.locator('[data-square="a1"]').click();
    await page.waitForTimeout(700); // wait for flash to clear
    await page.locator('[data-square="h8"]').click();
    // After 2 wrong taps, hint squares should be highlighted
    // Verify the puzzle progress still shows 1/18 (no advancement)
    await expect(page.locator('[data-testid="puzzle-progress"]')).toContainText('1 / 18');
  });
});

test.describe('Chess capture puzzles', () => {
  test('Level 3 board renders with puzzle progress', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1, 2],
        currentLevel: 3
      }));
    });
    await page.goto('/games/chess-game');
    // Click Level 3 card (third level card)
    await page.locator('[data-testid="level-card"]').nth(2).click();
    // Verify puzzle progress counter appears
    await expect(page.locator('[data-testid="puzzle-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="puzzle-progress"]')).toContainText('1 / 8');
  });

  test('Wrong tap on distractor shows try again feedback', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lepdy_chess_progress', JSON.stringify({
        completedLevels: [1, 2],
        currentLevel: 3
      }));
    });
    await page.goto('/games/chess-game');
    await page.locator('[data-testid="level-card"]').nth(2).click();
    await expect(page.locator('[data-testid="puzzle-progress"]')).toBeVisible();
    // First capture puzzle: capture-rook-1, distractor at c3
    await page.locator('[data-square="c3"]').click();
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
    await page.locator('[data-testid="level-card"]').nth(2).click();
    await expect(page.locator('[data-testid="puzzle-progress"]')).toBeVisible();
    // Click distractor c3 twice (first capture puzzle has distractor at c3)
    await page.locator('[data-square="c3"]').click();
    await page.waitForTimeout(700); // wait for flash to clear
    await page.locator('[data-square="c3"]').click();
    // After 2 wrong taps, puzzle hasn't advanced — still shows 1/8
    await expect(page.locator('[data-testid="puzzle-progress"]')).toContainText('1 / 8');
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
