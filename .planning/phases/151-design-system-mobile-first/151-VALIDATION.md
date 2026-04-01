---
phase: 151
slug: design-system-mobile-first
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 151 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="Button" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="Button" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 151-01-01 | 01 | 1 | MOBILE-01 | unit | `npx jest --testPathPattern="Button" --no-coverage` | ✅ | ⬜ pending |
| 151-01-02 | 01 | 1 | MOBILE-02 | unit | `npx jest --testPathPattern="Button" --no-coverage` | ✅ | ⬜ pending |
| 151-01-03 | 01 | 1 | MOBILE-06 | manual | N/A (visual) | N/A | ⬜ pending |
| 151-02-01 | 02 | 1 | MOBILE-03, MOBILE-04, MOBILE-05 | manual | N/A (visual + content) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Button.test.tsx already exists.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ButtonGroup wrapping at 375px | MOBILE-01 | Visual layout verification | Open /debug/design-system at 375px, verify 4+ buttons wrap to next line |
| All DS components at 375px | MOBILE-02 | Visual layout verification | Open /debug/design-system at 375px viewport, scroll through all sections |
| Typography no overflow | MOBILE-03 | Visual layout verification | Open /debug/design-system at 375px, verify no horizontal scroll |
| Bottom nav at 375px | MOBILE-06 | Visual layout verification | Open app at 375px, verify bottom nav 4-column grid has no clipping |
| DS documentation section | MOBILE-04, MOBILE-05 | Content verification | Open /debug/design-system, verify Mobile-First Patterns section exists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
