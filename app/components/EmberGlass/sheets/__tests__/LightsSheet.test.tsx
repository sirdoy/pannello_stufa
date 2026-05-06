/**
 * LightsSheet jest spec — Plan 178-06 (SHEET-04 / CONTEXT D-07).
 *
 * Mocks every collaborating hook (useLightsData, useLightsCommands, useRouter)
 * so the sheet can be rendered in isolation. The `dataOverride` object lets
 * each test reshape the hook return to drive the on/off/missing-scene/no-room/
 * loading/error branches.
 *
 * Visual contract verbatim from bundle `sheets.jsx:199-297`. Italian copy frozen (D-21).
 *
 * Pitfall 9 (verified):
 *   - lights[] has NO `room` or `groupId` fields. byRoom is built from groups[].lights[].
 *   - Per-light row InlineToggle invokes `handleRoomToggle(group.group_id, !groupOn)` —
 *     semantically a ROOM-level write (per-light Hue PUT not currently wired).
 *
 * jsdom serialization notes:
 *   - inline-style commas get a space inserted after each comma; tests normalize via
 *     `.replace(/,\s+/g, ',')` before assertion.
 *   - hex colors are converted to `rgb(R,G,B)` form on read; `#f5c84a` → `rgb(245,200,74)`.
 */

import { fireEvent, render, screen } from '@testing-library/react';
// 260506-d45: render the SelfFetch zero-prop variant; existing hook mocks
// continue to intercept the inner useLightsData/useLightsCommands.
import { LightsSheet, LightsSheetSelfFetch } from '../LightsSheet';
import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy';

// --- Router mock --------------------------------------------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// --- Lights commands mocks ---------------------------------------------
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

// --- Lights data mock with mutable override ----------------------------
const lightTpl = (
  light_id: string,
  name: string,
  on: boolean,
): HueLight => ({
  light_id,
  name,
  on,
  brightness: on ? 200 : 0,
  ct_mirek: null,
  ct_kelvin: null,
  hue: null,
  saturation: null,
  colormode: null,
  reachable: true,
  capability_tier: 'white',
  room_id: null,
  room_name: null,
  model_id: null,
  light_type: null,
});

const baseData = {
  lights: [
    lightTpl('l1', 'Plafoniera', true),
    lightTpl('l2', 'Lampada', true),
    lightTpl('l3', 'Faretto', true),
    lightTpl('l4', 'Comodino', false),
    lightTpl('l5', 'Letto', false),
    lightTpl('l6', 'Lettura', false),
  ] as HueLight[],
  groups: [
    {
      group_id: 'g1',
      name: 'Salotto',
      type: 'Room',
      group_class: 'Living room',
      lights: ['l1', 'l2', 'l3'],
      any_on: true,
      all_on: true,
      brightness: 200,
      color_temp: null,
      colormode: null,
    } as HueGroup,
    {
      group_id: 'g2',
      name: 'Camera',
      type: 'Room',
      group_class: 'Bedroom',
      lights: ['l4', 'l5', 'l6'],
      any_on: false,
      all_on: false,
      brightness: 0,
      color_temp: null,
      colormode: null,
    } as HueGroup,
  ] as HueGroup[],
  scenes: [
    { scene_id: 's-rilassante', name: 'Rilassante', group_id: 'g1' } as HueScene,
    { scene_id: 's-cena', name: 'Cena', group_id: 'g1' } as HueScene,
    { scene_id: 's-notte', name: 'Notte', group_id: 'g1' } as HueScene,
  ] as HueScene[],
  loading: false,
  error: null as string | null,
  connected: true,
  setRefreshing: jest.fn(),
  setLoadingMessage: jest.fn(),
  setError: jest.fn(),
  fetchData: jest.fn().mockResolvedValue(undefined),
  checkConnection: jest.fn(),
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
  test('renders summary header + Tutte on/off + 4 scene buttons + 2 room sections + 6 toggles', () => {
    render(<LightsSheetSelfFetch />);
    expect(screen.getByTestId('lights-sheet')).toBeInTheDocument();
    const count = screen.getByTestId('lights-sheet-count');
    expect(count).toHaveTextContent('3');
    expect(count).toHaveTextContent('/ 6');
    expect(screen.getByTestId('quick-action-tutte-on')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-tutte-off')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-rilassante')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-concentrato')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-cena')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-scene-notte')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-room-salotto')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-room-camera')).toBeInTheDocument();
    // 6 per-light toggle wrappers
    expect(screen.getByTestId('lights-sheet-light-plafoniera-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-light-lampada-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-light-faretto-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-light-comodino-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-light-letto-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-light-lettura-toggle')).toBeInTheDocument();
  });

  test('Tutte on click invokes handleAllLightsToggle(true)', () => {
    render(<LightsSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('quick-action-tutte-on'));
    expect(mockHandleAllLightsToggle).toHaveBeenCalledWith(true);
  });

  test('Tutte off click invokes handleAllLightsToggle(false)', () => {
    render(<LightsSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('quick-action-tutte-off'));
    expect(mockHandleAllLightsToggle).toHaveBeenCalledWith(false);
  });

  test('Rilassante scene click invokes handleSceneActivate("s-rilassante", "g1")', () => {
    render(<LightsSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('lights-sheet-scene-rilassante'));
    expect(mockHandleSceneActivate).toHaveBeenCalledWith('s-rilassante', 'g1');
  });

  test('Concentrato scene is disabled when not in catalog (Pitfall: findSceneByName returns null)', () => {
    render(<LightsSheetSelfFetch />);
    const btn = screen.getByTestId('lights-sheet-scene-concentrato');
    expect(btn).toHaveAttribute('data-disabled', 'true');
    expect(btn).toHaveAttribute('title', "Crea scena 'Concentrato' su Hue");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(mockHandleSceneActivate).not.toHaveBeenCalled();
  });

  test('all scenes disabled when no Room-type group exists', () => {
    dataOverride = { groups: [] };
    render(<LightsSheetSelfFetch />);
    expect(screen.getByTestId('lights-sheet-scene-rilassante')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(screen.getByTestId('lights-sheet-scene-cena')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(screen.getByTestId('lights-sheet-scene-concentrato')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(screen.getByTestId('lights-sheet-scene-notte')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  test('per-light toggle in "Salotto" invokes handleRoomToggle("g1", false) when group is on', () => {
    render(<LightsSheetSelfFetch />);
    const wrap = screen.getByTestId('lights-sheet-light-plafoniera-toggle');
    const toggle = wrap.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(toggle);
    // Salotto group g1 has any_on=true → next state is !any_on = false → handleRoomToggle('g1', false).
    expect(mockHandleRoomToggle).toHaveBeenCalledWith('g1', false);
  });

  test('per-light toggle in "Camera" invokes handleRoomToggle("g2", true) when group is off', () => {
    render(<LightsSheetSelfFetch />);
    const wrap = screen.getByTestId('lights-sheet-light-comodino-toggle');
    const toggle = wrap.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(toggle);
    // Camera group g2 has any_on=false → next state is !any_on = true → handleRoomToggle('g2', true).
    expect(mockHandleRoomToggle).toHaveBeenCalledWith('g2', true);
  });

  test('count card uses yellow tint when onCount > 0', () => {
    render(<LightsSheetSelfFetch />);
    const countCard = screen.getByTestId('lights-sheet-count').parentElement;
    const styleAttr = (countCard?.getAttribute('style') ?? '').replace(/,\s+/g, ',');
    expect(styleAttr).toContain('rgba(245,200,74,0.1)');
  });

  test('count card uses neutral tint when onCount === 0', () => {
    dataOverride = {
      lights: baseData.lights.map((l) => ({ ...l, on: false })),
      groups: baseData.groups.map((g) => ({ ...g, any_on: false, all_on: false })),
    };
    render(<LightsSheetSelfFetch />);
    const countCard = screen.getByTestId('lights-sheet-count').parentElement;
    const styleAttr = (countCard?.getAttribute('style') ?? '').replace(/,\s+/g, ',');
    expect(styleAttr).toContain('rgba(255,255,255,0.04)');
  });

  test('Tutte on shows active yellow state when all lights are on', () => {
    dataOverride = {
      lights: baseData.lights.map((l) => ({ ...l, on: true })),
    };
    render(<LightsSheetSelfFetch />);
    const tutteOn = screen.getByTestId('quick-action-tutte-on');
    const styleAttr = (tutteOn.getAttribute('style') ?? '').replace(/,\s+/g, ',');
    // QuickActionButton active=true → background rgba(245,200,74,0.18) + color #f5c84a
    expect(styleAttr).toContain('rgba(245,200,74,0.18)');
    // jsdom converts #f5c84a → rgb(245,200,74).
    expect(styleAttr).toContain('rgb(245,200,74)');
  });

  test('renders skeleton when loading and zero lights/groups', () => {
    dataOverride = { lights: [], groups: [], loading: true };
    render(<LightsSheetSelfFetch />);
    expect(screen.getByTestId('lights-sheet-skeleton')).toBeInTheDocument();
    // root sheet container should NOT render — skeleton-only path
    expect(screen.queryByTestId('lights-sheet')).not.toBeInTheDocument();
  });

  test('renders error state when error string set and zero data', () => {
    dataOverride = { lights: [], groups: [], error: 'bridge offline' };
    render(<LightsSheetSelfFetch />);
    expect(screen.getByTestId('lights-sheet-error')).toBeInTheDocument();
    expect(screen.getByText('Non raggiungibile. Riprova più tardi.')).toBeInTheDocument();
    expect(screen.getByText('bridge offline')).toBeInTheDocument();
  });

  // 260506-d45 — presentational LightsSheet rendered with explicit prop fixtures.
  test('260506-d45: presentational LightsSheet renders with explicit prop fixtures', () => {
    const propData = baseData as unknown as Parameters<typeof LightsSheet>[0]['lightsData'];
    const propCmds = {
      handleAllLightsToggle: mockHandleAllLightsToggle,
      handleSceneActivate: mockHandleSceneActivate,
      handleRoomToggle: mockHandleRoomToggle,
    } as unknown as Parameters<typeof LightsSheet>[0]['cmds'];
    render(<LightsSheet lightsData={propData} cmds={propCmds} />);
    expect(screen.getByTestId('lights-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('lights-sheet-count')).toHaveTextContent('3');
  });
});
