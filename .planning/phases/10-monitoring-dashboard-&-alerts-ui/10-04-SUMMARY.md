---
phase: 10-monitoring-dashboard-&-alerts-ui
plan: 04
subsystem: monitoring-ui
status: complete
tags: [monitoring, dashboard, navigation, health-check, ui]

dependencies:
  requires:
    - "10-02 (ConnectionStatusCard, DeadManSwitchPanel components)"
    - "10-03 (MonitoringTimeline, EventFilters, HealthEventItem components)"
  provides:
    - "/monitoring dashboard page"
    - "Global navigation integration"
    - "30-second DMS auto-refresh"
  affects:
    - "10-05 (Alert settings UI will link from this dashboard)"

tech-stack:
  added: []
  patterns:
    - "Client component with useEffect data fetching"
    - "Interval-based polling for live status updates"
    - "Global navigation sections pattern"
    - "Responsive grid layout (md:grid-cols-2)"

key-files:
  created:
    - app/monitoring/page.js
  modified:
    - lib/devices/deviceTypes.js
    - app/components/Navbar.js
    - components/monitoring/MonitoringTimeline.js

decisions:
  - id: monitoring-global-nav
    choice: "Add monitoring to GLOBAL_SECTIONS instead of device-specific nav"
    rationale: "Monitoring is cross-cutting concern (applies to all devices), not device-specific feature"
    alternatives: ["Add to stove device nav only", "Add to settings menu"]

  - id: dms-refresh-interval
    choice: "30-second auto-refresh for dead man's switch status"
    rationale: "Balance between responsiveness and API load. DMS checks health every 10 minutes, so 30s refresh is sufficient"
    alternatives: ["60 seconds (less load)", "15 seconds (more responsive)"]

  - id: timeline-scroll-container
    choice: "max-h-[600px] with overflow-y-auto for timeline"
    rationale: "Prevent page from becoming infinitely tall, keeps controls visible"
    alternatives: ["No height limit", "Separate page for timeline"]

metrics:
  duration: "11 minutes"
  commits: 4
  files_changed: 3
  lines_added: 110
  lines_removed: 5
  bugs_fixed: 2
  completed: 2026-01-28
---

# Phase 10 Plan 04: Monitoring Dashboard & Navigation Summary

**One-liner:** Complete /monitoring dashboard with status cards, event timeline, navigation integration, and 30-second DMS polling

## What Was Built

### Core Deliverables

1. **Monitoring Dashboard Page** (`app/monitoring/page.js`)
   - Client component with state management
   - Fetches stats from `/api/health-monitoring/stats?days=7` on mount
   - Fetches DMS status from `/api/health-monitoring/dead-man-switch` with 30s interval
   - Two-column responsive grid for status cards (single column on mobile)
   - Full-width event timeline section with scroll container
   - Back button navigation to home
   - Activity icon for monitoring context

2. **Navigation Integration**
   - Added `MONITORING` to `GLOBAL_SECTIONS` in `deviceTypes.js`
   - Icon: 📊 (chart emoji), maps to Activity lucide-react icon
   - Route: `/monitoring`
   - Appears in both desktop header and mobile hamburger menu
   - Global nav section positioned between devices and settings

3. **Component Integration**
   - `ConnectionStatusCard` - shows stove connection health (uptime %)
   - `DeadManSwitchPanel` - shows cron health with 30s auto-refresh
   - `MonitoringTimeline` - paginated event list with filters

### Architecture

```
/monitoring (new page)
├── State: stats (from API), dmsStatus (from API)
├── Data Fetching:
│   ├── useEffect #1: Fetch stats once on mount
│   └── useEffect #2: Fetch DMS status + 30s interval polling
├── Layout:
│   ├── Header: Back button + "Health Monitoring" title + Activity icon
│   ├── Grid (2-col on md+): ConnectionStatusCard | DeadManSwitchPanel
│   └── Timeline Section: Heading + MonitoringTimeline component
└── Cleanup: clearInterval on unmount

Navigation Flow:
GLOBAL_SECTIONS → getGlobalNavItems() → navStructure.global
├── Desktop: Link in top header (between devices & settings)
└── Mobile: MenuItem in hamburger menu (new global section)
```

### User Experience

**Desktop (≥1024px):**
- Top header shows "Monitoring" link with Activity icon
- Click → navigate to `/monitoring`
- Status cards side-by-side
- DMS status auto-refreshes every 30 seconds

**Mobile (<1024px):**
- Hamburger menu → Global Navigation section → "Monitoring"
- Click → navigate to `/monitoring`
- Status cards stacked vertically
- DMS status auto-refreshes every 30 seconds

**Empty State (current):**
- Shows "Nessun evento" with empty state message
- Expected behavior: data will populate after production cron runs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing Global Navigation in Mobile Menu**
- **Found during:** User testing - "nel menu non ho monitoring"
- **Issue:** `navStructure.global` was only rendered in desktop navigation (line 267), completely missing from mobile menu
- **Root cause:** Mobile menu only showed Device Sections → Settings → Logout, no global section
- **Fix:** Added Global Navigation Section to mobile menu between devices and settings with conditional rendering check
- **Files modified:** `app/components/Navbar.js`
- **Commit:** `06a9be3`

**2. [Rule 1 - Bug] API Response Field Mismatch**
- **Found during:** Runtime error - `TypeError: Cannot read properties of undefined (reading 'length')`
- **Issue:** Component tried to access `data.logs` but API returns `data.events`
- **Root cause:** Incorrect field name assumption in MonitoringTimeline component
- **Fix:** Changed all 4 occurrences: `data.logs` → `data.events` (lines 50, 52, 59, 60)
- **Files modified:** `components/monitoring/MonitoringTimeline.js`
- **Commit:** `a21851f`

## Technical Implementation Details

### 1. Monitoring Page Component

**State Management:**
```javascript
const [stats, setStats] = useState(null);        // Stats API response
const [dmsStatus, setDmsStatus] = useState(null); // DMS API response
```

**Data Fetching Pattern:**
```javascript
// Stats: Fetch once on mount
useEffect(() => {
  fetch('/api/health-monitoring/stats?days=7')
    .then(res => res.json())
    .then(setStats);
}, []);

// DMS: Fetch initially + 30s interval
useEffect(() => {
  const fetchDMS = async () => {
    const res = await fetch('/api/health-monitoring/dead-man-switch');
    const data = await res.json();
    setDmsStatus(data);
  };

  fetchDMS(); // Initial
  const interval = setInterval(fetchDMS, 30000); // Every 30s
  return () => clearInterval(interval); // Cleanup
}, []);
```

**Layout Structure:**
- Space-y-6 container with padding
- Flex header with back button + icon + title
- Grid with responsive columns (1 col mobile, 2 cols desktop)
- Timeline section with max-height scroll container

### 2. Navigation Integration

**Configuration (deviceTypes.js):**
```javascript
export const GLOBAL_SECTIONS = {
  MONITORING: {
    id: 'monitoring',
    name: 'Monitoring',
    icon: '📊', // Emoji for deviceRegistry
    route: '/monitoring',
  },
};
```

**Icon Mapping (Navbar.js):**
```javascript
// Added Activity icon import
import { Activity } from 'lucide-react';

// Added monitoring path handler
const getIconForPath = (path) => {
  // ... existing paths
  if (path.includes('monitoring')) return <Activity className="w-5 h-5" />;
  return null;
};
```

**Rendering:**
- **Desktop:** Direct Link render with `navStructure.global.map()`
- **Mobile:** MenuSection with MenuItem for each global item

### 3. Component Props

**ConnectionStatusCard:**
- `stats={stats}` - 7-day statistics object or null
- Shows loading skeleton while fetching
- Displays uptime %, success/failure counts, warnings

**DeadManSwitchPanel:**
- `status={dmsStatus}` - DMS status object or null
- Auto-refreshes every 30 seconds via parent useEffect
- Shows health/warning/error state with last check time

**MonitoringTimeline:**
- No props (self-contained)
- Manages own pagination, filters, infinite scroll
- Fetches from `/api/health-monitoring/logs`

## Testing & Verification

### User Acceptance Testing

**Verification Steps Completed:**
1. ✅ Dev server started successfully
2. ✅ Navigation link appears in desktop header
3. ✅ Navigation link appears in mobile hamburger menu
4. ✅ Clicking link navigates to `/monitoring`
5. ✅ Page renders without errors
6. ✅ Status cards display (empty state expected without data)
7. ✅ Timeline section renders with filters
8. ✅ Empty state shows correct message
9. ✅ Back button returns to home
10. ✅ Responsive layout works (2-col desktop, 1-col mobile)

**User Feedback:** "la pagina funziona ma non vedo record. probabilmente prima devo pushare in production"
- **Status:** APPROVED ✅
- **Note:** Empty state is expected - data generated by production cron job

### Edge Cases Handled

1. **No data from API:** Components show loading skeletons, then empty states
2. **API errors:** Timeline shows error message, allows retry via filter change
3. **Component unmount:** Interval cleanup prevents memory leak
4. **Filter changes:** Timeline resets cursor and refetches from start
5. **Max events limit:** Timeline stops at 200 events (memory safeguard)

## Performance Considerations

### Polling Strategy

**30-second DMS refresh interval:**
- **Pros:** Near real-time status updates, acceptable API load
- **Cons:** Continuous network requests even when page backgrounded
- **Future improvement:** Use Page Visibility API to pause when hidden

**Memory safeguard:**
- Timeline limited to 200 events max
- Prevents infinite scroll from consuming excessive memory
- Shows "limite raggiunto" message when hit

### Initial Load Performance

**Parallel data fetching:**
- Stats and DMS status fetch simultaneously (2 parallel requests)
- Timeline self-manages pagination (doesn't block initial render)
- Status cards show skeleton loaders during fetch

**No blocking operations:**
- All API calls are async
- Components render immediately with loading states
- Progressive enhancement as data arrives

## Integration Points

### Upstream Dependencies (Phase 10 Plans 02 & 03)

**From 10-02 (Status Card Components):**
- `ConnectionStatusCard` - imported from `/components/monitoring/`
- `DeadManSwitchPanel` - imported from `/components/monitoring/`
- Both components accept nullable props (handle loading state)

**From 10-03 (Timeline Components):**
- `MonitoringTimeline` - imported from `/components/monitoring/`
- `EventFilters` - used internally by Timeline
- `HealthEventItem` - used internally by Timeline
- Self-contained pagination and filtering logic

### Downstream Impact (Future Plans)

**For 10-05 (Alert Settings UI):**
- Monitoring dashboard is now accessible for users to configure alerts
- Can add "Settings" button to dashboard linking to alert configuration
- DMS status provides visual feedback for configured alert thresholds

**For Production Deployment:**
- Page will show real data once cron job populates Firestore
- No code changes needed when data becomes available
- Empty state → populated timeline (automatic transition)

## API Contracts

### GET /api/health-monitoring/stats

**Request:**
```
GET /api/health-monitoring/stats?days=7
```

**Response:**
```json
{
  "totalChecks": 1008,
  "successfulChecks": 985,
  "failedChecks": 23,
  "uptimePercentage": 97.72,
  "avgDuration": 1234,
  "lastCheck": "2026-01-28T08:45:00Z"
}
```

**Used by:** ConnectionStatusCard

### GET /api/health-monitoring/dead-man-switch

**Request:**
```
GET /api/health-monitoring/dead-man-switch
```

**Response:**
```json
{
  "status": "healthy",
  "lastRun": "2026-01-28T08:40:00Z",
  "minutesSinceLastRun": 5,
  "nextExpectedRun": "2026-01-28T08:50:00Z",
  "isOverdue": false
}
```

**Used by:** DeadManSwitchPanel (30s interval)

### GET /api/health-monitoring/logs

**Request:**
```
GET /api/health-monitoring/logs?limit=50&cursor=<docId>&type=mismatch&severity=error
```

**Response:**
```json
{
  "events": [
    {
      "id": "abc123",
      "timestamp": "2026-01-28T08:30:00Z",
      "checkedCount": 3,
      "successCount": 2,
      "failureCount": 1,
      "hasStateMismatch": true,
      "duration": 1500
    }
  ],
  "cursor": "abc123",
  "hasMore": true
}
```

**Used by:** MonitoringTimeline (paginated)

## Future Enhancements

### Short-term (Phase 10)
1. Add "Settings" button to dashboard linking to alert configuration
2. Add manual health check trigger button
3. Show alert configuration status in DeadManSwitchPanel

### Medium-term (Post-Phase 10)
1. Use Page Visibility API to pause polling when tab hidden
2. Add WebSocket support for real-time updates (eliminate polling)
3. Add export functionality (download events as CSV/JSON)
4. Add date range picker for custom time windows

### Long-term (Future Phases)
1. Add charts/graphs for uptime trends
2. Add notification history integration
3. Add device-specific health monitoring (per-device dashboards)
4. Add anomaly detection visualizations

## Commits

All commits follow conventional format with co-author attribution:

1. **6da6d68** - `feat(10-04): add monitoring dashboard page`
   - Created app/monitoring/page.js
   - Client component with stats + DMS fetching
   - 30-second polling for DMS status
   - Responsive grid layout
   - Component imports from /components/monitoring/

2. **217a2ec** - `feat(10-04): integrate monitoring link in navigation`
   - Added MONITORING to GLOBAL_SECTIONS
   - Imported Activity icon in Navbar
   - Added monitoring path to getIconForPath()
   - Link appears in desktop nav and mobile menu

3. **06a9be3** - `fix(10-04): add global navigation section to mobile menu`
   - Fixed missing global nav in mobile menu
   - Added Global Navigation Section between devices and settings
   - Added safety check for navStructure.global
   - Both desktop and mobile now show monitoring link

4. **a21851f** - `fix(10-04): correct API response field in MonitoringTimeline`
   - Fixed TypeError from accessing undefined data.logs
   - Changed to data.events (matches API response)
   - Fixed 4 occurrences in lines 50, 52, 59, 60
   - Timeline now loads events correctly

## Next Phase Readiness

### Blockers
None.

### Concerns
None - page fully functional, waiting for production data.

### Recommendations
1. Deploy to production to enable cron job data generation
2. Test with real monitoring data to verify empty state → populated transition
3. Consider adding manual health check button for testing

### Handoff Notes for Phase 10 Plan 05
- Monitoring dashboard is accessible at `/monitoring`
- Can add "Alert Settings" link from this dashboard
- DMS status provides visual context for alert thresholds
- Timeline shows historical events that alerts would have triggered on
