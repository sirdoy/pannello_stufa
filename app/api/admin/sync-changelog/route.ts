/**
 * API Route: Sync Changelog to Firebase
 *
 * GET /api/admin/sync-changelog - Info (no sync)
 * POST /api/admin/sync-changelog - Sync changelog to Firebase
 *
 * Protected: user session + ADMIN_USER_ID (manual use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authSession } from '@/lib/auth/session';
import { syncVersionHistoryToFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY } from '@/lib/version';

export const dynamic = 'force-dynamic';

interface AuthorizationResult {
  authorized: boolean;
  method?: 'session';
}

/**
 * Helper to check admin access via the user session
 */
function isAdmin(session: any): boolean {
  return session?.user?.sub === process.env.ADMIN_USER_ID;
}

/**
 * Helper to verify authorization (admin user session)
 */
async function verifyAuthorization(request: NextRequest): Promise<AuthorizationResult> {
  try {
    const session = await authSession.getSession(request);
    if (session && isAdmin(session)) {
      return { authorized: true, method: 'session' };
    }
  } catch {
    // Session check failed, continue
  }

  return { authorized: false };
}

/**
 * GET /api/admin/sync-changelog
 * Get changelog info without syncing
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { authorized } = await verifyAuthorization(request);

  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Admin access required' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ready: true,
    versionsCount: VERSION_HISTORY.length,
    latestVersion: VERSION_HISTORY[0]?.version ?? 'unknown',
    message: 'Use POST to sync',
  });
}

/**
 * POST /api/admin/sync-changelog
 * Sync changelog to Firebase
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { authorized, method } = await verifyAuthorization(request);

  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Admin access required' },
      { status: 401 }
    );
  }

  try {
    // Sync changelog to Firebase
    await syncVersionHistoryToFirebase(VERSION_HISTORY);

    return NextResponse.json({
      success: true,
      message: 'Changelog sincronizzato con successo',
      versionsCount: VERSION_HISTORY.length,
      latestVersion: VERSION_HISTORY[0]?.version ?? 'unknown',
      authMethod: method,
    });
  } catch (error) {
    console.error('Sync changelog error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Sync failed', message: errorMessage },
      { status: 500 }
    );
  }
}
