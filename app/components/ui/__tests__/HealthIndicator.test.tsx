// app/components/ui/__tests__/HealthIndicator.test.js
/**
 * HealthIndicator Component Tests
 *
 * Tests CVA variants, lucide icons, accessibility attributes,
 * pulse animation, and custom label support.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HealthIndicator from '../HealthIndicator';

expect.extend(toHaveNoViolations);

describe('HealthIndicator', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<HealthIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      const { container } = render(<HealthIndicator />);
      expect(container.querySelector('span[role="status"]')).toBeInTheDocument();
    });
  });

  describe('Status Labels', () => {
    it('renders correct label for ok status', () => {
      render(<HealthIndicator status="ok" />);
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('renders correct label for warning status', () => {
      render(<HealthIndicator status="warning" />);
      expect(screen.getByText('Attenzione')).toBeInTheDocument();
    });

    it('renders correct label for error status', () => {
      render(<HealthIndicator status="error" />);
      expect(screen.getByText('Errore')).toBeInTheDocument();
    });

    it('renders correct label for critical status', () => {
      render(<HealthIndicator status="critical" />);
      expect(screen.getByText('Critico')).toBeInTheDocument();
    });

    it('supports custom label override', () => {
      render(<HealthIndicator status="warning" label="Manutenzione necessaria" />);
      expect(screen.getByText('Manutenzione necessaria')).toBeInTheDocument();
      expect(screen.queryByText('Attenzione')).not.toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    it('shows icon by default', () => {
      const { container } = render(<HealthIndicator status="ok" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      const { container } = render(<HealthIndicator status="ok" showIcon={false} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('renders CheckCircle2 for ok status', () => {
      const { container } = render(<HealthIndicator status="ok" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders AlertTriangle for warning status', () => {
      const { container } = render(<HealthIndicator status="warning" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders XCircle for error status', () => {
      const { container } = render(<HealthIndicator status="error" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders AlertOctagon for critical status', () => {
      const { container } = render(<HealthIndicator status="critical" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('icon has aria-hidden="true"', () => {
      const { container } = render(<HealthIndicator status="ok" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Size Variants', () => {
    it('applies sm size variant', () => {
      const { container } = render(<HealthIndicator size="sm" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-xs');
    });

    it('applies md size variant (default)', () => {
      const { container } = render(<HealthIndicator />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-sm');
    });

    it('applies lg size variant', () => {
      const { container } = render(<HealthIndicator size="lg" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-base');
    });

    it('icon has correct size for sm (14px)', () => {
      const { container } = render(<HealthIndicator size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '14');
      expect(svg).toHaveAttribute('height', '14');
    });

    it('icon has correct size for md (16px)', () => {
      const { container } = render(<HealthIndicator size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    it('icon has correct size for lg (20px)', () => {
      const { container } = render(<HealthIndicator size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
    });
  });

  describe('Status Color Variants', () => {
    it('applies ok color (sage)', () => {
      const { container } = render(<HealthIndicator status="ok" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-sage-400');
    });

    it('applies warning color (warning)', () => {
      const { container } = render(<HealthIndicator status="warning" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-warning-400');
    });

    it('applies error color (danger)', () => {
      const { container } = render(<HealthIndicator status="error" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-danger-400');
    });

    it('applies critical color (darker danger)', () => {
      const { container } = render(<HealthIndicator status="critical" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-danger-500');
    });
  });

  describe('Pulse Animation', () => {
    it('does not apply animate-pulse by default', () => {
      const { container } = render(<HealthIndicator status="critical" />);
      const status = container.firstChild;
      expect(status).not.toHaveClass('animate-pulse');
    });

    it('applies animate-pulse when pulse is true', () => {
      const { container } = render(<HealthIndicator status="critical" pulse />);
      const status = container.firstChild;
      expect(status).toHaveClass('animate-pulse');
    });

    it('applies animate-pulse to any status when pulse is true', () => {
      const { container } = render(<HealthIndicator status="ok" pulse />);
      const status = container.firstChild;
      expect(status).toHaveClass('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<HealthIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for status announcements', () => {
      const { container } = render(<HealthIndicator />);
      const status = container.firstChild;
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('icon is hidden from screen readers with aria-hidden', () => {
      const { container } = render(<HealthIndicator />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no accessibility violations with ok status', async () => {
      const { container } = render(<HealthIndicator status="ok" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all statuses', async () => {
      const statuses = ['ok', 'warning', 'error', 'critical'];

      for (const status of statuses) {
        const { container } = render(<HealthIndicator status={status} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('has no a11y violations without icon', async () => {
      const { container } = render(<HealthIndicator status="warning" showIcon={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with pulse', async () => {
      const { container } = render(<HealthIndicator status="critical" pulse />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(<HealthIndicator className="custom-class" />);
      const status = container.firstChild;
      expect(status).toHaveClass('custom-class');
    });

    it('merges className with CVA variants', () => {
      const { container } = render(<HealthIndicator status="warning" className="mt-4" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-warning-400'); // CVA
      expect(status).toHaveClass('mt-4'); // Custom
    });

    it('passes additional props to span', () => {
      const { container } = render(<HealthIndicator data-testid="health-indicator" />);
      expect(container.querySelector('[data-testid="health-indicator"]')).toBeInTheDocument();
    });
  });

  describe('Base Classes', () => {
    it('always has inline-flex and gap-2 classes', () => {
      const { container } = render(<HealthIndicator />);
      const status = container.firstChild;
      expect(status).toHaveClass('inline-flex');
      expect(status).toHaveClass('gap-2');
    });

    it('always has font-display and font-medium classes', () => {
      const { container } = render(<HealthIndicator />);
      const status = container.firstChild;
      expect(status).toHaveClass('font-display');
      expect(status).toHaveClass('font-medium');
    });
  });
});
