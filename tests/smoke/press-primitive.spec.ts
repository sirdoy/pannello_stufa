import { test, expect } from '@playwright/test';

/**
 * DS-07 — press primitive on /debug/design-system-v2 (Phase 175).
 *
 * Asserts:
 * - Pressable demo card is rendered (proves barrel export → page consumer wiring).
 * - .press-anim class in app/globals.css produces the locked DS-07 transition curve
 *   (transform .22s cubic-bezier(.34,1.56,.64,1)).
 * - Pressing the demo card toggles transform: matrix(0.97, ...) via JS pointer state.
 */
test.describe('DS-07 — press primitive', () => {
  test('Pressable exported and .press-anim class registered', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('press-card-demo')).toBeVisible();
    const transition = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'press-anim';
      document.body.appendChild(el);
      const t = getComputedStyle(el).transition;
      el.remove();
      return t;
    });
    expect(transition).toMatch(/transform\s+0\.22s\s+cubic-bezier\(0?\.34,\s*1\.56,\s*0?\.64,\s*1\)/);
  });

  test('press toggles scale(0.97) via JS state', async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    const card = page.getByTestId('press-card-demo');
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    if (!box) throw new Error('press-card-demo bounding box missing');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
      return !!el && getComputedStyle(el).transform.includes('matrix(0.97');
    }, { timeout: 1000 });
    await page.mouse.up();
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
      if (!el) return false;
      const t = getComputedStyle(el).transform;
      return t === 'matrix(1, 0, 0, 1, 0, 0)' || t === 'none';
    }, { timeout: 1000 });
  });
});
