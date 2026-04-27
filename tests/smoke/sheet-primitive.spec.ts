import { test, expect, type Page } from '@playwright/test';

/**
 * SHEET-01 — sheet primitive on /debug/design-system-v2 (Phase 175).
 *
 * Asserts the three dismissal vectors (Escape / backdrop tap / close button), body
 * scroll-lock with restore (open at y=300 → close → window.scrollY === 300), and
 * cross-viewport parity (375px and 1024px both yield sheet width = viewport - 16).
 */

async function openSheet(page: Page): Promise<void> {
  await page.goto('/debug/design-system-v2');
  await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Apri sheet demo/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('SHEET-01 — sheet primitive', () => {
  test('opens via button click', async ({ page }) => {
    await openSheet(page);
    const dialog = page.getByRole('dialog');
    // Wait for the 400ms outro animation to settle to its open identity transform
    // before reading getComputedStyle. toBeVisible alone resolves at first paint
    // and can capture a mid-animation matrix(1, 0, 0, 1, 0, <intermediate>).
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[role="dialog"]');
        if (!el) return false;
        const t = getComputedStyle(el).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
      },
      { timeout: 1500 }
    );
    const transform = await dialog.evaluate((el) => getComputedStyle(el).transform);
    // Open state: translateY(0) ⇒ matrix(1, 0, 0, 1, 0, 0) or 'none'.
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBeTruthy();
  });

  test('dismisses via Escape', async ({ page }) => {
    await openSheet(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
  });

  test('dismisses via backdrop tap', async ({ page }) => {
    await openSheet(page);
    // Backdrop covers viewport; click in upper-left, well above the sheet (which sits at bottom:8).
    await page.locator('[data-sheet-backdrop="true"]').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
  });

  test('dismisses via close button', async ({ page }) => {
    await openSheet(page);
    await page.getByRole('button', { name: /chiudi/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
  });

  test('scroll-lock applied + restored at y=300', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
    // Force a scrollable page in the smoke environment.
    await page.evaluate(() => { document.body.style.minHeight = '2000px'; });
    await page.evaluate(() => window.scrollTo(0, 300));
    // Sanity: confirm the page actually scrolled to 300.
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThanOrEqual(295); // small tolerance for sub-pixel rounding
    await page.getByRole('button', { name: /Apri sheet demo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const positionWhenOpen = await page.evaluate(() => document.body.style.position);
    expect(positionWhenOpen).toBe('fixed');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 1500 });
    // Allow Sheet outro + cleanup effect to flush.
    await page.waitForTimeout(500);
    const restoredScrollY = await page.evaluate(() => window.scrollY);
    expect(Math.round(restoredScrollY)).toBe(300);
  });

  test('mobile 375px sheet width = viewport - 16', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openSheet(page);
    const box = await page.getByRole('dialog').boundingBox();
    if (!box) throw new Error('dialog bounding box missing at 375px');
    expect(Math.round(box.width)).toBe(359);
  });

  test('desktop 1024px sheet width = viewport - 16', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openSheet(page);
    const box = await page.getByRole('dialog').boundingBox();
    if (!box) throw new Error('dialog bounding box missing at 1024px');
    expect(Math.round(box.width)).toBe(1008);
  });
});
