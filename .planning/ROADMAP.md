# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- ✅ **v6.0 Operations, PWA & Analytics** — Phases 49-54 (shipped 2026-02-11)
- ✅ **v7.0 Performance & Resilience** — Phases 55-60 (shipped 2026-02-13)
- 📋 **v8.0 Fritz!Box Network Monitor** — Phases 61-67 (planned)

## Phases

<details>
<summary>✅ v7.0 Performance & Resilience (Phases 55-60) — SHIPPED 2026-02-13</summary>

- [x] Phase 55: Retry Infrastructure (5/5 plans)
- [x] Phase 56: Error Boundaries (2/2 plans)
- [x] Phase 57: Adaptive Polling (3/3 plans)
- [x] Phase 58: StoveCard Refactoring (3/3 plans)
- [x] Phase 59: LightsCard & Page Refactoring (4/4 plans)
- [x] Phase 60: Critical Path Testing & Token Cleanup (5/5 plans)

</details>

<details>
<summary>✅ v6.0 Operations, PWA & Analytics (Phases 49-54) — SHIPPED 2026-02-11</summary>

- [x] Phase 49: Persistent Rate Limiting (4/4 plans)
- [x] Phase 50: Cron Automation Configuration (4/4 plans)
- [x] Phase 51: E2E Test Improvements (4/4 plans)
- [x] Phase 52: Interactive Push Notifications (3/3 plans)
- [x] Phase 53: PWA Offline Improvements (5/5 plans)
- [x] Phase 54: Analytics Dashboard & Consent (9/9 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v5.1)</summary>

See `.planning/milestones/` for full archives.

</details>

---

### 📋 v8.0 Fritz!Box Network Monitor (Planned)

**Milestone Goal:** Add Fritz!Box network monitoring as a new device in the PWA — dashboard card with connection/device/bandwidth summary plus a dedicated /network page with device list, bandwidth charts, WAN status, and device history.

#### Phase 61: Foundation & Infrastructure

**Goal:** Fritz!Box API integration layer with rate limiting, device registry, and proxy routes operational

**Depends on:** Phase 60 (brownfield integration)

**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06

**Success Criteria** (what must be TRUE):
1. Fritz!Box API key stored securely in environment variables and never exposed to client
2. Rate limiter enforces 10 req/min limit with 6-second minimum delay between requests
3. Network device type registered in unified device registry with routes and features
4. API proxy routes return Fritz!Box data with RFC 9457 error handling
5. Connectivity check endpoint detects TR-064 disabled and returns setup guide link

**Plans:** 2 plans

Plans:
- [x] 61-01-PLAN.md — Fritz!Box client, cache, rate limiter, error codes, and device registry
- [x] 61-02-PLAN.md — API proxy routes (health, devices, bandwidth, wan) with tests

---

#### Phase 62: Dashboard Card

**Goal:** NetworkCard displays connection status, device count, and bandwidth on home dashboard

**Depends on:** Phase 61

**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05

**Success Criteria** (what must be TRUE):
1. User sees NetworkCard on dashboard with WAN online/offline status badge
2. User sees total connected device count updating via adaptive polling
3. User sees current aggregate download/upload bandwidth in Mbps
4. User can click NetworkCard to navigate to full /network page
5. User sees network health indicator (excellent/good/degraded/poor) based on uptime and bandwidth saturation

**Plans:** 2/2 plans complete

Plans:
- [ ] 62-01-PLAN.md — Types, hooks (useNetworkData + useNetworkCommands), health algorithm with hysteresis
- [ ] 62-02-PLAN.md — Presentational sub-components, NetworkCard orchestrator, Skeleton, dashboard integration

---

#### Phase 63: WAN Status & Device List

**Goal:** User can view WAN connection details and paginated device list with search/filter

**Depends on:** Phase 62

**Requirements:** WAN-01, WAN-02, WAN-03, DEV-01, DEV-02, DEV-03, DEV-04, DEV-05

**Success Criteria** (what must be TRUE):
1. User can see external IP address with one-click copy-to-clipboard
2. User can see WAN connection status with uptime duration and DNS servers
3. User sees paginated device list (25 per page) with name, IP, MAC, online/offline status
4. User can sort device list by any column (name, IP, status, bandwidth)
5. User can search devices by name, IP, or MAC address with instant filtering
6. Offline devices show "Last seen X minutes ago" timestamp

**Plans:** 3/3 plans complete

Plans:
- [ ] 63-01-PLAN.md — Extend types, CopyableIp clipboard component, WanStatusCard with InfoBox grid
- [ ] 63-02-PLAN.md — DeviceStatusBadge with last seen, DeviceListTable with DataTable search/sort/pagination
- [ ] 63-03-PLAN.md — Network page orchestrator wiring WanStatusCard + DeviceListTable with useNetworkData hook

---

#### Phase 64: Bandwidth Visualization

**Goal:** User can monitor real-time bandwidth with charts and time-range selection

**Depends on:** Phase 63

**Requirements:** BW-01, BW-02, BW-03, BW-04

**Success Criteria** (what must be TRUE):
1. User sees real-time bandwidth chart with separate upload and download lines
2. User can switch time ranges (1h, 24h, 7d) with chart updating accordingly
3. Chart uses data decimation for 7-day view (renders <1s on mobile with 1440+ data points)
4. Bandwidth data refreshes automatically with adaptive polling (30s visible, 5min hidden)

**Plans:** 2/2 plans complete

Plans:
- [ ] 64-01-PLAN.md — LTTB decimation algorithm + useBandwidthHistory hook (TDD, data layer)
- [ ] 64-02-PLAN.md — BandwidthChart + TimeRangeSelector components + page integration

---

#### Phase 65: Device History Timeline

**Goal:** User can view device connection/disconnection events as a filterable timeline

**Depends on:** Phase 63

**Requirements:** HIST-01, HIST-02, HIST-03

**Success Criteria** (what must be TRUE):
1. User sees device connection/disconnection events as a chronological timeline
2. User can filter history to show events for a specific device
3. Timeline shows last 24h by default with option to expand to 7-day view

**Plans:** 3/3 plans complete

Plans:
- [ ] 65-01-PLAN.md — Device event logger with date-keyed Firebase storage (TDD)
- [ ] 65-02-PLAN.md — Event detection in devices endpoint + history query API
- [ ] 65-03-PLAN.md — Timeline UI components + useDeviceHistory hook + page integration

---

#### Phase 66: Device Categorization

**Goal:** Devices auto-categorized by manufacturer with manual override capability

**Depends on:** Phase 63

**Requirements:** CAT-01, CAT-02, CAT-03

**Success Criteria** (what must be TRUE):
1. Devices automatically categorized (IoT, mobile, PC, smart home, unknown) via MAC vendor lookup
2. User can manually override category for any device with changes persisting in Firebase
3. Categories displayed with color-coded badges in device list for quick visual identification

**Plans:** 4/4 plans complete

Plans:
- [x] 66-01-PLAN.md — Category types, vendor mapping heuristics, vendor cache, override storage (TDD)
- [x] 66-02-PLAN.md — Vendor lookup API route + category override API route with tests
- [x] 66-03-PLAN.md — DeviceCategoryBadge component + DeviceListTable category column with inline edit
- [ ] 66-04-PLAN.md — Gap closure: wire auto-categorization + manual override end-to-end integration

---

#### Phase 67: Bandwidth Correlation

**Goal:** User sees correlation between network bandwidth and stove power consumption

**Depends on:** Phase 64

**Requirements:** CORR-01, CORR-02, CORR-03

**Success Criteria** (what must be TRUE):
1. User sees chart overlay showing network bandwidth and stove power level on same timeline
2. Correlation feature only visible to users who granted analytics consent (canTrackAnalytics gate)
3. User sees summary insight text explaining bandwidth-heating correlation patterns

**Plans:** 2/2 plans complete

Plans:
- [ ] 67-01-PLAN.md — Pearson correlation utility + useBandwidthCorrelation hook with TDD (data layer)
- [ ] 67-02-PLAN.md — BandwidthCorrelationChart + CorrelationInsight components + page orchestrator wiring with consent gate

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 44-48 | v5.1 | 39/39 | ✓ Complete | 2026-02-10 |
| 49-54 | v6.0 | 29/29 | ✓ Complete | 2026-02-11 |
| 55-60 | v7.0 | 22/22 | ✓ Complete | 2026-02-13 |
| 61 | v8.0 | 2/2 | ✓ Complete | 2026-02-13 |
| 62-67 | v8.0 | 0/TBD | Not started | - |

**Total:** 10 milestones shipped, 61 phases complete, 300 plans executed

---

*Roadmap updated: 2026-02-13 — Phase 61 complete (2/2 plans, verified)*
