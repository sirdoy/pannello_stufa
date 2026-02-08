import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

// Mock Text component to avoid dependency issues
jest.mock('../Text', () => ({
  __esModule: true,
  default: ({ children, as: Component = 'span', ...props }: any) => <Component {...props}>{children}</Component>
}));

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
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).toHaveClass('from-ember-400');
    });

    test('renders success color', () => {
      const { container } = render(<ProgressBar value={50} color="success" />);
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).toHaveClass('from-sage-400');
    });

    test('renders custom gradient', () => {
      const { container } = render(
        <ProgressBar value={50} gradient="from-red-400 to-orange-500" />
      );
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).toHaveClass('from-red-400');
    });
  });

  describe('Sizes', () => {
    test('renders medium size by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const bar = container.querySelector('[role="progressbar"]');
      // The h-3 class is on the parent container, not the progress bar itself
      expect(bar.parentElement).toHaveClass('h-3');
    });

    test('renders small size', () => {
      const { container } = render(<ProgressBar value={50} size="sm" />);
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar.parentElement).toHaveClass('h-2');
    });

    test('renders large size', () => {
      const { container } = render(<ProgressBar value={50} size="lg" />);
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar.parentElement).toHaveClass('h-4');
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
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).toHaveClass('transition-all');
    });

    test('disables animation when animated=false', () => {
      const { container } = render(<ProgressBar value={50} animated={false} />);
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).not.toHaveClass('transition-all');
    });
  });
});
