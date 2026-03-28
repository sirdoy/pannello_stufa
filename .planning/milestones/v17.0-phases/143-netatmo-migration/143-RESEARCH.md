# Phase 143: Netatmo Migration - Research

**Researched:** 2026-03-27
**Domain:** WebSocket migration + hook extraction + payload adapter (Netatmo)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hook Extraction (prerequisite — unique to Netatmo)**
- D-01: Unlike all other providers (stove, network, lights, sonos, dirigera), Netatmo has NO dedicated data hook. ThermostatCard.tsx and thermostat/page.tsx both fetch data independently with inline `useAdaptivePolling` / `setInterval`. A `useThermostatData` hook must be extracted FIRST before WS migration.
- D-02: The hook should be created at `app/components/devices/thermostat/hooks/useThermostatData.ts` following the directory convention of other provider hooks.
- D-03: The extracted hook encapsulates: connection check (health), topology fetch (homesdata), status polling (homestatus), staleness tracking. Both ThermostatCard and thermostat/page.tsx consume it.

**WS Payload Adapter**
- D-04: The WS `netatmo` topic sends the raw Netatmo cloud API `homestatus` response as `Record<string, unknown>`. The envelope is `{ body: { home: { id, rooms: [...], modules: [...] } }, status: "ok", time_server: number }`. An adapter function maps this into the existing internal interfaces used by ThermostatCard and page.tsx.
- D-05: The adapter extracts `body.home.rooms` and `body.home.modules` from the raw WS payload and maps them to the existing `RoomStatus[]` and `ModuleStatus[]` shapes used by the components. Field mapping: `therm_measured_temperature` → `temperature`, `therm_setpoint_temperature` → `setpoint`, `therm_setpoint_mode` → `mode`, `heating_power_request > 0` → `heating`.
- D-06: If the WS payload is `null` (Netatmo cloud hasn't responded since server start), the adapter returns null and the hook falls back to HTTP polling.

**Data Scope (WS vs HTTP)**
- D-07: `homestatus` (room temperatures, heating status, module battery/reachable) — via WS as primary, HTTP polling as fallback.
- D-08: `homesdata` (topology: home structure, rooms list, module list, schedules) — remains as HTTP side-fetch. Fetched on mount only.
- D-09: Schedules (active schedule, switch schedule, sync schedule) — remain as HTTP via existing `useScheduleData` hook and API routes. Not part of WS payload.
- D-10: Health check (connection status) — remains as HTTP side-fetch on mount.
- D-11: Calibration, mode changes, temperature setpoints — remain as HTTP POST commands (WS is read-only push per spec).

**Fallback Trigger (carried from Phase 140/141/142)**
- D-12: Same pattern as all other providers: `readyState === OPEN` → WS primary, polling suppressed via `interval: isWsConnected ? null : existingInterval`. When WS disconnects, polling activates immediately.
- D-13: `alwaysActive: false` preserved — thermostat is non-safety-critical (matches current ThermostatCard behavior).

**Side-Fetch Pattern (carried from Phase 140)**
- D-14: Side-fetches (topology/homesdata, health) fire on mount. Status side-fetches are not needed — WS provides the homestatus data directly.
- D-15: Side-fetches use ref pattern to avoid stale closures in WS useEffect callbacks.

**Staleness Handling (carried from Phase 140/141/142)**
- D-16: WS messages: `isStale=false`, use message `ts` field as freshness indicator. HTTP polling: continue using existing staleness logic.

**WS Subscription Pattern (carried from Phase 140/141/142)**
- D-17: `subscribe('netatmo', handleMessage)` in useEffect with `unsubscribe()` cleanup.
- D-18: Ref pattern for side-effect functions to avoid stale closures.

### Claude's Discretion
- Whether the adapter is a standalone utility function or inline in the handleMessage callback
- How to structure the hook's return type to serve both ThermostatCard (summary view) and page.tsx (full room list)
- Whether topology should be re-fetched after WS data updates or only on mount
- Test mocking approach for WS subscribe/unsubscribe
- Whether to preserve the page.tsx `setInterval(30000)` as-is for fallback or migrate to `useAdaptivePolling`

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-13 | `useThermostatData` riceve dati Netatmo via WebSocket come canale primario | WS `netatmo` topic delivers `Record<string, unknown>` (raw Netatmo cloud API homestatus). Adapter maps `body.home.rooms/modules` to internal types. subscribe/unsubscribe pattern from Phase 140-142 established. |
| MIG-14 | `useThermostatData` fallback automatico a polling HTTP se WebSocket non disponibile | `isWsConnected ? null : 60000` interval on `useAdaptivePolling`. When WS OPEN, polling suppressed. When WS closes, polling activates immediately. alwaysActive:false for non-safety-critical. |
</phase_requirements>

---

## Summary

Phase 143 migrates Netatmo thermostat data from HTTP polling to WebSocket as the primary data channel. Unlike all five previously migrated providers (stove, network, lights, Sonos, DIRIGERA), Netatmo currently has no dedicated data hook — both `ThermostatCard.tsx` and `thermostat/page.tsx` contain inline data-fetching logic. This makes the migration a two-step operation: first extract `useThermostatData`, then add WS subscription with HTTP fallback.

The core technical challenge unique to this phase is the WS payload adapter. All other providers receive typed or semi-typed payloads from the WS manager. The `netatmo` topic delivers the raw Netatmo cloud API `homestatus` response as `Record<string, unknown>` — an envelope with `body.home.rooms[]` and `body.home.modules[]` each containing Netatmo-specific field names (`therm_measured_temperature`, `therm_setpoint_temperature`, `heating_power_request`) that must be mapped to the internal `RoomStatus` and `ModuleStatus` shapes used by ThermostatCard and page.tsx.

The HTTP path (the existing `GET /api/netatmo/homestatus` Next.js route) performs significant server-side enrichment: it joins topology data from Firebase, computes battery classification, adds stove-sync metadata, and maps `therm_setpoint_temperature` → `setpoint`, `heating_power_request > 0` → `heating`. The WS adapter must replicate this field mapping client-side, making it the most complex adapter across all 6 providers.

**Primary recommendation:** Extract `useThermostatData` in Plan 1 (hook shell + HTTP path working end-to-end for both consumers), then add WS subscription + adapter in Plan 2. Use the DIRIGERA pattern (conditional subscribe guard + in-message derivation) as the closest structural reference.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-use-websocket (via useWebSocketContext) | Already installed | WS subscribe/unsubscribe | Shared WS manager from Phase 139 — no new library |
| useAdaptivePolling | internal | HTTP polling fallback | Existing utility used in ThermostatCard today |
| useDeviceStaleness | internal | Staleness tracking | Already in ThermostatCard today |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useWebSocketContext | internal | Access to subscribe/unsubscribe/readyState | Entry point for all WS providers |
| ReadyState | internal (from useWebSocketManager) | WS state enum | Guard conditional subscription (Phase 141 pattern) |
| useVisibility | internal | Drives interval switching (60s visible, 300s hidden) | Used in DIRIGERA and network hooks |
| useScheduleData | internal | Schedule management | Remains independent — NOT migrated |
| useRetryableCommand | internal | Command retry | Remains in ThermostatCard for mutations |

**No new npm packages needed.** All infrastructure already in place from Phase 139-142.

---

## Architecture Patterns

### Recommended Project Structure
```
app/components/devices/thermostat/
├── hooks/
│   └── useThermostatData.ts    (NEW — mirrors dirigera/hooks/useDirigeraData.ts)
├── ThermostatCard.tsx           (MODIFIED — consume useThermostatData, remove inline fetching)
└── ...
app/thermostat/
└── page.tsx                     (MODIFIED — consume useThermostatData, remove inline setInterval)
```

### Pattern 1: Hook Extraction (Plan 1)

**What:** Create `useThermostatData.ts` that centralises all HTTP data fetching currently scattered across ThermostatCard and page.tsx. The hook returns a unified shape serving both consumers.

**When to use:** Always — prerequisite before WS migration.

**Structure mirrors useDirigeraData pattern:**
```typescript
// app/components/devices/thermostat/hooks/useThermostatData.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { useDeviceStaleness } from '@/lib/hooks/useDeviceStaleness';
import type { NetatmoData as WsNetatmoData } from '@/types/websocket';

export interface UseThermostatDataReturn {
  connected: boolean;
  topology: NetatmoTopology | null;
  status: NetatmoStatus | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  staleness: ReturnType<typeof useDeviceStaleness>;
  refetch: () => Promise<void>;
}
```

**Key design decision (Claude's discretion):** The return type must serve BOTH consumers:
- ThermostatCard needs: `connected`, `topology`, `status`, `loading`, `error`, `staleness`, `stale`, `refetch`
- page.tsx needs: same fields + full room list derivation (which it currently computes locally)

The hook returns the raw `topology` and `status` objects; each consumer continues deriving `roomsWithStatus` locally (no change to existing merge/filter logic). This is the minimal-change approach.

### Pattern 2: WS Subscription with Adapter (Plan 2)

**What:** Add WS subscription to the hook. The `handleMessage` callback receives raw `Record<string, unknown>` and adapts it to `NetatmoStatus`.

**Phase 141 conditional guard pattern (MANDATORY):**
```typescript
useEffect(() => {
  if (!isWsConnected) return; // guard — prevents dead subscriptions when CLOSED

  const handleMessage = (raw: unknown) => {
    const adapted = adaptNetatmoWsPayload(raw as Record<string, unknown>);
    if (adapted === null) return; // D-06: null payload → keep polling
    setStatus(adapted);
    setStale(false);
    setLoading(false);
    setError(null);
  };

  subscribe('netatmo', handleMessage);
  return () => { unsubscribe('netatmo', handleMessage); };
}, [isWsConnected, subscribe, unsubscribe]);
```

**Polling suppression:**
```typescript
useAdaptivePolling({
  callback: fetchStatus,
  interval: isWsConnected ? null : interval, // D-12
  alwaysActive: false,                        // D-13
  immediate: true,
  initialDelay: 50,
});
```

### Pattern 3: WS Payload Adapter

**What:** Pure function that maps raw `Record<string, unknown>` WS payload to the `NetatmoStatus` shape used by ThermostatCard and page.tsx.

**Critical field mapping (per D-05):**

WS payload envelope:
```json
{
  "body": {
    "home": {
      "id": "...",
      "rooms": [
        {
          "id": "3456789",
          "therm_measured_temperature": 21.4,
          "therm_setpoint_temperature": 20.0,
          "therm_setpoint_mode": "schedule",
          "heating_power_request": 0
        }
      ],
      "modules": [
        {
          "id": "09:00:00:aa:bb:cc",
          "type": "NATherm1",
          "battery_state": "high",
          "reachable": true,
          "rf_strength": 82
        }
      ]
    }
  },
  "status": "ok",
  "time_server": 1773330200
}
```

Target `NetatmoStatus` shape (as used by current components):
```typescript
interface RoomStatus {
  room_id: string;
  temperature?: number;
  setpoint?: number;       // mapped from therm_setpoint_temperature
  mode?: string;           // mapped from therm_setpoint_mode
  heating?: boolean;       // mapped from heating_power_request > 0
  // stoveSync fields NOT in WS payload — omit (no stove sync for WS path)
}

interface ModuleStatus {
  id: string;
  battery_state?: string;
  battery_level?: number;
  reachable?: boolean;
  rf_strength?: number;
}

interface NetatmoStatus {
  rooms: RoomStatus[];
  modules: ModuleStatus[];
  hasLowBattery: boolean;
  hasCriticalBattery: boolean;
  lowBatteryModules: ModuleStatus[];
  mode?: string;
}
```

**Adapter function:**
```typescript
// Adapter location: inline in useThermostatData.ts or standalone
// lib/netatmo/netatmoWsAdapter.ts (recommended as standalone for testability)

function adaptNetatmoWsPayload(raw: Record<string, unknown>): NetatmoStatus | null {
  // D-06: null payload check
  if (!raw || typeof raw !== 'object') return null;

  const body = raw['body'] as Record<string, unknown> | undefined;
  if (!body) return null;

  const home = body['home'] as Record<string, unknown> | undefined;
  if (!home) return null;

  const wsRooms = (home['rooms'] as Record<string, unknown>[] | undefined) ?? [];
  const wsModules = (home['modules'] as Record<string, unknown>[] | undefined) ?? [];

  const rooms: RoomStatus[] = wsRooms.map(r => ({
    room_id: r['id'] as string,
    temperature: r['therm_measured_temperature'] as number | undefined,
    setpoint: r['therm_setpoint_temperature'] as number | undefined,
    mode: r['therm_setpoint_mode'] as string | undefined,
    heating: ((r['heating_power_request'] as number | undefined) ?? 0) > 0,
  }));

  const modules: ModuleStatus[] = wsModules.map(m => ({
    id: m['id'] as string,
    battery_state: m['battery_state'] as string | undefined,
    reachable: m['reachable'] as boolean | undefined,
    rf_strength: m['rf_strength'] as number | undefined,
  }));

  const lowBatteryModules = modules.filter(m =>
    m.battery_state === 'low' || m.battery_state === 'very_low'
  );

  return {
    rooms,
    modules,
    hasLowBattery: lowBatteryModules.length > 0,
    hasCriticalBattery: modules.some(m => m.battery_state === 'very_low'),
    lowBatteryModules,
  };
}
```

**Key difference from HTTP path:** The HTTP `GET /api/netatmo/homestatus` enriches rooms with `stoveSync` and `stoveSyncSetpoint` from Firebase. The WS path does NOT have this data. The adapter omits these fields for WS-sourced data. The existing component code uses `stoveSync ?? false` and `stoveSyncSetpoint`, so omitting them is safe (falsy defaults).

### Pattern 4: ThermostatCard and page.tsx Consumer Migration

**ThermostatCard.tsx changes:**
- Remove: inline `useState` for `connected`, `topology`, `status`, `loading`, `error`
- Remove: inline `connectionCheckedRef`, `checkConnection()`, `fetchStatus()`, `useAdaptivePolling` call
- Add: `const { connected, topology, status, loading, error, stale, refetch } = useThermostatData()`
- Keep: all mutation handlers, schedule management, UI rendering, debounced setpoint, calibration state

**thermostat/page.tsx changes:**
- Remove: inline `useState` for `connected`, `topology`, `status`, `loading`, `error`
- Remove: `connectionCheckedRef`, `pollingStartedRef`, `checkConnection()`, `fetchStatus()`, raw `setInterval(30000)`
- Add: `const { connected, topology, status, loading, error } = useThermostatData()`
- Keep: all derived state (roomsWithStatus merge logic), all command handlers, UI rendering

**Important:** page.tsx currently redirects to `/netatmo` when `!connected` after loading. This behavior must be preserved. The hook exposes `connected` so page.tsx can keep its redirect useEffect unchanged.

### Anti-Patterns to Avoid

- **Duplicate WS subscriptions:** Do NOT call subscribe('netatmo', ...) in both ThermostatCard AND page.tsx after hook extraction. The hook centralises the single subscription. Both consumers use the hook.
- **Adapter assumptions on field presence:** All WS fields are potentially absent. Use optional chaining and nullish coalescing throughout the adapter — the payload is `Record<string, unknown>`, not typed.
- **Missing `if (!isWsConnected) return` guard:** The Phase 141 pattern mandates this guard at the top of the WS useEffect. Without it, `subscribe` is called when `readyState=CLOSED` creating dead subscriptions that never fire.
- **Re-fetching topology on every WS message:** Topology (homesdata) is structural, rarely changes. Fetch once on mount. Do NOT fetch inside `handleMessage`.
- **Losing the polling gate:** ThermostatCard's current logic uses `interval: topology ? 60000 : null` (only poll when topology loaded). The hook should preserve this: `interval: isWsConnected ? null : (topology ? 60000 : null)`.
- **stoveSync data in WS path:** The WS payload has no stove-sync enrichment. Do not attempt to include it; components default stoveSync to false gracefully.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WS connection management | Custom WebSocket class | `useWebSocketContext()` | Phase 139 shared manager, MAX 2 connections enforced |
| Polling with visibility awareness | Manual visibilitychange listener | `useAdaptivePolling` | Handles tab hidden, immediate:true, initialDelay — all needed |
| Stale closure in WS useEffect | Passing function directly | Ref pattern (`fetchXxxRef.current = fetchXxx`) | Established across all 5 prior migrations |
| WS topic type definition | New interface | `NetatmoData = Record<string, unknown>` from `types/websocket.ts` | Already defined |
| Data freshness tracking | Custom timestamp logic | `useDeviceStaleness('thermostat')` | Already in ThermostatCard, carries over to hook |

**Key insight:** Phases 140-142 establish an identical, tested migration pattern. The planner should follow it mechanically — the only genuinely new work is the WS adapter function and the hook extraction prerequisite.

---

## Common Pitfalls

### Pitfall 1: HTTP Route Response Shape vs WS Adapter Shape Mismatch

**What goes wrong:** The HTTP `GET /api/netatmo/homestatus` returns an enriched shape with fields like `stoveSync`, `room_type`, `lowBatteryModules`, `hasLowBattery`, `hasCriticalBattery`. The WS adapter returns a leaner shape missing `stoveSync` enrichment. If the hook merges these into one state variable without accounting for the difference, consumers may break when switching between data sources.

**Why it happens:** The HTTP path enriches data server-side (Firebase join + battery classification). WS path is raw cloud API data, no server enrichment.

**How to avoid:** Return a single `NetatmoStatus | null` state from the hook. Compute `hasLowBattery`, `hasCriticalBattery`, `lowBatteryModules` in the adapter (they only require module `battery_state`). Omit `stoveSync` from WS-path data — components access it as `roomStatus?.stoveSync ?? false` which is safe.

**Warning signs:** TypeScript errors on `status.stoveSync` after extracting hook.

### Pitfall 2: Polling Gate Logic Changed During Hook Extraction

**What goes wrong:** ThermostatCard gates polling on `topology ? 60000 : null`. If the hook extraction moves this logic without preserving the topology-check, polling fires before topology is loaded, causing wasteful HTTP calls or null-pointer errors in fetchStatus.

**Why it happens:** Hook extraction simplifies code, and the gate condition is a subtle behavioral dependency.

**How to avoid:** In the hook, compute interval as: `isWsConnected ? null : (topology ? interval : null)`. Matches existing ThermostatCard behavior exactly.

### Pitfall 3: page.tsx setInterval Not Migrated to useAdaptivePolling

**What goes wrong:** `page.tsx` uses a raw `setInterval(fetchStatus, 30000)` with `pollingStartedRef` and `useRef` guards to prevent Strict Mode double-invocation. If left as-is and combined with a hook that uses `useAdaptivePolling`, there will be duplicate polling.

**Why it happens:** page.tsx was written before the project standardized on `useAdaptivePolling`.

**How to avoid:** When extracting the hook, the hook uses `useAdaptivePolling` for all polling. The raw `setInterval` in page.tsx is removed entirely (replaced by consuming the hook). This is noted as Claude's Discretion in CONTEXT.md — recommend migrating to `useAdaptivePolling` for consistency.

### Pitfall 4: Consumer Has Two Data Paths After Migration

**What goes wrong:** ThermostatCard still has some leftover inline fetching (e.g., the `checkConnection` function or a `fetchStatus` call in a button handler) while also consuming the hook. This creates split state — the hook's state and the component's local state diverge.

**Why it happens:** Incomplete refactoring — forgetting to remove all inline state and fetch calls.

**How to avoid:** After extracting the hook, verify ThermostatCard has NO local `useState` for `connected`, `topology`, `status`, `loading`, `error`. All data state flows from `useThermostatData()`. The `handleRefresh` function in ThermostatCard should call `refetch()` from the hook.

### Pitfall 5: Adapter Null-Safety for Deeply Nested WS Fields

**What goes wrong:** WS payload is `Record<string, unknown>`. Accessing `raw.body.home.rooms` without null-checks throws at runtime if any intermediate field is missing or null (e.g., Netatmo cloud hasn't responded yet — D-06).

**Why it happens:** TypeScript doesn't guard against this since the type is `Record<string, unknown>`.

**How to avoid:** The adapter must null-check each level: `raw?.body`, `(raw.body as Record<string, unknown>)?.home`, then check `home.rooms` is an array before mapping. Return `null` at any point where the expected structure is absent.

---

## Code Examples

### WS Subscription useEffect (Phase 141/142 pattern)

```typescript
// Source: app/components/devices/dirigera/hooks/useDirigeraData.ts (Phase 142 reference)
useEffect(() => {
  if (!isWsConnected) return; // conditional guard — prevent dead subscriptions

  const handleMessage = (raw: unknown) => {
    const adapted = adaptNetatmoWsPayload(raw as Record<string, unknown>);
    if (adapted === null) return; // D-06: null payload fallback
    setStatus(adapted);
    setStale(false);
    setLoading(false);
    setError(null);
    // topology side-fetch only if needed (rarely, omit for initial implementation)
  };

  subscribe('netatmo', handleMessage);
  return () => { unsubscribe('netatmo', handleMessage); };
}, [isWsConnected, subscribe, unsubscribe]);
```

### Ref Pattern for Side-Fetches

```typescript
// Source: app/components/devices/dirigera/hooks/useDirigeraData.ts (Phase 142 reference)
async function fetchTopology() { /* ... */ }
const fetchTopologyRef = useRef(fetchTopology);
fetchTopologyRef.current = fetchTopology; // updated each render — no stale closure

// Inside WS useEffect (safe to call without deps):
void fetchTopologyRef.current();
```

### Polling Suppression

```typescript
// Source: all Phase 140-142 hooks
useAdaptivePolling({
  callback: fetchStatus,
  interval: isWsConnected ? null : (topology ? 60000 : null),
  alwaysActive: false, // D-13: thermostat is non-safety-critical
  immediate: true,
  initialDelay: 50,
});
```

### WS Context Access

```typescript
// Source: app/components/devices/dirigera/hooks/useDirigeraData.ts
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';

const { subscribe, unsubscribe, readyState } = useWebSocketContext();
const isWsConnected = readyState === ReadyState.OPEN;
```

### Adapter Entry Point

```typescript
// Source: docs/api/websocket.md §netatmo section + types/websocket.ts
// NetatmoData = Record<string, unknown>
// WS envelope: { body: { home: { id, rooms: [...], modules: [...] } }, status, time_server }

function adaptNetatmoWsPayload(raw: Record<string, unknown>): NetatmoStatus | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw['body'] as Record<string, unknown> | undefined;
  if (!body) return null;
  const home = body['home'] as Record<string, unknown> | undefined;
  if (!home) return null;
  // ... map rooms and modules
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline data fetching in components | Dedicated hook per provider | Phase 140-142 | Consistent pattern — Netatmo is the last holdout |
| Direct device API | Shared HA proxy (haGet/haPost) | Phase 84-86 | All providers unified on haGet/haPost |
| HTTP polling only | WS primary + HTTP fallback | Phase 139-142 | 5 of 6 providers migrated, Netatmo is Phase 143 |
| Raw setInterval | useAdaptivePolling | Phase 57+ | All hooks standardized — page.tsx setInterval is the last raw timer |

---

## Open Questions

1. **stoveSync enrichment on WS path**
   - What we know: HTTP path enriches rooms with `stoveSync: true` and `stoveSyncSetpoint` from Firebase. WS path has no server enrichment.
   - What's unclear: Do components visually degrade gracefully when `stoveSync` is absent?
   - Recommendation: Confirmed safe — components access `stoveSync ?? false` and `stoveSyncSetpoint` conditionally. Omit from WS adapter; document as known behavioral difference (stove-sync indicator only updates on next HTTP poll or page reload when WS is active).

2. **Module battery_state in WS payload**
   - What we know: D-05 says modules from WS payload include battery/reachable data. The `homestatus` Netatmo cloud API does include modules with `battery_state` field at the module level.
   - What's unclear: The proxy `GET /homestatus` response says "proxy homestatus does not include modules" (comment in route.ts line 113) — modules come from Firebase topology. But D-05 says WS modules include battery/reachable.
   - Recommendation: Implement adapter with module mapping as specified by D-05 (modules from WS `body.home.modules`). If WS modules array is empty, `hasLowBattery` stays `false`. This is correct degraded behavior.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure code migration using existing installed infrastructure).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="useThermostatData" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-13 | `useThermostatData` subscribes to `netatmo` WS topic when OPEN | unit | `npm test -- --testPathPattern="useThermostatData" --no-coverage` | ❌ Wave 0 |
| MIG-13 | WS message updates `status` via adapter | unit | same | ❌ Wave 0 |
| MIG-13 | Adapter maps WS fields to RoomStatus/ModuleStatus correctly | unit | same | ❌ Wave 0 |
| MIG-13 | null WS payload returns null (fallback trigger) | unit | same | ❌ Wave 0 |
| MIG-14 | polling `interval` is `null` when WS is OPEN | unit | same | ❌ Wave 0 |
| MIG-14 | polling `interval` is non-null when WS is CLOSED | unit | same | ❌ Wave 0 |
| MIG-14 | HTTP fetch path sets `status` correctly | unit | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="useThermostatData" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts` — covers MIG-13 + MIG-14
- [ ] (No framework or config gaps — Jest already configured)

---

## Sources

### Primary (HIGH confidence)
- `docs/api/websocket.md` §netatmo — WS payload envelope, NetatmoData type definition, null behavior
- `types/websocket.ts` — `NetatmoData = Record<string, unknown>` type confirmed
- `types/netatmoProxy.ts` — existing internal types: NetatmoProxyRoomMeasurement, NetatmoProxyHomestatusResponse
- `app/api/netatmo/homestatus/route.ts` — HTTP route enrichment logic: stoveSync join, battery classification, field mapping
- `app/components/devices/thermostat/ThermostatCard.tsx` — current inline fetch pattern, polling gate condition
- `app/thermostat/page.tsx` — current inline setInterval pattern, redirect behavior
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — canonical Phase 142 reference implementation
- `app/components/devices/stove/hooks/useStoveData.ts` — canonical Phase 140 reference implementation
- `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` — test pattern reference
- `docs/api/netatmo.md` §homestatus — field-by-field documentation for homestatus WS payload mirror

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 140-142 established patterns confirmed in project memory
- `.planning/REQUIREMENTS.md` — MIG-13/MIG-14 requirement text confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure already exists, verified from source code
- Architecture: HIGH — 5 prior migrations follow identical pattern, source code read directly
- Pitfalls: HIGH — identified from actual source code (HTTP route enrichment, polling gate, stoveSync) not assumptions
- Adapter field mapping: HIGH — verified against websocket.md spec and netatmo.md field docs
- Test pattern: HIGH — useDirigeraData.test.ts read as direct reference

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable — no external API changes expected)
