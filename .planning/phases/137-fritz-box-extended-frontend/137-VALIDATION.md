---
phase: 137
slug: fritz-box-extended-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 137 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="app/network" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (network tests only) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="app/network" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 137-01-01 | 01 | 1 | FRITZ-17 | unit | `npx jest --testPathPattern="useFritzWifiNetworks"` | ❌ W0 | ⬜ pending |
| 137-01-02 | 01 | 1 | FRITZ-17 | unit | `npx jest --testPathPattern="WifiNetworksTable"` | ❌ W0 | ⬜ pending |
| 137-01-03 | 01 | 1 | FRITZ-18 | unit | `npx jest --testPathPattern="useFritzDeviceCounts"` | ❌ W0 | ⬜ pending |
| 137-01-04 | 01 | 1 | FRITZ-18 | unit | `npx jest --testPathPattern="DeviceCountChart"` | ❌ W0 | ⬜ pending |
| 137-01-05 | 01 | 1 | FRITZ-19 | unit | `npx jest --testPathPattern="useFritzBudgetStats"` | ❌ W0 | ⬜ pending |
| 137-01-06 | 01 | 1 | FRITZ-19 | unit | `npx jest --testPathPattern="BudgetStatsCard"` | ❌ W0 | ⬜ pending |
| 137-01-07 | 01 | 1 | FRITZ-20 | unit | `npx jest --testPathPattern="useFritzBandwidthTiers"` | ✅ | ⬜ pending |
| 137-01-08 | 01 | 1 | FRITZ-20 | unit | `npx jest --testPathPattern="HistoryTierToggle"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements. New test files created alongside components/hooks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WiFi networks tab renders correctly | FRITZ-17 | Visual layout | Navigate to /network, click "Reti WiFi" tab, verify SSID/band/status |
| Device count AreaChart visual | FRITZ-18 | Chart rendering | Navigate to /network, scroll to device count chart, verify area fill |
| Budget progress bar colors | FRITZ-19 | Visual status colors | Check ok/warning/danger states render with correct colors |
| Auto granularity indicator text | FRITZ-20 | Dynamic label | Select "Auto" tier, verify "Auto: orario" or "Auto: giornaliero" label |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
