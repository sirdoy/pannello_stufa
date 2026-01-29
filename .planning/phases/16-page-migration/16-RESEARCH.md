# Phase 16: Page Migration & Application - Research

**Researched:** 2026-01-29
**Domain:** Design system application to Next.js pages (migration from custom styling to design system components)
**Confidence:** HIGH

## Summary

Phase 16 is a migration phase applying the design system built in Phases 11-15 to all 10 application pages. The codebase analysis reveals significant variation in current page implementations - some pages (Dashboard, Stove) already use many design system components, while others (Lights, Settings) use extensive custom styling. The migration scope involves replacing inline styles, custom Tailwind classes, and one-off components with design system equivalents.

Key findings:
1. **Partial migration already exists** - Dashboard page uses Section, Grid, Text, Card components; Stove page uses Card, Button, Banner, Heading, Text
2. **Significant custom styling remains** - Lights page has ~200 lines of custom button/card styling; Thermostat has custom mode button classes
3. **Consistent patterns available** - All required components exist in `app/components/ui/`: PageLayout, Section, Grid, SmartHomeCard, DeviceCard, StatusCard, Badge, Button, etc.
4. **Testing infrastructure in place** - jest-axe configured, component tests use established patterns

**Primary recommendation:** Follow page-by-page migration with shared components first. Use PageLayout for page structure, Section for content organization, Grid for layouts, and replace all custom styling with design system component variants.

---

## Standard Stack

### Core (Already Installed - No Installation Needed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| class-variance-authority | ^0.7.1 | Type-safe component variants | Used in all UI components |
| clsx | ^2.1.1 | Conditional className construction | Used in cn() |
| tailwind-merge | ^3.4.0 | Tailwind class conflict resolution | Used in cn() |
| @testing-library/react | ^16.1.0 | Component testing | Configured |
| jest-axe | ^10.0.0 | Automated accessibility testing | Configured in jest.setup.js |
| lucide-react | ^0.562.0 | Icons | Used throughout |

### No Installation Required

All dependencies are already available. This phase is purely migration, no new libraries.

---

## Architecture Patterns

### Current Page Structure Inventory

| Page | File | Design System Usage | Custom Styling | Migration Effort |
|------|------|---------------------|----------------|-----------------|
| Dashboard | app/page.js | HIGH - Section, Grid, Card, Text | LOW - minimal | LOW |
| Stove | app/stove/page.js | HIGH - Card, Button, Banner, Heading, Text | MEDIUM - theme colors, gradients | MEDIUM |
| Thermostat | app/thermostat/page.js | MEDIUM - Card, Button, Heading, Text | HIGH - custom mode buttons, inline styles | HIGH |
| Lights | app/lights/page.js | MEDIUM - Card, Button, Banner, Heading, Text | HIGH - custom pairing UI, range sliders | HIGH |
| Camera | (TBD) | TBD | TBD | TBD |
| Monitoring | app/monitoring/page.js | LOW - Heading, Text, Button | HIGH - external components, manual layout | MEDIUM |
| Notifications Settings | app/settings/notifications/page.js | MEDIUM - Card, Button, Heading, Text | MEDIUM - form sections | MEDIUM |
| Settings | app/settings/* | VARIES | VARIES | MEDIUM |
| Schedule | app/schedule/page.js | HIGH - Card, Button, Heading, Text | LOW | LOW |
| Admin/Debug | app/debug/* | MEDIUM | MEDIUM | LOW |

### Pattern 1: PageLayout Migration

**What:** Replace custom page wrappers with PageLayout component
**When to use:** Every page migration
**Source:** app/components/ui/PageLayout.js

```javascript
// BEFORE - Custom page structure
export default function SomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Page Title</h1>
        <p className="text-slate-400">Description</p>
      </div>
      {/* content */}
    </div>
  );
}

// AFTER - PageLayout component
import { PageLayout, PageHeader } from '@/app/components/ui';

export default function SomePage() {
  return (
    <PageLayout
      header={
        <PageHeader
          title="Page Title"
          description="Description"
          actions={<Button>Action</Button>}
        />
      }
    >
      {/* content */}
    </PageLayout>
  );
}
```

### Pattern 2: Section for Content Organization

**What:** Replace manual section headings with Section component
**When to use:** Any content grouping with title/description
**Source:** app/components/ui/Section.js

```javascript
// BEFORE
<div className="mb-8">
  <h2 className="text-2xl font-bold mb-2">Section Title</h2>
  <p className="text-slate-400 mb-4">Description</p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* content */}
  </div>
</div>

// AFTER
<Section
  title="Section Title"
  description="Description"
  spacing="md"
>
  <Grid cols={2} gap="md">
    {/* content */}
  </Grid>
</Section>
```

### Pattern 3: Grid for Layouts

**What:** Replace manual grid classes with Grid component
**When to use:** Any responsive grid layout
**Source:** app/components/ui/Grid.js

```javascript
// BEFORE
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

// AFTER
<Grid cols={3} gap="md">

// CVA variants available:
// cols: 1, 2, 3, 4, 5, 6 (auto-responsive)
// gap: none, sm, md, lg
```

### Pattern 4: Custom Button Replacement

**What:** Replace custom button styling with Button variants
**When to use:** All interactive buttons
**Source:** app/components/ui/Button.js, CONTEXT.md prior decisions

```javascript
// BEFORE (from thermostat page)
<button
  onClick={() => handleModeChange('schedule')}
  className={getModeButtonClasses(mode, 'schedule')}
>
  <span>Clock</span>
  <span>Programmato</span>
</button>

// AFTER
<Button
  variant={mode === 'schedule' ? 'sage' : 'subtle'}
  onClick={() => handleModeChange('schedule')}
  icon="clock"
>
  Programmato
</Button>

// Button variants from prior decisions:
// ember (primary), subtle (secondary/glass), ghost, success, danger, ocean, outline
```

### Pattern 5: Form Controls Standardization

**What:** Replace custom inputs with design system form components
**When to use:** Settings pages, form fields
**Source:** app/components/ui/ (Input, Select, Switch, Checkbox, Slider)

```javascript
// BEFORE
<input
  type="range"
  min="1"
  max="100"
  value={brightness}
  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-warning-500"
/>

// AFTER
<Slider
  value={brightness}
  min={1}
  max={100}
  onChange={handleBrightnessChange}
/>
```

### Pattern 6: Status Display with Badge/StatusCard

**What:** Replace inline status styling with Badge/StatusCard
**When to use:** Device status indicators, connection status
**Source:** app/components/ui/Badge.js, StatusCard.js

```javascript
// BEFORE (from lights page)
{isOn && (
  <div className="px-3 py-1 bg-warning-500 text-white text-xs font-bold rounded-full">
    ACCESO
  </div>
)}

// AFTER
<Badge variant={isOn ? 'ember' : 'neutral'} pulse={isOn}>
  {isOn ? 'ACCESO' : 'SPENTO'}
</Badge>
```

### Anti-Patterns to Avoid

- **Partial migration:** Complete one page fully before moving to next (per CONTEXT.md)
- **Preserving custom styling:** Remove ALL inline styles and one-off Tailwind classes
- **Creating new patterns:** Use existing design system components, don't extend during migration
- **Mixing old/new:** Fully convert each component group before committing
- **Ignoring mobile:** Always test responsive behavior during migration

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page structure | Custom `<div>` wrappers | PageLayout | Consistent max-width, padding, header slots |
| Content sections | Manual heading + spacing | Section | Consistent typography, ember accent bar |
| Responsive grids | Manual `grid-cols-*` classes | Grid | Auto-responsive, CVA variants |
| Status indicators | Inline badge styles | Badge | Consistent pulse, variants, accessibility |
| Loading states | Custom spinners | Spinner, LoadingOverlay | Consistent animation, aria attributes |
| Form styling | Custom input classes | Input, Select, Switch, Checkbox, Slider | Consistent focus states, theming |
| Card layouts | Custom card borders | Card, SmartHomeCard | Consistent shadows, glass effect |

**Key insight:** This phase is purely about applying existing components. Any temptation to "improve" a component should be deferred to a future phase.

---

## Common Pitfalls

### Pitfall 1: Inconsistent Commit Boundaries

**What goes wrong:** Partial page migrations committed, breaking visual consistency
**Why it happens:** Rushing to commit progress
**How to avoid:** Follow CONTEXT.md rule: one commit per component group within each page
**Warning signs:** Mix of old/new styling visible in same page area

### Pitfall 2: Missing Grid Responsive Breakpoints

**What goes wrong:** Grid uses fixed columns that don't match previous responsive behavior
**Why it happens:** Grid cols prop has predefined breakpoints that may differ from original
**How to avoid:** Verify responsive behavior at all breakpoints before committing
**Warning signs:** Layout breaks at specific screen sizes

### Pitfall 3: Button Variant Mismatch

**What goes wrong:** Using wrong variant for button context (e.g., ember for secondary actions)
**Why it happens:** Not following prior decisions
**How to avoid:** Review prior decisions - ember=primary, subtle=secondary
**Warning signs:** Visual hierarchy confusion, too many ember buttons

### Pitfall 4: Form Component State Loss

**What goes wrong:** Migrating form inputs breaks controlled component behavior
**Why it happens:** Design system components may have different prop APIs
**How to avoid:** Verify value/onChange props match component expectations
**Warning signs:** Form values not updating, inputs not controlled

### Pitfall 5: Accessibility Regression

**What goes wrong:** Migration removes aria attributes present in original code
**Why it happens:** Focus on visual migration, ignoring accessibility
**How to avoid:** Run jest-axe tests for each migrated page (per CONTEXT.md)
**Warning signs:** axe violations in test output

### Pitfall 6: Custom Theme Colors Lost

**What goes wrong:** Page-specific color theming (like Stove's volcanic gradient) lost
**Why it happens:** Over-standardizing to design system defaults
**How to avoid:** Functional variations OK per CONTEXT.md - preserve page-specific theming
**Warning signs:** All pages look identical, losing device personality

---

## Code Examples

### Complete Page Migration Template

```javascript
// BEFORE - Typical page structure
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SomePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { /* fetch data */ }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-slate-400">
          Back
        </button>
        <h1 className="text-3xl font-bold mt-2">Page Title</h1>
        <p className="text-slate-400">Description here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map(item => (
          <div key={item.id} className="p-6 bg-slate-900 border border-slate-700 rounded-2xl">
            <h3 className="font-bold">{item.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// AFTER - Using design system
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageLayout,
  Section,
  Grid,
  Card,
  CardContent,
  Button,
  Heading,
  Text,
  Skeleton,
  Banner,
} from '@/app/components/ui';

export default function SomePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { /* fetch data */ }, []);

  if (loading) {
    return (
      <PageLayout>
        <Skeleton className="h-32 rounded-2xl" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={
        <PageLayout.Header>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Heading level={1} size="3xl" className="mt-2">
            Page Title
          </Heading>
          <Text variant="secondary">
            Description here
          </Text>
        </PageLayout.Header>
      }
    >
      {error && (
        <Banner
          variant="error"
          title="Error"
          description={error}
          className="mb-6"
        />
      )}

      <Section spacing="md">
        <Grid cols={3} gap="md">
          {data?.items.map(item => (
            <Card key={item.id}>
              <CardContent>
                <Heading level={3} size="md">
                  {item.name}
                </Heading>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Section>
    </PageLayout>
  );
}
```

### Mode Button Migration (Thermostat)

```javascript
// BEFORE - Custom getModeButtonClasses function
const getModeButtonClasses = (currentMode, targetMode) => {
  const baseClasses = 'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2';
  const isActive = currentMode === targetMode;
  const activeStyles = {
    schedule: 'bg-sage-500/20 text-sage-300 border border-sage-500/40',
    away: 'bg-warning-500/20 text-warning-300 border border-warning-500/40',
    hg: 'bg-ocean-500/20 text-ocean-300 border border-ocean-500/40',
    off: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
  };
  const inactiveStyle = 'bg-white/[0.05] text-slate-300 border border-white/10 hover:bg-white/[0.10]';
  return `${baseClasses} ${isActive ? activeStyles[targetMode] : inactiveStyle}`;
};

// AFTER - Using Button variants
const modeVariants = {
  schedule: 'sage',
  away: 'warning',
  hg: 'ocean',
  off: 'subtle',
};

<div className="flex flex-wrap gap-2">
  {['schedule', 'away', 'hg', 'off'].map((targetMode) => (
    <Button
      key={targetMode}
      variant={mode === targetMode ? modeVariants[targetMode] : 'ghost'}
      onClick={() => handleModeChange(targetMode)}
      icon={modeIcons[targetMode]}
    >
      {modeLabels[targetMode]}
    </Button>
  ))}
</div>
```

### Slider Migration (Lights)

```javascript
// BEFORE - Native range with custom styling
<input
  type="range"
  min="1"
  max="100"
  value={brightness}
  onChange={(e) => handleBrightnessChange(groupedLightId, e.target.value)}
  disabled={refreshing}
  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-warning-500"
/>

// AFTER - Slider component
<Slider
  value={[brightness]}
  min={1}
  max={100}
  step={1}
  onValueChange={([value]) => handleBrightnessChange(groupedLightId, value)}
  disabled={refreshing}
/>
```

### Page Test Pattern

```javascript
// __tests__/pages/somePage.test.js
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SomePage from '../page';

// Mock necessary providers/hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

expect.extend(toHaveNoViolations);

describe('SomePage', () => {
  describe('Accessibility', () => {
    it('has no a11y violations', async () => {
      const { container } = render(<SomePage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Key Interactions', () => {
    it('renders main content', () => {
      render(<SomePage />);
      expect(screen.getByRole('heading', { name: /page title/i })).toBeInTheDocument();
    });

    // Add tests for key buttons, forms, navigation
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Custom `<div>` wrappers | PageLayout component | Consistent structure |
| Manual grid classes | Grid CVA component | Auto-responsive |
| Inline heading styles | Heading/Text components | Consistent typography |
| Custom button styling | Button variants | Consistent interactions |
| Native form inputs | Input/Select/Slider | Consistent focus/theming |
| Inline status badges | Badge component | Consistent indicators |
| Manual spacing | Section component | Consistent rhythm |

**Key insight:** The design system is comprehensive. Every visual element has a component equivalent. Migration is straightforward replacement.

---

## Migration Order

Based on CONTEXT.md decisions and page analysis:

### Phase 1: Shared Components
1. Migrate header/navigation (affects all pages)
2. Verify shared state providers work with new components

### Phase 2: High-Traffic Pages
1. **Dashboard** (app/page.js) - Already mostly migrated, minimal work
2. **Stove** (app/stove/page.js) - Mostly migrated, complete gradient theming
3. **Thermostat** (app/thermostat/page.js) - Medium effort, mode buttons need conversion
4. **Lights** (app/lights/page.js) - High effort, significant custom styling

### Phase 3: Supporting Pages
5. **Camera** - TBD based on current implementation
6. **Monitoring** (app/monitoring/page.js) - Medium effort
7. **Notifications** (app/settings/notifications/page.js) - Medium effort

### Phase 4: Settings & Admin
8. **Settings** (app/settings/*) - Multiple pages
9. **Schedule** (app/schedule/page.js) - Low effort
10. **Admin/Debug** (app/debug/*) - Low effort

### Phase 5: Verification
- design-system page migration to PageLayout (meta-verification)

---

## Open Questions

### 1. Stove Page Volcanic Theming

**What we know:** Stove page has dynamic theme colors based on status
**What's unclear:** Should this become a PageLayout variant or remain page-specific?
**Recommendation:** Keep as page-specific - functional variation per CONTEXT.md

### 2. Lights Page Pairing Flow

**What we know:** Complex multi-step pairing flow with custom UI
**What's unclear:** How to maintain flow state with standardized components
**Recommendation:** Use existing components (Banner, Button) but preserve flow logic

### 3. Monitoring External Components

**What we know:** Monitoring page uses external components (ConnectionStatusCard, DeadManSwitchPanel)
**What's unclear:** Whether these should be migrated to design system or kept separate
**Recommendation:** Migrate internal structure but may need separate task for component internals

---

## Sources

### Primary (HIGH confidence)

- Existing codebase analysis (app/page.js, app/stove/page.js, app/thermostat/page.js, app/lights/page.js, etc.)
- app/components/ui/*.js - All design system components verified
- Phase 15 RESEARCH.md - Component patterns and conventions
- CONTEXT.md - Migration strategy decisions

### Secondary (MEDIUM confidence)

- docs/design-system.md - Design system documentation
- Component test files - Testing patterns

### Tertiary (LOW confidence)

- External monitoring components - May need deeper analysis

---

## Metadata

**Confidence breakdown:**
- Component availability: HIGH - All components verified in codebase
- Migration patterns: HIGH - Clear before/after examples from existing code
- Testing approach: HIGH - jest-axe configured, patterns established
- Migration order: HIGH - Based on CONTEXT.md decisions
- Edge cases (Stove theming, Lights pairing): MEDIUM - May need adjustment during implementation

**Research date:** 2026-01-29
**Valid until:** 60 days (internal migration, stable patterns)
