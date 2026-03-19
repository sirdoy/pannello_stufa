---
phase: 100
slug: control-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 100 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (project-wide) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=thermorossiProxy` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=thermorossiProxy`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 100-01-01 | 01 | 1 | CMD-01 | unit | `npm test -- --testPathPattern=thermorossiProxy -t "sendIgnit"` | Wave 0 — extend existing | pending |
| 100-01-02 | 01 | 1 | CMD-02 | unit | `npm test -- --testPathPattern=thermorossiProxy -t "sendShutdown"` | Wave 0 — extend existing | pending |
| 100-01-03 | 01 | 1 | CMD-03 | unit | `npm test -- --testPathPattern=thermorossiProxy -t "setPower"` | Wave 0 — extend existing | pending |
| 100-01-04 | 01 | 1 | CMD-04 | unit | `npm test -- --testPathPattern=thermorossiProxy -t "setFan"` | Wave 0 — extend existing | pending |
| 100-01-05 | 01 | 1 | CMD-05 | unit | `npm test -- --testPathPattern=thermorossiProxy -t "setWaterTemp"` | Wave 0 — extend existing | pending |
| 100-01-06 | 01 | 1 | READ-05 | unit | `npm test -- --testPathPattern=thermorossiProxy -t "getHistory"` | Exists (Phase 99) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/thermorossiProxy.test.ts` — extend with `sendIgnit`, `sendShutdown`, `setPower`, `setFan`, `setWaterTemp` test cases (file exists, needs new `describe` blocks for command wrappers)

*No new test files needed — extend the existing thermorossiProxy.test.ts following the established mock-fetch pattern*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 409 Conflict response for state-gated commands | CMD-01-05 | Proxy returns 409 for wrong state; haClient maps to 502 | Verify via curl against live proxy in wrong state |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
