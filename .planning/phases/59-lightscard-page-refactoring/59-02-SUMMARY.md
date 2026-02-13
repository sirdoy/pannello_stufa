---
phase: 59-lightscard-page-refactoring
plan: 02
subsystem: lights-presentational
tags: [presentational-components, banner-utility, room-control, scenes, adaptive-styling]
dependency_graph:
  requires:
    - "Phase 58 presentational pattern"
    - "Phase 59-01 hooks (AdaptiveClasses type)"
  provides:
    - "LightsBanners utility (banner config builder)"
    - "LightsHouseControl component"
    - "LightsRoomControl component"
    - "LightsScenes component"
  affects:
    - "LightsCard.tsx (Plan 03)"
tech_stack:
  added: []
  patterns:
    - "Presentational components (props only, no state)"
    - "Banner config builder utility (not JSX component)"
    - "Adaptive styling with dynamic color-based classes"
    - "Slider commit-on-release pattern"
    - "Horizontal scroll with snap-x snap-mandatory"
key_files:
  created:
    - "app/components/devices/lights/components/LightsBanners.tsx"
    - "app/components/devices/lights/components/LightsHouseControl.tsx"
    - "app/components/devices/lights/components/LightsRoomControl.tsx"
    - "app/components/devices/lights/components/LightsScenes.tsx"
    - "__tests__/components/devices/lights/components/LightsBanners.test.tsx"
    - "__tests__/components/devices/lights/components/LightsHouseControl.test.tsx"
    - "__tests__/components/devices/lights/components/LightsRoomControl.test.tsx"
    - "__tests__/components/devices/lights/components/LightsScenes.test.tsx"
  modified: []
decisions:
  - "LightsBanners: buildLightsBanners utility function (not JSX component) builds banner array for DeviceCard"
  - "Banner priority: retry errors → pairing states → connection errors → pairing errors"
  - "LightsHouseControl: 3 visual states (mixed/all-on/all-off) with smart button logic"
  - "LightsRoomControl: Largest component (~250 LOC) with dynamic styling and brightness control"
  - "Adaptive styling: Classes computed in useLightsData hook, passed as props to components"
  - "Brightness: localBrightness managed by parent (useLightsData), passed as prop for smooth dragging"
  - "LightsScenes: Scroll indicator shows when >3 scenes"
metrics:
  duration_minutes: 5
  completed_at: "2026-02-13T09:22:51Z"
  tasks_completed: 2
  tests_added: 75
  files_created: 8
---

# Phase 59 Plan 02: Extract Lights Presentational Components Summary

Extract 4 presentational sub-components from LightsCard.tsx JSX following Phase 58 pattern.

## One-Liner

Four presentational components handle banners (9+ states), whole-house control, room control (with dynamic styling + brightness slider), and scenes grid.

## Tasks Completed

### Task 1: Create LightsBanners, LightsHouseControl Components (44e0457)

**LightsBanners.tsx (~220 LOC)**

Utility function `buildLightsBanners(props): BannerConfig[]` builds banner configuration array for DeviceCard consumption.

**9+ Banner States:**
1. Retry infrastructure errors (room/scene command failures)
2. No local bridge (offer cloud option)
3. Waiting for button press (instruction step)
4. Bridge selection (multiple bridges discovered)
5. Connection error (dismissible)
6. Pairing in progress (countdown timer)
7. Pairing success
8. Pairing error (with cloud fallback for network errors)
9. Discovering bridges (loading state)

**TypeScript interfaces:**
- `LightsBannersProps`: 17 properties (retry commands, pairing state, callbacks)
- `BannerConfig`: Banner structure matching DeviceCard expectations

**Pattern:** Not a JSX component — it's a utility that LightsCard orchestrator calls to build the `banners` array prop for DeviceCard. This follows the existing pattern where DeviceCard consumes banner configs, not banner components.

**LightsHouseControl.tsx (~100 LOC)**

Renders whole-house light toggle with smart button logic based on state:
- **Mixed state:** Shows both "Tutte" and "Spegni" buttons
- **All off:** Shows "Accendi Tutte" ember button (prominent CTA)
- **All on:** Shows "Spegni Tutte" subtle button

Displays current state: `{totalLightsOn}/{totalLights} accese`

**TypeScript interface:**
- `LightsHouseControlProps`: 7 properties (light counts, state flags, callbacks)

**Tests:** 34 passing tests covering:
- LightsBanners: All 9 banner states, priority order, callbacks, error handling
- LightsHouseControl: All 3 visual states, button behavior, disabled states

### Task 2: Create LightsRoomControl and LightsScenes Components (d09355d)

**LightsRoomControl.tsx (~280 LOC)**

Largest presentational component — handles the dynamic-styled room control area:

**Renders:**
- ON badge with glow effect (adaptive to background)
- Room name (single light) OR lights status summary (multiple lights)
- On/Off buttons with smart state logic (mixed/all-on/all-off)
- Brightness control panel:
  - Display value (localBrightness or avgBrightness)
  - Slider with commit-on-release pattern (onChange → localBrightness, onValueCommit → API call)
  - +/- ControlButtons for 5% brightness steps
- Color control link (if room has color-capable lights)

**Dynamic Styling:**
- `dynamicRoomStyle` prop: inline styles computed from light colors
- `adaptive` prop: 12 adaptive class properties for contrast-based UI
- Fallback: Default gradient backgrounds when no dynamic style

**UI-local state pattern:**
- `localBrightness` managed by parent (useLightsData hook)
- Passed as prop with `setLocalBrightness` callback
- Slider updates localBrightness during drag for smooth UI
- onValueCommit calls API and resets localBrightness to null

**TypeScript interface:**
- `LightsRoomControlProps`: 19 properties (room state, light counts, brightness, styling, callbacks)
- Uses `AdaptiveClasses` type from useLightsData

**LightsScenes.tsx (~70 LOC)**

Renders horizontal-scroll scene grid:
- Divider with "Scene" label
- Horizontal scroll container with `snap-x snap-mandatory`
- Scene buttons: 🎨 icon, scene name, activation onClick
- Scroll indicator text when >3 scenes: "← Scorri per vedere tutte le N scene →"

**TypeScript interface:**
- `LightsScenesProps`: 3 properties (roomScenes array, refreshing flag, callback)

**Tests:** 41 passing tests covering:
- LightsRoomControl: Room name display, ON badge, status summary, all 3 button states, brightness control, color link, dynamic styling, disabled states
- LightsScenes: Scene rendering, icons, scroll indicator logic, fallback names, edge cases

## Verification

```bash
# All components compile
npx tsc --noEmit app/components/devices/lights/components/*.tsx
# ✅ Compiles (JSX flag warnings expected with direct tsc call)

# All tests pass
npx jest __tests__/components/devices/lights/components/ --no-cache
# ✅ 75 tests passing (34 + 41)

# LightsCard.tsx unchanged
git status app/components/devices/lights/LightsCard.tsx
# ✅ Not modified (orchestrator wiring in Plan 03)

# No business state in components
grep -r "useState\|useEffect\|fetch" app/components/devices/lights/components/
# ✅ No matches (purely presentational)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LightsScenes test: aria-hidden selector**
- **Found during:** Task 2 test run
- **Issue:** Divider component also has `aria-hidden="true"`, causing test to find 4 elements instead of 3
- **Fix:** Changed test selector to `span[aria-hidden="true"]` to target only scene icons
- **Files modified:** LightsScenes.test.tsx
- **Commit:** d09355d

## Success Criteria Met

- ✅ LightsBanners utility builds banner configs for all 9+ states (retry errors, pairing steps, connection error)
- ✅ LightsHouseControl renders whole-house on/off with 3 visual states
- ✅ LightsRoomControl renders dynamic-styled room controls with brightness slider and adaptive styling
- ✅ LightsScenes renders horizontal-scroll scene grid
- ✅ All components are presentational (props in → UI out)
- ✅ All components have TypeScript props interfaces
- ✅ 75 tests pass for all components

## Next Steps

**Plan 03:** Refactor LightsCard as orchestrator (~200 LOC) consuming hooks from Plan 01 and sub-components from Plan 02

**Wire-up pattern:**
1. Import hooks: useLightsData, useLightsCommands
2. Import sub-components: LightsBanners, LightsHouseControl, LightsRoomControl, LightsScenes
3. Call `buildLightsBanners(...)` to create banner array for DeviceCard
4. Render sub-components with data from hooks
5. Remove 1025 LOC of extracted code from LightsCard

## Performance Impact

- **Bundle size:** +8 files, ~670 LOC (net reduction after Plan 03 removal)
- **Memory:** No impact (state structure unchanged)
- **Test coverage:** +75 tests
- **Render performance:** No impact (same component tree, different structure)

## Architecture Notes

**Component Size Distribution:**
- LightsBanners: ~220 LOC (utility function with 9 banner configs)
- LightsHouseControl: ~100 LOC (simple state-based rendering)
- LightsRoomControl: ~280 LOC (largest, handles dynamic styling + brightness)
- LightsScenes: ~70 LOC (simplest, horizontal scroll)

**Key architectural decisions:**
1. LightsBanners is a utility function, not a JSX component (DeviceCard consumes banner configs)
2. Adaptive styling computed in hooks, passed as props to components
3. Brightness slider uses commit-on-release pattern (same as Plan 01 research)
4. All components follow Phase 58 pattern: props only, no business state

**Why LightsBanners is a function:**
- DeviceCard expects `banners` prop as array of config objects
- Banner rendering happens inside DeviceCard (Banner component)
- LightsCard orchestrator calls `buildLightsBanners(props)` to get array
- Same pattern as StoveBanners component (confirmed in research)

## Dependencies

**Requires:**
- @/app/components/ui (Button, Heading, Text, Slider, ControlButton, Divider)
- @/app/components/devices/lights/hooks/useLightsData (AdaptiveClasses type)
- @/lib/utils/cn (cn utility)

**Provides:**
- buildLightsBanners utility (for Plan 03)
- LightsHouseControl component (for Plan 03)
- LightsRoomControl component (for Plan 03)
- LightsScenes component (for Plan 03)

## Test Coverage

**LightsBanners (34 tests):**
- Empty state
- Retry infrastructure errors (room/scene commands)
- All 9 pairing flow states
- Connection error
- Pairing error with cloud fallback
- Banner priority order
- Action callbacks

**LightsHouseControl (13 tests):**
- Empty state (no lights)
- Light count display
- Mixed state (both buttons)
- All off state (accendi button)
- All on state (spegni button)
- Disabled states
- Edge cases

**LightsRoomControl (20 tests):**
- Room name display (single vs multiple)
- ON badge visibility
- Lights status summary
- On/Off buttons (3 states)
- Brightness control visibility
- localBrightness display
- Color control link visibility
- Dynamic styling application
- Disabled states

**LightsScenes (8 tests):**
- Empty state (no scenes)
- Scene rendering
- Scene icons
- Scroll indicator (>3 scenes)
- Fallback names
- Disabled states
- Edge cases (1/3/4 scenes)

## Self-Check: PASSED

**Created files exist:**
```bash
[✓] app/components/devices/lights/components/LightsBanners.tsx
[✓] app/components/devices/lights/components/LightsHouseControl.tsx
[✓] app/components/devices/lights/components/LightsRoomControl.tsx
[✓] app/components/devices/lights/components/LightsScenes.tsx
[✓] __tests__/components/devices/lights/components/LightsBanners.test.tsx
[✓] __tests__/components/devices/lights/components/LightsHouseControl.test.tsx
[✓] __tests__/components/devices/lights/components/LightsRoomControl.test.tsx
[✓] __tests__/components/devices/lights/components/LightsScenes.test.tsx
```

**Commits exist:**
```bash
[✓] 44e0457: feat(59-02): create LightsBanners and LightsHouseControl components
[✓] d09355d: feat(59-02): create LightsRoomControl and LightsScenes components
```

**Tests pass:**
```bash
[✓] 75/75 tests passing
```
