import { test, expect } from '@playwright/test';
import { testElementContrast } from './utils/contrast.js';
import { waitForSkeletonToDisappear } from './utils/helpers.js';

/**
 * Color Contrast Tests - WCAG AA Compliance
 *
 * Verifies that all text elements meet minimum contrast requirements:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text: 3:1 contrast ratio
 *
 * Tests both light and dark modes across all pages
 */

test.describe('Color Contrast - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure light mode is active
    await page.emulateMedia({ colorScheme: 'light' });
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Homepage - Button text contrast', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();

      // Skip empty buttons or icon-only buttons
      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(button);

      expect(result.passes, `Button "${text.trim()}" fails contrast - Ratio: ${result.ratio}:1 (need 4.5:1)\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });

  test('Homepage - Card text contrast', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"], [class*="card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const textElements = card.locator('p, span, div').filter({ hasText: /.+/ });
      const textCount = await textElements.count();

      for (let j = 0; j < textCount; j++) {
        const element = textElements.nth(j);
        const text = await element.textContent();

        if (!text || text.trim() === '') continue;

        const result = await testElementContrast(element);

        expect(result.passes, `Card text "${text.trim().substring(0, 30)}..." fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
      }
    }
  });

  test('Homepage - Banner text contrast', async ({ page }) => {
    const banners = page.locator('[class*="banner"], [role="alert"]');
    const count = await banners.count();

    for (let i = 0; i < count; i++) {
      const banner = banners.nth(i);
      const result = await testElementContrast(banner);

      if (result.ratio > 0) {
        expect(result.passes, `Banner fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
      }
    }
  });

  test('Homepage - Heading text contrast', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();

      if (!text || text.trim() === '') continue;

      // Headings are typically large text (3:1 ratio)
      const result = await testElementContrast(heading, { isLargeText: true });

      expect(result.passes, `Heading "${text.trim()}" fails contrast - Ratio: ${result.ratio}:1 (need 3:1 for large text)\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });

  test('Homepage - Link text contrast', async ({ page }) => {
    const links = page.locator('a').filter({ hasText: /.+/ });
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();

      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(link);

      expect(result.passes, `Link "${text.trim()}" fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });
});

test.describe('Color Contrast - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    // Wait for theme to apply
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
  });

  test('Homepage - Button text contrast (dark)', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();

      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(button);

      expect(result.passes, `[DARK] Button "${text.trim()}" fails contrast - Ratio: ${result.ratio}:1 (need 4.5:1)\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });

  test('Homepage - Card text contrast (dark)', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"], [class*="card"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const textElements = card.locator('p, span, div').filter({ hasText: /.+/ });
      const textCount = await textElements.count();

      for (let j = 0; j < textCount; j++) {
        const element = textElements.nth(j);
        const text = await element.textContent();

        if (!text || text.trim() === '') continue;

        const result = await testElementContrast(element);

        expect(result.passes, `[DARK] Card text "${text.trim().substring(0, 30)}..." fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
      }
    }
  });

  test('Homepage - Banner text contrast (dark)', async ({ page }) => {
    const banners = page.locator('[class*="banner"], [role="alert"]');
    const count = await banners.count();

    for (let i = 0; i < count; i++) {
      const banner = banners.nth(i);
      const result = await testElementContrast(banner);

      if (result.ratio > 0) {
        expect(result.passes, `[DARK] Banner fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
      }
    }
  });

  test('Scheduler page - Text contrast (dark)', async ({ page }) => {
    await page.goto('/scheduler');
    await page.waitForLoadState('networkidle');

    const textElements = page.locator('p, span, label').filter({ hasText: /.+/ });
    const count = await textElements.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const element = textElements.nth(i);
      const text = await element.textContent();

      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(element);

      expect(result.passes, `[DARK] Scheduler text "${text.trim().substring(0, 30)}..." fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });
});

test.describe('Color Contrast - Critical UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Status badges have sufficient contrast', async ({ page }) => {
    const badges = page.locator('[class*="badge"], [class*="status"]');
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const badge = badges.nth(i);
      const text = await badge.textContent();

      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(badge);

      expect(result.passes, `Status badge "${text.trim()}" fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });

  test('Form labels have sufficient contrast', async ({ page }) => {
    await page.goto('/scheduler');
    await page.waitForLoadState('networkidle');

    const labels = page.locator('label');
    const count = await labels.count();

    for (let i = 0; i < count; i++) {
      const label = labels.nth(i);
      const text = await label.textContent();

      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(label);

      expect(result.passes, `Form label "${text.trim()}" fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });

  test('Error messages have sufficient contrast', async ({ page }) => {
    await page.goto('/errors');
    await page.waitForLoadState('networkidle');

    const errorTexts = page.locator('[class*="error"], [class*="danger"]');
    const count = await errorTexts.count();

    for (let i = 0; i < count; i++) {
      const error = errorTexts.nth(i);
      const text = await error.textContent();

      if (!text || text.trim() === '') continue;

      const result = await testElementContrast(error);

      expect(result.passes, `Error message "${text.trim().substring(0, 30)}..." fails contrast - Ratio: ${result.ratio}:1\nColor: ${result.color}\nBackground: ${result.backgroundColor}`).toBe(true);
    }
  });
});
