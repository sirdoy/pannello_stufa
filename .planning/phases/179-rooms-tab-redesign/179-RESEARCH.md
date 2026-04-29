# Phase 179: Rooms Tab Redesign - Research

**Researched:** 2026-04-29
**Domain:** Next.js 15.5 PWA + Ember Glass v2 (React 19 / RC1 / Radix Dialog / lucide-react / inline-style design tokens)
**Confidence:** HIGH

## Summary

Phase 179 ships a fully data-driven Rooms tab at `/stanze`: 6 `<RoomCard>` chip-grid cards + one shared `<RoomSheet>` whose body switches per selected room and renders an expanded `<DeviceCard>` per device with one of 10 type-specific bodies. Every visual, every gradient, every Italian copy string is a verbatim lift from `.planning/inbox/ember-glass-design/project/components/rooms.jsx` (lines 1–606). All wiring reuses **existing** v17.0 hooks and Phase 175/177/178 primitives — Phase 179 introduces zero new commands hooks, zero new API routes, zero new tokens, zero new icons.

The single non-trivial unknown going into research was whether the bundle's idealized `state.*` shape (which is a synthetic test-fixture in the bundle, not a real hook contract) would line up with the real hook return shapes. **It does not.** Field-name reconciliation is required and is documented in §Aggregator Reconciliation below — this is the planner's #1 must-have. Six other smaller pitfalls are documented (home_id threading, light brightness percent conversion, Tuya `id`/`device_id` mismatch, Sonos coordinator field name, thermostat valve discriminator string, lucide `Volume2` is real but file is `volume-2.js`).

**Primary recommendation:** Wave 0 establishes types + `getDevicesForRoom` aggregator (with reconciled field reads, fixture-tested). Wave 1 ships the 5 primitives + DeviceChip + RoomCard. Wave 2 ships 10 bodies + DeviceCard + DevicePrimaryControl + DeviceBody dispatcher in parallel. Wave 3 ships RoomSheet + RoomsTab orchestrator + `app/stanze/page.tsx` + Playwright spec. The aggregator + 10 bodies are pure-functional + isolated, so Wave 2 parallelism is high.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**File layout & namespace (D-01..D-04)** — all new files under `app/components/EmberGlass/rooms/`; inline-style + `var(--token)` mandatory (no Tailwind for visuals); RoomsTab is `'use client'`; new route `/stanze` (Italian, NOT `/rooms` — that v15.0 admin-CRUD page stays untouched).

**Static room config (D-05..D-09)** — verbatim 6-room ROOMS list with tones (Soggiorno=accent, Cucina=#f5c84a, Camera=#b080ff, Studio=#5eafff, Bagno=#6aa86a, Ingresso=#ffb84a); `ROOM_ALIASES` map normalizes upstream room strings; `EXTRA_DEVICES` mocks TV/blinds/humidity/camera; `ICON_FOR` maps DeviceKind → lucide-react icons; `CATEGORY_ORDER` 10-item tuple; `CATEGORY_LABEL` Italian frozen.

**Aggregator (D-10..D-17)** — `getDevicesForRoom(state, roomName): RoomDevice[]` is pure-synchronous; `AggregatorState` interface from D-10 is the planner's contract; stove → Soggiorno hardcoded; thermostat zones → `ROOM_ALIASES[zone.name]` with `kind: 'thermo' | 'valve'`; lights → `ROOM_ALIASES[light.room_name]` (drop unmapped/null); plugs → static "Cucina" (no registry join yet); sonos → `ROOM_ALIASES[group.name]`; EXTRA_DEVICES appended; CATEGORY_ORDER drives section order.

**RoomCard (D-18..D-19)** — `<GlassCard>` + `<CardHead>` composition, 3-col chip grid, +N overflow, "Nessun dispositivo" empty state, count badge in `room.tone` when `activeCount > 0`. RoomCard wraps in `<Pressable as={GlassCard} onClick={onOpen}>` per Phase 175 SC-#1 (GlassCard already supports `onOpen`).

**DeviceChip (D-20)** — 1:1 aspect ratio, 10px radius, color-mix tone tinting on/off, 5×5 dot top:3 right:3 when on. Non-clickable (taps bubble to RoomCard).

**RoomSheet (D-21..D-22)** — wraps `<Sheet open onClose title>` internally (diverges from Phase 178 prop-less body convention). Props `{ open, onClose, room, devices }`. Summary header (42×42 icon tile + count + categories) + per-category sections.

**DeviceCard (D-23..D-24)** — 16px-radius tone-tinted container; header row (40×40 icon + name + status + DevicePrimaryControl) + DeviceBody. Per Claude's Discretion recommendation, wrap in `<Pressable as="div">` (no onClick) per strict reading of SC-#1.

**DevicePrimaryControl (D-25)** — 5 dispatch branches: sonos (40×40 round play/pause), camera/sensor (LIVE/OK pill), light/plug/thermo/valve (`<InlineToggle>`), stove/tv/shade (empty 40px placeholder).

**DeviceBody dispatcher (D-26..D-35)** — switch on `device.kind`. 10 type-specific bodies with bundle-verbatim shape; wired commands listed per body in CONTEXT.

**Primitives (D-36..D-37)** — 5 new primitives under `rooms/primitives/`: StatChip, DualTempReadout, SliderRow (interactive when `onChange` provided, read-only otherwise), ControlRow, MiniButton. Pure presentational; no useMemo/useCallback.

**Commands (D-38..D-40)** — reuse `useStoveCommands`, `useThermostatCommands`, `useLightsCommands`, `useSonosCommands`, `useTuyaCommands`. Per-body imports (NOT centralized at orchestrator). Optimistic UI inherited from existing `useRetryableCommand`.

**RoomsTab (D-41..D-44)** — owns `selectedRoomName: string | null` state; reads all 5 device hooks; builds `AggregatorState` literal; renders 6 RoomCards + 1 RoomSheet. 70px-top safe-area for Phase 181 nav.

**Loading/error/empty (D-45..D-47)** — first-load skeleton via reused `<GlassCardSkeleton>`; error bar "Non raggiungibile. Riprova più tardi." with retry; per-room empty state "Nessun dispositivo".

**Italian copy (D-48..D-60)** — every string frozen verbatim. Use `·` (U+00B7), `−` (U+2212), `↑↓` (U+2191/2193), `…` (U+2026).

**Press behavior (D-61..D-62)** — RoomCard wraps Pressable (interactive); DeviceCard wraps Pressable as="div" (strict SC-#1); MiniButton/SliderRow/DeviceChip stay as bare elements (NOT glass surfaces).

**Tests (D-63..D-65)** — Jest unit specs colocated under `rooms/__tests__/` (one per non-trivial component); new Playwright spec `tests/smoke/rooms-tab.spec.ts` (note: `tests/smoke/` is the actual smoke directory in this repo; CONTEXT references `tests/playwright/rooms-tab.spec.ts` — see §Playwright Path Reconciliation below). 5 ROOMS-* scenarios. Reuse Phase 51/97/177/178 helpers (`collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`).

**React Compiler (D-66..D-67)** — no useMemo/useCallback in `rooms/`. Inline event handlers explicitly allowed. CONTEXT mandates `npx react-compiler-healthcheck` in verify automation; this CLI is **NOT installed** in the project — Phase 177's substitution (grep-based check) is the established fallback. See §Pitfall 11 + §Validation Architecture.

**Index/barrel (D-68..D-69)** — `rooms/index.ts` exports everything; `EmberGlass/index.ts` appends `export * from './rooms';`.

### Claude's Discretion

- **`<DeviceCard>` Pressable wrap** — recommend `<Pressable as="div">` no onClick (strict SC-#1). HIGH confidence.
- **`<MiniButton>` Pressable wrap** — recommend NO (bundle uses bare button; not a glass surface). HIGH confidence.
- **`<SliderRow>` interactive vs read-only** — recommend interactive (Sonos volume + brightness need it; TV/sensor pass `disabled={true}`). HIGH confidence.
- **ThermoBody / ValveBody share single file** — recommend share (single file `ThermoBody.tsx` exporting both, `kind === 'valve' ? 'Termovalvola' : 'Termostato'` discriminator). HIGH confidence.
- **`/stanze` route** — recommend Italian path. HIGH confidence (collision risk with `/rooms` is real and documented).
- **Per-body command-hook imports** — recommend per-body (NOT context). HIGH confidence (parallels Phase 178 D-04 self-fetch).
- **`<StatChip>` `tone` prop** — recommend keep (API symmetry); plan agent may YAGNI. MEDIUM confidence.
- **LightBody brightness per-group** — recommend per-group (only available API). HIGH confidence.
- **RoomCard count badge color** — recommend `room.tone` per bundle. HIGH confidence.
- **Unmatched-room `console.warn`** — recommend `process.env.NODE_ENV === 'development'` gate. HIGH confidence.

### Deferred Ideas (OUT OF SCOPE)

- Real Tuya plug → room registry join (hardcoded "Cucina" until `useDeviceRegistry()` ships).
- Real per-light brightness (per-group fallback).
- Color-temp slider wiring (rendered disabled).
- Real shade / TV / humidity sensor / entrance camera proxies (no-op interactive).
- DIRIGERA contact/motion sensors (not joined).
- Replacing v15.0 `/rooms` admin-CRUD (cleanup phase).
- Glass bottom tab bar wiring (Phase 181).
- `/debug/design-system-v2` catalog (Phase 182).
- Aggregator memoization, long-press / swipe, reduced-motion overrides, real-time WS for mock EXTRA_DEVICES, scene strip in RoomSheet, pull-to-refresh, stove setpoint slider, `<BigSlider>` primitive, dynamic rooms registry source.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **ROOMS-01** | Rooms tab fully data-driven from `state.thermostat.zones / lights / plugs / sonos.groups / stove` + EXTRA_DEVICES mock layer | §Aggregator Reconciliation maps each RT-hook to canonical RoomDevice fields. CONTEXT D-10..D-17 lock the aggregator contract. EXTRA_DEVICES copied from bundle `rooms.jsx:32-49`. |
| **ROOMS-02** | RoomCard header + 3×2 chip grid + category colors + "+N" overflow | Bundle `rooms.jsx:158-189` + CONTEXT D-18..D-20. Category colors per `device.tone` via aggregator (stove `var(--accent)`, light `#f5c84a`, thermo/valve `#5eafff`, plug `#ffb84a`, sonos `#b080ff`, tv `#5eafff`, camera `#6aa86a`, shade `#b0b0b0`, sensor `#9a9a9a`). |
| **ROOMS-03** | Tap RoomCard → RoomSheet with summary + per-category sections | Bundle `rooms.jsx:217-273` + CONTEXT D-21. RoomSheet uses Phase 175 `<Sheet>` primitive (already production-ready). `key={selectedRoomName}` on Sheet for clean unmount on switch. |
| **ROOMS-04** | RoomSheet contains expanded DeviceCards (header + body, NOT flat list) | Bundle `rooms.jsx:275-317` + CONTEXT D-23. Each DeviceCard: 40×40 icon tile + name + "Attivo · {value}" status + DevicePrimaryControl right slot + DeviceBody. |
| **ROOMS-05** | 10 type-specific bodies match spec | Bundle `rooms.jsx:355-509` + CONTEXT D-26..D-35. Each body wires to existing commands hook where API exists; no-op for stub kinds (TV/shade/camera). |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Static room config | Browser/Client (build-time) | — | Frozen in `rooms-config.ts`; no API calls. |
| Per-room device aggregation | Browser/Client (RoomsTab orchestrator) | — | Pure projection over hook outputs. No server work. |
| Device data fetching | API/Backend (existing proxies) → Browser (hooks) | WebSocket primary | Already in place from v17.0 — Phase 179 only consumes. |
| Device commands | API/Backend (existing proxies) → Browser (commands hooks) | — | Reuses `useStoveCommands`/`useThermostatCommands`/`useLightsCommands`/`useSonosCommands`/`useTuyaCommands`. |
| Auth gating | Layout-level (existing ClientProviders → Auth0 wrapper) | — | `app/layout.tsx` already wraps all child pages. New `/stanze` page inherits auth automatically; mirrors Phase 177 dashboard `app/page.tsx` shape. |
| Rendering / visual surface | Browser/Client (inline-style + var(--token)) | — | Phase 174 token system; no Tailwind for visual values. |
| Press feedback | Browser/Client (Pressable Phase 175) | — | RoomCard + DeviceCard reuse `<Pressable>`. SC-#1 enforced. |
| Sheet modal | Browser/Client (Sheet Phase 175 / Radix Dialog) | — | RoomSheet wraps `<Sheet>` unmodified. |
| Test execution | Jest (unit) + Playwright (smoke) | — | Existing infra; no new test framework. |

## Standard Stack

### Core (verified — already in `package.json`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `15.5.x` (project) | App Router framework | Locked across all phases. `[VERIFIED: package.json + CLAUDE.md v17.0]` |
| `react` / `react-dom` | `^19.x` | UI runtime | React Compiler 1.0 enabled (`reactCompiler: true` in next.config.ts:19). `[VERIFIED: next.config.ts]` |
| `lucide-react` | `^0.562.0` | Icon library | All 23 Phase 179 icons exist in this version (verified by direct `node_modules/lucide-react/dist/esm/icons/*.js` filename inspection). `[VERIFIED: filesystem grep]` |
| `@radix-ui/react-dialog` | `^1.1.14` | Sheet primitive backbone | Phase 175 `<Sheet>` wraps it. `[VERIFIED: package.json]` |
| `@radix-ui/react-visually-hidden` | (transitive) | Sheet accessibility fallback | Phase 175 uses for VisuallyHidden Title. `[VERIFIED: Sheet.tsx import]` |
| `@auth0/nextjs-auth0` | `^4.x` | Auth gating | Wraps via `ClientProviders` in layout — page-level auth automatic. `[VERIFIED: app/layout.tsx]` |

### Supporting (verified — already used by Phase 178)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | (project) | E2E + smoke tests | Existing `tests/smoke/dashboard-glass-cards.spec.ts` extends similarly. `[VERIFIED: tests/smoke/]` |
| `jest` + `@testing-library/react` | (project) | Unit specs | Existing colocated `__tests__/` pattern. `[VERIFIED: cards/sheets/__tests__/]` |
| `babel-plugin-react-compiler` | `^1.0.0` | RC enforcement | Configured in next.config.ts. `[VERIFIED: package.json:84]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline-style + var(--token) | Tailwind utility classes | **REJECTED** — Phase 174 D-12 / 175 D-08 / 177 D-02 / 178 D-02 explicitly mandate inline-style for EmberGlass v2; bundle is the source of truth and bundle is inline-style. |
| Per-body command-hook imports | Centralized at RoomsTab via React context | **REJECTED** — Phase 178 self-fetch precedent (D-04) keeps each body decoupled from the orchestrator. Recommended in CONTEXT D-39. |
| Single shared `<Sheet>` mounted at RoomsTab | One sheet per RoomCard | **REJECTED** — bundle and CONTEXT D-21 prefer single shared sheet (`selectedRoomName` state); 6 mounted-but-closed sheets is wasteful. |
| Aggregator with `useMemo` | Pure call per render | **REJECTED** — React Compiler 1.0 auto-memoizes (Phase 71). Aggregator is small (≤6 rooms × ~15 devices). |

**Installation:** None — Phase 179 introduces zero new dependencies. CLAUDE.md rule 4 ("NEVER execute `npm install`") is honored by design.

**Version verification:** All deps confirmed against `package.json` dated 2026-04-29; lucide-react `^0.562.0` matches the `node_modules/lucide-react/dist/esm/icons/` content inspected for all 23 required icon files. `[VERIFIED: filesystem]`

## Architecture Patterns

### System Architecture Diagram

```
[User taps /stanze]
        │
        ▼
[app/layout.tsx ClientProviders]         (Auth0 wraps all children — already in place)
        │
        ▼
[app/stanze/page.tsx]                    ('use client' — single line: <RoomsTab />)
        │
        ▼
[RoomsTab orchestrator]
        │
        ├─ useStoveData({ checkVersion, userId })       → { status, fanLevel, powerLevel, ... }
        ├─ useThermostatData()                          → { topology, status, refetch, ... }
        ├─ useLightsData()                              → { lights, groups, scenes, ... }
        ├─ useTuyaData()                                → { plugs[], stale, lastUpdatedAt, ... }
        ├─ useSonosFullData()                           → { data: { devices, zones, playback, volumes, ... } }
        │
        ▼
[Build AggregatorState literal]          (project hook output → bundle's idealized shape; see §Aggregator Reconciliation)
        │
        ▼
[6× RoomCard (one per ROOMS entry)]
        │            │
        │            └─ getDevicesForRoom(state, roomName) → RoomDevice[]
        │                          │
        │                          ▼
        │                  [3-col chip grid: 6× DeviceChip + (+N overflow)]
        │
        ├─ onClick (Pressable) → setSelectedRoomName(room.name)
        │
        ▼
[1× RoomSheet (mounted at orchestrator level, key=selectedRoomName)]
        │
        ▼
[Sheet primitive (Phase 175) — Radix Dialog facade]
        │
        ▼
[Summary header + per-category sections]
        │
        ▼
[N× DeviceCard per category]
        │
        ├─ DevicePrimaryControl (right slot)            → wires InlineToggle / pill / play-pause / placeholder
        │
        ▼
[DeviceBody dispatcher — switch on device.kind]
        │
        ├─ stove   → StoveBody   → useStoveCommands.{handlePowerChange, handleIgnite, handleShutdown}
        ├─ thermo  → ThermoBody  ┐
        ├─ valve   → ThermoBody  ┘ (shared)            → useThermostatCommands.{setRoomSetpoint, setHomeMode}
        ├─ light   → LightBody                          → useLightsCommands.handleBrightnessChange (groupId)
        ├─ plug    → PlugBody                           → (read-only; toggle in header)
        ├─ sonos   → SonosBody                          → useSonosCommands.{handleSetVolume, handlePrevious, handleNext, handlePlay/Pause}
        ├─ tv      → TvBody                             → no-op
        ├─ shade   → ShadeBody                          → no-op
        ├─ camera  → CameraBody                         → no-op
        └─ sensor  → SensorBody                         → (read-only)
```

Data flow direction: hooks (top) → AggregatorState → RoomDevice[] → components (bottom). Commands flow upward: body → command hook → API proxy.

### Recommended Project Structure

```
app/components/EmberGlass/rooms/
├── RoomsTab.tsx                     # orchestrator — 'use client', state, hook calls
├── RoomCard.tsx                     # GlassCard + chip grid + Pressable wrap
├── RoomSheet.tsx                    # Sheet wrapper + summary + grouped categories
├── DeviceChip.tsx                   # 1:1 chip used in RoomCard grid
├── DeviceCard.tsx                   # Pressable-as-div + header + body dispatcher
├── DevicePrimaryControl.tsx         # right-slot dispatch (5 branches)
├── DeviceBody.tsx                   # body dispatcher → 10 *Body components
├── bodies/
│   ├── StoveBody.tsx
│   ├── ThermoBody.tsx               # exports both ThermoBody + ValveBody (shared shape)
│   ├── LightBody.tsx
│   ├── PlugBody.tsx
│   ├── SonosBody.tsx
│   ├── TvBody.tsx
│   ├── ShadeBody.tsx
│   ├── CameraBody.tsx
│   └── SensorBody.tsx
├── primitives/
│   ├── StatChip.tsx
│   ├── DualTempReadout.tsx
│   ├── SliderRow.tsx
│   ├── ControlRow.tsx
│   └── MiniButton.tsx
├── lib/
│   ├── rooms-config.ts              # ROOMS, ROOM_ALIASES, EXTRA_DEVICES, ICON_FOR, CATEGORY_ORDER, CATEGORY_LABEL
│   └── getDevicesForRoom.ts         # pure aggregator
├── types.ts                          # RoomDevice, RoomConfig, DeviceKind, AggregatorState
├── index.ts                          # barrel
└── __tests__/
    ├── RoomCard.test.tsx
    ├── RoomSheet.test.tsx
    ├── DeviceChip.test.tsx
    ├── DeviceCard.test.tsx
    ├── DevicePrimaryControl.test.tsx
    ├── bodies/
    │   ├── StoveBody.test.tsx
    │   ├── ThermoBody.test.tsx
    │   ├── LightBody.test.tsx
    │   ├── PlugBody.test.tsx
    │   ├── SonosBody.test.tsx
    │   ├── TvBody.test.tsx
    │   ├── ShadeBody.test.tsx
    │   ├── CameraBody.test.tsx
    │   └── SensorBody.test.tsx
    ├── primitives/
    │   ├── StatChip.test.tsx
    │   ├── DualTempReadout.test.tsx
    │   ├── SliderRow.test.tsx
    │   ├── ControlRow.test.tsx
    │   └── MiniButton.test.tsx
    └── lib/
        └── getDevicesForRoom.test.ts

app/stanze/page.tsx                  # 'use client' + <RoomsTab />
tests/smoke/rooms-tab.spec.ts        # 5 ROOMS-* scenarios
```

### Pattern 1: Self-fetching body components (Phase 178 D-04 + CONTEXT D-39)

Each `*Body` imports its own commands hook rather than receiving them via props/context. This keeps the orchestrator lean (< 100 LOC) and matches the established Phase 178 sheets pattern.

```tsx
// Source: app/components/EmberGlass/sheets/SonosSheet.tsx (verbatim pattern)
'use client';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { useDebounce } from '@/app/hooks/useDebounce';

export function SonosBody({ device }: { device: RoomDevice }) {
  const data = useSonosFullData();
  const cmds = useSonosCommands({ fetchData: data.fetchData, setError: () => {} });
  const [pendingVolume, setPendingVolume] = useState(device.extra.volume);
  const debouncedVolume = useDebounce(pendingVolume, 250);
  // ... use cmds.handleSetVolume(coordinator_uid, debouncedVolume)
}
```

### Pattern 2: useDebounce for slider commits

Verified signature: `useDebounce<T>(value: T, delay: number = 300): T` at `app/hooks/useDebounce.ts:26`. Returns the value unchanged after `delay`ms of no further changes.

```tsx
// Source: app/components/EmberGlass/sheets/ClimateSheet.tsx:100-116 (verbatim pattern)
const [pendingTarget, setPendingTarget] = useState<number>(zone?.target ?? 20);
const debouncedTarget = useDebounce(pendingTarget, 500);

useEffect(() => {
  if (!zone) return;
  if (debouncedTarget === zone.target) return;
  void setRoomSetpoint(zone.id, debouncedTarget);
}, [debouncedTarget, zone?.id, zone?.target, setRoomSetpoint]);
```

Three Phase 179 debounce values (CONTEXT D-28/D-29/D-31):
- **500ms** — ThermoBody setpoint (matches ClimateSheet)
- **250ms** — LightBody brightness (matches LightsSheet)
- **250ms** — SonosBody volume (matches SonosSheet)

### Pattern 3: Pressable wrap on glass surfaces (Phase 175 SC-#1)

```tsx
// Source: app/components/EmberGlass/GlassCard.tsx:84-92 (verbatim — already supports onClick)
if (onOpen) {
  return (
    <Pressable
      data-testid={testId}
      onClick={onOpen}
      style={{ ...baseStyle, cursor: 'pointer', ...style }}
    >
      {inner}
    </Pressable>
  );
}
```

For RoomCard: `<GlassCard onOpen={onOpen} tone={room.tone}>` already triggers Pressable internally. **No additional wrap needed at the consumer level** — verified in GlassCard.tsx.

For DeviceCard (no card-level click): wrap explicitly.

```tsx
import { Pressable } from '@/app/components/EmberGlass/Pressable';

<Pressable as="div" data-testid={`stanze-device-${slug}`}>
  {/* DeviceCard inner content */}
</Pressable>
```

### Pattern 4: Sheet primitive consumption

Verified API at `app/components/EmberGlass/Sheet.tsx:35-40`: `interface SheetProps { open, onClose, title?, children? }`.

Pass `key={selectedRoomName}` so React unmounts the body on room change (forces fresh state inside per-body components, including `useState` for pending slider values):

```tsx
<Sheet
  key={selectedRoomName ?? 'closed'}
  open={!!selectedRoomName}
  onClose={() => setSelectedRoomName(null)}
  title={room?.name}
>
  {room && <RoomSheetContent room={room} devices={devices} />}
</Sheet>
```

### Anti-Patterns to Avoid

- **Wrapping `<MiniButton>` in `<Pressable>`** — bundle uses bare `<button>`; SC-#1 targets *glass surfaces*, not tone-tinted chips. CONTEXT D-62 explicitly excludes them.
- **Using `useMemo` for the aggregator** — React Compiler 1.0 handles it. Phase 71/95/177/178 D-33 discipline.
- **Adding `e.stopPropagation()` to InlineToggle inside DevicePrimaryControl** — InlineToggle.tsx already documents the rule, but DevicePrimaryControl is the right slot of DeviceCard which itself has no card-level onClick (D-24). No propagation conflict.
- **Tailwind utility classes for visual values** — banned per Phase 174/175/177/178. Only `app/stanze/page.tsx` outer wrapper may use Tailwind for layout (Phase 177 precedent: `<section className="py-8 sm:py-12 lg:py-16">`).
- **Reading `state.thermostat.zones[].name`** from the bundle directly — that field does not exist in the real `useThermostatData` return. See §Aggregator Reconciliation.
- **Wrapping the entire RoomSheet body in a single `<Pressable>`** — bundle places it inside Sheet and the Sheet is the modal surface, not a press surface. Sub-elements (DeviceCard, MiniButton, etc.) own their own affordances.

## Aggregator Reconciliation [CRITICAL — planner must-have]

The bundle's `state.*` shape is a synthetic test fixture, not a real hook contract. Reconciling each field is the single highest-risk part of Phase 179. **The planner MUST have this table in front of it** when authoring the aggregator plan.

### Stove (`useStoveData`)

CONTEXT D-10 declares: `stove: { on: boolean; temp: number; powerLevel: number; fanLevel: number; target?: number }`.

| AggregatorState field | Source field (verified) | Path | Notes |
|-----------------------|-------------------------|------|-------|
| `on` | `isAccesa` | `useStoveData().isAccesa` | Already-derived boolean. `[VERIFIED: useStoveData.ts:153]` `status === 'working' \|\| 'igniting' \|\| 'modulating'`. |
| `temp` | **NOT EXPOSED by hook** | — | The bundle reads `state.stove.temp` for the chip value. Real `useStoveData` exposes `status`, `fanLevel`, `powerLevel`, but NOT a "current temperature" reading. **Reconciliation:** the bundle's `temp` is a fiction. Display string `value` should be `device.on ? '${powerLevel}/5' : 'Spenta'` (powerLevel is the closest public scalar — the chip in the bundle reads `${state.stove.temp}°C`; planner should rewrite to `${powerLevel}/5` or `${status}` and document deviation). |
| `powerLevel` | `powerLevel` | `useStoveData().powerLevel` (number \| null) | Null when uninitialised — coerce `?? 0` in aggregator. `[VERIFIED: useStoveData.ts:114]` |
| `fanLevel` | `fanLevel` | `useStoveData().fanLevel` (number \| null) | Null when uninitialised — coerce `?? 0`. `[VERIFIED: useStoveData.ts:115]` |
| `target` | **NOT EXPOSED by hook** | — | Thermorossi proxy has no setpoint endpoint (deferred per CONTEXT). StoveBody's "Target" chip will display `${powerLevel}/5` instead of a temperature. Document deviation. |

**Hook params:** `useStoveData({ checkVersion, userId })` — RoomsTab orchestrator MUST call `useVersion()` (from `app/context/VersionContext`) and `useUser()` (Auth0) at the top to obtain these. Pattern: `[VERIFIED: StoveSheet.tsx:42-44]`.

```tsx
const { checkVersion } = useVersion();
const { user } = useUser();
const stoveData = useStoveData({ checkVersion, userId: user?.sub });
```

### Thermostat (`useThermostatData`)

CONTEXT D-10 declares: `thermostat: { zones: Array<{ name; on; current; target; kind: 'thermo' | 'valve'; roomId }> }`.

| AggregatorState field | Source field (verified) | Path | Notes |
|-----------------------|-------------------------|------|-------|
| `zones[].name` | `topology.rooms[].name` | merged from `topology.rooms` | `[VERIFIED: useThermostatData.ts:141 + types/netatmoProxy.ts:57-62]` Field is `string` (non-null). |
| `zones[].roomId` | `topology.rooms[].id` | merged from `topology.rooms` | `[VERIFIED: useThermostatData.ts:141]` |
| `zones[].current` | `status.rooms[].temperature` | merged from `status.rooms` (matched by `room_id === topology.room.id`) | `[VERIFIED: useThermostatData.ts:241]` Number; coerce `?? 0`. |
| `zones[].target` | `status.rooms[].setpoint` | merged from `status.rooms` (mapped from `therm_setpoint_temperature`) | `[VERIFIED: useThermostatData.ts:242 + line 245]` |
| `zones[].on` | `status.rooms[].mode !== 'hg'` | derived | `[VERIFIED: ClimateSheet.tsx:90]` "off" = home mode 'hg' (frost-guard). |
| `zones[].kind` | `topology.modules.find(m => m.room_id === room.id).type` | discriminator | **VALUE MAP:** `'NATherm1' → 'thermo'` (or `'termostato'`), all other types (notably `'NRV'`) → `'valve'` (or `'termovalvola'`). `[VERIFIED: ClimateSheet.tsx:91 + comment line 12]`. CONTEXT D-12's bundle expects `z.kind === 'valvola'` to drive valve flag — the real discriminator is the **module type code**, NOT a "valvola" string. Aggregator must do the topology-modules lookup. |

**Home ID for commands:** `topology?.home_id` (verified `[useThermostatData.ts:142]`). All `useThermostatCommands` calls require this. RoomsTab can pass it down to ThermoBody via prop or each ThermoBody can read its own `useThermostatData` (per-body self-fetch pattern recommended).

**Critical:** CONTEXT D-25 thermo/valve toggle text says `setRoomMode(roomId, on ? 'off' : 'on')`. The actual `setRoomMode` signature accepts `SetRoomThermpointRequest['mode']` which is **`'manual' | 'home'`** — not `'on' | 'off'`. `[VERIFIED: useThermostatCommands.ts:50, types/netatmoProxy.ts:148]`. The Climate Sheet uses `setRoomMode(id, 'manual')` for "off" and `setRoomMode(id, 'home')` for "on" (D-09 of Phase 178). **Planner MUST use `'manual' | 'home'` strings**, not `'on' | 'off'`. Confirmed pattern: `setRoomMode(zone.id, zone.on ? 'manual' : 'home')` (toggle the off-from-schedule state).

### Lights (`useLightsData`)

CONTEXT D-10 declares: `lights: { lights: Array<{ name; on; room_name: string \| null; groupId; brightness? }> }`.

| AggregatorState field | Source field (verified) | Path | Notes |
|-----------------------|-------------------------|------|-------|
| `lights[].name` | `lights[].name` | `useLightsData().lights[].name` | `[VERIFIED: types/hueProxy.ts:58]` |
| `lights[].on` | `lights[].on` | (boolean, NOT `on.on`) | `[VERIFIED: types/hueProxy.ts:59 + useLightsData.ts:296-297 comment]` |
| `lights[].room_name` | `lights[].room_name` | `string \| null` | `[VERIFIED: types/hueProxy.ts:69]` Drop lights with `null` (CONTEXT D-13). |
| `lights[].groupId` | **DERIVE from `groups[]`** | — | `HueLight` has `room_id: string \| null` (`[VERIFIED: types/hueProxy.ts:68]`) — that's the group_id. **Use `light.room_id` directly as the brightness-target groupId.** Planner: in aggregator, set `groupId: light.room_id ?? null` and skip lights with `room_id === null`. |
| `lights[].brightness` | `lights[].brightness` | `0–254` | `[VERIFIED: types/hueProxy.ts:60]`. Convert to 0–100 percent for the slider: `Math.round((brightness ?? 0) / 254 * 100)`. The reverse path (set) is handled by `handleBrightnessChange` which expects a percent string and converts internally to bri (0–254). `[VERIFIED: useLightsCommands.ts:120]` |

**Brightness command:** `useLightsCommands.handleBrightnessChange(groupId, brightnessAsString)` — yes, the second arg is a STRING (`brightness: string`) and gets `parseFloat`'d internally. `[VERIFIED: useLightsCommands.ts:114]`. SliderRow integration: `handleBrightnessChange(groupId, String(percent))` debounced 250ms.

### Plugs (`useTuyaData`)

CONTEXT D-10 declares: `plugs: { plugs: Array<{ id; name; on; power; today_kwh? }> }`.

| AggregatorState field | Source field (verified) | Path | Notes |
|-----------------------|-------------------------|------|-------|
| `plugs[].id` | `plugs[].device_id` | rename | `[VERIFIED: types/tuyaProxy.ts:34]` Bundle uses `p.id`; real field is `device_id`. PlugsSheet documents this exact rename pattern: `id: p.device_id` (`[VERIFIED: PlugsSheet.tsx:126]`). |
| `plugs[].name` | `plugs[].custom_name ?? plugs[].device_id` | fallback | `[VERIFIED: types/tuyaProxy.ts:43 + PlugsSheet.tsx:127]` |
| `plugs[].on` | `plugs[].switch_on === true` | strict equality (null treated as false) | `[VERIFIED: types/tuyaProxy.ts:35 + PlugsSheet.tsx:128]` |
| `plugs[].power` | `plugs[].power_w` | rename, null → 0 | `[VERIFIED: types/tuyaProxy.ts:36 + PlugsSheet.tsx:129]` |
| `plugs[].today_kwh` | `plugs[].energy_kwh` | rename | `[VERIFIED: types/tuyaProxy.ts:39]` Note: this is **cumulative**, not "today". CONTEXT bundle's "Oggi" chip is approximate. Document deviation; the bundle stub computed `Math.round(p.power * 4.2 / 100) / 10` (a fake daily multiplier — `[VERIFIED: rooms.jsx:103]`). Recommend the aggregator pass `energy_kwh` directly and rename the chip label or accept the cumulative reading; planner picks. |

**No `room` field on TuyaPlug** — confirmed `[VERIFIED: types/tuyaProxy.ts:33-44]`. Aggregator hardcodes "Cucina" per CONTEXT D-14.

**Toggle command:** `useTuyaCommands.togglePlug(deviceId, currentState)` — POSTs `{ on: !currentState }`. `[VERIFIED: useTuyaCommands.ts:14-18]`. NOT wrapped in `useRetryableCommand`.

### Sonos (`useSonosFullData`)

CONTEXT D-10 declares: `sonos: { groups: Array<{ id; name; playing; track; artist; volume; coordinator }> }`.

The real hook returns `{ data: { devices, zones, playback, volumes, ... } }` keyed by various ids. The aggregator must flatten across these.

| AggregatorState field | Source field (verified) | Path | Notes |
|-----------------------|-------------------------|------|-------|
| `groups[].id` | `zones[].group_id` | `useSonosFullData().data.zones[].group_id` | Group_id IS the coordinator_uid. `[VERIFIED: types/sonosProxy.ts:69]` |
| `groups[].name` | `zones[].label` OR `zones[].coordinator_name` | bundle says `g.name` | `[VERIFIED: types/sonosProxy.ts:70-72]`. Recommend `label` (human-readable zone label). |
| `groups[].playing` | `playback[group_id].transport_state === 'PLAYING'` | derived | `[VERIFIED: types/sonosProxy.ts:84 + SonosSheet.tsx:67]` |
| `groups[].track` | `playback[group_id].title ?? ''` | nullable | `[VERIFIED: types/sonosProxy.ts:85 + SonosSheet.tsx:68]` |
| `groups[].artist` | `playback[group_id].artist ?? ''` | nullable | `[VERIFIED: SonosSheet.tsx:69]` |
| `groups[].volume` | `volumes[zone.coordinator_uid].volume ?? 0` | derived (volumes keyed by speaker uid) | `[VERIFIED: SonosSheet.tsx:70 + types/sonosProxy.ts:95-99]` |
| `groups[].coordinator` | `zones[].coordinator_uid` | flat field | `[VERIFIED: types/sonosProxy.ts:71]`. Bundle's `coordinator` field name is fine; map `coordinator_uid` → `coordinator`. SonosBody volume slider commits via `handleSetVolume(extra.coordinator, value)` — verified the volume endpoint takes the speaker uid. |

**Volume command vs zone command:** Two options exist. (a) `handleSetVolume(uid, volume)` PUTs `/api/v1/sonos/speakers/{uid}/volume` — sets the coordinator's volume only. (b) `handleSetZoneVolume(groupId, volume)` POSTs `/api/v1/sonos/zones/{groupId}/group-volume` — sets the whole group. Phase 178 SonosSheet uses **`handleSetZoneVolume`** (`[VERIFIED: SonosSheet.tsx:92]`) for consistency with the bundle. For Phase 179 SonosBody recommendation: also use `handleSetZoneVolume(extra.id, value)` — the `extra.coordinator` is needed only when reading volume. CONTEXT D-31 says `handleSetVolume(extra.coordinator, value)` — recommend planner override with `handleSetZoneVolume(extra.id, value)` to match Phase 178 behavior. **Document this deviation in the plan.**

**Hook params:** `useSonosCommands({ fetchData, setError })` — RoomsTab passes `useSonosFullData().fetchData` and a no-op or shared error setter. `[VERIFIED: useSonosCommands.ts:6-9]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal sheet with backdrop, scroll-lock, focus trap, ESC dismiss | Custom `<div role="dialog">` | `<Sheet>` from Phase 175 | Already production-ready. Wraps Radix Dialog with `forceMount` for outro animation, scroll-lock with restore, custom backdrop, VisuallyHidden Title fallback. `[VERIFIED: app/components/EmberGlass/Sheet.tsx]` |
| Press feedback on cards | Manual `onPointerDown/Up/Cancel/Leave` | `<Pressable>` + `usePressed()` from Phase 175 | Already 3 grep-target compliant for SC-#1. Polymorphic via `as` prop, focus-visible bridge, JS-tracked pointer state (avoids `:active` sticking on touch). `[VERIFIED: app/components/EmberGlass/Pressable.tsx]` |
| Glass card surface | New backdrop-blur container | `<GlassCard>` from Phase 177 | Already accepts `onOpen` (auto-Pressable wrap) + `tone` prop for radial gradient. `[VERIFIED: app/components/EmberGlass/GlassCard.tsx]` |
| Card head row (icon + label + right slot) | New flex row | `<CardHead>` from Phase 177 | 32×32 icon tile + 13px label + flex right slot. `[VERIFIED: app/components/EmberGlass/CardHead.tsx]` |
| iOS-style toggle switch | New 44×26 button | `<InlineToggle>` from Phase 177 | Phase 175 cubic-bezier curve, color-mix glow, role=switch. `[VERIFIED: app/components/EmberGlass/InlineToggle.tsx]` |
| Skeleton card | New pulsing rectangle | `<GlassCardSkeleton>` from Phase 177 | First-load state. |
| Debounce | Custom timer + cleanup | `useDebounce` at `app/hooks/useDebounce.ts` | 16-line generic hook. `[VERIFIED]` |
| Retry / idempotency | New fetch wrapper | Existing `useRetryableCommand` (transitively via each commands hook) | Phase 7.0 / 55 infrastructure. |
| Optimistic UI rollback | New revert state | Existing pattern in commands hooks | Toggle/slider commit immediately, command hook errors surface via toast, next data tick rectifies. |
| Auth0 session caching | Roll a new login flow | `tests/auth.setup.ts` | Storage state at `tests/.auth/user.json` reused via `playwright.config.ts`. `[VERIFIED: tests/auth.setup.ts]` |
| Console error collection | Custom listener | `collectConsoleErrors` from Phase 51/97 | Verbatim pattern in `tests/smoke/dashboard-glass-cards.spec.ts:30-42`. |
| VersionEnforcer dismissal | Custom retry loop | `dismissVersionEnforcerIfPresent` + `dismissWhatsNewModalIfPresent` | Phase 175 D-17 known blocker pattern. `[VERIFIED: tests/smoke/dashboard-glass-cards.spec.ts:50-94]` |
| Rooms-tab smoke prime | Custom localStorage seeding | `primeDashboardForSheetTest` (extract or copy) | Phase 178 sheets specs use this verbatim. `[VERIFIED: tests/smoke/dashboard-glass-cards.spec.ts:285-307]` |

**Key insight:** Phase 179 is a **composition phase**. ZERO new infrastructure. Everything novel is the per-room aggregator + the 10 type-specific bodies (which are pure presentational with prop-only inputs). The risk concentration is in the field-name reconciliation (above) and the Italian copy fidelity.

## Common Pitfalls

### Pitfall 1: Bundle's idealized `state.*` shape ≠ real hook output
**What goes wrong:** Aggregator written by reading `rooms.jsx:58-128` line-by-line will reference fields that don't exist (`state.stove.temp`, `state.thermostat.zones[].name/.kind`, `state.lights[].room`, `state.plugs[].room`, `state.sonos.groups[].name/.coordinator`).
**Why it happens:** Bundle's `state` is a synthetic test fixture. Real hooks have richer + differently-named outputs.
**How to avoid:** §Aggregator Reconciliation table is the contract. Plan agent verifies every read against the table before writing the aggregator.
**Warning signs:** TS compile error `Property 'X' does not exist on type 'Y'`. Visible: chip values render `undefined°C`, count badges read `0/0`.

### Pitfall 2: Thermostat valve discriminator is a module type code, not a `kind: 'valvola'` field
**What goes wrong:** Aggregator copies `z.kind === 'valvola' ? 'valve' : 'thermo'` from bundle and never matches.
**Why it happens:** Bundle's synthetic state had a `kind` field. Real Netatmo proxy uses module type codes (`NATherm1` = thermostat, `NRV` = valve) which require a topology-modules join.
**How to avoid:** Mirror ClimateSheet.tsx:81-94 — for each `topology.rooms[i]`, find `topology.modules.find(m => m.room_id === room.id)`, then `kind: moduleType === 'NATherm1' ? 'thermo' : 'valve'`.
**Warning signs:** All zones render as either all `thermo` or all `valve`.

### Pitfall 3: `setRoomMode` mode union is `'manual' | 'home'`, NOT `'on' | 'off'`
**What goes wrong:** Aggregator wires the thermo/valve InlineToggle as `setRoomMode(roomId, on ? 'off' : 'on')` per CONTEXT D-25 verbatim. TypeScript rejects this; runtime POST body fails Netatmo proxy validation.
**Why it happens:** CONTEXT D-25 wording is loose; the real type union excludes `'on' | 'off'`.
**How to avoid:** Use `setRoomMode(roomId, zone.on ? 'manual' : 'home')` — "manual" sets a per-room override (drops out of schedule), "home" returns to schedule. Or use `setHomeMode('hg')` for whole-house frost-guard. Plan agent verifies via `types/netatmoProxy.ts:148` (`mode: 'manual' | 'home'`).
**Warning signs:** TS error on the `setRoomMode` call; or no TS error but proxy returns 400.

### Pitfall 4: Tuya `id` is `device_id`, not `id`
**What goes wrong:** Aggregator reads `p.id` per bundle; real field is `device_id`. `togglePlug(undefined, ...)` fails silently.
**Why it happens:** Bundle synthetic state simplified the field name.
**How to avoid:** Mirror PlugsSheet.tsx:126 — `id: p.device_id`. Same pattern for `name: p.custom_name ?? p.device_id`, `on: p.switch_on === true`, `power: p.power_w ?? 0`.
**Warning signs:** Toggle clicks produce no network request; aggregator returns devices with `id: undefined`.

### Pitfall 5: Hue light brightness is 0–254, slider is 0–100 percent
**What goes wrong:** SliderRow shows `value={120}%` (out of bounds) because aggregator passes raw `light.brightness`.
**Why it happens:** Hue Bridge v1 uses 0–254 range; UI conventions are 0–100.
**How to avoid:** Aggregator computes `brightness: Math.round((light.brightness ?? 0) / 254 * 100)`. SliderRow receives 0–100 percent. `handleBrightnessChange(groupId, String(percent))` does the reverse conversion internally (verified `[useLightsCommands.ts:120]`).
**Warning signs:** Slider value > 100; brightness command POSTs `bri: 25400`.

### Pitfall 6: Hue light without `room_name` (or `room_id`) must be dropped
**What goes wrong:** Aggregator includes lights with `room_name: null`; chip-grid renders ghost devices in unknown rooms.
**Why it happens:** Bridge can have lights not assigned to any group.
**How to avoid:** Aggregator: `if (light.room_name === null \|\| light.room_id === null) return;` before mapping. CONTEXT D-13 directs this.
**Warning signs:** Total device count > rendered chip count; "+N" overflow includes phantom items.

### Pitfall 7: Sonos volume command takes speaker uid, not group_id
**What goes wrong:** SonosBody slider commits via `handleSetVolume(group.id, value)` — but `id` IS the coordinator_uid in this case (since `zone.group_id === zone.coordinator_uid` per `[types/sonosProxy.ts:69]`). It happens to work.
**Why it happens:** Sonos proxy convention: group_id is set to coordinator_uid. So the bundle's pattern accidentally works. **But** Phase 178 SonosSheet prefers `handleSetZoneVolume(group.id, value)` for explicitness.
**How to avoid:** Use `handleSetZoneVolume(group.id, value)` — sets the whole group's volume via coordinator. Document the deviation from CONTEXT D-31 in the plan.
**Warning signs:** Volume slider only adjusts the coordinator and not the group members in a multi-speaker zone.

### Pitfall 8: `home_id` threading for thermostat commands
**What goes wrong:** `useThermostatCommands({ homeId, refetch })` is called with `homeId: ''` because `topology` hasn't loaded yet. Setpoint command POSTs empty home_id; proxy 400.
**Why it happens:** First render before `useThermostatData()` resolves `topology`.
**How to avoid:** ThermoBody self-fetches via `useThermostatData()` (per Phase 178 D-04 self-fetch pattern). Use `data.topology?.home_id ?? ''` and gate command calls on `homeId !== ''`. Phase 178 ClimateSheet has this pattern verbatim. `[VERIFIED: ClimateSheet.tsx:51-57]`. Phase 80/82 explicitly added home_id wiring as a gap closure — same care needed here.
**Warning signs:** Setpoint commands fail with home_id missing; ThermoBody renders before topology loads → buttons appear interactive but fire no-op commands.

### Pitfall 9: `useStoveData` requires `checkVersion` + `userId` params
**What goes wrong:** RoomsTab orchestrator calls `useStoveData()` without args; TS compile error.
**Why it happens:** Phase 178 contract: stove data hook needs Auth0 user.sub and the version check function.
**How to avoid:** `const { checkVersion } = useVersion(); const { user } = useUser(); const stoveData = useStoveData({ checkVersion, userId: user?.sub });` Pattern: `[VERIFIED: StoveSheet.tsx:42-44]`.
**Warning signs:** TS error `Expected 1 arguments, but got 0`; or runtime fault on missing checkVersion.

### Pitfall 10: aspect-ratio `1 / 1` CSS support
**What goes wrong:** DeviceChip and GlassCard both use `aspect-ratio: '1 / 1'`. Older Safari < 15 lacks support.
**Why it happens:** `aspect-ratio` is a relatively new CSS property.
**How to avoid:** Phase 177 already uses `aspectRatio: '1 / 1'` in `app/components/EmberGlass/GlassCard.tsx:31` without a fallback. CLAUDE.md targets modern browsers (Safari 15+). Phase 179 inherits the same constraint. Document in JSDoc.
**Warning signs:** Chips render with 0-height boxes on Safari 14.

### Pitfall 11: `npx react-compiler-healthcheck` CLI is NOT installed
**What goes wrong:** Plan agent writes `npx react-compiler-healthcheck` in `<verify><automated>` per CONTEXT D-66. Command fails with "command not found".
**Why it happens:** Phase 177 already discovered this and substituted a grep-based check. `[VERIFIED: 177-VALIDATION.md:110]`. Only `babel-plugin-react-compiler@^1.0.0` is installed; the standalone `react-compiler-healthcheck` CLI is a separate package not added to the project.
**How to avoid:** Use the Phase 177 substitute: `grep -REn "useMemo\|useCallback" app/components/EmberGlass/rooms/ \| wc -l` — must equal 0 (any non-zero count fails the gate). Plan agent encodes this in `<verify><automated>` with explicit exit-code semantics.
**Warning signs:** verify-work step prints `command not found`; CI green-but-grep-skipped.

### Pitfall 12: Playwright spec path mismatch — repo uses `tests/smoke/`, CONTEXT references `tests/playwright/`
**What goes wrong:** CONTEXT D-64 + UI-SPEC reference `tests/playwright/rooms-tab.spec.ts`. The actual smoke directory in this repo is **`tests/smoke/`** (verified — `tests/playwright/` does not exist; spec files live in `tests/smoke/*.spec.ts` and `tests/features/*.spec.ts`).
**Why it happens:** CONTEXT was written before path verification. Phase 51/97 specs live under `tests/smoke/`.
**How to avoid:** Plan agent creates `tests/smoke/rooms-tab.spec.ts` (NOT `tests/playwright/`). Sibling to the existing `dashboard-glass-cards.spec.ts`. Update plan + verify steps accordingly.
**Warning signs:** Test runner reports "no tests matched"; CI doesn't pick up the file.

### Pitfall 13: lucide-react `Volume2` icon (filename is `volume-2.js`)
**What goes wrong:** Plan agent grep-checks for `Volume2` in `node_modules/lucide-react/dist/esm/icons/Volume2.js` → not found → assumes icon doesn't exist.
**Why it happens:** lucide kebab-cases its filenames. The named export `Volume2` works perfectly when imported (`import { Volume2 } from 'lucide-react'`); the filename on disk is `volume-2.js`.
**How to avoid:** Plan agent imports normally and trusts the kebab-case filename mapping. Verified all 23 Phase 179 icons exist (filename inspection: Home, Moon, Droplets, Flame, Thermometer, Lightbulb, Plug, Music, Tv, Video, Blinds, Minus, Plus, Power, Volume2 → `volume-2.js`, SkipBack, SkipForward, Play, Pause, ChevronUp, ChevronDown, ChevronRight, TriangleAlert).
**Warning signs:** "Module 'lucide-react' has no exported member 'Volume2'" — only happens when the package is severely outdated; not a risk at `^0.562.0`.

## Code Examples

Verified patterns from official sources in this repo.

### Hook composition at orchestrator (RoomsTab)

```tsx
'use client';
import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { ROOMS } from './lib/rooms-config';
import { getDevicesForRoom } from './lib/getDevicesForRoom';

export function RoomsTab() {
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stove = useStoveData({ checkVersion, userId: user?.sub });
  const thermostat = useThermostatData();
  const lights = useLightsData();
  const tuya = useTuyaData();
  const sonos = useSonosFullData();

  // Build AggregatorState literal (per §Aggregator Reconciliation)
  const state = {
    stove: { on: stove.isAccesa, temp: 0, powerLevel: stove.powerLevel ?? 0, fanLevel: stove.fanLevel ?? 0 },
    thermostat: {
      zones: (thermostat.topology?.rooms ?? []).map((r) => {
        const s = thermostat.status?.rooms?.find((sr) => sr.room_id === r.id);
        const linked = thermostat.topology?.modules?.find((m) => m.room_id === r.id);
        return {
          name: r.name ?? '',
          on: s?.mode !== 'hg',
          current: typeof s?.temperature === 'number' ? s.temperature : 0,
          target: typeof s?.setpoint === 'number' ? s.setpoint : 20,
          kind: linked?.type === 'NATherm1' ? 'thermo' : 'valve' as const,
          roomId: r.id,
        };
      }),
    },
    lights: {
      lights: lights.lights
        .filter((l) => l.room_name !== null && l.room_id !== null)
        .map((l) => ({
          name: l.name,
          on: l.on,
          room_name: l.room_name,
          groupId: l.room_id!,
          brightness: Math.round((l.brightness ?? 0) / 254 * 100),
        })),
    },
    plugs: {
      plugs: (tuya.plugs ?? []).map((p) => ({
        id: p.device_id,
        name: p.custom_name ?? p.device_id,
        on: p.switch_on === true,
        power: p.power_w ?? 0,
        today_kwh: p.energy_kwh ?? 0,
      })),
    },
    sonos: {
      groups: (sonos.data?.zones ?? []).map((z) => ({
        id: z.group_id,
        name: z.label,
        playing: sonos.data?.playback?.[z.group_id]?.transport_state === 'PLAYING',
        track: sonos.data?.playback?.[z.group_id]?.title ?? '',
        artist: sonos.data?.playback?.[z.group_id]?.artist ?? '',
        volume: sonos.data?.volumes?.[z.coordinator_uid]?.volume ?? 0,
        coordinator: z.coordinator_uid,
      })),
    },
  };

  const room = ROOMS.find((r) => r.name === selectedRoomName) ?? null;
  const devices = selectedRoomName ? getDevicesForRoom(state, selectedRoomName) : [];

  return (
    <>
      <div style={{ paddingTop: 70 }}>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{ROOMS.length} stanze</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.8 }}>Stanze</div>
        </div>
        <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {ROOMS.map((r) => (
            <RoomCard key={r.name} room={r} devices={getDevicesForRoom(state, r.name)} onOpen={() => setSelectedRoomName(r.name)} />
          ))}
        </div>
      </div>
      <RoomSheet
        key={selectedRoomName ?? 'closed'}
        open={!!selectedRoomName}
        onClose={() => setSelectedRoomName(null)}
        room={room}
        devices={devices}
      />
    </>
  );
}
```

### `app/stanze/page.tsx` (mirror Phase 177 dashboard root)

```tsx
'use client';
import { RoomsTab } from '@/app/components/EmberGlass/rooms';

export const dynamic = 'force-dynamic';

export default function StanzePage() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Stanze</h1>
      <RoomsTab />
    </section>
  );
}
```

Auth gating is automatic via `app/layout.tsx → ClientProviders` (Auth0 wrapper). No per-page guard needed. Pattern: `[VERIFIED: app/page.tsx + app/layout.tsx:69-79]`.

### Per-body self-fetch (ThermoBody example)

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useThermostatCommands } from '@/app/components/devices/thermostat/hooks/useThermostatCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import type { RoomDevice } from '../types';

export function ThermoBody({ device }: { device: RoomDevice }) {
  const data = useThermostatData();
  const homeId = data.topology?.home_id ?? '';
  const { setRoomSetpoint, setHomeMode } = useThermostatCommands({ homeId, refetch: data.refetch });

  const [pending, setPending] = useState<number>(device.extra.target);
  const debounced = useDebounce(pending, 500);

  useEffect(() => {
    if (!homeId) return;
    if (debounced === device.extra.target) return;
    void setRoomSetpoint(device.extra.roomId, debounced);
  }, [debounced, device.extra.roomId, device.extra.target, setRoomSetpoint, homeId]);

  return (
    <DeviceBodyLayout>
      <DualTempReadout current={device.extra.current} target={pending} tone={device.tone} />
      <ControlRow>
        <MiniButton Icon={Minus} label="−0.5°" onClick={() => setPending((v) => v - 0.5)} />
        <MiniButton Icon={Plus} label="+0.5°" onClick={() => setPending((v) => v + 0.5)} />
        <MiniButton label="Eco" onClick={() => setHomeMode('away')} />
        <MiniButton label="Auto" onClick={() => setHomeMode('schedule')} />
      </ControlRow>
    </DeviceBodyLayout>
  );
}
```

### Playwright spec scaffold

Path: **`tests/smoke/rooms-tab.spec.ts`** (NOT `tests/playwright/`).

```ts
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

// Reuse from dashboard-glass-cards.spec.ts (or extract to a shared helper in a follow-up):
function collectConsoleErrors(page: Page) { /* verbatim from dashboard-glass-cards.spec.ts:30-42 */ }
async function dismissVersionEnforcerIfPresent(page: Page) { /* verbatim from :50-67 */ }
async function dismissWhatsNewModalIfPresent(page: Page) { /* verbatim from :80-94 */ }
async function primeDashboardForSheetTest(page: Page) { /* verbatim from :285-307 */ }

test.describe('ROOMS-01..05 Rooms tab', () => {
  test.beforeEach(async ({ page }) => {
    await primeDashboardForSheetTest(page);
    // Mock device endpoints with non-empty fixtures so 6 RoomCards render with > 0 devices.
    await page.route('**/api/v1/hue/lights', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lights: [/* fixture lights with room_name = 'Soggiorno' */] }) }));
    // ... similar for /api/v1/netatmo/homestatus, /api/tuya/plugs, /api/v1/sonos/zones, /api/stove/status
    await page.goto('/stanze');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('ROOMS-01 6 RoomCards render with N/M counters', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    for (const name of ['Soggiorno', 'Cucina', 'Camera', 'Studio', 'Bagno', 'Ingresso']) {
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 5000 });
    }
    cleanup();
    expect(errors).toEqual([]);
  });

  test('ROOMS-02 chip grid + overflow renders', async ({ page }) => {
    // assert chips visible, +N appears when fixture has 7+ devices
  });

  test('ROOMS-03 sheet opens with summary + categories', async ({ page }) => {
    await page.getByText('Soggiorno').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/di .* attivi/)).toBeVisible();
  });

  test('ROOMS-04 expanded DeviceCards render', async ({ page }) => {
    await page.getByText('Soggiorno').first().click();
    // assert at least one DeviceCard with header + body
  });

  test('ROOMS-05 type-specific bodies', async ({ page }) => {
    await page.getByText('Soggiorno').first().click();
    // assert StoveBody Power button + SonosBody play/pause + TvBody HDMI buttons
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-card `useState` for sheet open | Single `selectedRoomName: string \| null` at orchestrator | Phase 179 (this) | One mounted Sheet for 6 rooms; cleaner unmount via `key={selectedRoomName}`. |
| Tailwind utility classes for visual values | Inline-style + `var(--token)` | Phase 174 (v20.0) | Bundle parity; tokens drive runtime accent picker. |
| Manual memoization (useMemo/useCallback) | React Compiler 1.0 auto-memo | Phase 71 / 95 | RC-clean assertion via `babel-plugin-react-compiler` + grep gate (CLI not installed; see Pitfall 11). |
| Custom modal sheet | `<Sheet>` wrapping Radix Dialog | Phase 175 | focus-trap, ESC, return-focus, scroll-lock with restore, outro animation. |
| Custom press feedback | `<Pressable>` + `usePressed()` | Phase 175 | Touch-safe (avoids `:active` sticking), focus-visible bridge, polymorphic. |
| Per-feature WS subscription | Shared `WebSocketContext` + topic-keyed messages | Phase 17.0 | Single WS connection; hooks fall back to 60s polling when CLOSED. |

**Deprecated/outdated:**
- Bundle's idealized `state.{stove,thermostat,lights,plugs,sonos}` shape — DO NOT copy verbatim. See §Aggregator Reconciliation.
- `tests/playwright/` directory — does not exist; use `tests/smoke/` (the actual smoke directory in this repo).
- `npx react-compiler-healthcheck` standalone CLI — not installed. Substitute grep gate.

## Assumptions Log

> All claims tagged `[ASSUMED]` in this research. All other claims are verified or cited.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `today_kwh` field semantics are cumulative (`energy_kwh`), not "today" | §Aggregator Reconciliation > Plugs | PlugBody chip "Oggi" shows lifetime energy instead of today. Document as a known limitation; fix in a future registry/Tuya enrichment phase. |
| A2 | Sonos `zones[].label` is the human-readable name to surface (vs `coordinator_name`) | §Aggregator Reconciliation > Sonos | Bundle says `g.name`; both fields exist. Recommend `label` (matches Phase 178 SonosSheet usage; SonosSheet at line 67 uses `playback.title` for track but does not surface `label` in the DeviceCard name). Plan agent confirms by reading SonosSheet group rendering. |
| A3 | EXTRA_DEVICES TV/blinds/humidity/camera have NO real proxy to wire (no-op clicks acceptable) | CONTEXT D-32..D-35 | Confirmed in CONTEXT `<deferred>` and ROADMAP. Real proxies are explicitly out of scope. |

**If this table is empty:** No user confirmation needed. Three rows above are minor and pre-acknowledged by CONTEXT/UI-SPEC.

## Open Questions

1. **Should the aggregator's stove `value` string drop temperature (since useStoveData has no `temp` field)?**
   - What we know: bundle reads `${state.stove.temp}°C` for the chip value. Real hook has `powerLevel` (1–5) and `status` (StoveState union).
   - What's unclear: should the chip show `${powerLevel}/5` or `${status}` or "Spenta" / "Accesa" only.
   - Recommendation: aggregator outputs `value: stove.isAccesa ? 'Accesa' : 'Spenta'` (status-only, matches what Phase 178 StoveSheet already shows on the dashboard). Plan agent confirms.

2. **Should ThermoBody / ValveBody `useThermostatData` self-fetch, or accept the data via prop drilling from RoomsTab?**
   - What we know: Phase 178 sheets self-fetch (D-04). Phase 179 CONTEXT D-39 endorses self-fetch.
   - What's unclear: 6 rooms × N zones = potentially many ThermoBody instances each calling `useThermostatData` (which polls + WS-subs). React's hook dedup makes this reasonable, but it does spawn N React subscriptions to the same data.
   - Recommendation: each body self-fetches; rely on React's hook subscription dedup. The hook's WebSocket subscription is conditional on `isWsConnected` and shares the singleton context, so multiple consumers don't multiply network traffic. Plan agent verifies no warnings in dev.

3. **Should `getDevicesForRoom` be exported as default or named?**
   - What we know: CONTEXT D-68 says `export function getDevicesForRoom`.
   - Recommendation: named export. Plan agent uses verbatim.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build / dev | ✓ | (project) | — |
| `next` 15.5 | Framework | ✓ | 15.5.x (project) | — |
| React Compiler | RC discipline (D-66) | ✓ | `babel-plugin-react-compiler@^1.0.0` | — |
| `react-compiler-healthcheck` CLI | RC enforcement (CONTEXT D-66 wording) | ✗ | — | **grep-based gate** (Phase 177 substitute): `grep -REn "useMemo\|useCallback" app/components/EmberGlass/rooms/ \| wc -l` must equal 0 |
| `lucide-react` `^0.562.0` | All Phase 179 icons | ✓ | 0.562.0 (all 23 icon files verified) | — |
| `@radix-ui/react-dialog` | Phase 175 Sheet | ✓ | 1.1.14 | — |
| `@auth0/nextjs-auth0` | Auth | ✓ | (project) | — |
| Jest | Unit tests | ✓ | (project) | — |
| Playwright | Smoke tests | ✓ | (project) | — |
| `tests/smoke/` directory | Spec location | ✓ | — | — |
| `tests/playwright/` directory | CONTEXT path reference | ✗ | — | **Use `tests/smoke/`** instead |
| Auth0 storage state at `tests/.auth/user.json` | Spec auth | ✓ | (created via `tests/auth.setup.ts`) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- `react-compiler-healthcheck` CLI → grep-based assertion (Phase 177 precedent).
- `tests/playwright/` directory → use `tests/smoke/` (existing smoke spec location).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Jest + @testing-library/react (project default) |
| Smoke framework | Playwright (`tests/smoke/`) |
| Config files | `jest.config.*` (project), `playwright.config.*` (project) |
| Quick run command | `npm run test:components -- app/components/EmberGlass/rooms/__tests__` |
| Per-touched-file run | `npm run test:changed` |
| Smoke run command | `npx playwright test tests/smoke/rooms-tab.spec.ts` |
| Full suite (release only) | `npm test` (NOT for use in plan `<verify><automated>` per CLAUDE.md rule 8) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **ROOMS-01** | Aggregator returns correct devices per room from real hook outputs | unit (pure-function fixture) | `npm run test:unit -- app/components/EmberGlass/rooms/__tests__/lib/getDevicesForRoom.test.ts` | ❌ Wave 0 (new) |
| **ROOMS-01** | RoomsTab smoke — 6 RoomCards render with N/M counts | smoke | `npx playwright test tests/smoke/rooms-tab.spec.ts -g "ROOMS-01"` | ❌ Wave 3 (new) |
| **ROOMS-02** | RoomCard renders 3-col chip grid | unit | `npm run test:components -- RoomCard.test.tsx` | ❌ Wave 1 (new) |
| **ROOMS-02** | "+N" overflow chip renders when devices > 6 | unit | (same as above) | ❌ Wave 1 (new) |
| **ROOMS-02** | Empty state "Nessun dispositivo" renders when devices.length === 0 | unit | (same as above) | ❌ Wave 1 (new) |
| **ROOMS-02** | Smoke chip grid + overflow | smoke | `npx playwright test tests/smoke/rooms-tab.spec.ts -g "ROOMS-02"` | ❌ Wave 3 (new) |
| **ROOMS-03** | RoomSheet renders summary header + category sections | unit | `npm run test:components -- RoomSheet.test.tsx` | ❌ Wave 3 (new) |
| **ROOMS-03** | Smoke sheet opens with summary | smoke | `npx playwright test tests/smoke/rooms-tab.spec.ts -g "ROOMS-03"` | ❌ Wave 3 (new) |
| **ROOMS-04** | DeviceCard renders header + body | unit | `npm run test:components -- DeviceCard.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-04** | DevicePrimaryControl 5 dispatch branches | unit | `npm run test:components -- DevicePrimaryControl.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-04** | Smoke expanded device cards | smoke | `npx playwright test tests/smoke/rooms-tab.spec.ts -g "ROOMS-04"` | ❌ Wave 3 (new) |
| **ROOMS-05** | StoveBody renders 3 stat chips + power row | unit | `npm run test:components -- StoveBody.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-05** | ThermoBody/ValveBody renders DualTempReadout + 4 buttons | unit | `npm run test:components -- ThermoBody.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-05** | LightBody renders 2 sliders, color-temp disabled | unit | `npm run test:components -- LightBody.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-05** | PlugBody renders 2 stat chips | unit | `npm run test:components -- PlugBody.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-05** | SonosBody renders track + volume + 3 buttons | unit | `npm run test:components -- SonosBody.test.tsx` | ❌ Wave 2 (new) |
| **ROOMS-05** | TvBody / ShadeBody / CameraBody / SensorBody render visual elements | unit | (one per body) | ❌ Wave 2 (new) |
| **ROOMS-05** | Smoke type-specific bodies render | smoke | `npx playwright test tests/smoke/rooms-tab.spec.ts -g "ROOMS-05"` | ❌ Wave 3 (new) |
| **ROOMS-05** | Console errors during rooms-tab mount = 0 | smoke | (covered by `collectConsoleErrors` in every test) | ❌ Wave 3 (new) |
| **Wired commands** | StoveBody +/- buttons fire `handlePowerChange` | unit (mocked hook) | `npm run test:components -- StoveBody.test.tsx -t "wires"` | ❌ Wave 2 (new) |
| **Wired commands** | LightBody slider fires `handleBrightnessChange` after 250ms debounce | unit (timer-faked) | `npm run test:components -- LightBody.test.tsx -t "wires"` | ❌ Wave 2 (new) |
| **Wired commands** | SonosBody volume slider fires `handleSetZoneVolume` after 250ms debounce | unit (timer-faked) | `npm run test:components -- SonosBody.test.tsx -t "wires"` | ❌ Wave 2 (new) |
| **Wired commands** | ThermoBody ±0.5° fires `setRoomSetpoint` after 500ms debounce | unit (timer-faked) | `npm run test:components -- ThermoBody.test.tsx -t "wires"` | ❌ Wave 2 (new) |
| **Wired commands** | ThermoBody Eco / Auto fires `setHomeMode('away'/'schedule')` | unit | (same) | ❌ Wave 2 (new) |
| **Wired commands** | DevicePrimaryControl light/plug toggle fires correct hook | unit | `DevicePrimaryControl.test.tsx -t "wires"` | ❌ Wave 2 (new) |
| **RC discipline** | No `useMemo`/`useCallback` in `rooms/` | grep gate | `[ "$(grep -REn 'useMemo\|useCallback' app/components/EmberGlass/rooms/ \| wc -l)" -eq 0 ]` | — (existing tooling) |
| **A11y** | `<Pressable>` focus-visible outline on RoomCard, DeviceCard | unit (data-attr check) | `RoomCard.test.tsx -t "focusable"` | ❌ Wave 1 (new) |
| **Italian copy fidelity** | Frozen strings present | unit (text matchers) | `RoomCard.test.tsx -t "copy"` + per-body specs | ❌ Wave 1-3 (new) |

### Sampling Rate

- **Per task commit:** `npm run test:components -- app/components/EmberGlass/rooms/__tests__/<touched-file>` (CLAUDE.md rule 8 — scoped subset; NEVER `npm test` from agents).
- **Per wave merge:** `npm run test:components -- app/components/EmberGlass/rooms/__tests__` + `npx playwright test tests/smoke/rooms-tab.spec.ts`.
- **Phase gate:** Full suite green via release-gate CI (`npm run test:ci`) — out of scope for plan-level verify.

### Wave 0 Gaps

- [ ] `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` — pure aggregator (covers ROOMS-01).
- [ ] `app/components/EmberGlass/rooms/lib/rooms-config.ts` — ROOMS, ROOM_ALIASES, EXTRA_DEVICES, ICON_FOR, CATEGORY_ORDER, CATEGORY_LABEL.
- [ ] `app/components/EmberGlass/rooms/types.ts` — `RoomDevice`, `RoomConfig`, `DeviceKind`, `AggregatorState`.
- [ ] `app/components/EmberGlass/rooms/__tests__/lib/getDevicesForRoom.test.ts` — fixture-based pure-function tests.
- [ ] (Optional) Extract Playwright helpers (`collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`) to `tests/smoke/_helpers/` to avoid copy-paste with `dashboard-glass-cards.spec.ts`. Decision deferred per CONTEXT D-65.

## Plan Decomposition Recommendation

The phase decomposes into 4 clean waves with high parallelism in waves 1–2.

### Wave 0 — Foundations (1 plan, sequential)

- **179-01-types-and-aggregator-PLAN.md** — Wave 0
  - `rooms/types.ts` (RoomDevice, RoomConfig, DeviceKind, AggregatorState)
  - `rooms/lib/rooms-config.ts` (ROOMS, ROOM_ALIASES, EXTRA_DEVICES, ICON_FOR, CATEGORY_ORDER, CATEGORY_LABEL)
  - `rooms/lib/getDevicesForRoom.ts` (pure aggregator with §Aggregator Reconciliation field reads)
  - `rooms/__tests__/lib/getDevicesForRoom.test.ts` (fixture-based tests for each room name + each device kind + ROOM_ALIASES + unmatched-room drop)

### Wave 1 — Primitives + RoomCard + DeviceChip (2–3 plans, parallel)

- **179-02-primitives-PLAN.md** — Wave 1, parallel
  - `rooms/primitives/StatChip.tsx` + spec
  - `rooms/primitives/DualTempReadout.tsx` + spec
  - `rooms/primitives/SliderRow.tsx` + spec (with optional `onChange` for tap-to-seek)
  - `rooms/primitives/ControlRow.tsx` + spec
  - `rooms/primitives/MiniButton.tsx` + spec
- **179-03-room-card-and-chip-PLAN.md** — Wave 1, parallel
  - `rooms/DeviceChip.tsx` + spec
  - `rooms/RoomCard.tsx` + spec (uses GlassCard + CardHead; verifies +N overflow, empty state, count badge color)

### Wave 2 — Bodies + DeviceCard (5–6 plans, parallel)

- **179-04-device-card-and-primary-control-PLAN.md** — Wave 2, parallel
  - `rooms/DeviceCard.tsx` (Pressable as="div" wrap) + spec
  - `rooms/DevicePrimaryControl.tsx` (5 dispatch branches) + spec
  - `rooms/DeviceBody.tsx` (dispatcher) + spec
- **179-05-bodies-static-and-readonly-PLAN.md** — Wave 2, parallel
  - `rooms/bodies/StoveBody.tsx` + spec (wires `useStoveCommands`)
  - `rooms/bodies/PlugBody.tsx` + spec (read-only)
  - `rooms/bodies/SensorBody.tsx` + spec (read-only)
  - `rooms/bodies/CameraBody.tsx` + spec (no-op)
  - `rooms/bodies/TvBody.tsx` + spec (no-op)
  - `rooms/bodies/ShadeBody.tsx` + spec (no-op)
- **179-06-bodies-thermo-and-light-PLAN.md** — Wave 2, parallel
  - `rooms/bodies/ThermoBody.tsx` (exports both ThermoBody + ValveBody) + spec (self-fetches `useThermostatData` for homeId; debounced 500ms)
  - `rooms/bodies/LightBody.tsx` + spec (debounced 250ms; color-temp disabled)
- **179-07-body-sonos-PLAN.md** — Wave 2, parallel
  - `rooms/bodies/SonosBody.tsx` + spec (debounced 250ms; uses `handleSetZoneVolume`)

### Wave 3 — Sheet, Orchestrator, Route, Smoke Spec (2 plans, sequential)

- **179-08-room-sheet-and-orchestrator-PLAN.md** — Wave 3
  - `rooms/RoomSheet.tsx` + spec
  - `rooms/RoomsTab.tsx` (orchestrator, with §Aggregator Reconciliation in-place) + spec
  - `rooms/index.ts` (barrel)
  - `app/components/EmberGlass/index.ts` — append `export * from './rooms';`
  - `app/stanze/page.tsx` — single-line page mount
- **179-09-playwright-smoke-PLAN.md** — Wave 3
  - `tests/smoke/rooms-tab.spec.ts` (5 ROOMS-* scenarios, reuses helpers from `dashboard-glass-cards.spec.ts`)

### Wave gating + verify

Each plan ends with:
- Jest scoped run for the touched files.
- `grep -REn "useMemo\|useCallback" app/components/EmberGlass/rooms/ \| wc -l` must equal 0.
- TypeScript compile (`npx tsc --noEmit`) — no new errors.

Wave 3 final plan:
- `npx playwright test tests/smoke/rooms-tab.spec.ts` green.

## Project Constraints (from CLAUDE.md)

The CLAUDE.md file at the project root encodes 8 rules. All apply to Phase 179.

| Rule | Impact on Phase 179 |
|------|---------------------|
| 1. **NEVER break existing functionality** | Don't touch v15.0 `/rooms`, Phase 177 cards, Phase 178 sheets, any device hook (data or commands), any API route. |
| 2. **WAIT for user confirmation before version updates** | Phase 179 introduces zero new deps. Rule satisfied by design. |
| 3. **PREFER editing existing files over creating new** | Tension here — Phase 179 is new components. Resolution: only the `rooms/` namespace and `app/stanze/page.tsx` are new; barrel updates (one line in `EmberGlass/index.ts`) are edits, not creations. Smoke spec is a new file by necessity. |
| 4. **NEVER execute `npm run build` or `npm install`** | Plan agent must NOT include these in any task action. Verify steps stay in test/lint/typecheck. |
| 5. **ALWAYS create/update unit tests** | Every new component has a colocated `__tests__/*.test.tsx`. Wave 0 ships aggregator fixture tests. |
| 6. **USE design system → `/debug/design-system`** | The dashboard's existing `/debug/design-system-v2` page is Phase 174's. Phase 182 will catalog Phase 179 primitives. Phase 179 itself stays self-contained. |
| 7. **NEVER commit/push without explicit request** | Plan agents follow standard `gsd-sdk query commit` semantics; no implicit commits. |
| 8. **USE scoped test subsets in verification** | All `<verify><automated>` blocks use `npm run test:components --` / `test:changed` / `test:quick` / `test:unit` / `test:api` / `test:pages`. NEVER `npm test` alone. The full suite is reserved for `test:ci`. |

## Sources

### Primary (HIGH confidence)
- `app/components/EmberGlass/Sheet.tsx` (Phase 175 — Sheet primitive API)
- `app/components/EmberGlass/Pressable.tsx` (Phase 175 — Pressable primitive API)
- `app/components/EmberGlass/GlassCard.tsx` (Phase 177 — supports `onOpen` → auto-Pressable)
- `app/components/EmberGlass/CardHead.tsx` (Phase 177 — `<CardHead Icon label tone right>`)
- `app/components/EmberGlass/InlineToggle.tsx` (Phase 177 — `<InlineToggle on color onChange>`)
- `app/components/EmberGlass/sheets/ClimateSheet.tsx` (Phase 178 — verbatim self-fetch + zones merge + setRoomMode pattern)
- `app/components/EmberGlass/sheets/SonosSheet.tsx` (Phase 178 — volume debounce + handleSetZoneVolume pattern)
- `app/components/EmberGlass/sheets/PlugsSheet.tsx` (Phase 178 — Tuya field rename pattern)
- `app/components/EmberGlass/sheets/StoveSheet.tsx` (Phase 178 — useStoveData params)
- `app/components/devices/stove/hooks/useStoveData.ts` (real return shape)
- `app/components/devices/stove/hooks/useStoveCommands.ts` (real signatures)
- `app/components/devices/thermostat/hooks/useThermostatData.ts` (real merge logic)
- `app/components/devices/thermostat/hooks/useThermostatCommands.ts` (real signatures + mode union)
- `app/components/devices/lights/hooks/useLightsData.ts` (real return shape)
- `app/components/devices/lights/hooks/useLightsCommands.ts` (`handleBrightnessChange(groupId, brightness: string)` verified)
- `app/components/devices/sonos/hooks/useSonosFullData.ts` (return shape)
- `app/components/devices/sonos/hooks/useSonosCommands.ts` (handleSetVolume vs handleSetZoneVolume)
- `app/components/devices/tuya/hooks/useTuyaData.ts` + `useTuyaCommands.ts` (return shape + togglePlug)
- `types/hueProxy.ts` (HueLight + HueGroup field shapes)
- `types/netatmoProxy.ts` (NetatmoProxyRoom, NetatmoProxyModule, SetRoomThermpointRequest mode union)
- `types/sonosProxy.ts` (SonosZoneResponse, coordinator_uid)
- `types/tuyaProxy.ts` (TuyaPlug field names)
- `app/page.tsx` + `app/layout.tsx` (Auth0 wrap pattern via ClientProviders)
- `app/hooks/useDebounce.ts` (signature)
- `tests/smoke/dashboard-glass-cards.spec.ts` (Phase 177/178 spec — reusable helpers)
- `tests/auth.setup.ts` (Auth0 storage state)
- `next.config.ts` (`reactCompiler: true`)
- `package.json` (deps incl. `lucide-react ^0.562.0`, `babel-plugin-react-compiler ^1.0.0`)
- `node_modules/lucide-react/dist/esm/icons/*.js` (filename inspection — all 23 icons verified)
- `.planning/phases/179-rooms-tab-redesign/179-CONTEXT.md` (locked decisions D-01..D-69)
- `.planning/phases/179-rooms-tab-redesign/179-UI-SPEC.md` (visual contract)
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-VALIDATION.md` (react-compiler-healthcheck substitute documented)
- `.planning/REQUIREMENTS.md` (ROOMS-01..05)
- `.planning/ROADMAP.md` (Phase 179 SC + dependencies on 175 + 178)
- `.planning/inbox/ember-glass-design/project/components/rooms.jsx` lines 1–606 (PRIMARY visual contract)

### Secondary (MEDIUM confidence)
- Cross-verified Phase 177/178 InlineToggle stop-propagation note (relevant if DeviceCard had a card-level click; here it doesn't because of D-24).
- Cross-verified Phase 178 SonosSheet uses `handleSetZoneVolume` (verified in source) over CONTEXT D-31's `handleSetVolume` recommendation.

### Tertiary (LOW confidence)
- None. All findings have at least one verified codebase reference.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep verified in `package.json` and / or filesystem.
- Architecture: HIGH — composition of Phase 174/175/177/178 primitives, all of which are in production.
- Aggregator field reconciliation: HIGH — every field traced to a verified source file.
- Pitfalls: HIGH — 13 pitfalls documented, each with reproducible warning signs.
- Italian copy fidelity: HIGH — bundle is the source of truth and is copied verbatim per CONTEXT.
- Test paths: HIGH — Pitfall 12 surfaces the `tests/smoke/` vs `tests/playwright/` mismatch.
- React Compiler healthcheck: HIGH — Pitfall 11 surfaces the missing CLI; substitute is documented in Phase 177-VALIDATION.md.

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days; codebase evolves slowly within EmberGlass v2 phase set).

---

*Phase: 179-rooms-tab-redesign*
*Research date: 2026-04-29*
