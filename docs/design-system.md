# Design System

Palette colori, styling standards e best practices.

## Palette Colori Semantici

Tutti i colori hanno scala completa 50-900 (10 tonalità ciascuno).

### Primary/Danger (Rosso)

```css
primary-50    #fef2f2
primary-100   #fee2e2
...
primary-500   #ef4444  /* Base */
...
primary-900   #7f1d1d
```

**Uso**: Azioni primarie, errori critici, pulsanti principali.

### Accent (Arancione)

```css
accent-50     #fff7ed
accent-100    #ffedd5
...
accent-500    #f97316  /* Base */
...
accent-900    #7c2d12
```

**Uso**: Accenti, highlight, badges, notifiche.

### Success (Verde)

```css
success-50    #f0fdf4
success-100   #dcfce7
...
success-500   #22c55e  /* Base */
...
success-900   #14532d
```

**Uso**: Successo, conferme, status positivi.

### Warning (Giallo-Arancio)

```css
warning-50    #fffbeb
warning-100   #fef3c7
...
warning-500   #f59e0b  /* Base */
...
warning-900   #78350f
```

**Uso**: Attenzioni, alert non critici, maintenance near limit.

### Info (Blu)

```css
info-50       #eff6ff
info-100      #dbeafe
...
info-500      #3b82f6  /* Base */
...
info-900      #1e3a8a
```

**Uso**: Informazioni, note, device termostato.

### Neutral (Grigio)

```css
neutral-50    #fafafa
neutral-100   #f5f5f5
...
neutral-500   #737373  /* Base */
...
neutral-900   #171717
```

**Uso**: Testi, bordi, background, elementi neutrali.

**⚠️ IMPORTANTE**: Usare SOLO `neutral-*`, MAI `gray-*`.

## Background Globale

**SEMPRE** usa background globale definito in `globals.css`. **MAI** override custom nelle pagine.

```css
/* globals.css */
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
}
```

**Consistenza**: Background gradient violetto in tutta l'app.

## Typography Scale

### Headings

```jsx
<h1 className="text-4xl font-bold">H1 Title</h1>
<h2 className="text-3xl font-bold">H2 Title</h2>
<h3 className="text-2xl font-bold">H3 Title</h3>
<h4 className="text-xl font-bold">H4 Title</h4>
```

### Body Text

```jsx
<p className="text-base">Normal text</p>
<p className="text-sm">Small text</p>
<p className="text-xs">Extra small</p>
```

### Font Weights

- `font-normal` - Regular text (400)
- `font-medium` - Semi-bold (500)
- `font-semibold` - Semi-bold (600)
- `font-bold` - Bold headings (700)

## Spacing Scale

Tailwind default spacing scale (4px base unit):

```
0   0px
1   4px    (0.25rem)
2   8px    (0.5rem)
3   12px   (0.75rem)
4   16px   (1rem)
5   20px   (1.25rem)
6   24px   (1.5rem)
8   32px   (2rem)
10  40px   (2.5rem)
12  48px   (3rem)
```

**Common usages**:
- `gap-4` - Grid/flex gap (16px)
- `p-6` - Card padding (24px)
- `mb-4` - Bottom margin (16px)
- `space-y-6` - Vertical stack spacing (24px)

## Border Radius

```jsx
rounded-none   0px
rounded-sm     2px
rounded        4px    /* Default */
rounded-md     6px
rounded-lg     8px
rounded-xl     12px
rounded-2xl    16px
rounded-full   9999px
```

**Common usages**:
- `rounded-lg` - Cards, buttons (8px)
- `rounded-full` - Badges, avatar (circle)
- `rounded-xl` - Modals, panels (12px)

## Shadows (Liquid Glass)

Custom shadows definite in `tailwind.config.js`:

```javascript
shadow: {
  'liquid-sm': '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  'liquid': '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
  'liquid-lg': '0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
  'liquid-xl': '0 16px 64px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12)',
}
```

**Uso**:
- `shadow-liquid-sm` - Buttons, input
- `shadow-liquid` - Cards, dropdowns
- `shadow-liquid-lg` - Modals, panels
- `shadow-liquid-xl` - Hero sections

Vedi [UI Components - Liquid Glass Style](./ui-components.md#liquid-glass-style-pattern).

## Z-Index Layers

Gerarchia z-index consistente:

```
z-0         Base layer
z-10        Elevated elements (cards)
z-20        Sticky headers
z-30        Fixed navigation
z-40
z-50        Navbar
z-[100]     Dropdowns, tooltips
z-[101]     Mobile menu panel
z-[1000]    Modals backdrop
z-[1001]    Modals content
z-[10000]   Critical alerts backdrop
z-[10001]   Critical alerts content
```

**Best Practice**: Usa valori predefiniti. Evita valori custom se possibile.

## Responsive Breakpoints

```javascript
// tailwind.config.js
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

**Common usages**:
- `md:hidden` - Hide on tablet+
- `lg:flex` - Show flex on desktop
- `xl:max-w-[120px]` - Wider on large screens

Vedi [UI Components - Responsive Breakpoints](./ui-components.md#responsive-breakpoints-strategy).

## Styling Hierarchy

1. **Tailwind Inline** (~95% codice) - Preferenza primaria
2. **CSS Modules** (animazioni specifiche) - File `.module.css` stessa directory
3. **globals.css** (SOLO base + stili globali) - Mantieni minimo (~13 righe)

### Quando Usare

**Tailwind Inline**:
```jsx
<div className="p-6 bg-white rounded-lg shadow-liquid">
  Content
</div>
```

**CSS Modules** (animazioni, stati complessi):
```css
/* Component.module.css */
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
```

```jsx
import styles from './Component.module.css';

<div className={styles.shimmer}>
  Animated content
</div>
```

**globals.css** (solo base globali):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply text-neutral-900;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-attachment: fixed;
  }
}
```

### Decision Tree

- Stile **UN** componente → CSS Module
- Stile **PIÙ** componenti → Tailwind custom in `tailwind.config.js`
- Stile **globale** → `globals.css` in `@layer base`

## Accessibility

### Color Contrast

Tutte le combinazioni colori rispettano WCAG AA:

```jsx
{/* ✅ Good contrast */}
<div className="bg-primary-500 text-white">Text</div>
<div className="bg-neutral-100 text-neutral-900">Text</div>

{/* ❌ Poor contrast */}
<div className="bg-warning-200 text-white">Text</div>  // Too light
```

### Focus States

Tutti gli elementi interattivi devono avere focus visibile:

```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500">
  Button
</button>
```

### Semantic HTML

Usa sempre HTML semantico:

```jsx
{/* ✅ Semantic */}
<nav>...</nav>
<main>...</main>
<article>...</article>

{/* ❌ Non-semantic */}
<div className="nav">...</div>
<div className="main">...</div>
```

## Animation Guidelines

### Durations

```css
transition-none     0ms
transition-fast     150ms   /* Micro-interactions */
transition          200ms   /* Default hover/focus */
transition-slow     300ms   /* Collapse/expand */
```

**Common usages**:
- Hover states: `transition-fast` (150ms)
- Dropdown open: `transition` (200ms)
- Collapse/expand: `transition-slow` (300ms)

### Easing

```css
ease-linear
ease-in
ease-out
ease-in-out    /* Default, most natural */
```

**Best Practice**: Usa `ease-in-out` per transizioni naturali.

## Icons & Emoji

**Preferenza**: Emoji per icone semplici (cross-platform, zero dependencies).

```jsx
<Button icon="🔥">Accendi</Button>
<Card>🌡️ Termostato</Card>
```

**Alternative**: React Icons o Heroicons per icone complesse.

## Dark Mode

**Attualmente**: Non implementato. Background gradient fisso.

**Future**: Sistema dark mode con Tailwind `dark:` variants.

## See Also

- [UI Components](./ui-components.md) - Componenti con design system
- [Patterns](./patterns.md) - Pattern styling comuni

---

**Last Updated**: 2025-10-21
