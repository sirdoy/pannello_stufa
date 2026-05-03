/**
 * sheetFixtures — Phase 182 (D-13)
 *
 * The 5 device sheet components (StoveSheet, ClimateSheet, LightsSheet,
 * SonosSheet, PlugsSheet) take ZERO props and self-fetch via internal hooks.
 * They cannot receive fixture data via props.
 *
 * This file therefore lists the device keys used by Section10SheetGallery
 * launcher row. The Jest page test mocks the underlying device hooks (see
 * page.test.tsx Phase 182 mock block) so the sheets render without making
 * real API calls.
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
