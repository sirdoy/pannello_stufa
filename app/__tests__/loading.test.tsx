import { render, screen } from '@testing-library/react';
import DashboardLoading from '../loading';

jest.mock('@/app/components/EmberGlass/GlassCardSkeleton', () => ({
  __esModule: true,
  GlassCardSkeleton: () => <div data-testid="glass-card-skeleton" />,
}));

describe('DashboardLoading (loading.tsx)', () => {
  it('renders exactly 10 GlassCardSkeleton placeholders matching CARD_COMPONENTS max', () => {
    const { container } = render(<DashboardLoading />);
    expect(
      container.querySelectorAll('[data-testid="glass-card-skeleton"]')
    ).toHaveLength(10);
  });

  it('renders the DASH-01 grid wrapper mirroring DashboardCards', () => {
    const { container } = render(<DashboardLoading />);
    const grid = container.querySelector('div.grid');
    expect(grid).not.toBeNull();
    // Sanity-check the responsive grid classes are present.
    const cls = grid!.className;
    ['grid-cols-2', 'lg:grid-cols-4', 'gap-3', 'max-w-md', 'sm:max-w-2xl',
     'lg:max-w-7xl', 'mx-auto', 'px-3'].forEach((c) => {
      expect(cls).toContain(c);
    });
  });

  it('renders sr-only heading with text "Dashboard"', () => {
    render(<DashboardLoading />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Dashboard');
    expect(heading).toHaveClass('sr-only');
  });

  it('applies v9.0 stagger animation (animationDelay 0ms..900ms)', () => {
    const { container } = render(<DashboardLoading />);
    const wrappers = container.querySelectorAll(
      'div.animate-spring-in[style*="animation-delay"], div.animate-spring-in[style*="animationDelay"]'
    );
    expect(wrappers.length).toBe(10);
    // jsdom serializes inline `style={{ animationDelay: '...' }}` as
    // the `animation-delay` CSS property.
    const first = wrappers[0] as HTMLElement;
    const last = wrappers[wrappers.length - 1] as HTMLElement;
    expect(first.style.animationDelay).toBe('0ms');
    expect(last.style.animationDelay).toBe('900ms');
  });

  it('renders without errors', () => {
    expect(() => render(<DashboardLoading />)).not.toThrow();
  });
});
