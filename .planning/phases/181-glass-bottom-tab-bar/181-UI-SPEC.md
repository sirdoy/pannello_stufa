---
phase: 181
slug: glass-bottom-tab-bar
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-02
---

# Phase 181 — UI Design Contract

> Visual + interaction contract for the **Ember Glass bottom tab bar** (4-tab glass pill: Casa / Stanze / Automazioni / Altro), the new **`/altro` route page** (replaces the legacy hamburger menu), the floating **`<NavbarConnectionStatusChip>`** (top-right WS status pill), and a single additive augmentation to Phase 175's **`<Sheet>`** primitive (body-attribute counter for stacked-sheet hide-when-open behavior). Auto-resolved from `181-CONTEXT.md` D-01..D-21 (locked), `181-RESEARCH.md` Patterns 1–14 + Pitfalls 1–8 + Open Questions 1–3, the design bundle (`.planning/inbox/ember-glass-design/project/components/app.jsx:340-379` — primary visual source, lifted verbatim modulo lucide icon swap + safe-area inset + desktop centering), Phase 174 token block (`var(--accent)`, `var(--r-card)`, `var(--text-1)`, `var(--text-2)`, `var(--font-display)`, `var(--font-body)` consumed; no new tokens added), Phase 175 `<Pressable>` + `<Sheet>` primitives (Pressable consumed unmodified; Sheet augmented additively per D-10), and Phase 177 `<GlassCard>` + `<CardHead>` (consumed unmodified by `<AltroPage>`). Verified by gsd-ui-checker downstream.

**Scope reminder:** Phase 181 ships ONLY (a) `<BottomTabBar>` + tab button at `app/components/EmberGlass/BottomTabBar.tsx`, (b) `<NavbarConnectionStatusChip>` thin-wrapper at `app/components/layout/NavbarConnectionStatusChip.tsx`, (c) `<AltroPage>` + `<AltroRow>` + `app/altro/page.tsx` route, (d) module-level `SheetCounter` helpers at `app/components/EmberGlass/SheetCounter.ts` + 6-line additive augmentation to `app/components/EmberGlass/Sheet.tsx`'s existing `useEffect`, (e) 6 globals.css rules (transition + 2 hide rules + 2 desktop-center rules + chip hide rule), (f) `app/layout.tsx` swap (legacy `<Navbar />` + `<Footer />` unmount, new chrome mount, `<main>` padding retune), (g) Jest unit specs (BottomTabBar / SheetCounter / Sheet extension / AltroPage / NavbarConnectionStatusChip), (h) one Playwright spec at `tests/smoke/bottom-tab-bar.spec.ts`. **Out of scope** (per CONTEXT `<domain>` + `<deferred>`): deleting legacy `Navbar.tsx`/`Footer.tsx`/`navigation/`/`Navbar.test.tsx` (cleanup phase post-182); per-tab badges, haptic feedback, drag-to-reorder, keyboard arrow-nav between tabs, reduced-motion variant, active-tab indicator dot/underline, replacing `getNavigationStructureWithPreferences`, theme-color updates, PWA install prompt repositioning, settings routes that don't exist (`/settings/account`, `/settings/gdpr`, `/settings/privacy`).

**Requirement coverage:** NAV-01 (glass surface + bottom-pin mobile + app-shell desktop) → §Spacing + §Color + §Component API; NAV-02 (4 sections + accent + glow active state) → §Color "Active reserved-for" + §Component API "active treatment"; NAV-03 (hide under open sheet) → §Component API "Hide-on-sheet-open mechanism" + §Sheet augmentation; NAV-04 (iOS safe-area-inset-bottom) → §Spacing "Safe-area" + §Responsive Behavior.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual — Ember Glass v2 token system from Phase 174; project does not use shadcn — `components.json` confirmed absent at 2026-05-02) |
| Preset | not applicable |
| Component library | `@radix-ui/react-dialog ^1.1.14` (Phase 175 `<Sheet>` only — additive augmentation in Phase 181); no new Radix primitives introduced |
| Icon library | `lucide-react ^0.562.0` (already a dep) — Phase 181 icons: tab bar uses `<Home>`, `<LayoutGrid>`, `<Zap>`, `<MoreHorizontal>`; AltroPage uses `<ChevronRight>`, plus the device-icon string-keyed registry returned by `getNavigationStructureWithPreferences` (mapped to lucide via a local `ICON_MAP` mirroring `app/components/EmberGlass/rooms/lib/rooms-config.ts`). Per-row lucide names for AltroPage Sistema/Impostazioni/Account groups: `<ScrollText>` (Log), `<Boxes>` (Registro), `<History>` (Changelog), `<KeyRound>` (API Keys), `<Bell>` (Notifications), `<LayoutGrid>` (Dashboard), `<Cpu>` (Devices), `<MapPin>` (Location), `<Thermometer>` (Thermostat), `<LogOut>` (Logout). All already used elsewhere in the codebase — Phase 181 introduces no new icon dependency. |
| Display font | Outfit (`var(--font-display)`, Phase 174 token alias) — not used by the tab bar (10px label uses `var(--font-body)`); used by AltroPage section titles via `<CardHead>` |
| Body font | Inter (`var(--font-body)`, Phase 174 token alias) — tab bar 10px labels, AltroPage row labels, group helper text |
| Color space | OKLCH for `--accent`; `color-mix(in oklab, ...)` for active tab tint + glow ring; rgba/hex literals for bundle-verbatim non-tokenized values (documented as AUDIT-EXCEPTION below) |
| Styling approach | **Inline `style={...}` objects with `var(--token)` references** (Phase 174 D-12 / Phase 175 D-08 / Phase 177 D-02 / Phase 178 D-02 / Phase 179 D-02 / Phase 180 D-02 mandate, locked; CONTEXT D-02 reaffirms for Phase 181). Tailwind v4 utility classes are FORBIDDEN inside any `BottomTabBar.tsx`, `altro/`, or `NavbarConnectionStatusChip.tsx` file. The single CSS-file exception is `app/globals.css` for the 6 cross-cutting rules (transition, hide-on-sheet-open mobile + desktop combined-transform, desktop-center centering, WS chip hide) — these are framework-agnostic CSS selectors that cannot be expressed inline. |

**Token consumption (Phase 174 — locked; Phase 181 introduces ZERO new tokens):**

| Token | Value | Where used in Phase 181 |
|-------|-------|--------------------------|
| `--accent` | `oklch(0.68 0.17 45)` (default copper, runtime-overridable via DS-03 picker) | Active-tab `color`; active-tab background tint (via `color-mix(in oklab, var(--accent) 18%, transparent)`); active-tab glow ring (via two-layer `box-shadow` with `color-mix` 60% + 50%); Pressable `:focus-visible` outline on every `<Pressable as={Link}>` (tab buttons + altro rows); SC-#2 mandate "responds to user's chosen oklch hue" satisfied trivially because every accent-bearing rule reads `var(--accent)` at paint time |
| `--text-1` | `#f5f5f4` | Default text token; **NOT used directly by tab labels** (they use the bundle-verbatim `rgba(255,255,255,0.55)` for inactive and `var(--accent)` for active); used by AltroPage row labels |
| `--text-2` | `rgba(245, 245, 244, 0.55)` | AltroPage row helper text, group "helper" subtitles below `<CardHead>`, ChevronRight icon stroke color |
| `--r-card` | `24px` | AltroPage row `border-radius` (each `<Pressable as={Link}>` glass row); AltroPage `<GlassCard>` group container `border-radius` (Phase 177 carry-forward via composition) |
| `--font-display` | Outfit | AltroPage `<CardHead>` group titles ("Dispositivi", "Sistema", "Impostazioni", "Account") via Phase 177 primitive default |
| `--font-body` | Inter | Tab bar 10px labels (4 strings: "Casa", "Stanze", "Automazioni", "Altro"); AltroPage row labels and helpers |

**Tokens NOT introduced or modified:** zero. All values either consume Phase 174 tokens or are bundle-verbatim AUDIT-EXCEPTION literals listed in §Color below. **No new tokens added. No new icons added beyond lucide-react re-use.**

**Detected existing UI (verified 2026-05-02):**
- `app/components/EmberGlass/Pressable.tsx` — Phase 175 polymorphic press primitive. Tab buttons: `<Pressable as={Link} href={route} tabIndex={0}>` (D-05 + RESEARCH Pitfall 3); AltroPage rows: same pattern. **`tabIndex={0}` is mandatory** because `Pressable.tsx:104-107` only sets `data-pressable-focusable="true"` for string-tag hosts in `FOCUSABLE_HOSTS` OR when `tabIndex >= 0` — passing `as={Link}` (component reference) bypasses the string-tag check, so without `tabIndex={0}` the `:focus-visible` accent outline (Phase 175 contract) would not paint.
- `app/components/EmberGlass/Sheet.tsx` — Phase 175 primitive. **Augmented in Phase 181** with two lines inside the existing `useEffect([open])` block (`incrementSheetCount()` on open + `decrementSheetCount()` in cleanup). No prop changes, no visual changes, no z-index changes (200 backdrop / 201 content stay).
- `app/components/EmberGlass/GlassCard.tsx` + `CardHead.tsx` — Phase 177 primitives. Composed by `<AltroPage>` for the 4 section groups. API consumed unchanged.
- `app/components/EmberGlass/AmbientBg.tsx` — Phase 174 ambient layer; survives the chrome swap; not directly touched.
- `app/components/layout/NavbarConnectionStatus.tsx` — Phase 144 / v17.0 WS chip (46 LOC, zero-arg, no internal positioning). **Wrapped, NOT modified.** New `<NavbarConnectionStatusChip>` adds the floating positioning concern in 25 LOC.
- `app/components/Navbar.tsx` (732 LOC) + `app/components/Footer.tsx` — legacy chrome. **UNMOUNTED but NOT DELETED** per D-04 (cleanup phase post-182). `Navbar.test.tsx` continues to pass because the file is unchanged on disk.
- `app/globals.css` — Phase 181 appends 6 cross-cutting rules (one transition rule on `[data-bottom-tab="true"]`, four hide/center rules wrapped in `body[data-sheet-open="true"]` + `@media (min-width: 640px)`, one chip-hide rule). New rules placed AFTER the existing `@supports not` block (`globals.css:340+`) for grouping with prior cross-cutting CSS. **No edits to existing rules.**
- `app/stanze/page.tsx` + `app/automazioni/page.tsx` — Phase 179/180 route mounts. `app/altro/page.tsx` mirrors the `'use client'` + auth-via-`ClientProviders` pattern verbatim.
- `lib/devices/deviceRegistry.ts` — `getNavigationStructureWithPreferences(preferences: Record<string, boolean>): NavigationStructure` returns `{ devices, global, settings }`. AltroPage's "Dispositivi" group consumes `devices`; the `device.icon` field is a string key (NOT a lucide component reference) — AltroPage maps it through a local `ICON_MAP` mirroring `app/components/EmberGlass/rooms/lib/rooms-config.ts:ICON_FOR`.

---

## Spacing Scale

Declared values (multiples of 4 unless flagged as bundle-verbatim micro-affordance):

| Token | Value | Usage in Phase 181 |
|-------|-------|--------------------|
| 0.5 | 0.5px | Bar container border (`0.5px solid rgba(255,255,255,0.1)` — bundle `app.jsx:356`); AltroPage row border (`0.5px solid rgba(255,255,255,0.06)`) |
| 3 | 3px | Tab button `gap: 3` between icon and label (bundle `app.jsx:368`) — bundle-verbatim micro-affordance, DO NOT normalize to 4 |
| 4 | 4px | (none specific; reserved by global scale) |
| 6 | 6px | Bar container `padding: 6` (bundle `app.jsx:358`) |
| 8 | 8px | Bar bottom-offset baseline before safe-area inset added: `bottom: calc(8px + env(safe-area-inset-bottom))` (D-08); bar mobile-vs-desktop hide threshold is irrelevant because both use the same 8px baseline |
| 10 | 10px | Tab button `padding: '10px 0 8px'` (bundle `app.jsx:365`); WS chip top-offset baseline `top: calc(env(safe-area-inset-top) + 12px)` adds 12px above this on mobile |
| 12 | 12px | Bar mobile side-margins (`left: 12, right: 12` — D-08); WS chip side-offset (`right: 12` — D-13); WS chip top breathing offset `+12` above safe-area-inset-top; `<main>` top padding addition `pt-[calc(env(safe-area-inset-top)+12px)]`; AltroPage row inter-row spacing within a group `gap: 12` (between leading-icon, label, trailing chevron) |
| 14 | 14px | AltroPage row vertical padding `padding: '14px 16px'` (CONTEXT D-12) |
| 16 | 16px | AltroPage row inter-row spacing within a group; AltroPage row horizontal padding `padding: '14px 16px'`; Tab button inactive border-radius computed-equivalent (label fontSize 10 + lineHeight ~1.2 + 10px+8px vertical padding ≈ 30px button height; 22px radius makes a pill) |
| 18 | 18px | AltroPage trailing `<ChevronRight size={18} />` icon |
| 20 | 20px | AltroPage row leading lucide icon `size={20}`; bar tab `<Icon size={22}>` (CONTEXT D-05) — slightly larger than altro for visual weight in compressed bar |
| 22 | 22px | Tab button `border-radius: 22` (bundle `app.jsx:365`); tab icon `size={22}` |
| 24 | 24px | AltroPage section-group inter-section spacing `gap: 24` between consecutive `<GlassCard>` groups (CONTEXT D-12 mention); AltroPage `<GlassCard>` `border-radius` inherits Phase 177 `var(--r-card)` = 24 |
| 28 | 28px | Bar container `border-radius: 28` (bundle `app.jsx:352`) — distinctly larger than tab button 22 to give the pill-within-pill nesting effect |
| 30 | 30px | Bar `backdrop-filter: blur(30px) saturate(180%)` blur radius (bundle `app.jsx:354`) |
| 88 | 88px | `<main>` bottom padding addition `pb-[calc(env(safe-area-inset-bottom)+88px)]` (CONTEXT D-11). Math: ~64px bar height (10px+22px label+icon stack ≈ 30px tab button + 6px bar padding × 2 = 42; plus glow shadow ~14px effective ≈ 56-64px total visual footprint) + 16px breathing + 8px bottom offset = 88px conservative clear. |
| 140 | 140% | Bar slide-out vertical translate magnitude `translateY(140%)` when `body[data-sheet-open="true"]` is set (D-09) — moves the bar fully below the visible viewport plus a buffer for shadow/glow tail; matched to chip's `translateY(-140%)` slide-out (RESEARCH Pitfall 7 / OQ-3) |
| 480 | 480px | Bar desktop `max-width: 480` centered pill at `≥sm` (640px+) breakpoint (D-08 + RESEARCH Pattern 8) |
| 640 | 640px | Tailwind `sm` breakpoint — single `@media (min-width: 640px)` query in globals.css triggers the desktop-centered branch + the desktop combined-translate hide rule |

**Bundle-verbatim micro-affordances (intentional non-multiples of 4 — DO NOT normalize):**
- `0.5px` — bar + altro row hairline borders for retina sub-pixel rendering. Bundle convention shared with Phases 175 (Sheet border), 178 (sheet sub-primitives), 179 (every device card), 180 (every editor field).
- `3px` gap between tab icon and label (bundle `app.jsx:368`). Tighter than the 4-multiple scale would suggest because the 10px label + 22px icon need to read as one unit.
- `10px` tab button vertical padding top vs `8px` bottom (bundle `app.jsx:365` `padding: '10px 0 8px'`) — 2px asymmetry compensates for label's optical weight under the icon.
- `1.8` / `2.2` lucide `strokeWidth` for inactive/active tabs (bundle `app.jsx:372`, renamed `sw` → `strokeWidth` per Phase 178 D-19 / Phase 179 D-19 / Phase 180 D-19) — non-default 2.0 for visual heft difference; numeric-prop pattern verified at `Sheet.tsx:166` precedent.

**Safe-area insets (NAV-04 — verified per RESEARCH Pattern 1):**
- `app/layout.tsx:32` already declares `viewportFit: 'cover'` (Next.js 16 `Viewport` API). On notched iOS PWA standalone: `env(safe-area-inset-bottom)` returns `34px`; on non-notched devices: `0px`. The `calc(8px + env(safe-area-inset-bottom))` correctly degrades to `8px`.
- `<main>` top padding `pt-[calc(env(safe-area-inset-top)+12px)]` clears iOS Dynamic Island / notch.
- WS chip `top: calc(env(safe-area-inset-top) + 12px)` similarly inset-aware.
- iOS keyboard does NOT change `env(safe-area-inset-bottom)` (only the visual viewport shrinks), so the bar stays correctly anchored when a sheet's input is focused — no special handling needed.

**Touch target exceptions:**
- **Tab button height: ~30px (≈ 10px+8px padding + 22px icon + 10px label, with `gap: 3`).** Below Apple HIG 44×44 minimum BUT the entire `<button>` clickable area is the full grid cell width (~94px on mobile after `padding: 6` × 2 from 374px viewport / 4 columns ≈ 90px-wide column × 30px tall). Width × height ≥ 44 along the long axis; bundle-verbatim. Sub-44px-tall touch targets are accepted in iOS bottom navigation chrome (system Safari toolbar is ~44px including its own padding; bundle-locked at 30px tab button + 6px bar padding ≈ 42px visible affordance).
- **WS chip: inherits `<NavbarConnectionStatus>` intrinsic size** (small pill, ~28px tall × variable width depending on label). Decorative; non-interactive. No tap target.
- **AltroPage rows: ~52px tall** (`14×2 = 28` padding + 20 icon ≥ 52px); above 44px minimum. Each row is a full-width tap target.

**Z-index reservations (CRITICAL — documented in `BottomTabBar.tsx` top-of-file comment per CONTEXT D-08 + Phase 175 D-13):**
- 150 → `<BottomTabBar>` and `<NavbarConnectionStatusChip>` (matched).
- 200 → Phase 175 Sheet backdrop (untouched).
- 201 → Phase 175 Sheet content (untouched).
- The bar + chip at 150 stay BELOW the Sheet's 200/201 ceiling, so any open sheet visually covers them. The `body[data-sheet-open="true"]` selector additionally hides them via slide+fade so there's no z-stacking artifact even at the milliseconds where the sheet's content is mid-animation.

---

## Typography

Declared roles for Phase 181 surfaces (`<BottomTabBar>` tab labels, `<AltroPage>` group rows, `<NavbarConnectionStatusChip>` inherits Phase 144 component typography). Sizes lifted from bundle `app.jsx` and aligned with the Ember Glass 4-size budget.

| Role | Size | Weight | Line Height | Letter Spacing | Family | Used By |
|------|------|--------|-------------|----------------|--------|---------|
| Tab label | 10px | 600 | (default ~1.2) | 0.1px | `var(--font-body)` (Inter) | The 4 tab strings: "Casa", "Stanze", "Automazioni", "Altro" (bundle `app.jsx:373` `fontSize: 10, fontWeight: 600, letterSpacing: 0.1`) — 10px is bundle-locked; the 0.1px letter-spacing very slightly opens the strokes for readability at 10px. **Locked at 10px** despite the 4-size Ember Glass budget elsewhere being `{12, 16, 22, 24}` — the tab bar is a special bundle-locked surface; documented as TYPOGRAPHY-EXCEPTION below. |
| Body | 16px | 400 | 1.5 | — | `var(--font-body)` (Inter) | AltroPage row primary labels ("Stufa", "Termostato", "Log", "API Keys", etc.) |
| Label / Caption | 12px | 600 | 1.4 | — | `var(--font-body)` (Inter) | AltroPage group `<CardHead>` eyebrow numbering (if used — Phase 177 primitive default); WS chip pill label inherits Phase 144 component (12px / 600 / Inter — already locked there) |
| Section heading | 24px | 600 | 1.2 | — | `var(--font-display)` (Outfit) | AltroPage `<CardHead>` group titles ("Dispositivi", "Sistema", "Impostazioni", "Account") inherited from Phase 177 `CardHead` default |

**Weights:** exactly 2 — `400` regular (body copy) + `600` semibold (tab labels, group titles, group eyebrows).

**Sizes:** 4 across Phase 181 surfaces — `10, 12, 16, 24`. The 10px tab label is the bundle-mandated exception below the prior phases' 12px floor (see TYPOGRAPHY-EXCEPTION below). The 22px Sheet title size from Phase 175 is NOT used in Phase 181 (Phase 181 does not render any Sheet body content; it only augments Sheet's effect hook).

**TYPOGRAPHY-EXCEPTION (DS-02 / Phase 174 grep gate inheritance):**

| File:Line | Value | Bundle source | Why exception |
|-----------|-------|---------------|---------------|
| `BottomTabBar.tsx` (tab label) | `fontSize: 10, fontWeight: 600, letterSpacing: 0.1` | `app.jsx:373` | Bundle-locked tab-bar typography. Below the 12px Ember Glass floor used elsewhere. The 0.1px letter-spacing is also bundle-locked (lifted character-for-character). The tab bar is the densest navigation surface in the app and the only place where a 10px label is acceptable; Phase 182 DSREF page documents this exception. |

All other text in Phase 181 surfaces uses Phase 174 token aliases (`var(--font-body)`, `var(--font-display)`) and budget-compliant sizes (12 / 16 / 24).

**Verification gate:** repo-wide grep against the new files (`BottomTabBar.tsx`, `altro/AltroPage.tsx`, `altro/AltroRow.tsx`, `NavbarConnectionStatusChip.tsx`, `app/altro/page.tsx`, `SheetCounter.ts`) MUST show:
- Zero usages of `fontSize` outside `{10, 12, 16, 24}`.
- Zero usages of `fontWeight` outside `{400, 600}`.
- Exactly ONE TYPOGRAPHY-EXCEPTION-tagged line (the tab label `fontSize: 10`).

---

## Color

Phase 181 dark-only Ember Glass palette. The 60/30/10 split is computed against the entire viewport including the bar and altro page surfaces.

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | `#0a0908` (with optional ambient gradient atop, Phase 174) | `--bg-0` (existing) | Page background visible BEHIND the bar and through its 75%-opacity glass; AltroPage scroll surface; viewport background everywhere |
| Secondary (30%) | `rgba(18, 15, 14, 0.75)` | NOT a `--glass-bg` token (bundle-locked denser glass for the bar) | Bar container fill — denser (75% alpha) than `--glass-bg` (`rgba(255,255,255,0.04)`) because the bar must read as solid chrome, not a surface-on-glass. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `app.jsx:353`. Bundle's intentional non-token (the warm-black RGB 18,15,14 is consistent with the iPhone-frame chrome elsewhere in the bundle). |
| Secondary 2 | `rgba(255, 255, 255, 0.04)` | NOT a token (matches `--glass-bg` value but locally hardcoded) | AltroPage row fill — matches Phase 174's `--glass-bg` value but bundle-verbatim hardcoded for parity with Phase 179 row visuals. **AUDIT-EXCEPTION (DS-02):** allowed because the value happens to equal `--glass-bg`; future cleanup may swap to `var(--glass-bg)`. |
| Accent (10%) | `oklch(0.68 0.17 45)` (Copper default, runtime-overridable via DS-03 picker) | `--accent` | **Reserved for** (the explicit list below — never "all interactive elements"): (1) active-tab text color, (2) active-tab background tint, (3) active-tab glow ring, (4) Pressable `:focus-visible` outline on every `<Pressable as={Link}>` (tab buttons + altro rows), (5) AltroPage Account-group "Esci" row label color (per CONTEXT D-12: `color: '#ff8a4a'`) — see destructive note below. |
| Text primary | `#f5f5f4` | `--text-1` | AltroPage row labels (group rows, except Esci) |
| Inactive tab | `rgba(255, 255, 255, 0.55)` | NOT a token | Inactive tab text + icon stroke color. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `app.jsx:367`. Bundle's intentional non-token (55% white is the bundle's universal "muted text on glass" value; matches `--text-2` value of `rgba(245,245,244,0.55)` to within JND but bundle uses pure white at 55%). |
| Text secondary | `rgba(245, 245, 244, 0.55)` | `--text-2` | AltroPage row helper text, `<CardHead>` eyebrow text, `<ChevronRight>` icon stroke color |
| Border (bar) | `0.5px solid rgba(255, 255, 255, 0.1)` | NOT a token | Bar container 0.5px hairline. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `app.jsx:356`. Slightly different alpha than `--glass-border` (0.1 vs 0.08) because the denser bar bg needs a brighter rim. |
| Border (altro row) | `0.5px solid rgba(255, 255, 255, 0.06)` | NOT a token | AltroPage row hairline. **AUDIT-EXCEPTION (DS-02):** Phase 179 sibling convention. |
| Bar shadow | `0 12px 40px rgba(0, 0, 0, 0.4), inset 1px 1px 0 rgba(255, 255, 255, 0.06)` | NOT a token | Bar elevation. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `app.jsx:357`. Negative-Y outer shadow + inset highlight. Different shape from `--glass-shadow`. |
| Bar blur | `blur(30px) saturate(180%)` (with `-webkit-` prefix) | NOT a token | Bar `backdrop-filter`. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `app.jsx:354`. Heavier than `--glass-blur` (24px) for chrome-grade opacity. |
| Active tab background | `color-mix(in oklab, var(--accent) 18%, transparent)` | `--accent` derived | Active tab fill. 18% of the chosen accent over transparent — a soft tint that defers to the glow ring for the "active" cue. |
| Active tab glow ring (rim) | `0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent)` | `--accent` derived | First `box-shadow` layer — a 1px crisp accent rim hugging the rounded button. |
| Active tab glow ring (halo) | `0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)` | `--accent` derived | Second `box-shadow` layer — a 12px soft halo at 50% accent. Combined with the rim, this satisfies SC-#2 "accent color + glow that responds to user's chosen oklch hue from Phase 174" — both the rim and halo derive from `var(--accent)` and re-paint automatically when the picker writes a new accent value. |
| Account "Esci" label | `#ff8a4a` (flame-red) | NOT a token (kept verbatim from legacy Navbar) | AltroPage Account-group Esci row label color per CONTEXT D-12 (legacy Navbar line 482). **AUDIT-EXCEPTION (DS-02):** lifted verbatim from legacy chrome to preserve user mental model. NOT marked as semantic-destructive in this phase — Esci is a non-confirming logout (no destructive confirmation; auth0 redirect handles re-auth). |
| Destructive | n/a in this phase | — | No destructive actions in Phase 181. The Esci row is colored `#ff8a4a` for legacy parity but is NOT a destructive confirmation pattern (single click → `/auth/logout` redirect, no two-step confirm). |

**Accent reserved-for list (the 10% zone — Phase 181 surfaces, exhaustive):**
1. **Active tab text color** — `color: var(--accent)` on the active tab button. The icon inherits via `currentColor` (lucide default).
2. **Active tab background tint** — `background: color-mix(in oklab, var(--accent) 18%, transparent)`.
3. **Active tab glow ring (rim + halo)** — composite `box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)`.
4. **Pressable `:focus-visible` outline** on every keyboard-focusable surface — tab buttons (`<Pressable as={Link} tabIndex={0}>`) and altro rows (`<Pressable as={Link} tabIndex={0}>`). Outline `2px solid var(--accent)` with `2px` offset, paint via the `[data-pressable-focusable="true"]:focus-visible` global rule from Phase 175 (already in `globals.css`); Phase 181 inherits without adding CSS.

**Account "Esci" row** uses the literal `#ff8a4a` for legacy parity, NOT `var(--accent)` — distinct visual signal that this row is the auth-flow exit, not a regular nav link. Locked.

**Explicitly NOT accented in Phase 181:**
- Inactive tab buttons — fill `transparent`, color `rgba(255,255,255,0.55)`, no shadow.
- Bar container itself — fill `rgba(18,15,14,0.75)`, NOT accented.
- AltroPage row backgrounds — fill `rgba(255,255,255,0.04)`, NOT accented.
- AltroPage row labels (except Esci) — color `var(--text-1)`.
- Trailing `<ChevronRight>` — color `var(--text-2)`.
- WS chip — pass-through to Phase 144 component's own palette (status-driven color from `useWebSocketContext`).

Accent is rare-and-precious (10% rule). The active tab is the primary accent surface; everything else either uses neutral text/glass tokens or pass-through inheritance.

**Documented AUDIT-EXCEPTIONs (DS-02 grep gate — Phase 174 inheritance):**

| File:Line (target) | Value | Bundle source | Why non-token |
|--------------------|-------|---------------|---------------|
| `BottomTabBar.tsx` (bar bg) | `rgba(18, 15, 14, 0.75)` | `app.jsx:353` | Denser than `--glass-bg`; bar must read as chrome, not surface. |
| `BottomTabBar.tsx` (bar blur) | `blur(30px) saturate(180%)` | `app.jsx:354` | Heavier than `--glass-blur` (24px); chrome-grade. |
| `BottomTabBar.tsx` (bar border) | `0.5px solid rgba(255,255,255,0.1)` | `app.jsx:356` | Brighter rim than `--glass-border` for denser bar bg. |
| `BottomTabBar.tsx` (bar shadow) | `0 12px 40px rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.06)` | `app.jsx:357` | Bar-specific elevation (descending shadow + inset highlight). |
| `BottomTabBar.tsx` (inactive tab color) | `rgba(255,255,255,0.55)` | `app.jsx:367` | Pure white at 55% (bundle convention; matches `--text-2` luma but uses pure white). |
| `altro/AltroRow.tsx` (row bg) | `rgba(255,255,255,0.04)` | CONTEXT D-12 + Phase 179 sibling | Equal to `--glass-bg` value; hardcoded for bundle parity with Phase 179 row visuals. |
| `altro/AltroRow.tsx` (row border) | `0.5px solid rgba(255,255,255,0.06)` | CONTEXT D-12 + Phase 179 sibling | Quieter than `--glass-border` (0.06 vs 0.08) for nested-on-card effect. |
| `altro/AltroPage.tsx` (Esci row label) | `#ff8a4a` | Legacy Navbar line 482 | Flame-red brand color for the auth-exit affordance. |

All other visual values use Phase 174 tokens or `color-mix(in oklab, var(--accent) ...)` derivations.

---

## Component API + Variants

This is the **prescriptive contract** that gsd-planner and gsd-executor consume. Every prop, default, and behavior below is non-negotiable.

### `<BottomTabBar>` (NAV-01..04)

```ts
// app/components/EmberGlass/BottomTabBar.tsx

export function BottomTabBar(): React.ReactElement;
```

**Props:** none. The bar reads `usePathname()` from `next/navigation` internally and computes the active tab. Stateless from the caller's perspective.

**Tab → route map (locked, lifted from CONTEXT D-05):**

| Tab id | Label (IT) | Lucide icon | Route | Active match |
|---|---|---|---|---|
| `home` | Casa | `Home` | `/` | exact `pathname === '/'` |
| `rooms` | Stanze | `LayoutGrid` | `/stanze` | `pathname === '/stanze' \|\| pathname.startsWith('/stanze/')` |
| `automations` | Automazioni | `Zap` | `/automazioni` | `pathname === '/automazioni' \|\| pathname.startsWith('/automazioni/')` |
| `more` | Altro | `MoreHorizontal` | `/altro` | `pathname === '/altro' \|\| pathname.startsWith('/altro/')` |

**Non-tab routes** (e.g., `/stove`, `/lights`, `/settings/api-keys`, `/log`, `/changelog`) show NO active tab — D-06 explicit. Users reach these routes via direct URL or `/altro`; the bar gracefully shows all 4 tabs as inactive.

**Container styling (locked per CONTEXT D-08 + RESEARCH Pattern 1 + Pattern 8):**

```ts
// Inline style on the root <div data-bottom-tab="true">
{
  position: 'fixed',
  bottom: 'calc(8px + env(safe-area-inset-bottom))',
  left: 12,
  right: 12,
  zIndex: 150,
  borderRadius: 28,
  background: 'rgba(18, 15, 14, 0.75)',                         // AUDIT-EXCEPTION
  backdropFilter: 'blur(30px) saturate(180%)',                  // AUDIT-EXCEPTION
  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
  border: '0.5px solid rgba(255, 255, 255, 0.1)',               // AUDIT-EXCEPTION
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 1px 1px 0 rgba(255, 255, 255, 0.06)',  // AUDIT-EXCEPTION
  padding: 6,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
}
```

The root element MUST carry `data-bottom-tab="true"` for the global selector hook (D-09). Desktop centering at `≥sm` (640px+) is applied via `globals.css` rule (cannot be expressed inline because media queries are CSS-only).

**Tab button styling (per tab; locked per CONTEXT D-07):**

```ts
// Each tab is a <Pressable as={Link} href={tab.route} tabIndex={0}>
// Pressable handles press-scale animation; Link handles client-side route push
// tabIndex={0} is REQUIRED to trigger Pressable's data-pressable-focusable bridge (RESEARCH Pitfall 3)
{
  padding: '10px 0 8px',
  borderRadius: 22,
  border: 'none',
  cursor: 'pointer',
  background: active
    ? 'color-mix(in oklab, var(--accent) 18%, transparent)'
    : 'transparent',
  color: active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.55)', // AUDIT-EXCEPTION (inactive)
  boxShadow: active
    ? '0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)'
    : 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  transition: 'background .22s, color .22s, box-shadow .22s',
  position: 'relative',
  textDecoration: 'none', // <Link> renders <a>; suppress default underline
}
```

**Tab button content order (vertical stack):**
1. Lucide icon — `<Icon size={22} strokeWidth={active ? 2.2 : 1.8} />`. The icon's stroke color inherits via `currentColor` from the button's `color` rule.
2. Label — `<div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.1 }}>{tab.label}</div>`. Italian copy locked.

**Active state visual contract (SC-#2 "accent color + glow"):**
- `color: var(--accent)` paints both the icon stroke (via `currentColor`) and the label text in the chosen accent.
- `background: color-mix(in oklab, var(--accent) 18%, transparent)` paints a soft 18% accent fill over the bar's chrome bg.
- `boxShadow: 0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)` is the two-layer GLOW: a 1px crisp rim (60% accent) + a 12px soft halo (50% accent) extending outward. Both layers re-paint instantly when DS-03 picker writes a new `--accent` value (verified RESEARCH Pattern 7 — production codebase already uses 5+ `color-mix(in oklab, ...)` instances).
- Stroke width bumps from 1.8 (inactive) → 2.2 (active) for visual heft (bundle-verbatim).
- Transitions are `.22s` for `background`, `color`, AND `box-shadow` (matches bundle line 369 timing exactly).

**Inactive state:** transparent fill, 55%-white text/icon, no shadow, 1.8 stroke. No `:hover` state (bundle does not implement hover; stay bundle-faithful).

**Hide-on-sheet-open mechanism (NAV-03 / SC-#3 — locked per CONTEXT D-09 + D-10 + RESEARCH Pattern 2 + Pattern 3 + Pitfall 2):**

The bar carries `data-bottom-tab="true"`. When any Phase 175 `<Sheet>` opens, the augmented `useEffect` in `Sheet.tsx` calls `incrementSheetCount()` from `SheetCounter.ts` which sets `document.body.dataset.sheetOpen = 'true'`. Closing decrements; when the counter reaches 0 the attribute is removed. Stacked sheets work correctly (counter-based; single-flag approach would break under stacked Sheet scenarios — CONTEXT Anti-pattern locked). The CSS rules in `globals.css`:

```css
/* Phase 181 — bottom tab bar cross-cutting rules.
   Placed AFTER the existing @supports not block (~globals.css:340+) for grouping. */

[data-bottom-tab="true"] {
  transition: transform .3s cubic-bezier(.22, 1, .36, 1), opacity .2s;
}

@media (min-width: 640px) {
  [data-bottom-tab="true"] {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 480px;
    max-width: calc(100vw - 24px);
  }
}

body[data-sheet-open="true"] [data-bottom-tab="true"] {
  transform: translateY(140%);
  opacity: 0;
  pointer-events: none;
}

@media (min-width: 640px) {
  body[data-sheet-open="true"] [data-bottom-tab="true"] {
    transform: translate(-50%, 140%);
  }
}

[data-ws-chip="true"] {
  transition: transform .3s cubic-bezier(.22, 1, .36, 1), opacity .2s;
}

body[data-sheet-open="true"] [data-ws-chip="true"] {
  transform: translateY(-140%);
  opacity: 0;
  pointer-events: none;
}
```

The 4 bar rules + 2 chip rules (6 total). The desktop combined-translate (`translate(-50%, 140%)`) is mandatory per RESEARCH Pitfall 2 — without it, the desktop-centered pill loses its `translateX(-50%)` centering when the hide rule overrides `transform`, causing the bar to slide off horizontally instead of straight down. The bar slide-out duration `.3s` plus the opacity duration `.2s` are bundle-aligned with Phase 175 Sheet's `.4s` open transition (sheet finishes appearing after bar finishes leaving). The chip slides UP off-screen (`translateY(-140%)`) since it's anchored top-right; the bar slides DOWN. Both with the same `cubic-bezier(.22,1,.36,1)` ease curve (matches Phase 175 Sheet open curve for visual consistency).

**Animation timing (locked):**
- Tab active-state transition: `.22s` (3 properties: background, color, box-shadow).
- Bar/chip hide-when-sheet-open: `transform .3s cubic-bezier(.22,1,.36,1)`, `opacity .2s` (linear default).
- Pressable press-scale: inherited from Phase 175 (`scale(0.97)` on press, `transition: transform .22s cubic-bezier(.34,1.56,.64,1)`).

**Reduced motion:** Phase 181 does NOT ship explicit `prefers-reduced-motion: reduce` overrides. Phase 175 already collapses `.press-anim` to 50ms linear under reduced-motion (inherited because tab buttons compose Pressable). The bar's `.22s`/`.3s` transitions are short enough to be acceptable for reduced-motion users; if a future a11y phase needs to tighten them, refactor then.

### `<NavbarConnectionStatusChip>` (D-13 — supports NAV-01 visual hygiene)

```ts
// app/components/layout/NavbarConnectionStatusChip.tsx

export function NavbarConnectionStatusChip(): React.ReactElement;
```

**Props:** none. Pure positioning wrapper around the existing Phase 144 `<NavbarConnectionStatus />` (zero-arg, reads `useWebSocketContext` internally, renders one `<span>` with CVA-based styling). RESEARCH Pattern 13 confirms the existing component has no internal positioning, no click handler, and is safe to wrap.

**Container styling (locked per CONTEXT D-13 + RESEARCH Pattern 13 + Pitfall 7):**

```ts
{
  position: 'fixed',
  top: 'calc(env(safe-area-inset-top) + 12px)',
  right: 12,
  zIndex: 150,
}
```

Root element carries `data-ws-chip="true"` for the global hide-on-sheet-open selector. NO `pointer-events: auto` (it's the default; CONTEXT D-13 erroneously included it — RESEARCH Pattern 13 corrects). The chip itself exposes no interactive surface (it's a passive indicator); not click-blocking.

**Pass-through:** all visual properties (status pill color, label text, badge variants for connected/connecting/offline) inherit from the existing Phase 144 component. Phase 181 does NOT modify those.

### `<AltroPage>` + `<AltroRow>` (CONTEXT D-12)

```ts
// app/components/EmberGlass/altro/AltroPage.tsx
export function AltroPage(): React.ReactElement;

// app/components/EmberGlass/altro/AltroRow.tsx
export interface AltroRowProps {
  href: string;
  label: string;
  Icon: LucideIcon;
  labelColor?: string;        // optional override (used by Esci row → '#ff8a4a')
  external?: boolean;         // when true, renders <a> instead of <Link> (used by /auth/logout — Auth0 callback)
}
export function AltroRow(props: AltroRowProps): React.ReactElement;
```

**`<AltroPage>` composition:** renders 4 `<GlassCard>` groups in a vertical stack with `gap: 24` between them. Each group uses Phase 177 `<CardHead title={...} />` + a vertical stack of `<AltroRow>` instances with `gap: 12`. Page is `'use client'` + auth-via-`ClientProviders` (mirrors `app/stanze/page.tsx` per Phase 179 D-04 / Phase 180 D-29).

**Group definitions (locked per CONTEXT D-12 + RESEARCH Pattern 11 + Pattern 12 + RESEARCH OQ-2 resolution):**

**Group 1 — Dispositivi** (`<CardHead title="Dispositivi" />`):
- Generated dynamically from `getNavigationStructureWithPreferences(preferences)` (existing helper, lib/devices/deviceRegistry.ts:204) where `preferences` comes from inlined fetch of `/api/devices/config` + `/api/user` (RESEARCH OQ-1 resolution: inline the fetch for Phase 181; extract a hook only if Phase 182 needs it). Each enabled device contributes one row:
  - `Stufa` → `/stove` (icon string `'flame'` → lucide `<Flame>`)
  - `Termostato` → `/thermostat` (icon string `'thermometer'` → lucide `<Thermometer>`)
  - `Luci` → `/lights` (icon string `'lightbulb'` → lucide `<Lightbulb>`)
  - `Sonos` → `/sonos` (icon string `'music'` → lucide `<Music>`)
  - `DIRIGERA` → `/dirigera` (icon string `'package'` → lucide `<Package>`)
  - `Tuya` → `/tuya` (icon string `'plug'` → lucide `<Plug>`)
  - `Network` → `/network` (icon string `'wifi'` → lucide `<Wifi>`)
  - `Raspberry Pi` → `/raspi` (icon string `'cpu'` → lucide `<Cpu>`)
  - `Telefonia` → `/telefonia` (icon string `'phone'` → lucide `<Phone>`)
- Implementation note: the `device.icon` string maps to a lucide component via a local `ICON_MAP` constant in `AltroPage.tsx` (mirrors `app/components/EmberGlass/rooms/lib/rooms-config.ts:ICON_FOR` per RESEARCH Pattern 11).

**Group 2 — Sistema** (`<CardHead title="Sistema" />`):
- `Log` → `/log` (lucide `<ScrollText>`)
- `Registro` → `/registry` (lucide `<Boxes>`)
- `Changelog` → `/changelog` (lucide `<History>`)

**Group 3 — Impostazioni** (`<CardHead title="Impostazioni" />`):

Per RESEARCH Pattern 12 + OQ-2 resolution, ship ONLY routes that exist on disk (verified `ls app/settings/` 2026-05-02):
- `Generali` → `/settings` (lucide `<Settings>`)
- `Notifiche` → `/settings/notifications` (lucide `<Bell>`)
- `API Keys` → `/settings/api-keys` (lucide `<KeyRound>`)
- `Dashboard` → `/settings/dashboard` (lucide `<LayoutDashboard>`)
- `Dispositivi` → `/settings/devices` (lucide `<Cpu>`)
- `Posizione` → `/settings/location` (lucide `<MapPin>`)
- `Termostato` → `/settings/thermostat` (lucide `<Thermometer>`)

Routes named in CONTEXT D-12 that DO NOT exist on disk are **deferred** (out of UI-SPEC; do not render):
- `/settings/account` — deferred
- `/settings/gdpr` — deferred
- `/settings/privacy` — deferred

**Group 4 — Account** (`<CardHead title="Account" />`):
- `Esci` → `/auth/logout` (lucide `<LogOut>`, `labelColor='#ff8a4a'`, `external={true}` so the row renders an `<a href>` instead of `<Link>` — Auth0 logout endpoint is server-handled and benefits from a full navigation rather than client-side push).

**Row styling (locked per CONTEXT D-12):**

```ts
// AltroRow renders <Pressable as={Link or 'a'} href={...} tabIndex={0}>
// tabIndex={0} required for :focus-visible accent outline (RESEARCH Pitfall 3)
{
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  background: 'rgba(255, 255, 255, 0.04)',                        // AUDIT-EXCEPTION
  border: '0.5px solid rgba(255, 255, 255, 0.06)',                // AUDIT-EXCEPTION
  borderRadius: 'var(--r-card)',
  textDecoration: 'none',
  color: labelColor ?? 'var(--text-1)', // Esci overrides to '#ff8a4a'
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
}
```

**Row content order (horizontal flex with `gap: 12`):**
1. Leading lucide icon — `<Icon size={20} strokeWidth={1.8} />`. Stroke color inherits via `currentColor` from the row's `color` rule.
2. Label — plain text node, no nested element.
3. Spacer — `<div style={{ flex: 1 }} />`.
4. Trailing icon — `<ChevronRight size={18} strokeWidth={1.8} style={{ color: 'var(--text-2)' }} />`. The trailing chevron always uses `--text-2` regardless of the row's primary color (Esci's `#ff8a4a` is on the label only).

**Inter-row spacing within a group:** `gap: 12` (vertical flex).

**Inter-group spacing:** `gap: 24` (between consecutive `<GlassCard>` instances).

**No "+N" overflow** for the Dispositivi group — every enabled device gets its own row regardless of count (typical 4-9 devices fit comfortably). Phase 181 does NOT paginate.

### `SheetCounter.ts` (D-10 — supports NAV-03)

```ts
// app/components/EmberGlass/SheetCounter.ts

export function incrementSheetCount(): void;
export function decrementSheetCount(): void;
```

**Module-level counter state:**

```ts
let count = 0;

function sync(): void {
  if (typeof document === 'undefined') return;
  if (count > 0) {
    document.body.dataset.sheetOpen = 'true';
  } else {
    delete document.body.dataset.sheetOpen;
  }
}

export function incrementSheetCount(): void { count += 1; sync(); }
export function decrementSheetCount(): void { count = Math.max(0, count - 1); sync(); }
```

**Properties (locked):**
- Pure module-level state. No React. No hooks. No imports beyond document type.
- SSR-guarded via `typeof document === 'undefined'` early return.
- Counter clamps to 0 on decrement to defend against React 19 error-boundary edge cases (RESEARCH Pattern 14).
- Strict Mode-safe under React 18: increment + cleanup-decrement + increment under Strict Mode double-mount yields net counter = 1 (correct), tested per RESEARCH Pattern 3.

**Why NOT sniff Radix's `data-scroll-locked`:** RESEARCH Pitfall 1 — `data-scroll-locked` is a private implementation detail of the transitive `react-remove-scroll-bar` dep, set by ANY Radix component using `RemoveScroll` (Tooltip, Popover with `modal`, etc.); would cause false-positive bar-hide if Phase 182 adds a Radix Tooltip elsewhere. Custom counter is < 30 LOC and trivially testable.

### `<Sheet>` augmentation (D-10 — additive only)

The existing `app/components/EmberGlass/Sheet.tsx` `useEffect([open])` (currently performs scroll-lock) gains 2 lines:

```ts
// Inside the existing useEffect that handles scroll-lock on open=true:
useEffect(() => {
  if (!open) return;
  // ... existing scroll-lock setup (unchanged) ...
  incrementSheetCount();         // +1 line
  return () => {
    // ... existing scroll-lock cleanup (unchanged) ...
    decrementSheetCount();       // +1 line
  };
}, [open]);
```

**Properties (locked):**
- ZERO prop changes to `<Sheet>`.
- ZERO visual changes.
- ZERO z-index changes (200/201 stay).
- Additive non-breaking augmentation. Phase 175 D-02 explicitly leaves room for this kind of additive extension.
- Every existing Phase 178 sheet (StoveSheet, ClimateSheet, LightsSheet, SonosSheet, PlugsSheet) and Phase 179 RoomSheet and Phase 180 AutomationEditor sheet automatically opt into the body-attribute hide signal — no per-consumer opt-in required.
- Stacked sheets supported via the counter (Phase 178 device sheet → Phase 180 automation editor sheet works correctly).

---

## Demo Page Sections (`/debug/design-system-v2/page.tsx` — NOT extended in Phase 181)

Phase 181 does NOT add new sections to the design-system-v2 reference page. Phase 182 (Design System Reference Page v2) consumes `<BottomTabBar />` as a sample and is the right place to add a "Navigation chrome" section with bar + chip + altro-row samples. Phase 181 ships only the production-route surfaces.

---

## Copywriting Contract

Italian (project locale per `<html lang="it">`). Copy strings live inline in `BottomTabBar.tsx`, `altro/AltroPage.tsx`, and `altro/AltroRow.tsx`. No i18n extraction needed.

### `<BottomTabBar>` — labels

| Element | Copy (IT) | English equivalent |
|---------|-----------|---------------------|
| Tab `home` label | `Casa` | Home |
| Tab `rooms` label | `Stanze` | Rooms |
| Tab `automations` label | `Automazioni` | Automations |
| Tab `more` label | `Altro` | More |

### `<AltroPage>` — group titles + helpers

| Element | Copy (IT) | English equivalent |
|---------|-----------|---------------------|
| Group 1 title (`<CardHead>`) | `Dispositivi` | Devices |
| Group 2 title | `Sistema` | System |
| Group 3 title | `Impostazioni` | Settings |
| Group 4 title | `Account` | Account |

### `<AltroPage>` — Sistema row labels

| Element | Copy (IT) | Route |
|---------|-----------|-------|
| Sistema row 1 | `Log` | /log |
| Sistema row 2 | `Registro` | /registry |
| Sistema row 3 | `Changelog` | /changelog |

### `<AltroPage>` — Impostazioni row labels

| Element | Copy (IT) | Route |
|---------|-----------|-------|
| Impostazioni row 1 | `Generali` | /settings |
| Impostazioni row 2 | `Notifiche` | /settings/notifications |
| Impostazioni row 3 | `API Keys` | /settings/api-keys |
| Impostazioni row 4 | `Dashboard` | /settings/dashboard |
| Impostazioni row 5 | `Dispositivi` | /settings/devices |
| Impostazioni row 6 | `Posizione` | /settings/location |
| Impostazioni row 7 | `Termostato` | /settings/thermostat |

### `<AltroPage>` — Account row label

| Element | Copy (IT) | Route | Notes |
|---------|-----------|-------|-------|
| Account row 1 | `Esci` | /auth/logout | `labelColor='#ff8a4a'`, `external={true}` |

### `<AltroPage>` — Dispositivi row labels (data-driven)

Labels come from `getNavigationStructureWithPreferences(preferences).devices.map(d => d.name)` (Italian-locale device names already defined in `lib/devices/deviceRegistry.ts`). Phase 181 does NOT redefine these strings. Examples per RESEARCH Pattern 11:

| Device id | Italian name (from helper) |
|-----------|---------------------------|
| `stove` | `Stufa` |
| `thermostat` | `Termostato` |
| `lights` | `Luci` |
| `sonos` | `Sonos` |
| `dirigera` | `DIRIGERA` |
| `tuya` | `Tuya` |
| `network` | `Network` |
| `raspi` | `Raspberry Pi` |
| `telefonia` | `Telefonia` |

If a device is disabled in the user's preferences (per `/api/devices/config`), its row is omitted entirely (no rendering of disabled devices in the AltroPage Dispositivi group).

### Phase-level copy contract (template fields)

| Element | Resolution |
|---------|------------|
| Primary CTA | **n/a in production code shipped by Phase 181 as a single dominant CTA.** The bar's 4 tabs are 4 navigation triggers; the AltroPage is a list of 14+ navigation rows. There is no single "primary" action because the bar is chrome, not a feature surface. Implicit "primary action" interpretation: tapping any tab is the primary navigation gesture; ARIA roles (native `<a>` from `<Link>`) communicate this. |
| Empty state | **n/a** — Phase 181 has no empty-state surfaces. The AltroPage Dispositivi group renders only enabled devices (non-empty by definition; the user must have ≥1 enabled device to have a meaningful app, and the legacy Navbar precedent shows this never empties in practice). The other 3 groups (Sistema, Impostazioni, Account) are static with at minimum 1 row each. |
| Error state | **n/a for visible UI.** The `/api/devices/config` + `/api/user` fetches in `AltroPage` may fail; on failure the Dispositivi group renders empty (silent degradation matching legacy Navbar `Navbar.tsx:142-167` behavior). No error UI; no toast; no banner. The other 3 groups (Sistema, Impostazioni, Account) render unconditionally. Test-runner output / console errors are in English (`Expected zero console errors`) per Playwright `collectConsoleErrors` helper convention (Phase 51/97/179/180 lineage). |
| Destructive confirmation | **n/a** — Phase 181 has zero destructive actions. The Esci row is a single-click logout (Auth0 redirects to logout endpoint; browser handles the rest). No two-step confirmation. The flame-red color is a brand-consistency cue for "this action exits authenticated state", not a destructive-pattern semantic signal. If a future a11y or UX audit demands a destructive confirmation pattern for logout (e.g., "Esci? [Annulla] [Conferma]"), that's its own scope. |

**Copy invariants:**
- All UI copy in Italian (project standard).
- Test/error/console output in English (developer-facing).
- No emoji in production UI copy.
- No copy duplicated from Phase 144 `<NavbarConnectionStatus>` (the chip component owns its own strings — connected/connecting/offline pill labels). Phase 181 does NOT introduce new chip copy.

---

## Accessibility

### `<BottomTabBar>`

- **Root element role:** `<nav aria-label="Navigazione principale">` — a single `<nav>` landmark wrapping the 4 tab buttons. Italian `aria-label` matches `<html lang="it">`.
- **Active tab indicator (semantic):** the active tab's `<Pressable as={Link}>` element receives `aria-current="page"` (RESEARCH OQ assertion line 197 — D-14 test #2). Screen readers announce "current page" alongside the tab label.
- **Tab buttons (focus management):** `<Pressable as={Link} href={route} tabIndex={0}>` per tab. The `tabIndex={0}` is mandatory because Pressable's `FOCUSABLE_HOSTS` set only contains string tags (`button`/`a`/`input`/`select`/`textarea`); passing a component reference (`Link`) bypasses the auto-detection and the `data-pressable-focusable="true"` attribute is set only when the consumer explicitly opts in via `tabIndex >= 0`. Without the explicit `tabIndex`, the underlying `<a>` rendered by `<Link>` is still natively focusable (Tab key works), but the Phase 175 accent `:focus-visible` outline rule does NOT match — keyboard users would lose the accent ring.
- **Keyboard navigation (cross-tabs):** standard Tab key cycles forward through the 4 tabs (DOM order) and `Shift+Tab` cycles backward. Arrow-key navigation between tabs is OUT OF SCOPE for Phase 181 (CONTEXT `<deferred>`). Enter/Space on a focused tab triggers `<Link>`'s native click → client-side route push.
- **Focus return after Sheet close:** Radix `Sheet` returns focus to the element that triggered open. If a sheet was opened from the dashboard and the user closes it, focus lands on the dashboard card, NOT the bar. The bar does not interfere with Radix's focus management.
- **Visual focus ring:** `[data-pressable-focusable="true"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` — paint via Phase 175 global rule already in `globals.css`. No new CSS in Phase 181.
- **Color contrast (active tab):** active-tab text is `var(--accent)` (default Copper `oklch(0.68 0.17 45)` ≈ `#dd8b46`) over the bar's `rgba(18,15,14,0.75)` bg with the additional 18% accent tint. Effective contrast against the warm-black under-color ≈ 6.2:1 (AA for large text and AA for normal text at 18px+; the 10px label is slightly under-spec but acceptable for navigation chrome where the icon redundantly conveys identity).
- **Color contrast (inactive tab):** `rgba(255,255,255,0.55)` over `rgba(18,15,14,0.75)` ≈ 7.5:1 (AAA).
- **Reduced motion:** Phase 175's `.press-anim` reduced-motion override applies (50ms linear) when Pressable composes the press transition. The bar's own `.22s`/`.3s` transitions do NOT collapse under reduced-motion (out of scope per CONTEXT `<deferred>`). Acceptable per a11y precedent: ≤300ms transitions are below the WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions) flicker threshold.

### `<NavbarConnectionStatusChip>`

- **Role:** decorative status indicator. The wrapping `<div>` has no semantic role (not `role="status"` because the underlying Phase 144 component already manages live-region semantics if any). The wrapper is purely a positioning concern.
- **Pass-through a11y:** all ARIA semantics inherit from the existing `<NavbarConnectionStatus>` component (Phase 144). Phase 181 does NOT modify those.
- **Hide behavior:** when `body[data-sheet-open="true"]`, the chip slides up off-screen (`translateY(-140%)`) AND becomes `pointer-events: none`. Screen readers visually-hidden via the slide-out + opacity 0 (the chip remains in the DOM tree, but `pointer-events: none` + `opacity: 0` is sufficient — and Phase 144 does not announce status changes as live updates per default).

### `<AltroPage>` + `<AltroRow>`

- **Page structure:** single `<h1>` ("Altro") provided by the page-level Phase 177 page-header pattern (or omitted if the page is rendered without a header — the bar's `aria-current="page"` + the `<CardHead>` group titles provide sufficient landmark structure). A `<main>` is provided by `app/layout.tsx`.
- **Group landmarks:** each `<GlassCard>` group has its `<CardHead>` rendering an `<h2>` with the group title (`Dispositivi`, `Sistema`, `Impostazioni`, `Account`) — Phase 177 primitive default.
- **Row interaction:** each `<AltroRow>` renders `<Pressable as={Link or 'a'} href tabIndex={0}>`. Native `<a>` semantics apply. Tab cycles forward; Enter activates. Esci row uses `<a href>` (not `<Link>`) so Auth0 server-side redirect handles the navigation — RESEARCH Pattern 11 carry-over.
- **Visual focus ring:** same Phase 175 global rule as the tab buttons (accent `:focus-visible` outline on `data-pressable-focusable="true"`).
- **Color contrast (Esci row):** `#ff8a4a` (flame-red label) over `rgba(255,255,255,0.04)` row bg over the page's `#0a0908` base ≈ 4.9:1 (AA for normal text). Acceptable.
- **Color contrast (regular rows):** `var(--text-1)` (`#f5f5f4`) over the same nested bg ≈ 16.8:1 (AAA).
- **Trailing chevron:** decorative; `<ChevronRight aria-hidden="true">` (Phase 177 / Phase 179 convention).

---

## Responsive Behavior

Phase 181 ships ONE breakpoint: `@media (min-width: 640px)` — Tailwind's `sm` threshold. Two CSS rules toggle on this breakpoint (per RESEARCH Pattern 8): the desktop centering rule and the desktop combined-translate hide rule.

### `<BottomTabBar>`

- **<640px (mobile):** full-width pill `left: 12, right: 12` with `bottom: calc(8px + env(safe-area-inset-bottom))`. Spans viewport minus 24px (12px each side).
- **≥640px (desktop):** centered 480px pill via `left: 50%, right: auto, transform: translateX(-50%), width: 480px, max-width: calc(100vw - 24px)`. The `max-width: calc(100vw - 24px)` is a guard for ultra-narrow desktop windows (e.g., 480px viewport at exactly the breakpoint — the bar would otherwise overflow).
- **Hide-when-sheet-open mobile:** `transform: translateY(140%)` overrides the no-op base `transform`.
- **Hide-when-sheet-open desktop:** `transform: translate(-50%, 140%)` — combines centering's `translateX(-50%)` with the hide's `translateY(140%)`. Without this combined rule, the desktop bar slides off-screen horizontally instead of straight down (RESEARCH Pitfall 2).
- **Orientation changes:** the bar adapts to viewport width changes via `@media` re-evaluation. iOS `env(safe-area-inset-*)` updates on orientation change; the `calc()` re-computes; no JS handler needed (NAV-04 SC verified).

### `<NavbarConnectionStatusChip>`

- **All viewports:** fixed at top-right `top: calc(env(safe-area-inset-top) + 12px), right: 12, zIndex: 150`. No breakpoint-conditional behavior. The chip is small enough (intrinsic Phase 144 component size) that desktop and mobile share identical positioning.
- **Hide-when-sheet-open:** identical at all viewports — slides up `translateY(-140%)`.

### `<AltroPage>`

- **All viewports:** vertical stack, single column. Each `<GlassCard>` group spans the available width. AltroPage is contained within `<main>` whose `app/layout.tsx`-defined padding clears the bar (`pb-[calc(env(safe-area-inset-bottom)+88px)]`) and the WS chip (`pt-[calc(env(safe-area-inset-top)+12px)]`).
- **No mobile-vs-desktop divergence** beyond what `<main>` already imposes. The page is a list; lists scale linearly with viewport width.

### iOS PWA standalone-mode considerations (NAV-04)

- `apple-mobile-web-app-status-bar-style: black-translucent` is already set in `app/layout.tsx:33`. Phase 181's chrome-less top works in standalone mode.
- WS chip's `top: calc(env(safe-area-inset-top) + 12px)` ensures it sits BELOW the iOS status bar area in standalone mode (the `env(safe-area-inset-top)` returns 47px on notched iPhones in standalone mode).
- Bar's `bottom: calc(8px + env(safe-area-inset-bottom))` clears the home-indicator (34px on notched iPhones).
- `<main>` padding `pb-[calc(env(safe-area-inset-bottom)+88px)]` ensures content doesn't go under the bar even when the user scrolls to the bottom of the page.

### Playwright verification scope (per RESEARCH Pattern 9 — Approach A)

Headless Chromium does NOT simulate iOS home-indicator inset (`env(safe-area-inset-bottom)` returns 0). The Playwright spec `tests/smoke/bottom-tab-bar.spec.ts` therefore asserts the **CSS contract** rather than a real-device value:
- At 375×812 viewport: assert `getComputedStyle(bar).bottom === '8px'` (env=0 in headless → calc(8px + 0) = 8px) AND assert the source CSS string includes `env(safe-area-inset-bottom)`.
- At 1280×800 viewport: assert bar `width === 480` AND `left + width/2 ≈ viewport.width/2 ± 4px`.
- Hide-on-sheet-open: open the StoveSheet from `/`; assert bar's `getBoundingClientRect().top > viewport.height - 10`.
- Real-device safe-area verification deferred to manual UAT (same tradeoff as Phase 53/97 PWA tests).

---

## Component Inventory (deliverables this phase)

| Component | Path | New/Edit | LOC budget | Visual Contract |
|-----------|------|----------|------------|-----------------|
| `<BottomTabBar>` | `app/components/EmberGlass/BottomTabBar.tsx` | new | ~120 | 4-tab glass pill, fixed-bottom, accent active state, lucide icons, data-bottom-tab attribute, top-of-file z-index comment (150 vs Sheet 200/201) |
| `<NavbarConnectionStatusChip>` | `app/components/layout/NavbarConnectionStatusChip.tsx` | new | ~25 | Thin fixed-position wrapper around existing Phase 144 NavbarConnectionStatus; data-ws-chip attribute |
| `<AltroPage>` | `app/components/EmberGlass/altro/AltroPage.tsx` | new | ~150 | 4 GlassCard groups (Dispositivi data-driven, Sistema/Impostazioni/Account static), inline ICON_MAP for device-icon-string → lucide component, inlined fetch of /api/devices/config + /api/user |
| `<AltroRow>` | `app/components/EmberGlass/altro/AltroRow.tsx` | new | ~50 | Glass row primitive: Pressable + Link/a + leading icon + label + spacer + trailing ChevronRight |
| `app/altro/page.tsx` | new route | new | ~30 | 'use client' route mounting `<AltroPage />`; auth via ClientProviders (mirrors app/stanze/page.tsx) |
| `SheetCounter.ts` | `app/components/EmberGlass/SheetCounter.ts` | new | ~25 | Pure module-level counter (increment/decrement/sync); SSR-guarded; clamps at 0 |
| `<Sheet>` augmentation | `app/components/EmberGlass/Sheet.tsx` | edit (additive 2 lines + 1 import) | ~3 LOC delta | Add `incrementSheetCount()` after existing scroll-lock setup; add `decrementSheetCount()` in cleanup; import from SheetCounter |
| `globals.css` rules (6 total) | `app/globals.css` | edit (append after line 340+) | ~30 | Transition rule + 4 hide/center rules (mobile + desktop combined-translate) + chip transition + chip hide rule |
| `app/layout.tsx` swap | `app/layout.tsx` | edit | ~15 LOC delta | Remove `<Navbar />` + `<Footer />` mount (do NOT delete the source files); add `<BottomTabBar />` + `<NavbarConnectionStatusChip />`; retune `<main>` padding to `pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+88px)] px-4 sm:px-6 lg:px-8` |
| Barrel export | `app/components/EmberGlass/index.ts` | edit | ~3 LOC delta | Add `BottomTabBar`, `AltroRow` re-exports; SheetCounter helpers stay internal (not re-exported) |
| BottomTabBar Jest spec | `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` | new | ~120 | 6 specs: 4 tabs render, active state per pathname, prefix match, no active for non-tab routes, Link href map, data-bottom-tab attribute, aria-current="page" on active |
| SheetCounter Jest spec | `app/components/EmberGlass/__tests__/SheetCounter.test.ts` | new | ~80 | 6 specs: increment sets attr, double-increment idempotent, single-decrement preserves, double-decrement clears, clamps below zero, SSR safety |
| Sheet extension Jest spec | `app/components/EmberGlass/__tests__/Sheet.test.tsx` | edit | ~30 LOC delta | Add 3 specs: open=true sets body attr, unmount/close clears, two stacked sheets keep attr until both close |
| AltroPage Jest spec | `app/altro/__tests__/page.test.tsx` | new | ~80 | 4 specs: 4 group headings render, Esci row links to /auth/logout with #ff8a4a, always-present links render (Log/Registro/Changelog/Esci), auth wrapper present |
| Chip Jest spec | `app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` | new | ~40 | 3 specs: data-ws-chip attribute, fixed-position style, NavbarConnectionStatus child rendered |
| Playwright smoke spec | `tests/smoke/bottom-tab-bar.spec.ts` | new | ~200 | 7 specs: safe-area at 375×812, click each tab routes correctly, click Stanze sets accent color, click Altro renders Esci row, sheet-open hides bar, desktop center 1280×800, console-errors gate via `collectConsoleErrors` |

**Total LOC budget:** ~430 production + ~550 test + ~90 layout/css edits = **~1070 LOC across 13 files** (8 new, 5 edits).

**Components NOT shipped in this phase:**
- Per-tab badges / unread dots — deferred (CONTEXT `<deferred>`).
- Haptic feedback on tab press — deferred.
- Drag-/swipe-/long-press-to-rearrange tabs — deferred.
- Keyboard arrow-key nav between tabs — deferred (Tab/Enter via `<Pressable as={Link}>` + native `<a>` is sufficient).
- Reduced-motion bar override — deferred (Phase 175's `.press-anim` reduced-motion already applies to press scale; bar's `.22s`/`.3s` transitions are below the WCAG flicker threshold).
- Active-tab indicator dot/underline — deferred (bundle uses background tint + accent text + glow ring; no dot).
- AltroPage settings rows for `/settings/account`, `/settings/gdpr`, `/settings/privacy` — deferred (routes don't exist on disk per RESEARCH Pattern 12).
- Phase 182 design-system-v2 reference page extension showing the bar — Phase 182 problem.
- Replacing `getNavigationStructureWithPreferences` with a v20.0-native config — deferred to a later phase.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn (`components.json` confirmed absent at 2026-05-02) | not applicable |
| third-party | none | not applicable |

**Notes:**
- Phase 181 introduces NO new third-party packages. All listed dependencies (`@radix-ui/react-dialog ^1.1.14`, `lucide-react ^0.562.0`, `next ^16.1.0`, `react`, `@auth0/nextjs-auth0 ^4.13.1`, Tailwind v4, `@playwright/test`) already present in `package.json`.
- Vetting gate: not required (no third-party blocks).

---

## Verification Mapping (downstream consumers)

| Requirement | Visual contract surface | Verification method |
|-------------|-------------------------|---------------------|
| NAV-01 (glass surface + bottom-pin) | §Component API "Container styling" — fixed position, glass surface tokens (75% bg, 30px blur+saturate, 0.5px border, bundle shadow), `data-bottom-tab="true"` selector hook | Jest `BottomTabBar.test.tsx` spec #6 (data-bottom-tab attribute); Playwright `tests/smoke/bottom-tab-bar.spec.ts` spec #1 (375×812 viewport; assert computed `bottom: '8px'`); Playwright spec #6 (1280×800; assert width=480 + centered) |
| NAV-02 (4 sections + accent + glow active state) | §Component API "Tab → route map" + "Active state visual contract" — 4 lucide icons, Italian labels, `var(--accent)` text + 18% bg tint + two-layer glow ring | Jest `BottomTabBar.test.tsx` specs #1-3 (4 labels render; mock pathname `/` → Casa active; mock pathname `/stanze/sala` → Stanze active via prefix match); Playwright spec #2 (click Stanze → URL `/stanze` + computed color matches `var(--accent)` resolved RGB) |
| NAV-03 (hide under open sheet) | §Component API "Hide-on-sheet-open mechanism" + §SheetCounter + §Sheet augmentation — `body[data-sheet-open="true"]` CSS selector + counter logic + 2-line additive Sheet effect | Jest `SheetCounter.test.ts` (6 specs); Jest `Sheet.test.tsx` extension (open sets attr; unmount clears; two stacked sheets); Playwright spec #5 (open StoveSheet from `/` → bar.getBoundingClientRect().top > viewport.height - 10) |
| NAV-04 (iOS env(safe-area-inset-bottom)) | §Spacing "Safe-area insets" + §Component API "Container styling" — `bottom: calc(8px + env(safe-area-inset-bottom))` | Playwright spec #1 (computed `bottom: '8px'` at headless 375×812 since env=0; CSS source string includes `env(safe-area-inset-bottom)`); manual UAT for real-device 34px inset on iPhone PWA standalone |
| Inherited DS-02 (no hardcoded glass/blur/accent in new files) | §Color "Documented AUDIT-EXCEPTIONs" table | Repo grep against new files; AUDIT-EXCEPTION-tagged lines tolerated (8 entries listed) |
| Inherited DS-07 (Pressable utility reused) | §Component API "Tab button styling" + §Accessibility "Tab buttons (focus management)" — every tab + every altro row uses `<Pressable as={Link} tabIndex={0}>` | Per-phase grep invariant: `grep -r 'Pressable' app/components/EmberGlass/BottomTabBar.tsx app/components/EmberGlass/altro/` returns ≥2 matches (one for tab buttons, one for AltroRow) |
| Phase-175 SHEET-01 augmentation correctness | §Sheet augmentation — additive 2-line patch; ZERO prop/visual/z-index changes | Jest `Sheet.test.tsx` extension specs (3 new); existing Phase 175 Sheet specs continue to pass unchanged |

---

## Claude's Discretion (auto-resolved)

Items where CONTEXT.md or RESEARCH.md left planner freedom; UI-SPEC locks visual answers so the planner has zero ambiguity:

| Item | Resolution | Rationale |
|------|------------|-----------|
| `/altro` Dispositivi data source — fetch in-page or hook extraction | **Inline the fetch in `AltroPage`** (mirrors legacy `Navbar.tsx:142-167` shape) | RESEARCH OQ-1 recommendation. One-call pattern; if Phase 182 DSREF needs the same data, extract a `useEnabledDevices` hook then. |
| Settings routes named in CONTEXT D-12 that don't exist on disk | **Render only the existing 7 routes**: Generali, Notifiche, API Keys, Dashboard, Dispositivi, Posizione, Termostato. Defer `/settings/account`, `/settings/gdpr`, `/settings/privacy` (don't render). | RESEARCH Pattern 12 + OQ-2 resolution. `ls app/settings/` confirmed at 2026-05-02. Rendering missing routes would break the Pressable's Link prefetch and produce 404s. |
| WS chip during open sheet — hide it too? | **YES, hide the chip too.** Add `body[data-sheet-open="true"] [data-ws-chip="true"] { transform: translateY(-140%); opacity: 0; pointer-events: none }` rule | RESEARCH Pitfall 7 + OQ-3 recommendation. Without this, the chip remains at top-right while the sheet's close button is also at top-right → visual conflict. The chip slides UP off-screen; the bar slides DOWN. |
| `SheetCounter.ts` helpers barrel-exported or kept internal | **Keep internal** (not re-exported from `EmberGlass/index.ts`). | Counter is an implementation detail of Sheet's hide-when-open contract. External consumers should never call it directly. Phase 182 DSREF page does not need it. |
| Auth0 logout row — `<Link>` or `<a>`? | **`<a>` (via `external={true}` AltroRow prop)** | Auth0 `/auth/logout` is a server-side redirect endpoint; `<Link>`'s prefetch would attempt to prefetch the logout endpoint and could cause spurious session-clearing. Plain `<a href>` lets the browser do a full navigation. RESEARCH Pattern 11 carry-over from legacy Navbar. |
| Lucide icons for AltroPage Sistema/Impostazioni rows | **Choose icons that already appear elsewhere in the codebase**: `<ScrollText>` (Log), `<Boxes>` (Registro), `<History>` (Changelog), `<Settings>` (Generali), `<Bell>` (Notifications), `<KeyRound>` (API Keys), `<LayoutDashboard>` (Dashboard), `<Cpu>` (Devices), `<MapPin>` (Location), `<Thermometer>` (Thermostat), `<LogOut>` (Esci). | Avoid introducing new icons (Phase 181 introduces no new lucide imports beyond bar tabs and ChevronRight). All listed icons are already imported by Phase 178/179/180 source files. |
| Tab button `aria-current` value | **`"page"`** (not `"true"` or `"location"`) | WAI-ARIA recommends `aria-current="page"` for the currently-displayed page in a navigation set. Phase 181 verifies via Jest spec #2. |
| Bar `<nav>` aria-label | **`"Navigazione principale"`** (Italian, matches `<html lang="it">`) | Italian convention; "primary navigation" → "Navigazione principale". Single landmark per page. |
| Reduced-motion handling for bar transitions | **Defer.** The `.22s`/`.3s` transitions are below the WCAG 2.1 flicker threshold; Phase 175's `.press-anim` reduced-motion already applies to press-scale (composed via Pressable). | Cost-benefit: a `@media (prefers-reduced-motion: reduce)` override for the bar's transitions would add ~6 LOC and reach approximately zero users (bar transitions are short-duration ease curves, not seizure-class). Phase 176 covers reduced-motion globally for the splash; bar is acceptable as-is. |
| Esci row destructive-confirmation pattern | **No two-step confirmation.** Single-click logout. Flame-red color (#ff8a4a) is brand-consistency with legacy Navbar, NOT a destructive-confirmation semantic. | Auth0 logout is reversible via re-auth; not a destructive action in the GSD-checker sense (no data loss). Adding a confirmation dialog would diverge from legacy Navbar UX. |
| Order of group-rendering in AltroPage | **Top → bottom: Dispositivi, Sistema, Impostazioni, Account.** | CONTEXT D-12 lists this order; matches "frequency of use" heuristic (devices > system > settings > exit). |
| Inter-group `gap` value | **`gap: 24`** (between consecutive `<GlassCard>` instances) | CONTEXT D-12 mention "24px between groups"; matches the Ember Glass 4-multiple scale. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all UI copy declared (IT), 4 tab labels + 4 group titles + 11 row labels (Sistema 3 + Impostazioni 7 + Account 1), Esci row destructive-confirmation declared as n/a with rationale, error/empty states declared as n/a with rationale, no copy duplicated from Phase 144 chip.
- [ ] Dimension 2 Visuals: PASS — bar container styling pixel-precise (10 inline-style properties), tab button styling pixel-precise (10 properties + active variant), 6 globals.css rules enumerated (transition + 2 hide rules + 2 desktop-center rules + chip hide), AltroRow styling pixel-precise (10 properties), z-index reservations documented (150 vs Sheet 200/201).
- [ ] Dimension 3 Color: PASS — 60/30/10 split declared, accent reserved-for list (4 explicit items: active text + active bg tint + active glow ring + Pressable focus-visible outline), Esci flame-red distinguished from accent reserved list, 8 AUDIT-EXCEPTION literals enumerated with bundle source line references, color-mix(in oklab, ...) browser support verified per RESEARCH Pattern 7.
- [ ] Dimension 4 Typography: PASS — 4 sizes declared (10/12/16/24) and 2 weights (400/600); TYPOGRAPHY-EXCEPTION at 10px (tab label) explicitly documented; fonts inherited from Phase 174 token aliases.
- [ ] Dimension 5 Spacing: PASS — multiples-of-4 scale declared; bundle-verbatim micro-affordances called out (0.5px borders, 3px tab gap, 10px+8px asymmetric tab padding, 1.8/2.2 lucide stroke); safe-area inset math documented; z-index reservations documented; touch target exceptions for the 30px-tall tab buttons declared with rationale (full grid cell width compensates).
- [ ] Dimension 6 Registry Safety: PASS (vacuous) — no shadcn, no third-party blocks, no new deps.

**Approval:** pending (gsd-ui-checker)
