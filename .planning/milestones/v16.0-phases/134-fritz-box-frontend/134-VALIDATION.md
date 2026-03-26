---
phase: 134
slug: fritz-box-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 134 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="network"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (network tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="network"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 134-01-01 | 01 | 1 | FRITZ-13 | unit | `npm test -- --testPathPattern="SystemInfoCard"` | ❌ W0 | ⬜ pending |
| 134-01-02 | 01 | 1 | FRITZ-14 | unit | `npm test -- --testPathPattern="WifiClientsTable"` | ❌ W0 | ⬜ pending |
| 134-01-03 | 01 | 1 | FRITZ-15 | unit | `npm test -- --testPathPattern="NetworkServicesCard"` | ❌ W0 | ⬜ pending |
| 134-01-04 | 01 | 1 | FRITZ-16 | unit | `npm test -- --testPathPattern="HistoryTierToggle\|BandwidthChart"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/network/__tests__/components/SystemInfoCard.test.tsx` — stubs for FRITZ-13
- [ ] `app/network/__tests__/components/WifiClientsTable.test.tsx` — stubs for FRITZ-14
- [ ] `app/network/__tests__/components/NetworkServicesCard.test.tsx` — stubs for FRITZ-15
- [ ] `app/network/__tests__/components/HistoryTierToggle.test.tsx` — stubs for FRITZ-16

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Signal strength bars visual rendering | FRITZ-14 | CSS-only visual element | Verify 4 bars with varying fill at /network WiFi clients tab |
| Tab switching UX | FRITZ-14, FRITZ-15 | Browser interaction | Click tabs, verify content switches without full page reload |
| History chart data rendering | FRITZ-16 | Recharts SVG rendering | Toggle hourly/daily, verify chart updates with correct data granularity |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
