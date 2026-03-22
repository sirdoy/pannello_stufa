# Phase 113: Known Issues Fix - Research

**Researched:** 2026-03-22
**Domain:** Corrective fixes — debug panel field names, stove type/dead code, design system compliance, test isolation
**Confidence:** HIGH

## Summary

Phase 113 resolves 6 known issues carried forward from the v14.0 audit. All issues are small, surgical fixes in existing files — no new abstractions, no new dependencies. The source of truth for each fix is already in the codebase.

Two HueTab debug panel files (primary and API variant) both read `data.bridgeConnected` when the `HueBridgeHealth` type defines the field as `connected`. The POST param named `brightness` is a UI label issue — the actual API body key `bri` is already sent correctly in `onExecute`, but the `ApiParam.name` field (which populates `formValues` keys) is still `brightness` instead of `bri`.

Stove issues are largely already resolved: `UseStoveDataReturn.status` is correctly typed as `StoveState` (ISSUE-04 is a no-op confirm), and `staleness.cachedAt` is populated from `last_poll_at` (ISSUE-03 dead code claim needs verification before removal). The `instanceof Date` guard in `StoveStatus.tsx` line 129 is genuinely unnecessary — `cachedAt` is always `Date | null` from the hook.

`ButtonIcon` (ghost/icon-only button from `@/app/components/ui/Button`) is the correct replacement for the raw `<button>` in `CopyableIp`. The existing inline styles closely match ghost+sm semantics. `ButtonIcon` accepts a string `icon` prop — since `CopyableIp` renders Lucide React elements (`<Copy />`, `<Check />`), the icon must be passed as children through `Button` directly with `iconOnly` rather than as `ButtonIcon.icon` (which takes a string emoji). This is the only structural consideration.

FormModal's timer leak is confirmed: `jest.useFakeTimers()` is called at line 389 inside the test body, and `jest.useRealTimers()` is called at line 422 — both within the same test, which appears correct. However, if the test throws before reaching line 422, timers stay fake. The fix is to add `afterEach(() => jest.useRealTimers())` within the describe block or use try/finally.

**Primary recommendation:** Execute as a single plan. All 6 issues are small, independent edits. One wave with one plan covering all files is appropriate.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** In both `app/debug/components/tabs/HueTab.tsx` and `app/debug/api/components/tabs/HueTab.tsx`, change `data.bridgeConnected` to `data.connected` (line 43-44) to match `HueBridgeHealth` interface in `types/hueProxy.ts`
- **D-02:** The form field named `brightness` in the control forms (lines 213, 235) is a UI label only — the PUT body already correctly sends `bri` (lines 221, 243). The requirement refers to renaming the form field name from `brightness` to `bri` so debug panel field names match the actual API payload shape
- **D-03:** The `staleness.cachedAt` display in `StoveStatus.tsx` (lines 126-132) is NOT dead code — the proxy `ThermorossiStatusResponse` includes `last_poll_at: string | null` and the hook correctly populates `lastPollAt` from it. However, the v13.0 audit flagged it as "always null". The fix should verify whether the proxy actually returns `last_poll_at` and either: (a) confirm the code works and close the issue, or (b) remove the dead branch if the proxy never populates the field. Planner should add a verification step.
- **D-04:** The `instanceof Date` check in `StoveStatus.tsx` line 129 is unnecessary — `cachedAt` is always `Date | null` from the hook. Simplify to match `ThermostatCard.tsx` pattern (line 721) which just does `new Date(staleness.cachedAt)`
- **D-05:** The `UseStoveDataReturn.status` is already typed as `StoveState` (line 41) and `useState<StoveState>('off')` (line 102) — both correct. The v13.0 audit flagged a pre-existing issue that appears to have been fixed during the v13.0 migration. Planner should verify no other location widens the type to `string` and close the issue if confirmed.
- **D-06:** Replace raw `<button>` with design system `ButtonIcon` component (from `@/app/components/ui/Button`) using `variant="ghost"` and `size="sm"` — icon-only copy button matches ghost variant semantics
- **D-07:** Remove inline Tailwind classes from the button — let ButtonIcon handle styling. Keep the `aria-label` for accessibility.
- **D-08:** The flake is caused by `jest.useFakeTimers()` in the "auto-closes after success delay" test (line 388-422) leaking timer state into subsequent tests. The workaround `mockOnClose.mockClear()` at line 430 is a symptom, not the fix.
- **D-09:** Fix by wrapping the fake timers test in proper setup/teardown: `jest.useFakeTimers()` in the specific test's scope and `jest.useRealTimers()` in a `finally` block or `afterEach`. Remove the manual `mockClear` workaround.

### Claude's Discretion
- Exact `ButtonIcon` import path and prop mapping for CopyableIp
- Whether to add a unit test for CopyableIp or just verify existing tests pass
- How to structure the `last_poll_at` verification (manual test vs automated check)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ISSUE-01 | Debug panel HueTab `bridgeConnected` field name corrected to `connected` | Confirmed: `HueBridgeHealth.connected` in `types/hueProxy.ts` line 121. Both HueTab files have `data.bridgeConnected` at line 43-44 — single-line change each. |
| ISSUE-02 | Debug panel HueTab `brightness` key corrected to `bri` | Confirmed: `ApiParam.name` is used as the `formValues` key passed to `onExecute`. Renaming `name: 'brightness'` to `name: 'bri'` and updating `values.brightness` to `values.bri` in `onExecute` makes the key match the API body key. Both HueTabs need this in both Control Light and Control Room params. |
| ISSUE-03 | `staleness.cachedAt` always null for stove — dead code removed | Partially: hook at line 182 sets `setLastPollAt(last_poll_at ? new Date(last_poll_at) : null)` — field is populated if proxy returns it. Verification step required before deciding removal vs. close. `instanceof Date` guard (D-04) is confirmed unnecessary regardless. |
| ISSUE-04 | `UseStoveDataReturn.status` typed as `StoveState` union instead of `string` | Confirmed already fixed: `status: StoveState` at line 41 and `useState<StoveState>('off')` at line 102. Planner must add grep verification step to confirm no widening elsewhere. |
| ISSUE-05 | CopyableIp uses design system Button instead of plain `<button>` | Confirmed: `ButtonIcon` exported from `@/app/components/ui/Button`. Uses Lucide `<Copy />`/`<Check />` not string icons — must use `Button` with `iconOnly` prop directly rather than `ButtonIcon` (which expects `icon: string`). Details in Architecture Patterns. |
| ISSUE-06 | FormModal isolation flake diagnosed and fixed | Confirmed: `jest.useFakeTimers()` at line 389, `jest.useRealTimers()` at line 422, `mockClear` workaround at line 431. Fix: add `afterEach(() => jest.useRealTimers())` in the `Success States` describe block + remove `mockClear` workaround. |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies)
| File | Current State | Fix |
|------|--------------|-----|
| `app/debug/components/tabs/HueTab.tsx` | `data.bridgeConnected`, param `name: 'brightness'` | Change to `data.connected`, rename param to `bri` |
| `app/debug/api/components/tabs/HueTab.tsx` | Same as above (duplicate file) | Same changes |
| `app/components/devices/stove/components/StoveStatus.tsx` | `instanceof Date` guard at line 129 | Remove guard, match ThermostatCard pattern |
| `app/network/components/CopyableIp.tsx` | Raw `<button>` with inline Tailwind | Replace with `Button` from `@/app/components/ui/Button` |
| `app/components/ui/__tests__/FormModal.test.tsx` | Timer leak + manual `mockClear` workaround | Add `afterEach` teardown, remove workaround |

**Installation:** None required.

## Architecture Patterns

### ISSUE-01: HueBridgeHealth field correction
The `HueBridgeHealth` interface (confirmed in `types/hueProxy.ts` line 121) defines:
```typescript
// types/hueProxy.ts line 120-128
export interface HueBridgeHealth {
  connected: boolean;       // ← correct field name
  firmware_version: string | null;
  // ...
}
```
Both HueTab files check `data.bridgeConnected !== undefined` at line 43. Change to `data.connected !== undefined` and `data.connected ? 'connected' : 'disconnected'`.

### ISSUE-02: ApiParam name vs. label distinction
`ApiParam.name` is the form state key — it populates `formValues` in `PostEndpointCard` via:
```typescript
// app/debug/components/ApiTab.tsx line 148-150
const [formValues, setFormValues] = useState<Record<string, string>>(
  params.reduce((acc, param) => ({ ...acc, [param.name]: param.defaultValue }), {} as Record<string, string>)
);
```
`ApiParam.label` is the display label only. To fix ISSUE-02: change `name: 'brightness'` to `name: 'bri'` in both Control Light and Control Room params in both HueTab files. Then update the `onExecute` reference from `values.brightness` to `values.bri`. The `label` string can remain `'Brightness (0-100)'` for UI readability.

### ISSUE-03/04: Stove staleness pattern
The `ThermostatCard.tsx` reference pattern (no `instanceof` guard):
```typescript
// app/components/devices/thermostat/ThermostatCard.tsx line 721
{formatDistanceToNow(new Date(staleness.cachedAt), { addSuffix: true, locale: it })}
```
Current `StoveStatus.tsx` pattern (unnecessary guard):
```typescript
// app/components/devices/stove/components/StoveStatus.tsx line 129
staleness.cachedAt instanceof Date ? staleness.cachedAt : new Date(staleness.cachedAt)
```
Since `cachedAt: Date | null` per `StalenessInfo`, and the outer check `staleness?.cachedAt` already guards null, the `instanceof` branch is unreachable. Simplify to `new Date(staleness.cachedAt)`.

For ISSUE-03 verification: the hook at line 182 does populate `lastPollAt` from `last_poll_at`. The planner should add a verification step: grep for any test or runtime evidence that `last_poll_at` is always null. If no evidence, close ISSUE-03 without code removal (the display code is live, not dead).

### ISSUE-05: CopyableIp with design system button
`ButtonIcon` has `icon: string` (emoji/text) — incompatible with Lucide JSX icons. Use `Button` directly with `iconOnly` prop:
```typescript
import { Button } from '@/app/components/ui/Button';
// ...
<Button
  variant="ghost"
  size="sm"
  iconOnly
  onClick={handleCopy}
  aria-label={copied ? 'IP copiato' : 'Copia IP'}
>
  {copied ? <Check className="w-4 h-4 text-sage-400" /> : <Copy className="w-4 h-4" />}
</Button>
```
Remove all inline Tailwind from the button element. The `min-h-[44px]`, `bg-transparent`, hover states are all handled by `buttonVariants` ghost+sm.

**Alternative (if ButtonIcon is preferred):** Wrap the Lucide icon in a `<span>` and pass as string is not viable. `Button` directly with `iconOnly` is the correct pattern. Other icon-only ghost buttons in the codebase (e.g., copy buttons in debug panels) use raw buttons — CopyableIp will be the first design-system-compliant icon button.

### ISSUE-06: Jest fake timers teardown
The flake: if the `auto-closes after success delay` test fails before line 422, `jest.useRealTimers()` never runs. Subsequent tests that use `userEvent.setup()` get fake timers.

Fix pattern used elsewhere in the codebase (e.g., scheduler tests):
```typescript
describe('Success States', () => {
  afterEach(() => {
    jest.useRealTimers();  // ← add this
  });

  test('auto-closes after success delay', async () => {
    jest.useFakeTimers();
    // ... test body unchanged ...
    jest.useRealTimers();  // ← can stay for explicitness
  });
});
```
Remove the `mockOnClose.mockClear()` workaround at line 430-431 (it was compensating for the leaked timer firing `onClose` during cleanup).

### Anti-Patterns to Avoid
- **Editing only one HueTab:** Both `app/debug/components/tabs/HueTab.tsx` and `app/debug/api/components/tabs/HueTab.tsx` are near-identical. Both must be updated for ISSUE-01 and ISSUE-02.
- **Renaming ApiParam.label for ISSUE-02:** The `label` is the display string. Only `name` needs to change to `bri`.
- **Using ButtonIcon for CopyableIp:** `ButtonIcon.icon` is `string` type — Lucide JSX elements cannot be passed. Use `Button` with `iconOnly` instead.
- **Removing staleness display code without verification:** ISSUE-03 is flagged as "always null" but the hook actively populates `lastPollAt` from `last_poll_at`. Verify before removing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon-only ghost button | Raw `<button>` with Tailwind | `Button` with `iconOnly` from design system | Touch targets, focus ring, haptic, disabled state all handled |
| Timer isolation in tests | try/finally in test body | `afterEach(() => jest.useRealTimers())` | Runs even when test throws; cleaner separation |

## Common Pitfalls

### Pitfall 1: ApiParam name/label confusion (ISSUE-02)
**What goes wrong:** Renaming only the `label` field leaves `formValues` still keyed as `brightness`. The PUT body reads `values.brightness` which is now undefined — sends `bri: NaN`.
**Why it happens:** `name` and `label` serve different purposes in `ApiParam`; both look like display text but `name` is functional.
**How to avoid:** Change `name: 'brightness'` to `name: 'bri'` AND update `values.brightness` to `values.bri` in `onExecute`.
**Warning signs:** Form submission sends `bri: NaN` in network tab.

### Pitfall 2: ButtonIcon vs. Button for Lucide icons (ISSUE-05)
**What goes wrong:** Passing a Lucide `<Copy />` element to `ButtonIcon.icon` (which is `string`) causes a TypeScript error.
**Why it happens:** `ButtonIcon` was designed for emoji/text icons (the design system's icon convention). Lucide is used in some components for SVG icons.
**How to avoid:** Use `Button` with `iconOnly` prop; place the Lucide element as children.

### Pitfall 3: ISSUE-03 over-removal
**What goes wrong:** Removing the `staleness.cachedAt` display block because "always null" — but the hook populates it when `last_poll_at` is non-null.
**Why it happens:** The v13.0 audit observation was that in testing/staging the proxy returned `null`. In production it may not.
**How to avoid:** Add a comment confirming the field is active + simplify the `instanceof` guard (D-04), but keep the display block unless verified dead.

### Pitfall 4: FormModal mockClear removal causing false positive
**What goes wrong:** Removing `mockOnClose.mockClear()` from line 430 before the `afterEach` teardown is in place causes the "Cancel Behavior" test to see stale call counts from the leaked timer.
**How to avoid:** Add `afterEach(() => jest.useRealTimers())` first, then remove `mockClear`.

## Code Examples

### HueTab bridgeConnected → connected fix
```typescript
// Before (both HueTab files, line 43-44):
if (name === 'status' && data.bridgeConnected !== undefined) {
  setBridgeStatus(data.bridgeConnected ? 'connected' : 'disconnected');
}

// After:
if (name === 'status' && data.connected !== undefined) {
  setBridgeStatus(data.connected ? 'connected' : 'disconnected');
}
```

### HueTab brightness → bri param fix
```typescript
// Before (both HueTab files, Control Light and Control Room params):
{ name: 'brightness', label: 'Brightness (0-100)', type: 'number', min: 0, max: 100, defaultValue: '50' },
// ...
bri: Math.round(Number(values.brightness) * 254 / 100),

// After:
{ name: 'bri', label: 'Brightness (0-100)', type: 'number', min: 0, max: 100, defaultValue: '50' },
// ...
bri: Math.round(Number(values.bri) * 254 / 100),
```

### StoveStatus instanceof removal
```typescript
// Before (StoveStatus.tsx line 129):
staleness.cachedAt instanceof Date ? staleness.cachedAt : new Date(staleness.cachedAt)

// After (matching ThermostatCard.tsx line 721):
new Date(staleness.cachedAt)
```

### CopyableIp Button replacement
```typescript
// Before:
import { Copy, Check } from 'lucide-react';
// ...
<button
  onClick={handleCopy}
  aria-label={copied ? 'IP copiato' : 'Copia IP'}
  className="min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm bg-transparent ..."
>
  {copied ? <Check className="w-4 h-4 text-sage-400" /> : <Copy className="w-4 h-4" />}
</button>

// After:
import { Copy, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
// ...
<Button
  variant="ghost"
  size="sm"
  iconOnly
  onClick={handleCopy}
  aria-label={copied ? 'IP copiato' : 'Copia IP'}
>
  {copied ? <Check className="w-4 h-4 text-sage-400" /> : <Copy className="w-4 h-4" />}
</Button>
```

### FormModal afterEach teardown
```typescript
// In the 'Success States' describe block, add before tests:
afterEach(() => {
  jest.useRealTimers();
});

// Remove the manual workaround at line 430-431:
// mockOnClose.mockClear();  ← DELETE THIS
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="FormModal" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ISSUE-01 | `data.connected` used in both HueTabs | unit (type check via tsc) | `npx tsc --noEmit` | n/a — static check |
| ISSUE-02 | `values.bri` passed to PUT body | unit (manual verify in debug panel) | manual | n/a |
| ISSUE-03 | `instanceof` guard removed from StoveStatus | unit (tsc + visual check) | `npx tsc --noEmit` | n/a — static check |
| ISSUE-04 | No `string` widening at call sites | unit (tsc) | `npx tsc --noEmit` | n/a — static check |
| ISSUE-05 | CopyableIp renders Button, not `<button>` | unit | `npm test -- --testPathPattern="CopyableIp"` | ❌ Wave 0 (optional) |
| ISSUE-06 | FormModal suite passes in isolation and in full run | unit | `npm test -- --testPathPattern="FormModal"` | ✅ exists |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (catches type regressions for ISSUE-01, 02, 04)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/network/components/__tests__/CopyableIp.test.tsx` — covers ISSUE-05 Button rendering (optional: Claude's discretion per CONTEXT.md)

*(FormModal test infrastructure exists; TypeScript checks cover ISSUE-01, 02, 04 without new test files.)*

## Sources

### Primary (HIGH confidence)
- Direct file reads: `types/hueProxy.ts`, both `HueTab.tsx` files, `useStoveData.ts`, `StoveStatus.tsx`, `FormModal.test.tsx`, `Button.tsx`, `CopyableIp.tsx`, `ApiTab.tsx`
- All findings verified against actual file contents at time of research

### Secondary
- `CONTEXT.md` decisions (D-01 through D-09) confirmed by code inspection

## Metadata

**Confidence breakdown:**
- All issue diagnoses: HIGH — confirmed by direct file inspection, no ambiguity
- ISSUE-03 resolution path: MEDIUM — depends on runtime verification of `last_poll_at` proxy behavior
- ISSUE-05 ButtonIcon vs. Button decision: HIGH — `ButtonIcon.icon: string` type constraint is clear

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable — no fast-moving deps)
