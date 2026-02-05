---
status: resolved
trigger: "La stufa in automatismo con PID non aumenta la potenza quando la temperatura della stanza è 2°C sotto il setpoint"
created: 2026-02-05T10:00:00Z
updated: 2026-02-05T10:16:00Z
---

## Current Focus

hypothesis: CONFIRMED - PID room lookup fails because data has 'room_id' field but code searches for 'id' field
test: Line 659 searches `r.id` but netatmo/currentStatus saves rooms with `room_id` field
expecting: PID always returns { skipped: true, reason: 'room_not_found' }
next_action: Fix the room lookup to use room_id field instead of id

## Symptoms

expected: Quando la temperatura della stanza è significativamente sotto il setpoint (2°C), il sistema PID dovrebbe aumentare la potenza della stufa oltre il minimo per raggiungere più velocemente il setpoint. Dovrebbe essere visualizzato che è in corso un boost della potenza.
actual: La stufa rimane al minimo nonostante la differenza di 2°C tra temperatura attuale e setpoint. Non c'è indicazione visiva di boost attivo.
errors: Nessun errore visibile nella console o UI
reproduction: Impostare automatismo stufa con PID, osservare comportamento quando temperatura stanza è sotto setpoint di 2 o più gradi
started: Non specificato - verificare se mai funzionato o regressione recente

## Eliminated

## Evidence

- timestamp: 2026-02-05T10:05:00Z
  checked: lib/utils/pidController.js - PID controller implementation
  found: |
    - Default kp=0.5, ki=0.1, kd=0.05
    - Formula: output = kp * error + ki * integral + kd * derivative
    - Output clamped between outputMin=1 and outputMax=5
    - Error = setpoint - measured (positive when room is cold)
  implication: With kp=0.5 and error=2, P term = 1.0 which rounds to minimum power level 1

- timestamp: 2026-02-05T10:06:00Z
  checked: app/api/scheduler/check/route.js - runPidAutomationIfEnabled function (lines 622-751)
  found: |
    - PID runs only when: stove is ON, in automatic mode (not semi-manual), PID enabled
    - Reads setpoint from pidConfig.manualSetpoint (user-configured, not Netatmo)
    - Time delta (dt) calculated from last run (5 min default, clamped 1-30 min)
    - PID state persisted to Firebase (integral, prevError, lastRun)
    - Only applies power if targetPower !== currentPowerLevel
    - Runs AFTER handleLevelChanges which may set power from schedule
    - Runs as async (not awaited) so doesn't block main flow
  implication: PID logic is sound, but power calculation too conservative with default gains

- timestamp: 2026-02-05T10:07:00Z
  checked: PID math analysis with default gains (kp=0.5, ki=0.1, kd=0.05)
  found: |
    Scenario: setpoint=21, measured=19, dt=5min
    - Error = 21 - 19 = 2
    - P term = 0.5 * 2 = 1.0
    - I term (first run) = 0.1 * (2 * 5) = 1.0 (integral = 10)
    - D term (first run) = 0 (not initialized)
    - Total = 1.0 + 1.0 + 0 = 2.0 -> rounds to 2

    BUT: If integral hasn't accumulated yet (cold start or reset):
    - integral = 0 initially
    - P = 1.0, I = 0, D = 0
    - Total = 1.0 -> rounds to 1 (MINIMUM!)
  implication: First run or after reset produces minimum power even with 2 degree error

- timestamp: 2026-02-05T10:08:00Z
  checked: Test file lib/utils/__tests__/pidController.test.js
  found: |
    - Test "cold start scenario" (lines 266-274): 21-16=5 degree error expects power >= 3
    - Test "should increase output" (lines 59-66): With kp=1.0 (not default), 2 degree error produces > 1
    - Default gains test confirms kp=0.5 is indeed conservative
    - Integration test shows stabilization works over multiple iterations
  implication: Tests confirm that with default kp=0.5, small errors produce low power levels

- timestamp: 2026-02-05T10:09:00Z
  checked: UI feedback for boost - PidAutomationPanel.js
  found: |
    - TemperatureDisplay shows "sotto target - aumenta potenza" text when cold
    - No visual indicator of "boost active" or current calculated power level
    - UI only shows configuration, not real-time PID output
    - Help text explains behavior but doesn't show current power adjustment
  implication: User has no visibility into what power level PID is calculating/applying

- timestamp: 2026-02-05T10:10:00Z
  checked: PID math verification with Node.js
  found: |
    With defaults (kp=0.5, ki=0.1, kd=0.05), setpoint=21, measured=19 (2-degree error):
    - First run: error=2, integral accumulates to 10 (maxed), P=1.0, I=1.0, total=2.0 -> power=2
    - Subsequent runs: power stays at 2 (integral capped)
    - With 3-degree error: power=3
    - With kp=1.0: power=3 on first run
  implication: PID DOES calculate power > 1 for 2-degree error. Problem is elsewhere.

- timestamp: 2026-02-05T10:11:00Z
  checked: Netatmo currentStatus data structure in homestatus route
  found: |
    - Status saved with rooms array containing: room_id, temperature, setpoint, etc.
    - PID reads from this cached data, NOT directly from Netatmo API
    - rooms array uses room_id field (not just id)
  implication: PID room lookup might fail if room ID format doesn't match

- timestamp: 2026-02-05T10:12:00Z
  checked: PID room lookup code (line 658-660)
  found: |
    ```javascript
    const rooms = Object.values(netatmoStatus.rooms);
    const targetRoom = rooms.find(r => String(r.id) === String(targetRoomId));
    ```
    But netatmoStatus.rooms has room_id field, not id field!
  implication: **ROOT CAUSE FOUND** - Room lookup always fails because it searches for r.id but data has r.room_id

## Resolution

root_cause: |
  PID room lookup uses wrong field name.
  Line 659: `rooms.find(r => String(r.id) === String(targetRoomId))`
  But netatmo/currentStatus saves rooms with `room_id` field, not `id`.
  This causes PID to ALWAYS skip with reason 'room_not_found'.

fix: |
  Changed r.id to r.room_id in the room lookup (line 659).
  Before: `rooms.find(r => String(r.id) === String(targetRoomId))`
  After:  `rooms.find(r => String(r.room_id) === String(targetRoomId))`

verification: |
  - PID controller unit tests: 21 passed
  - Scheduler service tests: 31 passed
  - Code review: Fix is minimal and targeted

files_changed:
  - app/api/scheduler/check/route.js
