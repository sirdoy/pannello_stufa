/**
 * API Route: Sync Changelog to Firebase
 *
 * GET /api/admin/sync-changelog - Info (no sync)
 * POST /api/admin/sync-changelog - Sync changelog to Firebase
 *
 * Protected: Requires either:
 * - Auth0 authentication + ADMIN_USER_ID (manual use)
 * - Bearer token matching CRON_SECRET (GitHub Actions automation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { syncVersionHistoryToFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY } from '@/lib/version';
import type { Session } from '@auth0/nextjs-auth0';

export const dynamic = 'force-dynamic';

interface AuthorizationResult {
  authorized: boolean;
  method?: 'token' | 'auth0';
}

/**
 * Helper to check admin access via Auth0
 */
function isAdmin(session: Session | null | undefined): boolean {
  return session?.user?.sub === process.env.ADMIN_USER_ID;
}

/**
 * Helper to check secret token (for GitHub Actions)
 */
function isValidSecretToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.substring(7);
  return token === process.env.CRON_SECRET;
}

/**
 * Helper to verify authorization (Auth0 session OR secret token)
 */
async function verifyAuthorization(request: NextRequest): Promise<AuthorizationResult> {
  // First check secret token (for automated sync)
  if (isValidSecretToken(request)) {
    return { authorized: true, method: 'token' };
  }

  // Then check Auth0 session (for manual admin use)
  try {
    const session = await auth0.getSession(request);
    if (session && isAdmin(session)) {
      return { authorized: true, method: 'auth0' };
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
      { error: 'Unauthorized', message: 'Admin access or valid token required' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ready: true,
    versionsCount: VERSION_HISTORY.length,
    latestVersion: VERSION_HISTORY[0].version,
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
      { error: 'Unauthorized', message: 'Admin access or valid token required' },
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
      latestVersion: VERSION_HISTORY[0].version,
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
