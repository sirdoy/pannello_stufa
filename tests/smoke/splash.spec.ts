import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';
import { signIn } from '../helpers/auth.helpers';
import { TEST_USER } from '../helpers/test-context';

/**
 * SPLASH-01..05 — post-Auth0 splash animation (Phase 176).
 *
 * Asserts:
 *   SPLASH-01: splash mounts within ~1500ms of dashboard landing post-Auth0.
 *   SPLASH-02: animation timeline beats (flame scale(0.4) → scale(1) → unmount).
 *   SPLASH-03: prefers-reduced-motion: reduce → opacity-only fade, no transform, ≤600ms.
 *   SPLASH-04: subsequent in-session route changes do NOT re-trigger the splash.
 *   SPLASH-05: ≥1 device API request fires while the splash is visible.
 *
 * Helpers reused:
 *   - signIn() — tests/helpers/auth.helpers.ts (Phase 51 pattern).
 *   - collectConsoleErrors() — tests/smoke/page-loads.spec.ts (Phase 97 pattern).
 *   - waitForFunction(getComputedStyle / inline style) — tests/smoke/sheet-primitive.spec.ts (Phase 175 pattern).
 *
 * VersionEnforcer overlay handling (CONTEXT.md D-28; RESEARCH §"Pitfall 6"):
 *   The pre-existing app-level <ForceUpdateModal> can intercept clicks and pin the
 *   z-index above 9999. If it appears, dismiss it before measurement using the
 *   Phase 175 best-effort strategy (`dismissVersionEnforcerIfPresent`).
 */

/**
 * Collects console errors during a page interaction.
 * Call BEFORE signIn(). Call cleanup() after assertions to remove the listener.
 * Mirrors the canonical helper in tests/smoke/page-loads.spec.ts (Phase 97).
 */
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore axe-core accessibility warnings (not JS errors).
      if (text.includes('Fix any of the following')) return;
      errors.push(text);
    }
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}

/**
 * Best-effort dismissal of the VersionEnforcer / ForceUpdateModal overlay
 * (Phase 175 known blocker per CONTEXT.md D-28).
 *
 * Strategy:
 *   1. Look for the visible "Aggiornamento Disponibile" heading or an
 *      `Aggiorna|Ricarica|Reload|Dismiss|Chiudi|Ignora` button.
 *   2. If found, click it (this triggers `window.location.reload()` in the
 *      production component but at least clears the modal from the DOM).
 *   3. If no button is exposed (the prod modal disables onClose), fall back
 *      to ESC and pressing Escape on the modal node.
 *
 * If dismissal fails, the test will time out at the splash-overlay assertion
 * and the SUMMARY documents the blocker per Phase 175 precedent.
 */
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> {
  // Markers we know about: the modal renders a heading "Aggiornamento Disponibile"
  // (see app/components/ForceUpdateModal.tsx) and may also expose attributes like
  // [data-version-enforcer] or [data-testid="version-enforcer"] in future revisions.
  const overlay = page
    .locator(
      'text=/Aggiornamento Disponibile/i, [data-version-enforcer], [data-testid="version-enforcer"]'
    )
    .first();

  if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
    const dismiss = page
      .getByRole('button', { name: /aggiorna|ricarica|reload|chiudi|ignora|dismiss/i })
      .first();
    if (await dismiss.isVisible({ timeout: 200 }).catch(() => false)) {
      await dismiss.click({ trial: false }).catch(() => undefined);
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }
  }
}

test.describe('SPLASH-01..05 — splash overlay', () => {
  // Fresh sign-in per test so sessionStorage starts empty (otherwise the splash
  // would be suppressed on the second test by the SPLASH-04 session-once flag).
  test.use({ storageState: { cookies: [], origins: [] } });

  test('SPLASH-01 splash appears within ~1.5s of dashboard landing post-Auth0', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // Splash must mount within ~1.5s after Auth0 redirect.
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    // Splash must dismiss within ~2.3s (2.1s phase 3 + jitter).
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });

    cleanup();
    expect(errors, `Console errors during splash: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('SPLASH-02 sequence beats: flame scale(0.4) → scale(1) → unmount', async ({ page }) => {
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // Phase 0 (t≈0–600ms): flame at scale(0.4).
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="splash-flame"]') as HTMLElement | null;
        return !!el && el.style.transform.includes('scale(0.4)');
      },
      undefined,
      { timeout: 600 }
    );

    // Phase 1 (t≈600–1500ms): flame at scale(1).
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="splash-flame"]') as HTMLElement | null;
        return !!el && el.style.transform.includes('scale(1)') && !el.style.transform.includes('scale(1.08)');
      },
      undefined,
      { timeout: 1500 }
    );

    // Phase 3 (t≈2100ms): splash unmounts.
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });
  });

  test('SPLASH-03 reduced-motion: opacity-only fade, no transform, ≤600ms', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    try {
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await dismissVersionEnforcerIfPresent(page);

      await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });

      // Flame must NOT have a non-identity transform under reduced-motion.
      const flameTransform = await page
        .getByTestId('splash-flame')
        .evaluate((el) => getComputedStyle(el).transform);
      expect(
        flameTransform === 'none' || flameTransform === 'matrix(1, 0, 0, 1, 0, 0)',
        `Reduced-motion: flame transform should be identity, got "${flameTransform}"`
      ).toBeTruthy();

      // Dashboard wrapper must NOT have a non-identity transform under reduced-motion.
      const wrapperTransform = await page
        .getByTestId('dashboard-wrapper')
        .evaluate((el) => getComputedStyle(el).transform);
      expect(
        wrapperTransform === 'none' || wrapperTransform === 'matrix(1, 0, 0, 1, 0, 0)',
        `Reduced-motion: dashboard-wrapper transform should be identity, got "${wrapperTransform}"`
      ).toBeTruthy();

      // Splash must unmount by ~600ms (200ms fade + jitter).
      await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 600 });
    } finally {
      await ctx.close();
    }
  });

  test('SPLASH-04 no re-trigger on in-session route change (Home → Rooms → Automations → Home)', async ({ page }) => {
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // Wait for first splash to play and dismiss.
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });

    // Home → Rooms.
    await page.goto('/rooms');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 200 });

    // Rooms → Automations.
    await page.goto('/automations');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 200 });

    // Automations → Home.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 200 });
  });

  test('SPLASH-05 ≥1 device API request fires during splash window', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/')) apiRequests.push(url);
    });

    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // Capture during the splash window.
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    // By the time the splash dismisses, ≥1 device API call must have fired
    // (D-05 / D-20 / D-21: dashboard fetches start during the splash window).
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });

    // Match any of the canonical device API namespaces (CONTEXT.md D-27).
    const deviceApiPattern = /\/api\/(stove|thermostat|lights|network|sonos|dirigera|raspi|tuya)/;
    const matched = apiRequests.filter((u) => deviceApiPattern.test(u));
    expect(
      matched.length,
      `SPLASH-05: expected ≥1 device API request during splash window. Captured: ${apiRequests.slice(0, 20).join(', ')}`
    ).toBeGreaterThanOrEqual(1);
  });
});
