# Phase 59: LightsCard & Page Refactoring - Research

**Researched:** 2026-02-12
**Domain:** React component refactoring, orchestrator pattern application, custom hooks extraction
**Confidence:** HIGH

## Summary

Phase 59 applies the Phase 58 orchestrator pattern to two remaining large files: LightsCard (1225 LOC) and stove/page.tsx (1066 LOC). The research leverages the successful Phase 58 implementation as a template, investigating the specific state management, command patterns, and UI sections in both files to determine optimal extraction strategies.

**Key findings:**
- LightsCard (1225 LOC) contains Philips Hue integration with room controls, scene activation, pairing wizard, brightness sliders, and color controls
- stove/page.tsx (1066 LOC) is similar to StoveCard.tsx but with full-page layout instead of card layout
- Phase 58 established proven orchestrator pattern: custom hooks (useStoveData, useStoveCommands) + 6 presentational sub-components → ~200 LOC orchestrator
- Both files follow similar structure to StoveCard: polling/Firebase, retry infrastructure, state management, multiple UI sections
- LightsCard uses useAdaptivePolling (unlike StoveCard's custom loop), has pairing wizard (unique 5-step flow), and color controls
- stove/page.tsx duplicates 90% of StoveCard.tsx logic but renders in full page layout with toast notifications

**Primary recommendation:** Extract LightsCard following Phase 58 pattern (useLightsData + useLightsCommands + 4-5 sub-components), and refactor stove/page.tsx to REUSE StoveCard orchestrator logic with a layout wrapper instead of duplicating code.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component composition, hooks | Next.js 15 uses React 19 |
| TypeScript | 5.7.3 | Type safety for props/hooks | Project strict TS (Phase 44-48) |
| class-variance-authority | 0.7.1 | Variant-based styling | Design system standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useRetryableCommand | Phase 55 | Command retry infrastructure | All device commands (ignite, shutdown, Hue room control, scene activation) |
| useAdaptivePolling | Phase 57 | Visibility-aware polling | LightsCard (30s intervals), NOT stove/page (uses custom polling like StoveCard) |
| Firebase RTDB | 11.1.0 | Real-time state sync | stove/page.tsx only (lights don't use Firebase) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reuse StoveCard logic | Duplicate in stove/page.tsx | Current approach duplicates 900+ LOC of state/effects — massive tech debt |
| Orchestrator pattern | Keep monolithic | LightsCard 1225 LOC is unmaintainable, Phase 58 proved 6x LOC reduction works |
| Custom hooks | useContext for shared state | Hooks are simpler for single-component state, Context adds unnecessary complexity |

**Installation:**

No new dependencies required. All refactoring uses existing Phase 58 patterns.

---

## Architecture Patterns

### Pattern 1: Orchestrator Pattern (Phase 58 Template)

**What:** Parent component manages all state and side effects via custom hooks, children are purely presentational (props in → UI out).

**When to use:** Large components (1000+ LOC) with multiple distinct UI sections sharing common state.

**Example from Phase 58:**

```typescript
// StoveCard.tsx - Orchestrator (~200 LOC)
export default function StoveCard() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  const commands = useStoveCommands({ stoveData, router, user });

  const statusInfo = getStatusInfo(stoveData.status);
  const statusDisplay = getStatusDisplay(stoveData.status);

  if (stoveData.initialLoading) return <Skeleton.StovePanel />;

  return (
    <Card variant="elevated" padding={false}>
      <StoveBanners {...bannerProps} />
      <StoveStatus {...statusProps} />
      <StovePrimaryActions {...actionProps} {...commands} />
      <StoveModeControl {...modeProps} {...commands} />
      {stoveData.isOnline && stoveData.status?.includes('WORK') && (
        <StoveAdjustments {...adjustmentProps} {...commands} />
      )}
      {stoveData.maintenanceStatus && <StoveMaintenance {...maintenanceProps} />}
    </Card>
  );
}
```

**For LightsCard:**

```typescript
// LightsCard.tsx - Orchestrator (~200 LOC)
export default function LightsCard() {
  const router = useRouter();
  const lightsData = useLightsData();
  const commands = useLightsCommands({ lightsData, router });

  if (lightsData.loading) return <Skeleton.LightsPanel />;

  return (
    <DeviceCard>
      <LightsBanners {...bannerProps} />
      <RoomSelector rooms={lightsData.rooms} onSelect={lightsData.setSelectedRoomId} />
      <LightsControls {...controlProps} {...commands} />
      <LightsScenes scenes={lightsData.roomScenes} onActivate={commands.handleSceneActivate} />
      {lightsData.pairing && <PairingWizard {...pairingProps} {...commands} />}
    </DeviceCard>
  );
}
```

**For stove/page.tsx:**

```typescript
// stove/page.tsx - Layout wrapper (~150 LOC)
export default function StovePage() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  const commands = useStoveCommands({ stoveData, router, user });
  const [toast, setToast] = useState(null);

  // Toast integration for page-level notifications
  useEffect(() => {
    if (stoveData.lastSyncedCommand) {
      setToast({ message: '...', variant: 'success' });
    }
  }, [stoveData.lastSyncedCommand]);

  return (
    <>
      {toast && <Toast {...toast} />}
      <div className="full-page-layout">
        {/* Reuse ALL StoveCard sub-components */}
        <StoveBanners {...bannerProps} />
        <StoveStatus {...statusProps} />
        <StovePrimaryActions {...actionProps} {...commands} />
        <StoveModeControl {...modeProps} {...commands} />
        {/* ... */}
      </div>
    </>
  );
}
```

**Rationale:** stove/page.tsx should NOT duplicate hooks/logic — it should REUSE StoveCard's hooks and sub-components with different layout styling.

---

### Pattern 2: Custom Hook Extraction (Phase 58 Pattern)

**What:** Extract complex state logic into reusable custom hooks with clear input/output contracts.

**When to use:** When useEffect chains are > 50 LOC, or when multiple related state variables are managed together.

**LightsCard extraction strategy:**

**useLightsData.ts (~250 LOC):**
- All useState: loading, error, connected, connectionMode, rooms, lights, scenes, selectedRoomId, pairing state
- All useRef: connectionCheckedRef, pairingTimerRef
- useAdaptivePolling for 30s data refresh (Phase 57 pattern)
- Data fetching: checkConnection, fetchData
- Helper functions: getGroupedLightId, room/light filtering
- Return: all state + derived state (selectedRoom, roomLights, roomScenes, hasColorLights, lightsOnCount, allLightsOn, etc.)

**useLightsCommands.ts (~200 LOC):**
- useRetryableCommand for hueRoomCmd, hueSceneCmd (Phase 55 pattern)
- Command handlers: handleRoomToggle, handleBrightnessChange, handleSceneActivate, handleAllLightsToggle, handleLightToggle, handleColorChange
- Pairing handlers: handleStartPairing, handleSelectBridge, handleCancelPairing
- Return: all handlers + retryable command objects

**stove/page.tsx extraction strategy:**

**NO NEW HOOKS NEEDED** — reuse useStoveData and useStoveCommands from Phase 58.

Only add page-specific logic:
- Toast notification state (useState)
- Toast integration effect (useEffect)
- Layout wrapper JSX

---

### Pattern 3: Presentational Components with Props

**What:** Child components receive all data via props, contain NO state or side effects (unless purely UI-local like hover states or slider dragging).

**When to use:** For all sub-components in orchestrator pattern.

**LightsCard sub-components:**

1. **LightsBanners** (~80 LOC) — Error banner, pairing status banner, connection mode indicator
2. **LightsControls** (~200 LOC) — Room on/off toggle, brightness slider, all lights toggle
3. **LightsScenes** (~150 LOC) — Scene grid with activation buttons
4. **LightsIndividualControls** (~200 LOC) — Individual light on/off + brightness + color picker (if room has color lights)
5. **PairingWizard** (~250 LOC) — 5-step pairing flow (discovering, waitingForButtonPress, pairing, success, selectBridge)

**stove/page.tsx sub-components:**

REUSE ALL 6 StoveCard sub-components:
- StoveStatus
- StovePrimaryActions
- StoveBanners
- StoveModeControl
- StoveAdjustments
- StoveMaintenance

**Example (LightsControls):**

```typescript
interface LightsControlsProps {
  selectedRoom: any;
  selectedRoomGroupedLightId: string | null;
  allLightsOn: boolean;
  allLightsOff: boolean;
  lightsOnCount: number;
  lightsOffCount: number;
  localBrightness: number | null;
  setLocalBrightness: (val: number | null) => void;
  onRoomToggle: (roomId: string, on: boolean) => void;
  onBrightnessChange: (roomId: string, brightness: string) => void;
  onAllLightsToggle: (on: boolean) => void;
  refreshing: boolean;
}

export default function LightsControls({
  selectedRoom,
  selectedRoomGroupedLightId,
  allLightsOn,
  allLightsOff,
  lightsOnCount,
  lightsOffCount,
  localBrightness,
  setLocalBrightness,
  onRoomToggle,
  onBrightnessChange,
  onAllLightsToggle,
  refreshing
}: LightsControlsProps) {
  // Local slider state for smooth dragging (UI-only, no side effects)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalBrightness(parseFloat(e.target.value));
  };

  const handleSliderRelease = () => {
    if (localBrightness !== null) {
      onBrightnessChange(selectedRoomGroupedLightId, String(localBrightness));
    }
  };

  return (
    <div>
      {/* Room toggle button */}
      <Button
        variant={allLightsOn ? 'ember' : 'outline'}
        onClick={() => onRoomToggle(selectedRoomGroupedLightId, !allLightsOn)}
        disabled={refreshing}
      >
        {allLightsOn ? 'Spegni stanza' : 'Accendi stanza'}
      </Button>

      {/* Brightness slider */}
      <Slider
        value={localBrightness || selectedRoom?.dimming?.brightness || 0}
        onChange={handleSliderChange}
        onMouseUp={handleSliderRelease}
        onTouchEnd={handleSliderRelease}
      />

      {/* All lights toggle */}
      <Button onClick={() => onAllLightsToggle(!allLightsOn)}>
        {allLightsOn ? 'Spegni tutte' : 'Accendi tutte'}
      </Button>
    </div>
  );
}
```

**Rationale:** localBrightness is UI-local state (smooth slider dragging), NOT business logic. Component is still presentational because it doesn't fetch data or manage device state.

---

### Pattern 4: Pairing Wizard as State Machine

**What:** Multi-step wizard with 5 states managed via pairingStep state enum.

**States:**
1. `discovering` — Searching for local bridges
2. `waitingForButtonPress` — User must press button on bridge
3. `pairing` — Creating user credential
4. `success` — Pairing complete
5. `selectBridge` — Multiple bridges found, user selects one

**Implementation:**

```typescript
// useLightsData.ts
const [pairing, setPairing] = useState(false);
const [pairingStep, setPairingStep] = useState<'discovering' | 'waitingForButtonPress' | 'pairing' | 'success' | 'noLocalBridge' | 'selectBridge' | null>(null);
const [discoveredBridges, setDiscoveredBridges] = useState<any[]>([]);
const [selectedBridge, setSelectedBridge] = useState<any>(null);
const [pairingCountdown, setPairingCountdown] = useState(30);
const [pairingError, setPairingError] = useState<string | null>(null);

// PairingWizard.tsx - Presentational
export default function PairingWizard({ pairingStep, discoveredBridges, selectedBridge, pairingCountdown, pairingError, onSelectBridge, onCancelPairing }) {
  if (pairingStep === 'discovering') {
    return <div>Ricerca bridge in corso...</div>;
  }

  if (pairingStep === 'selectBridge') {
    return (
      <div>
        {discoveredBridges.map(bridge => (
          <button onClick={() => onSelectBridge(bridge)}>{bridge.name}</button>
        ))}
      </div>
    );
  }

  if (pairingStep === 'waitingForButtonPress') {
    return (
      <div>
        Premi il pulsante sul bridge entro {pairingCountdown}s
        <button onClick={onCancelPairing}>Annulla</button>
      </div>
    );
  }

  // ... other states
}
```

**Rationale:** State machine logic lives in useLightsData hook, PairingWizard renders appropriate UI for current step.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component composition | Duplicate StoveCard logic in stove/page.tsx | Reuse useStoveData + useStoveCommands hooks | DRY principle, avoid 900+ LOC duplication |
| Polling management | Multiple useAdaptivePolling calls | Single polling loop in useLightsData | Phase 57 pattern, prevents request multiplication |
| Command retry | Manual fetch retry logic | useRetryableCommand hook | Phase 55 standard, dedup + idempotency |
| State management | Multiple useState scattered in file | Custom hooks (useLightsData, useLightsCommands) | Phase 58 pattern, encapsulation, testability |
| Pairing wizard | Complex inline conditional rendering | Separate PairingWizard component with state machine | Separation of concerns, maintainability |

**Key insight:** stove/page.tsx should NOT recreate StoveCard logic — it should REUSE Phase 58 hooks and sub-components with different layout wrapper.

---

## Common Pitfalls

### Pitfall 1: Duplicating StoveCard Logic in stove/page.tsx

**What goes wrong:** Current stove/page.tsx duplicates 90% of StoveCard.tsx logic (polling, Firebase, state management, command handlers) just to render in full-page layout instead of card layout.

**Why it happens:** Developers create separate page component thinking layout differences require separate logic.

**How to avoid:**
- Recognize that state management is orthogonal to layout
- Extract shared logic to custom hooks (useStoveData, useStoveCommands) — Phase 58 already did this
- Both StoveCard AND stove/page.tsx should call the SAME hooks
- Only difference: StoveCard wraps in `<Card>`, stove/page.tsx wraps in `<div className="full-page-layout">`

**Warning signs:** Identical useState, useEffect, fetch functions in both files.

### Pitfall 2: Breaking useAdaptivePolling Pattern

**What goes wrong:** LightsCard uses useAdaptivePolling (Phase 57), but refactoring might create multiple polling loops if sub-components also call polling.

**Why it happens:** Developer adds polling to LightsControls thinking it needs "real-time updates".

**How to avoid:**
- ONLY useLightsData hook calls useAdaptivePolling
- Sub-components are ALWAYS presentational (props in → UI out)
- Polling callback is fetchData function inside hook, NOT exposed to orchestrator

**Warning signs:** Multiple useAdaptivePolling calls across LightsCard and sub-components.

### Pitfall 3: Slider State Management Confusion

**What goes wrong:** Brightness slider needs local state for smooth dragging (avoid API calls on every pixel), but this conflicts with "no state in presentational components" rule.

**Why it happens:** Confusion between UI-local state (slider position) and business state (actual device brightness).

**How to avoid:**
- UI-local state (localBrightness) is ALLOWED in presentational components if it's purely for smooth UX
- Only call API on slider release (onMouseUp/onTouchEnd), not onChange
- Component is still presentational because it doesn't manage device state — parent passes actual brightness, component temporarily overrides for dragging smoothness

**Warning signs:** API calls on every slider onChange event, laggy slider UX.

### Pitfall 4: Pairing Wizard Complexity Leaking

**What goes wrong:** Pairing wizard has 5 states, 30-second countdown timer, bridge selection, error handling — all of this leaks into LightsCard orchestrator making it 500+ LOC.

**Why it happens:** Developer tries to handle all wizard logic inline.

**How to avoid:**
- Extract PairingWizard as separate component with 250 LOC
- All wizard state managed in useLightsData hook
- PairingWizard component receives: `{ pairingStep, discoveredBridges, selectedBridge, pairingCountdown, pairingError, onSelectBridge, onCancelPairing }`
- Wizard renders appropriate UI for current pairingStep — orchestrator just shows/hides wizard based on `pairing` boolean

**Warning signs:** Orchestrator has > 200 LOC, lots of conditional rendering based on pairingStep.

---

## Code Examples

Verified patterns from Phase 58:

### Custom Hook Pattern (useStoveData)

```typescript
// Phase 58 pattern - already in codebase
export function useStoveData({ checkVersion, userId }: UseStoveDataParams): UseStoveDataReturn {
  const [status, setStatus] = useState<string>('...');
  const [fanLevel, setFanLevel] = useState<number | null>(null);
  // ... all state

  // Existing infrastructure hooks
  const { isOnline } = useOnlineStatus();
  const staleness = useDeviceStaleness('stove');

  // Polling (custom loop for StoveCard, useAdaptivePolling for LightsCard)
  useAdaptivePolling({
    callback: fetchData,
    interval: connected ? 30000 : null,
    alwaysActive: false,
  });

  // Firebase listener
  useEffect(() => {
    const stateRef = ref(db, 'stove/state');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus(data.status);
        setFanLevel(data.fanLevel);
      }
    });
    return () => unsubscribe();
  }, []);

  return {
    status,
    fanLevel,
    isOnline,
    staleness,
    // ... all state + derived state + setters + fetch functions
  };
}
```

**Source:** `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/stove/hooks/useStoveData.ts`

### Command Hook Pattern (useStoveCommands)

```typescript
// Phase 58 pattern - already in codebase
export function useStoveCommands(params: UseStoveCommandsParams): UseStoveCommandsReturn {
  const { stoveData, router, user } = params;

  // Retry infrastructure - one hook per command type (React hooks rules)
  const igniteCmd = useRetryableCommand({ device: 'stove', action: 'ignite' });
  const shutdownCmd = useRetryableCommand({ device: 'stove', action: 'shutdown' });

  const handleIgnite = useCallback(async () => {
    stoveData.setLoadingMessage('Accensione stufa...');
    stoveData.setLoading(true);
    try {
      const response = await igniteCmd.execute(STOVE_ROUTES.ignite, {
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      });
      if (response) {
        await logStoveAction.ignite();
        await stoveData.fetchStatusAndUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      stoveData.setLoading(false);
    }
  }, [igniteCmd, stoveData]);

  return {
    handleIgnite,
    handleShutdown,
    // ... all handlers + retryable command objects
    igniteCmd,
    shutdownCmd,
  };
}
```

**Source:** `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/stove/hooks/useStoveCommands.ts`

### Orchestrator Pattern (StoveCard)

```typescript
// Phase 58 - final orchestrator ~200 LOC
export default function StoveCard() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  const commands = useStoveCommands({
    stoveData: {
      setLoading: stoveData.setLoading,
      setLoadingMessage: stoveData.setLoadingMessage,
      fetchStatusAndUpdate: stoveData.fetchStatusAndUpdate,
      // ... other required fields
    },
    router,
    user,
  });

  const statusInfo = getStatusInfo(stoveData.status);
  const statusDisplay = getStatusDisplay(stoveData.status);

  if (stoveData.initialLoading) {
    return <Skeleton.StovePanel />;
  }

  return (
    <Card variant="elevated" padding={false}>
      <LoadingOverlay show={stoveData.loading} message={stoveData.loadingMessage} icon="🔥" />

      <StoveBanners
        errorCode={stoveData.errorCode}
        needsMaintenance={stoveData.needsMaintenance}
        // ... props
      />

      <StoveStatus
        status={stoveData.status}
        fanLevel={stoveData.fanLevel}
        // ... props
      />

      <StovePrimaryActions
        isAccesa={stoveData.isAccesa}
        onIgnite={commands.handleIgnite}
        // ... props
      />

      {stoveData.isOnline && (
        <StoveModeControl
          schedulerEnabled={stoveData.schedulerEnabled}
          onSetManualMode={commands.handleSetManualMode}
          // ... props
        />
      )}

      {stoveData.isOnline && stoveData.status?.includes('WORK') && (
        <StoveAdjustments
          fanLevel={stoveData.fanLevel}
          onFanChange={commands.handleFanChange}
          // ... props
        />
      )}

      {stoveData.maintenanceStatus && (
        <StoveMaintenance maintenanceStatus={stoveData.maintenanceStatus} />
      )}
    </Card>
  );
}
```

**Source:** `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/stove/StoveCard.tsx`

---

## LightsCard Specific Patterns

### Color Support Detection

```typescript
// LightsCard.tsx - lines 99-100
const hasColorLights = roomLights.some((light: any) => supportsColor(light));
```

**Usage:** Conditionally render color picker only if room has color-capable lights.

### Grouped Light ID Extraction

```typescript
// LightsCard.tsx - lines 77-81
const getGroupedLightId = (room: any): string | null => {
  if (!room?.services) return null;
  const groupedLight = room.services.find((s: any) => s.rtype === 'grouped_light');
  return groupedLight?.rid || null;
};
```

**Usage:** Hue API v2 uses `grouped_light` service for room-level commands.

### Brightness Slider with Local State

```typescript
// LightsCard.tsx - lines 35, 223-248
const [localBrightness, setLocalBrightness] = useState<number | null>(null);

async function handleBrightnessChange(roomId: string | null | undefined, brightness: string) {
  setRefreshing(true);
  const response = await hueRoomCmd.execute(`/api/hue/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify({ dimming: { brightness: parseFloat(brightness) } }),
  });
  if (response) {
    await fetchData();
  }
  setRefreshing(false);
}

// In JSX:
<Slider
  value={localBrightness || selectedRoom?.dimming?.brightness || 0}
  onChange={(e) => setLocalBrightness(parseFloat(e.target.value))}
  onMouseUp={() => handleBrightnessChange(selectedRoomGroupedLightId, String(localBrightness))}
/>
```

**Pattern:** Local state for smooth dragging, API call only on release (onMouseUp/onTouchEnd).

---

## stove/page.tsx Specific Patterns

### Toast Notification Integration

```typescript
// stove/page.tsx - lines 74-75, 224-234
const [toast, setToast] = useState<{ message: string; icon?: string; variant?: 'success' | 'error' | 'warning' | 'info' } | null>(null);

useEffect(() => {
  if (lastSyncedCommand) {
    const actionLabels = {
      'stove/ignite': '🔥 Stufa accesa (sincronizzato)',
      'stove/shutdown': '🌙 Stufa spenta (sincronizzato)',
      'stove/set-power': '⚡ Potenza impostata (sincronizzato)',
    };
    const message = actionLabels[(lastSyncedCommand as any).endpoint as keyof typeof actionLabels] || 'Comando sincronizzato';
    setToast({ message, variant: 'success' });
    fetchStatusAndUpdate();
  }
}, [lastSyncedCommand, fetchStatusAndUpdate]);
```

**Usage:** Page-level toast for background sync notifications. This is the ONLY difference from StoveCard — everything else should be reused.

### Analytics Consent Headers

```typescript
// stove/page.tsx - lines 24-32
const getAnalyticsHeaders = (): HeadersInit => {
  const consent = canTrackAnalytics() ? 'granted' : 'denied';
  return { 'x-analytics-consent': consent };
};
```

**Pattern:** GDPR-compliant analytics headers for fetch calls. This logic should move to fetch wrapper, not duplicated in every file.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic 1000+ LOC files | Orchestrator pattern with sub-components | Phase 58 (2026-02-12) | Maintainability, testability |
| Duplicate logic in Card + Page | Reuse hooks across components | Phase 59 (now) | DRY principle, eliminate 900+ LOC duplication |
| Manual retry logic | useRetryableCommand hook | Phase 55 (2026-02-12) | Consistent error handling |
| Always-on polling | Adaptive polling with visibility awareness | Phase 57 (2026-02-12) | Resource efficiency |

**Deprecated/outdated:**
- Large monolithic device card files (1000+ LOC) are now considered tech debt (Phase 58-59 addresses this)
- Duplicating state management logic between card and page versions of same device
- Inline pairing wizard logic (should be extracted component)

---

## Refactoring Strategy

### Step 1: LightsCard Extraction

**1.1. Create useLightsData hook (~250 LOC):**
- Move all useState (18 state variables)
- Move all useRef (2 refs)
- Move data fetching (checkConnection, fetchData)
- Move helper functions (getGroupedLightId, room/light filtering)
- useAdaptivePolling for 30s polling
- Return all state + derived state + setters + fetch functions

**1.2. Create useLightsCommands hook (~200 LOC):**
- useRetryableCommand for hueRoomCmd, hueSceneCmd
- Move all command handlers (handleRoomToggle, handleBrightnessChange, handleSceneActivate, handleAllLightsToggle, handleLightToggle, handleColorChange)
- Move pairing handlers (handleStartPairing, handleSelectBridge, handleCancelPairing)
- Return all handlers + retryable command objects

**1.3. Create sub-components:**
- **LightsBanners** (~80 LOC) — Error, pairing status, connection mode
- **LightsControls** (~200 LOC) — Room toggle, brightness slider, all lights toggle
- **LightsScenes** (~150 LOC) — Scene grid
- **LightsIndividualControls** (~200 LOC) — Individual light controls + color picker
- **PairingWizard** (~250 LOC) — 5-step pairing flow

**1.4. Finalize LightsCard orchestrator (~200 LOC):**
- Call useLightsData, useLightsCommands
- Render sub-components with props

**Target:** LightsCard 1225 LOC → ~200 LOC orchestrator + 5 sub-components (880 LOC) + 2 hooks (450 LOC) = ~1530 LOC total (accounting for extracted logic that was previously inline)

### Step 2: stove/page.tsx Deduplication

**2.1. Remove ALL duplicated logic:**
- Delete useState declarations (reuse from useStoveData)
- Delete useEffect polling (reuse from useStoveData)
- Delete Firebase listeners (reuse from useStoveData)
- Delete command handlers (reuse from useStoveCommands)
- Delete data fetching functions (reuse from useStoveData)

**2.2. Keep ONLY page-specific logic:**
- Toast notification state (useState)
- Toast integration effect (useEffect)
- Full-page layout wrapper JSX

**2.3. Import and reuse Phase 58 components:**
- useStoveData hook
- useStoveCommands hook
- All 6 StoveCard sub-components (StoveStatus, StovePrimaryActions, StoveBanners, StoveModeControl, StoveAdjustments, StoveMaintenance)

**2.4. Final structure:**

```typescript
export default function StovePage() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();

  // REUSE Phase 58 hooks
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  const commands = useStoveCommands({ stoveData, router, user });

  // PAGE-SPECIFIC: Toast notification
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (stoveData.lastSyncedCommand) {
      setToast({ message: '...', variant: 'success' });
    }
  }, [stoveData.lastSyncedCommand]);

  if (stoveData.initialLoading) return <Skeleton.StovePanel />;

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="full-page-layout p-6">
        {/* REUSE ALL StoveCard sub-components with same props */}
        <LoadingOverlay show={stoveData.loading} message={stoveData.loadingMessage} icon="🔥" />

        <StoveBanners {...bannerProps} />
        <StoveStatus {...statusProps} />
        <StovePrimaryActions {...actionProps} {...commands} />

        {stoveData.isOnline && (
          <StoveModeControl {...modeProps} {...commands} />
        )}

        {stoveData.isOnline && stoveData.status?.includes('WORK') && (
          <StoveAdjustments {...adjustmentProps} {...commands} />
        )}

        {stoveData.maintenanceStatus && (
          <StoveMaintenance maintenanceStatus={stoveData.maintenanceStatus} />
        )}
      </div>
    </>
  );
}
```

**Target:** stove/page.tsx 1066 LOC → ~150 LOC (toast + layout wrapper only)

---

## Open Questions

1. **LightsCard RoomSelector component**
   - What we know: RoomSelector is already extracted as reusable component
   - What's unclear: Should it be treated as sub-component or infrastructure component?
   - Recommendation: Keep RoomSelector as-is (reusable UI component), include in LightsCard orchestrator composition

2. **Pairing wizard countdown timer**
   - What we know: 30-second countdown with setInterval
   - What's unclear: Should timer logic be in useLightsData or PairingWizard component?
   - Recommendation: Timer logic in useLightsData hook (state management), PairingWizard just displays current countdown value (presentational)

3. **stove/page.tsx layout differences**
   - What we know: stove/page.tsx renders in full-page layout, StoveCard renders in card
   - What's unclear: Should layout differences require separate components or just CSS classes?
   - Recommendation: Same sub-components, different wrapper (StoveCard wraps in `<Card>`, stove/page.tsx wraps in `<div className="full-page-layout">`)

4. **Color picker state management**
   - What we know: Color picker allows RGB selection, sends to Hue API
   - What's unclear: Local state for color dragging (like brightness slider) or direct API calls?
   - Recommendation: Use local state pattern like brightness slider (smooth UX), API call on release

---

## Sources

### Primary (HIGH confidence)

- **StoveCard.tsx** (Phase 58 final implementation) - Orchestrator pattern template, ~200 LOC target
- **useStoveData.ts** (Phase 58) - Custom hook pattern, state management encapsulation
- **useStoveCommands.ts** (Phase 58) - Command hook pattern, useRetryableCommand integration
- **LightsCard.tsx** (current implementation) - 1225 LOC, structure analysis, pairing wizard, color controls
- **stove/page.tsx** (current implementation) - 1066 LOC, duplication analysis, toast integration
- **Phase 58 RESEARCH.md** - Orchestrator pattern documentation, anti-patterns, pitfalls
- **Phase 58 PLANs** - Task breakdown, extraction strategy, verification steps
- **useRetryableCommand.ts** (Phase 55) - Retry infrastructure integration
- **useAdaptivePolling.ts** (Phase 57) - Polling infrastructure integration

### Secondary (MEDIUM confidence)

- **React 19 Documentation** (component composition) - Orchestrator pattern, custom hooks best practices
- **TypeScript Handbook** (props typing) - Interface design for component props

### Tertiary (LOW confidence)

None — all research based on project codebase and Phase 58 implementation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, Phase 58 established patterns
- Architecture: HIGH - Orchestrator pattern proven in Phase 58, LightsCard structure analyzed, stove/page.tsx duplication identified
- Pitfalls: HIGH - Based on Phase 58 learnings and current file analysis

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable React/TS ecosystem)

**Critical constraints:**
- MUST follow Phase 58 orchestrator pattern (proven template)
- MUST eliminate stove/page.tsx duplication (reuse useStoveData + useStoveCommands)
- MUST preserve useAdaptivePolling integration in LightsCard (Phase 57 pattern)
- MUST preserve useRetryableCommand integration (Phase 55 pattern)
- MUST maintain visual output exactly (Ember Noir design, animations, responsive behavior)
- Target: LightsCard ~200 LOC orchestrator + 5 sub-components, stove/page.tsx ~150 LOC layout wrapper

**Phase 58 patterns to apply:**
- Custom hooks: useXxxData (state + polling + listeners), useXxxCommands (handlers + retry)
- Presentational sub-components: props in → UI out, NO state/effects
- Orchestrator: ~200 LOC, hook calls + component composition
- Single polling loop guarantee (only in useXxxData hook)
- Header sections stay inline if < 10 lines
- Date formatting in presentational components is rendering logic (not state management)
