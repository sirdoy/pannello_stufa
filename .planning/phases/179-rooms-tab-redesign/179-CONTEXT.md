# Phase 179: Rooms Tab Redesign - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC-#1..#5, REQUIREMENTS.md ROOMS-01..05, the design bundle (`rooms.jsx`), and Phases 174/175/176/177/178 locked CONTEXT/UI-SPEC.

<domain>
## Phase Boundary

Ship the new **Rooms tab** for the Ember Glass app shell — a fully data-driven view that aggregates devices from the existing v17.0 hooks per canonical room and renders:

1. A 2-col grid of `<RoomCard>` (one per static room) — header (room icon + name + `N/M attivi`) + 3×2 device-chip grid colored per category + "+N" overflow chip when devices > 6.
2. A `<RoomSheet>` (mounted via the Phase 175 `<Sheet>` primitive) for the tapped room — summary header + per-category sections (Stufa / Termostato / Termovalvole / Luci / Prese / Audio / TV / Telecamera / Tapparelle / Sensori) + one expanded `<DeviceCard>` per device with type-specific control body.

In scope (10 device kinds × control bodies, single static room registry, real wiring where the API exists, visual stubs where it does not):

- `app/components/EmberGlass/rooms/RoomsTab.tsx` — orchestrator: reads all device hooks, aggregates via `getDevicesForRoom`, owns `selectedRoomName: string | null` state, mounts `<RoomCard>` grid + `<RoomSheet>` wrapper.
- `app/components/EmberGlass/rooms/RoomCard.tsx` — chip-grid card; reuses `<GlassCard>` (Phase 177) and `<CardHead>` (Phase 177) verbatim.
- `app/components/EmberGlass/rooms/RoomSheet.tsx` — sheet body wrapping the room summary header + grouped category sections; mounted inside `<Sheet open onClose title>` from RoomsTab.
- `app/components/EmberGlass/rooms/DeviceChip.tsx` — 1:1 aspect-ratio chip used inside RoomCard (icon + on-state dot, color-mix tone).
- `app/components/EmberGlass/rooms/DeviceCard.tsx` — expanded card inside RoomSheet (header row + body); composes `<DevicePrimaryControl>` + `<DeviceBody>`.
- `app/components/EmberGlass/rooms/DevicePrimaryControl.tsx` — right-aligned header control, dispatches by `device.kind`: `<InlineToggle>` (thermo/valve/light/plug), play/pause circle (sonos), LIVE pill (camera), OK pill (sensor), no control (stove/tv/shade — toggle on first row of body).
- `app/components/EmberGlass/rooms/DeviceBody.tsx` — body dispatcher; renders one of 10 type-specific bodies (StoveBody, ThermoBody, ValveBody, LightBody, PlugBody, SonosBody, TvBody, ShadeBody, CameraBody, SensorBody). Thermo and valve share the same body (DualTempReadout + ±0.5° + Eco/Auto).
- `app/components/EmberGlass/rooms/primitives/StatChip.tsx` — small label/value chip (used by Stove, Plug, Sensor, TV bodies).
- `app/components/EmberGlass/rooms/primitives/DualTempReadout.tsx` — Attuale → Target dual readout (used by Thermo/Valve body).
- `app/components/EmberGlass/rooms/primitives/SliderRow.tsx` — labeled gradient bar (used by Light, Sonos, Shade bodies).
- `app/components/EmberGlass/rooms/primitives/ControlRow.tsx` — flex row of `<MiniButton>`.
- `app/components/EmberGlass/rooms/primitives/MiniButton.tsx` — 34px-tall pill button with optional icon + label, filled/outlined variants.
- `app/components/EmberGlass/rooms/lib/rooms-config.ts` — static ROOMS list (6 entries: Soggiorno, Cucina, Camera, Studio, Bagno, Ingresso) + ROOM_ALIASES + EXTRA_DEVICES (TV/blinds/humidity/camera mocks per ROOMS-01) + ICON_FOR + CATEGORY_ORDER + CATEGORY_LABEL.
- `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` — pure aggregator: takes the 5 hook outputs (`stove`, `thermostat`, `lights`, `plugs`, `sonos`) + room name, returns a `RoomDevice[]` array. Mirrors bundle `rooms.jsx:58-128` but reads real hook fields (verified by plan agent).
- `app/components/EmberGlass/rooms/types.ts` — `RoomDevice`, `RoomConfig`, `DeviceKind` discriminated union (10 kinds).
- `app/components/EmberGlass/rooms/index.ts` — barrel export of `RoomsTab` + sub-components for downstream phases (Phase 181 mounts RoomsTab in the glass tab bar; Phase 182 references primitives in DSREF page).
- `app/stanze/page.tsx` — new Next.js route. Single line: `'use client';` + `<RoomsTab />` (or with auth guard like Phase 177 dashboard does). The route name is **`/stanze`** (Italian, matches NAV-02 phase 181 label, avoids collision with the existing v15.0 `/rooms` settings-CRUD page which stays untouched).
- Jest unit tests — one spec per non-trivial component (`RoomCard`, `RoomSheet`, `DeviceChip`, `DeviceCard`, each `*Body`, each shared primitive, `getDevicesForRoom` pure-function fixtures).
- Playwright extension to a dedicated new spec file `tests/playwright/rooms-tab.spec.ts` — open `/stanze`, assert 6 RoomCards render with non-zero counts, click one, assert RoomSheet opens with categorized device list, click a chip → assert `<DeviceChip>` styling matches `device.on` state, close sheet, verify no console errors (reuse `collectConsoleErrors` from Phase 51/97).

Out of scope (future phases):

- **Replacing or deleting the v15.0 `/rooms` admin-CRUD page** (`app/rooms/page.tsx`) — that page manages the device registry rooms entity; Phase 179 ships the dashboard *Rooms tab* surface, which is a different concept. The cleanup phase (post-181) decides whether `/rooms` becomes `/registry/rooms`. Phase 179 leaves it untouched.
- **Wiring the new `/stanze` route into a global navigation bar.** Phase 181 (Glass Bottom Tab Bar) handles wiring `Home / Stanze / Automazioni / Altro` into a chrome bar. For Phase 179 the route exists and is reachable via direct URL or via a one-line link (no nav redesign).
- **Real Tuya plug → room registry join.** `TuyaPlug` exposes `custom_name` (registry) but no `room` field; `useRoomsHealth` joins thermostat zones only. For Phase 179 every Tuya plug is statically assigned to **"Cucina"** in `EXTRA_DEVICES` / aggregator (matches bundle `rooms.jsx:96-106` where `state.plugs` carries a synthetic `room` field). A follow-up phase ships a `useDeviceRegistry()` hook that joins `/api/v1/registry/devices` with `/api/v1/rooms`; PlugsCard / RoomsTab then drop the static "Cucina" fallback. Tracked in `<deferred>` below.
- **Real DIRIGERA sensor mapping.** Dirigera proxy exposes contact + motion sensors but no room field. Phase 179 does NOT include DIRIGERA sensors. The static "Bagno → Umidità" sensor mock from the bundle remains static (humidity-percent + trend literals, no live sensor wiring).
- **Real TV / blind / humidity / camera device proxies.** ROOMS-01 says "*plus the static device entries (TV, blinds, humidity sensor, entrance camera)*" — these are mock mock entries. Phase 179 ships them as **static** in `EXTRA_DEVICES` with on-screen interactions that are no-op (clicks render visually but do not dispatch a real command). Future phases can ship a TV proxy / blind proxy / humidity sensor proxy and migrate the static entries.
- **Real per-light brightness slider wiring.** The bundle's LightBody has 0–100% Luminosità slider + 2200–6500K Temperatura slider. `useLightsCommands.handleBrightnessChange(groupId, brightness)` exists but is a **per-group/room** command (not per-light); color-temp endpoint does not exist in `useLightsCommands`. **Decision:** brightness slider in LightBody dispatches `handleBrightnessChange` against the **group** the light belongs to (so all lights in that group share the slider value visually — accept the imprecision); color-temp slider is **rendered visually but is read-only** with `cursor: not-allowed` and `aria-disabled="true"` (slider thumb still renders for visual fidelity with bundle but accepts no input). Document the limitation in JSDoc.
- **Real shade / blind position commands.** No proxy exists. Sliders + Up/Stop/Down buttons render but on-click is no-op.
- **Real TV / HDMI source switching.** No proxy exists. Buttons render filled/outlined per static state but on-click is no-op.
- **Long-press, swipe, drag-to-dismiss gestures** on RoomSheet — Phase 175 D-14 locked tap-to-dismiss only.
- **Reduced-motion overrides** — Phase 175 D-15 deferred them across v20.0.
- **Replacing the new Phase 178 Sheet sub-primitives with bundle-named ones.** Phase 178 ships `<SheetRow>`, `<Stepper>`, `<Slider>`, `<RadialDial>`, `<SheetBtn>`, `<QuickActionButton>` under `app/components/EmberGlass/sheets/primitives/`. Phase 179 needs **different** primitives (`<StatChip>`, `<DualTempReadout>`, `<SliderRow>`, `<ControlRow>`, `<MiniButton>`) — bundle `rooms.jsx:511-604`. They live under `app/components/EmberGlass/rooms/primitives/` to keep the rooms-tab layout decoupled from the sheets-tab layout. Specifically: bundle's room `<SliderRow>` is a **read-only visual gradient bar with no thumb** (different from Phase 178's `<Slider>` which is an interactive `<input type=range>`). They are not interchangeable. Renaming/colocating later is a cleanup-phase decision.
- **Activating real Hue scenes from RoomCard / RoomSheet.** Bundle's RoomSheet has no scene strip (scenes are in LightsSheet, Phase 178). Phase 179 does NOT add a scene strip to the Rooms tab.
- **Live "active count" updates from WebSocket pushes.** Phase 17.0 already ships WS-primary + 60s polling fallback for all 5 device hooks; the Rooms tab inherits that for free. No new WS subscriptions, no new aggregator-level cache. The aggregator is a pure function called per render.
- **Aggregator memoization / `useMemo`.** Phase 71 / 95 React Compiler discipline. The aggregator is pure and small (≤6 rooms × ~15 devices); React Compiler 1.0 handles auto-memoization.
- **Phase 180 (Automations Tab Full Editor), Phase 181 (Glass Bottom Tab Bar), Phase 182 (Design System Reference Page v2).**

</domain>

<decisions>
## Implementation Decisions

### File layout & namespace
- **D-01:** [informational] All new Rooms-tab files live under `app/components/EmberGlass/rooms/` — sibling to `app/components/EmberGlass/cards/` (Phase 177 D-01) and `app/components/EmberGlass/sheets/` (Phase 178 D-01). Concrete layout:
  - `rooms/RoomsTab.tsx` (orchestrator)
  - `rooms/RoomCard.tsx`
  - `rooms/RoomSheet.tsx`
  - `rooms/DeviceChip.tsx`
  - `rooms/DeviceCard.tsx`
  - `rooms/DevicePrimaryControl.tsx`
  - `rooms/DeviceBody.tsx`
  - `rooms/bodies/{Stove,Thermo,Valve,Light,Plug,Sonos,Tv,Shade,Camera,Sensor}Body.tsx` (10 files; `ThermoBody` and `ValveBody` may share a single file `ThermoBody.tsx` exporting both — plan agent decides)
  - `rooms/primitives/{StatChip,DualTempReadout,SliderRow,ControlRow,MiniButton}.tsx`
  - `rooms/lib/{rooms-config,getDevicesForRoom}.ts`
  - `rooms/types.ts`
  - `rooms/index.ts` — barrel re-exporting everything for downstream consumers.
  - Re-exported from `app/components/EmberGlass/index.ts` so Phase 181 can import via `@/app/components/EmberGlass`.
- **D-02:** [informational] Inline-style + `var(--token)` convention from Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 / Phase 178 D-02 is mandatory. **No Tailwind classes for visual values inside any `rooms/` file** — bundle is the source of truth and bundle is inline-style. Layout flex/grid + spacing tokens stay inline too. This is the consistent rule for the whole `EmberGlass/` namespace.
- **D-03:** [informational] RoomsTab itself uses `'use client'` (state-bearing — owns `selectedRoomName`). All sub-components are client components when they bind events; pure presentational atoms (`<DeviceChip>`, `<StatChip>`, `<DualTempReadout>`, `<SliderRow>`, `<ControlRow>`, `<MiniButton>`) are client components by inheritance. No server-component refactor in this phase.
- **D-04:** Route mount: new `app/stanze/page.tsx` renders `<RoomsTab />` only. The page is `'use client'` and reuses the existing auth wrapping pattern from `app/page.tsx` (Auth0 guard via `useUser` if applicable; plan agent confirms by reading `app/page.tsx`). The existing `/rooms` settings-CRUD page is **untouched**. The route name is `/stanze` (Italian, matches the NAV-02 nav label from Phase 181, and explicitly avoids the `/rooms` collision).

### Static room config (bundle parity)
- **D-05:** **`ROOMS` list** is a static frozen tuple of 6 rooms (matches bundle `rooms.jsx:6-13`):
  ```ts
  export const ROOMS = [
    { name: 'Soggiorno', tone: 'var(--accent)', icon: 'home' },
    { name: 'Cucina',    tone: '#f5c84a',       icon: 'home' },
    { name: 'Camera',    tone: '#b080ff',       icon: 'moon' },
    { name: 'Studio',    tone: '#5eafff',       icon: 'home' },
    { name: 'Bagno',     tone: '#6aa86a',       icon: 'droplet' },
    { name: 'Ingresso',  tone: '#ffb84a',       icon: 'home' },
  ] as const;
  ```
  `icon` is a string key resolved via `ICON_FOR` to a lucide-react component (Home / Moon / Droplets) — keeps the array JSON-serializable for testing fixtures. Tones are bundle verbatim (one is `var(--accent)` to follow the active accent picker from DS-03, the rest are fixed hex codes per bundle).
- **D-06:** **`ROOM_ALIASES` map** (matches bundle `rooms.jsx:16-29`) — string-to-string normalizer that maps real device-supplied room strings (Netatmo zone names, Hue group names, Sonos group names) to the canonical 6 ROOMS keys. Bundle entries kept verbatim plus we add aliases discovered during plan agent's hook output verification (e.g. `'Living'` → `'Soggiorno'`, `'Bedroom'` → `'Camera'`). Unmatched room names fall through and the device is **dropped** from the rooms-tab aggregation (rather than rendering an "Other" bucket — keeps the 6-card grid clean and ROOMS-02 chip-grid tidy). Plan agent emits a `console.warn('[rooms] unmatched room name', name)` once per unique unmatched name to surface gaps for follow-up `ROOM_ALIASES` additions.
- **D-07:** **`EXTRA_DEVICES` map** (matches bundle `rooms.jsx:32-49`) — static mocks for TV, blinds, humidity sensor, entrance camera per ROOMS-01. Verbatim shape from bundle. These have **deterministic mock state** (e.g. `Soggiorno → TV netflix HDMI 1`) and are flagged `mock: true` on the `RoomDevice` interface so future phases that ship real proxies for these device kinds can swap in without touching aggregator code.
- **D-08:** **`ICON_FOR` map** (matches bundle `rooms.jsx:51-55`) — `DeviceKind → lucide-react component`. Concretely:
  - `stove → Flame`
  - `thermo → Thermometer`
  - `valve → Thermometer` (same icon)
  - `light → Lightbulb`
  - `plug → Plug`
  - `sonos → Music`
  - `tv → Tv`
  - `camera → Video`
  - `shade → Blinds`
  - `sensor → Droplets`
  These are **lucide-react** imports (already a dep). The Phase 178 sheets use lucide; the rooms tab follows suit. Bundle uses ad-hoc `IconFlame` / `IconHome` SVG components — replace with the lucide equivalents that Phase 177/178 already use elsewhere.
- **D-09:** **`CATEGORY_ORDER`** (matches bundle `rooms.jsx:221`) — `['stove', 'thermo', 'valve', 'light', 'plug', 'sonos', 'tv', 'camera', 'shade', 'sensor']`. **`CATEGORY_LABEL`** Italian copy — `Stufa / Termostato / Termovalvole / Luci / Prese / Audio / TV / Telecamera / Tapparelle / Sensori`. Frozen.

### Device aggregator
- **D-10:** **`getDevicesForRoom(state, roomName)`** is a pure synchronous function. Signature:
  ```ts
  export interface AggregatorState {
    stove: { on: boolean; temp: number; powerLevel: number; fanLevel: number; target?: number };
    thermostat: { zones: Array<{ name: string; on: boolean; current: number; target: number; kind: 'thermo' | 'valve'; roomId: string }> };
    lights: { lights: Array<{ name: string; on: boolean; room_name: string | null; groupId: string; brightness?: number }> };
    plugs: { plugs: Array<{ id: string; name: string; on: boolean; power: number; today_kwh?: number }> };
    sonos: { groups: Array<{ id: string; name: string; playing: boolean; track: string; artist: string; volume: number; coordinator: string }> };
  }
  export function getDevicesForRoom(state: AggregatorState, roomName: typeof ROOMS[number]['name']): RoomDevice[]
  ```
  Plan agent confirms exact field names against live hook outputs (`useStoveData`, `useThermostatData`, `useLightsData`, `useTuyaData`, `useSonosFullData`). The aggregator runs once per `RoomCard` and once per `RoomSheet` open — no memoization (Phase 71/95 React Compiler discipline; the work is trivial).
- **D-11:** **Stove → Soggiorno** statically (single device, hardcoded; bundle convention `rooms.jsx:61`). The `extra` field carries the full stove state for `<StoveBody>`.
- **D-12:** **Thermostat zones → ROOM_ALIASES[zone.name]**. Each zone becomes either `kind: 'thermo'` or `kind: 'valve'` based on the existing thermostat-zone metadata (plan agent verifies which field exposes thermo-vs-valve — likely `kind` or `type` or `module_type`).
- **D-13:** **Lights → ROOM_ALIASES[light.room_name]**, dropping lights with `room_name === null` (Hue lights without room assignment). Each light becomes `kind: 'light'` with its `groupId` (Hue group/room id) carried in `extra` for the brightness command wiring (D-22).
- **D-14:** **Plugs → static "Cucina"** (Tuya proxy has no `room` field; v15.0 registry lacks a Tuya join). Every Tuya plug renders inside the Cucina room until the registry join phase ships. Bundle `rooms.jsx:96-106` reads `p.room` from synthetic state; Phase 179 hardcodes the assignment in the aggregator. Document this in JSDoc on `getDevicesForRoom`.
- **D-15:** **Sonos groups → ROOM_ALIASES[group.name]**. Sonos group names are user-configured and often match room names ("Soggiorno", "Cucina"); ROOM_ALIASES handles common variants.
- **D-16:** **EXTRA_DEVICES are appended** to each room's device list in stable order (after the live devices). They render with the same chip-tone mapping as live devices.
- **D-17:** **Room ordering inside RoomSheet** follows `CATEGORY_ORDER`; within a category, devices keep aggregator order (which is hook-emission order — stable for live devices, static for EXTRA_DEVICES).

### RoomCard (chip-grid card)
- **D-18:** **`<RoomCard room={ROOMS[i]} devices={...} onOpen={() => setSelectedRoomName(room.name)} />`** — composes `<GlassCard>` (Phase 177) + `<CardHead>` (Phase 177).
  - **Header** (`<CardHead>`): `Icon={ICON_FOR[room.icon]}`, `label={room.name}`, `tone={room.tone}`, `right={<span>{activeCount}/{devices.length}</span>}`. The right-slot count uses `tabular-nums` and tints to `room.tone` when `activeCount > 0` (per bundle `rooms.jsx:166-168`).
  - **Body**: `display: 'grid'`, `gridTemplateColumns: 'repeat(3, 1fr)'`, `gap: 6`, `alignContent: 'start'`. Renders `devices.slice(0, 6).map((d, i) => <DeviceChip key={i} device={d} />)`. If `devices.length > 6`, append a "+N" overflow chip (dashed border, `var(--text-2)` text). If `devices.length === 0`, render single empty-state chip spanning all 3 columns: `Nessun dispositivo`.
- **D-19:** **`<RoomCard>` is wrapped in `<Pressable as={GlassCard} onClick={onOpen}>`** to satisfy Phase 175 SC-#1 ("every NEW glass surface in Phases 177-181 reuses Pressable"). RoomCard is a glass surface; chip-grid is interactive at the card level. Plan agent confirms how `<GlassCard>` accepts `onClick` — Phase 177 already wires `<GlassCard onOpen>`; reuse.

### DeviceChip (1:1 chip in RoomCard grid)
- **D-20:** **`<DeviceChip device={device} />`** — `aspectRatio: '1 / 1'`, `borderRadius: 10`, `position: 'relative'`. Background uses `color-mix(in oklab, ${tone} 18%, transparent)` when `device.on`, else `rgba(255,255,255,0.04)`. Border 0.5px `color-mix(in oklab, ${tone} 35%, transparent)` when on, else `rgba(255,255,255,0.06)`. Icon 14px lucide. When `device.on`, render a 5×5 dot pinned `top: 3, right: 3` filled with `tone` and `boxShadow: 0 0 6px ${tone}` (per bundle `rooms.jsx:204-211`). DeviceChip is **not** clickable — taps bubble to RoomCard.

### RoomSheet (sheet body wrapping room contents)
- **D-21:** **`<RoomSheet open={open} onClose={onClose} room={room|null} devices={...} />`** — internally renders `<Sheet open={open} onClose={onClose} title={room?.name ?? ''}>` (the Phase 175 primitive). When `room === null`, render `<Sheet open={false} onClose={onClose} />` and bail (matches bundle `rooms.jsx:218`). Inside the sheet:
  - **Summary header** (top of sheet body): rounded 18px container, `linear-gradient(130deg, color-mix(in oklab, ${room.tone} 16%, transparent) 0%, transparent 70%)` background, 0.5px tone-tinted border. Layout = 42×42 icon tile (left) + flex column (`{activeCount} di {devices.length} attivi` 16px display, `{N} categorie di dispositivi` 12px dim). Per bundle `rooms.jsx:234-257`.
  - **Per-category sections**: For each category in `CATEGORY_ORDER` that has ≥1 device, render section with 11px caps label (`CATEGORY_LABEL[k]`) and a stack of `<DeviceCard>` (10px gap). Per bundle `rooms.jsx:259-270`.
- **D-22:** RoomSheet body component is a body-only renderer; it does NOT take props. Wait — actually it DOES take `{ open, onClose, room, devices }` because RoomsTab orchestrator owns the state. Final props:
  ```tsx
  interface RoomSheetProps {
    open: boolean;
    onClose: () => void;
    room: RoomConfig | null;
    devices: RoomDevice[];
  }
  ```
  Diverges from Phase 178 sheets (which were prop-less and self-fetched) because Phase 179 has a single sheet that switches by selected room rather than 5 separate per-card sheets. Aggregation happens in RoomsTab so RoomSheet stays pure.

### DeviceCard (expanded card inside RoomSheet)
- **D-23:** **`<DeviceCard device={device} />`** — bundle `rooms.jsx:276-317` verbatim shape:
  - Outer container: 16px radius, 14px padding, gradient background tinted by `device.tone` when `on`, plain `rgba(255,255,255,0.03)` when off. Border 0.5px tone-tinted when on.
  - **Header row** (12px gap, 12px margin-bottom): 40×40 icon tile (`color-mix(in oklab, ${tone} 22%, transparent)` when on, glow shadow), `flex: 1` name (15px 600) + status line (`device.on ? 'Attivo' : 'Inattivo'` middle-dot `device.value`), right-aligned `<DevicePrimaryControl>`.
  - **Body**: `<DeviceBody device={device} />` dispatches by kind.
- **D-24:** DeviceCard is **not wrapped in `<Pressable>`** — it has no card-level click action (the row is a container; controls inside dispatch their own actions). Matches Phase 178 D-24 distinction (sheet-internal content is not a glass surface for SC-#1 purposes).

### DevicePrimaryControl (header right-slot)
- **D-25:** Dispatch by `device.kind` (matches bundle `rooms.jsx:319-352`):
  - `sonos` → 40×40 round play/pause button. Background `#fff` when `device.on` (playing), color `#1a0f08`; else `rgba(255,255,255,0.08)` color `#fff`. **Wired:** `onClick={() => device.on ? handlePause(device.extra.groupId) : handlePlay(device.extra.groupId)}`.
  - `camera` → LIVE pill (10px caps, `letterSpacing: 0.6`) + 6×6 pulsing dot. **Read-only.**
  - `sensor` → OK pill same shape as camera. **Read-only.**
  - `light` → `<InlineToggle on={device.on} color={device.tone} onChange={() => handleRoomToggle(device.extra.groupId, !device.on)} />`. **Wired** to `useLightsCommands.handleRoomToggle`. Mirrors Phase 178 D-07 LightsSheet per-room rows.
  - `plug` → `<InlineToggle on={device.on} color={device.tone} onChange={() => togglePlug(device.extra.id, device.on)} />`. **Wired** to `useTuyaCommands.togglePlug`. Mirrors Phase 178 D-09 PlugsSheet per-plug rows.
  - `thermo` / `valve` → `<InlineToggle on={device.on} color={device.tone} onChange={() => setRoomMode(device.extra.roomId, device.on ? 'off' : 'on')} />`. **Wired** to `useThermostatCommands.setRoomMode`. Plan agent verifies exact `'on' | 'off'` mode strings against the proxy contract (the existing `setRoomMode` second arg type is open-ended — see Phase 178 D-09).
  - `stove` / `tv` / `shade` → no header control; primary control lives inside the body (Power button for stove; HDMI/source row for TV; Up/Stop/Down for shade). Header right-slot renders an empty `<div style={{ width: 40 }}/>` placeholder for layout consistency.
  - `default` → `<InlineToggle>` no-op for any unhandled kind (defensive — should never trigger with the discriminated union).

### DeviceBody (body dispatcher → 10 type-specific bodies)
- **D-26:** **`<DeviceBody>`** is a `switch` on `device.kind` (matches bundle `rooms.jsx:355-509` verbatim shape per kind). Each body is its own file under `rooms/bodies/`. They are pure presentational with `device` prop only; commands hooks are passed via React context (D-37) or imported per-body (plan agent picks one — recommend per-body imports to keep RoomsTab orchestrator lean and follow Phase 178 D-04 self-fetch convention).

  **Body specs (frozen visuals from bundle, real wiring where API exists):**

- **D-27: `<StoveBody>`** (`kind === 'stove'`):
  - Layout: 3 stat chips (Target / Fiamma / Ventola) in a row (use `<DeviceBodyLayout>` wrapper = `display: flex, flexDirection: column, gap: 10`).
  - Then a `<ControlRow>` of 3 `<MiniButton>`: Meno (`<Minus>` icon), Power (`<Power>` icon, filled when `device.on`, tone accent), Più (`<Plus>` icon).
  - **Wired:** `Meno → handlePowerChange({ target: { value: String(powerLevel - 1) } })`; `Power → device.on ? handleShutdown() : handleIgnite()` (gated on `needsCleaning` per Phase 178 D-05); `Più → handlePowerChange({ target: { value: String(powerLevel + 1) } })`. The bundle's stove body in Rooms tab is more compact than the StoveSheet (Phase 178); we accept the redundancy — Phase 178 sheet is reachable from the Stove dashboard card; Phase 179 sheet is reachable from the Rooms tab's Soggiorno card.
- **D-28: `<ThermoBody>`** / **`<ValveBody>`** (shared body — `kind === 'thermo' || kind === 'valve'`):
  - `<DualTempReadout current={extra.current} target={extra.target} tone={device.tone} />`.
  - `<ControlRow>` of 4 `<MiniButton>`: −0.5° (`<Minus>` icon, label `−0.5°`), +0.5° (`<Plus>` icon, label `+0.5°`), Eco (label only), Auto (label only, filled when home mode is `schedule`).
  - **Wired:** `−0.5° / +0.5° → setRoomSetpoint(extra.roomId, extra.target ± 0.5)` debounced 500ms (Phase 178 D-06 pattern). `Eco → setHomeMode('away')`. `Auto → setHomeMode('schedule')`. Plan agent verifies exact mode strings from `SetThermmodeRequest['mode']`.
- **D-29: `<LightBody>`** (`kind === 'light'`):
  - `<SliderRow label="Luminosità" value={extra.brightness ?? 0} unit="%" tone={device.tone} disabled={!device.on} />` (read-only visual + click-to-set via simulated drag — see D-31).
  - `<SliderRow label="Temperatura" value={extra.temp ?? 2700} unit="K" min={2200} max={6500} tone={device.tone} disabled={true} />` (always disabled — no API).
  - **Wired (luminosità only):** brightness slider commits on pointer-up via `useLightsCommands.handleBrightnessChange(extra.groupId, String(newPercent))` debounced 250ms. Color-temp slider is disabled.
- **D-30: `<PlugBody>`** (`kind === 'plug'`):
  - 2-col grid of 2 `<StatChip>`: Ora (formatted W or kW from `extra.power`) and Oggi (`extra.today_kwh` kWh).
  - **Read-only.** Toggle is in the header (D-25).
- **D-31: `<SonosBody>`** (`kind === 'sonos'`):
  - 12px dim track-line `{track} · {artist}` (with `'—'` artist hidden — bundle `rooms.jsx:417`).
  - `<SliderRow label="Volume" value={extra.volume} unit="%" icon={IconVolume} tone={device.tone} disabled={!device.on} />`.
  - `<ControlRow>` of 3 `<MiniButton>`: SkipBack (`<SkipBack>` icon), Play/Pause (filled tone), SkipForward (`<SkipForward>` icon).
  - **Wired:** Volume → `handleSetVolume(extra.coordinator, value)` debounced 250ms (Phase 178 D-08 pattern). SkipBack → `handlePrevious(extra.groupId)`. Play/Pause → `device.on ? handlePause : handlePlay` (same as DevicePrimaryControl). SkipForward → `handleNext(extra.groupId)`.
- **D-32: `<TvBody>`** (`kind === 'tv'`):
  - 2-col grid of 2 `<StatChip>`: Sorgente (`extra.source`), Volume (`extra.volume`).
  - `<ControlRow>` of 3 `<MiniButton>`: HDMI 1 (filled when `extra.source === 'HDMI 1'`), HDMI 2 (filled when `extra.source === 'HDMI 2'`), App.
  - **No-op** clicks (no TV proxy). Buttons render visually correct.
- **D-33: `<ShadeBody>`** (`kind === 'shade'`):
  - `<SliderRow label="Posizione" value={extra.position} unit="%" tone={device.tone} />`.
  - `<ControlRow>` of 3 `<MiniButton>`: Su (`<ChevronUp>` icon, label "Su"), Stop (label only), Giù (`<ChevronDown>` icon, label "Giù").
  - **No-op** clicks (no shade proxy).
- **D-34: `<CameraBody>`** (`kind === 'camera'`):
  - 16:9 preview box with LIVE caption (top-left, pulsing 5×5 dot + `LIVE · {fps}fps` 9px caps) + motion footnote (bottom: `Movimento {motion}`) + 46×46 round play overlay (centered, blurred). Background gradient `linear-gradient(135deg, #0a1a0a 0%, #0a0908 100%)`.
  - **No-op** click on play (no camera-stream proxy in this phase).
- **D-35: `<SensorBody>`** (`kind === 'sensor'`):
  - 2-col grid of 2 `<StatChip>`: Valore (`{humidity}%`), Trend (`{trend}` — string like `"stabile"` / `"in salita"` from EXTRA_DEVICES static).
  - **Read-only.**

### Shared primitives (rooms-only — distinct from sheets primitives)
- **D-36:** Five new primitives under `rooms/primitives/`:
  - **`<StatChip label value tone>`** — bundle `rooms.jsx:516-528`. 10px caps label + 16px display value. Background `rgba(255,255,255,0.04)`, 0.5px white border, 10px radius, `tabular-nums`. **`tone` prop unused inside chip body** (color stays `#fff`); it is accepted for API consistency with `<DualTempReadout>` and to allow future themed accents — plan agent may drop it if YAGNI per Phase 117 dead-export discipline.
  - **`<DualTempReadout current target tone>`** — bundle `rooms.jsx:530-557`. Two 22px display readouts separated by `<ChevronRight>`. Target value uses `tone` color.
  - **`<SliderRow label value unit min max tone icon disabled onChange?>`** — bundle `rooms.jsx:559-585`. Read-only gradient bar (no thumb, no native `<input>`). When `onChange` is provided, the row becomes a tap-to-seek strip (compute click x → percentage → onChange(percent)). Default min=0, max=100. `disabled` dims to opacity 0.45 and disables `onChange`.
  - **`<ControlRow>{children}`** — bundle `rooms.jsx:587-589`. Flex row, 6px gap.
  - **`<MiniButton Icon label filled tone onClick disabled>`** — bundle `rooms.jsx:591-604`. 34px tall, 10px radius, optional icon + label (one or both required), `filled` variant uses tone-tinted bg + tone color + glow shadow.
- **D-37:** [informational] Primitives are **pure presentational**. No `useMemo` / `useCallback` (Phase 71 / 95 / 178 D-33 React Compiler discipline). Inline event handlers permitted (Phase 178 D-34).

### Commands hook usage
- **D-38:** [informational] All wiring uses **existing** commands hooks. **No new commands hooks** in Phase 179:
  - `useStoveCommands` — `handleIgnite`, `handleShutdown`, `handlePowerChange`, `handleConfirmCleaning` (gate).
  - `useThermostatCommands` — `setRoomSetpoint`, `setHomeMode`, `setRoomMode` (Phase 178 added).
  - `useLightsCommands` — `handleRoomToggle`, `handleBrightnessChange`.
  - `useSonosCommands` — `handlePlay`, `handlePause`, `handleNext`, `handlePrevious`, `handleSetVolume`.
  - `useTuyaCommands` — `togglePlug`.
- **D-39:** [informational] Hooks are called inside the relevant body component (RoomCard / DevicePrimaryControl / each `<*Body>`) — NOT at the RoomsTab orchestrator level. Reasons: (a) decouples sub-components from the orchestrator's hook list; (b) each body owns the handlers it needs; (c) parallels the Phase 178 self-fetch pattern. RoomsTab only owns the `selectedRoomName` state and the data hooks for the **chip-grid** active counts (so cards can color the count badge correctly).
- **D-40:** [informational] **Optimistic UI** — same pattern as Phase 178 D-28. InlineToggle and slider commits flip locally and roll back on next data tick if the underlying command fails. Reuses the existing `useRetryableCommand` infrastructure already wrapped inside each commands hook.

### RoomsTab (orchestrator)
- **D-41:** Reads all 5 device hooks at the top of the function: `useStoveData`, `useThermostatData`, `useLightsData`, `useTuyaData`, `useSonosFullData`. Builds an `AggregatorState` literal from their outputs (mapping field names per D-10). Pure projection — no `useMemo`.
- **D-42:** Owns `const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);`. RoomCard `onOpen` sets it; RoomSheet `onClose` clears it.
- **D-43:** Renders 6 `<RoomCard>` (one per ROOMS entry) inside a 2-col grid (`gridTemplateColumns: 'repeat(2, 1fr)'`, gap 12, padding `0 12px`). Above the grid, a 70px-top padded title block: `{N} stanze` 13px dim caps + "Stanze" 30px display title (bundle `rooms.jsx:136-140`). The 70px-top padding is the bundle's safe-area for the future glass nav bar (Phase 181); Phase 179 uses it now so the layout doesn't shift when Phase 181 ships.
- **D-44:** Renders one `<RoomSheet>` at the orchestrator level — `room` prop is derived via `ROOMS.find(r => r.name === selectedRoomName) ?? null`; `devices` is `selectedRoomName ? getDevicesForRoom(state, selectedRoomName) : []`. Single sheet (not 6) — matches bundle and avoids 6 mounted-but-closed sheets.

### Loading + error
- **D-45:** **First-load skeleton** — when ALL device hooks are still loading, render `<RoomsTabSkeleton>` (one card per ROOMS entry, plain pulsing rectangles). When some hooks have data and some don't, the room counts use the available data; loading hooks contribute zero devices. Reuse `<GlassCardSkeleton>` from Phase 177 if it fits; otherwise a new `<RoomCardSkeleton>` is acceptable.
- **D-46:** **Error / unreachable** — when all device hooks error and no cached data, the title block renders `Stanze` + a single 14px secondary line `Non raggiungibile. Riprova più tardi.` + retry button (calls `refetch()` on each hook). Per-card error states are NOT shown — partial failure is rendered as missing devices in the chip grid. Sheet-level errors render the same shape inside the sheet. Pattern matches Phase 178 D-27.
- **D-47:** **Empty state** (`devices.length === 0` for a room) — RoomCard chip-grid shows centered `Nessun dispositivo` (11px dim, span all 3 cols, 14px vertical padding). Per bundle `rooms.jsx:181-185`.

### Italian copy (frozen — do not paraphrase)
- **D-48:** Page title: `"Stanze"` (30px display, top-of-tab). Subtitle: `"{N} stanze"` (13px dim caps).
- **D-49:** RoomSheet summary header: `"{activeCount} di {total} attivi"` (16px display) + `"{N} categorie di dispositivi"` (12px dim).
- **D-50:** Category labels: `Stufa` / `Termostato` / `Termovalvole` / `Luci` / `Prese` / `Audio` / `TV` / `Telecamera` / `Tapparelle` / `Sensori`.
- **D-51:** Device status line: `"Attivo · {value}"` / `"Inattivo · {value}"` where `{value}` is the kind-specific string (e.g. `"21.3° → 21°"` for thermo, `"450W"` for plug, `"58%"` for sensor, `"LIVE"` for camera, `"Spenta"` for stove off, `"In pausa"` for sonos paused).
- **D-52:** Stove body buttons: `"Meno"`, `"Power"`, `"Più"`. Bundle `rooms.jsx:368`.
- **D-53:** Thermo/Valve body buttons: `"−0.5°"`, `"+0.5°"`, `"Eco"`, `"Auto"`. Use unicode minus `−` (U+2212), not hyphen.
- **D-54:** Light body labels: `"Luminosità"`, `"Temperatura"`. Unit suffix `"%"` and `"K"` respectively.
- **D-55:** Plug body chip labels: `"Ora"`, `"Oggi"`. Power format `≥1000W → "X.YkW"`, else `"NW"` (no space — bundle inline). kWh format `"{N.N} kWh"` (with space — bundle uses space for kWh).
- **D-56:** Sonos body labels: `"Volume"`. Track-line: `"{track} · {artist}"` (middle-dot, omit artist when `'—'`).
- **D-57:** TV body chip labels: `"Sorgente"`, `"Volume"`. Buttons: `"HDMI 1"`, `"HDMI 2"`, `"App"`.
- **D-58:** Shade body labels: `"Posizione"`. Buttons: `"Su"`, `"Stop"`, `"Giù"`.
- **D-59:** Camera body: `"LIVE · {fps}fps"` caps + `"Movimento {motion}"` footer (where `motion` is e.g. `"rilevato 2m fa"` from EXTRA_DEVICES static).
- **D-60:** Sensor body chip labels: `"Valore"`, `"Trend"`.

### Press behavior (Phase 175 SC-#1)
- **D-61:** **Glass surfaces** in this phase are: **`<RoomCard>`** (the GlassCard) and **`<DeviceCard>`** (a glass-tinted container). Per Phase 175 SC-#1, every NEW glass surface in Phases 177-181 reuses `<Pressable>`. Therefore:
  - `<RoomCard>` wraps in `<Pressable as={GlassCard} onClick={onOpen}>`. **Required.**
  - `<DeviceCard>` is **not interactive at the card level** — controls inside dispatch their own actions. **Skip Pressable wrap** because there is no card-level click. Plan agent verifies SC-#1 wording — if "every glass surface" is interpreted strictly as "every visually-glass surface regardless of interactivity", the rule still applies and DeviceCard wraps in `<Pressable>` with no `onClick`. Recommend the strict interpretation to avoid argument: wrap with `<Pressable as="div">` and no handler.
- **D-62:** [informational] Sub-primitives (`<MiniButton>`, `<SliderRow>` thumb, `<DeviceChip>`) are bare clickable elements. Browser `:active` state is sufficient feedback. They are NOT glass surfaces (they have tone-tinted small chips, not blurred glass).

### Tests
- **D-63:** **Jest unit tests** under `app/components/EmberGlass/rooms/__tests__/` — one spec per non-trivial component:
  - `RoomCard.test.tsx` — renders 6 chips for given `devices` prop, "+N" overflow, empty state, count badge.
  - `RoomSheet.test.tsx` — renders summary header + grouped categories; handles `room === null`.
  - `DeviceChip.test.tsx` — on/off styling, dot rendering, no click handler.
  - `DeviceCard.test.tsx` — header + body composition, tone tinting on/off.
  - `DevicePrimaryControl.test.tsx` — 5 dispatch branches (sonos play/pause, camera/sensor pill, light/plug toggle, thermo/valve toggle, stove/tv/shade placeholder).
  - `bodies/{Stove,Thermo,Light,Plug,Sonos,Tv,Shade,Camera,Sensor}Body.test.tsx` — one spec per body, asserts visual elements + wired commands fire (mocked hooks).
  - `primitives/{StatChip,DualTempReadout,SliderRow,ControlRow,MiniButton}.test.tsx` — small visual-prop specs.
  - `lib/getDevicesForRoom.test.ts` — pure-function fixtures for each room name + each device kind, including ROOM_ALIASES coverage and unmatched-room drop.
- **D-64:** **Playwright spec** — new file `tests/playwright/rooms-tab.spec.ts`. Reuses the Phase 51/97/177/178 setup pattern (real Auth0, session caching, `collectConsoleErrors`, VersionEnforcer dismissal). Test scenarios:
  - "ROOMS-01 data-driven layout" — open `/stanze`, assert 6 RoomCard headings render with `N/M attivi` counts > 0 (mocked hooks return non-empty data).
  - "ROOMS-02 chip grid + overflow" — assert one RoomCard renders ≤6 chips visible + "+N" overflow when fixture has 7+ devices.
  - "ROOMS-03 sheet opens" — click first RoomCard, assert RoomSheet opens with summary header + at least one category section.
  - "ROOMS-04 expanded device cards" — assert sheet contains at least one `<DeviceCard>` with header + body (e.g. Stove with stat chips).
  - "ROOMS-05 type-specific bodies" — open Soggiorno (likely contains stove + sonos + tv), assert each body's distinguishing element renders (Power button + Play/Pause + HDMI buttons).
  - Zero console errors per scenario.
- **D-65:** [informational] Reuse the **Phase 177 dashboard-glass-cards.spec.ts auth/setup helpers** by extracting them to `tests/playwright/_helpers/auth.ts` if not already extracted. If they're inline, leave inline and duplicate for now (cleanup phase). Plan agent decides based on current state.

### React Compiler discipline (Phase 71 / 95 / 178 D-33)
- **D-66:** [informational] **RESEARCH-OVERRIDE:** grep gate per Pitfall 11 (npx react-compiler-healthcheck command does not exist; Plan 08 substitutes the grep gate). **No `useMemo` / `useCallback`** anywhere in `rooms/`. Pure-function components only. The plan must include a `npx react-compiler-healthcheck` step in `<verify><automated>` (mirror Phase 177 D-28 / Phase 178 D-33).
- **D-67:** [informational] Inline event handler functions (`onClick={() => handlePause(g.id)}`) explicitly allowed. Do NOT extract to `useCallback`.

### Index / barrel exports
- **D-68:** `app/components/EmberGlass/rooms/index.ts` exports:
  - `RoomsTab` (default export from RoomsTab.tsx)
  - `RoomCard`, `RoomSheet`, `DeviceCard`, `DeviceChip`, `DevicePrimaryControl`, `DeviceBody` (named)
  - All bodies (`StoveBody`, `ThermoBody`, `ValveBody`, `LightBody`, `PlugBody`, `SonosBody`, `TvBody`, `ShadeBody`, `CameraBody`, `SensorBody`)
  - All primitives (`StatChip`, `DualTempReadout`, `SliderRow`, `ControlRow`, `MiniButton`)
  - Lib (`getDevicesForRoom`, `ROOMS`, `ROOM_ALIASES`, `EXTRA_DEVICES`, `CATEGORY_ORDER`, `CATEGORY_LABEL`)
  - Types (`RoomDevice`, `RoomConfig`, `DeviceKind`, `AggregatorState`)
- **D-69:** `app/components/EmberGlass/index.ts` adds `export * from './rooms';` after the Phase 178 sheets export.

### Folded Todos
None — `gsd-sdk query todo.match-phase 179` returned 0 matches at context-gathering time. Plan agent re-runs for a final check before planning.

### Claude's Discretion
- **Whether `<DeviceCard>` wraps in `<Pressable as="div">` with no `onClick` or skips Pressable entirely.** Recommend the wrap (strict reading of Phase 175 SC-#1) to avoid SC-#1 audit failures.
- **Whether `<MiniButton>` wraps in `<Pressable as="button">`.** Recommend NO — bundle uses bare `<button>` with browser `:active`. SC-#1 targets glass surfaces; MiniButton is a tone-tinted chip not a glass surface.
- **Whether `<SliderRow>` is interactive (tap-to-seek) or pure presentational.** Recommend interactive — Sonos volume + brightness need it; other bodies (TV/sensor) keep `disabled={true}`. Single primitive, two consumers.
- **Whether `<ThermoBody>` and `<ValveBody>` share a single file or split into two.** Recommend share — same body shape, single discriminator inside (`kind === 'valve' ? 'Termovalvola' : 'Termostato'`); keeps the file count down. Bundle `rooms.jsx:374-387` is one body.
- **Whether the page mounts at `/stanze` or `/rooms-tab`.** Recommend `/stanze` (Italian, matches NAV-02 label). The legacy `/rooms` admin-CRUD page stays at `/rooms` untouched.
- **Whether to centralize commands hooks at RoomsTab orchestrator and pass via context.** Recommend NO (per-body imports per D-39) — matches Phase 178 self-fetch pattern, keeps orchestrator < 100 LOC.
- **Whether `<StatChip>` accepts a `tone` prop.** Recommend YES (API symmetry with `<DualTempReadout>`); plan agent may drop if YAGNI.
- **Whether the brightness slider in `<LightBody>` commits per-light or per-group.** Recommend per-group via `handleBrightnessChange` (existing API). Per-light brightness needs a new endpoint (deferred).
- **Whether `<RoomCard>` shows the active-count badge as `accent`-colored on `> 0` or always `room.tone`.** Recommend `room.tone` (matches bundle `rooms.jsx:166-167`).
- **Whether to drop the unmatched-room `console.warn`** to avoid log spam in production. Recommend keep with `process.env.NODE_ENV === 'development'` gate (memory: dev-only diagnostics pattern).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §ROOMS-01..05 — Five locked acceptance criteria for this phase.
- `.planning/ROADMAP.md` §"Phase 179: Rooms Tab Redesign" — Goal + 5 SC. SC-#1 (data-driven aggregation), SC-#2 (RoomCard chip-grid), SC-#3 (RoomSheet summary header + sections), SC-#4 (expanded DeviceCard per device), SC-#5 (10 type-specific body shapes).
- `.planning/ROADMAP.md` §"Phase 181: Glass Bottom Tab Bar" — confirms downstream Phase 181 wires `/stanze` into the glass bottom tab bar (NAV-02). Phase 179 ships the route; Phase 181 wires the nav.
- `.planning/ROADMAP.md` §"Phase 182: Design System Reference Page v2" — confirms downstream Phase 182 catalogs the new primitives.

### Source Design Bundle (PRIMARY visual + behavior source)
- `.planning/inbox/ember-glass-design/project/components/rooms.jsx` lines 1-606 — **Authoritative** source for `RoomsTab`, `RoomCard`, `DeviceChip`, `RoomSheet`, `DeviceCard`, `DevicePrimaryControl`, `DeviceBody` per-kind blocks, plus shared primitives `StatChip`, `DualTempReadout`, `SliderRow`, `ControlRow`, `MiniButton`. Constants (px values, gradients, transitions, copy, ROOMS list, ROOM_ALIASES, EXTRA_DEVICES, ICON_FOR, CATEGORY_ORDER, CATEGORY_LABEL) lifted verbatim. When this bundle disagrees with the HTML doc, bundle wins (Phase 176/177/178 precedent).
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` — Phase 177 reference; needed for `<GlassCard>`, `<CardHead>`, `<InlineToggle>` reuse in RoomCard.
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx` — Phase 178 reference; needed for `<Sheet>` API parity (RoomSheet wraps Sheet primitive).
- `.planning/inbox/ember-glass-design/project/components/icons.jsx` — bundle's lucide-equivalent icon shapes; Phase 179 swaps to actual lucide-react components per ICON_FOR map (D-08).
- `.planning/inbox/ember-glass-design/project/components/app.jsx` lines 144-146 — bundle's tab dispatch (`tab === 'rooms' && <RoomsTab state={state} />`). Phase 179 mounts RoomsTab at the `/stanze` route instead of an in-app tab pane (Phase 181 ships the tab bar).
- `.planning/inbox/ember-glass-design/project/Design System.html` — Visual reference; Phase 179 primitives are not yet registered in `/debug/design-system-v2` (Phase 182 handles that).

### Prior Phase Decisions
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-07..D-13 — `<Sheet>` API (`{ open, onClose, title }`), z-index 200/201, scroll-lock + restore. RoomSheet wraps this primitive unmodified.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-14 — Sheet tap-to-dismiss only; no swipe/long-press in v20.0. RoomSheet inherits.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-15 — No reduced-motion overrides in v20.0. RoomsTab inherits.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-17 — VersionEnforcer overlay is the known Playwright blocker. Phase 179 spec dismisses it via the Phase 177/178 helper.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-UI-SPEC.md` SC-#1 — every NEW glass surface in Phases 177-181 reuses `<Pressable>`. RoomCard + DeviceCard wrap (D-61).
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-01, D-02 — `app/components/EmberGlass/cards/` namespace + inline-style + `var(--token)` convention. Phase 179 mirrors with `rooms/`.
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-12 — per-card `useState<boolean>` for sheet open. Phase 179 promotes to `selectedRoomName: string | null` because there is one shared sheet for 6 rooms.
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-14 — Italian title-per-card. RoomSheet title is the room name (matches bundle `rooms.jsx:233`).
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` D-28 — `npx react-compiler-healthcheck` is mandatory in `<verify><automated>`.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` D-01 — `app/components/EmberGlass/sheets/` namespace pattern. Phase 179 mirrors with `rooms/`.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` D-04 — body-only sheet components consumed via `<Sheet><Body /></Sheet>` wrapper. RoomSheet diverges (it owns the Sheet wrapper internally because there is one sheet for 6 rooms — see D-21).
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` D-09 — `useThermostatCommands.setRoomMode` semantics (off/on/manual mapping). Phase 179 reuses without modification.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` D-16 — `useThermostatCommands` API (`setRoomSetpoint`, `setHomeMode`, `setRoomMode`). Phase 179 reuses for ThermoBody / ValveBody.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` D-26..D-28 — first-load skeleton, error/unreachable, optimistic UI patterns. Phase 179 mirrors.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` Deferred "PlugsSheet per-row room subtitle" — confirms Tuya plugs lack `room` field. Phase 179 hardcodes "Cucina" for now.
- `.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md` D-03 — `<FlameViz>` lives in `EmberGlass/`. Reused by `<StoveBody>` (D-27 — bundle stove body in rooms tab does not show FlameViz; we keep it minimal per bundle).
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` D-12 — Inline-style + `var(--token)` convention.

### Existing Codebase Touchpoints
- `app/components/EmberGlass/Sheet.tsx` — Phase 175 primitive; consumed unmodified by RoomSheet.
- `app/components/EmberGlass/Pressable.tsx` — Phase 175 primitive; wraps RoomCard + DeviceCard.
- `app/components/EmberGlass/GlassCard.tsx` — Phase 177 primitive; RoomCard composes it.
- `app/components/EmberGlass/CardHead.tsx` — Phase 177 primitive; RoomCard header.
- `app/components/EmberGlass/InlineToggle.tsx` — Phase 177 primitive; reused in DevicePrimaryControl (light/plug/thermo/valve toggles).
- `app/components/EmberGlass/GlassCardSkeleton.tsx` — Phase 177 skeleton; reused for first-load (D-45).
- `app/components/EmberGlass/index.ts` — barrel; gets `export * from './rooms';` appended (D-69).
- `app/components/EmberGlass/sheets/` — Phase 178 sub-primitives; **NOT reused** in rooms tab (different shapes — see Out of Scope and D-36 explanation).
- `app/components/devices/stove/hooks/useStoveData.ts` + `useStoveCommands.ts` — read by RoomsTab + StoveBody.
- `app/components/devices/thermostat/hooks/useThermostatData.ts` + `useThermostatCommands.ts` — read by RoomsTab + ThermoBody/ValveBody + DevicePrimaryControl (toggle).
- `app/components/devices/lights/hooks/useLightsData.ts` + `useLightsCommands.ts` — read by RoomsTab + LightBody + DevicePrimaryControl (toggle).
- `app/components/devices/sonos/hooks/useSonosFullData.ts` + `useSonosCommands.ts` — read by RoomsTab + SonosBody + DevicePrimaryControl (play/pause).
- `app/components/devices/tuya/hooks/useTuyaData.ts` + `useTuyaCommands.ts` — read by RoomsTab + DevicePrimaryControl (toggle).
- `types/hueProxy.ts` — `HueLight.room_name` field used by aggregator D-13.
- `types/tuyaProxy.ts` — `TuyaPlug` confirms no `room` field (Phase 179 hardcodes "Cucina").
- `types/netatmoProxy.ts` — Netatmo room model used by aggregator D-12.
- `app/page.tsx` — Phase 177 dashboard root; reference for the Auth0/session pattern that `app/stanze/page.tsx` mirrors.
- `app/rooms/page.tsx` — v15.0 settings-CRUD page; **UNTOUCHED** by Phase 179. Different concept.
- `lib/hooks/useRetryableCommand.ts` — Phase 7.0 retry infrastructure; transitively consumed via existing commands hooks (no direct import in Phase 179 code).
- `app/hooks/useDebounce.ts` — used inline in ThermoBody (setpoint 500ms), LightBody (brightness 250ms), SonosBody (volume 250ms).
- `tests/playwright/dashboard-glass-cards.spec.ts` — Phase 177/178 spec; reference for Auth0 + collectConsoleErrors helpers. Phase 179 ships a sibling file `tests/playwright/rooms-tab.spec.ts`.
- `package.json` — `lucide-react`, `@radix-ui/react-dialog` already deps. No installs required.

### Patterns
- Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 / Phase 178 D-02 — Inline-style + `var(--token)`.
- Phase 7.0 retry infrastructure — `useRetryableCommand` wraps fetch with retry + idempotency.
- Phase 96 — `useAdaptivePolling(60s)` rhythm for device hooks; RoomsTab does not change polling cadence.
- Phase 17.0 — WS-primary + 60s polling fallback; RoomsTab inherits via the existing hooks.
- Phase 51 + 97 — Playwright `collectConsoleErrors` helper + real-Auth0 + session-caching.
- Phase 71 / 95 — React Compiler 1.0 auto-memo; no manual `useMemo`/`useCallback`.
- Phase 16.0 — 250ms volume debounce + 500ms setpoint debounce.
- Phase 117 — dead-export discipline; new exports must be consumed within one phase or deleted.
- Phase 175 SC-#1 — every NEW glass surface in Phases 177-181 reuses `<Pressable>`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 175 `<Sheet>` primitive** — fully production-ready. RoomSheet wraps it without modification.
- **Phase 175 `<Pressable>` primitive** — wraps `<GlassCard>` for RoomCard tap-to-open + (strictly) wraps `<DeviceCard>` glass surface.
- **Phase 177 `<GlassCard>` + `<CardHead>` + `<InlineToggle>` + `<GlassCardSkeleton>`** — reused verbatim in RoomCard / DevicePrimaryControl / first-load skeleton.
- **All required device data hooks already exist** (`useStoveData`, `useThermostatData`, `useLightsData`, `useTuyaData`, `useSonosFullData`) — each polling at 60s + WS-subscribed.
- **All required command hooks already exist** — `useStoveCommands`, `useThermostatCommands` (Phase 178), `useLightsCommands`, `useSonosCommands`, `useTuyaCommands`. Phase 179 adds **zero** new commands hooks.
- **`useDebounce` hook** at `app/hooks/useDebounce.ts` — reused by ThermoBody (500ms), LightBody (250ms), SonosBody (250ms).
- **lucide-react icons** — already a dep. New icons used: `<Home>`, `<Moon>`, `<Droplets>`, `<Flame>`, `<Thermometer>`, `<Lightbulb>`, `<Plug>`, `<Music>`, `<Tv>`, `<Video>`, `<Blinds>`, `<Minus>`, `<Plus>`, `<Power>`, `<Volume2>`, `<SkipBack>`, `<SkipForward>`, `<Play>`, `<Pause>`, `<ChevronUp>`, `<ChevronDown>`, `<ChevronRight>`. Most are already imported elsewhere.

### Established Patterns
- **`'use client'` for state-bearing components** — RoomsTab, RoomCard, RoomSheet, DeviceCard, all bodies, all primitives that bind events.
- **Inline `style` + `var(--token)` for EmberGlass v2 surfaces** — Phase 174/175/176/177/178 precedent. All `rooms/` files follow.
- **Tests colocated** — Jest specs in `app/components/EmberGlass/rooms/__tests__/`, Playwright in `tests/playwright/rooms-tab.spec.ts`.
- **No `useMemo`/`useCallback`** — Phase 71/95 / 178 D-33 React Compiler discipline.
- **Optimistic UI for toggles + sliders** — pattern from existing LightsCard/ThermostatCard. Toggle/slider commits immediately, retry infrastructure handles transient failures, next data tick reverts on persistent failure.
- **Per-component `data-testid`** — Phase 176/177/178 precedent. Apply per RoomCard / DeviceChip / DeviceCard / each body / each primitive (`stanze-room-soggiorno`, `stanze-room-soggiorno-chip-1`, `stanze-sheet-soggiorno`, `stanze-stove-power-button`, etc.).
- **Italian copy frozen at decision time** — bundle copy is the source of truth; no paraphrasing.
- **Aggregator is pure / non-memoized** — React Compiler 1.0 handles auto-memoization for the orchestrator's render.

### Integration Points
- `app/components/EmberGlass/index.ts` — append `export * from './rooms';` after Phase 178 sheets export.
- `app/components/EmberGlass/rooms/` — all new files for this phase.
- `app/stanze/page.tsx` — new Next.js route mounting `<RoomsTab />`.
- `tests/playwright/rooms-tab.spec.ts` — new spec file (do NOT add to dashboard-glass-cards.spec.ts).
- `app/components/EmberGlass/rooms/__tests__/*.test.tsx` — new Jest specs.
- No edits to: `DashboardCards.tsx`, `app/page.tsx`, `app/loading.tsx`, `app/layout.tsx`, any device hook (data or commands), any API route, the legacy big device cards, the legacy detail pages, the legacy `/rooms` settings-CRUD page, any sheet from Phase 178, any card from Phase 177.

</code_context>

<specifics>
## Specific Ideas

- **Bundle is the source of truth.** Every pixel value, every gradient, every transition curve, every Italian phrase, every ROOMS / ROOM_ALIASES / EXTRA_DEVICES entry in `rooms.jsx` is lifted verbatim. When in doubt, open the bundle and copy.
- **One sheet for six rooms** — RoomsTab owns `selectedRoomName: string | null` and renders one `<RoomSheet>` whose `room` and `devices` props change as the user taps different RoomCards. The `<Sheet>` primitive's `key={selectedRoomName}` ensures clean unmount/mount on room change (animations restart correctly).
- **Italian copy:** see D-48..D-60. Use middle-dot `·` (U+00B7), unicode minus `−` (U+2212), arrows `↑ ↓` (U+2191/U+2193), and ellipsis `…` (U+2026) as needed.
- **Three debounce values:** 500ms for ThermoBody setpoint, 250ms for LightBody brightness, 250ms for SonosBody volume.
- **`<RoomSheet>` shape diverges from Phase 178 sheets** — RoomSheet owns the `<Sheet>` wrapper internally (because RoomsTab manages the state for one shared sheet). Phase 178 sheet bodies were prop-less and consumed via `<Sheet><Body /></Sheet>`. Document this divergence in `<RoomSheet>` JSDoc.
- **`<DeviceCard>` Pressable wrap** — wrap with `<Pressable as="div">` (no `onClick`) per strict reading of Phase 175 SC-#1 to pass the audit. Plan agent honors this even though there is no card-level click action.
- **Tuya "Cucina" hardcode** — Document loudly in `getDevicesForRoom` JSDoc. A future phase ships `useDeviceRegistry()` to join `/api/v1/registry/devices` with `/api/v1/rooms`; this hardcode goes away then.
- **Color-temp slider rendered but disabled** — keeps visual fidelity with bundle without a backing endpoint. JSDoc on `<LightBody>` documents the limitation.
- **TV / shade / camera bodies are no-op interactive** — visual buttons render correctly but `onClick` is a noop function. JSDoc documents this. Mock state from `EXTRA_DEVICES` doesn't change.
- **Aggregator `console.warn` for unmatched rooms** is dev-only (`process.env.NODE_ENV === 'development'`).
- **Sheet `maxHeight: 85%` cap** is honored by RoomSheet content; the body itself does not need to set a height. Largest room (Soggiorno with 5+ devices including stove + sonos + thermo + light + plug + tv + shade) is ~720px tall content; the cap forces scrolling on small viewports.
- **`<Sheet>` close animation completion** — RoomCard onOpen / RoomSheet onClose flips `selectedRoomName` immediately; the Phase 175 Sheet primitive handles the 400ms cubic-bezier exit animation. No additional sequencing needed.
- **`<RoomCard>` `onClick` propagation** — clicks on `<DeviceChip>` (which is non-interactive) bubble up to RoomCard naturally. No `e.stopPropagation()` needed.
- **`/stanze` route auth pattern** — match `app/page.tsx` exactly: `'use client'` + `<RoomsTab />`. If `app/page.tsx` uses an Auth0 wrapper at the layout level, `/stanze` inherits it via `app/layout.tsx`. Plan agent verifies.
- **No new API routes, no new device providers, no new WS topics.** Phase 179 is purely presentational + a new client-side aggregator + 14 new components + new route.
- **`<RoomCard>` count badge color** uses `room.tone` per bundle, NOT `var(--accent)`. Each room's badge is a different color when active.

</specifics>

<deferred>
## Deferred Ideas

- **Real Tuya plug → room registry join.** Phase 179 hardcodes "Cucina"; future phase ships `useDeviceRegistry()` joining `/api/v1/registry/devices` with `/api/v1/rooms` to expose `device_id → room_name`. RoomsTab aggregator drops the static fallback then. Tracked also in Phase 178 deferred-items.
- **Real per-light brightness** — `useLightsCommands.handleBrightnessChange` is per-group; per-light needs a new endpoint. LightBody slider commits per-group for now (visual approximation). Future phase ships per-light command + endpoint.
- **Color-temp slider wiring** — no Hue color-temp endpoint in `useLightsCommands`. LightBody slider renders disabled. Future phase ships `handleColorTempChange(lightId, K)`.
- **Real shade / blind device proxy** — no shade proxy exists. ShadeBody is no-op. Future phase ships shade proxy + commands.
- **Real TV / HDMI source proxy** — no TV proxy exists. TvBody is no-op. Future phase ships TV proxy + commands (likely via Sonos beam or HDMI-CEC bridge).
- **Real humidity sensor proxy** — no sensor proxy in current providers. SensorBody renders static EXTRA_DEVICES entry. Future phase ships humidity-sensor proxy.
- **Real entrance camera stream** — no camera-stream proxy in current providers (only Netatmo Welcome via Phase 77). CameraBody renders static EXTRA_DEVICES preview with no live HLS. Future phase ships HLS preview wiring.
- **Real DIRIGERA contact/motion sensors** — Dirigera proxy exists but is not currently wired into rooms. Future phase joins Dirigera sensors into the SensorBody flow + ROOM_ALIASES.
- **Replace v15.0 `/rooms` settings-CRUD with `/registry/rooms`** — cleanup phase moves the admin page to a settings sub-route once the new `/stanze` Rooms tab is the canonical "rooms" surface.
- **Wiring `/stanze` into the glass bottom tab bar** — Phase 181.
- **Catalog new primitives in `/debug/design-system-v2`** — Phase 182.
- **Aggregator memoization** — Phase 71 React Compiler handles it; if perf profiling shows a hotspot, a polish phase introduces explicit memoization.
- **Long-press / swipe-to-dismiss on RoomSheet** — Phase 175 D-14 locked tap-only; honored.
- **Reduced-motion overrides** — Phase 175 D-15 deferred them across v20.0.
- **Real-time WS push for mock EXTRA_DEVICES** — they're static; no live state. Phase that ships real proxies will re-key them through hooks.
- **Per-light scene activation from RoomSheet** — RoomSheet does not expose scene UI in v20.0. Scene activation lives in LightsSheet (Phase 178). A polish phase could add quick-scene chips to the Soggiorno RoomSheet.
- **Pull-to-refresh on RoomsTab** — not in v20.0 scope. The 60s adaptive polling is sufficient.
- **Stove "Temperatura obiettivo" slider in StoveBody** — same deferral as Phase 178 D-05 (no Thermorossi setpoint endpoint).
- **`<BigSlider>` primitive** (bundle `sheets.jsx:476-497`) — Phase 178 deferred to Phase 179; Phase 179 does not consume it (the small `<SliderRow>` is sufficient for the rooms-tab body sliders). Defer further to whoever first needs a 72px-tall full-width slider.
- **Aggregator → real rooms-registry source of truth** — current `ROOMS` is static. A future phase reads from `/api/rooms` (v15.0) and replaces the static list. Enables user-defined rooms beyond the 6 hardcoded.

### Reviewed Todos (not folded)
None — no todos matched at context-gathering time.

</deferred>

---

*Phase: 179-rooms-tab-redesign*
*Context gathered: 2026-04-29*
