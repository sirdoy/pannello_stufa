# Requirements: Pannello Stufa

**Defined:** 2026-03-22
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v14.1 Requirements

Requirements for Tech Debt & Type Safety milestone. Each maps to roadmap phases.

### Known Issues

- [ ] **ISSUE-01**: Debug panel HueTab `bridgeConnected` field name corrected to `connected`
- [ ] **ISSUE-02**: Debug panel HueTab `brightness` key corrected to `bri`
- [ ] **ISSUE-03**: `staleness.cachedAt` always null for stove — dead code removed
- [ ] **ISSUE-04**: `UseStoveDataReturn.status` typed as `StoveState` union instead of `string`
- [ ] **ISSUE-05**: CopyableIp uses design system Button instead of plain `<button>`
- [ ] **ISSUE-06**: FormModal isolation flake diagnosed and fixed

### Type Safety (lib/)

- [ ] **TYPE-01**: `adminDbGet()` calls return typed values instead of `as any` casts
- [ ] **TYPE-02**: `navigator.connection` typed with Network Information API interface
- [ ] **TYPE-03**: `Notification.maxActions` typed with proper type guard
- [ ] **TYPE-04**: `useRoomStatus` room data typed instead of `as any[]`
- [ ] **TYPE-05**: `unifiedDeviceConfigService` meta access typed instead of `as any`
- [ ] **TYPE-06**: `firebaseAdmin.ts` error/preferences casts typed properly

### Type Safety (app/ components)

- [ ] **TYPE-07**: Component `icon` prop casts (`<X /> as any`) eliminated with proper typing
- [ ] **TYPE-08**: Component spread patterns (`{...({} as any)}`) eliminated
- [ ] **TYPE-09**: `variant` prop casts eliminated with proper union types
- [ ] **TYPE-10**: `DeviceCard` banner/action/toast prop types aligned
- [ ] **TYPE-11**: `TransitionLink` `usePageTransition()` return typed
- [ ] **TYPE-12**: `ControlButton` `_warned` property typed properly

### Type Safety (app/ routes & pages)

- [ ] **TYPE-13**: Scheduler route `adminDbGet` calls typed with specific interfaces
- [ ] **TYPE-14**: Netatmo homestatus `modulesFromTopology` typed for battery functions
- [ ] **TYPE-15**: Weather forecast route response typed instead of `as any`
- [ ] **TYPE-16**: Thermostat/stove page prop casts eliminated
- [ ] **TYPE-17**: `sw.ts` browser API casts typed with proper interfaces

### Dead Code & Cleanup

- [ ] **CLEAN-01**: 48 unused utility exports removed (identified by knip)
- [ ] **CLEAN-02**: TODO in `notificationService.ts` resolved (migrate cleanup to API route)
- [ ] **CLEAN-03**: TODO in `healthMonitoring.ts` resolved (stove STARTING grace period tracking)

## Future Requirements

None — this is a cleanup milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Test file `as any` cleanup (~309 occurrences) | Test mocks legitimately need type casting; diminishing returns |
| Design system barrel unused exports (131) | Intentional public API surface for component library |
| 3 Netatmo routes without frontend consumer | By design — API infrastructure for future UI |
| DataTable 5x useMemo | Intentional exception — TanStack Table requires stable refs |
| Worker teardown warning | React 19 cosmetic, not actionable |
| iOS notification category verification | Requires physical device testing, not code change |
| Consent middleware enforcement | Architecture change, not tech debt — separate milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ISSUE-01 | Phase 113 | Pending |
| ISSUE-02 | Phase 113 | Pending |
| ISSUE-03 | Phase 113 | Pending |
| ISSUE-04 | Phase 113 | Pending |
| ISSUE-05 | Phase 113 | Pending |
| ISSUE-06 | Phase 113 | Pending |
| TYPE-01 | Phase 114 | Pending |
| TYPE-02 | Phase 114 | Pending |
| TYPE-03 | Phase 114 | Pending |
| TYPE-04 | Phase 114 | Pending |
| TYPE-05 | Phase 114 | Pending |
| TYPE-06 | Phase 114 | Pending |
| TYPE-07 | Phase 115 | Pending |
| TYPE-08 | Phase 115 | Pending |
| TYPE-09 | Phase 115 | Pending |
| TYPE-10 | Phase 115 | Pending |
| TYPE-11 | Phase 115 | Pending |
| TYPE-12 | Phase 115 | Pending |
| TYPE-13 | Phase 116 | Pending |
| TYPE-14 | Phase 116 | Pending |
| TYPE-15 | Phase 116 | Pending |
| TYPE-16 | Phase 116 | Pending |
| TYPE-17 | Phase 116 | Pending |
| CLEAN-01 | Phase 117 | Pending |
| CLEAN-02 | Phase 117 | Pending |
| CLEAN-03 | Phase 117 | Pending |

**Coverage:**
- v14.1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 — traceability filled by roadmap creation*
