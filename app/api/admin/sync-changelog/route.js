import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { syncVersionHistoryToFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY } from '@/lib/version';

// Force dynamic rendering to avoid build-time Firebase initialization
export const dynamic = 'force-dynamic';

/**
 * API route per sincronizzare changelog con Firebase
 * Protected: Requires Auth0 authentication + ADMIN_USER_ID
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.sub !== process.env.ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Sincronizza changelog con Firebase
    await syncVersionHistoryToFirebase(VERSION_HISTORY);

    return NextResponse.json({
      success: true,
      message: 'Changelog sincronizzato con successo',
      versionsCount: VERSION_HISTORY.length,
      latestVersion: VERSION_HISTORY[0].version,
    });
  } catch (error) {
    console.error('Errore sincronizzazione changelog:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Supporta anche GET per info (senza sync)
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.sub !== process.env.ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ready: true,
      versionsCount: VERSION_HISTORY.length,
      latestVersion: VERSION_HISTORY[0].version,
      message: 'Use POST to sync',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
