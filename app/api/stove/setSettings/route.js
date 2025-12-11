import { auth0 } from '@/lib/auth0';
import { API_KEY } from '@/lib/stoveApi';

/**
 * POST /api/stove/setSettings
 * Sets stove settings (fan/power defaults)
 * Protected: Requires Auth0 authentication
 */
export const POST = auth0.withApiAuthRequired(async function setSettingsHandler(request) {
  const { fanLevel, powerLevel } = await request.json();
  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/SetSettings/${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fanLevel, powerLevel }),
  });
  const data = await res.json();
  return Response.json(data);
});
