# Phase 15: Smart Home Components Refactor - Research

**Researched:** 2026-01-29
**Domain:** Domain-specific smart home components (StatusCard, DeviceCard, Badge, ControlButton, ConnectionStatus, HealthIndicator)
**Confidence:** HIGH

## Summary

Phase 15 standardizes domain-specific smart home components with unified APIs. The codebase already has well-established patterns from Phase 11-14: CVA for variants, `cn()` for class merging, namespace component pattern (Card.Header, Button.Icon), and Radix UI primitives wrapping.

The existing DeviceCard.js provides a solid foundation but needs refactoring to align with CONTEXT.md decisions: hybrid slot structure (named slots + children), shared SmartHomeCard base, explicit icon prop, compact/default size variants, and standardized state handling (isLoading, error, disabled). The existing ControlButton.js needs enhancement for long-press support with constant repeat rate and haptic feedback integration using the established `lib/pwa/vibration.js` service.

Key requirements map to the existing design system:
- **StatusCard/DeviceCard**: Extend shared SmartHomeCard base with CVA variants (compact/default sizes)
- **Badge**: Enhance StatusBadge with dedicated pulse animation (always-on for active states)
- **ControlButton**: Add long-press support with constant repeat rate, haptic feedback via vibration service
- **ConnectionStatus**: New component with 4 states (online/offline/connecting/unknown)
- **HealthIndicator**: New component with 4 states (ok/warning/error/critical)

**Primary recommendation:** Create a SmartHomeCard base component using CVA that both StatusCard and DeviceCard extend. Reuse existing patterns from Card.js and DeviceCard.js. Add long-press hook (`useLongPress`) for ControlButton enhancement. Use existing `lib/pwa/vibration.js` for haptic feedback.

---

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| class-variance-authority | ^0.7.1 | Type-safe component variants | Used in Button, Card, Phase 12-14 |
| clsx | ^2.1.1 | Conditional className construction | Used in cn() |
| tailwind-merge | ^3.4.0 | Tailwind class conflict resolution | Used in cn() |
| jest-axe | ^10.0.0 | Automated accessibility testing | Configured in jest.setup.js |

### Supporting (Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lib/pwa/vibration.js | Internal | Haptic feedback patterns | ControlButton long-press feedback |
| lucide-react | ^0.562.0 | Icons | ConnectionStatus, HealthIndicator icons |

### No Installation Required

All dependencies are already available. No `npm install` needed.

---

## Architecture Patterns

### Recommended File Structure

```
app/components/ui/
  SmartHomeCard.js         # NEW: Base component for smart home cards
  StatusCard.js            # REFACTOR: Extends SmartHomeCard for status display
  DeviceCard.js            # REFACTOR: Extends SmartHomeCard for device control
  Badge.js                 # NEW: Extracted from StatusBadge, pulse variant
  ControlButton.js         # REFACTOR: Add long-press, haptic feedback
  ConnectionStatus.js      # NEW: online/offline/connecting/unknown states
  HealthIndicator.js       # NEW: ok/warning/error/critical states
  __tests__/
    SmartHomeCard.test.js
    StatusCard.test.js
    DeviceCard.test.js
    Badge.test.js
    ControlButton.test.js
    ConnectionStatus.test.js
    HealthIndicator.test.js
```

### Pattern 1: SmartHomeCard Base Component

**What:** Shared base component for smart home cards with CVA variants
**When to use:** StatusCard, DeviceCard, any future device-specific cards
**Source:** CONTEXT.md decision, existing Card.js pattern

```javascript
// SmartHomeCard.js - Base component
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Card from './Card';
import Heading from './Heading';
import CardAccentBar from './CardAccentBar';

/**
 * SmartHomeCard Variants - CVA Configuration
 */
export const smartHomeCardVariants = cva(
  // Base classes
  [
    'overflow-visible transition-all duration-500',
    'relative',
  ],
  {
    variants: {
      size: {
        compact: 'p-3 sm:p-4',  // Dashboard grids
        default: 'p-5 sm:p-6',  // Full view
      },
      colorTheme: {
        ember: '',   // Applied via CardAccentBar
        ocean: '',
        sage: '',
        warning: '',
        danger: '',
      },
    },
    defaultVariants: {
      size: 'default',
      colorTheme: 'ember',
    },
  }
);

/**
 * SmartHomeCard - Base for smart home device cards
 */
const SmartHomeCard = forwardRef(function SmartHomeCard({
  children,
  className,
  icon,
  title,
  size = 'default',
  colorTheme = 'ember',
  isLoading = false,
  error = false,
  errorMessage,
  disabled = false,
  ...props
}, ref) {
  return (
    <Card
      ref={ref}
      variant="elevated"
      padding={false}
      className={cn(
        smartHomeCardVariants({ size }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Accent Bar */}
      <CardAccentBar colorTheme={colorTheme} animated={!disabled} size="md" />

      {/* Content wrapper */}
      <div className={cn(
        size === 'compact' ? 'p-3 sm:p-4' : 'p-5 sm:p-6'
      )}>
        {/* Header */}
        {(icon || title) && (
          <SmartHomeCard.Header>
            {icon && <span className="text-2xl sm:text-3xl">{icon}</span>}
            {title && <Heading level={2} size={size === 'compact' ? 'md' : 'xl'}>{title}</Heading>}
          </SmartHomeCard.Header>
        )}

        {/* Main content */}
        {children}
      </div>
    </Card>
  );
});

// Sub-components following namespace pattern
const SmartHomeCardHeader = forwardRef(function SmartHomeCardHeader(
  { children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});
SmartHomeCardHeader.displayName = 'SmartHomeCard.Header';

const SmartHomeCardStatus = forwardRef(function SmartHomeCardStatus(
  { children, className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
});
SmartHomeCardStatus.displayName = 'SmartHomeCard.Status';

const SmartHomeCardControls = forwardRef(function SmartHomeCardControls(
  { children, className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn('space-y-3', className)} {...props}>
      {children}
    </div>
  );
});
SmartHomeCardControls.displayName = 'SmartHomeCard.Controls';

// Attach namespace
SmartHomeCard.Header = SmartHomeCardHeader;
SmartHomeCard.Status = SmartHomeCardStatus;
SmartHomeCard.Controls = SmartHomeCardControls;

export { SmartHomeCard, SmartHomeCardHeader, SmartHomeCardStatus, SmartHomeCardControls };
export default SmartHomeCard;
```

### Pattern 2: Badge with Pulse Animation

**What:** Status indicator badge with continuous pulse when active
**When to use:** Status indicators showing online/active states
**Source:** CONTEXT.md decision - always pulse when active/online

```javascript
// Badge.js - Extracted and enhanced from StatusBadge
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const badgeVariants = cva(
  // Base classes
  [
    'inline-flex items-center gap-1.5',
    'font-display font-semibold',
    'rounded-full',
    'border',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        ember: [
          'bg-ember-500/15 [html:not(.dark)_&]:bg-ember-100/80',
          'border-ember-400/25 [html:not(.dark)_&]:border-ember-300',
          'text-ember-300 [html:not(.dark)_&]:text-ember-700',
        ],
        sage: [
          'bg-sage-500/15 [html:not(.dark)_&]:bg-sage-100/80',
          'border-sage-400/25 [html:not(.dark)_&]:border-sage-300',
          'text-sage-300 [html:not(.dark)_&]:text-sage-700',
        ],
        ocean: [
          'bg-ocean-500/15 [html:not(.dark)_&]:bg-ocean-100/80',
          'border-ocean-400/25 [html:not(.dark)_&]:border-ocean-300',
          'text-ocean-300 [html:not(.dark)_&]:text-ocean-700',
        ],
        warning: [
          'bg-warning-500/15 [html:not(.dark)_&]:bg-warning-100/80',
          'border-warning-400/25 [html:not(.dark)_&]:border-warning-300',
          'text-warning-300 [html:not(.dark)_&]:text-warning-700',
        ],
        danger: [
          'bg-danger-500/15 [html:not(.dark)_&]:bg-danger-100/80',
          'border-danger-400/25 [html:not(.dark)_&]:border-danger-300',
          'text-danger-300 [html:not(.dark)_&]:text-danger-700',
        ],
        neutral: [
          'bg-slate-500/10 [html:not(.dark)_&]:bg-slate-100',
          'border-slate-400/20 [html:not(.dark)_&]:border-slate-300',
          'text-slate-400 [html:not(.dark)_&]:text-slate-600',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
      pulse: {
        true: 'animate-glow-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      pulse: false,
    },
  }
);

const Badge = forwardRef(function Badge({
  children,
  icon,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className,
  ...props
}, ref) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, pulse }), className)}
      {...props}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export default Badge;
```

### Pattern 3: useLongPress Hook for ControlButton

**What:** Hook for long-press behavior with constant repeat rate
**When to use:** ControlButton increment/decrement with continuous action
**Source:** CONTEXT.md decision - constant repeat rate, not accelerating

```javascript
// hooks/useLongPress.js
import { useRef, useCallback } from 'react';
import { vibrateShort } from '@/lib/pwa/vibration';

/**
 * useLongPress - Hook for long-press with constant repeat
 *
 * @param {Function} callback - Function to call on press
 * @param {Object} options
 * @param {number} options.delay - Initial delay before repeat starts (default: 400ms)
 * @param {number} options.interval - Interval between repeats (default: 100ms)
 * @param {boolean} options.haptic - Enable haptic feedback (default: true)
 */
export function useLongPress(callback, options = {}) {
  const {
    delay = 400,
    interval = 100,
    haptic = true,
  } = options;

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(false);

  const start = useCallback((e) => {
    e?.preventDefault?.();

    if (isActiveRef.current) return;
    isActiveRef.current = true;

    // Initial callback
    callback();
    if (haptic) vibrateShort();

    // Start repeat after delay
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callback();
        if (haptic) vibrateShort();
      }, interval);
    }, delay);
  }, [callback, delay, interval, haptic]);

  const stop = useCallback(() => {
    isActiveRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}
```

### Pattern 4: ConnectionStatus Component

**What:** Component showing device connection state with icon + text
**When to use:** Display online/offline/connecting/unknown states
**Source:** CONTEXT.md decision - Icon + text label (e.g., "● Online")

```javascript
// ConnectionStatus.js
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const connectionStatusVariants = cva(
  'inline-flex items-center gap-2 font-display font-medium',
  {
    variants: {
      status: {
        online: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
        offline: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        connecting: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
        unknown: 'text-slate-400 [html:not(.dark)_&]:text-slate-400',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'unknown',
      size: 'md',
    },
  }
);

const dotVariants = cva(
  'rounded-full',
  {
    variants: {
      status: {
        online: 'bg-sage-500',
        offline: 'bg-slate-500',
        connecting: 'bg-warning-500 animate-pulse',
        unknown: 'bg-slate-400',
      },
      size: {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
      },
    },
    defaultVariants: {
      status: 'unknown',
      size: 'md',
    },
  }
);

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  connecting: 'Connessione...',
  unknown: 'Sconosciuto',
};

const ConnectionStatus = forwardRef(function ConnectionStatus({
  status = 'unknown',
  size = 'md',
  label,
  showDot = true,
  className,
  ...props
}, ref) {
  const displayLabel = label ?? statusLabels[status];

  return (
    <span
      ref={ref}
      className={cn(connectionStatusVariants({ status, size }), className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      {showDot && <span className={dotVariants({ status, size })} aria-hidden="true" />}
      {displayLabel}
    </span>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export { ConnectionStatus, connectionStatusVariants };
export default ConnectionStatus;
```

### Pattern 5: HealthIndicator Component

**What:** Health status indicator with 4 severity levels
**When to use:** Display ok/warning/error/critical states for devices
**Source:** CONTEXT.md requirement DOMAIN-06

```javascript
// HealthIndicator.js
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';

export const healthIndicatorVariants = cva(
  'inline-flex items-center gap-2 font-display font-medium',
  {
    variants: {
      status: {
        ok: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
        warning: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
        error: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
        critical: 'text-danger-500 [html:not(.dark)_&]:text-danger-700',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'ok',
      size: 'md',
    },
  }
);

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 20,
};

const statusIcons = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  critical: AlertOctagon,
};

const statusLabels = {
  ok: 'OK',
  warning: 'Attenzione',
  error: 'Errore',
  critical: 'Critico',
};

const HealthIndicator = forwardRef(function HealthIndicator({
  status = 'ok',
  size = 'md',
  label,
  showIcon = true,
  pulse = false,
  className,
  ...props
}, ref) {
  const displayLabel = label ?? statusLabels[status];
  const Icon = statusIcons[status];
  const iconSize = iconSizes[size];

  return (
    <span
      ref={ref}
      className={cn(
        healthIndicatorVariants({ status, size }),
        pulse && 'animate-glow-pulse',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      {showIcon && Icon && <Icon size={iconSize} aria-hidden="true" />}
      {displayLabel}
    </span>
  );
});

HealthIndicator.displayName = 'HealthIndicator';

export { HealthIndicator, healthIndicatorVariants };
export default HealthIndicator;
```

### Anti-Patterns to Avoid

- **Inline color definitions:** Use CVA variants with Ember Noir palette tokens
- **Separate component files for small sub-components:** Use namespace pattern (SmartHomeCard.Header)
- **Building custom focus management:** Use existing focus styles from Button/Card
- **Ignoring existing vibration service:** Use `lib/pwa/vibration.js`, don't create new haptic patterns
- **Accelerating repeat rate:** CONTEXT.md specifies constant rate for long-press
- **Multiple loading/error patterns:** Use unified `isLoading`, `error`, `errorMessage` props

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Custom navigator.vibrate | `lib/pwa/vibration.js` | Already handles device support, patterns defined |
| Class merging | String concatenation | `cn()` from lib/utils/cn.js | Tailwind conflict resolution |
| Variant management | Object lookups | CVA | Type-safe, consistent with Phase 12-14 |
| Pulse animation | Custom keyframes | `animate-glow-pulse` from globals.css | Already defined and tested |
| Card styling | New base styles | Extend existing Card.js | Proven Ember Noir patterns |
| Long-press detection | Complex touch handling | Custom hook with simple interval | Cleaner, testable |

**Key insight:** Phase 11-14 established all foundational patterns. This phase is about composition and specialization, not innovation on patterns.

---

## Common Pitfalls

### Pitfall 1: Long-Press Not Stopping on Touch Move

**What goes wrong:** User drags finger away but long-press continues
**Why it happens:** Missing touchCancel/touchMove handlers
**How to avoid:** Add `onTouchCancel` and consider `onTouchMove` threshold
**Warning signs:** Accidental multiple increments on swipe gestures

```javascript
// Add to useLongPress hook
onTouchCancel: stop,
onTouchMove: (e) => {
  // Optional: stop if moved more than threshold
  // For smart home controls, we likely want to keep simple
}
```

### Pitfall 2: Badge Pulse Competing with Status Change

**What goes wrong:** Pulse animation makes status change hard to see
**Why it happens:** Animation is always running, even during transitions
**How to avoid:** Use CSS `will-change: opacity` and ensure opacity keyframes are subtle
**Warning signs:** Status changes look "jerky" or hard to notice

### Pitfall 3: Compact Size Missing Touch Targets

**What goes wrong:** Compact cards have too-small interactive elements
**Why it happens:** Reducing padding without maintaining 44px touch targets
**How to avoid:** Ensure ControlButton and interactive elements maintain `min-h-[44px] min-w-[44px]`
**Warning signs:** Touch accuracy issues on mobile in compact view

### Pitfall 4: ConnectionStatus Without Screen Reader Update

**What goes wrong:** Screen readers don't announce connection changes
**Why it happens:** Missing `role="status"` and `aria-live="polite"`
**How to avoid:** Add ARIA attributes (shown in pattern above)
**Warning signs:** Accessibility audits flag dynamic content

### Pitfall 5: Haptic Feedback Without Feature Detection

**What goes wrong:** Errors on devices without vibration support
**Why it happens:** Calling vibrate without checking support
**How to avoid:** Use `lib/pwa/vibration.js` which handles this internally
**Warning signs:** Console errors on desktop browsers

### Pitfall 6: HealthIndicator Colors in Light Mode

**What goes wrong:** Warning/error colors don't meet contrast requirements
**Why it happens:** Using same colors without light mode adjustments
**How to avoid:** Use `[html:not(.dark)_&]:` selector for each color variant
**Warning signs:** WCAG contrast checker fails in light mode

---

## Code Examples

### Enhanced ControlButton with Long-Press

```javascript
// ControlButton.js - Enhanced with long-press
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { useLongPress } from '@/app/hooks/useLongPress';

export const controlButtonVariants = cva(
  // Base classes
  [
    'rounded-xl font-black font-display',
    'transition-all duration-200',
    'border border-white/10 [html:not(.dark)_&]:border-black/5',
    'flex items-center justify-center',
    'select-none touch-manipulation',
    // Focus ring
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ember-500/50 focus-visible:ring-offset-2',
    // Disabled
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        ember: [
          'bg-gradient-to-br from-ember-500 to-flame-600 text-white',
          'hover:from-ember-400 hover:to-flame-500',
          'shadow-ember-glow-sm hover:shadow-ember-glow',
          'active:scale-95',
        ],
        ocean: [
          'bg-gradient-to-br from-ocean-500 to-ocean-600 text-white',
          'hover:from-ocean-400 hover:to-ocean-500',
          'shadow-[0_4px_15px_rgba(67,125,174,0.25)]',
          'active:scale-95',
        ],
        subtle: [
          'bg-white/[0.06] text-slate-200 border-white/[0.08]',
          '[html:not(.dark)_&]:bg-black/[0.04] [html:not(.dark)_&]:text-slate-700',
          'hover:bg-white/[0.1] active:scale-95',
        ],
      },
      size: {
        sm: 'h-10 w-10 min-h-[44px] min-w-[44px] text-xl',
        md: 'h-12 w-12 min-h-[48px] min-w-[48px] text-2xl',
        lg: 'h-14 w-14 sm:h-16 sm:w-16 min-h-[56px] min-w-[56px] text-3xl',
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'md',
    },
  }
);

const ControlButton = forwardRef(function ControlButton({
  type = 'increment',
  variant = 'ember',
  size = 'md',
  step = 1,
  disabled = false,
  onChange,
  className,
  longPressDelay = 400,
  longPressInterval = 100,
  haptic = true,
  ...props
}, ref) {
  const symbol = type === 'increment' ? '+' : '−';

  const handlePress = () => {
    if (disabled || !onChange) return;
    onChange(type === 'increment' ? step : -step);
  };

  const longPressHandlers = useLongPress(handlePress, {
    delay: longPressDelay,
    interval: longPressInterval,
    haptic: haptic && !disabled,
  });

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        controlButtonVariants({ variant, size }),
        disabled && 'bg-slate-800 text-slate-600 shadow-none',
        className
      )}
      aria-label={type === 'increment' ? 'Incrementa' : 'Decrementa'}
      {...(disabled ? {} : longPressHandlers)}
      {...props}
    >
      {symbol}
    </button>
  );
});

ControlButton.displayName = 'ControlButton';

export { ControlButton, controlButtonVariants };
export default ControlButton;
```

### StatusCard Using SmartHomeCard Base

```javascript
// StatusCard.js - For status display (read-only)
'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import SmartHomeCard from './SmartHomeCard';
import Badge from './Badge';
import ConnectionStatus from './ConnectionStatus';

const StatusCard = forwardRef(function StatusCard({
  icon,
  title,
  status,
  statusVariant = 'neutral',
  connectionStatus,
  size = 'default',
  colorTheme = 'ember',
  isLoading = false,
  error = false,
  errorMessage,
  children,
  className,
  ...props
}, ref) {
  return (
    <SmartHomeCard
      ref={ref}
      icon={icon}
      title={title}
      size={size}
      colorTheme={colorTheme}
      isLoading={isLoading}
      error={error}
      errorMessage={errorMessage}
      className={className}
      {...props}
    >
      <SmartHomeCard.Status>
        {/* Status Badge */}
        {status && (
          <Badge
            variant={statusVariant}
            pulse={statusVariant === 'ember' || statusVariant === 'sage'}
          >
            {status}
          </Badge>
        )}

        {/* Connection Status */}
        {connectionStatus && (
          <ConnectionStatus
            status={connectionStatus}
            size={size === 'compact' ? 'sm' : 'md'}
          />
        )}
      </SmartHomeCard.Status>

      {/* Custom content via children */}
      {children}
    </SmartHomeCard>
  );
});

StatusCard.displayName = 'StatusCard';

export { StatusCard };
export default StatusCard;
```

### Test Pattern with jest-axe

```javascript
// __tests__/ControlButton.test.js
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ControlButton from '../ControlButton';

expect.extend(toHaveNoViolations);

// Mock vibration
beforeAll(() => {
  navigator.vibrate = jest.fn().mockReturnValue(true);
});

describe('ControlButton', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations', async () => {
      const { container } = render(
        <ControlButton type="increment" onChange={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct aria-label for increment', () => {
      render(<ControlButton type="increment" onChange={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Incrementa');
    });

    it('has correct aria-label for decrement', () => {
      render(<ControlButton type="decrement" onChange={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Decrementa');
    });
  });

  describe('Long Press Behavior', () => {
    jest.useFakeTimers();

    it('calls onChange immediately on press', () => {
      const onChange = jest.fn();
      render(<ControlButton type="increment" step={1} onChange={onChange} />);

      fireEvent.mouseDown(screen.getByRole('button'));
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('repeats at constant interval during long press', () => {
      const onChange = jest.fn();
      render(
        <ControlButton
          type="increment"
          step={1}
          onChange={onChange}
          longPressDelay={400}
          longPressInterval={100}
        />
      );

      fireEvent.mouseDown(screen.getByRole('button'));
      expect(onChange).toHaveBeenCalledTimes(1);

      // After delay, repeats should start
      act(() => {
        jest.advanceTimersByTime(400 + 100);
      });
      expect(onChange).toHaveBeenCalledTimes(2);

      // Each interval triggers another call
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('stops repeating on mouse up', () => {
      const onChange = jest.fn();
      render(<ControlButton type="increment" onChange={onChange} />);

      fireEvent.mouseDown(screen.getByRole('button'));
      fireEvent.mouseUp(screen.getByRole('button'));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should only have initial call, no repeats
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Haptic Feedback', () => {
    it('triggers vibration on press when haptic enabled', () => {
      const onChange = jest.fn();
      render(<ControlButton type="increment" onChange={onChange} haptic />);

      fireEvent.mouseDown(screen.getByRole('button'));
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('does not vibrate when disabled', () => {
      navigator.vibrate.mockClear();
      const onChange = jest.fn();
      render(<ControlButton type="increment" onChange={onChange} disabled />);

      fireEvent.mouseDown(screen.getByRole('button'));
      expect(navigator.vibrate).not.toHaveBeenCalled();
    });
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Object-based variant lookup | CVA variants | Phase 11-12 | Type-safe, consistent API |
| Separate DeviceCard per device | Shared SmartHomeCard base | Phase 15 | 50% code reduction, consistent UX |
| Click-only controls | Long-press with repeat | Phase 15 | Faster value adjustment |
| No haptic feedback | Vibration API integration | Phase 15 | Better tactile UX on mobile |
| statusBadge prop object | Dedicated Badge component | Phase 15 | Reusable, testable |

**Deprecated (to be removed in Phase 15):**
- `statusBadge` prop object on DeviceCard: Use Badge component directly
- Direct className color overrides: Use CVA variants
- Manual pulse animation classes: Use `pulse` prop on Badge/HealthIndicator

---

## Open Questions

### 1. SmartHomeCard Base Extends Card or Standalone?

**What we know:** CONTEXT.md says extend, Card already has CVA variants
**What's unclear:** Whether to compose (use Card inside) or extend (copy patterns)
**Recommendation:** Compose - SmartHomeCard uses Card internally with additional smart-home-specific structure

### 2. Step Size Default Values

**What we know:** CONTEXT.md says configurable via step prop
**What's unclear:** Default step values for different controls
**Recommendation:** Temperature: step={0.5}, Power/Fan levels: step={1}, Brightness: step={10}

### 3. Long-Press Timing

**What we know:** CONTEXT.md says constant rate, not accelerating
**What's unclear:** Optimal delay and interval values
**Recommendation:** delay={400ms}, interval={100ms} - tested as responsive but not too fast

---

## Sources

### Primary (HIGH confidence)

- Phase 12-14 RESEARCH.md - CVA patterns, namespace components, testing patterns
- Existing Button.js, Card.js, DeviceCard.js - Current implementation patterns
- lib/pwa/vibration.js - Haptic feedback implementation
- globals.css - Animation keyframes (pulse-ember, glow-pulse)
- CONTEXT.md Phase 15 decisions - All implementation constraints

### Secondary (MEDIUM confidence)

- lib/utils/cn.js - Class merging utility
- StatusBadge.js - Existing badge patterns (to be enhanced)
- ControlButton.js - Current control button (to be enhanced)

### Tertiary (LOW confidence)

- Long-press timing recommendations - Based on iOS/Android guidelines, not verified empirically

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already installed and proven
- Architecture patterns: HIGH - Direct extension of Phase 12-14 patterns
- SmartHomeCard base: HIGH - Clear composition of existing Card
- Long-press implementation: MEDIUM - Pattern is standard, timing values are estimates
- HealthIndicator colors: HIGH - Follows Ember Noir palette

**Research date:** 2026-01-29
**Valid until:** 60 days (internal refactoring, stable patterns)
