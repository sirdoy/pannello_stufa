---
phase: quick
plan: 260331-eyf
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/devices/deviceTypes.ts
  - lib/notifications/notificationTriggers.ts
  - __tests__/lib/healthNotifications.test.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Navbar has no broken links (no 404s from global navigation)"
    - "Stove health notifications link to /stove where status is visible"
  artifacts:
    - path: "lib/devices/deviceTypes.ts"
      provides: "GLOBAL_SECTIONS without dead /monitoring entry"
    - path: "lib/notifications/notificationTriggers.ts"
      provides: "Notification URLs pointing to valid /stove route"
    - path: "__tests__/lib/healthNotifications.test.ts"
      provides: "Updated assertions for /stove URL"
  key_links:
    - from: "lib/devices/deviceRegistry.ts"
      to: "GLOBAL_SECTIONS"
      via: "getGlobalNavItems() iterates all entries"
      pattern: "Object\\.values\\(GLOBAL_SECTIONS\\)"
---

<objective>
Fix broken /monitoring link in navbar and notification URLs.

Purpose: The MONITORING entry in GLOBAL_SECTIONS points to /monitoring which has no page.tsx — causing a 404 in the navbar. Three stove health notification triggers also link to /monitoring. The monitoring analytics subsystem was removed in quick task 260322-t5k but these references were left behind.

Output: Clean navbar with no broken links; stove notifications pointing to /stove.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/devices/deviceTypes.ts
@lib/devices/deviceRegistry.ts
@lib/notifications/notificationTriggers.ts
@__tests__/lib/healthNotifications.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove MONITORING from GLOBAL_SECTIONS and fix notification URLs</name>
  <files>lib/devices/deviceTypes.ts, lib/notifications/notificationTriggers.ts</files>
  <action>
1. In `lib/devices/deviceTypes.ts` (~line 305-311): Delete the entire MONITORING entry from the GLOBAL_SECTIONS record:
   ```
   MONITORING: {
     id: 'monitoring',
     name: 'Monitoring',
     icon: '📊',
     route: '/monitoring',
   },
   ```
   This removes the broken navbar link. The `getGlobalNavItems()` in deviceRegistry.ts iterates `Object.values(GLOBAL_SECTIONS)` so removing the entry is sufficient.

2. In `lib/notifications/notificationTriggers.ts` (~lines 285, 296, 307): Change `url: '/monitoring'` to `url: '/stove'` in all three notification trigger configs:
   - `monitoring_connection_lost` (line 285)
   - `monitoring_state_mismatch` (line 296)
   - `monitoring_stove_error` (line 307)
   These are stove health notifications — /stove is where the user sees stove status.
  </action>
  <verify>
    <automated>cd /Users/federicomanfredi/Sites/localhost/pannello-stufa && grep -c "route: '/monitoring'" lib/devices/deviceTypes.ts && echo "FAIL: still has /monitoring route" || echo "OK: no /monitoring in GLOBAL_SECTIONS" && grep -c "url: '/monitoring'" lib/notifications/notificationTriggers.ts && echo "FAIL: still has /monitoring url" || echo "OK: notification URLs updated"</automated>
  </verify>
  <done>MONITORING entry removed from GLOBAL_SECTIONS. All three notification trigger URLs changed to /stove.</done>
</task>

<task type="auto">
  <name>Task 2: Update notification test assertions</name>
  <files>__tests__/lib/healthNotifications.test.ts</files>
  <action>
In `__tests__/lib/healthNotifications.test.ts`, update the assertion on line 23 that checks:
```
expect(type.url).toBe('/monitoring');
```
Change to:
```
expect(type.url).toBe('/stove');
```
This assertion appears in the `monitoring_connection_lost type exists with correct config` test. Check if similar URL assertions exist in the `monitoring_state_mismatch` and `monitoring_stove_error` test blocks and update those too.
  </action>
  <verify>
    <automated>cd /Users/federicomanfredi/Sites/localhost/pannello-stufa && npx jest __tests__/lib/healthNotifications.test.ts --no-coverage 2>&1 | tail -5</automated>
  </verify>
  <done>All healthNotifications tests pass with updated /stove URL assertions.</done>
</task>

</tasks>

<verification>
- `grep -r "'/monitoring'" lib/` returns no results
- `npx jest __tests__/lib/healthNotifications.test.ts --no-coverage` passes
- `grep "MONITORING" lib/devices/deviceTypes.ts` returns no results (entry fully removed)
</verification>

<success_criteria>
- No /monitoring references remain in GLOBAL_SECTIONS or notification triggers
- Navbar renders without any 404 links
- Stove health notifications point to /stove
- All existing tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260331-eyf-fix-menu-links-and-add-missing-pages-to-/260331-eyf-SUMMARY.md`
</output>
