---
phase: quick-008
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/thermostat/ThermostatCard.js
autonomous: true

must_haves:
  truths:
    - "Dispositivi Attivi section shows ONLY devices that are actively heating"
    - "Section is completely hidden when no device is active"
    - "Active device criteria: heating=true OR (setpoint > temperature)"
  artifacts:
    - path: "app/components/devices/thermostat/ThermostatCard.js"
      provides: "Filtered active devices display"
      contains: "activeRooms.length > 0"
  key_links:
    - from: "activeRooms filter"
      to: "Dispositivi Attivi section"
      via: "conditional rendering"
      pattern: "activeRooms\\.length"
---

<objective>
Filter the "Dispositivi Attivi" section in ThermostatCard to show ONLY devices that are actively heating (heating=true OR setpoint > temperature). Hide the entire section when no devices are active.

Purpose: Reduce visual noise by showing only relevant active devices instead of all devices
Output: Cleaner ThermostatCard with contextual active devices display
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/devices/thermostat/ThermostatCard.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Filter active devices and conditionally render section</name>
  <files>app/components/devices/thermostat/ThermostatCard.js</files>
  <action>
Modify the "Dispositivi Attivi" section (lines 461-496) to:

1. Create a filtered array of active rooms BEFORE the JSX:
   ```javascript
   // Filter only active rooms (heating or setpoint > temperature)
   const activeRooms = roomsWithStatus.filter(room => {
     if (room.isOffline) return false;
     return room.heating === true ||
            (room.setpoint && room.temperature && room.setpoint > room.temperature);
   });
   ```

2. Wrap the entire "Dispositivi Attivi" section in a conditional:
   ```javascript
   {activeRooms.length > 0 && (
     <div className="mt-5 sm:mt-6">
       <Divider label="Dispositivi Attivi" variant="gradient" spacing="large" />
       ...
     </div>
   )}
   ```

3. Update the map to iterate over `activeRooms` instead of `roomsWithStatus`

4. Remove the inactive/offline styling since we only show active devices now:
   - Remove the `isActive` calculation inside the map (all are active)
   - Remove offline styling branch (offline devices are filtered out)
   - Keep only the active (ember) styling for all displayed devices

5. Simplify the badge styling to only use active styling:
   ```javascript
   className={cn(
     "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
     "bg-ember-900/40 border-ember-500/40 text-ember-300 [html:not(.dark)_&]:bg-ember-100 [html:not(.dark)_&]:border-ember-300 [html:not(.dark)_&]:text-ember-700"
   )}
   ```

Place the `activeRooms` filter calculation near line 146 where `hasHeating` is calculated, as they share similar logic.
  </action>
  <verify>
Manual verification:
1. When no devices are heating (all rooms have heating=false AND setpoint <= temperature), the "Dispositivi Attivi" section should be completely hidden
2. When at least one device is heating, only that device appears in the section with ember styling
3. Offline devices never appear in the section
4. The pulse animation dot still appears on active device badges
  </verify>
  <done>
- "Dispositivi Attivi" section only renders when activeRooms.length > 0
- Only rooms with heating=true OR setpoint > temperature are shown
- Offline rooms are excluded from the filter
- All displayed devices use ember (active) styling
- Section completely hidden when no active devices
  </done>
</task>

</tasks>

<verification>
- Load ThermostatCard when no devices are heating -> "Dispositivi Attivi" section not visible
- Load ThermostatCard when at least one device is heating -> section shows only active devices
- Verify offline devices never appear in the list
- Verify ember styling on all displayed badges
</verification>

<success_criteria>
1. Section hidden when no active devices (empty filter result)
2. Section shows ONLY active devices (heating=true OR setpoint > temperature)
3. Offline devices excluded from display
4. All displayed devices use ember/active styling
5. Existing functionality (room selection, temperature controls, etc.) unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/008-active-devices-filter-only/008-SUMMARY.md`
</output>
