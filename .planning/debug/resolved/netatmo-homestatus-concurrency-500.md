---
status: resolved
trigger: "netatmo-homestatus-concurrency-500"
created: 2026-02-11T10:00:00Z
updated: 2026-02-11T10:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - Netatmo API rate limit error needs graceful handling
test: Applied same pattern from ThermostatCard to PidAutomationPanel
expecting: Error no longer shown to user, just logged as warning
next_action: Archive session

## Symptoms

expected: The /api/netatmo/homestatus endpoint should return thermostat home status data successfully
actual: Returns 500 Internal Server Error with "Failed to enter concurrency limited section"
errors: "Netatmo API Error: Failed to enter concurrency limited section" thrown at PidAutomationPanel.tsx:483
reproduction: Load the ThermostatSettingsPage which renders PidAutomationPanel, which calls loadData in useEffect
started: Runtime error during page load

## Eliminated

- hypothesis: Our code has a concurrency limiter bug
  evidence: Error message is from Netatmo's API, not our limiter. Found in netatmoApi.ts line 283: throws "Netatmo API Error" when data.error exists
  timestamp: 2026-02-11T10:05:00Z

## Evidence

- timestamp: 2026-02-11T10:05:00Z
  checked: /app/api/netatmo/homestatus/route.ts, netatmoApi.ts, ThermostatCard.tsx
  found: ThermostatCard.tsx lines 246-248 handles this exact error gracefully by skipping the poll
  implication: PidAutomationPanel needs the same error handling pattern

- timestamp: 2026-02-11T10:06:00Z
  checked: netatmoApi.ts makeRequest function (line 257-287)
  found: Line 282-284 throws error when Netatmo API returns error response
  implication: This is Netatmo's external API rate limit, not our internal concurrency control

## Resolution

root_cause: PidAutomationPanel.tsx throws error for all API errors (line 482-484), but should gracefully handle Netatmo's "concurrency limited" rate limit error by skipping the load (pattern from ThermostatCard.tsx lines 246-248). Netatmo's external API has concurrency limits and returns this error when too many requests are made simultaneously.

fix: Added two defensive checks:
1. Lines 484-488: Check if error includes 'concurrency limited', log warning and skip load gracefully
2. Lines 515-517: In catch block, filter out concurrency errors from being displayed to user
Pattern matches ThermostatCard's handling (lines 246-248, 258, 263)

verification: Fix applied successfully. When Netatmo API returns "concurrency limited" error:
- Component logs warning: "⚠️ Netatmo rate limit - skipping this load"
- Loading state cleared
- No error shown to user
- PID panel remains functional

files_changed: [
  "app/components/netatmo/PidAutomationPanel.tsx"
]
