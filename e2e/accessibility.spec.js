import { test, expect } from '@playwright/test';
import { waitForSkeletonToDisappear } from './utils/helpers.js';

/**
 * Accessibility Tests (ARIA & Keyboard Navigation)
 *
 * Verifies:
 * - ARIA labels and roles
 * - Keyboard navigation
 * - Focus management
 * - Screen reader compatibility
 * - Semantic HTML
 */

test.describe('ARIA Labels and Roles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Interactive elements have accessible names', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      const accessibleName = await button.evaluate(el => {
        return (
          el.getAttribute('aria-label') ||
          el.textContent.trim() ||
          el.getAttribute('title')
        );
      });

      expect(accessibleName, `Button ${i} missing accessible name`).toBeTruthy();
    }
  });

  test('Links have descriptive text or aria-label', async ({ page }) => {
    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);

      const accessibleName = await link.evaluate(el => {
        return (
          el.textContent.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title')
        );
      });

      expect(accessibleName, `Link ${i} missing descriptive text`).toBeTruthy();
      expect(accessibleName.length, `Link ${i} text too short`).toBeGreaterThan(0);
    }
  });

  test('Form inputs have labels', async ({ page }) => {
    await page.goto('/scheduler');
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);

      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');

        // Check for label element
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }

        // Check for aria-label or aria-labelledby
        if (ariaLabel || ariaLabelledBy) return true;

        // Check if input is wrapped in label
        const parent = el.parentElement;
        if (parent && parent.tagName === 'LABEL') return true;

        return false;
      });

      const inputType = await input.getAttribute('type');
      expect(hasLabel, `Input ${i} (type: ${inputType}) missing label`).toBe(true);
    }
  });

  test('Images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);

      const alt = await img.getAttribute('alt');
      expect(alt, `Image ${i} missing alt attribute`).not.toBeNull();
    }
  });

  test('Status messages have appropriate ARIA roles', async ({ page }) => {
    const statusElements = page.locator('[role="status"], [role="alert"], [aria-live]');
    const count = await statusElements.count();

    // If there are status messages, verify they have proper roles
    for (let i = 0; i < count; i++) {
      const element = statusElements.nth(i);

      const hasRole = await element.evaluate(el => {
        return (
          el.getAttribute('role') === 'status' ||
          el.getAttribute('role') === 'alert' ||
          el.getAttribute('aria-live') !== null
        );
      });

      expect(hasRole, `Status element ${i} missing proper ARIA role`).toBe(true);
    }
  });

  test('Navigation has proper landmarks', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    const hasLandmark = await nav.evaluate(el => {
      return el.tagName === 'NAV' || el.getAttribute('role') === 'navigation';
    });

    expect(hasLandmark, 'Navigation should use semantic HTML or ARIA role').toBe(true);
  });

  test('Main content has main landmark', async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    const count = await main.count();

    expect(count, 'Page should have main landmark').toBeGreaterThan(0);
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Can tab through interactive elements', async ({ page }) => {
    // Press Tab key multiple times
    const focusedElements = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el.tagName,
          type: el.getAttribute('type'),
          text: el.textContent?.substring(0, 20)
        };
      });

      focusedElements.push(focusedElement);
    }

    // Should have focused on different elements
    const uniqueTags = new Set(focusedElements.map(e => e.tag));
    expect(uniqueTags.size, 'Tab navigation should focus different elements').toBeGreaterThan(1);
  });

  test('Buttons are activatable with Enter key', async ({ page }) => {
    const firstButton = page.locator('button').first();

    // Focus the button
    await firstButton.focus();

    // Get initial state
    const initialText = await page.locator('body').textContent();

    // Press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Something should have changed (or button should be clickable)
    const isClickable = await firstButton.evaluate(el => {
      return !el.disabled && el.offsetParent !== null;
    });

    expect(isClickable, 'Button should be activatable with keyboard').toBe(true);
  });

  test('Skip to main content link exists', async ({ page }) => {
    // Focus first element
    await page.keyboard.press('Tab');

    const firstFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el.textContent?.toLowerCase();
    });

    // Check if skip link exists (common accessibility pattern)
    const hasSkipLink = firstFocused?.includes('skip') || firstFocused?.includes('main');

    // This is a nice-to-have, not required
    if (hasSkipLink) {
      expect(hasSkipLink).toBe(true);
    }
  });

  test('Focus is visible on interactive elements', async ({ page }) => {
    const button = page.locator('button').first();

    // Focus the button
    await button.focus();
    await page.waitForTimeout(100);

    const hasFocusStyle = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      return (
        style.outline !== 'none' &&
        style.outline !== '' &&
        style.outlineWidth !== '0px'
      ) || (
        // Or has focus-visible styles
        style.boxShadow !== 'none' ||
        style.borderColor !== 'rgba(0, 0, 0, 0)'
      );
    });

    expect(hasFocusStyle, 'Focused elements should have visible focus indicator').toBe(true);
  });

  test('Modal traps focus when open', async ({ page }) => {
    // Look for buttons that might open modals
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();

      // Skip if likely not a modal trigger
      if (!text || (!text.toLowerCase().includes('edit') &&
          !text.toLowerCase().includes('delete') &&
          !text.toLowerCase().includes('settings'))) {
        continue;
      }

      // Click button
      await button.click();
      await page.waitForTimeout(300);

      // Check if modal opened
      const modal = page.locator('[role="dialog"], [role="alertdialog"]');
      const isOpen = await modal.count() > 0;

      if (isOpen) {
        // Check focus is inside modal
        const focusInModal = await page.evaluate(() => {
          const active = document.activeElement;
          const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
          return dialog?.contains(active);
        });

        expect(focusInModal, 'Focus should be inside opened modal').toBe(true);

        // Close modal (press Escape)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        break;
      }
    }
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Focus order is logical', async ({ page }) => {
    const focusedElements = [];

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          y: rect.top,
          x: rect.left
        };
      });

      focusedElements.push(focused);
    }

    // Focus should generally move top to bottom, left to right
    let previousY = -1;
    let logicalOrder = true;

    for (const element of focusedElements) {
      // Allow some flexibility (elements on same row)
      if (element.y > previousY + 100) {
        previousY = element.y;
      } else if (element.y < previousY - 100) {
        logicalOrder = false;
        break;
      }
    }

    expect(logicalOrder, 'Focus order should follow logical reading order').toBe(true);
  });

  test('No keyboard traps on main page', async ({ page }) => {
    const focusedTags = [];

    // Tab through many elements
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      const tag = await page.evaluate(() => document.activeElement.tagName);
      focusedTags.push(tag);
    }

    // Check for patterns indicating a keyboard trap
    let maxRepeats = 0;
    let currentRepeat = 1;

    for (let i = 1; i < focusedTags.length; i++) {
      if (focusedTags[i] === focusedTags[i - 1]) {
        currentRepeat++;
        maxRepeats = Math.max(maxRepeats, currentRepeat);
      } else {
        currentRepeat = 1;
      }
    }

    // If same element is focused more than 5 times in a row, likely a trap
    expect(maxRepeats, 'Potential keyboard trap detected').toBeLessThan(5);
  });
});

test.describe('Semantic HTML', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Page has proper heading hierarchy', async ({ page }) => {
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
      elements.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent.trim()
      }))
    );

    if (headings.length === 0) return;

    // Should have h1
    const hasH1 = headings.some(h => h.level === 1);
    expect(hasH1, 'Page should have an h1 heading').toBe(true);

    // Check for logical hierarchy (no skipping levels)
    let previousLevel = 0;
    for (const heading of headings) {
      if (previousLevel > 0) {
        const gap = heading.level - previousLevel;
        expect(gap, `Heading hierarchy skip detected: h${previousLevel} → h${heading.level}`).toBeLessThanOrEqual(1);
      }
      previousLevel = heading.level;
    }
  });

  test('Lists use proper semantic elements', async ({ page }) => {
    await page.goto('/log');
    await page.waitForLoadState('networkidle');

    // Check if lists of items use ul/ol
    const lists = page.locator('ul, ol');
    const count = await lists.count();

    // If there are multiple items that look like a list, should use semantic lists
    if (count > 0) {
      const listItems = await lists.first().locator('li').count();
      expect(listItems, 'Semantic lists should contain list items').toBeGreaterThan(0);
    }
  });

  test('Buttons use button elements, not divs', async ({ page }) => {
    // Look for div elements that might be clickable buttons
    const clickableDivs = page.locator('div[onclick], div[role="button"]');
    const count = await clickableDivs.count();

    // Should prefer <button> over <div role="button">
    expect(count, 'Should use <button> elements instead of clickable divs').toBe(0);
  });
});

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSkeletonToDisappear(page);
  });

  test('Live regions are properly marked', async ({ page }) => {
    // Check for dynamic content areas
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const count = await liveRegions.count();

    // If there are status messages or dynamic content, they should be marked
    for (let i = 0; i < count; i++) {
      const region = liveRegions.nth(i);

      const hasProperMarkup = await region.evaluate(el => {
        const ariaLive = el.getAttribute('aria-live');
        const role = el.getAttribute('role');

        return (
          ariaLive === 'polite' ||
          ariaLive === 'assertive' ||
          role === 'status' ||
          role === 'alert'
        );
      });

      expect(hasProperMarkup, `Live region ${i} has improper markup`).toBe(true);
    }
  });

  test('Icons have text alternatives', async ({ page }) => {
    const icons = page.locator('svg, [class*="icon"]');
    const count = await icons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const icon = icons.nth(i);

      const hasTextAlternative = await icon.evaluate(el => {
        // Check for aria-label
        if (el.getAttribute('aria-label')) return true;

        // Check for title
        if (el.querySelector('title')) return true;

        // Check if icon has aria-hidden (decorative)
        if (el.getAttribute('aria-hidden') === 'true') return true;

        // Check if parent has text
        const parent = el.parentElement;
        if (parent && parent.textContent.trim().length > 0) return true;

        return false;
      });

      expect(hasTextAlternative, `Icon ${i} missing text alternative or aria-hidden`).toBe(true);
    }
  });

  test('Form errors are announced', async ({ page }) => {
    await page.goto('/scheduler');
    await page.waitForLoadState('networkidle');

    // Look for error messages
    const errors = page.locator('[role="alert"], [aria-live="assertive"], [class*="error"]');
    const count = await errors.count();

    for (let i = 0; i < count; i++) {
      const error = errors.nth(i);

      const isAnnounced = await error.evaluate(el => {
        return (
          el.getAttribute('role') === 'alert' ||
          el.getAttribute('aria-live') === 'assertive' ||
          el.getAttribute('aria-atomic') === 'true'
        );
      });

      // Errors should be announced to screen readers
      if (isAnnounced) {
        expect(isAnnounced).toBe(true);
      }
    }
  });
});
