---
phase: 166
slug: hue-frontend-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 166 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --bail --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --bail --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 166-01-01 | 01 | 1 | HUE-01..07 | — | N/A | unit | `npx jest app/api/v1/hue` | ✅ | ⬜ pending |
| 166-02-01 | 02 | 2 | HUE-01..07 | — | N/A | unit | `npx jest __tests__/components/devices/lights` | ✅ | ⬜ pending |
| 166-02-02 | 02 | 2 | HUE-01..07 | — | N/A | unit | `npx jest app/debug` | ✅ | ⬜ pending |
| 166-03-01 | 03 | 3 | HUE-01..07 | — | N/A | grep | `grep -r '/api/hue/' app/ lib/ --include='*.ts' --include='*.tsx'` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Firebase log row on toggle | HUE-03 | Requires real Firebase + real Hue bridge | Toggle light from /lights, check Firebase console for log entry |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
