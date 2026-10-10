import { test, expect } from '../fixtures';
import type { Page, Request } from '@playwright/test';
import { waitForHydration } from '../helpers/hydration';
import type { HouseStatusResponse } from '@/types/rooms';
import type { HueLight } from '@/types/hueProxy';
import type { TuyaPlug } from '@/types/tuyaProxy';
import type { DirigeraSensor, DirigeraHealthResponse, DirigeraSensorsResponse } from '@/types/dirigeraProxy';
import type { CameraStatus } from '@/types/netatmoProxy';
import type {
  SonosDeviceResponse,
  SonosPlaybackResponse,
  SonosVolumeResponse,
  SonosZoneResponse,
} from '@/types/sonosProxy';
import type { ThermorossiStatusResponse } from '@/types/thermorossiProxy';

/**
 * Rooms tab (/stanze) smoke spec — ROADMAP M84 + M81.
 *
 * The rooms and their devices are the ones stored on the Pi (`GET /api/rooms/house/status`); each
 * device is joined with the live data of its provider through the registry `device_id`. The spec
 * mocks the house status with three rooms shaped like the real house and the provider endpoints
 * with matching ids, then checks:
 *   - one card per room, no device that is not in the house status (the old hard-coded
 *     "TV soggiorno" / "Tapparella" are gone);
 *   - a room sheet lists its devices by registry `custom_name`;
 *   - the toggle of a light sends the command to that single light.
 *
 * The WebSocket is kept closed (`/api/ws-token` answers 503) so the provider hooks read the mocked
 * REST endpoints instead of live snapshots of the real backend.
 *
 * Auth: per-worker login session from tests/fixtures.ts.
 */

// ----- Ids shared by the house status and the provider mocks -----

const STOVE_ID = 'stove-1';
const LIGHT_SOFA_ID = '1';
const LIGHT_READING_ID = '2';
const VALVE_MODULE_ID = '09:00:00:00:00:01';
const NETATMO_ROOM_ID = 'netatmo-room-1';
const SPEAKER_UID = 'RINCON_SALA000001400';
const WINDOW_SENSOR_ID = 'window-sala_1';
const AIR_SENSOR_ID = 'air-cucina_1';
const PLUG_ID = 'plug-bollitore';
const CAMERA_ID = '70:ee:50:00:00:01';

const ROOM_SALA = 1;
const ROOM_CUCINA = 2;
const ROOM_GARAGE = 3;

// ----- House status: rooms and members as the Pi sends them (docs/api/rooms.md) -----

const HOUSE_STATUS: HouseStatusResponse = {
  rooms: [
    {
      room_id: ROOM_SALA,
      room_name: 'Sala',
      devices: [
        {
          device_registry_id: 11,
          device_id: STOVE_ID,
          custom_name: 'Stufa a pellet',
          provider_name: 'thermorossi',
          device_type: 'stove',
          status: 'available',
          data: { status: 'available', active: true, temperature: null, power_level: 3 },
        },
        {
          device_registry_id: 12,
          device_id: LIGHT_SOFA_ID,
          custom_name: 'Lampada divano',
          provider_name: 'hue',
          device_type: 'light',
          status: 'available',
          data: { status: 'available', on: true, brightness: 200, reachable: true },
        },
        {
          device_registry_id: 13,
          device_id: LIGHT_READING_ID,
          custom_name: 'Lampada lettura',
          provider_name: 'hue',
          device_type: 'light',
          status: 'available',
          data: { status: 'available', on: false, brightness: 120, reachable: true },
        },
        {
          device_registry_id: 14,
          device_id: VALVE_MODULE_ID,
          custom_name: 'Valvola sala',
          provider_name: 'netatmo',
          device_type: 'valve',
          status: 'available',
          data: { status: 'available', setpoint_temp: 21, measured_temp: 20.5, heating: false },
        },
        {
          device_registry_id: 15,
          device_id: SPEAKER_UID,
          custom_name: 'Sonos sala',
          provider_name: 'sonos',
          device_type: 'speaker',
          status: 'available',
          data: { status: 'available', playing: true, volume: 32, group_name: 'Sala' },
        },
        {
          device_registry_id: 16,
          device_id: WINDOW_SENSOR_ID,
          custom_name: 'Finestra sala',
          provider_name: 'dirigera',
          device_type: 'sensor',
          status: 'available',
          data: {
            status: 'available',
            temperature: null,
            humidity: null,
            battery_percentage: 87,
            is_reachable: true,
          },
        },
      ],
      device_count: 6,
      available_count: 6,
      unavailable_count: 0,
    },
    {
      room_id: ROOM_CUCINA,
      room_name: 'Cucina',
      devices: [
        {
          device_registry_id: 21,
          device_id: AIR_SENSOR_ID,
          custom_name: 'Aria cucina',
          provider_name: 'dirigera',
          device_type: 'sensor',
          status: 'available',
          data: {
            status: 'available',
            temperature: null,
            humidity: null,
            battery_percentage: null,
            is_reachable: true,
          },
        },
        {
          device_registry_id: 22,
          device_id: PLUG_ID,
          custom_name: 'Presa bollitore',
          provider_name: 'tuya',
          device_type: 'plug',
          status: 'available',
          data: { status: 'available', switch_on: true, power_w: 450, energy_kwh: 2.4 },
        },
      ],
      device_count: 2,
      available_count: 2,
      unavailable_count: 0,
    },
    {
      room_id: ROOM_GARAGE,
      room_name: 'Garage',
      devices: [
        {
          device_registry_id: 31,
          device_id: CAMERA_ID,
          custom_name: 'Telecamera garage',
          provider_name: 'netatmo',
          device_type: 'camera',
          status: 'available',
          data: { status: 'available', is_reachable: true },
        },
      ],
      device_count: 1,
      available_count: 1,
      unavailable_count: 0,
    },
  ],
  total_devices: 9,
  total_available: 9,
  total_unavailable: 0,
};

// ----- Provider payloads, with the same ids -----

function hueLight(light_id: string, name: string, on: boolean, brightness: number): HueLight {
  return {
    light_id,
    name,
    on,
    brightness,
    color_temp: null,
    ct_kelvin: null,
    hue: null,
    saturation: null,
    colormode: null,
    reachable: true,
    capability_tier: 'white',
    room_id: '1',
    room_name: 'Sala',
    model_id: 'LWA001',
    light_type: 'Dimmable light',
  };
}

const HUE_LIGHTS: HueLight[] = [
  hueLight(LIGHT_SOFA_ID, 'Hue white lamp 1', true, 200),
  hueLight(LIGHT_READING_ID, 'Hue white lamp 2', false, 120),
];

const STOVE_STATUS: ThermorossiStatusResponse = {
  stove_state: 'working',
  power_level: 3,
  fan_level: 2,
  data_freshness: 'LIVE',
  last_poll_at: '2026-10-10T08:00:00Z',
  error_code: null,
  error_description: null,
};

/** v1 raw-proxy shape of /netatmo/homesdata: the valve module sits in a Netatmo room */
const NETATMO_HOMESDATA = {
  body: {
    homes: [
      {
        id: 'netatmo-home-1',
        name: 'Casa',
        rooms: [{ id: NETATMO_ROOM_ID, name: 'Sala', module_ids: [VALVE_MODULE_ID] }],
        modules: [{ id: VALVE_MODULE_ID, type: 'NRV', name: 'Valvola sala', room_id: NETATMO_ROOM_ID }],
        schedules: [],
      },
    ],
  },
};

const NETATMO_HOMESTATUS = {
  rooms: [
    {
      home_id: 'netatmo-home-1',
      room_id: NETATMO_ROOM_ID,
      room_name: 'Sala',
      temperature: 20.5,
      therm_setpoint_temperature: 21,
      heating_power_request: 0,
    },
  ],
  data_freshness: 'LIVE',
};

const CAMERAS: CameraStatus[] = [
  {
    camera_id: CAMERA_ID,
    name: 'Garage',
    device_type: 'NOC',
    status: 'on',
    sd_status: 'on',
    alim_status: 'on',
    firmware: '3.2.1',
    is_local: true,
  },
];

const TUYA_PLUGS: TuyaPlug[] = [
  {
    device_id: PLUG_ID,
    switch_on: true,
    power_w: 450,
    voltage_v: 230,
    current_ma: 1950,
    energy_kwh: 2.4,
    countdown_s: 0,
    data_freshness: 'LIVE',
    last_poll_at: '2026-10-10T08:00:00Z',
    custom_name: 'Presa bollitore',
    device_type: 'plug',
  },
];

const SONOS_SPEAKERS: SonosDeviceResponse[] = [
  {
    uid: SPEAKER_UID,
    name: 'Sala',
    ip: '192.168.178.60',
    model: 'Sonos One',
    firmware: null,
    serial: null,
    role: 'speaker',
    is_visible: true,
    is_coordinator: true,
  },
];

const SONOS_ZONES: SonosZoneResponse[] = [
  {
    group_id: SPEAKER_UID,
    label: 'Sala',
    coordinator_uid: SPEAKER_UID,
    coordinator_name: 'Sala',
    member_count: 1,
    members: [{ uid: SPEAKER_UID, name: 'Sala', ip: '192.168.178.60', role: 'speaker' }],
  },
];

const SONOS_PLAYBACK: SonosPlaybackResponse = {
  group_id: SPEAKER_UID,
  transport_state: 'PLAYING',
  title: 'Lofi Beats',
  artist: 'ChilledCow',
  album: null,
  album_art_url: null,
  position: '00:01:00',
  duration: '00:03:00',
  source_type: 'streaming',
};

const SONOS_VOLUME: SonosVolumeResponse = { uid: SPEAKER_UID, volume: 32, mute: false };

function dirigeraSensor(overrides: Partial<DirigeraSensor> & Pick<DirigeraSensor, 'id' | 'type'>): DirigeraSensor {
  return {
    custom_name: null,
    room: null,
    firmware_version: '1.0.0',
    battery_percentage: null,
    is_reachable: true,
    last_seen: '2026-10-10T08:00:00Z',
    ...overrides,
  };
}

const DIRIGERA_SENSORS: DirigeraSensorsResponse = {
  sensors: [
    dirigeraSensor({
      id: WINDOW_SENSOR_ID,
      type: 'openCloseSensor',
      custom_name: 'Finestra sala',
      battery_percentage: 87,
      is_open: true,
    }),
    dirigeraSensor({
      id: AIR_SENSOR_ID,
      type: 'environmentSensor',
      custom_name: 'Aria cucina',
      temperature: 21.3,
      humidity: 48,
      co2: 612,
      pm25: 4,
    }),
  ],
  count: 2,
  is_stale: false,
  fetched_at: '2026-10-10T08:00:00Z',
  data_freshness: 'LIVE',
};

const DIRIGERA_HEALTH: DirigeraHealthResponse = {
  firmware_version: '2.800.0',
  connected_sensors: 2,
  is_reachable: true,
};

// ----- Route mocks -----

async function json(page: Page, glob: string, body: unknown, status = 200): Promise<void> {
  await page.route(glob, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

/**
 * Mocks the house status and every provider endpoint the Rooms tab reads.
 * Playwright checks the routes registered last first: the provider catch-alls come before the
 * specific paths, so an endpoint not listed here never reaches the real backend.
 */
async function mockHouse(page: Page): Promise<void> {
  // No WebSocket: the hooks fall back to the REST endpoints mocked below
  await json(page, '**/api/ws-token', { error: 'WebSocket off in this spec' }, 503);

  await json(page, '**/api/rooms/house/status', HOUSE_STATUS);

  await json(page, '**/api/v1/thermorossi/status', STOVE_STATUS);

  await json(page, '**/api/v1/hue/health', { connected: true, data_freshness: 'LIVE' });
  await json(page, '**/api/v1/hue/groups', { groups: [] });
  await json(page, '**/api/v1/hue/scenes', { scenes: [] });
  await json(page, '**/api/v1/hue/lights', { lights: HUE_LIGHTS });
  // Command on a single light: the backend re-polls and confirms before answering
  await json(page, '**/api/v1/hue/lights/*/state', { data_confirmed: true });

  await json(page, '**/api/v1/netatmo/homesdata*', NETATMO_HOMESDATA);
  await json(page, '**/api/v1/netatmo/homestatus*', NETATMO_HOMESTATUS);
  await json(page, '**/api/v1/netatmo/camera/status', { cameras: CAMERAS, data_freshness: 'LIVE' });

  await json(page, '**/api/tuya/plugs', { plugs: TUYA_PLUGS });

  await json(page, '**/api/v1/sonos/**', { detail: 'Not mocked' }, 404);
  await json(page, '**/api/v1/sonos/speakers', { speakers: SONOS_SPEAKERS });
  await json(page, '**/api/v1/sonos/zones', { zones: SONOS_ZONES });
  await json(page, '**/api/v1/sonos/zones/*/playback', SONOS_PLAYBACK);
  await json(page, '**/api/v1/sonos/speakers/*/volume', SONOS_VOLUME);

  await json(page, '**/api/v1/dirigera/health', DIRIGERA_HEALTH);
  await json(page, '**/api/v1/dirigera/sensors', DIRIGERA_SENSORS);
}

const roomCard = (page: Page, roomId: number) => page.getByTestId(`room-card-${roomId}`);
const roomSheet = (page: Page, roomId: number) => page.getByTestId(`stanze-sheet-${roomId}`);
const deviceCard = (page: Page, registryId: number) => page.getByTestId(`stanze-device-${registryId}`);

async function openRoom(page: Page, roomId: number): Promise<void> {
  await roomCard(page, roomId).click();
  await expect(roomSheet(page, roomId)).toBeVisible({ timeout: 5000 });
}

// ----- Specs -----

test.describe('Rooms tab — rooms and devices of the Pi (M84)', () => {
  test.beforeEach(async ({ page }) => {
    await mockHouse(page);
    await page.goto('/stanze');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
  });

  test('one card per room of the house status', async ({ page }) => {
    for (const room of HOUSE_STATUS.rooms) {
      const card = roomCard(page, room.room_id);
      await expect(card, `card of "${room.room_name}"`).toBeVisible({ timeout: 10000 });
      await expect(card).toContainText(room.room_name);
      // Count badge "{active}/{total}": the total is the number of members of the room
      await expect(card).toContainText(new RegExp(`\\d+/${room.devices.length}`));
    }

    // Exactly the three rooms of the Pi: no hard-coded room is left
    await expect(page.locator('[data-testid^="room-card-"]')).toHaveCount(HOUSE_STATUS.rooms.length);
    await expect(page.getByText('3 stanze')).toBeVisible();
  });

  test('no device that is not in the house status', async ({ page }) => {
    await expect(roomCard(page, ROOM_SALA)).toBeVisible({ timeout: 10000 });

    await openRoom(page, ROOM_SALA);

    // The old hard-coded extras of the living room are gone, in the grid and in the sheet
    await expect(page.getByText(/TV soggiorno/i)).toHaveCount(0);
    await expect(page.getByText(/Tapparella/i)).toHaveCount(0);
    await expect(page.locator('[data-kind="tv"], [data-kind="shade"]')).toHaveCount(0);
    await expect(roomSheet(page, ROOM_SALA).locator('[data-testid^="stanze-device-"]')).toHaveCount(6);
  });

  test('opening "Sala" lists its devices by custom name', async ({ page }) => {
    await expect(roomCard(page, ROOM_SALA)).toBeVisible({ timeout: 10000 });
    await openRoom(page, ROOM_SALA);

    const sala = HOUSE_STATUS.rooms.find((r) => r.room_id === ROOM_SALA)!;
    for (const device of sala.devices) {
      const card = deviceCard(page, device.device_registry_id);
      await expect(card, `device "${device.custom_name}"`).toBeVisible();
      await expect(card).toContainText(device.custom_name);
    }

    // Each member is rendered as the kind of its provider
    await expect(deviceCard(page, 11)).toHaveAttribute('data-kind', 'stove');
    await expect(deviceCard(page, 12)).toHaveAttribute('data-kind', 'light');
    await expect(deviceCard(page, 13)).toHaveAttribute('data-kind', 'light');
    await expect(deviceCard(page, 14)).toHaveAttribute('data-kind', 'valve');
    await expect(deviceCard(page, 15)).toHaveAttribute('data-kind', 'sonos');
    await expect(deviceCard(page, 16)).toHaveAttribute('data-kind', 'sensor');

    // Live state joined through the registry device_id
    await expect(deviceCard(page, 12)).toContainText('Accesa');
    await expect(deviceCard(page, 13)).toContainText('Spenta');
    await expect(deviceCard(page, 14)).toContainText('20.5° → 21.0°');
    await expect(deviceCard(page, 16)).toContainText('Aperta');

    await expect(roomSheet(page, ROOM_SALA)).toContainText(/\d di 6 attivi/);
  });

  test('"Cucina" and "Garage" show only their own devices', async ({ page }) => {
    await expect(roomCard(page, ROOM_CUCINA)).toBeVisible({ timeout: 10000 });
    await openRoom(page, ROOM_CUCINA);

    await expect(deviceCard(page, 21)).toContainText('Aria cucina');
    await expect(deviceCard(page, 22)).toContainText('Presa bollitore');
    await expect(roomSheet(page, ROOM_CUCINA).locator('[data-testid^="stanze-device-"]')).toHaveCount(2);
    await expect(roomSheet(page, ROOM_CUCINA)).not.toContainText('Lampada divano');

    await page.keyboard.press('Escape');
    await expect(roomSheet(page, ROOM_CUCINA)).toBeHidden({ timeout: 5000 });

    await openRoom(page, ROOM_GARAGE);
    await expect(deviceCard(page, 31)).toContainText('Telecamera garage');
    await expect(deviceCard(page, 31)).toHaveAttribute('data-kind', 'camera');
    await expect(roomSheet(page, ROOM_GARAGE).locator('[data-testid^="stanze-device-"]')).toHaveCount(1);
  });

  test('the toggle of a light sends the command to that single light', async ({ page }) => {
    const stateRequests: Request[] = [];
    page.on('request', (request) => {
      if (/\/api\/v1\/hue\/lights\/[^/]+\/state$/.test(new URL(request.url()).pathname)) {
        stateRequests.push(request);
      }
    });

    await expect(roomCard(page, ROOM_SALA)).toBeVisible({ timeout: 10000 });
    await openRoom(page, ROOM_SALA);

    // "Lampada divano" is on: its switch turns it off
    const toggle = deviceCard(page, 12).getByRole('switch', { name: 'Spegni Lampada divano' });
    await expect(toggle).toBeVisible();

    const [request] = await Promise.all([
      page.waitForRequest(
        (r) => r.method() === 'PUT' && new URL(r.url()).pathname === `/api/v1/hue/lights/${LIGHT_SOFA_ID}/state`,
        { timeout: 5000 },
      ),
      toggle.click(),
    ]);

    expect(request.postDataJSON()).toEqual({ on: false });

    // One command, to light "1" only: the other light and the Hue room are not touched
    expect(stateRequests.map((r) => new URL(r.url()).pathname)).toEqual([
      `/api/v1/hue/lights/${LIGHT_SOFA_ID}/state`,
    ]);

    // The tap on the switch does not close the sheet
    await expect(roomSheet(page, ROOM_SALA)).toBeVisible();
  });
});
