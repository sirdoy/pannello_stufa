// app/components/ui/__tests__/EmptyState.test.js
/**
 * EmptyState Component Tests
 *
 * Tests CVA size variants, accessibility, and rendering of all props.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import EmptyState from '../EmptyState';
import Button from '../Button';

expect.extend(toHaveNoViolations);

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders with all props', () => {
      render(
        <EmptyState
          icon="🏠"
          title="No devices"
          description="Add devices to get started"
          action={<Button>Add Device</Button>}
        />
      );

      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'No devices' })).toBeInTheDocument();
      expect(screen.getByText('Add devices to get started')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Device' })).toBeInTheDocument();
    });

    it('renders without optional props', () => {
      render(<EmptyState title="Empty" />);
      expect(screen.getByRole('heading', { name: 'Empty' })).toBeInTheDocument();
    });

    it('renders with only icon', () => {
      render(<EmptyState icon="📭" />);
      expect(screen.getByText('📭')).toBeInTheDocument();
    });

    it('renders with only description', () => {
      render(<EmptyState description="Nothing here yet" />);
      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    });

    it('renders with only action', () => {
      render(<EmptyState action={<Button>Create</Button>} />);
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('renders ReactNode as icon', () => {
      render(
        <EmptyState
          icon={<span data-testid="custom-icon">Custom</span>}
          title="Custom Icon"
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies sm size variant', () => {
      const { container } = render(<EmptyState title="Test" size="sm" />);
      expect(container.firstChild).toHaveClass('py-4');
      expect(container.firstChild).toHaveClass('gap-2');
    });

    it('applies md size variant (default)', () => {
      const { container } = render(<EmptyState title="Test" />);
      expect(container.firstChild).toHaveClass('py-8');
      expect(container.firstChild).toHaveClass('gap-3');
    });

    it('applies lg size variant', () => {
      const { container } = render(<EmptyState title="Test" size="lg" />);
      expect(container.firstChild).toHaveClass('py-12');
      expect(container.firstChild).toHaveClass('gap-4');
    });

    it('scales icon size with container size', () => {
      const { container, rerender } = render(<EmptyState icon="🏠" title="Test" size="sm" />);
      expect(container.querySelector('[aria-hidden="true"]')).toHaveClass('text-4xl');

      rerender(<EmptyState icon="🏠" title="Test" size="md" />);
      expect(container.querySelector('[aria-hidden="true"]')).toHaveClass('text-6xl');

      rerender(<EmptyState icon="🏠" title="Test" size="lg" />);
      expect(container.querySelector('[aria-hidden="true"]')).toHaveClass('text-7xl');
    });

    it('scales description text size with container size', () => {
      const { container, rerender } = render(
        <EmptyState description="Test description" size="sm" />
      );
      // sm size uses text-sm
      const text = container.querySelector('p');
      expect(text).toHaveClass('text-sm');

      rerender(<EmptyState description="Test description" size="md" />);
      expect(container.querySelector('p')).toHaveClass('text-base');

      rerender(<EmptyState description="Test description" size="lg" />);
      expect(container.querySelector('p')).toHaveClass('text-base');
    });
  });

  describe('Accessibility', () => {
    it('marks icon as decorative with aria-hidden', () => {
      const { container } = render(<EmptyState icon="🏠" title="Test" />);
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveTextContent('🏠');
    });

    it('ReactNode icon wrapper has aria-hidden', () => {
      const { container } = render(
        <EmptyState
          icon={<span data-testid="svg-icon">SVG</span>}
          title="Test"
        />
      );
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toContainElement(screen.getByTestId('svg-icon'));
    });

    it('uses semantic heading for title', () => {
      render(<EmptyState title="Empty State Title" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Empty State Title');
    });

    it('has no accessibility violations with all props', async () => {
      const { container } = render(
        <EmptyState
          icon="🏠"
          title="No items"
          description="Nothing to show"
          action={<Button>Action</Button>}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with minimal props', async () => {
      const { container } = render(<EmptyState title="Empty" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with icon only', async () => {
      const { container } = render(<EmptyState icon="📭" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all size variants', async () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      for (const size of sizes) {
        const { container } = render(
          <EmptyState
            icon="🏠"
            title={`${size} size`}
            description="Test description"
            size={size}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Action Button Keyboard Accessibility', () => {
    it('action button is keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="Empty"
          action={<Button onClick={handleClick}>Add Item</Button>}
        />
      );

      const actionButton = screen.getByRole('button', { name: 'Add Item' });

      // Tab to button
      await user.tab();
      expect(actionButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('action button can be activated with Space', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="Empty"
          action={<Button onClick={handleClick}>Create</Button>}
        />
      );

      const actionButton = screen.getByRole('button', { name: 'Create' });
      actionButton.focus();
      expect(actionButton).toHaveFocus();

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <EmptyState title="Test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('merges className with CVA classes', () => {
      const { container } = render(
        <EmptyState title="Test" size="sm" className="mt-8" />
      );
      expect(container.firstChild).toHaveClass('py-4'); // CVA
      expect(container.firstChild).toHaveClass('mt-8'); // Custom
    });
  });

  describe('Base Classes', () => {
    it('always has text-center and flex classes', () => {
      const { container } = render(<EmptyState title="Test" />);
      expect(container.firstChild).toHaveClass('text-center');
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('flex-col');
      expect(container.firstChild).toHaveClass('items-center');
    });
  });
});
