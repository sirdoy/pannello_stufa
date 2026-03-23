# Phase 123: Room Device Assignment - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15.5 client pages — room detail view, DataTable, FormModal with Select, ConfirmationDialog
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** New page at `app/rooms/[room_id]/page.tsx` — `/rooms/{room_id}` route (dynamic segment)
- **D-02:** Back button navigates to `/rooms` (rooms list page) — natural parent
- **D-03:** Page uses `SettingsLayout` with standard pattern: back button, Heading with room name, Text showing room description, then Card content — identical to Phase 120/121/122 pages
- **D-04:** Entry point from rooms list: add "Dispositivi" ghost button in rooms DataTable actions column that navigates to `/rooms/{room_id}` via `router.push`
- **D-05:** Room metadata (name, description) fetched via GET `/api/rooms/{room_id}` on mount for the heading
- **D-06:** Use DataTable (TanStack Table) to list devices in the room — columns: custom_name, provider_name (Badge), device_type_slug, actions (remove button)
- **D-07:** No pagination needed — room device count is small (typically <20), fetch all via GET `/api/rooms/{room_id}/devices`
- **D-08:** Sort by custom_name alphabetically using Italian locale by default
- **D-09:** Provider column uses Badge with same variant mapping as Phase 121 (hue→ocean, netatmo→ember, thermorossi→ember, dirigera→neutral, raspi→neutral, fritzbox→neutral)
- **D-10:** "Assegna dispositivo" button above the table opens a FormModal
- **D-11:** FormModal contains a single Select field: choose a device from the registry
- **D-12:** Select options fetched from GET `/api/registry/devices` (all devices, limit=1000) — show `custom_name (provider_name)` as label, `id` as value
- **D-13:** Devices already assigned to THIS room are excluded from the Select options
- **D-14:** Devices assigned to OTHER rooms are shown in the Select (API handles implicit move — response includes `previous_room_id`)
- **D-15:** On success (200): close modal, Toast success "Dispositivo assegnato", refresh device list. If `previous_room_id !== null`, toast includes "(spostato da altra stanza)"
- **D-16:** On 404 (room or device not found): Toast error, close modal, refresh list
- **D-17:** Zod validation: device_registry_id required (number, positive integer)
- **D-18:** "Rimuovi" danger button in actions column triggers ConfirmationDialog
- **D-19:** ConfirmDialog shows device custom_name and provider_name: `Rimuovere "Lampada Soggiorno" (hue) dalla stanza?`
- **D-20:** On success (204): Toast success "Dispositivo rimosso dalla stanza", refresh device list
- **D-21:** On 404 (already removed): Toast error, refresh list
- **D-22:** Create `useRoomDevices` hook inline in the page file — fetches GET `/api/rooms/{room_id}/devices`, returns `{ devices: RegistryDevice[], loading, error, refetch }`
- **D-23:** Create `useRoom` hook inline — fetches GET `/api/rooms/{room_id}`, returns `{ room: Room | null, loading, error }` (for heading/description)
- **D-24:** Fetch all registry devices for the Select via inline `useRegistryDevicesForSelect` hook — GET `/api/registry/devices?limit=1000`, non-critical (errors silently ignored, Select shows empty)
- **D-25:** Mutations call fetch directly: POST `/api/rooms/{room_id}/devices` (assign), DELETE `/api/rooms/{room_id}/devices/{device_registry_id}` (remove)
- **D-26:** After assign/remove: refetch room devices list AND refetch registry devices (to update Select exclusion list)
- **D-27:** Loading state: Skeleton placeholder matching table shape (same pattern as Phase 122)
- **D-28:** Error state (room fetch): Banner variant="error" — could mean room doesn't exist (deleted)
- **D-29:** Error state (devices fetch): Banner variant="error" with error message
- **D-30:** Empty state (no devices assigned): centered message "Nessun dispositivo assegnato" + "Assegna dispositivo" button
- **D-31:** Modify existing `app/rooms/page.tsx` to add a "Dispositivi" column/button in the DataTable actions — navigates to `/rooms/{room_id}`
- **D-32:** Import `useRouter` from `next/navigation` for programmatic navigation (or use `Link` component)

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether to show device_id column in the room devices table (probably not — custom_name + provider is enough)
- Select dropdown visual styling (size, placeholder text)
- Whether "Dispositivi" button shows device count badge next to it

### Deferred Ideas (OUT OF SCOPE)
- Room Status Views (per-room + whole-house aggregated live status) — Phase 124
- Drag-and-drop device assignment — explicitly out of scope per REQUIREMENTS.md
- Multi-select bulk assign (assign multiple devices at once) — future enhancement
- Visual indicator on rooms list showing which rooms have no devices (orphan rooms) — future enhancement
- Device search/filter within the assign Select dropdown — future enhancement (Select doesn't support search well)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-05 | User can view devices assigned to a room | `useRoomDevices` hook + DataTable pattern from Phase 122; GET `/api/rooms/{room_id}/devices` returns `RegistryDevice[]` |
| ROOM-06 | User can assign a device to a room (implicit move from previous room) | FormModal + Select pattern from Phase 121; POST `/api/rooms/{room_id}/devices` returns `DeviceAssignment` with `previous_room_id`; filter assigned devices from Select options |
| ROOM-07 | User can remove a device from a room | ConfirmationDialog pattern from Phase 122; DELETE `/api/rooms/{room_id}/devices/{device_registry_id}` returns 204 |
</phase_requirements>

---

## Summary

Phase 123 implements the room detail page at `app/rooms/[room_id]/page.tsx`. This is a pure UI phase — all API routes already exist from Phases 118 and 119. The pattern is well-established: identical to Phase 122 (rooms list) with the addition of a FormModal containing a Select for device assignment.

The key technical challenge is the Select options filtering: devices already in THIS room must be excluded from the dropdown (client-side filter using the room's current device list), while devices in other rooms remain available (API handles the implicit move). The assign response includes `previous_room_id` so the success toast can conditionally say "(spostato da altra stanza)".

The `rooms/page.tsx` modification (D-31/D-32) adds a third "Dispositivi" ghost button to the existing actions column, navigating to `/rooms/{room_id}`.

**Primary recommendation:** Copy the Phase 122 page structure exactly — same hook pattern, same component imports, same test mock pattern. The only new element is the Select inside FormModal for device assignment.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Hook Form | (via FormModal) | Form state + validation | Already wrapped in FormModal component |
| Zod | (via FormModal) | Schema validation | Project standard, FormModal accepts `validationSchema` |
| TanStack Table v8 | (via DataTable) | Table rendering | Already wrapped in DataTable component |
| Radix UI Select | (via Select component) | Accessible dropdown | Already wrapped in Select component |
| next/navigation | Next.js 15.5 | `useRouter` for programmatic navigation | Next.js built-in |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useToast` hook | project | `{ success, error }` for transient feedback | All mutation results |
| `RegistryDevice` | types/registry.ts | Type for both room device list and Select options | Both GET endpoints return this shape |
| `DeviceAssignment` | types/rooms.ts | Type for POST assign response | Needed to read `previous_room_id` |
| `Room` | types/rooms.ts | Type for heading/description | useRoom hook |

**Installation:** No new dependencies. All components and types are already in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
app/rooms/
├── page.tsx                  # MODIFY — add "Dispositivi" button to actions column
├── __tests__/
│   └── page.test.tsx         # MODIFY — add Test 18+ for "Dispositivi" button navigation
└── [room_id]/
    ├── page.tsx              # NEW — room detail + device assignment
    └── __tests__/
        └── page.test.tsx     # NEW — tests for ROOM-05, ROOM-06, ROOM-07
```

### Pattern 1: Inline hooks in page file (established project pattern)
**What:** Three inline hooks at the top of the page component file — `useRoom`, `useRoomDevices`, `useRegistryDevicesForSelect`.
**When to use:** All page-scoped hooks in this project follow this pattern (see Phase 121, 122).
**Example:**
```typescript
// Source: app/rooms/page.tsx (Phase 122 pattern)
function useRoom(roomId: number) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error('Stanza non trovata');
      setRoom((await res.json()) as Room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { room, loading, error };
}
```

### Pattern 2: Non-critical hook (silently ignored errors)
**What:** `useRegistryDevicesForSelect` follows the non-critical pattern — errors don't block the page.
**When to use:** When the data is supplementary (Select options) and the page still works if it fails.
**Example:**
```typescript
// Source: app/registry/devices/page.tsx (useDeviceTypesForSelect — Phase 121)
function useRegistryDevicesForSelect() {
  const [allDevices, setAllDevices] = useState<RegistryDevice[]>([]);
  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/registry/devices?limit=1000');
      if (!res.ok) return;
      const data = (await res.json()) as PaginatedResponse<RegistryDevice>;
      setAllDevices(data.items);
    } catch { /* non-critical */ }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { allDevices, refetch };
}
```

### Pattern 3: Select options filtering (client-side)
**What:** Filter the full registry device list to exclude devices already in this room.
**When to use:** When the Select options depend on another fetched list (the room's current devices).
**Example:**
```typescript
// Derived from CONTEXT.md D-13/D-14
const assignedIds = new Set(devices.map((d) => d.id));
const selectOptions = allDevices
  .filter((d) => !assignedIds.has(d.id))
  .sort((a, b) => a.custom_name.localeCompare(b.custom_name, 'it'))
  .map((d) => ({
    value: d.id,
    label: `${d.custom_name} (${d.provider_name})`,
  }));
```

### Pattern 4: Dynamic route — `useParams` for room_id
**What:** Next.js 15.5 dynamic routes use `useParams()` from `next/navigation` in client components.
**When to use:** Client pages under `[room_id]` dynamic segment.
**Example:**
```typescript
'use client';
import { useParams } from 'next/navigation';

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = Number(params['room_id']);
  // ...
}
```

### Pattern 5: FormModal with Select (Zod schema for numeric id)
**What:** The assign form schema needs `device_registry_id` as a positive integer. Select's `onChange` returns the raw value from the options array — `id` is a number in `RegistryDevice`, so `Select` preserves the number type.
**When to use:** FormModal with a numeric Select field (not string).
**Example:**
```typescript
// Zod: per D-17
const assignSchema = z.object({
  device_registry_id: z.number().int().positive('Seleziona un dispositivo'),
});
type AssignFormData = z.infer<typeof assignSchema>;

// Select inside FormModal render prop:
<Controller
  name="device_registry_id"
  control={control}
  render={({ field, fieldState }) => (
    <Select
      label="Dispositivo"
      placeholder="Seleziona un dispositivo..."
      options={selectOptions}
      value={field.value}
      onChange={(e) => field.onChange(Number(e.target.value))}
    />
  )}
/>
```

### Pattern 6: Conditional toast message (previous_room_id)
**What:** POST assign returns `DeviceAssignment` with `previous_room_id: number | null`. If non-null, append "(spostato da altra stanza)" to the success toast.
**Example:**
```typescript
// Source: CONTEXT.md D-15
const handleAssign = async (data: AssignFormData) => {
  const res = await fetch(`/api/rooms/${roomId}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_registry_id: data.device_registry_id }),
  });
  if (res.status === 404) {
    toastError('Dispositivo o stanza non trovata');
    setShowAssign(false);
    await refetchDevices();
    await refetchAllDevices();
    return;
  }
  if (!res.ok) throw new Error('Errore durante l\'assegnazione');
  const assignment = (await res.json()) as DeviceAssignment;
  const msg = assignment.previous_room_id !== null
    ? 'Dispositivo assegnato (spostato da altra stanza)'
    : 'Dispositivo assegnato';
  toastSuccess(msg);
  setShowAssign(false);
  await refetchDevices();
  await refetchAllDevices();
};
```

### Pattern 7: rooms/page.tsx modification — adding "Dispositivi" button
**What:** Add a third button to the existing actions column in `app/rooms/page.tsx`. Use `useRouter` from `next/navigation` for `router.push`.
**Example:**
```typescript
// Add to existing columns definition in app/rooms/page.tsx
import { useRouter } from 'next/navigation';

// Inside RoomsPage component:
const router = useRouter();

// In actions column cell:
<Button variant="ghost" size="sm" onClick={() => router.push(`/rooms/${row.original.id}`)}>
  Dispositivi
</Button>
```

### Anti-Patterns to Avoid
- **Passing `room_id` as a prop:** Use `useParams()` in the client component to read the dynamic segment directly.
- **Forgetting to refetch allDevices after assign/remove:** Per D-26, both `refetchDevices` and `refetchAllDevices` must be called after mutations — otherwise the Select exclusion list is stale.
- **Throwing inside handleRemove for 404:** Per D-21, 404 on remove is a toast+refresh (not throw-to-keep-open), because the dialog should close even on error.
- **Using `created()` for POST assign:** Confirmed in Phase 119 STATE.md: POST /rooms/{id}/devices uses `success()` (200) not `created()` (201) — this is the Next.js proxy, no change needed here.
- **Forgetting `key` prop on edit FormModal:** Phase 122 uses `key={roomToEdit?.id ?? 'new'}` to remount FormModal on item change. The assign modal doesn't need this (only one modal, always same form).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + validation | Custom form handler | `FormModal` with `validationSchema` | Already handles RHF + Zod + error display + throw-to-keep-open |
| Accessible dropdown | Custom `<select>` | `Select` (Radix-based) | Keyboard navigation, portal rendering, animation, dark mode |
| Delete confirmation | Inline confirm state | `ConfirmationDialog` | Consistent UX, accessible dialog, variant="danger" |
| Table rendering | Custom `<table>` | `DataTable` | TanStack Table v8, sorting, consistent Ember Noir styling |
| Toast notifications | Custom toast | `useToast` | `{ success, error }` API, existing infra |
| Page layout | Custom layout | `SettingsLayout` | Back button, title heading, consistent with all settings pages |

**Key insight:** This phase introduces zero new infrastructure. Every UI primitive, hook pattern, and API route is already in place. The entire implementation is composition of existing pieces.

---

## Common Pitfalls

### Pitfall 1: Numeric value loss in Select
**What goes wrong:** Zod schema expects `device_registry_id: z.number()`, but `Select.onChange` may return a string if `e.target.value` is cast. The Zod parse then fails with "Expected number, received string".
**Why it happens:** Select's simple API synthesizes an event `{ target: { value: originalValue } }`. If `value` is a number in options, it preserves the number — but the Controller's `onChange` must explicitly call `Number(e.target.value)` to be safe.
**How to avoid:** Always wrap the Select `onChange` in `field.onChange(Number(e.target.value))` when the Zod field is `z.number()`.
**Warning signs:** Zod validation error "Expected number, received string" even after selecting a value.

### Pitfall 2: Missing `useParams` import for dynamic route
**What goes wrong:** `params` is undefined or TypeScript error on `params['room_id']`.
**Why it happens:** In Next.js 15 App Router, client components under dynamic segments must use `useParams()` from `next/navigation` — they cannot receive params as props by default.
**How to avoid:** Import `useParams` from `next/navigation`. Cast `params['room_id']` to string/number: `Number(params['room_id'] as string)`.
**Warning signs:** `params` is `null` or TypeScript error "Property 'room_id' does not exist on type".

### Pitfall 3: Select placeholder not shown when value is 0 or undefined
**What goes wrong:** Select shows blank instead of "Seleziona un dispositivo..." placeholder.
**Why it happens:** Radix Select shows placeholder only when value is `undefined`. If the Zod default is `0` or RHF initializes the field as `null`, Radix treats it as a selected empty value.
**How to avoid:** Set RHF `defaultValues` to `{ device_registry_id: 0 }` and keep Zod schema as `z.number().positive()` — `positive()` will reject 0, and Select shows blank which reads as placeholder visually. Or use `undefined` as defaultValue.
**Warning signs:** "Seleziona..." placeholder never shows; Select appears blank without placeholder text.

### Pitfall 4: Stale Select options after assign/remove
**What goes wrong:** After assigning a device, it still appears in the Select options (not excluded).
**Why it happens:** Forgetting to call `refetchAllDevices()` after the mutation — the `useRegistryDevicesForSelect` hook's state is stale.
**How to avoid:** Per D-26, always call both `refetchDevices()` and `refetchAllDevices()` after assign and remove operations.
**Warning signs:** Assigned device still visible in Select dropdown after successful assignment.

### Pitfall 5: `app/rooms/page.tsx` test breakage from adding "Dispositivi" button
**What goes wrong:** Existing tests in `app/rooms/__tests__/page.test.tsx` may fail because `getAllByRole('button', { name: /elimina/i })` index or `querySelectorAll('button')[1]` (the delete button) shifts to `[2]` when a third "Dispositivi" button is added.
**Why it happens:** Tests that select action buttons by index (e.g., `querySelectorAll('button')[1]`) are brittle when column button order changes.
**How to avoid:** When modifying `app/rooms/page.tsx`, check existing tests. The current tests use `querySelectorAll('button')[1]` for the delete button in the actions cell — adding "Dispositivi" as the first button (index [0]) shifts "Modifica" to [1] and "Elimina" to [2]. Update tests accordingly. Better: add "Dispositivi" AFTER "Modifica" and "Elimina" to minimize test impact — or place it first but update tests.
**Warning signs:** Existing Test 15/16 (ROOM-04 delete) fail after rooms/page.tsx modification.

### Pitfall 6: 404 on assign should NOT throw (modal should close)
**What goes wrong:** If 404 is handled with `throw new Error(...)`, FormModal keeps itself open (throw-to-keep-open pattern). But D-16 says on 404: "Toast error, close modal, refresh list" — the modal SHOULD close.
**Why it happens:** Confusing the 409/422 error case (throw to keep modal open) with the 404 case (device/room deleted — close modal and refresh).
**How to avoid:** For 404 in handleAssign: call `toastError(...)`, set `setShowAssign(false)`, refetch, and `return` — do NOT throw.

---

## Code Examples

### useRoomDevices hook
```typescript
// Source: app/rooms/page.tsx (Phase 122 useRooms pattern)
function useRoomDevices(roomId: number) {
  const [devices, setDevices] = useState<RegistryDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/devices`);
      if (!res.ok) throw new Error('Errore nel caricamento dei dispositivi');
      const data = (await res.json()) as RegistryDevice[];
      setDevices([...data].sort((a, b) => a.custom_name.localeCompare(b.custom_name, 'it')));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { devices, loading, error, refetch };
}
```

### Provider badge variant helper (identical to Phase 121)
```typescript
// Source: app/registry/devices/page.tsx (Phase 121)
function getProviderBadgeVariant(provider: string): 'ocean' | 'ember' | 'neutral' {
  if (provider === 'hue') return 'ocean';
  if (provider === 'netatmo' || provider === 'thermorossi') return 'ember';
  return 'neutral'; // dirigera, raspi, fritzbox
}
```

### DataTable columns for room device list
```typescript
// Source: CONTEXT.md D-06, verified against Phase 122 pattern
const columns: ColumnDef<RegistryDevice>[] = [
  { accessorKey: 'custom_name', header: 'Dispositivo', enableSorting: true },
  {
    accessorKey: 'provider_name',
    header: 'Provider',
    cell: ({ row }) => (
      <Badge variant={getProviderBadgeVariant(row.original.provider_name)} size="sm">
        {row.original.provider_name}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'device_type_slug',
    header: 'Tipo',
    cell: ({ row }) => (
      <code className="text-sm font-mono text-slate-400">{row.original.device_type_slug}</code>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button variant="danger" size="sm" onClick={() => setDeviceToRemove(row.original)}>
        Rimuovi
      </Button>
    ),
    enableSorting: false,
  },
];
```

### API contracts confirmed
```
GET  /api/rooms/{room_id}               → Room (no device_count)
GET  /api/rooms/{room_id}/devices       → RegistryDevice[]  (public, no auth)
POST /api/rooms/{room_id}/devices       → DeviceAssignment  (auth required, 200 not 201)
DELETE /api/rooms/{room_id}/devices/{id} → 204 empty        (auth required)
GET  /api/registry/devices?limit=1000   → PaginatedResponse<RegistryDevice>  (auth required)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js page props for `params` | `useParams()` from `next/navigation` | Next.js 13+ App Router | Client components cannot receive params as props in App Router |
| Direct Hue/Netatmo API calls | HA proxy via haGet/haPost | Phase 84–86 | All device API calls go through shared proxy; no direct device APIs |

---

## Open Questions

1. **"Dispositivi" button position in rooms/page.tsx actions column**
   - What we know: Current actions cell has two buttons in order: "Modifica" (ghost) then "Elimina" (danger)
   - What's unclear: Whether to add "Dispositivi" before or after these two. Adding it first (index 0) would shift existing buttons and break tests at lines 537, 558 that use `querySelectorAll('button')[1]` for delete.
   - Recommendation: Add "Dispositivi" as the FIRST button in the cell (leftmost). This is consistent with navigation actions preceding destructive actions. Update existing test lines 537/558 to use `[2]` instead of `[1]`. Document this in the plan as a test update step.

2. **SettingsLayout `title` prop for room detail page**
   - What we know: `SettingsLayout` accepts a `title` prop. The room name comes from `useRoom` which is async.
   - What's unclear: Whether to show "Caricamento..." or an empty string until room loads.
   - Recommendation: Pass `room?.name ?? 'Caricamento...'` as the title. This matches the loading UX of other settings pages.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library (project standard) |
| Config file | jest.config.ts (root) |
| Quick run command | `npm test -- --testPathPattern="rooms/\[room_id\]"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROOM-05 | Room detail page renders device list from GET /api/rooms/{id}/devices | unit | `npm test -- --testPathPattern="rooms/\[room_id\]" -t "ROOM-05"` | ❌ Wave 0 |
| ROOM-05 | Loading state shows Skeleton | unit | same suite | ❌ Wave 0 |
| ROOM-05 | Error state shows Banner | unit | same suite | ❌ Wave 0 |
| ROOM-05 | Empty state shows "Nessun dispositivo assegnato" | unit | same suite | ❌ Wave 0 |
| ROOM-06 | "Assegna dispositivo" button opens FormModal | unit | same suite | ❌ Wave 0 |
| ROOM-06 | handleAssign POSTs correct body to /api/rooms/{id}/devices | unit | same suite | ❌ Wave 0 |
| ROOM-06 | previous_room_id !== null triggers "(spostato da altra stanza)" toast | unit | same suite | ❌ Wave 0 |
| ROOM-06 | 404 on assign calls toastError + closes modal | unit | same suite | ❌ Wave 0 |
| ROOM-07 | "Rimuovi" button opens ConfirmationDialog with device name and provider | unit | same suite | ❌ Wave 0 |
| ROOM-07 | Confirm delete calls DELETE /api/rooms/{id}/devices/{device_id} | unit | same suite | ❌ Wave 0 |
| ROOM-07 | 404 on remove calls toastError and refetches | unit | same suite | ❌ Wave 0 |
| D-31 | rooms/page.tsx "Dispositivi" button navigates to /rooms/{id} | unit | `npm test -- --testPathPattern="rooms/__tests__/page"` | ❌ needs addition to existing file |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="rooms"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/rooms/[room_id]/__tests__/page.test.tsx` — covers ROOM-05, ROOM-06, ROOM-07
- [ ] `app/rooms/__tests__/page.test.tsx` — add Test 18 for "Dispositivi" button (D-31), update Tests 15/16 if button index shifts

*(No new test infra needed — existing Jest + RTL setup covers everything)*

---

## Sources

### Primary (HIGH confidence)
- `app/rooms/page.tsx` — Phase 122 implementation: exact hook pattern, FormModal usage, ConfirmationDialog, toast integration
- `app/registry/devices/page.tsx` — Phase 121 implementation: useDeviceTypesForSelect non-critical pattern, Select in FormModal
- `app/components/ui/Select.tsx` — Radix-based Select: `options` array API, `onChange` returns `{ target: { value: originalValue } }`, number values preserved
- `docs/api/rooms.md` — API contracts: GET/POST /rooms/{id}/devices and DELETE /rooms/{id}/devices/{device_id} — shapes, status codes confirmed
- `docs/api/registry.md` — GET /registry/devices?limit=1000 — PaginatedResponse<RegistryDevice>, auth required
- `types/rooms.ts` — Room, DeviceAssignment interfaces (including `previous_room_id: number | null`)
- `types/registry.ts` — RegistryDevice interface
- `app/api/rooms/[room_id]/devices/route.ts` — Proxy implementation confirmed: GET public, POST auth, returns success() (200)
- `app/api/rooms/[room_id]/devices/[device_registry_id]/route.ts` — DELETE auth, returns noContent() (204)
- `.planning/STATE.md` — Phase 119 decision: POST /rooms/{id}/devices uses success() (200) not created() (201)
- `app/rooms/__tests__/page.test.tsx` — existing test structure, mock patterns, button index positions

### Secondary (MEDIUM confidence)
- `.planning/phases/123-room-device-assignment/123-CONTEXT.md` — all 32 locked decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified by reading source code directly
- Architecture: HIGH — patterns copied from Phase 121/122 implementations
- Pitfalls: HIGH — derived from actual code inspection (Select numeric type, test button indices)
- API contracts: HIGH — read directly from docs/api/rooms.md and docs/api/registry.md

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable project, no external dependencies changing)
