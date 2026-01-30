# Accessibility Guide - Ember Noir v3.0

WCAG AA compliant design system with full keyboard navigation and screen reader support.

---

## Principles

1. **Keyboard First** - All interactive components fully navigable with keyboard
2. **Screen Reader Friendly** - Proper ARIA labels and live regions
3. **Visible Focus** - Ember glow focus indicators on all interactive elements
4. **Respects User Preferences** - `prefers-reduced-motion` honored throughout
5. **Touch Accessible** - 44px minimum touch targets for mobile users

---

## Keyboard Navigation by Component

### Form Controls

| Component | Key | Action |
|-----------|-----|--------|
| **Button** | `Enter` | Activates button |
| | `Space` | Activates button |
| | `Tab` | Moves focus to/from button |
| **Checkbox** | `Space` | Toggles checkbox state |
| | `Tab` | Moves focus to/from checkbox |
| **Switch** | `Space` | Toggles switch on/off |
| | `Enter` | Toggles switch on/off |
| | `Tab` | Moves focus to/from switch |
| **Input** | `Tab` | Moves focus to/from input |
| | `Escape` | Clears input (when `clearable` prop is true) |
| **Select** | `Enter` | Opens dropdown / Selects focused option |
| | `Space` | Opens dropdown / Selects focused option |
| | `ArrowDown` | Opens dropdown / Moves focus down |
| | `ArrowUp` | Moves focus up in dropdown |
| | `Escape` | Closes dropdown without selection |
| | `Tab` | Moves focus, closes dropdown if open |
| | `Home` | Moves focus to first option |
| | `End` | Moves focus to last option |
| | `[a-z]` | Typeahead - jumps to matching option |
| **Slider** | `ArrowRight` | Increases value by step |
| | `ArrowUp` | Increases value by step |
| | `ArrowLeft` | Decreases value by step |
| | `ArrowDown` | Decreases value by step |
| | `Home` | Sets value to minimum |
| | `End` | Sets value to maximum |
| | `PageUp` | Increases value by 10% of range |
| | `PageDown` | Decreases value by 10% of range |

### Feedback Components

| Component | Key | Action |
|-----------|-----|--------|
| **Modal** | `Escape` | Closes modal |
| | `Tab` | Cycles focus within modal (focus trap) |
| | `Shift+Tab` | Cycles focus backwards within modal |
| **Tooltip** | `Tab` | Shows tooltip when trigger receives focus |
| | `Escape` | Hides tooltip |
| **Toast** | `Tab` | Focuses action button or close button |
| | `Enter` | Activates focused button |
| | `Space` | Activates focused button |
| **Banner** | `Tab` | Focuses dismiss button or actions |
| | `Enter` | Activates dismiss button |
| | `Space` | Activates dismiss button |

### Smart Home Components

| Component | Key | Action |
|-----------|-----|--------|
| **ControlButton** | `Enter` | Triggers single increment/decrement |
| | `Space` | Triggers single increment/decrement |
| | `Tab` | Moves focus to/from button |
| **SmartHomeCard** | `Tab` | Navigates through internal interactive elements |
| **DeviceCard** | `Tab` | Navigates through interactive elements within card |
| | `Enter` | Activates focused button (connect, actions) |
| | `Space` | Activates focused button |

---

## ARIA Patterns

### Buttons

```jsx
// Standard button - implicit role from <button> element
<Button>Save Changes</Button>
// Renders: <button type="button">Save Changes</button>

// Icon-only button - requires aria-label
<Button.Icon icon={<SettingsIcon />} aria-label="Settings" />
// Renders: <button aria-label="Settings">...</button>

// Loading button - spinner hidden from screen readers
<Button loading>Saving...</Button>
// Loading spinner has aria-hidden="true"
```

### Form Controls

```jsx
// Checkbox with label
<Checkbox
  checked={isChecked}
  onCheckedChange={setIsChecked}
  label="Accept terms and conditions"
/>
// Renders with:
//   role="checkbox"
//   aria-checked="true" | "false" | "mixed" (indeterminate)
//   aria-labelledby referencing label element

// Switch with accessible label
<Switch
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
  label="Enable notifications"
/>
// Renders with:
//   role="switch"
//   aria-checked="true" | "false"
//   aria-label from label prop

// Select dropdown
<Select
  label="Choose schedule"
  options={options}
  value={value}
  onChange={handleChange}
/>
// Renders with:
//   role="combobox"
//   aria-expanded="true" | "false"
//   aria-haspopup="listbox"
//   aria-activedescendant referencing focused option
//   aria-labelledby referencing label element

// Slider with required aria-label
<Slider
  value={brightness}
  onChange={setBrightness}
  min={0}
  max={100}
  aria-label="Brightness control"
/>
// Renders with:
//   role="slider" (on thumb element)
//   aria-valuemin="0"
//   aria-valuemax="100"
//   aria-valuenow="75"
//   aria-label on thumb element
```

### Input with Validation

```jsx
<Input
  label="Email"
  type="email"
  error={emailError}
  aria-describedby="email-error"
/>
// When error is present:
//   aria-invalid="true"
//   aria-describedby references error message element
//   aria-labelledby references label element
```

### Modal Dialog

```jsx
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>
    <Modal.Title>Confirm Action</Modal.Title>
    <Modal.Close />
  </Modal.Header>
  <Modal.Description>
    Are you sure you want to proceed?
  </Modal.Description>
  <Modal.Footer>
    <Button variant="subtle" onClick={handleClose}>Cancel</Button>
    <Button variant="ember" onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>
// Renders with:
//   role="dialog"
//   aria-modal="true"
//   aria-labelledby referencing Modal.Title
//   aria-describedby referencing Modal.Description
// Focus is trapped within modal
// Escape key closes modal
```

### Live Regions

```jsx
// Toast notifications - polite announcements
<Toast variant="success">Settings saved successfully!</Toast>
// Viewport container has:
//   role="status"
//   aria-live="polite"
// New toasts are announced politely (after current speech)

// Error banner - immediate announcements
<Banner variant="error" title="Connection Error">
  Unable to connect to server.
</Banner>
// Has:
//   role="alert"
// Announces immediately to screen readers

// Status indicators - live region updates
<ConnectionStatus status="online" />
<HealthIndicator status="ok" />
// Both have:
//   role="status"
//   aria-live="polite"
// Status changes are announced politely
```

---

## Focus Indicators

All interactive components use a consistent ember glow focus ring:

```css
/* Focus ring styling */
focus-visible:ring-2
focus-visible:ring-ember-500/50
focus-visible:ring-offset-2
focus-visible:ring-offset-slate-900
```

This provides:

| Property | Value | Purpose |
|----------|-------|---------|
| Ring width | 2px | Visible without being intrusive |
| Ring color | ember-500 at 50% opacity | Brand consistent, visible on dark backgrounds |
| Ring offset | 2px | Creates space between element and ring |
| Offset color | slate-900 | Matches dark background |

### Light Mode Focus

In light mode, the ring offset adapts:

```css
[html:not(.dark)_&]:focus-visible:ring-offset-white
```

### Button Focus Examples

```jsx
// All button variants have consistent focus styling
<Button variant="ember">Primary</Button>
<Button variant="subtle">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
// All show ember glow ring on keyboard focus
```

---

## Reduced Motion

The design system respects user motion preferences via CSS and JavaScript:

### CSS Implementation

```css
/* In globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### JavaScript Hook

```jsx
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  // Adjust behavior for reduced motion preference
  if (prefersReducedMotion) {
    return <StaticVersion />;
  }
  return <AnimatedVersion />;
}
```

### Components Affected

| Component | Normal Behavior | Reduced Motion |
|-----------|-----------------|----------------|
| Spinner | Continuous rotation | Static or single frame |
| Progress (indeterminate) | Moving bar animation | Static bar |
| Badge (pulse) | Glow pulse animation | Static glow |
| Toast | Slide-in animation | Instant appearance |
| Modal | Scale/fade animation | Instant appearance |
| Card (hover) | Lift transition | Instant state change |

### Essential Feedback Preserved

Visual feedback that doesn't involve motion is always preserved:
- Color changes (hover states, active states)
- Focus indicators
- Error/success states
- Status badges and indicators

---

## Color Contrast

All text meets WCAG AA contrast requirements:

| Element | Foreground | Background | Ratio | Requirement |
|---------|------------|------------|-------|-------------|
| Body text | slate-200 | slate-900 | 7.5:1 | 4.5:1 (normal) |
| Secondary text | slate-400 | slate-900 | 4.8:1 | 4.5:1 (normal) |
| Large headings | slate-100 | slate-900 | 8.2:1 | 3:1 (large) |
| Ember accent | ember-400 | slate-900 | 4.6:1 | 3:1 (UI/large) |
| Ember on white | ember-700 | white | 4.5:1 | 3:1 (UI/large) |
| Error text | danger-400 | slate-900 | 5.2:1 | 4.5:1 (normal) |
| Success text | sage-400 | slate-900 | 4.6:1 | 3:1 (large) |

### Light Mode Contrast

Light mode automatically adjusts colors for proper contrast:

```jsx
// Dark mode: ember-400 on slate-900
// Light mode: ember-700 on white (via variants)
<Heading variant="ember">Title</Heading>
```

### Non-Color Indicators

Status is never conveyed by color alone:

```jsx
// Badge includes text, not just color
<Badge variant="sage">Online</Badge>
<Badge variant="danger">Error</Badge>

// HealthIndicator includes icon and label
<HealthIndicator status="error" />
// Shows XCircle icon + "Errore" label

// Input error includes icon and message
<Input error="Invalid email format" />
// Shows error border + error message text
```

---

## Touch Targets

All interactive elements meet the minimum 44x44px touch target requirement:

### Button Sizes

| Size | Min Height | Min Width | Touch Compliant |
|------|------------|-----------|-----------------|
| `sm` | 44px | 44px | Yes |
| `md` | 48px | 48px | Yes |
| `lg` | 56px | 56px | Yes |

### Implementation

```jsx
// CVA ensures minimum touch targets
const buttonVariants = cva(
  'min-h-[44px] min-w-[44px] ...',
  { ... }
);

// Icon buttons maintain touch targets
<Button.Icon icon={...} aria-label="..." />
// Still 44x44px minimum
```

### Components with Touch Targets

All these components meet 44px minimum:
- Button (all variants and sizes)
- Checkbox (includes clickable label area)
- Switch (track and thumb)
- Select trigger
- Slider thumb
- ControlButton (+/- buttons)
- Modal close button
- Toast dismiss button
- Banner dismiss button

---

## Testing

### Automated Testing (jest-axe)

All components are tested for WCAG violations:

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <Button variant="ember">Click me</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('icon-only button requires aria-label', async () => {
    const { container } = render(
      <Button.Icon icon={<SettingsIcon />} aria-label="Settings" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Keyboard Navigation Testing

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Checkbox keyboard navigation', () => {
  it('toggles with Space key', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Checkbox label="Test" checked={false} onCheckedChange={onChange} />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.tab();
    expect(checkbox).toHaveFocus();

    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements in order
- [ ] Shift+Tab navigates backwards
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in Select and Slider
- [ ] Escape closes Modal, Tooltip, Select dropdown
- [ ] Focus never gets trapped (except Modal focus trap)

#### Screen Reader
- [ ] All interactive elements have accessible names
- [ ] Form errors are announced
- [ ] Toast/Banner announcements work
- [ ] Status changes are announced
- [ ] Modal announces on open

#### Visual
- [ ] Focus indicator visible on all interactive elements
- [ ] Sufficient color contrast in both themes
- [ ] Status not conveyed by color alone
- [ ] Touch targets are at least 44x44px

#### Motion
- [ ] Animations respect prefers-reduced-motion
- [ ] Essential feedback still visible with reduced motion

---

## Screen Reader Support

### Tested Screen Readers

- **VoiceOver** (macOS/iOS) - Primary testing platform
- **NVDA** (Windows) - Secondary testing
- **TalkBack** (Android) - Mobile testing

### Common Announcements

| Component | Announcement Pattern |
|-----------|---------------------|
| Button | "Button, [label]" |
| Checkbox | "Checkbox, [label], checked/unchecked" |
| Switch | "Switch, [label], on/off" |
| Slider | "Slider, [label], [value] of [max]" |
| Select | "Combobox, [label], collapsed/expanded, [value]" |
| Modal | "Dialog, [title]" |
| Toast | "[message]" (via aria-live) |
| Banner (error) | "[title]: [description]" (immediate) |
| ConnectionStatus | "[status]" (on change) |
| HealthIndicator | "[status]" (on change) |

### Tips for Developers

1. **Always provide labels** - Use `label` prop or `aria-label`
2. **Use semantic HTML** - Components use correct elements (`<button>`, `<input>`, etc.)
3. **Test with screen reader** - At minimum, test with VoiceOver
4. **Announce state changes** - Use aria-live regions for dynamic content
5. **Don't rely on placeholder** - Placeholder is not a substitute for label

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Success Criteria](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa)
- [Understanding WCAG](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [jest-axe](https://github.com/nickcolley/jest-axe) - Automated testing
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Radix UI Accessibility
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

---

## See Also

- [Design System](./design-system.md) - Component reference
- `/debug/design-system` - Live interactive examples
