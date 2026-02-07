// app/components/ui/__tests__/StatusCard.test.js
/**
 * StatusCard Component Tests
 *
 * Tests accessibility, Badge/ConnectionStatus integration, pulse animation,
 * size variants, and SmartHomeCard prop forwarding.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import StatusCard from '../StatusCard';

expect.extend(toHaveNoViolations);

describe('StatusCard', () => {
  describe('Accessibility', () => {
    it('has no a11y violations with default props', async () => {
      const { container } = render(
        <StatusCard>
          <p>Content</p>
        </StatusCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with full props', async () => {
      const { container } = render(
        <StatusCard
          icon="🌡️"
          title="Thermostat"
          status="Heating"
          statusVariant="ember"
          connectionStatus="online"
        >
          <p>Temperature: 22C</p>
        </StatusCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations when disabled', async () => {
      const { container } = render(
        <StatusCard
          icon="💡"
          title="Lights"
          status="Off"
          disabled
        >
          <p>Content</p>
        </StatusCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with all status variants', async () => {
      const variants = ['ember', 'sage', 'ocean', 'warning', 'danger', 'neutral'];

      for (const variant of variants) {
        const { container } = render(
          <StatusCard
            icon="🌡️"
            title="Thermostat"
            status="Status"
            statusVariant={variant}
          >
            <p>Content</p>
          </StatusCard>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('icon has aria-hidden for decorative purpose', () => {
      const { container } = render(
        <StatusCard icon="🌡️" title="Thermostat" status="Active">
          <p>Content</p>
        </StatusCard>
      );
      const iconSpan = container.querySelector('span[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan).toHaveTextContent('🌡️');
    });

    it('status badge text is visible and accessible', () => {
      render(
        <StatusCard status="Heating" statusVariant="ember">
          <p>Content</p>
        </StatusCard>
      );
      // Status text should be visible to screen readers (not just color)
      const statusBadge = screen.getByText('Heating');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toBeVisible();
    });

    it('connection status is announced via role="status"', () => {
      render(
        <StatusCard connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      const connectionStatusElement = screen.getByRole('status');
      expect(connectionStatusElement).toBeInTheDocument();
      expect(connectionStatusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('value content is announced to screen readers', () => {
      render(
        <StatusCard icon="🌡️" title="Temperature" status="Active">
          <p>Current value: 22°C</p>
        </StatusCard>
      );
      // Value should be accessible text content
      expect(screen.getByText('Current value: 22°C')).toBeInTheDocument();
    });

    it('card heading uses proper semantic level', () => {
      render(
        <StatusCard icon="🌡️" title="Thermostat" status="Active">
          <p>Content</p>
        </StatusCard>
      );
      const heading = screen.getByRole('heading', { name: 'Thermostat' });
      expect(heading).toBeInTheDocument();
      // Heading level 2 (from SmartHomeCard)
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('Status Badge', () => {
    it('renders status Badge with correct text', () => {
      render(
        <StatusCard status="Active">
          <p>Content</p>
        </StatusCard>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies pulse animation for ember variant', () => {
      const { container } = render(
        <StatusCard status="Heating" statusVariant="ember">
          <p>Content</p>
        </StatusCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Heating');
    });

    it('applies pulse animation for sage variant', () => {
      const { container } = render(
        <StatusCard status="Online" statusVariant="sage">
          <p>Content</p>
        </StatusCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Online');
    });

    it('does not pulse for neutral variant', () => {
      const { container } = render(
        <StatusCard status="Off" statusVariant="neutral">
          <p>Content</p>
        </StatusCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).not.toBeInTheDocument();
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('does not pulse for warning variant', () => {
      const { container } = render(
        <StatusCard status="Standby" statusVariant="warning">
          <p>Content</p>
        </StatusCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).not.toBeInTheDocument();
    });

    it('does not pulse for danger variant', () => {
      const { container } = render(
        <StatusCard status="Error" statusVariant="danger">
          <p>Content</p>
        </StatusCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).not.toBeInTheDocument();
    });

    it('does not pulse for ocean variant', () => {
      const { container } = render(
        <StatusCard status="Starting" statusVariant="ocean">
          <p>Content</p>
        </StatusCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).not.toBeInTheDocument();
    });

    it('does not render badge when status not provided', () => {
      render(
        <StatusCard connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      // Should only have ConnectionStatus text, not a Badge
      expect(screen.getByText('Online')).toBeInTheDocument();
      // The text "Online" is from ConnectionStatus, not a Badge
      expect(screen.queryByRole('status').textContent).toContain('Online');
    });
  });

  describe('ConnectionStatus Integration', () => {
    it('renders ConnectionStatus when connectionStatus provided', () => {
      render(
        <StatusCard connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('hides ConnectionStatus when not provided', () => {
      render(
        <StatusCard status="Active">
          <p>Content</p>
        </StatusCard>
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('passes sm size to ConnectionStatus for compact card', () => {
      const { container } = render(
        <StatusCard size="compact" connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      const connectionStatus = screen.getByRole('status');
      // sm size uses text-xs class
      expect(connectionStatus).toHaveClass('text-xs');
    });

    it('passes md size to ConnectionStatus for default card', () => {
      const { container } = render(
        <StatusCard size="default" connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      const connectionStatus = screen.getByRole('status');
      // md size uses text-sm class
      expect(connectionStatus).toHaveClass('text-sm');
    });

    it('adds margin when both status and connectionStatus provided', () => {
      const { container } = render(
        <StatusCard status="Active" connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      const connectionStatus = screen.getByRole('status');
      expect(connectionStatus).toHaveClass('ml-3');
    });

    it('no margin on ConnectionStatus when status not provided', () => {
      render(
        <StatusCard connectionStatus="online">
          <p>Content</p>
        </StatusCard>
      );
      const connectionStatus = screen.getByRole('status');
      expect(connectionStatus).not.toHaveClass('ml-3');
    });
  });

  describe('Children Content', () => {
    it('renders children content', () => {
      render(
        <StatusCard status="Active">
          <p>Custom information here</p>
        </StatusCard>
      );
      expect(screen.getByText('Custom information here')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      render(
        <StatusCard status="On">
          <div data-testid="custom-content">
            <span>Temperature: 22C</span>
            <span>Humidity: 45%</span>
          </div>
        </StatusCard>
      );
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Temperature: 22C')).toBeInTheDocument();
      expect(screen.getByText('Humidity: 45%')).toBeInTheDocument();
    });
  });

  describe('SmartHomeCard Prop Forwarding', () => {
    it('forwards isLoading to SmartHomeCard', () => {
      render(
        <StatusCard isLoading status="Active">
          <p>Content</p>
        </StatusCard>
      );
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('forwards error and errorMessage to SmartHomeCard', () => {
      render(
        <StatusCard error errorMessage="Connection failed">
          <p>Content</p>
        </StatusCard>
      );
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('forwards disabled to SmartHomeCard', () => {
      const { container } = render(
        <StatusCard disabled status="Off">
          <p>Content</p>
        </StatusCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('opacity-50');
      expect(card).toHaveClass('pointer-events-none');
    });

    it('forwards icon and title to SmartHomeCard', () => {
      render(
        <StatusCard icon="🔥" title="Thermostat" status="Heating">
          <p>Content</p>
        </StatusCard>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Thermostat' })).toBeInTheDocument();
    });

    it('forwards colorTheme to SmartHomeCard', () => {
      const { container } = render(
        <StatusCard colorTheme="ocean" status="Info">
          <p>Content</p>
        </StatusCard>
      );
      // CardAccentBar should exist with ocean theme
      const accentBar = container.querySelector('.absolute.top-0');
      expect(accentBar).toBeInTheDocument();
    });

    it('forwards custom className to SmartHomeCard', () => {
      const { container } = render(
        <StatusCard className="my-custom-class" status="Active">
          <p>Content</p>
        </StatusCard>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('my-custom-class');
    });

    it('forwards additional props to SmartHomeCard', () => {
      render(
        <StatusCard data-testid="status-card" aria-label="Device status">
          <p>Content</p>
        </StatusCard>
      );
      const card = screen.getByTestId('status-card');
      expect(card).toHaveAttribute('aria-label', 'Device status');
    });
  });

  describe('Size Variants', () => {
    it('applies compact size', () => {
      const { container } = render(
        <StatusCard size="compact" status="Active">
          <p>Content</p>
        </StatusCard>
      );
      // Compact size uses p-3 padding
      const contentWrapper = container.querySelector('.p-3');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('applies default size', () => {
      const { container } = render(
        <StatusCard size="default" status="Active">
          <p>Content</p>
        </StatusCard>
      );
      // Default size uses p-5 padding
      const contentWrapper = container.querySelector('.p-5');
      expect(contentWrapper).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to SmartHomeCard', () => {
      const ref = createRef();
      render(
        <StatusCard ref={ref} status="Active">
          <p>Content</p>
        </StatusCard>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Exports', () => {
    it('exports StatusCard as default', () => {
      expect(StatusCard).toBeDefined();
      expect(StatusCard.displayName).toBe('StatusCard');
    });
  });
});
