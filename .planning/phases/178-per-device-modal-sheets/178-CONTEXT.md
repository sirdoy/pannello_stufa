# Phase 178: Per-Device Modal Sheets - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC-#1..#5, REQUIREMENTS.md SHEET-02..06, the design bundle (`sheets.jsx`), and Phases 174/175/176/177 locked CONTEXT/UI-SPEC.

<domain>
## Phase Boundary

Replace the per-card `<SheetPlaceholderBody>` (Phase 177 D-13) with **five real bottom-sheet bodies** — one per SHEET-02..06 requirement — wired to the existing device data + command hooks. Each sheet is a child of the Phase 175 `<Sheet>` primitive and is mounted from the Phase 177 dashboard cards via the `useState<boolean>` open flag those cards already own.

In scope (5 sheet bodies, one per requirement):
- `app/components/EmberGlass/sheets/StoveSheet.tsx` (SHEET-02) — large temp readout + flame viz, Power + Fan steppers, Orari + Manutenzione navigation buttons, single large Accendi/Spegni primary button. Wired to `useStoveData` + `useStoveCommands` (existing).
- `app/components/EmberGlass/sheets/ClimateSheet.tsx` (SHEET-03) — horizontal zone selector chips, Apple-Home-style radial dial for selected zone target, mode picker (Auto/Manuale/Eco/Off), per-zone toggle. Wired to `useThermostatData` (existing) + new `useThermostatCommands` hook wrapping `/api/v1/netatmo/setroomthermpoint` and `/api/v1/netatmo/setthermmode`.
- `app/components/EmberGlass/sheets/LightsSheet.tsx` (SHEET-04) — accese count card + "Tutte on / Tutte off" buttons, 4 scene buttons (Rilassante / Concentrato / Cena / Notte), per-room grouped list with individual toggles. Wired to `useLightsData` + `useLightsCommands` (existing — has `handleRoomToggle`, `handleAllLightsToggle`, `handleSceneActivate`).
- `app/components/EmberGlass/sheets/SonosSheet.tsx` (SHEET-05) — group list (album-art tile + name + track + play/pause), volume slider for selected group, "Riproduci/Pausa ovunque" master button. Wired to `useSonosFullData` + `useSonosCommands` (existing — has `handlePlay`, `handlePause`, `handleSetVolume`).
- `app/components/EmberGlass/sheets/PlugsSheet.tsx` (SHEET-06) — accese count + total consumption summary cards, per-plug list (name + room + live W/kW + individual toggle). Wired to `useTuyaData` + `useTuyaCommands` (existing — `togglePlug`).
- 6 shared sheet sub-primitives extracted verbatim from bundle `sheets.jsx`:
  - `app/components/EmberGlass/sheets/primitives/SheetRow.tsx`
  - `app/components/EmberGlass/sheets/primitives/Stepper.tsx`
  - `app/components/EmberGlass/sheets/primitives/Slider.tsx`
  - `app/components/EmberGlass/sheets/primitives/RadialDial.tsx`
  - `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx`
  - `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` (the bundle's `quickBtn` style helper, exported as a tiny presentational component for `<LightsSheet>` Tutte on/off).
- Card-level edits: `Stove/Climate/Lights/Sonos/Tuya` cards swap `<SheetPlaceholderBody>` for the matching `<*Sheet>` body. Card structure (state hook, GlassCard, Sheet wrapper) untouched.
- Jest unit tests for each new sheet body + each new sub-primitive (one spec per file, mocked hook fixtures for on/off/empty/error states).
- Playwright extension to `tests/playwright/dashboard-glass-cards.spec.ts` (Phase 177 spec) with 5 new scenarios — open each interactive sheet, assert at least one wired control fires the corresponding command via mocked endpoint.

Out of scope (future phases):
- **Camera + Network sheets.** Phase 177 D-11 wired CameraCard and NetworkCard to a placeholder Sheet, but neither has a SHEET-* requirement in v20.0. CameraCard and NetworkCard keep `<SheetPlaceholderBody>` UNTOUCHED in this phase. SheetPlaceholderBody.tsx stays alive in the codebase.
- **DirigeraCard sheet.** No `useDirigeraCommands.ts` exists (Dirigera proxy is read-only at this milestone — see `app/api/v1/dirigera/` exposes only `health`, `history`, `sensors`, `stats`, `telemetry`). DirigeraCard keeps `<SheetPlaceholderBody>` UNTOUCHED. A future phase that ships Dirigera command proxy adds the Dirigera sheet.
- **WeatherCard + RaspiCard.** Read-only by Phase 177 D-11; never had a Sheet. Untouched.
- **Stove "Temperatura obiettivo" slider.** Bundle `sheets.jsx:107` shows a 15–28°C slider for the stove. The current Thermorossi proxy + `useStoveCommands` exposes no setpoint API (only `handleIgnite` / `handleShutdown` / `handleFanChange` / `handlePowerChange` / `handleSetManualMode` / `handleSetAutomaticMode` / `handleClearSemiManual` / `handleConfirmCleaning` / `handleManualRefresh`). The setpoint row is **dropped from StoveSheet** and tracked as a deferred idea — a follow-up phase can wire it to either the Netatmo room setpoint of the stove room or to a new Thermorossi setpoint endpoint if/when it ships.
- **Hue scene catalog UX.** SHEET-04 names 4 scenes (Rilassante / Concentrato / Cena / Notte). Hue scene IDs are owned per-group by the bridge (`useLightsData` exposes `groups[].scenes[]`). The 4 scene buttons in LightsSheet activate scenes by **name match** against the global Hue catalog (case-insensitive, first match wins) on the user's primary group; if no match exists for a given name, the button renders disabled with a tooltip `"Crea scena 'Rilassante' su Hue"`. Adding a real scene-creation UI is out of scope.
- **Long-press, swipe, drag-to-dismiss gestures** on the Sheet — Phase 175 D-14 already locked tap-to-dismiss only.
- **Reduced-motion overrides** for sheet open/close or radial dial transitions — defer per Phase 175 D-15.
- **Replacing or deleting legacy device pages** (`/stove`, `/lights`, `/sonos`, etc.) — the v20.0 cleanup phase handles those once Phase 178 demonstrates feature parity.
- **Replacing or deleting `<SheetPlaceholderBody>`** — file stays alive for CameraCard, NetworkCard, DirigeraCard. Cleanup phase deletes when all three sheets ship.
- **Replacing the legacy big orchestrator cards** (`app/components/devices/<device>/[Device]Card.tsx`) — they remain mounted on legacy detail pages. Phase 178 harvests sub-component shapes into the new sheets but does NOT delete or rename the legacy cards.
- **Unifying TuyaCard + DirigeraCard into one PlugsCard** — Phase 177 D-23 explicitly ships them as separate cards; Phase 178 ships PlugsSheet for Tuya only.
- **Rooms tab redesign (Phase 179), Automations tab (Phase 180), Glass bottom tab bar (Phase 181), Design System Reference Page v2 (Phase 182).**
- **New API routes, new device providers, new WS topics.** Phase 178 is purely presentational + a single new client-side commands hook (`useThermostatCommands`) wrapping endpoints that already exist.

</domain>

<decisions>
## Implementation Decisions

### File layout & namespace
- **D-01:** All new sheet body files live under `app/components/EmberGlass/sheets/` — a sibling subfolder to `app/components/EmberGlass/cards/` (Phase 177 D-01). Concrete layout:
  - `sheets/StoveSheet.tsx`
  - `sheets/ClimateSheet.tsx`
  - `sheets/LightsSheet.tsx`
  - `sheets/SonosSheet.tsx`
  - `sheets/PlugsSheet.tsx`
  - `sheets/primitives/{SheetRow,Stepper,Slider,RadialDial,SheetBtn,QuickActionButton}.tsx`
  - `sheets/index.ts` — barrel export for the 5 sheet bodies + the 6 sub-primitives. Re-exported from `app/components/EmberGlass/index.ts` so phases 179-181 can import via `@/app/components/EmberGlass`.
- **D-02:** Inline-style + `var(--token)` convention from Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 is mandatory. **No Tailwind classes for visual values inside sheet bodies or sub-primitives** — bundle is the source of truth and bundle is inline-style. Tailwind layout primitives (e.g. `display: 'grid'` ↔ inline) STILL stay inline; this is the ONE consistency rule for the whole `EmberGlass/` namespace.
- **D-03:** `<SheetPlaceholderBody>` (Phase 177 D-13) is **NOT deleted** in this phase. It still serves CameraCard, NetworkCard, DirigeraCard. Edits to `SheetPlaceholderBody.tsx` are limited to bumping the `phase` prop default if needed; otherwise untouched.
- **D-04:** The Phase 175 `<Sheet>` primitive is consumed unmodified — same `{ open, onClose, title }` API. Each new `<*Sheet>` is a **body-only component** that renders the sheet contents and assumes the calling card owns the `open` state and provides the `<Sheet>` wrapper. Concretely:
  ```tsx
  // In StoveCard:
  <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
    <StoveSheet />  {/* new in Phase 178; pulls own data via hooks */}
  </Sheet>
  ```
  The sheet body components do NOT take props — they self-fetch via the device data + command hooks. This keeps each card-side edit a single-line swap (`SheetPlaceholderBody phase="178" device="stove"` → `StoveSheet`).

### Sheet body components (SHEET-02..06)
- **D-05:** **StoveSheet** (SHEET-02) — bundle `sheets.jsx:69-129` verbatim shape, with the setpoint slider dropped (no API support — see Out of Scope). Concrete layout:
  - **Hero block:** rounded 24px container, conditional gradient background based on `s.on`, flexrow `<FlameViz on={isAccesa} intensity={powerLevel/5} />` (Phase 176) + a stacked status group:
    - 12px caps subtitle: `"In funzione"` (on) / `"Spenta"` (off).
    - 54px display temperature `{temp}°C` (with 22px `°C` superscript at 0.5 opacity).
    - 13px footnote: `"Obiettivo {target}°C · Pellet {pelletPercent}%"` if both fields exist on `useStoveData`; otherwise show only what is available (`"Pellet {pelletPercent}%"` or omit footnote). **Plan agent verifies field names.**
  - **SheetRow #1** `"Livello fiamma"` (subtitle `"{powerLevel}/5"`) → `<Stepper value={powerLevel} min={1} max={5} onChange={handlePowerChange}>`. The stepper calls `useStoveCommands().handlePowerChange` shaped as `{ target: { value: String(v) } }` (matches the existing handler signature, see `useStoveCommands.ts`).
  - **SheetRow #2** `"Ventola"` (subtitle `"{fanLevel}/5"`) → `<Stepper value={fanLevel} min={1} max={5} onChange={handleFanChange}>`.
  - **2-col grid** of `<SheetBtn>` buttons (`<Calendar>` + `"Orari"`, `<AlertTriangle>` + `"Manutenzione"`). Each button calls `router.push()` to `/stove/scheduler` and `/stove/maintenance` respectively (the existing Next.js routes — see `lib/routes.ts`). Sheet closes on navigation via `onClose()` then `router.push()`.
  - **Primary action button** at the bottom (full width, 56px tall, 18px radius). Copy + visuals match bundle `sheets.jsx:113-127`:
    - When `isAccesa`: red-tinted `"Spegni stufa"` → calls `handleShutdown`.
    - Otherwise: accent-filled glow `"Accendi stufa"` → calls `handleIgnite`.
    - Disabled when `needsCleaning` is true (memory: maintenance rule). Render disabled state with red border + `"Manutenzione richiesta"` copy.
  - Data: `useStoveData()` (existing), `useStoveCommands()` (existing). Plan agent maps exact field names against the live hook.

- **D-06:** **ClimateSheet** (SHEET-03) — bundle `sheets.jsx:131-186` verbatim shape, plus a new `useThermostatCommands` hook (D-09 below).
  - **Local state:** `selectedRoomIdx` (default 0).
  - **Zone chip row:** horizontal scroll, 8px gap. Each chip = inline-style 12px-radius pill, 13px 600 weight, `whiteSpace: nowrap`, with leading 6×6 dot (filled `#5eafff` + glow when `room.on`, transparent grey otherwise). Selected chip = `rgba(94,175,255,0.18)` background, `#5eafff` text, 0.5px `rgba(94,175,255,0.4)` border.
  - **`<RadialDial>`** sub-primitive (220px SVG, 270° arc) for the selected zone's `target`. `min=15, max=28, color="#5eafff"`, label `"{zone.name} · attuale {zone.current.toFixed(1)}°"`. Two ± buttons below the dial. **Setpoint writes are debounced 500ms via `useDebounce`** (existing pattern from `ThermostatCard.tsx:42`) and then call `useThermostatCommands().setRoomSetpoint(roomId, target)` which POSTs to `/api/v1/netatmo/setroomthermpoint`.
  - **`<SheetRow>` "Tipo"** with subtitle text `zone.kind === 'termostato' ? 'Termostato di stanza' : 'Termovalvola radiatore'` and a right-aligned `<InlineToggle on={zone.on} color="#5eafff" onChange={...} />`. Toggle calls `useThermostatCommands().setRoomMode(roomId, on ? 'manual' : 'off')` (or whatever the documented per-room mode is — plan agent confirms the Netatmo proxy semantics).
  - **Modalità globale** label (11px caps, 1px tracking, 22px top margin) + 4-column grid of mode pills (Auto / Manuale / Eco / Off). Selected = blue tint. Each click → `useThermostatCommands().setHomeMode(mode)` → POST `/api/v1/netatmo/setthermmode` with the mapped mode value (`schedule`/`manual`/`away`/`hg` — plan agent confirms exact Netatmo strings since UI labels are Italian abstractions).
  - Data: `useThermostatData()` (existing) reads `topology.rooms[]` + `status.rooms[]` + `mode`. Plan agent merges them into a unified `zones[]` for the sheet (current ThermostatCard already does this — harvest the merge logic).

- **D-07:** **LightsSheet** (SHEET-04) — bundle `sheets.jsx:188-289` verbatim shape.
  - **Summary header (3-col grid `1fr auto auto`):** count card on the left (yellow tint when `onCount > 0`; copy `"Accese"` caps + `{onCount}/{total}` 24px display); two pill buttons on the right (`"Tutte on"` + `"Tutte off"`). Pills use the new `<QuickActionButton>` sub-primitive. Each calls `useLightsCommands().handleAllLightsToggle(true|false)`.
  - **Scene strip:** 11px caps label `"Scene"`, then a 2-col grid of 4 buttons:
    - `Rilassante` — gradient `linear-gradient(135deg, #ff8a5c, #b080ff)`
    - `Concentrato` — `linear-gradient(135deg, #fff3c4, #5eafff)`
    - `Cena` — `linear-gradient(135deg, #ffb84a, #ff8a5c)`
    - `Notte` — `linear-gradient(135deg, #2a3a6a, #b080ff)`
    Each scene button looks up its scene by **name match (case-insensitive)** in the user's Hue catalog using a small helper `findSceneByName(catalog, name)` introduced in this phase (`app/components/EmberGlass/sheets/lib/findSceneByName.ts`). On click → `useLightsCommands().handleSceneActivate(sceneId, primaryGroupId)`. If not found, button renders disabled (50% opacity) with a tooltip `"Crea scena '{name}' su Hue"`. The "primary group" is the user's first room; `useLightsData` already exposes the rooms list.
  - **Per-room sections:** group `lights[]` by `room`. Each section header = 11px caps label with the room name. Each row inside = 32×32 colored bulb tile (yellow tint if on, grey if off) + 14px name + right-aligned `<InlineToggle on={l.on} color="#f5c84a" onChange={() => handleRoomToggle(l.groupId, !l.on)} />`. Plan agent confirms `useLightsData` exposes `lights[].groupId` (or the equivalent that `handleRoomToggle` accepts).
  - Data: `useLightsData()` + `useLightsCommands()` (existing).

- **D-08:** **SonosSheet** (SHEET-05) — bundle `sheets.jsx:291-380` verbatim shape.
  - **Local state:** `selectedIdx` (default 0).
  - **Group list:** rounded 18px container with 0.5px white border. Each row = 36×36 album-art tile (gradient when playing, grey when not) + name (14px 600) + track/artist line ("{track} · {artist}" when playing, `"Non in riproduzione"` otherwise) + 34×34 play/pause circle button. Tapping a row → `setSelectedIdx`. Tapping the play/pause button (with `e.stopPropagation()`) → `useSonosCommands().handlePlay(g.id)` or `.handlePause(g.id)`.
  - **Volume strip:** 11px caps label `"Volume · {selected.name}"` then `<IconVolume>` + `<input type="range" min=0 max=100>` + 13px tabular-nums readout. Volume writes are **debounced 250ms** (memory: v16.0 pattern) before calling `useSonosCommands().handleSetVolume(speakerUid, volume)`. Plan agent confirms whether volume is per-group or per-speaker — use the existing handler signature (looks like per-speaker uid; the sheet picks the group's coordinator speaker).
  - **Master button** at the bottom: `"Pausa ovunque"` if any group is playing, else `"Riproduci ovunque"`. Click iterates `groups[]` and fires `handlePlay`/`handlePause` per group. **Use `Promise.allSettled`** (memory: v16.0 batch pattern).
  - Data: `useSonosFullData()` (existing — exposes `groups[]` with id/name/playing/track/artist/volume/coordinator).

- **D-09:** **PlugsSheet** (SHEET-06) — bundle `sheets.jsx:382-451` verbatim shape, **Tuya provider only**.
  - **Summary cards (2-col grid):**
    - Left card (orange tint): caps `"Accese"` + 28px display `{onCount}/{total}`.
    - Right card (white tint): caps `"Consumo"` + 28px display total power, auto-formatted to `kW` (≥1000W) or `W` (<1000W) with 2 decimals for kW.
  - **Plug list:** rounded 18px container. Each row = 36×36 plug icon tile (orange tint if on, grey if off) + plug name (14px 500) + subtitle `"{room}{on && power > 0 ? ' · ' + (power >= 1000 ? `${(power/1000).toFixed(1)}kW` : `${power}W`) : ''}"` + right-aligned `<InlineToggle on={p.on} color="#ffb84a" onChange={() => useTuyaCommands().togglePlug(p.id, p.on)} />`.
  - Data: `useTuyaData()` (existing) — exposes `plugs[]` with id/name/room/on/power. `useTuyaCommands().togglePlug(deviceId, currentState)` (existing).
  - **Dirigera plugs are NOT shown in PlugsSheet.** DirigeraCard keeps placeholder body. PlugsSheet is mounted from TuyaCard only.

### Sheet sub-primitives (extracted verbatim from bundle)
- **D-10:** `<SheetRow label value? children?>` — 14px 500 label on top, optional 12px dim subtitle below, optional right-side child (toggle / stepper / value chip). Border-bottom 0.5px white. Used by StoveSheet (Livello fiamma, Ventola), ClimateSheet (Tipo).
- **D-11:** `<Stepper value min max onChange>` — 36×36 minus button, 36px-min display value (font-display 18 600), 36×36 plus button. Both buttons use `rgba(255,255,255,0.1)` background + `<Minus>` / `<Plus>` lucide icons. Calls `onChange(newValue)` directly (callers wrap to fit hook signatures, e.g. StoveSheet wraps to `{ target: { value: String(v) } }`).
- **D-12:** `<Slider value min max onChange color?>` — 140px-wide custom range input with two-stop linear gradient (filled before thumb, dim after). Color defaults to `var(--accent)`. Used by SonosSheet volume; Stove setpoint slider was dropped (D-05 / out-of-scope), so Slider primitive only ships if SonosSheet can use it. **Decision:** SonosSheet uses a plain `<input type=range>` with `accentColor: '#b080ff'` per bundle `sheets.jsx:374`, NOT the custom `<Slider>`. So `<Slider>` ships as a primitive but is unused in Phase 178; later phases (Lights brightness in Rooms tab, etc.) consume it. **Alternative:** drop `<Slider>` from this phase entirely. **Recommend ship anyway** (~30 LOC, the bundle defines it, downstream phases will need it).
- **D-13:** `<RadialDial value min max color label onChange>` — 220×220 SVG (rotated 135°) with 270° track + filled arc. Center label = 68px display value + `°` superscript + 12px dim sublabel. Two 44×44 ± buttons below the dial. `onChange(v)` is called on button click. **No drag/touch on the arc** in this phase (bundle doesn't implement it either; ± buttons are the only input vector). A polish phase can add drag.
- **D-14:** `<SheetBtn Icon label onClick?>` — 16px-pad rounded 16px box, 0.5px white border, 14px 500 label, lucide icon at left. Used by StoveSheet (Orari, Manutenzione).
- **D-15:** `<QuickActionButton active onClick label>` — pill button 12px-radius, 12px 600 text, yellow tint when `active` else white-04 background. Used by LightsSheet Tutte on/off. The 5th sub-primitive distinct from `SheetBtn` because the visual semantics differ (active state, no icon).

### New commands hook
- **D-16:** **`useThermostatCommands`** — new file at `app/components/devices/thermostat/hooks/useThermostatCommands.ts`. Exposes:
  ```ts
  setRoomSetpoint(roomId: string, target: number): Promise<void>     // → /api/v1/netatmo/setroomthermpoint
  setHomeMode(mode: 'schedule' | 'manual' | 'away' | 'hg'): Promise<void>  // → /api/v1/netatmo/setthermmode
  setRoomMode(roomId: string, mode: string): Promise<void>            // composed of setroomthermpoint with mode override (Netatmo proxy semantics)
  ```
  Uses `useRetryableCommand` (existing pattern from `useStoveCommands`/`useLightsCommands`). Body shape lifted from existing route tests + Netatmo proxy types. Plan agent confirms exact request body keys against the live route handler.
- **D-17:** No `useDirigeraCommands` is added. Dirigera proxy is read-only at this milestone (`app/api/v1/dirigera/` exposes only `health`, `history`, `sensors`, `stats`, `telemetry`). DirigeraCard keeps placeholder body.

### Italian copy (frozen — do not paraphrase)
- **D-18:** Sheet titles: `"Stufa"`, `"Clima"`, `"Luci"`, `"Sonos"`, `"Prese smart"` (PlugsSheet from TuyaCard). Match the Phase 177 D-14 card label exactly. Special case: **CameraCard placeholder Sheet title stays `"Camera"`, NetworkCard placeholder Sheet title stays `"Rete"`, DirigeraCard placeholder Sheet title stays `"IKEA"`** (set in Phase 177 D-14). Untouched.
- **D-19:** StoveSheet copy: `"In funzione"` / `"Spenta"`, `"Obiettivo {N}°C · Pellet {N}%"`, `"Livello fiamma"`, `"Ventola"`, `"Orari"`, `"Manutenzione"`, `"Spegni stufa"`, `"Accendi stufa"`, `"Manutenzione richiesta"`. Use middle-dot `·` (U+00B7).
- **D-20:** ClimateSheet copy: `"Modalità globale"`, `"Auto"` / `"Manuale"` / `"Eco"` / `"Off"`, `"Termostato di stanza"`, `"Termovalvola radiatore"`, `"{name} · attuale {N.N}°"`. Use 1-decimal precision for current temp.
- **D-21:** LightsSheet copy: `"Accese"`, `"Tutte on"`, `"Tutte off"`, `"Scene"`, scene names `"Rilassante"` / `"Concentrato"` / `"Cena"` / `"Notte"`. Per-room section headers use the raw room name (no transformation). Tooltip on disabled scene buttons: `"Crea scena '{name}' su Hue"`.
- **D-22:** SonosSheet copy: `"Volume · {name}"`, `"Non in riproduzione"`, `"Pausa ovunque"` (when any playing), `"Riproduci ovunque"` (else). Track line: `"{track} · {artist}"` (middle-dot separator).
- **D-23:** PlugsSheet copy: `"Accese"`, `"Consumo"`. Power format: `≥1000W → "X.YkW"`, else `"NW"`. No unit suffix; the unit is inside the value to match bundle.

### Press behavior (Phase 175 SC-#1)
- **D-24:** Sheet sub-primitives that are **interactive** (`<Stepper>` ± buttons, `<RadialDial>` ± buttons, `<SheetBtn>`, `<QuickActionButton>`, `<InlineToggle>` rows) are pure clickable buttons. They do NOT need to wrap in `<Pressable>` because Phase 175 SC-#1 specifies "every NEW glass surface in Phases 177-181 reuses Pressable". A `<Stepper>` is not a glass surface — it's a bare button with `rgba(255,255,255,0.1)` background. Press feedback inside a sheet is the regular `:active` browser behavior; bundle does not animate them. Plan agent honors this distinction.
- **D-25:** The existing `<Sheet>` primitive itself already lives at z-index 200/201 (Phase 175 D-13). Sheet bodies stay below those z-indices for any tooltip / popover; no new z-index introductions in Phase 178.

### Loading + error inside sheet bodies
- **D-26:** **First-load skeleton** — when the underlying device hook returns `loading === true && data === null`, the sheet body renders a single full-width skeleton block (60% opacity, animate-pulse) sized to roughly match the final layout (StoveSheet ~360px, ClimateSheet ~480px, etc.). No per-row skeletons. Sheet open animation completes before the skeleton appears (reuse Phase 175 Sheet open transform; the body's CSS animation does not interfere).
- **D-27:** **Error / unreachable** — when the hook returns an error and no cached data, the sheet body renders a centered 32×32 lucide `<TriangleAlert>` icon + 14px copy `"Non raggiungibile. Riprova più tardi."` + an 8px-margin secondary 12px copy `"{error.message}"` (only when `error instanceof Error` per memory pattern). No retry button — closing and reopening the sheet retries naturally because each sheet open re-renders.
- **D-28:** **Optimistic UI for toggles + steppers** — match the existing pattern from Phase 7.0 retry infrastructure. `InlineToggle` flips immediately; the underlying command runs; if it fails, the toggle reverts on the next data tick. No explicit per-toggle pending state; retry infrastructure handles transient failures.

### Tests
- **D-29:** **Jest unit tests** under `app/components/EmberGlass/sheets/__tests__/`:
  - One spec per sheet body — mocks the relevant hook(s) with on/off/empty/error fixtures, asserts:
    - The documented elements render (via stable `data-testid` attributes — `stove-sheet-temp`, `stove-sheet-power-stepper`, `climate-sheet-radial`, `lights-sheet-scene-rilassante`, etc.).
    - Each interactive control fires the correct command handler (via `jest.fn()` mocks of the commands hook).
    - Disabled states (`needsCleaning` blocks ignite, scene-not-found disables button, etc.) render correctly.
  - One spec per sub-primitive (`SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton`).
  - The `findSceneByName` helper has its own unit test with case-insensitive + missing-scene fixtures.
- **D-30:** **Playwright extension** to `tests/playwright/dashboard-glass-cards.spec.ts` (Phase 177 spec). Add 5 new `test.describe` blocks (one per sheet):
  - "SHEET-02 StoveSheet wires command" — open StoveCard sheet, assert temp readout, click +1 on Power Stepper → assert mocked `setPower` route hit (use Playwright `page.route()` to intercept).
  - "SHEET-03 ClimateSheet wires command" — open ClimateCard sheet, click +1 on RadialDial, wait debounce → assert `setroomthermpoint` route hit.
  - "SHEET-04 LightsSheet wires command" — open LightsCard sheet, click `"Tutte off"` → assert all-off route batch.
  - "SHEET-05 SonosSheet wires command" — open SonosCard sheet, click play on first group row → assert play route hit.
  - "SHEET-06 PlugsSheet wires command" — open TuyaCard sheet, toggle a plug → assert togglePlug route hit.
  - Reuse `collectConsoleErrors` (Phase 97 pattern) — zero console errors per scenario.
- **D-31:** **No new Playwright spec file.** Phase 177 spec is the dashboard truth document — Phase 178 extends it. Filename, beforeAll setup (Auth0, VersionEnforcer dismissal), and afterAll cleanup all reused.
- **D-32:** Existing `useThermostatData` jest spec is **untouched**. The new `useThermostatCommands` gets its own spec under `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` mocking `fetch` and asserting the request body shape for each method.

### React Compiler discipline (Phase 71 / 95)
- **D-33:** **No `useMemo` / `useCallback`** in any sheet body or sub-primitive. Pure-function components only; React Compiler 1.0 auto-memoizes. The plan must include a `npx react-compiler-healthcheck` step in `<verify><automated>` (mirror Phase 177 D-28).
- **D-34:** Inline event handler functions (`onChange={(v) => updateZone({ target: v })}`) are explicitly allowed — React Compiler handles the inline closure correctly. Do NOT extract to `useCallback`.

### Card-level edits (per-card swap)
- **D-35:** Swap matrix:

  | Card                      | Action                                                        |
  |---------------------------|---------------------------------------------------------------|
  | StoveCard                 | `<SheetPlaceholderBody phase="178" device="stove" />` → `<StoveSheet />` |
  | ClimateCard               | `<SheetPlaceholderBody … />` → `<ClimateSheet />`             |
  | LightsCard                | `<SheetPlaceholderBody … />` → `<LightsSheet />`              |
  | SonosCard                 | `<SheetPlaceholderBody … />` → `<SonosSheet />`               |
  | TuyaCard                  | `<SheetPlaceholderBody … />` → `<PlugsSheet />`               |
  | DirigeraCard              | UNCHANGED (placeholder stays — out of scope)                  |
  | CameraCard                | UNCHANGED (placeholder stays — out of scope)                  |
  | NetworkCard               | UNCHANGED (placeholder stays — out of scope)                  |
  | WeatherCard / RaspiCard   | UNCHANGED (no Sheet — Phase 177 D-11)                         |

- **D-36:** No other changes to the 5 affected cards — `useState<boolean>` for `open`, the `<GlassCard onOpen>` wiring, and the `<Sheet open onClose title>` wrapper all stay verbatim from Phase 177.

### Folded Todos
None — `gsd-sdk query todo.match-phase 178` returned 0 matches at context-gathering time. Plan agent re-runs for a final check before planning.

### Claude's Discretion
- Whether `<SonosSheet>` master button uses `Promise.allSettled` (recommended — partial failure tolerance) or `Promise.all` (recommended NO — one failure aborts).
- Whether `<RadialDial>` exposes a touch/drag gesture in a follow-up phase. Out of scope here; ± buttons are sufficient for v20.0.
- Whether `<Slider>` ships in this phase or is deferred to whoever first consumes it. **Recommend ship now** (≤30 LOC, bundle defines it, downstream phases consume).
- Whether `findSceneByName` lives under `sheets/lib/` or under `app/components/devices/lights/utils/`. **Recommend `sheets/lib/`** to keep Phase 178 self-contained and reviewable; can move later if the Rooms tab (Phase 179) wants the same helper.
- Whether `useThermostatCommands` lives at `app/components/devices/thermostat/hooks/` (new file) or co-located in `app/components/EmberGlass/sheets/`. **Recommend the device hooks folder** — matches the convention from `useStoveCommands` / `useLightsCommands` / `useSonosCommands` / `useTuyaCommands`.
- Whether to add `data-testid` to every sub-primitive button or only to test-meaningful spots. **Recommend yes for stable selectors** — same rationale as Phase 176 D-27 / Phase 177.
- Whether the volume slider in `<SonosSheet>` is per-group (group's coordinator speaker) or aggregates per-speaker. **Recommend per-group via coordinator** — matches bundle and aligns with `useSonosCommands.handleSetVolume(uid, volume)` taking a speaker uid.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §SHEET-02..06 — Five locked acceptance criteria for this phase.
- `.planning/REQUIREMENTS.md` §SHEET-01 — The Sheet primitive contract from Phase 175 (consumed unmodified).
- `.planning/REQUIREMENTS.md` §DASH-11 — Phase 177 tap-to-open wiring; Phase 178 fills the bodies the cards already mount.
- `.planning/ROADMAP.md` §"Phase 178: Per-Device Modal Sheets" — Goal + 5 SC. SC-#1 (StoveSheet shape), SC-#2 (ClimateSheet shape), SC-#3 (LightsSheet shape), SC-#4 (SonosSheet shape), SC-#5 (PlugsSheet + dashboard-card no-toggle constraint).
- `.planning/ROADMAP.md` §"Phase 179: Rooms Tab Redesign" — confirms downstream phase reuses the sub-primitives shipped here.

### Source Design Bundle (PRIMARY visual + behavior source)
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx` lines 1-597 — **Authoritative** source for Sheet wrapper, StoveSheet, ThermoSheet, LightsSheet, SonosSheet, PlugsSheet, plus shared sub-primitives `SheetRow`, `Stepper`, `Slider`, `BigSlider`, `RadialDial`, `SheetBtn`, and helper `quickBtn`. Constants (px values, gradients, transitions, copy) lifted verbatim. When this bundle disagrees with the HTML doc, bundle wins (Phase 176/177 precedent).
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 7-465 — Phase 177 reference; needed for `<InlineToggle>` and `<PlayingBars>` already in `app/components/EmberGlass/`.
- `.planning/inbox/ember-glass-design/project/Design System.html` — Visual reference; Phase 178 sheets are not yet registered in `/debug/design-system-v2` (Phase 182 handles that).

### Prior Phase Decisions
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-07..D-13 — `<Sheet>` API (`{ open, onClose, title }`), z-index 200/201, scroll-lock + restore. Each new sheet body is mounted INSIDE this primitive; primitive is consumed unmodified.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-15 — No reduced-motion overrides in v20.0; Phase 178 honors that.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-17 — VersionEnforcer overlay is the known Playwright blocker. Phase 178 spec extends Phase 177 spec which already handles this.
- `.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md` D-03 — `<FlameViz>` lives in `EmberGlass/`. Reused by `<StoveSheet>` (D-05).
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-12, D-13, D-14 — Per-card `useState<boolean>` for sheet open + per-card `<Sheet>` mount + Italian title-per-card. Phase 178 swaps the placeholder body without touching this wiring.
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-11 — WeatherCard + RaspiCard read-only set is locked; Phase 178 cannot reopen this decision (CameraCard, NetworkCard, DirigeraCard are NOT in this read-only set, but are deferred for separate sheet-shipping reasons documented in Out of Scope).
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-13 — `<SheetPlaceholderBody>` is intentionally retained for cards whose sheets are not in v20.0 scope; Phase 178 deletes the import only from the 5 cards that ship real bodies.
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` D-12 — Inline-style + `var(--token)` convention.

### Existing Codebase Touchpoints
- `app/components/EmberGlass/Sheet.tsx` — Phase 175 primitive; consumed unmodified.
- `app/components/EmberGlass/InlineToggle.tsx` — Phase 177 primitive; reused by ClimateSheet (Tipo row), LightsSheet (per-room rows), PlugsSheet (per-plug rows).
- `app/components/EmberGlass/PlayingBars.tsx` — Phase 177 primitive; reused by SonosSheet (album-art tile when playing).
- `app/components/EmberGlass/FlameViz.tsx` — Phase 176 primitive; reused by StoveSheet (hero block).
- `app/components/EmberGlass/cards/{Stove,Climate,Lights,Sonos,Tuya}Card.tsx` — 5 Phase 177 cards. Each gets exactly one line edited (placeholder → sheet body).
- `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` — UNCHANGED. Still serves Camera/Network/Dirigera.
- `app/components/devices/stove/hooks/useStoveData.ts` — Existing data hook for StoveSheet.
- `app/components/devices/stove/hooks/useStoveCommands.ts` — Existing command hook. Handlers consumed by StoveSheet: `handleIgnite`, `handleShutdown`, `handlePowerChange`, `handleFanChange`, `handleConfirmCleaning`. Stepper inputs wrapped to match `{ target: { value: String(v) } }` signature.
- `app/components/devices/thermostat/hooks/useThermostatData.ts` — Existing data hook for ClimateSheet. Provides `topology` + `status` + `mode` + per-room data.
- `app/components/devices/thermostat/hooks/useThermostatCommands.ts` — **NEW.** Wraps `/api/v1/netatmo/setroomthermpoint` and `/api/v1/netatmo/setthermmode`.
- `app/api/v1/netatmo/setroomthermpoint/route.ts` — Existing route; consumed by `useThermostatCommands.setRoomSetpoint`.
- `app/api/v1/netatmo/setthermmode/route.ts` — Existing route; consumed by `useThermostatCommands.setHomeMode`.
- `app/components/devices/lights/hooks/useLightsData.ts` — Existing. Provides `lights[]`, `groups[]`, `scenes[]`. LightsSheet consumes `lights[]` (room grouping) + `scenes[]` (scene-by-name lookup).
- `app/components/devices/lights/hooks/useLightsCommands.ts` — Existing. Handlers consumed by LightsSheet: `handleAllLightsToggle(on)`, `handleSceneActivate(sceneId, groupId)`, `handleRoomToggle(groupId, on)`.
- `app/components/devices/sonos/hooks/useSonosFullData.ts` — Existing. Provides `groups[]` with id/name/playing/track/artist/volume/coordinator.
- `app/components/devices/sonos/hooks/useSonosCommands.ts` — Existing. Handlers consumed by SonosSheet: `handlePlay(groupId)`, `handlePause(groupId)`, `handleSetVolume(speakerUid, volume)`.
- `app/components/devices/tuya/hooks/useTuyaData.ts` — Existing. Provides `plugs[]` with id/name/room/on/power.
- `app/components/devices/tuya/hooks/useTuyaCommands.ts` — Existing. Handler consumed by PlugsSheet: `togglePlug(deviceId, currentState)`.
- `app/components/devices/thermostat/ThermostatCard.tsx` — Reference for the `useDebounce(pendingSetpoint, 500)` debounce pattern used by ClimateSheet.
- `lib/routes.ts` — `STOVE_ROUTES.scheduler` (`/stove/scheduler`) + `STOVE_ROUTES.maintenance` (`/stove/maintenance`) used by the StoveSheet `<SheetBtn>` buttons.
- `lib/hooks/useRetryableCommand` — Existing wrapper used by `useThermostatCommands` (matches the pattern from `useStoveCommands` etc.).
- `app/hooks/useDebounce.ts` — Existing hook used by ClimateSheet (setpoint) and SonosSheet (volume).
- `tests/playwright/dashboard-glass-cards.spec.ts` — Phase 177 Playwright spec; extended in this phase with 5 new SHEET-* describe blocks.
- `package.json` — `lucide-react`, `@radix-ui/react-dialog` already deps. No installs.

### Patterns
- Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 — Inline-style + `var(--token)`.
- Phase 7.0 retry infrastructure — `useRetryableCommand` wraps fetch with retry + idempotency; reused by `useThermostatCommands`.
- Phase 96 — `useAdaptivePolling(60s)` is the rhythm for device hooks; sheet bodies do not change polling cadence.
- Phase 17.0 — `NavbarConnectionStatus` covers global connectivity; sheets do not render their own connection pills.
- Phase 51 + 97 — Playwright `collectConsoleErrors` helper + real-Auth0 + session-caching.
- Phase 71 / 95 — React Compiler 1.0 auto-memo; no manual `useMemo`/`useCallback`.
- Phase 16.0 — 250ms volume debounce (`useDebounce`); 500ms setpoint debounce (existing ThermostatCard pattern).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 175 `<Sheet>` primitive** — fully production-ready. Each new sheet body mounts inside it without modification.
- **Phase 177 cards already wire `useState<boolean>` for sheet open + `<GlassCard onOpen>` + `<Sheet open onClose title>`.** Phase 178 swaps a single child node per card.
- **All required device data hooks already exist:** `useStoveData`, `useThermostatData`, `useLightsData`, `useSonosFullData`, `useTuyaData`. Each is already polling at 60s + WS-subscribed (Phase 17.0).
- **All required command hooks except thermostat already exist.** `useStoveCommands`, `useLightsCommands`, `useSonosCommands`, `useTuyaCommands` are all production-ready and used by the legacy big cards. Phase 178 adds **only** `useThermostatCommands` — wrapping two existing API routes.
- **`useDebounce` hook** — already exists at `app/hooks/useDebounce.ts`, used by ThermostatCard. Reused by ClimateSheet (500ms setpoint) + SonosSheet (250ms volume).
- **`useRetryableCommand` hook** — Phase 7.0 retry infrastructure; consumed by all command hooks for idempotency + retry.
- **lucide-react icons** — already a dep. New icons used: `<TriangleAlert>` (error state), `<Calendar>` (Stove Orari), `<AlertTriangle>` (Stove Manutenzione), `<Volume2>` (Sonos volume), `<Pause>` / `<Play>` (Sonos transport), `<Power>` (Stove primary action), `<X>` (Sheet close — already used by Phase 175).
- **Existing `/stove/scheduler` and `/stove/maintenance` pages** — StoveSheet's "Orari" and "Manutenzione" buttons navigate to existing routes; no new pages.
- **Existing Hue scene catalog** — `useLightsData.scenes[]` exposes user-defined scenes. LightsSheet looks up by name (case-insensitive); no scene mutation.

### Established Patterns
- **`'use client'` for state-bearing components** — every new sheet body has its own client-side state (selectedIdx in ClimateSheet/SonosSheet, debounced setpoint/volume in ClimateSheet/SonosSheet) + reads device hooks → `'use client'` at top.
- **Inline `style` + `var(--token)` for EmberGlass v2 surfaces** — Phase 174/175/176/177 precedent. All sheet bodies + sub-primitives follow.
- **Tests colocated** — Jest specs in `app/components/EmberGlass/sheets/__tests__/`, Playwright extension in the existing `tests/playwright/dashboard-glass-cards.spec.ts`.
- **No `useMemo`/`useCallback`** — Phase 71/95 / React Compiler discipline.
- **Optimistic UI for toggles** — pattern from existing LightsCard/ThermostatCard. Toggle flips immediately, retry infrastructure handles transient failures, next data tick reverts on persistent failure.
- **Per-component `data-testid`** — Phase 176/177 precedent. Apply per sheet + per sub-primitive + per interactive control (`stove-sheet-power-stepper`, `lights-sheet-scene-rilassante`, etc.).
- **Italian copy frozen at decision time** — bundle copy is the source of truth; no paraphrasing.

### Integration Points
- `app/components/EmberGlass/cards/{Stove,Climate,Lights,Sonos,Tuya}Card.tsx` — single-line swap each (placeholder → sheet body).
- `app/components/EmberGlass/index.ts` — add 5 sheet body exports + 6 sub-primitive exports.
- `app/components/EmberGlass/sheets/index.ts` — new barrel.
- `app/components/devices/thermostat/hooks/useThermostatCommands.ts` — new hook.
- `tests/playwright/dashboard-glass-cards.spec.ts` — extend with 5 new describe blocks (do NOT create a new spec file).
- `app/components/EmberGlass/sheets/__tests__/*.test.tsx` — 5 new sheet body specs + 6 sub-primitive specs.
- `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` — 1 new spec.
- No edits to: `DashboardCards.tsx`, `app/page.tsx`, `app/loading.tsx`, `app/layout.tsx`, any other device hook, any API route, the legacy big cards, the legacy detail pages.

</code_context>

<specifics>
## Specific Ideas

- **Bundle is the source of truth.** Every pixel value, every gradient, every transition curve, every Italian phrase in `sheets.jsx` is lifted verbatim. When in doubt, open the bundle and copy.
- **Italian copy:** see D-19..D-23. Use middle-dot `·` (U+00B7), arrows `↑ ↓` (U+2191 / U+2193), and ellipsis `…` (U+2026) as needed.
- **Two debounce values:** 500ms for ClimateSheet setpoint (per ThermostatCard pattern), 250ms for SonosSheet volume (per v16.0 memory pattern).
- **Bundle says "ThermoSheet"; we ship "ClimateSheet"** to match Phase 177 D-16 card name (`ClimateCard` + Italian label `"Clima"`). Same shape, different export name. Avoids cross-phase naming drift.
- **Stepper signature mismatch:** `useStoveCommands.handlePowerChange` takes a synthetic event `{ target: { value: String(v) } }`. The new `<Stepper>` primitive emits a raw number. Callers wrap (`onChange={(v) => handlePowerChange({ target: { value: String(v) } })}`). Document this in the Stepper JSDoc so Phase 179 (which reuses Stepper for thermostat ± in Rooms tab) doesn't repeat the wrap mistake.
- **Sheet `<Slider>` ships even though only used as a non-public primitive in Phase 178.** Sonos volume uses a plain `<input type=range>` per bundle. Custom Slider is consumed by Rooms tab (Phase 179) lights brightness slider — building it now keeps Phase 179's diff smaller.
- **Scene-by-name fallback:** if `findSceneByName` returns null for any of the 4 scene labels, the button renders disabled (50% opacity, `cursor: not-allowed`) with a `title="Crea scena 'Rilassante' su Hue"` HTML tooltip. Click does nothing.
- **Optimistic state for InlineToggle:** the existing `useLightsCommands.handleRoomToggle` already handles optimistic flips; reuse without adding a new optimistic layer in the sheet.
- **Master "Riproduci/Pausa ovunque" iterates with `Promise.allSettled`** — partial failures show in NavbarConnectionStatus, not in the sheet.
- **Stove "Orari" / "Manutenzione" buttons** close the sheet (`onClose()`) THEN navigate (`router.push('/stove/scheduler')`). Order matters — closing first lets the sheet exit animation complete (400ms cubic-bezier, Phase 175 D-08) before the route change.
- **Sheet `maxHeight: 85%` cap** is honored by every sheet body; the body itself does not need to set a height. ClimateSheet (with the radial dial) is the tallest at ~520px on a 375px-wide phone — well under the 85% cap.

</specifics>

<deferred>
## Deferred Ideas

- **CameraSheet body** — no SHEET-* requirement in v20.0. CameraCard keeps placeholder. Future phase wires HLS preview + last-motion timeline + play button (per the bundle CameraCard shape that's been split between dashboard tile and a future sheet).
- **NetworkSheet body** — no SHEET-* requirement in v20.0. NetworkCard keeps placeholder. Future phase wires WAN/LAN/Wi-Fi tabs + bandwidth chart + device list.
- **DirigeraSheet body** — pending Dirigera command proxy (no write API exists today). DirigeraCard keeps placeholder.
- **Stove "Temperatura obiettivo" slider** — Thermorossi proxy has no setpoint endpoint. A follow-up phase either: (a) adds a Thermorossi setpoint endpoint, or (b) couples StoveSheet to the Netatmo room setpoint of the stove's room. (b) is cleaner UX but couples two device families.
- **Stove pellet percentage** — bundle shows `"Pellet 62%"` in the StoveSheet hero block. Plan agent verifies whether `useStoveData` exposes `pelletPercent`. If not, the line falls back to omitting the pellet phrase.
- **`<Slider>` primitive** ships in Phase 178 but is unused; Phase 179 (Rooms tab) consumes it for lights brightness in the per-device control bodies.
- **`<BigSlider>` primitive** (bundle `sheets.jsx:476-497`) — full-width 72px-tall slider with label inside; only used in Rooms tab per the bundle. Defer to Phase 179.
- **Long-press / swipe-to-dismiss gestures** on Sheet — Phase 175 D-14 locked tap-only; Phase 178 honors that.
- **Reduced-motion overrides** — Phase 175 D-15 deferred them across v20.0.
- **Drag/touch on `<RadialDial>` arc** — only ± buttons in this phase; bundle does not implement arc drag either.
- **Hue scene creation UI** — out of scope. Sheet only activates existing scenes.
- **Sonos volume per-speaker (not per-group)** — Phase 178 uses the group's coordinator speaker. A polish phase could expose per-speaker controls in an expanded SonosSheet detail row.
- **Cleanup phase to delete `<SheetPlaceholderBody>` + legacy big cards + per-device skeletons** — fires once Camera/Network/Dirigera sheets ship and legacy detail pages are confirmed orphaned.
- **Design System Reference v2 entry for the new sheets** — Phase 182.
- **Web Vitals telemetry on sheet open/close** — could leverage v9.0 perf milestone tooling. Out of v20.0 scope.

</deferred>

---

*Phase: 178-per-device-modal-sheets*
*Context gathered: 2026-04-29*
