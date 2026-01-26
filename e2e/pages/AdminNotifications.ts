import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Admin Notifications Test Panel
 *
 * Encapsulates selectors and actions for /debug/notifications/test page.
 * Uses data-testid attributes for stable selectors.
 */
export class AdminNotifications {
  readonly page: Page;

  // Locators
  readonly templateDropdown: Locator;
  readonly deviceSelector: Locator;
  readonly prioritySelector: Locator;
  readonly sendButton: Locator;
  readonly deliveryStatus: Locator;
  readonly targetAllRadio: Locator;
  readonly targetSpecificRadio: Locator;
  readonly customTitleInput: Locator;
  readonly customBodyTextarea: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using data-testid
    this.templateDropdown = page.locator('[data-testid="test-template"]');
    this.deviceSelector = page.locator('[data-testid="device-selector"]');
    this.prioritySelector = page.locator('[data-testid="priority-selector"]');
    this.sendButton = page.locator('[data-testid="send-test-notification"]');
    this.deliveryStatus = page.locator('[data-testid="delivery-status"]');
    this.targetAllRadio = page.locator('[data-testid="target-all"]');
    this.targetSpecificRadio = page.locator('[data-testid="target-specific"]');
    this.customTitleInput = page.locator('[data-testid="custom-title"]');
    this.customBodyTextarea = page.locator('[data-testid="custom-body"]');
  }

  /**
   * Navigate to admin notifications test page
   */
  async goto() {
    await this.page.goto('/debug/notifications/test');
  }

  /**
   * Select a notification template
   */
  async selectTemplate(template: 'error_alert' | 'scheduler_success' | 'maintenance_reminder') {
    await this.templateDropdown.selectOption(template);
  }

  /**
   * Select a specific device
   */
  async selectDevice(deviceName: string) {
    await this.deviceSelector.selectOption(deviceName);
  }

  /**
   * Select notification priority
   */
  async selectPriority(priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW') {
    await this.prioritySelector.selectOption(priority);
  }

  /**
   * Send test notification and wait for delivery result
   */
  async sendTestNotification() {
    await this.sendButton.click();
  }

  /**
   * Get delivery result text
   */
  async getDeliveryResult(): Promise<string> {
    await this.deliveryStatus.waitFor({ state: 'visible', timeout: 10000 });
    return (await this.deliveryStatus.textContent()) || '';
  }

  /**
   * Select target mode (all devices or specific device)
   */
  async selectTargetAll() {
    await this.targetAllRadio.check();
  }

  async selectTargetSpecific() {
    await this.targetSpecificRadio.check();
  }

  /**
   * Enter custom notification content
   */
  async enterCustomContent(title: string, body: string) {
    await this.customTitleInput.fill(title);
    await this.customBodyTextarea.fill(body);
  }
}
