import { test, expect, type Page } from '@playwright/test';

/**
 * DS-04 — fonts self-hosted (Phase 174).
 *
 * Asserts zero requests to fonts.googleapis.com / fonts.gstatic.com on / and
 * /debug/design-system-v2. next/font self-hosts Outfit + Inter via @font-face
 * pointing at /_next/static/media/* — any request to the Google CDN is a
 * regression (D-11).
 *
 * waitForLoadState('networkidle') is preferred over 'domcontentloaded' here
 * because @font-face resolutions are lazy and may fire after DOM-ready
 * (RESEARCH §"Pitfall 5").
 */
function collectGoogleFontRequests(page: Page): { urls: string[]; cleanup: () => void } {
  const urls: string[] = [];
  const handler = (request: { url: () => string }): void => {
    const u = request.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) {
      urls.push(u);
    }
  };
  page.on('request', handler);
  return { urls, cleanup: () => page.off('request', handler) };
}

test.describe('DS-04 — fonts self-hosted (no Google CDN)', () => {
  test('zero requests to fonts.googleapis.com / fonts.gstatic.com on /', async ({ page }) => {
    const { urls, cleanup } = collectGoogleFontRequests(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    cleanup();
    expect(urls, `Expected zero Google Fonts requests on /, got: ${urls.join(', ')}`).toEqual([]);
  });

  test('zero requests to fonts.googleapis.com / fonts.gstatic.com on /debug/design-system-v2', async ({ page }) => {
    const { urls, cleanup } = collectGoogleFontRequests(page);
    await page.goto('/debug/design-system-v2');
    await page.waitForLoadState('networkidle');
    cleanup();
    expect(urls, `Expected zero Google Fonts requests on design-system-v2, got: ${urls.join(', ')}`).toEqual([]);
  });
});
