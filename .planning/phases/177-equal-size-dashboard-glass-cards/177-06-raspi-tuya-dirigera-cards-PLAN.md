---
phase: 177
plan: 06
type: execute
wave: 2
depends_on: ['177-01', '177-02']
files_modified:
  - app/components/EmberGlass/cards/RaspiCard.tsx
  - app/components/EmberGlass/cards/TuyaCard.tsx
  - app/components/EmberGlass/cards/DirigeraCard.tsx
  - app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx
  - app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx
  - app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx
autonomous: true
requirements: [DASH-09, DASH-10, DASH-11, DASH-12]
tags: [ember-glass, dashboard-cards, raspi, tuya, dirigera]
must_haves:
  truths:
    - "RaspiCard renders read-only — no Pressable, no Sheet — with 2-stat MiniStat grid + CPU temp footer"
    - "TuyaCard renders ≤4 plug names + total power header (W/kW auto-format) + 'N di M accese' footer with NO inline toggles"
    - "DirigeraCard renders the same plug shape but against an empty list (per A-02 LANDMINE #2)"
  artifacts:
    - path: app/components/EmberGlass/cards/RaspiCard.tsx
      provides: "Read-only RaspiCard with 2-stat MiniStat"
    - path: app/components/EmberGlass/cards/TuyaCard.tsx
      provides: "TuyaCard plug summary"
    - path: app/components/EmberGlass/cards/DirigeraCard.tsx
      provides: "DirigeraCard plug-shape summary (empty-list mode per A-02)"
  key_links:
    - from: app/components/EmberGlass/cards/RaspiCard.tsx
      to: app/components/EmberGlass/MiniStat.tsx
      via: "import MiniStat"
      pattern: "MiniStat"
---

<objective>
Ship the RaspiCard (DASH-09, **read-only**), TuyaCard (DASH-10), and DirigeraCard (DASH-10 sibling).

Per SC-#3 and D-11, **RaspiCard renders WITHOUT `onOpen`** → no Pressable, no Sheet. Per DASH-10, TuyaCard and DirigeraCard have **NO inline toggles** on the dashboard surface (toggles live in PlugsSheet, Phase 178). Per A-02, DirigeraCard ships in empty-list mode (LANDMINE #2: `useDirigeraData()` exposes sensors, not plugs).

Purpose: Lands the final 3 cards completing the 9-card grid. Establishes the read-only stat-grid pattern (Raspi) and the report-only plug-list pattern (Tuya/Dirigera).
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
@app/components/devices/raspi/hooks/useRaspiData.ts
@app/components/devices/tuya/hooks/useTuyaData.ts
@app/components/devices/dirigera/hooks/useDirigeraData.ts

<interfaces>
<!-- useRaspiData (existing, unchanged) -->
returns `{ data: { cpuPercent, memoryPercent, cpuTemperature }, ... }` — verify exact field names

<!-- useTuyaData (existing, unchanged) -->
returns `{ plugs: Array<{ id, name, on, power }>, ... }`

<!-- useDirigeraData (existing, unchanged, LANDMINE #2) -->
returns sensors only (contact/motion). NO plugs field. Per A-02, render with empty list fallback.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build RaspiCard (read-only) with 2-stat MiniStat grid + jest test</name>
  <files>
    app/components/EmberGlass/cards/RaspiCard.tsx
    app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: RaspiCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (RaspiCard section)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 361-373)
    - app/components/devices/raspi/hooks/useRaspiData.ts (full file — confirm `data.{cpuPercent, memoryPercent, cpuTemperature}` field names)
    - app/components/EmberGlass/cards/WeatherCard.tsx (sibling read-only pattern from plan 177-05)
  </read_first>
  <behavior>
    - RaspiCard renders `<GlassCard tone="#6aa86a" data-testid="raspi-card">` — **NO `onOpen`** (D-11, SC-#3).
    - CardHead: `Icon={Cpu}`, `label="Raspberry"`, `tone="#6aa86a"`, right slot = `<StatusDot on color="#6aa86a" />`.
    - Body: 2-column grid (`gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, alignContent: 'end'`) with two `<MiniStat>`: CPU and RAM. Each MiniStat: label + `{N}%` value + `bar={N/100}`.
    - Footer: `CPU temp {N}°C` (12px var(--text-2), marginTop 8). When `cpuTemperature` is null/undefined, render `—` instead of N.
    - **NO Sheet rendered** (D-11).
    - No useMemo/useCallback.
  </behavior>
  <action>
1. Read `app/components/devices/raspi/hooks/useRaspiData.ts` to confirm exact field names. Adjust below if hook returns `data.cpu`/`data.ram` instead of `data.cpuPercent`/`data.memoryPercent`.

2. Create `app/components/EmberGlass/cards/RaspiCard.tsx`:
```tsx
'use client';
/** RaspiCard — Phase 177 (DASH-09). Bundle source: cards.jsx:361-373. READ-ONLY (D-11, SC-#3). */

import { Cpu } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { MiniStat } from '../MiniStat';
import { useRaspiData } from '@/app/components/devices/raspi/hooks/useRaspiData';

const TONE = '#6aa86a';

export default function RaspiCard() {
  const { data } = useRaspiData();
  const cpu = data?.cpuPercent ?? 0;
  const ram = data?.memoryPercent ?? 0;
  const temp = data?.cpuTemperature;

  return (
    <GlassCard tone={TONE} data-testid="raspi-card">
      <CardHead Icon={Cpu} label="Raspberry" tone={TONE} right={<StatusDot on color={TONE} />} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, alignContent: 'end' }}>
        <MiniStat label="CPU" value={`${cpu}%`} bar={cpu / 100} />
        <MiniStat label="RAM" value={`${ram}%`} bar={ram / 100} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
        CPU temp {temp ?? '—'}°C
      </div>
    </GlassCard>
  );
}
```

3. Create `app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx`:
   - Mock `useRaspiData` returning `{ data: { cpuPercent: 45, memoryPercent: 67, cpuTemperature: 52 } }`.
   - Test (a): renders `45%` and `67%` MiniStat values.
   - Test (b): renders footer `CPU temp 52°C`.
   - Test (c): clicking card does NOT open any sheet (`queryByText(/Controlli in arrivo/i)` stays null).
   - Test (d): when `data.cpuTemperature` is undefined, renders `CPU temp —°C`.
   - Test (e): card root has no `cursor: pointer` style.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/RaspiCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/RaspiCard.tsx`
    - `grep -q "data-testid=\"raspi-card\"" app/components/EmberGlass/cards/RaspiCard.tsx`
    - `grep -q "MiniStat" app/components/EmberGlass/cards/RaspiCard.tsx`
    - `grep -q "CPU temp" app/components/EmberGlass/cards/RaspiCard.tsx`
    - `grep -q '#6aa86a' app/components/EmberGlass/cards/RaspiCard.tsx`
    - `grep -c "import.*Sheet.*from" app/components/EmberGlass/cards/RaspiCard.tsx` returns `0` (no Sheet — D-11)
    - `grep -c "onOpen" app/components/EmberGlass/cards/RaspiCard.tsx` returns `0` (no onOpen — D-11)
    - `grep -v '^//' app/components/EmberGlass/cards/RaspiCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/RaspiCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    RaspiCard ships read-only with 2-stat grid, CPU temp footer, no Sheet, no onOpen; all jest tests green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build TuyaCard with plug list + power header + Sheet wiring + jest test</name>
  <files>
    app/components/EmberGlass/cards/TuyaCard.tsx
    app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: TuyaCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (TuyaCard section)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 385-432)
    - app/components/devices/tuya/hooks/useTuyaData.ts (full file — confirm `plugs[]` shape: id, name, on, power)
    - app/components/EmberGlass/cards/LightsCard.tsx (sibling list-pattern from plan 177-04)
  </read_first>
  <behavior>
    - TuyaCard renders `<GlassCard tone="#ffb84a" onOpen={...} data-testid="tuya-card">` with `<CardHead Icon={Plug} label="Prese smart" tone="#ffb84a" right={<powerText />}>`.
    - Right slot = formatted total power: 11px, 600, color `#ffb84a`, letterSpacing 0.3, tabular-nums. Format: if `totalPower >= 1000` → `${(totalPower/1000).toFixed(1)}kW`; else `${totalPower}W`.
    - Body: up to 4 plug rows: status dot color `#ffb84a` + 11px medium plug name. **NO inline toggles** (DASH-10 explicit).
    - Footer: `{onCount} di {totalCount} accese` (12px var(--text-2), marginTop 8).
    - Adjacent `<Sheet title="Prese smart">` with `<SheetPlaceholderBody phase="178" device="plugs-tuya" />`.
    - When `plugs` is empty: footer reads `0 di 0 accese`, body is empty, right slot reads `0W`.
    - No useMemo/useCallback.
  </behavior>
  <action>
1. Read `app/components/devices/tuya/hooks/useTuyaData.ts` and confirm `plugs[]` shape.

2. Create `app/components/EmberGlass/cards/TuyaCard.tsx`:
```tsx
'use client';
/** TuyaCard — Phase 177 (DASH-10). Bundle source: cards.jsx:385-432. NO inline toggles (DASH-10). */

import { useState } from 'react';
import { Plug } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';

const TONE = '#ffb84a';

function formatPower(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(1)}kW` : `${w}W`;
}

export default function TuyaCard() {
  const [open, setOpen] = useState(false);
  const { plugs } = useTuyaData();
  const list = plugs ?? [];
  const visible = list.slice(0, 4);
  const onCount = list.filter((p) => p.on).length;
  const totalPower = list.reduce((s, p) => s + (p.power ?? 0), 0);

  const right = (
    <div style={{
      fontSize: 11, fontWeight: 600, color: TONE,
      letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums',
    }}>
      {formatPower(totalPower)}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="tuya-card">
        <CardHead Icon={Plug} label="Prese smart" tone={TONE} right={right} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
          {visible.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusDot on={Boolean(p.on)} color={TONE} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#fff' }}>{p.name}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {onCount} di {list.length} accese
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Prese smart">
        <SheetPlaceholderBody phase="178" device="plugs-tuya" />
      </Sheet>
    </>
  );
}
```

3. Create `app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx`:
   - Mock `useTuyaData` returning `{ plugs: [{ id: 'p1', name: 'TV', on: true, power: 120 }, { id: 'p2', name: 'Frigo', on: true, power: 800 }, { id: 'p3', name: 'Lampada', on: false, power: 0 }] }`.
   - Test (a): right slot shows `920W`.
   - Test (b): when total >= 1000, e.g. 1500W → `1.5kW`.
   - Test (c): body renders `TV`, `Frigo`, `Lampada` rows.
   - Test (d): footer shows `2 di 3 accese`.
   - Test (e): no `[role="switch"]` element exists in the card body (verify via `container.querySelectorAll('[role="switch"]').length === 0` — DASH-10 no inline toggles).
   - Test (f): clicking card opens sheet with placeholder body.
   - Test (g): when plugs empty, right slot shows `0W` and footer `0 di 0 accese`.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/TuyaCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -q "data-testid=\"tuya-card\"" app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -q "label=\"Prese smart\"" app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -q "kW" app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -q "di .*accese" app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -q '#ffb84a' app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -c "InlineToggle" app/components/EmberGlass/cards/TuyaCard.tsx` returns `0` (DASH-10: no inline toggles)
    - `grep -c "role=\"switch\"" app/components/EmberGlass/cards/TuyaCard.tsx` returns `0` (DASH-10)
    - `grep -q "device=\"plugs-tuya\"" app/components/EmberGlass/cards/TuyaCard.tsx`
    - `grep -v '^//' app/components/EmberGlass/cards/TuyaCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/TuyaCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    TuyaCard ships with ≤4 plug rows, formatted power header, NO inline toggles, sheet wiring; all jest tests green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Build DirigeraCard (empty-list per A-02) + jest test</name>
  <files>
    app/components/EmberGlass/cards/DirigeraCard.tsx
    app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: DirigeraCard" — note A-02 LANDMINE #2)
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (DirigeraCard reference + Assumptions Log A-02)
    - app/components/devices/dirigera/hooks/useDirigeraData.ts (full file — confirm sensors-only shape; NO plugs field)
    - app/components/EmberGlass/cards/TuyaCard.tsx (sibling pattern from this plan's Task 2)
  </read_first>
  <behavior>
    - DirigeraCard renders `<GlassCard tone="#ffb84a" onOpen={...} data-testid="dirigera-card">` with `<CardHead Icon={Plug} label="IKEA" tone="#ffb84a" right={<powerText />}>`.
    - Per A-02 (LANDMINE #2: DIRIGERA exposes sensors, not plugs), `list = []` always for now.
    - Right slot: `0W`. Body: empty (no rows). Footer: `0 di 0 accese`.
    - The hook is still consumed via `useDirigeraData()` so a future phase can fill in plug data without re-wiring.
    - Adjacent `<Sheet title="IKEA">` with `<SheetPlaceholderBody phase="178" device="plugs-dirigera" />`.
    - No useMemo/useCallback. Stable plug-id keys (irrelevant when list is empty, but pattern matches Tuya).
  </behavior>
  <action>
1. Create `app/components/EmberGlass/cards/DirigeraCard.tsx`:
```tsx
'use client';
/**
 * DirigeraCard — Phase 177 (DASH-10 sibling).
 * Bundle source: cards.jsx:385-432 (same shape as TuyaCard, label "IKEA").
 *
 * A-02 / RESEARCH LANDMINE #2: useDirigeraData() exposes sensors (contact + motion) only,
 * NOT plugs. Per A-02 default (c), this card renders an empty list with `0W` total power
 * and `0 di 0 accese` footer until a future phase adds plug data to the DIRIGERA proxy.
 */

import { useState } from 'react';
import { Plug } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useDirigeraData } from '@/app/components/devices/dirigera/hooks/useDirigeraData';

const TONE = '#ffb84a';

interface DirigeraPlug { id: string; name: string; on: boolean; power: number }

function formatPower(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(1)}kW` : `${w}W`;
}

export default function DirigeraCard() {
  const [open, setOpen] = useState(false);
  // A-02 LANDMINE #2: useDirigeraData() returns sensors only.
  // The hook is consumed here for forward-compatibility — when plug data lands,
  // replace the empty array below with the real list.
  useDirigeraData();
  const list: DirigeraPlug[] = [];
  const onCount = 0;
  const totalPower = 0;

  const right = (
    <div style={{
      fontSize: 11, fontWeight: 600, color: TONE,
      letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums',
    }}>
      {formatPower(totalPower)}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="dirigera-card">
        <CardHead Icon={Plug} label="IKEA" tone={TONE} right={right} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
          {/* Empty by design per A-02. */}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {onCount} di {list.length} accese
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="IKEA">
        <SheetPlaceholderBody phase="178" device="plugs-dirigera" />
      </Sheet>
    </>
  );
}
```

2. Create `app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx`:
   - Mock `useDirigeraData` returning `{ data: { sensors: [] } }` (or whatever empty shape works).
   - Test (a): right slot shows `0W`.
   - Test (b): footer shows `0 di 0 accese`.
   - Test (c): clicking card opens sheet titled `IKEA`.
   - Test (d): no `[role="switch"]` in card body.
   - Test (e): card has `data-testid="dirigera-card"`.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/DirigeraCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/DirigeraCard.tsx`
    - `grep -q "data-testid=\"dirigera-card\"" app/components/EmberGlass/cards/DirigeraCard.tsx`
    - `grep -q 'label=\"IKEA\"' app/components/EmberGlass/cards/DirigeraCard.tsx`
    - `grep -q 'title=\"IKEA\"' app/components/EmberGlass/cards/DirigeraCard.tsx`
    - `grep -q "device=\"plugs-dirigera\"" app/components/EmberGlass/cards/DirigeraCard.tsx`
    - `grep -q "A-02" app/components/EmberGlass/cards/DirigeraCard.tsx` (landmine reference present in comment)
    - `grep -c "InlineToggle" app/components/EmberGlass/cards/DirigeraCard.tsx` returns `0` (DASH-10)
    - `grep -v '^//' app/components/EmberGlass/cards/DirigeraCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/DirigeraCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    DirigeraCard ships in empty-list mode per A-02, sheet wiring with title `IKEA`, jest tests green.
  </done>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-06 | Tampering | TuyaCard / DirigeraCard | accept | Dashboard surface is report-only (no plug toggles per DASH-10). Toggle attack surface stays in the Phase 178 PlugsSheet behind shared HA proxy auth. |
</threat_model>

<verification>
- All 3 card files exist
- All ~13 jest tests green under `npm run test:components`
- `npx tsc --noEmit` exits 0
- RaspiCard has zero Sheet imports, zero onOpen (verified via grep)
- TuyaCard + DirigeraCard have zero `InlineToggle` and zero `role="switch"` (DASH-10 verified via grep)
</verification>

<success_criteria>
- DASH-09 satisfied (RaspiCard read-only with 2-stat MiniStat + CPU temp footer)
- DASH-10 satisfied (TuyaCard + DirigeraCard with plug shape, no inline toggles)
- DASH-11 partial (Tuya/Dirigera open sheets; Raspi does NOT)
- DASH-12 unchanged (no RC opt-outs)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-06-SUMMARY.md` documenting hook-shape confirmations (especially Tuya), confirmation that RaspiCard has no Sheet, A-02 (Dirigera empty-list) recorded, jest pass output.
</output>
