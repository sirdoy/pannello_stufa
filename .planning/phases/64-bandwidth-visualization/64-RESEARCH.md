# Phase 64: Bandwidth Visualization - Research

**Researched:** 2026-02-16
**Domain:** Real-time bandwidth chart with time-range selection and data decimation
**Confidence:** HIGH

## Summary

Phase 64 adds interactive bandwidth visualization to the `/network` page, building on existing infrastructure from Phases 62-63. The implementation leverages Recharts (already in package.json), adaptive polling (from Phase 57), and the orchestrator pattern (from Phases 58-59). Critical requirement: data decimation for 7-day views to prevent mobile crashes with 1440+ data points.

Key technical decisions already made by existing codebase:
- Recharts 2.15.0 for charts (used in analytics components)
- date-fns 4.1.0 for date formatting
- useAdaptivePolling hook (30s visible, 5min hidden) from Phase 57
- Orchestrator pattern (hooks + presentational components) from Phases 58-59
- Fritz!Box bandwidth API route exists (`/api/fritzbox/bandwidth`)
- Firebase RTDB cache with 60s TTL

**Primary recommendation:** Use Recharts LineChart with responsiveContainer + time range selector (1h/24h/7d) + LTTB decimation algorithm client-side to max 500 points for 7-day view. Store historical bandwidth data in local state (sparkline buffer pattern from useNetworkData), not Firebase.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | 2.15.0 | Interactive charts | Already used for analytics (ConsumptionChart, UsageChart), declarative API, excellent TypeScript support, 24k+ GitHub stars |
| date-fns | 4.1.0 | Date formatting/manipulation | Already in package.json, used across analytics components, tree-shakeable, smaller than moment.js |
| React hooks | 19.2.0 | State management | useState for chart data buffer, useMemo for decimated data, useCallback for time range handlers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useAdaptivePolling | (custom) | Visibility-aware polling | Already exists in lib/hooks, handles 30s visible / 5min hidden tab polling automatically |
| useVisibility | (custom) | Tab visibility detection | Already exists, used by useAdaptivePolling for adaptive intervals |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js | Chart.js mentioned in pitfalls doc for decimation plugin, but Recharts already integrated, React-native, same decimation achievable with LTTB algorithm client-side |
| Client-side decimation | Backend aggregation | Backend aggregation (hourly buckets) would reduce data transfer but requires new API endpoint + Fritz!Box client changes. Client-side decimation simpler for MVP, can optimize later if needed |
| Local state buffer | Firebase history storage | Firebase adds latency + costs, bandwidth data transient (not critical to persist), local buffer pattern already proven in useNetworkData sparklines |

**Installation:**
```bash
# No new dependencies needed - all already installed
# Recharts: already in package.json v2.15.0
# date-fns: already in package.json v4.1.0
```

## Architecture Patterns

### Recommended Project Structure
```
app/network/
├── components/
│   ├── BandwidthChart.tsx          # NEW: Recharts LineChart with time range selector
│   ├── TimeRangeSelector.tsx       # NEW: 1h/24h/7d button group
│   ├── WanStatusCard.tsx           # Existing from Phase 63
│   └── DeviceListTable.tsx         # Existing from Phase 63
├── hooks/
│   ├── useBandwidthHistory.ts      # NEW: Historical data buffering + decimation
│   └── useNetworkData.ts           # Existing from Phase 62
└── page.tsx                        # Existing orchestrator from Phase 63
```

### Pattern 1: Data Decimation with LTTB (Largest Triangle Three Buckets)

**What:** Client-side algorithm that reduces N data points to target M points while preserving visual fidelity. Keeps visually significant peaks/valleys, removes redundant flat sections.

**When to use:** When rendering >500 data points on charts, especially mobile. 7-day bandwidth at 1-minute granularity = 10,080 points → decimate to 500 points.

**Example:**
```typescript
// Source: Downsample algorithm pattern (LTTB commonly used for time-series)
// Simplified implementation for bandwidth data
function decimateLTTB(
  data: Array<{ time: number; mbps: number }>,
  threshold: number
): Array<{ time: number; mbps: number }> {
  if (data.length <= threshold) return data;

  const bucketSize = (data.length - 2) / (threshold - 2);
  const decimated: typeof data = [data[0]]; // Always keep first point

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    // Calculate point average for next bucket
    let avgX = 0, avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd && j < data.length; j++) {
      avgX += data[j].time;
      avgY += data[j].mbps;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Get current bucket range
    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Find point with largest triangle area
    const pointAX = data[a].time;
    const pointAY = data[a].mbps;
    let maxArea = -1;
    let maxAreaPoint = rangeStart;

    for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
      const area = Math.abs(
        (pointAX - avgX) * (data[j].mbps - pointAY) -
        (pointAX - data[j].time) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = j;
      }
    }

    decimated.push(data[maxAreaPoint]);
    a = maxAreaPoint;
  }

  decimated.push(data[data.length - 1]); // Always keep last point
  return decimated;
}
```

### Pattern 2: Time Range Selection with Data Buffering

**What:** Store bandwidth history in local state with sliding window buffer. Time range selector filters and decimates data reactively.

**When to use:** When displaying multiple time ranges from same dataset without re-fetching.

**Example:**
```typescript
// Source: Adapted from existing useNetworkData sparkline pattern
export function useBandwidthHistory() {
  const [history, setHistory] = useState<BandwidthPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  // Add new bandwidth data point
  const addDataPoint = useCallback((bandwidth: BandwidthData) => {
    setHistory(prev => {
      const newPoint = {
        time: bandwidth.timestamp,
        download: bandwidth.download,
        upload: bandwidth.upload
      };

      // Keep max 7 days of data (10,080 minutes)
      const maxPoints = 10080;
      const updated = [...prev, newPoint];
      return updated.slice(-maxPoints);
    });
  }, []);

  // Filter by time range + decimate if needed
  const chartData = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - ranges[timeRange];
    const filtered = history.filter(p => p.time >= cutoff);

    // Decimate if >500 points (7d view with 1-min polling)
    const threshold = 500;
    if (filtered.length > threshold) {
      return {
        download: decimateLTTB(
          filtered.map(p => ({ time: p.time, mbps: p.download })),
          threshold
        ),
        upload: decimateLTTB(
          filtered.map(p => ({ time: p.time, mbps: p.upload })),
          threshold
        ),
      };
    }

    return {
      download: filtered.map(p => ({ time: p.time, mbps: p.download })),
      upload: filtered.map(p => ({ time: p.time, mbps: p.upload })),
    };
  }, [history, timeRange]);

  return { chartData, timeRange, setTimeRange, addDataPoint };
}
```

### Pattern 3: Recharts LineChart with Dual Lines

**What:** Responsive chart with separate upload/download lines, custom tooltip, gradient fills.

**When to use:** Displaying two related time-series metrics (upload + download bandwidth).

**Example:**
```typescript
// Source: Adapted from existing ConsumptionChart.tsx + UsageChart.tsx patterns
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function BandwidthChart({ data, timeRange }) {
  // Format X-axis based on time range
  const formatXAxis = (timestamp: number) => {
    if (timeRange === '1h') return format(timestamp, 'HH:mm');
    if (timeRange === '24h') return format(timestamp, 'HH:mm');
    return format(timestamp, 'MMM dd');
  };

  // Merge download + upload into single array for Recharts
  const chartData = useMemo(() => {
    if (data.download.length === 0) return [];

    return data.download.map((d, i) => ({
      time: d.time,
      download: d.mbps,
      upload: data.upload[i]?.mbps ?? 0,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {/* Grid */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="opacity-10"
        />

        {/* X-axis: Time */}
        <XAxis
          dataKey="time"
          tickFormatter={formatXAxis}
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
        />

        {/* Y-axis: Mbps */}
        <YAxis
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
          label={{
            value: 'Mbps',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
          }}
        />

        {/* Tooltip */}
        <Tooltip content={<CustomTooltip />} />

        {/* Legend */}
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />

        {/* Download line */}
        <Line
          type="monotone"
          dataKey="download"
          stroke="rgb(52, 211, 153)" // emerald-400
          strokeWidth={2}
          dot={false}
          name="Download"
          isAnimationActive={false}
        />

        {/* Upload line */}
        <Line
          type="monotone"
          dataKey="upload"
          stroke="rgb(45, 212, 191)" // teal-400
          strokeWidth={2}
          dot={false}
          name="Upload"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 4: Time Range Selector Component

**What:** Button group for switching between 1h/24h/7d views.

**When to use:** Multi-range chart controls.

**Example:**
```typescript
// Source: Adapted from existing Button.Group pattern
import { Button } from '@/app/components/ui';

export default function TimeRangeSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Text variant="secondary" size="sm">Time range:</Text>
      <Button.Group>
        <Button
          variant={value === '1h' ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => onChange('1h')}
        >
          1h
        </Button>
        <Button
          variant={value === '24h' ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => onChange('24h')}
        >
          24h
        </Button>
        <Button
          variant={value === '7d' ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => onChange('7d')}
        >
          7d
        </Button>
      </Button.Group>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Fetching full 7d history on mount:** Start with 24h default, lazy load 7d on user request to avoid initial 1440+ point render
- **No decimation on 7d view:** Mobile devices crash with >1000 points, ALWAYS decimate to max 500 points
- **Storing history in Firebase:** Bandwidth data is transient, local state sufficient, Firebase adds latency + cost
- **Synchronous decimation in render:** Use useMemo to cache decimated data, prevent re-computation on every render
- **Disabling animations globally:** Use `isAnimationActive={false}` only on chart components to prevent initial render jank on large datasets

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data decimation algorithm | Custom sampling (take every Nth point) | LTTB (Largest Triangle Three Buckets) | Naive sampling misses peaks/valleys, LTTB preserves visual fidelity, proven algorithm for time-series |
| Chart library | Canvas + D3.js custom implementation | Recharts (already installed) | Recharts handles responsive, tooltips, legends, accessibility out-of-box. Custom D3 = 10x more code |
| Date formatting | Custom timestamp → string logic | date-fns `format()` | Handles timezones, locales, edge cases. Already in package.json |
| Time range filtering | Manual array filtering in components | useMemo-cached derived state | Prevents re-filtering on every render, critical for 10k+ point arrays |

**Key insight:** Chart performance on mobile is deceptively complex. LTTB decimation preserves visual accuracy while cutting render time from 3-5s to <500ms. Custom sampling (e.g., take every 10th point) creates "sawtooth" artifacts where peaks are lost.

## Common Pitfalls

### Pitfall 1: Rendering 7-Day Data Without Decimation

**What goes wrong:** Fritz!Box bandwidth API can return up to 7 days of 1-minute granularity data (10,080 points). Rendering all points in Recharts LineChart causes:
- Mobile browsers freezing or crashing (>2s render time)
- High memory usage (>200MB for single chart)
- Poor scroll performance and interaction lag

**Why it happens:** Developers test with 24-hour datasets (1,440 points) during development, which renders acceptably (<500ms). They don't test 7-day view until later. Recharts doesn't automatically decimate data like Chart.js decimation plugin.

**How to avoid:**
- ALWAYS decimate data >500 points using LTTB algorithm before passing to Recharts
- Use useMemo to cache decimated data, prevent re-computation on every render
- Test with FULL 7-day dataset on real mobile device (not just Chrome DevTools responsive mode)
- Add loading skeleton while decimation runs (can take 100-200ms on low-end phones)
- Default to 24h view, require explicit user action to switch to 7d

**Warning signs:**
- Chart render time >1s on desktop
- React DevTools profiler showing >500ms BandwidthChart render
- Mobile devices showing "page unresponsive" dialog
- Lighthouse performance score drops below 70 on /network page

### Pitfall 2: Polling Too Aggressively Without Rate Limit Awareness

**What goes wrong:** Bandwidth data updates via useAdaptivePolling (30s visible, 5min hidden). Fritz!Box rate limit is 10 req/min. If `/network` page polls bandwidth endpoint every 30s (2 req/min) AND dashboard NetworkCard also polls (2 req/min), total is 4 req/min. Add devices endpoint (2 req/min) and you're at 6 req/min, leaving only 4 req/min for other operations. User loading page 2x in a minute exhausts budget.

**Why it happens:** Each component independently polls without awareness of global rate limit budget. Developers don't realize multiple routes share same Fritz!Box client and rate limiter.

**How to avoid:**
- Reuse useNetworkData hook from Phase 62 (single polling loop, shared across NetworkCard + /network page)
- Do NOT create separate polling in useBandwidthHistory, instead subscribe to useNetworkData's bandwidth updates
- Verify rate limiter logs during development: "Rate limit remaining: X" should never drop below 3-4
- Increase polling intervals for non-critical data: bandwidth can use 60s visible (not 30s)

**Warning signs:**
- 429 Too Many Requests errors in console
- Rate limit debug logs showing consumption approaching 10/min
- API responses returning cached data (is_stale: true) more than 50% of time

### Pitfall 3: Not Handling Empty/Sparse Historical Data

**What goes wrong:** User opens /network page for first time. useBandwidthHistory has empty buffer. Chart renders with no data → empty white canvas or axes with no lines. User thinks feature is broken. After 5 minutes of polling, only 10 data points exist (30s interval = 10 points in 5min) → chart shows single choppy line, not smooth trend.

**Why it happens:** Developers test with pre-populated mock data in tests or manually trigger API calls to fill buffer before testing UI. Production starts with zero history.

**How to avoid:**
- Show empty state when history.length === 0: "Collecting bandwidth data... Check back in a few minutes"
- Show loading skeleton when history.length < 10 points (insufficient for chart)
- Initial burst polling: On first mount, poll every 10s for first 2 minutes to quickly populate buffer, then revert to 30s/5min adaptive
- Persist history in localStorage (optional): Reload page doesn't lose buffer, faster time-to-chart
- Display "Collecting data..." message with progress indicator: "12 / 60 data points (20%)"

**Warning signs:**
- Users reporting "bandwidth chart is blank"
- Chart appears after 5+ minutes on fresh page load
- Test failures on CI because chart expects data but buffer empty
- Empty state message never shown in development (always has mock data)

### Pitfall 4: Mixing Sparkline and Full Chart Data Sources

**What goes wrong:** NetworkCard already has sparkline buffering in useNetworkData (12 points max, 6 minutes). Developer creates separate useBandwidthHistory hook with different polling logic. Now two hooks both poll bandwidth endpoint, doubling rate limit consumption. Data inconsistency: sparkline shows different values than full chart.

**Why it happens:** Phase 62 implemented sparklines for NetworkCard preview. Phase 64 needs full chart, developer assumes new hook needed without checking existing infrastructure.

**How to avoid:**
- Reuse existing useNetworkData hook's bandwidth data and addDataPoint logic
- Extract bandwidth buffering from useNetworkData into shared useBandwidthHistory hook
- NetworkCard sparklines become "last 12 points" slice of full buffer
- Single source of truth for bandwidth data across NetworkCard + /network page
- Test both components render same bandwidth values at same timestamp

**Warning signs:**
- Rate limiter showing 2x expected consumption for bandwidth endpoint
- NetworkCard sparkline shows "5.2 Mbps" while full chart at same time shows "5.8 Mbps"
- Two separate useEffect polling loops visible in React DevTools Profiler
- Firebase cache hit rate drops (two hooks bypassing cache differently)

## Code Examples

Verified patterns from official sources and existing codebase:

### Recharts LineChart Responsive Container
```typescript
// Source: Recharts official docs + ConsumptionChart.tsx pattern
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    {/* Chart config */}
  </LineChart>
</ResponsiveContainer>
```

### date-fns Time Formatting
```typescript
// Source: date-fns official docs + UsageChart.tsx pattern
import { format } from 'date-fns';

// 1h view: "14:32"
format(timestamp, 'HH:mm')

// 24h view: "14:32"
format(timestamp, 'HH:mm')

// 7d view: "Feb 16"
format(timestamp, 'MMM dd')
```

### useMemo for Data Decimation
```typescript
// Source: React docs + performance best practices
const decimatedData = useMemo(() => {
  if (rawData.length <= 500) return rawData;
  return decimateLTTB(rawData, 500);
}, [rawData]);
```

### Custom Tooltip (Recharts)
```typescript
// Source: ConsumptionChart.tsx + UsageChart.tsx pattern
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-lg p-3 shadow-xl">
      <Text size="xs" className="mb-2">{label}</Text>
      <div className="space-y-1.5">
        {payload.map(entry => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <Text size="xs" variant="secondary">{entry.dataKey}:</Text>
            </div>
            <Text size="xs" style={{ color: entry.color }}>
              {entry.value.toFixed(1)} Mbps
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart.js with decimation plugin | Recharts with client-side LTTB | N/A (greenfield) | Recharts already in project, React-native, no new dependencies |
| Backend aggregation (hourly buckets) | Client-side decimation | N/A (greenfield) | Faster MVP, simpler architecture, can add backend later if needed |
| Separate polling for chart data | Reuse useNetworkData hook | Phase 62 → Phase 64 | Single polling loop, halves rate limit consumption |
| localStorage persistence | In-memory buffer only | N/A (greenfield) | Simpler MVP, can add persistence later if user requests |

**Deprecated/outdated:**
- N/A (Phase 64 is greenfield, no legacy to migrate)

## Open Questions

1. **Should we persist bandwidth history in localStorage?**
   - What we know: In-memory buffer (10,080 points max) lost on page refresh
   - What's unclear: User expectation for history persistence vs. rate limit budget for re-fetching
   - Recommendation: Start with in-memory only (simpler MVP). Add localStorage in later phase if users request "why did chart reset after refresh"

2. **Should 7-day view use backend aggregation (hourly buckets) instead of client decimation?**
   - What we know: 7d at 1-min = 10,080 points. Client LTTB decimation to 500 points takes ~100ms on mobile
   - What's unclear: Network transfer size (10k points JSON) vs. backend CPU cost for aggregation
   - Recommendation: Start with client-side decimation (no backend changes needed). Monitor network transfer size. If >500KB, add backend aggregation in Phase 67 or later

3. **Should TimeRangeSelector default vary by device (mobile=1h, desktop=24h)?**
   - What we know: Mobile has less screen space, 1h chart more readable than 24h on small viewport
   - What's unclear: User preference and whether consistent default better than adaptive
   - Recommendation: Default to 24h on all devices (consistency). User can change. Add device-specific default in later phase if analytics show mobile users always switch to 1h

## Sources

### Primary (HIGH confidence)
- Recharts official docs: https://recharts.org/en-US/api/LineChart (verified v2.15.0)
- date-fns official docs: https://date-fns.org/docs/format (verified v4.1.0)
- Project codebase: ConsumptionChart.tsx, UsageChart.tsx (Recharts patterns)
- Project codebase: useNetworkData.ts (sparkline buffering pattern)
- Project codebase: useAdaptivePolling.ts (visibility-aware polling)
- PITFALLS-fritzbox.md: Rate limiting, data decimation, performance traps

### Secondary (MEDIUM confidence)
- LTTB algorithm: https://github.com/sveinn-steinarsson/flot-downsample (original paper, C implementation)
- Recharts performance: https://recharts.org/en-US/guide/performance (official performance guide)
- Chart.js decimation comparison: https://www.chartjs.org/docs/latest/configuration/decimation.html (alternative approach reference)

### Tertiary (LOW confidence)
- N/A (all findings verified with official docs or existing codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use (Recharts, date-fns, React hooks)
- Architecture: HIGH - Patterns verified in existing ConsumptionChart, UsageChart, useNetworkData implementations
- Pitfalls: HIGH - Directly from PITFALLS-fritzbox.md (Phase 61 research) + existing codebase patterns

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days, stable libraries and patterns)
