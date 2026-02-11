/**
 * Install Prompt Service
 *
 * Pure utility functions for managing PWA install prompt behavior:
 * - Visit counting (show prompt after 2+ visits)
 * - Dismissal tracking (30-day cooldown)
 * - iOS device detection
 * - Standalone mode detection
 *
 * All functions handle SSR safety and localStorage errors gracefully.
 */

const VISIT_COUNT_KEY = 'pwa-visit-count';
const DISMISS_KEY = 'pwa-prompt-dismissed';
const DISMISS_DAYS = 30;

/**
 * Check if localStorage is available
 * Returns false in SSR or private browsing mode
 */
export function canUseLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current visit count
 * Returns 0 if localStorage unavailable or count not set
 */
export function getVisitCount(): number {
  if (!canUseLocalStorage()) {
    return 0;
  }

  try {
    const count = window.localStorage.getItem(VISIT_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Increment visit count and return new count
 * Returns 0 if localStorage unavailable
 */
export function incrementVisitCount(): number {
  if (!canUseLocalStorage()) {
    return 0;
  }

  try {
    const currentCount = getVisitCount();
    const newCount = currentCount + 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, newCount.toString());
    return newCount;
  } catch {
    return 0;
  }
}

/**
 * Check if install prompt was dismissed within last 30 days
 * Returns false if localStorage unavailable or never dismissed
 */
export function isDismissed(): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    const dismissedAt = window.localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) {
      return false;
    }

    const dismissedTimestamp = parseInt(dismissedAt, 10);
    const now = Date.now();
    const daysSinceDismissal = (now - dismissedTimestamp) / (1000 * 60 * 60 * 24);

    return daysSinceDismissal < DISMISS_DAYS;
  } catch {
    return false;
  }
}

/**
 * Store current timestamp as dismissal time
 * Sets 30-day cooldown period
 */
export function dismissPrompt(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(DISMISS_KEY, Date.now().toString());
  } catch {
    // Silently fail if localStorage unavailable
  }
}

/**
 * Detect if running on iOS device
 * Checks for iPhone, iPad, iPod in userAgent
 * Note: iPadOS 13+ reports as Macintosh, so also check for touch capability
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipod|ipad/.test(userAgent);

  // iPadOS 13+ masquerades as macOS, check for touch
  const isIPadOS = /macintosh/.test(userAgent) && 'ontouchend' in document;

  return isIOS || isIPadOS;
}

/**
 * Check if app is already installed (running in standalone mode)
 * Uses display-mode media query or navigator.standalone (iOS)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check display-mode media query (most browsers)
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

  // Check navigator.standalone (iOS Safari)
  const isIOSStandalone = 'standalone' in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;

  return isStandaloneMode || isIOSStandalone;
}
