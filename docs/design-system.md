# Design System - Ember Noir

**Version 2.0** - A sophisticated dark-first design system with warm accents.

---

## Design Philosophy

**Ember Noir** is a warm, sophisticated design inspired by the glow of firelight and modern minimalism. It combines the comfort of home with cutting-edge aesthetics.

### Core Principles

1. **Dark Foundation with Warmth** - Deep charcoal backgrounds with warm undertones, not cold black
2. **Ember Accents** - Copper/amber as the signature color, evoking warmth, fire, and luxury
3. **Editorial Typography** - Distinctive display fonts paired with clean body text
4. **Organic Shapes** - Generous border radius, soft curves
5. **Layered Depth** - Subtle gradients and shadows, minimal heavy blur effects
6. **Intentional Motion** - Smooth, buttery transitions with purpose

---

## Color Palette

### Foundation - Slate (Warm Charcoal)

The base layer uses warm charcoal tones, never pure black.

```css
slate-950   #0c0a09   /* Deepest - backgrounds */
slate-900   #1c1917   /* Primary dark */
slate-850   #231f1d   /* Elevated surfaces */
slate-800   #292524
slate-700   #44403c
slate-600   #57534e
slate-500   #78716c   /* Muted text */
slate-400   #a8a29e   /* Secondary text */
slate-300   #d6d3d1   /* Primary text (dark mode) */
slate-200   #e7e5e4
slate-100   #f5f5f4
slate-50    #fafaf9   /* Light mode background */
```

### Ember - Signature Accent (Copper/Amber)

The warm, inviting accent color.

```css
ember-50    #fef7ed
ember-100   #fdebd3
ember-200   #fad4a6
ember-300   #f6b56d   /* Highlights */
ember-400   #f18d33   /* Active states (dark) */
ember-500   #ed6f10   /* Primary accent */
ember-600   #de5408
ember-700   #b83d09   /* Active states (light) */
ember-800   #93310f
ember-900   #782a10
```

**Usage**: Primary actions, active states, focus rings, brand elements.

### Flame - High Energy (Orange-Red)

For emphasis and CTAs.

```css
flame-50    #fff5ed
flame-100   #ffe8d4
flame-200   #ffcda8
flame-300   #ffa970
flame-400   #ff7a37
flame-500   #fe5610   /* CTAs, power on */
flame-600   #ef3906
flame-700   #c62707
```

**Usage**: Stove "on" state, urgent actions, gradient endpoints.

### Sage - Calm Accent (Muted Green)

For success and comfort states.

```css
sage-50     #f6f7f6
sage-100    #e3e7e3
sage-200    #c7cfc7
sage-300    #a3b0a3
sage-400    #7d8e7d
sage-500    #607360   /* Success actions */
sage-600    #4c5c4c
sage-700    #3f4b3f
```

**Usage**: Success states, confirmations, "healthy" indicators.

### Ocean - Cool Accent (Muted Blue)

For informational elements.

```css
ocean-50    #f4f7fb
ocean-100   #e7eef6
ocean-200   #c9dbeb
ocean-300   #9bbdda
ocean-400   #669ac4
ocean-500   #437dae   /* Info elements */
ocean-600   #326392
ocean-700   #2a5077
```

**Usage**: Info banners, thermostat (cooling), links.

### Semantic Colors

Standard semantic colors for status indicators:

```css
/* Success */
success-500   #22c55e

/* Warning */
warning-500   #eab308

/* Danger */
danger-500    #ef4444

/* Info */
info-500      #3b82f6
```

---

## Typography

### Font Stack

```css
--font-display: 'Outfit', system-ui, sans-serif;
--font-body: 'Space Grotesk', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Outfit** - Display font for headings. Geometric, modern, versatile.
**Space Grotesk** - Body text. Clean, readable, technical feel.

### Fluid Typography Scale

All font sizes are fluid, adapting smoothly from mobile to desktop.

```css
--font-size-fluid-xs:   clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem);
--font-size-fluid-sm:   clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem);
--font-size-fluid-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
--font-size-fluid-lg:   clamp(1rem, 0.95rem + 0.5vw, 1.25rem);
--font-size-fluid-xl:   clamp(1.15rem, 1rem + 0.75vw, 1.5rem);
--font-size-fluid-2xl:  clamp(1.4rem, 1.2rem + 1vw, 2rem);
--font-size-fluid-3xl:  clamp(1.8rem, 1.5rem + 1.5vw, 2.75rem);
--font-size-fluid-4xl:  clamp(2.25rem, 1.75rem + 2.5vw, 4rem);
```

### Typography Classes

```jsx
// Headings - Use font-display
<h1 className="heading-1">Page Title</h1>      // ~4xl, bold
<h2 className="heading-2">Section Title</h2>  // ~3xl, bold
<h3 className="heading-3">Card Title</h3>     // ~2xl, semibold
<h4 className="heading-4">Subsection</h4>     // ~xl, semibold

// Body text - Uses font-body
<p className="body-lg">Large text</p>         // ~lg, relaxed
<p className="body">Normal text</p>           // ~base, relaxed
<p className="body-sm">Small text</p>         // ~sm, relaxed
<span className="caption">LABEL</span>        // ~xs, uppercase, tracked

// Gradient text
<span className="gradient-text-ember">Highlighted</span>
```

---

## Spacing Scale

Uses Tailwind's default 4px base unit + custom additions.

```css
0    0px
1    4px     (0.25rem)
2    8px     (0.5rem)
3    12px    (0.75rem)
4    16px    (1rem)
5    20px    (1.25rem)
6    24px    (1.5rem)
8    32px    (2rem)
10   40px    (2.5rem)
12   48px    (3rem)
18   72px    (4.5rem)   /* Custom */
22   88px    (5.5rem)   /* Custom */
```

**Common usage:**
- Card padding: `p-5 sm:p-6` (20-24px)
- Section spacing: `space-y-4` (16px)
- Grid gaps: `gap-4` (16px)

---

## Border Radius

Organic, generous curves.

```css
--radius-xs:    0.25rem   (4px)
--radius-sm:    0.375rem  (6px)
--radius-md:    0.5rem    (8px)
--radius-lg:    0.75rem   (12px)
--radius-xl:    1rem      (16px)
--radius-2xl:   1.25rem   (20px)
--radius-3xl:   1.5rem    (24px)   /* Cards */
--radius-4xl:   2rem      (32px)
--radius-pill:  9999px             /* Badges */
```

**Standard usage:**
- Cards: `rounded-2xl` (20px)
- Buttons: `rounded-xl` (16px)
- Badges: `rounded-full` (pill)
- Input fields: `rounded-lg` (12px)

---

## Shadows - Ember Noir Depth System

### Base Shadows

```css
--shadow-xs:  0 1px 2px rgba(0,0,0,0.04);
--shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:  0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
--shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);
--shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.03);
--shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.2);
```

### Ember Glow Effects

Signature warm glow for active/highlighted elements.

```css
--shadow-ember-glow:    0 0 20px rgba(237,111,16,0.15), 0 0 40px rgba(237,111,16,0.08);
--shadow-ember-glow-sm: 0 0 10px rgba(237,111,16,0.12);
--shadow-ember-glow-lg: 0 0 30px rgba(237,111,16,0.2), 0 0 60px rgba(237,111,16,0.1);
```

### Card Shadows

Optimized for dark backgrounds.

```css
--shadow-card:          0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
--shadow-card-hover:    0 8px 24px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.08);
--shadow-card-elevated: 0 16px 32px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.1);
```

### Focus Rings

```css
--shadow-focus-ember:  0 0 0 3px rgba(237,111,16,0.3);
--shadow-focus-sage:   0 0 0 3px rgba(96,115,96,0.3);
--shadow-focus-ocean:  0 0 0 3px rgba(67,125,174,0.3);
--shadow-focus-danger: 0 0 0 3px rgba(239,68,68,0.3);
```

---

## Component Patterns

### Card

```jsx
// Default card
<Card>Content</Card>

// Elevated card (more prominent)
<Card variant="elevated">Content</Card>

// Subtle card (nested content)
<Card variant="subtle">Content</Card>

// With hover effects
<Card hover>Interactive card</Card>

// With ember glow (active state)
<Card glow>Active card</Card>
```

**Card variants:**
- `default` - Standard dark container
- `elevated` - Stronger shadow, more prominent
- `subtle` - Minimal, for nested content
- `outlined` - Transparent with border
- `glass` - Stronger glass effect with blur

### Button

```jsx
// Primary action (ember gradient)
<Button variant="ember">Primary Action</Button>

// Secondary action (subtle)
<Button variant="subtle">Secondary</Button>

// Ghost (transparent)
<Button variant="ghost">Ghost</Button>

// Success action
<Button variant="success">Confirm</Button>

// Danger action
<Button variant="danger">Delete</Button>

// Outline
<Button variant="outline">Outline</Button>

// With icon
<Button icon="🔥" variant="ember">Start</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  // default
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
```

### Banner

```jsx
// Info banner
<Banner variant="info" title="Note" description="..." />

// Warning banner
<Banner variant="warning" title="Attention" description="..." />

// Error banner
<Banner variant="error" title="Error" description="..." />

// Success banner
<Banner variant="success" title="Success" description="..." />

// Ember highlight banner
<Banner variant="ember" title="Highlighted" description="..." />

// Dismissible
<Banner dismissible dismissKey="unique-key" />

// Compact
<Banner compact />
```

### StatusBadge

```jsx
// Badge (inline)
<StatusBadge status="IN FUNZIONE" />

// Display (large centered)
<StatusBadge variant="display" status="SPENTO" size="lg" />

// Dot indicator
<StatusBadge variant="dot" status="active" pulse />

// Floating (absolute positioned)
<StatusBadge variant="floating" status="3" position="top-right" />

// Manual color override
<StatusBadge status="Custom" color="ember" />
```

**Auto-detected colors:**
- `ember` - WORK, ON, ACTIVE
- `neutral` - OFF, SPENTO
- `warning` - STANDBY, WAIT
- `danger` - ERROR
- `ocean` - START, AVVIO
- `sage` - SUCCESS, OK

---

## Animation System

### Timing Functions

```css
--ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);   /* Primary */
--ease-out-quint:   cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Animation Classes

```jsx
// Fade animations
<div className="animate-fade-in">...</div>
<div className="animate-fade-out">...</div>
<div className="animate-fade-in-up">...</div>
<div className="animate-fade-in-down">...</div>

// Scale animations
<div className="animate-scale-in">...</div>
<div className="animate-scale-in-center">...</div>

// Slide animations
<div className="animate-slide-down">...</div>
<div className="animate-slide-up">...</div>
<div className="animate-slide-in-from-bottom">...</div>

// Special effects
<div className="animate-shimmer">...</div>           // Loading skeleton
<div className="animate-pulse-ember">...</div>       // Ember glow pulse
<div className="animate-glow-pulse">...</div>        // Generic glow
<div className="animate-spring-in">...</div>         // Bouncy entrance

// Dropdown animations
<div className="animate-dropdown">...</div>
<div className="animate-dropdown-up">...</div>
```

### Transition Guidelines

- **Color transitions**: 200ms (theme switching)
- **Hover effects**: 200ms ease-out-expo
- **Dropdown/modal**: 250ms ease-out-expo
- **Page transitions**: 300ms ease-out-expo

---

## Dark Mode / Light Mode

Ember Noir is **dark-first** but fully supports light mode.

### CSS Strategy

```css
/* Dark mode (default in Ember Noir) */
.element {
  background: rgba(28, 25, 23, 0.8);
  color: var(--color-slate-200);
}

/* Light mode override using Tailwind arbitrary selector */
[html:not(.dark)_&]:bg-white/90
[html:not(.dark)_&]:text-slate-900
```

### Key Differences

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | slate-950/900 | slate-50/100 |
| Text primary | slate-200/100 | slate-900 |
| Text secondary | slate-400 | slate-500/600 |
| Text tertiary | slate-500 | slate-400 |
| Borders | white/[0.06-0.10] | slate-200/black/[0.06] |
| Cards | slate-900/80 | white/80-90 |
| Ember accents | ember-400 | ember-600/700 |
| Ocean accents | ocean-400 | ocean-600/700 |
| Sage accents | sage-400 | sage-600/700 |
| Warning accents | warning-400 | warning-600/700 |
| Danger accents | danger-400 | danger-600/700 |

### Component Internal Styling

**Base components handle dark/light mode internally:**

```jsx
// Heading.js - Internal variant handling
const variantClasses = {
  default: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
  gradient: 'bg-gradient-to-r from-ember-500 to-flame-600 bg-clip-text text-transparent',
  subtle: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
};

// Text.js - Internal variant handling
const variantClasses = {
  body: 'text-base text-slate-100 [html:not(.dark)_&]:text-slate-900',
  secondary: 'text-base text-slate-300 [html:not(.dark)_&]:text-slate-600',
  tertiary: 'text-sm text-slate-400 [html:not(.dark)_&]:text-slate-500',
};
```

**Do NOT pass color classes externally** - use variants instead:

```jsx
// ✅ Correct - use variant
<Heading variant="subtle">Room Name</Heading>
<Text variant="tertiary">Description</Text>

// ❌ Wrong - external color classes
<Heading className="text-slate-400">Room Name</Heading>
<Text className="text-slate-500">Description</Text>
```

### Status-Based Dynamic Styling

For components with dynamic status (like StoveCard), include light mode in the status config:

```jsx
// StoveCard getStatusInfo example
const getStatusInfo = (status) => {
  if (status.includes('OFF')) {
    return {
      label: 'SPENTA',
      icon: '❄️',
      // Each property includes both dark and light mode
      textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      bgColor: 'bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 [html:not(.dark)_&]:from-slate-100/80 [html:not(.dark)_&]:via-white/90 [html:not(.dark)_&]:to-slate-100/70',
      borderColor: 'border-slate-600/40 [html:not(.dark)_&]:border-slate-200',
      boxBgColor: 'bg-slate-800/60 backdrop-blur-xl [html:not(.dark)_&]:bg-white/80',
      boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
      boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
    };
  }
  // ... other statuses
};
```

### Semantic Color Light Mode Mappings

| Status | Dark Mode | Light Mode |
|--------|-----------|------------|
| WORK (ember) | ember-400/300/100 | ember-600/700 |
| OFF (slate) | slate-400/200/500 | slate-500/900/400 |
| START (ocean) | ocean-400/300/100 | ocean-600/700 |
| STANDBY (warning) | warning-400/300/100 | warning-600/700 |
| ERROR (danger) | danger-400/300/100 | danger-600/700 |
| CLEAN (sage) | sage-400/300/100 | sage-600/700 |

### Common Patterns

```jsx
// Container with light mode
className="bg-slate-800/50 border border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200"

// Icon container with light mode
className="bg-ocean-900/50 border-2 border-ocean-500/50 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:border-ocean-300"

// Button with light mode
className="text-ocean-300 bg-ocean-900/30 border-ocean-500/40 [html:not(.dark)_&]:text-ocean-700 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:border-ocean-300"

// Gradient background with light mode
className="bg-gradient-to-br from-ember-900/40 via-slate-900/60 to-flame-900/30 [html:not(.dark)_&]:from-ember-100/80 [html:not(.dark)_&]:via-ember-50/90 [html:not(.dark)_&]:to-flame-100/70"
```

---

## Responsive Breakpoints

```css
sm:   640px   /* Small devices */
md:   768px   /* Tablets */
lg:   1024px  /* Desktop */
xl:   1280px  /* Large desktop */
2xl:  1536px  /* Extra large */
```

**Mobile-first approach:**
```jsx
// Padding scales up
<div className="p-4 sm:p-5 lg:p-6">...</div>

// Grid adapts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">...</div>

// Hide/show
<div className="hidden lg:block">Desktop only</div>
<div className="lg:hidden">Mobile only</div>
```

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:
- Normal text: 4.5:1 ratio minimum
- Large text: 3:1 ratio minimum

### Focus States

All interactive elements have visible focus states using ember glow:

```css
*:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ember);
}
```

### Touch Targets

Minimum touch target: 44px (iOS standard)

```jsx
// Buttons have min-h-[44px] or min-h-[48px]
<Button size="md">At least 48px tall</Button>
```

### Reduced Motion

Respects user preference:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Migration from v1 (Liquid Glass)

### Color Mapping

| Old (v1) | New (v2) |
|----------|----------|
| primary-* | flame-* |
| accent-* | ember-* |
| neutral-* | slate-* |
| success-* | sage-* (or success-*) |
| info-* | ocean-* (or info-*) |

### Component Props

| Old | New |
|-----|-----|
| `liquid={true}` | `variant="glass"` |
| `glass={true}` | `variant="glass"` |
| `elevation="elevated"` | `variant="elevated"` |
| `variant="primary"` | `variant="ember"` |
| `variant="secondary"` | `variant="subtle"` |

### Visual Changes

- Background: Purple gradient → Warm charcoal gradient
- Glass effects: Heavy blur → Subtle blur with depth
- Borders: white/20 → white/[0.06] (more subtle)
- Shadows: Blue-tinted → Neutral with ember glow
- Typography: System fonts → Outfit + Space Grotesk

---

## Quick Reference

### Common Patterns

```jsx
// Card with header
<Card>
  <CardHeader>
    <CardTitle icon="🔥">Title</CardTitle>
    <StatusBadge status="Active" />
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>
    <Button variant="ember">Action</Button>
  </CardFooter>
</Card>

// Alert/notification
<Banner
  variant="warning"
  icon="⚠️"
  title="Attention Required"
  description="Please check..."
  dismissible
/>

// Status display
<StatusBadge
  variant="display"
  status="IN FUNZIONE"
  size="lg"
  pulse
/>
```

### CSS Variables Quick Access

```css
/* Colors */
var(--color-ember-500)
var(--color-slate-900)

/* Typography */
var(--font-display)
var(--font-body)

/* Shadows */
var(--shadow-card)
var(--shadow-ember-glow)

/* Timing */
var(--ease-out-expo)
```

---

## See Also

- [UI Components](./ui-components.md) - Component documentation
- [Patterns](./patterns.md) - Common code patterns
- [Architecture](./architecture.md) - App structure

---

**Last Updated**: 2026-01 (Ember Noir v2.1 - Full Light Mode Support)
