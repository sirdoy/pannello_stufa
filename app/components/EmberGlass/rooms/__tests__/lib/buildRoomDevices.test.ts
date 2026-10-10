/**
 * buildRoomDevices spec (ROADMAP M84).
 *
 * The members of a room come from the Pi; each one is joined with the live data of its provider.
 * One block per provider: live data wins, the summary of the room status is the fallback, and a
 * device without any reading is "Non risponde" (rule M78), never a made-up state.
 */

import { buildRoomDevices } from '../../lib/buildRoomDevices';
import { CATEGORY_ORDER, TONE_FOR_KIND } from '../../lib/rooms-config';
import type { LiveState } from '../../types';
import type { DeviceStatus } from '@/types/rooms';
import type { HueLight } from '@/types/hueProxy';
import type { TuyaPlug } from '@/types/tuyaProxy';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { CameraStatus } from '@/types/netatmoProxy';
import type { SonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';

// --- Fixtures -----------------------------------------------------------

const NOTHING_LOADED: LiveState = {
  stove: null,
  thermostat: { topology: null, status: null },
  lights: null,
  plugs: null,
  sonos: null,
  sensors: null,
  cameras: null,
};

function live(over: Partial<LiveState> = {}): LiveState {
  return { ...NOTHING_LOADED, ...over };
}

function member(over: Partial<DeviceStatus> & Pick<DeviceStatus, 'provider_name'>): DeviceStatus {
  return {
    device_registry_id: 1,
    device_id: 'dev-1',
    custom_name: 'Dispositivo di prova',
    device_type: '',
    status: 'available',
    data: null,
    ...over,
  };
}

/** Builds the single device of a one-member room */
function one(m: DeviceStatus, state: LiveState = NOTHING_LOADED) {
  const devices = buildRoomDevices([m], state);
  expect(devices).toHaveLength(1);
  return devices[0]!;
}

function hueLight(over: Partial<HueLight> = {}): HueLight {
  return {
    light_id: '5',
    name: 'Hue 5',
    on: true,
    brightness: 254,
    color_temp: null,
    ct_kelvin: null,
    hue: null,
    saturation: null,
    colormode: null,
    reachable: true,
    capability_tier: 'dimmable' as HueLight['capability_tier'],
    room_id: null,
    room_name: null,
    model_id: null,
    light_type: null,
    ...over,
  };
}

function tuyaPlug(over: Partial<TuyaPlug> = {}): TuyaPlug {
  return {
    device_id: 'plug-1',
    switch_on: true,
    power_w: 450,
    voltage_v: 230,
    current_ma: 1900,
    energy_kwh: 2.5,
    countdown_s: 0,
    data_freshness: 'LIVE',
    last_poll_at: null,
    custom_name: null,
    device_type: null,
    ...over,
  };
}

function dirigeraSensor(over: Partial<DirigeraSensor> = {}): DirigeraSensor {
  return {
    id: 'sensor-1',
    type: 'openCloseSensor',
    custom_name: null,
    room: null,
    firmware_version: null,
    battery_percentage: 80,
    is_reachable: true,
    last_seen: null,
    ...over,
  };
}

function camera(over: Partial<CameraStatus> = {}): CameraStatus {
  return {
    camera_id: 'cam-1',
    name: 'Giardino',
    device_type: 'NOC',
    status: 'on',
    sd_status: 'on',
    alim_status: 'on',
    firmware: null,
    is_local: true,
    ...over,
  };
}

function sonosData(transport: 'PLAYING' | 'PAUSED_PLAYBACK'): SonosFullData {
  return {
    devices: [],
    zones: [
      {
        group_id: 'RINCON_A:1',
        label: 'Sala',
        coordinator_uid: 'RINCON_A',
        coordinator_name: 'Arc',
        member_count: 2,
        members: [
          { uid: 'RINCON_A', name: 'Arc', ip: '10.0.0.2', role: 'soundbar' },
          { uid: 'RINCON_B', name: 'Sub', ip: '10.0.0.3', role: 'sub' },
        ],
      },
    ],
    playback: {
      'RINCON_A:1': {
        group_id: 'RINCON_A:1',
        transport_state: transport,
        title: 'Azzurro',
        artist: 'Adriano Celentano',
        album: null,
        album_art_url: null,
        position: null,
        duration: null,
        source_type: 'streaming',
      },
    },
    volumes: {
      RINCON_A: { uid: 'RINCON_A', volume: 22, mute: false },
      RINCON_B: { uid: 'RINCON_B', volume: 70, mute: false },
    },
    playModes: {},
    sleepTimers: {},
    eqData: {},
    homeTheaterData: {},
  };
}

// --- Common fields ------------------------------------------------------

describe('buildRoomDevices: common fields', () => {
  it('returns no device for a room without members', () => {
    expect(buildRoomDevices([], NOTHING_LOADED)).toEqual([]);
  });

  it('uses the registry id as key and the custom name as label', () => {
    const d = one(
      member({ provider_name: 'hue', device_registry_id: 42, device_id: '5', custom_name: 'Lampada' }),
      live({ lights: [hueLight()] }),
    );
    expect(d.id).toBe(42);
    expect(d.name).toBe('Lampada');
    expect(d.tone).toBe(TONE_FOR_KIND.light);
  });

  it('falls back to the device id, then to "Dispositivo", when the name is empty', () => {
    expect(one(member({ provider_name: 'hue', device_id: '5', custom_name: '' })).name).toBe('5');
    expect(one(member({ provider_name: 'hue', device_id: '', custom_name: '' })).name).toBe('Dispositivo');
  });
});

// --- Stove --------------------------------------------------------------

describe('buildRoomDevices: stove (thermorossi)', () => {
  const stoveMember = member({
    provider_name: 'thermorossi',
    device_id: 'stove',
    data: { status: 'available', active: false, temperature: 20, power_level: 1 },
  });

  it('live data wins over the summary', () => {
    const d = one(stoveMember, live({ stove: { on: true, powerLevel: 4, fanLevel: 2, unreachable: false } }));
    expect(d).toMatchObject({
      kind: 'stove',
      on: true,
      statusLabel: 'Accesa',
      value: 'Potenza 4',
      extra: { powerLevel: 4, fanLevel: 2 },
    });
    expect(d.unreachable).toBeUndefined();
  });

  it('a stove that is off shows no power', () => {
    const d = one(stoveMember, live({ stove: { on: false, powerLevel: 4, fanLevel: 2, unreachable: false } }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Spenta', value: '' });
  });

  it('a lit stove without a power reading shows no power', () => {
    const d = one(stoveMember, live({ stove: { on: true, powerLevel: null, fanLevel: null, unreachable: false } }));
    expect(d).toMatchObject({ on: true, statusLabel: 'Accesa', value: '' });
  });

  it('live.stove === null (first reading not arrived) uses the summary', () => {
    const lit = member({
      provider_name: 'thermorossi',
      data: { status: 'available', active: true, temperature: 20, power_level: 3 },
    });
    const d = one(lit, live({ stove: null }));
    expect(d).toMatchObject({
      on: true,
      statusLabel: 'Accesa',
      value: 'Potenza 3',
      extra: { powerLevel: 3, fanLevel: null },
    });
    expect(d.unreachable).toBeUndefined();

    expect(one(stoveMember, live({ stove: null }))).toMatchObject({ on: false, statusLabel: 'Spenta', value: '' });
  });

  it('an unreachable live stove is "Non risponde", even when the summary says lit', () => {
    const lit = member({
      provider_name: 'thermorossi',
      data: { status: 'available', active: true, temperature: 20, power_level: 3 },
    });
    const d = one(lit, live({ stove: { on: true, powerLevel: 3, fanLevel: 2, unreachable: true } }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Non risponde', value: '', unreachable: true });
  });

  it('no live data and no summary is "Non risponde"', () => {
    const d = one(member({ provider_name: 'thermorossi', status: 'unavailable', data: null }));
    expect(d).toMatchObject({ kind: 'stove', on: false, statusLabel: 'Non risponde', unreachable: true });
  });

  it('ignores the summary of an unavailable member', () => {
    const stale = member({
      provider_name: 'thermorossi',
      status: 'unavailable',
      data: { status: 'available', active: true, temperature: 20, power_level: 3 },
    });
    expect(one(stale)).toMatchObject({ on: false, unreachable: true });
  });
});

// --- Netatmo: thermostat, valves, relay ---------------------------------

describe('buildRoomDevices: netatmo climate', () => {
  const topology = {
    home_id: 'home',
    home_name: 'Casa',
    modules: [
      { id: 'therm-1', type: 'NATherm1', room_id: 'room-A' },
      { id: 'valve-1', type: 'NRV', room_id: 'room-B' },
      { id: 'relay-1', type: 'NAPlug' },
    ],
  };
  const status = {
    rooms: [
      { room_id: 'room-A', temperature: 21.34, setpoint: 21, heating: true },
      { room_id: 'room-B', temperature: 18, setpoint: 17.5, heating: false },
    ],
  };
  const summaryData = { status: 'available' as const, setpoint_temp: 20, measured_temp: 19.5, heating: true };

  it('NATherm1 is a thermostat: live room data wins over the summary', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_type: 'thermostat', device_id: 'therm-1', data: summaryData }),
      live({ thermostat: { topology, status } }),
    );
    expect(d).toMatchObject({
      kind: 'thermo',
      on: true,
      statusLabel: 'Riscalda',
      value: '21.3° → 21.0°',
      extra: { current: 21.34, target: 21, roomId: 'room-A' },
    });
    expect(d.tone).toBe(TONE_FOR_KIND.thermo);
  });

  it('NRV is a valve; a room that is not heating is "A riposo"', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_type: 'valve', device_id: 'valve-1', data: summaryData }),
      live({ thermostat: { topology, status } }),
    );
    expect(d).toMatchObject({
      kind: 'valve',
      on: false,
      statusLabel: 'A riposo',
      value: '18.0° → 17.5°',
      extra: { current: 18, target: 17.5, roomId: 'room-B' },
    });
  });

  it('falls back to the summary while the live status has not arrived', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_type: 'thermostat', device_id: 'therm-1', data: summaryData }),
      live({ thermostat: { topology, status: null } }),
    );
    expect(d).toMatchObject({
      kind: 'thermo',
      on: true,
      statusLabel: 'Riscalda',
      value: '19.5° → 20.0°',
      extra: { current: 19.5, target: 20, roomId: 'room-A' },
    });
    expect(d.unreachable).toBeUndefined();
  });

  it('uses the summary when the topology is missing too', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_type: 'valve', device_id: 'valve-1', data: summaryData }),
    );
    expect(d).toMatchObject({ on: true, value: '19.5° → 20.0°', extra: { roomId: '' } });
  });

  it('no temperature anywhere is "Non risponde"', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_id: 'valve-1', status: 'unavailable', data: null }),
      live({ thermostat: { topology, status: { rooms: [] } } }),
    );
    expect(d).toMatchObject({ kind: 'valve', on: false, statusLabel: 'Non risponde', value: '', unreachable: true });
  });

  it('a summary without a setpoint is "Non risponde"', () => {
    const d = one(
      member({
        provider_name: 'netatmo',
        device_id: 'therm-1',
        data: { status: 'available', setpoint_temp: null, measured_temp: 19.5, heating: null },
      }),
      live({ thermostat: { topology, status: null } }),
    );
    expect(d).toMatchObject({ kind: 'thermo', unreachable: true });
  });

  it('the relay (NAPlug) is a host that is "Collegato", with no temperature', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_id: 'relay-1', data: summaryData }),
      live({ thermostat: { topology, status } }),
    );
    expect(d).toMatchObject({ kind: 'host', on: false, statusLabel: 'Collegato', value: '', extra: {} });
    expect(d.unreachable).toBeUndefined();
    expect(d.tone).toBe(TONE_FOR_KIND.host);
  });

  it('an unavailable relay is "Non risponde"', () => {
    const d = one(
      member({ provider_name: 'netatmo', device_id: 'relay-1', status: 'unavailable' }),
      live({ thermostat: { topology, status } }),
    );
    expect(d).toMatchObject({ kind: 'host', statusLabel: 'Non risponde', unreachable: true });
  });
});

// --- Netatmo: camera ----------------------------------------------------

describe('buildRoomDevices: netatmo camera', () => {
  const cameraMember = member({ provider_name: 'netatmo', device_type: 'camera', device_id: 'cam-1' });

  it('a camera that is on', () => {
    const d = one(cameraMember, live({ cameras: [camera()] }));
    expect(d).toMatchObject({
      kind: 'camera',
      on: true,
      statusLabel: 'Accesa',
      value: '',
      extra: { cameraId: 'cam-1', sd: 'on', power: 'on' },
    });
  });

  it('a camera that is off', () => {
    const d = one(cameraMember, live({ cameras: [camera({ status: 'off', sd_status: 'off' })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Spenta', extra: { cameraId: 'cam-1', sd: 'off' } });
  });

  it('is "In attesa" (not unreachable) while the cameras are loading', () => {
    const d = one(cameraMember, live({ cameras: null }));
    expect(d).toMatchObject({ kind: 'camera', on: false, statusLabel: 'In attesa', extra: {} });
    expect(d.unreachable).toBeUndefined();
  });

  it('is "Non risponde" when the loaded list does not have it', () => {
    const d = one(cameraMember, live({ cameras: [camera({ camera_id: 'other' })] }));
    expect(d).toMatchObject({ kind: 'camera', statusLabel: 'Non risponde', unreachable: true });
  });
});

// --- Hue ----------------------------------------------------------------

describe('buildRoomDevices: light (hue)', () => {
  const lightMember = member({
    provider_name: 'hue',
    device_id: '5',
    data: { status: 'available', on: false, brightness: 10, reachable: true },
  });

  it('live data wins over the summary; brightness becomes a percentage', () => {
    const d = one(lightMember, live({ lights: [hueLight({ light_id: '5', on: true, brightness: 127 })] }));
    expect(d).toMatchObject({
      kind: 'light',
      on: true,
      statusLabel: 'Accesa',
      value: '50%',
      extra: { lightId: '5', brightness: 50 },
    });
  });

  it('a light that is off shows no brightness in the status line', () => {
    const d = one(lightMember, live({ lights: [hueLight({ light_id: '5', on: false, brightness: 254 })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Spenta', value: '', extra: { brightness: 100 } });
  });

  it('a null brightness counts as 0%', () => {
    const d = one(lightMember, live({ lights: [hueLight({ light_id: '5', on: true, brightness: null })] }));
    expect(d).toMatchObject({ value: '0%', extra: { brightness: 0 } });
  });

  it('falls back to the summary while the lights are loading', () => {
    const lit = member({
      provider_name: 'hue',
      device_id: '5',
      data: { status: 'available', on: true, brightness: 254, reachable: true },
    });
    const d = one(lit, live({ lights: null }));
    expect(d).toMatchObject({ on: true, statusLabel: 'Accesa', value: '100%', extra: { lightId: '5' } });
    expect(d.unreachable).toBeUndefined();
  });

  it('matches the light by its registry device id, not by position', () => {
    const d = one(
      lightMember,
      live({ lights: [hueLight({ light_id: '9', on: true }), hueLight({ light_id: '5', on: false })] }),
    );
    expect(d.on).toBe(false);
  });

  it('a light the bridge cannot reach is "Non risponde"', () => {
    const d = one(lightMember, live({ lights: [hueLight({ light_id: '5', on: true, reachable: false })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Non risponde', value: '', unreachable: true });
  });

  it('no live data and no summary is "Non risponde"', () => {
    const d = one(member({ provider_name: 'hue', device_id: '5', status: 'unavailable' }), live({ lights: [] }));
    expect(d).toMatchObject({ kind: 'light', unreachable: true, statusLabel: 'Non risponde' });
  });
});

// --- Tuya ---------------------------------------------------------------

describe('buildRoomDevices: plug (tuya)', () => {
  const plugMember = member({
    provider_name: 'tuya',
    device_id: 'plug-1',
    data: { status: 'available', switch_on: false, power_w: 0, energy_kwh: 1 },
  });

  it('live data wins over the summary', () => {
    const d = one(plugMember, live({ plugs: [tuyaPlug()] }));
    expect(d).toMatchObject({
      kind: 'plug',
      on: true,
      statusLabel: 'Accesa',
      value: '450W',
      extra: { id: 'plug-1', power: 450, today_kwh: 2.5 },
    });
  });

  it('formats a kilowatt and rounds the watts', () => {
    expect(one(plugMember, live({ plugs: [tuyaPlug({ power_w: 1540 })] })).value).toBe('1.5kW');
    expect(one(plugMember, live({ plugs: [tuyaPlug({ power_w: 12.6 })] })).value).toBe('13W');
  });

  it('a plug that is off shows no power', () => {
    const d = one(plugMember, live({ plugs: [tuyaPlug({ switch_on: false, power_w: 0 })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Spenta', value: '' });
  });

  it('missing power and energy count as zero', () => {
    const d = one(plugMember, live({ plugs: [tuyaPlug({ power_w: null, energy_kwh: null })] }));
    expect(d).toMatchObject({ on: true, value: '0W', extra: { power: 0, today_kwh: 0 } });
  });

  it('falls back to the summary while the plugs are loading', () => {
    const lit = member({
      provider_name: 'tuya',
      device_id: 'plug-1',
      data: { status: 'available', switch_on: true, power_w: 30, energy_kwh: 1.2 },
    });
    const d = one(lit, live({ plugs: null }));
    expect(d).toMatchObject({ on: true, value: '30W', extra: { id: 'plug-1', power: 30, today_kwh: 1.2 } });
  });

  it('a plug without a switch state (unreachable on the LAN) is "Non risponde"', () => {
    const d = one(plugMember, live({ plugs: [tuyaPlug({ switch_on: null, data_freshness: 'UNREACHABLE' })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Non risponde', value: '', unreachable: true });
  });

  it('no live data and no summary is "Non risponde"', () => {
    const d = one(member({ provider_name: 'tuya', device_id: 'plug-1', status: 'unavailable' }));
    expect(d).toMatchObject({ kind: 'plug', unreachable: true });
  });
});

// --- Sonos --------------------------------------------------------------

describe('buildRoomDevices: speaker (sonos)', () => {
  const summaryData = { status: 'available' as const, playing: false, volume: 30, group_name: 'Sala' };

  it('a member uid that is not the coordinator resolves to its zone', () => {
    const d = one(
      member({ provider_name: 'sonos', device_id: 'RINCON_B', data: summaryData }),
      live({ sonos: sonosData('PLAYING') }),
    );
    expect(d).toMatchObject({
      kind: 'sonos',
      on: true,
      statusLabel: 'In riproduzione',
      value: 'Azzurro',
      // Commands go to the zone; the volume is the one of its coordinator
      extra: { id: 'RINCON_A:1', track: 'Azzurro', artist: 'Adriano Celentano', volume: 22 },
    });
  });

  it('the coordinator uid resolves to the same zone', () => {
    const d = one(
      member({ provider_name: 'sonos', device_id: 'RINCON_A', data: summaryData }),
      live({ sonos: sonosData('PLAYING') }),
    );
    expect(d.extra['id']).toBe('RINCON_A:1');
  });

  it('a paused zone is "In pausa" and hides the track from the status line', () => {
    const d = one(
      member({ provider_name: 'sonos', device_id: 'RINCON_A', data: { ...summaryData, playing: true } }),
      live({ sonos: sonosData('PAUSED_PLAYBACK') }),
    );
    expect(d).toMatchObject({ on: false, statusLabel: 'In pausa', value: '', extra: { track: 'Azzurro' } });
  });

  it('falls back to the summary while Sonos is loading', () => {
    const d = one(
      member({ provider_name: 'sonos', device_id: 'RINCON_B', data: { ...summaryData, playing: true } }),
      live({ sonos: null }),
    );
    expect(d).toMatchObject({
      on: true,
      statusLabel: 'In riproduzione',
      value: '',
      extra: { id: 'RINCON_B', track: '', artist: '', volume: 30 },
    });
  });

  it('uses the summary when the loaded zones do not have the speaker', () => {
    const d = one(
      member({ provider_name: 'sonos', device_id: 'RINCON_Z', data: summaryData }),
      live({ sonos: sonosData('PLAYING') }),
    );
    expect(d).toMatchObject({ on: false, statusLabel: 'In pausa', extra: { id: 'RINCON_Z', volume: 30 } });
  });

  it('no zone and no summary is "Non risponde"', () => {
    const d = one(
      member({ provider_name: 'sonos', device_id: 'RINCON_Z', status: 'unavailable' }),
      live({ sonos: sonosData('PLAYING') }),
    );
    expect(d).toMatchObject({ kind: 'sonos', on: false, statusLabel: 'Non risponde', unreachable: true });
  });
});

// --- Dirigera -----------------------------------------------------------

describe('buildRoomDevices: sensor (dirigera)', () => {
  const sensorMember = member({ provider_name: 'dirigera', device_id: 'sensor-1' });

  it('an open contact sensor is lit, with its battery', () => {
    const s = dirigeraSensor({ is_open: true });
    const d = one(sensorMember, live({ sensors: [s] }));
    expect(d).toMatchObject({ kind: 'sensor', on: true, statusLabel: 'Aperta', value: 'Batteria 80%' });
    expect(d.extra['sensor']).toBe(s);
  });

  it('a closed contact sensor is not lit', () => {
    const d = one(sensorMember, live({ sensors: [dirigeraSensor({ is_open: false, battery_percentage: null })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Chiusa', value: '' });
  });

  it('a motion sensor reports movement', () => {
    const moving = dirigeraSensor({ type: 'motionSensor', is_detected: true, battery_percentage: 55 });
    expect(one(sensorMember, live({ sensors: [moving] }))).toMatchObject({
      on: true,
      statusLabel: 'Movimento',
      value: 'Batteria 55%',
    });

    const still = dirigeraSensor({ type: 'motionSensor', is_detected: false });
    expect(one(sensorMember, live({ sensors: [still] }))).toMatchObject({
      on: false,
      statusLabel: 'Nessun movimento',
    });
  });

  it('an environment sensor shows temperature, then humidity, and is never lit', () => {
    const env = dirigeraSensor({
      type: 'environmentSensor',
      battery_percentage: null,
      temperature: 21.4,
      humidity: 45.4,
    });
    expect(one(sensorMember, live({ sensors: [env] }))).toMatchObject({
      on: false,
      statusLabel: '21.4°',
      value: '45%',
    });
  });

  it('an environment sensor with only the humidity shows it as status', () => {
    const env = dirigeraSensor({ type: 'environmentSensor', temperature: null, humidity: 60 });
    expect(one(sensorMember, live({ sensors: [env] }))).toMatchObject({ statusLabel: '60%', value: '' });
  });

  it('a sensor without readings is "In linea"', () => {
    const env = dirigeraSensor({ type: 'environmentSensor', temperature: null, humidity: null });
    const d = one(sensorMember, live({ sensors: [env] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'In linea', value: '' });
    expect(d.unreachable).toBeUndefined();
  });

  it('a sensor the hub cannot reach is "Non risponde", whatever its last state', () => {
    const d = one(sensorMember, live({ sensors: [dirigeraSensor({ is_open: true, is_reachable: false })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Non risponde', value: '', unreachable: true });
    expect(d.extra['sensor']).toBeUndefined();
  });

  it('is "In attesa" (not unreachable) while the sensors are loading and the Pi says available', () => {
    const d = one(sensorMember, live({ sensors: null }));
    expect(d).toMatchObject({ kind: 'sensor', on: false, statusLabel: 'In attesa', extra: {} });
    expect(d.unreachable).toBeUndefined();
  });

  it('is "Non risponde" while loading when the Pi says unavailable', () => {
    const d = one(member({ provider_name: 'dirigera', device_id: 'sensor-1', status: 'unavailable' }));
    expect(d).toMatchObject({ statusLabel: 'Non risponde', unreachable: true });
  });

  it('is "Non risponde" when the loaded list does not have it', () => {
    const d = one(sensorMember, live({ sensors: [dirigeraSensor({ id: 'other', is_open: true })] }));
    expect(d).toMatchObject({ on: false, statusLabel: 'Non risponde', unreachable: true });
  });
});

// --- Raspberry Pi and unknown providers ---------------------------------

describe('buildRoomDevices: host (raspi)', () => {
  it('an available Pi is "In linea" with CPU load and temperature', () => {
    const d = one(
      member({
        provider_name: 'raspi',
        device_type: 'ha',
        data: { status: 'available', cpu_percent: 7.5, cpu_temperature: 52.34, memory_percent: 41 },
      }),
    );
    expect(d).toMatchObject({
      kind: 'host',
      on: false,
      statusLabel: 'In linea',
      value: 'CPU 8% · 52°',
      extra: { cpu: 7.5, temperature: 52.34, memory: 41 },
    });
    expect(d.unreachable).toBeUndefined();
  });

  it('an available Pi without stats is "In linea" with an empty value', () => {
    const d = one(member({ provider_name: 'raspi', data: null }));
    expect(d).toMatchObject({
      statusLabel: 'In linea',
      value: '',
      extra: { cpu: null, temperature: null, memory: null },
    });
  });

  it('an unavailable Pi is "Non risponde"', () => {
    const d = one(member({ provider_name: 'raspi', status: 'unavailable' }));
    expect(d).toMatchObject({ kind: 'host', statusLabel: 'Non risponde', unreachable: true });
  });

  it('an unknown provider is shown as a host', () => {
    expect(one(member({ provider_name: 'fritzbox' }))).toMatchObject({ kind: 'host', statusLabel: 'In linea' });
  });
});

// --- Ordering -----------------------------------------------------------

describe('buildRoomDevices: ordering', () => {
  it('sorts the devices by CATEGORY_ORDER, whatever the registry order', () => {
    const topology = {
      home_id: 'home',
      home_name: 'Casa',
      modules: [
        { id: 'therm-1', type: 'NATherm1' },
        { id: 'valve-1', type: 'NRV' },
      ],
    };
    const members: DeviceStatus[] = [
      member({ device_registry_id: 1, provider_name: 'raspi' }),
      member({ device_registry_id: 2, provider_name: 'dirigera', device_id: 'sensor-1' }),
      member({ device_registry_id: 3, provider_name: 'netatmo', device_type: 'camera', device_id: 'cam-1' }),
      member({ device_registry_id: 4, provider_name: 'sonos', device_id: 'RINCON_A' }),
      member({ device_registry_id: 5, provider_name: 'tuya', device_id: 'plug-1' }),
      member({ device_registry_id: 6, provider_name: 'hue', device_id: '5' }),
      member({ device_registry_id: 7, provider_name: 'netatmo', device_id: 'valve-1' }),
      member({ device_registry_id: 8, provider_name: 'netatmo', device_id: 'therm-1' }),
      member({ device_registry_id: 9, provider_name: 'thermorossi' }),
    ];
    const devices = buildRoomDevices(members, live({ thermostat: { topology, status: null } }));
    expect(devices.map((d) => d.kind)).toEqual(CATEGORY_ORDER);
    expect(devices.map((d) => d.id)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('keeps the registry order inside a kind', () => {
    const members: DeviceStatus[] = [
      member({ device_registry_id: 30, provider_name: 'hue', device_id: 'c' }),
      member({ device_registry_id: 10, provider_name: 'thermorossi' }),
      member({ device_registry_id: 20, provider_name: 'hue', device_id: 'a' }),
      member({ device_registry_id: 25, provider_name: 'hue', device_id: 'b' }),
    ];
    expect(buildRoomDevices(members, NOTHING_LOADED).map((d) => d.id)).toEqual([10, 30, 20, 25]);
  });

  it('keeps every member, also the ones that do not answer', () => {
    const members: DeviceStatus[] = [
      member({ device_registry_id: 1, provider_name: 'hue', status: 'unavailable' }),
      member({ device_registry_id: 2, provider_name: 'tuya', status: 'unavailable' }),
    ];
    const devices = buildRoomDevices(members, NOTHING_LOADED);
    expect(devices).toHaveLength(2);
    expect(devices.every((d) => d.unreachable === true)).toBe(true);
  });
});
