/**
 * DeviceCard spec: row of a device inside RoomSheet (ROADMAP M84).
 *
 * DevicePrimaryControl and the bodies are stubs that can report an error through `onError`;
 * `hasDeviceBody` is the real one. Covers the status line, the body shown only when the device
 * has a reading, and the error banner fed by the control and by the body.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import type { RoomDevice } from '../types';

type SlotProps = { device: RoomDevice; onError?: (message: string | null) => void };

jest.mock('../DevicePrimaryControl', () => ({
  DevicePrimaryControl: ({ device, onError }: SlotProps) => (
    <div data-testid="mock-primary-control" data-device={device.id}>
      <button type="button" onClick={() => onError?.('La presa non ha confermato il comando')}>control fails</button>
      <button type="button" onClick={() => onError?.(null)}>control clears</button>
    </div>
  ),
}));

jest.mock('../DeviceBody', () => {
  const actual = jest.requireActual<typeof import('../DeviceBody')>('../DeviceBody');
  return {
    hasDeviceBody: actual.hasDeviceBody,
    DeviceBody: ({ device, onError }: SlotProps) => (
      <div data-testid="mock-body" data-device={device.id}>
        <button type="button" onClick={() => onError?.('Luce non raggiungibile')}>body fails</button>
      </div>
    ),
  };
});

import { DeviceCard } from '../DeviceCard';

function makeDevice(over: Partial<RoomDevice> = {}): RoomDevice {
  return {
    id: 11,
    kind: 'light',
    name: 'Lampada',
    on: true,
    statusLabel: 'Accesa',
    value: '80%',
    tone: '#f5c84a',
    extra: { lightId: '5', brightness: 80 },
    ...over,
  };
}

describe('DeviceCard: header', () => {
  it('is identified by the registry id and exposes the kind', () => {
    render(<DeviceCard device={makeDevice()} />);
    const card = screen.getByTestId('stanze-device-11');
    expect(card).toHaveAttribute('data-kind', 'light');
    expect(within(card).getByText('Lampada')).toBeInTheDocument();
    expect(card.querySelector('svg.lucide-lightbulb')).not.toBeNull();
  });

  it('two devices with the same name keep distinct cards', () => {
    render(
      <>
        <DeviceCard device={makeDevice({ id: 11 })} />
        <DeviceCard device={makeDevice({ id: 12 })} />
      </>,
    );
    expect(screen.getByTestId('stanze-device-11')).toBeInTheDocument();
    expect(screen.getByTestId('stanze-device-12')).toBeInTheDocument();
  });

  it('status line is "statusLabel · value"', () => {
    render(<DeviceCard device={makeDevice()} />);
    expect(screen.getByText('Accesa · 80%')).toBeInTheDocument();
  });

  it('status line has no separator when there is no value', () => {
    render(<DeviceCard device={makeDevice({ on: false, statusLabel: 'Spenta', value: '' })} />);
    expect(screen.getByText('Spenta')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it('without a statusLabel falls back to "Attivo" / "Inattivo"', () => {
    const { rerender } = render(<DeviceCard device={makeDevice({ statusLabel: undefined })} />);
    expect(screen.getByText('Attivo · 80%')).toBeInTheDocument();

    rerender(<DeviceCard device={makeDevice({ statusLabel: undefined, on: false, value: '' })} />);
    expect(screen.getByText('Inattivo')).toBeInTheDocument();
  });

  it('on: tinted with the device tone; off: plain', () => {
    const { rerender } = render(<DeviceCard device={makeDevice()} />);
    const card = screen.getByTestId('stanze-device-11');
    expect(card.style.background).toContain('linear-gradient');
    expect(card.style.background).toMatch(/#f5c84a|rgb\(245, 200, 74\)/);

    rerender(<DeviceCard device={makeDevice({ on: false })} />);
    expect(card.style.background).toMatch(/rgba\(255,?\s*255,?\s*255,?\s*0\.03\)/);
  });

  it('the card itself is not a control', () => {
    render(<DeviceCard device={makeDevice()} />);
    expect(screen.getByTestId('stanze-device-11').onclick).toBeNull();
  });

  it('gives the device to the primary control', () => {
    render(<DeviceCard device={makeDevice()} />);
    expect(screen.getByTestId('mock-primary-control')).toHaveAttribute('data-device', '11');
  });
});

describe('DeviceCard: body', () => {
  it('shows the body of a device with a reading', () => {
    render(<DeviceCard device={makeDevice()} />);
    expect(screen.getByTestId('mock-body')).toHaveAttribute('data-device', '11');
  });

  it('a device that does not answer says so and has no body', () => {
    render(
      <DeviceCard
        device={makeDevice({ on: false, statusLabel: 'Non risponde', value: '', unreachable: true })}
      />,
    );
    expect(screen.getByText('Non risponde')).toBeInTheDocument();
    expect(screen.queryByText(/Inattivo|Spenta/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-body')).not.toBeInTheDocument();
  });

  it('a stove that does not answer keeps its body (safe "Spegni" command)', () => {
    render(
      <DeviceCard
        device={makeDevice({
          kind: 'stove',
          on: false,
          statusLabel: 'Non risponde',
          value: '',
          unreachable: true,
          extra: {},
        })}
      />,
    );
    expect(screen.getByText('Non risponde')).toBeInTheDocument();
    expect(screen.getByTestId('mock-body')).toHaveAttribute('data-device', '11');
  });

  it('a device still loading ("In attesa") has no body', () => {
    render(
      <DeviceCard
        device={makeDevice({ kind: 'sensor', on: false, statusLabel: 'In attesa', value: '', extra: {} })}
      />,
    );
    expect(screen.getByText('In attesa')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-body')).not.toBeInTheDocument();
  });

  it('the Netatmo relay ("Collegato", no stats) has no body', () => {
    render(
      <DeviceCard device={makeDevice({ kind: 'host', on: false, statusLabel: 'Collegato', value: '', extra: {} })} />,
    );
    expect(screen.getByText('Collegato')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-body')).not.toBeInTheDocument();
  });
});

describe('DeviceCard: refused command', () => {
  it('shows no error at first', () => {
    render(<DeviceCard device={makeDevice()} />);
    expect(screen.queryByTestId('stanze-device-error')).not.toBeInTheDocument();
  });

  it('shows the error reported by the primary control', () => {
    render(<DeviceCard device={makeDevice({ kind: 'plug', extra: { id: 'plug-1' } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'control fails' }));
    expect(screen.getByTestId('stanze-device-error')).toHaveTextContent('La presa non ha confermato il comando');
  });

  it('shows the error reported by the body, inside the same card', () => {
    render(<DeviceCard device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: 'body fails' }));
    const card = screen.getByTestId('stanze-device-11');
    expect(within(card).getByTestId('stanze-device-error')).toHaveTextContent('Luce non raggiungibile');
  });

  it('a later error replaces the previous one', () => {
    render(<DeviceCard device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: 'control fails' }));
    fireEvent.click(screen.getByRole('button', { name: 'body fails' }));
    expect(screen.getAllByTestId('stanze-device-error')).toHaveLength(1);
    expect(screen.getByTestId('stanze-device-error')).toHaveTextContent('Luce non raggiungibile');
  });

  it('onError(null) clears the error (a new command started)', () => {
    render(<DeviceCard device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: 'body fails' }));
    fireEvent.click(screen.getByRole('button', { name: 'control clears' }));
    expect(screen.queryByTestId('stanze-device-error')).not.toBeInTheDocument();
  });

  it('the user can dismiss the error', () => {
    render(<DeviceCard device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: 'body fails' }));
    fireEvent.click(within(screen.getByTestId('stanze-device-error')).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByTestId('stanze-device-error')).not.toBeInTheDocument();
  });

  it('an error of one device is not shown in the card of another', () => {
    render(
      <>
        <DeviceCard device={makeDevice({ id: 11 })} />
        <DeviceCard device={makeDevice({ id: 12 })} />
      </>,
    );
    fireEvent.click(within(screen.getByTestId('stanze-device-11')).getByRole('button', { name: 'body fails' }));
    expect(within(screen.getByTestId('stanze-device-11')).getByTestId('stanze-device-error')).toBeInTheDocument();
    expect(within(screen.getByTestId('stanze-device-12')).queryByTestId('stanze-device-error')).not.toBeInTheDocument();
  });
});
