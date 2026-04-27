---
phase: 174-ember-glass-tokens-foundations
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/fonts.ts
  - app/globals.css
autonomous: true
requirements: [DS-01, DS-04, DS-06]
tags: [design-tokens, css-variables, next-font, backdrop-filter, ember-glass]

must_haves:
  truths:
    - ":root exposes 11 Ember Glass tokens (--glass-bg, --glass-blur, --glass-border, --glass-shadow, --accent, --text-1, --text-2, --r-card, --pad-card, --font-display, --font-body)"
    - "Outfit (display) loads via next/font under variable --font-display-outfit"
    - "Inter (body) loads via next/font under variable --font-body-inter"
    - "--font-display and --font-body alias the next/font outputs (no literal 'Outfit'/'Space Grotesk' strings win)"
    - ".glass-surface utility consumes the glass tokens with backdrop-filter + -webkit-backdrop-filter"
    - "@supports not block falls back to solid translucent background when backdrop-filter unsupported"
    - "Three ambient keyframes (ambientA 14s, ambientB 18s, ambientC 22s) are defined"
  artifacts:
    - path: "app/fonts.ts"
      provides: "Outfit + Inter exports with renamed CSS variables (--font-display-outfit, --font-body-inter)"
      contains: "Inter, --font-display-outfit, --font-body-inter"
    - path: "app/globals.css"
      provides: ":root Ember Glass token block, .glass-surface utility, @supports not fallback, ambient keyframes"
      contains: "--glass-bg:, --glass-blur:, --accent:, .glass-surface, @supports not, @keyframes ambientA"
  key_links:
    - from: "app/fonts.ts"
      to: "app/globals.css"
      via: "variable name aliasing (--font-display-outfit feeds --font-display)"
      pattern: "var\\(--font-display-outfit\\)"
    - from: ":root --accent"
      to: ".glass-surface and downstream consumers"
      via: "CSS custom property cascade"
      pattern: "var\\(--accent\\)"
---

<objective>
Establish the Ember Glass token foundation: rewire `app/fonts.ts` to swap Space_Grotesk → Inter and rename both `next/font` `variable:` outputs (D-09, D-10), then append the canonical Ember Glass `:root` block + `.glass-surface` utility + `@supports not` fallback + ambient keyframes to `app/globals.css` (D-01, D-02, D-16, D-17).

Purpose: Every later v20.0 phase consumes these tokens. Get the cascade right (new `:root` placed AFTER `@theme` so font-family aliases win), get the WebKit prefix right (Pitfall 4), get the `glass-surface` fallback right so degraded browsers stay legible.

Output: Updated `app/fonts.ts` (Inter swapped in, variables renamed) + extended `app/globals.css` (one new `:root` block, one `@layer components` rule, one `@supports not` block, three keyframes).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md
@.planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md
@.planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md
@.planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md
@.planning/phases/174-ember-glass-tokens-foundations/174-VALIDATION.md
@CLAUDE.md
@app/fonts.ts
@app/globals.css

<interfaces>
<!-- Existing app/fonts.ts pattern (verbatim, lines 1-17): -->
```typescript
import { Outfit, Space_Grotesk } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
```

<!-- Existing globals.css @theme font declarations (lines 209-211, INSIDE @theme block, kept untouched per D-03 additive policy — new :root block AFTER @theme overrides via cascade): -->
```css
--font-display: 'Outfit', system-ui, sans-serif;
--font-body: 'Space Grotesk', system-ui, sans-serif;
```

<!-- Existing convention for glass utilities (globals.css lines 1029-1034): -->
```css
@layer components {
  .glass-dark {
    background: rgba(28, 25, 23, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Swap body font Space_Grotesk → Inter and rename next/font CSS variables (D-09, D-10)</name>
  <files>app/fonts.ts</files>
  <read_first>
    - app/fonts.ts (current state — same-file edit; lines 1-17 are the entire file)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md §"Typography (DS-04)" D-09 + D-10
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"app/fonts.ts (config modify)"
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Pitfall 6: Outfit Variable Already Named --font-display" (rename is mandatory to avoid recursive var)
  </read_first>
  <action>
Replace the contents of `app/fonts.ts` with EXACTLY this code (verbatim — copy each option key from the existing file; only change the body font import and the two `variable:` strings):

```typescript
import { Outfit, Inter } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display-outfit',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
```

Reasoning:
- `Inter` replaces `Space_Grotesk` (D-09). Outfit stays.
- `outfit.variable` renames from `'--font-display'` → `'--font-display-outfit'` (D-10) so `globals.css` can alias `--font-display: var(--font-display-outfit), …` without recursion (Pitfall 6).
- `inter.variable` is `'--font-body-inter'` (D-10) so `globals.css` can alias `--font-body: var(--font-body-inter), …`.
- Keep `subsets`, `display`, `preload`, `adjustFontFallback` identical to current pattern.
- The named export `spaceGrotesk` is REMOVED. The new export name is `inter`. `app/layout.tsx` (modified in Plan 02) updates the import accordingly.

Do NOT add Google CDN URLs anywhere. Do NOT remove `next/font/google` (this is the self-host pipeline per D-04 / DS-04).
  </action>
  <verify>
    <automated>node -e "const f = require('fs').readFileSync('app/fonts.ts','utf8'); if(!f.includes(\"import { Outfit, Inter } from 'next/font/google'\")) {console.error('Inter import missing'); process.exit(1)} if(f.includes('Space_Grotesk')) {console.error('Space_Grotesk still present'); process.exit(1)} if(!f.includes(\"variable: '--font-display-outfit'\")) {console.error('--font-display-outfit not set'); process.exit(1)} if(!f.includes(\"variable: '--font-body-inter'\")) {console.error('--font-body-inter not set'); process.exit(1)} console.log('OK')"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "Space_Grotesk" app/fonts.ts` returns 0
    - `grep -c "spaceGrotesk" app/fonts.ts` returns 0
    - `grep -c "import { Outfit, Inter }" app/fonts.ts` returns 1
    - `grep -c "variable: '--font-display-outfit'" app/fonts.ts` returns 1
    - `grep -c "variable: '--font-body-inter'" app/fonts.ts` returns 1
    - `grep -c "export const inter = Inter" app/fonts.ts` returns 1
    - `grep -c "export const outfit = Outfit" app/fonts.ts` returns 1
    - `grep -c "fonts.googleapis.com" app/fonts.ts` returns 0
  </acceptance_criteria>
  <done>
    - `app/fonts.ts` declares exactly two exports: `outfit` (Outfit, variable `--font-display-outfit`) and `inter` (Inter, variable `--font-body-inter`).
    - Body font is Inter; Outfit retained as display.
    - Both fonts use `next/font/google` (no manual @font-face, no Google CDN strings).
  </done>
</task>

<task type="auto">
  <name>Task 2: Append Ember Glass :root block + .glass-surface utility + @supports fallback + ambient keyframes to globals.css (D-01, D-02, D-16, D-17)</name>
  <files>app/globals.css</files>
  <read_first>
    - app/globals.css (locate the closing `}` of the existing `@theme {}` block — per PATTERNS.md, after line 300; existing `@theme` font declarations at lines 209-211 stay UNTOUCHED per D-03 additive policy)
    - .planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md D-01, D-02, D-03, D-16, D-17
    - .planning/phases/174-ember-glass-tokens-foundations/174-RESEARCH.md §"Pattern 4: @supports Feature Query" + §"Pattern 5: Tailwind v4 Custom Utility" + §"Pitfall 1: @theme Token Conflict"
    - .planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md §"Color → Keyframe transforms (canonical)" (transforms verified from `Pannello Stufa - Redesign.html:46-57`, supersedes RESEARCH A1)
    - .planning/phases/174-ember-glass-tokens-foundations/174-PATTERNS.md §"app/globals.css (CSS modify)" (insertion point + existing `@layer components` glass-dark precedent at lines 1029-1034)
  </read_first>
  <action>
Append the following block to `app/globals.css` immediately AFTER the closing `}` of the existing `@theme { ... }` block (per D-01 — placement after `@theme` is mandatory so the new `:root` declarations override the literal-string font-family declarations at lines 209-211 via cascade order; see RESEARCH.md Pitfall 1).

DO NOT remove or edit the existing `@theme` declarations (D-03: additive only). DO NOT touch the existing `@layer components` `glass-dark` / `glass-vibrancy` / `glass-shine` utilities (kept intact).

Append this block VERBATIM:

```css
/* ===== EMBER GLASS TOKENS (Phase 174 — DS-01, DS-02, DS-04, DS-06) ===== */
/* Placed AFTER the @theme block so cascade overrides legacy --font-display/-body bindings. */
:root {
  /* Glass surface tokens (D-02, lifted from .planning/inbox/ember-glass-design/project/components/app.jsx:101-111) */
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-blur: 24px;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.03);

  /* Accent — runtime-overridable via setProperty + inline pre-paint script (D-07, D-08); 6 oklch presets in /debug/design-system-v2 (D-05) */
  --accent: oklch(0.68 0.17 45);

  /* Text */
  --text-1: #f5f5f4;
  --text-2: rgba(245, 245, 244, 0.55);

  /* Geometry */
  --r-card: 24px;
  --pad-card: 16px;

  /* Typography — alias next/font CSS-var outputs to public token names (D-10) */
  --font-display: var(--font-display-outfit), system-ui, sans-serif;
  --font-body:    var(--font-body-inter),    system-ui, sans-serif;
}

/* Glass surface utility (D-16) — single consumer of the four glass tokens; pattern follows existing glass-dark @layer components precedent at globals.css:1029-1034 */
@layer components {
  .glass-surface {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--r-card);
  }
}

/* Backdrop-filter fallback (D-17, DS-06) — covers both unprefixed and -webkit- prefix cases; rgba(28,25,23,0.92) matches --color-slate-900 at 92% opacity */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface {
    background: rgba(28, 25, 23, 0.92);
  }
}

/* Ambient keyframes (DS-05) — transforms canonical from .planning/inbox/ember-glass-design/project/Pannello Stufa - Redesign.html:46-57 (supersedes RESEARCH A1) */
@keyframes ambientA {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(40px, 30px) scale(1.15); }
}
@keyframes ambientB {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(-30px, -40px) scale(1.1); }
}
@keyframes ambientC {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  50%      { transform: translate(20px, -20px) scale(1.2); opacity: 0.6; }
}

/* Reduced-motion guard (UI-SPEC §"Reduced-motion contract") */
@media (prefers-reduced-motion: reduce) {
  .ember-ambient-blob { animation: none !important; }
}
```

Verbatim values are mandatory (D-02 lifts these from the design bundle). The `--accent` Copper default is oklch(0.68 0.17 45). The `glass-surface` fallback color `rgba(28, 25, 23, 0.92)` is allowed (audit exception — that IS the fallback). No other hardcoded glass/blur/accent hex values may be added in this file beyond what is shown here.

Note on the keyframes: blob A drift is `translate(40px, 30px) scale(1.15)` (NOT 60px as the early RESEARCH A1 assumption suggested). UI-SPEC Color section §"Keyframe transforms (canonical)" verified these from the design bundle's `Pannello Stufa - Redesign.html:46-57`.

The class name `.ember-ambient-blob` is the class the AmbientBg provider (Plan 02) will apply to its three rendered `<div>`s; declaring the reduced-motion guard here colocates the motion contract with the keyframes.
  </action>
  <verify>
    <automated>bash -c "set -e; grep -E '^\s+--(glass-bg|glass-blur|glass-border|glass-shadow|accent|text-1|text-2|r-card|pad-card|font-display|font-body):' app/globals.css | wc -l | awk '{if(\$1<11){print \"FAIL: only \"\$1\" tokens found, expected >=11\"; exit 1} else {print \"OK: \"\$1\" tokens\"}}'"</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "EMBER GLASS TOKENS" app/globals.css` returns at least 1
    - `grep -E "^\s+--glass-bg: rgba\(255, 255, 255, 0\.04\);" app/globals.css` matches at least 1 line
    - `grep -E "^\s+--glass-blur: 24px;" app/globals.css` matches at least 1 line
    - `grep -E "^\s+--accent: oklch\(0\.68 0\.17 45\);" app/globals.css` matches at least 1 line
    - `grep -E "^\s+--font-display: var\(--font-display-outfit\)" app/globals.css` matches at least 1 line
    - `grep -E "^\s+--font-body:\s+var\(--font-body-inter\)" app/globals.css` matches at least 1 line
    - `grep -c "\.glass-surface" app/globals.css` returns at least 2 (one in @layer components, one in @supports not)
    - `grep -c "backdrop-filter: blur(var(--glass-blur)) saturate(180%)" app/globals.css` returns at least 1
    - `grep -c "\-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%)" app/globals.css` returns at least 1
    - `grep -E "@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)" app/globals.css` matches at least 1 line
    - `grep -c "@keyframes ambientA" app/globals.css` returns at least 1
    - `grep -c "@keyframes ambientB" app/globals.css` returns at least 1
    - `grep -c "@keyframes ambientC" app/globals.css` returns at least 1
    - `grep -c "translate(40px, 30px) scale(1.15)" app/globals.css` returns at least 1 (verifies canonical UI-SPEC keyframe, not RESEARCH A1)
    - `grep -c "prefers-reduced-motion: reduce" app/globals.css` returns at least 1 in the new block
    - 11 token grep count: `grep -E '^\s+--(glass-bg|glass-blur|glass-border|glass-shadow|accent|text-1|text-2|r-card|pad-card|font-display|font-body):' app/globals.css | wc -l` returns >= 11
  </acceptance_criteria>
  <done>
    - All 11 Ember Glass tokens declared in a `:root` block placed AFTER the existing `@theme` block (DS-01).
    - Token values match D-02 verbatim (no rgba/blur/oklch drift).
    - `.glass-surface` utility consumes the four glass tokens via CSS variables (no hardcoded hex/blur values inside the utility) (DS-02 scope).
    - `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` block falls back to `rgba(28, 25, 23, 0.92)` (DS-06).
    - Three ambient keyframes (`ambientA` 50%-translate `(40px, 30px) scale(1.15)`, `ambientB` `(-30px, -40px) scale(1.1)`, `ambientC` opacity-animated) declared (DS-05 substrate).
    - `prefers-reduced-motion: reduce` disables `.ember-ambient-blob` animations.
    - Existing `@theme` block at lines 209-211 (legacy `'Outfit'` / `'Space Grotesk'` strings) is UNTOUCHED — cascade order alone makes the new `:root` win.
    - No existing `glass-dark` / `glass-vibrancy` / `glass-shine` utility removed or modified (D-03 additive).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Build → Browser (next/font output) | next/font downloads woff2 at build time; no runtime fetch from any third-party CDN |
| CSS cascade ordering | New `:root` block placement after `@theme` is the mitigation against ambiguous `--font-display` resolution |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-174-01-01 | Information Disclosure | next/font font fetching | mitigate | next/font/google self-hosts; Playwright network assertion in Plan 03 confirms zero `fonts.googleapis.com` / `fonts.gstatic.com` requests |
| T-174-01-02 | Tampering | CSS cascade — wrong `--font-display` value wins | mitigate | New `:root` block declared AFTER `@theme` in `app/globals.css` per D-01; verified by grep that both blocks exist and `:root --font-display: var(--font-display-outfit)` is later in source order |
| T-174-01-03 | Denial of Service | `backdrop-filter` unsupported → glass surfaces become illegible (text on transparent bg) | mitigate | `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` block falls back to opaque `rgba(28, 25, 23, 0.92)` solid background (DS-06) |
| T-174-01-04 | Spoofing / XSS | n/a | accept | This plan touches only static CSS + a font config module; no user input, no network endpoints, no React rendering of dynamic strings |
| T-174-01-05 | Repudiation | n/a | accept | No audit log surface affected |
| T-174-01-06 | Elevation of Privilege | n/a | accept | No auth surface affected |
</threat_model>

<verification>
After Wave 1 (Plan 01 + Plan 02) merges, run:
- `npm run test:changed` — should pick up `app/fonts.ts` and `app/globals.css` (CSS not unit-tested directly; the changed-file scope simply confirms no regression in any test that imports `app/fonts.ts`).
- Manual visual: `npm run dev` then load `/` in browser; DevTools Computed Style on `<html>` shows `--glass-bg: rgba(255, 255, 255, 0.04)`, `--accent: oklch(0.68 0.17 45)`, `--font-display: var(--font-display-outfit), system-ui, sans-serif` (resolved value should include the next/font hash class, e.g., `__className_xxxxx`).

The Playwright network assertion (`tests/smoke/fonts-self-hosted.spec.ts`) is created and run in Plan 03 — that is the canonical DS-04 verification, not this plan.
</verification>

<success_criteria>
- All 11 Ember Glass tokens visible on `:root` in DevTools Computed Styles after `npm run dev`.
- `--font-display` and `--font-body` resolve to the next/font CSS variables (NOT to literal `'Outfit'` / `'Space Grotesk'` strings).
- `.glass-surface` class can be applied to any element and produces a translucent blurred surface in Chrome/Safari/Firefox; opaque solid background in any browser without backdrop-filter support.
- Three ambient keyframes are declared and referenceable by `animation-name: ambientA | ambientB | ambientC`.
- No regression in any existing component (no other CSS file touched; no JS file touched besides `app/fonts.ts`).
- `app/layout.tsx` still imports from `./fonts` — Plan 02 updates that import to use `inter` instead of `spaceGrotesk`.
</success_criteria>

<output>
After completion, create `.planning/phases/174-ember-glass-tokens-foundations/174-01-SUMMARY.md` documenting:
- Exact CSS lines added to `app/globals.css` (line range)
- Token values declared (paste the `:root` block verbatim)
- Confirmation that `@theme` font declarations at lines 209-211 were left UNTOUCHED
- Confirmation that no existing `glass-dark` / `glass-vibrancy` / `glass-shine` utility was modified
- Note that `app/layout.tsx` still references `spaceGrotesk` and `--font-display` literal — Plan 02 fixes the import
</output>
