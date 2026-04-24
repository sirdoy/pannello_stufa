---
phase: 172
slug: fritzbox-v1-path-migration
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-24
---

# Phase 172 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (via `npm test`) + Playwright |
| **Config file** | `jest.config.ts` (root) |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:api` and `npm run test:components` |
| **Playwright smoke** | `npx playwright test tests/smoke/page-loads.spec.ts` |
| **Estimated runtime** | ~45–90s Jest scoped subsets; ~20s smoke |

---

## Sampling Rate

- **After every task commit:** Run the task-scoped `npm test -- <paths>` from the task's `<verify><automated>` block
- **After every plan wave:** Run `npm run test:api && npm run test:components`
- **Before `/gsd-verify-work`:** All scoped Jest subsets + Playwright smoke green, plus repo-wide grep proves zero `/api/fritzbox/` matches outside `.planning/`
- **Max feedback latency:** 120 seconds

Project rule (CLAUDE.md §8): never use bare `npm test` from plans — always scoped paths or the `test:api`/`test:components`/`test:pages` scripts.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 172-01-* | 01 | 1 | FRITZ-01..07 | — | Routes served under `/api/v1/fritzbox/**` | unit | `npm test -- app/api/v1/fritzbox/` | ✅ (post-move) | ⬜ pending |
| 172-02-01 | 02 | 2 | FRITZ-01 | — | `useFritzDectHandsets` fetches `/api/v1/fritzbox/telephony/dect` | unit | `npm test -- app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts` | ✅ | ⬜ pending |
| 172-02-02 | 02 | 2 | FRITZ-02 | — | `useFritzCallHistory` fetches `/api/v1/fritzbox/telephony/calls` | unit | `npm test -- app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts` | ✅ | ⬜ pending |
| 172-02-03 | 02 | 2 | FRITZ-03 | — | `useFritzTamStatus` fetches `/api/v1/fritzbox/telephony/tam` | unit | `npm test -- app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts` | ✅ | ⬜ pending |
| 172-02-04 | 02 | 2 | FRITZ-04 | — | `useFritzBandwidthHistoryRaw` fetches `/api/v1/fritzbox/history/bandwidth` | unit | `npm test -- app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts` | ✅ | ⬜ pending |
| 172-02-05 | 02 | 2 | FRITZ-05 | — | `useFritzDevicePresenceHistory` fetches `/api/v1/fritzbox/history/devices` | unit | `npm test -- app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts` | ✅ | ⬜ pending |
| 172-02-06 | 02 | 2 | FRITZ-06 | — | `useFritzDeviceEventsRaw` fetches `/api/v1/fritzbox/history/device-events` | unit | `npm test -- app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts` | ✅ | ⬜ pending |
| 172-02-07 | 02 | 2 | FRITZ-07 | — | `useFritzServiceDiscovery` fetches `/api/v1/fritzbox/service-discovery` | unit | `npm test -- app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts` | ✅ | ⬜ pending |
| 172-02-08 | 02 | 2 | FRITZ-01..07 | — | Remaining network/telephony hooks retargeted (WiFi, WAN, system, devices, bandwidth, budget, vendor, category, debug, health) | unit | `npm test -- app/network/hooks/__tests__/ app/telefonia/hooks/__tests__/ app/components/devices/network/hooks/__tests__/` | ✅ | ⬜ pending |
| 172-03-01 | 03 | 3 | FRITZ-01..07 | — | Pages + debug tabs + registry target `/api/v1/fritzbox/*` | unit | `npm test -- app/network/__tests__/page.test.tsx app/registry/devices/__tests__/page.test.tsx app/debug/components/tabs/__tests__/NetworkTab.test.tsx` | ✅ (tests exist; update fetch-URL assertions) | ⬜ pending |
| 172-03-02 | 03 | 3 | SC-4 | — | Repo-wide grep `/api/fritzbox/` outside `.planning/` returns zero matches (`*.ts` + `*.tsx`) | grep | `! grep -rn "/api/fritzbox/" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=".next"` | — | ⬜ pending |
| 172-03-03 | 03 | 3 | SC-4 | — | Playwright smoke green (no 404s on migrated pages) | e2e | `npx playwright test tests/smoke/page-loads.spec.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing Jest + Playwright infrastructure covers all phase requirements. No new test files, no framework installs, no fixture additions needed — Phase 171 already shipped the hook tests and page tests that this phase will update in-place (URL string assertion swap from `/api/fritzbox/*` → `/api/v1/fritzbox/*`).

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

Rationale: path migration is a pure structural refactor. Jest hook tests verify outbound URL strings; Playwright smoke verifies page loads end-to-end; grep verifies zero stragglers. No UX/visual/interactive concerns.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none MISSING)
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter (planner to set after verifying task-IDs align with PLAN.md task numbering)

**Approval:** pending
