---
phase: quick-009
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: ["app/components/devices/thermostat/ThermostatCard.js"]
autonomous: true

must_haves:
  truths:
    - "Active devices section appears at the very top of ThermostatCard content"
    - "Active devices section is above the battery warning banner"
    - "Active devices section is visually separated from temperature controls"
  artifacts:
    - path: "app/components/devices/thermostat/ThermostatCard.js"
      provides: "Reordered layout with active devices at top"
      contains: "activeRooms"
  key_links:
    - from: "ThermostatCard children content"
      to: "Active devices section"
      via: "First element in children"
      pattern: "activeRooms.length > 0"
---

<objective>
Move the "Dispositivi Attivi" section (active device badges) to the TOP of the ThermostatCard content, above the battery warning banner and room selector, while keeping it visually separate from the temperature control section.

Purpose: Improve visibility of active heating devices by positioning them prominently at the top
Output: Reordered ThermostatCard with active devices section as first content element
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/008-active-devices-filter-only/008-SUMMARY.md
@app/components/devices/thermostat/ThermostatCard.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move active devices section to top of ThermostatCard</name>
  <files>app/components/devices/thermostat/ThermostatCard.js</files>
  <action>
Reorder the ThermostatCard children content to place "Dispositivi Attivi" at the very top:

1. **Move the active devices section** (currently lines 468-495) to be the FIRST element inside the DeviceCard children, BEFORE the RoomSelector component

2. **Adjust the styling** for top positioning:
   - Remove `mt-5 sm:mt-6` from the wrapper div (no longer needed at top)
   - Add `mb-4 sm:mb-5` for spacing BELOW the section
   - Keep the Divider component but change spacing to `spacing="medium"` instead of `spacing="large"`

3. **Ensure visual separation** from temperature controls:
   - The RoomSelector will act as a natural separator
   - The active devices section should stand on its own at the top

4. **Keep the conditional rendering intact**: `{activeRooms.length > 0 && (...)}`

Current order:
```
<DeviceCard>
  <RoomSelector />
  <ActiveDevicesSection />  <!-- Currently here -->
  <TemperatureDisplay />
  ...
</DeviceCard>
```

New order:
```
<DeviceCard>
  <ActiveDevicesSection />  <!-- Move to top -->
  <RoomSelector />
  <TemperatureDisplay />
  ...
</DeviceCard>
```

Note: The DeviceCard banners prop handles error and battery warning banners internally at the very top. The active devices section will appear BELOW those banners but ABOVE the RoomSelector.
  </action>
  <verify>
    - npm run dev (no errors)
    - Visual inspection: Active devices badges appear at top of card content (below any error/battery banners)
    - Visual inspection: RoomSelector dropdown appears below active devices section
    - Visual inspection: Clear visual separation between active devices and temperature controls
  </verify>
  <done>
    - Active devices section renders as first child element in DeviceCard
    - Section has proper bottom margin for spacing
    - Layout is clean with clear separation between sections
  </done>
</task>

</tasks>

<verification>
1. When devices are actively heating:
   - Active devices badges visible at the very top of card content
   - RoomSelector appears below active devices
   - Temperature display appears below RoomSelector

2. When no devices are actively heating:
   - Active devices section not visible (conditional rendering preserved)
   - RoomSelector appears at the top

3. Layout flow:
   - DeviceCard header
   - DeviceCard banners (error, battery warning)
   - Active devices section (when present)
   - RoomSelector
   - Temperature display and controls
</verification>

<success_criteria>
- Active devices section is the first element in DeviceCard children
- Visual hierarchy: banners > active devices > room selector > temperature
- No breaking changes to existing functionality
- Clean, separated layout between sections
</success_criteria>

<output>
After completion, create `.planning/quick/009-move-active-devices-top/009-SUMMARY.md`
</output>
