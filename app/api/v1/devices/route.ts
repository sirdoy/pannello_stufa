/**
 * API Route: Aggregated Devices List
 *
 * GET /api/v1/devices
 *
 * Returns a unified device list across providers, starting with Fritz!Box network devices.
 * Each item includes a provider_type discriminator for multi-provider display.
 *
 * Response shape:
 * {
 *   items: Array<{ ip, name, mac, status, provider_type }>,
 *   total_count: number,
 *   limit: number,
 *   offset: number,
 * }
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/devices
 * Returns all network devices from Fritz!Box with provider_type discriminator.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const devices = await fritzboxClient.getDevices();

  const items = devices.map(d => ({
    ip: d.ip,
    name: d.name,
    mac: d.mac,
    status: d.active ? 1 : 0,
    provider_type: 'fritzbox',
  }));

  return success({
    items,
    total_count: items.length,
    limit: items.length,
    offset: 0,
  });
}, 'Devices/Aggregated');
