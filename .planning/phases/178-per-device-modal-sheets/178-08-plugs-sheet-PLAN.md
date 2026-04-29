---
phase: 178
plan: 08
type: execute
wave: 2
depends_on: ['178-01', '178-02']
files_modified:
  - app/components/EmberGlass/sheets/PlugsSheet.tsx
  - app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx
autonomous: true
requirements: [SHEET-06]
tags: [ember-glass, sheets, plugs, tuya]
must_haves:
  truths:
    - "PlugsSheet renders 2-col summary grid (Accese count + Consumo total power)"
    - "Power formatting: ≥1000W → '{X.YY}' + 'kW' suffix; <1000W → '{N}' + 'W' suffix (bundle verbatim)"
    - "Per-plug subtitle drops the {room} segment (Pitfall 8) — TuyaPlug has no room field; subtitle shows just power or empty"
    - "Per-plug InlineToggle (#ffb84a) invokes useTuyaCommands.togglePlug(deviceId, currentState)"
    - "Field adapter maps custom_name → name, switch_on → on, power_w → power, device_id → id"
    - "Zero useMemo / useCallback"
    - "Tuya only — DirigeraCard NOT in scope (no useDirigeraCommands exists)"
    - "T7: PlugsSheet ships with a 2-segment subtitle (name + power) per Phase 178 deferred-items decision; room mapping ships in a follow-up phase pending a useDeviceRegistry() join hook"
  artifacts:
    - path: app/components/EmberGlass/sheets/PlugsSheet.tsx
      provides: "SHEET-06 body — Tuya plugs control sheet replacing Plan 178-02 stub"
      min_lines: 130
    - path: app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx
      provides: "Jest spec — summary cards + kW/W boundaries + per-plug toggle wiring"
      min_lines: 130
  key_links:
    - from: app/components/EmberGlass/sheets/PlugsSheet.tsx
      to: app/components/devices/tuya/hooks/useTuyaData.ts
      via: "useTuyaData()"
      pattern: "useTuyaData\\("
    - from: app/components/EmberGlass/sheets/PlugsSheet.tsx
      to: app/components/devices/tuya/hooks/useTuyaCommands.ts
      via: "useTuyaCommands().togglePlug"
      pattern: "togglePlug\\("
user_setup: []
---

<objective>
Ship the **PlugsSheet** body (SHEET-06 / CONTEXT D-09 / D-23). Bundle visual contract: `sheets.jsx:400-466` verbatim. Consumes `useTuyaData` + `useTuyaCommands` (existing). **Tuya only** — DirigeraCard keeps placeholder per CONTEXT Out of Scope (no `useDirigeraCommands` exists).

**Layout (UI-SPEC verbatim):**
1. **Summary 2-col grid** (gap 10, marginBottom 18):
   - Left card (orange tint `rgba(255,184,74,0.08)`): "Accese" eyebrow + 28px display `{onCount}/ {plugs.length}`.
   - Right card (white-04 bg): "Consumo" eyebrow + 28px display total power with auto kW/W formatting.
2. **Plug list container** (rounded 18, white-04 bg). Per row:
   - 36×36 plug-tile (orange tint when on, neutral when off).
   - Stack: name (14px 500) + subtitle (11px text-2): `{p.room}{p.on && p.power > 0 ? ' · {power}' : ''}`. **Pitfall 8: drop the `{p.room}` segment** when room is unknown (TuyaPlug has no `room` field). The bundle's "P.room · {power}W" becomes just "{power}W" when on, empty when off.
   - InlineToggle (#ffb84a) invoking `togglePlug(p.id, p.on)`.

**Field adapter (Pitfall 8 + RESEARCH §"Field Gaps"):**
```ts
const plugs = (tuyaData.plugs ?? []).map((p) => ({
  id: p.device_id,
  name: p.custom_name ?? p.device_id,
  on: p.switch_on === true,
  power: p.power_w ?? 0,
  // No `room` field on TuyaPlug — subtitle excludes it.
}));
```

**Power formatting** (bundle `sheets.jsx:432-433, 457` verbatim):
- Total power: `≥1000 → (totalPower/1000).toFixed(2)` + `'kW'` suffix; else `totalPower` + `'W'` suffix.
- Per-plug subtitle: `≥1000 → (p.power/1000).toFixed(1) + 'kW'` (1 decimal for per-row, 2 for summary); else `p.power + 'W'`.

**Italian copy frozen (D-23):** `Accese`, `Consumo`. No room copy (Pitfall 8). 

**Pitfall 10 callout:** `useTuyaCommands.togglePlug` does NOT use `useRetryableCommand`. Failures are silent; UI relies on next data tick to revert optimistic state. Document in JSDoc.

Purpose: Ship SHEET-06 — Tuya plugs control surface inside the dashboard sheet.
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
@app/components/EmberGlass/cards/TuyaCard.tsx
@app/components/devices/tuya/hooks/useTuyaData.ts
@app/components/devices/tuya/hooks/useTuyaCommands.ts
@app/components/EmberGlass/InlineToggle.tsx
@types/tuyaProxy.ts

<interfaces>
<!-- VERIFIED via useTuyaData.ts + types/tuyaProxy.ts: -->
<!--   plugs: TuyaPlug[] | null    { device_id, switch_on (boolean | null), power_w (number | null), -->
<!--                                  custom_name, device_type, voltage_v, current_ma, energy_kwh, ... } -->
<!--   loading, error, fetchData -->
<!-- -->
<!-- NO `room` field on TuyaPlug — Pitfall 8. -->
<!-- -->
<!-- VERIFIED via useTuyaCommands.ts: -->
<!--   useTuyaCommands(): { togglePlug(deviceId: string, currentState: boolean): Promise<void> } -->
<!--   No params, no useRetryableCommand wrap (Pitfall 10). -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement PlugsSheet body + jest spec</name>
  <files>
    app/components/EmberGlass/sheets/PlugsSheet.tsx,
    app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 400-466 — bundle visual source)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Sheet Body Contracts → PlugsSheet" + §Color values + §Copywriting PlugsSheet)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 276-309 — verbatim power formatting + field adapter)
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§Pitfall 8 — drop room segment; §Pitfall 10 — togglePlug no retry; §"Field Gaps" → PlugsSheet)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-09, D-23, D-26, D-27, D-28, D-33, D-34)
    - app/components/EmberGlass/cards/TuyaCard.tsx (FULL FILE — hook plumbing reference)
    - app/components/devices/tuya/hooks/useTuyaData.ts (return shape)
    - app/components/devices/tuya/hooks/useTuyaCommands.ts (togglePlug signature)
    - types/tuyaProxy.ts (TuyaPlug shape — confirm absence of `room`)
    - app/components/EmberGlass/InlineToggle.tsx (existing primitive)
  </read_first>
  <behavior>
    PlugsSheet:
    - Test 1: with 4 plugs (2 on, 2 off; total power 750W from one plug at 750W), renders:
      - `data-testid="plugs-sheet"` root.
      - `data-testid="plugs-sheet-count"` showing "2" + "/ 4".
      - `data-testid="plugs-sheet-consumption"` showing "750" + "W" suffix (no kW conversion below 1000).
      - 4 plug rows with testids slugged from custom_name (e.g. `plugs-sheet-plug-frigo-toggle`).

    - Test 2 (kW boundary): with one plug at 1500W (and others at 0), `plugs-sheet-consumption` shows "1.50" + "kW".

    - Test 3 (1000W boundary): with one plug at exactly 1000W, value is "1.00" + "kW".

    - Test 4 (per-plug subtitle when on with power): plug subtitle text contains the power value but NO room name. Specifically when `on=true, power=750`, the subtitle reads `750W` (no leading room). When `power=1500`, subtitle reads `1.5kW`.

    - Test 5 (per-plug subtitle when off): subtitle is empty (the plug shows only the name; the subtitle div may render but with no text).

    - Test 6 (toggle wiring): clicking the InlineToggle on plug "frigo" (currently on) invokes `togglePlug('device-frigo', true)` (current state). Switching to off plug invokes `togglePlug('device-X', false)`.

    - Test 7 (custom_name fallback): when `custom_name` is null, the row label uses `device_id`.

    - Test 8 (loading skeleton): when `loading && plugs === null`, only `plugs-sheet-skeleton` renders.

    - Test 9 (empty state): when `plugs === []`, both summary cards render with `0` and the plug list is an empty rounded container.

    - Test 10 (error): when error string set and no plugs, renders `Non raggiungibile. Riprova più tardi.` + the error string.
  </behavior>
  <action>
**SHEET-06 deviation notice (formal scope reduction)** — per the Phase 178 plan-checker round-1 review:
- REQUIREMENTS.md SHEET-06 was updated to drop the `+ room` segment from the per-plug subtitle.
- 178-CONTEXT.md D-09 plug-list template now reads `{on && power > 0 ? '…power…' : ''}` (no `{room}` token).
- 178-CONTEXT.md `<deferred>` adds a "PlugsSheet per-row room subtitle" bullet describing the device-registry join hook that ships in a follow-up phase. The current plan honors that deviation by keeping the subtitle 2-segment (name + power-only).
- The acceptance criterion grep gate (below) enforces this deferred deviation — `useTuyaData()` exposes no `room` field today; reintroducing it requires the device-registry join hook (out of scope for Phase 178).

**File 1: `app/components/EmberGlass/sheets/PlugsSheet.tsx`** (replaces stub):

```tsx
'use client';

import { Plug, TriangleAlert } from 'lucide-react';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import { InlineToggle } from '../InlineToggle';

interface SimplePlug {
  id: string;
  name: string;
  on: boolean;
  power: number;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function formatPowerSummary(totalPower: number): { value: string; unit: 'kW' | 'W' } {
  if (totalPower >= 1000) {
    return { value: (totalPower / 1000).toFixed(2), unit: 'kW' };
  }
  return { value: String(totalPower), unit: 'W' };
}

function formatPowerRow(power: number): string {
  if (power >= 1000) return `${(power / 1000).toFixed(1)}kW`;
  return `${power}W`;
}

/**
 * PlugsSheet (SHEET-06 / CONTEXT D-09) — body-only component (D-04). No props;
 * self-fetches via useTuyaData + useTuyaCommands.
 *
 * Visual contract verbatim from bundle `sheets.jsx:400-466`. Italian copy frozen (D-23).
 *
 * Tuya only (CONTEXT D-09). DirigeraCard keeps placeholder body — no useDirigeraCommands exists.
 *
 * Field gaps:
 *   - Pitfall 8: TuyaPlug has NO `room` field — subtitle drops the room segment.
 *   - Field adapter: device_id → id, custom_name → name, switch_on → on, power_w → power.
 *
 * Pitfall 10: useTuyaCommands.togglePlug is NOT wrapped in useRetryableCommand.
 * Failures are silent; optimistic InlineToggle reverts on next data tick.
 *
 * No useMemo / useCallback (D-33).
 */
export function PlugsSheet() {
  const tuyaData = useTuyaData();
  const cmds = useTuyaCommands();

  // Loading skeleton (D-26)
  if (tuyaData.loading && tuyaData.plugs === null) {
    return (
      <div
        data-testid="plugs-sheet-skeleton"
        style={{
          height: 520,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (D-27)
  if (tuyaData.error && tuyaData.plugs === null) {
    const errMessage =
      typeof tuyaData.error === 'string'
        ? tuyaData.error
        : tuyaData.error instanceof Error
          ? tuyaData.error.message
          : '';
    return (
      <div
        data-testid="plugs-sheet-error"
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
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{errMessage}</div>
      </div>
    );
  }

  // Field adapter
  const plugs: SimplePlug[] = (tuyaData.plugs ?? []).map((p: any) => ({
    id: p.device_id,
    name: p.custom_name ?? p.device_id,
    on: p.switch_on === true,
    power: typeof p.power_w === 'number' ? p.power_w : 0,
  }));

  const onCount = plugs.filter((p) => p.on).length;
  const totalPower = plugs.reduce((sum, p) => sum + p.power, 0);
  const summary = formatPowerSummary(totalPower);

  return (
    <div data-testid="plugs-sheet">
      {/* Summary 2-col grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {/* Accese card */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 18,
            background: 'rgba(255,184,74,0.08)', // AUDIT-EXCEPTION (sheets.jsx:419)
            border: '0.5px solid rgba(255,184,74,0.2)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Accese
          </div>
          <div
            data-testid="plugs-sheet-count"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 600,
              color: '#fff',
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            {onCount}
            <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>
              / {plugs.length}
            </span>
          </div>
        </div>

        {/* Consumo card */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Consumo
          </div>
          <div
            data-testid="plugs-sheet-consumption"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 600,
              color: '#fff',
              marginTop: 4,
              letterSpacing: -0.5,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {summary.value}
            <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>
              {summary.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Plug list */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 18,
          border: '0.5px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {plugs.map((p, i) => {
          const isLast = i === plugs.length - 1;
          // Pitfall 8: drop room segment. Subtitle is power-only when on, empty when off.
          const subtitle = p.on && p.power > 0 ? formatPowerRow(p.power) : '';
          return (
            <div
              key={p.id}
              data-testid={`plugs-sheet-plug-${slugify(p.name)}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                gap: 12,
                borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* 36×36 plug tile */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: p.on
                    ? 'rgba(255,184,74,0.18)' // AUDIT-EXCEPTION (sheets.jsx:447)
                    : 'rgba(255,255,255,0.05)',
                  color: p.on ? '#ffb84a' : 'rgba(255,255,255,0.3)',
                  border: p.on
                    ? '0.5px solid rgba(255,184,74,0.3)'
                    : '0.5px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plug size={16} strokeWidth={2} />
              </div>

              {/* Name + subtitle */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#fff',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-2)',
                    marginTop: 2,
                  }}
                >
                  {subtitle}
                </div>
              </div>

              {/* Toggle */}
              <div data-testid={`plugs-sheet-plug-${slugify(p.name)}-toggle`}>
                <InlineToggle
                  on={p.on}
                  color="#ffb84a"
                  onChange={() => void cmds.togglePlug(p.id, p.on)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**File 2: `app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx`**:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PlugsSheet } from '../PlugsSheet';

const mockTogglePlug = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({ togglePlug: mockTogglePlug }),
}));

const baseData = {
  plugs: [
    { device_id: 'd-frigo', custom_name: 'Frigo', switch_on: true, power_w: 750 },
    { device_id: 'd-tv', custom_name: 'TV', switch_on: true, power_w: 0 },
    { device_id: 'd-lava', custom_name: 'Lavatrice', switch_on: false, power_w: 0 },
    { device_id: 'd-forno', custom_name: 'Forno', switch_on: false, power_w: 0 },
  ] as any,
  loading: false,
  error: null,
};

let dataOverride: Partial<typeof baseData> = {};

jest.mock('@/app/components/devices/tuya/hooks/useTuyaData', () => ({
  useTuyaData: () => ({ ...baseData, ...dataOverride }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  dataOverride = {};
});

describe('PlugsSheet (SHEET-06 / CONTEXT D-09)', () => {
  it('renders summary cards + 4 plug rows', () => {
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('2');
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('/ 4');
    expect(screen.getByTestId('plugs-sheet-plug-frigo')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-plug-tv')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-plug-lavatrice')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-plug-forno')).toBeInTheDocument();
  });

  it('total power below 1000 renders W suffix without conversion', () => {
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('750');
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('W');
    expect(screen.getByTestId('plugs-sheet-consumption')).not.toHaveTextContent('kW');
  });

  it('total power 1000W renders 1.00kW', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd1', custom_name: 'X', switch_on: true, power_w: 1000 } as any,
      ],
    };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('1.00');
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('kW');
  });

  it('total power 1500W renders 1.50kW', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd1', custom_name: 'X', switch_on: true, power_w: 1500 } as any,
      ],
    };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('1.50');
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('kW');
  });

  it('per-plug subtitle when on with power = 750 reads 750W (no room prefix)', () => {
    render(<PlugsSheet />);
    const frigoRow = screen.getByTestId('plugs-sheet-plug-frigo');
    expect(frigoRow).toHaveTextContent('Frigo');
    expect(frigoRow).toHaveTextContent('750W');
  });

  it('per-plug subtitle when on with power 1500 reads 1.5kW', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd1', custom_name: 'Forno', switch_on: true, power_w: 1500 } as any,
      ],
    };
    render(<PlugsSheet />);
    const row = screen.getByTestId('plugs-sheet-plug-forno');
    expect(row).toHaveTextContent('1.5kW');
  });

  it('per-plug subtitle empty when off', () => {
    render(<PlugsSheet />);
    const lavaRow = screen.getByTestId('plugs-sheet-plug-lavatrice');
    expect(lavaRow).toHaveTextContent('Lavatrice');
    expect(lavaRow).not.toHaveTextContent('W');
    expect(lavaRow).not.toHaveTextContent('kW');
  });

  it('clicking InlineToggle on a plug invokes togglePlug(id, currentState)', () => {
    render(<PlugsSheet />);
    const toggleWrap = screen.getByTestId('plugs-sheet-plug-frigo-toggle');
    const toggle = toggleWrap.querySelector('button, input, [role="switch"]') as HTMLElement;
    fireEvent.click(toggle);
    // Frigo is on → togglePlug('d-frigo', true).
    expect(mockTogglePlug).toHaveBeenCalledWith('d-frigo', true);
  });

  it('uses device_id as label when custom_name is null', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd-anon', custom_name: null, switch_on: false, power_w: 0 } as any,
      ],
    };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-plug-d-anon')).toHaveTextContent('d-anon');
  });

  it('renders skeleton when loading and plugs is null', () => {
    dataOverride = { plugs: null, loading: true } as any;
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-skeleton')).toBeInTheDocument();
  });

  it('renders empty state with 0/0 counts when plugs array is empty', () => {
    dataOverride = { plugs: [] };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('0');
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('/ 0');
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('0W');
  });

  it('renders error state when error string set and plugs is null', () => {
    dataOverride = { plugs: null, error: 'auth expired' as any };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-error')).toBeInTheDocument();
    expect(screen.getByText('Non raggiungibile. Riprova più tardi.')).toBeInTheDocument();
    expect(screen.getByText('auth expired')).toBeInTheDocument();
  });
});
```
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/PlugsSheet.tsx` exists and contains:
      - `'use client'`.
      - `useTuyaData()` AND `useTuyaCommands()`.
      - `cmds.togglePlug(p.id, p.on)`.
      - The string `'Accese'` AND `'Consumo'`.
      - `formatPowerSummary` (or equivalent) producing `(totalPower / 1000).toFixed(2)` for ≥1000 and bare integer for <1000.
      - `formatPowerRow` (or equivalent) producing `(power / 1000).toFixed(1)` for ≥1000.
      - `'#ffb84a'` (Tuya orange).
      - Field adapter using `p.device_id`, `p.custom_name`, `p.switch_on`, `p.power_w`.
      - data-testid: `plugs-sheet`, `plugs-sheet-count`, `plugs-sheet-consumption`, `plugs-sheet-plug-{slug}`, `plugs-sheet-plug-{slug}-toggle`, `plugs-sheet-skeleton`, `plugs-sheet-error`.
      - Subtitle code path that does NOT render `p.room` (Pitfall 8 — there is no room field; the segment is dropped).
    - Spec ships with at least 11 `it(` cases; exits 0.
    - `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/PlugsSheet.tsx` returns no hits.
    - `! grep -E "p\\.room|plug\\.room" app/components/EmberGlass/sheets/PlugsSheet.tsx` returns no hits (Pitfall 8 — no field access). **This gate enforces the deliberately-scoped SHEET-06 deviation logged in REQUIREMENTS.md, 178-CONTEXT.md D-09, and the 178-CONTEXT.md deferred-items entry "PlugsSheet per-row room subtitle". Re-enabling the room segment requires a device-registry join hook outside Phase 178 scope.**
  </acceptance_criteria>
  <done>
    PlugsSheet ships GREEN; kW/W formatting at 1000W boundary verified; per-plug subtitle drops room (Pitfall 8); togglePlug wiring covered.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → useTuyaCommands → /api/tuya/plugs/{id}/state | Existing route; auth enforced server-side |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-08-01 | Tampering | togglePlug failure leaves UI inconsistent | accept | Pitfall 10 — no useRetryableCommand wrap. Optimistic InlineToggle reverts on next data tick (Phase 96 60s polling). Documented in JSDoc. |
| T-178-08-02 | Information Disclosure | Plug names rendered verbatim from custom_name | accept | React escapes JSX text; custom_name is set by the user themselves via the Tuya app. |
</threat_model>

<verification>
```bash
npm run test:components -- app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] PlugsSheet ships with 2-col summary + plug list.
- [ ] kW/W formatting at 1000W boundary correct.
- [ ] Per-plug subtitle drops room segment (Pitfall 8).
- [ ] togglePlug wiring covered.
- [ ] Empty/loading/error states ship.
- [ ] Spec exits 0; zero useMemo/useCallback.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-08-SUMMARY.md`.
</output>
