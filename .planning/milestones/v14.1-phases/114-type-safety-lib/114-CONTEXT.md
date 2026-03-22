# Phase 114: Type Safety lib/ - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate all `as any` casts in lib/ production code (non-test files). Each cast gets replaced with a proper typed interface, generic parameter, or type guard. Test files are explicitly out of scope (see REQUIREMENTS.md Out of Scope).

</domain>

<decisions>
## Implementation Decisions

### adminDbGet generic typing (TYPE-01, TYPE-06)
- **D-01:** Add a generic overload to `adminDbGet<T>(path: string): Promise<T | null>` so callers specify the expected return type at call sites — no wrapper functions, just a generic parameter
- **D-02:** `analyticsAggregationService.ts:141` changes to `adminDbGet<{ temperature?: number }>(...)` — inline interface, no separate type needed for a single-use shape
- **D-03:** `unifiedDeviceConfigService.ts:128` changes to `adminDbGet<DeviceConfigData>(...)` — then remove the redundant `as DeviceConfigData` cast on line 132
- **D-04:** `firebaseAdmin.ts:693` — the `preferences as any` cast for `filterNotificationByPreferences()` is caused by type mismatch between `types/firebase/notifications.ts:NotificationPreferences` (what Firebase stores) and `lib/notifications/notificationFilter.ts:NotificationPreferences` (what the filter expects). Fix by importing the filter's type and mapping the Firebase data to it, or by aligning the two interfaces.

### Firebase error typing (TYPE-06)
- **D-05:** `firebaseAdmin.ts:494-495` — replace `(error as any).code` / `.message` with a `FirebaseError` type guard: `if (error instanceof Error && 'code' in error)` pattern, since firebase-admin errors have a `code` property but aren't exported as a standalone type
- **D-06:** `firebaseAdmin.ts:742` — same pattern: `(error as any).code` → type guard with `'code' in error`

### Network Information API typing (TYPE-02)
- **D-07:** Declare a `NetworkInformation` interface in the same file (`useNetworkQuality.ts`) with `effectiveType`, `addEventListener`, `removeEventListener` — minimal shape matching what the hook actually uses
- **D-08:** Extend the Navigator interface locally: `declare global { interface Navigator { connection?: NetworkInformation } }` — eliminates both `(navigator as any).connection` casts (lines 24, 51)

### Notification.maxActions typing (TYPE-03)
- **D-09:** Declare a module augmentation for `Notification` in `notificationActions.ts`: `declare global { interface NotificationConstructor { maxActions?: number } }` — eliminates both `(Notification as any).maxActions` casts (lines 79, 99)

### useRoomStatus room data typing (TYPE-04)
- **D-10:** The Netatmo proxy returns `NetatmoProxyRoom[]` (from `types/netatmoProxy.ts`). Type the API response: `const response: { rooms: NetatmoProxyRoom[] }` and map with typed properties — eliminates `as any[]` and `(room: any)` on line 70
- **D-11:** If the response shape doesn't exactly match `NetatmoProxyRoom`, create a minimal `RoomListItem` interface inline matching the 7 fields actually used (room_id, room_name, temperature, setpoint, mode, heating, endtime)

### unifiedDeviceConfigService meta typing (TYPE-05)
- **D-12:** `getDeviceMetadata()` currently returns `Record<string, unknown> | null`. Change return type to a proper `DeviceMetadata` interface: `{ name: string; icon: string; color?: string; ... }` matching what `DEVICE_CONFIG` and `DISPLAY_ITEMS` actually contain
- **D-13:** This eliminates all 5 `(meta as any)?.name` / `.icon` / `.color` casts (lines 297-298, 330-332) since `meta.name` will be typed
- **D-14:** The `(d: any)` casts on sort/map callbacks (lines 291-293, 324-326) are unnecessary — `config.devices` is already `DeviceConfigItem[]`. Remove the `any` annotations.

### Claude's Discretion
- Whether to put `NetworkInformation` interface in a `.d.ts` file or inline in the hook (inline recommended for single-use)
- Whether `DeviceMetadata` interface goes in `unifiedDeviceConfigService.ts` or in `types/` (local preferred since it's internal)
- Exact field list for `DeviceMetadata` — derived from what `DEVICE_CONFIG` / `DISPLAY_ITEMS` objects actually contain
- Whether to use `unknown` + type narrowing vs generic overload for `adminDbGet` (generic recommended for ergonomics)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard type safety improvements following existing patterns. Each fix is mechanical: identify the actual runtime type, declare it, and replace the cast.

</specifics>

<canonical_refs>
## Canonical References

### adminDbGet and Firebase types
- `lib/firebaseAdmin.ts` line 92 — `adminDbGet` signature (`Promise<unknown>`) — the root cause of most casts
- `lib/firebaseAdmin.ts` lines 489-496 — Error handling with `(error as any).code`
- `lib/firebaseAdmin.ts` lines 688-695 — `preferences as any` for notification filter
- `types/firebase/notifications.ts` line 33 — `NotificationPreferences` (Firebase shape)
- `lib/notifications/notificationFilter.ts` line 35 — `NotificationPreferences` (filter shape, different interface)

### Network Information API
- `lib/hooks/useNetworkQuality.ts` lines 24, 51 — Both `(navigator as any).connection` casts
- MDN Web API reference: Network Information API `effectiveType` property

### Notification API
- `lib/notifications/notificationActions.ts` lines 79, 99 — Both `(Notification as any).maxActions` casts

### Room status
- `lib/hooks/useRoomStatus.ts` line 70 — `data.rooms as any[]` cast
- `types/netatmoProxy.ts` line 57 — `NetatmoProxyRoom` interface (candidate type)

### Device config service
- `lib/services/unifiedDeviceConfigService.ts` lines 43-47 — `getDeviceMetadata()` returning `Record<string, unknown> | null`
- `lib/services/unifiedDeviceConfigService.ts` lines 128, 291-298, 324-332 — All `as any` cast sites

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `types/netatmoProxy.ts:NetatmoProxyRoom` — Already defines room fields, may be directly usable for TYPE-04
- `types/firebase/notifications.ts:NotificationPreferences` — Existing Firebase notification prefs type
- `DeviceConfigData` / `DeviceConfigItem` in `unifiedDeviceConfigService.ts` — Already typed, just need `getDeviceMetadata()` return type to match

### Established Patterns
- Generic DB access: project already uses generic patterns elsewhere (e.g., `useState<StoveState>()`)
- Type guards: `error instanceof Error` pattern used throughout the codebase for error narrowing
- Module augmentation: `declare global` used in `types/global.d.ts` for other browser API extensions
- Inline interfaces: project prefers inline interfaces for single-use response shapes in API routes

### Integration Points
- `adminDbGet` is called from ~15 files across lib/ and app/ — the generic overload must be backward-compatible (default to `unknown` when no generic provided)
- `getDeviceMetadata()` is internal to `unifiedDeviceConfigService.ts` — changing its return type has no external impact
- `useNetworkQuality` is used by `useAdaptivePolling` — the hook's public API doesn't change, only internal types

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 114-type-safety-lib*
*Context gathered: 2026-03-22*
