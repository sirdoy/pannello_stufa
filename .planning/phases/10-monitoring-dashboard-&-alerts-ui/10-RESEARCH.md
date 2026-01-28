# Phase 10: Monitoring Dashboard & Alerts UI - Research

**Researched:** 2026-01-28
**Domain:** Dashboard UI, timeline/feed patterns, real-time monitoring display, push notifications
**Confidence:** HIGH

## Summary

This phase creates a dedicated `/monitoring` page that visualizes stove health monitoring data collected by Phase 7's backend services. The dashboard displays connection status, dead man's switch health, and a chronological event timeline with filtering capabilities. All backend infrastructure already exists (health checks, Firestore logging, dead man's switch), so this phase focuses purely on UI presentation.

The project already has established patterns for timeline/feed UIs (NotificationInbox component with react-infinite-scroll-component), Firestore querying (healthLogger.js with parent/subcollection structure), and the complete Ember Noir design system. The standard approach is client-side React components fetching from Next.js API routes, with infinite scroll for paginated data.

**Primary recommendation:** Follow existing notification history patterns (InfiniteScroll + cursor pagination + filters) and reuse established design system components (Card, Banner, StatusBadge, Skeleton). Create new API routes that wrap existing healthLogger.js functions for dashboard queries.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5 | App Router pages, API routes | Project framework, already in use |
| React | 19.2 | Client components with hooks | Project framework, already in use |
| react-infinite-scroll-component | 6.1.1 | Timeline pagination | Already installed, proven in NotificationInbox |
| Firebase Admin | 13.6.0 | Server-side Firestore queries | Already configured for health logging |
| date-fns | 4.1.0 | Date formatting, calculations | Already installed for time operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons (status indicators) | Already installed, design system standard |
| Recharts | 2.15.0 | Optional charts/visualizations | Already installed, if trend graphs needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-infinite-scroll-component | Intersection Observer API (native) | More control but more code, existing solution works |
| Firestore queries | Firebase Realtime DB listeners | Real-time updates but Phase 7 uses Firestore, consistency matters |
| API routes | Direct client-side Firestore SDK | Server-side filtering safer, follows project patterns |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── monitoring/                    # New dedicated page
│   └── page.js                    # Main dashboard (client component)
├── api/
│   └── health-monitoring/
│       ├── check/route.js        # Existing - cron endpoint
│       ├── logs/route.js         # NEW - Get paginated event logs
│       ├── stats/route.js        # NEW - Get summary statistics
│       └── dead-man-switch/route.js  # NEW - Get DMS status
└── components/
    └── monitoring/                # NEW - Dashboard components
        ├── MonitoringTimeline.js  # Event feed with infinite scroll
        ├── ConnectionStatusCard.js # Current connection display
        ├── DeadManSwitchPanel.js  # DMS health panel
        ├── HealthEventItem.js     # Single event in timeline
        └── EventFilters.js        # Type/severity filters
```

### Pattern 1: Client-Side Dashboard with API Routes
**What:** Client component fetches data from API routes that wrap server-side Firestore queries
**When to use:** All dashboard data display (follows project standard)
**Example:**
```javascript
// app/monitoring/page.js
'use client';

import { useEffect, useState } from 'react';
import { Card, Heading } from '@/app/components/ui';
import ConnectionStatusCard from '@/components/monitoring/ConnectionStatusCard';
import DeadManSwitchPanel from '@/components/monitoring/DeadManSwitchPanel';
import MonitoringTimeline from '@/components/monitoring/MonitoringTimeline';

export default function MonitoringPage() {
  const [stats, setStats] = useState(null);
  const [dmsStatus, setDmsStatus] = useState(null);

  // Fetch summary data
  useEffect(() => {
    fetch('/api/health-monitoring/stats?days=7')
      .then(res => res.json())
      .then(setStats);
  }, []);

  // Fetch DMS status (with periodic refresh)
  useEffect(() => {
    const fetchDMS = async () => {
      const res = await fetch('/api/health-monitoring/dead-man-switch');
      setDmsStatus(await res.json());
    };

    fetchDMS();
    const interval = setInterval(fetchDMS, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Heading level={1} variant="ember">Health Monitoring</Heading>

      {/* Top status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectionStatusCard stats={stats} />
        <DeadManSwitchPanel status={dmsStatus} />
      </div>

      {/* Timeline feed */}
      <MonitoringTimeline />
    </div>
  );
}
```
**Source:** Project pattern from existing pages (app/thermostat/page.js, app/schedule/page.js)

### Pattern 2: Infinite Scroll Timeline (Established Pattern)
**What:** react-infinite-scroll-component with cursor-based pagination, following NotificationInbox pattern
**When to use:** Event history display with >50 items
**Example:**
```javascript
// components/monitoring/MonitoringTimeline.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Card, Skeleton, EmptyState } from '@/app/components/ui';
import HealthEventItem from './HealthEventItem';
import EventFilters from './EventFilters';

const MAX_EVENTS = 200; // Memory safeguard (NotificationInbox pattern)

export default function MonitoringTimeline() {
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(''); // All/connection/mismatch/cron
  const [severityFilter, setSeverityFilter] = useState(''); // All/error/warning/normal

  const fetchEvents = useCallback(async (resetList = false) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (!resetList && cursor) params.set('cursor', cursor);
      if (typeFilter) params.set('type', typeFilter);
      if (severityFilter) params.set('severity', severityFilter);

      const res = await fetch(`/api/health-monitoring/logs?${params}`);
      const data = await res.json();

      setEvents(prev => resetList ? data.events : [...prev, ...data.events]);
      setCursor(data.cursor);

      const totalAfter = resetList ? data.events.length : events.length + data.events.length;
      setHasMore(data.hasMore && totalAfter < MAX_EVENTS);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, typeFilter, severityFilter, events.length]);

  // Initial load + filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchEvents(true);
  }, [typeFilter, severityFilter]);

  // Loading skeleton
  if (isLoading && events.length === 0) {
    return (
      <Card liquid>
        <div className="divide-y divide-slate-700/50">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Empty state
  if (!isLoading && events.length === 0) {
    return (
      <Card liquid className="p-8">
        <EmptyState
          icon="🔍"
          title="No events found"
          description="Monitoring events will appear here"
        />
      </Card>
    );
  }

  return (
    <>
      <EventFilters
        type={typeFilter}
        severity={severityFilter}
        onTypeChange={setTypeFilter}
        onSeverityChange={setSeverityFilter}
      />

      <Card liquid className="overflow-hidden">
        <InfiniteScroll
          dataLength={events.length}
          next={() => fetchEvents(false)}
          hasMore={hasMore}
          loader={<div className="p-4 text-center">Loading...</div>}
          endMessage={<div className="p-4 text-center">All events loaded</div>}
        >
          <div className="divide-y divide-slate-700/50">
            {events.map(event => (
              <HealthEventItem key={event.id} event={event} />
            ))}
          </div>
        </InfiniteScroll>
      </Card>
    </>
  );
}
```
**Source:** Existing NotificationInbox.js (components/notifications/NotificationInbox.js:1-233)

### Pattern 3: Firestore Cursor Pagination (Server-Side)
**What:** API route wraps existing healthLogger functions with cursor-based pagination
**When to use:** All paginated Firestore queries for dashboard
**Example:**
```javascript
// app/api/health-monitoring/logs/route.js
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { withAuth } from '@/lib/core';
import { subDays } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor'); // Document ID
    const type = searchParams.get('type'); // connection/mismatch/cron
    const severity = searchParams.get('severity'); // error/warning/normal

    const db = getAdminFirestore();
    let query = db.collection('healthMonitoring');

    // Filter by last 7 days
    const startDate = subDays(new Date(), 7);
    query = query.where('timestamp', '>=', Timestamp.fromDate(startDate));

    // Apply type filter if specified
    if (type) {
      // Type filtering based on hasStateMismatch, connectionStatus fields
      // Implementation depends on how events are categorized
    }

    // Order by timestamp descending (newest first)
    query = query.orderBy('timestamp', 'desc');

    // Apply cursor pagination
    if (cursor) {
      const cursorDoc = await db.collection('healthMonitoring').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Apply limit
    query = query.limit(limit);

    const snapshot = await query.get();

    const events = [];
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString(),
      });
    });

    // Determine if more data exists (check if we got full limit)
    const hasMore = events.length === limit;

    // Next cursor is last document ID
    const nextCursor = events.length > 0 ? events[events.length - 1].id : null;

    return NextResponse.json({
      events,
      cursor: nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching health logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}, 'HealthMonitoring/GetLogs');
```
**Source:** [Firebase Firestore pagination docs](https://firebase.google.com/docs/firestore/query-data/query-cursors), existing healthLogger.js patterns

### Pattern 4: Accordion/Expandable Event Items
**What:** Compact event display by default, tap to expand inline (accordion style)
**When to use:** Timeline event items with detailed information
**Example:**
```javascript
// components/monitoring/HealthEventItem.js
'use client';

import { useState } from 'react';
import { Text, StatusBadge } from '@/app/components/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function HealthEventItem({ event }) {
  const [expanded, setExpanded] = useState(false);

  // Determine severity/status for badge
  const severity = event.hasStateMismatch ? 'warning' : 'success';
  const statusText = event.connectionStatus || 'checked';

  return (
    <div
      className="p-4 hover:bg-white/[0.05] cursor-pointer transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact view (always visible) */}
      <div className="flex items-start gap-3">
        {/* Icon/status indicator */}
        <StatusBadge status={statusText} variant={severity} />

        {/* One-line summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <Text variant="body" className="truncate">
              Health check {event.hasStateMismatch ? '⚠️ State mismatch detected' : '✓ Passed'}
            </Text>
            <Text variant="tertiary" size="sm" className="flex-shrink-0">
              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
            </Text>
          </div>
        </div>

        {/* Expand indicator */}
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded view (conditional) */}
      {expanded && (
        <div className="mt-4 ml-11 space-y-2 border-l-2 border-slate-700 pl-4">
          <Text variant="secondary" size="sm">
            <strong>Checked:</strong> {event.checkedCount} user(s)
          </Text>
          <Text variant="secondary" size="sm">
            <strong>Duration:</strong> {event.duration}ms
          </Text>
          {event.hasStateMismatch && (
            <Text variant="secondary" size="sm" className="text-warning-500">
              <strong>Mismatches:</strong> {/* Details here */}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
```
**Source:** Pattern inspired by Material UI Accordion, shadcn Timeline, adapted to project design system

### Pattern 5: Dead Man's Switch Status Panel
**What:** Dedicated panel showing cron health with trend indicators
**When to use:** Top-level monitoring dashboard status display
**Example:**
```javascript
// components/monitoring/DeadManSwitchPanel.js
'use client';

import { Card, Heading, Text, StatusBadge } from '@/app/components/ui';
import { formatDistanceToNow } from 'date-fns';

export default function DeadManSwitchPanel({ status }) {
  if (!status) {
    return (
      <Card liquid className="p-6">
        <Heading level={3} variant="subtle">Dead Man's Switch</Heading>
        <Text variant="secondary">Loading...</Text>
      </Card>
    );
  }

  const isHealthy = !status.stale;
  const statusColor = isHealthy ? 'success' : 'danger';

  return (
    <Card liquid className="p-6">
      <div className="flex items-start justify-between mb-4">
        <Heading level={3} variant="subtle">Cron Health</Heading>
        <StatusBadge
          status={isHealthy ? 'healthy' : 'stale'}
          variant={statusColor}
          pulse={!isHealthy}
        />
      </div>

      {isHealthy ? (
        <div className="space-y-2">
          <Text variant="body">✓ System running normally</Text>
          <Text variant="secondary" size="sm">
            Last check: {formatDistanceToNow(new Date(status.lastCheck), { addSuffix: true })}
          </Text>
        </div>
      ) : (
        <div className="space-y-2">
          <Text variant="body" className="text-danger-500">
            ⚠️ Cron not responding
          </Text>
          <Text variant="secondary" size="sm">
            Reason: {status.reason === 'never_run' ? 'Never executed' : 'Timeout'}
          </Text>
          {status.elapsed && (
            <Text variant="secondary" size="sm">
              Last seen: {Math.floor(status.elapsed / 60000)} minutes ago
            </Text>
          )}
        </div>
      )}
    </Card>
  );
}
```
**Source:** Existing CronHealthBanner component pattern, adapted for dashboard card

### Anti-Patterns to Avoid
- **Real-time listeners for historical data:** Phase 7 uses Firestore (not Realtime DB), and historical logs don't need live updates. Use HTTP fetch with pagination instead.
- **Client-side Firestore SDK:** Project uses API routes for all Firestore queries (security pattern). Don't bypass this.
- **Uncontrolled infinite scroll:** Always implement MAX_EVENTS limit (200 in NotificationInbox). Prevents memory exhaustion.
- **Polling for DMS status:** 30-second interval is sufficient (matches existing CronHealthBanner pattern). Don't poll faster.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Infinite scroll pagination | Custom Intersection Observer + pagination logic | react-infinite-scroll-component | Already installed, handles edge cases (scroll position, loading states, end detection) |
| Firestore cursor pagination | Manual snapshot offset tracking | startAfter() with document cursors | Firebase official pattern, handles edge cases (deleted docs, concurrent updates) |
| Date formatting | Custom relative time calculations | date-fns formatDistanceToNow() | Already installed, handles localization and edge cases |
| Status badges | Custom colored divs | Existing StatusBadge component | Design system consistency, accessibility built-in |
| Timeline icons | Custom icon components | lucide-react icons | Already installed, 1000+ icons, tree-shakeable |
| Accordion expansion | Custom show/hide state per item | Simple useState() per item | React built-in, no library needed for simple case |

**Key insight:** This project already has comprehensive patterns for timeline UIs (notification history), Firestore queries (health logging), and design system components. Don't reinvent - reuse established patterns.

## Common Pitfalls

### Pitfall 1: Memory Exhaustion from Unbounded Scroll
**What goes wrong:** Loading thousands of events into memory crashes mobile browsers
**Why it happens:** InfiniteScroll loads more data on scroll but never unloads old data
**How to avoid:** Implement MAX_EVENTS hard limit (200 items like NotificationInbox)
**Warning signs:** Mobile Safari crashing, increasing memory usage over time
**Code prevention:**
```javascript
const MAX_EVENTS = 200;

setHasMore(data.hasMore && totalAfter < MAX_EVENTS);

// In endMessage
{totalAfter >= MAX_EVENTS
  ? `Displaying ${MAX_EVENTS} events (limit reached)`
  : 'All events loaded'
}
```

### Pitfall 2: Firestore Index Missing Errors
**What goes wrong:** Query fails with "The query requires an index" error
**Why it happens:** Firestore requires composite indexes for queries with multiple filters + orderBy
**How to avoid:** Create indexes in advance via Firebase console or firestore.indexes.json
**Warning signs:** API returns 500, console shows "FAILED_PRECONDITION" error
**Prevention:**
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "healthMonitoring",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" },
        { "fieldPath": "hasStateMismatch", "order": "ASCENDING" }
      ]
    }
  ]
}
```
**Note:** Firebase console provides auto-generated index creation link in error message.

### Pitfall 3: Stale Dead Man's Switch Display
**What goes wrong:** DMS status shows "healthy" when cron is actually stale
**Why it happens:** Component doesn't refresh status, or refresh interval too long
**How to avoid:** Implement 30-second refresh interval for DMS status (matches existing pattern)
**Warning signs:** Status stays green despite cron being down, user reports delayed alerts
**Code prevention:**
```javascript
useEffect(() => {
  const fetchDMS = async () => {
    const res = await fetch('/api/health-monitoring/dead-man-switch');
    setDmsStatus(await res.json());
  };

  fetchDMS(); // Initial fetch
  const interval = setInterval(fetchDMS, 30000); // Every 30s
  return () => clearInterval(interval); // Cleanup!
}, []);
```

### Pitfall 4: Filter Changes Don't Reset Pagination
**What goes wrong:** Applying filter shows mixed results from previous query + new query
**Why it happens:** Filter changes cursor but doesn't reset events state
**How to avoid:** Reset state completely on filter change (NotificationInbox pattern)
**Warning signs:** Unexpected events appear after filtering, duplicate items in list
**Code prevention:**
```javascript
const handleFilterChange = (value) => {
  setTypeFilter(value);
  setCursor(null);           // Reset cursor
  setEvents([]);             // Clear events list
  setHasMore(true);          // Reset hasMore flag
  setIsLoading(true);        // Show loading state
};
```

### Pitfall 5: Push Notifications Spamming Users
**What goes wrong:** Users receive too many notifications for minor health issues
**Why it happens:** Triggering notifications for every health check failure without rate limiting
**How to avoid:** Implement notification preferences + rate limiting (already exists in Phase 3)
**Warning signs:** User complaints about notification spam, high unregister rate
**Prevention:**
- Only trigger notifications for critical issues (state mismatch, offline >10 min)
- Use existing notification preferences system (enabledTypes map in Phase 3 schema)
- Respect Do Not Disturb windows
- Rate limit: Max 1 notification per issue per hour
- Reference: [Alert fatigue prevention](https://www.nextech.com/blog/alert-fatigue)

### Pitfall 6: 7-Day Filter Returning Too Much Data
**What goes wrong:** Query times out or returns hundreds of MB of data
**Why it happens:** 1 health check per minute = 10,080 documents in 7 days
**How to avoid:** Use pagination with reasonable limit (50 items per page), add indexes
**Warning signs:** API timeouts, slow page loads, high Firestore read costs
**Prevention:**
```javascript
// Always use limit + pagination
query = query.limit(50);

// Consider aggregating old data (>24h) into summary documents
// Show last 24h in detail, 2-7 days as daily summaries
```

## Code Examples

Verified patterns from existing codebase and official sources:

### API Route with Auth + Firestore Query
```javascript
// app/api/health-monitoring/stats/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/core';
import { getHealthStats } from '@/lib/healthLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health-monitoring/stats?days=7
 * Returns aggregated health statistics
 */
export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Use existing healthLogger function
    const stats = await getHealthStats(days);

    return NextResponse.json({
      stats,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Error fetching health stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}, 'HealthMonitoring/GetStats');
```
**Source:** Project pattern from app/api/notifications/history/route.js

### Connection Status Card with Uptime Calculation
```javascript
// components/monitoring/ConnectionStatusCard.js
'use client';

import { Card, Heading, Text, StatusBadge } from '@/app/components/ui';

export default function ConnectionStatusCard({ stats }) {
  if (!stats) {
    return (
      <Card liquid className="p-6">
        <Heading level={3} variant="subtle">Connection Status</Heading>
        <Text variant="secondary">Loading...</Text>
      </Card>
    );
  }

  const uptimePercent = parseFloat(stats.successRate || 0);
  const statusVariant = uptimePercent >= 95 ? 'success' : uptimePercent >= 80 ? 'warning' : 'danger';

  return (
    <Card liquid className="p-6">
      <div className="flex items-start justify-between mb-4">
        <Heading level={3} variant="subtle">Stove Connection</Heading>
        <StatusBadge
          status={uptimePercent >= 95 ? 'online' : 'degraded'}
          variant={statusVariant}
        />
      </div>

      <div className="space-y-3">
        <div>
          <Text variant="tertiary" size="sm">Uptime (7 days)</Text>
          <Text variant="body" size="xl" className="font-semibold">
            {uptimePercent}%
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Text variant="tertiary" size="sm">Successful checks</Text>
            <Text variant="body">{stats.successfulChecks}</Text>
          </div>
          <div>
            <Text variant="tertiary" size="sm">Failed checks</Text>
            <Text variant="body" className={stats.failedChecks > 0 ? 'text-danger-500' : ''}>
              {stats.failedChecks}
            </Text>
          </div>
        </div>

        {stats.mismatchCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <Text variant="secondary" size="sm" className="text-warning-500">
              ⚠️ {stats.mismatchCount} state mismatch events detected
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}
```
**Source:** Adapted from existing Card patterns in project, inspired by design system documentation

### Event Filters Component
```javascript
// components/monitoring/EventFilters.js
'use client';

import { Select, Button } from '@/app/components/ui';

const TYPE_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'connection', label: 'Connection Events' },
  { value: 'mismatch', label: 'State Mismatches' },
  { value: 'cron', label: 'Cron Executions' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'error', label: 'Errors Only' },
  { value: 'warning', label: 'Warnings Only' },
  { value: 'normal', label: 'Normal Only' },
];

export default function EventFilters({ type, severity, onTypeChange, onSeverityChange }) {
  const isFiltered = type || severity;

  const handleClear = () => {
    onTypeChange('');
    onSeverityChange('');
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select
        liquid
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        options={TYPE_OPTIONS}
        className="w-full sm:w-auto"
      />

      <Select
        liquid
        value={severity}
        onChange={(e) => onSeverityChange(e.target.value)}
        options={SEVERITY_OPTIONS}
        className="w-full sm:w-auto"
      />

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
```
**Source:** Pattern from existing NotificationFilters.js component

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Real-time listeners for all data | Cursor-based pagination for historical data | 2024-2025 | Better performance, lower costs for large datasets |
| Offset-based pagination (skip) | Cursor-based (startAfter) | 2023+ | Firestore best practice, handles deletions correctly |
| Custom scroll detection | Intersection Observer API | 2019+ | Native browser API, better performance |
| Material UI Accordion | Headless UI/Radix primitives | 2023+ | Better accessibility, smaller bundle size |
| CSS-only status indicators | Color + icon redundancy | WCAG 2.1 (2018) | Accessibility requirement, colorblind support |

**Deprecated/outdated:**
- **Firebase Realtime DB for new features:** Firestore is now standard (Phase 7 already uses Firestore for health logging)
- **Offset pagination for Firestore:** Use cursor-based (startAfter/startAt) instead
- **Uncontrolled infinite scroll:** Must implement memory limits (MAX_EVENTS)

## Open Questions

Things that couldn't be fully resolved:

1. **Manual health check button behavior**
   - What we know: User context mentioned "manual health check" quick action button
   - What's unclear: Should this trigger immediate cron execution, or just display current status?
   - Recommendation: Create button that calls existing `/api/health-monitoring/check` endpoint with CRON_SECRET header (admin-only action). Requires additional auth check or new endpoint without CRON_SECRET requirement.

2. **Push notification trigger thresholds**
   - What we know: Phase 7 has notification triggers for critical issues
   - What's unclear: Exact thresholds for triggering alerts (how many consecutive failures? how long offline?)
   - Recommendation: Follow Phase 7 patterns - trigger on state mismatch, offline >10 minutes. Use existing notification preferences system to let users configure.

3. **Historical data aggregation strategy**
   - What we know: 1 check/minute = 10,080 docs in 7 days
   - What's unclear: Should old data be aggregated into hourly/daily summaries?
   - Recommendation: Start with simple approach (paginate everything), monitor Firestore read costs. If costs high, implement aggregation in Phase 11+.

4. **State mismatch resolution workflow**
   - What we know: Dashboard shows state mismatches
   - What's unclear: Should users be able to "acknowledge" or "resolve" mismatches from dashboard?
   - Recommendation: Start with read-only display. If users need resolution workflow, add in future phase.

## Sources

### Primary (HIGH confidence)
- **Project codebase:**
  - lib/healthMonitoring.js - Health check logic (lines 1-311)
  - lib/healthLogger.js - Firestore logging patterns (lines 1-256)
  - lib/healthDeadManSwitch.js - DMS implementation (lines 1-136)
  - components/notifications/NotificationInbox.js - Timeline pattern (lines 1-233)
  - docs/design-system.md - Ember Noir design system
  - docs/ui-components.md - Component API reference
  - docs/systems/monitoring.md - Existing monitoring documentation
  - package.json - Confirmed versions

- **Official documentation:**
  - [Firebase Firestore cursor pagination](https://firebase.google.com/docs/firestore/query-data/query-cursors) - Official Google docs
  - [Next.js 15 App Router patterns](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Official Next.js docs

### Secondary (MEDIUM confidence)
- [Next.js 15 App Router guide (DEV Community)](https://dev.to/devjordan/nextjs-15-app-router-complete-guide-to-server-and-client-components-5h6k) - 2026 guide, verified against official docs
- [react-infinite-scroll-component usage (LogRocket)](https://blog.logrocket.com/react-infinite-scroll/) - March 2025 article, patterns match installed version
- [Material UI Timeline component](https://mui.com/material-ui/react-timeline/) - Reference for timeline patterns
- [shadcn Timeline template](https://www.shadcn.io/template/timdehof-shadcn-timeline) - Modern timeline patterns

### Tertiary (LOW confidence)
- [React infinite scroll patterns (GeeksforGeeks)](https://www.geeksforgeeks.org/reactjs/implementing-pagination-and-infinite-scrolling-with-react-hooks/) - General patterns, not library-specific
- [Critical health alerts (Nextech blog)](https://www.nextech.com/blog/alert-fatigue) - Alert fatigue prevention strategies, general guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed and versions confirmed
- Architecture: HIGH - Patterns verified in existing codebase (NotificationInbox, health logging)
- Pitfalls: HIGH - Based on existing project patterns (MAX_EVENTS limit, filter reset logic)
- Push notifications: MEDIUM - Phase 7 triggers exist but exact dashboard integration unclear
- Manual health check: LOW - User context mentioned but implementation approach not specified

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable stack, no breaking changes expected)
