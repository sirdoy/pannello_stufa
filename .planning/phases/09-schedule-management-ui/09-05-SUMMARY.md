---
phase: 09-schedule-management-ui
plan: 05
type: execution
completed: 2026-01-27
duration: 8 min
subsystem: schedule-ui
tags: [react, netatmo, manual-override, ui-integration, navigation]

requires:
  - 09-02-PLAN.md (WeeklyTimeline component)
  - 09-03-PLAN.md (ScheduleSelector)
  - 09-04-PLAN.md (ManualOverrideSheet)
  - 06-01-PLAN.md (schedules API)
  - 06-02-PLAN.md (setroomthermpoint API)

provides:
  - ActiveOverrideBadge component
  - Schedule page with integrated override UI
  - Navigation link from thermostat to schedule

affects:
  - 10-01-PLAN.md (deployment includes schedule management UI)

tech-stack:
  added: []
  patterns:
    - "Badge UI pattern for active overrides"
    - "Confirmation dialog for destructive actions"
    - "Cross-page navigation with contextual links"

key-files:
  created:
    - app/schedule/components/ActiveOverrideBadge.js
  modified:
    - app/schedule/page.js
    - app/thermostat/page.js
    - lib/hooks/useRoomStatus.js
    - lib/netatmoApi.js
    - app/api/netatmo/homestatus/route.js

decisions:
  - id: active-override-badge-cancel
    choice: "Tap badge opens confirmation dialog"
    rationale: "Prevents accidental cancellation while providing quick access"
    alternatives:
      - "Direct cancel without confirmation (too risky)"
      - "Separate cancel button (clutters UI)"
  - id: endtime-api-enhancement
    choice: "Update homestatus API to include endtime field"
    rationale: "Badge needs endtime to calculate remaining time and display end time"
    alternatives:
      - "Poll API repeatedly (inefficient)"
      - "Display static 'active' status (poor UX)"
  - id: schedule-navigation-placement
    choice: "Schedule link positioned before StoveSyncPanel"
    rationale: "Logical grouping: schedule → sync → rooms"
    alternatives:
      - "After StoveSyncPanel (less logical)"
      - "In header/navbar (less discoverable)"

commits:
  - hash: 0084027
    message: "feat(09-05): create ActiveOverrideBadge component for manual override display"
    files:
      - app/schedule/components/ActiveOverrideBadge.js
      - lib/hooks/useRoomStatus.js
      - lib/netatmoApi.js
      - app/api/netatmo/homestatus/route.js
  - hash: be70e29
    message: "feat(09-05): integrate ManualOverrideSheet and active override badges"
    files:
      - app/schedule/page.js
  - hash: dbf7dbd
    message: "feat(09-05): add schedule navigation link to thermostat page"
    files:
      - app/thermostat/page.js
---

# Phase 09 Plan 05: Active Override Badge & Navigation Integration Summary

**One-liner:** Visual feedback for active manual overrides with tap-to-cancel, plus schedule navigation from thermostat page

## What Was Built

Completed the schedule UI with visual feedback for active manual temperature overrides, cancellation flow, and cross-page navigation.

### ActiveOverrideBadge Component
- Displays temperature, room name, and remaining time
- Shows "fino alle HH:mm" with Italian locale formatting
- Tap opens ConfirmDialog for cancellation
- Cancel sends `mode: 'home'` to setroomthermpoint API
- Loading state during cancellation
- Auto-hides when no override active (`mode !== 'manual'`)

### Schedule Page Integration
- Added `useRoomStatus` hook to fetch room status
- Filter rooms with `mode === 'manual'` for active overrides
- Display ActiveOverrideBadge for each active override
- Boost button opens ManualOverrideSheet (removed TODO)
- Refetch both rooms and schedules after override created/cancelled

### Thermostat Page Navigation
- Schedule Management card with Calendar icon
- Link navigates to `/schedule` page
- Hover effects on card and button
- Positioned before StoveSyncPanel for logical flow

### API Enhancement
- Updated `extractTemperatures` in netatmoApi.js to include `endtime`
- Updated homestatus route to pass `endtime` field to frontend
- Updated useRoomStatus hook to include `endtime` in room data

## Technical Approach

### Badge UI Pattern
```javascript
// Badge shows override info
<button onClick={openConfirm} className="bg-ember-500/20">
  <Flame /> {temp}°C • {roomName}
  <Clock /> fino alle {formatTime(endtime)}
  <X /> {/* Cancel indicator */}
</button>

// Confirmation prevents accidental cancellation
<ConfirmDialog
  title="Annulla Override"
  message="Vuoi tornare alla programmazione normale?"
  onConfirm={cancelOverride}
/>
```

### Data Flow
1. useRoomStatus fetches homestatus API (includes endtime for manual overrides)
2. Filter rooms with `mode === 'manual'`
3. ActiveOverrideBadge displays each override
4. Tap → ConfirmDialog → POST to setroomthermpoint with `mode: 'home'`
5. Refetch rooms and schedules to update UI

### Cross-Page Navigation
- Link component from Next.js for client-side navigation
- Card UI with hover effect for visual feedback
- Calendar icon for schedule context
- "Apri →" button with hover color change

## Implementation Details

### Task 1: ActiveOverrideBadge Component
- Created `app/schedule/components/ActiveOverrideBadge.js`
- Props: `room` (with id, name, setpoint, endtime, mode), `onCancelled` callback
- Calculates remaining minutes: `(endtime * 1000 - Date.now()) / 60000`
- Format time with date-fns Italian locale
- ConfirmDialog with warning variant and loading state

### Task 2: Schedule Page Integration
- Import ManualOverrideSheet and ActiveOverrideBadge
- Add useRoomStatus hook
- Filter `rooms.filter(r => r.mode === 'manual')`
- Display "Override Attivi" section when overrides exist
- Map over roomsWithOverride to show badges
- Update Boost button to `setShowOverrideSheet(true)`
- ManualOverrideSheet at bottom with state management

### Task 3: Thermostat Navigation
- Import Link and Calendar from lucide-react
- Create Card with Link wrapper
- Icon in colored background (ember-500/20)
- Heading "Programmazione" with description
- Ghost button "Apri →" with hover effect
- Position before StoveSyncPanel

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added endtime field to API responses**
- Found during: Task 1 (ActiveOverrideBadge needs endtime)
- Issue: homestatus API didn't return endtime for manual overrides
- Fix: Updated extractTemperatures in netatmoApi.js to include `therm_setpoint_end_time`
- Fix: Updated homestatus route to pass endtime to frontend
- Fix: Updated useRoomStatus to include endtime in room data
- Files modified: lib/netatmoApi.js, app/api/netatmo/homestatus/route.js, lib/hooks/useRoomStatus.js
- Commit: 0084027

**Rationale:** Badge must show remaining time and end time. Without endtime from API, badge would show generic "Override attivo" instead of "fino alle 14:30", degrading UX. This is critical functionality, not optional enhancement.

## Test Coverage

### Integration Tests Performed
1. Manual override creation via ManualOverrideSheet
2. Badge appears with correct temperature, room name, time
3. Tap badge opens confirmation dialog
4. Cancel override sends API request and hides badge
5. Multiple overrides display as separate badges
6. Navigation from thermostat to schedule works
7. Back button from schedule returns to thermostat

### Edge Cases Handled
- No endtime (displays "Override attivo" fallback)
- Override expired (remainingMinutes clamped to 0)
- Cancel fails (keeps dialog open, shows error in console)
- Zero overrides (section hidden, no badges displayed)

## Performance Characteristics

- Badge component lightweight (< 5KB)
- No additional API calls (uses existing useRoomStatus)
- ConfirmDialog lazy-rendered (only when showConfirm true)
- Navigation uses Next.js Link (client-side, instant)

## Dependencies

- Existing: ManualOverrideSheet (09-04)
- Existing: useRoomStatus hook
- Existing: ConfirmDialog UI component
- Existing: setroomthermpoint API (06-02)
- Enhancement: homestatus API endtime field

## Next Phase Readiness

**Phase 10 (Deployment & Documentation):**
- Schedule UI complete and functional
- All Phase 9 plans executed (05/04 complete)
- Ready for production deployment
- Documentation can reference complete schedule workflow

**No blockers identified.**

## Learnings

1. **API enhancement during UI development is common:** Badge needed endtime, which wasn't initially exposed. Auto-fixed per deviation Rule 2 (missing critical functionality).

2. **Cross-page navigation improves discoverability:** Schedule link on thermostat page provides natural entry point. Users discover schedule management without navigating through menu.

3. **Confirmation dialogs prevent accidental actions:** Tap-to-cancel badge could lead to mistakes. Confirmation adds friction but protects user intent.

4. **Refetch both related data sources:** After override created/cancelled, refetch both rooms (for badges) AND schedules (for timeline consistency).

---

**Duration:** 8 minutes
**Tasks:** 3/3 complete
**Commits:** 3 commits
**Files created:** 1
**Files modified:** 5
**Status:** ✅ Complete - Schedule UI fully integrated
