# Phase 177: Equal-Size Dashboard Glass Cards - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC, REQUIREMENTS.md DASH-01..DASH-12, the design bundle (`cards.jsx`), and Phases 174/175/176 locked CONTEXT/UI-SPEC.

<domain>
## Phase Boundary

Replace the existing masonry dashboard with a **9-card equal-size 1:1 glass-card grid** (Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, Tuya/Plugs). Each new card is a **summary-only** glass surface that shows the documented per-card content shape and (for interactive cards) opens a per-device sheet on tap. Phase 178 fills the sheet bodies; Phase 177 ships the cards plus the sheet open/close orchestration with a placeholder sheet body so the wiring is verifiable end-to-end.

In scope:
- 9 new equal-size summary cards under `app/components/EmberGlass/cards/<Device>Card.tsx` (Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, Tuya, Dirigera).
- A shared `<GlassCard>` base + `<CardHead>` + `<StatusDot>` + `<MiniStat>` + `<PlayingBars>` + `<InlineToggle>` set of micro-primitives in `app/components/EmberGlass/` ported verbatim from bundle `cards.jsx`.
- Replacement of the masonry layout in `app/components/DashboardCards.tsx` with a single `grid-cols-2` grid (mobile + desktop), aspect-ratio 1:1 per child, centered `max-w-md sm:max-w-2xl` container; preserve the v9.0 stagger (`animate-spring-in` + `animationDelay: flatIndex * 100ms`).
- Per-card `useState` for sheet open + a placeholder `<Sheet>` body ("Controlli in arrivo — Phase 178") rendered through the Phase 175 `<Sheet>` primitive so DASH-11 wiring is provable now. Phase 178 swaps the placeholder for the real sheet bodies (SHEET-02..06).
- Reuse of every existing device data hook (`useStoveData`, `useThermostatData`, `useLightsData`, `useSonosData`, `useNetworkData`, `useRaspiData`, `useCameraData`, `useTuyaData`, `useDirigeraData`, weather location subscription) — read-only summary fields only.
- A shared `<GlassCardSkeleton>` 1:1 square shimmer placeholder used as Suspense fallback in `DashboardCards.tsx` (replaces the per-device skeleton registry for the dashboard surface only — detail pages keep their existing skeletons).
- Tap-press behavior on every interactive card via Phase 175 `<Pressable>` (DS-07). WeatherCard + RaspiCard render as static glass surfaces (no `<Pressable>`, no onClick, no Sheet — SC-#3).
- Loading + stale + error gracefully rendered inside the 1:1 footprint (status dot color + last-known data; full error/banner UI moves to the Phase 178 sheets).
- Playwright smoke spec for grid shape, card-by-card content shape, tap → sheet open, stagger present, React Compiler health.
- Jest unit tests for each new card (renders summary correctly from mocked hook data + opens sheet on click for the 7 interactive cards, no sheet for Weather/Raspi).

Out of scope (future phases):
- Sheet bodies SHEET-02..06 (StoveSheet / ClimateSheet / LightsSheet / SonosSheet / PlugsSheet) — Phase 178.
- Replacing or deleting the existing big orchestrator cards (`app/components/devices/*/[Stove|Lights|...]Card.tsx`). They stay UNTOUCHED in this phase — they still mount on the legacy detail pages (`/stove`, `/lights`, `/sonos`, `/raspi`, etc.) and will be the harvest source for Phase 178 sheet bodies. A v20.0 cleanup phase removes any orphans after Phase 178.
- Rooms tab redesign (Phase 179), Automations tab (Phase 180), Glass bottom tab bar (Phase 181), Design System Reference Page v2 (Phase 182).
- Migrating the legacy `/debug/design-system` page or the legacy `Card.tsx`/`SmartHomeCard.tsx`/`DeviceCard.tsx` shells — they keep serving the legacy detail pages.
- Reduced-motion variants for the press / stagger transitions on the new cards. Phase 174/175/176 already established a sensible default; reduced-motion polish is deferred to a later phase.
- New hooks, new API routes, new device providers — strictly a presentational rebuild on top of existing data sources.
- Bottom tab bar (Phase 181) interaction with the dashboard — cards must not assume a bottom-fixed nav bar yet.

</domain>

<decisions>
## Implementation Decisions

### Component architecture & namespace
- **D-01:** All new files live under `app/components/EmberGlass/` — same namespace as Phase 174 (`AmbientBg`), Phase 175 (`Pressable`, `Sheet`), Phase 176 (`Splash`, `SplashGate`, `FlameViz`). Concrete layout:
  - `app/components/EmberGlass/GlassCard.tsx` — shared 1:1 glass card base with optional `tone`, optional `onClick`, internal `<Pressable>` wrap when interactive, polymorphic press behavior; lifts bundle `GlassCard` (`cards.jsx:7-54`) verbatim onto inline-style + `var(--token)` plumbing established by Phases 174/175.
  - `app/components/EmberGlass/CardHead.tsx` — `{ Icon, label, tone, right }` header row (bundle `cards.jsx:57-72`).
  - `app/components/EmberGlass/StatusDot.tsx` — `{ on, color }` 8px dot with optional glow (bundle `cards.jsx:74-80`).
  - `app/components/EmberGlass/MiniStat.tsx` — `{ label, value, bar }` 2-stat micro layout used by RaspiCard (bundle `cards.jsx:386-394`).
  - `app/components/EmberGlass/PlayingBars.tsx` — 3-bar Sonos animation (bundle `cards.jsx:262-272`).
  - `app/components/EmberGlass/InlineToggle.tsx` — iOS-style 44×26 toggle (bundle `cards.jsx:436-454`). Used by LightsCard header for the "all on / all off" master switch.
  - `app/components/EmberGlass/GlassCardSkeleton.tsx` — single shared 1:1 shimmer skeleton; identical for all 9 cards.
  - `app/components/EmberGlass/cards/StoveCard.tsx` — new dashboard summary card. Filename intentionally collides with `app/components/devices/stove/StoveCard.tsx` only across directories — imports disambiguate via path (`@/app/components/EmberGlass/cards/StoveCard`). No symbol-level collision since each is consumed in exactly one place.
  - `app/components/EmberGlass/cards/{Climate,Lights,Sonos,Weather,Camera,Network,Raspi,Tuya,Dirigera}Card.tsx` — same pattern.
  - `app/components/EmberGlass/index.ts` — barrel export for the new primitives + each card. Phases 178-181 import from this barrel; `DashboardCards.tsx` imports per-card from the barrel for treeshake hygiene.
- **D-02:** Inline-style + `var(--token)` convention from Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 is mandatory for the new EmberGlass surfaces. **Do NOT use Tailwind classes for visual values inside the new cards** — bundle visuals are the source of truth and they're inline. Tailwind layout primitives (`grid grid-cols-2 gap-3 max-w-md mx-auto`) are still allowed in `DashboardCards.tsx` itself because that's structural composition, not glass styling.
- **D-03:** Existing big orchestrator cards (`app/components/devices/<device>/[Device]Card.tsx`) are **NOT touched, NOT renamed, NOT deleted**. Reasons: (a) they're consumed by the existing detail pages; (b) Phase 178 will harvest sub-components / control bodies from them into the sheet bodies; (c) keeping them isolated keeps Phase 177's diff focused on dashboard summary visuals. The cleanup phase at the tail of v20.0 deletes whatever Phase 178 leaves orphaned.
- **D-04:** `<GlassCard>` API:
  ```tsx
  <GlassCard tone="var(--accent)" onOpen={() => setOpen(true)}>
    <CardHead Icon={IconFlame} label="Stufa" tone="var(--accent)" right={...} />
    {/* card body */}
  </GlassCard>
  ```
  - `tone?: string` — optional radial-gradient wash color in the top-right (bundle lines 32-37).
  - `onOpen?: () => void` — when provided, GlassCard wraps its root in `<Pressable>` (Phase 175 DS-07), sets `cursor: pointer`, and calls `onOpen` on click. When omitted, GlassCard renders as a static glass surface (WeatherCard, RaspiCard).
  - `style?: CSSProperties` — escape hatch for one-off overrides (CameraCard uses it for `overflow: hidden` per bundle `cards.jsx:308`).
  - `aspectRatio: '1 / 1'` is hard-coded inside `GlassCard` — every consumer is a square. SC-#1 is satisfied at the primitive level.
  - Internally renders Pressable + tone wash + inner highlight + content children, matching bundle `cards.jsx:14-50` verbatim.
- **D-05:** `<CardHead>` always rendered as the first child of every card; inline 32×32 colored icon tile + 13px label + optional `right` slot. Tone is the per-card class color (D-09). Icons come from `lucide-react` (already a dependency) — recommended mapping below.

### Layout (DASH-01)
- **D-06:** Replace masonry. New layout in `DashboardCards.tsx`:
  ```tsx
  <div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
    {visibleCards.map((card, index) => renderCard(card, index))}
  </div>
  ```
  - 2 columns at every viewport (mobile-first per ROADMAP SC-#1).
  - `gap-3` (12px) matches bundle `app.jsx` grid gap.
  - `max-w-md` (28rem) on mobile, `max-w-2xl` (42rem) on `sm+` so cards stay tappable / readable on tablet+ without exploding to billboard size. Beyond `2xl` width the container caps and the cards stay 1:1 with leftover whitespace — matches bundle phone-frame intent.
  - Mobile/desktop dual-render blocks deleted (`flex-col gap-6 sm:hidden` and `hidden sm:flex sm:flex-row gap-8 lg:gap-10`). Single grid handles both.
  - `splitIntoColumns` becomes orphan utility — `lib/utils/dashboardColumns.ts` and `dashboardColumns.test.ts` stay for now (referenced by Phase 69 history); flagged for deletion in the v20.0 cleanup phase.
- **D-07:** Aspect-ratio enforced **on `GlassCard` root** (`aspectRatio: '1 / 1'`) — not on the wrapper `<div>` in `DashboardCards.tsx`. This keeps the stagger wrapper a transparent positioning shell. Tailwind's `aspect-square` is NOT used because everything else in EmberGlass is inline-style for bundle fidelity.
- **D-08:** Stagger preservation (DASH-12) — keep the existing wrapper:
  ```tsx
  <div className="animate-spring-in transition-all duration-300 ease-out"
       style={{ animationDelay: `${flatIndex * 100}ms` }}>
    <GlassCard ...>...</GlassCard>
  </div>
  ```
  `animate-spring-in` keyframe is already in `app/globals.css:830` (ships from earlier phase). No keyframe edits required.
- **D-09:** Per-card tone palette — lifted verbatim from bundle. Hardcoded hex per card on purpose: tones identify device class, not user accent. The user's `--accent` is reserved for Stove (the spec already binds StoveCard to `var(--accent)` in bundle line 84).
  - StoveCard → `var(--accent)`
  - ClimateCard → `#5eafff`
  - LightsCard → `#f5c84a`
  - SonosCard → `#b080ff`
  - WeatherCard → `#ffb84a`
  - CameraCard → `#6aa86a`
  - NetworkCard → `#5eafff`
  - RaspiCard → `#6aa86a`
  - TuyaCard → `#ffb84a`
  - DirigeraCard → `#ffb84a` (Tuya/Dirigera both render as plug-class; DASH-10 spec applies to both)

### Press behavior (DS-07 forward, DASH-11)
- **D-10:** `GlassCard` wraps its root in `<Pressable>` automatically when `onOpen` is provided. The Pressable from Phase 175 D-03 (component form, not the hook) is used so SC-#1 grep verification ("every NEW glass surface in Phases 177-181 reuses Pressable") passes for all 7 interactive cards in one place.
- **D-11:** WeatherCard and RaspiCard render `<GlassCard>` **without `onOpen`** → no Pressable wrapper, no cursor pointer, no Sheet mounted. Matches SC-#3 ("WeatherCard and RaspiCard are explicitly read-only and do not open a sheet on tap"). Phase 175 SC-#1 is not violated — that criterion only applies to interactive surfaces.

### Tap → sheet wiring (DASH-11, forward dep on Phase 178)
- **D-12:** Each interactive card owns its own `useState<boolean>` for `sheetOpen`. Inside the card:
  ```tsx
  const [open, setOpen] = useState(false);
  return (
    <>
      <GlassCard tone="..." onOpen={() => setOpen(true)}>{summary}</GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
        <SheetPlaceholderBody phase="178" device="stove" />
      </Sheet>
    </>
  );
  ```
  - Each interactive card has its own Sheet. No dashboard-level orchestrator (state co-located keeps Phase 178 swap trivial — change one file at a time to land each real sheet body).
  - The `<Sheet>` primitive from Phase 175 is consumed unmodified.
- **D-13:** `<SheetPlaceholderBody>` lives at `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` and renders a single styled message (`"Controlli in arrivo nella Phase 178"` + small device-class icon). Once Phase 178 lands SHEET-02..06, this file is deleted along with the placeholder import in each card. Tracked as a cleanup item in Phase 178's deferred-items.
- **D-14:** Sheet `title` per card matches the CardHead `label` (`"Stufa"`, `"Clima"`, `"Luci"`, `"Sonos"`, `"Camera"`, `"Rete"`, `"Prese smart"`, `"IKEA"`). Italian copy stays consistent with the rest of the app.

### Per-card content shape (DASH-02..DASH-10)
- **D-15:** **StoveCard** (DASH-02) — bundle `cards.jsx:84-107` verbatim shape:
  - Header: `<CardHead Icon={IconFlame} label="Stufa" tone="var(--accent)" right={<StatusDot on={isAccesa} />} />`
  - Body: large temp readout (`fontSize: 36, fontFamily: var(--font-display), fontWeight: 600`, with `°C` superscript) + `<FlameViz on={isAccesa} intensity={powerLevel/5} />` absolute-positioned top-right; subtitle `"Fiamma {powerLevel} · Ventola {fanLevel}"` when on, `"Spenta"` otherwise.
  - Reuses `FlameViz` shipped in Phase 176 D-03 — single-line import from `@/app/components/EmberGlass`.
  - Data source: `useStoveData()` — fields needed: `status`, `isAccesa`, `temp` (current room temp; if not exposed at top level, derive from `status` payload), `powerLevel`, `fanLevel`, `staleness`. **Plan agent verifies the field names against the current hook before coding.**
  - Pulls icons from `lucide-react` `<Flame>`.
- **D-16:** **ClimateCard** (DASH-03) — bundle `cards.jsx:138-164` verbatim:
  - Header: icon `<Thermometer>`, label `"Clima"`, tone `#5eafff`, right slot = current `mode` text in 11px caps tracking.
  - Body: up to 4 zones rendered as rows (status dot + 11px name + tabular-nums temp). Footer `"{activeCount} di {zones.length} attive"`.
  - Data source: `useThermostatData()` — fields: `zones[]` with `name`, `current`, `on`, plus `mode` (string). **Plan agent confirms `useThermostatData` exposes a zones array; if not, lift transformation from existing ThermostatCard.**
- **D-17:** **LightsCard** (DASH-04) — bundle `cards.jsx:166-218` verbatim:
  - Header: icon `<Lightbulb>`, label `"Luci"`, tone `#f5c84a`, right slot = `<InlineToggle on={anyOn} color="#f5c84a" onChange={(e) => { e.stopPropagation(); handleAllToggle(); }} />`. The toggle's `e.stopPropagation()` is mandatory so the toggle does not also open the sheet.
  - Body when any light on: list of up to 4 on-light names + status dots; if more, `"+ altre {N}"` overflow row. Footer `"{onCount} di {totalCount} accese"`.
  - Body when no lights on: large `"Spente"` (28px display) + `"{N} disponibili"` subtitle.
  - Data source: `useLightsData()` — fields: `lights[]` with `name`, `on`. Master toggle calls existing `useLightsCommands().handleAllLightsToggle`.
  - **The header `<InlineToggle>` is the ONE inline control on a Phase 177 dashboard card.** All other interactivity (per-room, per-light, scenes) lives in LightsSheet (Phase 178).
- **D-18:** **SonosCard** (DASH-05) — bundle `cards.jsx:220-260` verbatim:
  - Header: icon `<Music>` (or `<Music2>`), label `"Sonos"`, tone `#b080ff`, right slot = `"{playingCount} in riprod."` or `"In pausa"`.
  - Body: up to 4 groups; each row = (`<PlayingBars />` if playing else 6×6 dim dot) + name + (track on second line, dimmed, when playing).
  - Data source: `useSonosFullData()` (the richer hook that already aggregates groups + zone state). Fields: `groups[]` with `name`, `playing`, `track`. **Plan agent confirms shape against current hook.**
- **D-19:** **WeatherCard** (DASH-06) — bundle `cards.jsx:200-218` verbatim, **read-only**:
  - Header: icon `<Sun>`, label `"Meteo"`, tone `#ffb84a`, right slot = city name in 11px dim.
  - Body: large `{temp}°` (40px display) + subtitle `"{condition} · ↑{high}° ↓{low}°"`.
  - Data source: existing weather pattern from `WeatherCardWrapper.tsx` — subscribe to location, fetch `/api/weather/forecast`, extract current + high/low. **Plan agent decides whether to: (a) wrap the existing fetch in a tiny `useWeatherSummary()` hook in `app/components/EmberGlass/cards/`, or (b) reuse `WeatherCardWrapper` shape inline.** Recommend (a) — keeps the new card pure and testable.
- **D-20:** **CameraCard** (DASH-07) — bundle `cards.jsx:308-340` shape, real preview source:
  - Header: icon `<Video>` (or `<Camera>`), label `"Camera"`, tone `#6aa86a`, right slot = LIVE pill (red 6×6 dot with `pulse 1.6s infinite` keyframe — already added by Phase 176 D-14 — + 10px `LIVE` text in `#ff4d5c`).
  - Body: a 14px-radius preview area (`flex: 1, marginTop: 4`) showing a **static snapshot** image from `/api/camera/snapshot/{cameraId}` (existing 302-redirect endpoint per memory v11.0 / Phase 91). Source label bottom-left, mono font (`ui-monospace`), 10px, dim white: `"{cameraName} · {resolution}"`.
  - Snapshot refreshes every ~10s via cache-busting `?t={Date.now()}` query param tied to `useAdaptivePolling` — no live HLS in the card (battery / perf). HLS is for the sheet (Phase 178).
  - Data source: `useCameraData()` — fields: list of cameras + name/resolution; pick first / primary camera for the dashboard tile.
- **D-21:** **NetworkCard** (DASH-08) — bundle `cards.jsx:344-360` verbatim:
  - Header: icon `<Wifi>`, label `"Rete"`, tone `#5eafff`, right slot = `<StatusDot on color="#6aa86a" />` (always-green when WAN reachable).
  - Body: large down-Mbps (22px display) `"{down}"` + dim `"Mbps ↓"`; subtitle `"{up} Mbps ↑ · {devices} dispositivi"`.
  - Data source: `useNetworkData()` — fields: `wan.downMbps`, `wan.upMbps`, `devices.length` (or equivalent). Plan agent maps exact field names.
- **D-22:** **RaspiCard** (DASH-09) — bundle `cards.jsx:364-376` verbatim, **read-only**:
  - Header: icon `<Cpu>`, label `"Raspberry"`, tone `#6aa86a`, right slot = `<StatusDot on color="#6aa86a" />`.
  - Body: 2-stat grid using `<MiniStat>` — CPU (`%` + bar) + RAM (`%` + bar). Footer: `"CPU temp {temp}°C"`.
  - Data source: `useRaspiData()` — fields: `data.cpuPct`, `data.ramPct`, `data.cpuTemp`. Plan agent verifies.
- **D-23:** **TuyaCard / DirigeraCard** (DASH-10) — bundle `cards.jsx:398-432` verbatim, applied **twice** (one for each provider):
  - Header: icon `<Plug>`, label `"Prese smart"` (Tuya) / `"IKEA"` (Dirigera), tone `#ffb84a`, right slot = `"{kW or W formatted}"` total power in 11px caps tabular-nums (auto-format: ≥1000W → `"X.YkW"`, else `"NW"`).
  - Body: list of up to 4 plug names + status dots.
  - Footer: `"{onCount} di {total} accese"`.
  - **No inline toggles on the card** (DASH-10 explicit). Toggles live in PlugsSheet (Phase 178).
  - Data sources: `useTuyaData()` / `useDirigeraData()` — fields: `plugs[]` with `name`, `on`, `power`. Plan agent verifies.

### Loading + stale + error inside 1:1 footprint
- **D-24:** **Skeleton fallback** — single shared `<GlassCardSkeleton>` per card slot. Replace per-device skeleton entries in `CARD_SKELETONS` registry with `GlassCardSkeleton`. The legacy `Skeleton.StovePanel` / `Skeleton.LightsCard` / etc. stay alive for legacy detail-page consumers but are no longer referenced by `DashboardCards.tsx`. Skeleton renders matching 1:1 footprint with subtle shimmer (`animate-pulse` + `bg-white/5`).
- **D-25:** **Stale data** — header `right` slot's `<StatusDot>` switches to amber (`#ffb84a`) when `staleness >= warning` threshold from the device's existing `useDeviceStaleness` / `staleness` field. No banner, no overlay — the dot is the only stale signal in the card.
- **D-26:** **Error / not-reachable** — when the data hook returns an error AND no cached data, render the `GlassCard` with the same header but body shows `"—"` placeholder where the primary numeric/text would go, plus a 10px footnote `"Non raggiungibile"` in `var(--text-2)`. Card stays tappable so the user can open the sheet; sheet (Phase 178) surfaces the full error UI.
- **D-27:** **Loading inside card** — once initial data arrives once, keep showing last-known data; refresh-spinners are NOT rendered inside the dashboard card. `useStoveData`/etc. already model `refreshing` separately from `loading`; ignore `refreshing` at the card level. The ambient connection indicator in the navbar (Phase 17.0 NavbarConnectionStatus) covers global connectivity.

### React Compiler memoization (DASH-12, SC-#5)
- **D-28:** No `useMemo`/`useCallback` introduced in the new card components or primitives. Pure-function components only; React Compiler 1.0 (Phase 71) auto-memoizes them. The plan must include a `npx react-compiler-healthcheck` step in `<verify><automated>` to fail loud if any new opt-out is introduced. Existing hooks (`useStoveData`, etc.) keep their current memoization discipline (we touch zero hook code).
- **D-29:** `Pressable` from Phase 175 is already RC-clean per Phase 175 D-03; reuse without modification. `Sheet` from Phase 175 likewise.

### Tests
- **D-30:** **Playwright spec** at `tests/playwright/dashboard-glass-cards.spec.ts`:
  - "DASH-01 grid shape" — load `/`, assert grid container has `grid-cols-2` and 9 children, each child's first `[data-testid="glass-card"]` has DOM-measured width === height (1:1) within 1px.
  - "DASH-02..DASH-10 per-card content shape" — for each card data-testid (`stove-card`, `climate-card`, ...), assert presence of the documented elements (e.g. StoveCard has `[data-testid="stove-temp"]` numeric, `[data-testid="flame-viz"]` rendered with the bundle gradient, etc.).
  - "DASH-11 tap → sheet open" — for each interactive card, click → assert `[data-testid="sheet-overlay"]` becomes visible AND `[data-testid="sheet-title"]` matches the card label. Assert WeatherCard + RaspiCard taps do NOT open any sheet.
  - "DASH-12 stagger present" — assert each child has `style.animationDelay` increasing by 100ms.
  - Playwright `prefersReducedMotion` is NOT exercised in this phase (deferred — see out-of-scope).
  - Reuse `collectConsoleErrors` helper (Phase 97 pattern) — zero console errors during dashboard mount.
  - VersionEnforcer overlay (Phase 175 known issue, Phase 176 D-28) — handle in beforeAll the same way the splash spec handles it.
- **D-31:** **Jest unit tests** under `app/components/EmberGlass/cards/__tests__/`:
  - One spec per card. Each spec mocks the relevant hook with a small fixture (on / off / stale / error variants), asserts the rendered content matches the per-card content spec (D-15..D-23), asserts `setSheetOpen(true)` is called on click for the 7 interactive cards, asserts no Sheet ever mounts for Weather/Raspi.
  - One spec per primitive (`GlassCard`, `CardHead`, `StatusDot`, `MiniStat`, `PlayingBars`, `InlineToggle`, `GlassCardSkeleton`).
- **D-32:** Existing dashboard test at `app/components/__tests__/DashboardCards.test.tsx` is updated to assert the new grid layout shape, not the old masonry; the masonry-specific helper `splitIntoColumns` test stays alive (no behavior change to the helper) but is flagged orphan in DISCUSSION-LOG.

### Folded Todos
None — `gsd-sdk query todo.match-phase 177` returned 0 matches.

### Claude's Discretion
- Whether the seven micro-primitives (`GlassCard`, `CardHead`, `StatusDot`, `MiniStat`, `PlayingBars`, `InlineToggle`, `GlassCardSkeleton`) ship as 7 separate files or are colocated in a `primitives.tsx` barrel. **Recommend separate files** to make Phase 178 (which will reuse `<MiniStat>`, `<InlineToggle>`, `<PlayingBars>`) trivial to import.
- Whether `<SheetPlaceholderBody>` accepts a `phase` prop or hardcodes `"Phase 178"`. Trivial detail.
- Whether to add `data-testid` attributes to every primitive or only to test-meaningful spots (`glass-card`, `stove-temp`, `flame-viz`, `playing-bars`, `inline-toggle`, etc.). **Recommend yes for stable selectors** — same rationale as Phase 176 D-27.
- Whether `useWeatherSummary()` lives in `cards/WeatherCard.tsx` or extracts to `app/components/devices/weather/hooks/useWeatherSummary.ts`. **Recommend extracting to the existing weather folder** so Phase 178's WeatherSheet can reuse it (if SHEET roadmap ever calls for it; currently no WeatherSheet is on the roadmap).
- Whether to delete the per-device `Skeleton.StovePanel`/etc. exports from `Skeleton.ts` after the dashboard switches to `<GlassCardSkeleton>`. **Recommend leave alone** — they're still consumed by the device hooks' loading guards (`if (loading) return <Skeleton.LightsCard />` inside `LightsCard.tsx` line 77 and other big cards). Cleanup phase deletes them with the orphaned big cards.
- Whether the camera snapshot poll cadence is owned by `useCameraData()` (existing) or by a new card-local interval. **Recommend reuse** — the hook already polls; the card consumes a `snapshotUrl` field. Plan agent confirms.
- Order in which the 9 cards are rendered — `getVisibleDashboardCards()` from `unifiedDeviceConfigService.ts` already returns the user-configured order. Preserve.
- Where the 9 `data-testid` attributes are anchored (root `<GlassCard>` div vs the wrapper stagger `<div>`). **Recommend root `<GlassCard>` div** so Playwright can measure 1:1 directly.
- Lucide icon choice for the Climate card — `<Thermometer>` vs `<ThermometerSun>` etc. Bundle uses `IconThermo` (custom). Pick `<Thermometer>` for clarity.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §DASH-01..DASH-12 (lines 40-51) — Twelve locked acceptance criteria for this phase.
- `.planning/REQUIREMENTS.md` §SHEET-01 (line 55) — Sheet primitive contract (Phase 175); the new cards open this primitive in Phase 177.
- `.planning/REQUIREMENTS.md` §SHEET-02..06 (lines 56-60) — Forward dependency on Phase 178; placeholder bodies in Phase 177 are swapped here.
- `.planning/ROADMAP.md` §"Phase 177: Equal-Size Dashboard Glass Cards" — Goal + 5 success criteria. SC-#1 locks 2-col 1:1 grid + 9 named cards; SC-#2 locks per-card content spec; SC-#3 locks tap → sheet + Weather/Raspi exclusion; SC-#4 locks stagger preservation; SC-#5 locks React Compiler health.
- `.planning/ROADMAP.md` §"Phase 178: Per-Device Modal Sheets" — confirms the five sheets (Stove/Climate/Lights/Sonos/Plugs) that Phase 177 placeholders forward to.

### Source Design Bundle (PRIMARY visual + behavior source)
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 1-465 — **Authoritative** source for `GlassCard`, `CardHead`, `StatusDot`, `MiniStat`, `PlayingBars`, `InlineToggle`, plus all 9 individual cards. Constants (px values, transitions, gradients, copy) are lifted verbatim. When this bundle disagrees with the HTML doc, bundle wins (Phase 176 D-precedent).
- `.planning/inbox/ember-glass-design/project/components/app.jsx` lines 80-120 — Outer layout container + grid-gap = 12px reference for `DashboardCards.tsx`.
- `.planning/inbox/ember-glass-design/project/Design System.html` — Visual reference for `/debug/design-system-v2`; new cards are not (yet) registered in that page (Phase 182 handles that).

### Prior Phase Decisions
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` D-01..D-19 — Tokens (`--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--accent`, `--text-1`, `--text-2`, `--r-card`, `--pad-card`, `--font-display`) consumed by every new card. `EmberGlass/` namespace + inline-style convention.
- `.planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md` line 360 — Names Phase 175's two new files in the namespace; sets the precedent for Phase 177's `cards/` subfolder.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-03..D-06 — `<Pressable>` + `usePressed()` + `.press-anim` API (DS-07) consumed by every interactive card. SC-#1 grep verification responsibility moves into Phase 177's plan-check (each new glass surface must be wrapped in `<Pressable>`).
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-07..D-13 — `<Sheet>` primitive API (`<Sheet open onClose title>`), z-index 200/201, scroll-lock + restore. Each card mounts one `<Sheet>` instance. The placeholder body in Phase 177 obeys all of D-07's prop contract.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-17 — VersionEnforcer overlay is a known Playwright blocker. Phase 177 spec must handle it the same way (mock version endpoint or dismiss before measurement).
- `.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md` D-03 — `<FlameViz>` ships from EmberGlass; Phase 177 StoveCard imports it (the planned reuse referenced in Phase 176 D-03).
- `.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md` D-14 — `pulse` keyframe (1.6s infinite) added to `app/globals.css`; CameraCard reuses for the LIVE badge.

### Existing Codebase Touchpoints
- `app/components/DashboardCards.tsx` — Replace masonry render block + skeleton registry; keep server-side auth check + `getVisibleDashboardCards()` + per-card Suspense + `DeviceCardErrorBoundary` wrappers.
- `app/page.tsx` — Untouched. Already wraps in `<Suspense fallback={<DashboardSkeleton />}>` and `app/loading.tsx` covers the initial dashboard skeleton.
- `app/loading.tsx` — Untouched. Already shows skeleton during server-side data fetch.
- `app/components/EmberGlass/index.ts` — Add 7 primitive exports + 9 card exports.
- `app/components/EmberGlass/AmbientBg.tsx` — Sibling primitive; same convention.
- `app/components/EmberGlass/Pressable.tsx` — Consumed by `<GlassCard>`.
- `app/components/EmberGlass/Sheet.tsx` — Consumed once per interactive card.
- `app/components/EmberGlass/FlameViz.tsx` — Consumed by `<StoveCard>`.
- `app/components/devices/<device>/hooks/use<Device>Data.ts` (and `useThermostatData`, `useCameraData`, `useTuyaData`, `useDirigeraData`, `useRaspiData`, `useNetworkData`, `useSonosFullData`, `useLightsData`) — All reused as-is. Plan agent reads each to confirm field names exposed at the hook surface.
- `app/components/devices/lights/hooks/useLightsCommands.ts` — `handleAllLightsToggle` consumed by LightsCard header InlineToggle.
- `app/components/devices/weather/WeatherCardWrapper.tsx` — Reference for the location subscription + forecast fetch pattern; new `useWeatherSummary()` (D-19) extracts the read-only summary slice.
- `lib/utils/dashboardColumns.ts` — Becomes orphan after this phase (no longer called from `DashboardCards.tsx`); flagged for cleanup-phase deletion.
- `lib/services/unifiedDeviceConfigService.ts` — `getVisibleDashboardCards()` returns the device order; preserve.
- `app/components/ui/Skeleton.ts` — Per-device skeleton entries (`StovePanel`, `LightsCard`, etc.) still consumed by the legacy detail pages. Add `Skeleton.GlassCard` (or stand-alone `GlassCardSkeleton` import) for dashboard use.
- `app/globals.css` — Provides `animate-spring-in` (line 830), `pulse` (Phase 176), `flamePulse` (FlameViz). No edits needed unless plan agent finds a missing keyframe (e.g., Sonos `sonosBar0/1/2` from bundle `cards.jsx:265-271` — verify exists or add).
- `package.json` — `lucide-react`, `@radix-ui/react-dialog` already deps. No installs.

### Patterns
- Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 — Inline-style + `var(--token)` for all `EmberGlass/` v2 primitives.
- Phase 51 + Phase 97 — `collectConsoleErrors` helper for Playwright; real-Auth0 + session-caching for sign-in.
- Phase 71 — React Compiler 1.0 auto-memo; `npx react-compiler-healthcheck` runs in CI.
- Phase 73 — `initialDelay` + `animate-spring-in` stagger pattern.
- Phase 96 — `useAdaptivePolling(60s)` rhythm for device hooks; CameraCard snapshot refresh leans on this.
- Phase 17.0 — `NavbarConnectionStatus` covers global connectivity; cards skip per-card connection UI.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 174/175/176 primitives** — `<AmbientBg>`, `<Pressable>`, `<Sheet>`, `<FlameViz>` all live in `app/components/EmberGlass/` and consume the locked token block. Phase 177 builds on top with zero modifications to these.
- **Existing data hooks** — every device already has a polling+WS hook (Phase 17.0 milestone): `useStoveData`, `useThermostatData`, `useLightsData`, `useSonosFullData`, `useNetworkData`, `useRaspiData`, `useTuyaData`, `useDirigeraData`, `useCameraData`. Camera + weather are the two with the most variance — confirm field shapes early.
- **Stagger animation** — `animate-spring-in` keyframe lives in `app/globals.css:830`. The wrapper `<div className="animate-spring-in" style={{ animationDelay: `${i * 100}ms` }}>` is already established in `DashboardCards.tsx:107`.
- **DeviceCardErrorBoundary** — wraps each card in `DashboardCards.tsx:110`. Reused unchanged; new tiny cards live inside it. Boundary error UI is Phase-pre-v20.0 styling — that's fine; it only shows when a card crashes, not in normal operation.
- **lucide-react icons** — already a dep; mapping (Flame, Thermometer, Lightbulb, Music, Sun, Video/Camera, Wifi, Cpu, Plug) covers all 9 card heads.
- **`@radix-ui/react-dialog`** — already wired through `<Sheet>` (Phase 175). No new install.
- **Server-side auth + device-config fetch** — `DashboardCards.tsx` already does session check + `getUnifiedDeviceConfigAdmin(userId)` + `getVisibleDashboardCards(deviceConfig)`. Preserve verbatim.

### Established Patterns
- **`'use client'` for state-bearing components** — every new card has its own `useState<boolean>` for sheet open + reads its data hook → `'use client'` at top of every `cards/<Device>Card.tsx`.
- **Inline `style` + `var(--token)` for EmberGlass v2 surfaces** — Phase 174 D-12, Phase 175 D-08, Phase 176 D-23. All 7 micro-primitives + 9 cards follow.
- **Tests colocated** — Jest specs in `app/components/EmberGlass/cards/__tests__/`, Playwright in `tests/playwright/dashboard-glass-cards.spec.ts`.
- **Orchestrator pattern (Phase 58/59)** — applies to the LEGACY big cards (which stay alive for detail pages). New tiny cards are too small to be orchestrators; they're presentational + one tiny piece of local sheet-open state.
- **`data-testid` for stable Playwright selectors** — Phase 176 D-27 precedent. Apply per-card and per-primitive.
- **No `useMemo`/`useCallback`** — Phase 71/95 / React Compiler discipline. New cards are pure renderers; rely on auto-memo.
- **`getVisibleDashboardCards()`** drives the visible+ordered list. Don't hardcode the order in `DashboardCards.tsx`.

### Integration Points
- `app/components/DashboardCards.tsx` — single dashboard-rendering edit. Registry swap + grid replacement + skeleton swap.
- `app/components/EmberGlass/index.ts` — 7 primitive exports + 9 card exports + `<GlassCardSkeleton>` + `<SheetPlaceholderBody>`.
- `app/globals.css` — verify Sonos `sonosBar0/1/2` keyframes exist; add if missing (bundle `cards.jsx:265-271` references them).
- `tests/playwright/dashboard-glass-cards.spec.ts` — new Playwright spec (mirror Phase 175/176 spec scaffolding).
- `app/components/EmberGlass/cards/__tests__/*.test.tsx` — 9 new Jest specs.
- `app/components/EmberGlass/__tests__/{GlassCard,CardHead,StatusDot,MiniStat,PlayingBars,InlineToggle,GlassCardSkeleton}.test.tsx` — 7 new Jest specs for primitives.
- No edits to: `app/page.tsx`, `app/loading.tsx`, `app/layout.tsx`, `Navbar.tsx`, any device hook, any API route, `lib/utils/dashboardColumns.ts`, the legacy big cards.

</code_context>

<specifics>
## Specific Ideas

- **Bundle is the source of truth.** Every pixel value (`32px`, `13px`, `40px`, `8px`, `0.97`, `220ms`, `400ms`), every gradient, every transition curve in the bundle is lifted verbatim. When in doubt, open `cards.jsx` and copy.
- **Italian copy:** `"Stufa"`, `"Clima"`, `"Luci"`, `"Sonos"`, `"Meteo"`, `"Camera"`, `"Rete"`, `"Raspberry"`, `"Prese smart"`, `"IKEA"`. Subtitle copy: `"Spenta"`, `"Fiamma N · Ventola N"`, `"N di M attive"`, `"+ altre N"`, `"N di M accese"`, `"Spente"`, `"N disponibili"`, `"N in riprod."`, `"In pausa"`, `"Non raggiungibile"`. Use middle-dot `·` (U+00B7), arrows `↑ ↓` (U+2191 / U+2193), ellipsis `…` (U+2026) as needed.
- **Tones are device-class colors, NOT user-themable.** Only StoveCard binds to `var(--accent)`. The other 8 keep their bundle hex values across the 6 user accent presets. This is intentional — accent themes the splash + select micro-affordances, not the entire dashboard palette.
- **Camera snapshot, not HLS.** Dashboard is a glanceable summary; HLS belongs in the sheet (Phase 178). 10-second snapshot refresh is plenty for a thumbnail.
- **No reduced-motion handling in 177.** Phase 174/175/176 establish defaults; Phase 177 relies on those. A later polish phase can backport `@media (prefers-reduced-motion: reduce)` to stagger + press if needed.
- **No new hooks for stove/climate/lights/sonos/network/raspi/tuya/dirigera/camera.** All existing. Only Weather may grow a small `useWeatherSummary()` (D-19).
- **9 cards now, but device-config could expose fewer at any moment.** `getVisibleDashboardCards()` returns 0-9. Empty state preserved (existing `EmptyState` in `DashboardCards.tsx`). Tests cover 0, 1, all-9 scenarios.
- **PlayingBars uses `sonosBar0/1/2` keyframes** (bundle `cards.jsx:267-269`). Plan agent verifies they exist in `globals.css`; if not, add them with the bundle definitions.

</specifics>

<deferred>
## Deferred Ideas

- **Sheet bodies SHEET-02..06** — Phase 178. The placeholder body shipped here is replaced one card at a time when Phase 178 lands.
- **Reduced-motion overrides** for stagger / press / ambient on the new dashboard. Defer to a polish phase; Phase 174/175/176 defaults cover sensible behavior.
- **Migration of legacy big orchestrator cards** (`app/components/devices/<device>/[Device]Card.tsx`) into Phase 178 sheets, plus a v20.0 cleanup phase that deletes orphans (`splitIntoColumns` helper, per-device skeletons, `Card.tsx`/`SmartHomeCard.tsx`/`DeviceCard.tsx` shells if they go unused).
- **HLS preview in CameraCard** — Phase 178's CameraSheet can promote to live HLS. Dashboard stays on snapshots for battery/perf.
- **Dashboard-level sheet orchestrator** (single state instead of per-card) — wait for Phase 178 to demonstrate whether nested sheet stacking is required (probably not).
- **3-col / 4-col layout on lg+ viewports** — bundle is 2-col phone frame; defer until product demand justifies departure.
- **Per-card connection indicator pills / banners** — global indicator (Phase 17.0 NavbarConnectionStatus) covers it. Per-card pills would add noise to the 1:1 footprint.
- **Dirigera vs Tuya consolidation into one PlugsCard** — current design ships both as separate cards (each provider is its own device-config row). If consolidation is wanted, that's a config-service redesign in a later phase.
- **Animation when sheet open hides card content** — out of scope; Phase 175 Sheet handles z-index 200/201 above the dashboard cleanly.
- **Long-press / swipe gestures on cards** — out of scope; tap-to-open only.
- **Web Vitals telemetry for dashboard mount** — could leverage v9.0 perf milestone tooling. Out of v20.0 scope; potential follow-up.

</deferred>

---

*Phase: 177-equal-size-dashboard-glass-cards*
*Context gathered: 2026-04-28*
