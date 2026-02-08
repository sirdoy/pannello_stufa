---
status: resolved
trigger: "Fix TypeScript build errors in scheduler and stove-related production files."
created: 2026-02-08T10:30:00Z
updated: 2026-02-08T10:50:00Z
---

## Current Focus

hypothesis: Multiple type mismatches - ScheduleMetadata vs actual data structure, WeekSchedule vs WeeklySchedule, variant string literals not matching component definitions
test: Read each file to understand the actual types and expected types
expecting: Find root causes - likely type definition mismatches or incorrect imports
next_action: Read scheduler page.tsx to understand ScheduleMetadata structure

## Symptoms

expected: `npx tsc --noEmit` produces 0 errors for these files
actual: Multiple TypeScript errors across stove and scheduler files
errors:
- app/stove/scheduler/page.tsx: 16 errors (ScheduleMetadata properties, WeekSchedule vs WeeklySchedule, variant strings)
- app/stove/page.tsx: 1 error (Toast variant)
- app/stove/maintenance/page.tsx: 2 errors (Button href prop, variant string)
- app/components/scheduler/*.tsx: 2 errors (variant strings, type assignments)
reproduction: Run `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "__tests__\|\.test\."`
started: TypeScript migration Phase 43 verification

## Eliminated

## Evidence

- timestamp: 2026-02-08T10:35:00Z
  checked: API route /api/schedules GET response
  found: Returns `{ schedules: ScheduleMetadata[], activeScheduleId: string }`
  implication: getAllSchedules() return type is wrong - should match API response

- timestamp: 2026-02-08T10:36:00Z
  checked: lib/schedulerService.ts ScheduleInterval interface
  found: Has `fan: number` property (required)
  implication: Page component's ScheduleInterval missing `fan` property

- timestamp: 2026-02-08T10:37:00Z
  checked: WeeklySchedule vs WeekSchedule types
  found: WeeklySchedule is from lib/schedulerService.ts, WeekSchedule is local type in page.tsx
  implication: Type mismatch when passing to components expecting WeeklySchedule

- timestamp: 2026-02-08T10:38:00Z
  checked: Toast, Badge, Button variant types
  found: Toast has success|error|warning|info, Badge has ember|sage|ocean|warning|danger|neutral
  implication: String literals not matching allowed variants

## Resolution

root_cause: Multiple type definition mismatches - API client return type wrong, local ScheduleInterval missing fan property, variant string literals not matching component definitions, WeekSchedule vs WeeklySchedule type mismatch
fix:
- Fixed getAllSchedules() return type to match API response { schedules, activeScheduleId }
- Added fan property to local ScheduleInterval interface
- Fixed {} as WeekSchedule type assertions in reduce() calls
- Changed Button variant="warning" to variant="subtle" (warning not supported)
- Added type assertions for WeekSchedule to WeeklySchedule compatibility
- Fixed Toast component usage (new API with open/onOpenChange instead of message/icon)
- Fixed Button href prop (wrapped in Link component)
- Changed Input variant="ember" to variant="default"
- Fixed Select onChange type assertion (e.target.value as string)
verification: `npx tsc --noEmit` shows 0 errors in scheduler and stove files
files_changed:
- lib/schedulesApiClient.ts
- app/stove/scheduler/page.tsx
- app/stove/page.tsx
- app/stove/maintenance/page.tsx
- app/components/scheduler/CreateScheduleModal.tsx
