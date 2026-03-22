/**
 * Location Service (Client-side)
 *
 * Firebase Realtime Database service for reading/writing app-wide location.
 * Single shared location for the entire app - all users see the same location.
 *
 * Storage path: /config/location (production) or /dev/config/location (development)
 *
 * Usage:
 *   import { getLocation, setLocation, subscribeToLocation } from '@/lib/services/locationService';
 *
 *   // Read once
 *   const location = await getLocation();
 *
 *   // Write
 *   await setLocation({ latitude: 45.4642, longitude: 9.1900, name: 'Milano' });
 *
 *   // Real-time updates
 *   const unsubscribe = subscribeToLocation((location) => {
 *   });
 */

import { ref, onValue, Unsubscribe } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/** Location data */
export interface Location {
  latitude: number;
  longitude: number;
  name: string | null;
  updatedAt: number;
}

/**
 * Get Firebase RTDB path for location data
 * Respects environment (dev vs production)
 */
const getLocationPath = (): string => getEnvironmentPath('config/location');

/**
 * Subscribe to real-time location updates
 * Callback is invoked whenever location changes in Firebase
 *
 * @param {Function} callback - Callback invoked with location data or null
 * @returns {Function} Unsubscribe function - call to stop listening
 *
 * @example
 * const unsubscribe = subscribeToLocation((location) => {
 *   if (location) {
 *     setWeatherLocation(location.latitude, location.longitude);
 *   }
 * });
 *
 * // Later: stop listening
 * unsubscribe();
 */
export function subscribeToLocation(callback: (location: Location | null) => void): Unsubscribe {
  const locationRef = ref(db, getLocationPath());
  const unsubscribe = onValue(locationRef, (snapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
}
