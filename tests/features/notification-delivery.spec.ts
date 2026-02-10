import { test, expect } from '@playwright/test';

/**
 * Notification Delivery E2E Tests
 *
 * These tests validate the notification settings UI is accessible and functional.
 * They do NOT test actual FCM delivery (requires service worker and device permissions).
 *
 * The notification page contains:
 * - Permission status display
 * - Notification preference toggles
 * - Test notification buttons (single device / all devices)
 * - Device registration list
 * - Links to history, device management, debug logs
 */

test.describe('Notification Delivery Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to notification settings page
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should display notification settings page', async ({ page }) => {
    // Verify the page loads with notification settings content
    // The page title is "Stato Notifiche" (Notification Status)
    const heading = page.getByRole('heading', { name: /stato notifiche|notifiche/i });
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show device registration section', async ({ page }) => {
    // The page always shows "Dispositivi Registrati" heading
    const devicesHeading = page.getByRole('heading', { name: /dispositivi registrati/i });
    await expect(devicesHeading).toBeVisible({ timeout: 15000 });
  });

  test('should display device registration info or call-to-action', async ({ page }) => {
    // The notification page shows either:
    // - Device list with badges (if devices registered)
    // - Warning banner + registration button (if no devices)

    // Look for device-related text
    const deviceText = page.getByText(/dispositivo|registrat|nessun/i);

    // Some device-related text should be present
    await expect(deviceText.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have test notification capability', async ({ page }) => {
    // Look for test notification buttons
    // There are two buttons:
    // 1. "Test Questo Dispositivo" (may be disabled if device not registered)
    // 2. "Test Tutti i Dispositivi (N)" (disabled if no devices)

    const testButton = page.getByRole('button', { name: /test.*dispositiv/i });

    // At least one test button should be visible
    await expect(testButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display notification history link', async ({ page }) => {
    // The page has a card linking to notification history
    const historyLink = page.getByText(/cronologia notifiche/i);
    await expect(historyLink).toBeVisible({ timeout: 10000 });

    // Should have an "Apri" button to navigate to history
    const openButton = page.getByRole('button', { name: /apri/i }).first();
    await expect(openButton).toBeVisible();
  });

  test('should display iOS information section', async ({ page }) => {
    // The page has an info card for iOS users
    const iosInfo = page.getByText(/note per ios/i);
    await expect(iosInfo).toBeVisible({ timeout: 10000 });

    // Should mention PWA requirement
    const pwaInfo = page.getByText(/pwa/i);
    await expect(pwaInfo.first()).toBeVisible();
  });

  test('should display device management link', async ({ page }) => {
    // The page has a card linking to device management
    const deviceManagementLink = page.getByText(/gestione dispositivi/i);
    await expect(deviceManagementLink).toBeVisible({ timeout: 10000 });

    // Should mention rename/remove functionality
    const managementInfo = page.getByText(/rinomina o rimuovi/i);
    await expect(managementInfo).toBeVisible();
  });

  // NOTE: We do NOT click the test notification button because:
  // 1. FCM requires service worker registration (not available in Playwright by default)
  // 2. Push notifications require real device permissions
  // 3. The client-side flow is better verified by unit tests
  // This E2E test validates the UI is accessible and functional
});
