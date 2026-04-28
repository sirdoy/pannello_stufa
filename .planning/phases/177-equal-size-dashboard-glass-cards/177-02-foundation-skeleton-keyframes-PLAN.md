---
phase: 177
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/PlayingBars.tsx
  - app/components/EmberGlass/GlassCardSkeleton.tsx
  - app/components/EmberGlass/cards/SheetPlaceholderBody.tsx
  - app/components/devices/weather/hooks/useWeatherSummary.ts
  - app/components/EmberGlass/__tests__/PlayingBars.test.tsx
  - app/components/EmberGlass/__tests__/GlassCardSkeleton.test.tsx
  - app/components/EmberGlass/__tests__/SheetPlaceholderBody.test.tsx
  - app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx
  - app/globals.css
autonomous: true
requirements: [DASH-05, DASH-06, DASH-11, DASH-12]
tags: [ember-glass, primitives, dashboard, css-keyframes]
must_haves:
  truths:
    - "PlayingBars renders 3 animated bars using sonosBar0/1/2 keyframes"
    - "GlassCardSkeleton renders a 1:1 shimmer placeholder matching outer card footprint"
    - "SheetPlaceholderBody renders the Phase 178 placeholder copy"
    - "useWeatherSummary hook returns { city, temp, condition, high, low, loading }"
    - "globals.css contains @keyframes sonosBar0/1/2 (referenced by PlayingBars)"
  artifacts:
    - path: app/components/EmberGlass/PlayingBars.tsx
      provides: "3-bar Sonos animation primitive"
    - path: app/components/EmberGlass/GlassCardSkeleton.tsx
      provides: "1:1 shimmer skeleton fallback"
    - path: app/components/EmberGlass/cards/SheetPlaceholderBody.tsx
      provides: "Phase 178 placeholder body"
    - path: app/components/devices/weather/hooks/useWeatherSummary.ts
      provides: "Read-only weather summary hook"
    - path: app/globals.css
      provides: "sonosBar0/1/2 keyframes"
  key_links:
    - from: app/components/EmberGlass/PlayingBars.tsx
      to: app/globals.css
      via: "animation: sonosBar{i}"
      pattern: "sonosBar"
---

<objective>
Ship the remaining Wave 1 foundations: the animated PlayingBars primitive (with the missing CSS keyframes added to globals.css per A-04), the shared GlassCardSkeleton Suspense fallback, the SheetPlaceholderBody helper, and the new useWeatherSummary hook (A-extracted from WeatherCardWrapper). These unblock Wave 2 cards.

Purpose: Provides the animated/loading/placeholder/data foundations for Wave 2 card composition.
Output: 4 new files in `app/components/EmberGlass/` (+`cards/` for placeholder body) + 1 new hook + 4 jest specs + 3 keyframes appended to `app/globals.css`.
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
@CLAUDE.md
@app/components/EmberGlass/FlameViz.tsx
@app/components/devices/weather/WeatherCardWrapper.tsx
@app/components/ui/Skeleton.ts
@app/globals.css

<interfaces>
<!-- Existing globals.css keyframes already present (do NOT redefine) -->
- `@keyframes spring-in` at line 830 (consumed by `.animate-spring-in`)
- `@keyframes pulse` (Phase 176 D-14, consumed by LIVE pill)
- `@keyframes flamePulse` (FlameViz)
- `@media (prefers-reduced-motion: reduce)` block at line 1040

<!-- Tokens in scope -->
`--glass-bg`, `--glass-border`, `--r-card`, `--text-1`, `--text-2`, `--font-display`

<!-- WeatherCardWrapper data flow to mirror -->
From app/components/devices/weather/WeatherCardWrapper.tsx (lines 29-99):
```typescript
import { subscribeToLocation } from '@/lib/services/locationService';
// useEffect: subscribe → on coords change → fetch /api/weather/forecast?lat=&lon= → setWeather
// Returns: { city, temp, condition, high, low } shape
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Append sonosBar keyframes + ship PlayingBars + GlassCardSkeleton + SheetPlaceholderBody (with tests)</name>
  <files>
    app/globals.css
    app/components/EmberGlass/PlayingBars.tsx
    app/components/EmberGlass/GlassCardSkeleton.tsx
    app/components/EmberGlass/cards/SheetPlaceholderBody.tsx
    app/components/EmberGlass/__tests__/PlayingBars.test.tsx
    app/components/EmberGlass/__tests__/GlassCardSkeleton.test.tsx
    app/components/EmberGlass/__tests__/SheetPlaceholderBody.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (sections "PlayingBars", "GlassCardSkeleton", "SheetPlaceholderBody")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (section "Component Inventory" + "Empty / Loading / Error states")
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 265-285 for PlayingBars + bar keyframe definitions)
    - app/globals.css (lines 820-1080 — see existing keyframes + reduced-motion block)
    - app/components/EmberGlass/FlameViz.tsx (CSS-keyframe-driven primitive analog)
    - app/components/ui/Skeleton.ts (existing skeleton precedent — `bg-white/5` + `animate-pulse`)
  </read_first>
  <behavior>
    - PlayingBars renders `<div data-testid="playing-bars">` with 3 inner `<div>` bars, each `width: 2`, gap `1.5`, container height `9`, color `#b080ff`, animations `sonosBar0`, `sonosBar1`, `sonosBar2` at `0.9s ease-in-out` with `i * 0.15s` delay.
    - GlassCardSkeleton renders `<div data-testid="glass-card-skeleton" className="animate-pulse">` with inline style `aspectRatio: '1 / 1'`, `borderRadius: var(--r-card)`, `background: rgba(255,255,255,0.05)`, `border: 0.5px solid var(--glass-border)`.
    - SheetPlaceholderBody renders the Italian copy `Controlli in arrivo nella Phase {phase}` + a Lucide icon mapped from `device` prop (stove→Flame, thermostat→Thermometer, lights→Lightbulb, sonos→Music, camera→Video, network→Wifi, plugs-tuya/plugs-dirigera→Plug).
    - globals.css contains three new keyframes: `@keyframes sonosBar0 { 0%,100% { height: 4px; } 50% { height: 9px; } }`, `sonosBar1 { 0%,100% { height: 6px; } 50% { height: 4px; } }`, `sonosBar2 { 0%,100% { height: 5px; } 50% { height: 8px; } }`.
    - The existing `@media (prefers-reduced-motion: reduce)` block (line ~1040) adds a rule `[data-testid="playing-bars"] > div { animation: none !important; }`.
  </behavior>
  <action>
1. **Append to `app/globals.css`** (do NOT modify existing content; append at end of the file before any existing close-of-file markers, OR add adjacent to existing `@keyframes pulse` block):
```css
@keyframes sonosBar0 { 0%, 100% { height: 4px; } 50% { height: 9px; } }
@keyframes sonosBar1 { 0%, 100% { height: 6px; } 50% { height: 4px; } }
@keyframes sonosBar2 { 0%, 100% { height: 5px; } 50% { height: 8px; } }
```
Then add to the existing `@media (prefers-reduced-motion: reduce)` block at line ~1040 (find it via grep, append a new selector to its body):
```css
[data-testid="playing-bars"] > div { animation: none !important; }
```

2. `app/components/EmberGlass/PlayingBars.tsx` — copy from PATTERNS.md "Primitive: PlayingBars" verbatim. `'use client'`, no props. `data-testid="playing-bars"`. Maps `[0,1,2]` to bars with key=i.

3. `app/components/EmberGlass/GlassCardSkeleton.tsx` — copy from PATTERNS.md "Primitive: GlassCardSkeleton" verbatim. `'use client'`, no props. `data-testid="glass-card-skeleton"`. Tailwind `animate-pulse` class allowed (carve-out per D-02 for shimmer).

4. `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` — copy from PATTERNS.md "Helper: SheetPlaceholderBody" verbatim. `'use client'`, props `{ phase: string; device: keyof typeof ICONS }`. `data-testid="sheet-placeholder-body"`. Italian copy: `Controlli in arrivo nella Phase {phase}` + subtitle `Stiamo cucinando.`.

5. Tests:
   - `PlayingBars.test.tsx`: (a) renders 3 children with key=0,1,2; (b) each child has animation containing `sonosBar0`/`sonosBar1`/`sonosBar2` respectively; (c) container has `data-testid="playing-bars"`.
   - `GlassCardSkeleton.test.tsx`: (a) has `data-testid="glass-card-skeleton"`; (b) inline `aspectRatio` is `'1 / 1'`; (c) `className` includes `animate-pulse`.
   - `SheetPlaceholderBody.test.tsx`: (a) renders Italian phrase `Controlli in arrivo nella Phase 178` when `phase="178"`; (b) renders Flame icon when `device="stove"` (assert via `getByTestId` or `container.querySelector('svg')` presence); (c) renders subtitle `Stiamo cucinando.`.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='EmberGlass/(PlayingBars|GlassCardSkeleton|SheetPlaceholderBody)\.test'</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "@keyframes sonosBar" app/globals.css` returns `3`
    - `grep -q 'data-testid=\"playing-bars\"' app/components/EmberGlass/PlayingBars.tsx`
    - `grep -q 'data-testid=\"glass-card-skeleton\"' app/components/EmberGlass/GlassCardSkeleton.tsx`
    - `grep -q "Controlli in arrivo nella Phase" app/components/EmberGlass/cards/SheetPlaceholderBody.tsx`
    - `grep -q "animate-pulse" app/components/EmberGlass/GlassCardSkeleton.tsx`
    - `grep -v '^//' app/components/EmberGlass/PlayingBars.tsx app/components/EmberGlass/GlassCardSkeleton.tsx app/components/EmberGlass/cards/SheetPlaceholderBody.tsx | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='EmberGlass/(PlayingBars|GlassCardSkeleton|SheetPlaceholderBody)\.test'` exits 0
  </acceptance_criteria>
  <done>
    PlayingBars + GlassCardSkeleton + SheetPlaceholderBody shipped, three sonosBar keyframes in globals.css, reduced-motion guard applied, all jest tests green.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extract useWeatherSummary hook from WeatherCardWrapper with jest test</name>
  <files>
    app/components/devices/weather/hooks/useWeatherSummary.ts
    app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx
  </files>
  <read_first>
    - app/components/devices/weather/WeatherCardWrapper.tsx (full file — source of extraction lines 29-99)
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Card: WeatherCard + useWeatherSummary")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (WeatherCard copy contract)
    - lib/services/locationService.ts (look up `subscribeToLocation` signature)
    - app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts (jest hook-test analog if present, else any `__tests__/use*.test.ts(x)` under `app/components/devices/`)
  </read_first>
  <behavior>
    - `useWeatherSummary()` returns `{ city: string | null, temp: number | null, condition: string | null, high: number | null, low: number | null, loading: boolean }`.
    - Subscribes to `subscribeToLocation` on mount; when coords arrive, fetches `/api/weather/forecast?lat=&lon=` and maps the response to the summary shape.
    - On unmount, calls the unsubscribe function returned by `subscribeToLocation`.
    - Initial render: `loading: true`, all fields `null`.
    - After fetch resolves: `loading: false`, fields populated.
    - On fetch error: `loading: false`, fields stay `null`.
    - No `useMemo`, no `useCallback` (D-28).
  </behavior>
  <action>
1. Read `app/components/devices/weather/WeatherCardWrapper.tsx` lines 29-99 to identify the existing pattern (location subscription + forecast fetch + state mapping).

2. Create `app/components/devices/weather/hooks/useWeatherSummary.ts` extracting the read-only summary slice. Skeleton:
```ts
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
  const [s, setS] = useState<WeatherSummary>({ city: null, temp: null, condition: null, high: null, low: null, loading: true });
  useEffect(() => {
    const unsub = subscribeToLocation(async (coords) => {
      try {
        const res = await fetch(`/api/weather/forecast?lat=${coords.lat}&lon=${coords.lon}`);
        const json = await res.json();
        // Map fields per WeatherCardWrapper.tsx conventions
        setS({
          city: json.city ?? null,
          temp: json.current?.temp ?? null,
          condition: json.current?.condition ?? null,
          high: json.today?.high ?? null,
          low: json.today?.low ?? null,
          loading: false,
        });
      } catch {
        setS((prev) => ({ ...prev, loading: false }));
      }
    });
    return () => unsub?.();
  }, []);
  return s;
}
```
**Important:** the field names (`city`, `current.temp`, etc.) MUST match the actual `/api/weather/forecast` response shape used by `WeatherCardWrapper.tsx`. Read that file and adjust the mapping verbatim — bundle's mock shape is NOT authoritative. If `WeatherCardWrapper.tsx` uses a different field path (e.g. `data.weather.temperature`), use those field names instead.

3. `app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.tsx`:
   - Mock `@/lib/services/locationService` (`subscribeToLocation` invokes its callback synchronously with mock coords).
   - Mock `global.fetch` to return a forecast payload matching the field shape used in step 2.
   - Test (a): initial render returns `{ loading: true, city: null, ... }`.
   - Test (b): after `await act(...)` and fetch resolution, returns the populated summary.
   - Test (c): on fetch rejection, `loading` flips to `false` and city/temp stay `null`.
   - Use `@testing-library/react` `renderHook` (already used elsewhere — confirm by `grep -r renderHook app/components/devices/`).
  </action>
  <verify>
    <automated>npm run test:unit -- --testPathPattern='useWeatherSummary'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/devices/weather/hooks/useWeatherSummary.ts`
    - `grep -q "export function useWeatherSummary" app/components/devices/weather/hooks/useWeatherSummary.ts`
    - `grep -q "subscribeToLocation" app/components/devices/weather/hooks/useWeatherSummary.ts`
    - `grep -q "/api/weather/forecast" app/components/devices/weather/hooks/useWeatherSummary.ts`
    - `grep -v '^//' app/components/devices/weather/hooks/useWeatherSummary.ts | grep -cE "useMemo|useCallback"` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --testPathPattern='useWeatherSummary'` exits 0
  </acceptance_criteria>
  <done>
    useWeatherSummary hook exports `{ city, temp, condition, high, low, loading }`, jest passes, no React Compiler opt-outs.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → /api/weather/forecast | Existing endpoint; no change to surface or auth gates. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-02 | Information disclosure | useWeatherSummary | accept | Reuses existing /api/weather/forecast; coords come from existing locationService; no new auth surface. |
</threat_model>

<verification>
- `app/globals.css` contains 3 new sonosBar keyframes
- `npm run test:components -- --testPathPattern='EmberGlass/(PlayingBars|GlassCardSkeleton|SheetPlaceholderBody)\.test'` green
- `npm run test:unit -- --testPathPattern='useWeatherSummary'` green
- `npx tsc --noEmit` green
</verification>

<success_criteria>
- DASH-05 enabling artifact (PlayingBars + sonosBar keyframes) shipped
- DASH-06 enabling artifact (useWeatherSummary hook) shipped
- DASH-11 enabling artifact (SheetPlaceholderBody for placeholder sheet bodies) shipped
- DASH-12 satisfied (zero RC opt-outs introduced)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-02-SUMMARY.md` documenting: file paths, three new keyframes added to globals.css with their definitions, reduced-motion rule added, jest pass output for all 4 specs.
</output>
