---
phase: 164-phase-156-regression-fix
reviewed: 2026-04-15T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - lib/routes.ts
  - lib/commands/deviceCommands.tsx
  - app/sw.ts
  - app/debug/components/tabs/StoveTab.tsx
  - app/debug/api/components/tabs/StoveTab.tsx
  - types/api/responses.ts
  - lib/hooks/useRetryableCommand.ts
  - lib/retry/idempotencyManager.ts
  - __tests__/components/devices/stove/hooks/useStoveData.test.ts
  - __tests__/components/devices/stove/hooks/useStoveCommands.test.ts
  - lib/retry/__tests__/idempotencyManager.test.ts
  - lib/hooks/__tests__/useRetryableCommand.test.ts
findings:
  critical: 1
  warning: 8
  info: 9
  total: 18
status: issues_found
---

# Phase 164: Code Review Report

**Reviewed:** 2026-04-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 164 addresses the Phase 156 path-migration regression by restoring stove route consts, updating service-worker/debug/command-palette URLs to the v1 Thermorossi proxy, and re-wiring tests to the 202-Accepted single-status contract. The scope is narrowly surgical; most changes are URL literals.

The biggest concern is a **service-worker duplicate `push` listener** that silently overrides the real notification rendering — new pushes will no longer show a notification, only increment the badge. This is a production-facing regression that predates this phase but lives in a file this phase touches. Several `warning`-level issues relate to broken `useEffect` dependency patterns in the two StoveTab debug components (inline closures listed as deps cause infinite re-renders), plus uncaught fetch rejections in the command palette that can crash the page on network errors. The remaining items are documentation/quality polish.

Tests for `useRetryableCommand`, `idempotencyManager`, `useStoveData`, and `useStoveCommands` look sound and cover the core contract changes.

## Critical Issues

### CR-01: Second `push` listener silently disables notification rendering

**File:** `app/sw.ts:646-650`
**Issue:** A second `self.addEventListener('push', ...)` handler is registered after the first one (lines 110-145). Service Worker `push` listeners are additive, not replacing — *both* will fire. The second handler only calls `incrementBadge()` and never calls `showNotification`, so it does nothing to break the first. However, the comment on line 646 — `const originalPushHandler = self.addEventListener;` — captures `self.addEventListener` (unused) and the accompanying `// Update push handler to also increment badge` claims replacement semantics, which is incorrect.

Worse, the second handler's listener callback is declared `async` *and* calls `event.waitUntil(incrementBadge())`. Because the outer function is `async`, by the time `waitUntil` is called the event may have been dispatched already — some browsers throw `InvalidStateError` when `waitUntil` is invoked after the microtask queue drains. This can leave the badge unupdated on some pushes.

Additionally, the `originalPushHandler` binding is dead code (assigned, never used) and misleads readers into thinking the handler has been saved/overridden.

**Fix:**
```ts
// Remove the second listener entirely; move incrementBadge into the first handler:
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const notificationTitle = payload.notification?.title || 'Pannello Stufa';
  const notificationOptions = { /* ...unchanged... */ } as NotificationOptions & {
    vibrate?: number[];
    actions?: Array<{ action: string; title: string; icon?: string }>;
  };

  event.waitUntil(Promise.all([
    self.registration.showNotification(notificationTitle, notificationOptions),
    incrementBadge(),
  ]));
});

// Delete lines 646-650 entirely.
```

Also remove the `originalPushHandler` dead assignment. The same refactor applies to the duplicate `message` listener (lines 656-691 and 771-835) — see WR-02.

## Warnings

### WR-01: `useEffect` dependencies include non-memoised inline functions → infinite re-render risk

**File:** `app/debug/components/tabs/StoveTab.tsx:87-104`
**File:** `app/debug/api/components/tabs/StoveTab.tsx:87-104`
**Issue:** `fetchAllGetEndpoints` is declared inside the component body (re-created every render) and then listed as a dependency of three `useEffect`s. Each time it changes identity the effect re-runs, triggering `setState` in the fetch callbacks, which triggers another render, creating a new `fetchAllGetEndpoints`, re-running the effect… This is a classic infinite loop. React only avoids a hard crash because `setState` with the same value is a no-op and the internal fetches resolve asynchronously, but every render will re-fire five fetches (health, status, power, fan, history) and break the auto-refresh interval by tearing it down/recreating it every render.

The same issue exists in the companion file `app/debug/api/components/tabs/StoveTab.tsx` (identical code).

**Fix:**
```ts
// Wrap in useCallback so identity is stable across renders:
const fetchAllGetEndpoints = useCallback(() => {
  fetchGetEndpoint('health', '/api/v1/thermorossi/health');
  fetchGetEndpoint('status', '/api/v1/thermorossi/status');
  fetchGetEndpoint('power', '/api/v1/thermorossi/power');
  fetchGetEndpoint('fan', '/api/v1/thermorossi/fan-level');
  fetchGetEndpoint('history', '/api/v1/thermorossi/history');
}, []); // fetchGetEndpoint is also stable if wrapped; otherwise see note below

// Or, preferred: move fetchAllGetEndpoints out of the component,
// or drop it from the dep array and silence exhaustive-deps with a justified
// eslint-disable-next-line comment for mount-only behaviour.
```

Also consider that `fetchGetEndpoint` itself is recreated each render; if wrapping in `useCallback`, its deps must include the state setters (which React guarantees are stable).

### WR-02: Duplicate `message` listener silently drops unhandled cases

**File:** `app/sw.ts:656-691` and `app/sw.ts:771-835`
**Issue:** Two `message` event listeners are registered. Both destructure `{ type, data }` and run a `switch`. The second handler's `default:` branch is empty with a trailing comment "// Keep other cases handled by the original handler" — this *works* because listeners are additive, but it is fragile and non-obvious. A reader who edits one switch may assume it is the only message handler. Moreover the first handler's `default:` is also empty (no log), and its `GET_CACHED_STATE` case opens an IndexedDB transaction and calls `request.onsuccess`/`onerror` without ever `await`ing the outer `event.waitUntil` — the SW can be terminated before the response is posted on message ports.

**Fix:**
- Merge both listeners into one switch.
- Wrap IndexedDB work in `event.waitUntil(...)` so the SW is kept alive until the port message has been posted.
- Add a `console.warn` on the default branch during development to catch typos.

```ts
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  event.waitUntil((async () => {
    switch (type) {
      case 'CLEAR_BADGE': /* ... */ break;
      case 'GET_CACHED_STATE': /* ... */ break;
      case 'PROCESS_QUEUE': /* ... */ break;
      case 'REGISTER_PERIODIC_SYNC': /* ... */ break;
      case 'UNREGISTER_PERIODIC_SYNC': /* ... */ break;
      case 'GET_PERIODIC_SYNC_STATUS': /* ... */ break;
      default:
        // no-op
    }
  })());
});
```

### WR-03: `executeStoveAction` can return `undefined` on network error, breaking callers that read `.power_level`

**File:** `lib/commands/deviceCommands.tsx:44-63`, callers at lines 130-191
**Issue:** The catch block in `executeStoveAction`/`executeThermostatAction`/`executeLightsAction` swallows the error and returns `undefined` implicitly. Callers in `stove-power-up` (line 130) and similar do `const statusData = await statusRes.json();` on a `fetch('/api/v1/thermorossi/power')` *response* — but this is a direct `fetch`, not `executeStoveAction`, so if the fetch throws (network down) the entire `onSelect` rejects uncaught, bubbling to the command-palette and crashing the UI (cmdk does not handle rejected `onSelect`).

Additionally, `executeStoveAction`'s return type is declared `Promise<unknown>`, but the catch branch returns nothing, so the function effectively returns `Promise<unknown | undefined>`. Callers never inspect the return anyway, so this is mostly a type-clarity issue, but the direct `fetch(...)` calls on lines 130, 147, 164, 181 have no error handling.

**Fix:**
```ts
onSelect: async () => {
  try {
    const statusRes = await fetch('/api/v1/thermorossi/power');
    if (!statusRes.ok) return;
    const statusData = await statusRes.json();
    const currentPower = statusData?.power_level ?? 3;
    if (currentPower < 5) {
      await executeStoveAction(
        '/api/v1/thermorossi/settings/power',
        'POST',
        { value: currentPower + 1 }
      );
    }
  } catch (err) {
    console.error('[CommandPalette] power-up failed:', err);
  }
},
```

### WR-04: `executeNotificationAction` offline branch doesn't post completion message back to the client

**File:** `app/sw.ts:150-188`
**Issue:** When online fetch throws (line 179), the handler falls through to `queueActionForSync`. But when `navigator.onLine` is `false` at the top (line 184), the function queues the command and shows a "queued" notification — however, the `executeNotificationAction` promise that `notificationclick` handed to `event.waitUntil` resolves before the IndexedDB add transaction has necessarily completed. Because `queueActionForSync` does `await new Promise(...)` on `transaction.oncomplete`, this particular path is OK, but the flow relies on undocumented invariants. Add a JSDoc note or make it explicit.

More concretely: `queueActionForSync` calls `store.add(command);` and then awaits the transaction. But `store.add` returns an `IDBRequest`; its `onerror` is not wired up. If `add` fails (e.g., quota exceeded), `transaction.onerror` will fire and reject — good. But if only the `add` fails silently while the transaction completes (possible under some edge conditions), the "queued" notification will be shown to the user while nothing was stored.

**Fix:**
```ts
await new Promise<void>((resolve, reject) => {
  const addReq = store.add(command);
  addReq.onerror = () => reject(addReq.error);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error);
});
```

### WR-05: `openAppUrl` iterates clients but returns on first origin match, potentially focusing a background tab

**File:** `app/sw.ts:254-275`
**Issue:** `matchAll` returns clients in no guaranteed order. If the user has two app tabs, this focuses the first one the browser returns — which may be the *hidden* tab, not the one the user was last looking at. Prefer choosing a `visibilityState === 'visible'` client if any exist, else fall back to the first client.

**Fix:**
```ts
const visible = clientList.find(
  (c) => c.url.includes(self.location.origin) && (c as WindowClient).visibilityState === 'visible'
);
const target = visible ?? clientList.find((c) => c.url.includes(self.location.origin));
if (target) {
  await (target as WindowClient).focus();
  if ('navigate' in target) await (target as WindowClient).navigate(url);
  return;
}
```

### WR-06: `connectionStatus` typed as `any` — undermines the Badge variant check

**File:** `app/debug/components/tabs/StoveTab.tsx:20`
**File:** `app/debug/api/components/tabs/StoveTab.tsx:20`
**Issue:** `useState<any>(null)` defeats TypeScript. The subsequent check `connectionStatus === 'connected'` would be flagged by the compiler as always-false if the state were typed, since line 44 stores either `'connected'` or `'disconnected'` strings. Type it as `'connected' | 'disconnected' | null`.

**Fix:**
```ts
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | null>(null);
```

Do the same for `getResponses`/`postResponses`/`timings` — widen to an interface if possible, but at minimum `Record<string, unknown>` is safer than `any`.

### WR-07: `ApiSuccessResponse<T>` generic parameter `T` is unused

**File:** `types/api/responses.ts:7-13`
**Issue:** The interface declares `<T = Record<string, unknown>>` but never references `T`. The body uses `[key: string]: unknown`, so callers pass a type arg that does nothing. `ApiResponse<T>` and `StoveStatusResponse extends ApiSuccessResponse` both pay the cognitive cost of a phantom generic. Either drop the type param or actually enforce the shape via intersection:

**Fix:**
```ts
export type ApiSuccessResponse<T extends Record<string, unknown> = Record<string, unknown>> =
  { success: true; message?: string } & T;

export type ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;
```

With this change, `StoveStatusResponse extends ApiSuccessResponse` remains backward compatible and `StoveStatusResponse = ApiSuccessResponse<{status: StoveStatus; ...}>` becomes legitimate.

### WR-08: Retry hook closes over stale `retry` in toast `onClick`

**File:** `lib/hooks/useRetryableCommand.ts:160-167, 175-182`
**Issue:** The toast action's `onClick: () => { retry(); }` closes over the `retry` binding from the current render. Because `retry` is re-created every render (it's a normal arrow function, not `useCallback`-wrapped), this is not a stale-closure hazard *per se* — but `retry` itself reads from `lastCommandRef.current`, which is a ref, so it works. However, the toast is persistent and may outlive several re-renders; a later render could have a different `showError` closure in-flight. Low-severity, but for clarity wrap `execute` and `retry` in `useCallback` so their identities stabilise and the toast action is guaranteed to call the same function instance as was installed.

**Fix:**
```ts
const execute = useCallback(async (url, fetchOptions) => { /* ... */ }, [device, action, showSuccessOnRecovery, success, showError]);
const retry   = useCallback(async () => { /* ... */ }, [execute]);
```

Also note `dedupKey` is computed from `device`/`action` — if these change between renders the in-flight dedup clear in the `finally` block may clear a *different* key than the one checked at the top. Capturing `createRequestKey(device, action)` into a local and using it in `finally` (which is already done — line 189 uses the same `dedupKey`) is correct; this is a stylistic note only.

## Info

### IN-01: Unused `STOVE_UI_ROUTES`, `THERMOSTAT_UI_ROUTES`, `CAMERA_UI_ROUTES`, `GLOBAL_UI_ROUTES`, `SCHEDULER_ROUTES`, `USER_ROUTES`, `AUTH_ROUTES`, `API_ROUTES`

**File:** `lib/routes.ts:14-116`
**Issue:** All seven of these route collections are declared `const` (non-exported) and are not referenced inside the file. If nothing imports them (likely given they aren't exported), they're dead code. Only `STOVE_ROUTES`, `NETATMO_ROUTES`, `CAMERA_ROUTES`, `LOG_ROUTES` are exported and usable. Either export what's needed or remove the dead declarations.

**Fix:** Run `knip` or `grep` for each name; delete unreferenced ones. If they were intentionally kept as documentation, add a `// Kept for documentation` comment so future cleanups don't nuke them.

### IN-02: `STOVE_ROUTES.getFan` and `STOVE_ROUTES.setFan` share the same path root but diverge via path

**File:** `lib/routes.ts:50-53`
**Issue:** `getFan: /api/v1/thermorossi/fan-level` vs `setFan: /api/v1/thermorossi/settings/fan-level`. This is fine, but `getPower`/`setPower` follow the same pattern. Consider naming `readFan`/`writeFan` to avoid the verb collision with HTTP methods ("get" has a loaded meaning here).

**Fix:** Rename for clarity — purely cosmetic.

### IN-03: `any` type leakage in Service Worker

**File:** `app/sw.ts:371, 388, 427, 573, 704`
**Issue:** Several functions accept `any`: `getPendingCommands(): Promise<any[]>`, `executeCommand(command: any)`, `cacheDeviceState(deviceId: string, state: any)`, `periodicsync` event handler `event: any`. Project CLAUDE.md convention is "zero `as any` in production code" (MEMORY.md, phases 114-116).

**Fix:** Define `interface QueuedCommand { id: number; endpoint: string; method?: string; data?: Record<string, unknown>; retries?: number; status: string; lastError?: string | null; timestamp: string }` and use `SyncEvent`/`PeriodicSyncEvent` types (the latter may need a custom declaration since it's not in lib.dom).

### IN-04: `app/sw.ts` ends with trailing empty section header

**File:** `app/sw.ts:837-841`
**Issue:** `// Service Worker Lifecycle` section has no body. Remove the header or add the intended code.

### IN-05: `console.log` left commented out implicitly (empty handler)

**File:** `app/sw.ts:317-318, 488, 656-657, 704-705`
**Issue:** Several event handlers' first lines are blank — clearly the originals had `console.log` that was removed, but the empty structure is confusing. `self.addEventListener('notificationclose', (event) => { });` is a no-op handler that costs a function call per notification close. Delete it entirely.

**Fix:** Remove no-op `notificationclose` listener. For `sync`/`periodicsync`/`message` handlers, remove leading blank lines.

### IN-06: Test file uses `as any` liberally for mock injection

**File:** `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts:32, 97, 104, 116`
**Issue:** `} as any;` for router, `(logService.logStoveAction as any) = { ... }`. Test files are exempt from the `zero as any` rule, but the assignment pattern `(module.export as any) = { ... }` is a smell — it re-assigns an imported binding, which ES modules disallow at the spec level (works in Jest because of CommonJS transpile). A cleaner pattern is `jest.mock('@/lib/logService', () => ({ logStoveAction: { ignite: jest.fn(), ... } }))` at the top of the file.

**Fix:** Convert to factory-based `jest.mock`. Low priority — current tests pass.

### IN-07: `useStoveData.test.ts` has duplicated response setup boilerplate

**File:** `__tests__/components/devices/stove/hooks/useStoveData.test.ts:103-114` and many other blocks
**Issue:** Every test builds an identical `global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ stove_state: ..., power_level: ..., ... }) });` block. Factor into a helper `mockFetchResponse(overrides)`.

**Fix:**
```ts
function mockFetchResponse(overrides: Partial<StoveStatusShape> = {}) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      stove_state: 'off', power_level: null, fan_level: null,
      data_freshness: 'LIVE', last_poll_at: '2026-03-19T12:00:00Z',
      error_code: null, error_description: null,
      ...overrides,
    }),
  });
}
```

### IN-08: `IdempotencyManager.createHash` is not a cryptographic hash

**File:** `lib/retry/idempotencyManager.ts:107-110`
**Issue:** Method is named `createHash` but only does `${endpoint}:${JSON.stringify(body)}` with character sanitisation. Rename to `createCacheKey` or `createBodyFingerprint` to avoid misleading readers into thinking the output has collision resistance.

**Fix:**
```ts
private createCacheKey(endpoint: string, body: Record<string, unknown>): string {
  const raw = `${endpoint}:${JSON.stringify(body)}`;
  return raw.replace(/[.$/[\]]/g, '_');
}
```

Rename usages on lines 47 and 68.

### IN-09: `JSON.stringify(body)` is order-dependent — two semantically equal bodies produce different keys

**File:** `lib/retry/idempotencyManager.ts:107-110`
**Issue:** `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` hash to different strings. For idempotency this mostly doesn't matter (same caller code path → same key order), but if the manager ever caches across call sites that build bodies differently, duplicate-action prevention breaks. Consider `JSON.stringify(body, Object.keys(body).sort())` for stability.

**Fix:** If determinism matters across callers:
```ts
private createCacheKey(endpoint: string, body: Record<string, unknown>): string {
  const stable = JSON.stringify(body, Object.keys(body).sort());
  const raw = `${endpoint}:${stable}`;
  return raw.replace(/[.$/[\]]/g, '_');
}
```

Note: this is shallow — nested object key order is still unstable. For this codebase's 1-2-level bodies (`{ value: 4, source: 'manual' }`), shallow sort is sufficient.

---

_Reviewed: 2026-04-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
