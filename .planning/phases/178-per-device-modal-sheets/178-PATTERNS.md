# Phase 178: Per-Device Modal Sheets - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 22 new + 7 modified = 29 total
**Analogs found:** 29 / 29 (100% — every new file has a strong codebase or bundle analog)

---

## File Classification

### New files (22)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `app/components/EmberGlass/sheets/StoveSheet.tsx` | component (sheet body) | event-driven (hooks → commands) | `app/components/EmberGlass/cards/StoveCard.tsx` + bundle `sheets.jsx:67-130` | exact (role + bundle visual) |
| `app/components/EmberGlass/sheets/ClimateSheet.tsx` | component (sheet body) | event-driven + debounced write | `app/components/devices/thermostat/ThermostatCard.tsx:39-89, 183-236` + bundle `sheets.jsx:132-197` | exact |
| `app/components/EmberGlass/sheets/LightsSheet.tsx` | component (sheet body) | event-driven (CRUD-by-room) | `app/components/EmberGlass/cards/LightsCard.tsx` + bundle `sheets.jsx:199-297` | exact |
| `app/components/EmberGlass/sheets/SonosSheet.tsx` | component (sheet body) | event-driven + debounced volume + batch | `app/components/EmberGlass/cards/SonosCard.tsx` + bundle `sheets.jsx:308-398` | exact |
| `app/components/EmberGlass/sheets/PlugsSheet.tsx` | component (sheet body) | event-driven (per-plug toggle) | `app/components/EmberGlass/cards/TuyaCard.tsx` + bundle `sheets.jsx:400-466` | exact |
| `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` | component (presentational) | request-response (slot) | bundle `sheets.jsx:469-482` (verbatim port) | exact |
| `app/components/EmberGlass/sheets/primitives/Stepper.tsx` | component (presentational) | event-driven (button clicks) | bundle `sheets.jsx:484-500` (verbatim port) | exact |
| `app/components/EmberGlass/sheets/primitives/Slider.tsx` | component (presentational) | event-driven (range input) | bundle `sheets.jsx:502-513` (verbatim port) | exact |
| `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` | component (presentational SVG) | event-driven (± buttons) | bundle `sheets.jsx:536-579` (verbatim port) | exact |
| `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` | component (presentational) | event-driven (button click) | bundle `sheets.jsx:581-592` (verbatim port) | exact |
| `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` | component (presentational) | event-driven (button click) | bundle `sheets.jsx:299-306` `quickBtn` helper (port to component) | exact |
| `app/components/EmberGlass/sheets/lib/findSceneByName.ts` | utility (pure function) | transform | inline literal in bundle + `lib/utils/dashboardColumns.ts` (pure-helper structure) | role-match |
| `app/components/EmberGlass/sheets/index.ts` | config (barrel) | — | `app/components/EmberGlass/index.ts` lines 1-36 | exact |
| `app/components/devices/thermostat/hooks/useThermostatCommands.ts` | hook (commands) | request-response (POST + retry) | `app/components/devices/lights/hooks/useLightsCommands.ts` | exact |
| `app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx` | test | jest+RTL render | existing sheet primitive specs (`tests/smoke/sheet-primitive.spec.ts` is e2e — closest jest analog: `app/components/EmberGlass/__tests__/`) | role-match |
| `app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx` | test | jest+RTL | same as above | role-match |
| `app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx` | test | jest+RTL | same | role-match |
| `app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx` | test | jest+RTL | same | role-match |
| `app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx` | test | jest+RTL | same | role-match |
| `app/components/EmberGlass/sheets/primitives/__tests__/{SheetRow,Stepper,Slider,RadialDial,SheetBtn,QuickActionButton}.test.tsx` | test (× 6) | jest+RTL | same | role-match |
| `app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` | test | jest pure | any `lib/utils/__tests__/*.test.ts` | role-match |
| `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` | test (hook) | jest + fetch mock | `app/components/devices/lights/hooks/__tests__/useLightsCommands.test.ts` (same pattern) | exact |

### Modified files (7)

| Modified File | Role | Edit Type | Reference |
|---------------|------|-----------|-----------|
| `app/components/EmberGlass/cards/StoveCard.tsx` | component | single-line swap | line 100: `<SheetPlaceholderBody phase="178" device="stove" />` → `<StoveSheet />` |
| `app/components/EmberGlass/cards/ClimateCard.tsx` | component | single-line swap | identical pattern (locate `<SheetPlaceholderBody phase="178" device="thermostat" />`) |
| `app/components/EmberGlass/cards/LightsCard.tsx` | component | single-line swap | identical pattern |
| `app/components/EmberGlass/cards/SonosCard.tsx` | component | single-line swap | identical pattern |
| `app/components/EmberGlass/cards/TuyaCard.tsx` | component | single-line swap | identical pattern (`device="plugs-tuya"`) |
| `app/components/EmberGlass/index.ts` | config (barrel) | append re-exports | mirror lines 24-35 pattern |
| `tests/smoke/dashboard-glass-cards.spec.ts` | test (e2e) | append 5 describe blocks | mirror lines 222-231 `for (const card of INTERACTIVE_CARDS)` pattern |
| `app/globals.css` | config | 3-LOC append | mirror existing `[data-pressable-focusable]:focus-visible` rule |

---

## Pattern Assignments

### `app/components/EmberGlass/sheets/StoveSheet.tsx` (component, event-driven)

**Primary analog:** `app/components/EmberGlass/cards/StoveCard.tsx` (hook plumbing) + bundle `sheets.jsx:67-130` (visual contract).

**Imports + hook plumbing pattern** (StoveCard.tsx:26-42):
```typescript
'use client';

import { useState } from 'react';
import { Flame } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { FlameViz } from '../FlameViz';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useVersion } from '@/app/context/VersionContext';

export default function StoveCard() {
  const [open, setOpen] = useState(false);
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stove = useStoveData({ checkVersion, userId: user?.sub });
```
**Apply to StoveSheet:** strip the GlassCard/Sheet wrapper (StoveSheet is body-only per D-04). Add `useRouter()` from `next/navigation` for `/stove/scheduler`/`/stove/maintenance` navigation. Add `useStoveCommands({ stoveData: stove, router, user })`. Wrap Stepper `onChange` to fit handler signature: `onChange={(v) => void cmds.handlePowerChange({ target: { value: String(v) } })}` (handler signature verified `useStoveCommands.ts:171`).

**Visual contract — hero block** (bundle `sheets.jsx:71-92`):
```jsx
<div style={{
  borderRadius: 24, padding: '24px 20px',
  background: s.on
    ? `linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)`
    : 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.06)',
  display: 'flex', alignItems: 'center', gap: 20,
}}>
  <FlameViz on={s.on} intensity={s.power / 5} />
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
      {s.on ? 'In funzione' : 'Spenta'}
    </div>
    {/* PHASE 178 ADAPTER: drop temp/target/pellet — see Pitfall 11. Replace with powerLevel/5 hero. */}
  </div>
</div>
```

**Primary action button** (bundle `sheets.jsx:114-127`):
```jsx
<button
  disabled={needsCleaning}
  onClick={() => void (isAccesa ? cmds.handleShutdown() : cmds.handleIgnite())}
  style={{
    marginTop: 18, width: '100%', height: 56, borderRadius: 18, border: 'none',
    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer',
    background: isAccesa ? 'rgba(255, 77, 92, 0.15)' : 'var(--accent)',
    color: isAccesa ? '#ff6676' : '#1a0f08',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    boxShadow: isAccesa ? 'none' : '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)',
    border: isAccesa ? '0.5px solid rgba(255, 77, 92, 0.25)' : 'none',
  }}>
  <Power size={18} strokeWidth={2.2} />
  {needsCleaning ? 'Manutenzione richiesta' : (isAccesa ? 'Spegni stufa' : 'Accendi stufa')}
</button>
```

**No `useMemo` / `useCallback`** (D-33). React Compiler 1.0 auto-memoizes.

---

### `app/components/EmberGlass/sheets/ClimateSheet.tsx` (component, event-driven + debounced)

**Primary analog:** `app/components/devices/thermostat/ThermostatCard.tsx` (debounce + setpoint pattern) + bundle `sheets.jsx:132-197`.

**Debounce pattern** (RESEARCH §"Pattern 4" + ThermostatCard precedent):
```typescript
import { useDebounce } from '@/app/hooks/useDebounce';

const [pendingTarget, setPendingTarget] = useState<number>(zone.target);
const debouncedTarget = useDebounce(pendingTarget, 500);

useEffect(() => {
  if (debouncedTarget === zone.target) return;
  void cmds.setRoomSetpoint(zone.id, debouncedTarget);
}, [debouncedTarget, zone.id, zone.target, cmds]);

// Reset pending on zone change to prevent cross-zone writes
useEffect(() => {
  setPendingTarget(zone.target);
}, [selectedRoomIdx, zone.target]);
```

**Zone chip row** (bundle `sheets.jsx:147-167`):
```jsx
<div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: '0 -20px 18px', padding: '0 20px 4px' }}>
  {zones.map((z, i) => (
    <button key={z.id} onClick={() => setSelectedIdx(i)} style={{
      flexShrink: 0, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      background: selectedRoomIdx === i ? 'rgba(94,175,255,0.18)' : 'rgba(255,255,255,0.05)',
      color: selectedRoomIdx === i ? '#5eafff' : 'var(--text-2)',
      border: selectedRoomIdx === i ? '0.5px solid rgba(94,175,255,0.4)' : '0.5px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: 999,
        background: z.on ? '#5eafff' : 'rgba(255,255,255,0.25)',
        boxShadow: z.on ? '0 0 6px #5eafff' : 'none',
      }} />
      {z.name}
    </button>
  ))}
</div>
```

**Mode pill grid + Tipo SheetRow** — bundle `sheets.jsx:173-194`. Map mode buttons to `cmds.setHomeMode('schedule'|'away'|'hg')`. Note Pitfall 5: "Manuale" pill is NOT a `setHomeMode` call — derive from `status.rooms[].mode === 'manual'`.

---

### `app/components/EmberGlass/sheets/LightsSheet.tsx` (component, event-driven)

**Primary analog:** `app/components/EmberGlass/cards/LightsCard.tsx` (hook plumbing — see lines 30-59) + bundle `sheets.jsx:199-297`.

**Hook plumbing** (LightsCard.tsx:44-59 — copy verbatim):
```typescript
const router = useRouter();
const lightsData = useLightsData();
const cmds = useLightsCommands({
  lightsData: {
    setRefreshing: lightsData.setRefreshing,
    setLoadingMessage: lightsData.setLoadingMessage,
    setError: lightsData.setError,
    fetchData: lightsData.fetchData,
    groups: lightsData.groups,
    checkConnection: lightsData.checkConnection,
    connected: lightsData.connected,
  },
  router,
});
```

**byRoom mapping** (RESEARCH Pitfall 9, replaces bundle `sheets.jsx:211-214` reduce):
```typescript
const byRoom: Record<string, { lights: HueLight[]; group: HueGroup }> = {};
for (const group of lightsData.groups) {
  if (group.type !== 'Room') continue; // skip Zone/LightGroup
  byRoom[group.name] = {
    lights: lightsData.lights.filter(l => group.lights.includes(l.light_id)),
    group,
  };
}
```

**Scene strip** (bundle `sheets.jsx:216-264`) — use `findSceneByName(scenes, name)` for each of the 4 names. Disabled state: `opacity: 0.5, cursor: 'not-allowed', title="Crea scena '{name}' su Hue"`.

**Per-room toggle row** — invokes `cmds.handleRoomToggle(group.group_id, !groupOn)` (room-level, not per-light — Pitfall 9 option (a)).

---

### `app/components/EmberGlass/sheets/SonosSheet.tsx` (component, event-driven + debounce + batch)

**Primary analog:** `app/components/EmberGlass/cards/SonosCard.tsx` (field adapter for `coordinator_name → name`) + bundle `sheets.jsx:308-398`.

**Field adapter** (RESEARCH §"Field Gaps" — Sonos):
```typescript
// Bundle assumes `g.name`/`g.playing`/`g.track`/`g.artist`/`g.volume`. Real shape from useSonosFullData:
const groups = (sonosData.data?.zones ?? []).map((zone) => {
  const playback = sonosData.data?.playback?.[zone.group_id];
  return {
    id: zone.group_id,
    name: zone.coordinator_name ?? zone.label ?? '',
    playing: playback?.transport_state === 'PLAYING',
    track: playback?.title ?? '',
    artist: playback?.artist ?? '',
    volume: sonosData.data?.volumes?.[zone.coordinator_uid]?.volume ?? 0,
    coordinator_uid: zone.coordinator_uid, // flat string, NOT nested
  };
});
```

**Master button — Promise.allSettled** (RESEARCH §"Architecture" + memory v16.0 batch):
```typescript
const handleMasterToggle = async () => {
  const anyPlaying = groups.some(g => g.playing);
  await Promise.allSettled(
    groups.map(g => anyPlaying ? cmds.handlePause(g.id) : cmds.handlePlay(g.id))
  );
};
```

**Volume slider — 250ms debounce + per-group write via coordinator** (RESEARCH Pitfall 7):
```typescript
const debouncedVolume = useDebounce(pendingVolume, 250);
useEffect(() => {
  if (debouncedVolume === selectedGroup.volume) return;
  void cmds.handleSetZoneVolume(selectedGroup.id, debouncedVolume); // group-level
}, [debouncedVolume, selectedGroup.id, selectedGroup.volume, cmds]);
```

**Group-row play/pause with `e.stopPropagation()`** (bundle `sheets.jsx:358-367`):
```jsx
<button
  data-testid={`sonos-sheet-row-play-${g.id}`}
  onClick={(e) => {
    e.stopPropagation();
    setSelectedIdx(i);
    void (g.playing ? cmds.handlePause(g.id) : cmds.handlePlay(g.id));
  }}
  style={{
    width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
    background: g.playing ? '#fff' : 'rgba(255,255,255,0.08)',
    color: g.playing ? '#1a0f08' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
  {g.playing ? <Pause size={14} strokeWidth={2.4} /> : <Play size={14} strokeWidth={2.4} />}
</button>
```

---

### `app/components/EmberGlass/sheets/PlugsSheet.tsx` (component, event-driven)

**Primary analog:** `app/components/EmberGlass/cards/TuyaCard.tsx` (hook plumbing) + bundle `sheets.jsx:400-466`.

**Field adapter** (RESEARCH Pitfall 8 — drop `room` segment):
```typescript
const plugs = (tuyaData.plugs ?? []).map((p) => ({
  id: p.device_id,
  name: p.custom_name ?? p.device_id,
  on: p.switch_on === true,
  power: p.power_w ?? 0,
  // room: undefined — drop subtitle room segment per Pitfall 8(a)
}));

const onCount = plugs.filter(p => p.on).length;
const totalPower = plugs.reduce((sum, p) => sum + p.power, 0);
```

**Power formatting** (bundle `sheets.jsx:432-433, 457`):
```jsx
{totalPower >= 1000 ? (totalPower / 1000).toFixed(2) : totalPower}
<span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>
  {totalPower >= 1000 ? 'kW' : 'W'}
</span>
```

**Toggle (no retry — Pitfall 10):**
```jsx
<InlineToggle
  on={p.on}
  color="#ffb84a"
  onChange={() => void cmds.togglePlug(p.id, p.on)}
/>
```

---

### `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` (component, slot-based)

**Analog:** bundle `sheets.jsx:469-482` (verbatim port).

**Verbatim port:**
```typescript
import type { ReactNode } from 'react';

export interface SheetRowProps {
  label: string;
  value?: string;
  children?: ReactNode;
}

export function SheetRow({ label, value, children }: SheetRowProps) {
  return (
    <div data-testid="sheet-row" style={{
      marginTop: 18, padding: '14px 0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
      gap: 12,
    }}>
      <div>
        <div data-testid="sheet-row-label" style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>
          {label}
        </div>
        {value && (
          <div data-testid="sheet-row-value" style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {value}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
```

---

### `app/components/EmberGlass/sheets/primitives/Stepper.tsx` (component, button events)

**Analog:** bundle `sheets.jsx:484-500` (verbatim port + lucide-react icons + `data-sheet-focusable`).

**Verbatim port:**
```typescript
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export function Stepper({ value, min, max, onChange }: StepperProps) {
  return (
    <div data-testid="stepper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        data-testid="stepper-minus"
        data-sheet-focusable="true"
        aria-label="Diminuisci"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36, height: 36, borderRadius: 999, border: 'none',
          background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION
          color: '#fff', cursor: 'pointer',
        }}>
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <div data-testid="stepper-value" style={{
        minWidth: 36, textAlign: 'center',
        fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#fff',
      }}>
        {value}
      </div>
      <button
        data-testid="stepper-plus"
        data-sheet-focusable="true"
        aria-label="Aumenta"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36, height: 36, borderRadius: 999, border: 'none',
          background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION
          color: '#fff', cursor: 'pointer',
        }}>
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
```

**JSDoc note:** "Callers wrap onChange to fit consuming hook signature. Example: `useStoveCommands.handlePowerChange({ target: { value: String(v) } })`." Prevents Phase 179 from repeating the wrap mistake.

---

### `app/components/EmberGlass/sheets/primitives/Slider.tsx`, `RadialDial.tsx`, `SheetBtn.tsx`, `QuickActionButton.tsx`

**Analogs (all verbatim from bundle):**
- `Slider.tsx` ← `sheets.jsx:502-513`
- `RadialDial.tsx` ← `sheets.jsx:536-579` (full SVG + ± buttons)
- `SheetBtn.tsx` ← `sheets.jsx:581-592`
- `QuickActionButton.tsx` ← `sheets.jsx:299-306` (the `quickBtn` style helper, ported to component)

Each adds `data-testid` per UI-SPEC §"Component API" + `data-sheet-focusable="true"` on every button. No `<Pressable>` wrap (D-24).

---

### `app/components/EmberGlass/sheets/lib/findSceneByName.ts` (utility, transform)

**Analog:** structurally similar to any pure helper in `lib/utils/`. Verbatim port from RESEARCH §"Code Examples":
```typescript
import type { HueScene } from '@/types/hueProxy';

/**
 * Case-insensitive scene name lookup. Returns null if no match.
 * First match wins (callers responsible for catalog uniqueness).
 *
 * Source: CONTEXT D-07 / UI-SPEC §LightsSheet
 */
export function findSceneByName(catalog: readonly HueScene[], name: string): HueScene | null {
  const target = name.toLowerCase();
  return catalog.find(s => s.name.toLowerCase() === target) ?? null;
}
```

---

### `app/components/EmberGlass/sheets/index.ts` (config, barrel)

**Analog:** `app/components/EmberGlass/index.ts` lines 1-36 (mirror the named-export + type-export pattern):
```typescript
// Bodies
export { StoveSheet } from './StoveSheet';
export { ClimateSheet } from './ClimateSheet';
export { LightsSheet } from './LightsSheet';
export { SonosSheet } from './SonosSheet';
export { PlugsSheet } from './PlugsSheet';

// Sub-primitives
export { SheetRow } from './primitives/SheetRow';
export type { SheetRowProps } from './primitives/SheetRow';
export { Stepper } from './primitives/Stepper';
export type { StepperProps } from './primitives/Stepper';
export { Slider } from './primitives/Slider';
export type { SliderProps } from './primitives/Slider';
export { RadialDial } from './primitives/RadialDial';
export type { RadialDialProps } from './primitives/RadialDial';
export { SheetBtn } from './primitives/SheetBtn';
export type { SheetBtnProps } from './primitives/SheetBtn';
export { QuickActionButton } from './primitives/QuickActionButton';
export type { QuickActionButtonProps } from './primitives/QuickActionButton';

// Helper
export { findSceneByName } from './lib/findSceneByName';
```

Then in `app/components/EmberGlass/index.ts` append:
```typescript
export * from './sheets';
```

---

### `app/components/devices/thermostat/hooks/useThermostatCommands.ts` (hook, request-response + retry)

**Primary analog:** `app/components/devices/lights/hooks/useLightsCommands.ts` (full file structure + `useRetryableCommand` pattern).

**Imports + signature** (mirror useLightsCommands.ts:19-44):
```typescript
'use client';

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import { NETATMO_ROUTES } from '@/lib/routes';
import type { SetRoomThermpointRequest, SetThermmodeRequest } from '@/types/netatmoProxy';

export interface UseThermostatCommandsParams {
  homeId: string;
  refetch: () => Promise<void>;
  setError?: (e: string | null) => void;
}

export interface UseThermostatCommandsReturn {
  setRoomSetpoint: (roomId: string, target: number) => Promise<void>;
  setHomeMode: (mode: SetThermmodeRequest['mode']) => Promise<void>;
  setRoomMode: (roomId: string, mode: SetRoomThermpointRequest['mode']) => Promise<void>;
  netatmoTempCmd: ReturnType<typeof useRetryableCommand>;
  netatmoModeCmd: ReturnType<typeof useRetryableCommand>;
}
```

**Body shape** (RESEARCH §"Verified useThermostatCommands request bodies"):
```typescript
export function useThermostatCommands(params: UseThermostatCommandsParams): UseThermostatCommandsReturn {
  const netatmoTempCmd = useRetryableCommand({ device: 'netatmo', action: 'setRoomSetpoint' });
  const netatmoModeCmd = useRetryableCommand({ device: 'netatmo', action: 'setHomeMode' });

  const setRoomSetpoint = async (roomId: string, target: number) => {
    const body: SetRoomThermpointRequest = {
      home_id: params.homeId,
      room_id: roomId,
      mode: 'manual',
      temp: target,
    };
    const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res?.ok) await params.refetch();
  };

  const setHomeMode = async (mode: SetThermmodeRequest['mode']) => {
    const body: SetThermmodeRequest = { home_id: params.homeId, mode };
    const res = await netatmoModeCmd.execute(NETATMO_ROUTES.setThermMode, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res?.ok) await params.refetch();
  };

  // ... setRoomMode similar (manual | home — NOT 'off') ...

  return { setRoomSetpoint, setHomeMode, setRoomMode, netatmoTempCmd, netatmoModeCmd };
}
```

**Error handling** (try/catch with `err instanceof Error` guard, mirror useLightsCommands.ts:101-103):
```typescript
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  params.setError?.(message);
}
```

---

### `tests/smoke/dashboard-glass-cards.spec.ts` (test, e2e — extension)

**Analog:** existing block at lines 222-231 (`for (const card of INTERACTIVE_CARDS)`).

**Append 5 new describe blocks** — mirror the route-mock + click + assert pattern:
```typescript
test.describe('SHEET-02 StoveSheet wires command', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/thermorossi/settings/power', (route) =>
      route.fulfill({ status: 202, body: JSON.stringify({ suggested_poll_delay_s: 1 }) })
    );
  });

  test('clicking + on power stepper fires setPower command', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('stove-card').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 2000 });
    await dialog.getByTestId('stove-sheet-power-stepper').getByTestId('stepper-plus').click();
    // assert mocked route hit (Playwright records page.route calls)
    cleanup();
    expect(errors).toHaveLength(0);
  });
});
// repeat for SHEET-03 (climate), SHEET-04 (lights), SHEET-05 (sonos), SHEET-06 (plugs)
```

**Reuse verbatim:** `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, the `beforeEach` setup at lines 134-180.

---

### Card single-line swap (5 cards)

**Analog:** any of the 5 card files. Line example from `StoveCard.tsx:100`:

**Before:**
```tsx
<Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
  <SheetPlaceholderBody phase="178" device="stove" />
</Sheet>
```

**After:**
```tsx
<Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
  <StoveSheet />
</Sheet>
```

Plus add `import { StoveSheet } from '../sheets/StoveSheet';` and remove the `SheetPlaceholderBody` import. Same shape per card; titles already locked by Phase 177 D-14.

---

## Shared Patterns

### Optimistic toggle via `<InlineToggle>`

**Source:** `app/components/EmberGlass/InlineToggle.tsx` (Phase 177 primitive — consumed unchanged)
**Apply to:** ClimateSheet (Tipo), LightsSheet (per-room), PlugsSheet (per-plug)
```tsx
<InlineToggle
  on={zone.on}
  color="#5eafff"  // device-class hex (or "#f5c84a" for lights, "#ffb84a" for plugs)
  onChange={(e) => {
    e.stopPropagation();
    void cmds.someCommand(...);
  }}
/>
```

### Inline-style + `var(--token)` (D-02 mandate)

**Source:** Phase 174 D-12, every `EmberGlass/cards/*.tsx` file
**Apply to:** ALL sheet bodies + sub-primitives — no Tailwind classes for visual values.

```tsx
style={{
  fontFamily: 'var(--font-display)',
  color: 'var(--text-1)',
  background: 'var(--accent)',
  // bundle-verbatim AUDIT-EXCEPTION literals tagged inline
  border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
}}
```

### `useRetryableCommand` for new commands hook

**Source:** `app/components/devices/lights/hooks/useLightsCommands.ts:73-74`
**Apply to:** `useThermostatCommands` (the only new hook)
```typescript
const netatmoTempCmd = useRetryableCommand({ device: 'netatmo', action: 'setRoomSetpoint' });
```

### Error guard with `err instanceof Error`

**Source:** `useLightsCommands.ts:101-103` (project-wide pattern)
**Apply to:** `useThermostatCommands` + every sheet body's error fallback path (D-27)
```typescript
const message = err instanceof Error ? err.message : String(err);
```

### Debounced write (`useDebounce` + `useEffect`)

**Source:** `app/components/devices/thermostat/ThermostatCard.tsx:39-89`
**Apply to:** ClimateSheet (500ms setpoint), SonosSheet (250ms volume)
```typescript
const debounced = useDebounce(pending, 500);
useEffect(() => {
  if (debounced === current) return;
  void cmds.write(id, debounced);
}, [debounced, id, current, cmds]);
```

### Batched writes with `Promise.allSettled`

**Source:** memory v16.0 batch pattern; SonosSheet master button (CONTEXT specifics)
**Apply to:** SonosSheet master "Riproduci/Pausa ovunque", LightsSheet "Tutte on/off" (existing handler `handleAllLightsToggle` already iterates internally).
```typescript
await Promise.allSettled(items.map(item => cmd(item.id)));
```

### `data-testid` selector convention

**Source:** Phase 176/177 precedent (e.g., `data-testid="stove-card"`, `stove-temp`, `flame-viz-wrapper`)
**Apply to:** Every sheet body + every sub-primitive + every interactive control
- Sheet bodies: `stove-sheet`, `climate-sheet`, `lights-sheet`, `sonos-sheet`, `plugs-sheet`
- Sub-primitives: `sheet-row`, `stepper`, `stepper-{minus,value,plus}`, `slider`, `radial-dial`, `radial-dial-{value,label,minus,plus}`, `sheet-btn`, `sheet-btn-{slug}`
- Sheet-scoped: `stove-sheet-power-stepper`, `lights-sheet-scene-rilassante`, `sonos-sheet-row-play-{groupId}`, etc.

### React Compiler discipline

**Source:** Phase 71 / 95 (`npx react-compiler-healthcheck`)
**Apply to:** Every new `.tsx` file and the new commands hook. Verification grep:
```bash
! grep -rEn "useMemo|useCallback" app/components/EmberGlass/sheets app/components/devices/thermostat/hooks/useThermostatCommands.ts
```

### `data-sheet-focusable="true"` + globals.css 3-LOC append

**Source:** `app/globals.css:360-388` `[data-pressable-focusable]:focus-visible` rule (mirror exactly).
**Apply to:** Every interactive sheet sub-primitive button.
```css
/* Phase 178 — sheet sub-primitive focus ring */
[data-sheet-focusable="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Field adapter pattern (bundle → live hook)

**Source:** `app/components/EmberGlass/cards/SonosCard.tsx:41-50` (existing precedent)
**Apply to:** Every sheet body. Define a small adapter at the top of the component that maps live hook fields to bundle prop names. Concrete mappings in RESEARCH §"Field Gaps" canonical reference.

### Loading skeleton + error state (D-26 / D-27)

**Source:** `SheetPlaceholderBody.tsx` structure (centered icon + 14px primary + 12px secondary).
**Apply to:** Every sheet body's loading + error path.
```tsx
if (isLoading) return <div style={{ height: 360, opacity: 0.6 }} className="animate-pulse" />;
if (error) return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0' }}>
    <TriangleAlert size={32} color="var(--text-2)" />
    <div style={{ fontSize: 14, color: 'var(--text-1)' }}>Non raggiungibile. Riprova più tardi.</div>
    {error instanceof Error && (
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{error.message}</div>
    )}
  </div>
);
```

---

## No Analog Found

None. Every new file in this phase has either an exact codebase analog (5 cards, 1 commands hook, 1 barrel) or a verbatim bundle source for visual structure (5 sheet bodies, 6 sub-primitives, 1 helper). Test files mirror the existing Jest+RTL convention used across the project.

---

## Metadata

**Analog search scope:**
- `app/components/EmberGlass/` (cards/, primitives, Sheet wrapper)
- `app/components/devices/{stove,thermostat,lights,sonos,tuya}/hooks/` (data + commands hooks)
- `lib/hooks/` (useRetryableCommand) + `app/hooks/` (useDebounce)
- `lib/routes.ts` (NETATMO_ROUTES, STOVE_UI_ROUTES)
- `tests/smoke/dashboard-glass-cards.spec.ts` (Playwright extension target)
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx` (bundle visual contract — primary source)
- `app/globals.css` (focus-visible rule analog)

**Files scanned:** 30+ existing files read or grep-located.

**Pattern extraction date:** 2026-04-29

**Confidence:** HIGH — every analog citation includes file path + line numbers; field adapters and pitfalls cross-referenced against RESEARCH §"Common Pitfalls" 1-12; bundle source lifted verbatim per CONTEXT D-02 mandate.
