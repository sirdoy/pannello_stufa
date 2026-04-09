# Phase 158: Automations Module - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage automation rules (list, create, read, update, delete) and inspect per-rule execution history. This is a proxy-based CRUD module — the HA backend owns rule logic and execution; the frontend is a thin management layer.

</domain>

<decisions>
## Implementation Decisions

### Rule Management UI
- **D-01:** Use the DataTable + FormModal + ConfirmationDialog pattern established in v15.0 (Device Registry, Rooms pages) for the rules list page
- **D-02:** Rules list page at `/automations` with paginated DataTable, create/edit via FormModal, delete via ConfirmationDialog

### Execution History Display
- **D-03:** Execution history is accessed via a dedicated rule detail page (`/automations/[rule_id]`), not inline/expandable rows
- **D-04:** History displayed as a DataTable with pagination (reusing PaginatedResponse<T> pattern)

### Rule Form Complexity
- **D-05:** Simple form fields proxied to HA backend — the frontend does not build a visual rule editor. Fields are whatever the HA automation rule schema exposes (name, description, enabled, triggers, conditions, actions as JSON/structured data)
- **D-06:** FormModal with Zod validation for the create/edit form, following Device Types page pattern

### Navigation Placement
- **D-07:** "Automazioni" as a top-level nav entry (same level as Stanze, Registro, etc.)

### Claude's Discretion
- Proxy function naming and grouping within `automationsProxy.ts`
- Exact DataTable column selection for rules list and execution history
- Loading skeletons and empty state messaging
- Error handling UX for failed CRUD operations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Proxy Pattern
- `lib/registry/registryProxy.ts` — Reference implementation for CRUD proxy (getTypes, createType, deleteType, getDevices)
- `lib/haClient.ts` — Shared HA transport (haGet/haPost/haPut/haDelete)
- `types/common.ts` — PaginatedResponse<T> type

### CRUD UI Pattern
- `app/registry/device-types/page.tsx` — Reference CRUD page with DataTable + FormModal + Zod
- `app/registry/devices/page.tsx` — Paginated list with CRUD
- `app/rooms/page.tsx` — Create/edit/delete with FormModal render-prop

### API Route Pattern
- `app/api/v1/thermorossi/status/route.ts` — v1 route structure reference
- `app/api/v1/devices/route.ts` — Aggregate endpoint reference

### Navigation
- `app/components/navigation/` — Nav components for adding new entries

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: Paginated, sortable table used across Registry and Rooms pages
- `FormModal` with render-prop pattern and `Control<T>`: Reusable create/edit modal
- `ConfirmationDialog`: Delete confirmation pattern
- `PaginatedResponse<T>` type in `types/common.ts`
- `haGet/haPost/haPut/haDelete` transport functions in `lib/haClient.ts`

### Established Patterns
- Proxy module: function module exporting named functions (not class), thin wrapper over haClient
- API routes: `export const dynamic = 'force-dynamic'` + middleware wrapper
- Custom hooks: `useAutomations()` / `useAutomationDetail()` pattern with SWR or polling
- FormModal: Zod schema validation, `Control<T>` render-prop for form fields
- Italian locale: nav labels and empty states in Italian

### Integration Points
- Navigation: Add "Automazioni" entry to device registry nav structure
- App Router: `/automations` and `/automations/[rule_id]` page routes
- API: `/api/v1/automations/*` route handlers proxying to HA backend

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow the v15.0 CRUD template (DataTable + FormModal) for consistency with existing Registry and Rooms pages.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 158-automations-module*
*Context gathered: 2026-04-08*
