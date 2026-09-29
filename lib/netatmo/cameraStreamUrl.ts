import type { CameraStreamResponse } from '@/types/netatmoProxy';

type StreamPayload = Partial<Pick<CameraStreamResponse, 'proxy_streams'>>;

/**
 * Pick the HLS URL a browser can play from GET /camera/{id}/stream: the same-origin,
 * authenticated `proxy_streams` relay. The Next route strips the signed VPN and LAN
 * stream URLs before they reach the browser (ROADMAP S11), so there is no fallback.
 */
export function pickStreamUrl(data: StreamPayload): string | null {
  return data.proxy_streams?.high ?? null;
}
