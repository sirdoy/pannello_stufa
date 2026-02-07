// app/components/ui/__tests__/Grid.test.js
/**
 * Grid Component Tests
 *
 * Tests cols variants, gap variants, responsive classes, and accessibility.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Grid, { gridVariants } from '../Grid';

expect.extend(toHaveNoViolations);

describe('Grid', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <Grid>
          <div>Item 1</div>
          <div>Item 2</div>
        </Grid>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('has grid class', () => {
      const { container } = render(
        <Grid>
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('grid');
    });
  });

  describe('Column Variants', () => {
    it('applies cols variants', () => {
      const { container, rerender } = render(
        <Grid cols={2}>
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('sm:grid-cols-2');

      rerender(
        <Grid cols={4}>
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('xl:grid-cols-4');
    });

    it('applies cols=1 variant', () => {
      const { container } = render(<Grid cols={1}>Content</Grid>);
      expect(container.firstChild).toHaveClass('grid-cols-1');
    });

    it('applies cols=2 variant with responsive classes', () => {
      const { container } = render(<Grid cols={2}>Content</Grid>);
      expect(container.firstChild).toHaveClass('grid-cols-1');
      expect(container.firstChild).toHaveClass('sm:grid-cols-2');
    });

    it('applies cols=3 variant (default) with responsive classes', () => {
      const { container } = render(<Grid>Content</Grid>);
      expect(container.firstChild).toHaveClass('grid-cols-1');
      expect(container.firstChild).toHaveClass('sm:grid-cols-2');
      expect(container.firstChild).toHaveClass('lg:grid-cols-3');
    });

    it('applies cols=4 variant with responsive classes', () => {
      const { container } = render(<Grid cols={4}>Content</Grid>);
      expect(container.firstChild).toHaveClass('grid-cols-1');
      expect(container.firstChild).toHaveClass('sm:grid-cols-2');
      expect(container.firstChild).toHaveClass('lg:grid-cols-3');
      expect(container.firstChild).toHaveClass('xl:grid-cols-4');
    });

    it('applies cols=5 variant with all responsive breakpoints', () => {
      const { container } = render(<Grid cols={5}>Content</Grid>);
      expect(container.firstChild).toHaveClass('grid-cols-1');
      expect(container.firstChild).toHaveClass('sm:grid-cols-2');
      expect(container.firstChild).toHaveClass('lg:grid-cols-3');
      expect(container.firstChild).toHaveClass('xl:grid-cols-4');
      expect(container.firstChild).toHaveClass('2xl:grid-cols-5');
    });

    it('applies cols=6 variant with all responsive breakpoints', () => {
      const { container } = render(<Grid cols={6}>Content</Grid>);
      expect(container.firstChild).toHaveClass('grid-cols-2');
      expect(container.firstChild).toHaveClass('sm:grid-cols-3');
      expect(container.firstChild).toHaveClass('lg:grid-cols-4');
      expect(container.firstChild).toHaveClass('xl:grid-cols-5');
      expect(container.firstChild).toHaveClass('2xl:grid-cols-6');
    });
  });

  describe('Gap Variants', () => {
    it('applies gap variants', () => {
      const { container, rerender } = render(
        <Grid gap="sm">
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('gap-3');

      rerender(
        <Grid gap="lg">
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('gap-6');
    });

    it('applies gap=none variant', () => {
      const { container } = render(<Grid gap="none">Content</Grid>);
      expect(container.firstChild).toHaveClass('gap-0');
    });

    it('applies gap=sm variant', () => {
      const { container } = render(<Grid gap="sm">Content</Grid>);
      expect(container.firstChild).toHaveClass('gap-3');
      expect(container.firstChild).toHaveClass('sm:gap-4');
    });

    it('applies gap=md variant (default)', () => {
      const { container } = render(<Grid>Content</Grid>);
      expect(container.firstChild).toHaveClass('gap-4');
      expect(container.firstChild).toHaveClass('sm:gap-5');
      expect(container.firstChild).toHaveClass('lg:gap-6');
    });

    it('applies gap=lg variant', () => {
      const { container } = render(<Grid gap="lg">Content</Grid>);
      expect(container.firstChild).toHaveClass('gap-6');
      expect(container.firstChild).toHaveClass('sm:gap-8');
      expect(container.firstChild).toHaveClass('lg:gap-10');
    });
  });

  describe('Polymorphic Rendering', () => {
    it('renders as div by default', () => {
      const { container } = render(<Grid>Content</Grid>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('allows custom className to override', () => {
      const { container } = render(
        <Grid className="grid-cols-5">
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('grid-cols-5');
    });

    it('renders as different element', () => {
      render(
        <Grid as="ul" data-testid="grid">
          <li>Item 1</li>
          <li>Item 2</li>
        </Grid>
      );
      expect(screen.getByTestId('grid').tagName).toBe('UL');
    });

    it('renders as nav', () => {
      render(
        <Grid as="nav" data-testid="grid">
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
        </Grid>
      );
      expect(screen.getByTestId('grid').tagName).toBe('NAV');
    });
  });

  describe('Defaults', () => {
    it('defaults to 3 cols and md gap', () => {
      const { container } = render(
        <Grid>
          <div>Item</div>
        </Grid>
      );
      expect(container.firstChild).toHaveClass('lg:grid-cols-3');
      expect(container.firstChild).toHaveClass('gap-4');
    });
  });

  describe('CVA Export', () => {
    it('exports gridVariants function', () => {
      expect(typeof gridVariants).toBe('function');
    });

    it('gridVariants returns correct classes for cols=2', () => {
      const classes = gridVariants({ cols: 2 });
      expect(classes).toContain('grid');
      expect(classes).toContain('sm:grid-cols-2');
    });

    it('gridVariants returns correct classes for gap=lg', () => {
      const classes = gridVariants({ gap: 'lg' });
      expect(classes).toContain('gap-6');
    });

    it('gridVariants combines cols and gap correctly', () => {
      const classes = gridVariants({ cols: 4, gap: 'sm' });
      expect(classes).toContain('xl:grid-cols-4');
      expect(classes).toContain('gap-3');
    });

    it('gridVariants uses default values', () => {
      const classes = gridVariants({});
      expect(classes).toContain('lg:grid-cols-3'); // default cols=3
      expect(classes).toContain('gap-4'); // default gap=md
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(<Grid className="custom-class">Content</Grid>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('className merges with grid classes', () => {
      const { container } = render(
        <Grid cols={2} gap="sm" className="my-4">
          Content
        </Grid>
      );
      expect(container.firstChild).toHaveClass('grid');
      expect(container.firstChild).toHaveClass('sm:grid-cols-2');
      expect(container.firstChild).toHaveClass('gap-3');
      expect(container.firstChild).toHaveClass('my-4');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Grid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all cols/gap combinations', async () => {
      const { container } = render(
        <Grid cols={4} gap="lg">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </Grid>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
