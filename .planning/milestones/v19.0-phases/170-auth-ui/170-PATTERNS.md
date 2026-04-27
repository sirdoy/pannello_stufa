# Phase 170: auth-ui - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 14 (9 new, 4 modified, 1 nav-data modified)
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/login/page.tsx` (NEW) | page (client component, form) | request-response | `app/registry/types/page.tsx` (lines 71-181 — same FormModal+Zod+RHF stack, rendered as a page instead of modal) | role-similar (page-hosted form vs. modal-hosted form) |
| `app/settings/api-keys/page.tsx` (NEW) | page (client component, CRUD) | CRUD | `app/registry/types/page.tsx` | **exact** (same SettingsLayout + DataTable + FormModal + ConfirmationDialog pattern) |
| `app/hooks/useLogin.ts` (NEW) | hook (local-state, command) | request-response | inline `useDeviceTypes` in `app/registry/types/page.tsx:41-69` + `useLightsCommands`-style command wrapper | role-match |
| `app/hooks/useApiKeys.ts` (NEW) | hook (local-state, CRUD) | CRUD | inline `useDeviceTypes` in `app/registry/types/page.tsx:41-69` + inline `useRegistryDevices` in `app/registry/devices/page.tsx:52-111` | **exact** |
| `app/api/auth/logout/route.ts` (NEW) | API route (command) | request-response | `app/api/v1/dirigera/health/route.ts` (minimal `withAuthAndErrorHandler` shape) + `app/api/auth/login/route.ts` (existing auth-module shape) | **exact** (zero-arg handler with cookie mutation) |
| `app/api/auth/login/route.ts` (MODIFY) | API route (command) | request-response | Self (phase 157) — extend with body parsing + cookie set | self-modify |
| `app/components/Navbar.tsx` (MODIFY) | navigation component | presentational | Self — existing `GLOBAL_SECTIONS` (`lib/devices/deviceTypes.ts:305-332`) drives both desktop + mobile render blocks via `navStructure.global.map()` | self-modify (registry-data approach) |
| `__tests__/app/login/page.test.tsx` (NEW) | component test | presentational | `__tests__/app/settings/thermostat/page.test.tsx` (uses RTL + mocks SettingsLayout + asserts loading/auth states) | role-match (no registry page-test exists) |
| `__tests__/app/settings/api-keys/page.test.tsx` (NEW) | component test | presentational | `__tests__/app/settings/thermostat/page.test.tsx` | role-match |
| `__tests__/hooks/useLogin.test.ts` (NEW) | hook test | unit | `__tests__/hooks/useScheduleData.test.ts` (very shallow, export-only pattern) — BUT phase 170 needs behavior tests; fetch-mock pattern from `__tests__/api/auth/api-keys/route.test.ts` is the real reference | partial — extend with behavior tests |
| `__tests__/hooks/useApiKeys.test.ts` (NEW) | hook test | unit | Same as above | partial |
| `__tests__/api/auth/logout/route.test.ts` (NEW) | route test | unit | `__tests__/api/auth/login/route.test.ts` (same `withAuthAndErrorHandler` mock + ApiError propagation) | **exact** |
| `__tests__/api/auth/login/route.test.ts` (EXTEND) | route test | unit | Self — add 4 cases (empty body, body with creds, cookie-set assertion, rate-limit propagation) | self-modify |
| `tests/smoke/page-loads.spec.ts` (MODIFY) | E2E smoke | structural | Self — add `/login` and `/settings/api-keys` entries following existing `main` locator pattern | self-modify |
| `tests/features/auth-ui.spec.ts` (NEW) | E2E feature | command + CRUD | `tests/features/thermostat-schedule.spec.ts` (describe+beforeEach+goto+getByRole chains) + `tests/features/notification-delivery.spec.ts` (page-load + button assertions) | role-match (no feature spec uses `page.route()` mocks yet — new territory) |

## Pattern Assignments

### `app/settings/api-keys/page.tsx` (page, CRUD) — PRIMARY ANALOG REFERENCE

**Analog:** `app/registry/types/page.tsx`

**Imports pattern** (`app/registry/types/page.tsx:1-18`):
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import type { DeviceType, DeviceTypeCreate } from '@/types/registry';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import FormModal from '@/app/components/ui/FormModal';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import Button from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import { Heading, Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';
```

For phase 170, swap:
- `@/types/registry` → `@/types/authProxy` (`APIKeyInfo`, `APIKeyResponse`, `APIKeyListResponse`)
- Add `import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';` (reveal view)
- Add `import Badge from '@/app/components/ui/Badge';` (active/revoked)
- Add `import { formatRelativeTime } from '@/lib/hooks/useRelativeTime';` (D-09 relative-time cells)
- Add `import Modal from '@/app/components/ui/Modal';` (direct Modal for reveal view — UI-SPEC §Component Inventory)

**Zod schema pattern** (`app/registry/types/page.tsx:21-31`):
```typescript
const deviceTypeSchema = z.object({
  slug: z.string().min(1, 'Slug obbligatorio').max(64, 'Max 64 caratteri').regex(/^[a-z0-9_]+$/, ...),
  label: z.string().min(1, 'Etichetta obbligatoria').max(128, 'Max 128 caratteri'),
});
```

For phase 170 use (per D-10):
```typescript
const createKeySchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(100, 'Max 100 caratteri'),
});
```

**Page-level state + handlers pattern** (`app/registry/types/page.tsx:72-78`):
```typescript
export default function DeviceTypesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [typeToEdit, setTypeToEdit] = useState<DeviceType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);
  const { types, loading, error, refetch } = useDeviceTypes();
  const { success: toastSuccess, error: toastError } = useToast();
```

For phase 170 (no edit flow; add `revealedKey`):
```typescript
const [showCreate, setShowCreate] = useState(false);
const [keyToRevoke, setKeyToRevoke] = useState<APIKeyInfo | null>(null);
const [revealedKey, setRevealedKey] = useState<string | null>(null);
const { keys, loading, error, refetch, create, revoke } = useApiKeys();
const { success: toastSuccess, error: toastError } = useToast();
```

**Page layout pattern** (`app/registry/types/page.tsx:181-203`):
```typescript
return (
  <SettingsLayout title="Tipi dispositivo" icon="🏷️" backHref="/">
    <Text variant="secondary">Gestisci i tipi di dispositivo disponibili nel registro</Text>
    {error && <Banner variant="error">{error}</Banner>}
    {loading ? (
      <Skeleton className="h-64 w-full" />
    ) : (
      <Card variant="glass" className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2} size="lg">Tipi</Heading>
          <Button variant="ember" size="sm" onClick={() => setShowCreate(true)}>
            Crea tipo
          </Button>
        </div>
        <DataTable columns={columns} data={types} variant="compact" />
      </Card>
    )}
```

For phase 170 substitutions (per UI-SPEC §API-Keys Page Layout):
- Title: `API Keys`, icon: `🔑`, heading-2: `Chiavi attive`, create label: `Crea nuova API key`
- Add session-expired banner between error banner and loading: `{error === 'SESSION_EXPIRED' && <Banner variant="warning">...</Banner>}`

**DataTable columns pattern** (`app/registry/types/page.tsx:79-123`):
```typescript
const columns: ColumnDef<DeviceType>[] = [
  { accessorKey: 'label', header: 'Etichetta', enableSorting: true },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <code className="text-sm font-mono text-slate-400">{row.original.slug}</code>,
  },
  {
    accessorKey: 'created_at',
    header: 'Creato',
    cell: ({ row }) => new Date(row.original.created_at * 1000).toLocaleDateString('it-IT'),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => row.original.is_builtin ? null : (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setTypeToEdit(row.original)}>Modifica</Button>
        <Button variant="danger" size="sm" onClick={() => setTypeToDelete(row.original)}>Elimina</Button>
      </div>
    ),
    enableSorting: false,
  },
];
```

For phase 170 substitute (per D-09 + UI-SPEC columns table):
- `created_at` cell: `formatRelativeTime(Date.parse(row.original.created_at))` — note registry uses seconds-since-epoch `* 1000`, phase 170 uses ISO-8601 `Date.parse()` (see `types/authProxy.ts:56`)
- Add `last_used_at` column with `ts ? formatRelativeTime(Date.parse(ts)) : <span className="text-slate-500">Mai usata</span>`
- Add `is_active` column with `<Badge variant={row.original.is_active ? 'ocean' : 'neutral'} size="sm">{row.original.is_active ? 'Attiva' : 'Revocata'}</Badge>`
- Actions column: single `Revoca` button, disabled when `!row.original.is_active`

**FormModal create pattern** (`app/registry/types/page.tsx:205-247`):
```typescript
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
  {({ control }: any) => (
    <Controller
      name="slug"
      control={control}
      render={({ field, fieldState }) => (
        <Input label="Slug" data-field="slug" {...field} error={fieldState.error?.message} placeholder="es. irrigatore" />
      )}
    />
    ...
  )}
</FormModal>
```

For phase 170 (per D-10 — reveal-swap logic lives OUTSIDE FormModal to preserve its internal state behavior):
- Use two separate top-level JSX blocks: `<FormModal>` for the form and `<Modal>` (direct) for the reveal view. Toggle between them with `revealedKey` state — form is rendered when `revealedKey === null`, reveal Modal when `revealedKey !== null`.
- Do NOT pass `successMessage` — the reveal view IS the success state; FormModal's default 800ms success overlay would race with reveal swap.

**ConfirmationDialog pattern** (`app/registry/types/page.tsx:283-292`):
```typescript
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

For phase 170 (per UI-SPEC §Destructive confirmations):
```typescript
<ConfirmationDialog
  isOpen={keyToRevoke !== null}
  onClose={() => setKeyToRevoke(null)}
  onConfirm={handleRevoke}
  title="Revoca API key"
  description={`Revocare "${keyToRevoke?.name}"? L'azione è irreversibile e le applicazioni che usano questa chiave smetteranno di funzionare.`}
  confirmLabel="Revoca"
  cancelLabel="Annulla"
  variant="danger"
/>
```

Note: `ConfirmationDialog.tsx:169-181` auto-focuses the Cancel button when `variant="danger"` — safe default already baked in.

**Reveal view pattern (NEW, synthesized from UI-SPEC + CopyableIp)**:
- CopyableIp (`app/network/components/CopyableIp.tsx:17-48`) provides the copy+2s-revert state machine.
- UI-SPEC §Plaintext key reveal view fixes DOM + copy verbatim.
- Build as inline JSX inside `app/settings/api-keys/page.tsx` — do not extract a reusable component for this phase.

---

### `app/login/page.tsx` (page, request-response)

**Analog:** `app/registry/types/page.tsx` (form-stack pattern, hosted at page level instead of modal level) + `app/components/SettingsLayout.tsx` (page scaffolding).

**Form/Zod/RHF stack** — same 3 imports as registry (`z`, `Controller`, `zodResolver`) plus:
```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
```

**Page structure** (per UI-SPEC §Login Form Layout):
```typescript
<SettingsLayout title="Accedi" showBackButton={false}>
  <Text size="sm" variant="secondary">Inserisci le tue credenziali per gestire le API key.</Text>
  <Card variant="glass" className="max-w-sm mx-auto p-6 sm:p-8">
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {errors.root && <Banner variant="error" compact>{errors.root.message}</Banner>}
      <div className="space-y-4">
        <Controller name="username" control={control} render={...} />
        <Controller name="password" control={control} render={...} />
      </div>
      <Button type="submit" variant="ember" fullWidth loading={isSubmitting} className="mt-6">
        Accedi{rateLimitedUntil > Date.now() ? ` (riprova tra ${secondsLeft}s)` : ''}
      </Button>
    </form>
  </Card>
</SettingsLayout>
```

**SettingsLayout**: `showBackButton={false}` is documented in `app/components/SettingsLayout.tsx:11` and rendered conditionally at `:47-56`.

**Next-param validation** (per UI-SPEC §Login Form Layout rule 7): validate `searchParams.get('next')` starts with `/` before `router.push()` to prevent open-redirect.

**Rate-limit countdown** (per D-18): local `useState<number>(0)` for `rateLimitedUntil`, render countdown suffix in button label, `setInterval(..., 1000)` updates display, disable submit while active.

---

### `app/hooks/useApiKeys.ts` (hook, CRUD)

**Analog:** `app/registry/types/page.tsx:41-69` (inline `useDeviceTypes`), `app/registry/devices/page.tsx:52-111` (inline `useRegistryDevices`).

**Hook skeleton pattern** (`app/registry/types/page.tsx:41-69`):
```typescript
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
      const sorted = [...data].sort((a, b) => a.label.localeCompare(b.label, 'it'));
      setTypes(sorted);
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

For phase 170 (extract to `app/hooks/useApiKeys.ts` instead of inline since two pages could consume it):
- Typing: `APIKeyInfo[]` from `@/types/authProxy`
- Endpoint: `/api/auth/api-keys`
- Shape returned by GET: `APIKeyListResponse { keys, count }` — use `data.keys` (NOT sorted — HA proxy owns order; UI-SPEC §DataTable columns sets `enableSorting` per column)
- Add `401 → setError('SESSION_EXPIRED')` branch per D-04 + Research Pitfall 6
- Add `create(name)` method returning `APIKeyResponse` (plaintext) — DO NOT mutate state; caller handles reveal
- Add `revoke(keyId)` — `404` treated as already-revoked (no error)

**Mutation pattern** — registry uses inline `handleCreate`/`handleDelete` on the page (`app/registry/types/page.tsx:126-179`); phase 170 moves mutations INTO the hook per D-12 `{ create, revoke }`. This is the only structural deviation from the registry analog.

---

### `app/hooks/useLogin.ts` (hook, request-response)

**Analog:** Same hook skeleton (`app/registry/types/page.tsx:41-69`) adapted for command-only flow (no initial fetch).

**Key differences from CRUD hook:**
- NO `useEffect(() => refetch())` — login is imperative, not lifecycle-driven.
- `login({username, password})` POSTs JSON; empty body (`payload ? JSON.stringify(payload) : undefined`) for env-fallback.
- Sentinel error codes: `'RATE_LIMITED' | 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR'` — component maps to toast copy (UI-SPEC §Error states).
- `rateLimitedUntil: number` state for D-18 30s lockout.
- `logout()` → `POST /api/auth/logout` (no-body) → returns `void`.

See RESEARCH.md Pattern 7 for full reference implementation (lines 672-728).

---

### `app/api/auth/logout/route.ts` (NEW — command route)

**Analog:** `app/api/auth/login/route.ts` (structure) + `app/api/v1/dirigera/health/route.ts` (minimal zero-arg shape).

**Imports pattern** (`app/api/auth/login/route.ts:13-15`):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { login } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
```

For phase 170 (drop `login`, add `cookies`):
```typescript
import { cookies } from 'next/headers';
import { withAuthAndErrorHandler, success } from '@/lib/core';
```

**Route handler pattern** (`app/api/auth/login/route.ts:17-34`):
```typescript
export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  // ... credential logic ...
  await login(username, password);
  return success({ authenticated: true });
}, 'Auth/Login');
```

For phase 170 logout:
```typescript
export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  const cookieStore = await cookies();  // Next.js 16: cookies() is async — Research Pitfall 2
  cookieStore.delete('ha_auth');
  return success({ authenticated: false });
}, 'Auth/Logout');
```

**Response helper**: `success()` wraps `{ ok: true, data: ... }` (confirmed by mock at `__tests__/api/auth/api-keys/route.test.ts:16`).

---

### `app/api/auth/login/route.ts` (MODIFY — add body parsing + cookie)

**Current shape** (`app/api/auth/login/route.ts:19-34`): zero-arg handler reading only env vars.

**Modification per D-15 + RESEARCH Pattern 8**:
```typescript
export const POST = withAuthAndErrorHandler(async (request) => {
  // Tolerant body parse (Research Pitfall 4: request.json() throws on empty body)
  let body: { username?: string; password?: string } = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) body = JSON.parse(text);
  } catch {
    throw ApiError.badRequest('Invalid JSON body');
  }

  const username = body.username ?? process.env.HA_ADMIN_USER;
  const password = body.password ?? process.env.HA_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new ApiError(ERROR_CODES.EXTERNAL_API_ERROR, 'HA proxy auth not configured: missing credentials', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  await login(username, password);  // T-157-01: access_token NOT captured

  const cookieStore = await cookies();
  cookieStore.set('ha_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',  // matches lib/auth0.ts:49
    path: '/',
    maxAge: 60 * 60,
  });

  return success({ authenticated: true });
}, 'Auth/Login');
```

**`secure` flag pattern source** (`lib/auth0.ts:46-52`):
```typescript
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}
```

Phase 170's `ha_auth` cookie adopts the exact same flags.

---

### `app/components/Navbar.tsx` (MODIFY — add KeyRound entry)

**Approach:** Add entry to `GLOBAL_SECTIONS` data source in `lib/devices/deviceTypes.ts:305-332`, NOT to JSX. Both desktop (line 321-341) and mobile (line 561-602) render blocks consume `navStructure.global.map()` so a single data change lights up both.

**Existing GLOBAL_SECTIONS entries** (`lib/devices/deviceTypes.ts:305-332`):
```typescript
export const GLOBAL_SECTIONS: Record<string, GlobalSection> = {
  REGISTRO: {
    id: 'registry',
    name: 'Registro',
    icon: '📋',
    route: '/registry/types',
    items: [...]
  },
  STANZE: { id: 'rooms', name: 'Stanze', icon: '🏠', route: '/rooms', items: [...] },
  AUTOMAZIONI: { id: 'automations', name: 'Automazioni', icon: '⚡', route: '/automations' },
};
```

Phase 170 append:
```typescript
API_KEYS: {
  id: 'api-keys',
  name: 'API Keys',
  icon: '🔑',  // emoji in data source; KeyRound lucide in getIconForPath
  route: '/settings/api-keys',
},
```

**Icon-map extension** (`app/components/Navbar.tsx:179-188`):
```typescript
const getIconForPath = (path: string) => {
  if (path === '/') return <Home className="w-5 h-5" />;
  if (path.includes('scheduler')) return <Calendar className="w-5 h-5" />;
  if (path.includes('errors')) return <AlertCircle className="w-5 h-5" />;
  if (path.includes('log')) return <Clock className="w-5 h-5" />;
  if (path.includes('registry')) return <ClipboardList className="w-5 h-5" />;
  if (path.includes('rooms')) return <DoorOpen className="w-5 h-5" />;
  if (path.includes('automations')) return <Zap className="w-5 h-5" />;
  return null;
};
```

Phase 170 additions:
- Add `KeyRound` to lucide import at line 7.
- Add `if (path.includes('api-keys')) return <KeyRound className="w-5 h-5" />;` before the final `return null;`.

**Prefix-active helper** (`app/components/Navbar.tsx:173-176`): already handles `/settings/api-keys` via the `/settings` prefix — but per Research Pitfall 3 and UI-SPEC §Navbar Entry, the `isGlobalActive(route)` derives prefix from first path segment, meaning `/settings/api-keys` gets prefix `/settings`. **Careful**: this would also light up the global entry when on unrelated `/settings/notifications`. Planner must decide whether to special-case `api-keys` with exact-match or accept the prefix-match behavior. The existing `GLOBAL_SECTIONS.STANZE.route = '/rooms'` already benefits from prefix matching; introducing `/settings/api-keys` is the first two-segment global route.

---

### `__tests__/api/auth/login/route.test.ts` (EXTEND)

**Analog:** Self — extend with 4 new cases.

**Existing pattern** (`__tests__/api/auth/login/route.test.ts:11-17`):
```typescript
jest.mock('@/lib/auth/authProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;
```

**Phase 170 additions required (D-15):**
- Mock `next/headers` `cookies()` function returning a mock store with `.set()` spy:
  ```typescript
  const mockSet = jest.fn();
  jest.mock('next/headers', () => ({
    cookies: () => Promise.resolve({ set: mockSet, delete: jest.fn() }),
  }));
  ```
- Test: "accepts optional body { username, password } and uses them instead of env vars"
  - Pass `makeRequest({ username: 'bob', password: 'pw' })` → expect `mockLogin.toHaveBeenCalledWith('bob', 'pw')`.
- Test: "falls back to env vars when body is empty"
  - Pass `makeRequest({})` → expect `mockLogin.toHaveBeenCalledWith('admin', 'secret')`.
- Test: "sets ha_auth cookie on success"
  - Assert `mockSet` called with `'ha_auth', '1', { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 3600 }`.
- Test: "does NOT return access_token in response body (T-157-01 preservation)"
  - Assert response body is exactly `{ ok: true, data: { authenticated: true } }` — no `access_token` key.

**`makeRequest` helper** (copy from `__tests__/api/auth/api-keys/route.test.ts:93-97`):
```typescript
function makeRequest(body: unknown): Request {
  return {
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as unknown as Request;
}
```
Note: Extend to include `.text()` since the new route reads `request.text()` first (Pattern 8).

---

### `__tests__/api/auth/logout/route.test.ts` (NEW)

**Analog:** `__tests__/api/auth/login/route.test.ts` — identical `withAuthAndErrorHandler` mock + env-reset pattern.

**Test cases:**
- "calls cookies().delete('ha_auth') and returns { authenticated: false }"
- "propagates ApiError if cookies() throws" (defensive — unlikely but matches login route test shape)

Use same `mockSet`/`mockDelete` mocking of `next/headers` as the login route extension.

---

### `__tests__/app/login/page.test.tsx` (NEW)

**Analog:** `__tests__/app/settings/thermostat/page.test.tsx` (RTL + SettingsLayout mock + Next router mock).

**Imports pattern** (`__tests__/app/settings/thermostat/page.test.tsx:1-18`):
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ThermostatSettingsPage from '@/app/settings/thermostat/page';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

jest.mock('@/app/components/SettingsLayout', () => {
  return function MockSettingsLayout({ children, title }: any) {
    return (<div data-testid="settings-layout"><h1>{title}</h1>{children}</div>);
  };
});
```

**Phase 170 login-page tests (D-20):**
- Add `useSearchParams` mock alongside `useRouter` (both from `next/navigation`).
- Mock `@/app/hooks/useLogin` with `jest.fn()` for `login` + `logout` + state values.
- Mock `@/app/hooks/useToast`.
- Tests:
  - "renders username + password inputs + Accedi button"
  - "submits with credentials on valid input"
  - "shows 'Credenziali non valide' banner on 401 (INVALID_CREDENTIALS sentinel)"
  - "disables submit + shows countdown on 429 (RATE_LIMITED sentinel)"
  - "redirects to `next` query param on success (with `/` prefix validation)"

---

### `__tests__/app/settings/api-keys/page.test.tsx` (NEW)

**Analog:** `__tests__/app/settings/thermostat/page.test.tsx` + mock usage of `useApiKeys`.

**Phase 170 api-keys-page tests (D-20):**
- Mock `@/app/hooks/useApiKeys` — return `{ keys: [], loading: true, ... }` initially.
- Mock `@/app/components/SettingsLayout`, `@/app/components/ui/DataTable`, `@/app/components/ui/FormModal`, `@/app/components/ui/ConfirmationDialog`, `@/app/components/ui/Modal` — simplify to dumb children renderers (same strategy as thermostat page test mocks).
- Tests:
  - "renders skeleton while loading"
  - "renders empty state when `keys=[]` after load"
  - "renders list with is_active badge cells"
  - "opens create modal on button click"
  - "shows plaintext key on create success, hides on close" (the **plaintext-key-once-visible** assertion from D-20)
  - "opens revoke confirmation on Revoca click"
  - "shows re-auth banner when error='SESSION_EXPIRED'"

---

### `__tests__/hooks/useLogin.test.ts` and `__tests__/hooks/useApiKeys.test.ts` (NEW)

**Analog for structure:** `__tests__/hooks/useScheduleData.test.ts` (very shallow — just exports).
**Analog for behavior:** `__tests__/api/auth/api-keys/route.test.ts:46-127` (fetch mocks + async assertions).

**Pattern to use (D-19):** `renderHook` from `@testing-library/react`, global `fetch` mock per test.

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiKeys } from '@/app/hooks/useApiKeys';

describe('useApiKeys', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('fetches and sets keys on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ keys: [/* ... */], count: 0 }),
    });

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.keys).toHaveLength(0);
  });

  it('sets SESSION_EXPIRED on 401', async () => { /* ... */ });
  it('create() returns plaintext key on success', async () => { /* ... */ });
  it('revoke() treats 404 as already-revoked', async () => { /* ... */ });
});
```

For `useLogin`:
- "login with no payload sends empty body"
- "login with payload sends JSON-stringified body"
- "sets RATE_LIMITED + rateLimitedUntil on 429"
- "sets INVALID_CREDENTIALS on 401"
- "logout POSTs /api/auth/logout"

---

### `tests/smoke/page-loads.spec.ts` (MODIFY — add 2 entries)

**Analog:** Self — follow existing shape.

**Pattern to extend** (`tests/smoke/page-loads.spec.ts:36-47`):
```typescript
test('/stove loads and shows data', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);
  await page.goto('/stove');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
  cleanup();
  expect(errors, `Console errors on /stove: ${errors.join(', ')}`).toHaveLength(0);
});
```

**Phase 170 additions (D-21):**
- Add new `test.describe('Auth UI', () => { ... })` block (or append to `Support Pages` block).
- Two tests: `/login loads` (asserts login heading `Accedi` visible) and `/settings/api-keys loads` (asserts heading `API Keys` visible OR locates `main`).
- Use same `collectConsoleErrors` + `networkidle`/`domcontentloaded` + `main` locator pattern.
- **Structural smoke only**: do NOT submit credentials — the Playwright `realAuthState` already gates Auth0; the HA-proxy login form will render but not be exercised here.

---

### `tests/features/auth-ui.spec.ts` (NEW — full happy path with mocks)

**Analog:** `tests/features/thermostat-schedule.spec.ts` (describe + beforeEach + getByRole chains).

**Pattern from analog** (`tests/features/thermostat-schedule.spec.ts:3-14`):
```typescript
test.describe('Thermostat Schedule Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display thermostat card with device info', async ({ page }) => {
    const thermostatHeading = page.getByRole('heading', { name: 'Termostato', level: 2 });
    await expect(thermostatHeading).toBeVisible({ timeout: 15000 });
  });
});
```

**Phase 170 additions (D-22, mocked routes to avoid real HA backend — Research Pitfall 7):**
```typescript
test.describe('Auth UI Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock /api/auth/* routes — branch on method per Research Pitfall 7
    await page.route('**/api/auth/login', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 200, body: JSON.stringify({ ok: true, data: { authenticated: true } }) });
      }
      return route.continue();
    });
    await page.route('**/api/auth/api-keys', (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill({ status: 200, body: JSON.stringify({ keys: [], count: 0 }) });
      if (method === 'POST') return route.fulfill({
        status: 201,
        body: JSON.stringify({ id: 1, name: 'Test', api_key: 'ha_live_abc123', created_at: '2026-04-23T00:00:00Z' }),
      });
      return route.continue();
    });
    await page.route(/\/api\/auth\/api-keys\/\d+$/, (route) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204, body: '' });
      return route.continue();
    });
  });

  test('login → list → create → reveal → close → revoke happy path', async ({ page }) => {
    await page.goto('/settings/api-keys');
    // ... sequence per D-22 ...
  });
});
```

---

## Shared Patterns

### Authentication Guard (server-side)
**Source:** `app/api/auth/login/route.ts:19` — `withAuthAndErrorHandler`
**Apply to:** All new API routes (logout) and the modified login route.
```typescript
export const POST = withAuthAndErrorHandler(async (request) => {
  // ... handler ...
}, 'Auth/ModuleName');
```

### Italian Locale Error / Loading / Empty Copy
**Source:** `app/registry/types/page.tsx:51` `'Errore nel caricamento dei tipi'`, `:188` `<Banner variant="error">`, `:190` `<Skeleton>`
**Apply to:** Both new pages. Copy strings are pinned in UI-SPEC §Copywriting Contract.

### Cookie Security Flags
**Source:** `lib/auth0.ts:46-52`
**Apply to:** `ha_auth` cookie set in login route + delete in logout route.
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}
```

### Next.js 16 `cookies()` Awaiting
**Source:** RESEARCH.md Pitfall 2 + Pattern 1/2 — `const cookieStore = await cookies();`
**Apply to:** Both login (set) and logout (delete) routes.

### Fetch-Mock Jest Pattern
**Source:** `__tests__/api/auth/api-keys/route.test.ts:20-45`
```typescript
jest.mock('@/lib/auth/authProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  created: (data: unknown) => ({ ok: true, created: true, data }),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;
```
**Apply to:** Login route test (extend), logout route test (new). For hook tests, mock `global.fetch` instead.

### Form Zod Schema Structure
**Source:** `app/registry/types/page.tsx:21-31`, `app/registry/devices/page.tsx:33-43`
**Apply to:** `createKeySchema` (name only) and `loginSchema` (username, password).

### Toast Helper
**Source:** `app/hooks/useToast.ts` — `const { success, error, warning } = useToast();`
**Apply to:** Login page (rate-limit warning, server error), api-keys page (revoke success, revoke failure, create failure).

### Relative-Time Formatting
**Source:** `lib/hooks/useRelativeTime.ts:13` — `formatRelativeTime(tsMs: number): string` — 'Adesso' / '{N}s fa' / '{N}m fa' / etc.
**Apply to:** DataTable `created_at` and `last_used_at` cells on api-keys page.
**Note:** Registry uses `new Date(unix_seconds * 1000).toLocaleDateString('it-IT')` — phase 170 switches to `formatRelativeTime` per D-09 which already lives in `lib/hooks/useRelativeTime.ts`.

### Data-Driven Navigation Entry
**Source:** `lib/devices/deviceTypes.ts:305-332` (`GLOBAL_SECTIONS`) consumed by `lib/devices/deviceRegistry.ts:142-149` (`getGlobalNavItems`) → `app/components/Navbar.tsx:321+` (desktop) and `:561+` (mobile).
**Apply to:** Single data-only addition to `GLOBAL_SECTIONS.API_KEYS` + icon helper update in `Navbar.tsx:179-188`. Avoid hand-editing either JSX render block (Research Pitfall 8).

### SettingsLayout Wrapper
**Source:** `app/components/SettingsLayout.tsx:25-69`
**Apply to:** Both `/login` (with `showBackButton={false}`) and `/settings/api-keys` (default back button, `backHref="/"`).

---

## No Analog Found

All files have at least a partial analog in the codebase. The one case that required synthesis (no clean existing pattern) is:

| File/Feature | Role | Reason | Research Reference |
|--------------|------|--------|---------------------|
| Plaintext-key reveal view (inline in `app/settings/api-keys/page.tsx`) | composite UI | No existing one-time-reveal-then-wipe pattern in the codebase. FormModal's success overlay + CopyableIp's copy-state are both building blocks, but their composition is phase 170's UX centerpiece. | UI-SPEC §Plaintext key reveal view (verbatim DOM + rules 1-8) + RESEARCH.md Pattern 4 (lines 418-517) |

Planner should follow the UI-SPEC diagram + RESEARCH Pattern 4 exactly rather than searching further for an analog.

---

## Metadata

**Analog search scope:**
- `app/registry/types/page.tsx` (primary CRUD analog)
- `app/registry/devices/page.tsx` (paginated CRUD analog with useWatch pattern)
- `app/settings/thermostat/page.tsx` test analog
- `app/api/auth/login/route.ts`, `app/api/auth/api-keys/route.ts`, `app/api/auth/api-keys/[keyId]/route.ts` (existing phase 157 routes)
- `app/api/v1/dirigera/health/route.ts` (minimal route analog)
- `app/components/Navbar.tsx` + `lib/devices/deviceRegistry.ts` + `lib/devices/deviceTypes.ts` (nav data-flow)
- `app/components/SettingsLayout.tsx`, `app/components/ui/FormModal.tsx`, `app/components/ui/ConfirmationDialog.tsx` (UI primitives)
- `app/network/components/CopyableIp.tsx` (copy-to-clipboard state machine)
- `app/hooks/useToast.ts`, `lib/hooks/useRelativeTime.ts` (utility hooks)
- `__tests__/api/auth/{login,api-keys}/route.test.ts` (route test analogs)
- `__tests__/app/settings/thermostat/page.test.tsx` (component test analog — only RTL page test in tree)
- `__tests__/hooks/useScheduleData.test.ts` (hook test analog — shallow)
- `tests/smoke/page-loads.spec.ts`, `tests/smoke/auth-flows.spec.ts`, `tests/features/thermostat-schedule.spec.ts`, `tests/features/notification-delivery.spec.ts` (E2E analogs)
- `lib/auth0.ts` (cookie-flag reference)
- `types/authProxy.ts` (consumer types)

**Files scanned:** ~25 files read + ~10 globs/greps.

**Pattern extraction date:** 2026-04-23

**Skills consulted:** CLAUDE.md project instructions (Ember Noir design system rules, filterUndefined firebase pattern, never run npm install/build, design system at /debug/design-system). No `.claude/skills/` or `.agents/skills/` directory present — no additional skill context loaded.
