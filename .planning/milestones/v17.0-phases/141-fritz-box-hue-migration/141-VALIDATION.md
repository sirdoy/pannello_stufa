---
phase: 141
slug: fritz-box-hue-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 141 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="useNetworkData\|useLightsData" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="useNetworkData\|useLightsData" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 141-01-01 | 01 | 1 | MIG-04 | unit | `npx jest useNetworkData` | ✅ | ⬜ pending |
| 141-01-02 | 01 | 1 | MIG-05 | unit | `npx jest useNetworkData` | ✅ | ⬜ pending |
| 141-01-03 | 01 | 1 | MIG-06 | unit | `npx jest useNetworkData` | ✅ | ⬜ pending |
| 141-02-01 | 02 | 1 | MIG-07 | unit | `npx jest useLightsData` | ✅ | ⬜ pending |
| 141-02-02 | 02 | 1 | MIG-08 | unit | `npx jest useLightsData` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

Both test files already exist:
- `__tests__/components/devices/network/hooks/useNetworkData.test.ts`
- `__tests__/components/devices/lights/hooks/useLightsData.test.ts`

WS mock patterns established in `__tests__/components/devices/stove/hooks/useStoveData.test.ts`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sparkline visual continuity | MIG-06 | Visual check that chart doesn't flicker | Open /network, observe sparkline during WS reconnection |
| Live data updates on dashboard | MIG-04, MIG-07 | Requires live WS server | With HA proxy running, verify NetworkCard and LightsCard update without page refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
