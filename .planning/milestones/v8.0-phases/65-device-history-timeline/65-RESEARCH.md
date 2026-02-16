# Phase 65: Device History Timeline - Research

**Researched:** 2026-02-16
**Domain:** Device connection event tracking, timeline visualization, Firebase RTDB event logging
**Confidence:** HIGH

## Summary

Phase 65 adds device connection/disconnection history tracking to the Fritz!Box network monitoring integration. The goal is to provide users with a chronological timeline showing when devices connect and disconnect from the network, with filtering and time range controls. This phase builds on the existing infrastructure from phases 61-64 (Fritz!Box API proxy, device list, bandwidth history) and introduces a **new capability**: persistent event logging of device state changes.

The key architectural decision is **where and how to track device state changes**. Unlike bandwidth history (Phase 64) which buffers live polling data client-side, device events must persist across sessions and be accessible historically. The existing codebase provides strong patterns: Firebase RTDB for persistent storage (Phase 49 rate limiter, Phase 55 idempotency), date-fns for time formatting (already used in bandwidth chart), and the TimeRangeSelector component (Phase 64). The challenge is detecting state changes efficiently without excessive Firebase writes while respecting Fritz!Box's 10 req/min rate limit.

**Primary recommendation:** Create server-side event logging in `/api/fritzbox/devices` endpoint that compares current device states with previous states stored in Firebase RTDB, writes connection/disconnection events to a timestamped log structure, implements event pagination/filtering in a new `/api/fritzbox/history` endpoint, and renders timeline UI using a custom vertical timeline component (don't add new dependencies — build with existing design system components similar to WeeklyTimeline pattern).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase RTDB | 12.8.0 | Event log storage | Already installed, real-time updates, Phase 49/55 pattern proven |
| date-fns | 4.1.0 | Time formatting, relative dates | Already installed, used in BandwidthChart, Italian locale support |
| Next.js API Routes | 15.5.0 | Event logging endpoint | Built-in, server-side event detection, consistent with Phase 61 proxy pattern |
| Existing types | - | DeviceData, NetworkError | Extended in Phase 63, no new types needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TimeRangeSelector | Custom | Time range UI (1h/24h/7d) | Already built in Phase 64, reuse for timeline |
| Design system components | - | Card, Badge, Text, Button | Build timeline with existing components — no new dependencies |
| useStalenessIndicator | Custom | Staleness detection | Phase 57 pattern, reuse for history data freshness |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom timeline component | Material UI Timeline, Syncfusion React Timeline | External libs add 100KB+ bundle size, overkill for simple vertical list |
| Server-side event detection | Client-side comparison in useNetworkData | Lost events when user offline, inconsistent across sessions |
| Flat log array | Nested by date (YYYY-MM-DD) | Query performance degrades with >1000 events, flat array requires full scan |
| Firebase Firestore | RTDB with date-keyed nodes | Adds complexity, RTDB sufficient for ~10k events (years of data) |

**Installation:**
```bash
# No new dependencies required
# All infrastructure already present from phases 61-64
```

## Architecture Patterns

### Recommended Project Structure

```
app/api/fritzbox/
├── devices/
│   └── route.ts              # MODIFY: Add event detection logic
└── history/
    └── route.ts              # NEW: Event query endpoint with filters

lib/fritzbox/
└── deviceEventLogger.ts      # NEW: Event logging utilities

app/network/
├── components/
│   ├── DeviceHistoryTimeline.tsx   # NEW: Timeline UI component
│   └── DeviceEventItem.tsx         # NEW: Single event row
└── hooks/
    └── useDeviceHistory.ts          # NEW: History data fetching hook

Firebase RTDB structure:
fritzbox/
├── devices/                  # Existing: Current device list
│   └── devices: DeviceData[]
├── device_states/            # NEW: Last known state per device (for change detection)
│   └── {mac_address}: { active: boolean, lastSeen: number }
└── device_events/            # NEW: Event log (date-keyed for efficient queries)
    └── {YYYY-MM-DD}/
        └── {timestamp}_{mac}_{event_type}: DeviceEvent
```

### Pattern 1: Server-Side Event Detection on Device Polling

**What:** Modify `/api/fritzbox/devices` endpoint to detect state changes and log events to Firebase RTDB.

**When to use:** Every time device list is polled (30s visible, 5min hidden per Phase 64 adaptive polling).

**Example:**
```typescript
// app/api/fritzbox/devices/route.ts (MODIFY existing endpoint)
import { logDeviceEvent, getDeviceStates, updateDeviceStates } from '@/lib/fritzbox/deviceEventLogger';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // ... existing rate limit + fetch logic ...

  const devices = await getCachedData('devices', async () => {
    return await fritzboxClient.getDevices();
  });

  // NEW: Detect state changes and log events
  const previousStates = await getDeviceStates();
  const currentStates = new Map(devices.map(d => [d.mac, { active: d.active, lastSeen: Date.now() }]));

  for (const device of devices) {
    const prev = previousStates.get(device.mac);
    const curr = currentStates.get(device.mac);

    // Connection event: was offline, now online
    if (prev && !prev.active && curr?.active) {
      await logDeviceEvent({
        deviceMac: device.mac,
        deviceName: device.name,
        deviceIp: device.ip,
        eventType: 'connected',
        timestamp: Date.now(),
      });
    }

    // Disconnection event: was online, now offline
    if (prev && prev.active && curr && !curr.active) {
      await logDeviceEvent({
        deviceMac: device.mac,
        deviceName: device.name,
        deviceIp: device.ip,
        eventType: 'disconnected',
        timestamp: Date.now(),
      });
    }

    // New device: first time seeing this MAC
    if (!prev && curr?.active) {
      await logDeviceEvent({
        deviceMac: device.mac,
        deviceName: device.name,
        deviceIp: device.ip,
        eventType: 'connected',
        timestamp: Date.now(),
      });
    }
  }

  // Update last known states
  await updateDeviceStates(currentStates);

  // ... existing Firebase storage + return logic ...
});
```

### Pattern 2: Date-Keyed Event Storage for Efficient Queries

**What:** Store events in Firebase RTDB under date nodes (YYYY-MM-DD) to enable efficient time-range queries.

**When to use:** All event writes and queries.

**Example:**
```typescript
// lib/fritzbox/deviceEventLogger.ts
import { adminDbSet, adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { format } from 'date-fns';

export interface DeviceEvent {
  deviceMac: string;
  deviceName: string;
  deviceIp: string;
  eventType: 'connected' | 'disconnected';
  timestamp: number;
}

/**
 * Log a device connection/disconnection event
 * Events are stored under date nodes for efficient range queries
 */
export async function logDeviceEvent(event: DeviceEvent): Promise<void> {
  const dateKey = format(event.timestamp, 'yyyy-MM-dd');
  const eventKey = `${event.timestamp}_${event.deviceMac}_${event.eventType}`;
  const path = getEnvironmentPath(`fritzbox/device_events/${dateKey}/${eventKey}`);

  await adminDbSet(path, event);
}

/**
 * Get device events for a time range (default: last 24h)
 * Returns events sorted by timestamp descending (newest first)
 */
export async function getDeviceEvents(
  startTime: number,
  endTime: number
): Promise<DeviceEvent[]> {
  const startDate = format(startTime, 'yyyy-MM-dd');
  const endDate = format(endTime, 'yyyy-MM-dd');

  // Generate date range (e.g., ["2026-02-15", "2026-02-16"])
  const dateRange = generateDateRange(startDate, endDate);

  const events: DeviceEvent[] = [];
  for (const dateKey of dateRange) {
    const path = getEnvironmentPath(`fritzbox/device_events/${dateKey}`);
    const dayEvents = await adminDbGet(path) as Record<string, DeviceEvent> | null;

    if (dayEvents) {
      Object.values(dayEvents).forEach(event => {
        // Filter by exact timestamp range
        if (event.timestamp >= startTime && event.timestamp <= endTime) {
          events.push(event);
        }
      });
    }
  }

  // Sort newest first
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get last known device states (for change detection)
 */
export async function getDeviceStates(): Promise<Map<string, { active: boolean; lastSeen: number }>> {
  const path = getEnvironmentPath('fritzbox/device_states');
  const states = await adminDbGet(path) as Record<string, { active: boolean; lastSeen: number }> | null;

  if (!states) return new Map();
  return new Map(Object.entries(states));
}

/**
 * Update device states after polling
 */
export async function updateDeviceStates(
  states: Map<string, { active: boolean; lastSeen: number }>
): Promise<void> {
  const path = getEnvironmentPath('fritzbox/device_states');
  const statesObj = Object.fromEntries(states);
  await adminDbSet(path, statesObj);
}

function generateDateRange(startDate: string, endDate: string): string[] {
  // Implementation: generate array of YYYY-MM-DD strings between start and end
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  while (start <= end) {
    dates.push(format(start, 'yyyy-MM-dd'));
    start.setDate(start.getDate() + 1);
  }

  return dates;
}
```

### Pattern 3: Device History API Endpoint with Filtering

**What:** Create `/api/fritzbox/history` endpoint to query events with optional device filter.

**When to use:** Timeline UI needs to fetch events for display.

**Example:**
```typescript
// app/api/fritzbox/history/route.ts (NEW)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDeviceEvents } from '@/lib/fritzbox/deviceEventLogger';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('range') || '24h'; // 1h, 24h, 7d
  const deviceMac = searchParams.get('device'); // optional filter

  // Convert time range to timestamps
  const endTime = Date.now();
  const startTime = endTime - getTimeRangeMs(timeRange);

  // Fetch events from Firebase
  let events = await getDeviceEvents(startTime, endTime);

  // Filter by device if specified
  if (deviceMac) {
    events = events.filter(e => e.deviceMac === deviceMac);
  }

  return success({ events });
}, 'FritzBox/History');

function getTimeRangeMs(range: string): number {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}
```

### Pattern 4: Timeline UI Component (Custom Vertical Timeline)

**What:** Build timeline component using existing design system — no new dependencies.

**When to use:** Displaying device connection/disconnection events chronologically.

**Example:**
```typescript
// app/network/components/DeviceHistoryTimeline.tsx (NEW)
'use client';

import { useMemo } from 'react';
import { Card, Heading, Badge, Text } from '@/app/components/ui';
import { formatDistanceToNow, format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { DeviceEvent } from '@/lib/fritzbox/deviceEventLogger';
import DeviceEventItem from './DeviceEventItem';

interface DeviceHistoryTimelineProps {
  events: DeviceEvent[];
  isLoading: boolean;
  isEmpty: boolean;
}

export function DeviceHistoryTimeline({ events, isLoading, isEmpty }: DeviceHistoryTimelineProps) {
  // Group events by date for section headers
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, DeviceEvent[]>();

    events.forEach(event => {
      const dateKey = format(event.timestamp, 'yyyy-MM-dd');
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, event]);
    });

    return Array.from(groups.entries()).map(([dateKey, dayEvents]) => ({
      date: dateKey,
      displayDate: format(new Date(dateKey), 'EEEE, d MMMM yyyy', { locale: it }),
      events: dayEvents,
    }));
  }, [events]);

  if (isLoading) {
    return (
      <Card variant="elevated" className="p-6">
        <Text>Caricamento cronologia...</Text>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card variant="elevated" className="p-6 text-center">
        <Text variant="secondary">Nessun evento registrato nel periodo selezionato</Text>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-6">
      {groupedEvents.map(({ date, displayDate, events: dayEvents }) => (
        <div key={date} className="space-y-3">
          {/* Date header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm py-2 z-10">
            <Text variant="secondary" size="sm" className="uppercase tracking-wide">
              {displayDate}
            </Text>
          </div>

          {/* Events for this date */}
          <div className="space-y-2 pl-4 border-l-2 border-white/10">
            {dayEvents.map((event, idx) => (
              <DeviceEventItem key={`${event.timestamp}_${idx}`} event={event} />
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

export default DeviceHistoryTimeline;
```

```typescript
// app/network/components/DeviceEventItem.tsx (NEW)
'use client';

import { Badge, Text } from '@/app/components/ui';
import { formatDistanceToNow, format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { DeviceEvent } from '@/lib/fritzbox/deviceEventLogger';

interface DeviceEventItemProps {
  event: DeviceEvent;
}

export function DeviceEventItem({ event }: DeviceEventItemProps) {
  const isConnected = event.eventType === 'connected';

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Timeline dot */}
      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
        isConnected ? 'bg-sage-400' : 'bg-slate-500'
      }`} />

      {/* Event details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Text size="sm" className="font-medium">
            {event.deviceName}
          </Text>
          <Badge variant={isConnected ? 'sage' : 'neutral'} size="sm">
            {isConnected ? 'Connesso' : 'Disconnesso'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <Text variant="secondary" size="xs" className="font-mono">
            {event.deviceIp}
          </Text>
          <Text variant="secondary" size="xs">
            {format(event.timestamp, 'HH:mm:ss')}
          </Text>
          <Text variant="secondary" size="xs">
            {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: it })}
          </Text>
        </div>
      </div>
    </div>
  );
}

export default DeviceEventItem;
```

### Pattern 5: Device Filter Dropdown

**What:** Allow users to filter timeline to a specific device.

**When to use:** When user wants to see history for a single device.

**Example:**
```typescript
// Integration in page orchestrator (app/network/page.tsx)
const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

// Dropdown component (use existing Select from design system)
<Select
  value={selectedDevice || 'all'}
  onChange={(value) => setSelectedDevice(value === 'all' ? null : value)}
  options={[
    { value: 'all', label: 'Tutti i dispositivi' },
    ...devices.map(d => ({ value: d.mac, label: d.name }))
  ]}
/>
```

### Anti-Patterns to Avoid

- **Client-side event detection:** Don't compare device states in `useNetworkData` hook — events would be lost when user navigates away or app closed. Server-side detection ensures all events logged.
- **Writing to Firebase on every poll:** Don't log events unconditionally — only write when state changes detected. Otherwise, 30s polling + 10 devices = 20 writes/min (Firebase quota concerns).
- **Unbounded event log growth:** Don't keep events forever — implement TTL cleanup (e.g., delete events older than 30 days) to prevent unbounded storage.
- **Flat array storage:** Don't store all events in single array path `fritzbox/device_events`. Firebase query performance degrades with >1000 items. Date-keyed structure enables efficient range queries.
- **External timeline libraries:** Don't add Material UI Timeline or similar — 100KB+ bundle size for simple vertical list. Build with existing design system components.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range generation | Custom date iteration logic | date-fns `eachDayOfInterval` | Handles DST, leap years, edge cases correctly |
| Time formatting | String manipulation | date-fns `format`, `formatDistanceToNow` | Locale support, consistent formatting across app |
| Event deduplication | Custom timestamp comparison | Firebase transaction-based writes with unique keys | Atomic operations prevent duplicate events |
| State change detection | Deep object comparison | Simple boolean comparison (`prev.active !== curr.active`) | Device state is simple (active: boolean), no need for lodash.isEqual |

**Key insight:** Device event logging is a **write-once, read-many** pattern. Optimize for query performance (date-keyed structure) over write simplicity. Firebase RTDB handles ~10k events efficiently with proper indexing (date-based queries).

## Common Pitfalls

### Pitfall 1: Event Duplication on Rapid State Changes

**What goes wrong:** Device rapidly connects/disconnects (e.g., unstable WiFi, roaming between access points). Fritz!Box API may report active=true, then active=false 30s later, then active=true again. This creates duplicate connection events in quick succession, cluttering the timeline with noise. Users see "iPhone connected, iPhone disconnected, iPhone connected" within 2 minutes, making it hard to identify meaningful events.

**Why it happens:** Polling-based detection (30s intervals) combined with network instability creates rapid state oscillations. Fritz!Box API reflects current state at polling time, not sustained state. Similar to how motion sensors can false-trigger multiple times.

**How to avoid:**
- **Debounce threshold:** Don't log disconnection events immediately — wait 2-3 poll cycles (60-90s) to confirm device truly disconnected
- Implement `lastSeen` tracking: If device was offline but came back online within 2 minutes, DON'T log disconnection event
- Add `stable` flag to events: Mark events as "stable" after 5 minutes without state change
- UI filter: Show only "stable" events by default, with toggle to show all rapid changes (for debugging)
- Backend aggregation: If device connects/disconnects >5 times in 10 minutes, aggregate as single "unstable connection" event

**Warning signs:**
- Timeline showing >10 events per device per hour
- Same device with alternating connected/disconnected events within <5 minutes
- Users reporting "too many notifications" (if push notifications tied to events)
- Firebase writes approaching quota limits (>1000 writes/min)

### Pitfall 2: Missing Events During App Downtime

**What goes wrong:** User closes browser tab at 10:00. Device disconnects at 10:15. User returns at 11:00. Because event detection happens in `/api/fritzbox/devices` endpoint (only called when UI polls), the disconnection event is never logged. Timeline has gap: device shows "connected at 09:45" then "disconnected at 11:00" (when poll resumed), but actual disconnection at 10:15 was missed.

**Why it happens:** Event detection is **passive** (tied to UI polling), not **active** (background job). Unlike server-side cron jobs (Phase 50 GitHub Actions), this pattern only works when users actively using the app.

**How to avoid:**
- **Accept the limitation:** For home network monitoring (not enterprise), gaps during user absence are acceptable — document in UI: "Storia basata su rilevamenti durante l'utilizzo dell'app"
- **Best-effort backfill:** On first poll after gap >1 hour, log special "status unknown" event: "Dispositivo offline durante assenza app"
- **Fritz!Box native logs:** If Fritz!Box API exposes connection logs (check TR-064 spec), fetch and backfill on app restart
- **Server-side polling (future):** Implement cron job similar to Phase 50 token cleanup to poll devices every 5 minutes even when UI idle (requires evaluating cost/benefit)

**Warning signs:**
- Timeline showing long gaps (>2 hours) between events during known activity periods
- Users reporting "device connected at wrong time" (actually missed earlier disconnection)
- Event counts much lower than expected for high-activity devices

### Pitfall 3: Firebase RTDB Query Performance Degradation

**What goes wrong:** After 6 months of operation, device_events log has 100k+ events. Querying all events for 7-day view takes >5 seconds. Timeline shows loading spinner forever. Firebase RTDB bill increases due to high read operations. Users complain page is slow.

**Why it happens:** Flat structure or unbounded growth without TTL. Firebase RTDB performs full scans on unindexed queries. Date-keyed structure helps, but without cleanup, storage grows linearly forever.

**How to avoid:**
- **TTL policy:** Delete events older than 30 days (or 90 days for enterprise). Implement cleanup cron job similar to Phase 50
- **Pagination:** Don't fetch all 7 days at once — lazy load as user scrolls (fetch 24h first, load more on scroll)
- **Indexed queries:** Ensure Firebase RTDB indexing on `fritzbox/device_events/{date}` path
- **Limit event count per query:** Add `?limit=100` param to history endpoint, return newest 100 events only
- **Archive strategy:** Move events older than 30 days to Firebase Storage (JSON files), query only if user explicitly requests "view archive"

**Warning signs:**
- Timeline loading time >2 seconds
- Firebase RTDB bill increasing >$5/month
- Browser memory usage >500MB on network page
- Firebase console showing >100k nodes under device_events

### Pitfall 4: Ignoring Device Renames and IP Changes

**What goes wrong:** User's iPhone has MAC `aa:bb:cc:dd:ee:ff`, initially named "iPhone", IP `192.168.1.10`. Router DHCP lease expires, iPhone gets new IP `192.168.1.45`. User renames device in router to "iPhone 13 Pro". Old timeline events still show "iPhone" with old IP. New events show "iPhone 13 Pro" with new IP. Timeline looks like two separate devices.

**Why it happens:** Events store `deviceName` and `deviceIp` at event time as strings. When device metadata changes in Fritz!Box, old events don't update. Similar to how chat apps show user's name at time of message, not current name.

**How to avoid:**
- **Store MAC as primary key:** Always query device by MAC, not name or IP
- **Resolve metadata on display:** Don't store name/IP in event — store MAC only, look up current name/IP from devices list when rendering
- **OR: Accept historical accuracy:** Keep name/IP at event time, add "(nome precedente)" indicator when mismatch detected
- **Hybrid approach:** Store both historical name (at event time) and current name (from devices list), show both: "iPhone (ora: iPhone 13 Pro)"

**Warning signs:**
- Users reporting "duplicate devices in history"
- Same MAC showing multiple different names in timeline
- Timeline filter by device not working after IP change

### Pitfall 5: Timeline Overwhelming Users with Noise

**What goes wrong:** User has 50 devices. Timeline shows 200+ events per day (devices connecting/disconnecting constantly). Critical events (new unknown device) buried in noise. Users stop checking timeline because signal-to-noise ratio too low.

**Why it happens:** No event prioritization or filtering. All events treated equally. Similar to unfiltered email inbox — too much information is no information.

**How to avoid:**
- **Smart defaults:** Show only "important" events by default — first connection (new device), long disconnection (>24h offline), unusual time (3am connection)
- **Event categories:** Tag events as "routine" (iPhone connects every morning), "unusual" (new device), "critical" (router disconnected)
- **Notification-worthy filter:** Separate timeline from notifications — timeline shows everything, notifications only for unusual events
- **Device ignore list:** Let users mute specific devices (e.g., smart TV that reconnects constantly)
- **Aggregate recurring patterns:** If device connects every day at 08:00, show as single "daily pattern" instead of 30 individual events

**Warning signs:**
- Users never using timeline feature (low engagement metrics)
- Timeline showing >100 events per 24h period
- User feedback: "too cluttered", "can't find what I need"

## Code Examples

Verified patterns from existing codebase and Fritz!Box context:

### Server-Side Event Detection Pattern (Adapt Phase 61 Devices Endpoint)

```typescript
// app/api/fritzbox/devices/route.ts (MODIFY existing)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox/fritzboxClient';
import { getCachedData } from '@/lib/fritzbox/fritzboxCache';
import { checkRateLimitFritzBox } from '@/lib/fritzbox/rateLimiter';
import { logDeviceEvent, getDeviceStates, updateDeviceStates } from '@/lib/fritzbox/deviceEventLogger';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // Existing rate limit check
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'devices');
  if (!rateLimitResult.allowed) {
    throw new ApiError(ERROR_CODES.RATE_LIMITED, ...);
  }

  // Existing device fetch with cache
  const devices = await getCachedData('devices', async () => {
    return await fritzboxClient.getDevices();
  });

  // NEW: Event detection logic
  try {
    const previousStates = await getDeviceStates();
    const currentStates = new Map<string, { active: boolean; lastSeen: number }>();

    for (const device of devices) {
      const prev = previousStates.get(device.mac);
      const curr = { active: device.active, lastSeen: Date.now() };
      currentStates.set(device.mac, curr);

      // Skip logging if no state change
      if (prev && prev.active === curr.active) continue;

      // New device or state change detected
      if (!prev || prev.active !== curr.active) {
        await logDeviceEvent({
          deviceMac: device.mac,
          deviceName: device.name,
          deviceIp: device.ip,
          eventType: curr.active ? 'connected' : 'disconnected',
          timestamp: Date.now(),
        });
      }
    }

    // Update states for next poll
    await updateDeviceStates(currentStates);
  } catch (error) {
    // Don't fail entire endpoint if event logging fails
    console.error('Event logging failed:', error);
  }

  // Existing Firebase storage + return
  const devicesPath = getEnvironmentPath('fritzbox/devices');
  await adminDbSet(devicesPath, { devices, updated_at: Date.now() });

  return success({ devices });
}, 'FritzBox/Devices');
```

### Timeline UI with Date Grouping (Similar to ConsumptionChart Pattern)

```typescript
// app/network/components/DeviceHistoryTimeline.tsx
'use client';

import { useMemo } from 'react';
import { Card, Heading, Text } from '@/app/components/ui';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import DeviceEventItem from './DeviceEventItem';
import type { DeviceEvent } from '@/lib/fritzbox/deviceEventLogger';

interface Props {
  events: DeviceEvent[];
  isLoading: boolean;
}

export default function DeviceHistoryTimeline({ events, isLoading }: Props) {
  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, DeviceEvent[]>();
    events.forEach(event => {
      const dateKey = format(event.timestamp, 'yyyy-MM-dd');
      groups.set(dateKey, [...(groups.get(dateKey) || []), event]);
    });
    return Array.from(groups.entries()).map(([date, events]) => ({
      date,
      displayDate: format(new Date(date), 'EEEE, d MMMM yyyy', { locale: it }),
      events,
    }));
  }, [events]);

  if (isLoading) {
    return <Card variant="elevated" className="p-6"><Text>Caricamento...</Text></Card>;
  }

  if (events.length === 0) {
    return (
      <Card variant="elevated" className="p-6 text-center">
        <Text variant="secondary">Nessun evento nel periodo selezionato</Text>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6 space-y-6">
      <Heading level={2} size="lg">Cronologia Dispositivi</Heading>

      {grouped.map(({ date, displayDate, events: dayEvents }) => (
        <div key={date} className="space-y-3">
          {/* Date header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur py-2">
            <Text variant="secondary" size="sm" className="uppercase tracking-wide">
              {displayDate}
            </Text>
          </div>

          {/* Timeline entries */}
          <div className="pl-6 border-l-2 border-white/10 space-y-2">
            {dayEvents.map((event, idx) => (
              <DeviceEventItem key={`${event.timestamp}_${idx}`} event={event} />
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}
```

### useDeviceHistory Hook (Similar to useBandwidthHistory Pattern)

```typescript
// app/network/hooks/useDeviceHistory.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeviceEvent } from '@/lib/fritzbox/deviceEventLogger';

type TimeRange = '1h' | '24h' | '7d';

export function useDeviceHistory() {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ range: timeRange });
      if (deviceFilter) params.append('device', deviceFilter);

      const response = await fetch(`/api/fritzbox/history?${params}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch device history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, deviceFilter]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    timeRange,
    setTimeRange,
    deviceFilter,
    setDeviceFilter,
    isLoading,
    isEmpty: events.length === 0,
    refresh: fetchEvents,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External timeline libraries | Custom components with design system | 2026 trend | Reduced bundle size, consistent styling |
| Client-side event detection | Server-side state comparison | Phase 65 (this phase) | Persistent events across sessions |
| Flat event array storage | Date-keyed Firebase RTDB structure | Phase 65 (this phase) | Efficient time-range queries |
| Real-time event push | Poll-based detection | Phase 61-64 adaptive polling | Simpler architecture, no WebSocket needed |

**Deprecated/outdated:**
- Real-time WebSocket for device events: Not needed — 30s polling sufficient for network monitoring (unlike chat apps)
- External timeline libraries (Material UI, Syncfusion): Overkill for simple vertical event list
- Firestore for events: RTDB with date-keying is simpler and cheaper for this use case

## Open Questions

1. **Event retention policy**
   - What we know: Events stored in Firebase RTDB, no current cleanup mechanism
   - What's unclear: How long should events be retained? 30 days? 90 days? Forever?
   - Recommendation: Start with 30-day retention, add "view archive" feature in Phase 2 if users request longer history

2. **Notification integration**
   - What we know: Phase 52 has push notification infrastructure with action buttons
   - What's unclear: Should device connection/disconnection events trigger notifications? Only for specific devices?
   - Recommendation: Don't implement notifications in Phase 65 — add in Phase 2 with user-configurable per-device settings

3. **Fritz!Box native event logs**
   - What we know: TR-064 API may expose router event logs (need to verify)
   - What's unclear: Can we backfill events from router logs on first app launch?
   - Recommendation: Research Fritz!Box event log API in PLAN phase, implement backfill if available (low priority)

4. **Event deduplication threshold**
   - What we know: Rapid state changes create event noise
   - What's unclear: What's the optimal debounce threshold? 60s? 90s? 2 minutes?
   - Recommendation: Start with no debouncing (log all state changes), add smart debouncing in Phase 2 based on real usage data

## Sources

### Primary (HIGH confidence)

- Project codebase: `app/network/hooks/useBandwidthHistory.ts` (Phase 64 history pattern)
- Project codebase: `app/components/scheduler/WeeklyTimeline.tsx` (custom timeline UI pattern)
- Project codebase: `lib/fritzbox/fritzboxClient.ts` (Phase 61 API client)
- Project codebase: `app/api/fritzbox/devices/route.ts` (Phase 61 device polling endpoint)
- Project codebase: `lib/rateLimiterPersistent.ts` (Phase 49 Firebase RTDB persistence)
- Project codebase: `.planning/phases/64-bandwidth-visualization/64-02-PLAN.md` (TimeRangeSelector component)

### Secondary (MEDIUM confidence)

- [UniFi Controller Device History Guide](https://www.unihosted.com/blog/how-to-see-device-history-in-unifi-controller) - Timeline UX patterns for network device tracking
- [8 Gorgeous Timeline UI Design](https://www.wendyzhou.se/blog/10-gorgeous-timeline-ui-design-inspiration-tips/) - Timeline design best practices
- [Material UI Timeline](https://mui.com/material-ui/react-timeline/) - React timeline component patterns (rejected for bundle size)
- [React Google Charts Timeline](https://www.react-google-charts.com/examples/timeline) - Timeline visualization patterns (too heavyweight)

### Tertiary (LOW confidence)

- None — all patterns verified against existing project code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, Firebase RTDB proven in Phase 49/55
- Architecture: HIGH - follows Phase 64 history pattern, adapts WeeklyTimeline UI approach
- Pitfalls: MEDIUM - event deduplication and retention policies need real-world validation
- Fritz!Box API: MEDIUM - native event logs availability needs verification during PLAN phase

**Research date:** 2026-02-16
**Valid until:** 30 days (stable domain — Firebase patterns, date-fns, design system components)
