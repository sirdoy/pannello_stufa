---
phase: 120
slug: device-types-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 120 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern registry` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern registry`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 120-01-01 | 01 | 1 | DTYPE-01 | unit | `npx jest --testPathPattern useDeviceTypes` | ❌ W0 | ⬜ pending |
| 120-01-02 | 01 | 1 | DTYPE-02 | unit | `npx jest --testPathPattern DeviceTypesPage` | ❌ W0 | ⬜ pending |
| 120-01-03 | 01 | 1 | DTYPE-03 | unit | `npx jest --testPathPattern DeviceTypesPage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/app/registry/types/useDeviceTypes.test.ts` — hook unit tests
- [ ] `__tests__/app/registry/types/page.test.tsx` — page component tests (create, delete, list)

*Existing test infrastructure (Jest + React Testing Library) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual layout matches design system | DTYPE-01 | CSS/layout verification | Navigate to /registry/types, verify heading, table, and card layout |
| Toast appears on success/error | DTYPE-02, DTYPE-03 | Transient UI element | Create/delete a type and verify toast notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
