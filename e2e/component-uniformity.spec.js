import { test, expect } from '@playwright/test';

/**
 * Component Uniformity Tests
 *
 * Verifies consistent usage and styling of UI components:
 * - Button variants and styles
 * - Card liquid glass effect
 * - Banner styles and colors
 * - Spacing and typography consistency
 */

test.describe('Button Component Uniformity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for skeleton to disappear (content loaded)
    await page.waitForSelector('.animate-shimmer', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('All buttons have consistent border radius', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();

    const borderRadii = new Set();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const borderRadius = await button.evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      borderRadii.add(borderRadius);
    }

    // Should have at most 2-3 variations (normal, small, large)
    expect(borderRadii.size, `Too many border radius variations: ${Array.from(borderRadii).join(', ')}`).toBeLessThanOrEqual(3);
  });

  test('All buttons have consistent padding', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();

    const paddings = new Map();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();

      // Skip icon-only buttons
      if (!text || text.trim() === '') continue;

      const padding = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
      });

      paddings.set(padding, (paddings.get(padding) || 0) + 1);
    }

    // Should have consistent padding patterns
    expect(paddings.size, `Too many padding variations: ${Array.from(paddings.keys()).join('; ')}`).toBeLessThanOrEqual(4);
  });

  test('Primary buttons have consistent styling', async ({ page }) => {
    const primaryButtons = page.locator('button[class*="primary"], button[class*="bg-gradient"]');
    const count = await primaryButtons.count();

    if (count === 0) return; // Skip if no primary buttons

    const styles = [];

    for (let i = 0; i < count; i++) {
      const button = primaryButtons.nth(i);
      const style = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          color: computed.color,
          fontWeight: computed.fontWeight
        };
      });
      styles.push(style);
    }

    // All primary buttons should have similar styling
    const firstStyle = styles[0];
    styles.forEach((style, index) => {
      expect(style.color, `Primary button ${index} has different text color`).toBe(firstStyle.color);
    });
  });

  test('Buttons have hover states', async ({ page }) => {
    const buttons = page.locator('button').first();

    // Get initial state
    const initialState = await buttons.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        background: style.backgroundColor,
        transform: style.transform
      };
    });

    // Hover
    await buttons.hover();
    await page.waitForTimeout(200);

    const hoveredState = await buttons.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        background: style.backgroundColor,
        transform: style.transform
      };
    });

    // Should have visual feedback (background change or transform)
    const hasVisualFeedback =
      hoveredState.background !== initialState.background ||
      hoveredState.transform !== initialState.transform;

    expect(hasVisualFeedback, 'Buttons should have hover states').toBe(true);
  });
});

test.describe('Card Component Uniformity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for skeleton to disappear (content loaded)
    await page.waitForSelector('.animate-shimmer', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('All cards have liquid glass effect', async ({ page }) => {
    // Look for elements with backdrop-blur (liquid glass effect)
    const cards = page.locator('div[class*="backdrop-blur"]').filter({
      has: page.locator('h2, h3')
    });
    const count = await cards.count();

    expect(count, 'Should have liquid glass cards on homepage').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasGlassEffect = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        const backdrop = style.backdropFilter || style.webkitBackdropFilter;
        const background = style.background;

        return (
          backdrop.includes('blur') &&
          (background.includes('rgba') || background.includes('hsla'))
        );
      });

      expect(hasGlassEffect, `Card ${i} missing liquid glass effect`).toBe(true);
    }
  });

  test('Cards have consistent border radius', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"], [class*="card"]');
    const count = await cards.count();

    const borderRadii = new Set();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const borderRadius = await card.evaluate(el =>
        window.getComputedStyle(el).borderRadius
      );
      borderRadii.add(borderRadius);
    }

    // All cards should have same border radius
    expect(borderRadii.size, `Cards have inconsistent border radius: ${Array.from(borderRadii).join(', ')}`).toBeLessThanOrEqual(2);
  });

  test('Cards have consistent padding', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]').filter({ has: page.locator('h2, h3') });
    const count = await cards.count();

    const paddings = new Set();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const padding = await card.evaluate(el =>
        window.getComputedStyle(el).padding
      );
      paddings.add(padding);
    }

    // Should have consistent padding
    expect(paddings.size, `Cards have inconsistent padding: ${Array.from(paddings).join('; ')}`).toBeLessThanOrEqual(2);
  });

  test('Cards have subtle shadows or borders', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const hasShadowOrBorder = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return (
          style.boxShadow !== 'none' ||
          style.border !== '' ||
          style.borderWidth !== '0px'
        );
      });

      expect(hasShadowOrBorder, `Card ${i} missing shadow or border`).toBe(true);
    }
  });
});

test.describe('Banner Component Uniformity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for skeleton to disappear (content loaded)
    await page.waitForSelector('.animate-shimmer', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('Banners have consistent structure', async ({ page }) => {
    const banners = page.locator('[class*="banner"], [role="alert"]');
    const count = await banners.count();

    if (count === 0) return; // Skip if no banners

    for (let i = 0; i < count; i++) {
      const banner = banners.nth(i);

      // Check for icon or emoji
      const hasIcon = await banner.locator('svg, [class*="icon"], span').first().count() > 0;

      // Check for text content
      const hasText = (await banner.textContent()).trim().length > 0;

      expect(hasIcon || hasText, `Banner ${i} should have icon or text`).toBe(true);
    }
  });

  test('Warning banners have distinct styling', async ({ page }) => {
    const warningBanners = page.locator('[class*="warning"], [class*="yellow"]');
    const count = await warningBanners.count();

    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const banner = warningBanners.nth(i);

      const hasWarningColor = await banner.evaluate(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;

        // Should contain yellow/orange tones
        return (
          bg.includes('255, 193') || // yellow-100
          bg.includes('254, 243') || // yellow-50
          color.includes('180, 83') || // yellow-800
          color.includes('161, 98')    // yellow-700
        );
      });

      expect(hasWarningColor, `Warning banner ${i} missing warning colors`).toBe(true);
    }
  });

  test('Error banners have distinct styling', async ({ page }) => {
    await page.goto('/errors');
    await page.waitForLoadState('networkidle');

    const errorBanners = page.locator('[class*="error"], [class*="danger"], [class*="red"]');
    const count = await errorBanners.count();

    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const banner = errorBanners.nth(i);

      const hasErrorColor = await banner.evaluate(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;

        // Parse RGB values
        const bgMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

        // Check if background or text has red tones (R > 200 and R > G and R > B)
        if (bgMatch) {
          const [, r, g, b] = bgMatch.map(Number);
          if (r > 200 && r > g && r > b) return true;
        }

        if (colorMatch) {
          const [, r, g, b] = colorMatch.map(Number);
          if (r > 100 && r > g * 1.5 && r > b * 1.5) return true;
        }

        return false;
      });

      expect(hasErrorColor, `Error banner ${i} missing error colors`).toBe(true);
    }
  });
});

test.describe('Typography Uniformity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for skeleton to disappear (content loaded)
    await page.waitForSelector('.animate-shimmer', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('Headings have consistent font family', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();

    const fontFamilies = new Set();

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const fontFamily = await heading.evaluate(el =>
        window.getComputedStyle(el).fontFamily
      );
      fontFamilies.add(fontFamily);
    }

    // All headings should use same font family
    expect(fontFamilies.size, `Headings have inconsistent fonts: ${Array.from(fontFamilies).join('; ')}`).toBe(1);
  });

  test('Body text has consistent font size', async ({ page }) => {
    const paragraphs = page.locator('p');
    const count = await paragraphs.count();

    const fontSizes = new Set();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const p = paragraphs.nth(i);
      const fontSize = await p.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      fontSizes.add(fontSize);
    }

    // Should have 1-2 standard sizes for body text
    expect(fontSizes.size, `Body text has too many font sizes: ${Array.from(fontSizes).join(', ')}`).toBeLessThanOrEqual(2);
  });

  test('Line heights are consistent', async ({ page }) => {
    const textElements = page.locator('p, span, div').filter({ hasText: /.+/ });
    const count = await textElements.count();

    const lineHeights = new Set();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);
      const lineHeight = await element.evaluate(el =>
        window.getComputedStyle(el).lineHeight
      );
      lineHeights.add(lineHeight);
    }

    // Should have consistent line heights
    expect(lineHeights.size, `Too many line height variations: ${Array.from(lineHeights).join(', ')}`).toBeLessThanOrEqual(4);
  });
});

test.describe('Spacing Uniformity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for skeleton to disappear (content loaded)
    await page.waitForSelector('.animate-shimmer', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('Cards have consistent spacing between each other', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    if (count < 2) return;

    const gaps = [];

    for (let i = 0; i < count - 1; i++) {
      const card1 = cards.nth(i);
      const card2 = cards.nth(i + 1);

      const box1 = await card1.boundingBox();
      const box2 = await card2.boundingBox();

      if (box1 && box2) {
        const gap = Math.abs(box2.y - (box1.y + box1.height));
        if (gap < 100) { // Only consider vertical gaps
          gaps.push(Math.round(gap));
        }
      }
    }

    if (gaps.length > 0) {
      const uniqueGaps = new Set(gaps);
      expect(uniqueGaps.size, `Inconsistent gaps between cards: ${Array.from(uniqueGaps).join(', ')}px`).toBeLessThanOrEqual(2);
    }
  });

  test('Sections have consistent padding', async ({ page }) => {
    const sections = page.locator('section, main > div');
    const count = await sections.count();

    const paddings = new Set();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const section = sections.nth(i);
      const padding = await section.evaluate(el =>
        window.getComputedStyle(el).padding
      );
      if (padding !== '0px') {
        paddings.add(padding);
      }
    }

    // Should have consistent section padding
    expect(paddings.size, `Sections have inconsistent padding: ${Array.from(paddings).join('; ')}`).toBeLessThanOrEqual(3);
  });
});
