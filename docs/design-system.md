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
<Button disabled>Disabled</Button>  // opacity-70 for better visibility
```

**Disabled State:**
- Opacity reduced to `70%` (not 50%) for better readability with subtle variants
- Cursor changes to `not-allowed`
- All hover effects disabled
- Works well with all variants including `subtle`

### Banner

```jsx
// Info banner - ALWAYS use description prop for styled text
<Banner
  variant="info"
  title="Note"
  description="Styled message with proper dark mode colors"
/>

// Warning banner
<Banner
  variant="warning"
  title="Attention"
  description="Important warning message"
/>

// Error banner
<Banner variant="error" description="Error message without title" />

// Success banner
<Banner variant="success">
  Unstyled children text (not recommended)
</Banner>

// Ember highlight banner
<Banner variant="ember" title="Highlighted" description="..." />

// Dismissible with persistent storage
<Banner dismissible dismissKey="unique-key" description="..." />

// Compact layout
<Banner compact variant="info" description="..." />
```

**Important:**
- **Always use `description` prop** - applies proper dark/light mode colors automatically
- Using `children` directly will NOT apply variant-specific text colors
- `description` prop is styled with `text-{variant}-300` (dark) and `text-{variant}-700` (light)

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

### Input

```jsx
// Basic input
<Input
  label="Email"
  placeholder="Enter email..."
  icon="📧"
/>

// Input with variant (focus color)
<Input
  label="Name"
  variant="ember"  // default|ember|ocean
  placeholder="Enter name..."
/>

// Input with helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// Input with error
<Input
  label="Username"
  error="This field is required"
  placeholder="Enter username..."
/>

// Disabled input
<Input
  label="Locked Field"
  disabled
  value="Cannot edit"
/>
```

**Props:**
- `type` - Input type (text, password, email, etc.) - default: 'text'
- `label` - Label text (optional)
- `icon` - Emoji icon (optional)
- `variant` - Focus ring color: 'default' | 'ember' | 'ocean' - default: 'default'
- `error` - Error message (displays below input in red)
- `helperText` - Helper text (displays below input in muted color)
- `disabled` - Disabled state (opacity-50, cursor-not-allowed)
- `className` - Additional classes for input
- `containerClassName` - Additional classes for container

**Styling:**
- Dark mode: `bg-slate-800/60 border-slate-700/50 text-slate-100`
- Light mode: `bg-white/80 border-slate-300/60 text-slate-900`
- Focus: `ring-2 ring-ember-500/50 border-ember-500/60` (or ocean variant)
- Rounded: `rounded-xl` (12px)
- Min height: iOS touch target compliant

### Toggle

```jsx
// Basic toggle
<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable notifications"
/>

// Toggle variants (color when checked)
<Toggle checked={true} onChange={() => {}} label="Ember" variant="ember" />
<Toggle checked={true} onChange={() => {}} label="Ocean" variant="ocean" />
<Toggle checked={true} onChange={() => {}} label="Sage" variant="sage" />

// Toggle sizes
<Toggle checked={false} onChange={() => {}} label="Small" size="sm" />   // h-6 w-11
<Toggle checked={false} onChange={() => {}} label="Medium" size="md" />  // h-8 w-14 (default)
<Toggle checked={false} onChange={() => {}} label="Large" size="lg" />   // h-10 w-18

// Disabled toggle
<Toggle checked={false} onChange={() => {}} label="Disabled" disabled />
```

**Props:**
- `checked` - Toggle state (boolean) - required
- `onChange` - Change handler function(newValue) - required
- `label` - Accessible label (required for a11y, not visible but used by screen readers)
- `disabled` - Disabled state (opacity-50, cursor-not-allowed)
- `size` - Size variant: 'sm' | 'md' | 'lg' - default: 'md'
- `variant` - Color when checked: 'ember' | 'ocean' | 'sage' - default: 'ember'
- `className` - Additional classes for layout

**Styling:**
- Checked: Gradient background (`bg-gradient-to-r from-ember-500 to-flame-600`)
- Unchecked: `bg-slate-700` (dark) / `bg-slate-300` (light)
- Switch handle: `bg-white` with shadow
- Transition: `duration-200` smooth animation
- Focus ring: `ring-2 ring-ember-500/50`

### Select

```jsx
// Basic select
<Select
  label="Select Option"
  icon="🎯"
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
    { value: '4', label: 'Disabled Option', disabled: true },
  ]}
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
/>

// Select with variant
<Select
  label="Ocean Select"
  variant="ocean"
  options={[...]}
  value={value}
  onChange={handler}
/>

// Disabled select
<Select
  label="Locked Select"
  disabled
  options={[...]}
  value={value}
  onChange={() => {}}
/>
```

**Props:**
- `label` - Label text (optional)
- `icon` - Emoji icon (optional)
- `options` - Array of `{value, label, disabled?}` objects - required
- `value` - Selected value - required
- `onChange` - Change handler function(syntheticEvent) - required
- `disabled` - Disabled state (opacity-50, cursor-not-allowed)
- `variant` - Color variant: 'default' | 'ember' | 'ocean' - default: 'default'
- `className` - Additional classes for trigger button
- `containerClassName` - Additional classes for container

**Styling:**
- Dark mode: `bg-slate-800/60 border-slate-700/50 text-slate-100`
- Light mode: `bg-white/80 border-slate-300/60 text-slate-900`
- Focus: `ring-2 ring-ember-500/50 border-ember-500/60`
- Dropdown: `bg-slate-800/95 backdrop-blur-2xl` (dark) / `bg-white/95` (light)
- Selected option: Colored background with checkmark
- Border radius: `rounded-xl` (trigger + dropdown)

**Features:**
- Auto-positioning: Opens upward if insufficient space below
- Outside click detection: Closes dropdown automatically
- Keyboard accessible: Full ARIA support
- Checkmark on selected option
- Disabled option support
- Smooth animations: `animate-dropdown` / `animate-dropdown-up`

### Modal

```jsx
// Basic modal
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
>
  <Card>
    <CardHeader>
      <CardTitle icon="🪟">Modal Title</CardTitle>
    </CardHeader>
    <CardContent>
      <Text variant="secondary">Modal content here...</Text>
    </CardContent>
    <CardFooter>
      <ButtonGroup>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="ember" onClick={onConfirm}>Confirm</Button>
      </ButtonGroup>
    </CardFooter>
  </Card>
</Modal>

// Modal with custom max width
<Modal
  isOpen={showModal}
  onClose={onClose}
  maxWidth="max-w-2xl"
>
  ...
</Modal>

// Modal without overlay close
<Modal
  isOpen={showModal}
  onClose={onClose}
  closeOnOverlayClick={false}
>
  ...
</Modal>
```

**Props:**
- `isOpen` - Modal visibility state (boolean) - required
- `onClose` - Close handler function - required
- `children` - Modal content (typically a Card component)
- `maxWidth` - Tailwind max-width class - default: 'max-w-lg'
- `closeOnOverlayClick` - Close on backdrop click - default: true
- `closeOnEscape` - Close on Escape key - default: true

**Features:**
- React Portal: Renders at document body level (z-index isolation)
- Scroll Lock: Prevents body scroll when modal is open
- Backdrop Overlay: `bg-black/60 backdrop-blur-sm`
- Escape Key Support: Closes modal automatically
- Click Outside: Optional overlay click to close
- Animations: `animate-fade-in` (backdrop) + `animate-scale-in-center` (content)
- Accessibility: Focus trap, proper ARIA attributes

**Styling:**
- Backdrop: `fixed inset-0 bg-black/60 backdrop-blur-sm`
- Container: `flex items-center justify-center p-4`
- Content wrapper: `relative w-full {maxWidth}`
- Z-index: `z-[9999]` for top-level rendering

### Toast

```jsx
// Success toast
<Toast
  message="Operation completed successfully!"
  variant="success"
  duration={5000}
  onDismiss={() => setShowToast(false)}
/>

// Warning toast (persistent)
<Toast
  message="Please review the settings"
  variant="warning"
  duration={0}  // 0 = no auto-dismiss
  onDismiss={handleDismiss}
/>

// Custom icon
<Toast
  message="Custom notification"
  icon="🎉"
  variant="ember"
  duration={3000}
/>

// Positioning (manual)
<div className="fixed bottom-4 right-4 z-50 max-w-md">
  <Toast {...props} />
</div>
```

**Props:**
- `message` - Toast message text - required
- `variant` - Toast variant: 'success' | 'warning' | 'info' | 'error' | 'ember' | 'ocean' | 'sage' | 'danger' - default: 'info'
- `icon` - Custom emoji icon (optional, auto-icon if not provided)
- `duration` - Auto-dismiss duration in ms (0 to disable auto-dismiss) - default: 5000
- `onDismiss` - Dismiss handler function - required

**Styling:**
- Variants map to semantic colors:
  - `success` / `sage`: Green tones
  - `warning`: Yellow tones
  - `error` / `danger`: Red tones
  - `info` / `ocean`: Blue tones
  - `ember`: Copper/amber tones
- Structure: `bg-{variant}-900/80 border-{variant}-500/50`
- Border radius: `rounded-xl`
- Animation: `animate-slide-in-from-bottom`
- Progress bar: Auto-dismiss countdown indicator

**Features:**
- Auto Icons: ✓ (success), ⚠️ (warning), ℹ️ (info), ❌ (error), 🔥 (ember)
- Auto-Dismiss: Configurable timer with visual progress bar
- Manual Dismiss: Close button always available
- Smooth Animations: Slide in from bottom + fade out
- Z-Index: Designed for `z-50` or higher (app responsibility)

**Important:**
- Toast does NOT handle positioning - wrap in fixed container yourself
- Common pattern: `fixed bottom-4 right-4 z-50 max-w-md`

### Skeleton

```jsx
// Basic skeletons
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-4 w-1/2" />

// Card skeleton
<Skeleton.Card className="p-6">
  <Skeleton className="h-6 w-1/2 mb-4" />
  <Skeleton className="h-4 w-full mb-2" />
  <Skeleton className="h-4 w-full mb-2" />
  <Skeleton className="h-4 w-3/4" />
</Skeleton.Card>

// Avatar skeleton
<Skeleton className="h-16 w-16 rounded-full" />

// Button skeleton
<Skeleton className="h-12 w-32 rounded-xl" />
```

**Props:**
- `className` - Tailwind classes for sizing and shape - required
- Use `h-*` for height, `w-*` for width, `rounded-*` for border radius

**Sub-Components:**
- `Skeleton.Card` - Card-styled skeleton wrapper with shimmer effect

**Styling:**
- Background: `bg-slate-800/40` (dark) / `bg-slate-200/60` (light)
- Animation: `animate-shimmer` - subtle shimmer effect
- Border radius: Inherits from className (e.g., `rounded-full`, `rounded-xl`)

**Usage Patterns:**
```jsx
// Text lines
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</div>

// Card placeholder
<Skeleton.Card className="p-6">
  <Skeleton className="h-6 w-1/2 mb-4" />  {/* Title */}
  <Skeleton className="h-4 w-full mb-2" />  {/* Line 1 */}
  <Skeleton className="h-4 w-full mb-2" />  {/* Line 2 */}
  <Skeleton className="h-4 w-3/4" />        {/* Line 3 */}
</Skeleton.Card>

// Mixed shapes
<div className="flex gap-4">
  <Skeleton className="h-16 w-16 rounded-full" />  {/* Avatar */}
  <div className="flex-1 space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
</div>
```

### Divider

```jsx
// Basic horizontal divider
<Divider />

// Variants
<Divider variant="solid" />
<Divider variant="dashed" />
<Divider variant="gradient" />

// With label
<Divider label="Settings" variant="gradient" />
<Divider label="Section" variant="solid" />

// Spacing
<Divider spacing="small" />   // my-4
<Divider spacing="medium" />  // my-6 (default)
<Divider spacing="large" />   // my-8

// Vertical divider
<div className="flex items-center gap-4">
  <span>Left</span>
  <Divider orientation="vertical" />
  <span>Right</span>
</div>
```

**Props:**
- `label` - Optional label text (centered with backdrop)
- `variant` - Visual style: 'solid' | 'dashed' | 'gradient' - default: 'solid'
- `spacing` - Margin spacing: 'small' | 'medium' | 'large' - default: 'medium'
- `orientation` - Direction: 'horizontal' | 'vertical' - default: 'horizontal'
- `className` - Additional classes for container

**Styling:**
- Solid: `bg-slate-700` (dark) / `bg-slate-300` (light)
- Dashed: `border-t-2 border-dashed border-slate-600` (dark) / `border-slate-300` (light)
- Gradient: `bg-gradient-to-r from-transparent via-slate-600/50 to-transparent`
- Label styling: `bg-slate-800/80 backdrop-blur-xl text-slate-300 border-slate-700/50` (dark)
- Height: `h-px` (horizontal), `w-px` (vertical)

**Features:**
- Horizontal: Full width line with optional centered label
- Vertical: Full height line for flex layouts
- Label: Backdrop blur glass effect with uppercase tracking
- Auto-spacing: Margin applied based on orientation and spacing prop

**Usage Patterns:**
```jsx
// Section separator
<section>
  <Content1 />
</section>
<Divider variant="gradient" spacing="large" />
<section>
  <Content2 />
</section>

// Labeled section
<Divider label="Account Settings" variant="gradient" />
<AccountForm />

// Vertical in toolbar
<div className="flex items-center gap-4">
  <Button>Action 1</Button>
  <Divider orientation="vertical" spacing="small" />
  <Button>Action 2</Button>
</div>
```

### ProgressBar

```jsx
// Basic progress bar
<ProgressBar value={75} variant="ember" label="Power" />

// Progress bar with custom content
<ProgressBar
  value={80}
  variant="ember"
  leftContent={<Text variant="ember" weight="semibold" size="sm">🔥 Power</Text>}
  rightContent={<Text variant="secondary" size="sm" weight="bold">80%</Text>}
/>

// Different variants
<ProgressBar value={60} variant="ocean" label="Loading" />
<ProgressBar value={85} variant="sage" label="Success" />
<ProgressBar value={40} variant="warning" label="Warning" />
<ProgressBar value={25} variant="danger" label="Critical" />

// Different sizes
<ProgressBar value={65} size="sm" label="Small" />   // h-2
<ProgressBar value={65} size="md" label="Medium" />  // h-3
<ProgressBar value={65} size="lg" label="Large" />   // h-4

// With animation (smooth transitions)
<ProgressBar value={70} animated label="Animated" />
```

**Props:**
- `value` - Progress value (0-100) - required
- `variant` - Color variant: 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' - default: 'ember'
- `size` - Bar height: 'sm' | 'md' | 'lg' - default: 'md'
- `animated` - Enable smooth transitions (500ms) - default: true
- `label` - Optional label above bar
- `leftContent` - Optional React node on left (icon, text)
- `rightContent` - Optional React node on right (value, text)
- `gradient` - Custom Tailwind gradient classes (overrides variant)
- `className` - Additional layout classes

**Styling:**
- Variants use Ember Noir palette gradients:
  - `ember`: `from-ember-400 via-ember-500 to-flame-600`
  - `ocean`: `from-ocean-400 via-ocean-500 to-ocean-600`
  - `sage`: `from-sage-400 via-sage-500 to-sage-600`
  - `warning`: `from-warning-400 via-warning-500 to-warning-600`
  - `danger`: `from-danger-400 via-danger-500 to-danger-600`
- Track background: `bg-slate-700/50` (dark) / `bg-slate-200/60` (light)
- Border radius: `rounded-full`
- Transition: `transition-all duration-500` (if animated)

**Usage Patterns:**
```jsx
// Power indicator
<ProgressBar
  value={powerLevel}
  variant="ember"
  leftContent={<Text variant="ember" weight="semibold" size="sm">🔥 Power</Text>}
  rightContent={<Text variant="secondary" size="sm" weight="bold">{powerLevel}%</Text>}
/>

// Maintenance tracking
<ProgressBar
  value={(hoursUsed / hoursLimit) * 100}
  variant="warning"
  leftContent={<Text variant="warning" weight="semibold" size="sm">⏱️ Maintenance</Text>}
  rightContent={<Text variant="warning" size="sm" weight="bold">{hoursUsed}h / {hoursLimit}h</Text>}
/>

// Simple loading
<ProgressBar value={loadingProgress} variant="ocean" label="Loading..." />
```

### EmptyState

```jsx
// Basic empty state
<EmptyState
  icon="🏠"
  title="Nessun dispositivo"
  description="Aggiungi dispositivi per iniziare."
/>

// With action button
<EmptyState
  icon="🔍"
  title="Nessun risultato"
  description="Prova a modificare i criteri di ricerca."
  action={<Button variant="subtle" size="sm">Cancella Filtri</Button>}
/>

// With custom icon component
<EmptyState
  icon={<CustomIcon />}
  title="Empty"
  description="Description here"
  action={<Button variant="ember">Action</Button>}
/>
```

**Props:**
- `icon` - Emoji string or React component for visual representation
- `title` - Heading text (uses Heading component level 3)
- `description` - Body text (uses Text component secondary variant)
- `action` - Optional React node (typically a Button component)
- `className` - Additional classes for container

**Styling:**
- Container: `text-center py-8`
- Icon: `text-6xl mb-4` (if emoji string)
- Title: Heading level 3, size lg, `mb-2`
- Description: Text secondary variant, `mb-6`
- Action: Rendered below description

**Usage Patterns:**
```jsx
// No devices
<EmptyState
  icon="🏠"
  title="Nessun dispositivo"
  description="Aggiungi dispositivi smart per iniziare."
  action={<Button variant="ember" icon="➕">Aggiungi Dispositivo</Button>}
/>

// No data available
<EmptyState
  icon="📋"
  title="Nessun dato disponibile"
  description="I dati verranno visualizzati qui una volta disponibili."
/>

// Search results empty
<EmptyState
  icon="🔍"
  title="Nessun risultato"
  description="Nessun elemento corrisponde ai criteri di ricerca."
  action={<Button variant="subtle" size="sm" onClick={clearFilters}>Cancella Filtri</Button>}
/>
```

### ConfirmDialog

```jsx
// Danger confirmation (delete action)
<ConfirmDialog
  isOpen={showDialog}
  title="Conferma eliminazione"
  message="Sei sicuro di voler eliminare questo elemento? L'azione non può essere annullata."
  confirmText="Elimina"
  cancelText="Annulla"
  confirmVariant="danger"
  icon="⚠️"
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>

// Success confirmation
<ConfirmDialog
  isOpen={showDialog}
  title="Conferma azione"
  message="Procedere con questa azione?"
  confirmText="Conferma"
  cancelText="Annulla"
  confirmVariant="ember"  // or 'success'
  icon="✓"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

**Props:**
- `isOpen` - Dialog visibility state (boolean) - required
- `title` - Dialog title - default: 'Conferma azione'
- `message` - Confirmation message - required
- `confirmText` - Confirm button text - default: 'Conferma'
- `cancelText` - Cancel button text - default: 'Annulla'
- `confirmVariant` - Confirm button variant: 'danger' | 'ember' | 'success' | etc. - default: 'danger'
- `icon` - Icon emoji - default: '⚠️'
- `onConfirm` - Confirm handler function - required
- `onCancel` - Cancel handler function - required

**Features:**
- Scroll Lock: Prevents body scroll when dialog is open
- Escape Key: Closes dialog on Escape key press
- Backdrop Click: Closes dialog when clicking outside (calls onCancel)
- Centered Modal: Uses Card component with elevated variant
- Animations: `animate-fadeIn` (backdrop) + `animate-scaleIn` (content)
- Accessibility: Proper ARIA attributes, focus management

**Styling:**
- Backdrop: `fixed inset-0 bg-slate-950/60 backdrop-blur-sm`
- Modal: `max-w-md w-full p-6` (Card elevated variant)
- Icon: `text-5xl mb-4` centered
- Title: Heading level 2, size xl
- Message: Text secondary variant
- Buttons: Full width, side-by-side layout

**Usage Patterns:**
```jsx
// Delete confirmation
const [showConfirm, setShowConfirm] = useState(false);

<Button variant="danger" onClick={() => setShowConfirm(true)}>Delete</Button>

<ConfirmDialog
  isOpen={showConfirm}
  title="Conferma eliminazione"
  message="Questa azione è permanente. Continuare?"
  confirmText="Elimina"
  confirmVariant="danger"
  onConfirm={() => {
    handleDelete();
    setShowConfirm(false);
  }}
  onCancel={() => setShowConfirm(false)}
/>

// Generic confirmation
<ConfirmDialog
  isOpen={showConfirm}
  title="Conferma"
  message="Vuoi salvare le modifiche?"
  confirmText="Salva"
  cancelText="Annulla"
  confirmVariant="ember"
  icon="💾"
  onConfirm={handleSave}
  onCancel={handleCancel}
/>
```

### BottomSheet

```jsx
// Basic bottom sheet
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Bottom Sheet Title"
  icon="📱"
>
  <div className="space-y-4">
    <Text variant="secondary">Content here...</Text>
    <Button variant="ember" className="w-full">Action</Button>
  </div>
</BottomSheet>

// Without title and close button
<BottomSheet
  isOpen={isOpen}
  onClose={onClose}
  showCloseButton={false}
>
  <CustomContent />
</BottomSheet>

// No drag handle
<BottomSheet
  isOpen={isOpen}
  onClose={onClose}
  showHandle={false}
  title="Sheet"
>
  <Content />
</BottomSheet>

// Prevent backdrop close
<BottomSheet
  isOpen={isOpen}
  onClose={onClose}
  closeOnBackdrop={false}
  title="Important Action"
>
  <Content />
</BottomSheet>
```

**Props:**
- `isOpen` - Sheet visibility state (boolean) - required
- `onClose` - Close handler function - required
- `children` - Sheet content - required
- `title` - Optional title header
- `icon` - Optional emoji icon for title
- `showCloseButton` - Show close button in header - default: true
- `showHandle` - Show drag handle bar - default: true
- `closeOnBackdrop` - Close when clicking backdrop - default: true
- `className` - Additional classes for content container
- `zIndex` - Base z-index - default: 8999

**Features:**
- React Portal: Renders at document body level (z-index isolation)
- Scroll Lock: Prevents body scroll, preserves scroll position
- Escape Key Support: Closes sheet on Escape key press
- Drag Handle: Visual indicator for swipe-to-close gesture (visual only)
- Backdrop Overlay: `bg-slate-950/60 backdrop-blur-sm`
- Max Height: `max-h-[85vh]` with overflow-y-auto
- Mobile-Optimized: Perfect for mobile interfaces and quick actions
- Animations: `animate-fadeIn` (backdrop) + `animate-slide-in-from-bottom` (sheet)

**Styling:**
- Backdrop: `fixed inset-0 bg-slate-950/60 backdrop-blur-sm`
- Sheet: `fixed inset-x-0 bottom-0 rounded-t-3xl`
- Background: `bg-slate-900/95 backdrop-blur-3xl` (dark) / `bg-white/95` (light)
- Border: `border-t border-slate-700/50` (dark) / `border-slate-200/50` (light)
- Padding: `p-6`
- Z-index: Backdrop = zIndex, Sheet = zIndex + 1

**Usage Patterns:**
```jsx
// Quick actions menu
const [showSheet, setShowSheet] = useState(false);

<Button onClick={() => setShowSheet(true)}>Open Actions</Button>

<BottomSheet
  isOpen={showSheet}
  onClose={() => setShowSheet(false)}
  title="Quick Actions"
  icon="⚡"
>
  <div className="space-y-2">
    <Button variant="ember" className="w-full">Primary Action</Button>
    <Button variant="subtle" className="w-full">Secondary Action</Button>
    <Button variant="ghost" className="w-full" onClick={() => setShowSheet(false)}>
      Cancel
    </Button>
  </div>
</BottomSheet>

// Settings panel
<BottomSheet
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  title="Settings"
  icon="⚙️"
>
  <div className="space-y-4">
    <Input label="Name" />
    <Select label="Option" options={[...]} />
    <Toggle checked={enabled} onChange={setEnabled} label="Enable feature" />
  </div>
</BottomSheet>

// Confirmation with custom z-index (above modal)
<BottomSheet
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  zIndex={10000}
  closeOnBackdrop={false}
  title="Confirm"
>
  <Text variant="secondary" className="mb-4">Are you sure?</Text>
  <ButtonGroup>
    <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
    <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
  </ButtonGroup>
</BottomSheet>
```

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

### ⚠️ Anti-Patterns to Avoid

**Never use triple overrides** - they cause dark mode visibility issues:

```jsx
// ❌ WRONG - Triple override (property declared 3 times)
className="text-slate-800 [html:not(.dark)_&]:text-slate-800 text-slate-200"
className="bg-slate-100 [html:not(.dark)_&]:bg-slate-100 bg-slate-900"

// ✅ CORRECT - Dark-first single declaration
className="text-slate-200 [html:not(.dark)_&]:text-slate-800"
className="bg-slate-900 [html:not(.dark)_&]:bg-slate-100"
```

**Never mix `dark:` prefix with `[html:not(.dark)_&]:`** - use only one pattern:

```jsx
// ❌ WRONG - Mixing patterns causes confusion
className="bg-ocean-500/[0.12] dark:bg-ocean-500/[0.15] [html:not(.dark)_&]:bg-ocean-500/[0.08]"

// ✅ CORRECT - Single pattern (dark-first)
className="bg-ocean-500/[0.15] [html:not(.dark)_&]:bg-ocean-500/[0.08]"
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

**Base components handle dark/light mode internally via props - NEVER use external color classes.**

#### Heading Component

```jsx
// Props: level, size, variant, children, className (layout only)
<Heading level={1} size="3xl" variant="gradient">Main Title</Heading>
<Heading level={2} variant="ember">Accent Title</Heading>
<Heading level={3} variant="ocean">Info Title</Heading>
```

**Heading variants:**
| Variant | Dark Mode | Light Mode |
|---------|-----------|------------|
| `default` | slate-100 | slate-900 |
| `gradient` | ember→flame gradient | (same) |
| `subtle` | slate-400 | slate-600 |
| `ember` | ember-400 | ember-700 |
| `ocean` | ocean-300 | ocean-700 |
| `sage` | sage-400 | sage-700 |
| `warning` | warning-400 | warning-700 |
| `danger` | danger-400 | danger-700 |
| `info` | ocean-300 | ocean-800 |

**Heading sizes:** `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` (auto-calculated from level if not provided)

#### Text Component

```jsx
// Props: variant, size, weight, uppercase, tracking, mono, as, children, className (layout only)
<Text variant="body">Primary text</Text>
<Text variant="secondary" size="sm">Description</Text>
<Text variant="tertiary" size="xs" uppercase>Label</Text>
<Text variant="ocean" weight="bold">Highlighted</Text>
<Text variant="label">AUTO UPPERCASE LABEL</Text>
<Text as="span" mono>code_example</Text>
```

**Text variants:**
| Variant | Dark Mode | Light Mode | Default Size |
|---------|-----------|------------|--------------|
| `body` | slate-100 | slate-900 | base |
| `secondary` | slate-300 | slate-600 | base |
| `tertiary` | slate-400 | slate-500 | sm |
| `ember` | ember-400 | ember-600 | base |
| `ocean` | ocean-400 | ocean-600 | base |
| `sage` | sage-400 | sage-600 | base |
| `warning` | warning-400 | warning-600 | base |
| `danger` | danger-400 | danger-600 | base |
| `info` | ocean-400 | ocean-600 | base |
| `label` | slate-400 + uppercase | slate-500 + uppercase | xs |

**Text sizes:** `xs`, `sm`, `base`, `lg`, `xl`
**Text weights:** `normal`, `medium`, `semibold`, `bold`, `black`
**Text modifiers:** `uppercase`, `tracking` (letter-spacing), `mono` (monospace font)
**Text element:** `as` prop → `p` (default), `span`, `label`, `div`

#### Usage Rules

**CRITICAL: Always use UI components instead of raw HTML elements.**

```jsx
// ✅ CORRECT - UI components with variant props
<Heading level={1} variant="subtle">Page Title</Heading>
<Text variant="tertiary" size="xs">Description</Text>
<Text variant="ember" weight="semibold">Highlighted</Text>
<Input label="Name" variant="ember" />

// ❌ WRONG - Raw HTML elements
<h1 className="text-slate-400">Page Title</h1>
<p className="text-slate-500 text-xs">Description</p>
<input className="bg-slate-800 text-slate-100" />

// ❌ WRONG - External color classes on UI components
<Heading className="text-slate-400">Room Name</Heading>
<Text className="text-slate-500 text-xs font-semibold">Text</Text>

// ✅ CORRECT - className only for layout/spacing
<Text variant="body" className="mt-4 truncate">With spacing</Text>
<Heading level={2} className="mb-6">With spacing</Heading>
```

**Rules:**
1. **NEVER use raw `<h1>`-`<h6>`, `<p>`, `<span>`, `<input>`** → Always use `Heading`, `Text`, `Input` components
2. **NEVER add color classes to UI components** → Use `variant` prop
3. **className is ONLY for layout** → spacing, sizing, positioning, flex/grid properties

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

**Last Updated**: 2026-01-16 (Ember Noir v2.3 - Complete Dark Mode Unification + Form Inputs)
