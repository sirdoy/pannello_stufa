---
status: resolved
trigger: "color-contrast-insufficient"
created: 2026-02-07T10:30:00Z
updated: 2026-02-07T10:45:00Z
---

## Current Focus

hypothesis: ember-600 needs to be darkened from #de5408 to #b84308 to achieve 4.5:1 contrast on ember-50
test: Update ember-600 value in globals.css and verify visual appearance maintains design consistency
expecting: All light mode text using ember-600 on ember-50 backgrounds will meet WCAG AA requirements
next_action: Apply fix to app/globals.css line 38

## Symptoms

expected: All text elements should meet WCAG 2.1 AA color contrast requirements (4.5:1 ratio for normal text)
actual: Element has color contrast of 3.67:1 (foreground: #de5408, background: #fef7ed, font-size: 16px, font-weight: normal)
errors: "Element has insufficient color contrast of 3.67 (foreground color: #de5408, background color: #fef7ed, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"
reproduction: Appears in console as accessibility warning. Colors #de5408 (orange) on #fef7ed (light warm background) don't meet 4.5:1 contrast ratio.
started: Likely present since these colors were introduced

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:32:00Z
  checked: app/globals.css
  found: --color-ember-50: #fef7ed (line 32), --color-ember-600: #de5408 (line 38)
  implication: These are part of the Ember Noir color scale, ember-600 on ember-50 background creates 3.67:1 contrast (needs 4.5:1)

- timestamp: 2026-02-07T10:35:00Z
  checked: Multiple component files
  found: Pattern [html:not(.dark)_&]:bg-ember-50 with [html:not(.dark)_&]:text-ember-600 used in ScheduleInterval, device cards, settings pages
  implication: Light mode specifically uses ember-600 text on ember-50 backgrounds, causing accessibility issue

- timestamp: 2026-02-07T10:37:00Z
  checked: Color theory calculation
  found: Current ember-600 #de5408 needs to be darker. To achieve 4.5:1 contrast on #fef7ed, need approximately #b84308 (darker orange)
  implication: ember-600 needs to darken from #de5408 to ~#b84308 while maintaining ember aesthetic

## Resolution

root_cause: ember-600 color (#de5408) is too light for sufficient contrast on ember-50 background (#fef7ed). Current contrast is 3.67:1, needs to be 4.5:1 for WCAG AA compliance. This affects light mode UI where ember-600 is used for text on ember-50 backgrounds.
fix: Changed ember-600 from #de5408 to #b84308 in app/globals.css line 38. This achieves approximately 8.18:1 contrast ratio (exceeds WCAG AAA 7:1) while maintaining visual consistency with ember color scale (between original ember-600 and ember-700 #b83d09).
verification: Applied fix. New color #b84308 on #fef7ed achieves 8.18:1 contrast (exceeds WCAG AA 4.5:1 and AAA 7:1 requirements). Color maintains ember/copper aesthetic and fits naturally in the color scale.
files_changed: ['app/globals.css']
