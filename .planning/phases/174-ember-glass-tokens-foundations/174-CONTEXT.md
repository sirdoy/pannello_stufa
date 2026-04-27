# Phase 174: Ember Glass Tokens & Foundations - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** `--auto --chain` — all decisions auto-resolved with recommended defaults grounded in REQUIREMENTS.md, ROADMAP.md success criteria, and the inbox design bundle.

<domain>
## Phase Boundary

Establish the **Ember Glass design language as a CSS custom property token system** that will drive every surface introduced during v20.0 (cards, sheets, splash, room chips, automations editor, design-system reference page).

In scope:
- Define the 11 token CSS variables on `:root` (DS-01)
- Wire fonts (Outfit display, Inter body) via `next/font` to `--font-display` / `--font-body` (DS-04)
- Build a `/debug` accent picker for 6 oklch hues with live `--accent` swap (DS-03)
- Add ambient radial glow with localStorage-persisted toggle (DS-05)
- Apply `backdrop-filter` with WebKit prefix + `@supports not` graceful degradation (DS-06)
- Audit existing component files: zero hardcoded glass/blur/accent hex values when tokens are introduced (DS-02)

Out of scope (future phases):
- Migrating existing components to consume the new tokens — Phases 175+ handle that.
- Card press animation primitive (DS-07) — Phase 175.
- Sheet primitive, splash animation, dashboard cards, room/automation tabs, design-system reference page.
- Removing legacy Ember Noir tokens (`--color-ember-*`, `--color-flame-*` etc.) — these stay during v20.0 to avoid breaking unmigrated components.

</domain>

<decisions>
## Implementation Decisions

### Token Definition (DS-01, DS-02)
- **D-01:** Define all 11 Ember Glass tokens in `app/globals.css` on `:root`, in a dedicated `/* ===== EMBER GLASS TOKENS ===== */` block placed AFTER the existing Ember Noir `@theme` block. Reason: `globals.css` is the canonical token source and Tailwind v4 already loads it; no separate `tokens.css` needed.
- **D-02:** Token values lifted verbatim from the design bundle (`.planning/inbox/ember-glass-design/project/components/app.jsx` lines 101-111):
  - `--glass-bg: rgba(255, 255, 255, 0.04);`
  - `--glass-blur: 24px;` (default — design bundle slider range 8-40px confirmed)
  - `--glass-border: rgba(255, 255, 255, 0.08);`
  - `--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.03);`
  - `--accent: oklch(0.68 0.17 45);` (Copper default, DS-03)
  - `--text-1: #f5f5f4;` (matches existing `--color-slate-100`)
  - `--text-2: rgba(245, 245, 244, 0.55);`
  - `--r-card: 24px;` (design bundle slider 16-32px, 24 is default)
  - `--pad-card: 16px;` (medium density default)
  - `--font-display: var(--font-display-outfit), system-ui, sans-serif;`
  - `--font-body: var(--font-body-inter), system-ui, sans-serif;`
- **D-03:** Coexistence policy — Ember Glass tokens are ADDITIVE. Do NOT remove or rename existing `--color-ember-*`, `--color-flame-*`, `--color-slate-*` tokens. Migration of legacy components is out of scope for this phase; later v20.0 phases will replace usages and a final cleanup phase removes dead tokens.
- **D-04:** Hardcoded-value audit (DS-02) is **scoped to NEW glass surfaces only**. The grep verification passes if zero new component files added during v20.0 contain hardcoded glass/blur/accent hex values. Existing Ember Noir components keep their hardcoded values until they are migrated in later phases (and those migrations carry the audit themselves).

### Accent Hue System (DS-03)
- **D-05:** Six oklch hue presets exposed (success criterion #2 explicitly enumerates these 6, NOT the 7 in the design bundle):
  - Copper `oklch(0.68 0.17 45)` — default
  - Rose `oklch(0.68 0.17 0)`
  - Violet `oklch(0.65 0.17 290)`
  - Blue `oklch(0.65 0.14 230)` (matches design bundle "Ocean")
  - Green `oklch(0.68 0.12 150)` (matches design bundle "Sage")
  - Amber `oklch(0.76 0.15 75)`
- **D-06:** Accent picker lives at `/debug/design-system-v2` — created fresh as the v20.0 design-system reference page, separate from the legacy `/debug/design-system` (which documents Ember Noir and stays untouched). The picker is also embedded in `/debug/page.tsx` as an inline toolbar so it surfaces from the existing debug index.
- **D-07:** Picker mechanism — clicking a hue swatch calls `document.documentElement.style.setProperty('--accent', value)` for live update, and persists the chosen value in `localStorage` under key `ember-glass-accent` so the override survives page reloads within the dev session. Not gated by env — accessible in both dev and prod (matches DS-03 wording "developer toolbar" but no env gate).
- **D-08:** No SSR rendering of the persisted accent — the override applies on client hydration via a small inline script in `app/layout.tsx` (`<script dangerouslySetInnerHTML>`) that runs before paint to avoid an accent flash. Pattern lifted from existing theme-removal phase 149 hydration approach.

### Typography (DS-04)
- **D-09:** Replace `Space_Grotesk` with `Inter` in `app/fonts.ts`. Outfit stays as the display font.
- **D-10:** Both fonts are already configured as CSS variable fonts via `next/font/google` (`variable: '--font-display'` / `variable: '--font-body'`). Keep that pattern — but rename the underlying variables to disambiguate from the new design tokens:
  - `next/font` outputs `--font-display-outfit` and `--font-body-inter` (the raw font-family CSS vars)
  - `globals.css` Ember Glass token block aliases `--font-display: var(--font-display-outfit), system-ui, sans-serif;` and `--font-body: var(--font-body-inter), system-ui, sans-serif;`
  - This keeps the public token API stable while letting `next/font` own the actual `@font-face` declarations.
- **D-11:** Verify zero `fonts.googleapis.com` requests via Playwright network assertion in the design-system test added in this phase (success criterion #3). No Google CDN fallback URL anywhere in source.

### Ambient Glow (DS-05)
- **D-12:** Implement as a fixed-position `<div>` with three radial-gradients absolute-positioned underneath the app shell, animations lifted from design bundle (`ambientA 14s`, `ambientB 18s`, `ambientC 22s` keyframes). Layer sits at `z-index: 0` behind app content (`z-index: 1+`).
- **D-13:** Toggle exposed in the same `/debug/design-system-v2` toolbar as the accent picker. Persists to `localStorage` key `ember-glass-ambient` (boolean).
- **D-14:** Default state — **OFF on first visit** (no localStorage entry). User opts in. Reason: ambient costs paint frames continuously; better not to default-enable for users who don't know about it.
- **D-15:** Hard-reload survival (success criterion #4) — read localStorage on client mount in a top-level `<AmbientBg>` provider component mounted from `app/layout.tsx`. Same inline-script pre-paint pattern as accent (D-08) to avoid flash.

### Backdrop Filter & Fallback (DS-06)
- **D-16:** Glass surfaces apply: `backdrop-filter: blur(var(--glass-blur)) saturate(180%); -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);` — both prefixed and unprefixed for Safari < TP.
- **D-17:** Fallback strategy via `@supports not (backdrop-filter: blur(1px))` block: surfaces fall back to a solid translucent background `background: rgba(28, 25, 23, 0.92);` (matches `--color-slate-900` at 92% opacity). The fallback is defined as a Tailwind v4 utility class `glass-surface` in `globals.css` so all glass primitives in later phases consume it.
- **D-18:** No `glass-surface` utility usage in this phase beyond the design-system-v2 reference page demo. Other phases adopt it.

### Reference / Verification Surface
- **D-19:** Phase 174 ships only the **token plumbing + a minimal `/debug/design-system-v2` page** that demonstrates each token live (a token grid + accent picker + ambient toggle + a single `glass-surface` demo card). Full design-system reference page (DSREF-01..DSREF-04 requirements) lands in a later v20.0 phase.

### Folded Todos
None — todo cross-reference returned no matches for phase 174.

### Claude's Discretion
- Exact React component structure of `/debug/design-system-v2` page (single file vs co-located client components) — planner decides.
- Whether the inline pre-paint script is colocated in `layout.tsx` or extracted to a helper — planner decides.
- Naming of the `<AmbientBg>` provider component file path — planner decides (suggest `app/components/EmberGlass/AmbientBg.tsx`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §DS-01..DS-06 — Locked acceptance criteria for this phase.
- `.planning/ROADMAP.md` §"Phase 174" lines 52-63 — Goal + 5 success criteria.

### Source Design Bundle (PRIMARY visual + token source)
- `.planning/inbox/ember-glass-design/README.md` — Bundle handoff instructions.
- `.planning/inbox/ember-glass-design/chats/chat1.md` — Full user/designer iteration transcript; intent and rationale.
- `.planning/inbox/ember-glass-design/project/components/app.jsx` lines 5-13, 101-111, 175-200 — Authoritative oklch hue values, CSS variable definitions, ambient gradient keyframes.
- `.planning/inbox/ember-glass-design/project/Design System.html` — Standalone design-system reference HTML (target visual for `/debug/design-system-v2`).

### Existing Codebase Touchpoints
- `app/globals.css` — Where new `:root` Ember Glass token block lands (after existing `@theme` block).
- `app/fonts.ts` — Replace `Space_Grotesk` with `Inter`; preserve `next/font` `variable:` pattern.
- `app/layout.tsx` — Mount inline pre-paint script + `<AmbientBg>` provider here.
- `app/debug/design-system/` — Existing Ember Noir reference page; DO NOT modify in this phase. The new `app/debug/design-system-v2/` is a sibling.
- `docs/design-system.md` — Existing Ember Noir documentation. NOT updated in this phase; later v20.0 phase will rewrite/replace.

### Architecture / Patterns
- Phase 149 (`.planning/phases/149-theme-removal-core/`) — Inline pre-paint script pattern for theme/accent persistence without flash.
- Phase 70 (`.planning/phases/70-*`) — `next/font` self-hosting baseline already in place; this phase only swaps font family.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`next/font/google` pipeline (`app/fonts.ts`)** — Already configured for Outfit + a body font. Swap body font import only; preserve the `variable:` CSS-var-output pattern.
- **`app/globals.css` `@theme` block** — Tailwind v4 token surface. Add a sibling `/* ===== EMBER GLASS TOKENS ===== */` `:root` block; no Tailwind config changes needed.
- **`app/debug/page.tsx` + sibling pages** — Established pattern for adding new debug surfaces. New `app/debug/design-system-v2/page.tsx` slots in.
- **Phase 149 inline-script pattern** — Reuse the pre-paint `<script dangerouslySetInnerHTML>` approach in `app/layout.tsx` for accent + ambient localStorage hydration.

### Established Patterns
- **Client components for interactive state** — `'use client'` at the top of any picker/toolbar component. Phase 174's accent picker + ambient toggle are client-side.
- **CSS custom properties cascading from `:root`** — All design tokens in this codebase live on `:root` via `globals.css`; never inline `<style>` overrides at component level except for runtime token override (the accent picker's `setProperty` call is the explicit exception).
- **localStorage keys are kebab-case, scoped by feature** — Use `ember-glass-accent` and `ember-glass-ambient`. Do NOT pollute the existing `theme`/`stove-*` namespace.
- **`'use client'` boundary at provider level** — Top-level providers (e.g., AmbientBg) live in dedicated files mounted from `app/layout.tsx`, not inline in `layout.tsx` itself (which stays a Server Component).

### Integration Points
- `app/layout.tsx` — Imports `next/font` instances → applies `${outfit.variable} ${inter.variable}` to `<html>` className → mounts `<AmbientBg>` provider as the FIRST child of `<body>` so it sits behind all content.
- `app/globals.css` — Loaded once via `app/layout.tsx`; this is where the `:root` Ember Glass token block + `@supports not` fallback + ambient gradient keyframes live.
- `app/debug/page.tsx` — Add a single nav link to `/debug/design-system-v2` so the reference surface is reachable.

</code_context>

<specifics>
## Specific Ideas

- The design bundle's `app.jsx` (lines 5-13) defines 7 hues; success criterion #2 in ROADMAP locks **exactly 6**. Ship the 6 named in the requirement: copper, rose, violet, blue, green, amber. The bundle's "Coral" is dropped to avoid presenting a 7th option that contradicts the SC.
- The bundle's "Ocean" maps to the requirement's "Blue" (oklch hue 230) and "Sage" maps to "Green" (hue 150). Use the requirement names in code (`copper`, `rose`, `violet`, `blue`, `green`, `amber`) for clarity.
- Default accent is **Copper** (the signature ember). Confirmed by both bundle (line 7 comment "the signature ember") and by milestone goal language ("Ember Glass").
- The accent picker is described in DS-03 as a "developer toolbar in `/debug`" — interpret as: live in the new `/debug/design-system-v2` page, AND surface a link/toggle from `/debug/page.tsx`. No production-user-facing UI for accent choice in this phase.
- Default ambient glow is OFF — user opts in. This matches the design bundle's tweaks panel where the user explicitly toggles `ambient: true`, and avoids burning paint frames for users who never visit the toolbar.

</specifics>

<deferred>
## Deferred Ideas

- **Production-facing accent picker** — Letting end users choose accent themes outside `/debug`. Belongs to a future polish phase, not v20.0 scope.
- **Migration of legacy Ember Noir components to glass tokens** — Out of phase 174 scope; handled phase-by-phase as components are redesigned.
- **Removal of legacy `--color-ember-*` / `--color-flame-*` / `--color-slate-*` tokens** — Final v20.0 cleanup phase.
- **Full design-system reference page** (DSREF-01..DSREF-04 requirements) — Later v20.0 phase. Phase 174 ships only a minimal `/debug/design-system-v2` token-demo page.
- **Card press animation utility** (DS-07) — Phase 175.
- **Container queries / responsive token variations** — Not requested; do not introduce.
- **Light-mode token variants** — Not in milestone scope (Ember Glass is dark-first per design bundle).

</deferred>

---

*Phase: 174-ember-glass-tokens-foundations*
*Context gathered: 2026-04-27*
