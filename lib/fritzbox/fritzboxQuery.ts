/**
 * Fritz!Box route query helpers (pure, no I/O).
 *
 * Next proxy routes forward a whitelist of query params to the backend and cache the
 * response in Firebase RTDB for 60s (getCachedData). The cache key MUST include the
 * forwarded params, otherwise every page/filter is served the first cached response.
 *
 * Kept outside the '@/lib/fritzbox' barrel on purpose: route tests auto-mock the barrel,
 * and these helpers must keep their real behaviour.
 */

/** Non-negative integer (days / hours / limit / offset) */
export const NUMERIC_PARAM = /^\d{1,6}$/;
/** WiFi band label: "2.4GHz", "5GHz", "guest", "wlan3" */
export const BAND_PARAM = /^[A-Za-z0-9.]{1,16}$/;
/** MAC address, ':' or '-' separated */
export const MAC_PARAM = /^[0-9A-Fa-f]{2}([:-][0-9A-Fa-f]{2}){5}$/;

/**
 * Copy only the whitelisted, well-formed params from `source` (spec order).
 * Invalid values are dropped, so the backend applies its own default.
 */
export function pickQueryParams(
  source: URLSearchParams,
  spec: Record<string, RegExp>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [name, pattern] of Object.entries(spec)) {
    const value = source.get(name);
    if (value && pattern.test(value)) params.set(name, value);
  }
  return params;
}

/**
 * Encode a value into Firebase-key-safe chars (no . $ # [ ] /).
 * Injective: every char outside [A-Za-z0-9-] becomes "_<hex code>".
 */
function encodeKeyPart(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`);
}

/**
 * Build a per-query cache key: `<base>` when no params, otherwise
 * `<base>--<name>-<value>--<name>-<value>` (params in insertion order).
 */
export function buildCacheKey(base: string, params: URLSearchParams): string {
  const parts: string[] = [];
  params.forEach((value, name) => {
    parts.push(`${encodeKeyPart(name)}-${encodeKeyPart(value)}`);
  });
  return parts.length ? `${base}--${parts.join('--')}` : base;
}
