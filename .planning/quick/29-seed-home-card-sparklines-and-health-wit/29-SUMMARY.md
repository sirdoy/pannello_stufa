---
phase: quick-29
status: complete
started: 2026-02-17T13:57:53Z
completed: 2026-02-17T14:05:00Z
---

## Summary

Seeded home card sparklines with historical bandwidth data from the external Fritz!Box API.

### Changes

**`app/components/devices/network/hooks/useNetworkData.ts`**
- Added `useEffect` on mount that fetches `/api/fritzbox/bandwidth-history?range=1h`
- Transforms `BandwidthHistoryPoint[]` to `SparklinePoint[]` for both download and upload sparklines
- Increased sparkline buffer from 12 points (6 min) to 120 points (1h at 30s interval)
- Fire-and-forget pattern — silent failure, sparklines still work from polling

**`app/components/devices/network/__tests__/useNetworkData.test.ts`**
- Updated buffer overflow test: 130 iterations (exceeds 120 limit), assertions updated from 12 to 120

### Impact

- Home card sparklines now show 1h of historical data immediately on page load
- Health assessment has more data points for `historicalAvgSaturation` computation (up to 120 vs 12)
- Network page already used `useBandwidthHistory` for historical data — unchanged

### Tests

- 26/26 useNetworkData + NetworkCard tests passing
- 28/28 useBandwidthHistory + networkHealthUtils tests passing
