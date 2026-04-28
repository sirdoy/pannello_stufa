# Phase 177: Equal-Size Dashboard Glass Cards — Pattern Map

**Mapped:** 2026-04-28
**Files analyzed:** 21 new + 4 modified
**Analogs found:** 25 / 25

## File Classification

### New files

| New file | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `app/components/EmberGlass/GlassCard.tsx` | primitive (presentational) | request-response (synchronous render) | `app/components/EmberGlass/AmbientBg.tsx` + `app/components/EmberGlass/Pressable.tsx` (composed) | role-match (new pattern: bundle-translation primitive that conditionally wraps in Pressable) |
| `app/components/EmberGlass/CardHead.tsx` | primitive (presentational) | request-response | `app/components/EmberGlass/FlameViz.tsx` (pure-prop inline-style primitive) | exact |
| `app/components/EmberGlass/StatusDot.tsx` | primitive (presentational) | request-response | `app/components/EmberGlass/FlameViz.tsx` | exact |
| `app/components/EmberGlass/MiniStat.tsx` | primitive (presentational) | request-response | `app/components/EmberGlass/FlameViz.tsx` | exact |
| `app/components/EmberGlass/PlayingBars.tsx` | primitive (presentational, animated) | request-response | `app/components/EmberGlass/FlameViz.tsx` (CSS-keyframe-driven inline-style primitive) | exact |
| `app/components/EmberGlass/InlineToggle.tsx` | primitive (controlled input) | event-driven (onChange) | `app/components/EmberGlass/Pressable.tsx` (event-handling primitive with inline transition) | role-match |
| `app/components/EmberGlass/GlassCardSkeleton.tsx` | primitive (presentational, loading) | request-response | `app/components/ui/Skeleton.tsx` `Skeleton.StovePanel` (lines 56–98) | role-match (different visual: 1:1 square shimmer vs current per-device skeletons) |
| `app/components/EmberGlass/cards/StoveCard.tsx` | summary card (`'use client'`) | request-response (consumes hook) | bundle `cards.jsx:81-107` + Phase 175 `<Sheet>` consumer + `useStoveData` hook | exact |
| `app/components/EmberGlass/cards/ClimateCard.tsx` | summary card (`'use client'`) | request-response | bundle `cards.jsx:138-164` + `useThermostatData` | exact |
| `app/components/EmberGlass/cards/LightsCard.tsx` | summary card (`'use client'`) | request-response + event (master toggle) | bundle `cards.jsx:166-218` + `useLightsData` + `useLightsCommands.handleAllLightsToggle` | exact |
| `app/components/EmberGlass/cards/SonosCard.tsx` | summary card (`'use client'`) | request-response | bundle `cards.jsx:220-270` + `useSonosFullData` | exact |
| `app/components/EmberGlass/cards/WeatherCard.tsx` | summary card (`'use client'`, **read-only**) | request-response (location subscription + fetch) | bundle `cards.jsx:200-218` + `app/components/devices/weather/WeatherCardWrapper.tsx:29-99` | role-match (extracts read-only summary slice) |
| `app/components/EmberGlass/cards/CameraCard.tsx` | summary card (`'use client'`) | streaming (snapshot poll via `useCameraData()`) | bundle `cards.jsx:310-341` + `useCameraData` | exact |
| `app/components/EmberGlass/cards/NetworkCard.tsx` | summary card (`'use client'`) | request-response | bundle `cards.jsx:343-359` + `useNetworkData` | exact |
| `app/components/EmberGlass/cards/RaspiCard.tsx` | summary card (`'use client'`, **read-only**) | request-response | bundle `cards.jsx:361-373` + `useRaspiData` | exact |
| `app/components/EmberGlass/cards/TuyaCard.tsx` | summary card (`'use client'`) | request-response | bundle `cards.jsx:385-432` + `useTuyaData` | exact |
| `app/components/EmberGlass/cards/DirigeraCard.tsx` | summary card (`'use client'`) | request-response | bundle `cards.jsx:385-432` + `useDirigeraData` (LANDMINE: empty/sensor data — see RESEARCH.md) | partial (no live plug data; renders empty-list fallback per A-02) |
| `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` | helper (presentational, transient) | request-response | `app/components/EmberGlass/FlameViz.tsx` (one-shot pure inline-style component) | role-match |
| `app/components/devices/weather/hooks/useWeatherSummary.ts` | client hook | request-response (subscription + fetch) | `app/components/devices/weather/WeatherCardWrapper.tsx:29-99` | exact (extraction) |
| `app/components/EmberGlass/__tests__/{GlassCard,CardHead,StatusDot,MiniStat,PlayingBars,InlineToggle,GlassCardSkeleton}.test.tsx` | jest unit tests | n/a | `app/components/EmberGlass/__tests__/FlameViz.test.tsx`, `Pressable.test.tsx`, `Sheet.test.tsx` | exact |
| `app/components/EmberGlass/cards/__tests__/*.test.tsx` (9 specs) | jest unit tests | n/a | `app/components/EmberGlass/__tests__/Sheet.test.tsx` (mocks + open-state assertions) | exact |
| `tests/smoke/dashboard-glass-cards.spec.ts` | playwright smoke spec | n/a | `tests/smoke/sheet-primitive.spec.ts` + `tests/smoke/press-primitive.spec.ts` + `tests/smoke/page-loads.spec.ts` (`collectConsoleErrors`) | exact |

### Modified files

| Modified file | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `app/components/DashboardCards.tsx` | async server component (registry + grid) | request-response (auth + config fetch) | itself (current file) — **structural rewrite** of render block + skeleton registry | self-replacement |
| `app/components/EmberGlass/index.ts` | barrel export | n/a | itself (current 11-line barrel) | self-extension |
| `lib/services/unifiedDeviceConfigService.ts` | one-line config flip (`hasHomepageCard('sonos')`) | n/a | itself (lines 65–72) | self-edit |
| `app/globals.css` | CSS keyframes append (`sonosBar0/1/2` per A-04) | n/a | existing `@keyframes pulse-ember`, `flamePulse`, `spring-in` already in file | exact |
| `app/components/__tests__/DashboardCards.test.tsx` | jest test update | n/a | itself + grid-shape assertions | self-replacement |

---

## Pattern Assignments

### Primitive: `app/components/EmberGlass/GlassCard.tsx`

**Analogs:**
- `app/components/EmberGlass/AmbientBg.tsx` lines 23–96 — `'use client'` + inline-style + `var(--token)` convention.
- `app/components/EmberGlass/Pressable.tsx` lines 98–126 — polymorphic press primitive (consumed when `onOpen` provided).
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 7–50 — primary visual contract.

**Top-of-file pattern** (mirror `AmbientBg.tsx:1-23`):
```tsx
'use client';

/**
 * GlassCard — Phase 177 (DASH-01)
 *
 * 1:1 square glass surface. When `onOpen` is provided, wraps root in Pressable
 * (Phase 175 DS-07) and sets cursor: pointer. When omitted, renders as a static
 * glass surface (WeatherCard / RaspiCard, SC-#3).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:7-50
 */

import type { CSSProperties, ReactNode } from 'react';
import { Pressable } from './Pressable';
```

**Conditional Pressable wrap pattern** (replaces bundle's local `useState(pressed)` from `cards.jsx:8-14` — Pressable owns press state now):
```tsx
export interface GlassCardProps {
  children: ReactNode;
  tone?: string;
  onOpen?: () => void;
  style?: CSSProperties;
  'data-testid'?: string;
}

const baseStyle: CSSProperties = {
  position: 'relative',
  borderRadius: 'var(--r-card)',
  padding: 'var(--pad-card)',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
  WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
  border: '0.5px solid var(--glass-border)',
  boxShadow: 'var(--glass-shadow)',
  display: 'flex',
  flexDirection: 'column',
};

export function GlassCard({ children, tone, onOpen, style, ...rest }: GlassCardProps) {
  const inner = (
    <>
      {tone && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none',
          background: `radial-gradient(120% 70% at 100% 0%, ${tone} 0%, transparent 55%)`,
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.08)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <Pressable
        data-testid={rest['data-testid'] ?? 'glass-card'}
        onClick={onOpen}
        style={{ ...baseStyle, cursor: 'pointer', ...style }}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <div data-testid={rest['data-testid'] ?? 'glass-card'} style={{ ...baseStyle, ...style }}>
      {inner}
    </div>
  );
}
```

> Pressable already injects the `transform: scale(.97/1)` + `transition: transform .22s cubic-bezier(.34,1.56,.64,1)` plumbing per `Pressable.tsx:115-118`. Do **not** re-implement local `useState(pressed)` (bundle `cards.jsx:8`) — Pressable replaces it.

---

### Primitive: `app/components/EmberGlass/CardHead.tsx`

**Analog:** `app/components/EmberGlass/FlameViz.tsx` lines 25–75 — pure-prop, inline-style, `data-*` test attribute, AUDIT-EXCEPTION comment style.

**Pattern (lift bundle `cards.jsx:53-69` verbatim onto inline-style):**
```tsx
'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface CardHeadProps {
  Icon: LucideIcon;
  label: string;
  tone: string;
  right?: ReactNode;
}

export function CardHead({ Icon, label, tone, right }: CardHeadProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: `color-mix(in oklab, ${tone} 22%, transparent)`,
        color: tone,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `0.5px solid color-mix(in oklab, ${tone} 30%, transparent)`,
      }}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
        letterSpacing: 0.2, flex: 1,
      }}>
        {label}
      </div>
      {right}
    </div>
  );
}
```

---

### Primitive: `app/components/EmberGlass/StatusDot.tsx`

**Analog:** `app/components/EmberGlass/FlameViz.tsx` (same shape: pure prop component returning a styled div).

**Pattern (lift bundle `cards.jsx:71-77`):**
```tsx
'use client';

export interface StatusDotProps {
  on: boolean;
  color?: string;
}

export function StatusDot({ on, color }: StatusDotProps) {
  const c = color ?? 'var(--accent)';
  return (
    <div
      data-testid="status-dot"
      data-on={on ? 'true' : 'false'}
      style={{
        width: 8, height: 8, borderRadius: 999,
        background: on ? c : 'rgba(255,255,255,0.18)',
        boxShadow: on ? `0 0 12px ${c}` : 'none',
      }}
    />
  );
}
```

---

### Primitive: `app/components/EmberGlass/MiniStat.tsx`

**Analog:** `FlameViz.tsx` (same shape).

**Pattern (lift bundle `cards.jsx:375-383`):**
```tsx
'use client';

export interface MiniStatProps {
  label: string;
  value: string;
  bar: number; // 0..1
}

export function MiniStat({ label, value, bar }: MiniStatProps) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>{label}</div>
      <div style={{
        fontSize: 15, fontWeight: 600, color: '#fff',
        fontFamily: 'var(--font-display)',
      }}>
        {value}
      </div>
      <div style={{
        height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)',
        marginTop: 5, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${Math.min(1, Math.max(0, bar)) * 100}%`,
          background: 'var(--accent)', borderRadius: 999,
        }} />
      </div>
    </div>
  );
}
```

---

### Primitive: `app/components/EmberGlass/PlayingBars.tsx`

**Analogs:**
- `app/components/EmberGlass/FlameViz.tsx` (CSS-keyframe-driven primitive).
- `app/globals.css:347-358` (existing `ambientA/B/C` keyframe pattern — model for adding `sonosBar0/1/2` per A-04).

**Pattern (lift bundle `cards.jsx:272-282`):**
```tsx
'use client';

export function PlayingBars() {
  return (
    <div
      data-testid="playing-bars"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 9 }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 2, borderRadius: 1, background: '#b080ff',
            animation: `sonosBar${i} 0.9s ease-in-out ${i * 0.15}s infinite`,
            height: 4,
          }}
        />
      ))}
    </div>
  );
}
```

> **Required `globals.css` addition (A-04):** add three `@keyframes sonosBar0/1/2` and include them in the `prefers-reduced-motion: reduce` block at `app/globals.css:1040`.

---

### Primitive: `app/components/EmberGlass/InlineToggle.tsx`

**Analog:** `app/components/EmberGlass/Pressable.tsx` lines 78–82 — single-source-of-truth transition string + cubic-bezier curve mirrors `.press-anim`.

**Pattern (lift bundle `cards.jsx:419-435`):**
```tsx
'use client';

import type { MouseEvent } from 'react';

export interface InlineToggleProps {
  on: boolean;
  color?: string;
  onChange: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function InlineToggle({ on, color = 'var(--accent)', onChange }: InlineToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-testid="inline-toggle"
      onClick={onChange}
      style={{
        width: 44, height: 26, borderRadius: 999, position: 'relative', border: 'none', padding: 0,
        background: on ? color : 'rgba(255,255,255,0.1)',
        boxShadow: on ? `0 0 12px ${color}` : 'none',
        cursor: 'pointer',
        transition: 'background .22s cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 999, background: '#fff',
        transition: 'left .22s cubic-bezier(.34,1.56,.64,1)',
      }} />
    </button>
  );
}
```

> **Stop-propagation rule (D-17):** consumers (LightsCard header) MUST call `e.stopPropagation()` inside the handler they pass as `onChange` to prevent the parent Pressable click from also firing.

---

### Primitive: `app/components/EmberGlass/GlassCardSkeleton.tsx`

**Analog:** `app/components/ui/Skeleton.tsx` line 25 (base `Skeleton` uses `bg-white/5` shimmer + `animate-pulse`).

**Pattern:**
```tsx
'use client';

export function GlassCardSkeleton() {
  return (
    <div
      data-testid="glass-card-skeleton"
      className="animate-pulse"
      style={{
        aspectRatio: '1 / 1',
        borderRadius: 'var(--r-card)',
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid var(--glass-border)',
      }}
    />
  );
}
```

> Keeps Tailwind for `animate-pulse` only (allowed under D-02 carve-out for the shimmer utility); visual values stay inline + `var(--token)`.

---

### Card: `app/components/EmberGlass/cards/StoveCard.tsx`

**Analogs:**
- `app/components/EmberGlass/Splash.tsx` lines 1–207 — full pattern of `'use client'` + inline-style EmberGlass shell + FlameViz consumption.
- `app/components/devices/stove/hooks/useStoveData.ts` lines 30–80 — hook surface (`status`, `isAccesa`, `powerLevel`, `fanLevel`, `staleness`).
- bundle `cards.jsx:81-107`.

**Imports pattern:**
```tsx
'use client';

import { useState } from 'react';
import { Flame } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { FlameViz } from '../FlameViz';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
```

**Hook-consumption pattern** (mirror `app/components/devices/stove/StoveCard.tsx:32-38`):
```tsx
export default function StoveCard() {
  const [open, setOpen] = useState(false);
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stove = useStoveData({ checkVersion, userId: user?.sub });
  // Use stove.isAccesa, stove.powerLevel, stove.fanLevel, stove.staleness
  // Per A-01: large readout = stove.powerLevel (NOT temp — Thermorossi exposes none)
}
```

**Tap → sheet wiring pattern (D-12):**
```tsx
return (
  <>
    <GlassCard
      tone="var(--accent)"
      onOpen={() => setOpen(true)}
      data-testid="stove-card"
    >
      <CardHead
        Icon={Flame}
        label="Stufa"
        tone="var(--accent)"
        right={<StatusDot on={stove.isAccesa} color={stale ? '#ffb84a' : undefined} />}
      />
      {/* body lifted from cards.jsx:86-104 — 36px display + FlameViz absolute top-right */}
    </GlassCard>
    <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
      <SheetPlaceholderBody phase="178" device="stove" />
    </Sheet>
  </>
);
```

**Body pattern (lift bundle `cards.jsx:86-104` verbatim):**
```tsx
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
  <div style={{ position: 'absolute', right: -8, top: -10, opacity: 0.9 }}>
    <FlameViz on={stove.isAccesa} intensity={(stove.powerLevel ?? 0) / 5} />
  </div>
  <div
    data-testid="stove-temp"
    style={{
      fontFamily: 'var(--font-display)',
      fontSize: 36, fontWeight: 600, lineHeight: 1,
      color: stove.isAccesa ? '#fff' : 'var(--text-2)',
      letterSpacing: -1.2,
      position: 'relative', zIndex: 1,
    }}
  >
    {stove.powerLevel ?? '—'}<span style={{ fontSize: 16, opacity: 0.5, marginLeft: 2 }}>°C</span>
  </div>
  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
    {stove.isAccesa ? `Fiamma ${stove.powerLevel} · Ventola ${stove.fanLevel}` : 'Spenta'}
  </div>
</div>
```

> Per RESEARCH LANDMINE #3 / A-01: large numeric uses `powerLevel` (stove has no ambient temp). The plan agent **must confirm** with user before final code, or accept default (b).

---

### Card: `app/components/EmberGlass/cards/ClimateCard.tsx`

**Analog:** `app/components/devices/thermostat/hooks/useThermostatData.ts` lines 38–67 (`RoomStatus` shape: `temperature`, `setpoint`, `mode`, `heating`).

**Imports pattern:** mirror StoveCard, swap to `Thermometer` from `lucide-react` and `useThermostatData`.

**Body pattern (lift bundle `cards.jsx:138-164`):**
```tsx
const { status } = useThermostatData();
const zones = (status?.rooms ?? []).slice(0, 4); // ≤ 4 zones
const activeCount = zones.filter((z) => z.heating).length;
const totalCount = (status?.rooms ?? []).length;
const mode = (status?.mode ?? '').toUpperCase(); // A-05: caps applied here
```

**List-row pattern (bundle `cards.jsx:148-159`):**
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
  {zones.map((z) => (
    <div key={z.room_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <StatusDot on={Boolean(z.heating)} color="#5eafff" />
      <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#fff' }}>{/* room name lookup from topology.rooms */}</div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
        {(z.temperature ?? 0).toFixed(1)}°
      </div>
    </div>
  ))}
</div>
<div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
  {activeCount} di {totalCount} attive
</div>
```

---

### Card: `app/components/EmberGlass/cards/LightsCard.tsx`

**Analogs:**
- `app/components/devices/lights/hooks/useLightsData.ts` lines 47–80 (`lights[]`, `lightsOnCount`, `allHouseLightsOn/Off`).
- `app/components/devices/lights/hooks/useLightsCommands.ts` lines 49–80 (`handleAllLightsToggle`).

**Hook + command pattern** (mirror `app/components/devices/stove/StoveCard.tsx:38-56` orchestrator coupling):
```tsx
const lightsData = useLightsData();
const cmds = useLightsCommands({ lightsData, router });
const onLights = lightsData.lights.filter((l) => l.on);
const anyOn = onLights.length > 0;
```

**Header `right` slot (D-17 — InlineToggle with stopPropagation):**
```tsx
right={
  <InlineToggle
    on={anyOn}
    color="#f5c84a"
    onChange={(e) => {
      e.stopPropagation(); // D-17 — prevent parent Pressable click → sheet
      void cmds.handleAllLightsToggle(!anyOn);
    }}
  />
}
```

**Empty / list / overflow body** (lift bundle `cards.jsx:166-218`):
```tsx
{anyOn ? (
  <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
      {onLights.slice(0, 4).map((l) => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot on color="#f5c84a" />
          <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#fff' }}>{l.name}</div>
        </div>
      ))}
      {onLights.length > 4 && (
        <div style={{ fontSize: 10, color: 'var(--text-2)' }}>+ altre {onLights.length - 4}</div>
      )}
    </div>
    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
      {onLights.length} di {lightsData.lights.length} accese
    </div>
  </>
) : (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text-2)' }}>Spente</div>
    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>{lightsData.lights.length} disponibili</div>
  </div>
)}
```

---

### Card: `app/components/EmberGlass/cards/SonosCard.tsx`

**Analog:** `app/components/devices/sonos/hooks/useSonosFullData.ts` lines 8–80 (zones + playback keyed by group_id).

**Group-shape derivation** (consume `data.zones` + `data.playback`):
```tsx
const { data } = useSonosFullData();
const groups = (data?.zones ?? []).map((z) => {
  const pb = data?.playback[z.group_id];
  return {
    name: z.coordinator?.name ?? z.group_id,
    playing: pb?.state === 'PLAYING',
    track: pb?.current_track?.title ?? '',
  };
});
const playingCount = groups.filter((g) => g.playing).length;
```

**Body pattern** (lift bundle `cards.jsx:240-270` — `<PlayingBars />` for playing rows, dim 6×6 dot otherwise; track on second line).

---

### Card: `app/components/EmberGlass/cards/WeatherCard.tsx` + `app/components/devices/weather/hooks/useWeatherSummary.ts`

**Analog (data flow):** `app/components/devices/weather/WeatherCardWrapper.tsx` lines 29–99 — location subscription + `/api/weather/forecast?lat=&lon=` fetch + 250ms stagger + cleanup.

**`useWeatherSummary` extraction pattern (D-19):**
```tsx
'use client';
import { useEffect, useState } from 'react';
import { subscribeToLocation } from '@/lib/services/locationService';

export interface WeatherSummary {
  city: string | null;
  temp: number | null;
  condition: string | null;
  high: number | null;
  low: number | null;
  loading: boolean;
}

export function useWeatherSummary(): WeatherSummary {
  // ... lift WeatherCardWrapper.tsx lines 29-79 verbatim, slim the response to summary fields only
}
```

**Card render: GlassCard WITHOUT `onOpen` (D-11 / SC-#3):**
```tsx
<GlassCard tone="#ffb84a" data-testid="weather-card">
  {/* no Sheet rendered for this card */}
</GlassCard>
```

---

### Card: `app/components/EmberGlass/cards/CameraCard.tsx`

**Analog:** `app/components/devices/camera/hooks/useCameraData.ts` lines 9–60 (`cameras[]` + `lastUpdatedAt`).

**Snapshot pattern (A-06 — bare `<img>`, NOT `next/image`):**
```tsx
const { cameras, lastUpdatedAt } = useCameraData();
const cam = cameras[0];
// Cache-bust query string ties to the hook's poll cycle
const src = cam ? `/api/camera/snapshot/${cam.id}?t=${lastUpdatedAt ?? 0}` : null;
```

**Preview body (lift bundle `cards.jsx:318-339`, replace fake gradient with `<img>`):**
```tsx
<div style={{ flex: 1, marginTop: 4, borderRadius: 14, position: 'relative', overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.06)', minHeight: 90 }}>
  {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
  <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'ui-monospace, SF Mono, monospace' }}>
    {cam?.name ?? '—'} · {cam?.resolution ?? ''}
  </div>
</div>
```

**LIVE pill (header right slot, lift bundle `cards.jsx:312-317`):** uses `pulse 1.6s infinite` already in `app/globals.css` (Phase 176 D-14).

---

### Card: `app/components/EmberGlass/cards/NetworkCard.tsx`

**Analog:** `app/components/devices/network/hooks/useNetworkData.ts` lines 47–110 (`bandwidth.{download,upload}` + `devices[].length` + `wan`).

**Body pattern (lift bundle `cards.jsx:343-359`):**
```tsx
const { bandwidth, devices, wan } = useNetworkData();
const down = bandwidth?.download ?? 0;
const up = bandwidth?.upload ?? 0;
```

> StatusDot in header always green when WAN reachable (`wan?.connected ?? true`); switches to amber `#ffb84a` on staleness per D-25.

---

### Card: `app/components/EmberGlass/cards/RaspiCard.tsx`

**Analog:** `app/components/devices/raspi/hooks/useRaspiData.ts` lines 13–27 (`data.{cpuPercent, memoryPercent, cpuTemperature}`).

**Body pattern (lift bundle `cards.jsx:361-373` — uses `<MiniStat>`):**
```tsx
const { data } = useRaspiData();
return (
  <GlassCard tone="#6aa86a" data-testid="raspi-card"> {/* no onOpen — D-11 */}
    <CardHead Icon={Cpu} label="Raspberry" tone="#6aa86a" right={<StatusDot on color="#6aa86a" />} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, alignContent: 'end' }}>
      <MiniStat label="CPU" value={`${data?.cpuPercent ?? 0}%`} bar={(data?.cpuPercent ?? 0) / 100} />
      <MiniStat label="RAM" value={`${data?.memoryPercent ?? 0}%`} bar={(data?.memoryPercent ?? 0) / 100} />
    </div>
    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
      CPU temp {data?.cpuTemperature ?? '—'}°C
    </div>
  </GlassCard>
);
```

---

### Card: `app/components/EmberGlass/cards/TuyaCard.tsx`

**Analog:** `app/components/devices/tuya/hooks/useTuyaData.ts` lines 11–60 (`plugs[]` with `name`, `on`, `power`, `data_freshness`).

**Body pattern (lift bundle `cards.jsx:385-432`):**
```tsx
const { plugs } = useTuyaData();
const list = plugs ?? [];
const onCount = list.filter((p) => p.on).length;
const totalPower = list.reduce((s, p) => s + (p.power ?? 0), 0);
const formatted = totalPower >= 1000 ? `${(totalPower / 1000).toFixed(1)}kW` : `${totalPower}W`;
const visible = list.slice(0, 4);
```

**Right-slot caps power text:**
```tsx
right={
  <div style={{ fontSize: 11, fontWeight: 600, color: '#ffb84a', letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums' }}>
    {formatted}
  </div>
}
```

---

### Card: `app/components/EmberGlass/cards/DirigeraCard.tsx`

**Analog:** `app/components/devices/dirigera/hooks/useDirigeraData.ts` lines 11–60 (`data.{health, summary}` — sensors only, NO plugs).

**Pattern (per A-02 — render with empty list fallback to satisfy DASH-10 shape):**
```tsx
const { data } = useDirigeraData();
const list: { name: string; on: boolean; power: number }[] = []; // LANDMINE #2 — DIRIGERA proxy exposes no plugs
const onCount = 0;
const totalPower = 0;
```

> Visual identical to TuyaCard (lift `cards.jsx:385-432` again). Header label = `IKEA`. Footer reads `0 di 0 accese`. The plan agent is permitted to instead re-spec to a sensor summary; that decision is captured in the plan, not here.

---

### Helper: `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx`

**Analog:** `app/components/EmberGlass/FlameViz.tsx` lines 25–75 (pure-prop one-shot helper).

**Pattern:**
```tsx
'use client';

import type { LucideIcon } from 'lucide-react';
import { Flame, Thermometer, Lightbulb, Music, Video, Wifi, Plug } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  stove: Flame, thermostat: Thermometer, lights: Lightbulb,
  sonos: Music, camera: Video, network: Wifi,
  'plugs-tuya': Plug, 'plugs-dirigera': Plug,
};

export interface SheetPlaceholderBodyProps {
  phase: string;
  device: keyof typeof ICONS;
}

export function SheetPlaceholderBody({ phase, device }: SheetPlaceholderBodyProps) {
  const Icon = ICONS[device] ?? Flame;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
      <Icon size={32} strokeWidth={1.5} color="var(--text-2)" />
      <div style={{ fontSize: 14, color: 'var(--text-1)' }}>{`Controlli in arrivo nella Phase ${phase}`}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Stiamo cucinando.</div>
    </div>
  );
}
```

---

### Modified: `app/components/DashboardCards.tsx`

**Self-analog: lines 100–151** (existing render block). The structural rewrite touches **only** the render block + skeleton registry; auth + config fetch are preserved verbatim.

**Imports pattern (replace masonry + per-device skeletons with EmberGlass cards + GlassCardSkeleton):**
```tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import StoveCard from './EmberGlass/cards/StoveCard';
import ClimateCard from './EmberGlass/cards/ClimateCard';
import LightsCard from './EmberGlass/cards/LightsCard';
import SonosCard from './EmberGlass/cards/SonosCard';
import WeatherCard from './EmberGlass/cards/WeatherCard';
import CameraCard from './EmberGlass/cards/CameraCard';
import NetworkCard from './EmberGlass/cards/NetworkCard';
import RaspiCard from './EmberGlass/cards/RaspiCard';
import TuyaCard from './EmberGlass/cards/TuyaCard';
import DirigeraCard from './EmberGlass/cards/DirigeraCard';
import { GlassCardSkeleton } from './EmberGlass/GlassCardSkeleton';
import { getUnifiedDeviceConfigAdmin, getVisibleDashboardCards } from '@/lib/services/unifiedDeviceConfigService';
import { EmptyState } from './ui';
import { DeviceCardErrorBoundary } from './ErrorBoundary';
```

**Registry pattern (replace `CARD_COMPONENTS` map + delete `CARD_SKELETONS`):**
```tsx
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ClimateCard, // device-config id "thermostat" → ClimateCard
  weather: WeatherCard,
  lights: LightsCard,
  camera: CameraCard,
  network: NetworkCard,
  raspi: RaspiCard,
  sonos: SonosCard,
  dirigera: DirigeraCard,
  tuya: TuyaCard,
};
// CARD_SKELETONS deleted — single GlassCardSkeleton fallback for every card.
```

**Render pattern (replace lines 122–139 with single grid):**
```tsx
return (
  <>
    <div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
      {visibleCards.map((card, flatIndex) => {
        const CardComponent = CARD_COMPONENTS[card.id];
        if (!CardComponent) return null;
        return (
          <div
            key={card.id}
            className="animate-spring-in transition-all duration-300 ease-out"
            style={{ animationDelay: `${flatIndex * 100}ms` }}
          >
            <DeviceCardErrorBoundary
              deviceName={DEVICE_META[card.id]?.name ?? card.id}
              deviceIcon={DEVICE_META[card.id]?.icon ?? '⚠️'}
            >
              <Suspense fallback={<GlassCardSkeleton />}>
                <CardComponent />
              </Suspense>
            </DeviceCardErrorBoundary>
          </div>
        );
      })}
    </div>
    {visibleCards.length === 0 && (
      <EmptyState icon="🏠" title="Nessun dispositivo configurato" description="Aggiungi i tuoi dispositivi per iniziare" />
    )}
  </>
);
```

> `splitIntoColumns` import + call removed; `lib/utils/dashboardColumns.ts` becomes orphan (deferred cleanup).

---

### Modified: `app/components/EmberGlass/index.ts`

**Self-analog (current 11-line file).** Append the 7 primitives + 9 cards + skeleton + helper:

```tsx
// existing exports preserved
export { GlassCard } from './GlassCard';
export type { GlassCardProps } from './GlassCard';
export { CardHead } from './CardHead';
export { StatusDot } from './StatusDot';
export { MiniStat } from './MiniStat';
export { PlayingBars } from './PlayingBars';
export { InlineToggle } from './InlineToggle';
export { GlassCardSkeleton } from './GlassCardSkeleton';
export { default as StoveCard } from './cards/StoveCard';
// ... 8 more cards
export { SheetPlaceholderBody } from './cards/SheetPlaceholderBody';
```

---

### Modified: `lib/services/unifiedDeviceConfigService.ts`

**Self-analog: lines 65–72.** One-line flip per RESEARCH LANDMINE #1 / A-03:

```tsx
function hasHomepageCard(deviceId: DeviceId): boolean {
  return true; // Phase 177: every device with a registered card is dashboard-eligible
}
```

> `dirigera` already returns true; only `sonos` was filtered. Confirm no other devices are excluded by this gate.

---

### Modified: `app/globals.css`

**Self-analog: existing keyframe blocks at lines 347-358 (`ambientA/B/C`), line 830 (`spring-in`).** Append three new keyframes per A-04:

```css
@keyframes sonosBar0 { 0%, 100% { height: 4px; } 50% { height: 9px; } }
@keyframes sonosBar1 { 0%, 100% { height: 6px; } 50% { height: 4px; } }
@keyframes sonosBar2 { 0%, 100% { height: 5px; } 50% { height: 8px; } }
```

Add to existing `prefers-reduced-motion: reduce` block (line 1040) so PlayingBars freezes:

```css
@media (prefers-reduced-motion: reduce) {
  /* existing: .animate-spring-in, etc. */
  [data-testid="playing-bars"] > div { animation: none !important; }
}
```

---

### Tests: Jest unit specs

**Analogs:**
- `app/components/EmberGlass/__tests__/Pressable.test.tsx` lines 1–60 (rendering, ref forward, pointer events)
- `app/components/EmberGlass/__tests__/Sheet.test.tsx` lines 1–80 (mock + open-state + a11y assertions)
- `app/components/EmberGlass/__tests__/FlameViz.test.tsx` lines 1–34 (style assertions)

**Per-primitive spec template:**
```tsx
import { render } from '@testing-library/react';
import { GlassCard } from '../GlassCard';

describe('GlassCard (Phase 177 — DASH-01)', () => {
  test('renders 1:1 aspect-ratio + glass tokens', () => {
    const { getByTestId } = render(<GlassCard>x</GlassCard>);
    const el = getByTestId('glass-card');
    expect(el.style.aspectRatio).toBe('1 / 1');
    expect(el.style.background).toContain('var(--glass-bg)');
  });
  test('with onOpen wraps in Pressable + cursor pointer', () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(<GlassCard onOpen={onOpen}>x</GlassCard>);
    const el = getByTestId('glass-card');
    expect(el.style.cursor).toBe('pointer');
    el.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
  test('without onOpen renders static glass (no cursor pointer, no Pressable)', () => {
    const { getByTestId } = render(<GlassCard>x</GlassCard>);
    expect(getByTestId('glass-card').style.cursor).not.toBe('pointer');
  });
});
```

**Per-card spec template (mirror `Sheet.test.tsx` mock + state-assertion structure):**
```tsx
jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({ isAccesa: true, powerLevel: 3, fanLevel: 2, /* ... */ }),
}));
jest.mock('@auth0/nextjs-auth0/client', () => ({ useUser: () => ({ user: { sub: 'x' } }) }));
jest.mock('@/app/context/VersionContext', () => ({ useVersion: () => ({ checkVersion: jest.fn() }) }));

describe('StoveCard (Phase 177)', () => {
  test('renders 36px temp readout from powerLevel', () => { /* ... */ });
  test('clicking card opens sheet', () => {
    const { getByTestId, queryByText } = render(<StoveCard />);
    expect(queryByText(/Controlli in arrivo/i)).toBeNull();
    fireEvent.click(getByTestId('stove-card'));
    expect(queryByText(/Controlli in arrivo/i)).toBeInTheDocument();
  });
});
```

**WeatherCard / RaspiCard exception:** assert `queryByRole('dialog')` stays null on click and there is **no** Sheet element in the tree.

---

### Tests: Playwright smoke spec `tests/smoke/dashboard-glass-cards.spec.ts`

**Analogs:**
- `tests/smoke/sheet-primitive.spec.ts` lines 1–80 — open/close vectors + scroll-lock pattern.
- `tests/smoke/press-primitive.spec.ts` lines 1–48 — `data-testid` selectors + `getComputedStyle` assertions.
- `tests/smoke/page-loads.spec.ts` lines 7–32 — `collectConsoleErrors` helper.

**Test scaffolding pattern** (lift `collectConsoleErrors` from `page-loads.spec.ts:7-20`, mirror `sheet-primitive.spec.ts:11-16` for VersionEnforcer-aware navigation):
```ts
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => { if (msg.type() === 'error') errors.push(msg.text()); };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}

test.describe('DASH-01..DASH-12 — equal-size dashboard glass cards', () => {
  test('DASH-01 grid is 2-col with 1:1 children', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.goto('/');
    const grid = page.locator('.grid.grid-cols-2').first();
    await expect(grid).toBeVisible();
    const sizes = await grid.locator('[data-testid="glass-card"]').evaluateAll((els) =>
      els.map((el) => ({ w: (el as HTMLElement).getBoundingClientRect().width, h: (el as HTMLElement).getBoundingClientRect().height }))
    );
    sizes.forEach(({ w, h }) => expect(Math.abs(w - h)).toBeLessThan(1));
    cleanup();
    expect(errors).toHaveLength(0);
  });

  test('DASH-11 tap → sheet open (Stove)', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('stove-card').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Stufa')).toBeVisible();
  });

  test('DASH-11 Weather/Raspi do NOT open a sheet', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('weather-card').click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('DASH-12 stagger animationDelay increments by 100ms', async ({ page }) => {
    await page.goto('/');
    const delays = await page.locator('.animate-spring-in').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).style.animationDelay)
    );
    delays.forEach((d, i) => expect(d).toBe(`${i * 100}ms`));
  });
});
```

---

### Tests: `app/components/__tests__/DashboardCards.test.tsx`

**Self-analog: lines 1–80.** Update strategy:
- Keep all existing mocks (`next/navigation`, `auth0`, `unifiedDeviceConfigService`).
- **Delete** `jest.mock('@/lib/utils/dashboardColumns')` block (lines 33–35) — utility no longer imported.
- **Delete** `Skeleton.*` per-device mocks (lines 69–78) — registry collapsed to `GlassCardSkeleton`.
- **Update** card mocks to point at `@/app/components/EmberGlass/cards/*` paths.
- **Add** an assertion that the rendered DOM contains a `.grid.grid-cols-2` parent of all cards (replaces masonry left/right column assertion).

---

## Shared Patterns

### `'use client'` + inline-style + `var(--token)` (Phase 174 D-12 / 175 D-08 / 176 D-23)

**Source:** `app/components/EmberGlass/AmbientBg.tsx:1-23` (top-of-file pattern), `app/components/EmberGlass/Sheet.tsx:95-113` (token consumption).

**Apply to:** every new file in `app/components/EmberGlass/` and `app/components/EmberGlass/cards/`.

```tsx
'use client';
// ... imports
// Inside component: style={{ background: 'var(--glass-bg)', borderRadius: 'var(--r-card)', padding: 'var(--pad-card)' }}
```

> **No Tailwind for visual values inside cards.** Tailwind is permitted only for layout primitives in `DashboardCards.tsx` (`grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3`) and the single `animate-pulse` shimmer utility on `GlassCardSkeleton`.

---

### `data-testid` placement (Phase 175/176 precedent)

**Source:** `app/components/EmberGlass/Pressable.tsx:111` (`data-pressable-focusable` data-attribute pattern), `app/components/EmberGlass/Sheet.tsx:74` (`data-sheet-backdrop="true"`).

**Apply to:** every primitive root + every card root + every test-meaningful interior element.

| Element | testid |
|---------|--------|
| `<GlassCard>` root | `glass-card` (overridable per consumer card) |
| Per-card root override | `stove-card` / `climate-card` / `lights-card` / `sonos-card` / `weather-card` / `camera-card` / `network-card` / `raspi-card` / `tuya-card` / `dirigera-card` |
| `<StatusDot>` | `status-dot` (+ `data-on={true|false}`) |
| `<PlayingBars>` | `playing-bars` |
| `<InlineToggle>` | `inline-toggle` |
| `<GlassCardSkeleton>` | `glass-card-skeleton` |
| StoveCard temp readout | `stove-temp` |
| FlameViz wrapper | `flame-viz` (already lives via `data-flame-viz="true"` from Phase 176) |
| Sheet placeholder body | `sheet-placeholder-body` |

---

### React Compiler discipline (Phase 71, D-28, SC-#5)

**Source:** `app/components/EmberGlass/Pressable.tsx` — Phase 175 D-03 (RC-clean primitive).

**Rules applied to every new file:**
- No `useMemo`, no `useCallback` in any new component or primitive.
- Stable list keys: prefer `l.id` / `z.room_id` / `g.group_id` / `p.id` over derived strings.
- No conditional hook calls, no mutation of props.
- Plan agent must include `npx react-compiler-healthcheck` in `<verify><automated>` and assert exit-code 0.

> Existing hooks (`useStoveData`, `useLightsCommands`, etc.) keep their current memoization. Phase 177 touches **zero** hook code.

---

### Hook-consumption pattern from existing big orchestrators (Phase 58/59)

**Source:** `app/components/devices/stove/StoveCard.tsx:32-56` (orchestrator pattern: hooks at top, derived display props, sub-components below).

**Apply to:** all 9 new tiny cards.

```tsx
export default function XxxCard() {
  const [open, setOpen] = useState(false);     // sheet state (per-card, D-12)
  const data = useXxxData();                    // existing hook, unchanged
  // derived display values (no useMemo — RC handles it)
  // render <GlassCard> + (optionally) <Sheet>
}
```

> Big orchestrator cards stay UNTOUCHED on detail pages (D-03). The new tiny cards are dashboard-only summaries.

---

### Sheet wiring (Phase 175 D-07..D-13)

**Source:** `app/components/EmberGlass/Sheet.tsx:42-178` — z-index 200/201, scroll-lock, scroll-restore, `forceMount`, ESC + backdrop + close-button dismissal.

**Apply to:** all 7 interactive cards. Each card mounts ONE `<Sheet>` instance with its own `useState`. Title matches CardHead label. Body is `<SheetPlaceholderBody phase="178" device="..." />` (deleted by Phase 178).

```tsx
<Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
  <SheetPlaceholderBody phase="178" device="stove" />
</Sheet>
```

---

### Server-side composition preservation

**Source:** `app/components/DashboardCards.tsx:77-94` — async SC + `auth0.getSession()` + redirect + `getUnifiedDeviceConfigAdmin(userId)` + `getVisibleDashboardCards`.

**Apply to:** the `DashboardCards.tsx` rewrite — **do not modify** lines 77–94. Only the render block (95–151) is restructured.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | Every new file maps to a pre-existing analog (FlameViz / Pressable / AmbientBg / Sheet / WeatherCardWrapper / Skeleton / Pressable.test / Sheet.test / sheet-primitive.spec / page-loads.spec) plus the bundle `cards.jsx`. |

The DirigeraCard is the only file with a *partial* live-data analog — the bundle visual is exact but `useDirigeraData` exposes sensors not plugs (LANDMINE #2 / A-02). Recommended path is empty-list rendering until a dedicated phase provides plug data.

---

## Metadata

**Analog search scope:**
- `app/components/EmberGlass/**` (primitives + tests + index)
- `app/components/DashboardCards.tsx`
- `app/components/devices/<device>/**` (hooks, big cards, weather wrapper) — read for hook surfaces only, not modified
- `app/components/ui/Skeleton.tsx` (skeleton precedent)
- `app/components/__tests__/DashboardCards.test.tsx`
- `tests/smoke/{sheet-primitive,press-primitive,page-loads,splash}.spec.ts`
- `lib/services/unifiedDeviceConfigService.ts`
- `lib/utils/dashboardColumns.ts`
- `app/globals.css` (keyframe inventory)
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` (PRIMARY visual contract)

**Files scanned:** 33

**Pattern extraction date:** 2026-04-28

**Spot-checks executed:**
- `grep "sonosBar" app/globals.css` → no matches → keyframes must be added (A-04 confirmed).
- `grep "hasHomepageCard" lib/services/unifiedDeviceConfigService.ts` → line 69–72 confirmed; flip is one line (A-03 confirmed).
- `find tests -name "*.spec.ts" -not -path "*node_modules*"` → smoke specs live under `tests/smoke/` (NOT `tests/playwright/` as CONTEXT D-30 says — RESEARCH.md correction is correct; plan agent must use `tests/smoke/dashboard-glass-cards.spec.ts`).
