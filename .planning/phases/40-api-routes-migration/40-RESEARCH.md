# Phase 40: API Routes Migration - Research

**Researched:** 2026-02-07
**Domain:** Next.js 16 API Route Handlers with TypeScript
**Confidence:** HIGH

## Summary

Research for migrating 90 JavaScript API route files in `app/api/` to TypeScript with typed request/response. The codebase uses a sophisticated middleware pattern (`lib/core`) that wraps Next.js route handlers with authentication, error handling, and response formatting. All routes follow consistent patterns: middleware wrapper → handler logic → typed response. The core library is already TypeScript, providing strong foundation for migration.

**Key Findings:**
- Next.js 16 uses native Web API `Request`/`Response`, extended with `NextRequest`/`NextResponse`
- Dynamic route params are now `Promise<Record<string, string>>` (breaking change in v15+)
- Project has well-typed core library (`lib/core/`) with middleware, response helpers, and request parsers
- Routes are simple: most are 10-50 lines, calling services and returning responses
- Three test files exist but are deferred to Phase 42

**Primary recommendation:** Use existing `lib/core` types as foundation, add minimal route-specific types inline, preserve exact middleware patterns (no refactoring).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Response Typing Depth:**
- Claude's discretion on typing strictness per endpoint — full interfaces for complex endpoints, pragmatic Record<string, unknown> for simple ones
- Claude decides whether to create shared type files per domain or keep types inline, based on type reuse potential
- For external API responses (Thermorossi, Netatmo, Hue), Claude decides per endpoint whether to type external shape or just our wrapper
- Route handler signatures: Claude picks appropriate level (NextRequest with typed params vs basic Request) based on whether route uses params/searchParams

**Test File Handling:**
- **Test files deferred to Phase 42** — 3 test files in app/api/ (`hue/discover`, `netatmo/setroomthermpoint`, `netatmo/setthermmode`) stay as .js
- Test import path updates: Claude decides based on whether auto-resolution works

**Error Response Consistency:**
- Claude decides whether to standardize error response shape or type as-is, based on current consistency
- Catch block typing: Claude picks best pattern (instanceof guard vs pragmatic unknown) based on existing code style
- HTTP status codes: Claude decides literal numbers vs named constants based on usage patterns
- Success response shapes: Claude decides per route whether light normalization is worth the effort — this is migration, not refactor

**Wave Grouping Strategy:**
- Claude decides grouping approach (by domain, complexity, or hybrid) for optimal parallel execution
- Claude sizes plans based on route complexity and domain boundaries
- **Gap closure plan reserved** — plan for at least one gap closure wave after migration, based on Phase 38/39 experience
- Execution: mode=yolo, parallelization=true, balanced profile (sonnet executor/verifier) — same proven approach as Phase 39

### Claude's Discretion
- Typing depth per endpoint (full interfaces vs pragmatic)
- Type file organization (shared vs inline)
- External API response typing level
- Error handling patterns
- Response shape normalization decisions
- Plan sizing and grouping

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

---

## Standard Stack

The established libraries and patterns for Next.js 16 API routes with TypeScript:

### Core
| Library/Pattern | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| Next.js | 16.1.0 | App Router with route handlers | Project requirement, modern Next.js |
| TypeScript | 5.x | Type safety | Migration target |
| `lib/core` | Internal | Middleware, responses, parsing | Project's established pattern |
| NextRequest/NextResponse | Built-in | Request/response types | Next.js native Web API extensions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `types/api` | Internal | API response types | Already exists, reuse for response typing |
| `@auth0/nextjs-auth0` | 4.13.1 | Authentication | Used by withAuth middleware |
| firebase-admin | 13.6.0 | Backend data access | Used by most routes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline types | Shared type files | Inline faster for simple routes, shared better for reuse (Claude decides per route) |
| Full external API typing | Pragmatic `unknown` | Full typing catches more errors but takes longer (Claude decides based on complexity) |
| `NextRequest` everywhere | Basic `Request` | NextRequest adds type safety for cookies/searchParams but not always needed |

**Installation:**
```bash
# No new dependencies needed - TypeScript and Next.js already installed
# Core library already migrated to TypeScript in Phase 37-39
```

---

## Architecture Patterns

### Recommended File Structure
```
app/api/
├── stove/
│   ├── status/
│   │   └── route.ts          # Migrated from route.js
│   ├── ignite/
│   │   └── route.ts
│   └── [dynamic]/
│       └── route.ts          # Dynamic routes with typed params
├── netatmo/
│   ├── callback/route.ts     # OAuth callback (no auth)
│   └── homestatus/route.ts   # Complex data transformation
├── hue/
│   ├── lights/
│   │   ├── route.ts
│   │   └── [id]/route.ts    # Dynamic parameter
│   └── discover/
│       └── route.test.js    # DEFERRED - stays .js
```

### Pattern 1: Simple GET Route (Most Common)
**What:** Route that fetches data via service, returns success
**When to use:** 70% of routes follow this pattern
**Example:**
```typescript
// Source: app/api/stove/status/route.ts (migrated)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStoveStatus } from '@/lib/stoveApi';

/**
 * GET /api/stove/status
 * Returns the current operational status of the stove
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStoveStatus();
  return success(data);
}, 'Stove/Status');
```

**Key points:**
- No explicit return type needed (NextResponse inferred)
- Middleware handles auth + error wrapping
- Service functions remain untyped in this phase (lib migration separate)
- `success(data)` accepts `Record<string, unknown>` for flexibility

### Pattern 2: POST with Body Parsing
**What:** Route that accepts JSON body, validates, processes
**When to use:** Create/update operations
**Example:**
```typescript
// Source: Composite pattern from notifications/send and schedules/[id]
import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';

interface SendNotificationBody {
  userId: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    priority?: 'high' | 'normal';
    data?: Record<string, unknown>;
  };
}

export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const body = await parseJsonOrThrow<SendNotificationBody>(request);

  // Validation
  validateRequired(body.userId, 'userId');
  validateRequired(body.notification?.title, 'notification.title');

  // Process...
  const result = await sendNotificationToUser(body.userId, body.notification);

  return success({
    message: 'Notifica inviata',
    sentTo: result.successCount,
  });
}, 'Notifications/Send');
```

**Key points:**
- Type body interface for validation autocomplete
- `parseJsonOrThrow<T>` provides type-safe parsing
- Validation helpers throw ApiError (caught by middleware)
- Body types inline for simple routes, shared file for complex

### Pattern 3: Dynamic Route with Params
**What:** Route using path parameters like `/api/items/[id]`
**When to use:** CRUD operations on specific resources
**Example:**
```typescript
// Source: app/api/schedules/[id]/route.ts (migrated)
import {
  withAuthAndErrorHandler,
  success,
  notFound,
  getPathParam,
} from '@/lib/core';

// Context type for dynamic params (Next.js 15+ pattern)
interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAuthAndErrorHandler(async (request, context: RouteContext) => {
  const id = await getPathParam(context, 'id');

  const schedule = await adminDbGet(`schedules-v2/schedules/${id}`);

  if (!schedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  return success({ id, ...schedule });
}, 'Schedules/Get');

export const DELETE = withAuthAndErrorHandler(async (request, context: RouteContext) => {
  const id = await getPathParam(context, 'id');

  // Validation logic...
  await adminDbSet(`schedules-v2/schedules/${id}`, null);

  return success({ message: `Schedule deleted` });
}, 'Schedules/Delete');
```

**Key points:**
- **CRITICAL:** `params` is now `Promise<Record<string, string>>` (Next.js 15+)
- Type `RouteContext` inline for each route file
- `getPathParam()` already handles await and validation
- Multiple HTTP methods in same file share context type

### Pattern 4: OAuth Callback (No Auth)
**What:** Public route for OAuth flow, uses `withErrorHandler` only
**When to use:** OAuth callbacks, webhooks, public endpoints
**Example:**
```typescript
// Source: app/api/netatmo/callback/route.ts (migrated)
import { withErrorHandler, redirect } from '@/lib/core';
import { saveRefreshToken } from '@/lib/netatmoTokenHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/callback
 * OAuth callback handler for Netatmo authorization
 * Note: No auth middleware - validates OAuth tokens directly
 */
export const GET = withErrorHandler(async (request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('OAuth callback: missing authorization code');
    return redirect(`${origin}/netatmo?error=missing_code`);
  }

  // Exchange code for token...
  const res = await fetch('https://api.netatmo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      redirect_uri: credentials.redirectUri,
    }),
  });

  const json = await res.json() as {
    error?: string;
    error_description?: string;
    refresh_token?: string;
  };

  if (json.error) {
    return redirect(`${origin}/netatmo?error=${encodeURIComponent(json.error_description || json.error)}`);
  }

  await saveRefreshToken(json.refresh_token!);
  return redirect(`${origin}/netatmo/authorized`);
}, 'Netatmo/Callback');
```

**Key points:**
- Use `withErrorHandler` for unprotected routes
- `request.url` for full URL access
- External API responses typed pragmatically (`as { ... }`)
- `redirect()` returns `Response` (not NextResponse)

### Pattern 5: Complex Route with Multiple Operations
**What:** Cron job or batch operation route
**When to use:** Scheduler checks, batch processing, multi-step workflows
**Example:**
```typescript
// Source: app/api/scheduler/check/route.ts (migrated - simplified)
import { withCronSecret, success } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getStoveStatus, igniteStove, shutdownStove } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

// Helper functions (same file, not exported)
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchStoveData() {
  let currentStatus = 'unknown';
  let isOn = false;

  try {
    const statusData = await getStoveStatus();
    if (statusData) {
      currentStatus = statusData.StatusDescription || 'unknown';
      isOn = currentStatus.includes('WORK') || currentStatus.includes('START');
    }
  } catch (error) {
    console.error('Status fetch failed:', error);
  }

  return { currentStatus, isOn };
}

/**
 * GET /api/scheduler/check
 * Cron handler for scheduler automation
 * Protected: Requires CRON_SECRET
 */
export const GET = withCronSecret(async (_request) => {
  // Save health timestamp
  await adminDbSet('cronHealth/lastCall', new Date().toISOString());

  // Check scheduler mode
  const modeData = (await adminDbGet('schedules-v2/mode')) as {
    enabled?: boolean;
    semiManual?: boolean;
  } | null;

  if (!modeData?.enabled) {
    return success({
      status: 'MODALITA_MANUALE',
      message: 'Scheduler disattivato',
    });
  }

  // Fetch stove state
  const { currentStatus, isOn } = await fetchStoveData();

  // Complex scheduling logic...
  // (omitted for brevity)

  return success({
    status: isOn ? 'ACCESA' : 'SPENTA',
    schedulerEnabled: true,
  });
}, 'Scheduler/Check');
```

**Key points:**
- Helper functions typed inline (not exported)
- Firebase data typed pragmatically: `as { fields } | null`
- Long routes stay in single file (no refactoring)
- Async operations typed by return inference

### Anti-Patterns to Avoid

**❌ Don't add explicit return types:**
```typescript
// BAD - unnecessary verbosity
export const GET = withAuthAndErrorHandler(async (): Promise<NextResponse> => {
  // ...
}, 'Route');
```
```typescript
// GOOD - inferred from middleware
export const GET = withAuthAndErrorHandler(async () => {
  // ...
}, 'Route');
```

**❌ Don't refactor existing logic:**
```typescript
// BAD - changing behavior during migration
export const GET = withAuthAndErrorHandler(async () => {
  // Standardizing error format (NOT ALLOWED - different phase)
  return success({ data: result, timestamp: Date.now() });
}, 'Route');
```
```typescript
// GOOD - preserve exact behavior
export const GET = withAuthAndErrorHandler(async () => {
  return success(result); // Exact same as JS version
}, 'Route');
```

**❌ Don't use .tsx extension:**
```typescript
// BAD - causes issues with tooling (Sentry won't instrument)
app/api/stove/status/route.tsx

// GOOD - API routes use .ts
app/api/stove/status/route.ts
```

---

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request parsing | Manual `JSON.parse` with try-catch | `parseJson()` / `parseJsonOrThrow()` | Handles edge cases: empty body, wrong content-type, malformed JSON |
| Auth checking | `if (!session) return ...` | `withAuth()` / `withAuthAndErrorHandler()` | Consistent 401 responses, session typing, error logging |
| Path params extraction | `context.params.id` | `getPathParam(context, 'id')` | Handles await (Next.js 15+), validation, proper error messages |
| Error responses | `NextResponse.json({ error: ... })` | `badRequest()` / `notFound()` / `serverError()` | Consistent error shape, codes, status codes across API |
| Input validation | Manual if-checks | `validateRequired()` / `validateRange()` / `validateEnum()` | Throws ApiError with proper codes, detail messages |
| Success responses | `NextResponse.json({ success: true, ...data })` | `success(data)` | Consistent shape, optional message param |

**Key insight:** Project's `lib/core` library eliminates 80% of boilerplate. Don't bypass it during migration — preserve exact wrapper usage.

**Additional Note:** Service function types (`lib/stoveApi`, `lib/firebaseAdmin`, etc.) are out of scope. They may be untyped JS or typed TS — migration only handles route files. Service returns typed as `any` or `unknown` are acceptable.

---

## Common Pitfalls

### Pitfall 1: Params Not Awaited
**What goes wrong:** TypeScript error `Property 'id' does not exist on type 'Promise<...>'`
**Why it happens:** Next.js 15+ changed `context.params` from object to Promise
**How to avoid:**
- Always await params: `const params = await context.params`
- Or use helper: `const id = await getPathParam(context, 'id')`
**Warning signs:**
- `context.params.id` directly accessed
- Type error on params property access

**Example:**
```typescript
// ❌ BAD - doesn't await Promise
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const id = context.params.id; // ERROR: Property 'id' does not exist on Promise
  // ...
});

// ✅ GOOD - awaits params
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');
  // ...
});
```

### Pitfall 2: Wrong File Extension
**What goes wrong:** Tools like Sentry don't auto-instrument API routes
**Why it happens:** Using `.tsx` instead of `.ts` for routes
**How to avoid:** Always use `.ts` for route handlers (no JSX needed)
**Warning signs:** Route file ends in `.tsx`

**Reference:** [GitHub Discussion #57252](https://github.com/vercel/next.js/discussions/57252)

### Pitfall 3: Over-Typing External APIs
**What goes wrong:** Maintenance burden, brittleness to API changes
**Why it happens:** Attempting to fully type Thermorossi/Netatmo/Hue responses
**How to avoid:**
- Type only fields you use: `as { StatusDescription?: string }`
- Use `unknown` for pass-through data
- Trust service layer to handle validation
**Warning signs:**
- Large interface for external API with 30+ fields
- Breaking when external API adds new fields

**Example:**
```typescript
// ❌ BAD - fully typing external API
interface ThermorossiResponse {
  Status: number;
  StatusDescription: string;
  Temperature: number;
  // ... 50+ more fields
}

// ✅ GOOD - type what you need
const statusData = await getStoveStatus();
const currentStatus = (statusData as { StatusDescription?: string })?.StatusDescription || 'unknown';
```

### Pitfall 4: Adding Features During Migration
**What goes wrong:** Scope creep, harder to verify correctness
**Why it happens:** Temptation to "improve" while touching files
**How to avoid:**
- Resist urge to normalize response shapes
- Don't add new validation
- Don't refactor logic
- Flag improvements for future phase
**Warning signs:**
- Git diff shows logic changes beyond typing
- Response shape differs from JS version

### Pitfall 5: Middleware Type Mismatches
**What goes wrong:** TypeScript error on handler signature
**Why it happens:** Handler signature doesn't match middleware expectation
**How to avoid:**
- `withAuthAndErrorHandler` requires: `(request, context, session) => Promise<NextResponse>`
- `withErrorHandler` requires: `(request, context) => Promise<NextResponse>`
- `withCronSecret` requires: `(request, context) => Promise<NextResponse>`
**Warning signs:**
- Type error: "Type 'X' is not assignable to parameter of type 'Y'"
- Adding `session` param to unprotected route

**Example:**
```typescript
// ❌ BAD - OAuth callback shouldn't have session
export const GET = withErrorHandler(async (request, context, session) => {
  // ERROR: withErrorHandler doesn't provide session
});

// ✅ GOOD - only request + context for unprotected
export const GET = withErrorHandler(async (request, context) => {
  // ...
});
```

### Pitfall 6: Implicit Any from Firebase
**What goes wrong:** `adminDbGet()` returns `any`, spreading unsafety
**Why it happens:** Firebase SDK doesn't know your data shape
**How to avoid:**
- Type assertion after fetch: `as { field: type } | null`
- Use optional chaining: `data?.field`
- Validate critical fields with `validateRequired()`
**Warning signs:**
- No type assertion after `adminDbGet()`
- Assuming nested properties exist

**Example:**
```typescript
// ❌ BAD - implicit any spreads
const schedule = await adminDbGet(`schedules/${id}`);
const name = schedule.name; // any

// ✅ GOOD - explicit type assertion
const schedule = await adminDbGet(`schedules/${id}`) as {
  name: string;
  enabled: boolean;
  slots?: Record<string, unknown>;
} | null;

if (!schedule) {
  return notFound('Schedule not found');
}

const name = schedule.name; // string
```

---

## Code Examples

Verified patterns from project codebase:

### Example 1: Simple GET with Service Call
```typescript
// Source: app/api/stove/status/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStoveStatus } from '@/lib/stoveApi';

/**
 * GET /api/stove/status
 * Returns the current operational status of the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStoveStatus();
  return success(data);
}, 'Stove/Status');
```

### Example 2: POST with Typed Body
```typescript
// Source: app/api/notifications/send/route.ts
import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  forbidden,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { sendNotificationToUser } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface NotificationBody {
  userId: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    priority?: 'high' | 'normal';
    data?: Record<string, unknown>;
  };
  adminSecret?: string;
}

/**
 * POST /api/notifications/send
 * Send push notification to a user
 * Protected: Requires Auth0 authentication + admin or self
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  const adminSecret = request.headers.get('x-admin-secret');
  const body = await parseJsonOrThrow<NotificationBody>(request);
  const bodySecret = body.adminSecret;

  const isAdmin = adminSecret === process.env.ADMIN_SECRET ||
                  bodySecret === process.env.ADMIN_SECRET;

  if (!isAdmin && user.sub !== body.userId) {
    return forbidden('Non autorizzato');
  }

  const { userId, notification } = body;

  // Validate required fields
  validateRequired(userId, 'userId');
  validateRequired(notification, 'notification');
  validateRequired(notification?.title, 'notification.title');
  validateRequired(notification?.body, 'notification.body');

  // Send notification
  const result = await sendNotificationToUser(userId, notification);

  if (result.success) {
    return success({
      message: 'Notifica inviata',
      sentTo: result.successCount,
      failed: result.failureCount,
    });
  } else {
    return badRequest(result.message || 'Impossibile inviare notifica');
  }
}, 'Notifications/Send');
```

### Example 3: Dynamic Route with Multiple Methods
```typescript
// Source: app/api/schedules/[id]/route.ts
import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  notFound,
  parseJson,
  getPathParam,
} from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ScheduleData {
  name: string;
  enabled: boolean;
  slots: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/schedules/[id]
 * Get specific schedule with full data
 */
export const GET = withAuthAndErrorHandler(async (request, context: RouteContext) => {
  const id = await getPathParam(context, 'id');

  const schedule = await adminDbGet(`schedules-v2/schedules/${id}`) as ScheduleData | null;

  if (!schedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  return success({ id, ...schedule });
}, 'Schedules/Get');

/**
 * PUT /api/schedules/[id]
 * Update schedule
 * Body: { name?, slots?, enabled? }
 */
export const PUT = withAuthAndErrorHandler(async (request, context: RouteContext) => {
  const id = await getPathParam(context, 'id');
  const updates = await parseJson<Partial<ScheduleData>>(request);

  // Check schedule exists
  const existingSchedule = await adminDbGet(`schedules-v2/schedules/${id}`) as ScheduleData | null;
  if (!existingSchedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  // Validation: if updating name, check uniqueness
  if (updates.name && updates.name !== existingSchedule.name) {
    const allSchedules = await adminDbGet('schedules-v2/schedules') as Record<string, ScheduleData> | null;
    if (allSchedules) {
      const otherNames = Object.entries(allSchedules)
        .filter(([otherId]) => otherId !== id)
        .map(([, data]) => data.name.toLowerCase());

      if (otherNames.includes(updates.name.toLowerCase())) {
        return badRequest('Schedule name already exists');
      }
    }
  }

  // Build updated schedule
  const updatedSchedule = {
    ...existingSchedule,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await adminDbSet(`schedules-v2/schedules/${id}`, updatedSchedule);

  console.log(`Schedule updated: ${id}`);

  return success({
    schedule: { id, ...updatedSchedule }
  });
}, 'Schedules/Update');

/**
 * DELETE /api/schedules/[id]
 * Delete schedule (with safety validations)
 */
export const DELETE = withAuthAndErrorHandler(async (request, context: RouteContext) => {
  const id = await getPathParam(context, 'id');

  // Validation 1: Cannot delete active schedule
  const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId') as string | null;
  if (activeScheduleId === id) {
    return badRequest('Cannot delete active schedule. Please activate another schedule first.');
  }

  // Validation 2: Cannot delete last schedule
  const allSchedules = await adminDbGet('schedules-v2/schedules') as Record<string, ScheduleData> | null;
  const scheduleCount = allSchedules ? Object.keys(allSchedules).length : 0;

  if (scheduleCount <= 1) {
    return badRequest('Cannot delete the last schedule. At least one schedule must exist.');
  }

  // Check schedule exists
  const schedule = await adminDbGet(`schedules-v2/schedules/${id}`) as ScheduleData | null;
  if (!schedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  // Delete schedule
  await adminDbSet(`schedules-v2/schedules/${id}`, null);

  console.log(`Schedule deleted: ${id} (${schedule.name})`);

  return success({
    message: `Schedule '${schedule.name}' deleted successfully`
  });
}, 'Schedules/Delete');
```

### Example 4: OAuth Callback (No Auth)
```typescript
// Source: app/api/netatmo/callback/route.ts
import { withErrorHandler, redirect } from '@/lib/core';
import { saveRefreshToken } from '@/lib/netatmoTokenHelper';
import { getNetatmoCredentials } from '@/lib/netatmoCredentials';

export const dynamic = 'force-dynamic';

interface NetatmoTokenResponse {
  error?: string;
  error_description?: string;
  refresh_token?: string;
}

/**
 * GET /api/netatmo/callback
 * OAuth callback handler for Netatmo authorization
 * Note: No auth middleware - this validates OAuth tokens directly
 */
export const GET = withErrorHandler(async (request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('OAuth callback: missing authorization code');
    return redirect(`${origin}/netatmo?error=missing_code`);
  }

  // Get environment-specific credentials
  const credentials = getNetatmoCredentials();

  // Exchange authorization code for tokens
  const res = await fetch('https://api.netatmo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      redirect_uri: credentials.redirectUri,
    }),
  });

  const json = await res.json() as NetatmoTokenResponse;

  // Handle Netatmo API errors
  if (json.error) {
    console.error('Netatmo OAuth error:', json);
    return redirect(
      `${origin}/netatmo?error=${encodeURIComponent(json.error_description || json.error)}`
    );
  }

  if (!json.refresh_token) {
    console.error('No refresh_token received:', json);
    return redirect(`${origin}/netatmo?error=no_token`);
  }

  // Save refresh token to Firebase using centralized helper
  await saveRefreshToken(json.refresh_token);

  // Redirect to success page
  return redirect(`${origin}/netatmo/authorized`);
}, 'Netatmo/Callback');
```

### Example 5: Route with Query Parameters
```typescript
// Source: app/api/scheduler/check/route.ts (simplified)
import { withCronSecret, success } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface SchedulerMode {
  enabled: boolean;
  semiManual: boolean;
  returnToAutoAt?: string;
}

/**
 * GET /api/scheduler/check?secret=xxx
 * Cron handler for scheduler automation
 * Protected: Requires CRON_SECRET via query param or header
 */
export const GET = withCronSecret(async (_request) => {
  // Save cron health timestamp
  const cronHealthTimestamp = new Date().toISOString();
  await adminDbSet('cronHealth/lastCall', cronHealthTimestamp);

  // Check if scheduler mode is enabled
  const modeData = await adminDbGet('schedules-v2/mode') as SchedulerMode | null;
  const schedulerEnabled = modeData?.enabled ?? false;

  if (!schedulerEnabled) {
    return success({
      status: 'MODALITA_MANUALE',
      message: 'Scheduler disattivato - modalità manuale attiva'
    });
  }

  // ... rest of scheduler logic

  return success({
    status: 'OK',
    schedulerEnabled: true,
  });
}, 'Scheduler/Check');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `context.params.id` | `await context.params` then access | Next.js 15 (Nov 2024) | Breaking change - must await params Promise |
| Pages Router API routes (`pages/api/`) | App Router route handlers (`app/api/route.ts`) | Next.js 13+ (Oct 2022) | Modern approach, better TypeScript support |
| NextApiRequest/NextApiResponse | Request/Response (Web API) | Next.js 13+ (Oct 2022) | Native Web APIs, smaller bundle |
| Manual try-catch in every route | Middleware wrappers | Project pattern | Cleaner, consistent error handling |
| `NextResponse.json()` everywhere | `success()` / `error()` helpers | Project pattern | Consistent response shape |

**Deprecated/outdated:**
- **Pages Router API Routes** (`pages/api/`) - Replaced by App Router route handlers in Next.js 13+
- **NextApiRequest/NextApiResponse types** - Replaced by native Web API Request/Response
- **Synchronous `context.params`** - Now returns Promise in Next.js 15+
- **`.tsx` extension for API routes** - Use `.ts` (no JSX in route handlers)

---

## Open Questions

Things that couldn't be fully resolved:

1. **Test File Import Paths**
   - What we know: 3 test files stay as `.js` (deferred to Phase 42)
   - What's unclear: Will test imports auto-resolve `.ts` routes, or need explicit `.ts` extension?
   - Recommendation: Try without extension first (Node ESM resolution), add `.ts` only if errors occur

2. **Service Function Return Types**
   - What we know: Service functions (`lib/stoveApi`, `lib/firebaseAdmin`, etc.) may be JS or TS
   - What's unclear: Should routes type-assert service returns, or leave as `any`/`unknown`?
   - Recommendation: Pragmatic approach - type-assert only critical fields used in route, let rest flow as `unknown`

3. **External API Response Evolution**
   - What we know: Thermorossi, Netatmo, Hue APIs change occasionally
   - What's unclear: How defensive to be with type assertions for external data?
   - Recommendation: Type only fields actively used, use optional chaining, avoid brittle full typing

---

## Sources

### Primary (HIGH confidence)
- Next.js Official Documentation:
  - [Route Handlers File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/route) - TypeScript patterns, context types
  - [Getting Started: Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - Best practices, caching
  - [Next.js 16 Release](https://nextjs.org/blog/next-16) - Latest features
- Project codebase:
  - `lib/core/` (TypeScript) - Middleware, response helpers, request parsers
  - `app/api/` (JavaScript) - 90 route files to migrate
  - `types/api/` (TypeScript) - Existing API response types

### Secondary (MEDIUM confidence)
- [Medium: Next.js Route Handlers in TypeScript Guide](https://medium.com/@1shyam2shyam/next-js-route-handlers-in-typescript-comprehensive-guide-ee3c9ea773b8) - Comprehensive typing patterns
- [Strapi: Next.js 16 Route Handlers Explained](https://strapi.io/blog/nextjs-16-route-handlers-explained-3-advanced-usecases) - Advanced use cases
- [MakerKit: Next.js API Best Practices](https://makerkit.dev/blog/tutorials/nextjs-api-best-practices) - Higher-order functions, patterns

### Tertiary (Error Handling - MEDIUM confidence)
- [Better Stack: Error Handling in Next.js](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/) - Error patterns
- [GeeksforGeeks: Error Handling with Try/Catch](https://www.geeksforgeeks.org/nextjs/error-handling-in-next-js-api-routes-with-try-catch/) - Try-catch patterns
- [GitHub Discussion #57252](https://github.com/vercel/next.js/discussions/57252) - Warning about .tsx extension for API routes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js 16 documented, `lib/core` already TypeScript
- Architecture: HIGH - Examined 5+ representative routes, patterns clear and consistent
- Pitfalls: HIGH - Official docs + project codebase reveal common mistakes

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - Next.js stable, patterns established)

**File inventory:**
- 90 JavaScript route files to migrate (excluding 3 test files)
- Breakdown: STOVE (14), NETATMO (16), HUE (18), NOTIFICATIONS (14), HEALTH/MONITORING (5), SCHEDULER/SCHEDULES (5), CONFIG/USER/MISC (18)
- Test files deferred: `hue/discover/route.test.js`, `netatmo/setroomthermpoint/route.test.js`, `netatmo/setthermmode/route.test.js`
