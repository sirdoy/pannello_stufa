# Phase 122: Room Management UI - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Page to create, rename, and delete rooms from a dedicated rooms management page. Rooms are organizational containers for grouping registered devices by location. This phase delivers the management CRUD UI only — device assignment (Phase 123) and status views (Phase 124) are separate. The API routes already exist from Phase 119.

</domain>

<decisions>
## Implementation Decisions

### Page location & navigation
- **D-01:** New page at `app/rooms/page.tsx` — `/rooms` route
- **D-02:** Back button navigates to `/registry/devices` (device registry page) — follows the registry→rooms flow
- **D-03:** Page uses `SettingsLayout` with standard pattern: back button, Heading, Text description, then Card content — identical to Phase 120/121 pages

### List display format
- **D-04:** Use DataTable (TanStack Table) to list rooms — columns: name, description (truncated), device_count, created_at (formatted date), actions
- **D-05:** No pagination needed — rooms list is small (typically <20 rooms), fetch all at once via GET /api/rooms
- **D-06:** Sort by name alphabetically using Italian locale by default
- **D-07:** device_count column shows a Badge with count (e.g., "3 dispositivi") — zero shows "0 dispositivi" in neutral variant

### Create form UX
- **D-08:** "Crea stanza" button above the table opens a FormModal
- **D-09:** FormModal fields: name (text input, required, max 100 chars) + description (text input, optional, max 500 chars)
- **D-10:** Zod validation schema enforces name required (min 1) and max lengths client-side
- **D-11:** On 409 (room name already exists) throw error to keep modal open — same pattern as Phase 120 slug conflict
- **D-12:** On success: close modal, show Toast success, refresh the list

### Edit form UX
- **D-13:** "Modifica" ghost button in actions column opens a FormModal pre-filled with current name and description
- **D-14:** FormModal fields: same as create (name + description) — PUT /api/rooms/{room_id}
- **D-15:** On 409 (duplicate name) throw error to keep modal open
- **D-16:** On 404 (room deleted by another user) show Toast error, close modal, refresh list
- **D-17:** On success: close modal, show Toast success, refresh the list

### Delete behavior
- **D-18:** "Elimina" danger button in actions column triggers ConfirmationDialog
- **D-19:** ConfirmDialog shows room name and device count: `Eliminare "Soggiorno" (3 dispositivi)?`
- **D-20:** On 404 (already deleted) show Toast error, refresh list
- **D-21:** On success: show Toast success, refresh the list
- **D-22:** API note: DELETE /rooms/{id} cascades device associations (devices stay in registry, only room membership removed) — no special handling needed

### Data fetching
- **D-23:** Create `useRooms` hook inline in the page file — simple fetch-on-mount, no polling (rooms change rarely)
- **D-24:** Hook calls `/api/rooms` (Next.js proxy route) — returns `Room[]` array
- **D-25:** Expose `{ rooms, loading, error, refetch }` — refetch called after create/edit/delete mutations
- **D-26:** Mutations call `/api/rooms` (POST), `/api/rooms/{id}` (PUT), `/api/rooms/{id}` (DELETE) directly via fetch

### Health stats
- **D-27:** Display rooms health stats inline in Card header — same pattern as Phase 121 registry health
- **D-28:** `useRoomsHealth` hook fetches GET /api/rooms/health — non-critical (errors silently ignored)
- **D-29:** Show: room_count, total_device_count, orphan_device_count — three stat values

### Error & loading states
- **D-30:** Loading state: Skeleton placeholder matching table shape
- **D-31:** Error state: Banner variant="error" with error message
- **D-32:** Empty state: centered message "Nessuna stanza creata" + "Crea stanza" button

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether description column is truncated at N chars or hidden on mobile
- Import organization and JSDoc style

</decisions>

<specifics>
## Specific Ideas

- Italian language for all UI labels (consistent with rest of app): "Stanze", "Crea stanza", "Modifica", "Elimina", "Nome", "Descrizione"
- Follow Phase 120 (types page) and Phase 121 (devices page) patterns exactly — same SettingsLayout, DataTable, FormModal, ConfirmationDialog, Toast flow
- The "Frontend Component Suggestions" in docs/api/rooms.md suggest Table + Modal Form + ConfirmDialog — align with those
- Description field is optional with null support — ensure the FormModal handles empty string → null conversion for the API

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rooms API contract
- `docs/api/rooms.md` §Room CRUD — GET/POST/PUT/DELETE endpoints, request/response shapes, error codes (409 duplicate name, 404 not found)
- `docs/api/rooms.md` §Status & Health — GET /rooms/health endpoint for room/device stats
- `docs/api/rooms.md` §TypeScript Interfaces — Room, RoomCreate, RoomUpdate, RoomsHealthResponse interfaces

### Existing API layer (Phase 119)
- `lib/rooms/roomsProxy.ts` — Server-side proxy (NOT used by client components — reference only)
- `types/rooms.ts` — Room, RoomCreate, RoomUpdate, RoomsHealthResponse type definitions (import these in the page)
- `app/api/rooms/route.ts` — GET (list) + POST (create) proxy route (client fetches this)
- `app/api/rooms/[room_id]/route.ts` — GET + PUT (update) + DELETE proxy route (client fetches this)
- `app/api/rooms/health/route.ts` — GET health stats proxy route

### UI component patterns (reference implementations)
- `app/registry/types/page.tsx` — Phase 120 Device Types page: useDeviceTypes hook, DataTable, FormModal create, ConfirmationDialog delete
- `app/registry/devices/page.tsx` — Phase 121 Device Registry page: pagination, filter, health stats inline, register/update/unregister modals
- `app/components/ui/DataTable.tsx` — TanStack Table component with sorting
- `app/components/ui/FormModal.tsx` — React Hook Form + Zod validation modal
- `app/components/ui/ConfirmationDialog.tsx` — Delete confirmation dialog
- `app/components/ui/SettingsLayout.tsx` — Page layout with back button and heading

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: TanStack Table v8 with sorting — use for room list
- `FormModal` component: React Hook Form + Zod, error on throw to keep modal open — use for create and edit
- `ConfirmationDialog` component: simple confirm/cancel — use for delete confirmation
- `SettingsLayout` component: consistent page chrome (back button, title, icon)
- `Toast` via `useToast()`: `success()` and `error()` helpers for transient feedback
- `Badge`: device count display
- `Banner`: persistent error state display
- `Skeleton`: loading placeholder
- `Room`, `RoomCreate`, `RoomUpdate`, `RoomsHealthResponse` types already in `types/rooms.ts`

### Established Patterns
- Client pages use `fetch()` to call Next.js API routes (not server-side proxy modules)
- Hook pattern: `useState` + `useCallback` + `useEffect` for fetch-on-mount with refetch
- Toast state via `useToast()` hook (not manual useState)
- Throw in `onSubmit` to keep FormModal open on conflict errors (409)
- Health stats: inline in Card header, non-critical (errors silently ignored)
- `'use client'` directive required for all interactive pages
- Italian locale for sorting: `.localeCompare(b.name, 'it')`
- Date formatting: `new Date(timestamp * 1000).toLocaleDateString('it-IT')`

### Integration Points
- `app/rooms/page.tsx` — new page file (new directory `app/rooms/`)
- Fetches from existing API routes: GET/POST `/api/rooms`, PUT/DELETE `/api/rooms/{id}`, GET `/api/rooms/health`
- Imports types from `types/rooms.ts` (Room, RoomCreate, RoomUpdate, RoomsHealthResponse)

</code_context>

<deferred>
## Deferred Ideas

- Room Device Assignment UI (assign/remove devices within rooms) — Phase 123
- Room Status Views (per-room + whole-house aggregated status) — Phase 124
- Navigation hub page linking types, devices, rooms — future backlog
- Room icons or color coding — future enhancement

</deferred>

---

*Phase: 122-room-management-ui*
*Context gathered: 2026-03-23*
