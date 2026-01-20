import { withAuthAndErrorHandler, success } from '@/lib/core';
import { API_KEY } from '@/lib/stoveApi';

/**
 * GET /api/stove/settings
 * Returns stove settings
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/GetSettings/${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return success(data);
}, 'Stove/Settings');
