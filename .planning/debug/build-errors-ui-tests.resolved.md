---
status: fixing
trigger: "Fix all TypeScript build errors in UI component test files (app/components/ui/__tests__/)."
created: 2026-02-08T10:00:00Z
updated: 2026-02-08T10:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - Root cause is namespace pattern incompatibility between imports and usage
test: Fix files by importing default export with namespace type assertion
expecting: TypeScript errors will resolve when tests import the namespace-typed default export
next_action: Fix Accordion.test.tsx, Tabs.test.tsx, and other files using namespace pattern

## Symptoms

expected: npx tsc --noEmit should pass with 0 errors for UI component test files
actual: ~600 TypeScript errors across 18 UI component test files
errors: Primarily TS2339 (property not found), TS2741 (missing properties), TS2322 (type mismatch)
reproduction: Run `npx tsc --noEmit 2>&1 | grep "error TS" | grep "app/components/ui/__tests__"`
started: After TypeScript migration (Phase 42)

## Eliminated

## Evidence

- timestamp: 2026-02-08T10:05:00Z
  checked: Accordion.test.tsx errors and Accordion.tsx component definition
  found: Test uses `<Accordion.Item>` but TypeScript doesn't recognize the namespace pattern. Component exports both named exports AND a default export with namespace attachment.
  implication: Tests are using the namespace pattern (Accordion.Item) but importing named exports. TypeScript can't infer the namespace from the function signature.

- timestamp: 2026-02-08T10:05:00Z
  checked: Accordion test helper props
  found: TestAccordion uses `type={type}` where type comes from prop with default `'single'`, but TypeScript sees the string type not the literal type
  implication: Need to properly type the helper component props to match AccordionProps

## Resolution

root_cause: Tests import named exports `{ Accordion, AccordionItem, AccordionTrigger, AccordionContent }` but use the namespace pattern `Accordion.Item`. TypeScript doesn't know that Accordion has .Item/.Trigger/.Content properties because the namespace is attached at runtime. Additionally, test helper components have incorrect prop types (e.g., `type = 'single'` inferred as string not literal "single" | "multiple").

fix: Import the default export which has the namespace type declaration. For components with namespace pattern (Accordion, Tabs, DashboardLayout, etc.), change from `import { Accordion, ... }` to `import Accordion from '../Accordion'` and keep the named imports for prop types/direct usage. Also fix test helper prop types with proper literal types.
fix:
verification:
files_changed: []
