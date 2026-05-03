---
phase: 182-design-system-reference-page-v2
plan: "04"
subsystem: design-system
tags: [ember-glass, code-snippet, clipboard, tdd, primitive]
requirements: [DSREF-02]

dependency_graph:
  requires:
    - app/components/EmberGlass/Pressable.tsx
  provides:
    - app/debug/design-system-v2/sections/CodeSnippet.tsx
  affects:
    - plans 05, 06, 07 (consumers of CodeSnippet)

tech_stack:
  added: []
  patterns:
    - "try/catch + .catch silent clipboard fallback (D-04)"
    - "1500ms setTimeout label flip for copy feedback (D-19)"
    - "Pressable as copy button (D-18)"
    - "inline-style + var(--token) discipline (D-02)"

key_files:
  created:
    - app/debug/design-system-v2/sections/CodeSnippet.tsx
    - app/debug/design-system-v2/sections/__tests__/CodeSnippet.test.tsx
  modified: []

decisions:
  - "Used navigator.clipboard?.writeText with optional chaining to guard against unavailable clipboard API before the try/catch"
  - "Exported CodeSnippetProps interface for consumers in Plans 05/06/07"
  - "aria-label mirrors the visible text (both Italian) since page is dev-only and Italian-first per D-25"

metrics:
  duration: "~10 minutes"
  completed: "2026-05-03T12:13:37Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 182 Plan 04: CodeSnippet Primitive Summary

**One-liner:** `<CodeSnippet code={...}/>` primitive with `<pre><code>` block and Pressable "Copia" button using `navigator.clipboard.writeText` + 1500ms "Copiato" feedback.

## What Was Built

The shared `CodeSnippet` primitive at `app/debug/design-system-v2/sections/CodeSnippet.tsx` provides:

- A `<pre><code>` block styled with monospace font, `var(--glass-bg)` background, `var(--glass-border)` border (D-18)
- A `<Pressable as="button">` "Copia" button absolutely positioned top-right
- `navigator.clipboard.writeText` call wrapped in `try/catch` + `.catch` for silent failure (D-04)
- Label flip: "Copia" → "Copiato" for 1500ms on successful copy, then revert via `setTimeout` (D-19)
- Italian visible copy ("Copia" / "Copiato"), Italian `aria-label` (D-25)
- No `className`, all values inline-style + `var(--token)` (D-02)
- `'use client'` directive (D-03)

Plans 05, 06, and 07 can now `import { CodeSnippet } from './CodeSnippet'` to render copy-paste-ready JSX snippets beside live primitive samples.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | 135b1fce | test(182-04): add failing CodeSnippet spec (RED) |
| GREEN (impl) | 8effb68f | feat(182-04): implement CodeSnippet primitive (GREEN) |

RED confirmed: test failed with "Cannot find module '../CodeSnippet'" before implementation.
GREEN confirmed: all 5 tests pass after implementation.

## Tasks

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Write failing CodeSnippet Jest spec (RED) | 135b1fce | DONE |
| 2 | Implement CodeSnippet.tsx (GREEN) | 8effb68f | DONE |

## Deviations from Plan

None — plan executed exactly as written.

The exact file content from the plan was used verbatim for both the test file and the implementation.

## Threat Surface Scan

No new threat surface beyond what the plan's threat model covers:
- T-182-04-01 (Information Disclosure / Clipboard): accepted — hardcoded JSX usage strings, no PII/secrets, page is `/debug/**` Auth0-gated
- T-182-04-02 (DoS / clipboard rejection): mitigated — `try/catch` + `.catch` implemented correctly, UI stays on "Copia" on failure

## Known Stubs

None — CodeSnippet is a fully functional primitive with no placeholder data paths.

## Self-Check: PASSED

- `app/debug/design-system-v2/sections/CodeSnippet.tsx` — FOUND
- `app/debug/design-system-v2/sections/__tests__/CodeSnippet.test.tsx` — FOUND
- Commit 135b1fce — FOUND (test RED phase)
- Commit 8effb68f — FOUND (implementation GREEN phase)
- 5 tests passing — CONFIRMED
