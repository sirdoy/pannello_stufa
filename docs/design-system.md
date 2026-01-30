# Design System - Ember Noir v3.0

Dark-first design system with warm accents and WCAG AA accessibility.

**Live Preview**: `/debug/design-system` (interactive examples with copy-to-clipboard)

---

## Quick Start

Use design system components instead of raw HTML:

```jsx
// Correct - use component props for styling
import { Heading, Text, Button, Card } from '@/app/components/ui';

<Heading level={2} variant="ember">Title</Heading>
<Text variant="secondary">Description</Text>
<Button variant="ember">Primary Action</Button>
<Card variant="elevated" hover>Content</Card>

// Wrong - never use raw HTML or inline color classes
<h2 className="text-ember-400">Title</h2>
<p className="text-slate-300">Description</p>
```

### Import Pattern

```jsx
// Preferred: Named imports
import { Button, Card, Heading } from '@/app/components/ui';

// Namespace components
import { Button, Card, SmartHomeCard } from '@/app/components/ui';
// Use: Button.Icon, Card.Header, SmartHomeCard.Status
```

---

## Philosophy

1. **Dark Foundation** - Warm charcoal (slate), not cold black
2. **Ember Accents** - Copper/amber (#ed6f10) signature color
3. **Organic Shapes** - Generous border radius (12-20px)
4. **Layered Depth** - Subtle gradients and shadows
5. **Accessibility First** - WCAG AA compliant, full keyboard navigation

---

## Components by Category

### Form Controls

| Component | Description | Key Props |
|-----------|-------------|-----------|
| Button | Primary action button with gradient variants | `variant`, `size`, `loading`, `disabled`, `icon`, `iconPosition`, `fullWidth` |
| Button.Icon | Icon-only button | `icon`, `aria-label` (required), `variant`, `size` |
| Button.Group | Button group container | `children` |
| Checkbox | Checkbox with Radix primitives | `checked`, `onCheckedChange`, `label`, `indeterminate`, `variant`, `size` |
| Switch | Toggle switch for settings | `checked`, `onCheckedChange`, `label`, `variant`, `size` |
| Input | Text input with validation | `label`, `icon`, `error`, `clearable`, `showCount`, `validate`, `maxLength` |
| Select | Dropdown with Radix primitives | `options`, `value`, `onChange`, `label`, `variant`, `placeholder` |
| Slider | Range slider | `value`, `onChange`, `min`, `max`, `step`, `range`, `aria-label` (required) |
| Label | Accessible form label | `size`, `variant`, `htmlFor` |

### Feedback

| Component | Description | Key Props |
|-----------|-------------|-----------|
| Modal | Dialog with focus trap | `isOpen`, `onClose`, `size` |
| Modal.Header | Dialog header area | `children` |
| Modal.Title | Dialog title | `children` |
| Modal.Close | Close button | - |
| Modal.Description | Dialog description | `children` |
| Modal.Footer | Dialog footer area | `children` |
| Toast | Notification with auto-dismiss | `variant`, `title`, `children`, `action`, `duration` |
| Banner | Alert banner | `variant`, `title`, `description`, `dismissible`, `dismissKey`, `compact` |
| Tooltip | Contextual tooltip | `content`, `side`, `sideOffset` |
| Spinner | Loading indicator | `size`, `variant`, `label` |
| Progress | Progress bar | `value`, `max`, `variant`, `size`, `label`, `indeterminate` |
| EmptyState | Empty content placeholder | `icon`, `title`, `description`, `action`, `size` |

### Layout

| Component | Description | Key Props |
|-----------|-------------|-----------|
| Card | Container card | `variant`, `hover`, `glow`, `padding` |
| Card.Header | Card header area | `children` |
| Card.Title | Card title with optional icon | `icon`, `children` |
| Card.Content | Card main content | `children` |
| Card.Divider | Visual separator | - |
| Card.Footer | Card actions area | `children` |
| PageLayout | Page structure wrapper | `header`, `footer`, `maxWidth`, `padding`, `centered` |
| PageLayout.Header | Page header with title | `title`, `description`, `actions` |
| PageLayout.Footer | Page footer | `children` |
| Section | Semantic section with title | `title`, `subtitle`, `description`, `spacing`, `level`, `action`, `as` |
| Grid | Responsive grid | `cols`, `gap`, `as` |
| Divider | Content separator | `variant`, `spacing`, `label`, `orientation` |

### Smart Home

| Component | Description | Key Props |
|-----------|-------------|-----------|
| Badge | Status badge with pulse | `variant`, `size`, `pulse`, `icon` |
| ConnectionStatus | Online/offline indicator | `status`, `size`, `label`, `showDot` |
| HealthIndicator | Health status display | `status`, `size`, `label`, `showIcon`, `pulse` |
| SmartHomeCard | Device card base | `icon`, `title`, `colorTheme`, `size`, `isLoading`, `error`, `disabled` |
| SmartHomeCard.Header | Card header area | `children` |
| SmartHomeCard.Status | Status indicators area | `children` |
| SmartHomeCard.Controls | Controls area | `children` |
| StatusCard | Extends SmartHomeCard | `status`, `statusVariant`, `connectionStatus` |
| DeviceCard | Full device card (legacy compatible) | `icon`, `title`, `colorTheme`, `connected`, `statusBadge`, `healthStatus`, `banners`, `infoBoxes`, `footerActions` |
| ControlButton | Increment/decrement button | `type`, `variant`, `size`, `onChange`, `step`, `haptic` |

### Typography

| Component | Description | Key Props |
|-----------|-------------|-----------|
| Heading | Semantic headings h1-h6 | `level`, `variant`, `size` |
| Text | Body text | `variant`, `size`, `weight`, `mono`, `uppercase`, `tracking`, `as` |
| Label | Form label (Radix primitive) | `size`, `variant`, `htmlFor` |

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

## Dark/Light Mode

**Dark-first approach** - Components render dark by default, with light mode overrides.

### Key Mappings

| Property | Dark | Light |
|----------|------|-------|
| Background | slate-950/900 | slate-50/100 |
| Text primary | slate-200 | slate-900 |
| Text secondary | slate-400 | slate-600 |
| Borders | white/[0.06] | slate-200 |
| Ember accent | ember-400 | ember-700 |

### Pattern

Use `[html:not(.dark)_&]:` for light mode overrides:

```jsx
// Internal component pattern (already built-in)
className="text-slate-200 [html:not(.dark)_&]:text-slate-800"
className="bg-slate-900 [html:not(.dark)_&]:bg-slate-100"
```

**Always use variants, never raw color classes:**

```jsx
// Correct
<Heading level={2} variant="ember">Title</Heading>
<Text variant="secondary">Description</Text>

// Wrong
<h2 className="text-ember-400">Title</h2>
```

---

## Component Patterns

### CVA Variants

All components use class-variance-authority (CVA) for type-safe variants:

```jsx
// Button variants
<Button variant="ember">Primary</Button>
<Button variant="subtle">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="danger">Destructive</Button>
<Button variant="outline">Outlined</Button>
<Button variant="success">Success</Button>

// Card variants
<Card variant="default">Standard card</Card>
<Card variant="glass">Glass/blur effect</Card>
<Card variant="elevated">Elevated shadow</Card>
<Card variant="outlined">Outlined border</Card>
<Card variant="subtle">Subtle background</Card>

// Badge variants
<Badge variant="ember" pulse>Active</Badge>
<Badge variant="sage">Online</Badge>
<Badge variant="ocean">Info</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="neutral">Inactive</Badge>
```

### Namespace Components

Compound components use namespace pattern for better organization:

```jsx
// Button namespace
<Button.Icon icon={<SettingsIcon />} aria-label="Settings" />
<Button.Group>
  <Button variant="subtle">Cancel</Button>
  <Button variant="ember">Confirm</Button>
</Button.Group>

// Card namespace
<Card variant="elevated" hover>
  <Card.Header>
    <Card.Title icon="🔥">Thermostat</Card.Title>
  </Card.Header>
  <Card.Content>
    <p>Current temperature: 22C</p>
  </Card.Content>
  <Card.Divider />
  <Card.Footer>
    <Button variant="ember">Adjust</Button>
  </Card.Footer>
</Card>

// SmartHomeCard namespace
<SmartHomeCard icon="🌡️" title="Thermostat" colorTheme="ember">
  <SmartHomeCard.Status>
    <Badge variant="sage">Online</Badge>
    <ConnectionStatus status="online" />
  </SmartHomeCard.Status>
  <SmartHomeCard.Controls>
    <Slider value={temp} onChange={setTemp} aria-label="Temperature" />
  </SmartHomeCard.Controls>
</SmartHomeCard>
```

### Layout Pattern

Standard page structure:

```jsx
<PageLayout
  maxWidth="7xl"
  header={
    <PageLayout.Header
      title="Dashboard"
      description="Overview of your devices"
      actions={<Button variant="ember">Add Device</Button>}
    />
  }
>
  <Section title="I tuoi dispositivi" level={1} spacing="lg">
    <Grid cols={3} gap="md">
      <Card>Device 1</Card>
      <Card>Device 2</Card>
      <Card>Device 3</Card>
    </Grid>
  </Section>

  <Section title="Impostazioni" level={2} spacing="md">
    <Card>Settings content</Card>
  </Section>
</PageLayout>
```

### Form Pattern

Form controls with proper labeling:

```jsx
<form>
  <Input
    label="Email"
    type="email"
    icon="@"
    error={emailError}
    clearable
    placeholder="Enter email..."
  />

  <Select
    label="Schedule"
    options={[
      { value: 'home', label: 'Home' },
      { value: 'away', label: 'Away' },
    ]}
    value={schedule}
    onChange={(e) => setSchedule(e.target.value)}
  />

  <Checkbox
    checked={acceptTerms}
    onCheckedChange={setAcceptTerms}
    label="Accept terms and conditions"
  />

  <Switch
    checked={notifications}
    onCheckedChange={setNotifications}
    label="Enable notifications"
  />

  <Button type="submit" variant="ember">
    Save
  </Button>
</form>
```

### Toast/Notification Pattern

Using the ToastProvider context:

```jsx
// In layout or app
<ToastProvider>
  {children}
</ToastProvider>

// In component
const { success, error, info, warning } = useToast();

success('Settings saved successfully!');
error('Failed to save settings', { duration: 8000 });
info('New version available', {
  action: { label: 'Refresh', onClick: refresh }
});
```

---

## Typography

### Fonts

```css
--font-display: 'Outfit', system-ui;    /* Headings */
--font-body: 'Space Grotesk', system-ui; /* Body */
```

### Heading Sizes

| Level | Default Size | Visual Size |
|-------|--------------|-------------|
| h1 | 3xl | 30-36px |
| h2 | 2xl | 24-30px |
| h3 | xl | 20-24px |
| h4 | lg | 18px |
| h5 | md | 16px |
| h6 | sm | 14px |

### Text Variants

```jsx
<Text variant="body">Primary body text</Text>
<Text variant="secondary">Secondary text</Text>
<Text variant="tertiary" size="sm">Tertiary/caption text</Text>
<Text variant="label">LABEL TEXT</Text>
<Text variant="ember">Accent text</Text>
```

---

## Spacing & Radius

### Spacing Scale

```css
4   16px   /* Card padding */
6   24px   /* Section spacing */
8   32px   /* Large sections */
```

### Border Radius

```css
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

### Glass Effect

```css
--shadow-liquid-sm: 0 4px 16px rgba(0,0,0,0.06);
--shadow-liquid:    0 8px 32px rgba(0,0,0,0.08);
--shadow-liquid-lg: 0 16px 48px rgba(0,0,0,0.12);
```

---

## Animations

### Timing

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Duration Guidelines

| Type | Duration |
|------|----------|
| Color transitions | 200ms |
| Hover effects | 200ms |
| Modals/overlays | 250ms |
| Page transitions | 300ms |

### Animation Classes

```jsx
animate-fade-in      /* Opacity fade */
animate-scale-in     /* Scale from 95% */
animate-slide-down   /* Slide from top */
animate-shimmer      /* Skeleton loading */
animate-pulse-ember  /* Ember glow pulse */
```

---

## Responsive Breakpoints

```css
sm:  640px   /* Small devices */
md:  768px   /* Tablets */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large screens */
```

### Mobile-First Pattern

```jsx
// Padding increases with screen size
<div className="p-4 sm:p-5 lg:p-6">

// Grid columns increase with screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Use Grid component for common patterns
<Grid cols={3} gap="md">
  {/* Auto-responsive: 1 col mobile, 2 col md, 3 col lg */}
</Grid>
```

---

## Accessibility

See [accessibility.md](./accessibility.md) for complete accessibility guide.

Key principles:

- **Keyboard First** - All interactive components fully navigable with keyboard
- **Screen Reader Friendly** - Proper ARIA labels and live regions
- **Visible Focus** - Ember glow focus indicators
- **Respects User Preferences** - `prefers-reduced-motion` honored
- **Touch Accessible** - 44px minimum touch targets
- **Color Contrast** - WCAG AA compliant (4.5:1 text, 3:1 large/UI)

---

## Quick Reference

### Device Card Pattern

```jsx
<DeviceCard
  icon="🔥"
  title="Thermostat"
  colorTheme="ember"
  connected={isConnected}
  onConnect={handleConnect}
  statusBadge={{ label: 'HEATING', color: 'ember' }}
  healthStatus="ok"
  banners={[
    { variant: 'warning', title: 'Maintenance due' }
  ]}
  footerActions={[
    { label: 'Settings', variant: 'subtle', onClick: openSettings }
  ]}
>
  <Slider
    value={temperature}
    onChange={setTemperature}
    min={15}
    max={30}
    aria-label="Temperature"
  />
</DeviceCard>
```

### Status Display Pattern

```jsx
<div className="flex items-center gap-2">
  <Badge variant="ember" pulse>ACCESO</Badge>
  <ConnectionStatus status="online" />
  <HealthIndicator status="ok" />
</div>
```

### Control Pattern

```jsx
<div className="flex items-center gap-4">
  <ControlButton
    type="decrement"
    onChange={(delta) => setBrightness(Math.max(0, brightness + delta))}
    step={5}
    disabled={brightness <= 0}
  />
  <span className="text-2xl">{brightness}%</span>
  <ControlButton
    type="increment"
    onChange={(delta) => setBrightness(Math.min(100, brightness + delta))}
    step={5}
    disabled={brightness >= 100}
  />
</div>
```

---

## See Also

- `/debug/design-system` - Live interactive examples with copy-to-clipboard
- [Accessibility Guide](./accessibility.md) - Keyboard navigation, ARIA, screen readers
- [API Routes](./api-routes.md) - Backend API documentation
- [Architecture](./architecture.md) - System architecture overview
