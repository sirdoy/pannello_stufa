'use client';

/**
 * ClimateSheet (SHEET-03 / CONTEXT D-06 / D-20) — body component.
 *
 * Presentational — receives data/cmds from parent (per quick task 260506-d45
 * perf fix; reverses Phase 178 D-04). The dashboard ClimateCard already mounts
 * useThermostatData; this sheet body re-mounting it doubled the WS subscription
 * + polling cost on every open. The SelfFetch wrapper below preserves the
 * zero-prop contract for the design-system gallery (Section10SheetGallery).
 *
 * Visual contract verbatim from bundle `sheets.jsx:131-197`. Italian copy frozen (D-20).
 *
 * Key behavioral details:
 *   - Setpoint debounced 500ms (ThermostatCard pattern, RESEARCH §Pattern 4).
 *   - Mode pills map IT labels → Netatmo backend (Pitfall 5: 'Manuale' is UI-only — no setHomeMode call).
 *   - zone.kind derived from topology.modules type (NATherm1 → termostato, NRV → termovalvola; Pitfall 6).
 *   - zone.on derived from `status.rooms[].mode !== 'hg'` (Pitfall 6).
 *   - Tipo toggle: when off → setRoomMode(id, 'manual'); when on → setRoomMode(id, 'home').
 *
 * No manual memoization hooks (D-33 — RC-clean).
 */

import { useEffect, useState } from 'react';
import { BatteryWarning, Check, TriangleAlert } from 'lucide-react';
import {
  useThermostatData,
  type UseThermostatDataReturn,
} from '@/app/components/devices/thermostat/hooks/useThermostatData';
import {
  useThermostatCommands,
  type UseThermostatCommandsReturn,
} from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { InlineToggle } from '../InlineToggle';
import { SheetRow } from './primitives/SheetRow';
import { RadialDial } from './primitives/RadialDial';
import type { SetThermmodeRequest } from '@/types/netatmoProxy';

interface Zone {
  id: string;
  name: string;
  current: number;
  target: number;
  on: boolean;
  heating: boolean;
  kind: 'termostato' | 'termovalvola';
  mode?: string;
}

// Heat tone for active dots — matches ClimateCard
const HEAT_TONE = '#ff6676';

interface ValveLite {
  module_id: string;
  module_name: string | null;
  room_name: string | null;
  battery_level: number | string | null;
  reachable: boolean | null;
}

/**
 * Netatmo valves report battery_level either as legacy string ("low"|"very_low"|...)
 * OR raw millivolts (~2500-3000mV LR03 fresh, drops with use). Classify both.
 *
 * mV thresholds (LR03 discharge curve, Netatmo-aligned):
 *   <= 2200 mV → critical (replace ASAP)
 *   <= 2700 mV → low (in scaricamento)
 *   >  2700 mV → ok
 */
function classifyBattery(level: unknown): 'critical' | 'low' | 'ok' | 'unknown' {
  if (typeof level === 'string') {
    if (level === 'very_low') return 'critical';
    if (level === 'low') return 'low';
    if (level === 'medium' || level === 'high') return 'ok';
    return 'unknown';
  }
  if (typeof level === 'number' && Number.isFinite(level)) {
    if (level <= 2200) return 'critical';
    if (level <= 2700) return 'low';
    return 'ok';
  }
  return 'unknown';
}

const MODE_PILLS: ReadonlyArray<{
  label: 'Auto' | 'Manuale' | 'Eco' | 'Off';
  backend: SetThermmodeRequest['mode'] | null;
}> = [
  { label: 'Auto', backend: 'schedule' },
  { label: 'Manuale', backend: null }, // Pitfall 5: UI-only; no setHomeMode call.
  { label: 'Eco', backend: 'away' },
  { label: 'Off', backend: 'hg' },
];

export interface ClimateSheetProps {
  data: UseThermostatDataReturn;
  cmds: UseThermostatCommandsReturn;
}

export function ClimateSheet({ data, cmds }: ClimateSheetProps) {
  // Destructure for stable identity in useEffect deps (checker WARNING 4 — depend on the
  // stable `setRoomSetpoint` reference, NOT the whole `cmds` object). useRetryableCommand
  // returns referentially-stable function handles, so destructuring here is safe.
  const { setRoomSetpoint, setHomeMode, setRoomMode } = cmds;

  // Merge topology.rooms + status.rooms + topology.modules into a unified zones[].
  const statusRooms = (data.status?.rooms ?? []) as Array<{
    room_id?: string;
    temperature?: number;
    setpoint?: number;
    mode?: string;
    heating?: boolean;
    heating_power_request?: number;
  }>;
  const topoRooms = (data.topology?.rooms ?? []) as Array<{
    id: string;
    name?: string;
  }>;
  const topoModules = (data.topology?.modules ?? []) as Array<{
    id: string;
    type?: string;
    room_id?: string;
  }>;

  const THERMO_MODULE_TYPES = new Set(['NATherm1', 'NRV']);
  const CENTRAL_HARDWARE_TYPES = new Set(['NATherm1', 'NAPlug']);
  const unsortedZones: Zone[] = topoRooms
    .map((r) => {
      const s = statusRooms.find((sr) => sr.room_id === r.id);
      // Pick the thermo module (NATherm1 or NRV) for this room — skip plugs (NAPlug)
      // and cameras (NACamera). Garage has only NACamera → linkedModule = undefined.
      const linkedModule = topoModules.find(
        (m) => m.room_id === r.id && THERMO_MODULE_TYPES.has(m.type ?? ''),
      );
      const moduleType = linkedModule?.type ?? '';
      const setpoint = typeof s?.setpoint === 'number' ? s.setpoint : undefined;
      // "Active": room either fires the boiler now (heating) OR hosts central
      // thermostat hardware (NATherm1 / NAPlug relay). NRV-only rooms stay
      // inactive unless heating. Setpoint > frost is NOT a signal (all rooms
      // sit above frost during a normal schedule → too loose, every dot lit).
      const isHeating = Boolean(
        s?.heating ??
          (typeof s?.heating_power_request === 'number' && s.heating_power_request > 0),
      );
      const hasCentralHardware = topoModules.some(
        (m) => m.room_id === r.id && CENTRAL_HARDWARE_TYPES.has(m.type ?? ''),
      );
      const isActive = isHeating || hasCentralHardware;
      return {
        id: r.id,
        name: r.name ?? r.id,
        current: typeof s?.temperature === 'number' ? s.temperature : 0,
        target: setpoint ?? 20,
        on: isActive,
        heating: isHeating,
        kind: moduleType === 'NATherm1' ? 'termostato' : 'termovalvola',
        mode: s?.mode,
        // Sentinel to filter rooms without a thermo module (Garage etc.)
        _hasThermoModule: Boolean(linkedModule),
      } as Zone & { _hasThermoModule: boolean };
    })
    .filter((z) => z._hasThermoModule)
    .map(({ _hasThermoModule, ...z }) => z as Zone);
  // Pin "Ovunque" (central thermostat) first; preserve order for the rest.
  const zones: Zone[] = [...unsortedZones].sort((a, b) => {
    const aOv = a.name === 'Ovunque' ? 0 : 1;
    const bOv = b.name === 'Ovunque' ? 0 : 1;
    return aOv - bOv;
  });

  // Valves battery — fire-and-forget fetch on mount. Sheet unmounts on close
  // (Sheet.tsx removed forceMount on Content), so this runs once per open.
  const [valves, setValves] = useState<ValveLite[]>([]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/v1/netatmo/valves');
        if (!res.ok) return;
        const json = (await res.json()) as { valves?: ValveLite[] };
        if (!cancelled && json.valves) setValves(json.valves);
      } catch {
        // silent — battery hint is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scheduled setpoints per room + home-level therm_mode — fetched from
  // /homesdata. /homestatus strips both therm_setpoint_mode (per-room) and
  // doesn't carry the home mode, so we read homesdata for both. Used to:
  //   1. detect manual override (target vs scheduled)
  //   2. highlight the active "Modalità globale" pill (Auto/Eco/Off)
  const [scheduledSetpoints, setScheduledSetpoints] = useState<Record<string, number>>({});
  const [homeThermMode, setHomeThermMode] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/v1/netatmo/homesdata');
        if (!res.ok) return;
        const json = (await res.json()) as {
          body?: {
            homes?: Array<{
              therm_mode?: string;
              schedules?: Array<{
                selected?: boolean;
                timetable?: Array<{ zone_id: number; m_offset: number }>;
                zones?: Array<{
                  id: number;
                  rooms?: Array<{ id: string; therm_setpoint_temperature: number }>;
                }>;
              }>;
            }>;
          };
        };
        const home = json.body?.homes?.[0];
        if (!cancelled && home?.therm_mode) setHomeThermMode(home.therm_mode);
        const selected = (home?.schedules ?? []).find((s) => s.selected);
        if (!selected || !selected.timetable || !selected.zones) return;
        // Current weekly minutes: Monday 00:00 = 0
        const now = new Date();
        const day = (now.getDay() + 6) % 7;
        const minutesNow = day * 1440 + now.getHours() * 60 + now.getMinutes();
        let currentZoneId = selected.timetable[0]?.zone_id;
        for (const entry of selected.timetable) {
          if (entry.m_offset <= minutesNow) currentZoneId = entry.zone_id;
          else break;
        }
        const zoneDef = selected.zones.find((z) => z.id === currentZoneId);
        const map: Record<string, number> = {};
        for (const r of zoneDef?.rooms ?? []) {
          map[r.id] = r.therm_setpoint_temperature;
        }
        if (!cancelled) setScheduledSetpoints(map);
      } catch {
        // silent — fallback to mode-only detection
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  // Surface: low/critical batteries + unreachable valves (likely dead cell so
  // proxy can't read level → battery_level=null, reachable=false).
  const lowBatteryValves = valves.filter((v) => {
    const c = classifyBattery(v.battery_level);
    if (c === 'low' || c === 'critical') return true;
    if (v.reachable === false) return true;
    return false;
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const safeIdx = Math.min(selectedIdx, Math.max(0, zones.length - 1));
  const zone: Zone | undefined = zones[safeIdx];

  const [pendingTarget, setPendingTarget] = useState<number>(zone?.target ?? 20);

  // Reset pending on zone change so dial reflects new zone's target.
  // No auto-write — the previous debounced effect was removed because switching
  // zones triggered spurious setRoomSetpoint calls with the outgoing zone's
  // target. Now writes happen only via the explicit "Applica" confirm button.
  useEffect(() => {
    if (!zone) return;
    setPendingTarget(zone.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx, zone?.id, zone?.target]);

  // Dirty bit — dial has been moved away from the live zone target.
  const targetDirty = zone !== undefined && pendingTarget !== zone.target;

  // Manual override detection — two-tier:
  //   1. WS provides `zone.mode === 'manual'` (authoritative when present)
  //   2. HTTP-only fallback: live target diverges from current scheduled value
  //      (>0.1° tolerance to dodge fp jitter; schedule values are integers anyway)
  const scheduledForZone = zone ? scheduledSetpoints[zone.id] : undefined;
  const isManualOverride =
    zone?.mode === 'manual' ||
    (zone !== undefined &&
      scheduledForZone !== undefined &&
      Math.abs(zone.target - scheduledForZone) > 0.1);

  // Manuale pill selected state: any room mode === 'manual' (WS) OR any room
  // has a manual override detected via schedule comparison (HTTP fallback).
  const anyRoomManual =
    statusRooms.some((r) => r.mode === 'manual') ||
    statusRooms.some((r) => {
      const id = r.room_id;
      if (!id) return false;
      const sp = typeof r.setpoint === 'number' ? r.setpoint : undefined;
      const sch = scheduledSetpoints[id];
      return sp !== undefined && sch !== undefined && Math.abs(sp - sch) > 0.1;
    });
  // Home-level mode — prefer WS-provided status.mode, fall back to homesdata.therm_mode.
  const homeMode =
    (data.status?.mode as string | undefined) ?? homeThermMode ?? '';

  // Loading skeleton (D-26 / Open Q4)
  if (data.loading && data.status === null && data.topology === null) {
    return (
      <div
        data-testid="climate-sheet-skeleton"
        style={{
          height: 480,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (D-27 / Open Q3) — string error, no .message
  if (data.error && !data.topology) {
    return (
      <div
        data-testid="climate-sheet-error"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 0',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          Non raggiungibile. Riprova più tardi.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{data.error}</div>
      </div>
    );
  }

  // Empty state
  if (zones.length === 0 || !zone) {
    return (
      <div
        data-testid="climate-sheet-empty"
        style={{
          padding: '24px 0',
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--text-2)',
        }}
      >
        Nessuna zona configurata
      </div>
    );
  }

  return (
    <div data-testid="climate-sheet">
      {/* Zone selector chip row (bundle sheets.jsx:147-167) */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '0 -20px 18px',
          padding: '0 20px 4px',
        }}
      >
        {zones.map((z, i) => {
          const isSelected = safeIdx === i;
          return (
            <button
              key={z.id}
              type="button"
              data-testid={`climate-sheet-zone-chip-${i}`}
              data-sheet-focusable="true"
              aria-selected={isSelected}
              onClick={() => setSelectedIdx(i)}
              style={{
                flexShrink: 0,
                padding: '10px 14px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                background: isSelected
                  ? 'rgba(94,175,255,0.18)' // AUDIT-EXCEPTION (sheets.jsx:154)
                  : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
                color: isSelected ? '#5eafff' : 'var(--text-2)', // AUDIT-EXCEPTION (#5eafff)
                border: isSelected
                  ? '0.5px solid rgba(94,175,255,0.4)' // AUDIT-EXCEPTION (sheets.jsx:156)
                  : '0.5px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  // Active (on schedule / mode != hg) → HEAT_TONE; heating now → add glow
                  background: z.on ? HEAT_TONE : 'rgba(255,255,255,0.25)',
                  boxShadow: z.heating ? `0 0 6px ${HEAT_TONE}` : 'none',
                  opacity: z.on ? 1 : 1,
                }}
              />
              {z.name}
            </button>
          );
        })}
      </div>

      {/* RadialDial */}
      <div data-testid="climate-sheet-radial-wrap">
        <RadialDial
          value={pendingTarget}
          min={15}
          max={28}
          color="#5eafff" /* AUDIT-EXCEPTION — thermostat device-class tone */
          label={`${zone.name} · attuale ${zone.current.toFixed(1)}°`}
          onChange={(v) => setPendingTarget(v)}
        />
      </div>

      {/* Setpoint origin — manual override vs schedule. When manual, expose a
          clear "Torna al programma" revert action (clears the override by
          flipping room mode back to 'home' / schedule).
          Detection covers both WS-provided `mode === 'manual'` AND the
          HTTP-fallback case (live target diverges from scheduled value). */}
      <div
        data-testid="climate-sheet-setpoint-origin"
        style={{
          marginTop: 10,
          padding: '8px 12px',
          borderRadius: 12,
          background: isManualOverride
            ? 'rgba(255, 184, 74, 0.1)'
            : 'rgba(255,255,255,0.04)',
          border: isManualOverride
            ? '0.5px solid rgba(255, 184, 74, 0.3)'
            : '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: isManualOverride ? '#ffb84a' : 'var(--text-2)',
              fontWeight: 600,
            }}
          >
            {isManualOverride ? 'Setpoint manuale' : 'Da programma'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {isManualOverride
              ? scheduledForZone !== undefined
                ? `Override a ${zone.target.toFixed(1)}° (programma ${scheduledForZone.toFixed(0)}°)`
                : `Override attivo a ${zone.target.toFixed(1)}°`
              : 'Segue la programmazione'}
          </div>
        </div>
        {isManualOverride && (
          <button
            type="button"
            data-testid="climate-sheet-clear-override"
            data-sheet-focusable="true"
            onClick={() => void setRoomMode(zone.id, 'home')}
            style={{
              flexShrink: 0,
              padding: '8px 12px',
              borderRadius: 10,
              border: '0.5px solid rgba(255, 184, 74, 0.4)',
              background: 'rgba(255, 184, 74, 0.15)',
              color: '#ffb84a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Torna al programma
          </button>
        )}
      </div>

      {/* Confirm button — appears only when dial differs from live target.
          Replaces the previous debounced auto-write (which fired stale
          setRoomSetpoint on every zone switch). */}
      {targetDirty && (
        <button
          type="button"
          data-testid="climate-sheet-apply-setpoint"
          data-sheet-focusable="true"
          onClick={() => void setRoomSetpoint(zone.id, pendingTarget)}
          style={{
            marginTop: 12,
            width: '100%',
            height: 48,
            borderRadius: 14,
            border: 'none',
            background: '#5eafff',
            color: '#0b1220',
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow:
              '0 0 24px color-mix(in oklab, #5eafff 35%, transparent)',
          }}
        >
          <Check size={18} strokeWidth={2.4} />
          Applica {pendingTarget.toFixed(1)}°
        </button>
      )}

      {/* Tipo SheetRow */}
      <SheetRow
        label="Tipo"
        value={zone.kind === 'termostato' ? 'Termostato di stanza' : 'Termovalvola radiatore'}
      >
        <div data-testid="climate-sheet-tipo-toggle">
          <InlineToggle
            on={zone.on}
            color="#5eafff"
            onChange={() => {
              // Tipo toggle flips current state: on → 'home', off → 'manual' (Pitfall 6 option (a)).
              void setRoomMode(zone.id, zone.on ? 'home' : 'manual');
            }}
          />
        </div>
      </SheetRow>

      {/* Low/critical battery valves — quick reference, hidden when all OK */}
      {lowBatteryValves.length > 0 && (
        <div
          data-testid="climate-sheet-battery-warning"
          style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255, 184, 74, 0.08)',
            border: '0.5px solid rgba(255, 184, 74, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: lowBatteryValves.length > 0 ? 8 : 0,
            }}
          >
            <BatteryWarning size={16} color="#ffb84a" />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffb84a' }}>
              Batterie da sostituire
            </div>
          </div>
          {lowBatteryValves.map((v) => {
            const status = classifyBattery(v.battery_level);
            const isUnreachable = v.reachable === false;
            const label =
              status === 'critical'
                ? 'Critica'
                : status === 'low'
                  ? 'Scarica'
                  : isUnreachable
                    ? 'Non raggiungibile'
                    : 'Sconosciuta';
            const color =
              status === 'critical' || isUnreachable ? '#ff4d5c' : '#ffb84a';
            return (
              <div
                key={v.module_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  fontSize: 12,
                  color: 'var(--text-1)',
                }}
              >
                <span>{v.module_name ?? v.room_name ?? v.module_id}</span>
                <span style={{ color, fontWeight: 600 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modalità globale eyebrow */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 22,
          marginBottom: 10,
        }}
      >
        Modalità globale
      </div>

      {/* Mode-pill grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {MODE_PILLS.map((p) => {
          const isSelected =
            p.label === 'Manuale'
              ? anyRoomManual
              : p.backend !== null && homeMode === p.backend;
          return (
            <button
              key={p.label}
              type="button"
              data-testid={`climate-sheet-mode-${p.label.toLowerCase()}`}
              data-sheet-focusable="true"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                if (p.backend !== null) void setHomeMode(p.backend);
                // Pitfall 5: 'Manuale' is UI-only — no setHomeMode call.
              }}
              style={{
                padding: '14px 8px',
                borderRadius: 14,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: isSelected
                  ? 'rgba(94,175,255,0.2)' // AUDIT-EXCEPTION (sheets.jsx:187)
                  : 'rgba(255,255,255,0.05)',
                color: isSelected ? '#5eafff' : 'var(--text-2)',
                border: isSelected
                  ? '0.5px solid rgba(94,175,255,0.4)'
                  : '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ClimateSheetSelfFetch — zero-prop wrapper preserving the Phase 178 D-04
 * contract for callers that don't already mount useThermostatData at card
 * level (notably Section10SheetGallery on /debug/design-system-v2). Production
 * ClimateCard uses the prop-based ClimateSheet directly to avoid double-mount.
 */
export function ClimateSheetSelfFetch() {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const cmds = useThermostatCommands({
    homeId,
    refetch: data.refetch,
  });
  return <ClimateSheet data={data} cmds={cmds} />;
}
