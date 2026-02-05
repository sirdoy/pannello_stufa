---
status: diagnosed
trigger: "Devices added in Settings don't appear in Dashboard settings. User wants to UNIFY these two configuration sections."
created: 2026-02-05T10:00:00Z
updated: 2026-02-05T10:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two completely separate data systems with different purposes that overlap confusingly
test: Traced complete data flow for both systems
expecting: Understanding of architectural separation
next_action: Document root cause and propose unification strategy

## Symptoms

expected: Unified configuration - single place to manage devices for both general settings and dashboard visibility
actual: Two separate configuration sections (Impostazioni dispositivi and Dashboard settings) that don't sync
errors: None visible
reproduction: Add new device in Settings -> Check Dashboard settings -> Device not shown -> Device doesn't appear in Dashboard
started: Always been this way - architectural issue, not a regression

## Eliminated

(none - hypothesis was confirmed on first investigation)

## Evidence

- timestamp: 2026-02-05T10:05:00Z
  checked: app/settings/page.js - unified settings with 4 tabs
  found: |
    Two separate data systems identified:
    1. DevicesContent uses `/api/devices/preferences` - manages device enable/disable (appears in navbar/homepage)
    2. DashboardContent uses `/api/config/dashboard` - manages card order/visibility on dashboard
  implication: Different APIs, different data models, no cross-reference between them

- timestamp: 2026-02-05T10:08:00Z
  checked: API routes - /api/devices/preferences/route.js and /api/config/dashboard/route.js
  found: |
    SYSTEM 1 - Device Preferences (Dispositivi tab):
    - Firebase path: `devicePreferences/{userId}/{deviceId}` -> boolean
    - Data: { stove: true, thermostat: true, lights: false, sonos: false }
    - Purpose: Controls navbar/homepage device visibility
    - Source: DEVICE_CONFIG from lib/devices/deviceTypes.js

    SYSTEM 2 - Dashboard Preferences (Dashboard tab):
    - Firebase path: `users/{userId}/dashboardPreferences`
    - Data: { cardOrder: [{ id, label, icon, visible }, ...], updatedAt }
    - Purpose: Controls home page card ORDER and visibility
    - Source: Hardcoded DEFAULT_CARD_ORDER in route.js
  implication: Two systems manage "what appears on homepage" with different mechanisms

- timestamp: 2026-02-05T10:10:00Z
  checked: app/page.js (home page)
  found: |
    Home page ONLY uses dashboard preferences (System 2):
    - Fetches from `users/{userId}/dashboardPreferences`
    - Uses cardOrder to render cards
    - Maps card IDs to CARD_COMPONENTS
    - Does NOT check devicePreferences at all!
  implication: Device preferences (System 1) affect NAVBAR but NOT the actual home page rendering

- timestamp: 2026-02-05T10:12:00Z
  checked: lib/devices/deviceTypes.js and lib/services/dashboardPreferencesService.js
  found: |
    DEVICE_CONFIG has 5 devices: stove, thermostat, camera, lights, sonos
    DEFAULT_CARD_ORDER has 5 cards: stove, thermostat, weather, lights, camera

    KEY MISMATCH:
    - DEVICE_CONFIG has "sonos" but DEFAULT_CARD_ORDER doesn't
    - DEFAULT_CARD_ORDER has "weather" but DEVICE_CONFIG doesn't have it as a device
    - These are different concepts with overlapping but not identical items
  implication: The two systems were designed for different purposes and accidentally overlap

## Resolution

root_cause: |
  Architectural design issue: Two separate systems were created for overlapping concerns:

  1. **Device Preferences** (Dispositivi tab):
     - Purpose: Control which smart devices are ENABLED in the app
     - Controls: Navbar visibility, device pages access
     - Source of truth: DEVICE_CONFIG (static registry of smart devices)
     - Firebase: `devicePreferences/{userId}`

  2. **Dashboard Preferences** (Dashboard tab):
     - Purpose: Customize home page card ORDER and visibility
     - Controls: Only home page layout
     - Source of truth: DEFAULT_CARD_ORDER (includes weather which isn't a "device")
     - Firebase: `users/{userId}/dashboardPreferences`

  The systems don't sync because:
  - They were designed independently for different purposes
  - They have different data structures (boolean map vs ordered array)
  - They have different item lists (devices vs cards)
  - HOME PAGE only reads from dashboardPreferences, ignoring devicePreferences

  User confusion arises because:
  - "Dispositivi" tab says devices affect "homepage and menu"
  - "Dashboard" tab controls what's actually shown on homepage
  - These overlap but are not connected

fix: |
  PROPOSED UNIFICATION STRATEGY:

  Option A: Merge into Single Unified System (Recommended)
  - Create unified `deviceConfig/{userId}` with:
    {
      devices: [
        { id: 'stove', enabled: true, dashboardOrder: 0, dashboardVisible: true },
        { id: 'thermostat', enabled: true, dashboardOrder: 1, dashboardVisible: true },
        { id: 'weather', enabled: true, dashboardOrder: 2, dashboardVisible: true },  // special: display-only
        { id: 'lights', enabled: false, dashboardOrder: 3, dashboardVisible: false },
        { id: 'camera', enabled: true, dashboardOrder: 4, dashboardVisible: true },
        { id: 'sonos', enabled: false, dashboardOrder: 5, dashboardVisible: false },
      ]
    }
  - Single "Dispositivi" tab with:
    - Enable/disable toggle (controls navbar + dashboard)
    - Drag-to-reorder for dashboard position
    - Dashboard visible toggle (only if device enabled)
  - Remove separate "Dashboard" tab

  Option B: Keep Separate but Sync
  - When device is disabled in Dispositivi, auto-hide in Dashboard
  - When device is enabled in Dispositivi, auto-add to Dashboard cardOrder
  - Keep Dashboard tab for reordering only

  IMPLEMENTATION STEPS (Option A):
  1. Create new unified service: lib/services/unifiedDeviceService.js
  2. Create migration script to merge existing preferences
  3. Update Settings page to use single "Dispositivi" tab with reordering
  4. Update home page to use unified service
  5. Update navbar to use unified service
  6. Remove deprecated APIs and services

  FILES TO CHANGE:
  - lib/services/unifiedDeviceService.js (NEW)
  - lib/devices/deviceTypes.js (add display-only devices like weather)
  - app/settings/page.js (remove Dashboard tab, enhance Dispositivi)
  - app/page.js (use unified service)
  - app/api/devices/unified/route.js (NEW - replaces both APIs)
  - Migration: lib/scripts/migrateToUnifiedPreferences.js (NEW)

verification:
files_changed: []
