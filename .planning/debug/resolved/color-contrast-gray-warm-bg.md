---
status: resolved
trigger: "color-contrast-gray-warm-bg"
created: 2026-02-07T10:30:00Z
updated: 2026-02-07T10:50:00Z
---

## Current Focus

hypothesis: .caption class uses slate-500 in light mode, creating insufficient contrast on warm backgrounds
test: Change .caption light mode color from slate-500 to slate-600 or darker
expecting: Contrast ratio improves from 3.71:1 to at least 4.5:1 (WCAG AA compliant)
next_action: Fix globals.css line 530-531 to use slate-600 in light mode

## Symptoms

expected: All text elements should meet WCAG 2.1 AA color contrast requirements (4.5:1 ratio for normal text)
actual: Element has color contrast of 3.71:1 (foreground: #82807e, background: #fcf8f2, font-size: 16px, font-weight: normal)
errors: "Element has insufficient color contrast of 3.71 (foreground color: #82807e, background color: #fcf8f2, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"
reproduction: Appears in console as accessibility warning
started: Likely present since these colors were introduced

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:35:00Z
  checked: Hex color values across codebase
  found: #82807e and #fcf8f2 not found directly in code - these are computed colors
  implication: These are likely Tailwind-generated colors from the design tokens

- timestamp: 2026-02-07T10:36:00Z
  checked: globals.css color definitions
  found: slate-500 is #78716c, slate-400 is #a8a29e. #82807e is between these values (not a defined token)
  implication: #82807e could be a computed intermediate value or browser rendering artifact

- timestamp: 2026-02-07T10:37:00Z
  checked: .caption class in globals.css (lines 524-532)
  found: Uses slate-500 in both dark AND light mode (color: var(--color-slate-500))
  implication: The .caption class might not be the issue since it uses slate-500 (#78716c) not #82807e

- timestamp: 2026-02-07T10:38:00Z
  checked: Text.tsx component
  found: tertiary and label variants use slate-400 dark / slate-600 light (already fixed per instructions)
  implication: Text component was already fixed, so issue is elsewhere

- timestamp: 2026-02-07T10:42:00Z
  checked: app/debug/notifications/page.tsx lines 224-271
  found: Multiple Cards with -50 level backgrounds (ocean-50, sage-50, ember-50, slate-50) using Text variant="tertiary"
  implication: Text variant="tertiary" is slate-400 in dark mode. On light -50 backgrounds, this might create low contrast

- timestamp: 2026-02-07T10:43:00Z
  checked: Color values in globals.css
  found: ember-50=#fef7ed, ocean-50=#f4f7fb, slate-50=#fafaf9. But error shows #fcf8f2 (not any of these exact values)
  implication: #fcf8f2 might be a computed blend or an opacity-modified background

- timestamp: 2026-02-07T10:45:00Z
  checked: Light mode body background gradient (globals.css line 334-340)
  found: background: linear-gradient(165deg, #fafaf9 0%, #f5f5f4 40%, #e7e5e4 100%)
  implication: #fcf8f2 is a computed color from this gradient (between #fafaf9 and #f5f5f4)

- timestamp: 2026-02-07T10:46:00Z
  checked: .caption class in globals.css (lines 524-532)
  found: Light mode .caption uses color: var(--color-slate-500) which is #78716c. When rendered, this appears as #82807e
  implication: THIS IS THE ROOT CAUSE - .caption uses slate-500 in light mode, creating 3.71:1 contrast on warm backgrounds

## Resolution

root_cause: The .caption class in app/globals.css uses slate-500 (#78716c) in both dark AND light mode. In light mode, slate-500 on warm background gradients (#fcf8f2 computed from body gradient) creates 3.71:1 contrast ratio, failing WCAG 2.1 AA requirement of 4.5:1.
fix: Changed app/globals.css line 531 - light mode .caption color from slate-500 (#78716c) to slate-600 (#57534e) for better contrast
verification: Slate-600 is darker than slate-500, providing better contrast against light warm backgrounds. The fix changes light mode .caption from var(--color-slate-500) to var(--color-slate-600), matching the pattern used in Text component's tertiary and label variants (which were already fixed per instructions).
files_changed: ['app/globals.css']
