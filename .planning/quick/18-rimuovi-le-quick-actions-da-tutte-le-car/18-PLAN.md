---
phase: 18-rimuovi-le-quick-actions-da-tutte-le-car
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/stove/StoveCard.tsx
  - app/components/devices/thermostat/ThermostatCard.tsx
  - app/components/devices/lights/LightsCard.tsx
  - app/components/devices/camera/CameraCard.tsx
autonomous: true
must_haves:
  truths:
    - "No Quick Actions icon bars visible on any homepage device card"
    - "All primary controls (StoveCard ACCENDI/SPEGNI, ThermostatCard mode grid, LightsCard On/Off buttons, CameraCard refresh overlay) remain functional"
    - "No unused Lucide icon imports remain in modified files"
  artifacts:
    - path: "app/components/devices/stove/StoveCard.tsx"
      provides: "StoveCard without Quick Actions bar"
    - path: "app/components/devices/thermostat/ThermostatCard.tsx"
      provides: "ThermostatCard without Quick Actions bar"
    - path: "app/components/devices/lights/LightsCard.tsx"
      provides: "LightsCard without Quick Actions bar"
    - path: "app/components/devices/camera/CameraCard.tsx"
      provides: "CameraCard without Quick Actions bar"
  key_links: []
---

<objective>
Remove all Quick Actions icon-button bars from the four homepage device cards (StoveCard, ThermostatCard, LightsCard, CameraCard). These bars duplicate functionality already available in the primary control sections of each card.

Purpose: Simplify card UI by removing redundant shortcut buttons.
Output: Four updated card components with Quick Actions removed and unused icon imports cleaned up.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/devices/stove/StoveCard.tsx
@app/components/devices/thermostat/ThermostatCard.tsx
@app/components/devices/lights/LightsCard.tsx
@app/components/devices/camera/CameraCard.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove Quick Actions bars from StoveCard and ThermostatCard</name>
  <files>
    app/components/devices/stove/StoveCard.tsx
    app/components/devices/thermostat/ThermostatCard.tsx
  </files>
  <action>
**StoveCard.tsx:**
1. Delete lines 1162-1191 (the entire `{/* Quick Actions Bar - Always visible */}` block including the wrapping `<div className="flex items-center justify-center gap-3 mt-4">` and both buttons inside it — Power toggle and Fan control).
2. Update the lucide-react import (line 6): remove `Power` and `Fan` from the import. They are NOT used anywhere else in the file. The remaining imports should be: `{ Plus, Minus, Settings, Activity, RefreshCw }`.

**ThermostatCard.tsx:**
1. Delete lines 685-711 (the entire `{/* Quick Actions Bar - Icon buttons */}` block including the `{!selectedRoom.isOffline && (...)}` wrapper, the `<div className="flex items-center justify-center gap-3 mt-4">`, and the Mode Quick Cycle button inside it).
2. Update the lucide-react import (line 5): remove `Power`, `Home`, and `Snowflake` from the import. `Calendar` is still used at line 462 (context menu). The remaining imports should be: `{ Plus, Minus, Calendar, Settings, RefreshCw }`.

Do NOT touch:
- StoveCard PRIMARY ACTIONS section (the ACCENDI/SPEGNI text buttons starting around line 1194)
- ThermostatCard temperature controls (lines 713+)
- ThermostatCard mode control grid (lines 757-800, uses emoji icons not Lucide)
  </action>
  <verify>
Run `npx tsc --noEmit 2>&1 | head -20` to confirm no TypeScript errors in modified files. Grep each file for "Quick Actions" to confirm the sections are removed. Grep each file for removed icon names to confirm no dangling references.
  </verify>
  <done>
StoveCard and ThermostatCard no longer render Quick Actions bars. No unused Lucide imports remain. TypeScript compiles cleanly.
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove Quick Actions bars from LightsCard and CameraCard</name>
  <files>
    app/components/devices/lights/LightsCard.tsx
    app/components/devices/camera/CameraCard.tsx
  </files>
  <action>
**LightsCard.tsx:**
1. Delete lines 957-969 (the entire `{/* Quick Actions Bar */}` block including the `{selectedRoom && (...)}` wrapper, the `<div className="flex items-center justify-center gap-3 mb-4">`, and the `Button.Icon` Power toggle inside it).
2. Update the lucide-react import (line 5): remove `Power` from the import. It is NOT used anywhere else in the file. The remaining imports should be: `{ Palette, Settings, RefreshCw }`.

**CameraCard.tsx:**
1. Delete lines 283-293 (the entire `{/* Quick Actions */}` block including the `<div className="flex items-center justify-center gap-3 mb-4">` and the `Button.Icon` snapshot capture button inside it).
2. Update the lucide-react import (line 5): remove `Camera` from the import. It is NOT used anywhere else in the file (the word "Camera" appears in strings/comments but not as JSX). The remaining imports should be: `{ RefreshCw, Activity, Settings }`.

Do NOT touch:
- LightsCard "Quick All-House Control" section (lines 880-945)
- LightsCard main On/Off buttons (lines 1065-1123)
- CameraCard refresh overlay button (lines 392-402)
- CameraCard video/snapshot text toggle
  </action>
  <verify>
Run `npx tsc --noEmit 2>&1 | head -20` to confirm no TypeScript errors in modified files. Grep each file for "Quick Actions" to confirm the sections are removed. Grep each file for removed icon names (as JSX tags, not strings) to confirm no dangling references.
  </verify>
  <done>
LightsCard and CameraCard no longer render Quick Actions bars. No unused Lucide imports remain. TypeScript compiles cleanly.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `grep -n "Quick Actions" app/components/devices/stove/StoveCard.tsx app/components/devices/thermostat/ThermostatCard.tsx app/components/devices/lights/LightsCard.tsx app/components/devices/camera/CameraCard.tsx` returns no matches
3. All existing tests pass: `npm test -- --testPathPattern="(StoveCard|ThermostatCard|LightsCard|CameraCard)" --passWithNoTests`
</verification>

<success_criteria>
- All four device cards render without Quick Actions bars
- No TypeScript compilation errors
- No unused Lucide icon imports in any of the four files
- All primary controls in each card remain intact and unmodified
- Existing tests continue to pass
</success_criteria>

<output>
After completion, create `.planning/quick/18-rimuovi-le-quick-actions-da-tutte-le-car/18-SUMMARY.md`
</output>
