---
phase: 173
slug: cross-provider-device-aggregator
status: draft
nyquist_compliant: false
wave_0_complete: false
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

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
