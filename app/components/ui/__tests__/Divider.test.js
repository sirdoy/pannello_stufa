// app/components/ui/__tests__/Divider.test.js
/**
 * Divider Component Tests
 *
 * Tests accessibility, CVA variants, orientation, and label support.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Divider from '../Divider';

expect.extend(toHaveNoViolations);

describe('Divider', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations for horizontal divider', async () => {
      const { container } = render(<Divider />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations for vertical divider', async () => {
      const { container } = render(
        <div style={{ height: '100px' }}>
          <Divider orientation="vertical" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations for divider with label', async () => {
      const { container } = render(<Divider label="Section" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role=separator for horizontal divider', () => {
      render(<Divider />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('has role=separator for vertical divider', () => {
      render(<Divider orientation="vertical" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  describe('CVA Variants', () => {
    it('applies solid variant classes (default)', () => {
      const { container } = render(<Divider />);
      const line = container.querySelector('.h-px');
      expect(line).toHaveClass('bg-slate-700');
    });

    it('applies dashed variant classes', () => {
      const { container } = render(<Divider variant="dashed" />);
      const line = container.querySelector('.h-px');
      expect(line).toHaveClass('border-dashed', 'border-slate-600', 'border-t-2');
    });

    it('applies gradient variant classes', () => {
      const { container } = render(<Divider variant="gradient" />);
      const line = container.querySelector('.h-px');
      expect(line).toHaveClass('bg-gradient-to-r', 'from-transparent');
    });
  });

  describe('Orientation', () => {
    it('renders horizontal with h-px', () => {
      const { container } = render(<Divider orientation="horizontal" />);
      const line = container.querySelector('.h-px');
      expect(line).toBeInTheDocument();
      expect(line).toHaveClass('w-full');
    });

    it('renders vertical with w-px', () => {
      const { container } = render(<Divider orientation="vertical" />);
      const line = container.querySelector('.w-px');
      expect(line).toBeInTheDocument();
      expect(line).toHaveClass('h-full');
    });
  });

  describe('Spacing', () => {
    it('applies small spacing for horizontal', () => {
      render(<Divider spacing="small" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('my-4');
    });

    it('applies medium spacing for horizontal (default)', () => {
      render(<Divider />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('my-6');
    });

    it('applies large spacing for horizontal', () => {
      render(<Divider spacing="large" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('my-8');
    });

    it('applies small spacing for vertical', () => {
      render(<Divider orientation="vertical" spacing="small" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('mx-4');
    });

    it('applies medium spacing for vertical', () => {
      render(<Divider orientation="vertical" spacing="medium" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('mx-6');
    });

    it('applies large spacing for vertical', () => {
      render(<Divider orientation="vertical" spacing="large" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('mx-8');
    });
  });

  describe('Label', () => {
    it('renders label text', () => {
      render(<Divider label="Section Title" />);
      expect(screen.getByText('Section Title')).toBeInTheDocument();
    });

    it('applies label pill styling', () => {
      render(<Divider label="Styled" />);
      const labelSpan = screen.getByText('Styled');
      expect(labelSpan).toHaveClass('backdrop-blur-xl', 'rounded-full', 'uppercase');
    });

    it('label has proper color classes', () => {
      render(<Divider label="Colors" />);
      const labelSpan = screen.getByText('Colors');
      expect(labelSpan).toHaveClass('bg-slate-800/80', 'text-slate-300');
    });

    it('line behind label is hidden from screen readers', () => {
      const { container } = render(<Divider label="Hidden Line" />);
      const lineWrapper = container.querySelector('[aria-hidden="true"]');
      expect(lineWrapper).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Divider className="custom-divider" />);
      const divider = screen.getByRole('separator');
      expect(divider).toHaveClass('custom-divider');
      expect(divider).toHaveClass('my-6'); // Spacing class still applies
    });
  });

  describe('forwardRef', () => {
    it('forwards ref to container element', () => {
      const ref = { current: null };
      render(<Divider ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
