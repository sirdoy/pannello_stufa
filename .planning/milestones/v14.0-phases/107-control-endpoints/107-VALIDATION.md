---
phase: 107
slug: control-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 107 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="hueProxy\|haClient" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="hueProxy\|haClient" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 107-01-01 | 01 | 1 | CMD-01, CMD-02, CMD-03, CMD-04 | unit | `npx jest --testPathPattern="hueProxy" --no-coverage` | ❌ W0 | ⬜ pending |
| 107-01-02 | 01 | 1 | CMD-01 | unit | `npx jest --testPathPattern="lights.*route" --no-coverage` | ❌ W0 | ⬜ pending |
| 107-01-03 | 01 | 1 | CMD-02 | unit | `npx jest --testPathPattern="rooms.*route" --no-coverage` | ❌ W0 | ⬜ pending |
| 107-01-04 | 01 | 1 | CMD-03 | unit | `npx jest --testPathPattern="scenes.*route" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Tests for hueProxy control wrappers (setLightState, setGroupAction, activateScene)
- [ ] Tests for API routes (lights/[id] PUT, rooms/[id] PUT, groups/[gid]/scenes/[sid] POST)

*Existing test infrastructure covers framework needs — only test files for new code needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 409 Conflict from live unreachable light | CMD-04 | Requires physically unreachable Hue light | Send PUT to light that is powered off, verify 409 response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
