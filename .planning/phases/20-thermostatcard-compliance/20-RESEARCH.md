# Phase 20: ThermostatCard Compliance - Research

**Researched:** 2026-01-31
**Domain:** Design System Compliance / Component Refactoring
**Confidence:** HIGH

## Summary

This research investigates how to refactor ThermostatCard.js (638 lines) to replace raw HTML elements with design system components. The current implementation uses raw `<button>` elements for:
1. Mode selection grid (4 buttons: schedule, away, hg, off) - lines 555-580
2. Calibrate valves action button - lines 602-620

The mode buttons use a custom grid layout with complex inline Tailwind classes including color-coded active states (sage for schedule, warning for away, ocean for hg, slate for off). The calibrate button uses ocean-themed styling with custom hover states and icon display.

The temperature display section (lines 454-518) already uses design system Text components correctly, so no refactoring is needed there.

The design system provides all necessary components: `Button` with variants and props, plus the temperature display already complies with the design system using `Text` component with proper variants.

**Primary recommendation:** Replace mode grid buttons with Button component using consistent variant pattern (subtle for inactive, variant matching color theme for active), and replace calibrate button with Button component using ocean variant or subtle variant based on design consistency.

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
| React | 18.3+ | forwardRef, hooks | Button component uses forwardRef |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Button.Group | Custom grid layout | Grid allows 4-column layout, Button.Group is flex-based |
| Custom grid | Radio group | Radio semantics don't match (not mutually exclusive selections) |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Current File Structure
```
app/components/devices/thermostat/
├── ThermostatCard.js       # 638 lines - target of refactoring
├── BatteryWarning.js       # Battery status components

app/components/ui/
├── Button.js               # Button, Button.Icon, Button.Group
├── Badge.js                # Badge with CVA variants
├── Text.js                 # Typography component (already used)
├── Heading.js              # Heading component (already used)
└── index.js                # Barrel exports
```

### Pattern 1: Mode Button Grid (Current Custom Implementation)
**What:** Grid of 4 mode selection buttons with color-coded active states
**Current approach:** Raw `<button>` with extensive inline Tailwind classes
**Challenge:** Each mode has unique color when active (sage/warning/ocean/slate)
**Example:**
```jsx
// Current implementation (lines 531-582)
<div className="grid grid-cols-4 gap-3 sm:gap-4">
  {[
    { id: 'schedule', icon: '⏰', label: 'Auto', color: 'sage' },
    { id: 'away', icon: '🏃', label: 'Away', color: 'warning' },
    { id: 'hg', icon: '❄️', label: 'Gelo', color: 'ocean' },
    { id: 'off', icon: '⏸️', label: 'Off', color: 'slate' },
  ].map(({ id, icon, label, color }) => {
    const isActive = mode === id;
    const colorStyles = {
      sage: isActive ? 'bg-sage-900/50 border-sage-400/60 ...' : '',
      // ... more complex inline classes
    };
    return (
      <button className={`flex flex-col ... ${colorStyles[color]}`}>
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    );
  })}
</div>
```

### Pattern 2: Button Component Compliance (Target)
**What:** Replace raw buttons with Button component using consistent variant pattern
**When to use:** All interactive buttons in device cards
**Challenge:** Button component variants don't support per-button color customization
**Solution options:**
1. Use subtle variant for all inactive, ember for all active (consistent but loses color coding)
2. Keep custom implementation but wrap in Button-like structure
3. Use Button with custom className overrides (hybrid approach)

**Example (Option 1 - Consistent variants):**
```jsx
// Source: /app/components/ui/Button.js
<div className="grid grid-cols-4 gap-3 sm:gap-4">
  <Button
    variant={mode === 'schedule' ? 'ember' : 'subtle'}
    onClick={() => handleModeChange('schedule')}
    disabled={refreshing}
    icon="⏰"
    className="flex-col min-h-[80px] sm:min-h-[90px]"
    aria-pressed={mode === 'schedule'}
  >
    Auto
  </Button>
  {/* Repeat for other modes */}
</div>
```

**Example (Option 3 - Hybrid with className):**
```jsx
// Maintains color coding while using Button component
<Button
  variant={mode === 'schedule' ? 'success' : 'subtle'}
  onClick={() => handleModeChange('schedule')}
  disabled={refreshing}
  icon="⏰"
  className={cn(
    "flex-col min-h-[80px] sm:min-h-[90px]",
    mode === 'schedule' && "bg-sage-900/50 border-sage-400/60 ring-2 ring-sage-500/30"
  )}
  aria-pressed={mode === 'schedule'}
>
  Auto
</Button>
```

### Pattern 3: Calibrate Button Replacement
**What:** Replace calibrate button with Button component
**Current:** Raw button with ocean theming and custom states
**Example:**
```jsx
// Source: /app/components/ui/Button.js

// Current (lines 602-620)
<button
  onClick={handleCalibrateValves}
  disabled={calibrating}
  className="w-full flex items-center ... bg-ocean-900/40 border border-ocean-500/40 ..."
>
  <span>{calibrating ? '⏳' : '🔧'}</span>
  <span>{calibrating ? 'Calibrazione...' : 'Tara Valvole'}</span>
</button>

// Target
<Button
  variant="subtle"
  onClick={handleCalibrateValves}
  loading={calibrating}
  icon={calibrating ? '⏳' : '🔧'}
  fullWidth
  className="bg-ocean-900/40 border-ocean-500/40 hover:bg-ocean-900/60"
>
  {calibrating ? 'Calibrazione...' : 'Tara Valvole'}
</Button>
```

### Pattern 4: Temperature Display (Already Compliant)
**What:** Temperature display using Text component
**Current state:** Already using design system correctly
**Example (lines 458-480):**
```jsx
// Already compliant - no changes needed
<Text variant="label" size="xs" weight="bold" className="mb-2 font-display">
  Attuale
</Text>
<Text weight="black" className="text-4xl sm:text-5xl font-display ...">
  {selectedRoom.temperature}
</Text>
```

### Anti-Patterns to Avoid
- **Raw button elements:** Always use Button component for interactive actions
- **Inline color classes without CVA:** Use Button variants or documented className overrides
- **Missing aria-pressed:** Toggle buttons need aria-pressed for accessibility
- **Custom loading spinners:** Use Button's built-in loading prop
- **Losing visual distinction:** If color coding is functional, preserve it via className

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button loading state | Custom spinner overlay | Button loading prop | Consistent animation, aria-hidden handling |
| Icon + text layout | Manual flex structure | Button icon prop | Proper spacing, iconPosition control |
| Disabled state styling | Custom opacity classes | Button disabled prop | Consistent pointer-events, cursor handling |
| Focus ring | Custom focus styles | Button built-in focus-visible | WCAG AA compliant ember glow |
| Active state animation | Custom scale transform | Button built-in active:scale | Consistent active feedback |

**Key insight:** The Button component already handles disabled states, loading states, focus indicators, and active animations. Custom button implementations need to replicate this accessibility and UX polish.

## Common Pitfalls

### Pitfall 1: Grid Layout vs Button.Group
**What goes wrong:** Button.Group uses flex layout, not grid
**Why it happens:** Assuming Button.Group handles all button grouping scenarios
**How to avoid:** Keep grid layout wrapper, use Button components inside grid cells
**Warning signs:** Buttons don't maintain 4-column layout on mobile

### Pitfall 2: Color-Coded Active States
**What goes wrong:** Each mode button has unique active color (sage/warning/ocean/slate)
**Why it happens:** Button component variants are global (ember, subtle, success, etc.)
**How to avoid:**
- Option A: Use consistent variant (ember/subtle) and accept loss of color coding
- Option B: Use Button with className overrides to preserve colors
- Option C: Extend Button component variants to support per-instance theming
**Warning signs:** All active buttons look the same, losing functional color distinction
**Recommendation:** Option B (hybrid) maintains design while using component

### Pitfall 3: Icon Display in Vertical Layout
**What goes wrong:** Button icon prop positions icon left/right, but grid buttons need vertical layout
**Why it happens:** Button component designed for horizontal icon+text layout
**How to avoid:** Use custom layout with Button as wrapper, or pass icon as children
**Warning signs:** Icon appears beside text instead of above

**Example solution:**
```jsx
<Button
  variant="subtle"
  onClick={handleClick}
  className="flex-col" // Override to vertical
  aria-pressed={isActive}
>
  <span className="text-3xl sm:text-4xl mb-1.5">{icon}</span>
  <span>{label}</span>
</Button>
```

### Pitfall 4: Loading vs Disabled State
**What goes wrong:** Calibrate button uses disabled prop for calibrating state
**Why it happens:** Custom implementation used disabled to prevent clicks during calibration
**How to avoid:** Use Button's loading prop instead of disabled during async operations
**Warning signs:** Button appears disabled instead of showing loading spinner
**Correct pattern:**
```jsx
<Button loading={calibrating} onClick={handleCalibrateValves}>
  {calibrating ? 'Calibrazione...' : 'Tara Valvole'}
</Button>
```

### Pitfall 5: aria-pressed for Toggle Buttons
**What goes wrong:** Mode buttons are toggle-style but lack aria-pressed
**Why it happens:** Implementing visual toggles without accessibility attributes
**How to avoid:** Add `aria-pressed={isActive}` to each mode button
**Warning signs:** Screen readers don't announce button state
**Correct pattern:**
```jsx
<Button
  variant={isActive ? 'ember' : 'subtle'}
  onClick={handleModeChange}
  aria-pressed={isActive}
>
  {label}
</Button>
```

## Code Examples

Verified patterns from official sources:

### Mode Grid with Button Component (Recommended Approach)
```jsx
// Source: /app/components/ui/Button.js + current ThermostatCard pattern
// Hybrid approach: Button component with className overrides to preserve color coding

function ModeButtonGrid({ mode, onModeChange, disabled }) {
  const modes = [
    { id: 'schedule', icon: '⏰', label: 'Auto', activeVariant: 'success' },
    { id: 'away', icon: '🏃', label: 'Away', activeVariant: 'warning' },
    { id: 'hg', icon: '❄️', label: 'Gelo', activeVariant: 'info' },
    { id: 'off', icon: '⏸️', label: 'Off', activeVariant: 'neutral' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {modes.map(({ id, icon, label, activeVariant }) => {
        const isActive = mode === id;

        return (
          <Button
            key={id}
            variant={isActive ? activeVariant : 'subtle'}
            onClick={() => onModeChange(id)}
            disabled={disabled}
            className="flex-col min-h-[80px] sm:min-h-[90px] text-xs sm:text-sm"
            aria-pressed={isActive}
          >
            <span className="text-3xl sm:text-4xl mb-1.5">{icon}</span>
            <span className="font-bold font-display">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
```

### Calibrate Button with Loading State
```jsx
// Source: /app/components/ui/Button.js

function CalibrateButton({ calibrating, onCalibrate }) {
  return (
    <Button
      variant="subtle"
      onClick={onCalibrate}
      loading={calibrating}
      icon={calibrating ? '⏳' : '🔧'}
      fullWidth
      size="md"
      className="bg-ocean-900/40 border-ocean-500/40 hover:bg-ocean-900/60 hover:border-ocean-400/50 [html:not(.dark)_&]:bg-ocean-50/80 [html:not(.dark)_&]:border-ocean-200"
    >
      {calibrating ? 'Calibrazione...' : 'Tara Valvole'}
    </Button>
  );
}
```

### Alternative: Pure Button Component (Simpler but Loses Color Coding)
```jsx
// Simpler approach: use consistent ember variant for all active states
// Trades color coding for consistency and simplicity

<div className="grid grid-cols-4 gap-3 sm:gap-4">
  {[
    { id: 'schedule', icon: '⏰', label: 'Auto' },
    { id: 'away', icon: '🏃', label: 'Away' },
    { id: 'hg', icon: '❄️', label: 'Gelo' },
    { id: 'off', icon: '⏸️', label: 'Off' },
  ].map(({ id, icon, label }) => (
    <Button
      key={id}
      variant={mode === id ? 'ember' : 'subtle'}
      onClick={() => handleModeChange(id)}
      disabled={refreshing}
      className="flex-col min-h-[80px] sm:min-h-[90px]"
      aria-pressed={mode === id}
    >
      <span className="text-3xl sm:text-4xl mb-1.5">{icon}</span>
      <span className="text-xs sm:text-sm font-bold font-display">{label}</span>
    </Button>
  ))}
</div>
```

### Temperature Display (Already Compliant - No Changes)
```jsx
// Current implementation already uses Text component correctly
// Source: ThermostatCard.js lines 454-486

<div className="flex flex-col items-center justify-center p-4 sm:p-6">
  <Text variant="label" size="xs" weight="bold" className="mb-2 font-display">
    Attuale
  </Text>
  <div className="flex items-baseline gap-1">
    <Text weight="black" className="text-4xl sm:text-5xl font-display text-slate-100 leading-none [html:not(.dark)_&]:text-slate-900">
      {selectedRoom.temperature}
    </Text>
    <Text as="span" weight="bold" className="text-2xl sm:text-3xl text-slate-400 [html:not(.dark)_&]:text-slate-500">
      °
    </Text>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `<button>` elements | Button component with CVA | Design System v3.0 | Consistent styling, accessibility, loading states |
| Manual disabled styling | Button disabled prop | Design System v3.0 | Proper cursor, pointer-events, opacity |
| Custom loading spinners | Button loading prop | Design System v3.0 | Consistent animation, aria-hidden |
| Manual focus rings | Button built-in focus-visible | Design System v3.0 | WCAG AA compliant ember glow |

**Deprecated/outdated:**
- Direct `<button>` usage in device cards: Replace with Button component
- Manual aria attributes without component support: Use Button's built-in accessibility
- Custom loading spinner implementation: Use Button loading prop

## Open Questions

Things that couldn't be fully resolved:

1. **Color-coded mode buttons design decision**
   - What we know: Current design uses unique colors per mode (sage/warning/ocean/slate)
   - What's unclear: Whether color coding is functional requirement or visual preference
   - Recommendation: Preserve color coding via Button className overrides (hybrid approach) to maintain current UX

2. **ButtonGroup applicability**
   - What we know: ButtonGroup uses flex layout, mode grid uses CSS grid
   - What's unclear: Whether to migrate grid layout to flex for consistency
   - Recommendation: Keep grid layout (4-column responsive), use Button components inside grid cells

3. **Icon layout in vertical Button**
   - What we know: Button icon prop is designed for horizontal (left/right) positioning
   - What's unclear: Best practice for vertical icon+text layout with Button component
   - Recommendation: Use Button as wrapper with custom children layout (icon above text)

4. **Calibrate button variant**
   - What we know: Current uses ocean theming, Button has subtle/outline variants
   - What's unclear: Which variant best represents calibration action
   - Recommendation: Use subtle variant with ocean-themed className overrides to maintain current visual style

5. **Temperature display component standardization**
   - What we know: Current implementation already uses Text component correctly
   - What's unclear: Whether to introduce Heading component for large temperature numbers
   - Recommendation: No change needed - Text component with size/weight props is appropriate for numeric display

## Sources

### Primary (HIGH confidence)
- `/app/components/ui/Button.js` - Button, Button.Icon, Button.Group implementation, buttonVariants CVA
- `/app/components/ui/Text.js` - Text component with CVA variants (already used correctly)
- `/app/components/ui/Heading.js` - Heading component (already used correctly)
- `/app/components/devices/thermostat/ThermostatCard.js` - Current implementation to refactor
- `/docs/design-system.md` - Design system component reference
- `/docs/accessibility.md` - WCAG AA compliance patterns, aria-pressed usage

### Secondary (MEDIUM confidence)
- `.planning/phases/19-stove-card-compliance/19-RESEARCH.md` - Similar refactoring patterns from StoveCard
- `/app/debug/design-system/page.js` - Button component usage examples

### Tertiary (LOW confidence)
- None - all patterns verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already exist in codebase
- Architecture: HIGH - Patterns directly observed from existing Button implementation
- Pitfalls: HIGH - Based on actual ThermostatCard structure and Button API limitations

**Research date:** 2026-01-31
**Valid until:** 60 days (stable internal components, no external dependencies)
