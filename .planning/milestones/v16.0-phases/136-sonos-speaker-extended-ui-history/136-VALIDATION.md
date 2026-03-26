---
phase: 136
slug: sonos-speaker-extended-ui-history
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 136 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (with React Testing Library) |
| **Config file** | `jest.config.ts` |
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
| 136-01-01 | 01 | 1 | SONOS-38 | unit | `npm test -- --testPathPattern="SonosEqControls" -x` | ❌ W0 | ⬜ pending |
| 136-01-02 | 01 | 1 | SONOS-38 | unit | `npm test -- --testPathPattern="useSonosFullData" -x` | ❌ W0 | ⬜ pending |
| 136-01-03 | 01 | 1 | SONOS-39 | unit | `npm test -- --testPathPattern="SonosHomeTheater" -x` | ❌ W0 | ⬜ pending |
| 136-01-04 | 01 | 1 | SONOS-40 | unit | `npm test -- --testPathPattern="SonosSourceSwitch" -x` | ❌ W0 | ⬜ pending |
| 136-01-05 | 01 | 1 | SONOS-41 | unit | `npm test -- --testPathPattern="SonosGroupControls" -x` | ❌ W0 | ⬜ pending |
| 136-01-06 | 01 | 1 | SONOS-41 | unit | `npm test -- --testPathPattern="useSonosCommands" -x` | ❌ W0 | ⬜ pending |
| 136-02-01 | 02 | 2 | SONOS-42 | unit | `npm test -- --testPathPattern="useSonosHistory" -x` | ❌ W0 | ⬜ pending |
| 136-02-02 | 02 | 2 | SONOS-42 | unit | `npm test -- --testPathPattern="SonosHistoryChart" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/devices/sonos/components/__tests__/SonosEqControls.test.tsx` — stubs for SONOS-38
- [ ] `app/components/devices/sonos/components/__tests__/SonosHomeTheater.test.tsx` — stubs for SONOS-39
- [ ] `app/components/devices/sonos/components/__tests__/SonosSourceSwitch.test.tsx` — stubs for SONOS-40
- [ ] `app/components/devices/sonos/components/__tests__/SonosGroupControls.test.tsx` — stubs for SONOS-41
- [ ] `app/components/devices/sonos/components/__tests__/SonosHistoryChart.test.tsx` — stubs for SONOS-42
- [ ] `app/components/devices/sonos/hooks/__tests__/useSonosHistory.test.ts` — stubs for SONOS-42
- [ ] Extend `app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts` — add EQ/HT/source/join/unjoin assertions
- [ ] Extend `app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts` — add eqs/homeTheater records

*Existing infrastructure covers framework setup. Only new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| EQ slider visual range | SONOS-38 | Visual rendering of -10 to +10 slider | Open /sonos, expand speaker EQ, verify slider range labels |
| Home theater only for soundbar | SONOS-39 | Requires real Sonos data with soundbar speaker | Verify HT section appears only on soundbar-role speakers |
| History chart renders correctly | SONOS-42 | Recharts visual output | Open /sonos, scroll to history, verify chart renders with data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
