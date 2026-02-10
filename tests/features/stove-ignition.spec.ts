import { test, expect } from '@playwright/test';

test.describe('Stove Ignition Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to fully load (dashboard cards render via server components)
    await page.waitForLoadState('networkidle');
  });

  test('should display stove card with current status', async ({ page }) => {
    // Verify StoveCard is visible on dashboard
    // StoveCard renders with heading "Stufa" (level 2)
    const stoveHeading = page.getByRole('heading', { name: 'Stufa', level: 2 });
    await expect(stoveHeading).toBeVisible({ timeout: 15000 });
  });

  test('should show stove status indicator', async ({ page }) => {
    // Verify the stove status is displayed
    // Status is shown via Badge component with text like "IN FUNZIONE", "SPENTA", etc.
    // We can verify the badge exists within the stove card
    const stoveHeading = page.getByRole('heading', { name: 'Stufa', level: 2 });
    await expect(stoveHeading).toBeVisible({ timeout: 15000 });

    // Status badge should be visible near the stove heading
    // The status text varies (SPENTA, IN FUNZIONE, AVVIO IN CORSO, etc.)
    // Verify at least one of the common status badges is visible
    const statusBadge = page.locator('div').filter({
      has: stoveHeading
    }).locator('[class*="badge"]').first();

    await expect(statusBadge).toBeVisible({ timeout: 15000 });
  });

  test('should have ignition controls available', async ({ page }) => {
    // Verify the ignition button/control exists and is interactive
    // Buttons show "ACCENDI" when stove is off, "SPEGNI" when on
    const igniteButton = page.getByRole('button', { name: /ACCENDI/i });
    const shutdownButton = page.getByRole('button', { name: /SPEGNI/i });

    // At least one control should be visible (either ignite or shutdown depending on state)
    const hasIgniteControl = await igniteButton.isVisible({ timeout: 10000 }).catch(() => false);
    const hasShutdownControl = await shutdownButton.isVisible({ timeout: 10000 }).catch(() => false);

    expect(hasIgniteControl || hasShutdownControl).toBe(true);
  });

  test('should show fan and power level indicators', async ({ page }) => {
    // Verify fan and power level displays are visible
    // These are shown in info boxes with emojis 💨 and ⚡
    const stoveHeading = page.getByRole('heading', { name: 'Stufa', level: 2 });
    await expect(stoveHeading).toBeVisible({ timeout: 15000 });

    // Look for fan level indicator (💨 Ventola)
    const fanIndicator = page.locator('text=/Ventola/i').first();
    await expect(fanIndicator).toBeVisible({ timeout: 15000 });

    // Look for power level indicator (⚡ Potenza)
    const powerIndicator = page.locator('text=/Potenza/i').first();
    await expect(powerIndicator).toBeVisible({ timeout: 15000 });
  });
});
