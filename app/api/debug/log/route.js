/**
 * API Route: Debug Log
 *
 * POST /api/debug/log
 *
 * Salva log di debug su Firebase per troubleshooting remoto.
 * NO AUTH - permettiamo logging anche prima di autenticazione
 *
 * Body:
 * {
 *   category: "notifications|fcm|etc",
 *   message: "Error message or info",
 *   data: { ...any debug data }
 * }
 */

import { NextResponse } from 'next/server';
import { adminDbPush } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debug/log
 * Save debug log entry to Firebase
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { category = 'general', message, data = {} } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    // Prepara log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
      // Info sul client
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'unknown',
    };

    // Salva su Firebase: debug/logs/{category}/{pushId}
    await adminDbPush(`debug/logs/${category}`, logEntry);

    console.log(`[DEBUG LOG] ${category}: ${message}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[DEBUG LOG] Error saving log:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/debug/log?category=notifications&limit=20
 * Read recent debug logs
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'notifications';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Import qui per evitare circular dependencies
    const { adminDbGet } = await import('@/lib/firebaseAdmin');

    const logs = await adminDbGet(`debug/logs/${category}`);

    if (!logs) {
      return NextResponse.json({ success: true, logs: [], count: 0 });
    }

    // Converti in array e ordina per timestamp (più recenti prima)
    const logsArray = Object.entries(logs)
      .map(([id, log]) => ({ id, ...log }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      logs: logsArray,
      count: logsArray.length,
      total: Object.keys(logs).length,
    });

  } catch (error) {
    console.error('[DEBUG LOG] Error reading logs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
