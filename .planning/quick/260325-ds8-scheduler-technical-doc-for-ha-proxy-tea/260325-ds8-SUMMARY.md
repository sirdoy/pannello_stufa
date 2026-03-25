---
quick_id: 260325-ds8
description: "Scheduler technical doc for HA proxy team"
date: 2026-03-25
status: complete
---

# Quick Task Summary: Scheduler Technical Doc for HA Proxy Team

## What was done

Created a comprehensive technical specification document (`SCHEDULER-SPEC.md`) analyzing the complete stove scheduler system for the HA proxy team. The document covers:

- **Data structure**: Full Firebase RTDB tree with types and example data
- **3 operating modes**: Manual, Automatic, Semi-Manual with exact behavior
- **Cron engine**: 5-minute interval logic with timezone handling (Europe/Rome)
- **Safety checks**: Double-check status, maintenance block, alarm handling
- **Stove commands**: All 6 proxy endpoints with methods, bodies, and responses
- **PID automation**: Feedback loop with Netatmo temperature, PID coefficients, boost state
- **Multi-schedule CRUD**: All API endpoints for schedule management
- **Notifications**: 6 trigger types with cooldowns
- **HA requirements**: Proposed API surface, cron engine spec, timezone requirements
- **Data flow**: Current (Firebase) vs proposed (HA) architecture comparison

## Files

| File | Purpose |
|------|---------|
| `SCHEDULER-SPEC.md` | Complete technical specification (12 sections) |

## Key decisions

- Document written in Italian (matching target team language) with English code/type names
- Included "What HA Must Implement" section (section 9) as actionable requirements
- Covered PID automation as optional but documented (HA team decides whether to include)
- Highlighted timezone as CRITICAL requirement (Europe/Rome, DST handling)
