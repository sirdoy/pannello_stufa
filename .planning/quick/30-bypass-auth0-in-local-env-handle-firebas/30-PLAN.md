---
phase: quick-30
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/auth0.ts
  - lib/core/middleware.ts
  - app/page.tsx
  - app/components/ClientProviders.tsx
  - lib/core/__tests__/middleware.test.ts
autonomous: true
requirements: [QUICK-30]

must_haves:
  truths:
    - "App loads at localhost:3000 without Auth0 credentials when BYPASS_AUTH=true"
    - "API routes return data (not 401) when BYPASS_AUTH=true"
    - "Firebase paths use a consistent mock userId 'local-dev-user' when auth is bypassed"
    - "Production behavior is completely unchanged (BYPASS_AUTH is unset or false)"
  artifacts:
    - path: "lib/auth0.ts"
      provides: "Auth0 client with dev bypass via mock session"
      contains: "BYPASS_AUTH"
    - path: "lib/core/middleware.ts"
      provides: "withAuth middleware that provides mock session in dev bypass mode"
      contains: "BYPASS_AUTH"
    - path: "app/page.tsx"
      provides: "Home page that works without real Auth0 session"
    - path: "app/components/ClientProviders.tsx"
      provides: "Provider tree that provides mock user context when auth bypassed"
      contains: "BYPASS_AUTH"
  key_links:
    - from: "lib/auth0.ts"
      to: "lib/core/middleware.ts"
      via: "auth0.getSession import"
      pattern: "auth0\\.getSession"
    - from: "lib/core/middleware.ts"
      to: "app/api/**"
      via: "withAuthAndErrorHandler wrapping all protected routes"
      pattern: "withAuthAndErrorHandler"
    - from: "app/page.tsx"
      to: "lib/auth0.ts"
      via: "direct auth0.getSession() call for server page auth"
      pattern: "auth0\\.getSession"
---

<objective>
Bypass Auth0 authentication in local development environment so the app works without Auth0 credentials, while Firebase data is saved/read using a consistent mock user ID.

Purpose: Enable local development without requiring Auth0 account/credentials. When `BYPASS_AUTH=true` is set in `.env.local`, all auth checks return a mock session with a fixed user ID, so Firebase paths remain consistent.

Output: Modified auth0.ts, middleware.ts, page.tsx, and ClientProviders.tsx that detect `BYPASS_AUTH=true` and skip real Auth0 calls.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/auth0.ts
@lib/core/middleware.ts
@app/page.tsx
@app/components/ClientProviders.tsx
@lib/core/__tests__/middleware.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add BYPASS_AUTH mock session to auth0.ts and middleware.ts</name>
  <files>lib/auth0.ts, lib/core/middleware.ts</files>
  <action>
**In `lib/auth0.ts`:**

1. Add constants at the top:
```ts
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const DEV_USER_ID = 'local-dev-user';

const MOCK_SESSION = {
  user: {
    sub: DEV_USER_ID,
    email: 'dev@localhost',
    name: 'Local Dev User',
    nickname: 'dev',
    picture: '',
  },
  accessToken: 'mock-access-token',
  tokenType: 'Bearer',
};
```

2. Conditionally create the Auth0Client - when BYPASS_AUTH is true, create a stub that returns MOCK_SESSION from `getSession()` instead of calling real Auth0:
```ts
export const auth0 = BYPASS_AUTH
  ? ({ getSession: async () => MOCK_SESSION } as unknown as Auth0Client)
  : new Auth0Client(auth0Config);
```

This ensures `auth0.getSession()` in server pages (page.tsx etc.) returns the mock session without any changes to those pages.

3. Keep the existing `auth0Config` object and discovery configuration - they're only used when BYPASS_AUTH is false. Guard the config construction so it doesn't throw when env vars are missing:
```ts
const auth0Config = BYPASS_AUTH ? {} : {
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  // ... rest of existing config
};
```

4. Keep the existing `withAuth` function export (from lib/auth0.ts) as-is - it's not used by many routes (most use the middleware version).

**In `lib/core/middleware.ts`:**

1. Add bypass check to `withAuth` function:
```ts
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const DEV_SESSION: Session = {
  user: { sub: 'local-dev-user', email: 'dev@localhost' },
};

function withAuth(handler: AuthedHandler): UnauthHandler {
  return async (request: NextRequest, context: RouteContext) => {
    if (BYPASS_AUTH) {
      return handler(request, context, DEV_SESSION);
    }
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return unauthorized();
    }
    return handler(request, context, session);
  };
}
```

This ensures ALL 90+ API routes using `withAuthAndErrorHandler` automatically get the mock session without changing any individual route file.
  </action>
  <verify>
Run: `npx tsc --noEmit --pretty 2>&1 | head -20` to verify no type errors.
Run: `npm test -- --testPathPattern='middleware.test' --silent 2>&1 | tail -10` to verify existing tests pass.
  </verify>
  <done>
`lib/auth0.ts` exports a stub Auth0Client returning mock session when BYPASS_AUTH=true.
`lib/core/middleware.ts` withAuth provides mock session to all protected API routes when BYPASS_AUTH=true.
No type errors. Existing middleware tests pass.
  </done>
</task>

<task type="auto">
  <name>Task 2: Handle client-side auth bypass in ClientProviders</name>
  <files>app/page.tsx, app/components/ClientProviders.tsx</files>
  <action>
**In `app/page.tsx`:**

No changes needed. The page calls `auth0.getSession()` which now returns MOCK_SESSION when BYPASS_AUTH=true (from Task 1's stub). The existing redirect logic only triggers when session is null, so it will proceed normally with the mock session. Verify this is the case by reading the file - do NOT modify it unless the stub approach doesn't cover it.

**In `app/components/ClientProviders.tsx`:**

The problem: 18+ client components call `useUser()` from `@auth0/nextjs-auth0/client`. When Auth0Provider wraps them, `useUser()` tries to fetch the user profile from Auth0. Without valid Auth0 credentials, it returns `{ user: undefined }`. Components handle this with optional chaining (`user?.sub`), but Firebase operations will use `undefined` as userId.

Solution: Replace Auth0Provider with a mock UserContext provider when bypassing auth, so `useUser()` returns a mock user with `sub: 'local-dev-user'`.

1. Add at the top:
```tsx
import { UserContext } from '@auth0/nextjs-auth0/client';

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
```

Note: Uses `NEXT_PUBLIC_` prefix because this is a client component. User must add `NEXT_PUBLIC_BYPASS_AUTH=true` alongside `BYPASS_AUTH=true` in `.env.local`.

2. Check if `UserContext` is exported from `@auth0/nextjs-auth0/client`. If not, try `UserProvider` with a `user` prop. Inspect the package:
```bash
grep -r "export.*UserContext\|export.*UserProvider" node_modules/@auth0/nextjs-auth0/dist/client/ --include="*.d.ts" | head -5
```

3. If `UserContext` is available, create mock context value:
```tsx
const MOCK_AUTH_CONTEXT = {
  user: {
    sub: 'local-dev-user',
    email: 'dev@localhost',
    name: 'Local Dev User',
    nickname: 'dev',
    picture: '',
  },
  isLoading: false,
  error: undefined,
  checkSession: async () => {},
};
```

4. Update the return to conditionally wrap:
```tsx
export default function ClientProviders({ children }: ClientProvidersProps) {
  const inner = (
    <>
      <ThemeScript />
      <ThemeProvider>
        <PageTransitionProvider>
          <VersionProvider>
            <ToastProvider>
              <CommandPaletteProvider>
                <AxeDevtools />
                <PWAInitializer />
                <OfflineBanner fixed showPendingCount />
                <ConsentBanner />
                {children}
                <InstallPrompt />
              </CommandPaletteProvider>
            </ToastProvider>
          </VersionProvider>
        </PageTransitionProvider>
      </ThemeProvider>
    </>
  );

  if (BYPASS_AUTH) {
    return (
      <UserContext.Provider value={MOCK_AUTH_CONTEXT as any}>
        {inner}
      </UserContext.Provider>
    );
  }

  return <Auth0Provider>{inner}</Auth0Provider>;
}
```

5. If `UserContext` is NOT exported, use alternative: wrap with `UserProvider` component (which IS exported in v4) and pass the mock user as initial state, OR simply skip Auth0Provider entirely and let `useUser()` calls gracefully handle `undefined` (since all components use optional chaining `user?.sub`). In that case, Firebase will get `undefined` userId on client side - but all critical operations go through API routes which have server-side bypass already.

Preferred fallback if UserContext unavailable:
```tsx
if (BYPASS_AUTH) {
  return <>{inner}</>;
}
```
Then add a try-catch wrapper around each `useUser()` call... NO, that changes 18 files. Instead, create a small shim:
```tsx
// In app/hooks/useAuthUser.ts
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
const MOCK = { sub: 'local-dev-user', email: 'dev@localhost', name: 'Dev' };
export function useUser() {
  if (BYPASS) return { user: MOCK, isLoading: false, error: undefined };
  return useAuth0User();
}
```
Then find-and-replace imports across all 18 files. This is clean but touches many files.

**Priority order:**
1. Try UserContext.Provider (zero file changes beyond ClientProviders)
2. If not available, try UserProvider with user prop
3. Last resort: useAuthUser shim + mass import replacement
  </action>
  <verify>
1. Add `BYPASS_AUTH=true` and `NEXT_PUBLIC_BYPASS_AUTH=true` to `.env.local`
2. Run `npm run dev`, visit `http://localhost:3000` - page loads, no auth redirect
3. Check browser console - no Auth0 errors, no useUser crashes
4. Verify `useUser()` returns mock user in client components (check ThemeContext behavior)
5. Remove bypass vars from `.env.local` after testing
  </verify>
  <done>
`app/page.tsx` works without changes (auth0 stub handles server-side).
`app/components/ClientProviders.tsx` provides mock user context when NEXT_PUBLIC_BYPASS_AUTH=true.
All 18 client components using `useUser()` receive mock user with `sub: 'local-dev-user'`.
No changes to individual client component files.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add middleware bypass tests</name>
  <files>lib/core/__tests__/middleware.test.ts</files>
  <action>
Add a test that confirms production behavior (no BYPASS_AUTH) correctly returns 401 for unauthenticated requests. This validates the bypass doesn't leak into production.

Import `withAuthAndErrorHandler` (already available from the existing import of `'../middleware'`).

Add a new describe block:
```ts
describe('withAuthAndErrorHandler production auth', () => {
  it('returns 401 when no session exists and BYPASS_AUTH is not set', async () => {
    // process.env.BYPASS_AUTH is undefined in test env (production behavior)
    const mockAuth0 = jest.mocked((await import('@/lib/auth0')).auth0);
    mockAuth0.getSession.mockResolvedValue(null);

    const handler = jest.fn();
    const wrapped = withAuthAndErrorHandler(handler);

    const request = createMockRequest() as any;
    const context = createMockContext();

    const response = await wrapped(request, context);

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes session to handler when authenticated', async () => {
    const mockAuth0 = jest.mocked((await import('@/lib/auth0')).auth0);
    const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
    mockAuth0.getSession.mockResolvedValue(mockSession as any);

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );
    const wrapped = withAuthAndErrorHandler(handler);

    const request = createMockRequest() as any;
    const context = createMockContext();

    await wrapped(request, context);

    expect(handler).toHaveBeenCalledWith(request, context, mockSession);
  });
});
```

Add the import for `withAuthAndErrorHandler` at the top alongside the existing `withIdempotency` import.

Ensure all existing tests still pass.
  </action>
  <verify>
Run: `npm test -- --testPathPattern='middleware.test' --silent 2>&1 | tail -15`
All tests pass (existing + new).
  </verify>
  <done>
Middleware tests verify that:
- Production mode (no BYPASS_AUTH) returns 401 for unauthenticated requests
- Authenticated sessions are correctly passed to handlers
All tests pass.
  </done>
</task>

</tasks>

<verification>
1. With `BYPASS_AUTH=true` and `NEXT_PUBLIC_BYPASS_AUTH=true` in `.env.local`: `npm run dev` starts, homepage loads, API routes return data
2. Without those env vars: existing auth flow works exactly as before
3. `npm test -- --testPathPattern='middleware.test'` passes
4. `npx tsc --noEmit` has no new errors
</verification>

<success_criteria>
- App loads at localhost:3000 without real Auth0 session when BYPASS_AUTH=true
- All 90+ API routes using withAuthAndErrorHandler work without auth when BYPASS_AUTH=true
- Firebase data paths use consistent 'local-dev-user' user ID on both server and client
- Zero changes to individual API route files or client component files (max: ClientProviders.tsx only)
- Production behavior completely unchanged when BYPASS_AUTH is unset
</success_criteria>

<output>
After completion, create `.planning/quick/30-bypass-auth0-in-local-env-handle-firebas/30-SUMMARY.md`
</output>
