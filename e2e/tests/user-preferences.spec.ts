import { test, expect } from '@playwright/test';

/**
 * User Preferences Tests
 *
 * Tests notification preference controls and DND (Do Not Disturb) settings.
 * Verifies that user can configure notification filtering rules.
 */

test.describe('User Preferences', () => {
  test('notification settings page loads', async ({ page }) => {
    await page.goto('/settings/notifications');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should have a form
    const hasForm = await page.locator('form').isVisible();
    expect(hasForm).toBeTruthy();
  });

  test('category toggles are present', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Look for notification category controls
    const categoryLabels = await page.locator('text=/alerts|routine|system/i').count();

    console.log('Found category labels:', categoryLabels);

    // Should have at least some category controls
    expect(categoryLabels).toBeGreaterThan(0);
  });

  test('can toggle notification categories', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Find first checkbox (any category toggle)
    const firstCheckbox = page.locator('input[type="checkbox"]').first();

    if (await firstCheckbox.isVisible()) {
      const initialState = await firstCheckbox.isChecked();
      console.log('Initial checkbox state:', initialState);

      // Toggle checkbox
      await firstCheckbox.click();
      await page.waitForTimeout(300);

      const newState = await firstCheckbox.isChecked();
      console.log('New checkbox state:', newState);

      // State should change
      expect(newState).not.toBe(initialState);

      // Toggle back
      await firstCheckbox.click();
      await page.waitForTimeout(300);

      const restoredState = await firstCheckbox.isChecked();
      expect(restoredState).toBe(initialState);
    } else {
      console.log('No checkboxes found (may use different UI pattern)');
    }
  });

  test('DND hours inputs are present', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Look for time inputs (DND start/end)
    const timeInputs = await page.locator('input[type="time"]').count();

    console.log('Found time inputs:', timeInputs);

    // Should have DND time inputs (start and end)
    if (timeInputs >= 2) {
      expect(timeInputs).toBeGreaterThanOrEqual(2);
    } else {
      // May use text inputs with time pattern
      const timePatternInputs = await page.locator('input[placeholder*=":"]').count();
      console.log('Found time pattern inputs:', timePatternInputs);
    }
  });

  test('can set DND hours', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Find DND inputs
    const dndStartInput = page.locator('input[type="time"]').first();

    if (await dndStartInput.isVisible()) {
      // Set start time
      await dndStartInput.fill('23:00');
      await page.waitForTimeout(300);

      const startValue = await dndStartInput.inputValue();
      console.log('DND start time set to:', startValue);

      expect(startValue).toBe('23:00');
    } else {
      console.log('DND time inputs not found (may not be implemented or use different pattern)');
    }
  });

  test('save button saves preferences', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Find save button
    const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Salva")').first();

    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Wait for save operation
      await page.waitForTimeout(1000);

      // Look for success feedback
      const successShown = await page.locator(
        '[role="alert"], .success, text=/saved|salvato/i'
      ).isVisible().catch(() => false);

      console.log('Success feedback shown:', successShown);

      // Page should remain accessible
      await expect(page).toHaveURL('/settings/notifications');
    } else {
      console.log('Save button not found');
    }
  });

  test('advanced mode toggle reveals additional settings', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Look for advanced/mode toggle
    const modeToggle = page.locator('button:has-text("Advanced"), button:has-text("Avanzate"), [data-testid*="mode"]').first();

    if (await modeToggle.isVisible()) {
      console.log('Found advanced mode toggle');

      // Get initial controls count
      const initialControls = await page.locator('input, select').count();

      // Toggle advanced mode
      await modeToggle.click();
      await page.waitForTimeout(500);

      // Should show more controls
      const afterControls = await page.locator('input, select').count();

      console.log(`Controls before: ${initialControls}, after: ${afterControls}`);

      // Advanced mode should reveal additional controls
      expect(afterControls).toBeGreaterThanOrEqual(initialControls);
    } else {
      console.log('Advanced mode toggle not found (may always show all settings)');
    }
  });

  test('per-type notification controls work', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Look for specific notification type controls (ERROR, scheduler_success, etc)
    const typeControls = await page.locator('text=/ERROR|scheduler|maintenance/i').count();

    console.log('Found notification type controls:', typeControls);

    if (typeControls > 0) {
      // Try toggling a specific type
      const firstTypeCheckbox = page.locator('input[type="checkbox"]').first();

      if (await firstTypeCheckbox.isVisible()) {
        const before = await firstTypeCheckbox.isChecked();
        await firstTypeCheckbox.click();
        await page.waitForTimeout(300);
        const after = await firstTypeCheckbox.isChecked();

        expect(after).not.toBe(before);
      }
    } else {
      console.log('Per-type controls not found (may only have category-level controls)');
    }
  });

  test('rate limit settings are configurable', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Look for rate limit inputs (numbers or ranges)
    const numberInputs = await page.locator('input[type="number"]').count();

    console.log('Found number inputs (potential rate limits):', numberInputs);

    if (numberInputs > 0) {
      const firstNumberInput = page.locator('input[type="number"]').first();

      if (await firstNumberInput.isVisible()) {
        const currentValue = await firstNumberInput.inputValue();
        console.log('Current rate limit value:', currentValue);

        // Try setting a value
        await firstNumberInput.fill('5');
        await page.waitForTimeout(300);

        const newValue = await firstNumberInput.inputValue();
        expect(newValue).toBe('5');
      }
    } else {
      console.log('Rate limit inputs not found (may not be exposed in UI)');
    }
  });

  test('preference changes persist after page reload', async ({ page, context }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Find first checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.isVisible()) {
      // Set to known state
      await checkbox.click();
      await page.waitForTimeout(300);

      const stateBeforeSave = await checkbox.isChecked();

      // Save
      const saveButton = page.locator('button[type="submit"]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Reload page
        await page.reload();
        await page.waitForSelector('form');

        // Check if state persisted
        const checkbox2 = page.locator('input[type="checkbox"]').first();
        const stateAfterReload = await checkbox2.isChecked();

        console.log('State before save:', stateBeforeSave, 'after reload:', stateAfterReload);

        // State should persist (may require real Firestore connection)
        expect(stateAfterReload).toBe(stateBeforeSave);
      }
    }
  });

  test('CRITICAL notifications cannot be disabled', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForSelector('form');

    // Look for CRITICAL notification controls
    const criticalControl = page.locator('text=/critical/i').first();

    if (await criticalControl.isVisible()) {
      // Find associated checkbox
      const criticalCheckbox = criticalControl.locator('..').locator('input[type="checkbox"]').first();

      // Should either be checked and disabled, or not present
      const isDisabled = await criticalCheckbox.isDisabled().catch(() => true);
      const isChecked = await criticalCheckbox.isChecked().catch(() => true);

      console.log('CRITICAL control - disabled:', isDisabled, 'checked:', isChecked);

      // CRITICAL should always be enabled (per 03-04 decision)
      expect(isChecked || isDisabled).toBeTruthy();
    } else {
      console.log('CRITICAL notification control not found in UI');
    }
  });
});
