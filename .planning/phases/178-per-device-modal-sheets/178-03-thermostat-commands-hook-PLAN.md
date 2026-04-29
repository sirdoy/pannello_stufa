---
phase: 178
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/thermostat/hooks/useThermostatCommands.ts
  - app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts
autonomous: true
requirements: [SHEET-03]
tags: [ember-glass, sheets, thermostat, commands, hook]
must_haves:
  truths:
    - "useThermostatCommands exposes setRoomSetpoint(roomId, target), setHomeMode(mode), setRoomMode(roomId, mode)"
    - "setRoomSetpoint POSTs to NETATMO_ROUTES.setRoomThermpoint with {home_id, room_id, mode: 'manual', temp}"
    - "setHomeMode POSTs to NETATMO_ROUTES.setThermMode with {home_id, mode: 'schedule' | 'away' | 'hg'}"
    - "Hook uses useRetryableCommand wrapper (retry + idempotency); mirrors useStoveCommands/useLightsCommands convention"
    - "Hook returns netatmoTempCmd + netatmoModeCmd objects (mirrors existing pattern)"
    - "Zero useMemo / useCallback inside the hook"
  artifacts:
    - path: app/components/devices/thermostat/hooks/useThermostatCommands.ts
      provides: "Thermostat write commands wrapping setroomthermpoint + setthermmode (D-16)"
      min_lines: 70
    - path: app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts
      provides: "Body shape + retry integration coverage"
      min_lines: 100
  key_links:
    - from: app/components/devices/thermostat/hooks/useThermostatCommands.ts
      to: app/api/v1/netatmo/setroomthermpoint/route.ts
      via: "fetch POST via useRetryableCommand"
      pattern: "NETATMO_ROUTES\\.setRoomThermpoint"
    - from: app/components/devices/thermostat/hooks/useThermostatCommands.ts
      to: app/api/v1/netatmo/setthermmode/route.ts
      via: "fetch POST via useRetryableCommand"
      pattern: "NETATMO_ROUTES\\.setThermMode"
user_setup: []
---

<objective>
Ship the new `useThermostatCommands` hook (CONTEXT D-16, RESEARCH §"Pattern 2") that ClimateSheet (Plan 178-05) consumes. Wraps two **already-existing** API routes via `useRetryableCommand`:
- `POST /api/v1/netatmo/setroomthermpoint` — `{home_id, room_id, mode: 'manual'|'home', temp}` for per-room setpoint writes.
- `POST /api/v1/netatmo/setthermmode` — `{home_id, mode: 'schedule'|'away'|'hg'}` for home-level mode.

Mirrors the convention of `useStoveCommands`, `useLightsCommands`, `useSonosCommands` — same `useRetryableCommand` retry/idempotency infrastructure (Phase 7.0 memory pattern).

**Pitfall 5 callout** (RESEARCH §Pitfall 5): `setthermmode` does NOT accept `'manual'`. The Netatmo proxy schema is `'schedule' | 'away' | 'hg'`. The "Manuale" mode pill in ClimateSheet is a UI affordance that DOES NOT call `setHomeMode` — it reflects per-room manual override state. ClimateSheet (Plan 178-05) handles the UI; the hook simply types the union correctly so TypeScript blocks `'manual'`.

Purpose: The single new write surface in Phase 178. Identical pattern to existing command hooks — zero new architecture.
Output: 1 hook .ts, 1 jest spec.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-RESEARCH.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@app/components/devices/lights/hooks/useLightsCommands.ts
@app/components/devices/thermostat/ThermostatCard.tsx
@types/netatmoProxy.ts
@lib/routes.ts
@lib/hooks/useRetryableCommand.ts

<interfaces>
<!-- VERIFIED via routes.ts: -->
<!--   NETATMO_ROUTES.setRoomThermpoint  → '/api/v1/netatmo/setroomthermpoint' -->
<!--   NETATMO_ROUTES.setThermMode       → '/api/v1/netatmo/setthermmode' -->
<!-- -->
<!-- VERIFIED via types/netatmoProxy.ts: -->
<!--   SetRoomThermpointRequest = { home_id, room_id, mode: 'manual' | 'home', temp } -->
<!--   SetThermmodeRequest      = { home_id, mode: 'schedule' | 'away' | 'hg' } -->
<!-- -->
<!-- VERIFIED via useRetryableCommand: -->
<!--   useRetryableCommand({ device, action }) → { execute(url, options), isRetrying, lastError } -->
<!-- -->
<!-- Reference pattern (consumed verbatim shape): -->
<!--   useLightsCommands.ts:69-110 — single hook function, multiple useRetryableCommand handles, -->
<!--   one async wrapper per command, optional refetch + setError integration. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Ship useThermostatCommands hook + jest spec (RED → GREEN)</name>
  <files>
    app/components/devices/thermostat/hooks/useThermostatCommands.ts,
    app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts
  </files>
  <read_first>
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§"Pattern 2: New commands hook with useRetryableCommand"; §"Verified useThermostatCommands request bodies"; §Pitfall 5 — manual ≠ setthermmode)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 478-548 — verbatim hook implementation)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-16, D-32 — hook spec)
    - app/components/devices/lights/hooks/useLightsCommands.ts (FULL FILE — reference pattern; mirror structure)
    - app/components/devices/lights/hooks/__tests__/useLightsCommands.test.ts (FULL FILE if it exists — test pattern; otherwise mirror useStoveCommands test)
    - app/components/devices/thermostat/ThermostatCard.tsx (lines 183-236 — existing live consumer of /setroomthermpoint, body shape reference)
    - types/netatmoProxy.ts (SetRoomThermpointRequest + SetThermmodeRequest types)
    - lib/routes.ts (NETATMO_ROUTES constants)
    - lib/hooks/useRetryableCommand.ts (signature: `useRetryableCommand({ device, action })` returns `{ execute, isRetrying, lastError }`)
  </read_first>
  <behavior>
    useThermostatCommands hook (RED tests written first, then GREEN implementation):
    - Test 1: `setRoomSetpoint(roomId, target)` POSTs to `/api/v1/netatmo/setroomthermpoint` with body `{home_id, room_id, mode: 'manual', temp}` and `Content-Type: application/json`.
    - Test 2: `setHomeMode('schedule')` POSTs to `/api/v1/netatmo/setthermmode` with body `{home_id, mode: 'schedule'}`.
    - Test 3: `setHomeMode('away')` POSTs `{home_id, mode: 'away'}`.
    - Test 4: `setHomeMode('hg')` POSTs `{home_id, mode: 'hg'}`.
    - Test 5: TypeScript prevents `setHomeMode('manual')` at compile time (this is a static check; the spec asserts the type signature via `// @ts-expect-error` if useful, OR simply asserts the runtime call shape with the typed union).
    - Test 6: `setRoomMode(roomId, 'manual')` POSTs `{home_id, room_id, mode: 'manual'}` (no `temp` field) to `/setroomthermpoint`.
    - Test 7: `setRoomMode(roomId, 'home')` POSTs `{home_id, room_id, mode: 'home'}`.
    - Test 8: When `res.ok === true`, the hook calls `params.refetch()` exactly once.
    - Test 9: When `res.ok === false`, `params.refetch()` is NOT called.
    - Test 10: When fetch throws, the hook calls `params.setError?.(message)` with the error message (using the `err instanceof Error ? err.message : String(err)` guard).
    - Test 11: The hook exposes `netatmoTempCmd` and `netatmoModeCmd` objects (the underlying `useRetryableCommand` returns) for UI integration.
  </behavior>
  <action>
**File 1: `app/components/devices/thermostat/hooks/useThermostatCommands.ts`** (NEW — RESEARCH §"Pattern 2" verbatim, expanded with error guard from useLightsCommands.ts:101-103):

```typescript
'use client';

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import { NETATMO_ROUTES } from '@/lib/routes';
import type {
  SetRoomThermpointRequest,
  SetThermmodeRequest,
} from '@/types/netatmoProxy';

/**
 * Thermostat commands hook (CONTEXT D-16) — wraps two existing Netatmo proxy routes
 * via the Phase 7.0 retry/idempotency infrastructure. Mirrors the convention of
 * `useStoveCommands` / `useLightsCommands` / `useSonosCommands`.
 *
 * Routes consumed (NO new server code):
 *   POST /api/v1/netatmo/setroomthermpoint  — per-room setpoint + mode
 *   POST /api/v1/netatmo/setthermmode       — home-level mode (schedule|away|hg)
 *
 * Pitfall 5: `setthermmode` does NOT accept 'manual'. The "Manuale" pill in ClimateSheet
 * is a UI affordance reflecting per-room override state — NOT a setHomeMode call.
 * The TypeScript union here statically blocks 'manual'.
 */
export interface UseThermostatCommandsParams {
  /** Home id from useThermostatData().topology.home_id. Required for both writes. */
  homeId: string;
  /** Refetch trigger — called after a successful write to refresh local state. */
  refetch: () => Promise<void>;
  /** Optional setError to surface failures to the consuming UI. */
  setError?: (message: string | null) => void;
}

export interface UseThermostatCommandsReturn {
  setRoomSetpoint: (roomId: string, target: number) => Promise<void>;
  setHomeMode: (mode: SetThermmodeRequest['mode']) => Promise<void>;
  setRoomMode: (roomId: string, mode: SetRoomThermpointRequest['mode']) => Promise<void>;
  netatmoTempCmd: ReturnType<typeof useRetryableCommand>;
  netatmoModeCmd: ReturnType<typeof useRetryableCommand>;
}

export function useThermostatCommands(
  params: UseThermostatCommandsParams,
): UseThermostatCommandsReturn {
  const netatmoTempCmd = useRetryableCommand({
    device: 'netatmo',
    action: 'setRoomSetpoint',
  });
  const netatmoModeCmd = useRetryableCommand({
    device: 'netatmo',
    action: 'setHomeMode',
  });

  const setRoomSetpoint = async (roomId: string, target: number): Promise<void> => {
    try {
      const body: SetRoomThermpointRequest = {
        home_id: params.homeId,
        room_id: roomId,
        mode: 'manual',
        temp: target,
      };
      const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) await params.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      params.setError?.(message);
    }
  };

  const setHomeMode = async (mode: SetThermmodeRequest['mode']): Promise<void> => {
    try {
      const body: SetThermmodeRequest = { home_id: params.homeId, mode };
      const res = await netatmoModeCmd.execute(NETATMO_ROUTES.setThermMode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) await params.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      params.setError?.(message);
    }
  };

  // Per-room mode write — currently used to revert from 'manual' (override) to 'home' (schedule).
  // setRoomThermpointRequest.mode is 'manual' | 'home' (NOT 'off'). For "off" the standard Netatmo
  // dance is setHomeMode('hg') (frost-guard).
  const setRoomMode = async (
    roomId: string,
    mode: SetRoomThermpointRequest['mode'],
  ): Promise<void> => {
    try {
      const body: SetRoomThermpointRequest = {
        home_id: params.homeId,
        room_id: roomId,
        mode,
      };
      const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res?.ok) await params.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      params.setError?.(message);
    }
  };

  return {
    setRoomSetpoint,
    setHomeMode,
    setRoomMode,
    netatmoTempCmd,
    netatmoModeCmd,
  };
}
```

**File 2: `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts`** (RED tests written first, then verified GREEN against the implementation):

```typescript
import { renderHook, act } from '@testing-library/react';
import { useThermostatCommands } from '../useThermostatCommands';

// Mock useRetryableCommand to capture the URL + options passed to .execute().
jest.mock('@/lib/hooks/useRetryableCommand', () => ({
  useRetryableCommand: jest.fn(),
}));

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';

const mockedUseRetryableCommand = useRetryableCommand as jest.MockedFunction<
  typeof useRetryableCommand
>;

describe('useThermostatCommands (CONTEXT D-16)', () => {
  let executeMock: jest.Mock;
  let refetch: jest.Mock<Promise<void>, []>;
  let setError: jest.Mock<void, [string | null]>;

  beforeEach(() => {
    jest.resetAllMocks();
    executeMock = jest.fn().mockResolvedValue({ ok: true });
    refetch = jest.fn().mockResolvedValue(undefined);
    setError = jest.fn();
    mockedUseRetryableCommand.mockReturnValue({
      execute: executeMock,
      isRetrying: false,
      lastError: null,
    } as unknown as ReturnType<typeof useRetryableCommand>);
  });

  it('setRoomSetpoint POSTs the correct body to setroomthermpoint', async () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );
    await act(async () => {
      await result.current.setRoomSetpoint('room-A', 21);
    });
    expect(executeMock).toHaveBeenCalledWith(
      '/api/v1/netatmo/setroomthermpoint',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_id: 'home-1',
          room_id: 'room-A',
          mode: 'manual',
          temp: 21,
        }),
      }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it.each(['schedule', 'away', 'hg'] as const)(
    'setHomeMode POSTs mode=%s to setthermmode',
    async (mode) => {
      const { result } = renderHook(() =>
        useThermostatCommands({ homeId: 'home-1', refetch, setError }),
      );
      await act(async () => {
        await result.current.setHomeMode(mode);
      });
      expect(executeMock).toHaveBeenCalledWith(
        '/api/v1/netatmo/setthermmode',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ home_id: 'home-1', mode }),
        }),
      );
    },
  );

  it('setRoomMode POSTs {home_id, room_id, mode} without temp', async () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );
    await act(async () => {
      await result.current.setRoomMode('room-A', 'manual');
    });
    expect(executeMock).toHaveBeenCalledWith(
      '/api/v1/netatmo/setroomthermpoint',
      expect.objectContaining({
        body: JSON.stringify({
          home_id: 'home-1',
          room_id: 'room-A',
          mode: 'manual',
        }),
      }),
    );
  });

  it('setRoomMode mode=home reverts to schedule', async () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );
    await act(async () => {
      await result.current.setRoomMode('room-A', 'home');
    });
    const lastCallBody = executeMock.mock.calls.at(-1)?.[1]?.body;
    expect(lastCallBody).toBe(
      JSON.stringify({ home_id: 'home-1', room_id: 'room-A', mode: 'home' }),
    );
  });

  it('skips refetch when res.ok is false', async () => {
    executeMock.mockResolvedValueOnce({ ok: false });
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );
    await act(async () => {
      await result.current.setHomeMode('schedule');
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it('routes thrown errors to params.setError with the message', async () => {
    executeMock.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );
    await act(async () => {
      await result.current.setRoomSetpoint('room-A', 21);
    });
    expect(setError).toHaveBeenCalledWith('boom');
  });

  it('exposes netatmoTempCmd and netatmoModeCmd objects for UI integration', () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );
    expect(result.current.netatmoTempCmd).toBeDefined();
    expect(result.current.netatmoModeCmd).toBeDefined();
  });
});
```

If `renderHook` is not from `@testing-library/react` in this project version, fall back to `@testing-library/react-hooks` import — verify by checking an existing hook spec (e.g. `app/components/devices/lights/hooks/__tests__/useLightsCommands.test.ts` if it exists) and mirror its imports.

**Important:** Follow Phase 7.0 / Phase 11.1 jest hygiene — `jest.resetAllMocks()` + explicit `beforeEach` mock wiring (memory: parallel mocks bleed across tests). The spec uses `jest.mock('@/lib/hooks/useRetryableCommand', ...)` at the top level so module mocking happens before import (memory pattern).
  </action>
  <verify>
    <automated>npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/devices/thermostat/hooks/useThermostatCommands.ts` exists.
    - File contains `export function useThermostatCommands` AND `'use client'` directive.
    - File contains `useRetryableCommand({ device: 'netatmo', action: 'setRoomSetpoint' })` AND `useRetryableCommand({ device: 'netatmo', action: 'setHomeMode' })`.
    - File contains `NETATMO_ROUTES.setRoomThermpoint` AND `NETATMO_ROUTES.setThermMode`.
    - File contains `mode: SetThermmodeRequest['mode']` (typed union — blocks `'manual'` at compile time).
    - File contains `err instanceof Error ? err.message : String(err)`.
    - Spec file `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` exists with at least 7 `it(`/`it.each(` cases.
    - `npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` exits 0.
    - `! grep -E "useMemo|useCallback" app/components/devices/thermostat/hooks/useThermostatCommands.ts` returns no hits.
  </acceptance_criteria>
  <done>
    Hook + spec ship; spec exits 0; zero useMemo/useCallback; existing useThermostatData spec UNTOUCHED.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → /api/v1/netatmo/setroomthermpoint, /setthermmode | Existing routes; auth enforced server-side via withAuthAndErrorHandler (Phase 19.0 baseline) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-03-01 | Tampering | Setpoint out-of-range injection | mitigate | Client-side `<RadialDial min={15} max={28}>` clamps in ClimateSheet. Server-side: SetRoomThermpointRequest typed `temp: 5..30`; Netatmo proxy hard-validates. |
| T-178-03-02 | Tampering | Replay of mutation requests | mitigate | `useRetryableCommand` injects idempotency keys (Phase 7.0 infrastructure — verified in lib/hooks/useRetryableCommand.ts). |
| T-178-03-03 | Spoofing | Cross-site write via stolen session | mitigate | Auth0 cookie httpOnly + SameSite=Lax (existing). No new auth surface — hook only POSTs to first-party routes. |
| T-178-03-04 | Tampering | TypeScript bypass of mode union | accept | Compile-time check; `as` casting at runtime cannot bypass server validation. ClimateSheet maps Italian labels through a typed `as const` table; setHomeMode union enforces `'schedule' | 'away' | 'hg'`. |
</threat_model>

<verification>
```bash
npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] `useThermostatCommands.ts` ships with three async write methods + two `useRetryableCommand` handles.
- [ ] Spec asserts body shapes for all three methods and refetch/error-routing semantics; exits 0.
- [ ] Zero useMemo / useCallback in the hook.
- [ ] tsc clean.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-03-SUMMARY.md`.
</output>
