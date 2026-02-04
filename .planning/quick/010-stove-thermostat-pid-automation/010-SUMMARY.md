---
phase: quick
plan: 010
subsystem: automation
tags: [pid, temperature-control, stove, thermostat, netatmo]
dependency-graph:
  requires: [netatmo-integration, scheduler-cron]
  provides: [pid-automation, temperature-feedback-control]
  affects: [stove-power-control, scheduler-behavior]
tech-stack:
  added: []
  patterns: [pid-controller, firebase-per-user-config, cron-integration]
key-files:
  created:
    - lib/utils/pidController.js
    - lib/utils/__tests__/pidController.test.js
    - lib/services/pidAutomationService.js
    - app/components/netatmo/PidAutomationPanel.js
    - app/settings/thermostat/page.js
  modified:
    - app/api/scheduler/check/route.js
decisions:
  - id: pid-gains-default
    choice: "kp=0.5, ki=0.1, kd=0.05 as conservative defaults"
    rationale: "Heating systems have thermal mass; aggressive gains cause oscillation"
  - id: pid-state-persistence
    choice: "Store integral/prevError in Firebase at pidAutomation/state"
    rationale: "Maintain PID state across cron runs for integral action"
  - id: async-pid-execution
    choice: "Run PID async without blocking main cron flow"
    rationale: "Match pattern of other cron tasks; prevent blocking on PID failures"
metrics:
  duration: ~4.5 min
  completed: 2026-02-04
---

# Quick Task 010: Stove-Thermostat PID Automation

PID controller for automatic stove power adjustment based on temperature feedback.

## One-liner

PID automation adjusts stove power (1-5) based on room temperature vs thermostat setpoint, with configurable gains and Firebase persistence.

## What was delivered

### 1. PID Controller Utility (`lib/utils/pidController.js`)

A pure, reusable PID controller class with:
- Configurable gains: kp (proportional), ki (integral), kd (derivative)
- Output clamping to stove power range (1-5)
- Anti-windup for integral term (integralMax)
- State persistence via getState()/setState()
- Factory function createPIDController() for convenience
- 21 comprehensive unit tests

**Key implementation:**
```javascript
// PID formula: output = kp * error + ki * integral + kd * derivative
const pid = new PIDController({ kp: 0.5, ki: 0.1, kd: 0.05 });
const targetPower = pid.compute(setpoint, measured, dt);
```

### 2. PID Automation Service (`lib/services/pidAutomationService.js`)

Firebase service for per-user PID configuration:
- Path: `users/${userId}/pidAutomation`
- Functions: getPidConfig(), setPidConfig(), subscribeToPidConfig()
- Default config with conservative gains
- Real-time subscription support

### 3. Scheduler Cron Integration (`app/api/scheduler/check/route.js`)

New `runPidAutomationIfEnabled()` function:
- Checks preconditions: stove ON, auto mode, PID enabled
- Reads target room temperature from Netatmo cache
- Calculates dt from last run timestamp
- Restores/saves PID state in Firebase
- Adjusts power level when needed
- Runs async without blocking main flow

**Skip conditions:**
- `stove_off` - Stove not running
- `not_auto_mode` - Manual or semi-manual scheduler mode
- `pid_disabled` - User hasn't enabled PID
- `no_target_room` - No room selected
- `no_temperature_data` - Temperature unavailable

### 4. Settings UI (`app/settings/thermostat/page.js`)

New thermostat settings page with PidAutomationPanel:
- Master toggle to enable/disable
- Room selector dropdown (from Netatmo)
- Temperature display (current vs setpoint)
- Advanced settings (collapsible) for PID gains
- Save/Cancel with change tracking
- Follows Ember Noir design system

## Commits

| Hash | Message |
|------|---------|
| 1c2c559 | feat(quick-010): create PID controller utility and automation service |
| 6a9343d | feat(quick-010): integrate PID automation into scheduler cron |
| 707fcb1 | feat(quick-010): create PID automation settings panel and thermostat page |

## Testing

- Unit tests: 21 tests passing for PIDController
- Integration: PID runs async in cron, logs skip reasons or adjustments
- Manual: Enable in /settings/thermostat, verify cron logs

## How to use

1. Navigate to `/settings/thermostat`
2. Enable "Automazione PID Stufa-Termostato"
3. Select target room (e.g., Soggiorno)
4. Save configuration
5. When stove is ON in automatic mode, power adjusts toward setpoint

## Deviations from Plan

None - plan executed exactly as written.

## Next Steps

- Monitor PID behavior in production logs
- Tune gains if oscillation observed
- Consider adding PID history/stats display
