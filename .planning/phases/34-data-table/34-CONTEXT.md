# Phase 34: Data Table - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a full-featured Data Table component with sorting, filtering, selection, pagination, and row expansion. The component integrates with existing Popover (for filters) and Context Menu (for row actions). Responsive with horizontal scroll on mobile, accessible with ARIA announcements.

</domain>

<decisions>
## Implementation Decisions

### Visual density & layout
- Row height configurable via prop (compact 32px, default 44px, relaxed options)
- Fixed + flex hybrid column sizing: checkbox and actions columns fixed, data columns flex
- Zebra striping configurable via prop (optional alternating row backgrounds)
- Sticky header optional via prop (disabled by default)

### Selection & interaction
- Both single-select and multi-select modes, configurable via prop
- Floating bulk actions toolbar appears above table when rows selected
- Row click expands details panel, checkbox click for selection (separate behaviors)

### Filtering approach
- Both global search and per-column filters supported
- Column filters via dropdown menu on header click (includes sort and filter options)
- Active filters displayed as removable chips above table with "Clear all" button
- Global search input positioned in table toolbar row

### Pagination style
- Traditional page numbers navigation (1, 2, 3...)
- Rows per page selector configurable per table (can show/hide the dropdown)
- Pagination controls centered at bottom of table
- Total count display ("Showing 1-10 of 243") optional via prop

### Claude's Discretion
- Checkbox column position (likely first column, standard practice)
- Exact dropdown menu design for column filters
- Toolbar layout and styling
- Loading and empty state designs
- Keyboard navigation details beyond ARIA requirements

</decisions>

<specifics>
## Specific Ideas

- Toolbar should feel unified with the table (not separate element)
- Filter chips should match the Badge component from design system
- Selection toolbar should be visually distinct but not jarring

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 34-data-table*
*Context gathered: 2026-02-04*
