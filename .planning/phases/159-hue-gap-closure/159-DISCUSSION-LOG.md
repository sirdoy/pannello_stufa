# Phase 159: Hue Gap Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 159-hue-gap-closure
**Areas discussed:** Route migration strategy, Old route handling, Missing group routes, Test strategy
**Mode:** --auto (all decisions auto-selected)

---

## Route Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| New files under app/api/v1/hue/ | Create fresh route files following thermorossi v1 pattern | ✓ |
| Move old routes to v1 path | Git mv existing routes (breaks old paths) | |
| Symlink or re-export | Re-export old routes from v1 paths | |

**User's choice:** [auto] New files under app/api/v1/hue/ (recommended default)
**Notes:** Follows Phase 156 pattern where thermorossi got new v1 routes while old routes remained.

---

## Old Route Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep old routes as-is | Backwards compatibility, separate cleanup later | ✓ |
| Remove old routes | Clean break, update frontend in same phase | |
| Add redirects from old to v1 | 301 redirects for gradual migration | |

**User's choice:** [auto] Keep old routes as-is (recommended default)
**Notes:** Phase 156 established the pattern of keeping old routes during migration. Frontend migration is a separate concern.

---

## Missing Group Routes

| Option | Description | Selected |
|--------|-------------|----------|
| Standard proxy pattern | withAuthAndErrorHandler + proxy function + Firebase log for commands | ✓ |
| Minimal routes without logging | Skip Firebase logging for read-only endpoints | |

**User's choice:** [auto] Standard proxy pattern (recommended default)
**Notes:** Matches existing lights/[id] route pattern with Firebase logging for command endpoints.

---

## Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Adapt existing test patterns | Co-located __tests__/route.test.ts, mirror old route tests | ✓ |
| Shared test utilities | Create test helpers for common proxy route assertions | |
| Skip tests (proxy-only) | Routes are thin wrappers, trust proxy tests | |

**User's choice:** [auto] Adapt existing test patterns (recommended default)
**Notes:** Each v1 route gets its own co-located test file following existing patterns.

---

## Claude's Discretion

- Italian log messages for group action commands
- Test assertion granularity
- Response wrapping pattern (e.g., `{ groups: data }`)

## Deferred Ideas

None
