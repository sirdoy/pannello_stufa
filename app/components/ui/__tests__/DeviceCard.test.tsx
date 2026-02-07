// app/components/ui/__tests__/DeviceCard.test.js
/**
 * DeviceCard Component Tests
 *
 * Tests backwards compatibility with legacy props, new API props,
 * integration with SmartHomeCard, Badge, HealthIndicator, context menu, and accessibility.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import DeviceCard from '../DeviceCard';
import { Settings, RefreshCw } from 'lucide-react';

expect.extend(toHaveNoViolations);

// Mock LoadingOverlay and Toast to avoid portal issues in tests
jest.mock('../LoadingOverlay', () => {
  return function MockLoadingOverlay({ show, message }) {
    if (!show) return null;
    return <div data-testid="loading-overlay">{message}</div>;
  };
});

jest.mock('../Toast', () => {
  return function MockToast({ message, type, onClose }) {
    return (
      <div data-testid="toast" data-type={type}>
        {message}
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

describe('DeviceCard', () => {
  describe('Accessibility', () => {
    it('has no a11y violations with default props', async () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Test Device">
          <p>Content</p>
        </DeviceCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with statusBadge', async () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Test Device"
          statusBadge={{ label: 'Active', color: 'ember', icon: '🔥' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with healthStatus', async () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Test Device" healthStatus="ok">
          <p>Content</p>
        </DeviceCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations when not connected', async () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Test Device"
          connected={false}
          onConnect={() => {}}
          connectButtonLabel="Connect"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with all props combined', async () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Test Device"
          colorTheme="ember"
          statusBadge={{ label: 'Active', color: 'ember' }}
          healthStatus="ok"
          banners={[{ variant: 'info', title: 'Info', description: 'Description' }]}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('icon has aria-hidden for decorative purpose', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Test Device">
          <p>Content</p>
        </DeviceCard>
      );
      const iconSpan = container.querySelector('span[aria-hidden="true"]');
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan).toHaveTextContent('🔥');
    });

    it('healthStatus indicator uses role="status" for screen readers', () => {
      render(
        <DeviceCard icon="🔥" title="Test Device" healthStatus="ok">
          <p>Content</p>
        </DeviceCard>
      );
      const statusIndicator = screen.getByRole('status');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('footer action buttons are focusable via Tab', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <>
          <button>Before</button>
          <DeviceCard
            icon="🔥"
            title="Stufa"
            footerActions={[
              { label: 'Details', variant: 'subtle', onClick: handleClick },
              { label: 'Settings', variant: 'subtle', onClick: handleClick },
            ]}
          >
            <p>Content</p>
          </DeviceCard>
          <button>After</button>
        </>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      beforeButton.focus();

      // Tab to first footer action
      await user.tab();
      expect(screen.getByRole('button', { name: 'Details' })).toHaveFocus();

      // Tab to second footer action
      await user.tab();
      expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();

      // Tab to after button
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('Enter key activates footer action buttons', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          footerActions={[
            { label: 'Details', variant: 'subtle', onClick },
          ]}
        >
          <p>Content</p>
        </DeviceCard>
      );

      const detailsButton = screen.getByRole('button', { name: 'Details' });
      detailsButton.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Space key activates footer action buttons', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          footerActions={[
            { label: 'Settings', variant: 'subtle', onClick },
          ]}
        >
          <p>Content</p>
        </DeviceCard>
      );

      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      settingsButton.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('connect button is focusable when not connected', async () => {
      const user = userEvent.setup();
      const onConnect = jest.fn();

      render(
        <>
          <button>Before</button>
          <DeviceCard
            icon="🔥"
            title="Stufa"
            connected={false}
            onConnect={onConnect}
            connectButtonLabel="Connetti"
          />
          <button>After</button>
        </>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      beforeButton.focus();

      // Tab to connect button
      await user.tab();
      expect(screen.getByRole('button', { name: 'Connetti' })).toHaveFocus();
    });

    it('Enter key activates connect button', async () => {
      const user = userEvent.setup();
      const onConnect = jest.fn();

      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          connected={false}
          onConnect={onConnect}
          connectButtonLabel="Connetti"
        />
      );

      const connectButton = screen.getByRole('button', { name: 'Connetti' });
      connectButton.focus();
      await user.keyboard('{Enter}');

      expect(onConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Legacy API (backwards compatibility)', () => {
    it('renders icon and title', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa">
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Stufa')).toBeInTheDocument();
    });

    it('renders statusBadge with label, color, icon', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Attivo', color: 'ember', icon: '🔥' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Attivo')).toBeInTheDocument();
      // Badge should use CVA ember variant
      const badge = screen.getByText('Attivo').closest('span');
      expect(badge).toHaveClass('bg-ember-500/15');
    });

    it('renders banners array', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          banners={[
            { variant: 'error', title: 'Error', description: 'Something went wrong' },
            { variant: 'warning', title: 'Warning', description: 'Be careful' },
          ]}
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders infoBoxes with title', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          infoBoxes={[
            { icon: '🏠', label: 'Casa', value: 'Home' },
            { icon: '📡', label: 'Status', value: 'Online' },
          ]}
          infoBoxesTitle="Informazioni"
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Casa')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Informazioni')).toBeInTheDocument();
    });

    it('renders footerActions', () => {
      const handleClick = jest.fn();
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          footerActions={[
            { label: 'Details', variant: 'subtle', onClick: handleClick },
          ]}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const button = screen.getByText('Details');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows EmptyState when !connected && onConnect', () => {
      const handleConnect = jest.fn();
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          connected={false}
          onConnect={handleConnect}
          connectButtonLabel="Connetti"
        />
      );
      expect(screen.getByText('Stufa Non Connesso')).toBeInTheDocument();
      const connectButton = screen.getByText('Connetti');
      fireEvent.click(connectButton);
      expect(handleConnect).toHaveBeenCalledTimes(1);
    });

    it('shows connect info button when connectInfoRoute provided', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          connected={false}
          onConnect={() => {}}
          connectInfoRoute="/info"
        />
      );

      const infoButton = screen.getByText('Maggiori Info');
      expect(infoButton).toBeInTheDocument();
      // Note: We don't test the actual navigation as JSDOM doesn't support it
      // The button existence confirms the route prop is respected
    });

    it('shows skeleton when loading && skeletonComponent', () => {
      const Skeleton = () => <div data-testid="skeleton">Loading...</div>;
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          loading={true}
          skeletonComponent={<Skeleton />}
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.queryByText('Stufa')).not.toBeInTheDocument();
    });

    it('shows LoadingOverlay when loading (no skeleton)', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          loading={true}
          loadingMessage="Caricamento..."
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      expect(screen.getByText('Caricamento...')).toBeInTheDocument();
    });

    it('shows Toast when toast.show is true', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          toast={{ show: true, message: 'Success!', type: 'success' }}
          onToastClose={() => {}}
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });

  describe('New API', () => {
    it('supports size="compact" with smaller padding', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" size="compact">
          <p>Content</p>
        </DeviceCard>
      );
      // Compact size should have p-3 sm:p-4 padding in SmartHomeCard
      const contentWrapper = container.querySelector('.p-3');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('supports size="default" with normal padding', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" size="default">
          <p>Content</p>
        </DeviceCard>
      );
      // Default size should have p-5 sm:p-6 padding in SmartHomeCard
      const contentWrapper = container.querySelector('.p-5');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('supports healthStatus with HealthIndicator', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa" healthStatus="ok">
          <p>Content</p>
        </DeviceCard>
      );
      // HealthIndicator renders with role="status"
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('supports healthStatus="warning"', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa" healthStatus="warning">
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Attenzione')).toBeInTheDocument();
    });

    it('supports healthStatus="error"', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa" healthStatus="error">
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Errore')).toBeInTheDocument();
    });

    it('supports healthStatus="critical"', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa" healthStatus="critical">
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Critico')).toBeInTheDocument();
    });

    it('supports isLoading as alias for loading', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          isLoading={true}
          loadingMessage="Loading..."
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    });

    it('both statusBadge and healthStatus can be shown together', () => {
      render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Active', color: 'ember' }}
          healthStatus="ok"
        >
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  describe('Integration with SmartHomeCard', () => {
    it('uses SmartHomeCard internally (check for CardAccentBar)', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" colorTheme="ember">
          <p>Content</p>
        </DeviceCard>
      );
      // CardAccentBar adds a gradient element with from-ember classes
      const accentBar = container.querySelector('[class*="from-ember"]');
      expect(accentBar).toBeInTheDocument();
    });

    it('uses Badge for statusBadge (check CVA classes)', () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Online', color: 'sage' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const badge = screen.getByText('Online').closest('span');
      // Badge CVA base classes
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('font-display');
      expect(badge).toHaveClass('rounded-full');
      // sage variant
      expect(badge).toHaveClass('bg-sage-500/15');
    });

    it('applies colorTheme to accent bar', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" colorTheme="ocean">
          <p>Content</p>
        </DeviceCard>
      );
      // CardAccentBar should have ocean gradient
      const accentBar = container.querySelector('[class*="from-ocean"]');
      expect(accentBar).toBeInTheDocument();
    });

    it('maps legacy colorTheme "primary" to "ember"', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" colorTheme="primary">
          <p>Content</p>
        </DeviceCard>
      );
      const accentBar = container.querySelector('[class*="from-ember"]');
      expect(accentBar).toBeInTheDocument();
    });

    it('maps legacy colorTheme "info" to "ocean"', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" colorTheme="info">
          <p>Content</p>
        </DeviceCard>
      );
      const accentBar = container.querySelector('[class*="from-ocean"]');
      expect(accentBar).toBeInTheDocument();
    });

    it('maps legacy colorTheme "success" to "sage"', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" colorTheme="success">
          <p>Content</p>
        </DeviceCard>
      );
      const accentBar = container.querySelector('[class*="from-sage"]');
      expect(accentBar).toBeInTheDocument();
    });
  });

  describe('State handling', () => {
    it('applies disabled appearance when !connected', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" connected={false}>
          <p>Content</p>
        </DeviceCard>
      );
      // SmartHomeCard applies opacity-50 and pointer-events-none when disabled
      const card = container.querySelector('.opacity-50');
      expect(card).toBeInTheDocument();
    });

    it('does not apply disabled appearance when connected', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" connected={true}>
          <p>Content</p>
        </DeviceCard>
      );
      const card = container.querySelector('.opacity-50');
      expect(card).not.toBeInTheDocument();
    });

    it('detects error state from banners', () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          banners={[{ variant: 'error', title: 'Error', description: 'Test' }]}
        >
          <p>Content</p>
        </DeviceCard>
      );
      // Error banner should be rendered
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = createRef();
      render(
        <DeviceCard ref={ref} icon="🔥" title="Stufa">
          <p>Content</p>
        </DeviceCard>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Children rendering', () => {
    it('renders children content', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa">
          <p data-testid="child-content">Test content</p>
        </DeviceCard>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa">
          <div>
            <h3>Section 1</h3>
            <p>Paragraph 1</p>
          </div>
          <div>
            <h3>Section 2</h3>
            <p>Paragraph 2</p>
          </div>
        </DeviceCard>
      );
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });
  });

  describe('Badge pulse behavior', () => {
    it('pulses for ember statusBadge color', () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Active', color: 'ember' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).toBeInTheDocument();
    });

    it('pulses for sage statusBadge color', () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Online', color: 'sage' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).toBeInTheDocument();
    });

    it('does not pulse for neutral statusBadge color', () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Off', color: 'neutral' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).not.toBeInTheDocument();
    });

    it('does not pulse for warning statusBadge color', () => {
      const { container } = render(
        <DeviceCard
          icon="🔥"
          title="Stufa"
          statusBadge={{ label: 'Standby', color: 'warning' }}
        >
          <p>Content</p>
        </DeviceCard>
      );
      const badge = container.querySelector('.animate-glow-pulse');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Context Menu (v4.0)', () => {
    it('renders without context menu when contextMenuItems is empty', () => {
      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" contextMenuItems={[]}>
          <p>Content</p>
        </DeviceCard>
      );
      // Should not have RightClickMenu trigger wrapper
      const triggerWrapper = container.querySelector('[data-radix-popper-content-wrapper]');
      expect(triggerWrapper).not.toBeInTheDocument();
    });

    it('renders with context menu when contextMenuItems is provided', () => {
      const mockOnSelect = jest.fn();
      const contextMenuItems = [
        { icon: <Settings className="w-4 h-4" />, label: 'Impostazioni', onSelect: mockOnSelect },
        { separator: true },
        { icon: <RefreshCw className="w-4 h-4" />, label: 'Aggiorna', onSelect: mockOnSelect },
      ];

      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" contextMenuItems={contextMenuItems}>
          <p>Content</p>
        </DeviceCard>
      );

      // Card should still render
      expect(screen.getByText('Stufa')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('maintains backwards compatibility without contextMenuItems', () => {
      render(
        <DeviceCard icon="🔥" title="Stufa">
          <p>Content</p>
        </DeviceCard>
      );
      expect(screen.getByText('Stufa')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('has no a11y violations with context menu', async () => {
      const contextMenuItems = [
        { icon: <Settings className="w-4 h-4" />, label: 'Impostazioni', onSelect: () => {} },
      ];

      const { container } = render(
        <DeviceCard icon="🔥" title="Stufa" contextMenuItems={contextMenuItems}>
          <p>Content</p>
        </DeviceCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
