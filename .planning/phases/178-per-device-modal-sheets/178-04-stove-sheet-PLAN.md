---
phase: 178
plan: 04
type: execute
wave: 2
depends_on: ['178-01', '178-02']
files_modified:
  - app/components/EmberGlass/sheets/StoveSheet.tsx
  - app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx
autonomous: true
requirements: [SHEET-02]
tags: [ember-glass, sheets, stove]
must_haves:
  truths:
    - "StoveSheet renders the bundle-verbatim hero (FlameViz + 'In funzione'/'Spenta' state caps + powerLevel/5 display)"
    - "Two SheetRows wire to useStoveCommands.handlePowerChange and handleFanChange via Stepper"
    - "2-col SheetBtn grid navigates to /stove/scheduler and /stove/maintenance"
    - "Primary action button toggles between 'Accendi stufa' (ignite) and 'Spegni stufa' (shutdown), disabled with 'Manutenzione richiesta' when needsMaintenance"
    - "Hero footnote drops Pellet + Obiettivo per Pitfall 11 (live useStoveData has no temp/target/pelletPercent)"
    - "Field adapter at top of file maps live hook fields to local variables (precedent: SonosCard.tsx:41-50)"
    - "Zero useMemo / useCallback"
    - "All interactive controls carry stable data-testid"
    - "T-OBS-1: StoveSheet hero displays the current flame-power level (1-5) with FlameViz visualization, large enough to read at arm's length (54px display per bundle sheets.jsx:81-92) — REQUIREMENTS.md SHEET-02 reworded to drop the room temperature readout (deferred until Thermorossi setpoint endpoint or Netatmo stove-room sensor wiring ships)"
  artifacts:
    - path: app/components/EmberGlass/sheets/StoveSheet.tsx
      provides: "SHEET-02 body — full StoveSheet implementation, replaces stub from Plan 178-02"
      min_lines: 120
    - path: app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx
      provides: "Jest spec covering on/off/needsMaintenance state + stepper wiring + primary action wiring"
      min_lines: 130
  key_links:
    - from: app/components/EmberGlass/sheets/StoveSheet.tsx
      to: app/components/devices/stove/hooks/useStoveData.ts
      via: "useStoveData({ checkVersion, userId })"
      pattern: "useStoveData\\("
    - from: app/components/EmberGlass/sheets/StoveSheet.tsx
      to: app/components/devices/stove/hooks/useStoveCommands.ts
      via: "useStoveCommands({ stoveData, router, user })"
      pattern: "useStoveCommands\\("
user_setup: []
---

<objective>
Ship the **StoveSheet** body component (SHEET-02 / CONTEXT D-05 / D-19) — the per-stove modal sheet body opened from `<StoveCard>` (Phase 177). Replaces the Plan 178-02 stub with the real bundle-verbatim implementation.

Bundle visual contract: `.planning/inbox/ember-glass-design/project/components/sheets.jsx:67-130` (verbatim, MINUS the dropped setpoint slider per CONTEXT Out of Scope).

**Field adapter (RESEARCH §"Field Gaps", Pitfall 11):**
- `s.on` → `stoveData.isAccesa: boolean`
- `s.power` → `stoveData.powerLevel ?? 1` (fallback to 1; hook returns `number | null`)
- `s.fan` → `stoveData.fanLevel ?? 1`
- `s.needsCleaning` → `stoveData.needsMaintenance: boolean`
- `s.temp` / `s.target` / `s.pelletPercent` → **DROPPED** (no live equivalent on hook). Hero shows `{powerLevel}/5` instead of `{temp}°C`. Footnote omitted entirely.

**Layout (top → bottom — UI-SPEC verbatim):**
1. Hero (rounded 24, padding 24×20, conditional gradient/neutral bg) with `<FlameViz on={isAccesa} intensity={powerLevel/5} />` + state caps + `{powerLevel}/5` 54px display.
2. `<SheetRow label="Livello fiamma" value={`${powerLevel}/5`}>` containing `<Stepper>` calling `handlePowerChange({target:{value:String(v)}})`.
3. `<SheetRow label="Ventola" value={`${fanLevel}/5`}>` containing `<Stepper>` calling `handleFanChange({target:{value:String(v)}})`.
4. 2-col grid of `<SheetBtn>` buttons — `Calendar`/"Orari" → `router.push('/stove/scheduler')`; `AlertTriangle`/"Manutenzione" → `router.push('/stove/maintenance')`.
5. Primary action button — `Power` icon + label/handler dependent on `isAccesa`/`needsMaintenance` per CONTEXT D-05.

**Italian copy frozen (D-19):** `In funzione` / `Spenta` / `Livello fiamma` / `Ventola` / `Orari` / `Manutenzione` / `Accendi stufa` / `Spegni stufa` / `Manutenzione richiesta`.

Purpose: Ship SHEET-02 — stove control surface inside the dashboard sheet.
Output: 1 .tsx (replaces stub), 1 jest spec.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@.planning/phases/178-per-device-modal-sheets/178-RESEARCH.md
@.planning/inbox/ember-glass-design/project/components/sheets.jsx
@app/components/EmberGlass/cards/StoveCard.tsx
@app/components/devices/stove/hooks/useStoveData.ts
@app/components/devices/stove/hooks/useStoveCommands.ts
@app/components/EmberGlass/FlameViz.tsx

<interfaces>
<!-- VERIFIED via useStoveData.ts (Plan author read lines 30-345): -->
<!--   UseStoveDataParams = { checkVersion, userId } -->
<!--   UseStoveDataReturn fields used: -->
<!--     isAccesa: boolean -->
<!--     powerLevel: number | null   (1..5 Thermorossi proxy field) -->
<!--     fanLevel: number | null     (1..5) -->
<!--     needsMaintenance: boolean   (memory pattern; blocks ignite when true) -->
<!--     initialLoading: boolean     (true until first fetch — D-26 skeleton trigger) -->
<!--     errorCode / errorDescription (NOT an Error instance — D-27 fallback only on 'string' branch) -->
<!--     setRefreshing/setLoading/etc — passed through to useStoveCommands -->
<!-- -->
<!-- VERIFIED via useStoveCommands.ts (Plan author read lines 30-90): -->
<!--   UseStoveCommandsParams = { stoveData: Pick<UseStoveDataReturn, 'setLoading'|'setLoadingMessage'|'fetchStatusAndUpdate'|...|'semiManualMode'>, router, user } -->
<!--   UseStoveCommandsReturn handlers used by StoveSheet: -->
<!--     handleIgnite() => Promise<void> -->
<!--     handleShutdown() => Promise<void> -->
<!--     handlePowerChange(e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => Promise<void> -->
<!--     handleFanChange(e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => Promise<void> -->
<!-- -->
<!-- StoveCard already wires the same hooks (StoveCard.tsx:34-79) — copy the plumbing. -->
<!-- -->
<!-- FlameViz.tsx (Phase 176): <FlameViz on={boolean} intensity={number 0..1} /> -->
<!-- -->
<!-- Pitfall 2: STOVE_ROUTES.scheduler does NOT exist. Use literal strings '/stove/scheduler' / -->
<!--           '/stove/maintenance' (Pitfall 2 option (a), recommended). -->
<!-- -->
<!-- Pitfall 4: useStoveData() requires { checkVersion, userId } params from useVersion() + useUser(). -->
<!-- -->
<!-- D-04 / UI-SPEC §"Sheet exit animation timing": StoveSheet does NOT receive onClose prop. -->
<!--   SheetBtn onClick uses router.push only — auto-unmount on navigation accepts hard-cut UX. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement StoveSheet body + jest spec</name>
  <files>
    app/components/EmberGlass/sheets/StoveSheet.tsx,
    app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 67-130 — bundle visual source for StoveSheet)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Sheet Body Contracts → StoveSheet" + §Color AUDIT-EXCEPTIONS for StoveSheet)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 55-122 — verbatim hero + primary action code)
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§Pitfall 11 — drop temp/target/pellet; §Pitfall 2 — literal route strings; §Pitfall 4 — hook param objects)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-05, D-19, D-24, D-26, D-27, D-33, D-34)
    - app/components/EmberGlass/cards/StoveCard.tsx (FULL FILE — hook plumbing reference; StoveSheet strips wrapper but reuses the same hook param shapes)
    - app/components/devices/stove/hooks/useStoveData.ts (lines 30-90 — `UseStoveDataReturn` fields)
    - app/components/devices/stove/hooks/useStoveCommands.ts (lines 30-90 — handler signatures, especially the `{ target: { value: string } }` adapter shape)
    - app/components/EmberGlass/FlameViz.tsx (verify `<FlameViz on intensity>` props)
    - app/components/EmberGlass/sheets/primitives/SheetRow.tsx (Plan 178-01)
    - app/components/EmberGlass/sheets/primitives/Stepper.tsx (Plan 178-01)
    - app/components/EmberGlass/sheets/primitives/SheetBtn.tsx (Plan 178-01)
  </read_first>
  <behavior>
    StoveSheet renders + wires:
    - Test 1: when `isAccesa === true && powerLevel === 3 && fanLevel === 2 && needsMaintenance === false`, the sheet renders:
      - `data-testid="stove-sheet"` root.
      - `data-testid="stove-sheet-state"` containing text `In funzione`.
      - `data-testid="stove-sheet-temp"` containing `3` and the `/5` superscript.
      - Two SheetRows with labels "Livello fiamma" and "Ventola"; values `3/5` and `2/5`.
      - `data-testid="stove-sheet-power-stepper"` (the Stepper wrapper for power).
      - `data-testid="stove-sheet-fan-stepper"` (the Stepper wrapper for fan).
      - SheetBtn buttons with labels "Orari" and "Manutenzione".
      - `data-testid="stove-sheet-primary-action"` button with label `Spegni stufa`.

    - Test 2: when `isAccesa === false && needsMaintenance === false`, the primary action label is `Accendi stufa` and the button has `disabled === false`.

    - Test 3: when `needsMaintenance === true && isAccesa === false`, primary action label is `Manutenzione richiesta` AND button has `disabled === true`.

    - Test 4: clicking power Stepper plus invokes `handlePowerChange({ target: { value: '4' } })` (when initial power is 3) — assert via mock.

    - Test 5: clicking fan Stepper minus invokes `handleFanChange({ target: { value: '1' } })` (when initial fan is 2) — assert via mock.

    - Test 6: clicking primary action when `isAccesa === false` invokes `handleIgnite()`.
    - Test 7: clicking primary action when `isAccesa === true` invokes `handleShutdown()`.
    - Test 8: clicking primary action when `needsMaintenance === true` does NOT invoke either handler (button is disabled).

    - Test 9: clicking SheetBtn "Orari" calls `router.push('/stove/scheduler')`.
    - Test 10: clicking SheetBtn "Manutenzione" calls `router.push('/stove/maintenance')`.

    - Test 11 (D-26 loading skeleton): when `initialLoading === true && powerLevel === null`, the body renders ONLY a single skeleton block (e.g. `data-testid="stove-sheet-skeleton"`), no other content.

    - Test 12 (D-27 error state): when the hook returns an error condition (mock `errorDescription = 'boom'` and no cached data), the body renders `Non raggiungibile. Riprova più tardi.` text. Per RESEARCH Open Q3: `useStoveData` exposes `errorCode/errorDescription` (string), not `Error` instance — render the description verbatim as the secondary line.

    - Test 13: zero useMemo / useCallback in the source file (grep gate).
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/StoveSheet.tsx`** (replaces Plan 178-02 stub):

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Calendar, AlertTriangle, Power, TriangleAlert } from 'lucide-react';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import { useVersion } from '@/app/context/VersionContext';
import { FlameViz } from '../FlameViz';
import { SheetRow } from './primitives/SheetRow';
import { Stepper } from './primitives/Stepper';
import { SheetBtn } from './primitives/SheetBtn';

/**
 * StoveSheet (SHEET-02 / CONTEXT D-05) — body-only component (D-04). No props;
 * self-fetches via existing useStoveData + useStoveCommands hooks.
 *
 * Visual contract verbatim from bundle `sheets.jsx:67-130` MINUS the dropped setpoint slider
 * (Pitfall 11: useStoveData exposes no temp/target/pelletPercent — hero shows powerLevel/5).
 *
 * Mounted by Phase 177 StoveCard.tsx inside <Sheet open onClose title="Stufa">.
 *
 * Sheet sub-primitives are NOT wrapped in <Pressable> (D-24) — they are bare buttons.
 * No useMemo / useCallback (D-33) — React Compiler 1.0 auto-memoizes.
 */
export function StoveSheet() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });

  // Field adapter (RESEARCH §"Field Gaps") — bundle assumed s.temp/s.target/s.pelletPercent;
  // none exist on the live hook. Use semantic substitutes.
  const isAccesa = stoveData.isAccesa;
  const powerLevel = stoveData.powerLevel ?? 1;
  const fanLevel = stoveData.fanLevel ?? 1;
  const needsCleaning = stoveData.needsMaintenance;

  const cmds = useStoveCommands({
    stoveData: {
      setLoading: stoveData.setLoading,
      setLoadingMessage: stoveData.setLoadingMessage,
      fetchStatusAndUpdate: stoveData.fetchStatusAndUpdate,
      setSchedulerEnabled: stoveData.setSchedulerEnabled,
      setSemiManualMode: stoveData.setSemiManualMode,
      setReturnToAutoAt: stoveData.setReturnToAutoAt,
      setNextScheduledAction: stoveData.setNextScheduledAction,
      setCleaningInProgress: stoveData.setCleaningInProgress,
      fetchMaintenanceStatus: stoveData.fetchMaintenanceStatus,
      semiManualMode: stoveData.semiManualMode,
    },
    router,
    user,
  });

  // Loading skeleton (D-26)
  if (stoveData.initialLoading && stoveData.powerLevel === null) {
    return (
      <div
        data-testid="stove-sheet-skeleton"
        style={{
          height: 360,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (D-27) — useStoveData reports errorDescription (string) per Open Q3.
  // Show only when no cached data is available.
  if (
    stoveData.errorDescription &&
    stoveData.powerLevel === null &&
    stoveData.fanLevel === null
  ) {
    return (
      <div
        data-testid="stove-sheet-error"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 0',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          Non raggiungibile. Riprova più tardi.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {stoveData.errorDescription}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="stove-sheet">
      {/* Hero block (bundle sheets.jsx:71-92, minus dropped temp/target/pellet) */}
      <div
        style={{
          borderRadius: 24,
          padding: '24px 20px',
          background: isAccesa
            ? 'linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)'
            : 'rgba(255,255,255,0.03)', // AUDIT-EXCEPTION (sheets.jsx:76)
          border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:77)
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <FlameViz on={isAccesa} intensity={powerLevel / 5} />
        <div style={{ flex: 1 }}>
          <div
            data-testid="stove-sheet-state"
            style={{
              fontSize: 12,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {isAccesa ? 'In funzione' : 'Spenta'}
          </div>
          <div
            data-testid="stove-sheet-temp"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 54,
              fontWeight: 600,
              color: '#fff', // AUDIT-EXCEPTION
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {powerLevel}
            <span style={{ fontSize: 22, opacity: 0.5 }}>/5</span>
          </div>
          {/* Hero footnote dropped per Pitfall 11 (no target / pelletPercent on hook) */}
        </div>
      </div>

      {/* Livello fiamma row */}
      <div data-testid="stove-sheet-power-stepper">
        <SheetRow label="Livello fiamma" value={`${powerLevel}/5`}>
          <Stepper
            value={powerLevel}
            min={1}
            max={5}
            onChange={(v) =>
              void cmds.handlePowerChange({ target: { value: String(v) } })
            }
          />
        </SheetRow>
      </div>

      {/* Ventola row */}
      <div data-testid="stove-sheet-fan-stepper">
        <SheetRow label="Ventola" value={`${fanLevel}/5`}>
          <Stepper
            value={fanLevel}
            min={1}
            max={5}
            onChange={(v) =>
              void cmds.handleFanChange({ target: { value: String(v) } })
            }
          />
        </SheetRow>
      </div>

      {/* 2-col SheetBtn grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 22,
        }}
      >
        <SheetBtn
          Icon={Calendar}
          label="Orari"
          onClick={() => router.push('/stove/scheduler')}
        />
        <SheetBtn
          Icon={AlertTriangle}
          label="Manutenzione"
          onClick={() => router.push('/stove/maintenance')}
        />
      </div>

      {/* Primary action button */}
      <button
        type="button"
        data-testid="stove-sheet-primary-action"
        disabled={needsCleaning}
        onClick={() =>
          void (isAccesa ? cmds.handleShutdown() : cmds.handleIgnite())
        }
        style={{
          marginTop: 18,
          width: '100%',
          height: 56,
          borderRadius: 18,
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 600,
          cursor: needsCleaning ? 'not-allowed' : 'pointer',
          opacity: needsCleaning ? 0.6 : 1,
          background: isAccesa
            ? 'rgba(255, 77, 92, 0.15)' // AUDIT-EXCEPTION (sheets.jsx:119) — destructive ember
            : 'var(--accent)',
          color: isAccesa ? '#ff6676' : '#1a0f08', // AUDIT-EXCEPTION (sheets.jsx:120)
          border: isAccesa ? '0.5px solid rgba(255, 77, 92, 0.25)' : 'none', // AUDIT-EXCEPTION
          boxShadow: isAccesa
            ? 'none'
            : '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
        data-sheet-focusable="true"
      >
        <Power size={18} strokeWidth={2.2} />
        {needsCleaning
          ? 'Manutenzione richiesta'
          : isAccesa
            ? 'Spegni stufa'
            : 'Accendi stufa'}
      </button>
    </div>
  );
}
```

**File 2: `app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx`** — mock the data + commands hooks AND `useRouter`/`useUser`/`useVersion`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StoveSheet } from '../StoveSheet';

// --- Mocks ---
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'auth0|test' } }),
}));
jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn() }),
}));

const mockHandleIgnite = jest.fn().mockResolvedValue(undefined);
const mockHandleShutdown = jest.fn().mockResolvedValue(undefined);
const mockHandlePowerChange = jest.fn().mockResolvedValue(undefined);
const mockHandleFanChange = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handleIgnite: mockHandleIgnite,
    handleShutdown: mockHandleShutdown,
    handlePowerChange: mockHandlePowerChange,
    handleFanChange: mockHandleFanChange,
  }),
}));

const baseStoveData = {
  isAccesa: false,
  powerLevel: 3 as number | null,
  fanLevel: 2 as number | null,
  needsMaintenance: false,
  initialLoading: false,
  errorDescription: null as string | null,
  errorCode: null,
  setLoading: jest.fn(),
  setLoadingMessage: jest.fn(),
  fetchStatusAndUpdate: jest.fn(),
  setSchedulerEnabled: jest.fn(),
  setSemiManualMode: jest.fn(),
  setReturnToAutoAt: jest.fn(),
  setNextScheduledAction: jest.fn(),
  setCleaningInProgress: jest.fn(),
  fetchMaintenanceStatus: jest.fn(),
  semiManualMode: false,
};

let stoveDataOverride: Partial<typeof baseStoveData> = {};

jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({ ...baseStoveData, ...stoveDataOverride }),
}));

jest.mock('../../FlameViz', () => ({
  FlameViz: (props: { on: boolean; intensity: number }) => (
    <div
      data-testid="flame-viz-mock"
      data-on={String(props.on)}
      data-intensity={String(props.intensity)}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  stoveDataOverride = {};
});

describe('StoveSheet (SHEET-02 / CONTEXT D-05)', () => {
  it('renders OFF state hero + power/fan rows + Orari/Manutenzione + Accendi primary', () => {
    stoveDataOverride = { isAccesa: false, powerLevel: 3, fanLevel: 2 };
    render(<StoveSheet />);
    expect(screen.getByTestId('stove-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('Spenta');
    expect(screen.getByTestId('stove-sheet-temp')).toHaveTextContent('3');
    expect(screen.getByText('Livello fiamma')).toBeInTheDocument();
    expect(screen.getByText('Ventola')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-btn-orari')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-btn-manutenzione')).toBeInTheDocument();
    expect(screen.getByTestId('stove-sheet-primary-action')).toHaveTextContent(
      'Accendi stufa',
    );
  });

  it('renders ON state hero + Spegni primary', () => {
    stoveDataOverride = { isAccesa: true, powerLevel: 4, fanLevel: 3 };
    render(<StoveSheet />);
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('In funzione');
    expect(screen.getByTestId('stove-sheet-primary-action')).toHaveTextContent(
      'Spegni stufa',
    );
  });

  it('disables primary action with Manutenzione richiesta when needsMaintenance', () => {
    stoveDataOverride = { isAccesa: false, needsMaintenance: true };
    render(<StoveSheet />);
    const btn = screen.getByTestId('stove-sheet-primary-action');
    expect(btn).toHaveTextContent('Manutenzione richiesta');
    expect(btn).toBeDisabled();
  });

  it('clicking power stepper plus invokes handlePowerChange with String(value+1)', () => {
    stoveDataOverride = { powerLevel: 3 };
    render(<StoveSheet />);
    const powerWrap = screen.getByTestId('stove-sheet-power-stepper');
    const plus = powerWrap.querySelector('[data-testid="stepper-plus"]') as HTMLElement;
    fireEvent.click(plus);
    expect(mockHandlePowerChange).toHaveBeenCalledWith({
      target: { value: '4' },
    });
  });

  it('clicking fan stepper minus invokes handleFanChange with String(value-1)', () => {
    stoveDataOverride = { fanLevel: 2 };
    render(<StoveSheet />);
    const fanWrap = screen.getByTestId('stove-sheet-fan-stepper');
    const minus = fanWrap.querySelector('[data-testid="stepper-minus"]') as HTMLElement;
    fireEvent.click(minus);
    expect(mockHandleFanChange).toHaveBeenCalledWith({
      target: { value: '1' },
    });
  });

  it('clicking primary action when off invokes handleIgnite', () => {
    stoveDataOverride = { isAccesa: false };
    render(<StoveSheet />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleIgnite).toHaveBeenCalledTimes(1);
    expect(mockHandleShutdown).not.toHaveBeenCalled();
  });

  it('clicking primary action when on invokes handleShutdown', () => {
    stoveDataOverride = { isAccesa: true };
    render(<StoveSheet />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
    expect(mockHandleIgnite).not.toHaveBeenCalled();
  });

  it('disabled primary action does not fire ignite or shutdown', () => {
    stoveDataOverride = { needsMaintenance: true };
    render(<StoveSheet />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleIgnite).not.toHaveBeenCalled();
    expect(mockHandleShutdown).not.toHaveBeenCalled();
  });

  it('Orari button navigates to /stove/scheduler', () => {
    render(<StoveSheet />);
    fireEvent.click(screen.getByTestId('sheet-btn-orari'));
    expect(mockPush).toHaveBeenCalledWith('/stove/scheduler');
  });

  it('Manutenzione button navigates to /stove/maintenance', () => {
    render(<StoveSheet />);
    fireEvent.click(screen.getByTestId('sheet-btn-manutenzione'));
    expect(mockPush).toHaveBeenCalledWith('/stove/maintenance');
  });

  it('renders single skeleton block when initialLoading and no cached data', () => {
    stoveDataOverride = { initialLoading: true, powerLevel: null, fanLevel: null };
    render(<StoveSheet />);
    expect(screen.getByTestId('stove-sheet-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('stove-sheet')).not.toBeInTheDocument();
  });

  it('renders error state when errorDescription is set and no cached data', () => {
    stoveDataOverride = {
      errorDescription: 'boom',
      powerLevel: null,
      fanLevel: null,
    };
    render(<StoveSheet />);
    expect(screen.getByTestId('stove-sheet-error')).toBeInTheDocument();
    expect(
      screen.getByText('Non raggiungibile. Riprova più tardi.'),
    ).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
```

NOTE: the `setRefreshing` field doesn't exist on `UseStoveDataReturn` — verify in `useStoveData.ts:30-90` and adjust the `Pick<>` shape passed to `useStoveCommands` accordingly. Use the FULL set listed in `UseStoveCommandsParams` from `useStoveCommands.ts:33-47`. The plan author's `Pick<>` block above mirrors that file exactly — verify by reading `useStoveCommands.ts:33-47` before implementing.
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/StoveSheet.tsx` exists and contains:
      - `'use client'` directive.
      - `useStoveData({ checkVersion, userId: user?.sub })`.
      - `useStoveCommands({ stoveData: { ... }, router, user })` with the proper `Pick<>` fields.
      - The string `'In funzione'` AND `'Spenta'`.
      - The string `'Livello fiamma'` AND `'Ventola'`.
      - The string `'Accendi stufa'` AND `'Spegni stufa'` AND `'Manutenzione richiesta'`.
      - Literal route strings `'/stove/scheduler'` AND `'/stove/maintenance'`.
      - `<FlameViz on={isAccesa} intensity={powerLevel / 5} />`.
      - `data-testid="stove-sheet"`, `stove-sheet-state`, `stove-sheet-temp`, `stove-sheet-power-stepper`, `stove-sheet-fan-stepper`, `stove-sheet-primary-action`, `stove-sheet-skeleton`, `stove-sheet-error`.
      - Hero footnote (Pellet/Obiettivo line) is NOT rendered (Pitfall 11).
    - Spec file ships and exits 0 with at least 11 `it(` cases.
    - `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/StoveSheet.tsx` returns no hits.
    - `! grep -E "STOVE_ROUTES\\.scheduler|STOVE_ROUTES\\.maintenance" app/components/EmberGlass/sheets/StoveSheet.tsx` returns no hits (Pitfall 2 honored — literal strings only).
  </acceptance_criteria>
  <done>
    StoveSheet ships GREEN; jest spec covers state/wiring/loading/error; Pitfall 2 + Pitfall 11 honored; bundle-verbatim visuals tagged AUDIT-EXCEPTION.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → useStoveCommands → /api/v1/thermorossi/* | Existing routes; auth enforced server-side |
| client → router.push('/stove/scheduler' \| '/stove/maintenance') | Local Next.js routing — no auth surface |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-04-01 | Tampering | Stove ignite while needsMaintenance | mitigate | `disabled={needsCleaning}` + `cursor: 'not-allowed'`; tested. Server-side: existing maintenance gate in useStoveCommands.handleIgnite (memory pattern v17.0). |
| T-178-04-02 | Tampering | Optimistic stepper writes spam | accept | Each Stepper click fires handlePowerChange / handleFanChange wrapped by useRetryableCommand idempotency keys. No client-side debounce per CONTEXT D-28 (discrete clicks; the existing retry layer handles transient failure). |
| T-178-04-03 | Information Disclosure | Stove state caps reveal stove on/off to user | accept | Sheet only opens when user is auth'd; data is the user's own home. No leakage. |
</threat_model>

<verification>
```bash
npm run test:components -- app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] `StoveSheet.tsx` ships with bundle-verbatim hero + 2 SheetRows + 2-col SheetBtn grid + primary action.
- [ ] All Italian copy strings present and match D-19 verbatim.
- [ ] Field adapter handles powerLevel/fanLevel/needsMaintenance/isAccesa correctly per RESEARCH §"Field Gaps".
- [ ] Pitfall 2 (literal route strings) and Pitfall 11 (no temp/target/pellet rendering) honored.
- [ ] Jest spec exits 0 with state/wiring/loading/error coverage.
- [ ] Zero useMemo / useCallback in source.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-04-SUMMARY.md`.
</output>
