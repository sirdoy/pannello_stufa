# Requirements: Pannello Stufa v18.0

**Defined:** 2026-04-01
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v18.0 Requirements

Requirements for Dark-Only & Mobile-First milestone.

### Theme Removal

- [ ] **THEME-01**: Light theme CSS variables removed from globals.css (html:not(.dark) block, light body gradient)
- [ ] **THEME-02**: ThemeContext, ThemeProvider, useTheme hook removed
- [ ] **THEME-03**: ThemeScript component removed from layout
- [ ] **THEME-04**: Theme settings page (/settings/theme) removed and nav entry deleted
- [ ] **THEME-05**: Theme API route (GET/POST /api/user/theme) removed
- [ ] **THEME-06**: All `dark:` Tailwind prefixes removed from ~16 files (hardcode dark-only values)
- [ ] **THEME-07**: All `[html:not(.dark)_&]:` selectors removed from components
- [ ] **THEME-08**: `class="dark"` hardcoded on `<html>` element, localStorage theme key removed
- [ ] **THEME-09**: theme-color meta tag hardcoded to dark value (#0f172a)
- [ ] **THEME-10**: Design system page updated to reflect dark-only (remove theme toggle showcase)

### Design System Mobile-First

- [ ] **MOBILE-01**: ButtonGroup component wraps responsively on 375px (flex-wrap)
- [ ] **MOBILE-02**: All DS components verified at 375px viewport width
- [ ] **MOBILE-03**: DS typography scales appropriately for mobile (no horizontal overflow)
- [ ] **MOBILE-04**: DS spacing tokens documented as mobile-first (base = mobile, sm: = desktop)
- [ ] **MOBILE-05**: Design system showcase page (/debug/design-system) updated with mobile-first patterns
- [ ] **MOBILE-06**: Bottom nav bar safe at 375px (4-column grid verified or adjusted)

### Pages Mobile Audit

- [ ] **AUDIT-01**: Dashboard home page (/) verified and fixed at 375px
- [ ] **AUDIT-02**: Stove pages (/stove, /stove/errors, /stove/maintenance, /stove/scheduler) verified at 375px
- [ ] **AUDIT-03**: Thermostat pages (/thermostat, /thermostat/schedule) verified at 375px
- [ ] **AUDIT-04**: Lights pages (/lights, /lights/scenes, /lights/automation) verified at 375px
- [ ] **AUDIT-05**: Network page (/network) verified at 375px
- [ ] **AUDIT-06**: Sonos page (/sonos) verified at 375px
- [ ] **AUDIT-07**: DIRIGERA page (/dirigera) verified at 375px
- [ ] **AUDIT-08**: Raspi page (/raspi) verified at 375px
- [ ] **AUDIT-09**: Tuya page (/tuya) verified at 375px
- [ ] **AUDIT-10**: Rooms pages (/rooms, /rooms/status, /rooms/[id]) verified at 375px
- [ ] **AUDIT-11**: Registry pages (/registry/devices, /registry/types) verified at 375px
- [ ] **AUDIT-12**: Settings pages (all 7 settings sub-pages) verified at 375px
- [ ] **AUDIT-13**: Debug pages (/debug, /debug/api, /debug/logs, /debug/notifications) verified at 375px
- [ ] **AUDIT-14**: Camera pages (/camera, /camera/events) verified at 375px
- [ ] **AUDIT-15**: Remaining pages (changelog, offline, log) verified at 375px

## Future Requirements

### Tablet Design

- **TABLET-01**: Custom tablet breakpoint layout (900px+)
- **TABLET-02**: Tablet-specific navigation pattern
- **TABLET-03**: Multi-column layouts optimized for tablet

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tablet-specific design | Explicit future milestone, custom breakpoint already defined (900px) |
| New component variants | Only fix/adjust existing components for mobile, no new features |
| Animation redesign | Only fix layout, not redesign animations |
| New pages or features | Pure UI/CSS milestone, no functionality changes |
| Light theme preservation | User explicitly requested complete removal |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 149 | Pending |
| THEME-02 | Phase 149 | Pending |
| THEME-03 | Phase 149 | Pending |
| THEME-04 | Phase 149 | Pending |
| THEME-05 | Phase 149 | Pending |
| THEME-06 | Phase 150 | Pending |
| THEME-07 | Phase 150 | Pending |
| THEME-08 | Phase 149 | Pending |
| THEME-09 | Phase 149 | Pending |
| THEME-10 | Phase 150 | Pending |
| MOBILE-01 | Phase 151 | Pending |
| MOBILE-02 | Phase 151 | Pending |
| MOBILE-03 | Phase 151 | Pending |
| MOBILE-04 | Phase 151 | Pending |
| MOBILE-05 | Phase 151 | Pending |
| MOBILE-06 | Phase 151 | Pending |
| AUDIT-01 | Phase 152 | Pending |
| AUDIT-02 | Phase 152 | Pending |
| AUDIT-03 | Phase 152 | Pending |
| AUDIT-04 | Phase 152 | Pending |
| AUDIT-05 | Phase 152 | Pending |
| AUDIT-06 | Phase 153 | Pending |
| AUDIT-07 | Phase 153 | Pending |
| AUDIT-08 | Phase 153 | Pending |
| AUDIT-09 | Phase 153 | Pending |
| AUDIT-10 | Phase 153 | Pending |
| AUDIT-11 | Phase 154 | Pending |
| AUDIT-12 | Phase 154 | Pending |
| AUDIT-13 | Phase 154 | Pending |
| AUDIT-14 | Phase 154 | Pending |
| AUDIT-15 | Phase 154 | Pending |

**Coverage:**
- v18.0 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation*
