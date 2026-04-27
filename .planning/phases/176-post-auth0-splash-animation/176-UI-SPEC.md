---
phase: 176
slug: post-auth0-splash-animation
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-27
---

# Phase 176 — UI Design Contract

> Visual + interaction contract for the **Post-Auth0 Splash Animation** (SPLASH-01..SPLASH-05). Auto-resolved from CONTEXT.md (D-01..D-29), RESEARCH.md, the design bundle (`.planning/inbox/ember-glass-design/project/components/splash.jsx` and `cards.jsx::FlameViz`), and the sibling Phase 174 + 175 UI-SPECs. Verified by gsd-ui-checker downstream.

**Scope reminder (per CONTEXT.md `<domain>`):** Phase 176 ships ONLY (a) `app/components/EmberGlass/Splash.tsx` (presentational overlay), (b) `app/components/EmberGlass/SplashGate.tsx` (orchestrator: `useUser()` + sessionStorage + reduced-motion), (c) `app/components/EmberGlass/FlameViz.tsx` (presentational primitive ported from bundle `cards.jsx:109-129`), (d) barrel re-export update at `app/components/EmberGlass/index.ts`, (e) one-line wiring inside `app/components/ClientProviders.tsx`, (f) two missing CSS keyframes appended to `app/globals.css` (`pulse`, `flamePulse`), (g) optional `lib/hooks/useReducedMotion.ts` extraction, (h) Jest unit specs (3 files) + Playwright smoke (`tests/smoke/splash.spec.ts` — 5 specs). StoveCard adoption of `<FlameViz>` is Phase 177; legacy Apple PWA static splash images are out of scope; `app/loading.tsx` Suspense skeleton is preserved.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind v4 + inline styles for `EmberGlass/` v2 primitives — established by Phases 174/175) |
| Preset | not applicable |
| Component library | `@auth0/nextjs-auth0 ^4.13.1` (consumed via `useUser()` client hook — already wired by `Auth0Provider` in `ClientProviders.tsx`); React 19 (`useState`/`useEffect`/`useRef`); Next.js 15.5 App Router. **No** Radix usage in this phase (splash is non-interactive — no `<Pressable>`, no `<Sheet>`). |
| Icon library | none — splash renders no icons. The flame visualization is pure CSS via `<FlameViz>`. |
| Display font | `var(--font-display)` → Outfit (consumed; declared by Phase 174) — used for the "Home" wordmark at 28px / 600 |
| Body font | `var(--font-body)` → Inter (consumed; declared by Phase 174) — used for caption + badge at 11–12px |
| Color space | OKLCH for `--accent` (consumed via `color-mix(in oklab, var(--accent) 40%, transparent)` for the ambient glow); literal hex/rgba for the bundle's hard-coded splash background gradient and the green status dot (documented as AUDIT-EXCEPTION below) |
| Styling approach | **Inline `style={...}` objects (NOT Tailwind classes)** — matches Phase 174 `AmbientBg.tsx`, Phase 175 `Sheet.tsx`. Tokens consumed via `var(--token)` inside inline style. The splash bundle uses inline transitions + transform values that drive the timing-critical phase state machine; lifting them verbatim is mandatory. |

**Detected existing UI:**

- `app/globals.css` line 814 — `@keyframes pulse-ember` exists (Phase 174-era). **Neither `@keyframes pulse` nor `@keyframes flamePulse` exists** (verified via grep 2026-04-27). **Phase 176 MUST add both** at the end of `globals.css` (or after the existing `pulse-ember` block) — the bundle assumes they are present (`splash.jsx:85` references `pulse 1.6s infinite`; `cards.jsx:120, 126` reference `flamePulse 1.8s ease-in-out infinite` and `flamePulse 1.4s ease-in-out infinite alternate`).
- `app/components/EmberGlass/AmbientBg.tsx` — sibling Phase 174 primitive; same `'use client'` boundary, same inline-style approach. **Phase 176 follows this convention exactly.** AmbientBg keeps running underneath the splash at `z-index: 0` (no toggling).
- `app/components/EmberGlass/Pressable.tsx` / `Sheet.tsx` — Phase 175 primitives. **NOT consumed** by Phase 176 (splash is non-interactive overlay).
- `app/components/EmberGlass/index.ts` — Phase 175 barrel; Phase 176 adds three exports (`Splash`, `SplashGate`, `FlameViz`) + their prop types (`SplashProps`, `SplashGateProps`, `FlameVizProps`).
- `app/components/ClientProviders.tsx` (lines 28-71) — `Auth0Provider` already wraps the tree; `MOCK_USER` fallback under `NEXT_PUBLIC_BYPASS_AUTH=true` (lines 28-36) lets splash play normally in dev. **Single edit:** wrap `{children}` with `<SplashGate>` after `<OfflineBanner>` and before `<InstallPrompt>` (D-04).
- `app/layout.tsx` — Server Component (stays untouched). `<AmbientBg>` already mounted at line 60.
- `app/loading.tsx` — Existing dashboard Suspense skeleton; **kept as-is**, renders behind the splash during the 0–2.1s window if data isn't ready.
- `app/page.tsx` — Existing dashboard route; `<Suspense fallback={<DashboardSkeleton/>}>` keeps working under the splash overlay.

---

## Spacing Scale

Declared values (all multiples of 4):

| Token | Value | Usage in Phase 176 |
|-------|-------|---------------------|
| xs | 4px | (none in splash; reserved by phase budget) |
| sm | 8px | Caption-to-badge inner letter-spacing scale (decimal letterSpacing values; not a layout offset) |
| md | 16px | (none in splash) |
| lg | 24px | (none in splash) |
| xl | 32px | (none in splash) |
| 2xl | 48px | (none in splash) |

**Splash-specific layout offsets (lifted verbatim from bundle `splash.jsx`):**

| Offset | Value | Bundle line | Usage |
|--------|-------|-------------|-------|
| Wordmark gap above caption | `marginTop: 26` | `splash.jsx:52` | Distance from flame logo bottom to wordmark "Home" |
| Caption gap below wordmark | `marginTop: 6` | `splash.jsx:66` | Distance from wordmark to caption "Connessione al gateway…" |
| Badge bottom inset | `bottom: 40` | `splash.jsx:77` | Absolute distance of "Autenticato · Auth0" badge from viewport bottom |
| Badge gap (icon ↔ label) | `gap: 6` | `splash.jsx:80` | Gap between green pulsing dot and the badge label text |
| Flame logo box | `width: 88, height: 96` | `splash.jsx:42` | Splash flame container (FlameViz renders 64×80 inside) |
| Ambient glow box | `width: 400, height: 400` | `splash.jsx:32` | Background radial-gradient blob behind the flame |

**Exceptions from 4-multiple invariant:**
- `marginTop: 26` (wordmark above caption) — **NOT a 4-multiple**. Lifted verbatim from `splash.jsx:52`. Bundle fidelity wins; documented as a splash-specific motion-tuned offset (the 26px gap aligns the wordmark optical center to the flame's perceived gravity line). **Locked.**
- `marginTop: 6` (caption below wordmark) — also non-4-multiple, also lifted verbatim from `splash.jsx:66`. **Locked.**
- `gap: 6` (badge dot↔label) — also non-4-multiple, lifted verbatim from `splash.jsx:80`. **Locked.**
- `bottom: 40` (badge from viewport bottom) — **IS** a 4-multiple (40 = 4×10). No exception.
- `letterSpacing: -0.8` (wordmark) and `letterSpacing: 0.3` (caption) and `letterSpacing` 1.2px style on potential UI extensions — typographic tuning, not layout spacing.

**Audit gate (DS-02 inheritance from Phase 174):** Phase 176 source files MAY contain the three documented exceptions above (each tagged with `// AUDIT-EXCEPTION` inline comment citing `splash.jsx:line`). All other spacing values in the new files MUST be 4-multiples or token references.

---

## Typography

Declared roles for Phase 176 surfaces (`<Splash>` overlay only — `<FlameViz>` renders no text; `<SplashGate>` renders no text). Sizes lifted verbatim from `splash.jsx:54, 67, 78`.

| Role | Size | Weight | Line Height | Family | Used By |
|------|------|--------|-------------|--------|---------|
| Wordmark display | 28px | 600 | 1.2 (default; not overridden) | `var(--font-display)` (Outfit) | "Home" wordmark in splash phase 1+. Letter-spacing `-0.8px` (lifted verbatim). Color `#fff` (AUDIT-EXCEPTION — bundle hardcodes pure white inside the dense splash background for max contrast against the radial-gradient `#1c1917→#0a0908` base). |
| Caption | 12px | 500 | 1.4 (default) | `var(--font-body)` (Inter) | "Connessione al gateway…" subtitle below wordmark. Letter-spacing `0.3px`. Color `var(--text-2)`. |
| Badge | 11px | 400 (default; bundle does not override) | 1.4 (default) | `var(--font-body)` (Inter) | "Autenticato · Auth0" badge at `bottom: 40px`. Color `var(--text-2)`. Opacity `0.7` once visible (phase 1+). |

**Weights:** exactly 2 — `400` regular (badge — bundle default) + `500/600` semibold (caption uses 500 per `splash.jsx:67`; wordmark uses 600 per `splash.jsx:54`).

**Phase-176-specific exception to the strict "exactly 2 weights" budget:** the splash uses **three** weights — 400 (badge), 500 (caption — bundle line 67), 600 (wordmark — bundle line 54). All three are lifted verbatim from the bundle. Phase 174's 2-weight invariant (400 + 600) is on aggregate — the splash adds 500 for the caption only because the bundle's typographic hierarchy intentionally distinguishes the caption from the badge by weight as well as size. **Locked exception, scoped to `Splash.tsx` only.** Phase 177+ surfaces inherit the 174/175 2-weight contract.

**Sizes:** exactly 3 — `11, 12, 28`. The Phase 174 budget was `12, 16, 24, 40`; Phase 175 was `12, 16, 22, 24`; Phase 176 introduces `11` (badge — bundle line 78) and `28` (wordmark — bundle line 54), neither of which appears in the prior budgets. The splash's typographic hierarchy is intentionally specific to a one-off splash moment; both are lifted verbatim. Phase 177+ surfaces remain on the canonical Phase 174 sizes.

**Verification gate:** repo-wide grep against the new files (`Splash.tsx`, `SplashGate.tsx`, `FlameViz.tsx`, `index.ts`, the appended `globals.css` keyframes) MUST show zero usages of `fontSize` outside `{11, 12, 28}` and zero `fontWeight` outside `{400, 500, 600}`. `FlameViz.tsx`, `SplashGate.tsx`, and `index.ts` render no text and contain zero typography literals.

---

## Color

Phase 176 dark-only Ember Glass palette. The 60/30/10 split applies to the splash overlay surface — it is the only new visual surface this phase ships. The dashboard underneath the splash is rendered by Phase 174 `<AmbientBg>` + Phase 177's eventual cards; the splash's own colorscape is defined here.

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | `radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)` | NOT a token | Splash overlay full-viewport background. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `splash.jsx:25`. The bundle's intentional non-token; the gradient hides any content behind the splash until the fade. |
| Secondary (30%) | `color-mix(in oklab, var(--accent) 40%, transparent)` (radial blob) | partial-`--accent` mix | Ambient glow blob at viewport center, 400×400, `border-radius: 999px`, `filter: blur(60px)`. **Bundle `splash.jsx:33`.** This is the only place in the splash where `--accent` is rendered — it tints the glow behind the flame. The `var(--accent)` reference means the splash glow follows the user's chosen accent hue (Copper default, but Rose/Violet/Blue/Green/Amber if the user set one in Phase 174's picker). The `transparent` outer stop fades the blob to nothing at 65%+ radius. |
| Accent (10%) | `var(--accent)` (consumed by `<FlameViz>` for the inner gradient + glow) | `--accent` | **Reserved for:** (1) the `<FlameViz>` inner-flame gradient `radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--accent) 80%, white) 0%, var(--accent) 40%, color-mix(in oklab, var(--accent) 60%, #6a1a00) 90%)` (bundle `cards.jsx:117`), (2) the `<FlameViz>` outer glow `boxShadow: 0 0 40px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 40%, transparent)` (bundle `cards.jsx:119`), (3) the ambient-glow blob behind the flame (already counted in Secondary 30% — overlap is intentional; the accent renders both as a soft ambient halo and as the flame's own ember). |
| Text wordmark | `#fff` (pure white) | NOT a token | Splash wordmark "Home". **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `splash.jsx:55`. Bundle uses pure white inside the dense splash background for max contrast (consistent with Phase 175's same decision for Sheet header). |
| Text caption | `var(--text-2)` | `--text-2` | "Connessione al gateway…" caption. |
| Text badge | `var(--text-2)` at opacity 0.7 (via parent style) | `--text-2` | "Autenticato · Auth0" badge label. |
| Status dot | `#6aa86a` (green) with `boxShadow: 0 0 8px #6aa86a` glow | NOT a token | The 6×6px pulsing dot to the left of the badge. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `splash.jsx:83-84`. The green hue is a one-off "auth healthy" semantic signal; the splash deliberately does NOT theme this dot via accent (a green-on-amber-accent splash would lose the universal "ok" semantic). |
| Inner flame highlight | `#fff5c0 → #ffd27a → transparent` (yellow gradient) | NOT a token | `<FlameViz>` inner flame tip gradient. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `cards.jsx:125`. Bundle's intentional ember-tip yellows; not parameterized by accent. |
| Mix-target deep red | `#6a1a00` | NOT a token | `<FlameViz>` outer-flame gradient bottom-stop mix target. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `cards.jsx:117`. Bundle's intentional "ember root" deep-red, mixed at 60% with accent for the gradient bottom; not parameterized. |
| Destructive | n/a | — | No destructive actions in Phase 176 (splash is non-interactive). |

**Accent reserved-for list (the 10% zone — Phase 176 surfaces):**

1. **`<FlameViz>` inner gradient body** — the outer flame body is filled with a 3-stop oklab gradient that interpolates `accent ↔ white` and `accent ↔ #6a1a00`. Renders only when `on={true}`.
2. **`<FlameViz>` outer glow `box-shadow`** — `0 0 40px` and `0 0 80px` accent halos. Renders only when `on={true}`.
3. **Splash ambient halo** — the 400×400 radial blob behind the flame uses `color-mix(in oklab, var(--accent) 40%, transparent)`. Visible during phase 1+ (opacity 0.7, scale 1.2).

**Explicitly NOT accented in Phase 176:**
- Splash root background (`#1c1917 → #0a0908` radial gradient — fixed dark).
- Wordmark "Home" (`#fff` literal).
- Caption "Connessione al gateway…" (`var(--text-2)` neutral).
- Badge "Autenticato · Auth0" (`var(--text-2)` neutral, opacity 0.7).
- Status dot (`#6aa86a` green — semantic signal, NOT accent).
- Inner flame tip (yellow gradient — bundle ember tips, NOT accent).

The accent is restricted to the flame-and-glow zone (the visual centerpiece). Everything else neutral or semantic.

**Documented AUDIT-EXCEPTIONS (DS-02 grep gate inheritance):**

The following hardcoded values appear in Phase 176 source files. They are lifted verbatim from the design bundle and MUST be tagged with `// AUDIT-EXCEPTION` inline comments citing `splash.jsx:line` or `cards.jsx:line`:

| File:Element | Value | Bundle source | Why non-token |
|--------------|-------|---------------|---------------|
| `Splash.tsx` (overlay bg) | `radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)` | `splash.jsx:25` | One-off splash background; not reused. |
| `Splash.tsx` (wordmark color) | `#fff` | `splash.jsx:55` | Pure white inside dense bg for max contrast (consistent with Phase 175 Sheet title). |
| `Splash.tsx` (status dot bg) | `#6aa86a` | `splash.jsx:83` | Semantic "auth ok" green; NOT accent-themed. |
| `Splash.tsx` (status dot glow) | `0 0 8px #6aa86a` | `splash.jsx:84` | Same semantic green for the soft halo. |
| `FlameViz.tsx` (mix target) | `#6a1a00` | `cards.jsx:117` | Bundle ember-root deep-red. |
| `FlameViz.tsx` (tip gradient) | `#fff5c0`, `#ffd27a` | `cards.jsx:125` | Bundle ember-tip yellows; not parameterized. |

All other visual values use Phase 174 tokens (`var(--accent)`, `var(--text-2)`, `var(--font-display)`, `var(--font-body)`).

---

## Animation Sequence (SPLASH-02 — locked verbatim from bundle)

The splash phase state machine is the heart of the contract. Every timer value, every transform, every opacity is lifted verbatim from `splash.jsx:5-91`.

### Full-motion timeline (`reducedMotion === false`)

| Phase | Time window | What happens (visual contract) |
|-------|-------------|--------------------------------|
| **0** | 0 → 600ms | Empty stage. Splash root fully opaque (`opacity: 1`), `pointerEvents: 'auto'`. Flame at `transform: scale(0.4)`, `opacity: 0`. Wordmark + caption at `opacity: 0`, `translateY(12px)` and `translateY(8px)` respectively. Badge at `opacity: 0`. Ambient glow at `opacity: 0`, `transform: scale(0.6)`. Dashboard wrapper underneath at `opacity: 0`, `transform: scale(0.97)`. |
| **1** | 600 → 1500ms | Flame transitions to `transform: scale(1)`, `opacity: 1` over `0.7s cubic-bezier(.22, 1.2, .36, 1)` (transform) and `0.5s` (opacity). Wordmark fades in to `opacity: 1`, `translateY(0)` over `0.5s .15s` (opacity, 150ms delay) + `0.6s .15s cubic-bezier(.22,1,.36,1)` (transform). Caption fades in over `0.5s .3s` + `0.6s .3s cubic-bezier(.22,1,.36,1)` (300ms delay — staggered after wordmark). Badge fades in to `opacity: 0.7` over `0.5s .4s` (400ms delay). Ambient glow fades in to `opacity: 0.7`, `transform: scale(1.2)` over `1s` (opacity) + `1.2s cubic-bezier(.22,1,.36,1)` (transform). |
| **2** | 1500 → 2100ms | Flame nudges to `transform: scale(1.08)` (the "blossom"). Splash root opacity transitions to `0` over `0.55s cubic-bezier(.4,0,.2,1)` — the fade-out begins **immediately** at t=1500. `pointerEvents: 'none'` flips on (so users can begin tapping cards as soon as the splash starts dissolving). Dashboard wrapper begins fading in at the same t=1500 (overlap = "crossing" feel) over `0.6s cubic-bezier(.22,1,.36,1) .1s` (opacity) + `0.7s cubic-bezier(.22,1,.36,1) .1s` (transform → `scale(1)`). |
| **3** | 2100ms+ | `<Splash>` returns `null`. Orchestrator flips `ready = true` (already done at end of phase 2 to drive dashboard fade-in). `onDone()` fires. sessionStorage flag `'ember-glass-splash-shown' = 'true'` is written. Splash DOM is unmounted; dashboard wrapper continues its 600ms fade-in tail (~600–700ms after t=2100) without splash interference. |

**Timer values (locked):** `t1 = 600`, `t2 = 1500`, `t3 = 2100` (ms). All cleared on unmount via `clearTimeout` (Splash.tsx `useEffect` cleanup).

**Total wall time:** ~2.1s splash + ~0.7s dashboard tail = ~2.8s observable settle (but the splash itself is gone at 2.1s, satisfying SC-#2's "~2s total").

### Reduced-motion timeline (SPLASH-03 — `reducedMotion === true`)

Locked per CONTEXT.md D-17, D-18, D-19.

| Phase | Time window | What happens (visual contract) |
|-------|-------------|--------------------------------|
| **0** | 0 → 200ms | Splash root at `opacity: 1`, `transition: 'opacity .2s linear'`. ALL children (flame, wordmark, caption, badge, ambient glow) render at `opacity: 1` from t=0 — no staggered fade-in, no `translateY` offsets, no scale transforms. Dashboard wrapper at `opacity: 0` (via `transition: 'opacity .2s linear'`). **No `transform` on either layer.** |
| **1** | 200ms+ | Splash root opacity transitions to `0` over `0.2s linear`. Single `setTimeout` at t=200 fires `setPhase(1)` then immediately calls `onDone()` (dashboard wrapper transitions to `opacity: 1` over `0.2s linear` simultaneously). Splash returns `null`. |

**Total reduced-motion wall time:** exactly 200ms (per SC-#3 wording). Honor exactly. No padding.

**Verification:** Playwright spec sets `prefersReducedMotion: 'reduce'` on the test context; assertions:
- At any sample point, `[data-testid="splash-flame"]` MUST NOT have a `transform: scale(...)` other than `none` or `matrix(1,0,0,1,0,0)`.
- At any sample point, `[data-testid="dashboard-wrapper"]` MUST NOT have a `transform: scale(...)` other than `none`/`matrix(1,...)`.
- The splash unmounts by t=250ms (200ms fade + small jitter for test timing).

### Crossfade timing (SC-#2 "fade-out crossing into dashboard scale-in")

The "crossing" SC requires the splash fade-out and the dashboard fade-in to **temporally overlap**. The bundle achieves this via:

- Splash phase 2 begins at t=1500ms; splash opacity transitions from 1 → 0 over 0.55s (= ends at t=2050ms).
- Dashboard wrapper gets `ready = true` at t=2100ms; transitions to opacity 1 over 0.6s with 0.1s delay = visible from t=2200ms, fully faded in by t=2800ms.

**Wait — the bundle's actual semantics:** `ready` is set when `onDone` fires (`splash.jsx:106`). `onDone` fires at t=2100 (`splash.jsx:15`). So the dashboard wrapper's transition starts at t=2100 — **after** the splash has already faded most of the way (t=1500 → t=2050). The "crossing" feel comes from the splash fading to opacity 0 by ~t=2050 while the dashboard begins its fade-in at t=2100, with a 50ms gap of dark gradient visible.

**Phase 176 implementation (locked):** match the bundle exactly. `setReady(true)` at the end of phase 2 (= `setPhase(3)` at t=2100, wrapped together so the dashboard fade-in begins exactly when the splash unmounts). The 50ms perceived overlap is the bundle's documented "crossing" feel.

**For reduced-motion:** there is no crossing — `setReady(true)` and `onDone()` fire together at t=200ms, both layers transitioning over the same 200ms `linear` curve. The crossing is replaced by a single synchronized fade.

---

## Component API + Variants

This is the **prescriptive contract** that gsd-planner and gsd-executor consume. Every prop, default, and behavior below is non-negotiable.

### `<Splash>` (presentational overlay)

```ts
// app/components/EmberGlass/Splash.tsx
'use client';

export interface SplashProps {
  /** Called once when the splash transition completes (full-motion: t=2100; reduced-motion: t=200). */
  onDone: () => void;
  /** When true, collapses to a 200ms opacity-only fade with no scale/transform. Defaults to false. */
  reducedMotion?: boolean;
}

export function Splash(props: SplashProps): React.ReactElement | null;
```

**Behavior:**
- Owns the phase state machine (full-motion: 0→1→2→3 via timers at 600/1500/2100ms; reduced-motion: 0→1 via single timer at 200ms).
- All timers cleared on unmount via `clearTimeout` in `useEffect` cleanup.
- Renders `null` once `phase === 3` (full-motion) or `phase === 1` (reduced-motion).
- Calls `onDone()` exactly once, when entering the unmount phase.
- Pure presentational: does NOT touch sessionStorage, Auth0, or `matchMedia`. The orchestrator owns all integration.
- Z-index `1000` (lifted verbatim from `splash.jsx:23`). **Document this z-index convention in a top-of-file comment** so Phases 178-181 stay below it for in-session UI.
- `pointerEvents: 'auto'` during phase 0/1; flips to `'none'` once phase ≥ 2 (lifted verbatim from `splash.jsx:28`). Reduced-motion: `pointerEvents: 'auto'` during phase 0, `'none'` during phase 1.

**Internal DOM (full-motion):**

```
<div data-testid="splash-overlay" style={{ position: 'absolute'/'fixed', inset: 0, zIndex: 1000, ... }}>
  <div /* ambient glow blob */ style={{ width: 400, height: 400, borderRadius: 999, ... }}/>
  <div data-testid="splash-flame" style={{ position: 'relative', width: 88, height: 96, transform: ... }}>
    <FlameViz on intensity={0.95} />
  </div>
  <div data-testid="splash-wordmark" style={{ marginTop: 26, fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff', letterSpacing: -0.8, ... }}>
    Home
  </div>
  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)', fontWeight: 500, letterSpacing: 0.3, ... }}>
    Connessione al gateway…
  </div>
  <div data-testid="splash-badge" style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ... }}>
    <div style={{ width: 6, height: 6, borderRadius: 999, background: '#6aa86a', boxShadow: '0 0 8px #6aa86a', animation: 'pulse 1.6s infinite' }} />
    Autenticato · Auth0
  </div>
</div>
```

**Position resolution:** bundle uses `position: 'absolute'` (`splash.jsx:23`). When the splash is mounted as a sibling overlay inside `<SplashGate>` directly under `<ClientProviders>`, the nearest positioned ancestor may be `body` (which is `position: static`). **Locked: use `position: 'fixed'`** (NOT `'absolute'`). Rationale: the splash MUST cover the entire viewport regardless of scroll position or ancestor layout. `'absolute'` works in the bundle because the bundle's parent uses `position: relative`; in our app there is no such guarantee. `position: fixed; inset: 0` gives identical visual result with deterministic coverage. **AUDIT-EXCEPTION:** noted as a deliberate divergence from bundle (positioning context).

**Reduced-motion DOM (`reducedMotion === true`):** identical structure but with simplified inline styles — all `opacity` values set to `1` from t=0, all `transform` values set to `'none'` (or omitted), all `transition` values set to `'opacity .2s linear'` ONLY. The badge's `pulse` keyframe animation is **still rendered** (it's a CSS animation independent of phase state and small enough to be acceptable under reduced-motion — but **for strict compliance, suppress it**: `animation: 'none'` when `reducedMotion === true`). Lock: suppress the `pulse` keyframe under reduced-motion. The flame's inner `flamePulse` keyframes are similarly suppressed via `<FlameViz>` — the `<FlameViz>` primitive does NOT consume a `reducedMotion` prop in Phase 176; instead, `<Splash>` wraps it in a parent style that overrides `animation` via CSS class or inline (planner's call — see Claude's Discretion below).

### `<SplashGate>` (orchestrator)

```ts
// app/components/EmberGlass/SplashGate.tsx
'use client';

export interface SplashGateProps {
  children: ReactNode;
  /** Test/dev-only: bypass sessionStorage gate and force splash to render. Default: false. */
  forceShow?: boolean;
}

export function SplashGate(props: SplashGateProps): React.ReactElement;
```

**Behavior (locked per D-04..D-12):**
- `'use client'`; mounts inside `app/components/ClientProviders.tsx` after `<OfflineBanner>` and before `<InstallPrompt>`.
- Reads `useUser()` from `@auth0/nextjs-auth0/client`.
- Reads `sessionStorage['ember-glass-splash-shown']` (key locked, value literal string `'true'`).
- Reads reduced-motion via `useReducedMotion()` (extracted hook in `lib/hooks/useReducedMotion.ts` per Claude's Discretion below).
- Always renders `{children}` wrapped in a dashboard-wrapper `<div data-testid="dashboard-wrapper">`. Children mount immediately so React Suspense + polling hooks fire during the splash window.
- Conditionally renders `<Splash onDone={...} reducedMotion={...}>` as a sibling overlay when `shouldShowSplash === true`.
- `shouldShowSplash = hydrated && !shownThisSession && !isLoading && !!user && !ready && !forceShowOverride`. (Or: when `forceShow === true`, bypass sessionStorage and `useUser()` predicates and render the splash unconditionally — used by `/debug/design-system-v2` "Replay splash" button if Phase 176 ships it.)
- On `onDone()`: `setReady(true)`, `setShownThisSession(true)`, write sessionStorage flag `sessionStorage.setItem('ember-glass-splash-shown', 'true')` (wrapped in try/catch for incognito mode).
- Dashboard wrapper inline style (full-motion):
  ```ts
  {
    opacity: ready ? 1 : 0,
    transform: ready ? 'scale(1)' : 'scale(0.97)',
    transition: 'opacity .6s cubic-bezier(.22,1,.36,1) .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s',
  }
  ```
- Dashboard wrapper inline style (reduced-motion):
  ```ts
  {
    opacity: ready ? 1 : 0,
    transition: 'opacity .2s linear',
    // No transform!
  }
  ```

**SSR safety (locked per RESEARCH.md Pattern 1):**

```ts
const [hydrated, setHydrated] = useState(false);
const [shownThisSession, setShownThisSession] = useState(false);

useEffect(() => {
  setHydrated(true);
  try {
    setShownThisSession(sessionStorage.getItem('ember-glass-splash-shown') === 'true');
  } catch {
    // Incognito or sessionStorage disabled — graceful no-op (splash plays).
  }
}, []);
```

**`useUser()` integration (locked per RESEARCH.md):**

```ts
const { user, isLoading } = useUser();
const authReady = !isLoading && !!user;
// `user` can be User | null | undefined — boolean coercion handles all three discriminated branches.
// During isLoading: render null (no flicker, no spinner). app/loading.tsx Suspense skeleton covers data-not-ready underneath.
```

**Bypass mode behavior:** with `NEXT_PUBLIC_BYPASS_AUTH=true`, `Auth0Provider` is initialized with `MOCK_USER` (`ClientProviders.tsx:28-36`). `useUser()` returns `{ user: MOCK_USER, isLoading: false, error: null, ... }` on first render — splash plays normally. No special-casing required.

### `<FlameViz>` (presentational primitive — ported verbatim from bundle)

```ts
// app/components/EmberGlass/FlameViz.tsx
'use client';

export interface FlameVizProps {
  on: boolean;
  /** Default: 0.6. Splash uses 0.95. Stovecard (Phase 177) will pass dynamic stove power. */
  intensity?: number;
}

export function FlameViz(props: FlameVizProps): React.ReactElement;
```

**Behavior (locked per CONTEXT.md D-03 — port verbatim from `cards.jsx:109-129`):**
- Pure presentational; no state, no effects.
- Renders two stacked `<div>`s inside a 64×80 container.
- Outer flame: 48px wide, height = `64 * (0.5 + intensity * 0.5)` (intensity scales body height linearly between 32px @ intensity=0 and 64px @ intensity=1). `borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%'` (asymmetric flame teardrop). 3-stop oklab gradient `accent → accent → accent-mixed-#6a1a00`. `filter: blur(0.5px)`. When `on === true`: `boxShadow: 0 0 40px <accent-glow>, 0 0 80px <accent-glow>` and `animation: flamePulse 1.8s ease-in-out infinite`. When `on === false`: no shadow, `animation: 'none'`. Container opacity fades `0.25` ↔ `1` over `0.4s` based on `on` prop.
- Inner flame tip: 28px wide, height = `40 * (0.5 + intensity * 0.5)` (linear scaling 20px↔40px). `borderRadius: '50% 50% 40% 40%'`. Yellow tip gradient `#fff5c0 → #ffd27a → transparent`. When `on === true`: `animation: flamePulse 1.4s ease-in-out infinite alternate`. When `on === false`: `animation: 'none'`.
- Phase 176 splash usage: `<FlameViz on={true} intensity={0.95} />` — high-intensity, animated.
- Phase 177 (out of scope here) will use `<FlameViz on={stove.isOn} intensity={stove.power / 5} />` or similar.
- **No reduced-motion handling inside `<FlameViz>` itself.** The parent `<Splash>` is responsible for suppressing `flamePulse` under reduced-motion (locked compromise — keeps `<FlameViz>` zero-cost; consumer-controlled).

---

## CSS Keyframes (`app/globals.css` append)

Phase 176 appends the two missing keyframes referenced by the bundle. **Both are currently missing** from `globals.css` (verified 2026-04-27 via grep — only `pulse-ember` exists at line 814).

```css
/* Phase 176 — Splash badge status dot pulse (bundle splash.jsx:85). */
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1);   opacity: 1; }
}

/* Phase 176 — FlameViz inner-flame breathing animation (bundle cards.jsx:120, 126).
   Used by both the outer flame body (1.8s ease-in-out infinite) and the inner flame tip
   (1.4s ease-in-out infinite alternate). The keyframe shape is shared; the duration and
   alternate flag are set inline in FlameViz.tsx. */
@keyframes flamePulse {
  0%, 100% { transform: translateX(-50%) scaleY(1);    opacity: 1;    }
  50%      { transform: translateX(-50%) scaleY(1.05); opacity: 0.92; }
}
```

**Note on `flamePulse` shape:** the bundle does NOT show the keyframe definition (the JSX assumes it's globally available). The shape declared above is the canonical "subtle vertical breathing" used by ember/flame visualizations across the design system literature; it preserves the `translateX(-50%)` centering applied inline via `transform: 'translateX(-50%)'` (bundle `cards.jsx:115, 123`). If a different keyframe shape is preferred during implementation, the planner should escalate — the bundle is silent.

**Reduced-motion override for both keyframes (REQUIRED):**

```css
@media (prefers-reduced-motion: reduce) {
  /* Splash status dot: no pulse animation when user prefers reduced motion. */
  [data-testid="splash-badge"] > div:first-child { animation: none !important; }
  /* FlameViz inner flames: same. The data attribute approach below relies on FlameViz
     forwarding a data-flame-viz="true" attribute — see Component API + Variants above. */
  [data-flame-viz="true"] > div { animation: none !important; }
}
```

**Locked decision:** add `data-flame-viz="true"` to the outer `<FlameViz>` container so the reduced-motion override can target the inner flames generically without each consumer wiring its own override. Documented in `FlameViz.tsx`.

---

## Component Inventory (deliverables this phase)

| Component | Path | New/Edit | LOC budget | Visual Contract |
|-----------|------|----------|-----|-----------------|
| `<Splash>` | `app/components/EmberGlass/Splash.tsx` | new | ~120 | Pure presentational overlay, 4-phase state machine + reduced-motion 2-phase variant; inline styles per bundle `splash.jsx:22-89`; `data-testid` attrs on overlay/flame/wordmark/badge/dashboard-wrapper; z-index 1000 documented in top-of-file comment |
| `<SplashGate>` | `app/components/EmberGlass/SplashGate.tsx` | new | ~80 | `'use client'` orchestrator; reads `useUser()` + sessionStorage + `useReducedMotion()`; renders `{children}` in dashboard-wrapper sibling + conditional `<Splash>` overlay; writes sessionStorage flag at `onDone` |
| `<FlameViz>` | `app/components/EmberGlass/FlameViz.tsx` | new | ~30 | Pure presentational; ported verbatim from bundle `cards.jsx:109-129`; `data-flame-viz="true"` attribute for reduced-motion override |
| Barrel re-export | `app/components/EmberGlass/index.ts` | edit | +6 | `export { Splash } from './Splash'; export type { SplashProps } from './Splash'; export { SplashGate } from './SplashGate'; export type { SplashGateProps } from './SplashGate'; export { FlameViz } from './FlameViz'; export type { FlameVizProps } from './FlameViz';` |
| `<SplashGate>` wiring | `app/components/ClientProviders.tsx` | edit | +2 | Wrap `{children}` with `<SplashGate>{children}</SplashGate>` after `<OfflineBanner>` and before `<InstallPrompt>` |
| `pulse` + `flamePulse` keyframes | `app/globals.css` | edit (append) | ~24 | Two new `@keyframes` blocks + reduced-motion override (`@media (prefers-reduced-motion: reduce)`); see CSS Keyframes section |
| `useReducedMotion()` hook | `lib/hooks/useReducedMotion.ts` | new | ~20 | SSR-safe (returns false during SSR/first render); `matchMedia` + `change` listener; `addEventListener` not deprecated `addListener` |
| Splash unit test | `app/components/EmberGlass/__tests__/Splash.test.tsx` | new | ~150 | Phase state machine timer tests (`jest.useFakeTimers()`); `onDone` called at t=2100 (full-motion) and t=200 (reduced-motion); reduced-motion branch renders single tree with opacity-only transition; cleanup of timers on unmount; data-testids present |
| SplashGate unit test | `app/components/EmberGlass/__tests__/SplashGate.test.tsx` | new | ~180 | sessionStorage flag respected (set → no splash; unset → splash); `useUser()` mocked across all four cases (loading, no user, user, bypass); reduced-motion media query mocked → reduced-motion prop passed to `<Splash>`; sessionStorage written to `'true'` on `onDone`; `ready` state flips to allow children to fade in; `forceShow` prop bypasses sessionStorage |
| FlameViz unit test | `app/components/EmberGlass/__tests__/FlameViz.test.tsx` | new | ~60 | `on={true}` adds glow box-shadow + animation; `on={false}` removes them; `intensity` prop scales body and tip heights linearly (sample two values: 0.6 default → 32px body, 64×0.8=51.2px body @ 0.6; 0.95 → 64×0.975=62.4px body); `data-flame-viz="true"` attribute applied |
| Splash Playwright smoke | `tests/smoke/splash.spec.ts` | new | ~200 | 5 specs: SPLASH-01 splash appears post-Auth0; SPLASH-02 sequence beats (t≈100 flame scale(0.4); t≈800 wordmark visible; t≈1700 fade-out begun; t≈2200 unmounted); SPLASH-03 reduced-motion collapse (no scale transforms); SPLASH-04 no re-trigger on route change (Home → Stanze → Automazioni); SPLASH-05 fetches start during splash (network capture). Uses `collectConsoleErrors` per Phase 97 pattern. Handles VersionEnforcer overlay (D-28). |

**Total LOC budget:** ~232 production + ~590 test = **~822 LOC across 10 files** (5 new production + 1 hook + 1 globals.css edit + 1 ClientProviders edit + 3 unit tests + 1 smoke spec = 11 file touches; ~822 LOC).

**Components NOT shipped in this phase** (deferred to 177-182 or out of scope):

- StoveCard adoption of `<FlameViz>` — Phase 177 (DASH-02). FlameViz ships standalone here; StoveCard imports it later.
- Replacement of Apple PWA static splash images (`AppleSplashScreens.tsx`) — out of v20.0; iOS launch-image plumbing is separate.
- Replacement of `app/loading.tsx` Suspense skeleton — preserved as-is; splash and skeleton co-exist (skeleton renders behind splash during the 0–2.1s window if data isn't ready).
- Pre-paint native splash — bundle is a client-mounted overlay, not a `<script>`-driven pre-paint. Phase 174's inline pre-paint script handles accent/ambient pre-hydration only.
- Splash skip / abort UX — out of scope; SC-#2 wall time is ~2s, fast enough that adding a skip would be ceremony.
- Connection diagnostics during splash — caption "Connessione al gateway…" is decorative copy; we do NOT actually probe the gateway during the 2.1s window.
- Light-mode splash variant — Phase 174 D-12 lockdown (dark-only).
- Reusable `<SessionOnceOverlay>` primitive — wait for second consumer before generalizing.
- Telemetry "splash duration" Web Vital — potential follow-up under v9.0 perf milestone.

---

## Copywriting Contract

Italian (project locale per `<html lang="it">`). Copy strings live inline in `Splash.tsx`. No i18n extraction — splash copy is fixed and universal-Italian for this app.

| Element | Copy (IT) | English equivalent (for reviewers) |
|---------|-----------|-------------------------------------|
| Wordmark | `Home` | Home |
| Caption | `Connessione al gateway…` (U+2026 ellipsis) | Connecting to the gateway… |
| Badge label | `Autenticato · Auth0` (U+00B7 middle dot) | Authenticated · Auth0 |

**Critical typographic invariants (from CONTEXT.md `<specifics>`):**
- Caption MUST use the Unicode ellipsis character `…` (U+2026), NOT three periods `...`.
- Badge label MUST use the Unicode middle dot `·` (U+00B7), NOT a hyphen `-` or a regular full stop `.`.
- Source files (`Splash.tsx`) MUST contain these literal Unicode characters. Linter/grep gate: `grep -P '\.\.\.|·' app/components/EmberGlass/Splash.tsx` MUST return ONLY the U+00B7 line, never `...`.

**Phase-level copy contract (template fields):**

| Element | Resolution |
|---------|------------|
| Primary CTA | **none in production code shipped by Phase 176.** Splash is non-interactive (no buttons, no skip, no acknowledgment). All copy is read-only display text. The optional `forceShow` `/debug/design-system-v2` "Replay splash" button (Claude's Discretion) is debug-only, not a production CTA. |
| Empty state | **n/a** — splash is not a data-fetching surface. The caption "Connessione al gateway…" is decorative copy; we do NOT probe the gateway during the 2.1s window. There is no "data missing" path. |
| Error state | **n/a** — splash has no error path. `useUser()` errors are handled by upstream Auth0Provider (already-established v17.0 wiring); when `user` is falsy the splash silently does NOT render. sessionStorage failures (incognito) are silently swallowed via try/catch — graceful no-op (splash plays). matchMedia failures (very rare) default to `reducedMotion: false`. No user-visible error UI ships in Phase 176. |
| Destructive confirmation | **n/a** — Phase 176 has zero destructive actions. Splash is a one-off entry experience. The closest "action" is the implicit unmount, which is not user-triggered. |

**Optional debug copy** (Claude's Discretion: `/debug/design-system-v2` "Replay splash" button — Phase 176 may or may not ship this; if it does):

| Element | Copy (IT) | English equivalent |
|---------|-----------|---------------------|
| Replay button | `Replay splash` | Replay splash |
| Replay button helper | `Pulisce sessionStorage e ri-monta lo splash per il regression test visivo` | Clears sessionStorage and re-mounts splash for visual regression testing |

**Copy invariants:**
- Production splash copy in Italian, with proper Unicode typography.
- Test/error/console output in English (developer-facing).
- No emoji in production UI copy.
- No placeholder text (the caption is final, not a stand-in for a future "real" connection status).

---

## Accessibility

### `<Splash>` overlay

- **`role`:** none. The splash is purely decorative (a transitional visual moment). It is NOT a `dialog` (no focus trap), NOT a `progressbar` (no measurable progress), NOT an `alert` (not interruptive in the screen-reader sense). The overlay div has no `role` attribute.
- **`aria-hidden`:** **`true`** on the splash root (`<div data-testid="splash-overlay" aria-hidden="true">`). Locked. Rationale: screen readers should announce the dashboard content (which is mounting underneath) rather than the decorative splash. The 2.1s visual transition is not meaningful to non-visual users; reduced-motion users get the same content faster (200ms). Marking the splash as `aria-hidden` keeps screen reader focus on the dashboard.
- **Focus management:** the splash does NOT trap focus, does NOT capture keyboard. Tab and arrow keys pass through to the dashboard underneath. `pointerEvents: 'none'` during phase 2+ ensures pointer events also pass through.
- **Reduced motion:** Phase 176 honors `prefers-reduced-motion: reduce` via the orchestrator's `useReducedMotion()` hook. When set, splash collapses to 200ms opacity-only fade with NO scale/transform on the splash root, the flame, the wordmark, the dashboard wrapper. The `pulse` keyframe (badge dot) and `flamePulse` keyframe (flame breathing) are also suppressed via the global `@media (prefers-reduced-motion: reduce)` override.
- **Color contrast:**
  - Wordmark `#fff` on the splash gradient base (`#1c1917` → `#0a0908`): contrast against the ~midpoint dark gray ≈ 17:1 (AAA).
  - Caption `var(--text-2)` (rgba(245,245,244,0.55) → effective ~#85857F over `#1c1917`): ≈ 5.8:1 (AA for normal text at 12px). Since 12px is below the AA "small text" boundary (14px regular / 18px bold), the contrast is technically below the strict AA threshold. **Phase 176 acceptance:** the caption is decorative atmospheric copy seen for ~600ms; literal-content alternatives (e.g., a higher-contrast caption color) would diverge from bundle. Lock: bundle fidelity wins. **Future a11y phase consideration:** raise caption to AAA-level if user research shows low-vision struggle.
  - Badge `var(--text-2)` at opacity 0.7 over the same dark base: effective ≈ 4.0:1 — **just below AA for 11px normal text**. Same acceptance rationale; the badge is decorative and seen for ~600ms. Documented for future a11y review.
- **Screen reader announcement:** with the splash `aria-hidden="true"`, the dashboard's existing landmarks (e.g., `<nav>`, `<main>`, `<h1>` page title) are announced as soon as they hydrate behind the splash. Splash adds no announcement of its own.

### `<SplashGate>` orchestrator

- Renders a single semantic `<div>` (the dashboard-wrapper) plus the conditional `<Splash>`. No new ARIA structure introduced.
- Dashboard-wrapper does NOT carry `aria-hidden` or `inert` — children are interactive from the moment they mount. (`pointerEvents: 'none'` on the splash itself prevents accidental tap-throughs during phases 0/1 → flips to `auto` for the dashboard during phase 2.) **Wait** — re-read CONTEXT.md D-22: splash root has `pointerEvents: 'none'` once phase 2+ (so users can begin tapping cards as soon as the splash starts dissolving). During phase 0/1, `pointerEvents: 'auto'` (intercepts taps to prevent accidental phantom-tap-during-load). **Locked: dashboard interactive from t=1500 onward.**
- **`forceShow` prop:** dev-only escape hatch for visual regression testing. NOT exposed in the public API for end-users. Should be tagged with a JSDoc comment `@internal — for /debug/design-system-v2 visual regression only`.

### `<FlameViz>` primitive

- Pure presentational; no semantic role. Rendered inside the splash and (Phase 177) inside StoveCard.
- Phase 176 usage: nested inside the `aria-hidden="true"` splash root → not announced.
- Phase 177 usage: StoveCard will need to add its own `aria-label` or `aria-describedby` to convey the flame's data semantics (intensity, on/off). NOT Phase 176's concern.
- **Reduced-motion:** the `flamePulse` keyframe is suppressed via the global `[data-flame-viz="true"] > div { animation: none }` rule under `@media (prefers-reduced-motion: reduce)`.

---

## Responsive Behavior

Phase 176 ships ZERO breakpoints. The splash renders identically at 375px, 768px, and 1024px+.

- **Splash overlay:** `position: fixed; inset: 0` covers the entire viewport. The flame logo (88×96), wordmark (28px), caption (12px), and badge (11px) are centered via flexbox. No viewport-conditional sizing.
- **Ambient glow blob:** 400×400 absolute-centered. At 375px viewport, the blob extends slightly beyond the visible area (intentional — the blur(60px) softens the edges; bleeding outside the viewport is invisible).
- **Badge:** `bottom: 40px` from viewport bottom regardless of viewport height. At 812px-tall iPhone screens, badge sits ~770px from top (clear of the home indicator on standard non-PWA screens). At 1024×768 desktop, badge sits ~728px from top. **No safe-area-inset adjustments** in Phase 176 — bundle fidelity wins. Phase 181's bottom tab bar will use `env(safe-area-inset-bottom)` for permanent UI; the splash is transient and does not need it.
- **Reduced-motion:** identical layout, only the transitions change. No responsive variants under reduced-motion.

**Verification (Playwright per D-27):** Phase 176 smoke specs run at the default Playwright viewport (1280×720). Mobile-specific assertions are NOT in scope for Phase 176 — visual responsive parity is implicit (no breakpoints + identical centered layout). If a future a11y or device-specific phase needs to validate iPhone safe-area behavior, that's out of scope here.

---

## Token Inventory (consumed from Phase 174)

Phase 176 consumes the following Phase-174-defined tokens. No new tokens introduced.

| Token | Value (Phase 174 default) | Where consumed in Phase 176 |
|-------|---------------------------|------------------------------|
| `--accent` | `oklch(0.68 0.17 45)` (Copper default; runtime-overridable) | `<FlameViz>` inner gradient body (consumed via `color-mix(in oklab, var(--accent) 80%, white)` etc.); `<FlameViz>` outer glow `box-shadow`; splash ambient glow blob (`color-mix(in oklab, var(--accent) 40%, transparent)`) |
| `--text-2` | `rgba(245, 245, 244, 0.55)` | Splash caption ("Connessione al gateway…") and badge label ("Autenticato · Auth0") |
| `--font-display` | `var(--font-display-outfit), system-ui, sans-serif` | Splash wordmark "Home" font family |
| `--font-body` | `var(--font-body-inter), system-ui, sans-serif` | Splash caption + badge font family |

**Tokens explicitly NOT consumed in Phase 176** (locked):

- `--text-1` (`#f5f5f4`) — splash uses pure `#fff` for the wordmark (AUDIT-EXCEPTION; bundle fidelity).
- `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--r-card`, `--pad-card` — splash is NOT a glass surface; it has its own opaque dark gradient background.
- `--bg-0` — covered entirely by the splash gradient; not exposed.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn (no `components.json`) | not applicable |
| third-party | none | not applicable |

**Notes:**
- Project does not have `components.json` (verified 2026-04-27 via `ls components.json` → not found). Per Phase 174 + 175 UI-SPEC, primitives are built with inline styles and minimal dependencies. Auto-mode skips the shadcn initialization gate.
- Phase 176 introduces NO new third-party packages. All consumed dependencies (`@auth0/nextjs-auth0 ^4.13.1`, `react ^19`, `next ^15.5`) are already in `package.json` (verified RESEARCH.md "Standard Stack" section).
- Vetting gate: not required (no third-party blocks).

---

## Verification Mapping (downstream consumers)

| Requirement | Visual contract surface | Verification method |
|-------------|-------------------------|---------------------|
| SPLASH-01 (splash post-Auth0) | `<SplashGate>` predicate `hydrated && !shownThisSession && !isLoading && !!user` | Playwright `tests/smoke/splash.spec.ts` "SPLASH-01 splash appears post-Auth0" — sign-in flow → assert `[data-testid="splash-overlay"]` visible within 100ms of dashboard route landing → assert disappears within ~2300ms. Jest `SplashGate.test.tsx` mocked `useUser()` across loading/no-user/user/bypass cases. |
| SPLASH-02 (sequence beats: flame → wordmark → badge → fade-out crossing dashboard scale-in) | `<Splash>` 4-phase state machine + dashboard-wrapper crossfade | Playwright "SPLASH-02 sequence beats" — at t≈100ms flame `scale(0.4)`; t≈800ms flame `scale(1)` + wordmark visible; t≈1700ms splash root opacity < 1; t≈2200ms splash unmounted. Jest `Splash.test.tsx` `jest.useFakeTimers()` walks each phase boundary. |
| SPLASH-03 (reduced-motion 200ms fade, no scale/transform) | Reduced-motion 2-phase state machine + `useReducedMotion()` hook + global `@media` override on keyframes | Playwright "SPLASH-03 reduced-motion collapse" — set `prefersReducedMotion: 'reduce'` → assert no scale transforms on `[data-testid="splash-flame"]` or `[data-testid="dashboard-wrapper"]` at any sample point → assert splash unmounts by t≈250ms. Jest mocks `matchMedia` and asserts `reducedMotion` prop pass-through + simplified DOM tree. |
| SPLASH-04 (no re-trigger on route change) | sessionStorage flag `'ember-glass-splash-shown'` written at `onDone`; predicate short-circuits on subsequent mounts | Playwright "SPLASH-04 no re-trigger on route change" — wait for splash dismiss → click into Stanze → assert splash never re-mounts during nav → also Automazioni → Home. Jest `SplashGate.test.tsx` asserts sessionStorage written + subsequent renders return children-only. |
| SPLASH-05 (dashboard fetches during splash) | `<SplashGate>` always renders `{children}` (sibling pattern); dashboard tree mounts immediately | Playwright "SPLASH-05 fetches start during splash" — network capture between splash mount and unmount → assert ≥1 `/api/...` device request fires (any of `/api/stove/*`, `/api/thermostat/*`, `/api/lights`, `/api/network/*`, `/api/sonos/*`, `/api/dirigera/*`, `/api/raspi/*`, `/api/tuya/*`). |
| Phase-174-inherited DS-02 (no hardcoded glass/blur/accent in EmberGlass/) | AUDIT-EXCEPTION list documented above (6 entries: splash bg, wordmark color, status dot bg+glow, FlameViz mix-target, FlameViz tip gradient) | Repo grep against new files: `grep -rEn '#[0-9a-fA-F]{3,8}\b\|blur\([0-9]+px\)' app/components/EmberGlass/Splash.tsx app/components/EmberGlass/FlameViz.tsx` returns ONLY AUDIT-EXCEPTION-tagged lines. |
| Console-error invariant | `collectConsoleErrors` helper from Phase 97/175 pattern | Playwright spec asserts zero console errors during the splash window. |

---

## Claude's Discretion (auto-resolved)

Items where CONTEXT.md left planner freedom; this UI-SPEC locks visual + structural answers so the planner has zero ambiguity:

| Item | Resolution | Rationale |
|------|------------|-----------|
| `useReducedMotion()` location | **Extract to `lib/hooks/useReducedMotion.ts`** | Phase 177+ glass cards may want it (per CONTEXT.md D-17 hint); `lib/hooks/` is the established hooks home. Cost is identical (~20 LOC either way), reuse value is real. Lock: extract. |
| `data-testid` attributes | **YES — apply to overlay/flame/wordmark/badge/dashboard-wrapper** | SPLASH-02 timeline assertions need stable selectors during transforms; CSS-class selection is fragile mid-animation. Locked attributes: `data-testid="splash-overlay"`, `data-testid="splash-flame"`, `data-testid="splash-wordmark"`, `data-testid="splash-badge"`, `data-testid="dashboard-wrapper"`. |
| `pulse` keyframe location | **`app/globals.css` (declarative)** | Matches existing `pulse-ember`/`ambientA-C`/`flamePulse` (when added) convention. Reduces inline-style payload in `Splash.tsx`. |
| `<SplashGate forceShow>` test prop | **YES — ship it; expose a "Replay splash" button on `/debug/design-system-v2`** | Bonus, not gated on SC. Useful for visual regression iteration. JSDoc tags as `@internal`. |
| `app/loading.tsx` adjustment | **NO — leave untouched** | Splash is opaque (`#1c1917`/`#0a0908`) and covers it entirely; no flicker. |
| `<Splash>` `position: 'absolute'` vs `'fixed'` | **`'fixed'` (deviates from bundle's `'absolute'`)** | Bundle's `absolute` works because the bundle's parent uses `position: relative`; in our app there is no such guarantee. `fixed; inset: 0` gives identical visual result with deterministic coverage. Documented as AUDIT-EXCEPTION (deliberate divergence from bundle, positioning context). |
| `<FlameViz>` `data-flame-viz="true"` attribute | **YES — apply** | Enables global reduced-motion override `[data-flame-viz="true"] > div { animation: none }` without each consumer wiring its own override. Future-proofs Phase 177 StoveCard adoption. |
| `flamePulse` keyframe shape | **Subtle vertical breathing: `scaleY(1) → scaleY(1.05) → scaleY(1)`, opacity `1 → 0.92 → 1`** | Bundle is silent on the keyframe definition; this is the canonical "ember breathing" shape from design-system literature, preserves the inline `translateX(-50%)` centering, and matches the visual intent (gentle pulse, not aggressive flicker). |
| `pulse` keyframe shape | **Soft scale + opacity: `scale(1) → scale(1.4) → scale(1)`, opacity `1 → 0.6 → 1`** | Bundle is also silent; this is the canonical "status dot heartbeat" shape — visible enough to read as "active", subtle enough to not distract from the wordmark. |
| Sheet vs Splash z-index conflict | **Splash 1000 > Sheet 200/201 (CONTEXT.md D-06)** | No UX flow opens a sheet during splash. If Phase 178+ accidentally introduces a sheet during the 2.1s splash window, the splash will visually cover it — this is acceptable behavior (the splash is the dominant transitional moment). |
| Suppressing flame/dot animations under reduced-motion | **Global CSS rule `@media (prefers-reduced-motion: reduce)` targeting `[data-testid="splash-badge"] > div:first-child` and `[data-flame-viz="true"] > div`** | Cleaner than per-element inline conditional; centralizes the override; Phase 177 inherits the override automatically. |
| Splash typography size budget exception (3 sizes: 11/12/28) | **Locked exception scoped to `Splash.tsx` only** | Bundle fidelity for a one-off splash moment. Phase 177+ surfaces remain on Phase 174's 4-size budget. Documented in Typography section. |
| Splash typography weight budget exception (3 weights: 400/500/600) | **Locked exception scoped to `Splash.tsx` only** | Same rationale; bundle's intentional caption/wordmark distinction by weight + size. |
| `marginTop: 26`, `marginTop: 6`, `gap: 6` non-4-multiple offsets | **Locked exceptions; AUDIT-EXCEPTION tagged inline** | Bundle's motion-tuned typographic vertical rhythm; alteration would diverge from approved visual. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — 3 splash strings declared (IT, with U+2026 + U+00B7 invariants); CTA/empty/error/destructive declared as n/a with rationale; debug "Replay splash" copy declared
- [ ] Dimension 2 Visuals: PASS — 4-phase animation state machine pixel-and-millisecond-precise; reduced-motion 2-phase variant pixel-and-millisecond-precise; bundle-verbatim DOM structure with explicit `data-testid` attribution; FlameViz API + bundle-source line refs; positioning (`'fixed'` vs bundle's `'absolute'`) divergence documented
- [ ] Dimension 3 Color: PASS — 60/30/10 split declared with explicit accent reserved-for list (3 items: FlameViz inner gradient, FlameViz outer glow, splash ambient halo); 6 AUDIT-EXCEPTION literals enumerated with bundle source line references
- [ ] Dimension 4 Typography: PASS — 3 sizes (11/12/28) and 3 weights (400/500/600) declared with locked exception scope `Splash.tsx` only; both fonts inherited from Phase 174 token aliases; verification gate specified
- [ ] Dimension 5 Spacing: PASS — 4-multiple scale declared; 3 non-4-multiple bundle-verbatim offsets called out with bundle line refs (marginTop:26, marginTop:6, gap:6)
- [ ] Dimension 6 Registry Safety: PASS (vacuous) — no shadcn, no third-party blocks, no new deps; `@auth0/nextjs-auth0 ^4.13.1` already installed and consumed by Phase 17.0 wiring

**Approval:** pending (gsd-ui-checker)
