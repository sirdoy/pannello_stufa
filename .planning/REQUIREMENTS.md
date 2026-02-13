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

- [ ] **DASH-01**: NetworkCard displays WAN connection status badge (online/offline)
- [ ] **DASH-02**: NetworkCard shows connected device count
- [ ] **DASH-03**: NetworkCard shows current aggregate bandwidth (download/upload Mbps)
- [ ] **DASH-04**: NetworkCard links to /network page for full details
- [ ] **DASH-05**: Network health indicator (excellent/good/degraded/poor) based on WAN uptime and bandwidth saturation

### WAN Status

- [ ] **WAN-01**: User can see external IP address with copy-to-clipboard button
- [ ] **WAN-02**: User can see WAN connection status with uptime duration
- [ ] **WAN-03**: User can see DNS server and connection type info

### Device List

- [ ] **DEV-01**: User can see device list with name, IP, MAC, and online/offline status badge
- [ ] **DEV-02**: User can sort device list by any column (name, IP, status, bandwidth)
- [ ] **DEV-03**: User can search/filter devices by name, IP, or MAC address
- [ ] **DEV-04**: Device list paginated (25 per page) with existing DataTable component
- [ ] **DEV-05**: Offline devices show last seen timestamp

### Bandwidth

- [ ] **BW-01**: User can see real-time bandwidth chart with upload and download lines (Mbps)
- [ ] **BW-02**: User can select time range for bandwidth chart (1h, 24h, 7d)
- [ ] **BW-03**: Chart uses data decimation for 7-day view (max 500 data points)
- [ ] **BW-04**: Bandwidth data polled with adaptive polling (30s visible, 5min hidden)

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
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |
| INFRA-06 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| WAN-01 | — | Pending |
| WAN-02 | — | Pending |
| WAN-03 | — | Pending |
| DEV-01 | — | Pending |
| DEV-02 | — | Pending |
| DEV-03 | — | Pending |
| DEV-04 | — | Pending |
| DEV-05 | — | Pending |
| BW-01 | — | Pending |
| BW-02 | — | Pending |
| BW-03 | — | Pending |
| BW-04 | — | Pending |
| HIST-01 | — | Pending |
| HIST-02 | — | Pending |
| HIST-03 | — | Pending |
| CAT-01 | — | Pending |
| CAT-02 | — | Pending |
| CAT-03 | — | Pending |
| CORR-01 | — | Pending |
| CORR-02 | — | Pending |
| CORR-03 | — | Pending |

**Coverage:**
- v8.0 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after initial definition*
