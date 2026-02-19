# Phase 71: React Compiler - Research

**Researched:** 2026-02-18
**Domain:** React Compiler (build-time auto-memoization), Next.js 16 integration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | User benefits from auto-memoization replacing manual useMemo/useCallback | Compiler eliminates manual memoization overhead; 277 useMemo/useCallback calls across 80 files become compiler-managed |
| COMP-02 | User sees no regressions in existing functionality after compiler enablement | Incremental adoption strategy (healthcheck → annotation mode → full enable) with "use no memo" opt-outs for non-compliant files |
| COMP-03 | User benefits from compiler healthcheck validating Rules of React compliance | `npx react-compiler-healthcheck@latest` identifies non-compilable components before enablement |
</phase_requirements>

---

## Summary

React Compiler 1.0 is a stable, build-time optimizer that automatically memoizes React components and hooks without code changes. It replaces manual `useMemo`/`useCallback` with compiler-inferred memoization that is often more precise — it can memoize code after early returns, something manual memoization cannot do.

The project (Next.js 16 + React 19.2) is in the optimal position: `reactCompiler: true` is a first-class, stable config option in Next.js 16 that requires only installing `babel-plugin-react-compiler` as a dev dependency and adding one line to `next.config.ts`. The project already has `reactStrictMode: true` which the healthcheck tool looks for as a positive signal. There are 277 useMemo/useCallback calls across 80 files — all candidates for compiler management.

The key risk is Rules of React violations causing runtime regressions, not build failures. The compiler skips non-compliant components silently, which means regressions show up at runtime. The safe rollout strategy is: run healthcheck → review output → enable globally → add `"use no memo"` to any component with observed regressions → clean up later. The recommended plan structure is three plans: healthcheck + risk assessment, compiler enablement + test pass, and manual memoization cleanup (optional, deferred).

**Primary recommendation:** Install `babel-plugin-react-compiler`, add `reactCompiler: true` to `next.config.ts`, run the healthcheck first to identify high-risk files, then enable globally and handle any failing tests with `"use no memo"` opt-outs. The project's existing `reactStrictMode: true` and React 19.2 are strong positive indicators.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `babel-plugin-react-compiler` | `@latest` (1.0.x) | Build-time compiler that auto-memoizes components | Official React team package; stable since Oct 2025 |
| `next.config.ts` `reactCompiler` flag | Built into Next.js 16 | Single config entry point for Next.js projects | Stable in Next.js 16 (promoted from experimental); Next.js uses SWC optimization that only applies compiler to relevant files |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-compiler-healthcheck` | `@latest` | Pre-flight check — reports compilable components, StrictMode, incompatible libraries | Run before enabling compiler; identifies risk files |
| `eslint-plugin-react-hooks@latest` | Latest | Compiler-powered lint rules now ship in this package | Adds `set-state-in-render`, `set-state-in-effect`, `refs` rules |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `reactCompiler: true` (global) | `compilationMode: 'annotation'` | Annotation mode requires adding `"use memo"` to every component — too much boilerplate for a project with 80+ affected files |
| Full global enable | Directory-scoped via `babel.config.js` overrides | Scoped is safer but requires a `babel.config.js` which conflicts with Next.js's SWC-optimized path; not recommended for this project |

**Installation:**
```bash
npm install -D babel-plugin-react-compiler@latest
```

---

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. The compiler is purely a build-time transformation:

```
next.config.ts          ← Add reactCompiler: true here
app/                    ← All components auto-compiled
lib/hooks/              ← All hooks auto-compiled
# Non-compliant files get "use no memo" at function body start
```

### Pattern 1: Enable React Compiler in Next.js 16

**What:** Add `reactCompiler: true` to `next.config.ts`
**When to use:** After running healthcheck and reviewing output

```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,   // ← add this
  // ... rest of config
};
```

> **How Next.js handles it:** Next.js uses a custom SWC optimization that only applies the compiler to files with JSX or React Hooks. It does NOT compile all files — build time impact is minimal compared to using the Babel plugin alone.

### Pattern 2: Opt-Out a Non-Compliant Component

**What:** Add `"use no memo"` as the first statement in a function body to skip compilation for that function
**When to use:** When a specific component or hook causes test failures or runtime regressions after compiler enablement

```typescript
// Source: https://react.dev/reference/react-compiler/directives
export default function ThermostatCard() {
  "use no memo"; // TODO: Remove after fixing Rules of React violation (Phase 71)
  // ... rest of component unchanged
}

// For hooks:
export function useAdaptivePolling(options: UseAdaptivePollingOptions): void {
  "use no memo"; // TODO: Remove after audit
  // ...
}
```

> The directive is function-level. It can also be placed at the module top level to opt out an entire file.

### Pattern 3: Incremental Adoption via Annotation Mode (NOT recommended for this project)

**What:** `compilationMode: 'annotation'` means ONLY functions with `"use memo"` are compiled
**When to use:** When the codebase has many Rules of React violations and you want maximum control

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: {
    compilationMode: 'annotation',
  },
};

// Then opt-in specific functions:
function MyComponent() {
  "use memo"; // Opt this component into compilation
  return <div>...</div>;
}
```

**Why NOT recommended here:** The project has 277 manual memoization calls suggesting generally Rules-compliant code. Starting global and opting out failures is faster than opting in 80+ files individually.

### Pattern 4: Healthcheck Output Interpretation

```bash
# Run before enabling compiler:
npx react-compiler-healthcheck@latest

# Expected output format:
# Successfully compiled X out of Y components.
# StrictMode usage found.            ← Positive signal (this project has reactStrictMode: true)
# Found no usage of incompatible libraries.  ← or: Found incompatible libraries: [list]
```

**Interpreting results:**
- `X out of Y` — Files where `X < Y` are non-compilable; review those files for Rules of React violations
- `StrictMode usage found` — Strong positive signal; project already has this
- `incompatible libraries` — Any listed libraries prevent compilation on files that import them

### Anti-Patterns to Avoid

- **Removing useMemo/useCallback before verifying compiler works:** Do NOT clean up manual memoization in the same plan as enabling the compiler — it changes two things at once, making regression attribution impossible
- **Enabling compiler without running healthcheck first:** The healthcheck identifies files the compiler will skip, which are your highest-risk files for runtime regressions
- **Adding `"use no memo"` everywhere "just in case":** Only add opt-outs when tests fail or regressions are observed; the compiler is safe to run on Rules-compliant code
- **Using annotation mode for this project:** Too much boilerplate; global enable + selective opt-outs is the right pattern here

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-component memoization decisions | Custom babel transforms, manual memo() wrapping | React Compiler | Compiler uses data-flow analysis; it can memoize after early returns — something manual approaches cannot do |
| Identifying Rules of React violations | Manual code review | `react-compiler-healthcheck` + ESLint `eslint-plugin-react-hooks@latest` | Compiler-powered lint rules detect set-state-in-render, set-state-in-effect, unsafe ref access during render |
| Measuring re-render reduction | Custom instrumentation | React DevTools Profiler (Sparkle ✨ badge) | Compiler marks compiled functions with ✨; DevTools highlights fewer re-renders after compilation |

**Key insight:** The compiler's memoization is more precise than manual `useMemo`/`useCallback` because it understands data flow. A manually-wrapped callback requires knowing all dependencies upfront; the compiler infers them from the code itself.

---

## Common Pitfalls

### Pitfall 1: Memoization-for-Correctness Patterns

**What goes wrong:** A component uses `useCallback` to stabilize a function reference that is also a `useEffect` dependency. After compilation, if the compiler changes the memoization granularity, the effect might fire at different times.
**Why it happens:** Manual memoization is sometimes used not just for performance but for semantic correctness (preventing effect re-runs). The compiler optimizes for performance, not semantic equivalence of reference identity.
**How to avoid:** Before removing any manual `useMemo`/`useCallback`, verify the test suite passes with the compiler ON but manual memoization still present. Only remove manual memoization in a follow-up phase after stability is confirmed.
**Warning signs:** Effect-related test failures (effects firing more/fewer times than expected), infinite render loops in tests.

**Specific risk in this project:** `useAdaptivePolling` uses `savedCallback.current = callback` to avoid stale closures — this ref pattern is the standard workaround and is NOT a violation. The `useEffect([callback])` dependency is intentional. This pattern should compile correctly.

### Pitfall 2: Ref Reading During Render

**What goes wrong:** Reading `ref.current` inside the render body (not in an effect or event handler) causes the compiler to flag a violation and skip that component.
**Why it happens:** Refs are mutable and untracked — the compiler cannot guarantee consistency if `ref.current` is read during render.
**How to avoid:** Ensure `ref.current` access is only inside effects or event handlers, never in render-time computation.
**Warning signs:** Healthcheck reports lower `X out of Y` ratio; ESLint `refs` rule flags files.

**Specific risk in this project:** `ThermostatCard` uses `connectionCheckedRef.current` in an effect guard — this is inside `useEffect`, which is correct. Low risk.

### Pitfall 3: Build Time Regression

**What goes wrong:** Enabling the compiler increases dev and build times because Next.js falls back to Babel for compiled files.
**Why it happens:** React Compiler uses Babel; Next.js normally uses SWC (Rust-based, faster). Next.js 16 mitigates this with a custom SWC optimization that only Babel-processes files with JSX/hooks, but some slowdown is expected.
**How to avoid:** Accept the tradeoff consciously. Next.js docs explicitly state: "Expect compile times in development and during builds to be higher when enabling this option."
**Warning signs:** `npm run dev` startup takes noticeably longer; `npm run build` time increases.

### Pitfall 4: Incompatible Libraries

**What goes wrong:** Libraries that mutate React props or use non-standard hook patterns cause the compiler to skip files that import them.
**Why it happens:** The compiler identifies known incompatible libraries (detected via healthcheck).
**How to avoid:** Run healthcheck first. If incompatible libraries are found, affected files may need `"use no memo"` or the library may need to be replaced.
**Warning signs:** Healthcheck output says "Found incompatible libraries."

**Note for this project:** The project uses `firebase/database`, `date-fns`, `recharts` (for charts), Radix UI, and `@serwist/next`. These are generally compiler-safe. Firebase real-time listeners are in effects, not render paths.

### Pitfall 5: Test Failures from Changed Memoization Identity

**What goes wrong:** Tests that assert referential equality of function props (e.g., `expect(rendered.props.onClick).toBe(prevOnClick)`) may fail because the compiler changes when functions are recreated.
**Why it happens:** The compiler may memoize or not memoize functions differently than `useCallback` does manually.
**How to avoid:** Review test assertions for referential equality checks on callbacks. Prefer testing behavior, not identity.
**Warning signs:** Tests with `.toBe()` assertions on function props fail after compiler enablement.

---

## Code Examples

Verified patterns from official sources:

### Enable in next.config.ts

```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
const withSerwist = withSerwistInit({ /* ... */ });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,   // ADD THIS LINE
  // ... rest unchanged
};

export default withAnalyzer(withSerwist(nextConfig));
```

### Opt-Out a Specific Function

```typescript
// Source: https://react.dev/reference/react-compiler/directives
export default function ThermostatCard() {
  "use no memo"; // TODO: Remove after validating Rules of React compliance (Phase 71)
  // ... rest of component unchanged, no other edits needed
}
```

### Run Healthcheck (pre-flight)

```bash
# Source: https://www.npmjs.com/package/react-compiler-healthcheck
npx react-compiler-healthcheck@latest

# Example good output:
# Successfully compiled 438 out of 441 components.
# StrictMode usage found.
# Found no usage of incompatible libraries.

# Files NOT compiled → add "use no memo" to those or fix violations
```

### Verify Compilation in React DevTools

After enabling, open React DevTools Profiler:
- Compiled functions show ✨ (sparkle) badge
- Profile before/after to compare re-render counts on polling ticks

### ESLint Plugin Update (adds compiler-powered rules)

```bash
# Source: https://react.dev/learn/react-compiler/installation
npm install -D eslint-plugin-react-hooks@latest
```

Then in `eslint.config.ts`, the `eslint-config-next` package (already present) pulls in `eslint-plugin-react-hooks` automatically. Verify it's the latest version post-install.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `useMemo` / `useCallback` | React Compiler auto-memoization | React Compiler 1.0 (Oct 2025) | Manual memoization becomes optional/legacy |
| `experimental.reactCompiler` in Next.js 15 | `reactCompiler: true` (stable) in Next.js 16 | Next.js 16 (Nov 2025) | No longer experimental; safe for production |
| Separate `eslint-plugin-react-compiler` package | Rules merged into `eslint-plugin-react-hooks@latest` | React Compiler 1.0 | One fewer package; same lint rules |
| Babel-only compilation (slow) | Next.js SWC optimization (only Babel on JSX/hook files) | Next.js 16 | Reduced build time impact vs. pure Babel |

**Deprecated/outdated:**
- `experimental.reactCompiler` in `next.config.ts`: Replaced by stable `reactCompiler` top-level option in Next.js 16
- `eslint-plugin-react-compiler` (separate package): Merged into `eslint-plugin-react-hooks@latest`

---

## Project-Specific Risk Assessment

### Files to Pre-Audit (run healthcheck first, but these are highest-probability)

| File | Reason for Risk | Expected Outcome |
|------|----------------|-----------------|
| `app/components/devices/thermostat/ThermostatCard.tsx` | Phase description flags it; large component with many hooks | Likely compilable — hooks are at top level, refs used in effects only |
| `lib/hooks/useAdaptivePolling.ts` | Orchestrator hook with ref pattern for stale closure avoidance | Likely compilable — `savedCallback.current = callback` inside useEffect is correct |
| `app/components/devices/stove/hooks/useStoveData.ts` | 4 useCallback calls; Firebase listeners; orchestrator hook | Likely compilable — Firebase listeners are in effects |
| `app/components/devices/network/hooks/useNetworkData.ts` | Mixed useMemo + useCallback; `useMemo(() => wan?.connected ?? false)` | Likely compilable — straightforward derivations |
| `app/network/components/DeviceListTable.tsx` | 6 useMemo calls including `ColumnDef` array | Likely compilable — all useMemo have proper dependency arrays |

### Memoization Scale

- **80 files** with useMemo/useCallback
- **277 total occurrences** (121 in `app/components/`, 0 in `lib/hooks/`, others in `app/network/` etc.)
- After compiler: all these become candidates for removal in a follow-up phase (NOT this phase)

---

## Open Questions

1. **Which specific files will healthcheck flag?**
   - What we know: Healthcheck reports `X out of Y compiled`; non-compiled files are the risk set
   - What's unclear: Exact files without running the tool
   - Recommendation: COMP-03 requires running `npx react-compiler-healthcheck@latest` as the first plan task; document the output and add `"use no memo"` only to flagged files

2. **Will any of the 3,700+ tests fail due to referential equality assertions?**
   - What we know: Jest tests exist; some may assert `toHaveBeenCalledWith` on callbacks
   - What's unclear: How many tests rely on function identity rather than behavior
   - Recommendation: Run full test suite after enabling (`npm test`) and add `"use no memo"` to files with failing tests; the compiler is designed to not break tests

3. **Does the Serwist (`@serwist/next`) wrapper in `next.config.ts` interact with `reactCompiler`?**
   - What we know: Next.js applies `reactCompiler` before the Serwist plugin wraps the config
   - What's unclear: Any edge cases in the plugin chain
   - Recommendation: LOW risk; config wrapping is standard Next.js plugin pattern; test with `npm run dev` after enabling

---

## Sources

### Primary (HIGH confidence)
- `https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler` — Configuration options, installation, annotation mode
- `https://nextjs.org/docs/app/guides/upgrading/version-16` — React Compiler stable promotion in Next.js 16, Turbopack changes
- `https://react.dev/reference/react-compiler/directives` — "use memo" and "use no memo" directives, function-level vs module-level
- `https://react.dev/learn/react-compiler/installation` — ESLint plugin, babel-plugin-react-compiler setup
- `https://react.dev/learn/react-compiler/incremental-adoption` — Three strategies, annotation mode, "use no memo" for failures
- `https://react.dev/learn/react-compiler/debugging` — Rules of React violation types, debugging workflow
- `https://react.dev/blog/2025/10/07/react-compiler-1` — 1.0 release notes, performance data, what changed from beta

### Secondary (MEDIUM confidence)
- `https://www.npmjs.com/package/react-compiler-healthcheck` — Healthcheck tool usage and output format (403 on fetch; verified via WebSearch cross-reference with multiple sources)
- WebSearch results confirming healthcheck output format (`Successfully compiled X out of Y components. StrictMode usage found.`)

### Tertiary (LOW confidence)
- Medium article on React Compiler in Next.js 16 — Not directly verified but consistent with official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Verified directly from Next.js 16 official docs and React team blog
- Architecture patterns: HIGH — `"use no memo"` and `reactCompiler: true` verified from official React docs and Next.js docs
- Pitfalls: MEDIUM-HIGH — Rules of React violations verified from official React docs; project-specific file risk is inferred (no healthcheck run yet)
- Healthcheck output format: MEDIUM — Verified via multiple WebSearch sources; 403 on npm page prevented direct verification

**Research date:** 2026-02-18
**Valid until:** 2026-04-18 (stable API, 60-day validity; React Compiler 1.0 is production-stable)
