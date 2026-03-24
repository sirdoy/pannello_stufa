---
phase: 129
slug: sonos-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 129 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="sonos" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (sonos-only), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="sonos" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 129-01-01 | 01 | 1 | SONOS-31 | unit | `npx jest --testPathPattern="useSonosData"` | ❌ W0 | ⬜ pending |
| 129-01-02 | 01 | 1 | SONOS-31 | unit | `npx jest --testPathPattern="SonosCard"` | ❌ W0 | ⬜ pending |
| 129-01-03 | 01 | 1 | SONOS-32 | unit | `npx jest --testPathPattern="useSonosFullData"` | ❌ W0 | ⬜ pending |
| 129-01-04 | 01 | 1 | SONOS-32 | unit | `npx jest --testPathPattern="useSonosCommands"` | ❌ W0 | ⬜ pending |
| 129-01-05 | 01 | 1 | SONOS-32 | unit | `npx jest --testPathPattern="sonos/page"` | ❌ W0 | ⬜ pending |
| 129-01-06 | 01 | 1 | SONOS-33 | integration | `npx jest --testPathPattern="DashboardCards"` | ✅ | ⬜ pending |
| 129-01-07 | 01 | 1 | SONOS-34 | visual | Manual — nav menu check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/components/devices/sonos/useSonosData.test.ts` — stubs for SONOS-31
- [ ] `__tests__/components/devices/sonos/SonosCard.test.tsx` — stubs for SONOS-31
- [ ] `__tests__/components/devices/sonos/useSonosFullData.test.ts` — stubs for SONOS-32
- [ ] `__tests__/components/devices/sonos/useSonosCommands.test.ts` — stubs for SONOS-32

*Existing infrastructure covers framework and fixtures.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nav menu shows Sonos entry | SONOS-34 | Dynamic nav from device config | Load dashboard, verify Sonos in nav menu |
| Volume slider drag debounce | SONOS-32 | UX interaction timing | Drag slider rapidly, verify no request flooding |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
