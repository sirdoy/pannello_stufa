/**
 * Test Helper Functions
 *
 * Reusable utilities for Playwright tests
 */

/**
 * Wait for skeleton loading to complete
 * Ensures content is fully loaded before running tests
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Maximum wait time in ms (default: 10000)
 */
export async function waitForSkeletonToDisappear(page, timeout = 10000) {
  try {
    // Wait for skeleton shimmer animation to disappear
    await page.waitForSelector('.animate-shimmer', {
      state: 'hidden',
      timeout
    });
  } catch (error) {
    // If skeleton never appeared or disappeared too fast, that's okay
    // Just ensure network is idle
    await page.waitForLoadState('networkidle').catch(() => {});
  }
}

/**
 * Wait for page to be fully loaded (network idle + skeleton gone)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForFullPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await waitForSkeletonToDisappear(page);
}

/**
 * Navigate to a page and wait for full load
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} url - URL to navigate to
 */
export async function gotoAndWait(page, url) {
  await page.goto(url);
  await waitForFullPageLoad(page);
}

/**
 * Check if an element is visible with timeout
 *
 * @param {import('@playwright/test').Locator} locator - Element locator
 * @param {number} timeout - Timeout in ms (default: 5000)
 * @returns {Promise<boolean>} - True if visible, false otherwise
 */
export async function isVisible(locator, timeout = 5000) {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get computed style property of an element
 *
 * @param {import('@playwright/test').Locator} locator - Element locator
 * @param {string} property - CSS property name
 * @returns {Promise<string>} - Computed style value
 */
export async function getComputedStyle(locator, property) {
  return await locator.evaluate((el, prop) => {
    return window.getComputedStyle(el)[prop];
  }, property);
}

/**
 * Check if element has specific class
 *
 * @param {import('@playwright/test').Locator} locator - Element locator
 * @param {string} className - Class name to check (can be partial match)
 * @returns {Promise<boolean>} - True if class exists
 */
export async function hasClass(locator, className) {
  const classes = await locator.getAttribute('class');
  return classes ? classes.includes(className) : false;
}
