---
phase: quick-28
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/fritzbox/bandwidthHistoryLogger.ts (DELETE)
  - lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts (DELETE)
  - lib/fritzbox/index.ts
  - lib/fritzbox/fritzboxClient.ts
  - app/api/fritzbox/bandwidth/route.ts
  - app/api/fritzbox/bandwidth/__tests__/route.test.ts
  - app/api/fritzbox/bandwidth-history/route.ts
  - app/network/hooks/useBandwidthHistory.ts
autonomous: true
---

<objective>
Replace Firebase RTDB bandwidth persistence with external Fritz!Box history API proxy.

The external API `GET /api/v1/history/bandwidth` already provides historical bandwidth data — no need to persist readings ourselves. Remove all Firebase persistence code and proxy the external API instead.

External API response format:
```json
{
  "items": [
    {
      "timestamp": 1770990000,      // Unix SECONDS
      "bytes_sent": 12345678,
      "bytes_received": 87654321,
      "upstream_rate": 50000000,    // bps
      "downstream_rate": 100000000  // bps
    }
  ],
  "total_count": 1440,
  "limit": 50,
  "offset": 0
}
```
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@lib/fritzbox/fritzboxClient.ts
@lib/fritzbox/index.ts
@app/api/fritzbox/bandwidth/route.ts
@app/api/fritzbox/bandwidth/__tests__/route.test.ts
@app/api/fritzbox/bandwidth-history/route.ts
@app/network/hooks/useBandwidthHistory.ts
@app/components/devices/network/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove Firebase persistence, add getBandwidthHistory to FritzBoxClient</name>
  <files>
    lib/fritzbox/bandwidthHistoryLogger.ts (DELETE)
    lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts (DELETE)
    lib/fritzbox/index.ts
    lib/fritzbox/fritzboxClient.ts
    app/api/fritzbox/bandwidth/route.ts
    app/api/fritzbox/bandwidth/__tests__/route.test.ts
  </files>
  <action>
**1a. Delete `lib/fritzbox/bandwidthHistoryLogger.ts`** — no longer needed, external API has history.

**1b. Delete `lib/fritzbox/__tests__/bandwidthHistoryLogger.test.ts`** — tests for deleted module.

**1c. Remove barrel exports from `lib/fritzbox/index.ts`:**
Remove the line:
```
export { appendBandwidthReading, getBandwidthHistory, cleanupOldBandwidthHistory } from './bandwidthHistoryLogger';
```

**1d. Add `getBandwidthHistory()` to `FritzBoxClient` in `lib/fritzbox/fritzboxClient.ts`:**
```typescript
/**
 * Get historical bandwidth data
 *
 * Raw: { items: [{ timestamp, bytes_sent, bytes_received, upstream_rate, downstream_rate }], total_count, limit, offset }
 * Returns: array of { time, download, upload } points sorted ascending
 */
async getBandwidthHistory(hours: number = 24): Promise<Array<{ time: number; download: number; upload: number }>> {
  // Fetch all pages
  const limit = 1000;
  let offset = 0;
  const allItems: Array<{ timestamp: number; upstream_rate: number; downstream_rate: number }> = [];

  // First request to get total_count
  const firstPage = (await this.request(`/api/v1/history/bandwidth?hours=${hours}&limit=${limit}&offset=0`)) as {
    items: Array<{ timestamp: number; bytes_sent: number; bytes_received: number; upstream_rate: number; downstream_rate: number }>;
    total_count: number;
    limit: number;
    offset: number;
  };

  allItems.push(...firstPage.items);
  const totalCount = firstPage.total_count;

  // Fetch remaining pages in parallel if needed
  if (totalCount > limit) {
    const remainingPages = [];
    for (offset = limit; offset < totalCount; offset += limit) {
      remainingPages.push(
        this.request(`/api/v1/history/bandwidth?hours=${hours}&limit=${limit}&offset=${offset}`) as Promise<typeof firstPage>
      );
    }
    const pages = await Promise.all(remainingPages);
    for (const page of pages) {
      allItems.push(...page.items);
    }
  }

  // Transform: timestamp (Unix seconds) → ms, rates (bps) → Mbps
  return allItems
    .map(item => ({
      time: item.timestamp * 1000,
      download: item.downstream_rate / 1_000_000,
      upload: item.upstream_rate / 1_000_000,
    }))
    .sort((a, b) => a.time - b.time);
}
```

**1e. Revert `app/api/fritzbox/bandwidth/route.ts`:**
Remove the fire-and-forget lines:
```typescript
// 3. Fire-and-forget: persist to RTDB + cleanup old data
appendBandwidthReading(bandwidth).catch(() => {});
cleanupOldBandwidthHistory().catch(() => {});
```
Remove the imports of `appendBandwidthReading` and `cleanupOldBandwidthHistory` from `@/lib/fritzbox`.
Update the import to: `import { fritzboxClient, getCachedData, checkRateLimitFritzBox } from '@/lib/fritzbox';`
Renumber comments: step 3 → "Return data".

**1f. Fix `app/api/fritzbox/bandwidth/__tests__/route.test.ts`:**
Remove imports of `appendBandwidthReading` and `cleanupOldBandwidthHistory`.
Remove the `const mockAppendBandwidthReading` and `const mockCleanupOldBandwidthHistory` lines.
Remove the mock setup lines from `beforeEach`:
```typescript
mockAppendBandwidthReading.mockResolvedValue(undefined);
mockCleanupOldBandwidthHistory.mockResolvedValue(undefined);
```
  </action>
  <verify>
Run `npm test -- --testPathPattern="bandwidth/.*route" --passWithNoTests` to verify bandwidth route tests pass.
Confirm `bandwidthHistoryLogger.ts` is deleted.
Confirm `index.ts` no longer exports the three functions.
  </verify>
  <done>
Firebase persistence layer fully removed. FritzBoxClient has `getBandwidthHistory()` that calls external API.
Bandwidth route no longer fires-and-forgets to Firebase.
Tests updated and passing.
  </done>
</task>

<task type="auto">
  <name>Task 2: Rewrite bandwidth-history proxy route + update hook</name>
  <files>
    app/api/fritzbox/bandwidth-history/route.ts
    app/network/hooks/useBandwidthHistory.ts
  </files>
  <action>
**2a. Rewrite `app/api/fritzbox/bandwidth-history/route.ts`:**
Proxy the external API via `fritzboxClient.getBandwidthHistory()` instead of reading from Firebase.

```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import type { BandwidthTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/bandwidth-history
 * Proxies historical bandwidth data from external Fritz!Box API
 * Protected: Requires Auth0 authentication
 *
 * Query params:
 *   - range: '1h' | '24h' | '7d' (default: '24h')
 *
 * Success: { points: BandwidthHistoryPoint[], range: string, totalCount: number }
 */

function rangeToHours(range: BandwidthTimeRange): number {
  switch (range) {
    case '1h': return 1;
    case '24h': return 24;
    case '7d': return 168;
  }
}

export const GET = withAuthAndErrorHandler(async (request) => {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';

  const validRanges: BandwidthTimeRange[] = ['1h', '24h', '7d'];
  const range: BandwidthTimeRange = validRanges.includes(rangeParam as BandwidthTimeRange)
    ? (rangeParam as BandwidthTimeRange)
    : '24h';

  const hours = rangeToHours(range);
  const points = await fritzboxClient.getBandwidthHistory(hours);

  return success({
    points,
    range,
    totalCount: points.length,
  });
}, 'FritzBox/BandwidthHistory');
```

**2b. `useBandwidthHistory.ts`** — No changes needed! The hook already fetches from `/api/fritzbox/bandwidth-history?range=7d` and expects `{ data: { points: [{ time, download, upload }] } }`. The proxy route returns the same shape since `fritzboxClient.getBandwidthHistory()` transforms external API data to that format.

Verify the hook code is correct — no changes needed.
  </action>
  <verify>
Confirm the route file compiles (no import errors).
Confirm `useBandwidthHistory.ts` is unchanged (response format matches).
Run `npm test -- --testPathPattern="useBandwidthHistory" --passWithNoTests`.
  </verify>
  <done>
`/api/fritzbox/bandwidth-history` proxies external Fritz!Box API.
`useBandwidthHistory` unchanged — response format compatible.
  </done>
</task>

</tasks>

<success_criteria>
- Firebase bandwidth persistence code fully removed (bandwidthHistoryLogger.ts deleted)
- FritzBoxClient.getBandwidthHistory() calls external /api/v1/history/bandwidth
- /api/fritzbox/bandwidth-history route proxies via fritzboxClient
- Bandwidth route no longer fire-and-forgets to Firebase
- All tests pass, useBandwidthHistory hook works unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/28-replace-firebase-bandwidth-persistence-w/28-SUMMARY.md`
</output>
