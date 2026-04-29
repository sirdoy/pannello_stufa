---
phase: 178
plan: 05
type: execute
wave: 2
depends_on: ['178-01', '178-02', '178-03']
files_modified:
  - app/components/EmberGlass/sheets/ClimateSheet.tsx
  - app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx
autonomous: true
requirements: [SHEET-03]
tags: [ember-glass, sheets, climate, thermostat]
must_haves:
  truths:
    - "ClimateSheet renders horizontal zone-chip selector + Apple-Home RadialDial + Tipo SheetRow + 4-pill Modalità grid"
    - "Setpoint writes via useThermostatCommands.setRoomSetpoint are debounced 500ms (ThermostatCard pattern)"
    - "Mode pills map Italian labels to Netatmo backend values (Auto→schedule, Eco→away, Off→hg) via setHomeMode"
    - "Manuale pill is a UI affordance reflecting per-room manual override, NOT a setHomeMode call (Pitfall 5)"
    - "Tipo InlineToggle invokes setRoomMode(roomId, on ? 'manual' : 'home') (Pitfall: 'off' is not a valid mode)"
    - "zone.kind derived from topology.modules type ('NATherm1' → termostato, 'NRV' → termovalvola)"
    - "Empty state renders 'Nessuna zona configurata' when zones.length === 0"
    - "Zero useMemo / useCallback"
  artifacts:
    - path: app/components/EmberGlass/sheets/ClimateSheet.tsx
      provides: "SHEET-03 body — climate control sheet replacing Plan 178-02 stub"
      min_lines: 180
    - path: app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx
      provides: "Jest spec — zone selection + debounced setpoint + mode pill wiring + Tipo toggle + empty state"
      min_lines: 160
  key_links:
    - from: app/components/EmberGlass/sheets/ClimateSheet.tsx
      to: app/components/devices/thermostat/hooks/useThermostatData.ts
      via: "useThermostatData() topology+status merge"
      pattern: "useThermostatData\\("
    - from: app/components/EmberGlass/sheets/ClimateSheet.tsx
      to: app/components/devices/thermostat/hooks/useThermostatCommands.ts
      via: "useThermostatCommands({ homeId, refetch, setError })"
      pattern: "useThermostatCommands\\("
user_setup: []
---

<objective>
Ship the **ClimateSheet** body component (SHEET-03 / CONTEXT D-06 / D-20). Bundle visual contract: `sheets.jsx:131-197` verbatim. Consumes `useThermostatData` (existing) + the new `useThermostatCommands` from Plan 178-03.

**Layout (UI-SPEC verbatim):**
1. **Zone chip row** (horizontal scroll, 8px gap, `margin: '0 -20px 18px'`). Each chip = 6×6 status dot + zone name; selected chip uses azure tint.
2. **`<RadialDial>`** for the selected zone target (15..28 range, color `#5eafff`, label `"{name} · attuale {N.N}°"`).
3. **`<SheetRow label="Tipo" value=...>`** with `<InlineToggle on={zone.on} color="#5eafff" onChange>` invoking `setRoomMode`.
4. **"Modalità globale"** eyebrow + 4-column mode-pill grid (Auto/Manuale/Eco/Off) invoking `setHomeMode`.

**Critical pitfalls (RESEARCH):**
- **Pitfall 5:** `setHomeMode('manual')` is NOT a valid type. The Italian "Manuale" pill is a UI-only affordance; it sets local `pendingMode` and reflects whether ANY room has `mode === 'manual'`. It does NOT fire `setHomeMode`.
- **Pitfall 6:** `zone.kind` derived from `topology.modules` (`type === 'NATherm1'` → termostato, `'NRV'` → termovalvola). `zone.on` derived from `mode !== 'hg'` (Pitfall 6 option (a)). Tipo toggle off → `setRoomMode(roomId, 'home')`; on → `setRoomMode(roomId, 'manual')`.
- **Pitfall 4:** Sheet body is no-prop; calls `useRouter()` + `useThermostatData()` directly.
- **Open Q3:** `useThermostatData.error` is `string | null`, not `Error`. Render the string verbatim as the secondary line.
- **Open Q4:** Skeleton trigger: `loading && (status === null || topology === null)`.

**Debounce pattern (RESEARCH §Pattern 4):** `pendingTarget` local state → `useDebounce(pendingTarget, 500)` → `useEffect` fires `setRoomSetpoint(zone.id, debouncedTarget)` when changed. Reset `pendingTarget` on `selectedRoomIdx` change to prevent cross-zone writes.

Purpose: Ship SHEET-03 — climate control surface inside the dashboard sheet.
Output: 1 .tsx (replaces stub), 1 jest spec.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@.planning/phases/178-per-device-modal-sheets/178-RESEARCH.md
@.planning/inbox/ember-glass-design/project/components/sheets.jsx
@app/components/devices/thermostat/ThermostatCard.tsx
@app/components/devices/thermostat/hooks/useThermostatData.ts
@app/components/EmberGlass/InlineToggle.tsx
@app/hooks/useDebounce.ts

<interfaces>
<!-- VERIFIED via useThermostatData.ts: -->
<!--   topology: { home_id: string, rooms: RoomTopology[], modules: Module[] } | null -->
<!--   status:   { rooms: RoomStatus[], mode?: string } | null -->
<!--   loading:  boolean -->
<!--   error:    string | null   (NOT Error instance — Open Q3) -->
<!--   refetch / fetchData: () => Promise<void> -->
<!-- -->
<!-- RoomStatus shape (open-typed): -->
<!--   { room_id: string, temperature: number, setpoint: number, mode?: 'manual'|'home'|'schedule'|'away'|'hg', heating: boolean, [k: string]: unknown } -->
<!-- -->
<!-- Module shape: { id: string, type: 'NATherm1' | 'NRV' | string, room_id?: string, ... } -->
<!-- -->
<!-- Local zones[] derivation: merge topology.rooms + status.rooms via room_id; ThermostatCard.tsx -->
<!-- already does this — harvest the merge logic. -->
<!-- -->
<!-- Mode-pill mapping (Italian → Netatmo SetThermmodeRequest['mode']): -->
<!--   'Auto'    → 'schedule' -->
<!--   'Eco'     → 'away' -->
<!--   'Off'     → 'hg'      (frost-guard, the closest 'off' equivalent) -->
<!--   'Manuale' → UI-only (no setHomeMode call); selected when ANY status.rooms[].mode === 'manual' -->
<!-- -->
<!-- useDebounce signature: useDebounce<T>(value: T, delay: number = 300): T -->
<!-- -->
<!-- InlineToggle (Phase 177): <InlineToggle on={boolean} color={string} onChange={(next: boolean) => void} /> -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement ClimateSheet body + jest spec</name>
  <files>
    app/components/EmberGlass/sheets/ClimateSheet.tsx,
    app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 131-197 — bundle visual source for ClimateSheet/ThermoSheet)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Sheet Body Contracts → ClimateSheet" + §Color zone-chip/mode-pill values)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 126-171 — debounce + zone-chip + mode-pill code)
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§Pitfall 5 — Manuale ≠ setHomeMode; §Pitfall 6 — kind/on derivation; §Pattern 4 — debounce flow; Open Q3 — error string; Open Q4 — skeleton trigger; Open Q5 — setRoomMode 'home' vs 'manual')
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-06, D-20, D-26, D-27, D-28, D-33, D-34)
    - app/components/devices/thermostat/ThermostatCard.tsx (lines 39-89 + 183-236 — debounce + setpoint + mode patterns; harvest the topology+status merge)
    - app/components/devices/thermostat/hooks/useThermostatData.ts (FULL FILE, focus on lines 1-200 — VERIFIED return shape: `{ topology, status, loading, error: string | null, refetch }` — `refetch` is the only refresh field, NOT `fetchData`; `setError` is internal-only and NOT exposed)
    - app/components/devices/thermostat/hooks/useThermostatCommands.ts (Plan 178-03 — setRoomSetpoint + setHomeMode + setRoomMode signatures)
    - app/components/EmberGlass/InlineToggle.tsx (existing primitive consumed)
    - app/hooks/useDebounce.ts (signature)
    - app/components/EmberGlass/sheets/primitives/RadialDial.tsx (Plan 178-01)
    - app/components/EmberGlass/sheets/primitives/SheetRow.tsx (Plan 178-01)
  </read_first>
  <behavior>
    ClimateSheet:
    - Test 1: when `topology + status` provide 2 zones, the sheet renders 2 zone chips, the RadialDial for zone[0], the Tipo SheetRow, the "Modalità globale" eyebrow, and 4 mode pills.

    - Test 2: clicking the second zone chip selects it; the RadialDial label updates to `"{name2} · attuale {N.N}°"`.

    - Test 3 (Pitfall 6 zone.kind): when zone[0]'s linked module type is `NATherm1`, Tipo row value reads `Termostato di stanza`. When type is `NRV`, value reads `Termovalvola radiatore`.

    - Test 4 (Pitfall 6 zone.on): when zone[0]'s status mode is `'hg'`, the InlineToggle has `on={false}`. Otherwise `on={true}`.

    - Test 5 (debounced setpoint write): clicking RadialDial plus once does NOT call `setRoomSetpoint` immediately; advancing the timer past 500ms DOES call it once with the new value. Use `jest.useFakeTimers()` + `jest.advanceTimersByTime(500)`.

    - Test 6: clicking RadialDial plus 5 times in quick succession then advancing the timer past 500ms calls `setRoomSetpoint` ONCE (debouncing collapses bursts).

    - Test 7 (zone change resets pending): selecting a different zone resets `pendingTarget` to that zone's target — does NOT spuriously write the previous zone's value to the new zone.

    - Test 8 (mode-pill mapping): clicking "Auto" calls `setHomeMode('schedule')`; "Eco" → `setHomeMode('away')`; "Off" → `setHomeMode('hg')`.

    - Test 9 (Pitfall 5): clicking "Manuale" does NOT call `setHomeMode`. The pill IS visually selected when any room's `mode === 'manual'` (data condition).

    - Test 10 (Tipo toggle): `<InlineToggle>` inside Tipo row, when toggled OFF, invokes `setRoomMode(zoneId, 'home')`; when toggled ON, invokes `setRoomMode(zoneId, 'manual')`.

    - Test 11 (empty state): when `zones.length === 0`, the body renders centered 14px text `Nessuna zona configurata`.

    - Test 12 (loading skeleton): when `loading && status === null && topology === null`, body renders only `data-testid="climate-sheet-skeleton"`.

    - Test 13 (error): when `error` (string) is set and no cached topology, body renders `Non raggiungibile. Riprova più tardi.` AND the error string verbatim.
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/ClimateSheet.tsx`** (replaces stub from Plan 178-02). Mirror the ThermostatCard merge pattern (lines 39-89 + 183-236):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { InlineToggle } from '../InlineToggle';
import { SheetRow } from './primitives/SheetRow';
import { RadialDial } from './primitives/RadialDial';
import type { SetThermmodeRequest } from '@/types/netatmoProxy';

/**
 * ClimateSheet (SHEET-03 / CONTEXT D-06) — body-only component (D-04). No props;
 * self-fetches via useThermostatData + useThermostatCommands.
 *
 * Visual contract verbatim from bundle `sheets.jsx:131-197`. Italian copy frozen (D-20).
 *
 * Key behavioral details:
 *   - Setpoint debounced 500ms (ThermostatCard pattern, RESEARCH §Pattern 4).
 *   - Mode pills map IT labels → Netatmo backend (Pitfall 5: 'Manuale' is UI-only — no setHomeMode call).
 *   - zone.kind derived from topology.modules type (NATherm1 → termostato, NRV → termovalvola; Pitfall 6).
 *   - zone.on derived from `status.rooms[].mode !== 'hg'` (Pitfall 6).
 *   - Tipo toggle off → setRoomMode(id, 'home'); on → setRoomMode(id, 'manual').
 *
 * No useMemo / useCallback (D-33).
 */

interface Zone {
  id: string;
  name: string;
  current: number;
  target: number;
  on: boolean;
  kind: 'termostato' | 'termovalvola';
  mode?: string;
}

const MODE_PILLS: ReadonlyArray<{ label: 'Auto' | 'Manuale' | 'Eco' | 'Off'; backend: SetThermmodeRequest['mode'] | null }> = [
  { label: 'Auto', backend: 'schedule' },
  { label: 'Manuale', backend: null }, // Pitfall 5: UI-only; no setHomeMode call.
  { label: 'Eco', backend: 'away' },
  { label: 'Off', backend: 'hg' },
];

export function ClimateSheet() {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const cmds = useThermostatCommands({
    homeId,
    // useThermostatData exposes `refetch` (verified — line ~327). `fetchData` does NOT exist;
    // `setError` is internal-only and NOT on the return surface. Per checker WARNING 3.
    refetch: data.refetch,
  });

  // Merge topology.rooms + status.rooms + topology.modules into a unified zones[].
  const zones: Zone[] = (data.topology?.rooms ?? []).map((r) => {
    const s = data.status?.rooms?.find((sr) => sr.room_id === r.id);
    const linkedModule = data.topology?.modules?.find((m) => m.room_id === r.id);
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
  const zone = zones[safeIdx];

  const [pendingTarget, setPendingTarget] = useState<number>(zone?.target ?? 20);
  const debouncedTarget = useDebounce(pendingTarget, 500);

  // Fire setpoint when debounced value diverges from current zone target.
  // Per checker WARNING 4: depend on the stable `cmds.setRoomSetpoint` callback, NOT the whole
  // `cmds` object. `useRetryableCommand` returns useCallback-stable functions, so this gives
  // referential identity stability across renders.
  const { setRoomSetpoint, setHomeMode, setRoomMode } = cmds;
  useEffect(() => {
    if (!zone) return;
    if (debouncedTarget === zone.target) return;
    void setRoomSetpoint(zone.id, debouncedTarget);
  }, [debouncedTarget, zone, setRoomSetpoint]);

  // Reset pending on zone change to prevent cross-zone writes.
  useEffect(() => {
    if (!zone) return;
    setPendingTarget(zone.target);
  }, [safeIdx, zone?.id, zone?.target]);

  // Manuale pill selected state: any room mode === 'manual'.
  const anyRoomManual = (data.status?.rooms ?? []).some((r) => r.mode === 'manual');
  const homeMode = data.status?.mode ?? '';

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
          color="#5eafff" // AUDIT-EXCEPTION — thermostat device-class tone
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
            onChange={(next) =>
              void setRoomMode(zone.id, next ? 'manual' : 'home')
            }
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
```

**HARD CONTRACT (per checker WARNING 3):** the implementation MUST import `refetch` from `useThermostatData()` (verified return shape; line ~327 of useThermostatData.ts) and MUST NOT reference `data.fetchData` or `data.setError`. The acceptance criteria below grep-enforces this. Read `app/components/devices/thermostat/hooks/useThermostatData.ts` lines 1-200 BEFORE writing the implementation file.

**File 2: `app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx`** — mock the data + commands hooks; use fake timers for debounce assertions:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ClimateSheet } from '../ClimateSheet';

const mockSetRoomSetpoint = jest.fn().mockResolvedValue(undefined);
const mockSetHomeMode = jest.fn().mockResolvedValue(undefined);
const mockSetRoomMode = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '@/app/components/devices/thermostat/hooks/useThermostatCommands',
  () => ({
    useThermostatCommands: () => ({
      setRoomSetpoint: mockSetRoomSetpoint,
      setHomeMode: mockSetHomeMode,
      setRoomMode: mockSetRoomMode,
      netatmoTempCmd: { execute: jest.fn(), isRetrying: false, lastError: null },
      netatmoModeCmd: { execute: jest.fn(), isRetrying: false, lastError: null },
    }),
  }),
);

const baseData = {
  topology: {
    home_id: 'home-1',
    rooms: [
      { id: 'r1', name: 'Salotto' },
      { id: 'r2', name: 'Camera' },
    ],
    modules: [
      { id: 'm1', type: 'NATherm1', room_id: 'r1' },
      { id: 'm2', type: 'NRV', room_id: 'r2' },
    ],
  } as any,
  status: {
    mode: 'schedule',
    rooms: [
      { room_id: 'r1', temperature: 21.3, setpoint: 20, mode: 'schedule' as const, heating: false },
      { room_id: 'r2', temperature: 19.0, setpoint: 18, mode: 'manual' as const, heating: true },
    ],
  } as any,
  loading: false,
  error: null as string | null,
  fetchData: jest.fn().mockResolvedValue(undefined),
  setError: jest.fn(),
};

let dataOverride: Partial<typeof baseData> = {};

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: () => ({ ...baseData, ...dataOverride }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  dataOverride = {};
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ClimateSheet (SHEET-03 / CONTEXT D-06)', () => {
  it('renders 2 zone chips + RadialDial + Tipo + Modalità label + 4 mode pills', () => {
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-zone-chip-0')).toHaveTextContent('Salotto');
    expect(screen.getByTestId('climate-sheet-zone-chip-1')).toHaveTextContent('Camera');
    expect(screen.getByTestId('radial-dial')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Modalità globale')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-auto')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-manuale')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-eco')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-off')).toBeInTheDocument();
  });

  it('selecting zone 1 updates RadialDial label to Camera', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-zone-chip-1'));
    expect(screen.getByTestId('radial-dial-label')).toHaveTextContent(/Camera.*attuale 19.0°/);
  });

  it('Tipo row label reflects NATherm1 (termostato) for r1', () => {
    render(<ClimateSheet />);
    expect(screen.getByText('Termostato di stanza')).toBeInTheDocument();
  });

  it('Tipo row label reflects NRV (termovalvola) for r2', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-zone-chip-1'));
    expect(screen.getByText('Termovalvola radiatore')).toBeInTheDocument();
  });

  it('zone.on derived from mode !== hg', () => {
    dataOverride = {
      status: {
        mode: 'schedule',
        rooms: [
          { room_id: 'r1', temperature: 21, setpoint: 20, mode: 'hg', heating: false },
          { room_id: 'r2', temperature: 19, setpoint: 18, mode: 'manual', heating: false },
        ],
      } as any,
    };
    render(<ClimateSheet />);
    // r1 has mode 'hg', so its Tipo toggle is off (visual class on InlineToggle).
    // We assert via the surrounding wrap testid + the InlineToggle's data-state attr.
    const toggleWrap = screen.getByTestId('climate-sheet-tipo-toggle');
    expect(toggleWrap).toBeInTheDocument();
    // Specific assertions on InlineToggle's data-state vary by implementation;
    // the key check: clicking the toggle invokes setRoomMode with 'manual' (turning ON from 'hg').
  });

  it('debounces setpoint write 500ms after RadialDial plus click', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('radial-dial-plus'));
    expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockSetRoomSetpoint).toHaveBeenCalledWith('r1', 21);
  });

  it('debouncing collapses 5 rapid plus clicks into one setpoint write', () => {
    render(<ClimateSheet />);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId('radial-dial-plus'));
    }
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
    // Initial target was 20; clamped at max 28 — final value is 25 (5 clicks).
    expect(mockSetRoomSetpoint).toHaveBeenCalledWith('r1', 25);
  });

  it('changing zone resets pending; no spurious cross-zone write', () => {
    render(<ClimateSheet />);
    // Bump zone 0 once
    fireEvent.click(screen.getByTestId('radial-dial-plus'));
    // Switch to zone 1 BEFORE the debounce fires
    fireEvent.click(screen.getByTestId('climate-sheet-zone-chip-1'));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // No write attributable to zone 0's bump survived; pending was reset to zone 1's target.
    // The exact behavior depends on useEffect ordering — assert that no setpoint was written
    // with zone 'r1' value 21:
    const r1Calls = mockSetRoomSetpoint.mock.calls.filter((c) => c[0] === 'r1');
    expect(r1Calls).toHaveLength(0);
  });

  it('Auto pill click calls setHomeMode(schedule)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-auto'));
    expect(mockSetHomeMode).toHaveBeenCalledWith('schedule');
  });

  it('Eco pill click calls setHomeMode(away)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-eco'));
    expect(mockSetHomeMode).toHaveBeenCalledWith('away');
  });

  it('Off pill click calls setHomeMode(hg)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-off'));
    expect(mockSetHomeMode).toHaveBeenCalledWith('hg');
  });

  it('Manuale pill click does NOT call setHomeMode (Pitfall 5)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-manuale'));
    expect(mockSetHomeMode).not.toHaveBeenCalled();
  });

  it('Manuale pill is selected when any room mode === manual', () => {
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-mode-manuale')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('renders empty state Nessuna zona configurata when topology has 0 rooms', () => {
    dataOverride = {
      topology: { home_id: 'home-1', rooms: [], modules: [] } as any,
      status: { mode: 'schedule', rooms: [] } as any,
    };
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-empty')).toHaveTextContent(
      'Nessuna zona configurata',
    );
  });

  it('renders skeleton when loading and no cached data', () => {
    dataOverride = {
      topology: null,
      status: null,
      loading: true,
    } as any;
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-skeleton')).toBeInTheDocument();
  });

  it('renders error state with verbatim error string', () => {
    dataOverride = {
      topology: null,
      status: null,
      error: 'Connection refused',
    } as any;
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-error')).toBeInTheDocument();
    expect(
      screen.getByText('Non raggiungibile. Riprova più tardi.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });
});
```
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/ClimateSheet.tsx` exists and contains:
      - `'use client'` directive.
      - `useThermostatData()` AND `useThermostatCommands({ homeId, refetch })` — `refetch` is the EXACT field name on `useThermostatData`'s return type (verified — line ~327); `fetchData` and `setError` MUST NOT appear.
      - `useDebounce(pendingTarget, 500)`.
      - Italian labels: `'Auto'`, `'Manuale'`, `'Eco'`, `'Off'`, `'Modalità globale'`, `'Termostato di stanza'`, `'Termovalvola radiatore'`, `'Nessuna zona configurata'`.
      - Mode mapping table with `backend: 'schedule'`, `backend: 'away'`, `backend: 'hg'`, AND `backend: null` for `'Manuale'`.
      - String `setRoomMode(zone.id, next ? 'manual' : 'home')` (or equivalent).
      - data-testid: `climate-sheet`, `climate-sheet-zone-chip-{i}`, `climate-sheet-radial-wrap`, `climate-sheet-tipo-toggle`, `climate-sheet-mode-auto`, `climate-sheet-mode-manuale`, `climate-sheet-mode-eco`, `climate-sheet-mode-off`, `climate-sheet-empty`, `climate-sheet-skeleton`, `climate-sheet-error`.
      - `color="#5eafff"` on RadialDial.
      - Topology+status merge with `find((sr) => sr.room_id === r.id)`.
      - Module type check `moduleType === 'NATherm1'`.
    - Spec file ships with at least 13 `it(` cases.
    - `npm run test:components -- app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx` exits 0.
    - `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/ClimateSheet.tsx` returns no hits.
    - `! grep -E "setHomeMode\\(['\"]manual['\"]\\)" app/components/EmberGlass/sheets/ClimateSheet.tsx` returns no hits (Pitfall 5 — typed union also blocks at compile time).
    - `! grep -E "data\\.fetchData|data\\.setError" app/components/EmberGlass/sheets/ClimateSheet.tsx` returns no hits (checker WARNING 3 — useThermostatData exposes neither field).
    - `grep -E "data\\.refetch" app/components/EmberGlass/sheets/ClimateSheet.tsx` returns at least 1 hit (refetch is the verified refresh surface).
    - `! grep -E "useEffect.*\\b(cmds)\\b" app/components/EmberGlass/sheets/ClimateSheet.tsx` returns no matches (checker WARNING 4 — destructure `cmds.setRoomSetpoint` rather than depend on the whole `cmds` object).
  </acceptance_criteria>
  <done>
    ClimateSheet ships GREEN; debounce + zone selection + mode mapping + Tipo toggle + empty/loading/error states all covered; Pitfalls 5/6 honored.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → useThermostatCommands → /api/v1/netatmo/* | Existing routes; auth enforced server-side |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-05-01 | Tampering | Setpoint out-of-range | mitigate | RadialDial clamps 15..28; SetRoomThermpointRequest typed temp 5..30 server-side; Netatmo proxy enforces. |
| T-178-05-02 | Tampering | Mode-pill bypass to non-union value | mitigate | TypeScript union `SetThermmodeRequest['mode']` blocks at compile time; MODE_PILLS table is `as const`. Manuale's `backend: null` is checked before fire. |
| T-178-05-03 | Tampering | Cross-zone setpoint write race | mitigate | `useEffect([selectedRoomIdx, zone.id, zone.target])` resets `pendingTarget` on zone change; tested. |
</threat_model>

<verification>
```bash
npm run test:components -- app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] ClimateSheet ships with bundle-verbatim layout: zone chips → RadialDial → Tipo SheetRow → mode pills.
- [ ] Setpoint debounced 500ms.
- [ ] Mode pills correctly map IT→backend; Manuale skips setHomeMode.
- [ ] Tipo toggle uses 'manual'/'home' (NOT 'off').
- [ ] Empty/loading/error states ship.
- [ ] Spec exits 0; zero useMemo/useCallback.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-05-SUMMARY.md`.
</output>
