/**
 * Request-body helpers for the Hue light/group command routes.
 */

const LEGACY_STATE_KEYS = { bri: 'brightness', ct: 'color_temp', sat: 'saturation' } as const;

/**
 * Maps the bridge-native keys (bri, ct, sat) still sent by bundles built before T6 to
 * the backend wire names (brightness, color_temp, saturation). Remove with the backend
 * aliases (workspace ROADMAP T6 R).
 */
export function normalizeLightStateBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...body };
  for (const [legacy, canonical] of Object.entries(LEGACY_STATE_KEYS)) {
    if (legacy in out) {
      if (!(canonical in out)) out[canonical] = out[legacy];
      delete out[legacy];
    }
  }
  return out;
}
