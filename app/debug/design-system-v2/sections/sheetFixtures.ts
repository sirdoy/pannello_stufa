/**
 * sheetFixtures — Phase 182 (D-13)
 *
 * 260506-d45 update: the 5 device sheet components now have TWO entry points:
 *   - `<*Sheet data={...} cmds={...} />` — prop-based, used by production cards
 *     (StoveCard, ClimateCard, LightsCard, SonosCard, TuyaCard) so hooks live
 *     at card level and don't double-mount on sheet open.
 *   - `<*SheetSelfFetch />` — zero-prop wrapper that calls the hooks internally
 *     and renders the prop-based body. Used by Section10SheetGallery (this
 *     debug page) since there is no card-level hook mount here.
 *
 * This file therefore lists the device keys used by Section10SheetGallery
 * launcher row. The Jest page test mocks the underlying device hooks (see
 * page.test.tsx Phase 182 mock block) so the sheets render without making
 * real API calls.
 *
 * Reference: .planning/quick/260506-d45-fix-sheet-hook-double-mount-and-raf-body/260506-d45-PLAN.md
 *
 * If a future phase adds optional fixture-injection props to the *Sheet
 * components, expand this module to export typed fixture objects.
 */

export const DEVICE_KEYS = ['stove', 'climate', 'lights', 'sonos', 'plugs'] as const;
export type DeviceKey = typeof DEVICE_KEYS[number];

/**
 * Italian display labels for the 5 launcher pills.
 */
export const DEVICE_LABELS: Record<DeviceKey, string> = {
  stove:   'Stufa',
  climate: 'Clima',
  lights:  'Luci',
  sonos:   'Sonos',
  plugs:   'Prese',
};
