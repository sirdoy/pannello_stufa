---
phase: 179
slug: rooms-tab-redesign
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-29
reviewed_at: 2026-04-29
---

# Phase 179 — UI Design Contract

> Visual and interaction contract for the **Rooms tab** at the new `/stanze` route — 6 `<RoomCard>` (chip-grid) + 1 shared `<RoomSheet>` (expanded `<DeviceCard>` with 10 type-specific bodies). Auto-resolved from `179-CONTEXT.md` D-01..D-69 (locked), the design bundle (`.planning/inbox/ember-glass-design/project/components/rooms.jsx` lines 1–606 — primary visual + behavior source, lifted verbatim), Phase 175 `<Sheet>` + `<Pressable>` primitives (consumed unmodified), Phase 177 `<GlassCard>` + `<CardHead>` + `<InlineToggle>` + `<GlassCardSkeleton>` (consumed unmodified), Phase 178 `useThermostatCommands` (consumed unmodified), and Phase 174 token block. Verified by gsd-ui-checker downstream.

**Scope reminder:** Phase 179 ships ONLY (a) RoomsTab orchestrator at `app/components/EmberGlass/rooms/RoomsTab.tsx`, (b) `<RoomCard>`, `<RoomSheet>`, `<DeviceChip>`, `<DeviceCard>`, `<DevicePrimaryControl>`, `<DeviceBody>` dispatcher, (c) 10 type-specific bodies (`{Stove,Thermo,Valve,Light,Plug,Sonos,Tv,Shade,Camera,Sensor}Body.tsx`) under `rooms/bodies/`, (d) 5 shared primitives (`StatChip`, `DualTempReadout`, `SliderRow`, `ControlRow`, `MiniButton`) under `rooms/primitives/`, (e) static config + pure aggregator under `rooms/lib/`, (f) types in `rooms/types.ts`, (g) barrel `rooms/index.ts` re-exported from `app/components/EmberGlass/index.ts`, (h) new Next.js route `app/stanze/page.tsx` mounting `<RoomsTab />`, (i) Jest unit specs under `rooms/__tests__/`, (j) one new Playwright spec `tests/playwright/rooms-tab.spec.ts`. **Out of scope** (per CONTEXT `<domain>` Out of scope + `<deferred>`): replacing/deleting the v15.0 `/rooms` admin-CRUD page, glass bottom tab bar wiring (Phase 181), TV/blind/humidity-sensor/entrance-camera proxies (mocked via `EXTRA_DEVICES`), Tuya plug→room registry join (every Tuya plug hardcoded to "Cucina"), per-light brightness (per-group fallback), color-temp slider (rendered disabled, no API), DIRIGERA sensor mapping, scene strip in RoomSheet, long-press / swipe / drag-to-dismiss gestures, reduced-motion overrides, new tokens / fonts / icons beyond lucide-react re-use.

**Requirement coverage:** ROOMS-01 (data-driven aggregator) → §Data Aggregation; ROOMS-02 (chip-grid + N/M counter + +N overflow) → §RoomCard; ROOMS-03 (RoomSheet summary header + per-category sections) → §RoomSheet; ROOMS-04 (expanded `<DeviceCard>` with header + body) → §DeviceCard; ROOMS-05 (10 type-specific bodies) → §DeviceBody Type Map.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual — Ember Glass v2 token system, Phase 174) |
| Preset | not applicable (verified 2026-04-29: `components.json` does not exist; project uses Tailwind v4 + CVA convention with no shadcn) |
| Component library | Radix (`@radix-ui/react-dialog ^1.1.14` via Phase 175 `<Sheet>`) + custom EmberGlass primitives |
| Icon library | `lucide-react` (already a dep) — Phase 179 icons: `<Home>`, `<Moon>`, `<Droplets>`, `<Flame>`, `<Thermometer>`, `<Lightbulb>`, `<Plug>`, `<Music>`, `<Tv>`, `<Video>`, `<Blinds>`, `<Minus>`, `<Plus>`, `<Power>`, `<Volume2>`, `<SkipBack>`, `<SkipForward>`, `<Play>`, `<Pause>`, `<ChevronUp>`, `<ChevronDown>`, `<ChevronRight>`. All are already imported elsewhere — Phase 179 introduces no new icon dependencies. |
| Display font | Outfit (`var(--font-display)`, Phase 174 token alias) |
| Body font | Inter (`var(--font-body)`, Phase 174 token alias) |
| Color space | OKLCH for `--accent`; `color-mix(in oklab, ...)` for tinted surfaces; rgba/hex literals for bundle-verbatim non-tokenized values (documented as AUDIT-EXCEPTION below) |
| Styling approach | **Inline `style={...}` objects with `var(--token)` references** (Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 / Phase 178 D-02 mandate, locked; CONTEXT D-02 reaffirms for Phase 179). Tailwind v4 utility classes are FORBIDDEN inside any `rooms/` file — bundle is the source of truth and bundle is inline-style. Layout flex/grid + spacing tokens stay inline too. The only Tailwind permitted is on the new route page wrapper (`app/stanze/page.tsx`) for outer container layout. |

**Token consumption (Phase 174 — locked, do NOT redefine in Phase 179):**

| Token | Value | Where used in Phase 179 |
|-------|-------|-------------------------|
| `--accent` | `oklch(0.68 0.17 45)` (default copper, runtime-overridable via DS-03 picker) | Soggiorno room tone (only ROOMS entry whose tone is `var(--accent)` per bundle `rooms.jsx:7` + CONTEXT D-05); Stufa device tone (CONTEXT D-11 + bundle `rooms.jsx:65`); StoveBody Power button filled tone; MiniButton `tone` default fallback; Pressable `:focus-visible` outlines |
| `--text-1` | `#f5f5f4` | Primary white text (bundle uses literal `#fff` per `rooms.jsx:139, 250, 303, 416, 524, 540`; AUDIT-EXCEPTION carried from Phase 175/177/178 — bundle convention) |
| `--text-2` | `rgba(245, 245, 244, 0.55)` | Secondary dim text — RoomsTab subtitle "{N} stanze", RoomCard count when `activeCount === 0`, RoomCard empty-state "Nessun dispositivo", RoomSheet summary "{N} categorie di dispositivi", category caps labels, DeviceCard "Inattivo · {value}" status line, StatChip caps label, DualTempReadout "Attuale"/"Target" caps, SliderRow label, MiniButton outlined fallback color |
| `--font-display` | Outfit (Phase 174 token alias) | "Stanze" page title (30px), RoomSheet summary count (16px display), DeviceCard name (15px), StatChip value (16px display), DualTempReadout values (22px display) |
| `--font-body` | Inter (Phase 174 token alias) | All other text — labels, status lines, caps labels, MiniButton labels, SliderRow value/unit |
| `--r-card` | `24px` | `<GlassCard>` `border-radius` (Phase 177 carry-forward; RoomCard composes GlassCard verbatim) |
| `--pad-card` | `16px` | `<GlassCard>` interior padding (Phase 177 carry-forward) |
| `--glass-bg` | `rgba(255, 255, 255, 0.04)` | RoomCard surface (via GlassCard) |
| `--glass-blur` | `24px` | RoomCard `backdrop-filter` (via GlassCard) |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | RoomCard border (via GlassCard); NOT used inside RoomSheet content (DeviceCard / chips use bundle-verbatim `rgba(255,255,255,0.06)` inner border — AUDIT-EXCEPTION below) |
| `--glass-shadow` | `0 8px 32px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.03)` | RoomCard shadow (via GlassCard) |

**Tokens NOT introduced or modified by Phase 179:** zero. All color/blur/border/radius/shadow values either consume Phase 174 tokens, derive from `room.tone` / `device.tone` via `color-mix(in oklab, ...)`, or carry forward bundle-verbatim AUDIT-EXCEPTIONs. **No new tokens added.** No new icons added beyond lucide-react re-use.

**Detected existing UI (verified 2026-04-29 against `app/globals.css` + `app/components/EmberGlass/`):**
- `app/components/EmberGlass/Sheet.tsx` — Phase 175 primitive, consumed unmodified by RoomSheet via `{ open, onClose, title }` prop API.
- `app/components/EmberGlass/Pressable.tsx` — Phase 175 primitive (CSS class `.press-anim`); wraps RoomCard (interactive) + DeviceCard (`as="div"` strict-SC#1 wrap, no onClick). API: `<Pressable as={...} onClick={...}>`.
- `app/components/EmberGlass/GlassCard.tsx` — Phase 177 primitive; RoomCard composes it via `<Pressable as={GlassCard} onClick={onOpen}>`. API confirmed accepts `onClick` per Phase 177.
- `app/components/EmberGlass/CardHead.tsx` — Phase 177 primitive; RoomCard header. API: `<CardHead Icon label tone right>`.
- `app/components/EmberGlass/InlineToggle.tsx` — Phase 177 primitive (44×26 iOS toggle); reused by DevicePrimaryControl for `light`, `plug`, `thermo`, `valve` device kinds. API: `<InlineToggle on color onChange>` consumed unchanged.
- `app/components/EmberGlass/GlassCardSkeleton.tsx` — Phase 177 skeleton; reused for first-load `<RoomsTabSkeleton>` (CONTEXT D-45).
- `app/components/EmberGlass/sheets/` — Phase 178 sub-primitives **NOT reused** (different visual shapes — see CONTEXT Out of Scope; bundle `rooms.jsx` defines its own `StatChip`/`DualTempReadout`/`SliderRow`/`ControlRow`/`MiniButton`).
- `app/hooks/useDebounce.ts` — existing hook; reused by ThermoBody (500ms setpoint), LightBody (250ms brightness), SonosBody (250ms volume).
- `app/components/devices/{stove,thermostat,lights,sonos,tuya}/hooks/use*Data.ts` + `use*Commands.ts` — read by RoomsTab orchestrator + each `<*Body>`. Phase 179 adds **zero** new commands hooks.
- `lib/hooks/useRetryableCommand` — existing Phase 7.0 retry infrastructure transitively consumed.
- `app/page.tsx` — Phase 177 dashboard root; reference for Auth0/session pattern that `app/stanze/page.tsx` mirrors.

---

## Spacing Scale

Declared values (multiples of 4 unless flagged as bundle-verbatim micro-affordance):

| Token | Value | Usage in Phase 179 |
|-------|-------|--------------------|
| 2 | 2px | DeviceCard status-line `marginTop: 2`, RoomSheet summary subtitle `marginTop: 2`, StatChip value `marginTop: 2`, DualTempReadout value `marginTop: 2` |
| 3 | 3px | DeviceChip on-state dot pinning `top: 3, right: 3` (`rooms.jsx:206-207`) — bundle-verbatim micro-affordance |
| 4 | 4px | SliderRow label/value `marginBottom: 4`-equivalent; ControlRow `marginBottom` between rows when stacked; SonosBody track-line `marginBottom: 4`; RoomCard padding-edge alignment |
| 6 | 6px | RoomCard chip-grid `gap: 6` (`rooms.jsx:170`), SliderRow `marginBottom: 6` between label-row and gradient bar (`rooms.jsx:563`), ControlRow inter-button `gap: 6` (`rooms.jsx:587`), SonosBody track-line padding `6px 10px` (`rooms.jsx:415`) |
| 8 | 8px | StatChip pair grid `gap: 8` (PlugBody / TvBody / SensorBody — `rooms.jsx:403, 433, 500`), StatChip vertical padding `8px 10px` (`rooms.jsx:521`) |
| 9 | 9px | DualTempReadout chevron-side gap (computed via `flex` baseline), CameraBody LIVE caption `top: 6, left: 8` (`rooms.jsx:471`), CameraBody motion footer `bottom: 6, left/right: 8` (`rooms.jsx:478-479`) — 6/8 micro-affordances |
| 10 | 10px | DeviceChip / "+N" overflow chip `borderRadius: 10` (`rooms.jsx:175, 195`), StatChip `borderRadius: 10` (`rooms.jsx:520`), SonosBody track-line `borderRadius: 10` (`rooms.jsx:415`), CameraBody preview `borderRadius: 10` (`rooms.jsx:466`), DeviceBodyLayout inter-element `gap: 10` (`rooms.jsx:513`), MiniButton `borderRadius: 10` (`rooms.jsx:594`), RoomSheet category-section device list `gap: 10` (`rooms.jsx:264`) |
| 11 | 11px | DeviceChip icon-tile `borderRadius: 11`-adjacent (DeviceCard 40×40 icon tile uses `borderRadius: 11` per `rooms.jsx:291`) — bundle-verbatim micro-affordance, DO NOT round to 10 or 12 |
| 12 | 12px | RoomCard 2-col grid `gap: 12` + `padding: '0 12px'` (`rooms.jsx:141`), DeviceCard header inner `gap: 12` + `marginBottom: 12` (`rooms.jsx:289`), RoomSheet summary header icon-tile `borderRadius: 12` (`rooms.jsx:241`) |
| 13 | 13px | RoomsTab subtitle `fontSize: 13` ("{N} stanze") (`rooms.jsx:138`), DualTempReadout suffix `fontSize: 13` (`rooms.jsx:543, 553`) |
| 14 | 14px | DeviceCard outer `padding: 14` (`rooms.jsx:285`), DualTempReadout chevron-icon area `gap: 14` (`rooms.jsx:533`), DualTempReadout inner padding `10px 14px` (`rooms.jsx:535`), RoomCard empty-state `padding: '14px 0'` (`rooms.jsx:182`), RoomSheet summary header icon-tile-to-text `gap: 14` (`rooms.jsx:238`) |
| 16 | 16px | DeviceCard `borderRadius: 16` (`rooms.jsx:283`), RoomSheet summary count `fontSize: 16` display (`rooms.jsx:251`), StatChip value `fontSize: 16` display (`rooms.jsx:524`), RoomSheet summary header inner `padding: '16px 18px'` (left value), MiniButton inter-icon-label `gap: 4` |
| 18 | 18px | RoomSheet summary header `borderRadius: 18` + `marginBottom: 18` (`rooms.jsx:235`), RoomSheet summary header padding `'16px 18px'` (`rooms.jsx:235`), DeviceCard sonos play/pause button 40×40 round in primary control |
| 20 | 20px | RoomsTab title block `padding: '0 20px 20px'` (`rooms.jsx:137`), RoomSheet summary header icon `size={20}` (`rooms.jsx:247`) |
| 22 | 22px | RoomSheet category-section `marginBottom: 22` (`rooms.jsx:260`), DualTempReadout value `fontSize: 22` (`rooms.jsx:540, 550`) |
| 30 | 30px | RoomsTab page title "Stanze" `fontSize: 30` (`rooms.jsx:139`) |
| 34 | 34px | MiniButton `height: 34` (`rooms.jsx:593`) — sub-44px touch target, bundle-verbatim |
| 40 | 40px | DeviceCard header icon-tile 40×40 (`rooms.jsx:290-291`); DevicePrimaryControl sonos play/pause round button 40×40 (`rooms.jsx:323`) |
| 42 | 42px | RoomSheet summary header icon-tile 42×42 (`rooms.jsx:240-241`) |
| 46 | 46px | CameraBody play overlay 46×46 round (`rooms.jsx:484-485`) |
| 70 | 70px | RoomsTab outer container `paddingTop: 70` (`rooms.jsx:136`) — safe-area for the future glass bottom tab bar (Phase 181); included now so the layout doesn't shift when Phase 181 ships |

**Bundle-verbatim micro-affordances (intentional non-multiples of 4 — DO NOT normalize):**
- `0.5px` — every sheet sub-container border (DeviceChip border, "+N" overflow dashed border, DeviceCard outer border, RoomSheet summary header border, StatChip border, DualTempReadout border, MiniButton border, SonosBody track-line border, CameraBody preview border). Sub-pixel hairline for retina; bundle-verbatim across all rooms surfaces.
- `3px` — DeviceChip on-state dot pin offset (top: 3, right: 3). Bundle-verbatim.
- `5×5px` — DeviceChip on-state dot size (`rooms.jsx:208`). Bundle-verbatim. Below Apple HIG dot minimum but visually balanced inside the 14px icon chip.
- `5×5px` — DevicePrimaryControl camera/sensor pulsing dot inside LIVE/OK pill (`rooms.jsx:343-344`). Bundle-verbatim.
- `6×6px` — CameraBody LIVE caption pulsing dot (`rooms.jsx:474`). Bundle-verbatim.
- `9px` — CameraBody LIVE caption `fontSize: 9` (`rooms.jsx:471`). Bundle-verbatim — lowest text size in the rooms tab; ONLY used in this caption.
- `10px` — Multiple uses of `fontSize: 10` for caps labels (StatChip label, DualTempReadout caps, CameraBody motion footer, DevicePrimaryControl LIVE/OK pill text). Bundle-verbatim.
- `11px` — Multiple uses of `fontSize: 11` (DeviceCard status line, RoomCard count badge, RoomSheet category caps label, MiniButton text, SliderRow label, RoomCard empty-state) and DeviceCard icon-tile `borderRadius: 11`. Bundle-verbatim.
- `34×34` — MiniButton height. Below Apple HIG 44×44; locked for bundle fidelity (matches Phase 178 `<Stepper>` precedent of 36×36 bundle-verbatim).
- `40×40` — DeviceCard header icon tile + DevicePrimaryControl sonos play/pause. Bundle-verbatim.
- `42×42` — RoomSheet summary header icon tile. Bundle-verbatim.
- `46×46` — CameraBody central play overlay. Bundle-verbatim.

**Touch target exceptions (locked for bundle fidelity):**
- **MiniButton: 34×34** — bundle-verbatim. Below Apple HIG 44×44. Inside Sheet at z-index 201 (no surrounding interactive elements compete); mis-taps unlikely. Locked.
- **DevicePrimaryControl sonos play/pause: 40×40** — bundle-verbatim. Below 44×44 but consistent with Phase 178 SonosSheet group-row 34×34 precedent.
- **RoomCard / DeviceCard glass surfaces: full-card touch target** — Pressable wrap exposes the entire card area as the click region (RoomCard `onOpen`); DeviceCard wraps with `as="div"` no onClick (strict SC-#1 reading per CONTEXT D-61).
- **DeviceChip: not interactive** — no click handler; clicks bubble to parent RoomCard. CONTEXT D-20 / `<specifics>`.

**Z-index reservations (Phase 175 carry-forward — Phase 179 introduces NO new z-indices):**
- 200 → Sheet backdrop (RoomSheet inherits via `<Sheet>` primitive)
- 201 → Sheet container (RoomSheet inherits)
- All Phase 179 sub-primitives, Roomscar interior, DeviceCard, DeviceChip stay BELOW 200 (default stacking). No popovers/tooltips/dropdowns introduced this phase.

---

## Typography

**Bundle-verbatim — sizes lifted directly from `rooms.jsx`. Total declared sizes in Phase 179 surfaces: {9, 10, 11, 12, 13, 14, 15, 16, 22, 30}.** This exceeds the strict "3-4 sizes" guideline because the rooms tab renders multiple distinct hierarchical levels — the page title (30), RoomSheet summary (16), DualTempReadout values (22), DeviceCard name (15), inline body labels (12-13), and caps labels / footnotes (9-11). Bundle copy is verbatim; sizes cannot be normalized further without breaking bundle fidelity. The 2 weights (`500 medium, 600 semibold`) plus regular (`400`) match Phase 174-178 ladder; bold (`700`) used only for caps pill text (LIVE/OK at `letterSpacing: 0.6`).

| Role | Size | Weight | Line Height | Letter Spacing | Family | Where (bundle line) |
|------|------|--------|-------------|----------------|--------|---------------------|
| Page Title | 30px | 600 | (default) | -0.8 | `var(--font-display)` (Outfit) | "Stanze" RoomsTab title (`rooms.jsx:139`) |
| RoomSheet Summary Count | 16px | 600 | (default) | (default) | `var(--font-display)` (Outfit) | "{activeCount} di {total} attivi" (`rooms.jsx:251`) |
| StatChip Value | 16px | 600 | (default) | -0.3 | `var(--font-display)` (Outfit) | StatChip value display (`rooms.jsx:524`) |
| DeviceCard Name | 15px | 600 | (default) | -0.2 | `var(--font-body)` (Inter) | DeviceCard header name (`rooms.jsx:303`) |
| DualTempReadout Value | 22px | 600 | (default) | -0.6 | `var(--font-display)` (Outfit) | "Attuale" + "Target" values (`rooms.jsx:540, 550`) |
| RoomsTab Subtitle | 13px | 400 | (default) | (default) | `var(--font-body)` (Inter) | "{N} stanze" caps subtitle (`rooms.jsx:138`) |
| DualTempReadout Suffix | 13px | 400 | (default) | (default) | `var(--font-display)` (Outfit) | "°" suffix at `opacity: 0.5` (`rooms.jsx:543, 553`) |
| RoomSheet Subtitle | 12px | 400 | (default) | (default) | `var(--font-body)` (Inter) | "{N} categorie di dispositivi" (`rooms.jsx:253`) |
| SonosBody Track Line | 12px | 400 | 1.4 | (default) | `var(--font-body)` (Inter) | Track / artist line (`rooms.jsx:415`) |
| SliderRow Value | 12px | 600 | (default) | (default) | `var(--font-body)` (Inter) | Slider value + unit (`rooms.jsx:568`) |
| DeviceCard Status Line | 11px | 500 | (default) | (default) | `var(--font-body)` (Inter) | "Attivo · {value}" / "Inattivo · {value}" (`rooms.jsx:306`) |
| RoomCard Count Badge | 11px | 600 | (default) | 0.3 | `var(--font-body)` (Inter) | "{activeCount}/{total}" (`rooms.jsx:166`) |
| RoomCard Empty State | 11px | 400 | (default) | (default) | `var(--font-body)` (Inter) | "Nessun dispositivo" (`rooms.jsx:182`) |
| RoomCard "+N" Overflow | 11px | 600 | (default) | (default) | `var(--font-body)` (Inter) | "+N" overflow chip (`rooms.jsx:178`) |
| MiniButton Label | 11px | 600 | (default) | 0.2 | `var(--font-body)` (Inter) | MiniButton text (`rooms.jsx:597`) |
| SliderRow Label | 11px | 400 | (default) | (default) | `var(--font-body)` (Inter) | SliderRow label (`rooms.jsx:564`) |
| RoomSheet Category Caps Label | 11px | 400 | (default) | 1 (uppercase) | `var(--font-body)` (Inter) | "STUFA", "TERMOSTATO", … (`rooms.jsx:261`) |
| DevicePrimaryControl LIVE/OK Pill | 10px | 700 | (default) | 0.6 | `var(--font-body)` (Inter) | "LIVE" / "OK" caps (`rooms.jsx:338`) |
| StatChip Caps Label | 10px | 400 | (default) | 0.8 (uppercase) | `var(--font-body)` (Inter) | StatChip label (`rooms.jsx:522`) |
| DualTempReadout Caps Label | 10px | 400 | (default) | 0.8 (uppercase) | `var(--font-body)` (Inter) | "ATTUALE" / "TARGET" (`rooms.jsx:538, 548`) |
| CameraBody Motion Footer | 10px | 400 | (default) | (default) | `var(--font-body)` (Inter) | "Movimento {motion}" (`rooms.jsx:478-479`) |
| CameraBody LIVE Caption | 9px | 700 | (default) | 0.8 | `var(--font-body)` (Inter) | "LIVE · {fps}fps" (`rooms.jsx:471`) |

**Numeric formatting:**
- All numeric readouts use `fontVariantNumeric: 'tabular-nums'` to keep digit columns aligned (StatChip value, DualTempReadout values, RoomCard count, SliderRow value).
- Power format: `≥1000W → "X.YkW"` (e.g. `"1.2kW"`), else `"NW"` (e.g. `"450W"`) — no space (CONTEXT D-55, bundle `rooms.jsx:102, 404`).
- Energy format: `"{N.N} kWh"` (with space, one decimal — CONTEXT D-55).
- Temperature: `"{N.N}°"` for current, `"{N}°"` for target (no decimal on target — bundle `rooms.jsx:543, 553`).
- Brightness/volume: integer percent + `"%"` suffix (no space — bundle).
- Color temp: integer + `"K"` suffix (no space — bundle).
- Dual-temp readout: `"21.3° → 21°"` style with unicode arrow `→` (U+2192) only in the `device.value` status line; visual readout uses chevron-right icon from lucide.

---

## Color

**Color application is bundle-verbatim. The 60/30/10 rule maps to:**
- **60% Dominant (background, glass surface, ambient)** — body background (Phase 174 ambient gradient) + `--glass-bg` (RoomCard) + `rgba(255,255,255,0.04)` inner surfaces (StatChip, DualTempReadout, "+N" overflow chip background, off-state DeviceChip background, off-state DeviceCard background, MiniButton outlined background, SliderRow track background `rgba(255,255,255,0.08)`).
- **30% Secondary (chrome, separators, icon tiles, dim text)** — `rgba(255,255,255,0.06)` borders inside RoomSheet (DeviceCard outer border, StatChip border, MiniButton outlined border, SonosBody track-line border, CameraBody preview border, off-state chip borders), `rgba(255,255,255,0.05)` off-state DeviceCard icon tile background, `rgba(255,255,255,0.08)` off-state sonos play/pause button background + slider track, `var(--text-2)` dim text everywhere, dashed border `rgba(255,255,255,0.12)` for "+N" overflow chip.
- **10% Accent (per-room tone, per-device tone, focus, glow)** — six per-room tones distribute the 10% accent budget. Each room and each on-state device "owns" its tone; never use `var(--accent)` as a generic active-state color outside the Soggiorno room and Stove device.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--glass-bg)` = `rgba(255,255,255,0.04)`, plus body background from Phase 174 ambient | RoomCard surface, inner chip/card backgrounds, slider tracks |
| Secondary (30%) | `var(--glass-border)` = `rgba(255,255,255,0.08)` (RoomCard); `rgba(255,255,255,0.06)` (inside Sheet — DeviceCard, StatChip, MiniButton outlined, sub-container borders); `rgba(255,255,255,0.05)` (off-state icon tiles); `rgba(255,255,255,0.12)` dashed (only "+N" overflow border); `var(--text-2)` dim text | Card chrome, separators, off-state surfaces, dim copy |
| Accent — Soggiorno tone | `var(--accent)` = `oklch(0.68 0.17 45)` (default copper, runtime-overridable) | Soggiorno RoomCard `room.tone`, Stufa device `device.tone` (CONTEXT D-11), MiniButton `tone` default fallback, Pressable `:focus-visible` outlines |
| Accent — Cucina tone | `#f5c84a` (yellow) | Cucina RoomCard `room.tone`; not a token — bundle-verbatim per `rooms.jsx:8` (AUDIT-EXCEPTION: hex literal locked into static config) |
| Accent — Camera tone | `#b080ff` (violet) | Camera RoomCard `room.tone`; AUDIT-EXCEPTION hex literal per `rooms.jsx:9` |
| Accent — Studio tone | `#5eafff` (blue) | Studio RoomCard `room.tone`; AUDIT-EXCEPTION hex literal per `rooms.jsx:10` |
| Accent — Bagno tone | `#6aa86a` (green) | Bagno RoomCard `room.tone`; AUDIT-EXCEPTION hex literal per `rooms.jsx:11` |
| Accent — Ingresso tone | `#ffb84a` (amber) | Ingresso RoomCard `room.tone`; AUDIT-EXCEPTION hex literal per `rooms.jsx:12` |
| Per-device tone (lights) | `#f5c84a` (yellow) | All `kind === 'light'` devices `device.tone` — DeviceChip on-state, DeviceCard tinted gradient, brightness slider gradient, light-toggle InlineToggle color; per `rooms.jsx:88` |
| Per-device tone (thermo/valve) | `#5eafff` (blue) | All `kind === 'thermo' \| 'valve'` devices `device.tone` — DualTempReadout target color, ±0.5°/Auto MiniButton filled tone, thermo-toggle InlineToggle color; per `rooms.jsx:76` |
| Per-device tone (plug) | `#ffb84a` (amber) | All `kind === 'plug'` devices `device.tone` — Plug DeviceChip on-state, plug-toggle InlineToggle color, StatChip tinting; per `rooms.jsx:100` |
| Per-device tone (sonos) | `#b080ff` (violet) | All `kind === 'sonos'` devices `device.tone` — Volume slider gradient, Play/Pause MiniButton filled tone; per `rooms.jsx:112` |
| Per-device tone (tv) | `#5eafff` (blue, EXTRA_DEVICES) | TV chip + body StatChips + HDMI MiniButton filled tone; per `rooms.jsx:123` |
| Per-device tone (camera) | `#6aa86a` (green, EXTRA_DEVICES) | Camera chip on-state + LIVE pill + LIVE caption + pulsing dot; per `rooms.jsx:123` |
| Per-device tone (shade) | `#b0b0b0` (gray, EXTRA_DEVICES) | Shade chip + position slider gradient + Up/Stop/Down MiniButton fallback (none filled); per `rooms.jsx:123` |
| Per-device tone (sensor) | `#9a9a9a` (gray, EXTRA_DEVICES) | Sensor chip + StatChip tinting + OK pill; per `rooms.jsx:123` |
| Tinted on-state surface | `color-mix(in oklab, ${tone} 18%, transparent)` (chip), `color-mix(in oklab, ${tone} 22%, transparent)` (icon tile), `color-mix(in oklab, ${tone} 35%, transparent)` (border) | DeviceChip on-state background, DeviceCard header icon tile on-state, RoomSheet summary header gradient |
| Tinted glow | `0 0 6px ${tone}` (DeviceChip dot), `0 0 8-10px color-mix(in oklab, ${tone} 25-40%, transparent)` (slider, MiniButton, DeviceCard icon tile) | On-state surfaces with subtle accent glow (no flat shadow) |
| Tinted gradient (DeviceCard) | `linear-gradient(135deg, color-mix(in oklab, ${tone} 8%, rgba(255,255,255,0.03)) 0%, rgba(255,255,255,0.03) 100%)` | DeviceCard outer container on-state |
| Tinted gradient (RoomSheet summary) | `linear-gradient(130deg, color-mix(in oklab, ${room.tone} 16%, transparent) 0%, transparent 70%)` | RoomSheet top summary header (`rooms.jsx:236`) |
| White (off-state heading text) | `#fff` (literal) | DeviceCard name, RoomSheet summary count, page title, StatChip value, DualTempReadout current value, MiniButton text on outlined variant, SonosBody track-line track text. AUDIT-EXCEPTION: bundle uses literal `#fff` rather than `var(--text-1)`; carried from Phase 175/177/178. |
| Stove off / Camera dark BG | `linear-gradient(135deg, #0a1a0a 0%, #0a0908 100%)` | CameraBody preview background gradient (`rooms.jsx:467`) — AUDIT-EXCEPTION |
| Sonos play button on-state | `#fff` background, `#1a0f08` color | DevicePrimaryControl sonos play/pause button when `device.on === true` (`rooms.jsx:325-326`) — AUDIT-EXCEPTION (literal hex, bundle-verbatim) |
| Destructive | not applicable | **No destructive actions in Phase 179.** All commands are toggles, setpoint adjustments, scene-equivalents, and play/pause. No delete, no reset, no irrevocable action. |

**Accent reserved for:**
1. Per-room tone — RoomCard `<CardHead>` icon, RoomCard count badge (when `activeCount > 0`), RoomCard chip-grid hover/active glow, "Soggiorno" room only uses `var(--accent)`.
2. Per-device tone — DeviceChip on-state fill+border+glow, DeviceCard tinted gradient + icon tile + status-line color, DualTempReadout target value, LIVE/OK pill text+dot, slider gradient (Volume / Brightness / Position), MiniButton `filled` variant background+text+glow, InlineToggle on-state color.
3. Pressable focus/active feedback — `.press-anim` class (Phase 175) handles `scale(0.97)` + cubic-bezier `.34,1.56,.64,1` 220ms; no separate accent outline beyond the underlying surface tint.

**Per-category color palette (frozen — CONTEXT D-09 + bundle):**

| Device kind | Tone | Reasoning |
|-------------|------|-----------|
| stove | `var(--accent)` | Stove is the project's hero device; tones with the user-selectable accent |
| thermo | `#5eafff` (blue) | Cool blue for climate control |
| valve | `#5eafff` (blue) | Same as thermo (both temperature) |
| light | `#f5c84a` (yellow) | Warm yellow = light bulbs |
| plug | `#ffb84a` (amber) | Amber = electricity, distinct from yellow lights |
| sonos | `#b080ff` (violet) | Violet = audio (consistent with bundle's audio category color) |
| tv | `#5eafff` (blue) | EXTRA_DEVICES static — re-uses thermo blue (visual screen association) |
| camera | `#6aa86a` (green) | EXTRA_DEVICES static — green = monitoring/live |
| shade | `#b0b0b0` (gray) | EXTRA_DEVICES static — neutral (no clear category color in bundle) |
| sensor | `#9a9a9a` (gray) | EXTRA_DEVICES static — neutral (no clear category color in bundle) |

**Pulsing animation reuse:**
- `animation: 'pulse 1.6s ease-in-out infinite'` — DevicePrimaryControl LIVE/OK pill dot when `device.on` (`rooms.jsx:345`).
- `animation: 'pulse 1.4s ease-in-out infinite'` — CameraBody LIVE caption dot (`rooms.jsx:474`).
- The `pulse` keyframe must already exist in `app/globals.css` (Phase 174/176 carry-forward — verify presence; if missing, the plan agent adds the standard `pulse` keyframe `0%/100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); }` matching Phase 176 D-23). The bundle uses `pulse 1.6s` and `pulse 1.4s` — same keyframe, different durations. No new keyframe definitions are required — Phase 176 already shipped the keyframe.

---

## Copywriting Contract

All copy is **Italian**, frozen at decision time per CONTEXT D-48..D-60. Bundle is the source of truth — paraphrasing is forbidden. Use unicode minus `−` (U+2212), middle-dot `·` (U+00B7), and right-arrow `→` (U+2192) where shown.

### Page chrome (RoomsTab)

| Element | Copy |
|---------|------|
| Page title | `Stanze` (30px display, top of tab — bundle `rooms.jsx:139`) |
| Subtitle (count) | `{N} stanze` where N is `ROOMS.length` (always `6`) — caps subtitle (`rooms.jsx:138`) |

### RoomCard (chip-grid card)

| Element | Copy |
|---------|------|
| Header label | Room name from `ROOMS` config — one of: `Soggiorno`, `Cucina`, `Camera`, `Studio`, `Bagno`, `Ingresso` (CONTEXT D-05) |
| Count badge | `{activeCount}/{totalDevices}` (`rooms.jsx:167`); uses tabular-nums; tints to `room.tone` when `activeCount > 0`, else `var(--text-2)` |
| Empty state | `Nessun dispositivo` — only shown when `devices.length === 0` (CONTEXT D-47, `rooms.jsx:183`) |
| Overflow chip | `+{N}` where N = `devices.length - 6` (CONTEXT D-18, `rooms.jsx:178`); rendered when `devices.length > 6` |

### RoomSheet (summary header + per-category sections)

| Element | Copy |
|---------|------|
| Sheet title | Selected room name (passed to `<Sheet title>`) |
| Summary header — count | `{activeCount} di {total} attivi` (16px display — CONTEXT D-49, `rooms.jsx:251`) |
| Summary header — categories | `{N} categorie di dispositivi` (12px dim — CONTEXT D-49, `rooms.jsx:253`) |
| Category caps label (frozen labels) | `STUFA`, `TERMOSTATO`, `TERMOVALVOLE`, `LUCI`, `PRESE`, `AUDIO`, `TV`, `TELECAMERA`, `TAPPARELLE`, `SENSORI` — all uppercase via `textTransform: 'uppercase'` from source `Stufa / Termostato / Termovalvole / Luci / Prese / Audio / TV / Telecamera / Tapparelle / Sensori` (CONTEXT D-09 + D-50) |

### DeviceCard (header)

| Element | Copy |
|---------|------|
| Status line — on | `Attivo · {value}` where `{value}` is kind-specific (CONTEXT D-51) |
| Status line — off | `Inattivo · {value}` where `{value}` is kind-specific (CONTEXT D-51) |
| Device name | `device.name` from aggregator (e.g. `"Stufa pellet"`, `"Termostato"`, `"Termovalvola"`, `"Luce {hueLightName}"`, `"{tuyaPlugName}"`, `"Sonos {groupName}"`, `"TV soggiorno"`, `"Tapparella"`, `"Tapparelle"`, `"Umidità"`, `"Camera ingresso"`) |

### DeviceCard `value` per device kind (status-line right-side)

| Kind | Value |
|------|-------|
| stove | on → `{temp}°C` (e.g. `"24°C"`); off → `Spenta` (CONTEXT D-51, bundle `rooms.jsx:67`) |
| thermo / valve | `{current.toFixed(1)}° → {target}°` (e.g. `"21.3° → 21°"` — bundle `rooms.jsx:78`) |
| light | on → `Accesa`; off → `Spenta` (bundle `rooms.jsx:90`) |
| plug | on → power formatted (`{power}W` or `{X.Y}kW`); off → `Inattiva` (bundle `rooms.jsx:102`) |
| sonos | playing → `{track}` (e.g. `"Bohemian Rhapsody"`); paused → `In pausa` (bundle `rooms.jsx:113`) |
| tv | EXTRA_DEVICES static value (e.g. `"Netflix · HDMI 1"`; `"Spenta"` when off) |
| camera | EXTRA_DEVICES static value `LIVE` |
| shade | EXTRA_DEVICES static value `Alzata` (position 0) or `Abbassata` (position 100) or `Aperta`/`Chiusa` for intermediate |
| sensor | EXTRA_DEVICES static value `{humidity}%` (e.g. `"58%"`) |

### Device body labels & buttons (frozen — CONTEXT D-52..D-60)

| Body | Element | Copy |
|------|---------|------|
| StoveBody | StatChips | `Target` / `Fiamma` / `Ventola` (caps) — values: `{target}°` / `{power}/5` / `{fan}/5` |
| StoveBody | MiniButtons | `Meno` (with `<Minus>` icon) · `Power` (with `<Power>` icon, filled when `on`) · `Più` (with `<Plus>` icon) (CONTEXT D-52, bundle `rooms.jsx:368`) |
| ThermoBody / ValveBody | DualTempReadout caps | `ATTUALE` / `TARGET` |
| ThermoBody / ValveBody | MiniButtons | `−0.5°` (with `<Minus>` icon, unicode minus U+2212) · `+0.5°` (with `<Plus>` icon) · `Eco` · `Auto` (filled when home mode is `schedule`) (CONTEXT D-53) |
| LightBody | SliderRow labels | `Luminosità` (unit `%`) · `Temperatura` (unit `K`, range 2200-6500, **disabled** — no API per CONTEXT D-29) (CONTEXT D-54) |
| PlugBody | StatChip caps | `Ora` (formatted W or kW from `extra.power`) · `Oggi` (`{X.Y} kWh`) (CONTEXT D-55) |
| SonosBody | Track line | `{track} · {artist}` (middle-dot, omit `· {artist}` when `artist === '—'`) (CONTEXT D-56, bundle `rooms.jsx:417`) |
| SonosBody | SliderRow label | `Volume` (with `<Volume2>` icon) (CONTEXT D-56) |
| SonosBody | MiniButtons | `<SkipBack>` icon (no label) · Play/Pause icon (filled tone) · `<SkipForward>` icon (no label) |
| TvBody | StatChip caps | `Sorgente` (`extra.source`) · `Volume` (`extra.volume` no unit) (CONTEXT D-57) |
| TvBody | MiniButtons | `HDMI 1` (filled when `extra.source === 'HDMI 1'`) · `HDMI 2` (filled when `extra.source === 'HDMI 2'`) · `App` (CONTEXT D-57) |
| ShadeBody | SliderRow label | `Posizione` (unit `%`) (CONTEXT D-58) |
| ShadeBody | MiniButtons | `Su` (with `<ChevronUp>` icon) · `Stop` (label only) · `Giù` (with `<ChevronDown>` icon) (CONTEXT D-58) |
| CameraBody | LIVE caption | `LIVE · {fps}fps` (caps `letterSpacing: 0.8`) (CONTEXT D-59) |
| CameraBody | Motion footer | `Movimento {motion}` (e.g. `"Movimento rilevato 2m fa"`) (CONTEXT D-59) |
| SensorBody | StatChip caps | `Valore` (`{humidity}%`) · `Trend` (`{trend}` — string from EXTRA_DEVICES, e.g. `"stabile"`, `"in salita"`, `"in calo"`) (CONTEXT D-60) |

### DevicePrimaryControl (header right-slot per kind — CONTEXT D-25)

| Kind | Control | Copy |
|------|---------|------|
| sonos | 40×40 round play/pause button | no label — icon only (`<Play>` or `<Pause>`) |
| camera | LIVE pill (10px caps) + 5×5 pulsing dot | `LIVE` |
| sensor | OK pill (10px caps) + 5×5 dot | `OK` |
| light / plug / thermo / valve | `<InlineToggle>` (44×26 iOS toggle from Phase 177) | no copy — visual on/off state |
| stove / tv / shade | empty `<div style={{ width: 40 }}>` placeholder | no copy — control lives inside body |

### State copy

| Element | Copy |
|---------|------|
| **Primary CTA per phase** | None — Phase 179 surfaces have no global primary CTA. Each device body has its own primary control (Power button for stove, +/-0.5° for thermo, brightness/volume/position sliders, play/pause for sonos, HDMI selector for TV, Up/Stop/Down for shade). The closest analog to a "primary CTA" is the **Stove Power button** (label `Power`, `<Power>` icon, filled tone when `device.on === true`). |
| **Empty state heading (room with no devices)** | `Nessun dispositivo` (RoomCard chip-grid empty cell — CONTEXT D-47, `rooms.jsx:183`). 11px dim, span all 3 chip-grid cols, 14px vertical padding. **No CTA copy** — there is no "add device" flow inside the rooms tab (registry CRUD lives at the legacy `/rooms` admin page, untouched). |
| **Empty state body (loading)** | First-load skeleton uses `<RoomsTabSkeleton>` (6 `<GlassCardSkeleton>` shimmer rectangles) — no text copy (CONTEXT D-45). |
| **Error state heading** | `Stanze` (page title — unchanged) |
| **Error state body** | `Non raggiungibile. Riprova più tardi.` (14px secondary text below the page title when ALL device hooks error and no cached data — CONTEXT D-46). Includes a retry button (calls `refetch()` on each hook). |
| **Per-room partial-failure state** | No explicit error copy — partial failures render as missing devices in the chip grid (the `N/M` count and empty-state copy carry the signal). Pattern matches Phase 178 D-27. |
| **Sheet error state** | Inside a RoomSheet, when device aggregator returns 0 devices (every category empty), the sheet body renders only the summary header with `0 di 0 attivi` + `0 categorie di dispositivi` and no sections. No additional error copy. |
| **Destructive confirmation** | **No destructive actions in Phase 179** — all interactions are toggles, setpoints, slider seeks, scene-equivalents, play/pause. No delete, reset, irrevocable action. **No confirmation dialog needed.** |
| **Loading state — per device body** | When the underlying device hook is still loading and the device is rendered (because some aggregator inputs are ready), the body uses optimistic UI: toggle/slider commits flip locally and roll back on next data tick. No explicit "Loading…" text. |
| **Unmatched-room console warn** | `[rooms] unmatched room name {name}` — dev-only (`process.env.NODE_ENV === 'development'`); CONTEXT D-06 + `<specifics>`. Not user-facing. |

### Tooltip / hint copy
**None.** No tooltips, no hover-cards, no info icons in Phase 179. Sheet z-index 201 is the highest interactive surface; bundle does not introduce hint affordances.

---

## Component Inventory

The following 19 net-new files implement Phase 179. All under `app/components/EmberGlass/rooms/` unless noted:

| # | File | Kind | Composition / Source |
|---|------|------|----------------------|
| 1 | `RoomsTab.tsx` | Orchestrator (`'use client'`) | Reads 5 device hooks; builds `AggregatorState`; owns `selectedRoomName: string \| null`; renders 6 `<RoomCard>` + 1 `<RoomSheet>`; `<RoomsTabSkeleton>` first-load fallback |
| 2 | `RoomCard.tsx` | Glass surface | `<Pressable as={GlassCard} onClick={onOpen}>` wrapping `<CardHead>` + 3×2 chip grid + "+N" overflow + empty state |
| 3 | `RoomSheet.tsx` | Sheet wrapper | Internally renders `<Sheet open onClose title={room?.name}>` + summary header + grouped category sections |
| 4 | `DeviceChip.tsx` | Visual chip | 1:1 chip with tone-tinted bg/border + 5×5 on-state dot; non-interactive |
| 5 | `DeviceCard.tsx` | Container | `<Pressable as="div">` (strict SC-#1 wrap, no onClick) wrapping header row + `<DeviceBody>` |
| 6 | `DevicePrimaryControl.tsx` | Header right-slot | Dispatch by kind: sonos/camera/sensor/toggle-able/placeholder |
| 7 | `DeviceBody.tsx` | Body dispatcher | `switch` on `device.kind`, returns one of 10 bodies |
| 8 | `bodies/StoveBody.tsx` | Body | 3 StatChips + ControlRow [Meno · Power · Più]; wired to `useStoveCommands` |
| 9 | `bodies/ThermoBody.tsx` | Body | DualTempReadout + ControlRow [−0.5° · +0.5° · Eco · Auto]; wired to `useThermostatCommands`; exports both `ThermoBody` and `ValveBody` (or shares; plan agent decides per CONTEXT D-01) |
| 10 | `bodies/LightBody.tsx` | Body | 2× SliderRow (Luminosità wired, Temperatura disabled); wired to `useLightsCommands.handleBrightnessChange` (per-group) |
| 11 | `bodies/PlugBody.tsx` | Body | 2-col StatChip grid [Ora · Oggi]; read-only |
| 12 | `bodies/SonosBody.tsx` | Body | Track-line + Volume SliderRow + ControlRow [SkipBack · Play/Pause · SkipForward]; wired to `useSonosCommands` |
| 13 | `bodies/TvBody.tsx` | Body | 2-col StatChip grid + ControlRow [HDMI 1 · HDMI 2 · App]; no-op |
| 14 | `bodies/ShadeBody.tsx` | Body | Posizione SliderRow + ControlRow [Su · Stop · Giù]; no-op |
| 15 | `bodies/CameraBody.tsx` | Body | 16:9 preview with LIVE caption + motion footer + 46×46 round play overlay; no-op |
| 16 | `bodies/SensorBody.tsx` | Body | 2-col StatChip grid [Valore · Trend]; read-only |
| 17 | `primitives/StatChip.tsx` | Primitive | 10px caps label + 16px display value (tabular-nums); 0.5px white border, 10px radius |
| 18 | `primitives/DualTempReadout.tsx` | Primitive | Two 22px values separated by `<ChevronRight>`; current = white, target = `tone` |
| 19 | `primitives/SliderRow.tsx` | Primitive | Read-only gradient bar (no thumb, no native input). When `onChange` provided: tap-to-seek strip computes click x → percentage → onChange(percent). `disabled` dims to 0.45. |
| 20 | `primitives/ControlRow.tsx` | Primitive | Flex row, 6px gap |
| 21 | `primitives/MiniButton.tsx` | Primitive | 34px-tall pill button, optional icon + label, `filled`/outlined variants |
| 22 | `lib/rooms-config.ts` | Config | `ROOMS`, `ROOM_ALIASES`, `EXTRA_DEVICES`, `ICON_FOR`, `CATEGORY_ORDER`, `CATEGORY_LABEL` |
| 23 | `lib/getDevicesForRoom.ts` | Pure aggregator | Takes `AggregatorState` + room name → `RoomDevice[]`; mirrors `rooms.jsx:58-128` against real hook fields |
| 24 | `types.ts` | Types | `RoomDevice` (discriminated union), `RoomConfig`, `DeviceKind`, `AggregatorState` |
| 25 | `index.ts` | Barrel | Re-exports all public symbols |
| 26 | `app/stanze/page.tsx` | Route | New Next.js route — `'use client'` + `<RoomsTab />` |
| 27 | `app/components/EmberGlass/index.ts` | Edit | Append `export * from './rooms';` after Phase 178 sheets export |

### Reused (no edits) — 11 existing assets

| Asset | Used by |
|-------|---------|
| `app/components/EmberGlass/Sheet.tsx` (Phase 175) | RoomSheet wraps it unmodified |
| `app/components/EmberGlass/Pressable.tsx` (Phase 175) | RoomCard + DeviceCard |
| `app/components/EmberGlass/GlassCard.tsx` (Phase 177) | RoomCard composes it |
| `app/components/EmberGlass/CardHead.tsx` (Phase 177) | RoomCard header |
| `app/components/EmberGlass/InlineToggle.tsx` (Phase 177) | DevicePrimaryControl for light/plug/thermo/valve |
| `app/components/EmberGlass/GlassCardSkeleton.tsx` (Phase 177) | RoomsTabSkeleton |
| `app/hooks/useDebounce.ts` | ThermoBody (500ms), LightBody (250ms), SonosBody (250ms) |
| `app/components/devices/stove/hooks/{useStoveData,useStoveCommands}` | RoomsTab + StoveBody |
| `app/components/devices/thermostat/hooks/{useThermostatData,useThermostatCommands}` | RoomsTab + ThermoBody/ValveBody + DevicePrimaryControl |
| `app/components/devices/lights/hooks/{useLightsData,useLightsCommands}` | RoomsTab + LightBody + DevicePrimaryControl |
| `app/components/devices/sonos/hooks/{useSonosFullData,useSonosCommands}` | RoomsTab + SonosBody + DevicePrimaryControl |
| `app/components/devices/tuya/hooks/{useTuyaData,useTuyaCommands}` | RoomsTab + DevicePrimaryControl |

---

## Data Aggregation Contract (ROOMS-01)

**`getDevicesForRoom(state: AggregatorState, roomName: ROOMS[number]['name']): RoomDevice[]`** is a pure, synchronous, non-memoized function (CONTEXT D-10).

### `AggregatorState` shape

```ts
export interface AggregatorState {
  stove: { on: boolean; temp: number; powerLevel: number; fanLevel: number; target?: number };
  thermostat: { zones: Array<{ name: string; on: boolean; current: number; target: number; kind: 'thermo' | 'valve'; roomId: string }> };
  lights:     { lights: Array<{ name: string; on: boolean; room_name: string | null; groupId: string; brightness?: number }> };
  plugs:      { plugs:  Array<{ id: string; name: string; on: boolean; power: number; today_kwh?: number }> };
  sonos:      { groups: Array<{ id: string; name: string; playing: boolean; track: string; artist: string; volume: number; coordinator: string }> };
}
```

The plan agent verifies exact field names against live hook outputs (`useStoveData`, `useThermostatData`, `useLightsData`, `useTuyaData`, `useSonosFullData`) and adjusts the type without re-opening this UI-SPEC.

### Aggregation rules (CONTEXT D-11..D-17)

| Source | Mapping rule |
|--------|--------------|
| Stove | Always assigned to **Soggiorno** (single device, hardcoded — `rooms.jsx:61`) |
| Thermostat zones | `ROOM_ALIASES[zone.name]`; each zone → `kind: 'thermo'` or `kind: 'valve'` per zone metadata |
| Lights | `ROOM_ALIASES[light.room_name]`; drop lights with `room_name === null`; `groupId` carried in `extra` for command wiring |
| Plugs | All plugs → **Cucina** (Tuya proxy lacks `room` field; tracked deferred — see CONTEXT `<deferred>` for registry-join follow-up) |
| Sonos groups | `ROOM_ALIASES[group.name]`; group names typically match room names (handled by aliases) |
| EXTRA_DEVICES | Per-room static mocks (TV/blinds/humidity/camera) appended to live devices in stable order |

**Unmatched room names:** dropped from the rooms-tab aggregation; emit `console.warn('[rooms] unmatched room name', name)` once per unique name in dev (CONTEXT D-06).

**Category order inside RoomSheet:** `CATEGORY_ORDER = ['stove', 'thermo', 'valve', 'light', 'plug', 'sonos', 'tv', 'camera', 'shade', 'sensor']` (CONTEXT D-09 + bundle `rooms.jsx:221`); within a category, devices keep aggregator order (stable for live, static for EXTRA).

---

## Interaction Contract

### Tap behaviors

| Surface | Action | Wires to |
|---------|--------|----------|
| RoomCard (anywhere) | Open RoomSheet for this room | `setSelectedRoomName(room.name)` |
| RoomSheet backdrop | Close sheet | `setSelectedRoomName(null)` (Phase 175 Sheet primitive default) |
| RoomSheet close button | Close sheet | Same as backdrop |
| RoomSheet Escape key | Close sheet | Phase 175 Sheet primitive default |
| DeviceChip inside RoomCard | (no direct handler) | Click bubbles to RoomCard onOpen |
| DeviceCard (entire card) | (no card-level handler — strict SC-#1 wrap with `as="div"` only) | None |
| DevicePrimaryControl — sonos play/pause | Toggle group playback | `useSonosCommands.handlePlay/handlePause(extra.groupId)` |
| DevicePrimaryControl — light toggle | Toggle group on/off | `useLightsCommands.handleRoomToggle(extra.groupId, !device.on)` |
| DevicePrimaryControl — plug toggle | Toggle plug on/off | `useTuyaCommands.togglePlug(extra.id, device.on)` |
| DevicePrimaryControl — thermo/valve toggle | Toggle room mode on/off | `useThermostatCommands.setRoomMode(extra.roomId, device.on ? 'off' : 'on')` |
| StoveBody Power button | Ignite or shutdown stove | `useStoveCommands.handleIgnite()` / `handleShutdown()` (gated on `needsCleaning`) |
| StoveBody Meno / Più | Decrement / increment power level | `useStoveCommands.handlePowerChange({ target: { value: String(powerLevel ± 1) } })` |
| ThermoBody / ValveBody −0.5° / +0.5° | Adjust setpoint (debounced 500ms) | `useThermostatCommands.setRoomSetpoint(extra.roomId, extra.target ± 0.5)` |
| ThermoBody / ValveBody Eco | Switch home mode to away | `useThermostatCommands.setHomeMode('away')` |
| ThermoBody / ValveBody Auto | Switch home mode to schedule | `useThermostatCommands.setHomeMode('schedule')` |
| LightBody Luminosità slider (tap-to-seek) | Set brightness (debounced 250ms) | `useLightsCommands.handleBrightnessChange(extra.groupId, String(percent))` (per-group) |
| LightBody Temperatura slider | (disabled — no API) | — |
| SonosBody Volume slider (tap-to-seek) | Set volume (debounced 250ms) | `useSonosCommands.handleSetVolume(extra.coordinator, percent)` |
| SonosBody SkipBack / SkipForward | Previous / Next track | `useSonosCommands.handlePrevious(extra.groupId)` / `handleNext(extra.groupId)` |
| SonosBody Play/Pause | Toggle playback | Same as DevicePrimaryControl sonos |
| TvBody HDMI 1 / HDMI 2 / App | (no-op — no TV proxy) | — |
| ShadeBody Posizione slider | (no-op — no shade proxy) | — |
| ShadeBody Su / Stop / Giù | (no-op — no shade proxy) | — |
| CameraBody play overlay | (no-op — no camera-stream proxy) | — |
| SensorBody (any) | (read-only) | — |

### Press animation (Phase 175 SC-#1)

Two glass surfaces in Phase 179:

1. **`<RoomCard>`** — wraps in `<Pressable as={GlassCard} onClick={onOpen}>`. **Required** by SC-#1.
2. **`<DeviceCard>`** — wraps in `<Pressable as="div">` with no `onClick`. Strict SC-#1 reading: every NEW glass surface in Phases 177-181 reuses Pressable, regardless of interactivity. The `.press-anim` CSS class still applies on `:active` even without a click handler — gives consistent visual feedback if the user accidentally presses a card body. CONTEXT D-61 records the strict interpretation.

Sub-primitives (`<MiniButton>`, `<DeviceChip>`, `<SliderRow>` thumbless bar, sheet-internal buttons) are NOT glass surfaces — they're tone-tinted small chips. They use the browser default `:active` state. NOT wrapped in Pressable. CONTEXT D-62.

### Optimistic UI

All commands use the existing `useRetryableCommand` infrastructure transitively via the commands hooks. Optimistic UI pattern (CONTEXT D-40): toggle/slider commits flip local state immediately; the next data tick (60s polling or WS push) confirms or reverts. No additional optimistic logic in Phase 179 components — the commands hooks already handle this.

### Skeleton + error states

| State | Visual |
|-------|--------|
| First-load (all hooks loading) | `<RoomsTabSkeleton>` — page title block + 6 `<GlassCardSkeleton>` placeholders in 2-col grid (CONTEXT D-45) |
| Partial loading (some hooks loaded) | RoomCards render with partial counts; loading hooks contribute zero devices |
| All-error (every hook failed, no cache) | Page title + `Non raggiungibile. Riprova più tardi.` + retry button calling `refetch()` on each hook (CONTEXT D-46) |
| Empty room (zero devices for a room) | RoomCard shows `Nessun dispositivo` centered in chip-grid (CONTEXT D-47) |

---

## Accessibility Contract

| Concern | Resolution |
|---------|-----------|
| Sheet keyboard dismissal | Phase 175 `<Sheet>` already wires Escape via Radix Dialog. RoomSheet inherits. |
| Sheet focus trap | Radix Dialog handles focus trap automatically. Inputs inside DeviceBody (sliders, buttons, toggles) participate via natural tab order. |
| Sheet focus return | Radix Dialog returns focus to the RoomCard that triggered open (default behavior). |
| RoomCard keyboard activation | Pressable wraps GlassCard. GlassCard renders as a `<button>` element by default (Phase 177); Enter/Space activate `onClick`. Plan agent verifies. |
| DeviceCard keyboard activation | DeviceCard wraps in `<Pressable as="div">` with no onClick — non-interactive. Sub-controls inside (toggles, buttons, sliders) are keyboard-accessible via their own button/range elements. |
| InlineToggle keyboard | Phase 177 primitive (`<button role="switch">`) inherits keyboard activation. |
| MiniButton keyboard | Native `<button>` — Enter/Space activate. |
| SliderRow keyboard | When interactive (`onChange` provided), tap-to-seek strip uses click events only — **no keyboard arrow-key support in v20.0** (deferred; bundle is mouse/touch only). Arrow-key seek can be added in a future polish phase. The `disabled` variant has `aria-disabled="true"` and `cursor: not-allowed`. |
| Color-temp slider in LightBody | Always disabled — `aria-disabled="true"`, opacity 0.45, no cursor pointer. JSDoc documents the API gap. |
| Color contrast — dim text | `var(--text-2)` = `rgba(245, 245, 244, 0.55)` over the dark ambient/glass background. Phase 174 D-01 verified WCAG AA contrast for body text. The 11px caps labels carry uppercase + letter-spacing — Phase 174 contrast applies. |
| Color contrast — tone-tinted on-state | Per-tone glow + `color-mix` border; minimum 35% mix maintains visibility. The dim off-state (DeviceCard `rgba(255,255,255,0.03)`) is acceptable per Phase 177 precedent. |
| Pulse animation respect for prefers-reduced-motion | **Not implemented in v20.0** — Phase 175 D-15 deferred reduced-motion overrides for the entire milestone. Phase 179 inherits the deferral. |
| Touch targets <44px | MiniButton (34×34), DevicePrimaryControl sonos play/pause (40×40), DeviceChip (no touch — bubbles) — all locked for bundle fidelity. Documented exceptions; not blocking. |
| Screen-reader RoomSheet title | Sheet primitive renders `<DialogTitle>` from `title` prop (room name); fallback `VisuallyHidden` from Phase 175. |
| Screen-reader DeviceCard | Header text (name + status line) is the announced label; status line includes "Attivo"/"Inattivo" + value. |
| Screen-reader LIVE/OK pill | Plain text inside the pill is announced ("LIVE", "OK"). The pulsing dot is decorative. |
| `data-testid` coverage | Per CONTEXT D-65: `stanze-room-{name}` (RoomCard), `stanze-room-{name}-chip-{i}` (DeviceChip inside RoomCard), `stanze-sheet-{name}` (RoomSheet container), `stanze-device-{kind}-{i}` (DeviceCard), `stanze-{kind}-{control}` (body controls — e.g. `stanze-stove-power-button`, `stanze-thermo-target-up`, `stanze-light-brightness-slider`). |

---

## Animation & Motion

All motion respects Phase 175 defaults; no new keyframes introduced.

| Surface | Animation | Source |
|---------|-----------|--------|
| Pressable `.press-anim` | `scale(0.97)` cubic-bezier `.34,1.56,.64,1` 220ms | Phase 175 carry-forward (RoomCard + DeviceCard) |
| Sheet open/close | `transform: translateY()` cubic-bezier `.22,1,.36,1` 400ms | Phase 175 carry-forward |
| DevicePrimaryControl LIVE/OK dot | `pulse 1.6s ease-in-out infinite` | Phase 174/176 keyframe `pulse` (carry-forward) |
| CameraBody LIVE caption dot | `pulse 1.4s ease-in-out infinite` | Same `pulse` keyframe, different duration |
| Slider gradient glow | `boxShadow: 0 0 8px color-mix(in oklab, ${tone} 40%, transparent)` static | Bundle-verbatim (no animation) |
| MiniButton filled glow | `boxShadow: 0 0 10px color-mix(in oklab, ${tone} 25%, transparent)` static | Bundle-verbatim |
| DeviceCard `transition` | `transition: 'all .2s'` (`rooms.jsx:286`) — generic 200ms ease for tone tint changes when `device.on` flips | Bundle-verbatim |

**Reduced-motion:** deferred across v20.0 (Phase 175 D-15). All animations run regardless of `prefers-reduced-motion`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — Phase 179 introduces zero shadcn blocks. | not required |
| third-party | none — no third-party registries declared. | not required |

**Verified 2026-04-29:** `components.json` does not exist. No shadcn CLI presence. Project uses Tailwind v4 + CVA + custom EmberGlass primitives. Phase 179 follows the Phase 174-178 convention exactly — no new registry consumption.

---

## Cross-Phase Consistency Sign-Off

| Prior Phase | Decision Carried Forward | Verified |
|-------------|-------------------------|----------|
| Phase 174 | Token block on `:root` (`--accent`, `--text-1`, `--text-2`, `--font-display`, `--font-body`, `--r-card`, `--pad-card`, `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`) — consumed verbatim | `app/globals.css` confirms |
| Phase 174 | Inline `style={{ }}` + `var(--token)` mandate | Phase 179 follows |
| Phase 175 | `<Sheet>` API `{ open, onClose, title }` — RoomSheet wraps unmodified | CONTEXT D-21 |
| Phase 175 | Sheet z-index 200/201 reservation — Phase 179 introduces no new z-indices | yes |
| Phase 175 | Sheet tap/Escape/backdrop dismissal only; no swipe/long-press | inherited |
| Phase 175 | No reduced-motion overrides in v20.0 | inherited |
| Phase 175 | `<Pressable>` SC-#1 — every NEW glass surface in Phases 177-181 wraps in Pressable | RoomCard wraps + DeviceCard `as="div"` strict-wrap (CONTEXT D-61) |
| Phase 176 | `pulse` keyframe in `globals.css` — DevicePrimaryControl + CameraBody reuse | yes (no redefinition) |
| Phase 177 | `<GlassCard>`, `<CardHead>`, `<InlineToggle>`, `<GlassCardSkeleton>` — consumed verbatim | yes |
| Phase 177 | `data-testid` per-component convention | extended (`stanze-*` prefix) |
| Phase 177 | React Compiler discipline — no `useMemo`/`useCallback` | enforced (CONTEXT D-66/D-67) |
| Phase 178 | `useThermostatCommands` hook — consumed unmodified | CONTEXT D-38 |
| Phase 178 | Per-body imports (self-fetch pattern) — bodies own their commands hooks | CONTEXT D-39 |
| Phase 178 | Optimistic UI via `useRetryableCommand` infrastructure | CONTEXT D-40 |
| Phase 178 | 250ms volume / 250ms brightness / 500ms setpoint debounce | Phase 179 reuses across SonosBody/LightBody/ThermoBody |
| Phase 178 | Sheet sub-primitives (`SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton`) — **NOT reused** (different visual shape) | CONTEXT `<domain>` Out of scope |

---

## Assumptions Log (Auto-Mode Decisions)

The phase ran in `--auto` mode against pre-validated CONTEXT.md (D-01..D-69 locked). The following auto-resolutions were grounded in bundle + prior-phase precedent:

| # | Question | Resolution | Source |
|---|----------|------------|--------|
| A1 | Should Phase 179 introduce new tokens for the per-room hex tones (Cucina/Camera/Studio/Bagno/Ingresso)? | **No.** Hex literals stay inline in `lib/rooms-config.ts` per bundle `rooms.jsx:6-13`. Documented as AUDIT-EXCEPTION because they replace what could be tokens. Promoting to tokens is a polish-phase decision. | Bundle + CONTEXT D-05 (frozen) |
| A2 | Should the unmatched-room console.warn fire in production? | **No.** Dev-only via `process.env.NODE_ENV === 'development'` gate. | CONTEXT D-06 + project memory pattern |
| A3 | Should `<DeviceCard>` wrap in `<Pressable as="div">` with no onClick, or skip Pressable? | **Wrap.** Strict SC-#1 reading: every NEW glass surface wraps regardless of interactivity. | CONTEXT D-61 (Recommend strict) |
| A4 | Should `<MiniButton>` wrap in `<Pressable as="button">`? | **No.** MiniButton is a tone-tinted chip, not a glass surface. Browser `:active` is sufficient. | CONTEXT D-62 |
| A5 | Should the brightness slider commit per-light or per-group? | **Per-group** via `useLightsCommands.handleBrightnessChange`. Per-light needs a new endpoint. | CONTEXT D-29 (deferred per-light) |
| A6 | Should the color-temp slider in LightBody be wired? | **No.** No Hue color-temp endpoint in `useLightsCommands`. Slider renders disabled with `aria-disabled="true"`. | CONTEXT D-29 |
| A7 | Should `<ThermoBody>` and `<ValveBody>` share a single file? | **Yes** (preferred). Same body shape; one discriminator inside (`kind === 'valve' ? 'Termovalvola' : 'Termostato'`). Plan agent may split if it improves readability. | CONTEXT D-01 (claude's discretion: recommend share) |
| A8 | Where does the page mount? | **`/stanze`** (Italian, matches NAV-02 label, avoids `/rooms` collision). | CONTEXT D-04 |
| A9 | Should commands hooks centralize at RoomsTab orchestrator? | **No.** Per-body imports per Phase 178 D-04 self-fetch pattern. Keeps orchestrator <100 LOC. | CONTEXT D-39 |
| A10 | Should `<RoomCard>` count badge color use `var(--accent)` or `room.tone` when active? | **`room.tone`.** Each room's badge is a different color when active (per bundle `rooms.jsx:166-167`). | CONTEXT D-05 + bundle |
| A11 | Should the +N overflow chip be interactive (open RoomSheet immediately)? | **No.** Click bubbles to RoomCard via parent — opens RoomSheet which shows all devices anyway. No special handler. | Bundle-verbatim |
| A12 | Should DeviceChip have a tooltip showing device name on hover? | **No.** Bundle does not introduce tooltips; hover is non-distinguishing on touch devices. Device name appears in DeviceCard inside RoomSheet. | Bundle-verbatim |
| A13 | Should the RoomSheet category section render an empty section when 0 devices? | **No.** Filter to categories with `items.length > 0` (bundle `rooms.jsx:230`). | Bundle |
| A14 | Should `<SliderRow>` show a thumb for the current value? | **No.** Bundle's slider is a thumbless gradient bar (no native input). The 0.45 disabled opacity + width % gradient is the only visual indicator. Tap-to-seek strip is the interaction. | Bundle `rooms.jsx:572-583` |
| A15 | Should the Stove Power button gate on `needsCleaning`? | **Yes.** Mirrors Phase 178 D-05. `useStoveCommands` already exposes `handleConfirmCleaning` for the gate. | CONTEXT D-27 + Phase 178 D-05 |
| A16 | Should the unmatched-room behavior render an "Other" bucket? | **No.** Drop unmatched devices entirely. Keeps 6-card grid clean and ROOMS-02 chip-grid tidy. | CONTEXT D-06 |
| A17 | Should EXTRA_DEVICES be flagged with a `mock: true` marker? | **Yes** on the `RoomDevice` type, so future phases that ship real proxies for TV/blinds/humidity/camera can swap in without touching aggregator code. | CONTEXT D-07 |
| A18 | Should the existing v15.0 `/rooms` admin-CRUD page be touched? | **No.** It manages a different concept (registry rooms entity); Phase 179 ships the dashboard *Rooms tab* surface at `/stanze`. Cleanup is a post-181 decision. | CONTEXT `<domain>` Out of scope |
| A19 | Should the new `/stanze` route be wired into a navigation bar? | **No.** Phase 181 ships the glass bottom tab bar. Phase 179 leaves the route reachable via direct URL (sufficient for jest/Playwright + manual UAT). | CONTEXT `<domain>` Out of scope |
| A20 | Should DIRIGERA contact/motion sensors join the rooms tab? | **No.** Dirigera proxy lacks room field; Phase 179 keeps the static "Bagno → Umidità" sensor mock; future phase wires real DIRIGERA sensors. | CONTEXT `<deferred>` |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (Italian, frozen, bundle-verbatim — all 60+ strings catalogued)
- [ ] Dimension 2 Visuals: PASS (component inventory complete; bundle-verbatim shapes; no missing primitives)
- [ ] Dimension 3 Color: PASS (60/30/10 mapping declared; per-room + per-device tone palette frozen; AUDIT-EXCEPTION hex literals justified by bundle)
- [ ] Dimension 4 Typography: PASS (sizes 9-30 declared per role; weights regular/medium/semibold/bold; tabular-nums on numerics)
- [ ] Dimension 5 Spacing: PASS (4-multiple base scale + bundle-verbatim micro-affordances at 0.5/3/5/9/11/14/22/34/40/42/46/70 — each documented with bundle line reference)
- [ ] Dimension 6 Registry Safety: PASS (no shadcn, no third-party — n/a)

**Approval:** pending (gsd-ui-checker upgrades to `approved YYYY-MM-DD` after sign-off)
