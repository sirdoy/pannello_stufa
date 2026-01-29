---
phase: 15-smart-home-components
plan: 02
subsystem: ui-components
tags: [badge, cva, tailwind, animation, smart-home]
dependencies:
  requires: [11-01]
  provides: [Badge, badgeVariants]
  affects: [15-03, 15-04, 15-05, 15-06]
tech-stack:
  added: []
  patterns: [CVA variants, pulse animation, forwardRef]
key-files:
  created:
    - app/components/ui/Badge.js
    - app/components/ui/__tests__/Badge.test.js
  modified:
    - app/components/ui/index.js
decisions:
  - name: pulse-as-cva-variant
    choice: CVA boolean variant for pulse
    rationale: Cleaner API than separate prop handling
  - name: neutral-default
    choice: neutral variant as default
    rationale: Most badges start inactive, active states are explicitly set
metrics:
  duration: 2m 29s
  completed: 2026-01-29
---

# Phase 15 Plan 02: Badge Component Summary

**CVA-based status badge with pulse animation for smart home device indicators.**

## What Was Built

### Badge Component (`app/components/ui/Badge.js`)

A reusable status indicator component using class-variance-authority (CVA) for consistent styling across smart home components.

**Variants:**
- **6 color variants:** ember (active), sage (online/success), ocean (info/starting), warning (standby), danger (error), neutral (off/inactive)
- **3 size variants:** sm (compact), md (default), lg (prominent)
- **pulse animation:** Boolean variant adds `animate-glow-pulse` for active states

**API:**
```jsx
// Basic usage
<Badge variant="sage">Online</Badge>

// With icon and pulse for active state
<Badge variant="ember" pulse icon={<FlameIcon />}>Active</Badge>

// Size variations
<Badge variant="ocean" size="lg">Starting</Badge>
```

**Exports:**
- `Badge` - Main component (default + named)
- `badgeVariants` - CVA function for external styling

### Test Coverage

29 tests covering:
- Rendering (children, icon, span element)
- All 6 color variants with correct class assertions
- All 3 size variants
- Pulse animation toggle
- Custom className merging
- Ref forwarding
- Base classes verification
- Export verification
- Accessibility (4 axe tests, all passing)

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `app/components/ui/Badge.js` | Created | CVA badge component |
| `app/components/ui/__tests__/Badge.test.js` | Created | Component tests |
| `app/components/ui/index.js` | Modified | Export Badge + badgeVariants |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `35772e8` | feat | Create Badge component with CVA and pulse animation |
| `1cc4ff4` | feat | Export Badge from UI index |

## Deviations from Plan

None - plan executed exactly as written.

## Patterns Established

1. **Badge CVA pattern:**
   ```javascript
   export const badgeVariants = cva(baseClasses, {
     variants: { variant, size, pulse },
     defaultVariants: { variant: 'neutral', size: 'md', pulse: false }
   });
   ```

2. **Pulse animation via CVA boolean:**
   ```javascript
   pulse: { true: 'animate-glow-pulse', false: '' }
   ```

3. **Light mode overrides per variant:**
   ```javascript
   '[html:not(.dark)_&]:bg-ember-500/10',
   '[html:not(.dark)_&]:text-ember-700',
   ```

## Relationship to StatusBadge

`StatusBadge.js` remains unchanged for backwards compatibility. The new `Badge` component is purpose-built for smart home components:

| StatusBadge | Badge |
|-------------|-------|
| Auto-detect color from status text | Explicit variant prop |
| Multiple display modes (badge, dot, floating) | Single inline badge style |
| Complex with emoji auto-detection | Simple, composable |
| Legacy | v3.0 design system |

Future phases may migrate StatusBadge usages to Badge where appropriate.

## Next Phase Readiness

Plan 15-02 delivers the Badge component needed by:
- **15-03:** ConnectionStatus (uses Badge for status display)
- **15-04:** HealthIndicator (uses Badge for health states)
- **15-05:** StatusCard/DeviceCard (uses Badge in card headers)
- **15-06:** ControlButton (may use Badge for mode indicators)

No blockers for subsequent plans.
