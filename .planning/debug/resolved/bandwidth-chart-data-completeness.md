---
status: resolved
trigger: "Verify that the network card (home dashboard) and network page display bandwidth values by combining the current real-time value with historical data to show a rich, well-populated chart."
created: 2026-02-17T00:00:00Z
updated: 2026-02-17T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Three bugs found: (1) useNetworkData uses Date.now() for sparkline timestamps during polling but uses item.timestamp for historical seeds, creating an inconsistency. (2) When the network page uses both useNetworkData AND useBandwidthHistory, both hooks independently fetch bandwidth-history on mount, but only useBandwidthHistory.addDataPoint is connected - useNetworkData sparklines are NOT fed into useBandwidthHistory. (3) useBandwidthHistory loads 7d history but addDataPoint uses bandwidth.timestamp from the fritz!box API which could duplicate recent historical points.
test: Read all the relevant code paths
expecting: Fix all three issues
next_action: Apply fixes

## Symptoms

expected: The bandwidth charts (sparklines on home card, full charts on network page) should show current bandwidth value PLUS historical bandwidth data points, resulting in a chart with many data points that looks good and informative.
actual: Need to verify if the current implementation correctly combines real-time bandwidth with historical data from the Fritz!Box API. Quick tasks 27-29 were supposed to add this but we need to verify the implementation is correct.
errors: None reported - this is a verification/improvement task
reproduction: Look at the network card on the home dashboard and the network page charts
started: Quick tasks 27-29 recently added historical bandwidth data integration

## Eliminated

## Evidence

- timestamp: 2026-02-17T00:01:00Z
  checked: useBandwidthHistory.ts
  found: |
    - Loads 7d of history from /api/fritzbox/bandwidth-history?range=7d on mount.
    - addDataPoint() uses bandwidth.timestamp (Fritz!Box API fetched_at time).
    - chartData computed by filtering history[] by time range, then decimating.
    - COLLECTING_THRESHOLD=10 means chart shows "collecting" state if < 10 points.
    - Historical points from API should immediately bypass the collecting threshold.
  implication: The design is correct in isolation. Historical pre-population should work.

- timestamp: 2026-02-17T00:02:00Z
  checked: useNetworkData.ts
  found: |
    - Seeds downloadHistory/uploadHistory from /api/fritzbox/bandwidth-history?range=1h on mount.
    - During polling (fetchData), appends new points using Date.now() NOT bw.timestamp.
    - SPARKLINE_MAX_POINTS=120 (1h at 30s). Cap removes oldest when exceeded.
    - BUG: The historical seed uses item.timestamp*1000 (accurate measurement time).
      But live polling appends Date.now() (time of React state update, slightly later).
      This inconsistency is minor but could cause tiny timeline gaps.
    - REAL BUG: After seeding 1h of history (e.g., 60 points at 1-min intervals), live
      polling appends more points. But since SPARKLINE_MAX_POINTS=120 at 30s interval,
      if historical data has more granular timestamps (e.g., every minute = 60 points),
      live polling adds 120 more in next hour → slicing to 120 DROPS the historical seed.
      After just 1 hour of polling, the historical seed is completely evicted.
      This is expected behavior but worth noting.

- timestamp: 2026-02-17T00:03:00Z
  checked: network/page.tsx (NetworkPage orchestrator)
  found: |
    - Uses both useNetworkData AND useBandwidthHistory.
    - useNetworkData polls /api/fritzbox/bandwidth every 30s.
    - useEffect feeds networkData.bandwidth → bandwidthHistory.addDataPoint().
    - useBandwidthHistory.addDataPoint uses bandwidth.timestamp (Fritz!Box API time).
    - useBandwidthHistory loads 7d history on mount.
    - NO DUPLICATION risk: historical data and live polling use same timestamp source
      (Fritz!Box API fetched_at). If polling returns same timestamp as last history
      point, history[] gets a duplicate entry. But since the chart renders all points,
      duplicate timestamps just show overlapping lines (not visible difference).
    - POTENTIAL BUG: bandwidth.timestamp comes from Fritz!Box API fetched_at field.
      The /api/fritzbox/bandwidth route has 60-second cache (getCachedData). So
      within a 60s window, multiple polls return the SAME bandwidth object with
      the SAME timestamp. addDataPoint() adds DUPLICATE timestamps to history[].
      Over time this means history[] fills up with duplicate entries for the same
      time window = wasted buffer space, and it could cause COLLECTING_THRESHOLD
      to report more points than actual distinct time periods.

- timestamp: 2026-02-17T00:04:00Z
  checked: fritzboxClient.ts getBandwidth()
  found: |
    - timestamp = new Date(raw.fetched_at).getTime()
    - fetched_at is set by the HomeAssistant API, not the Fritz!Box itself.
    - getCachedData in bandwidth/route.ts caches for 60s.
    - When cache hits, same timestamp is returned every 30s poll for 60s.
    - Both polls within the same 60s window produce the same bandwidth.timestamp value.
    - addDataPoint() will add 2 entries with identical timestamp to history[].
  implication: |
    CONFIRMED BUG: Duplicate timestamps accumulate in history[] because:
    1. /api/fritzbox/bandwidth has 60s cache
    2. polling interval is 30s
    3. addDataPoint uses bandwidth.timestamp (cached value = same for 2 polls)
    Result: History fills with duplicates, wasting buffer space. For 7 days at 30s
    interval: 7*24*60*2 = 20160 points, but MAX_POINTS=10080. With 50% duplicates,
    effective data retention is only 3.5 days.

- timestamp: 2026-02-17T00:05:00Z
  checked: useBandwidthHistory.ts addDataPoint()
  found: |
    - No deduplication logic. Simply appends new point and slices to MAX_POINTS.
    - BIG ISSUE: When bandwidth.timestamp is the same (cache hit), two points with
      identical time/download/upload are added. Then when filtering by time range,
      both appear. When rendering in recharts, they cause a flat/duplicate line segment.
    - MOST IMPORTANT BUG: The isCollecting state shows "collecting" when < 10 points.
      But initial load from API should give many points (e.g., 24h = ~1440 points).
      So after mount, isCollecting should be false. This part WORKS correctly.
    - REAL ISSUE: addDataPoint uses bandwidth.timestamp which due to 60s server cache
      could be stale. The CORRECT approach is to use Date.now() as the timestamp
      for live polling points, to always have fresh, unique timestamps.

- timestamp: 2026-02-17T00:06:00Z
  checked: useNetworkData.ts sparkline seeding vs live polling timestamp
  found: |
    - Historical seed (on mount): uses item.timestamp * 1000 (actual measurement time)
    - Live polling append: uses Date.now() (time of state update, i.e. "now")
    - These two sources are INCOMPATIBLE in timeline:
      * Historical: e.g., [now-3600000, now-3540000, ..., now-60000] (past times)
      * Live polling: [Date.now(), Date.now()+30000, ...] (current/future times)
      * They DON'T overlap = chart shows a continuous timeline. This is CORRECT.
    - For useBandwidthHistory: historical uses item.timestamp*1000, live uses
      bandwidth.timestamp. If bandwidth.timestamp is from the 60s cache, it could
      MATCH recent historical points → duplicates in history[].
  implication: |
    The fix for useBandwidthHistory.addDataPoint should use Date.now() to ensure
    no duplication with historical points and always produce unique timestamps.

## Resolution

root_cause: |
  1. DUPLICATE TIMESTAMPS in useBandwidthHistory buffer: The /api/fritzbox/bandwidth
     route has a 60-second server-side cache, but the network page polls every 30s.
     Within each 60s cache window, addDataPoint() was called twice with the same
     bandwidth.timestamp, creating duplicate entries in history[]. This wasted buffer
     space (effective retention halved to ~3.5 days) and cluttered the chart with
     redundant points for the same timestamp.

  2. BLANK CHART during initial history load: BandwidthChart had no visual feedback
     while useBandwidthHistory was fetching historical data on mount. During this
     transient period (API call in-flight), isEmpty=false (isLoading=true) but
     data.length=0, resulting in blank chart space with no loading indicator.

fix: |
  1. Added deduplication to useBandwidthHistory.addDataPoint(): checks if the last
     point has the same timestamp as the incoming bandwidth.timestamp, and skips the
     insertion if so. This prevents the 60s cache from creating duplicate entries.

  2. Added isLoading prop (optional, default false) to BandwidthChart component and
     a loading state UI ("Caricamento storico banda...") shown when isLoading=true and
     data.length===0. Connected isLoading from useBandwidthHistory to BandwidthChart
     via NetworkPage. Updated mock in page.test.tsx to include isLoading.

verification: |
  - All 20 network-related test suites pass (217 tests)
  - 4 new tests added: 2 deduplication tests in useBandwidthHistory, 2 loading state
    tests in BandwidthChart
  - No regressions in any test

files_changed:
  - app/network/hooks/useBandwidthHistory.ts: Added deduplication logic in addDataPoint
  - app/network/components/BandwidthChart.tsx: Added isLoading prop and loading state UI
  - app/network/page.tsx: Pass isLoading prop to BandwidthChart
  - app/network/__tests__/components/BandwidthChart.test.tsx: Updated tests + 2 new tests
  - app/network/hooks/__tests__/useBandwidthHistory.test.ts: 2 new deduplication tests
  - app/network/__tests__/page.test.tsx: Added isLoading to useBandwidthHistory mock
