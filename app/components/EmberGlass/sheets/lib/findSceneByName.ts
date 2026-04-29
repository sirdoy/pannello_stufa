import type { HueScene } from '@/types/hueProxy';

/**
 * Case-insensitive scene name lookup. Returns null if no match.
 * First match wins (callers responsible for catalog uniqueness).
 *
 * Source: CONTEXT D-07 / UI-SPEC §LightsSheet.
 * Used by: LightsSheet (Plan 178-06) — 4 hardcoded scene names ("Rilassante", "Concentrato",
 * "Cena", "Notte") looked up against the user's Hue scene catalog.
 *
 * Phase 178 self-contained — lives under `sheets/lib/` to keep the LightsSheet plan
 * reviewable. Can be moved to `app/components/devices/lights/utils/` later if Phase 179
 * (Rooms tab) wants the same helper.
 */
export function findSceneByName(
  catalog: readonly HueScene[],
  name: string,
): HueScene | null {
  const target = name.toLowerCase();
  return catalog.find((s) => s.name.toLowerCase() === target) ?? null;
}
