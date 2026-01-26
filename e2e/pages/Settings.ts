import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Notification Settings Page
 *
 * Encapsulates selectors and actions for notification settings page.
 * Handles preference toggles, DND hours, and other notification settings.
 */
export class Settings {
  readonly page: Page;

  // Category toggles
  readonly alertsToggle: Locator;
  readonly systemToggle: Locator;
  readonly routineToggle: Locator;

  // DND settings
  readonly dndEnabled: Locator;
  readonly dndStartTime: Locator;
  readonly dndEndTime: Locator;

  // Save button
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators (using common form patterns)
    // Actual data-testid attributes will be added in Task 3 if needed
    this.alertsToggle = page.locator('[name="categories.alerts"]');
    this.systemToggle = page.locator('[name="categories.system"]');
    this.routineToggle = page.locator('[name="categories.routine"]');

    this.dndEnabled = page.locator('[name="dndHours.enabled"]');
    this.dndStartTime = page.locator('[name="dndHours.start"]');
    this.dndEndTime = page.locator('[name="dndHours.end"]');

    this.saveButton = page.locator('button[type="submit"]');
  }

  /**
   * Navigate to notification settings page
   */
  async goto() {
    await this.page.goto('/settings/notifications');
  }

  /**
   * Toggle a category on/off
   */
  async toggleCategory(category: 'alerts' | 'system' | 'routine', enabled: boolean) {
    const toggle = category === 'alerts' ? this.alertsToggle
      : category === 'system' ? this.systemToggle
      : this.routineToggle;

    const isChecked = await toggle.isChecked();
    if (isChecked !== enabled) {
      await toggle.click();
    }
  }

  /**
   * Enable/disable DND hours
   */
  async toggleDND(enabled: boolean) {
    const isChecked = await this.dndEnabled.isChecked();
    if (isChecked !== enabled) {
      await this.dndEnabled.click();
    }
  }

  /**
   * Set DND hours
   */
  async setDNDHours(start: string, end: string) {
    await this.dndStartTime.fill(start);
    await this.dndEndTime.fill(end);
  }

  /**
   * Save settings
   */
  async save() {
    await this.saveButton.click();
  }
}
