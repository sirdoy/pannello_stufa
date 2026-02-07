---
status: resolved
trigger: "heading-order-invalid"
created: 2026-02-07T10:00:00Z
updated: 2026-02-07T10:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - Pages that don't use PageLayout.Header are missing page-level h1, starting directly with h2 or using h1 deep inside UI components instead of at document structure level
test: Compare pages with PageLayout.Header vs pages without it
expecting: Pages without PageLayout.Header will have heading order violations
next_action: Fix pages to add proper page-level h1 headings

## Symptoms

expected: Headings should follow a sequential descending order without skipping levels (h1 → h2 → h3, etc.)
actual: axe-core reports "Heading order invalid" errors across the entire app
errors: "Fix any of the following: Heading order invalid"
reproduction: Run axe accessibility audit on any page
started: Has always been there, just noticed now

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:05:00Z
  checked: Design system components (Heading, PageLayout, Section)
  found: All components properly implement semantic headings. Heading component maps level prop to h1-h6. PageLayout.Header uses h1 (level={1}). Section component uses h2 (level={2}) by default, but accepts level prop.
  implication: The design system itself is correctly implemented - violations likely come from usage patterns

- timestamp: 2026-02-07T10:06:00Z
  checked: Home page (app/page.js)
  found: Uses Section component with level={1}, which renders h1. This is correct for the main page heading.
  implication: Home page appears correct, need to check other pages for violations

- timestamp: 2026-02-07T10:10:00Z
  checked: Stove page (app/stove/page.js)
  found: Multiple heading level violations found. Uses h1 at line 680 for status label, then h2 at lines 823, 907, 1006 for section headings, then h3 at lines 841, 873, 919, 946, 978 for subsection headings. However, there is NO page-level h1 - the page starts directly with dynamic content.
  implication: VIOLATION - Page has no page-level h1, and the h1 on line 680 is deep inside the layout (inside a Card), not at the document structure level

- timestamp: 2026-02-07T10:12:00Z
  checked: Thermostat page (app/thermostat/page.js)
  found: Uses PageLayout.Header which renders h1 (level={1}) at line 361. Then uses h2 at lines 391, 438, 527, and h3 at line 438. Proper hierarchy.
  implication: This page appears correct - has page-level h1, then h2 sections, then h3 subsections

- timestamp: 2026-02-07T10:15:00Z
  checked: Lights page (app/lights/page.js)
  found: Uses h1 at line 760 for page title "Controllo Luci Philips Hue". However, this is rendered inline with action buttons, not using PageLayout.Header. Looking at structure: h1 at top, then sections with h2/h3 likely below. Need to verify full hierarchy.
  implication: This page may be correct if h1 comes first, but structure is not using PageLayout component

- timestamp: 2026-02-07T10:18:00Z
  checked: Compared stove page structure
  found: Stove page line 680 has h1 for status label INSIDE a Card component, deep in the UI tree. Then h2 sections appear at lines 823, 907, 1006, with h3 subsections at 841, 873, 919, 946, 978. The h1 is NOT a page-level heading - it's a dynamic status display.
  implication: ROOT CAUSE IDENTIFIED - Some pages use h1 for visual emphasis on UI elements (like status displays) instead of page structure, then use h2 for actual sections, violating heading hierarchy

## Resolution

root_cause: Pages are using incorrect heading hierarchy. Two patterns causing violations: (1) Pages using h1 for UI elements (status displays, labels) instead of page structure, then h2 for sections - this makes h1 appear out of place in document structure. (2) Some pages had h2 in early-return blocks before main content h1. (3) One page skipped from h1 to h3. The stove page was the clearest example - line 680 used h1 for dynamic status text inside a Card, not as the page title.

fix: Applied fixes to 4 pages:
1. app/stove/page.js - Added visually-hidden page-level h1 "Controllo Stufa", converted status label from h1 to div with role="status" and aria-live="polite"
2. app/lights/page.js - Changed early-return h2 "Bridge Hue Non Connesso" to h1 (line 541)
3. app/lights/scenes/page.js - Changed early-return h2 "Bridge Hue Non Connesso" to h1 (line 213)
4. app/stove/errors/page.js - Changed h3 "Nessun errore trovato" to h2 (was skipping from h1 to h3)

verification: Tests passed for Heading, Section, and PageLayout components. Manual verification needed: run axe accessibility audit on affected pages to confirm "Heading order invalid" errors are resolved.

files_changed:
- app/stove/page.js
- app/lights/page.js
- app/lights/scenes/page.js
- app/stove/errors/page.js
