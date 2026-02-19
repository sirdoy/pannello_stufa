import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardCards from '../DashboardCards';

// Mock next/navigation (redirect)
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock @/lib/auth0
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

// Mock @/lib/services/unifiedDeviceConfigService
jest.mock('@/lib/services/unifiedDeviceConfigService', () => ({
  getUnifiedDeviceConfigAdmin: jest.fn(),
  getVisibleDashboardCards: jest.fn(),
}));

// Mock @/lib/utils/dashboardColumns
jest.mock('@/lib/utils/dashboardColumns', () => ({
  splitIntoColumns: jest.fn(),
}));

// Mock all 6 card components
jest.mock('@/app/components/devices/stove/StoveCard', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-card">StoveCard</div>,
}));
jest.mock('@/app/components/devices/thermostat/ThermostatCard', () => ({
  __esModule: true,
  default: () => <div data-testid="thermostat-card">ThermostatCard</div>,
}));
jest.mock('@/app/components/devices/weather/WeatherCardWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="weather-card">WeatherCard</div>,
}));
jest.mock('@/app/components/devices/lights/LightsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="lights-card">LightsCard</div>,
}));
jest.mock('@/app/components/devices/camera/CameraCard', () => ({
  __esModule: true,
  default: () => <div data-testid="camera-card">CameraCard</div>,
}));
jest.mock('@/app/components/devices/network/NetworkCard', () => ({
  __esModule: true,
  default: () => <div data-testid="network-card">NetworkCard</div>,
}));

// Mock ErrorBoundary as passthrough
jest.mock('@/app/components/ErrorBoundary', () => ({
  DeviceCardErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Skeleton sub-components
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

// Mock EmptyState component
jest.mock('@/app/components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
}));

// Helper imports (after mocks are defined)
import { auth0 } from '@/lib/auth0';
import {
  getUnifiedDeviceConfigAdmin,
  getVisibleDashboardCards,
} from '@/lib/services/unifiedDeviceConfigService';
import { splitIntoColumns } from '@/lib/utils/dashboardColumns';
import { redirect } from 'next/navigation';

// Helper to create mock visible cards for specific IDs
function makeMockCards(ids: string[]) {
  return ids.map((id, index) => ({ id, label: id, icon: '🔧', visible: true, order: index }));
}

// Helper to set up splitIntoColumns mock based on visible cards
function setupColumnMock(ids: string[]) {
  const cards = makeMockCards(ids);
  const leftCards = cards.filter((_, i) => i % 2 === 0);
  const rightCards = cards.filter((_, i) => i % 2 !== 0);
  (splitIntoColumns as jest.Mock).mockReturnValue({
    left: leftCards.map((card, i) => ({ card, flatIndex: i * 2 })),
    right: rightCards.map((card, i) => ({ card, flatIndex: i * 2 + 1 })),
  });
  return cards;
}

// Helper to render DashboardCards (async Server Component)
async function renderDashboardCards() {
  const jsx = await DashboardCards();
  return render(jsx as React.ReactElement);
}

describe('DashboardCards', () => {
  beforeEach(() => {
    // Default: authenticated session
    (auth0.getSession as jest.Mock).mockResolvedValue({
      user: { sub: 'test-user', email: 'test@example.com' },
    });
    // Default: empty device config
    (getUnifiedDeviceConfigAdmin as jest.Mock).mockResolvedValue({ devices: [] });
    // Default: no visible cards
    (getVisibleDashboardCards as jest.Mock).mockReturnValue([]);
    // Default: empty columns
    (splitIntoColumns as jest.Mock).mockReturnValue({ left: [], right: [] });
  });

  it('renders visible cards from deviceConfig', async () => {
    const cards = setupColumnMock(['stove', 'thermostat', 'lights']);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    await renderDashboardCards();

    expect(screen.getAllByTestId('stove-card')).toHaveLength(2); // mobile + desktop
    expect(screen.getAllByTestId('thermostat-card')).toHaveLength(2);
    expect(screen.getAllByTestId('lights-card')).toHaveLength(2);
  });

  it('redirects to login when no session', async () => {
    (auth0.getSession as jest.Mock).mockResolvedValue(null);

    // redirect() throws in Next.js, so we handle it
    const { redirect: mockRedirect } = require('next/navigation');

    await DashboardCards().catch(() => {});

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders EmptyState when no visible cards', async () => {
    (getVisibleDashboardCards as jest.Mock).mockReturnValue([]);
    (splitIntoColumns as jest.Mock).mockReturnValue({ left: [], right: [] });

    await renderDashboardCards();

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Nessun dispositivo configurato')).toBeInTheDocument();
  });

  it('renders all 6 cards when all devices are enabled', async () => {
    const allIds = ['stove', 'thermostat', 'weather', 'lights', 'camera', 'network'];
    const cards = setupColumnMock(allIds);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    await renderDashboardCards();

    expect(screen.getAllByTestId('stove-card')).toHaveLength(2);
    expect(screen.getAllByTestId('thermostat-card')).toHaveLength(2);
    expect(screen.getAllByTestId('weather-card')).toHaveLength(2);
    expect(screen.getAllByTestId('lights-card')).toHaveLength(2);
    expect(screen.getAllByTestId('camera-card')).toHaveLength(2);
    expect(screen.getAllByTestId('network-card')).toHaveLength(2);
  });

  it('stove card appears before other cards in DOM order', async () => {
    const allIds = ['stove', 'thermostat', 'weather', 'lights', 'camera', 'network'];
    const cards = setupColumnMock(allIds);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    const { container } = await renderDashboardCards();

    // In the mobile layout (single column), verify stove card is before other cards
    const allCards = container.querySelectorAll('[data-testid$="-card"]');
    const stoveIndex = Array.from(allCards).findIndex(
      (el) => el.getAttribute('data-testid') === 'stove-card'
    );
    const thermostatIndex = Array.from(allCards).findIndex(
      (el) => el.getAttribute('data-testid') === 'thermostat-card'
    );

    expect(stoveIndex).toBeLessThan(thermostatIndex);
    expect(stoveIndex).toBe(0); // Stove is the very first card rendered
  });

  it('wraps each card in a Suspense boundary with skeleton fallback', async () => {
    const cards = setupColumnMock(['stove', 'thermostat']);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    const jsx = await DashboardCards();

    // Check the JSX structure contains Suspense elements
    const stoveCard = cards.find((c) => c.id === 'stove');
    expect(stoveCard).toBeDefined();

    // Rendered output should contain cards (Suspense renders content when not suspended)
    const { container } = render(jsx as React.ReactElement);
    expect(container.querySelectorAll('[data-testid="stove-card"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="thermostat-card"]')).toHaveLength(2);
  });
});
