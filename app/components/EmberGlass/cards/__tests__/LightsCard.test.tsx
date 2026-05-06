/**
 * LightsCard tests — Phase 177 (DASH-04).
 *
 * Verifies:
 *  - ≤4 on-light row rendering with overflow `+ altre N`
 *  - "Spente / N disponibili" empty state
 *  - InlineToggle in header calls handleAllLightsToggle and stops propagation (D-17)
 *  - Card body click opens the placeholder Sheet
 *
 * Hook shape note: `useLightsData()` returns `HueLight[]` keyed by `light_id`
 * (not `id`). `useLightsCommands` accepts a Pick<UseLightsDataReturn, ...>
 * subset + router (matches legacy `app/components/devices/lights/LightsCard.tsx:34-45`).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import LightsCard from '../LightsCard';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';

jest.mock('@/app/components/devices/lights/hooks/useLightsData');
jest.mock('@/app/components/devices/lights/hooks/useLightsCommands');

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
// Mock the real LightsSheet body (Phase 178-09 swap) so the card-level test
// does not run LightsSheet's hooks (room grouping, scene catalog lookup, etc.).
jest.mock('../../sheets/LightsSheet', () => ({
  LightsSheet: () => <div data-testid="lights-sheet" />,
}));

const mockUseLightsData = jest.mocked(useLightsData);
const mockUseLightsCommands = jest.mocked(useLightsCommands);

// Minimal stub returning only the fields LightsCard reads. Cast to the
// full return type because tests don't exercise the unused derived fields.
type AnyData = ReturnType<typeof useLightsData>;
type AnyCmds = ReturnType<typeof useLightsCommands>;

function makeData(lights: Array<{ light_id: string; name: string; on: boolean }>): AnyData {
  return { lights } as unknown as AnyData;
}

function makeCmds(handleAllLightsToggle: jest.Mock): AnyCmds {
  return { handleAllLightsToggle } as unknown as AnyCmds;
}

describe('LightsCard (Phase 177 — DASH-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('(a) renders on-light row name + footer "1 di 2 accese" (steady-state: at least one light on)', () => {
    mockUseLightsData.mockReturnValue(
      makeData([
        { light_id: '1', name: 'Cucina', on: true },
        { light_id: '2', name: 'Salotto', on: false },
      ]),
    );
    mockUseLightsCommands.mockReturnValue(makeCmds(jest.fn()));

    render(<LightsCard />);

    expect(screen.getByText('Cucina')).toBeInTheDocument();
    expect(screen.getByText(/1 di 2 accese/)).toBeInTheDocument();
  });

  test('(b) all-off fixture renders "Spente" + "{N} disponibili" empty state', () => {
    mockUseLightsData.mockReturnValue(
      makeData([
        { light_id: '1', name: 'Cucina', on: false },
        { light_id: '2', name: 'Salotto', on: false },
      ]),
    );
    mockUseLightsCommands.mockReturnValue(makeCmds(jest.fn()));

    render(<LightsCard />);

    expect(screen.getByText('Spente')).toBeInTheDocument();
    expect(screen.getByText(/2 disponibili/)).toBeInTheDocument();
  });

  test('(c) clicking master toggle calls handleAllLightsToggle(false) (true→false flip) and does NOT open sheet', () => {
    const handleAllLightsToggle = jest.fn();
    mockUseLightsData.mockReturnValue(
      makeData([
        { light_id: '1', name: 'Cucina', on: true },
        { light_id: '2', name: 'Salotto', on: false },
      ]),
    );
    mockUseLightsCommands.mockReturnValue(makeCmds(handleAllLightsToggle));

    render(<LightsCard />);

    // anyOn=true → toggle should call handleAllLightsToggle(false) (turn off)
    fireEvent.click(screen.getByTestId('inline-toggle'));

    expect(handleAllLightsToggle).toHaveBeenCalledTimes(1);
    expect(handleAllLightsToggle).toHaveBeenCalledWith(false);

    // Sheet must remain closed (stopPropagation prevented parent click → onOpen).
    // Sheet no longer uses Radix forceMount → when closed the dialog may be
    // unmounted entirely; either unmounted or data-state="closed" is valid.
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      expect(dialog.getAttribute('data-state')).toBe('closed');
    } else {
      expect(dialog).toBeNull();
    }
  });

  test('(d) clicking card body opens the sheet with the placeholder body', () => {
    mockUseLightsData.mockReturnValue(
      makeData([
        { light_id: '1', name: 'Cucina', on: true },
      ]),
    );
    mockUseLightsCommands.mockReturnValue(makeCmds(jest.fn()));

    render(<LightsCard />);

    // Initial: dialog unmounted (Sheet removed forceMount) OR data-state="closed"
    const dialogBefore = document.querySelector('[role="dialog"]');
    if (dialogBefore) {
      expect(dialogBefore.getAttribute('data-state')).toBe('closed');
    } else {
      expect(dialogBefore).toBeNull();
    }

    fireEvent.click(screen.getByTestId('lights-card'));

    // After click: dialog is open AND the real LightsSheet body is mounted
    // (mocked here) — Phase 178-09 swapped the placeholder for the real body.
    const dialogAfter = document.querySelector('[role="dialog"]');
    expect(dialogAfter?.getAttribute('data-state')).toBe('open');
    expect(screen.getByTestId('lights-sheet')).toBeInTheDocument();
  });

  test('(e) overflow row "+ altre N" shows when more than 4 lights are on', () => {
    mockUseLightsData.mockReturnValue(
      makeData([
        { light_id: '1', name: 'L1', on: true },
        { light_id: '2', name: 'L2', on: true },
        { light_id: '3', name: 'L3', on: true },
        { light_id: '4', name: 'L4', on: true },
        { light_id: '5', name: 'L5', on: true },
        { light_id: '6', name: 'L6', on: true },
        { light_id: '7', name: 'L7', on: false },
      ]),
    );
    mockUseLightsCommands.mockReturnValue(makeCmds(jest.fn()));

    render(<LightsCard />);

    expect(screen.getByText('+ altre 2')).toBeInTheDocument();
    expect(screen.getByText(/6 di 7 accese/)).toBeInTheDocument();
  });

  test('(f) all-off fixture: clicking toggle calls handleAllLightsToggle(true) (false→true flip)', () => {
    const handleAllLightsToggle = jest.fn();
    mockUseLightsData.mockReturnValue(
      makeData([
        { light_id: '1', name: 'Cucina', on: false },
        { light_id: '2', name: 'Salotto', on: false },
      ]),
    );
    mockUseLightsCommands.mockReturnValue(makeCmds(handleAllLightsToggle));

    render(<LightsCard />);

    fireEvent.click(screen.getByTestId('inline-toggle'));

    expect(handleAllLightsToggle).toHaveBeenCalledTimes(1);
    expect(handleAllLightsToggle).toHaveBeenCalledWith(true);
  });
});
