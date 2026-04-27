import { test, expect } from '@playwright/test';

/**
 * DS-03 — accent picker live update + localStorage persistence (Phase 174).
 *
 * Asserts:
 * - Click on Rose swatch updates document.documentElement.style.--accent
 *   to oklch(0.68 0.17 0).
 * - localStorage 'ember-glass-accent' is set to the same value.
 * - aria-pressed flips: Rose=true, Copper=false.
 * - All 6 hue swatches are visible with aria-label="Set accent to {Name}".
 */
test.describe('DS-03 — accent picker (live --accent + localStorage)', () => {
  test('clicking Rose swatch updates --accent and persists in localStorage', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });

    // Click Rose
    await page.getByRole('button', { name: /Set accent to Rose/i }).click();

    // Assert --accent on documentElement
    const accent = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--accent').trim()
    );
    expect(accent).toBe('oklch(0.68 0.17 0)');

    // Assert localStorage persistence
    const persisted = await page.evaluate(() => localStorage.getItem('ember-glass-accent'));
    expect(persisted).toBe('oklch(0.68 0.17 0)');

    // Assert aria-pressed flipped
    await expect(page.getByRole('button', { name: /Set accent to Rose/i })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /Set accent to Copper/i })).toHaveAttribute('aria-pressed', 'false');
  });

  test('all 6 swatches present with aria-labels', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    for (const name of ['Copper', 'Rose', 'Violet', 'Blue', 'Green', 'Amber']) {
      await expect(page.getByRole('button', { name: new RegExp(`Set accent to ${name}`, 'i') })).toBeVisible();
    }
  });
});
