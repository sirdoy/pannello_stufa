import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Button, { buttonVariants, ButtonIcon, ButtonGroup } from '../Button';

describe('Button Component', () => {
  describe('Accessibility', () => {
    test('ember variant has no accessibility violations', async () => {
      const { container } = render(<Button variant="ember">Ember</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('subtle variant has no accessibility violations', async () => {
      const { container } = render(<Button variant="subtle">Subtle</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('ghost variant has no accessibility violations', async () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('success variant has no accessibility violations', async () => {
      const { container } = render(<Button variant="success">Success</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('danger variant has no accessibility violations', async () => {
      const { container } = render(<Button variant="danger">Danger</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('outline variant has no accessibility violations', async () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('disabled state has no accessibility violations', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('loading state has no accessibility violations', async () => {
      const { container } = render(<Button loading>Loading</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('iconOnly with aria-label has no accessibility violations', async () => {
      const { container } = render(
        <Button iconOnly icon="X" aria-label="Close" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CVA Variants', () => {
    test('default variant is ember with gradient classes', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-ember-500');
    });

    test('ember variant renders with gradient', () => {
      render(<Button variant="ember">Ember</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-ember-500');
      expect(button).toHaveClass('via-ember-600');
      expect(button).toHaveClass('to-flame-600');
    });

    test('subtle variant renders with glass effect', () => {
      render(<Button variant="subtle">Subtle</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/[0.06]');
      expect(button).toHaveClass('border');
    });

    test('ghost variant renders transparent', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-slate-300');
    });

    test('success variant renders with sage gradient', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-sage-500');
    });

    test('danger variant renders with danger gradient', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-danger-500');
    });

    test('outline variant renders with border', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-ember-500/40');
    });

    test('size sm applies correct min-h class', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('text-sm');
    });

    test('size md applies correct min-h class', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[48px]');
      expect(button).toHaveClass('text-base');
    });

    test('size lg applies correct min-h class', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[56px]');
      expect(button).toHaveClass('text-lg');
    });

    test('fullWidth applies w-full class', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    test('iconOnly applies rounded-full class', () => {
      render(
        <Button iconOnly icon="X" aria-label="Close">
          Close
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });
  });

  describe('Compound Variants', () => {
    test('iconOnly + size sm has min-w-[44px]', () => {
      render(<Button iconOnly size="sm" icon="X" aria-label="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[44px]');
      expect(button).toHaveClass('p-2.5');
    });

    test('iconOnly + size md has min-w-[48px]', () => {
      render(<Button iconOnly size="md" icon="X" aria-label="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[48px]');
      expect(button).toHaveClass('p-3');
    });

    test('iconOnly + size lg has min-w-[56px]', () => {
      render(<Button iconOnly size="lg" icon="X" aria-label="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[56px]');
      expect(button).toHaveClass('p-4');
    });
  });

  describe('States', () => {
    test('disabled renders with opacity class', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    test('loading shows spinner and disables button', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Spinner SVG should be present
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
      // Content should be invisible
      expect(button.querySelector('.invisible')).toBeInTheDocument();
    });

    test('click handlers fire correctly', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('click handlers do not fire when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('click handlers do not fire when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Focus Ring', () => {
    test('has focus-visible:ring-2 class', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    test('has focus-visible:ring-ember-500/50 class for ember glow', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-ember-500/50');
    });
  });

  describe('Namespace Components', () => {
    test('Button.Icon renders with iconOnly and aria-label', async () => {
      const { container } = render(
        <Button.Icon icon="X" aria-label="Close" />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveAttribute('aria-label', 'Close');
      // A11y check
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Button.Icon uses ghost variant by default', () => {
      render(<Button.Icon icon="X" aria-label="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    test('Button.Group renders with role="group"', async () => {
      const { container } = render(
        <Button.Group>
          <Button>One</Button>
          <Button>Two</Button>
        </Button.Group>
      );
      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveClass('flex');
      expect(group).toHaveClass('gap-2');
      // A11y check
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Icon and Content', () => {
    test('renders with icon on left by default', () => {
      render(<Button icon="X">Fire</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('X');
      expect(button).toHaveTextContent('Fire');
    });

    test('renders with icon on right when iconPosition="right"', () => {
      render(
        <Button icon="X" iconPosition="right">
          Fire
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('X');
      expect(button).toHaveTextContent('Fire');
    });

    test('applies custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Ref Forwarding', () => {
    test('forwards ref to button element', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test('ButtonIcon forwards ref', () => {
      const ref = { current: null };
      render(<Button.Icon ref={ref} icon="X" aria-label="Close" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Exports', () => {
    test('buttonVariants is exported', () => {
      expect(buttonVariants).toBeDefined();
      expect(typeof buttonVariants).toBe('function');
    });

    test('ButtonIcon is exported', () => {
      expect(ButtonIcon).toBeDefined();
    });

    test('ButtonGroup is exported', () => {
      expect(ButtonGroup).toBeDefined();
    });
  });
});
