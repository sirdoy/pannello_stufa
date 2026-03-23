# Phase 121: Device Registry UI - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Page to view, filter, register, update, and unregister devices from the central device registry. Devices have a provider, device_id, custom name, and type assignment. This phase delivers the full CRUD management UI — the API routes already exist from Phase 118. Two plans: 121-01 (read-only list + filter + health stats) and 121-02 (register, update, unregister actions).

</domain>

<decisions>
## Implementation Decisions

### Page location & navigation
- **D-01:** New page at `app/registry/devices/page.tsx` — `/registry/devices` route
- **D-02:** Back button navigates to `/registry/types` — natural parent in the registry section
- **D-03:** Page uses SettingsLayout pattern (same as Phase 120): back button, Heading + Text description, then Card content

### Device list display
- **D-04:** Use DataTable (TanStack Table) — columns: custom_name, provider_name (Badge), device_type_slug, device_id, updated_at (formatted date), actions
- **D-05:** Provider column uses Badge with variant mapping: hue→ocean, netatmo→ember, thermorossi→ember, dirigera→neutral, raspi→neutral, fritbox→neutral — keep simple, max 3 distinct variants
- **D-06:** Server-side pagination — API supports limit/offset, default page size 20. DataTable pagination controls call refetch with new offset
- **D-07:** Sort by custom_name alphabetically by default (client-side sort within current page)

### Provider filter
- **D-08:** Filter dropdown above the table using Select component — options are hardcoded known providers: "Tutti", "hue", "netatmo", "thermorossi", "dirigera", "raspi", "fritzbox"
- **D-09:** Selecting a provider triggers refetch with `provider_name` query param, resets offset to 0
- **D-10:** "Tutti" (default) sends no provider_name param — returns all devices

### Health stats
- **D-11:** Two stat values displayed above the table: "Tipi dispositivo: N" and "Dispositivi registrati: N"
- **D-12:** Fetch from `/api/registry/health` alongside devices on mount — simple inline display, not separate cards
- **D-13:** Health stats refresh after any mutation (register, update, unregister)

### Register form UX
- **D-14:** "Registra dispositivo" button above the table opens a FormModal
- **D-15:** FormModal fields:
  - provider_name: Select dropdown with known providers (hue, netatmo, thermorossi, dirigera, raspi, fritzbox)
  - device_id: text Input (provider-internal ID)
  - custom_name: text Input (human-readable name)
  - device_type_slug: Select dropdown populated from `/api/registry/types` (fetched on modal open or cached from types hook)
- **D-16:** Zod validation: all 4 fields required, provider_name 1-64 chars, device_id 1-256 chars, custom_name 1-128 chars, device_type_slug 1-64 chars
- **D-17:** On 409 (duplicate provider+device_id) show error in FormModal — do not close modal
- **D-18:** On 422 (unknown type slug) show error in FormModal — do not close modal
- **D-19:** On success: close modal, Toast success "Dispositivo registrato", refresh list + health stats

### Update UX
- **D-20:** Edit button in actions column opens a FormModal (reuse same modal component with different mode)
- **D-21:** FormModal pre-filled with current custom_name and device_type_slug — only these two fields are editable (per API PUT contract)
- **D-22:** provider_name and device_id shown as read-only text above the form fields for context
- **D-23:** On success: close modal, Toast success "Dispositivo aggiornato", refresh list
- **D-24:** On 404 (device removed by another user): Toast error, close modal, refresh list

### Unregister UX
- **D-25:** Delete button in actions column (Button variant="danger" size="sm")
- **D-26:** ConfirmationDialog shows device custom_name and provider_name before confirming
- **D-27:** On success: Toast success "Dispositivo rimosso", refresh list + health stats
- **D-28:** On 404 (already removed): Toast error, refresh list

### Data fetching
- **D-29:** Create `useRegistryDevices` hook — manages paginated fetch with provider filter, exposes `{ devices, totalCount, loading, error, refetch, page, setPage, provider, setProvider }`
- **D-30:** Hook calls `/api/registry/devices?limit=20&offset=N&provider_name=X` — client component, fetch from Next.js proxy
- **D-31:** Create `useRegistryHealth` hook — simple fetch-on-mount, exposes `{ health, loading, refetch }`
- **D-32:** Device types for the register/update Select fetched via reuse of the `useDeviceTypes` pattern from Phase 120 (or inline fetch in modal)

### Error & loading states
- **D-33:** Loading state: Skeleton placeholder matching table shape (same pattern as Phase 120)
- **D-34:** Error state: Banner variant="error" with error message
- **D-35:** Empty state (no devices registered): show health stats + message "Nessun dispositivo registrato" + prominent register button

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether to extract hooks into a co-located hooks file or inline in page component
- Import organization and JSDoc style
- Badge color mapping refinement for providers
- Pagination control styling (next/prev buttons or page numbers)

</decisions>

<specifics>
## Specific Ideas

- Italian language for all UI labels: "Registro dispositivi", "Registra dispositivo", "Modifica", "Rimuovi", "Provider", "Nome", "Tipo", "ID dispositivo"
- Follow Phase 120 DeviceTypesPage pattern exactly for layout, toast handling, FormModal/ConfirmationDialog integration
- The register form needs a type selector — fetch device types list and present as Select options (label shown, slug as value)
- PUT endpoint uses the numeric `id` from RegistryDevice (path param is `device_id` but means the registry row ID) — verify route path
- PaginatedResponse<RegistryDevice> from types/common.ts for the list response typing

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Device Registry API contract
- `docs/api/registry.md` §Devices — GET/POST/PUT/DELETE endpoints, request/response shapes, error codes (409 duplicate, 422 unknown type, 404 not found)
- `docs/api/registry.md` §Health — GET /registry/health response shape
- `docs/api/registry.md` §TypeScript Interfaces — RegistryDevice, DeviceCreate, DeviceUpdate, RegistryHealthResponse
- `docs/api/common.md` §TypeScript Interfaces — PaginatedResponse<T> generic

### Phase 120 implementation (pattern to follow)
- `app/registry/types/page.tsx` — DeviceTypesPage: useDeviceTypes hook, DataTable, FormModal, ConfirmationDialog, Toast integration
- This is the canonical pattern for Phase 121 — same layout, same component composition, extended for pagination and filtering

### Existing API layer (Phase 118)
- `app/api/registry/devices/route.ts` — GET (paginated, filterable) + POST (register) proxy route
- `app/api/registry/devices/[device_id]/route.ts` — PUT (update) + DELETE (unregister) proxy route
- `app/api/registry/types/route.ts` — GET types (needed for type Select dropdown in forms)
- `app/api/registry/health/route.ts` — GET health stats

### Type definitions
- `types/registry.ts` — RegistryDevice, DeviceCreate, DeviceUpdate, DeviceType, RegistryHealthResponse
- `types/common.ts` — PaginatedResponse<T>

### UI component patterns
- `app/components/ui/DataTable.tsx` — TanStack Table with sorting/filtering/pagination
- `app/components/ui/FormModal.tsx` — React Hook Form + Zod validation modal
- `app/components/ui/ConfirmationDialog.tsx` — Delete confirmation dialog
- `app/components/ui/Select.tsx` — Dropdown select component (for provider filter + form fields)
- `app/components/ui/Badge.tsx` — Provider type indicator
- `app/components/SettingsLayout.tsx` — Page layout wrapper

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: TanStack Table v8 with sorting, filtering, pagination — use for device list
- `FormModal` component: React Hook Form + Zod, error summary, shake animation — use for register/update forms
- `ConfirmationDialog` component: simple confirm/cancel — use for unregister confirmation
- `Select` component: dropdown for provider filter and form field selects
- `Badge` component: status indicators — use for provider distinction
- `useToast` hook: `{ success, error }` — transient mutation feedback
- `SettingsLayout` component: page wrapper with back button, title, icon
- All TypeScript types already defined in `types/registry.ts` and `types/common.ts`

### Established Patterns (from Phase 120)
- Client pages use `fetch()` to call Next.js API routes (not server-side proxy modules)
- Toast pattern: `const { success: toastSuccess, error: toastError } = useToast()`
- FormModal throw on error to keep modal open; success proceeds to close
- ConfirmationDialog with `isOpen={item !== null}` / `onClose={() => setItem(null)}`
- Refetch after mutations to refresh list
- `'use client'` directive on all interactive pages
- Zod schema defined at module level for form validation

### Integration Points
- `app/registry/devices/page.tsx` — new page file (directory `app/registry/` already exists from Phase 120)
- Fetches from existing API routes: GET/POST `/api/registry/devices`, PUT/DELETE `/api/registry/devices/{id}`, GET `/api/registry/types`, GET `/api/registry/health`
- Imports types from `types/registry.ts` (RegistryDevice, DeviceCreate, DeviceUpdate, RegistryHealthResponse)
- Imports PaginatedResponse from `types/common.ts`

</code_context>

<deferred>
## Deferred Ideas

- Room Management UI (create/edit/delete rooms) — Phase 122
- Room Device Assignment UI — Phase 123
- Room Status Views (per-room + whole-house) — Phase 124
- Registry hub page linking types + devices + health — future milestone
- Bulk device registration (CSV import) — future milestone
- Device search by name — future milestone (filter by provider is sufficient for v15.0)

</deferred>

---

*Phase: 121-device-registry-ui*
*Context gathered: 2026-03-23*
