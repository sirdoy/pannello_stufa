# Phase 62: Dashboard Card - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

NetworkCard component on the home dashboard displaying WAN connection status, connected device count, current bandwidth (download/upload), and network health indicator. Click navigates to /network page. This is a read-only monitoring card — no controls or actions beyond navigation.

</domain>

<decisions>
## Implementation Decisions

### Card layout & hierarchy
- Compact density like WeatherCard (3-4 sections) — not a control panel, just monitoring
- Bandwidth numbers (download/upload) are the hero/primary element
- Secondary info (device count, WAN status, health) arranged by Claude's discretion based on existing patterns
- Green/teal color theme — distinct from ember (stove), warning (lights), ocean (thermostat/weather)

### Status & health visuals
- WAN online/offline shown as a prominent full-width colored status bar at top of card — green when connected, red when disconnected
- Health indicator (excellent/good/degraded/poor) — algorithm and visual representation at Claude's discretion based on available Fritz!Box data
- Offline visual treatment beyond the status bar at Claude's discretion

### Bandwidth display
- Hero element: two big numbers (download/upload in Mbps) with mini sparkline showing recent trend
- Units always in Mbps — no auto-scaling
- Sparkline colors for download vs upload at Claude's discretion (within green/teal theme)
- Sparkline time window/data points at Claude's discretion

### Error & edge states
- Fritz!Box unreachable: show last cached data with "Last updated X min ago" stale indicator + connection lost warning
- First-time use (no Fritz!Box data): at Claude's discretion
- API errors (TR-064 disabled, etc.): error handling approach at Claude's discretion based on existing patterns
- Loading state: card-shaped skeleton on initial data fetch — consistent with other cards

### Claude's Discretion
- Secondary info arrangement (info boxes row vs grid vs inline)
- Health algorithm (bandwidth saturation, composite score, or other)
- Health visual representation (colored text, signal icon, or other)
- Offline card dimming/grayscale treatment
- Download/upload sparkline color differentiation
- Sparkline data window size
- First-time use experience (setup card vs hidden vs other)
- Error display approach (inline banner vs error boundary)

</decisions>

<specifics>
## Specific Ideas

- Follows orchestrator pattern (hooks + presentational sub-components) like StoveCard/LightsCard
- Adaptive polling with 30s visible / 5min hidden intervals (decided in v8.0 architecture)
- Card is clickable — navigates to /network page
- Green/teal theme creates visual identity for network monitoring, distinct from all other device cards

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 62-dashboard-card*
*Context gathered: 2026-02-15*
