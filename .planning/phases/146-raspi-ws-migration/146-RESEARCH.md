# Phase 146: Raspi WS Migration - Research

**Researched:** 2026-03-30
**Domain:** WebSocket migration — React hook + UI component update
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Direct field mapping from WS `RaspiData` payload to hook state — extract `cpu_percent` from top level, derive `memoryPercent`/`memoryPercent`/`diskPercent`/`cpuTemperature` from `memory`/`disk`/`system` objects, same as existing `fetchData` logic
- **D-02:** No adapter function needed (unlike Netatmo) — WS payload structure is close enough to map inline in the message handler
- **D-03:** Keep current 60s visible / 300s hidden interval pattern — suppress polling when WS connected (`interval: isWsConnected ? null : interval`)
- **D-04:** `alwaysActive: false` — Raspi monitoring is non-safety-critical (same as DIRIGERA pattern)
- **D-05:** Add `lastUpdatedAt` state to useRaspiData return, set on both WS message and successful HTTP fetch
- **D-06:** Render `<LastUpdated tsMs={lastUpdatedAt} />` in RaspiCard footer — consistent with all other device cards
- **D-07:** Compute health entirely from WS payload — no separate health side-fetch needed (unlike DIRIGERA)
- **D-08:** Keep existing `computeRaspiHealth` logic unchanged — thresholds remain the same regardless of data source

### Claude's Discretion

- Hook internal state management (refs, effect cleanup) — follow useDirigeraData pattern exactly
- Test updates to useRaspiData.test.ts and RaspiCard.test.tsx — mock WS context as done in other hook tests

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RASPI-01 | useRaspiData subscribes to `raspi` WS topic for live data push | WS infrastructure already registered `raspi` in TopicDataMap; subscribe/unsubscribe API confirmed in WebSocketContext; useDirigeraData pattern is the direct template |
| RASPI-02 | useRaspiData falls back to HTTP polling when WS disconnected (interval gating pattern) | Pattern: `interval: isWsConnected ? null : interval` — used identically in all 6 existing migrated hooks; useAdaptivePolling accepts `null` to suspend |
| RASPI-03 | RaspiCard displays LastUpdated timestamp from WS/polling data | LastUpdated component exists at `app/components/ui/LastUpdated.tsx`, takes `tsMs: number \| null`; footer placement confirmed in other device cards |
| RASPI-04 | RaspiData type matches documented WS payload shape | `types/websocket.ts` already has `RaspiData` interface (lines 147-153); WS payload documented in `docs/api/websocket.md`; no type changes needed |
| UX-01 | NavbarConnectionStatus includes raspi WS topic subscriptions | NavbarConnectionStatus reads global `readyState` from WebSocketContext — no per-topic change needed; raspi topic subscription handled inside hook |
| UX-03 | RaspiCard displays LastUpdated timestamp | Duplicate of RASPI-03 — same implementation; counted once per STATE.md |
</phase_requirements>

---

## Summary

Phase 146 is the 7th and final non-Tuya provider WS migration. The objective is to bring `useRaspiData` in line with the 6 already-migrated hooks (stove, network, lights, sonos, dirigera, thermostat) by adding WS-primary data reception with polling fallback, and adding the `LastUpdated` timestamp to `RaspiCard`.

The migration is the simplest of all completed so far. Unlike DIRIGERA (which requires a health side-fetch after WS messages) and Netatmo (which requires an adapter function for raw→typed conversion), Raspi has a single flat-enough payload that maps inline — `cpu_percent` is at the top level, and `memory.percent`, `disk.percent`, `system.temperature` are nested under known keys identical to what `fetchData` already reads. No adapter function, no side-fetch.

All infrastructure is already in place: `RaspiData` is defined in `types/websocket.ts`, `TopicDataMap` already maps `raspi`, WebSocketContext provides `subscribe`/`unsubscribe`, `LastUpdated` component exists, and `NavbarConnectionStatus` reads global readyState requiring zero changes.

**Primary recommendation:** Copy useDirigeraData pattern verbatim, remove the health side-fetch (D-07), and inline the WS payload mapping. Two files change: `useRaspiData.ts` and `RaspiCard.tsx`. Two test files update in parallel.

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-use-websocket | project version | WS singleton manager | Already used via shared WebSocketContext |
| useAdaptivePolling | internal | Polling with visibility gating | Used by all device hooks |
| useWebSocketContext | internal | Access subscribe/unsubscribe/readyState | Shared WS infrastructure from Phase 139 |
| LastUpdated | internal | Italian relative timestamp display | Used by all other device cards |

No new installations required. All dependencies are already present.

---

## Architecture Patterns

### Recommended File Structure

No new files. Two existing files are rewritten:

```
app/components/devices/raspi/
├── hooks/
│   └── useRaspiData.ts          ← rewrite: add WS subscription + lastUpdatedAt
└── RaspiCard.tsx                ← add LastUpdated footer
```

Two test files update:

```
app/components/devices/raspi/
├── hooks/__tests__/
│   └── useRaspiData.test.ts     ← add WS channel tests
└── __tests__/
    └── RaspiCard.test.tsx       ← add lastUpdatedAt mock field + LastUpdated render test
```

### Pattern 1: WS-Primary Hook (useDirigeraData Template)

This is the established pattern for non-safety-critical hooks. Apply verbatim with Raspi-specific adaptations.

**What:** Hook subscribes to WS topic when `readyState === ReadyState.OPEN`. When WS is connected, polling is suspended (`interval: null`). When WS disconnects, polling resumes.

**When to use:** All device hooks — this is the universal pattern post-Phase 139.

**Structural diff from current useRaspiData:**

```typescript
// Source: app/components/devices/dirigera/hooks/useDirigeraData.ts (template)
// Changes for Raspi:
//   1. Add useWebSocketContext, ReadyState imports
//   2. Add isWsConnected derived state
//   3. Add lastUpdatedAt state
//   4. Add WS useEffect with subscribe/unsubscribe
//   5. Set lastUpdatedAt in both WS handler and fetchData
//   6. Change polling interval: isWsConnected ? null : interval
//   7. Export lastUpdatedAt from hook return type

// WS subscription effect (new):
useEffect(() => {
  if (!isWsConnected) return;                   // Phase 141 guard pattern

  const handleMessage = (raw: unknown) => {
    const wsData = raw as WsRaspiData;           // from types/websocket

    const newData: RaspiData = {
      cpuPercent: wsData.cpu_percent,
      memoryPercent: (wsData.memory as { percent: number }).percent,
      diskPercent: (wsData.disk as { percent: number }).percent,
      cpuTemperature: (wsData.system as { temperature: number | null }).temperature ?? null,
    };

    dataRef.current = newData;
    setData(newData);
    setStale(false);
    setLoading(false);
    setError(null);
    setLastUpdatedAt(Date.now());
    // D-07: NO health side-fetch needed
  };

  subscribe('raspi', handleMessage);
  return () => { unsubscribe('raspi', handleMessage); };
}, [isWsConnected, subscribe, unsubscribe]);

// Polling (modified):
useAdaptivePolling({
  callback: fetchData,
  interval: isWsConnected ? null : interval,   // D-03: suppress when WS live
  alwaysActive: false,                          // D-04: non-safety-critical
  immediate: true,
  initialDelay: 600,
});
```

### Pattern 2: Inline WS Payload Mapping (No Adapter)

**What:** Unlike Netatmo (raw format requires dedicated adapter), Raspi WS payload mirrors the HTTP endpoint structure closely enough to map inline.

**Mapping logic:**

| Hook state field | HTTP source | WS source |
|-----------------|-------------|-----------|
| `cpuPercent` | `cpu.cpu_percent` | `wsData.cpu_percent` |
| `memoryPercent` | `mem.percent` | `(wsData.memory as {percent: number}).percent` |
| `diskPercent` | `disk.percent` | `(wsData.disk as {percent: number}).percent` |
| `cpuTemperature` | `sys.cpu_temperature` | `(wsData.system as {temperature: number\|null}).temperature` |

The `memory`, `disk`, `system` fields in `RaspiData` (websocket.ts) are typed as `Record<string, unknown>` — safe runtime narrowing with `as` cast since the WS contract guarantees these keys.

### Pattern 3: LastUpdated Footer in RaspiCard

**What:** Add `lastUpdatedAt` to the destructured hook return and render `<LastUpdated />` after the metrics grid.

```typescript
// Source: app/components/ui/LastUpdated.tsx
// Placement: after <RaspiStats />, inside SmartHomeCard.Controls or as sibling

const { data, loading, error, stale, health, lastUpdatedAt } = useRaspiData();

// In JSX (after RaspiStats block):
<SmartHomeCard.Controls>
  <LastUpdated tsMs={lastUpdatedAt} className="mt-2" />
</SmartHomeCard.Controls>
```

### Anti-Patterns to Avoid

- **Adding a health side-fetch inside the WS handler:** DIRIGERA does this (D-09) because its health endpoint is separate. Raspi health is computed from `computeRaspiHealth(data)` inline — no side-fetch needed (D-07).
- **Creating a standalone adapter function:** D-02 locks inline mapping. Netatmo needed `adaptNetatmoWsPayload` because the format was radically different. Raspi does not.
- **Changing NavbarConnectionStatus:** UX-01 states the raspi topic should be in the subscription set, which is satisfied automatically when the hook subscribes. NavbarConnectionStatus reads global `readyState`, not per-topic state. Zero changes needed there.
- **Using `as any` for WS payload fields:** Use `Record<string, unknown>` narrowing via intermediate `as {percent: number}` cast — consistent with the project's zero-`as-any` policy in production code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamp display | Custom time-ago formatting | `<LastUpdated tsMs={...} />` | Already exists, Italian locale, auto-updates every 10s |
| WS connection management | Per-hook WS connection | `useWebSocketContext()` | Singleton connection shared across all 7+ providers |
| Polling with visibility | Custom interval management | `useAdaptivePolling` | Handles visibility, null suspension, alwaysActive |
| WS type narrowing | Runtime type guards | Cast via `WsRaspiData` from `types/websocket.ts` | Type already defined, WS contract is trusted |

**Key insight:** Every infrastructure piece for this migration was built in Phases 139-144. This phase only wires Raspi into the existing grid.

---

## Common Pitfalls

### Pitfall 1: Missing `relation_id` / Wrong DirigeraSensor shape
**What goes wrong:** Copying DIRIGERA test fixtures verbatim without adapting to Raspi WS payload shape.
**Why it happens:** useDirigeraData tests use `DirigeraData` mock payload with sensor arrays. Raspi WS payload is `{ cpu_percent, memory, disk, system, data_freshness }`.
**How to avoid:** Use a `RaspiData` (from `types/websocket.ts`) mock payload in useRaspiData tests. The mock must provide `memory.percent`, `disk.percent`, `system.temperature`.
**Warning signs:** Test fails with "Cannot read property 'percent' of undefined".

### Pitfall 2: Forgetting `setLastUpdatedAt` in fetchData
**What goes wrong:** `LastUpdated` never renders because `lastUpdatedAt` stays `null` when WS is disconnected and polling is active.
**Why it happens:** Adding `lastUpdatedAt` state but only setting it in the WS handler, not in `fetchData`.
**How to avoid:** Set `setLastUpdatedAt(Date.now())` in the `try` block of `fetchData` after `setData(newData)` — mirror the DIRIGERA pattern exactly.
**Warning signs:** `<LastUpdated tsMs={null} />` renders nothing even after successful HTTP fetch.

### Pitfall 3: Stale closure in WS handler for `dataRef`
**What goes wrong:** WS handler captures stale `data` state, so `setData(prev => ...)` pattern is needed or `dataRef.current` must be used.
**Why it happens:** WS `useEffect` closes over state at mount time.
**How to avoid:** Follow the `dataRef` ref pattern from DIRIGERA: update `dataRef.current = newData` before `setData(newData)`. Handler sets `dataRef.current` directly, no `prev =>` needed.
**Warning signs:** Stale health computation or data not reflecting WS updates after polling fetched data first.

### Pitfall 4: `system.temperature` vs `system.cpu_temperature`
**What goes wrong:** Using the wrong key when mapping WS payload to `cpuTemperature`.
**Why it happens:** HTTP endpoints return `SystemResponse.cpu_temperature` (from `types/raspi.ts`), but WS `docs/api/websocket.md` documents the field as `system.temperature` (not `system.cpu_temperature`).
**How to avoid:** Use `(wsData.system as { temperature: number | null }).temperature` for the WS path. The HTTP fetch path continues to read `sys.cpu_temperature` from `SystemResponse`.
**Warning signs:** `cpuTemperature` always null when WS is connected.

### Pitfall 5: Forgetting to export `computeRaspiHealth`
**What goes wrong:** Test file cannot import `computeRaspiHealth` directly (it is currently unexported in `useRaspiData.ts`).
**Why it happens:** Current hook keeps the function private. useDirigeraData exports it.
**How to avoid:** Export `computeRaspiHealth` as a named export — it enables isolated unit tests without rendering the full hook. Mirror the DIRIGERA pattern.
**Warning signs:** Test file import error `Module has no exported member 'computeRaspiHealth'`.

---

## Code Examples

### Complete useRaspiData Imports Block (after migration)

```typescript
// Source: app/components/devices/dirigera/hooks/useDirigeraData.ts (adapted)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { RaspiData as WsRaspiData } from '@/types/websocket';
import type { CpuResponse, MemoryResponse, DiskResponse, SystemResponse } from '@/types/raspi';
```

### UseRaspiDataReturn — New Shape

```typescript
export interface UseRaspiDataReturn {
  data: RaspiData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  health: RaspiHealth;
  lastUpdatedAt: number | null;          // NEW: set by WS handler and fetchData
}
```

Note: `RaspiData` (the hook's internal DTO) differs from `WsRaspiData` (the wire format in `types/websocket.ts`). The hook transforms wire → DTO in both WS handler and `fetchData`.

### WS Payload Field Access

```typescript
// Accessing nested Record<string, unknown> fields safely:
const memPct = (wsData.memory as { percent: number }).percent;
const diskPct = (wsData.disk as { percent: number }).percent;
const temp = (wsData.system as { temperature: number | null }).temperature ?? null;
```

This matches the project pattern for `Record<string, unknown>` narrowing (zero `as any`).

### LastUpdated in RaspiCard

```typescript
// Source: pattern from other device cards (e.g., DirigeraCard)
import { LastUpdated } from '@/app/components/ui/LastUpdated';

// In JSX, after RaspiStats block:
<SmartHomeCard.Controls>
  <LastUpdated tsMs={lastUpdatedAt} className="mt-2" />
</SmartHomeCard.Controls>
```

### useRaspiData Test — WS Mock Setup (from useDirigeraData pattern)

```typescript
// Source: app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts
jest.mock('@/app/context/WebSocketContext');
jest.mock('@/lib/hooks/useWebSocketManager', () => ({
  ReadyState: { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2, UNINSTANTIATED: -1 },
}));

import { useWebSocketContext } from '@/app/context/WebSocketContext';
const mockUseWebSocketContext = useWebSocketContext as jest.MockedFunction<typeof useWebSocketContext>;

// WS connected override:
mockUseWebSocketContext.mockReturnValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  readyState: ReadyState.OPEN,
});
```

### Raspi WS Mock Payload for Tests

```typescript
import type { RaspiData } from '@/types/websocket';

const mockWsPayload: RaspiData = {
  cpu_percent: 25.3,
  memory: { total: 8589934592, available: 4294967296, percent: 50.0, used: 4294967296 },
  disk: { total: 32212254720, used: 12884901888, free: 19327352832, percent: 40.0 },
  system: { temperature: 42.5, uptime: 86400, load_avg: [0.5, 0.3, 0.2], process_count: 145 },
  data_freshness: 'LIVE',
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP-only polling | WS-primary + polling fallback | Phases 139-144 | Real-time updates; polling only as fallback |
| No `lastUpdatedAt` | `lastUpdatedAt: number \| null` in all hook returns | Phase 143-144 | LastUpdated component can show freshness in every card |
| Polling always active | `interval: isWsConnected ? null : interval` | Phase 141 | Zero wasted HTTP requests when WS connected |

**Deprecated/outdated in current useRaspiData:**
- `Promise.all([fetch cpu, fetch memory, fetch disk, fetch system])` — kept as fallback, but will only fire when WS is disconnected
- Missing `useWebSocketContext` import — this is the hook's only gap vs all other migrated hooks

---

## Open Questions

1. **`system.temperature` vs `system.cpu_temperature` key name**
   - What we know: WS docs (`docs/api/websocket.md`) use `system.temperature`. HTTP type (`SystemResponse`) uses `cpu_temperature`.
   - What's unclear: Is the key difference intentional on the server side, or a documentation inconsistency?
   - Recommendation: Follow the WS doc exactly (`temperature`). If data arrives as `null` during testing, cross-check WS payload in browser DevTools. The divergence is documented — treat as intentional.

2. **`DirigeraData` vs `RaspiData` naming collision**
   - What we know: The hook's internal DTO is `RaspiData` (exported from `useRaspiData.ts`). The WS type is also called `RaspiData` (exported from `types/websocket.ts`).
   - What's unclear: Will this cause TypeScript confusion if both are imported in the same file?
   - Recommendation: Import WS type as `import type { RaspiData as WsRaspiData } from '@/types/websocket'` — same aliasing pattern used in useDirigeraData (`DirigeraData as WsDirigeraData`).

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this is a code-only change within the existing Next.js project)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="useRaspiData\|RaspiCard" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RASPI-01 | useRaspiData subscribes to `raspi` topic when WS OPEN | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| RASPI-01 | useRaspiData does NOT subscribe when WS CLOSED | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| RASPI-01 | unsubscribes on unmount | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| RASPI-02 | interval is null when WS connected | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| RASPI-02 | interval is non-null when WS disconnected | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| RASPI-03 | RaspiCard renders LastUpdated when lastUpdatedAt set | unit | `npm test -- --testPathPattern="RaspiCard"` | ✅ (update needed) |
| RASPI-03 | RaspiCard renders nothing for LastUpdated when null | unit | `npm test -- --testPathPattern="RaspiCard"` | ✅ (update needed) |
| RASPI-04 | WS handler maps cpu_percent/memory/disk/system to RaspiData | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| RASPI-04 | health computed from WS-derived data | unit | `npm test -- --testPathPattern="useRaspiData"` | ✅ (update needed) |
| UX-01 | NavbarConnectionStatus: no change needed | — | `npm test -- --testPathPattern="NavbarConnectionStatus"` | ✅ (no change) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="useRaspiData|RaspiCard" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. The two test files (`useRaspiData.test.ts`, `RaspiCard.test.tsx`) exist and will be updated in-place as part of the plan execution.

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint |
|-----------|------------|
| NEVER break existing functionality | computeRaspiHealth thresholds unchanged (D-08); HTTP fetchData kept as fallback |
| WAIT for user confirmation before version updates | No package updates in this phase |
| PREFER editing existing files over creating new | Only edits to existing files — no new files |
| NEVER execute `npm run build` or `npm install` | Plans must not include build/install steps |
| ALWAYS create/update unit tests | useRaspiData.test.ts and RaspiCard.test.tsx must be updated |
| USE design system → /debug/design-system | LastUpdated is a design-system component; SmartHomeCard.Controls for layout |
| NEVER commit/push without explicit request | No git commands in plans |

---

## Sources

### Primary (HIGH confidence)

- `types/websocket.ts` — `RaspiData` interface shape (lines 147-153), `TopicDataMap` raspi entry confirmed
- `docs/api/websocket.md` — raspi topic payload documentation, field names verified (system.temperature key)
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — canonical exemplar for the migration pattern
- `app/components/devices/raspi/hooks/useRaspiData.ts` — current state of the file to be migrated
- `app/components/devices/raspi/RaspiCard.tsx` — current state of the component to be updated
- `app/components/ui/LastUpdated.tsx` — component API confirmed (`tsMs: number | null`)
- `app/context/WebSocketContext.ts` — `subscribe`/`unsubscribe`/`readyState` API confirmed
- `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` — WS mock test pattern

### Secondary (MEDIUM confidence)

- `app/components/layout/NavbarConnectionStatus.tsx` — confirmed reads global `readyState` only; no per-topic changes needed

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing code reviewed directly
- Architecture: HIGH — direct code inspection of exemplar (useDirigeraData) and target files
- Pitfalls: HIGH — derived from actual code inspection (system.temperature vs cpu_temperature divergence confirmed from docs vs types)

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable internal codebase)
