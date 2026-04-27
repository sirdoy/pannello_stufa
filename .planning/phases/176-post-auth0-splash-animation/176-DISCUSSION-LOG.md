# Phase 176: Post-Auth0 Splash Animation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 176-post-auth0-splash-animation
**Mode:** `--auto --chain` — Claude auto-resolved every gray area with the recommended default. No interactive AskUserQuestion calls were made.
**Areas auto-decided:** Component architecture, Mount location, Trigger / gating rules, Animation sequence, Reduced-motion handling, Non-blocking fetches, Token & primitive reuse, Smoke / verification surface

---

## Component architecture & namespace

| Option | Description | Selected |
|--------|-------------|----------|
| Single `<Splash>` doing everything (auth + storage + animation) | Less indirection; one file. | |
| `<SplashGate>` orchestrator + dumb `<Splash>` + `<FlameViz>` primitive in `EmberGlass/` | Follows Phase 174/175 namespace + dumb-presentational/orchestrator split; reusable FlameViz for Phase 177 DASH-02. | ✓ |
| Inline splash in `app/layout.tsx` Server Component | Wouldn't work — splash needs `useUser()` + state. | |

**Auto-selected:** Orchestrator + presentational + FlameViz primitive.
**Notes:** Recommended default. Aligns with Phase 174 `<AmbientBg>` / Phase 175 `<Pressable>`/`<Sheet>` namespace and inline-style convention. FlameViz extraction here saves Phase 177.

---

## Mount location

| Option | Description | Selected |
|--------|-------------|----------|
| `app/layout.tsx` directly | Server Component — would force `'use client'` cascade. | |
| Inside `ClientProviders` wrapping `{children}` | Auth0Provider already an ancestor; covers entire dashboard tree without per-page wiring. | ✓ |
| Per-page (in `app/page.tsx`) | Wouldn't cover other authenticated routes. | |

**Auto-selected:** `ClientProviders` wrapping `{children}` (between OfflineBanner and InstallPrompt).

---

## Trigger / gating

| Option | Description | Selected |
|--------|-------------|----------|
| `localStorage` flag | Persists across tabs/sessions — would suppress splash on every reload forever. | |
| `sessionStorage` flag (`ember-glass-splash-shown`) | Per-tab, clears on tab close — exactly matches "session" wording in SC-#4. | ✓ |
| In-memory only (no flag) | Would replay on every hard reload mid-session. | |

**Auto-selected:** `sessionStorage` keyed `ember-glass-splash-shown`.
**Notes:** Trigger condition = client hydrated AND flag absent AND `useUser() = { user: truthy, isLoading: false }`. Does not render during `isLoading`.

---

## Animation sequence

| Option | Description | Selected |
|--------|-------------|----------|
| Lift bundle `splash.jsx` timer/transform values verbatim (t1=600, t2=1500, t3=2100) | Matches SC-#2 wall time and the documented sequence exactly. | ✓ |
| Reduce sequence to 1.5s for snappier feel | Drifts from "~2s" SC and design-bundle intent. | |
| Use Framer Motion / GSAP | Adds dependency; bundle uses inline transitions only. | |

**Auto-selected:** Bundle verbatim port (TS).
**Notes:** Wordmark literal `Home`; caption literal `Connessione al gateway…`; badge literal `Autenticato · Auth0`. Exact unicode (`…`, `·`).

---

## Reduced-motion handling

| Option | Description | Selected |
|--------|-------------|----------|
| 200ms opacity-only fade, single-phase, no transforms | Exactly matches SC-#3 wording. | ✓ |
| Skip splash entirely under reduced-motion | Loses the "Autenticato" feedback signal. | |
| Same sequence at 50% speed | Still uses transforms — violates SC-#3. | |

**Auto-selected:** 200ms opacity-only fade. Inline `useReducedMotion()` hook in `SplashGate.tsx`.

---

## Non-blocking fetches

| Option | Description | Selected |
|--------|-------------|----------|
| Mount dashboard tree as splash sibling (children render behind overlay from t=0) | React/Suspense fetches start during splash window, satisfying SPLASH-05 with no extra plumbing. | ✓ |
| Gate dashboard mount until splash completes | Would violate SPLASH-05 — fetches would not start during splash. | |
| Add explicit prefetch hooks | Unnecessary; existing polling hooks fire on mount. | |

**Auto-selected:** Sibling render. Splash overlays at z-index 1000; pointerEvents flip to `none` at phase 2+ so users can begin interacting as the splash dissolves.

---

## Z-index policy

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle's `z-index: 1000` | Above Phase 175 sheet (200/201) and below legacy BottomSheet (8999). | ✓ |
| Pick something between 200 and 8999 (e.g. 500) | No reason to deviate from bundle. | |

**Auto-selected:** 1000, with documenting comment.

---

## Token & primitive reuse

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Phase 174 tokens for accent/text/font-display, keep bundle's hardcoded near-black gradient verbatim | Matches inline-style convention; tokens flow where they exist; bundle background stays as designed. | ✓ |
| Replace all hardcoded values with tokens | Would alter the visual intent; `#1c1917`/`#0a0908` are bundle-specific. | |

**Auto-selected:** Tokens + bundle-verbatim hardcoded background.
**Notes:** Pressable / Sheet from Phase 175 NOT consumed (splash is non-interactive).

---

## Smoke / verification surface

| Option | Description | Selected |
|--------|-------------|----------|
| Five Playwright specs (one per SPLASH-01..05) + 3 Jest unit specs (Splash, SplashGate, FlameViz) | Direct mapping to SC; deterministic via `data-testid` selectors and fake timers; reuses Phase 51 Auth0 helper + Phase 97 console-error helper. | ✓ |
| Visual regression only | Brittle for the timing-critical SC-#2 beats. | |
| Skip Playwright; Jest only | Misses SPLASH-01 + SPLASH-05 (real network/auth flow). | |

**Auto-selected:** 5 Playwright + 3 Jest specs. Plan agent must account for the pre-existing VersionEnforcer overlay (Phase 175 known issue).

---

## Claude's Discretion

- Whether `useReducedMotion()` extracts to `lib/hooks/` or stays inline in `SplashGate.tsx`.
- Whether to add `data-testid` attributes (recommended yes for Playwright determinism).
- Whether `pulse` keyframe ships in `globals.css` (recommended) or inline.
- Whether `<SplashGate>` exposes a `forceShow` test prop / `/debug/design-system-v2` "Replay splash" button (recommended yes for design iteration).
- Whether logout flow explicitly clears `sessionStorage` flag (not required; natural session lifecycle suffices).

## Deferred Ideas

- Apple PWA static launch images (`AppleSplashScreens.tsx`).
- Light-mode splash variant.
- Real connection diagnostics during the splash window.
- Skip-splash UX.
- Setup-complete splash for new device onboarding.
- Generalized `<SessionOnceOverlay>` primitive.
- Animated logo morph to navbar mark.
- Splash-duration Web Vital telemetry.
- Replacing `app/loading.tsx` with a glass-themed skeleton.
- Accent-picker theming of the splash.
