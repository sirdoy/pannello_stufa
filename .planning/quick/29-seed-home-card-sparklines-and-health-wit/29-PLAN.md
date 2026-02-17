---
phase: quick-29
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/network/hooks/useNetworkData.ts
  - app/components/devices/network/__tests__/useNetworkData.test.ts
autonomous: true
---

<objective>
Seed home card sparklines with historical bandwidth data from external API on mount.
Increase sparkline buffer from 12 (6 min) to 120 (1h) to show meaningful trends.
</objective>

<tasks>
<task type="auto">
  <name>Seed sparklines with historical data on mount</name>
  <action>
  - Add useEffect in useNetworkData to fetch /api/fritzbox/bandwidth-history?range=1h on mount
  - Transform BandwidthHistoryPoint[] to SparklinePoint[] for download/upload history
  - Increase sparkline buffer from 12 to 120 (1h at 30s)
  - Update test assertions from 12 to 120
  </action>
</task>
</tasks>
