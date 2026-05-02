# Phase 181: Glass Bottom Tab Bar - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 181-glass-bottom-tab-bar
**Mode:** `--auto --chain` (recommended-default selection across all areas)
**Areas discussed:** namespace+layout, route map + active state, pinning + safe-area, hide-when-sheet-open mechanism, Sheet primitive augmentation, /altro route content, WS chip migration, layout.tsx swap, test coverage, plan layout hint.

---

## Tab → Route Map

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle verbatim with English routes (`/home`, `/rooms`, `/automations`, `/more`) | English-only routes; conflicts with v20.0 Italian routing | |
| Italian routes matching prior phases (`/`, `/stanze`, `/automazioni`, `/altro`) — bundle labels in Italian (Casa / Stanze / Automazioni / Altro) | Symmetry with Phase 179 D-04 / Phase 180 D-06 routing convention | ✓ |
| Italian labels but English routes for `/more` | Inconsistent | |

**Selected:** Italian routes + Italian labels per Phase 179 / 180 convention. Bundle's "Casa" beats English "Home" (D-05).

---

## Active-Tab Visual Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle verbatim — accent-tint background + accent text only | Misses SC-#2 "glow" wording | |
| Accent-tint background + accent text + accent glow ring (`box-shadow: 0 0 0 1px ..., 0 0 12px ...`) | Satisfies SC-#2 "accent color + glow"; auto-repaints on accent picker change (Phase 174 D-03) | ✓ |
| Bottom underline indicator | Bundle has no underline; new pattern | |

**Selected:** Tint + text + glow ring (D-07).

---

## Pinning & Safe-Area

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle verbatim `bottom: 16` (no safe-area inset) | Fails NAV-04 on iOS PWA | |
| `bottom: calc(8px + env(safe-area-inset-bottom)); left/right: 12; max-width 480 centered ≥sm` | Satisfies NAV-04 + SC-#1 + SC-#4 | ✓ |
| Edge-to-edge bar (`left/right: 0`) on all viewports | Looks heavy on desktop | |

**Selected:** Inset-aware fixed positioning + centered desktop pill (D-08).

---

## Hide-When-Sheet-Open Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| React Context (`SheetOpenContext`) — every Phase 178 sheet body opts in | Requires retrofitting every Sheet consumer | |
| Body data-attribute toggled by `Sheet.tsx` (CSS-only consumer) | Single Sheet augmentation; framework-agnostic; cross-cutting via `body[data-sheet-open]` selector | ✓ |
| Z-index war (bar at z-150, sheet at z-201, no hide — overlap accepted) | Phase goal explicitly says "hides under open sheets" | |

**Selected:** Body data-attribute + CSS hide rule (D-09).

---

## Stacked-Sheet Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Boolean flag (single Sheet → flag on, close → flag off) | Breaks under stacked sheets — closing inner sheet flips bar back on while outer still open | |
| Counter (`incrementSheetCount` / `decrementSheetCount` — only clear flag at zero) | Supports any depth of stacking; SSR-guarded | ✓ |

**Selected:** Counter-based stacking (D-10).

---

## /altro Route Content

| Option | Description | Selected |
|--------|-------------|----------|
| Open a Sheet on Altro click (no new route) | Asymmetric with /stanze, /automazioni; can't be deep-linked | |
| New `/altro` route with glass list of devices + sistema + impostazioni + logout | Symmetric with Phase 179 / 180; replaces legacy hamburger menu | ✓ |
| Empty placeholder page ("coming soon") | Fails NAV-02 ("each section with icon + label" implies reachable content) | |

**Selected:** Full `/altro` page with 4 glass groups (D-12).

---

## WS Connection Chip Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Mount inline inside `BottomTabBar` (5th cell) | Bundle defines exactly 4 tabs; bar gets crowded | |
| Mount inside `/altro` page only | Status invisible from other pages | |
| Standalone floating chip top-right (`fixed; top: env(safe-area-inset-top)+12; right: 12; z-150`) | Always visible; legacy `<NavbarConnectionStatus />` reused untouched | ✓ |

**Selected:** Standalone chip wrapper (D-13).

---

## Legacy Navbar / Footer Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Delete `Navbar.tsx`, `navigation/`, `Footer.tsx`, related tests in this phase | Aggressive; couples chrome swap with cleanup | |
| Unmount from `app/layout.tsx` but keep files in repo for cleanup phase post-Phase 182 | Symmetric with Phase 179 D-04 / Phase 180 D-06 leaving legacy parallel routes | ✓ |
| Mount BOTH legacy Navbar AND new BottomTabBar | Two chromes simultaneously — explicit anti-pattern | |

**Selected:** Unmount-but-keep (D-04). Cleanup phase post-Phase 182 bundles all legacy deletion.

---

## Test Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Jest only — skip Playwright | Misses SC-#4 viewport-specific safe-area assertion | |
| Jest (BottomTabBar / SheetCounter / Sheet extension / AltroPage) + Playwright (375×812 + sheet-hide + desktop center + console errors) | Each SC has a structural verifier | ✓ |
| Playwright only — skip Jest | Loses unit-level guarantees on counter logic | |

**Selected:** Jest + Playwright dual coverage (D-14 / D-15).

---

## Claude's Discretion

- Exact hex value of the accent-glow ring (used `color-mix(in oklab, var(--accent) 60%, transparent)` per Phase 174 token convention).
- Lucide icon for "Stanze" — picked `LayoutGrid` (replaces bundle's ad-hoc `IconGrid`).
- Lucide icon for "Altro" — picked `MoreHorizontal` (replaces bundle's ad-hoc `IconMore`).
- Stroke-width values for active vs inactive tab icons (`2.2` / `1.8` per bundle line 372).
- Exact `<main>` padding values in `app/layout.tsx` (computed: 88px bottom = 64px bar + 16px breathing + 8px offset).
- Whether to expose `SheetCounter` helpers from the EmberGlass barrel (left internal — only `Sheet.tsx` consumes them).
- Plan wave breakdown (informational hint to gsd-planner; planner has final say).

## Deferred Ideas

- Cleanup phase post-Phase 182 — delete legacy chrome bundle (~1500 LOC).
- Per-tab badges / unread dots.
- Haptic feedback on tab press (iOS).
- Keyboard arrow-key navigation between tabs.
- Reduced-motion variant.
- Drag-to-reorder tabs.
- Replacing `getNavigationStructureWithPreferences` with v20.0-native config.
- PWA install prompt repositioning if visual conflict surfaces.
- Active-tab underline indicator (if product wants more emphasis later).
