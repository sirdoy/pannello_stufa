import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/network/mesh
 * Returns mesh topology from Fritz!Box as a flat object.
 * NOT paginated — returns { schema_version, node_count, link_count, nodes[], links[], is_stale, fetched_at }.
 * Protected: Requires an authenticated session
 *
 * Success: { mesh: { schema_version, node_count, link_count, nodes, links, is_stale, fetched_at } }
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const mesh = await fritzboxClient.getMeshTopology();
  return success({ mesh });
}, 'FritzBox/Mesh');
