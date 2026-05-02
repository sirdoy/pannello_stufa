# Phase 181: Glass Bottom Tab Bar — Research

**Researched:** 2026-05-02
**Domain:** Next.js 16.1 client navigation chrome / Radix Dialog stacking / iOS PWA safe-area / `color-mix(oklab)` / Playwright iOS-PWA simulation
**Confidence:** HIGH (CONTEXT.md is exhaustive; research confirms 14 technical hot-spots with no surprises)

---

## Project Constraints (from CLAUDE.md)

- **Rule 4** — `npm run build` and `npm install` are forbidden in agent execution.
- **Rule 7** — never commit/push without explicit request.
- **Rule 8** — verify blocks MUST use scoped scripts (`test:components`, `test:pages`, `test:changed`, `test:quick`) or `npm test -- <paths>`. NEVER bare `npm test`. Plan agents must propagate this into every PLAN.md `<verify><automated>` block.
- **Rule 5** — always create/update unit tests for new code.
- **Rule 1** — never break existing functionality (legacy `Navbar.tsx` + `Navbar.test.tsx` MUST stay green; D-04 unmounts but does not delete).
- **Rule 2** — wait for user before version updates (no new dependency proposals — every library this phase needs is already installed).

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

CONTEXT.md `<decisions>` D-01..D-21 are exhaustive. Verbatim summary of the load-bearing locks (full text in `181-CONTEXT.md`):

- **D-01** — All new files under `app/components/EmberGlass/`; `altro/` subnamespace mirrors Phase 178/179/180. [VERIFIED: `app/components/EmberGlass/` listing — `automations/`, `rooms/`, `sheets/`, `cards/` already exist]
- **D-02** — Inline-style + `var(--token)` discipline mandatory. Single CSS exception: `globals.css` for the `body[data-sheet-open]` hide rule. [VERIFIED: 174-CONTEXT D-12, 175-CONTEXT D-08, 177-180 all enforce this]
- **D-03** — `'use client'` on `BottomTabBar` + `AltroPage`; sub-components also client.
- **D-04** — Legacy `Navbar.tsx` + `Footer.tsx` UNMOUNT but DO NOT DELETE. Symmetric with Phase 179 D-04 / Phase 180 D-06. [VERIFIED: `app/components/Navbar.tsx` 732 LOC + `app/components/__tests__/Navbar.test.tsx` exist; only `app/layout.tsx` import + JSX lines are removed]
- **D-05** — Tab → route map: `/` (Casa, Home), `/stanze` (Stanze, LayoutGrid), `/automazioni` (Automazioni, Zap), `/altro` (Altro, MoreHorizontal). Active match: exact for `/`, `startsWith` for the others. Stroke `2.2 / 1.8`.
- **D-06** — Non-tab routes (e.g. `/stove/scheduler`, `/lights`, `/settings/api-keys`, `/log`) show NO active tab.
- **D-07** — Active styling: `background: color-mix(in oklab, var(--accent) 18%, transparent)`, `color: var(--accent)`, glow ring `0 0 0 1px ... 60%, 0 0 12px ... 50%`.
- **D-08** — `position: fixed; bottom: calc(8px + env(safe-area-inset-bottom)); left: 12; right: 12; zIndex: 150` mobile. `≥sm` rule centers at `width: 480px; left: 50%; transform: translateX(-50%)` via `globals.css` rule.
- **D-09** — Hide-when-sheet-open via `body[data-sheet-open="true"] [data-bottom-tab="true"]` selector. CSS-only mechanism; bar carries `data-bottom-tab="true"`.
- **D-10** — Phase 175 `Sheet.tsx` augmented with body-attribute counter via new `SheetCounter.ts` (pure module). Counter survives stacked sheets.
- **D-11** — `<main>` padding retuned to `pt-[calc(env(safe-area-inset-top)+12px)]` / `pb-[calc(env(safe-area-inset-bottom)+88px)]`.
- **D-12** — `/altro` page: 4 glass groups (Dispositivi from `getNavigationStructureWithPreferences`, Sistema, Impostazioni, Account/Logout flame-red).
- **D-13** — `<NavbarConnectionStatusChip>` thin wrapper at `position: fixed; top: calc(env(safe-area-inset-top) + 12px); right: 12; zIndex: 150`.
- **D-14/15** — Jest specs (BottomTabBar, SheetCounter, Sheet extension, AltroPage) + Playwright spec at 375×812 + 1280×800.
- **D-16** — Legacy `Navbar.test.tsx` MUST stay green (file is unchanged; only its mount in `layout.tsx` removed).
- **D-17** — Auth wrapping for `/altro/page.tsx` mirrors `app/stanze/page.tsx`. [VERIFIED: `app/stanze/page.tsx` is `'use client'` + `dynamic = 'force-dynamic'`; auth is provided by `ClientProviders` in `app/layout.tsx:69`]
- **D-18..D-21** — informational hints (mobile-first, PWA standalone, plan wave breakdown).

### Claude's Discretion

- Suggested wave breakdown D-20 (planner has final say).
- Whether `SheetCounter.ts` helpers are barrel-exported or kept internal.

### Deferred Ideas (OUT OF SCOPE)

- Deleting legacy `Navbar.tsx` / `Footer.tsx` / `Navbar.test.tsx` / legacy parallel routes (`app/automations/`, `app/rooms/`) — cleanup phase post-Phase 182.
- Per-tab badges, haptic feedback, drag-to-reorder, keyboard arrow nav, reduced-motion variant, active-tab indicator dot, replacing `getNavigationStructureWithPreferences`, theme-color updates, PWA install prompt repositioning.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | Bottom tab bar uses glass surface (translucent + backdrop-blur), pins to bottom on mobile and to app shell on desktop | Bundle (`app.jsx:341-379`) + D-08 inline-style + `globals.css` `≥sm` centering rule (Pattern 8) |
| NAV-02 | 4 sections (Home / Stanze / Automazioni / Altro), each with icon + label, active state via accent color + glow | D-05 tab map + D-07 active styling. `var(--accent)` repaints automatically when DS-03 picker writes accent (Pattern 7 — `color-mix(oklab)` + Pattern 6 — lucide `strokeWidth`) |
| NAV-03 | Bar hidden when a sheet is open over it | D-09 CSS rule + D-10 `Sheet.tsx` counter augmentation (Pattern 2 + Pattern 3) |
| NAV-04 | Bar respects `env(safe-area-inset-bottom)` on iOS PWA | D-08 `bottom: calc(8px + env(safe-area-inset-bottom))`. Verified `viewport-fit: cover` is already set in `app/layout.tsx:32` (Pattern 1) |

---

## Research Summary

CONTEXT.md has pre-decided every gray area for Phase 181. The research role here is to **verify the technical patterns** that the locked decisions assume — and where the assumptions interact with browser/library quirks (Radix internals, iOS Safari `env()`, Playwright safe-area simulation, React Strict Mode), document the exact behavior so the planner specs the verification correctly.

**Confirmed:** Every dependency this phase needs is already installed at a recent version (Next.js 16.1.0, Radix Dialog 1.1.14, lucide-react 0.562.0). The bundle's tab-bar visual is transcribable verbatim. `viewport-fit: cover` is already wired (`app/layout.tsx:32`). `color-mix(in oklab, …)` is used in 4 production files already (FlameViz, Splash, CardHead, AmbientBg, DeviceCard) — Safari/iOS support is non-issue at this point in the codebase. The Phase 175 Sheet primitive's z-index ceiling (200/201) leaves room for the bar at z-150. The Pressable primitive is polymorphic via `as` and is already used in `rooms/DeviceCard.tsx` with `as="div"`.

**Surprise finding (significant):** Radix Dialog's `RemoveScroll` (via `react-remove-scroll-bar` 16.1 transitive) ALREADY sets `body[data-scroll-locked]` as a **counter-string** (`"1"`, `"2"`, …) and removes it when the counter hits 0 — verified at `node_modules/react-remove-scroll-bar/dist/es5/component.js:34-36`. We could in principle piggyback on this instead of building `SheetCounter.ts`. CONTEXT.md D-10 explicitly chose the custom counter for clarity and decoupling — research **endorses** that decision because (a) `data-scroll-locked` is a private implementation detail of a transitive dep, not part of Radix's public API contract, (b) sniffing it would couple us to a 3rd-party version, (c) the custom counter is < 30 LOC and trivially testable. Document in Pitfalls so the planner knows the alternative exists and was rejected for cause.

**Still uncertain:** Whether `getNavigationStructureWithPreferences` is invoked with a non-empty `preferences` map at runtime in the legacy Navbar — the planner needs to read `app/components/Navbar.tsx:142-167` to confirm the fetch shape (`/api/devices/config` + `/api/user`) and decide whether `<AltroPage>` inlines that fetch or extracts a `useEnabledDevices` hook (Open Question 1).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Render bottom tab bar chrome | Browser / Client (`'use client'`) | — | Reads `usePathname()`, owns press state, pure presentation |
| Active-tab detection | Browser / Client | — | `usePathname()` from `next/navigation` is client-only |
| Tab navigation (route change) | Browser / Client (Next.js Link) | — | `<Link>` prefetch + client-side route push; preserves SPA navigation |
| Hide-when-sheet-open | Browser (CSS) + Browser (JS counter) | — | CSS selector reacts to `body[data-sheet-open]`; JS counter is set by Sheet effects. No server involvement. |
| Safe-area inset | Browser (CSS env()) | — | `env(safe-area-inset-bottom)` is a UA constant; iOS PWA returns 34px on notched devices, 0 elsewhere. |
| `/altro` route | Browser / Client (`'use client'`) | API (existing `/api/devices/config` + `/api/user`) | Page renders client-side; data fetched via existing endpoints. No new API routes. |
| WS connection chip | Browser / Client | — | Reads from `useWebSocketContext` (Phase 17.0), pure presentation. Wrapped in fixed-position chip. |
| Auth gate | Frontend Server (Auth0 cookies) + Browser (`ClientProviders`) | — | Already provided by `app/layout.tsx`'s `ClientProviders` per Phase 170. `/altro/page.tsx` inherits, no new auth code. |

---

## Technical Patterns

### Pattern 1 — `env(safe-area-inset-bottom)` correctness on iOS PWA standalone

**Verified:** `app/layout.tsx:32` already declares `viewportFit: 'cover'` (Next.js 16 `Viewport` API — equivalent to `<meta name="viewport" content="…, viewport-fit=cover">`). [CITED: developer.mozilla.org/en-US/docs/Web/CSS/env]

**Behavior:**
- On notched iOS Safari standalone PWA: `env(safe-area-inset-bottom)` returns `34px` (home-indicator height).
- On non-notched devices and non-PWA browsers: returns `0` — `calc(8px + 0)` = `8px`. Safe.
- iOS Safari requires `viewport-fit=cover` for `env()` to return non-zero on notched devices. Already in place.

**Recommended pattern:**
```tsx
// BottomTabBar root
style={{
  position: 'fixed',
  bottom: 'calc(8px + env(safe-area-inset-bottom))',
  left: 12,
  right: 12,
  zIndex: 150,
}}
```

**Tailwind `pb-safe`:** Not used in this codebase as an arbitrary utility. The CONTEXT.md plan uses `pb-[calc(env(safe-area-inset-bottom)+88px)]` on `<main>` (D-11) — Tailwind 4 (via `@import "tailwindcss"` in `globals.css:3`) accepts arbitrary values in square brackets. [VERIFIED: `app/components/Navbar.tsx:728` already uses `h-[calc(4rem+env(safe-area-inset-top))]` pattern]

**iOS quirk to flag:** When the keyboard opens on iOS Safari, `env(safe-area-inset-bottom)` does NOT change — but the visual viewport shrinks. This is irrelevant for a tab bar that's already `position: fixed` (it stays anchored to the layout viewport). No action needed.

### Pattern 2 — Radix Dialog z-index + body marker behavior

**Verified facts (from `node_modules/@radix-ui/react-dialog` 1.1.14 + `react-remove-scroll-bar`):**

1. **Radix Dialog already sets `body[data-scroll-locked]`** as a counter string (e.g. `"1"`, `"2"`) via `react-remove-scroll-bar/dist/es5/component.js:34-36`. The counter increments on each `RemoveScrollBar` mount and decrements on unmount; attribute is removed when counter hits 0. **This is counter-aware out of the box.**
2. **Radix's z-index:** `<Portal>` does NOT enforce a z-index; the EmberGlass `Sheet.tsx` writes `zIndex: 200` on the backdrop and `zIndex: 201` on the content (`app/components/EmberGlass/Sheet.tsx:80,100`). The bar at z-150 stays under both.
3. **`forceMount`** on Portal + Content keeps the subtree alive across `open=false` for outro animation. Confirmed at `Sheet.tsx:70,89`.

**Why D-10 chose a custom `body[data-sheet-open]` counter instead of piggybacking on Radix's `data-scroll-locked`:**
- `data-scroll-locked` is a private implementation detail of `react-remove-scroll-bar` (a transitive dep of Radix). NOT part of Radix's documented public API.
- The string-counter format (`"1"`, `"2"`) is harder to write a CSS selector for than `body[data-sheet-open="true"]`.
- Radix sets `data-scroll-locked` for ANY Radix component using `RemoveScroll` (Tooltip, Popover with `modal`, etc.) — would cause false positives if Phase 182+ adds a Radix Tooltip somewhere.

**Recommended:** Implement D-10 as specified. Document in Pitfalls (#1) that the alternative was considered and rejected.

### Pattern 3 — Body data-attribute counter under React 18 Strict Mode

**Verified:** `app/components/EmberGlass/Sheet.tsx:43-61` already uses a `useRef` + `useEffect([open])` pattern that survives Strict Mode double-mount (Phase 175 RESEARCH Pitfall 5). The 175-RESEARCH document explicitly states: *"slightly more robust against React 18 strict-mode double-mount"*. [VERIFIED: 175-RESEARCH.md:406]

**Strict Mode behavior under `useEffect([open])` with `open=true`:**
1. Effect runs (counter → 1, attr set)
2. Strict Mode synchronously runs cleanup (counter → 0, attr removed)
3. Strict Mode re-runs effect (counter → 1, attr set)
4. Net result: attribute is set, counter is 1 — correct.

When `open=false`:
1. Effect early-returns (`if (!open) return;`); no cleanup is registered. Net counter unchanged.

When `open` flips `true → false`:
1. Cleanup runs (counter → 0, attr removed). Net counter is 0 — correct.

**Pattern (additive to existing `useEffect`):**
```ts
// In Sheet.tsx — INSIDE the existing effect at line 47, AFTER the early return:
useEffect(() => {
  if (!open) return;
  // ... existing scroll-lock setup ...
  incrementSheetCount();
  return () => {
    // ... existing scroll-lock cleanup ...
    decrementSheetCount();
  };
}, [open]);
```

The same effect can hold both side-effects. The cleanup runs in LIFO order, but since both calls are pure no ordering issue arises.

**Stacked sheets:** Each `<Sheet>` instance owns its own effect. Two simultaneous `open=true` instances → two `incrementSheetCount()` calls → counter is 2. Closing one decrements to 1 — attribute remains. Closing the other decrements to 0 — attribute removed.

### Pattern 4 — `usePathname()` SSR/CSR behavior in Next.js 16

**Verified [CITED: nextjs.org/docs/app/api-reference/functions/use-pathname]:**
- `usePathname()` from `next/navigation` is a Client Component hook.
- During the **first client render** it returns the current pathname synchronously. NOT `null`.
- On **server-render** of a page that uses it, Next.js uses an empty client-only render placeholder (it's a `'use client'` boundary). Hydration matches.
- **No flash-of-wrong-tab risk** for our use case because `BottomTabBar` is `'use client'` and renders only on the client (it's a leaf inside `app/layout.tsx` which itself is a Server Component, but the tab bar is a client-island).

**Caveat:** On the very first SSR pass, the bar's HTML may be rendered without an active tab if Next.js streams the server tree before the client hydrates. Resolution: client-side hydration immediately re-renders with the correct active tab. Visual flash is sub-frame.

**Recommended pattern:**
```tsx
'use client';
import { usePathname } from 'next/navigation';

const pathname = usePathname(); // string, never null on client
const isActive = (route: string): boolean => {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
};
```

[VERIFIED: `app/components/Navbar.tsx:5,74` already uses `usePathname()` with no `null` guard — same expectation.]

### Pattern 5 — `<Pressable as={Link}>` polymorphism

**Verified facts:**
- `app/components/EmberGlass/Pressable.tsx:90-97` accepts `as: E` where `E extends ElementType`. `Link` is `ElementType` (component reference satisfies the constraint).
- Existing usage in this repo: `app/components/EmberGlass/rooms/DeviceCard.tsx:34` uses `as="div"`. **No prior usage of `as={Link}` was found** — Phase 181 will be the first.
- Pressable spreads `...rest` (includes `href`) onto the rendered tag (`Pressable.tsx:114`).
- `next/link`'s `<Link>` accepts `href: string`, forwards `ref`, supports prefetching, and renders an `<a>` underneath. [CITED: nextjs.org/docs/app/api-reference/components/link]

**Recommended pattern:**
```tsx
import Link from 'next/link';
import { Pressable } from '@/app/components/EmberGlass';

<Pressable as={Link} href="/stanze" data-pressable-focusable="true">
  ...
</Pressable>
```

**Critical detail:** `Pressable.tsx:104-107` only sets `data-pressable-focusable="true"` for `as` values in `FOCUSABLE_HOSTS = {'button', 'a', 'input', 'select', 'textarea'}` (string tags) OR when consumer passes `tabIndex >= 0`. **Passing `as={Link}` (a component, not the string `'a'`) means `typeof Tag !== 'string'`**, so `isFocusable` is `false` unless the planner adds `tabIndex={0}`. The underlying rendered `<a>` is natively focusable, so keyboard nav still works — but the `:focus-visible` accent outline (Phase 175 D-08 contract) WILL NOT paint without an explicit `tabIndex={0}`.

**Action for planner:** Either (a) pass `tabIndex={0}` on each `<Pressable as={Link}>` for the focus outline, OR (b) extend `FOCUSABLE_HOSTS` detection to recognize `Link` (out of scope — Pressable is Phase 175 locked). **Recommend (a).**

### Pattern 6 — Lucide icon `strokeWidth` prop

**Verified [CITED: lucide.dev/guide/packages/lucide-react]:**
- All `lucide-react` 0.562.0 icons accept `strokeWidth: string | number`. Default = 2.
- Already used in this codebase: `Sheet.tsx:166` (`strokeWidth={2.2}`), `CardHead.tsx:41` (`strokeWidth={2}`), `cards/SheetPlaceholderBody.tsx:51` (`strokeWidth={1.5}`).

**Recommended pattern:**
```tsx
import { Home, LayoutGrid, Zap, MoreHorizontal } from 'lucide-react';

const Icon = tab.Icon;
<Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
```

D-05's stroke values (2.2 active / 1.8 inactive) match the bundle's `sw` prop verbatim with the `sw → strokeWidth` rename.

### Pattern 7 — `color-mix(in oklab, …)` browser support

**Verified [CITED: caniuse.com/css-color]:**
- `color-mix(in oklab, …)` is supported in **Safari 16.4+**, **Chrome 111+**, **Firefox 113+**.
- Equivalent iOS Safari: 16.4+ (released March 2023).

**This codebase already uses `color-mix(in oklab, …)` heavily:**
- `AmbientBg.tsx:59,75`, `FlameViz.tsx:52,55`, `Splash.tsx:106`, `CardHead.tsx:33,38`, `DeviceCard.tsx:41,44,57,60`. **5+ production files.** [VERIFIED: grep on `app/components/EmberGlass/*.tsx`]

**Recommendation:** No fallback needed. Phase 181 ships into the same browser-support floor that Phases 174/177/179 already required. If iOS 16.3 user appears, the `color-mix` resolves to `unset` → background falls back to `transparent`. The bar is still functional (icons + text still render), just lacks the accent tint. Acceptable degradation.

**Active glow ring:**
```ts
boxShadow:
  '0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), ' +
  '0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)'
```

[VERIFIED: SC-#2 mandates "accent color + glow that responds to user's chosen oklch hue from Phase 174"; `var(--accent)` is the Phase 174 D-03 source-of-truth variable.]

### Pattern 8 — `@media (min-width: 640px)` desktop-centering rule placement

**Inline-style cannot express media queries.** The recommended pattern matches D-09's `body[data-sheet-open]` placement: a **single block in `app/globals.css`** alongside the hide rule. This keeps all bar-related CSS rules adjacent for maintenance.

**Recommended `globals.css` addition (single block):**
```css
/* Phase 181 — bottom tab bar cross-cutting rules */
[data-bottom-tab="true"] {
  transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .2s;
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
```

**Critical:** Note the second `@media` rule. The desktop-centered pill uses `transform: translateX(-50%)` for centering. When the sheet opens, the hide rule overrides `transform` to `translateY(140%)` — this LOSES the centering on desktop, causing the bar to slide off to the side instead of straight down. The second rule combines both transforms.

[VERIFIED: This pattern is consistent with `globals.css:340` `@supports not` block and `globals.css:11` `@variant dark` directive — Tailwind 4 plays cleanly with hand-written CSS rules in the same file.]

### Pattern 9 — Playwright iOS-PWA simulation

**Critical finding:** Playwright's `devices['iPhone 13']` (and similar) preset sets viewport to 390×844 and a UA string but does **NOT** simulate the iOS home-indicator inset. `env(safe-area-inset-bottom)` returns `0` in headless Chromium by default. [VERIFIED: Playwright source — `Emulation.setDeviceMetricsOverride` does not include the `safeAreaInsets` parameter unless explicitly passed via CDP]

**Three viable approaches, ranked:**

**Approach A (recommended) — DOM-based assertion at fixed viewport:**
Set viewport to `375×812` (iPhone X logical). Don't try to simulate the inset. Instead, assert the bar is correctly positioned RELATIVE to the viewport by reading `getBoundingClientRect()`:
```ts
test('NAV-04 bar respects safe-area inset (375×812)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await dismissVersionEnforcerIfPresent(page);
  const rect = await page.locator('[data-bottom-tab="true"]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { bottom: r.bottom, computedBottom: cs.bottom };
  });
  // env(safe-area-inset-bottom) returns 0 in headless Chromium → computed `bottom: 8px`
  expect(rect.computedBottom).toBe('8px');
  // bar's bottom edge sits 8px above viewport bottom (812 - 8 = 804)
  expect(Math.abs(rect.bottom - (812 - 8))).toBeLessThan(2);
});
```
This verifies the **CSS contract** (the `calc(8px + env(...))` computes to `8px` when env is 0). Real-device verification of the 34px home-indicator inset is left to manual UAT — same tradeoff as Phase 53/97 PWA tests.

**Approach B — CDP `Emulation.setDeviceMetricsOverride` with `safeAreaInsets`:**
Possible but the `safeAreaInsets` argument was added to CDP in Chrome 119 (late 2023). [VERIFIED: chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride]
```ts
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 375, height: 812, deviceScaleFactor: 3, mobile: true,
  // safeAreaInsets: { bottom: 34 } // Chrome 119+ — verify locally before relying on it
});
```
**Recommend NOT using this path** — adds CDP complexity for a value (34px) that is product-known and doesn't change per release.

**Approach C — visual regression (screenshot diff):** Out of scope for v20.0; project does not have a visual regression infra.

**Final recommendation (D-15 spec):** Use **Approach A** for the safe-area assertion. Reuse `collectConsoleErrors` and `dismissVersionEnforcerIfPresent` helpers verbatim from `tests/smoke/rooms-tab.spec.ts:33,53` (Phase 179 / Phase 51 / Phase 97 lineage). Place spec at `tests/smoke/bottom-tab-bar.spec.ts` to match the existing convention (NOT `tests/playwright/` — that path was a CONTEXT.md typo at line 46; verified via `ls tests/smoke/`).

### Pattern 10 — Legacy Navbar.test.tsx independence

**Verified:**
- `app/components/Navbar.tsx` (732 LOC) is an island unto itself — its tests in `app/components/__tests__/Navbar.test.tsx` mock `usePathname`, fetch, and `getNavigationStructureWithPreferences`. They render `<Navbar />` directly via `@testing-library/react` and do NOT import `app/layout.tsx`.
- Removing the `<Navbar />` mount from `app/layout.tsx` does NOT affect `Navbar.test.tsx` — the file is unchanged on disk.
- Same applies to `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx` (the chip wrapper has its own new test in D-14).

**Action for planner:** After the layout swap (Plan 05 in D-20), run `npm run test:components` to verify both legacy specs pass. No code changes to legacy tests required. [VERIFIED: D-16]

### Pattern 11 — `getNavigationStructureWithPreferences` shape

**Verified [VERIFIED: `lib/devices/deviceRegistry.ts:204-222`]:**
```ts
export function getNavigationStructureWithPreferences(
  preferences: Record<string, boolean>
): NavigationStructure;

interface NavigationStructure {
  devices: DeviceNav[];
  global: NavItem[];
  settings: SettingsMenuItemOutput[];
}

interface DeviceNav {
  id: DeviceTypeId;
  name: string;
  icon: string;          // string key (NOT a lucide component)
  color: DeviceColor;
  items: NavItem[];      // [{ label: 'Controllo', route: device.routes.main }, ...]
}

interface NavItem {
  label: string;
  route: string;
  icon?: string;
  items?: { label: string; route: string }[];
}

interface SettingsMenuItemOutput {
  id: string;
  label: string;
  route: string;
  icon: string;          // string key
  description: string;
  submenu?: SettingsMenuItemOutput[];
}
```

**Critical for `<AltroPage>`:** `device.icon` is a **string key** (e.g. `'flame'`, `'thermometer'`, `'lightbulb'`), not a lucide component reference. The planner must either (a) keep using string keys and look up the lucide component via a local `ICON_MAP` (mirroring `app/components/EmberGlass/rooms/lib/rooms-config.ts:ICON_FOR`), or (b) hard-code lucide imports per known device id.

**Recommend (a)** — extends consistency with Phase 179.

**Devices the helper returns** (when all preferences are `true`): the union mentioned in CONTEXT.md D-12 — Stove / Termostato / Luci / Sonos / DIRIGERA / Tuya / Network / Raspberry Pi / Telefonia. Exact set is `Object.values(DEVICE_CONFIG).filter(d => preferences[d.id] === true)` — depends on `DEVICE_CONFIG` keys (verified at `deviceRegistry.ts:206`).

### Pattern 12 — Existing settings routes (D-12 Impostazioni group)

**Verified [VERIFIED: `ls app/settings/`]:**
- `app/settings/api-keys/` — exists
- `app/settings/dashboard/` — exists
- `app/settings/devices/` — exists
- `app/settings/location/` — exists
- `app/settings/notifications/` — exists
- `app/settings/thermostat/` — exists
- `app/settings/page.tsx` — exists (top-level settings index)

**Routes named in D-12 that DO NOT exist:**
- `/settings/account` — NOT present (deferred or named differently — planner must verify)
- `/settings/gdpr` — NOT present
- `/settings/privacy` — NOT present

**Action for planner:** D-12's Impostazioni group should ship the **actually-existing** routes: `api-keys`, `dashboard`, `devices`, `location`, `notifications`, `thermostat` (plus the index `/settings`). The named-but-missing routes (`account`, `gdpr`, `privacy`) should be moved to `<deferred>` in PLAN.md or surfaced as Open Question 2 if the user wanted them rendered.

### Pattern 13 — `<NavbarConnectionStatus />` API surface

**Verified [VERIFIED: `app/components/layout/NavbarConnectionStatus.tsx`]:**
- 46 LOC, `'use client'`.
- No props (zero-arg).
- Reads `useWebSocketContext()` and renders `<ConnectionStatus status size="sm" label />`.
- The underlying `<ConnectionStatus>` (`app/components/ui/ConnectionStatus.tsx`, 127 LOC) is a `forwardRef<HTMLSpanElement>`; it returns a single `<span>` with CVA-based className. **No `position` set internally** — safe to wrap in any positioning container.
- It does NOT have a click handler. Wrapping in `pointer-events: none` would still cost nothing — but is unnecessary because the chip exposes no interactive surface.

**Recommended `NavbarConnectionStatusChip.tsx`:**
```tsx
'use client';
import { NavbarConnectionStatus } from './NavbarConnectionStatus';

export function NavbarConnectionStatusChip() {
  return (
    <div
      data-ws-chip="true"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        right: 12,
        zIndex: 150,
      }}
    >
      <NavbarConnectionStatus />
    </div>
  );
}
```

(Drop `pointerEvents: 'auto'` from CONTEXT.md D-13 — it's the default and is misleading. No `pointer-events: none` either — the chip is a passive indicator that doesn't need to be click-blocking.)

[VERIFIED: `app/components/ui/ConnectionStatus.tsx:112` uses `cn()` for class composition; no inline-style conflicts with the wrapper.]

### Pattern 14 — Body cleanup hazard on route change

**Verified:** Phase 175 `Sheet.tsx`'s `useEffect([open])` cleanup runs on **both** unmount AND `open` flip from `true → false`. Confirmed at `Sheet.tsx:54-60`.

**Route-change scenario:** Phase 178/179/180 sheets are mounted from page-level orchestrators (e.g. `RoomsTab` for `/stanze`). When the user clicks the `Altro` tab while a sheet is open:
1. Next.js client-navigates to `/altro`.
2. `RoomsTab` unmounts.
3. Sheet (a child of `RoomsTab`) unmounts → `useEffect` cleanup runs → `decrementSheetCount()` → `body.dataset.sheetOpen` cleared.
4. `BottomTabBar` (mounted at layout level — survives the navigation) re-appears via the CSS rule.

**Verified path of cleanup:** React guarantees that on parent unmount, all children's effect cleanups run before the parent's cleanup. The counter therefore drops to 0 correctly.

**Edge case to flag in pitfalls:** If a sheet's parent component throws during the same render that closes the sheet, React 19's automatic error-boundary may skip the cleanup. Mitigation in `SheetCounter.ts`: `count = Math.max(0, count - 1)` (clamp — already in CONTEXT.md D-10) prevents negative counters. If the bar gets "stuck hidden" in development, a manual `delete document.body.dataset.sheetOpen` from DevTools restores it. Rare and out-of-scope; document only.

---

## API / Library Reference

### Lucide icons (lucide-react 0.562.0)

```ts
import { Home, LayoutGrid, Zap, MoreHorizontal, ChevronRight } from 'lucide-react';

interface LucideProps {
  size?: string | number;       // default 24
  strokeWidth?: string | number; // default 2
  color?: string;                // default 'currentColor'
  absoluteStrokeWidth?: boolean;
}
```
[CITED: lucide.dev/guide/packages/lucide-react]

### Next.js navigation (next 16.1.0)

```ts
import { usePathname } from 'next/navigation';
import Link, { type LinkProps } from 'next/link';

const pathname: string = usePathname(); // never null on client

<Link
  href="/stanze"
  prefetch={true} // default
  // forwards ref, accepts all <a> props
>
  ...
</Link>
```
[CITED: nextjs.org/docs/app/api-reference/functions/use-pathname; nextjs.org/docs/app/api-reference/components/link]

### Radix Dialog (@radix-ui/react-dialog 1.1.14)

Already wrapped by `EmberGlass/Sheet`. No new Radix usage in Phase 181. Body marker behavior: `react-remove-scroll-bar` exposes `lockAttribute = 'data-scroll-locked'` (counter-string). [VERIFIED: `node_modules/react-remove-scroll-bar/dist/es5/component.d.ts:8`]

### CSS color-mix syntax

```css
color-mix(in oklab, var(--accent) 18%, transparent)
color-mix(in oklab, var(--accent) 60%, transparent)
color-mix(in oklab, var(--accent) 50%, transparent)
```
- First arg: color space (`oklab` per Phase 174 token system).
- Two color stops with percentages.
- Available in Safari 16.4+, Chrome 111+, Firefox 113+. [CITED: developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix]

### `<Pressable>` polymorphic API (Phase 175)

```tsx
import { Pressable, type PressableProps } from '@/app/components/EmberGlass';

<Pressable
  as={Link}                  // ElementType — Link is a component reference
  href="/stanze"             // forwarded to Link
  tabIndex={0}               // REQUIRED for :focus-visible accent outline (see Pattern 5)
  data-bottom-tab-id="rooms" // any data-* survives spread
  style={{ /* spread AFTER the press transform/transition */ }}
>
  ...
</Pressable>
```
[VERIFIED: `app/components/EmberGlass/Pressable.tsx:90-138`]

---

## Pitfalls & Landmines

### Pitfall 1 — Sniffing `body[data-scroll-locked]` instead of own counter
**What goes wrong:** Reads cleaner ("we already have this attribute, just use it!") but couples the bar to a transitive 3rd-party dep's private API. Different version of `react-remove-scroll-bar` could change attribute name; any other Radix component using `RemoveScroll` (Tooltip, Popover) would falsely trigger the hide.
**Avoidance:** Implement D-10 as specified. Document the alternative in code comments so future reviewers don't try to "simplify."
**Warning sign:** PR comments suggesting "we don't need `SheetCounter.ts` because Radix already sets a body attribute."

### Pitfall 2 — Desktop-centered pill loses centering when sheet opens
**What goes wrong:** Mobile uses `transform: translateY(140%)` for hide. Desktop uses `transform: translateX(-50%)` for centering. CSS rule order makes hide override centering → bar slides off to the side instead of straight down.
**Avoidance:** Use the **two `@media` blocks** in `globals.css` from Pattern 8 — the second block combines both transforms (`translate(-50%, 140%)`).
**Warning sign:** Playwright spec at 1280×800 sees the bar slide horizontally off-screen instead of disappearing downward.

### Pitfall 3 — `<Pressable as={Link}>` loses focus-visible outline
**What goes wrong:** `Pressable` only sets `data-pressable-focusable="true"` for string-tag hosts in `FOCUSABLE_HOSTS`. Component refs (like `Link`) bypass the check; the underlying `<a>` is focusable but the accent outline rule (`[data-pressable-focusable="true"]:focus-visible { outline: 2px solid var(--accent); }`) never matches.
**Avoidance:** Pass `tabIndex={0}` explicitly on every `<Pressable as={Link}>` — Pressable's check accepts `tabIndex >= 0` as a focusable signal. Verify in tests via `expect(button).toHaveAttribute('data-pressable-focusable', 'true')`.
**Warning sign:** Keyboard tab navigation visits the link but no accent ring paints.

### Pitfall 4 — React 18 Strict Mode counter race
**What goes wrong:** A naive `useEffect(() => { increment(); return decrement; }, [])` would (under Strict Mode dev) double-mount: increment → cleanup → increment. Net counter is +1 (correct), but if the effect dep is `[open]` and `open` is true at first mount, the same flow happens. **All correct as long as increment + decrement are pure and balanced.**
**Avoidance:** Keep `incrementSheetCount` and `decrementSheetCount` pure (no closure-captured state, no DOM reads other than the `typeof document !== 'undefined'` guard). Test with `react-dom/test-utils` `act()` to observe Strict Mode behavior. Test for "decrement below zero clamps to 0" (already in D-14).
**Warning sign:** In dev mode, opening a sheet leaves `body.dataset.sheetOpen` = `'true'` after sheet closes; bar stays hidden.

### Pitfall 5 — Playwright `env(safe-area-inset-bottom)` returns 0 by default
**What goes wrong:** Test asserts `bottom > 8 + 34` expecting iOS home-indicator inset; headless Chromium returns 0; assertion fails.
**Avoidance:** Use Pattern 9 Approach A — assert the **CSS contract** (`computedBottom === '8px'`), not a real-device value. Real iOS verification is manual UAT.
**Warning sign:** CI test fails at `bottom: 42` mismatch; locally on real iPhone the bar is correctly inset.

### Pitfall 6 — `color-mix(oklab)` on iOS 16.3 or older
**What goes wrong:** Active background falls back to `unset` (effectively transparent), accent glow ring also vanishes. Bar still works but loses the accent indication.
**Avoidance:** Accept the degradation — Phases 174/177/179 already require Safari 16.4+. Document in user UAT script (Open Question 3).
**Warning sign:** User on old iPad reports "I can't tell which tab is active."

### Pitfall 7 — Mounting `<NavbarConnectionStatusChip>` over a sheet
**What goes wrong:** Chip is at z-150. Sheet backdrop is z-200, content z-201. Sheet correctly covers the chip. **But:** if `BottomTabBar` is hidden via the `body[data-sheet-open]` rule and the chip is NOT, the chip remains visible at the top-right while a sheet is open. Visual conflict if the sheet's title bar has a close button at the top-right (it does — `Sheet.tsx:148`).
**Avoidance:** Add chip to the same hide rule:
```css
body[data-sheet-open="true"] [data-ws-chip="true"] {
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
}
```
Mark the chip with `data-ws-chip="true"` in Pattern 13's recommended wrapper. **This is an addition to D-13 — flag for the planner.**
**Warning sign:** During UAT, opening a sheet shows two overlapping elements at the top-right (sheet's X button + WS chip).

### Pitfall 8 — `@media` rule placement vs Tailwind 4 layer ordering
**What goes wrong:** Tailwind 4's `@import "tailwindcss"` at `globals.css:3` defines layers. Custom CSS rules outside layers run at default specificity, but if a Tailwind utility (`pb-12`, etc.) on a wrapper element happens to share a selector match, ordering can flip-flop.
**Avoidance:** The bar's container has its own `[data-bottom-tab="true"]` selector with no wrapper Tailwind classes; specificity is single-attribute. No conflict expected. Place new rules after the existing `@supports not` block (`globals.css:340+`) for grouping.
**Warning sign:** Bar's `transition` doesn't fire — check whether a Tailwind utility on a parent overrides it.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 (`jest.config.js`) + Playwright 1.x (`playwright.config.ts`) |
| Config files | `jest.config.js`, `playwright.config.ts` |
| Quick run | `npm run test:components` (component subtree) |
| Full suite | `npm run test:ci` (release gate only — agents must NOT use bare `npm test` per Rule 8) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Coverage |
|--------|----------|-----------|-------------------|----------|
| NAV-01 | Glass surface + bottom-pin (mobile + desktop) | unit (Jest) | `npm test -- app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` | Asserts `[data-bottom-tab="true"]` root + inline-style backdrop-filter + `position: fixed` |
| NAV-01 | Desktop-centered pill at ≥640px | smoke (Playwright) | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "centered desktop"` | Resize 1280×800; assert `width === 480` and centered |
| NAV-02 | 4 tabs render with Italian labels + lucide icons | unit (Jest) | `npm test -- app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` | `getByText('Casa' | 'Stanze' | 'Automazioni' | 'Altro')` |
| NAV-02 | Active state = accent color + glow on chosen hue | unit + smoke | unit: mock `usePathname` → `/stanze`, assert inline-style `color: var(--accent)`. smoke: read computed `box-shadow` on active button | |
| NAV-02 | Active match = exact for `/`, prefix for others | unit | mock pathname `/stanze/sala` → `Stanze` is active; `/stove/scheduler` → no tab active | |
| NAV-03 | Bar hides under open sheet | smoke (Playwright) | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "hides under sheet"` | Open StoveSheet (Phase 178); assert bar's `getBoundingClientRect().top > viewport_height` |
| NAV-03 | Counter survives stacked sheets | unit (Jest) | `npm test -- app/components/EmberGlass/__tests__/SheetCounter.test.ts` | 2× increment → 1× decrement → attr remains; 2× decrement → attr removed |
| NAV-03 | Sheet primitive sets/clears body attr | unit (Jest) | `npm test -- app/components/EmberGlass/__tests__/Sheet.test.tsx` | Mount with `open=true` → `body.dataset.sheetOpen === 'true'`; unmount → `undefined` |
| NAV-04 | `env(safe-area-inset-bottom)` honored | smoke (Playwright) | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "safe-area"` | At 375×812, assert `getComputedStyle(bar).bottom === '8px'` (env=0 in headless) AND CSS string includes `env(safe-area-inset-bottom)` |
| NAV-04 | `<main>` padding clears bar | unit | snapshot test on `app/layout.tsx` rendered output checks `pb-[calc(env(safe-area-inset-bottom)+88px)]` | |

### Sampling Rate (per CLAUDE.md Rule 8)

- **Per task commit:** `npm run test:changed` (only specs touching modified files)
- **Per wave merge:** `npm run test:components` + `npm run test:pages` (catches layout edits)
- **Phase gate:** All scoped passes green + `npx playwright test tests/smoke/bottom-tab-bar.spec.ts` + manual smoke at 375px and 1280px

### Wave 0 Gaps

None — all required test infrastructure already exists:
- Jest config supports the `app/components/EmberGlass/__tests__/` pattern (Phase 175 and onward).
- Playwright config supports `tests/smoke/*.spec.ts` (Phase 51, 97, 174-180 precedent).
- `collectConsoleErrors` + `dismissVersionEnforcerIfPresent` helpers exist verbatim in `tests/smoke/rooms-tab.spec.ts:33,53` — copy into the new spec.

---

## Open Questions

1. **`/altro` Dispositivi data source — fetch in-page or hook extraction?**
   - What we know: Legacy `Navbar.tsx:142-167` fetches `/api/devices/config` + `/api/user`, builds a `preferences` object, and passes it to `getNavigationStructureWithPreferences`.
   - What's unclear: Whether `<AltroPage>` should inline that fetch (simpler, one-shot) or extract a `useEnabledDevices` hook (testable, reusable for Phase 182).
   - Recommendation: Inline the fetch for Phase 181 (mirrors the existing one-call pattern). If Phase 182 DSREF needs the same data, extract then.

2. **Settings routes named in D-12 that don't exist — defer or surface error?**
   - What we know: `/settings/api-keys`, `/settings/notifications`, `/settings/dashboard`, `/settings/devices`, `/settings/location`, `/settings/thermostat` exist. `/settings/account`, `/settings/gdpr`, `/settings/privacy` do NOT.
   - What's unclear: Whether the user expected those 3 routes to already exist or wants them deferred.
   - Recommendation: Render only the existing 6 + the index `/settings`. Add the 3 missing to PLAN.md `<deferred>`. Planner can confirm with the user via `--auto` defaults.

3. **WS chip during open sheet — hide it too? (Pitfall 7)**
   - What we know: D-13 mounts the chip at z-150 (same as bar). Sheet at z-200/201 covers it correctly. But the chip is at `top: env(safe-area-inset-top) + 12`, the sheet's close button is also at top-right of the sheet content — visual conflict.
   - What's unclear: Whether D-13 intended the chip to also hide under sheets.
   - Recommendation: Add `body[data-sheet-open="true"] [data-ws-chip="true"]` rule to globals.css (mirror of bar). Planner adds this to Plan 04 + Plan 01 globals.css edit.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js | All routes + `usePathname` + `<Link>` | ✓ | 16.1.0 | — |
| React | All client components | ✓ | (from Next.js 16) | — |
| @radix-ui/react-dialog | Sheet primitive (already imported) | ✓ | 1.1.14 | — |
| lucide-react | Tab icons | ✓ | 0.562.0 | — |
| @auth0/nextjs-auth0 | `/altro` auth gate (via `ClientProviders`) | ✓ | 4.13.1 | — |
| Tailwind CSS | `<main>` padding utilities | ✓ | (4.x via `@import "tailwindcss"`) | — |
| Playwright | Smoke spec | ✓ | (configured in `playwright.config.ts`) | — |
| Jest | Unit specs | ✓ | (per `package.json`) | — |

**No new dependencies required.** All listed are installed and at recent versions. Per CLAUDE.md Rule 4, no `npm install` is allowed in agent execution — none is needed.

---

## Sources

### Primary (HIGH confidence)
- `app/components/EmberGlass/Sheet.tsx` — current Sheet primitive (augmentation site for D-10)
- `app/components/EmberGlass/Pressable.tsx` — polymorphic press primitive
- `app/components/layout/NavbarConnectionStatus.tsx` — WS chip
- `app/layout.tsx` — root mount site (lines 32 viewportFit, 72 Navbar mount, 73 main padding, 78 Footer mount)
- `lib/devices/deviceRegistry.ts:204` — `getNavigationStructureWithPreferences` signature
- `app/globals.css` — token system + `@supports not` fallback at line 340
- `app/stanze/page.tsx` — `/altro/page.tsx` template
- `playwright.config.ts` — Playwright project config
- `tests/smoke/rooms-tab.spec.ts:33,53` — `collectConsoleErrors` + `dismissVersionEnforcerIfPresent` helpers
- `node_modules/react-remove-scroll-bar/dist/es5/component.js:34-36` — Radix's body counter behavior
- `.planning/inbox/ember-glass-design/project/components/app.jsx:340-379` — bundle TabBar source-of-truth
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-RESEARCH.md:406,552` — Sheet Strict Mode pattern
- `.planning/phases/181-glass-bottom-tab-bar/181-CONTEXT.md` — D-01..D-21 locked decisions

### Secondary (MEDIUM confidence)
- nextjs.org/docs/app/api-reference/functions/use-pathname — `usePathname` SSR/CSR contract
- nextjs.org/docs/app/api-reference/components/link — `<Link>` API
- developer.mozilla.org/en-US/docs/Web/CSS/env — `env()` constants and `viewport-fit`
- developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix — color-mix syntax + browser support
- caniuse.com/css-color — `color-mix` baseline
- lucide.dev/guide/packages/lucide-react — lucide-react props

### Tertiary (LOW confidence)
- chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride — CDP `safeAreaInsets` (rejected approach; documented for completeness)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep is already at a recent version; zero new installs needed.
- Architecture: HIGH — CONTEXT.md D-01..D-21 leaves only Open Questions 1, 2, 3 as judgment calls.
- Pitfalls: HIGH — 8 concrete bugs identified with reproduction conditions and avoidance steps; 1 (Pitfall 7 / OQ-3) requires a small CONTEXT.md addition to globals.css that the planner should incorporate.
- Validation: HIGH — Nyquist Dimension 8 mapping is 1-to-1 with NAV-01..04; helpers already exist in `tests/smoke/rooms-tab.spec.ts`.

**Research date:** 2026-05-02
**Valid until:** 2026-06-01 (30 days — Phase 181 has no fast-moving dependencies; only a Next.js 17 release would shift the `usePathname` contract.)

---

## RESEARCH COMPLETE
