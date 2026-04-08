# Phase 158: Automations Module - Research

**Researched:** 2026-04-08
**Domain:** Next.js App Router — proxy CRUD module with full-stack coverage (types, proxy, API routes, hooks, pages, nav)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use DataTable + FormModal + ConfirmationDialog pattern (v15.0 Devices/Rooms pages) for rules list
- **D-02:** Rules list page at `/automations` with paginated DataTable, create/edit via FormModal, delete via ConfirmationDialog
- **D-03:** Execution history accessed via `/automations/[rule_id]` detail page (not inline rows)
- **D-04:** History displayed as DataTable with pagination using PaginatedResponse<T> pattern
- **D-05:** Simple form fields proxied to HA backend — no visual rule editor. Triggers/conditions/actions as JSON Textarea if HA schema exposes complex structure
- **D-06:** FormModal with Zod validation for create/edit form, following Device Types page pattern
- **D-07:** "Automazioni" as top-level nav entry (same level as Stanze, Registro)

### Claude's Discretion
- Proxy function naming and grouping within `automationsProxy.ts`
- Exact DataTable column selection for rules list and execution history
- Loading skeletons and empty state messaging
- Error handling UX for failed CRUD operations

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTO-01 | User può listare le regole di automazione (paginato) via GET /api/v1/automations | `getAutomations()` proxy fn + `/api/v1/automations` GET route returning PaginatedResponse<AutomationRule> |
| AUTO-02 | User può creare una regola via POST /api/v1/automations | `createAutomation()` proxy fn + POST route + FormModal Zod schema |
| AUTO-03 | User può vedere una singola regola via GET /api/v1/automations/{rule_id} | `getAutomation(id)` proxy fn + `/api/v1/automations/[rule_id]` GET route |
| AUTO-04 | User può aggiornare una regola via PATCH /api/v1/automations/{rule_id} | `updateAutomation(id, body)` proxy fn using `haPatch` + PATCH route — **requires adding `haPatch` to haClient.ts** |
| AUTO-05 | User può eliminare una regola via DELETE /api/v1/automations/{rule_id} | `deleteAutomation(id)` proxy fn + DELETE route using `haDelete` |
| AUTO-06 | User può vedere lo storico esecuzioni via GET /api/v1/automations/{rule_id}/executions | `getExecutions(id, params)` proxy fn + `/api/v1/automations/[rule_id]/executions` GET route |
</phase_requirements>

---

## Summary

Phase 158 implements a full CRUD Automations module following the established v15.0 pattern (Registro + Stanze). The module is purely a thin proxy layer: the HA backend owns rule logic; the frontend manages rule lifecycle and surfaces execution history. Every layer is already templated in the codebase — this phase is mechanical application of existing patterns to a new domain.

The single non-trivial discovery is that `haClient.ts` currently exposes `haGet`, `haPost`, `haPut`, and `haDelete` — but the HA backend requirement AUTO-04 uses HTTP PATCH (not PUT). A `haPatch` function must be added to `haClient.ts` before `automationsProxy.ts` can call it. This is a 10-line addition identical in structure to `haPut`.

The nav entry for "Automazioni" follows the `GLOBAL_SECTIONS` registry in `lib/devices/deviceTypes.ts`, which already drives both desktop `DropdownItem` and mobile `MenuItem` rendering in `Navbar.tsx`. Adding one object to `GLOBAL_SECTIONS` and one icon mapping in `getIconForPath` is the complete nav change.

**Primary recommendation:** Seven deliverable files across five layers (types, proxy, API routes ×4, hook, pages ×2, nav config). Plan as two waves: Wave 1 = infrastructure (types + proxy + haClient patch + routes), Wave 2 = UI (hook + pages + nav).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | API routes + RSC pages | Project baseline [VERIFIED: CLAUDE.md] |
| Zod | already installed | FormModal validation schema | Used in all existing CRUD pages [VERIFIED: rooms/page.tsx, devices/page.tsx] |
| react-hook-form + Controller | already installed | Form field binding in FormModal | Used in all existing FormModal instances [VERIFIED: rooms/page.tsx] |
| @tanstack/react-table ColumnDef | already installed | DataTable column definitions | Used in devices/page.tsx, rooms/page.tsx [VERIFIED: codebase] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/haClient` haGet/haPost/haDelete | — | HA proxy transport | All proxy functions [VERIFIED: registryProxy.ts] |
| `lib/haClient` haPatch | — (to be added) | PATCH transport for AUTO-04 | `updateAutomation()` only |
| `lib/core` withAuthAndErrorHandler | — | Route middleware | All protected API routes [VERIFIED: thermorossi/status/route.ts] |
| `lib/core` success/created/noContent | — | Response helpers | All route handlers [VERIFIED: registry/types/route.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `haPatch` (new fn) | `haPut` with PATCH semantics | haPut sends PUT — would misroute on HA backend expecting PATCH. Must add haPatch |
| Dedicated `/api/v1/automations/*` routes | `/api/automations/*` (non-v1 path) | v19.0 standardizes all new endpoints under `/api/v1/` per PATH-01. Must use v1 path |

---

## Architecture Patterns

### Recommended Project Structure

```
lib/automations/
├── automationsProxy.ts     # proxy client (haGet/haPost/haPatch/haDelete)
└── index.ts                # barrel export

types/
└── automations.ts          # AutomationRule, AutomationCreate, AutomationUpdate, AutomationExecution

app/api/v1/automations/
├── route.ts                # GET (list, paginated) + POST (create)
└── [rule_id]/
    ├── route.ts            # GET (single) + PATCH (update) + DELETE
    └── executions/
        └── route.ts        # GET (execution history, paginated)

app/automations/
├── page.tsx                # rules list — DataTable + FormModal + ConfirmationDialog
└── [rule_id]/
    └── page.tsx            # rule detail + execution history DataTable

lib/devices/
└── deviceTypes.ts          # add AUTOMAZIONI entry to GLOBAL_SECTIONS
```

### Pattern 1: Proxy Client (automationsProxy.ts)

**What:** Named function module, thin wrappers over haClient transports. No response transformation.
**When to use:** All HA backend calls. Never call haClient directly from routes.

```typescript
// Source: lib/registry/registryProxy.ts (canonical reference)
import { haGet, haPost, haPatch, haDelete } from '@/lib/haClient';
import type { PaginatedResponse } from '@/types/common';
import type { AutomationRule, AutomationCreate, AutomationUpdate, AutomationExecution } from '@/types/automations';

async function getAutomations(params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<AutomationRule>> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.offset !== undefined) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return haGet<PaginatedResponse<AutomationRule>>(
    `/api/v1/automations${query ? `?${query}` : ''}`
  );
}

async function createAutomation(body: AutomationCreate): Promise<AutomationRule> {
  return haPost<AutomationRule>('/api/v1/automations', body as unknown as Record<string, unknown>);
}

async function getAutomation(ruleId: string): Promise<AutomationRule> {
  return haGet<AutomationRule>(`/api/v1/automations/${ruleId}`);
}

async function updateAutomation(ruleId: string, body: AutomationUpdate): Promise<AutomationRule> {
  return haPatch<AutomationRule>(`/api/v1/automations/${ruleId}`, body as unknown as Record<string, unknown>);
}

async function deleteAutomation(ruleId: string): Promise<void> {
  return haDelete(`/api/v1/automations/${ruleId}`);
}

async function getExecutions(ruleId: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<AutomationExecution>> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.offset !== undefined) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return haGet<PaginatedResponse<AutomationExecution>>(
    `/api/v1/automations/${ruleId}/executions${query ? `?${query}` : ''}`
  );
}

export const automationsProxy = { getAutomations, createAutomation, getAutomation, updateAutomation, deleteAutomation, getExecutions };
```

[VERIFIED: pattern from lib/registry/registryProxy.ts]

### Pattern 2: haPatch addition to haClient.ts

**What:** New exported function `haPatch<T>` in `lib/haClient.ts`, identical to `haPut` with `method: 'PATCH'`.
**When to use:** Required for PATCH /api/v1/automations/{rule_id} (AUTO-04).

```typescript
// Source: lib/haClient.ts — haPut as template (lines 224-257)
export async function haPatch<T>(
  endpoint: string,
  body: Record<string, unknown> | object,
  options: HaRequestOptions = {}
): Promise<T> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return await mapResponseError(response);
    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}
```

[VERIFIED: pattern from lib/haClient.ts haPut implementation]

### Pattern 3: API Routes (v1 path, withAuthAndErrorHandler)

```typescript
// Source: app/api/v1/thermorossi/status/route.ts + app/api/registry/types/route.ts
import { withAuthAndErrorHandler, success, created, noContent } from '@/lib/core';
import { parseJson, parseQuery } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';

export const dynamic = 'force-dynamic';

// GET /api/v1/automations — paginated list
export const GET = withAuthAndErrorHandler(async (request) => {
  const { limit, offset } = parseQuery(request, { limit: 20, offset: 0 });
  const data = await automationsProxy.getAutomations({ limit: Number(limit), offset: Number(offset) });
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/List');

// POST /api/v1/automations — create
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await request.json();
  const data = await automationsProxy.createAutomation(body);
  return created(data as unknown as Record<string, unknown>);
}, 'Automations/Create');
```

[VERIFIED: pattern from app/api/registry/types/route.ts]

### Pattern 4: Dynamic Route with Params

```typescript
// Source: app/api/registry/devices/[device_id]/route.ts — params pattern
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const data = await automationsProxy.getAutomation(rule_id);
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Get');

export const PATCH = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const body = await request.json();
  const data = await automationsProxy.updateAutomation(rule_id, body);
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Update');

export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  await automationsProxy.deleteAutomation(rule_id);
  return noContent();
}, 'Automations/Delete');
```

[VERIFIED: pattern from app/api/registry/devices/[device_id]/route.ts]

### Pattern 5: Nav Entry (GLOBAL_SECTIONS in deviceTypes.ts)

**What:** Add entry to `GLOBAL_SECTIONS` constant. Navbar reads this automatically — no changes to Navbar.tsx JSX needed except the icon mapping in `getIconForPath`.

```typescript
// Source: lib/devices/deviceTypes.ts GLOBAL_SECTIONS (lines 305-326)
// ADD to GLOBAL_SECTIONS:
AUTOMAZIONI: {
  id: 'automations',
  name: 'Automazioni',
  icon: '⚡',  // or use Zap lucide icon — see icon note below
  route: '/automations',
  // No items array needed — single route, no dropdown
},
```

Icon note: `getIconForPath` in Navbar.tsx handles icon mapping for path-based routing. A new `if (path.includes('automations'))` branch is needed there to return a lucide icon (e.g. `<Zap className="w-5 h-5" />`). The `Zap` icon from lucide-react is used for automation/trigger concepts. [ASSUMED — icon choice is Claude's discretion per CONTEXT.md]

[VERIFIED: lib/devices/deviceTypes.ts GLOBAL_SECTIONS structure, Navbar.tsx getIconForPath pattern]

### Pattern 6: Page Hook (inline hook pattern from rooms/page.tsx)

```typescript
// Source: app/rooms/page.tsx useRooms hook pattern
function useAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      const res = await fetch(`/api/v1/automations?${params.toString()}`);
      if (!res.ok) throw new Error('Errore nel caricamento delle automazioni');
      const data = await res.json() as PaginatedResponse<AutomationRule>;
      setRules(data.items);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { rules, totalCount, loading, error, refetch, page, setPage };
}
```

[VERIFIED: pattern from app/rooms/page.tsx and app/registry/devices/page.tsx]

### Anti-Patterns to Avoid

- **Using `/api/automations` (non-v1 path):** v19.0 standardizes all new endpoints under `/api/v1/`. Route must be `/api/v1/automations`.
- **Using haPut for PATCH endpoint:** haPut sends `method: 'PUT'`, which will misroute on the HA backend. Must add and use `haPatch`.
- **Forgetting `export const dynamic = 'force-dynamic'`:** Every route handler in this codebase includes this. Missing it causes stale caching in production.
- **Using success() for raw array list:** The `success()` helper spreads data into `{ success: true, ...data }`. For paginated responses, the HA proxy returns `{ items, total_count, limit, offset }` which spreads correctly. Test the route response shape.
- **FormModal without key prop on edit modal:** Without `key={ruleToEdit?.id ?? 'edit'}`, react-hook-form `defaultValues` do not reset between different rule edits. [VERIFIED: rooms/page.tsx line 309 comment "key prop for remount"]
- **Page reset on filter change:** If execution history gets filter controls in future, `setPage(0)` must precede filter state change. [VERIFIED: devices/page.tsx handleProviderChange]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schema + FormModal | Already wired into FormModal — just pass `validationSchema` prop |
| Delete confirmation | Custom confirm UX | ConfirmationDialog component | Handles loading state, danger variant, accessibility |
| Table pagination | Custom pagination UI | DataTable built-in + manual prev/next buttons (devices page pattern) | DataTable has built-in pagination; server-side pagination uses explicit prev/next buttons as in devices/page.tsx |
| Toast notifications | Custom notification | `useToast()` hook | Already installed, used in every CRUD page |
| Error → ApiError mapping | Custom fetch error handling | `withAuthAndErrorHandler` + `haClient` error mapping | haClient maps all RFC 9457 errors, withAuthAndErrorHandler catches and formats |
| PATCH transport | Modified haPut call | New `haPatch` function in haClient.ts | Mirror of haPut — 10 lines, same error handling |

---

## Common Pitfalls

### Pitfall 1: Missing haPatch export in haClient.ts

**What goes wrong:** `automationsProxy.updateAutomation()` has no PATCH transport — must use PUT which semantically mismatches HA backend PATCH endpoint.
**Why it happens:** haClient.ts currently exports only `haGet, haPost, haPut, haDelete`. PATCH was never needed before this phase.
**How to avoid:** Add `haPatch` to haClient.ts (Wave 1 Task 1) before writing automationsProxy.ts.
**Warning signs:** TypeScript import error for `haPatch` in automationsProxy.ts.

### Pitfall 2: Wrong API path

**What goes wrong:** Page fetches from `/api/automations` instead of `/api/v1/automations`, bypassing the v1 proxy route.
**Why it happens:** Older non-v1 routes exist for rooms, registry etc. New v19.0 routes all live under `/api/v1/`.
**How to avoid:** Page hook uses `/api/v1/automations` fetch URL. Route file at `app/api/v1/automations/route.ts`.
**Warning signs:** 404 on API call in browser dev tools.

### Pitfall 3: FormModal key prop missing on edit modal

**What goes wrong:** Opening edit for rule A, closing, opening edit for rule B — form still shows rule A's data because `defaultValues` only apply on first mount.
**Why it happens:** react-hook-form `defaultValues` are not reactive; they only apply on component mount.
**How to avoid:** `<FormModal key={ruleToEdit?.id ?? 'edit'} ...>` forces remount when selected rule changes.
**Warning signs:** Form shows stale data from previously edited rule.

### Pitfall 4: GLOBAL_SECTIONS entry breaks isGlobalActive check

**What goes wrong:** Nav active state doesn't highlight "Automazioni" when on `/automations/[rule_id]` (detail page).
**Why it happens:** `isGlobalActive()` in Navbar.tsx derives prefix from first path segment — works for `/automations` and `/automations/[rule_id]` automatically because both start with `/automations`.
**How to avoid:** No special handling needed — `isGlobalActive('/automations')` returns true for all `/automations/*` paths. [VERIFIED: Navbar.tsx isGlobalActive implementation]
**Warning signs:** Nav item not highlighted on detail page.

### Pitfall 5: AutomationRule types assumed from v15.0 CRUD shape

**What goes wrong:** Types don't match what the HA backend actually returns, causing TypeScript errors or runtime mismatches.
**Why it happens:** The HA backend automation schema is not documented in this codebase. Phase depends on Phase 156 (PATH-01) completing.
**How to avoid:** Define types conservatively: `id: string` (or `number` — confirm with HA), `name: string`, `description?: string`, `enabled: boolean`, `last_execution_at?: string`, plus `unknown` for complex fields (triggers/conditions/actions). Use `unknown` and refine at runtime if HA schema is discovered to differ.
**Warning signs:** TypeScript errors when destructuring rule fields in page components.

---

## Code Examples

### Minimal AutomationRule type

```typescript
// types/automations.ts
export interface AutomationRule {
  id: string;                          // or number — confirm from HA response
  name: string;
  description?: string | null;
  enabled: boolean;
  last_execution_at?: string | null;   // ISO 8601 or null
  created_at?: string;
  // HA-specific fields (triggers, conditions, actions) — unknown shape until runtime
  [key: string]: unknown;
}

export interface AutomationCreate {
  name: string;
  description?: string | null;
  enabled?: boolean;
}

export interface AutomationUpdate {
  name?: string;
  description?: string | null;
  enabled?: boolean;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  status: 'success' | 'failure' | 'running';
  started_at: string;       // ISO 8601
  duration_ms?: number | null;
  error_message?: string | null;
}
```

[ASSUMED — exact field names depend on HA backend schema. Shape modeled after analogous RegistryDevice/Room patterns + UI-SPEC column requirements]

### Zod schema for FormModal

```typescript
// In app/automations/page.tsx
import { z } from 'zod';

const automationSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(128, 'Max 128 caratteri'),
  description: z.string().max(500, 'Max 500 caratteri').nullable().optional(),
  enabled: z.boolean().default(true),
});
type AutomationFormData = z.infer<typeof automationSchema>;
```

[VERIFIED: UI-SPEC interaction contract + Zod pattern from rooms/page.tsx]

### Execution history page fetch

```typescript
// In app/automations/[rule_id]/page.tsx
async function useExecutions(ruleId: string) {
  // Same inline hook pattern as useRooms() — fetch on mount, paginated
  const res = await fetch(`/api/v1/automations/${ruleId}/executions?limit=20&offset=${page * 20}`);
  const data = await res.json() as PaginatedResponse<AutomationExecution>;
}
```

[VERIFIED: pattern from app/registry/devices/page.tsx useRegistryDevices]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | AutomationRule.id is type `string`. May be `number` like RegistryDevice.id | Standard Stack types | TypeScript error in proxy + route; fix is one-line type change |
| A2 | HA backend returns execution history fields as `{ status, started_at, duration_ms, error_message }` | Code Examples AutomationExecution | UI-SPEC columns won't map correctly; fix requires type + column definition update |
| A3 | HA backend PATCH endpoint for update accepts partial body `{ name?, description?, enabled? }` | Architecture Patterns proxy | If backend requires full body (PUT semantics), behavior is same but method changes back to PUT |
| A4 | `Zap` lucide-react icon is appropriate for "Automazioni" nav entry | Architecture Pattern 5 (nav) | Cosmetic only — any lucide icon works |
| A5 | Complex rule fields (triggers/conditions/actions) returned by HA are optional and can be ignored in the basic create/edit form | Code Examples Zod schema | If HA requires them on POST, create would 422; add Textarea + JSON validation per UI-SPEC D-05 guidance |

---

## Open Questions

1. **AutomationRule field shape from HA backend**
   - What we know: The frontend proxies whatever HA returns. UI-SPEC defines minimum display fields (name, enabled, last_execution_at).
   - What's unclear: Exact field names and types (especially `id` type: string vs number), and whether triggers/conditions/actions are required on POST.
   - Recommendation: Define conservative types with `unknown` index signature. If first test against HA returns 422, add the missing required fields. Phase depends on Phase 156 being complete.

2. **Execution history `status` enum values**
   - What we know: UI-SPEC defines three display states: Completata/Fallita/In esecuzione mapped to sage/danger/warning badges.
   - What's unclear: Exact string values in HA response (`success`/`failure`/`running` vs `completed`/`failed`/`in_progress`).
   - Recommendation: Define as string union in types, add a status → badge variant mapping function in the page component. Adjust values after first live test.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 158 is code/config only. All external dependencies (HA proxy, Next.js, existing npm packages) are already available and in use by the running application.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (project standard) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="automations" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | GET /api/v1/automations returns PaginatedResponse | unit | `npm test -- --testPathPattern="api/v1/automations" -t "GET"` | ❌ Wave 0 |
| AUTO-02 | POST /api/v1/automations creates rule | unit | `npm test -- --testPathPattern="api/v1/automations" -t "POST"` | ❌ Wave 0 |
| AUTO-03 | GET /api/v1/automations/[rule_id] returns single rule | unit | `npm test -- --testPathPattern="automations.*rule_id" -t "GET"` | ❌ Wave 0 |
| AUTO-04 | PATCH /api/v1/automations/[rule_id] updates rule | unit | `npm test -- --testPathPattern="automations.*rule_id" -t "PATCH"` | ❌ Wave 0 |
| AUTO-05 | DELETE /api/v1/automations/[rule_id] deletes rule | unit | `npm test -- --testPathPattern="automations.*rule_id" -t "DELETE"` | ❌ Wave 0 |
| AUTO-06 | GET executions returns PaginatedResponse<AutomationExecution> | unit | `npm test -- --testPathPattern="executions"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="automations" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/automationsProxy.test.ts` — covers proxy function calls for all 6 functions
- [ ] `app/api/v1/automations/__tests__/route.test.ts` — covers GET + POST (AUTO-01, AUTO-02)
- [ ] `app/api/v1/automations/[rule_id]/__tests__/route.test.ts` — covers GET + PATCH + DELETE (AUTO-03, AUTO-04, AUTO-05)
- [ ] `app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts` — covers GET executions (AUTO-06)

Test pattern: Mock `automationsProxy` module, verify route calls correct proxy function and returns expected response. Matches pattern in `__tests__/lib/thermorossiProxy.test.ts`.

---

## Security Domain

`security_enforcement` not explicitly set to false in config.json → included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` — Auth0 session on all mutation routes |
| V3 Session Management | no | Auth0 manages sessions; no custom session logic in this phase |
| V4 Access Control | no | Single-user app; no per-resource ownership check needed |
| V5 Input Validation | yes | Zod schema on FormModal; route-layer body is proxied as-is to HA |
| V6 Cryptography | no | No secrets or cryptographic operations in this phase |

### Known Threat Patterns for Proxy CRUD Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated CRUD via API routes | Elevation of Privilege | `withAuthAndErrorHandler` on all routes — identical to existing patterns |
| Path traversal via rule_id param | Tampering | rule_id used only in URL construction — string interpolation into HA URL, no local FS access. Same pattern as device_id in registry routes. |
| Large body injection on POST/PATCH | Tampering | Next.js default body size limit (4MB) applies. HA backend validates rule schema. |
| XSS via rule name/description in DataTable | Tampering | React JSX escaping prevents XSS in DataTable cell renders |

---

## Sources

### Primary (HIGH confidence)
- `lib/registry/registryProxy.ts` — canonical proxy client pattern, verified in session
- `lib/haClient.ts` — transport functions haGet/haPost/haPut/haDelete, verified in session
- `app/rooms/page.tsx` — CRUD page with FormModal/ConfirmationDialog pattern, verified in session
- `app/registry/devices/page.tsx` — paginated CRUD with PaginatedResponse, verified in session
- `lib/devices/deviceTypes.ts` GLOBAL_SECTIONS — nav entry pattern, verified in session
- `app/components/Navbar.tsx` — isGlobalActive, getIconForPath, verified in session
- `lib/core/index.ts`, `middleware.ts`, `apiResponse.ts` — route middleware and helpers, verified in session
- `types/common.ts` — PaginatedResponse<T>, verified in session
- `158-UI-SPEC.md` — UI contract, component inventory, copywriting, verified in session

### Secondary (MEDIUM confidence)
- `app/api/registry/types/route.ts` and `[slug]/route.ts` — route structure, verified in session
- `app/api/registry/devices/[device_id]/route.ts` — dynamic param pattern, verified in session
- `app/api/auth/api-keys/[keyId]/route.ts` — PATCH route handler in existing codebase, verified in session

### Tertiary (LOW confidence)
- AutomationRule type field names — inferred from UI-SPEC columns, not confirmed against live HA backend response

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in codebase
- Architecture: HIGH — all patterns cloned from verified existing files
- Pitfalls: HIGH — verified from reading actual implementation files
- Types: LOW — HA backend schema unknown; conservative design mitigates risk

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable patterns; HA backend API may change)
