---
phase: quick-007
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/thermostat/ThermostatCard.js
autonomous: true

must_haves:
  truths:
    - "User can see all rooms and their active status at a glance without selecting each room"
    - "Active devices are clearly indicated (heating=true OR setpoint > temperature)"
    - "Device type (valve/thermostat) is shown for each room"
  artifacts:
    - path: "app/components/devices/thermostat/ThermostatCard.js"
      provides: "ActiveDevicesList component section"
      contains: "ActiveDevicesList"
  key_links:
    - from: "ActiveDevicesList"
      to: "roomsWithStatus"
      via: "map over rooms array"
      pattern: "roomsWithStatus\\.map"
---

<objective>
Add a compact "Active Devices List" section to ThermostatCard that shows all rooms with their device status at a glance.

Purpose: User should see which rooms have active devices without having to click through the RoomSelector dropdown. "Active" means heating=true OR setpoint > current temperature.

Output: A new collapsible/compact list section in ThermostatCard showing room name, device type (valve/thermostat icon), and active status indicator.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app/components/devices/thermostat/ThermostatCard.js
@app/components/ui/Badge.js
@docs/design-system.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add ActiveDevicesList section to ThermostatCard</name>
  <files>app/components/devices/thermostat/ThermostatCard.js</files>
  <action>
Add a new "Dispositivi Attivi" section AFTER the RoomSelector and BEFORE the selected room temperature display.

Implementation details:

1. Create the section with a Divider labeled "Dispositivi Attivi"

2. Build a compact grid/list showing ALL rooms from `roomsWithStatus`:
   - Each row shows: Room name, Device type icon, Active status
   - Device type: 🔧 for valve (NRV), 🌡️ for thermostat (NATherm1/OTH)
   - Active indicator logic:
     ```javascript
     const isActive = room.heating === true ||
                      (room.setpoint && room.temperature && room.setpoint > room.temperature);
     ```

3. Visual design (Ember Noir theme):
   - Use a compact horizontal list with wrapping (flex flex-wrap)
   - Each room as a pill/badge-like element
   - Active rooms: ember variant styling with pulse dot
   - Inactive rooms: neutral/slate styling
   - Offline rooms: muted with 📵 icon

4. Structure for each room item:
   ```jsx
   <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ...">
     <span>{deviceIcon}</span>
     <span>{room.name}</span>
     {isActive && <span className="w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse" />}
   </div>
   ```

5. Styling classes:
   - Active: `bg-ember-900/40 border-ember-500/40 text-ember-300 [light mode variants]`
   - Inactive: `bg-slate-800/40 border-slate-600/30 text-slate-300 [light mode variants]`
   - Offline: `opacity-60` with neutral colors

6. Position: Insert after line 459 (after RoomSelector), before line 461 (before Selected Room Temperature section)

Use existing cn() utility and Badge component patterns from the codebase.
  </action>
  <verify>
    - Run `npm test -- --testPathPattern="ThermostatCard" --passWithNoTests` (tests may not cover this)
    - Visual check: Component renders without errors
    - All rooms visible in the list
    - Active rooms show ember styling + pulse dot
    - Inactive rooms show neutral styling
  </verify>
  <done>
    - ThermostatCard displays a compact "Dispositivi Attivi" section
    - All rooms visible at a glance without dropdown interaction
    - Active status clearly indicated with ember color and pulse animation
    - Device type (valve/thermostat) visible via icon
  </done>
</task>

</tasks>

<verification>
1. Start dev server: `npm run dev`
2. Navigate to homepage where ThermostatCard is displayed
3. Verify "Dispositivi Attivi" section appears below room selector
4. Verify all rooms are shown (compare with dropdown count)
5. Verify active rooms (heating or setpoint > temp) have ember styling
6. Verify inactive rooms have neutral styling
7. Verify device icons match room type (valve vs thermostat)
8. Test light/dark mode to ensure both themes work
</verification>

<success_criteria>
- [ ] New "Dispositivi Attivi" section visible in ThermostatCard
- [ ] All rooms displayed without needing to open dropdown
- [ ] Active status visually distinguishable (ember + pulse)
- [ ] Device type icon shown (🔧 valve, 🌡️ thermostat)
- [ ] Works in both dark and light mode
- [ ] No console errors or warnings
</success_criteria>

<output>
After completion, create `.planning/quick/007-thermostat-active-devices-list/007-SUMMARY.md`
</output>
