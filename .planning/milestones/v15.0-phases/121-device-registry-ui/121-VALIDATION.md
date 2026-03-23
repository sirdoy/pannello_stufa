---
phase: 121
slug: device-registry-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 121 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + Testing Library (existing) |
| **Config file** | jest.config.ts (existing) |
| **Quick run command** | `npm test -- --testPathPattern="registry/devices" --no-coverage` |
| **Full suite command** | `npm test -- --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="registry/devices" --no-coverage`
- **After every plan wave:** Run `npm test -- --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 121-01-01 | 01 | 1 | DREG-01 | unit | `npm test -- --testPathPattern="registry/devices" --no-coverage` | ❌ W0 | ⬜ pending |
| 121-01-02 | 01 | 1 | DREG-02 | unit | same | ❌ W0 | ⬜ pending |
| 121-01-03 | 01 | 1 | DREG-06 | unit | same | ❌ W0 | ⬜ pending |
| 121-02-01 | 02 | 1 | DREG-03 | unit | same | ❌ W0 | ⬜ pending |
| 121-02-02 | 02 | 1 | DREG-04 | unit | same | ❌ W0 | ⬜ pending |
| 121-02-03 | 02 | 1 | DREG-05 | unit | same | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/registry/devices/__tests__/page.test.tsx` — stubs for DREG-01 through DREG-06
- [ ] `app/registry/devices/` directory — must be created

*Existing infrastructure covers all phase requirements — no new framework config or fixtures needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pagination controls navigate pages | DREG-01 | Visual nav layout | Open /registry/devices with >20 devices, click Next/Prev |
| Provider Badge colors match spec | DREG-01 | Visual styling | Check hue=ocean, netatmo=ember, thermorossi=ember |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
