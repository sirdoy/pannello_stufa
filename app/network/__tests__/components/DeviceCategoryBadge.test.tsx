/**
 * DeviceCategoryBadge Tests
 *
 * Tests the DeviceCategoryBadge component including:
 * - Rendering all 5 category types with correct variants
 * - Color-coded badge variants (ocean, sage, warning, ember, neutral)
 * - Interactive mode (cursor, hover, role, tabIndex)
 * - Non-interactive mode (no role/tabIndex)
 */

import { render, screen } from '@testing-library/react';
import DeviceCategoryBadge from '../../components/DeviceCategoryBadge';

// Mock Badge component to avoid UI dependency
jest.mock('@/app/components/ui', () => ({
  Badge: jest.fn(({ children, variant, size, className, onClick, role, tabIndex }) => (
    <span
      data-testid="badge"
      data-variant={variant}
      data-size={size}
      className={className}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
    >
      {children}
    </span>
  )),
}));

describe('DeviceCategoryBadge', () => {
  describe('Category rendering', () => {
    it('renders IoT badge with ocean variant', () => {
      render(<DeviceCategoryBadge category="iot" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-variant', 'ocean');
      expect(badge).toHaveTextContent('IoT');
    });

    it('renders Mobile badge with sage variant', () => {
      render(<DeviceCategoryBadge category="mobile" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'sage');
      expect(badge).toHaveTextContent('Mobile');
    });

    it('renders PC badge with warning variant', () => {
      render(<DeviceCategoryBadge category="pc" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'warning');
      expect(badge).toHaveTextContent('PC');
    });

    it('renders Smart Home badge with ember variant', () => {
      render(<DeviceCategoryBadge category="smart-home" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'ember');
      expect(badge).toHaveTextContent('Smart Home');
    });

    it('renders Sconosciuto badge with neutral variant for unknown', () => {
      render(<DeviceCategoryBadge category="unknown" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'neutral');
      expect(badge).toHaveTextContent('Sconosciuto');
    });
  });

  describe('Interactive mode', () => {
    it('applies cursor-pointer and hover classes when onClick provided', () => {
      const handleClick = jest.fn();
      render(<DeviceCategoryBadge category="mobile" onClick={handleClick} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('cursor-pointer');
      expect(badge).toHaveClass('hover:opacity-80');
      expect(badge).toHaveClass('transition-opacity');
    });

    it('sets role="button" and tabIndex=0 when onClick provided', () => {
      const handleClick = jest.fn();
      render(<DeviceCategoryBadge category="pc" onClick={handleClick} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('role', 'button');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Non-interactive mode', () => {
    it('does NOT set role/tabIndex when no onClick (read-only)', () => {
      render(<DeviceCategoryBadge category="iot" />);

      const badge = screen.getByTestId('badge');
      expect(badge).not.toHaveAttribute('role');
      expect(badge).not.toHaveAttribute('tabIndex');
      expect(badge).not.toHaveClass('cursor-pointer');
    });
  });
});
