---
phase: 177
plan: 03
type: execute
wave: 2
depends_on: ['177-01', '177-02']
files_modified:
  - app/components/EmberGlass/cards/StoveCard.tsx
  - app/components/EmberGlass/cards/ClimateCard.tsx
  - app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
  - app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
autonomous: true
requirements: [DASH-02, DASH-03, DASH-11, DASH-12]
tags: [ember-glass, dashboard-cards, stove, climate]
must_haves:
  truths:
    - "StoveCard renders a 1:1 glass surface with FlameViz, large powerLevel readout (no unit superscript per A-01), and 'Fiamma N · Ventola N' or 'Spenta' subtitle"
    - "ClimateCard renders ≤4 zones inline with current temps (room name resolved from topology if not on RoomStatus) and 'N di M attive' footer"
    - "Tapping StoveCard or ClimateCard opens a Sheet with placeholder body"
  artifacts:
    - path: app/components/EmberGlass/cards/StoveCard.tsx
      provides: "Dashboard StoveCard summary surface"
    - path: app/components/EmberGlass/cards/ClimateCard.tsx
      provides: "Dashboard ClimateCard summary surface"
  key_links:
    - from: app/components/EmberGlass/cards/StoveCard.tsx
      to: app/components/EmberGlass/FlameViz.tsx
      via: "import { FlameViz } from '../FlameViz'"
      pattern: "FlameViz"
    - from: app/components/EmberGlass/cards/StoveCard.tsx
      to: app/components/devices/stove/hooks/useStoveData
      via: "import useStoveData"
      pattern: "useStoveData"
---

<objective>
Ship the StoveCard (DASH-02) and ClimateCard (DASH-03) — the two heat/climate-class summary tiles. Both use Phase 175 `<Pressable>` (auto via GlassCard `onOpen`), Phase 175 `<Sheet>` (placeholder body — Phase 178 will replace), and existing data hooks (`useStoveData`, `useThermostatData`) unchanged.

**A-01 acceptance — Stove value rendered as power_level integer 1..5, no unit superscript** (deviation from bundle's stylistic `°C`, since no ambient temperature exists for the stove). Thermorossi's HA proxy exposes only `power_level`; rendering a `°C` superscript would be a semantic lie. The 36px display shows the digit alone. Test (a) asserts NO `°C` substring in the DOM near the value.

Per A-05, ClimateCard mode text is rendered uppercase via `.toUpperCase()`.

Per D-16 (canonical room-name resolution): RoomStatus may not carry `name` directly. ClimateCard must fall back through `topology.rooms` lookup before defaulting to `room_id`.

Purpose: Lands the first two interactive dashboard cards, proving the Wave 1 primitives compose correctly.
Output: 2 card components + 2 jest specs.
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
@app/components/EmberGlass/Sheet.tsx
@app/components/EmberGlass/FlameViz.tsx
@app/components/devices/stove/StoveCard.tsx
@app/components/devices/stove/hooks/useStoveData.ts
@app/context/VersionContext.tsx

<interfaces>
<!-- Wave 1 primitive contracts -->
GlassCard: `({ children, tone?, onOpen?, style?, 'data-testid'? })` — auto Pressable wrap when onOpen provided
CardHead: `({ Icon, label, tone, right? })`
StatusDot: `({ on, color? })` — color defaults to var(--accent)
Sheet (Phase 175): `<Sheet open onClose title>{children}</Sheet>`
SheetPlaceholderBody: `<SheetPlaceholderBody phase="178" device="stove" | "thermostat" />`
FlameViz (Phase 176): `<FlameViz on intensity />` — intensity 0..1

<!-- Existing hooks (unchanged) -->
useStoveData: returns `{ status, isAccesa, powerLevel, fanLevel, staleness, ... }` — verify exact field names by reading the hook
useThermostatData: returns `{ status: { rooms: RoomStatus[], mode: string } }` — RoomStatus has `room_id`, `temperature`, `setpoint`, `heating`. May ALSO expose `topology: { rooms: Array<{ id, name }> }` for canonical name resolution (D-16).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build StoveCard with FlameViz + Sheet wiring + jest test</name>
  <files>
    app/components/EmberGlass/cards/StoveCard.tsx
    app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: StoveCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (StoveCard section under "Per-card body & footer copy")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md (A-01 — stove readout is power_level; D-16 if referenced)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 81-107 — bundle source for StoveCard body)
    - app/components/devices/stove/hooks/useStoveData.ts (full file — confirm field names: isAccesa, powerLevel, fanLevel, staleness)
    - app/components/devices/stove/StoveCard.tsx (legacy big card — for hook-consumption parameter pattern: `useStoveData({ checkVersion, userId })`)
    - app/context/VersionContext.tsx (full file — confirm `useVersion()` return shape includes `checkVersion`)
    - app/components/EmberGlass/__tests__/Sheet.test.tsx (jest mock + state-assertion analog)
  </read_first>
  <behavior>
    - StoveCard renders `<GlassCard tone="var(--accent)" onOpen={...} data-testid="stove-card">` with `<CardHead Icon={Flame} label="Stufa" tone="var(--accent)" right={<StatusDot on={isAccesa} />}>` and a body containing FlameViz absolute-positioned top-right (`right: -8, top: -10, opacity: 0.9`) plus a `data-testid="stove-temp"` 36px display showing `{powerLevel ?? '—'}` **with NO unit superscript** (A-01 deviation — see plan summary).
    - Subtitle when `isAccesa`: `Fiamma {powerLevel} · Ventola {fanLevel}`. When off: `Spenta`.
    - Adjacent to `<GlassCard>` renders `<Sheet open={open} onClose={() => setOpen(false)} title="Stufa">` with `<SheetPlaceholderBody phase="178" device="stove" />`.
    - Clicking the GlassCard sets `open` to true; the SheetPlaceholderBody body becomes visible in the Sheet.
    - Stale-state visual (D-25): when `staleness >= warning` is true (e.g., `staleness === 'stale'` per the hook), the StatusDot color switches to `#ffb84a`.
    - No `useMemo`, no `useCallback` (D-28).
  </behavior>
  <action>
1. Create `app/components/EmberGlass/cards/StoveCard.tsx`:
```tsx
'use client';

/**
 * StoveCard — Phase 177 (DASH-02)
 *
 * Per A-01: large readout uses power_level (Thermorossi exposes no ambient temp).
 * NO °C superscript — rendering a temperature unit on a 1..5 power level would
 * be a semantic lie. Deviates from bundle stylistic °C; tests assert no °C in DOM.
 *
 * Bundle source (PRIMARY visual contract): cards.jsx:81-107
 */

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

export default function StoveCard() {
  const [open, setOpen] = useState(false);
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stove = useStoveData({ checkVersion, userId: user?.sub });

  const isStale = stove.staleness === 'stale' || stove.staleness === 'warning';
  const dotColor = isStale ? '#ffb84a' : undefined;

  return (
    <>
      <GlassCard tone="var(--accent)" onOpen={() => setOpen(true)} data-testid="stove-card">
        <CardHead
          Icon={Flame}
          label="Stufa"
          tone="var(--accent)"
          right={<StatusDot on={stove.isAccesa} color={dotColor} />}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
          <div style={{ position: 'absolute', right: -8, top: -10, opacity: 0.9 }} data-testid="flame-viz">
            <FlameViz on={stove.isAccesa} intensity={(stove.powerLevel ?? 0) / 5} />
          </div>
          <div
            data-testid="stove-temp"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1,
              color: stove.isAccesa ? '#fff' : 'var(--text-2)',
              letterSpacing: -1.2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {stove.powerLevel ?? '—'}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {stove.isAccesa ? `Fiamma ${stove.powerLevel} · Ventola ${stove.fanLevel}` : 'Spenta'}
          </div>
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
        <SheetPlaceholderBody phase="178" device="stove" />
      </Sheet>
    </>
  );
}
```

**Verify field names BEFORE coding** by reading `app/components/devices/stove/hooks/useStoveData.ts` AND `app/context/VersionContext.tsx` — diff your call signature against the legacy `app/components/devices/stove/StoveCard.tsx`. If any name differs (`isAccesa`/`powerLevel`/`fanLevel`/`staleness` or `useVersion()` return shape), adjust imports and field accesses. Do NOT invent fields.

2. Create `app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx` (mirror `__tests__/Sheet.test.tsx` mocking style):
```tsx
import { render, fireEvent } from '@testing-library/react';
import StoveCard from '../StoveCard';

jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: jest.fn(),
}));
jest.mock('@auth0/nextjs-auth0/client', () => ({ useUser: () => ({ user: { sub: 'test-user' } }) }));
jest.mock('@/app/context/VersionContext', () => ({ useVersion: () => ({ checkVersion: jest.fn() }) }));

import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
const useStoveDataMock = useStoveData as jest.Mock;

describe('StoveCard (Phase 177 — DASH-02)', () => {
  test('(a) renders 36px power_level readout with NO °C unit when on (A-01)', () => {
    useStoveDataMock.mockReturnValue({ isAccesa: true, powerLevel: 3, fanLevel: 2, staleness: 'fresh' });
    const { getByTestId, getByText } = render(<StoveCard />);
    const tempEl = getByTestId('stove-temp');
    expect(tempEl.textContent).toContain('3');
    // A-01: no temperature unit — power_level is dimensionless 1..5
    expect(tempEl.textContent).not.toContain('°C');
    expect(tempEl.textContent).not.toContain('°');
    expect(getByText('Fiamma 3 · Ventola 2')).toBeInTheDocument();
  });
  test('(b) renders Spenta subtitle when off', () => {
    useStoveDataMock.mockReturnValue({ isAccesa: false, powerLevel: 0, fanLevel: 0, staleness: 'fresh' });
    const { getByText } = render(<StoveCard />);
    expect(getByText('Spenta')).toBeInTheDocument();
  });
  test('(c) clicking card opens sheet with placeholder body', () => {
    useStoveDataMock.mockReturnValue({ isAccesa: true, powerLevel: 1, fanLevel: 1, staleness: 'fresh' });
    const { getByTestId, queryByText } = render(<StoveCard />);
    expect(queryByText(/Controlli in arrivo/i)).toBeNull();
    fireEvent.click(getByTestId('stove-card'));
    expect(queryByText(/Controlli in arrivo/i)).toBeInTheDocument();
  });
});
```
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/StoveCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q "data-testid=\"stove-card\"" app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q "data-testid=\"stove-temp\"" app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q "FlameViz" app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q 'tone=\"var(--accent)\"' app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q "Fiamma .* · Ventola" app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q "'Spenta'" app/components/EmberGlass/cards/StoveCard.tsx`
    - `grep -q 'title=\"Stufa\"' app/components/EmberGlass/cards/StoveCard.tsx`
    - **A-01 unit-free assertion**: `grep -v '^//' app/components/EmberGlass/cards/StoveCard.tsx | grep -v '^ \*' | grep -c "°C"` returns `0` (no °C unit superscript on the value)
    - useStoveData call signature matches the legacy orchestrator (verified via diff against `app/components/devices/stove/StoveCard.tsx` — both pass `{ checkVersion, userId }`)
    - `grep -v '^//' app/components/EmberGlass/cards/StoveCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0` (D-28)
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/StoveCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    StoveCard ships with FlameViz integration, bundle-faithful 36px display rendering power_level integer **without** °C superscript (A-01 deviation documented), Italian subtitle, sheet wiring, and 3 jest tests green including the no-°C assertion.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build ClimateCard with zone list + Sheet wiring + jest test</name>
  <files>
    app/components/EmberGlass/cards/ClimateCard.tsx
    app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: ClimateCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (ClimateCard section)
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md (D-16 — canonical room-name resolution)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 138-164)
    - app/components/devices/thermostat/hooks/useThermostatData.ts (full file — confirm `status.rooms[]` shape: `room_id`, `temperature`, `heating`, plus `status.mode` and topology lookup for room name)
    - app/components/EmberGlass/cards/StoveCard.tsx (sibling card pattern — match imports + hook-consumption shape)
  </read_first>
  <behavior>
    - ClimateCard renders `<GlassCard tone="#5eafff" onOpen={...} data-testid="climate-card">` with `<CardHead Icon={Thermometer} label="Clima" tone="#5eafff" right={<modeText />}>`.
    - Mode text in right slot: 11px, 600, `letterSpacing: 0.3`, `tabular-nums`, color `var(--text-2)`, rendered uppercase (e.g. `AUTO`, `MANUALE`, `OFF`).
    - Body: up to 4 zones rendered as rows: `<StatusDot on={heating} color="#5eafff" />` + 11px medium white name + 11px tabular-nums temp `{temperature.toFixed(1)}°`.
    - **Room name resolution (D-16)**: `z.name ?? topology?.rooms?.find(r => r.id === z.room_id)?.name ?? z.room_id`. RoomStatus is NOT guaranteed to carry `name`; the canonical source is `topology.rooms`. Fallback to `room_id` is acceptable but non-ideal.
    - Footer: `{activeCount} di {totalCount} attive` (12px var(--text-2), marginTop 8).
    - Adjacent Sheet: `<Sheet title="Clima">` with `<SheetPlaceholderBody phase="178" device="thermostat" />`.
    - No useMemo/useCallback.
  </behavior>
  <action>
1. Create `app/components/EmberGlass/cards/ClimateCard.tsx`:
```tsx
'use client';
/** ClimateCard — Phase 177 (DASH-03). Bundle source: cards.jsx:138-164. */

import { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';

const TONE = '#5eafff';

export default function ClimateCard() {
  const [open, setOpen] = useState(false);
  const { status, topology } = useThermostatData();
  const allRooms = status?.rooms ?? [];
  const zones = allRooms.slice(0, 4);
  const activeCount = allRooms.filter((r) => r.heating).length;
  const totalCount = allRooms.length;
  const mode = (status?.mode ?? '').toUpperCase();

  // D-16: canonical room-name resolution — RoomStatus may not carry `name`.
  // Fall through: z.name → topology.rooms[id].name → z.room_id (last-resort fallback).
  const resolveRoomName = (z: { room_id: string; name?: string }): string =>
    z.name ?? topology?.rooms?.find((r) => r.id === z.room_id)?.name ?? z.room_id;

  const right = (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
      letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums',
    }}>
      {mode}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="climate-card">
        <CardHead Icon={Thermometer} label="Clima" tone={TONE} right={right} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
          {zones.map((z) => (
            <div key={z.room_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusDot on={Boolean(z.heating)} color={TONE} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#fff' }}>
                {resolveRoomName(z)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                {(z.temperature ?? 0).toFixed(1)}°
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
          {activeCount} di {totalCount} attive
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Clima">
        <SheetPlaceholderBody phase="178" device="thermostat" />
      </Sheet>
    </>
  );
}
```

**Field-name verification:** Before coding, read `app/components/devices/thermostat/hooks/useThermostatData.ts` and confirm: (a) hook return shape — does it expose `topology` alongside `status`? If not, adjust the destructure (e.g. `{ status, topology }` may be `{ status }` only, in which case the `topology?.rooms?.find(...)` step short-circuits and we fall back to `room_id`). (b) `RoomStatus` field names. Bundle's mock data is NOT authoritative.

2. Create `app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx` with TWO fixture variants:

**Fixture A — name-on-RoomStatus path (z.name present):**
   - Mock `useThermostatData` returning `{ status: { rooms: [{ room_id: 'r1', name: 'Salotto', temperature: 21.3, heating: true }, { room_id: 'r2', name: 'Cucina', temperature: 19.8, heating: false }], mode: 'auto' }, topology: { rooms: [] } }`.
   - Test: renders `Salotto` and `Cucina` rows, `21.3°` and `19.8°` temps.
   - Test: footer shows `1 di 2 attive`.
   - Test: right slot shows `AUTO` (uppercase via A-05).
   - Test: clicking card opens sheet with `Controlli in arrivo` placeholder.

**Fixture B — name-via-topology path (z.name absent, topology has it):**
   - Mock `useThermostatData` returning `{ status: { rooms: [{ room_id: 'r1', temperature: 22.0, heating: true }], mode: 'manual' }, topology: { rooms: [{ id: 'r1', name: 'Camera' }] } }`.
   - Test: renders `Camera` (resolved via topology lookup), NOT `r1`.

**Fixture C — fallback-to-room_id path (no name anywhere):**
   - Mock `useThermostatData` returning `{ status: { rooms: [{ room_id: 'r1', temperature: 22.0, heating: false }], mode: 'off' }, topology: { rooms: [] } }`.
   - Test: renders `r1` as the row label (non-fatal fallback — assert it does not crash).

   - Test: when `rooms.length === 0`, footer shows `0 di 0 attive` and no sheet body visible until click.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/ClimateCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/ClimateCard.tsx`
    - `grep -q "data-testid=\"climate-card\"" app/components/EmberGlass/cards/ClimateCard.tsx`
    - `grep -q '#5eafff' app/components/EmberGlass/cards/ClimateCard.tsx`
    - `grep -q 'label=\"Clima\"' app/components/EmberGlass/cards/ClimateCard.tsx`
    - `grep -q "di .*attive" app/components/EmberGlass/cards/ClimateCard.tsx`
    - `grep -q "toUpperCase" app/components/EmberGlass/cards/ClimateCard.tsx` (A-05)
    - `grep -q ".slice(0, 4)" app/components/EmberGlass/cards/ClimateCard.tsx` (≤4 zones constraint)
    - **D-16 topology lookup present**: `grep -q "topology" app/components/EmberGlass/cards/ClimateCard.tsx` AND `grep -q "find" app/components/EmberGlass/cards/ClimateCard.tsx`
    - `grep -v '^//' app/components/EmberGlass/cards/ClimateCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/ClimateCard\.test'` exits 0 (3 fixture variants pass: name-on-room, topology-resolved, room_id-fallback)
  </acceptance_criteria>
  <done>
    ClimateCard ships with ≤4 zones, uppercase mode, Italian footer, D-16 topology-fallback room-name resolution, Sheet wiring, all jest tests green (3 fixture variants + footer + click).
  </done>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-03 | Information disclosure | StoveCard / ClimateCard | accept | Reuses existing hooks (useStoveData, useThermostatData) with established auth gates and proxy auth (X-API-Key). No new data exposure. |
</threat_model>

<verification>
- Both card files exist
- All jest tests green under `npm run test:components` (StoveCard 3 tests including no-°C; ClimateCard 3 fixture variants + footer + click)
- `npx tsc --noEmit` exits 0
- No useMemo/useCallback introductions
- A-01 deviation (no °C on stove value) documented in plan summary and asserted in test (a)
</verification>

<success_criteria>
- DASH-02 satisfied (StoveCard rendered with FlameViz + Fiamma/Ventola subtitle, no °C unit per A-01)
- DASH-03 satisfied (ClimateCard rendered with ≤4 zones + N/M attive footer + D-16 room-name resolution)
- DASH-11 partial (tap → sheet opens with placeholder body for stove + climate)
- DASH-12 unchanged (no RC opt-outs)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-03-SUMMARY.md` documenting:
- field-name confirmations from each hook
- jest pass output (StoveCard + ClimateCard)
- **A-01 acceptance**: "Stove value rendered as power_level integer 1..5, no unit superscript (deviation from bundle's stylistic °C, since no ambient temperature exists for the stove)" — confirm test (a) asserts no °C in DOM
- **D-16 acceptance**: confirm ClimateCard's topology-lookup path was exercised by Fixture B
- diff against legacy `app/components/devices/stove/StoveCard.tsx` confirming useStoveData call signature parity
</output>
