# Phase 120: Device Types UI - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Page to view, create, and delete device type definitions (built-in and custom). Device types are the taxonomy used for classifying registered devices (light, sensor, thermostat, etc.). This phase delivers the management UI only — the API routes already exist from Phase 118.

</domain>

<decisions>
## Implementation Decisions

### Page location & navigation
- **D-01:** New page at `app/registry/types/page.tsx` — `/registry/types` route
- **D-02:** Back button navigates to `/` (dashboard) — no parent registry page exists yet
- **D-03:** Page uses standard layout pattern: max-w-7xl container, back button, Heading + Text description, then Card content

### List display format
- **D-04:** Use DataTable (TanStack Table) to list device types — columns: label, slug, is_builtin (badge), created_at (formatted date)
- **D-05:** Built-in types show a Badge with "Built-in" label — custom types show no badge or a subtle "Custom" badge
- **D-06:** No pagination needed — device types list is small (typically <20 items), fetch all at once
- **D-07:** Sort by label alphabetically by default, built-in types first

### Create form UX
- **D-08:** "Crea tipo" button above the table opens a FormModal
- **D-09:** FormModal fields: slug (text input, pattern `^[a-z0-9_]+$`, max 64 chars) + label (text input, max 128 chars)
- **D-10:** Zod validation schema enforces slug pattern and max lengths client-side
- **D-11:** On 409 (slug already exists) show error in FormModal — do not close modal
- **D-12:** On success: close modal, show Toast success, refresh the list

### Delete behavior
- **D-13:** Delete button visible only on custom types (is_builtin === false) — built-in types have no delete action
- **D-14:** ConfirmDialog shows type label and slug before confirming deletion
- **D-15:** On 409 (type in use by devices) show Toast error with message "Tipo in uso da dispositivi registrati"
- **D-16:** On success: show Toast success, refresh the list

### Data fetching
- **D-17:** Create `useDeviceTypes` hook in the page file or a co-located hooks file — simple fetch-on-mount, not polling (types change rarely)
- **D-18:** Hook calls `/api/registry/types` (Next.js proxy route, not registryProxy server module) — this is a client component
- **D-19:** Expose `{ types, loading, error, refetch }` — refetch called after create/delete mutations
- **D-20:** Mutations (create, delete) call `/api/registry/types` and `/api/registry/types/{slug}` directly via fetch

### Error & loading states
- **D-21:** Loading state: Skeleton placeholder matching table shape
- **D-22:** Error state: Banner variant="error" with error message
- **D-23:** Empty state (no custom types yet): show built-in types table + subtle message "Nessun tipo personalizzato"

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether to use a separate hooks file or inline in page component
- Import organization and JSDoc style
- Whether slug input auto-lowercases or just validates

</decisions>

<specifics>
## Specific Ideas

- Italian language for all UI labels (consistent with rest of app): "Tipi dispositivo", "Crea tipo", "Elimina", "Slug", "Etichetta"
- Follow the settings page pattern for layout and feedback (Banner for persistent errors, Toast for transient success/error)
- The "Frontend Component Suggestions" in docs/api/registry.md suggest Table + Modal Form + ConfirmDialog — align with those

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Device Types API contract
- `docs/api/registry.md` §Device Types — GET/POST/DELETE endpoints, request/response shapes, error codes (409 slug exists, 409 type in use, 403 built-in)
- `docs/api/registry.md` §TypeScript Interfaces — DeviceType, DeviceTypeCreate interfaces
- `docs/api/registry.md` §Frontend Component Suggestions — Table/Modal/ConfirmDialog recommendations

### Existing API layer (Phase 118)
- `lib/registry/registryProxy.ts` — Server-side proxy (NOT used by client components — reference only)
- `types/registry.ts` — DeviceType, DeviceTypeCreate type definitions (import these in the page)
- `app/api/registry/types/route.ts` — GET + POST proxy route (client fetches this)
- `app/api/registry/types/[slug]/route.ts` — DELETE proxy route (client fetches this)

### UI component patterns
- `app/components/ui/DataTable.tsx` — TanStack Table component with sorting/filtering
- `app/components/ui/FormModal.tsx` — React Hook Form + Zod validation modal
- `app/components/ui/ConfirmDialog.tsx` — Delete confirmation dialog
- `app/components/ui/Toast.tsx` — Transient feedback (success/error variants)
- `app/components/ui/Banner.tsx` — Persistent error/warning alerts
- `app/components/ui/Badge.tsx` — Built-in/custom type indicator

### Page layout reference
- `app/settings/page.tsx` — Settings page layout pattern (back button, heading, card content)
- `app/settings/devices/page.tsx` — Device management page with CRUD-like patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: TanStack Table v8 with sorting, filtering, pagination — use for type list
- `FormModal` component: React Hook Form + Zod, error summary, shake animation — use for create form
- `ConfirmDialog` component: simple confirm/cancel — use for delete confirmation
- `Toast` component: Radix toast with success/error/warning/info — use for mutation feedback
- `Badge` component: status indicators — use for built-in/custom distinction
- `DeviceType` and `DeviceTypeCreate` types already defined in `types/registry.ts`

### Established Patterns
- Client pages use `fetch()` to call Next.js API routes (not server-side proxy modules)
- Toast state: `useState<{ message: string; variant: string } | null>(null)`
- FormModal integrates Zod schemas for client-side validation
- `'use client'` directive required for all interactive pages
- `export const dynamic = 'force-dynamic'` NOT needed on page components (only API routes)

### Integration Points
- `app/registry/types/page.tsx` — new page file (new directory `app/registry/`)
- Fetches from existing API routes: GET/POST `/api/registry/types`, DELETE `/api/registry/types/{slug}`
- Imports types from `types/registry.ts` (DeviceType, DeviceTypeCreate)

</code_context>

<deferred>
## Deferred Ideas

- Device Registry UI (CRUD for registered devices) — Phase 121
- Room Management UI — Phase 122
- Linking device types page from a future admin/registry hub page — future phase

</deferred>

---

*Phase: 120-device-types-ui*
*Context gathered: 2026-03-23*
