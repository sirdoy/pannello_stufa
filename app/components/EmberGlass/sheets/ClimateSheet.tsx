'use client';

/**
 * ClimateSheet (SHEET-03 / CONTEXT D-06 / D-20) — body-only component (D-04). No props;
 * self-fetches via useThermostatData + useThermostatCommands.
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
import { TriangleAlert } from 'lucide-react';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
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
  kind: 'termostato' | 'termovalvola';
  mode?: string;
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

export function ClimateSheet() {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  // useThermostatData exposes `refetch` (verified — line ~327). `fetchData` does NOT exist;
  // `setError` is internal-only and NOT on the return surface. Per checker WARNING 3.
  const cmds = useThermostatCommands({
    homeId,
    refetch: data.refetch,
  });

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

  const zones: Zone[] = topoRooms.map((r) => {
    const s = statusRooms.find((sr) => sr.room_id === r.id);
    const linkedModule = topoModules.find((m) => m.room_id === r.id);
    const moduleType = linkedModule?.type ?? '';
    return {
      id: r.id,
      name: r.name ?? r.id,
      current: typeof s?.temperature === 'number' ? s.temperature : 0,
      target: typeof s?.setpoint === 'number' ? s.setpoint : 20,
      on: s?.mode !== 'hg',
      kind: moduleType === 'NATherm1' ? 'termostato' : 'termovalvola',
      mode: s?.mode,
    };
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const safeIdx = Math.min(selectedIdx, Math.max(0, zones.length - 1));
  const zone: Zone | undefined = zones[safeIdx];

  const [pendingTarget, setPendingTarget] = useState<number>(zone?.target ?? 20);
  const debouncedTarget = useDebounce(pendingTarget, 500);

  // Reset pending on zone change to prevent cross-zone writes.
  useEffect(() => {
    if (!zone) return;
    setPendingTarget(zone.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx, zone?.id, zone?.target]);

  // Fire setpoint when debounced value diverges from current zone target.
  useEffect(() => {
    if (!zone) return;
    if (debouncedTarget === zone.target) return;
    void setRoomSetpoint(zone.id, debouncedTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTarget, zone?.id, zone?.target, setRoomSetpoint]);

  // Manuale pill selected state: any room mode === 'manual'.
  const anyRoomManual = statusRooms.some((r) => r.mode === 'manual');
  const homeMode = (data.status?.mode as string | undefined) ?? '';

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
                  background: z.on ? '#5eafff' : 'rgba(255,255,255,0.25)', // AUDIT-EXCEPTION
                  boxShadow: z.on ? '0 0 6px #5eafff' : 'none', // AUDIT-EXCEPTION
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
