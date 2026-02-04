---
phase: quick
plan: 010
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/utils/pidController.js
  - lib/utils/__tests__/pidController.test.js
  - lib/services/pidAutomationService.js
  - app/api/scheduler/check/route.js
  - app/components/netatmo/PidAutomationPanel.js
  - app/settings/thermostat/page.js
autonomous: true
user_setup: []

must_haves:
  truths:
    - "PID controller calculates power adjustment based on temperature error"
    - "User can enable/disable PID automation from thermostat settings"
    - "When enabled and stove is ON in auto mode, power adjusts toward setpoint"
    - "PID state persists in Firebase at users/${userId}/pidAutomation"
  artifacts:
    - path: "lib/utils/pidController.js"
      provides: "Reusable PID controller utility"
      exports: ["PIDController", "createPIDController"]
    - path: "lib/services/pidAutomationService.js"
      provides: "PID automation Firebase service"
      exports: ["getPidConfig", "setPidConfig", "subscribeToPidConfig"]
    - path: "app/components/netatmo/PidAutomationPanel.js"
      provides: "UI toggle and configuration panel"
  key_links:
    - from: "app/api/scheduler/check/route.js"
      to: "lib/utils/pidController.js"
      via: "import and call in cron loop"
      pattern: "pidController"
    - from: "app/components/netatmo/PidAutomationPanel.js"
      to: "lib/services/pidAutomationService.js"
      via: "Firebase get/set operations"
      pattern: "getPidConfig|setPidConfig"
---

<objective>
Create stove-thermostat PID automation: when stove is ON in automatic scheduler mode, adjust stove power level based on living room temperature vs thermostat setpoint using a PID controller algorithm.

Purpose: Maintain target temperature automatically by increasing/decreasing stove power, eliminating manual adjustments.

Output:
- Reusable PID controller utility with tunable gains
- Firebase-persisted per-user configuration with on/off toggle
- Integration into existing scheduler cron job
- Settings UI panel for enabling/configuring the automation
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/api-routes.md
@docs/architecture.md
@lib/services/dashboardPreferencesService.js (Firebase per-user pattern)
@app/api/scheduler/check/route.js (cron integration point)
@app/api/netatmo/homestatus/route.js (temperature/setpoint source)
@app/components/netatmo/StoveSyncPanel.js (similar UI pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PID Controller Utility and Service</name>
  <files>
    lib/utils/pidController.js
    lib/utils/__tests__/pidController.test.js
    lib/services/pidAutomationService.js
  </files>
  <action>
1. Create `lib/utils/pidController.js` - a pure PID controller utility:
   - Export `PIDController` class with constructor accepting `{ kp, ki, kd, outputMin, outputMax, integralMax }`
   - Default gains: kp=0.5, ki=0.1, kd=0.05 (conservative for heating)
   - outputMin=1, outputMax=5 (stove power levels)
   - integralMax=10 (anti-windup)
   - Method `compute(setpoint, measured, dt)` returns power level (1-5)
   - Method `reset()` to clear integral/derivative state
   - Store previous error and integral sum internally
   - Export factory function `createPIDController(options)` for convenience

2. Create `lib/utils/__tests__/pidController.test.js`:
   - Test that output stays within bounds (1-5)
   - Test proportional response: error > 0 increases output
   - Test integral accumulation over time
   - Test reset() clears state
   - Test anti-windup (integral doesn't exceed integralMax)

3. Create `lib/services/pidAutomationService.js` following dashboardPreferencesService pattern:
   - Firebase path: `users/${userId}/pidAutomation`
   - Export `getPidConfig(userId)` - returns { enabled, targetRoomId, kp, ki, kd } or defaults
   - Export `setPidConfig(userId, config)` - saves config with updatedAt timestamp
   - Export `subscribeToPidConfig(userId, callback)` - real-time subscription
   - Default config: { enabled: false, targetRoomId: null, kp: 0.5, ki: 0.1, kd: 0.05 }
   - Use client-side Firebase (ref, onValue, set) like dashboardPreferencesService

Implementation notes:
- PID formula: output = kp * error + ki * integral + kd * derivative
- error = setpoint - measured (positive when too cold)
- integral += error * dt (with anti-windup clamp)
- derivative = (error - prevError) / dt
- Round output to nearest integer for stove power level
  </action>
  <verify>
    npm test -- lib/utils/__tests__/pidController.test.js
  </verify>
  <done>
    PID controller passes all tests, service exports match pattern from dashboardPreferencesService
  </done>
</task>

<task type="auto">
  <name>Task 2: Integrate PID into Scheduler Cron</name>
  <files>
    app/api/scheduler/check/route.js
  </files>
  <action>
Add PID automation to the scheduler cron job (after existing level changes handling):

1. Add imports at top:
   ```javascript
   import { PIDController } from '@/lib/utils/pidController';
   import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
   ```

2. Create helper function `async function runPidAutomationIfEnabled(isOn, currentPowerLevel)`:
   - Skip if stove is not ON (`!isOn`) - return { skipped: true, reason: 'stove_off' }
   - Skip if scheduler not in auto mode (semiManual or !enabled) - return { skipped: true, reason: 'not_auto_mode' }
   - Get ADMIN_USER_ID from env (single-user system)
   - Read PID config from Firebase: `users/${ADMIN_USER_ID}/pidAutomation`
   - Skip if `!config.enabled` - return { skipped: true, reason: 'pid_disabled' }
   - Read Netatmo current status from Firebase: `netatmo/currentStatus` (already cached by homestatus route)
   - Find target room by `config.targetRoomId` in `currentStatus.rooms`
   - Skip if room not found or no temperature - return { skipped: true, reason: 'no_temperature_data' }
   - Get `measured = room.temperature`, `setpoint = room.setpoint` (or config.targetSetpoint if no room setpoint)
   - Read PID state from Firebase: `pidAutomation/state` (integral, prevError, lastRun)
   - Calculate dt = (now - lastRun) / 60000 (minutes), default 1 if first run
   - Instantiate PIDController with config gains
   - Restore integral/prevError from state if exists
   - Call `pid.compute(setpoint, measured, dt)` to get target power
   - Compare with currentPowerLevel; if different, call `setPowerLevel(targetPower)` and log
   - Save new PID state to Firebase: { integral, prevError, lastRun: now }
   - Return { adjusted: true, from: currentPowerLevel, to: targetPower, temperature: measured, setpoint }

3. Call `runPidAutomationIfEnabled(isOn, currentPowerLevel)` in main handler:
   - Place after `handleLevelChanges()` call (around line 805)
   - Run async (don't await, don't block main flow) like calibrateValvesIfNeeded
   - Log result: `console.log('PID automation:', result)`

4. Add console logging for debugging:
   - Log when PID adjusts power: `console.log('🎯 PID: ${measured}°C -> ${setpoint}°C target, power ${from} -> ${to}')`
  </action>
  <verify>
    Run `npm run dev`, trigger cron manually via curl, check logs for PID output
  </verify>
  <done>
    Cron job calls PID controller when conditions met, power adjustments logged
  </done>
</task>

<task type="auto">
  <name>Task 3: Create PID Automation Settings Panel</name>
  <files>
    app/components/netatmo/PidAutomationPanel.js
    app/settings/thermostat/page.js
  </files>
  <action>
1. Create `app/components/netatmo/PidAutomationPanel.js` following StoveSyncPanel pattern:
   - Import: Card, Button, Banner, Skeleton, Heading, Text, Toggle from ui
   - Import: getPidConfig, setPidConfig, subscribeToPidConfig from pidAutomationService
   - Import: useUser from @auth0/nextjs-auth0/client
   - Import: useState, useEffect from react
   - Import: NETATMO_ROUTES from lib/routes

   Component structure:
   - Header with icon and title: "Automazione PID Stufa-Termostato"
   - Description: "Regola automaticamente la potenza della stufa per mantenere la temperatura target"
   - Master Toggle (like StoveSyncPanel) to enable/disable
   - When enabled, show:
     a) Room selector dropdown - fetch rooms from /api/netatmo/homestatus
     b) Current temperature display (from selected room)
     c) Target temperature info (uses room setpoint from Netatmo)
     d) Optional: Advanced settings (collapsed by default) for kp, ki, kd tuning
   - Save/Cancel buttons when changes detected
   - Info box explaining how it works:
     - "Quando abilitato e la stufa e in modalita automatica:"
     - "- Legge la temperatura della stanza selezionata"
     - "- Confronta con il setpoint del termostato"
     - "- Regola la potenza stufa (1-5) per raggiungere il target"
     - "- L'algoritmo PID evita oscillazioni eccessive"

2. Add panel to thermostat settings page `app/settings/thermostat/page.js`:
   - Check if page exists; if not, create it with basic structure
   - Import PidAutomationPanel
   - Add section after StoveSyncPanel (if present) or as main content
   - Wrap in standard settings page layout

UI Details:
- Use Toggle component (size="md", variant="ember")
- Use Skeleton for loading states
- Use Banner for error/success messages
- Room selector: simple `<select>` with Tailwind styling or custom dropdown
- Temperature display: large text like StoveSyncPanel temperature control
- Match Ember Noir design system (dark theme, ember accents)
  </action>
  <verify>
    Navigate to /settings/thermostat, toggle PID automation on/off, verify Firebase updates
  </verify>
  <done>
    User can enable PID automation from settings, config persists in Firebase
  </done>
</task>

</tasks>

<verification>
1. Unit tests pass: `npm test -- lib/utils/__tests__/pidController.test.js`
2. Manual test:
   - Enable PID automation in /settings/thermostat
   - Start stove in automatic mode
   - Verify cron logs show PID calculations
   - Verify power adjustments when temperature differs from setpoint
3. Toggle off - verify cron skips PID logic
</verification>

<success_criteria>
- PID controller is a reusable utility with tests
- Per-user Firebase config at `users/${userId}/pidAutomation`
- Cron job integrates PID when stove ON + auto mode + enabled
- Settings UI allows enable/disable and room selection
- Power adjustments logged in cron output
</success_criteria>

<output>
After completion, create `.planning/quick/010-stove-thermostat-pid-automation/010-SUMMARY.md`
</output>
