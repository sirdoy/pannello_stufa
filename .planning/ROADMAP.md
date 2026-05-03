# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- ✅ **v6.0 Operations, PWA & Analytics** — Phases 49-54 (shipped 2026-02-11)
- ✅ **v7.0 Performance & Resilience** — Phases 55-60 (shipped 2026-02-13)
- ✅ **v8.0 Fritz!Box Network Monitor** — Phases 61-67 (shipped 2026-02-16)
- ✅ **v8.1 Masonry Dashboard** — Phases 68-69 (shipped 2026-02-18)
- ✅ **v9.0 Performance Optimization** — Phases 70-74 (shipped 2026-02-19)
- ✅ **v10.0 Netatmo API Migration** — Phases 75-83 (shipped 2026-03-16)
- ✅ **v11.0 API Unification & Raspberry Pi Monitor** — Phases 84-91 (shipped 2026-03-18)
- ✅ **v11.1 Test Suite & Tech Debt Cleanup** — Phases 92-95 (shipped 2026-03-18)
- ✅ **v12.0 Data Fetching Simplification & E2E Verification** — Phases 96-98 (shipped 2026-03-19)
- ✅ **v13.0 Thermorossi Proxy Migration** — Phases 99-105 (shipped 2026-03-20)
- ✅ **v14.0 Hue Proxy Migration** — Phases 106-112 (shipped 2026-03-22)
- ✅ **v14.1 Tech Debt & Type Safety** — Phases 113-117 (shipped 2026-03-22)
- ✅ **v15.0 Rooms & Device Registry** — Phases 118-125 (shipped 2026-03-23)
- ✅ **v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato** — Phases 126-138 (shipped 2026-03-26)
- ✅ **v17.0 WebSocket Real-Time Transport** — Phases 139-144 (shipped 2026-03-28)
- ✅ **v17.1 WebSocket Alignment & Tuya Integration** — Phases 145-148 (shipped 2026-03-30)
- ✅ **v18.0 Dark-Only & Mobile-First** — Phases 149-155 (shipped 2026-04-02)
- ✅ **v19.0 API Alignment & Full Coverage** — Phases 156-173 (shipped 2026-04-27) — [archive](milestones/v19.0-ROADMAP.md)
- 🚧 **v20.0 Ember Glass Redesign** — Phases 174-182 (started 2026-04-27)

## Phases

<details open>
<summary>🚧 v20.0 Ember Glass Redesign (Phases 174-182) — IN PROGRESS</summary>

- [x] Phase 174: Ember Glass Tokens & Foundations (3/3 plans) — complete 2026-04-27
- [ ] Phase 175: Glass Primitives — Press Animation & Sheet (0/0 plans) — not started
- [ ] Phase 176: Post-Auth0 Splash Animation (0/0 plans) — not started
- [ ] Phase 177: Equal-Size Dashboard Glass Cards (0/8 plans) — not started
- [x] Phase 178: Per-Device Modal Sheets (10/10 plans) — complete 2026-04-29 (verification: human_needed — see 178-HUMAN-UAT.md)
- [ ] Phase 179: Rooms Tab Redesign (0/9 plans) — not started
- [ ] Phase 180: Automations Tab Full Editor (0/9 plans) — not started
- [x] Phase 181: Glass Bottom Tab Bar (6/6 plans) — completed 2026-05-02
- [ ] Phase 182: Design System Reference Page v2 (0/9 plans) — not started

</details>

## Phase Details

### Phase 174: Ember Glass Tokens & Foundations
**Goal**: Establish the Ember Glass design language as a token system that drives every surface, with oklch hue support, typography pair, ambient glow, and graceful blur fallback.
**Depends on**: Nothing (first phase of v20.0)
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, DS-06
**Success Criteria** (what must be TRUE):
  1. `:root` exposes `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--accent` (oklch), `--text-1`, `--text-2`, `--r-card`, `--pad-card`, `--font-display`, `--font-body` and a repo-wide grep finds zero hardcoded glass/blur/accent hex values in component files.
  2. A developer toolbar at `/debug` lets the user pick one of 6 oklch hues (copper, rose, violet, blue, green, amber) and the chosen hue updates `--accent` live across the app within the dev session.
  3. Outfit (display) and Inter (body) load via `next/font` with no runtime request to fonts.googleapis.com (verified via DevTools Network panel).
  4. Ambient radial-gradient glow is togglable via a user preference, persists in `localStorage`, and survives a hard reload.
  5. Glass surfaces apply `backdrop-filter: blur() saturate(180%)` with `-webkit-backdrop-filter` fallback; on a browser that does not support `backdrop-filter` (feature query `@supports not`), surfaces fall back to a solid translucent background instead of becoming illegible.
**Plans**: 3 plans
- [x] 174-01-token-foundations-PLAN.md — Ember Glass token block on :root + Inter font swap + .glass-surface utility + @supports fallback + ambient keyframes (DS-01, DS-04, DS-06) [Wave 1]
- [x] 174-02-ambient-bg-prepaint-PLAN.md — AmbientBg client provider + inline pre-paint script in app/layout.tsx for accent + ambient hydration without flash (DS-03, DS-05) [Wave 1]
- [x] 174-03-design-system-v2-page-PLAN.md — /debug/design-system-v2 page (6-hue picker + ambient toggle + token grid + glass demo) + 3 Playwright smoke specs + DS-02 audit + /debug nav link (DS-02, DS-03, DS-04, DS-05) [Wave 2]
**UI hint**: yes

### Phase 175: Glass Primitives — Press Animation & Sheet
**Goal**: Ship the two reusable interaction primitives every later phase will compose against — the shared press animation utility and the bottom sheet component (with all dismissal modes, scroll-lock, and motion curve).
**Depends on**: Phase 174
**Requirements**: DS-07, SHEET-01
**Success Criteria** (what must be TRUE):
  1. A single shared utility (component wrapper or class) applies `scale(0.97)` with cubic-bezier `.34,1.56,.64,1` over 220ms on press, and is reused (verifiable via grep for the class/component) by every interactive glass surface introduced in Phases 177-181.
  2. The Sheet primitive renders a translucent surface (rgba bg + `backdrop-filter: blur`), translates from off-screen with cubic-bezier `.22,1,.36,1` over 400ms on open, and translates out on close.
  3. The Sheet primitive can be dismissed via Escape key, tap on backdrop, and tap on the close button, and exposes a grabber + title bar in its header.
  4. Body scroll is locked while the Sheet is open and restored to the original scroll position on close.
  5. A Sheet preview rendered in isolation passes manual smoke at 375px (mobile) and 1024px (desktop) without layout regressions.
**Plans**: 3 plans
- [x] 175-01-pressable-primitive-PLAN.md — Pressable component + usePressed hook + .press-anim CSS utility + jest unit tests (DS-07) [Wave 1]
- [x] 175-02-sheet-primitive-PLAN.md — Sheet primitive (Radix Dialog facade) + scroll-lock recipe + jest unit tests (SHEET-01) [Wave 1]
- [x] 175-03-barrel-demo-smoke-PLAN.md — EmberGlass barrel index.ts + design-system-v2 page Sections 05-06 + Playwright smoke specs (DS-07, SHEET-01) [Wave 2]
**UI hint**: yes

### Phase 176: Post-Auth0 Splash Animation
**Goal**: Insert a ~2-second splash animation between Auth0 sign-in/session-restore and the dashboard mount, with reduced-motion respect and non-blocking initial fetches.
**Depends on**: Phase 174
**Requirements**: SPLASH-01, SPLASH-02, SPLASH-03, SPLASH-04, SPLASH-05
**Success Criteria** (what must be TRUE):
  1. After a successful Auth0 sign-in or session restore, the user sees the splash screen before the dashboard, and after a clean cold start the splash always appears once.
  2. The splash plays the documented sequence (flame logo scale-in → wordmark "Home" + subtitle "Connessione al gateway…" → "Autenticato · Auth0" badge → fade-out crossing into a scale-in of the dashboard) within ~2s total wall time.
  3. With `prefers-reduced-motion: reduce`, the splash collapses to a 200ms opacity fade with no scale/transform on either layer.
  4. Subsequent client-side route changes within the same session never re-trigger the splash (verified via in-app navigation between Home / Stanze / Automazioni).
  5. The dashboard's first device-data fetches start during the splash window so cards either render immediately or within their normal stale-data envelope after the splash unmounts.
**Plans**: 4 plans
- [x] 176-01-flameviz-and-keyframes-PLAN.md — FlameViz primitive (verbatim port from bundle cards.jsx) + globals.css keyframes (pulse, flamePulse) + barrel export + jest unit tests (SPLASH-02) [Wave 1]
- [x] 176-02-splash-presentational-PLAN.md — Splash presentational component (4-phase state machine + reduced-motion variant) + useReducedMotion SSR-safe hook + barrel export + jest fake-timer tests (SPLASH-02, SPLASH-03) [Wave 2]
- [x] 176-03-splashgate-orchestrator-PLAN.md — SplashGate orchestrator (useUser + sessionStorage + useReducedMotion + ready state) + ClientProviders wiring + barrel export + jest unit tests with mocked Auth0 (SPLASH-01, SPLASH-04, SPLASH-05) [Wave 3]
- [x] 176-04-playwright-smoke-PLAN.md — tests/smoke/splash.spec.ts (5 specs covering all SPLASH-01..05 end-to-end) + /debug/design-system-v2 Replay splash button + manual verification checkpoint (SPLASH-01, SPLASH-02, SPLASH-03, SPLASH-04, SPLASH-05) [Wave 4]
**UI hint**: yes

### Phase 177: Equal-Size Dashboard Glass Cards
**Goal**: Redesign the dashboard as an equal-size 2-column 1:1 glass-card grid where every device card has identical footprint and the documented per-card content shape, while preserving v9.0 stagger and React Compiler memoization.
**Depends on**: Phase 174, Phase 175
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12
**Success Criteria** (what must be TRUE):
  1. The dashboard renders Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, Tuya/Plugs cards on a 2-column mobile grid; every card has aspect-ratio 1:1 and the same outer footprint (verifiable visually and via DOM inspection).
  2. Each card matches its content spec: StoveCard (temp + animated/static flame + Fiamma N · Ventola N or "Spenta"), ClimateCard (≤4 zones inline + N/M counter), LightsCard (≤4 on-light names + status dots + +N overflow + header toggle), SonosCard (≤4 groups + playing-bars + count header), WeatherCard (temp + city + condition + hi/lo), CameraCard (preview + LIVE badge + source), NetworkCard (down Mbps + up + device count), RaspiCard (CPU/RAM 2-stat grid + temp footer), Plugs/TuyaCard (≤4 plug names + total power + N/M footer with no inline toggles).
  3. Tapping a card opens its corresponding modal sheet (Phase 178); WeatherCard and RaspiCard are explicitly read-only and do not open a sheet on tap.
  4. Card mount stagger (initialDelay pattern from v9.0) is preserved and visible on a fresh dashboard load.
  5. React Compiler auto-memoization remains active — `npx react-compiler-healthcheck` (or equivalent) reports zero new opt-outs introduced by the redesign and the existing `useMemo`/`useCallback` discipline is unchanged.
**Plans**: 8 plans
- [x] 177-01-glass-primitives-PLAN.md — 5 stateless EmberGlass micro-primitives (GlassCard, CardHead, StatusDot, MiniStat, InlineToggle) + jest tests (DASH-01, DASH-04, DASH-09, DASH-12) [Wave 1]
- [x] 177-02-foundation-skeleton-keyframes-PLAN.md — PlayingBars + GlassCardSkeleton + SheetPlaceholderBody + sonosBar keyframes + useWeatherSummary hook (DASH-05, DASH-06, DASH-11, DASH-12) [Wave 1]
- [x] 177-03-stove-climate-cards-PLAN.md — StoveCard (FlameViz + power_level readout) + ClimateCard (≤4 zones + N/M attive) (DASH-02, DASH-03, DASH-11, DASH-12) [Wave 2]
- [x] 177-04-lights-sonos-cards-PLAN.md — LightsCard (header InlineToggle + ≤4 + overflow + Spente empty state) + SonosCard (PlayingBars + count copy) (DASH-04, DASH-05, DASH-11, DASH-12) [Wave 2]
- [x] 177-05-weather-camera-network-cards-PLAN.md — WeatherCard (read-only, no Sheet) + CameraCard (LIVE pill + img snapshot) + NetworkCard (down Mbps + device count) (DASH-06, DASH-07, DASH-08, DASH-11, DASH-12) [Wave 2]
- [x] 177-06-raspi-tuya-dirigera-cards-PLAN.md — RaspiCard (read-only, 2-stat MiniStat) + TuyaCard (no inline toggles) + DirigeraCard (empty list per A-02) (DASH-09, DASH-10, DASH-11, DASH-12) [Wave 2]
- [x] 177-07-dashboard-integration-PLAN.md — DashboardCards.tsx 2-col grid rewrite + barrel exports + Sonos visibility flip (A-03) + jest update (DASH-01, DASH-05, DASH-11, DASH-12) [Wave 3]
- [x] 177-08-playwright-smoke-PLAN.md — tests/smoke/dashboard-glass-cards.spec.ts (DASH-01..DASH-12 end-to-end) + final React Compiler grep gate + phase-closing SUMMARY (DASH-01..DASH-12) [Wave 4]
**UI hint**: yes

### Phase 178: Per-Device Modal Sheets
**Goal**: Build the five device-specific control sheets that the dashboard cards open into, each with its documented controls and using the Sheet primitive from Phase 175.
**Depends on**: Phase 175, Phase 177
**Requirements**: SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06
**Success Criteria** (what must be TRUE):
  1. StoveSheet shows the large temp readout, target/fan/power steppers + sliders, Orari/Manutenzione buttons, and a single large Accendi/Spegni primary button wired to existing useStoveCommands.
  2. ClimateSheet shows horizontal zone selector chips, an Apple-Home-style radial dial for the selected zone target, a mode picker (Auto/Manuale/Eco/Off), and per-zone toggles wired to the existing thermostat hooks.
  3. LightsSheet shows the accese count card, "Tutte on/Tutte off" buttons, 4 scene buttons (Rilassante/Concentrato/Cena/Notte), and a per-room grouped list with individual toggles.
  4. SonosSheet shows a group list with colored album-art tile + name + track + play/pause per row, a volume slider for the selected group, and a "Riproduci/Pausa ovunque" master button.
  5. PlugsSheet shows accese count + total consumption summary cards and a per-plug list (name + room + live W/kW + individual toggle); toggling a plug from the dashboard card is impossible (no toggle controls rendered there) but works inside the sheet.
**Plans**: 10 plans
- [x] 178-01-sheet-primitives-PLAN.md — Six bundle-verbatim sub-primitives (SheetRow, Stepper, Slider, RadialDial, SheetBtn, QuickActionButton) + 6 jest specs + globals.css 3-LOC focus rule (SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06) [Wave 1]
- [x] 178-02-helper-and-barrel-PLAN.md — findSceneByName helper + sheets/index.ts barrel + 5 sheet body stubs + EmberGlass top-level barrel re-export (SHEET-04) [Wave 1]
- [x] 178-03-thermostat-commands-hook-PLAN.md — New useThermostatCommands hook wrapping setroomthermpoint + setthermmode via useRetryableCommand + jest spec (SHEET-03) [Wave 1]
- [x] 178-04-stove-sheet-PLAN.md — StoveSheet body (hero + 2 SheetRows + SheetBtn grid + primary action; Pitfall 11 footnote drop) + jest spec (SHEET-02) [Wave 2]
- [x] 178-05-climate-sheet-PLAN.md — ClimateSheet body (zone chips + RadialDial debounced 500ms + Tipo SheetRow + 4-pill grid; Pitfall 5 Manuale UI-only) + jest spec (SHEET-03) [Wave 2]
- [x] 178-06-lights-sheet-PLAN.md — LightsSheet body (summary + 4 scene buttons + per-room sections; Pitfall 9 byRoom from groups) + jest spec (SHEET-04) [Wave 2]
- [x] 178-07-sonos-sheet-PLAN.md — SonosSheet body (group list + debounced volume 250ms + master Promise.allSettled; Pitfall 7 flat coordinator_uid) + jest spec (SHEET-05) [Wave 2]
- [x] 178-08-plugs-sheet-PLAN.md — PlugsSheet body (2-col summary + plug list with kW/W boundary; Pitfall 8 drop room segment) + jest spec (SHEET-06) [Wave 2]
- [x] 178-09-card-swap-integration-PLAN.md — Single-line swap of <SheetPlaceholderBody> → <*Sheet> in 5 cards (Stove/Climate/Lights/Sonos/Tuya) + 5 jest spec updates (SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06) [Wave 3]
- [x] 178-10-playwright-smoke-PLAN.md — Extend tests/smoke/dashboard-glass-cards.spec.ts with 5 SHEET-* describe blocks (mock + click + assert request hit + DASH-10/SHEET-06 cross-check) (SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06) [Wave 4]
**UI hint**: yes

### Phase 179: Rooms Tab Redesign
**Goal**: Rebuild the Rooms tab as a fully data-driven layout with per-room glass cards, category-colored device chips, and an expanded RoomSheet with type-specific control bodies for every device class.
**Depends on**: Phase 175, Phase 178
**Requirements**: ROOMS-01, ROOMS-02, ROOMS-03, ROOMS-04, ROOMS-05
**Success Criteria** (what must be TRUE):
  1. Rooms tab derives its device list per room from the existing `state.thermostat.zones`, `state.lights`, `state.plugs`, `state.sonos.groups`, `state.stove`, plus the static device entries (TV, blinds, humidity sensor, entrance camera) — no hardcoded room/device lists in JSX.
  2. Each RoomCard shows header (room icon + name + N/M attivi counter) and a 3×2 grid of category-colored device chips (accent for stove, yellow for lights, blue for thermo, violet for audio, etc.) with a "+N" overflow chip when device count exceeds 6.
  3. Tapping a RoomCard opens a RoomSheet with a summary header (name + icon + active counts + category count) and per-category sections.
  4. Inside RoomSheet, each device renders as an expanded card (one card per device, not a flat row): header has icon + name + status text + primary toggle/play/LIVE badge, and the body has type-specific controls.
  5. Type-specific bodies match the spec — Stove (3 stat chips + −/power/+ row), Thermostat/Valve (current→target dual readout + ±0.5°/Eco/Auto), Light (brightness slider + color-temp slider), Plug (Ora W/kW + Oggi kWh chip), Sonos (track + volume + skip/play/skip), TV (source + volume + HDMI selector), Blind (position slider + Up/Stop/Down), Camera (16:9 preview + LIVE + fps + last-motion + play), Humidity (value + trend chip).
**Plans**: 9 plans
- [x] 179-01-PLAN.md — Wave 0: types + lib (rooms-config + getDevicesForRoom) + aggregator unit tests (ROOMS-01) [Wave 0]
- [x] 179-02-PLAN.md — Wave 1: 5 primitives (StatChip / DualTempReadout / SliderRow / ControlRow / MiniButton) + jest specs (ROOMS-04, ROOMS-05) [Wave 1]
- [x] 179-03-PLAN.md — Wave 1: RoomCard + DeviceChip + jest specs (ROOMS-02) [Wave 1]
- [x] 179-04-PLAN.md — Wave 2: DeviceCard + DevicePrimaryControl + DeviceBody dispatcher (ROOMS-04) [Wave 2]
- [x] 179-05-PLAN.md — Wave 2: 6 bodies (Stove wired + Plug/Sensor read-only + Tv/Shade/Camera no-op) (ROOMS-05) [Wave 2]
- [x] 179-06-PLAN.md — Wave 2: ThermoBody (+ ValveBody) debounced 500ms + LightBody debounced 250ms (ROOMS-05) [Wave 2]
- [x] 179-07-PLAN.md — Wave 2: SonosBody debounced 250ms with handleSetZoneVolume (ROOMS-05) [Wave 2]
- [x] 179-08-PLAN.md — Wave 3: RoomSheet + RoomsTab orchestrator + barrel + EmberGlass index + /stanze route (ROOMS-01, ROOMS-03) [Wave 3]
- [x] 179-09-PLAN.md — Wave 3: Playwright smoke tests/smoke/rooms-tab.spec.ts (5 ROOMS-* scenarios) + human UAT (ROOMS-01..05) [Wave 3]
**UI hint**: yes

### Phase 180: Automations Tab Full Editor
**Goal**: Replace the current automations UI with a full editor — list view with status pills, "Nuova automazione" sheet with 4 inner tabs, type-specific forms for triggers/conditions/actions, AND/OR nested condition groups, advanced cooldown controls, save guards, and edit/delete flows.
**Depends on**: Phase 175
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05, AUTO-06, AUTO-07, AUTO-08
**Success Criteria** (what must be TRUE):
  1. Automations list renders each automation as a row with icon + name + description + enable/disable toggle + status pill (trigger type + condition count + action count + "ultima esecuzione: …").
  2. "Nuova automazione" opens an editor sheet with Name + Description fields and 4 inner tabs (Trigger / Condizioni / Azioni / Avanzate); each tab shows a numeric badge with its current item count.
  3. Trigger picker supports all 5 documented types from `docs/automations.md` (`schedule_cron`, `sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`, `manual`) with type-specific forms, including a visual hint for cron strings.
  4. Conditions support nested AND/OR groups up to 2 levels deep with a per-group operator toggle and colored side-bars for visual nesting; the 4 condition types `time_window`, `device_state`, `temperature_range`, `always_true` each have their dedicated form.
  5. Actions list supports the 9 action types (`netatmo_set_room_temp`, `netatmo_set_home_mode`, `netatmo_switch_schedule`, `stove_command`, `lights_command`, `plug_command`, `sonos_command`, `http_webhook`, `log_event`), each row has type-specific form + reorder ↑/↓ + remove; the Avanzate tab exposes `min_interval_seconds` and `max_triggers_per_hour`; Save is disabled until name is non-empty AND ≥1 action exists; an unsaved-changes guard prompts on close; existing automations open in the same editor and surface a Delete (with confirm) button in edit mode.
**Plans**: 9 plans
- [x] 180-01-PLAN.md — Foundation: rewrite types/automations.ts (D-05) + patch 3 legacy consumers + add assertNever helper [Wave 1]
- [x] 180-02-PLAN.md — Lib + UI types: catalogs (TRIGGER_TYPES/CONDITION_TYPES/ACTION_TYPES per D-08+D-09) + factories + apiToDraft/draftToApi/computePatchDelta mappers + countConditions + describeTrigger (AUTO-03, AUTO-04, AUTO-05) [Wave 2]
- [x] 180-03-PLAN.md — 10 inline-style primitives (FieldLabel, TextInput, NumInput, SegmentedControl, TwoCol, TypeTile, AddChip, Pill, CronHint, IconBtn) per UI-SPEC visual contract (AUTO-02, AUTO-04, AUTO-05) [Wave 2]
- [x] 180-04-PLAN.md — TriggerSection (2 tiles per D-08) + 2 trigger forms (ScheduleCronForm + ManualApiCallForm) + edit-mode read-only (D-12) (AUTO-03) [Wave 3]
- [x] 180-05-PLAN.md — ConditionsSection + recursive ConditionGroup (depth-2 cap per D-11, AND/OR toggle) + ConditionItem + 4 leaf forms with API field names (AUTO-04) [Wave 3]
- [x] 180-06-PLAN.md — ActionsSection (11-tile picker per D-09) + ActionRow (reorder + remove) + 11 action forms with discriminator narrowing + http_webhook JSON validation (AUTO-05) [Wave 3]
- [x] 180-07-PLAN.md — AdvancedSection (cooldown fields per AUTO-06) + AutomationEditor (4-tab nav + tab badges + dirty tracking + save guard + ConfirmationDialog wiring per D-12/13/14/15/16) (AUTO-02, AUTO-06, AUTO-07, AUTO-08) [Wave 4]
- [x] 180-08-PLAN.md — useAutomationsList hook (CRUD + optimistic toggle per D-13/D-23) + AutomationRow (4 status pills per AUTO-01) + AutomationsTab orchestrator + /automazioni route + barrels (AUTO-01, AUTO-02, AUTO-08) [Wave 5]
- [x] 180-09-PLAN.md — Playwright smoke spec (tests/smoke/automations-tab.spec.ts) + console-error gate (D-27) + human UAT for visual parity + Italian copy (AUTO-01..08) [Wave 6]

> Note: SC-#3 and SC-#5 are honored per CONTEXT D-08 and D-09 with API-truth corrections — Trigger picker ships 2 actual API trigger types (`schedule_cron`, `manual_api_call`); the 3 sensor concepts surface as condition leaves under Condizioni. Action picker ships 11 API action types (`netatmo_set_room_temp`, `netatmo_set_home_mode`, `netatmo_switch_schedule`, `thermorossi`, `hue_light`, `hue_group`, `hue_scene`, `tuya`, `sonos`, `http_webhook`, `log_event`) — the 9 generic bundle labels translate to 11 explicit API types. User confirmed both adjustments in 180-CONTEXT.md.

**UI hint**: yes

### Phase 181: Glass Bottom Tab Bar
**Goal**: Replace the existing navigation chrome with a glass bottom tab bar (Home / Stanze / Automazioni / Altro) that respects safe-area insets, hides under open sheets, and shows accent-glow active state.
**Depends on**: Phase 174, Phase 178
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. The bottom tab bar uses a translucent + backdrop-blur surface, pins to the bottom of the iPhone-style frame on mobile and to the app shell on desktop, and survives orientation changes.
  2. Four sections are visible (Home / Stanze / Automazioni / Altro), each with icon + label; the active tab is highlighted via accent color + glow that responds to the user's chosen oklch hue from Phase 174.
  3. When any device or room sheet from Phases 178-179 is open, the bottom tab bar is hidden (no visual stacking conflict with the sheet's own border).
  4. On iOS PWA, the bar respects `env(safe-area-inset-bottom)` (verified at 375px viewport with simulated iPhone home-indicator inset).
**Plans**: 6 plans
- [x] 181-01-PLAN.md — SheetCounter + Sheet.tsx augmentation + globals.css cross-cutting rules (NAV-03) [Wave 1]
- [x] 181-02-PLAN.md — BottomTabBar component + barrel export + Jest spec (NAV-01, NAV-02, NAV-04) [Wave 1]
- [x] 181-03-PLAN.md — /altro route + AltroPage + AltroRow + 2 Jest specs (NAV-02) [Wave 2]
- [x] 181-04-PLAN.md — NavbarConnectionStatusChip wrapper + Jest spec (NAV-01) [Wave 2]
- [x] 181-05-PLAN.md — app/layout.tsx atomic chrome swap (NAV-01..04) [Wave 3]
- [x] 181-06-PLAN.md — tests/smoke/bottom-tab-bar.spec.ts + final scoped pass (NAV-01..04) [Wave 4]
**UI hint**: yes

### Phase 182: Design System Reference Page v2
**Goal**: Ship `/debug/design-system-v2` as the single source of truth for every Ember Glass primitive — colors, typography, spacing, shadows, and live samples of every component used across Phases 174-181 — with the dev accent picker inline.
**Depends on**: Phase 174, Phase 175, Phase 176, Phase 177, Phase 178, Phase 179, Phase 180, Phase 181
**Requirements**: DSREF-01, DSREF-02, DSREF-03
**Success Criteria** (what must be TRUE):
  1. Visiting `/debug/design-system-v2` renders a single page with sections for colors (accent + neutrals + tones), typography pairs, spacing/radius scale, shadow/blur values, and live samples of GlassCard, CardHead, StatusDot, InlineToggle, CircBtn, Stepper, Slider, BigSlider, RadialDial, Sheet preview, MiniStat, FlameViz, and PlayingBars.
  2. Every visual primitive used by the dashboard, sheets, rooms tab, automations editor, and nav bar appears on this page with a copy-paste-ready code snippet (or token reference) — verifiable by cross-referencing the component import list in Phases 177-181 against the page's sample list.
  3. The developer accent picker from Phase 174 (DS-03) is rendered inline near the top of the page so changing the hue updates every primitive on the page in place without a reload.
**Plans**: 9 plans
- [x] 182-01-PLAN.md — Decompose page.tsx into Section01..Section07 verbatim extracts (DSREF-03) [Wave 1]
- [x] 182-02-PLAN.md — Port CircBtn primitive + Jest spec + barrel exports (DSREF-01) [Wave 1]
- [x] 182-03-PLAN.md — Port BigSlider primitive + Jest spec + barrel exports (DSREF-01) [Wave 1]
- [x] 182-04-PLAN.md — Build shared CodeSnippet primitive + Jest spec (DSREF-02) [Wave 1]
- [x] 182-05-PLAN.md — Extend Section03Tokens with live token table + typography + spacing + shadow tiles (DSREF-01, DSREF-02) [Wave 2]
- [x] 182-06-PLAN.md — Section08CardPrimitives: 8 card-primitive samples with CodeSnippets (DSREF-01, DSREF-02) [Wave 2]
- [x] 182-07-PLAN.md — Section09SheetPrimitives: 7 sheet-primitive samples with CodeSnippets (DSREF-01, DSREF-02) [Wave 2]
- [ ] 182-08-PLAN.md — Section10SheetGallery: 5 device-sheet launchers + sheetFixtures + page.test mocks (DSREF-01, DSREF-02) [Wave 2]
- [ ] 182-09-PLAN.md — Playwright smoke spec for section presence + 13 primitives + violet recolor invariant (DSREF-01, DSREF-02, DSREF-03) [Wave 3]
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 174. Ember Glass Tokens & Foundations | 0/0 | Not started | - |
| 175. Glass Primitives — Press Animation & Sheet | 3/3 | Complete   | 2026-04-27 |
| 176. Post-Auth0 Splash Animation | 4/4 | Complete    | 2026-04-27 |
| 177. Equal-Size Dashboard Glass Cards | 8/8 | Complete   | 2026-04-29 |
| 178. Per-Device Modal Sheets | 10/10 | Complete   | 2026-04-29 |
| 179. Rooms Tab Redesign | 9/9 | Complete    | 2026-04-29 |
| 180. Automations Tab Full Editor | 9/9 | Complete    | 2026-04-30 |
| 181. Glass Bottom Tab Bar | 6/6 | Complete   | 2026-05-02 |
| 182. Design System Reference Page v2 | 7/9 | In Progress|  |

<details>
<summary>✅ v19.0 API Alignment & Full Coverage (Phases 156-173) — SHIPPED 2026-04-27</summary>

See [milestones/v19.0-ROADMAP.md](milestones/v19.0-ROADMAP.md) for full phase details.

- [x] Phase 156: Path Migration & Common Endpoints (2/2 plans) — completed 2026-04-07
- [x] Phase 157: Auth Module (1/1 plan) — completed 2026-04-08
- [x] Phase 158: Automations Module (2/2 plans) — completed 2026-04-08
- [x] Phase 159: Hue Gap Closure (2/2 plans) — completed 2026-04-09
- [x] Phase 160: Sonos Gap Closure (2/2 plans) — completed 2026-04-09
- [x] Phase 161: Netatmo Gap Closure (2/2 plans) — completed 2026-04-09
- [x] Phase 162: Fritz!Box Gap Closure (2/2 plans) — completed 2026-04-09
- [x] Phase 163: DIRIGERA Gap Closure (1/1 plan) — completed 2026-04-14
- [x] Phase 164: Phase 156 Regression Fix (2/2 plans) — completed 2026-04-15
- [x] Phase 165: Milestone Hygiene & Spec Alignment (2/2 plans) — completed 2026-04-16
- [x] Phase 166: Hue Frontend Cutover (3/3 plans) — completed 2026-04-18
- [x] Phase 167: Sonos Frontend Cutover (3/3 plans) — completed 2026-04-20
- [x] Phase 168: Netatmo Frontend Cutover (3/3 plans) — completed 2026-04-21
- [x] Phase 169: DIRIGERA Frontend Cutover (3/3 plans) — completed 2026-04-22
- [x] Phase 170: Auth UI (3/3 plans) — completed 2026-04-23
- [x] Phase 171: Fritz!Box Consumer UI (2/2 plans) — completed 2026-04-23
- [x] Phase 172: Fritz!Box v1 Path Migration (3/3 plans) — completed 2026-04-24
- [x] Phase 173: Cross-Provider Device Aggregator (4/4 plans) — completed 2026-04-27

</details>

<details>
<summary>✅ v18.0 Dark-Only & Mobile-First (Phases 149-155) — SHIPPED 2026-04-02</summary>

- [x] Phase 149: Theme Removal Core (2/2 plans) — completed 2026-04-01
- [x] Phase 150: Theme Prefix Cleanup (3/3 plans) — completed 2026-04-01
- [x] Phase 151: Design System Mobile-First (2/2 plans) — completed 2026-04-01
- [x] Phase 152: Pages Audit — Core & Device Pages (2/2 plans) — completed 2026-04-01
- [x] Phase 153: Pages Audit — Extended Device Pages (2/2 plans) — completed 2026-04-01
- [x] Phase 154: Pages Audit — Admin & Support Pages (3/3 plans) — completed 2026-04-02
- [x] Phase 155: Phase 153 Verification Gap Closure (1/1 plan) — completed 2026-04-02

</details>

<details>
<summary>✅ v17.1 WebSocket Alignment & Tuya Integration (Phases 145-148) — SHIPPED 2026-03-30</summary>

- [x] Phase 145: WS Type Alignment (3/3 plans) — completed 2026-03-28
- [x] Phase 146: Raspi WS Migration (2/2 plans) — completed 2026-03-30
- [x] Phase 147: Tuya Infrastructure (2/2 plans) — completed 2026-03-30
- [x] Phase 148: Tuya Frontend (3/3 plans) — completed 2026-03-30

</details>

<details>
<summary>✅ v17.0 WebSocket Real-Time Transport (Phases 139-144) — SHIPPED 2026-03-28</summary>

- [x] Phase 139: WebSocket Infrastructure (2/2 plans) — completed 2026-03-26
- [x] Phase 140: Stove Migration (1/1 plan) — completed 2026-03-27
- [x] Phase 141: Fritz!Box & Hue Migration (2/2 plans) — completed 2026-03-27
- [x] Phase 142: Sonos & DIRIGERA Migration (2/2 plans) — completed 2026-03-27
- [x] Phase 143: Netatmo Migration (2/2 plans) — completed 2026-03-28
- [x] Phase 144: Connection UX (2/2 plans) — completed 2026-03-28

</details>

<details>
<summary>✅ Earlier milestones — v1.0 through v16.0 (Phases 1-138) — all shipped</summary>

See git history and `.planning/milestones/` for details.

</details>
