---
phase: 150
slug: theme-prefix-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 150 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 150-01-* | 01 | 1 | THEME-06 | grep | `grep -r "dark:" --include="*.tsx" --include="*.ts" app/components/ui/ \| wc -l` returns 0 | ✅ | ⬜ pending |
| 150-02-* | 02 | 1 | THEME-07 | grep | `grep -r "html:not(.dark)" --include="*.tsx" --include="*.ts" app/components/ui/ \| wc -l` returns 0 | ✅ | ⬜ pending |
| 150-03-* | 03 | 2 | THEME-06, THEME-07 | grep | `grep -r "dark:" --include="*.tsx" --include="*.ts" app/components/devices/ \| wc -l` returns 0 | ✅ | ⬜ pending |
| 150-04-* | 04 | 2 | THEME-06, THEME-07 | grep | `grep -r "dark:\|html:not(.dark)" --include="*.tsx" --include="*.ts" app/ lib/ \| wc -l` returns 0 | ✅ | ⬜ pending |
| 150-05-* | 05 | 3 | THEME-10 | visual | Load /debug/design-system and verify no theme toggle | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — verification is via grep commands confirming zero remaining occurrences.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Design system page visual check | THEME-10 | Content/layout verification | Load /debug/design-system, confirm no theme toggle UI or light-mode examples |
| Dark-only appearance | THEME-06, THEME-07 | Visual regression | Browse app pages, confirm dark styling consistent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
