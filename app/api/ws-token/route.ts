/**
 * GET /api/ws-token — WebSocket auth query for the browser (roadmap 8.7).
 *
 * Returns `{ query: "token=<60s user WS token>" }` from backend POST /auth/ws-token,
 * so no API key ships in the client bundle. Called before every (re)connect.
 * Local dev with BYPASS_AUTH (never in production) has no user session and
 * falls back to the server API key.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/core';
import { haPost } from '@/lib/haClient';
import { requireStoredSession } from '@/lib/auth/storedSession';

export const dynamic = 'force-dynamic';

interface WsTokenResponse {
  token: string;
  expires_in: number;
}

const noStore = { headers: { 'Cache-Control': 'no-store' } };

export const GET = withErrorHandler(async (request: NextRequest) => {
  if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ query: `api_key=${encodeURIComponent(process.env.HA_API_KEY ?? '')}` }, noStore);
  }
  const { accessToken } = await requireStoredSession(request);
  const { token } = await haPost<WsTokenResponse>('/auth/ws-token', {}, { bearer: accessToken });
  return NextResponse.json({ query: `token=${encodeURIComponent(token)}` }, noStore);
}, 'WsToken');
