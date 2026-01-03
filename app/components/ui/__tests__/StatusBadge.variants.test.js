import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Variants', () => {
  describe('Default Variant', () => {
    test('renders large status display', () => {
      const { container } = render(<StatusBadge status="WORK" />);
      expect(screen.getByText('WORK')).toBeInTheDocument();
      expect(container.querySelector('.text-5xl')).toBeInTheDocument(); // Default md size
    });

    test('uses auto-detected icon', () => {
      const { container } = render(<StatusBadge status="WORK" />);
      expect(container.textContent).toContain('🔥');
    });

    test('uses custom icon', () => {
      render(<StatusBadge status="TEST" icon="⚡" />);
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });

  describe('Floating Variant', () => {
    test('renders floating badge', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="SANDBOX" icon="🧪" color="purple" />
      );
      const badge = container.querySelector('.absolute');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('-top-2', '-right-2', 'z-20');
    });

    test('renders with custom gradient', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="TEST" gradient="from-blue-500 to-green-500" />
      );
      const badge = container.querySelector('.from-blue-500');
      expect(badge).toBeInTheDocument();
    });

    test('renders with color preset', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="ERROR" color="danger" />
      );
      const badge = container.querySelector('.from-primary-500');
      expect(badge).toBeInTheDocument();
    });

    test('supports different positions', () => {
      const { container: topLeft } = render(
        <StatusBadge variant="floating" text="TL" position="top-left" />
      );
      expect(topLeft.querySelector('.-top-2.-left-2')).toBeInTheDocument();

      const { container: bottomRight } = render(
        <StatusBadge variant="floating" text="BR" position="bottom-right" />
      );
      expect(bottomRight.querySelector('.-bottom-2.-right-2')).toBeInTheDocument();
    });

    test('renders blur effect', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="TEST" color="primary" />
      );
      const blur = container.querySelector('.blur-lg.animate-pulse');
      expect(blur).toBeInTheDocument();
    });
  });

  describe('Inline Variant', () => {
    test('renders inline badge', () => {
      render(<StatusBadge variant="inline" text="Active" color="success" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('applies correct color classes', () => {
      const { container } = render(
        <StatusBadge variant="inline" text="Warning" color="warning" />
      );
      const badge = container.querySelector('.bg-warning-100');
      expect(badge).toBeInTheDocument();
    });

    test('renders with icon', () => {
      render(<StatusBadge variant="inline" text="Info" icon="ℹ️" color="info" />);
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Size Variants (Default)', () => {
    test('renders small size', () => {
      const { container } = render(<StatusBadge status="TEST" size="sm" />);
      expect(container.querySelector('.text-2xl')).toBeInTheDocument();
    });

    test('renders large size', () => {
      const { container } = render(<StatusBadge status="TEST" size="lg" />);
      expect(container.querySelector('.text-6xl')).toBeInTheDocument();
    });
  });
});
