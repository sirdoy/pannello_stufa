// app/components/ui/__tests__/Spinner.test.js
/**
 * Spinner Component Tests
 *
 * Tests accessibility, size variants, color variants, and custom props.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Spinner from '../Spinner';

expect.extend(toHaveNoViolations);

describe('Spinner', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders as an SVG element', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies xs size variant', () => {
      const { container } = render(<Spinner size="xs" />);
      expect(container.querySelector('svg')).toHaveClass('h-3', 'w-3');
    });

    it('applies sm size variant', () => {
      const { container } = render(<Spinner size="sm" />);
      expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4');
    });

    it('applies md size variant (default)', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6');
    });

    it('applies lg size variant', () => {
      const { container } = render(<Spinner size="lg" />);
      expect(container.querySelector('svg')).toHaveClass('h-8', 'w-8');
    });

    it('applies xl size variant', () => {
      const { container } = render(<Spinner size="xl" />);
      expect(container.querySelector('svg')).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Color Variants', () => {
    it('applies ember variant (default)', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('svg')).toHaveClass('text-ember-500');
    });

    it('applies white variant', () => {
      const { container } = render(<Spinner variant="white" />);
      expect(container.querySelector('svg')).toHaveClass('text-white');
    });

    it('applies current variant', () => {
      const { container } = render(<Spinner variant="current" />);
      expect(container.querySelector('svg')).toHaveClass('text-current');
    });

    it('applies muted variant', () => {
      const { container } = render(<Spinner variant="muted" />);
      expect(container.querySelector('svg')).toHaveClass('text-slate-400');
    });
  });

  describe('Accessibility', () => {
    it('has accessible label', () => {
      render(<Spinner label="Saving..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Saving...');
    });

    it('has default accessible label', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('has role="status" for screen readers', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<Spinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with custom label', async () => {
      const { container } = render(<Spinner label="Processing data" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Animation', () => {
    it('has animate-spin class', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('svg')).toHaveClass('animate-spin');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(<Spinner className="custom-class" />);
      expect(container.querySelector('svg')).toHaveClass('custom-class');
    });

    it('merges className with variants', () => {
      const { container } = render(<Spinner size="lg" className="extra-style" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8', 'w-8', 'extra-style');
    });

    it('passes additional props to SVG', () => {
      const { container } = render(<Spinner data-testid="spinner-svg" />);
      expect(container.querySelector('[data-testid="spinner-svg"]')).toBeInTheDocument();
    });
  });
});
