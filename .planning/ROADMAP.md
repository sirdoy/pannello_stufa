# Roadmap: Pannello Stufa - Push Notifications

## Overview

Production-grade push notification system for PWA smart home control. Fixes critical token persistence bug, adds delivery monitoring, implements user preferences, and automates token lifecycle management. Four phases deliver incrementally: Foundation (reliable tokens) → Monitoring (visibility) → User Features (control) → Automation (hands-off operation).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Token Lifecycle Foundation** - Fix critical persistence bug, token refresh, cleanup
- [x] **Phase 2: Production Monitoring Infrastructure** - Delivery tracking, error logging, admin dashboard
- [x] **Phase 3: User Preferences & Control** - Granular notification settings, DND hours, rate limiting
- [x] **Phase 4: Notification History & Devices** - In-app inbox, device management, history UI
- [ ] **Phase 5: Automation & Testing** - Scheduled cleanup, E2E tests, polish

## Phase Details

### Phase 1: Token Lifecycle Foundation
**Goal**: Fix critical token persistence bug - tokens survive browser restarts and devices auto-recover
**Depends on**: Nothing (first phase)
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06
**Success Criteria** (what must be TRUE):
  1. User closes browser completely, reopens app, and receives test notification without re-registering
  2. Token with invalid status (FCM NotRegistered error) automatically removed from database within 60 seconds
  3. User registers 3 different devices (phone, tablet, desktop) and receives broadcast notification on all 3
  4. Admin dashboard shows max 3-5 active tokens per user (no accumulation of stale tokens)
  5. Token older than 30 days automatically refreshes on next app launch
**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Token storage foundation (IndexedDB + localStorage dual persistence)
- [x] 01-02-PLAN.md — Device fingerprinting (UA parsing and device identification)
- [x] 01-03-PLAN.md — Token registration enhancement (device deduplication)
- [x] 01-04-PLAN.md — Token refresh logic (30-day startup check)
- [x] 01-05-PLAN.md — Invalid token cleanup (real-time detection + cleanup API)
- [x] 01-06-PLAN.md — Integration and verification checkpoint

### Phase 2: Production Monitoring Infrastructure
**Goal**: Complete visibility into notification delivery - track sent/delivered/failed with error logging
**Depends on**: Phase 1
**Requirements**: MONITOR-01, MONITOR-02, MONITOR-03, MONITOR-04, MONITOR-05, MONITOR-06, INFRA-01, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Admin dashboard displays delivery rate percentage with target indicator (85%+ = green)
  2. Failed notification appears in error log with timestamp, FCM error code, and device identifier
  3. Admin clicks "Send Test" button, selects device, receives notification within 5 seconds with delivery confirmation
  4. Dashboard charts visualize delivery trends for last 7 days using Recharts
  5. Delivery rate drops below 85%, admin receives alert notification within 1 minute
**Plans**: 7 plans (6 original + 1 gap closure)

Plans:
- [x] 02-01-PLAN.md — Dependencies and notification logging foundation (Firestore + recharts + date-fns)
- [x] 02-02-PLAN.md — Error logging infrastructure (FCM error tracking + API)
- [x] 02-03-PLAN.md — Dashboard page with delivery metrics and device list
- [x] 02-04-PLAN.md — Test notification panel with device selection and templates
- [x] 02-05-PLAN.md — Recharts visualization (7-day delivery trends chart)
- [x] 02-06-PLAN.md — Rate alerting and phase verification checkpoint
- [ ] 02-07-PLAN.md — Gap closure: device list API missing status and tokenPrefix fields

### Phase 3: User Preferences & Control
**Goal**: Users control notification behavior - enable/disable types, set quiet hours, prevent spam
**Depends on**: Phase 2
**Requirements**: PREF-01, PREF-02, PREF-03, PREF-04, PREF-05, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User disables "Scheduler" notifications in settings, scheduler events no longer trigger push (other types still work)
  2. User sets DND hours 22:00-08:00 in timezone Europe/Rome, receives no notifications during those hours
  3. Scheduler fires 3 events within 4 minutes, user receives only 1 notification (rate limit: max 1 per type per 5 min)
  4. User updates preferences on phone, immediately sees same settings on tablet (cross-device sync)
  5. New user sees Alerts + System enabled by default (balanced approach per CONTEXT.md)
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md — Dependencies + Zod schema (react-hook-form, zod, @hookform/resolvers)
- [x] 03-02-PLAN.md — Settings UI form with React Hook Form + category toggles + DND inputs
- [x] 03-03-PLAN.md — Firestore real-time sync hook (useNotificationPreferences)
- [x] 03-04-PLAN.md — Server-side filtering (type toggles, DND hours, CRITICAL bypass)
- [x] 03-05-PLAN.md — Rate limiting logic (per-type windows, in-memory Map)
- [x] 03-06-PLAN.md — Integration and verification checkpoint

### Phase 4: Notification History & Devices
**Goal**: Users see notification history in-app and manage registered devices
**Depends on**: Phase 3
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, DEVICE-01, DEVICE-02, DEVICE-03, DEVICE-04, INFRA-01, INFRA-05
**Success Criteria** (what must be TRUE):
  1. User opens notification history, sees chronological list of last 50 notifications with infinite scroll pagination
  2. User filters history by "Error" type, only error notifications displayed
  3. User views device list, sees 3 registered devices with names ("Kitchen iPad", "Bedroom Phone", "Office Laptop")
  4. User clicks "Remove" on stale tablet device, device disappears from list and stops receiving notifications
  5. Notification older than 90 days automatically deleted from history (GDPR compliance)
**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — History API endpoint + Firestore pagination
- [x] 04-02-PLAN.md — Device management APIs (naming + removal)
- [x] 04-03-PLAN.md — Notification history UI with infinite scroll and filters
- [x] 04-04-PLAN.md — Device management UI with rename/remove capabilities
- [x] 04-05-PLAN.md — Integration and verification checkpoint

### Phase 5: Automation & Testing
**Goal**: Zero-touch token hygiene with automated cleanup and comprehensive E2E tests
**Depends on**: Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Weekly cron job runs automatically, removes tokens with lastUsed > 90 days without manual intervention
  2. Playwright E2E test simulates browser restart, verifies token persists and notifications still arrive
  3. Admin panel "Quick Test" dropdown shows predefined templates (Error Alert, Scheduler Success, Maintenance Reminder)
  4. CI/CD pipeline runs E2E tests on every PR, blocks merge if service worker lifecycle tests fail
  5. System requires zero manual token cleanup for 30+ consecutive days (full automation validated)
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Playwright infrastructure setup (config, fixtures, Page Objects)
- [x] 05-02-PLAN.md — HMAC-secured cron webhook for automated token cleanup
- [x] 05-03-PLAN.md — E2E tests for token persistence and service worker lifecycle
- [x] 05-04-PLAN.md — Admin testing enhancements (priority selector, test history)
- [x] 05-05-PLAN.md — GitHub Actions CI/CD integration and verification checkpoint

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Token Lifecycle Foundation | 6/6 | Complete | 2026-01-24 |
| 2. Production Monitoring Infrastructure | 7/7 | Complete | 2026-01-24 |
| 3. User Preferences & Control | 6/6 | Complete | 2026-01-25 |
| 4. Notification History & Devices | 5/5 | Complete | 2026-01-26 |
| 5. Automation & Testing | 5/5 | Complete (gaps: operational setup) | 2026-01-26 |

---
*Roadmap created: 2026-01-23*
*Phase 1 planned: 2026-01-23 (6 plans in 4 waves)*
*Phase 1 executed: 2026-01-24 (48.6 min total, all success criteria verified)*
*Phase 2 planned: 2026-01-24 (6 plans in 4 waves)*
*Phase 2 executed: 2026-01-24 (7 plans total including 1 gap closure, all success criteria verified)*
*Depth: comprehensive (5 phases derived from requirements)*
*Coverage: 31/31 v1 requirements mapped (100%)*
*Phase 3 planned: 2026-01-25 (6 plans in 4 waves)*
*Phase 3 executed: 2026-01-25 (6 plans, all success criteria technically verified, goal achieved)*
*Phase 4 planned: 2026-01-25 (5 plans in 3 waves)*
*Phase 4 executed: 2026-01-26 (5 plans, 17.5 min total, all success criteria verified)*
*Phase 5 planned: 2026-01-26 (5 plans in 3 waves)*
*Phase 5 executed: 2026-01-26 (5 plans, 3/5 success criteria verified - 2 gaps are operational setup, not code)*
