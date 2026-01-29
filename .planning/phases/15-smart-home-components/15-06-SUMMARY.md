---
phase: 15
plan: 06
subsystem: smart-home-components
tags: [device-card, smart-home-card, badge, health-indicator, refactor, backwards-compatibility]

dependency_graph:
  requires: ["15-01", "15-02", "15-03", "15-04"]
  provides: ["DeviceCard with SmartHomeCard base", "Device control standardization"]
  affects: ["existing device cards (ThermostatCard, LightsCard, CameraCard)"]

tech_stack:
  patterns:
    - "forwardRef for ref forwarding"
    - "SmartHomeCard composition pattern"
    - "Badge CVA integration"
    - "HealthIndicator status display"
    - "Legacy prop mapping"

key_files:
  created:
    - app/components/ui/__tests__/DeviceCard.test.js
  modified:
    - app/components/ui/DeviceCard.js

decisions:
  - title: "Backwards compatibility over breaking changes"
    choice: "Maintain all legacy props while adding new API"
    rationale: "Existing usages (ThermostatCard, LightsCard, CameraCard) continue to work without migration"
  - title: "Badge integration for statusBadge"
    choice: "Convert statusBadge prop to Badge component internally"
    rationale: "Leverage CVA variants and consistent styling from Badge component"
  - title: "Pulse animation for active states"
    choice: "ember, sage, primary, success colors pulse; others do not"
    rationale: "Visual feedback for active/healthy states"
  - title: "LoadingOverlay separate from SmartHomeCard isLoading"
    choice: "Use LoadingOverlay component for loading state instead of SmartHomeCard built-in"
    rationale: "LoadingOverlay provides full-page blocking overlay with custom message and icon"

metrics:
  duration: ~5 min
  completed: 2026-01-29
---

# Phase 15 Plan 6: DeviceCard Refactor Summary

DeviceCard refactored to use SmartHomeCard internally with Badge and HealthIndicator integration, maintaining full backwards compatibility.

## What Was Done

### Task 1: Refactor DeviceCard to use SmartHomeCard base

Completely refactored DeviceCard.js to:

1. **Import new components:**
   - SmartHomeCard for base card structure
   - Badge for statusBadge display
   - HealthIndicator for health status display
   - cn for class merging

2. **Legacy prop preservation:**
   - All existing props continue to work exactly as before
   - icon, title, colorTheme, connected, connectionError
   - onConnect, connectButtonLabel, connectInfoRoute
   - loading, loadingMessage, skeletonComponent
   - statusBadge, banners, children, infoBoxes, infoBoxesTitle
   - footerActions, toast, onToastClose, className

3. **New API additions:**
   - `size`: 'compact' | 'default' (controls padding via SmartHomeCard)
   - `healthStatus`: 'ok' | 'warning' | 'error' | 'critical'
   - `isLoading`: Alias for loading prop

4. **Legacy color mapping:**
   - 'primary' -> 'ember'
   - 'info' -> 'ocean'
   - 'success' -> 'sage'

5. **Status area refactoring:**
   - statusBadge converted to Badge component with CVA variants
   - Pulse animation for active states (ember, sage)
   - HealthIndicator displayed alongside Badge

6. **forwardRef support:**
   - Ref forwarding to SmartHomeCard

### Task 2: Create DeviceCard test suite

Created comprehensive test suite with 38 tests:

- **Accessibility (4 tests):** jest-axe validation for all states
- **Legacy API (9 tests):** All existing props work correctly
- **New API (7 tests):** size, healthStatus, isLoading
- **Integration (6 tests):** SmartHomeCard, Badge, color theme mapping
- **State handling (3 tests):** disabled, connected, error states
- **Ref Forwarding (1 test):** forwardRef works correctly
- **Children rendering (2 tests):** Content renders properly
- **Badge pulse (4 tests):** Pulse behavior for different colors

## Technical Details

### Component Structure (Connected State)
```jsx
<>
  <SmartHomeCard
    icon={icon}
    title={title}
    size={size}
    colorTheme={normalizedColorTheme}
    disabled={!connected}
    className={className}
  >
    {/* Status area with Badge and HealthIndicator */}
    <SmartHomeCard.Status>
      {statusBadge && <Badge variant={...} pulse={...} />}
      {healthStatus && <HealthIndicator status={...} />}
    </SmartHomeCard.Status>

    {/* Banners */}
    {banners.map(...)}

    {/* Main content */}
    {children}

    {/* Info boxes */}
    {infoBoxes.length > 0 && ...}

    {/* Footer actions */}
    <SmartHomeCard.Controls>
      {footerActions.map(...)}
    </SmartHomeCard.Controls>

    <LoadingOverlay ... />
  </SmartHomeCard>

  {toast?.show && <Toast ... />}
</>
```

### Key Mappings

| Legacy statusBadge.color | Badge variant | Pulses? |
|--------------------------|---------------|---------|
| ember                    | ember         | Yes     |
| sage                     | sage          | Yes     |
| primary                  | ember         | Yes     |
| success                  | sage          | Yes     |
| ocean                    | ocean         | No      |
| info                     | ocean         | No      |
| warning                  | warning       | No      |
| danger                   | danger        | No      |
| neutral                  | neutral       | No      |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 7d476f1 | refactor | DeviceCard uses SmartHomeCard internally |
| ed88064 | test | Add DeviceCard test suite (38 tests) |

## Deviations from Plan

None - plan executed exactly as written.

## Backwards Compatibility

All existing usages continue to work:

- `ThermostatCard.js` - Uses DeviceCard with banners, infoBoxes, footerActions
- `LightsCard.js` - Uses DeviceCard with statusBadge, banners, footerActions
- `CameraCard.js` - Uses DeviceCard with statusBadge, connected states

No migration required for existing code.

## Files Changed

| File | Change |
|------|--------|
| `app/components/ui/DeviceCard.js` | Refactored (76% rewrite) |
| `app/components/ui/__tests__/DeviceCard.test.js` | Created (547 lines) |

## Next Phase Readiness

Phase 15 complete. DeviceCard is now integrated with v3.0 design system:

- Uses SmartHomeCard base
- Uses Badge for status display
- Supports HealthIndicator
- Supports size variants
- Full backwards compatibility maintained

Ready for page-level usage and future smart home component development.
