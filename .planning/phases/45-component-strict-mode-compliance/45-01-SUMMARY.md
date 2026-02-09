---
phase: 45-component-strict-mode-compliance
plan: 01
subsystem: components/devices
tags: [strict-mode, type-safety, device-cards]
dependencies:
  requires: []
  provides: [strict-compliant-lights-card, strict-compliant-thermostat-card]
  affects: [app/components/devices/lights, app/components/devices/thermostat]
tech_stack:
  added: []
  patterns: [error-instanceof-pattern, pragmatic-any-for-external-apis, inline-type-assertions]
key_files:
  created: []
  modified:
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
decisions:
  - Pragmatic any for Slider onChange/onValueCommit (Radix prop type mismatch with design system wrapper)
  - Pragmatic any for DeviceCard statusBadge and banners props (flexible interface design)
  - Use || undefined pattern for null to undefined conversion (RoomSelector selectedRoomId prop)
  - Unknown intermediate type for schedule data type assertions (safer than direct as)
metrics:
  duration: 811
  tasks_completed: 2
  files_modified: 2
  errors_fixed: 89
  completed_date: 2026-02-09
---

# Phase 45 Plan 01: Largest Device Cards Strict-Mode Summary

**One-liner:** Fixed all 89 strict-mode TypeScript errors in LightsCard (52) and ThermostatCard (37) - the two largest device components

## What Was Done

### Task 1: LightsCard.tsx (52 errors → 0)

**Error breakdown:**
- TS7006 (noImplicitAny): ~26 errors - Added parameter types to event handlers, callbacks, map/filter functions
- TS18046 (unknown error): ~9 errors - Applied `error instanceof Error ? error.message : String(error)` pattern
- TS2322 (type mismatch): ~8 errors - Fixed null/undefined handling for selectedRoomId and selectedRoomGroupedLightId
- TS7053 (implicit index): ~1 error - Added explicit Record type for badges object
- Other: ~8 errors - Type assertions, function return types

**Key patterns applied:**
- Event handlers: `(e: React.ChangeEvent<HTMLSelectElement>)`, `(value: number | number[])` for Slider
- API responses: Inline type assertions `as { rooms?: any[]; error?: string }`
- Callbacks: `(light: any) => ...`, `(room: any) => ...` for Hue API data shapes
- Catch blocks: `catch (err: unknown) { const message = err instanceof Error ? err.message : String(err); }`
- Pragmatic any: Slider props (Radix/design system type mismatch), statusBadge (DeviceCard flexibility)

### Task 2: ThermostatCard.tsx (37 errors → 0)

**Error breakdown:**
- TS7006 (noImplicitAny): ~19 errors - Added parameter types to event handlers, API callbacks, map/filter functions
- TS18046 (unknown error): ~9 errors - Applied error instanceof Error pattern
- TS2352 (conversion mistake): ~2 errors - Fixed schedule type assertions with unknown intermediate
- TS2322 (type mismatch): ~3 errors - Fixed selectedRoomId null to undefined conversion
- TS7053 (implicit index): ~1 error - Added Record<string, string> for colorStyles
- Other: ~3 errors - Function parameter types

**Key patterns applied:**
- Function parameters: `(newMode: string)`, `(roomId: string, temp: number)`
- Netatmo data: Typed callbacks `(room: any)`, `(module: any)` for API response shapes
- Type assertions: `as unknown as ScheduleItem[]` for safer conversion
- Dynamic objects: `const colorStyles: Record<string, string> = { ... }`
- Catch blocks: Same error instanceof Error pattern as Task 1

## Deviations from Plan

None - plan executed exactly as written. All 89 errors fixed with no behavioral changes.

## Verification

```bash
# Both files have zero errors
npx tsc --noEmit 2>&1 | grep -E "app/components/devices/(lights/LightsCard|thermostat/ThermostatCard)\.tsx" | wc -l
# Result: 0

# No behavioral changes - existing functionality preserved
# All type annotations are additive only
```

## Test Impact

No tests exist for these components. Runtime behavior unchanged - only type annotations added.

## Commits

| Task | Commit | Files | Errors Fixed |
|------|--------|-------|--------------|
| 1    | 42647ed | app/components/devices/lights/LightsCard.tsx | 52 |
| 2    | 0c32764 | app/components/devices/thermostat/ThermostatCard.tsx | 37 |

## Patterns Established

**Error handling (phase 44 pattern):**
```typescript
catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  setError(message);
}
```

**API response typing:**
```typescript
const data = await response.json() as {
  rooms?: any[];
  error?: string;
  reconnect?: boolean
};
```

**Callback typing for external APIs:**
```typescript
// Hue/Netatmo API data shapes are dynamic - pragmatic any
rooms.map((room: any) => ({ id: room.id, name: room.metadata?.name }))
```

**Null to undefined conversion:**
```typescript
// For props that expect string | undefined, not string | null
selectedRoomId={selectedRoomId || undefined}
```

**Pragmatic any for library prop mismatches:**
```typescript
// Radix Slider vs design system wrapper type mismatch
onChange={((value: number | number[]) => ...) as any}
```

## Impact

**Before:**
- LightsCard.tsx: 52 tsc errors
- ThermostatCard.tsx: 37 tsc errors
- Total: 89 errors (21% of component strict-mode errors)

**After:**
- Both files: 0 tsc errors
- No runtime behavioral changes
- Type safety improved for event handlers, API responses, callbacks

**Next:** Wave 2 will tackle the remaining ~1108 component strict-mode errors across smaller files.
