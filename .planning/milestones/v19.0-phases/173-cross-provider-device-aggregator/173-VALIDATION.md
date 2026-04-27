---
phase: 173
slug: cross-provider-device-aggregator
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-25
---

# Phase 173 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:api -- app/api/v1/devices` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:changed`
- **After every plan wave:** Run `npm run test:api -- app/api/v1/devices`
- **Before `/gsd-verify-work`:** Full scoped suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

> Populated by gsd-planner from RESEARCH.md Validation Architecture. Each task gets one row.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 173-01-01 | 01 | 1 | COMMON-02 | — | N/A | unit | `npm run test:api -- app/api/v1/devices` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/api/v1/devices/aggregator.test.ts` (or co-located `app/api/v1/devices/__tests__/route.test.ts`) — stubs for COMMON-02
- [ ] Mock factories for all 8 provider proxy modules

*Existing Jest infrastructure covers framework, mocks, and assertion helpers — no install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| docs/api/README.md §GET /api/v1/devices reflects new contract (slim core + optional fields, errors[], ?provider_type=) | COMMON-02 (D-21) | Docs change is human-readable; verified by reviewer | Open `docs/api/README.md`, locate §GET /api/v1/devices, confirm Device shape, errors[] field, and provider_type filter are documented |

---

## Wave Ordering Rationale

This phase ships with an **accepted exception** to strict Wave 0 test-first ordering:

- **Plan 01 (types)** lands in Wave 1.
- **Plan 02 (route implementation)** lands in Wave 2.
- **Plan 03 (test suite, ~20 cases)** lands in Wave 3 — *after* the route, not before it.

### Why this ordering is acceptable

1. **Single-route, low-risk, single-author refactor.** The phase rewrites exactly one file (`app/api/v1/devices/route.ts`) that has **no current frontend consumer** (per CONTEXT.md). There is no production user of the contract being changed; the regression surface is bounded to the route itself.
2. **Type-driven safety lands first.** Plan 01 (Wave 1) introduces the `Device` and `DeviceAggregatorResponse` shapes in `types/devices.ts` *before* any logic runs. Plan 02's route is forced to compile against that contract, giving us a strong static guarantee that the response shape is correct even before runtime tests exist.
3. **The route is structurally a mirror of `/health`.** The `Promise.allSettled` 8-provider fan-out pattern is already battle-tested in `app/health/route.ts` (Phase 156). Plan 02 is a near-mechanical adaptation of that pattern with mappers attached — not a novel algorithm needing TDD discovery.

### The bridge between Wave 2 and Wave 3

Plan 02's `<verify><automated>` block uses:

```
npm run test:api -- app/api/v1/devices --passWithNoTests
```

The `--passWithNoTests` flag acknowledges that the test directory is intentionally empty until Plan 03 fills it. This keeps Wave 2 green while preventing the false-confidence trap of "tests exist therefore route is correct" — at Wave 2, only `tsc --noEmit` and a successful Jest collection cycle assert the route. Plan 03 then drops in the full ~20-case suite, and the same scoped command (`npm run test:api -- app/api/v1/devices`) produces real assertions across all 8 provider mappers, the partial-failure path, and the `?provider_type=` filter.

### Sampling continuity

Each wave still has 100% automated verify coverage:

| Wave | Plan | Primary automated verify | Coverage |
|------|------|--------------------------|----------|
| 1 | 01 (types) | `npx tsc --noEmit` | Static type guarantee on the contract |
| 2 | 02 (route) | `npm run test:api -- app/api/v1/devices --passWithNoTests` | Compilation + Jest collection succeeds |
| 3 | 03 (tests) | `npm run test:api -- app/api/v1/devices` | Real assertions, ~20 cases |
| 3 | 04 (docs) | grep chains over `docs/api/README.md` | Documented contract matches code |

No 3 consecutive tasks lack automated verify. Feedback latency remains < 30s at every wave boundary.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-25
