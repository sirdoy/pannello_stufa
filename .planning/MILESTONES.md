# Project Milestones: Pannello Stufa

Historical record of shipped milestones for the Pannello Stufa smart home control PWA.

---

## v2.0 Netatmo Complete Control & Stove Monitoring (Shipped: 2026-01-28)

**Delivered:** Complete Netatmo thermostat control with weekly schedule management, automated stove health monitoring via cron, intelligent stove-thermostat coordination with user intent detection, and comprehensive monitoring dashboard with push notification alerts.

**Phases completed:** 6-10 (21 plans total)

**Key accomplishments:**

- Complete Netatmo schedule infrastructure with Firebase caching (5-min TTL), per-user rate limiting (400/hr), and schedule switching API
- Automated stove health monitoring with parallel API fetching, Firestore logging (parent/subcollection pattern), and dead man's switch (10-min threshold)
- Intelligent stove-thermostat coordination with 2-minute debouncing, user intent detection (0.5°C tolerance), schedule-aware pause calculation, and multi-zone support
- Schedule management UI with 7-day timeline visualization, schedule switcher, manual override sheet with duration/temperature pickers, and active override badges
- Monitoring dashboard with connection status display, dead man's switch panel, infinite scroll timeline with filters, and push notification alerts (3 alert types)
- Production-ready notification system with 30-minute throttle for alert deduplication and fire-and-forget pattern in cron integration

**Stats:**

- 21 plans executed across 5 phases
- 22/22 v2.0 requirements satisfied (100%)
- 124 files changed (+25,721 insertions, -71 deletions)
- ~5,271 lines of new production code
- 233+ tests passing (coordination, health monitoring, schedule helpers, UI components)
- 1.4 days from phase 6 start to completion (2026-01-27 → 2026-01-28)

**Git range:** `feat(06-01)` (1763a1d) → `feat(10-05)` (575a214)

**Archives:**
- [Roadmap](milestones/v2.0-ROADMAP.md)
- [Requirements](milestones/v2.0-REQUIREMENTS.md)
- [Audit](milestones/v2.0-MILESTONE-AUDIT.md)

**What's next:** System delivers complete Netatmo schedule management (view, switch, manual overrides), automated stove health monitoring with alerting, and enhanced stove-thermostat coordination. Full schedule CRUD deferred to v2.1+ (official Netatmo app sufficient for editing). Next focus TBD.

---

## v1.0 Push Notifications System (Shipped: 2026-01-26)

**Delivered:** Production-grade push notification system with token persistence, delivery monitoring, user preferences, history management, and automated testing.

**Phases completed:** 1-5 (29 plans total)

**Key accomplishments:**

- Fixed critical token persistence bug - tokens survive browser restarts via dual persistence (IndexedDB + localStorage)
- Complete delivery visibility with admin dashboard, 7-day trends visualization, and error logging
- User control over notification behavior with type toggles, DND hours, and rate limiting
- In-app notification history with infinite scroll and device management UI
- Comprehensive E2E test suite (32 tests) with CI/CD integration and automated token cleanup

**Stats:**

- 29 plans executed across 5 phases
- 31/31 v1 requirements satisfied (100%)
- ~70,000 lines of TypeScript/JavaScript
- 4 days from initialization to ship (2026-01-23 → 2026-01-26)
- 50+ git commits with atomic, well-documented changes

**Git range:** `feat(01-01)` → `docs(05)`

**Archives:**
- [Roadmap](milestones/v1.0-ROADMAP.md)
- [Requirements](milestones/v1.0-REQUIREMENTS.md)
- [Audit](milestones/v1.0-MILESTONE-AUDIT.md)

**What's next:** System is production-ready with full functionality operational. Operational setup items documented (cron configuration, Firestore index deployment). Future enhancements tracked in v2 requirements (advanced analytics, rich media notifications, user engagement metrics).

---

_For current project status, see `.planning/PROJECT.md`_
_To start next milestone, run `/gsd:new-milestone`_
