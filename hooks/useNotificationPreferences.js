/**
 * useNotificationPreferences Hook
 *
 * Real-time RTDB sync for notification preferences.
 * Provides instant cross-device updates via onValue listener.
 *
 * Critical: ALWAYS returns cleanup function to prevent memory leaks
 * (per RESEARCH.md Pitfall #1)
 *
 * @param {string} userId - Auth0 user ID
 * @returns {Object} { prefs, loading, error, savePreferences, resetToDefaults }
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { getDefaultPreferences } from '@/lib/schemas/notificationPreferences';

/**
 * Filter undefined values from object (preserves null)
 * Prevents Firestore "undefined" serialization errors
 */
function filterUndefined(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      filtered[key] = typeof value === 'object' && value !== null
        ? filterUndefined(value)
        : value;
    }
  }
  return filtered;
}

export function useNotificationPreferences(userId) {
  // State management
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time listener setup (Firebase RTDB)
  useEffect(() => {
    // Guard: no userId
    if (!userId) {
      setLoading(false);
      setError(new Error('No userId provided'));
      return;
    }

    // RTDB reference: users/{userId}/settings/notifications
    const prefsRef = ref(db, `users/${userId}/settings/notifications`);

    console.log('[useNotificationPreferences] Setting up RTDB listener for user:', userId);

    // Setup real-time listener with onValue
    const unsubscribe = onValue(
      prefsRef,
      (snapshot) => {
        console.log('[useNotificationPreferences] RTDB snapshot received:', {
          exists: snapshot.exists(),
          userId,
        });

        if (snapshot.exists()) {
          // Preferences exist - use stored data
          const data = snapshot.val();
          setPrefs(data);
          setLoading(false);
          setError(null);
        } else {
          // New user - no preferences yet
          console.log('[useNotificationPreferences] No preferences found, using defaults');
          const defaults = getDefaultPreferences();
          setPrefs(defaults);
          setLoading(false);
          setError(null);

          // NOTE: Defaults will be written to RTDB on first save via API
          // No need to write immediately - avoids client-side permission issues
        }
      },
      (err) => {
        console.error('[useNotificationPreferences] RTDB listener error:', err);
        setError(err);
        setLoading(false);

        // Fallback to defaults on error
        setPrefs(getDefaultPreferences());
      }
    );

    // CRITICAL: Cleanup function to prevent memory leak
    // Per RESEARCH.md Pitfall #1 - always detach listener
    return () => {
      console.log('[useNotificationPreferences] Cleaning up RTDB listener for user:', userId);
      off(prefsRef, 'value', unsubscribe);
    };
  }, [userId]); // Re-subscribe if userId changes

  /**
   * Save Preferences via API (uses Admin SDK to bypass Firestore rules)
   *
   * Accepts full or partial preferences object.
   * Uses API endpoint with Admin SDK for security rule bypass during development.
   * Increments version for conflict detection.
   * Adds updatedAt timestamp.
   *
   * @param {Object} newPreferences - Full or partial preferences
   * @returns {Promise<void>}
   */
  const savePreferences = useCallback(
    async (newPreferences) => {
      if (!userId) {
        throw new Error('Cannot save preferences: no userId');
      }

      setIsSaving(true);
      setError(null);

      try {
        // Prepare update with metadata
        const update = {
          ...filterUndefined(newPreferences),
          version: (prefs?.version || 0) + 1, // Increment for conflict detection
        };

        console.log('[useNotificationPreferences] Saving preferences via API:', {
          userId,
          version: update.version,
        });

        // Save via API endpoint (uses Admin SDK)
        const response = await fetch('/api/notifications/preferences-v2', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save preferences');
        }

        console.log('[useNotificationPreferences] Preferences saved successfully');

        // Local state will update via onSnapshot listener
        // No need to manually update prefs state
      } catch (err) {
        console.error('[useNotificationPreferences] Save error:', err);
        setError(err);
        throw err; // Re-throw for caller to handle
      } finally {
        setIsSaving(false);
      }
    },
    [userId, prefs?.version]
  );

  /**
   * Reset to Default Preferences via API
   *
   * Overwrites all preferences with defaults.
   * Resets version to 1.
   *
   * @returns {Promise<void>}
   */
  const resetToDefaults = useCallback(async () => {
    if (!userId) {
      throw new Error('Cannot reset preferences: no userId');
    }

    setIsSaving(true);
    setError(null);

    try {
      const defaults = {
        ...getDefaultPreferences(),
        version: 1, // Reset version
      };

      console.log('[useNotificationPreferences] Resetting to defaults via API for user:', userId);

      // Save via API endpoint (uses Admin SDK)
      const response = await fetch('/api/notifications/preferences-v2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaults),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset preferences');
      }

      console.log('[useNotificationPreferences] Reset successful');

      // Local state will update via onSnapshot listener
    } catch (err) {
      console.error('[useNotificationPreferences] Reset error:', err);
      setError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  // Return hook API
  return {
    prefs,          // Current preferences (null until first load)
    loading,        // True until first snapshot received
    error,          // Error object or null
    isSaving,       // True during save/reset operations
    savePreferences, // Function to save preferences
    resetToDefaults, // Function to reset to defaults
  };
}
