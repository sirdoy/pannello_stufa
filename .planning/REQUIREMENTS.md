# Requirements: v17.1 WebSocket Alignment & Tuya Integration

## WS Type Alignment

- [ ] **WSTYPE-01**: All WS topic payload types include `data_freshness` field matching REST endpoint shape
- [ ] **WSTYPE-02**: FritzBoxData WS type includes `is_stale`, `fetched_at`, `data_freshness` fields
- [ ] **WSTYPE-03**: FritzBoxDevice includes `custom_name` and `device_type` registry metadata
- [ ] **WSTYPE-04**: DirigeraData includes `data_freshness` field
- [ ] **WSTYPE-05**: DirigeraBaseSensor includes `device_type` registry metadata
- [ ] **WSTYPE-06**: NetatmoData is typed interface with `body`, `status`, `time_server`, `data_freshness`
- [ ] **WSTYPE-07**: ThermorossiData includes `data_freshness`, `custom_name`, `device_type`
- [ ] **WSTYPE-08**: HueData uses `Record<string, HueLight>` and `Record<string, HueGroup>` (dict shape, not array)
- [ ] **WSTYPE-09**: HueLight includes `custom_name` and `device_type` registry metadata
- [ ] **WSTYPE-10**: HueData includes `data_freshness` field
- [ ] **WSTYPE-11**: SonosSpeaker includes `custom_name` and `device_type` registry metadata
- [ ] **WSTYPE-12**: SonosData includes `data_freshness` field
- [ ] **WSTYPE-13**: Topic union type includes all 8 topics (adding `raspi` and `tuya`)
- [ ] **WSTYPE-14**: TopicDataMap maps `raspi` and `tuya` to their respective payload types

## Raspi WS Migration

- [ ] **RASPI-01**: useRaspiData subscribes to `raspi` WS topic for live data push
- [ ] **RASPI-02**: useRaspiData falls back to HTTP polling when WS disconnected (interval gating pattern)
- [ ] **RASPI-03**: RaspiCard displays LastUpdated timestamp from WS/polling data
- [ ] **RASPI-04**: RaspiData type matches documented WS payload shape

## Tuya Provider — Infrastructure

- [ ] **TUYA-01**: tuyaProxy.ts function module with haGet/haPost transport for all 6 endpoints
- [ ] **TUYA-02**: TypeScript interfaces for TuyaPlug, TuyaPlugMutation, TuyaHealth, TuyaHistoryResponse
- [ ] **TUYA-03**: API route proxy GET /api/tuya/health (no auth)
- [ ] **TUYA-04**: API route proxy GET /api/tuya/plugs (list all plugs)
- [ ] **TUYA-05**: API route proxy GET /api/tuya/plugs/[device_id] (single plug)
- [ ] **TUYA-06**: API route proxy POST /api/tuya/plugs/[device_id]/state (toggle on/off)
- [ ] **TUYA-07**: API route proxy POST /api/tuya/plugs/[device_id]/timer (countdown)
- [ ] **TUYA-08**: API route proxy GET /api/tuya/plugs/[device_id]/history (energy history)

## Tuya Provider — Frontend

- [ ] **TUYA-09**: useTuyaData hook with WS-primary (`tuya` topic) and polling fallback
- [ ] **TUYA-10**: useTuyaCommands hook for state toggle and timer control
- [ ] **TUYA-11**: TuyaCard dashboard card showing plug status, power gauge, freshness badge
- [ ] **TUYA-12**: /tuya page with multi-plug grid, on/off toggles, energy charts, timer controls
- [ ] **TUYA-13**: Tuya device registered in device registry and navigation menu
- [ ] **TUYA-14**: Energy history chart with auto-granularity period selector (24h/7d/30d)

## Connection UX

- [ ] **UX-01**: NavbarConnectionStatus includes raspi and tuya WS topic subscriptions
- [ ] **UX-02**: TuyaCard displays LastUpdated timestamp
- [ ] **UX-03**: RaspiCard displays LastUpdated timestamp

## Future Requirements

None — all scoped features included in this milestone.

## Out of Scope

- Tuya device discovery/pairing (handled by tinytuya CLI on server side)
- Tuya firmware updates
- Tuya scenes/automation (not in API docs)
- WS topic for devices not in HA proxy (no new providers beyond documented)

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| (filled by roadmapper) | | | |
