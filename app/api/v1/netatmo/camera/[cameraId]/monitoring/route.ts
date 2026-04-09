import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxySetCameraMonitoring } from '@/lib/netatmo/netatmoProxy';
import type { SetMonitoringRequest } from '@/types/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/netatmo/camera/[cameraId]/monitoring
 * Toggles camera monitoring on/off via proxy.
 * Body: { monitoring: "on" | "off" }
 * cameraId is taken from the URL path param (not from the body).
 * Protected: Requires Auth0 authentication
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const body = await parseJson(request) as SetMonitoringRequest;
  const data = await proxySetCameraMonitoring(cameraId, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/Camera/Monitoring');
