# Phase 8: Stove-Thermostat Integration Correction - Research

**Researched:** 2026-01-27
**Domain:** Smart home automation coordination, thermostat API integration, user intent detection
**Confidence:** HIGH

## Summary

Phase 8 focuses on correcting and enhancing the coordination between stove ignition and Netatmo thermostat using temporary setpoint overrides (not schedule modifications). The research reveals that the codebase already has a solid foundation with `netatmoStoveSync.js` implementing basic coordination, but needs enhancement for user intent detection, debouncing, multi-zone configuration, and notification deduplication.

The Netatmo API supports temporary manual mode overrides via `setRoomThermpoint` with `mode: 'manual'`, `temp: <value>`, and `endtime: <unix_timestamp>`. The existing implementation uses 8-hour duration but lacks debouncing, user intent detection, and proper state restoration. Multi-zone coordination is partially implemented (supports multiple rooms) but needs UI configuration.

**Key findings:**
- Existing `netatmoStoveSync.js` already implements basic stove-thermostat coordination with multi-room support
- Netatmo API provides `setRoomThermpoint` for temporary overrides with automatic revert to schedule
- User intent detection pattern: "manual changes should pause automation" is a common smart home best practice
- Debouncing prevents rapid state changes - industry standard uses timer-based state machines
- Notification deduplication follows event management patterns with time-window based throttling
- Multi-zone coordination requires per-zone configuration stored in user preferences

**Primary recommendation:** Build upon existing `netatmoStoveSync.js` infrastructure by adding coordination state management, debounce timers, user intent detection from Netatmo API, and enhanced notification deduplication. Store coordination preferences in Firebase user preferences path.

## Standard Stack

The codebase already has all required libraries - no new dependencies needed per v2.0 decision.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Netatmo Energy API | v1 | Thermostat control via setRoomThermpoint | Official Netatmo API for setpoint management |
| Firebase Realtime DB | Current | State persistence, coordination tracking | Already used for netatmo/stoveSync state |
| Firebase Firestore | Current | Notification history, event logging | Already used for health monitoring logs |
| Node.js timers | Native | Debouncing, delayed operations | No external dependency, already used in cron |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| netatmoApi.js | Current | API wrapper for setRoomThermpoint | All Netatmo API calls |
| netatmoStoveSync.js | Current | Existing coordination logic | Base for enhancements |
| rateLimiter.js | Current | In-memory notification throttling | Per-type rate limiting |
| firebaseAdmin.js | Current | Server-side DB operations | All coordination state writes |

### Existing Patterns to Follow
| Pattern | Location | Use For |
|---------|----------|---------|
| In-memory Map storage | `lib/rateLimiter.js`, `lib/netatmoRateLimiter.js` | Debounce timer tracking |
| Fire-and-forget logging | `lib/healthLogger.js` | Coordination event logging |
| Cron-based state checking | `app/api/scheduler/check/route.js` | Periodic coordination enforcement |
| User preferences schema | `lib/schemas/notificationPreferences.js` | Coordination preferences validation |

**Installation:**
No new packages required - all infrastructure exists.

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── coordinationState.js         # NEW: Coordination state management
├── coordinationDebounce.js      # NEW: Debounce timer service
├── coordinationPreferences.js   # NEW: User preferences for zones/boost
├── netatmoStoveSync.js         # ENHANCE: Add state restore, user intent
├── notificationDeduplication.js # NEW: Global throttle service
└── schemas/
    └── coordinationPreferences.js # NEW: Zod schema for preferences

app/api/
├── coordination/
│   └── enforce/route.js        # NEW: Called by cron every minute
└── preferences/
    └── coordination/route.js    # NEW: CRUD for user preferences

Firebase RTDB:
/coordination/
  /state                         # Current coordination state
    - stoveOn: boolean
    - automationPaused: boolean
    - pausedUntil: timestamp
    - pauseReason: string
    - lastStateChange: timestamp
    - pendingDebounce: boolean
    - debounceStartedAt: timestamp
  /debounceTimers/{userId}       # Active debounce timers
  /preferences/{userId}          # User coordination preferences
    - enabled: boolean
    - defaultBoost: number
    - zones: [{ roomId, boost }]
```

### Pattern 1: Coordination State Machine
**What:** Centralized state tracking for stove-thermostat coordination
**When to use:** Every coordination decision point (stove state change, manual override detected)
**Example:**
```javascript
// lib/coordinationState.js
export async function getCoordinationState() {
  const state = await adminDbGet('coordination/state');
  return state || {
    stoveOn: false,
    automationPaused: false,
    pausedUntil: null,
    pauseReason: null,
    lastStateChange: Date.now(),
    pendingDebounce: false,
    debounceStartedAt: null,
  };
}

export async function updateCoordinationState(updates) {
  const current = await getCoordinationState();
  const newState = { ...current, ...updates, lastStateChange: Date.now() };
  await adminDbSet('coordination/state', newState);
  return newState;
}
```

### Pattern 2: Debounce Timer with State Machine
**What:** Time-based debouncing that prevents rapid coordination changes
**When to use:** When stove transitions to ON state (STARTING → ON)
**Example:**
```javascript
// lib/coordinationDebounce.js
// In-memory timer tracking (like rateLimiter.js)
const activeTimers = new Map(); // userId -> { timer, startedAt, targetState }

export function startDebounceTimer(userId, targetState, callback, delayMs = 120000) {
  // Cancel existing timer if any
  cancelDebounceTimer(userId);

  const timer = setTimeout(async () => {
    console.log(`⏰ Debounce timer fired for ${userId}`);
    await callback();
    activeTimers.delete(userId);
  }, delayMs);

  activeTimers.set(userId, {
    timer,
    startedAt: Date.now(),
    targetState,
  });

  // Update Firebase state
  await updateCoordinationState({
    pendingDebounce: true,
    debounceStartedAt: Date.now(),
  });
}

export function cancelDebounceTimer(userId) {
  const existing = activeTimers.get(userId);
  if (existing) {
    clearTimeout(existing.timer);
    activeTimers.delete(userId);
  }
}
```

### Pattern 3: User Intent Detection via API Polling
**What:** Detect manual thermostat changes by comparing current setpoint with expected coordination state
**When to use:** Every cron cycle (1 minute polling)
**Example:**
```javascript
// In coordination enforcement cron
async function detectUserIntent(homeId, roomId, expectedSetpoint) {
  const { accessToken } = await getValidAccessToken();
  const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

  const room = homeStatus.rooms?.find(r => r.id === roomId);
  const currentSetpoint = room?.therm_setpoint_temperature;
  const currentMode = room?.therm_setpoint_mode;

  // User manually changed setpoint
  if (currentMode === 'manual' && Math.abs(currentSetpoint - expectedSetpoint) > 0.5) {
    return {
      manualChange: true,
      currentSetpoint,
      expectedSetpoint,
      reason: 'setpoint_changed',
    };
  }

  // User switched to different mode (away, hg, etc.)
  if (currentMode !== 'manual' && currentMode !== 'home') {
    return {
      manualChange: true,
      currentMode,
      reason: 'mode_changed',
    };
  }

  return { manualChange: false };
}
```

### Pattern 4: Global Notification Deduplication
**What:** Cross-event notification throttling with 30-minute window
**When to use:** Before sending any coordination-related notification
**Example:**
```javascript
// lib/notificationDeduplication.js
const lastNotificationSent = new Map(); // userId -> timestamp

export function shouldSendNotification(userId, eventType) {
  const GLOBAL_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes
  const lastSent = lastNotificationSent.get(userId);
  const now = Date.now();

  if (lastSent && (now - lastSent) < GLOBAL_THROTTLE_MS) {
    const waitSeconds = Math.ceil((GLOBAL_THROTTLE_MS - (now - lastSent)) / 1000);
    return {
      allowed: false,
      reason: 'global_throttle',
      waitSeconds,
    };
  }

  lastNotificationSent.set(userId, now);
  return { allowed: true };
}
```

### Pattern 5: Setpoint Restoration
**What:** Restore previous setpoint when stove turns OFF, not schedule
**When to use:** When coordination state changes from stoveOn: true → false
**Example:**
```javascript
// Enhancement to netatmoStoveSync.js
async function restorePreviousSetpoints(rooms) {
  for (const room of rooms) {
    if (room.originalSetpoint !== null && room.originalSetpoint !== undefined) {
      // Restore to manual mode with original setpoint, 8-hour duration
      const endtime = Math.floor(Date.now() / 1000) + (8 * 60 * 60);

      await NETATMO_API.setRoomThermpoint(accessToken, {
        home_id: homeId,
        room_id: room.id,
        mode: 'manual',
        temp: room.originalSetpoint,
        endtime,
      });

      console.log(`✅ Restored room "${room.name}" to ${room.originalSetpoint}°C`);
    } else {
      // No previous setpoint - return to schedule
      await NETATMO_API.setRoomThermpoint(accessToken, {
        home_id: homeId,
        room_id: room.id,
        mode: 'home',
      });
    }
  }
}
```

### Anti-Patterns to Avoid
- **Don't modify Netatmo schedules:** Use temporary manual mode, not schedule updates
- **Don't store timers in Firebase:** Use in-memory Map like rateLimiter.js (timers don't persist across restarts)
- **Don't ignore user intent:** Always pause automation when manual changes detected
- **Don't spam notifications:** Implement global throttle, not just per-type rate limiting
- **Don't use fixed pause duration:** Calculate pause until next schedule slot begins

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timer management | Custom setTimeout wrapper | Native Map + setTimeout (rateLimiter.js pattern) | In-memory pattern already proven, handles cleanup |
| Notification throttling | Custom queue system | Extend rateLimiter.js with global window | Existing pattern supports custom windows, just add global scope |
| State persistence | Custom cache layer | Firebase RTDB with adminDb helpers | Already used for stoveSync, consistent pattern |
| User preferences schema | Manual validation | Extend Zod schemas (notificationPreferences.js pattern) | Type-safe, validation built-in, already in use |
| Schedule slot detection | Custom time math | Netatmo API schedule data + time calculations | Netatmo provides timetable structure, parse it |
| Multi-zone configuration | Custom UI pattern | Follow device preferences pattern | Existing devicePreferences structure supports zones |

**Key insight:** The codebase has mature patterns for state management (Firebase RTDB), in-memory caching (Map-based), and user preferences (Zod schemas). Don't reinvent - extend existing patterns.

## Common Pitfalls

### Pitfall 1: Timer Persistence Assumption
**What goes wrong:** Storing setTimeout references in Firebase expecting them to survive server restart
**Why it happens:** Misconception that coordination state includes active timers
**How to avoid:** Store only timer metadata (startedAt, duration) in Firebase; actual setTimeout lives in-memory Map
**Warning signs:** Debounce timers "disappear" after deployment or restart

### Pitfall 2: Schedule Modification Instead of Override
**What goes wrong:** Using Netatmo schedule API to modify timetable instead of temporary setpoint
**Why it happens:** Misunderstanding "until stove OFF" as needing schedule changes
**How to avoid:** Use `setRoomThermpoint` with `mode: 'manual'` and `endtime` parameter - manual mode auto-reverts
**Warning signs:** User's weekly schedule gets corrupted, coordination persists after stove OFF

### Pitfall 3: Fixed Pause Duration
**What goes wrong:** Pausing automation for exactly 30 minutes regardless of schedule
**Why it happens:** Easier to implement fixed duration than calculating next schedule slot
**How to avoid:** Parse Netatmo schedule timetable, find next slot after current time
**Warning signs:** Automation resumes mid-schedule slot, or pauses extend unnecessarily long

### Pitfall 4: Per-Event Notification Limits
**What goes wrong:** Each event type has separate 30-minute window, user still gets spammed
**Why it happens:** Using rateLimiter.js per-type pattern instead of global throttle
**How to avoid:** Separate global deduplication service that ignores event type
**Warning signs:** User receives "Setpoint applied", "User override detected", "Automation paused" in quick succession

### Pitfall 5: Missing State Cleanup on Stove OFF
**What goes wrong:** pendingDebounce stays true, automation stays paused indefinitely
**Why it happens:** Only updating coordination state on successful actions, not on cancellations
**How to avoid:** Clear debounce state whenever stove transitions to OFF, regardless of timer state
**Warning signs:** Coordination state shows pendingDebounce: true but no timer exists

### Pitfall 6: API Polling for Manual Detection
**What goes wrong:** Detecting manual changes requires comparing current vs expected every minute
**Why it happens:** Netatmo doesn't provide webhook for setpoint changes
**How to avoid:** Store expected setpoint in coordination state, compare on each cron run - this IS the correct approach
**Warning signs:** None - polling is necessary, just ensure efficient comparison

### Pitfall 7: Multi-Zone Race Conditions
**What goes wrong:** Applying setpoints to 3 rooms in parallel, one fails, coordination state becomes inconsistent
**Why it happens:** Using Promise.all without error handling per room
**How to avoid:** Use Promise.allSettled pattern from healthMonitoring.js - log failures but continue
**Warning signs:** Some rooms get override, others don't; coordination state shows "all applied" but reality differs

## Code Examples

Verified patterns from official sources and existing codebase:

### Netatmo Temporary Setpoint Override
```javascript
// Source: lib/netatmoApi.js:143-161 + official docs
// https://dev.netatmo.com/apidocumentation/energy

async function applyTemporaryBoost(homeId, roomId, boostAmount, durationSeconds) {
  const { accessToken } = await getValidAccessToken();

  // Get current setpoint to calculate boost
  const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);
  const room = homeStatus.rooms?.find(r => r.id === roomId);
  const currentSetpoint = room?.therm_setpoint_temperature || 20;

  // Calculate new setpoint with cap at 30°C
  const newSetpoint = Math.min(currentSetpoint + boostAmount, 30);
  const endtime = Math.floor(Date.now() / 1000) + durationSeconds;

  // Apply manual mode with endtime (auto-reverts when time expires)
  const success = await NETATMO_API.setRoomThermpoint(accessToken, {
    home_id: homeId,
    room_id: roomId,
    mode: 'manual',
    temp: newSetpoint,
    endtime,
  });

  return { success, appliedSetpoint: newSetpoint, previousSetpoint: currentSetpoint };
}
```

### Debounce Timer with Early Cancellation
```javascript
// Source: Pattern from rateLimiter.js in-memory Map
// Adapted for coordination debouncing

const activeDebounceTimers = new Map(); // userId -> timer handle

async function debounceCoordinationAction(userId, stoveState, delayMs = 120000) {
  // Cancel existing timer if stove state changed during debounce
  if (activeDebounceTimers.has(userId)) {
    const existing = activeDebounceTimers.get(userId);

    // Stove turned OFF during ON debounce - apply shorter retry timer
    if (existing.targetState === 'ON' && stoveState === 'OFF') {
      clearTimeout(existing.timer);
      console.log('🔄 Stove OFF during debounce - applying 30s retry timer');
      return debounceCoordinationAction(userId, stoveState, 30000);
    }

    // Otherwise cancel
    clearTimeout(existing.timer);
    activeDebounceTimers.delete(userId);
  }

  // If stove OFF, cancel any pending override
  if (stoveState === 'OFF') {
    await updateCoordinationState({ pendingDebounce: false });
    return { cancelled: true, reason: 'stove_off' };
  }

  // Start new debounce timer
  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      console.log(`⏰ Debounce complete - applying coordination`);
      await applyCoordinationActions(userId);
      activeDebounceTimers.delete(userId);
      resolve({ applied: true });
    }, delayMs);

    activeDebounceTimers.set(userId, {
      timer,
      targetState: stoveState,
      startedAt: Date.now(),
    });
  });
}
```

### Pause Until Next Schedule Slot
```javascript
// Source: Netatmo API schedule structure
// Parse timetable to find next slot

function calculatePauseUntil(currentTime, netatmoSchedule) {
  const now = new Date(currentTime);
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const minutesSinceMidnightMonday =
    (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 + // Days since Monday
    now.getHours() * 60 +
    now.getMinutes();

  // Find next timetable slot
  const timetable = netatmoSchedule.timetable || [];
  const nextSlot = timetable.find(slot => slot.m_offset > minutesSinceMidnightMonday);

  if (nextSlot) {
    // Calculate actual timestamp of next slot
    const nextSlotMinutes = nextSlot.m_offset;
    const daysToAdd = Math.floor(nextSlotMinutes / (24 * 60));
    const minutesInDay = nextSlotMinutes % (24 * 60);

    const nextSlotTime = new Date(now);
    nextSlotTime.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + daysToAdd);
    nextSlotTime.setHours(Math.floor(minutesInDay / 60));
    nextSlotTime.setMinutes(minutesInDay % 60);
    nextSlotTime.setSeconds(0);

    return nextSlotTime.getTime();
  }

  // No next slot this week - return Monday midnight
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + (8 - (dayOfWeek === 0 ? 7 : dayOfWeek)));
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime();
}
```

### Global Notification Deduplication
```javascript
// Source: Pattern from rateLimiter.js extended to global scope

const globalNotificationWindow = new Map(); // userId -> lastNotificationTime

export async function sendCoordinationNotification(userId, eventType, message, actions = []) {
  const GLOBAL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  const lastSent = globalNotificationWindow.get(userId);

  // Check global throttle
  if (lastSent && (now - lastSent) < GLOBAL_WINDOW_MS) {
    const waitSeconds = Math.ceil((GLOBAL_WINDOW_MS - (now - lastSent)) / 1000);
    console.log(`⏭️ Notification throttled (global): wait ${waitSeconds}s`);

    // Still log to Firestore (history logging always happens)
    await logCoordinationEvent(userId, eventType, {
      message,
      notificationSent: false,
      throttledBy: 'global_window',
    });

    return { sent: false, reason: 'global_throttle', waitSeconds };
  }

  // Send notification
  const result = await sendNotification(userId, {
    type: eventType,
    title: 'Coordinamento Stufa-Termostato',
    body: message,
    actions, // e.g., [{ action: 'undo', title: 'Annulla' }]
  });

  if (result.success) {
    globalNotificationWindow.set(userId, now);
    await logCoordinationEvent(userId, eventType, {
      message,
      notificationSent: true,
    });
  }

  return result;
}
```

### Multi-Zone Coordination with Preferences
```javascript
// Source: Extended from netatmoStoveSync.js + user preferences pattern

async function applyMultiZoneCoordination(userId, stoveOn) {
  // Get user preferences
  const prefs = await getCoordinationPreferences(userId);

  if (!prefs.enabled || !prefs.zones?.length) {
    return { applied: false, reason: 'not_configured' };
  }

  const { accessToken } = await getValidAccessToken();
  const homeId = await adminDbGet(getEnvironmentPath('netatmo/home_id'));

  // Apply to each configured zone in parallel with graceful degradation
  const results = await Promise.allSettled(
    prefs.zones.map(async (zoneConfig) => {
      const boost = zoneConfig.boost || prefs.defaultBoost || 2;
      const roomId = zoneConfig.roomId;

      if (stoveOn) {
        // Get current setpoint
        const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);
        const room = homeStatus.rooms?.find(r => r.id === roomId);
        const currentSetpoint = room?.therm_setpoint_temperature || 20;

        // Apply boost with cap
        const newSetpoint = Math.min(currentSetpoint + boost, 30);
        const endtime = Math.floor(Date.now() / 1000) + (8 * 60 * 60);

        await NETATMO_API.setRoomThermpoint(accessToken, {
          home_id: homeId,
          room_id: roomId,
          mode: 'manual',
          temp: newSetpoint,
          endtime,
        });

        return { roomId, success: true, appliedSetpoint: newSetpoint };
      } else {
        // Restore previous setpoint or return to schedule
        const coordState = await getCoordinationState();
        const previousSetpoint = coordState.previousSetpoints?.[roomId];

        if (previousSetpoint) {
          await NETATMO_API.setRoomThermpoint(accessToken, {
            home_id: homeId,
            room_id: roomId,
            mode: 'manual',
            temp: previousSetpoint,
            endtime: Math.floor(Date.now() / 1000) + (8 * 60 * 60),
          });
        } else {
          await NETATMO_API.setRoomThermpoint(accessToken, {
            home_id: homeId,
            room_id: roomId,
            mode: 'home',
          });
        }

        return { roomId, success: true, restored: true };
      }
    })
  );

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  return {
    applied: successCount > 0,
    totalZones: prefs.zones.length,
    successCount,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| setRoomThermpoint without endtime | Manual mode with endtime parameter | Netatmo API v1+ | Manual setpoints now auto-revert, no schedule pollution |
| Fixed pause duration (30 min) | Dynamic pause until next schedule slot | 2024+ smart home patterns | Respects schedule structure, cleaner UX |
| Per-event rate limiting | Global notification deduplication | Event management best practices 2025 | Prevents notification fatigue across event types |
| Single-zone hardcoded | Multi-zone with user preferences | Multi-zone systems 2024+ | Supports complex home layouts, per-room control |
| Immediate action on state change | Debouncing with configurable delay | State machine patterns 2023+ | Prevents rapid cycling, handles transient states |

**Deprecated/outdated:**
- **setpoint_endtime in minutes:** Old API used minutes, current uses Unix timestamp (seconds since epoch)
- **Schedule modification for temp changes:** Never modify schedules - use manual mode overrides
- **Ignoring user manual changes:** Modern smart home systems respect user intent, pause automation
- **Fixed boost amount:** User-configurable per zone is now standard

## Open Questions

Things that couldn't be fully resolved:

1. **How to detect "next schedule slot" if Netatmo schedule isn't stored in Firebase?**
   - What we know: Netatmo API provides schedule via getHomesData, includes timetable structure
   - What's unclear: Should we cache schedule in Firebase or fetch on-demand for pause calculation?
   - Recommendation: Fetch on-demand when pause needed (rare event), use netatmoCacheService.js with 5-min TTL

2. **Should debounce timer state persist across server restarts?**
   - What we know: In-memory Map pattern used in rateLimiter.js doesn't persist
   - What's unclear: If server restarts during 2-min debounce, should coordination still apply?
   - Recommendation: Accept timer loss on restart - coordination will re-trigger on next cron cycle if stove still ON

3. **What if max setpoint (30°C) is reached before applying boost?**
   - What we know: Current setpoint 28°C + boost 2°C = 30°C (capped)
   - What's unclear: Should we notify user? Skip coordination? Reduce boost?
   - Recommendation: Cap at 30°C, send notification "Setpoint capped at 30°C", log event

4. **How to handle Netatmo API failures during coordination?**
   - What we know: Promise.allSettled handles per-room failures gracefully
   - What's unclear: If all rooms fail, should we pause automation to avoid retry loops?
   - Recommendation: Follow health monitoring pattern - log failure, don't block future attempts, alert after 3 consecutive failures

## Sources

### Primary (HIGH confidence)
- Existing codebase: `lib/netatmoStoveSync.js` - Multi-room coordination already implemented
- Existing codebase: `lib/netatmoApi.js:143-161` - setRoomThermpoint API wrapper with manual mode
- Existing codebase: `lib/rateLimiter.js` - In-memory Map pattern for timers and throttling
- Existing codebase: `lib/schemas/notificationPreferences.js` - Zod schema pattern for preferences
- [Netatmo Energy API Documentation](https://dev.netatmo.com/apidocumentation/energy) - Official API reference

### Secondary (MEDIUM confidence)
- [How is the Thermostat controlled? – Netatmo](https://helpcenter.netatmo.com/hc/en-us/articles/360009470039-How-is-the-Thermostat-controlled) - Manual mode behavior
- [Netatmo Connect | Energy API Documentation](https://dev.netatmo.com/apidocumentation/energy) - API parameters and modes
- [Smart automation that allows manual override - Home Assistant](https://community.home-assistant.io/t/smart-automation-that-allows-manual-override/944676) - User intent detection patterns
- [API Rate Limiting 2026 | How It Works & Why It Matters](https://www.levo.ai/resources/blogs/api-rate-limiting-guide-2026) - Throttling best practices
- [What is alert de-duplication? | Opsgenie](https://support.atlassian.com/opsgenie/docs/what-is-alert-de-duplication/) - Deduplication patterns

### Tertiary (LOW confidence)
- [JavaScript State Machines — A Tutorial](https://medium.com/@venkatperi/javascript-state-machines-a-tutorial-972863e37825) - State machine patterns (general education)
- [Debouncing in Javascript](https://dev.to/abhishekjain35/debouncing-in-javascript-276j) - Debounce implementation patterns (general)
- [Multi-zone heating automation - Home Assistant](https://community.home-assistant.io/t/multi-zone-heating-automation/241888) - Multi-zone coordination ideas (community discussion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Patterns proven in existing codebase (rateLimiter, netatmoStoveSync, healthMonitoring)
- Netatmo API usage: HIGH - Official documentation + existing working implementation
- User intent detection: MEDIUM - Industry best practice but no official Netatmo webhook, requires polling
- Debouncing implementation: HIGH - Well-established pattern in existing codebase
- Multi-zone coordination: MEDIUM - Structure exists but UI configuration needs design
- Notification deduplication: MEDIUM - Pattern extension of existing rateLimiter, needs global scope addition

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable APIs, existing codebase patterns unlikely to change)
