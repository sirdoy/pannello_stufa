# Phase 33: Dialog Patterns - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create standardized ConfirmationDialog and FormModal patterns. ConfirmationDialog handles cancel/confirm flows with danger variant for destructive actions. FormModal integrates with React Hook Form for validation, loading states, and error display.

</domain>

<decisions>
## Implementation Decisions

### Confirmation Flow
- Initial focus depends on action type: Cancel for destructive, Confirm for non-destructive
- Enter key confirms only when button is focused (no Cmd+Enter shortcuts)

### Danger Styling
- Destructive confirm button uses red outline/ghost style (not solid red)
- Keeps Ember Noir brand feel while signaling danger

### Form Validation UX
- Hybrid validation timing: errors on blur for touched fields, remaining errors on submit
- Error display: both inline below fields AND summary at top of form
- Invalid fields get shake animation + red border
- Auto-scroll to first error field on submit with focus

### Loading/Submit States
- Submit button shows spinner + "Saving..." text during loading
- All form fields disabled during submit
- Modal cannot be closed while loading (prevent data loss)
- Brief checkmark success state (~0.5-1s) before auto-close

### Claude's Discretion
- Button order (Cancel | Confirm vs Confirm | Cancel)
- Escape key behavior
- Warning icon presence/style for destructive dialogs
- Type-to-confirm feature (whether to implement)
- Backdrop styling for destructive vs normal dialogs

</decisions>

<specifics>
## Specific Ideas

- Shake animation for validation errors — draws attention without being annoying
- Success checkmark before close — gives confidence the action completed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 33-dialog-patterns*
*Context gathered: 2026-02-04*
