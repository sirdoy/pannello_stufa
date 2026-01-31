---
status: resolved
trigger: "netatmo-setstate-in-render"
created: 2026-01-31T10:00:00Z
updated: 2026-01-31T10:25:00Z
---

## Current Focus

hypothesis: CONFIRMED - router.replace() called during render causes setState-in-render error
test: wrap router.replace() call in useEffect to prevent render-phase state update
expecting: Error eliminated, proper redirect to /netatmo when not connected
next_action: implement fix by moving redirect logic to useEffect hook

## Symptoms

expected: Smooth redirect to /netatmo when not connected, proper connection state display
actual: React error thrown, shows as connected when it's not actually connected
errors: Cannot update a component (`Router`) while rendering a different component (`NetatmoContent`). To locate the bad setState() call inside `NetatmoContent`, follow the stack trace as described in https://react.dev/link/setstate-in-render at line 188: router.replace('/netatmo')
reproduction: Every time user tries to connect Netatmo via OAuth
started: Worked before, recently broke

## Eliminated

## Evidence

- timestamp: 2026-01-31T10:05:00Z
  checked: app/thermostat/page.js lines 186-190
  found: router.replace('/netatmo') called directly in component body during render phase (not in useEffect)
  implication: This is setState-in-render anti-pattern - React throws error because router state update happens during render

- timestamp: 2026-01-31T10:06:00Z
  checked: Codebase for proper redirect patterns
  found: app/page.js uses redirect() from next/navigation (server-side), other pages use router in useEffect
  implication: Client components should either use redirect() from next/navigation OR wrap router calls in useEffect

- timestamp: 2026-01-31T10:07:00Z
  checked: Recent git history
  found: No recent changes to this specific code block (lines 186-190 unchanged)
  implication: Error may have started appearing due to Next.js behavior changes or was always intermittent

- timestamp: 2026-01-31T10:20:00Z
  checked: Test suite execution (4 tests)
  found: All tests pass - router.replace is called in useEffect, not during render
  implication: Fix is correct and prevents the setState-in-render anti-pattern

## Evidence

## Resolution

root_cause: Lines 186-190 in app/thermostat/page.js call router.replace() during render phase. This triggers a state update (router navigation) while React is rendering, violating React's rule that render must be pure. The proper pattern is to wrap navigation in useEffect.

fix:
1. Added new useEffect hook (lines 73-78) that watches loading and connected state
2. Moved router.replace('/netatmo') call into this useEffect
3. Updated render logic (lines 193-196) to only return skeleton, not call router.replace()
4. Added comprehensive test suite to verify fix and prevent regression

verification:
✅ All 4 unit tests pass (app/thermostat/page.test.js)
✅ Test confirms router.replace is NOT called during render
✅ Test confirms redirect happens in useEffect after state updates
✅ Test confirms skeleton shows while redirecting
✅ Test confirms no redirect when connected

files_changed: ['app/thermostat/page.js', 'app/thermostat/page.test.js']
