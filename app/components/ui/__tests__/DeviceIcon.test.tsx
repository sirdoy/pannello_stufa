import { render } from '@testing-library/react';
import { Flame, HelpCircle } from 'lucide-react';
import DeviceIcon, { getDeviceIcon } from '../DeviceIcon';

describe('DeviceIcon', () => {
  it('maps a device id to its icon', () => {
    expect(getDeviceIcon('stove')).toBe(Flame);
  });

  it('falls back for an unknown id', () => {
    expect(getDeviceIcon('nope')).toBe(HelpCircle);
  });

  it('renders a decorative svg with the size', () => {
    const { container } = render(<DeviceIcon device="lights" size={30} className="text-(--text-2)" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '30');
    expect(svg).toHaveClass('lucide-lightbulb');
  });
});
