---
quick: 006
type: execute
files_modified:
  - lib/__tests__/netatmoApi.test.js
  - app/api/netatmo/setroomthermpoint/__tests__/route.test.js
  - app/api/netatmo/setthermmode/__tests__/route.test.js
autonomous: true

must_haves:
  truths:
    - "setRoomThermpoint API correctly formats temperature as float"
    - "setThermMode API validates mode enum (schedule, away, hg, off)"
    - "setroomthermpoint route validates required fields (room_id, mode)"
    - "setroomthermpoint route requires temp for manual mode"
    - "setthermmode route validates mode enum"
    - "All Netatmo control commands use correct URL encoding"
  artifacts:
    - path: "lib/__tests__/netatmoApi.test.js"
      provides: "Unit tests for Netatmo API wrapper control functions"
    - path: "app/api/netatmo/setroomthermpoint/__tests__/route.test.js"
      provides: "Integration tests for setroomthermpoint route"
    - path: "app/api/netatmo/setthermmode/__tests__/route.test.js"
      provides: "Integration tests for setthermmode route"
---

<objective>
Verify and test all Netatmo thermostat and valve control commands to ensure they work correctly.

Purpose: Catch any API issues before production use, especially around temperature setpoints and mode changes.
Output: Test suite covering setRoomThermpoint, setThermMode, and related control functions.
</objective>

<context>
@docs/api-routes.md
@lib/netatmoApi.js
@app/api/netatmo/setthermmode/route.js
@app/api/netatmo/setroomthermpoint/route.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create netatmoApi control functions unit tests</name>
  <files>lib/__tests__/netatmoApi.test.js</files>
  <action>
    Create unit tests for the Netatmo API wrapper control functions:

    1. Test `setRoomThermpoint`:
       - Verify temperature is converted to float (parseFloat)
       - Test with integer temp (21) -> should become 21.0
       - Test with decimal temp (21.5) -> should remain 21.5
       - Test with string temp ("21") -> should become 21.0
       - Verify correct endpoint URL (setroomthermpoint)
       - Verify params are sent via URLSearchParams (x-www-form-urlencoded)

    2. Test `setThermMode`:
       - Test with valid modes: schedule, away, hg, off
       - Verify correct endpoint URL (setthermmode)
       - Verify params include home_id and mode
       - Test optional endtime parameter (for away/hg modes)

    3. Test `switchHomeSchedule`:
       - Verify params: home_id, schedule_id
       - Verify correct endpoint (switchhomeschedule)

    Mock fetch globally to simulate Netatmo API responses.
    Use pattern from existing tests (__tests__/lib/netatmoCameraApi.test.js).

    Important: Mock fetch at module level before imports:
    ```javascript
    const mockFetch = jest.fn();
    global.fetch = mockFetch;
    ```
  </action>
  <verify>npm test -- lib/__tests__/netatmoApi.test.js --passWithNoTests</verify>
  <done>All netatmoApi control function tests pass</done>
</task>

<task type="auto">
  <name>Task 2: Create setroomthermpoint route tests</name>
  <files>app/api/netatmo/setroomthermpoint/__tests__/route.test.js</files>
  <action>
    Create integration tests for the setroomthermpoint API route:

    1. Mock dependencies:
       - @/lib/core (withAuthAndErrorHandler, success, badRequest, etc.)
       - @/lib/firebaseAdmin (adminDbGet, adminDbPush)
       - @/lib/netatmoApi (NETATMO_API.setRoomThermpoint)
       - @/lib/auth0 (auth0.getSession)
       - @/lib/netatmo/tokenHelper (getValidAccessToken)

    2. Test cases:
       - 401 when not authenticated
       - 400 when room_id missing
       - 400 when mode missing
       - 400 when mode invalid (not in: manual, home, max, off)
       - 400 when mode=manual but temp missing
       - 400 when home_id not found in Firebase
       - 200 success with valid manual mode + temp
       - 200 success with home mode (no temp required)
       - Verify Firebase log is pushed on success

    Use pattern from app/api/hue/discover/__tests__/route.test.js
  </action>
  <verify>npm test -- app/api/netatmo/setroomthermpoint/__tests__/route.test.js --passWithNoTests</verify>
  <done>All setroomthermpoint route tests pass</done>
</task>

<task type="auto">
  <name>Task 3: Create setthermmode route tests</name>
  <files>app/api/netatmo/setthermmode/__tests__/route.test.js</files>
  <action>
    Create integration tests for the setthermmode API route:

    1. Mock dependencies (same as Task 2):
       - @/lib/core, @/lib/firebaseAdmin, @/lib/netatmoApi, @/lib/auth0

    2. Test cases:
       - 401 when not authenticated
       - 400 when mode missing
       - 400 when mode invalid (not in: schedule, away, hg, off)
       - 400 when home_id not found in Firebase
       - 200 success with schedule mode
       - 200 success with away mode + endtime
       - 200 success with hg (frost guard) mode
       - 200 success with off mode
       - Verify NETATMO_API.setThermMode called with correct params
       - Verify Firebase log is pushed on success

    Use same mocking pattern as Task 2.
  </action>
  <verify>npm test -- app/api/netatmo/setthermmode/__tests__/route.test.js --passWithNoTests</verify>
  <done>All setthermmode route tests pass</done>
</task>

</tasks>

<verification>
```bash
# Run all new Netatmo tests
npm test -- --testPathPattern="netatmo" --passWithNoTests

# Verify no regressions
npm test
```
</verification>

<success_criteria>
- All new tests pass
- setRoomThermpoint correctly handles temperature conversion
- setThermMode validates mode enum
- Route tests cover auth, validation, and success cases
- No test regressions in existing suite
</success_criteria>

<output>
After completion, create `.planning/quick/006-thermostat-valves-commands-check/006-SUMMARY.md`
</output>
