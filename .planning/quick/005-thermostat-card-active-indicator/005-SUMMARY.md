# Quick Task 005: Summary

## Completed

✅ Added Active Devices Summary to ThermostatCard

## Changes Made

### `app/components/devices/thermostat/ThermostatCard.js`

Added a new "Active Devices Summary" section below the temperature display that shows:

1. **Device pills for each module in the room** - Shows 🔧 Valvola or 🌡️ Termostato
2. **Active state indication** - When heating is active:
   - Pills have ember background (warm orange)
   - Pulsing dot indicator shows device is actively heating
3. **Standby state** - When not heating:
   - Pills have neutral slate background
4. **Offline state** - Unreachable devices:
   - Pills are dimmed (60% opacity)
   - No pulsing indicator

## Visual Result

When a room is heating:
```
┌─────────────────────────────────┐
│      [🔥 ATTIVO]               │
│  ┌──────────┐ ┌──────────┐     │
│  │ Attuale  │ │  Target  │     │
│  │  21.5°   │ │  22.0°   │     │
│  └──────────┘ └──────────┘     │
│                                 │
│   [🔧 Valvola •] [🌡️ Termostato •] │  ← NEW
│                                 │
└─────────────────────────────────┘
```

When standby:
```
│   [🔧 Valvola] [🌡️ Termostato]    │
```

## Technical Notes

- Reuses existing `roomModules` data from `selectedRoom`
- Uses `cn()` utility for conditional class composition
- Supports both dark mode and light mode styling
- Responsive with `flex-wrap` for multiple devices
- Hover tooltip shows device name and status
