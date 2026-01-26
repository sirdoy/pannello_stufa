import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Notification History Page
 *
 * Encapsulates selectors and actions for /settings/notifications/history page.
 * Uses data-testid attributes for stable selectors.
 */
export class NotificationHistory {
  readonly page: Page;

  // Locators
  readonly historyFilter: Locator;
  readonly notificationList: Locator;
  readonly notificationItems: Locator;
  readonly loadMoreTrigger: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using data-testid
    this.historyFilter = page.locator('[data-testid="history-filter"]');
    this.notificationList = page.locator('[data-testid="notification-list"]');
    this.notificationItems = page.locator('[data-testid="notification-item"]');
    this.loadMoreTrigger = page.locator('[data-testid="load-more"]');
  }

  /**
   * Navigate to notification history page
   */
  async goto() {
    await this.page.goto('/settings/notifications/history');
  }

  /**
   * Select a filter (all, error, scheduler, maintenance, etc.)
   */
  async selectFilter(filter: string) {
    await this.historyFilter.selectOption(filter);
  }

  /**
   * Get count of visible notification items
   */
  async getNotificationCount(): Promise<number> {
    return await this.notificationItems.count();
  }

  /**
   * Scroll to load more notifications (infinite scroll)
   */
  async scrollToLoadMore() {
    await this.loadMoreTrigger.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for notification list to be visible
   */
  async waitForList() {
    await this.notificationList.waitFor({ state: 'visible' });
  }

  /**
   * Get notification item by index
   */
  getNotificationItem(index: number): Locator {
    return this.notificationItems.nth(index);
  }
}
