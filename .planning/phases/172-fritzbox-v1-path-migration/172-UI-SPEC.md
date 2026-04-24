---
phase: 172
slug: fritzbox-v1-path-migration
kind: ui-spec
status: not-applicable
created: 2026-04-24
---

# Phase 172 — UI Design Contract

## Verdict: NOT APPLICABLE — No UI Changes

Phase 172 is a pure structural refactor: rename `/api/fritzbox/*` → `/api/v1/fritzbox/*`. Consumers are updated in-place by swapping URL string literals. **Zero visual, interaction, layout, copy, or component-surface changes.**

## Scope

| Area | Change | UI Impact |
|------|--------|-----------|
| `app/api/fritzbox/**` route files | Moved via `git mv` to `app/api/v1/fritzbox/**` | None — server-side |
| Consumer hooks (7 canonical + surrounding Fritz hooks) | URL string literal swap | None — hooks return same shapes, paused-aware semantics preserved |
| `app/network/page.tsx`, `app/telefonia/page.tsx`, `app/registry/devices/page.tsx` | URL string swap only (one line each where referenced) | None — existing layouts, copy, data-flow unchanged |
| `app/debug/components/tabs/NetworkTab.tsx` | URL string swaps (37 occurrences per RESEARCH.md) | None — debug panel table columns/copy unchanged |
| `app/sw.ts`, `lib/routes.ts` | Verified to contain zero Fritz references (per RESEARCH.md) | None |

## Design System Impact

None. No new components, no variant additions, no token changes, no icon changes, no copy changes, no Italian localization changes.

## Accessibility / Visual Parity

N/A — nothing in the visual tree changes. Playwright smoke (`tests/smoke/page-loads.spec.ts`) verifies `/telefonia`, `/network`, `/debug`, `/registry/devices` still render error-free post-migration.

## Sign-Off

Gate satisfied: refactor phase with no UI surface. If any PLAN introduces unexpected UI changes, planner MUST revise this SPEC and re-run `/gsd-ui-phase 172`.
