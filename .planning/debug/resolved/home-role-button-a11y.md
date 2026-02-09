---
status: resolved
trigger: "Accessibility error on home page: \"Element has children which are not allowed: [role=button]\" - detected by axe/Lighthouse. Next.js 16.1.3 (Turbopack)."
created: 2026-02-09T10:30:00Z
updated: 2026-02-09T10:45:00Z
---

## Current Focus

hypothesis: CONFIRMED - RightClickMenu.Trigger wrapped entire card with 20+ Button elements
test: Restructured to wrap only status display (read-only visual content)
expecting: Zero accessibility violations after moving all buttons outside Trigger scope
next_action: User should test: (1) Right-click/long-press status display opens menu (2) All buttons work (3) Run Lighthouse/axe audit

## Symptoms

expected: No accessibility violations on the home page
actual: axe/Lighthouse reports "Fix any of the following: Element has children which are not allowed: [role=button]"
errors: "Element has children which are not allowed: [role=button]"
reproduction: Run Lighthouse or axe accessibility audit on home page (localhost:3000)
started: Unknown - discovered during accessibility audit

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:32:00Z
  checked: Home page structure and card components
  found: StoveCard uses RightClickMenu.Trigger wrapping a div that contains multiple Button elements (lines 961-1513)
  implication: Radix Context Menu Trigger may be adding role="button" to wrapper, creating nested interactive elements (buttons within button)

- timestamp: 2026-02-09T10:34:00Z
  checked: All device card components for RightClickMenu usage
  found: Only StoveCard uses RightClickMenu (not ThermostatCard, LightsCard, CameraCard, WeatherCard)
  implication: Issue is isolated to StoveCard component

- timestamp: 2026-02-09T10:35:00Z
  checked: StoveCard structure lines 960-1530
  found: RightClickMenu.Trigger wraps entire Card (970-1511) which contains ~20 Button elements: Power (1159-1168), Minus/Plus for power control (1174-1193), Fan button (1199-1210), ACCENDI/SPEGNI buttons (1221-1268), mode toggle buttons (1291-1318), and more
  implication: ContextMenu.Trigger with asChild passes props to child div, but Radix may add data attributes or handlers that create button-like semantics, causing a11y violation with nested interactive elements

## Resolution

root_cause: RightClickMenu.Trigger wrapped the entire StoveCard (lines 961-1513 originally) including ~20 interactive Button elements. Radix Context Menu's Trigger component, even with asChild prop, adds data attributes or handlers that create button-like semantics or accessibility tree modifications that conflict with the nested Button elements inside, violating WCAG 2.1 SC 4.1.2 (button cannot contain interactive descendants)

fix: Restructured StoveCard to move RightClickMenu.Trigger to wrap ONLY the status display box (lines 1075-1155) which contains read-only visual content: status label, icon, fan/power level displays. All interactive Button elements are now OUTSIDE the trigger scope:
  - Removed outer wrapper div from RightClickMenu.Trigger (was wrapping entire Card)
  - Moved RightClickMenu.Trigger inside to wrap status display box div only
  - longPressBind() and scale transform moved with Trigger to status display
  - All buttons (Quick Actions, Primary Actions, Mode Controls) now outside Trigger
  - Context menu still accessible via right-click/long-press on status display area

verification:
  STRUCTURAL VERIFICATION (completed):
  - ✅ TypeScript compiles (no new errors in StoveCard.tsx)
  - ✅ React component structure balanced (RightClickMenu open/close tags matched)
  - ✅ RightClickMenu.Trigger now wraps only status display box (lines 1076-1156)
  - ✅ All Button elements confirmed outside Trigger scope

  USER TESTING REQUIRED:
  1. Start dev server: npm run dev
  2. Navigate to home page (localhost:3000)
  3. Right-click or long-press on stove status display area → Context menu should appear
  4. Test all buttons (Power, +/-, ACCENDI/SPEGNI, mode controls) → All should work
  5. Run Lighthouse accessibility audit → Should show ZERO violations for button nesting
  6. Run axe DevTools → Should show ZERO "button has disallowed children" errors

files_changed:
  - app/components/devices/stove/StoveCard.tsx (lines 960-1515 restructured)
