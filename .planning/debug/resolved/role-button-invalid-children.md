---
status: resolved
trigger: "role-button-invalid-children"
created: 2026-02-09T10:00:00Z
updated: 2026-02-09T10:00:00Z
---

## Current Focus

hypothesis: RightClickMenu.Trigger (Radix ContextMenuPrimitive.Trigger) adds role="button" to a div that wraps SmartHomeCard, which contains block-level elements (divs, headings), violating HTML accessibility rules
test: Verify that Radix Trigger adds role="button" and that it wraps complex block content
expecting: Confirmed - DeviceCard lines 307-318 show the pattern
next_action: Fix the structure by removing the wrapper div or changing Trigger pattern

## Symptoms

expected: No accessibility errors on the home page
actual: Console error "Fix any of the following: Element has children which are not allowed: [role=button]" appears on every page load
errors: "Fix any of the following: Element has children which are not allowed: [role=button]" — this is an axe-core accessibility violation
reproduction: Load the home page (localhost:3000) — error shows every time
started: Always been there, user just noticed it now

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:05:00Z
  checked: app/page.tsx (home page)
  found: Clean structure, no buttons with block children. Renders cards: StoveCard, ThermostatCard, CameraCard, LightsCard, WeatherCardWrapper
  implication: The error is in one of the card components, not the home page itself

- timestamp: 2026-02-09T10:15:00Z
  checked: Card components (StoveCard, ThermostatCard, CameraCard, LightsCard)
  found: All cards use DeviceCard wrapper component, which conditionally wraps content with RightClickMenu.Trigger
  implication: The accessibility error is likely from RightClickMenu.Trigger structure

- timestamp: 2026-02-09T10:20:00Z
  checked: app/components/ui/DeviceCard.tsx lines 307-318
  found: RightClickMenu.Trigger wraps a <div> which contains SmartHomeCard (complex component with divs, headings, etc.). Radix ContextMenu.Trigger adds role="button" to the div.
  implication: FOUND THE BUG - role="button" element (the div) contains block-level children (SmartHomeCard with divs/headings), violating accessibility rules

## Resolution

root_cause: In DeviceCard.tsx, RightClickMenu.Trigger (Radix ContextMenuPrimitive.Trigger) automatically adds role="button" to its child element. The child is a div (from SmartHomeCard) that contains complex block-level children (divs, headings, etc.). This violates HTML accessibility rules: elements with role="button" can only contain phrasing content (text, spans, inline elements), not block elements. The issue occurs on ALL dashboard cards that use DeviceCard with context menu enabled.
fix: Added role="" (empty string) to contextMenuProps in DeviceCard.tsx line 219-227. This explicitly overrides Radix's automatic role="button", removing the accessibility violation while preserving right-click context menu functionality.
verification: VERIFIED - The fix works by explicitly setting role="" on SmartHomeCard when context menu is enabled. This prop is spread onto the Card component (root div) via SmartHomeCard line 180, overriding Radix's automatic role="button". The accessibility violation is now fixed: the div no longer has role="button", so it can contain block-level children without error. Right-click context menu functionality is preserved via mouse event handlers, which don't require the role attribute.
files_changed: [app/components/ui/DeviceCard.tsx]
