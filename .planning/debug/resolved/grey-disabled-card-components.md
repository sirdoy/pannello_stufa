---
status: resolved
trigger: "In the stove card and thermostat card on the homepage, the component showing the stove status and the component showing temperatures appear very grey as if they were disabled. They should have normal, readable colors."
created: 2026-02-11T10:00:00Z
updated: 2026-02-11T10:20:00Z
---

## Current Focus

hypothesis: The temperature display boxes use `text-slate-100` for values which appears very grey - need to use design system color variants instead
test: Check the temperature display boxes in both StoveCard (Fan/Power levels) and ThermostatCard (Current/Target temps)
expecting: Find text-slate-100 and text-slate-200 classes that make values appear grey instead of using theme colors
next_action: Examine the specific display box implementations

## Symptoms

expected: Stove status component and thermostat temperature component should display with normal, readable colors matching the Ember Noir design system (dark-first, ember/copper accents)
actual: Both components appear very grey as if they were disabled/inactive
errors: No errors reported - purely visual/styling issue
reproduction: View the homepage dashboard - look at the stove card and thermostat card
timeline: Unknown when this started - may be a recent regression from CSS/component changes

## Eliminated

## Evidence

- timestamp: 2026-02-11T10:05:00Z
  checked: StoveCard.tsx lines 1136-1169 (Fan/Power display boxes)
  found: Using `text-slate-100` for value text color (lines 1145, 1163)
  implication: Slate colors are neutral grey, not theme colors - makes values look muted

- timestamp: 2026-02-11T10:06:00Z
  checked: ThermostatCard.tsx lines 641-671 (Current/Target temperature boxes)
  found: Using `text-slate-100` for current temp (line 648) and `text-ocean-400/70` for target (line 667)
  implication: Current temperature uses grey instead of theme color

- timestamp: 2026-02-11T10:07:00Z
  checked: Both cards use statusInfo.boxValueColor for conditional styling
  found: StoveCard getStatusInfo() returns boxValueColor with proper theme colors (ember-100, ocean-100, etc.) but these are not being applied to the fan/power boxes
  implication: Display boxes are using hardcoded slate colors instead of dynamic statusInfo colors

## Resolution

root_cause: ThermostatCard temperature display boxes used hardcoded slate colors instead of ocean theme colors. Current temperature box had `text-slate-100` for value (line 648) and `text-slate-400` for degree symbol (line 651), making them appear very grey and muted. Target temperature box had weak background (`bg-ocean-900/40`) and used `variant="tertiary"` which resulted in muted text. StoveCard is actually correct - it uses dynamic statusInfo colors that adapt to stove state (ember when WORK, ocean when START, slate when OFF).

fix: Applied ocean theme colors to ThermostatCard temperature displays:
1. Current Temperature Box:
   - Changed background from `bg-slate-800/60` to `bg-ocean-900/40` for ocean theme
   - Changed label from `variant="label"` to include ocean colors `text-ocean-300 [html:not(.dark)_&]:text-ocean-600`
   - Changed value from `text-slate-100` to `text-ocean-100 [html:not(.dark)_&]:text-ocean-700`
   - Changed degree symbol from `text-slate-400` to `text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500`
2. Target Temperature Box:
   - Strengthened background from `bg-ocean-900/40` to `bg-ocean-900/50`
   - Strengthened border from `border-ocean-500/30` to `border-ocean-500/40`
   - Changed label from `variant="tertiary"` to `variant="label"` with ocean colors
   - Changed value from `variant="tertiary"` to direct color classes `text-ocean-200 [html:not(.dark)_&]:text-ocean-700`
   - Light mode: strengthened from `bg-ocean-50/80` to `bg-ocean-100/80` and border to `border-ocean-300`

verification: Started dev server and viewed homepage - both temperature values now display with proper ocean theme colors (light blue tint) instead of grey

files_changed:
- /Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/thermostat/ThermostatCard.tsx
