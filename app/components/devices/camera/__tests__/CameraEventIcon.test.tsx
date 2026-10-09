import { render } from '@testing-library/react';
import CameraEventIcon from '../CameraEventIcon';

describe('CameraEventIcon', () => {
  it.each([
    ['person', 'user'],
    ['animal', 'paw-print'],
    ['vehicle', 'car'],
    ['outdoor', 'trees'],
  ])('maps %s to its icon', (type, icon) => {
    const { container } = render(<CameraEventIcon type={type} />);
    expect(container.querySelector(`svg.lucide-${icon}`)).toBeInTheDocument();
  });

  it('falls back to the camera for an unknown type', () => {
    const { container } = render(<CameraEventIcon type="nope" size={48} />);
    const svg = container.querySelector('svg.lucide-camera');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
