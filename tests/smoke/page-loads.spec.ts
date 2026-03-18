import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Collects console errors during a page interaction.
 * Call BEFORE page.goto(). Call cleanup() after assertions to remove listener.
 */
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };
  page.on('console', handler);
  const cleanup = () => page.off('console', handler);
  return { errors, cleanup };
}

test.describe('Page Loads', () => {
  test.describe('Dashboard', () => {
    test('homepage loads with dashboard cards', async ({ page }) => {
      // E2E-01, E2E-10: Homepage loads and dashboard cards render
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Stufa', level: 2 })).toBeVisible({
        timeout: 15000,
      });
      cleanup();
      expect(errors, `Console errors on /: ${errors.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('Device Pages', () => {
    test('/stove loads and shows data', async ({ page }) => {
      // E2E-02: Stove control page loads
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/stove');
      await expect(page.getByRole('heading', { name: 'Controllo Stufa' })).toBeVisible({
        timeout: 15000,
      });
      cleanup();
      expect(errors, `Console errors on /stove: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/thermostat loads and shows data', async ({ page }) => {
      // E2E-03: Thermostat page loads (may redirect to /netatmo)
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/thermostat');
      await page.waitForURL(/thermostat|netatmo/, { timeout: 10000 });
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /thermostat: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/lights loads and shows data', async ({ page }) => {
      // E2E-04: Lights control page loads
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/lights');
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /lights: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/network loads and shows data', async ({ page }) => {
      // E2E-05: Network monitor page loads
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/network');
      await expect(page.getByRole('heading', { name: 'Rete', level: 1 })).toBeVisible({
        timeout: 15000,
      });
      cleanup();
      expect(errors, `Console errors on /network: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/raspi loads and shows data', async ({ page }) => {
      // E2E-06: Raspberry Pi monitor page loads
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/raspi');
      await expect(page.getByRole('heading', { name: 'Raspberry Pi', level: 1 })).toBeVisible({
        timeout: 15000,
      });
      cleanup();
      expect(errors, `Console errors on /raspi: ${errors.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('Support Pages', () => {
    test('/analytics loads', async ({ page }) => {
      // E2E-07: Analytics dashboard loads
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/analytics');
      await expect(page.getByRole('heading', { name: 'Analytics', level: 1 })).toBeVisible({
        timeout: 10000,
      });
      cleanup();
      expect(errors, `Console errors on /analytics: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/settings loads', async ({ page }) => {
      // E2E-08: Settings page loads
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: 'Impostazioni' })).toBeVisible({
        timeout: 10000,
      });
      cleanup();
      expect(errors, `Console errors on /settings: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/debug loads', async ({ page }) => {
      // E2E-09: /admin requirement maps to /debug (no /admin route exists)
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/debug');
      await expect(page.getByRole('heading', { name: /API Debug Console/i })).toBeVisible({
        timeout: 10000,
      });
      cleanup();
      expect(errors, `Console errors on /debug: ${errors.join(', ')}`).toHaveLength(0);
    });
  });
});
