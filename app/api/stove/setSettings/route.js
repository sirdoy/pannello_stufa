import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { API_KEY } from '@/lib/stoveApi';

/**
 * POST /api/stove/setSettings
 * Sets stove settings (fan/power defaults)
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const { fanLevel, powerLevel } = await parseJsonOrThrow(request);

  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/SetSettings/${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fanLevel, powerLevel }),
  });

  const data = await res.json();
  return success(data);
}, 'Stove/SetSettings');
