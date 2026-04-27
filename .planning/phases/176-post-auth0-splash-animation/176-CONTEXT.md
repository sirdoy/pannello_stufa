# Phase 176: Post-Auth0 Splash Animation - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC, REQUIREMENTS.md SPLASH-01..05, the design bundle (`splash.jsx`, `cards.jsx::FlameViz`), Phase 174's locked CONTEXT/UI-SPEC, and Phase 175's Pressable/Sheet primitives.

<domain>
## Phase Boundary

Insert a **single, session-once, ~2s splash animation** between Auth0 sign-in / session-restore and the first paint of the dashboard, with `prefers-reduced-motion` respect and **non-blocking** initial device-data fetches.

In scope:
- A new client-side `<Splash>` overlay component in `app/components/EmberGlass/Splash.tsx` that ports the bundle's animation phases verbatim (logo scale-in → wordmark "Home" + caption "Connessione al gateway…" → "Autenticato · Auth0" badge → fade-out at ~2.1s).
- A new `<SplashGate>` orchestrator in `app/components/EmberGlass/SplashGate.tsx` that:
  - Listens to Auth0's `useUser()` (already wired via `Auth0Provider` in `ClientProviders`).
  - Renders `<Splash>` once per browser session (via `sessionStorage` flag) and never on subsequent in-session route changes (SPLASH-04).
  - Renders the dashboard tree **behind** the splash overlay so React/Suspense fetches can begin during the splash window (SPLASH-05).
  - Honors `prefers-reduced-motion: reduce` — collapses to a 200ms opacity-only fade with no scale/transform on either layer (SPLASH-03).
- A new `<FlameViz>` primitive in `app/components/EmberGlass/FlameViz.tsx`, ported from bundle `cards.jsx:109-129`, used by the splash now and by Phase 177's `StoveCard` later (DASH-02). Phase 176 ships ONLY the primitive + splash usage; StoveCard wiring stays in Phase 177.
- Wiring the splash gate at the layout boundary so it covers the entire dashboard mount (`<ClientProviders>` body), not individual pages.
- A barrel re-export from `app/components/EmberGlass/index.ts` (`Splash`, `SplashGate`, `FlameViz`).
- Reduced-motion smoke + session-once smoke + non-blocking-fetch smoke via Playwright at `tests/playwright/splash.spec.ts`.
- Jest unit tests for `Splash`, `SplashGate`, `FlameViz` under `app/components/EmberGlass/__tests__/`.

Out of scope:
- StoveCard / DashCard adoption of `<FlameViz>` — Phase 177 (DASH-02).
- Replacing Apple PWA static splash images (`AppleSplashScreens.tsx`) — that's iOS launch-image plumbing, separate concern; out of v20.0.
- Replacing `app/loading.tsx` (the Next.js Suspense skeleton) — it stays as the per-route Suspense fallback for sub-route navigations; the new splash is the **session-entry** experience, not a route loading state.
- Pre-paint native splash (browser-level paint blocking) — splash is a client-mounted overlay, not a `<script>`-driven pre-paint. The Phase 174 inline pre-paint script already handles accent/ambient pre-hydration.
- Modifying Auth0 login redirect URLs / callback handlers — bundle assumes the user is already past Auth0; this phase only covers the post-auth render moment.
- Migrating logout flow — handled by existing `/auth/logout` link in `Navbar.tsx:478`. Splash session flag clearing on logout is captured below (D-12).

</domain>

<decisions>
## Implementation Decisions

### Component architecture & namespace
- **D-01:** All new files live under `app/components/EmberGlass/` — same namespace as Phase 174's `AmbientBg.tsx` and Phase 175's `Pressable.tsx` / `Sheet.tsx`. Concrete files:
  - `app/components/EmberGlass/Splash.tsx` — pure presentational overlay, accepts `onDone` callback + optional `reducedMotion?: boolean` prop (orchestrator may pre-resolve).
  - `app/components/EmberGlass/SplashGate.tsx` — `'use client'` orchestrator: reads `useUser()`, sessionStorage, reduced-motion media query; mounts `<Splash>` over `children`; calls `setReady(true)` on `onDone`; persists "shown" flag to sessionStorage.
  - `app/components/EmberGlass/FlameViz.tsx` — pure presentational primitive ported from bundle `cards.jsx:109-129`, no state. Inline `style` object identical to bundle (matches `AmbientBg`/`Sheet` inline-style convention from Phase 174/175).
  - Update `app/components/EmberGlass/index.ts` to re-export `Splash`, `SplashGate`, `FlameViz` (and types `SplashProps`, `SplashGateProps`, `FlameVizProps`).
- **D-02:** `<SplashGate>` is the **only** integration point. The presentational `<Splash>` does NOT touch sessionStorage, Auth0, or the reduced-motion media query — it is dumb. This separation makes both unit-testable: Splash via timer assertions, SplashGate via mocked `useUser()` + `sessionStorage`.
- **D-03:** `<FlameViz>` ships now (Phase 176) and is imported by `<Splash>`. Phase 177 will additionally import it from `<StoveCard>`. Defining it here gives Phase 177 a free dependency rather than waiting for it to extract from a Phase 177 inline definition. **No other v20.0 phase is allowed to redefine FlameViz.**

### Mount location & rendering strategy
- **D-04:** Mount `<SplashGate>` **inside** `app/components/ClientProviders.tsx`, wrapping `{children}` directly (after `<OfflineBanner>`, before `<InstallPrompt>`):
  ```tsx
  <CommandPaletteProvider>
    <AxeDevtools />
    <PWAInitializer />
    <OfflineBanner fixed showPendingCount />
    <SplashGate>{children}</SplashGate>
    <InstallPrompt />
  </CommandPaletteProvider>
  ```
  Rationale: `<SplashGate>` needs `useUser()` (Auth0Provider must be an ancestor), can rely on already-mounted error/online providers, and naturally covers the full dashboard tree without per-page wiring. `app/layout.tsx` stays a Server Component.
- **D-05:** Render strategy — `<SplashGate>` always renders `{children}` (the dashboard tree), and conditionally renders `<Splash>` as a sibling overlay with `position: fixed; inset: 0; z-index: 1000`. **Children mount immediately**, so React Suspense, dashboard data hooks, and any `useEffect` fetches start during the splash window (satisfies SPLASH-05). The splash is purely visual, never gates the React tree.
- **D-06:** Z-index = **1000** for the splash overlay, matching bundle `splash.jsx:23`. This is intentionally well below the legacy `BottomSheet.tsx` `zIndex: 8999` and well above the Phase 175 Sheet/backdrop layer (200/201). The bundle's chosen z-index is preserved verbatim. **Document this z-index convention in a comment at the top of `Splash.tsx`** so Phases 178-181 stay below it for in-session UI.
- **D-07:** Unmount lifecycle — once the splash transition completes (phase 3 in the bundle's state machine), `<Splash>` returns `null` AND `<SplashGate>` flips its `ready` state so subsequent renders skip the overlay entirely. The DOM node is removed (no lingering invisible overlay intercepting events). Orchestrator also persists `sessionStorage['ember-glass-splash-shown'] = 'true'` at this moment.

### Trigger / gating rules (SPLASH-01, SPLASH-04)
- **D-08:** Trigger condition — splash mounts when **all** of:
  1. Client has hydrated (component is mounted).
  2. `sessionStorage.getItem('ember-glass-splash-shown') !== 'true'`.
  3. Auth0 `useUser()` returns `{ user: <truthy>, isLoading: false }` — i.e. either a fresh sign-in completed or a session was restored. (If `user` is null AND `isLoading: false`, the user is logged out → middleware will redirect to Auth0; we never show the splash.)
  4. We are NOT in `BYPASS_AUTH` short-circuit OR we are — see D-11.

  When all four conditions hold, the splash plays once. After phase 3 of the animation completes, the sessionStorage flag is set and the splash never re-renders for the remainder of the tab/session.
- **D-09:** Session marker — `sessionStorage` (NOT `localStorage`). Key: `ember-glass-splash-shown`. Value: literal string `'true'`. Reason: `sessionStorage` is per-tab and clears when the tab/window closes, which exactly matches the SC #4 wording "subsequent client-side route changes within the same session never re-trigger the splash". A new tab is a new session and gets a new splash. Closing and reopening the PWA also gets a new splash. Hard-reload within the same tab does NOT — sessionStorage survives reload, which matches the design intent (refreshes are not a fresh "session" entry).
- **D-10:** Race condition — between `useUser()` returning `isLoading: true → false` and component mount, render `null` (no splash, no flicker, no spinner). The dashboard's existing `app/loading.tsx` Suspense skeleton already covers the data-not-ready case underneath. Splash ONLY renders once `user` is truthy and `isLoading` is false. **Do NOT render the splash during `isLoading`** — the bundle assumes auth is settled when the splash plays.
- **D-11:** Bypass mode (`NEXT_PUBLIC_BYPASS_AUTH=true`) — `Auth0Provider` is initialized with `MOCK_USER` (see `ClientProviders.tsx:28-36`), so `useUser()` returns the mock user on first render with `isLoading: false`. The splash plays normally in bypass mode (good for dev UX iteration). No special-casing required.
- **D-12:** Logout coordination — when the user clicks `/auth/logout` (Navbar links), the browser navigates away to Auth0's logout endpoint, which destroys the tab's session and triggers a new tab/session-storage state on return. **Claude's discretion:** If the planner wants belt-and-suspenders, add a one-liner to clear `sessionStorage.removeItem('ember-glass-splash-shown')` before navigating, but it is **not required** — the natural session lifecycle already guarantees the flag clears between logout and re-login.

### Animation sequence (SPLASH-02)
- **D-13:** Phase state machine matches bundle `splash.jsx:5-18` verbatim:
  - `phase=0` (0–600ms): empty stage; flame logo at `scale(0.4)` opacity 0.
  - `phase=1` (600–1500ms): flame at `scale(1)` opacity 1, wordmark "Home" + caption "Connessione al gateway…" fade in (translateY transitions), ambient glow scales to 1.2.
  - `phase=2` (1500–2100ms): flame nudged to `scale(1.08)`, splash root opacity → 0 over 550ms, "Autenticato · Auth0" badge already at opacity 0.7 (in from phase 1).
  - `phase=3` (2100ms+): `<Splash>` returns `null`; orchestrator sets `ready=true`; `onDone()` fires.
  - Timer values: `t1=600`, `t2=1500`, `t3=2100` (ms). All cleared on unmount via `clearTimeout`.
- **D-14:** Authenticato badge (SC-#2 explicitly requires it) — render in absolute-positioned `bottom: 40px; left:0; right:0; text-align: center` with the green dot + `pulse 1.6s infinite` keyframe + label `"Autenticato · Auth0"`. Bundle line 76-88. The `pulse` keyframe is added to `app/globals.css` (the bundle does not show it; standard radial pulse: `0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } 100% { transform: scale(1); opacity: 1 }`). **Claude's discretion:** if a `pulse`/equivalent already exists in `globals.css`, reuse instead of duplicating.
- **D-15:** Wordmark text — literal `"Home"` (NOT `"Pannello Stufa"`). Bundle line 61. SC-#2 says "wordmark 'Home'" verbatim. Caption is literal `"Connessione al gateway…"` (with the ellipsis character `…`, NOT three dots). Italian copy preserved.
- **D-16:** AppShell scale-in (the second SC-#2 phrase "fade-out crossing into a scale-in of the dashboard") — the dashboard layer behind the splash starts at `transform: scale(0.97); opacity: 0` and animates to `scale(1); opacity: 1` over `600ms cubic-bezier(.22,1,.36,1) .1s` (bundle `splash.jsx:98-103`). Implement by giving the dashboard wrapper inside `<SplashGate>` a `style={{ opacity: ready ? 1 : 0, transform: ready ? 'scale(1)' : 'scale(0.97)', transition: 'opacity .6s cubic-bezier(.22,1,.36,1) .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s' }}`. Set `ready=true` when splash hits phase 3 — this overlaps the splash's 550ms fade with the dashboard's 600ms fade-in (= the "crossing" SC requires).

### Reduced-motion (SPLASH-03)
- **D-17:** Detection via `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in `<SplashGate>` on mount, plus a `change` listener so the user can flip the system preference mid-session (rare, but cheap). Result is passed as a `reducedMotion` boolean prop to `<Splash>`. **No external hook library** — write a small inline `useReducedMotion()` hook in `app/components/EmberGlass/SplashGate.tsx` (or co-located if planner prefers a separate file). ~10 LOC.
- **D-18:** Reduced-motion branch — when `reducedMotion === true`, `<Splash>` renders ONE simplified DOM tree:
  - The same root container, but `transition: 'opacity .2s linear'` ONLY (no scale/transform on the root, the flame, the wordmark, or the dashboard wrapper).
  - All four children (flame, wordmark, caption, badge) render at full opacity from t=0 (no staggered fade-in).
  - Phase state machine collapses to two phases: `phase=0` (0–200ms, opacity 1) → `phase=1` (200ms+, opacity 0 → unmount). Single timer at `t=200`.
  - `<SplashGate>` wraps the dashboard children in `style={{ opacity: ready ? 1 : 0, transition: 'opacity .2s linear' }}` — NO `transform`. SC-#3 explicitly: "no scale/transform on either layer".
- **D-19:** Total reduced-motion duration — 200ms (per SC-#3 wording). Honor exactly. No "feel-good" extra padding.

### Non-blocking fetches (SPLASH-05)
- **D-20:** Achieved by the rendering strategy (D-05): the dashboard tree is mounted as a sibling of the splash, so React mounts it, Suspense kicks in, `app/loading.tsx` skeleton renders behind the splash, server components render, client components hydrate, and any `useEffect` / SWR / WebSocket subscription starts — all during the 0–2.1s splash window. By the time the splash unmounts, most cards have already begun (or completed) their first fetch.
- **D-21:** No new "preload" hooks or prefetch plumbing is added in this phase. Existing `useStoveData`, `useNetworkData`, etc. polling hooks fire on mount; their first request begins during the splash window automatically. **The smoke test (SC-#5) verifies this by asserting at least one device API request fires while the splash is still visible** (Playwright network capture between `splash visible` and `splash unmounted`).
- **D-22:** Splash root has `pointerEvents: 'none'` once it begins fading (phase 2+). This is explicit in the bundle (`splash.jsx:28`) and is important so users can begin tapping cards as soon as the splash starts dissolving. Phase 0/1 keep `pointerEvents: 'auto'` to prevent accidental phantom-tap-during-load.

### Phase 174/175 token & primitive reuse
- **D-23:** Use Phase 174 tokens for all visual values — `var(--accent)`, `var(--text-2)`, `var(--font-display)`. Hardcoded colors from the bundle (`#fff`, `#6aa86a`, `#0a0908`, `#1c1917`) **stay hardcoded only where the bundle hardcoded them** (the splash background is `radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)` — bundle line 25 — keep verbatim; the `#6aa86a` green dot is bundle line 83 — keep verbatim). All other colors flow from tokens. The splash is a one-off entry experience and does NOT need accent-color theming for the green status dot.
- **D-24:** Do NOT use `<Pressable>` or `<Sheet>` from Phase 175 — the splash is non-interactive. (`onClick` on a closing splash would be confusing UX.)
- **D-25:** `<AmbientBg>` from Phase 174 keeps running underneath — splash sits at `z-index: 1000`, `<AmbientBg>` lives at `z-index: 0` per Phase 174 D-12. They coexist; no toggling needed.
- **D-26:** Outfit display font — splash wordmark uses `fontFamily: 'var(--font-display)'` per bundle line 53. Phase 174 already has Outfit wired via `next/font`.

### Smoke / verification surface
- **D-27:** Playwright spec at `tests/playwright/splash.spec.ts`:
  - **"SPLASH-01 splash appears post-Auth0"** — sign-in flow (use existing real-Auth0 helper from Phase 51) → assert `[data-testid="splash-overlay"]` is visible within 100ms of dashboard route landing → assert it disappears within ~2300ms.
  - **"SPLASH-02 sequence beats"** — at t≈100ms, flame logo `scale(0.4)`; at t≈800ms, flame at `scale(1)`, wordmark visible; at t≈1700ms, splash root opacity < 1; at t≈2200ms, splash unmounted.
  - **"SPLASH-03 reduced-motion collapse"** — set Playwright `prefersReducedMotion: 'reduce'` → assert no scale transforms on `[data-testid="splash-flame"]` or dashboard wrapper at any sample point → assert splash unmounts by t≈250ms (one 200ms fade + small jitter).
  - **"SPLASH-04 no re-trigger on route change"** — wait for splash to dismiss → click into Stanze → assert splash never re-mounts during navigation. Also: navigate to Automazioni and back to Home — assert the same.
  - **"SPLASH-05 fetches start during splash"** — using Playwright network capture, assert at least one `/api/...` device request fires between `splash mount` and `splash unmount` events. Acceptable: any of `/api/stove/*`, `/api/thermostat/*`, `/api/lights`, `/api/network/*`, `/api/sonos/*` — the smoke does not gate on which.
  - Reuse the `collectConsoleErrors` helper (per memory, established Phase 97 pattern) to assert zero console errors during the splash window.
- **D-28:** Pre-existing VersionEnforcer overlay (per Phase 175 known issue) — Playwright runtime for the splash spec MUST handle it the same way the Phase 175 specs handle it (mock the version endpoint or dismiss the overlay before measurement). Specifics to be settled by the plan agent; flagged here so the plan accounts for it.
- **D-29:** Jest unit tests under `app/components/EmberGlass/__tests__/`:
  - `Splash.test.tsx` — phase state machine timers (use `jest.useFakeTimers()`); `onDone` called at t=2100; reduced-motion branch renders single tree with opacity-only transition; cleanup of timers on unmount.
  - `SplashGate.test.tsx` — sessionStorage flag respected (set → no splash; unset → splash); `useUser()` mocked: loading → no splash, no user → no splash, user present → splash; reduced-motion media query mocked → reduced-motion prop passed to `<Splash>`; sessionStorage written to `'true'` on `onDone`; `ready` state flips to allow children to fade in.
  - `FlameViz.test.tsx` — `on={true}` adds glow box-shadow + animation; `on={false}` removes them; `intensity` prop scales body and tip heights linearly (sample two values).

### Folded Todos
None — `gsd-sdk query todo.match-phase 176` returned 0 matches.

### Claude's Discretion
- Whether `useReducedMotion()` lives in `SplashGate.tsx` or extracts to `lib/hooks/useReducedMotion.ts` for future reuse (e.g., reduced-motion handling in Phase 177+ glass cards). Lean toward extracting if planner sees a 2nd consumer in 177-181 scope.
- Whether to add `data-testid="splash-overlay"`, `data-testid="splash-flame"`, etc. attributes to make Playwright selectors stable. **Recommend yes** — the SPLASH-02 spec needs deterministic selectors during the animation, and CSS-class-based selection is fragile when transforms are mid-flight.
- Whether the `pulse` keyframe goes in `app/globals.css` (declarative) or inline as a styled element (functional). Lean `globals.css` to match the existing `flamePulse`/ambient keyframes convention.
- Whether `<SplashGate>` exposes a `forceShow` test prop. Useful for the design-system-v2 page demo. **Recommend yes** — `/debug/design-system-v2` should add a "Replay splash" button (sets sessionStorage off + remounts) for visual regression checking. Bonus, not gated on SC.
- Whether `app/loading.tsx` skeleton needs any adjustment so it isn't visible flickering through the splash. **No** — splash is opaque (`#1c1917`/`#0a0908` background) and covers it entirely; no adjustment needed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §SPLASH-01..SPLASH-05 (lines 32-36) — Five locked acceptance criteria.
- `.planning/ROADMAP.md` §"Phase 176: Post-Auth0 Splash Animation" (lines 84-95) — Goal + 5 success criteria. SC-#2 locks the exact animation sequence; SC-#3 locks reduced-motion (200ms fade, no transform); SC-#4 locks session-once; SC-#5 locks non-blocking fetches.

### Source Design Bundle (PRIMARY visual + behavior source)
- `.planning/inbox/ember-glass-design/project/components/splash.jsx` lines 1-111 — **Authoritative** splash + AppShell components. Phase implements as a TS port; constants (timer ms, transforms, colors, copy) are lifted verbatim.
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 109-129 — Authoritative `FlameViz` source. Lift verbatim into `EmberGlass/FlameViz.tsx`.
- `.planning/inbox/ember-glass-design/project/Design System.html` line 876 — One-line splash spec ("logo fiamma scala 0.8→1 in 600ms, poi fade-out 400ms mentre la dashboard scala 1.04→1") — note the bundle's `splash.jsx` itself (final source) uses `0.4→1` then `1.08` — when there's a conflict, **`splash.jsx` is the source of truth, not the HTML doc**.

### Prior Phase Decisions
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` — D-01..D-19; tokens (`--accent`, `--text-2`, `--font-display`), `EmberGlass/` namespace, inline-style convention for v2 primitives.
- `.planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md` line 319 — Splash explicitly listed as out-of-scope-for-174 / scope-for-176.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — D-13 z-index policy: "z-index 200/201 reserved" — Phase 176 splash chose **1000** (above sheet stack) per bundle. Document tension: in-app sheets opening during splash would be impossible, but no UX flow opens a sheet during splash anyway. D-15 explicitly defers reduced-motion handling to Phase 176 — this phase delivers it.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` D-17 — VersionEnforcer overlay is a known Playwright blocker; Phase 176 splash spec must handle it (D-28 above).

### Existing Codebase Touchpoints
- `app/components/ClientProviders.tsx` lines 47-71 — Where `<SplashGate>` mounts. `Auth0Provider` already wraps the tree (line 51) so `useUser()` is available. Bypass mode (line 28-36) injects mock user.
- `app/layout.tsx` lines 35-83 — Server Component; do NOT add splash logic here. `<AmbientBg>` (line 60) sits behind `<ClientProviders>`; splash sits at z-index 1000, above ambient and dashboard.
- `app/page.tsx` — Existing dashboard route; `<Suspense fallback={<DashboardSkeleton />}>` (line 11) keeps working under the splash overlay.
- `app/loading.tsx` lines 1-54 — Existing dashboard Suspense skeleton; remains as the per-route loading state. Splash and skeleton co-exist (skeleton renders behind splash during the 0–2.1s window if data isn't ready).
- `app/components/EmberGlass/index.ts` — Add `Splash`, `SplashGate`, `FlameViz` re-exports.
- `app/components/EmberGlass/AmbientBg.tsx` — Sibling primitive; same inline-style convention.
- `app/components/EmberGlass/Pressable.tsx` / `Sheet.tsx` — Phase 175 primitives; NOT consumed by splash.
- `app/components/Navbar.tsx` line 478, 668 — Logout link `/auth/logout`; D-12 references this.
- `lib/auth0.ts` lines 1-30 — Server-side Auth0 client + `MOCK_SESSION` for `BYPASS_AUTH=true`. Splash relies on the corresponding client-side `Auth0Provider` mock-user wiring in `ClientProviders.tsx`.
- `app/globals.css` — Add `pulse` keyframe (D-14) if not already present. Phase 174 `flamePulse` keyframe (used by `FlameViz`) is already there per Phase 174 D-12 / cards bundle expectations — verify.
- `package.json` — `@auth0/nextjs-auth0` is already a dependency. No new package needed.

### Patterns
- `app/components/EmberGlass/AmbientBg.tsx` — `'use client'` provider mounted from layout, inline-style, `EmberGlass/` namespace; the model for `<SplashGate>`.
- `app/components/ui/BottomSheet.tsx` lines 50-67 — body scroll-lock pattern (NOT used here; mentioned because Phase 175 D-11 cited it).
- Phase 97 (`tests/playwright/`) — `collectConsoleErrors` helper convention for E2E specs.
- Phase 51 — Real-Auth0 + session-caching helper for Playwright sign-in flow; reuse for SPLASH-01 spec.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useUser()` from `@auth0/nextjs-auth0/client`** — already wired via `Auth0Provider` in `ClientProviders.tsx`. SplashGate consumes it directly: `const { user, isLoading } = useUser();`. Returns mock user instantly under `BYPASS_AUTH=true`.
- **`Auth0Provider` mock-user fallback** (`ClientProviders.tsx:28-36`) — `MOCK_USER` is passed when `NEXT_PUBLIC_BYPASS_AUTH=true`. Splash plays normally in dev.
- **Phase 174 CSS tokens** — `var(--accent)`, `var(--text-2)`, `var(--font-display)` available globally via `app/globals.css` `:root` block. Splash inline styles consume these directly.
- **Phase 174 `<AmbientBg>`** — already mounted in `app/layout.tsx:60`; runs behind splash; no coordination required.
- **`flamePulse` keyframe** — used by `FlameViz` (bundle line 120, 126); must exist in `app/globals.css` (Phase 174 area). Plan agent should verify and add if missing.
- **`/auth/profile` route + Navbar `useUser` flow** — already establishes that the client knows when auth has settled; no parallel infrastructure required.

### Established Patterns
- **`'use client'` for state-bearing components** — `<SplashGate>`, `<Splash>`, `<FlameViz>` all start with `'use client'` (state, effects, animation timers). `app/layout.tsx` stays a Server Component.
- **Inline `style` for `EmberGlass/` v2 primitives** — Phase 174 D-12, Phase 175 D-08 establish the convention: bundle visuals lifted via inline style, not Tailwind classes. Splash follows the same convention because the bundle uses inline styles for the timing-critical animation values.
- **Tests colocated under `__tests__/`** — Jest specs in `app/components/EmberGlass/__tests__/`, Playwright in `tests/playwright/`. Both already established by Phases 174 + 175.
- **`forwardRef` for primitives** — Phase 175 D-04. Apply if any future imperative use is plausible. **Splash specifically:** no need for ref; orchestrator drives via props. **FlameViz:** also no ref needed in Phase 176 scope; Phase 177 may want one — planner's call. **SplashGate:** no ref.
- **`data-testid` attributes for Playwright selectors** — pattern from earlier phases; recommend adding `data-testid="splash-overlay"`, `data-testid="splash-flame"`, `data-testid="splash-wordmark"`, `data-testid="splash-badge"`, `data-testid="dashboard-wrapper"` for the SC-#2 spec timeline assertions.

### Integration Points
- `app/components/ClientProviders.tsx` — single edit: wrap `{children}` with `<SplashGate>`.
- `app/components/EmberGlass/index.ts` — three new exports.
- `app/globals.css` — possibly one new keyframe (`pulse`); verify.
- `tests/playwright/splash.spec.ts` — new spec.
- `app/components/EmberGlass/__tests__/Splash.test.tsx`, `SplashGate.test.tsx`, `FlameViz.test.tsx` — three new Jest specs.
- No changes to `app/page.tsx`, `app/loading.tsx`, `app/layout.tsx`, `Navbar.tsx`, any device hook, any API route.

</code_context>

<specifics>
## Specific Ideas

- **Splash text is Italian and literal:** wordmark `Home`, caption `Connessione al gateway…`, badge `Autenticato · Auth0`. Use the typographically correct ellipsis `…` (U+2026), not three periods, and the middle dot `·` (U+00B7), not a hyphen.
- **Splash background is a near-black radial gradient** (`#1c1917 → #0a0908`), not the page's normal `bg-slate-900`. This intentionally hides any content behind the splash until the fade. Bundle verbatim.
- **Per-session, per-tab.** A user opening the PWA in two tabs sees the splash twice (once per tab). A user closing and reopening the PWA sees it again. A user navigating Home → Stanze → Automazioni does NOT see it again until the tab closes.
- **Bypass dev experience.** With `NEXT_PUBLIC_BYPASS_AUTH=true`, the splash plays normally on first load and doesn't replay on hot-module-reload (sessionStorage survives HMR). Devs iterating on splash visuals should clear sessionStorage manually OR use the recommended `/debug/design-system-v2` "Replay splash" button (Claude's discretion).
- **`FlameViz` is reused by Phase 177's StoveCard** (DASH-02). Phase 176 ships it cleanly so Phase 177 just imports.
- **Crossfade timing is exact:** splash starts fading at t=1500ms over 550ms; dashboard begins scale-in at the same t=1500ms over 600+100ms-delay. The 50ms overlap is the documented "crossing" feel.
- **No swipe / no skip button.** The splash is non-interactive. SC-#2 wall time is ~2s; that's fast enough that adding a skip would be ceremony.
- **Reduced-motion is a hard 200ms fade.** No staggered children, no transforms, no scale on dashboard. Crisp accessibility win.

</specifics>

<deferred>
## Deferred Ideas

- **Apple PWA static splash images** — `app/components/AppleSplashScreens.tsx` ships iOS launch images for the standalone PWA install. Out of scope; this phase ships the **post-launch animated** splash, not the **pre-launch native** splash.
- **Light-mode splash variant** — milestone is dark-first per Phase 174 D-12. No light-mode work in v20.0.
- **Connection diagnostics during splash** — caption "Connessione al gateway…" is decorative copy; we do not actually probe the gateway during the 2.1s window. If a future phase wants to surface a real "Gateway: 127ms" pill during the splash, that's polish.
- **Splash skip / abort UX** — no escape hatch in this phase. If a future user-research phase finds users are bothered, add a 1-press skip later.
- **Splash for new device additions** (e.g., a "Setup complete" splash). Different problem; different phase.
- **Reusable `<SessionOnceOverlay>` primitive** for future onboarding/changelog overlays. Don't generalize until a second consumer exists.
- **Animated logo morphing** to a final navbar/branding mark — out of scope. Splash unmounts cleanly to dashboard.
- **Telemetry: "splash duration" Web Vital** — could be useful (does the splash mask a slow first paint?). Out of v20.0 scope; potential follow-up under v9.0 perf milestone.
- **Migration of legacy `app/loading.tsx`** — kept as Suspense fallback. Replacing it with a glass-themed skeleton is a future phase.
- **Theming the splash via accent picker** — current decision: no. Splash uses a fixed dark gradient + accent only on the ambient glow. Future polish phase if requested.

</deferred>

---

*Phase: 176-post-auth0-splash-animation*
*Context gathered: 2026-04-27*
