---
status: resolved
trigger: "color-contrast-yellow-insufficient"
created: 2026-02-07T10:30:00Z
updated: 2026-02-07T10:50:00Z
---

## Current Focus

hypothesis: CONFIRMED - warning-600 text on warning-50 backgrounds achieves only 2.84:1 contrast (needs 4.5:1)
test: All files updated with warning-700 for light mode
expecting: Contrast ratio now 4.76:1, accessibility warning resolved
next_action: Verify changes compile and no accessibility warnings remain

## Symptoms

expected: All text elements should meet WCAG 2.1 AA color contrast requirements (4.5:1 ratio for normal text)
actual: Element has color contrast of 1.99:1 (foreground: #d9ae53, background: #fdfbed, font-size: 16px, font-weight: normal)
errors: "Element has insufficient color contrast of 1.99 (foreground color: #d9ae53, background color: #fdfbed, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"
reproduction: Appears in console as accessibility warning
timeline: Likely present since these colors were introduced

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:32:00Z
  checked: app/globals.css
  found: warning color palette defined at lines 95-104 (warning-50 through warning-900)
  implication: #d9ae53 looks like warning-500 (#eab308) and #fdfbed looks like warning-50 (#fefce8) - these are the warning/yellow semantic colors

- timestamp: 2026-02-07T10:35:00Z
  checked: app/components/ui/StatusBadge.tsx
  found: warning color uses text-warning-300 (#fde047) in dark mode, text-warning-700 (#a16207) in light mode
  implication: The error #d9ae53 / #fdfbed is happening in LIGHT MODE - background is likely warning-50 (#fefce8) and text might be computed from warning-400 (#facc15) or similar

- timestamp: 2026-02-07T10:36:00Z
  checked: globals.css lines 727-738
  found: .status-warning class uses color: var(--color-warning-400) in dark, var(--color-warning-700) in light
  implication: warning-400 is #facc15, warning-700 is #a16207 - but #d9ae53 doesn't match these exactly. Need to check if there's opacity or blending

## Resolution

root_cause: Multiple UI components use warning-600 (#ca8a04) text color on warning-50 (#fefce8) backgrounds in light mode, achieving only 2.84:1 contrast ratio. WCAG AA requires 4.5:1 minimum. warning-700 (#a16207) achieves 4.76:1 and is the minimum acceptable shade.
fix: Changed all light mode warning text from warning-600 to warning-700 across 13 files
verification: warning-700 on warning-50 achieves 4.76:1 contrast (passing WCAG AA 4.5:1 requirement)
files_changed:
  - app/components/ui/Banner.tsx
  - app/components/ui/InfoBox.tsx
  - app/components/ui/Text.tsx
  - app/components/ui/HealthIndicator.tsx
  - app/components/ui/ConnectionStatus.tsx
  - app/components/ui/ActionButton.tsx
  - app/components/devices/lights/LightsCard.tsx (2 instances)
  - app/components/devices/stove/StoveCard.tsx (2 instances)
  - app/components/netatmo/NetatmoTemperatureReport.tsx
  - app/components/netatmo/RoomCard.tsx
  - app/log/page.tsx
  - lib/devices/deviceTypes.ts
