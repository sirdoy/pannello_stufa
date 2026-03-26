---
phase: 135
slug: sonos-zone-extended-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 135 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="sonos" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="sonos" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 135-01-01 | 01 | 1 | SONOS-35 | unit | `npx jest --testPathPattern="SonosPlayMode"` | ❌ W0 | ⬜ pending |
| 135-01-02 | 01 | 1 | SONOS-36 | unit | `npx jest --testPathPattern="SonosSleepTimer"` | ❌ W0 | ⬜ pending |
| 135-01-03 | 01 | 1 | SONOS-37 | unit | `npx jest --testPathPattern="SonosQueue"` | ❌ W0 | ⬜ pending |
| 135-02-01 | 02 | 1 | SONOS-35 | unit | `npx jest --testPathPattern="useSonosCommands"` | ✅ | ⬜ pending |
| 135-02-02 | 02 | 1 | SONOS-36 | unit | `npx jest --testPathPattern="useSonosFullData"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/sonos/components/__tests__/SonosPlayModeControls.test.tsx` — stubs for SONOS-35
- [ ] `app/components/devices/sonos/components/__tests__/SonosSleepTimer.test.tsx` — stubs for SONOS-36
- [ ] `app/components/devices/sonos/components/__tests__/SonosQueueViewer.test.tsx` — stubs for SONOS-37

*Existing test infrastructure (jest, RTL) covers all framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Play mode toggle visual state | SONOS-35 | Active/inactive color requires visual check | Toggle shuffle — verify ember accent on active, muted on inactive |
| Sleep timer countdown display | SONOS-36 | Timer format requires visual check | Set 15min timer — verify MM:SS countdown shows |
| Queue expand/collapse animation | SONOS-37 | UX smoothness requires visual check | Click "Coda" — verify list expands inline smoothly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
