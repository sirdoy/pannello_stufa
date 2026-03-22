/**
 * Analytics Consent Service
 *
 * GDPR-compliant consent management using localStorage.
 * Provides consent state read/write and tracking permission checks.
 *
 * IMPORTANT:
 * - Client-side only (uses localStorage)
 * - SSR-safe (returns 'unknown' when window is undefined)
 * - Consent enforcement is a CALLER responsibility:
 *   - Client code checks canTrackAnalytics() before calling APIs
 *   - API routes check X-Analytics-Consent header
 *   - Scheduler logs unconditionally (server-initiated events)
 *
 * Storage keys:
 * - analytics_consent: 'true' | 'false'
 * - analytics_consent_timestamp: ISO 8601 timestamp
 */

import type { ConsentState } from '@/types/analytics';

const CONSENT_KEY = 'analytics_consent';
const CONSENT_TIMESTAMP_KEY = 'analytics_consent_timestamp';

/**
 * Get current analytics consent state
 *
 * SSR-safe: Returns 'unknown' if window is undefined.
 *
 * @returns Current consent state
 */
export function getConsentState(): ConsentState {
  // SSR safety check
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const storedConsent = localStorage.getItem(CONSENT_KEY);

  // Not set yet
  if (storedConsent === null) {
    return 'unknown';
  }

  // Parse stored value
  return storedConsent === 'true' ? 'granted' : 'denied';
}

/**
 * Set analytics consent state
 *
 * Writes consent decision and timestamp to localStorage.
 *
 * @param granted - True if user granted consent, false if denied
 */
export function setConsentState(granted: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  const consentValue = granted ? 'true' : 'false';
  const timestamp = new Date().toISOString();

  localStorage.setItem(CONSENT_KEY, consentValue);
  localStorage.setItem(CONSENT_TIMESTAMP_KEY, timestamp);
}

/**
 * Check if analytics tracking is allowed
 *
 * Returns true only if user explicitly granted consent.
 * Used by client code before calling analytics APIs.
 *
 * @returns True if tracking is allowed
 */
export function canTrackAnalytics(): boolean {
  return getConsentState() === 'granted';
}

/**
 * Get consent timestamp (when user made decision)
 *
 * @returns ISO 8601 timestamp or null if not set
 */
export function getConsentTimestamp(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(CONSENT_TIMESTAMP_KEY);
}

/**
 * Reset consent state (for settings page)
 *
 * Removes both consent and timestamp from localStorage.
 * User will be prompted again on next visit.
 */
export function resetConsent(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
}
