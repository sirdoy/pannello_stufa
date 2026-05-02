# Phase 181: Glass Bottom Tab Bar - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC-#1..#4, REQUIREMENTS.md NAV-01..04, the design bundle (`app.jsx:340-379`), Phase 175 Sheet primitive (z-index 200/201, body scroll-lock), and Phases 177/179/180 locked CONTEXT discipline (parallel-route + leave-legacy-untouched).

<domain>
## Phase Boundary

Ship the **Ember Glass bottom tab bar** as the new primary navigation chrome for the v20.0 app shell. Concretely:

1. New component `<BottomTabBar />` rendering 4 tabs verbatim from bundle (`app.jsx:342-379`):
   - `Home` → `/` (icon: `Home` / lucide)
   - `Stanze` → `/stanze` (icon: `LayoutGrid` — replaces bundle ad-hoc `IconGrid`)
   - `Automazioni` → `/automazioni` (icon: `Zap`)
   - `Altro` → `/altro` (icon: `MoreHorizontal`)
2. Visual surface: translucent + backdrop-blur glass pill (`background: rgba(18,15,14,0.75); backdropFilter: blur(30px) saturate(180%); border: 0.5px solid rgba(255,255,255,0.1); borderRadius: 28; padding: 6; boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.06)'`).
3. Active tab highlighted via accent tint background (`color-mix(in oklab, var(--accent) 18%, transparent)`) **plus** an accent glow ring (`0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)`) — D-08. Inactive tabs use `rgba(255,255,255,0.55)` text.
4. Pinned to viewport bottom on mobile and to the app shell on desktop, surviving orientation changes — `position: fixed; bottom: calc(8px + env(safe-area-inset-bottom)); left: 12px; right: 12px; z-index: 150;` with `max-width: 480px; left: 50%; transform: translateX(-50%);` on `≥sm` breakpoints (NAV-04 + SC-#1).
5. Hides under any open Phase 175 `<Sheet>` via a `body[data-sheet-open="true"]` selector — slide down + fade out (`transform: translateY(140%); opacity: 0; transition: transform .3s, opacity .2s`), reappears on close (NAV-03 / SC-#3).
6. Replaces the legacy `<Navbar />` mount in `app/layout.tsx` — the two coexist for one phase; legacy file stays in place for cleanup phase post-181 (D-04).
7. New `/altro` route page renders the secondary navigation (devices + settings + logout) the legacy Navbar previously exposed via hamburger menu.
8. WS connection status (`<NavbarConnectionStatus />` from Phase 144 / Phase 17.0) survives the chrome swap as a stand-alone floating chip mounted by `app/layout.tsx`.

In scope (file layout):

- `app/components/EmberGlass/BottomTabBar.tsx` — the tab bar component itself. `'use client'`, inline-style + `var(--token)` (Phase 174 D-12 / 175 D-08 / 177 D-02 / 178 D-02 / 179 D-02 / 180 D-02). Reads `usePathname()` from `next/navigation` to compute active tab. Renders each tab via `<Pressable as="a">` (Phase 175 D-03) wrapping `next/link`'s `<Link>` for client-side routing.
- `app/components/EmberGlass/BottomTabBar.module.css` — **NOT created**. Inline-style discipline locked by Phase 174 D-12. The `body[data-sheet-open]` hide rule is added directly in `app/globals.css` (D-09).
- `app/components/EmberGlass/Sheet.tsx` — **augmented** with a body-attribute counter (D-10): on open `document.body.dataset.sheetOpen = 'true'` (counter-incrementing), on close decrement; remove attribute when counter reaches 0. Stacked sheets supported. Survives React 18 Strict Mode double-mount via the same `useRef` pattern Phase 175 D-11 uses for scroll-lock.
- `app/components/EmberGlass/SheetCounter.ts` — small module-level counter + `incrementSheetCount()` / `decrementSheetCount()` helpers. Pure functions, no React. Sheet.tsx imports them from its `useEffect`.
- `app/components/EmberGlass/index.ts` — barrel re-export adds `BottomTabBar`.
- `app/layout.tsx` — **edits**:
  - Remove `import Navbar from './components/Navbar';` and the `<Navbar />` mount.
  - Remove `import { Footer } from './components/ui';` and the `<Footer />` mount (no equivalent in v20.0 design; legacy Footer kept in repo for cleanup phase).
  - Add `import { BottomTabBar } from './components/EmberGlass';` and mount `<BottomTabBar />` after `</main>`.
  - Add `import { NavbarConnectionStatus } from './components/layout/NavbarConnectionStatus';` and mount as a standalone floating chip at `position: fixed; top: calc(env(safe-area-inset-top) + 12px); right: 12px; z-index: 150;` — wrapped in a thin `<NavbarConnectionStatusChip>` client component that adds the floating positioning (avoids pulling Phase 144's component out of context).
  - `<main>` className changes from `flex-1 pt-2 pb-12 px-4 sm:px-6 lg:px-8` to `flex-1 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+88px)] px-4 sm:px-6 lg:px-8` so content clears the new bar (88px = 64px bar + 16px breathing + 8px bottom offset; bar uses `env(safe-area-inset-bottom)` itself per D-07).
- `app/components/layout/NavbarConnectionStatusChip.tsx` — new thin wrapper: `'use client'`, renders `<NavbarConnectionStatus />` in a fixed-position container. ~25 LOC.
- `app/altro/page.tsx` — new route. `'use client'` + reuses the same auth-guard pattern Phase 179 D-04 / Phase 180 D-29 confirmed in `app/stanze/page.tsx`. Renders an `<AltroPage />` component composed of glass list rows.
- `app/components/EmberGlass/altro/AltroPage.tsx` — page body: glass `<GlassCard>` (Phase 177) groups for *Dispositivi* (Stufa / Termostato / Luci / Sonos / DIRIGERA / Tuya / Network / Raspberry Pi / Telefonia per `getNavigationStructureWithPreferences` device list), *Impostazioni*, *Sistema* (Log, Registro, Changelog), and *Account* (Logout). Each row is a `<Pressable as="a" href={route}>` with leading lucide icon + label + `ChevronRight` trailing. Italian copy verbatim from legacy `Navbar.tsx`.
- `app/components/EmberGlass/altro/AltroRow.tsx` — single-row primitive (icon + label + chevron, glass-tinted). Re-export from `EmberGlass/index.ts` for Phase 182 DSREF page.
- `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` — Jest spec.
- `app/components/EmberGlass/__tests__/Sheet.test.tsx` — Jest spec extension: assert body attribute is set on open and cleared on close (counter behavior via two stacked sheets).
- `app/components/EmberGlass/__tests__/SheetCounter.test.ts` — Jest spec for the pure counter (increment / decrement / multi-instance).
- `app/altro/__tests__/page.test.tsx` — Jest spec: route renders, all expected sections present, links go to expected routes.
- `tests/playwright/bottom-tab-bar.spec.ts` — new Playwright spec (D-13).

Out of scope (future phases or explicitly deferred):

- **Deleting `app/components/Navbar.tsx`, `app/components/navigation/`, `app/components/Navbar.test.tsx`, `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx`, `app/components/Footer.tsx`** — same pattern as Phase 179 D-04 (kept legacy `/rooms`) and Phase 180 D-06 (kept legacy `/automations`). Phase 181 unmounts but does not delete. A cleanup phase post-Phase 182 decides their fate. **Plans MUST NOT delete these files in Phase 181.**
- **Migrating `app/stove/components/StovePageNavigation.tsx`** to use the bottom tab bar — that's a per-page sub-nav inside `/stove`, untouched here.
- **Drag-/swipe-/long-press-to-rearrange** the 4 tabs — fixed order per bundle and NAV-02.
- **Per-tab badges / unread dots** (e.g., "3 errori" on Altro→Stufa) — bundle has no badges; defer.
- **Haptic feedback** on tab press (iOS-style) — defer.
- **Reduced-motion variant** — Phase 176 covers reduced-motion globally; this bar uses transitions ≤ 300ms which is acceptable; no extra logic in this phase. Tracked in `<deferred>` only if user follow-up requests.
- **Active-tab indicator dot/underline** — bundle uses background tint + accent text + glow ring (D-08). No bottom dot. Defer.
- **Keyboard navigation arrows** (←/→ to move between tabs) — Phase 175's Pressable + `<Link>` handle Tab/Enter; arrow-key navigation within the bar is not in NAV-01..04. Defer.
- **Phase 182 (Design System Reference Page v2)** consumes `<BottomTabBar />` as a sample — out of scope here.
- **Replacing `getNavigationStructureWithPreferences`** with a v20.0-native config — `/altro` reuses the existing helper. Refactor in a later phase.
- **Re-introducing the legacy logo / "🔥 Smart Home" header** anywhere — bundle has no header; v20.0 ships chromeless top.
- **Theme-color meta tag updates** (`<meta name="theme-color" content="#0f172a">` in `app/layout.tsx`) — keep as-is; the dark-only token is unchanged.
- **PWA install prompt repositioning** — InstallPrompt (Phase 53) currently auto-mounts inside ClientProviders; Phase 181 does not move it. Defer if visual conflict surfaces.

</domain>

<decisions>
## Implementation Decisions

### Namespace, layout, conventions

- **D-01:** [informational] All new tab-bar files live under `app/components/EmberGlass/` — sibling to `BottomTabBar.tsx` itself, plus `altro/` subnamespace for the `/altro` page body. Mirrors Phase 178 (`sheets/`), 179 (`rooms/`), 180 (`automations/`) namespacing. Re-exported from `app/components/EmberGlass/index.ts` so Phase 182 DSREF page can import via `@/app/components/EmberGlass`.
- **D-02:** [informational] **Inline-style + `var(--token)` discipline** from Phase 174 D-12 / 175 D-08 / 176 D-23 / 177 D-02 / 178 D-02 / 179 D-02 / 180 D-02 is mandatory. **No Tailwind classes for visual values inside any `BottomTabBar` or `altro/` file.** Layout flex/grid + spacing tokens stay inline too. The single exception is `app/globals.css` for the `body[data-sheet-open="true"] [data-bottom-tab="true"]` hide rule (D-09) — this rule is global cross-cutting and CSS-only is the correct vehicle.
- **D-03:** [informational] `BottomTabBar` and `AltroPage` use `'use client'` (state-bearing — pathname read, route navigation). All sub-components are client components. No server-component refactor.
- **D-04:** **Legacy `Navbar.tsx` + `Footer.tsx` UNMOUNT but DO NOT DELETE.** Symmetric with Phase 179 D-04 (left `/rooms` admin page in place) and Phase 180 D-06 (left `/automations` settings page in place). Files stay in the repo; only `app/layout.tsx` import + JSX mount lines are removed. A cleanup phase scheduled post-Phase 182 deletes the legacy chrome (`Navbar.tsx`, `navigation/`, `Footer.tsx`, `Navbar.test.tsx`, plus the standalone `app/automations/`, `app/rooms/`, `app/automations/[rule_id]/` legacy routes — bundled together).

### Routing & active state

- **D-05:** **Tab → route map (verbatim from bundle, Italianized):**
  | Tab id | Label | Lucide icon | Route | Active match |
  |---|---|---|---|---|
  | `home` | Casa | `Home` | `/` | exact `pathname === '/'` |
  | `rooms` | Stanze | `LayoutGrid` | `/stanze` | `pathname === '/stanze' \|\| pathname.startsWith('/stanze/')` |
  | `automations` | Automazioni | `Zap` | `/automazioni` | `pathname === '/automazioni' \|\| pathname.startsWith('/automazioni/')` |
  | `more` | Altro | `MoreHorizontal` | `/altro` | `pathname === '/altro' \|\| pathname.startsWith('/altro/')` |
  Bundle's label "Casa" beats English "Home" — full Italian per Phase 179 / 180 routing convention. Lucide icons replace bundle's ad-hoc `IconHome` / `IconGrid` / `IconZap` / `IconMore` per Phase 178 D-19 / Phase 179 D-19 / Phase 180 D-19. **Stroke width matches bundle**: `strokeWidth={active ? 2.2 : 1.8}` (lucide accepts numeric stroke).
- **D-06:** **Non-tab routes show NO active tab** (e.g., `/stove/scheduler`, `/lights`, `/settings/api-keys`, `/log`). Reaching these routes still leaves `Casa` un-highlighted — they are accessed via `/altro` or direct URL. Plan agent does NOT add a "synthetic" active state for legacy routes.
- **D-07:** **Active-tab visual treatment** (combines bundle background tint + a glow ring per ROADMAP SC-#2 "accent color + glow"):
  ```ts
  // Active button styles
  background: 'color-mix(in oklab, var(--accent) 18%, transparent)',
  color: 'var(--accent)',
  boxShadow: '0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)',
  // Inactive button styles
  background: 'transparent',
  color: 'rgba(255,255,255,0.55)',
  boxShadow: 'none',
  ```
  Transition: `background .22s, color .22s, box-shadow .22s` (matches bundle line 369 timing). The accent CSS variable comes from Phase 174 D-03 (developer accent picker writes to `--accent`). The active state therefore re-paints automatically whenever the user changes accent — verifies SC-#2 trivially.

### Pinning & safe-area

- **D-08:** **Container positioning** (NAV-01 / NAV-04 / SC-#1 / SC-#4):
  ```ts
  position: 'fixed',
  bottom: 'calc(8px + env(safe-area-inset-bottom))',
  left: 12,
  right: 12,
  zIndex: 150,
  // ≥sm breakpoint via media query in inline-style equivalent (use a wrapper class .bottom-tab-bar with media-query rules in globals.css for the centering ONLY):
  // @media (min-width: 640px) { .bottom-tab-bar { left: 50%; right: auto; transform: translateX(-50%); width: 480px; max-width: calc(100vw - 24px); } }
  ```
  The `left/right: 12px` + safe-area inset directly satisfies NAV-04. The `≥sm` centered-480px branch satisfies SC-#1's "app shell on desktop" wording — keeps the bar from spanning a 1920px viewport edge-to-edge.
  **`z-index: 150`** matches bundle exactly and stays under Phase 175 Sheet's z-200 (backdrop) / z-201 (content) — verified in `app/components/EmberGlass/Sheet.tsx:80,100`. The legacy Navbar's hamburger overlay used z-9000+; that overlay disappears with this phase.
- **D-09:** **Hide-when-sheet-open mechanism** (NAV-03 / SC-#3):
  - Add to `app/globals.css`:
    ```css
    [data-bottom-tab="true"] {
      transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .2s;
    }
    body[data-sheet-open="true"] [data-bottom-tab="true"] {
      transform: translateY(140%);
      opacity: 0;
      pointer-events: none;
    }
    ```
  - `BottomTabBar` root element carries `data-bottom-tab="true"` for the selector hook.
  - The `body[data-sheet-open]` attribute is owned by Phase 175's `<Sheet>` primitive, augmented in this phase per D-10.
  **Why CSS over JS context:** CSS-only avoids bundling a React context that would need every Phase 178 sheet body to opt into. The body-attribute hand-shake is framework-agnostic — works for any future modal/sheet that follows the same convention. Single `globals.css` rule, single `<Sheet>` augmentation, zero runtime React state in `BottomTabBar`.
- **D-10:** **`Sheet.tsx` augmentation — body data-attribute counter.** Phase 175's Sheet does not currently signal "I am open" to siblings. Add to `app/components/EmberGlass/Sheet.tsx`:
  ```ts
  // Inside the existing useEffect that runs on `open` change:
  useEffect(() => {
    if (!open) return;
    incrementSheetCount();
    return () => { decrementSheetCount(); };
  }, [open]);
  ```
  And a new `app/components/EmberGlass/SheetCounter.ts`:
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
  Counter-based so stacked sheets (Phase 178 device sheets, Phase 180 automation editor) all keep the bar hidden until the LAST one closes. SSR-guarded via `typeof document` check.
  **This is the only Phase 175 primitive edit in Phase 181.** Justified: Phase 175 D-02 explicitly leaves room for additive augmentation (it forbids replacement, not extension). The augmentation is non-breaking — every existing Sheet consumer continues to work; only sibling DOM outside the sheet gains the new selector hook.
- **D-11:** **Spacer reflow.** Legacy Navbar's spacer `<div className="h-[calc(4rem+env(safe-area-inset-top))]">` (line 728) goes away. Replace `<main>`'s `pt-2` / `pb-12` with `pt-[calc(env(safe-area-inset-top)+12px)]` / `pb-[calc(env(safe-area-inset-bottom)+88px)]` so:
  - Top: content clears the iOS notch / Dynamic Island.
  - Bottom: content clears the new tab bar (64px height + 16px breathing + 8px bottom offset = 88px). The bar's own `env(safe-area-inset-bottom)` adds extra padding inside the home-indicator area; main padding only needs to clear the visible bar height.
  **Plan agent confirms via Playwright at 375×812 (iPhone X) viewport.**

### `/altro` page

- **D-12:** **`/altro` route content** — single client page rendering 4 glass groups:
  1. **Dispositivi** — links generated from `getNavigationStructureWithPreferences(devicePreferences)` (existing helper in `lib/devices/deviceRegistry`). Each enabled device contributes one `<AltroRow>` linking to its primary route (`/stove`, `/thermostat`, `/lights`, `/sonos`, `/dirigera`, `/network`, `/raspi`, `/telefonia` — the union the legacy Navbar already covers). Italian labels from the same helper.
  2. **Sistema** — `Log` (`/log`), `Registro` (`/registry`), `Changelog` (`/changelog`).
  3. **Impostazioni** — link group for the existing `/settings/*` pages: API Keys (`/settings/api-keys`), Account (`/settings/account`), GDPR (`/settings/gdpr`), Notifications (`/settings/notifications`), Privacy (`/settings/privacy`). Plan agent confirms which exist via `ls app/settings/` and emits any missing ones as deferred.
  4. **Account** — `Logout` (`/auth/logout`) styled in flame-red tone (`color: '#ff8a4a'`) per legacy Navbar line 482.
  Each row is a `<Pressable as={Link} href={route}>` glass surface (Phase 175 D-03) with leading lucide icon + label + trailing `ChevronRight`. Glass styling: same surface tokens as bundle's row pattern (`background: 'rgba(255,255,255,0.04)'; border: 0.5px solid rgba(255,255,255,0.06); borderRadius: var(--r-card); padding: 14px 16px`). Group container = `<GlassCard>` with `<CardHead title={groupLabel} />` (Phase 177 primitives reused).
  WS connection status (legacy `<NavbarConnectionStatus />`) is **NOT** mounted inside `/altro` — it remains a global floating chip per D-13.
- **D-13:** **WS connection chip migration.** Legacy `<NavbarConnectionStatus />` (3-state: connected / connecting / offline) was mounted inside the legacy header. With the header gone, mount it as a floating chip in `app/layout.tsx`:
  ```tsx
  <NavbarConnectionStatusChip />
  ```
  where `NavbarConnectionStatusChip.tsx` is a thin wrapper:
  ```tsx
  'use client';
  import { NavbarConnectionStatus } from './NavbarConnectionStatus';
  export function NavbarConnectionStatusChip() {
    return (
      <div style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        right: 12,
        zIndex: 150,
        pointerEvents: 'auto',
      }}>
        <NavbarConnectionStatus />
      </div>
    );
  }
  ```
  Same z-index as the bottom bar (150) so any sheet (z-200/201) cleanly overlays it. The chip uses `pointer-events: none` on its container if the legacy `NavbarConnectionStatus` includes a click target — plan agent reads the existing component to confirm.

### Tests

- **D-14:** **Jest specs** (one per non-trivial unit):
  - `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx`:
    1. Renders 4 tabs with labels `Casa`, `Stanze`, `Automazioni`, `Altro`.
    2. Mock `usePathname` → `/` ⇒ `Casa` button has `aria-current="page"` and accent styling (assert via inline-style snapshot of `color`).
    3. Mock `usePathname` → `/stanze/sala` ⇒ `Stanze` is active (prefix match per D-05).
    4. Mock `usePathname` → `/stove/scheduler` ⇒ NO tab is active (D-06).
    5. Each tab is wrapped in a `next/link` `<Link>` with `href` matching D-05 map.
    6. Root element has `data-bottom-tab="true"` (D-09 selector hook).
  - `app/components/EmberGlass/__tests__/SheetCounter.test.ts`:
    1. `incrementSheetCount()` sets `body.dataset.sheetOpen = 'true'`.
    2. Two consecutive increments still single attribute (counter logic).
    3. Decrement once after two increments → attribute remains.
    4. Decrement twice → attribute removed (`dataset.sheetOpen === undefined`).
    5. Decrement below zero clamps to 0 (no negative state).
    6. SSR safety: `typeof document === 'undefined'` short-circuit (mocked).
  - `app/components/EmberGlass/__tests__/Sheet.test.tsx` — extension to existing spec:
    1. Mounting `<Sheet open={true} />` sets `body.dataset.sheetOpen`.
    2. Unmounting (or `open={false}`) clears it.
    3. Stacking two `<Sheet open={true}>` mounts keeps attribute set; closing one keeps it; closing both clears.
  - `app/altro/__tests__/page.test.tsx`:
    1. Page renders 4 group headings (`Dispositivi`, `Sistema`, `Impostazioni`, `Account`).
    2. Logout row is present and links to `/auth/logout`.
    3. At least the always-present links (`/log`, `/registry`, `/changelog`, `/auth/logout`) are rendered.
    4. Auth wrapper present (mirrors `app/stanze/page.tsx` test fixture).
- **D-15:** **Playwright spec** — new `tests/playwright/bottom-tab-bar.spec.ts`:
  1. `goto('/')` at viewport 375×812; assert `[data-bottom-tab="true"]` is visible AND its bottom-edge respects safe-area inset (`getBoundingClientRect().bottom` is within 8 + 34 px of viewport bottom — 34px is iPhone home-indicator inset; CDP `Emulation.setDeviceMetricsOverride` simulates).
  2. Click `Stanze` tab; URL → `/stanze`; the `Stanze` button's computed `color` matches `var(--accent)` (resolved RGB).
  3. Click `Automazioni` tab → URL → `/automazioni`.
  4. Click `Altro` tab → URL → `/altro`; assert at least the "Logout" row visible.
  5. From `/`, programmatically open a sheet (e.g., open the Stove device sheet from the dashboard — Phase 178 affordance); assert `[data-bottom-tab="true"]` `getBoundingClientRect().top > viewport height - 10` (slid off-screen). Close sheet; assert bar returns.
  6. Resize viewport to 1280×800; assert bar is centered: `left + width/2 ≈ viewport_width/2 ± 4px`, `width === 480`.
  7. Console errors check via `collectConsoleErrors` (reuse from Phase 51/97); fail on any error.
- **D-16:** [informational] **No regression of legacy Navbar tests.** `app/components/__tests__/Navbar.test.tsx` keeps passing because `Navbar.tsx` is unchanged — only its mount in `app/layout.tsx` is removed. Plan agent ensures `npm run test:components` (per CLAUDE.md rule 8) passes after the layout edit. Same for `NavbarConnectionStatus.test.tsx` (component itself untouched; chip wrapper has its own test in D-14).

### Auth & PWA

- **D-17:** **Auth wrapping** for `/altro/page.tsx` mirrors `app/stanze/page.tsx` (Phase 179 D-04) and `app/automazioni/page.tsx` (Phase 180 D-29). Plan agent reads `app/stanze/page.tsx` before scaffolding to copy the auth-guard pattern verbatim.
- **D-18:** [informational] Mobile-first — bundle is designed for ~375px width. The bar uses `left: 12; right: 12` on mobile (full-width pill) and a centered 480px max on `≥sm`. No responsive variant beyond that single media-query rule.
- **D-19:** [informational] **PWA standalone mode** (iOS home-screen install) — `apple-mobile-web-app-status-bar-style: black-translucent` is already set in `app/layout.tsx:33`. The new chrome-less top works in standalone mode without further changes; the WS chip + safe-area-inset-top pad ensures status-bar overlap doesn't bury content.

### Plan layout (informational hint to gsd-planner)

- **D-20:** [informational] Suggested wave breakdown (planner has final say):
  - **Wave 1 (foundation, sequential):**
    - Plan 01: scaffold `SheetCounter.ts` + augment `Sheet.tsx` (D-10) + add `body[data-sheet-open]` rule to `globals.css` (D-09); Jest specs for SheetCounter + Sheet extension. Land BEFORE the bar so opening any existing sheet already broadcasts the signal.
    - Plan 02: scaffold `BottomTabBar.tsx` (D-05 / D-07 / D-08) + barrel export; Jest spec.
  - **Wave 2 (route + chip, parallel):**
    - Plan 03: scaffold `app/altro/page.tsx` + `AltroPage.tsx` + `AltroRow.tsx` + Jest spec (D-12 / D-17).
    - Plan 04: scaffold `NavbarConnectionStatusChip.tsx` (D-13) + Jest spec.
  - **Wave 3 (layout swap, sequential after waves 1-2):**
    - Plan 05: edit `app/layout.tsx` — remove legacy Navbar/Footer mounts, add BottomTabBar + chip mounts, retune `<main>` padding (D-04 / D-11 / D-13). Snapshot test on layout output; verify legacy `Navbar.test.tsx` still green (unchanged file).
  - **Wave 4 (verification, sequential):**
    - Plan 06: Playwright spec (D-15) + final scoped test pass (`npm run test:components`, `npm run test:pages`, `npm run test:changed`) + barrel re-exports + UI smoke at 375px and 1280px.
- **D-21:** [informational] **No multi-agent / Brahma orchestration.** Standard wave-based gsd-execute-phase flow. Inline-style discipline (D-02), CSS-only hide rule for cross-cutting `body[data-sheet-open]` (D-09), counter-based stacking (D-10), and parallel-route discipline (D-04 / D-12) are the only non-obvious correctness gates.

</decisions>

<canonical_refs>
## Canonical Refs (MANDATORY for downstream agents)

### From ROADMAP.md (phase 181 entry)
- `.planning/ROADMAP.md` — Phase 181 goal + SC-#1..#4 + NAV-01..04 mapping. Plans MUST verify each SC against the implementation.
- `.planning/REQUIREMENTS.md` — NAV-01..04 raw text. NAV-FUT-* (if any) are out of scope.

### Design source
- `.planning/inbox/ember-glass-design/project/components/app.jsx:340-379` — `<TabBar>` reference: 4 tabs (Casa / Stanze / Automazioni / Altro), 28-radius glass pill, `bottom: 16; left: 12; right: 12; zIndex: 150`, `padding: 6; grid-cols 4`, button radius 22, 10px font, accent tint background on active, transition `.22s`. **All inline styles transcribe verbatim** modulo the safe-area inset (D-08) and lucide icon swap (D-05).
- `.planning/inbox/ember-glass-design/project/components/app.jsx:144-152` — orchestrator wires `TabBar` underneath the iPhone-frame; in our app the equivalent mount is `app/layout.tsx` (D-04).

### Locked design system
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` — token system (`var(--accent)`, `var(--r-card)`, `var(--font-display)`, `--text-1`, `--text-2`). D-12: inline-style + `var(--token)`. D-03: developer accent picker writes `--accent` (active glow auto-repaints).
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — D-03: `<Pressable>` polymorphic with `as` prop. D-08..D-12: `<Sheet>` API + z-index 200/201 (anchors D-08 z-150 ceiling). **The Phase 181 augmentation in D-10 extends this primitive (additive, non-breaking).**
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` — `<GlassCard>`, `<CardHead>`, `<InlineToggle>` reused by `<AltroPage>` for the section groups (D-12).
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` — `<Sheet>` consumer pattern; verifies that all 5 device sheets opt into the body-attribute hide signal automatically (D-09 / D-10).
- `.planning/phases/179-rooms-tab-redesign/179-CONTEXT.md` — Italian-route convention (`/stanze`), D-04 leave-existing-route-untouched pattern (anchors D-04 here), `<Pressable as={Link}>` precedent.
- `.planning/phases/180-automations-tab-full-editor/180-CONTEXT.md` — D-06: parallel `/automazioni` route + leave legacy `/automations` untouched (anchors D-04 / D-12 here). D-29: auth-wrap pattern.

### Existing code (consumers / mount sites / patterns)
- `app/layout.tsx` (lines 36-78) — root mount site. Edit per D-04 / D-11 / D-13 to swap legacy Navbar+Footer for `<BottomTabBar />` + `<NavbarConnectionStatusChip />`.
- `app/components/Navbar.tsx` (732 LOC) — legacy chrome. **Stays in repo** per D-04. Only its `import` + JSX line in `app/layout.tsx` are removed. Reference for the `getMobileQuickActions` helper + Italian labels reused in `<AltroPage>`.
- `app/components/Footer.tsx` (or `app/components/ui/Footer.tsx`) — legacy footer. **Stays in repo** per D-04; only its mount is removed.
- `app/components/layout/NavbarConnectionStatus.tsx` — Phase 144 / Phase 17.0 WS chip. **Untouched.** Wrapped in a new `NavbarConnectionStatusChip` per D-13.
- `app/components/EmberGlass/Sheet.tsx` (`useEffect` block at line 47) — augmented per D-10. The new `incrementSheetCount` / `decrementSheetCount` calls slot into the existing effect.
- `app/components/EmberGlass/Pressable.tsx` — Phase 175 polymorphic press primitive. Used by every tab button + every `/altro` row.
- `app/components/EmberGlass/index.ts` — barrel: add `BottomTabBar`, `AltroRow`, `SheetCounter` helpers if desired (or keep counter internal — D-10 decision).
- `app/stanze/page.tsx` — Phase 179 route mount. Reference for `app/altro/page.tsx` shape (auth wrap + `'use client'`).
- `app/automazioni/page.tsx` — Phase 180 route mount. Same reference, second confirmation of the pattern.
- `lib/devices/deviceRegistry.ts` — `getNavigationStructureWithPreferences` exporter. Drives the `Dispositivi` group in `<AltroPage>` (D-12).
- `app/globals.css` — adds the `[data-bottom-tab="true"]` transition + `body[data-sheet-open] [data-bottom-tab]` hide rule (D-09). Single inline addition; no other CSS edits.

### Codebase maps (light scout)
- `.planning/codebase/STRUCTURE.md` — confirms `app/components/EmberGlass/` is the v20.0 home and `app/components/Navbar.tsx` is legacy.
- `.planning/codebase/CONVENTIONS.md` — strict TS + `noUncheckedIndexedAccess` + zero-`any` (Phases 47, 114-116). New code MUST honor.

### Out-of-scope but referenced
- `app/components/Navbar.tsx:679-725` — legacy mobile bottom nav (`<nav className="fixed bottom-0 ...">`) — visually replaced by Phase 181's `BottomTabBar`. Stays in source per D-04.
- `app/components/Navbar.tsx:514-677` — legacy mobile menu panel (the Hamburger overlay). Functionally replaced by `/altro` route. Stays in source per D-04.

</canonical_refs>

<code_context>
## Reusable assets / patterns confirmed

- **`<Pressable>` primitive** (Phase 175) — drop-in for every tab button + every `/altro` row. Polymorphic `as={Link}` keeps client-side navigation while inheriting the press-scale animation. No new tap-state code.
- **`<Sheet>` primitive + Phase 175 D-12 VisuallyHidden Title fallback** — new code does not own sheets, but the `body[data-sheet-open]` augmentation (D-10) is the single integration point for NAV-03.
- **`<GlassCard>` + `<CardHead>`** (Phase 177) — `<AltroPage>` composes 4 instances for its section groups. No new card primitive.
- **Lucide icons** (`Home`, `LayoutGrid`, `Zap`, `MoreHorizontal`, `ChevronRight`, plus existing `Settings`, `LogOut`, `Lightbulb`, `Calendar`, `AlertCircle`, `Clock`, `ClipboardList`, `DoorOpen`, `KeyRound` for `<AltroPage>` rows) — already a dep. Stroke-width matches bundle (`active ? 2.2 : 1.8`).
- **`usePathname()` from `next/navigation`** — already used in `Navbar.tsx`. Drop-in for active-tab detection.
- **`getNavigationStructureWithPreferences`** — `lib/devices/deviceRegistry`. Already powers legacy mobile menu; reuse for `/altro` Dispositivi group.
- **`/api/devices/config` + `/api/user`** — already fetched in `Navbar.tsx:142-167`. `/altro` page reuses the same fetch pattern (or a small custom hook `useEnabledDevices` if planner deems cleanup-worthy; otherwise inline).
- **Inline-style + `var(--token)`** — discipline enforced by all 7 prior v20.0 phases. Bundle's tab bar code is inline-style verbatim — minimal translation cost.
- **React Compiler 1.0** (Phase 71) — auto-memoization handles the active-tab computation. No `useMemo` discipline.
- **Strict TS + `noUncheckedIndexedAccess`** (Phase 47) — tab map and lucide icon imports are exhaustive; no `as any` casts needed.

## Anti-patterns to avoid (per Phase 175 D-04 / Phase 178 D-12 / Phase 179 D-22 / Phase 180 D-32)

- **Tailwind classes for visual values inside `BottomTabBar.tsx` or `altro/` files** — bundle is the source of truth and bundle is inline-style. Layout flex/grid + spacing tokens stay inline. Single CSS exception: `globals.css` for the cross-cutting `body[data-sheet-open]` hide rule (D-09).
- **Hand-rolled SVG tab icons** — use lucide.
- **`useMemo` / `useCallback` decoration** — Phase 71/95 discipline. Plain functions only.
- **`as any` casts** — Phase 114-116 discipline. Discriminated unions / explicit `<typeof tabs[number]['id']>` typing instead.
- **Mounting both legacy `<Navbar />` AND new `<BottomTabBar />`** — explicit anti-pattern. Phase 181 unmounts legacy and adds new in the same atomic `app/layout.tsx` edit (Plan 05 in D-20).
- **Deleting the legacy `Navbar.tsx` / `Footer.tsx` files** — out of scope per D-04.
- **Adding a top header** (logo, app name, anything) — bundle has none; v20.0 ships chromeless top.
- **Skipping the `body[data-sheet-open]` counter** — single-flag implementation breaks under stacked sheets (Phase 178 device sheet → opens Phase 180 automation editor sheet → user closes editor → flag goes off → bar reappears UNDER the still-open device sheet). Counter is mandatory (D-10).
- **Changing Phase 175's Sheet visual API** — D-10 augments the side-effect surface only. The component's props, render output, and z-index stay identical.

</code_context>

<deferred>
## Noted for Later (out of scope for Phase 181)

- **Cleanup phase post-Phase 182 — delete legacy chrome** (`app/components/Navbar.tsx`, `app/components/navigation/`, `app/components/Footer.tsx` or its `ui/Footer.tsx` location, `app/components/__tests__/Navbar.test.tsx`) plus the legacy parallel routes Phase 179 / 180 left behind (`app/automations/`, `app/automations/[rule_id]/`, `app/rooms/` if present). Bundle of ~1500 LOC + tests. Owner: cleanup phase post-182.
- **Per-tab badges / unread dots** (e.g., red dot on Altro when there's a stove error). Likely a v20.x phase.
- **Haptic feedback on tab press** (iOS). Tracked.
- **Keyboard arrow-key navigation between tabs** — Tab/Enter already work via `<Pressable as={Link}>`. Arrow nav is a separate a11y enhancement.
- **Reduced-motion variant** — current 220-300ms transitions are acceptable; if a user complains, gate `transition` behind `@media (prefers-reduced-motion: reduce)` in `globals.css`.
- **Rearranging the 4 tabs** (drag-to-reorder, customization). Out of scope for v20.0; tab order is product-locked.
- **Replacing `getNavigationStructureWithPreferences`** with a v20.0-native config — the helper still drives `<AltroPage>`. Refactor in a later phase if v21+ rebuilds the device registry.
- **PWA install prompt repositioning** — `InstallPrompt` (Phase 53) currently auto-mounts inside ClientProviders; if visual conflict surfaces with the new bar, reposition it then.
- **Active-tab indicator dot/underline** — bundle has none; v20.0 doesn't ship one. If product wants more emphasis later, add a 4-px accent underline animated via `width/transform` on active.

</deferred>

---

**Auto-mode log**:
- `[--auto] Context check — none found, proceeding fresh.`
- `[--auto] Selected all gray areas: namespace+layout, route map + active state, pinning + safe-area, hide-when-sheet-open mechanism, Sheet primitive augmentation, /altro route content, WS chip migration, layout.tsx swap, test coverage, plan layout hint.`
- `[--auto] Q: tab → route map → bundle Casa/Stanze/Automazioni/Altro mapped to /, /stanze, /automazioni, /altro. Lucide icons (Home/LayoutGrid/Zap/MoreHorizontal). Reason: bundle is the source of truth; Phase 179/180 already shipped /stanze and /automazioni.`
- `[--auto] Q: active tab visual → bundle accent-tint background + accent text + accent glow ring (color-mix). Reason: SC-#2 mandates "accent color + glow"; bundle's tint alone is "accent color"; the ring satisfies "glow".`
- `[--auto] Q: pinning → position fixed; bottom: calc(8px + env(safe-area-inset-bottom)); left/right 12 mobile; centered 480 max desktop. Reason: NAV-04 explicit; SC-#1 desktop "app shell" framing.`
- `[--auto] Q: hide-when-sheet-open → CSS body[data-sheet-open] selector + Sheet.tsx counter augmentation. Reason: framework-agnostic, single-rule, single-augmentation, supports stacked sheets.`
- `[--auto] Q: Sheet.tsx augmentation → counter-based body data-attribute (incrementSheetCount/decrementSheetCount). Reason: stacked sheets must keep bar hidden until last close; single boolean would break.`
- `[--auto] Q: /altro page content → 4 glass groups (Dispositivi from getNavigationStructureWithPreferences, Sistema, Impostazioni, Account/Logout). Reason: replaces legacy hamburger menu functionality without inventing new IA.`
- `[--auto] Q: WS chip migration → standalone NavbarConnectionStatusChip wrapper, fixed top-right, z-150. Reason: legacy header is gone; chip must remain visible; new wrapper isolates the positioning concern.`
- `[--auto] Q: legacy Navbar/Footer fate → unmount but DO NOT delete. Reason: Phase 179 D-04 / Phase 180 D-06 symmetry; cleanup phase post-182 deletes legacy chrome bundle.`
- `[--auto] Q: tests → Jest for BottomTabBar + SheetCounter + Sheet extension + AltroPage; Playwright for safe-area + active state + sheet hide + desktop center + console errors. Reason: SC-#1..#4 each need a structural verifier; Playwright covers the iOS-PWA viewport assertion explicitly.`
- `[--auto] Q: badges / haptics / reduced-motion / drag-reorder → all deferred. Reason: scope creep into v20.x.`

**Next:** auto-advance to `/gsd-plan-phase 181 --auto --chain` (chain banner displays).
