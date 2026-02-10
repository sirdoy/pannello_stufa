/**
 * API Route: User Theme Preference
 *
 * GET /api/user/theme
 * - Recupera la preferenza tema dell'utente
 *
 * POST /api/user/theme
 * - Aggiorna la preferenza tema dell'utente
 *
 * Body (POST):
 * {
 *   theme: "light" | "dark"
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  parseJsonOrThrow,
  validateRequired,
  validateEnum,
} from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

type Theme = 'light' | 'dark';

const VALID_THEMES: Theme[] = ['light', 'dark'];

interface UpdateThemeBody {
  theme: Theme;
}

/**
 * GET /api/user/theme
 * Get user theme preference
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  // Get theme from Firebase
  const theme = (await adminDbGet(`users/${userId}/preferences/theme`)) as Theme | null;

  if (theme) {
    return success({ theme });
  }

  // Default: light
  return success({
    theme: 'light' as Theme,
    default: true,
  });
}, 'User/GetTheme');

/**
 * POST /api/user/theme
 * Update user theme preference
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = (await parseJsonOrThrow(request)) as UpdateThemeBody;
  const { theme } = body;

  // Validate
  validateRequired(theme, 'theme');
  validateEnum(theme, VALID_THEMES, 'theme');

  // Save theme to Firebase using Admin SDK
  await adminDbSet(`users/${userId}/preferences/theme`, theme);


  return success({
    message: 'Tema aggiornato con successo',
    theme,
  });
}, 'User/SetTheme');
