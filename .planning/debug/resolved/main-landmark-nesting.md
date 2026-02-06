---
status: resolved
trigger: "main-landmark-nesting"
created: 2026-02-06T10:00:00Z
updated: 2026-02-06T10:15:00Z
---

## Current Focus

hypothesis: Fix applied - removed nested <main> from page.js
test: Verify HTML structure now has single <main> landmark
expecting: No accessibility errors about landmark nesting
next_action: Archive debug session after verification

## Symptoms

expected: No accessibility errors on the home page. The `<main>` landmark should be a top-level landmark, not contained within another landmark.
actual: Console error from accessibility checker: "Fix any of the following: The main landmark is contained in another landmark."
errors: "Fix any of the following: The main landmark is contained in another landmark."
reproduction: Load the home page (/) in Next.js 15.5 app
started: Current state of the codebase

## Eliminated

## Evidence

- timestamp: 2026-02-06T10:05:00Z
  checked: app/layout.js (lines 82-86)
  found: Root layout contains `<main id="main-content">` element that wraps {children}
  implication: This creates a <main> landmark in the root layout

- timestamp: 2026-02-06T10:05:30Z
  checked: app/page.js (lines 45-84)
  found: Home page ALSO contains `<main>` element (line 45) that wraps the entire page content
  implication: This creates TWO nested <main> landmarks - one from layout.js and one from page.js

- timestamp: 2026-02-06T10:06:00Z
  checked: HTML structure hierarchy
  found: layout.js renders <main id="main-content">{children}</main>, and page.js returns <main>...</main> as {children}
  implication: Final DOM has <main id="main-content"><main>...</main></main> - nested landmarks!

## Resolution

root_cause: The home page (app/page.js) contains a `<main>` element that is rendered inside the root layout's `<main id="main-content">` element, creating nested main landmarks. The root layout already provides the semantic <main> wrapper, so individual pages should NOT add their own <main> element.

fix: Replaced `<main>` wrapper in app/page.js with React fragment `<>...</>`. The page content is now correctly rendered inside the root layout's <main id="main-content"> element without nesting.

verification:
- ✅ Read app/page.js - confirmed <main> replaced with <>
- ✅ HTML structure now correct: layout.js provides <main id="main-content">, page.js content renders inside it
- ✅ Searched all other page.js files - no other instances of nested <main> found
- ✅ Accessibility landmark structure now valid: single <main> landmark at correct level

files_changed: ["app/page.js"]
