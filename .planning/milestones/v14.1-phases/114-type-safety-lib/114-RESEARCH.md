# Phase 114: Type Safety lib/ - Research

**Researched:** 2026-03-22
**Domain:** TypeScript type safety — generics, module augmentation, type guards, interface design
**Confidence:** HIGH

## Summary

Phase 114 eliminates all `as any` casts in lib/ production code. The six requirements map to five distinct files, each with a different `as any` pattern and a different fix strategy. The changes are mechanical: understand the runtime shape, declare the TypeScript type that describes it, and replace the cast. No logic changes, no new dependencies, no new files except possibly a single inline interface.

The most important finding is that `NetatmoProxyRoom` in `types/netatmoProxy.ts` does NOT match the room data shape returned by the homestatus API — it describes homesdata rooms (with `id`/`name`/`type`/`module_ids`), not the live rooms that `useRoomStatus` fetches (which have `room_id`, `room_name`, `temperature`, `setpoint`, `mode`, `heating`, `endtime`). An inline `RoomListItem` interface is required for TYPE-04.

The `NotificationPreferences` type mismatch (TYPE-06, D-04) is the most structurally complex fix: two different interfaces with the same name exist — one in `types/firebase/notifications.ts` (structured `types` object) and one in `lib/notifications/notificationFilter.ts` (flexible `enabledTypes` Record). These cannot be unified without touching the filter logic; the correct fix is to import and use the filter's interface at the call site.

**Primary recommendation:** Five targeted file edits, each independent. Plan as separate tasks per file to enable parallelism.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add generic overload `adminDbGet<T>(path: string): Promise<T | null>` — no wrapper functions, just a generic parameter
- **D-02:** `analyticsAggregationService.ts:141` → `adminDbGet<{ temperature?: number }>(...)` — inline interface
- **D-03:** `unifiedDeviceConfigService.ts:128` → `adminDbGet<DeviceConfigData>(...)` — remove redundant `as DeviceConfigData` cast on line 132
- **D-04:** `firebaseAdmin.ts:693` — import the filter's `NotificationPreferences` type and map Firebase data to it
- **D-05:** `firebaseAdmin.ts:494-495` — `(error as any).code/.message` → type guard: `if (error instanceof Error && 'code' in error)`
- **D-06:** `firebaseAdmin.ts:742` — same pattern: `(error as any).code` → type guard with `'code' in error`
- **D-07:** Declare `NetworkInformation` interface inline in `useNetworkQuality.ts` with `effectiveType`, `addEventListener`, `removeEventListener`
- **D-08:** Extend Navigator locally: `declare global { interface Navigator { connection?: NetworkInformation } }`
- **D-09:** Declare module augmentation for `Notification` in `notificationActions.ts`: `declare global { interface NotificationConstructor { maxActions?: number } }`
- **D-10:** Type API response `const response: { rooms: RoomListItem[] }` and map with typed properties — eliminates `as any[]` and `(room: any)`
- **D-11:** Create inline `RoomListItem` interface with 7 fields (room_id, room_name, temperature, setpoint, mode, heating, endtime)
- **D-12:** Change `getDeviceMetadata()` return type to a proper `DeviceMetadata` interface: `{ name: string; icon: string; color?: string; ... }`
- **D-13:** This eliminates all 5 `(meta as any)?.name/.icon/.color` casts (lines 297-298, 330-332)
- **D-14:** Remove `(d: any)` casts on sort/map callbacks (lines 291-293, 324-326) — `config.devices` is already `DeviceConfigItem[]`

### Claude's Discretion
- Whether to put `NetworkInformation` interface in a `.d.ts` file or inline in the hook (inline recommended for single-use)
- Whether `DeviceMetadata` interface goes in `unifiedDeviceConfigService.ts` or in `types/` (local preferred since it's internal)
- Exact field list for `DeviceMetadata` — derived from what `DEVICE_CONFIG` / `DISPLAY_ITEMS` objects actually contain
- Whether to use `unknown` + type narrowing vs generic overload for `adminDbGet` (generic recommended for ergonomics)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-01 | `adminDbGet()` calls return typed values instead of `as any` casts | Generic overload pattern; two call sites in lib/ need updating (analyticsAggregationService, unifiedDeviceConfigService) |
| TYPE-02 | `navigator.connection` typed with Network Information API interface | `declare global` module augmentation + inline `NetworkInformation` interface; existing test file must stay green |
| TYPE-03 | `Notification.maxActions` typed with proper type guard | `declare global { interface NotificationConstructor { maxActions?: number } }` — augments the constructor type, not the instance type |
| TYPE-04 | `useRoomStatus` room data typed instead of `as any[]` | `NetatmoProxyRoom` is NOT usable here (wrong shape); requires inline `RoomListItem` with 7 fields matching actual API response |
| TYPE-05 | `unifiedDeviceConfigService` meta access typed instead of `as any` | `DeviceConfig`/`DisplayItem` both have `name`/`icon`/`color` — `DeviceMetadata` interface captures common shape; also removes unnecessary `(d: any)` cast on sort/map |
| TYPE-06 | `firebaseAdmin.ts` error/preferences casts typed properly | Two error casts → `'code' in error` type guard; one preferences cast → import filter's `NotificationPreferences` and map fields |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (project) | Type system | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | No new dependencies required | All fixes are TypeScript-only |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Pattern 1: Generic function overload for `adminDbGet`

**What:** Make `adminDbGet` accept a type parameter so callers get typed results without casting.

**When to use:** When a function returns `unknown` but callers know the shape at the call site.

**Example:**
```typescript
// lib/firebaseAdmin.ts
export async function adminDbGet<T = unknown>(path: string): Promise<T | null> {
  const db = getAdminDatabase();
  const snapshot = await db.ref(path).once('value');
  return snapshot.val() as T | null;
}

// Call site — typed, no cast needed:
const weatherCache = await adminDbGet<{ temperature?: number }>(
  getEnvironmentPath('weather/cache')
);
// weatherCache is { temperature?: number } | null — TypeScript infers it

// Existing callers with no generic argument continue to work (T defaults to unknown)
```

**Backward compatibility:** Default `T = unknown` means all existing callers that don't provide a type parameter continue to compile without modification.

**Key insight:** The single `as T | null` cast lives inside the function, not scattered across call sites.

### Pattern 2: `declare global` module augmentation for non-standard browser APIs

**What:** Extend built-in browser interfaces locally in the file that uses them, without modifying global `.d.ts` files.

**When to use:** When a browser API exists at runtime but TypeScript's lib.dom.d.ts doesn't include it (Network Information API is not in standard lib.dom).

**Example:**
```typescript
// lib/hooks/useNetworkQuality.ts — add BEFORE the hook

interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  addEventListener(type: 'change', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'change', listener: EventListenerOrEventListenerObject): void;
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
  }
}

// Now: navigator.connection — typed, no cast
const connection = navigator.connection;  // NetworkInformation | undefined
```

**Note:** This is a file-local augmentation — it only affects this file's compilation scope. No global `.d.ts` file is needed or modified.

### Pattern 3: `declare global` for Notification constructor property

**What:** `Notification.maxActions` is a static property on the constructor, not an instance property. TypeScript's `NotificationConstructor` interface (the type of `typeof Notification`) needs augmentation.

**When to use:** When a static/class property exists on a DOM interface constructor but is not in TypeScript's lib.

**Example:**
```typescript
// lib/notifications/notificationActions.ts — add at top of file

declare global {
  interface NotificationConstructor {
    readonly maxActions?: number;
  }
}

// Now: Notification.maxActions — typed, no cast
const maxActions = Notification.maxActions;  // number | undefined
```

**Pitfall:** `interface Notification` extends the instance type. `interface NotificationConstructor` extends the constructor/static type. Use `NotificationConstructor` for `Notification.maxActions`.

### Pattern 4: Type guard for error `.code` property

**What:** Firebase Admin SDK errors have a `code` property, but `error: unknown` doesn't expose it. Use a type narrowing guard instead of casting.

**When to use:** When accessing non-standard properties on caught errors.

**Example:**
```typescript
// Pattern to replace (error as any).code
function getErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && 'code' in error) {
    return (error as Error & { code: string }).code;
  }
  return undefined;
}

// Or inline at call site:
const errorCode = error instanceof Error && 'code' in error
  ? (error as Error & { code: string }).code
  : undefined;
const errorMessage = error instanceof Error ? error.message : String(error);
```

**Note:** `firebase-admin` errors extend `Error` with a `.code` property. The type guard `'code' in error` + intersection type `Error & { code: string }` is the correct narrow.

### Pattern 5: Inline interface for API response shapes

**What:** Define the expected API response shape as an inline interface at the point of use.

**When to use:** When a response shape is used only in one place and matches neither an existing type nor warrants a new shared type.

**Example:**
```typescript
// lib/hooks/useRoomStatus.ts

interface RoomListItem {
  room_id: string;
  room_name: string;
  temperature: number | null;
  setpoint: number | null;
  mode: string | null;
  heating: boolean;
  endtime: number | null;
}

// Then at the fetch site:
const data = await response.json() as { rooms: RoomListItem[] };
const roomList = (data.rooms || []).map((room: RoomListItem) => ({
  id: room.room_id,
  name: room.room_name,
  temperature: room.temperature,
  // ...
}));
```

**Why `NetatmoProxyRoom` is wrong here:** `NetatmoProxyRoom` (from `types/netatmoProxy.ts`) has `id`, `name`, `type`, `module_ids` — it describes the homesdata topology response. The homestatus live-room response has `room_id`, `room_name`, `temperature`, `setpoint`, `mode`, `heating`, `endtime` — a completely different shape. Do not import `NetatmoProxyRoom` for TYPE-04.

### Pattern 6: Typed return for internal helper

**What:** Change `getDeviceMetadata()` return type from `Record<string, unknown> | null` to a proper `DeviceMetadata` interface.

**When to use:** When an internal function's callers all access the same known properties and the current return type forces casts.

**Example:**
```typescript
// lib/services/unifiedDeviceConfigService.ts

interface DeviceMetadata {
  id: string;
  name: string;
  icon: string;
  color: DeviceColor;
  enabled?: boolean;
  routes?: Record<string, string>;
  features?: DeviceFeatures;
  type?: string;
}

function getDeviceMetadata(deviceId: DeviceId): DeviceMetadata | null {
  const deviceConfig = DEVICE_CONFIG[deviceId as DeviceTypeId];
  const displayItem = DISPLAY_ITEMS[deviceId];
  return (deviceConfig as DeviceMetadata) || (displayItem as DeviceMetadata) || null;
}

// Callers: meta.name, meta.icon, meta.color — all typed, no cast
```

**About `(d: any)` on sort/map:** `config.devices` is typed as `DeviceConfigItem[]`. The `any` annotations on the callbacks are unnecessary — remove them and TypeScript will infer `d: DeviceConfigItem`.

### Anti-Patterns to Avoid

- **Importing `NetatmoProxyRoom` for the room status hook:** The field names differ (`id` vs `room_id`, `name` vs `room_name`) — using this type would require additional casts or renaming.
- **Global `.d.ts` files for single-file augmentations:** If only one file needs `navigator.connection`, the augmentation belongs in that file. Adding it globally pollutes the entire project's type space.
- **`(error as Error & { code: string })` without the `instanceof` guard:** TypeScript will accept the assertion but it's unsafe if `error` is not an Error instance. Always guard with `error instanceof Error && 'code' in error` first.
- **Keeping `as any` on the `adminDbGet` return and moving it to `as T`:** The implementation must use `as T | null` internally, but call sites should use the generic type parameter — not cast the return value.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Network Information API types | Custom polyfill or runtime shim | TypeScript `declare global` augmentation | Compile-time only — no runtime needed |
| Firebase error shape | Custom error class or wrapper | `'code' in error` type guard + intersection | firebase-admin errors already have `.code`; no need to wrap them |
| Room data validation | Zod/runtime schema | Inline TypeScript interface | This is a compile-time typing phase, not a validation phase |

**Key insight:** All fixes in this phase are compile-time only. No runtime behavior changes. No new libraries. TypeScript's type system has all the tools needed.

---

## Common Pitfalls

### Pitfall 1: `NotificationConstructor` vs `Notification`
**What goes wrong:** Declaring `interface Notification { maxActions?: number }` augments the instance type, not the constructor. `Notification.maxActions` (static access) remains untyped.
**Why it happens:** TypeScript has separate types for a class constructor (`typeof Notification` / `NotificationConstructor`) and its instances (`Notification`).
**How to avoid:** Use `interface NotificationConstructor { maxActions?: number }` — this extends the constructor type.
**Warning signs:** TypeScript still errors after adding the augmentation — check which interface you augmented.

### Pitfall 2: `adminDbGet` generic default breaks existing callers
**What goes wrong:** Changing the signature to `adminDbGet<T>(...)` without a default makes all existing callers that don't provide `T` fail to compile (T is required).
**Why it happens:** Generic type parameters are required unless they have a default.
**How to avoid:** Use `adminDbGet<T = unknown>(path: string): Promise<T | null>` — `unknown` default preserves existing behavior.
**Warning signs:** Widespread tsc errors in files not being edited in this phase.

### Pitfall 3: `NetatmoProxyRoom` field name mismatch for TYPE-04
**What goes wrong:** Using `NetatmoProxyRoom` for the room status response causes TypeScript errors because the API returns `room_id`/`room_name` but the type has `id`/`name`.
**Why it happens:** `NetatmoProxyRoom` was written for the homesdata topology endpoint, not the homestatus live-data endpoint.
**How to avoid:** Use the inline `RoomListItem` interface (D-11) with the actual field names from the API response.
**Warning signs:** TypeScript errors accessing `room.room_id` on a `NetatmoProxyRoom` — it has `room.id` instead.

### Pitfall 4: `NotificationPreferences` import creates circular or shadowed type
**What goes wrong:** `firebaseAdmin.ts` already has `preferences` typed as the Firebase `NotificationPreferences`. Importing the filter's `NotificationPreferences` creates a name collision.
**Why it happens:** Two interfaces share a name, one in `types/firebase/notifications.ts` and one in `lib/notifications/notificationFilter.ts`.
**How to avoid:** Import the filter's type under an alias: `import type { NotificationPreferences as FilterNotificationPreferences } from '@/lib/notifications/notificationFilter'`. Then map/cast at the call site.
**Warning signs:** TypeScript error "Duplicate identifier 'NotificationPreferences'" or the wrong type being inferred.

### Pitfall 5: Test file uses `(navigator as any).connection` — the test must stay passing
**What goes wrong:** After adding the `Navigator` augmentation, the test file `useNetworkQuality.test.ts` uses `delete (navigator as any).connection` and `Object.defineProperty(navigator, 'connection', ...)`. These uses of `as any` are in test files (explicitly out of scope) but could break if the type change causes a jest-environment conflict.
**Why it happens:** The test uses `as any` to bypass TypeScript when manipulating `navigator` — this is a legitimate test mock pattern.
**How to avoid:** The test file's `as any` casts are in test code (out of scope) and will continue to work. The `declare global` augmentation in the source file is compile-time only and does not affect JSDOM behavior.
**Warning signs:** The test file fails to compile after the augmentation — check if the `delete` or `defineProperty` calls are now incompatible with the narrower type.

---

## Code Examples

### Generic `adminDbGet` — full implementation
```typescript
// Source: TypeScript Handbook — Generic Functions
export async function adminDbGet<T = unknown>(path: string): Promise<T | null> {
  const db = getAdminDatabase();
  const snapshot = await db.ref(path).once('value');
  return snapshot.val() as T | null;
}

// analyticsAggregationService.ts:141 — call site
const weatherCache = await adminDbGet<{ temperature?: number }>(
  getEnvironmentPath('weather/cache')
);

// unifiedDeviceConfigService.ts:128 — call site
const existingConfig = await adminDbGet<DeviceConfigData>(
  `users/${userId}/deviceConfig`
);
// Remove: const config = existingConfig as DeviceConfigData; — line 132
// Use:    const config = existingConfig;  — already typed
```

### Firebase error type guard
```typescript
// Source: TypeScript Handbook — Narrowing, "in" operator
// Replaces: (error as any).code and (error as any).message

const errorCode =
  error instanceof Error && 'code' in error
    ? (error as Error & { code: string }).code
    : undefined;
const errorMessage =
  error instanceof Error ? error.message : String(error);
```

### `NetworkInformation` augmentation (inline in `useNetworkQuality.ts`)
```typescript
// Source: MDN — Network Information API
// https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation

interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  addEventListener(type: 'change', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'change', listener: EventListenerOrEventListenerObject): void;
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
  }
}
```

### `NotificationConstructor` augmentation (inline in `notificationActions.ts`)
```typescript
// Source: TypeScript — Declaration Merging
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html

declare global {
  interface NotificationConstructor {
    readonly maxActions?: number;
  }
}

// Usage (replaces (Notification as any).maxActions):
const maxActions = Notification.maxActions;  // number | undefined
```

### `RoomListItem` inline interface
```typescript
// lib/hooks/useRoomStatus.ts
interface RoomListItem {
  room_id: string;
  room_name: string;
  temperature: number | null;
  setpoint: number | null;
  mode: string | null;
  heating: boolean;
  endtime: number | null;
}

// Typed fetch result:
const data = await response.json() as { rooms: RoomListItem[] };
const roomList = (data.rooms || []).map((room: RoomListItem) => ({
  id: room.room_id,
  name: room.room_name,
  temperature: room.temperature,
  setpoint: room.setpoint,
  mode: room.mode,
  heating: room.heating,
  endtime: room.endtime,
}));
```

### `DeviceMetadata` interface and updated `getDeviceMetadata`
```typescript
// lib/services/unifiedDeviceConfigService.ts
// DeviceConfig and DisplayItem both have name/icon/color — pick the common fields

interface DeviceMetadata {
  id: string;
  name: string;
  icon: string;
  color: DeviceColor;
}

function getDeviceMetadata(deviceId: DeviceId): DeviceMetadata | null {
  const deviceConfig = DEVICE_CONFIG[deviceId as DeviceTypeId];
  const displayItem = DISPLAY_ITEMS[deviceId];
  return deviceConfig || displayItem || null;
}
// DeviceConfig and DisplayItem both satisfy DeviceMetadata structurally (no cast needed)
// All (meta as any)?.name / .icon / .color casts can become meta.name / meta.icon / meta.color
```

**Note on structural compatibility:** `DeviceConfig` has `name`, `icon`, `color` (required) — compatible. `DisplayItem` has `name`, `icon`, `color` (required) — compatible. Both also have `id`. No explicit cast needed when returning them.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `(navigator as any).connection` | `declare global { interface Navigator { connection?: NetworkInformation } }` | TypeScript 2.x+ | Compile-time safety, no runtime change |
| `adminDbGet() as any` at call site | `adminDbGet<T>()` generic parameter | TypeScript 2.x+ | Type inference at call site without redundant cast |
| `(error as any).code` | `'code' in error` type guard + intersection | TypeScript 4.4+ | Properly narrows unknown to Error & { code } |

---

## Open Questions

1. **`NotificationPreferences` mapping shape**
   - What we know: Firebase shape has `types.alert/system/maintenance/scheduler/coordination` booleans; filter shape has `enabledTypes: Record<string, boolean>`
   - What's unclear: Does the mapping need to be bidirectional, or only Firebase→filter?
   - Recommendation: Unidirectional only (Firebase→filter at the call site). Map `{ enabledTypes: { alert: p.types.alert, ... } }` where `p` is the Firebase `NotificationPreferences`. No changes to `notificationFilter.ts`.

2. **`DeviceMetadata` exact field list for `getDeviceMetadata`**
   - What we know: `DEVICE_CONFIG` entries have `id`, `name`, `icon`, `color`, `enabled`, `routes`, `features`. `DISPLAY_ITEMS` entries have `id`, `name`, `icon`, `color`, `type`.
   - What's unclear: Do callers of `getDeviceMetadata` ever access `enabled`, `routes`, or `features` through the returned value?
   - Recommendation: Check lines 297-298 and 330-332. Only `name`, `icon`, and `color` are accessed via `meta` in the current cast sites. Declare `DeviceMetadata` with those 3 fields plus `id`. If `enabled`/`routes`/`features` are accessed elsewhere through `meta`, add them.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (next/jest transformer) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="useNetworkQuality\|useRoomStatus\|unifiedDeviceConfig\|notificationActions" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-01 | `adminDbGet<T>` compiles without error at typed call sites | unit (tsc) | `npx tsc --noEmit` | N/A — compile check |
| TYPE-02 | `navigator.connection` access compiles; hook behavior unchanged | unit | `npm test -- --testPathPattern="useNetworkQuality"` | ✅ |
| TYPE-03 | `Notification.maxActions` access compiles | unit (tsc) | `npx tsc --noEmit` | ❌ Wave 0 |
| TYPE-04 | `useRoomStatus` returns correct room shape | unit | `npm test -- --testPathPattern="useRoomStatus"` | ✅ |
| TYPE-05 | `getDeviceMetadata` callers compile cleanly | unit (tsc) | `npx tsc --noEmit` | ❌ Wave 0 |
| TYPE-06 | Firebase error guard compiles; preferences map compiles | unit (tsc) | `npx tsc --noEmit` | N/A — compile check |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (TYPE-01, TYPE-03, TYPE-05, TYPE-06 validated by compile)
- **Per wave merge:** `npm test -- --testPathPattern="useNetworkQuality\|useRoomStatus"` + `npx tsc --noEmit`
- **Phase gate:** `npm test` (full suite green) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/notifications/__tests__/notificationActions.test.ts` — covers TYPE-03 (`supportsNotificationActions()` and `getNotificationCapabilities()` compile and return expected values)
- [ ] `lib/services/__tests__/unifiedDeviceConfigService.test.ts` — covers TYPE-05 (`getVisibleDashboardCards` and `getAllDevicesForSettings` return typed metadata)

*(These tests verify behavior, not just compilation — useful for regression protection after the type changes.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `lib/firebaseAdmin.ts`, `lib/hooks/useNetworkQuality.ts`, `lib/notifications/notificationActions.ts`, `lib/hooks/useRoomStatus.ts`, `lib/services/unifiedDeviceConfigService.ts`
- Direct type inspection: `types/netatmoProxy.ts:NetatmoProxyRoom`, `types/firebase/notifications.ts:NotificationPreferences`, `lib/notifications/notificationFilter.ts:NotificationPreferences`
- Direct registry inspection: `lib/devices/deviceTypes.ts:DeviceConfig`, `DeviceTypeId`, `DEVICE_CONFIG`, `DISPLAY_ITEMS`
- TypeScript Handbook — Generic Functions, Declaration Merging, Narrowing

### Secondary (MEDIUM confidence)
- MDN Web API — Network Information API (`NetworkInformation.effectiveType`) — field names verified against actual code usage
- MDN — Notification API — `NotificationConstructor` is the correct interface name for static `Notification` properties

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, pure TypeScript
- Architecture: HIGH — patterns verified by direct code inspection of all 5 target files
- Pitfalls: HIGH — `NetatmoProxyRoom` mismatch and `NotificationConstructor` vs `Notification` verified by reading the actual types

**Research date:** 2026-03-22
**Valid until:** 2026-09-22 (stable TypeScript patterns, no external API dependency)
