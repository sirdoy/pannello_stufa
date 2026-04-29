# Phase 179: Rooms Tab Redesign — Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 32 new + 1 modified
**Analogs found:** 32 / 32 (100%)
**Source-of-truth bundle:** `.planning/inbox/ember-glass-design/project/components/rooms.jsx` (lines 1-606) — visual contract verbatim per CONTEXT D-02.

> **Critical reminder for downstream planner:** RESEARCH.md §"Aggregator Reconciliation" is the primary contract for `getDevicesForRoom` and `RoomsTab`. The bundle's `state.*` fixture does NOT match real hook outputs. All field paths in the analog excerpts below are verified against live hook surfaces. Pitfalls 1-13 from RESEARCH.md must be respected.

---

## File Classification

### New types + lib (Wave 0)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `app/components/EmberGlass/rooms/types.ts` | type | pure-type | `app/components/EmberGlass/sheets/lib/findSceneByName.ts` (sibling lib pattern) + inline interfaces in each sheet body | role-match (no exact analog — types.ts is novel) |
| `app/components/EmberGlass/rooms/lib/rooms-config.ts` | static-config | pure-data | `app/components/EmberGlass/sheets/LightsSheet.tsx:17-22` `SCENES` ReadonlyArray + bundle `rooms.jsx:6-55` | role-match |
| `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` | pure-fn aggregator | pure-render (no I/O) | bundle `rooms.jsx:58-128` (idealized — must reconcile per RESEARCH §Aggregator Reconciliation) + the field-adapter blocks in `ClimateSheet.tsx:65-94`, `PlugsSheet.tsx:124-130`, `SonosSheet.tsx:62-73` | role-match (reconciliation required) |

### Primitives (Wave 1)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `rooms/primitives/StatChip.tsx` | presentational | pure-render | `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` (label+value layout) | role-match (smaller, chip-style) |
| `rooms/primitives/DualTempReadout.tsx` | presentational | pure-render | bundle `rooms.jsx:530-557` (no exact analog — closest is `RadialDial.tsx` for value-with-superscript pattern) | role-match (visual novelty) |
| `rooms/primitives/SliderRow.tsx` | presentational + interactive | pure-render → onChange callback | `app/components/EmberGlass/sheets/primitives/Slider.tsx` (gradient bar) — but Phase 179 SliderRow is a **read-only gradient bar with optional tap-to-seek**, NOT a native `<input type=range>`. CONTEXT D-36 explicit. | partial-match (different mechanism) |
| `rooms/primitives/ControlRow.tsx` | layout primitive | pure-render | bundle `rooms.jsx:587-589` (3-line flex row) — analog: `display: flex; gap: 6` patterns in many sheets | exact-match (trivial flex wrapper) |
| `rooms/primitives/MiniButton.tsx` | presentational button | dispatches command | `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` (icon + label, filled variant via `data-component`) + `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` (active/inactive variant) | role-match (combine both) |

### Cards/chips (Wave 1)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `rooms/RoomCard.tsx` | composition (orchestrator-light) | reads-data → onClick callback | `app/components/EmberGlass/cards/StoveCard.tsx` (GlassCard + CardHead + StatusDot composition + tap-to-open) | exact-match |
| `rooms/DeviceChip.tsx` | presentational | pure-render | bundle `rooms.jsx:191-211` (no exact analog — closest is `StatusDot.tsx` for the on-state dot pattern) | role-match |

### Per-device bodies + dispatcher (Wave 2)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `rooms/DeviceCard.tsx` | composition | pure-render (composes header + body) | `app/components/EmberGlass/cards/LightsCard.tsx` (header row + body inside GlassCard) | role-match |
| `rooms/DevicePrimaryControl.tsx` | dispatcher | dispatches command (5 branches) | `app/components/EmberGlass/cards/LightsCard.tsx:66-75` (right-slot `InlineToggle` with `e.stopPropagation()`) + bundle `rooms.jsx:319-352` for the 5-branch shape | role-match |
| `rooms/DeviceBody.tsx` | dispatcher (switch by `device.kind`) | pure-render | bundle `rooms.jsx:355` switch helper. Closest in repo: 5 sheet files in `EmberGlass/sheets/` form an *implicit* dispatch by card import; this file makes the switch explicit. | role-match (novel structural primitive — single switch statement) |
| `rooms/bodies/StoveBody.tsx` | self-fetching body | reads-data + dispatches command | `app/components/EmberGlass/sheets/StoveSheet.tsx` (entire file — useStoveData + useStoveCommands + Power button) | exact-match |
| `rooms/bodies/ThermoBody.tsx` (exports `ThermoBody` + `ValveBody`) | self-fetching body | reads-data + dispatches command | `app/components/EmberGlass/sheets/ClimateSheet.tsx` (useThermostatData + useThermostatCommands + setpoint debounce + setRoomMode toggle) | exact-match |
| `rooms/bodies/LightBody.tsx` | self-fetching body | reads-data + dispatches command | `app/components/EmberGlass/sheets/LightsSheet.tsx` (useLightsData + useLightsCommands.handleBrightnessChange) — but Phase 179 ships brightness slider; LightsSheet has no slider so partial. Plus `SonosSheet.tsx:79-93` for the debounced-pending pattern. | role-match |
| `rooms/bodies/PlugBody.tsx` | self-fetching body (read-only — toggle is in header) | reads-data only | `app/components/EmberGlass/sheets/PlugsSheet.tsx` (field adapter + `formatPowerRow`) | role-match (read-only subset — body has no toggle here) |
| `rooms/bodies/SonosBody.tsx` | self-fetching body | reads-data + dispatches command | `app/components/EmberGlass/sheets/SonosSheet.tsx` (useSonosFullData + useSonosCommands.handleSetZoneVolume + 250ms debounce + play/pause/skip handlers) | exact-match |
| `rooms/bodies/TvBody.tsx` | presentational (no-op clicks) | pure-render | `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` (visual stub for unimplemented proxies) | role-match (stub) |
| `rooms/bodies/ShadeBody.tsx` | presentational (no-op clicks) | pure-render | Same as TvBody — `SheetPlaceholderBody.tsx` | role-match (stub) |
| `rooms/bodies/CameraBody.tsx` | presentational (no-op clicks) | pure-render | bundle `rooms.jsx:466-487` (no exact analog — closest in repo is the placeholder body) | role-match (stub) |
| `rooms/bodies/SensorBody.tsx` | presentational (read-only) | pure-render | Same as PlugBody body shape — 2-col `<StatChip>` grid | role-match (stub data) |

### Sheet + orchestrator + route (Wave 3)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `rooms/RoomSheet.tsx` | wrapping orchestrator | pure-render (consumes Sheet primitive) | `app/components/EmberGlass/cards/StoveCard.tsx:99-101` (Sheet usage) — but Phase 179 RoomSheet wraps Sheet **internally** (D-21) and takes `{ open, onClose, room, devices }` props (diverges from Phase 178 prop-less convention) | role-match with documented divergence |
| `rooms/RoomsTab.tsx` | orchestrator | reads-data (5 hooks) + state (selectedRoomName) | `app/components/devices/stove/StoveControls.tsx` (multi-hook orchestrator) — but the closer pattern is `app/components/DashboardCards.tsx` (multi-card grid) for the layout shape | role-match (multi-hook composition novel to this phase) |
| `rooms/index.ts` | barrel | type-only | `app/components/EmberGlass/sheets/index.ts` (verbatim shape — named exports + types) | exact-match |
| `app/stanze/page.tsx` | next route | pure-render | `app/page.tsx` (Phase 177 dashboard root — `<section>` + `<RoomsTab/>` instead of `<DashboardCards/>`) | exact-match |
| `tests/smoke/rooms-tab.spec.ts` | playwright spec | E2E | `tests/smoke/dashboard-glass-cards.spec.ts` (canonical helpers: `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`) | exact-match |

### Modified file

| File | Modification | Pattern |
|------|--------------|---------|
| `app/components/EmberGlass/index.ts` | Append `export * from './rooms';` after line 38 | Mirrors line 38 pattern: `export * from './sheets';` |

### Test files (colocated)

All Jest specs colocated under `app/components/EmberGlass/rooms/__tests__/` and mirror the structure and conventions established in `app/components/EmberGlass/sheets/__tests__/` and `app/components/EmberGlass/sheets/primitives/__tests__/`.

| New Test File | Closest Analog |
|---------------|----------------|
| `__tests__/RoomCard.test.tsx` | `cards/__tests__/StoveCard.test.tsx` |
| `__tests__/RoomSheet.test.tsx` | `sheets/__tests__/PlugsSheet.test.tsx` (data override pattern) |
| `__tests__/DeviceChip.test.tsx` | `sheets/primitives/__tests__/SheetRow.test.tsx` (small visual-prop spec) |
| `__tests__/DeviceCard.test.tsx` | `sheets/__tests__/PlugsSheet.test.tsx` (composition + tone tinting) |
| `__tests__/DevicePrimaryControl.test.tsx` | `sheets/__tests__/SonosSheet.test.tsx` (5 dispatch branches via fireEvent) |
| `__tests__/bodies/StoveBody.test.tsx` | `sheets/__tests__/StoveSheet.test.tsx` |
| `__tests__/bodies/ThermoBody.test.tsx` | `sheets/__tests__/ClimateSheet.test.tsx` |
| `__tests__/bodies/LightBody.test.tsx` | `sheets/__tests__/LightsSheet.test.tsx` |
| `__tests__/bodies/PlugBody.test.tsx` | `sheets/__tests__/PlugsSheet.test.tsx` |
| `__tests__/bodies/SonosBody.test.tsx` | `sheets/__tests__/SonosSheet.test.tsx` |
| `__tests__/bodies/{Tv,Shade,Camera,Sensor}Body.test.tsx` | `sheets/primitives/__tests__/SheetRow.test.tsx` (small visual-only spec; no command wiring to assert) |
| `__tests__/primitives/{StatChip,DualTempReadout,SliderRow,ControlRow,MiniButton}.test.tsx` | `sheets/primitives/__tests__/SheetRow.test.tsx` + `Stepper.test.tsx` + `Slider.test.tsx` |
| `__tests__/lib/getDevicesForRoom.test.ts` | Pure-function unit test — no direct analog. Closest: existing pure-fn tests under `lib/__tests__/` |

---

## Pattern Assignments

### `rooms/primitives/StatChip.tsx` (presentational, pure-render)

**Analog:** `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` (visual primitive shape) + bundle `rooms.jsx:516-528`.

**Imports pattern** (mirror SheetRow lines 1-2 — no React imports needed for stateless primitive):

```tsx
// rooms/primitives/StatChip.tsx
// Visual contract verbatim from bundle `rooms.jsx:516-528`. NO Pressable wrap (D-62).
// 10px caps label + 16px display value. tabular-nums on value.

export interface StatChipProps {
  label: string;
  value: string;
  tone?: string; // unused inside chip body — accepted for API symmetry per CONTEXT D-36
}

export function StatChip({ label, value, tone: _tone }: StatChipProps) {
  return (
    <div
      data-testid="stat-chip"
      style={{
        padding: '12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (rooms.jsx:521)
        border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div
        data-testid="stat-chip-value"
        style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 4, fontVariantNumeric: 'tabular-nums' }} // AUDIT-EXCEPTION '#fff'
      >
        {value}
      </div>
    </div>
  );
}
```

**File header JSDoc** mirrors `SheetRow.tsx:3-10` (visual contract reference + Pressable opt-out + bundle source line).

---

### `rooms/primitives/DualTempReadout.tsx` (presentational, pure-render)

**Analog:** `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` (large display value pattern, lines 1-50) + bundle `rooms.jsx:530-557`.

**Visual extract** (bundle-verbatim shape):

```tsx
// rooms/primitives/DualTempReadout.tsx
import { ChevronRight } from 'lucide-react';

export interface DualTempReadoutProps {
  current: number;
  target: number;
  tone: string;
}

export function DualTempReadout({ current, target, tone }: DualTempReadoutProps) {
  return (
    <div
      data-testid="dual-temp-readout"
      style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', padding: '8px 0' }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Attuale</div>
        <div
          style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}
        >
          {current.toFixed(1)}°
        </div>
      </div>
      <ChevronRight size={16} stroke="var(--text-2)" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Target</div>
        <div
          style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: tone, fontVariantNumeric: 'tabular-nums' }}
        >
          {target.toFixed(1)}°
        </div>
      </div>
    </div>
  );
}
```

---

### `rooms/primitives/SliderRow.tsx` (presentational + interactive, callback)

**Analog:** `app/components/EmberGlass/sheets/primitives/Slider.tsx` lines 18-40 (gradient-fill mechanism) but **note**: SliderRow is a **read-only gradient bar with optional tap-to-seek**, not a native `<input type=range>`. CONTEXT D-36 explicit divergence.

**Gradient pattern to copy from `Slider.tsx:36`:**

```tsx
// In SliderRow body — same gradient pattern as Slider.tsx:36
background: `linear-gradient(to right, ${tone} 0%, ${tone} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
```

**Tap-to-seek mechanism** (novel to Phase 179 — no exact analog; build via `onClick` + `e.currentTarget.getBoundingClientRect()`):

```tsx
// rooms/primitives/SliderRow.tsx
import type { LucideIcon } from 'lucide-react';

export interface SliderRowProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  tone: string;
  Icon?: LucideIcon;
  disabled?: boolean;
  onChange?: (next: number) => void;
}

export function SliderRow({
  label,
  value,
  min = 0,
  max = 100,
  unit = '%',
  tone,
  Icon,
  disabled = false,
  onChange,
}: SliderRowProps) {
  const pct = max === min ? 0 : Math.round(((value - min) / (max - min)) * 100);
  const interactive = !disabled && !!onChange;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, px));
    const next = Math.round(min + (clamped / 100) * (max - min));
    onChange!(next);
  };

  return (
    <div data-testid="slider-row" style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: disabled ? 0.45 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={12} />}
          {label}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{value}{unit}</span>
      </div>
      <div
        onClick={handleClick}
        aria-disabled={disabled || undefined}
        style={{
          height: 6,
          borderRadius: 999,
          cursor: interactive ? 'pointer' : 'not-allowed',
          background: `linear-gradient(to right, ${tone} 0%, ${tone} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );
}
```

---

### `rooms/primitives/ControlRow.tsx` + `MiniButton.tsx`

**ControlRow analog:** trivial — bundle `rooms.jsx:587-589`. Single flex row with 6px gap. No analog needed.

**MiniButton analog:** `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` (icon + label + slugify pattern) + `QuickActionButton.tsx` (filled/active variant via tone-tinted background).

**MiniButton extract — mirror SheetBtn.tsx:1-48:**

```tsx
// rooms/primitives/MiniButton.tsx
import type { LucideIcon } from 'lucide-react';

export interface MiniButtonProps {
  Icon?: LucideIcon;
  label?: string;
  filled?: boolean;
  tone?: string;
  onClick?: () => void;
  disabled?: boolean;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function MiniButton({ Icon, label, filled = false, tone = 'var(--accent)', onClick, disabled = false }: MiniButtonProps) {
  const slug = label ? slugify(label) : 'icon';
  return (
    <button
      type="button"
      data-component="mini-button"
      data-testid={`mini-button-${slug}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34,
        borderRadius: 10,
        padding: label ? '0 12px' : '0 8px',
        background: filled ? `color-mix(in oklab, ${tone} 22%, transparent)` : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
        color: filled ? tone : '#fff',
        border: filled
          ? `0.5px solid color-mix(in oklab, ${tone} 35%, transparent)`
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
        boxShadow: filled ? `0 0 12px color-mix(in oklab, ${tone} 35%, transparent)` : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {Icon && <Icon size={14} strokeWidth={2.2} />}
      {label}
    </button>
  );
}
```

**ControlRow:**

```tsx
// rooms/primitives/ControlRow.tsx
import type { ReactNode } from 'react';

export function ControlRow({ children }: { children: ReactNode }) {
  return <div data-testid="control-row" style={{ display: 'flex', gap: 6 }}>{children}</div>;
}
```

---

### `rooms/RoomCard.tsx` (composition, reads-data + onClick callback)

**Analog:** `app/components/EmberGlass/cards/StoveCard.tsx` (lines 38-104). Verbatim pattern: `<GlassCard tone onOpen data-testid>` + `<CardHead Icon label tone right>` + body.

**Imports pattern** (mirror StoveCard lines 26-36):

```tsx
'use client';
import { Home, Moon, Droplets } from 'lucide-react'; // resolved via ICON_FOR
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { DeviceChip } from './DeviceChip';
import { ICON_FOR } from './lib/rooms-config';
import type { RoomConfig, RoomDevice } from './types';
```

**Composition pattern** (mirror StoveCard.tsx:48-98):

```tsx
export function RoomCard({ room, devices, onOpen }: RoomCardProps) {
  const activeCount = devices.filter((d) => d.on).length;
  const Icon = ICON_FOR[room.icon] ?? Home;
  const visible = devices.slice(0, 6);
  const overflow = Math.max(0, devices.length - 6);

  return (
    <GlassCard tone={room.tone} onOpen={onOpen} data-testid={`room-card-${room.name.toLowerCase()}`}>
      <CardHead
        Icon={Icon}
        label={room.name}
        tone={room.tone}
        right={
          <span
            style={{
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              color: activeCount > 0 ? room.tone : 'var(--text-2)',
            }}
          >
            {activeCount}/{devices.length}
          </span>
        }
      />
      {devices.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-2)' }}>
          Nessun dispositivo
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
          {visible.map((d, i) => <DeviceChip key={`${d.kind}-${i}`} device={d} />)}
          {overflow > 0 && (
            <div
              data-testid={`room-card-${room.name.toLowerCase()}-overflow`}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 10,
                border: '1px dashed rgba(255,255,255,0.15)', // AUDIT-EXCEPTION
                color: 'var(--text-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
              }}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
```

**SC-#1 note:** `<GlassCard onOpen={onOpen}>` already wraps in Pressable internally (verified `GlassCard.tsx:83-92`). No additional `<Pressable>` wrap needed at the consumer.

---

### `rooms/DeviceChip.tsx` (presentational, pure-render)

**Analog:** none exact — closest is `app/components/EmberGlass/StatusDot.tsx` for the on-state dot. Bundle `rooms.jsx:191-211` is the visual contract.

**Pattern** (bundle-verbatim):

```tsx
// rooms/DeviceChip.tsx
import { ICON_FOR } from './lib/rooms-config';
import type { RoomDevice } from './types';

export function DeviceChip({ device }: { device: RoomDevice }) {
  const Icon = ICON_FOR[device.kind];
  const tone = device.tone;
  return (
    <div
      data-testid={`device-chip-${device.kind}`}
      data-on={String(device.on)}
      style={{
        aspectRatio: '1 / 1',
        borderRadius: 10,
        position: 'relative',
        background: device.on ? `color-mix(in oklab, ${tone} 18%, transparent)` : 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION
        border: device.on
          ? `0.5px solid color-mix(in oklab, ${tone} 35%, transparent)`
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: device.on ? tone : 'var(--text-2)',
      }}
    >
      <Icon size={14} strokeWidth={2} />
      {device.on && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 5,
            height: 5,
            borderRadius: 999,
            background: tone,
            boxShadow: `0 0 6px ${tone}`,
          }}
        />
      )}
    </div>
  );
}
```

---

### `rooms/DeviceCard.tsx` (composition, pure-render)

**Analog:** `app/components/EmberGlass/cards/LightsCard.tsx` (header row + body composition inside surface) + bundle `rooms.jsx:276-317`.

**Wrap pattern** — Phase 175 SC-#1 strict reading: wrap in `<Pressable as="div">` with no onClick (CONTEXT Claude's Discretion recommended interpretation):

```tsx
// rooms/DeviceCard.tsx
import { Pressable } from '../Pressable';
import { ICON_FOR } from './lib/rooms-config';
import { DevicePrimaryControl } from './DevicePrimaryControl';
import { DeviceBody } from './DeviceBody';
import type { RoomDevice } from './types';

export function DeviceCard({ device }: { device: RoomDevice }) {
  const Icon = ICON_FOR[device.kind];
  const tone = device.tone;
  return (
    <Pressable
      as="div"
      data-testid={`device-card-${device.kind}-${device.name.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        borderRadius: 16,
        padding: 14,
        background: device.on
          ? `linear-gradient(135deg, color-mix(in oklab, ${tone} 14%, transparent) 0%, transparent 70%)`
          : 'rgba(255,255,255,0.03)', // AUDIT-EXCEPTION (rooms.jsx:280)
        border: device.on
          ? `0.5px solid color-mix(in oklab, ${tone} 25%, transparent)`
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
      }}
    >
      {/* Header row — bundle rooms.jsx:282-309 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: device.on ? `color-mix(in oklab, ${tone} 22%, transparent)` : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
            border: device.on
              ? `0.5px solid color-mix(in oklab, ${tone} 30%, transparent)`
              : '0.5px solid rgba(255,255,255,0.06)',
            color: device.on ? tone : 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: device.on ? `0 0 14px color-mix(in oklab, ${tone} 35%, transparent)` : 'none',
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{device.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            {device.on ? 'Attivo' : 'Inattivo'}{device.value ? ` · ${device.value}` : ''}
          </div>
        </div>
        <DevicePrimaryControl device={device} />
      </div>
      <DeviceBody device={device} />
    </Pressable>
  );
}
```

---

### `rooms/DevicePrimaryControl.tsx` (dispatcher, dispatches command — 5 branches)

**Analog:** `app/components/EmberGlass/cards/LightsCard.tsx:66-75` (the `right` `<InlineToggle>` with `e.stopPropagation()` + bundle `rooms.jsx:319-352`).

**Stop-propagation rule:** consumers calling InlineToggle inside a Pressable wrap MUST call `e.stopPropagation()` (per `InlineToggle.tsx` header comment). DeviceCard wraps in `<Pressable as="div">` with NO `onClick`, so propagation is functionally a no-op — but include `e.stopPropagation()` defensively because the parent RoomSheet category section does not propagate to RoomCard (different DOM tree). Plan agent verifies; consider safe to omit (RESEARCH §Anti-Patterns: "DeviceCard has no card-level onClick (D-24). No propagation conflict.").

**Switch dispatch pattern:**

```tsx
// rooms/DevicePrimaryControl.tsx
'use client';
import { Pause, Play } from 'lucide-react';
import { InlineToggle } from '../InlineToggle';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import type { RoomDevice } from './types';

export function DevicePrimaryControl({ device }: { device: RoomDevice }) {
  switch (device.kind) {
    case 'sonos':
      return <SonosControl device={device} />;
    case 'camera':
      return <Pill label="LIVE" tone={device.tone} pulsing />;
    case 'sensor':
      return <Pill label="OK" tone={device.tone} />;
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

// Each subcomponent uses the per-body self-fetch pattern (Phase 178 D-04 / CONTEXT D-39).
// Example — LightToggle:
function LightToggle({ device }: { device: RoomDevice }) {
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
    router: undefined as never, // TODO: useRouter() if needed
  });
  return (
    <InlineToggle
      on={device.on}
      color={device.tone}
      onChange={(e) => {
        e.stopPropagation();
        void cmds.handleRoomToggle(device.extra.groupId, !device.on);
      }}
    />
  );
}

// PlugToggle, ThermoToggle, SonosControl follow the same shape — see analog references:
//   PlugToggle  ← PlugsSheet.tsx:296-305 (InlineToggle + togglePlug)
//   ThermoToggle ← ClimateSheet.tsx:251-260 (setRoomMode with 'manual' | 'home' — RESEARCH Pitfall 3)
//   SonosControl ← SonosSheet.tsx:212-242 (40×40 round play/pause button)
```

**Critical:** `setRoomMode` accepts `'manual' | 'home'`, NOT `'on' | 'off'` (RESEARCH Pitfall 3). Toggle pattern from `ClimateSheet.tsx:257`:

```tsx
void setRoomMode(zone.id, zone.on ? 'home' : 'manual');
```

---

### `rooms/DeviceBody.tsx` (dispatcher, pure-render switch)

**Analog:** no exact analog — single-file switch on discriminated union. Bundle `rooms.jsx:355-509`.

**Pattern:**

```tsx
// rooms/DeviceBody.tsx
'use client';
import { StoveBody } from './bodies/StoveBody';
import { ThermoBody, ValveBody } from './bodies/ThermoBody';
import { LightBody } from './bodies/LightBody';
import { PlugBody } from './bodies/PlugBody';
import { SonosBody } from './bodies/SonosBody';
import { TvBody } from './bodies/TvBody';
import { ShadeBody } from './bodies/ShadeBody';
import { CameraBody } from './bodies/CameraBody';
import { SensorBody } from './bodies/SensorBody';
import type { RoomDevice } from './types';

export function DeviceBody({ device }: { device: RoomDevice }) {
  switch (device.kind) {
    case 'stove':  return <StoveBody device={device} />;
    case 'thermo': return <ThermoBody device={device} />;
    case 'valve':  return <ValveBody device={device} />;
    case 'light':  return <LightBody device={device} />;
    case 'plug':   return <PlugBody device={device} />;
    case 'sonos':  return <SonosBody device={device} />;
    case 'tv':     return <TvBody device={device} />;
    case 'shade':  return <ShadeBody device={device} />;
    case 'camera': return <CameraBody device={device} />;
    case 'sensor': return <SensorBody device={device} />;
    default: return null;
  }
}
```

---

### `rooms/bodies/StoveBody.tsx` (self-fetch, reads-data + dispatches)

**Analog:** `app/components/EmberGlass/sheets/StoveSheet.tsx` (entire file).

**Imports pattern** (mirror StoveSheet.tsx:29-38):

```tsx
'use client';
import { Minus, Plus, Power } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import { useVersion } from '@/app/context/VersionContext';
import { useRouter } from 'next/navigation';
import { StatChip } from '../primitives/StatChip';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';
```

**Hook composition pattern** (mirror StoveSheet.tsx:42-69):

```tsx
export function StoveBody({ device }: { device: RoomDevice }) {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  const cmds = useStoveCommands({
    stoveData: {
      setLoading: stoveData.setLoading,
      setLoadingMessage: stoveData.setLoadingMessage,
      fetchStatusAndUpdate: stoveData.fetchStatusAndUpdate,
      setSchedulerEnabled: stoveData.setSchedulerEnabled,
      setSemiManualMode: stoveData.setSemiManualMode,
      setReturnToAutoAt: stoveData.setReturnToAutoAt,
      setNextScheduledAction: stoveData.setNextScheduledAction,
      setCleaningInProgress: stoveData.setCleaningInProgress,
      fetchMaintenanceStatus: stoveData.fetchMaintenanceStatus,
      semiManualMode: stoveData.semiManualMode,
    },
    router,
    user,
  });
  const powerLevel = stoveData.powerLevel ?? 0;
  const fanLevel = stoveData.fanLevel ?? 0;
  const needsCleaning = stoveData.needsMaintenance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatChip label="Target" value={`${powerLevel}/5`} tone={device.tone} />
        <StatChip label="Fiamma" value={`${powerLevel}`} tone={device.tone} />
        <StatChip label="Ventola" value={`${fanLevel}`} tone={device.tone} />
      </div>
      <ControlRow>
        <MiniButton
          Icon={Minus}
          label="Meno"
          onClick={() => void cmds.handlePowerChange({ target: { value: String(Math.max(1, powerLevel - 1)) } })}
        />
        <MiniButton
          Icon={Power}
          label="Power"
          filled={device.on}
          tone={device.tone}
          disabled={needsCleaning}
          onClick={() => void (device.on ? cmds.handleShutdown() : cmds.handleIgnite())}
        />
        <MiniButton
          Icon={Plus}
          label="Più"
          onClick={() => void cmds.handlePowerChange({ target: { value: String(Math.min(5, powerLevel + 1)) } })}
        />
      </ControlRow>
    </div>
  );
}
```

**Critical caveats** (RESEARCH §Aggregator Reconciliation > Stove):
- `useStoveData` exposes NO `temp` and NO `target` — bundle's "Target" chip cannot show temperature. Display `${powerLevel}/5` as a placeholder per StoveSheet precedent (`StoveSheet.tsx:158-160`).
- Stepper `onChange` wrap pattern: `(v) => handlePowerChange({ target: { value: String(v) } })` — verified `StoveSheet.tsx:174-177` + `Stepper.tsx` JSDoc lines 7-11. MiniButton "Meno"/"Più" follow the same wrap.

---

### `rooms/bodies/ThermoBody.tsx` (exports `ThermoBody` + `ValveBody`, self-fetch)

**Analog:** `app/components/EmberGlass/sheets/ClimateSheet.tsx` (entire file — particularly lines 49-116 for hook composition + debounced setpoint pattern).

**Setpoint debounce pattern** (verbatim from `ClimateSheet.tsx:100-116`):

```tsx
const [pendingTarget, setPendingTarget] = useState<number>(zone?.target ?? 20);
const debouncedTarget = useDebounce(pendingTarget, 500);

useEffect(() => {
  if (!zone) return;
  if (debouncedTarget === zone.target) return;
  void setRoomSetpoint(zone.id, debouncedTarget);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedTarget, zone?.id, zone?.target, setRoomSetpoint]);
```

**ThermoBody body composition** (RESEARCH §Code Examples lines 689-715 + bundle `rooms.jsx:374-387`):

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { DualTempReadout } from '../primitives/DualTempReadout';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

function ThermoOrValveBody({ device }: { device: RoomDevice }) {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const { setRoomSetpoint, setHomeMode } = useThermostatCommands({ homeId, refetch: data.refetch });

  const [pending, setPending] = useState<number>(device.extra.target);
  const debounced = useDebounce(pending, 500);

  useEffect(() => {
    if (!homeId) return;
    if (debounced === device.extra.target) return;
    void setRoomSetpoint(device.extra.roomId, debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, device.extra.roomId, device.extra.target, setRoomSetpoint, homeId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <DualTempReadout current={device.extra.current} target={pending} tone={device.tone} />
      <ControlRow>
        <MiniButton Icon={Minus} label="−0.5°" onClick={() => setPending((v) => Math.max(15, v - 0.5))} />
        <MiniButton Icon={Plus} label="+0.5°" onClick={() => setPending((v) => Math.min(28, v + 0.5))} />
        <MiniButton label="Eco" onClick={() => void setHomeMode('away')} />
        <MiniButton label="Auto" onClick={() => void setHomeMode('schedule')} />
      </ControlRow>
    </div>
  );
}

export const ThermoBody = ThermoOrValveBody;
export const ValveBody = ThermoOrValveBody;
```

**Pitfall 8 reminder:** gate command calls on `homeId !== ''` (`if (!homeId) return;`) — first render before `useThermostatData()` resolves topology.

---

### `rooms/bodies/LightBody.tsx` (self-fetch, reads-data + dispatches)

**Analog:** `app/components/EmberGlass/sheets/LightsSheet.tsx` (useLightsData + useLightsCommands hook composition lines 73-87) + `SonosSheet.tsx:79-93` (debounced-pending pattern for slider).

**Brightness conversion** (RESEARCH Pitfall 5): aggregator emits `brightness` as 0-100 percent (already converted from Hue's 0-254). Slider uses 0-100 directly. `handleBrightnessChange(groupId, String(percent))` — second arg is a STRING (verified `useLightsCommands.ts:114`).

**Pattern:**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { SliderRow } from '../primitives/SliderRow';
import type { RoomDevice } from '../types';

export function LightBody({ device }: { device: RoomDevice }) {
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

  const initial = device.extra.brightness ?? 0; // 0-100 (aggregator already converted)
  const [pending, setPending] = useState<number>(initial);
  const debounced = useDebounce(pending, 250);

  useEffect(() => {
    if (debounced === initial) return;
    void cmds.handleBrightnessChange(device.extra.groupId, String(debounced));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, device.extra.groupId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SliderRow
        label="Luminosità"
        value={pending}
        unit="%"
        tone={device.tone}
        disabled={!device.on}
        onChange={setPending}
      />
      <SliderRow
        label="Temperatura"
        value={device.extra.temp ?? 2700}
        unit="K"
        min={2200}
        max={6500}
        tone={device.tone}
        disabled
        // No onChange — color-temp endpoint does not exist (CONTEXT Out of Scope, D-29)
      />
    </div>
  );
}
```

---

### `rooms/bodies/PlugBody.tsx` (read-only — toggle is in header)

**Analog:** `app/components/EmberGlass/sheets/PlugsSheet.tsx` (field adapter lines 124-130 + `formatPowerRow` lines 75-80).

**Pattern:**

```tsx
'use client';
import { StatChip } from '../primitives/StatChip';
import type { RoomDevice } from '../types';

function formatPowerRow(power: number): string {
  if (power >= 1000) return `${(power / 1000).toFixed(1)}kW`;
  return `${power}W`;
}

export function PlugBody({ device }: { device: RoomDevice }) {
  const power = device.extra.power ?? 0;
  const today = device.extra.today_kwh ?? 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <StatChip label="Ora" value={formatPowerRow(power)} tone={device.tone} />
      <StatChip label="Oggi" value={`${today.toFixed(1)} kWh`} tone={device.tone} />
    </div>
  );
}
```

**Pitfall 4 reminder:** aggregator emits `device.extra.id` from `p.device_id` (verified `PlugsSheet.tsx:126`). Header toggle pattern: `void cmds.togglePlug(device.extra.id, device.on)` — exact match `PlugsSheet.tsx:301-303`.

---

### `rooms/bodies/SonosBody.tsx` (self-fetch, reads-data + dispatches)

**Analog:** `app/components/EmberGlass/sheets/SonosSheet.tsx` (entire file — particularly lines 49-93 for hook composition + 250ms debounce + handleSetZoneVolume).

**Volume command override** (RESEARCH Pitfall 7): use `handleSetZoneVolume(device.extra.id, value)` — NOT `handleSetVolume(coordinator, value)` per CONTEXT D-31. Document the deviation. Verified `SonosSheet.tsx:92`.

**Pattern (mirror SonosSheet.tsx:49-93 + bundle `rooms.jsx:412-447`):**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { SliderRow } from '../primitives/SliderRow';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export function SonosBody({ device }: { device: RoomDevice }) {
  const sonosData = useSonosFullData();
  const [, setCommandError] = useState<string | null>(null);
  const cmds = useSonosCommands({ fetchData: sonosData.fetchData, setError: setCommandError });
  const { handleSetZoneVolume, handlePlay, handlePause, handleNext, handlePrevious } = cmds;

  const [pendingVolume, setPendingVolume] = useState<number>(device.extra.volume);
  const debouncedVolume = useDebounce(pendingVolume, 250);

  useEffect(() => {
    if (debouncedVolume === device.extra.volume) return;
    void handleSetZoneVolume(device.extra.id, debouncedVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedVolume, device.extra.id, handleSetZoneVolume]);

  const trackLine = device.extra.artist && device.extra.artist !== '—'
    ? `${device.extra.track} · ${device.extra.artist}`
    : device.extra.track;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {trackLine && <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{trackLine}</div>}
      <SliderRow
        label="Volume"
        Icon={Volume2}
        value={pendingVolume}
        unit="%"
        tone={device.tone}
        disabled={!device.on}
        onChange={setPendingVolume}
      />
      <ControlRow>
        <MiniButton Icon={SkipBack} onClick={() => void handlePrevious(device.extra.id)} />
        <MiniButton
          Icon={device.on ? Pause : Play}
          filled
          tone={device.tone}
          onClick={() => void (device.on ? handlePause(device.extra.id) : handlePlay(device.extra.id))}
        />
        <MiniButton Icon={SkipForward} onClick={() => void handleNext(device.extra.id)} />
      </ControlRow>
    </div>
  );
}
```

---

### `rooms/bodies/TvBody.tsx` / `ShadeBody.tsx` / `CameraBody.tsx` / `SensorBody.tsx` (presentational stubs)

**Analog:** `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` (visual stub for unimplemented proxies) — but Phase 179 stubs are **structurally complete** (chips + buttons render as designed); only their click handlers are no-ops.

**TvBody pattern (bundle `rooms.jsx:445-465`):**

```tsx
'use client';
import { StatChip } from '../primitives/StatChip';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export function TvBody({ device }: { device: RoomDevice }) {
  const source = device.extra.source ?? 'HDMI 1';
  const volume = device.extra.volume ?? 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatChip label="Sorgente" value={source} tone={device.tone} />
        <StatChip label="Volume" value={`${volume}`} tone={device.tone} />
      </div>
      <ControlRow>
        <MiniButton label="HDMI 1" filled={source === 'HDMI 1'} tone={device.tone} onClick={() => undefined} />
        <MiniButton label="HDMI 2" filled={source === 'HDMI 2'} tone={device.tone} onClick={() => undefined} />
        <MiniButton label="App" onClick={() => undefined} />
      </ControlRow>
    </div>
  );
}
```

**ShadeBody / CameraBody / SensorBody:** identical stubbing approach — visual fidelity from bundle, no-op handlers (CONTEXT Out of Scope §"Real shade / blind position commands" / §"Real TV / HDMI source switching").

---

### `rooms/RoomSheet.tsx` (wrapping orchestrator, pure-render)

**Analog:** `app/components/EmberGlass/cards/StoveCard.tsx:99-101` (Sheet usage) — but Phase 179 wraps Sheet **internally** (D-21), accepting `{ open, onClose, room, devices }` props. Different from Phase 178 prop-less convention because there is one shared Sheet for 6 rooms.

**Imports + composition pattern:**

```tsx
'use client';
import { Sheet } from '../Sheet';
import { ICON_FOR, CATEGORY_ORDER, CATEGORY_LABEL } from './lib/rooms-config';
import { DeviceCard } from './DeviceCard';
import type { DeviceKind, RoomConfig, RoomDevice } from './types';

export interface RoomSheetProps {
  open: boolean;
  onClose: () => void;
  room: RoomConfig | null;
  devices: RoomDevice[];
}

export function RoomSheet({ open, onClose, room, devices }: RoomSheetProps) {
  if (!room) {
    return <Sheet open={false} onClose={onClose} />;
  }

  const Icon = ICON_FOR[room.icon];
  const activeCount = devices.filter((d) => d.on).length;
  const grouped = groupByKind(devices);
  const categoriesPresent = CATEGORY_ORDER.filter((k) => grouped[k]?.length);

  return (
    <Sheet open={open} onClose={onClose} title={room.name}>
      <div data-testid={`room-sheet-${room.name.toLowerCase()}`}>
        {/* Summary header — bundle rooms.jsx:234-257 */}
        <div
          style={{
            borderRadius: 18,
            padding: 16,
            background: `linear-gradient(130deg, color-mix(in oklab, ${room.tone} 16%, transparent) 0%, transparent 70%)`,
            border: `0.5px solid color-mix(in oklab, ${room.tone} 25%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: `color-mix(in oklab, ${room.tone} 22%, transparent)`,
              border: `0.5px solid color-mix(in oklab, ${room.tone} 30%, transparent)`,
              color: room.tone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {activeCount} di {devices.length} attivi
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {categoriesPresent.length} categorie di dispositivi
            </div>
          </div>
        </div>

        {/* Per-category sections — bundle rooms.jsx:259-270 */}
        {categoriesPresent.map((cat) => (
          <section key={cat} style={{ marginTop: 18 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              {CATEGORY_LABEL[cat]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped[cat]!.map((d, i) => <DeviceCard key={`${cat}-${i}`} device={d} />)}
            </div>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

function groupByKind(devices: RoomDevice[]): Partial<Record<DeviceKind, RoomDevice[]>> {
  const out: Partial<Record<DeviceKind, RoomDevice[]>> = {};
  for (const d of devices) (out[d.kind] ??= []).push(d);
  return out;
}
```

---

### `rooms/RoomsTab.tsx` (orchestrator — multi-hook composition)

**Analog:** RESEARCH §Code Examples lines 558-657 (the canonical pattern). No exact analog in the repo — this is the multi-hook composition novel to Phase 179.

**Critical contract** (RESEARCH §Aggregator Reconciliation): every field path in the AggregatorState builder is verified against live hook outputs. Plan agent uses RESEARCH §Aggregator Reconciliation tables as the field-name source of truth.

**Imports pattern:**

```tsx
'use client';
import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { ROOMS } from './lib/rooms-config';
import { getDevicesForRoom } from './lib/getDevicesForRoom';
import { RoomCard } from './RoomCard';
import { RoomSheet } from './RoomSheet';
```

See RESEARCH §Code Examples lines 571-657 for the complete `state` builder + render. The planner copies that block verbatim with one tweak: `<RoomSheet key={selectedRoomName ?? 'closed'} ...>` ensures clean unmount on room change (RESEARCH §Pattern 4).

---

### `rooms/index.ts` (barrel)

**Analog:** `app/components/EmberGlass/sheets/index.ts` (lines 1-23). Mirror exactly.

```tsx
// rooms/index.ts
export { RoomsTab } from './RoomsTab';
export { RoomCard } from './RoomCard';
export { RoomSheet } from './RoomSheet';
export type { RoomSheetProps } from './RoomSheet';
export { DeviceChip } from './DeviceChip';
export { DeviceCard } from './DeviceCard';
export { DevicePrimaryControl } from './DevicePrimaryControl';
export { DeviceBody } from './DeviceBody';

// Bodies
export { StoveBody } from './bodies/StoveBody';
export { ThermoBody, ValveBody } from './bodies/ThermoBody';
export { LightBody } from './bodies/LightBody';
export { PlugBody } from './bodies/PlugBody';
export { SonosBody } from './bodies/SonosBody';
export { TvBody } from './bodies/TvBody';
export { ShadeBody } from './bodies/ShadeBody';
export { CameraBody } from './bodies/CameraBody';
export { SensorBody } from './bodies/SensorBody';

// Primitives
export { StatChip } from './primitives/StatChip';
export type { StatChipProps } from './primitives/StatChip';
export { DualTempReadout } from './primitives/DualTempReadout';
export type { DualTempReadoutProps } from './primitives/DualTempReadout';
export { SliderRow } from './primitives/SliderRow';
export type { SliderRowProps } from './primitives/SliderRow';
export { ControlRow } from './primitives/ControlRow';
export { MiniButton } from './primitives/MiniButton';
export type { MiniButtonProps } from './primitives/MiniButton';

// Lib + types
export { getDevicesForRoom } from './lib/getDevicesForRoom';
export {
  ROOMS,
  ROOM_ALIASES,
  EXTRA_DEVICES,
  ICON_FOR,
  CATEGORY_ORDER,
  CATEGORY_LABEL,
} from './lib/rooms-config';
export type { RoomDevice, RoomConfig, DeviceKind, AggregatorState } from './types';
```

---

### `app/stanze/page.tsx` (next route)

**Analog:** `app/page.tsx` (entire file — 16 lines).

**Pattern (mirror app/page.tsx lines 1-16):**

```tsx
'use client';
import { RoomsTab } from '@/app/components/EmberGlass/rooms';

export const dynamic = 'force-dynamic';

export default function StanzePage() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Stanze</h1>
      <RoomsTab />
    </section>
  );
}
```

**Auth gating:** automatic via `app/layout.tsx → ClientProviders` (Auth0 wrapper). No per-page guard needed (RESEARCH lines 670-677).

**Note divergence from `app/page.tsx`:** the home page is a server component (no `'use client'`); StanzePage uses `'use client'` because RoomsTab owns state (CONTEXT D-03 / D-04). Tailwind layout classes on `<section>` are the single Tailwind carve-out (RESEARCH §Anti-Patterns: "Only `app/stanze/page.tsx` outer wrapper may use Tailwind for layout").

---

### `tests/smoke/rooms-tab.spec.ts` (playwright spec)

**Analog:** `tests/smoke/dashboard-glass-cards.spec.ts` (entire file — particularly lines 1-94 for helpers and lines 285-307 for `primeDashboardForSheetTest`).

**CRITICAL PATH NOTE (RESEARCH Pitfall 12):** path is `tests/smoke/rooms-tab.spec.ts`, NOT `tests/playwright/...`. Verified — `tests/playwright/` does not exist; specs live in `tests/smoke/*.spec.ts`.

**Helper imports** (verbatim copy from `dashboard-glass-cards.spec.ts:30-307`):

```ts
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Fix any of the following')) return;
      errors.push(text);
    }
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}

async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> { /* verbatim from :50-67 */ }
async function dismissWhatsNewModalIfPresent(page: Page): Promise<void> { /* verbatim from :80-94 */ }
async function primeDashboardForSheetTest(page: Page): Promise<void> { /* verbatim from :285-307 */ }
```

**Test scenarios** (CONTEXT D-64): 5 ROOMS-* describes. Use route mocks for each device endpoint (Hue, Netatmo, Tuya, Sonos, stove) so the 6 RoomCards render with > 0 devices. Pattern verbatim from `dashboard-glass-cards.spec.ts:309-348` (SHEET-02 mock route + collectConsoleErrors).

---

### Modification: `app/components/EmberGlass/index.ts`

**Single line append after current line 38** (`export * from './sheets';`):

```ts
// existing line 38
export * from './sheets';

// NEW Phase 179
export * from './rooms';
```

Mirrors the Phase 178 line 38 pattern exactly.

---

## Shared Patterns

### Inline-style + var(--token) — CONTEXT D-02 (Phase 174 D-12 / 175 D-08 / 177 D-02 / 178 D-02)

**Source:** `app/components/EmberGlass/cards/StoveCard.tsx`, `app/components/EmberGlass/sheets/StoveSheet.tsx` (every visual style is inline + var(--token); zero Tailwind for visual values).

**Apply to:** All `rooms/` files. Layout flex/grid + spacing tokens stay inline too. Tailwind allowed only on:
- `app/stanze/page.tsx` outer `<section className="py-8 sm:py-12 lg:py-16">` (Phase 177 precedent)
- `<GlassCardSkeleton>` `className="animate-pulse"` (carve-out from Phase 177 D-02)

**Excerpt** (mirror `StoveCard.tsx:62-69`):

```tsx
style={{
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  position: 'relative',
}}
```

---

### Per-body self-fetch — CONTEXT D-39 / Phase 178 D-04

**Source:** `app/components/EmberGlass/sheets/StoveSheet.tsx`, `ClimateSheet.tsx`, `LightsSheet.tsx`, `SonosSheet.tsx`, `PlugsSheet.tsx`. Each body imports its own commands hook rather than receiving them via props/context.

**Apply to:** `StoveBody`, `ThermoBody`/`ValveBody`, `LightBody`, `SonosBody`. Also `LightToggle`, `PlugToggle`, `ThermoToggle`, `SonosControl` inside `DevicePrimaryControl.tsx`. The orchestrator (`RoomsTab`) does NOT pass commands hooks down — it only owns the data hooks for the chip-grid active counts and `selectedRoomName` state.

**Pattern excerpt** (RESEARCH lines 270-282 — verbatim from SonosSheet):

```tsx
'use client';
export function SonosBody({ device }: { device: RoomDevice }) {
  const data = useSonosFullData();
  const cmds = useSonosCommands({ fetchData: data.fetchData, setError: () => {} });
  // ... self-fetch + dispatch
}
```

---

### Debounce-pending pattern — CONTEXT D-28 / D-29 / D-31

**Source:** `app/components/EmberGlass/sheets/ClimateSheet.tsx:100-116` (500ms setpoint), `SonosSheet.tsx:79-93` (250ms volume).

**Apply to:**
- `ThermoBody` setpoint — 500ms
- `LightBody` brightness — 250ms
- `SonosBody` volume — 250ms

**Pattern excerpt** (verbatim from ClimateSheet.tsx:100-116):

```tsx
const [pending, setPending] = useState<number>(initialValue);
const debounced = useDebounce(pending, 500); // or 250

useEffect(() => {
  if (debounced === serverValue) return;
  void commitFn(debounced);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [debounced, ...stableDeps]);
```

**Critical:** destructure stable command refs OFF the cmds object (e.g. `const { setRoomSetpoint } = cmds`) — DO NOT depend on the whole `cmds` object inside `useEffect` deps (ClimateSheet.tsx:62 + checker WARNING 4).

---

### Pressable wrap — Phase 175 SC-#1

**Source:** `app/components/EmberGlass/GlassCard.tsx:83-92` (auto-wrap when `onOpen` is set) + Phase 175 `app/components/EmberGlass/Pressable.tsx`.

**Apply to:**
- `RoomCard` — uses `<GlassCard onOpen={onOpen}>` which wraps in Pressable internally. NO additional wrap needed.
- `DeviceCard` — wrap explicitly in `<Pressable as="div">` with NO onClick (CONTEXT D-61 strict reading of SC-#1).
- `MiniButton`, `SliderRow`, `DeviceChip` — bare elements (NOT glass surfaces, CONTEXT D-62).

**Excerpt** (RESEARCH §Pattern 3, lines 327-333):

```tsx
import { Pressable } from '@/app/components/EmberGlass/Pressable';

<Pressable as="div" data-testid={`stanze-device-${slug}`}>
  {/* DeviceCard inner content */}
</Pressable>
```

---

### Sheet primitive consumption — Phase 175

**Source:** `app/components/EmberGlass/Sheet.tsx:35-40`. `<Sheet open onClose title? children?>` — Radix Dialog facade.

**Apply to:** `RoomSheet.tsx` wraps `<Sheet>` internally (D-21 — diverges from Phase 178 prop-less convention). Pass `key={selectedRoomName ?? 'closed'}` from RoomsTab (RESEARCH §Pattern 4) so React unmounts the body on room change — forces fresh `useState` for pending slider values.

**Excerpt** (RESEARCH §Pattern 4 lines 342-350):

```tsx
<Sheet
  key={selectedRoomName ?? 'closed'}
  open={!!selectedRoomName}
  onClose={() => setSelectedRoomName(null)}
  title={room?.name}
>
  {room && <RoomSheetContent room={room} devices={devices} />}
</Sheet>
```

---

### Stop-propagation in nested toggles — Phase 177 D-17

**Source:** `app/components/EmberGlass/cards/LightsCard.tsx:66-75` + `InlineToggle.tsx:3-5` (header comment).

**Apply to:** `DevicePrimaryControl` — every `<InlineToggle onChange>` calls `e.stopPropagation()` defensively even though DeviceCard has no card-level onClick. Defensive — mirrors Phase 178 SonosSheet per-row play/pause stop-propagation pattern (`SonosSheet.tsx:217-218`).

**Excerpt** (mirror LightsCard.tsx:66-75):

```tsx
<InlineToggle
  on={device.on}
  color={device.tone}
  onChange={(e) => {
    e.stopPropagation();
    void cmds.handleRoomToggle(device.extra.groupId, !device.on);
  }}
/>
```

---

### Loading + error skeleton — CONTEXT D-45 / D-46 / Phase 178 D-26 / D-27

**Source:** `app/components/EmberGlass/sheets/StoveSheet.tsx:71-115`, `ClimateSheet.tsx:122-158`, `PlugsSheet.tsx:86-122`, `SonosSheet.tsx:96-130`.

**Apply to:** Each body that self-fetches. Uses pattern: skeleton when `loading && !cachedData`; error when `error && !cachedData`; otherwise render real content. Italian copy: `"Non raggiungibile. Riprova più tardi."` (frozen).

**Excerpt** (verbatim from PlugsSheet.tsx:86-122):

```tsx
if (data.loading && data.cached === null) {
  return (
    <div data-testid="..." style={{ height: 360, borderRadius: 'var(--r-card)', background: 'rgba(255,255,255,0.05)', opacity: 0.6 }} className="animate-pulse" />
  );
}

if (data.error && data.cached === null) {
  return (
    <div data-testid="..." style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0' }}>
      <TriangleAlert size={32} color="var(--text-2)" />
      <div style={{ fontSize: 14, color: 'var(--text-1)' }}>Non raggiungibile. Riprova più tardi.</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{data.error}</div>
    </div>
  );
}
```

---

### React Compiler discipline — CONTEXT D-66 / Phase 71 / 95 / 178 D-33

**Source:** Every file under `app/components/EmberGlass/` already follows this. RESEARCH Pitfall 11 + Phase 177 substitute.

**Apply to:** All `rooms/` files. ZERO `useMemo` / `useCallback`. Inline event handlers explicitly allowed.

**Verify gate** (RESEARCH Pitfall 11): `npx react-compiler-healthcheck` is NOT installed. Use the Phase 177 substitute in `<verify><automated>`:

```bash
test "$(grep -REn 'useMemo|useCallback' app/components/EmberGlass/rooms/ | wc -l)" -eq 0
```

---

### Slugified data-testid — Phase 178 D-24

**Source:** `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx:18-20` + `PlugsSheet.tsx:52-54`.

**Apply to:** `RoomCard` (`data-testid="room-card-{name.toLowerCase()}"`), `DeviceCard` (`data-testid="device-card-{kind}-{name-slug}"`), `MiniButton` (`data-testid="mini-button-{label-slug}"`).

**Excerpt** (verbatim from SheetBtn.tsx:18-20):

```ts
function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
```

---

### Test mocking pattern — Phase 178 sheet tests

**Source:** `app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx:14-62`, `StoveSheet.test.tsx:1-80`, `SonosSheet.test.tsx:1-60`.

**Apply to:** Every `__tests__/bodies/*.test.tsx` and `__tests__/{Room,Device}*.test.tsx`.

**Pattern:**

1. `jest.mock` the data hook, returning a `{ ...baseData, ...override }` so each test reshapes the surface.
2. `jest.mock` the commands hook with `jest.fn().mockResolvedValue(undefined)` for each action.
3. `jest.mock` the Auth0/Version/Router contexts at module level.
4. `jest.useFakeTimers()` + `act()` in tests that exercise debounced commits.

**Excerpt** (verbatim from PlugsSheet.test.tsx:14-62):

```tsx
const mockTogglePlug = jest.fn().mockResolvedValue(null);
jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({ togglePlug: mockTogglePlug, setTimer: jest.fn(), cancelTimer: jest.fn() }),
}));

const baseData = { plugs: [/* fixture */], loading: false, error: null };
let dataOverride: Partial<typeof baseData> = {};
jest.mock('@/app/components/devices/tuya/hooks/useTuyaData', () => ({
  useTuyaData: () => ({ ...baseData, ...dataOverride }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  dataOverride = {};
});
```

---

### AUDIT-EXCEPTION inline tagging — Phase 178 convention

**Source:** Every Phase 178 sheet (StoveSheet, ClimateSheet, etc.) tags raw color literals (e.g. `#fff`, `rgba(...)`) with `// AUDIT-EXCEPTION` referencing the bundle source line.

**Apply to:** Every `rooms/` file that uses raw color literals (not all values can be tokenized). Tag inline with the bundle source line ref:

```tsx
background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (rooms.jsx:521)
```

---

## No Analog Found

| File | Role | Data Flow | Reason / Mitigation |
|------|------|-----------|---------------------|
| `rooms/types.ts` | type definitions | pure-type | No exact analog — types.ts is novel. Mirror the inline interface declaration style used in each sheet body (e.g. `ClimateSheet.tsx:29-37` `interface Zone`). |
| `rooms/lib/getDevicesForRoom.ts` | pure-fn aggregator | pure | Aggregator is novel to Phase 179. Closest references are the **field-adapter blocks** in `ClimateSheet.tsx:65-94`, `PlugsSheet.tsx:124-130`, `SonosSheet.tsx:62-73` — copy the field-mapping shape from each. RESEARCH §Aggregator Reconciliation is the contract. |
| `rooms/DeviceBody.tsx` | switch dispatcher | pure-render | Single-file switch on discriminated union — no exact analog. Bundle `rooms.jsx:355-509` is the reference. |
| `rooms/RoomsTab.tsx` | multi-hook orchestrator | reads-data + state | Multi-hook composition novel to this phase. RESEARCH §Code Examples lines 558-657 is the canonical pattern. |
| `rooms/primitives/DualTempReadout.tsx` | presentational | pure-render | No exact analog — bundle `rooms.jsx:530-557` only. |
| `rooms/primitives/SliderRow.tsx` | interactive primitive | callback | Diverges from `Slider.tsx` (read-only gradient bar with tap-to-seek instead of native input). |

---

## Metadata

**Analog search scope:**
- `app/components/EmberGlass/cards/` (10 files — primary card analog)
- `app/components/EmberGlass/sheets/` (5 sheets + `lib/findSceneByName.ts`)
- `app/components/EmberGlass/sheets/primitives/` (6 primitives)
- `app/components/EmberGlass/cards/__tests__/` (10 test files)
- `app/components/EmberGlass/sheets/__tests__/` (5 test files)
- `app/components/EmberGlass/sheets/primitives/__tests__/` (6 test files)
- Phase 175 primitives: `Sheet.tsx`, `Pressable.tsx`, `InlineToggle.tsx`, `GlassCard.tsx`, `CardHead.tsx`, `GlassCardSkeleton.tsx`
- Existing pages: `app/page.tsx`
- Existing smoke specs: `tests/smoke/dashboard-glass-cards.spec.ts`

**Files scanned:** ~50 source files + 22 test files

**Pattern extraction date:** 2026-04-29

**Bundle source-of-truth:** `.planning/inbox/ember-glass-design/project/components/rooms.jsx` (lines 1-606)
