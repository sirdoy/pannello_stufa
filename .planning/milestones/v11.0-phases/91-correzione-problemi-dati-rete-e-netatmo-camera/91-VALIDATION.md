---
phase: 91
slug: correzione-problemi-dati-rete-e-netatmo-camera
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 91 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="camera|useScheduleData|useRoomStatus" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="camera|useScheduleData|useRoomStatus" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 91-01-01 | 01 | 1 | Camera fixes | unit | `npx jest --testPathPattern="camera" --no-coverage` | ✅ | ⬜ pending |
| 91-01-02 | 01 | 1 | Schedule/thermostat retry | unit | `npx jest --testPathPattern="useScheduleData\|useRoomStatus" --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. All 86 tests already exist and pass.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Camera snapshot loads via redirect | Camera fix #1 | Requires browser + Netatmo CDN | Open /camera, verify snapshot loads |
| Camera stream shows loading/error | Camera fix #3-4 | Requires browser UI | Click Live, observe loading state |
| Schedule page handles 503 gracefully | Schedule retry | Requires proxy warm-up timing | Load /schedule before proxy ready |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
