# Phase 67: Bandwidth Correlation - Research

**Researched:** 2026-02-16
**Domain:** Data correlation visualization (Recharts dual y-axis, statistical analysis)
**Confidence:** HIGH

## Summary

Phase 67 implements bandwidth-heating correlation visualization, showing users the relationship between network bandwidth consumption and stove power levels over time. This builds on Phase 64's bandwidth visualization infrastructure (BandwidthChart, useBandwidthHistory, LTTB decimation) and Phase 54's analytics consent system (canTrackAnalytics gate).

The implementation requires: (1) a dual y-axis Recharts chart combining bandwidth (Mbps) and stove power level (1-5) as overlaid lines, (2) analytics consent gating using existing canTrackAnalytics() check, and (3) correlation insight text summarizing bandwidth-heating patterns using Pearson correlation coefficient.

The existing codebase provides strong foundations: Recharts 2.15.0 is already installed and used for dual-axis charts (WeatherCorrelation.tsx), stove power data is available via useStoveData hook, bandwidth history is managed by useBandwidthHistory, and the orchestrator pattern (hooks + presentational components) is well-established in network/page.tsx.

**Primary recommendation:** Use ComposedChart with dual YAxis (left=bandwidth Mbps, right=power level 1-5), add correlation coefficient calculation (Pearson r formula), gate entire feature behind canTrackAnalytics() check, and follow existing orchestrator pattern with new useBandwidthCorrelation hook.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15.0 | Chart rendering with dual y-axis support | Already used in project, proven dual-axis pattern in WeatherCorrelation.tsx |
| date-fns | (installed) | Time formatting and date manipulation | Project standard for all date operations |
| react | 18.x | Hook-based state management | Project standard, orchestrator pattern uses hooks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | Pearson correlation calculation | Hand-roll simple formula (no library needed for basic correlation) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled Pearson | calculate-correlation npm | Adds dependency for 10-line formula, overkill |
| ComposedChart | LineChart | Can't do dual y-axis with different scales |
| Client-side correlation | API route calculation | Unnecessary complexity, client has all data |

**Installation:**
No new packages needed. Recharts 2.15.0 already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/network/
├── hooks/
│   ├── useBandwidthHistory.ts          # Existing (Phase 64)
│   └── useBandwidthCorrelation.ts      # NEW - correlation data + insights
├── components/
│   ├── BandwidthChart.tsx              # Existing (Phase 64)
│   ├── BandwidthCorrelationChart.tsx   # NEW - dual y-axis chart
│   └── CorrelationInsight.tsx          # NEW - insight text display
└── page.tsx                            # Update orchestrator
```

### Pattern 1: Dual Y-Axis Chart with ComposedChart
**What:** Recharts pattern for overlaying datasets with different scales (bandwidth Mbps vs power level 1-5)
**When to use:** When two metrics have different units/ranges but share a time axis
**Example:**
```typescript
// Source: Existing WeatherCorrelation.tsx (lines 137-217)
<ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />

  <XAxis dataKey="displayDate" stroke="currentColor" className="opacity-60" />

  {/* Left Y-axis: Bandwidth (Mbps) */}
  <YAxis
    yAxisId="left"
    stroke="currentColor"
    label={{ value: 'Bandwidth (Mbps)', angle: -90, position: 'insideLeft' }}
  />

  {/* Right Y-axis: Power Level (1-5) */}
  <YAxis
    yAxisId="right"
    orientation="right"
    stroke="currentColor"
    label={{ value: 'Power Level', angle: 90, position: 'insideRight' }}
  />

  <Tooltip content={<CustomTooltip />} />
  <Legend iconType="line" />

  {/* Line 1: Bandwidth */}
  <Line
    yAxisId="left"
    type="monotone"
    dataKey="bandwidth"
    stroke="rgb(52, 211, 153)"
    strokeWidth={2}
    dot={false}
    name="Bandwidth"
  />

  {/* Line 2: Power Level */}
  <Line
    yAxisId="right"
    type="monotone"
    dataKey="powerLevel"
    stroke="rgb(237, 111, 16)"
    strokeWidth={2}
    dot={false}
    name="Power Level"
  />
</ComposedChart>
```

### Pattern 2: Pearson Correlation Coefficient Calculation
**What:** Statistical measure of linear correlation between two variables (-1 to +1)
**When to use:** To quantify relationship strength between bandwidth and power level
**Example:**
```typescript
// Formula: r = [nΣXY - (ΣX)(ΣY)] / √[nΣX² - (ΣX)²][nΣY² - (ΣY)²]
// Source: https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
function calculatePearsonCorrelation(
  xValues: number[],
  yValues: number[]
): number {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return 0;
  }

  const n = xValues.length;
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i]!, 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}
```

### Pattern 3: Orchestrator Pattern (Hooks + Presentational)
**What:** Page-level hook coordination feeding presentational components
**When to use:** Complex pages with multiple data sources (Phase 58-60 pattern)
**Example:**
```typescript
// Source: Existing network/page.tsx (lines 29-132)
export default function NetworkPage() {
  const networkData = useNetworkData();
  const bandwidthHistory = useBandwidthHistory();
  const correlation = useBandwidthCorrelation(); // NEW hook

  // Feed bandwidth data into history buffer
  useEffect(() => {
    if (networkData.bandwidth) {
      bandwidthHistory.addDataPoint(networkData.bandwidth);
    }
  }, [networkData.bandwidth]);

  // Feed stove power level into correlation hook
  useEffect(() => {
    if (networkData.bandwidth && stoveData.powerLevel) {
      correlation.addDataPoint({
        time: networkData.bandwidth.timestamp,
        bandwidth: networkData.bandwidth.download,
        powerLevel: stoveData.powerLevel,
      });
    }
  }, [networkData.bandwidth, stoveData.powerLevel]);

  return (
    <PageLayout>
      {/* Existing components */}
      <BandwidthChart {...bandwidthHistory} />

      {/* NEW: Only show if analytics consent granted */}
      {canTrackAnalytics() && (
        <>
          <BandwidthCorrelationChart {...correlation} />
          <CorrelationInsight {...correlation} />
        </>
      )}
    </PageLayout>
  );
}
```

### Pattern 4: Analytics Consent Gating
**What:** Feature visibility based on canTrackAnalytics() check
**When to use:** Any analytics-related features (GDPR compliance)
**Example:**
```typescript
// Source: Existing analytics/page.tsx (lines 132-169)
// Dashboard content (only when consent granted)
{hasConsent && (
  <div className="space-y-6">
    <StatsCards {...totals} loading={loading} />
    <UsageChart data={days} loading={loading} />
    <ConsumptionChart data={days} loading={loading} />
    <WeatherCorrelation data={days} loading={loading} />
  </div>
)}

// Consent denied state
{!hasConsent && getConsentState() === 'denied' && (
  <Card variant="glass" padding={true} className="text-center">
    <Heading level={3}>Analytics Disabled</Heading>
    <Text variant="secondary">
      You have declined analytics tracking. To enable, update consent in settings.
    </Text>
  </Card>
)}
```

### Anti-Patterns to Avoid
- **Dual y-axis without scale awareness**: Always ensure axes start at reasonable baselines (0 for bandwidth, 1 for power level) to avoid misleading visual correlations
- **Correlation without context**: Don't show raw correlation coefficient (-0.76) without explanation text ("Strong negative correlation: bandwidth decreases as stove power increases")
- **Ignoring analytics consent**: Never show correlation features to users who denied consent (GDPR violation)
- **Breaking orchestrator pattern**: Don't create new polling loops — reuse existing networkData and stoveData hooks
- **Hand-rolling complex decimation**: Reuse existing LTTB decimation from useBandwidthHistory for 7-day views

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dual y-axis charts | Custom SVG rendering | Recharts ComposedChart + dual YAxis | Handles scale alignment, tooltips, responsive layout, accessibility |
| Time-series decimation | Custom downsampling | Existing decimateLTTB utility | LTTB preserves peaks/valleys, proven in Phase 64 |
| Date formatting | Manual string building | date-fns format() | Project standard, handles locale/timezone |
| Analytics consent check | localStorage directly | canTrackAnalytics() service | Centralized GDPR logic, SSR-safe |
| Stove data polling | New fetch loop | Existing useStoveData hook | Single polling loop guarantee (Phase 58) |

**Key insight:** Recharts abstracts away the complexity of dual-axis alignment (different scales, tick marks, grid alignment, tooltip coordination). Hand-rolling this is 200+ lines of error-prone SVG math.

## Common Pitfalls

### Pitfall 1: Misleading Correlation Visual (Dual-Axis Scale Trap)
**What goes wrong:** Dual y-axis charts can visually exaggerate correlations if scales are manipulated (e.g., bandwidth 0-100 Mbps vs power 1-5 both filling same vertical space)
**Why it happens:** Default Recharts auto-scales both axes to fill chart height independently
**How to avoid:**
- Use domain prop to enforce explicit ranges: `domain={[0, 100]}` for bandwidth, `domain={[1, 5]}` for power
- Show raw correlation coefficient alongside chart (quantifies relationship objectively)
- Use contrasting colors (emerald bandwidth vs ember power) to visually separate datasets
**Warning signs:** Chart shows "perfect" visual overlap despite low correlation coefficient (<0.3)

### Pitfall 2: Data Temporal Misalignment
**What goes wrong:** Bandwidth data sampled every 30s (from useNetworkData polling) but stove power level may change asynchronously (user actions, scheduler), causing mismatched timestamps in correlation dataset
**Why it happens:** Two independent data sources (Fritz!Box API, Thermorossi API) with different polling intervals
**How to avoid:**
- Round timestamps to nearest minute for alignment: `Math.floor(timestamp / 60000) * 60000`
- Use bandwidth data as "anchor" (30s polling is more frequent than power changes)
- Filter correlation data to only include points where both values exist
**Warning signs:** Correlation chart shows gaps or stair-step patterns instead of smooth overlays

### Pitfall 3: Empty Correlation State (Insufficient Data)
**What goes wrong:** User sees "No correlation data" message when bandwidth chart has data but correlation chart is empty
**Why it happens:** Correlation requires BOTH bandwidth AND stove power data at same timestamps. If stove is off (powerLevel=null), no correlation points exist.
**How to avoid:**
- Show different empty states: "Stove is off - correlation unavailable" vs "Collecting data..."
- Require minimum 10 paired data points before showing correlation chart
- Display partial chart with warning overlay if <30 points (insufficient for meaningful correlation)
**Warning signs:** Correlation coefficient calculation returns NaN or 0 despite visible data

### Pitfall 4: Analytics Consent Gate Bypass
**What goes wrong:** Correlation features render before consent check completes, briefly showing analytics data to non-consented users
**Why it happens:** canTrackAnalytics() checks localStorage which is async/SSR-unsafe, React renders before check completes
**How to avoid:**
- Use useState + useEffect pattern from analytics/page.tsx (lines 46-51)
- Initial state = false, only set true after client-side check completes
- Show loading skeleton during consent check, not actual chart
**Warning signs:** Consent banner appears AFTER correlation chart renders

### Pitfall 5: Correlation Coefficient Misinterpretation
**What goes wrong:** User sees r=-0.85 and doesn't understand what it means
**Why it happens:** Raw statistical values lack context for non-technical users
**How to avoid:**
- Convert coefficient to human-readable insight text:
  - r > 0.7: "Strong positive correlation: bandwidth increases with heating power"
  - r > 0.3: "Moderate positive correlation: some bandwidth-heating relationship"
  - r > -0.3: "No clear correlation between bandwidth and heating"
  - r > -0.7: "Moderate negative correlation: bandwidth decreases during heating"
  - r ≤ -0.7: "Strong negative correlation: high heating power reduces bandwidth"
- Show example scenarios: "Example: Streaming paused when stove is at max power"
**Warning signs:** User confusion in feedback ("What does -0.76 mean?")

## Code Examples

Verified patterns from existing codebase:

### Dual Y-Axis ComposedChart (WeatherCorrelation.tsx)
```typescript
// Source: app/components/analytics/WeatherCorrelation.tsx (lines 137-217)
<ResponsiveContainer width="100%" height={350}>
  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />

    <XAxis
      dataKey="displayDate"
      stroke="currentColor"
      className="opacity-60"
      style={{ fontSize: '12px' }}
    />

    {/* Left Y-axis: Primary metric */}
    <YAxis
      yAxisId="left"
      stroke="currentColor"
      className="opacity-60"
      style={{ fontSize: '12px' }}
      label={{
        value: 'Pellet (kg)',
        angle: -90,
        position: 'insideLeft',
        style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
      }}
    />

    {/* Right Y-axis: Secondary metric */}
    <YAxis
      yAxisId="right"
      orientation="right"
      stroke="currentColor"
      className="opacity-60"
      style={{ fontSize: '12px' }}
      label={{
        value: 'Temp (°C)',
        angle: 90,
        position: 'insideRight',
        style: { fontSize: '12px', fill: 'currentColor', opacity: 0.6 },
      }}
    />

    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
    <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />

    {/* Bar chart on left axis */}
    <Bar
      yAxisId="left"
      dataKey="consumptionKg"
      fill="#ed6f10"
      name="Pellet (kg)"
      radius={[4, 4, 0, 0]}
    />

    {/* Line chart on right axis */}
    <Line
      yAxisId="right"
      type="monotone"
      dataKey="avgTemperature"
      stroke="#437dae"
      strokeWidth={2}
      dot={{ fill: '#437dae', r: 4 }}
      activeDot={{ r: 6 }}
      name="Temperature (°C)"
    />
  </ComposedChart>
</ResponsiveContainer>
```

### Analytics Consent Check Pattern
```typescript
// Source: app/analytics/page.tsx (lines 46-75)
const [hasConsent, setHasConsent] = useState(false);

// Check consent on mount (client-side only)
useEffect(() => {
  setHasConsent(canTrackAnalytics());
}, []);

// Conditional rendering based on consent
{hasConsent && (
  <div className="space-y-6">
    {/* Analytics features here */}
  </div>
)}

{!hasConsent && getConsentState() === 'denied' && (
  <Card variant="glass" padding={true} className="text-center">
    <Heading level={3}>Analytics Disabled</Heading>
    <Text variant="secondary">
      You have declined analytics tracking.
    </Text>
  </Card>
)}
```

### Orchestrator Pattern with Multiple Hooks
```typescript
// Source: app/network/page.tsx (lines 29-62)
export default function NetworkPage() {
  const router = useRouter();
  const networkData = useNetworkData(); // Polling + bandwidth
  const bandwidthHistory = useBandwidthHistory(); // History buffer
  const deviceHistory = useDeviceHistory(); // Timeline events

  // Wire bandwidth polling → history buffer
  useEffect(() => {
    if (networkData.bandwidth) {
      bandwidthHistory.addDataPoint(networkData.bandwidth);
    }
  }, [networkData.bandwidth]); // Only dependency: bandwidth object

  return (
    <PageLayout header={<PageLayout.Header>{/* ... */}</PageLayout.Header>}>
      <div className="space-y-6">
        <WanStatusCard wan={networkData.wan} isStale={networkData.stale} />
        <DeviceListTable devices={networkData.devices} />
        <BandwidthChart
          data={bandwidthHistory.chartData}
          timeRange={bandwidthHistory.timeRange}
          onTimeRangeChange={bandwidthHistory.setTimeRange}
          isEmpty={bandwidthHistory.isEmpty}
        />
        <DeviceHistoryTimeline events={deviceHistory.events} />
      </div>
    </PageLayout>
  );
}
```

### useBandwidthHistory Hook Pattern (Buffer + Filter + Decimate)
```typescript
// Source: app/network/hooks/useBandwidthHistory.ts (lines 36-117)
export function useBandwidthHistory(): UseBandwidthHistoryReturn {
  const [history, setHistory] = useState<BandwidthHistoryPoint[]>([]);
  const [timeRange, setTimeRange] = useState<BandwidthTimeRange>('24h');

  // Add data point to buffer (cap at MAX_POINTS)
  const addDataPoint = useCallback((bandwidth: BandwidthData) => {
    setHistory((prev) => {
      const newPoint: BandwidthHistoryPoint = {
        time: bandwidth.timestamp,
        download: bandwidth.download,
        upload: bandwidth.upload,
      };

      const updated = [...prev, newPoint];

      // Cap at MAX_POINTS (drop oldest if exceeded)
      if (updated.length > MAX_POINTS) {
        return updated.slice(-MAX_POINTS);
      }

      return updated;
    });
  }, []);

  // Filter by time range + decimate if >500 points
  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    const now = Date.now();
    const cutoff = now - TIME_RANGE_MS[timeRange];
    const filtered = history.filter((point) => point.time >= cutoff);

    // If filtered data <= threshold, return as-is
    if (filtered.length <= DECIMATION_THRESHOLD) {
      return filtered;
    }

    // Decimate using LTTB
    const downloadSeries: TimeSeriesPoint[] = filtered.map((p) => ({
      time: p.time,
      value: p.download,
    }));
    const decimated = decimateLTTB(downloadSeries, DECIMATION_THRESHOLD);

    // Map back to BandwidthHistoryPoint
    return decimated.map((point) => {
      const original = filtered.find((p) => p.time === point.time);
      return {
        time: point.time,
        download: point.value,
        upload: original?.upload ?? 0,
      };
    });
  }, [history, timeRange]);

  return {
    chartData,
    timeRange,
    setTimeRange,
    addDataPoint,
    pointCount: history.length,
    isEmpty: history.length === 0,
    isCollecting: history.length > 0 && history.length < COLLECTING_THRESHOLD,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate charts for bandwidth and power | Dual y-axis overlay chart | Phase 67 (this phase) | Shows correlation visually, saves vertical space |
| Manual correlation interpretation | Pearson coefficient + insight text | Phase 67 (this phase) | Non-technical users understand relationship |
| Analytics always visible | GDPR consent gating | Phase 54 (v6.0) | EU compliance, user privacy control |
| Multiple polling loops | Orchestrator pattern reuse | Phase 58-60 (v7.0) | Single polling loop guarantee |
| Hand-rolled decimation | LTTB algorithm | Phase 64 (v6.0) | Preserves peaks/valleys, proven performance |

**Deprecated/outdated:**
- LineChart for dual metrics: Use ComposedChart (supports mixed Bar/Line + dual y-axis)
- Inline correlation calculation in components: Extract to dedicated hook (testability, reusability)
- canTrackAnalytics() inline checks: Wrap in hook to avoid repeated localStorage access

## Open Questions

1. **Should correlation be time-range aware (1h/24h/7d like bandwidth chart)?**
   - What we know: Bandwidth chart supports 3 time ranges via TimeRangeSelector
   - What's unclear: Does correlation coefficient change significantly over time windows? (Short-term vs long-term patterns)
   - Recommendation: Implement time range selector initially (reuse TimeRangeSelector component), verify with Phase 67 verification if insights differ by range. If correlation is stable across ranges, simplify to single 24h view.

2. **Should correlation account for stove "off" states (powerLevel=null)?**
   - What we know: Stove can be off (powerLevel=null) for extended periods, creating data gaps
   - What's unclear: Does excluding off-state periods bias correlation results? (Only correlates "while heating")
   - Recommendation: Filter out null powerLevel points (correlation only meaningful when stove is active). Add separate insight: "Correlation calculated over N hours of active heating."

3. **What minimum data threshold ensures meaningful correlation?**
   - What we know: Pearson correlation requires paired data points, statistical significance improves with sample size
   - What's unclear: Is 10 points sufficient, or should we require 30/50/100?
   - Recommendation: Start with 30 paired points minimum (1 hour of stove activity at 30s polling). Show "Insufficient data" state below threshold with progress indicator: "Collecting data: 15/30 points."

## Sources

### Primary (HIGH confidence)
- Project codebase:
  - `/app/components/analytics/WeatherCorrelation.tsx` - Dual y-axis pattern with ComposedChart
  - `/app/network/hooks/useBandwidthHistory.ts` - Hook pattern for time-series buffering
  - `/app/network/components/BandwidthChart.tsx` - Recharts LineChart implementation
  - `/app/analytics/page.tsx` - Analytics consent gating pattern
  - `/lib/analyticsConsentService.ts` - canTrackAnalytics() implementation
  - `/app/components/devices/stove/hooks/useStoveData.ts` - Stove power level data source
  - `/lib/utils/decimateLTTB.ts` - LTTB decimation algorithm
- package.json - recharts ^2.15.0 confirmed installed

### Secondary (MEDIUM confidence)
- [Recharts Dual Y-Axis Documentation](https://github.com/recharts/recharts/issues/821) - Community patterns for multiple y-axes
- [Recharts Multiple Y-Axes Example](https://recharts.github.io/en-US/examples/MultipleYAxesScatterChart/) - Official dual-axis scatter chart
- [Pearson Correlation Wikipedia](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient) - Formula and interpretation
- [Dual-Axis Chart Best Practices (Flourish)](https://flourish.studio/blog/dual-axis-charts/) - Visual design guidance

### Tertiary (LOW confidence)
- [Network Energy Consumption Patterns](https://onlinelibrary.wiley.com/doi/10.1111/jiec.13512) - Research showing bandwidth-power relationships are non-linear (domain context, not implementation)
- [Pearson Correlation JavaScript Gist](https://gist.github.com/matt-west/6500993) - Simple implementation example (verified formula matches Wikipedia)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts 2.15.0 confirmed in package.json, dual-axis pattern proven in WeatherCorrelation.tsx
- Architecture: HIGH - Orchestrator pattern established in Phases 58-60, consent gating proven in Phase 54, LTTB decimation proven in Phase 64
- Pitfalls: HIGH - Dual-axis scale traps documented in Flourish research, temporal alignment issues evident from codebase polling patterns

**Research date:** 2026-02-16
**Valid until:** 2026-03-18 (30 days - Recharts is stable, patterns are project-specific)
