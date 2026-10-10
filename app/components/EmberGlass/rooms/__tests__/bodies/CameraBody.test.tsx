/**
 * CameraBody — state of a Netatmo camera (ROADMAP M84): power and SD card chips, and the button
 * that opens the camera page.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import type { RoomDevice } from '../../types';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn(), back: jest.fn() }),
}));

import { CameraBody } from '../../bodies/CameraBody';

function makeDevice(extra: Record<string, unknown> = {}): RoomDevice {
  return {
    id: 31,
    kind: 'camera',
    name: 'Telecamera garage',
    on: true,
    statusLabel: 'Accesa',
    value: '',
    tone: '#6aa86a',
    extra: { cameraId: '70:ee:50:00:00:01', power: 'on', sd: 'on', ...extra },
  };
}

function chipValue(label: string): string | null {
  const chip = screen.getByText(label).parentElement!;
  return within(chip).getByTestId('stat-chip-value').textContent;
}

describe('CameraBody', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows power and SD card as "Ok" when both are on', () => {
    render(<CameraBody device={makeDevice()} />);

    expect(screen.getAllByTestId('stat-chip')).toHaveLength(2);
    expect(chipValue('Alimentazione')).toBe('Ok');
    expect(chipValue('Scheda SD')).toBe('Ok');
  });

  it('shows "Assente" for what is off', () => {
    render(<CameraBody device={makeDevice({ power: 'off', sd: 'off' })} />);

    expect(chipValue('Alimentazione')).toBe('Assente');
    expect(chipValue('Scheda SD')).toBe('Assente');
  });

  it('reads the two states independently', () => {
    render(<CameraBody device={makeDevice({ power: 'on', sd: 'off' })} />);

    expect(chipValue('Alimentazione')).toBe('Ok');
    expect(chipValue('Scheda SD')).toBe('Assente');
  });

  it.each([
    ['null', { power: null, sd: null }],
    ['missing', { power: undefined, sd: undefined }],
    ['an unknown value', { power: 'unknown', sd: 'formatting' }],
  ])('shows a dash, never a made-up state, when the reading is %s', (_label, extra) => {
    render(<CameraBody device={makeDevice(extra)} />);

    expect(chipValue('Alimentazione')).toBe('—');
    expect(chipValue('Scheda SD')).toBe('—');
  });

  it('"Apri telecamera" opens the camera page', () => {
    render(<CameraBody device={makeDevice()} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Apri telecamera' }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/camera');
  });

  it('has no preview and no live caption any more', () => {
    render(<CameraBody device={makeDevice()} />);

    expect(screen.queryByTestId('stanze-camera-preview')).not.toBeInTheDocument();
    expect(screen.queryByText(/LIVE/)).not.toBeInTheDocument();
  });
});
