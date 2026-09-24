/**
 * TuyaPlugCard timer — backend POST /tuya/plugs/{id}/timer accepts seconds 0..86400.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TuyaPlugCard } from '../TuyaPlugCard';
import type { TuyaPlug } from '@/types/tuyaProxy';

jest.mock('../TuyaEnergyChart', () => () => null);

const plug: TuyaPlug = {
  device_id: 'bf123',
  switch_on: true,
  power_w: 10,
  voltage_v: 230,
  current_ma: 40,
  energy_kwh: 1.2,
  countdown_s: 0,
  data_freshness: 'LIVE',
  last_polled_at: 1773000000,
  custom_name: 'Presa',
  device_type: null,
};

function setup() {
  const onSetTimer = jest.fn();
  render(
    <TuyaPlugCard plug={plug} onToggle={jest.fn()} onSetTimer={onSetTimer} onCancelTimer={jest.fn()} />,
  );
  const input = screen.getByLabelText('Minuti timer');
  const submit = screen.getByRole('button', { name: 'Imposta' });
  return { onSetTimer, input, submit };
}

describe('TuyaPlugCard timer', () => {
  it('sends minutes converted to seconds', () => {
    const { onSetTimer, input, submit } = setup();
    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.click(submit);
    expect(onSetTimer).toHaveBeenCalledWith('bf123', 1800);
  });

  it('accepts the 24 h maximum (1440 min = 86400 s)', () => {
    const { onSetTimer, input, submit } = setup();
    fireEvent.change(input, { target: { value: '1440' } });
    fireEvent.click(submit);
    expect(onSetTimer).toHaveBeenCalledWith('bf123', 86400);
  });

  it('does not send values above the backend limit (would be a silent 422)', () => {
    const { onSetTimer, input, submit } = setup();
    fireEvent.change(input, { target: { value: '1441' } });
    fireEvent.click(submit);
    expect(onSetTimer).not.toHaveBeenCalled();
  });
});
