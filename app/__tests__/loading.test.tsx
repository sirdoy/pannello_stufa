import { render, screen } from '@testing-library/react';
import DashboardLoading from '../loading';

// Mock Skeleton sub-components with data-testid attributes
jest.mock('@/app/components/ui/Skeleton', () => {
  const MockSkeleton = () => <div data-testid="skeleton" />;
  MockSkeleton.StovePanel = () => <div data-testid="skeleton-stove" />;
  MockSkeleton.ThermostatCard = () => <div data-testid="skeleton-thermostat" />;
  MockSkeleton.WeatherCard = () => <div data-testid="skeleton-weather" />;
  MockSkeleton.LightsCard = () => <div data-testid="skeleton-lights" />;
  MockSkeleton.CameraCard = () => <div data-testid="skeleton-camera" />;
  MockSkeleton.NetworkCard = () => <div data-testid="skeleton-network" />;
  return { __esModule: true, default: MockSkeleton };
});

describe('DashboardLoading (loading.tsx)', () => {
  it('renders all 6 skeleton components (twice — mobile + desktop layouts)', () => {
    const { container } = render(<DashboardLoading />);

    // Each skeleton appears in both mobile (sm:hidden) and desktop (hidden sm:flex) layouts
    const stoveSkeletons = container.querySelectorAll('[data-testid="skeleton-stove"]');
    const thermostatSkeletons = container.querySelectorAll('[data-testid="skeleton-thermostat"]');
    const weatherSkeletons = container.querySelectorAll('[data-testid="skeleton-weather"]');
    const lightsSkeletons = container.querySelectorAll('[data-testid="skeleton-lights"]');
    const cameraSkeletons = container.querySelectorAll('[data-testid="skeleton-camera"]');
    const networkSkeletons = container.querySelectorAll('[data-testid="skeleton-network"]');

    expect(stoveSkeletons).toHaveLength(2);
    expect(thermostatSkeletons).toHaveLength(2);
    expect(weatherSkeletons).toHaveLength(2);
    expect(lightsSkeletons).toHaveLength(2);
    expect(cameraSkeletons).toHaveLength(2);
    expect(networkSkeletons).toHaveLength(2);
  });

  it('renders mobile single-column layout with sm:hidden class', () => {
    const { container } = render(<DashboardLoading />);

    const mobileContainer = container.querySelector('.sm\\:hidden');
    expect(mobileContainer).not.toBeNull();
  });

  it('renders desktop two-column masonry layout with sm:flex class', () => {
    const { container } = render(<DashboardLoading />);

    const desktopContainer = container.querySelector('.sm\\:flex');
    expect(desktopContainer).not.toBeNull();
  });

  it('renders sr-only heading with text "Dashboard"', () => {
    render(<DashboardLoading />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Dashboard');
    expect(heading).toHaveClass('sr-only');
  });

  it('renders without errors', () => {
    expect(() => render(<DashboardLoading />)).not.toThrow();
  });
});
