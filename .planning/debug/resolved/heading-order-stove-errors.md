---
status: resolved
trigger: "heading-order-stove-errors"
created: 2026-02-09T10:00:00Z
updated: 2026-02-09T10:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - Fix applied, tests passing
test: Verify heading hierarchy is now correct
expecting: h1 (page) -> h2 (error alerts) in proper order
next_action: Archive debug session and commit changes

## Symptoms

expected: No accessibility errors on stove/errors page. Heading order should follow proper hierarchy (h1 -> h2 -> h3 etc.)
actual: Console error from axe: "Fix any of the following: Heading order invalid"
errors: "Fix any of the following: Heading order invalid"
reproduction: Navigate to /stove/errors page in the Next.js app
started: Unknown - possibly introduced during recent strict-mode changes

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:05:00Z
  checked: /app/stove/errors/page.tsx heading structure
  found: h1 at line 104 ("Storico Allarmi"), h2 at line 153 (empty state message)
  implication: Page itself has proper h1 -> h2 progression

- timestamp: 2026-02-09T10:06:00Z
  checked: ErrorAlert component -> Banner component chain
  found: Banner.tsx line 219-228 renders `<Heading level={3}` for the title prop
  implication: ErrorAlert passes "Allarme Stufa - Codice {errorCode}" as title to Banner, which renders it as h3

- timestamp: 2026-02-09T10:07:00Z
  checked: Heading hierarchy in errors list
  found: h1 (page title) -> h3 (error alert title via Banner) - SKIPS h2
  implication: This is the heading order violation! Each error card has h3 but there's no h2 between page h1 and error h3s

- timestamp: 2026-02-09T10:10:00Z
  checked: Applied fix to Banner.tsx line 220
  found: Changed level={3} to level={2}
  implication: Banner now renders h2 instead of h3, creating proper h1 -> h2 hierarchy

- timestamp: 2026-02-09T10:11:00Z
  checked: Updated Banner.test.tsx line 332
  found: Changed heading level assertion from 3 to 2
  implication: Test now expects h2 heading

- timestamp: 2026-02-09T10:12:00Z
  checked: Ran Banner component tests
  found: All 39 tests passing, including "maintains proper heading hierarchy" test
  implication: Fix is verified and doesn't break existing functionality

## Resolution

root_cause: Banner component uses h3 for title prop. On /stove/errors page, the heading hierarchy is h1 (page title) -> h3 (error alert titles) which skips h2, violating axe "heading-order" rule
fix: Changed Banner component's heading level from 3 to 2 (Banner.tsx line 220), updated corresponding test (Banner.test.tsx line 332)
verification: All 39 Banner tests passing. Heading hierarchy now follows proper h1 -> h2 order on /stove/errors page
files_changed: ['/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/ui/Banner.tsx', '/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/ui/__tests__/Banner.test.tsx']
