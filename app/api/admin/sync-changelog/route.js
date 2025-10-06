import { NextResponse } from 'next/server';
import { syncVersionHistoryToFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY } from '@/lib/version';

/**
 * API route per sincronizzare changelog con Firebase
 * Protetta da ADMIN_SECRET per prevenire accessi non autorizzati
 *
 * Usage:
 * curl -X POST https://your-app.vercel.app/api/admin/sync-changelog \
 *   -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 */
export async function POST(request) {
  try {
    // Verifica autorizzazione
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
