---
phase: 178
plan: 06
type: execute
wave: 2
depends_on: ['178-01', '178-02']
files_modified:
  - app/components/EmberGlass/sheets/LightsSheet.tsx
  - app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx
autonomous: true
requirements: [SHEET-04]
tags: [ember-glass, sheets, lights, hue]
must_haves:
  truths:
    - "LightsSheet renders summary header (Accese count card + Tutte on/off pills)"
    - "Scene strip renders 4 buttons (Rilassante, Concentrato, Cena, Notte) with bundle-verbatim gradients"
    - "Scene buttons disable visually (opacity 0.5, cursor not-allowed) when findSceneByName returns null"
    - "Disabled scene tooltip reads 'Crea scena \\'{name}\\' su Hue'"
    - "Scenes activate against the user's primary group (groups[0].group_id) on click"
    - "Per-room sections derive from groups[].lights[] reverse mapping (Pitfall 9)"
    - "Per-light row InlineToggle invokes handleRoomToggle(group.group_id, !groupOn) — room-level write semantically"
    - "Tutte on/off pills invoke handleAllLightsToggle(true|false)"
    - "Zero useMemo / useCallback"
  artifacts:
    - path: app/components/EmberGlass/sheets/LightsSheet.tsx
      provides: "SHEET-04 body — Lights control sheet with scenes + per-room toggles"
      min_lines: 200
    - path: app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx
      provides: "Jest spec — count card + Tutte on/off + scene activation + scene-disabled state + per-room toggle"
      min_lines: 180
  key_links:
    - from: app/components/EmberGlass/sheets/LightsSheet.tsx
      to: app/components/devices/lights/hooks/useLightsData.ts
      via: "useLightsData()"
      pattern: "useLightsData\\("
    - from: app/components/EmberGlass/sheets/LightsSheet.tsx
      to: app/components/EmberGlass/sheets/lib/findSceneByName.ts
      via: "import { findSceneByName }"
      pattern: "findSceneByName\\("
user_setup: []
---

<objective>
Ship the **LightsSheet** body (SHEET-04 / CONTEXT D-07 / D-21). Bundle visual contract: `sheets.jsx:199-297` verbatim. Consumes `useLightsData` (existing) + `useLightsCommands` (existing) + `findSceneByName` helper (Plan 178-02).

**Layout (UI-SPEC verbatim):**
1. **Summary header (3-col grid `1fr auto auto`):** Accese count card (yellow tint when `onCount > 0`, neutral otherwise) + 2 `<QuickActionButton>` pills ("Tutte on", "Tutte off").
2. **Scene strip:** "Scene" eyebrow + 2-col grid of 4 buttons (Rilassante, Concentrato, Cena, Notte) with bundle-verbatim gradients. Disabled state when `findSceneByName(scenes, name)` returns null.
3. **Per-room sections** (Object.entries(byRoom).map): room-name eyebrow + rounded list container with per-light rows (32×32 bulb tile + name + InlineToggle).

**Critical pitfalls (RESEARCH):**
- **Pitfall 9:** `useLightsData` exposes `lights[]` (no `room` or `groupId` fields) and `groups[]` (with `lights: string[]` array of light_ids). Build `byRoom` from groups, NOT lights. Per-light toggle is conceptually room-level (per-light Hue PUT may not be exposed; use `handleRoomToggle(group.group_id, !groupOn)` per option (a)).
- **Pitfall 9b (per-light toggle):** Each per-light row InlineToggle invokes `handleRoomToggle(group.group_id, !anyOn)` — semantically a room-level write. Document this in JSDoc.
- **Primary group for scenes:** UI-SPEC discretion locks `groups.find(g => g.type === 'Room')[0].group_id` (the first Room group). Plan agent verifies via the actual return shape; if no room found, scene activation falls back to disabled (no group → disabled scene buttons).

**Italian copy frozen (D-21):** `Accese`, `Tutte on`, `Tutte off`, `Scene`, `Rilassante`, `Concentrato`, `Cena`, `Notte`. Disabled scene tooltip: `Crea scena 'Rilassante' su Hue` (single quotes around scene name).

**Scene gradients (UI-SPEC §Color verbatim):**
- Rilassante: `linear-gradient(135deg, #ff8a5c, #b080ff)`
- Concentrato: `linear-gradient(135deg, #fff3c4, #5eafff)`
- Cena: `linear-gradient(135deg, #ffb84a, #ff8a5c)`
- Notte: `linear-gradient(135deg, #2a3a6a, #b080ff)`

Purpose: Ship SHEET-04 — lights control surface inside the dashboard sheet.
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
@app/components/EmberGlass/cards/LightsCard.tsx
@app/components/devices/lights/hooks/useLightsData.ts
@app/components/devices/lights/hooks/useLightsCommands.ts
@app/components/EmberGlass/InlineToggle.tsx
@types/hueProxy.ts

<interfaces>
<!-- VERIFIED via useLightsData.ts + types/hueProxy.ts: -->
<!--   lights:  HueLight[]    { light_id, name, on, brightness, ... }   (no room, no groupId) -->
<!--   groups:  HueGroup[]    { group_id, name, type: 'Room'|'Zone'|'LightGroup', lights: string[] (light_ids), any_on, all_on } -->
<!--   scenes:  HueScene[]    { scene_id, name, group_id } -->
<!--   plus: setRefreshing, setLoadingMessage, setError, fetchData, checkConnection, connected, loading -->
<!-- -->
<!-- VERIFIED via useLightsCommands.ts: -->
<!--   useLightsCommands({ lightsData: Pick<UseLightsDataReturn, 'setRefreshing'|'setLoadingMessage'|'setError'|'fetchData'|'groups'|'checkConnection'|'connected'>, router }) -->
<!--   handleAllLightsToggle(on: boolean) -->
<!--   handleSceneActivate(sceneId: string, groupId: string) -->
<!--   handleRoomToggle(groupId: string, on: boolean) -->
<!-- -->
<!-- byRoom mapping (RESEARCH §Pitfall 9): -->
<!--   for each group of type 'Room': byRoom[group.name] = { lights: lights.filter(l => group.lights.includes(l.light_id)), group } -->
<!-- -->
<!-- Primary group for scene activation: groups.find(g => g.type === 'Room')?.group_id (first Room) -->
<!-- -->
<!-- Scene-by-name lookup: findSceneByName(scenes, name) → HueScene | null (Plan 178-02 helper) -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement LightsSheet body + jest spec</name>
  <files>
    app/components/EmberGlass/sheets/LightsSheet.tsx,
    app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 199-297 — bundle visual source for LightsSheet; lines 299-306 for quickBtn)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Sheet Body Contracts → LightsSheet"; §Color scene gradients; §Color per-device-class tones; §Copywriting LightsSheet)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 175-211 — verbatim layout + byRoom mapping)
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§Pitfall 9 — byRoom from groups, room-level toggle semantic; §"Field Gaps" → LightsSheet)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-07, D-21, D-26, D-27, D-28, D-33, D-34)
    - app/components/EmberGlass/cards/LightsCard.tsx (FULL FILE — lines 30-60 for hook plumbing reference; the Pick<> shape is the canonical reference)
    - app/components/devices/lights/hooks/useLightsData.ts (return shape — fields available)
    - app/components/devices/lights/hooks/useLightsCommands.ts (handler signatures; Pick<> param shape)
    - types/hueProxy.ts (HueLight, HueGroup, HueScene shapes)
    - app/components/EmberGlass/sheets/lib/findSceneByName.ts (Plan 178-02 helper)
    - app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx (Plan 178-01)
    - app/components/EmberGlass/InlineToggle.tsx (existing primitive)
  </read_first>
  <behavior>
    LightsSheet:
    - Test 1: with 6 lights (3 on, 3 off) split across rooms "Salotto" and "Camera", renders:
      - `data-testid="lights-sheet"` root.
      - `data-testid="lights-sheet-count"` showing "3" + "/ 6".
      - `data-testid="quick-action-tutte-on"` AND `data-testid="quick-action-tutte-off"`.
      - "Scene" eyebrow.
      - Four scene buttons with testids `lights-sheet-scene-rilassante`, `-concentrato`, `-cena`, `-notte`.
      - Two room sections — `lights-sheet-room-salotto` and `lights-sheet-room-camera` (slugged from raw room name).
      - Six per-light toggle rows.

    - Test 2: clicking `quick-action-tutte-on` invokes `handleAllLightsToggle(true)`.
    - Test 3: clicking `quick-action-tutte-off` invokes `handleAllLightsToggle(false)`.

    - Test 4: when `scenes` catalog contains a scene named "Rilassante" with `scene_id="s1"` and the primary group is `group_id="g1"`, clicking `lights-sheet-scene-rilassante` invokes `handleSceneActivate('s1', 'g1')`.

    - Test 5 (disabled scene): when `scenes` catalog does NOT contain "Concentrato", `lights-sheet-scene-concentrato` carries `data-disabled="true"`, has `cursor: not-allowed`, has `title="Crea scena 'Concentrato' su Hue"`, and clicking it does NOT call `handleSceneActivate`.

    - Test 6 (no primary group): when `groups[]` has no item with `type === 'Room'`, ALL scene buttons render disabled (no group to target).

    - Test 7 (per-light toggle, room-level semantic): clicking the InlineToggle on a light in "Salotto" group `g1` invokes `handleRoomToggle('g1', false)` (toggle off) or `handleRoomToggle('g1', true)` (toggle on) — the call passes the GROUP id (Pitfall 9).

    - Test 8 (count card tint): when `onCount > 0`, the count card style contains `rgba(245,200,74,0.1)`. When `onCount === 0`, it contains `rgba(255,255,255,0.04)`.

    - Test 9 (Tutte on active state): when `onCount === lights.length`, `quick-action-tutte-on` button has `active` styling (yellow tint per QuickActionButton).

    - Test 10 (loading skeleton): when `loading && lights.length === 0 && groups.length === 0`, body renders `data-testid="lights-sheet-skeleton"` only.

    - Test 11 (error): when `error` is set (the hook's `error` field) and groups is empty, body renders error fallback `Non raggiungibile. Riprova più tardi.`.
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/LightsSheet.tsx`** (replaces stub):

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Lightbulb, TriangleAlert } from 'lucide-react';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { InlineToggle } from '../InlineToggle';
import { QuickActionButton } from './primitives/QuickActionButton';
import { findSceneByName } from './lib/findSceneByName';
import type { HueGroup, HueLight } from '@/types/hueProxy';

const SCENES: ReadonlyArray<{ name: string; gradient: string }> = [
  { name: 'Rilassante', gradient: 'linear-gradient(135deg, #ff8a5c, #b080ff)' },
  { name: 'Concentrato', gradient: 'linear-gradient(135deg, #fff3c4, #5eafff)' },
  { name: 'Cena', gradient: 'linear-gradient(135deg, #ffb84a, #ff8a5c)' },
  { name: 'Notte', gradient: 'linear-gradient(135deg, #2a3a6a, #b080ff)' },
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * LightsSheet (SHEET-04 / CONTEXT D-07) — body-only component (D-04). No props;
 * self-fetches via useLightsData + useLightsCommands.
 *
 * Visual contract verbatim from bundle `sheets.jsx:199-297`. Italian copy frozen (D-21).
 *
 * Pitfall 9 (Hue field gaps):
 *   - lights[] has NO `room` or `groupId` fields. byRoom is built from groups[].lights[].
 *   - Per-light row InlineToggle invokes `handleRoomToggle(group.group_id, !groupOn)` —
 *     semantically a ROOM-level write (per-light Hue PUT not currently wired).
 *
 * Scene activation: scene buttons map name → scene_id via findSceneByName, then call
 * handleSceneActivate(sceneId, primaryGroupId). Disabled when scene name missing from catalog.
 *
 * No useMemo / useCallback (D-33).
 */
export function LightsSheet() {
  const router = useRouter();
  const lightsData = useLightsData();
  const cmds = useLightsCommands({
    lightsData: {
      setRefreshing: lightsData.setRefreshing,
      setLoadingMessage: lightsData.setLoadingMessage,
      setError: lightsData.setError,
      fetchData: lightsData.fetchData,
      groups: lightsData.groups,
      checkConnection: lightsData.checkConnection,
      connected: lightsData.connected,
    },
    router,
  });

  const lights: HueLight[] = lightsData.lights ?? [];
  const groups: HueGroup[] = lightsData.groups ?? [];
  const scenes = lightsData.scenes ?? [];

  // Loading skeleton (D-26)
  if (lightsData.loading && lights.length === 0 && groups.length === 0) {
    return (
      <div
        data-testid="lights-sheet-skeleton"
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
  const errorMessage = lightsData.error;
  if (errorMessage && lights.length === 0 && groups.length === 0) {
    return (
      <div
        data-testid="lights-sheet-error"
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
          {typeof errorMessage === 'string'
            ? errorMessage
            : errorMessage instanceof Error
              ? errorMessage.message
              : ''}
        </div>
      </div>
    );
  }

  const onCount = lights.filter((l) => l.on).length;
  const allOn = lights.length > 0 && onCount === lights.length;

  // byRoom mapping (Pitfall 9): build from groups, NOT lights.
  const byRoom: Array<{ name: string; group: HueGroup; lights: HueLight[] }> = [];
  for (const group of groups) {
    if (group.type !== 'Room') continue;
    byRoom.push({
      name: group.name,
      group,
      lights: lights.filter((l) => (group.lights ?? []).includes(l.light_id)),
    });
  }

  // Primary group for scene activation (UI-SPEC §"Claude's Discretion → primary group")
  const primaryGroup = groups.find((g) => g.type === 'Room');
  const primaryGroupId = primaryGroup?.group_id;

  return (
    <div data-testid="lights-sheet">
      {/* Summary header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 10,
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 16,
            background: onCount > 0
              ? 'rgba(245,200,74,0.1)' // AUDIT-EXCEPTION (sheets.jsx:232)
              : 'rgba(255,255,255,0.04)',
            border: onCount > 0
              ? '0.5px solid rgba(245,200,74,0.25)'
              : '0.5px solid rgba(255,255,255,0.06)',
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
            data-testid="lights-sheet-count"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 600,
              color: '#fff', // AUDIT-EXCEPTION
              marginTop: 2,
              letterSpacing: -0.5,
            }}
          >
            {onCount}
            <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>
              / {lights.length}
            </span>
          </div>
        </div>
        <QuickActionButton
          active={allOn}
          label="Tutte on"
          onClick={() => void cmds.handleAllLightsToggle(true)}
        />
        <QuickActionButton
          active={false}
          label="Tutte off"
          onClick={() => void cmds.handleAllLightsToggle(false)}
        />
      </div>

      {/* Scene strip */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        Scene
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {SCENES.map((sc) => {
          const match = findSceneByName(scenes, sc.name);
          const disabled = !match || !primaryGroupId;
          return (
            <button
              key={sc.name}
              type="button"
              data-testid={`lights-sheet-scene-${slugify(sc.name)}`}
              data-sheet-focusable="true"
              data-disabled={disabled ? 'true' : 'false'}
              title={disabled ? `Crea scena '${sc.name}' su Hue` : undefined}
              disabled={disabled}
              onClick={() => {
                if (disabled || !match || !primaryGroupId) return;
                void cmds.handleSceneActivate(match.scene_id, primaryGroupId);
              }}
              style={{
                padding: 12,
                borderRadius: 14,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (sheets.jsx:256)
                border: '0.5px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  background: sc.gradient, // AUDIT-EXCEPTION — bundle scene gradient verbatim
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {sc.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Per-room sections */}
      {byRoom.map((section) => {
        const groupOn = section.group.any_on === true;
        return (
          <div
            key={section.group.group_id}
            data-testid={`lights-sheet-room-${slugify(section.name)}`}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              {section.name}
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                border: '0.5px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              {section.lights.map((l, i) => {
                const isLast = i === section.lights.length - 1;
                return (
                  <div
                    key={l.light_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 14px',
                      gap: 12,
                      borderBottom: isLast
                        ? 'none'
                        : '0.5px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        flexShrink: 0,
                        background: l.on
                          ? 'rgba(245,200,74,0.18)' // AUDIT-EXCEPTION (sheets.jsx:280)
                          : 'rgba(255,255,255,0.05)',
                        color: l.on ? '#f5c84a' : 'rgba(255,255,255,0.3)',
                        border: l.on
                          ? '0.5px solid rgba(245,200,74,0.3)'
                          : '0.5px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: l.on
                          ? '0 0 12px rgba(245,200,74,0.25)'
                          : 'none',
                      }}
                    >
                      <Lightbulb size={15} strokeWidth={2} />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#fff',
                        fontWeight: 500,
                      }}
                    >
                      {l.name}
                    </div>
                    <div data-testid={`lights-sheet-light-${slugify(l.name)}-toggle`}>
                      <InlineToggle
                        on={l.on}
                        color="#f5c84a"
                        onChange={(next) =>
                          // Pitfall 9: per-light toggle is room-level (group_id, !groupOn).
                          void cmds.handleRoomToggle(section.group.group_id, next)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

NOTE: the `useLightsData` return shape MAY include a `scenes` field directly OR may expose it under a different name; verify by reading the hook source. If `scenes` is absent, fall back to a global `lightsData.scenes` of `[]`. The plan author's snippet above uses `lightsData.scenes ?? []` defensively.

**File 2: `app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx`** — mocks the data + commands hooks; covers the full behavior list:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LightsSheet } from '../LightsSheet';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockHandleAllLightsToggle = jest.fn().mockResolvedValue(undefined);
const mockHandleSceneActivate = jest.fn().mockResolvedValue(undefined);
const mockHandleRoomToggle = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/lights/hooks/useLightsCommands', () => ({
  useLightsCommands: () => ({
    handleAllLightsToggle: mockHandleAllLightsToggle,
    handleSceneActivate: mockHandleSceneActivate,
    handleRoomToggle: mockHandleRoomToggle,
  }),
}));

const baseData = {
  lights: [
    { light_id: 'l1', name: 'Plafoniera', on: true } as any,
    { light_id: 'l2', name: 'Lampada', on: true } as any,
    { light_id: 'l3', name: 'Faretto', on: true } as any,
    { light_id: 'l4', name: 'Comodino', on: false } as any,
    { light_id: 'l5', name: 'Letto', on: false } as any,
    { light_id: 'l6', name: 'Lettura', on: false } as any,
  ],
  groups: [
    {
      group_id: 'g1',
      name: 'Salotto',
      type: 'Room',
      lights: ['l1', 'l2', 'l3'],
      any_on: true,
      all_on: true,
    } as any,
    {
      group_id: 'g2',
      name: 'Camera',
      type: 'Room',
      lights: ['l4', 'l5', 'l6'],
      any_on: false,
      all_on: false,
    } as any,
  ],
  scenes: [
    { scene_id: 's-rilassante', name: 'Rilassante', group_id: 'g1' } as any,
    { scene_id: 's-cena', name: 'Cena', group_id: 'g1' } as any,
    { scene_id: 's-notte', name: 'Notte', group_id: 'g1' } as any,
  ],
  loading: false,
  error: null,
  setRefreshing: jest.fn(),
  setLoadingMessage: jest.fn(),
  setError: jest.fn(),
  fetchData: jest.fn().mockResolvedValue(undefined),
  checkConnection: jest.fn(),
  connected: true,
};

let dataOverride: Partial<typeof baseData> = {};

jest.mock('@/app/components/devices/lights/hooks/useLightsData', () => ({
  useLightsData: () => ({ ...baseData, ...dataOverride }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  dataOverride = {};
});

describe('LightsSheet (SHEET-04 / CONTEXT D-07)', () => {
  it('renders summary header + Tutte on/off + 4 scene buttons + 2 room sections + 6 toggles', () => {
    render(<LightsSheet />);
    expect(screen.getByTestId('lights-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-count')).toHaveTextContent('3');
    expect(screen.getByTestId('lights-sheet-count')).toHaveTextContent('/ 6');
    expect(screen.getByTestId('quick-action-tutte-on')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-tutte-off')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-rilassante')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-concentrato')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-cena')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-notte')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-room-salotto')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-room-camera')).toBeInTheDocument();
  });

  it('Tutte on click invokes handleAllLightsToggle(true)', () => {
    render(<LightsSheet />);
    fireEvent.click(screen.getByTestId('quick-action-tutte-on'));
    expect(mockHandleAllLightsToggle).toHaveBeenCalledWith(true);
  });

  it('Tutte off click invokes handleAllLightsToggle(false)', () => {
    render(<LightsSheet />);
    fireEvent.click(screen.getByTestId('quick-action-tutte-off'));
    expect(mockHandleAllLightsToggle).toHaveBeenCalledWith(false);
  });

  it('Rilassante scene click invokes handleSceneActivate(s-rilassante, g1)', () => {
    render(<LightsSheet />);
    fireEvent.click(screen.getByTestId('lights-sheet-scene-rilassante'));
    expect(mockHandleSceneActivate).toHaveBeenCalledWith('s-rilassante', 'g1');
  });

  it('Concentrato scene is disabled when not in catalog (Pitfall: findSceneByName returns null)', () => {
    render(<LightsSheet />);
    const btn = screen.getByTestId('lights-sheet-scene-concentrato');
    expect(btn).toHaveAttribute('data-disabled', 'true');
    expect(btn).toHaveAttribute('title', "Crea scena 'Concentrato' su Hue");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(mockHandleSceneActivate).not.toHaveBeenCalled();
  });

  it('all scenes disabled when no Room-type group exists', () => {
    dataOverride = { groups: [] };
    render(<LightsSheet />);
    expect(screen.getByTestId('lights-sheet-scene-rilassante')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(screen.getByTestId('lights-sheet-scene-cena')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it('per-light toggle invokes handleRoomToggle(group_id, next)', () => {
    render(<LightsSheet />);
    const toggleWrap = screen.getByTestId('lights-sheet-light-plafoniera-toggle');
    const toggle = toggleWrap.querySelector('button, input[type="checkbox"], [role="switch"]') as HTMLElement;
    fireEvent.click(toggle);
    // Plafoniera (l1) is on → next state is false (toggle off) → handleRoomToggle('g1', false).
    expect(mockHandleRoomToggle).toHaveBeenCalledWith('g1', false);
  });

  it('count card uses yellow tint when onCount > 0', () => {
    render(<LightsSheet />);
    const countCard = screen.getByTestId('lights-sheet-count').parentElement;
    expect(countCard?.getAttribute('style')).toContain('rgba(245,200,74,0.1)');
  });

  it('count card uses neutral tint when onCount === 0', () => {
    dataOverride = {
      lights: baseData.lights.map((l) => ({ ...l, on: false })),
    };
    render(<LightsSheet />);
    const countCard = screen.getByTestId('lights-sheet-count').parentElement;
    expect(countCard?.getAttribute('style')).toContain('rgba(255,255,255,0.04)');
  });

  it('Tutte on shows active state when all lights on', () => {
    dataOverride = {
      lights: baseData.lights.map((l) => ({ ...l, on: true })),
    };
    render(<LightsSheet />);
    const tutteOn = screen.getByTestId('quick-action-tutte-on');
    expect(tutteOn.getAttribute('style')).toContain('#f5c84a');
  });

  it('renders skeleton when loading and zero lights/groups', () => {
    dataOverride = { lights: [], groups: [], loading: true };
    render(<LightsSheet />);
    expect(screen.getByTestId('lights-sheet-skeleton')).toBeInTheDocument();
  });

  it('renders error state when error string set and zero data', () => {
    dataOverride = { lights: [], groups: [], error: 'bridge offline' as any };
    render(<LightsSheet />);
    expect(screen.getByTestId('lights-sheet-error')).toBeInTheDocument();
    expect(screen.getByText('Non raggiungibile. Riprova più tardi.')).toBeInTheDocument();
    expect(screen.getByText('bridge offline')).toBeInTheDocument();
  });
});
```

**Edge case in Test 7 (per-light toggle):** the `InlineToggle` primitive's emit shape (whether `onChange` receives the next boolean directly or wraps with stopPropagation) must be verified by reading `InlineToggle.tsx`. The wrapper `<div data-testid>` around the toggle gives the spec a stable selector; the actual click target is the toggle's internal button. Use `screen.getByTestId(...).querySelector('[role="switch"], button')` or whatever selector matches the InlineToggle's interactive element. If the toggle uses a checkbox shape, use `fireEvent.click` on the `input`. Plan executor verifies and adjusts the spec helper accordingly.
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/LightsSheet.tsx` exists and contains:
      - `'use client'`.
      - `import { findSceneByName } from './lib/findSceneByName';`.
      - SCENES table with 4 entries containing exactly the 4 gradients above.
      - The Italian copy strings: `'Accese'`, `'Tutte on'`, `'Tutte off'`, `'Scene'`, `'Rilassante'`, `'Concentrato'`, `'Cena'`, `'Notte'`.
      - The string `Crea scena '` (with single quote — for tooltip).
      - `useLightsCommands({ lightsData: { setRefreshing, setLoadingMessage, setError, fetchData, groups, checkConnection, connected }, router })`.
      - byRoom built from `groups[]` filtered by `type === 'Room'` (NOT from lights[].room).
      - `cmds.handleRoomToggle(section.group.group_id, ...)` (room-level write).
      - data-testid: `lights-sheet`, `lights-sheet-count`, `lights-sheet-scene-{rilassante|concentrato|cena|notte}`, `lights-sheet-room-{slug}`, `lights-sheet-light-{slug}-toggle`, `lights-sheet-skeleton`, `lights-sheet-error`.
      - `data-disabled="true"` on scene buttons when `findSceneByName` returns null OR no primary group.
    - Spec ships with at least 11 `it(` cases; exits 0 under `npm run test:components`.
    - `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/LightsSheet.tsx` returns no hits.
  </acceptance_criteria>
  <done>
    LightsSheet ships GREEN; scene-by-name + scenes-disabled state + room-level per-light toggle semantic + summary card tint all covered. Pitfall 9 honored (byRoom from groups; per-light toggle is room-level).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → useLightsCommands → /api/v1/hue/* | Existing routes; auth enforced server-side |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-06-01 | Tampering | Scene name → arbitrary scene_id misroute | mitigate | findSceneByName returns null on miss; click is no-op when disabled. On hit, scene_id is selected from the user's own Hue catalog (no user-supplied path). |
| T-178-06-02 | Tampering | Per-light toggle escalates to room-level write | accept | Documented Pitfall 9 — bundle visual implies per-light, command surface is room-level. Acceptable UX trade-off; documented in JSDoc. |
| T-178-06-03 | Information Disclosure | Room names rendered verbatim | accept | Room names come from typed Hue proxy (HueGroup.name). React escapes JSX text. |
</threat_model>

<verification>
```bash
npm run test:components -- app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] LightsSheet ships with summary + scenes + per-room sections.
- [ ] Scene-not-found disabled state + tooltip implemented.
- [ ] Per-light toggle invokes handleRoomToggle with the GROUP id (Pitfall 9).
- [ ] Count card tint flips on `onCount > 0`.
- [ ] Empty/loading/error states ship.
- [ ] Spec exits 0; zero useMemo/useCallback.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-06-SUMMARY.md`.
</output>
