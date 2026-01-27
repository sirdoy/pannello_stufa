---
phase: 08-stove-thermostat-integration-correction
plan: 04b
type: execute
wave: 4
depends_on: ["08-04"]
files_modified:
  - lib/coordinationOrchestrator.js
  - __tests__/lib/coordinationOrchestrator.test.js
autonomous: true

must_haves:
  truths:
    - "Stove ON triggers setpoint boost (+configured °C) after 2-min debounce"
    - "Stove OFF restores previous setpoints (not schedule)"
    - "Manual changes pause automation with notification"
    - "Max setpoint capped at 30°C with notification"
    - "Notifications throttled to max 1 per 30 minutes globally"
    - "All coordination events logged to Firestore"
  artifacts:
    - path: "lib/coordinationOrchestrator.js"
      provides: "Main coordination logic orchestrating all services"
      exports: ["processCoordinationCycle", "applySetpointBoost", "restorePreviousSetpoints", "sendCoordinationNotification"]
  key_links:
    - from: "lib/coordinationOrchestrator.js"
      to: "lib/coordinationDebounce.js"
      via: "Debounce timer management"
      pattern: "handleStoveStateChange|startDebounceTimer"
    - from: "lib/coordinationOrchestrator.js"
      to: "lib/coordinationUserIntent.js"
      via: "Detect manual changes"
      pattern: "detectUserIntent"
    - from: "lib/coordinationOrchestrator.js"
      to: "lib/coordinationState.js"
      via: "State management"
      pattern: "getCoordinationState|updateCoordinationState"
    - from: "lib/coordinationOrchestrator.js"
      to: "lib/coordinationNotificationThrottle.js"
      via: "Notification deduplication"
      pattern: "shouldSendCoordinationNotification"
    - from: "lib/coordinationOrchestrator.js"
      to: "lib/netatmoStoveSync.js"
      via: "Boost mode and restoration"
      pattern: "setRoomsToBoostMode|restoreRoomSetpoints"
    - from: "lib/coordinationOrchestrator.js"
      to: "lib/notifications.js"
      via: "Send notifications via triggerMaintenanceAlertServer"
      pattern: "triggerMaintenanceAlertServer"
---

<objective>
Create the main coordination orchestrator that ties all services together.

Purpose: Implement the complete coordination workflow: detect stove state -> debounce -> check user intent -> apply/restore setpoints -> send throttled notifications. This is the "brain" that coordinates all Phase 8 components.

Output: coordinationOrchestrator.js as the main entry point with comprehensive tests.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/08-stove-thermostat-integration-correction/08-CONTEXT.md
@.planning/phases/08-stove-thermostat-integration-correction/08-RESEARCH.md
@.planning/phases/08-stove-thermostat-integration-correction/08-01-SUMMARY.md
@.planning/phases/08-stove-thermostat-integration-correction/08-02-SUMMARY.md
@.planning/phases/08-stove-thermostat-integration-correction/08-03-SUMMARY.md
@.planning/phases/08-stove-thermostat-integration-correction/08-04-SUMMARY.md
@lib/netatmoStoveSync.js
@lib/coordinationState.js
@lib/coordinationPreferences.js
@lib/coordinationDebounce.js
@lib/coordinationNotificationThrottle.js
@lib/coordinationUserIntent.js
@lib/coordinationPauseCalculator.js
@lib/notifications.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create processCoordinationCycle Function</name>
  <files>lib/coordinationOrchestrator.js, __tests__/lib/coordinationOrchestrator.test.js</files>
  <action>
Create `lib/coordinationOrchestrator.js` with the main coordination entry point.

Add import at top:
```javascript
import { triggerMaintenanceAlertServer } from './notifications.js';
```

**processCoordinationCycle(userId, stoveStatus, homeId)**
Main function called by cron endpoint every minute.

Flow:
```
1. Get coordination preferences (is it enabled?)
2. If not enabled: return early { action: 'skipped', reason: 'disabled' }

3. Get current coordination state

4. Check if automation is paused:
   - If paused and now > pausedUntil: clear pause
   - If paused and now <= pausedUntil: skip coordination { action: 'skipped', reason: 'paused' }

5. Determine stove state (ON = WORK/MODULATION, STARTING, OFF = others)

6. Detect user intent (compare current setpoints vs expected):
   - If manual change detected AND stove ON:
     - Calculate pause until next schedule slot
     - Update state: automationPaused = true, pausedUntil, pauseReason
     - Send notification (if throttle allows)
     - Return { action: 'paused', reason: 'user_intent', pausedUntil }

7. Handle stove state transitions:

   a. Stove transitioning to ON (STARTING -> WORK/MODULATION):
      - If pendingDebounce: check if timer should fire
      - If no pending debounce: start 2-min debounce timer via handleStoveStateChange
      - Debounce callback:
        - Call applySetpointBoost
        - Update state: stoveOn = true, pendingDebounce = false
        - Send notification (if throttle allows)
      - Return { action: 'debouncing', remainingMs }

   b. Stove transitioning to OFF during debounce:
      - Cancel debounce, start 30s retry timer via handleStoveStateChange
      - Return { action: 'retry_timer', remainingMs: 30000 }

   c. Stove confirmed OFF (no debounce pending):
      - Call restorePreviousSetpoints
      - Clear state: stoveOn = false, previousSetpoints = null
      - Send notification (if throttle allows)
      - Return { action: 'restored', restoredRooms }

   d. No state change:
      - Return { action: 'no_change' }
```

Create tests for processCoordinationCycle:
- Skips when coordination disabled
- Respects pause until pausedUntil
- Clears expired pause
- Detects user intent and pauses
- Starts debounce on stove ON
- Handles OFF during debounce (30s retry)
- Restores setpoints on stove OFF
  </action>
  <verify>Run `npm test -- __tests__/lib/coordinationOrchestrator.test.js` - processCoordinationCycle tests pass</verify>
  <done>processCoordinationCycle implements complete workflow state machine</done>
</task>

<task type="auto">
  <name>Task 2: Create applySetpointBoost and restorePreviousSetpoints Functions</name>
  <files>lib/coordinationOrchestrator.js, __tests__/lib/coordinationOrchestrator.test.js</files>
  <action>
Add helper functions to `lib/coordinationOrchestrator.js`.

**applySetpointBoost(userId, homeId, preferences)**
Applies boost to all configured zones:
1. Get zone configurations from preferences
2. Get previousSetpoints from coordination state (or empty object)
3. Build config for setRoomsToBoostMode
4. For each enabled zone, determine boost amount (zone.boost || preferences.defaultBoost)
5. Call setRoomsToBoostMode from netatmoStoveSync.js
6. Store updated previousSetpoints in coordination state
7. Return results with capped flags

Returns:
```javascript
{
  success: boolean,
  appliedRooms: [...],
  cappedRooms: [...],  // For 30°C notification
  previousSetpoints: {...},
}
```

**restorePreviousSetpoints(userId, homeId)**
Restores setpoints after stove OFF:
1. Get previousSetpoints from coordination state
2. Get zone configurations from preferences
3. Call restoreRoomSetpoints from netatmoStoveSync.js
4. Clear previousSetpoints from state via updateCoordinationState({ previousSetpoints: null })
5. Return results

Returns:
```javascript
{
  success: boolean,
  restoredRooms: [...],
}
```

Create tests:
- applySetpointBoost uses zone-specific boost amounts
- applySetpointBoost caps at 30°C
- applySetpointBoost stores previous setpoints in state
- restorePreviousSetpoints uses stored values
- restorePreviousSetpoints clears state after restore
  </action>
  <verify>Run `npm test -- __tests__/lib/coordinationOrchestrator.test.js` - boost/restore tests pass</verify>
  <done>applySetpointBoost and restorePreviousSetpoints orchestrate netatmoStoveSync functions with state management</done>
</task>

<task type="auto">
  <name>Task 3: Create sendCoordinationNotification Function</name>
  <files>lib/coordinationOrchestrator.js, __tests__/lib/coordinationOrchestrator.test.js</files>
  <action>
Add notification helper to `lib/coordinationOrchestrator.js`.

Import at top (already added in Task 1):
```javascript
import { triggerMaintenanceAlertServer } from './notifications.js';
```

**sendCoordinationNotification(userId, type, data)**
Handles throttled notification sending:
1. Check shouldSendCoordinationNotification from coordinationNotificationThrottle.js
2. If allowed:
   - Build notification message based on type
   - Send via triggerMaintenanceAlertServer(userId, { title, message, type: 'coordination_event' })
   - Call recordNotificationSent from coordinationNotificationThrottle.js
3. If blocked:
   - Skip notification
   - Return { sent: false, reason: 'global_throttle', waitSeconds }
4. Return { sent: boolean, reason: string|null }

Notification types and Italian messages:
- 'coordination_applied': "Boost +{X}°C applicato ({rooms})"
- 'coordination_restored': "Setpoint ripristinati ({rooms})"
- 'automation_paused': "Automazione in pausa fino alle {HH:MM}"
- 'max_setpoint_reached': "Setpoint limitato a 30°C ({rooms})"

Create tests:
- sendCoordinationNotification respects throttle
- sendCoordinationNotification calls triggerMaintenanceAlertServer when allowed
- sendCoordinationNotification records notification sent
- sendCoordinationNotification formats messages correctly
- sendCoordinationNotification returns throttle info when blocked
  </action>
  <verify>Run `npm test -- __tests__/lib/coordinationOrchestrator.test.js` - all tests pass</verify>
  <done>sendCoordinationNotification handles throttled sending via triggerMaintenanceAlertServer</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. `npm test -- __tests__/lib/coordinationOrchestrator.test.js` - All tests pass
2. Orchestrator correctly sequences: state check -> user intent -> debounce -> action -> notification
3. Boost mode respects 30°C cap
4. Setpoint restoration uses stored values (not schedule)
5. Notifications properly throttled (max 1 per 30 min)
6. All services properly integrated
</verification>

<success_criteria>
- coordinationOrchestrator.js created as main entry point
- Three main functions: processCoordinationCycle, applySetpointBoost, restorePreviousSetpoints
- sendCoordinationNotification with proper triggerMaintenanceAlertServer integration
- Complete workflow implemented per CONTEXT.md decisions
- All tests pass (expect ~15-18 new tests)
- Ready for cron endpoint integration in Plan 08-05
</success_criteria>

<output>
After completion, create `.planning/phases/08-stove-thermostat-integration-correction/08-04b-SUMMARY.md`
</output>
