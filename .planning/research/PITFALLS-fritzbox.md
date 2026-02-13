# Pitfalls Research

**Domain:** Fritz!Box Network Monitoring Integration
**Researched:** 2026-02-13
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Rate Limit Budget Exhaustion (10 req/min vs 400 req/hr)

**What goes wrong:**
Fritz!Box API has a 10 req/min rate limit (600 req/hr theoretical), but unlike Netatmo (400 req/hr), this is significantly lower and shared across ALL endpoints. Loading the network page requires multiple endpoints (devices list, bandwidth stats, WAN status, history), potentially consuming 4-6 requests. At 10 req/min, you can only load the full page 1-2 times per minute before hitting the limit. Aggressive polling or multiple users exhaust the budget within minutes, causing 429 errors and blocking all API access for the entire application.

**Why it happens:**
Developers treat the 10 req/min limit like Netatmo's 400 req/hr (6.6 req/min) and assume similar polling strategies will work. They calculate "10 requests per minute = 600 per hour" without realizing the burst window is far more restrictive. A single page load consuming 5 requests means only 2 page loads per minute are possible.

**How to avoid:**
- Implement dual-window rate limiting (10/min burst + conservative hourly limit)
- Budget allocation strategy: Reserve 2 req/min for critical endpoints (devices), 3 req/min for bandwidth, 5 req/min for user actions
- Parallelize independent API calls (devices + bandwidth) using Promise.all to minimize burst consumption
- Increase polling intervals: network stats can use 60s polling (vs. stove's 5s) — network metrics don't change as rapidly
- Cache aggressively: Use Firebase RTDB cache with 60s TTL (vs. Netatmo's 30s)
- Reuse existing `netatmoRateLimiterPersistent.ts` pattern, adapt for Fritz!Box's tighter limits

**Warning signs:**
- 429 errors appearing in console during development
- Rate limit debug data showing rapid count increases (approaching 10 within seconds)
- Multiple "Rate limit remaining: 0" logs appearing
- Page load taking >6 seconds due to sequential API calls (waterfall effect)

**Phase to address:**
Phase 1 (Foundation) — Rate limiting must be built from the start, not retrofitted

---

### Pitfall 2: Self-Hosted API Connectivity Assumptions

**What goes wrong:**
Fritz!Box API runs on the router itself via myfritz.net dynamic DNS, not a cloud service. When users are away from home network, myfritz.net may fail to resolve, timeout, or return stale data. Unlike Netatmo/Hue cloud APIs that have 99.9% uptime, Fritz!Box depends on router uptime, ISP stability, and dynamic DNS propagation. Requests may hang for 30-60 seconds before timing out, blocking the UI. Users see "loading..." forever with no feedback.

**Why it happens:**
Developers test on local network where Fritz!Box is reliably accessible at fritz.box:49000 or via local IP. They don't test scenarios where:
- User is on cellular network (not home WiFi)
- Router is rebooting (5-10 minute window)
- ISP has outage
- Dynamic DNS hasn't updated after IP change
- Router firewall blocks external TR-064 access

The existing `withHueHandler` middleware handles local API timeouts (HUE_NOT_CONNECTED, NETWORK_TIMEOUT), but developers may not realize Fritz!Box has similar failure modes.

**How to avoid:**
- Create `withFritzBoxHandler` middleware similar to `withHueHandler` (handles FRITZBOX_NOT_CONNECTED, NETWORK_TIMEOUT)
- Set aggressive timeouts: 10s for health check, 15s for data endpoints (vs. default 60s)
- Implement retry with exponential backoff: 3 retries with 1s, 2s, 4s delays
- Add connectivity indicator to UI: green (local network), yellow (myfritz.net), red (unreachable)
- Fallback to cached data when API unreachable (with staleness indicator)
- Preload health check: Call `/api/fritzbox/health` before rendering network page to detect connectivity issues early

**Warning signs:**
- API calls taking >20 seconds to complete
- Intermittent 500 errors with "ECONNREFUSED" or "ETIMEDOUT"
- Users reporting "works at home, doesn't work on cellular"
- Sentry errors showing myfritz.net resolution failures

**Phase to address:**
Phase 2 (Integration) — Connectivity handling must be built into API layer before UI implementation

---

### Pitfall 3: Large Dataset Rendering Without Pagination (1440+ records)

**What goes wrong:**
Bandwidth history endpoint returns up to 7 days of data (1440+ records at 1-minute granularity). Rendering all records in a chart causes browser freezing (>2 seconds to render), poor scroll performance, and mobile device crashes. Chart.js struggles with 1000+ data points, especially on initial render. Users see blank screen or "page unresponsive" dialog.

**Why it happens:**
Developers test with small datasets (24 hours = 144 records) during initial development, and charts render smoothly. They don't test with 7-day datasets until later phases. By then, the architecture is committed to fetching all data upfront without pagination or decimation. Existing project has no precedent for large dataset charts — all existing charts (pellet consumption, temperature trends) use <100 data points.

**How to avoid:**
- Client-side decimation: Use Chart.js decimation plugin to reduce data points to <500 visible points
- Time range selector: Default to 24 hours (144 points), allow users to switch to 7 days with warning
- Virtual scrolling for device list: If router has >50 devices, use react-window for virtualization
- Lazy loading: Load 24h data first, fetch 7d data on user action (dropdown select)
- Backend aggregation: For 7d view, aggregate to hourly buckets (168 points instead of 1440+)
- Limit initial fetch: Add `?hours=24` param to history endpoint, fetch more on demand
- Use streaming/progressive loading: Show 24h immediately, load remaining 6d in background

**Warning signs:**
- Chart render time >1 second on fast desktop
- Mobile devices showing "page unresponsive" dialog
- React DevTools showing >500ms component render time
- High memory usage in browser (>200MB for single page)
- Lighthouse performance score drops below 70

**Phase to address:**
Phase 3 (UI & Charts) — Pagination strategy must be decided before chart implementation

---

### Pitfall 4: Sequential API Call Waterfall (6+ seconds load time)

**What goes wrong:**
Network page requires multiple endpoints: `/health`, `/devices`, `/bandwidth`, `/wan`, `/history`. If called sequentially (await each), total load time is 6+ seconds (1s per endpoint). Users see progressive loading with multiple spinner states, creating perception of slowness. Rate limit budget is consumed slowly, allowing only 1-2 full page loads per minute.

**Why it happens:**
Developers follow traditional REST patterns where dependent calls must be sequential. They don't realize Fritz!Box endpoints are independent and can be parallelized. The project's existing Netatmo integration uses sequential calls (`/homesdata` then `/homestatus`), but those have dependencies. Fritz!Box endpoints don't have such dependencies, but developers copy the existing pattern.

**How to avoid:**
- Parallel fetching with Promise.all for independent endpoints:
  ```typescript
  const [health, devices, bandwidth, wan] = await Promise.all([
    fetch('/api/fritzbox/health'),
    fetch('/api/fritzbox/devices'),
    fetch('/api/fritzbox/bandwidth'),
    fetch('/api/fritzbox/wan')
  ]);
  ```
- Preload pattern: Call critical endpoints (health, devices) in server component, defer non-critical (history) to client
- Suspense boundaries: Wrap each card in <Suspense> to show partial content while remaining loads
- Optimize rate limit consumption: 4 parallel calls consume 4 requests in 1 second (vs. 6 seconds sequential)
- Use Next.js parallel routes pattern for true concurrent loading
- Add loading skeletons per-card (not whole-page spinner) to improve perceived performance

**Warning signs:**
- Page load time >3 seconds on fast network
- Network tab showing sequential requests with gaps between
- Rate limit exhaustion despite low request frequency
- Users reporting "page feels slow"
- Lighthouse Time to Interactive >3s

**Phase to address:**
Phase 3 (UI & Charts) — Data fetching strategy must be parallel-first from the start

---

### Pitfall 5: Stale Data Cache Mismanagement (cache_age_seconds ignored)

**What goes wrong:**
Fritz!Box API includes `cache_age_seconds` in health endpoint responses, indicating how old the cached data is on the router itself. If ignored, the app displays stale data without indication. Users see "5 devices online" when actually 8 are online, or bandwidth charts showing data from 10 minutes ago during active troubleshooting. Unlike Netatmo which returns fresh data with explicit timestamps, Fritz!Box may return cached router data that's already 30-120 seconds old.

**Why it happens:**
Developers focus on client-side caching (Firebase RTDB with TTL) and don't realize the API itself returns cached data. They assume all responses are "fresh" like cloud APIs. The project's existing staleness indicator pattern (`useStalenessIndicator`) checks last_fetch_time but not upstream cache age. Combining client cache (60s) + router cache (120s) results in 180s total staleness, which is unacceptable for real-time network monitoring.

**How to avoid:**
- Parse `cache_age_seconds` from every API response
- Combined staleness calculation: `totalStaleness = clientCacheTTL + cache_age_seconds`
- Show staleness indicator when `totalStaleness > 120` seconds
- Adjust polling strategy: If `cache_age_seconds > 60`, skip cache and force fresh fetch
- Add "Refresh" button that bypasses both client and router cache (`?force_refresh=true`)
- Log cache age in dev mode: `console.log('[Fritz!Box] Cache age:', cache_age_seconds, 'Client age:', timeSinceLastFetch)`
- Document in UI: "Last updated 2 minutes ago (router cache: 45s)"

**Warning signs:**
- Users reporting data doesn't match router UI
- Bandwidth chart shows flat line during known high usage
- Device count doesn't update when devices connect/disconnect
- Debug logs showing identical responses across multiple fetches
- Rate limit not being consumed (suggests cache hitting too aggressively)

**Phase to address:**
Phase 2 (Integration) — Staleness handling must be built into API wrapper before caching layer

---

### Pitfall 6: Missing Idempotency for Router Commands

**What goes wrong:**
If Fritz!Box API exposes command endpoints (reconnect WAN, reboot device, block device), rapid button clicks without idempotency protection can trigger duplicate physical actions. Unlike stove ignite (controlled via existing `withIdempotency` middleware), router commands may not be covered by idempotency layer. User clicks "Reboot Router" twice due to slow UI feedback, causing two reboot cycles and 15-minute downtime instead of 5 minutes.

**Why it happens:**
Developers assume Fritz!Box API is read-only (devices, bandwidth, status) and don't implement write operations initially. Later phases add command features (reconnect, reboot, block) as "quick additions" without full idempotency review. The project's existing `idempotencyManager.ts` pattern isn't applied because "it's just a simple button click." Fritz!Box API may not return idempotent responses (no request ID), making deduplication client-side responsibility.

**How to avoid:**
- Apply `withIdempotency` middleware to ALL Fritz!Box POST/PUT endpoints from the start
- Register command endpoints in idempotency manager: `/api/fritzbox/wan/reconnect`, `/api/fritzbox/devices/[id]/reboot`
- Client-side button lockout: Disable button for 5 seconds after click (plus loading state)
- Confirmation dialogs for destructive actions: "Reboot will disconnect all devices for 5 minutes"
- Audit phase: Review all endpoints, classify as READ (no idempotency) or WRITE (require idempotency)
- Add `Idempotency-Key` header to all command requests (reuse existing client pattern)

**Warning signs:**
- User reports "clicked once, action happened twice"
- Router logs showing duplicate command timestamps
- Network downtime longer than expected after reboot command
- Multiple Firebase RTDB writes for same command timestamp
- Rate limit consumption spikes during command execution

**Phase to address:**
Phase 4 (Commands, if implemented) — Idempotency must be required for any write operation

---

### Pitfall 7: Ignoring Fritz!Box TR-064 Configuration Requirements

**What goes wrong:**
Fritz!Box TR-064 API requires two settings enabled in router UI: "Allow access for applications" and "Transmit status information over UPnP" under Home Network > Network > Network Settings. If either is disabled (common in security-conscious setups), all API calls return 403 Forbidden. Unlike Netatmo OAuth which shows clear auth error, Fritz!Box returns generic error making it hard to diagnose. Users can't access network features and support tickets escalate.

**Why it happens:**
Developers test with pre-configured test router that already has settings enabled. They don't test "fresh router" or "security hardened" scenarios. Setup documentation mentions config requirements but doesn't enforce verification. The project's existing setup docs (Netatmo, Hue) assume cloud APIs with guided OAuth flow, but Fritz!Box requires manual router config without feedback loop.

**How to avoid:**
- Setup wizard during onboarding: Guide user to enable TR-064 settings with screenshots
- Health check endpoint verification: Test TR-064 access, return specific error "TR-064 not enabled" instead of generic 403
- Documentation page: `/docs/fritz-box-setup.md` with step-by-step config instructions (similar to existing `netatmo-setup.md`)
- In-app link to router settings: Detect 403, show banner "TR-064 disabled — Click to view setup guide"
- Automatic retry after configuration: Polling health endpoint every 10s during setup until success
- Debug panel: Show TR-064 status indicator (green/red) with troubleshooting link

**Warning signs:**
- All Fritz!Box API calls returning 403 Forbidden
- Health endpoint failing with "Access Denied"
- User reports "worked before, stopped working" (after router firmware update reset settings)
- Logs showing repeated authentication failures
- Setup completion but no data displayed

**Phase to address:**
Phase 1 (Foundation) — Setup verification must be part of initial integration

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using sequential API calls instead of Promise.all | Simpler code, easier debugging | 3-5x slower page load, poor UX, rate limit inefficiency | Never — parallel is standard Next.js pattern |
| Skipping rate limiter for "low-traffic" endpoints | Faster development (no middleware setup) | Rate limit exhaustion when traffic scales, hard to add later | Only for admin-only debug endpoints |
| Rendering full 7-day dataset without decimation | Works with small test data | Mobile crashes, poor performance, user complaints | Never — Chart.js decimation is trivial to add |
| Ignoring `cache_age_seconds` from API responses | Less complex staleness logic | Users see stale data, lose trust in accuracy | Never — staleness is critical for monitoring |
| Single global rate limiter instead of per-endpoint budgets | Simpler tracking, single counter | Critical endpoints blocked by non-critical traffic | Only for MVP — add endpoint budgets in Phase 2 |
| Hardcoding 60s polling like Netatmo | Consistency across device types | Wastes rate limit budget, network stats don't need 60s | Only for MVP — optimize polling in Phase 3 |

## Integration Gotchas

Common mistakes when connecting to Fritz!Box API.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TR-064 API Access | Assuming API is publicly accessible like cloud API | Verify "Allow access for applications" enabled in router settings, test health endpoint first |
| Dynamic DNS (myfritz.net) | Not handling DNS resolution failures or stale IPs | Set aggressive timeout (10s), retry with backoff, fallback to cached data, show connectivity status |
| Rate Limiting | Treating 10 req/min like Netatmo's 400 req/hr | Implement dual-window (burst + hourly), budget allocation per endpoint, aggressive caching |
| Bandwidth History | Fetching 7 days upfront without pagination | Default to 24h, lazy load extended range, use Chart.js decimation, consider backend aggregation |
| API Credentials | Storing plaintext credentials in Firebase like Netatmo tokens | Use Firebase Admin SDK with encryption at rest, never client-side access, rotate credentials regularly |
| Error Handling | Generic "API Error" message for all failures | Specific errors: TR-064_NOT_ENABLED, NETWORK_TIMEOUT, RATE_LIMIT, STALE_DATA with user-actionable messages |
| Polling Strategy | Same 5-60s interval used for stove (safety-critical) | Network stats use 120-300s polling (less critical), health check uses 60s, bandwidth uses 300s |
| Cache Strategy | Reusing Netatmo's 30s TTL without considering router cache | 60s client cache + account for router's cache_age_seconds, combined staleness indicator |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering 1440+ chart data points without decimation | Browser freezing, high memory, mobile crashes | Use Chart.js decimation plugin (limit to 500 visible points) | >500 data points |
| Sequential API calls (devices → bandwidth → wan → history) | 6+ second page load, poor UX, rate limit waste | Parallel fetching with Promise.all, Suspense boundaries per card | 3+ endpoints |
| No virtual scrolling for device list | Slow rendering, high memory when many network devices | Use react-window when device count >50 | >30 devices |
| Aggressive polling (60s) without rate limit budget awareness | Rate limit exhaustion within 10 minutes | Budget allocation: 2 req/min critical, 3 req/min background, 5 req/min user actions | 2+ concurrent users |
| Client-only caching (localStorage) without server cache | Cold starts fetch all data, slow initial load | Firebase RTDB cache with TTL, preload in server component | Every page refresh |
| Synchronous chart rendering in main thread | UI blocks during chart render (1-2s) | Use requestIdleCallback or setTimeout(0) for chart initialization | >200 data points |
| No request deduplication (multiple components call same endpoint) | 3x API calls, rate limit waste, inconsistent data | SWR or React Query with deduplication, or shared data context | 3+ components use same data |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing Fritz!Box credentials client-side (localStorage, cookies) | XSS attack can steal router admin credentials | Store credentials in Firebase RTDB (server-side only), use admin SDK with encryption |
| Exposing router local IP or myfritz.net hostname in API responses | Attackers can target user's router directly | Return device IDs only, resolve hostname server-side, sanitize IP addresses in logs |
| No rate limiting on command endpoints (reboot, block device) | Attacker can DoS user's network by spamming commands | Apply rate limiting: 1 command per 30 seconds, require Auth0 session, log all commands |
| Logging full API responses with device MAC addresses | PII leakage, tracking users across networks | Sanitize logs: replace MAC addresses with hashed IDs, truncate IP addresses |
| Allowing direct API proxy without Auth0 authentication | Unauthenticated users can query router data | All `/api/fritzbox/*` endpoints must use `withAuthAndErrorHandler` middleware |
| No CSRF protection on command endpoints | Attacker can trigger commands via malicious link | Use Idempotency-Key header (already CSRF-protected), validate Auth0 session on every command |
| Displaying WAN IP address in UI | Privacy concern, reveals user location | Only show last 2 octets (e.g., "192.168.x.x"), or show ISP name only |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading skeleton, full-page spinner for 6s | User stares at blank screen, perceives app as slow | Progressive loading with Suspense per card, skeleton for each section (devices, bandwidth, wan) |
| Showing raw error "403 Forbidden" when TR-064 disabled | User confused, doesn't know how to fix | Specific message: "TR-064 not enabled — View setup guide" with link to `/docs/fritz-box-setup` |
| No staleness indicator when displaying 2-minute-old data | User makes decisions based on outdated info | Show "Updated 2m ago" with yellow icon when >90s, "Refresh" button to force fetch |
| Device list shows all devices without active/inactive grouping | User scrolls through 50+ devices to find online ones | Group by status (active first), add filter toggle "Show offline devices (23)" |
| Bandwidth chart shows 7 days by default on mobile | Chart unreadable, poor performance | Default to 24h on mobile, 7d on desktop, add time range selector |
| No feedback after clicking "Reconnect WAN" | User clicks multiple times (causing duplicate actions) | Disable button, show loading state, display success message "Reconnecting... (30s)" |
| Missing connectivity status indicator | User doesn't know if data is live or cached | Traffic light icon: green (local network), yellow (myfritz.net), red (offline/cached) |
| Chart renders before data loads (shows empty axis) | User sees broken chart, thinks app is broken | Use loading skeleton or "Loading chart..." message, only render chart when data available |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Rate Limiter:** Often missing dual-window (burst + hourly) — verify both 10/min and hourly limits enforced
- [ ] **Error Handling:** Often missing specific TR-064 errors — verify TR-064_NOT_ENABLED, NETWORK_TIMEOUT, STALE_DATA errors handled
- [ ] **Staleness Indicator:** Often missing router cache consideration — verify `cache_age_seconds` parsed and displayed
- [ ] **Chart Decimation:** Often missing on 7-day view — verify Chart.js decimation plugin configured (maxDataPoints: 500)
- [ ] **Parallel Fetching:** Often sequential despite independence — verify Promise.all used for devices+bandwidth+wan
- [ ] **Connectivity Status:** Often missing myfritz.net detection — verify local/remote/offline status displayed
- [ ] **Setup Documentation:** Often missing TR-064 configuration steps — verify setup guide exists with screenshots
- [ ] **Idempotency (Commands):** Often missing on write operations — verify withIdempotency applied to all POST/PUT endpoints
- [ ] **Virtual Scrolling:** Often missing on device list — verify react-window used when device count >30 (tested in dev mode)
- [ ] **Mobile Performance:** Often not tested with 7d dataset — verify chart renders in <1s on real mobile device (not just responsive design)
- [ ] **Rate Limit Budget:** Often missing per-endpoint allocation — verify critical endpoints reserved, background endpoints throttled
- [ ] **Timeout Configuration:** Often using default 60s — verify 10s health, 15s data endpoints, retry with backoff

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rate Limit Exhaustion | LOW | 1. Wait for window reset (1 minute). 2. Increase polling intervals (60s→120s). 3. Add per-endpoint budget allocation. 4. Enable more aggressive caching (60s→120s TTL). |
| Sequential API Waterfall | LOW | 1. Refactor data fetching to use Promise.all. 2. Add preload pattern in server component. 3. Split into multiple Suspense boundaries. 4. Measure with Lighthouse before/after. |
| Large Dataset Crashes | MEDIUM | 1. Add Chart.js decimation plugin. 2. Implement time range selector (default 24h). 3. Backend aggregation for 7d view. 4. Virtual scrolling for device list. 5. Test on real mobile devices. |
| TR-064 Not Enabled | LOW | 1. Detect 403 error in middleware. 2. Show setup guide banner. 3. Add health check with retry. 4. Document in /docs/fritz-box-setup.md. 5. Add troubleshooting link. |
| Stale Data Display | LOW | 1. Parse cache_age_seconds from responses. 2. Calculate combined staleness (client + router). 3. Add staleness indicator to UI. 4. Reduce cache TTL (60s→30s). 5. Add manual refresh button. |
| Connectivity Issues | MEDIUM | 1. Reduce timeout (60s→10s). 2. Add retry with exponential backoff. 3. Create withFritzBoxHandler middleware. 4. Fallback to cached data with indicator. 5. Test on cellular network. |
| Missing Idempotency | HIGH | 1. Add withIdempotency to all write endpoints. 2. Client-side button lockout. 3. Audit all endpoints (read vs write). 4. Add Idempotency-Key header. 5. Test with rapid clicks. |
| Device List Not Virtualized | LOW | 1. Install react-window. 2. Refactor device list component. 3. Test with 50+ devices. 4. Add loading skeleton. 5. Measure render time before/after. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Rate Limit Exhaustion | Phase 1 (Foundation) | Rate limiter middleware exists, dual-window enforced, tests pass with 10 parallel requests |
| Self-Hosted Connectivity | Phase 2 (Integration) | withFritzBoxHandler middleware exists, health check returns connectivity status, tested on cellular |
| Large Dataset Rendering | Phase 3 (UI & Charts) | Chart.js decimation configured, 7d view loads in <1s on mobile, virtual scrolling on device list |
| Sequential Waterfall | Phase 3 (UI & Charts) | Promise.all used for independent endpoints, page load <2s, Lighthouse TTI <3s |
| Stale Data Cache | Phase 2 (Integration) | cache_age_seconds parsed, combined staleness displayed, refresh button works |
| Missing Idempotency | Phase 4 (Commands, optional) | withIdempotency applied to all POST/PUT, rapid clicks don't duplicate actions |
| TR-064 Not Enabled | Phase 1 (Foundation) | Setup guide exists with screenshots, health check detects 403, error message actionable |

## Sources

**API Rate Limiting (General Best Practices):**
- [API Rate Limiting 2026 | How It Works & Why It Matters](https://www.levo.ai/resources/blogs/api-rate-limiting-guide-2026)
- [Rate Limiting and Guardrails | SmartThings](https://developer.smartthings.com/docs/getting-started/rate-limits)
- [Smart Home quotas and limits | Google Home Developers](https://developers.home.google.com/cloud-to-cloud/integration/quotas)
- [How to Handle API Rate Limits Gracefully (2026 Guide)](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits)

**Fritz!Box API & TR-064:**
- [Getting Started - fritzconnection](https://fritzconnection.readthedocs.io/en/latest/sources/getting_started.html)
- [FritzConnection API Documentation](https://fritzconnection.readthedocs.io/en/1.12.2/sources/fritzconnection_api.html)

**Dynamic DNS & Connectivity:**
- [Remote Access using FritzBox & AVM myFritz DDNS - Home Assistant Community](https://community.home-assistant.io/t/remote-access-using-a-fritzbox-the-avm-myfritz-ddns-service/611990?page=3)

**Next.js Performance & Pagination:**
- [Large Page Data | Next.js](https://nextjs.org/docs/messages/large-page-data)
- [Data Fetching: Patterns and Best Practices | Next.js](https://nextjs.org/docs/14/app/building-your-application/data-fetching/patterns)
- [Chart.js Performance Documentation](https://www.chartjs.org/docs/latest/general/performance.html)
- [Preventing Waterfall Effect in Data Retrieval](https://rishibakshi.hashnode.dev/how-to-prevent-the-waterfall-effect-in-data-fetching)

**Retry & Timeout Strategies:**
- [Best Practice: Implementing Retry Logic in HTTP API Clients](https://api4.ai/blog/best-practice-implementing-retry-logic-in-http-api-clients)
- [Timeouts, retries and backoff with jitter - AWS Builders Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)

**Project-Specific Patterns:**
- Existing `netatmoRateLimiterPersistent.ts` (dual-window rate limiting)
- Existing `withIdempotency` middleware (command deduplication)
- Existing `useAdaptivePolling` hook (visibility-aware polling)
- Existing `withHueHandler` middleware (local API error handling pattern)

---
*Pitfalls research for: Fritz!Box Network Monitoring Integration*
*Researched: 2026-02-13*
*Confidence: MEDIUM (WebSearch + verified with existing project patterns)*
