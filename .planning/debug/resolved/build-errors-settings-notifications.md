---
status: resolved
trigger: "Fix TypeScript build errors in settings, notifications, and misc production files"
created: 2026-02-08T10:00:00Z
updated: 2026-02-08T10:00:00Z
---

## Current Focus

hypothesis: All errors confirmed - ready to fix with type assertions and interface updates
test: Apply targeted fixes to each file
expecting: All 13 errors resolved
next_action: Fix each error with minimal changes

## Symptoms

expected: `npx tsc --noEmit` produces 0 errors for settings/notification files
actual: 13 TypeScript errors across 6 files
errors:
- ThermostatCard.tsx: string | number vs string (2 errors)
- design-system/page.tsx: string | number vs string, "subtle" not in variant type (2 errors)
- notifications/devices/page.tsx: NotificationDevice missing Device properties (1 error)
- NotificationSettingsForm.tsx: NotificationPreferences type issues (3 errors)
- notifications/page.tsx: Spread types, "rate_limited" not in TestResult, comparison issue (3 errors)
- settings/page.tsx: isDisplayOnly, hasHomepageCard missing on UnifiedDevice (2 errors)
reproduction: Run `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "__tests__\|\.test\."`
started: TypeScript migration Phase 43 verification

## Eliminated

## Evidence

- timestamp: 2026-02-08T10:05:00Z
  checked: Select component variants in Select.tsx
  found: Only supports 'default' | 'ember' | 'ocean', not 'subtle'
  implication: design-system page uses invalid variant

- timestamp: 2026-02-08T10:05:00Z
  checked: NotificationDevice vs Device interfaces
  found: Device (DeviceListItem.tsx) has displayName, platform, browser, os, lastUsed, tokenPrefix, status. NotificationDevice (devices/page.tsx) has tokenKey, token, customName, lastUsed
  implication: Different interfaces - device prop in DeviceListItem expects full Device type

- timestamp: 2026-02-08T10:05:00Z
  checked: TestResult type in notifications/page.tsx
  found: type TestResult = 'success' | 'error' | 'no_tokens' (line 34)
  implication: Missing 'rate_limited' value

- timestamp: 2026-02-08T10:05:00Z
  checked: UnifiedDevice interface in settings/page.tsx
  found: Only has id, name, icon, description, visible, order (lines 357-364)
  implication: Missing isDisplayOnly and hasHomepageCard properties

- timestamp: 2026-02-08T10:05:00Z
  checked: NotificationPreferences type conflict
  found: Two definitions - lib/schemas (Zod inferred) vs local interfaces in notification pages
  implication: useForm needs generic type parameter to match Zod schema type

- timestamp: 2026-02-08T10:05:00Z
  checked: Select onChange handler
  found: onChange receives ChangeEvent<HTMLSelectElement>, e.target.value is string | number
  implication: Need to convert to string or use type assertion

## Resolution

root_cause: Multiple type mismatches across 6 files - string/number to string conversions, missing union values, incomplete interfaces, conflicting type definitions
fix: Applied targeted type fixes:
  1. ThermostatCard.tsx: Convert e.target.value to String() for setSelectedScheduleId
  2. design-system/page.tsx: Convert e.target.value to String(), change "subtle" to "ocean" variant
  3. notifications/page.tsx: Add "rate_limited" to TestResult union, import NotificationPreferences from schema, use double assertion for devicesList
  4. settings/page.tsx: Add isDisplayOnly and hasHomepageCard optional properties to UnifiedDevice
  5. notifications/devices/page.tsx: Add missing Device properties to NotificationDevice interface, use type assertion for device prop
  6. NotificationSettingsForm.tsx: Import NotificationPreferences from schema instead of local interface, add generic type parameter to useForm
verification: Run `npx tsc --noEmit` - 0 errors in target files
files_changed:
  - app/components/devices/thermostat/ThermostatCard.tsx
  - app/debug/design-system/page.tsx
  - app/settings/notifications/page.tsx
  - app/settings/notifications/devices/page.tsx
  - app/settings/notifications/NotificationSettingsForm.tsx
  - app/settings/page.tsx
