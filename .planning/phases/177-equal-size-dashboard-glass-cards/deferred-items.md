# Phase 177 — Deferred Items

Pre-existing tsc errors found in unrelated files during 177-02 execution. Not in scope for this plan; not introduced by this plan; not blocked by this plan.

## Pre-existing tsc errors (out-of-scope per executor scope-boundary rule)

| File | Line | Error |
|------|------|-------|
| app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx | 110 | TS2345: HTMLElement \| undefined not assignable to Element \| Node \| Window \| Document |
| app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts | 26, 77 | TS2532: Object is possibly 'undefined' |
| app/network/__tests__/storico-tab.test.tsx | 209 | TS2345: HTMLElement \| undefined not assignable to Element |
| app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts | 117, 123 | TS2322: '7d' not assignable to '24h'; TS2550: 'at' missing on any[] |
| app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts | 48 | TS2532: Object is possibly 'undefined' |

These exist on the base commit `d4cb3da3` (Phase 177 plan-set landing). Plan 177-02 only adds files under `app/components/EmberGlass/` and `app/components/devices/weather/hooks/` plus `app/globals.css` — none of which touch the affected test files.
