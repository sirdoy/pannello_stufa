---
phase: quick-008
plan: 01
subsystem: thermostat
tags: [thermostat, ui-refinement, filter, active-devices]
requires: [quick-007]
provides: ["Filtered active devices display", "Contextual section visibility"]
affects: []
tech-stack:
  added: []
  patterns: ["Conditional rendering", "Filter-first approach"]
key-files:
  created: []
  modified: ["app/components/devices/thermostat/ThermostatCard.js"]
decisions:
  - context: "Active devices section display"
    decision: "Show only heating or demanding devices (setpoint > temp)"
    rationale: "Reduce visual noise by hiding standby devices"
    alternatives: ["Show all with different styling", "Collapsible section"]
  - context: "Section visibility"
    decision: "Hide entire section when no active devices"
    rationale: "Clean UI when nothing is heating"
    alternatives: ["Show empty state", "Always show with message"]
metrics:
  duration: "0.7 min"
  completed: "2026-02-04"
---

# Quick Task 008: Active Devices Filter Only

**One-liner:** Filter "Dispositivi Attivi" section to show only actively heating rooms (heating=true OR setpoint > temperature), hiding the entire section when empty

## Objective

Reduce visual noise in the ThermostatCard by showing only relevant active devices (currently heating or demanding heat) instead of displaying all devices including standby and offline ones.

## What Was Built

### Active Device Filtering
- **Filter logic**: `activeRooms = roomsWithStatus.filter(room => !room.isOffline && (room.heating || room.setpoint > room.temperature))`
- **Conditional rendering**: Section only renders when `activeRooms.length > 0`
- **Simplified styling**: All displayed devices use ember/active styling (removed inactive/offline branches)

### Key Changes
1. **Added activeRooms filter** (line 151-156):
   - Excludes offline devices
   - Includes devices with `heating=true`
   - Includes devices with `setpoint > temperature` (demanding heat)

2. **Wrapped section in conditional** (line 468-469):
   - `{activeRooms.length > 0 && (...section...)}`
   - Entire "Dispositivi Attivi" section hidden when no active devices

3. **Simplified badge rendering**:
   - Removed `isActive` calculation inside map (all are active by definition)
   - Removed offline styling branch (offline filtered out)
   - Removed standby styling branch (standby filtered out)
   - All badges use ember styling with pulse animation

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Filter active devices and conditionally render section | 66b2bb6 | ThermostatCard.js |

## Technical Details

### Filter Logic
```javascript
const activeRooms = roomsWithStatus.filter(room => {
  if (room.isOffline) return false;
  return room.heating === true ||
         (room.setpoint && room.temperature && room.setpoint > room.temperature);
});
```

### Before vs After
**Before:**
- Showed all rooms (active, standby, offline)
- Different styling for each state (ember, slate, gray)
- Section always visible even when no activity

**After:**
- Shows only heating or demanding rooms
- All badges use ember/active styling
- Section hidden when no active devices
- Cleaner, more contextual display

## Decisions Made

| Context | Decision | Rationale |
|---------|----------|-----------|
| Active criteria | Include setpoint > temperature | Room demanding heat is "active" even if not heating yet |
| Offline devices | Exclude from active list | Cannot be active if unreachable |
| Empty state | Hide entire section | Cleaner than showing empty section |
| Badge styling | Uniform ember styling | All displayed are active, simplifies code |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

**Manual verification steps:**
1. When no devices heating (all `heating=false` AND `setpoint <= temperature`) → "Dispositivi Attivi" section not visible ✓
2. When at least one device heating → only active devices shown with ember styling ✓
3. Offline devices never appear in section ✓
4. Pulse animation dot appears on all displayed badges ✓

## Impact

### User Experience
- **Reduced noise**: Standby and offline devices no longer clutter the view
- **Contextual display**: Section appears only when relevant
- **Visual clarity**: All displayed devices use consistent active styling

### Code Quality
- **Simpler logic**: Removed conditional styling branches inside map
- **Filter-first**: Better separation of concerns (filter data, then render)
- **Maintainable**: Easier to understand what "active devices" means

## Next Phase Readiness

**Ready for next quick tasks or Phase 32 (Action Components).**

### No blockers
- Quick task 008 complete
- ThermostatCard behavior refined
- Ready for further UI enhancements

### Notes
- Consider applying similar filter-first pattern to other device lists
- Could add empty state message if desired in future (currently just hides)
- Pattern works well with existing stove sync badges and heating indicators

## Related Artifacts

- **Previous**: quick-007 (Thermostat active devices list - added the section)
- **Modified**: app/components/devices/thermostat/ThermostatCard.js
- **Documentation**: /docs/architecture.md, /docs/api-routes.md
