# Requirements: Pannello Stufa

**Defined:** 2026-02-13
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v8.0 Requirements

Requirements for Fritz!Box Network Monitor. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: Server-side proxy API routes for Fritz!Box API with X-API-Key authentication
- [ ] **INFRA-02**: Fritz!Box client with rate limiting (10 req/min, 6s minimum delay between requests)
- [ ] **INFRA-03**: Firebase RTDB cache for network data with 60s TTL
- [ ] **INFRA-04**: Network device type registered in device registry with routes and features
- [ ] **INFRA-05**: RFC 9457 error handling with specific error codes (RATE_LIMIT, TIMEOUT, TR064_NOT_ENABLED)
- [ ] **INFRA-06**: Fritz!Box connectivity check with setup guide link on TR-064 errors

### Dashboard Card

- [x] **DASH-01**: NetworkCard displays WAN connection status badge (online/offline)
- [x] **DASH-02**: NetworkCard shows connected device count
- [x] **DASH-03**: NetworkCard shows current aggregate bandwidth (download/upload Mbps)
- [x] **DASH-04**: NetworkCard links to /network page for full details
- [x] **DASH-05**: Network health indicator (excellent/good/degraded/poor) based on WAN uptime and bandwidth saturation

### WAN Status

- [x] **WAN-01**: User can see external IP address with copy-to-clipboard button
- [x] **WAN-02**: User can see WAN connection status with uptime duration
- [x] **WAN-03**: User can see DNS server and connection type info

### Device List

- [x] **DEV-01**: User can see device list with name, IP, MAC, and online/offline status badge
- [x] **DEV-02**: User can sort device list by any column (name, IP, status, bandwidth)
- [x] **DEV-03**: User can search/filter devices by name, IP, or MAC address
- [x] **DEV-04**: Device list paginated (25 per page) with existing DataTable component
- [x] **DEV-05**: Offline devices show last seen timestamp

### Bandwidth

- [x] **BW-01**: User can see real-time bandwidth chart with upload and download lines (Mbps)
- [x] **BW-02**: User can select time range for bandwidth chart (1h, 24h, 7d)
- [x] **BW-03**: Chart uses data decimation for 7-day view (max 500 data points)
- [x] **BW-04**: Bandwidth data polled with adaptive polling (30s visible, 5min hidden)

### Device History

- [ ] **HIST-01**: User can see device connection/disconnection events as a timeline
- [ ] **HIST-02**: User can filter history by specific device
- [ ] **HIST-03**: History shows last 24h by default with option for 7-day view

### Device Categorization

- [ ] **CAT-01**: Devices auto-categorized by MAC vendor lookup (IoT, mobile, PC, smart home, unknown)
- [ ] **CAT-02**: User can override device category manually
- [ ] **CAT-03**: Categories displayed with color-coded badges in device list

### Bandwidth Correlation

- [ ] **CORR-01**: User can see chart overlay of network bandwidth and stove power level
- [ ] **CORR-02**: Correlation feature gated behind analytics consent (canTrackAnalytics)
- [ ] **CORR-03**: User can see summary insight text for bandwidth-heating correlation

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Monitoring

- **ADV-01**: Guest network monitoring (separate visibility for guest devices)
- **ADV-02**: Anomaly detection for unusual bandwidth patterns
- **ADV-03**: Smart device naming suggestions based on manufacturer/port activity
- **ADV-04**: Quick device blocking (one-click parental controls)
- **ADV-05**: Data usage per-device over time (requires per-device history API)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Deep packet inspection UI | Privacy violation, overkill for home use |
| Network security scanner | Complex, requires pentesting expertise |
| DNS query logging UI | Privacy-invasive, sensitive data |
| Port forwarding management | Complex, dangerous for non-technical users |
| Firmware update UI | Risky if botched, router-specific |
| Device fingerprinting beyond MAC vendor | Privacy violation, surveillance-like |
| Always-on traffic surveillance | Performance impact, privacy violation — snapshot polling sufficient |
| WebSocket real-time updates | Polling adequate for network monitoring |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 61 | Pending |
| INFRA-02 | Phase 61 | Pending |
| INFRA-03 | Phase 61 | Pending |
| INFRA-04 | Phase 61 | Pending |
| INFRA-05 | Phase 61 | Pending |
| INFRA-06 | Phase 61 | Pending |
| DASH-01 | Phase 62 | Complete |
| DASH-02 | Phase 62 | Complete |
| DASH-03 | Phase 62 | Complete |
| DASH-04 | Phase 62 | Complete |
| DASH-05 | Phase 62 | Complete |
| WAN-01 | Phase 63 | Complete |
| WAN-02 | Phase 63 | Complete |
| WAN-03 | Phase 63 | Complete |
| DEV-01 | Phase 63 | Complete |
| DEV-02 | Phase 63 | Complete |
| DEV-03 | Phase 63 | Complete |
| DEV-04 | Phase 63 | Complete |
| DEV-05 | Phase 63 | Complete |
| BW-01 | Phase 64 | Complete |
| BW-02 | Phase 64 | Complete |
| BW-03 | Phase 64 | Complete |
| BW-04 | Phase 64 | Complete |
| HIST-01 | Phase 65 | Pending |
| HIST-02 | Phase 65 | Pending |
| HIST-03 | Phase 65 | Pending |
| CAT-01 | Phase 66 | Pending |
| CAT-02 | Phase 66 | Pending |
| CAT-03 | Phase 66 | Pending |
| CORR-01 | Phase 67 | Pending |
| CORR-02 | Phase 67 | Pending |
| CORR-03 | Phase 67 | Pending |

**Coverage:**
- v8.0 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

**Coverage validation:** 100% - All 32 v8.0 requirements mapped to phases 61-67

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after v8.0 roadmap creation*
