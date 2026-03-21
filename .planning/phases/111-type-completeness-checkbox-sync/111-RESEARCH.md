# Phase 111: Type Completeness & Checkbox Sync - Research

**Researched:** 2026-03-21
**Domain:** TypeScript type definition completeness — `HueLightStateRequest` in `types/hueProxy.ts`
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMD-01 | PUT /lights/{light_id}/state via proxy (202 Accepted, v1 body format) | `xy` is a valid v1 body field for CIE chromaticity color — type definition is incomplete without it |
| UI-02 | useLightsCommands sends v1 body format (on/bri/ct instead of nested objects) | `lights/page.tsx` sends `{ xy: [preset.xy.x, preset.xy.y] }` for color presets — must be covered by the type |
| READ-03 | GET /groups migrated with member lights array | Already `[x]` in REQUIREMENTS.md; traceability already shows Complete — verify no change needed |
| CMD-03 | POST /groups/{group_id}/scenes/{scene_id} via proxy (202 Accepted) | Already `[x]` in REQUIREMENTS.md; traceability already shows Complete — verify no change needed |
| UI-04 | Scene activate uses new path pattern (POST /groups/{gid}/scenes/{sid}) | Already `[x]` in REQUIREMENTS.md; traceability already shows Complete — verify no change needed |
</phase_requirements>

---

## Summary

Phase 111 closes INT-XY from the v14.0 milestone audit. The audit found that `HueLightStateRequest` in `types/hueProxy.ts` does not include an `xy` field, but `app/lights/page.tsx` sends `{ xy: [preset.xy.x, preset.xy.y] }` when the user selects a color preset. The route currently casts the body to `Record<string, unknown>`, so runtime is not blocked — but the TypeScript type is incomplete and `xy` will appear as a type error if any code attempts to use it through the typed interface.

The fix is a single-line addition: `xy?: [number, number]` to the `HueLightStateRequest` interface. No runtime behavior changes. No test changes are required since the type is structural only and the route uses `Record<string, unknown>` at its boundary.

The audit also recorded three checkbox discrepancies (READ-03, CMD-03, UI-04 showing `[ ]` instead of `[x]`). However, inspecting the current REQUIREMENTS.md confirms these are **already corrected** — all three show `[x]` and the traceability table already reads `Complete` for all 27 requirements, with coverage 27/27 noted in the last-updated line (2026-03-21). The checkbox sync work is already done; Phase 111 only needs to address the type gap.

**Primary recommendation:** Add `xy?: [number, number]` to `HueLightStateRequest` in `types/hueProxy.ts`. Verify REQUIREMENTS.md and traceability are already correct (they are). Phase is a single-task execution.

## Current State Verification

### What the audit says needs fixing

| Item | Audit Finding | Current State |
|------|--------------|---------------|
| `HueLightStateRequest.xy` | Missing from type definition | **Still missing** — confirmed by grep: `types/hueProxy.ts` has no `xy` field in the interface |
| READ-03 checkbox | `[ ]` → should be `[x]` | **Already `[x]`** — REQUIREMENTS.md updated 2026-03-21 |
| CMD-03 checkbox | `[ ]` → should be `[x]` | **Already `[x]`** — REQUIREMENTS.md updated 2026-03-21 |
| UI-04 checkbox | `[ ]` → should be `[x]` | **Already `[x]`** — REQUIREMENTS.md updated 2026-03-21 |
| Traceability 27/27 | All statuses to Complete | **Already done** — "27 total, Satisfied: 27, Pending: 0" |

### The one remaining gap

`types/hueProxy.ts` lines 192–200: `HueLightStateRequest` defines `on, bri, ct, hue, sat, effect, alert` — **no `xy` field**.

`app/lights/page.tsx` line 60: `body: JSON.stringify({ xy: [preset.xy.x, preset.xy.y] })` — sends `xy` as a tuple.

Hue CLIP v1 format: `xy` is a 2-element array `[x, y]` where `x` and `y` are floating-point numbers in range `[0, 1]`. TypeScript tuple type: `[number, number]`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.x (project tsconfig) | Type definitions | Project-wide strict TypeScript |

No additional libraries needed. This is a type-only change.

## Architecture Patterns

### Pattern: Hue Proxy Type Convention

All request/response types for the Hue proxy live in `types/hueProxy.ts`. The file follows JSDoc sourcing:

```typescript
/**
 * Request body for PUT /lights/{id}/state and PUT /groups/{id}/action.
 * Uses v1 flat format — NOT CLIP v2 nested objects.
 * Source: docs/api/hue.md — HueLightStateRequest
 */
export interface HueLightStateRequest {
  on?: boolean;
  bri?: number;    // 0-254
  ct?: number;     // 153-500 mirek
  hue?: number;    // 0-65535
  sat?: number;    // 0-254
  effect?: 'none' | 'colorloop';
  alert?: 'none' | 'select' | 'lselect';
  // ADD: xy?: [number, number]  // CIE xy chromaticity, each in [0, 1]
}
```

The `HueCommandResponse` type references `Partial<HueLightStateRequest>` as its `requested_state` field. Once `xy` is added to the interface, `requested_state` will also reflect it automatically — no secondary changes needed.

### Pattern: No Test Required for Interface Field Addition

The project's existing test for proxy types (`hueProxy.test.ts`) validates runtime behaviour of the proxy client functions — not the structural shape of request interfaces. Adding an optional field to `HueLightStateRequest` does not break any existing test. No new test is needed for an interface field addition; the TypeScript compiler enforces the contract.

### Anti-Patterns to Avoid

- **Changing `xy` to a non-tuple type:** Philips Hue v1 API expects a 2-element array. Do not use `number[]` (too broad) or `{ x: number; y: number }` (wrong wire format). Use `[number, number]`.
- **Adding a JSDoc comment with wrong range:** CIE xy values are `[0, 1]`, not `[0, 254]`. Comment must say `// CIE xy chromaticity, each value in [0, 1]`.
- **Modifying `HueCommandResponse.requested_state`:** It already uses `Partial<HueLightStateRequest>`, so it automatically includes `xy` once the interface is updated. No secondary edit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validating xy range at runtime | Custom range check | TypeScript type + proxy handles validation | Proxy is server-side; client type is sufficient |

## Common Pitfalls

### Pitfall 1: Assuming REQUIREMENTS.md Needs Checkbox Updates

**What goes wrong:** Plan includes tasks to update READ-03/CMD-03/UI-04 checkboxes, but the file was already updated on 2026-03-21.
**Why it happens:** The audit was written before the checkbox sync was applied.
**How to avoid:** Read the current REQUIREMENTS.md before planning. All checkboxes already show `[x]`; the traceability table already shows all 27 as Complete.
**Warning signs:** If a plan task says "change `[ ]` to `[x]`" — verify the file first.

### Pitfall 2: Using number[] Instead of [number, number]

**What goes wrong:** `xy?: number[]` compiles but allows arrays of any length, defeating the type contract.
**Why it happens:** `number[]` is simpler to write.
**How to avoid:** Use the TypeScript tuple type `[number, number]` which enforces exactly two elements.

### Pitfall 3: Missing JSDoc Comment

**What goes wrong:** `xy` added without a comment, leaving its range and units undocumented.
**Why it happens:** Quick edits skip documentation.
**How to avoid:** Follow the existing inline comment pattern (`// 0-254`, `// 153-500 mirek`) and add `// CIE xy chromaticity, each value in [0, 1]`.

## Code Examples

### The Exact Edit Required

```typescript
// Source: types/hueProxy.ts — HueLightStateRequest interface
export interface HueLightStateRequest {
  on?: boolean;
  bri?: number;                       // 0-254
  ct?: number;                        // 153-500 mirek
  hue?: number;                       // 0-65535
  sat?: number;                       // 0-254
  xy?: [number, number];              // CIE xy chromaticity, each value in [0, 1]
  effect?: 'none' | 'colorloop';
  alert?: 'none' | 'select' | 'lselect';
}
```

`xy` should be inserted after `sat` and before `effect`, keeping chromaticity-related fields grouped: `ct` (color temperature), `hue`, `sat`, `xy` (all color fields), then `effect` and `alert`.

### Caller Context (lights/page.tsx line 60)

```typescript
// Existing code in app/lights/page.tsx — no change needed
body: JSON.stringify({ xy: [preset.xy.x, preset.xy.y] }),
```

After the type fix, this code will be type-safe when the body is typed as `HueLightStateRequest`.

## Validation Architecture

nyquist_validation is enabled (config.json). Phase 111 is a documentation/type-only phase.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern=hueProxy` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01 | `xy` field accepted by `HueLightStateRequest` type | TypeScript compile | `npx tsc --noEmit` | N/A (compile check) |
| UI-02 | `lights/page.tsx` color preset body is type-safe | TypeScript compile | `npx tsc --noEmit` | N/A (compile check) |
| READ-03 | Checkbox verification | Manual inspect | `grep "READ-03" .planning/REQUIREMENTS.md` | N/A |
| CMD-03 | Checkbox verification | Manual inspect | `grep "CMD-03" .planning/REQUIREMENTS.md` | N/A |
| UI-04 | Checkbox verification | Manual inspect | `grep "UI-04" .planning/REQUIREMENTS.md` | N/A |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (verify no type errors introduced)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + `tsc --noEmit` clean before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. No new test files needed. The change is a single interface field addition; TypeScript compiler enforces correctness.

## Open Questions

1. **Is REQUIREMENTS.md truly already synced?**
   - What we know: Current file read confirms all checkboxes are `[x]` and traceability shows 27/27 Complete with last-updated 2026-03-21.
   - What's unclear: Nothing — the file is confirmed current.
   - Recommendation: Plan should include a verification step but no edit task for checkboxes.

2. **Does the proxy actually accept `xy` in v1 format at runtime?**
   - What we know: The audit flags this as a `PARTIAL` flow with "xy field may be silently ignored or rejected by proxy." The type fix closes the TypeScript gap; runtime behavior depends on the proxy server.
   - What's unclear: Whether the proxy server's v1 handler forwards `xy` to the Hue Bridge.
   - Recommendation: This is out of scope for Phase 111 (which is a type gap, not a proxy gap). Document as a known open item in VERIFICATION.md.

## Sources

### Primary (HIGH confidence)

- Direct file inspection: `types/hueProxy.ts` (lines 192–200) — confirmed `xy` is absent from `HueLightStateRequest`
- Direct file inspection: `app/lights/page.tsx` (line 60) — confirmed `xy` tuple is sent at runtime
- Direct file inspection: `.planning/REQUIREMENTS.md` — confirmed all checkboxes already `[x]`, coverage 27/27
- `.planning/v14.0-MILESTONE-AUDIT.md` — source of INT-XY gap description and checkbox_updates list

### Secondary (MEDIUM confidence)

- Philips Hue CLIP v1 API: `xy` is a `[float, float]` 2-element array (CIE chromaticity coordinates). Consistent with `HueColorMode = 'ct' | 'hs' | 'xy'` already defined in the same file (line 37).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — TypeScript interface, no external libraries
- Architecture: HIGH — follows existing type patterns in same file
- Pitfalls: HIGH — observed directly from audit and current file state

**Research date:** 2026-03-21
**Valid until:** N/A — type definition change, no external dependency staleness concern
