import { test, expect, type Route } from '@playwright/test';

/**
 * Phase 170 Plan 03 — Auth UI feature spec.
 *
 * Exercises the full happy path WITHOUT a real HA backend:
 *   /login (unauthenticated)
 *     → submit credentials (mocked 200 + Set-Cookie)
 *     → redirect to /settings/api-keys
 *     → list renders with 1 existing key
 *     → Crea nuova API key → FormModal → Crea
 *     → Reveal Modal shows plaintext + Copia button
 *     → Chiudi closes the reveal + refetches list (new key appears)
 *     → Revoca on a row → ConfirmationDialog → confirm
 *     → row removed
 *
 * All /api/auth/* routes are stubbed via page.route() — Playwright fulfils
 * inside the browser process so neither Auth0 nor the HA proxy is hit.
 * The Auth0 session ships with the Playwright storageState (see
 * tests/auth.setup.ts) so /login and /settings/api-keys are reachable as
 * client-rendered pages.
 */
test.describe('Auth UI Flow', () => {
  let keys: Array<{
    id: number;
    name: string;
    created_at: string;
    last_used_at: string | null;
    is_active: boolean;
  }> = [];
  let nextId = 100;

  test.beforeEach(async ({ page }) => {
    // Reset fixture state per test
    keys = [
      {
        id: 1,
        name: 'Existing',
        created_at: '2026-04-20T00:00:00Z',
        last_used_at: null,
        is_active: true,
      },
    ];
    nextId = 100;

    await page.route('**/api/auth/login', (route: Route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          headers: { 'Set-Cookie': 'ha_auth=1; Path=/; HttpOnly; SameSite=Lax' },
          body: JSON.stringify({ ok: true, data: { authenticated: true } }),
        });
      }
      return route.continue();
    });

    await page.route('**/api/auth/logout', (route: Route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, data: { authenticated: false } }),
      })
    );

    await page.route('**/api/auth/api-keys', (route: Route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ keys, count: keys.length }),
        });
      }
      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() ?? '{}');
        const created = {
          id: nextId++,
          name: body.name,
          api_key: `ha_live_${body.name}_secret_xyz`,
          created_at: new Date().toISOString(),
        };
        keys.push({
          id: created.id,
          name: created.name,
          created_at: created.created_at,
          last_used_at: null,
          is_active: true,
        });
        return route.fulfill({
          status: 201,
          body: JSON.stringify({ ok: true, created: true, data: created }),
        });
      }
      return route.continue();
    });

    await page.route(/\/api\/auth\/api-keys\/\d+$/, (route: Route) => {
      if (route.request().method() === 'DELETE') {
        const match = route.request().url().match(/\/api\/auth\/api-keys\/(\d+)$/);
        const id = match ? Number(match[1]) : 0;
        keys = keys.filter((k) => k.id !== id);
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });
  });

  test('login → list → create → reveal → close → revoke → removed', async ({
    page,
  }) => {
    // Entry: /login.
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: /accedi/i, level: 1 })
    ).toBeVisible({ timeout: 15000 });

    // Submit mocked credentials.
    await page.getByLabel(/username/i).fill('bob');
    await page.getByLabel(/password/i).fill('pw');
    await page.getByRole('button', { name: /^accedi$/i }).click();

    // Redirect to /settings/api-keys.
    await page.waitForURL('**/settings/api-keys', { timeout: 15000 });

    // List renders with the existing key.
    await expect(page.getByText('Existing')).toBeVisible({ timeout: 15000 });

    // Create flow.
    await page
      .getByRole('button', { name: /crea nuova api key/i })
      .click();
    await page.getByLabel(/nome/i).fill('NewKey');
    await page.getByRole('button', { name: /^crea$/i }).click();

    // Reveal — plaintext visible (fixture-string, NOT a real credential).
    await expect(page.getByText(/ha_live_NewKey_secret_xyz/)).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole('button', { name: /copia chiave/i })
    ).toBeVisible();

    // Close — plaintext MUST disappear from DOM (T-170-14).
    await page.getByRole('button', { name: /chiudi/i }).click();
    await expect(
      page.getByText(/ha_live_NewKey_secret_xyz/)
    ).not.toBeVisible();

    // Refetched list: NewKey now appears next to Existing.
    await expect(page.getByText('NewKey')).toBeVisible({ timeout: 10000 });

    // Revoke the Existing row.
    const existingRow = page
      .locator('tr', { hasText: 'Existing' })
      .first();
    await existingRow
      .getByRole('button', { name: /^revoca$/i })
      .click();

    // ConfirmationDialog opens with irreversibility copy.
    await expect(
      page.getByText(/revocare "Existing"/i)
    ).toBeVisible({ timeout: 10000 });
    // Confirm is identified via data-testid to avoid clashing with the row
    // button label — ConfirmationDialog tags its confirm button with
    // data-testid="confirmation-confirm".
    await page.getByTestId('confirmation-confirm').click();

    // Row removed.
    await expect(page.getByText('Existing')).not.toBeVisible({
      timeout: 10000,
    });
  });
});
