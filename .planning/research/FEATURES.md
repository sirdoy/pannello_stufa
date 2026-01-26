# Feature Landscape: Netatmo Schedule Management & Stove Monitoring

**Domain:** Smart Home PWA - Thermostat Control + Appliance Monitoring
**Researched:** 2026-01-26
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

This research examines standard features for thermostat schedule management (like Netatmo's official app) and stove monitoring capabilities. The goal is to provide complete Netatmo schedule control and comprehensive stove health monitoring without breaking existing v1.0 push notification infrastructure.

**Key Findings:**
- Netatmo schedule management requires CRUD operations on weekly schedules with time-temperature pairings
- Temporary overrides (manual boost) must NOT modify schedules - they are time-limited setpoint adjustments
- Stove monitoring focuses on health status, error detection, and performance metrics
- User expectations are set by Netatmo's official Home + Control app (2026)

---

## Table Stakes Features

Features users expect from Netatmo schedule management and stove monitoring. Missing these = product feels incomplete.

### Netatmo Schedule Management

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **View Current Schedule** | Users need to see active weekly schedule with all time/temp pairs | Medium | Netatmo API, parsing schedule format | Netatmo stores schedules as daily time slices with named temperature sets (Comfort/Eco/Night) |
| **Create New Schedule** | Users want custom schedules beyond defaults (Away, Home, Custom) | High | Form validation, time conflict detection | Must handle 7-day weekly structure with multiple periods per day |
| **Edit Existing Schedule** | Users need to adjust times/temperatures without recreating from scratch | High | Schedule modification API, conflict resolution | Official app uses mobile-only editing (WebApp read-only as of 2024) |
| **Delete Custom Schedule** | Users want to remove unused schedules | Low | Netatmo delete API | Cannot delete system schedules (Away, Comfort) |
| **Switch Active Schedule** | Users expect one-tap schedule switching (Home → Away → Custom) | Medium | Netatmo setThermMode API | Equivalent to official app's schedule picker |
| **Temporary Override (Manual Boost)** | Users need "set to 22°C for 3 hours" WITHOUT modifying schedule | Medium | Netatmo setpoint override with duration | Default 3h duration, configurable 5min-12h. Must NOT alter schedule. |
| **View Schedule Zones** | Multi-zone setups (valves) need per-room schedule visibility | High | Netatmo room/valve API | Official app shows room-by-room temperature targets |

### Stove Monitoring

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Current Health Status** | Users need at-a-glance "stove is OK/Warning/Critical" | Low | Existing `/api/stove/status` | Already partially implemented via error detection |
| **Error History Log** | Users want to see past errors with timestamps | Medium | Firebase error logging (already exists) | v1.0 has notification history - extend to stove-specific errors |
| **Connection Status** | Users need "stufa online/offline" indicator | Low | `/api/stove/status` timeout detection | Simple last-seen timestamp logic |
| **Operating Hours Tracker** | Users expect "45h since last cleaning" display | Low | Existing maintenance system | Already implemented in v1.0 (`docs/systems/maintenance.md`) |
| **Performance Metrics** | Users want flame level, pellet consumption, temperature readings | Medium | Parse stove API response | Thermorossi API provides detailed telemetry |
| **Maintenance Alerts** | Users expect visual warnings when cleaning needed | Low | Existing v1.0 maintenance banner | Already implemented in `StoveCard.js` (self-contained pattern) |

---

## Differentiators

Features that set this PWA apart from just using official Netatmo app or basic stove control. Not expected, but highly valued.

### Smart Integration Features

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Stove-Thermostat Coordination** | When stove ignites, temporarily boost Netatmo setpoint by +2°C for faster warmup | High | Netatmo override API, stove state tracking | USER EXPLICITLY REQUESTED: "stufa accende → override Netatmo setpoint temporarily (not modify schedule)" |
| **Unified Schedule Dashboard** | Single page showing both Netatmo schedule + stove scheduler side-by-side | Medium | Data aggregation from both systems | Saves context switching between device cards |
| **Schedule Conflict Detection** | Warn if stove scheduler overlaps with Netatmo schedule changes | Medium | Parse both schedules, detect time collisions | Prevents "stove heating while thermostat set to away mode" |
| **Energy Usage Correlation** | Show stove pellet consumption vs. Netatmo heating patterns | High | Historical data analysis, charting | Requires data retention period (30+ days) |
| **Voice of System** | Natural language summary: "Tomorrow: 7am heat to 20°C, stove auto-start at 6:30am" | Medium | Schedule parsing, UI text generation | Makes complex schedules human-readable |
| **Schedule Templates** | Pre-built templates: "Winter Weekdays", "Weekend Lazy", "Vacation Mode" | Medium | Template storage, schedule generation | Reduces friction for common scenarios |

### Advanced Monitoring

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Predictive Maintenance** | "Based on usage, cleaning needed in 3 days" | High | Historical data, ML/heuristics | Requires 90+ days operating data |
| **Performance Degradation Detection** | "Flame efficiency down 15% vs. baseline" | High | Baseline establishment, statistical analysis | Identifies issues before errors occur |
| **Health Score Dashboard** | Single 0-100 score combining all stove metrics | Medium | Scoring algorithm, data normalization | Easy mental model for non-technical users |
| **Notification Intelligence** | "You usually clean at 50h, send reminder at 45h next time?" | High | User behavior analysis, adaptive thresholds | Personalizes notifications over time |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in smart home integration projects.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Schedule Modification for Temporary Changes** | Netatmo's official behavior: temporary overrides (manual boost) do NOT modify schedules. Modifying schedule for "just today" creates permanent changes users forget about. | Use Netatmo's setpoint override with duration (5min-12h). Let schedule resume automatically after duration expires. |
| **Real-Time WebSocket for Stove Status** | Overkill complexity. Thermorossi API requires polling anyway. WebSocket adds server cost + connection management. | Continue existing 5-second polling pattern in `StoveCard.js`. Good enough for monitoring use case. |
| **In-App Schedule Editor with Visual Timeline** | Extremely complex UI (drag-drop, conflict resolution, responsive design). Official Netatmo app already does this well. | Provide CRUD operations via forms. Link to official app for visual editing: "For advanced editing, use Netatmo app". |
| **Duplicate Netatmo's Entire Feature Set** | Scope creep. This PWA focuses on unified control, not replacing official apps. | Pick 80/20 features: schedule switching, temporary overrides, viewing. Defer: geofencing, multi-home, advanced automation. |
| **Stove Remote Firmware Updates** | Dangerous. Thermorossi doesn't expose this API for safety reasons. Bricking stove via bad update = liability. | Monitor firmware version, notify user if update available, link to official Thermorossi resources. |
| **Historical Data Warehousing** | Requires BigQuery/data pipeline infrastructure. Overkill for single-user PWA. | Use Firebase Firestore 90-day retention (already implemented in v1.0). Defer advanced analytics to v3+. |
| **Netatmo Schedule Sync to Multiple Homes** | Netatmo accounts can have multiple homes. Managing multi-home scope adds 3x complexity. | Scope to single home (primary home) for v2.0. Defer multi-home support to v3+ if needed. |

---

## Feature Dependencies

**Critical Path for Schedule Management:**
```
1. Netatmo Token Refresh (already implemented v1.0)
   ↓
2. Fetch Schedules API
   ↓
3. Display Current Schedule (Read-Only)
   ↓
4. Schedule Switching (Change active schedule)
   ↓
5. Temporary Override (Manual boost)
   ↓
6. Create/Edit/Delete Schedules (Full CRUD)
```

**Critical Path for Stove Monitoring:**
```
1. Current Status Display (already implemented)
   ↓
2. Connection Status Indicator
   ↓
3. Error History from Firebase (extend v1.0 notification history)
   ↓
4. Performance Metrics Dashboard
   ↓
5. Maintenance Tracking (already implemented)
```

**Integration Dependency:**
```
Stove Ignition Event (existing scheduler)
   ↓
Detect Ignition in StoveCard polling
   ↓
Trigger Netatmo Temporary Override (+2°C for 2h)
   ↓
Log action to Firebase
   ↓
Send notification (v1.0 system) "Stove started, boosting thermostat"
```

**Architectural Constraints:**
- Netatmo schedule data must be cached in Firebase (avoid API rate limits)
- Cache invalidation on user-initiated edits
- Stove monitoring must NOT break existing 5s polling pattern
- All new features must respect existing device card self-contained pattern

---

## MVP Recommendation (v2.0 Scope)

### Must-Have (Phase 1-3)

**Netatmo Schedule - Read & Switch:**
1. View current active schedule (table format: day, time ranges, temperatures)
2. List all available schedules (default: Away, Home, Custom1, Custom2)
3. Switch active schedule (one-tap from dropdown)
4. Temporary override ("Boost to 22°C for 3 hours")

**Stove Monitoring - Enhanced Visibility:**
1. Connection status indicator (online/offline/last-seen)
2. Error history page (extend notification history, filter by stove errors)
3. Health status summary (OK/Warning/Critical with icon)
4. Performance metrics card (flame level, pellet rate, temps)

**Integration (Differentiator):**
1. Stove ignition → auto-boost Netatmo setpoint (+2°C, 2h duration)
2. Unified control page (stove + thermostat controls side-by-side)

### Defer to Post-MVP (v2.1+)

**Netatmo Schedule - Write Operations:**
- Create new custom schedule
- Edit existing schedule time/temp pairs
- Delete custom schedules
- Multi-zone schedule management

**Advanced Monitoring:**
- Predictive maintenance
- Performance degradation detection
- Health score dashboard
- Energy correlation analysis

**Rationale for Deferral:**
- Schedule editing is HIGH complexity (conflict detection, validation, multi-day UI)
- Official Netatmo app already provides excellent schedule editor
- Read + switch + temporary override covers 80% of daily use cases
- Can validate demand before investing in complex edit UI

---

## User Expectations: "Like Official App"

Based on Netatmo's Home + Control app (2026) research findings:

### What "Like Official App" Means

**Schedule Management:**
- See weekly schedule with named periods (Comfort 20°C, Eco 17°C, Night 15°C)
- Switch between saved schedules (typically 3-5 schedules per home)
- Set temporary override with duration picker (5min - 12h)
- Anticipation function: schedule shows target temperature + "starts heating 30min before"

**Multi-Room Support:**
- If user has Smart Radiator Valves, show per-room temperature targets
- Support individual valve schedule overrides
- Display "whole home" vs "this room only" controls

**Eco-Assist (Optional - defer):**
- Geofencing to reduce heating when away (requires location permission)
- "Nobody home" detection with auto-away mode
- This is advanced - official app took years to perfect this

### What Users DON'T Expect

- Real-time collaboration (multi-user editing same schedule simultaneously)
- Native mobile app performance (PWA has inherent latency)
- Offline schedule editing (requires API connection)
- Sub-15-minute schedule granularity (Netatmo uses 30min blocks)

---

## Implementation Notes

### Netatmo API Key Findings

From research + existing codebase:

**Available Endpoints:**
- `GET /api/homesdata` - Fetch all schedules, homes, rooms
- `POST /api/setroomthermpoint` - Temporary setpoint override
- `POST /api/setthermmode` - Switch active schedule (schedule_id parameter)
- `POST /api/switchhomeschedule` - Change schedule for entire home
- `POST /api/createnewhomeschedule` - Create custom schedule (complex payload)
- `POST /api/deletehomeschedule` - Remove custom schedule

**Token Management:**
- Already implemented in v1.0: `lib/netatmo/tokenHelper.js`
- Auto-refresh working, stores tokens in Firebase
- No changes needed for v2.0

**Rate Limiting:**
- Netatmo allows 50 requests/10 seconds per user
- Cache schedule data in Firebase (update every 5 minutes)
- Invalidate cache on user edit actions

### Stove API Key Findings

From project context + Thermorossi research:

**Thermorossi iControl Features:**
- Remote on/off control
- Check operating status and alarms
- Remote temperature adjustment
- Set operating hours on daily/weekly basis

**Available Data Points:**
- Status (ON/OFF/ERROR)
- Current temperature
- Target temperature
- Flame level (1-5)
- Pellet consumption rate
- Error codes (AL PE = pellets empty, etc.)
- Operating hours

**Alert Types:**
- AL PE: Temperature drop below 42°C (pellets empty)
- Connection lost (timeout after 30s no response)
- Critical errors (requires immediate action)

### UI/UX Patterns from Research

**Smart Thermostat Override Patterns:**
- **Temporary Hold** - Override until next scheduled period (most common)
- **Hold Until Time** - Override until user-specified time
- **Permanent Hold** - Override until manually cancelled (rare)

**Best Practice:** Default to temporary hold (until next schedule period). Provide "Hold Until" time picker as advanced option.

**Dashboard Visualization:**
- Use Recharts (already in project for v1.0 delivery trends)
- 7-day temperature history (Netatmo + stove correlation)
- Operating hours bar chart (weekly pattern)
- Error frequency over time (spike detection)

---

## Complexity Assessment

| Feature Category | Complexity | Estimated Effort | Risk Level |
|------------------|------------|------------------|------------|
| View schedules (read-only) | Medium | 2-3 plans | Low |
| Switch active schedule | Medium | 1-2 plans | Low |
| Temporary override | Medium | 2 plans | Medium (duration logic) |
| Create/edit schedules | High | 4-5 plans | High (validation, conflicts) |
| Multi-zone support | High | 3-4 plans | High (API complexity) |
| Stove monitoring dashboard | Medium | 2-3 plans | Low |
| Error history integration | Low | 1 plan | Low (extend v1.0) |
| Stove-Netatmo coordination | High | 3-4 plans | Medium (event detection) |
| Performance metrics | Medium | 2 plans | Low |

**Total Estimated Plans for MVP:** 12-15 plans
**Total Estimated Plans for Full Feature Set:** 25-30 plans

---

## Confidence Assessment

| Area | Confidence | Source | Notes |
|------|------------|--------|-------|
| Netatmo official features | HIGH | Netatmo helpcenter docs, Home + Control app release notes | Well-documented official sources |
| Schedule management UX | MEDIUM | WebSearch (community discussions, manufacturer docs) | Best practices established, but PWA-specific patterns require iteration |
| Temporary override behavior | HIGH | Official Netatmo documentation | Explicitly documented: manual boost ≠ schedule modification |
| Stove monitoring expectations | MEDIUM | Thermorossi iControl docs, pellet stove forums | Features documented, but user expectations vary |
| Integration patterns | LOW | Inference from project goals | Novel feature (stove-thermostat coordination) - user feedback will validate |
| Multi-zone complexity | MEDIUM | Netatmo API docs | API supports it, but UI patterns need research flag |

**Areas Needing Phase-Specific Research:**
- Phase N (Schedule Editor): UI/UX patterns for mobile schedule editing with conflict detection
- Phase N+1 (Multi-Zone): Best practices for displaying/controlling individual radiator valves
- Phase N+2 (Predictive Maintenance): Statistical models for pellet stove performance baseline

---

## Sources

**Netatmo Official Documentation:**
- [How to modify the weekly schedule](https://helpcenter.netatmo.com/hc/en-us/articles/360011029999-How-to-modify-the-weekly-schedule-how-to-apply-different-temperatures-room-by-room)
- [Management of weekly schedules in webapp](https://helpcenter.netatmo.com/hc/en-us/articles/20207602209938-Management-of-the-weekly-schedules-in-the-new-webapp)
- [Home + Control App announcement](https://helpcenter.netatmo.com/hc/en-us/articles/29359036428690-Home-Control-App-a-complete-new-experience-to-manage-your-heating-and-more)
- [Netatmo 2026 product launch (Matter support)](https://homekitnews.com/2026/01/23/netatmo-launches-new-thermostat-and-smart-radiator-valve-w-matter/)

**Thermostat Best Practices:**
- [Honeywell: Bypassing thermostat schedules](https://www.honeywellhome.com/blogs/support/how-do-i-bypass-the-schedule-on-the-th2210dh-th2110dh-th2210dv-th2110dv-thermostat)
- [Trane: Temporary override using Hold](https://support.tranehome.com/hc/en-us/articles/4403191244813-How-To-Temporarily-Override-Schedules-Using-Hold)

**Stove Monitoring:**
- [Thermorossi iControl remote monitoring](https://www.thermorossi.com/5/316/en/products/Extra/iControl)
- [Signs your pellet stove needs repair](https://www.hbenergy.com/blog/heating-service/signs-your-pellet-stove-needs-repair-what-to-look-for/)
- [Pellet stove health monitoring trends](https://www.blackmoosechimney.com/pellet-appliances-need-inspections-just-like-wood/)

**Smart Home Monitoring 2026:**
- [Smart home health monitoring trends](https://smarthomewizards.com/smart-home-trends-to-look-for/)
- [Home Assistant 2026.1 dashboard features](https://www.home-assistant.io/blog/2026/01/07/release-20261)
- [Energy monitoring best practices](https://www.vivint.com/resources/article/energy-monitoring)

---

**Research completed:** 2026-01-26
**Next step:** Requirements definition from this feature landscape
