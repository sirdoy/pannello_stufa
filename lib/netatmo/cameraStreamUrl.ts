import type { CameraStreamResponse } from '@/types/netatmoProxy';

type StreamPayload = Partial<Pick<CameraStreamResponse, 'proxy_streams' | 'vpn_streams' | 'local_streams' | 'is_local'>>;

/**
 * Pick the HLS URL a browser can actually play from GET /camera/{id}/stream.
 * 1. proxy_streams — same-origin, authenticated relay (works everywhere)
 * 2. local_streams — LAN http URL; only usable from an http page on the same LAN
 *    (an https page blocks it as mixed content)
 * 3. vpn_streams   — legacy fallback for backends without proxy_streams
 */
export function pickStreamUrl(data: StreamPayload, pageIsHttps: boolean): string | null {
  if (data.proxy_streams?.high) return data.proxy_streams.high;
  if (data.is_local && data.local_streams?.high && !pageIsHttps) return data.local_streams.high;
  return data.vpn_streams?.high ?? null;
}
