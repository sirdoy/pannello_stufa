---
phase: 15
plan: 05
subsystem: ui-components
tags: [statuscard, smart-home, badge, connection-status, cva]

requires:
  - 15-02  # Badge component
  - 15-03  # ConnectionStatus component
  - 15-04  # SmartHomeCard base component

provides:
  - StatusCard component for read-only device status display
  - Badge integration with automatic pulse for active states
  - ConnectionStatus integration with size matching

affects:
  - 15-06  # DeviceCard may use StatusCard patterns

tech-stack:
  added: []
  patterns:
    - SmartHomeCard extension pattern
    - Automatic pulse animation for active states (ember/sage)
    - Size-aware child component integration (compact->sm)

key-files:
  created:
    - app/components/ui/StatusCard.js
    - app/components/ui/__tests__/StatusCard.test.js
  modified:
    - app/components/ui/index.js

decisions:
  - "Pulse animation enabled for ember and sage variants only (active/online states)"
  - "ConnectionStatus size matches card size (compact->sm, default->md)"
  - "Margin between Badge and ConnectionStatus only when both present"

metrics:
  duration: "2 min"
  completed: "2026-01-29"
---

# Phase 15 Plan 05: StatusCard Summary

**One-liner:** StatusCard extends SmartHomeCard for read-only device status with Badge and ConnectionStatus integration

## Objective
Create a specialized card component for displaying device status information (not controls) that composes SmartHomeCard with Badge and ConnectionStatus components.

## Implementation

### StatusCard Component
- Extends SmartHomeCard base component
- Integrates Badge for status display with automatic pulse animation
- Integrates ConnectionStatus for connection state visualization
- Supports children for custom content

### Props API
```javascript
// SmartHomeCard props (passed through)
icon, title, size, colorTheme, isLoading, error, errorMessage, disabled, className

// StatusCard-specific props
status          // Text to display in Badge
statusVariant   // Badge color (default: 'neutral')
connectionStatus // 'online' | 'offline' | 'connecting' | 'unknown'
children        // Custom content
```

### Pulse Animation Logic
- Ember variant: pulses (active/heating states)
- Sage variant: pulses (online/healthy states)
- Other variants (neutral, warning, danger, ocean): no pulse

### Size-Aware Integration
- Compact card: ConnectionStatus uses 'sm' size
- Default card: ConnectionStatus uses 'md' size
- Margin between Badge and ConnectionStatus only when both present

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create StatusCard component with tests | 146f5f4 |
| 2 | Export from UI index | 1fc0570 |

## Test Results

```
PASS app/components/ui/__tests__/StatusCard.test.js
  StatusCard
    Accessibility
      - has no a11y violations with default props
      - has no a11y violations with full props
      - has no a11y violations when disabled
    Status Badge
      - renders status Badge with correct text
      - applies pulse animation for ember variant
      - applies pulse animation for sage variant
      - does not pulse for neutral/warning/danger/ocean variants
    ConnectionStatus Integration
      - renders when connectionStatus provided
      - hides when not provided
      - passes sm size for compact card
      - passes md size for default card
      - adds margin when both status and connectionStatus provided
    Children Content
      - renders children content
      - renders complex children
    SmartHomeCard Prop Forwarding
      - forwards isLoading, error, disabled, icon, title, colorTheme
    Size Variants
      - applies compact and default sizes
    Ref Forwarding
      - forwards ref to SmartHomeCard

Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
```

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| app/components/ui/StatusCard.js | Created | StatusCard component |
| app/components/ui/__tests__/StatusCard.test.js | Created | Component tests (32 tests) |
| app/components/ui/index.js | Modified | Export StatusCard |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Ready for 15-06 (DeviceCard refactor) which may build on patterns established here.
