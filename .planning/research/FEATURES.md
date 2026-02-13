# Feature Landscape: Fritz!Box Network Monitoring

**Domain:** Home network monitoring dashboard
**Researched:** 2026-02-13

## Table Stakes

Features users expect in a network monitoring UI. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Device list with online/offline status** | Core functionality — users need to know what's connected | Low | Badge variant for online/offline, existing ConnectionStatus component |
| **Device identification (name, IP, MAC)** | Users need to identify devices quickly | Low | Display in DataTable, name editable via API |
| **Real-time bandwidth usage** | Standard expectation from router monitoring tools | Medium | Chart with upload/download, polling every 5-10s |
| **Current WAN connection status** | Users need to know if internet is up | Low | Badge + uptime display, existing HealthIndicator component |
| **WAN uptime tracking** | Expected for connection reliability monitoring | Low | Display formatted uptime, already in API data |
| **Responsive mobile layout** | PWA requirement — users monitor from phones | Low | Grid → stack pattern exists (StoveCard, LightsCard) |
| **Device connection/disconnection events** | Users expect to see when devices join/leave network | Medium | Timeline or list of recent events with timestamps |
| **Bandwidth chart visualization** | Standard for network tools — visualize traffic over time | Medium | Line/area chart, similar to analytics UsageChart |
| **External IP display** | Basic info users check in router interface | Low | Text display with copy-to-clipboard |

## Differentiators

Features that set product apart from basic router interfaces. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Smart device naming suggestions** | Better UX than router defaults ("android-xyz") | Medium | AI or pattern matching based on manufacturer, port activity |
| **Historical device presence tracking** | See patterns: "Device connects every weekday 9-5pm" | Medium | Timeline visualization, requires 7-day history storage |
| **Bandwidth correlation with stove heating** | Unique to smart home context — IoT impact visibility | High | Joins Fritz!Box + Stove analytics data, requires consent |
| **Device categorization (IoT, mobile, PC)** | Organizes large device lists | Medium | Auto-detect via MAC vendor + user override |
| **Anomaly detection (unusual bandwidth)** | Proactive alerts for security/performance | High | Requires baseline calculation, notification integration |
| **Guest network monitoring** | Separate visibility for guest devices | Medium | Fritz!Box supports guest network tracking |
| **Data usage per-device over time** | Track which devices consume most data | High | Requires per-device history API, Fritz!Box may not expose |
| **Network health score** | Glanceable dashboard metric (like HealthIndicator) | Low | Aggregate WAN status + device count + bandwidth % |
| **Quick device blocking** | One-click parental controls/security | Medium | API must support device blocking, ethical considerations |

## Anti-Features

Features to explicitly NOT build (scope creep or privacy concerns).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Deep packet inspection UI** | Privacy violation, overkill for home use | Show aggregate bandwidth, not specific URLs/apps |
| **Always-on video surveillance of network traffic** | Performance impact, privacy violation | Snapshot polling every 5-10s, not streaming |
| **Network security scanner** | Complex, requires pentesting expertise | Show basic health status, link to Fritz!Box admin |
| **DNS query logging UI** | Privacy-invasive, sensitive data | Leave to Fritz!Box admin interface if needed |
| **Port forwarding management** | Complex, dangerous for non-technical users | Link to Fritz!Box admin for advanced features |
| **Firmware update UI** | Risky if botched, router-specific | Show update available notification, link to admin |
| **Device fingerprinting beyond MAC vendor** | Privacy violation, surveillance-like | Basic device info only (IP, MAC, vendor, name) |

## Feature Dependencies

```
WAN Status Display → (no dependencies)
Device List → (no dependencies)
Bandwidth Chart → Device List (to show per-device option)
Device History Timeline → Device List (historical data)
Network Health Score → WAN Status + Device List + Bandwidth Chart
Bandwidth Correlation (differentiator) → Analytics Consent + Stove Analytics Data
```

## MVP Recommendation

**Phase 1: Core Monitoring (Table Stakes)**

Prioritize:
1. **NetworkCard** (dashboard summary)
   - WAN status badge (online/offline, uptime)
   - Connected device count
   - Current bandwidth usage (up/down)
   - Network health indicator
   - Link to /network page
2. **Device List (DataTable)**
   - Name (editable), IP, MAC, Status badge
   - Sorting, filtering, pagination (existing DataTable component)
   - Last seen timestamp for offline devices
3. **Bandwidth Chart**
   - Real-time line chart (upload/download Mbps)
   - Time range selector (1h, 6h, 24h, 7d)
   - Uses existing Recharts from analytics page
4. **WAN Status Panel**
   - External IP (with copy button)
   - Connection status badge
   - Uptime duration
   - Reconnection count (if available)

**Phase 2: Historical & Differentiators**

Defer to Phase 2:
5. **Device History Timeline**
   - Connection/disconnection events
   - Visual timeline (last 24h, 7d)
   - Filter by device
6. **Network Health Score**
   - Aggregate metric (0-100)
   - Factors: WAN uptime, device count anomalies, bandwidth saturation
   - HealthIndicator component with "excellent/good/degraded/poor"
7. **Device Categorization**
   - Auto-detect: IoT, mobile, PC, smart home, unknown
   - User override with Select component
   - Color-coded badges per category

**Phase 3: Advanced (If Time Permits)**

8. **Bandwidth Correlation with Stove**
   - Requires analytics consent
   - Chart overlay: network bandwidth + stove power
   - Insight: "Network usage spikes when stove heats"

## Integration with Existing Patterns

### Leverages Existing Components

| Component | Use Case | Notes |
|-----------|----------|-------|
| **DataTable** | Device list with sorting/filtering | Already supports pagination, keyboard nav |
| **Badge** | Device status, WAN status | Variants: sage (online), neutral (offline) |
| **HealthIndicator** | Network health score | Existing ok/warning/critical variants |
| **Card** | NetworkCard layout | Use elevated variant with hover |
| **SmartHomeCard** | NetworkCard structure | Icon 📡, colorTheme "ocean" |
| **Recharts (LineChart)** | Bandwidth chart | Similar to UsageChart in analytics |
| **Button.Icon** | Copy IP button | Use existing icon button pattern |
| **Text** | Timestamps, metrics display | Use variant="secondary" for metadata |
| **Heading** | Section titles | level={2-3}, variant="ember" for accents |

### Follows Existing Patterns

| Pattern | Where Used | How to Apply |
|---------|-------------|--------------|
| **Orchestrator (hooks + presentational)** | StoveCard, LightsCard | useNetworkData + useNetworkCommands hooks |
| **Self-Contained Card** | All device cards | All NetworkCard info inside card, no external banners |
| **Adaptive Polling** | useVisibility hook | Poll bandwidth every 5s when visible, pause when hidden |
| **Offline Staleness** | useNetworkQuality | Show staleness indicator if data > 30s old |
| **Device Registry** | lib/devices/deviceTypes.ts | Add NETWORK device config with routes, features |
| **Analytics Consent** | ConsentBanner | Check canTrackAnalytics() before correlation features |

### New Components Required

| Component | Purpose | Complexity |
|-----------|---------|------------|
| **NetworkCard.tsx** | Dashboard summary card | Low (follows SmartHomeCard pattern) |
| **DeviceTable.tsx** | Device list with DataTable | Low (wraps existing DataTable) |
| **BandwidthChart.tsx** | Real-time bandwidth line chart | Medium (Recharts + polling) |
| **WANStatusPanel.tsx** | WAN info panel | Low (text + badges) |
| **DeviceHistoryTimeline.tsx** | Timeline visualization (Phase 2) | High (custom timeline rendering) |
| **NetworkHealthScore.tsx** | Aggregate health metric (Phase 2) | Medium (calculation logic + HealthIndicator) |

## Complexity Breakdown

### Low Complexity (1-2h each)
- NetworkCard dashboard summary
- WAN Status Panel
- Device Registry config
- Device identification display (IP, MAC, name)

### Medium Complexity (3-5h each)
- Device List with DataTable integration
- Bandwidth Chart with real-time polling
- Device connection/disconnection events
- Device categorization
- Historical device presence tracking

### High Complexity (6-8h each)
- Device History Timeline visualization
- Bandwidth correlation with stove analytics
- Anomaly detection logic
- Network Health Score calculation

## API Requirements

Based on question context, API provides:

| Endpoint | Data | Polling Frequency |
|----------|------|-------------------|
| `/api/fritz/devices` | Device list (IP, name, MAC, status) | 10s (stale data acceptable) |
| `/api/fritz/bandwidth` | Current up/down speeds, bytes sent/received | 5s (real-time needed) |
| `/api/fritz/wan` | External IP, connection status, uptime | 30s (slow-changing) |
| `/api/fritz/history/devices` | Device connection events (7 days) | 60s (historical) |
| `/api/fritz/history/bandwidth` | Bandwidth history (7 days) | 60s (historical) |

**Note:** Verify API supports device name updates (PUT `/api/fritz/devices/:mac`).

## Mobile Considerations

PWA-specific patterns for mobile network monitoring:

| Feature | Mobile Pattern |
|---------|----------------|
| **NetworkCard** | Full-width card, stack metrics vertically |
| **Device List** | Horizontal scroll for DataTable on small screens |
| **Bandwidth Chart** | Responsive Recharts, reduce time range options (1h, 24h only) |
| **WAN Status** | Collapsible panel, show only critical info initially |
| **Timeline** | Horizontal scroll with touch gestures |

## Testing Considerations

| Test Type | Focus Area |
|-----------|------------|
| **Unit** | Device filtering, status mapping, uptime formatting |
| **Integration** | Polling hooks, DataTable sorting/filtering |
| **E2E** | NetworkCard → /network navigation, device list interaction |
| **Accessibility** | Keyboard nav in DataTable, screen reader announcements for status changes |

## Sources

**Network Monitoring Dashboard Features:**
- [Home Assistant 2026.1 Dashboard Update](https://www.home-assistant.io/blog/2026/01/07/release-20261/)
- [Network Monitoring Dashboard Features & Benefits - Motadata](https://www.motadata.com/blog/network-monitoring-dashboard/)
- [Network Monitoring Dashboard Tools - Domotz](https://www.domotz.com/features/network-monitoring-dashboards.php)

**Router Monitoring UI Best Practices:**
- [How to Monitor Router Traffic - Comparitech](https://www.comparitech.com/net-admin/how-to-monitor-router-traffic/)
- [How to Monitor Network Devices - Obkio](https://obkio.com/blog/how-to-monitor-network-devices/)
- [Best Bandwidth Monitoring Tools - Zenarmor](https://www.zenarmor.com/docs/network-basics/6-best-bandwidth-monitoring-tools)

**Fritz!Box Capabilities:**
- [Fritz!Box Network Devices Monitoring - Netdata](https://www.netdata.cloud/monitoring-101/fritzbox-monitoring/)
- [Real-time Traffic Analysis on Fritz!Box - ntop](https://www.ntop.org/how-to-use-ntopng-for-realtime-traffic-analysis-on-fritzbox-routers/)
- [AVM Fritz!Box WAN Interface Sensor - PRTG](https://www.paessler.com/manuals/prtg/avm_fritzbox_wan_interface_v2_sensor)

**UI Design Patterns:**
- [Table vs List vs Cards - UX Patterns](https://uxpatterns.dev/pattern-guide/table-vs-list-vs-cards)
- [Card UI Design Best Practices - Eleken](https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners)
- [Timeline Visualization - KronoGraph](https://cambridge-intelligence.com/kronograph/)

**Device Tracking & History:**
- [Router History Logs & Connected Devices - TheLinuxCode](https://thelinuxcode.com/how-to-check-router-history-logs-connected-devices-and-what-you-can-and-cant-see-in-2026/)
- [MAC Address Tracker - ManageEngine](https://www.manageengine.com/products/oputils/mac-address-tracker.html)
- [Network Bandwidth Visualization - Kentik](https://www.kentik.com/kentipedia/bandwidth-utilization-monitoring/)
