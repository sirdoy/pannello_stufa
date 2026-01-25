/**
 * useNotificationPreferences Hook
 *
 * Real-time Firestore sync for notification preferences.
 * Provides instant cross-device updates via onSnapshot listener.
 *
 * Critical: ALWAYS returns cleanup function to prevent memory leaks
 * (per RESEARCH.md Pitfall #1)
 *
 * @param {string} userId - Auth0 user ID
 * @returns {Object} { prefs, loading, error, savePreferences, resetToDefaults }
 */

import { useState, useEffect, useCallback } from 'react';
import { getFirestore } from 'firebase/firestore';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
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

  // Real-time listener setup
  useEffect(() => {
    // Guard: no userId
    if (!userId) {
      setLoading(false);
      setError(new Error('No userId provided'));
      return;
    }

    // Get Firestore instance
    let db;
    try {
      db = getFirestore();
    } catch (err) {
      console.error('[useNotificationPreferences] Firestore init error:', err);
      setError(err);
      setLoading(false);
      return;
    }

    // Document reference: users/{userId}/settings/notifications
    const docRef = doc(db, 'users', userId, 'settings', 'notifications');

    console.log('[useNotificationPreferences] Setting up listener for user:', userId);

    // Setup real-time listener with onSnapshot
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        console.log('[useNotificationPreferences] Snapshot received:', {
          exists: snapshot.exists(),
          userId,
        });

        if (snapshot.exists()) {
          // Document exists - use stored preferences
          const data = snapshot.data();
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

          // Optionally write defaults to Firestore for new users
          // This ensures preferences document exists for future updates
          setDoc(docRef, filterUndefined(defaults), { merge: true })
            .then(() => {
              console.log('[useNotificationPreferences] Default preferences written for new user');
            })
            .catch((err) => {
              console.error('[useNotificationPreferences] Error writing defaults:', err);
              // Non-blocking - user can still see defaults
            });
        }
      },
      (err) => {
        console.error('[useNotificationPreferences] Listener error:', err);
        setError(err);
        setLoading(false);

        // Fallback to defaults on error
        setPrefs(getDefaultPreferences());
      }
    );

    // CRITICAL: Cleanup function to prevent memory leak
    // Per RESEARCH.md Pitfall #1 - always return unsubscribe
    return () => {
      console.log('[useNotificationPreferences] Cleaning up listener for user:', userId);
      unsubscribe();
    };
  }, [userId]); // Re-subscribe if userId changes

  /**
   * Save Preferences to Firestore
   *
   * Accepts full or partial preferences object.
   * Uses merge: true for partial updates.
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
        const db = getFirestore();
        const docRef = doc(db, 'users', userId, 'settings', 'notifications');

        // Prepare update with metadata
        const update = {
          ...filterUndefined(newPreferences),
          updatedAt: new Date().toISOString(),
          version: (prefs?.version || 0) + 1, // Increment for conflict detection
        };

        console.log('[useNotificationPreferences] Saving preferences:', {
          userId,
          version: update.version,
        });

        // Save with merge: true for partial updates
        await setDoc(docRef, update, { merge: true });

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
   * Reset to Default Preferences
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
      const db = getFirestore();
      const docRef = doc(db, 'users', userId, 'settings', 'notifications');

      const defaults = {
        ...getDefaultPreferences(),
        updatedAt: new Date().toISOString(),
        version: 1, // Reset version
      };

      console.log('[useNotificationPreferences] Resetting to defaults for user:', userId);

      // Overwrite entire document
      await setDoc(docRef, filterUndefined(defaults));

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
