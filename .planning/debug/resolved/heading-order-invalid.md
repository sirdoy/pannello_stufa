---
status: resolved
trigger: "heading-order-invalid"
created: 2026-02-07T10:00:00Z
updated: 2026-02-07T10:20:00Z
---

## Current Focus

hypothesis: CONFIRMED ROOT CAUSE - EmptyState component renders h3, causing h1→h3 skip when no devices visible
test: Fix EmptyState to accept level prop, default to h2
expecting: Heading order valid in all scenarios (with/without devices)
next_action: Update EmptyState component to support heading level prop

## Symptoms

expected: Heading elements should follow a sequential order (h1 → h2 → h3, etc.) without skipping levels
actual: axe-core reports "Heading order invalid" on the homepage
errors: "Fix any of the following: Heading order invalid"
reproduction: Run axe DevTools audit on homepage (/)
started: Unknown when it started, likely introduced during TypeScript migration or component changes

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:05:00Z
  checked: app/page.tsx (homepage)
  found: Section component with level={1} renders h1 for "I tuoi dispositivi"
  implication: Homepage has an h1

- timestamp: 2026-02-07T10:06:00Z
  checked: app/components/devices/stove/StoveCard.tsx
  found: Multiple Heading components - level={2} for "Stufa" (line 1045), level={3} for status (line 1090), level={4} for "Ventilazione" and "Potenza" (lines 1412, 1463)
  implication: StoveCard follows proper hierarchy: h2 → h3 → h4

- timestamp: 2026-02-07T10:07:00Z
  checked: All device card components for heading usage
  found: StoveCard uses h2, ThermostatCard uses h3, LightsCard uses h3
  implication: PROBLEM FOUND - StoveCard starts at h2, but ThermostatCard and LightsCard jump to h3 WITHOUT an h2 parent. This creates invalid heading order.

- timestamp: 2026-02-07T10:08:00Z
  checked: SmartHomeCard component (used by DeviceCard)
  found: SmartHomeCard always renders h2 for title at line 200
  implication: ALL device cards (Thermostat, Lights, Camera, Weather) use h2 via SmartHomeCard/DeviceCard

- timestamp: 2026-02-07T10:09:00Z
  checked: Expected homepage heading structure
  found: h1 (page title "I tuoi dispositivi") → h2 (StoveCard "Stufa") → h2 (ThermostatCard "Termostato") → h2 (LightsCard "Luci") → h3 (various subtitles) → h4 (controls)
  implication: This SHOULD be correct! Multiple h2s are allowed as parallel sections. Need to investigate if StoveCard has conflicting headings.

- timestamp: 2026-02-07T10:10:00Z
  checked: StoveCard internal hierarchy
  found: StoveCard does NOT use SmartHomeCard wrapper - it renders headings directly:
    - h2 "Stufa" (line 1045)
    - h3 status label like "IN FUNZIONE" (line 1090)
    - h4 "Ventilazione" (line 1412)
    - h4 "Potenza" (line 1463)
  implication: StoveCard structure is correct (h2→h3→h4). Other cards use DeviceCard/SmartHomeCard which renders h2 for title. All cards have h2 as their main heading. This is VALID.

- timestamp: 2026-02-07T10:12:00Z
  checked: EmptyState component usage on homepage
  found: EmptyState hardcodes h3 for title (line 110 of EmptyState.tsx). Homepage uses EmptyState when visibleCards.length === 0
  implication: ROOT CAUSE FOUND - When no devices are visible, page structure is h1 (Section title) → h3 (EmptyState title), skipping h2 level

## Resolution

root_cause: EmptyState component hardcoded level={3} for title heading. When homepage has no visible devices, page structure becomes h1 (Section title) → h3 (EmptyState title), skipping h2 level entirely. This violates WCAG heading hierarchy requirements.

fix: Updated EmptyState component to accept optional `level` prop (1-6) with default value of 2. This ensures proper heading hierarchy h1 → h2 in all scenarios. The prop allows flexibility for different contexts while maintaining accessibility by default.

verification:
- Homepage with devices: h1 (page title) → h2 (device cards) ✓
- Homepage without devices: h1 (page title) → h2 (EmptyState title) ✓ (was h1→h3)
- DeviceCard disconnected state: h2 (card title) → h3 (EmptyState) ✓ (explicitly set level={3})
- ThermostatCard no temp: h2 (card title) → h3 (EmptyState) ✓ (explicitly set level={3})
- Log page: h1 (page title) → h2 (EmptyState) ✓ (uses default)
- Scenes page: h1 → h2 → h2 (EmptyState) ✓ (parallel h2s, uses default)
All heading hierarchies are now valid. No level skipping occurs.

files_changed:
  - app/components/ui/EmptyState.tsx: Added level prop (default: 2), updated interface, JSDoc, and Heading usage
  - app/components/ui/DeviceCard.tsx: Set level={3} for EmptyState in disconnected state (nested under card h2)
  - app/components/devices/thermostat/ThermostatCard.tsx: Set level={3} for EmptyState (nested under card h2)
