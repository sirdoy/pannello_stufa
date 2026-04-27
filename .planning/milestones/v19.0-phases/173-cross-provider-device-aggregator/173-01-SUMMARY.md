---
phase: 173
plan: 01
subsystem: types
tags: [types, aggregator, provider, foundation, COMMON-02]
requires: []
provides:
  - "ProviderType literal union (8 providers)"
  - "Device interface (3 required + 5 optional fields)"
  - "DeviceAggregatorError"
  - "DeviceAggregatorResponse (pagination + errors[])"
affects:
  - ".planning/phases/173-cross-provider-device-aggregator/173-02-PLAN.md (consumer: route handler)"
  - ".planning/phases/173-cross-provider-device-aggregator/173-03-PLAN.md (consumer: tests)"
tech_stack:
  added: []
  patterns:
    - "Type module at project-root /types/ (NOT /lib/types/), per project convention"
    - "Slim core + optional fields shape (D-01); absent fields OMITTED, not null"
    - "Literal-union mirror of WS Topic to keep provider set in lockstep"
key_files:
  created:
    - types/devices.ts
  modified: []
decisions:
  - id: D-01
    note: "Slim core + optional fields. Required: id, name, provider_type. Optional: type, ip, mac, status, room. Absent optional fields OMITTED (not null) for payload size + TS narrowing precision."
  - id: D-02
    note: "Device.id is composite `{provider_type}:{native_id}` (e.g. `fritzbox:AA:BB:CC:DD:EE:FF`, `raspi:host`). Globally unique across providers."
  - id: D-03
    note: "ProviderType is 1 of 8 literals matching the WS Topic union: fritzbox, hue, sonos, netatmo, dirigera, tuya, raspi, thermorossi."
  - id: D-13
    note: "DeviceAggregatorResponse extends PaginatedResponse<Device> with errors[] for partial-failure surfacing (HTTP stays 200). Multi-item providers contribute zero items + an error entry on failure; single-item providers (raspi, thermorossi) emit a status=0 stub item with NO error entry."
metrics:
  duration_seconds: 95
  duration_human: "~2 min"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
  lines_added: 76
  lines_deleted: 0
  completed_date: "2026-04-25"
---

# Phase 173 Plan 01: Cross-Provider Device Aggregator Types Summary

Type foundation for the cross-provider `/api/v1/devices` aggregator: 4 exports (`ProviderType`, `Device`, `DeviceAggregatorError`, `DeviceAggregatorResponse`) co-located in a single new module `types/devices.ts` so Plan 02's route handler and Plan 03's Jest suite can consume them without `as any` workarounds.

## What Was Built

### `types/devices.ts` (NEW)

A 76-line type module with 4 exports:

1. **`ProviderType`** — 8-string literal union: `'fritzbox' | 'hue' | 'sonos' | 'netatmo' | 'dirigera' | 'tuya' | 'raspi' | 'thermorossi'`. Mirrors the WebSocket `Topic` union in `types/websocket.ts:29-31` byte-for-byte (same 8 providers, same set semantics).

2. **`Device`** — Aggregated device shape with **3 required** fields (`id: string`, `name: string`, `provider_type: ProviderType`) and **5 optional** fields (`type?`, `ip?`, `mac?`, `status?: 0 | 1`, `room?`). Optional fields are documented as OMITTED-when-absent (not `null`) so `if (device.ip)` narrows correctly without explicit null checks.

3. **`DeviceAggregatorError`** — Per-provider partial-failure entry: `{ provider_type: ProviderType; message: string }`. JSDoc records the asymmetry between multi-item providers (rejection → 0 items + error entry) and single-item providers (rejection → status=0 stub item + NO error entry) per RESEARCH.md Pitfall 4.

4. **`DeviceAggregatorResponse`** — Final response shape: `{ items: Device[]; total_count; limit; offset; errors: DeviceAggregatorError[] }`. Extends the `PaginatedResponse<T>` shape (from `types/common.ts`) with `errors[]` for partial-failure surfacing (D-13). HTTP status stays 200 even when `errors[]` is non-empty.

### File location rationale

Project convention is `/types/{module}.ts` at the repo root (verified via `types/common.ts`, `types/registry.ts`, `types/rooms.ts`, `types/websocket.ts`, etc.) — NOT `/lib/types/`. The plan locks this explicitly (D-01 directive).

## Verification Performed

- `grep -c '^export' types/devices.ts` → **4** (matches acceptance criterion)
- 8 provider literal strings present in `ProviderType` union (matches acceptance criterion)
- `grep -c 'id: string' types/devices.ts` → **1**
- `grep -c 'provider_type: ProviderType' types/devices.ts` → **2** (Device + DeviceAggregatorError)
- `grep -c 'errors: DeviceAggregatorError\[\]' types/devices.ts` → **1**
- `grep -c 'type?:' types/devices.ts` → **1**
- `grep -c 'status?: 0 | 1' types/devices.ts` → **1**
- `tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck --strict types/devices.ts` → **exit 0, no errors** (file compiles cleanly in isolation)

All 9 acceptance criteria pass.

## Deviations from Plan

None — plan executed exactly as written. Action block was followed verbatim; copy-ready snippet from PLAN.md was written byte-for-byte to `types/devices.ts`.

## Authentication Gates

None — type-only module, no I/O, no runtime, no auth surface.

## Known Stubs

None — module is self-contained type declarations; no placeholders, no TODO/FIXME, no empty data flows.

## Threat Flags

None — type-only file. Threat register entries T-173-05 (information disclosure on `ProviderType` literal names) and T-173-06 (tampering on `Device` shape) are both `accept` per the plan's threat model:
- The 8 provider names are already publicly visible in `types/websocket.ts`, `app/health/route.ts`, and the deployed UI; re-exporting them as a type union leaks no new information.
- Type declarations have no runtime mutation surface; tampering is gated by code review + branch protection.

ASVS L1 not applicable.

## Downstream Consumers (informational)

This file is imported by:

- **Plan 02** — `app/api/v1/devices/route.ts` will `import type { Device, ProviderType, DeviceAggregatorError, DeviceAggregatorResponse } from '@/types/devices'` to type the aggregator handler and its response.
- **Plan 03** — Jest suite for the aggregator route will import the same types for fixture typing and response assertions.

No other files in the codebase reference `types/devices.ts` yet (verified at write time — file is new).

## Commits

- `22b8d8b0` — `feat(173-01): add cross-provider device aggregator types`

## Self-Check: PASSED

- `types/devices.ts` exists ✓
- Commit `22b8d8b0` present in `git log --oneline` ✓
- All 9 acceptance criteria pass ✓
- TypeScript compiles cleanly (`tsc --noEmit` exit 0) ✓
- No STATE.md / ROADMAP.md modifications (worktree mode) ✓
