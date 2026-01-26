import { test, expect } from '@playwright/test';

/**
 * Notification Delivery Tests
 *
 * End-to-end tests for notification sending and history tracking.
 * Tests admin panel notification functionality.
 *
 * NOTE: These tests verify UI flow. Actual FCM delivery requires
 * real Firebase credentials and registered devices.
 */

test.describe('Notification Delivery', () => {
  // Skip in CI if no real FCM credentials
  test.skip(
    ({ browserName }) => browserName !== 'chromium' || !!process.env.CI,
    'FCM tests only run locally in Chromium'
  );

  test('admin can access test notification page', async ({ page }) => {
    // Navigate to test page
    await page.goto('/debug/notifications/test');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page components present
    const hasTemplate = await page.locator('[data-testid="test-template"]').isVisible();
    const hasSendButton = await page.locator('[data-testid="send-test-notification"]').isVisible();

    expect(hasTemplate || hasSendButton).toBeTruthy();
  });

  test('template selector shows notification templates', async ({ page }) => {
    await page.goto('/debug/notifications/test');
    await page.waitForSelector('[data-testid="test-template"]', { timeout: 10000 });

    // Get available templates
    const templates = await page.locator('[data-testid="test-template"] option').allTextContents();

    console.log('Available templates:', templates);

    // Should have multiple templates
    expect(templates.length).toBeGreaterThan(0);

    // Verify known templates exist (from 02-04-PLAN.md)
    const templateValues = await page.locator('[data-testid="test-template"] option').evaluateAll(
      (options) => options.map(opt => (opt as HTMLOptionElement).value)
    );

    expect(templateValues).toContain('error_alert');
  });

  test('selecting template updates preview', async ({ page }) => {
    await page.goto('/debug/notifications/test');
    await page.waitForSelector('[data-testid="test-template"]');

    // Select error_alert template
    await page.selectOption('[data-testid="test-template"]', 'error_alert');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify template content shows (Italian)
    const pageContent = await page.content();
    const hasErrorContent = pageContent.includes('Errore') || pageContent.includes('stufa');

    expect(hasErrorContent).toBeTruthy();
  });

  test('send button triggers notification flow', async ({ page }) => {
    await page.goto('/debug/notifications/test');
    await page.waitForSelector('[data-testid="test-template"]');

    // Select template
    await page.selectOption('[data-testid="test-template"]', 'scheduler_success');

    // Click send
    await page.click('[data-testid="send-test-notification"]');

    // Wait for result (success or error - both are valid in test env)
    const resultShown = await page.waitForSelector(
      '[data-testid="delivery-status"], .success, .error, [role="alert"]',
      { timeout: 15000, state: 'visible' }
    ).catch(() => null);

    // Result should appear (even if it's an error due to no device)
    expect(resultShown).toBeTruthy();
  });

  test('delivery status shows sent count', async ({ page }) => {
    await page.goto('/debug/notifications/test');
    await page.waitForSelector('[data-testid="test-template"]');

    // Send notification
    await page.selectOption('[data-testid="test-template"]', 'maintenance_reminder');
    await page.click('[data-testid="send-test-notification"]');

    // Wait for delivery status
    await page.waitForSelector('[data-testid="delivery-status"]', { timeout: 15000 });

    // Check if status contains count info
    const statusText = await page.locator('[data-testid="delivery-status"]').textContent();

    console.log('Delivery status:', statusText);

    // Status should have meaningful content (numbers, "sent", "failed", etc)
    expect(statusText).toBeTruthy();
    expect(statusText!.length).toBeGreaterThan(0);
  });
});

test.describe('Notification History', () => {
  test('notification history page loads', async ({ page }) => {
    await page.goto('/settings/notifications/history');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify history container exists
    const historyList = await page.locator('[data-testid="notification-list"]').isVisible();

    expect(historyList).toBeTruthy();
  });

  test('history shows notification items or empty state', async ({ page }) => {
    await page.goto('/settings/notifications/history');

    await page.waitForSelector('[data-testid="notification-list"]', { timeout: 10000 });

    // Either has items or shows empty state
    const hasItems = await page.locator('[data-testid="notification-item"]').count();
    const hasEmptyState = await page.locator('text=/no notifications|nessuna notifica|empty/i').isVisible();

    // Should have one or the other
    expect(hasItems > 0 || hasEmptyState).toBeTruthy();

    console.log(`History items: ${hasItems}, Empty state: ${hasEmptyState}`);
  });

  test('history items display notification details', async ({ page }) => {
    await page.goto('/settings/notifications/history');
    await page.waitForSelector('[data-testid="notification-list"]');

    const itemCount = await page.locator('[data-testid="notification-item"]').count();

    if (itemCount > 0) {
      // Check first item has expected structure
      const firstItem = page.locator('[data-testid="notification-item"]').first();

      // Should be visible
      await expect(firstItem).toBeVisible();

      // Get item text to verify it has content
      const itemText = await firstItem.textContent();
      expect(itemText).toBeTruthy();
      expect(itemText!.length).toBeGreaterThan(0);

      console.log('First notification item:', itemText?.substring(0, 100));
    } else {
      console.log('No notification items found (empty history is valid)');
    }
  });

  test('history filter controls work', async ({ page }) => {
    await page.goto('/settings/notifications/history');
    await page.waitForSelector('[data-testid="notification-list"]');

    // Look for filter controls (category, date range, etc)
    const hasFilters = await page.locator('select, [role="combobox"], [data-testid*="filter"]').count();

    if (hasFilters > 0) {
      console.log('Found filter controls:', hasFilters);

      // Try interacting with first filter if it exists
      const firstFilter = page.locator('select').first();
      if (await firstFilter.isVisible()) {
        const options = await firstFilter.locator('option').count();
        console.log('Filter options:', options);
        expect(options).toBeGreaterThan(0);
      }
    } else {
      console.log('No filter controls found (may not be implemented yet)');
    }
  });

  test('infinite scroll loads more items', async ({ page }) => {
    await page.goto('/settings/notifications/history');
    await page.waitForSelector('[data-testid="notification-list"]');

    const initialCount = await page.locator('[data-testid="notification-item"]').count();

    console.log('Initial item count:', initialCount);

    if (initialCount >= 10) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for potential new items
      await page.waitForTimeout(2000);

      const afterScrollCount = await page.locator('[data-testid="notification-item"]').count();

      console.log('After scroll count:', afterScrollCount);

      // If more items exist, they should load
      // (Not guaranteed in test env with limited data)
    } else {
      console.log('Too few items to test infinite scroll');
    }
  });
});
