---
phase: 05-automation-and-testing
plan: 04
subsystem: admin-testing
tags: [admin, notifications, testing, priority, ui]

requires:
  - 05-01: Playwright infrastructure with Page Objects
  - 02-04: Test notification templates and API

provides:
  - admin-testing.priority-selector: Test notifications with HIGH/NORMAL/LOW priority
  - admin-testing.bulk-testing: Send test notifications to all user devices
  - admin-testing.history-integration: Test notifications logged and visible in history
  - admin-testing.dnd-testing: CRITICAL priority bypasses DND for testing

affects:
  - 05-05: E2E tests for admin panel will use priority selectors via data-testid

tech-stack:
  added: []
  patterns:
    - "Template-based priority defaults (auto-set on template selection)"
    - "Priority override in request body (client controls final priority)"
    - "isTest flag in notification data for history filtering"

key-files:
  created: []
  modified:
    - app/api/notifications/test/route.js: "Priority parameter, isTest flag, low_priority_test template"
    - app/debug/notifications/test/page.js: "Priority selector UI, data-testid attributes, info card"

decisions:
  - id: ADMIN-TEST-01
    decision: "Priority in request overrides template default"
    rationale: "Allows admin to test any template with any priority for comprehensive DND verification"
    alternatives: ["Template priority only (less flexible)", "Separate priority templates (UI clutter)"]
    impact: "Enables testing CRITICAL bypass with any message template"

  - id: ADMIN-TEST-02
    decision: "Add isTest: true flag to notification data"
    rationale: "Allows future filtering of test notifications in history UI if needed"
    alternatives: ["No distinction (test and production mixed)", "Separate test notification collection (complexity)"]
    impact: "Test notifications identifiable in data layer without affecting delivery"

  - id: ADMIN-TEST-03
    decision: "Replace status_test with low_priority_test template"
    rationale: "Clearer naming - 'low_priority' describes the attribute being tested"
    alternatives: ["Keep status_test (confusing name)", "Add both (redundant templates)"]
    impact: "Template name better communicates testing purpose"

metrics:
  duration: 5.2
  completed: 2026-01-26
---

# Phase 05 Plan 04: Admin Testing Enhancements Summary

**One-liner:** Priority selector (HIGH/NORMAL/LOW) with auto-set from templates, test notifications logged to history with isTest flag

## What Was Built

Enhanced admin test notification panel with:

1. **Priority Selector API** (Task 1)
   - Accept `priority` parameter in POST /api/notifications/test
   - Priority from request overrides template default
   - Added `low_priority_test` template (replaced `status_test`)
   - Mark test notifications with `isTest: true` in data
   - Include priority in notification data for filtering

2. **Priority Selector UI** (Task 2)
   - Three radio buttons: HIGH / NORMAL / LOW
   - Auto-set priority when template changes (defaultPriority)
   - Added `critical_test` and `low_priority_test` templates
   - data-testid attributes on all interactive elements (9 total)
   - Priority sent in test notification request

3. **Test History Integration** (Task 3)
   - "Logged to notification history" indicator in result trace
   - Info card explaining test notifications appear in history
   - Document CRITICAL priority bypasses DND hours
   - Document bulk testing sends to all user devices
   - Link to notification history page

## Implementation Notes

**Priority Selection Flow:**
```javascript
// Template change auto-sets priority
handleTemplateChange('critical_test')
  → setPriority('high') // from template.defaultPriority

// But admin can override
setPriority('low')

// Final priority sent to API
body.priority = priority // 'low' in this case
```

**Test Notification Data Structure:**
```javascript
{
  title: '🚨 Test CRITICAL',
  body: 'Notifica CRITICAL di test - bypassa DND',
  priority: 'high', // or overridden value
  data: {
    type: 'CRITICAL',
    priority: 'high', // included for filtering
    isTest: true, // identifies test notifications
    timestamp: '2026-01-26T11:25:04Z',
    url: '/settings/notifications'
  }
}
```

**data-testid Attributes Added:**
- `test-template`: Template dropdown
- `device-selector`: Device select for specific targeting
- `target-all`: All devices radio button
- `target-specific`: Specific device radio button
- `priority-high`: HIGH priority radio
- `priority-normal`: NORMAL priority radio
- `priority-low`: LOW priority radio
- `send-test-notification`: Send button
- `delivery-status`: Result container
- `custom-title`: Custom title input
- `custom-body`: Custom body textarea

Total: 11 data-testid attributes for E2E testing

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Testing Impact

**For E2E Tests (Plan 05-05):**
- Test priority selection via `data-testid="priority-high"`
- Verify template change auto-sets priority
- Test CRITICAL notifications during DND hours
- Verify test notifications appear in history
- Test bulk device targeting

**For Manual Testing:**
- Visit /debug/notifications/test
- Select CRITICAL template → priority auto-sets to HIGH
- Send notification during DND hours
- Verify notification bypasses DND
- Check notification appears in /settings/notifications/history

## Success Criteria Verification

- [x] Priority selector with HIGH/NORMAL/LOW options (3 radio buttons)
- [x] Template dropdown includes critical_test and low_priority_test (6 templates total)
- [x] Template selection auto-sets appropriate priority (handleTemplateChange)
- [x] All interactive elements have data-testid for E2E tests (11 attributes)
- [x] Test notifications marked with isTest: true in data
- [x] Info section explains history logging and CRITICAL behavior (info card)

## Commits

| Task | Commit | Files | Changes |
|------|--------|-------|---------|
| 1 | 87a07ce | app/api/notifications/test/route.js | Priority parameter, isTest flag, low_priority_test template |
| 2 | e460f4b | app/debug/notifications/test/page.js | Priority selector UI, data-testid attributes, auto-set priority |
| 3 | 8e6da5c | app/debug/notifications/test/page.js | History indicator, info card with DND and bulk testing docs |

## Next Phase Readiness

**Ready for Phase 5 Plan 05 (Admin Panel E2E Tests):**
- ✅ All data-testid attributes in place for stable selectors
- ✅ Priority selector testable via radio button states
- ✅ Template dropdown has 6 options to verify
- ✅ Bulk testing (All Devices) verifiable via targetDevices in trace
- ✅ Test notifications logged to history for verification

**Testing Capabilities:**
- Admin can test notification delivery with any priority
- Admin can test DND bypass with CRITICAL priority
- Admin can test bulk delivery to all devices
- Admin can verify notifications appear in history
- All interactive elements have stable selectors for automation

**Technical Readiness:**
- Priority filtering implemented in Phase 3 (03-05)
- DND filtering implemented in Phase 3 (03-04)
- Notification history implemented in Phase 4 (04-01, 04-03)
- Test notification templates established in Phase 2 (02-04)

No blockers for next plan.
