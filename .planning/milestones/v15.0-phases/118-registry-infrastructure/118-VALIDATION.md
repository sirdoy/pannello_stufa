---
phase: 118
slug: registry-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 118 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (next/jest config) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern="registry" --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (registry subset) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="registry" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 118-01-01 | 01 | 1 | INFRA-02 | compile | `npx tsc --noEmit` | N/A — type-only | ⬜ pending |
| 118-01-02 | 01 | 1 | INFRA-01 | unit | `npm test -- --testPathPattern="registryProxy"` | ❌ W0 | ⬜ pending |
| 118-01-03 | 01 | 1 | INFRA-01 | unit | `npm test -- --testPathPattern="haClient"` | ✅ partial | ⬜ pending |
| 118-02-01 | 02 | 2 | INFRA-05 | unit | `npm test -- --testPathPattern="api/registry/types"` | ❌ W0 | ⬜ pending |
| 118-02-02 | 02 | 2 | INFRA-05 | unit | `npm test -- --testPathPattern="api/registry/devices"` | ❌ W0 | ⬜ pending |
| 118-02-03 | 02 | 2 | INFRA-05 | unit | `npm test -- --testPathPattern="api/registry/health"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/registry/registryProxy.test.ts` — stubs for INFRA-01 (proxy method calls)
- [ ] `__tests__/app/api/registry/types/route.test.ts` — stubs for INFRA-05 (types endpoints)
- [ ] `__tests__/app/api/registry/devices/route.test.ts` — stubs for INFRA-05 (devices endpoints)
- [ ] `__tests__/app/api/registry/health/route.test.ts` — stubs for INFRA-05 (health endpoint)
- [ ] Extend existing haClient tests for haDelete coverage

*Existing infrastructure covers framework setup — only test files needed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
