---
phase: "145"
plan: "02"
subsystem: types
tags: [websocket, sonos, dirigera, registry-metadata]
dependency_graph:
  requires: []
  provides:
    - SonosDeviceResponse.custom_name
    - SonosDeviceResponse.device_type
    - DirigeraSensor.device_type
  affects:
    - types/websocket.ts (imports SonosDeviceResponse and DirigeraSensor)
    - hooks/useSonosData.ts (consumes SonosDeviceResponse)
    - hooks/useDirigeraData.ts (consumes DirigeraSensor)
tech_stack:
  added: []
  patterns:
    - optional registry metadata fields on proxy response interfaces
    - interface extension inheritance (SonosDeviceDetailResponse, ContactSensor, MotionSensor)
key_files:
  created: []
  modified:
    - types/sonosProxy.ts
    - types/dirigeraProxy.ts
decisions:
  - "Add fields to base interfaces only — extended interfaces inherit automatically"
  - "custom_name on DirigeraSensor kept as string (non-nullable) to avoid breaking consumers"
metrics:
  duration: "5 minutes"
  completed: "2026-03-28"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
requirements:
  - WSTYPE-04
  - WSTYPE-05
  - WSTYPE-11
  - WSTYPE-12
---

# Phase 145 Plan 02: Add Registry Metadata Fields to Sonos and DIRIGERA Types

**One-liner:** Added `custom_name?` and `device_type?` to `SonosDeviceResponse` and `device_type?` to `DirigeraSensor` to align WS-consumed proxy shapes with registry metadata.

## Summary

Two proxy type files received optional registry metadata fields so that WS consumers receive the full shape documented in `docs/api/websocket.md`. Fields were added to base interfaces, allowing derived interfaces (`SonosDeviceDetailResponse`, `ContactSensor`, `MotionSensor`) to inherit them automatically without modification.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add custom_name and device_type to SonosDeviceResponse | cd379aa4 | types/sonosProxy.ts |
| 2 | Add device_type to DirigeraSensor | ad9a8b50 | types/dirigeraProxy.ts |

## Changes Made

### types/sonosProxy.ts

Added to `SonosDeviceResponse` (after `is_coordinator: boolean`):

```typescript
custom_name?: string | null;   // registry override for display name
device_type?: string | null;   // registry device type slug
```

`SonosDeviceDetailResponse extends SonosDeviceResponse` — inherits automatically.

### types/dirigeraProxy.ts

Added to `DirigeraSensor` (after `last_seen: string | null`):

```typescript
device_type?: string | null;   // registry device type slug, null if not set
```

`custom_name: string` (non-nullable) was preserved unchanged. `ContactSensor` and `MotionSensor` inherit the new field via `extends DirigeraSensor`.

## Verification

- `grep -n "custom_name\|device_type" types/sonosProxy.ts` — 2 lines in SonosDeviceResponse only
- `grep -n "device_type" types/dirigeraProxy.ts` — 1 line in DirigeraSensor only
- `grep "custom_name: string;" types/dirigeraProxy.ts` — present, non-nullable preserved
- `npx tsc --noEmit` — exits 0

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- types/sonosProxy.ts: modified (cd379aa4)
- types/dirigeraProxy.ts: modified (ad9a8b50)
- tsc --noEmit: exits 0
