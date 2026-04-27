# Requirements: Milestone v20.0 — Ember Glass Redesign

**Defined:** 2026-04-27
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Source design bundle:** `.planning/inbox/ember-glass-design/` (README + chats/chat1.md + 7 .jsx prototype components, ~4800 LOC)

**Scope summary:** Migrate the entire UI from "Ember Noir" to "Ember Glass" (iOS 18 glass/blur aesthetic), redesign all dashboard cards to equal-size list-based, redesign Rooms + Automations tabs, add a post-Auth0 splash animation, and ship a Design System reference page. No backend/API changes — pure UI overhaul over the existing v19.0 API surface.

---

## v20.0 Requirements

### Design System (Ember Glass tokens)

- [x] **DS-01
**: Project exposes Ember Glass design tokens as CSS variables — `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--accent` (oklch), `--text-1`, `--text-2`, `--r-card`, `--pad-card`, `--font-display`, `--font-body`
- [ ] **DS-02**: Tokens drive all surfaces — no hardcoded glass/blur/accent colors remain in component files (verifiable via grep)
- [ ] **DS-03**: Accent color supports oklch hue shifting (default copper); 6 preset hues available (copper, rose, violet, blue, green, amber) selectable from a developer toolbar in `/debug`
- [x] **DS-04
**: Typography pair active — Outfit for `var(--font-display)` (numbers/headlines), Inter for `var(--font-body)` (text); both self-hosted via existing `next/font` pipeline (no Google CDN roundtrip)
- [ ] **DS-05**: Optional ambient background glow (radial gradient under app shell) is togglable per user preference and persists in localStorage
- [x] **DS-06
**: All glass surfaces apply `backdrop-filter: blur(var(--glass-blur)) saturate(180%)` with WebKit fallback; degrades gracefully on browsers without `backdrop-filter` support
- [ ] **DS-07**: Card press animation (`scale(0.97)` with cubic-bezier `.34,1.56,.64,1`, 220ms) is a shared utility used by all interactive glass surfaces

### Splash Animation (post-Auth0)

- [ ] **SPLASH-01**: After successful Auth0 sign-in (or session restore), the app renders a splash screen before mounting the dashboard
- [ ] **SPLASH-02**: Splash sequence runs ~2s total: flame logo scales in → wordmark "Home" + subtitle "Connessione al gateway…" → "Autenticato · Auth0" badge in lower area → fade-out while dashboard scales in
- [ ] **SPLASH-03**: Splash respects `prefers-reduced-motion: reduce` — collapses to a 200ms fade with no scale/transform
- [ ] **SPLASH-04**: Splash never re-runs on subsequent in-session route changes; appears only on initial app entry per session
- [ ] **SPLASH-05**: Splash unmount does not block the dashboard's first data fetch — fetches start during the splash window, results render when both ready

### Dashboard (equal-size glass cards)

- [ ] **DASH-01**: Dashboard uses an equal-size square card grid (2 columns mobile, aspect-ratio 1:1) — Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, Tuya, Plugs all share identical footprint
- [ ] **DASH-02**: StoveCard shows current temp + flame visualization (animated gradient when on, static when off) + "Fiamma N · Ventola N" subtitle when on, "Spenta" when off
- [ ] **DASH-03**: ClimateCard shows up to 4 zones inline (status dot + name + current temp), with "N di M attive" footer
- [ ] **DASH-04**: LightsCard shows up to 4 names of currently-on lights with status dots and "+altre N" overflow indicator; shows "Spente · N disponibili" when none on; toggle in header turns all on/off
- [ ] **DASH-05**: SonosCard shows up to 4 groups with playing-bars animation per playing group + track name; header shows "N in riprod." or "In pausa"
- [ ] **DASH-06**: WeatherCard shows large current temp + city + condition + high/low
- [ ] **DASH-07**: CameraCard shows live preview area with LIVE pulsing badge and source label
- [ ] **DASH-08**: NetworkCard shows down Mbps (large), up Mbps + device count
- [ ] **DASH-09**: RaspiCard shows 2-stat grid (CPU, RAM with progress bar) + CPU temp footer
- [ ] **DASH-10**: TuyaCard / PlugsCard shows up to 4 plug names with status dots, total power in header (W/kW auto-format), "N di M accese" footer — **no inline toggles** (report-only on dashboard)
- [ ] **DASH-11**: Each card opens a modal sheet on tap (where applicable) — except WeatherCard and RaspiCard which are read-only
- [ ] **DASH-12**: Cards stagger in on dashboard mount (existing initialDelay pattern preserved); React Compiler auto-memoization remains active

### Modal Sheets (per-device controls)

- [ ] **SHEET-01**: Bottom sheet primitive — translucent (rgba bg + backdrop-blur), translates from off-screen with cubic-bezier `.22,1,.36,1` 400ms, includes grabber + title bar + close button + Escape key dismissal + backdrop tap dismissal + body scroll-lock while open
- [ ] **SHEET-02**: StoveSheet — large temp readout, target/fan/power steppers + sliders, Orari/Manutenzione buttons, large Accendi/Spegni primary button
- [ ] **SHEET-03**: ClimateSheet — horizontal zone selector chips, Apple-Home-style radial dial for selected zone target, mode picker (Auto/Manuale/Eco/Off), per-zone toggle
- [ ] **SHEET-04**: LightsSheet — accese count card + "Tutte on/Tutte off" buttons, 4 scene buttons (Rilassante/Concentrato/Cena/Notte), per-room grouped list with individual toggles
- [ ] **SHEET-05**: SonosSheet — group list (each row = colored album-art tile + name + track + play/pause), volume slider for selected group, "Riproduci/Pausa ovunque" master button
- [ ] **SHEET-06**: PlugsSheet — accese count + total consumption summary cards, per-plug list with name + room + live W/kW + individual toggle (toggles allowed only inside the sheet, not on the dashboard card)

### Rooms Tab (data-driven)

- [ ] **ROOMS-01**: Rooms tab is fully data-driven — derives device list per room from existing `state.thermostat.zones`, `state.lights`, `state.plugs`, `state.sonos.groups`, `state.stove`, plus static device entries (TV, blinds, humidity sensor, entrance camera) for the mock layer
- [ ] **ROOMS-02**: Each RoomCard shows header (room icon + name + "N/M attivi" counter) + 3×2 grid of device chips colored per category (accent for stove, yellow for lights, blue for thermo, violet for audio, etc.), with "+N" overflow chip when devices > 6
- [ ] **ROOMS-03**: Tapping a RoomCard opens a RoomSheet with summary header (name + icon + active counts + category count) + per-category sections
- [ ] **ROOMS-04**: RoomSheet device cards are **expanded** (one card per device, not a flat single-row list): each card has a header (icon + name + status text + primary toggle/play/LIVE badge) and a body with type-specific controls
- [ ] **ROOMS-05**: Type-specific bodies — Stove (3 stat chips + −/power/+ row), Thermostat/Valve (current→target dual readout + ±0.5°/Eco/Auto buttons), Light (brightness slider + color-temp slider), Plug (Ora W/kW chip + Oggi kWh chip), Sonos (track + volume slider + skip/play/skip), TV (source + volume + HDMI selector), Blind (position slider + Up/Stop/Down), Camera (16:9 preview with LIVE + fps + last-motion + play button), Humidity sensor (value chip + trend chip)

### Automations Tab (full editor)

- [ ] **AUTO-01**: Automations list shows each automation with icon + name + description + toggle + status pill (trigger type + condition count + action count + "ultima esecuzione: …")
- [ ] **AUTO-02**: "Nuova automazione" button opens an editor sheet with Name + Description fields and 4 inner tabs (Trigger / Condizioni / Azioni / Avanzate) showing badge counts on each tab
- [ ] **AUTO-03**: Trigger picker supports the 5 types from `docs/automations.md`: `schedule_cron`, `sensor_state_change`, `sensor_threshold`, `netatmo_temperature_threshold`, `manual` — each with a type-specific form, including a visual hint for cron strings
- [ ] **AUTO-04**: Conditions support nested AND/OR groups up to 2 levels deep, with a per-group operator toggle and colored side-bars for visual nesting; 4 condition types: `time_window`, `device_state`, `temperature_range`, `always_true`
- [ ] **AUTO-05**: Actions list supports 9 action types: `netatmo_set_room_temp`, `netatmo_set_home_mode`, `netatmo_switch_schedule`, `stove_command`, `lights_command`, `plug_command`, `sonos_command`, `http_webhook`, `log_event` — each row has type-specific form, reorder ↑/↓ buttons, and a remove button
- [ ] **AUTO-06**: Advanced tab exposes cooldown controls — `min_interval_seconds` and `max_triggers_per_hour`
- [ ] **AUTO-07**: Save button is disabled until automation has a non-empty name AND at least one action; an unsaved-changes guard prompts on close
- [ ] **AUTO-08**: Existing automations can be opened in the same editor for edit; Delete button (with confirm) is available in edit mode

### Navigation (glass tab bar)

- [ ] **NAV-01**: Bottom tab bar uses glass surface (translucent + backdrop-blur) and pins to the bottom of the iPhone-style frame on mobile and the app shell on desktop
- [ ] **NAV-02**: 4 sections — Home / Stanze / Automazioni / Altro — each with icon + label, active state shown via accent color + glow
- [ ] **NAV-03**: Bar is hidden when a sheet is open over it (avoids visual stacking conflict with sheet's own border)
- [ ] **NAV-04**: Bar respects iOS safe-area insets (env(safe-area-inset-bottom))

### Design System Reference Page

- [ ] **DSREF-01**: New route `/debug/design-system-v2` renders a single-page reference for Ember Glass — colors (accent + neutrals + tones), typography pairs, spacing/radius scale, shadow/blur values, and live component samples (GlassCard, CardHead, StatusDot, InlineToggle, CircBtn, Stepper, Slider, BigSlider, RadialDial, Sheet preview, MiniStat, FlameViz, PlayingBars)
- [ ] **DSREF-02**: Page is the **single source of truth** — every visual primitive used by dashboard/sheets/rooms/automations appears here with copy-paste-ready code snippet (or token reference) per sample
- [ ] **DSREF-03**: Page exposes the developer accent picker (DS-03) inline so designers can preview hue shifts against all primitives at once

---

## Future Requirements (deferred)

### Personalization (post-v20.0)

- **PERS-01**: User-selectable accent hue saved per-account (currently dev-only toggle)
- **PERS-02**: Light-mode variant of Ember Glass (currently dark-only per v18.0 lockdown)
- **PERS-03**: Custom card ordering / hide-card-from-dashboard

### Automations Advanced (post-v20.0)

- **AUTO-FUT-01**: Visual cron builder (replaces raw cron string field)
- **AUTO-FUT-02**: Per-action retry/timeout configuration
- **AUTO-FUT-03**: Action templates / library

---

## Out of Scope (v20.0)

| Feature | Reason |
|---------|--------|
| Backend / API route changes | v20.0 is UI-only; v19.0 surface is final |
| New device providers | v17.x covered Tuya/DIRIGERA; v20.0 reuses 8-provider surface |
| Light theme / theme switcher | v18.0 explicitly removed light theme; Ember Glass is dark-only |
| Recharts redesign | Charts on /network /analytics /tuya kept as-is; only their containing cards/pages adopt glass |
| Splash branding redesign (logo/wordmark glyphs) | Use existing flame mark; only animation is new |
| Re-architecting orchestrator pattern | StoveCard/LightsCard orchestrators (v7.0) preserved; only presentational layer changes |
| Migration of debug pages besides design-system-v2 | Other /debug subpages keep current chrome until next milestone |
| Mobile gesture library (swipe-to-dismiss sheets) | Tap/Escape/backdrop dismissal is sufficient for v20.0 |
| Native iOS app shell | Stays a PWA |

---

## Traceability

All v20.0 requirements map to phases starting at Phase 174 (continuing numbering from v19.0).

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | Phase 174 | Pending |
| DS-02 | Phase 174 | Pending |
| DS-03 | Phase 174 | Pending |
| DS-04 | Phase 174 | Pending |
| DS-05 | Phase 174 | Pending |
| DS-06 | Phase 174 | Pending |
| DS-07 | Phase 175 | Pending |
| SPLASH-01 | Phase 176 | Pending |
| SPLASH-02 | Phase 176 | Pending |
| SPLASH-03 | Phase 176 | Pending |
| SPLASH-04 | Phase 176 | Pending |
| SPLASH-05 | Phase 176 | Pending |
| DASH-01 | Phase 177 | Pending |
| DASH-02 | Phase 177 | Pending |
| DASH-03 | Phase 177 | Pending |
| DASH-04 | Phase 177 | Pending |
| DASH-05 | Phase 177 | Pending |
| DASH-06 | Phase 177 | Pending |
| DASH-07 | Phase 177 | Pending |
| DASH-08 | Phase 177 | Pending |
| DASH-09 | Phase 177 | Pending |
| DASH-10 | Phase 177 | Pending |
| DASH-11 | Phase 177 | Pending |
| DASH-12 | Phase 177 | Pending |
| SHEET-01 | Phase 175 | Pending |
| SHEET-02 | Phase 178 | Pending |
| SHEET-03 | Phase 178 | Pending |
| SHEET-04 | Phase 178 | Pending |
| SHEET-05 | Phase 178 | Pending |
| SHEET-06 | Phase 178 | Pending |
| ROOMS-01 | Phase 179 | Pending |
| ROOMS-02 | Phase 179 | Pending |
| ROOMS-03 | Phase 179 | Pending |
| ROOMS-04 | Phase 179 | Pending |
| ROOMS-05 | Phase 179 | Pending |
| AUTO-01 | Phase 180 | Pending |
| AUTO-02 | Phase 180 | Pending |
| AUTO-03 | Phase 180 | Pending |
| AUTO-04 | Phase 180 | Pending |
| AUTO-05 | Phase 180 | Pending |
| AUTO-06 | Phase 180 | Pending |
| AUTO-07 | Phase 180 | Pending |
| AUTO-08 | Phase 180 | Pending |
| NAV-01 | Phase 181 | Pending |
| NAV-02 | Phase 181 | Pending |
| NAV-03 | Phase 181 | Pending |
| NAV-04 | Phase 181 | Pending |
| DSREF-01 | Phase 182 | Pending |
| DSREF-02 | Phase 182 | Pending |
| DSREF-03 | Phase 182 | Pending |

**Coverage:**
- v20.0 requirements: 50 total
- Mapped to phases: 50 ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-27*
*Last updated: 2026-04-27 — roadmap traceability filled*
