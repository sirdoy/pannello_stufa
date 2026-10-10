/**
 * Builds the devices of a room (ROADMAP M84).
 *
 * `members` are the devices the Pi assigns to the room (`GET /api/rooms/house/status`); each one is
 * joined with the live data of its provider through the registry `device_id`. When the live data
 * has not arrived yet the summary sent with the room status is used; when neither has a reading
 * the device is "Non risponde", never a made-up state (rule M78).
 *
 * Pure function: no I/O, no hooks.
 */

import type {
  DeviceStatus,
  HostStatus,
  LightStatus,
  PlugStatus,
  SpeakerStatus,
  StoveStatus,
  ThermostatStatus,
} from '@/types/rooms';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { DeviceKind, LiveState, RoomDevice } from '../types';
import { CATEGORY_ORDER, TONE_FOR_KIND } from './rooms-config';

const NO_ANSWER = 'Non risponde';

function base(member: DeviceStatus, kind: DeviceKind): RoomDevice {
  return {
    id: member.device_registry_id,
    kind,
    name: member.custom_name || member.device_id || 'Dispositivo',
    on: false,
    value: '',
    tone: TONE_FOR_KIND[kind],
    extra: {},
  };
}

function unreachable(device: RoomDevice): RoomDevice {
  return { ...device, on: false, statusLabel: NO_ANSWER, value: '', unreachable: true };
}

/** Summary sent with the room status, when the device is available and of the expected shape */
function summary<T>(member: DeviceStatus): T | null {
  return member.status === 'available' && member.data ? (member.data as unknown as T) : null;
}

function formatPower(watts: number): string {
  return watts >= 1000 ? `${(watts / 1000).toFixed(1)}kW` : `${Math.round(watts)}W`;
}

function stove(member: DeviceStatus, live: LiveState): RoomDevice {
  const device = base(member, 'stove');
  if (live.stove) {
    if (live.stove.unreachable) return unreachable(device);
    const { on, powerLevel, fanLevel } = live.stove;
    return {
      ...device,
      on,
      statusLabel: on ? 'Accesa' : 'Spenta',
      value: on && powerLevel !== null ? `Potenza ${powerLevel}` : '',
      extra: { powerLevel, fanLevel },
    };
  }
  const data = summary<StoveStatus>(member);
  if (!data) return unreachable(device);
  return {
    ...device,
    on: data.active,
    statusLabel: data.active ? 'Accesa' : 'Spenta',
    value: data.active && data.power_level !== null ? `Potenza ${data.power_level}` : '',
    extra: { powerLevel: data.power_level, fanLevel: null },
  };
}

function netatmo(member: DeviceStatus, live: LiveState): RoomDevice {
  if (member.device_type === 'camera') {
    const device = base(member, 'camera');
    const camera = live.cameras?.find((c) => c.camera_id === member.device_id);
    if (!camera) return live.cameras ? unreachable(device) : { ...device, statusLabel: 'In attesa' };
    const on = camera.status === 'on';
    return {
      ...device,
      on,
      statusLabel: on ? 'Accesa' : 'Spenta',
      extra: { cameraId: camera.camera_id, sd: camera.sd_status, power: camera.alim_status },
    };
  }

  const { topology, status } = live.thermostat;
  const netatmoModule = topology?.modules?.find((m) => m.id === member.device_id);

  // The relay drives the boiler: it has no temperature of its own
  if (netatmoModule?.type === 'NAPlug') {
    const device = base(member, 'host');
    return member.status === 'available' ? { ...device, statusLabel: 'Collegato' } : unreachable(device);
  }

  const device = base(member, netatmoModule?.type === 'NATherm1' ? 'thermo' : 'valve');
  const roomId = typeof netatmoModule?.['room_id'] === 'string' ? netatmoModule['room_id'] : '';
  const room = status?.rooms?.find((r) => r.room_id === roomId);
  const data = summary<ThermostatStatus>(member);

  const current = typeof room?.temperature === 'number' ? room.temperature : data?.measured_temp ?? null;
  const target = typeof room?.setpoint === 'number' ? room.setpoint : data?.setpoint_temp ?? null;
  if (current === null || target === null) return unreachable(device);

  const heating = room ? room.heating === true : data?.heating === true;
  return {
    ...device,
    on: heating,
    statusLabel: heating ? 'Riscalda' : 'A riposo',
    value: `${current.toFixed(1)}° → ${target.toFixed(1)}°`,
    extra: { current, target, roomId },
  };
}

function light(member: DeviceStatus, live: LiveState): RoomDevice {
  const device = base(member, 'light');
  const l = live.lights?.find((x) => x.light_id === member.device_id);
  const data = summary<LightStatus>(member);
  const reading = l
    ? { on: l.on, brightness: l.brightness, reachable: l.reachable }
    : data
      ? { on: data.on, brightness: data.brightness, reachable: data.reachable }
      : null;
  if (!reading || !reading.reachable) return unreachable(device);
  const percent = Math.round(((reading.brightness ?? 0) / 254) * 100);
  return {
    ...device,
    on: reading.on,
    statusLabel: reading.on ? 'Accesa' : 'Spenta',
    value: reading.on ? `${percent}%` : '',
    extra: { lightId: member.device_id, brightness: percent },
  };
}

function plug(member: DeviceStatus, live: LiveState): RoomDevice {
  const device = base(member, 'plug');
  const p = live.plugs?.find((x) => x.device_id === member.device_id);
  const data = summary<PlugStatus>(member);
  const reading = p
    ? { on: p.switch_on, power: p.power_w, energy: p.energy_kwh }
    : data
      ? { on: data.switch_on, power: data.power_w, energy: data.energy_kwh }
      : null;
  if (!reading || typeof reading.on !== 'boolean') return unreachable(device);
  const power = reading.power ?? 0;
  return {
    ...device,
    on: reading.on,
    statusLabel: reading.on ? 'Accesa' : 'Spenta',
    value: reading.on ? formatPower(power) : '',
    extra: { id: member.device_id, power, today_kwh: reading.energy ?? 0 },
  };
}

function sonos(member: DeviceStatus, live: LiveState): RoomDevice {
  const device = base(member, 'sonos');
  const uid = member.device_id;
  const zone = live.sonos?.zones.find(
    (z) => z.coordinator_uid === uid || z.members?.some((m) => m.uid === uid),
  );
  if (live.sonos && zone) {
    const playback = live.sonos.playback[zone.group_id];
    const playing = playback?.transport_state === 'PLAYING';
    const track = playback?.title ?? '';
    return {
      ...device,
      on: playing,
      statusLabel: playing ? 'In riproduzione' : 'In pausa',
      value: playing ? track : '',
      extra: {
        id: zone.group_id,
        track,
        artist: playback?.artist ?? '',
        volume: live.sonos.volumes[zone.coordinator_uid]?.volume ?? 0,
      },
    };
  }
  const data = summary<SpeakerStatus>(member);
  if (!data) return unreachable(device);
  return {
    ...device,
    on: data.playing,
    statusLabel: data.playing ? 'In riproduzione' : 'In pausa',
    extra: { id: uid, track: '', artist: '', volume: data.volume ?? 0 },
  };
}

function sensorReading(s: DirigeraSensor): Pick<RoomDevice, 'on' | 'statusLabel' | 'value'> {
  const battery = typeof s.battery_percentage === 'number' ? `Batteria ${s.battery_percentage}%` : '';
  if (typeof s.is_open === 'boolean') {
    return { on: s.is_open, statusLabel: s.is_open ? 'Aperta' : 'Chiusa', value: battery };
  }
  if (typeof s.is_detected === 'boolean') {
    return {
      on: s.is_detected,
      statusLabel: s.is_detected ? 'Movimento' : 'Nessun movimento',
      value: battery,
    };
  }
  const parts: string[] = [];
  if (typeof s.temperature === 'number') parts.push(`${s.temperature.toFixed(1)}°`);
  if (typeof s.humidity === 'number') parts.push(`${Math.round(s.humidity)}%`);
  return { on: false, statusLabel: parts.shift() ?? 'In linea', value: parts.join(' · ') };
}

function sensor(member: DeviceStatus, live: LiveState): RoomDevice {
  const device = base(member, 'sensor');
  const s = live.sensors?.find((x) => x.id === member.device_id);
  if (!s) {
    // The room status knows only whether the sensor answers
    return live.sensors || member.status !== 'available'
      ? unreachable(device)
      : { ...device, statusLabel: 'In attesa' };
  }
  if (!s.is_reachable) return unreachable(device);
  return { ...device, ...sensorReading(s), extra: { sensor: s } };
}

function host(member: DeviceStatus): RoomDevice {
  const device = base(member, 'host');
  if (member.status !== 'available') return unreachable(device);
  const data = summary<HostStatus>(member);
  const parts: string[] = [];
  if (typeof data?.cpu_percent === 'number') parts.push(`CPU ${Math.round(data.cpu_percent)}%`);
  if (typeof data?.cpu_temperature === 'number') parts.push(`${data.cpu_temperature.toFixed(0)}°`);
  return {
    ...device,
    statusLabel: 'In linea',
    value: parts.join(' · '),
    extra: {
      cpu: data?.cpu_percent ?? null,
      temperature: data?.cpu_temperature ?? null,
      memory: data?.memory_percent ?? null,
    },
  };
}

function toRoomDevice(member: DeviceStatus, live: LiveState): RoomDevice {
  switch (member.provider_name) {
    case 'thermorossi': return stove(member, live);
    case 'netatmo':     return netatmo(member, live);
    case 'hue':         return light(member, live);
    case 'tuya':        return plug(member, live);
    case 'sonos':       return sonos(member, live);
    case 'dirigera':    return sensor(member, live);
    default:            return host(member);
  }
}

/** Devices of a room, in the display order of their kind (registry order inside a kind). */
export function buildRoomDevices(members: DeviceStatus[], live: LiveState): RoomDevice[] {
  const devices = members.map((m) => toRoomDevice(m, live));
  return CATEGORY_ORDER.flatMap((kind) => devices.filter((d) => d.kind === kind));
}
