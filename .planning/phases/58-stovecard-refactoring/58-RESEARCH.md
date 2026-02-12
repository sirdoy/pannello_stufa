# Phase 58: StoveCard Refactoring - Research

**Researched:** 2026-02-12
**Domain:** React component refactoring, orchestrator pattern, custom hooks extraction
**Confidence:** HIGH

## Summary

Phase 58 refactors the monolithic 1458-line StoveCard.tsx into a maintainable orchestrator pattern with 5-6 sub-components and extracted custom hooks. The research investigates React component composition strategies, state management patterns for large components, custom hook extraction techniques, and error boundary integration.

**Key findings:**
- StoveCard contains multiple distinct responsibilities: status display, control buttons, mode management, maintenance tracking, Firebase sync, adaptive polling, error handling, and PWA offline features
- Existing codebase already has strong patterns: useRetryableCommand for commands, useAdaptivePolling for data fetching, useDeviceStaleness for staleness tracking
- Orchestrator pattern centralizes state/effects in parent, passes data as props to presentational children
- Single polling loop prevents request multiplication (critical for Phase 57 safety guarantees)
- Error boundaries wrap each major section independently (Phase 56 pattern)

**Primary recommendation:** Extract 6 sub-components (StoveStatus, StovePrimaryActions, StoveModeControl, StoveAdjustmentControls, StoveMaintenance, StoveBanners) + 2 custom hooks (useStoveData for polling/Firebase, useStoveCommands for command handlers), reducing main file to ~200 LOC orchestrator.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component composition, hooks | Next.js 15 uses React 19 |
| TypeScript | 5.7.3 | Type safety for props/hooks | Project migrated to strict TS (Phase 37-43) |
| class-variance-authority | 0.7.1 | Variant-based styling | Design system standard (Phase 44-48) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-error-boundary | 4.1.2 | Error boundary wrapper | Wrap each major sub-component section |
| date-fns | 4.1.0 | Date formatting | Staleness timestamps |
| Firebase RTDB | 11.1.0 | Real-time state sync | Already integrated in StoveCard |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom hooks | Context API | Context adds complexity, hooks are sufficient for component-local state |
| Orchestrator pattern | Container/Presentational split | Orchestrator keeps single polling loop guarantee (Phase 57 requirement) |
| Props drilling | React Context | Props drilling is clearer for 1-level depth (parent → child) |

**Installation:**

No new dependencies required. All refactoring uses existing stack.

---

## Architecture Patterns

### Recommended Project Structure

```
app/components/devices/stove/
├── StoveCard.tsx               # Orchestrator (~200 LOC)
├── components/
│   ├── StoveStatus.tsx         # Status display box with icon/badge (~150 LOC)
│   ├── StovePrimaryActions.tsx # Accendi/Spegni buttons (~100 LOC)
│   ├── StoveModeControl.tsx    # Manuale/Automatico/Semi-manuale (~200 LOC)
│   ├── StoveAdjustments.tsx    # Fan/Power sliders (~200 LOC)
│   ├── StoveMaintenance.tsx    # Maintenance bar + confirm cleaning (~100 LOC)
│   └── StoveBanners.tsx        # Error/Firebase/Pending commands banners (~150 LOC)
├── hooks/
│   ├── useStoveData.ts         # Polling + Firebase listeners (~200 LOC)
│   └── useStoveCommands.ts     # Command handlers (ignite/shutdown/setFan/setPower) (~150 LOC)
└── __tests__/
    └── StoveCard.test.tsx      # Orchestrator integration test
```

### Pattern 1: Orchestrator Pattern

**What:** Parent component manages all state and side effects, children are purely presentational (props in → UI out).

**When to use:** Large components (1000+ LOC) with multiple distinct UI sections that share common state.

**Example:**

```typescript
// StoveCard.tsx - Orchestrator (~200 LOC)
'use client';

import { useStoveData } from './hooks/useStoveData';
import { useStoveCommands } from './hooks/useStoveCommands';
import StoveStatus from './components/StoveStatus';
import StovePrimaryActions from './components/StovePrimaryActions';
import { ErrorBoundary } from 'react-error-boundary';

export default function StoveCard() {
  // Single source of truth: custom hooks
  const { status, fanLevel, powerLevel, loading, error, maintenance, scheduler } = useStoveData();
  const { handleIgnite, handleShutdown, handleFanChange, handlePowerChange } = useStoveCommands();

  if (loading) return <Skeleton.StovePanel />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card variant="elevated" padding={false}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <StoveStatus
            status={status}
            fanLevel={fanLevel}
            powerLevel={powerLevel}
            errorCode={error?.code}
          />
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <StovePrimaryActions
            status={status}
            onIgnite={handleIgnite}
            onShutdown={handleShutdown}
            needsMaintenance={maintenance.needsCleaning}
          />
        </ErrorBoundary>

        {/* Other sections... */}
      </Card>
    </div>
  );
}
```

**Rationale:** Orchestrator ensures single polling loop (Phase 57 requirement), centralizes state management, and makes data flow explicit (parent → child via props).

### Pattern 2: Custom Hook Extraction

**What:** Extract complex state logic into reusable custom hooks with clear input/output contracts.

**When to use:** When useEffect chains are > 50 LOC, or when multiple related state variables are managed together.

**Example:**

```typescript
// hooks/useStoveData.ts (~200 LOC)
export function useStoveData() {
  const [status, setStatus] = useState<string>('...');
  const [fanLevel, setFanLevel] = useState<number | null>(null);
  const [powerLevel, setPowerLevel] = useState<number | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState<any>(null);
  const [schedulerState, setSchedulerState] = useState<any>(null);

  // Single polling loop with adaptive intervals
  useAdaptivePolling({
    callback: fetchStatusAndUpdate,
    interval: usePollingFallback ? 10000 : (status !== 'spento' ? 15000 : 60000),
    alwaysActive: true, // StoveCard polling is ALWAYS active (Phase 57)
  });

  // Firebase real-time listener
  useEffect(() => {
    const stateRef = ref(db, isLocalEnvironment() ? 'dev/stove/state' : 'stove/state');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus(data.status);
        setFanLevel(data.fanLevel);
        setPowerLevel(data.powerLevel);
      }
    });
    return () => unsubscribe();
  }, []);

  return {
    status,
    fanLevel,
    powerLevel,
    maintenanceStatus,
    schedulerState,
    loading: initialLoading,
    error: errorCode !== 0 ? { code: errorCode, description: errorDescription } : null,
  };
}
```

**Rationale:** Hook encapsulates all polling/Firebase logic, exposing only necessary state. Orchestrator becomes simpler (no useEffect clutter).

### Pattern 3: Presentational Components with Props

**What:** Child components receive all data via props, contain NO state or side effects (unless purely UI-local like hover states).

**When to use:** For all sub-components in orchestrator pattern.

**Example:**

```typescript
// components/StoveStatus.tsx (~150 LOC)
interface StoveStatusProps {
  status: string;
  fanLevel: number | null;
  powerLevel: number | null;
  errorCode: number;
  sandboxMode: boolean;
  staleness: { isStale: boolean; cachedAt: string | null } | null;
}

export default function StoveStatus({
  status,
  fanLevel,
  powerLevel,
  errorCode,
  sandboxMode,
  staleness
}: StoveStatusProps) {
  const statusInfo = getStatusInfo(status);
  const statusDisplay = getStatusDisplay(status);

  return (
    <div className={`relative ${statusInfo.bgColor} rounded-2xl p-6`}>
      {/* Status display only - no state, no effects */}
      <Heading level={3} className={statusInfo.textColor}>
        {statusInfo.label}
      </Heading>
      {/* Info boxes for fan/power */}
    </div>
  );
}
```

**Rationale:** Pure components are easier to test (no mocking needed), more reusable, and visually debuggable (props in React DevTools).

### Pattern 4: Error Boundary per Section

**What:** Wrap each major sub-component in its own ErrorBoundary so failures are isolated.

**When to use:** For all sections that could throw errors (status display, controls, mode management).

**Example:**

```typescript
<ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleReset}>
  <StoveStatus {...statusProps} />
</ErrorBoundary>

<ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleReset}>
  <StovePrimaryActions {...actionProps} />
</ErrorBoundary>
```

**Rationale:** Phase 56 established error boundary pattern. Per-section boundaries prevent single component crash from taking down entire card.

### Anti-Patterns to Avoid

- **State in children:** Never add useState/useEffect in presentational components. Lifts orchestrator responsibility.
- **Multiple polling loops:** Only orchestrator polls. Children receive data via props. Multiple loops violate Phase 57 guarantees.
- **Context for simple props:** Don't use Context API for data that flows parent → child. Props are clearer.
- **Premature abstraction:** Don't extract hooks until logic exceeds ~50 LOC. Small useEffects can stay inline.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component composition | Manual state synchronization between parent/children | Orchestrator pattern with props | Prevents state drift, explicit data flow |
| Error boundaries | try/catch in components | react-error-boundary library | Phase 56 standard, resetKeys support |
| Polling management | Multiple setInterval calls | useAdaptivePolling hook | Phase 57 standard, visibility-aware |
| Command retry | Manual fetch retry logic | useRetryableCommand hook | Phase 55 standard, dedup + idempotency |
| State management | Custom state sync logic | Custom hooks (useStoveData, useStoveCommands) | Encapsulation, testability, reusability |

**Key insight:** Project already has robust infrastructure (Phase 55-57). Refactoring should leverage existing hooks, NOT recreate them. Main work is extracting JSX into sub-components and grouping related state into custom hooks.

---

## Common Pitfalls

### Pitfall 1: Breaking Single Polling Loop Guarantee

**What goes wrong:** Extracting components with their own useEffect polling creates multiple concurrent requests, violating Phase 57 "single polling loop" guarantee.

**Why it happens:** Developer adds polling to sub-component thinking it's "more encapsulated".

**How to avoid:**
- ONLY orchestrator (StoveCard.tsx) has polling/Firebase listeners
- Sub-components are ALWAYS presentational (props in → UI out)
- Use custom hooks (useStoveData) to encapsulate polling logic, but hook is ONLY called in orchestrator

**Warning signs:** Multiple useAdaptivePolling or useEffect(, []) calls across StoveCard and sub-components.

### Pitfall 2: Props Drilling Complexity

**What goes wrong:** Passing 10+ props through multiple levels becomes unmanageable.

**Why it happens:** Over-splitting components creates deep hierarchies.

**How to avoid:**
- Keep component tree shallow (orchestrator → 6 direct children, no grandchildren)
- Group related props into objects (e.g., `statusData={{ status, fanLevel, powerLevel }}`)
- If props exceed ~8 fields, consider whether component is too granular

**Warning signs:** Props spreading across 3+ levels, or components with > 10 props.

### Pitfall 3: Breaking Existing Functionality

**What goes wrong:** Refactoring changes behavior (polling intervals, Firebase sync, command dedup).

**Why it happens:** Complex interactions between state/effects not preserved during split.

**How to avoid:**
- Write integration test BEFORE refactoring (snapshot current behavior)
- Refactor incrementally: extract 1 component at a time, verify visually after each
- Keep all Phase 55-57 infrastructure untouched (useRetryableCommand, useAdaptivePolling, useDeviceStaleness)

**Warning signs:** Tests failing after refactor, visual differences in UI, polling behaving differently.

### Pitfall 4: Losing TypeScript Safety

**What goes wrong:** Props interfaces become `any` or too permissive, losing type safety.

**Why it happens:** Quick refactoring without defining strict prop types.

**How to avoid:**
- Define TypeScript interfaces for EVERY component's props
- Use strict types: `status: string` not `status: any`
- Leverage existing types from hooks (e.g., `ReturnType<typeof useStoveData>`)

**Warning signs:** `any` types in props, TypeScript errors suppressed with `@ts-ignore`.

---

## Code Examples

Verified patterns from existing codebase:

### Existing Hook Pattern (useRetryableCommand)

```typescript
// Phase 55 pattern - already in codebase
const igniteCmd = useRetryableCommand({ device: 'stove', action: 'ignite' });
const shutdownCmd = useRetryableCommand({ device: 'stove', action: 'shutdown' });

// Usage in component
const handleIgnite = async () => {
  const response = await igniteCmd.execute(STOVE_ROUTES.ignite, {
    method: 'POST',
    body: JSON.stringify({ source: 'manual' }),
  });
  if (response) {
    await logStoveAction.ignite();
    await fetchStatusAndUpdate();
  }
};
```

**Source:** `/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/hooks/useRetryableCommand.ts`

### Existing Polling Pattern (useAdaptivePolling)

```typescript
// Phase 57 pattern - already in codebase
useAdaptivePolling({
  callback: fetchStatusAndUpdate,
  interval: usePollingFallback ? 10000 : (stoveIsOn ? 15000 : 60000),
  alwaysActive: true, // StoveCard polling NEVER pauses (safety-critical)
  immediate: true,
});
```

**Source:** `/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/hooks/useAdaptivePolling.ts`

### Component Composition (ThermostatCard example)

```typescript
// Existing pattern from ThermostatCard.tsx (897 LOC)
// Already follows partial orchestrator pattern
export default function ThermostatCard() {
  // State management at top
  const [status, setStatus] = useState<any>(null);
  const { isOnline } = useOnlineStatus();
  const staleness = useDeviceStaleness('thermostat');

  // Polling
  useAdaptivePolling({
    callback: fetchStatus,
    interval: topology ? 30000 : null,
    alwaysActive: false,
  });

  // Render with sub-components
  return (
    <DeviceCard>
      <RoomSelector rooms={rooms} onSelect={setSelectedRoomId} />
      {/* Controls pass props, no internal state */}
    </DeviceCard>
  );
}
```

**Source:** `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/thermostat/ThermostatCard.tsx`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic 1500+ LOC files | Orchestrator pattern with sub-components | Phase 58 (now) | Maintainability, testability |
| Manual retry logic | useRetryableCommand hook | Phase 55 (2026-02-12) | Consistent error handling |
| Always-on polling | Adaptive polling with visibility awareness | Phase 57 (2026-02-12) | Resource efficiency |
| Global error handling | Per-section error boundaries | Phase 56 (2026-02-12) | Failure isolation |

**Deprecated/outdated:**
- Large monolithic device card files (1000+ LOC) are now considered tech debt (Phase 58-59 addresses this)
- Manual polling loops (replaced by useAdaptivePolling)
- Manual command error handling (replaced by useRetryableCommand)

---

## Refactoring Strategy

### Step 1: Baseline Test

Create integration test capturing current behavior:

```typescript
// __tests__/StoveCard.integration.test.tsx
describe('StoveCard - Baseline Behavior', () => {
  test('renders all sections with correct data', async () => {
    render(<StoveCard />);

    // Status display
    expect(screen.getByText(/IN FUNZIONE|SPENTA/)).toBeInTheDocument();

    // Primary actions
    expect(screen.getByRole('button', { name: /ACCENDI|SPEGNI/ })).toBeInTheDocument();

    // Mode control
    expect(screen.getByText(/Manuale|Automatica/)).toBeInTheDocument();

    // Adjustments (only when WORK)
    // Maintenance bar
    // Firebase sync indicator
  });
});
```

### Step 2: Extract Custom Hooks

Extract data fetching logic:

```typescript
// hooks/useStoveData.ts
export function useStoveData() {
  // Move all polling, Firebase listeners, state management here
  // Return stable object with all state
}
```

Extract command handlers:

```typescript
// hooks/useStoveCommands.ts
export function useStoveCommands(onStatusUpdate: () => void) {
  const igniteCmd = useRetryableCommand({ device: 'stove', action: 'ignite' });

  const handleIgnite = useCallback(async () => {
    await igniteCmd.execute(/* ... */);
    onStatusUpdate();
  }, [igniteCmd, onStatusUpdate]);

  return { handleIgnite, handleShutdown, handleFanChange, handlePowerChange };
}
```

### Step 3: Extract Presentational Components

One section at a time:

1. **StoveStatus** — Status display box (lines 1006-1118)
2. **StovePrimaryActions** — Accendi/Spegni buttons (lines 1120-1186)
3. **StoveModeControl** — Mode selector + next action (lines 1188-1298)
4. **StoveAdjustments** — Fan/Power controls (lines 1333-1452)
5. **StoveMaintenance** — Maintenance bar (lines 1326-1332)
6. **StoveBanners** — Error/Firebase/PWA banners (lines 901-982)

After each extraction:
- Run integration test
- Visual verification in browser
- Check TypeScript compiles with no errors

### Step 4: Orchestrator Assembly

Final StoveCard.tsx:

```typescript
export default function StoveCard() {
  const stoveData = useStoveData();
  const commands = useStoveCommands(stoveData.refetch);

  if (stoveData.loading) return <Skeleton.StovePanel />;

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding={false}>
        <CardAccentBar colorTheme="ember" animated pulse={stoveData.isAccesa} />

        <div className="p-6">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StoveBanners {...stoveData.bannerProps} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StoveStatus {...stoveData.statusProps} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StovePrimaryActions {...stoveData.actionProps} {...commands} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StoveModeControl {...stoveData.modeProps} {...commands} />
          </ErrorBoundary>

          {stoveData.showAdjustments && (
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <StoveAdjustments {...stoveData.adjustmentProps} {...commands} />
            </ErrorBoundary>
          )}

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StoveMaintenance {...stoveData.maintenanceProps} {...commands} />
          </ErrorBoundary>
        </div>
      </Card>
    </div>
  );
}
```

**Target:** ~200 LOC orchestrator (current: 1458 LOC).

---

## Open Questions

1. **Hook state initialization timing**
   - What we know: useStoveData will fetch on mount, orchestrator renders immediately
   - What's unclear: Loading state coordination between hook and orchestrator
   - Recommendation: useStoveData returns `{ loading, data, error }` pattern, orchestrator shows skeleton during loading

2. **Error boundary reset strategy**
   - What we know: ErrorBoundary has resetKeys prop for auto-reset on data change
   - What's unclear: Which state changes should trigger reset vs. require manual "Try Again"?
   - Recommendation: Auto-reset on successful data fetch (resetKeys={[status]}), manual reset for persistent errors

3. **TypeScript interface granularity**
   - What we know: Each component needs props interface
   - What's unclear: Should we have one large `StoveState` type or many small interfaces?
   - Recommendation: One central `StoveState` type (from useStoveData), then derive component-specific interfaces with Pick/Omit

---

## Sources

### Primary (HIGH confidence)

- **StoveCard.tsx** (current implementation) - Line count, structure, state management patterns
- **ThermostatCard.tsx, LightsCard.tsx** (existing device cards) - Component size comparison, partial orchestrator pattern
- **useRetryableCommand.ts** (Phase 55) - Command infrastructure integration
- **useAdaptivePolling.ts** (Phase 57) - Polling infrastructure integration
- **useDeviceStaleness.ts** (Phase 57) - Staleness tracking pattern
- **ROADMAP.md** (Phase 58 definition) - Success criteria, LOC targets, requirements

### Secondary (MEDIUM confidence)

- **React 19 Documentation** (component composition) - Orchestrator pattern, custom hooks best practices
- **TypeScript Handbook** (props typing) - Interface design for component props
- **react-error-boundary docs** (Phase 56) - Per-section error boundary pattern

### Tertiary (LOW confidence)

None — all research based on project codebase and official React/TypeScript documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, no new libraries needed
- Architecture: HIGH - Orchestrator pattern well-documented, Phase 57 establishes single polling requirement
- Pitfalls: HIGH - Based on existing codebase patterns and React best practices

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable React/TS ecosystem)

**Critical constraints:**
- MUST preserve Phase 57 single polling loop guarantee (StoveCard polling ALWAYS active, never paused)
- MUST preserve Phase 55 useRetryableCommand integration (no regression in command error handling)
- MUST preserve Phase 56 error boundary pattern (per-section isolation)
- MUST maintain visual output exactly (Ember Noir design, animations, responsive behavior)
- Target: ~200 LOC orchestrator, 5-6 sub-components of 150-250 LOC each
