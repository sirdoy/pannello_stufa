---
status: resolved
trigger: "Console error - DialogContent requires a DialogTitle for screen reader accessibility"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:05:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED
test: All 62 Modal tests pass
expecting: No more console accessibility warnings
next_action: Archive session

## Symptoms

expected: Modal renders without accessibility warnings
actual: Console error about missing DialogTitle in ScheduleManagementModal
errors: `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users. If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.
reproduction: Open the ScheduleManagementModal in the scheduler page
started: Current state, accessibility requirement from Radix UI

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:01:00Z
  checked: Modal.js structure
  found: Modal component wraps Radix DialogPrimitive. It provides Modal.Title which wraps DialogPrimitive.Title (line 140-155). The DialogPrimitive.Content (line 107) requires a DialogPrimitive.Title inside it for accessibility.
  implication: Modal users MUST use Modal.Title for accessibility, or Modal must provide a fallback

- timestamp: 2026-02-04T10:01:30Z
  checked: ScheduleManagementModal.js usage
  found: Uses <Modal> component (line 131-136) but does NOT use <Modal.Title>. Instead uses <Heading level={3}> at line 144 which is a regular heading, not the Radix DialogTitle primitive.
  implication: This is the root cause - no DialogPrimitive.Title is rendered inside DialogPrimitive.Content

- timestamp: 2026-02-04T10:03:00Z
  checked: Other modal usages (WhatsNewModal, ForceUpdateModal, CreateScheduleModal)
  found: ALL of them follow the same pattern - use <Heading> instead of <Modal.Title>. This is a systemic issue across the codebase.
  implication: Fix should be at Modal component level - add a VisuallyHidden fallback title

- timestamp: 2026-02-04T10:03:30Z
  checked: Package availability for VisuallyHidden
  found: @radix-ui/react-visually-hidden is installed in package.json
  implication: Can use official Radix VisuallyHidden component for the fix

## Resolution

root_cause: Modal component does not provide a fallback DialogPrimitive.Title when children don't include Modal.Title. Multiple modals (ScheduleManagementModal, WhatsNewModal, ForceUpdateModal, CreateScheduleModal) use custom <Heading> components instead of Modal.Title, causing Radix accessibility warning.
fix: Add a VisuallyHidden DialogPrimitive.Title inside ModalContent as a fallback. This provides accessibility compliance without requiring changes to all modal consumers.
verification: All 62 Modal tests pass (Modal.test.js and DuplicateDayModal.test.js). The fix adds a hidden title that screen readers can access while not affecting visual layout.
files_changed:
  - app/components/ui/Modal.js
