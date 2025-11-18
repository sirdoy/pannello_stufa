import { test, expect } from '@playwright/test';
import { waitForSkeletonToDisappear } from './utils/helpers.js';

/**
 * Dark Mode & Liquid Glass Effect Tests
 *
 * Verifies:
 * - Dark mode theme switching and persistence
 * - Liquid glass effect in both light and dark modes
 * - Visual consistency across theme changes
 * - Smooth transitions between themes
 */

test.describe('Dark Mode - Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Light mode is applied by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(300);

    const bodyBg = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Light mode should have light background
    const isLight = await page.evaluate((bg) => {
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return false;
      const avg = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
      return avg > 200; // Light backgrounds have high RGB values
    }, bodyBg);

    expect(isLight, `Light mode should have light background, got: ${bodyBg}`).toBe(true);
  });

  test('Dark mode is applied correctly', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    const bodyBg = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Dark mode should have dark background
    const isDark = await page.evaluate((bg) => {
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return false;
      const avg = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
      return avg < 50; // Dark backgrounds have low RGB values
    }, bodyBg);

    expect(isDark, `Dark mode should have dark background, got: ${bodyBg}`).toBe(true);
  });

  test('Theme toggle button exists on settings page', async ({ page }) => {
    await page.goto('/settings/theme');
    await page.waitForLoadState('networkidle');

    // Look for theme toggle button or theme selector
    const themeButton = page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("Theme"), [role="switch"]');
    const count = await themeButton.count();

    expect(count, 'Theme settings page should have theme toggle controls').toBeGreaterThan(0);
  });

  test('Dark mode affects all cards consistently', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    const backgrounds = [];

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const bg = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor || style.background;
      });
      backgrounds.push(bg);
    }

    // All cards should have dark glass backgrounds
    backgrounds.forEach((bg, index) => {
      const isDarkGlass = bg.includes('rgba') || bg.includes('hsla');
      expect(isDarkGlass, `Card ${index} should have semi-transparent dark background in dark mode`).toBe(true);
    });
  });
});

test.describe('Liquid Glass Effect - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForLoadState('networkidle');
  });

  test('Cards have backdrop-filter blur', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    expect(count, 'Should have glass effect cards').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasBackdropBlur = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        const backdrop = style.backdropFilter || style.webkitBackdropFilter || '';
        return backdrop.includes('blur');
      });

      expect(hasBackdropBlur, `Card ${i} missing backdrop-filter blur`).toBe(true);
    }
  });

  test('Cards have semi-transparent backgrounds', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasSemiTransparent = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;

        // Check for rgba with alpha < 1
        const rgbaMatch = bg.match(/rgba\([\d\s,]+,\s*([\d.]+)\)/);
        if (rgbaMatch) {
          return parseFloat(rgbaMatch[1]) < 1;
        }

        return false;
      });

      expect(hasSemiTransparent, `Card ${i} background should be semi-transparent for glass effect`).toBe(true);
    }
  });

  test('Cards have border or shadow for depth', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasDepth = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return (
          style.boxShadow !== 'none' ||
          (style.borderWidth !== '0px' && style.borderWidth !== '')
        );
      });

      expect(hasDepth, `Card ${i} should have shadow or border for depth`).toBe(true);
    }
  });

  test('Buttons have glass effect', async ({ page }) => {
    const glassButtons = page.locator('buttondiv[class*="backdrop-blur"], button[class*="liquid"]');
    const count = await glassButtons.count();

    if (count === 0) return; // Skip if no glass buttons

    for (let i = 0; i < count; i++) {
      const button = glassButtons.nth(i);

      const hasGlassEffect = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        const backdrop = style.backdropFilter || style.webkitBackdropFilter || '';
        return backdrop.includes('blur');
      });

      expect(hasGlassEffect, `Glass button ${i} missing backdrop blur`).toBe(true);
    }
  });
});

test.describe('Liquid Glass Effect - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
  });

  test('Dark mode cards have backdrop blur', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasBackdropBlur = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        const backdrop = style.backdropFilter || style.webkitBackdropFilter || '';
        return backdrop.includes('blur');
      });

      expect(hasBackdropBlur, `[DARK] Card ${i} missing backdrop-filter blur`).toBe(true);
    }
  });

  test('Dark mode cards have dark glass backgrounds', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasDarkGlass = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;

        // Check for dark semi-transparent background
        const rgbaMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1]);
          const g = parseInt(rgbaMatch[2]);
          const b = parseInt(rgbaMatch[3]);
          const avg = (r + g + b) / 3;

          return avg < 100; // Should be dark
        }

        return false;
      });

      expect(hasDarkGlass, `[DARK] Card ${i} should have dark glass background`).toBe(true);
    }
  });

  test('Dark mode maintains glass effect on scroll', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const cards = page.locator('div[class*="backdrop-blur"]');
    const firstCard = cards.first();

    const hasBackdropBlur = await firstCard.evaluate(el => {
      const style = window.getComputedStyle(el);
      const backdrop = style.backdropFilter || style.webkitBackdropFilter || '';
      return backdrop.includes('blur');
    });

    expect(hasBackdropBlur, '[DARK] Glass effect should persist on scroll').toBe(true);
  });
});

test.describe('Theme Transitions', () => {
  test('Switching themes preserves layout', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForLoadState('networkidle');

    // Get card positions in light mode
    const cards = page.locator('div[class*="backdrop-blur"]');
    const lightPositions = [];
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const box = await cards.nth(i).boundingBox();
      lightPositions.push({ x: box.x, y: box.y });
    }

    // Switch to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    // Get card positions in dark mode
    const darkPositions = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      const box = await cards.nth(i).boundingBox();
      darkPositions.push({ x: box.x, y: box.y });
    }

    // Positions should be similar (allowing small differences from transitions)
    for (let i = 0; i < lightPositions.length; i++) {
      expect(Math.abs(lightPositions[i].y - darkPositions[i].y), `Card ${i} position changed significantly`).toBeLessThan(10);
    }
  });

  test('Theme change does not break interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForLoadState('networkidle');

    // Find a button
    const button = page.locator('button').first();

    // Switch to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    // Button should still be visible and clickable
    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    expect(box, 'Button should have dimensions in dark mode').not.toBeNull();
  });
});

test.describe('Visual Consistency', () => {
  test('All pages support dark mode', async ({ page }) => {
    const pages = ['/', '/scheduler', '/maintenance', '/log', '/errors', '/changelog'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const bodyBg = await page.locator('body').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      const isDark = await page.evaluate((bg) => {
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return false;
        const avg = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
        return avg < 100;
      }, bodyBg);

      expect(isDark, `Page ${pagePath} does not support dark mode properly`).toBe(true);
    }
  });

  test('Glass effect is consistent across pages', async ({ page }) => {
    const pages = ['/', '/scheduler', '/maintenance'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const cards = page.locator('div[class*="backdrop-blur"]');
      const count = await cards.count();

      if (count > 0) {
        const firstCard = cards.first();

        const hasGlassEffect = await firstCard.evaluate(el => {
          const style = window.getComputedStyle(el);
          const backdrop = style.backdropFilter || style.webkitBackdropFilter || '';
          const bg = style.backgroundColor;

          return backdrop.includes('blur') && bg.includes('rgba');
        });

        expect(hasGlassEffect, `Glass effect missing on ${pagePath}`).toBe(true);
      }
    }
  });
});
