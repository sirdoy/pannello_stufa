# Phase 181: Glass Bottom Tab Bar — Pattern Map

**Mapped:** 2026-05-02
**Files analyzed:** 14 (11 NEW, 3 MODIFIED — `globals.css` is a single CSS-rule append; `index.ts` is a barrel append; `Sheet.tsx` is a 2-line additive edit; `Sheet.test.tsx` and `app/layout.tsx` are tracked as modified files)
**Analogs found:** 14 / 14 (every file has a strong same-role + same-data-flow precedent in this repo)

---

## File Classification

| File (NEW unless marked) | Role | Data Flow | Closest Analog | Match Quality |
|--------------------------|------|-----------|----------------|---------------|
| `app/components/EmberGlass/BottomTabBar.tsx` | client component (presentational + pathname read) | request-response (read pathname → compute active → render) | `app/components/EmberGlass/automations/AutomationRow.tsx` (inline-style row + `Pressable`-style press surface) — visual contract from `.planning/inbox/ember-glass-design/project/components/app.jsx:340-379` | role-match (no prior `<Pressable as={Link}>` exists in repo; first usage) |
| `app/components/EmberGlass/SheetCounter.ts` | utility module (pure) | event-driven (increment / decrement → DOM side-effect) | No exact analog — closest is the `PRESS_TRANSITION` constant + helper sets in `app/components/EmberGlass/Pressable.tsx:80-88`. The sync-to-DOM pattern is **novel for this codebase**. | partial — no analog with module-level mutable state; planner builds from CONTEXT D-10 verbatim |
| `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` | unit test | n/a | `app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx` (Phase 180 row spec) — ALSO `app/components/EmberGlass/__tests__/CardHead.test.tsx` (small primitive spec) | exact (both render a presentational glass component, mock router, assert inline-style) |
| `app/components/EmberGlass/__tests__/SheetCounter.test.ts` | unit test | n/a | `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx` (pure-function `mapReadyState` describe block at lines 16-36) | role-match (same shape: pure function + describe + per-input expectation) |
| `app/altro/page.tsx` | route page (client) | request-response | `app/automazioni/page.tsx` (Phase 180 D-06; itself mirrors `app/stanze/page.tsx` Phase 179) | exact |
| `app/components/EmberGlass/altro/AltroPage.tsx` | client component (orchestrator) | request-response (fetch device prefs → render groups) | `app/components/EmberGlass/rooms/RoomsTab.tsx` (Phase 179 — `'use client'` orchestrator with `paddingTop:70` + title block + grid of glass cards) | exact |
| `app/components/EmberGlass/altro/AltroRow.tsx` | client component (presentational, `Pressable as={Link}`) | request-response | `app/components/EmberGlass/automations/AutomationRow.tsx` (inline-style glass row + leading icon + name + trailing slot) — but adopt `<Pressable as={Link}>` per CONTEXT D-12 | role-match (visual structure exact; the polymorphic-Link wrap is new) |
| `app/altro/__tests__/page.test.tsx` | unit test (page) | n/a | `app/raspi/__tests__/page.test.tsx` (Phase 90 — UI-mock pattern + section heading assertions) | exact |
| `app/components/layout/NavbarConnectionStatusChip.tsx` | client component (thin positional wrapper) | request-response (no own state; renders existing component inside fixed-position `<div>`) | `app/components/layout/NavbarConnectionStatus.tsx` (the wrapped component itself — 46 LOC, zero-prop, `'use client'`) | role-match (the chip is a one-purpose wrapper around exactly this component) |
| `app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` | unit test | n/a | `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx` (mocks `useWebSocketContext`, asserts rendered status text) | exact |
| `tests/smoke/bottom-tab-bar.spec.ts` | Playwright E2E | n/a | `tests/smoke/rooms-tab.spec.ts` (Phase 179 — `collectConsoleErrors` + `dismissVersionEnforcerIfPresent` + `primeDashboardForSheetTest` + multi-viewport assertions) | exact (note: research Pitfall 12 confirms `tests/smoke/` location, NOT `tests/playwright/`) |
| `app/components/EmberGlass/Sheet.tsx` (MOD) | client component (additive edit) | event-driven | self — augment existing `useEffect([open])` at lines 47-61 | n/a (in-place edit) |
| `app/components/EmberGlass/index.ts` (MOD) | barrel | n/a | self — append `BottomTabBar`, `AltroRow`, `SheetCounter` re-exports next to lines 1-4 | n/a |
| `app/components/EmberGlass/__tests__/Sheet.test.tsx` (MOD) | unit test (extension) | n/a | self — existing 215-LOC spec at lines 23-214; add a 5th `describe` block for the body-attribute counter behavior | n/a (file exists; D-14 third bullet) |
| `app/layout.tsx` (MOD) | server component (root layout edits) | request-response | self — current file at lines 35-83 | n/a (in-place edit) |
| `app/globals.css` (MOD) | global CSS append | n/a | self — append after line 358 (existing keyframes block); pattern mirrors the `@supports not` block at lines 340-344 | n/a |

---

## Pattern Assignments

### `app/components/EmberGlass/BottomTabBar.tsx` (component, request-response)

**Analogs:**
- **Visual:** `.planning/inbox/ember-glass-design/project/components/app.jsx:340-379` (the bundle TabBar — VERBATIM source per CONTEXT D-02 inline-style discipline).
- **Codebase analog (inline-style row idiom):** `app/components/EmberGlass/automations/AutomationRow.tsx` lines 55-148 — same idiom of `'use client'` + inline-style + `var(--token)` + lucide icon container + tone-driven `color-mix` background.
- **Pathname read:** `app/components/Navbar.tsx:5,74,169` — `usePathname()` from `next/navigation`, exact-vs-prefix active matching.

**Imports pattern** (mirror `AutomationRow.tsx:1,17,21-25`):
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Zap, MoreHorizontal } from 'lucide-react';
import { Pressable } from '../EmberGlass'; // OR './Pressable' if BottomTabBar lives at the namespace root
```

**Active-tab detection pattern** (mirror `Navbar.tsx:169` + RESEARCH §Pattern 4):
```tsx
const pathname = usePathname(); // string, never null on client
const isActive = (route: string): boolean => {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
};
```

**Container styling pattern** (TRANSCRIBE FROM bundle `app.jsx:341-345` modulo CONTEXT D-08 safe-area inset; mirror inline-style discipline of `AutomationRow.tsx:67-76`):
```tsx
<div
  data-bottom-tab="true"  /* CONTEXT D-09 selector hook for hide-when-sheet-open */
  style={{
    position: 'fixed',
    bottom: 'calc(8px + env(safe-area-inset-bottom))',  /* CONTEXT D-08 */
    left: 12,
    right: 12,
    zIndex: 150,
    background: 'rgba(18,15,14,0.75)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',  /* mirror Sheet.tsx:103-104 */
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 28,
    padding: 6,
    boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.06)',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 4,
  }}
>
  {tabs.map((tab) => { /* per-tab Pressable */ })}
</div>
```

**Per-tab pattern** (`<Pressable as={Link}>` polymorphic — first usage in repo per RESEARCH §Pattern 5; TWO mandatory consumer touches: `tabIndex={0}` for focus-visible per RESEARCH Pitfall 3, and inline-style for active styling per CONTEXT D-07):
```tsx
const active = isActive(tab.route);
return (
  <Pressable
    key={tab.id}
    as={Link}
    href={tab.route}
    tabIndex={0}                    /* RESEARCH Pitfall 3 — required for accent focus ring */
    aria-current={active ? 'page' : undefined}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      padding: '8px 0',
      borderRadius: 22,
      textDecoration: 'none',
      transition: 'background .22s, color .22s, box-shadow .22s',
      background: active
        ? 'color-mix(in oklab, var(--accent) 18%, transparent)'   /* CONTEXT D-07 */
        : 'transparent',
      color: active ? 'var(--accent)' : 'rgba(255,255,255,0.55)',
      boxShadow: active
        ? '0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)'
        : 'none',
    }}
  >
    <tab.Icon size={22} strokeWidth={active ? 2.2 : 1.8} />  {/* RESEARCH §Pattern 6 */}
    <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
  </Pressable>
);
```

**Tab map** (CONTEXT D-05 verbatim — Italian labels, lucide replaces bundle ad-hoc icons):
```tsx
const tabs = [
  { id: 'home',        label: 'Casa',        Icon: Home,           route: '/' },
  { id: 'rooms',       label: 'Stanze',      Icon: LayoutGrid,     route: '/stanze' },
  { id: 'automations', label: 'Automazioni', Icon: Zap,            route: '/automazioni' },
  { id: 'more',        label: 'Altro',       Icon: MoreHorizontal, route: '/altro' },
] as const;
```

**Data flow:** props in (none — zero-arg component); state ownership = `usePathname()` only (no useState). Renders 4 `<Pressable as={Link}>` children. No callbacks out — `<Link>` handles client-side navigation.

---

### `app/components/EmberGlass/SheetCounter.ts` (module, event-driven)

**Analog:** none in repo for module-level mutable counter; closest discipline is the `PRESS_TRANSITION` constant pattern at `app/components/EmberGlass/Pressable.tsx:80` (named const + small helper exports). Build verbatim from CONTEXT D-10:

**Pattern** (CONTEXT D-10 — paste-as-spec):
```ts
let count = 0;

function sync(): void {
  if (typeof document === 'undefined') return;  // SSR guard (RESEARCH §Pattern 3)
  if (count > 0) {
    document.body.dataset.sheetOpen = 'true';
  } else {
    delete document.body.dataset.sheetOpen;
  }
}

export function incrementSheetCount(): void {
  count += 1;
  sync();
}

export function decrementSheetCount(): void {
  count = Math.max(0, count - 1);  // clamp — RESEARCH §Pattern 14 hazard
  sync();
}
```

**Data flow:** pure function exports; module-level `count` is the single source of truth. Side-effect = `document.body.dataset.sheetOpen` toggle. Zero React, zero deps.

---

### `app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` (test)

**Analog:** `app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx` lines 1-50 (jest.mock pattern + screen queries) + `app/components/EmberGlass/__tests__/CardHead.test.tsx` lines 1-40 (inline-style assertions on rendered output).

**Mock pattern for `usePathname`** (mirror `app/raspi/__tests__/page.test.tsx:18-22`):
```tsx
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
import { usePathname } from 'next/navigation';
const mockUsePathname = jest.mocked(usePathname);
```

**Per-test setup** (mirror `NavbarConnectionStatus.test.tsx:39-51`):
```tsx
beforeEach(() => {
  jest.clearAllMocks();
});

test('Casa is active when pathname is "/"', () => {
  mockUsePathname.mockReturnValue('/');
  render(<BottomTabBar />);
  const casa = screen.getByRole('link', { name: /casa/i });
  expect(casa).toHaveAttribute('aria-current', 'page');
  expect(casa.style.color).toBe('var(--accent)');
});

test('Stanze is active for /stanze and any subroute', () => {
  mockUsePathname.mockReturnValue('/stanze/sala');
  render(<BottomTabBar />);
  expect(screen.getByRole('link', { name: /stanze/i }))
    .toHaveAttribute('aria-current', 'page');
});

test('No tab is active for unmapped routes', () => {
  mockUsePathname.mockReturnValue('/stove/scheduler');
  render(<BottomTabBar />);
  expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
});

test('Root has data-bottom-tab="true"', () => {
  mockUsePathname.mockReturnValue('/');
  const { container } = render(<BottomTabBar />);
  expect(container.querySelector('[data-bottom-tab="true"]')).not.toBeNull();
});
```

**Inline-style assertion idiom** (lifted verbatim from `CardHead.test.tsx:24-33`):
```tsx
const tile = divs.find((d) => d.style.width === '32px');
expect(tile!.style.background).toContain('color-mix');
```

---

### `app/components/EmberGlass/__tests__/SheetCounter.test.ts` (test)

**Analog:** `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx:16-36` (`describe('mapReadyState') ... it('maps OPEN to online')` — pure-function table tests).

**Pattern** (mirror that describe; assertions land on `document.body.dataset.sheetOpen`):
```ts
import {
  incrementSheetCount,
  decrementSheetCount,
} from '../SheetCounter';

describe('SheetCounter', () => {
  afterEach(() => {
    // Reset via decrement until clean — module state persists across tests in same file.
    while (document.body.dataset.sheetOpen) decrementSheetCount();
  });

  test('increment sets body.dataset.sheetOpen = "true"', () => {
    incrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('two increments still leave a single attribute', () => {
    incrementSheetCount();
    incrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('decrement once after two increments keeps attribute', () => {
    incrementSheetCount();
    incrementSheetCount();
    decrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('decrement to zero removes attribute', () => {
    incrementSheetCount();
    decrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBeUndefined();
  });

  test('decrement below zero clamps (no negative state)', () => {
    decrementSheetCount();
    decrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBeUndefined();
    incrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });
});
```

**Caveat:** Module state persists across `test()` calls in the same Jest worker — the `afterEach` cleanup loop above is REQUIRED. Document this in the spec header.

---

### `app/altro/page.tsx` (page route)

**Analog:** `app/automazioni/page.tsx` — 24 LOC, identical shape will satisfy CONTEXT D-17.

**Pattern** (verbatim from `app/automazioni/page.tsx:1-24`, swap symbols):
```tsx
'use client';
/**
 * /altro route — Phase 181 (CONTEXT D-12 / D-17).
 *
 * Mounts <AltroPage /> as a client route.
 * Auth0 wrap is automatic via app/layout.tsx ClientProviders.
 * Pattern mirrors app/automazioni/page.tsx (Phase 180 D-06).
 */

import { AltroPage } from '@/app/components/EmberGlass/altro/AltroPage';

export const dynamic = 'force-dynamic';

export default function AltroRoute() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Altro</h1>
      <AltroPage />
    </section>
  );
}
```

**Data flow:** props in (none); delegates entirely to `AltroPage`. Tailwind layout class on `<section>` is the explicit carve-out per `app/stanze/page.tsx:18` precedent.

---

### `app/components/EmberGlass/altro/AltroPage.tsx` (orchestrator)

**Analog:** `app/components/EmberGlass/rooms/RoomsTab.tsx` (Phase 179 — closest existing v20.0 page-body orchestrator). Same shape: `'use client'` + `paddingTop:70` chrome offset + title block + grid of glass groups.

**Imports pattern** (mirror `RoomsTab.tsx:14-27`):
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Settings, LogOut, ChevronRight /* + per-device icons */ } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { AltroRow } from './AltroRow';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';
```

**Page chrome pattern** (transcribed from `RoomsTab.tsx:114-139`):
```tsx
return (
  <>
    <div style={{ paddingTop: 70 }}>
      {/* Title block — CONTEXT D-12 (mirrors RoomsTab.tsx:118-139 D-48 typography) */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Menu principale
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30,
          fontWeight: 600,
          color: '#fff',
          letterSpacing: -0.8,
        }}>Altro</div>
      </div>

      {/* Stacked GlassCard groups — Dispositivi / Sistema / Impostazioni / Account */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GlassCard>
          <CardHead label="Dispositivi" />
          {deviceRows.map((d) => (
            <AltroRow key={d.id} icon={d.Icon} label={d.name} href={d.route} />
          ))}
        </GlassCard>
        {/* ... Sistema / Impostazioni / Account groups ... */}
      </div>
    </div>
  </>
);
```

**Device fetch pattern** (legacy `app/components/Navbar.tsx:140-167` — RESEARCH Open Question 1 recommends inlining for Phase 181):
```tsx
const [devicePreferences, setDevicePreferences] = useState<Record<string, boolean>>({});
useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      const configRes = await fetch('/api/devices/config');
      if (!configRes.ok) return;
      const configData: { enabledDevices?: string[] } = await configRes.json();
      const prefs: Record<string, boolean> = {};
      (configData.enabledDevices ?? []).forEach((id) => { prefs[id] = true; });
      if (!cancelled) setDevicePreferences(prefs);
    } catch (error) {
      console.error('Errore nel recupero dati:', error);
    }
  })();
  return () => { cancelled = true; };
}, []);
const navStructure = getNavigationStructureWithPreferences(devicePreferences);
```

**Critical note for planner** (RESEARCH §Pattern 11): `device.icon` is a **string key**, not a lucide component — needs an `ICON_MAP` similar to `app/components/EmberGlass/rooms/lib/rooms-config.ts:ICON_FOR`.

**Settings routes** (RESEARCH §Pattern 12 — only ship existing routes): `/settings`, `/settings/api-keys`, `/settings/dashboard`, `/settings/devices`, `/settings/location`, `/settings/notifications`, `/settings/thermostat`. CONTEXT D-12 named `/settings/account`, `/settings/gdpr`, `/settings/privacy` which DON'T exist — defer per Open Question 2.

**Data flow:** props in (none); state = `devicePreferences` (fetched once on mount); renders 4 `<GlassCard>` groups composed of `<AltroRow>` instances. No callbacks out — `<AltroRow>` handles its own client-side navigation via `<Pressable as={Link}>`.

---

### `app/components/EmberGlass/altro/AltroRow.tsx` (component)

**Analog:** `app/components/EmberGlass/automations/AutomationRow.tsx` (visual structure: leading icon container + name + trailing slot, all inline-style with `var(--token)`). Replace the `role="button"` outer with `<Pressable as={Link}>` per CONTEXT D-12.

**Pattern** (combines `AutomationRow.tsx:55-148` styling with `<Pressable as={Link}>` from BottomTabBar pattern above):
```tsx
'use client';

import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Pressable } from '../Pressable';

export interface AltroRowProps {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Optional override (e.g. flame-red for Logout per CONTEXT D-12). */
  tone?: string;
}

export function AltroRow({ icon: Icon, label, href, tone }: AltroRowProps) {
  return (
    <Pressable
      as={Link}
      href={href}
      tabIndex={0}                    /* RESEARCH Pitfall 3 */
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--r-card)',
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.06)',
        textDecoration: 'none',
        color: tone ?? '#fff',
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500 }}>
        {label}
      </span>
      <ChevronRight size={16} color="var(--text-2)" />
    </Pressable>
  );
}
```

**Data flow:** props in (`icon`, `label`, `href`, optional `tone`); zero internal state; renders single anchor via `<Pressable as={Link}>`.

---

### `app/altro/__tests__/page.test.tsx` (test)

**Analog:** `app/raspi/__tests__/page.test.tsx` (Phase 90 — UI-component-mock pattern + section-heading assertions).

**Pattern** (lifted from raspi spec; mock the device fetch + `getNavigationStructureWithPreferences`):
```tsx
import { render, screen } from '@testing-library/react';
import AltroRoute from '../page';

jest.mock('@/app/components/EmberGlass/altro/AltroPage', () => ({
  AltroPage: () => <div data-testid="altro-page-stub" />,
}));

describe('/altro page', () => {
  it('renders the AltroPage component inside an sr-only-titled section', () => {
    render(<AltroRoute />);
    expect(screen.getByText('Altro')).toBeInTheDocument(); // sr-only h1
    expect(screen.getByTestId('altro-page-stub')).toBeInTheDocument();
  });
});
```

For the AltroPage body itself a separate spec (`app/components/EmberGlass/altro/__tests__/AltroPage.test.tsx`) is recommended — assertions per CONTEXT D-14: 4 group headings + Logout row link + always-present links.

---

### `app/components/layout/NavbarConnectionStatusChip.tsx` (component)

**Analog:** `app/components/layout/NavbarConnectionStatus.tsx` itself (the wrapped component) — 46 LOC, `'use client'`, zero-prop, returns a single span.

**Pattern** (from RESEARCH §Pattern 13 — drop CONTEXT D-13's misleading `pointerEvents: 'auto'`; mark with `data-ws-chip` for the planner-added hide rule from Open Question 3 / Pitfall 7):
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

**Data flow:** props in (none); zero state; renders existing component inside fixed-position div.

---

### `app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` (test)

**Analog:** `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx:38-51` — same `useWebSocketContext` mock pattern.

**Pattern** (lifted from analog lines 1-15 + 38-51):
```tsx
import { render, screen } from '@testing-library/react';
import { ReadyState } from 'react-use-websocket';
import { NavbarConnectionStatusChip } from '../NavbarConnectionStatusChip';

jest.mock('@/app/context/WebSocketContext', () => ({
  useWebSocketContext: jest.fn(),
}));
import { useWebSocketContext } from '@/app/context/WebSocketContext';
const mockUseWebSocketContext = jest.mocked(useWebSocketContext);

describe('NavbarConnectionStatusChip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.OPEN,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
  });

  it('renders NavbarConnectionStatus inside a fixed-position chip', () => {
    const { container } = render(<NavbarConnectionStatusChip />);
    const chip = container.querySelector('[data-ws-chip="true"]') as HTMLElement;
    expect(chip).not.toBeNull();
    expect(chip.style.position).toBe('fixed');
    expect(chip.style.zIndex).toBe('150');
    expect(screen.getByRole('status')).toHaveTextContent('Connesso via WS');
  });
});
```

---

### `tests/smoke/bottom-tab-bar.spec.ts` (Playwright)

**Analog:** `tests/smoke/rooms-tab.spec.ts` (Phase 179 — `collectConsoleErrors` + `dismissVersionEnforcerIfPresent` + `dismissWhatsNewModalIfPresent` + `primeDashboardForSheetTest`). Copy helpers VERBATIM per `rooms-tab.spec.ts:33-127`.

**Critical:** path is `tests/smoke/`, NOT `tests/playwright/` (RESEARCH §Pattern 9 corrects CONTEXT.md line 46 typo; verified via `ls tests/smoke/`).

**Helpers to copy verbatim** (from `rooms-tab.spec.ts:33-127`):
```ts
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } { /* lines 33-45 */ }
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> { /* lines 53-70 */ }
async function dismissWhatsNewModalIfPresent(page: Page): Promise<void> { /* lines 83-97 */ }
async function primeDashboardForSheetTest(page: Page): Promise<void> { /* lines 105-127 */ }
```

**Spec scaffold** (CONTEXT D-15 → 7 cases; mirror `rooms-tab.spec.ts:252-411` describe shape):
```ts
test.describe('Phase 181 — Bottom Tab Bar (NAV-01..04)', () => {
  test.beforeEach(async ({ page }) => {
    await primeDashboardForSheetTest(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('NAV-04 safe-area inset CSS contract (375×812)', async ({ page }) => {
    const rect = await page.locator('[data-bottom-tab="true"]').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { bottom: r.bottom, computedBottom: cs.bottom };
    });
    expect(rect.computedBottom).toBe('8px'); // env() = 0 in headless Chromium
    expect(Math.abs(rect.bottom - (812 - 8))).toBeLessThan(2);
  });

  test('NAV-02 active state on /stanze', async ({ page }) => {
    await page.locator('[data-bottom-tab="true"]').getByText('Stanze').click();
    await expect(page).toHaveURL(/\/stanze/);
    const color = await page.locator('[aria-current="page"]').first().evaluate(
      (el) => getComputedStyle(el).color
    );
    // var(--accent) resolves to RGB; assert non-empty + not the inactive grey.
    expect(color).not.toBe('rgba(255, 255, 255, 0.55)');
  });

  test('NAV-01 desktop centering (1280×800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const rect = await page.locator('[data-bottom-tab="true"]').boundingBox();
    expect(rect!.width).toBe(480);
    expect(Math.abs(rect!.x + rect!.width / 2 - 640)).toBeLessThan(4);
  });

  test('NAV-03 hides under open sheet', async ({ page }) => {
    /* Open Phase 178 device sheet (e.g., StoveCard click); assert bar slid off-screen */
  });

  test('console-error-free', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.goto('/altro');
    cleanup();
    expect(errors).toEqual([]);
  });
});
```

**Data flow:** browser-driven E2E; helpers reused verbatim.

---

### `app/components/EmberGlass/Sheet.tsx` (MODIFIED — D-10 augmentation)

**Existing block to augment** (file reads at lines 47-61 today — minimal additive edit):
```tsx
useEffect(() => {
  if (!open) return;
  lockedScrollY.current = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollY.current}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, lockedScrollY.current);
  };
}, [open]);
```

**Edit pattern** (CONTEXT D-10 + RESEARCH §Pattern 3 — strict-mode safe; cleanup is symmetric):
```tsx
import { incrementSheetCount, decrementSheetCount } from './SheetCounter';

useEffect(() => {
  if (!open) return;
  lockedScrollY.current = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollY.current}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  incrementSheetCount();        // ← NEW (Phase 181 D-10)
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, lockedScrollY.current);
    decrementSheetCount();      // ← NEW (Phase 181 D-10)
  };
}, [open]);
```

**Constraint:** Phase 175 D-02 forbids replacement; this is **additive** (RESEARCH §Pattern 3 — non-breaking; existing 215-LOC Sheet.test.tsx must stay green).

---

### `app/components/EmberGlass/__tests__/Sheet.test.tsx` (MODIFIED — D-14 extension)

**Existing structure** (lines 23-214 today): 4 `describe` blocks — Rendering / Dismissal vectors / Body scroll-lock / ARIA.

**Append a 5th describe** (CONTEXT D-14 third bullet — three test cases):
```tsx
describe('Body data-attribute (Phase 181 D-10)', () => {
  afterEach(() => {
    delete document.body.dataset.sheetOpen;
  });

  test('mounting open=true sets body.dataset.sheetOpen', () => {
    render(<Sheet open={true} onClose={onCloseMock}><div>x</div></Sheet>);
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('flipping open true → false clears the attribute', () => {
    const { rerender } = render(<Sheet open={true} onClose={onCloseMock}><div>x</div></Sheet>);
    expect(document.body.dataset.sheetOpen).toBe('true');
    rerender(<Sheet open={false} onClose={onCloseMock}><div>x</div></Sheet>);
    expect(document.body.dataset.sheetOpen).toBeUndefined();
  });

  test('two stacked open sheets keep the attribute until both close', () => {
    const { rerender, unmount } = render(
      <>
        <Sheet open={true} onClose={onCloseMock}><div>a</div></Sheet>
        <Sheet open={true} onClose={onCloseMock}><div>b</div></Sheet>
      </>
    );
    expect(document.body.dataset.sheetOpen).toBe('true');
    rerender(
      <>
        <Sheet open={false} onClose={onCloseMock}><div>a</div></Sheet>
        <Sheet open={true} onClose={onCloseMock}><div>b</div></Sheet>
      </>
    );
    expect(document.body.dataset.sheetOpen).toBe('true'); // counter still 1
    unmount();
    expect(document.body.dataset.sheetOpen).toBeUndefined();
  });
});
```

**Existing `afterEach`** (line 33-37 of analog) already wipes body styles — extend to also `delete document.body.dataset.sheetOpen` if leak observed.

---

### `app/layout.tsx` (MODIFIED — D-04 / D-11 / D-13)

**Existing edit sites** (lines 5-6, 72-78 today):
```tsx
// REMOVE these imports (D-04):
import Navbar from './components/Navbar';
import { Footer } from './components/ui';

// ADD these imports:
import { BottomTabBar } from './components/EmberGlass';
import { NavbarConnectionStatusChip } from './components/layout/NavbarConnectionStatusChip';
```

**JSX edits at lines 72-78** (mirror the existing structure, swap mounts; D-11 padding retune):
```tsx
<ClientProviders>
  <WebVitals />
  <VersionEnforcer />
  {/* <Navbar /> ← REMOVED (D-04) */}
  <NavbarConnectionStatusChip />               {/* ← NEW (D-13) */}
  <main
    id="main-content"
    className="flex-1 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+88px)] px-4 sm:px-6 lg:px-8"
                                               /* ← REPLACES "flex-1 pt-2 pb-12 px-4 sm:px-6 lg:px-8" (D-11) */
  >
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </main>
  <BottomTabBar />                             {/* ← NEW (D-04) — placed AFTER </main> per CONTEXT */}
  {/* <Footer /> ← REMOVED (D-04) */}
</ClientProviders>
```

**CONTEXT D-04 invariant:** `app/components/Navbar.tsx` and `app/components/ui/Footer.tsx` files stay on disk; only the import + JSX mount lines are removed.

---

### `app/globals.css` (MODIFIED — D-09 + Pitfall 2 + OQ-3)

**Append after line 358** (existing `@keyframes ambientC` block ends; mirror the `@supports not` pattern at lines 340-344 for grouping):
```css
/* Phase 181 — bottom tab bar cross-cutting rules (D-09 + RESEARCH §Pattern 8 + Pitfall 2) */
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

/* Pitfall 2: combine centering + hide transforms on desktop */
@media (min-width: 640px) {
  body[data-sheet-open="true"] [data-bottom-tab="true"] {
    transform: translate(-50%, 140%);
  }
}

/* RESEARCH Open Question 3 / Pitfall 7 — hide WS chip under open sheet */
body[data-sheet-open="true"] [data-ws-chip="true"] {
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
}
```

---

### `app/components/EmberGlass/index.ts` (MODIFIED — barrel append)

**Existing barrel** ends at line 44 with `export * from './automations';`.

**Append** (per CONTEXT D-01 — re-export so Phase 182 DSREF can import via `@/app/components/EmberGlass`):
```ts
// Phase 181 — bottom tab bar + altro page
export { BottomTabBar } from './BottomTabBar';
export { AltroRow } from './altro/AltroRow';
export type { AltroRowProps } from './altro/AltroRow';
// SheetCounter helpers — kept internal per CONTEXT D-10 ("if desired").
// Recommended: NOT re-exported. Consumers should never call increment/decrement directly.
```

---

## Shared Patterns

### Inline-style + `var(--token)` discipline (CONTEXT D-02)
**Source:** `app/components/EmberGlass/Sheet.tsx:78-113`, `app/components/EmberGlass/automations/AutomationRow.tsx:67-148`, `app/components/EmberGlass/rooms/RoomCard.tsx:42-50`.
**Apply to:** `BottomTabBar.tsx`, `AltroPage.tsx`, `AltroRow.tsx`, `NavbarConnectionStatusChip.tsx`.
**Excerpt** (`AutomationRow.tsx:67-76`):
```tsx
style={{
  borderRadius: 'var(--r-card)',
  padding: 14,
  background: containerBg,
  border: containerBorder,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
}}
```
Single CSS exception is `globals.css` for cross-cutting selectors (D-09).

### `'use client'` orchestrator with `paddingTop:70` chrome offset
**Source:** `app/components/EmberGlass/rooms/RoomsTab.tsx:114-139`.
**Apply to:** `AltroPage.tsx`.
**Excerpt:**
```tsx
<div style={{ paddingTop: 70 }}>
  <div style={{ padding: '0 20px 20px' }}>
    <div style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
      {/* eyebrow */}
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.8 }}>
      {/* page title */}
    </div>
  </div>
  {/* page body grid */}
</div>
```

### `<Pressable as={Link}>` polymorphic with `tabIndex={0}` (RESEARCH Pitfall 3 — first usage in repo)
**Source:** `app/components/EmberGlass/Pressable.tsx:90-138` (definition); no prior consumer of `as={Link}` exists — Phase 181 sets the pattern.
**Apply to:** `BottomTabBar.tsx` (4 tabs), `AltroRow.tsx` (every row).
**Excerpt:**
```tsx
<Pressable as={Link} href={route} tabIndex={0} style={{ /* … */ }}>
  …
</Pressable>
```
**WHY `tabIndex={0}`:** `FOCUSABLE_HOSTS` (Pressable.tsx:88) detects only string tags; `as={Link}` (component reference) bypasses that check → no `data-pressable-focusable="true"` → no accent focus-visible ring without explicit `tabIndex`.

### Auth-wrap inheritance via `ClientProviders` (CONTEXT D-17)
**Source:** `app/automazioni/page.tsx`, `app/stanze/page.tsx`.
**Apply to:** `app/altro/page.tsx`.
**Excerpt:**
```tsx
'use client';
import { AltroPage } from '@/app/components/EmberGlass/altro/AltroPage';
export const dynamic = 'force-dynamic';
export default function AltroRoute() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Altro</h1>
      <AltroPage />
    </section>
  );
}
```
Auth0 cookies + `ClientProviders` (mounted in `app/layout.tsx:69`) handle the gate automatically — no explicit `withPageAuthRequired` call.

### `usePathname` mock for component tests (CONTEXT D-14)
**Source:** `app/raspi/__tests__/page.test.tsx:18-22` (mocks `useRouter`); `app/components/Navbar.tsx:5,74,169` (production usage).
**Apply to:** `BottomTabBar.test.tsx`.
**Excerpt:**
```tsx
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
import { usePathname } from 'next/navigation';
const mockUsePathname = jest.mocked(usePathname);
beforeEach(() => { mockUsePathname.mockReturnValue('/'); });
```

### Playwright smoke test scaffold (CONTEXT D-15)
**Source:** `tests/smoke/rooms-tab.spec.ts:33-127` (helpers) + `:252-411` (test.describe shape).
**Apply to:** `tests/smoke/bottom-tab-bar.spec.ts`.
**Helpers to lift verbatim:** `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/components/EmberGlass/SheetCounter.ts` | utility module | event-driven | First module-level mutable counter in this codebase. Build verbatim from CONTEXT D-10; no other file uses module-level state + DOM side-effect. |

(`<Pressable as={Link}>` is also a first-time usage but the polymorphic primitive itself is locked at `Pressable.tsx:90-138`; the new file simply consumes it.)

---

## Metadata

**Analog search scope:** `app/components/EmberGlass/`, `app/components/EmberGlass/{rooms,automations,sheets,cards}/`, `app/components/layout/`, `app/{stanze,automazioni,raspi,altro}/`, `tests/smoke/`, `app/components/Navbar.tsx`, `app/layout.tsx`, `app/globals.css`.
**Files scanned:** 18 (Read tool); **Bash discovery:** 6 (ls + find + grep).
**Pattern extraction date:** 2026-05-02.

---

## PATTERN MAPPING COMPLETE
