import { CAMERA_ROUTES } from '@/lib/routes';

/**
 * ROADMAP S11 — keep signed Netatmo URLs out of the browser.
 *
 * Backend REST payloads (server-to-server, API key) carry upstream URLs that grant
 * access on their own: camera `vpn_url` / `vpn_streams` (live stream), `local_url` /
 * `local_streams` (LAN, tokenised path), event `snapshot_url`, gethomedata
 * `snapshot.url` / `vignette.url` / `face.url`. The browser only needs the app's
 * authenticated proxy paths (`proxy_streams`, `snapshot_proxy_url`, event snapshot
 * route), so Next routes pass payloads through here before answering.
 */

const SIGNED_URL_KEYS = new Set(['vpn_url', 'vpn_streams', 'local_url', 'local_streams', 'snapshot_url']);

function isAbsoluteUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/**
 * Deep copy without signed-URL keys and without any string value that is an
 * absolute http(s) URL (same-origin proxy paths are relative and survive).
 */
export function stripSignedUrls<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => stripSignedUrls(item)) as T;
  }
  if (data !== null && typeof data === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SIGNED_URL_KEYS.has(key) || isAbsoluteUrl(value)) continue;
      out[key] = stripSignedUrls(value);
    }
    return out as T;
  }
  return data;
}

/**
 * Camera events: point `snapshot_url` at the authenticated event-snapshot proxy
 * (backend-cached JPEG) instead of the signed Netatmo URL, then strip the rest.
 */
export function proxyEventSnapshots<T extends { events?: ReadonlyArray<object> }>(data: T): T {
  const events = (data.events ?? []).map((raw) => {
    const event = raw as Record<string, unknown>;
    const eventId = typeof event.event_id === 'string' ? event.event_id : null;
    const hasSnapshot = event.snapshot_url != null;
    const safe = stripSignedUrls(event);
    return hasSnapshot && eventId ? { ...safe, snapshot_url: CAMERA_ROUTES.eventSnapshot(eventId) } : safe;
  });
  return { ...stripSignedUrls(data), events } as T;
}
