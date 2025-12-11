import { auth0 } from '@/lib/auth0';
import { API_KEY } from '@/lib/stoveApi';

/**
 * GET /api/stove/settings
 * Returns stove settings
 * Protected: Requires Auth0 authentication
 */
export const GET = auth0.withApiAuthRequired(async function getSettingsHandler(request) {
  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/GetSettings/${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return Response.json(data);
});
