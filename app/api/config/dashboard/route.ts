/**
 * Dashboard Preferences API Route
 *
 * Server-side operations for per-user dashboard customization.
 * Handles GET (read) and POST (update) operations.
 * Each user has their own preferences stored at users/${userId}/dashboardPreferences.
 *
 * GET  /api/config/dashboard - Get current user's preferences
 * POST /api/config/dashboard - Update current user's preferences
 */

import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

interface DashboardCard {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

interface DashboardPreferences {
  cardOrder: DashboardCard[];
}

interface UpdateDashboardBody {
  cardOrder: DashboardCard[];
}

/**
 * Default card order for new users
 * Must match client-side constant
 */
const DEFAULT_CARD_ORDER: DashboardCard[] = [
  { id: 'stove', label: 'Stufa', icon: '🔥', visible: true },
  { id: 'thermostat', label: 'Termostato', icon: '🌡️', visible: true },
  { id: 'weather', label: 'Meteo', icon: '☀️', visible: true },
  { id: 'lights', label: 'Luci', icon: '💡', visible: true },
  { id: 'camera', label: 'Telecamera', icon: '📹', visible: true },
];

/**
 * Force dynamic rendering (no static optimization)
 * Required for authenticated routes
 */
export const dynamic = 'force-dynamic';

/**
 * GET /api/config/dashboard
 *
 * Returns current user's dashboard preferences or defaults.
 * User ID is extracted from Auth0 session.
 *
 * Response:
 * {
 *   preferences: {
 *     cardOrder: [{ id, label, icon, visible }, ...]
 *   }
 * }
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const dashboardPath = `users/${userId}/dashboardPreferences`;
  const preferences = (await adminDbGet(dashboardPath)) as DashboardPreferences | null;

  // Return stored or defaults
  return success({
    preferences: preferences || { cardOrder: DEFAULT_CARD_ORDER },
  });
}, 'Config/Dashboard');

/**
 * POST /api/config/dashboard
 *
 * Save dashboard preferences for the current user.
 * User ID is extracted from Auth0 session.
 *
 * Request body:
 * {
 *   cardOrder: [
 *     { id: 'stove', label: 'Stufa', icon: '🔥', visible: true },
 *     { id: 'weather', label: 'Meteo', icon: '☀️', visible: false },
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
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = (await request.json()) as UpdateDashboardBody;
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

  // Save to user-specific Firebase path
  const dashboardPath = `users/${userId}/dashboardPreferences`;
  await adminDbSet(dashboardPath, {
    cardOrder,
    updatedAt: Date.now(),
  });

  return success({
    message: 'Dashboard preferences updated',
    preferences: { cardOrder },
  });
}, 'Config/Dashboard');
