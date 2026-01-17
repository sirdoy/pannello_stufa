import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Variants', () => {
  describe('Badge Variant (Default)', () => {
    test('renders inline badge', () => {
      render(<StatusBadge status="WORK" />);
      expect(screen.getByText('WORK')).toBeInTheDocument();
    });

    test('uses auto-detected icon', () => {
      const { container } = render(<StatusBadge status="WORK" />);
      expect(container.textContent).toContain('🔥');
    });

    test('uses custom icon', () => {
      render(<StatusBadge status="TEST" icon="⚡" />);
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    test('applies correct color classes', () => {
      const { container } = render(
        <StatusBadge status="Warning" color="warning" />
      );
      // Check for warning color classes (dark mode default)
      expect(container.querySelector('.bg-warning-500\\/15')).toBeInTheDocument();
    });

    test('renders with icon', () => {
      render(<StatusBadge status="Info" icon="ℹ️" color="ocean" />);
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Display Variant', () => {
    test('renders large status display', () => {
      const { container } = render(<StatusBadge status="WORK" variant="display" />);
      expect(screen.getByText('WORK')).toBeInTheDocument();
      expect(container.querySelector('.text-5xl')).toBeInTheDocument(); // md size icon
    });

    test('renders small size display', () => {
      const { container } = render(<StatusBadge status="TEST" variant="display" size="sm" />);
      expect(container.querySelector('.text-3xl')).toBeInTheDocument();
    });

    test('renders large size display', () => {
      const { container } = render(<StatusBadge status="TEST" variant="display" size="lg" />);
      expect(container.querySelector('.text-7xl')).toBeInTheDocument();
    });
  });

  describe('Floating Variant', () => {
    test('renders floating badge', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="SANDBOX" icon="🧪" />
      );
      const badge = container.querySelector('.absolute');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('-top-1.5'); // Updated position
      expect(badge).toHaveClass('-right-1.5');
      expect(badge).toHaveClass('z-20');
    });

    test('uses ember gradient by default', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="TEST" />
      );
      const badge = container.querySelector('.from-ember-500');
      expect(badge).toBeInTheDocument();
    });

    test('supports different positions', () => {
      const { container: topLeft } = render(
        <StatusBadge variant="floating" text="TL" position="top-left" />
      );
      const tl = topLeft.querySelector('.absolute');
      expect(tl).toHaveClass('-top-1.5');
      expect(tl).toHaveClass('-left-1.5');

      const { container: bottomRight } = render(
        <StatusBadge variant="floating" text="BR" position="bottom-right" />
      );
      const br = bottomRight.querySelector('.absolute');
      expect(br).toHaveClass('-bottom-1.5');
      expect(br).toHaveClass('-right-1.5');
    });

    test('renders blur effect with pulse', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="TEST" pulse={true} />
      );
      const blur = container.querySelector('.blur-md.animate-pulse');
      expect(blur).toBeInTheDocument();
    });

    test('no blur effect without pulse', () => {
      const { container } = render(
        <StatusBadge variant="floating" text="TEST" pulse={false} />
      );
      const blur = container.querySelector('.blur-md.animate-pulse');
      expect(blur).not.toBeInTheDocument();
    });
  });

  describe('Dot Variant', () => {
    test('renders status dot', () => {
      const { container } = render(<StatusBadge status="Active" variant="dot" />);
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    test('renders with pulse animation', () => {
      const { container } = render(<StatusBadge status="Active" variant="dot" pulse={true} />);
      const dot = container.querySelector('.animate-pulse');
      expect(dot).toBeInTheDocument();
    });
  });
});
