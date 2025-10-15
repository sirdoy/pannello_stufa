import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  describe('Rendering', () => {
    test('renders status text', () => {
      render(<StatusBadge status="WORK" />);
      expect(screen.getByText('WORK')).toBeInTheDocument();
    });

    test('renders custom icon when provided', () => {
      render(<StatusBadge status="WORK" icon="🚀" />);
      expect(screen.getByText('🚀')).toBeInTheDocument();
      // Should not show default icon when custom icon provided
      expect(screen.queryByText('🔥')).not.toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    test('applies success color for WORK status', () => {
      render(<StatusBadge status="WORK" />);
      const statusElement = screen.getByText('WORK');
      expect(statusElement).toHaveClass('text-success-600');
    });

    test('applies neutral color for OFF status', () => {
      render(<StatusBadge status="OFF" />);
      const statusElement = screen.getByText('OFF');
      expect(statusElement).toHaveClass('text-neutral-500');
    });

    test('applies warning color for STANDBY status', () => {
      render(<StatusBadge status="STANDBY" />);
      const statusElement = screen.getByText('STANDBY');
      expect(statusElement).toHaveClass('text-warning-500');
    });

    test('applies danger color for ERROR status', () => {
      render(<StatusBadge status="ERROR" />);
      const statusElement = screen.getByText('ERROR');
      expect(statusElement).toHaveClass('text-primary-600');
      expect(statusElement).toHaveClass('font-bold');
    });

    test('applies neutral color for unknown status', () => {
      render(<StatusBadge status="UNKNOWN" />);
      const statusElement = screen.getByText('UNKNOWN');
      expect(statusElement).toHaveClass('text-neutral-500');
    });

    test('applies neutral color when no status provided', () => {
      render(<StatusBadge />);
      const container = screen.getByText('❔').parentElement;
      expect(container?.querySelector('p')).toHaveClass('text-neutral-500');
    });
  });

  describe('Status Icons', () => {
    test('shows fire icon for WORK status', () => {
      render(<StatusBadge status="WORK" />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    test('shows snowflake icon for OFF status', () => {
      render(<StatusBadge status="OFF" />);
      expect(screen.getByText('❄️')).toBeInTheDocument();
    });

    test('shows warning icon for ERROR status', () => {
      render(<StatusBadge status="ERROR" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    test('shows timer icon for START status', () => {
      render(<StatusBadge status="START" />);
      expect(screen.getByText('⏱️')).toBeInTheDocument();
    });

    test('shows sleep icon for WAIT status', () => {
      render(<StatusBadge status="WAIT" />);
      expect(screen.getByText('💤')).toBeInTheDocument();
    });

    test('shows question mark for unknown status', () => {
      render(<StatusBadge status="UNKNOWN" />);
      expect(screen.getByText('❔')).toBeInTheDocument();
    });

    test('shows question mark when no status provided', () => {
      render(<StatusBadge />);
      expect(screen.getByText('❔')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    test('renders medium size by default', () => {
      const { container } = render(<StatusBadge status="WORK" />);
      const icon = screen.getByText('🔥');
      const text = screen.getByText('WORK');

      expect(icon).toHaveClass('text-5xl');
      expect(text).toHaveClass('text-3xl');
    });

    test('renders small size', () => {
      const { container } = render(<StatusBadge status="WORK" size="sm" />);
      const icon = screen.getByText('🔥');
      const text = screen.getByText('WORK');

      expect(icon).toHaveClass('text-2xl');
      expect(text).toHaveClass('text-base');
    });

    test('renders large size', () => {
      const { container } = render(<StatusBadge status="WORK" size="lg" />);
      const icon = screen.getByText('🔥');
      const text = screen.getByText('WORK');

      expect(icon).toHaveClass('text-6xl');
      expect(text).toHaveClass('text-4xl');
    });
  });

  describe('Layout', () => {
    test('renders with flex layout', () => {
      const { container } = render(<StatusBadge status="WORK" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    test('has proper spacing', () => {
      const { container } = render(<StatusBadge status="WORK" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('gap-4');
      expect(wrapper).toHaveClass('py-6');
    });
  });

  describe('Status Text Matching', () => {
    test('matches status containing WORK substring', () => {
      render(<StatusBadge status="WORK_MODE" />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
      const statusElement = screen.getByText('WORK_MODE');
      expect(statusElement).toHaveClass('text-success-600');
    });

    test('matches status containing OFF substring', () => {
      render(<StatusBadge status="POWER_OFF" />);
      expect(screen.getByText('❄️')).toBeInTheDocument();
      const statusElement = screen.getByText('POWER_OFF');
      expect(statusElement).toHaveClass('text-neutral-500');
    });

    test('matches status containing ERROR substring', () => {
      render(<StatusBadge status="ERROR_123" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
      const statusElement = screen.getByText('ERROR_123');
      expect(statusElement).toHaveClass('text-primary-600');
    });
  });
});
