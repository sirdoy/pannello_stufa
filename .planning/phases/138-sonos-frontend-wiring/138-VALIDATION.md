---
phase: 138
slug: sonos-frontend-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 138 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + @testing-library/react |
| **Config file** | jest.config.js (root) |
| **Quick run command** | `npm test -- --testPathPattern="sonos" --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="sonos" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 138-01-01 | 01 | 1 | SONOS-34 | unit | `npm test -- --testPathPattern="deviceRegistry\|Navbar"` | ✅ | ⬜ pending |
| 138-01-02 | 01 | 1 | SONOS-04 | unit | `npm test -- --testPathPattern="useSonosFullData"` | ✅ | ⬜ pending |
| 138-01-03 | 01 | 1 | SONOS-05 | unit | `npm test -- --testPathPattern="useSonosFullData"` | ✅ | ⬜ pending |
| 138-01-04 | 01 | 1 | SONOS-16 | unit | `npm test -- --testPathPattern="useSonosCommands"` | ✅ | ⬜ pending |
| 138-01-05 | 01 | 1 | SONOS-17 | unit | `npm test -- --testPathPattern="useSonosCommands\|SonosSeekControl"` | ❌ W0 | ⬜ pending |
| 138-01-06 | 01 | 1 | SONOS-31 | regression | `npm test -- --testPathPattern="SonosCard"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/sonos/components/__tests__/SonosSeekControl.test.tsx` — stubs for SONOS-17 (seek component render + disabled states + time conversion)

*Existing infrastructure covers all other phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seek slider visual UX (drag smoothness) | SONOS-17 | Visual/interaction quality | Drag seek slider on /sonos page, verify no jank |
| Zone volume slider affects all speakers | SONOS-16 | Requires live Sonos hardware | Change zone volume, verify all speaker volumes adjust |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
