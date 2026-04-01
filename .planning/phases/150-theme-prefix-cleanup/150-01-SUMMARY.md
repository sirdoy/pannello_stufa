---
phase: 150-theme-prefix-cleanup
plan: "01"
subsystem: design-system
tags: [theme-cleanup, tailwind, dark-mode, ui-components]
depends_on: []
provides: [clean-ui-components, clean-general-components]
affects: [all-pages, all-features]
tech-stack:
  patterns: [dark-only-tailwind, cva-variants, multiline-className-handling]
key-files:
  modified:
    - app/components/ui/Accordion.tsx
    - app/components/ui/ActionButton.tsx
    - app/components/ui/Badge.tsx
    - app/components/ui/Banner.tsx
    - app/components/ui/BottomSheet.tsx
    - app/components/ui/Button.tsx
    - app/components/ui/Card.tsx
    - app/components/ui/Checkbox.tsx
    - app/components/ui/CommandPalette.tsx
    - app/components/ui/ConfirmationDialog.tsx
    - app/components/ui/ConfirmDialog.tsx
    - app/components/ui/ConnectionStatus.tsx
    - app/components/ui/ContextMenu.tsx
    - app/components/ui/ControlButton.tsx
    - app/components/ui/DashboardLayout.tsx
    - app/components/ui/DataTable.tsx
    - app/components/ui/DataTableToolbar.tsx
    - app/components/ui/Divider.tsx
    - app/components/ui/ErrorAlert.tsx
    - app/components/ui/Footer.tsx
    - app/components/ui/Heading.tsx
    - app/components/ui/HealthIndicator.tsx
    - app/components/ui/InfoBox.tsx
    - app/components/ui/Input.tsx
    - app/components/ui/Kbd.tsx
    - app/components/ui/Label.tsx
    - app/components/ui/LastUpdated.tsx
    - app/components/ui/LoadingOverlay.tsx
    - app/components/ui/Modal.tsx
    - app/components/ui/OfflineBanner.tsx
    - app/components/ui/PageLayout.tsx
    - app/components/ui/Pagination.tsx
    - app/components/ui/Panel.tsx
    - app/components/ui/Popover.tsx
    - app/components/ui/Progress.tsx
    - app/components/ui/ProgressBar.tsx
    - app/components/ui/RadioGroup.tsx
    - app/components/ui/Select.tsx
    - app/components/ui/Sheet.tsx
    - app/components/ui/Skeleton.tsx
    - app/components/ui/Slider.tsx
    - app/components/ui/Spinner.tsx
    - app/components/ui/StatusBadge.tsx
    - app/components/ui/Switch.tsx
    - app/components/ui/Tabs.tsx
    - app/components/ui/Text.tsx
    - app/components/ui/Toast.tsx
    - app/components/ui/Tooltip.tsx
    - app/components/CronHealthBanner.tsx
    - app/components/ForceUpdateModal.tsx
    - app/components/lights/CreateSceneModal.tsx
    - app/components/lights/EditSceneModal.tsx
    - app/components/LocationSearch.tsx
    - app/components/log/LogEntry.tsx
    - app/components/MaintenanceBar.tsx
    - app/components/Navbar.tsx
    - app/components/navigation/DropdownComponents.tsx
    - app/components/netatmo/PidAutomationPanel.tsx
    - app/components/netatmo/RoomCard.tsx
    - app/components/NotificationPreferencesPanel.tsx
    - app/components/pwa/InstallPrompt.tsx
    - app/components/scheduler/AddIntervalModal.tsx
    - app/components/scheduler/DayEditPanel.tsx
    - app/components/scheduler/DuplicateDayModal.tsx
    - app/components/scheduler/IntervalBottomSheet.tsx
    - app/components/scheduler/ScheduleInterval.tsx
    - app/components/scheduler/ScheduleManagementModal.tsx
    - app/components/scheduler/ScheduleSelector.tsx
    - app/components/scheduler/WeeklySummaryCard.tsx
    - app/components/scheduler/WeeklyTimeline.tsx
    - app/components/SettingsLayout.tsx
    - app/components/weather/CurrentConditions.tsx
    - app/components/weather/ForecastDayCard.tsx
    - app/components/weather/ForecastDaySheet.tsx
    - app/components/weather/HourlyForecast.tsx
    - app/components/weather/WeatherCard.tsx
    - app/components/WhatsNewModal.tsx
decisions:
  - "Use two-stage approach: global regex for html:not(.dark)_& tokens, per-line char-scanner for dark: tokens — global approach needed for multiline template literals"
  - "Fallback global dark: strip handles multiline className attributes that span multiple lines (found in Navbar.tsx)"
  - "Empty CVA array entries removed automatically after light-mode strings become empty strings"
metrics:
  duration: 640s
  completed: "2026-04-01T11:12:25Z"
  tasks: 2
  files: 77
---

# Phase 150 Plan 01: Remove dark: and html:not(.dark) from UI and General Components Summary

**One-liner:** Removed all `dark:` prefixes and `[html:not(.dark)_&]:` arbitrary selectors from 77 files (48 UI components + 29 general components), leaving only dark-mode Tailwind values.

## What Was Built

Cleaned 77 TypeScript/TSX files in `app/components/ui/` and `app/components/` (excluding `devices/`) of all theme-conditional Tailwind class tokens:

- **48 UI components** in `app/components/ui/`: All `dark:` prefixes stripped, all `[html:not(.dark)_&]:` selector tokens removed, light-mode counterparts for same CSS properties removed.
- **29 general components** in `app/components/` (excluding `ui/` and `devices/`): Same transformations applied.

The transformations applied:
1. `dark:X` → `X` (strip prefix)
2. `[html:not(.dark)_&]:X` → removed entirely
3. When `dark:bg-X` was present, the light-mode `bg-Y` counterpart (same CSS property prefix) was also removed
4. Empty CVA array string entries resulting from the above were removed

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Remove dark: and html:not(.dark) from UI components (app/components/ui/) | fe8f7d9d | 48 files |
| 2 | Remove dark: and html:not(.dark) from general components (app/components/) | b1692e80 | 29 files |

## Verification Results

```
dark: remaining in app/components/ (excluding devices/): 0
html:not(.dark) remaining in app/components/ (excluding devices/): 0
```

Key files verified:
- `app/components/ui/Skeleton.tsx`: 0 occurrences (was 36)
- `app/components/ui/Banner.tsx`: 0 occurrences (was 29)
- `app/components/ui/Button.tsx`: 0 occurrences (was 21)
- `app/components/netatmo/PidAutomationPanel.tsx`: 0 occurrences (was 36)
- `app/components/Navbar.tsx`: 0 occurrences (was 25)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fallback needed for multiline className strings**
- **Found during:** Task 2 (Navbar.tsx)
- **Issue:** The per-line char-scanner approach for `dark:` tokens doesn't handle `className="..."` attributes that span multiple lines (e.g., in Navbar.tsx lines 479-488). The char-scanner finds the opening `"` on one line but the closing `"` is on a different line, so the inner content is never processed.
- **Fix:** Added a fallback global regex `dark:X → X` after the per-line pass. For the specific case of `bg-white/[0.04] dark:bg-white/[0.04]` (identical light/dark values), the multiline case resulted in duplicate tokens; these were manually cleaned.
- **Files modified:** `app/components/Navbar.tsx` (lines 482-488 manually fixed to remove stray `]` artifacts and deduplicate tokens)
- **Commits:** b1692e80

**2. [Rule 1 - Bug] Stray `]` characters in Navbar.tsx multiline className**
- **Found during:** Task 2 verification
- **Issue:** Lines 486-487 of Navbar.tsx contained stray `]` characters (remnants from a previous partial processing pass). These were removed as part of the fix.
- **Fix:** Removed stray `]` lines and cleaned up the className block.

### Implementation Note

The `[html:not(.dark)_&]:` removal was applied as a **global regex** (not per-line) because:
- These tokens appear in multiline template literals (e.g., InfoBox.tsx lines 57-60)
- The per-line approach can't find token boundaries that span lines
- The `[html:not(.dark)_&]:X` pattern is unambiguous and safe to replace globally

The `dark:` removal was handled **per-line** (with global fallback) because:
- Same-property light counterpart removal requires seeing both tokens together
- Per-line approach works for most cases (inline className="..." attributes)
- Global fallback handles edge cases like Navbar's multiline className

## Known Stubs

None. All transformations are mechanical — no functional behavior changed.

## Self-Check: PASSED

- FOUND: app/components/ui/Skeleton.tsx
- FOUND: app/components/ui/Banner.tsx
- FOUND: app/components/ui/Button.tsx
- FOUND: app/components/netatmo/PidAutomationPanel.tsx
- FOUND: app/components/Navbar.tsx
- FOUND commit: fe8f7d9d (Task 1)
- FOUND commit: b1692e80 (Task 2)
- Verified: 0 dark: tokens in app/components/ (excl. devices/)
- Verified: 0 html:not(.dark) tokens in app/components/ (excl. devices/)
