# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- ✅ **v6.0 Operations, PWA & Analytics** — Phases 49-54 (shipped 2026-02-11)
- ✅ **v7.0 Performance & Resilience** — Phases 55-60 (shipped 2026-02-13)
- ✅ **v8.0 Fritz!Box Network Monitor** — Phases 61-67 (shipped 2026-02-16)
- ✅ **v8.1 Masonry Dashboard** — Phases 68-69 (shipped 2026-02-18)
- ✅ **v9.0 Performance Optimization** — Phases 70-74 (shipped 2026-02-19)
- ✅ **v10.0 Netatmo API Migration** — Phases 75-83 (shipped 2026-03-16)
- ✅ **v11.0 API Unification & Raspberry Pi Monitor** — Phases 84-91 (shipped 2026-03-18)
- ✅ **v11.1 Test Suite & Tech Debt Cleanup** — Phases 92-95 (shipped 2026-03-18)
- ✅ **v12.0 Data Fetching Simplification & E2E Verification** — Phases 96-98 (shipped 2026-03-19)
- ✅ **v13.0 Thermorossi Proxy Migration** — Phases 99-105 (shipped 2026-03-20)
- ✅ **v14.0 Hue Proxy Migration** — Phases 106-112 (shipped 2026-03-22)
- ✅ **v14.1 Tech Debt & Type Safety** — Phases 113-117 (shipped 2026-03-22)
- 🚧 **v15.0 Rooms & Device Registry** — Phases 118-124 (in progress)

## Phases

<details>
<summary>✅ v14.1 Tech Debt & Type Safety (Phases 113-117) — SHIPPED 2026-03-22</summary>

- [x] Phase 113: Known Issues Fix (1/1 plan) — completed 2026-03-22
- [x] Phase 114: Type Safety lib/ (2/2 plans) — completed 2026-03-22
- [x] Phase 115: Type Safety app/ Components (2/2 plans) — completed 2026-03-22
- [x] Phase 116: Type Safety app/ Routes & Pages (2/2 plans) — completed 2026-03-22
- [x] Phase 117: Dead Code & Cleanup (2/2 plans) — completed 2026-03-22

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v14.0)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v15.0 Rooms & Device Registry (In Progress)

**Milestone Goal:** Users can manage a persistent device registry (types and registered devices per provider) and organize devices into rooms, with aggregated status views per room and whole-house.

#### Phase Summary

- [x] **Phase 118: Registry Infrastructure** - Proxy client, TypeScript types, and API routes for Device Registry (completed 2026-03-22)
- [x] **Phase 119: Rooms Infrastructure** - Proxy client, TypeScript types, and API routes for Rooms (completed 2026-03-23)
- [x] **Phase 120: Device Types UI** - Page to view, create, and delete device types (completed 2026-03-23)
- [x] **Phase 121: Device Registry UI** - Page to view, filter, register, update, and unregister devices (completed 2026-03-23)
- [ ] **Phase 122: Room Management UI** - Page to create, edit, and delete rooms
- [ ] **Phase 123: Room Device Assignment** - UI to view, assign, and remove devices within rooms
- [ ] **Phase 124: Room Status Views** - Per-room status, whole-house status, and health stats

## Phase Details

### Phase 118: Registry Infrastructure
**Goal**: The Device Registry backend is fully accessible from Next.js via typed proxy functions and API routes
**Depends on**: Phase 117 (shared haGet/haPost transport already in lib/api/haClient.ts)
**Requirements**: INFRA-01, INFRA-02, INFRA-05
**Success Criteria** (what must be TRUE):
  1. A typed proxy module exists for the Device Registry API using haGet/haPost transport with X-API-Key auth
  2. All DeviceType, RegistryDevice, and RegistryHealth TypeScript interfaces are defined and exported
  3. All 8 Device Registry endpoint proxy routes exist under /api/ and return typed responses
  4. TypeScript compiles with zero errors for all new files
**Plans:** 2/2 plans complete

Plans:
- [x] 118-01: registryProxy.ts + TypeScript interfaces
- [x] 118-02: Next.js API route proxies for all 8 Device Registry endpoints

### Phase 119: Rooms Infrastructure
**Goal**: The Rooms backend is fully accessible from Next.js via typed proxy functions and API routes
**Depends on**: Phase 118 (established Registry infra pattern to follow)
**Requirements**: INFRA-03, INFRA-04, INFRA-06
**Success Criteria** (what must be TRUE):
  1. A typed proxy module exists for the Rooms API using haGet/haPost/haPut/haDelete transport
  2. All Room, DeviceAssignment, RoomStatus, HouseStatus, and RoomsHealth TypeScript interfaces are defined and exported
  3. All 11 Rooms endpoint proxy routes exist under /api/ and return typed responses
  4. TypeScript compiles with zero errors for all new files
**Plans:** 2/2 plans complete

Plans:
- [x] 119-01: roomsProxy.ts + TypeScript interfaces
- [x] 119-02: Next.js API route proxies for all 11 Rooms endpoints

### Phase 120: Device Types UI
**Goal**: Users can view and manage device type definitions (built-in and custom) from a dedicated page
**Depends on**: Phase 118 (Registry API routes required)
**Requirements**: DTYPE-01, DTYPE-02, DTYPE-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to a Device Types page and see all built-in and custom types listed
  2. User can fill a form and submit to create a new custom device type with slug and label
  3. User can delete a custom device type after a confirmation dialog; built-in types show no delete option
  4. Creating or deleting a type refreshes the list without a full page reload
**Plans:** 1/1 plans complete

Plans:
- [x] 120-01-PLAN.md — Device Types page with useDeviceTypes hook, DataTable list, FormModal create, ConfirmationDialog delete + unit tests

### Phase 121: Device Registry UI
**Goal**: Users can see all registered devices and perform full CRUD operations from a dedicated page
**Depends on**: Phase 120 (device type list needed for register/update forms)
**Requirements**: DREG-01, DREG-02, DREG-03, DREG-04, DREG-05, DREG-06
**Success Criteria** (what must be TRUE):
  1. User can see a paginated table of all registered devices with provider, name, type, and device_id columns
  2. User can filter the device list by provider and see only matching devices
  3. User can open a register form, fill provider/device_id/name/type, and submit to add a new device
  4. User can edit a device's name and type inline or via modal, and see the updated values reflected
  5. User can unregister a device after a confirmation dialog, and the device disappears from the list
  6. Registry health stats (type count, device count) are visible on the page
**Plans:** 2/2 plans complete

Plans:
- [x] 121-01: useRegistryDevices hook + Device Registry page (list, filter, health stats)
- [x] 121-02: Register, update, and unregister device actions (forms + confirmation)

### Phase 122: Room Management UI
**Goal**: Users can create, rename, and delete rooms from a dedicated rooms management page
**Depends on**: Phase 119 (Rooms API routes required)
**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-04
**Success Criteria** (what must be TRUE):
  1. User can navigate to a Rooms page and see all rooms listed with their device counts
  2. User can create a new room by entering a name and optional description, and it appears in the list
  3. User can edit a room's name and description via an inline form or modal, and see updated values
  4. User can delete a room after a confirmation dialog; the room disappears from the list
**Plans:** 2 plans

Plans:
- [ ] 122-01-PLAN.md — useRooms + useRoomsHealth hooks, DataTable listing, loading/error/empty states, health stats
- [ ] 122-02-PLAN.md — Create, edit, delete room actions with FormModal, ConfirmationDialog, Zod validation

### Phase 123: Room Device Assignment
**Goal**: Users can view devices within a room and assign or remove devices to organize their smart home
**Depends on**: Phase 122 (rooms must exist) and Phase 121 (registered devices must exist)
**Requirements**: ROOM-05, ROOM-06, ROOM-07
**Success Criteria** (what must be TRUE):
  1. User can open a room and see all devices currently assigned to it
  2. User can assign a device (from the registered device list) to a room via a select or modal; if the device was in another room, it moves automatically
  3. User can remove a device from a room, and it no longer appears in that room's device list
**Plans:** 2 plans

Plans:
- [ ] 123-01: Room detail view with device assignment and removal UI

### Phase 124: Room Status Views
**Goal**: Users can see aggregated live device status per room and a whole-house overview from a single view
**Depends on**: Phase 123 (rooms must have devices assigned to show meaningful status)
**Requirements**: RSTAT-01, RSTAT-02, RSTAT-03
**Success Criteria** (what must be TRUE):
  1. User can select a room and see aggregated status for all devices in that room (online/offline, last-seen)
  2. User can see a whole-house view showing all rooms with their device statuses in one page
  3. Rooms health stats (room count, device count, orphan count) are visible on the status page
**Plans:** 2 plans

Plans:
- [ ] 124-01: useRoomStatus + useHouseStatus hooks + Room Status page with health stats

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-117 | v1.0-v14.1 | 407/407 | Complete | 2026-03-22 |
| 118. Registry Infrastructure | v15.0 | 2/2 | Complete    | 2026-03-22 |
| 119. Rooms Infrastructure | v15.0 | 2/2 | Complete    | 2026-03-23 |
| 120. Device Types UI | v15.0 | 1/1 | Complete    | 2026-03-23 |
| 121. Device Registry UI | v15.0 | 2/2 | Complete    | 2026-03-23 |
| 122. Room Management UI | v15.0 | 0/2 | Not started | - |
| 123. Room Device Assignment | v15.0 | 0/1 | Not started | - |
| 124. Room Status Views | v15.0 | 0/1 | Not started | - |

**Total:** 20 milestones shipped + 1 in progress, 117 phases complete, 407 plans executed.

---

*Roadmap updated: 2026-03-23 — Phase 122 plans created*
