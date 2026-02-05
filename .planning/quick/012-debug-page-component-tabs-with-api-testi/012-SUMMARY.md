---
phase: quick
plan: 012
subsystem: debug-tools
tags: [debug, api, tabs, testing, monitoring]

# Dependency graph
requires:
  - phase: 34-04
    provides: DataTable component with Tabs namespace pattern
provides:
  - Comprehensive API debug console with tabbed interface
  - Reusable endpoint testing components (EndpointCard, PostEndpointCard)
  - Live monitoring for all system components (Stove, Netatmo, Hue, Weather, Firebase, Scheduler)
affects: [debug-tools, api-testing, monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EndpointCard/PostEndpointCard pattern for API testing"
    - "JsonDisplay component with copy-to-clipboard"
    - "Tab-based debug console layout"
    - "Auto-refresh with manual trigger override"
    - "Keyboard shortcuts for debug navigation"

key-files:
  created:
    - app/debug/api/page.js
    - app/debug/api/components/ApiTab.js
    - app/debug/api/components/tabs/StoveTab.js
    - app/debug/api/components/tabs/NetatmoTab.js
    - app/debug/api/components/tabs/HueTab.js
    - app/debug/api/components/tabs/WeatherTab.js
    - app/debug/api/components/tabs/FirebaseTab.js
    - app/debug/api/components/tabs/SchedulerTab.js
  modified: []

key-decisions:
  - "Reusable EndpointCard/PostEndpointCard components for consistent endpoint display"
  - "Tab state persistence via URL hash for shareable links"
  - "Auto-refresh (5s interval) with manual refresh override"
  - "Keyboard shortcuts: 1-6 (tabs), Cmd+R (refresh), A (auto-refresh)"
  - "Environment indicator (DEV/PROD) in header"

patterns-established:
  - "EndpointCard pattern: name, url, externalUrl, response, loading, timing, onRefresh, onCopyUrl"
  - "PostEndpointCard pattern: extends EndpointCard with params array and onExecute"
  - "JsonDisplay pattern: formatted JSON with copy button and syntax highlighting"
  - "Tab component props: autoRefresh, refreshTrigger for parent-child coordination"

# Metrics
duration: 5min
completed: 2026-02-05
---

# Quick Task 012: API Debug Console Summary

**Comprehensive API debug console with 6 tabbed interfaces for testing all system components (Stove, Netatmo, Hue, Weather, Firebase, Scheduler) with live responses, timing, and keyboard shortcuts**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-05T09:09:06Z
- **Completed:** 2026-02-05T09:13:59Z
- **Tasks:** 3 (combined into 2 commits)
- **Files created:** 8

## Accomplishments

- Complete API debug console at `/debug/api` with 6 component tabs
- Reusable EndpointCard/PostEndpointCard components for GET/POST endpoint testing
- Live JSON responses with timing, error highlighting, and copy-to-clipboard
- Auto-refresh (5s) with manual trigger, keyboard shortcuts, and URL hash persistence
- Environment indicator (DEV/PROD) and external API URL mapping with copy buttons

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Create reusable components and implement tabs** - `51503b0` (feat)
   - ApiTab.js: EndpointCard, PostEndpointCard, JsonDisplay
   - Main page.js with tabbed interface and keyboard shortcuts
   - All 6 tab implementations (Stove, Netatmo, Hue, Weather, Firebase, Scheduler)

2. **Task 3: Add utilities and polish** - `c51d570` (feat)
   - Environment indicator (DEV/PROD badge)
   - All Task 3 features already implemented in Tasks 1-2

## Files Created/Modified

**Created:**
- `app/debug/api/page.js` - Main debug page with 6 tabs and keyboard shortcuts
- `app/debug/api/components/ApiTab.js` - Reusable EndpointCard, PostEndpointCard, JsonDisplay components
- `app/debug/api/components/tabs/StoveTab.js` - Thermorossi stove GET/POST endpoints
- `app/debug/api/components/tabs/NetatmoTab.js` - Netatmo thermostat endpoints with connection status
- `app/debug/api/components/tabs/HueTab.js` - Philips Hue lights/rooms/scenes with bridge status
- `app/debug/api/components/tabs/WeatherTab.js` - Open-Meteo weather API with cache status
- `app/debug/api/components/tabs/FirebaseTab.js` - Firebase health, schedules, config with path reference
- `app/debug/api/components/tabs/SchedulerTab.js` - Cron endpoint and job stats

## Decisions Made

**1. Reusable component pattern for endpoint testing**
- Created EndpointCard (GET) and PostEndpointCard (POST) for consistent UI
- Reduces duplication across 6 tabs, easier to maintain

**2. Tab state via URL hash**
- Enables shareable debug links (e.g., `/debug/api#stove`)
- Persists tab selection across page reloads

**3. Auto-refresh with manual override**
- Global auto-refresh (5s) applies to all tabs
- Manual "Refresh All" button triggers immediate refresh
- Individual endpoint refresh buttons for targeted testing

**4. Keyboard shortcuts for efficiency**
- 1-6: Switch between tabs
- Cmd/Ctrl+R: Refresh current tab (prevents browser refresh)
- A: Toggle auto-refresh
- Improves developer workflow

**5. External URL mapping with copy buttons**
- Shows actual API URLs (Thermorossi, Netatmo, Hue, Open-Meteo)
- Copy button for each URL to test directly in browser/Postman
- Helps understand internal API → external API mapping

## Deviations from Plan

None - plan executed exactly as written. All Task 3 features (timing, error highlighting, copy buttons, collapse/expand, keyboard shortcuts) were implemented during Tasks 1-2 as part of the reusable component design.

## Issues Encountered

None - implementation followed Ember Noir design system patterns and existing debug page structure (`app/debug/stove/page.js`).

## User Setup Required

None - no external service configuration required. Debug console uses existing API routes.

## Next Phase Readiness

**Ready:**
- Complete API testing infrastructure for all system components
- Visual debugging for GET/POST responses
- Performance monitoring via timing display
- Error detection via highlighting

**Usage:**
- Navigate to `/debug/api` in browser
- Use tabs to test different components
- Execute POST commands with form inputs
- Monitor auto-refresh or use manual triggers
- Share specific tabs via URL hash

**Integration:**
- Can be extended with additional tabs for new services
- EndpointCard/PostEndpointCard components can be reused in other debug pages
- Pattern established for future API testing needs

---
*Quick Task: 012*
*Completed: 2026-02-05*
