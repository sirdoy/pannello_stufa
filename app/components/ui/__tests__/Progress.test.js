// app/components/ui/__tests__/Progress.test.js
/**
 * Progress Component Tests
 *
 * Tests accessibility, value handling, size variants, and indeterminate state.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Progress from '../Progress';

expect.extend(toHaveNoViolations);

describe('Progress', () => {
  describe('Rendering', () => {
    it('renders with value', () => {
      render(<Progress value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders progressbar role', () => {
      render(<Progress value={75} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Value Handling', () => {
    it('renders indeterminate when value is undefined', () => {
      render(<Progress />);
      const progress = screen.getByRole('progressbar');
      expect(progress).not.toHaveAttribute('aria-valuenow');
    });

    it('renders indeterminate when value is null', () => {
      render(<Progress value={null} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).not.toHaveAttribute('aria-valuenow');
    });

    it('renders indeterminate when prop is true', () => {
      render(<Progress indeterminate />);
      const progress = screen.getByRole('progressbar');
      expect(progress).not.toHaveAttribute('aria-valuenow');
    });

    it('clamps value to max when exceeding', () => {
      render(<Progress value={150} max={100} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('clamps value to 0 when negative', () => {
      render(<Progress value={-10} max={100} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('respects custom max value', () => {
      render(<Progress value={50} max={200} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '50');
      expect(progress).toHaveAttribute('aria-valuemax', '200');
    });
  });

  describe('ARIA Attributes', () => {
    it('has correct ARIA attributes for determinate state', () => {
      render(<Progress value={75} max={100} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
    });

    it('omits aria-valuenow for indeterminate state', () => {
      render(<Progress indeterminate />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuemax');
      expect(progress).toHaveAttribute('aria-valuemin');
      expect(progress).not.toHaveAttribute('aria-valuenow');
    });
  });

  describe('Size Variants', () => {
    it('applies sm size variant', () => {
      const { container } = render(<Progress value={50} size="sm" />);
      expect(container.firstChild).toHaveClass('h-1.5');
    });

    it('applies md size variant (default)', () => {
      const { container } = render(<Progress value={50} />);
      expect(container.firstChild).toHaveClass('h-2.5');
    });

    it('applies lg size variant', () => {
      const { container } = render(<Progress value={50} size="lg" />);
      expect(container.firstChild).toHaveClass('h-4');
    });
  });

  describe('Color Variants', () => {
    // Helper to get the indicator element (child of progressbar root)
    const getIndicator = (container) => container.querySelector('[role="progressbar"] > div');

    it('applies ember variant by default', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = getIndicator(container);
      expect(indicator).toHaveClass('from-ember-400');
    });

    it('applies ocean variant', () => {
      const { container } = render(<Progress value={50} variant="ocean" />);
      const indicator = getIndicator(container);
      expect(indicator).toHaveClass('from-ocean-400');
    });

    it('applies sage variant', () => {
      const { container } = render(<Progress value={50} variant="sage" />);
      const indicator = getIndicator(container);
      expect(indicator).toHaveClass('from-sage-400');
    });

    it('applies warning variant', () => {
      const { container } = render(<Progress value={50} variant="warning" />);
      const indicator = getIndicator(container);
      expect(indicator).toHaveClass('from-warning-400');
    });

    it('applies danger variant', () => {
      const { container } = render(<Progress value={50} variant="danger" />);
      const indicator = getIndicator(container);
      expect(indicator).toHaveClass('from-danger-400');
    });
  });

  describe('Indeterminate Animation', () => {
    // Helper to get the indicator element (child of progressbar root)
    const getIndicator = (container) => container.querySelector('[role="progressbar"] > div');

    it('applies animation class when indeterminate', () => {
      const { container } = render(<Progress indeterminate />);
      const indicator = getIndicator(container);
      expect(indicator).toHaveClass('animate-progress-indeterminate');
    });

    it('does not apply animation class when determinate', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = getIndicator(container);
      expect(indicator).not.toHaveClass('animate-progress-indeterminate');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with value', async () => {
      const { container } = render(<Progress value={50} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when indeterminate', async () => {
      const { container } = render(<Progress indeterminate />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has default aria-label', () => {
      render(<Progress value={50} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Progress');
    });

    it('accepts custom label prop', () => {
      render(<Progress value={50} label="Upload progress" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Upload progress');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className for root', () => {
      const { container } = render(<Progress value={50} className="custom-root" />);
      expect(container.firstChild).toHaveClass('custom-root');
    });

    it('accepts custom indicatorClassName', () => {
      const { container } = render(
        <Progress value={50} indicatorClassName="custom-indicator" />
      );
      const indicator = container.querySelector('[role="progressbar"] > div');
      expect(indicator).toHaveClass('custom-indicator');
    });

    it('forwards ref to root element', () => {
      const ref = { current: null };
      render(<Progress value={50} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('passes additional props to root', () => {
      render(<Progress value={50} data-testid="custom-progress" />);
      expect(screen.getByTestId('custom-progress')).toBeInTheDocument();
    });
  });
});
