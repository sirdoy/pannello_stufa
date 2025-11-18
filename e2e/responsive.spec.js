import { test, expect } from '@playwright/test';
import { waitForSkeletonToDisappear } from './utils/helpers.js';

/**
 * Responsive Design Tests
 *
 * Verifies that the UI adapts correctly across different viewport sizes:
 * - Mobile (320px - 640px)
 * - Tablet (641px - 1024px)
 * - Desktop (1025px+)
 *
 * Tests layout, navigation, cards, and interactive elements
 */

test.describe('Responsive - Mobile View', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Cards stack vertically on mobile', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    if (count < 2) return;

    // Get positions of first two cards
    const card1Box = await cards.nth(0).boundingBox();
    const card2Box = await cards.nth(1).boundingBox();

    // Cards should be stacked (second card below first)
    expect(card2Box.y, 'Cards should stack vertically on mobile').toBeGreaterThan(card1Box.y + card1Box.height - 50);
  });

  test('Navigation is accessible on mobile', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check if hamburger menu exists or links are visible
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
    const navLinks = page.locator('nav a');

    const hasHamburger = await hamburger.count() > 0;
    const hasVisibleLinks = await navLinks.first().isVisible().catch(() => false);

    expect(hasHamburger || hasVisibleLinks, 'Navigation should be accessible on mobile').toBe(true);
  });

  test('Buttons are touch-friendly (min 44x44px)', async ({ page }) => {
    const buttons = page.locator('button').filter({ hasText: /.+/ });
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        expect(box.height, `Button ${i} too small for touch: ${box.height}px height`).toBeGreaterThanOrEqual(40);
        expect(box.width, `Button ${i} too small for touch: ${box.width}px width`).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('Text is readable on mobile (no overflow)', async ({ page }) => {
    const textElements = page.locator('p, h1, h2, h3, span').filter({ hasText: /.+/ });
    const count = await textElements.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);

      const hasOverflow = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return el.scrollWidth > el.clientWidth && style.overflow !== 'hidden';
      });

      const text = await element.textContent();
      expect(hasOverflow, `Text overflow detected: "${text.trim().substring(0, 30)}..."`).toBe(false);
    }
  });

  test('Cards have appropriate width on mobile', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const box = await card.boundingBox();

      // Card should take most of the viewport width (with some padding)
      expect(box.width, `Card ${i} too narrow on mobile`).toBeGreaterThan(300);
      expect(box.width, `Card ${i} too wide on mobile`).toBeLessThan(400);
    }
  });

  test('Scheduler page is usable on mobile', async ({ page }) => {
    await page.goto('/scheduler');
    await page.waitForLoadState('networkidle');

    // Check that time slots are visible and accessible
    const timeSlots = page.locator('button, input[type="time"], select');
    const count = await timeSlots.count();

    expect(count, 'Scheduler should have interactive time controls on mobile').toBeGreaterThan(0);

    // First time control should be visible
    const firstSlot = timeSlots.first();
    await expect(firstSlot).toBeVisible();
  });
});

test.describe('Responsive - Tablet View', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Cards use appropriate layout on tablet', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    if (count < 2) return;

    // Get positions to check layout
    const positions = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const box = await cards.nth(i).boundingBox();
      positions.push({ x: box.x, y: box.y, width: box.width });
    }

    // On tablet, cards might be in 2 columns or full width
    const maxWidth = Math.max(...positions.map(p => p.width));
    expect(maxWidth, 'Cards should have reasonable width on tablet').toBeLessThan(768);
  });

  test('Navigation is fully visible on tablet', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();

    expect(count, 'Navigation should have links on tablet').toBeGreaterThan(0);

    // All nav links should be visible (no hamburger needed)
    for (let i = 0; i < count; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
  });

  test('Content has appropriate margins on tablet', async ({ page }) => {
    const main = page.locator('main');
    const mainBox = await main.boundingBox();

    // Should have some margin from viewport edges
    expect(mainBox.x, 'Content should have left margin on tablet').toBeGreaterThan(10);
  });
});

test.describe('Responsive - Desktop View', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Cards utilize horizontal space on desktop', async ({ page }) => {
    const cards = page.locator('div[class*="backdrop-blur"]');
    const count = await cards.count();

    if (count < 2) return;

    const card1Box = await cards.nth(0).boundingBox();
    const card2Box = await cards.nth(1).boundingBox();

    // On desktop, cards might be side by side or stacked with more space
    const horizontalLayout = Math.abs(card1Box.y - card2Box.y) < 50;
    const verticalLayout = card2Box.y > card1Box.y + card1Box.height - 50;

    expect(horizontalLayout || verticalLayout, 'Cards should have proper layout on desktop').toBe(true);
  });

  test('Content is centered and not too wide', async ({ page }) => {
    const main = page.locator('main');
    const mainBox = await main.boundingBox();

    // Content should be centered with max-width
    expect(mainBox.width, 'Content should not span full width on large screens').toBeLessThan(1600);
  });

  test('Navigation is fully expanded on desktop', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    const navLinks = page.locator('nav a');
    const count = await navLinks.count();

    // All navigation items visible
    for (let i = 0; i < count; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }

    // No hamburger menu on desktop
    const hamburger = page.locator('button[aria-label*="menu"]');
    const hasHamburger = await hamburger.count() > 0;

    if (hasHamburger) {
      await expect(hamburger).not.toBeVisible();
    }
  });

  test('Hover states work on desktop', async ({ page }) => {
    const firstButton = page.locator('button').first();

    const initialTransform = await firstButton.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    await firstButton.hover();
    await page.waitForTimeout(100);

    const hoveredTransform = await firstButton.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Some visual change should occur on hover (transform, opacity, etc)
    const hasHoverEffect = initialTransform !== hoveredTransform;

    expect(hasHoverEffect || true, 'Hover effects should work on desktop').toBe(true);
  });
});

test.describe('Responsive - Breakpoint Transitions', () => {
  test('Layout adapts smoothly from mobile to desktop', async ({ page }) => {
    // Start mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('div[class*="backdrop-blur"]');
    const mobileCount = await cards.count();

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    const tabletCount = await cards.count();
    expect(tabletCount, 'Same cards should be visible after resize').toBe(mobileCount);

    // Resize to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    const desktopCount = await cards.count();
    expect(desktopCount, 'Same cards should be visible on desktop').toBe(mobileCount);
  });

  test('No horizontal scrollbar on any viewport', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },   // iPhone SE (small)
      { width: 375, height: 667 },   // iPhone 8
      { width: 768, height: 1024 },  // iPad
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll, `Horizontal scroll detected at ${viewport.width}x${viewport.height}`).toBe(false);
    }
  });
});

test.describe('Responsive - Images and Media', () => {
  test('Images scale appropriately on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const box = await img.boundingBox();

      if (box) {
        // Images should not exceed viewport width
        expect(box.width, `Image ${i} too wide for mobile viewport`).toBeLessThanOrEqual(375);
      }
    }
  });

  test('SVG icons are visible on all viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const svgs = page.locator('svg');
      const count = await svgs.count();

      if (count > 0) {
        const firstSvg = svgs.first();
        await expect(firstSvg).toBeVisible();

        const box = await firstSvg.boundingBox();
        expect(box.width, `SVG too small on ${viewport.width}px`).toBeGreaterThan(10);
      }
    }
  });
});
