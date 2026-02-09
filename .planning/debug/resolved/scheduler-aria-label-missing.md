---
status: resolved
trigger: "scheduler-aria-label-missing"
created: 2026-02-09T10:30:00Z
updated: 2026-02-09T10:50:00Z
---

## Current Focus

hypothesis: TimeBar component has clickable interval divs (line 71-88) missing aria-label and role attributes
test: Add proper ARIA attributes to interactive interval elements
expecting: Accessibility audit will pass after adding role="button" and aria-label
next_action: implement fix for TimeBar.tsx clickable intervals

## Symptoms

expected: All elements in the scheduler page should have proper accessibility attributes (aria-label, aria-labelledby, or title)
actual: Accessibility audit reports: "Fix any of the following: aria-label attribute does not exist or is empty, aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty, Element has no title attribute"
errors: aria-label attribute does not exist or is empty; aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty; Element has no title attribute
reproduction: Run accessibility audit (axe/Lighthouse) on the stove/scheduler page
started: Unknown — discovered via accessibility audit

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:35:00Z
  checked: Main scheduler page (/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/stove/scheduler/page.tsx)
  found: No iframe elements, ActionButton components properly using ariaLabel prop
  implication: Main page structure looks good for accessibility

- timestamp: 2026-02-09T10:36:00Z
  checked: DayEditPanel component
  found: ActionButton components have proper ariaLabel and title attributes (lines 116-117, 140-141)
  implication: Icon-only buttons on mobile are correctly labeled

- timestamp: 2026-02-09T10:37:00Z
  checked: WeeklyTimeline component
  found: Timeline interval bars (line 73-84) are interactive divs with only title attribute, no aria-label or role
  implication: These clickable elements may not be accessible to screen readers

- timestamp: 2026-02-09T10:40:00Z
  checked: TimeBar component (/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/scheduler/TimeBar.tsx)
  found: Interactive interval divs (line 71-88) have onClick handler but missing role="button" and aria-label attributes
  implication: ROOT CAUSE FOUND - These are the elements failing accessibility audit

- timestamp: 2026-02-09T10:41:00Z
  checked: ProgressBar component
  found: Already has proper ARIA attributes (role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax)
  implication: ProgressBar is correctly implemented

- timestamp: 2026-02-09T10:42:00Z
  checked: ScheduleInterval and DayEditPanel components
  found: All ActionButton components have proper ariaLabel attributes
  implication: Icon-only buttons are correctly implemented

## Resolution

root_cause: TimeBar component (app/components/scheduler/TimeBar.tsx) has interactive interval divs (line 71-88) with onClick handlers but missing required accessibility attributes (role="button" and aria-label). WeeklyTimeline component also had decorative interval bars without proper ARIA labeling. These elements were not properly announced to screen readers.
fix: |
  1. TimeBar.tsx: Added role="button", aria-label, tabIndex={0}, and onKeyDown handler for keyboard navigation
  2. WeeklyTimeline.tsx: Added role="img" and aria-label to decorative interval bars (not interactive, just visual)
verification: Tests passing, accessibility attributes properly added
files_changed:
  - app/components/scheduler/TimeBar.tsx
  - app/components/scheduler/WeeklyTimeline.tsx
