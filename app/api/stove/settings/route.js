import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { API_KEY } from '@/lib/stoveApi';

/**
 * GET /api/stove/settings
 * Returns stove settings
 * Protected: Requires Auth0 authentication
 */
export async function GET(request) {
  const session = await auth0.getSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/GetSettings/${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return Response.json(data);
}
