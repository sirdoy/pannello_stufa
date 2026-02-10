---
phase: 17-rimuovi-comandi-duplicati
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
    - "Each device card has exactly ONE set of controls per function (no duplicate power/temp/brightness/mode toggles)"
    - "Quick Actions bars retain non-duplicated controls (Power toggle, Fan shortcut, Mode cycle, Snapshot capture, Room power toggle)"
    - "All retained controls still function correctly (click handlers unchanged)"
    - "Layout spacing is clean after removals (no empty gaps or orphaned containers)"
  artifacts:
    - path: "app/components/devices/stove/StoveCard.tsx"
      provides: "Stove card with deduplicated power level controls"
    - path: "app/components/devices/thermostat/ThermostatCard.tsx"
      provides: "Thermostat card with deduplicated temperature controls"
    - path: "app/components/devices/lights/LightsCard.tsx"
      provides: "Lights card with deduplicated brightness controls"
    - path: "app/components/devices/camera/CameraCard.tsx"
      provides: "Camera card with deduplicated live/snapshot toggle"
  key_links: []
---

<objective>
Remove duplicate controls from homepage device cards' Quick Actions bars. Each card currently has compact controls in the Quick Actions bar AND full controls in the main panel below. Remove the compact duplicates, keeping the more detailed main panel controls.

Purpose: Cleaner UI, less confusion, smaller component code.
Output: 4 updated card components with deduplicated controls.
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
  <name>Task 1: Remove duplicate controls from StoveCard and ThermostatCard</name>
  <files>
    app/components/devices/stove/StoveCard.tsx
    app/components/devices/thermostat/ThermostatCard.tsx
  </files>
  <action>
**StoveCard.tsx** - Remove the Power Level +/- controls from the Quick Actions bar (lines ~1176-1201). This is the `{status?.toUpperCase().includes('WORK') && (` block containing the compact minus/plus buttons with the `text-ember-400` power level display inside `bg-slate-800/50` pill. The full Potenza ControlButton pair in the Adjustments section (lines ~1472-1510) is the keeper.

KEEP in Quick Actions:
- Power Toggle button (lines ~1165-1174) - unique, not duplicated
- Fan button (lines ~1203-1217) - navigation shortcut, not duplicated

After removal, the Quick Actions bar will have: Power toggle + Fan button (when in WORK mode). Layout should remain `flex items-center justify-center gap-3 mt-4` -- two buttons center nicely.

**ThermostatCard.tsx** - Remove the Temperature +/- compact controls from the Quick Actions bar (lines ~688-712). This is the `{selectedRoom.setpoint && (` block inside the Quick Actions `div`, containing compact minus/plus with `text-ocean-400` temperature display. The full "Quick temperature controls - Ember Noir" panel below (lines ~741-768) with large `h-16` buttons is the keeper.

KEEP in Quick Actions:
- Mode Quick Cycle button (lines ~716-736) - unique, not duplicated

After removal, the Quick Actions bar `div` will contain only the Mode Quick Cycle button. Since it is a single centered button, the existing `flex items-center justify-center gap-3 mt-4` layout still works fine.

Do NOT modify any handler functions, state, or imports unless an import becomes unused after removal (e.g., if Minus/Plus icons are no longer used in that section -- check if they are still used elsewhere in the file before removing imports).
  </action>
  <verify>
    - `npx tsc --noEmit` passes with no new errors
    - `npm test -- --testPathPattern="StoveCard|ThermostatCard"` passes (existing tests)
    - Visually grep: `grep -n "Diminuisci Potenza" app/components/devices/stove/StoveCard.tsx` returns 0 results in Quick Actions area (only in Adjustments section)
    - Visually grep: `grep -n "Diminuisci Temperatura" app/components/devices/thermostat/ThermostatCard.tsx` returns 0 results in Quick Actions area (only in temperature panel)
  </verify>
  <done>
    - StoveCard Quick Actions bar contains only Power toggle and Fan shortcut (no power level +/-)
    - ThermostatCard Quick Actions bar contains only Mode Quick Cycle button (no temperature +/-)
    - Full power level controls remain in Adjustments section of StoveCard
    - Full temperature controls remain in the "Quick temperature controls" panel of ThermostatCard
    - No TypeScript errors, existing tests pass
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove duplicate controls from LightsCard and CameraCard</name>
  <files>
    app/components/devices/lights/LightsCard.tsx
    app/components/devices/camera/CameraCard.tsx
  </files>
  <action>
**LightsCard.tsx** - Remove the brightness slider from the Quick Actions bar (lines ~968-994). This is the `{isRoomOn && (` block inside Quick Actions containing the compact `Sun` icon + `Slider` with `w-24` class inside a `bg-slate-800/50` pill. The full brightness panel in the main controls area (lines ~1147-1205) with value display, full-width slider, and ControlButton +/- is the keeper.

KEEP in Quick Actions:
- Room Power toggle `Button.Icon` (lines ~960-966) - unique, not duplicated (this is room-level toggle, different from individual light toggles)

After removal, the Quick Actions bar will contain only the Room Power toggle. Since it is a single centered button, the existing `flex items-center justify-center gap-3 mb-4` layout works fine.

Check if `Sun` icon import is still used elsewhere in the file. If not, remove the import. The `Slider` import MUST be kept (used in main panel). The `localBrightness` / `setLocalBrightness` state MUST be kept (used in main panel slider's onChange).

**CameraCard.tsx** - Remove the live/snapshot icon toggle from the Quick Actions bar (lines ~293-301). This is the `{selectedCamera?.status === 'on' && (` block containing `Button.Icon` with `Video`/`Image` icons that toggles `isLiveMode`. The text-based "Snapshot" / "Live" button pair below (lines ~322-339) is the keeper.

KEEP in Quick Actions:
- Snapshot capture button (lines ~285-292) - unique action (captures snapshot), not duplicated

After removal, the Quick Actions bar will contain only the Snapshot capture button. Single centered button works fine with existing flex layout.

Check if `Video` and `Image` icon imports are still used elsewhere in the file. If not, remove those imports.

Do NOT modify any handler functions, state, or other logic.
  </action>
  <verify>
    - `npx tsc --noEmit` passes with no new errors
    - Grep: only ONE brightness slider remains in LightsCard (the main panel one)
    - Grep: only ONE set of live/snapshot toggle remains in CameraCard (the text buttons)
    - Quick Actions bars each contain exactly one control element
  </verify>
  <done>
    - LightsCard Quick Actions bar contains only Room Power toggle (no brightness slider)
    - CameraCard Quick Actions bar contains only Snapshot capture button (no live/snapshot icon toggle)
    - Full brightness controls remain in main panel of LightsCard
    - Text-based Snapshot/Live toggle buttons remain below Quick Actions in CameraCard
    - No TypeScript errors, no unused imports
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` -- zero new TypeScript errors
2. `npm test` -- all existing tests pass (3034+ tests)
3. Manual check: each card's Quick Actions bar has NO duplicate of controls found in the main panel below
4. Each Quick Actions bar retains its unique (non-duplicated) controls
</verification>

<success_criteria>
- 4 device cards updated: StoveCard, ThermostatCard, LightsCard, CameraCard
- Zero duplicate controls remain (each function has exactly one control point)
- All retained controls function correctly (handlers unchanged)
- Clean layout with no empty containers or orphaned wrappers
- TypeScript compiles, all tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/17-rimuovi-comandi-duplicati-dalle-card-hom/17-SUMMARY.md`
</output>
