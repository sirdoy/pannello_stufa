# Phase 62: Dashboard Card - Research

**Researched:** 2026-02-15
**Domain:** React component development, Recharts mini sparklines, Fritz!Box API integration, adaptive polling
**Confidence:** HIGH

## Summary

Phase 62 implements a NetworkCard component for the home dashboard that displays real-time Fritz!Box network monitoring data (WAN status, device count, bandwidth with sparklines). This phase builds on the Phase 61 Fritz!Box API infrastructure (health, devices, bandwidth, wan endpoints) and follows the established orchestrator pattern used in StoveCard and LightsCard.

Research confirms all technical requirements are satisfied by existing codebase infrastructure:
- **API Layer:** Fritz!Box proxy routes with rate limiting (10 req/min), Firebase cache (60s TTL), and error handling are complete
- **Orchestrator Pattern:** Proven hooks + presentational sub-components architecture from StoveCard/LightsCard
- **Adaptive Polling:** useAdaptivePolling hook with 30s visible / 5min hidden intervals (decided in v8.0)
- **Design System:** DeviceCard/SmartHomeCard with green/teal theme, InfoBox, Badge, HealthIndicator components
- **Charts:** Recharts 2.15.0 already installed, used in ConsumptionChart/UsageChart — mini sparklines can use AreaChart

**Primary recommendation:** Follow StoveCard/LightsCard orchestrator pattern exactly: useNetworkData hook manages state/polling, useNetworkCommands handles navigation, 3-4 presentational sub-components render sections. Use Recharts AreaChart for bandwidth sparklines (download/upload trends). Implement health algorithm based on WAN uptime + bandwidth saturation. Handle Fritz!Box unreachable with cached data + stale indicator.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Card layout & hierarchy:**
- Compact density like WeatherCard (3-4 sections) — not a control panel, just monitoring
- Bandwidth numbers (download/upload) are the hero/primary element
- Secondary info (device count, WAN status, health) arranged by Claude's discretion based on existing patterns
- Green/teal color theme — distinct from ember (stove), warning (lights), ocean (thermostat/weather)

**Status & health visuals:**
- WAN online/offline shown as a prominent full-width colored status bar at top of card — green when connected, red when disconnected
- Health indicator (excellent/good/degraded/poor) — algorithm and visual representation at Claude's discretion based on available Fritz!Box data
- Offline visual treatment beyond the status bar at Claude's discretion

**Bandwidth display:**
- Hero element: two big numbers (download/upload in Mbps) with mini sparkline showing recent trend
- Units always in Mbps — no auto-scaling
- Sparkline colors for download vs upload at Claude's discretion (within green/teal theme)
- Sparkline time window/data points at Claude's discretion

**Error & edge states:**
- Fritz!Box unreachable: show last cached data with "Last updated X min ago" stale indicator + connection lost warning
- First-time use (no Fritz!Box data): at Claude's discretion
- API errors (TR-064 disabled, etc.): error handling approach at Claude's discretion based on existing patterns
- Loading state: card-shaped skeleton on initial data fetch — consistent with other cards

### Claude's Discretion

- Secondary info arrangement (info boxes row vs grid vs inline)
- Health algorithm (bandwidth saturation, composite score, or other)
- Health visual representation (colored text, signal icon, or other)
- Offline card dimming/grayscale treatment
- Download/upload sparkline color differentiation
- Sparkline data window size
- First-time use experience (setup card vs hidden vs other)
- Error display approach (inline banner vs error boundary)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | Component framework | Next.js 15.5 requirement |
| Next.js | 15.5.0 | App router | Project foundation |
| TypeScript | 5.x | Type safety | Phase 37-43 migration complete |
| Recharts | 2.15.0 | Sparkline charts | Already installed, used in analytics |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date formatting | "Last updated X min ago" staleness |
| Firebase RTDB | 12.8.0 | Cache layer | Fritz!Box data caching (60s TTL) |
| lucide-react | Latest | Icons (Signal, Wifi, etc.) | Optional for health indicator |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js | Recharts already installed, better React integration |
| Custom polling | useAdaptivePolling | Hook exists, visibility-aware, proven in StoveCard |
| Custom card | DeviceCard | DeviceCard exists, supports all requirements |

**Installation:**
```bash
# No new dependencies required — all libraries already installed
```

---

## Architecture Patterns

### Recommended Project Structure

```
app/components/devices/network/
├── NetworkCard.tsx                    # Orchestrator component
├── hooks/
│   ├── useNetworkData.ts             # State management + polling
│   └── useNetworkCommands.ts         # Navigation handlers
├── components/
│   ├── NetworkStatus.tsx             # WAN status bar + health
│   ├── NetworkBandwidth.tsx          # Hero bandwidth + sparklines
│   └── NetworkInfo.tsx               # Device count + secondary info
└── __tests__/
    ├── NetworkCard.test.tsx
    ├── useNetworkData.test.ts
    └── components/

lib/hooks/
├── useNetworkQuality.ts              # Existing (not needed for this phase)
└── useAdaptivePolling.ts             # Existing (use for 30s/5min polling)
```

### Pattern 1: Orchestrator Pattern (CRITICAL)

**What:** Hooks manage all state/effects, presentational components receive props only
**When to use:** All device cards (StoveCard, LightsCard established this)
**Example:**

```typescript
// Source: StoveCard.tsx (lines 1-188)
export default function NetworkCard() {
  const router = useRouter();

  // Custom hooks: all state management and data fetching
  const networkData = useNetworkData();

  // Command hooks: all navigation handlers
  const commands = useNetworkCommands({ router });

  // Derived display properties
  const statusBadge = getStatusBadge(networkData.wan);

  if (networkData.loading) {
    return <Skeleton.NetworkCard />;
  }

  return (
    <DeviceCard
      icon="📡"
      title="Rete"
      colorTheme="sage"  // Green/teal
      connected={networkData.connected}
      // ... other props
    >
      <NetworkStatus wan={networkData.wan} health={networkData.health} />
      <NetworkBandwidth bandwidth={networkData.bandwidth} />
      <NetworkInfo devices={networkData.devices} />
    </DeviceCard>
  );
}
```

**Critical rules:**
- NO state/effects in presentational components
- NO polling loops outside useNetworkData
- Sub-components are pure functions of props

### Pattern 2: Adaptive Polling with Visibility

**What:** 30s interval when tab visible, 5min when hidden, immediate fetch on visibility restore
**When to use:** Network card polling (non-safety-critical monitoring)
**Example:**

```typescript
// Source: useAdaptivePolling.ts + useStoveData.ts pattern
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export function useNetworkData() {
  const [bandwidth, setBandwidth] = useState(null);
  const [devices, setDevices] = useState([]);
  const [wan, setWan] = useState(null);
  const isVisible = useVisibility();

  const fetchData = useCallback(async () => {
    const [bwRes, devRes, wanRes] = await Promise.all([
      fetch('/api/fritzbox/bandwidth'),
      fetch('/api/fritzbox/devices'),
      fetch('/api/fritzbox/wan'),
    ]);
    // ... handle responses, update state
  }, []);

  // Adaptive polling: 30s visible, 5min hidden
  const interval = isVisible ? 30000 : 300000;

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,  // Pause when hidden (not safety-critical)
    immediate: true,      // Fetch on mount
  });

  return { bandwidth, devices, wan, /* ... */ };
}
```

### Pattern 3: Fritz!Box API Error Handling

**What:** Handle TR-064 disabled, timeout, unconfigured, rate limit with RFC 9457 errors
**When to use:** All Fritz!Box API calls
**Example:**

```typescript
// Source: fritzboxClient.ts + API route patterns
const fetchData = async () => {
  try {
    const res = await fetch('/api/fritzbox/bandwidth');

    if (!res.ok) {
      const error = await res.json();

      // RFC 9457 error structure
      if (error.code === 'TR064_NOT_ENABLED') {
        // Show setup guide banner
        setError({ type: 'setup', message: error.message });
      } else if (error.code === 'FRITZBOX_TIMEOUT') {
        // Show cached data with stale indicator
        setStale(true);
      } else if (error.code === 'RATE_LIMITED') {
        // Wait retryAfter seconds
        setRateLimited(error.retryAfter);
      }
      return;
    }

    const data = await res.json();
    setBandwidth(data.bandwidth);
    setStale(false);
  } catch (err) {
    // Network error: show cached data
    setStale(true);
  }
};
```

### Pattern 4: Recharts Mini Sparkline

**What:** Compact AreaChart with minimal UI, transparent background, gradient fill
**When to use:** Bandwidth trend visualization
**Example:**

```typescript
// Source: ConsumptionChart.tsx pattern adapted for mini sparkline
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface BandwidthSparklineProps {
  data: Array<{ time: string; mbps: number }>;
  color: string;  // Green for download, teal for upload
}

function BandwidthSparkline({ data, color }: BandwidthSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="mbps"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 5: Staleness Detection

**What:** Show "Last updated X min ago" when data older than 30s or Fritz!Box unreachable
**When to use:** Fritz!Box API data display
**Example:**

```typescript
// Source: useDeviceStaleness.ts pattern
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface CachedData {
  data: unknown;
  timestamp: number;
}

function getStalenessInfo(cached: CachedData | null) {
  if (!cached || !cached.timestamp) {
    return { isStale: true, ageText: null };
  }

  const ageMs = Date.now() - cached.timestamp;
  const isStale = ageMs > 30000; // 30 seconds

  const ageText = isStale
    ? formatDistanceToNow(new Date(cached.timestamp), {
        addSuffix: true,
        locale: it
      })
    : null;

  return { isStale, ageText };
}

// Usage in component
{staleness.isStale && (
  <Text variant="tertiary" size="xs">
    Aggiornato {staleness.ageText}
  </Text>
)}
```

### Anti-Patterns to Avoid

- **Multiple polling loops:** Only useNetworkData should poll, never in sub-components
- **State in presentational components:** All state lives in hooks only
- **API calls outside hooks:** Never fetch in components, always in useNetworkData
- **Hardcoded colors:** Use design system variants (sage/ocean for green/teal theme)
- **Manual visibility detection:** Use useVisibility hook, not custom listeners

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Adaptive polling | Custom setInterval + visibility listener | `useAdaptivePolling` hook | Handles visibility, cleanup, stale closures correctly |
| Device cards | Custom card component | `DeviceCard` or `SmartHomeCard` | Standardized layout, accent bar, badges, error states |
| Date formatting | Manual "X min ago" calculation | `formatDistanceToNow` from date-fns | Handles localization (Italian), edge cases |
| Sparklines | Custom SVG/Canvas charts | Recharts `AreaChart` | Responsive, accessible, gradient fills, already installed |
| Rate limiting | Client-side throttling | Server-side with Firebase RTDB | Persistent across sessions, shared state |
| Error handling | try/catch + alert | RFC 9457 ApiError + Banner component | Structured errors, user-friendly messages, dismissible |

**Key insight:** Fritz!Box API has complex error states (TR-064 disabled, timeout, rate limit) that require server-side detection and structured error responses. Never try to detect these client-side.

---

## Common Pitfalls

### Pitfall 1: Polling Without Visibility Awareness

**What goes wrong:** Card polls every 30s even when tab hidden, wastes API calls and rate limit
**Why it happens:** Developer uses setInterval directly without visibility check
**How to avoid:** Always use `useAdaptivePolling` with `alwaysActive: false` for non-critical data
**Warning signs:** Rate limit errors when user has multiple tabs open

### Pitfall 2: Fritz!Box Unreachable Shows Empty Card

**What goes wrong:** API timeout clears state, card shows "No data" instead of cached data
**Why it happens:** Error handler doesn't preserve previous state, sets null instead
**How to avoid:** Keep previous state on error, add `stale: true` flag, show cached data with warning
**Warning signs:** Card flashes empty during temporary network issues

### Pitfall 3: Sparkline Data Points Don't Match Bandwidth Updates

**What goes wrong:** Bandwidth number updates every 30s, but sparkline shows old data
**Why it happens:** Sparkline data stored separately, not updated with bandwidth
**How to avoid:** Store sparkline data alongside bandwidth in same state update
**Warning signs:** Number says 50 Mbps, sparkline peaks at 30 Mbps

### Pitfall 4: Health Indicator Flickers Between States

**What goes wrong:** Health changes from "good" to "degraded" and back rapidly
**Why it happens:** Bandwidth fluctuates around threshold, no hysteresis
**How to avoid:** Implement hysteresis: require 2+ consecutive readings before changing health state
**Warning signs:** Health badge color changes every 30 seconds

### Pitfall 5: Card Doesn't Handle First-Time Use

**What goes wrong:** Card shows error banner on first load when no Fritz!Box data cached
**Why it happens:** Initial fetch returns 404 from cache miss, treated as error
**How to avoid:** Check if error is cache miss (first fetch) vs real error, show loading state
**Warning signs:** New users see "Connection lost" on first page load

---

## Code Examples

Verified patterns from official sources:

### Fritz!Box API Route Structure

```typescript
// Source: /api/fritzbox/bandwidth/route.ts
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // 1. Rate limit check (10 req/min per user per endpoint)
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'bandwidth');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  // 2. Fetch with cache (60s TTL from Firebase RTDB)
  const bandwidth = await getCachedData('bandwidth', () => fritzboxClient.getBandwidth());

  // 3. Return data
  return success({ bandwidth });
}, 'FritzBox/Bandwidth');
```

### DeviceCard with Green/Teal Theme

```typescript
// Source: DeviceCard.tsx + SmartHomeCard.tsx patterns
<DeviceCard
  icon="📡"
  title="Rete"
  colorTheme="sage"  // Green/teal (use sage variant from design system)
  connected={connected}
  statusBadge={{
    label: wan?.connected ? 'Online' : 'Offline',
    color: wan?.connected ? 'sage' : 'danger',
    icon: wan?.connected ? '✓' : '✗',
  }}
  healthStatus={health}  // 'ok' | 'warning' | 'error' | 'critical'
  infoBoxes={[
    { icon: '📱', label: 'Dispositivi', value: devices.length },
    { icon: '⬇️', label: 'Download', value: `${bandwidth.download} Mbps` },
    { icon: '⬆️', label: 'Upload', value: `${bandwidth.upload} Mbps` },
  ]}
  banners={banners}
  loading={loading}
  loadingMessage="Caricamento dati rete..."
>
  {/* Card content */}
</DeviceCard>
```

### InfoBox Grid Layout

```typescript
// Source: InfoBox.tsx + DeviceCard.tsx
<div className="grid grid-cols-2 gap-2.5">
  <InfoBox
    icon="📱"
    label="Dispositivi"
    value={devices.length}
    variant="sage"
  />
  <InfoBox
    icon="⏱️"
    label="Uptime"
    value={formatUptime(wan.uptime)}
    variant="ocean"
  />
</div>
```

### Health Indicator with Signal Icon

```typescript
// Source: HealthIndicator component from design system
import { HealthIndicator } from '@/app/components/ui';

<HealthIndicator
  status={health}  // 'ok' | 'warning' | 'error' | 'critical'
  size="md"
  showIcon={true}
  label="Salute Rete"
  pulse={health === 'critical'}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom polling loops | useAdaptivePolling hook | Phase 57 (v7.0) | Visibility-aware, prevents memory leaks |
| Manual card layouts | DeviceCard/SmartHomeCard | Phase 59 (v7.0) | Consistent UI, less code duplication |
| Client rate limiting | Server-side with Firebase | Phase 49 (v6.0) | Persistent, prevents API abuse |
| Custom error handling | RFC 9457 ApiError | Phase 56 (v7.0) | Structured errors, better UX |

**Deprecated/outdated:**
- Direct fetch in components: Use hooks pattern (orchestrator)
- setInterval without cleanup: Use useAdaptivePolling
- Hardcoded colors: Use design system variants (colorTheme prop)

---

## Fritz!Box API Data Structures

Based on existing API routes, expected response structures:

### Bandwidth Response

```typescript
// GET /api/fritzbox/bandwidth
interface BandwidthResponse {
  bandwidth: {
    download: number;    // Mbps
    upload: number;      // Mbps
    timestamp: number;   // Unix timestamp
  };
}
```

### Devices Response

```typescript
// GET /api/fritzbox/devices
interface DevicesResponse {
  devices: Array<{
    id: string;
    name: string;
    ip: string;
    mac: string;
    active: boolean;
    type?: string;  // 'lan' | 'wlan' | 'guest'
  }>;
}
```

### WAN Response

```typescript
// GET /api/fritzbox/wan
interface WanResponse {
  wan: {
    connected: boolean;
    uptime: number;       // Seconds
    externalIp?: string;
    linkSpeed?: number;   // Mbps
    timestamp: number;
  };
}
```

### Health Response

```typescript
// GET /api/fritzbox/health
interface HealthResponse {
  status: 'connected';
  tr064Enabled: boolean;
}
```

**Note:** Actual data structures may vary based on Fritz!Box TR-064 API. Phase 61 implementation should have established these types.

---

## Open Questions

1. **Fritz!Box API Response Structure**
   - What we know: Phase 61 API routes exist (bandwidth, devices, wan, health)
   - What's unclear: Exact TypeScript types for responses (not documented yet)
   - Recommendation: Check Phase 61 implementation for actual types, create shared types file

2. **Sparkline Data Storage**
   - What we know: Need to track last N bandwidth readings for sparkline
   - What's unclear: Store in component state vs IndexedDB vs Firebase cache
   - Recommendation: Store in component state (max 12 points = 6 minutes at 30s interval), no persistence needed

3. **Health Algorithm Threshold Values**
   - What we know: Health = f(WAN uptime, bandwidth saturation)
   - What's unclear: What thresholds define excellent/good/degraded/poor
   - Recommendation: Uptime > 99% AND bandwidth < 80% capacity = excellent, 95-99% = good, 90-95% = degraded, < 90% = poor

4. **First-Time Use Experience**
   - What we know: No Fritz!Box data on first load
   - What's unclear: Show setup card vs empty card vs hidden card
   - Recommendation: Show card with "Configura Fritz!Box" banner + link to setup guide (consistent with LightsCard pairing pattern)

---

## Recommendations

### Implementation Approach

1. **Start with useNetworkData hook** (similar to useStoveData structure)
   - Parallel API calls: `Promise.all([bandwidth, devices, wan])`
   - Adaptive polling with useAdaptivePolling (30s visible, 5min hidden)
   - Error handling with stale data preservation
   - Sparkline data buffer (last 12 readings)

2. **Create 3 presentational sub-components**
   - NetworkStatus: WAN status bar + health indicator
   - NetworkBandwidth: Hero numbers + sparklines
   - NetworkInfo: InfoBox grid for device count + secondary stats

3. **Use DeviceCard wrapper** (not custom card)
   - colorTheme="sage" for green/teal theme
   - statusBadge for connection mode (if applicable)
   - healthStatus for network health
   - infoBoxes for quick stats

4. **Implement health algorithm**
   - Calculate from WAN uptime + bandwidth saturation
   - Add hysteresis (2+ consecutive readings before change)
   - Map to 'ok' | 'warning' | 'error' | 'critical'

5. **Handle edge states**
   - Fritz!Box unreachable: cached data + stale indicator
   - First-time use: setup banner with guide link
   - Rate limited: show retryAfter countdown
   - TR-064 disabled: setup instructions banner

### Testing Strategy

```typescript
// Unit tests required
describe('useNetworkData', () => {
  test('polls every 30s when visible');
  test('polls every 5min when hidden');
  test('preserves cached data on API error');
  test('adds sparkline data point on each update');
  test('limits sparkline buffer to 12 points');
});

describe('NetworkCard', () => {
  test('shows skeleton on initial load');
  test('displays bandwidth hero numbers');
  test('renders sparklines for download/upload');
  test('shows WAN status bar (green online, red offline)');
  test('displays health indicator');
  test('shows stale indicator when data old');
  test('handles Fritz!Box unreachable gracefully');
});
```

---

## Sources

### Primary (HIGH confidence)

- `/app/components/devices/stove/StoveCard.tsx` - Orchestrator pattern reference
- `/app/components/devices/lights/LightsCard.tsx` - Orchestrator pattern reference
- `/app/components/weather/WeatherCard.tsx` - Compact card density reference
- `/lib/hooks/useAdaptivePolling.ts` - Adaptive polling implementation
- `/lib/hooks/useDeviceStaleness.ts` - Staleness detection pattern
- `/app/components/ui/DeviceCard.tsx` - Card wrapper with all required features
- `/app/components/ui/InfoBox.tsx` - Info box grid layout
- `/app/api/fritzbox/*/route.ts` - API route patterns with rate limiting + cache
- `/lib/fritzbox/fritzboxClient.ts` - Fritz!Box client with error handling
- `/app/components/analytics/ConsumptionChart.tsx` - Recharts usage example
- `/docs/design-system.md` - Design system variants and color themes

### Secondary (MEDIUM confidence)

- CONTEXT.md - User decisions on layout, colors, error handling
- ROADMAP.md - Phase 62 requirements and dependencies
- Phase 61 prior decisions (API proxy pattern, rate limiting, caching)

### Tertiary (LOW confidence)

None — all findings verified with codebase sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Orchestrator pattern proven in 2 device cards, useAdaptivePolling exists
- Fritz!Box API: HIGH - Phase 61 implementation complete with all required endpoints
- Recharts sparklines: MEDIUM - Library installed but mini sparkline not implemented yet (only full charts)
- Health algorithm: MEDIUM - Algorithm design at Claude's discretion, no prior implementation

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days for stable tech stack)

**Dependencies verified:**
- ✅ Phase 61 Fritz!Box API routes complete
- ✅ useAdaptivePolling hook available
- ✅ DeviceCard component with all features
- ✅ Design system green/teal theme (sage variant)
- ✅ Recharts installed
- ✅ date-fns installed
