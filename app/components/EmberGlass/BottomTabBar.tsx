'use client';

/**
 * Phase 181 — Bottom Tab Bar (NAV-01..04).
 *
 * Glass pill with 4 tabs (Casa / Stanze / Automazioni / Altro) pinned to the
 * viewport bottom on mobile (left/right 12px) and centered 480px on ≥sm desktop.
 * Bundle source: .planning/inbox/ember-glass-design/project/components/app.jsx:340-379.
 *
 * Z-INDEX RESERVATION (CRITICAL): zIndex: 150 here — must stay BELOW
 * Phase 175 Sheet's 200 (backdrop) / 201 (content). Verified at Sheet.tsx:80,100.
 * The body[data-sheet-open="true"] hide rule in globals.css (Phase 181 D-09)
 * additionally slides this bar off-screen when any sheet is open, so there is
 * no z-stacking artifact even mid-animation.
 *
 * Active-tab detection: usePathname() — exact match for '/', prefix match for
 * /stanze, /automazioni, /altro. Non-tab routes (e.g. /stove, /lights, /log)
 * intentionally leave ALL 4 tabs inactive (CONTEXT D-06).
 *
 * Pressable as={Link} requires explicit tabIndex={0} (RESEARCH Pitfall 3) —
 * Pressable.tsx FOCUSABLE_HOSTS only matches string tags, so the polymorphic
 * Link consumer must opt into data-pressable-focusable manually.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Zap, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Pressable } from './Pressable';

interface Tab {
  readonly id: 'home' | 'rooms' | 'automations' | 'more';
  readonly label: string;
  readonly Icon: LucideIcon;
  readonly route: string;
}

const tabs: readonly Tab[] = [
  { id: 'home',        label: 'Casa',        Icon: Home,           route: '/' },
  { id: 'rooms',       label: 'Stanze',      Icon: LayoutGrid,     route: '/stanze' },
  { id: 'automations', label: 'Automazioni', Icon: Zap,            route: '/automazioni' },
  { id: 'more',        label: 'Altro',       Icon: MoreHorizontal, route: '/altro' },
] as const;

function isActive(pathname: string, route: string): boolean {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function BottomTabBar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigazione principale">
      <div
        data-bottom-tab="true"
        style={{
          position: 'fixed',
          bottom: 'calc(8px + env(safe-area-inset-bottom))',
          zIndex: 150,
          borderRadius: 28,
          background: 'rgba(18, 15, 14, 0.75)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '0.5px solid rgba(255, 255, 255, 0.1)',
          boxShadow:
            '0 12px 40px rgba(0, 0, 0, 0.4), inset 1px 1px 0 rgba(255, 255, 255, 0.06)',
          padding: 6,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.route);
          const Icon = tab.Icon;
          return (
            <Pressable
              key={tab.id}
              as={Link}
              href={tab.route}
              tabIndex={0}
              aria-current={active ? 'page' : undefined}
              style={{
                padding: '10px 0 8px',
                borderRadius: 22,
                border: 'none',
                cursor: 'pointer',
                background: active
                  ? 'color-mix(in oklab, var(--accent) 18%, transparent)'
                  : 'transparent',
                color: active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.55)',
                boxShadow: active
                  ? '0 0 0 1px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)'
                  : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                transition: 'background .22s, color .22s, box-shadow .22s',
                position: 'relative',
                textDecoration: 'none',
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.1 }}>
                {tab.label}
              </div>
            </Pressable>
          );
        })}
      </div>
    </nav>
  );
}
