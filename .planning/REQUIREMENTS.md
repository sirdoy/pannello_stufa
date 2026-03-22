# Requirements: Pannello Stufa

**Defined:** 2026-03-22
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v15.0 Requirements

Requirements for Rooms & Device Registry milestone. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Proxy client per Device Registry API con haGet/haPost transport
- [x] **INFRA-02**: TypeScript types per tutte le interfacce Device Registry (DeviceType, RegistryDevice, RegistryHealth)
- [ ] **INFRA-03**: Proxy client per Rooms API con haGet/haPost/haPut/haDelete transport
- [ ] **INFRA-04**: TypeScript types per tutte le interfacce Rooms (Room, DeviceAssignment, RoomStatus, HouseStatus, RoomsHealth)
- [ ] **INFRA-05**: Next.js API routes per Device Registry (8 endpoint proxy)
- [ ] **INFRA-06**: Next.js API routes per Rooms (11 endpoint proxy)

### Device Types

- [ ] **DTYPE-01**: User can view list of all device types (built-in + custom)
- [ ] **DTYPE-02**: User can create a custom device type with slug and label
- [ ] **DTYPE-03**: User can delete a custom device type (built-in protected)

### Device Registry

- [ ] **DREG-01**: User can view paginated list of registered devices
- [ ] **DREG-02**: User can filter device list by provider
- [ ] **DREG-03**: User can register a new device (provider, device_id, name, type)
- [ ] **DREG-04**: User can update device name and type
- [ ] **DREG-05**: User can unregister a device with confirmation
- [ ] **DREG-06**: User can view registry health stats (type count, device count)

### Room Management

- [ ] **ROOM-01**: User can view list of all rooms with device counts
- [ ] **ROOM-02**: User can create a new room with name and description
- [ ] **ROOM-03**: User can edit room name and description
- [ ] **ROOM-04**: User can delete a room with confirmation
- [ ] **ROOM-05**: User can view devices assigned to a room
- [ ] **ROOM-06**: User can assign a device to a room (implicit move from previous room)
- [ ] **ROOM-07**: User can remove a device from a room

### Room Status

- [ ] **RSTAT-01**: User can view aggregated device status for a single room
- [ ] **RSTAT-02**: User can view whole-house status (all rooms with device status)
- [ ] **RSTAT-03**: User can view rooms health stats (room count, device count, orphan count)

## Future Requirements

### Automations

- **AUTO-01**: User can create automation rules with triggers and actions
- **AUTO-02**: User can view automation execution history

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auth frontend (login, API key management) | Auth0 handles login; X-API-Key used server-side — no user-facing auth UI needed for v15.0 |
| Automations API frontend | Separate milestone — API exists but deferred |
| Sonos/DIRIGERA frontend | Existing API docs but separate scope from rooms/registry |
| Real-time WebSocket updates | Backend uses REST polling; WebSocket not available |
| Room floor plan / visual layout | Complexity beyond scope — list/card views sufficient |
| Drag-and-drop device assignment | Standard select/button UI sufficient for v15.0 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 118 | Complete |
| INFRA-02 | Phase 118 | Complete |
| INFRA-03 | Phase 119 | Pending |
| INFRA-04 | Phase 119 | Pending |
| INFRA-05 | Phase 118 | Pending |
| INFRA-06 | Phase 119 | Pending |
| DTYPE-01 | Phase 120 | Pending |
| DTYPE-02 | Phase 120 | Pending |
| DTYPE-03 | Phase 120 | Pending |
| DREG-01 | Phase 121 | Pending |
| DREG-02 | Phase 121 | Pending |
| DREG-03 | Phase 121 | Pending |
| DREG-04 | Phase 121 | Pending |
| DREG-05 | Phase 121 | Pending |
| DREG-06 | Phase 121 | Pending |
| ROOM-01 | Phase 122 | Pending |
| ROOM-02 | Phase 122 | Pending |
| ROOM-03 | Phase 122 | Pending |
| ROOM-04 | Phase 122 | Pending |
| ROOM-05 | Phase 123 | Pending |
| ROOM-06 | Phase 123 | Pending |
| ROOM-07 | Phase 123 | Pending |
| RSTAT-01 | Phase 124 | Pending |
| RSTAT-02 | Phase 124 | Pending |
| RSTAT-03 | Phase 124 | Pending |

**Coverage:**
- v15.0 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 — traceability filled after roadmap creation*
