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
    // Pointer events are dispatched directly to bypass any flake from page.mouse
    // moving over reactive overlays. The DS-07 spring (cubic-bezier(.34,1.56,.64,1))
    // overshoots PAST scale(0.97) — values transiently dip to ~0.965 before
    // settling — so the assertion tolerates anything in matrix(0.96…) ∪ matrix(0.97…).
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]');
      const r = el!.getBoundingClientRect();
      el!.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true, pointerId: 1, pointerType: 'mouse',
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
      }));
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
      if (!el) return false;
      const t = getComputedStyle(el).transform;
      return t.startsWith('matrix(0.96') || t.startsWith('matrix(0.97');
    }, { timeout: 1500 });
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]');
      el!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="press-card-demo"]') as HTMLElement | null;
      if (!el) return false;
      const t = getComputedStyle(el).transform;
      return t === 'matrix(1, 0, 0, 1, 0, 0)' || t === 'none' || t.startsWith('matrix(1.00');
    }, { timeout: 1500 });
  });
});
