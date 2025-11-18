/**
 * Utility functions for color contrast testing (WCAG AA compliance)
 *
 * WCAG AA requirements:
 * - Normal text: minimum 4.5:1 contrast ratio
 * - Large text (18pt+ or 14pt+ bold): minimum 3:1 contrast ratio
 */

/**
 * Convert RGB to relative luminance
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} Relative luminance (0-1)
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const channel = c / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - RGB color string "rgb(r, g, b)"
 * @param {string} color2 - RGB color string "rgb(r, g, b)"
 * @returns {number} Contrast ratio (1-21)
 */
export function getContrastRatio(color1, color2) {
  const rgb1 = parseRgb(color1);
  const rgb2 = parseRgb(color2);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse RGB color string to object
 * @param {string} color - RGB color string "rgb(r, g, b)" or "rgba(r, g, b, a)"
 * @returns {{r: number, g: number, b: number}}
 */
function parseRgb(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    throw new Error(`Invalid RGB color: ${color}`);
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10)
  };
}

/**
 * Check if contrast ratio meets WCAG AA for normal text
 * @param {number} ratio - Contrast ratio
 * @returns {boolean}
 */
export function meetsWCAG_AA_NormalText(ratio) {
  return ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AA for large text
 * @param {number} ratio - Contrast ratio
 * @returns {boolean}
 */
export function meetsWCAG_AA_LargeText(ratio) {
  return ratio >= 3.0;
}

/**
 * Get element's computed color and background color
 * @param {import('@playwright/test').Locator} element - Playwright locator
 * @returns {Promise<{color: string, backgroundColor: string}>}
 */
export async function getElementColors(element) {
  const color = await element.evaluate(el => {
    return window.getComputedStyle(el).color;
  });

  const backgroundColor = await element.evaluate(el => {
    // Walk up the DOM tree to find first non-transparent background
    let current = el;
    let bg = window.getComputedStyle(current).backgroundColor;

    while (bg === 'rgba(0, 0, 0, 0)' && current.parentElement) {
      current = current.parentElement;
      bg = window.getComputedStyle(current).backgroundColor;
    }

    // If still transparent, default to white
    if (bg === 'rgba(0, 0, 0, 0)') {
      bg = 'rgb(255, 255, 255)';
    }

    return bg;
  });

  return { color, backgroundColor };
}

/**
 * Test element's contrast ratio
 * @param {import('@playwright/test').Locator} element - Playwright locator
 * @param {Object} options - Options
 * @param {boolean} options.isLargeText - Whether element contains large text
 * @returns {Promise<{ratio: number, passes: boolean, color: string, backgroundColor: string}>}
 */
export async function testElementContrast(element, { isLargeText = false } = {}) {
  const { color, backgroundColor } = await getElementColors(element);
  const ratio = getContrastRatio(color, backgroundColor);
  const passes = isLargeText
    ? meetsWCAG_AA_LargeText(ratio)
    : meetsWCAG_AA_NormalText(ratio);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes,
    color,
    backgroundColor
  };
}
