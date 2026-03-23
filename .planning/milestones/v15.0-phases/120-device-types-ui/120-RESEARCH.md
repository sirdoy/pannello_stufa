# Phase 120: Device Types UI - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15.5 client page — CRUD UI for device type taxonomy
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** New page at `app/registry/types/page.tsx` — `/registry/types` route
- **D-02:** Back button navigates to `/` (dashboard) — no parent registry page exists yet
- **D-03:** Page uses standard layout pattern: max-w-7xl container, back button, Heading + Text description, then Card content
- **D-04:** Use DataTable (TanStack Table) to list device types — columns: label, slug, is_builtin (badge), created_at (formatted date)
- **D-05:** Built-in types show a Badge with "Built-in" label — custom types show no badge or a subtle "Custom" badge
- **D-06:** No pagination needed — device types list is small (typically <20 items), fetch all at once
- **D-07:** Sort by label alphabetically by default, built-in types first
- **D-08:** "Crea tipo" button above the table opens a FormModal
- **D-09:** FormModal fields: slug (text input, pattern `^[a-z0-9_]+$`, max 64 chars) + label (text input, max 128 chars)
- **D-10:** Zod validation schema enforces slug pattern and max lengths client-side
- **D-11:** On 409 (slug already exists) show error in FormModal — do not close modal
- **D-12:** On success: close modal, show Toast success, refresh the list
- **D-13:** Delete button visible only on custom types (is_builtin === false) — built-in types have no delete action
- **D-14:** ConfirmationDialog shows type label and slug before confirming deletion
- **D-15:** On 409 (type in use by devices) show Toast error with message "Tipo in uso da dispositivi registrati"
- **D-16:** On success: show Toast success, refresh the list
- **D-17:** Create `useDeviceTypes` hook in the page file or a co-located hooks file — simple fetch-on-mount, not polling
- **D-18:** Hook calls `/api/registry/types` (Next.js proxy route, not registryProxy server module) — this is a client component
- **D-19:** Expose `{ types, loading, error, refetch }` — refetch called after create/delete mutations
- **D-20:** Mutations (create, delete) call `/api/registry/types` and `/api/registry/types/{slug}` directly via fetch
- **D-21:** Loading state: Skeleton placeholder matching table shape
- **D-22:** Error state: Banner variant="error" with error message
- **D-23:** Empty state (no custom types yet): show built-in types table + subtle message "Nessun tipo personalizzato"

### Claude's Discretion
- Exact DataTable column widths and responsive behavior
- Skeleton shape details
- Whether to use a separate hooks file or inline in page component
- Import organization and JSDoc style
- Whether slug input auto-lowercases or just validates

### Deferred Ideas (OUT OF SCOPE)
- Device Registry UI (CRUD for registered devices) — Phase 121
- Room Management UI — Phase 122
- Linking device types page from a future admin/registry hub page — future phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DTYPE-01 | User can view list of all device types (built-in + custom) | DataTable with DeviceType[] from GET /api/registry/types, useDeviceTypes hook |
| DTYPE-02 | User can create a custom device type with slug and label | FormModal + Zod schema + POST /api/registry/types, 409 error handling |
| DTYPE-03 | User can delete a custom device type (built-in protected) | ConfirmationDialog + DELETE /api/registry/types/{slug}, 409 in-use handling |
</phase_requirements>

## Summary

Phase 120 delivers a standalone client page at `/registry/types` that lists, creates, and deletes device type definitions. All API infrastructure exists from Phase 118 — this phase is purely UI. The page is a new Next.js App Router route under a new `app/registry/` directory (which does not yet exist).

The implementation follows the project's established CRUD page pattern: a `'use client'` page with a data hook, a DataTable for the list, a FormModal for creation, and a ConfirmationDialog for deletion. The Toast system (via `useToast()`) handles transient success/error feedback; Banner handles persistent load errors. All components exist and their APIs are verified below.

The single notable decision point is that `ConfirmDialog` is **deprecated** in favor of `ConfirmationDialog` (Radix-based). The CONTEXT.md refers to "ConfirmDialog" generically — the implementation must use `ConfirmationDialog` to avoid console deprecation warnings.

**Primary recommendation:** Build `app/registry/types/page.tsx` as a single-file `'use client'` component with an inline `useDeviceTypes` hook, using `ConfirmationDialog` (not the deprecated `ConfirmDialog`), `FormModal`, `DataTable`, `useToast`, and `Banner` from the existing design system.

## Standard Stack

### Core (verified by direct file reads)

| Component / Hook | Import Path | Purpose |
|---|---|---|
| `DataTable` | `@/app/components/ui/DataTable` | TanStack Table v8 list display |
| `FormModal` | `@/app/components/ui/FormModal` | React Hook Form + Zod modal |
| `ConfirmationDialog` | `@/app/components/ui/ConfirmationDialog` | Delete confirmation (non-deprecated) |
| `useToast` | `@/app/hooks/useToast` | Transient success/error feedback |
| `Banner` | `@/app/components/ui/Banner` | Persistent error/loading state |
| `Badge` | `@/app/components/ui/Badge` | Built-in / custom type indicator |
| `Skeleton` | `@/app/components/ui/Skeleton` | Loading placeholder |
| `Button` | `@/app/components/ui/Button` | "Crea tipo" trigger |
| `Card` | `@/app/components/ui/Card` | Card wrapper for table section |
| `Heading`, `Text` | `@/app/components/ui` | Page header copy |
| `Input` | `@/app/components/ui/Input` | FormModal field inside Controller |
| `SettingsLayout` | `@/app/components/SettingsLayout` | Back button + page container |
| `DeviceType`, `DeviceTypeCreate` | `@/types/registry` | Type definitions (already defined) |
| `zod` | `zod` | Client-side form validation schema |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ConfirmationDialog` | `ConfirmDialog` | ConfirmDialog is deprecated — console warns in dev, migration doc points to ConfirmationDialog |
| `SettingsLayout` | Custom layout | SettingsLayout already provides back button + max-w + spacing; no custom layout needed |
| Inline hook | Separate `useDeviceTypes.ts` | For <1 page of state logic, inline is simpler and matches this codebase's smaller hook pattern |

## Architecture Patterns

### Recommended File Structure

```
app/
└── registry/
    └── types/
        ├── page.tsx              # New file — client page + inline useDeviceTypes hook
        └── __tests__/
            └── page.test.tsx     # New file — unit tests
```

`app/registry/` does not yet exist. The implementor creates both the directory and the page.

### Pattern 1: Client Page with Inline Data Hook

The project's CRUD pages (e.g., `app/settings/devices/page.tsx`) place fetch logic in a local async function called from `useEffect`. For this phase the hook is a named function above the default export:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
// ... other imports ...
import type { DeviceType, DeviceTypeCreate } from '@/types/registry';

function useDeviceTypes() {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registry/types');
      if (!res.ok) throw new Error('Errore nel caricamento dei tipi');
      const data = (await res.json()) as DeviceType[];
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { types, loading, error, refetch };
}
```

**Source:** Verified against `app/settings/devices/page.tsx` fetch pattern (confidence HIGH).

### Pattern 2: DataTable Column Definitions

DataTable accepts `ColumnDef<DeviceType>[]` from `@tanstack/react-table`. The `cell` renderer can return JSX:

```typescript
import type { ColumnDef } from '@tanstack/react-table';
import Badge from '@/app/components/ui/Badge';

const columns: ColumnDef<DeviceType>[] = [
  {
    accessorKey: 'label',
    header: 'Etichetta',
    enableSorting: true,
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <code className="text-sm font-mono text-slate-400">{row.original.slug}</code>
    ),
  },
  {
    accessorKey: 'is_builtin',
    header: 'Tipo',
    cell: ({ row }) =>
      row.original.is_builtin ? (
        <Badge variant="ocean" size="sm">Built-in</Badge>
      ) : (
        <Badge variant="neutral" size="sm">Custom</Badge>
      ),
    enableSorting: false,
  },
  {
    accessorKey: 'created_at',
    header: 'Creato',
    cell: ({ row }) =>
      new Date(row.original.created_at * 1000).toLocaleDateString('it-IT'),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      !row.original.is_builtin ? (
        <Button variant="danger" size="sm" onClick={() => onDeleteRequest(row.original)}>
          Elimina
        </Button>
      ) : null,
    enableSorting: false,
  },
];
```

**Note:** Sort by label alphabetically with built-in types first requires a custom sort function or initial sort + data pre-sorting. Easiest approach: sort the `types` array in `useDeviceTypes` before returning — sort by `[!is_builtin, label]` so built-in comes first, then alphabetical label.

**Source:** Verified against `DataTable.tsx` props interface (confidence HIGH).

### Pattern 3: FormModal with Zod

FormModal uses a render-prop children pattern. Fields are rendered with RHF `Controller`:

```typescript
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import Input from '@/app/components/ui/Input';
import FormModal from '@/app/components/ui/FormModal';

const deviceTypeSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug obbligatorio')
    .max(64, 'Max 64 caratteri')
    .regex(/^[a-z0-9_]+$/, 'Solo lettere minuscole, cifre e underscore'),
  label: z
    .string()
    .min(1, 'Etichetta obbligatoria')
    .max(128, 'Max 128 caratteri'),
});

// In the submit handler: throw on 409 to keep modal open
const handleCreate = async (data: DeviceTypeCreate) => {
  const res = await fetch('/api/registry/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    // Throw — FormModal catches and sets formState='error', does NOT close
    throw new Error('Slug già esistente');
  }
  if (!res.ok) {
    throw new Error('Errore durante la creazione');
  }
  // FormModal auto-closes after success (800ms overlay)
  toast.success('Tipo creato con successo');
  await refetch();
};

<FormModal
  isOpen={showCreate}
  onClose={() => setShowCreate(false)}
  onSubmit={handleCreate}
  title="Crea tipo dispositivo"
  defaultValues={{ slug: '', label: '' }}
  validationSchema={deviceTypeSchema}
  submitLabel="Crea"
  cancelLabel="Annulla"
  successMessage="Tipo creato!"
>
  {({ control, errors, isDisabled }) => (
    <>
      <Controller
        name="slug"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label="Slug"
            data-field="slug"
            {...field}
            error={fieldState.error?.message}
            disabled={isDisabled}
            placeholder="es. irrigatore"
          />
        )}
      />
      <Controller
        name="label"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label="Etichetta"
            data-field="label"
            {...field}
            error={fieldState.error?.message}
            disabled={isDisabled}
            placeholder="es. Irrigatore giardino"
          />
        )}
      />
    </>
  )}
</FormModal>
```

**Critical:** `data-field="fieldName"` on each Input is required for FormModal's shake animation to target the correct field on validation error.

**Source:** Verified against `FormModal.tsx` render prop API and `triggerShakeAnimation` implementation (confidence HIGH).

### Pattern 4: ConfirmationDialog for Delete

```typescript
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';

// State: which type to delete
const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);

const handleDelete = async () => {
  if (!typeToDelete) return;
  const res = await fetch(`/api/registry/types/${typeToDelete.slug}`, {
    method: 'DELETE',
  });
  if (res.status === 409) {
    toast.error('Tipo in uso da dispositivi registrati');
    setTypeToDelete(null);
    return;
  }
  if (!res.ok) {
    toast.error('Errore durante l\'eliminazione');
    setTypeToDelete(null);
    return;
  }
  toast.success('Tipo eliminato');
  setTypeToDelete(null);
  await refetch();
};

<ConfirmationDialog
  isOpen={typeToDelete !== null}
  onClose={() => setTypeToDelete(null)}
  onConfirm={handleDelete}
  title="Elimina tipo"
  description={`Eliminare "${typeToDelete?.label}" (${typeToDelete?.slug})?`}
  confirmLabel="Elimina"
  cancelLabel="Annulla"
  variant="danger"
/>
```

**Source:** Verified against `ConfirmationDialog.tsx` props interface (confidence HIGH).

### Pattern 5: Toast Usage

`useToast()` is a hook that must be called inside the component. It returns `{ toast, success, error, warning, info }` methods:

```typescript
const { success, error } = useToast();

// On success
success('Tipo creato con successo');

// On error
error('Tipo in uso da dispositivi registrati');
```

**Source:** Verified against `useToast.ts` and `ToastProvider.tsx` (confidence HIGH). ToastProvider is already mounted in `app/components/ClientProviders.tsx`.

### Pattern 6: Built-in-first sort

Sort `types` array to satisfy D-07 (built-in first, then alphabetical by label):

```typescript
const sorted = [...types].sort((a, b) => {
  if (a.is_builtin !== b.is_builtin) return a.is_builtin ? -1 : 1;
  return a.label.localeCompare(b.label, 'it');
});
```

Apply this inside `useDeviceTypes` before `setTypes`, or as a `useMemo` in the component.

### Anti-Patterns to Avoid

- **Using `ConfirmDialog` instead of `ConfirmationDialog`**: ConfirmDialog emits a deprecation warning in dev mode. All new code must use `ConfirmationDialog` (different prop names: `onClose` not `onCancel`, `description` not `message`).
- **Throwing in `onSubmit` without handling in the component**: FormModal catches the thrown error and sets `formState='error'`, which keeps the modal open. This is the correct 409 handling strategy per D-11. Do NOT call `setShowCreate(false)` inside the catch.
- **Calling `toast` before `await refetch()`**: Refetch is async and fast — always await it before returning from the mutation handler so the list is fresh immediately.
- **Using `registryProxy` directly from a client component**: `registryProxy` is a server-only module. Client components must use `fetch('/api/registry/types')` (the Next.js proxy route).
- **Adding `export const dynamic = 'force-dynamic'` to page.tsx**: This directive is for API routes only. Page components do not use it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom regex validation | Zod + React Hook Form via FormModal | FormModal already integrates zodResolver; re-implementing misses shake animation, blur-validation, error summary |
| Delete confirmation modal | Custom alert/confirm | `ConfirmationDialog` | Smart focus management, loading state protection, Radix a11y baseline |
| Toast notifications | `useState` + custom banner | `useToast()` | Already provided globally via ToastProvider in ClientProviders — no setup needed |
| Table sorting | Manual array sort in JSX | DataTable `initialSorting` or pre-sorted data | DataTable handles sort state management |

**Key insight:** Every CRUD UI primitive needed already exists in this design system. This phase is pure composition.

## Common Pitfalls

### Pitfall 1: ConfirmDialog Deprecation Warning
**What goes wrong:** Importing `ConfirmDialog` from `@/app/components/ui/ConfirmDialog` works but emits a `console.warn` in development on every mount.
**Why it happens:** ConfirmDialog was replaced by ConfirmationDialog (Radix-based); old component retained for migration but marked deprecated.
**How to avoid:** Always import `ConfirmationDialog` from `@/app/components/ui/ConfirmationDialog`. Note the different prop API: `onClose` (not `onCancel`), `description` (not `message`).

### Pitfall 2: FormModal 409 Handling Pattern
**What goes wrong:** Calling `setShowCreate(false)` inside a `try/catch` when the API returns 409 will close the modal before the user sees the error.
**Why it happens:** Manual close state management conflicts with FormModal's internal state.
**How to avoid:** In the `onSubmit` callback, `throw new Error(...)` on any non-OK response (including 409). FormModal will catch the throw, set `formState='error'`, and remain open. The `onClose` is only called by FormModal itself on success.

### Pitfall 3: Missing `app/registry/` Directory
**What goes wrong:** Creating only `page.tsx` without the parent directory structure.
**Why it happens:** The `app/registry/` directory does not exist — it must be created.
**How to avoid:** Create the full path `app/registry/types/page.tsx`. Next.js App Router automatically registers the route from directory structure.

### Pitfall 4: `data-field` Attribute on Input Inside Controller
**What goes wrong:** FormModal's shake animation silently fails — no visual feedback on invalid submit.
**Why it happens:** `triggerShakeAnimation` uses `formRef.current.querySelector('[data-field="fieldName"]')` to find inputs. If `data-field` is missing, nothing shakes.
**How to avoid:** Every `<Input>` inside a `Controller` in a FormModal must have `data-field="fieldName"` matching the RHF field name exactly.

### Pitfall 5: GET /api/registry/types Returns Array, Not Paginated Object
**What goes wrong:** Treating the response as `{ items: DeviceType[], total_count: number }` (the paginated pattern used for devices).
**Why it happens:** Devices use `PaginatedResponse<T>` but types use a flat array response.
**How to avoid:** Cast response as `DeviceType[]` directly — `const data = (await res.json()) as DeviceType[]`.

## Code Examples

### Sorting built-in types first (verified from types/registry.ts)
```typescript
// Source: types/registry.ts — DeviceType.is_builtin: boolean
const sorted = [...types].sort((a, b) => {
  if (a.is_builtin !== b.is_builtin) return a.is_builtin ? -1 : 1;
  return a.label.localeCompare(b.label, 'it');
});
```

### API Route signatures (verified from app/api/registry/types/route.ts)
```typescript
// GET /api/registry/types → DeviceType[] (no auth required)
// POST /api/registry/types → DeviceType (201) (auth required)
// DELETE /api/registry/types/[slug] → 204 no body (auth required)
// 409 on POST: slug already exists
// 409 on DELETE: type in use by devices
// 403 on DELETE: built-in type (client prevents this via D-13)
```

### SettingsLayout usage (verified from app/components/SettingsLayout.tsx)
```typescript
// Supports backHref prop for explicit navigation target
<SettingsLayout title="Tipi dispositivo" icon="🏷️" backHref="/">
  {/* page content */}
</SettingsLayout>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + Testing Library (verified from existing tests) |
| Config file | `jest.config.js` (project root) |
| Quick run command | `npm test -- --testPathPattern="registry/types"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DTYPE-01 | Renders DataTable with types list on load | unit | `npm test -- --testPathPattern="registry/types/page"` | No — Wave 0 |
| DTYPE-01 | Shows Skeleton during loading state | unit | same | No — Wave 0 |
| DTYPE-01 | Shows Banner on fetch error | unit | same | No — Wave 0 |
| DTYPE-02 | Opens FormModal when "Crea tipo" clicked | unit | same | No — Wave 0 |
| DTYPE-02 | Calls POST /api/registry/types on valid submit | unit | same | No — Wave 0 |
| DTYPE-03 | Delete button absent on built-in types | unit | same | No — Wave 0 |
| DTYPE-03 | Opens ConfirmationDialog on delete click | unit | same | No — Wave 0 |
| DTYPE-03 | Calls DELETE /api/registry/types/{slug} on confirm | unit | same | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="registry/types"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/registry/types/__tests__/page.test.tsx` — covers DTYPE-01, DTYPE-02, DTYPE-03

## Sources

### Primary (HIGH confidence)
- `app/components/ui/ConfirmationDialog.tsx` — props interface: `isOpen`, `onClose`, `onConfirm`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `loading`
- `app/components/ui/ConfirmDialog.tsx` — confirmed deprecated, use ConfirmationDialog
- `app/components/ui/FormModal.tsx` — render-prop children API, `validationSchema`, `defaultValues`, `onSubmit` (throw to keep open), `data-field` shake requirement
- `app/components/ui/DataTable.tsx` — `ColumnDef<T>[]` + `data` props, no pagination needed for small lists
- `app/components/ui/Toast.tsx` + `app/hooks/useToast.ts` — `success()`, `error()` shorthand methods
- `app/components/ui/Input.tsx` — `label`, `error`, `data-field` props
- `app/components/ui/Badge.tsx` — `variant` prop (ocean, neutral, etc.)
- `app/components/SettingsLayout.tsx` — `backHref` prop for `/` navigation
- `types/registry.ts` — `DeviceType`, `DeviceTypeCreate` interfaces
- `app/api/registry/types/route.ts` — GET (public) + POST (auth) proxy routes
- `app/api/registry/types/[slug]/route.ts` — DELETE (auth) proxy route, returns 204 no body
- `docs/api/registry.md` — error codes: 409 slug exists (POST), 409 type in use (DELETE), 403 built-in (DELETE)

### Secondary (MEDIUM confidence)
- `app/settings/devices/page.tsx` — fetch-on-mount + `useEffect` pattern reference
- `app/raspi/__tests__/page.test.tsx` — test structure reference for new page test

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components directly read and verified
- Architecture: HIGH — patterns directly extracted from existing page code
- Pitfalls: HIGH — deprecation and API patterns verified in source files

**Research date:** 2026-03-23
**Valid until:** Stable (design system components do not change between phases)
