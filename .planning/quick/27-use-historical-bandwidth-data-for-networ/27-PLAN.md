---
phase: quick-27
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/fritzbox/bandwidthHistoryLogger.ts
  - lib/fritzbox/index.ts
  - app/api/fritzbox/bandwidth-history/route.ts
  - app/network/hooks/useBandwidthHistory.ts
  - app/components/devices/network/networkHealthUtils.ts
autonomous: true
requirements:
  - PERSIST-BW-01
  - PERSIST-BW-02
  - PERSIST-BW-03
  - PERSIST-BW-04

must_haves:
  truths:
    - "Charts immediately show historical data when the network page opens (not blank then filling)"
    - "Bandwidth readings are stored in Firebase RTDB and survive page close/navigate"
    - "Old data (>7 days) is cleaned up automatically on each write"
    - "Network health assessment reflects average saturation trend, not just the single latest reading"
  artifacts:
    - path: "lib/fritzbox/bandwidthHistoryLogger.ts"
      provides: "Firebase RTDB persistence for bandwidth readings (append + query + cleanup)"
      exports: ["appendBandwidthReading", "getBandwidthHistory", "cleanupOldBandwidthReadings"]
    - path: "app/api/fritzbox/bandwidth-history/route.ts"
      provides: "GET endpoint to fetch persisted bandwidth history by time range"
      exports: ["GET"]
    - path: "app/network/hooks/useBandwidthHistory.ts"
      provides: "Updated hook that loads stored history on mount and persists each new reading"
    - path: "app/components/devices/network/networkHealthUtils.ts"
      provides: "Enhanced health algorithm using historicalAvgSaturation"
  key_links:
    - from: "app/network/hooks/useBandwidthHistory.ts"
      to: "/api/fritzbox/bandwidth-history"
      via: "fetch in useEffect on mount"
      pattern: "fetch.*bandwidth-history"
    - from: "app/api/fritzbox/bandwidth/route.ts"
      to: "lib/fritzbox/bandwidthHistoryLogger.ts"
      via: "appendBandwidthReading call after getCachedData"
      pattern: "appendBandwidthReading"
    - from: "app/network/hooks/useBandwidthHistory.ts"
      to: "/api/fritzbox/bandwidth-history"
      via: "POST or server action to persist client-side reading"
      pattern: "addDataPoint.*persist"
---

<objective>
Persist bandwidth readings to Firebase RTDB so charts always have historical data on page open, and enhance health assessment with trend awareness.

Purpose: Charts currently start empty every page load — users see no data until polling accumulates new readings. Health status is assessed from a single reading, making it noisy. Historical storage fixes both.
Output: bandwidthHistoryLogger.ts (RTDB persistence), bandwidth-history API route (fetch history), updated useBandwidthHistory (load on mount + persist on write), enhanced computeNetworkHealth (trend-aware).
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

# Key reference files
@lib/fritzbox/deviceEventLogger.ts
@lib/fritzbox/fritzboxCache.ts
@lib/fritzbox/index.ts
@app/api/fritzbox/bandwidth/route.ts
@app/api/fritzbox/history/route.ts
@app/network/hooks/useBandwidthHistory.ts
@app/components/devices/network/networkHealthUtils.ts
@app/components/devices/network/types.ts
@app/network/page.tsx
@lib/environmentHelper.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bandwidth history persistence library + storage in bandwidth route</name>
  <files>
    lib/fritzbox/bandwidthHistoryLogger.ts
    lib/fritzbox/index.ts
    app/api/fritzbox/bandwidth/route.ts
  </files>
  <action>
Create `lib/fritzbox/bandwidthHistoryLogger.ts` modeled after `deviceEventLogger.ts`:

- Firebase path: `{env}/fritzbox/bandwidth_history/{YYYY-MM-DD}/{timestamp}` (timestamp as key, value = `{ time: number, download: number, upload: number }`)
- Export `appendBandwidthReading(data: BandwidthData): Promise<void>` — writes one point to today's date node using `adminDbSet`
- Export `getBandwidthHistory(startTime: number, endTime: number): Promise<BandwidthHistoryPoint[]>` — queries all date nodes in range (parallel like `getDeviceEvents`), merges, filters by exact timestamp, sorts oldest first (ascending for chart)
- Export `cleanupOldBandwidthHistory(): Promise<void>` — deletes date nodes older than 7 days. Compute cutoff date (`now - 7*24*60*60*1000`), get all keys under `{env}/fritzbox/bandwidth_history`, remove keys where date < cutoff. Use `adminDbGet` to list keys then `adminDbRemove` per old key.

Import `BandwidthData` and `BandwidthHistoryPoint` from `@/app/components/devices/network/types`.
Import `adminDbSet`, `adminDbGet`, `adminDbRemove` from `@/lib/firebaseAdmin`.
Import `getEnvironmentPath` from `@/lib/environmentHelper`.
Import `format` from `date-fns` (already in package.json via deviceEventLogger).

Add barrel exports to `lib/fritzbox/index.ts`:
```
export { appendBandwidthReading, getBandwidthHistory, cleanupOldBandwidthHistory } from './bandwidthHistoryLogger';
```

Update `app/api/fritzbox/bandwidth/route.ts` — after the `getCachedData` call (step 2), fire-and-forget persist + cleanup:
```typescript
// Fire-and-forget: persist to RTDB + cleanup old data
appendBandwidthReading(bandwidth).catch(() => {});
cleanupOldBandwidthHistory().catch(() => {});
```
Do NOT await these — they must not delay the response. Import them from `@/lib/fritzbox`.

No changes to rate limiting, auth, or cache logic.
  </action>
  <verify>
Run `npm test -- --testPathPattern="bandwidthHistoryLogger" --passWithNoTests` (creates test file in Task 3).
Check TypeScript: grep for import errors by examining the file structure.
Confirm `lib/fritzbox/index.ts` exports the three new functions.
  </verify>
  <done>
`bandwidthHistoryLogger.ts` exists with `appendBandwidthReading`, `getBandwidthHistory`, `cleanupOldBandwidthHistory`.
`index.ts` barrel-exports all three.
`bandwidth/route.ts` fires-and-forgets persist + cleanup after fetching.
No TypeScript errors in these files.
  </done>
</task>

<task type="auto">
  <name>Task 2: GET /api/fritzbox/bandwidth-history route + useBandwidthHistory load on mount</name>
  <files>
    app/api/fritzbox/bandwidth-history/route.ts
    app/network/hooks/useBandwidthHistory.ts
  </files>
  <action>
**Create `app/api/fritzbox/bandwidth-history/route.ts`** — follow the same pattern as `app/api/fritzbox/history/route.ts`:

```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getBandwidthHistory } from '@/lib/fritzbox';
import type { BandwidthTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

function getTimeRangeMs(range: string): number { /* same switch as history/route.ts */ }

export const GET = withAuthAndErrorHandler(async (request) => {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';
  const validRanges: BandwidthTimeRange[] = ['1h', '24h', '7d'];
  const range: BandwidthTimeRange = validRanges.includes(rangeParam as BandwidthTimeRange)
    ? (rangeParam as BandwidthTimeRange) : '24h';

  const endTime = Date.now();
  const startTime = endTime - getTimeRangeMs(range);

  const points = await getBandwidthHistory(startTime, endTime);

  return success({ points, range, totalCount: points.length });
}, 'FritzBox/BandwidthHistory');
```

No rate limiting needed (read-only, low frequency — only called on page mount).

**Update `app/network/hooks/useBandwidthHistory.ts`** — add Firebase-backed history loading on mount:

1. Add `useEffect` import (already has useState, useCallback, useMemo — add useEffect).
2. Add `isLoading` state: `const [isLoading, setIsLoading] = useState(true)`.
3. Add `loadHistoryFromServer` function that fetches `/api/fritzbox/bandwidth-history?range=7d` on mount, parses `data.points`, and calls `setHistory(points)` directly (bypass `addDataPoint` to avoid triggering re-renders per point). Sort by time ascending before setting.
4. Wire in `useEffect(() => { loadHistoryFromServer(); }, [])`.
5. Update `isCollecting` derived value: `history.length > 0 && history.length < COLLECTING_THRESHOLD && !isLoading`.
6. Update `isEmpty` derived value: `history.length === 0 && !isLoading`.
7. Add `isLoading` to `UseBandwidthHistoryReturn` type in `app/components/devices/network/types.ts`.

The existing `addDataPoint` remains unchanged — it continues appending live polling data. When a new point arrives from polling that is already in the loaded history (same timestamp), duplicates are naturally avoided because polling creates fresh timestamps.

Do NOT change BandwidthChart.tsx or page.tsx — they receive chartData and isEmpty/isCollecting through the existing interface.
  </action>
  <verify>
Run `npm test -- --testPathPattern="useBandwidthHistory" --passWithNoTests`.
Confirm route file exists at `app/api/fritzbox/bandwidth-history/route.ts`.
Confirm `useBandwidthHistory.ts` imports `useEffect`.
Confirm `types.ts` has `isLoading` in `UseBandwidthHistoryReturn`.
  </verify>
  <done>
GET `/api/fritzbox/bandwidth-history?range=7d` returns `{ success: true, data: { points: [...], range: '7d', totalCount: N } }`.
`useBandwidthHistory` fetches stored history on mount — `isEmpty` and `isCollecting` reflect loading state.
`UseBandwidthHistoryReturn` has `isLoading: boolean`.
No TypeScript errors.
  </done>
</task>

<task type="auto">
  <name>Task 3: Trend-aware health assessment + tests</name>
  <files>
    app/components/devices/network/networkHealthUtils.ts
    app/components/devices/network/hooks/useNetworkData.ts
    lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts
  </files>
  <action>
**Update `networkHealthUtils.ts`** — add optional `historicalAvgSaturation` to the health algorithm:

Add to `ComputeNetworkHealthParams`:
```typescript
historicalAvgSaturation?: number; // Average saturation over last 30 min (0-1), undefined if not enough data
```

In `computeNetworkHealth`, after computing `saturation` (current reading), compute `effectiveSaturation`:
```typescript
// Use weighted average if historical data available: 30% current, 70% historical trend
const effectiveSaturation = historicalAvgSaturation !== undefined
  ? 0.3 * saturation + 0.7 * historicalAvgSaturation
  : saturation;
```

Replace all uses of `saturation` in the threshold checks (rules 2-4) with `effectiveSaturation`. The current reading still dominates when no history exists (falls back to `saturation`).

**Update `useNetworkData.ts`** — compute `historicalAvgSaturation` from the sparkline buffers already maintained in the hook (`downloadHistory`, `uploadHistory`). The hook already keeps a `SparklinePoint[]` buffer.

In the health computation call (find `computeNetworkHealth(`), add:
```typescript
// Compute average saturation over last 30 min from sparkline history
const THIRTY_MIN_MS = 30 * 60 * 1000;
const cutoff = Date.now() - THIRTY_MIN_MS;
const recentDownload = downloadHistory.filter(p => p.time >= cutoff);
const recentUpload = uploadHistory.filter(p => p.time >= cutoff);
const linkSpd = wan?.linkSpeed ?? 100;
let historicalAvgSaturation: number | undefined;
if (recentDownload.length >= 3) { // Need at least 3 points for meaningful average
  const avgDown = recentDownload.reduce((s, p) => s + p.mbps, 0) / recentDownload.length;
  const avgUp = recentUpload.reduce((s, p) => s + p.mbps, 0) / Math.max(recentUpload.length, 1);
  historicalAvgSaturation = Math.max(avgDown, avgUp) / linkSpd;
}
```

Pass `historicalAvgSaturation` to `computeNetworkHealth`.

**Create `lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts`** — unit tests for the persistence module:
- Mock `@/lib/firebaseAdmin` (adminDbSet, adminDbGet, adminDbRemove)
- Mock `@/lib/environmentHelper` (getEnvironmentPath returns basePath as-is)
- Test `appendBandwidthReading`: verifies adminDbSet called with correct path pattern (`fritzbox/bandwidth_history/YYYY-MM-DD/timestamp`)
- Test `getBandwidthHistory`: adminDbGet returns mock date-keyed data, verifies merged + sorted output
- Test `cleanupOldBandwidthHistory`: adminDbGet returns keys including old dates, verifies adminDbRemove called for dates older than 7 days only
- Test `computeNetworkHealth` with `historicalAvgSaturation`: verify weighted blend produces 'degraded' when current is fine but historical is high (and 'good' when both are moderate)
  </action>
  <verify>
Run `npm test -- --testPathPattern="bandwidthHistoryLogger|networkHealthUtils" --passWithNoTests`.
Check no TypeScript errors in networkHealthUtils.ts and useNetworkData.ts.
Verify `historicalAvgSaturation` is in `ComputeNetworkHealthParams` interface.
  </verify>
  <done>
`computeNetworkHealth` accepts `historicalAvgSaturation?: number` and uses 70/30 weighted blend when available.
`useNetworkData` computes and passes `historicalAvgSaturation` from sparkline history (3+ recent points).
`bandwidthHistoryLogger.test.ts` exists with passing tests covering append, query, cleanup, and weighted health.
`npm test` passes with no regressions.
  </done>
</task>

</tasks>

<verification>
1. `npm test` — all tests pass including new bandwidthHistoryLogger suite
2. Visit `/network` page: bandwidth chart shows data immediately (loaded from Firebase history), not blank on first visit
3. On subsequent page visits, chart pre-populated without waiting for polling
4. In Firebase RTDB console: `fritzbox/bandwidth_history/YYYY-MM-DD/` keys accumulate on each /api/fritzbox/bandwidth poll
5. Health status on NetworkCard uses trend-smoothed assessment (less flapping)
</verification>

<success_criteria>
- Firebase RTDB path `fritzbox/bandwidth_history/{date}/{timestamp}` accumulates readings on each bandwidth poll
- `/api/fritzbox/bandwidth-history?range=7d` returns stored points array
- `useBandwidthHistory` loads 7 days of stored history on mount — `isEmpty=false` immediately if history exists
- `computeNetworkHealth` uses `historicalAvgSaturation` when provided (70% weight), falls back to current reading only
- All existing tests pass, new logger tests cover append/query/cleanup
</success_criteria>

<output>
After completion, create `.planning/quick/27-use-historical-bandwidth-data-for-networ/27-SUMMARY.md`
</output>
