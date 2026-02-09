---
status: resolved
trigger: "heading-order-camera-page"
created: 2026-02-09T10:30:00Z
updated: 2026-02-09T10:47:00Z
---

## Current Focus

hypothesis: Fix applied successfully, tests pass
test: Verify heading hierarchy is now proper (h1→h2→h3)
expecting: All tests pass, hierarchy violations resolved
next_action: Verify complete hierarchy and commit fix

## Symptoms

expected: Page should have proper heading hierarchy (h1 → h2 → h3, etc.) with no skipped levels, and should contain at least one h1 element.
actual: Two axe violations reported:
  1. `heading-order` (moderate) — Heading levels should only increase by one
  2. `page-has-heading-one` (moderate) — Page should contain a level-one heading
errors: forward-logs-shared.ts:95 New axe issues
  forward-logs-shared.ts:95 moderate: Heading levels should only increase by one https://dequeuniversity.com/rules/axe/4.11/heading-order
  forward-logs-shared.ts:95 moderate: Page should contain a level-one heading https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one
reproduction: Open the camera page in the app
started: Current state of the code

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:35:00Z
  checked: Camera page structure (CameraDashboard.tsx)
  found: Section component uses level={2} by default (line 89), renders h2 for "Videocamere" title
  implication: No h1 element on the page

- timestamp: 2026-02-09T10:36:00Z
  checked: Heading hierarchy in CameraDashboard
  found: Section title="Videocamere" (h2) → CardTitle (h2, line 139 of Card.tsx) → Heading level={4} (line 263, 376)
  implication: Hierarchy jumps from h2 → h2 → h4, skipping h3

- timestamp: 2026-02-09T10:37:00Z
  checked: CardTitle component implementation
  found: CardTitle hardcodes level={2} (Card.tsx line 139)
  implication: CardTitle always renders h2, regardless of context

- timestamp: 2026-02-09T10:38:00Z
  checked: Recent fix pattern (commit d47b9b8)
  found: Banner component changed from level={3} to level={2} to fix heading order
  implication: Pattern is to adjust heading levels to maintain proper sequence

- timestamp: 2026-02-09T10:45:00Z
  checked: Final heading hierarchy after fix
  found: h1 (Section "Videocamere") → h2 (CardTitle "Le tue telecamere", CardTitle "{camera.name}") → h3 (Heading "{camera.name}", Heading "Eventi recenti")
  implication: Proper sequential hierarchy with no gaps, h1 present on page

## Resolution

root_cause: Camera page has two violations:
  1. Missing h1: Section component defaults to level={2}, rendering h2 for page title "Videocamere" instead of h1
  2. Skipped heading levels: CardTitle hardcodes h2, appearing after Section's h2, followed by h4 headings, creating h2→h2→h4 sequence (skips h3)
fix:
  1. Added level prop to CardTitle component (Card.tsx) with default of 2
  2. Changed all Section components in CameraDashboard to use level={1} for page title
  3. Changed CardTitle components to use level={2} for card headings (under h1)
  4. Changed inline Heading level={4} to level={3} for proper hierarchy
  5. Changed standalone Heading in needsReauth state from level={3} to level={2}
  6. Updated Card.test.tsx with tests for CardTitle level prop
verification:
  - CardTitle tests pass (6 tests including new level prop tests)
  - Heading hierarchy verified: h1 (page title) → h2 (card titles) → h3 (section headings)
  - No skipped levels in hierarchy
  - Page now has exactly one h1 element (Section title "Videocamere")
files_changed:
  - app/components/ui/Card.tsx
  - app/components/ui/__tests__/Card.test.tsx
  - app/(pages)/camera/CameraDashboard.tsx

root_cause:
fix:
verification:
files_changed: []
