import { test, expect } from '@playwright/test';

/**
 * DS-05 — ambient persistence across hard reload (Phase 174).
 *
 * Asserts:
 * - localStorage 'ember-glass-ambient' = 'true' + reload → inline pre-paint
 *   script (Plan 02) sets <html data-ambient="on">.
 * - Default visit (no localStorage entry) leaves data-ambient unset/'off'
 *   (D-14: ambient is OPT-IN).
 * - Toggling the picker switch on /debug/design-system-v2 mutates dataset.ambient
 *   AND localStorage in one click.
 */
test.describe('DS-05 — ambient persistence (hard reload survival)', () => {
  test.beforeEach(async ({ page }) => {
    // Reset any leak from previous tests: clear persisted ambient + reset
    // the documentElement.dataset.ambient that the inline pre-paint script
    // may have set on a prior hard reload.
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => {
      localStorage.removeItem('ember-glass-ambient');
      delete document.documentElement.dataset.ambient;
    });
  });

  test('localStorage ember-glass-ambient=true survives hard reload via inline pre-paint script', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => localStorage.setItem('ember-glass-ambient', 'true'));
    await page.reload();
    const dataAmbient = await page.evaluate(() => document.documentElement.dataset.ambient);
    expect(dataAmbient).toBe('on');
  });

  test('default visit (no localStorage) leaves data-ambient unset (D-14 default OFF)', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => localStorage.removeItem('ember-glass-ambient'));
    await page.reload();
    const dataAmbient = await page.evaluate(() => document.documentElement.dataset.ambient);
    expect(dataAmbient === undefined || dataAmbient === '' || dataAmbient === 'off').toBe(true);
  });

  test('ambient toggle on /debug/design-system-v2 dispatches event and updates dataset', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await page.evaluate(() => localStorage.removeItem('ember-glass-ambient'));
    await page.reload();
    await page.getByRole('switch', { name: /Attiva glow ambient/i }).click();
    const dataAmbient = await page.evaluate(() => document.documentElement.dataset.ambient);
    expect(dataAmbient).toBe('on');
    const persisted = await page.evaluate(() => localStorage.getItem('ember-glass-ambient'));
    expect(persisted).toBe('true');
  });
});
