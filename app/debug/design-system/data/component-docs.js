/**
 * Component Documentation Data
 *
 * Centralized metadata for all design system components.
 * Used by PropTable and AccessibilitySection components.
 *
 * Structure for each component:
 * - name: Component name
 * - description: Brief description
 * - category: 'Form Controls' | 'Feedback' | 'Layout' | 'Smart Home'
 * - props: Array of { name, type, default, description, required }
 * - keyboard: Array of { key, action } for keyboard navigation
 * - aria: Array of { attr, description } for ARIA attributes
 * - screenReader: String describing screen reader announcements
 * - codeExample: String with example JSX
 */

export const componentDocs = {
  // ============================================
  // FORM CONTROLS
  // ============================================

  Button: {
    name: 'Button',
    description: 'Primary action button with gradient variants and smooth interactions',
    category: 'Form Controls',
    props: [
      { name: 'variant', type: "'ember'|'subtle'|'ghost'|'success'|'danger'|'outline'", default: "'ember'", description: 'Visual style variant' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Button size (44px, 48px, 56px min height)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state (50% opacity)' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Shows spinner overlay, disables interaction' },
      { name: 'icon', type: 'string|ReactNode', default: 'undefined', description: 'Icon to display (emoji or component)' },
      { name: 'iconPosition', type: "'left'|'right'", default: "'left'", description: 'Icon position relative to text' },
      { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Expand to full container width' },
      { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Circular icon-only button mode' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Enter', action: 'Activates button' },
      { key: 'Space', action: 'Activates button' },
      { key: 'Tab', action: 'Moves focus to/from button' },
    ],
    aria: [
      { attr: 'role="button"', description: 'Implicit from <button> element' },
      { attr: 'aria-disabled', description: 'Set when disabled or loading' },
      { attr: 'aria-label', description: 'Required for iconOnly buttons' },
    ],
    screenReader: 'Announces as "Button, [label]". When disabled, announces as dimmed. Loading spinner is hidden from screen readers.',
    codeExample: `<Button variant="ember" size="md" icon="🔥">
  Start Stove
</Button>

{/* Icon-only button */}
<Button.Icon icon="⚙️" aria-label="Settings" />

{/* Button group */}
<Button.Group>
  <Button variant="subtle">Cancel</Button>
  <Button variant="ember">Save</Button>
</Button.Group>`,
  },

  Checkbox: {
    name: 'Checkbox',
    description: 'Accessible checkbox built on Radix UI primitives with CVA variants',
    category: 'Form Controls',
    props: [
      { name: 'checked', type: 'boolean', default: 'false', description: 'Checked state' },
      { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Indeterminate/mixed state' },
      { name: 'onCheckedChange', type: '(checked: boolean|"indeterminate") => void', default: 'undefined', description: 'Radix change handler' },
      { name: 'onChange', type: '(e) => void', default: 'undefined', description: 'Legacy change handler (backwards compatibility)' },
      { name: 'label', type: 'ReactNode', default: 'undefined', description: 'Visible label text' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Checkbox size (16px, 20px, 24px)' },
      { name: 'variant', type: "'primary'|'ember'|'ocean'|'sage'|'flame'", default: "'ocean'", description: 'Color variant when checked' },
      { name: 'id', type: 'string', default: 'undefined', description: 'Input id for label association' },
      { name: 'name', type: 'string', default: 'undefined', description: 'Input name for form submission' },
    ],
    keyboard: [
      { key: 'Space', action: 'Toggles checkbox state' },
      { key: 'Tab', action: 'Moves focus to/from checkbox' },
    ],
    aria: [
      { attr: 'role="checkbox"', description: 'From Radix Checkbox primitive' },
      { attr: 'aria-checked', description: '"true", "false", or "mixed" for indeterminate' },
      { attr: 'aria-labelledby', description: 'References label element when label prop provided' },
    ],
    screenReader: 'Announces as "Checkbox, [label], checked/unchecked". Indeterminate state announces as "mixed".',
    codeExample: `<Checkbox
  checked={isChecked}
  onCheckedChange={setIsChecked}
  label="Accept terms and conditions"
  variant="ocean"
/>

{/* Indeterminate state */}
<Checkbox
  indeterminate={hasPartialSelection}
  label="Select all"
/>`,
  },

  Switch: {
    name: 'Switch',
    description: 'Toggle switch built on Radix UI with smooth 250ms animation',
    category: 'Form Controls',
    props: [
      { name: 'checked', type: 'boolean', default: 'false', description: 'On/off state' },
      { name: 'onCheckedChange', type: '(checked: boolean) => void', default: 'undefined', description: 'Radix change handler' },
      { name: 'onChange', type: '(checked: boolean) => void', default: 'undefined', description: 'Legacy change handler (backwards compatibility)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Switch size' },
      { name: 'variant', type: "'ember'|'ocean'|'sage'", default: "'ember'", description: 'Color variant when checked' },
      { name: 'label', type: 'string', default: 'undefined', description: 'Accessible label (sets aria-label)' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Space', action: 'Toggles switch state' },
      { key: 'Enter', action: 'Toggles switch state' },
      { key: 'Tab', action: 'Moves focus to/from switch' },
    ],
    aria: [
      { attr: 'role="switch"', description: 'From Radix Switch primitive' },
      { attr: 'aria-checked', description: 'true/false based on state' },
      { attr: 'aria-label', description: 'Set from label prop' },
    ],
    screenReader: 'Announces as "Switch, [label], on/off". State change announces new state.',
    codeExample: `<Switch
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
  label="Enable notifications"
  variant="ember"
/>`,
  },

  Input: {
    name: 'Input',
    description: 'Enhanced text input with label, validation, clearable, and character count features',
    category: 'Form Controls',
    props: [
      { name: 'type', type: "'text'|'password'|'email'|'number'|...", default: "'text'", description: 'Input type' },
      { name: 'label', type: 'string', default: 'undefined', description: 'Label text (uses Radix Label)' },
      { name: 'icon', type: 'string|ReactNode', default: 'undefined', description: 'Leading icon in label' },
      { name: 'variant', type: "'default'|'error'|'success'", default: "'default'", description: 'Visual variant (auto-set to error when error prop provided)' },
      { name: 'error', type: 'string', default: 'undefined', description: 'Error message (triggers error variant)' },
      { name: 'clearable', type: 'boolean', default: 'false', description: 'Show clear button when value exists' },
      { name: 'showCount', type: 'boolean', default: 'false', description: 'Show character count (requires maxLength)' },
      { name: 'validate', type: '(value: string) => string|null', default: 'undefined', description: 'Real-time validation function' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'maxLength', type: 'number', default: 'undefined', description: 'Maximum character length' },
      { name: 'className', type: 'string', default: "''", description: 'Additional input classes' },
      { name: 'containerClassName', type: 'string', default: "''", description: 'Container wrapper classes' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Moves focus to/from input' },
      { key: 'Escape', action: 'Clears input (when clearable)' },
    ],
    aria: [
      { attr: 'aria-invalid', description: 'Set to "true" when error prop provided' },
      { attr: 'aria-describedby', description: 'References error message element' },
      { attr: 'aria-labelledby', description: 'References label element' },
    ],
    screenReader: 'Announces as "Edit text, [label]". Error state announces error message via aria-describedby.',
    codeExample: `<Input
  label="Email"
  type="email"
  icon="@"
  error={emailError}
  placeholder="Enter email..."
  clearable
/>

{/* With validation and character count */}
<Input
  label="Username"
  maxLength={20}
  showCount
  validate={(v) => v.length < 3 ? "Min 3 characters" : null}
/>`,
  },

  Select: {
    name: 'Select',
    description: 'Accessible dropdown select built on Radix UI with simple and compound APIs',
    category: 'Form Controls',
    props: [
      { name: 'options', type: 'Array<{value, label, disabled?}>', required: true, description: 'Array of options' },
      { name: 'value', type: 'string|number', required: true, description: 'Selected value' },
      { name: 'onChange', type: '(e: {target: {value}}) => void', required: true, description: 'Change handler (synthetic event for backwards compatibility)' },
      { name: 'label', type: 'string', default: 'undefined', description: 'Label text' },
      { name: 'icon', type: 'string|ReactNode', default: 'undefined', description: 'Leading icon in label' },
      { name: 'variant', type: "'default'|'ember'|'ocean'", default: "'default'", description: 'Color variant for focus ring' },
      { name: 'placeholder', type: 'string', default: "'Select...'", description: 'Placeholder when no value' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'className', type: 'string', default: "''", description: 'Additional trigger classes' },
      { name: 'containerClassName', type: 'string', default: "''", description: 'Container wrapper classes' },
    ],
    keyboard: [
      { key: 'Enter', action: 'Opens dropdown / Selects focused option' },
      { key: 'Space', action: 'Opens dropdown / Selects focused option' },
      { key: 'ArrowDown', action: 'Opens dropdown / Moves focus down' },
      { key: 'ArrowUp', action: 'Moves focus up' },
      { key: 'Escape', action: 'Closes dropdown' },
      { key: 'Tab', action: 'Moves focus, closes if open' },
      { key: 'Home', action: 'Moves focus to first option' },
      { key: 'End', action: 'Moves focus to last option' },
      { key: '[a-z]', action: 'Typeahead - jumps to matching option' },
    ],
    aria: [
      { attr: 'role="combobox"', description: 'From Radix Select primitive' },
      { attr: 'aria-expanded', description: 'true when dropdown open' },
      { attr: 'aria-haspopup="listbox"', description: 'Indicates dropdown presence' },
      { attr: 'aria-activedescendant', description: 'References focused option' },
      { attr: 'aria-labelledby', description: 'References label element' },
    ],
    screenReader: 'Announces as "Combobox, [label], collapsed/expanded, [selected value]".',
    codeExample: `<Select
  label="Schedule"
  options={[
    { value: 'home', label: 'Home' },
    { value: 'away', label: 'Away' },
    { value: 'sleep', label: 'Sleep', disabled: true },
  ]}
  value={schedule}
  onChange={(e) => setSchedule(e.target.value)}
  variant="ember"
/>`,
  },

  Slider: {
    name: 'Slider',
    description: 'Range slider built on Radix UI with single and range modes',
    category: 'Form Controls',
    props: [
      { name: 'value', type: 'number|number[]', default: 'undefined', description: 'Current value (number for single, array for range)' },
      { name: 'defaultValue', type: 'number|number[]', default: 'undefined', description: 'Initial value' },
      { name: 'onValueChange', type: '(value: number|number[]) => void', default: 'undefined', description: 'Radix change handler' },
      { name: 'onChange', type: '(value: number|number[]) => void', default: 'undefined', description: 'Alias for onValueChange (simpler API)' },
      { name: 'min', type: 'number', default: '0', description: 'Minimum value' },
      { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
      { name: 'step', type: 'number', default: '1', description: 'Step increment' },
      { name: 'range', type: 'boolean', default: 'false', description: 'Enable dual-thumb range selection' },
      { name: 'showTooltip', type: 'boolean', default: 'false', description: 'Show value tooltip while dragging' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'variant', type: "'ember'|'ocean'|'sage'", default: "'ember'", description: 'Color variant for track fill' },
      { name: 'aria-label', type: 'string', required: true, description: 'Accessible name (required)' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'ArrowRight', action: 'Increases value by step' },
      { key: 'ArrowUp', action: 'Increases value by step' },
      { key: 'ArrowLeft', action: 'Decreases value by step' },
      { key: 'ArrowDown', action: 'Decreases value by step' },
      { key: 'Home', action: 'Sets value to min' },
      { key: 'End', action: 'Sets value to max' },
      { key: 'PageUp', action: 'Increases by 10%' },
      { key: 'PageDown', action: 'Decreases by 10%' },
    ],
    aria: [
      { attr: 'role="slider"', description: 'From Radix Slider primitive (on thumb)' },
      { attr: 'aria-valuemin', description: 'Minimum value' },
      { attr: 'aria-valuemax', description: 'Maximum value' },
      { attr: 'aria-valuenow', description: 'Current value' },
      { attr: 'aria-label', description: 'Accessible name (passed to thumb)' },
    ],
    screenReader: 'Announces as "Slider, [label], [value] of [max]". Value changes announce new value.',
    codeExample: `<Slider
  value={brightness}
  onChange={setBrightness}
  min={0}
  max={100}
  step={5}
  aria-label="Brightness"
  variant="ember"
/>

{/* Range slider */}
<Slider
  range
  value={[minTemp, maxTemp]}
  onChange={([min, max]) => setTempRange(min, max)}
  min={15}
  max={30}
  aria-label="Temperature range"
/>`,
  },

  // ============================================
  // FEEDBACK
  // ============================================

  Modal: {
    name: 'Modal',
    description: 'Dialog modal built on Radix Dialog with focus trap, ESC close, and mobile bottom sheet',
    category: 'Feedback',
    props: [
      { name: 'isOpen', type: 'boolean', required: true, description: 'Modal open state' },
      { name: 'onClose', type: '() => void', required: true, description: 'Callback when modal should close' },
      { name: 'size', type: "'sm'|'md'|'lg'|'xl'|'full'", default: "'md'", description: 'Modal size variant' },
      { name: 'maxWidth', type: 'string', default: 'undefined', description: 'Legacy: custom max-width class' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Modal content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional content classes' },
    ],
    keyboard: [
      { key: 'Escape', action: 'Closes modal' },
      { key: 'Tab', action: 'Cycles focus within modal (focus trap)' },
      { key: 'Shift+Tab', action: 'Cycles focus backwards within modal' },
    ],
    aria: [
      { attr: 'role="dialog"', description: 'From Radix Dialog primitive' },
      { attr: 'aria-modal="true"', description: 'Indicates modal dialog' },
      { attr: 'aria-labelledby', description: 'References Modal.Title' },
      { attr: 'aria-describedby', description: 'References Modal.Description' },
    ],
    screenReader: 'Announces as "Dialog, [title]". Focus is trapped within modal. Backdrop click or ESC closes.',
    codeExample: `<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
  <Modal.Header>
    <Modal.Title>Confirm Action</Modal.Title>
    <Modal.Close />
  </Modal.Header>
  <Modal.Description>Are you sure?</Modal.Description>
  <Modal.Footer>
    <Button variant="subtle" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="ember" onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>`,
  },

  Toast: {
    name: 'Toast',
    description: 'Notification toast built on Radix Toast with variants and swipe-to-dismiss',
    category: 'Feedback',
    props: [
      { name: 'variant', type: "'success'|'error'|'warning'|'info'", default: "'info'", description: 'Toast variant with icon' },
      { name: 'title', type: 'string', default: 'undefined', description: 'Optional title text' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Toast message content' },
      { name: 'action', type: '{label: string, onClick: () => void}', default: 'undefined', description: 'Optional action button' },
      { name: 'open', type: 'boolean', default: 'undefined', description: 'Controlled open state' },
      { name: 'onOpenChange', type: '(open: boolean) => void', default: 'undefined', description: 'Open state change handler' },
      { name: 'duration', type: 'number', default: '5000 (8000 for error)', description: 'Auto-dismiss duration in ms' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Focuses action button or close button' },
      { key: 'Enter', action: 'Activates focused button' },
      { key: 'Space', action: 'Activates focused button' },
    ],
    aria: [
      { attr: 'role="status"', description: 'Toast viewport is a status region' },
      { attr: 'aria-live="polite"', description: 'Announces new toasts politely' },
      { attr: 'aria-label="Close"', description: 'On close button' },
    ],
    screenReader: 'Announces toast content when shown. Action and close buttons are focusable.',
    codeExample: `{/* Via ToastProvider/useToast hook */}
const { success, error } = useToast();
success('Settings saved!');
error('Failed to save', { duration: 8000 });

{/* Direct usage */}
<Toast variant="info" title="Update" action={{ label: 'Refresh', onClick: refresh }}>
  New version available
</Toast>`,
  },

  Banner: {
    name: 'Banner',
    description: 'Alert banner with variants, icons, and persistent dismissal support',
    category: 'Feedback',
    props: [
      { name: 'variant', type: "'info'|'warning'|'error'|'success'|'ember'", default: "'info'", description: 'Banner style variant' },
      { name: 'icon', type: 'string|ReactNode', default: 'undefined', description: 'Custom icon (overrides default)' },
      { name: 'title', type: 'string', default: 'undefined', description: 'Banner title' },
      { name: 'description', type: 'string|ReactNode', default: 'undefined', description: 'Banner description' },
      { name: 'actions', type: 'ReactNode', default: 'undefined', description: 'Action buttons' },
      { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show dismiss button' },
      { name: 'onDismiss', type: '() => void', default: 'undefined', description: 'Dismiss callback' },
      { name: 'dismissKey', type: 'string', default: 'undefined', description: 'localStorage key for persistent dismissal' },
      { name: 'compact', type: 'boolean', default: 'false', description: 'Use compact layout' },
      { name: 'children', type: 'ReactNode', default: 'undefined', description: 'Additional content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Focuses dismiss button or actions' },
      { key: 'Enter', action: 'Activates dismiss button' },
      { key: 'Space', action: 'Activates dismiss button' },
    ],
    aria: [
      { attr: 'role="alert"', description: 'Announces immediately to screen readers' },
      { attr: 'aria-label="Dismiss"', description: 'On dismiss button' },
      { attr: 'aria-hidden="true"', description: 'On decorative icon' },
    ],
    screenReader: 'Announces banner content immediately due to role="alert". Dismiss button is keyboard accessible.',
    codeExample: `<Banner
  variant="warning"
  title="Connection Lost"
  description="Attempting to reconnect..."
  dismissible
  onDismiss={() => console.log('dismissed')}
/>

{/* Persistent dismissal */}
<Banner
  variant="info"
  title="New Feature"
  dismissKey="feature-banner-v1"
>
  Check out our new dashboard!
</Banner>`,
  },

  Tooltip: {
    name: 'Tooltip',
    description: 'Tooltip built on Radix UI with hover/focus trigger and arrow',
    category: 'Feedback',
    props: [
      { name: 'content', type: 'ReactNode', required: true, description: 'Tooltip content' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Trigger element' },
      { name: 'side', type: "'top'|'right'|'bottom'|'left'", default: "'top'", description: 'Preferred side' },
      { name: 'sideOffset', type: 'number', default: '4', description: 'Distance from trigger (px)' },
      { name: 'open', type: 'boolean', default: 'undefined', description: 'Controlled open state' },
      { name: 'onOpenChange', type: '(open: boolean) => void', default: 'undefined', description: 'Open state change handler' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Focus trigger shows tooltip' },
      { key: 'Escape', action: 'Closes tooltip' },
    ],
    aria: [
      { attr: 'role="tooltip"', description: 'From Radix Tooltip primitive' },
      { attr: 'aria-describedby', description: 'Trigger references tooltip content' },
    ],
    screenReader: 'Tooltip content is announced when trigger receives focus.',
    codeExample: `<Tooltip.Provider>
  <Tooltip content="Click to save your changes">
    <Button>Save</Button>
  </Tooltip>
</Tooltip.Provider>

{/* Compound pattern */}
<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <Button>Hover me</Button>
  </Tooltip.Trigger>
  <Tooltip.Content side="bottom">
    Detailed tooltip content
  </Tooltip.Content>
</Tooltip.Root>`,
  },

  Spinner: {
    name: 'Spinner',
    description: 'Animated SVG loading indicator with size and color variants',
    category: 'Feedback',
    props: [
      { name: 'size', type: "'xs'|'sm'|'md'|'lg'|'xl'", default: "'md'", description: 'Spinner size (12px to 48px)' },
      { name: 'variant', type: "'ember'|'white'|'current'|'muted'", default: "'ember'", description: 'Color variant' },
      { name: 'label', type: 'string', default: "'Loading'", description: 'Accessible label for screen readers' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [
      { attr: 'role="status"', description: 'Indicates loading state' },
      { attr: 'aria-label', description: 'Set from label prop (default: "Loading")' },
    ],
    screenReader: 'Announces as "[label]" (default "Loading").',
    codeExample: `<Spinner size="lg" variant="ember" />

{/* Inside a button with inherited color */}
<Button disabled>
  <Spinner size="sm" variant="current" /> Loading...
</Button>`,
  },

  Progress: {
    name: 'Progress',
    description: 'Progress bar built on Radix Progress with determinate and indeterminate modes',
    category: 'Feedback',
    props: [
      { name: 'value', type: 'number', default: 'undefined', description: 'Progress value (0-max), undefined for indeterminate' },
      { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Bar height size' },
      { name: 'variant', type: "'ember'|'ocean'|'sage'|'warning'|'danger'", default: "'ember'", description: 'Color variant' },
      { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Force indeterminate state' },
      { name: 'label', type: 'string', default: "'Progress'", description: 'Accessible label' },
      { name: 'className', type: 'string', default: "''", description: 'Additional root classes' },
      { name: 'indicatorClassName', type: 'string', default: "''", description: 'Additional indicator classes' },
    ],
    keyboard: [],
    aria: [
      { attr: 'role="progressbar"', description: 'From Radix Progress primitive' },
      { attr: 'aria-valuemin', description: 'Always 0' },
      { attr: 'aria-valuemax', description: 'Set from max prop' },
      { attr: 'aria-valuenow', description: 'Current value (null if indeterminate)' },
      { attr: 'aria-label', description: 'Set from label prop' },
    ],
    screenReader: 'Announces as "Progress bar, [label], [value]%". Indeterminate announces as "busy".',
    codeExample: `{/* Determinate progress */}
<Progress value={75} variant="ember" />

{/* Indeterminate loading */}
<Progress indeterminate variant="ocean" />

{/* Auto-indeterminate when value undefined */}
<Progress />`,
  },

  EmptyState: {
    name: 'EmptyState',
    description: 'Consistent empty state display with icon, title, description, and action',
    category: 'Feedback',
    props: [
      { name: 'icon', type: 'string|ReactNode', default: 'undefined', description: 'Emoji or icon component' },
      { name: 'title', type: 'string', default: 'undefined', description: 'Empty state title' },
      { name: 'description', type: 'string', default: 'undefined', description: 'Explanatory description' },
      { name: 'action', type: 'ReactNode', default: 'undefined', description: 'Action button(s)' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Size variant (affects padding, icon, text sizes)' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [
      { attr: 'aria-hidden="true"', description: 'On decorative icon' },
    ],
    screenReader: 'Icon is decorative (hidden). Title and description are read normally.',
    codeExample: `<EmptyState
  icon="🏠"
  title="Nessun dispositivo"
  description="Aggiungi dispositivi per iniziare"
  action={<Button variant="ember">Aggiungi</Button>}
/>

{/* Compact for inline usage */}
<EmptyState
  size="sm"
  icon="📭"
  title="Nessun messaggio"
/>`,
  },

  // ============================================
  // LAYOUT
  // ============================================

  Card: {
    name: 'Card',
    description: 'Container with variants for different visual styles and depth',
    category: 'Layout',
    props: [
      { name: 'variant', type: "'default'|'elevated'|'subtle'|'outlined'|'glass'", default: "'default'", description: 'Visual style variant' },
      { name: 'hover', type: 'boolean', default: 'false', description: 'Enable hover lift effect' },
      { name: 'glow', type: 'boolean', default: 'false', description: 'Add ember glow effect' },
      { name: 'padding', type: 'boolean', default: 'true', description: 'Include default padding' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Card content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [],
    screenReader: 'Card is a presentational container. Content structure determines accessibility.',
    codeExample: `<Card variant="elevated" hover>
  <Card.Header>
    <Card.Title icon="🔥">Thermostat</Card.Title>
  </Card.Header>
  <Card.Content>
    <p>Current temperature: 22C</p>
  </Card.Content>
  <Card.Divider />
  <Card.Footer>
    <Button>Adjust</Button>
  </Card.Footer>
</Card>

{/* Namespace sub-components */}
Card.Header   {/* Flex container for title area */}
Card.Title    {/* Title with optional icon */}
Card.Content  {/* Main content area */}
Card.Divider  {/* Visual separator */}
Card.Footer   {/* Actions area with top border */}`,
  },

  PageLayout: {
    name: 'PageLayout',
    description: 'Page structure with header, content, and footer slots',
    category: 'Layout',
    props: [
      { name: 'header', type: 'ReactNode', default: 'undefined', description: 'Header slot (typically PageLayout.Header)' },
      { name: 'footer', type: 'ReactNode', default: 'undefined', description: 'Footer slot (optional)' },
      { name: 'maxWidth', type: "'sm'|'md'|'lg'|'xl'|'2xl'|'7xl'|'full'|'none'", default: "'none'", description: 'Maximum content width' },
      { name: 'padding', type: "'none'|'sm'|'md'|'lg'", default: "'none'", description: 'Horizontal padding' },
      { name: 'centered', type: 'boolean', default: 'true', description: 'Center content horizontally' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Page content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [],
    screenReader: 'Uses semantic <header>, <main>, <footer> elements for proper document structure.',
    codeExample: `<PageLayout
  maxWidth="7xl"
  header={
    <PageLayout.Header
      title="Dashboard"
      description="Overview of your devices"
      actions={<Button>Add Device</Button>}
    />
  }
  footer={<PageLayout.Footer>Footer content</PageLayout.Footer>}
>
  {/* Main content */}
  <Grid cols={3}>
    <Card>...</Card>
    <Card>...</Card>
  </Grid>
</PageLayout>`,
  },

  Section: {
    name: 'Section',
    description: 'Semantic wrapper for page sections with title, description, and action',
    category: 'Layout',
    props: [
      { name: 'title', type: 'string', default: 'undefined', description: 'Section title (rendered as Heading)' },
      { name: 'subtitle', type: 'string', default: 'undefined', description: 'Optional subtitle above title' },
      { name: 'description', type: 'string', default: 'undefined', description: 'Optional description below title' },
      { name: 'spacing', type: "'none'|'sm'|'md'|'lg'", default: "'md'", description: 'Vertical padding variant' },
      { name: 'level', type: '1|2|3|4|5|6', default: '2', description: 'Heading level for accessibility' },
      { name: 'action', type: 'ReactNode', default: 'undefined', description: 'Optional action slot (usually Button)' },
      { name: 'as', type: 'string', default: "'section'", description: 'Semantic element to render' },
      { name: 'children', type: 'ReactNode', default: 'undefined', description: 'Section content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [],
    screenReader: 'Uses semantic <section> element with proper heading hierarchy (level prop).',
    codeExample: `{/* Main page section with h1 */}
<Section
  title="I tuoi dispositivi"
  description="Controlla e monitora tutti i dispositivi"
  spacing="lg"
  level={1}
  action={<Button>Aggiungi</Button>}
>
  <Grid cols={3}>...</Grid>
</Section>

{/* Sub-section with default h2 */}
<Section title="Settings" spacing="md">
  <Card>...</Card>
</Section>`,
  },

  Grid: {
    name: 'Grid',
    description: 'Responsive grid system with predefined column patterns',
    category: 'Layout',
    props: [
      { name: 'cols', type: '1|2|3|4|5|6', default: '3', description: 'Number of columns (auto-responsive breakpoints)' },
      { name: 'gap', type: "'none'|'sm'|'md'|'lg'", default: "'md'", description: 'Gap spacing variant' },
      { name: 'as', type: 'string', default: "'div'", description: 'Semantic element (div, ul, ol, nav)' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Grid items' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes (can override cols)' },
    ],
    keyboard: [],
    aria: [],
    screenReader: 'Use as="ul" with list items for lists, as="nav" for navigation grids.',
    codeExample: `{/* Auto-responsive 3 columns */}
<Grid cols={3} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

{/* Manual breakpoint control */}
<Grid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
  {items.map(item => <Card key={item.id}>...</Card>)}
</Grid>

{/* As list */}
<Grid cols={2} as="ul">
  <li>Item 1</li>
  <li>Item 2</li>
</Grid>`,
  },

  // ============================================
  // SMART HOME
  // ============================================

  Badge: {
    name: 'Badge',
    description: 'Status indicator with color variants and optional pulse animation',
    category: 'Smart Home',
    props: [
      { name: 'variant', type: "'ember'|'sage'|'ocean'|'warning'|'danger'|'neutral'", default: "'neutral'", description: 'Color variant' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Size variant' },
      { name: 'pulse', type: 'boolean', default: 'false', description: 'Enable glow pulse animation' },
      { name: 'icon', type: 'ReactNode', default: 'undefined', description: 'Optional icon before text' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Badge text content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [],
    screenReader: 'Badge is presentational. Text content is read directly.',
    codeExample: `<Badge variant="sage">Online</Badge>

{/* With icon and pulse for active state */}
<Badge variant="ember" pulse icon={<FlameIcon />}>
  ACCESO
</Badge>

{/* Different sizes */}
<Badge variant="ocean" size="lg">Starting</Badge>`,
  },

  ConnectionStatus: {
    name: 'ConnectionStatus',
    description: 'Device connection state with status dot and text label',
    category: 'Smart Home',
    props: [
      { name: 'status', type: "'online'|'offline'|'connecting'|'unknown'", default: "'unknown'", description: 'Connection status' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Display size' },
      { name: 'label', type: 'string', default: 'undefined', description: 'Override default label (Italian)' },
      { name: 'showDot', type: 'boolean', default: 'true', description: 'Show status dot indicator' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [
      { attr: 'role="status"', description: 'Live region for status updates' },
      { attr: 'aria-live="polite"', description: 'Announces status changes politely' },
      { attr: 'aria-hidden="true"', description: 'On decorative dot' },
    ],
    screenReader: 'Announces status changes via aria-live="polite". Default labels are in Italian (Online, Offline, Connessione...).',
    codeExample: `<ConnectionStatus status="online" />

<ConnectionStatus status="connecting" size="lg" />

{/* Custom label */}
<ConnectionStatus
  status="offline"
  label="Dispositivo disconnesso"
/>`,
  },

  HealthIndicator: {
    name: 'HealthIndicator',
    description: 'Health status with severity icon and text label',
    category: 'Smart Home',
    props: [
      { name: 'status', type: "'ok'|'warning'|'error'|'critical'", default: "'ok'", description: 'Health status' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'md'", description: 'Display size' },
      { name: 'label', type: 'string', default: 'undefined', description: 'Override default label (Italian)' },
      { name: 'showIcon', type: 'boolean', default: 'true', description: 'Show status icon' },
      { name: 'pulse', type: 'boolean', default: 'false', description: 'Enable pulse animation (for critical)' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [],
    aria: [
      { attr: 'role="status"', description: 'Live region for status updates' },
      { attr: 'aria-live="polite"', description: 'Announces status changes politely' },
      { attr: 'aria-hidden="true"', description: 'On icon (decorative)' },
    ],
    screenReader: 'Announces status via aria-live="polite". Icons: CheckCircle2 (ok), AlertTriangle (warning), XCircle (error), AlertOctagon (critical).',
    codeExample: `<HealthIndicator status="ok" />

<HealthIndicator status="critical" pulse size="lg" />

{/* Custom label */}
<HealthIndicator
  status="warning"
  label="Manutenzione richiesta"
/>`,
  },

  SmartHomeCard: {
    name: 'SmartHomeCard',
    description: 'Base card for smart home devices with accent bar, header, status, and controls areas',
    category: 'Smart Home',
    props: [
      { name: 'icon', type: 'ReactNode', default: 'undefined', description: 'Device icon (emoji or component)' },
      { name: 'title', type: 'string', default: 'undefined', description: 'Card title' },
      { name: 'size', type: "'compact'|'default'", default: "'default'", description: 'Card size (compact for dashboard)' },
      { name: 'colorTheme', type: "'ember'|'ocean'|'sage'|'warning'|'danger'", default: "'ember'", description: 'Color for accent bar' },
      { name: 'isLoading', type: 'boolean', default: 'false', description: 'Show loading overlay' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Show error state' },
      { name: 'errorMessage', type: 'string', default: 'undefined', description: 'Error message to display' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state (50% opacity)' },
      { name: 'children', type: 'ReactNode', default: 'undefined', description: 'Card content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Navigates through interactive elements within card' },
    ],
    aria: [
      { attr: 'aria-hidden="true"', description: 'On decorative device icon' },
    ],
    screenReader: 'Card uses semantic Heading for title. Loading overlay spinner has role="status".',
    codeExample: `<SmartHomeCard icon="🔥" title="Thermostat" colorTheme="ember">
  <SmartHomeCard.Status>
    <Badge variant="sage">Online</Badge>
  </SmartHomeCard.Status>
  <SmartHomeCard.Controls>
    <Slider value={20} onChange={setTemp} aria-label="Temperature" />
  </SmartHomeCard.Controls>
</SmartHomeCard>

{/* Namespace sub-components */}
SmartHomeCard.Header   {/* Icon + title area */}
SmartHomeCard.Status   {/* Badges, indicators */}
SmartHomeCard.Controls {/* Sliders, buttons */}`,
  },

  StatusCard: {
    name: 'StatusCard',
    description: 'Read-only device status card extending SmartHomeCard with Badge and ConnectionStatus',
    category: 'Smart Home',
    props: [
      { name: 'icon', type: 'ReactNode', default: 'undefined', description: 'Device icon' },
      { name: 'title', type: 'string', default: 'undefined', description: 'Card title' },
      { name: 'size', type: "'compact'|'default'", default: "'default'", description: 'Card size' },
      { name: 'colorTheme', type: "'ember'|'ocean'|'sage'|'warning'|'danger'", default: "'ember'", description: 'Color for accent bar' },
      { name: 'status', type: 'string', default: 'undefined', description: 'Status text for Badge' },
      { name: 'statusVariant', type: "'ember'|'sage'|'ocean'|'warning'|'danger'|'neutral'", default: "'neutral'", description: 'Badge color variant' },
      { name: 'connectionStatus', type: "'online'|'offline'|'connecting'|'unknown'", default: 'undefined', description: 'Connection state' },
      { name: 'isLoading', type: 'boolean', default: 'false', description: 'Show loading overlay' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Show error state' },
      { name: 'errorMessage', type: 'string', default: 'undefined', description: 'Error message' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'children', type: 'ReactNode', default: 'undefined', description: 'Additional custom content' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Navigates through interactive elements' },
    ],
    aria: [],
    screenReader: 'Badge and ConnectionStatus have appropriate ARIA attributes. Status changes announced.',
    codeExample: `<StatusCard
  icon="🌡️"
  title="Thermostat"
  status="Heating"
  statusVariant="ember"
  connectionStatus="online"
/>

{/* Compact for dashboard */}
<StatusCard
  icon="💡"
  title="Lights"
  size="compact"
  status="On"
  statusVariant="sage"
>
  <p>2 lights active</p>
</StatusCard>`,
  },

  DeviceCard: {
    name: 'DeviceCard',
    description: 'Full-featured device control card with backwards-compatible legacy props',
    category: 'Smart Home',
    props: [
      { name: 'icon', type: 'string', default: 'undefined', description: 'Device icon emoji' },
      { name: 'title', type: 'string', default: 'undefined', description: 'Device title' },
      { name: 'colorTheme', type: "'ember'|'ocean'|'sage'|'warning'|'danger'|'primary'|'info'|'success'", default: "'ember'", description: 'Color theme (legacy names mapped)' },
      { name: 'connected', type: 'boolean', default: 'true', description: 'Connection status' },
      { name: 'connectionError', type: 'string', default: 'null', description: 'Connection error message' },
      { name: 'onConnect', type: '() => void', default: 'undefined', description: 'Connect button handler' },
      { name: 'connectButtonLabel', type: 'string', default: "'Connetti'", description: 'Connect button text' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state (legacy)' },
      { name: 'isLoading', type: 'boolean', default: 'undefined', description: 'Loading state (new API)' },
      { name: 'loadingMessage', type: 'string', default: "'Caricamento...'", description: 'Loading overlay message' },
      { name: 'statusBadge', type: '{label, color, icon}', default: 'undefined', description: 'Status badge config' },
      { name: 'healthStatus', type: "'ok'|'warning'|'error'|'critical'", default: 'undefined', description: 'Health indicator status' },
      { name: 'banners', type: 'Array<{variant, title, description, dismissible, onDismiss}>', default: '[]', description: 'Banner notifications' },
      { name: 'infoBoxes', type: 'Array<{icon, label, value, valueColor}>', default: '[]', description: 'Info box grid' },
      { name: 'footerActions', type: 'Array<{label, variant, onClick}>', default: '[]', description: 'Footer action buttons' },
      { name: 'size', type: "'compact'|'default'", default: "'default'", description: 'Card size variant' },
      { name: 'children', type: 'ReactNode', default: 'undefined', description: 'Main content area' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Tab', action: 'Navigates through interactive elements within card' },
      { key: 'Enter', action: 'Activates focused button' },
      { key: 'Space', action: 'Activates focused button' },
    ],
    aria: [],
    screenReader: 'Card combines multiple accessible components. Status badge uses Badge component. Health uses HealthIndicator.',
    codeExample: `<DeviceCard
  icon="🔥"
  title="Thermostat"
  colorTheme="ember"
  connected={isConnected}
  onConnect={handleConnect}
  statusBadge={{ label: 'HEATING', color: 'ember' }}
  healthStatus="ok"
  banners={[
    { variant: 'warning', title: 'Low battery' }
  ]}
  footerActions={[
    { label: 'Settings', variant: 'subtle', onClick: openSettings }
  ]}
>
  <Slider value={temp} onChange={setTemp} />
</DeviceCard>`,
  },

  ControlButton: {
    name: 'ControlButton',
    description: 'Increment/Decrement button with long-press support and haptic feedback',
    category: 'Smart Home',
    props: [
      { name: 'type', type: "'increment'|'decrement'", default: "'increment'", description: 'Button type (+ or -)' },
      { name: 'variant', type: "'ember'|'ocean'|'sage'|'warning'|'danger'|'subtle'", default: "'ember'", description: 'Color variant' },
      { name: 'size', type: "'sm'|'md'|'lg'", default: "'lg'", description: 'Button size (44px, 48px, 56px min)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'onChange', type: '(delta: number) => void', default: 'undefined', description: 'Called with +step or -step value' },
      { name: 'step', type: 'number', default: '1', description: 'Step size for increment/decrement' },
      { name: 'longPressDelay', type: 'number', default: '400', description: 'Initial delay before repeat (ms)' },
      { name: 'longPressInterval', type: 'number', default: '100', description: 'Repeat interval (ms)' },
      { name: 'haptic', type: 'boolean', default: 'true', description: 'Enable haptic feedback' },
      { name: 'onClick', type: '() => void', default: 'undefined', description: 'DEPRECATED: Use onChange instead' },
      { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes' },
    ],
    keyboard: [
      { key: 'Enter', action: 'Triggers single increment/decrement' },
      { key: 'Space', action: 'Triggers single increment/decrement' },
      { key: 'Tab', action: 'Moves focus to/from button' },
    ],
    aria: [
      { attr: 'aria-label', description: '"Incrementa" or "Decrementa" (Italian)' },
    ],
    screenReader: 'Announces as "Button, Incrementa/Decrementa". Note: Long-press uses mouse events for continuous adjustment.',
    codeExample: `{/* Basic usage with bounded value */}
const handleChange = (delta) => {
  setBrightness(prev => Math.max(0, Math.min(100, prev + delta)));
};

<div className="flex items-center gap-4">
  <ControlButton
    type="decrement"
    onChange={handleChange}
    step={5}
    disabled={brightness <= 0}
  />
  <span>{brightness}%</span>
  <ControlButton
    type="increment"
    onChange={handleChange}
    step={5}
    disabled={brightness >= 100}
  />
</div>`,
  },
};

/**
 * Get components by category
 * @param {string} category - Category name
 * @returns {Object} Components in that category
 */
export function getComponentsByCategory(category) {
  return Object.fromEntries(
    Object.entries(componentDocs).filter(([, doc]) => doc.category === category)
  );
}

/**
 * Get all categories
 * @returns {string[]} Array of unique categories
 */
export function getCategories() {
  const categories = new Set(Object.values(componentDocs).map((doc) => doc.category));
  return Array.from(categories);
}

/**
 * Get component by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component documentation
 */
export function getComponentDoc(name) {
  return componentDocs[name];
}

export default componentDocs;
