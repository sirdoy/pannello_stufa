import { test, expect } from '../fixtures';

/**
 * Stove control page (/stove) — read-only checks on the live Pi data.
 * Never clicks ACCENDI / SPEGNI: the suite runs against the real stove.
 */
test.describe('Stove Ignition Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stove');
    await expect(page.getByRole('heading', { name: 'Controllo Stufa', level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('should show the system status section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Stato Sistema', level: 2 })).toBeVisible();
  });

  test('should have ignition controls available', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ACCENDI/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /SPEGNI/ })).toBeVisible();
  });

  test('should link schedule and maintenance', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pianificazione', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Manutenzione', level: 3 })).toBeVisible();
  });
});
