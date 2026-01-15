import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

describe('ProgressBar Component', () => {
  describe('Rendering', () => {
    test('renders progress bar', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    test('renders with correct value', () => {
      const { container } = render(<ProgressBar value={75} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    test('renders with label', () => {
      render(<ProgressBar value={50} label="Progress" />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    test('renders with left and right content', () => {
      render(
        <ProgressBar
          value={50}
          leftContent={<span>Left</span>}
          rightContent={<span>Right</span>}
        />
      );
      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    test('renders primary color by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const bar = container.querySelector('.from-ember-400');
      expect(bar).toBeInTheDocument();
    });

    test('renders success color', () => {
      const { container } = render(<ProgressBar value={50} color="success" />);
      const bar = container.querySelector('.from-sage-400');
      expect(bar).toBeInTheDocument();
    });

    test('renders custom gradient', () => {
      const { container } = render(
        <ProgressBar value={50} gradient="from-red-400 to-orange-500" />
      );
      const bar = container.querySelector('.from-red-400');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    test('renders medium size by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const track = container.querySelector('.h-3');
      expect(track).toBeInTheDocument();
    });

    test('renders small size', () => {
      const { container } = render(<ProgressBar value={50} size="sm" />);
      const track = container.querySelector('.h-2');
      expect(track).toBeInTheDocument();
    });

    test('renders large size', () => {
      const { container } = render(<ProgressBar value={50} size="lg" />);
      const track = container.querySelector('.h-4');
      expect(track).toBeInTheDocument();
    });
  });

  describe('Value Clamping', () => {
    test('clamps value below 0 to 0', () => {
      const { container } = render(<ProgressBar value={-10} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    test('clamps value above 100 to 100', () => {
      const { container } = render(<ProgressBar value={150} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Animation', () => {
    test('applies animation by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const bar = container.querySelector('.transition-all');
      expect(bar).toBeInTheDocument();
    });

    test('disables animation when animated=false', () => {
      const { container } = render(<ProgressBar value={50} animated={false} />);
      const bar = container.querySelector('[role="progressbar"]').parentElement.firstChild;
      expect(bar).not.toHaveClass('transition-all');
    });
  });
});
