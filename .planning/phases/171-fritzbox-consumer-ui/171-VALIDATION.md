---
phase: 171
slug: fritzbox-consumer-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-23
---

# Phase 171 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + @playwright/test (E2E smoke) |
| **Config file** | `jest.config.js`, `playwright.config.ts` |
| **Quick run command** | `npm run test:changed` (scoped to touched files per CLAUDE.md Rule 8) |
| **Full suite command** | `npm run test:components && npm run test:pages && npm run test:api` (scoped subsets; never bare `npm test`) |
| **Smoke command** | `npx playwright test tests/smoke/page-loads.spec.ts` |
| **Estimated runtime** | ~45s unit (scoped), ~90s smoke |

---

## Sampling Rate

- **After every task commit:** `npm run test:changed`
- **After every plan wave:** scoped subsets (`test:components`, `test:pages`, `test:api`) covering the wave's touched files
- **Before `/gsd-verify-work`:** full scoped subsets green + Playwright smoke green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 171-01-01 | 01 | 1 | FRITZ-01 | — | DECT handsets fetched via authed /api route, rendered without XSS (JSX escaping) | unit | `npm run test:components -- app/telefonia/components/__tests__/DectHandsetsTable.test.tsx` | ❌ W0 | ⬜ pending |
| 171-01-02 | 01 | 1 | FRITZ-01 | — | useFritzDectHandsets hook: success/error/paused/stale | unit | `npm run test:unit -- app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts` | ❌ W0 | ⬜ pending |
| 171-01-03 | 01 | 1 | FRITZ-02 | — | Call history paginated, duration/locale rendered, call_type badge mapping | unit | `npm run test:components -- app/telefonia/components/__tests__/CallHistoryTable.test.tsx` | ❌ W0 | ⬜ pending |
| 171-01-04 | 01 | 1 | FRITZ-02 | — | useFritzCallHistory hook: limit/offset forwarded, pagination reset on shrink | unit | `npm run test:unit -- app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts` | ❌ W0 | ⬜ pending |
| 171-01-05 | 01 | 1 | FRITZ-03 | — | TAM card renders enabled/disabled, new-message badge, stale banner | unit | `npm run test:components -- app/telefonia/components/__tests__/TamStatusCard.test.tsx` | ❌ W0 | ⬜ pending |
| 171-01-06 | 01 | 1 | FRITZ-03 | — | useFritzTamStatus hook: success/error/paused/stale | unit | `npm run test:unit -- app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts` | ❌ W0 | ⬜ pending |
| 171-01-07 | 01 | 2 | FRITZ-01…03 | — | /telefonia page loads, heading renders, sections render, no console errors | unit | `npm run test:pages -- app/telefonia/__tests__/page.test.tsx` | ❌ W0 | ⬜ pending |
| 171-01-08 | 01 | 2 | D-17 | — | CommandPalette `nav-telephony` navigates to `/telefonia` | unit | `npm run test:components -- app/components/layout/__tests__/CommandPaletteProvider.test.tsx` | ✅ (extend) | ⬜ pending |
| 171-02-01 | 02 | 1 | FRITZ-04 | — | Raw bandwidth table renders paginated data, timestamps as seconds→ms | unit | `npm run test:components -- app/network/components/__tests__/RawBandwidthTable.test.tsx` | ❌ W0 | ⬜ pending |
| 171-02-02 | 02 | 1 | FRITZ-04 | — | useFritzBandwidthHistoryRaw hook: paused/stale/error | unit | `npm run test:unit -- app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts` | ❌ W0 | ⬜ pending |
| 171-02-03 | 02 | 1 | FRITZ-05 | — | DevicePresenceTable degrades gracefully on 404 → EmptyState, never throws | unit | `npm run test:components -- app/network/components/__tests__/DevicePresenceTable.test.tsx` | ❌ W0 | ⬜ pending |
| 171-02-04 | 02 | 1 | FRITZ-05 | — | useFritzDevicePresenceHistory hook handles 404 → empty list, sets error=false | unit | `npm run test:unit -- app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts` | ❌ W0 | ⬜ pending |
| 171-02-05 | 02 | 1 | FRITZ-06 | — | Raw device events log renders connected/disconnected badges + time range | unit | `npm run test:components -- app/network/components/__tests__/RawDeviceEventsTable.test.tsx` | ❌ W0 | ⬜ pending |
| 171-02-06 | 02 | 1 | FRITZ-06 | — | useFritzDeviceEventsRaw hook: time range/mac forwarding, paused semantics | unit | `npm run test:unit -- app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts` | ❌ W0 | ⬜ pending |
| 171-02-07 | 02 | 2 | D-07, D-08, D-09 | — | /network Storico tab renders sub-sections, time range selector drives all three | unit | `npm run test:pages -- app/network/__tests__/storico-tab.test.tsx` | ❌ W0 | ⬜ pending |
| 171-02-08 | 02 | 2 | FRITZ-07 | XSS on TR-064 values | Service discovery tab renders table, URL is copy-capable, JSX escapes values | unit | `npm run test:components -- app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx` | ❌ W0 | ⬜ pending |
| 171-02-09 | 02 | 2 | FRITZ-07 | — | useFritzServiceDiscovery (or inline fetch) success/error + manual refresh | unit | `npm run test:unit -- app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts` | ❌ W0 | ⬜ pending |
| 171-02-10 | 02 | 3 | FRITZ-01…07 | — | Playwright smoke: /telefonia loads, /network Storico tab toggles, /debug Service Discovery tab toggles, no console errors | smoke | `npx playwright test tests/smoke/page-loads.spec.ts -g "171"` | ✅ (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts`
- [ ] `app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts`
- [ ] `app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts`
- [ ] `app/telefonia/components/__tests__/DectHandsetsTable.test.tsx`
- [ ] `app/telefonia/components/__tests__/CallHistoryTable.test.tsx`
- [ ] `app/telefonia/components/__tests__/TamStatusCard.test.tsx`
- [ ] `app/telefonia/__tests__/page.test.tsx`
- [ ] `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts`
- [ ] `app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts`
- [ ] `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts`
- [ ] `app/network/components/__tests__/RawBandwidthTable.test.tsx`
- [ ] `app/network/components/__tests__/DevicePresenceTable.test.tsx`
- [ ] `app/network/components/__tests__/RawDeviceEventsTable.test.tsx`
- [ ] `app/network/__tests__/storico-tab.test.tsx`
- [ ] `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx`
- [ ] `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts` (or inline tab test if hook not extracted)
- [ ] Extend `tests/smoke/page-loads.spec.ts` with three new smoke tests tagged "171"
- [ ] Extend `app/components/layout/__tests__/CommandPaletteProvider.test.tsx` with `nav-telephony` assertion

Framework is already installed — no installation steps.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live TAM badge pulse animation | D-06 / specifics | Visual animation state not reliably asserted in JSDOM | Run `npm run dev` → open `/telefonia` → confirm TAM card pulses when `new_messages > 0` |
| Italian locale date formatting visual correctness | D-05 | Locale-dependent rendering varies by system; Playwright smoke only asserts no console errors | Run `npm run dev` → open `/telefonia` → confirm call timestamps render in Italian `dd/mm/yyyy HH:mm` |
| Service Discovery manual refresh responsiveness | D-12 | UX quality rather than functional correctness | Run `npm run dev` → open `/debug` → click Service Discovery tab → click refresh button → confirm table re-populates within ~2s |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
