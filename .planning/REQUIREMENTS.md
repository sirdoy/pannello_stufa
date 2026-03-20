# Requirements: Pannello Stufa

**Defined:** 2026-03-20
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v14.0 Requirements

Requirements for Hue Proxy Migration. Each maps to roadmap phases.

### Proxy Client

- [ ] **CLIENT-01**: Hue proxy client uses shared haGet/haPost transport (X-API-Key auth)
- [ ] **CLIENT-02**: TypeScript types for all proxy response interfaces (HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryItem)
- [ ] **CLIENT-03**: Convenience wrappers for each endpoint (getLights, getGroups, getScenes, getHealth, getHistory)

### Read Endpoints

- [ ] **READ-01**: GET /lights migrated with capability_tier, ct_kelvin, room enrichment
- [ ] **READ-02**: GET /lights/{light_id} migrated
- [ ] **READ-03**: GET /groups migrated with member lights array
- [ ] **READ-04**: GET /groups/{group_id} migrated
- [ ] **READ-05**: GET /scenes migrated with group_id filter support
- [ ] **READ-06**: GET /health migrated with data_freshness (LIVE/STALE/UNREACHABLE→503)
- [ ] **READ-07**: GET /history migrated with auto-granularity pagination

### Control Endpoints

- [ ] **CMD-01**: PUT /lights/{light_id}/state via proxy (202 Accepted, v1 body format)
- [ ] **CMD-02**: PUT /groups/{group_id}/action via proxy (202 Accepted)
- [ ] **CMD-03**: POST /groups/{group_id}/scenes/{scene_id} via proxy (202 Accepted)
- [ ] **CMD-04**: Frontend handles 409 Conflict for unreachable lights

### Frontend

- [ ] **UI-01**: useLightsData reads proxy response shapes (flat format, capability_tier)
- [ ] **UI-02**: useLightsCommands sends v1 body format (on/bri/ct instead of nested objects)
- [ ] **UI-03**: Brightness conversion 0-100% ↔ 0-254 at client boundary
- [ ] **UI-04**: Scene activate uses new path pattern (POST /groups/{gid}/scenes/{sid})
- [ ] **UI-05**: 202 Accepted + suggested_poll_delay_s drives delayed refresh
- [ ] **UI-06**: data_freshness replaces custom staleness/connection checks

### Cleanup

- [ ] **CLEAN-01**: CLIP v2 local API client deleted (hueApi.ts)
- [ ] **CLEAN-02**: v1 remote/cloud API client deleted (hueRemoteApi.ts)
- [ ] **CLEAN-03**: Connection strategy deleted (hueConnectionStrategy.ts)
- [ ] **CLEAN-04**: Bridge discovery and pairing routes deleted
- [ ] **CLEAN-05**: OAuth token management deleted (hueRemoteTokenHelper.ts)
- [ ] **CLEAN-06**: Firebase bridge credentials persistence deleted (hueLocalHelper.ts)
- [ ] **CLEAN-07**: Hue-specific env vars removed (HUE_CLIENT_SECRET, NEXT_PUBLIC_HUE_CLIENT_ID, NEXT_PUBLIC_HUE_APP_ID)

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
| CLIENT-01 | Phase 106 | Pending |
| CLIENT-02 | Phase 106 | Pending |
| CLIENT-03 | Phase 106 | Pending |
| READ-01 | Phase 106 | Pending |
| READ-02 | Phase 106 | Pending |
| READ-03 | Phase 106 | Pending |
| READ-04 | Phase 106 | Pending |
| READ-05 | Phase 106 | Pending |
| READ-06 | Phase 106 | Pending |
| READ-07 | Phase 106 | Pending |
| CMD-01 | Phase 107 | Pending |
| CMD-02 | Phase 107 | Pending |
| CMD-03 | Phase 107 | Pending |
| CMD-04 | Phase 107 | Pending |
| UI-01 | Phase 108 | Pending |
| UI-02 | Phase 108 | Pending |
| UI-03 | Phase 108 | Pending |
| UI-04 | Phase 108 | Pending |
| UI-05 | Phase 108 | Pending |
| UI-06 | Phase 108 | Pending |
| CLEAN-01 | Phase 109 | Pending |
| CLEAN-02 | Phase 109 | Pending |
| CLEAN-03 | Phase 109 | Pending |
| CLEAN-04 | Phase 109 | Pending |
| CLEAN-05 | Phase 109 | Pending |
| CLEAN-06 | Phase 109 | Pending |
| CLEAN-07 | Phase 109 | Pending |

**Coverage:**
- v14.0 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 — traceability complete after roadmap creation*
