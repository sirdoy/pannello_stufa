# Phase 113: Known Issues Fix - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve 6 known issues from the v14.0 milestone audit: debug panel HueTab field name mismatches, stove hook dead code and type widening, CopyableIp design system non-compliance, and FormModal test isolation flake. No new features — purely corrective fixes.

</domain>

<decisions>
## Implementation Decisions

### Debug panel HueTab field corrections (ISSUE-01, ISSUE-02)
- **D-01:** In both `app/debug/components/tabs/HueTab.tsx` and `app/debug/api/components/tabs/HueTab.tsx`, change `data.bridgeConnected` to `data.connected` (line 43-44) to match `HueBridgeHealth` interface in `types/hueProxy.ts`
- **D-02:** The form field named `brightness` in the control forms (lines 213, 235) is a UI label only — the PUT body already correctly sends `bri` (lines 221, 243). The requirement refers to renaming the form field name from `brightness` to `bri` so debug panel field names match the actual API payload shape

### Stove staleness dead code (ISSUE-03)
- **D-03:** The `staleness.cachedAt` display in `StoveStatus.tsx` (lines 126-132) is NOT dead code — the proxy `ThermorossiStatusResponse` includes `last_poll_at: string | null` and the hook correctly populates `lastPollAt` from it. However, the v13.0 audit flagged it as "always null". The fix should verify whether the proxy actually returns `last_poll_at` and either: (a) confirm the code works and close the issue, or (b) remove the dead branch if the proxy never populates the field. Planner should add a verification step.
- **D-04:** The `instanceof Date` check in `StoveStatus.tsx` line 129 is unnecessary — `cachedAt` is always `Date | null` from the hook. Simplify to match `ThermostatCard.tsx` pattern (line 721) which just does `new Date(staleness.cachedAt)`

### Stove status type widening (ISSUE-04)
- **D-05:** The `UseStoveDataReturn.status` is already typed as `StoveState` (line 41) and `useState<StoveState>('off')` (line 102) — both correct. The v13.0 audit flagged a pre-existing issue that appears to have been fixed during the v13.0 migration. Planner should verify no other location widens the type to `string` and close the issue if confirmed.

### CopyableIp design system compliance (ISSUE-05)
- **D-06:** Replace raw `<button>` with design system `ButtonIcon` component (from `@/app/components/ui/Button`) using `variant="ghost"` and `size="sm"` — icon-only copy button matches ghost variant semantics
- **D-07:** Remove inline Tailwind classes from the button — let ButtonIcon handle styling. Keep the `aria-label` for accessibility.

### FormModal test isolation flake (ISSUE-06)
- **D-08:** The flake is caused by `jest.useFakeTimers()` in the "auto-closes after success delay" test (line 388-422) leaking timer state into subsequent tests. The workaround `mockOnClose.mockClear()` at line 430 is a symptom, not the fix.
- **D-09:** Fix by wrapping the fake timers test in proper setup/teardown: `jest.useFakeTimers()` in the specific test's scope and `jest.useRealTimers()` in a `finally` block or `afterEach`. Remove the manual `mockClear` workaround.

### Claude's Discretion
- Exact `ButtonIcon` import path and prop mapping for CopyableIp
- Whether to add a unit test for CopyableIp or just verify existing tests pass
- How to structure the `last_poll_at` verification (manual test vs automated check)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard corrective fixes following existing patterns in the codebase.

</specifics>

<canonical_refs>
## Canonical References

### HueTab debug panels
- `types/hueProxy.ts` lines 120-128 — `HueBridgeHealth` interface defining correct field names (`connected`, not `bridgeConnected`)
- `app/debug/components/tabs/HueTab.tsx` — Primary debug panel HueTab
- `app/debug/api/components/tabs/HueTab.tsx` — API debug panel HueTab (duplicate)

### Stove hook & status
- `types/thermorossiProxy.ts` lines 34-43 — `ThermorossiStatusResponse` with `last_poll_at` and `data_freshness` fields
- `app/components/devices/stove/hooks/useStoveData.ts` — Stove data hook with staleness logic (lines 127-136)
- `app/components/devices/stove/components/StoveStatus.tsx` lines 126-132 — Staleness display with `cachedAt`
- `app/components/devices/thermostat/ThermostatCard.tsx` line 721 — Reference pattern for `staleness.cachedAt` display (simpler, no instanceof check)
- `lib/pwa/stalenessDetector.ts` — `StalenessInfo` type definition

### Design system
- `app/components/ui/Button.tsx` — `Button` and `ButtonIcon` components with variant/size props
- `app/network/components/CopyableIp.tsx` — File to fix (raw `<button>`)

### FormModal test
- `app/components/ui/__tests__/FormModal.test.tsx` — Test file with isolation flake (lines 388-449)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ButtonIcon` component: Already used throughout codebase for icon-only buttons, accepts `variant`, `size`, `icon`, and `aria-label` props
- `ThermostatCard.tsx` staleness display: Reference implementation for simplified `cachedAt` rendering (no `instanceof` check)

### Established Patterns
- Debug panel tabs follow identical structure in `app/debug/components/tabs/` and `app/debug/api/components/tabs/` — both must be updated together
- `callPutEndpoint` helper used in debug panel for PUT requests — field names in forms should match API body keys
- `jest.useFakeTimers()` / `jest.useRealTimers()` pattern: used in several test suites, always paired in same test scope

### Integration Points
- HueTab field names connect to `HueBridgeHealth` type from proxy response
- Stove staleness connects to proxy `data_freshness` + `last_poll_at` fields in `ThermorossiStatusResponse`
- CopyableIp is used on `/network` page — rendered inside Fritz!Box WAN status section

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 113-known-issues-fix*
*Context gathered: 2026-03-22*
