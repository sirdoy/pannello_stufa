# Phase 179: Rooms Tab Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 179-rooms-tab-redesign
**Mode:** `--auto --chain` — single-pass autonomous resolution; no AskUserQuestion calls.
**Areas discussed:** File layout & namespace; Static room config; Device aggregator; RoomCard; RoomSheet; DeviceCard / DevicePrimaryControl / DeviceBody; Shared primitives; Commands hook usage; Loading + error; Italian copy; Press behavior; Tests; React Compiler discipline; Route mount; Index/barrel exports.

---

## File layout & namespace

| Option | Description | Selected |
|--------|-------------|----------|
| `app/components/EmberGlass/rooms/` | Sibling to `cards/` and `sheets/` namespaces (Phase 177/178 precedent). | ✓ |
| `app/components/RoomsTab/` | Top-level under `app/components/`, breaks EmberGlass grouping. | |
| `app/rooms-tab/` | Co-locate with route. | |

**[auto] Selected: `app/components/EmberGlass/rooms/` (recommended default — matches Phase 177/178 namespace convention).**
**Notes:** D-01 in CONTEXT. Inline-style + `var(--token)` rule (D-02) applies.

---

## Static room config

| Option | Description | Selected |
|--------|-------------|----------|
| Static 6-room ROOMS + ROOM_ALIASES + EXTRA_DEVICES | Bundle parity. | ✓ |
| Read room list from `/api/rooms` (v15.0 registry) | Live source. | |
| Hybrid (static fallback, registry override when present) | Most flexible. | |

**[auto] Selected: Static 6-room ROOMS + bundle aliases + bundle EXTRA_DEVICES (recommended default — matches bundle, ships fastest, defers registry-source decision to a follow-up phase).**
**Notes:** D-05..D-09 in CONTEXT. Plan agent verifies real device hook room-name strings against ROOM_ALIASES coverage.

---

## Device aggregator

| Option | Description | Selected |
|--------|-------------|----------|
| Pure function `getDevicesForRoom(state, roomName)` called per render | Bundle parity, React Compiler memoizes. | ✓ |
| Memoized aggregator with `useMemo` | Manual perf optimization. | |
| Async aggregator with caching layer | Heavyweight; unnecessary for ≤6 rooms × ≤15 devices. | |

**[auto] Selected: Pure function (recommended default — matches Phase 71/95/178 D-33 React Compiler discipline; tiny work).**
**Notes:** D-10..D-17 in CONTEXT. Tuya plugs hardcoded to "Cucina" (D-14) until registry-join phase.

---

## RoomCard

| Option | Description | Selected |
|--------|-------------|----------|
| Compose existing GlassCard + CardHead, add 3-col chip grid | Reuses Phase 177 primitives. | ✓ |
| Bespoke card without GlassCard | Bundle visuals diverge from card baseline. | |
| Add scene-strip overlay | Out of scope. | |

**[auto] Selected: Compose existing primitives (recommended default — D-18..D-19).**
**Notes:** Wraps in `<Pressable>` (Phase 175 SC-#1 — D-19, D-61).

---

## RoomSheet

| Option | Description | Selected |
|--------|-------------|----------|
| One shared sheet at orchestrator + `selectedRoomName` state | One mounted sheet at a time, prop-driven. | ✓ |
| Six per-card sheets each with own `useState<boolean>` (Phase 178 pattern) | More state, six mounted sheets. | |

**[auto] Selected: One shared sheet (recommended default — D-21..D-22). Diverges from Phase 178 because there is one rooms-tab orchestrator owning state for six rooms.**
**Notes:** RoomSheet wraps the Phase 175 `<Sheet>` primitive internally.

---

## DeviceCard / DevicePrimaryControl / DeviceBody

| Option | Description | Selected |
|--------|-------------|----------|
| 10 type-specific bodies + per-kind primary control + composed DeviceCard | Bundle parity, ROOMS-04/05 spec. | ✓ |
| Single body component with internal `kind` switch | Smaller file count but huge component. | |
| Per-device-class component without dispatcher | Lose discriminated union safety. | |

**[auto] Selected: Composed dispatcher + 10 bodies (recommended default — D-23..D-35).**
**Notes:** Thermo and Valve share one body (D-28). Real wiring where API exists; visual stubs where it doesn't (TV / shade / camera / sensor / color-temp). DeviceCard wraps in `<Pressable as="div">` for SC-#1 strict compliance (D-61).

---

## Shared primitives

| Option | Description | Selected |
|--------|-------------|----------|
| New `rooms/primitives/` namespace (StatChip, DualTempReadout, SliderRow, ControlRow, MiniButton) | Bundle parity, distinct from sheets/primitives. | ✓ |
| Reuse Phase 178 sheets primitives (Stepper, Slider, RadialDial, etc.) | Different shapes per bundle; mismatched APIs. | |
| Inline atomics (no separate primitive files) | Loses reusability. | |

**[auto] Selected: New `rooms/primitives/` namespace (recommended default — D-36..D-37). Bundle's room SliderRow is read-only gradient bar (different from sheets Slider's interactive `<input type=range>`).**
**Notes:** SliderRow is interactive when `onChange` provided (tap-to-seek); otherwise pure presentational.

---

## Commands hook usage

| Option | Description | Selected |
|--------|-------------|----------|
| Per-body imports of existing commands hooks | Bodies own their handlers; no orchestrator coupling. | ✓ |
| Centralize at orchestrator and pass via React context | Single hook-tree. | |
| Pass via props from RoomsTab → RoomSheet → DeviceCard → Body | Heavy prop-drilling. | |

**[auto] Selected: Per-body imports (recommended default — D-38..D-40). Mirrors Phase 178 self-fetch pattern.**
**Notes:** No new commands hooks created in this phase.

---

## Loading + error

| Option | Description | Selected |
|--------|-------------|----------|
| First-load skeleton (full grid) + per-card empty + sheet-level error | Phase 178 D-26..D-27 mirror. | ✓ |
| Per-room independent loading states | More complex orchestration. | |
| Block until all hooks ready | Bad UX. | |

**[auto] Selected: First-load skeleton + sheet-level error (recommended default — D-45..D-47).**

---

## Italian copy

| Option | Description | Selected |
|--------|-------------|----------|
| Verbatim from bundle, frozen at decision time | No paraphrasing risk; downstream parity. | ✓ |
| Italian copy from project glossary | Glossary doesn't exist for these strings. | |
| Generated at plan time | Risk of drift. | |

**[auto] Selected: Bundle verbatim (recommended default — D-48..D-60).**

---

## Press behavior (Phase 175 SC-#1)

| Option | Description | Selected |
|--------|-------------|----------|
| Wrap RoomCard + DeviceCard in `<Pressable>` (strict reading) | Audit-safe. | ✓ |
| Wrap only RoomCard (interactivity-based reading) | Skip DeviceCard wrap. | |
| Skip both wraps (rely on `:active`) | Fails SC-#1 strict audit. | |

**[auto] Selected: Wrap both (recommended default — D-61). DeviceCard uses `<Pressable as="div">` with no `onClick`.**

---

## Tests

| Option | Description | Selected |
|--------|-------------|----------|
| Per-component Jest specs + new Playwright spec file | Standard coverage, mirrors Phase 178 D-29..D-31 with new file (vs extension). | ✓ |
| Extend Phase 177 dashboard-glass-cards.spec.ts | One file balloons. | |
| Smoke-only (Playwright) | Insufficient coverage. | |

**[auto] Selected: Per-component Jest + new Playwright file `tests/playwright/rooms-tab.spec.ts` (recommended default — D-63..D-65).**

---

## React Compiler discipline

| Option | Description | Selected |
|--------|-------------|----------|
| No `useMemo` / `useCallback`; rely on React Compiler 1.0 | Phase 71/95/178 D-33 standard. | ✓ |
| Manual `useMemo` for aggregator | Premature opt; conflicts with discipline. | |
| Disable React Compiler for `rooms/` namespace | No reason. | |

**[auto] Selected: No manual memoization (recommended default — D-66..D-67). Plan must include `npx react-compiler-healthcheck` in `<verify><automated>`.**

---

## Route mount

| Option | Description | Selected |
|--------|-------------|----------|
| New route `/stanze` (Italian, NAV-02 label) | Avoids `/rooms` collision; matches Phase 181 nav label. | ✓ |
| Replace `/rooms` (legacy admin-CRUD) | Breaks v15.0 page. | |
| `/rooms-tab` (English-prefixed) | Doesn't match NAV-02 label. | |
| Mount only as a tab pane (no route) | Phase 181 hasn't shipped tab bar yet; needs reachable URL. | |

**[auto] Selected: `/stanze` (recommended default — D-04). Legacy `/rooms` admin-CRUD page UNTOUCHED.**

---

## Index / barrel exports

| Option | Description | Selected |
|--------|-------------|----------|
| Full re-export of orchestrator + components + primitives + lib + types | Phase 178 precedent. | ✓ |
| Default export only (RoomsTab) | Loses primitive reuse for Phase 182. | |
| No barrel | Forces deep-path imports. | |

**[auto] Selected: Full barrel (recommended default — D-68..D-69).**

---

## Claude's Discretion

The following items are flagged "Claude's Discretion" in CONTEXT.md `<decisions>`. Plan agent finalizes:

- DeviceCard Pressable wrap form (`<div>` vs skip).
- MiniButton Pressable wrap (recommend skip — non-glass).
- SliderRow interactivity (recommend interactive when `onChange` provided).
- Thermo/Valve body file split or shared (recommend shared).
- Route name `/stanze` vs `/rooms-tab` (recommend `/stanze`).
- Commands hook orchestration (recommend per-body imports).
- StatChip `tone` prop kept or dropped (recommend kept for symmetry).
- Brightness slider per-light vs per-group (recommend per-group via existing API).
- RoomCard count badge color `room.tone` vs `var(--accent)` (recommend `room.tone` per bundle).
- Unmatched-room `console.warn` dev-only gate (recommend yes — `process.env.NODE_ENV === 'development'`).

## Deferred Ideas

See CONTEXT.md `<deferred>` for the complete list, including:

- Real Tuya plug → room registry join.
- Real per-light brightness + color-temp endpoints.
- Real shade/TV/humidity/camera-stream proxies.
- DIRIGERA sensors integration into rooms.
- v15.0 `/rooms` settings-CRUD migration to `/registry/rooms`.
- Phase 181 (glass tab bar wiring) and Phase 182 (DSREF v2 catalog).
- Per-light scene activation in RoomSheet (scenes stay in LightsSheet — Phase 178).
- Aggregator → live rooms-registry source.

## Reviewed Todos (not folded)

None — `gsd-sdk query todo.match-phase 179` returned 0 matches at context-gathering time.
