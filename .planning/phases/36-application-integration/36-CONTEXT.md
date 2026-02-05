# Phase 36: Application Integration - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Add quick actions to device cards and ensure consistent component usage across all pages. Quick actions provide immediate device control, context menus extend functionality, Command Palette enables power-user navigation, and audit ensures all v4.0 components are properly applied application-wide.

</domain>

<decisions>
## Implementation Decisions

### Quick Action Buttons
- Stove card: On/Off toggle + Power level + Fan control visible
- Thermostat card: Temperature adjustment + Mode switcher (Schedule/Manual/Away)
- Lights and Camera: Claude's discretion based on device capabilities
- Button position: Bottom row action bar, always visible on device cards
- Touch targets: Follow existing design system sizing

### Context Menu Actions
- Extended scope: Context menu includes more options than quick buttons (settings, details, advanced actions)
- No overlap expected: Quick buttons handle frequent actions, menu handles less common ones
- No destructive actions: Disconnect/remove only available in device settings page
- Confirmation: Not needed in context menu (destructive actions excluded)

### Command Palette Scope
- Full command set: Navigation + Global actions + Device commands
- No recent commands section (per CMDK-05 deferral — keep palette clean)
- Device command format: Claude's discretion on organization and input handling

### Audit Criteria
- Scope: All pages including Debug pages
- Checks: Component consistency + Pattern consistency + Accessibility (ARIA/keyboard)
- Migration: Fix all issues found in this phase (no documentation-only approach)
- Output: No report document, just fix issues as encountered

### Claude's Discretion
- Lights quick actions (based on device capabilities — likely on/off + brightness)
- Camera quick actions (based on device capabilities — likely snapshot if available)
- Context menu grouping (based on action count and types)
- Context menu keyboard shortcuts (based on action importance)
- Command Palette device command organization
- Command Palette input handling for parameterized commands (e.g., temperature)

</decisions>

<specifics>
## Specific Ideas

- Quick action buttons should feel like native controls, not generic buttons
- Context menu follows RightClickMenu component patterns from Phase 32
- Command Palette already has cmdk foundation — extend with device commands

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 36-application-integration*
*Context gathered: 2026-02-05*
