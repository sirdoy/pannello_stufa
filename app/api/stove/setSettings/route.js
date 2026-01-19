import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { API_KEY } from '@/lib/stoveApi';

/**
 * POST /api/stove/setSettings
 * Sets stove settings (fan/power defaults)
 * Protected: Requires Auth0 authentication
 */
export async function POST(request) {
  const session = await auth0.getSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { fanLevel, powerLevel } = await request.json();
  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/SetSettings/${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fanLevel, powerLevel }),
  });
  const data = await res.json();
  return Response.json(data);
}
