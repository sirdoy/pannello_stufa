---
phase: 124
slug: room-status-views
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 124 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + React Testing Library |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest app/rooms/status/__tests__/page.test.tsx --no-coverage` |
| **Full suite command** | `npx jest app/rooms/ --no-coverage` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest app/rooms/status/__tests__/page.test.tsx --no-coverage`
- **After every plan wave:** Run `npx jest app/rooms/ --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 124-01-01 | 01 | 1 | RSTAT-01 | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "RSTAT-01" --no-coverage` | ❌ W0 | ⬜ pending |
| 124-01-02 | 01 | 1 | RSTAT-02 | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "RSTAT-02" --no-coverage` | ❌ W0 | ⬜ pending |
| 124-01-03 | 01 | 1 | RSTAT-03 | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "RSTAT-03" --no-coverage` | ❌ W0 | ⬜ pending |
| 124-01-04 | 01 | 1 | D-20 | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "D-20" --no-coverage` | ❌ W0 | ⬜ pending |
| 124-01-05 | 01 | 1 | D-05 | unit | `npx jest app/rooms/__tests__/page.test.tsx --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/rooms/status/__tests__/page.test.tsx` — stubs for RSTAT-01, RSTAT-02, RSTAT-03, D-20
- [ ] `app/rooms/status/` — new directory

*Existing infrastructure covers test framework — no new packages needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive grid layout (1 col mobile, 2 col desktop) | Claude's Discretion | CSS media queries not testable in jsdom | Resize browser to < 640px, verify single column; > 640px verify two columns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
