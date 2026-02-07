/**
 * Location Configuration API
 *
 * GET  /api/config/location - Get current app-wide location
 * POST /api/config/location - Set app-wide location
 *
 * All authenticated users can read and write the location.
 * This is a shared configuration for the entire app.
 */

import { withAuthAndErrorHandler, success, badRequest, error, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

interface Location {
  latitude: number;
  longitude: number;
  name: string | null;
  updatedAt: number;
}

interface UpdateLocationBody {
  latitude: number | string;
  longitude: number | string;
  name?: string;
}

// Force dynamic rendering (Firebase Admin SDK requires Node.js runtime)
export const dynamic = 'force-dynamic';

/**
 * GET /api/config/location
 * Returns current configured location or 404 if not set
 *
 * Response:
 *   200: { location: { latitude, longitude, name, updatedAt } }
 *   404: { error: 'Location not configured', code: 'LOCATION_NOT_SET' }
 */
export const GET = withAuthAndErrorHandler(async () => {
  const locationPath = getEnvironmentPath('config/location');
  const location = (await adminDbGet(locationPath)) as Location | null;

  if (!location) {
    return error('Location not configured', ERROR_CODES.LOCATION_NOT_SET, HTTP_STATUS.NOT_FOUND);
  }

  return success({ location });
}, 'Config/Location');

/**
 * POST /api/config/location
 * Set app-wide location with coordinate validation
 *
 * Body:
 *   {
 *     latitude: number,    // Required: -90 to 90
 *     longitude: number,   // Required: -180 to 180
 *     name?: string        // Optional: location name/address
 *   }
 *
 * Response:
 *   200: { message: 'Location updated', location: {...} }
 *   400: { error: '...validation error...', code: 'VALIDATION_ERROR' }
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as UpdateLocationBody;
  const { latitude, longitude, name } = body;

  // Validate required fields
  if (latitude === undefined || longitude === undefined) {
    return badRequest('latitude and longitude are required');
  }

  // Parse and validate coordinates
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lon = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  if (isNaN(lat) || isNaN(lon)) {
    return badRequest('latitude and longitude must be valid numbers');
  }

  if (lat < -90 || lat > 90) {
    return badRequest('latitude must be between -90 and 90');
  }

  if (lon < -180 || lon > 180) {
    return badRequest('longitude must be between -180 and 180');
  }

  // Save to Firebase
  const locationPath = getEnvironmentPath('config/location');
  await adminDbSet(locationPath, {
    latitude: lat,
    longitude: lon,
    name: name || null,
    updatedAt: Date.now(),
  });

  return success({
    message: 'Location updated',
    location: {
      latitude: lat,
      longitude: lon,
      name: name || null,
    },
  });
}, 'Config/Location');
