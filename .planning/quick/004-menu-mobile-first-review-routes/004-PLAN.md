---
phase: quick
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/Navbar.js
  - lib/devices/deviceTypes.js
autonomous: true

must_haves:
  truths:
    - "Mobile bottom nav adapts to enabled devices (not hardcoded to stove)"
    - "All debug pages are accessible via Settings > Debug submenu"
    - "Sonos routes are removed until pages exist"
  artifacts:
    - path: "app/components/Navbar.js"
      provides: "Dynamic mobile bottom nav based on device preferences"
      contains: "getMobileQuickActions"
    - path: "lib/devices/deviceTypes.js"
      provides: "Complete debug submenu with all existing pages"
      contains: "debug-logs"
  key_links:
    - from: "app/components/Navbar.js"
      to: "navStructure.devices"
      via: "getMobileQuickActions function"
      pattern: "getMobileQuickActions.*navStructure"
---

<objective>
Review and fix mobile-first navigation to ensure all routes are present and the mobile bottom nav is device-aware.

Purpose: The mobile bottom nav is currently hardcoded to stove-only routes (scheduler, errors). This should adapt to enabled devices. Also, several debug pages are missing from the navigation menu.

Output:
- Dynamic mobile bottom nav that shows relevant quick actions for enabled devices
- Complete debug submenu in Settings with all existing debug pages
- Clean device config (remove Sonos until pages exist)
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/Navbar.js
@lib/devices/deviceTypes.js
@lib/devices/deviceRegistry.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update deviceTypes.js - Complete Debug Submenu and Remove Sonos</name>
  <files>lib/devices/deviceTypes.js</files>
  <action>
Update the SETTINGS_MENU.DEBUG.submenu array to include ALL existing debug pages:
1. Keep existing: debug-stove (/debug), debug-transitions (/debug/transitions), debug-design-system (/debug/design-system)
2. Add: debug-logs (/debug/logs) - "Log di sistema" - icon: '📋'
3. Add: debug-notifications (/debug/notifications) - "Debug Notifiche" - icon: '🔔'
4. Add: debug-weather-test (/debug/weather-test) - "Test Meteo" - icon: '🌤️'

For Sonos in DEVICE_CONFIG: Set `enabled: false` since no page.js files exist for /sonos routes. Keep the config for future implementation.

Note: /debug/notifications/test is a sub-route accessed from /debug/notifications, doesn't need separate menu entry.
  </action>
  <verify>
    - grep "debug-logs" lib/devices/deviceTypes.js
    - grep "debug-notifications" lib/devices/deviceTypes.js
    - grep "debug-weather-test" lib/devices/deviceTypes.js
    - Confirm Sonos has enabled: false
  </verify>
  <done>Debug submenu contains 6 items (stove, transitions, design-system, logs, notifications, weather-test). Sonos is disabled.</done>
</task>

<task type="auto">
  <name>Task 2: Implement Dynamic Mobile Bottom Nav</name>
  <files>app/components/Navbar.js</files>
  <action>
Replace the hardcoded mobile bottom nav (lines 598-674) with a dynamic solution:

1. Create a helper function `getMobileQuickActions(navStructure)` that:
   - Always includes Home (/)
   - If stove is enabled: add Orari (/stove/scheduler), Errori (/stove/errors)
   - If thermostat is enabled and stove is NOT: add Programmazione (/thermostat/schedule)
   - If lights is enabled and stove/thermostat NOT: add Scene (/lights/scenes)
   - Always includes Log (/log) as the last item
   - Returns array of max 4 items: { href, icon, label }

2. Use icon mapping:
   - Home: Home icon (already imported)
   - scheduler/schedule: Calendar icon (already imported)
   - errors: AlertCircle icon (already imported)
   - scenes: Lightbulb (need to import from lucide-react)
   - log: Clock icon (already imported)

3. Replace the hardcoded `grid-cols-4` bottom nav with a map over getMobileQuickActions result:
   - Keep the existing styling (ember-glow, transitions, etc.)
   - Dynamic grid columns based on items.length (grid-cols-3 or grid-cols-4)

Design rationale: Mobile real estate is precious. The bottom nav should show the most important quick actions for the PRIMARY enabled device, not try to show everything. Users access other routes via the hamburger menu.
  </action>
  <verify>
    - App starts without errors: npm run dev (check console)
    - Bottom nav renders correctly with different device combinations:
      - Stove enabled: Home, Orari, Errori, Log
      - Thermostat only: Home, Programmazione, Log
      - Lights only: Home, Scene, Log
  </verify>
  <done>Mobile bottom nav is dynamic and adapts to device preferences. Shows Home + device-specific quick actions + Log.</done>
</task>

<task type="auto">
  <name>Task 3: Add Unit Tests for getMobileQuickActions</name>
  <files>app/components/__tests__/Navbar.test.js</files>
  <action>
Create or update tests for the getMobileQuickActions helper:

1. Create test file if not exists
2. Export getMobileQuickActions from Navbar.js (or extract to separate util if cleaner)
3. Test cases:
   - Empty navStructure.devices returns [Home, Log]
   - Stove only returns [Home, Orari, Errori, Log]
   - Thermostat only returns [Home, Programmazione, Log]
   - Lights only returns [Home, Scene, Log]
   - Stove + Thermostat returns [Home, Orari, Errori, Log] (stove takes priority)
   - Max 4 items returned

Use existing test patterns from the codebase (Jest + React Testing Library).
  </action>
  <verify>npm test -- --testPathPattern="Navbar" --passWithNoTests</verify>
  <done>getMobileQuickActions has test coverage for all device combinations.</done>
</task>

</tasks>

<verification>
1. All debug pages accessible via hamburger menu > Settings > Debug
2. Sonos does not appear in navigation (disabled)
3. Mobile bottom nav changes based on enabled devices in /settings/devices
4. Tests pass: `npm test -- --testPathPattern="Navbar"`
</verification>

<success_criteria>
- Mobile bottom nav is device-aware, not hardcoded to stove
- Debug submenu complete with 6 pages
- Sonos hidden until implemented
- Unit tests for getMobileQuickActions
- No regression in existing navigation functionality
</success_criteria>

<output>
After completion, create `.planning/quick/004-menu-mobile-first-review-routes/004-SUMMARY.md`
</output>
