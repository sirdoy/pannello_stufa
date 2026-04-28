---
phase: 177
plan: 05
type: execute
wave: 2
depends_on: ['177-01', '177-02']
files_modified:
  - app/components/EmberGlass/cards/WeatherCard.tsx
  - app/components/EmberGlass/cards/CameraCard.tsx
  - app/components/EmberGlass/cards/NetworkCard.tsx
  - app/components/EmberGlass/cards/__tests__/WeatherCard.test.tsx
  - app/components/EmberGlass/cards/__tests__/CameraCard.test.tsx
  - app/components/EmberGlass/cards/__tests__/NetworkCard.test.tsx
autonomous: true
requirements: [DASH-06, DASH-07, DASH-08, DASH-11, DASH-12]
tags: [ember-glass, dashboard-cards, weather, camera, network]
must_haves:
  truths:
    - "WeatherCard renders read-only — no Pressable, no Sheet, no onClick"
    - "CameraCard renders <img> snapshot from /api/camera/snapshot/{id}?t= cache-bust + LIVE pulsing pill"
    - "NetworkCard renders large down-Mbps + 'up Mbps ↑ · N dispositivi' subtitle"
  artifacts:
    - path: app/components/EmberGlass/cards/WeatherCard.tsx
      provides: "Read-only WeatherCard summary"
    - path: app/components/EmberGlass/cards/CameraCard.tsx
      provides: "CameraCard with snapshot preview + LIVE pill"
    - path: app/components/EmberGlass/cards/NetworkCard.tsx
      provides: "NetworkCard with down/up bandwidth + device count"
  key_links:
    - from: app/components/EmberGlass/cards/WeatherCard.tsx
      to: app/components/devices/weather/hooks/useWeatherSummary.ts
      via: "import useWeatherSummary"
      pattern: "useWeatherSummary"
    - from: app/components/EmberGlass/cards/CameraCard.tsx
      to: /api/camera/snapshot/
      via: "<img src>"
      pattern: "/api/camera/snapshot/"
---

<objective>
Ship the WeatherCard (DASH-06, **read-only**), CameraCard (DASH-07, with LIVE pill + snapshot poll), and NetworkCard (DASH-08).

Per SC-#3 and D-11, **WeatherCard renders WITHOUT `onOpen`** → no Pressable wrap, no cursor pointer, no Sheet. Per A-06, CameraCard uses bare `<img>` (NOT `next/image`) because the snapshot endpoint is a 302 redirect to a transient WiNet URL.

Purpose: Lands the read-only card pattern (Weather) and the snapshot/live-badge pattern (Camera) and the bandwidth readout (Network).
Output: 3 card components + 3 jest specs.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md
@.planning/phases/177-01-SUMMARY.md
@.planning/phases/177-02-SUMMARY.md
@CLAUDE.md
@app/components/devices/camera/hooks/useCameraData.ts
@app/components/devices/network/hooks/useNetworkData.ts

<interfaces>
<!-- useWeatherSummary (created in 177-02) -->
returns `{ city, temp, condition, high, low, loading }`

<!-- useCameraData (existing, unchanged) -->
returns `{ cameras: Array<{ id, name, resolution }>, lastUpdatedAt: number, ... }`
Snapshot endpoint: `/api/camera/snapshot/{id}` (302 redirect, existing)

<!-- useNetworkData (existing, unchanged) -->
returns `{ bandwidth: { download: number, upload: number }, devices: Array<...>, wan: { connected: boolean }, ... }`
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build WeatherCard (read-only, no Sheet) + jest test</name>
  <files>
    app/components/EmberGlass/cards/WeatherCard.tsx
    app/components/EmberGlass/cards/__tests__/WeatherCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: WeatherCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (WeatherCard section + Color/Tone table)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 200-218 — bundle source)
    - app/components/devices/weather/hooks/useWeatherSummary.ts (created in plan 177-02)
  </read_first>
  <behavior>
    - WeatherCard renders `<GlassCard tone="#ffb84a" data-testid="weather-card">` — **NO `onOpen` prop** (D-11, SC-#3).
    - CardHead: `Icon={Sun}`, `label="Meteo"`, `tone="#ffb84a"`, right slot = city name in 11px var(--text-2).
    - Body: 40px display temp `{temp}°` (var(--font-display), 600, letterSpacing -1) + `°` superscript at 18px / opacity 0.4. Subtitle: `{condition} · ↑{high}° ↓{low}°` (12px var(--text-2)).
    - When `loading` is true OR `temp === null`: render `—` placeholder for the temp; subtitle `Non raggiungibile` per D-26 if all data null.
    - **NO Sheet rendered** — no second JSX sibling. Just `<GlassCard>` (D-11).
    - Clicking the card does NOT open any dialog (no Sheet exists).
    - No useMemo/useCallback.
  </behavior>
  <action>
1. Create `app/components/EmberGlass/cards/WeatherCard.tsx`:
```tsx
'use client';
/** WeatherCard — Phase 177 (DASH-06). Bundle source: cards.jsx:200-218. READ-ONLY (D-11, SC-#3). */

import { Sun } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { useWeatherSummary } from '@/app/components/devices/weather/hooks/useWeatherSummary';

const TONE = '#ffb84a';

export default function WeatherCard() {
  const { city, temp, condition, high, low, loading } = useWeatherSummary();
  const hasData = !loading && temp !== null;

  const right = (
    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{city ?? ''}</div>
  );

  return (
    <GlassCard tone={TONE} data-testid="weather-card">
      <CardHead Icon={Sun} label="Meteo" tone={TONE} right={right} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div
          data-testid="weather-temp"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40, fontWeight: 600, lineHeight: 1,
            color: hasData ? '#fff' : 'var(--text-2)',
            letterSpacing: -1,
          }}
        >
          {hasData ? temp : '—'}
          <span style={{ fontSize: 18, opacity: 0.4, marginLeft: 2 }}>°</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
          {hasData
            ? `${condition} · ↑${high}° ↓${low}°`
            : 'Non raggiungibile'}
        </div>
      </div>
    </GlassCard>
  );
}
```

2. Create `app/components/EmberGlass/cards/__tests__/WeatherCard.test.tsx`:
   - Mock `useWeatherSummary` returning `{ city: 'Milano', temp: 22, condition: 'Sereno', high: 25, low: 14, loading: false }`.
   - Test (a): renders city `Milano`, temp `22`, subtitle contains `Sereno · ↑25° ↓14°`.
   - Test (b): when `loading: true, temp: null`, renders `—` and `Non raggiungibile`.
   - Test (c): clicking the card does NOT render any element with `Controlli in arrivo` — no Sheet exists. Use `queryByText(/Controlli in arrivo/i)` after `fireEvent.click(getByTestId('weather-card'))` and assert null.
   - Test (d): the rendered root has NO `cursor: pointer` style (assert `getByTestId('weather-card').style.cursor !== 'pointer'`).
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/WeatherCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/WeatherCard.tsx`
    - `grep -q "data-testid=\"weather-card\"" app/components/EmberGlass/cards/WeatherCard.tsx`
    - `grep -q "useWeatherSummary" app/components/EmberGlass/cards/WeatherCard.tsx`
    - `grep -c "import.*Sheet.*from" app/components/EmberGlass/cards/WeatherCard.tsx` returns `0` (no Sheet import — D-11)
    - `grep -c "onOpen" app/components/EmberGlass/cards/WeatherCard.tsx` returns `0` (no onOpen — D-11)
    - `grep -q '#ffb84a' app/components/EmberGlass/cards/WeatherCard.tsx`
    - `grep -q "label=\"Meteo\"" app/components/EmberGlass/cards/WeatherCard.tsx`
    - `grep -v '^//' app/components/EmberGlass/cards/WeatherCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/WeatherCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    WeatherCard ships read-only, no Sheet, no onOpen, all jest tests green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build CameraCard with LIVE pill + img snapshot + Sheet wiring + jest test</name>
  <files>
    app/components/EmberGlass/cards/CameraCard.tsx
    app/components/EmberGlass/cards/__tests__/CameraCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: CameraCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (CameraCard section + LIVE pill spec)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 308-340)
    - app/components/devices/camera/hooks/useCameraData.ts (full file — confirm `cameras` shape and `lastUpdatedAt` field)
    - app/globals.css (search for `@keyframes pulse` — exists from Phase 176)
  </read_first>
  <behavior>
    - CameraCard renders `<GlassCard tone="#6aa86a" onOpen={...} data-testid="camera-card">` with `<CardHead Icon={Video} label="Camera" tone="#6aa86a" right={<LivePill />}>`.
    - LivePill = inline flex with `<div data-testid="live-dot">` (6x6 round, `background: #ff4d5c`, `animation: pulse 1.6s infinite`) + `<span>LIVE</span>` (10px, 700, color #ff4d5c, letterSpacing 0.5).
    - Body: 14px-radius preview area `<div>` filling remaining height (`flex: 1, marginTop: 4`, `borderRadius: 14`, `position: relative`, `overflow: hidden`, `border: 0.5px solid rgba(255,255,255,0.06)`, `minHeight: 90`). Inside:
      - `<img src="/api/camera/snapshot/{cameras[0].id}?t={lastUpdatedAt}" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />` when a camera exists.
      - Bottom-left absolute label: `{name} · {resolution}` (10px ui-monospace, rgba(255,255,255,0.7), bottom: 8, left: 10).
    - When no cameras: render the preview shell empty (no img); label shows `— · `.
    - Adjacent `<Sheet title="Camera">` with `<SheetPlaceholderBody phase="178" device="camera" />`.
    - No useMemo/useCallback. Use bare `<img>` per A-06 (NOT next/image).
  </behavior>
  <action>
1. Read `app/components/devices/camera/hooks/useCameraData.ts` and confirm: returns `{ cameras: Array<{ id, name, resolution }>, lastUpdatedAt }` (or whatever exact shape).

2. Create `app/components/EmberGlass/cards/CameraCard.tsx`:
```tsx
'use client';
/** CameraCard — Phase 177 (DASH-07). Bundle source: cards.jsx:308-340. */

import { useState } from 'react';
import { Video } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useCameraData } from '@/app/components/devices/camera/hooks/useCameraData';

const TONE = '#6aa86a';

export default function CameraCard() {
  const [open, setOpen] = useState(false);
  const { cameras, lastUpdatedAt } = useCameraData();
  const cam = cameras?.[0] ?? null;
  const src = cam ? `/api/camera/snapshot/${cam.id}?t=${lastUpdatedAt ?? 0}` : null;

  const livePill = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div
        data-testid="live-dot"
        style={{ width: 6, height: 6, borderRadius: 999, background: '#ff4d5c', animation: 'pulse 1.6s infinite' }}
      />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#ff4d5c', letterSpacing: 0.5 }}>LIVE</span>
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="camera-card">
        <CardHead Icon={Video} label="Camera" tone={TONE} right={livePill} />
        <div style={{
          flex: 1, marginTop: 4, borderRadius: 14, position: 'relative', overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.06)', minHeight: 90,
        }}>
          {src && (
            // eslint-disable-next-line @next/next/no-img-element -- A-06: 302-redirect snapshot endpoint
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            fontSize: 10, color: 'rgba(255,255,255,0.7)',
            fontFamily: 'ui-monospace, SF Mono, monospace',
          }}>
            {cam?.name ?? '—'} · {cam?.resolution ?? ''}
          </div>
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Camera">
        <SheetPlaceholderBody phase="178" device="camera" />
      </Sheet>
    </>
  );
}
```

3. Create `app/components/EmberGlass/cards/__tests__/CameraCard.test.tsx`:
   - Mock `useCameraData` returning `{ cameras: [{ id: 'cam1', name: 'INGRESSO', resolution: '1080p' }], lastUpdatedAt: 1700000000 }`.
   - Test (a): renders `<img>` with `src` containing `/api/camera/snapshot/cam1?t=1700000000`.
   - Test (b): renders label `INGRESSO · 1080p`.
   - Test (c): renders LIVE pill (`getByText('LIVE')` and `getByTestId('live-dot')`).
   - Test (d): clicking card opens sheet with placeholder body.
   - Test (e): when `cameras: []`, renders no `<img>` (`container.querySelector('img')` is null) and label `— · `.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/CameraCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/CameraCard.tsx`
    - `grep -q "data-testid=\"camera-card\"" app/components/EmberGlass/cards/CameraCard.tsx`
    - `grep -q "/api/camera/snapshot/" app/components/EmberGlass/cards/CameraCard.tsx`
    - `grep -q ">LIVE<" app/components/EmberGlass/cards/CameraCard.tsx` OR `grep -q "'LIVE'" app/components/EmberGlass/cards/CameraCard.tsx`
    - `grep -q "animation: 'pulse 1.6s infinite'" app/components/EmberGlass/cards/CameraCard.tsx`
    - `grep -q '<img src' app/components/EmberGlass/cards/CameraCard.tsx` (A-06: bare img, not next/image)
    - `grep -c "next/image" app/components/EmberGlass/cards/CameraCard.tsx` returns `0` (A-06)
    - `grep -q "title=\"Camera\"" app/components/EmberGlass/cards/CameraCard.tsx`
    - `grep -v '^//' app/components/EmberGlass/cards/CameraCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/CameraCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    CameraCard ships with LIVE pulse pill, bare img snapshot, mono label overlay, sheet wiring; all jest tests green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Build NetworkCard with bandwidth display + jest test</name>
  <files>
    app/components/EmberGlass/cards/NetworkCard.tsx
    app/components/EmberGlass/cards/__tests__/NetworkCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: NetworkCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (NetworkCard section)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 343-359)
    - app/components/devices/network/hooks/useNetworkData.ts (full file — confirm `bandwidth.download/upload`, `devices`, `wan` shapes)
  </read_first>
  <behavior>
    - NetworkCard renders `<GlassCard tone="#5eafff" onOpen={...} data-testid="network-card">` with `<CardHead Icon={Wifi} label="Rete" tone="#5eafff" right={<StatusDot on color="#6aa86a" />}>`.
    - Body: large `{down}` (22px display, 600 var(--font-display), white) + `Mbps ↓` (11px var(--text-2), inline next to it). Below: `{up} Mbps ↑ · {N} dispositivi` (12px var(--text-2)).
    - Adjacent `<Sheet title="Rete">` with `<SheetPlaceholderBody phase="178" device="network" />`.
    - When `wan?.connected === false`, the StatusDot color switches to `#ffb84a` (stale/unreachable signal per D-25).
    - No useMemo/useCallback.
  </behavior>
  <action>
1. Read `app/components/devices/network/hooks/useNetworkData.ts` to confirm exact field names: `bandwidth.download`, `bandwidth.upload`, `devices.length` or `activeDeviceCount`, `wan.connected`. Adjust the field accesses below to match the actual shape.

2. Create `app/components/EmberGlass/cards/NetworkCard.tsx`:
```tsx
'use client';
/** NetworkCard — Phase 177 (DASH-08). Bundle source: cards.jsx:343-359. */

import { useState } from 'react';
import { Wifi } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';

const TONE = '#5eafff';

export default function NetworkCard() {
  const [open, setOpen] = useState(false);
  const network = useNetworkData();
  const down = network?.bandwidth?.download ?? 0;
  const up = network?.bandwidth?.upload ?? 0;
  const deviceCount = network?.devices?.length ?? 0;
  const wanOk = network?.wan?.connected !== false;
  const dotColor = wanOk ? '#6aa86a' : '#ffb84a';

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="network-card">
        <CardHead Icon={Wifi} label="Rete" tone={TONE} right={<StatusDot on color={dotColor} />} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div data-testid="network-down" style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {down}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Mbps ↓</div>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {up} Mbps ↑ · {deviceCount} dispositivi
          </div>
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Rete">
        <SheetPlaceholderBody phase="178" device="network" />
      </Sheet>
    </>
  );
}
```

3. Create `app/components/EmberGlass/cards/__tests__/NetworkCard.test.tsx`:
   - Mock `useNetworkData` returning `{ bandwidth: { download: 350, upload: 120 }, devices: [{}, {}, {}, {}, {}], wan: { connected: true } }`.
   - Test (a): renders `350` in `network-down` testid.
   - Test (b): subtitle includes `120 Mbps ↑ · 5 dispositivi`.
   - Test (c): when `wan.connected === false`, the StatusDot has `color="#ffb84a"`.
   - Test (d): clicking card opens sheet with placeholder body.
   - Test (e): when bandwidth is undefined, renders `0` and `0 Mbps ↑ · 0 dispositivi`.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/NetworkCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/NetworkCard.tsx`
    - `grep -q "data-testid=\"network-card\"" app/components/EmberGlass/cards/NetworkCard.tsx`
    - `grep -q "Mbps ↓" app/components/EmberGlass/cards/NetworkCard.tsx`
    - `grep -q "dispositivi" app/components/EmberGlass/cards/NetworkCard.tsx`
    - `grep -q '#5eafff' app/components/EmberGlass/cards/NetworkCard.tsx`
    - `grep -q "title=\"Rete\"" app/components/EmberGlass/cards/NetworkCard.tsx`
    - `grep -v '^//' app/components/EmberGlass/cards/NetworkCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/NetworkCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    NetworkCard ships with bandwidth display, Italian subtitle, stale-WAN amber dot, sheet wiring; all jest tests green.
  </done>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-05 | Information disclosure | CameraCard snapshot | accept | Reuses existing /api/camera/snapshot/{id} endpoint with established session-scoped auth. No new endpoint. |
</threat_model>

<verification>
- All 3 card files exist
- All ~14 jest tests green under `npm run test:components`
- `npx tsc --noEmit` exits 0
- WeatherCard has zero Sheet imports (verified via grep)
- CameraCard has zero next/image imports (A-06 verified via grep)
</verification>

<success_criteria>
- DASH-06 satisfied (WeatherCard read-only with city + temp + condition + hi/lo)
- DASH-07 satisfied (CameraCard with LIVE pill + snapshot)
- DASH-08 satisfied (NetworkCard with down + up + device count)
- DASH-11 partial (Camera + Network open sheets; Weather does NOT)
- DASH-12 unchanged (no RC opt-outs)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-05-SUMMARY.md` documenting hook-shape confirmations (especially Network), confirmation that WeatherCard has no Sheet, and jest pass output.
</output>
