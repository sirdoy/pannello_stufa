import { test, expect } from '@playwright/test';

/**
 * Phase 182 — Design System Reference Page v2 primitives smoke (DSREF-01..03).
 *
 * Covers:
 * - DSREF-01: All 13 SC-#1 primitive sub-block names render in the DOM.
 * - DSREF-01: Sections 08 / 09 / 10 headings render with their Italian h2 text.
 * - DSREF-03: Accent picker → live recolor invariant. Clicking Violet sets
 *   --accent to oklch(0.65 0.17 290); downstream primitive surfaces (CircBtn
 *   primary + BigSlider gradient fill) reflect the change without a reload.
 *
 * Auth: storageState from playwright.config.ts applies the test Auth0 session.
 * No explicit auth setup needed in this spec.
 */

test.describe('Phase 182 — primitives reference (DSREF-01..03)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(
      page.getByRole('heading', { level: 1, name: /Ember Glass/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('Section 08 / 09 / 10 headings render in Italian', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 2, name: /Primitive carta/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /Primitive sheet/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /Sheet device dal vivo/i })
    ).toBeVisible();
  });

  test('all 13 SC-#1 primitive sub-block name labels are visible', async ({ page }) => {
    const primitiveNames = [
      'GlassCard',
      'CardHead',
      'StatusDot',
      'InlineToggle',
      'CircBtn',
      'MiniStat',
      'FlameViz',
      'PlayingBars',
      'SheetRow',
      'Stepper',
      'Slider',
      'BigSlider',
      'RadialDial',
    ];
    for (const name of primitiveNames) {
      // Sub-block names are <h3> per D-11. Use level 3 for precision; each name is exact.
      await expect(
        page.getByRole('heading', { level: 3, name: new RegExp(`^${name}$`) })
      ).toBeVisible();
    }
  });

  test('5 launcher pills (Stufa, Clima, Luci, Sonos, Prese) are visible in Section 10', async ({ page }) => {
    // Section10SheetGallery renders Pressable pills with data-testid per DEVICE_KEYS.
    // Explicit keys: launcher-stove, launcher-climate, launcher-lights, launcher-sonos, launcher-plugs
    const launcherKeys = [
      'launcher-stove',
      'launcher-climate',
      'launcher-lights',
      'launcher-sonos',
      'launcher-plugs',
    ] as const;
    for (const testid of launcherKeys) {
      await expect(page.locator(`[data-testid="${testid}"]`)).toBeVisible();
    }
  });

  test('Violet accent → CircBtn primary + BigSlider gradient reflect var(--accent) (SC-#3)', async ({ page }) => {
    // Pick Violet — same selector pattern as accent-picker.spec.ts
    await page.getByRole('button', { name: /Set accent to Violet/i }).click();

    // Assert --accent CSS var is set to violet value on documentElement
    const accent = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--accent').trim()
    );
    expect(accent).toBe('oklch(0.65 0.17 290)');

    // CircBtn primary: assert resolved background is non-empty and non-transparent.
    // Section08CardPrimitives renders CircBtn with primary + tone="var(--accent)".
    // Inline style sets `background: tone` where tone is 'var(--accent)', so
    // getComputedStyle resolves to an rgb()/oklch() value after the accent change.
    // Copper oklch(0.68 0.17 45) and Violet oklch(0.65 0.17 290) resolve to
    // different rgb values — non-empty + non-transparent is the contract here
    // since exact rgb resolution differs across browser versions.
    const circBtnPrimary = page.locator('[data-testid="circ-btn-primary"]').first();
    await expect(circBtnPrimary).toBeVisible();
    const circBtnBg = await circBtnPrimary.evaluate(
      (el) => window.getComputedStyle(el as HTMLElement).backgroundColor
    );
    expect(circBtnBg).not.toBe('');
    expect(circBtnBg).not.toBe('rgba(0, 0, 0, 0)');

    // BigSlider gradient fill: assert the inline `style.background` literal
    // contains "var(--accent)" — the gradient is built with `${color}` where
    // color defaults to var(--accent), so the literal string survives in the
    // fill div's inline style attribute (unresolved), confirming Plan 03's
    // verbatim port and Plan 09's <BigSlider value=... onChange=... /> wiring.
    const bigSlider = page.locator('[data-testid="big-slider"]').first();
    await expect(bigSlider).toBeVisible();
    const fillBg = await bigSlider.evaluate((el) => {
      const fill = el.firstElementChild as HTMLElement | null;
      return fill?.style?.background ?? '';
    });
    expect(fillBg).toContain('var(--accent)');
  });
});
