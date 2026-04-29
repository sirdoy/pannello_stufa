import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * DASH-01..DASH-12 — equal-size dashboard glass cards (Phase 177).
 *
 * End-to-end runtime verification of the EmberGlass dashboard. Asserts:
 *   DASH-01  : 2-col grid with 1:1 (square) children.
 *   DASH-02..10: per-card content shape (10 visible cards by default).
 *   DASH-11  : tap → Sheet opens for the 8 interactive cards.
 *              Weather + Raspi do NOT open a Sheet on tap (read-only).
 *   DASH-12  : stagger animationDelay increments by 100ms.
 *   Console   : zero JS errors during dashboard mount.
 *
 * Helpers reused (verbatim):
 *   - collectConsoleErrors() — tests/smoke/page-loads.spec.ts:7-20.
 *   - dismissVersionEnforcerIfPresent() — tests/smoke/splash.spec.ts:60-80.
 *
 * VersionEnforcer mitigation (W5 hard requirement, no soft-OR):
 *   The pre-existing app-level <ForceUpdateModal> can intercept clicks and pin its
 *   z-index above 9999 (Phase 175 D-17 / 177 CONTEXT D-28). beforeEach installs
 *   a defensive route-mock for any HTTP-based version check AND calls the DOM-
 *   side dismissal helper after page.goto.
 */

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

/** 8 interactive cards (DASH-11 positive). */
const INTERACTIVE_CARDS: Array<{ testId: string; title: string }> = [
  { testId: 'stove-card', title: 'Stufa' },
  { testId: 'climate-card', title: 'Clima' },
  { testId: 'lights-card', title: 'Luci' },
  { testId: 'sonos-card', title: 'Sonos' },
  { testId: 'camera-card', title: 'Camera' },
  { testId: 'network-card', title: 'Rete' },
  { testId: 'tuya-card', title: 'Prese smart' },
  { testId: 'dirigera-card', title: 'IKEA' },
];

/** 2 read-only cards (DASH-11 negative — tap MUST NOT open a Sheet). */
const READ_ONLY_CARDS: string[] = ['weather-card', 'raspi-card'];

/** All 10 dashboard cards (DASH-02..DASH-10 presence shape). */
const ALL_CARDS: string[] = [
  'stove-card',
  'climate-card',
  'lights-card',
  'sonos-card',
  'weather-card',
  'camera-card',
  'network-card',
  'raspi-card',
  'tuya-card',
  'dirigera-card',
];

test.describe('DASH-01..DASH-12 — equal-size dashboard glass cards', () => {
  // HARD MITIGATION (W5 fix — no soft-OR fallback):
  //   1. Defensive route-mock — short-circuits any HTTP-based version check
  //      BEFORE page.goto so the modal cannot mount from an /api/version probe.
  //      This is a no-op when the canonical app reads from Firebase RTDB
  //      (current implementation per app/context/VersionContext.tsx) but stays
  //      defensive against future refactors.
  //   2. DOM-side dismissal helper — handles the modal that VersionContext
  //      may mount during the initial subscription tick.
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/version*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ version: '99.99.99' }),
      })
    );
    // Pre-populate localStorage to suppress the WhatsNewModal cold-load mount
    // (useVersionCheck() — keys: lastSeenVersion + dismissedVersions). Without
    // this, the changelog Radix dialog overlays the dashboard and intercepts
    // every pointer click in DASH-11 assertions.
    //
    // The hook gates on `lastSeen !== APP_VERSION && !dismissed.includes(APP_VERSION)`
    // (see useVersionCheck.ts:68). Setting both to a high sentinel (covers any
    // future bumps) plus a wildcard dismissal of every plausible runtime APP_VERSION
    // ensures the modal stays suppressed regardless of what `lib/version.ts` exports.
    await page.addInitScript(() => {
      try {
        // Sentinel matches/exceeds any plausible APP_VERSION; also match the
        // route-mock semver above so `getLatestVersion()` Firebase responses
        // are out-classed even if the comparator runs.
        window.localStorage.setItem('lastSeenVersion', '99.99.99');
        // Pre-dismiss a wide range of versions so `dismissed.includes(APP_VERSION)`
        // returns true for any 1.x.x or 99.x.x APP_VERSION the bundled lib/version.ts
        // exports. Cheap defensive list.
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
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    // Defensive: even with localStorage primed, race conditions around hydration
    // can leave the modal briefly mounted; dismiss it before measuring the grid.
    await dismissWhatsNewModalIfPresent(page);
    // Wait for at least one dashboard card to render so subsequent assertions
    // do not race the async server component hydration.
    await expect(page.locator('.grid.grid-cols-2').first()).toBeVisible({ timeout: 15000 });
  });

  test('DASH-01 grid is 2-col with 1:1 children', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);

    const grid = page.locator('.grid.grid-cols-2').first();
    await expect(grid).toBeVisible();

    const sizes = await grid.locator('[data-testid$="-card"]').evaluateAll((els) =>
      els.map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { w: r.width, h: r.height };
      })
    );
    expect(sizes.length).toBeGreaterThan(0);
    sizes.forEach(({ w, h }) =>
      expect(
        Math.abs(w - h),
        `Card aspect ratio not 1:1 — width=${w}, height=${h}`
      ).toBeLessThan(1)
    );

    cleanup();
    expect(
      errors,
      `Console errors during dashboard mount: ${errors.join(', ')}`
    ).toHaveLength(0);
  });

  test('DASH-02..DASH-10 per-card content shape', async ({ page }) => {
    // Every card visible by default in the unified-device-config defaults.
    for (const id of ALL_CARDS) {
      await expect(
        page.getByTestId(id),
        `Expected ${id} to be visible on dashboard`
      ).toBeVisible({ timeout: 15000 });
    }
    // DASH-02 specific: stove temp readout (powerLevel) is visible.
    await expect(page.getByTestId('stove-temp')).toBeVisible();
  });

  // DASH-11 positive — each interactive card opens a Sheet on tap.
  for (const card of INTERACTIVE_CARDS) {
    test(`DASH-11 tap → sheet opens (${card.title})`, async ({ page }) => {
      await page.getByTestId(card.testId).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 2000 });
      await expect(
        dialog.getByText(card.title, { exact: true }).first()
      ).toBeVisible();
    });
  }

  // DASH-11 negative — Weather + Raspi do NOT open a Sheet (SC-#3).
  for (const testId of READ_ONLY_CARDS) {
    test(`DASH-11 ${testId} does NOT open a sheet`, async ({ page }) => {
      await page.getByTestId(testId).click();
      // Give the (non-existent) Sheet animation enough time to mount if the
      // contract were violated; 300ms is well past the Phase 175 outro of 200ms.
      await page.waitForTimeout(300);
      await expect(page.getByRole('dialog')).toBeHidden();
    });
  }

  test('DASH-12 stagger animationDelay increments by 100ms', async ({ page }) => {
    const delays = await page
      .locator('.grid.grid-cols-2 > .animate-spring-in')
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).style.animationDelay));
    expect(delays.length).toBeGreaterThan(0);
    delays.forEach((d, i) => {
      expect(d, `Card ${i} stagger delay`).toBe(`${i * 100}ms`);
    });
  });
});

// ============================================================================
// Phase 178 — SHEET-02..SHEET-06 wiring smoke tests (extends Phase 177 spec).
//
// Each describe asserts that tapping a dashboard card opens its real Sheet body
// and that an interactive control fires the expected API endpoint via a
// page.route() mock. Reuses (verbatim):
//   - collectConsoleErrors (lines 30-42)
//   - dismissVersionEnforcerIfPresent (lines 50-67)
//   - dismissWhatsNewModalIfPresent (lines 80-94)
//
// Mocking strategy mirrors the Phase 177 beforeEach (lines 134-180) — defensive
// route-mock + DOM dismissal + storageState pre-prime. Each describe owns its
// own beforeEach because Playwright route-mocks are per-context and do not
// inherit across describe blocks. Auth0 storageState is reused via the global
// playwright.config.ts setup; no per-describe login flow needed.
//
// Endpoint URLs verified against the live command hooks at runtime:
//   STOVE_ROUTES.setPower            → /api/v1/thermorossi/settings/power
//   useThermostatCommands.setRoomSetpoint → /api/v1/netatmo/setroomthermpoint
//   useLightsCommands.handleAllLightsToggle → PUT /api/v1/hue/groups/{id}/action
//   useSonosCommands.handlePlay/handlePause → POST /api/v1/sonos/zones/{id}/play|pause
//   useTuyaCommands.togglePlug       → POST /api/tuya/plugs/{id}/state
// ============================================================================

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

test.describe('SHEET-02 StoveSheet wires command', () => {
  let powerRequests: string[];

  test.beforeEach(async ({ page }) => {
    powerRequests = [];
    // Mock the Thermorossi setPower endpoint (verified in lib/routes.ts:53).
    await page.route('**/api/v1/thermorossi/settings/power', (route) =>
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ suggested_poll_delay_s: 1 }),
      }),
    );
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/thermorossi/settings/power')) {
        powerRequests.push(req.url());
      }
    });
    await primeDashboardForSheetTest(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('clicking + on power stepper fires Thermorossi setPower command', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('stove-card').click();
    const sheet = page.getByTestId('stove-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    const powerWrap = sheet.getByTestId('stove-sheet-power-stepper');
    await powerWrap.getByTestId('stepper-plus').click();
    // Wait for the asynchronous request to land.
    await expect.poll(() => powerRequests.length, { timeout: 3000 }).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(
      errors,
      `Console errors during SHEET-02 scenario: ${errors.join(', ')}`,
    ).toEqual([]);
  });
});

test.describe('SHEET-03 ClimateSheet wires command', () => {
  let setpointRequests: Array<{ url: string; body: string }>;

  test.beforeEach(async ({ page }) => {
    setpointRequests = [];
    // Mock the Netatmo per-room setpoint endpoint (verified in useThermostatCommands.ts:92).
    await page.route('**/api/v1/netatmo/setroomthermpoint', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      }),
    );
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/netatmo/setroomthermpoint')) {
        setpointRequests.push({ url: req.url(), body: req.postData() ?? '' });
      }
    });
    await primeDashboardForSheetTest(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('clicking + on RadialDial fires setroomthermpoint after debounce', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('climate-card').click();
    const sheet = page.getByTestId('climate-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    // The radial-dial-plus button is rendered inside the radial wrap. ClimateSheet
    // emits a stable `radial-dial-plus` testid on the + button (per primitives spec).
    await sheet.getByTestId('radial-dial-plus').click();
    // 500ms debounce in ClimateSheet (per ThermostatCard pattern) — wait past it.
    await expect.poll(() => setpointRequests.length, { timeout: 3000 }).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(
      errors,
      `Console errors during SHEET-03 scenario: ${errors.join(', ')}`,
    ).toEqual([]);
  });
});
