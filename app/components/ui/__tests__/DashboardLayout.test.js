// app/components/ui/__tests__/DashboardLayout.test.js
/**
 * DashboardLayout Component Tests
 *
 * Tests accessibility, sidebar collapse, mobile behavior, and context hook.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DashboardLayout, {
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  MobileMenuButton,
  MainContent,
} from '../DashboardLayout';

expect.extend(toHaveNoViolations);

// Test component to access sidebar context
function SidebarConsumer() {
  const { collapsed, toggle, mobileOpen, toggleMobile } = useSidebar();
  return (
    <div>
      <span data-testid="collapsed-state">{collapsed ? 'collapsed' : 'expanded'}</span>
      <span data-testid="mobile-state">{mobileOpen ? 'open' : 'closed'}</span>
      <button onClick={toggle}>Toggle Desktop</button>
      <button onClick={toggleMobile}>Toggle Mobile</button>
    </div>
  );
}

describe('DashboardLayout', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <DashboardLayout>
          <div>Main content</div>
        </DashboardLayout>
      );
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('renders sidebar slot', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <nav>Sidebar nav</nav>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByText('Sidebar nav')).toBeInTheDocument();
    });

    it('renders both sidebar and main content', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <nav>Navigation</nav>
            </DashboardLayout.Sidebar>
          }
        >
          <DashboardLayout.Main>Dashboard content</DashboardLayout.Main>
        </DashboardLayout>
      );
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    });
  });

  describe('Sidebar Context', () => {
    it('starts expanded by default', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('expanded');
    });

    it('starts collapsed when defaultCollapsed is true', () => {
      render(
        <DashboardLayout
          defaultCollapsed
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('collapsed');
    });

    it('toggles collapsed state', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('expanded');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Desktop' }));
      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('collapsed');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Desktop' }));
      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('expanded');
    });

    it('toggles mobile state', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Mobile' }));
      expect(screen.getByTestId('mobile-state')).toHaveTextContent('open');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Mobile' }));
      expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed');
    });

    it('returns default context values when used outside provider', () => {
      // Note: Context has default values, so it doesn't throw
      // This tests that it still renders (with noop functions)
      render(<SidebarConsumer />);

      // Default values from context
      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('expanded');
      expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed');
    });
  });

  describe('SidebarToggle', () => {
    it('renders toggle button', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarToggle />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
    });

    it('changes aria-label when collapsed', () => {
      render(
        <DashboardLayout
          defaultCollapsed
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarToggle />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    });

    it('toggles collapse state on click', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
              <DashboardLayout.SidebarToggle />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('expanded');

      fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
      expect(screen.getByTestId('collapsed-state')).toHaveTextContent('collapsed');
    });

    it('has aria-expanded attribute', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarToggle />
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );

      const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('MobileMenuButton', () => {
    it('renders menu button', () => {
      render(
        <DashboardLayout>
          <DashboardLayout.MobileMenuButton />
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    });

    it('toggles mobile menu on click', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <DashboardLayout.MobileMenuButton />
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('mobile-state')).toHaveTextContent('closed');

      fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
      expect(screen.getByTestId('mobile-state')).toHaveTextContent('open');
    });

    it('changes aria-label when open', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <DashboardLayout.MobileMenuButton />
          <div>Content</div>
        </DashboardLayout>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
      expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    });

    it('has aria-expanded attribute', () => {
      render(
        <DashboardLayout>
          <DashboardLayout.MobileMenuButton />
          <div>Content</div>
        </DashboardLayout>
      );

      const button = screen.getByRole('button', { name: 'Open menu' });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Sidebar Sub-components', () => {
    it('renders SidebarHeader', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarHeader>Logo</DashboardLayout.SidebarHeader>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByText('Logo')).toBeInTheDocument();
    });

    it('renders SidebarContent', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarContent>Nav items</DashboardLayout.SidebarContent>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByText('Nav items')).toBeInTheDocument();
    });

    it('renders SidebarFooter', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarFooter>User info</DashboardLayout.SidebarFooter>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByText('User info')).toBeInTheDocument();
    });

    it('renders complete sidebar structure', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarHeader>App Logo</DashboardLayout.SidebarHeader>
              <DashboardLayout.SidebarContent>Menu items</DashboardLayout.SidebarContent>
              <DashboardLayout.SidebarFooter>
                <DashboardLayout.SidebarToggle />
              </DashboardLayout.SidebarFooter>
            </DashboardLayout.Sidebar>
          }
        >
          <DashboardLayout.Main>Main content area</DashboardLayout.Main>
        </DashboardLayout>
      );

      expect(screen.getByText('App Logo')).toBeInTheDocument();
      expect(screen.getByText('Menu items')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
      expect(screen.getByText('Main content area')).toBeInTheDocument();
    });
  });

  describe('MainContent', () => {
    it('renders main content', () => {
      render(
        <DashboardLayout>
          <DashboardLayout.Main>Dashboard</DashboardLayout.Main>
        </DashboardLayout>
      );
      expect(screen.getByRole('main')).toHaveTextContent('Dashboard');
    });

    it('adjusts margin based on collapsed state', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <SidebarConsumer />
            </DashboardLayout.Sidebar>
          }
        >
          <DashboardLayout.Main data-testid="main">Content</DashboardLayout.Main>
        </DashboardLayout>
      );

      // Expanded - lg:ml-64
      expect(screen.getByTestId('main')).toHaveClass('lg:ml-64');

      // Toggle to collapsed
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Desktop' }));

      // Collapsed - lg:ml-16
      expect(screen.getByTestId('main')).toHaveClass('lg:ml-16');
    });

    it('accepts custom className', () => {
      render(
        <DashboardLayout>
          <DashboardLayout.Main className="custom-main">Content</DashboardLayout.Main>
        </DashboardLayout>
      );
      expect(screen.getByRole('main')).toHaveClass('custom-main');
    });
  });

  describe('Sidebar Variants', () => {
    it('applies collapsed width class', () => {
      render(
        <DashboardLayout
          defaultCollapsed
          sidebar={
            <DashboardLayout.Sidebar data-testid="sidebar">
              <nav>Nav</nav>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByTestId('sidebar')).toHaveClass('w-16');
    });

    it('applies expanded width class', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar data-testid="sidebar">
              <nav>Nav</nav>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByTestId('sidebar')).toHaveClass('w-64');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with basic layout', async () => {
      const { container } = render(
        <DashboardLayout>
          <DashboardLayout.Main>Content</DashboardLayout.Main>
        </DashboardLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no a11y violations with complete sidebar', async () => {
      const { container } = render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <DashboardLayout.SidebarHeader>Logo</DashboardLayout.SidebarHeader>
              <DashboardLayout.SidebarContent>Navigation</DashboardLayout.SidebarContent>
              <DashboardLayout.SidebarFooter>
                <DashboardLayout.SidebarToggle />
              </DashboardLayout.SidebarFooter>
            </DashboardLayout.Sidebar>
          }
        >
          <DashboardLayout.Main>Dashboard content</DashboardLayout.Main>
        </DashboardLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('sidebar has aria-label', () => {
      render(
        <DashboardLayout
          sidebar={
            <DashboardLayout.Sidebar>
              <nav>Nav</nav>
            </DashboardLayout.Sidebar>
          }
        >
          <div>Content</div>
        </DashboardLayout>
      );
      expect(screen.getByLabelText('Sidebar navigation')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className on DashboardLayout', () => {
      const { container } = render(
        <DashboardLayout className="custom-layout">
          <div>Content</div>
        </DashboardLayout>
      );
      expect(container.firstChild).toHaveClass('custom-layout');
    });

    it('passes additional props to root element', () => {
      const { container } = render(
        <DashboardLayout data-testid="dashboard">
          <div>Content</div>
        </DashboardLayout>
      );
      expect(container.querySelector('[data-testid="dashboard"]')).toBeInTheDocument();
    });
  });

  describe('Namespace Pattern', () => {
    it('exposes Sidebar as DashboardLayout.Sidebar', () => {
      expect(DashboardLayout.Sidebar).toBeDefined();
      expect(DashboardLayout.Sidebar).toBe(Sidebar);
    });

    it('exposes SidebarHeader as DashboardLayout.SidebarHeader', () => {
      expect(DashboardLayout.SidebarHeader).toBeDefined();
      expect(DashboardLayout.SidebarHeader).toBe(SidebarHeader);
    });

    it('exposes SidebarContent as DashboardLayout.SidebarContent', () => {
      expect(DashboardLayout.SidebarContent).toBeDefined();
      expect(DashboardLayout.SidebarContent).toBe(SidebarContent);
    });

    it('exposes SidebarFooter as DashboardLayout.SidebarFooter', () => {
      expect(DashboardLayout.SidebarFooter).toBeDefined();
      expect(DashboardLayout.SidebarFooter).toBe(SidebarFooter);
    });

    it('exposes SidebarToggle as DashboardLayout.SidebarToggle', () => {
      expect(DashboardLayout.SidebarToggle).toBeDefined();
      expect(DashboardLayout.SidebarToggle).toBe(SidebarToggle);
    });

    it('exposes MobileMenuButton as DashboardLayout.MobileMenuButton', () => {
      expect(DashboardLayout.MobileMenuButton).toBeDefined();
      expect(DashboardLayout.MobileMenuButton).toBe(MobileMenuButton);
    });

    it('exposes Main as DashboardLayout.Main', () => {
      expect(DashboardLayout.Main).toBeDefined();
      expect(DashboardLayout.Main).toBe(MainContent);
    });
  });
});
