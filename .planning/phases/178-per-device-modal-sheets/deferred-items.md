# Phase 178 deferred items (logged by Plan 178-02 executor)

## Pre-existing tsc errors (out of scope for Plan 178-02)

These 7 errors existed at the base commit `3341250b` and are NOT attributable to Plan 178-02 changes:

- `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx:110` — HTMLElement|undefined argument
- `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts:26,77` — possibly undefined
- `app/network/__tests__/storico-tab.test.tsx:209` — HTMLElement|undefined argument
- `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts:117,123` — type "7d"/"24h" mismatch + .at() lib target
- `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts:48` — possibly undefined

Logged per scope-boundary rule. Not addressed by Plan 178-02 — promote separately if needed.
