import { render } from '@testing-library/react';
import QueuedCommandIcon from '../QueuedCommandIcon';

describe('QueuedCommandIcon', () => {
  it('maps a known endpoint to its icon', () => {
    const { container } = render(<QueuedCommandIcon endpoint="stove/ignite" />);
    expect(container.querySelector('svg.lucide-flame')).toHaveAttribute('aria-hidden', 'true');
  });

  it('falls back for an unknown endpoint', () => {
    const { container } = render(<QueuedCommandIcon endpoint="other/thing" size={20} />);
    const svg = container.querySelector('svg.lucide-send');
    expect(svg).toHaveAttribute('width', '20');
  });
});
