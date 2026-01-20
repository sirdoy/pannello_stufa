/**
 * API Route: Sync Changelog to Firebase
 *
 * GET /api/admin/sync-changelog - Info (no sync)
 * POST /api/admin/sync-changelog - Sync changelog to Firebase
 *
 * Protected: Requires Auth0 authentication + ADMIN_USER_ID
 */

import {
  withAuthAndErrorHandler,
  success,
  forbidden,
} from '@/lib/core';
import { syncVersionHistoryToFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY } from '@/lib/version';

export const dynamic = 'force-dynamic';

/**
 * Helper to check admin access
 */
function isAdmin(session) {
  return session.user.sub === process.env.ADMIN_USER_ID;
}

/**
 * GET /api/admin/sync-changelog
 * Get changelog info without syncing
 * Protected: Requires Auth0 authentication + ADMIN
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  if (!isAdmin(session)) {
    return forbidden('Admin access required');
  }

  return success({
    ready: true,
    versionsCount: VERSION_HISTORY.length,
    latestVersion: VERSION_HISTORY[0].version,
    message: 'Use POST to sync',
  });
}, 'Admin/SyncChangelog/Info');

/**
 * POST /api/admin/sync-changelog
 * Sync changelog to Firebase
 * Protected: Requires Auth0 authentication + ADMIN
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  if (!isAdmin(session)) {
    return forbidden('Admin access required');
  }

  // Sync changelog to Firebase
  await syncVersionHistoryToFirebase(VERSION_HISTORY);

  return success({
    message: 'Changelog sincronizzato con successo',
    versionsCount: VERSION_HISTORY.length,
    latestVersion: VERSION_HISTORY[0].version,
  });
}, 'Admin/SyncChangelog/Sync');
