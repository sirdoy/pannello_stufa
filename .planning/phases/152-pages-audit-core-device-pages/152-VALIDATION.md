---
phase: 152
slug: pages-audit-core-device-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 152 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + Playwright MCP |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --no-coverage -q` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --no-coverage -q`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 152-01-01 | 01 | 1 | AUDIT-01 | visual | Playwright MCP screenshot at 375px | N/A | ⬜ pending |
| 152-01-02 | 01 | 1 | AUDIT-02 | visual+unit | Playwright MCP + `npx jest --no-coverage -q` | ✅ | ⬜ pending |
| 152-02-01 | 02 | 1 | AUDIT-03 | visual | Playwright MCP screenshot at 375px | N/A | ⬜ pending |
| 152-02-02 | 02 | 1 | AUDIT-04 | visual+unit | Playwright MCP + `npx jest --no-coverage -q` | ✅ | ⬜ pending |
| 152-02-03 | 02 | 1 | AUDIT-05 | visual+unit | Playwright MCP + `npx jest --no-coverage -q` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Jest test suite exists, Playwright MCP available for visual verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Touch target size on mobile | AUDIT-04 | Physical tap accuracy cannot be tested programmatically | Verify buttons/controls are at least 44px touch targets |
| Chart readability at 375px | AUDIT-05 | Chart label legibility requires visual inspection | Check Recharts labels don't overlap at narrow width |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
