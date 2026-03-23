# Phase 123: Room Device Assignment - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

UI to view devices within a room and assign or remove devices to organize the smart home. Users navigate from the rooms list (Phase 122) into a room detail view showing its devices, then assign devices from the registry or remove them. The API routes already exist from Phase 119: GET/POST /rooms/{id}/devices and DELETE /rooms/{id}/devices/{device_registry_id}. Room CRUD (Phase 122) and room status views (Phase 124) are separate.

</domain>

<decisions>
## Implementation Decisions

### Page location & navigation
- **D-01:** New page at `app/rooms/[room_id]/page.tsx` — `/rooms/{room_id}` route (dynamic segment)
- **D-02:** Back button navigates to `/rooms` (rooms list page) — natural parent
- **D-03:** Page uses `SettingsLayout` with standard pattern: back button, Heading with room name, Text showing room description, then Card content — identical to Phase 120/121/122 pages
- **D-04:** Entry point from rooms list: add "Dispositivi" ghost button in rooms DataTable actions column that navigates to `/rooms/{room_id}` via `router.push`
- **D-05:** Room metadata (name, description) fetched via GET `/api/rooms/{room_id}` on mount for the heading

### Device list display
- **D-06:** Use DataTable (TanStack Table) to list devices in the room — columns: custom_name, provider_name (Badge), device_type_slug, actions (remove button)
- **D-07:** No pagination needed — room device count is small (typically <20), fetch all via GET `/api/rooms/{room_id}/devices`
- **D-08:** Sort by custom_name alphabetically using Italian locale by default
- **D-09:** Provider column uses Badge with same variant mapping as Phase 121 (hue→ocean, netatmo→ember, thermorossi→ember, dirigera→neutral, raspi→neutral, fritzbox→neutral)

### Assign device UX
- **D-10:** "Assegna dispositivo" button above the table opens a FormModal
- **D-11:** FormModal contains a single Select field: choose a device from the registry
- **D-12:** Select options fetched from GET `/api/registry/devices` (all devices, limit=1000) — show `custom_name (provider_name)` as label, `id` as value
- **D-13:** Devices already assigned to THIS room are excluded from the Select options
- **D-14:** Devices assigned to OTHER rooms are shown in the Select (API handles implicit move — response includes `previous_room_id`)
- **D-15:** On success (200): close modal, Toast success "Dispositivo assegnato", refresh device list. If `previous_room_id !== null`, toast includes "(spostato da altra stanza)"
- **D-16:** On 404 (room or device not found): Toast error, close modal, refresh list
- **D-17:** Zod validation: device_registry_id required (number, positive integer)

### Remove device UX
- **D-18:** "Rimuovi" danger button in actions column triggers ConfirmationDialog
- **D-19:** ConfirmDialog shows device custom_name and provider_name: `Rimuovere "Lampada Soggiorno" (hue) dalla stanza?`
- **D-20:** On success (204): Toast success "Dispositivo rimosso dalla stanza", refresh device list
- **D-21:** On 404 (already removed): Toast error, refresh list

### Data fetching
- **D-22:** Create `useRoomDevices` hook inline in the page file — fetches GET `/api/rooms/{room_id}/devices`, returns `{ devices: RegistryDevice[], loading, error, refetch }`
- **D-23:** Create `useRoom` hook inline — fetches GET `/api/rooms/{room_id}`, returns `{ room: Room | null, loading, error }` (for heading/description)
- **D-24:** Fetch all registry devices for the Select via inline `useRegistryDevicesForSelect` hook — GET `/api/registry/devices?limit=1000`, non-critical (errors silently ignored, Select shows empty)
- **D-25:** Mutations call fetch directly: POST `/api/rooms/{room_id}/devices` (assign), DELETE `/api/rooms/{room_id}/devices/{device_registry_id}` (remove)
- **D-26:** After assign/remove: refetch room devices list AND refetch registry devices (to update Select exclusion list)

### Error & loading states
- **D-27:** Loading state: Skeleton placeholder matching table shape (same pattern as Phase 122)
- **D-28:** Error state (room fetch): Banner variant="error" — could mean room doesn't exist (deleted)
- **D-29:** Error state (devices fetch): Banner variant="error" with error message
- **D-30:** Empty state (no devices assigned): centered message "Nessun dispositivo assegnato" + "Assegna dispositivo" button

### Rooms page integration
- **D-31:** Modify existing `app/rooms/page.tsx` to add a "Dispositivi" column/button in the DataTable actions — navigates to `/rooms/{room_id}`
- **D-32:** Import `useRouter` from `next/navigation` for programmatic navigation (or use `Link` component)

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether to show device_id column in the room devices table (probably not — custom_name + provider is enough)
- Select dropdown visual styling (size, placeholder text)
- Whether "Dispositivi" button shows device count badge next to it

</decisions>

<specifics>
## Specific Ideas

- Italian language for all UI labels: "Dispositivi nella stanza", "Assegna dispositivo", "Rimuovi", "Nessun dispositivo assegnato"
- Follow Phase 122 (rooms page) pattern exactly for layout, toast handling, FormModal/ConfirmationDialog integration
- The API does implicit move when assigning a device already in another room — the UI should acknowledge this in the success toast but not require user confirmation (keeps it simple)
- The Select for assigning devices should show enough info to identify the device: custom_name + provider_name in parentheses
- Fetching all registry devices (limit=1000) is acceptable for v15.0 — the registry is small (typically <50 devices)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rooms API contract — Device Association
- `docs/api/rooms.md` §Device Association — GET/POST /rooms/{id}/devices, DELETE /rooms/{id}/devices/{device_registry_id}: request/response shapes, error codes (404 room/device not found)
- `docs/api/rooms.md` §TypeScript Interfaces — DeviceAssignment (response from POST assign), RegistryDevice (response from GET room devices)

### Registry API contract — Device list for Select
- `docs/api/registry.md` §Devices — GET /registry/devices with limit/offset: PaginatedResponse<RegistryDevice> for populating the assign dropdown

### Existing API layer (Phase 119)
- `app/api/rooms/[room_id]/devices/route.ts` — GET (list room devices) + POST (assign device) proxy route
- `app/api/rooms/[room_id]/devices/[device_registry_id]/route.ts` — DELETE (remove device) proxy route
- `app/api/rooms/[room_id]/route.ts` — GET (single room) for heading metadata

### Existing API layer (Phase 118)
- `app/api/registry/devices/route.ts` — GET (all devices, paginated) for Select dropdown population

### Type definitions
- `types/rooms.ts` — Room, DeviceAssignment types
- `types/registry.ts` — RegistryDevice type (used for room device list and Select options)
- `types/common.ts` — PaginatedResponse<T> (for registry devices fetch)

### UI component patterns (reference implementations)
- `app/rooms/page.tsx` — Phase 122 Rooms page: useRooms hook, DataTable, FormModal, ConfirmationDialog, Toast integration — MODIFY to add "Dispositivi" navigation button
- `app/registry/devices/page.tsx` — Phase 121 Device Registry page: useRegistryDevices pattern for fetching all devices
- `app/components/ui/DataTable.tsx` — TanStack Table with sorting
- `app/components/ui/FormModal.tsx` — React Hook Form + Zod validation modal
- `app/components/ui/ConfirmationDialog.tsx` — Delete confirmation dialog
- `app/components/ui/Select.tsx` — Dropdown for device selection in assign form
- `app/components/ui/SettingsLayout.tsx` — Page layout with back button and heading

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: TanStack Table v8 with sorting — use for room device list
- `FormModal` component: React Hook Form + Zod, throw to keep open on error — use for assign device modal
- `ConfirmationDialog` component: simple confirm/cancel — use for remove device confirmation
- `Select` component: Radix-based dropdown — use for device picker in assign form
- `SettingsLayout` component: page layout wrapper with back button and title
- `Badge` component: provider distinction (ocean/ember/neutral variants)
- `useToast` hook: `{ success, error }` for transient feedback
- `Room`, `DeviceAssignment` types in `types/rooms.ts`
- `RegistryDevice` type in `types/registry.ts`
- `PaginatedResponse<T>` in `types/common.ts`

### Established Patterns
- Client pages use `fetch()` to call Next.js API routes (not server-side proxy modules)
- Hook pattern: `useState` + `useCallback` + `useEffect` for fetch-on-mount with refetch
- Toast pattern: `const { success: toastSuccess, error: toastError } = useToast()`
- FormModal throw on error to keep modal open; success proceeds to close
- ConfirmationDialog with `isOpen={item !== null}` / `onClose={() => setItem(null)}`
- Refetch after mutations to refresh list
- `'use client'` directive on all interactive pages
- Italian locale for sorting: `.localeCompare(b.name, 'it')`
- Badge variant mapping for providers: hue→ocean, netatmo/thermorossi→ember, others→neutral
- Health stats inline in Card header, non-critical (errors silently ignored)

### Integration Points
- `app/rooms/[room_id]/page.tsx` — NEW page file (new dynamic directory under existing `app/rooms/`)
- `app/rooms/page.tsx` — MODIFY to add "Dispositivi" navigation button in DataTable actions
- Fetches from existing API routes: GET `/api/rooms/{id}`, GET/POST `/api/rooms/{id}/devices`, DELETE `/api/rooms/{id}/devices/{device_id}`, GET `/api/registry/devices`
- Imports types from `types/rooms.ts` (Room, DeviceAssignment) and `types/registry.ts` (RegistryDevice)

</code_context>

<deferred>
## Deferred Ideas

- Room Status Views (per-room + whole-house aggregated live status) — Phase 124
- Drag-and-drop device assignment — explicitly out of scope per REQUIREMENTS.md
- Multi-select bulk assign (assign multiple devices at once) — future enhancement
- Visual indicator on rooms list showing which rooms have no devices (orphan rooms) — future enhancement
- Device search/filter within the assign Select dropdown — future enhancement (Select doesn't support search well)

</deferred>

---

*Phase: 123-room-device-assignment*
*Context gathered: 2026-03-23*
