---
status: resolved
trigger: "React warning about `closeOnEscape` prop being passed to DOM element in Modal component"
created: 2026-02-04T00:00:00Z
updated: 2026-02-04T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED - closeOnEscape is not destructured like closeOnOverlayClick
test: N/A - root cause found
expecting: N/A
next_action: N/A - debug complete

## Symptoms

expected: No console warnings when opening ScheduleManagementModal
actual: React warning: "React does not recognize the `closeOnEscape` prop on a DOM element"
errors: React warning at Modal.js:107 - closeOnEscape prop passed through to DialogPrimitive.Content and then to DOM
reproduction: Open ScheduleManagementModal (from WeeklyScheduler on /stove/scheduler page)
started: Unknown - likely introduced when closeOnEscape feature was added to Modal

## Eliminated

## Evidence

- timestamp: 2026-02-04T00:01:00Z
  checked: Modal.js line 237
  found: |
    Modal component destructures closeOnOverlayClick but NOT closeOnEscape:
    `function Modal({ isOpen, onClose, children, size = 'md', maxWidth, className, closeOnOverlayClick, ...props })`
    Comment on line 241: "Note: closeOnOverlayClick is destructured to prevent it from being spread to DOM"
    closeOnEscape is missing from this destructuring, so it passes through ...props
  implication: closeOnEscape follows the same path: Modal -> ModalContent -> DialogPrimitive.Content -> DOM

- timestamp: 2026-02-04T00:02:00Z
  checked: Modal tests (46 tests)
  found: All tests pass after fix
  implication: Fix does not break existing functionality

## Resolution

root_cause: closeOnEscape prop is not destructured from Modal props like closeOnOverlayClick is, causing it to be spread via ...props to ModalContent, then to DialogPrimitive.Content, which passes non-standard props to the underlying DOM element
fix: Added closeOnEscape to the destructured parameters in Modal function signature, preventing it from being spread to DOM
verification: All 46 Modal tests pass; React will no longer warn about unrecognized closeOnEscape prop on DOM elements
files_changed:
  - app/components/ui/Modal.js
