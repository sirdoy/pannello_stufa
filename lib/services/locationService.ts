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
 *     console.log('Location changed:', location);
 *   });
 */

import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/**
 * Get Firebase RTDB path for location data
 * Respects environment (dev vs production)
 * @returns {string} Firebase path
 */
const getLocationPath = () => getEnvironmentPath('config/location');

/**
 * Read current location from Firebase (once)
 *
 * @returns {Promise<{latitude: number, longitude: number, name: string|null, updatedAt: number}|null>}
 *          Location object or null if not configured
 *
 * @example
 * const location = await getLocation();
 * if (location) {
 *   console.log(`${location.latitude}, ${location.longitude}`);
 * }
 */
export async function getLocation() {
  const locationRef = ref(db, getLocationPath());
  return new Promise((resolve) => {
    onValue(locationRef, (snapshot) => {
      resolve(snapshot.val());
    }, { onlyOnce: true });
  });
}

/**
 * Set app-wide location in Firebase
 * Updates updatedAt timestamp automatically
 *
 * @param {Object} locationData - Location data
 * @param {number} locationData.latitude - Latitude coordinate
 * @param {number} locationData.longitude - Longitude coordinate
 * @param {string} [locationData.name] - Optional location name/address
 * @returns {Promise<void>}
 *
 * @example
 * await setLocation({
 *   latitude: 45.4642,
 *   longitude: 9.1900,
 *   name: 'Milano, IT'
 * });
 */
export async function setLocation({ latitude, longitude, name }) {
  const locationRef = ref(db, getLocationPath());
  await set(locationRef, {
    latitude,
    longitude,
    name: name || null,
    updatedAt: Date.now(),
  });
}

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
export function subscribeToLocation(callback) {
  const locationRef = ref(db, getLocationPath());
  const unsubscribe = onValue(locationRef, (snapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
}
