---
status: resolved
trigger: "Firebase 'Permission denied' error when accessing schedules-v2/activeScheduleId in the stove/scheduler page"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Firebase security rules do not include schedules-v2 path
test: Verified database.rules.json lacks schedules-v2 rules
expecting: Adding schedules-v2 rules will fix the permission denied error
next_action: Add schedules-v2 rules to database.rules.json matching stoveScheduler pattern

## Symptoms

expected: WeeklyScheduler component should load schedule data from Firebase
actual: "Permission denied" error thrown at getActiveScheduleId() call
errors: |
  Permission denied
  at async getActiveScheduleId (lib/schedulerService.js:10:20)
  at async getActiveScheduleSlotsPath (lib/schedulerService.js:29:20)
  at async getWeeklySchedule (lib/schedulerService.js:296:23)
  at async WeeklyScheduler.useEffect.fetchData (app/stove/scheduler/page.js:97:22)
reproduction: Navigate to /stove/scheduler page
started: Unknown - user reported this error occurring now

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:01:00Z
  checked: database.rules.json for schedules-v2 rules
  found: No rules defined for schedules-v2 path. Only stoveScheduler (old path) has rules.
  implication: Client-side reads to schedules-v2 are denied because default rule is ".read": false

- timestamp: 2026-02-04T10:01:30Z
  checked: schedulerService.js code paths
  found: All scheduler functions read from schedules-v2/* paths (lines 10, 21, 30, 271, 311, 323, 337, 352, 368)
  implication: Every client-side scheduler operation will fail with permission denied

- timestamp: 2026-02-04T10:02:00Z
  checked: API routes vs client-side code
  found: API routes use adminDbGet/adminDbSet (server-side with admin SDK), but schedulerService.js uses client SDK
  implication: Server-side routes work, but client-side direct Firebase reads fail

- timestamp: 2026-02-04T10:02:30Z
  checked: How page.js fetches data
  found: page.js calls getWeeklySchedule() -> getActiveScheduleSlotsPath() -> getActiveScheduleId() which directly reads Firebase
  implication: Client-side read triggers permission denied because no schedules-v2 rules exist

## Resolution

root_cause: Firebase security rules in database.rules.json do not include rules for the schedules-v2 path. The code was migrated from stoveScheduler to schedules-v2, but the security rules were never updated to allow client-side reads.
fix: Add schedules-v2 rules to database.rules.json with read access matching the existing stoveScheduler pattern
verification: Rules added for schedules-v2/activeScheduleId, schedules-v2/mode, and schedules-v2/schedules/$scheduleId. JSON validated. Deploy rules to Firebase to complete fix.
files_changed: [database.rules.json]
