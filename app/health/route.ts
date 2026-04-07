/**
 * API Route: Aggregated Health Check
 *
 * GET /health
 *
 * Returns aggregated health status for all 8 providers via Promise.allSettled fan-out.
 * Unauthenticated — health is a public endpoint.
 *
 * Response shape:
 * {
 *   status: 'ok' | 'degraded',
 *   providers: {
 *     thermorossi: 'ok' | 'down',
 *     netatmo: 'ok' | 'down',
 *     hue: 'ok' | 'down',
 *     sonos: 'ok' | 'down',
 *     dirigera: 'ok' | 'down',
 *     tuya: 'ok' | 'down',
 *     raspi: 'ok' | 'down',
 *     fritzbox: 'ok' | 'down',
 *   }
 * }
 */

import { withErrorHandler, success } from '@/lib/core';
import { getHealth as getThermorossiHealth } from '@/lib/stove/thermorossiProxy';
import { getProxyHealth as getNetatmoHealth } from '@/lib/netatmo/netatmoProxy';
import { getHealth as getHueHealth } from '@/lib/hue/hueProxy';
import { getHealth as getSonosHealth } from '@/lib/sonos/sonosProxy';
import { getHealth as getDirigeraHealth } from '@/lib/dirigera/dirigeraProxy';
import { getHealth as getTuyaHealth } from '@/lib/tuya/tuyaProxy';
import { raspiClient } from '@/lib/raspi';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /health
 * Returns aggregated provider health across all 8 device providers.
 */
export const GET = withErrorHandler(async () => {
  const [
    thermorossiResult,
    netatmoResult,
    hueResult,
    sonosResult,
    dirigeraResult,
    tuyaResult,
    raspiResult,
    fritzboxResult,
  ] = await Promise.allSettled([
    getThermorossiHealth(),
    getNetatmoHealth(),
    getHueHealth(),
    getSonosHealth(),
    getDirigeraHealth(),
    getTuyaHealth(),
    raspiClient.getHealth(),
    fritzboxClient.ping(),
  ]);

  const providers = {
    thermorossi: thermorossiResult.status === 'fulfilled' ? 'ok' : 'down',
    netatmo: netatmoResult.status === 'fulfilled' ? 'ok' : 'down',
    hue: hueResult.status === 'fulfilled' ? 'ok' : 'down',
    sonos: sonosResult.status === 'fulfilled' ? 'ok' : 'down',
    dirigera: dirigeraResult.status === 'fulfilled' ? 'ok' : 'down',
    tuya: tuyaResult.status === 'fulfilled' ? 'ok' : 'down',
    raspi: raspiResult.status === 'fulfilled' ? 'ok' : 'down',
    fritzbox: fritzboxResult.status === 'fulfilled' ? 'ok' : 'down',
  } as const;

  const allOk = Object.values(providers).every(v => v === 'ok');

  return success({
    status: allOk ? 'ok' : 'degraded',
    providers,
  });
}, 'Health/Aggregated');
