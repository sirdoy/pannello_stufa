# Requirements: Pannello Stufa

**Defined:** 2026-03-20
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v14.0 Requirements

Requirements for Hue Proxy Migration. Each maps to roadmap phases.

### Proxy Client

- [x] **CLIENT-01**: Hue proxy client uses shared haGet/haPost transport (X-API-Key auth)
- [x] **CLIENT-02**: TypeScript types for all proxy response interfaces (HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryItem)
- [x] **CLIENT-03**: Convenience wrappers for each endpoint (getLights, getGroups, getScenes, getHealth, getHistory)

### Read Endpoints

- [x] **READ-01**: GET /lights migrated with capability_tier, ct_kelvin, room enrichment
- [x] **READ-02**: GET /lights/{light_id} migrated
- [x] **READ-03**: GET /groups migrated with member lights array
- [x] **READ-04**: GET /groups/{group_id} migrated
- [x] **READ-05**: GET /scenes migrated with group_id filter support
- [x] **READ-06**: GET /health migrated with data_freshness (LIVE/STALE/UNREACHABLE→503)
- [x] **READ-07**: GET /history migrated with auto-granularity pagination

### Control Endpoints

- [x] **CMD-01**: PUT /lights/{light_id}/state via proxy (202 Accepted, v1 body format)
- [x] **CMD-02**: PUT /groups/{group_id}/action via proxy (202 Accepted)
- [x] **CMD-03**: POST /groups/{group_id}/scenes/{scene_id} via proxy (202 Accepted)
- [x] **CMD-04**: Frontend handles 409 Conflict for unreachable lights

### Frontend

- [x] **UI-01**: useLightsData reads proxy response shapes (flat format, capability_tier)
- [x] **UI-02**: useLightsCommands sends v1 body format (on/bri/ct instead of nested objects)
- [x] **UI-03**: Brightness conversion 0-100% ↔ 0-254 at client boundary
- [x] **UI-04**: Scene activate uses new path pattern (POST /groups/{gid}/scenes/{sid})
- [x] **UI-05**: 202 Accepted + suggested_poll_delay_s drives delayed refresh
- [x] **UI-06**: data_freshness replaces custom staleness/connection checks

### Cleanup

- [x] **CLEAN-01**: CLIP v2 local API client deleted (hueApi.ts)
- [x] **CLEAN-02**: v1 remote/cloud API client deleted (hueRemoteApi.ts)
- [x] **CLEAN-03**: Connection strategy deleted (hueConnectionStrategy.ts)
- [x] **CLEAN-04**: Bridge discovery and pairing routes deleted
- [x] **CLEAN-05**: OAuth token management deleted (hueRemoteTokenHelper.ts)
- [x] **CLEAN-06**: Firebase bridge credentials persistence deleted (hueLocalHelper.ts)
- [x] **CLEAN-07**: Hue-specific env vars removed (HUE_CLIENT_SECRET, NEXT_PUBLIC_HUE_CLIENT_ID, NEXT_PUBLIC_HUE_APP_ID)

## Future Requirements

### Scene CRUD (deferred — proxy endpoints planned but not yet implemented)

- **SCENE-01**: User can create a new scene on the Bridge
- **SCENE-02**: User can update scene name or light states
- **SCENE-03**: User can delete a scene from the Bridge

## Out of Scope

| Feature | Reason |
|---------|--------|
| Scene CRUD migration | Proxy endpoints marked as "planned" — not yet available |
| Sonos integration | Separate milestone (v15.0+) |
| Hue CLIP v2 API via proxy | Proxy uses v1 (CLIP v1) — simpler, sufficient |
| Bridge discovery via proxy | Proxy handles Bridge connection directly |
| Remote/cloud API via proxy | Proxy eliminates need for cloud access |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLIENT-01 | Phase 106 | Complete |
| CLIENT-02 | Phase 110 | Complete |
| CLIENT-03 | Phase 106 | Complete |
| READ-01 | Phase 106 | Complete |
| READ-02 | Phase 106 | Complete |
| READ-03 | Phase 110 | Complete |
| READ-04 | Phase 106 | Complete |
| READ-05 | Phase 106 | Complete |
| READ-06 | Phase 106 | Complete |
| READ-07 | Phase 106 | Complete |
| CMD-01 | Phase 110 | Complete |
| CMD-02 | Phase 110 | Complete |
| CMD-03 | Phase 110 | Complete |
| CMD-04 | Phase 107 | Complete |
| UI-01 | Phase 110 | Complete |
| UI-02 | Phase 110 | Complete |
| UI-03 | Phase 108 | Complete |
| UI-04 | Phase 110 | Complete |
| UI-05 | Phase 108 | Complete |
| UI-06 | Phase 108 | Complete |
| CLEAN-01 | Phase 109 | Complete |
| CLEAN-02 | Phase 109 | Complete |
| CLEAN-03 | Phase 109 | Complete |
| CLEAN-04 | Phase 110 | Complete |
| CLEAN-05 | Phase 110 | Complete |
| CLEAN-06 | Phase 110 | Complete |
| CLEAN-07 | Phase 109 | Complete |

**Coverage:**
- v14.0 requirements: 27 total
- Satisfied: 27
- Pending: 0
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-21 — All 27 requirements satisfied, checkboxes synced per audit*
