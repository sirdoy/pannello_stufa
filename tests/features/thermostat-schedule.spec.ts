import { test, expect } from '../fixtures';

/**
 * Netatmo thermostat page (/thermostat) — read-only checks on the live Pi data.
 * Never clicks a mode button: the suite runs against the real thermostat.
 */
test.describe('Thermostat Schedule Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/thermostat');
    await expect(page.getByRole('heading', { name: 'Controllo Netatmo', level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('should show the heating mode controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Modalita Riscaldamento', level: 2 })).toBeVisible();
    for (const mode of [/Programmato/, /Assenza/, /Antigelo/]) {
      await expect(page.getByRole('button', { name: mode })).toBeVisible();
    }
  });

  test('should show the schedule section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Programmazione', level: 3 })).toBeVisible();
  });
});
