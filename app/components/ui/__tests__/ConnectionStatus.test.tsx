// app/components/ui/__tests__/ConnectionStatus.test.js
/**
 * ConnectionStatus Component Tests
 *
 * Tests CVA variants, accessibility attributes, dot visibility,
 * and custom label support.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConnectionStatus from '../ConnectionStatus';

expect.extend(toHaveNoViolations);

describe('ConnectionStatus', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ConnectionStatus />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Sconosciuto')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      const { container } = render(<ConnectionStatus />);
      expect(container.querySelector('span[role="status"]')).toBeInTheDocument();
    });
  });

  describe('Status Labels', () => {
    it('renders correct label for online status', () => {
      render(<ConnectionStatus status="online" />);
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders correct label for offline status', () => {
      render(<ConnectionStatus status="offline" />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('renders correct label for connecting status', () => {
      render(<ConnectionStatus status="connecting" />);
      expect(screen.getByText('Connessione...')).toBeInTheDocument();
    });

    it('renders correct label for unknown status', () => {
      render(<ConnectionStatus status="unknown" />);
      expect(screen.getByText('Sconosciuto')).toBeInTheDocument();
    });

    it('supports custom label override', () => {
      render(<ConnectionStatus status="online" label="Connesso alla rete" />);
      expect(screen.getByText('Connesso alla rete')).toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });
  });

  describe('Status Dot', () => {
    it('shows dot by default', () => {
      const { container } = render(<ConnectionStatus status="online" />);
      const dots = container.querySelectorAll('[aria-hidden="true"]');
      expect(dots.length).toBe(1);
    });

    it('hides dot when showDot is false', () => {
      const { container } = render(<ConnectionStatus status="online" showDot={false} />);
      const dots = container.querySelectorAll('[aria-hidden="true"]');
      expect(dots.length).toBe(0);
    });

    it('dot has rounded-full class', () => {
      const { container } = render(<ConnectionStatus status="online" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('rounded-full');
    });

    it('applies animate-pulse to connecting dot', () => {
      const { container } = render(<ConnectionStatus status="connecting" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('animate-pulse');
    });

    it('does not apply animate-pulse to online dot', () => {
      const { container } = render(<ConnectionStatus status="online" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).not.toHaveClass('animate-pulse');
    });
  });

  describe('Size Variants', () => {
    it('applies sm size variant', () => {
      const { container } = render(<ConnectionStatus size="sm" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-xs');
    });

    it('applies md size variant (default)', () => {
      const { container } = render(<ConnectionStatus />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-sm');
    });

    it('applies lg size variant', () => {
      const { container } = render(<ConnectionStatus size="lg" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-base');
    });

    it('applies correct dot size for sm', () => {
      const { container } = render(<ConnectionStatus size="sm" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('w-1.5', 'h-1.5');
    });

    it('applies correct dot size for md', () => {
      const { container } = render(<ConnectionStatus size="md" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('w-2', 'h-2');
    });

    it('applies correct dot size for lg', () => {
      const { container } = render(<ConnectionStatus size="lg" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('w-2.5', 'h-2.5');
    });
  });

  describe('Status Color Variants', () => {
    it('applies online color (sage)', () => {
      const { container } = render(<ConnectionStatus status="online" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-sage-400');
    });

    it('applies offline color (slate)', () => {
      const { container } = render(<ConnectionStatus status="offline" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-slate-400');
    });

    it('applies connecting color (warning)', () => {
      const { container } = render(<ConnectionStatus status="connecting" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-warning-400');
    });

    it('applies unknown color (muted slate)', () => {
      const { container } = render(<ConnectionStatus status="unknown" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-slate-400/70');
    });

    it('applies correct dot color for online', () => {
      const { container } = render(<ConnectionStatus status="online" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('bg-sage-500');
    });

    it('applies correct dot color for connecting', () => {
      const { container } = render(<ConnectionStatus status="connecting" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('bg-warning-500');
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<ConnectionStatus />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for status announcements', () => {
      const { container } = render(<ConnectionStatus />);
      const status = container.firstChild;
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('dot is hidden from screen readers with aria-hidden', () => {
      const { container } = render(<ConnectionStatus />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });

    it('has no accessibility violations with online status', async () => {
      const { container } = render(<ConnectionStatus status="online" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all statuses', async () => {
      const statuses = ['online', 'offline', 'connecting', 'unknown'];

      for (const status of statuses) {
        const { container } = render(<ConnectionStatus status={status as any} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('has no a11y violations without dot', async () => {
      const { container } = render(<ConnectionStatus status="online" showDot={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(<ConnectionStatus className="custom-class" />);
      const status = container.firstChild;
      expect(status).toHaveClass('custom-class');
    });

    it('merges className with CVA variants', () => {
      const { container } = render(<ConnectionStatus status="online" className="mt-4" />);
      const status = container.firstChild;
      expect(status).toHaveClass('text-sage-400'); // CVA
      expect(status).toHaveClass('mt-4'); // Custom
    });

    it('passes additional props to span', () => {
      const { container } = render(<ConnectionStatus data-testid="connection-status" />);
      expect(container.querySelector('[data-testid="connection-status"]')).toBeInTheDocument();
    });
  });

  describe('Base Classes', () => {
    it('always has inline-flex and gap-2 classes', () => {
      const { container } = render(<ConnectionStatus />);
      const status = container.firstChild;
      expect(status).toHaveClass('inline-flex');
      expect(status).toHaveClass('gap-2');
    });

    it('always has font-display and font-medium classes', () => {
      const { container } = render(<ConnectionStatus />);
      const status = container.firstChild;
      expect(status).toHaveClass('font-display');
      expect(status).toHaveClass('font-medium');
    });
  });
});
