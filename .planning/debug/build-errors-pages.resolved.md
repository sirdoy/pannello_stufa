---
status: investigating
trigger: "Fix all TypeScript build errors in non-test app pages and jest.setup.ts."
created: 2026-02-08T10:00:00Z
updated: 2026-02-08T10:00:00Z
---

## Current Focus

hypothesis: Errors fall into categories - variant mismatches, type incompatibilities, missing properties
test: Read component definitions to understand correct types
expecting: Will find type definitions that reveal fix patterns
next_action: Read variant type definitions for Heading, Button, Badge, Text

## Symptoms

expected: npx tsc --noEmit should pass with 0 errors for these files
actual: 65 TypeScript errors in 16 non-test files
errors: Variant mismatches, type incompatibilities, missing properties
reproduction: Run `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v '__tests__\|\.test\.'`
started: After TypeScript migration (Phase 42)

## Eliminated

## Evidence

- timestamp: 2026-02-08T10:01:00Z
  checked: tsc output for non-test files
  found: 65 errors across 16 files
  implication: Categories are: invalid variants, async type mismatches, missing properties, type incompatibilities

- timestamp: 2026-02-08T10:02:00Z
  checked: Component variant definitions
  found: Heading variants = sm|md|lg|xl|2xl|3xl sizes, NOT "base"
  found: Badge variants = ember|sage|ocean|warning|danger|neutral, NOT "copper" or "success"
  found: Text variants = body|secondary|tertiary|ember|ocean|sage|warning|danger|info|label, NOT "error"
  found: Button variants = ember|subtle|ghost|success|danger|outline, NOT "warning"
  found: ErrorAlert expects { errorCode, errorDescription?, ... }, NOT { message }
  implication: Many errors are simply wrong variant names

## Resolution

root_cause:
fix:
verification:
files_changed: []
