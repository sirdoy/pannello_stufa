---
phase: 131
slug: dirigera-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 131 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + @testing-library/react |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=dirigera --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=dirigera --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 131-01-01 | 01 | 1 | DIRIG-10 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 131-01-02 | 01 | 1 | DIRIG-08 | unit | `npm test -- --testPathPattern=DirigeraCard` | ❌ W0 | ⬜ pending |
| 131-01-03 | 01 | 1 | DIRIG-08 | unit | `npm test -- --testPathPattern=DirigeraCard` | ❌ W0 | ⬜ pending |
| 131-01-04 | 01 | 1 | DIRIG-09 | unit | `npm test -- --testPathPattern=dirigera` | ❌ W0 | ⬜ pending |
| 131-01-05 | 01 | 1 | DIRIG-11 | integration | Playwright E2E-01 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/dirigera/__tests__/DirigeraCard.test.tsx` — covers DIRIG-08 (render, loading, error, stale, click)
- [ ] `app/components/devices/dirigera/__tests__/useDirigeraData.test.ts` — optional hook isolation

*Existing infrastructure covers test framework and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DirigeraCard appears on dashboard | DIRIG-08 | Requires full app render with device config | Visit `/`, verify DIRIGERA card visible |
| /dirigera page filter control works | DIRIG-09 | Visual interaction test | Visit `/dirigera`, click each filter tab |
| Navigation menu shows DIRIGERA | DIRIG-11 | Requires full nav render | Visit any page, verify DIRIGERA in nav menu |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
