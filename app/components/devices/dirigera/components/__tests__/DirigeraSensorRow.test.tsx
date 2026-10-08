/**
 * DirigeraSensorRow — motion sensors show motion and light level together (M60).
 */
import { render } from '@testing-library/react';

import DirigeraSensorRow from '../DirigeraSensorRow';
import type { DirigeraSensor } from '@/types/dirigeraProxy';

const motion = (extra: Partial<DirigeraSensor>): DirigeraSensor => ({
  id: 'm',
  type: 'occupancySensor',
  custom_name: 'Movimento sala',
  room: 'Soggiorno',
  firmware_version: null,
  battery_percentage: 86,
  is_reachable: true,
  last_seen: null,
  is_detected: false,
  ...extra,
});

describe('DirigeraSensorRow motion', () => {
  it('shows motion state and lux', () => {
    const { container } = render(
      <DirigeraSensorRow sensor={motion({ is_detected: true, light_level: 22 })} showFreshness={false} />,
    );
    expect(container).toHaveTextContent('Movimento · 22 lux');
  });

  it('keeps 0 lux as a reading', () => {
    const { container } = render(
      <DirigeraSensorRow sensor={motion({ light_level: 0 })} showFreshness={false} />,
    );
    expect(container).toHaveTextContent('Fermo · 0 lux');
  });

  it('shows only the motion state without a light sensor', () => {
    const { container } = render(<DirigeraSensorRow sensor={motion({})} showFreshness={false} />);
    expect(container).toHaveTextContent('Fermo');
    expect(container).not.toHaveTextContent('lux');
  });
});
