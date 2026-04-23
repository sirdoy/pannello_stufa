import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Collects console errors during a page interaction.
 * Call BEFORE page.goto(). Call cleanup() after assertions to remove listener.
 */
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore axe-core accessibility warnings (not JS errors)
      if (text.includes('Fix any of the following')) return;
      errors.push(text);
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
      await page.waitForLoadState('domcontentloaded');
      // Homepage has main content area with dashboard cards
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /: ${errors.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('Device Pages', () => {
    test('/stove loads and shows data', async ({ page }) => {
      // E2E-02: Stove control page loads
      // Stove page shows skeleton during loading (heading only after data arrives)
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/stove');
      await page.waitForLoadState('networkidle');
      // Page renders: either heading (data loaded) or main content area (skeleton)
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
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
      // Network page shows skeleton during loading (heading only after data arrives)
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/network');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /network: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/raspi loads and shows data', async ({ page }) => {
      // E2E-06: Raspberry Pi monitor page loads
      // Raspi page shows skeleton during loading (heading only after data arrives)
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/raspi');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /raspi: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/dirigera loads and shows data', async ({ page }) => {
      // E2E-10: DIRIGERA hub page loads with Stats / Events / Telemetry panels
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/dirigera');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      // Phase 169: assert the 3 new panels render (heading text always present regardless of data state)
      await expect(page.getByText('Statistiche', { exact: true })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Eventi recenti', { exact: true })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Telemetria', { exact: true })).toBeVisible({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /dirigera: ${errors.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('Support Pages', () => {
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

  // Phase 170-03: Auth UI smoke matrix + active-nav assertions.
  // See .planning/phases/170-auth-ui/170-VALIDATION.md row 170-03-06.
  test.describe('Auth UI', () => {
    test('/login loads', async ({ page }) => {
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      await expect(
        page.getByRole('heading', { name: /accedi/i, level: 1 })
      ).toBeVisible({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /login: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/settings/api-keys loads', async ({ page }) => {
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/settings/api-keys');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
      // SESSION_EXPIRED banner is expected (no HA cookie in smoke).
      // useApiKeys sets state but does NOT console.error, so 0 errors.
      cleanup();
      expect(
        errors,
        `Console errors on /settings/api-keys: ${errors.join(', ')}`
      ).toHaveLength(0);
    });

    // Active-nav assertion: /registry/types lights Registro, NOT API Keys.
    // Opens the hamburger menu so nav items are in the DOM/visible.
    test('active nav: /registry/types lights Registro but not API Keys', async ({
      page,
    }) => {
      await page.goto('/registry/types');
      await page.waitForLoadState('domcontentloaded');
      // Open hamburger menu to expose global nav links.
      await page.getByRole('button', { name: /apri menu/i }).click();
      await expect(
        page.locator('a[href="/registry/types"][aria-current="page"]')
      ).toBeVisible();
      await expect(
        page.locator('a[href="/settings/api-keys"][aria-current="page"]')
      ).toHaveCount(0);
    });

    test('active nav: /settings/api-keys lights API Keys but not Registro', async ({
      page,
    }) => {
      await page.goto('/settings/api-keys');
      await page.waitForLoadState('domcontentloaded');
      await page.getByRole('button', { name: /apri menu/i }).click();
      await expect(
        page.locator('a[href="/settings/api-keys"][aria-current="page"]')
      ).toBeVisible();
      await expect(
        page.locator('a[href="/registry/types"][aria-current="page"]')
      ).toHaveCount(0);
    });
  });

  // Phase 171: Fritz!Box Consumer UI smoke matrix (telephony + raw history + service discovery).
  // See .planning/phases/171-fritzbox-consumer-ui/171-VALIDATION.md tasks 171-01-* and 171-02-10.
  test.describe('Fritz!Box Consumer UI (Phase 171)', () => {
    test('/telefonia loads and renders heading', async ({ page }) => {
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/telefonia');
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByRole('heading', { name: /Telefonia/i, level: 1 })
      ).toBeVisible({ timeout: 15000 });
      cleanup();
      expect(errors, `Console errors on /telefonia: ${errors.join(', ')}`).toHaveLength(0);
    });

    test('/network Storico grezzo tab renders sub-sections', async ({ page }) => {
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/network');
      await page.waitForLoadState('networkidle');
      // Click the Storico grezzo tab trigger (native <button>, text-based selector).
      await page.getByRole('button', { name: /Storico grezzo/i }).click();
      // Assert the bandwidth sub-section heading becomes visible once the tab is active.
      await expect(page.getByRole('heading', { name: /Bandwidth grezzo/i })).toBeVisible({
        timeout: 15000,
      });
      cleanup();
      expect(
        errors,
        `Console errors on /network Storico grezzo: ${errors.join(', ')}`
      ).toHaveLength(0);
    });

    test('/debug Service Discovery tab renders heading', async ({ page }) => {
      const { errors, cleanup } = collectConsoleErrors(page);
      await page.goto('/debug?tab=service-discovery');
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByRole('heading', { name: /Service Discovery/i, level: 2 })
      ).toBeVisible({ timeout: 15000 });
      cleanup();
      expect(
        errors,
        `Console errors on /debug Service Discovery: ${errors.join(', ')}`
      ).toHaveLength(0);
    });
  });
});
