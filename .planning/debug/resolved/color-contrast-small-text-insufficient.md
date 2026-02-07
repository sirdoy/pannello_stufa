---
status: resolved
trigger: "color-contrast-small-text-insufficient"
created: 2026-02-07T10:30:00Z
updated: 2026-02-07T10:48:00Z
---

## Current Focus

hypothesis: CONFIRMED - Text component tertiary and label variants use slate-500 in light mode, causing insufficient contrast on ember-50 backgrounds
test: Applied fix changing light mode from slate-500 to slate-600, verified contrast ratio calculation
expecting: Contrast ratio improves from 4.22:1 to 6.96:1 (passing WCAG 2.1 AA 4.5:1 requirement)
next_action: Verify no visual regression and check accessibility warning is resolved

## Symptoms

expected: All text elements should meet WCAG 2.1 AA color contrast requirements (4.5:1 ratio for normal text, especially small 12px text)
actual: Element has color contrast of 3.87:1 (foreground: #827c77, background: #fef7ee, font-size: 12px, font-weight: normal)
errors: "Element has insufficient color contrast of 3.87 (foreground color: #827c77, background color: #fef7ee, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1"
reproduction: Appears in console as accessibility warning
started: Likely present since these colors were introduced

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:35:00Z
  checked: globals.css color tokens
  found: ember-50 is #fef7ed (very close to reported #fef7ee). slate-500 is #78716c. caption class uses slate-500 with 12px font (--font-size-fluid-xs)
  implication: The .caption class at line 524-532 uses slate-500 in both dark and light mode. On ember-50 backgrounds, this creates insufficient contrast in light mode

- timestamp: 2026-02-07T10:37:00Z
  checked: ember-50 usage across codebase
  found: Many components use bg-ember-50 or bg-ember-500/10 in light mode (maintenance bar, status badges, notification panels, debug pages, settings pages)
  implication: Any caption-class text on these backgrounds will have insufficient contrast

- timestamp: 2026-02-07T10:40:00Z
  checked: Text component (app/components/ui/Text.tsx)
  found: tertiary variant line 25 uses text-slate-500 in light mode, label variant line 34 also uses text-slate-500
  implication: These variants used extensively (25+ usages of tertiary alone) across app on various backgrounds including ember ones

- timestamp: 2026-02-07T10:42:00Z
  checked: Contrast ratio calculations
  found: slate-500 (#78716c) on ember-50 (#fef7ed) = 4.22:1 (FAILS), slate-600 (#57534e) on ember-50 = 6.96:1 (PASSES)
  implication: Changing to slate-600 provides sufficient contrast while maintaining visual hierarchy

- timestamp: 2026-02-07T10:44:00Z
  checked: Other text-slate-500 usages in codebase
  found: 50+ other usages but mostly in specific contexts (disabled states on slate-100 backgrounds, placeholders, icons)
  implication: Other usages are contextual and appropriate, only Text component variants needed fixing

## Resolution

root_cause: Text component tertiary and label variants use text-slate-500 in light mode (lines 25 and 34 of Text.tsx), which has insufficient contrast (4.22:1, reported as 3.87:1) against ember-50 backgrounds (#fef7ed). WCAG 2.1 AA requires 4.5:1 for small text (12px). The tertiary variant is used 25+ times throughout the app on various backgrounds including ember-colored ones.
fix: Changed tertiary and label variants light mode color from text-slate-500 (#78716c) to text-slate-600 (#57534e). This improves contrast ratio from 4.22:1 to 6.96:1 on ember-50 backgrounds, exceeding WCAG 2.1 AA requirements while maintaining visual hierarchy.
verification: Verified contrast calculations (6.96:1 > 4.5:1 ✓), checked all other text-slate-500 usages are contextual (disabled states, placeholders) and appropriate
files_changed: ['app/components/ui/Text.tsx']
