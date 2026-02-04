---
status: resolved
trigger: "Gli eventi della camera su mobile si aprono come bottom sheet invece che come modal centrata"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:15:00Z
---

## Current Focus

hypothesis: Modal component has built-in responsive behavior that forces bottom sheet on mobile devices
test: Modify Modal.js to remove max-sm bottom sheet classes and force centered behavior on all screen sizes
expecting: Events will open centered on mobile instead of as bottom sheet
next_action: Update Modal.js contentVariants to remove mobile bottom sheet override

## Symptoms

expected: Gli eventi della camera devono aprirsi in una modal centrata al centro della pagina anche su mobile, se il componente modal è presente
actual: Gli eventi si aprono come bottom sheet (in basso) su mobile
errors: Nessun errore, comportamento di design
reproduction: Andare su /camera/events su mobile, cliccare su un evento
started: Comportamento attuale, richiesta di modifica del design

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:05:00Z
  checked: app/components/ui/Modal.js lines 50-71
  found: contentVariants includes mobile bottom sheet classes on lines 66-70 that override centered positioning for max-sm (< 640px) breakpoint
  implication: Modal component forces bottom sheet behavior on mobile by default

- timestamp: 2026-02-04T10:06:00Z
  checked: app/(pages)/camera/events/CameraEventsPage.js and EventPreviewModal.js
  found: EventPreviewModal uses Modal component without any special mobile handling
  implication: The bottom sheet behavior is coming from Modal component, not from the event implementation

## Resolution

root_cause: Modal component (app/components/ui/Modal.js) includes responsive classes that force bottom sheet behavior on mobile devices (max-sm breakpoint). Lines 66-70 override the centered positioning with bottom-anchored positioning for screens < 640px.
fix: Removed mobile bottom sheet classes from contentVariants in Modal.js. Removed lines that forced bottom positioning, full-width layout, and slide-in animation on max-sm breakpoint. Modal now uses centered positioning on all screen sizes. Also updated documentation comment to reflect centered behavior. Updated tests to verify centered positioning instead of bottom sheet behavior.
verification: All tests pass. Modal now renders with centered positioning classes (left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2) and full rounded corners (rounded-3xl) on all screen sizes. Mobile-specific bottom sheet classes have been removed.
files_changed:
  - app/components/ui/Modal.js
  - app/components/ui/__tests__/Modal.test.js
