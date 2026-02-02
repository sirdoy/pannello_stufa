/**
 * Dashboard Preferences API Route
 *
 * Server-side operations for dashboard customization.
 * Handles GET (read) and POST (update) operations.
 *
 * GET  /api/config/dashboard - Get current preferences
 * POST /api/config/dashboard - Update preferences
 */

import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/**
 * Default card order for new users
 * Must match client-side constant
 */
const DEFAULT_CARD_ORDER = [
  { id: 'stove', label: 'Stufa', visible: true },
  { id: 'thermostat', label: 'Termostato', visible: true },
  { id: 'weather', label: 'Meteo', visible: true },
  { id: 'lights', label: 'Luci', visible: true },
  { id: 'camera', label: 'Telecamera', visible: true },
];

/**
 * Force dynamic rendering (no static optimization)
 * Required for authenticated routes
 */
export const dynamic = 'force-dynamic';

/**
 * GET /api/config/dashboard
 *
 * Returns dashboard preferences or defaults
 *
 * Response:
 * {
 *   preferences: {
 *     cardOrder: [{ id, label, visible }, ...]
 *   }
 * }
 */
export const GET = withAuthAndErrorHandler(async () => {
  const dashboardPath = getEnvironmentPath('config/dashboard');
  const preferences = await adminDbGet(dashboardPath);

  // Return stored or defaults
  return success({
    preferences: preferences || { cardOrder: DEFAULT_CARD_ORDER },
  });
}, 'Config/Dashboard');

/**
 * POST /api/config/dashboard
 *
 * Save dashboard preferences
 *
 * Request body:
 * {
 *   cardOrder: [
 *     { id: 'stove', label: 'Stufa', visible: true },
 *     { id: 'weather', label: 'Meteo', visible: false },
 *     ...
 *   ]
 * }
 *
 * Response:
 * {
 *   message: 'Dashboard preferences updated',
 *   preferences: { cardOrder: [...] }
 * }
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await request.json();
  const { cardOrder } = body;

  // Validate cardOrder structure
  if (!cardOrder || !Array.isArray(cardOrder)) {
    return badRequest('cardOrder must be an array');
  }

  // Validate each card has required fields
  for (const card of cardOrder) {
    if (!card.id || typeof card.id !== 'string') {
      return badRequest('Each card must have a string id');
    }
    if (typeof card.visible !== 'boolean') {
      return badRequest('Each card must have a boolean visible field');
    }
  }

  // Save to Firebase
  const dashboardPath = getEnvironmentPath('config/dashboard');
  await adminDbSet(dashboardPath, {
    cardOrder,
    updatedAt: Date.now(),
  });

  return success({
    message: 'Dashboard preferences updated',
    preferences: { cardOrder },
  });
}, 'Config/Dashboard');
