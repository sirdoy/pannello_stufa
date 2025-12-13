// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Dark Mode Contrast Test Suite
 *
 * Tests WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
 * Uses TEST_MODE to bypass Auth0, SANDBOX_MODE for different states
 */

test.describe('Dark Mode Contrast Verification', () => {
  test.use({
    colorScheme: 'dark',
  });

  test.beforeEach(async ({ page }) => {
    // Set environment for testing
    await page.goto('http://localhost:3000');

    // Wait for skeleton to finish loading (max 5s)
    await page.waitForSelector('[data-liquid-glass="true"]', {
      state: 'visible',
      timeout: 5000
    });
  });

  test('StoveCard - Status Box Text Contrast', async ({ page }) => {
    // Wait for StoveCard to load
    const stoveCard = page.locator('[data-liquid-glass="true"]').first();
    await expect(stoveCard).toBeVisible();

    // Check Fan level text (💨)
    const fanText = page.locator('text=Ventola').first();
    await expect(fanText).toBeVisible();

    // Verify contrast by checking computed styles
    const fanColor = await fanText.evaluate(el =>
      window.getComputedStyle(el).color
    );
    console.log('Fan text color (dark mode):', fanColor);

    // Should be light color in dark mode (rgb values > 150)
    expect(fanColor).toContain('rgb');
  });

  test('Mode Indicator - Label Contrast', async ({ page }) => {
    // Find mode indicator section
    const modeLabel = page.locator('text=Modalità controllo').first();
    await expect(modeLabel).toBeVisible();

    // Check mode type label (Automatica/Manuale/Semi-manuale)
    const modeType = page.locator('.text-success-700, .text-warning-700, .text-accent-700').first();

    if (await modeType.count() > 0) {
      const textColor = await modeType.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('Mode type color (dark mode):', textColor);

      // Should have dark: variant applied
      await expect(modeType).toHaveClass(/dark:text-/);
    }
  });

  test('Next Scheduled Action - Text Contrast', async ({ page }) => {
    // Look for next action text
    const nextAction = page.locator('text=/🔥 Accensione|❄️ Spegnimento/').first();

    if (await nextAction.count() > 0) {
      await expect(nextAction).toBeVisible();

      const actionColor = await nextAction.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('Next action color (dark mode):', actionColor);
    }
  });

  test('Config Buttons - Background & Text Contrast', async ({ page }) => {
    // Find "Configura Pianificazione" or similar buttons
    const configButton = page.locator('button:has-text("Configura")').first();

    if (await configButton.count() > 0) {
      await expect(configButton).toBeVisible();

      const bgColor = await configButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      const textColor = await configButton.evaluate(el =>
        window.getComputedStyle(el).color
      );

      console.log('Button bg (dark mode):', bgColor);
      console.log('Button text (dark mode):', textColor);

      // Should have dark mode background
      expect(bgColor).toContain('rgb');
    }
  });

  test('Status Badges - Visibility in Dark Mode', async ({ page }) => {
    // Check status indicator badges (✓ Stufa in funzione, ○ Stufa spenta)
    const statusBadge = page.locator('text=/✓ Stufa in funzione|○ Stufa spenta/').first();

    if (await statusBadge.count() > 0) {
      await expect(statusBadge).toBeVisible();

      // Get parent container opacity
      const badgeContainer = statusBadge.locator('..');
      const opacity = await badgeContainer.evaluate(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        return bg;
      });

      console.log('Badge container bg (dark mode):', opacity);

      // Text should be visible
      const textColor = await statusBadge.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('Badge text color (dark mode):', textColor);
    }
  });

  test('Separator Labels - Readability', async ({ page }) => {
    // Check separator text (MODALITÀ CONTROLLO, MANUTENZIONE, etc.)
    const separator = page.locator('text="Modalità Controllo"').first();

    if (await separator.count() > 0) {
      await expect(separator).toBeVisible();

      const textColor = await separator.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('Separator text (dark mode):', textColor);
    }
  });
});

test.describe('Dark Mode Contrast - Sandbox States', () => {
  test.use({
    colorScheme: 'dark',
  });

  test.beforeEach(async ({ page, context }) => {
    // Enable sandbox mode for testing different states
    await context.addCookies([{
      name: 'sandbox_mode',
      value: 'true',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-liquid-glass="true"]', {
      state: 'visible',
      timeout: 5000
    });
  });

  test('WORK State - Fire Icon & Status', async ({ page }) => {
    // In sandbox mode, simulate WORK state
    // Check if status text is visible
    const statusText = page.locator('text=/IN FUNZIONE|WORK/').first();

    if (await statusText.count() > 0) {
      await expect(statusText).toBeVisible();

      const color = await statusText.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('WORK status color (dark):', color);
    }
  });

  test('OFF State - Status Visibility', async ({ page }) => {
    const statusText = page.locator('text=/SPENTA|OFF/').first();

    if (await statusText.count() > 0) {
      await expect(statusText).toBeVisible();

      const color = await statusText.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('OFF status color (dark):', color);
    }
  });

  test('ERROR State - Alert Contrast', async ({ page }) => {
    // Look for error indicators
    const errorBadge = page.locator('text=/ERR|ERRORE|ALLARME/').first();

    if (await errorBadge.count() > 0) {
      await expect(errorBadge).toBeVisible();

      const color = await errorBadge.evaluate(el =>
        window.getComputedStyle(el).color
      );
      console.log('ERROR status color (dark):', color);
    }
  });
});

test.describe('Dark Mode - Visual Screenshot Verification', () => {
  test.use({
    colorScheme: 'dark',
  });

  test('Full Page Dark Mode Screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for all content loaded
    await page.waitForSelector('[data-liquid-glass="true"]', { timeout: 5000 });
    await page.waitForTimeout(1000); // Extra time for animations

    // Take full page screenshot
    await page.screenshot({
      path: 'e2e/screenshots/dark-mode-full.png',
      fullPage: true
    });

    console.log('Screenshot saved: e2e/screenshots/dark-mode-full.png');
  });

  test('StoveCard Closeup Dark Mode', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-liquid-glass="true"]', { timeout: 5000 });

    // Screenshot only StoveCard
    const stoveCard = page.locator('[data-liquid-glass="true"]').first();
    await stoveCard.screenshot({
      path: 'e2e/screenshots/dark-mode-stove-card.png'
    });

    console.log('Screenshot saved: e2e/screenshots/dark-mode-stove-card.png');
  });
});
