# Requirements: Pannello Stufa v3.1

**Defined:** 2026-01-30
**Core Value:** 100% design system compliance - every UI element uses design system components

## v3.1 Requirements

Requirements for design system compliance milestone. Each maps to roadmap phases.

### StoveCard Compliance

- [ ] **STOVE-01**: StoveCard uses Button component for scheduler mode buttons (replace raw `<button>`)
- [ ] **STOVE-02**: StoveCard uses Button component for "Torna in Automatico" action
- [ ] **STOVE-03**: StoveCard `getStatusInfo()` refactored to use CVA status variants
- [ ] **STOVE-04**: StoveCard status display uses standardized StatusCard or Badge components

### ThermostatCard Compliance

- [ ] **THERM-01**: ThermostatCard uses Button component for mode selection grid (replace raw `<button>`)
- [ ] **THERM-02**: ThermostatCard uses Button component for calibrate action (replace raw `<button>`)
- [ ] **THERM-03**: ThermostatCard mode buttons use consistent ButtonGroup or variant pattern
- [ ] **THERM-04**: ThermostatCard temperature display uses standardized component pattern

### LightsCard Compliance

- [ ] **LIGHT-01**: LightsCard uses Slider component (replace raw `<input type="range">`)
- [ ] **LIGHT-02**: LightsCard uses Button component for scene buttons (replace raw `<button>`)
- [ ] **LIGHT-03**: LightsCard adaptive styling refactored to use CVA variants
- [ ] **LIGHT-04**: LightsCard brightness panel uses standardized component pattern

### CameraCard Compliance

- [ ] **CAM-01**: CameraCard uses Button component for all interactive elements
- [ ] **CAM-02**: EventPreviewModal uses Button component for close/navigation buttons
- [ ] **CAM-03**: HlsPlayer uses Button component for player controls

### Thermostat Page Compliance

- [ ] **PAGE-01**: Thermostat page mode buttons use Button component variants (not raw buttons)
- [ ] **PAGE-02**: Thermostat page info boxes use standardized component or InfoBox
- [ ] **PAGE-03**: Thermostat page uses PageLayout wrapper for consistency

### Verification

- [ ] **VERIFY-01**: All device cards pass ESLint (no hard-coded colors)
- [ ] **VERIFY-02**: All raw `<button>` elements eliminated from device components
- [ ] **VERIFY-03**: All raw `<input>` elements eliminated from device components
- [ ] **VERIFY-04**: Visual consistency verified across all device cards

## Out of Scope

| Feature | Reason |
|---------|--------|
| Advanced components (Tabs, Accordion) | Different milestone focus - this is compliance, not new features |
| Form validation library | Different milestone focus |
| Animation library | Different milestone focus |
| New component development | Only using existing v3.0 components |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STOVE-01 | Phase 19 | Pending |
| STOVE-02 | Phase 19 | Pending |
| STOVE-03 | Phase 19 | Pending |
| STOVE-04 | Phase 19 | Pending |
| THERM-01 | Phase 20 | Pending |
| THERM-02 | Phase 20 | Pending |
| THERM-03 | Phase 20 | Pending |
| THERM-04 | Phase 20 | Pending |
| LIGHT-01 | Phase 21 | Pending |
| LIGHT-02 | Phase 21 | Pending |
| LIGHT-03 | Phase 21 | Pending |
| LIGHT-04 | Phase 21 | Pending |
| CAM-01 | Phase 22 | Pending |
| CAM-02 | Phase 22 | Pending |
| CAM-03 | Phase 22 | Pending |
| PAGE-01 | Phase 23 | Pending |
| PAGE-02 | Phase 23 | Pending |
| PAGE-03 | Phase 23 | Pending |
| VERIFY-01 | Phase 24 | Pending |
| VERIFY-02 | Phase 24 | Pending |
| VERIFY-03 | Phase 24 | Pending |
| VERIFY-04 | Phase 24 | Pending |

**Coverage:**
- v3.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after roadmap creation*
