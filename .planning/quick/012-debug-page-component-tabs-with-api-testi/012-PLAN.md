---
phase: quick
plan: 012
type: execute
wave: 1
depends_on: []
files_modified:
  - app/debug/api/page.js
  - app/debug/api/components/ApiTab.js
  - app/debug/api/components/tabs/StoveTab.js
  - app/debug/api/components/tabs/NetatmoTab.js
  - app/debug/api/components/tabs/HueTab.js
  - app/debug/api/components/tabs/WeatherTab.js
  - app/debug/api/components/tabs/FirebaseTab.js
  - app/debug/api/components/tabs/SchedulerTab.js
autonomous: true

must_haves:
  truths:
    - "User can see tabs for each major component (Stove, Netatmo, Hue, Weather, Firebase, Scheduler)"
    - "User can view live API responses for each component"
    - "User can execute POST/control API calls and see results"
    - "User can refresh individual endpoints"
    - "User can auto-refresh data"
  artifacts:
    - path: "app/debug/api/page.js"
      provides: "Main debug page with tabs layout"
      min_lines: 50
    - path: "app/debug/api/components/ApiTab.js"
      provides: "Reusable tab component with endpoint display"
      min_lines: 80
    - path: "app/debug/api/components/tabs/StoveTab.js"
      provides: "Stove API endpoints tab"
      min_lines: 40
  key_links:
    - from: "app/debug/api/page.js"
      to: "app/components/ui/Tabs.js"
      via: "import Tabs"
      pattern: "import.*Tabs"
---

<objective>
Create a comprehensive API debug page with tabbed interface for testing all system components.

Purpose: Provide a single location to test, debug, and monitor all API endpoints (Stove, Netatmo, Hue, Weather, Firebase, Scheduler) with live data and control capabilities.

Output: New `/debug/api` page with tabbed interface, each tab displaying GET responses and POST controls for its component.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/api-routes.md
@app/debug/stove/page.js (reference implementation pattern)
@app/components/ui/Tabs.js (namespace component pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create reusable ApiTab component and page structure</name>
  <files>
    app/debug/api/page.js
    app/debug/api/components/ApiTab.js
  </files>
  <action>
Create the main debug API page and reusable components:

1. **app/debug/api/components/ApiTab.js** - Reusable component for endpoint testing:
   - `EndpointCard` component: displays endpoint name, URL, method badge (GET/POST), response JSON, refresh button, loading state
   - `PostEndpointCard` component: same as above but with input fields for parameters and execute button
   - `JsonDisplay` component: syntax-highlighted JSON with copy button
   - Props: `endpoints` array with `{ name, url, method, params?: [] }`, `autoRefresh`, `onExecute`
   - Use existing UI components: Card, Button, Heading, Text, Badge from design system
   - Show external API URL (for Thermorossi, Netatmo, etc.) with copy button
   - Support auto-refresh toggle (5s interval)

2. **app/debug/api/page.js** - Main page with tabs:
   - Use PageLayout with header
   - Use Tabs component with namespace pattern (Tabs.List, Tabs.Trigger, Tabs.Content)
   - Tabs: Stove, Netatmo, Hue, Weather, Firebase, Scheduler
   - Each tab content loads lazily via dynamic imports
   - Global auto-refresh toggle in header
   - Dark-first styling following Ember Noir design system

Pattern reference: Follow the existing `app/debug/stove/page.js` structure for endpoint display.
  </action>
  <verify>
    - `ls app/debug/api/` shows page.js and components/ directory
    - Visit http://localhost:3000/debug/api shows tabbed interface
    - Tabs are clickable with sliding indicator
  </verify>
  <done>
    - Debug API page renders with 6 tabs
    - Reusable ApiTab component handles endpoint display
    - Styling matches Ember Noir design system
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement individual component tabs</name>
  <files>
    app/debug/api/components/tabs/StoveTab.js
    app/debug/api/components/tabs/NetatmoTab.js
    app/debug/api/components/tabs/HueTab.js
    app/debug/api/components/tabs/WeatherTab.js
    app/debug/api/components/tabs/FirebaseTab.js
    app/debug/api/components/tabs/SchedulerTab.js
  </files>
  <action>
Create individual tab components for each system:

1. **StoveTab.js** - Thermorossi stove endpoints:
   - GET: /api/stove/status, /api/stove/getPower, /api/stove/getFan, /api/stove/settings, /api/stove/getRoomTemperature, /api/stove/getActualWaterTemperature, /api/stove/getWaterSetTemperature
   - POST: /api/stove/ignite, /api/stove/shutdown, /api/stove/setPower (level 1-5), /api/stove/setFan (level 1-6), /api/stove/setWaterTemperature (30-80)
   - Show external Thermorossi API URLs

2. **NetatmoTab.js** - Netatmo thermostat endpoints:
   - GET: /api/netatmo/homesdata, /api/netatmo/homestatus, /api/netatmo/devices, /api/netatmo/devices-temperatures, /api/netatmo/debug
   - POST: /api/netatmo/setthermmode (mode: schedule/away/hg), /api/netatmo/setroomthermpoint (temp), /api/netatmo/calibrate
   - Connection status indicator

3. **HueTab.js** - Philips Hue endpoints:
   - GET: /api/hue/status, /api/hue/lights, /api/hue/rooms, /api/hue/scenes
   - POST: /api/hue/lights/[id] (on/off, brightness), /api/hue/rooms/[id], /api/hue/scenes/[id]/activate
   - Bridge connection status

4. **WeatherTab.js** - Weather API endpoints:
   - GET: /api/weather/forecast
   - Show cached vs fresh data status
   - Display Open-Meteo API URL

5. **FirebaseTab.js** - Firebase status:
   - GET: /api/health (shows Firebase connection)
   - Display: /api/schedules (list schedules), /api/schedules/active
   - Show: cronHealth/lastCall, maintenance data paths
   - Config: /api/config/location, /api/config/dashboard

6. **SchedulerTab.js** - Scheduler/Cron endpoints:
   - GET: /api/scheduler/check (with secret param input)
   - POST: /api/scheduler/update
   - Show cron job status: last call, mode, upcoming actions
   - Display: /api/notifications/stats, /api/health-monitoring/stats

Each tab:
- Uses ApiTab reusable components
- Fetches data on mount
- Supports refresh and auto-refresh
- Shows loading/error states
- Displays relevant debug info (connection status, timestamps, etc.)
  </action>
  <verify>
    - `ls app/debug/api/components/tabs/` shows all 6 tab files
    - Each tab displays its endpoints with responses
    - POST controls work (test with setPower, setFan)
    - Auto-refresh updates data every 5s when enabled
  </verify>
  <done>
    - All 6 tabs implemented with their respective endpoints
    - GET endpoints auto-fetch on tab activation
    - POST endpoints have input fields and execute buttons
    - Responses display as formatted JSON
  </done>
</task>

<task type="auto">
  <name>Task 3: Add debug utilities and polish</name>
  <files>
    app/debug/api/page.js
    app/debug/api/components/ApiTab.js
  </files>
  <action>
Add debug utilities and final polish:

1. **Header utilities in page.js:**
   - Global auto-refresh toggle (affects all tabs)
   - "Refresh All" button for current tab
   - Last refresh timestamp display
   - Tab persistence via URL hash (#stove, #netatmo, etc.)

2. **Enhanced ApiTab.js features:**
   - Response timing (ms) for each request
   - Error highlighting (red border, error icon)
   - Success indicator (green checkmark for 200 responses)
   - Copy full response to clipboard button
   - Collapse/expand JSON response
   - Request history (last 5 requests per endpoint)

3. **Additional debug info:**
   - Environment indicator (dev/prod)
   - Firebase path being read/written
   - Token expiry for OAuth services (Netatmo, Hue)
   - Rate limit remaining (if exposed by APIs)

4. **Keyboard shortcuts:**
   - Cmd/Ctrl + R: Refresh current tab
   - 1-6: Switch tabs
   - A: Toggle auto-refresh

Follow Ember Noir design system:
- Dark-first with [html:not(.dark)_&] overrides
- Use Card variants (default, elevated)
- Use Button variants (default, outline, ghost)
- Use Badge for method indicators (GET=blue, POST=amber)
  </action>
  <verify>
    - URL updates with tab hash (#stove, #netatmo)
    - Response times displayed (e.g., "234ms")
    - Error states show red highlighting
    - Copy button works for JSON responses
    - Keyboard shortcuts work (test with Cmd+R, numbers)
  </verify>
  <done>
    - Debug page is polished and fully functional
    - All utilities (timing, copy, history) working
    - Keyboard shortcuts implemented
    - Tab state persists via URL hash
  </done>
</task>

</tasks>

<verification>
- Visit http://localhost:3000/debug/api
- All 6 tabs render and are clickable
- Stove tab shows all GET responses
- Can execute POST commands (setPower, setFan)
- Auto-refresh updates data periodically
- URL hash changes with tab selection
- No console errors
</verification>

<success_criteria>
- Debug page accessible at /debug/api
- 6 tabs for all major components
- Live API responses displayed
- POST controls functional
- Auto-refresh working
- Matches Ember Noir design system
</success_criteria>

<output>
After completion, create `.planning/quick/012-debug-page-component-tabs-with-api-testi/012-SUMMARY.md`
</output>
