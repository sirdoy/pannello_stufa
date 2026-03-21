---
phase: 112
slug: debug-panel-hue-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 112 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + React Testing Library |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern="HueTab" --watchAll=false` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~5 seconds (HueTab only), ~120 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="HueTab" --watchAll=false`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 112-01-01 | 01 | 0 | test-infra | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ W0 | ⬜ pending |
| 112-02-01 | 02 | 1 | put-method | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ W0 | ⬜ pending |
| 112-02-02 | 02 | 1 | scene-url | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ W0 | ⬜ pending |
| 112-02-03 | 02 | 1 | url-label | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/debug/components/tabs/__tests__/HueTab.test.tsx` — unit tests for method dispatch + URL correctness
- [ ] `app/debug/api/components/tabs/__tests__/HueTab.test.tsx` — same tests for the api-path copy

*Both test files are new — no existing HueTab tests found in project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual card labels show correct URL | url-label | Display prop, not functional behavior | Open /debug, check "Activate Scene" card shows `/api/hue/groups/[groupId]/scenes/[sceneId]` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
