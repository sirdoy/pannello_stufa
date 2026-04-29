'use client';
/**
 * DevicePrimaryControl — Plan 179-04 (ROOMS-04 / CONTEXT D-25)
 *
 * Right-aligned header control for DeviceCard. Dispatches by device.kind
 * to 5 branches:
 *   - sonos     → 40×40 round play/pause button
 *   - camera    → LIVE pill (10px caps, letterSpacing 0.6) + pulsing dot
 *   - sensor    → OK pill
 *   - light/plug/thermo/valve → InlineToggle (command-wired)
 *   - stove/tv/shade → 40px empty placeholder div
 *
 * CRITICAL — Pitfall 3: setRoomMode second arg is 'manual' | 'home', NOT
 * 'on' | 'off'. The TypeScript union `SetRoomThermpointRequest['mode']` is
 * 'manual' | 'home'. Toggle logic: device.on → 'home'; !device.on → 'manual'.
 *
 * Pitfall 8: gate setRoomMode on homeId !== '' (topology resolves async).
 *
 * Per-body self-fetch pattern — CONTEXT D-39 / Phase 178 D-04. Each sub-component
 * imports its own data + commands hooks.
 *
 * RC-clean: no manual memo hooks — Phase 71/95/178 D-33 React Compiler discipline.
 * Inline-style + var(--token) — CONTEXT D-02.
 * Bundle source: rooms.jsx:319-352.
 */

import { Pause, Play } from 'lucide-react';
import { InlineToggle } from '../InlineToggle';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useRouter } from 'next/navigation';
import type { RoomDevice } from './types';

export function DevicePrimaryControl({ device }: { device: RoomDevice }): JSX.Element {
  switch (device.kind) {
    case 'sonos':
      return <SonosControl device={device} />;
    case 'camera':
      return <CameraPill />;
    case 'sensor':
      return <SensorPill />;
    case 'light':
      return <LightToggle device={device} />;
    case 'plug':
      return <PlugToggle device={device} />;
    case 'thermo':
    case 'valve':
      return <ThermoToggle device={device} />;
    case 'stove':
    case 'tv':
    case 'shade':
    default:
      return <div style={{ width: 40 }} aria-hidden="true" />;
  }
}

// --- Sub-components (self-fetch per CONTEXT D-39) ---

function SonosControl({ device }: { device: RoomDevice }) {
  const sonosData = useSonosFullData();
  const cmds = useSonosCommands({ fetchData: sonosData.fetchData, setError: () => {} });
  const groupId = String(device.extra['id'] ?? '');
  const playing = device.on;
  return (
    <button
      type="button"
      aria-label={playing ? 'Pausa' : 'Riproduci'}
      onClick={() => void (playing ? cmds.handlePause(groupId) : cmds.handlePlay(groupId))}
      style={{
        width: 40,
        height: 40,
        borderRadius: 99,
        background: playing ? '#fff' : 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (rooms.jsx:325)
        color: playing ? '#1a0f08' : '#fff', // AUDIT-EXCEPTION (rooms.jsx:326)
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {playing ? <Pause size={16} /> : <Play size={16} />}
    </button>
  );
}

function CameraPill() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 99,
        background: 'rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:330)
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 99,
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent)',
        }}
      />
      <span style={{ fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        LIVE
      </span>
    </div>
  );
}

function SensorPill() {
  return (
    <div
      style={{
        padding: '4px 10px',
        borderRadius: 99,
        background: 'rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (rooms.jsx:337)
      }}
    >
      <span style={{ fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        OK
      </span>
    </div>
  );
}

function LightToggle({ device }: { device: RoomDevice }) {
  const router = useRouter();
  const data = useLightsData();
  const cmds = useLightsCommands({
    lightsData: {
      setRefreshing: data.setRefreshing,
      setLoadingMessage: data.setLoadingMessage,
      setError: data.setError,
      fetchData: data.fetchData,
      groups: data.groups,
      checkConnection: data.checkConnection,
      connected: data.connected,
    },
    router,
  });
  const groupId = String(device.extra['groupId'] ?? '');
  return (
    <InlineToggle
      on={device.on}
      color={device.tone}
      onChange={(e) => {
        e.stopPropagation();
        void cmds.handleRoomToggle(groupId, !device.on);
      }}
    />
  );
}

function PlugToggle({ device }: { device: RoomDevice }) {
  const cmds = useTuyaCommands();
  const id = String(device.extra['id'] ?? '');
  return (
    <InlineToggle
      on={device.on}
      color={device.tone}
      onChange={(e) => {
        e.stopPropagation();
        void cmds.togglePlug(id, device.on);
      }}
    />
  );
}

function ThermoToggle({ device }: { device: RoomDevice }) {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const { setRoomMode } = useThermostatCommands({ homeId, refetch: data.refetch });
  const roomId = String(device.extra['roomId'] ?? '');
  // Pitfall 3: setRoomMode mode union is 'manual' | 'home', NOT 'on' | 'off'
  // Pitfall 8: gate on homeId !== '' to avoid POST with empty home_id
  return (
    <InlineToggle
      on={device.on}
      color={device.tone}
      onChange={(e) => {
        e.stopPropagation();
        if (!homeId || !roomId) return;
        void setRoomMode(roomId, device.on ? 'home' : 'manual');
      }}
    />
  );
}
