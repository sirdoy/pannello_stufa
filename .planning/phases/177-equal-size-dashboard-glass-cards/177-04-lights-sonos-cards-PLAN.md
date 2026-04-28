---
phase: 177
plan: 04
type: execute
wave: 2
depends_on: ['177-01', '177-02']
files_modified:
  - app/components/EmberGlass/cards/LightsCard.tsx
  - app/components/EmberGlass/cards/SonosCard.tsx
  - app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
  - app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx
autonomous: true
requirements: [DASH-04, DASH-05, DASH-11, DASH-12]
tags: [ember-glass, dashboard-cards, lights, sonos]
must_haves:
  truths:
    - "LightsCard renders ≤4 on-light names with status dots, +altre N overflow, and 'Spente / N disponibili' empty state"
    - "LightsCard header InlineToggle calls handleAllLightsToggle and stops propagation"
    - "SonosCard renders ≤4 groups with PlayingBars when playing or dim dot when paused"
    - "Tapping LightsCard or SonosCard opens a Sheet with placeholder body"
  artifacts:
    - path: app/components/EmberGlass/cards/LightsCard.tsx
      provides: "Dashboard LightsCard summary surface"
    - path: app/components/EmberGlass/cards/SonosCard.tsx
      provides: "Dashboard SonosCard summary surface"
  key_links:
    - from: app/components/EmberGlass/cards/LightsCard.tsx
      to: app/components/devices/lights/hooks/useLightsCommands
      via: "handleAllLightsToggle"
      pattern: "handleAllLightsToggle"
    - from: app/components/EmberGlass/cards/SonosCard.tsx
      to: app/components/EmberGlass/PlayingBars.tsx
      via: "import PlayingBars"
      pattern: "PlayingBars"
---

<objective>
Ship the LightsCard (DASH-04) and SonosCard (DASH-05) — the multi-item list-class summary tiles. LightsCard owns the ONE inline control on a Phase 177 dashboard card: a master `<InlineToggle>` in the header that calls `handleAllLightsToggle` with `e.stopPropagation()` so it does not also open the sheet (D-17).

Purpose: Lands the list-shape pattern (≤4 items + overflow + footer) that TuyaCard/DirigeraCard reuse.
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
@app/components/devices/lights/hooks/useLightsData.ts
@app/components/devices/lights/hooks/useLightsCommands.ts
@app/components/devices/lights/LightsCard.tsx
@app/components/devices/sonos/hooks/useSonosFullData.ts

<interfaces>
<!-- useLightsData (existing, unchanged) -->
returns `{ lights: Array<{ id, name, on, ... }>, lightsOnCount, allHouseLightsOn, allHouseLightsOff, ... }` — verify exact shape

<!-- useLightsCommands (existing, unchanged) -->
exports `handleAllLightsToggle(targetState: boolean)` — fire-and-forget; backend updates push back via WS/poll

<!-- useSonosFullData (existing, unchanged) -->
returns `{ data: { zones: ZoneInfo[], playback: Record<groupId, PlaybackState> } }` where ZoneInfo has `group_id`, `coordinator: { name }` and PlaybackState has `state` ('PLAYING'|'PAUSED_PLAYBACK'|...) + `current_track: { title }`
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build LightsCard with InlineToggle header + list/empty states + jest test</name>
  <files>
    app/components/EmberGlass/cards/LightsCard.tsx
    app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: LightsCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (LightsCard section)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 166-218)
    - app/components/devices/lights/hooks/useLightsData.ts (full file — confirm `lights[]` shape)
    - app/components/devices/lights/hooks/useLightsCommands.ts (full file — confirm `handleAllLightsToggle` signature AND the hook arg shape `{ lightsData, router }` or whatever the actual call signature is)
    - app/components/devices/lights/LightsCard.tsx (legacy big card — match orchestrator hook-coupling pattern; diff your useLightsData / useLightsCommands call signatures against this file before coding)
  </read_first>
  <behavior>
    - LightsCard renders `<GlassCard tone="#f5c84a" onOpen={...} data-testid="lights-card">` with `<CardHead Icon={Lightbulb} label="Luci" tone="#f5c84a" right={<InlineToggle data-testid="lights-toggle" />}>`.
    - InlineToggle `onChange` MUST call `e.stopPropagation()` BEFORE invoking `cmds.handleAllLightsToggle(!anyOn)` (D-17).
    - When `anyOn` (at least one light on): body shows up to 4 on-light name rows (status dot color `#f5c84a` + 11px medium white name). If `onLights.length > 4`, append a `+ altre {N}` overflow row (10px var(--text-2)). Footer: `{onLights.length} di {totalLights} accese` (12px var(--text-2), marginTop 8).
    - When no lights on: `<GlassCard>` body shows a 28px display `Spente` (var(--font-display), var(--text-2)) + subtitle `{totalLights} disponibili` (12px var(--text-2)).
    - Adjacent `<Sheet title="Luci">` with `<SheetPlaceholderBody phase="178" device="lights" />`.
    - Clicking the card body (NOT the header toggle) opens the Sheet.
    - Clicking the InlineToggle does NOT open the Sheet (because of stopPropagation).
    - No useMemo/useCallback.
  </behavior>
  <action>
1. Read the existing hooks to confirm shapes:
   - `app/components/devices/lights/hooks/useLightsData.ts` — confirm `lights: Array<{ id, name, on }>` (or whatever exact name).
   - `app/components/devices/lights/hooks/useLightsCommands.ts` — confirm `handleAllLightsToggle` signature AND the argument shape `useLightsCommands({ lightsData, router })`.
   - `app/components/devices/lights/LightsCard.tsx` (legacy) — diff your call signatures against this file. Match it.

2. Create `app/components/EmberGlass/cards/LightsCard.tsx`:
```tsx
'use client';
/** LightsCard — Phase 177 (DASH-04). Bundle source: cards.jsx:166-218. */

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { InlineToggle } from '../InlineToggle';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';

const TONE = '#f5c84a';

export default function LightsCard() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const lightsData = useLightsData();
  const cmds = useLightsCommands({ lightsData, router });

  const allLights = lightsData.lights ?? [];
  const onLights = allLights.filter((l) => l.on);
  const anyOn = onLights.length > 0;
  const totalLights = allLights.length;

  const right = (
    <InlineToggle
      on={anyOn}
      color={TONE}
      onChange={(e) => {
        e.stopPropagation(); // D-17 — prevent parent Pressable click
        void cmds.handleAllLightsToggle(!anyOn);
      }}
    />
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="lights-card">
        <CardHead Icon={Lightbulb} label="Luci" tone={TONE} right={right} />
        {anyOn ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
              {onLights.slice(0, 4).map((l) => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot on color={TONE} />
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#fff' }}>{l.name}</div>
                </div>
              ))}
              {onLights.length > 4 && (
                <div style={{ fontSize: 10, color: 'var(--text-2)' }}>+ altre {onLights.length - 4}</div>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
              {onLights.length} di {totalLights} accese
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text-2)' }}>Spente</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>{totalLights} disponibili</div>
          </div>
        )}
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Luci">
        <SheetPlaceholderBody phase="178" device="lights" />
      </Sheet>
    </>
  );
}
```

If `useLightsCommands` does NOT accept `{ lightsData, router }` as args, adjust the call to match its actual signature (read the hook file and the legacy LightsCard for the canonical pattern). If `lightsData.lights` field is named differently (e.g. `lightsData.list`), adjust accordingly.

3. Create `app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx`:

**Most-realistic mock fixture** — at least one light on (this is the steady-state for a home with smart bulbs at 8pm):
   - Mock `useLightsData` returning `{ lights: [{ id: '1', name: 'Cucina', on: true }, { id: '2', name: 'Salotto', on: false }] }`.
   - Mock `useLightsCommands` returning `{ handleAllLightsToggle: jest.fn() }` and capture the mock.
   - Mock `next/navigation` `useRouter` returning `{}`.
   - Test (a): when at least one light on, renders `Cucina` row and footer `1 di 2 accese`.
   - Test (b): when zero lights on (override mock to all off `[{id:'1',name:'Cucina',on:false},{id:'2',name:'Salotto',on:false}]`), renders `Spente` and `2 disponibili`.
   - Test (c): **(true→false flip — `anyOn=true` so master toggle turns everything OFF)** — clicking the lights toggle calls `handleAllLightsToggle(false)` and does NOT open the sheet (`queryByText(/Controlli in arrivo/)` stays null after toggle click). Use `fireEvent.click(getByTestId('lights-toggle'))`.
   - Test (d): clicking the card body opens the sheet.
   - Test (e): when 6 lights are on (override mock with 6 on-lights), renders `+ altre 2` overflow row and footer `6 di N accese`.
   - Optional Test (f): with all-off fixture, clicking toggle calls `handleAllLightsToggle(true)` (false→true flip — turn everything ON).
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/LightsCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q "data-testid=\"lights-card\"" app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q "InlineToggle" app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q "e.stopPropagation()" app/components/EmberGlass/cards/LightsCard.tsx` (D-17)
    - `grep -q "handleAllLightsToggle" app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q "'Spente'" app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q "'+ altre '" app/components/EmberGlass/cards/LightsCard.tsx` OR `grep -q "altre" app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q "di .*accese" app/components/EmberGlass/cards/LightsCard.tsx`
    - `grep -q '#f5c84a' app/components/EmberGlass/cards/LightsCard.tsx`
    - useLightsData and useLightsCommands call signatures match the legacy orchestrator (verified via diff against `app/components/devices/lights/LightsCard.tsx`)
    - Test (c) asserts `handleAllLightsToggle(false)` (true→false flip — fixture has at least one light on, toggle turns everything off)
    - `grep -v '^//' app/components/EmberGlass/cards/LightsCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/LightsCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    LightsCard ships with master toggle + stopPropagation + ≤4 list + overflow + empty state + sheet wiring; all jest tests green including the true→false flip assertion against `handleAllLightsToggle(false)`.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build SonosCard with PlayingBars rows + jest test</name>
  <files>
    app/components/EmberGlass/cards/SonosCard.tsx
    app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: SonosCard")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (SonosCard section)
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 220-270)
    - app/components/devices/sonos/hooks/useSonosFullData.ts (full file — confirm `data.zones[]` and `data.playback` shapes)
    - app/components/EmberGlass/cards/StoveCard.tsx (sibling pattern)
  </read_first>
  <behavior>
    - SonosCard renders `<GlassCard tone="#b080ff" onOpen={...} data-testid="sonos-card">` with `<CardHead Icon={Music} label="Sonos" tone="#b080ff" right={<rightText />}>`.
    - Right slot text: when `playingCount >= 1` → `{playingCount} in riprod.`; else `In pausa`. Style: 11px, 600, var(--text-2), letterSpacing 0.3.
    - Body: up to 4 group rows. Playing rows: `<PlayingBars />` + group name (white, 11px medium) + 2nd line track title (10px var(--text-2)). Paused rows: 6x6 dim dot (`background: rgba(255,255,255,0.18)`, no glow) + group name (11px var(--text-2)).
    - When `groups.length === 0`: empty state — body shows nothing inside the flex; right slot shows `In pausa`.
    - Adjacent `<Sheet title="Sonos">` with `<SheetPlaceholderBody phase="178" device="sonos" />`.
    - No useMemo/useCallback. Stable keys via `z.group_id`.
  </behavior>
  <action>
1. Read `app/components/devices/sonos/hooks/useSonosFullData.ts` to confirm zone and playback shapes. PATTERNS.md gives:
```ts
const groups = (data?.zones ?? []).map((z) => {
  const pb = data?.playback[z.group_id];
  return {
    name: z.coordinator?.name ?? z.group_id,
    playing: pb?.state === 'PLAYING',
    track: pb?.current_track?.title ?? '',
    group_id: z.group_id,
  };
});
```

2. Create `app/components/EmberGlass/cards/SonosCard.tsx`:
```tsx
'use client';
/** SonosCard — Phase 177 (DASH-05). Bundle source: cards.jsx:220-270. */

import { useState } from 'react';
import { Music } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { PlayingBars } from '../PlayingBars';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';

const TONE = '#b080ff';

export default function SonosCard() {
  const [open, setOpen] = useState(false);
  const { data } = useSonosFullData();
  const allZones = data?.zones ?? [];
  const groups = allZones.map((z) => {
    const pb = data?.playback?.[z.group_id];
    return {
      group_id: z.group_id,
      name: z.coordinator?.name ?? z.group_id,
      playing: pb?.state === 'PLAYING',
      track: pb?.current_track?.title ?? '',
    };
  });
  const visible = groups.slice(0, 4);
  const playingCount = groups.filter((g) => g.playing).length;

  const right = (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.3 }}>
      {playingCount >= 1 ? `${playingCount} in riprod.` : 'In pausa'}
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="sonos-card">
        <CardHead Icon={Music} label="Sonos" tone={TONE} right={right} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
          {visible.map((g) => (
            <div key={g.group_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              {g.playing ? (
                <PlayingBars />
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.18)', marginTop: 3 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: g.playing ? '#fff' : 'var(--text-2)' }}>{g.name}</div>
                {g.playing && g.track && (
                  <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 1 }}>{g.track}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Sonos">
        <SheetPlaceholderBody phase="178" device="sonos" />
      </Sheet>
    </>
  );
}
```

3. Create `app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx`:
   - Mock `useSonosFullData` returning `{ data: { zones: [{ group_id: 'g1', coordinator: { name: 'Salotto' } }, { group_id: 'g2', coordinator: { name: 'Cucina' } }], playback: { g1: { state: 'PLAYING', current_track: { title: 'Imagine' } }, g2: { state: 'PAUSED_PLAYBACK', current_track: null } } } }`.
   - Test (a): renders `Salotto` and `Cucina` group names.
   - Test (b): when one group playing, right slot shows `1 in riprod.`.
   - Test (c): when none playing, right slot shows `In pausa`.
   - Test (d): playing row renders `<PlayingBars data-testid="playing-bars">` and the track title `Imagine`; paused row does NOT render PlayingBars.
   - Test (e): clicking card opens sheet with placeholder body.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='cards/__tests__/SonosCard\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q "data-testid=\"sonos-card\"" app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q "PlayingBars" app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q "in riprod" app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q "'In pausa'" app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q '#b080ff' app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q ".slice(0, 4)" app/components/EmberGlass/cards/SonosCard.tsx`
    - `grep -q "key={g.group_id}" app/components/EmberGlass/cards/SonosCard.tsx` (stable key)
    - `grep -v '^//' app/components/EmberGlass/cards/SonosCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='cards/__tests__/SonosCard\.test'` exits 0
  </acceptance_criteria>
  <done>
    SonosCard ships with PlayingBars-driven rows, Italian count copy, dim-dot paused state, sheet wiring; all jest tests green.
  </done>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-04 | Tampering | LightsCard handleAllLightsToggle | accept | Reuses existing `useLightsCommands.handleAllLightsToggle` with established X-API-Key auth via shared HA proxy client. No new attack surface. |
</threat_model>

<verification>
- Both card files exist
- All ~10 jest tests green under `npm run test:components`
- `npx tsc --noEmit` exits 0
- Stop-propagation verified in LightsCard
- LightsCard test (c) asserts `handleAllLightsToggle(false)` against the realistic anyOn=true fixture
</verification>

<success_criteria>
- DASH-04 satisfied (LightsCard with header toggle + ≤4 + overflow + empty state)
- DASH-05 satisfied (SonosCard with PlayingBars + Italian count copy)
- DASH-11 partial (sheet opens for both cards, header toggle does NOT open sheet)
- DASH-12 unchanged (no RC opt-outs)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-04-SUMMARY.md` documenting hook-shape confirmations (diff vs legacy `app/components/devices/lights/LightsCard.tsx`), jest pass output, and stopPropagation verification.
</output>
