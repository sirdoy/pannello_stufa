# Phase 104: Fix Command Body Key Mismatch - Research

**Researched:** 2026-03-20
**Domain:** Next.js API routes, React hook body serialization, proxy command conventions
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-03 | POST /settings/power via proxy — sends { value: N }, handles 202 Accepted | Route already reads `body['value']` correctly. Only `useStoveCommands` sends the wrong key (`level`). Fix is a one-line change in `handlePowerChange`. |
| CMD-04 | POST /settings/fan-level via proxy — sends { value: N }, handles 202 Accepted | Same as CMD-03 — route correct, hook body wrong. One-line fix in `handleFanChange`. |
| UI-03 | useStoveCommands handles 202 Accepted response pattern from proxy | 202 handling already works for ignite/shutdown. Only fan/power are broken due to body key mismatch. Fixing the key also closes this requirement. |
</phase_requirements>

## Summary

Phase 104 is a precision bug fix. The audit identified BROKEN-02: `useStoveCommands` sends `{ level, source: 'manual' }` for both `handleFanChange` and `handlePowerChange`, but the corresponding Next.js routes (`/api/stove/setFan/route.ts`, `/api/stove/setPower/route.ts`) extract `body['value']`, not `body['level']`. The numeric value reaches the route as `undefined`, which is then forwarded to the proxy — causing silent failure.

The fix requires changing two lines in `useStoveCommands.ts` (lines 152 and 178): replace `{ level, source: 'manual' }` with `{ value: level, source: 'manual' }`. The routes are correct and do not need changes. The proxy convention is `{ value: N }` consistently for all settings endpoints (confirmed by `setWaterTemperature` route which already uses the same `body['value']` pattern and is not broken).

The second part of this phase is fixing the existing unit tests for `useStoveCommands`. Tests for `handleFanChange` and `handlePowerChange` (lines 283-289 and 354-360) currently assert that `body: JSON.stringify({ level: 4, source: 'manual' })` is sent — this assertion encodes the bug. These tests must be updated to assert `{ value: 4, source: 'manual' }` and `{ value: 3, source: 'manual' }` respectively.

**Primary recommendation:** Change body key from `level` to `value` in two handler calls inside `useStoveCommands.ts`, and update the two corresponding test assertions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Jest + @testing-library/react-hooks | (project existing) | Unit test for hook body shape | Already in use for all hook tests in this codebase |

No new libraries needed. This is a one-file source fix plus one-file test update.

### Installation
No new packages required.

## Architecture Patterns

### Proxy Body Convention
The project convention (confirmed by audit STATE.md decision entry `[Phase 103-02]: POST body uses { value: N } for settings`) is:
- Settings endpoints (power, fan, water temperature): `{ value: N }`
- Command endpoints (ignite, shutdown): `{}` (empty object)

`setWaterTemperature` route and thermorossiProxy.ts both follow this — they are the correct reference.

### Correct Handler Pattern (after fix)
```typescript
// useStoveCommands.ts — handleFanChange (corrected)
body: JSON.stringify({ value: level, source: 'manual' }),

// useStoveCommands.ts — handlePowerChange (corrected)
body: JSON.stringify({ value: level, source: 'manual' }),
```

The `source: 'manual'` key is a UI-side annotation; it is not consumed by the route handler (only `value` is extracted). Keeping it does not break anything.

### Route Extraction Pattern (already correct, no changes)
```typescript
// app/api/stove/setFan/route.ts and app/api/stove/setPower/route.ts
const body = await parseJsonOrThrow(request);
const value = body['value'] as number;   // expects 'value', receives undefined today
```

### Test Assertion Pattern
Existing tests in `useStoveCommands.test.ts` use `expect.objectContaining` with `body: JSON.stringify(...)`. The two assertions that encode the bug are:

```typescript
// Line 283-289 — BROKEN assertion, must change to { value: 4, source: 'manual' }
body: JSON.stringify({ level: 4, source: 'manual' }),

// Line 354-360 — BROKEN assertion, must change to { value: 3, source: 'manual' }
body: JSON.stringify({ level: 3, source: 'manual' }),
```

Corrected assertions:
```typescript
body: JSON.stringify({ value: 4, source: 'manual' }),   // handleFanChange
body: JSON.stringify({ value: 3, source: 'manual' }),   // handlePowerChange
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Body serialization | Custom serializer | `JSON.stringify({ value: level })` | Already in use — just fix the key name |
| Route-level tests | New route test file | Fix hook test assertions | Routes need no changes; hook tests already exist and are the right layer to cover body shape |

## Common Pitfalls

### Pitfall 1: Removing `source: 'manual'` during the fix
**What goes wrong:** Accidentally omitting the `source: 'manual'` key while renaming `level` to `value`.
**How to avoid:** The fix is `{ value: level, source: 'manual' }` — not `{ value: level }`. Keep `source` even though the route doesn't currently use it (it's harmless extra metadata and removing it could break future logging expectations).

### Pitfall 2: Updating tests to assert `level` still passes (false negative)
**What goes wrong:** Tests check `body: JSON.stringify({ level: 4, source: 'manual' })` — if you only fix the hook and not the test, the test will now fail, which is correct and expected. The test failure confirms the fix.
**How to avoid:** Update BOTH the hook and the test in the same plan. The test should fail RED before the hook fix and go GREEN after.

### Pitfall 3: Changing the route instead of the hook
**What goes wrong:** "Fixing" the route to read `body['level']` instead of fixing the hook.
**Why it's wrong:** The route convention `{ value: N }` is the project standard (STATE.md Phase 103-02 decision), matches the proxy expectation, and matches `setWaterTemperature`. The scheduler also calls `setPower` and `setFan` through `thermorossiProxy.ts` which passes `{ value }` correctly. Changing the route would break scheduler calls.

### Pitfall 4: Missing the analytics block in setPower
**What goes wrong:** Overlooking that `setPower/route.ts` has an analytics fire-and-forget block that uses `value` to log `powerLevel: value`. If `value` remains undefined, analytics events silently log `powerLevel: undefined`.
**How to avoid:** The fix to the hook body key also fixes this side effect — nothing extra needed in the route.

## Code Examples

### File: `app/components/devices/stove/hooks/useStoveCommands.ts`

Lines to change (lines 152 and 178):

```typescript
// BEFORE (broken) — line 152
body: JSON.stringify({ level, source: 'manual' }),

// AFTER (fixed) — line 152
body: JSON.stringify({ value: level, source: 'manual' }),

// BEFORE (broken) — line 178
body: JSON.stringify({ level, source: 'manual' }),

// AFTER (fixed) — line 178
body: JSON.stringify({ value: level, source: 'manual' }),
```

### File: `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts`

Test assertions to update (lines ~288 and ~358):

```typescript
// BEFORE (encodes bug) — handleFanChange test
body: JSON.stringify({ level: 4, source: 'manual' }),

// AFTER (encodes correct behavior)
body: JSON.stringify({ value: 4, source: 'manual' }),

// BEFORE (encodes bug) — handlePowerChange test
body: JSON.stringify({ level: 3, source: 'manual' }),

// AFTER (encodes correct behavior)
body: JSON.stringify({ value: 3, source: 'manual' }),
```

## State of the Art

| Layer | Current (broken) | After fix | Notes |
|-------|-----------------|-----------|-------|
| `useStoveCommands.ts` | `{ level, source }` | `{ value: level, source }` | Two lines changed |
| `setFan/route.ts` | reads `body['value']` → undefined | reads `body['value']` → correct number | No changes needed |
| `setPower/route.ts` | reads `body['value']` → undefined | reads `body['value']` → correct number | No changes needed |
| `useStoveCommands.test.ts` | asserts `level` key | asserts `value` key | Two assertion strings updated |

## Open Questions

None — the bug location, root cause, fix, and test impact are all fully known from the audit and source inspection.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project standard) |
| Config file | jest.config.js (root) |
| Quick run command | `npm test -- --testPathPattern="useStoveCommands" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-03 | `handlePowerChange` sends `{ value: N }` body | unit | `npm test -- --testPathPattern="useStoveCommands" --no-coverage` | Yes (needs assertion fix) |
| CMD-04 | `handleFanChange` sends `{ value: N }` body | unit | `npm test -- --testPathPattern="useStoveCommands" --no-coverage` | Yes (needs assertion fix) |
| UI-03 | 202 Accepted handled correctly for fan/power paths | unit | `npm test -- --testPathPattern="useStoveCommands" --no-coverage` | Yes (202 tests already exist) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="useStoveCommands" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The test file exists; only two assertion strings need updating within it.

## Sources

### Primary (HIGH confidence)
- Direct source read: `app/components/devices/stove/hooks/useStoveCommands.ts` — lines 152, 178 confirmed sending `{ level }`
- Direct source read: `app/api/stove/setFan/route.ts` — line 16 confirmed reading `body['value']`
- Direct source read: `app/api/stove/setPower/route.ts` — line 17 confirmed reading `body['value']`
- Direct source read: `lib/thermorossiProxy.ts` — `setFan(value)` and `setPower(value)` pass `{ value }` correctly
- Direct source read: `.planning/v13.0-MILESTONE-AUDIT.md` — BROKEN-02 description with exact line numbers
- Direct source read: `.planning/STATE.md` — Phase 103-02 decision: "POST body uses { value: N } for settings"
- Direct source read: `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts` — lines 283-289 and 354-360 encode the bug

### Secondary (MEDIUM confidence)
- Cross-reference: `setWaterTemperature/route.ts` uses same `body['value']` pattern and is not broken — confirms convention

## Metadata

**Confidence breakdown:**
- Bug location: HIGH — exact file and line numbers confirmed by source read
- Fix: HIGH — one-line rename matches established project convention
- Test changes: HIGH — two test assertions identified with exact expected values
- Scope: HIGH — no other files affected (routes unchanged, thermorossiProxy unchanged, scheduler unaffected)

**Research date:** 2026-03-20
**Valid until:** Until source files change (stable — no external dependencies)
