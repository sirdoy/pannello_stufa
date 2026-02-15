# Phase 63: WAN Status & Device List - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Full `/network` page showing WAN connection details and a paginated, sortable, searchable device list. Users can view external IP, uptime, DNS, connection type, and gateway. Device list shows all connected/disconnected devices with name, IP, MAC, status, and bandwidth. Bandwidth visualization and device history are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Page layout
- Stacked sections: WAN status card on top, device list table below — simple vertical scroll
- WAN status section always visible (not collapsible)
- Standard page header with title and back navigation — consistent with stove/lights pages
- Same stacked layout on mobile — WAN card above table, table scrolls horizontally if needed

### WAN status display
- Full details shown: status badge (online/offline), external IP, uptime, DNS servers, connection type, gateway
- Single card with vertical list of labeled values — simple and scannable
- External IP is clickable — copies to clipboard on click, with visual feedback (checkmark or color change)

### Device list table
- All columns visible by default: Name, IP, MAC, Status, Bandwidth
- Online devices grouped at top, offline devices grouped at bottom with separator
- Offline devices show "Last seen X ago" timestamp
- 25 devices per page with pagination

### Search & filtering
- Search bar above table, full width — prominent and easy to find
- Searches by name, IP, or MAC address with instant filtering

### Claude's Discretion
- WAN offline alert severity (red badge only vs full-width banner)
- Online/offline status badge styling in table (dot+text vs badge chip)
- "Last seen" format for offline devices (relative vs absolute+relative)
- Whether to add a separate status filter (All/Online/Offline tabs) alongside search
- Column sorting implementation (clickable headers vs preset sort)
- Search empty state treatment

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches based on existing project patterns (stove/lights page structure, DataTable component, design system).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 63-wan-status-device-list*
*Context gathered: 2026-02-15*
