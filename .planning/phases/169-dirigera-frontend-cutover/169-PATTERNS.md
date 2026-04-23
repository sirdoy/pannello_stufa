# Phase 169: DIRIGERA Frontend Cutover - Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 22 (10 new + 5 modified + 1 smoke test addition + 6 legacy deletions tracked)
**Analogs found:** 22 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/api/v1/dirigera/health/route.ts` | route | request-response | `app/api/dirigera/health/route.ts` (body) + `app/api/v1/dirigera/stats/route.ts` (v1 structure) | exact |
| `app/api/v1/dirigera/sensors/route.ts` | route | request-response | `app/api/dirigera/sensors/route.ts` (body) + `app/api/v1/dirigera/stats/route.ts` (v1 structure) | exact |
| `app/api/v1/dirigera/sensors/summary/route.ts` | route | request-response | `app/api/dirigera/sensors/summary/route.ts` (body) + `app/api/v1/dirigera/stats/route.ts` (v1 structure) | exact |
| `app/api/v1/dirigera/sensors/contact/route.ts` | route | request-response | `app/api/dirigera/sensors/contact/route.ts` (body) + `app/api/v1/dirigera/stats/route.ts` (v1 structure) | exact |
| `app/api/v1/dirigera/sensors/motion/route.ts` | route | request-response | `app/api/dirigera/sensors/motion/route.ts` (body) + `app/api/v1/dirigera/stats/route.ts` (v1 structure) | exact |
| `app/api/v1/dirigera/health/__tests__/route.test.ts` | test | request-response | `app/api/v1/dirigera/stats/__tests__/route.test.ts` | exact |
| `app/api/v1/dirigera/sensors/__tests__/route.test.ts` | test | request-response | `app/api/v1/dirigera/history/__tests__/route.test.ts` | exact |
| `app/api/v1/dirigera/sensors/summary/__tests__/route.test.ts` | test | request-response | `app/api/v1/dirigera/stats/__tests__/route.test.ts` | exact |
| `app/api/v1/dirigera/sensors/contact/__tests__/route.test.ts` | test | request-response | `app/api/v1/dirigera/history/__tests__/route.test.ts` | exact |
| `app/api/v1/dirigera/sensors/motion/__tests__/route.test.ts` | test | request-response | `app/api/v1/dirigera/history/__tests__/route.test.ts` | exact |
| `app/components/devices/dirigera/hooks/useDirigeraHistory.ts` | hook | request-response (polling + paginated) | `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` | role-match |
| `app/components/devices/dirigera/hooks/useDirigeraStats.ts` | hook | request-response (polling) | `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` | role-match |
| `app/components/devices/dirigera/hooks/useDirigeraTelemetry.ts` | hook | request-response (polling + paginated) | `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` | role-match |
| `app/components/devices/dirigera/hooks/__tests__/useDirigeraHistory.test.ts` | test | request-response | `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` | role-match |
| `app/components/devices/dirigera/hooks/__tests__/useDirigeraStats.test.ts` | test | request-response | `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` | role-match |
| `app/components/devices/dirigera/hooks/__tests__/useDirigeraTelemetry.test.ts` | test | request-response | `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` | role-match |
| `app/components/devices/dirigera/components/DirigeraStatsPanel.tsx` | component | request-response | `app/components/devices/dirigera/components/DirigeraStats.tsx` (tile grid) + `DirigeraHealthSection.tsx` (panel shell) | role-match |
| `app/components/devices/dirigera/components/DirigeraHistoryPanel.tsx` | component | request-response | `app/components/devices/dirigera/components/DirigeraSensorList.tsx` (table + empty state) | role-match |
| `app/components/devices/dirigera/components/DirigeraTelemetryPanel.tsx` | component | request-response | `app/components/devices/dirigera/components/DirigeraSensorList.tsx` (table + empty state) | role-match |
| `app/components/devices/dirigera/hooks/useDirigeraData.ts` | hook (modify) | request-response | self (URL swap only) | exact |
| `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` | hook (modify) | request-response | self (URL swap only) | exact |
| `app/dirigera/page.tsx` | page (modify) | request-response | self (composition addition) | exact |
| `tests/smoke/page-loads.spec.ts` | test (modify) | request-response | self (add `/dirigera` test case) | exact |

---

## Pattern Assignments

---

### `app/api/v1/dirigera/health/route.ts` (route, request-response, no params)

**Analog (structure):** `app/api/v1/dirigera/stats/route.ts`
**Analog (body):** `app/api/dirigera/health/route.ts`

This is a no-params passthrough wrapper. The legacy route uses full `success(data as unknown as Record<string, unknown>)` — the v1 wrapper must replicate this exactly, NOT spread explicit fields.

**Complete implementation to copy** (legacy `app/api/dirigera/health/route.ts`, lines 1–14, swap path prefix in JSDoc):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/health
 * Returns DIRIGERA hub connection status, firmware, and sensor count.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Health');
```

**Critical note:** `getHealth()` returns a `DirigeraHealthResponse` typed object. Full passthrough via `as unknown as Record<string, unknown>` is the established pattern for simple proxy delegates. Do NOT switch to explicit field spreading for this route.

---

### `app/api/v1/dirigera/sensors/summary/route.ts` (route, request-response, no params)

**Analog (structure):** `app/api/v1/dirigera/stats/route.ts`
**Analog (body):** `app/api/dirigera/sensors/summary/route.ts`

Also a no-params passthrough. Same full-passthrough pattern as health.

**Complete implementation** (legacy `app/api/dirigera/sensors/summary/route.ts`, lines 1–14):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensorSummary } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/sensors/summary
 * Returns fleet-wide sensor summary (total, open, offline, low battery).
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensorSummary();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/SensorsSummary');
```

---

### `app/api/v1/dirigera/sensors/route.ts` (route, request-response, no params, explicit spread)

**Analog (structure):** `app/api/v1/dirigera/stats/route.ts`
**Analog (body):** `app/api/dirigera/sensors/route.ts`

**CRITICAL DIFFERENCE from health/summary:** This route explicitly spreads `{ sensors, count, is_stale }` — NOT full passthrough. The proxy function returns a typed `DirigeraSensorsResponse` with additional internal fields. The legacy route projects only these three fields to the client; the v1 wrapper MUST match exactly.

**Complete implementation** (from legacy `app/api/dirigera/sensors/route.ts`, lines 1–14):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/sensors
 * Returns all DIRIGERA sensors (contact + motion) with metadata.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/Sensors');
```

---

### `app/api/v1/dirigera/sensors/contact/route.ts` (route, request-response, no params, explicit spread)

**Analog (body):** `app/api/dirigera/sensors/contact/route.ts`

Same explicit `{ sensors, count, is_stale }` spread as sensors route — NOT full passthrough.

**Complete implementation** (from legacy `app/api/dirigera/sensors/contact/route.ts`, lines 1–14):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getContactSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/sensors/contact
 * Returns contact (open/close) sensors only, with per-sensor data_freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getContactSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/SensorsContact');
```

---

### `app/api/v1/dirigera/sensors/motion/route.ts` (route, request-response, no params, explicit spread)

**Analog (body):** `app/api/dirigera/sensors/motion/route.ts`

Same explicit spread pattern as sensors/contact.

**Complete implementation** (from legacy `app/api/dirigera/sensors/motion/route.ts`, lines 1–14):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getMotionSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/sensors/motion
 * Returns motion/occupancy sensors only, with light_level and data_freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getMotionSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/SensorsMotion');
```

---

### Route Test: `app/api/v1/dirigera/health/__tests__/route.test.ts` (test, request-response)

**Analog:** `app/api/v1/dirigera/stats/__tests__/route.test.ts` (no-params route with full-passthrough response)

The stats test is the correct analog because both `health` and `stats` are no-params, full-passthrough routes. The history test is the analog for routes with explicit field spreading.

**Mock setup pattern** (from `stats/__tests__/route.test.ts`, lines 1–33):
```typescript
jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHealth = jest.mocked(dirigeraProxy.getHealth);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockHealthData = {
  firmware_version: '2.465.0',
  connected_sensors: 6,
  is_reachable: true,
};
```

**Test cases pattern** (from `stats/__tests__/route.test.ts`, lines 35–64, adapted for health):
```typescript
describe('GET /api/v1/dirigera/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/health');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with health data when authenticated', async () => {
    mockGetHealth.mockResolvedValue(mockHealthData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/health');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.firmware_version).toBe('2.465.0');
    expect(data.connected_sensors).toBe(6);
    expect(mockGetHealth).toHaveBeenCalledTimes(1);
    expect(mockGetHealth).toHaveBeenCalledWith();
  });
});
```

---

### Route Tests: sensors, sensors/summary, sensors/contact, sensors/motion `__tests__/route.test.ts`

**Analog for sensors/contact and sensors/motion:** `app/api/v1/dirigera/history/__tests__/route.test.ts` — because these have explicit field spreading (similar to how history projects `events`/`total`)

**Analog for sensors/summary:** `app/api/v1/dirigera/stats/__tests__/route.test.ts` — no-params, passthrough

**Mock data for sensors-family tests** — adapt the `{ sensors, count, is_stale }` shape:
```typescript
// Sensors / contact / motion mock data shape
const mockSensorsData = {
  sensors: [
    { id: 'abc', type: 'openCloseSensor', custom_name: 'Door', room: 'Hall',
      firmware_version: '1.0', battery_percentage: 85, is_reachable: true,
      last_seen: '2026-04-01T10:00:00Z', is_open: false },
  ],
  count: 1,
  is_stale: false,
};
```

**Key assertion for sensors/contact/motion** (explicit field spread, not full passthrough):
```typescript
// Assert only the projected fields are present in the response
expect(data.sensors).toEqual(mockSensorsData.sensors);
expect(data.count).toBe(1);
expect(data.is_stale).toBe(false);
expect(mockGetContactSensors).toHaveBeenCalledWith(); // no params
```

**Key assertion for sensors/summary** (full passthrough — assert nested fields):
```typescript
// SensorSummaryResponse passthrough — assert specific fields from mock
expect(data.total_sensors).toBe(3);
expect(data.open_count).toBe(1);
expect(mockGetSensorSummary).toHaveBeenCalledWith();
```

---

### `app/components/devices/dirigera/hooks/useDirigeraHistory.ts` (hook, request-response + paginated)

**Analog:** `app/components/devices/dirigera/hooks/useDirigeraFullData.ts`

The RESEARCH.md already provides the complete skeleton. Key structural elements extracted from `useDirigeraFullData.ts`:

**Imports pattern** (from `useDirigeraFullData.ts`, lines 1–12):
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { SensorHistoryResponse, SensorHistoryParams, SensorEvent } from '@/types/dirigeraProxy';
```

**State initialization pattern** (from `useDirigeraFullData.ts`, lines 35–39):
```typescript
const [data, setData] = useState<DirigeraFullData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [stale, setStale] = useState(false);
const dataRef = useRef<DirigeraFullData | null>(null);
```

**Adaptive polling invocation pattern** (from `useDirigeraFullData.ts`, lines 86–93):
```typescript
useAdaptivePolling({
  callback: fetchData,
  interval,
  alwaysActive: false,
  immediate: true,
  initialDelay: 600,
});
```

**Polling cadence for history/stats/telemetry** — DIFFERENT from useDirigeraFullData (60s/300s). Use 300s/600s:
```typescript
const isVisible = useVisibility();
const interval = isVisible ? 300_000 : 600_000;
```

**Error pattern** (from `useDirigeraFullData.ts`, lines 76–82):
```typescript
} catch {
  setStale(true);
  if (!dataRef.current) {
    setError('DIRIGERA non raggiungibile');
  }
} finally {
  setLoading(false);
}
```

**loadMore pagination pattern** — new for this phase. Uses `useRef` for offset (not state, to avoid re-render on increment):
```typescript
const offsetRef = useRef(0);
const [isLoadingMore, setIsLoadingMore] = useState(false);

const loadMore = () => {
  const nextOffset = offsetRef.current + 50;
  offsetRef.current = nextOffset;
  setIsLoadingMore(true);
  void fetchPage(nextOffset, true).finally(() => setIsLoadingMore(false));
};
```

**Poll reset behavior** — on each auto-poll cycle, reset offset to 0 and replace items (not append). On loadMore, append:
```typescript
const fetchPage = async (offset: number, append: boolean) => {
  // ...
  if (append) {
    setItems(prev => [...prev, ...data.events]);
  } else {
    setItems(data.events);
    offsetRef.current = 0;  // Reset on poll cycle
  }
};

const pollCallback = async () => {
  try {
    await fetchPage(0, false);  // Always reset on poll
  } catch { ... }
};
```

**URL construction** (`URLSearchParams` — same pattern as `dirigeraProxy.ts`):
```typescript
const sp = new URLSearchParams({ limit: '50', offset: String(offset) });
if (params?.sensor_id) sp.set('sensor_id', params.sensor_id);
if (params?.event_type) sp.set('event_type', params.event_type);
const url = `/api/v1/dirigera/history?${sp.toString()}`;
```

---

### `app/components/devices/dirigera/hooks/useDirigeraStats.ts` (hook, request-response, no pagination)

**Analog:** `app/components/devices/dirigera/hooks/useDirigeraFullData.ts`

Simpler than history/telemetry — no pagination, no `loadMore`, no `offsetRef`. Pure polling hook returning `DirigeraStatsResponse | null`.

**Return interface:**
```typescript
export interface UseDirigeraStatsReturn {
  data: DirigeraStatsResponse | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}
```

**Core fetch** (single URL, full passthrough — mirrors the stats route which does `success(data as unknown ...)`):
```typescript
const fetchData = async () => {
  try {
    setError(null);
    const res = await fetch('/api/v1/dirigera/stats');
    if (!res.ok) throw new Error('Impossibile caricare le statistiche');
    const json = (await res.json()) as DirigeraStatsResponse;
    dataRef.current = json;
    setData(json);
    setStale(false);
  } catch {
    setStale(true);
    if (!dataRef.current) setError('Impossibile caricare le statistiche');
  } finally {
    setLoading(false);
  }
};
```

---

### `app/components/devices/dirigera/hooks/useDirigeraTelemetry.ts` (hook, request-response + paginated)

**Analog:** `useDirigeraHistory.ts` (same structure — paginated table hook)

Structurally identical to `useDirigeraHistory` with these substitutions:
- URL: `/api/v1/dirigera/telemetry`
- Type: `SensorTelemetryResponse`, `SensorTelemetryParams`, `SensorTelemetryReading` (check `types/dirigeraProxy.ts` for exact field name)
- Array key: `data.telemetry` (not `data.events`) — verified from `telemetry/__tests__/route.test.ts` line 51: `expect(data.telemetry).toEqual(...)`
- Error copy: `'Impossibile caricare la telemetria'`
- `event_type` param does NOT exist for telemetry (only `sensor_id`, `start`, `end`, `limit`, `offset`)

---

### Hook Tests: `useDirigeraHistory.test.ts`, `useDirigeraStats.test.ts`, `useDirigeraTelemetry.test.ts`

**Analog:** `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts`

No component tests exist in `app/components/devices/dirigera/components/__tests__/` (directory absent). Use the hook test pattern instead.

**Mock setup** (from `useDirigeraData.test.ts`, lines 1–26):
```typescript
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;
const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
```

**Note:** New hooks do NOT use WebSocketContext — omit that mock entirely. No `ReadyState`, no `mockSubscribe`.

**Callback capture pattern** (from `useDirigeraData.test.ts`, lines 108–118):
```typescript
let capturedCallback: (() => Promise<void>) | null = null;
mockUseAdaptivePolling.mockImplementation((opts) => {
  capturedCallback = opts.callback as () => Promise<void>;
});

const { result } = renderHook(() => useDirigeraHistory());

await act(async () => {
  await capturedCallback?.();
});
```

**beforeEach pattern** (from `useDirigeraData.test.ts`, lines 73–99):
```typescript
beforeEach(() => {
  jest.resetAllMocks();
  mockUseVisibility.mockReturnValue(true);
  mockUseAdaptivePolling.mockImplementation(() => undefined);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockHistoryData),
  }) as jest.Mock;
});
```

**URL assertion pattern** (from `useDirigeraData.test.ts`, lines 120–122 — the lines being updated in D-06):
```typescript
const fetchMock = global.fetch as jest.Mock;
expect(fetchMock).toHaveBeenCalledWith(
  expect.stringContaining('/api/v1/dirigera/history')
);
```

**loadMore-specific test** (no analog in existing tests — new pattern):
```typescript
it('appends items on loadMore()', async () => {
  let capturedCallback: (() => Promise<void>) | null = null;
  mockUseAdaptivePolling.mockImplementation((opts) => {
    capturedCallback = opts.callback as () => Promise<void>;
  });

  const { result } = renderHook(() => useDirigeraHistory());
  await act(async () => { await capturedCallback?.(); });

  // Trigger loadMore
  await act(async () => { result.current.loadMore(); });

  // Should have been called twice: initial poll + loadMore
  expect(global.fetch).toHaveBeenCalledTimes(2);
  // Second call should include offset=50
  expect((global.fetch as jest.Mock).mock.calls[1]?.[0]).toContain('offset=50');
});
```

**Polling cadence assertion** (verify 300s/600s, not 60s/300s):
```typescript
it('uses 300s polling interval when visible', () => {
  mockUseVisibility.mockReturnValue(true);
  renderHook(() => useDirigeraHistory());
  const pollingCall = mockUseAdaptivePolling.mock.calls[0]?.[0];
  expect(pollingCall?.interval).toBe(300_000);
});
```

---

### `app/components/devices/dirigera/components/DirigeraStatsPanel.tsx` (component, request-response)

**Analog (tile grid):** `app/components/devices/dirigera/components/DirigeraStats.tsx`
**Analog (panel shell + loading/error states):** `app/components/devices/dirigera/components/DirigeraHealthSection.tsx`

**Panel shell pattern** (from `DirigeraHealthSection.tsx`, lines 13–15):
```typescript
export default function DirigeraStatsPanel({ data, loading, error, stale }: DirigeraStatsPanelProps) {
  return (
    <div className="rounded-2xl bg-slate-800/50 p-4">
```

**Tile grid pattern** (from `DirigeraStats.tsx`, lines 11–44):
```typescript
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <div className="rounded-lg bg-slate-800/50 p-3">
    <div className="text-xs text-slate-400 mb-1">{label}</div>
    <div className="text-2xl font-bold text-slate-100">{value}</div>
  </div>
  {/* ... repeat for each tile */}
</div>
```

**Tile layout per UI-SPEC** — two subsections ("Aggregazione" and "Retention"), each 2×2 on mobile / 4×1 on sm+:
```typescript
// Aggregazione subsection
<section>
  <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-3">Aggregazione</h3>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {/* Tile: Righe aggregate totali */}
    {/* Tile: Ultima aggregazione (last_run_at as relative time) */}
    {/* Tile: Righe ultimo run */}
    {/* Tile: Stato ultimo run */}
  </div>
</section>
// Retention subsection — same grid structure
```

**State machine** (loading → data → empty → error):
```typescript
// Loading (no data yet)
if (loading && !data) return <div className="py-8 text-center"><Spinner /></div>;

// Error (no data)
if (error && !data) return (
  <p className="text-sm text-slate-400 py-4 text-center">
    Impossibile caricare le statistiche
  </p>
);

// Empty
if (!data) return (
  <p className="text-sm text-slate-400 py-4 text-center">
    Statistiche non disponibili
  </p>
);
```

**Stale re-fetch badge** (stale + data both present — show badge in heading):
```typescript
// From page.tsx lines 68-70 (Banner pattern):
{stale && loading && (
  <span className="text-xs text-ember-400">Aggiornamento…</span>
)}
{stale && !loading && (
  <span className="text-xs text-slate-400">Dati non aggiornati</span>
)}
```

**Props interface:**
```typescript
interface DirigeraStatsPanelProps {
  data: DirigeraStatsResponse | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}
```

---

### `app/components/devices/dirigera/components/DirigeraHistoryPanel.tsx` (component, request-response + paginated)

**Analog:** `app/components/devices/dirigera/components/DirigeraSensorList.tsx` (list container + empty state)

**Props interface:**
```typescript
interface DirigeraHistoryPanelProps {
  items: SensorEvent[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
}
```

**Empty state pattern** (from `DirigeraSensorList.tsx`, lines 19–23):
```typescript
if (items.length === 0 && !loading) {
  return (
    <p className="text-sm text-slate-400 py-4 text-center">
      Nessun evento
    </p>
  );
}
```

**Table structure** — no existing table analog in DIRIGERA components; follow the UI-SPEC column spec:
```typescript
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="text-xs uppercase tracking-wide text-slate-400">
        <th className="text-left pb-2">Sensore</th>
        <th className="text-left pb-2">Tipo evento</th>
        <th className="text-left pb-2">Data/ora</th>
      </tr>
    </thead>
    <tbody>
      {items.map(event => (
        <tr key={event.id} className="border-t border-slate-700/50">
          <td className="py-2">{event.sensor_name ?? event.sensor_id}</td>
          <td className="py-2">{event.event_type}</td>
          <td className="py-2 text-slate-400">
            {new Intl.DateTimeFormat('it-IT', {
              dateStyle: 'short',
              timeStyle: 'medium',
            }).format(new Date(event.recorded_at * 1000))}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Load more button** (from UI-SPEC — secondary style, full-width mobile, hidden when exhausted):
```typescript
{items.length < total && (
  <div className="mt-4 flex justify-center">
    <button
      onClick={loadMore}
      disabled={isLoadingMore}
      className="w-full sm:w-auto px-4 py-2 text-sm border border-slate-700 rounded-lg
                 hover:border-ember-500 focus-visible:ring-2 focus-visible:ring-ember-500
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoadingMore ? 'Caricamento...' : 'Carica altri 50'}
    </button>
  </div>
)}
```

---

### `app/components/devices/dirigera/components/DirigeraTelemetryPanel.tsx` (component, request-response + paginated)

**Analog:** `DirigeraHistoryPanel.tsx` (structurally identical, different columns and copy)

Structural clone of `DirigeraHistoryPanel` with:
- Heading: `"Telemetria"`
- Empty: `"Nessuna telemetria"`
- Error: `"Impossibile caricare la telemetria"`
- Table columns: Sensore (`reading.sensor_id`), Batteria (`reading.battery_percentage !== null ? reading.battery_percentage + '%' : '—'`), Lux (`reading.light_level !== null ? reading.light_level + ' lux' : '—'`), Data/ora (`reading.timestamp * 1000`)
- Props use `SensorTelemetryReading[]` (not `SensorEvent[]`)

**Props interface:**
```typescript
interface DirigeraTelemetryPanelProps {
  items: SensorTelemetryReading[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
}
```

---

### `app/components/devices/dirigera/hooks/useDirigeraData.ts` (hook, modify — URL swap only)

**Analog:** self

Only 3 string literals change. WS subscription code (`subscribe('dirigera', ...)`) is orthogonal and MUST NOT be touched.

**Lines 51–52** (current → new):
```typescript
// BEFORE:
fetch('/api/dirigera/health'),
fetch('/api/dirigera/sensors/summary'),
// AFTER:
fetch('/api/v1/dirigera/health'),
fetch('/api/v1/dirigera/sensors/summary'),
```

**Line 81** (current → new):
```typescript
// BEFORE:
const healthRes = await fetch('/api/dirigera/health');
// AFTER:
const healthRes = await fetch('/api/v1/dirigera/health');
```

**Verification after edit** — these WS lines must remain unchanged:
```typescript
// Lines 128-129 — must not change:
subscribe('dirigera', handleMessage);
return () => { unsubscribe('dirigera', handleMessage); };
```

---

### `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` (hook, modify — URL swap only)

**Analog:** self

4 string literals change (lines 16–19 and line 55).

**Lines 16–19** (from `useDirigeraFullData.ts`, lines 16–20):
```typescript
// BEFORE:
const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
  all: '/api/dirigera/sensors',
  contact: '/api/dirigera/sensors/contact',
  motion: '/api/dirigera/sensors/motion',
};
// AFTER:
const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
  all: '/api/v1/dirigera/sensors',
  contact: '/api/v1/dirigera/sensors/contact',
  motion: '/api/v1/dirigera/sensors/motion',
};
```

**Line 55** (from `useDirigeraFullData.ts`, line 55):
```typescript
// BEFORE:
fetch('/api/dirigera/health'),
// AFTER:
fetch('/api/v1/dirigera/health'),
```

---

### `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` (test, modify)

**Analog:** self

3 string literals change. Context: these are the lines that assert the URL called by the polling callback.

**Line 121** (from `useDirigeraData.test.ts`, line 121):
```typescript
// BEFORE:
expect(fetchMock).toHaveBeenCalledWith('/api/dirigera/health');
// AFTER:
expect(fetchMock).toHaveBeenCalledWith('/api/v1/dirigera/health');
```

**Line 122** (from `useDirigeraData.test.ts`, line 122):
```typescript
// BEFORE:
expect(fetchMock).toHaveBeenCalledWith('/api/dirigera/sensors/summary');
// AFTER:
expect(fetchMock).toHaveBeenCalledWith('/api/v1/dirigera/sensors/summary');
```

**Line 309** (from `useDirigeraData.test.ts`, line 309):
```typescript
// BEFORE:
expect(global.fetch).toHaveBeenCalledWith('/api/dirigera/health');
// AFTER:
expect(global.fetch).toHaveBeenCalledWith('/api/v1/dirigera/health');
```

---

### `app/dirigera/page.tsx` (page, modify — add 3 sections)

**Analog:** self (addition of new hook invocations and section rendering after `DirigeraSensorList`)

**New imports to add** (after existing imports at lines 1–15):
```typescript
import { useDirigeraStats } from '@/app/components/devices/dirigera/hooks/useDirigeraStats';
import { useDirigeraHistory } from '@/app/components/devices/dirigera/hooks/useDirigeraHistory';
import { useDirigeraTelemetry } from '@/app/components/devices/dirigera/hooks/useDirigeraTelemetry';
import DirigeraStatsPanel from '@/app/components/devices/dirigera/components/DirigeraStatsPanel';
import DirigeraHistoryPanel from '@/app/components/devices/dirigera/components/DirigeraHistoryPanel';
import DirigeraTelemetryPanel from '@/app/components/devices/dirigera/components/DirigeraTelemetryPanel';
```

**New hook invocations** (inside `DirigeraPage()`, after line 35):
```typescript
const { data: statsData, loading: statsLoading, error: statsError, stale: statsStale } = useDirigeraStats();
const { items: historyItems, total: historyTotal, loading: historyLoading, isLoadingMore: historyLoadingMore, error: historyError, stale: historyStale, loadMore: historyLoadMore } = useDirigeraHistory({ limit: 50 });
const { items: telemetryItems, total: telemetryTotal, loading: telemetryLoading, isLoadingMore: telemetryLoadingMore, error: telemetryError, stale: telemetryStale, loadMore: telemetryLoadMore } = useDirigeraTelemetry({ limit: 50 });
```

**Insertion point** — after `DirigeraSensorList` on line 99, inside the `space-y-6` div:
```typescript
{/* Sensor list */}
{data && <DirigeraSensorList sensors={data.sensors} filter={filter} />}

{/* Stats panel — mt-12 gap from sensor list per UI-SPEC */}
<DirigeraStatsPanel
  data={statsData}
  loading={statsLoading}
  error={statsError}
  stale={statsStale}
/>

{/* Recent Events panel */}
<DirigeraHistoryPanel
  items={historyItems}
  total={historyTotal}
  loading={historyLoading}
  isLoadingMore={historyLoadingMore}
  error={historyError}
  stale={historyStale}
  loadMore={historyLoadMore}
/>

{/* Telemetry panel */}
<DirigeraTelemetryPanel
  items={telemetryItems}
  total={telemetryTotal}
  loading={telemetryLoading}
  isLoadingMore={telemetryLoadingMore}
  error={telemetryError}
  stale={telemetryStale}
  loadMore={telemetryLoadMore}
/>
```

---

### `tests/smoke/page-loads.spec.ts` (test, modify — add `/dirigera` test case)

**Analog:** existing `/raspi` test case (lines 79–89) — same skeleton loading pattern

The `/dirigera` page shows a skeleton guard when `loading && !data`. The test should await `networkidle` (like `/raspi`) rather than a specific heading (data may not load in test env).

**Test case to add** inside `test.describe('Device Pages')`, after `/raspi`:
```typescript
test('/dirigera loads and shows data', async ({ page }) => {
  // E2E-10: DIRIGERA hub page loads
  const { errors, cleanup } = collectConsoleErrors(page);
  await page.goto('/dirigera');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
  cleanup();
  expect(errors, `Console errors on /dirigera: ${errors.join(', ')}`).toHaveLength(0);
});
```

---

## Shared Patterns

### Auth Guard
**Source:** `app/api/v1/dirigera/stats/route.ts` (line 11) — all existing v1 routes
**Apply to:** All 5 new v1 wrapper routes
```typescript
export const GET = withAuthAndErrorHandler(async () => {
  // ...
}, 'Dirigera/RouteName');
```
Import: `import { withAuthAndErrorHandler, success } from '@/lib/core';`

### Force Dynamic
**Source:** `app/api/v1/dirigera/stats/route.ts` (line 3)
**Apply to:** All 5 new v1 wrapper routes
```typescript
export const dynamic = 'force-dynamic';
```

### Response Envelope Split
**Source:** Verified from legacy routes
**Apply to:** All 5 new v1 wrapper routes — TWO distinct patterns:
- **Full passthrough** (`health`, `sensors/summary`): `success(data as unknown as Record<string, unknown>)`
- **Explicit field spread** (`sensors`, `sensors/contact`, `sensors/motion`): `success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale })`

### Adaptive Polling + Visibility
**Source:** `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` (lines 41–42, 86–93)
**Apply to:** `useDirigeraHistory`, `useDirigeraStats`, `useDirigeraTelemetry`
```typescript
const isVisible = useVisibility();
const interval = isVisible ? 300_000 : 600_000;  // Slower than useDirigeraFullData (60s)

useAdaptivePolling({
  callback: fetchData,
  interval,
  alwaysActive: false,   // Non-safety-critical
  immediate: true,
  initialDelay: 600,
});
```

### Italian Error Copy
**Source:** `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` (line 79) and `app/dirigera/page.tsx` (line 69)
**Apply to:** All new hooks and panel components
- Hook error: `'Impossibile caricare {lo storico|le statistiche|la telemetria}'`
- Panel empty state: `'Nessun {evento|telemetria}' / 'Statistiche non disponibili'`
- Stale banner: `'Dati non aggiornati'`

### DataRef Pattern (retain last-known data on error)
**Source:** `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` (lines 39, 76–81)
**Apply to:** All 3 new hooks
```typescript
const dataRef = useRef<T | null>(null);
// On success: dataRef.current = newData;
// On error:
setStale(true);
if (!dataRef.current) setError('...');  // Only set error if no cached data
```

### Route Test Structure
**Source:** `app/api/v1/dirigera/stats/__tests__/route.test.ts` (lines 1–64)
**Apply to:** All 5 new v1 route tests
```typescript
// Mocks BEFORE imports (Jest hoisting requirement)
jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

// Then static imports
import { GET } from '../route';
```

### Console Suppression in Route Tests
**Source:** `app/api/v1/dirigera/stats/__tests__/route.test.ts` (lines 38–40)
**Apply to:** All 5 new v1 route tests
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(mockSession as any);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
```

### Smoke Test Pattern
**Source:** `tests/smoke/page-loads.spec.ts` (lines 7–20, `collectConsoleErrors` helper; lines 79–89, `/raspi` test)
**Apply to:** New `/dirigera` smoke test case

---

## Response Shape Reference

This table is critical for D-02 compliance (exact envelope copy):

| Route | Proxy Function | v1 Wrapper Pattern | Key Fields in Response |
|---|---|---|---|
| `/api/v1/dirigera/health` | `getHealth()` | Full passthrough | `firmware_version`, `connected_sensors`, `is_reachable` |
| `/api/v1/dirigera/sensors` | `getSensors()` | Explicit spread | `sensors[]`, `count`, `is_stale` |
| `/api/v1/dirigera/sensors/summary` | `getSensorSummary()` | Full passthrough | `total_sensors`, `open_count`, `offline_count`, `low_battery_count`, `is_stale` |
| `/api/v1/dirigera/sensors/contact` | `getContactSensors()` | Explicit spread | `sensors[]`, `count`, `is_stale` |
| `/api/v1/dirigera/sensors/motion` | `getMotionSensors()` | Explicit spread | `sensors[]`, `count`, `is_stale` |

---

## No Analog Found

All files have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `app/api/v1/dirigera/`, `app/api/dirigera/`, `app/components/devices/dirigera/`, `tests/smoke/`
**Files scanned:** 15 source files read directly
**Pattern extraction date:** 2026-04-22
