import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint
 *
 * Simple endpoint used by useOnlineStatus hook to verify connectivity.
 * Returns 200 OK if the server is reachable.
 *
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}

/**
 * HEAD request support for lightweight connectivity check
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
