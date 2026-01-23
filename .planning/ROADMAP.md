# Roadmap: Pannello Stufa - Push Notifications

## Overview

Production-grade push notification system for PWA smart home control. Fixes critical token persistence bug, adds delivery monitoring, implements user preferences, and automates token lifecycle management. Four phases deliver incrementally: Foundation (reliable tokens) → Monitoring (visibility) → User Features (control) → Automation (hands-off operation).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Token Lifecycle Foundation** - Fix critical persistence bug, token refresh, cleanup
- [ ] **Phase 2: Production Monitoring Infrastructure** - Delivery tracking, error logging, admin dashboard
- [ ] **Phase 3: User Preferences & Control** - Granular notification settings, DND hours, rate limiting
- [ ] **Phase 4: Notification History & Devices** - In-app inbox, device management, history UI
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
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 2: Production Monitoring Infrastructure
**Goal**: Complete visibility into notification delivery - track sent/delivered/failed with error logging
**Depends on**: Phase 1
**Requirements**: MONITOR-01, MONITOR-02, MONITOR-03, MONITOR-04, MONITOR-05, MONITOR-06, INFRA-01, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Admin dashboard displays delivery rate percentage with target indicator (85%+ = green)
  2. Failed notification appears in error log with timestamp, FCM error code, and device identifier
  3. Admin clicks "Send Test" button, selects device, receives notification within 5 seconds with delivery confirmation
  4. Delivery rate drops below 85%, admin receives alert notification within 1 minute
  5. Dashboard charts visualize delivery trends for last 7 days using Recharts
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 3: User Preferences & Control
**Goal**: Users control notification behavior - enable/disable types, set quiet hours, prevent spam
**Depends on**: Phase 2
**Requirements**: PREF-01, PREF-02, PREF-03, PREF-04, PREF-05, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User disables "Scheduler" notifications in settings, scheduler events no longer trigger push (other types still work)
  2. User sets DND hours 22:00-08:00 in timezone Europe/Rome, receives no notifications during those hours
  3. Scheduler fires 3 events within 4 minutes, user receives only 1 notification (rate limit: max 1 per category per 5 min)
  4. User updates preferences on phone, immediately sees same settings on tablet (cross-device sync)
  5. New user sees only CRITICAL and ERROR notifications enabled by default (conservative defaults)
**Plans**: TBD

Plans:
- [ ] TBD during planning

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
**Plans**: TBD

Plans:
- [ ] TBD during planning

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
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Token Lifecycle Foundation | 0/TBD | Not started | - |
| 2. Production Monitoring Infrastructure | 0/TBD | Not started | - |
| 3. User Preferences & Control | 0/TBD | Not started | - |
| 4. Notification History & Devices | 0/TBD | Not started | - |
| 5. Automation & Testing | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-23*
*Depth: comprehensive (5 phases derived from requirements)*
*Coverage: 31/31 v1 requirements mapped (100%)*
