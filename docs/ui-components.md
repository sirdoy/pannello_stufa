# UI Components

Componenti UI con liquid glass style iOS 18 e dark mode.

**Live preview**: `/debug/design-system`

---

## Dark Mode Base

```css
/* Glass backgrounds */
bg-white/[0.08] dark:bg-white/[0.05]   /* Cards */
bg-white/[0.12] dark:bg-white/[0.08]   /* Hover */

/* Text */
text-neutral-900 dark:text-white       /* Primary */
text-neutral-600 dark:text-neutral-400 /* Secondary */

/* Borders */
ring-white/15 dark:ring-white/08
```

---

## Components

### Card

```jsx
<Card liquid className="p-6">Content</Card>
```

| Prop | Default | Values |
|------|---------|--------|
| `liquid` | false | iOS glass style |
| `glass` | false | Legacy glass |

### Button

```jsx
<Button liquid variant="primary" size="md" icon="🔥">Accendi</Button>
```

| Prop | Default | Values |
|------|---------|--------|
| `variant` | primary | primary, secondary, success, danger, accent, outline, ghost |
| `size` | md | sm, md, lg |
| `liquid` | false | Glass style |
| `icon` | - | Emoji/icon |
| `disabled` | false | - |

### ControlButton

Bottone +/- per controlli numerici.

```jsx
<ControlButton type="increment" variant="info" disabled={value >= max} />
```

| Prop | Values |
|------|--------|
| `type` | increment, decrement |
| `variant` | info (blu), warning (arancio), success, danger, neutral |
| `size` | sm, md, lg |

### Banner

```jsx
<Banner liquid variant="warning" title="Attenzione" description="Messaggio" />
```

| Prop | Values |
|------|--------|
| `variant` | info, warning, error, success |
| `dismissible` | Show close button |
| `actions` | JSX buttons |

### Toast

```jsx
<Toast message="Operazione completata" variant="success" duration={3000} onDismiss={fn} />
```

Auto-dismiss. Position: fixed top-center.

### LoadingOverlay

```jsx
<LoadingOverlay message="Caricamento..." icon="⏳" />
```

Full-page blocking overlay con glass style.

### Select

```jsx
<Select liquid value={v} onChange={fn} options={[{value, label}]} />
```

Dropdown con z-index ottimizzato.

### Input

```jsx
<Input liquid type="text" placeholder="..." value={v} onChange={fn} />
```

### Skeleton

```jsx
<Skeleton className="h-6 w-full" />
```

Loading placeholder con pulse animation.

---

## Layout Components

### Section

```jsx
<Section title="Titolo" description="Desc" spacing="section">
  {children}
</Section>
```

Spacing: `card` (16px), `inline` (8px), `section` (32px)

### Grid

```jsx
<Grid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="large">
  {items}
</Grid>
```

Gap: `small`, `medium`, `large` (responsive)

---

## Typography

### Heading

```jsx
<Heading level={2} variant="ember">Titolo</Heading>
```

| Prop | Values |
|------|--------|
| `level` | 1-6 (semantic h1-h6) |
| `variant` | default, gradient, subtle, ember |

### Text

```jsx
<Text variant="secondary">Descrizione</Text>
```

Variants: `body`, `secondary`, `tertiary`

---

## Primitives

### Icon

```jsx
<Icon icon={Flame} size={24} label="Stufa" />
```

Wrapper lucide-react con ARIA support.

### Divider

```jsx
<Divider label="Sezione" variant="gradient" spacing="large" />
```

Variants: `solid`, `dashed`, `gradient`

### EmptyState

```jsx
<EmptyState icon="🏠" title="Nessun dispositivo" action={<Button>Aggiungi</Button>} />
```

---

## Liquid Glass Pattern

```jsx
className="bg-white/[0.08] backdrop-blur-3xl shadow-liquid-sm ring-1 ring-white/20 ring-inset"
```

Shadow variants (tailwind.config.js):
- `shadow-liquid-sm` - Buttons, inputs
- `shadow-liquid` - Cards
- `shadow-liquid-lg` - Modals

---

## Navbar

Mobile-first con iOS-style bottom navigation.

- **Desktop** (≥1024px): Top horizontal
- **Mobile** (<1024px): Bottom nav + hamburger menu

### Mobile Menu Pattern

```jsx
// Body scroll lock
useEffect(() => {
  document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
  return () => { document.body.style.overflow = 'unset'; };
}, [mobileMenuOpen]);
```

Auto-close: route change + ESC key

---

## Import

```jsx
import { Section, Grid, Heading, Text, Card, Button } from '@/components/ui';
```

---

## See Also

- [Design System](./design-system.md) - Palette, shadows, animations
- [Patterns](./patterns.md) - Modal, dropdown patterns
