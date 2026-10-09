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
      expect(document.querySelector('svg.lucide-flame')).not.toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    test('applies appropriate styling for WORK status', () => {
      render(<StatusBadge status="WORK" />);
      const statusElement = screen.getByText('WORK');
      // Component should render with ember color theme
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toMatch(/ember/i);
    });

    test('applies appropriate styling for OFF status', () => {
      render(<StatusBadge status="OFF" />);
      const statusElement = screen.getByText('OFF');
      expect(statusElement).toBeInTheDocument();
      // OFF status uses the neutral muted text
      expect(statusElement).toHaveClass('text-(--text-2)');
    });

    test('applies appropriate styling for STANDBY status', () => {
      render(<StatusBadge status="STANDBY" />);
      const statusElement = screen.getByText('STANDBY');
      expect(statusElement).toBeInTheDocument();
      // STANDBY uses warning colors
      expect(statusElement.className).toMatch(/warning/i);
    });

    test('applies appropriate styling for ERROR status', () => {
      render(<StatusBadge status="ERROR" />);
      const statusElement = screen.getByText('ERROR');
      expect(statusElement).toBeInTheDocument();
      // ERROR uses danger colors
      expect(statusElement.className).toMatch(/danger/i);
    });

    test('applies neutral styling for unknown status', () => {
      render(<StatusBadge status="UNKNOWN" />);
      const statusElement = screen.getByText('UNKNOWN');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass('text-(--text-2)');
    });

    test('renders with default styling when no status provided', () => {
      const { container } = render(<StatusBadge />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    test('shows fire icon for WORK status', () => {
      render(<StatusBadge status="WORK" />);
      expect(document.querySelector('svg.lucide-flame')).toBeInTheDocument();
    });

    test('shows snowflake icon for OFF status', () => {
      render(<StatusBadge status="OFF" />);
      expect(document.querySelector('svg.lucide-snowflake')).toBeInTheDocument();
    });

    test('shows warning icon for ERROR status', () => {
      render(<StatusBadge status="ERROR" />);
      expect(document.querySelector('svg.lucide-triangle-alert')).toBeInTheDocument();
    });

    test('shows rocket icon for START status', () => {
      render(<StatusBadge status="START" />);
      expect(document.querySelector('svg.lucide-rocket')).toBeInTheDocument();
    });

    test('shows sleep icon for WAIT status', () => {
      render(<StatusBadge status="WAIT" />);
      expect(document.querySelector('svg.lucide-hourglass')).toBeInTheDocument();
    });

    test('shows cleaning icon for CLEANING status', () => {
      render(<StatusBadge status="CLEANING" />);
      expect(document.querySelector('svg.lucide-refresh-cw')).toBeInTheDocument();
    });

    test('shows modulation icon for MODULATION status', () => {
      render(<StatusBadge status="MODULATION" />);
      expect(document.querySelector('svg.lucide-thermometer')).toBeInTheDocument();
    });

    test('shows no icon for undefined status', () => {
      const { container } = render(<StatusBadge />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Custom Colors', () => {
    test('applies ember color when explicitly set', () => {
      render(<StatusBadge status="TEST" color="ember" />);
      const statusElement = screen.getByText('TEST');
      expect(statusElement.className).toMatch(/ember/i);
    });

    test('applies sage color when explicitly set', () => {
      render(<StatusBadge status="TEST" color="sage" />);
      const statusElement = screen.getByText('TEST');
      expect(statusElement.className).toMatch(/sage/i);
    });

    test('applies ocean color when explicitly set', () => {
      render(<StatusBadge status="TEST" color="ocean" />);
      const statusElement = screen.getByText('TEST');
      expect(statusElement.className).toMatch(/ocean/i);
    });
  });

  describe('Status Text Matching', () => {
    test('matches status containing WORK substring', () => {
      render(<StatusBadge status="WORK_MODULATION" />);
      expect(document.querySelector('svg.lucide-flame')).toBeInTheDocument();
      const statusElement = screen.getByText('WORK_MODULATION');
      expect(statusElement.className).toMatch(/ember/i);
    });

    test('matches status containing OFF substring', () => {
      render(<StatusBadge status="POWER_OFF" />);
      expect(document.querySelector('svg.lucide-snowflake')).toBeInTheDocument();
      const statusElement = screen.getByText('POWER_OFF');
      expect(statusElement).toHaveClass('text-(--text-2)');
    });

    test('matches status containing ERROR substring', () => {
      render(<StatusBadge status="ERROR_123" />);
      expect(document.querySelector('svg.lucide-triangle-alert')).toBeInTheDocument();
      const statusElement = screen.getByText('ERROR_123');
      expect(statusElement.className).toMatch(/danger/i);
    });
  });
});
