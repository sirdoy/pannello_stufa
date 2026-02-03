# Phase 28: Dashboard Customization - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Settings page for reordering and hiding home page cards. Users can personalize their dashboard layout. Each user has their own preferences stored per Auth0 account.

</domain>

<decisions>
## Implementation Decisions

### Card list display
- Icon + name format for each card in the list (compact)
- Match existing app icons: Flame for stove, Thermometer for thermostat, etc.
- Hidden cards show "Hidden" badge or indicator
- Hidden cards appear visually muted (reduced opacity/grayed out)

### Reorder interactions
- Hidden cards can still be reordered (order preserved if re-enabled)
- Claude's Discretion: Up/down button placement (left vs right)
- Claude's Discretion: Disabled state for edge positions (top/bottom)
- Claude's Discretion: Animation on card swap (subtle or instant)

### Visibility toggles
- Match existing app toggle style (use whatever toggle/switch is used elsewhere)
- No confirmation required when hiding cards
- All cards can be hidden (no minimum required)
- No reset to defaults button needed

### Page layout
- Page title: "Personalizza home"
- No instruction text (UI is self-explanatory)
- Manual save required (Save button, not auto-save)
- Navigate away with unsaved changes: silently discard (no confirmation dialog)

### User storage
- Per-user preferences using Auth0 user ID (user.sub)
- All pages require login (except cron endpoints)
- Claude's Discretion: Firebase path structure (users/{userId}/dashboard vs config/dashboard/{userId})

### Claude's Discretion
- Up/down button placement
- Edge position handling (disabled vs hidden buttons)
- Animation on reorder
- Firebase path structure for per-user storage
- Save button placement and styling

</decisions>

<specifics>
## Specific Ideas

- Each user must have their own card order - not a shared app-wide setting
- Auth0 is already integrated via `useUser()` from `@auth0/nextjs-auth0/client`
- Existing `dashboardPreferencesService.js` stores at shared path - needs refactor for per-user

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 28-dashboard-customization*
*Context gathered: 2026-02-03*
