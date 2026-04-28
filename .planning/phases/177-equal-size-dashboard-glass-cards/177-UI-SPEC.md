---
phase: 177
slug: equal-size-dashboard-glass-cards
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-28
---

# Phase 177 — UI Design Contract

> Visual and interaction contract for the equal-size 1:1 dashboard glass-card grid (9 cards). Bundle-faithful translation of `.planning/inbox/ember-glass-design/project/components/cards.jsx` onto the Phase 174 token block + Phase 175 `<Pressable>` / `<Sheet>` primitives + Phase 176 `<FlameViz>`. Mode: `--auto` — no interactive questions; gray areas resolved against bundle and noted in **Assumptions Log**.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual — Ember Glass v2 token system, Phase 174) |
| Preset | not applicable |
| Component library | Radix (`@radix-ui/react-dialog` via `<Sheet>`) + custom EmberGlass primitives |
| Icon library | `lucide-react` (already a dep) |
| Font | Outfit (`var(--font-display)`) + Inter (`var(--font-body)`) — self-hosted via `next/font` (Phase 174 DS-04) |

**Token consumption (Phase 174 — locked, do NOT redefine in Phase 177):**

| Token | Value | Where used |
|-------|-------|------------|
| `--glass-bg` | `rgba(255, 255, 255, 0.04)` | GlassCard background |
| `--glass-blur` | `24px` | GlassCard `backdrop-filter` |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | GlassCard 0.5px border |
| `--glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.03)` | GlassCard `box-shadow` |
| `--accent` | `oklch(0.68 0.17 45)` (default copper) | StoveCard tone, FlameViz, MiniStat progress fill |
| `--text-1` | `#f5f5f4` | Primary text in active state |
| `--text-2` | `rgba(245, 245, 244, 0.55)` | Secondary text, dim labels, subtitle |
| `--r-card` | `24px` | GlassCard `border-radius` |
| `--pad-card` | `16px` | GlassCard `padding` |
| `--font-display` | Outfit | Numeric readouts, headings |
| `--font-body` | Inter | All other text |

**Inline-style + `var(--token)` mandate (D-02):** All EmberGlass v2 surfaces use `style={{ ... }}` with token references — Tailwind classes are reserved for layout primitives only (`grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3` on the dashboard outer container). No Tailwind for visual values inside the cards.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| 2 | 2px | Inner toggle thumb offset (top: 2, left: 2/20); `marginLeft: 2` on °C superscript |
| 4 | 4px | LIVE-pill icon gap; CameraCard preview `marginTop: 4` |
| 5 | 5px | Inter-row gap in zone/light/sonos/plug list (`gap: 5`); `marginTop: 5` MiniStat bar |
| 6 | 6px | StatusDot/MiniStat/list-row interior gaps; subtitle `marginTop: 6`; NetworkCard inner gap |
| 8 | 8px | `gap: 8` for 2-stat MiniStat grid; subtitle/footer `marginTop: 8`; CameraCard preview-label inset |
| 10 | 10px | CardHead horizontal gap (icon→label); CameraCard label `left: 10`; AlbumArt small radius (sheet harvest only) |
| 12 | 12px | `gap-3` (= 12px) between dashboard cards in the 2-col grid |
| 14 | 14px | CameraCard preview `borderRadius`; CardHead `marginBottom: 14` |
| 16 | 16px | `--pad-card` (GlassCard interior padding) |
| 24 | 24px | `--r-card` (GlassCard outer radius) |
| 32 | 32px | CardHead icon tile (32×32) |

**Exceptions (intentional — bundle-verbatim):**
- `1.5px` gap in `<PlayingBars>` (3-bar Sonos animation, sub-grid micro-affordance — bundle `cards.jsx:273`).
- `0.5px` border on GlassCard, CardHead icon-tile, CameraCard preview (sub-pixel hairline for retina glass — bundle convention).
- `3px` MiniStat progress bar height (purposefully thinner than the 4-multiple — bundle `cards.jsx:379`).
- `9px` PlayingBars container height (bundle `cards.jsx:273`).
- `44×26` InlineToggle outer; `22×22` thumb (iOS-standard switch dimensions — bundle `cards.jsx:420-432`).
- `34×34` CircBtn (sheet-harvest primitive, not used on Phase 177 cards but defined alongside InlineToggle).

These exceptions are on micro-affordances inside cards. The 8-point scale governs all card-level layout (padding, gaps, margins).

**Outer footprint (DASH-01, locked):**
- Aspect-ratio: **`1 / 1`** hard-coded inside `<GlassCard>` root (D-07).
- Container width: `max-w-md` (28rem = 448px) on mobile, `max-w-2xl` (42rem = 672px) on `sm+`. `mx-auto px-3`.
- Grid: `grid grid-cols-2 gap-3` at every viewport.
- At 360–440px viewport (mobile-first target): each card ≈ 168–212px square.
- At 672px container: each card ≈ 330px square.

---

## Typography

**3 sizes for primary readouts, 1 size for labels/captions, 1 weight ladder (semibold + medium + regular).** Numerics use `var(--font-display)` (Outfit, `font-variant-numeric: tabular-nums` where lists align). Body text uses `var(--font-body)` (Inter — set globally on `<body>`).

| Role | Size | Weight | Line Height | Family | Where |
|------|------|--------|-------------|--------|-------|
| Display Large | 40px | 600 | 1 | `var(--font-display)` | WeatherCard temp (`letter-spacing: -1`) |
| Display Medium | 36px | 600 | 1 | `var(--font-display)` | StoveCard temp (`letter-spacing: -1.2`) |
| Display Small | 28px | 600 | 1 | `var(--font-display)` | LightsCard "Spente" empty state |
| Stat Mid | 22px | 600 | (default) | `var(--font-display)` | NetworkCard down-Mbps |
| Stat Small | 15px | 600 | (default) | `var(--font-display)` | MiniStat value |
| Body | 12px | 400 (regular) | (default) | `var(--font-body)` | Subtitle / footer copy ("Fiamma N · Ventola N", "Spenta", "{N} disponibili", "{up} Mbps ↑ · {N} dispositivi", "CPU temp {N}°C") |
| Label | 13px | 600 | (default) | `var(--font-body)` | CardHead label ("Stufa", "Clima", …) — `letter-spacing: 0.2` |
| Caption | 11px | 500 (medium) or 600 | (default) | `var(--font-body)` | List rows (zone/light/plug name + temp); right-slot caps text ("N in riprod.", mode label, total power) |
| Micro | 10px | 500 or 700 | (default) | `var(--font-body)` (or `ui-monospace` for camera label) | "+ altre N" overflow row; LIVE pill (700, `letter-spacing: 0.5`); CameraCard source label (mono) |

**Superscript inside displays:** °C / ° suffix renders at `fontSize: 16` (StoveCard) or `fontSize: 18` (WeatherCard) with `opacity: 0.5` / `0.4` — visual subordination, not a separate role.

**Font-variant-numeric:** `tabular-nums` applied on every aligning numeric (zone temps in ClimateCard list, total-power in TuyaCard right slot).

**Weights summary (declared):** 400 regular, 500 medium, 600 semibold, 700 bold (LIVE pill only — bundle `cards.jsx:313`). Total: 4 weights, but 90% of copy uses 500/600. The 400 baseline ships from Inter; 700 only appears on the camera LIVE pill.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#1a0f08` body bg + `var(--glass-bg)` rgba glass overlay | App shell + every card surface (translucent layer over the AmbientBg radial glow) |
| Secondary (30%) | `var(--text-1)` (`#f5f5f4`) text + `var(--text-2)` (rgba(245,245,244,0.55)) dim text | Card text, list rows, labels |
| Accent (10%) | `var(--accent)` (`oklch(0.68 0.17 45)` copper default) | **StoveCard only** (tone wash, FlameViz body), MiniStat progress fill, focus ring |
| Destructive | `#ff4d5c` | Camera LIVE pill (red dot + text). No destructive *actions* in Phase 177 dashboard (no delete, no power-off CTA on the cards — those land in Phase 178 sheets). |

**Per-card device-class tones (locked, bundle-verbatim — D-09):**

| Card | Tone hex / token |
|------|------------------|
| StoveCard | `var(--accent)` *(only card themed by user accent)* |
| ClimateCard | `#5eafff` (azure) |
| LightsCard | `#f5c84a` (amber-yellow) |
| SonosCard | `#b080ff` (violet) |
| WeatherCard | `#ffb84a` (warm amber) |
| CameraCard | `#6aa86a` (forest green) |
| NetworkCard | `#5eafff` (azure) |
| RaspiCard | `#6aa86a` (forest green) |
| TuyaCard | `#ffb84a` (warm amber) |
| DirigeraCard | `#ffb84a` (warm amber) |

**Tone is a device-class identifier, NOT user-themable.** Only StoveCard binds to `var(--accent)`. The other 8 keep their bundle hex across the 6 user accent presets (DS-03). Tone is applied as a **radial-gradient wash in the top-right corner** of each `GlassCard` at `opacity: 0.55` (`background: radial-gradient(120% 70% at 100% 0%, ${tone} 0%, transparent 55%)`) — not a fill, not a border.

**Status-dot colors:**
- On (default): tone color of the card OR `var(--accent)` (StatusDot fallback).
- On (Network/Raspi always-green): `#6aa86a`.
- Off / inactive: `rgba(255,255,255,0.18)` (no glow).
- Stale (D-25): `#ffb84a` (warm amber). Replaces the on-color in the header right-slot dot when `staleness >= warning`.

**Glow:** On dots use `boxShadow: 0 0 12px ${color}` (header dot) or `0 0 8px ${color}` (list row dot). Off dots: `boxShadow: 'none'`.

**Accent reserved for:**
1. StoveCard tone wash + FlameViz body gradient.
2. MiniStat progress bar fill (RaspiCard CPU/RAM).
3. Default `<StatusDot>` fallback when `color` prop omitted.
4. Focus ring (`outline: 2px solid var(--accent)` — Phase 174 line 380, inherited).

**Accent NOT used for:** general card heads (those use device-class hex), list-row dots, footer copy, body text, glass borders, or any decoration on Climate/Lights/Sonos/Weather/Camera/Network/Raspi/Tuya/Dirigera cards.

---

## Copywriting Contract

All copy is **Italian** — consistent with the rest of the app. Use middle-dot `·` (U+00B7), arrows `↑ ↓` (U+2191 / U+2193), ellipsis `…` (U+2026) where shown.

### Card head labels (CardHead `label` prop)

| Card | Label |
|------|-------|
| StoveCard | `Stufa` |
| ClimateCard | `Clima` |
| LightsCard | `Luci` |
| SonosCard | `Sonos` |
| WeatherCard | `Meteo` |
| CameraCard | `Camera` |
| NetworkCard | `Rete` |
| RaspiCard | `Raspberry` |
| TuyaCard | `Prese smart` |
| DirigeraCard | `IKEA` |

### Sheet titles (forward-Phase-178; bundle-faithful — D-14)

| Card | Sheet title |
|------|-------------|
| StoveCard → StoveSheet | `Stufa` |
| ClimateCard → ClimateSheet | `Clima` |
| LightsCard → LightsSheet | `Luci` |
| SonosCard → SonosSheet | `Sonos` |
| CameraCard → (Phase 178 deferred) | `Camera` |
| NetworkCard → (Phase 178 deferred) | `Rete` |
| TuyaCard → PlugsSheet | `Prese smart` |
| DirigeraCard → PlugsSheet | `IKEA` |

WeatherCard + RaspiCard: **no Sheet** (read-only, D-11).

### Per-card body & footer copy

**StoveCard (DASH-02):**
- On: subtitle `Fiamma {power} · Ventola {fan}` (e.g. `Fiamma 3 · Ventola 2`).
- Off: subtitle `Spenta`.
- Header right-slot: `<StatusDot on={isAccesa} />` (no text).
- Primary readout: `{temp}°C` with `°C` at 16px / 0.5 opacity.

**ClimateCard (DASH-03):**
- Header right-slot: current `{mode}` text in 11px caps caps tracking (e.g. `AUTO`, `MANUALE`, `OFF`). Italian uppercase.
- Body row: `{statusDot} {zoneName} {currentTemp.toFixed(1)}°` (no `C`).
- Footer: `{activeCount} di {totalCount} attive`.

**LightsCard (DASH-04):**
- Header right-slot: `<InlineToggle>` (no text). `e.stopPropagation()` mandatory inside `onChange` so toggle doesn't open sheet.
- Body when `anyOn`: list rows of light names (uppercase first letter only) + status dots; if `onLights.length > 4` then overflow row `+ altre {N}`.
- Footer when `anyOn`: `{onCount} di {totalCount} accese`.
- Body when none on: `Spente` (28px display) + subtitle `{N} disponibili`.

**SonosCard (DASH-05):**
- Header right-slot caps copy: `{playingCount} in riprod.` when ≥1 playing; `In pausa` otherwise.
- Body row playing: `<PlayingBars />` + group name (white) + 2nd line track name (`var(--text-2)`).
- Body row paused: 6×6 dim dot + group name in `var(--text-2)` (no track line).

**WeatherCard (DASH-06):**
- Header right-slot: `{city}` in 11px `var(--text-2)`.
- Primary readout: `{temp}°` (40px display, ° at 18px / 0.4 opacity).
- Subtitle: `{condition} · ↑{high}° ↓{low}°` (e.g. `Sereno · ↑18° ↓7°`).

**CameraCard (DASH-07):**
- Header right-slot: red dot (pulse 1.6s) + `LIVE` text (10px, 700, color `#ff4d5c`, `letter-spacing: 0.5`).
- Body preview: `<img src="/api/camera/snapshot/{id}?t=${pollTimestamp}">` filling the preview area.
- Preview overlay label (bottom-left, `left: 10`, `bottom: 8`): `{cameraName} · {resolution}` in 10px `ui-monospace`, `rgba(255,255,255,0.7)`.
- Bundle reference: "INGRESSO · 1080p" — actual values come from `useCameraData()`.

**NetworkCard (DASH-08):**
- Header right-slot: always-green `<StatusDot on color="#6aa86a" />` (when WAN reachable; if not, switches to amber via D-25).
- Primary readout: `{down}` (22px display) + `Mbps ↓` (11px `var(--text-2)`).
- Subtitle: `{up} Mbps ↑ · {N} dispositivi`.

**RaspiCard (DASH-09):**
- Header right-slot: always-green `<StatusDot on color="#6aa86a" />`.
- 2-stat grid: `<MiniStat label="CPU" value="{N}%" bar={N/100} />` + same for RAM.
- Footer: `CPU temp {N}°C`.

**TuyaCard (DASH-10):**
- Header right-slot: total power, auto-format. ≥1000W → `{(N/1000).toFixed(1)}kW`; else `{N}W`. 11px, 600, `tabular-nums`, color `#ffb84a`.
- Body row: status dot + plug name. **No inline toggles** (DASH-10 explicit — toggles live in PlugsSheet).
- Footer: `{onCount} di {totalCount} accese`.

**DirigeraCard:** same shape as TuyaCard except label `IKEA`. *See Assumptions Log for live-data caveat (RESEARCH.md LANDMINE #2 — DIRIGERA exposes sensors, not plugs).*

### Empty / Loading / Error states

| State | Card | Visual contract |
|-------|------|-----------------|
| Loading (initial mount) | All 9 | `<GlassCardSkeleton />` — 1:1 square with `bg-white/5` shimmer (`animate-pulse`), `border-radius: var(--r-card)`, no inner content. Matches outer footprint exactly. |
| Empty (no data ever) | LightsCard | "Spente" + "{N} disponibili" (no error treatment — empty state is a valid lights state). |
| Empty (no data ever) | SonosCard | Right-slot `In pausa`, body shows the zero-group case (no rows). |
| Empty (no data ever) | TuyaCard / DirigeraCard | Right-slot `0W`, body shows zero rows, footer `0 di 0 accese`. |
| Stale (data older than warning) | All 9 | Header `<StatusDot>` switches to amber `#ffb84a`. No banner, no overlay. Last-known data still rendered (D-25 / D-27). |
| Error (no cached data, hook returned error) | All 9 | Render `GlassCard` shell with header intact. Replace primary readout with `—` (em-dash) placeholder. Footer: `Non raggiungibile` (10px, `var(--text-2)`). Card stays tappable for interactive cards (sheet surfaces full error). |
| Refreshing (background fetch with cached data) | All 9 | **No visual change.** Spinners forbidden inside cards (D-27). Global indicator handled by `NavbarConnectionStatus` (Phase 17.0). |

### Destructive actions

**None in Phase 177.** No delete, power-off, or destructive CTA appears on the dashboard cards. The LightsCard "all on / all off" `<InlineToggle>` is non-destructive (toggling lights off is reversible, no confirmation required). Destructive controls (e.g. "Spegni stufa") land inside the Phase 178 sheets where confirmation patterns can be applied.

---

## Component Inventory

**7 micro-primitives + 9 cards + 2 sheet-wiring helpers (Phase 178 placeholder).**

### Primitives (under `app/components/EmberGlass/`)

| File | API | Bundle source |
|------|-----|---------------|
| `GlassCard.tsx` | `({ children, tone?, onOpen?, style? })` — root 1:1 surface; auto-wraps in `<Pressable>` when `onOpen` provided; tone wash + inner highlight + flex-column children. `aspectRatio: '1/1'` hard-coded. `data-testid="glass-card"`. | `cards.jsx:7-50` |
| `CardHead.tsx` | `({ Icon, label, tone, right? })` — 32×32 colored tile + 13px label + optional right slot. | `cards.jsx:53-69` |
| `StatusDot.tsx` | `({ on, color? })` — 8px dot, `boxShadow: 0 0 12px {color}` glow when on, `rgba(255,255,255,0.18)` when off, `var(--accent)` fallback color. `data-testid="status-dot"`. | `cards.jsx:71-77` |
| `MiniStat.tsx` | `({ label, value, bar })` — 11px label, 15px display value, 3px progress bar (`var(--accent)` fill on rgba(255,255,255,0.08) track). | `cards.jsx:375-383` |
| `PlayingBars.tsx` | `()` — 3-bar Sonos animation; 2px wide, 9px tall container, `gap: 1.5px`, `#b080ff`, keyframes `sonosBar0` / `sonosBar1` / `sonosBar2` with `0.9s ease-in-out` and `i * 0.15s` stagger. `data-testid="playing-bars"`. | `cards.jsx:272-282` |
| `InlineToggle.tsx` | `({ on, color?, onChange })` — 44×26 iOS toggle, 22×22 thumb, glow on, `cubic-bezier(.34,1.56,.64,1)` transition. **Header-toggle consumers MUST `e.stopPropagation()` in `onChange`** to prevent sheet open. | `cards.jsx:419-435` |
| `GlassCardSkeleton.tsx` | `()` — 1:1 `var(--glass-bg)` square, `border-radius: var(--r-card)`, `animate-pulse` Tailwind utility, `bg-white/5` shimmer overlay. Matches outer footprint exactly so layout doesn't shift on hydration. | new (no bundle source — Phase 174 token-derived) |

### Cards (under `app/components/EmberGlass/cards/`)

| File | Wraps | Tone | onOpen | Sheet placeholder | data-testid |
|------|-------|------|--------|-------------------|-------------|
| `StoveCard.tsx` | GlassCard + CardHead + FlameViz + 36px temp + subtitle | `var(--accent)` | yes | `<SheetPlaceholderBody phase="178" device="stove" />` | `stove-card`, `stove-temp`, `flame-viz` |
| `ClimateCard.tsx` | GlassCard + CardHead + ≤4 zone rows + footer | `#5eafff` | yes | `device="thermostat"` | `climate-card` |
| `LightsCard.tsx` | GlassCard + CardHead (with InlineToggle) + ≤4 light rows OR empty + footer | `#f5c84a` | yes | `device="lights"` | `lights-card`, `lights-toggle` |
| `SonosCard.tsx` | GlassCard + CardHead + ≤4 group rows | `#b080ff` | yes | `device="sonos"` | `sonos-card` |
| `WeatherCard.tsx` | GlassCard (no onOpen) + CardHead + 40px temp + subtitle | `#ffb84a` | **no** | **no Sheet** | `weather-card` |
| `CameraCard.tsx` | GlassCard + CardHead (with LIVE pill) + 14px-radius preview + mono label | `#6aa86a` | yes | `device="camera"` | `camera-card` |
| `NetworkCard.tsx` | GlassCard + CardHead + 22px down + subtitle | `#5eafff` | yes | `device="network"` | `network-card` |
| `RaspiCard.tsx` | GlassCard (no onOpen) + CardHead + 2-stat grid + footer | `#6aa86a` | **no** | **no Sheet** | `raspi-card` |
| `TuyaCard.tsx` | GlassCard + CardHead (with total-power right slot) + ≤4 plug rows + footer | `#ffb84a` | yes | `device="plugs-tuya"` | `tuya-card` |
| `DirigeraCard.tsx` | same shape, label "IKEA" | `#ffb84a` | yes | `device="plugs-dirigera"` | `dirigera-card` |

### Sheet wiring helpers

| File | Purpose |
|------|---------|
| `SheetPlaceholderBody.tsx` | `({ phase, device })` — single styled message (`Controlli in arrivo nella Phase {phase}`) + small device-class icon; deleted by Phase 178. |

### Reused unmodified (Phase 174/175/176)

| Component | Phase | Where used |
|-----------|-------|------------|
| `<Pressable>` | 175 | Auto-wrapped inside GlassCard when `onOpen` provided |
| `<Sheet>` | 175 | One per interactive card (7 sheet instances on the dashboard) |
| `<FlameViz>` | 176 | StoveCard absolute-positioned top-right |
| `<AmbientBg>` | 174 | Already mounted at app shell (no Phase 177 work) |

### Icons (lucide-react — D-05)

| Card | Icon | Lucide name |
|------|------|-------------|
| StoveCard | flame | `Flame` |
| ClimateCard | thermometer | `Thermometer` |
| LightsCard | bulb | `Lightbulb` |
| SonosCard | music | `Music` (or `Music2`) |
| WeatherCard | sun | `Sun` |
| CameraCard | video | `Video` |
| NetworkCard | wifi | `Wifi` |
| RaspiCard | cpu | `Cpu` |
| TuyaCard / DirigeraCard | plug | `Plug` |

---

## Interaction Contract

### Press behavior (DS-07)

| Surface | Behavior |
|---------|----------|
| StoveCard, ClimateCard, LightsCard (excluding header toggle), SonosCard, CameraCard, NetworkCard, TuyaCard, DirigeraCard | `<Pressable>` wraps GlassCard root (auto when `onOpen` provided). On `pointerdown`: `transform: scale(0.97)` over `220ms cubic-bezier(.34,1.56,.64,1)`. On `pointerup` / `pointerleave`: returns to `scale(1)`. `cursor: pointer`. Click → `onOpen()` → opens that card's `<Sheet>`. |
| WeatherCard, RaspiCard | **No `<Pressable>`**, no `cursor: pointer`, no click handler, no Sheet. Static glass surfaces. (D-11, SC-#3.) |
| LightsCard header `<InlineToggle>` | Dedicated 44×26 toggle. `e.stopPropagation()` mandatory in `onChange` to prevent the parent Pressable from also firing → calls `useLightsCommands().handleAllLightsToggle`. Toggle visual: 220ms thumb travel with same spring curve. |

### Tap → Sheet wiring (DASH-11)

```tsx
// per interactive card pattern (D-12)
const [open, setOpen] = useState(false);
return (
  <>
    <GlassCard tone="..." onOpen={() => setOpen(true)} data-testid="stove-card">
      ...
    </GlassCard>
    <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
      <SheetPlaceholderBody phase="178" device="stove" />
    </Sheet>
  </>
);
```

- 7 interactive cards → 7 independent `useState<boolean>` + 7 `<Sheet>` instances. No global orchestrator.
- Sheet primitive (Phase 175 D-07..D-13) handles: scroll-lock, scroll-restore on close, Escape dismissal, backdrop click dismissal, z-index 200/201, `forceMount` for outro animation, Italian title, grabber + close button.
- Placeholder body is a single centered stack: 32×32 device-class icon + 14px `var(--text-1)` heading "Controlli in arrivo nella Phase 178" + 12px `var(--text-2)` subtitle.

### Stagger animation (DASH-12)

Wrapper preserved verbatim from current `DashboardCards.tsx:107`:

```tsx
<div className="animate-spring-in transition-all duration-300 ease-out"
     style={{ animationDelay: `${flatIndex * 100}ms` }}>
  <DeviceCardErrorBoundary>
    <Suspense fallback={<GlassCardSkeleton />}>
      <CardComponent />
    </Suspense>
  </DeviceCardErrorBoundary>
</div>
```

- `flatIndex` = card position in the (server-ordered) `getVisibleDashboardCards()` list.
- `100ms` step. With 9 cards, last card delayed 800ms.
- `animate-spring-in` keyframe lives at `app/globals.css:830-835` (Phase 174 / earlier). Uses `--ease-spring` (cubic-bezier overshoot). Phase 177 does **not** edit this keyframe.
- React Compiler auto-memo (Phase 71) keeps the stagger smooth — no re-orderings on state changes.

### Camera snapshot polling (DASH-07)

- Source: `<img src="/api/camera/snapshot/{cameraId}?t={pollTimestamp}">`.
- Cadence: ~10s, sourced from `useCameraData()` adaptive polling (Phase 96). No card-local interval.
- Cache-bust query string `?t=` increments on every poll cycle.
- HLS / live video deferred to Phase 178 CameraSheet.

### React Compiler discipline (D-28, SC-#5)

- **No `useMemo` or `useCallback`** introduced in Phase 177. Pure-function components only.
- Plan must include `npx react-compiler-healthcheck` in `<verify><automated>`.
- Existing hooks (`useStoveData`, etc.) keep their current memoization — no hook code is touched.
- Heuristics that opt out of auto-memo (mutation, conditional hook calls) are forbidden. List rendering uses stable keys (`l.name`, `z.name`, `g.name`, `p.name`).

### Reduced-motion fallback

**Out of scope for Phase 177 (per CONTEXT.md `<deferred>` and SC-#3).** Phase 174/175/176 already established `prefers-reduced-motion: reduce` defaults at the keyframe level (e.g. `animate-spring-in` line 1040, FlameViz `flamePulse` is animation-only and inherits via `*` selector at line 1070). Specific Phase 177 reduced-motion polish (PlayingBars stop, FlameViz freeze on stove, snapshot freeze) is deferred to a polish phase. **No new motion behavior in Phase 177 needs explicit reduced-motion handling** — all new motion is either (a) already covered by the existing global rules, (b) one-shot mount stagger that is unobjectionable.

---

## Layout Contract

### Outer grid (`DashboardCards.tsx`)

```tsx
<div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
  {visibleCards.map((card, index) => renderCard(card, index))}
</div>
```

- 2 columns at every viewport (mobile-first, DASH-01).
- 12px gap (`gap-3`).
- Container caps at 28rem on mobile, 42rem on `sm+`. Beyond, leftover whitespace either side.
- The legacy `flex-col gap-6 sm:hidden` mobile block AND `hidden sm:flex sm:flex-row gap-8 lg:gap-10` desktop block are **deleted** — single grid handles both.
- `splitIntoColumns` (`lib/utils/dashboardColumns.ts`) becomes orphan utility — flagged for v20.0 cleanup phase.

### Card internal grid (3-row layout)

Each card renders its content in a flex-column inside `var(--pad-card)` (16px) padding:

```
┌──────────────────────────────────────────┐  ← 0.5px var(--glass-border)
│ ┌──────────────────────────────────────┐ │
│ │ CardHead                              │ │  Row 1: 32px tile + 13px label + right slot
│ │ (height: 32px; marginBottom: 14)     │ │
│ ├──────────────────────────────────────┤ │
│ │ Body (flex: 1, justifyContent: …)    │ │  Row 2: list / numeric / preview
│ │                                      │ │
│ │                                      │ │
│ ├──────────────────────────────────────┤ │
│ │ Footer / subtitle (12px, marginTop: 8 or 6) │  Row 3: secondary copy
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘  border-radius: var(--r-card) (24px)
```

- Header height: ~46px (32px tile + 14px marginBottom).
- Body justification:
  - `justifyContent: 'flex-end'` for numeric-readout cards (StoveCard, WeatherCard, NetworkCard, LightsCard empty).
  - `justifyContent: 'center'` for list cards (ClimateCard, LightsCard active, SonosCard, TuyaCard, DirigeraCard).
  - `alignContent: 'end'` (grid) for RaspiCard 2-stat.
  - `flex: 1, marginTop: 4` for CameraCard preview (fills remaining height with `borderRadius: 14`).
- Footer marginTop: 6 (StoveCard subtitle, WeatherCard subtitle) or 8 (ClimateCard, LightsCard, RaspiCard, TuyaCard footers). Bundle-faithful.
- StoveCard FlameViz absolute-positioned at `right: -8, top: -10` (intentional bleed past padding — bundle `cards.jsx:88`).

### Server-side composition

- `DashboardCards.tsx` stays an `async` Server Component.
- Steps preserved: `auth0.getSession()` → redirect → `getUnifiedDeviceConfigAdmin(userId)` → `getVisibleDashboardCards(deviceConfig)`.
- Ordered list drives card render. Empty list → existing `<EmptyState>` preserved.
- `<DeviceCardErrorBoundary>` + per-card `<Suspense fallback={<GlassCardSkeleton/>}>` retained.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn | not applicable (no `components.json`) |
| Third-party | none | not applicable |

**No shadcn presets, no third-party registries.** All new components are hand-built EmberGlass primitives translating `cards.jsx` (project-internal design bundle) onto Phase 174 tokens. Vetting gate: **not applicable**.

---

## Assumptions Log

This section captures gray areas resolved by the researcher in `--auto` mode. The planner must verify each before kickoff.

| # | Assumption | Source / Rationale | Verify |
|---|------------|--------------------|--------|
| A-01 | StoveCard `temp` numeric source = `power_level` styled large (`Fiamma N`-equivalent), since Thermorossi proxy doesn't expose ambient temp (RESEARCH.md LANDMINE #3). | Recommended fallback in RESEARCH §Summary; matches subtitle "Fiamma N · Ventola N" semantically. Bundle's "temp" was mock data. | Plan agent confirms with user before code; if user prefers Netatmo room-temp lookup, swap source but keep 36px display unchanged. |
| A-02 | DirigeraCard renders the same plug-shape (≤4 names + on dots + total power footer) in **placeholder mode** — content shape locked to bundle but wired against `useDirigeraData()` empty-array fallback (currently sensors only). | RESEARCH.md LANDMINE #2: DIRIGERA proxy exposes contact + motion sensors, not plugs. Bundle's TuyaCard shape duplicated to DirigeraCard per CONTEXT D-23. | Plan agent decides one of: (a) re-spec to sensor summary (count of open contacts / motion / low battery); (b) drop DirigeraCard from the 9; (c) ship empty-list rendering and let Phase 19.x add plug data. **UI-SPEC default assumes (c) — empty list, `0W`, `0 di 0 accese`.** |
| A-03 | SonosCard presence on dashboard requires flipping `hasHomepageCard('sonos')` gate in `lib/services/unifiedDeviceConfigService.ts:69-72` (currently filters Sonos OFF). | RESEARCH.md LANDMINE #1. Required for DASH-05 to ship. | Plan agent includes 1-line config flip in the plan. UI-SPEC assumes Sonos visible. |
| A-04 | `sonosBar0`, `sonosBar1`, `sonosBar2` keyframes need to be added to `app/globals.css`. Bundle references them at `cards.jsx:267-269` but only `pulse`, `flamePulse`, `spring-in` exist today (verified via grep on globals.css). | grep on `app/globals.css` confirms missing. | Plan agent adds the 3 keyframes (lift bundle definitions: bars cycle from `4px` baseline to `9px` peak via different easing per index). Add reduced-motion guard at the existing `*:not(.animate-…)` block so they freeze under `prefers-reduced-motion`. |
| A-05 | ClimateCard `mode` text in right slot is rendered uppercase via the source string itself (Italian: "AUTO", "MANUALE", "ECO", "OFF"). Bundle uses lowercase but spec calls for caps. | Bundle copy is mock; CONTEXT D-16 references "11px caps tracking". | Apply `text-transform: uppercase` inline so any source casing renders consistently. |
| A-06 | Camera preview source = `<img>` snapshot (not `next/image`), per RESEARCH §Standard Stack rejected-alternatives row. 302 redirect to transient WiNet URL is incompatible with `next/image` `remotePatterns`. | RESEARCH.md confirms. | Plan agent uses bare `<img>` with `objectFit: 'cover'` filling the preview area. |
| A-07 | LightsCard's master toggle uses `useLightsCommands().handleAllLightsToggle` (existing). Toggle does not optimistically flip — it dispatches the command and the next data poll updates the on/off state of the bell. | CONTEXT D-17; existing hook semantics. | Plan agent confirms hook signature. |
| A-08 | `data-testid` attributes anchored on root `<GlassCard>` div (D-discretion). Phase 175 / Phase 176 precedent. | Discretion section of CONTEXT. | Plan agent adds to Playwright spec scaffolding. |
| A-09 | Each interactive card's Sheet uses bundle-faithful "Italian title" — same as CardHead label. SheetPlaceholderBody copy frozen as `Controlli in arrivo nella Phase 178`. | CONTEXT D-13/D-14. | Verbatim. |
| A-10 | Tone hex codes (`#5eafff`, `#f5c84a`, `#b080ff`, `#ffb84a`, `#6aa86a`) are inlined as literals in each card file (not centralized in a ts/tsx const map). Matches CONTEXT D-09 "hardcoded hex per card on purpose" rationale and bundle convention. | CONTEXT D-09. | Plan agent does NOT extract to a shared constant — bundle fidelity wins. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*UI-SPEC drafted: 2026-04-28 by gsd-ui-researcher (auto mode).*
*Source: bundle `.planning/inbox/ember-glass-design/project/components/cards.jsx` + Phase 174 tokens + Phase 175 Pressable/Sheet API + Phase 176 FlameViz + CONTEXT.md D-01..D-32 + RESEARCH.md LANDMINEs #1-3.*
