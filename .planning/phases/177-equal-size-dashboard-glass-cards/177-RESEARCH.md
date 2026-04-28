# Phase 177: Equal-Size Dashboard Glass Cards - Research

**Researched:** 2026-04-28
**Domain:** Next.js 15.5 PWA — UI redesign of dashboard summary surface (presentational + Sheet wiring; no API/hook changes)
**Confidence:** HIGH (implementation paths fully verified against codebase + bundle); two LANDMINES require explicit planner action (Sonos visibility gate + DIRIGERA shape mismatch + Stove temp source)

## Summary

Phase 177 replaces the current two-column flexbox masonry (Phase 68/69) with a single CSS Grid `grid-cols-2` layout where every card is a 1:1 glass surface in `app/components/EmberGlass/cards/`. The layout change is small — `DashboardCards.tsx` keeps server-side auth + `getVisibleDashboardCards()` + per-card Suspense + `DeviceCardErrorBoundary` and only swaps the render block + skeleton registry. The bulk of the work is the 9 new presentational cards plus 7 micro-primitives lifted verbatim from the bundle (`cards.jsx:1-465`). Phase 175's `<Pressable>` and `<Sheet>` primitives are already shipping in `app/components/EmberGlass/`; Phase 177 wires them per card with a `<SheetPlaceholderBody>` body that Phase 178 replaces.

**Three LANDMINES surfaced — the planner MUST address each before kickoff:**

1. **Sonos is currently filtered OFF the dashboard** by `lib/services/unifiedDeviceConfigService.ts:69-72` (`hasHomepageCard('sonos') === false`). To ship DASH-05 the planner must flip this gate (delete the `'sonos'` exclusion).
2. **DIRIGERA has NO plug/outlet data** — `useDirigeraData()` exposes contact + motion sensors only (`types/dirigeraProxy.ts:42-50`). The CONTEXT.md D-23 spec (DirigeraCard rendering plugs[].name/on/power) is incompatible with the live data shape. The planner must choose one of: (a) re-spec DirigeraCard to render sensor summary (count of open contacts / recent motion / low battery), (b) drop DirigeraCard from the 9 cards (Tuya alone covers the "plugs" device class), or (c) escalate to user.
3. **Thermorossi proxy does NOT expose a stove temperature** (`types/thermorossiProxy.ts:36-46` has only `stove_state`, `power_level`, `fan_level`). The bundle's StoveCard reads `state.stove.temp` for a `36px` numeric. The planner must either (a) source temp from Netatmo room temp where the stove lives, (b) replace the `temp` numeric with `power_level` 1-5 styled as a large number, or (c) replace with translated `stove_state` text. Recommend (b) `power_level` as the primary on-card readout — it's the only fully reliable Thermorossi field and matches "Fiamma N" already in the subtitle.

**Primary recommendation:** Land the 9 cards + 7 primitives + `<Sheet>` wiring with placeholder body, accept (b) for stove temp / (a)-or-(b) for DIRIGERA, and resolve the Sonos visibility gate as a 1-line change in `unifiedDeviceConfigService.ts`. Don't deviate from the bundle on visual values.

## User Constraints (from CONTEXT.md)

The CONTEXT.md is exceptionally detailed (304 lines, 32 numbered decisions). It was generated in `--auto --chain` mode with all gray areas auto-resolved against ROADMAP SC + REQUIREMENTS DASH-01..DASH-12 + design bundle. Below is the verbatim summary the planner must honor.

### Locked Decisions (verbatim from CONTEXT.md `<decisions>`)

**Component architecture**
- D-01: All new files live under `app/components/EmberGlass/`; specifically `EmberGlass/GlassCard.tsx`, `CardHead.tsx`, `StatusDot.tsx`, `MiniStat.tsx`, `PlayingBars.tsx`, `InlineToggle.tsx`, `GlassCardSkeleton.tsx` and `EmberGlass/cards/{Stove,Climate,Lights,Sonos,Weather,Camera,Network,Raspi,Tuya,Dirigera}Card.tsx`. Plus `EmberGlass/cards/SheetPlaceholderBody.tsx`. Barrel exports in `EmberGlass/index.ts`.
- D-02: Inline-style + `var(--token)` mandatory for all new EmberGlass surfaces. No Tailwind for visual values inside the cards. Tailwind layout utilities (`grid grid-cols-2 gap-3 max-w-md mx-auto`) are allowed only on the outer container in `DashboardCards.tsx`.
- D-03: Existing `app/components/devices/<device>/[Device]Card.tsx` orchestrators are NOT touched, NOT renamed, NOT deleted (still serve detail pages /stove, /lights, /sonos, /raspi, etc.).
- D-04: `<GlassCard>` API: `tone?: string`, `onOpen?: () => void`, `style?: CSSProperties`. `aspectRatio: '1 / 1'` hard-coded inside the primitive. When `onOpen` is provided, GlassCard wraps root in `<Pressable>`. When omitted (Weather/Raspi), renders as static glass with no Pressable, no cursor pointer, no Sheet.
- D-05: `<CardHead>` always rendered as the first child; 32×32 colored icon tile + 13px label + optional `right` slot. Icons from `lucide-react`.

**Layout (DASH-01)**
- D-06: Replace masonry. New layout: `<div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">`. 2 columns at every viewport. Mobile/desktop dual-render blocks deleted. `splitIntoColumns` becomes orphan utility.
- D-07: Aspect-ratio enforced on `GlassCard` root via inline `aspectRatio: '1 / 1'` — not on the wrapper div in DashboardCards.tsx.
- D-08: Stagger preservation — keep wrapper `<div className="animate-spring-in" style={{ animationDelay: ${flatIndex * 100}ms }}>`. `animate-spring-in` already in `app/globals.css:830`.
- D-09: Per-card tone palette is hardcoded hex from bundle: Stove `var(--accent)`, Climate `#5eafff`, Lights `#f5c84a`, Sonos `#b080ff`, Weather `#ffb84a`, Camera `#6aa86a`, Network `#5eafff`, Raspi `#6aa86a`, Tuya/Dirigera `#ffb84a`.

**Press / Tap → Sheet wiring**
- D-10: GlassCard wraps root in `<Pressable>` when onOpen provided.
- D-11: WeatherCard + RaspiCard render WITHOUT onOpen → no Pressable, no Sheet (SC-#3).
- D-12: Each interactive card owns its own `useState<boolean>` for sheetOpen; renders `<Sheet open onClose title>` with `<SheetPlaceholderBody phase="178" device="..." />` body.
- D-13: `SheetPlaceholderBody` lives at `EmberGlass/cards/SheetPlaceholderBody.tsx`; deleted by Phase 178.
- D-14: Sheet `title` per card matches CardHead label: "Stufa", "Clima", "Luci", "Sonos", "Camera", "Rete", "Prese smart", "IKEA".

**Per-card content shape (DASH-02..DASH-10)** — D-15 through D-23 — see CONTEXT.md for the full bundle-verbatim spec; section "Per-Card Content Shape Mapping" in this document maps each spec to the live data hook.

**Loading / stale / error inside 1:1**
- D-24: Single shared `<GlassCardSkeleton>` Suspense fallback. Existing per-device entries in `app/components/ui/Skeleton.ts` stay alive (legacy detail pages still consume them) but no longer referenced by `DashboardCards.tsx`.
- D-25: Stale → header `<StatusDot>` switches to amber `#ffb84a`. No banner/overlay.
- D-26: Error (no cached data) → render with `"—"` placeholder + 10px footnote `"Non raggiungibile"`. Card stays tappable.
- D-27: `refreshing` ignored at card level; navbar `NavbarConnectionStatus` covers global connectivity.

**React Compiler (DASH-12, SC-#5)**
- D-28: NO `useMemo`/`useCallback` introduced in new cards or primitives. Pure function components. Plan must include a verification step.
- D-29: `Pressable` and `Sheet` from Phase 175 are already RC-clean; reuse unmodified.

**Tests**
- D-30: Playwright spec at `tests/smoke/dashboard-glass-cards.spec.ts` (NOT `tests/playwright/...` — see Codebase Touchpoint correction below).
- D-31: Jest specs at `app/components/EmberGlass/cards/__tests__/`.
- D-32: Existing `DashboardCards.test.tsx` updated to assert grid, not masonry; `splitIntoColumns` test stays alive (helper unchanged).

### Claude's Discretion (verbatim from CONTEXT.md)
- 7 separate primitive files vs `primitives.tsx` barrel → Recommend separate files (CONTEXT.md recommend stands).
- `SheetPlaceholderBody` `phase` prop vs hardcoded → Recommend `phase` prop.
- `data-testid` placement (root GlassCard div) → Recommend root.
- `useWeatherSummary()` location → Recommend `app/components/devices/weather/hooks/useWeatherSummary.ts`.
- Per-device `Skeleton.StovePanel`/etc. exports → Leave alone.
- Camera snapshot poll cadence → Reuse `useCameraData()`.
- Lucide Climate icon → `<Thermometer>`.

### Deferred Ideas (verbatim from CONTEXT.md `<deferred>` — OUT OF SCOPE)
- Sheet bodies SHEET-02..06 (Phase 178)
- Reduced-motion overrides for stagger/press
- Migration of legacy big orchestrator cards into sheets
- HLS preview in CameraCard (Phase 178)
- Dashboard-level sheet orchestrator (single state)
- 3-col / 4-col layout on lg+
- Per-card connection indicator pills
- Dirigera/Tuya consolidation into one PlugsCard
- Long-press / swipe gestures
- Web Vitals telemetry for dashboard mount

## Phase Requirements

| ID | Description (verbatim from REQUIREMENTS.md) | Research Support |
|----|---------------------------------------------|------------------|
| DASH-01 | 2-col mobile grid, aspect-ratio 1:1, identical footprint across 9 cards | "Layout Strategy" + bundle `cards.jsx:7-50` |
| DASH-02 | StoveCard: temp + flame viz + "Fiamma N · Ventola N" / "Spenta" | "Per-Card Content Shape Mapping" — LANDMINE: temp source missing |
| DASH-03 | ClimateCard: ≤4 zones inline + "N di M attive" | "Per-Card Content Shape Mapping" — fields verified in `useThermostatData` |
| DASH-04 | LightsCard: ≤4 on-light names + "+altre N" + header toggle | Verified `useLightsData.lights[]` + `useLightsCommands.handleAllLightsToggle` |
| DASH-05 | SonosCard: ≤4 groups + playing-bars + count header | LANDMINE: `hasHomepageCard('sonos')` returns false; needs flip |
| DASH-06 | WeatherCard: temp + city + condition + hi/lo (read-only) | Existing `WeatherCardWrapper` pattern; new `useWeatherSummary` hook |
| DASH-07 | CameraCard: preview + LIVE pulse + source label | `useCameraData().cameras[0].name`; snapshot URL pattern verified |
| DASH-08 | NetworkCard: down Mbps + up + device count | `useNetworkData().bandwidth.{download,upload}` + `activeDeviceCount` |
| DASH-09 | RaspiCard: 2-stat grid + CPU temp footer (read-only) | Verified `useRaspiData().data.{cpuPercent,memoryPercent,cpuTemperature}` |
| DASH-10 | TuyaCard / PlugsCard: ≤4 plugs + total power + N/M, no inline toggle | `useTuyaData().plugs[]` verified; LANDMINE: DIRIGERA shape mismatch |
| DASH-11 | Tap opens Sheet; Weather + Raspi do NOT | Phase 175 `<Sheet>` API + per-card `useState` |
| DASH-12 | Stagger preserved; React Compiler auto-memo intact | `animate-spring-in` keyframe verified at `app/globals.css:830`; `next.config.ts:19` `reactCompiler: true` |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Server-side auth check | Frontend Server (SSR) | — | `DashboardCards.tsx` is async SC; preserve Auth0 session check + redirect |
| Server-side device-config fetch | Frontend Server (SSR) | Database (Firebase) | `getUnifiedDeviceConfigAdmin(userId)` — preserve verbatim |
| Card visibility + ordering | Frontend Server (SSR) | — | `getVisibleDashboardCards()` consumed in async SC |
| Card render + presentation | Browser / Client | — | All 9 cards are `'use client'` (state-bearing for sheetOpen) |
| Device data fetching (polling + WS) | Browser / Client | API / Backend | Existing hooks unchanged; HA proxy + WebSocket upstream |
| Sheet open/close state | Browser / Client | — | Per-card `useState`; no global store |
| Stagger animation | Browser / Client | — | CSS keyframe `animate-spring-in` + inline `animationDelay` |
| Camera snapshot fetch | Browser / Client | API / Backend | Browser fetches `/api/camera/snapshot/{id}?t=${Date.now()}`; existing 302-redirect endpoint |
| Glass surface visuals (blur, gradient, shadow) | Browser / Client | — | Inline styles + CSS variables; no server involvement |

## Standard Stack

### Core (already installed; verified in package.json + existing files)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.0 | SSR + App Router + React Compiler | [VERIFIED] Already the framework; `reactCompiler: true` in `next.config.ts:19` |
| React | 19 (implicit via Next 16) | UI engine | [VERIFIED] React Compiler 1.0 enabled (Phase 71) |
| `lucide-react` | (existing) | Icons (Flame, Thermometer, Lightbulb, Music, Sun, Video, Wifi, Cpu, Plug) | [VERIFIED] Already a dep; used in `EmberGlass/Sheet.tsx:33` |
| `@radix-ui/react-dialog` | (existing) | Sheet primitive (consumed by Phase 175 `<Sheet>`) | [VERIFIED] Already wired |
| `@auth0/nextjs-auth0` | (existing) | Server-side session check in DashboardCards.tsx | [VERIFIED] Existing pattern |
| `babel-plugin-react-compiler` | 1.0.0 | RC auto-memoization | [VERIFIED: package.json line 169] |

### Supporting (existing — to be reused unmodified)
| Library / Module | Purpose | Use |
|------------------|---------|-----|
| `app/components/EmberGlass/Pressable.tsx` | DS-07 press primitive | Wrap GlassCard root when onOpen provided |
| `app/components/EmberGlass/Sheet.tsx` | SHEET-01 sheet primitive | One per interactive card; placeholder body |
| `app/components/EmberGlass/FlameViz.tsx` | Flame visualization | StoveCard absolute-positioned top-right |
| `app/components/EmberGlass/AmbientBg.tsx` | Ambient background glow | Already mounted at app shell — no Phase 177 work |
| `app/globals.css` keyframes | `animate-spring-in` (line 830), `flamePulse` (line 1584), `pulse` (line 1574) | Stagger, flame, LIVE badge |

### Alternatives Considered → REJECTED (per CONTEXT decisions)
| Instead of | Could Use | Why rejected |
|------------|-----------|--------------|
| Tailwind `aspect-square` class | inline `aspectRatio: '1 / 1'` | D-02: EmberGlass surfaces use inline-style + CSS vars only |
| CSS Grid `grid-template-rows: 1fr` for height parity | aspect-ratio | aspect-ratio is the simpler 1:1 contract; row-based equalization adds masonry coupling |
| Single `primitives.tsx` barrel for 7 primitives | 7 separate files | D-recommend: separate files for Phase 178 reuse |
| `next/image` for camera snapshot | bare `<img>` with cache-bust query | snapshot URL is a 302 redirect to a transient WiNet URL; `next/image` would require `remotePatterns` for an unstable host |
| React Server Component for cards | Client Component | All 9 need `useState` for sheetOpen |

**Installation:** No new installs.

**Version verification (sampled):**
```bash
$ grep -E '"next"|"react"|"lucide-react"|"@radix-ui/react-dialog"|"react-compiler"' package.json
# Already in deps; no `npm install` required (CLAUDE.md Rule 4 forbids it anyway)
```
[VERIFIED: package.json lines including `"next": "^16.1.0"` and `"babel-plugin-react-compiler": "^1.0.0"`]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Server (Next.js App Router — async SC)                          │
│   app/page.tsx                                                  │
│      └─ <Suspense fallback={DashboardSkeleton}>                 │
│           <DashboardCards />        ← THE ONE async SC          │
│                                                                 │
│   DashboardCards.tsx (async SC, server-side):                   │
│      1. auth0.getSession()  → redirect /auth/login if missing   │
│      2. getUnifiedDeviceConfigAdmin(userId) → Firebase RTDB     │
│      3. getVisibleDashboardCards(deviceConfig) → ordered list   │
│      4. Render: <div className="grid grid-cols-2 gap-3 …">      │
│                  {cards.map((c, i) => <Wrapper>{Card}</Wrapper>)│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTML stream + RSC payload
┌─────────────────────────────────────────────────────────────────┐
│ Browser ("use client" cards)                                    │
│                                                                 │
│   Per card (e.g. StoveCard):                                    │
│      const data = useStoveData()      ← polling + WS hook       │
│      const [open, setOpen] = useState(false)                    │
│                                                                 │
│      <GlassCard tone="…" onOpen={() => setOpen(true)}>          │
│         ├─ <Pressable> (auto, when onOpen present)              │
│         ├─ <CardHead Icon label tone right={<StatusDot/>}/>     │
│         └─ Body: temp/flame/subtitle (inline styles)            │
│      </GlassCard>                                               │
│      <Sheet open={open} onClose={…} title="Stufa">              │
│         <SheetPlaceholderBody phase="178" device="stove"/>      │
│      </Sheet>                                                   │
│                                                                 │
│   Stagger wrapper (server-rendered, CSS-driven on mount):       │
│      <div className="animate-spring-in"                         │
│           style={{animationDelay: `${i*100}ms`}}>               │
│        <ErrorBoundary>                                          │
│          <Suspense fallback={<GlassCardSkeleton/>}>             │
│            <CardComponent/>                                     │
│          </Suspense>                                            │
│        </ErrorBoundary>                                         │
│      </div>                                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ data fetch (per-card hook)
┌─────────────────────────────────────────────────────────────────┐
│ HA proxy (X-API-Key)                                            │
│   /api/v1/{thermorossi,netatmo,hue,sonos,fritzbox,raspi,        │
│           dirigera,tuya,camera,weather}/...                     │
│   WebSocket: real-time topic broadcasts (Phase 17.0)            │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (additions)
```
app/components/EmberGlass/
├── GlassCard.tsx               # NEW — 1:1 glass base + Pressable wrap
├── CardHead.tsx                # NEW — header row primitive
├── StatusDot.tsx               # NEW — 8px status dot
├── MiniStat.tsx                # NEW — RaspiCard CPU/RAM stat
├── PlayingBars.tsx             # NEW — Sonos 3-bar animation
├── InlineToggle.tsx            # NEW — iOS-style 44×26 toggle
├── GlassCardSkeleton.tsx       # NEW — single 1:1 shimmer
├── cards/
│   ├── StoveCard.tsx           # NEW — DASH-02
│   ├── ClimateCard.tsx         # NEW — DASH-03
│   ├── LightsCard.tsx          # NEW — DASH-04
│   ├── SonosCard.tsx           # NEW — DASH-05
│   ├── WeatherCard.tsx         # NEW — DASH-06 (read-only)
│   ├── CameraCard.tsx          # NEW — DASH-07
│   ├── NetworkCard.tsx         # NEW — DASH-08
│   ├── RaspiCard.tsx           # NEW — DASH-09 (read-only)
│   ├── TuyaCard.tsx            # NEW — DASH-10
│   ├── DirigeraCard.tsx        # NEW — DASH-10 (LANDMINE — see below)
│   ├── SheetPlaceholderBody.tsx # NEW — body for Phase 178 placeholder
│   └── __tests__/              # NEW — 11 Jest specs
├── __tests__/                  # NEW — 7 primitive specs
├── AmbientBg.tsx               # existing
├── FlameViz.tsx                # existing — consumed by StoveCard
├── Pressable.tsx               # existing — consumed by GlassCard
├── Sheet.tsx                   # existing — consumed by interactive cards
├── Splash.tsx                  # existing
├── SplashGate.tsx              # existing
└── index.ts                    # MODIFIED — barrel: 7 primitives + 10 cards + skeleton + placeholder

app/components/devices/weather/hooks/
└── useWeatherSummary.ts        # NEW — read-only summary slice (recommended)

app/components/
└── DashboardCards.tsx          # MODIFIED — single grid render block + skeleton swap

lib/services/
└── unifiedDeviceConfigService.ts  # MODIFIED — flip hasHomepageCard('sonos') to true (1-line)

tests/smoke/                    # NEW spec
└── dashboard-glass-cards.spec.ts

# UNCHANGED: app/page.tsx, app/loading.tsx, app/layout.tsx, all device hooks,
#            all API routes, lib/utils/dashboardColumns.ts (orphan, flagged for cleanup)
```

### Pattern 1: Single CSS Grid replaces dual-render masonry

**What:** One `<div>` with `grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3` replaces the existing dual-block masonry (`flex flex-col gap-6 sm:hidden` + `hidden sm:flex sm:flex-row gap-8 lg:gap-10`). aspect-ratio 1:1 enforced on every child via `<GlassCard>` inline `aspectRatio: '1 / 1'`.

**When to use:** When every child must share an identical footprint (1:1) AND a single linear flatIndex stagger is desired across all viewports.

**Example:**
```tsx
// app/components/DashboardCards.tsx (MODIFIED render block)
return (
  <>
    <div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
      {visibleCards.map((card, index) => renderCard(card, index))}
    </div>
    {visibleCards.length === 0 && <EmptyState ... />}
  </>
);
```

The single grid block subsumes both the mobile single-column and the desktop two-column-flexbox masonry. `splitIntoColumns` is no longer called; `lib/utils/dashboardColumns.ts` becomes orphan code (CONTEXT D-06 says leave it for the v20.0 cleanup phase).

[VERIFIED: bundle `cards.jsx:7-50` GlassCard contract; current `DashboardCards.tsx:122-149` masonry block to be deleted; CSS Grid + aspect-ratio confirmed via Tailwind v4 / Tailwind ^3.x — both support `grid grid-cols-2 gap-3` since v3.0]

### Pattern 2: GlassCard primitive auto-wraps in Pressable when interactive

**What:** A single `<GlassCard>` accepting `onOpen?: () => void`. When defined, GlassCard wraps its root in `<Pressable>` (Phase 175 DS-07) and sets `cursor: pointer`. When omitted, renders as a static glass surface (no Pressable, no Sheet, no cursor pointer).

**Why:** Single grep target — every interactive Phase 177 card resolves to `<Pressable>` via GlassCard, satisfying SC-#1 of Phase 175 ("every NEW glass surface in Phases 177-181 reuses Pressable"). And the Weather/Raspi exclusion (SC-#3 of Phase 177) is structurally enforced — the absence of `onOpen` makes them non-interactive at the primitive level, not the consumer level.

**Example:**
```tsx
// app/components/EmberGlass/GlassCard.tsx (NEW)
'use client';
import type { CSSProperties, ReactNode } from 'react';
import { Pressable } from './Pressable';

export interface GlassCardProps {
  children: ReactNode;
  tone?: string;             // inline radial-gradient wash; defaults to none
  onOpen?: () => void;       // when provided, wraps in <Pressable>; otherwise static
  style?: CSSProperties;
  'data-testid'?: string;
}

export function GlassCard({ children, tone, onOpen, style, ...rest }: GlassCardProps) {
  const baseStyle: CSSProperties = {
    position: 'relative',
    borderRadius: 'var(--r-card)',
    padding: 'var(--pad-card)',
    aspectRatio: '1 / 1',           // SC-#1 enforced at primitive
    cursor: onOpen ? 'pointer' : 'default',
    overflow: 'hidden',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
    border: '0.5px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
    display: 'flex',
    flexDirection: 'column',
    ...style,
  };

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
      <Pressable as="div" onClick={onOpen} style={baseStyle} {...rest}>
        {inner}
      </Pressable>
    );
  }
  return <div style={baseStyle} {...rest}>{inner}</div>;
}
```

[CITED: bundle `cards.jsx:7-50` for visual values; Phase 175 D-03 for Pressable component form]

### Pattern 3: Per-card Sheet co-location

**What:** Each interactive card owns its own `useState<boolean>` for `sheetOpen` and renders its own `<Sheet>` instance with `<SheetPlaceholderBody>`. No global orchestrator.

**Why:** Phase 178 lands real sheet bodies one device at a time. Co-located state means each Phase 178 plan touches exactly one file (`cards/StoveCard.tsx` → swap placeholder for StoveSheet body). No global state to coordinate.

**Example:**
```tsx
// app/components/EmberGlass/cards/StoveCard.tsx (NEW)
'use client';
import { useState } from 'react';
import { Flame } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { Sheet } from '../Sheet';
import { FlameViz } from '../FlameViz';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';

export function StoveCard() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { checkVersion } = useVersion();
  const data = useStoveData({ checkVersion, userId: user?.sub });

  const isOn = data.isAccesa;
  const power = data.powerLevel ?? 0;
  const fan = data.fanLevel ?? 0;
  // LANDMINE: there is no temp field on useStoveData — see "Per-Card Content Shape Mapping"
  const primary = power; // fallback to power level (1-5) — see RECOMMENDED RESOLUTION below

  return (
    <>
      <GlassCard
        tone="var(--accent)"
        onOpen={() => setOpen(true)}
        data-testid="stove-card"
      >
        <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" right={<StatusDot on={isOn} />} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
          <div style={{ position: 'absolute', right: -8, top: -10, opacity: 0.9 }}>
            <FlameViz on={isOn} intensity={power / 5} />
          </div>
          <div
            data-testid="stove-primary"
            style={{
              fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, lineHeight: 1,
              color: isOn ? '#fff' : 'var(--text-2)', letterSpacing: -1.2,
              position: 'relative', zIndex: 1,
            }}
          >
            {primary}
            <span style={{ fontSize: 16, opacity: 0.5, marginLeft: 2 }}>
              {/* recommended unit if using power as primary: blank or "" — re-spec to `°C` requires a temp source */}
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {isOn ? `Fiamma ${power} · Ventola ${fan}` : 'Spenta'}
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

[VERIFIED: useStoveData fields at `app/components/devices/stove/hooks/useStoveData.ts:43-93`; FlameViz API at `EmberGlass/FlameViz.tsx:25-30`; Sheet API at `EmberGlass/Sheet.tsx:35-42`]

### Anti-Patterns to Avoid

- **Reading the bundle's hardcoded mock data shape (`state.stove.temp`) and assuming it lives on the live hook.** The bundle is a design prototype with mock state. Always verify against `app/components/devices/<device>/hooks/use<Device>Data.ts`.
- **Adding `useMemo`/`useCallback` "for safety" inside cards.** Phase 71 enabled React Compiler 1.0; Phase 95 deleted ~179 manual memoization hooks. Plan must verify zero new manual memoization (see "Common Pitfalls").
- **Deleting `splitIntoColumns` in this phase.** It is referenced by `lib/utils/dashboardColumns.test.ts` (Phase 69 history). Leave both files alone — flagged orphan, the v20.0 cleanup phase deletes them.
- **Touching the legacy big cards** (`app/components/devices/<device>/[Device]Card.tsx`). They serve detail pages (/stove, /lights, etc.). Phase 178 will harvest sub-components from them; do NOT delete or rename in 177.
- **Hand-rolling a Sheet wrapper.** The Phase 175 `<Sheet>` is the contract: `<Sheet open onClose title>`. Do not create a `<DeviceSheet>` indirection — Phase 178 already plans to consume `<Sheet>` directly per CONTEXT D-12.
- **Putting `data-testid` on the outer stagger wrapper instead of the GlassCard root.** Tests measure 1:1 from the card root; the stagger wrapper is a transparent positioning shell whose dimensions don't reflect the card.
- **Reading `useDirigeraData` and trying to render plug/outlet rows.** It returns sensor summary only. See LANDMINE 2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Press-down scale-down animation | Custom `useState(pressed)` + transform | `<Pressable>` from Phase 175 | Already RC-clean; matches `.press-anim` curve; SC-#1 grep target |
| Modal sheet with backdrop + scroll-lock | Custom Radix wrapper | `<Sheet>` from Phase 175 | z-index 200/201 reserved; scroll-lock + restore wired; bundle visuals locked |
| 1:1 aspect-ratio enforcement | `padding-bottom: 100%` hack or `aspect-square` Tailwind | inline `aspectRatio: '1 / 1'` on GlassCard | Phase 174 D-12 + D-02 require inline-style; aspect-ratio is the modern, well-supported CSS property |
| Stagger animation | Custom keyframe + JS delay | `animate-spring-in` class + inline `animationDelay` | Already in `globals.css:830`; existing pattern in DashboardCards.tsx:107 |
| Camera live preview | HLS player on the card | Static snapshot via `<img src="/api/camera/snapshot/{id}?t={Date.now()}">` | HLS belongs in the sheet (battery/perf); existing 302 endpoint |
| Card-level error/stale UI | Banner overlay inside 1:1 footprint | `"—"` placeholder + 10px footnote per CONTEXT D-26 | No room for banner; sheet (Phase 178) carries full error UI |
| Per-device skeleton during dashboard mount | Per-device `Skeleton.StovePanel` etc. | Single shared `<GlassCardSkeleton>` | All cards share 1:1 footprint; one shimmer matches all |
| Master "all lights on/off" handler | Custom toggle handler | `useLightsCommands().handleAllLightsToggle(on)` from Phase 14.0 | Already wired with retry + dedup + idempotency |
| Sonos visibility on dashboard | Add manual feature flag | Flip `hasHomepageCard('sonos')` to true | Single logical change; preserves `getVisibleDashboardCards` ordering |

**Key insight:** Phase 174 + 175 + 176 already shipped every primitive Phase 177 needs. The only **new** primitives are the bundle-verbatim micro-pieces (CardHead, StatusDot, MiniStat, PlayingBars, InlineToggle, GlassCardSkeleton, GlassCard). Do not invent new patterns; lift verbatim.

## Layout Strategy

**Decision: Single CSS Grid `grid-cols-2 gap-3` with `aspectRatio: '1 / 1'` enforced per child** [VERIFIED against CONTEXT D-06 + D-07].

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **CSS Grid `grid-cols-2 gap-3` + inline `aspectRatio: '1 / 1'`** | Bundle-faithful (`app.jsx:80-120` uses 2-col grid + `gap: 12`); simplest single render block; flatIndex maps directly to children index; works on every viewport | Container needs a width cap on tablet+ to avoid billboard cards (`max-w-md sm:max-w-2xl`) — already locked in CONTEXT | ✅ Selected |
| Flex `flex-row` + `flex-basis: calc(50% - 6px)` + aspect-ratio wrapper | Allows asymmetric children if ever needed | More CSS; requires `flex-wrap`; non-trivial gap math; not bundle-faithful | ❌ Rejected |
| Keep current masonry, force aspect-ratio per child | Minimal layout diff | Creates uneven rows when card heights vary (defeats SC-#1); preserves orphaned `splitIntoColumns` | ❌ Rejected |
| Responsive 2/3/4 col on lg | More density on wide viewports | Bundle is 2-col phone frame; CONTEXT defers to Deferred Ideas | ❌ Out of scope |

**flatIndex with single grid:** When the dual-block masonry collapses to a single grid, `flatIndex === array index` — i.e., `visibleCards.map((card, index) => renderCard(card, index))`. The `splitIntoColumns` flatIndex remap (even→left, odd→right) is no longer needed; `index` is the flat order. The current code's `flatIndex` argument to `renderCard` becomes plain `index`. CSS animation order (top-left → top-right → row 2 left → row 2 right ...) reads naturally with `animationDelay: ${index * 100}ms`.

## Per-Card Content Shape Mapping

For every card in CONTEXT D-15..D-23, this section maps the bundle spec to the live data hook. ⚠️ flags fields that DO NOT EXIST on the live hook.

### StoveCard (DASH-02) — D-15

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.stove.on` | `useStoveData().isAccesa` | ✅ Verified `useStoveData.ts:78` |
| `state.stove.power` | `useStoveData().powerLevel` (number \| null, 1-5) | ✅ Verified `useStoveData.ts:47` |
| `state.stove.fan` | `useStoveData().fanLevel` (number \| null, 1-6) | ✅ Verified `useStoveData.ts:46` |
| `state.stove.temp` | ⚠️ **DOES NOT EXIST** on `useStoveData` or in `ThermorossiStatusResponse` | ⚠️ **LANDMINE 3** — see Resolution below |
| Subtitle: `Fiamma ${power} · Ventola ${fan}` / `'Spenta'` | Computed from above | ✅ |
| `<FlameViz on intensity={power/5} />` | Existing `EmberGlass/FlameViz.tsx` | ✅ |

**LANDMINE 3 — Stove temperature source missing.** Thermorossi proxy exposes `stove_state`, `power_level`, `fan_level`, plus alarm fields. There is NO ambient/water/board/smoke temperature reading from this stove via any current API.

**Recommended resolution (planner picks one):**
- **(a) Use Netatmo zone temp where the stove lives.** Couples StoveCard to thermostat data (the stove room maps to a Netatmo zone in the home topology). Cleanest UX. Requires resolving "which zone is the stove room" — likely a hardcoded room name/id mapping or a registry lookup. Adds a second data dependency to StoveCard.
- **(b) Replace `temp` with `powerLevel` rendered as the 36px primary display, drop `°C` superscript, drop subtitle's "Fiamma N" duplication.** Self-contained; no new data; ships today. The card's primary readout becomes the stove's power level (1-5).
- **(c) Replace `temp` with translated `stove_state`** (Spenta/In avvio/In funzione/Standby/Pulizia/Allarme/Modulazione). Text instead of numeric; loses the "big number" visual rhythm.

**Recommend (b)** — simplest, ships today, matches the stove's actual control surface. (a) is the ideal long-term fix but introduces cross-device coupling that warrants its own phase. Confirm with user via planner.

### ClimateCard (DASH-03) — D-16

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.thermostat.zones` | `useThermostatData().status?.rooms` | ⚠️ Field is `rooms`, not `zones` |
| `zones[].name` | `topology.rooms` provides `name`; `status.rooms[]` provides only `room_id` | ⚠️ Cross-reference required |
| `zones[].current` | `useThermostatData().status?.rooms[].temperature` | ✅ |
| `zones[].on` | `status.rooms[].heating` (boolean) | ✅ Verified |
| `state.thermostat.mode` | `useThermostatData().status?.mode` (string) | ✅ |
| `activeCount` (zones.filter(on)) | derived | ✅ |

**Implementation note:** Plan must include zone name resolution by joining `status.rooms[i].room_id` to `topology.rooms[].id` to obtain `name`. This is a presentational join — keep it inline in the card render function (a small `roomNameById = new Map(topology.rooms.map(r => [r.id, r.name]))` reference), no new hook needed.

[VERIFIED: useThermostatData return shape at `app/components/devices/thermostat/hooks/useThermostatData.ts:38-79`]

### LightsCard (DASH-04) — D-17

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.lights[]` | `useLightsData().lights` (`HueLight[]`) | ✅ Verified |
| `lights[].name` | `HueLight.name` (with `custom_name` registry override available) | ✅ `types/hueProxy.ts:58, 72` |
| `lights[].on` | `HueLight.on` | ✅ |
| `onCount`, `totalCount` | derived | ✅ |
| Master toggle handler | `useLightsCommands().handleAllLightsToggle(on)` | ✅ Verified `useLightsCommands.ts:52, 180` |
| `e.stopPropagation()` on toggle change | Inline in onChange | ✅ Critical to prevent sheet open on toggle click |

**Implementation note:** `useLightsCommands` requires `lightsData` shaped Pick from `UseLightsDataReturn`. Card must wire it: `const lightsData = useLightsData(); const commands = useLightsCommands({ lightsData, router });` Match the orchestrator pattern. Beware: `useLightsCommands` already ships its own retry/error UI via `hueRoomCmd` — the card should NOT render those banners (they belong in LightsSheet, Phase 178). The card only calls `handleAllLightsToggle(!anyOn)`.

**Custom name preference:** Use `light.custom_name ?? light.name` (registry override beats Bridge name). Same pattern applies for Sonos/Tuya custom_name fields.

### SonosCard (DASH-05) — D-18

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.sonos.groups[]` | `useSonosFullData().data?.zones` (`SonosZoneResponse[]`) | ✅ |
| `groups[].name` | `SonosZoneResponse.label` (or `coordinator_name`) | ✅ Use `label` |
| `groups[].playing` | `data?.playback[group_id]?.transport_state === 'PLAYING'` | ✅ Verified |
| `groups[].track` | `data?.playback[group_id]?.title` (artist optional) | ✅ Verified |
| `playingCount` | derived | ✅ |
| `<PlayingBars />` keyframes `sonosBar0/1/2` | ⚠️ **NOT in globals.css** — must be added | ⚠️ **Add 3 keyframes** |

**LANDMINE A — `sonosBar0/sonosBar1/sonosBar2` keyframes are NOT in `app/globals.css`.** Bundle `cards.jsx:267-269` references them. `grep "sonosBar" app/globals.css` returned no matches. Plan must add three keyframes to `app/globals.css` (alongside `pulse` at line 1574 and `flamePulse` at 1584). Suggested definition (animates the 3 bars at staggered heights):
```css
@keyframes sonosBar0 { 0%, 100% { height: 4px; } 50% { height: 9px; } }
@keyframes sonosBar1 { 0%, 100% { height: 7px; } 50% { height: 3px; } }
@keyframes sonosBar2 { 0%, 100% { height: 5px; } 50% { height: 8px; } }
```
Plan should also add a reduced-motion override to set `animation: none` on `[data-playing-bars="true"] > div` (matches `[data-flame-viz]` pattern at `globals.css:1593`).

**Visibility gate (LANDMINE 1):** As shipped, Sonos is filtered OFF the dashboard. Resolution: in `lib/services/unifiedDeviceConfigService.ts:69-72`, change `hasHomepageCard` to `function hasHomepageCard(deviceId: DeviceId): boolean { return true; }` (or simply delete the function and inline `true` at the filter call). After this change, Sonos appears in `getVisibleDashboardCards()` output (assuming the user's deviceConfig has `sonos.visible: true`). Touch the JSDoc comment too.

### WeatherCard (DASH-06) — D-19 (read-only, NO Sheet)

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.weather.temp` | `WeatherData.current.temp` from `/api/weather/forecast` | ✅ |
| `state.weather.city` | location subscription via `subscribeToLocation` | ✅ |
| `state.weather.condition` | `WeatherData.current.condition` | ✅ |
| `state.weather.high`, `.low` | `WeatherData.daily[0].{high,low}` | ✅ |

**Recommendation (per CONTEXT Discretion):** Extract a small `useWeatherSummary()` hook in `app/components/devices/weather/hooks/useWeatherSummary.ts` that subscribes to location, fetches `/api/weather/forecast`, and exposes `{ temp, city, condition, high, low, isLoading }`. Mirror `WeatherCardWrapper.tsx:29-99` but return summary fields instead of rendering. Future WeatherSheet (if any) can reuse it.

### CameraCard (DASH-07) — D-20

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `cameraName` | `useCameraData().cameras[0]?.name` (nullable) | ✅ Verified `types/netatmoProxy.ts:229-237` |
| `resolution` | ⚠️ NOT in `CameraStatus` — only `device_type` (e.g. "NACamera") | ⚠️ Hardcode "1080p" or omit |
| Snapshot URL | `<img src={`/api/camera/snapshot/${cameraId}?t=${Date.now()}`}/>` (302 redirect) | ✅ Phase 91 endpoint pattern |
| LIVE badge `pulse 1.6s infinite` keyframe | `app/globals.css:1574` `pulse` | ✅ Verified |

**Implementation note:** No `resolution` field on `CameraStatus`. Either omit (`{cameraName}`) or hardcode `"1080p"` per bundle. Recommend: `{cameraName ?? 'Camera'} · 1080p` with the resolution literal. The 10s snapshot refresh: tie `<img>` `src` to a `useState(Date.now())` updated by `useAdaptivePolling` (or just use `useCameraData().lastUpdatedAt` as the cache-buster). Plan agent verifies.

**Empty state:** When `cameras.length === 0`, render placeholder with header only and "—" placeholder text per CONTEXT D-26.

### NetworkCard (DASH-08) — D-21

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.network.down` | `useNetworkData().bandwidth?.download` (Mbps) | ✅ Verified `types.ts:15-19` |
| `state.network.up` | `useNetworkData().bandwidth?.upload` (Mbps) | ✅ |
| `state.network.devices` | `useNetworkData().activeDeviceCount` | ✅ Verified `types.ts:89` |
| WAN reachable indicator | `useNetworkData().wan?.connected` | ✅ — render `<StatusDot on color="#6aa86a" />` when true, off otherwise |

**Implementation note:** `bandwidth.download` is a number (Mbps). Bundle uses `{down}` raw — render with `Math.round` if subdecimal noise is undesired. No tabular-nums needed unless plan agent observes flicker.

### RaspiCard (DASH-09) — D-22 (read-only, NO Sheet)

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `state.raspi.cpu` (0-100) | `useRaspiData().data?.cpuPercent` | ✅ Verified `useRaspiData.ts:14, 86` |
| `state.raspi.ram` | `useRaspiData().data?.memoryPercent` | ✅ |
| `state.raspi.temp` | `useRaspiData().data?.cpuTemperature` (number \| null) | ✅ Verified |
| `<MiniStat label value bar />` | New primitive (D-recommend) | ✅ |

### TuyaCard / DirigeraCard (DASH-10) — D-23

**TuyaCard:** Maps cleanly:

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `plugs[]` | `useTuyaData().plugs` (`TuyaPlug[]`) | ✅ Verified |
| `plugs[].name` | `plug.custom_name ?? plug.device_id` | ✅ Note: no plain `name` field; use `custom_name` with `device_id` fallback |
| `plugs[].on` | `plug.switch_on` (boolean \| null — null when UNREACHABLE; treat as off) | ✅ |
| `plugs[].power` | `plug.power_w` (number \| null) | ✅ |
| Total power, onCount | derived | ✅ |

**DirigeraCard — LANDMINE 2:**

| Bundle field | Live hook source | Status |
|--------------|------------------|--------|
| `plugs[]` | ⚠️ **NO PLUG/OUTLET DATA** — `useDirigeraData()` returns `{ health, summary }` (sensor summary); `useDirigeraFullData()` returns `{ health, sensors }` (DirigeraSensor[] = contact + motion sensors only) | ⚠️ |

The bundle has a single `IKEA` card concept that would render as a generic plug-class card. DIRIGERA in this codebase is a **sensor hub**, not a plug provider. There is NO `outlets` / `plugs` / smart-plug endpoint exposed by `dirigeraProxy.ts` (verified by grep — only sensors).

**Resolution options (planner picks one):**
- **(a) Re-spec DirigeraCard to render sensor summary.** Header shows "IKEA" tone `#ffb84a`, right slot = `${summary.online_count}/${summary.total_count} online` or `${summary.low_battery_count} batt. basse`. Body lists up to 4 sensors with status dots (open contact = amber, motion-detected = amber, otherwise green/dim). Footer: `${summary.online_count} di ${summary.total_count} online`. Reuses `useDirigeraData` (returns `summary`) and optionally `useDirigeraFullData('all')` for the per-sensor body rows. Different content shape than DASH-10's plug spec but consistent with the card grid visuals.
- **(b) Drop DirigeraCard from the 9 cards.** Ship 9 cards = the bundle's exact card set minus dirigera (so: Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, **Tuya** — that's 9). DirigeraCard concept lands in a future phase when DIRIGERA gains outlet support. Update DEVICE_META + CARD_COMPONENTS accordingly. ROADMAP SC-#1 says "Tuya/Plugs" (one slot, two providers), suggesting either is fine.
- **(c) Delete the dashboard DirigeraCard but keep the legacy `app/components/devices/dirigera/DirigeraCard.tsx`** (which renders sensor stats and is consumed by /dirigera detail page). Same as (b) but explicit about the legacy preservation.

**Recommend (b)** — drop dirigera from the dashboard. ROADMAP SC-#1 lists "Tuya/Plugs" as a single equivalent slot; the 9 cards become 9 with Tuya as the sole plug-class provider. This honors SC-#1 verbatim, avoids forcing a sensor-summary card into a plug-spec, and defers DIRIGERA's dashboard presence to when it exposes plug control. The legacy `/dirigera` page keeps working unchanged. Confirm with user via planner.

**If planner picks (a):** DirigeraCard becomes a sibling-but-different shape. Header tone `#ffb84a` stays, label `"IKEA"`, CONTEXT D-23 right slot reads `${onlineCount}/${totalCount}` instead of total power. Body rows render contact-sensor name + open/closed dot (or motion-sensor name + motion-detected dot).

## Sonos Visibility Gate Resolution (LANDMINE 1)

**File:** `lib/services/unifiedDeviceConfigService.ts:65-72`

```typescript
// CURRENT — Sonos is filtered OUT
function hasHomepageCard(deviceId: DeviceId): boolean {
  // Sonos doesn't have a homepage card yet
  return deviceId !== 'sonos';
}
```

**Resolution:** Change to `return true;` (or delete the function and inline `true` at the call site `getVisibleDashboardCards`). Update the JSDoc comment one line up. This single change makes Sonos appear in `getVisibleDashboardCards()` output (subject to the user's `deviceConfig.devices[i].visible` flag — which defaults to `true` for sonos per `DEFAULT_DEVICE_ORDER`).

**Verification:** After the change, `DashboardCards.tsx`'s `visibleCards` array includes a `sonos` entry. `CARD_COMPONENTS['sonos']` already exists (`DashboardCards.tsx:13, 32`) and currently points at the legacy `app/components/devices/sonos/SonosCard.tsx`; Phase 177 swaps it to point at the new `app/components/EmberGlass/cards/SonosCard.tsx`. Existing JSDoc at line 67 (`/* All devices have homepage cards except those not in CARD_COMPONENTS (sonos for now) */`) becomes obsolete and should be deleted.

**Tests touched:** `lib/services/unifiedDeviceConfigService.test.ts` (if it exists — not verified) likely asserts the gate. Update.

## DashboardCards.tsx Migration — Before vs After

**BEFORE (current 152 lines):** Imports legacy device cards from `app/components/devices/<device>/[Device]Card.tsx`. Per-device skeleton registry. Dual-render block (mobile flex-col + desktop flex-row two-column masonry via `splitIntoColumns`).

**AFTER (Phase 177):** Imports new cards from `app/components/EmberGlass/cards/<Device>Card.tsx`. Single shared `<GlassCardSkeleton>` for every slot. Single grid render block. Identical SC + auth + config-fetch logic.

```tsx
// app/components/DashboardCards.tsx (AFTER — render block excerpt)
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import {
  StoveCard, ClimateCard, LightsCard, SonosCard, WeatherCard,
  CameraCard, NetworkCard, RaspiCard, TuyaCard, // DirigeraCard removed (recommend b)
  GlassCardSkeleton,
} from '@/app/components/EmberGlass';
import { getUnifiedDeviceConfigAdmin, getVisibleDashboardCards } from '@/lib/services/unifiedDeviceConfigService';
import { EmptyState } from './ui';
import { DeviceCardErrorBoundary } from './ErrorBoundary';

const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ClimateCard,    // device id 'thermostat' → component ClimateCard
  weather: WeatherCard,
  lights: LightsCard,
  camera: CameraCard,
  network: NetworkCard,
  raspi: RaspiCard,
  sonos: SonosCard,
  tuya: TuyaCard,
  // dirigera: DirigeraCard,  // (per recommended-(b) for LANDMINE 2)
};

const DEVICE_META: Record<string, { name: string; icon: string }> = { /* unchanged */ };

export default async function DashboardCards() {
  const session = await auth0.getSession();
  if (!session || !session.user) redirect('/auth/login');
  const userId = session.user.sub;
  const deviceConfig = await getUnifiedDeviceConfigAdmin(userId);
  const visibleCards = getVisibleDashboardCards(deviceConfig); // now includes sonos

  return (
    <>
      <div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3"
           data-testid="dashboard-grid">
        {visibleCards.map((card, index) => {
          const CardComponent = CARD_COMPONENTS[card.id];
          if (!CardComponent) return null;
          return (
            <div
              key={card.id}
              className="animate-spring-in transition-all duration-300 ease-out"
              style={{ animationDelay: `${index * 100}ms` }}
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
        <EmptyState icon="🏠" title="Nessun dispositivo configurato"
                    description="Aggiungi i tuoi dispositivi per iniziare" />
      )}
    </>
  );
}
```

**Diff summary for DashboardCards.tsx:**
- Imports collapse: 10 device-card imports → 9 EmberGlass-card imports (1 barrel)
- `splitIntoColumns` import + call deleted
- `Skeleton` import + 10-entry registry → single `<GlassCardSkeleton/>` literal
- Dual-block render (mobile flex-col + desktop flex-row masonry, lines 122-149) → single `grid grid-cols-2` block
- LOC delta: ~152 → ~85 (estimate)

## Stagger Mechanics — flatIndex Reasoning

**Current:** `splitIntoColumns(visibleCards)` parses cards into `{left, right}` arrays, each item carries `flatIndex` (its position in the flat order). Mobile uses raw `index`; desktop uses `flatIndex` from the split. Both feed `animationDelay: ${flatIndex * 100}ms`.

**After Phase 177:** Single render block with `visibleCards.map((card, index) => ...)`. The map callback's `index` IS the flat index. No split, no remap. CSS Grid lays children left-to-right, top-to-bottom — same visual stagger order as the bundle phone-frame intent.

**Why this still works for SC-#4:** The `animate-spring-in` keyframe at `app/globals.css:830` is a 0-to-1 scale + opacity entrance. It runs on mount once per child. With a 9-child grid and `animationDelay: index * 100ms`, the 9 cards stream in over 900ms. Indistinguishable from the dual-block flow.

**Reduced-motion:** `globals.css:1040` (Phase 174 era) gates `animate-spring-in` under `prefers-reduced-motion: reduce`. Already wired; no Phase 177 work.

## Runtime State Inventory

This is a presentational redesign. No databases, OS-registered state, secrets, or build artifacts carry the old card identities by name.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Firebase RTDB `users/{userId}/deviceConfig` references device IDs (`stove`, `thermostat`, ...), NOT card component names. The same IDs continue working. | None |
| Live service config | None — n8n/Datadog/etc. do not reference dashboard card names. | None |
| OS-registered state | None | None |
| Secrets / env vars | None | None |
| Build artifacts | None — no compiled binaries or installed packages embed the legacy big-card filenames. | None |

**Verified:** grep for `CARD_COMPONENTS`, `splitIntoColumns`, dashboard card names across `.env*`, `secrets/`, `scripts/` — only source files in `app/components/` and `lib/utils/dashboardColumns*` reference these. No external state.

## Common Pitfalls

### Pitfall 1: Reading the bundle as if it were live data
**What goes wrong:** Bundle's `state.stove.temp`, `state.thermostat.zones`, `state.sonos.groups` are mock data. The live hooks have different field names and shapes (e.g. `useThermostatData.status?.rooms`, `useSonosFullData.data?.zones`).
**Why it happens:** `cards.jsx` is the visual + behavior contract; treating it as the data contract leads to phantom fields.
**How to avoid:** For every card, the plan agent reads the relevant `use<Device>Data.ts` and types file BEFORE coding. The "Per-Card Content Shape Mapping" table above is the cross-reference.
**Warning signs:** TypeScript errors at `useStoveData().temp` etc.

### Pitfall 2: Hand-rolling memoization "for safety"
**What goes wrong:** Adding `useMemo`/`useCallback` to derive `onLights = lights.filter(l => l.on)` etc.
**Why it happens:** Habit from pre-Compiler era; Phase 95 deleted ~179 such hooks. Reintroducing them defeats RC's auto-memo and triggers SC-#5 failure.
**How to avoid:** Pure renders only. Derive in the function body. Trust React Compiler 1.0. Plan must include verification.
**Verification command:** `grep -rn "useMemo\|useCallback" app/components/EmberGlass/` — expect ZERO matches in new files. Run AFTER each card lands.
**Warning signs:** Anyone wraps `lights.filter(...)` in `useMemo`. Snapshot ESLint/RC healthcheck output.

### Pitfall 3: Forgetting `e.stopPropagation()` on the LightsCard master toggle
**What goes wrong:** Master toggle click bubbles to GlassCard's onClick → opens LightsSheet AND fires the toggle. UX feels broken.
**Why it happens:** Pressable's `onClick` fires on any descendant click unless explicitly stopped.
**How to avoid:** `<InlineToggle on={anyOn} onChange={(e) => { e.stopPropagation(); commands.handleAllLightsToggle(!anyOn); }} />` — the `e.stopPropagation()` is in the bundle (`cards.jsx:173`) for exactly this reason.
**Warning signs:** Playwright "click toggle does not open sheet" assertion fails.

### Pitfall 4: VersionEnforcer overlay blocking Playwright
**What goes wrong:** Playwright tests fail because a version-mismatch overlay covers the dashboard.
**Why it happens:** App version mismatches between server and client trigger an overlay (Phase 175 D-17 documented this).
**How to avoid:** Mirror Phase 175 + 176 spec scaffolding — mock `/api/version` to return a matching version OR dismiss the overlay in `beforeAll`. See `tests/smoke/sheet-primitive.spec.ts` for the precedent.
**Warning signs:** `[data-testid="version-overlay"]` visible in failing screenshots.

### Pitfall 5: Sonos `sonosBar0/1/2` keyframes missing
**What goes wrong:** PlayingBars component animation does nothing — bars are static.
**Why it happens:** Bundle declares `animation: sonosBar${i} 0.9s ease-in-out infinite` but the keyframes are not in `globals.css`.
**How to avoid:** Add the three keyframes (see "SonosCard" section above) plus the reduced-motion override.
**Warning signs:** SonosCard renders but bars do not pulse.

### Pitfall 6: Camera snapshot endpoint expects a 302 redirect
**What goes wrong:** `<img src="/api/camera/snapshot/{id}">` in CameraCard renders broken-image icon.
**Why it happens:** Phase 91 docs: snapshot endpoint returns a 302 redirect to a transient WiNet URL. `<img>` follows redirects natively, but server-side rendering or cache layers can break this.
**How to avoid:** Plain `<img>` in a Client Component. NOT `next/image` (would require `remotePatterns` for an unstable host). Cache-bust via `?t={timestamp}` query string — `useCameraData().lastUpdatedAt` is a clean source.
**Warning signs:** Browser network tab shows 302 → 404, or a CORS error from the redirect target.

### Pitfall 7: Aspect-ratio + dynamic content
**What goes wrong:** A card with too much body content (e.g., 4 zone rows + footer) overflows the 1:1 frame, gets clipped by `overflow: hidden` (CONTEXT D-04 GlassCard inherits `overflow: hidden`).
**Why it happens:** aspect-ratio caps height; tall content cannot expand the box.
**How to avoid:** All bundle row layouts use `flex flex-col gap-5` with `flex: 1` body and small text (11-13px). The bundle is already calibrated for 4-zone cards in 1:1. Plan agent does NOT increase row counts beyond 4 (DASH-04 limit) or font sizes beyond bundle.
**Warning signs:** Playwright snapshot shows truncated text or missing footer.

### Pitfall 8: Tailwind class collision with EmberGlass inline styles
**What goes wrong:** Adding Tailwind utility classes (e.g. `bg-stone-800`) on top of an inline-style EmberGlass surface that already sets `background: var(--glass-bg)`.
**Why it happens:** Inconsistent application of CONTEXT D-02. Tailwind utilities have lower specificity than inline styles, so the visual result is correct, but Phase 174 DS-02 grep audit (`no hardcoded glass/blur/accent colors in component files`) will flag it.
**How to avoid:** Strict separation. Tailwind only on the outer DashboardCards.tsx grid container. Inside cards/primitives: zero Tailwind classes for visual values. Layout flex utilities are also forbidden inside cards (use inline `display: 'flex'`). The new DSREF-style grep audit (Phase 174 D-12) is the canonical check.

## Code Examples

### CardHead primitive
```tsx
// app/components/EmberGlass/CardHead.tsx (NEW)
'use client';
import type { CSSProperties, ReactNode } from 'react';
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
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.2, flex: 1 }}>
        {label}
      </div>
      {right}
    </div>
  );
}
```
[CITED: bundle `cards.jsx:53-69` (verbatim port; replace `Icon size={18} sw={2}` with lucide's `strokeWidth`)]

### StatusDot primitive
```tsx
// app/components/EmberGlass/StatusDot.tsx (NEW)
'use client';

export interface StatusDotProps {
  on: boolean;
  color?: string; // defaults to var(--accent)
}

export function StatusDot({ on, color }: StatusDotProps) {
  const c = color ?? 'var(--accent)';
  return (
    <div
      data-testid="status-dot"
      style={{
        width: 8, height: 8, borderRadius: 999,
        background: on ? c : 'rgba(255,255,255,0.18)',
        boxShadow: on ? `0 0 12px ${c}` : 'none',
      }}
    />
  );
}
```
[CITED: bundle `cards.jsx:71-77`]

### InlineToggle primitive
```tsx
// app/components/EmberGlass/InlineToggle.tsx (NEW)
'use client';
import type { MouseEvent } from 'react';

export interface InlineToggleProps {
  on: boolean;
  color?: string;
  onChange: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function InlineToggle({ on, color = 'var(--accent)', onChange }: InlineToggleProps) {
  return (
    <button onClick={onChange} type="button" style={{
      width: 44, height: 26, borderRadius: 999, border: 'none',
      background: on ? color : 'rgba(255,255,255,0.15)',
      position: 'relative', cursor: 'pointer', padding: 0,
      transition: 'background .22s',
      boxShadow: on ? `0 0 12px color-mix(in oklab, ${color} 40%, transparent)` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 999,
        background: '#fff',
        transition: 'left .22s cubic-bezier(.34,1.56,.64,1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
```
[CITED: bundle `cards.jsx:419-435`. Note: caller passes `e => { e.stopPropagation(); commands.handleAllLightsToggle(!anyOn); }`]

### GlassCardSkeleton primitive
```tsx
// app/components/EmberGlass/GlassCardSkeleton.tsx (NEW)
'use client';

export function GlassCardSkeleton() {
  return (
    <div
      data-testid="glass-card-skeleton"
      className="animate-pulse"
      style={{
        position: 'relative',
        borderRadius: 'var(--r-card)',
        padding: 'var(--pad-card)',
        aspectRatio: '1 / 1',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
        border: '0.5px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ marginTop: 18, width: '60%', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ marginTop: 8, width: '80%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}
```
[Pattern: matches GlassCard 1:1 footprint; Tailwind `animate-pulse` is allowed here as a single shimmer utility — but plan agent may convert to inline `@keyframes shimmer` from `globals.css:804` if DSREF audit flags it]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two-column flexbox masonry (`splitIntoColumns`) | Single CSS Grid `grid-cols-2` with aspect-ratio per child | Phase 177 (this) | All cards 1:1; flatIndex stagger preserved; orphans `dashboardColumns.ts` |
| Per-device skeleton registry (`Skeleton.StovePanel` etc.) | Single shared `<GlassCardSkeleton>` for dashboard surface | Phase 177 | One shimmer for all 9 slots; legacy skeletons stay alive for detail pages |
| Big orchestrator cards on the dashboard (`devices/<x>/[Device]Card.tsx`) | Tiny presentational cards in `EmberGlass/cards/<Device>Card.tsx`, big ones stay on detail pages | Phase 177 | Dashboard is glanceable; full controls move to sheets (Phase 178) |
| Per-card data hook with own polling cadence | Same hooks; no changes | (unchanged) | All hooks already on 60s polling + WS primary (Phase 17.0) |
| Manual `useMemo`/`useCallback` everywhere | React Compiler 1.0 auto-memo | Phase 71 | ~179 hooks deleted in Phase 95; Phase 177 must not regress |
| Sonos hidden from dashboard (`hasHomepageCard('sonos') === false`) | Sonos shown on dashboard | Phase 177 | DASH-05 requires it; 1-line fix in `unifiedDeviceConfigService.ts` |

**Deprecated/outdated:**
- `lib/utils/dashboardColumns.ts` — orphaned by Phase 177. Plan flag for v20.0 cleanup phase deletion. Test stays alive (helper unchanged).
- Per-device dashboard skeleton entries (StovePanel/LightsCard/...) on dashboard mount — replaced by GlassCardSkeleton; still consumed by detail pages.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recommendation (b) for stove temp (use `power_level` as primary) is acceptable to the user | LANDMINE 3 / StoveCard | Low — easy to revert/swap to (a) Netatmo-coupled or (c) state-text in a follow-up; Phase 178 StoveSheet shows the full state regardless |
| A2 | Recommendation (b) for DIRIGERA (drop from dashboard) is acceptable to the user | LANDMINE 2 / DirigeraCard | Low — `useDirigeraData` continues serving `/dirigera` page; future phase can add a dashboard slot when DIRIGERA gains plug support |
| A3 | Sonos visibility flip is a 1-line change with no other downstream effects | LANDMINE 1 | Low — `getVisibleDashboardCards` filters by `visible && hasHomepageCard`; sonos's per-user `visible: true` default is already in `DEFAULT_DEVICE_ORDER`. Existing test for the helper (if any) needs update |
| A4 | `sonosBar0/1/2` keyframes can be added with the suggested heights without coordination from a designer | SonosCard / Pitfall 5 | Low — keyframe durations and counts are bundle-locked; only the height values are reasonable defaults that match the visual rhythm |
| A5 | `next/image` is NOT appropriate for camera snapshot (302 redirect to transient host) | CameraCard / Pitfall 6 | Medium — if `next/image` were viable, we'd get free perf win; verify by attempting and inspecting; fallback to plain `<img>` is documented |
| A6 | Camera resolution literal `"1080p"` is acceptable | CameraCard | Low — bundle uses literal `"1080p"`; planner can choose to omit |
| A7 | The single grid block layout is bundle-faithful even though bundle uses an iframe-style phone frame | Layout Strategy | Low — bundle `app.jsx:80-120` shows a 2-col grid container with `gap: 12`; phone frame is mock chrome around that grid |
| A8 | Existing v9.0 perf invariants (Phase 71 RC, Phase 73 stagger) are unchanged by Phase 177 | DASH-12 / Pitfall 2 | Low — purely additive new files + one render block edit |
| A9 | The `useThermostatData` hook's `status.rooms[]` is the correct source for ClimateCard zones | ClimateCard | Low — verified by reading `useThermostatData.ts:38-79`; planner should still confirm `topology.rooms[].id ↔ status.rooms[].room_id` join works in practice (test fixture covers this) |

**Empty-table indicator:** None — every claim in the table above flags an interpretive choice the planner must confirm or override.

## Open Questions

1. **Stove temperature source.**
   - What we know: Thermorossi proxy never exposed an ambient/board/water/smoke temperature. Bundle's StoveCard reads `state.stove.temp`. Netatmo provides per-room temperature.
   - What's unclear: Whether the user wants the bundle visual at the cost of cross-device coupling, or accepts a different primary (power_level / state text).
   - Recommendation: Ship (b) `power_level` now; document follow-up for (a) Netatmo-coupled in a future phase. Pre-PR question for the user.

2. **DIRIGERA dashboard presence.**
   - What we know: DIRIGERA exposes only contact + motion sensors. Bundle's `IKEA` card concept is plug-class. CONTEXT D-23 maps both to the same shape.
   - What's unclear: Whether the user wants DIRIGERA represented at all on the dashboard (sensor summary), or whether dropping it (Tuya covers the plug slot) is acceptable.
   - Recommendation: Ship (b) drop from dashboard. Confirm with user.

3. **Sonos master device picker.**
   - What we know: Phase 175/176 spec did not pre-clarify whether Sonos is required on the dashboard. ROADMAP SC-#1 lists it explicitly. Codebase has it disabled.
   - What's unclear: Why was `hasHomepageCard('sonos')` set to false? The JSDoc says "Sonos doesn't have a homepage card yet" — this Phase ships one.
   - Recommendation: Flip to true. No risk identified.

4. **CardHead `Icon` prop typing for lucide-react.**
   - What we know: Bundle uses custom `IconFlame size={18} sw={2}` syntax (sw = strokeWidth). lucide-react uses `<Flame size={18} strokeWidth={2} />`.
   - What's unclear: The lucide-react component type for `Icon` prop. Recommend `LucideIcon` from `lucide-react`.
   - Recommendation: `import type { LucideIcon } from 'lucide-react';` and type prop as `Icon: LucideIcon`.

5. **DashboardCards.test.tsx update scope.**
   - What we know: CONTEXT D-32 says update to assert grid, not masonry.
   - What's unclear: Whether the existing test mocks server-side `auth0.getSession()` and `getUnifiedDeviceConfigAdmin` — async server components are hard to unit-test.
   - Recommendation: Plan agent reads the existing test before redesigning it. Likely the test is rendered with a `Suspense` boundary client-side after a manual fixture; just swap the assertions.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm test`, `npm run dev` | ✓ | (existing) | — |
| Next.js dev server | Playwright smoke spec | ✓ | 16.1.0 | — |
| Playwright + Chromium | Smoke spec | ✓ (Phase 51 onward) | (existing) | — |
| Auth0 (real OAuth) | Smoke spec authentication | ✓ (Phase 97 storageState pattern) | — | — |
| Firebase RTDB | server-side `getUnifiedDeviceConfigAdmin` | ✓ | (existing) | — |
| HA proxy | runtime data for cards | ✓ | (existing X-API-Key) | Cards fall back to error states gracefully (CONTEXT D-26) |
| `lucide-react` icons | All cards | ✓ | (existing dep) | — |
| `@radix-ui/react-dialog` | Sheet primitive | ✓ | (existing dep) | — |
| `npx react-compiler-healthcheck` (CLI) | DASH-12 verification | ⚠️ NOT INSTALLED — package only exposes `babel-plugin-react-compiler` | — | Use eslint-plugin-react-compiler if installed; else fall back to grep `useMemo\|useCallback` in `app/components/EmberGlass/` |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- `react-compiler-healthcheck` CLI is not installed (`grep react-compiler-healthcheck package.json` empty). Plan agent verifies React Compiler discipline via:
  - Approach 1 — grep: `grep -rn "useMemo\|useCallback" app/components/EmberGlass/cards/ app/components/EmberGlass/{GlassCard,CardHead,StatusDot,MiniStat,PlayingBars,InlineToggle,GlassCardSkeleton}.tsx` should return zero matches.
  - Approach 2 — install the healthcheck on demand if user asks for it: `npx react-compiler-healthcheck`. Per CLAUDE.md Rule 4, do NOT install — invoke `npx` (which fetches transiently) only inside the verify step, not as a dependency.
  - Approach 3 — eslint with the React Compiler plugin if `eslint-plugin-react-compiler` is in deps. (Verify: `grep eslint-plugin-react-compiler package.json` — not verified in this research.)
  - Recommend Approach 1 for plan-time verification; Approach 2 in CI if the user wants the official check.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 (unit) + Playwright (E2E smoke) |
| Config file | `jest.config.*` (existing); `playwright.config.ts` (existing) |
| Quick run command | `npm run test:components` (jest scoped to `__tests__/app/components`) |
| Full suite command | `npm test` (release-only per CLAUDE.md Rule 8) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | 9 cards in 2-col grid, every child 1:1 | Playwright E2E | `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts -g "DASH-01"` | ❌ Wave 0 |
| DASH-02 | StoveCard renders correct primary + flame + subtitle | Jest | `jest app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx` | ❌ Wave 0 |
| DASH-03 | ClimateCard renders ≤4 zones + N/M | Jest | `jest app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx` | ❌ Wave 0 |
| DASH-04 | LightsCard renders ≤4 on-light names + +N + master toggle | Jest | `jest app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx` | ❌ Wave 0 |
| DASH-05 | SonosCard renders ≤4 groups + bars + count | Jest | `jest app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx` | ❌ Wave 0 |
| DASH-06 | WeatherCard renders temp + city + condition + hi/lo, NO sheet | Jest | `jest app/components/EmberGlass/cards/__tests__/WeatherCard.test.tsx` | ❌ Wave 0 |
| DASH-07 | CameraCard renders preview + LIVE pulse + source | Jest | `jest app/components/EmberGlass/cards/__tests__/CameraCard.test.tsx` | ❌ Wave 0 |
| DASH-08 | NetworkCard renders down + up + device count | Jest | `jest app/components/EmberGlass/cards/__tests__/NetworkCard.test.tsx` | ❌ Wave 0 |
| DASH-09 | RaspiCard renders MiniStat × 2 + temp footer, NO sheet | Jest | `jest app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx` | ❌ Wave 0 |
| DASH-10 | TuyaCard renders ≤4 plugs + total power + N/M, NO inline toggle | Jest | `jest app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx` | ❌ Wave 0 |
| DASH-11 | Tap interactive card → sheet opens; Weather/Raspi tap → no sheet | Playwright | `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts -g "DASH-11"` | ❌ Wave 0 |
| DASH-12 | Stagger present + zero new memoization opt-outs | Playwright + grep | `npx playwright test ... -g "DASH-12"` + `grep -rn "useMemo\|useCallback" app/components/EmberGlass/` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:changed` (jest --onlyChanged); per CLAUDE.md Rule 8 — never `npm test` alone from agents.
- **Per wave merge:** `npm run test:components` + (when Playwright tasks land) `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts`.
- **Phase gate:** `npm run test:components` + `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` green; React Compiler grep clean; full suite (`test:ci`) green if release gate.

### Wave 0 Gaps
- [ ] `tests/smoke/dashboard-glass-cards.spec.ts` — covers DASH-01, DASH-11, DASH-12 (layout, tap-to-open, stagger). Mirror `tests/smoke/sheet-primitive.spec.ts` scaffolding (real Auth0 storageState + VersionEnforcer handling).
- [ ] `app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx` — covers DASH-02
- [ ] `app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx` — covers DASH-03
- [ ] `app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx` — covers DASH-04 (incl. e.stopPropagation on toggle)
- [ ] `app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx` — covers DASH-05
- [ ] `app/components/EmberGlass/cards/__tests__/WeatherCard.test.tsx` — covers DASH-06 + asserts no Sheet
- [ ] `app/components/EmberGlass/cards/__tests__/CameraCard.test.tsx` — covers DASH-07
- [ ] `app/components/EmberGlass/cards/__tests__/NetworkCard.test.tsx` — covers DASH-08
- [ ] `app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx` — covers DASH-09 + asserts no Sheet
- [ ] `app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx` — covers DASH-10
- [ ] `app/components/EmberGlass/__tests__/GlassCard.test.tsx` — primitive
- [ ] `app/components/EmberGlass/__tests__/CardHead.test.tsx` — primitive
- [ ] `app/components/EmberGlass/__tests__/StatusDot.test.tsx` — primitive
- [ ] `app/components/EmberGlass/__tests__/MiniStat.test.tsx` — primitive
- [ ] `app/components/EmberGlass/__tests__/PlayingBars.test.tsx` — primitive
- [ ] `app/components/EmberGlass/__tests__/InlineToggle.test.tsx` — primitive
- [ ] `app/components/EmberGlass/__tests__/GlassCardSkeleton.test.tsx` — primitive
- [ ] Update `app/components/__tests__/DashboardCards.test.tsx` — assert grid not masonry
- [ ] Update `lib/services/__tests__/unifiedDeviceConfigService.test.ts` (if exists) — assert sonos in result

**Framework install:** None. Jest + Playwright already installed.

## Project Constraints (from CLAUDE.md)

| Rule | How Phase 177 Honors It |
|------|--------------------------|
| 1. NEVER break existing functionality | Detail pages (/stove, /lights, /sonos, /raspi, /network, /camera, /thermostat, /tuya, /dirigera) untouched; legacy big cards untouched; data hooks untouched |
| 2. WAIT for user confirmation before version updates | No version updates in scope |
| 3. PREFER editing existing files over creating new | Plan creates ~17 new files (necessary — primitives + cards + tests); modifies 2-3 existing (DashboardCards.tsx, unifiedDeviceConfigService.ts, possibly Skeleton.ts to add a shared export) |
| 4. NEVER execute `npm run build` or `npm install` | No build steps; no installs (lucide-react + radix-dialog already deps) |
| 5. ALWAYS create/update unit tests | 17 new Jest specs + 1 new Playwright spec + 1-2 updated specs (DashboardCards.test, unifiedDeviceConfigService.test) |
| 6. USE design system → `/debug/design-system` | EmberGlass primitives consume `/debug/design-system-v2` tokens; no Phase 177 work in /debug |
| 7. NEVER commit/push without explicit request | Plan commit hooks per gsd-sdk pattern |
| 8. USE scoped test subsets | Per-task uses `test:changed`; per-wave uses `test:components`; never agent-invoked `npm test` |

## Sources

### Primary (HIGH confidence)
- **Codebase grep + Read** (verified in this session):
  - `app/components/DashboardCards.tsx` — current masonry render block (lines 1-152)
  - `app/components/EmberGlass/{Pressable,Sheet,FlameViz,index}.tsx` — Phase 175/176 primitives
  - `app/components/devices/{stove,thermostat,lights,sonos,network,raspi,camera,tuya,dirigera,weather}/hooks/use*Data.ts` — live hook shapes
  - `lib/services/unifiedDeviceConfigService.ts:65-72, 295-319` — visibility gate + getVisibleDashboardCards
  - `lib/utils/dashboardColumns.ts` — splitIntoColumns helper (orphan after 177)
  - `lib/devices/deviceTypes.ts:240` — DEFAULT_DEVICE_ORDER (10 devices including sonos)
  - `types/{thermorossiProxy,netatmoProxy,hueProxy,sonosProxy,tuyaProxy,dirigeraProxy}.ts` — API response shapes
  - `app/globals.css:830` (animate-spring-in), `:1574` (pulse), `:1584` (flamePulse) — keyframes (sonosBar* MISSING)
  - `next.config.ts:19` `reactCompiler: true`
  - `package.json` — deps verified
  - `tests/smoke/sheet-primitive.spec.ts` — Playwright spec scaffolding precedent
  - `playwright.config.ts` — auth setup pattern
- **Design bundle (treated as PRIMARY visual + behavior contract per CONTEXT)**:
  - `.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 1-465 — full visual + behavior reference
- **Project planning docs**:
  - `.planning/REQUIREMENTS.md` §DASH-01..DASH-12 (lines 40-51) — 12 acceptance criteria
  - `.planning/ROADMAP.md` §"Phase 177" — 5 success criteria
  - `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` — 32 locked decisions
  - `.planning/phases/175-glass-primitives-press-animation-sheet/...` (referenced via CONTEXT) — Pressable + Sheet contracts

### Secondary (MEDIUM confidence)
- Phase memory (MEMORY.md sections "Ember Glass Redesign" v20.0) — corroborates primitive locations + bundle-fidelity convention.
- Phase 176 D-precedent — when bundle disagrees with HTML doc, bundle wins.

### Tertiary (LOW confidence)
- None for Phase 177 — every claim is grounded in code or the bundle.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep verified in package.json + existing files; no new installs.
- Architecture: HIGH — single render block edit; pure additive new files; CONTEXT.md is exhaustive.
- Per-card content shape: MEDIUM-HIGH — every hook field verified except the three LANDMINES (stove temp / DIRIGERA shape / Sonos visibility) which are flagged for explicit planner action.
- Pitfalls: HIGH — pitfalls 1, 4, 5, 6, 8 are codebase-grounded; pitfalls 2, 3, 7 are bundle/precedent-grounded.
- Tests: HIGH — Jest + Playwright scaffolding is precedented in Phase 175/176/97/51.

**Research date:** 2026-04-28
**Valid until:** 2026-05-12 (~14 days; longer than the typical 7-day fast-moving estimate because Next/React/lucide-react/radix-dialog are stable, the bundle is locked, and CONTEXT.md is exhaustive)

---

*Research complete. Three LANDMINES require explicit planner action before execution; recommended resolutions provided. Otherwise the path is clear and bundle-fidelity is achievable.*
