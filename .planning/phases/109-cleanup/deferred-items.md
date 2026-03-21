# Deferred Items - Phase 109

## Pre-existing Test Failures (out of scope)

### colorUtils.test.ts — 4 failing supportsColor tests

**File:** `lib/hue/__tests__/colorUtils.test.ts`
**Discovered during:** Task 2 (full test suite run)
**Status:** Pre-existing before phase 109-01 — NOT caused by current changes

**Cause:** `colorUtils.ts` was updated in phase 108-01 (commit `6eb7f87`) to use proxy-native fields:
```ts
export function supportsColor(light: HueLight): boolean {
  return light.capability_tier === 'color';
}
```

But the tests still test the old CLIP v2 behavior using `color.xy` and `color.gamut` properties.

**Failing tests:**
- `supportsColor › should return true for light with color.xy property`
- `supportsColor › should return true for light with color.gamut property`
- `supportsColor › should return false for null light`
- `supportsColor › should return false for undefined light`

**Resolution:** Update `colorUtils.test.ts` to test the proxy-native `capability_tier` field behavior instead of CLIP v2 `color.xy`/`color.gamut`.

---

### useDeviceStaleness.test.ts — pre-existing failure

**Status:** Pre-existing before phase 109-01 — NOT caused by current changes
**Note:** Investigate separately if needed.
