import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Phase 181 — Bottom Tab Bar smoke (NAV-01..04).
 *
 * End-to-end runtime verification of the glass bottom tab bar across mobile
 * (375x812) and desktop (1280x800) breakpoints. Asserts:
 *   NAV-04 : safe-area inset CSS contract — computed `bottom: '8px'` at 375x812
 *            (env(safe-area-inset-bottom) returns 0 in headless Chromium per
 *            RESEARCH Pattern 9 / Pitfall 4) AND the inline style source
 *            contains 'env(safe-area-inset-bottom)'.
 *   NAV-02 : navigating to /stanze sets aria-current="page" on the active tab
 *            and the active color !== inactive grey rgba(255,255,255,0.55).
 *   NAV-02 : navigating to /altro renders the Esci row.
 *   NAV-01 : desktop 1280x800 — the @media (min-width:640px) rule centers
 *            the pill at 480px wide.
 *   NAV-03 : when body[data-sheet-open="true"] is set, the bar slides off-screen
 *            (translateY(140%)) — the cross-cutting CSS rule from Plan 01 D-09.
 *   NAV-01..04 : console-error gate over the journey.
 *
 * Headless Chromium does NOT simulate iOS home-indicator inset
 * (`env(safe-area-inset-bottom)` returns 0 — RESEARCH Pattern 9 / Pitfall 4).
 * The spec asserts the CSS contract (`bottom: '8px'`) plus the source string
 * presence of `env(safe-area-inset-bottom)`. Real-device 34px inset
 * verification is documented in 181-VALIDATION.md §Manual-Only Verifications.
 *
 * IMPORTANT: File path is tests/smoke/bottom-tab-bar.spec.ts — NOT
 * tests/playwright/ (RESEARCH Pattern 9 corrects the CONTEXT typo).
 *
 * Helpers below are LIFTED VERBATIM from tests/smoke/rooms-tab.spec.ts:33-127
 * per CONTEXT D-15 + PATTERNS.md.
 */

// ---------------------------------------------------------------------------
// Helpers (verbatim from tests/smoke/rooms-tab.spec.ts:33-127)
// ---------------------------------------------------------------------------

/**
 * Collects console errors during a page interaction.
 * Call BEFORE page.goto(). Call cleanup() after assertions to remove the listener.
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
 * (Phase 175 known blocker per CONTEXT.md D-28). Verbatim copy of the helper
 * established in tests/smoke/splash.spec.ts:60-80 — this IS the canonical
 * analog (W5 hard requirement satisfied).
 */
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> {
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

/**
 * Best-effort dismissal of the WhatsNewModal (`<h2>Novità!</h2>` heading) which
 * mounts via useVersionCheck() when localStorage.lastSeenVersion !== APP_VERSION.
 * In smoke mode each test gets a fresh storage state, so the modal mounts on
 * every cold-load and intercepts pointer events on top of the dashboard grid.
 *
 * Strategy: poll up to 4× over ~3s, since the hook fetches from Firebase async
 * and the modal can race the dashboard hydration. Each iteration: detect the
 * Radix dialog by role + heading, click the close button (aria-label "Chiudi")
 * or press Escape. Companion to dismissVersionEnforcerIfPresent.
 */
async function dismissWhatsNewModalIfPresent(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const overlay = page.getByText('Novità!', { exact: true }).first();
    const visible = await overlay.isVisible({ timeout: 750 }).catch(() => false);
    if (!visible) return;
    // Try the close (X) action first, then ESC, then click the overlay backdrop.
    const closeBtn = page.getByRole('button', { name: /chiudi/i }).first();
    if (await closeBtn.isVisible({ timeout: 150 }).catch(() => false)) {
      await closeBtn.click({ force: true, trial: false }).catch(() => undefined);
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }
    await overlay.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => undefined);
  }
}

/**
 * Shared pre-goto setup mirroring the Phase 177 describe-level beforeEach
 * (lines 134-180). Each SHEET-* describe calls this BEFORE goto + dismissals.
 * Pre-primes localStorage to suppress WhatsNewModal + installs a defensive
 * version-check route mock so the changelog dialog cannot intercept clicks.
 */
async function primeDashboardForSheetTest(page: Page): Promise<void> {
  await page.route('**/api/version*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: '99.99.99' }),
    })
  );
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('lastSeenVersion', '99.99.99');
      const dismissed = [
        '99.99.99',
        '1.77.0', '1.77.1', '1.77.2',
        '1.78.0', '1.79.0', '1.80.0',
        '2.0.0',
      ];
      window.localStorage.setItem('dismissedVersions', JSON.stringify(dismissed));
    } catch {
      // localStorage may be unavailable in some Playwright contexts — no-op.
    }
  });
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe('Phase 181 — Bottom Tab Bar (NAV-01..04)', () => {
  test.beforeEach(async ({ page }) => {
    await primeDashboardForSheetTest(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('NAV-04 safe-area inset CSS contract at 375x812 (computed bottom + source string)', async ({ page }) => {
    const bar = page.locator('[data-bottom-tab="true"]');
    await expect(bar).toBeVisible({ timeout: 10000 });

    const computed = await bar.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { bottomRect: r.bottom, computedBottom: cs.bottom };
    });

    // env() returns 0 in headless Chromium → calc(8px + 0) = 8px.
    expect(computed.computedBottom).toBe('8px');

    // Bar's bottom edge is within the viewport bottom minus 8px (allow 2px float).
    expect(Math.abs(computed.bottomRect - (812 - 8))).toBeLessThan(2);

    // Source CSS string MUST contain env(safe-area-inset-bottom) (NAV-04 contract).
    // Read from the inline style attribute — the React-rendered source string,
    // before the browser resolves env() to a numeric pixel value.
    const inlineBottom = await bar.evaluate((el) => (el as HTMLElement).style.bottom);
    expect(inlineBottom).toContain('env(safe-area-inset-bottom)');
  });

  test('NAV-02 active tab tints on /stanze with accent (color !== inactive grey)', async ({ page }) => {
    const stanzeLink = page.locator('[data-bottom-tab="true"]').getByRole('link', { name: /stanze/i });
    await stanzeLink.click();
    await expect(page).toHaveURL(/\/stanze/);

    // Re-dismiss any modals that might mount on /stanze.
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    const active = page.locator('[data-bottom-tab="true"] [aria-current="page"]').first();
    await expect(active).toBeVisible();

    const color = await active.evaluate((el) => getComputedStyle(el).color);
    // var(--accent) resolves to RGB; assert non-empty + not the inactive 55% white.
    expect(color).not.toBe('rgba(255, 255, 255, 0.55)');
    expect(color).not.toBe('');
  });

  test('NAV-02 navigating to /altro renders Esci row', async ({ page }) => {
    const altroLink = page.locator('[data-bottom-tab="true"]').getByRole('link', { name: /altro/i });
    await altroLink.click();
    await expect(page).toHaveURL(/\/altro/);

    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await expect(page.getByRole('link', { name: /esci/i })).toBeVisible({ timeout: 5000 });
  });

  test('NAV-01 desktop-centered 480px pill at 1280x800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Allow the @media (min-width: 640px) rule to apply after resize.
    await page.waitForTimeout(150);

    const bar = page.locator('[data-bottom-tab="true"]');
    await expect(bar).toBeVisible();

    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(480);
    // Centered: x + width/2 ≈ viewportWidth/2 ± 4px.
    expect(Math.abs(box!.x + box!.width / 2 - 1280 / 2)).toBeLessThan(4);
  });

  test('NAV-03 bar hides under an open sheet', async ({ page }) => {
    // The exact open-trigger for a real Phase 175 Sheet from / is fragile
    // (depends on dashboard composition + device wiring). The Plan 01 D-09
    // architecture guarantees the body[data-sheet-open="true"] selector +
    // CSS rule combo work — this test verifies the contract the spec depends
    // on by setting the body attribute programmatically (same observable
    // effect as a real sheet opening).
    const bar = page.locator('[data-bottom-tab="true"]');
    await expect(bar).toBeVisible();

    const beforeBox = await bar.boundingBox();
    expect(beforeBox).not.toBeNull();
    expect(beforeBox!.y).toBeLessThan(812);

    // Programmatic body attribute set — same as a real Phase 175 Sheet opening.
    await page.evaluate(() => {
      document.body.dataset.sheetOpen = 'true';
    });

    // Wait for the .3s slide-out transition.
    await page.waitForTimeout(450);

    const afterBox = await bar.boundingBox();
    // The bar slides translateY(140%) off-screen; bounding box top is below
    // viewport bottom (or boundingBox returns null if fully off-screen).
    if (afterBox !== null) {
      expect(afterBox.y).toBeGreaterThan(812 - 10);
    }

    // Cleanup: clear the attribute so subsequent tests start fresh.
    await page.evaluate(() => {
      delete document.body.dataset.sheetOpen;
    });
  });

  test('NAV-01..04 console-error gate over /altro navigation', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.goto('/altro');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
    cleanup();
    expect(errors).toEqual([]);
  });
});
