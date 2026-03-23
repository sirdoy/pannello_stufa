# Phase 125: Navigation Menu Links - Research

**Researched:** 2026-03-23
**Domain:** Next.js navigation, TypeScript configuration data, Ember Noir design system
**Confidence:** HIGH

## Summary

Phase 125 is a gap-closure phase: the v15.0 pages (`/registry/types`, `/registry/devices`, `/rooms`, `/rooms/status`) were built without adding navbar entry points. The pages exist and work but are unreachable from the app menu.

The navigation system is fully data-driven. All menu entries originate from two data structures in `lib/devices/deviceTypes.ts`: `GLOBAL_SECTIONS` (for flat, always-visible links) and `SETTINGS_MENU` (for the Impostazioni dropdown). `deviceRegistry.ts` maps these to `NavItem` objects consumed by `Navbar.tsx`. No changes to `Navbar.tsx` rendering logic are needed — adding entries to `GLOBAL_SECTIONS` is sufficient for them to appear in both the desktop hidden nav and the mobile hamburger menu's "Global Navigation Section".

The plan has already identified the exact change: "Add Registro and Stanze sections to GLOBAL_SECTIONS in deviceTypes.ts + navbar rendering". Research confirms this is exactly right — `GLOBAL_SECTIONS` is iterated in `getGlobalNavItems()` → returned in `navStructure.global` → rendered in the "Global Navigation Section" in `Navbar.tsx` (lines 551-567 for mobile, lines 310-330 for desktop). Two new entries cover all four success-criteria routes if the entries point to top-level pages (`/registry/types` or `/registry` for Registro, `/rooms` for Stanze), with sub-pages reachable from within those pages.

There is one wrinkle: success criteria require `/registry/types`, `/registry/devices`, `/rooms`, and `/rooms/status` to all be reachable from nav. `GLOBAL_SECTIONS` entries use a single `route` field, so the top-level entry links to one route. Review of the Navbar code shows that `isActive` checks exact path equality — no `startsWith` active-highlight for global items. The plan therefore needs to decide: (a) one entry per section pointing to the main page, with sub-pages navigable from within, or (b) a section structure with sub-items similar to how `SETTINGS_MENU` supports `submenu`. Option (a) is simpler and satisfies the spirit of the success criteria; option (b) matches the exact literal text.

**Primary recommendation:** Add two entries to `GLOBAL_SECTIONS` (`REGISTRO` pointing to `/registry/types` and `STANZE` pointing to `/rooms`) and let in-page navigation handle the remaining sub-routes. This keeps the change minimal and consistent with how the only existing `GLOBAL_SECTIONS` entry (MONITORING) works.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Type-safe config additions | Already in project, strict mode enabled |
| Next.js Link / TransitionLink | 15.5 | Client-side navigation | Project pattern — TransitionLink used in Navbar logo |

No new dependencies required. This is a pure data-layer change.

**Installation:** None.

## Architecture Patterns

### How Navigation Entries Flow

```
lib/devices/deviceTypes.ts
  GLOBAL_SECTIONS: Record<string, GlobalSection>
        ↓
lib/devices/deviceRegistry.ts
  getGlobalNavItems() → NavItem[]
  getNavigationStructureWithPreferences() → { global: NavItem[] }
        ↓
app/components/Navbar.tsx
  navStructure.global → "Global Navigation Section" (mobile menu)
  navStructure.global → "Global Links" (desktop nav, currently hidden)
```

### GlobalSection Interface (from deviceTypes.ts line 272-276)

```typescript
// Source: lib/devices/deviceTypes.ts
interface GlobalSection {
  id: string;
  name: string;
  icon: string;
  route: string;
}
```

### Existing GLOBAL_SECTIONS Entry Pattern

```typescript
// Source: lib/devices/deviceTypes.ts line 282-289
export const GLOBAL_SECTIONS: Record<string, GlobalSection> = {
  MONITORING: {
    id: 'monitoring',
    name: 'Monitoring',
    icon: '📊',
    route: '/monitoring',
  },
};
```

### How to Add New Entries

```typescript
export const GLOBAL_SECTIONS: Record<string, GlobalSection> = {
  MONITORING: {
    id: 'monitoring',
    name: 'Monitoring',
    icon: '📊',
    route: '/monitoring',
  },
  REGISTRO: {
    id: 'registry',
    name: 'Registro',
    icon: '📋',
    route: '/registry/types',
  },
  STANZE: {
    id: 'rooms',
    name: 'Stanze',
    icon: '🏠',
    route: '/rooms',
  },
};
```

### Navbar Rendering — Where Global Items Appear

**Mobile hamburger menu** (`Navbar.tsx` lines 551-567):
```tsx
{navStructure.global && navStructure.global.length > 0 && (
  <MenuSection title="" hasBorder={true}>
    {navStructure.global.map((item, idx) => (
      <MenuItem
        key={item.route}
        href={item.route}
        icon={getIconForPath(item.route)}
        label={item.label}
        isActive={isActive(item.route)}
        animationDelay={idx * 50}
      />
    ))}
  </MenuSection>
)}
```

**Note:** `getIconForPath()` in Navbar.tsx maps paths to Lucide icon elements. It does not currently handle `/registry/*` or `/rooms/*` paths — it returns `null` for unrecognized paths. `MenuItem` in the navigation subcomponents renders `null` icons gracefully (verified by inspection of existing MONITORING entry which also has no icon from `getIconForPath`). Either accept null icons or extend `getIconForPath`.

### Anti-Patterns to Avoid

- **Adding routes to DEVICE_CONFIG:** Registry and Rooms are not device types — they belong in GLOBAL_SECTIONS or SETTINGS_MENU, not DEVICE_CONFIG.
- **Modifying Navbar.tsx rendering logic:** The rendering loop already handles any number of global items. No JSX changes needed.
- **Pointing to sub-routes only:** `/registry/devices` and `/rooms/status` exist as sub-pages. Navigation entry points should be to the parent pages so users can orient themselves.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation rendering | Custom nav block in Navbar.tsx | GLOBAL_SECTIONS data entry | Existing loop already handles it |
| Active-state highlighting | Custom isActive logic | Existing `isActive(item.route)` | Already implemented in Navbar |
| Icon mapping | New icon component | Extend `getIconForPath` or accept null | Minor UX gap, no functional impact |

## Common Pitfalls

### Pitfall 1: MONITORING entry currently has no real page
**What goes wrong:** `/monitoring` likely does not exist as a live page (removed in quick task 260322-t5k). If Navbar tests assert on the MONITORING entry existing, adding new entries could expose this stale entry. If tests check exact counts, new entries will break them.
**Why it happens:** MONITORING was left in GLOBAL_SECTIONS when the monitoring/analytics subsystem was deleted.
**How to avoid:** Check `Navbar.test.tsx` for any count-sensitive assertions. The file does NOT test global section rendering (it only tests `getMobileQuickActions`). So this is low risk. The plan should note the stale MONITORING entry as a known condition — do not remove it (out of scope) but do not introduce duplicate icons.
**Warning signs:** If a test imports `GLOBAL_SECTIONS` directly and asserts exact keys/length.

### Pitfall 2: getIconForPath returns null for registry/rooms paths
**What goes wrong:** `getIconForPath` in Navbar.tsx (lines 171-177) only maps `/`, `scheduler`, `errors`, `log` paths. New global items get `null` as icon.
**Why it happens:** GLOBAL_SECTIONS was only used for MONITORING which itself gets no icon from this function.
**How to avoid:** Either extend `getIconForPath` to handle `/registry` and `/rooms` paths, or accept that `MenuItem` renders without an icon. The `MenuItem` component from `./navigation` must handle `null` icon gracefully — confirmed by the existing behavior of `MONITORING` entry.
**Warning signs:** TypeScript errors if `MenuItem` icon prop is typed as non-nullable.

### Pitfall 3: isActive check for sub-pages
**What goes wrong:** Navigating to `/registry/devices` or `/rooms/status` will not highlight the parent global nav entry because `isActive` uses exact equality (`pathname === path`).
**Why it happens:** Global items use `isActive(item.route)` (exact match), not `pathname.startsWith(item.route)`.
**How to avoid:** This is acceptable UX for now (gap closure scope). If active-state propagation is needed, it requires Navbar.tsx JSX changes — out of scope for a data-layer fix.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="Navbar"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

This phase has no formal requirement IDs (gap closure). The success criteria map as follows:

| Criterion | Behavior | Test Type | Automated Command | File Exists? |
|-----------|----------|-----------|-------------------|-------------|
| SC-1 | /registry/types and /registry/devices reachable from nav | unit | `npm test -- --testPathPattern="Navbar"` | ✅ (Navbar.test.tsx — tests getMobileQuickActions, not global section) |
| SC-2 | /rooms and /rooms/status reachable from nav | unit | `npm test -- --testPathPattern="Navbar"` | ✅ |
| SC-3 | Follows existing menu structure and Ember Noir design | manual | visual check in dev server | N/A |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="Navbar"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

The existing `Navbar.test.tsx` tests only `getMobileQuickActions` — it does not test global section rendering. A new test covering GLOBAL_SECTIONS items appearing in the navigation structure would provide validation coverage for SC-1 and SC-2. However, since the test infrastructure already exists and this is a one-task phase, Wave 0 setup is minimal:

- [ ] Add test assertions to `Navbar.test.tsx` or `deviceRegistry.test.ts` verifying that `getGlobalNavItems()` returns entries for `/registry/types` and `/rooms` — covers SC-1 and SC-2.

## Code Examples

### Complete GLOBAL_SECTIONS Addition
```typescript
// Source: lib/devices/deviceTypes.ts — add to GLOBAL_SECTIONS
export const GLOBAL_SECTIONS: Record<string, GlobalSection> = {
  MONITORING: {
    id: 'monitoring',
    name: 'Monitoring',
    icon: '📊',
    route: '/monitoring',
  },
  REGISTRO: {
    id: 'registry',
    name: 'Registro',
    icon: '📋',
    route: '/registry/types',
  },
  STANZE: {
    id: 'rooms',
    name: 'Stanze',
    icon: '🏠',
    route: '/rooms',
  },
};
```

### Optional: Extend getIconForPath in Navbar.tsx
```typescript
// Source: app/components/Navbar.tsx — getIconForPath function
const getIconForPath = (path: string) => {
  if (path === '/') return <Home className="w-5 h-5" />;
  if (path.includes('scheduler')) return <Calendar className="w-5 h-5" />;
  if (path.includes('errors')) return <AlertCircle className="w-5 h-5" />;
  if (path.includes('log')) return <Clock className="w-5 h-5" />;
  // New entries for v15.0 global sections:
  if (path.startsWith('/registry')) return <span className="text-lg">📋</span>;
  if (path.startsWith('/rooms')) return <span className="text-lg">🏠</span>;
  return null;
};
```

Note: Lucide does not have direct equivalents for registry/rooms concepts. Emoji spans are acceptable and match the pattern used for device icons throughout the codebase. Alternatively, Lucide's `Database` and `LayoutGrid` icons could be used if a Lucide-only approach is preferred.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Adding routes to DEVICE_CONFIG | Use GLOBAL_SECTIONS for non-device pages | Established pattern | Clean separation: devices vs. app sections |
| Desktop nav visible | Desktop nav `hidden` (hamburger only) | Recent UX decision in Navbar.tsx | New entries appear only in hamburger menu — this is correct |

## Open Questions

1. **Should the MONITORING entry be removed or kept?**
   - What we know: `/monitoring` was deleted in quick task 260322-t5k; MONITORING remains in GLOBAL_SECTIONS and would show as a broken link.
   - What's unclear: Whether the stale entry causes any active test failures.
   - Recommendation: Out of scope for this gap-closure phase. Note it in the plan as a known condition but do not touch it. A separate cleanup task can remove it.

2. **Sub-route active state for /registry/devices and /rooms/status?**
   - What we know: `isActive` uses exact equality, so /registry/types is active when on /registry/types but /registry/devices is not.
   - What's unclear: Whether the user expectation is that the nav item is highlighted when on any /registry/* page.
   - Recommendation: Out of scope for gap closure. Exact match is acceptable. Success criteria says "reachable from nav", not "active-highlighted on all sub-routes".

3. **Icons in MenuItem for global items?**
   - What we know: `getIconForPath` returns null for unrecognized paths. `MenuItem` renders fine with null icon (confirmed by MONITORING behavior).
   - What's unclear: Whether the Navbar test file will fail if MenuItem is strict about icon prop type.
   - Recommendation: Verify `MenuItem` props interface allows null/undefined icon. If not, extend `getIconForPath`.

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `lib/devices/deviceTypes.ts` — GLOBAL_SECTIONS interface and existing entries
- Direct code inspection: `lib/devices/deviceRegistry.ts` — getGlobalNavItems(), getNavigationStructureWithPreferences()
- Direct code inspection: `app/components/Navbar.tsx` — full rendering logic including global section loop (lines 551-567)
- Direct code inspection: `app/components/__tests__/Navbar.test.tsx` — existing test scope (getMobileQuickActions only)

### Secondary (MEDIUM confidence)
- App directory listing: confirmed `/registry/types`, `/registry/devices`, `/rooms`, `/rooms/status` pages exist

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, pure data change
- Architecture: HIGH — data flow fully traced from GLOBAL_SECTIONS to Navbar rendering
- Pitfalls: HIGH — identified from direct code inspection (getIconForPath gaps, isActive exact match, stale MONITORING entry)

**Research date:** 2026-03-23
**Valid until:** Stable — changes only if Navbar.tsx rendering loop is restructured
