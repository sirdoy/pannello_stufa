---
status: resolved
trigger: "StoveCard.tsx shows console warning '[StoveCard] Firebase disconnected, activating polling fallback' on every page load. The warning fires from a useEffect cleanup/unsubscribe at line 306."
created: 2026-02-10T10:30:00Z
updated: 2026-02-10T10:50:00Z
---

## Current Focus

hypothesis: CONFIRMED - Firebase `.info/connected` starts as false on mount, triggering false warning
test: Implement fix with isFirstConnection ref to skip initial false value
expecting: Warning only fires on actual disconnections, not initial mount
next_action: Apply fix to StoveCard.tsx

## Symptoms

expected: StoveCard should connect to Firebase RTDB without showing disconnection warnings. No warning should appear.
actual: Console warning "[StoveCard] Firebase disconnected, activating polling fallback" appears on every page load.
errors: StoveCard.tsx:306 [StoveCard] Firebase disconnected, activating polling fallback
  StoveCard.useEffect.unsubscribe @ StoveCard.tsx:306
  StoveCard.useEffect @ StoveCard.tsx:301
  "use client"
  <anonymous> @ page.tsx:63
  Array.map @ VM887 <anonymous>:1
  Home @ page.tsx:53
  <Home>
  Promise.all @ VM887 <anonymous>:1
reproduction: Happens on every page load consistently
timeline: Not sure when it started

## Eliminated

## Evidence

- timestamp: 2026-02-10T10:35:00Z
  checked: StoveCard.tsx lines 297-318 (Firebase connection monitoring)
  found: useEffect monitors `.info/connected` ref, onValue callback fires on every value change
  implication: Firebase `.info/connected` starts as `false` before connection establishes, triggering the warning

- timestamp: 2026-02-10T10:36:00Z
  checked: StoveCard.tsx line 306
  found: console.warn fires immediately when `connected === false`
  implication: No guard to prevent warning on initial mount before connection established

- timestamp: 2026-02-10T10:45:00Z
  checked: Fix implementation
  found: Added `isFirstConnectionRef` to track first connection callback, modified logic to skip warning if !connected && isFirstConnectionRef.current
  implication: Warning will only fire on actual disconnections, not initial mount

## Resolution

root_cause: Firebase `.info/connected` starts as `false` on initial mount before connection establishes. The useEffect at line 297-318 doesn't distinguish between initial mount (expected false) and actual disconnection (unexpected false). This causes console.warn to fire on every page load.
fix: Add `isFirstConnectionRef` to track if this is the first connection callback. Skip warning on initial false value, only warn on subsequent false values (actual disconnects).
verification: Code review confirms logic: isFirstConnectionRef starts as true, prevents warning on first false callback, gets set to false on first connected=true callback. Subsequent disconnections will trigger warning correctly.
files_changed: ['/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/stove/StoveCard.tsx']
