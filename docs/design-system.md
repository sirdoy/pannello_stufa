# Design System - Ember Noir v2

Dark-first design system with warm accents.

**Live preview**: `/debug/design-system`

---

## Philosophy

1. **Dark Foundation** - Warm charcoal, not cold black
2. **Ember Accents** - Copper/amber signature color
3. **Organic Shapes** - Generous border radius
4. **Layered Depth** - Subtle gradients and shadows

---

## Colors

### Foundation (Slate)

```
slate-950  #0c0a09  /* Deepest background */
slate-900  #1c1917  /* Primary dark */
slate-400  #a8a29e  /* Secondary text */
slate-200  #e7e5e4  /* Primary text (dark) */
```

### Ember (Signature)

```
ember-500  #ed6f10  /* Primary accent */
ember-400  #f18d33  /* Active (dark) */
ember-700  #b83d09  /* Active (light) */
```

### Semantic

```
sage-500    #607360  /* Success */
ocean-500   #437dae  /* Info */
warning-500 #eab308  /* Warning */
danger-500  #ef4444  /* Danger */
flame-500   #fe5610  /* CTAs, power on */
```

---

## Typography

```css
--font-display: 'Outfit', system-ui;    /* Headings */
--font-body: 'Space Grotesk', system-ui; /* Body */
```

### Fluid Scale

```css
--font-size-fluid-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
--font-size-fluid-xl:   clamp(1.15rem, 1rem + 0.75vw, 1.5rem);
--font-size-fluid-3xl:  clamp(1.8rem, 1.5rem + 1.5vw, 2.75rem);
```

---

## Spacing & Radius

```css
/* Spacing */
4   16px   /* Card padding */
6   24px   /* Section spacing */
8   32px   /* Large sections */

/* Radius */
rounded-lg    12px  /* Inputs */
rounded-xl    16px  /* Buttons */
rounded-2xl   20px  /* Cards */
rounded-full  pill  /* Badges */
```

---

## Shadows

### Standard

```css
--shadow-card:       0 2px 8px rgba(0,0,0,0.12);
--shadow-card-hover: 0 8px 24px rgba(0,0,0,0.16);
```

### Ember Glow

```css
--shadow-ember-glow: 0 0 20px rgba(237,111,16,0.15);
```

### Liquid Glass

```css
--shadow-liquid-sm: 0 4px 16px rgba(0,0,0,0.06);
--shadow-liquid:    0 8px 32px rgba(0,0,0,0.08);
--shadow-liquid-lg: 0 16px 48px rgba(0,0,0,0.12);
```

---

## Dark/Light Mode

**Dark-first** - Use `[html:not(.dark)_&]:` for light mode overrides.

```jsx
// Pattern
className="text-slate-200 [html:not(.dark)_&]:text-slate-800"
className="bg-slate-900 [html:not(.dark)_&]:bg-slate-100"
```

### Key Mappings

| Property | Dark | Light |
|----------|------|-------|
| Background | slate-950/900 | slate-50/100 |
| Text primary | slate-200 | slate-900 |
| Text secondary | slate-400 | slate-600 |
| Borders | white/[0.06] | slate-200 |
| Ember accent | ember-400 | ember-700 |

### Component Styling

**Always use variants, never raw color classes:**

```jsx
// Correct
<Heading level={2} variant="ember">Title</Heading>
<Text variant="secondary">Description</Text>

// Wrong
<h2 className="text-ember-400">Title</h2>
```

---

## Animations

### Timing

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Classes

```jsx
animate-fade-in
animate-scale-in
animate-slide-down
animate-shimmer      /* Skeleton */
animate-pulse-ember  /* Glow */
```

### Guidelines

- Color transitions: 200ms
- Hover effects: 200ms
- Modals: 250ms
- Page transitions: 300ms

---

## Responsive

```css
sm:  640px   /* Small */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large */
```

Mobile-first:
```jsx
<div className="p-4 sm:p-5 lg:p-6">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## Accessibility

- **Contrast**: WCAG AA (4.5:1 text, 3:1 large)
- **Touch targets**: 44px minimum
- **Focus**: Ember glow ring
- **Reduced motion**: Respected via media query

---

## Liquid Glass Pattern

iOS 18 style with vibrancy:

```jsx
className="
  bg-white/[0.15] dark:bg-white/[0.10]
  backdrop-blur-3xl backdrop-saturate-[1.8]
  shadow-liquid rounded-3xl
"
```

Use for: Buttons, cards, floating UI
Avoid for: Dense text, data tables

---

## Quick Reference

```jsx
// Card with header
<Card>
  <Heading level={2} variant="ember">Title</Heading>
  <Text variant="secondary">Content</Text>
  <Button variant="ember">Action</Button>
</Card>

// Status badge
<StatusBadge status="IN FUNZIONE" pulse />

// Banner
<Banner variant="warning" title="Attenzione" description="..." />
```

---

## See Also

- [UI Components](./ui-components.md) - Component API
- [Patterns](./patterns.md) - Code patterns
