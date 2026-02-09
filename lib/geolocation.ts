/**
 * Browser Geolocation Utility
 *
 * Client-side utility for accessing device geolocation with proper error handling.
 * Designed for PWA with iOS Safari compatibility in mind.
 *
 * Usage:
 *   import { getCurrentLocation, GEOLOCATION_ERRORS, GEOLOCATION_ERROR_MESSAGES } from '@/lib/geolocation';
 *
 *   try {
 *     const { latitude, longitude, accuracy } = await getCurrentLocation();
 *   } catch (error) {
 *     console.error(GEOLOCATION_ERROR_MESSAGES[error.code]);
 *   }
 */

/**
 * Geolocation position result
 */
export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Custom error with code property
 */
export interface GeolocationError extends Error {
  code: string;
}

/**
 * Error codes for geolocation failures
 * Standardized codes that map to browser GeolocationPositionError codes
 */
const GEOLOCATION_ERRORS = {
  NOT_SUPPORTED: 'GEOLOCATION_NOT_SUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Italian error messages for UI display
 * Maps error codes to user-friendly messages
 */
const GEOLOCATION_ERROR_MESSAGES = {
  [GEOLOCATION_ERRORS.NOT_SUPPORTED]: 'Geolocalizzazione non supportata dal browser',
  [GEOLOCATION_ERRORS.PERMISSION_DENIED]: 'Permesso di geolocalizzazione negato',
  [GEOLOCATION_ERRORS.POSITION_UNAVAILABLE]: 'Posizione non disponibile',
  [GEOLOCATION_ERRORS.TIMEOUT]: 'Richiesta di posizione scaduta',
  [GEOLOCATION_ERRORS.UNKNOWN]: 'Errore sconosciuto nella geolocalizzazione',
};

/**
 * Get current device location using browser Geolocation API
 *
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 * @throws {Error} Error with `code` property set to GEOLOCATION_ERRORS constant
 *
 * @example
 * try {
 *   const location = await getCurrentLocation();
 *   console.log(`Lat: ${location.latitude}, Lon: ${location.longitude}`);
 * } catch (error) {
 *   if (error.code === GEOLOCATION_ERRORS.PERMISSION_DENIED) {
 *     // Show permission denied UI
 *   }
 * }
 */
export function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      const error = new Error(GEOLOCATION_ERROR_MESSAGES[GEOLOCATION_ERRORS.NOT_SUPPORTED]) as GeolocationError;
      error.code = GEOLOCATION_ERRORS.NOT_SUPPORTED;
      reject(error);
      return;
    }

    // Configure geolocation options
    const options = {
      enableHighAccuracy: false, // Faster, less battery drain (WiFi/cell tower OK)
      timeout: 10000,            // 10 seconds (INFRA-04 requirement)
      maximumAge: 300000,        // 5 minutes cached position acceptable
    };

    // Request current position
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      // Error callback
      (error) => {
        // Map browser error codes to our standardized codes
        let errorCode;
        switch (error.code) {
          case 1: // GeolocationPositionError.PERMISSION_DENIED
            errorCode = GEOLOCATION_ERRORS.PERMISSION_DENIED;
            break;
          case 2: // GeolocationPositionError.POSITION_UNAVAILABLE
            errorCode = GEOLOCATION_ERRORS.POSITION_UNAVAILABLE;
            break;
          case 3: // GeolocationPositionError.TIMEOUT
            errorCode = GEOLOCATION_ERRORS.TIMEOUT;
            break;
          default:
            errorCode = GEOLOCATION_ERRORS.UNKNOWN;
        }

        const err = new Error(GEOLOCATION_ERROR_MESSAGES[errorCode]) as GeolocationError;
        err.code = errorCode;
        reject(err);
      },
      // Options
      options
    );
  });
}
