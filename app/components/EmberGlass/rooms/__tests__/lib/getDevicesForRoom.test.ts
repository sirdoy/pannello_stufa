/**
 * getDevicesForRoom — fixture-based unit tests (Plan 179-01, Wave 0).
 *
 * Pure synchronous function — no mocking needed, just plain object fixtures.
 * Covers all 11 behavior cases from the plan:
 *   1. Stove in Soggiorno with EXTRA_DEVICES appended
 *   2. Stove is hardcoded to Soggiorno (D-11) — not in other rooms
 *   3. Thermostat zones map via ROOM_ALIASES — thermo (NATherm1) vs valve (NRV)
 *   4. Thermostat zones with unmatched names are dropped
 *   5. Lights with room_name: null are filtered out (D-13)
 *   6. Plugs are hardcoded to 'Cucina' (D-14)
 *   7. Sonos groups map via ROOM_ALIASES with extra.coordinator populated
 *   8. EXTRA_DEVICES are appended after live devices and tagged mock: true
 *   9. Empty live state for Bagno → only EXTRA_DEVICES sensor
 *  10. Returned array is ordered per CATEGORY_ORDER (D-17)
 *  11. Unknown room name returns empty array (defensive)
 *
 * RESEARCH §Aggregator Reconciliation field names:
 * - Stove: isAccesa → on, powerLevel, fanLevel (no temp/target)
 * - Thermostat: topology.rooms[].name → zone.name; modules[].type: 'NATherm1'→thermo, 'NRV'→valve
 * - Lights: room_name (string|null), room_id as groupId, brightness 0-100 (already converted)
 * - Plugs: device_id → id, custom_name ?? device_id → name, switch_on === true → on, power_w → power
 * - Sonos: zones[].label → name, group_id → id, coordinator_uid → coordinator
 */

import { getDevicesForRoom } from '../../lib/getDevicesForRoom';
import type { AggregatorState } from '../../types';

// Minimal empty state helper
const emptyState = (): AggregatorState => ({
  stove: { on: false, temp: 0, powerLevel: 0, fanLevel: 0 },
  thermostat: { zones: [] },
  lights: { lights: [] },
  plugs: { plugs: [] },
  sonos: { groups: [] },
});

// --- Test 1: Stove in Soggiorno + EXTRA_DEVICES appended ---
describe('getDevicesForRoom', () => {
  it('Test 1: returns stove in Soggiorno when stove is on', () => {
    const state: AggregatorState = {
      ...emptyState(),
      stove: { on: true, temp: 0, powerLevel: 3, fanLevel: 2 },
    };
    const devices = getDevicesForRoom(state, 'Soggiorno');
    // First live device should be stove
    const stove = devices.find((d) => d.kind === 'stove');
    expect(stove).toBeDefined();
    expect(stove?.on).toBe(true);
    expect(stove?.kind).toBe('stove');
    expect(stove?.name).toBe('Stufa Thermorossi');
    // EXTRA_DEVICES Soggiorno contains tv + shade — they should be appended
    const extra = devices.filter((d) => d.mock === true);
    expect(extra.length).toBeGreaterThanOrEqual(2);
    const tv = extra.find((d) => d.kind === 'tv');
    const shade = extra.find((d) => d.kind === 'shade');
    expect(tv).toBeDefined();
    expect(shade).toBeDefined();
  });

  // --- Test 2: Stove hardcoded to Soggiorno (D-11) ---
  it('Test 2: stove is NOT present in rooms other than Soggiorno', () => {
    const state: AggregatorState = {
      ...emptyState(),
      stove: { on: true, temp: 0, powerLevel: 5, fanLevel: 3 },
    };
    for (const room of ['Cucina', 'Camera', 'Studio', 'Bagno', 'Ingresso'] as const) {
      const devices = getDevicesForRoom(state, room);
      const stove = devices.find((d) => d.kind === 'stove');
      expect(stove).toBeUndefined();
    }
  });

  // --- Test 3: Thermostat zones → ROOM_ALIASES, thermo vs valve by module type ---
  it('Test 3: thermostat zones map via ROOM_ALIASES — thermo for NATherm1, valve for NRV', () => {
    const state: AggregatorState = {
      ...emptyState(),
      thermostat: {
        zones: [
          // 'Camera da letto' alias maps to 'Camera'; module type NATherm1 → thermo
          {
            name: 'Camera da letto',
            on: true,
            current: 20.5,
            target: 21.0,
            kind: 'thermo',
            roomId: 'room-1',
          },
          // 'Cucina' maps to 'Cucina'; module type NRV → valve
          {
            name: 'Cucina',
            on: true,
            current: 19.0,
            target: 20.0,
            kind: 'valve',
            roomId: 'room-2',
          },
        ],
      },
    };
    const cameraDevices = getDevicesForRoom(state, 'Camera');
    const thermoDevice = cameraDevices.find((d) => d.kind === 'thermo');
    expect(thermoDevice).toBeDefined();
    expect(thermoDevice?.name).toBe('Camera da letto');
    expect(thermoDevice?.on).toBe(true);
    expect(thermoDevice?.value).toContain('20.5');
    expect(thermoDevice?.value).toContain('21.0');

    const cucinaDevices = getDevicesForRoom(state, 'Cucina');
    const valveDevice = cucinaDevices.find((d) => d.kind === 'valve');
    expect(valveDevice).toBeDefined();
    expect(valveDevice?.name).toBe('Cucina');
  });

  // --- Test 4: Unmatched thermostat zone names are dropped ---
  it('Test 4: thermostat zones with unmatched names are dropped from all rooms', () => {
    const state: AggregatorState = {
      ...emptyState(),
      thermostat: {
        zones: [
          {
            name: 'UnknownRoom',
            on: true,
            current: 21.0,
            target: 22.0,
            kind: 'thermo',
            roomId: 'room-99',
          },
        ],
      },
    };
    for (const room of ['Soggiorno', 'Cucina', 'Camera', 'Studio', 'Bagno', 'Ingresso'] as const) {
      const devices = getDevicesForRoom(state, room);
      const thermo = devices.find((d) => d.kind === 'thermo' || d.kind === 'valve');
      expect(thermo).toBeUndefined();
    }
  });

  // --- Test 5: Lights with room_name: null are filtered out (D-13) ---
  it('Test 5: lights with room_name null are dropped; lights with mapped room_name appear', () => {
    const state: AggregatorState = {
      ...emptyState(),
      lights: {
        lights: [
          // Should be dropped — null room_name
          { name: 'Lampada orfana', on: true, room_name: null, groupId: 'g-null', brightness: 80 },
          // Should appear in Soggiorno
          { name: 'Lampada soggiorno', on: true, room_name: 'Soggiorno', groupId: 'g-sog', brightness: 90 },
          // Should appear in Camera (via alias 'Camera da letto' → 'Camera')
          { name: 'Lampada camera', on: false, room_name: 'Camera da letto', groupId: 'g-cam', brightness: 0 },
        ],
      },
    };
    const sogDevices = getDevicesForRoom(state, 'Soggiorno');
    const sogLight = sogDevices.find((d) => d.kind === 'light' && !d.mock);
    expect(sogLight).toBeDefined();
    expect(sogLight?.name).toBe('Lampada soggiorno');
    expect(sogLight?.extra.groupId).toBe('g-sog');

    const camDevices = getDevicesForRoom(state, 'Camera');
    const camLight = camDevices.find((d) => d.kind === 'light' && !d.mock);
    expect(camLight).toBeDefined();
    expect(camLight?.name).toBe('Lampada camera');

    // Null-room light should not appear anywhere
    for (const room of ['Soggiorno', 'Cucina', 'Camera', 'Studio', 'Bagno', 'Ingresso'] as const) {
      const devices = getDevicesForRoom(state, room);
      const orfana = devices.find((d) => d.name === 'Lampada orfana');
      expect(orfana).toBeUndefined();
    }
  });

  // --- Test 6: Plugs hardcoded to 'Cucina' (D-14) ---
  it('Test 6: plugs are hardcoded to Cucina and NOT present in any other room', () => {
    const state: AggregatorState = {
      ...emptyState(),
      plugs: {
        plugs: [
          { id: 'p-frigo', name: 'Frigo', on: true, power: 750, today_kwh: 1.2 },
          { id: 'p-lavatrice', name: 'Lavatrice', on: false, power: 0 },
        ],
      },
    };
    const cucinaDevices = getDevicesForRoom(state, 'Cucina');
    const plugs = cucinaDevices.filter((d) => d.kind === 'plug');
    expect(plugs).toHaveLength(2);
    expect(plugs[0]?.name).toBe('Frigo');
    expect(plugs[0]?.on).toBe(true);
    expect(plugs[0]?.extra.id).toBe('p-frigo');

    // Plugs should NOT appear in other rooms
    for (const room of ['Soggiorno', 'Camera', 'Studio', 'Bagno', 'Ingresso'] as const) {
      const devices = getDevicesForRoom(state, room);
      const plugsInOtherRoom = devices.filter((d) => d.kind === 'plug' && !d.mock);
      expect(plugsInOtherRoom).toHaveLength(0);
    }
  });

  // --- Test 7: Sonos groups map via ROOM_ALIASES with extra.coordinator ---
  it('Test 7: Sonos groups map via ROOM_ALIASES and carry extra.coordinator', () => {
    const state: AggregatorState = {
      ...emptyState(),
      sonos: {
        groups: [
          // 'Soggiorno' maps directly
          {
            id: 'grp-1',
            name: 'Soggiorno',
            playing: true,
            track: 'Bohemian Rhapsody',
            artist: 'Queen',
            volume: 42,
            coordinator: 'uid-coordinator-1',
          },
          // 'Salone' alias → 'Soggiorno'
          {
            id: 'grp-2',
            name: 'Salone',
            playing: false,
            track: '',
            artist: '',
            volume: 20,
            coordinator: 'uid-coordinator-2',
          },
        ],
      },
    };
    const devices = getDevicesForRoom(state, 'Soggiorno');
    const sonosDevices = devices.filter((d) => d.kind === 'sonos');
    expect(sonosDevices).toHaveLength(2);
    const first = sonosDevices[0];
    expect(first?.extra.coordinator).toBe('uid-coordinator-1');
    expect(first?.on).toBe(true);
    expect(first?.value).toBe('Bohemian Rhapsody');
  });

  // --- Test 8: EXTRA_DEVICES are appended after live devices with mock: true ---
  it('Test 8: EXTRA_DEVICES are appended after live devices and tagged mock: true', () => {
    const state: AggregatorState = {
      ...emptyState(),
      stove: { on: true, temp: 0, powerLevel: 3, fanLevel: 2 },
    };
    const devices = getDevicesForRoom(state, 'Soggiorno');
    // Live devices (stove) should come before EXTRA_DEVICES (tv, shade)
    const stoveIdx = devices.findIndex((d) => d.kind === 'stove');
    const tvIdx = devices.findIndex((d) => d.kind === 'tv' && d.mock);
    const shadeIdx = devices.findIndex((d) => d.kind === 'shade' && d.mock);
    expect(stoveIdx).toBeGreaterThanOrEqual(0);
    expect(tvIdx).toBeGreaterThan(stoveIdx);
    expect(shadeIdx).toBeGreaterThan(stoveIdx);
    // All EXTRA_DEVICES should have mock: true
    devices.filter((d) => d.kind === 'tv' || d.kind === 'shade').forEach((d) => {
      expect(d.mock).toBe(true);
    });
  });

  // --- Test 9: Bagno with empty live state → only EXTRA_DEVICES sensor ---
  it('Test 9: Bagno with empty live state returns only the EXTRA_DEVICES humidity sensor', () => {
    const devices = getDevicesForRoom(emptyState(), 'Bagno');
    expect(devices).toHaveLength(1);
    const sensor = devices[0];
    expect(sensor?.kind).toBe('sensor');
    expect(sensor?.mock).toBe(true);
    expect(sensor?.name).toBe('Umidità bagno');
  });

  // --- Test 10: CATEGORY_ORDER ordering ---
  it('Test 10: returned array is ordered per CATEGORY_ORDER within each category', () => {
    const state: AggregatorState = {
      ...emptyState(),
      // Add plug and light to Cucina — plug comes after light in CATEGORY_ORDER
      lights: {
        lights: [
          { name: 'Luce cucina', on: true, room_name: 'Cucina', groupId: 'g-cuc', brightness: 75 },
        ],
      },
      plugs: {
        plugs: [
          { id: 'p-frigo', name: 'Frigo', on: true, power: 750 },
        ],
      },
      thermostat: {
        zones: [
          { name: 'Cucina', on: true, current: 19.0, target: 20.0, kind: 'valve', roomId: 'room-cuc' },
        ],
      },
    };
    const devices = getDevicesForRoom(state, 'Cucina');
    // Live: valve (from thermo), then light, then plug
    const liveDevices = devices.filter((d) => !d.mock);
    const kindOrder = liveDevices.map((d) => d.kind);
    // valve (index 2 in CATEGORY_ORDER) < light (index 3) < plug (index 4)
    const valveIdx = kindOrder.indexOf('valve');
    const lightIdx = kindOrder.indexOf('light');
    const plugIdx = kindOrder.indexOf('plug');
    expect(valveIdx).toBeLessThan(lightIdx);
    expect(lightIdx).toBeLessThan(plugIdx);
  });

  // --- Test 11: Unknown room name returns empty array ---
  it('Test 11: unknown room name returns an empty array', () => {
    // @ts-expect-error — intentionally passing invalid room name to test defensive behavior
    const devices = getDevicesForRoom(emptyState(), 'UnknownRoom');
    expect(devices).toEqual([]);
  });

  // --- Extra: value string formatting ---
  it('value string: stove on = "N/5", stove off = "Spenta"', () => {
    const onState: AggregatorState = {
      ...emptyState(),
      stove: { on: true, temp: 0, powerLevel: 3, fanLevel: 2 },
    };
    const offState: AggregatorState = {
      ...emptyState(),
      stove: { on: false, temp: 0, powerLevel: 0, fanLevel: 0 },
    };
    const onDevices = getDevicesForRoom(onState, 'Soggiorno');
    const offDevices = getDevicesForRoom(offState, 'Soggiorno');
    const onStove = onDevices.find((d) => d.kind === 'stove');
    const offStove = offDevices.find((d) => d.kind === 'stove');
    expect(onStove?.value).toBe('3/5');
    expect(offStove?.value).toBe('Spenta');
  });

  it('value string: thermostat zone shows "current° → target°"', () => {
    const state: AggregatorState = {
      ...emptyState(),
      thermostat: {
        zones: [
          { name: 'Soggiorno', on: true, current: 21.3, target: 22.0, kind: 'thermo', roomId: 'r-1' },
        ],
      },
    };
    const devices = getDevicesForRoom(state, 'Soggiorno');
    const thermo = devices.find((d) => d.kind === 'thermo');
    expect(thermo?.value).toBe('21.3° → 22.0°');
  });

  it('value string: light on = "N%", light off = "Spenta"', () => {
    const state: AggregatorState = {
      ...emptyState(),
      lights: {
        lights: [
          { name: 'Luce', on: true, room_name: 'Soggiorno', groupId: 'g-1', brightness: 80 },
          { name: 'Luce off', on: false, room_name: 'Soggiorno', groupId: 'g-2', brightness: 0 },
        ],
      },
    };
    const devices = getDevicesForRoom(state, 'Soggiorno');
    const lightOn = devices.find((d) => d.kind === 'light' && d.name === 'Luce');
    const lightOff = devices.find((d) => d.kind === 'light' && d.name === 'Luce off');
    expect(lightOn?.value).toBe('80%');
    expect(lightOff?.value).toBe('Spenta');
  });

  it('value string: sonos playing = track name, paused = "In pausa"', () => {
    const state: AggregatorState = {
      ...emptyState(),
      sonos: {
        groups: [
          { id: 'g-1', name: 'Soggiorno', playing: true, track: 'Yesterday', artist: 'Beatles', volume: 50, coordinator: 'uid-1' },
          { id: 'g-2', name: 'Cucina', playing: false, track: '', artist: '', volume: 30, coordinator: 'uid-2' },
        ],
      },
    };
    const sogDevices = getDevicesForRoom(state, 'Soggiorno');
    const cucinaDevices = getDevicesForRoom(state, 'Cucina');
    const playing = sogDevices.find((d) => d.kind === 'sonos');
    const paused = cucinaDevices.find((d) => d.kind === 'sonos');
    expect(playing?.value).toBe('Yesterday');
    expect(paused?.value).toBe('In pausa');
  });
});
