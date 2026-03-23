---
phase: 125
slug: navigation-menu-links
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 125 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + React Testing Library |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="Navbar"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="Navbar"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 125-01-01 | 01 | 1 | SC-1 | unit | `npm test -- --testPathPattern="Navbar"` | ✅ | ⬜ pending |
| 125-01-02 | 01 | 1 | SC-2 | unit | `npm test -- --testPathPattern="Navbar"` | ✅ | ⬜ pending |
| 125-01-03 | 01 | 1 | SC-3 | manual | visual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add test assertions to `Navbar.test.tsx` verifying `getGlobalNavItems()` returns entries for `/registry/types` and `/rooms`

*Existing infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ember Noir design compliance | SC-3 | Visual/aesthetic check | Open app nav menu, verify new items match existing style |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
