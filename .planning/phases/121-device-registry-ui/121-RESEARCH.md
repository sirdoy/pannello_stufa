# Phase 121: Device Registry UI - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15.5 client page — paginated DataTable, server-side filtering, FormModal CRUD, ConfirmationDialog
**Confidence:** HIGH

## Summary

Phase 121 is a near-identical structural twin of Phase 120 (Device Types UI), extended in two specific dimensions: (1) server-side pagination with a provider filter, and (2) two-mode FormModal (register vs. update). All foundational infrastructure — API routes, TypeScript types, UI components, test patterns — is already in place. The canonical pattern from `app/registry/types/page.tsx` can be followed exactly, with the Phase 121-specific additions documented below.

The only meaningful complexity is the server-side pagination loop: the DataTable receives only the current page of data, and offset/provider state must live in the `useRegistryDevices` hook and drive re-fetches. The PUT route uses the numeric `id` field from `RegistryDevice` (not the string `device_id`) as the path parameter — this is the single most important integration detail to get right.

**Primary recommendation:** Build two plans — 121-01 (read path: list, filter, health stats, loading/error/empty states) and 121-02 (write path: register, update, unregister). Follow `app/registry/types/page.tsx` for structure, hooks, and test mock conventions.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page location & navigation**
- D-01: New page at `app/registry/devices/page.tsx` — `/registry/devices` route
- D-02: Back button navigates to `/registry/types` — natural parent in the registry section
- D-03: Page uses SettingsLayout pattern (same as Phase 120): back button, Heading + Text description, then Card content

**Device list display**
- D-04: Use DataTable (TanStack Table) — columns: custom_name, provider_name (Badge), device_type_slug, device_id, updated_at (formatted date), actions
- D-05: Provider column uses Badge with variant mapping: hue→ocean, netatmo→ember, thermorossi→ember, dirigera→neutral, raspi→neutral, fritzbox→neutral — keep simple, max 3 distinct variants
- D-06: Server-side pagination — API supports limit/offset, default page size 20. DataTable pagination controls call refetch with new offset
- D-07: Sort by custom_name alphabetically by default (client-side sort within current page)

**Provider filter**
- D-08: Filter dropdown above the table using Select component — options are hardcoded known providers: "Tutti", "hue", "netatmo", "thermorossi", "dirigera", "raspi", "fritzbox"
- D-09: Selecting a provider triggers refetch with `provider_name` query param, resets offset to 0
- D-10: "Tutti" (default) sends no provider_name param — returns all devices

**Health stats**
- D-11: Two stat values displayed above the table: "Tipi dispositivo: N" and "Dispositivi registrati: N"
- D-12: Fetch from `/api/registry/health` alongside devices on mount — simple inline display, not separate cards
- D-13: Health stats refresh after any mutation (register, update, unregister)

**Register form UX**
- D-14: "Registra dispositivo" button above the table opens a FormModal
- D-15: FormModal fields: provider_name (Select), device_id (text Input), custom_name (text Input), device_type_slug (Select populated from `/api/registry/types`)
- D-16: Zod validation: all 4 fields required, provider_name 1-64 chars, device_id 1-256 chars, custom_name 1-128 chars, device_type_slug 1-64 chars
- D-17: On 409 (duplicate provider+device_id) show error in FormModal — do not close modal
- D-18: On 422 (unknown type slug) show error in FormModal — do not close modal
- D-19: On success: close modal, Toast success "Dispositivo registrato", refresh list + health stats

**Update UX**
- D-20: Edit button in actions column opens a FormModal (reuse same modal component with different mode)
- D-21: FormModal pre-filled with current custom_name and device_type_slug — only these two fields are editable
- D-22: provider_name and device_id shown as read-only text above the form fields for context
- D-23: On success: close modal, Toast success "Dispositivo aggiornato", refresh list
- D-24: On 404 (device removed by another user): Toast error, close modal, refresh list

**Unregister UX**
- D-25: Delete button in actions column (Button variant="danger" size="sm")
- D-26: ConfirmationDialog shows device custom_name and provider_name before confirming
- D-27: On success: Toast success "Dispositivo rimosso", refresh list + health stats
- D-28: On 404 (already removed): Toast error, refresh list

**Data fetching**
- D-29: Create `useRegistryDevices` hook — exposes `{ devices, totalCount, loading, error, refetch, page, setPage, provider, setProvider }`
- D-30: Hook calls `/api/registry/devices?limit=20&offset=N&provider_name=X` — client component, fetch from Next.js proxy
- D-31: Create `useRegistryHealth` hook — simple fetch-on-mount, exposes `{ health, loading, refetch }`
- D-32: Device types for the register/update Select fetched via reuse of the `useDeviceTypes` pattern from Phase 120 (or inline fetch in modal)

**Error & loading states**
- D-33: Loading state: Skeleton placeholder matching table shape (same pattern as Phase 120)
- D-34: Error state: Banner variant="error" with error message
- D-35: Empty state (no devices registered): show health stats + message "Nessun dispositivo registrato" + prominent register button

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether to extract hooks into a co-located hooks file or inline in page component
- Import organization and JSDoc style
- Badge color mapping refinement for providers
- Pagination control styling (next/prev buttons or page numbers)

### Deferred Ideas (OUT OF SCOPE)
- Room Management UI (create/edit/delete rooms) — Phase 122
- Room Device Assignment UI — Phase 123
- Room Status Views (per-room + whole-house) — Phase 124
- Registry hub page linking types + devices + health — future milestone
- Bulk device registration (CSV import) — future milestone
- Device search by name — future milestone
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DREG-01 | User can view paginated list of registered devices | useRegistryDevices hook with offset/limit; DataTable receives single-page data |
| DREG-02 | User can filter device list by provider | provider state in useRegistryDevices; Select filter triggers refetch with provider_name param |
| DREG-03 | User can register a new device (provider, device_id, name, type) | FormModal + Zod schema; POST /api/registry/devices; 409/422 error handling |
| DREG-04 | User can update device name and type | Edit FormModal pre-filled; PUT /api/registry/devices/{id} using numeric id field |
| DREG-05 | User can unregister a device with confirmation | ConfirmationDialog; DELETE /api/registry/devices/{id}; 404 handling |
| DREG-06 | User can view registry health stats (type count, device count) | useRegistryHealth hook fetching /api/registry/health; inline display above table |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + Next.js 15.5 | 15.5 | Page component with `'use client'` | Project standard |
| TanStack Table v8 | v8 (already installed) | DataTable column definitions | Phase 120 pattern |
| React Hook Form | already installed | FormModal internal — no direct import needed | FormModal handles it |
| Zod | already installed | Form schema validation | Phase 120 pattern |
| @radix-ui/react-select | already installed | Select component for provider filter and form dropdowns | Phase 120 pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | already installed | Validation schema at module level | Register form (4 fields) + Update form (2 fields) |
| react-hook-form Controller | already installed (via FormModal) | FormModal render-prop pattern for Select fields | When using Select inside FormModal |

### No New Dependencies Required
All libraries needed are already installed. No `npm install` calls needed.

---

## Architecture Patterns

### Recommended Project Structure
```
app/registry/devices/
├── page.tsx                  # Single 'use client' page — all hooks inline
└── __tests__/
    └── page.test.tsx         # Jest + Testing Library unit tests
```

Hooks are co-located inline in `page.tsx` (same as Phase 120's `useDeviceTypes`). No separate hooks file.

### Pattern 1: useRegistryDevices Hook (server-side pagination + filter)
**What:** Wraps paginated GET /api/registry/devices, manages page/provider state, exposes refetch.
**When to use:** Any time device list is needed; re-runs when page or provider changes.
**Example:**
```typescript
// Source: docs/api/registry.md + Phase 120 useDeviceTypes pattern
function useRegistryDevices() {
  const [devices, setDevices] = useState<RegistryDevice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [provider, setProvider] = useState<string>('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '20', offset: String(page * 20) });
      if (provider) params.set('provider_name', provider);
      const res = await fetch(`/api/registry/devices?${params.toString()}`);
      if (!res.ok) throw new Error('Errore nel caricamento dei dispositivi');
      const data = (await res.json()) as PaginatedResponse<RegistryDevice>;
      // Client-side sort by custom_name within the current page (per D-07)
      const sorted = [...data.items].sort((a, b) =>
        a.custom_name.localeCompare(b.custom_name, 'it')
      );
      setDevices(sorted);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [page, provider]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { devices, totalCount, loading, error, refetch, page, setPage, provider, setProvider };
}
```

### Pattern 2: useRegistryHealth Hook
**What:** Simple fetch-on-mount for registry stats, exposes refetch for post-mutation refresh.
**When to use:** Mount + after any register/unregister mutation.
```typescript
function useRegistryHealth() {
  const [health, setHealth] = useState<RegistryHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/registry/health');
      if (!res.ok) throw new Error();
      setHealth((await res.json()) as RegistryHealthResponse);
    } catch { /* health stats are non-critical */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { health, loading, refetch };
}
```

### Pattern 3: Two-Mode FormModal (Register vs. Update)
**What:** Same FormModal component instance handles both create (4 fields) and update (2 fields). Separate state variables control which mode is open.
**When to use:** Register: `deviceToRegister` state truthy (boolean flag); Update: `deviceToEdit` state truthy (RegistryDevice | null).

Register mode — all 4 fields required:
```typescript
const registerSchema = z.object({
  provider_name: z.string().min(1).max(64),
  device_id: z.string().min(1).max(256),
  custom_name: z.string().min(1).max(128),
  device_type_slug: z.string().min(1).max(64),
});
```

Update mode — 2 fields only (provider_name + device_id shown as read-only text):
```typescript
const updateSchema = z.object({
  custom_name: z.string().min(1).max(128),
  device_type_slug: z.string().min(1).max(64),
});
```

### Pattern 4: PUT Path Param is numeric `id`, not string `device_id`
**What:** The API route at `app/api/registry/devices/[device_id]/route.ts` uses `Number(device_id)` to call `registryProxy.updateDevice(Number(device_id), body)`. The path parameter is the **numeric `id`** field from `RegistryDevice`.
**Critical:** When calling PUT/DELETE from the frontend, use `device.id` (number), NOT `device.device_id` (string).

```typescript
// CORRECT: use device.id (numeric primary key)
await fetch(`/api/registry/devices/${device.id}`, { method: 'PUT', ... })
await fetch(`/api/registry/devices/${device.id}`, { method: 'DELETE' })

// WRONG: device.device_id is the provider-internal string ID
await fetch(`/api/registry/devices/${device.device_id}`, ...) // 404 or wrong device
```

### Pattern 5: Provider Filter with Select and setPage Reset
**What:** When provider changes, offset must reset to 0 to avoid out-of-range pages.
```typescript
const handleProviderChange = (newProvider: string) => {
  setPage(0);           // reset to page 0 first
  setProvider(newProvider === 'tutti' ? '' : newProvider);
};
```

### Pattern 6: Pagination Controls for Server-Side Data
**What:** DataTable's internal `enablePagination` is client-side only. For server-side pagination, render prev/next buttons manually (or pass total page count and control page state externally).
**Decision D-06:** Server-side pagination — page controls call setPage(newPage), which triggers refetch via useEffect dependency.

```typescript
// Manual pagination controls outside DataTable
const totalPages = Math.ceil(totalCount / 20);
// Prev/Next buttons call setPage(page - 1) / setPage(page + 1)
// DataTable receives only current page items (no enablePagination needed)
```

### Pattern 7: Device Types Fetch for Select Dropdown
**What:** The register/update forms need a list of device type slugs. Fetch inline using the same pattern as `useDeviceTypes` or call `/api/registry/types` once when the modal opens.
**Decision D-32:** Reuse `useDeviceTypes` pattern — a `useDeviceTypesForSelect` inline hook, or simply call fetch inside the page component once and cache in state.

### Anti-Patterns to Avoid
- **Using `device.device_id` as path param for PUT/DELETE:** The API route segment is named `[device_id]` but it receives the numeric row `id`. Always use `device.id`.
- **Enabling `enablePagination` on DataTable for server-paginated data:** DataTable's built-in pagination is client-side. Use manual page controls calling `setPage`.
- **Calling health refetch inside DataTable rows:** Health refetch should only be called from mutation handlers (handleRegister, handleUnregister).
- **Single FormModal with `mode` prop and complex conditional fields:** Simpler to have two separate `isOpen` state variables (`showRegister` boolean, `deviceToEdit: RegistryDevice | null`) that each open the correct FormModal instance.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schema + FormModal `validationSchema` prop | FormModal handles zodResolver, shake animation, error summary |
| Delete confirmation | Custom dialog | ConfirmationDialog component | Already has loading state, focus management, danger variant |
| Toast feedback | Custom toast | `useToast()` → `{ success, error }` | Project-standard transient feedback |
| Dropdown select | `<select>` HTML element | Select component (Radix-based) | Design system compliance, accessibility |
| Table with sorting | Custom table | DataTable with `ColumnDef<RegistryDevice>[]` | TanStack Table v8 already wired up |
| Page layout | Custom wrapper | SettingsLayout with `backHref="/registry/types"` | Consistent header, back nav, spacing |

---

## Common Pitfalls

### Pitfall 1: PUT/DELETE path param confusion
**What goes wrong:** Frontend sends `device.device_id` (a string like `"5"` or `"abc-001"`) instead of `device.id` (numeric primary key). The API route casts to `Number()`, so a string that doesn't parse to a valid integer returns 404.
**Why it happens:** The route segment is named `[device_id]` which implies the string provider ID. The route actually receives the numeric row `id`.
**How to avoid:** Always use `device.id` for PUT/DELETE calls. Verified in `app/api/registry/devices/[device_id]/route.ts` line 13: `registryProxy.updateDevice(Number(device_id), body)`.
**Warning signs:** 404 on update/delete that should succeed.

### Pitfall 2: Client-side pagination with server-side data
**What goes wrong:** Passing `enablePagination` to DataTable when only one page of data is loaded. The component's internal pagination counts rows in memory — it will show "Showing 1-20 of 20" even when `total_count` is 200.
**How to avoid:** Do NOT pass `enablePagination` to DataTable. Render manual prev/next controls outside DataTable that call `setPage`.

### Pitfall 3: Provider filter not resetting page
**What goes wrong:** User is on page 3, changes provider filter to "hue" which has only 5 devices (1 page). The hook fetches with `offset=40&provider_name=hue` — API returns 0 items even though items exist.
**How to avoid:** Always `setPage(0)` before `setProvider(newValue)` in the filter change handler.

### Pitfall 4: Health stats stale after mutation
**What goes wrong:** Registering or unregistering a device updates `device_registry_count`, but the health stats display remains stale.
**How to avoid:** Call `healthRefetch()` at the end of `handleRegister` and `handleUnregister` success paths (per D-13).

### Pitfall 5: 409 on register throws, 409 on unregister (device already gone) shows toast
**What goes wrong:** Mixing throw (keeps modal open) vs. toast patterns for different 409/404 status codes.
**How to avoid:**
- Register 409 → throw new Error(...) inside handleRegister — FormModal stays open
- Register 422 → throw new Error(...) inside handleRegister — FormModal stays open
- Update 404 → toast error + close modal + refetch (per D-24)
- Unregister 404 → toast error + refetch (per D-28)

### Pitfall 6: FormModal defaultValues not updated for edit mode
**What goes wrong:** When opening edit modal for a second device after editing a first, FormModal renders with stale defaultValues from the first device.
**Why it happens:** FormModal resets to `defaultValues` only when `isOpen` transitions false→true. If defaultValues prop changes while modal is open, RHF does not re-reset.
**How to avoid:** The defaultValues prop should derive from `deviceToEdit` at render time — since the modal opens fresh each time `deviceToEdit` changes from null to a device object, the reset fires correctly.

---

## Code Examples

Verified patterns from existing source:

### Badge variant mapping for providers
```typescript
// Source: 121-CONTEXT.md D-05 (locked decision)
function getProviderBadgeVariant(provider: string): 'ocean' | 'ember' | 'neutral' {
  if (provider === 'hue') return 'ocean';
  if (provider === 'netatmo' || provider === 'thermorossi') return 'ember';
  return 'neutral'; // dirigera, raspi, fritzbox
}
```

### DataTable column definitions for RegistryDevice
```typescript
// Source: Phase 120 page.tsx pattern + CONTEXT.md D-04
const columns: ColumnDef<RegistryDevice>[] = [
  {
    accessorKey: 'custom_name',
    header: 'Nome',
    enableSorting: true,
  },
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
    accessorKey: 'device_id',
    header: 'ID dispositivo',
    cell: ({ row }) => (
      <code className="text-sm font-mono text-slate-400">{row.original.device_id}</code>
    ),
  },
  {
    accessorKey: 'updated_at',
    header: 'Aggiornato',
    cell: ({ row }) =>
      new Date(row.original.updated_at * 1000).toLocaleDateString('it-IT'),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setDeviceToEdit(row.original)}>
          Modifica
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeviceToDelete(row.original)}>
          Rimuovi
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];
```

### Provider filter Select (outside DataTable, above it)
```typescript
// Source: Phase 121 CONTEXT.md D-08, D-09, D-10
const PROVIDERS = ['hue', 'netatmo', 'thermorossi', 'dirigera', 'raspi', 'fritzbox'];
const providerOptions = [
  { value: '', label: 'Tutti' },
  ...PROVIDERS.map(p => ({ value: p, label: p })),
];

// In JSX:
<Select
  label="Provider"
  options={providerOptions}
  value={provider}
  onChange={(e) => handleProviderChange(String(e.target.value))}
/>
```

### Health stats inline display
```typescript
// Source: CONTEXT.md D-11, D-12
{health && (
  <div className="flex items-center gap-6 text-sm text-slate-400">
    <span>Tipi dispositivo: <strong className="text-slate-200">{health.device_types_count}</strong></span>
    <span>Dispositivi registrati: <strong className="text-slate-200">{health.device_registry_count}</strong></span>
  </div>
)}
```

### handleRegister with 409/422 error handling (throw keeps modal open)
```typescript
// Source: Phase 120 handleCreate pattern + CONTEXT.md D-17, D-18
const handleRegister = async (data: DeviceCreate) => {
  const res = await fetch('/api/registry/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 409) throw new Error('Dispositivo già registrato per questo provider');
  if (res.status === 422) throw new Error('Tipo dispositivo sconosciuto');
  if (!res.ok) throw new Error('Errore durante la registrazione');
  toastSuccess('Dispositivo registrato');
  await refetch();
  await healthRefetch();
};
```

### handleUpdate with 404 handling (toast + close, no throw)
```typescript
// Source: CONTEXT.md D-23, D-24
const handleUpdate = async (data: DeviceUpdate) => {
  if (!deviceToEdit) return;
  const res = await fetch(`/api/registry/devices/${deviceToEdit.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 404) {
    toastError('Dispositivo non trovato');
    setDeviceToEdit(null);
    await refetch();
    return; // NOTE: do NOT throw — modal should close
  }
  if (!res.ok) throw new Error('Errore durante la modifica');
  toastSuccess('Dispositivo aggiornato');
  await refetch();
  // NOTE: health stats not refreshed on update — count unchanged
};
```

### handleUnregister
```typescript
// Source: CONTEXT.md D-27, D-28
const handleUnregister = async () => {
  if (!deviceToDelete) return;
  const res = await fetch(`/api/registry/devices/${deviceToDelete.id}`, {
    method: 'DELETE',
  });
  if (res.status === 404) {
    toastError('Dispositivo già rimosso');
    setDeviceToDelete(null);
    await refetch();
    await healthRefetch();
    return;
  }
  if (!res.ok) {
    toastError("Errore durante la rimozione");
    setDeviceToDelete(null);
    return;
  }
  toastSuccess('Dispositivo rimosso');
  setDeviceToDelete(null);
  await refetch();
  await healthRefetch();
};
```

---

## API Contract Summary

All routes are already implemented (Phase 118). Frontend calls Next.js proxy routes only:

| Frontend call | Next.js route | Backend route | Auth |
|---------------|--------------|---------------|------|
| `GET /api/registry/devices?limit=20&offset=N&provider_name=X` | `app/api/registry/devices/route.ts` | GET /api/v1/registry/devices | Required (withAuthAndErrorHandler) |
| `POST /api/registry/devices` + body `DeviceCreate` | same | POST /api/v1/registry/devices | Required |
| `PUT /api/registry/devices/{id}` + body `DeviceUpdate` | `app/api/registry/devices/[device_id]/route.ts` | PUT /api/v1/registry/devices/{id} | Required |
| `DELETE /api/registry/devices/{id}` | same | DELETE /api/v1/registry/devices/{id} | Required |
| `GET /api/registry/health` | `app/api/registry/health/route.ts` | GET /api/v1/registry/health | Public |
| `GET /api/registry/types` | `app/api/registry/types/route.ts` | GET /api/v1/registry/types | Public |

**Response shapes (already typed in `types/registry.ts` and `types/common.ts`):**
- GET /api/registry/devices → `PaginatedResponse<RegistryDevice>` (items, total_count, limit, offset)
- POST → `RegistryDevice` (201)
- PUT → `RegistryDevice` (200)
- DELETE → 204 no content
- GET /api/registry/health → `RegistryHealthResponse` ({ device_types_count, device_registry_count })

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + Testing Library (existing) |
| Config file | jest.config.ts (existing) |
| Quick run command | `npm test -- --testPathPattern="registry/devices" --no-coverage` |
| Full suite command | `npm test -- --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DREG-01 | DataTable renders with device rows (custom_name, provider, type, device_id) | unit | `npm test -- --testPathPattern="registry/devices" --no-coverage` | No — Wave 0 |
| DREG-01 | Loading: Skeleton rendered while fetch in flight | unit | same | No — Wave 0 |
| DREG-01 | Error: Banner rendered when fetch rejects | unit | same | No — Wave 0 |
| DREG-02 | Changing provider Select triggers refetch with provider_name param | unit | same | No — Wave 0 |
| DREG-02 | "Tutti" selection sends no provider_name param | unit | same | No — Wave 0 |
| DREG-03 | "Registra dispositivo" button opens register FormModal | unit | same | No — Wave 0 |
| DREG-03 | Register submit calls POST /api/registry/devices with correct body | unit | same | No — Wave 0 |
| DREG-03 | 409 response keeps modal open (no toast success) | unit | same | No — Wave 0 |
| DREG-04 | Edit button opens update FormModal pre-filled with custom_name + device_type_slug | unit | same | No — Wave 0 |
| DREG-04 | Update submit calls PUT /api/registry/devices/{id} (numeric id) | unit | same | No — Wave 0 |
| DREG-05 | Delete button opens ConfirmationDialog with device name and provider | unit | same | No — Wave 0 |
| DREG-05 | Confirming delete calls DELETE /api/registry/devices/{id} | unit | same | No — Wave 0 |
| DREG-06 | Health stats (Tipi dispositivo, Dispositivi registrati) are visible | unit | same | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="registry/devices" --no-coverage`
- **Per wave merge:** `npm test -- --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/registry/devices/__tests__/page.test.tsx` — covers DREG-01 through DREG-06
- [ ] `app/registry/devices/` directory — must be created

*(No new framework config or fixtures needed — existing Jest + Testing Library setup is sufficient.)*

---

## Test Mock Strategy (follows Phase 120 conventions exactly)

**Mock structure for `app/registry/devices/__tests__/page.test.tsx`:**

1. `global.fetch` with `jest.fn()` — control GET (devices + types + health) and mutation responses per test
2. `next/navigation` with `useRouter: () => ({ push: mockPush, back: jest.fn() })`
3. UI component mocks (same pattern as `app/registry/types/__tests__/page.test.tsx`):
   - `@/app/components/SettingsLayout` — render `{children}` with title in h1
   - `@/app/components/ui/DataTable` — map data items, render columns including `id: 'actions'` cells
   - `@/app/components/ui/FormModal` — when `isOpen=true`, render a submit button that calls onSubmit with hardcoded data
   - `@/app/components/ui/ConfirmationDialog` — when `isOpen=true`, render description + confirm button
   - `@/app/components/ui/Select` — render `<select>` with options, fire onChange
   - `@/app/components/ui/Badge` — render `{children}` as span
   - `@/app/components/ui/Banner` — render `<div data-testid="banner">{children}</div>`
   - `@/app/components/ui/Skeleton` — render `<div data-testid="skeleton" />`
   - `@/app/components/ui/Button` — render `<button onClick={onClick}>{children}</button>`
   - `@/app/components/ui/Card` — render `<div>{children}</div>`
   - `@/app/components/ui` — `{ Heading, Text }` as simple elements
   - `@/app/hooks/useToast` — `{ useToast: () => ({ success: mockToastSuccess, error: mockToastError }) }`
   - `@/app/components/ui/Input` — render `<input {...props} />`

**Mock data:**
```typescript
const mockDevices: RegistryDevice[] = [
  { id: 1, provider_name: 'hue', device_id: '5', custom_name: 'Lampada IKEA', device_type_slug: 'light', created_at: 1711090000, updated_at: 1711090000 },
  { id: 2, provider_name: 'netatmo', device_id: 'abc-001', custom_name: 'Termostato Camera', device_type_slug: 'thermostat', created_at: 1711091000, updated_at: 1711091000 },
];
const mockHealth = { device_types_count: 5, device_registry_count: 2 };
const mockTypes = [{ slug: 'light', label: 'Light', is_builtin: true, created_at: 1711000000 }];
```

**Fetch mock strategy:** Multiple fetch endpoints are called concurrently on mount. Use `jest.fn().mockImplementation((url) => { ... })` to route by URL.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side all-records fetch | Server-side pagination via limit/offset | Phase 121 (first paginated page) | Hook must re-fetch when page/provider changes |
| JWT auth in API routes | X-API-Key via withAuthAndErrorHandler | Phase 118 | Transparent to frontend — no change needed |

---

## Open Questions

1. **Device types fetch for FormModal selects — once or per-open?**
   - What we know: CONTEXT.md D-32 says "reuse of the `useDeviceTypes` pattern from Phase 120 (or inline fetch in modal)"
   - What's unclear: Whether to fetch types on page mount (always available) or on modal open (lazy)
   - Recommendation: Fetch on page mount via inline `useDeviceTypesForSelect` hook — types rarely change and are needed immediately when register modal opens. Simpler to have it ready.

2. **Pagination control placement and style**
   - What we know: Marked as "Claude's Discretion" in CONTEXT.md
   - Recommendation: Render prev/next buttons + page N of M text below the Card, outside DataTable. Use Button variant="ghost" size="sm" to match Phase 120 DataTable pagination styling.

3. **Two-modal vs. single-modal approach for register vs. update**
   - What we know: CONTEXT.md D-20 says "reuse same modal component with different mode"
   - Recommendation: Two separate FormModal instances in JSX — one always mounted (register), one always mounted (update). Each has its own `isOpen` state. Same component, different props and defaultValues. Cleaner than a `mode` prop.

---

## Sources

### Primary (HIGH confidence)
- `app/registry/types/page.tsx` — Phase 120 canonical pattern (hooks, DataTable, FormModal, ConfirmationDialog)
- `app/registry/types/__tests__/page.test.tsx` — exact test mock conventions to replicate
- `app/api/registry/devices/route.ts` — GET + POST route implementation, verified params
- `app/api/registry/devices/[device_id]/route.ts` — PUT + DELETE, `Number(device_id)` conversion confirmed
- `app/api/registry/health/route.ts` — public health stats route
- `docs/api/registry.md` — full API contract (endpoints, request/response, error codes)
- `docs/api/common.md` — PaginatedResponse<T> interface
- `types/registry.ts` — RegistryDevice, DeviceCreate, DeviceUpdate, RegistryHealthResponse
- `app/components/ui/DataTable.tsx` — DataTableProps interface, enablePagination behavior
- `app/components/ui/FormModal.tsx` — render-prop children API, throw-keeps-modal-open pattern
- `app/components/ui/ConfirmationDialog.tsx` — props interface, loading state behavior
- `app/components/ui/Select.tsx` — simple API (options array + onChange synthetic event)

### Secondary (MEDIUM confidence)
- `app/components/SettingsLayout.tsx` — backHref prop confirmed present
- `.planning/phases/120-device-types-ui/120-01-PLAN.md` — plan structure, task breakdown, test patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed and in use
- Architecture: HIGH — canonical Phase 120 pattern verified in source; API routes confirmed
- Pitfalls: HIGH — PUT path param pitfall verified in route source; pagination behavior verified in DataTable source
- Test patterns: HIGH — exact mock conventions confirmed in Phase 120 test file

**Research date:** 2026-03-23
**Valid until:** 2026-04-22 (stable codebase, 30-day window)
