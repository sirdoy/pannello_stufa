import { test, expect } from '@playwright/test';

test.describe('Thermostat Schedule Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display thermostat card with device info', async ({ page }) => {
    // Verify ThermostatCard is visible on dashboard
    // ThermostatCard renders with heading "Termostato"
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });
  });

  test('should show current temperature reading', async ({ page }) => {
    // Verify temperature is displayed
    // Temperature is shown with data-component="temperature-display"
    // Temperature format: "XX.X°" or "XX°"
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });

    // Look for temperature display - shown as text matching pattern like "20.5°" or "21°"
    // The temperature display has label "Attuale" for current temp
    const currentTempLabel = page.locator('text=/Attuale/i').first();
    await expect(currentTempLabel).toBeVisible({ timeout: 15000 });

    // Verify temperature value is displayed (any number followed by °)
    const tempValue = page.locator('text=/\\d+(\\.\\d+)?°/').first();
    await expect(tempValue).toBeVisible({ timeout: 15000 });
  });

  test('should show target temperature if set', async ({ page }) => {
    // Verify the target/setpoint temperature is displayed if available
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });

    // Look for target temperature label
    const targetLabel = page.locator('text=/Target/i').first();

    // Target may not always be visible (depends on thermostat mode)
    // If visible, verify it has a temperature value
    const isTargetVisible = await targetLabel.isVisible({ timeout: 5000 }).catch(() => false);

    if (isTargetVisible) {
      await expect(targetLabel).toBeVisible();

      // Verify target temperature value exists
      const targetContainer = page.locator('[class*="ocean"]').filter({ hasText: /Target/i }).first();
      await expect(targetContainer).toBeVisible();
    }
  });

  test('should show thermostat mode controls', async ({ page }) => {
    // Verify mode control buttons are available (Auto, Away, Gelo, Off)
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });

    // Look for mode label/divider
    const modeLabel = page.locator('text=/Modalità/i').first();
    await expect(modeLabel).toBeVisible({ timeout: 15000 });

    // Verify at least one mode button is visible (Auto/⏰, Away/🏃, Gelo/❄️, Off/⏸️)
    const autoButton = page.getByRole('button', { name: /Auto/i });
    const awayButton = page.getByRole('button', { name: /Away/i });
    const geloButton = page.getByRole('button', { name: /Gelo/i });
    const offButton = page.getByRole('button', { name: /Off/i });

    const hasAutoMode = await autoButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasAwayMode = await awayButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasGeloMode = await geloButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasOffMode = await offButton.isVisible({ timeout: 5000 }).catch(() => false);

    // At least one mode control should be visible
    expect(hasAutoMode || hasAwayMode || hasGeloMode || hasOffMode).toBe(true);
  });

  test('should show schedule section', async ({ page }) => {
    // Verify the schedule/programmazione section is present
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });

    // Look for schedule/programmazione section
    const scheduleLabel = page.locator('text=/Programmazione/i').first();
    await expect(scheduleLabel).toBeVisible({ timeout: 15000 });
  });

  test('should have temperature adjustment controls when applicable', async ({ page }) => {
    // Verify temperature +/- controls are available (when in manual mode)
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });

    // Look for temperature adjustment buttons (± 0.5°)
    // These may not always be visible (depends on mode and if target is set)
    const minusButton = page.getByRole('button', { name: /− 0\.5°/i });
    const plusButton = page.getByRole('button', { name: /\+ 0\.5°/i });

    const hasMinusButton = await minusButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasPlusButton = await plusButton.isVisible({ timeout: 5000 }).catch(() => false);

    // If temperature controls are visible, verify both +/- buttons exist
    if (hasMinusButton || hasPlusButton) {
      expect(hasMinusButton && hasPlusButton).toBe(true);
    }
  });
});
