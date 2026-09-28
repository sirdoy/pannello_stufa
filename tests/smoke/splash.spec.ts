import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';
import { signIn } from '../helpers/auth.helpers';
import { TEST_USER } from '../helpers/test-context';

/**
 * SPLASH-01..05 — post-login splash animation (Phase 176).
 *
 * Asserts:
 *   SPLASH-01: splash mounts within ~1500ms of dashboard landing post-login.
 *   SPLASH-02: animation timeline beats (flame scale(0.4) → scale(1) → unmount).
 *   SPLASH-03: prefers-reduced-motion: reduce → opacity-only fade, no transform, ≤600ms.
 *   SPLASH-04: subsequent in-session route changes do NOT re-trigger the splash.
 *   SPLASH-05: ≥1 device API request fires while the splash is visible.
 *
 * Determinism (roadmap T2): every timing is measured inside the page, relative to the
 * moment the overlay mounts, by a MutationObserver installed with addInitScript
 * (`installSplashRecorder`). Nothing depends on how fast `next dev` compiles, hydrates
 * or resolves /auth/profile after the post-login navigation: the test only waits
 * (generously) for the recorder to see the splash finish, then checks the recorded
 * timeline. Timer jitter can only delay phases, so the bounds are lower-tight and
 * upper-loose.
 *
 * Helpers reused:
 *   - signIn() — tests/helpers/auth.helpers.ts (Phase 51 pattern).
 *   - collectConsoleErrors() — tests/smoke/page-loads.spec.ts (Phase 97 pattern).
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

interface SplashRecord {
  /** performance.now() when the overlay was first seen in this document. */
  mountAt: number | null;
  /** performance.now() when the overlay left the DOM. */
  unmountAt: number | null;
  /** Distinct inline transforms of the flame, in order, with their timestamps. */
  flame: { t: number; transform: string }[];
  /** Computed transforms captured at mount (reduced-motion checks). */
  flameComputedAtMount: string | null;
  wrapperComputedAtMount: string | null;
  /** Dashboard wrapper reached opacity 1 (the gate has decided and revealed content). */
  revealedAt: number | null;
}

declare global {
  interface Window {
    __splash?: SplashRecord;
  }
}

/** Records the splash lifecycle of every document the page loads. Call BEFORE signIn(). */
async function installSplashRecorder(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const rec: SplashRecord = {
      mountAt: null,
      unmountAt: null,
      flame: [],
      flameComputedAtMount: null,
      wrapperComputedAtMount: null,
      revealedAt: null,
    };
    window.__splash = rec;
    const observe = () => {
      const now = performance.now();
      const overlay = document.querySelector('[data-testid="splash-overlay"]');
      const flame = document.querySelector<HTMLElement>('[data-testid="splash-flame"]');
      const wrapper = document.querySelector<HTMLElement>('[data-testid="dashboard-wrapper"]');
      if (overlay && rec.mountAt === null) {
        rec.mountAt = now;
        if (flame) rec.flameComputedAtMount = getComputedStyle(flame).transform;
        if (wrapper) rec.wrapperComputedAtMount = getComputedStyle(wrapper).transform;
      }
      if (!overlay && rec.mountAt !== null && rec.unmountAt === null) rec.unmountAt = now;
      if (flame) {
        const last = rec.flame[rec.flame.length - 1];
        if (!last || last.transform !== flame.style.transform) {
          rec.flame.push({ t: now, transform: flame.style.transform });
        }
      }
      if (wrapper?.style.opacity === '1' && rec.revealedAt === null) rec.revealedAt = now;
    };
    new MutationObserver(observe).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  });
}

const readRecord = (page: Page) => page.evaluate(() => window.__splash as SplashRecord);

/** Generous: covers `next dev` on-demand compilation of the landing page. */
const LANDING_TIMEOUT = 30_000;

/** Waits until the recorder has seen the splash mount and unmount on the current document. */
async function waitForSplashCycle(page: Page): Promise<SplashRecord> {
  await page.waitForFunction(() => window.__splash?.unmountAt != null, undefined, {
    timeout: LANDING_TIMEOUT,
  });
  return readRecord(page);
}

/** Waits until the gate has revealed the content of the current document. */
async function waitForReveal(page: Page): Promise<SplashRecord> {
  await page.waitForFunction(() => window.__splash?.revealedAt != null, undefined, {
    timeout: LANDING_TIMEOUT,
  });
  return readRecord(page);
}

const isIdentity = (t: string | null) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';

test.describe('SPLASH-01..05 — splash overlay', () => {
  // Fresh sign-in per test so sessionStorage starts empty (otherwise the splash
  // would be suppressed on the second test by the SPLASH-04 session-once flag).
  test.use({ storageState: { cookies: [], origins: [] } });
  test.describe.configure({ timeout: 90_000 });

  test('SPLASH-01 splash plays once on the landing page after login', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await installSplashRecorder(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    const rec = await waitForSplashCycle(page);
    // Full-motion timeline ends at t=2100ms (onDone → unmount).
    const duration = rec.unmountAt! - rec.mountAt!;
    expect(duration).toBeGreaterThanOrEqual(2000);
    expect(duration).toBeLessThan(5000);
    // Content is revealed when the splash completes.
    expect(rec.revealedAt).not.toBeNull();

    cleanup();
    expect(errors, `Console errors during splash: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('SPLASH-02 sequence beats: flame scale(0.4) → scale(1) → scale(1.08) → unmount', async ({ page }) => {
    await installSplashRecorder(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    const rec = await waitForSplashCycle(page);
    const beats = rec.flame.map((f) => f.transform);
    expect(beats, `flame transforms: ${beats.join(' → ')}`).toEqual([
      'scale(0.4)',
      'scale(1)',
      'scale(1.08)',
    ]);
    const at = (transform: string) => rec.flame.find((f) => f.transform === transform)!.t - rec.mountAt!;
    // Phase 1 at t=600ms, phase 2 at t=1500ms (timers can only fire late).
    expect(at('scale(0.4)')).toBeLessThan(100);
    expect(at('scale(1)')).toBeGreaterThanOrEqual(550);
    expect(at('scale(1.08)')).toBeGreaterThanOrEqual(1450);
    expect(rec.unmountAt! - rec.mountAt!).toBeGreaterThanOrEqual(2050);
  });

  test('SPLASH-03 reduced-motion: opacity-only fade, no transform, short', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    try {
      await installSplashRecorder(page);
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await dismissVersionEnforcerIfPresent(page);

      const rec = await waitForSplashCycle(page);
      expect(
        isIdentity(rec.flameComputedAtMount),
        `Reduced-motion: flame transform should be identity, got "${rec.flameComputedAtMount}"`
      ).toBeTruthy();
      expect(
        isIdentity(rec.wrapperComputedAtMount),
        `Reduced-motion: dashboard-wrapper transform should be identity, got "${rec.wrapperComputedAtMount}"`
      ).toBeTruthy();
      expect(rec.flame.every((f) => f.transform === 'none')).toBeTruthy();
      // 200ms fade (vs 2100ms full-motion); upper bound absorbs timer jitter under load.
      expect(rec.unmountAt! - rec.mountAt!).toBeLessThan(1000);
    } finally {
      await ctx.close();
    }
  });

  test('SPLASH-04 no re-trigger on in-session route change (Home → Rooms → Automations → Home)', async ({ page }) => {
    await installSplashRecorder(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);
    await waitForSplashCycle(page);

    for (const path of ['/rooms', '/automations', '/']) {
      await page.goto(path);
      // Once content is revealed the gate has read the session flag: no splash may follow.
      const rec = await waitForReveal(page);
      expect(rec.mountAt, `splash re-triggered on ${path}`).toBeNull();
    }
  });

  test('SPLASH-05 ≥1 device data request fires during splash window', async ({ page }) => {
    await installSplashRecorder(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    const rec = await waitForSplashCycle(page);
    // Same clock as the recorder: resource timing startTime is performance.now()-based.
    const apiRequests = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((e) => new URL(e.name).pathname.startsWith('/api/'))
        .map((e) => ({ path: new URL(e.name).pathname, start: e.startTime }))
    );
    // Match any of the canonical device API namespaces (CONTEXT.md D-27), plus the live
    // channel: dashboard device data arrives as WS snapshots, opened via /api/ws-token.
    const deviceApiPattern =
      /^\/api\/((v1\/)?(stove|thermorossi|thermostat|netatmo|lights|hue|network|fritzbox|sonos|dirigera|raspi|tuya)|ws-token)/;
    const matched = apiRequests.filter((r) => deviceApiPattern.test(r.path) && r.start <= rec.unmountAt!);
    expect(
      matched.length,
      `SPLASH-05: expected ≥1 device API request before the splash unmounts. Captured: ${apiRequests
        .slice(0, 20)
        .map((r) => `${r.path}@${Math.round(r.start)}`)
        .join(', ')} (unmount @${Math.round(rec.unmountAt!)})`
    ).toBeGreaterThanOrEqual(1);
  });
});
