---
phase: 47
plan: 07
subsystem: frontend-components
tags: [strict-mode, index-access-safety, type-safety]
dependency_graph:
  requires: [47-01, 47-02, 47-03]
  provides: [source-file-index-safety]
  affects: [all-non-test-source-files]
tech_stack:
  added: []
  patterns: [array-default-destructuring, nullish-coalescing-fallbacks, non-null-assertion-after-guard, variable-extraction-for-type-narrowing]
key_files:
  created: []
  modified:
    - app/components/devices/lights/LightsCard.tsx
    - app/changelog/page.tsx
    - app/components/WhatsNewModal.tsx
    - app/components/NotificationPreferencesPanel.tsx
    - app/settings/page.tsx
    - app/settings/dashboard/page.tsx
    - app/thermostat/schedule/components/WeeklyTimeline.tsx
    - app/thermostat/schedule/components/ManualOverrideSheet.tsx
    - app/components/lights/EditSceneModal.tsx
    - app/components/lights/CreateSceneModal.tsx
    - app/hooks/useVersionCheck.ts
    - app/components/scheduler/WeeklyTimeline.tsx
    - jest.setup.ts
    - app/components/devices/camera/CameraCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/netatmo/RoomCard.tsx
    - app/components/sandbox/SandboxPanel.tsx
    - app/components/ui/HealthIndicator.tsx
    - app/components/ui/Slider.tsx
    - app/components/weather/HourlyForecast.tsx
    - app/settings/notifications/NotificationSettingsForm.tsx
    - components/notifications/DeviceListItem.tsx
    - components/notifications/NotificationItem.tsx
    - app/(pages)/camera/events/CameraEventsPage.tsx
    - lib/devices/deviceRegistry.ts
decisions:
  - Array default destructuring pattern (e.g., `[r = 0, g = 0, b = 0]`) for guaranteed non-undefined values
  - Non-null assertion `!` safe after nullish coalescing fallback to known-good default
  - Variable extraction pattern when TypeScript can't infer type narrowing through if-guard (e.g., `const validRoute: string = route`)
  - Provide complete default objects for Record index access (LightConfig default for lights modals)
  - Optional chaining for mock object methods (jest.setup localStorageMock)
  - Nullish coalescing for array access in map iterations (forecast data)
metrics:
  duration: 936s
  completed: 2026-02-09
---

# Phase 47 Plan 07: Remaining Source File noUncheckedIndexedAccess Fixes Summary

**One-liner:** Fixed 75 noUncheckedIndexedAccess errors across 22 planned files + 2 discovered gaps, achieving zero tsc errors in all non-test source files

## Objective

Fix ~74 noUncheckedIndexedAccess errors across 22 remaining source files: app components (14 files), pages (5 files), hooks (1 file), notifications components (2 files), and jest.setup.ts. Combined with Plans 04-06, all non-test source files are now clean.

## Execution

### Task 1: Fix high-error component files (11 files, ~43 errors)

**Execution time:** ~8 minutes

**What was done:**

**LightsCard.tsx (7 errors):**
- Added default values for RGB array destructuring: `[r = 0, g = 0, b = 0]`
- Added undefined checks for slider value callbacks before state updates and API calls

**changelog/page.tsx (6 errors):**
- Added default values for version part destructuring: `[aMajor = 0, aMinor = 0, aPatch = 0]`

**WhatsNewModal.tsx (5 errors):**
- Added fallback default object for undefined VERSION_HISTORY access: `|| { version, date, type: 'patch', changes: [] }`

**NotificationPreferencesPanel.tsx (5 errors):**
- Added undefined checks for key access in setNestedValue function
- Used early returns and optional handling for missing keys

**settings/page.tsx (4 errors) + dashboard/page.tsx (4 errors):**
- Extracted array elements before array swap destructuring: `const current = arr[i]; if (!current) return`
- Pattern ensures non-undefined values before destructuring assignment

**thermostat schedule components (6 errors):**
- WeeklyTimeline: added undefined check for slotsByDay array access, optional chaining for map
- ManualOverrideSheet: extracted firstRoom before property access

**lights modals (6 errors - CreateSceneModal + EditSceneModal):**
- Provided complete LightConfig default objects: `prev[lightId] || { on: true, brightness: 100, color: null }`
- Pattern ensures spread always has valid object, satisfies SetStateAction type

**useVersionCheck.ts (4 errors):**
- Added nullish coalescing for version part access: `parts1[i] ?? 0`

**stove scheduler WeeklyTimeline (4 errors):**
- Added default values for time part destructuring: `[startH = 0, startM = 0]`

**Files modified:** 11 files (LightsCard, changelog, WhatsNewModal, NotificationPreferencesPanel, settings, dashboard, WeeklyTimeline x2, ManualOverrideSheet, EditSceneModal, CreateSceneModal, useVersionCheck)

**Verification:** 0 tsc errors in these 11 files after fixes

**Commit:** `77f4107`

### Task 2: Fix low-error files + jest.setup.ts + discovered gaps (13 files, ~32 errors)

**Execution time:** ~7 minutes

**What was done:**

**jest.setup.ts (4 errors):**
- Added optional chaining for localStorageMock method calls: `localStorageMock.getItem?.mockClear()`
- Pattern handles Record<string, T> index access returning possibly undefined

**CameraCard.tsx (1 error):**
- Extracted first camera before id access: `const firstCamera = cameras[0]; if (firstCamera)`

**ThermostatCard.tsx (1 error):**
- Extracted mode array element before handleModeChange: `const nextMode = modes[nextIndex]; if (nextMode)`

**RoomCard.tsx (1 error):**
- Used non-null assertion after nullish coalescing: `(badges[mode] ?? badges.schedule)!`

**SandboxPanel.tsx (2 errors):**
- Added undefined checks before saveSchedule calls: `if (today) { await saveSchedule(today, ...) }`

**HealthIndicator.tsx (2 errors):**
- Used non-null assertion for iconMap fallback: `(iconMap[status] ?? iconMap.ok)!`
- Safe because fallback always exists

**Slider.tsx (1 error):**
- Added undefined check for values[0] in single-thumb mode before callback

**HourlyForecast.tsx (1 error):**
- Added nullish coalescing with defaults for array access in map: `displayTemps[index] ?? 0`

**NotificationSettingsForm.tsx (2 errors):**
- Extracted first window before spread: `const firstWindow = updated[0]; if (firstWindow)`

**DeviceListItem.tsx (1 error), NotificationItem.tsx (2 errors):**
- Used non-null assertions for style/icon fallbacks: `(styles[status] ?? styles.default)!`

**Discovered gaps (2 files, 2 errors):**
- **CameraEventsPage.tsx:** Extracted first entry before isIntersecting check
- **deviceRegistry.ts:** Variable extraction pattern for type narrowing: `const validRoute: string = route`

**Files modified:** 13 files (jest.setup, 8 planned component files, 2 notifications components, 2 discovered gaps)

**Verification:** 0 tsc errors in all source files (non-test)

**Commit:** `9145736`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CameraEventsPage.tsx missing from plan**
- **Found during:** Task 2 verification
- **Issue:** entries[0] possibly undefined in IntersectionObserver callback
- **Fix:** Extracted first entry with optional chaining before isIntersecting check
- **Files modified:** app/(pages)/camera/events/CameraEventsPage.tsx
- **Commit:** 9145736

**2. [Rule 3 - Blocking] deviceRegistry.ts missing from plan**
- **Found during:** Task 2 verification
- **Issue:** TypeScript couldn't infer type narrowing through if-guard for object literal property
- **Fix:** Variable extraction pattern: `const validRoute: string = route` after guard
- **Files modified:** lib/devices/deviceRegistry.ts
- **Commit:** 9145736

Plan listed 22 files but final verification revealed 2 additional files with noUncheckedIndexedAccess errors. These were likely added/modified after plan creation. Fixed per Rule 3 (blocking issues) to achieve objective (zero source errors).

## Self-Check: PASSED

**Created files verified:**
- ✅ .planning/phases/47-test-strict-mode-and-index-access/47-07-SUMMARY.md

**Modified files verified (sample):**
```bash
[ -f "app/components/devices/lights/LightsCard.tsx" ] && echo "FOUND"
FOUND: app/components/devices/lights/LightsCard.tsx

[ -f "app/changelog/page.tsx" ] && echo "FOUND"
FOUND: app/changelog/page.tsx

[ -f "jest.setup.ts" ] && echo "FOUND"
FOUND: jest.setup.ts
```

**Commits verified:**
```bash
git log --oneline --all | grep -q "77f4107" && echo "FOUND: 77f4107"
FOUND: 77f4107

git log --oneline --all | grep -q "9145736" && echo "FOUND: 9145736"
FOUND: 9145736
```

**Verification command:**
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "test\.\|__tests__" | wc -l
0
```

Result: ✅ Zero source file errors achieved

## Impact

**Before:** 75 noUncheckedIndexedAccess errors across 24 source files (22 planned + 2 discovered)

**After:** 0 tsc errors in all non-test source files

**Phase 47 progress:** Plans 01-03 fixed test files, plans 04-07 would fix source files (47-04/05/06 appear not yet executed based on STATE.md), this plan (47-07) completes remaining source files

**Test files:** Still have errors (to be addressed in Plan 08)

## Patterns Established

1. **Array default destructuring:** `[r = 0, g = 0, b = 0]` for guaranteed values
2. **Variable extraction for type narrowing:** When if-guard doesn't narrow type in object literal
3. **Complete default objects:** For Record index access state updates
4. **Non-null assertion after fallback:** Safe when fallback guaranteed to exist
5. **Optional chaining for mock methods:** Jest mock object method access
6. **Nullish coalescing in maps:** Provide defaults for array access in iterations
