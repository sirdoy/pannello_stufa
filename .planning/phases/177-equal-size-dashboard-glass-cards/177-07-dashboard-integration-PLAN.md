---
phase: 177
plan: 07
type: execute
wave: 3
depends_on: ['177-01', '177-02', '177-03', '177-04', '177-05', '177-06']
files_modified:
  - app/components/DashboardCards.tsx
  - app/components/EmberGlass/index.ts
  - lib/services/unifiedDeviceConfigService.ts
  - app/components/__tests__/DashboardCards.test.tsx
autonomous: true
requirements: [DASH-01, DASH-05, DASH-11, DASH-12]
tags: [ember-glass, dashboard, integration]
must_haves:
  truths:
    - "DashboardCards.tsx renders a single 2-col grid (max-w-md sm:max-w-2xl) replacing the masonry layout"
    - "Each card slot is wrapped in an animate-spring-in stagger div with animationDelay flatIndex * 100ms"
    - "Suspense fallback uses the shared GlassCardSkeleton (replacing per-device skeletons)"
    - "EmberGlass/index.ts barrel exports all 7 primitives + GlassCardSkeleton + 9 cards + SheetPlaceholderBody"
    - "hasHomepageCard('sonos') returns true (A-03 / LANDMINE #1 fix)"
  artifacts:
    - path: app/components/DashboardCards.tsx
      provides: "Server component rendering the new 2-col grid"
    - path: app/components/EmberGlass/index.ts
      provides: "Barrel exports for downstream phases"
    - path: lib/services/unifiedDeviceConfigService.ts
      provides: "Sonos enabled on dashboard (A-03)"
  key_links:
    - from: app/components/DashboardCards.tsx
      to: app/components/EmberGlass/cards/StoveCard
      via: "import StoveCard from './EmberGlass/cards/StoveCard'"
      pattern: "EmberGlass/cards/StoveCard"
    - from: app/components/DashboardCards.tsx
      to: app/components/EmberGlass/GlassCardSkeleton
      via: "import { GlassCardSkeleton }"
      pattern: "GlassCardSkeleton"
---

<objective>
Wire all 9 new cards into `DashboardCards.tsx`, replacing the v8.1 masonry layout with the 2-column grid (DASH-01). Update the barrel export and flip the Sonos visibility gate (A-03 / LANDMINE #1). Update the existing `DashboardCards.test.tsx` to assert grid shape instead of masonry.

Purpose: Cuts the dashboard over to the new equal-size 1:1 glass-card grid. After this plan ships, `/` renders the 9 EmberGlass cards in a single grid; the legacy masonry pathway is dead.
Output: 1 modified server component + 1 modified barrel + 1 modified config service + 1 updated jest spec.
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
@.planning/phases/177-03-SUMMARY.md
@.planning/phases/177-04-SUMMARY.md
@.planning/phases/177-05-SUMMARY.md
@.planning/phases/177-06-SUMMARY.md
@CLAUDE.md
@app/components/DashboardCards.tsx
@app/components/EmberGlass/index.ts
@lib/services/unifiedDeviceConfigService.ts

<interfaces>
<!-- Existing DashboardCards.tsx server-side composition (preserve verbatim, lines 77-94) -->
- `auth0.getSession()` → redirect /auth/login if missing
- `getUnifiedDeviceConfigAdmin(userId)` → Firebase RTDB
- `getVisibleDashboardCards(deviceConfig)` → ordered list

<!-- Existing barrel (current 11 lines, preserve all existing exports) -->
@app/components/EmberGlass/index.ts:
- Pressable / usePressed / PressableProps / PointerHandlers
- Sheet / SheetProps
- AmbientBg
- FlameViz / FlameVizProps
- Splash / SplashProps
- SplashGate / SplashGateProps
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Rewrite DashboardCards.tsx with 2-col grid + GlassCardSkeleton fallback + flip Sonos gate + extend barrel</name>
  <files>
    app/components/DashboardCards.tsx
    app/components/EmberGlass/index.ts
    lib/services/unifiedDeviceConfigService.ts
  </files>
  <read_first>
    - app/components/DashboardCards.tsx (full file — current file, 151 lines, replace render block + skeleton registry)
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (sections "Modified: app/components/DashboardCards.tsx", "Modified: EmberGlass/index.ts", "Modified: lib/services/unifiedDeviceConfigService.ts")
    - app/components/EmberGlass/index.ts (current barrel — preserve existing exports)
    - lib/services/unifiedDeviceConfigService.ts (lines 65-72 — `hasHomepageCard` function)
    - app/components/ErrorBoundary.tsx OR wherever DeviceCardErrorBoundary lives (verify import path)
  </read_first>
  <behavior>
    - DashboardCards.tsx still: (a) async SC, (b) calls `auth0.getSession()` and redirects on null, (c) calls `getUnifiedDeviceConfigAdmin(userId)`, (d) calls `getVisibleDashboardCards(deviceConfig)`, (e) renders `<EmptyState>` when `visibleCards.length === 0`.
    - Replaces the existing CARD_COMPONENTS map (was importing from `./devices/...`) with imports from `./EmberGlass/cards/{Stove,Climate,Lights,Sonos,Weather,Camera,Network,Raspi,Tuya,Dirigera}Card`.
    - Renders a single grid: `<div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">`. Both mobile and desktop dual-render blocks (the previous `flex-col` mobile block and `hidden sm:flex` desktop block) are deleted.
    - Each card slot wrapped in `<div className="animate-spring-in transition-all duration-300 ease-out" style={{ animationDelay: `${flatIndex * 100}ms` }}>` (DASH-12).
    - Suspense fallback is the shared `<GlassCardSkeleton />` (replacing per-device skeletons). The legacy `CARD_SKELETONS` map is deleted.
    - DeviceCardErrorBoundary still wraps each card (preserved). DEVICE_META still drives its `deviceName`/`deviceIcon` props.
    - `splitIntoColumns` import + call removed; the file becomes orphan utility (deletion deferred to v20.0 cleanup phase).
    - Barrel `index.ts` extends with: GlassCard / GlassCardProps, CardHead, StatusDot, MiniStat, PlayingBars, InlineToggle, GlassCardSkeleton, SheetPlaceholderBody, and default exports of all 9 cards as named re-exports (`export { default as StoveCard } from './cards/StoveCard';` etc.).
    - `unifiedDeviceConfigService.ts` `hasHomepageCard` function returns `true` for `'sonos'` (currently filters it OFF). The simplest fix per PATTERNS A-03: change the body to `return true;` (every device with a registered card is dashboard-eligible). Read the function body carefully — if there are exclusions for non-DASH-eligible devices we don't want shown, narrow the change to delete only the `sonos` exclusion.
    - No useMemo/useCallback introduced.
  </behavior>
  <action>
1. **Read** the current `DashboardCards.tsx` (151 lines) and `lib/services/unifiedDeviceConfigService.ts` (around line 69 — `hasHomepageCard`).

2. **Rewrite `app/components/DashboardCards.tsx`**:
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
import { DeviceCardErrorBoundary } from './ErrorBoundary'; // adjust path if different in current file

const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ClimateCard,
  weather: WeatherCard,
  lights: LightsCard,
  camera: CameraCard,
  network: NetworkCard,
  raspi: RaspiCard,
  sonos: SonosCard,
  dirigera: DirigeraCard,
  tuya: TuyaCard,
};

const DEVICE_META: Record<string, { name: string; icon: string }> = {
  stove: { name: 'Stufa', icon: '🔥' },
  thermostat: { name: 'Clima', icon: '🌡️' },
  weather: { name: 'Meteo', icon: '☀️' },
  lights: { name: 'Luci', icon: '💡' },
  camera: { name: 'Camera', icon: '🎥' },
  network: { name: 'Rete', icon: '📶' },
  raspi: { name: 'Raspberry', icon: '🥧' },
  sonos: { name: 'Sonos', icon: '🎵' },
  dirigera: { name: 'IKEA', icon: '🔌' },
  tuya: { name: 'Prese smart', icon: '🔌' },
};

export default async function DashboardCards() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) redirect('/auth/login');
  const deviceConfig = await getUnifiedDeviceConfigAdmin(session.user.sub);
  const visibleCards = getVisibleDashboardCards(deviceConfig);

  if (visibleCards.length === 0) {
    return (
      <EmptyState
        icon="🏠"
        title="Nessun dispositivo configurato"
        description="Aggiungi i tuoi dispositivi per iniziare"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
      {visibleCards.map((card, flatIndex) => {
        const CardComponent = CARD_COMPONENTS[card.id];
        if (!CardComponent) return null;
        const meta = DEVICE_META[card.id] ?? { name: card.id, icon: '⚠️' };
        return (
          <div
            key={card.id}
            className="animate-spring-in transition-all duration-300 ease-out"
            style={{ animationDelay: `${flatIndex * 100}ms` }}
          >
            <DeviceCardErrorBoundary deviceName={meta.name} deviceIcon={meta.icon}>
              <Suspense fallback={<GlassCardSkeleton />}>
                <CardComponent />
              </Suspense>
            </DeviceCardErrorBoundary>
          </div>
        );
      })}
    </div>
  );
}
```
**Important adjustments:**
- If the existing file imports DEVICE_META / DeviceCardErrorBoundary from a different path, preserve those exact paths.
- If any existing import path differs from above (e.g. `EmptyState` lives at `./ui/EmptyState`), keep the existing path.
- If `card.id` keys in the unified-config differ from those in `CARD_COMPONENTS`, mirror the EXISTING mapping from the current file (don't invent new keys).

3. **Extend `app/components/EmberGlass/index.ts`** — append (do NOT delete existing exports):
```ts
export { GlassCard } from './GlassCard';
export type { GlassCardProps } from './GlassCard';
export { CardHead } from './CardHead';
export { StatusDot } from './StatusDot';
export { MiniStat } from './MiniStat';
export { PlayingBars } from './PlayingBars';
export { InlineToggle } from './InlineToggle';
export { GlassCardSkeleton } from './GlassCardSkeleton';
export { default as StoveCard } from './cards/StoveCard';
export { default as ClimateCard } from './cards/ClimateCard';
export { default as LightsCard } from './cards/LightsCard';
export { default as SonosCard } from './cards/SonosCard';
export { default as WeatherCard } from './cards/WeatherCard';
export { default as CameraCard } from './cards/CameraCard';
export { default as NetworkCard } from './cards/NetworkCard';
export { default as RaspiCard } from './cards/RaspiCard';
export { default as TuyaCard } from './cards/TuyaCard';
export { default as DirigeraCard } from './cards/DirigeraCard';
export { SheetPlaceholderBody } from './cards/SheetPlaceholderBody';
```

4. **Patch `lib/services/unifiedDeviceConfigService.ts`** at the `hasHomepageCard` function (around line 69):
   - Read the current function body.
   - If it currently is a switch/match that excludes specific device IDs, remove the `'sonos'` exclusion only.
   - If it can safely become `return true;` for every device (per PATTERNS.md A-03 recommendation), do that. Confirm by reading the surrounding callers in `getVisibleDashboardCards` and `getAllDevicesForSettings` — they ALSO use the visibility filter, so the broader change is safe.
   - Add a single-line comment above the change: `// Phase 177 (A-03 / LANDMINE #1): Sonos enabled on dashboard.`
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `grep -q "EmberGlass/cards/StoveCard" app/components/DashboardCards.tsx`
    - `grep -q "grid-cols-2" app/components/DashboardCards.tsx`
    - `grep -q "max-w-md sm:max-w-2xl" app/components/DashboardCards.tsx`
    - `grep -q "GlassCardSkeleton" app/components/DashboardCards.tsx`
    - `grep -q "animate-spring-in" app/components/DashboardCards.tsx`
    - `grep -q "animationDelay" app/components/DashboardCards.tsx`
    - `grep -c "splitIntoColumns" app/components/DashboardCards.tsx` returns `0` (orphaned utility removed from import)
    - `grep -c "CARD_SKELETONS" app/components/DashboardCards.tsx` returns `0` (legacy registry removed)
    - `grep -c "flex-col gap-6 sm:hidden" app/components/DashboardCards.tsx` returns `0` (legacy masonry block deleted)
    - `grep -c "EmberGlass/cards/" app/components/EmberGlass/index.ts` returns at least `9` (≥9 card re-exports)
    - `grep -q "GlassCardSkeleton" app/components/EmberGlass/index.ts`
    - `grep -q "SheetPlaceholderBody" app/components/EmberGlass/index.ts`
    - `grep -q "Phase 177" lib/services/unifiedDeviceConfigService.ts`
    - Verify Sonos enabled: `grep -A5 "function hasHomepageCard" lib/services/unifiedDeviceConfigService.ts | grep -v "'sonos'.*false\|sonos.*=>.*false"` (no false-mapping for sonos)
    - `grep -v '^//' app/components/DashboardCards.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>
    DashboardCards.tsx renders the 9 EmberGlass cards in a single 2-col grid with stagger; barrel exports the new symbols; Sonos enabled; tsc clean.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update DashboardCards.test.tsx to assert grid shape (replaces masonry assertions)</name>
  <files>
    app/components/__tests__/DashboardCards.test.tsx
  </files>
  <read_first>
    - app/components/__tests__/DashboardCards.test.tsx (full file — current jest spec; identify masonry-specific assertions and per-device skeleton mocks)
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Modified: app/components/__tests__/DashboardCards.test.tsx")
    - app/components/DashboardCards.tsx (rewritten in Task 1 — match new structure)
  </read_first>
  <behavior>
    - The existing jest spec (which mocks `next/navigation`, `@/lib/auth0`, `@/lib/services/unifiedDeviceConfigService`, etc.) continues to assert: (a) redirect when session missing, (b) device-config fetch invocation, (c) card rendering for visible devices, (d) EmptyState when zero visible cards.
    - REMOVED assertions: any test asserting two columns / masonry left-right split / `splitIntoColumns` invocation.
    - REMOVED mock: `jest.mock('@/lib/utils/dashboardColumns')` (no longer imported).
    - REMOVED mock entries: per-device `Skeleton.*` mocks (replaced by `GlassCardSkeleton`).
    - UPDATED card mocks: change `jest.mock('@/app/components/devices/...Card')` to `jest.mock('@/app/components/EmberGlass/cards/...Card')`.
    - ADDED assertion: rendered DOM contains a `.grid.grid-cols-2` element parent of all card wrappers.
    - All other tests preserved.
  </behavior>
  <action>
1. Read the current `app/components/__tests__/DashboardCards.test.tsx` carefully — identify:
   - Mocks that need updating (per-device card paths → EmberGlass paths)
   - Mocks to delete (`dashboardColumns`, per-device `Skeleton.*`)
   - Assertions to delete (anything referencing left/right column / masonry / `splitIntoColumns`)
   - Auth0 + redirect tests → keep verbatim
   - EmptyState test → keep verbatim
   - Device-config-fetch test → keep verbatim

2. Update mocks. For example, replace:
```ts
jest.mock('@/app/components/devices/stove/StoveCard', () => ({ default: () => <div data-testid="stove-card">stove</div> }));
```
with:
```ts
jest.mock('@/app/components/EmberGlass/cards/StoveCard', () => ({ __esModule: true, default: () => <div data-testid="stove-card">stove</div> }));
```
Repeat for all 9 EmberGlass cards (`ClimateCard`, `LightsCard`, `SonosCard`, `WeatherCard`, `CameraCard`, `NetworkCard`, `RaspiCard`, `TuyaCard`, `DirigeraCard`).

Mock `GlassCardSkeleton`:
```ts
jest.mock('@/app/components/EmberGlass/GlassCardSkeleton', () => ({ GlassCardSkeleton: () => <div data-testid="glass-card-skeleton" /> }));
```

Delete:
```ts
jest.mock('@/lib/utils/dashboardColumns', ...); // delete entire block
```
And any `Skeleton.StovePanel`/`Skeleton.LightsCard`/etc. mock entries.

3. Add a new test (or extend an existing render test):
```ts
test('renders cards inside a single 2-col grid (DASH-01)', async () => {
  // Mock auth, config service to return a non-empty visible cards list
  // Render the awaited component (use the existing async-render pattern in this file)
  const result = await DashboardCards();
  const { container } = render(result);
  const grid = container.querySelector('.grid.grid-cols-2');
  expect(grid).not.toBeNull();
  // Confirm cards live inside the grid wrapper
  expect(grid?.children.length).toBeGreaterThan(0);
});
```
**Use the file's existing async-component testing helper.** Different jest setups handle async server components differently; do NOT rewrite the helper, just match the existing pattern in the same file.

4. Delete any test or assertion that explicitly references the old masonry split (`splitIntoColumns` invocation, two-column flexbox, `flex-col gap-6 sm:hidden`).
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='__tests__/DashboardCards\.test'</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "splitIntoColumns" app/components/__tests__/DashboardCards.test.tsx` returns `0`
    - `grep -c "Skeleton\.StovePanel\|Skeleton\.LightsCard" app/components/__tests__/DashboardCards.test.tsx` returns `0`
    - `grep -c "EmberGlass/cards/" app/components/__tests__/DashboardCards.test.tsx` returns at least `9`
    - `grep -q "grid-cols-2" app/components/__tests__/DashboardCards.test.tsx` (DASH-01 assertion present)
    - `npm run test:components -- --testPathPattern='__tests__/DashboardCards\.test'` exits 0
  </acceptance_criteria>
  <done>
    DashboardCards.test.tsx asserts grid shape, 9 EmberGlass card mocks wired, masonry assertions removed, all tests green.
  </done>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-07 | Authentication bypass | DashboardCards.tsx | mitigate | Preserve existing `auth0.getSession()` check + `redirect('/auth/login')` verbatim; do NOT remove or alter the auth gate. Verified by reading current file before rewrite. |
</threat_model>

<verification>
- `npx tsc --noEmit` exits 0
- `npm run test:components -- --testPathPattern='__tests__/DashboardCards\.test'` green
- All 17 jest tests from Wave 1+2 still green: `npm run test:components -- --testPathPattern='EmberGlass'`
- Auth gate preserved (grep for `auth0.getSession` and `redirect`)
</verification>

<success_criteria>
- DASH-01 satisfied (single 2-col grid replaces masonry, all 9 cards render in identical 1:1 footprint)
- DASH-05 unblocked (Sonos visible after A-03 flip)
- DASH-11 satisfied at the integration level (each card mounts its own Sheet — wired in Wave 2)
- DASH-12 satisfied (stagger preserved via `animate-spring-in` + `animationDelay`)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-07-SUMMARY.md` documenting: the new render block diff, the barrel additions, the unifiedDeviceConfigService change with before/after of the `hasHomepageCard` function, jest pass output, and a note that `splitIntoColumns` is now an orphan utility (cleanup deferred).
</output>
