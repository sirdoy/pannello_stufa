# Phase 122: Room Management UI - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15 client page — CRUD UI with DataTable, FormModal, ConfirmationDialog
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page location & navigation**
- D-01: New page at `app/rooms/page.tsx` — `/rooms` route
- D-02: Back button navigates to `/registry/devices` (device registry page)
- D-03: Page uses `SettingsLayout` with standard pattern: back button, Heading, Text description, then Card content — identical to Phase 120/121 pages

**List display format**
- D-04: Use DataTable (TanStack Table) to list rooms — columns: name, description (truncated), device_count, created_at (formatted date), actions
- D-05: No pagination — rooms list is small (<20 rooms), fetch all at once via GET /api/rooms
- D-06: Sort by name alphabetically using Italian locale by default
- D-07: device_count column shows a Badge with count ("3 dispositivi") — zero shows "0 dispositivi" in neutral variant

**Create form UX**
- D-08: "Crea stanza" button above the table opens a FormModal
- D-09: FormModal fields: name (text input, required, max 100 chars) + description (text input, optional, max 500 chars)
- D-10: Zod validation schema enforces name required (min 1) and max lengths client-side
- D-11: On 409 (room name already exists) throw error to keep modal open — same pattern as Phase 120 slug conflict
- D-12: On success: close modal, show Toast success, refresh the list

**Edit form UX**
- D-13: "Modifica" ghost button in actions column opens a FormModal pre-filled with current name and description
- D-14: FormModal fields: same as create (name + description) — PUT /api/rooms/{room_id}
- D-15: On 409 (duplicate name) throw error to keep modal open
- D-16: On 404 (room deleted by another user) show Toast error, close modal, refresh list
- D-17: On success: close modal, show Toast success, refresh the list

**Delete behavior**
- D-18: "Elimina" danger button in actions column triggers ConfirmationDialog
- D-19: ConfirmDialog shows room name and device count: `Eliminare "Soggiorno" (3 dispositivi)?`
- D-20: On 404 (already deleted) show Toast error, refresh list
- D-21: On success: show Toast success, refresh the list
- D-22: DELETE /rooms/{id} cascades device associations — no special handling needed

**Data fetching**
- D-23: Create `useRooms` hook inline in the page file — simple fetch-on-mount, no polling
- D-24: Hook calls `/api/rooms` — returns `Room[]` array
- D-25: Expose `{ rooms, loading, error, refetch }` — refetch called after mutations
- D-26: Mutations call `/api/rooms` (POST), `/api/rooms/{id}` (PUT), `/api/rooms/{id}` (DELETE) directly via fetch

**Health stats**
- D-27: Display rooms health stats inline in Card header — same pattern as Phase 121 registry health
- D-28: `useRoomsHealth` hook fetches GET /api/rooms/health — non-critical (errors silently ignored)
- D-29: Show: room_count, total_device_count, orphan_device_count — three stat values

**Error & loading states**
- D-30: Loading state: Skeleton placeholder matching table shape
- D-31: Error state: Banner variant="error" with error message
- D-32: Empty state: centered message "Nessuna stanza creata" + "Crea stanza" button

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether description column is truncated at N chars or hidden on mobile
- Import organization and JSDoc style

### Deferred Ideas (OUT OF SCOPE)
- Room Device Assignment UI (assign/remove devices within rooms) — Phase 123
- Room Status Views (per-room + whole-house aggregated status) — Phase 124
- Navigation hub page linking types, devices, rooms — future backlog
- Room icons or color coding — future enhancement
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-01 | User can view list of all rooms with device counts | GET /api/rooms returns Room[] with device_count; DataTable columns verified in Phase 121 pattern |
| ROOM-02 | User can create a new room with name and description | POST /api/rooms with RoomCreate body; FormModal + Zod schema pattern from Phase 120/121 |
| ROOM-03 | User can edit room name and description | PUT /api/rooms/{room_id} with RoomUpdate body; FormModal pre-filled pattern from Phase 121 update flow |
| ROOM-04 | User can delete a room with confirmation | DELETE /api/rooms/{room_id} returns 204; ConfirmationDialog pattern from Phase 120/121 |
</phase_requirements>

---

## Summary

Phase 122 is a focused CRUD UI page — the third in a series after Phase 120 (Device Types) and Phase 121 (Device Registry). All architectural decisions are locked and fully aligned with the established Phase 120/121 patterns. The API layer (Phase 119) is complete; types (`types/rooms.ts`) and all five API proxy routes exist and are tested.

The implementation is a single new file: `app/rooms/page.tsx`. It follows the exact same structure as `app/registry/devices/page.tsx`: an inline `useRooms` hook, an inline `useRoomsHealth` hook, DataTable with column definitions, FormModal for create, FormModal for edit (pre-filled), and ConfirmationDialog for delete. The only structural differences from Phase 121 are: no pagination (list is small), no filter select, and two FormModal instances sharing the same Zod schema (name + description).

The test file follows the Phase 121 pattern exactly: mock all UI components, route `global.fetch` by URL, write one test per behavior specified in ROOM-01 through ROOM-04. Expect approximately 14-16 test cases.

**Primary recommendation:** Model `app/rooms/page.tsx` directly on `app/registry/devices/page.tsx`, removing pagination/filter logic and adding the `useRoomsHealth` three-stat display. Copy the Phase 121 test structure verbatim, adjusting mock data and fetch URLs.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React / Next.js | 15.5 | Page component, `'use client'`, hooks | Project foundation |
| TanStack Table | v8 | DataTable backing — via `@tanstack/react-table` | Established in Phase 121 |
| React Hook Form | latest | Form state in FormModal — Controller pattern | Established in Phase 120/121 |
| Zod | latest | Client-side validation schema | Established in Phase 120/121 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/app/components/ui/DataTable` | internal | Table with sorting | Room list |
| `@/app/components/ui/FormModal` | internal | Modal with RHF+Zod | Create + edit forms |
| `@/app/components/ui/ConfirmationDialog` | internal | Confirm/cancel dialog | Delete confirmation |
| `@/app/components/ui/SettingsLayout` | internal | Page chrome (back btn, title, icon) | Page wrapper |
| `@/app/components/ui/Badge` | internal | device_count display | Count column cell |
| `@/app/components/ui/Banner` | internal | Error state | When fetch rejects |
| `@/app/components/ui/Skeleton` | internal | Loading state | While loading=true |
| `@/app/hooks/useToast` | internal | Toast notifications | Post-mutation feedback |

**Installation:** No new packages required — all dependencies already in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
app/
└── rooms/
    ├── page.tsx                  # Single file — all logic inline
    └── __tests__/
        └── page.test.tsx         # Jest + RTL test suite
```

### Pattern 1: Inline Hook + Page Component (Phase 121 model)

**What:** Three inline functions before the default export: `useRooms`, `useRoomsHealth`, and the page component itself.

**When to use:** Every page in this registry/rooms series uses this pattern.

**Example:**
```typescript
// Source: app/registry/devices/page.tsx (verified)
'use client';

import { useState, useEffect, useCallback } from 'react';
// ... imports

const roomSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
  description: z.string().max(500, 'Max 500 caratteri').nullable().optional(),
});

function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error('Errore nel caricamento delle stanze');
      const data = (await res.json()) as Room[];
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, 'it'));
      setRooms(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);
  return { rooms, loading, error, refetch };
}

function useRoomsHealth() {
  const [health, setHealth] = useState<RoomsHealthResponse | null>(null);
  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms/health');
      if (!res.ok) return; // silently ignore
      setHealth((await res.json()) as RoomsHealthResponse);
    } catch { /* non-critical */ }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { health, refetch };
}
```

### Pattern 2: FormModal with throw-to-keep-open (Phase 121 verified)

**What:** `onSubmit` handler throws an Error on 409 so FormModal stays open. On 404, shows Toast and closes.

```typescript
// Source: app/registry/devices/page.tsx (verified)
const handleCreate = async (data: RoomCreate) => {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 409) throw new Error('Stanza con questo nome già esistente');
  if (!res.ok) throw new Error('Errore durante la creazione');
  toastSuccess('Stanza creata');
  await refetch();
  await healthRefetch();
};

const handleEdit = async (data: RoomUpdate) => {
  if (!roomToEdit) return;
  const res = await fetch(`/api/rooms/${roomToEdit.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 409) throw new Error('Stanza con questo nome già esistente');
  if (res.status === 404) {
    toastError('Stanza non trovata');
    setRoomToEdit(null);
    await refetch();
    return;
  }
  if (!res.ok) throw new Error('Errore durante la modifica');
  toastSuccess('Stanza aggiornata');
  await refetch();
  await healthRefetch();
};
```

### Pattern 3: ConfirmationDialog for delete with 404 handling

```typescript
// Source: app/registry/devices/page.tsx (verified)
const handleDelete = async () => {
  if (!roomToDelete) return;
  const res = await fetch(`/api/rooms/${roomToDelete.id}`, { method: 'DELETE' });
  if (res.status === 404) {
    toastError('Stanza già eliminata');
    setRoomToDelete(null);
    await refetch();
    await healthRefetch();
    return;
  }
  if (!res.ok) {
    toastError("Errore durante l'eliminazione");
    setRoomToDelete(null);
    return;
  }
  toastSuccess('Stanza eliminata');
  setRoomToDelete(null);
  await refetch();
  await healthRefetch();
};
```

### Pattern 4: description null handling

**What:** API accepts `description: string | null`. FormModal returns empty string `""` for unfilled optional field. Must convert `""` → `null` before sending to API.

```typescript
// Apply in both handleCreate and handleEdit before fetch body:
const apiBody = {
  name: data.name,
  description: data.description?.trim() || null,
};
```

### Pattern 5: device_count Badge display

```typescript
// In DataTable column definition for device_count:
cell: ({ row }) => {
  const count = row.original.device_count ?? 0;
  return (
    <Badge variant="neutral" size="sm">
      {count} {count === 1 ? 'dispositivo' : 'dispositivi'}
    </Badge>
  );
},
```

### Pattern 6: Health stats inline in Card header

```typescript
// Source: app/registry/devices/page.tsx (verified)
{health && (
  <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
    <span>Stanze: <strong className="text-slate-200">{health.room_count}</strong></span>
    <span>Dispositivi assegnati: <strong className="text-slate-200">{health.total_device_count}</strong></span>
    <span>Orfani: <strong className="text-slate-200">{health.orphan_device_count}</strong></span>
  </div>
)}
```

### Pattern 7: Edit modal with pre-filled defaultValues

```typescript
// Source: app/registry/devices/page.tsx (verified)
<FormModal
  isOpen={roomToEdit !== null}
  onClose={() => setRoomToEdit(null)}
  onSubmit={handleEdit}
  title="Modifica stanza"
  defaultValues={
    roomToEdit
      ? { name: roomToEdit.name, description: roomToEdit.description ?? '' }
      : { name: '', description: '' }
  }
  validationSchema={roomSchema}
  submitLabel="Salva"
  cancelLabel="Annulla"
>
  {({ control }) => (
    <>
      <Controller name="name" control={control} render={...} />
      <Controller name="description" control={control} render={...} />
    </>
  )}
</FormModal>
```

### Anti-Patterns to Avoid

- **Using `description: ''` instead of `description: null` in API body:** The API stores `null` for empty optional fields. Send `null` when the user leaves description blank, not `""`.
- **Separate health Card:** Health stats go inline in the same Card header as the table (per D-27) — not a separate component.
- **Adding pagination:** Rooms list is small, no pagination needed (per D-05). Do not add `page`/`setPage` state.
- **Using `device_id` string for URL construction:** Room operations use numeric `room.id`, not a string slug (contrast with device types which use `slug`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schema + FormModal | Already handles errors, dirty state, disabled submit |
| Modal open/close | Custom modal div | FormModal + ConfirmationDialog | Already have focus trap, animation, backdrop |
| Table rendering | Custom table | DataTable (TanStack) | Sorting, column defs, variant="compact" already works |
| Toast feedback | Manual div + timer | useToast() | Already wired to toast provider |
| Date formatting | Custom formatDate | `new Date(ts * 1000).toLocaleDateString('it-IT')` | One-liner, proven pattern |

**Key insight:** This phase is 95% composition. All needed UI primitives exist and are tested. The only new work is wiring them together with the `/api/rooms` endpoints.

---

## Common Pitfalls

### Pitfall 1: description empty string vs null
**What goes wrong:** User clears description field → FormModal returns `""` → API receives `""` which may fail validation or store an empty string instead of null.
**Why it happens:** HTML input always returns string, never null.
**How to avoid:** In `handleCreate` and `handleEdit`, convert: `description: data.description?.trim() || null`.
**Warning signs:** API returns 422 or description stored as `""` in DB.

### Pitfall 2: DELETE response has no body (204)
**What goes wrong:** `await res.json()` on a 204 response throws a JSON parse error.
**Why it happens:** 204 No Content has no response body.
**How to avoid:** Only call `res.json()` on responses that have a body (POST 201, PUT 200, GET 200). For DELETE, check `res.ok` only.
**Warning signs:** `SyntaxError: Unexpected end of JSON input` in console after delete.

### Pitfall 3: FormModal key prop for defaultValues re-hydration
**What goes wrong:** When the user clicks "Modifica" on a second room after editing a first, FormModal shows the first room's values because React Hook Form doesn't re-initialize when `defaultValues` prop changes.
**Why it happens:** RHF initializes on mount, not on prop change.
**How to avoid:** Pass `key={roomToEdit?.id ?? 'new'}` on the edit FormModal to force remount when selected room changes.
**Warning signs:** Edit modal opens pre-filled with wrong room data.

### Pitfall 4: health stats request concurrency on mutation
**What goes wrong:** After create/edit/delete, calling both `refetch()` and `healthRefetch()` in parallel can cause stale data if health responds before the main list.
**Why it happens:** Both are async, race conditions possible.
**How to avoid:** `await refetch(); await healthRefetch();` — sequential is correct here (matches Phase 121 pattern).
**Warning signs:** Health stats show stale count after mutation.

### Pitfall 5: Zod schema for nullable description
**What goes wrong:** Using `z.string().optional()` without `.nullable()` rejects `null` at runtime if the API returns null for a room with no description, causing edit pre-fill to fail.
**Why it happens:** Zod distinguishes `undefined` and `null`.
**How to avoid:** Use `z.string().max(500).nullable().optional()` to accept both `null` and `undefined`.

---

## Code Examples

### DataTable column definitions for rooms
```typescript
// Modeled on: app/registry/devices/page.tsx
const columns: ColumnDef<Room>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: 'Descrizione',
    cell: ({ row }) => (
      <span className="text-slate-400 truncate max-w-xs block">
        {row.original.description ?? '—'}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'device_count',
    header: 'Dispositivi',
    cell: ({ row }) => {
      const count = row.original.device_count ?? 0;
      return (
        <Badge variant="neutral" size="sm">
          {count} {count === 1 ? 'dispositivo' : 'dispositivi'}
        </Badge>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'created_at',
    header: 'Creata',
    cell: ({ row }) =>
      new Date(row.original.created_at * 1000).toLocaleDateString('it-IT'),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setRoomToEdit(row.original)}>
          Modifica
        </Button>
        <Button variant="danger" size="sm" onClick={() => setRoomToDelete(row.original)}>
          Elimina
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];
```

### Zod schema
```typescript
const roomSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
  description: z.string().max(500, 'Max 500 caratteri').nullable().optional(),
});
type RoomFormData = z.infer<typeof roomSchema>;
```

### ConfirmationDialog with device count in message (D-19)
```typescript
<ConfirmationDialog
  isOpen={roomToDelete !== null}
  onClose={() => setRoomToDelete(null)}
  onConfirm={handleDelete}
  title="Elimina stanza"
  description={`Eliminare "${roomToDelete?.name}" (${roomToDelete?.device_count ?? 0} dispositivi)?`}
  confirmLabel="Elimina"
  cancelLabel="Annulla"
  variant="danger"
/>
```

---

## API Contract Summary

All routes exist from Phase 119. Client page calls Next.js proxy routes (not the HA proxy directly).

| Client fetch URL | Method | Body | Success | Errors |
|-----------------|--------|------|---------|--------|
| `/api/rooms` | GET | — | 200 `Room[]` | 503 |
| `/api/rooms` | POST | `RoomCreate` | 201 `Room` | 409 duplicate name, 503 |
| `/api/rooms/{id}` | PUT | `RoomUpdate` | 200 `Room` | 404 not found, 409 duplicate, 503 |
| `/api/rooms/{id}` | DELETE | — | 204 empty | 404 not found, 503 |
| `/api/rooms/health` | GET | — | 200 `RoomsHealthResponse` | 503 |

**Key note:** POST returns 201 (via `created()` helper), not 200. The page does not use the response body from POST — only checks `res.ok` (status 201 passes `res.ok === true`).

---

## Validation Architecture

nyquist_validation is enabled in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- app/rooms/__tests__/page.test.tsx --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROOM-01 | Rooms listed in DataTable with device_count badge | unit | `npm test -- app/rooms/__tests__/page.test.tsx --no-coverage -t "ROOM-01"` | ❌ Wave 0 |
| ROOM-01 | Loading state shows Skeleton | unit | same file | ❌ Wave 0 |
| ROOM-01 | Error state shows Banner | unit | same file | ❌ Wave 0 |
| ROOM-01 | Empty state shows "Nessuna stanza creata" | unit | same file | ❌ Wave 0 |
| ROOM-01 | Health stats render (room_count, total_device_count, orphan_device_count) | unit | same file | ❌ Wave 0 |
| ROOM-02 | "Crea stanza" button opens create FormModal | unit | same file | ❌ Wave 0 |
| ROOM-02 | Create onSubmit calls POST /api/rooms with correct body | unit | same file | ❌ Wave 0 |
| ROOM-02 | Create 409 throws (toastSuccess not called) | unit | same file | ❌ Wave 0 |
| ROOM-03 | "Modifica" button opens edit FormModal with pre-filled values | unit | same file | ❌ Wave 0 |
| ROOM-03 | Edit onSubmit calls PUT /api/rooms/{id} with numeric room.id | unit | same file | ❌ Wave 0 |
| ROOM-03 | Edit 409 throws (modal stays open) | unit | same file | ❌ Wave 0 |
| ROOM-03 | Edit 404 calls toastError (not toastSuccess) | unit | same file | ❌ Wave 0 |
| ROOM-04 | "Elimina" button opens ConfirmationDialog with room name and device count | unit | same file | ❌ Wave 0 |
| ROOM-04 | Confirm delete calls DELETE /api/rooms/{id} with numeric room.id | unit | same file | ❌ Wave 0 |
| ROOM-04 | Delete 404 calls toastError | unit | same file | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- app/rooms/__tests__/page.test.tsx --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/rooms/__tests__/page.test.tsx` — covers ROOM-01 through ROOM-04 (all 15 tests above)

*(The directory `app/rooms/` does not yet exist — both the page and the test file are new.)*

---

## Sources

### Primary (HIGH confidence)
- `app/registry/devices/page.tsx` — Phase 121 reference implementation, read in full
- `app/registry/types/page.tsx` — Phase 120 reference implementation, read in full
- `app/registry/devices/__tests__/page.test.tsx` — Test pattern reference, read in full
- `types/rooms.ts` — TypeScript types, verified present and correct
- `app/api/rooms/route.ts` — GET + POST proxy, verified
- `app/api/rooms/[room_id]/route.ts` — GET + PUT + DELETE proxy, verified
- `app/api/rooms/health/route.ts` — GET health proxy, verified
- `docs/api/rooms.md` — Full API contract, read in full
- `.planning/phases/122-room-management-ui/122-CONTEXT.md` — All decisions locked

### Secondary (MEDIUM confidence)
- `docs/api/rooms.md` §Frontend Component Suggestions — aligned with locked decisions
- `.planning/STATE.md` — Project patterns and decisions history

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified to exist and match usage patterns
- Architecture: HIGH — copied directly from Phase 121 with verified modifications
- Pitfalls: HIGH — identified from actual code review of Phase 121 and API contract
- Test patterns: HIGH — complete test file from Phase 121 read and analyzed

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (stable codebase, no external dependencies)
