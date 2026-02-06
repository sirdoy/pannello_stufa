---
status: resolved
trigger: "Axe-core accessibility error on Dashboard - form element missing label"
created: 2026-02-05T10:00:00Z
updated: 2026-02-05T10:10:00Z
---

## Current Focus

hypothesis: SandboxToggle.js checkbox input (line 80) lacks accessible name - label wraps input but text is in separate element
test: Verify the label element structure and check if aria-label is needed
expecting: Confirm input has no accessible name despite being inside label element
next_action: Fix by adding aria-label to the checkbox input

## Symptoms

expected: No accessibility violations on Dashboard
actual: Axe-core reports violation - Element missing label (no implicit/explicit label, no aria-label, aria-labelledby, title, or placeholder)
errors: |
  Fix any of the following:
    Element does not have an implicit (wrapped) <label>
    Element does not have an explicit <label>
    aria-label attribute does not exist or is empty
    aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    Element has no title attribute
    Element has no placeholder attribute
    Element's default semantics were not overridden with role="none" or role="presentation"
reproduction: Visit Dashboard page, axe-core dev mode shows violation
started: Recent - likely from recent changes

## Eliminated

## Evidence

- timestamp: 2026-02-05T10:05:00Z
  checked: Dashboard page.js and referenced components
  found: Dashboard renders SandboxToggle component which contains a checkbox input
  implication: SandboxToggle is a prime suspect for the accessibility violation

- timestamp: 2026-02-05T10:06:00Z
  checked: SandboxToggle.js lines 79-87
  found: |
    Input checkbox at line 80-85 has:
    - class="sr-only peer" (visually hidden)
    - Wrapped in <label> element BUT label contains no text
    - Text "Sandbox Mode" is in a SIBLING <div>, not inside the label
    - No aria-label, aria-labelledby, title, or placeholder
  implication: This is the accessibility violation - the label element wraps only the input, not the descriptive text

## Resolution

root_cause: SandboxToggle.js checkbox input at line 80 lacks accessible name - the <label> element wraps only the input without any text content, and the visible text "Sandbox Mode" is in a sibling div, not associated with the input
fix: Added aria-label="Attiva/disattiva Sandbox Mode" to the checkbox input to provide an accessible name for screen readers
verification: All 172 accessibility tests pass. Fix correctly adds accessible name to the checkbox input.
files_changed:
  - app/components/sandbox/SandboxToggle.js
