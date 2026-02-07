// app/components/ui/__tests__/SmartHomeCard.test.tsx
/**
 * SmartHomeCard Component Tests
 *
 * Tests accessibility, CVA variants, namespace pattern, state handling,
 * and composition with Card. Uses jest-axe for automated a11y detection.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import SmartHomeCard, {
  smartHomeCardVariants,
  SmartHomeCardHeader,
  SmartHomeCardStatus,
  SmartHomeCardControls,
} from '../SmartHomeCard';

expect.extend(toHaveNoViolations);

describe('SmartHomeCard', () => {
  describe('Accessibility', () => {
    it('has no a11y violations with default props', async () => {
      const { container } = render(
        <SmartHomeCard>
          <p>Card content</p>
        </SmartHomeCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with icon and title', async () => {
      const { container } = render(
        <SmartHomeCard icon="🔥" title="Thermostat">
          <p>Temperature controls</p>
        </SmartHomeCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with error state', async () => {
      const { container } = render(
        <SmartHomeCard error errorMessage="Connection failed">
          <p>Content</p>
        </SmartHomeCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with all sub-components', async () => {
      const { container } = render(
        <SmartHomeCard icon="💡" title="Smart Lights" colorTheme="ocean">
          <SmartHomeCard.Status>
            <span>Connected</span>
          </SmartHomeCard.Status>
          <SmartHomeCard.Controls>
            <button>Turn On</button>
          </SmartHomeCard.Controls>
        </SmartHomeCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations when disabled', async () => {
      const { container } = render(
        <SmartHomeCard icon="🔥" title="Thermostat" disabled>
          <p>Disabled content</p>
        </SmartHomeCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with loading state', async () => {
      const { container } = render(
        <SmartHomeCard isLoading>
          <p>Loading content</p>
        </SmartHomeCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('icon has aria-hidden="true" for decorative purpose', () => {
      const { container } = render(
        <SmartHomeCard icon="🔥" title="Thermostat">
          <p>Content</p>
        </SmartHomeCard>
      );
      const iconSpan = container.querySelector('span[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan).toHaveTextContent('🔥');
    });
  });

  describe('Keyboard Navigation', () => {
    it('interactive buttons within card are focusable via Tab', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <SmartHomeCard icon="💡" title="Lights">
            <SmartHomeCard.Controls>
              <button>Turn On</button>
              <button>Turn Off</button>
            </SmartHomeCard.Controls>
          </SmartHomeCard>
          <button>After</button>
        </>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      beforeButton.focus();

      // Tab to first control button
      await user.tab();
      expect(screen.getByRole('button', { name: 'Turn On' })).toHaveFocus();

      // Tab to second control button
      await user.tab();
      expect(screen.getByRole('button', { name: 'Turn Off' })).toHaveFocus();

      // Tab to after button
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('Enter key activates buttons within card', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <SmartHomeCard icon="💡" title="Lights">
          <SmartHomeCard.Controls>
            <button onClick={onClick}>Toggle</button>
          </SmartHomeCard.Controls>
        </SmartHomeCard>
      );

      const toggleButton = screen.getByRole('button', { name: 'Toggle' });
      toggleButton.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Space key activates buttons within card', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <SmartHomeCard icon="💡" title="Lights">
          <SmartHomeCard.Controls>
            <button onClick={onClick}>Toggle</button>
          </SmartHomeCard.Controls>
        </SmartHomeCard>
      );

      const toggleButton = screen.getByRole('button', { name: 'Toggle' });
      toggleButton.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rendering', () => {
    it('renders children content', () => {
      render(
        <SmartHomeCard>
          <p>Smart home content</p>
        </SmartHomeCard>
      );
      expect(screen.getByText('Smart home content')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      const { container } = render(
        <SmartHomeCard icon="🔥">
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
      // Icon should have aria-hidden for accessibility
      const iconSpan = container.querySelector('span[aria-hidden="true"]');
      expect(iconSpan).toHaveTextContent('🔥');
    });

    it('renders title when provided', () => {
      render(
        <SmartHomeCard title="Thermostat Control">
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.getByRole('heading', { name: 'Thermostat Control' })).toBeInTheDocument();
    });

    it('renders icon and title together in header', () => {
      render(
        <SmartHomeCard icon="🌡️" title="Temperature">
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.getByText('🌡️')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Temperature' })).toBeInTheDocument();
    });

    it('does not render header when no icon or title provided', () => {
      const { container } = render(
        <SmartHomeCard>
          <p>Just content</p>
        </SmartHomeCard>
      );
      // Should not have a heading
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      // Should not have the icon span
      expect(container.querySelector('span[aria-hidden="true"]')).not.toBeInTheDocument();
    });
  });

  describe('CVA Size Variants', () => {
    it('applies compact size padding (p-3)', () => {
      const { container } = render(
        <SmartHomeCard size="compact">
          <p>Compact content</p>
        </SmartHomeCard>
      );
      // Find the content wrapper (first div after CardAccentBar)
      const contentWrapper = container.querySelector('.p-3');
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper).toHaveClass('sm:p-4');
    });

    it('applies default size padding (p-5)', () => {
      const { container } = render(
        <SmartHomeCard size="default">
          <p>Default content</p>
        </SmartHomeCard>
      );
      const contentWrapper = container.querySelector('.p-5');
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper).toHaveClass('sm:p-6');
    });

    it('uses default size when not specified', () => {
      const { container } = render(
        <SmartHomeCard>
          <p>Content</p>
        </SmartHomeCard>
      );
      const contentWrapper = container.querySelector('.p-5');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('applies md heading size for compact variant', () => {
      render(
        <SmartHomeCard size="compact" title="Compact Title">
          <p>Content</p>
        </SmartHomeCard>
      );
      const heading = screen.getByRole('heading', { name: 'Compact Title' });
      expect(heading).toHaveClass('text-base'); // md size
    });

    it('applies xl heading size for default variant', () => {
      render(
        <SmartHomeCard size="default" title="Default Title">
          <p>Content</p>
        </SmartHomeCard>
      );
      const heading = screen.getByRole('heading', { name: 'Default Title' });
      expect(heading).toHaveClass('text-xl');
    });
  });

  describe('State Handling', () => {
    it('shows error banner when error=true and errorMessage provided', () => {
      render(
        <SmartHomeCard error errorMessage="Connection lost">
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.getByText('Connection lost')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not show error banner when error=false', () => {
      render(
        <SmartHomeCard error={false} errorMessage="Should not show">
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    });

    it('does not show error banner when errorMessage not provided', () => {
      render(
        <SmartHomeCard error>
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('applies disabled opacity when disabled=true', () => {
      const { container } = render(
        <SmartHomeCard disabled>
          <p>Disabled content</p>
        </SmartHomeCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('opacity-50');
      expect(card).toHaveClass('pointer-events-none');
    });

    it('does not apply disabled classes when disabled=false', () => {
      const { container } = render(
        <SmartHomeCard disabled={false}>
          <p>Enabled content</p>
        </SmartHomeCard>
      );
      const card = container.firstChild;
      expect(card).not.toHaveClass('opacity-50');
      expect(card).not.toHaveClass('pointer-events-none');
    });

    it('renders loading spinner when isLoading=true', () => {
      render(
        <SmartHomeCard isLoading>
          <p>Loading content</p>
        </SmartHomeCard>
      );
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('does not render loading spinner when isLoading=false', () => {
      render(
        <SmartHomeCard isLoading={false}>
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
    });

    it('loading overlay has correct styling', () => {
      const { container } = render(
        <SmartHomeCard isLoading>
          <p>Content</p>
        </SmartHomeCard>
      );
      const overlay = container.querySelector('.absolute.inset-0.bg-slate-900\\/50');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('z-10');
      expect(overlay).toHaveClass('rounded-2xl');
    });
  });

  describe('Sub-components', () => {
    it('SmartHomeCardHeader renders correctly', () => {
      const { container } = render(
        <SmartHomeCardHeader>Header content</SmartHomeCardHeader>
      );
      const header = container.firstChild;
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('gap-3');
      expect(header).toHaveClass('mb-4');
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('SmartHomeCardStatus renders correctly', () => {
      const { container } = render(
        <SmartHomeCardStatus>Status content</SmartHomeCardStatus>
      );
      const status = container.firstChild;
      expect(status).toHaveClass('mb-4');
      expect(screen.getByText('Status content')).toBeInTheDocument();
    });

    it('SmartHomeCardControls renders correctly', () => {
      const { container } = render(
        <SmartHomeCardControls>Controls content</SmartHomeCardControls>
      );
      const controls = container.firstChild;
      expect(controls).toHaveClass('space-y-3');
      expect(screen.getByText('Controls content')).toBeInTheDocument();
    });

    it('sub-components accept custom className', () => {
      const { container } = render(
        <>
          <SmartHomeCardHeader className="custom-header">H</SmartHomeCardHeader>
          <SmartHomeCardStatus className="custom-status">S</SmartHomeCardStatus>
          <SmartHomeCardControls className="custom-controls">C</SmartHomeCardControls>
        </>
      );
      expect(container.querySelector('.custom-header')).toBeInTheDocument();
      expect(container.querySelector('.custom-status')).toBeInTheDocument();
      expect(container.querySelector('.custom-controls')).toBeInTheDocument();
    });
  });

  describe('Namespace Pattern', () => {
    it('Header accessible via SmartHomeCard.Header', () => {
      expect(SmartHomeCard.Header).toBeDefined();
      expect(SmartHomeCard.Header).toBe(SmartHomeCardHeader);
    });

    it('Status accessible via SmartHomeCard.Status', () => {
      expect(SmartHomeCard.Status).toBeDefined();
      expect(SmartHomeCard.Status).toBe(SmartHomeCardStatus);
    });

    it('Controls accessible via SmartHomeCard.Controls', () => {
      expect(SmartHomeCard.Controls).toBeDefined();
      expect(SmartHomeCard.Controls).toBe(SmartHomeCardControls);
    });

    it('renders full composition with namespace pattern', () => {
      render(
        <SmartHomeCard icon="🔥" title="Stove Control" colorTheme="ember">
          <SmartHomeCard.Status>
            <span data-testid="status-badge">Active</span>
          </SmartHomeCard.Status>
          <SmartHomeCard.Controls>
            <button>Turn Off</button>
          </SmartHomeCard.Controls>
        </SmartHomeCard>
      );

      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Stove Control' })).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Turn Off' })).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to Card root element', () => {
      const ref = createRef();
      render(
        <SmartHomeCard ref={ref}>
          <p>Content</p>
        </SmartHomeCard>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to SmartHomeCardHeader', () => {
      const ref = createRef();
      render(<SmartHomeCardHeader ref={ref}>Header</SmartHomeCardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to SmartHomeCardStatus', () => {
      const ref = createRef();
      render(<SmartHomeCardStatus ref={ref}>Status</SmartHomeCardStatus>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('forwards ref to SmartHomeCardControls', () => {
      const ref = createRef();
      render(<SmartHomeCardControls ref={ref}>Controls</SmartHomeCardControls>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Exports', () => {
    it('exports smartHomeCardVariants function', () => {
      expect(typeof smartHomeCardVariants).toBe('function');
    });

    it('smartHomeCardVariants returns string of classes', () => {
      const classes = smartHomeCardVariants({ size: 'compact', colorTheme: 'ember' });
      expect(typeof classes).toBe('string');
      expect(classes).toContain('overflow-visible');
      expect(classes).toContain('transition-all');
      expect(classes).toContain('duration-500');
    });

    it('exports named sub-components for tree-shaking', () => {
      expect(SmartHomeCardHeader).toBeDefined();
      expect(SmartHomeCardStatus).toBeDefined();
      expect(SmartHomeCardControls).toBeDefined();
    });
  });

  describe('Card Composition', () => {
    it('uses Card with elevated variant', () => {
      const { container } = render(
        <SmartHomeCard>
          <p>Content</p>
        </SmartHomeCard>
      );
      const card = container.firstChild;
      // Card elevated variant classes
      expect(card).toHaveClass('bg-slate-850/90');
      expect(card).toHaveClass('shadow-card-elevated');
    });

    it('uses Card with padding=false', () => {
      const { container } = render(
        <SmartHomeCard>
          <p>Content</p>
        </SmartHomeCard>
      );
      const card = container.firstChild;
      // Card should not have its own padding classes since we use padding={false}
      // (padding is handled by internal content wrapper)
      expect(card).not.toHaveClass('p-5');
    });

    it('renders CardAccentBar', () => {
      const { container } = render(
        <SmartHomeCard colorTheme="ocean">
          <p>Content</p>
        </SmartHomeCard>
      );
      // CardAccentBar renders a div with absolute positioning
      const accentBar = container.querySelector('.absolute.top-0');
      expect(accentBar).toBeInTheDocument();
    });

    it('disables CardAccentBar animation when disabled', () => {
      const { container } = render(
        <SmartHomeCard disabled>
          <p>Content</p>
        </SmartHomeCard>
      );
      // When disabled, animated prop is false, so no shimmer animation
      const shimmer = container.querySelector('.animate-shimmer');
      expect(shimmer).not.toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('merges custom className with SmartHomeCard', () => {
      const { container } = render(
        <SmartHomeCard className="my-custom-class">
          <p>Content</p>
        </SmartHomeCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('my-custom-class');
    });

    it('forwards additional props to Card', () => {
      render(
        <SmartHomeCard data-testid="smart-card" aria-label="Smart home card">
          <p>Content</p>
        </SmartHomeCard>
      );
      const card = screen.getByTestId('smart-card');
      expect(card).toHaveAttribute('aria-label', 'Smart home card');
    });
  });
});
