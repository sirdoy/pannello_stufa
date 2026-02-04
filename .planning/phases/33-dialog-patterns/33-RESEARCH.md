# Phase 33: Dialog Patterns - Research

**Researched:** 2026-02-04
**Domain:** React dialog patterns, React Hook Form integration, confirmation UX
**Confidence:** HIGH

## Summary

Dialog patterns for confirmation and form modals require careful attention to accessibility, focus management, and validation UX. The research examined current best practices for 2026, focusing on destructive action patterns, form validation timing, and React Hook Form integration with Radix Dialog primitives.

The standard approach combines:
- **Radix Dialog** for accessible modal primitives with built-in focus trap
- **React Hook Form 7.x** with Zod validation for type-safe form handling
- **CVA variants** for consistent styling with Ember Noir design system
- **Hybrid validation timing** (reward early, punish late) for optimal UX
- **Careful focus management** with safe defaults for destructive actions

This phase builds on existing Modal.js foundation (already using Radix Dialog) and NotificationSettingsForm.js patterns (already using React Hook Form + Zod).

**Primary recommendation:** Create reusable ConfirmationDialog and FormModal components that extend the existing Modal foundation with opinionated patterns for common dialog types, following established codebase conventions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | ^1.1.14 | Modal primitives | Already in codebase, provides accessible focus trap, ESC/outside click handling |
| react-hook-form | ^7.54.2 | Form state management | Already in codebase, minimal re-renders, excellent validation integration |
| @hookform/resolvers | ^3.9.3 | Validation resolver | Already in codebase, bridges RHF to Zod |
| zod | ^3.24.2 | Schema validation | Already in codebase, type-safe runtime validation |
| class-variance-authority | ^0.7.1 | Variant styling | Already in codebase, type-safe variants matching Button/Modal patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-visually-hidden | ^1.2.4 | Accessibility fallbacks | Already used in Modal.js for screen reader content |
| lucide-react | ^0.562.0 | Icon library | Already in codebase for warning/check icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Dialog | Headless UI Dialog | Radix already integrated, consistent with existing Modal.js |
| React Hook Form | Formik | RHF already integrated, better performance for complex forms |
| Zod | Yup | Zod already integrated, TypeScript-first approach preferred |

**Installation:**
```bash
# All dependencies already installed
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
```
app/components/ui/
├── Modal.js                    # Existing foundation (Radix Dialog wrapper)
├── ConfirmationDialog.js       # NEW: Specialized confirmation pattern
├── FormModal.js                # NEW: Form validation pattern
├── Button.js                   # Existing, already has danger variant
└── __tests__/
    ├── ConfirmationDialog.test.js
    └── FormModal.test.js
```

### Pattern 1: ConfirmationDialog Component
**What:** Specialized Modal variant for binary decisions (Cancel/Confirm) with danger styling for destructive actions.

**When to use:** Delete operations, irreversible actions, critical confirmations.

**Example:**
```jsx
// Source: User requirements + NN/G confirmation dialog best practices
<ConfirmationDialog
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  title="Delete device?"
  description="This will permanently remove 'Living Room Thermostat' and all its history."
  confirmLabel="Delete Device"
  cancelLabel="Cancel"
  variant="danger" // Focus on Cancel, red outline confirm button
  loading={isDeleting}
/>
```

**Key decisions (from CONTEXT.md):**
- Initial focus: Cancel button for destructive, Confirm for non-destructive
- Enter confirms only when button is focused (no Cmd+Enter shortcuts)
- Danger styling: red outline/ghost, not solid red (maintains Ember Noir feel)
- Loading state: prevents close, disables buttons, shows spinner

### Pattern 2: FormModal Component
**What:** Modal with integrated React Hook Form, validation display, and loading states.

**When to use:** Add/edit operations requiring validated input (add schedule, edit device name, etc.)

**Example:**
```jsx
// Source: React Hook Form docs + existing NotificationSettingsForm.js patterns
<FormModal
  isOpen={showEdit}
  onClose={() => setShowEdit(false)}
  onSubmit={handleSubmit}
  title="Edit Schedule"
  defaultValues={{ name: 'Morning Warmup', time: '07:00' }}
  validationSchema={scheduleSchema}
  loading={isSaving}
  successMessage="Schedule updated!"
>
  {({ control, formState }) => (
    <>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Input
            label="Schedule Name"
            {...field}
            error={formState.errors.name?.message}
          />
        )}
      />
      <Controller
        name="time"
        control={control}
        render={({ field }) => (
          <Input
            type="time"
            label="Time"
            {...field}
            error={formState.errors.time?.message}
          />
        )}
      />
    </>
  )}
</FormModal>
```

**Key decisions (from CONTEXT.md):**
- Hybrid validation: on blur for touched fields, all on submit
- Error display: inline below fields AND summary at top
- Invalid fields: shake animation + red border
- Auto-scroll to first error with focus on submit
- Loading: disable all fields, prevent close, show "Saving..." on submit button
- Success: brief checkmark (~0.5-1s) before auto-close

### Pattern 3: Focus Management
**What:** Safe defaults for focus placement in destructive vs non-destructive dialogs.

**Radix Dialog focus management:**
```jsx
// Source: Radix Dialog docs + destructive action UX research
// Radix handles focus trap automatically, use autoFocus to control initial focus

// Destructive action - focus Cancel (safe default)
<ConfirmationDialog variant="danger">
  <Modal.Footer>
    <Button variant="subtle" autoFocus>Cancel</Button> {/* Focus here */}
    <Button variant="danger">Delete</Button>
  </Modal.Footer>
</ConfirmationDialog>

// Non-destructive action - focus Confirm
<ConfirmationDialog>
  <Modal.Footer>
    <Button variant="subtle">Cancel</Button>
    <Button variant="ember" autoFocus>Confirm</Button> {/* Focus here */}
  </Modal.Footer>
</ConfirmationDialog>

// Form modal - focus first input (Radix default behavior)
<FormModal>
  <Input label="Name" autoFocus /> {/* Focus here */}
</FormModal>
```

### Pattern 4: Preventing Close During Loading
**What:** Prevent accidental dismissal while async operations are in progress.

**Example:**
```jsx
// Source: Radix Dialog discussions + user requirements
<DialogPrimitive.Content
  onPointerDownOutside={(e) => loading && e.preventDefault()}
  onEscapeKeyDown={(e) => loading && e.preventDefault()}
>
  {children}
</DialogPrimitive.Content>
```

### Pattern 5: React Hook Form Integration
**What:** Proper form instance management within modals using portals.

**Example:**
```jsx
// Source: React Hook Form FAQs + existing NotificationSettingsForm.js
function FormModal({ onSubmit, defaultValues, validationSchema, children }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    reset,
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
    mode: 'onBlur', // Hybrid validation (CONTEXT.md decision)
    reValidateMode: 'onChange', // Show errors immediately after first blur
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  // Scroll to first error on submit
  const onSubmitWithScroll = async (data) => {
    try {
      await onSubmit(data);
    } catch (err) {
      // Find first error and scroll to it
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        setFocus(firstError, { shouldSelect: true });
        // Trigger shake animation on error field
      }
    }
  };

  return (
    <Modal isOpen={isOpen}>
      <form onSubmit={handleSubmit(onSubmitWithScroll)}>
        {/* Error summary at top */}
        {Object.keys(errors).length > 0 && (
          <ErrorSummary errors={errors} />
        )}

        {/* Form fields with inline errors */}
        {children({ control, formState })}
      </form>
    </Modal>
  );
}
```

### Anti-Patterns to Avoid
- **Multiple useForm instances in nested modals:** Use single instance at modal root, not nested forms
- **Blocking ESC key without user consent:** Always allow ESC unless actively loading
- **Ambiguous button labels:** Use "Delete Device" not "Yes", "Cancel" not "No"
- **Premature validation errors:** Don't show errors before user finishes typing (use onBlur)
- **Solid red buttons for danger:** Use outline/ghost to maintain brand consistency
- **Auto-focus on destructive action:** Always focus safe option (Cancel) for dangerous operations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in modal | Custom focus management | Radix Dialog (already integrated) | Handles Tab, Escape, Return-to-trigger, Portal rendering, Screen reader announcements |
| Form validation timing | Custom blur/submit logic | React Hook Form mode/reValidateMode | Optimized re-renders, tested edge cases, hybrid validation built-in |
| Scroll to error field | Custom scrollIntoView | RHF setFocus with refs | Integrates with validation, handles dynamic fields, focus management |
| Shake animation | Custom CSS animation | Reusable animation class | Needs animationend cleanup to retrigger, error boundary handling |
| Type-to-confirm | Manual string matching | Controlled Input with validation | Case sensitivity, internationalization, accessibility labels |
| Prevent modal close | Custom state flags | Radix onPointerDownOutside/onEscapeKeyDown | Handles edge cases, accessibility-compliant |

**Key insight:** Modal accessibility is complex (focus trap, keyboard nav, screen readers, return focus). Radix Dialog solves this comprehensively. Don't build custom modal primitives.

## Common Pitfalls

### Pitfall 1: Animation Class Not Retriggering
**What goes wrong:** Shake animation on validation error only works once, then stops animating on subsequent errors.

**Why it happens:** CSS animation class is already applied to element, browser won't re-animate unless class is removed first.

**How to avoid:** Remove animation class on `animationend` event, then re-add on next error:
```javascript
// Source: Multiple shake animation tutorials
const triggerShake = (element) => {
  element.classList.remove('animate-shake');
  // Force reflow to restart animation
  void element.offsetWidth;
  element.classList.add('animate-shake');
};
```

**Warning signs:** User reports "error animation doesn't show after first error"

### Pitfall 2: Focus Not Moving to Error Field
**What goes wrong:** `setFocus()` called after `setError()` doesn't focus the field, validation error appears but focus stays on submit button.

**Why it happens:** React Hook Form batches state updates, `setFocus` executes before error ref is available in DOM.

**How to avoid:** Wrap `setFocus` in `requestAnimationFrame` or use `shouldFocus: true` option with `setError`:
```javascript
// Source: React Hook Form GitHub issues #13138, #4518
// Option 1: Use setError with shouldFocus
setError('email', {
  message: 'Invalid email',
  shouldFocus: true // Works for inline errors
});

// Option 2: Delay setFocus for async errors
setTimeout(() => {
  setFocus('email', { shouldSelect: true });
}, 0);

// Option 3: Access ref from formState.errors
const firstErrorRef = formState.errors[Object.keys(formState.errors)[0]]?.ref;
if (firstErrorRef) {
  firstErrorRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
  firstErrorRef.focus({ preventScroll: true });
}
```

**Warning signs:** `console.log('setFocus called')` logs but input doesn't receive focus

### Pitfall 3: Modal Closes During Form Submit
**What goes wrong:** User clicks outside modal or presses ESC while form is submitting, losing unsaved data.

**Why it happens:** Radix Dialog allows close by default, no loading state protection.

**How to avoid:** Conditionally prevent close based on loading state (see Pattern 4):
```javascript
// Source: User requirements + Radix Dialog discussions
<DialogPrimitive.Content
  onPointerDownOutside={(e) => {
    if (isSubmitting) {
      e.preventDefault();
    }
  }}
  onEscapeKeyDown={(e) => {
    if (isSubmitting) {
      e.preventDefault();
    }
  }}
>
```

**Warning signs:** Users report "form submitted but modal closed before seeing result"

### Pitfall 4: Button Order Inconsistency
**What goes wrong:** Some dialogs show "Cancel | Confirm", others show "Confirm | Cancel", confusing muscle memory.

**Why it happens:** No project standard, developers follow different platform conventions (Windows vs macOS).

**How to avoid:** **Pick one pattern and enforce consistently** across all dialogs. Research shows both patterns are valid, consistency matters more than choice.

**Recommendation (for this phase):** Use "Cancel | Confirm" (Cancel left, Confirm right) to match:
- Natural reading order (left-to-right)
- Material Design / Carbon Design System conventions
- User expectation that final action moves forward (right)

**Warning signs:** User feedback "I keep clicking the wrong button"

### Pitfall 5: Validation Errors Before User Finishes Typing
**What goes wrong:** Error message appears as user is typing email, showing "Invalid email" before they finish "user@example.com".

**Why it happens:** Using `mode: 'onChange'` validates on every keystroke.

**How to avoid:** Use hybrid validation timing from research (reward early, punish late):
```javascript
// Source: Smashing Magazine inline validation UX research
useForm({
  mode: 'onBlur', // Don't validate until user leaves field
  reValidateMode: 'onChange', // After first error, validate immediately (reward early)
});
```

**Warning signs:** User feedback "error messages are annoying while I'm typing"

## Code Examples

Verified patterns from official sources:

### Confirmation Dialog with Danger Variant
```jsx
// Source: User CONTEXT.md + Radix Dialog primitives
import { Modal, Button } from '@/app/components/ui';

function DeleteDeviceDialog({ device, isOpen, onClose, onConfirm, loading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <Modal.Header>
        <Modal.Title>Delete {device.name}?</Modal.Title>
        <Modal.Close />
      </Modal.Header>

      <Modal.Description>
        This will permanently remove this device and all its history.
        This action cannot be undone.
      </Modal.Description>

      <Modal.Footer>
        {/* Focus Cancel for destructive action (safe default) */}
        <Button
          variant="subtle"
          onClick={onClose}
          disabled={loading}
          autoFocus
        >
          Cancel
        </Button>

        {/* Red outline maintains Ember Noir feel */}
        <Button
          variant="outline"
          colorScheme="danger"
          onClick={onConfirm}
          loading={loading}
        >
          Delete Device
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

### Form Modal with Validation
```jsx
// Source: React Hook Form docs + existing NotificationSettingsForm.js
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Button, Input } from '@/app/components/ui';

function EditScheduleModal({ schedule, isOpen, onClose, onSubmit }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    reset,
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule,
    mode: 'onBlur', // Hybrid validation timing
    reValidateMode: 'onChange',
  });

  // Reset on open
  useEffect(() => {
    if (isOpen) reset(schedule);
  }, [isOpen, schedule, reset]);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        setFocus(firstError);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Header>
          <Modal.Title>Edit Schedule</Modal.Title>
          <Modal.Close />
        </Modal.Header>

        {/* Error summary at top */}
        {Object.keys(errors).length > 0 && (
          <ErrorSummary errors={errors} />
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                label="Schedule Name"
                {...field}
                error={errors.name?.message}
                disabled={isSubmitting}
                autoFocus
              />
            )}
          />

          <Controller
            name="time"
            control={control}
            render={({ field }) => (
              <Input
                type="time"
                label="Time"
                {...field}
                error={errors.time?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <Modal.Footer>
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="ember"
            loading={isSubmitting}
          >
            Save Schedule
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
```

### Shake Animation (Tailwind config)
```javascript
// Source: Multiple CSS shake animation tutorials
// Add to tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
};
```

### Prevent Close During Loading
```jsx
// Source: Radix Dialog docs + user requirements
import * as DialogPrimitive from '@radix-ui/react-dialog';

function FormModalContent({ loading, children }) {
  return (
    <DialogPrimitive.Content
      onPointerDownOutside={(e) => loading && e.preventDefault()}
      onEscapeKeyDown={(e) => loading && e.preventDefault()}
    >
      {children}
    </DialogPrimitive.Content>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Validate on submit only | Hybrid validation (onBlur + onChange) | ~2022 | Better UX, fewer frustrated users |
| Custom focus trap | Radix/Headless UI primitives | ~2021 | Accessible by default, less code |
| Formik + Yup | React Hook Form + Zod | ~2023 | Better TypeScript, fewer re-renders |
| Solid red danger buttons | Outline/ghost with red | ~2024 | Maintains brand consistency |
| Always focus first input | Context-aware focus (safe default for destructive) | ~2024 | Prevents accidental confirmations |

**Deprecated/outdated:**
- **react-modal library:** Replaced by Radix Dialog primitives (better accessibility)
- **Validate onChange for all fields:** Now hybrid timing (reward early, punish late)
- **"Yes/No" button labels:** Now descriptive labels ("Delete Device" / "Cancel")
- **Type-to-confirm for minor actions:** Reserved for truly destructive operations only

## Open Questions

Things that couldn't be fully resolved:

1. **Type-to-Confirm Implementation**
   - What we know: User mentioned as "Claude's Discretion", GitHub pattern requires typing repo name
   - What's unclear: Which destructive actions warrant this extra friction? All deletes or only critical ones?
   - Recommendation: Implement as optional prop on ConfirmationDialog, apply to device deletion but not history clearing (history can be recovered from Firebase)

2. **Button Order Convention**
   - What we know: Research shows both "Cancel | Confirm" and "Confirm | Cancel" are valid, consistency matters more
   - What's unclear: User marked as "Claude's Discretion", no existing dialogs in codebase to match
   - Recommendation: Use "Cancel | Confirm" (Cancel left, Confirm right) to match Material Design / Carbon Design patterns, document in design system

3. **Warning Icon for Destructive Dialogs**
   - What we know: Marked as "Claude's Discretion", common pattern is warning triangle or alert icon
   - What's unclear: Icon placement (in title, separate section), which icon from lucide-react
   - Recommendation: Use AlertTriangle from lucide-react, place in Modal.Header before title for destructive variant

4. **Backdrop Styling Differentiation**
   - What we know: User marked as "Claude's Discretion", could use red tint for danger
   - What's unclear: Would red backdrop conflict with Ember Noir dark aesthetic?
   - Recommendation: Keep consistent backdrop (don't tint red), rely on button styling and warning icon for danger signaling

## Sources

### Primary (HIGH confidence)
- Radix Dialog documentation (already integrated in Modal.js)
- React Hook Form documentation (already integrated in NotificationSettingsForm.js)
- Existing codebase patterns:
  - `/app/components/ui/Modal.js` - Radix Dialog wrapper with CVA variants
  - `/app/components/ui/Button.js` - CVA variants including danger, outline
  - `/app/settings/notifications/NotificationSettingsForm.js` - React Hook Form + Zod + Controller pattern
  - `/docs/design-system.md` - Ember Noir design system standards
  - `package.json` - Exact versions of all dependencies

### Secondary (MEDIUM confidence)
- [NN/G: Confirmation Dialogs Can Prevent User Errors](https://www.nngroup.com/articles/confirmation-dialog/)
- [Smashing Magazine: Inline Validation UX](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
- [Smashing Magazine: How To Manage Dangerous Actions In User Interfaces](https://www.smashingmagazine.com/2024/09/how-manage-dangerous-actions-user-interfaces/)
- [React Hook Form: setFocus documentation](https://react-hook-form.com/docs/useform/setfocus)
- [React Hook Form: setError documentation](https://react-hook-form.com/docs/useform/seterror)
- [GitHub discussions: React Hook Form scroll to error (#612, #9034)](https://github.com/react-hook-form/react-hook-form/issues/612)
- [GitHub discussions: Radix Dialog prevent close (#1997)](https://github.com/radix-ui/primitives/discussions/1997)

### Tertiary (LOW confidence)
- [Button order debate: OK-Cancel vs Cancel-OK](https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/) - No consensus, marked for validation
- Multiple CSS shake animation tutorials (consistent pattern across sources)
- Type-to-confirm pattern observations (GitHub, Vercel) - implementation details vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json with exact versions
- Architecture: HIGH - Patterns verified in existing codebase (Modal.js, NotificationSettingsForm.js)
- Pitfalls: HIGH - Common issues documented in GitHub discussions with verified solutions
- UX patterns: HIGH - Multiple authoritative sources (NN/G, Smashing Magazine) agree on best practices
- Button order: MEDIUM - Research shows both patterns valid, no codebase precedent to match

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain)

**Notes:**
- No new dependencies required, all patterns use existing stack
- User CONTEXT.md provided clear constraints (locked decisions vs discretion areas)
- Existing codebase already follows best practices (Radix Dialog, React Hook Form, CVA variants)
- Phase builds on solid foundation, minimal new concepts needed
