---
phase: 88
slug: raspberry-pi-api-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 88 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="raspi" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="raspi" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 88-01-01 | 01 | 1 | RASPI-02 | unit | `npx jest --testPathPattern="raspi" --no-coverage` | ❌ W0 | ⬜ pending |
| 88-01-02 | 01 | 1 | RASPI-01 | unit | `npx jest --testPathPattern="raspiClient" --no-coverage` | ❌ W0 | ⬜ pending |
| 88-01-03 | 01 | 1 | RASPI-03 | unit | `npx jest --testPathPattern="raspi.*route" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/raspiClient.test.ts` — stubs for RASPI-01 (proxy client functions)
- [ ] `__tests__/app/api/raspi/` — stubs for RASPI-03 (API route tests)

*Existing infrastructure covers test framework and fixtures.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API routes reachable from browser | RASPI-01 | Requires running dev server + HA proxy | Start dev server, navigate to /api/raspi/health, verify JSON response |

*All other behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
