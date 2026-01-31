# Phase 19: StoveCard Compliance - Research

**Researched:** 2026-01-31
**Domain:** Design System Compliance / Component Refactoring
**Confidence:** HIGH

## Summary

This research investigates how to refactor StoveCard.js (1218 lines) to replace raw HTML elements with design system components. The current implementation uses raw `<button>` elements for mode buttons and "Torna in Automatico" action, and inline Tailwind classes for status styling via the `getStatusInfo()` function.

The design system already provides all necessary components: `Button` with variants (ember, subtle, ghost, danger, outline, success), `Button.Group` for grouped buttons, `StatusCard` for device status display, `HealthIndicator` for health status, and `Badge` with CVA variants. The refactoring is straightforward because:
1. Components exist and are battle-tested in other parts of the app
2. CVA variants already cover the required status states (ember, sage, ocean, warning, danger, neutral)
3. Button.Group provides the grouped layout needed for mode buttons

**Primary recommendation:** Replace raw HTML buttons with Button component using decided variants (subtle for inactive, ember for active mode buttons; ember for "Torna in Automatico"), refactor getStatusInfo() to return CVA variant names, and use StatusCard or HealthIndicator for status display.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | 0.7+ | Type-safe component variants | Already used in all UI components |
| tailwind-merge | 2.0+ | Tailwind class conflict resolution | Part of cn() utility |
| clsx | 2.0+ | Conditional class composition | Part of cn() utility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.300+ | Icons for HealthIndicator | Already imported in HealthIndicator |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| StatusCard | Badge only | Badge is inline, StatusCard is full card context |
| HealthIndicator | Badge with icon | HealthIndicator has semantic role="status" |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Current File Structure
```
app/components/devices/stove/
├── StoveCard.js           # 1218 lines - target of refactoring
└── GlassEffect.js         # Decoration component

app/components/ui/
├── Button.js              # Button, Button.Icon, Button.Group
├── Badge.js               # Badge with CVA variants
├── StatusCard.js          # Extends SmartHomeCard with Badge + ConnectionStatus
├── HealthIndicator.js     # Health status with lucide icons
├── SmartHomeCard.js       # Base device card
└── index.js               # Barrel exports
```

### Pattern 1: Button.Group for Mode Buttons
**What:** Group related buttons with shared visual container
**When to use:** Scheduler mode buttons (Manuale/Automatico/Semi)
**Example:**
```jsx
// Source: /app/components/ui/Button.js
<Button.Group>
  <Button
    variant={currentMode === 'manual' ? 'ember' : 'subtle'}
    aria-pressed={currentMode === 'manual'}
    onClick={() => setMode('manual')}
  >
    Manuale
  </Button>
  <Button
    variant={currentMode === 'auto' ? 'ember' : 'subtle'}
    aria-pressed={currentMode === 'auto'}
    onClick={() => setMode('auto')}
  >
    Automatico
  </Button>
  <Button
    variant={currentMode === 'semi' ? 'ember' : 'subtle'}
    aria-pressed={currentMode === 'semi'}
    onClick={() => setMode('semi')}
  >
    Semi
  </Button>
</Button.Group>
```

### Pattern 2: CVA Variant Mapping for Status
**What:** Map stove states to CVA badge/status variants
**When to use:** Replacing getStatusInfo() inline color classes
**Example:**
```jsx
// Source: Design pattern from existing Badge.js + HealthIndicator.js

// Before: getStatusInfo() returns complex inline classes
// After: Returns simple variant names

const getStatusVariant = (status) => {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s.includes('WORK')) return 'ember';      // In funzione
  if (s.includes('OFF')) return 'neutral';     // Spenta
  if (s.includes('START')) return 'ocean';     // Avvio
  if (s.includes('STANDBY') || s.includes('WAIT')) return 'warning';
  if (s.includes('ERROR') || s.includes('ALARM')) return 'danger';
  if (s.includes('CLEAN')) return 'sage';      // Pulizia
  if (s.includes('MODULATION')) return 'ocean';
  return 'neutral';
};

const getHealthStatus = (status) => {
  if (!status) return 'ok';
  const s = status.toUpperCase();
  if (s.includes('ERROR') || s.includes('ALARM')) return 'error';
  if (s.includes('STANDBY') || s.includes('WAIT')) return 'warning';
  return 'ok';
};
```

### Pattern 3: StatusCard for Device Status Display
**What:** Specialized card with integrated Badge and ConnectionStatus
**When to use:** Displaying stove operational state
**Example:**
```jsx
// Source: /app/components/ui/StatusCard.js
<StatusCard
  icon="🔥"
  title="Stufa"
  colorTheme="ember"
  status={statusLabel}
  statusVariant={getStatusVariant(status)}
  connectionStatus={isFirebaseConnected ? 'online' : 'offline'}
>
  <HealthIndicator status={getHealthStatus(status)} />
</StatusCard>
```

### Anti-Patterns to Avoid
- **Inline color classes for status:** Use CVA variants instead of building dynamic class strings
- **Raw button elements:** Always use Button component for interactive actions
- **Manual aria-pressed handling:** Use aria-pressed prop on Button component
- **Custom loading spinners:** Use Button's built-in loading prop

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode button group | Custom flex container | Button.Group | Handles gap, role="group" |
| Active mode styling | Conditional className | Button variant prop | Type-safe, consistent |
| Status colors | Dynamic Tailwind classes | Badge/HealthIndicator variants | CVA handles dark/light mode |
| Loading states | Custom spinner | Button loading prop | Consistent animation |
| Accessibility | Manual aria- attributes | Button component props | Built-in focus ring, disabled handling |

**Key insight:** The design system components already handle all edge cases including dark/light mode transitions (`[html:not(.dark)_&]:...` pattern), focus states, and accessibility. Custom solutions would need to replicate this complexity.

## Common Pitfalls

### Pitfall 1: Button Group Width
**What goes wrong:** Button.Group takes natural width, may not fill container
**Why it happens:** Default is `flex items-center gap-2`
**How to avoid:** Add `className="w-full"` to Button.Group and `fullWidth` to each Button if needed
**Warning signs:** Buttons appear squished or don't align with other content

### Pitfall 2: Variant Mismatch with Active State
**What goes wrong:** Active button uses same variant as inactive, no visual distinction
**Why it happens:** Forgot to swap variant based on state
**How to avoid:**
```jsx
variant={isActive ? 'ember' : 'subtle'}
```
**Warning signs:** Can't tell which mode is currently selected

### Pitfall 3: Missing aria-pressed for Toggle Buttons
**What goes wrong:** Screen readers don't announce button state
**Why it happens:** Using Button as toggle without accessibility attribute
**How to avoid:** Add `aria-pressed={isActive}` to each mode button
**Warning signs:** Accessibility audit failures

### Pitfall 4: getStatusInfo() Partial Refactoring
**What goes wrong:** Function still returns inline classes mixed with variant names
**Why it happens:** Incremental refactoring leaves hybrid state
**How to avoid:** Completely replace return structure with variant-based object
**Warning signs:** Some status states use CVA, others don't

### Pitfall 5: StatusCard vs SmartHomeCard Confusion
**What goes wrong:** Using wrong component for the use case
**Why it happens:** Both extend Card, names are similar
**How to avoid:**
- StatusCard = read-only status display (what CONTEXT.md decided)
- SmartHomeCard = interactive device card with controls
**Warning signs:** Missing status badge, wrong layout

## Code Examples

Verified patterns from official sources:

### Mode Button Group Implementation
```jsx
// Source: /app/components/ui/Button.js - Button.Group pattern
// Applied to StoveCard mode buttons per CONTEXT.md decisions

function ModeButtonGroup({ schedulerEnabled, semiManualMode, onModeChange }) {
  const getMode = () => {
    if (!schedulerEnabled) return 'manual';
    if (semiManualMode) return 'semi';
    return 'auto';
  };

  const currentMode = getMode();

  return (
    <Button.Group className="w-full">
      <Button
        variant={currentMode === 'manual' ? 'ember' : 'subtle'}
        aria-pressed={currentMode === 'manual'}
        onClick={() => onModeChange('manual')}
        size="sm"
      >
        Manuale
      </Button>
      <Button
        variant={currentMode === 'auto' ? 'ember' : 'subtle'}
        aria-pressed={currentMode === 'auto'}
        onClick={() => onModeChange('auto')}
        size="sm"
      >
        Automatico
      </Button>
      <Button
        variant={currentMode === 'semi' ? 'ember' : 'subtle'}
        aria-pressed={currentMode === 'semi'}
        onClick={() => onModeChange('semi')}
        size="sm"
      >
        Semi
      </Button>
    </Button.Group>
  );
}
```

### Torna in Automatico Button
```jsx
// Source: /app/components/ui/Button.js
// Per CONTEXT.md: uses ember variant

{schedulerEnabled && semiManualMode && (
  <Button
    variant="ember"
    onClick={handleClearSemiManual}
    size="sm"
  >
    Torna in Automatico
  </Button>
)}
```

### Status Variant Helper
```jsx
// Refactored getStatusInfo() to return CVA variants
// Source: /app/components/ui/Badge.js variants

const getStatusDisplay = (status) => {
  if (!status) {
    return {
      label: 'CARICAMENTO...',
      icon: '⏳',
      variant: 'neutral',
      pulse: true,
      health: 'ok'
    };
  }

  const s = status.toUpperCase();

  if (s.includes('WORK')) {
    return {
      label: 'IN FUNZIONE',
      icon: '🔥',
      variant: 'ember',
      pulse: true,
      health: 'ok'
    };
  }

  if (s.includes('OFF')) {
    return {
      label: 'SPENTA',
      icon: '❄️',
      variant: 'neutral',
      pulse: false,
      health: 'ok'
    };
  }

  if (s.includes('START')) {
    return {
      label: 'AVVIO IN CORSO',
      icon: '🚀',
      variant: 'ocean',
      pulse: true,
      health: 'ok'
    };
  }

  if (s.includes('STANDBY') || s.includes('WAIT')) {
    return {
      label: 'IN ATTESA',
      icon: '💤',
      variant: 'warning',
      pulse: true,
      health: 'warning'
    };
  }

  if (s.includes('ERROR') || s.includes('ALARM')) {
    return {
      label: 'ERRORE',
      icon: '⚠️',
      variant: 'danger',
      pulse: true,
      health: 'error'
    };
  }

  if (s.includes('CLEAN')) {
    return {
      label: 'PULIZIA',
      icon: '🔄',
      variant: 'sage',
      pulse: true,
      health: 'ok'
    };
  }

  if (s.includes('MODULATION')) {
    return {
      label: 'MODULAZIONE',
      icon: '🌡️',
      variant: 'ocean',
      pulse: true,
      health: 'ok'
    };
  }

  // Default
  return {
    label: status.toUpperCase(),
    icon: '❔',
    variant: 'neutral',
    pulse: false,
    health: 'ok'
  };
};
```

### Status Display with HealthIndicator
```jsx
// Source: /app/components/ui/HealthIndicator.js + Badge.js

const statusDisplay = getStatusDisplay(status);

<div className="flex items-center gap-3">
  <Badge variant={statusDisplay.variant} pulse={statusDisplay.pulse}>
    {statusDisplay.label}
  </Badge>
  <HealthIndicator
    status={statusDisplay.health}
    size="sm"
  />
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `<button>` elements | Button component with CVA | Design System v3.0 | Consistent styling, accessibility |
| Inline Tailwind for status | Badge/HealthIndicator variants | Design System v3.0 | Type-safe, dark mode support |
| Custom flex groups | Button.Group | Design System v3.0 | Semantic role="group" |

**Deprecated/outdated:**
- StovePanel.js: Marked deprecated at top of file, superseded by StoveCard.js
- Manual aria- attribute handling: Button component handles accessibility internally
- `getStatusBgColor()`, `getStatusColor()`: Legacy functions, replaced by CVA variants

## Open Questions

Things that couldn't be fully resolved:

1. **Button size decision**
   - What we know: CONTEXT.md says "Claude's Discretion - Button size (sm vs md)"
   - What's unclear: Current mode indicator area might be space-constrained
   - Recommendation: Use `sm` for mode buttons (consistent with scheduler page), `md` for "Torna in Automatico" (more prominent action)

2. **StatusCard integration depth**
   - What we know: CONTEXT.md decides to use StatusCard for stove state display
   - What's unclear: Whether to wrap entire current status display or just the badge area
   - Recommendation: Use StatusCard for header + status badge, keep existing elaborate visual design for main status area

3. **Loading state during mode switch**
   - What we know: CONTEXT.md says "Claude's Discretion - Loading state feedback"
   - What's unclear: Whether to disable entire Button.Group or show spinner in active button
   - Recommendation: Disable entire Button.Group during mode switch to prevent race conditions

4. **Temperature/power display typography**
   - What we know: Current uses Text component with custom sizing
   - What's unclear: Whether to standardize with Heading component
   - Recommendation: Preserve current Text usage - it's already using design system component

## Sources

### Primary (HIGH confidence)
- `/app/components/ui/Button.js` - Button, Button.Icon, Button.Group implementation
- `/app/components/ui/Badge.js` - CVA variant definitions (ember, sage, ocean, warning, danger, neutral)
- `/app/components/ui/HealthIndicator.js` - Health status component with ok/warning/error/critical
- `/app/components/ui/StatusCard.js` - Specialized device status card
- `/app/components/ui/SmartHomeCard.js` - Base device card with namespace components
- `/app/components/devices/stove/StoveCard.js` - Current implementation to refactor

### Secondary (MEDIUM confidence)
- `/app/stove/scheduler/page.js` - Example of Button usage with mode switching
- `/docs/design-system.md` - Design system documentation

### Tertiary (LOW confidence)
- None - all patterns verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already exist in codebase
- Architecture: HIGH - Patterns directly observed from existing components
- Pitfalls: HIGH - Based on actual component implementations

**Research date:** 2026-01-31
**Valid until:** 60 days (stable internal components, no external dependencies)
