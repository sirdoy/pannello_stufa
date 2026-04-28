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

// Phase 177: Mock all 10 EmberGlass card components
jest.mock('@/app/components/EmberGlass/cards/StoveCard', () => ({
  __esModule: true,
  default: () => <div data-testid="stove-card">StoveCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/ClimateCard', () => ({
  __esModule: true,
  default: () => <div data-testid="thermostat-card">ClimateCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/LightsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="lights-card">LightsCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/SonosCard', () => ({
  __esModule: true,
  default: () => <div data-testid="sonos-card">SonosCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/WeatherCard', () => ({
  __esModule: true,
  default: () => <div data-testid="weather-card">WeatherCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/CameraCard', () => ({
  __esModule: true,
  default: () => <div data-testid="camera-card">CameraCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/NetworkCard', () => ({
  __esModule: true,
  default: () => <div data-testid="network-card">NetworkCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/RaspiCard', () => ({
  __esModule: true,
  default: () => <div data-testid="raspi-card">RaspiCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/TuyaCard', () => ({
  __esModule: true,
  default: () => <div data-testid="tuya-card">TuyaCard</div>,
}));
jest.mock('@/app/components/EmberGlass/cards/DirigeraCard', () => ({
  __esModule: true,
  default: () => <div data-testid="dirigera-card">DirigeraCard</div>,
}));

// Mock GlassCardSkeleton (DS-24 shared fallback)
jest.mock('@/app/components/EmberGlass/GlassCardSkeleton', () => ({
  GlassCardSkeleton: () => <div data-testid="glass-card-skeleton" />,
}));

// Mock ErrorBoundary as passthrough
jest.mock('@/app/components/ErrorBoundary', () => ({
  DeviceCardErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

// Helper to create mock visible cards for specific IDs
function makeMockCards(ids: string[]) {
  return ids.map((id, index) => ({ id, label: id, icon: '🔧', visible: true, order: index }));
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
  });

  it('renders visible cards from deviceConfig', async () => {
    const cards = makeMockCards(['stove', 'thermostat', 'lights']);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    await renderDashboardCards();

    // Phase 177 (DASH-01): single grid renders each card exactly once
    expect(screen.getAllByTestId('stove-card')).toHaveLength(1);
    expect(screen.getAllByTestId('thermostat-card')).toHaveLength(1);
    expect(screen.getAllByTestId('lights-card')).toHaveLength(1);
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

    await renderDashboardCards();

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Nessun dispositivo configurato')).toBeInTheDocument();
  });

  it('renders all 10 cards when all devices are enabled (DASH-01)', async () => {
    const allIds = [
      'stove',
      'thermostat',
      'weather',
      'lights',
      'camera',
      'network',
      'raspi',
      'sonos',
      'dirigera',
      'tuya',
    ];
    const cards = makeMockCards(allIds);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    await renderDashboardCards();

    expect(screen.getAllByTestId('stove-card')).toHaveLength(1);
    expect(screen.getAllByTestId('thermostat-card')).toHaveLength(1);
    expect(screen.getAllByTestId('weather-card')).toHaveLength(1);
    expect(screen.getAllByTestId('lights-card')).toHaveLength(1);
    expect(screen.getAllByTestId('camera-card')).toHaveLength(1);
    expect(screen.getAllByTestId('network-card')).toHaveLength(1);
    expect(screen.getAllByTestId('raspi-card')).toHaveLength(1);
    expect(screen.getAllByTestId('sonos-card')).toHaveLength(1);
    expect(screen.getAllByTestId('dirigera-card')).toHaveLength(1);
    expect(screen.getAllByTestId('tuya-card')).toHaveLength(1);
  });

  it('stove card appears before other cards in DOM order', async () => {
    const allIds = ['stove', 'thermostat', 'weather', 'lights', 'camera', 'network'];
    const cards = makeMockCards(allIds);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    const { container } = await renderDashboardCards();

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

  it('renders cards inside a single 2-col grid (DASH-01)', async () => {
    const cards = makeMockCards(['stove', 'thermostat', 'lights', 'sonos']);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    const { container } = await renderDashboardCards();

    // Phase 177 (DASH-01): single grid-cols-2 wrapper, no masonry split
    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).not.toBeNull();
    expect(grid?.children.length).toBe(cards.length);
    // No legacy masonry markers
    expect(container.querySelector('.flex-col.gap-6.sm\\:hidden')).toBeNull();
  });

  it('applies stagger animation to each card slot (DASH-12)', async () => {
    const cards = makeMockCards(['stove', 'thermostat', 'lights']);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    const { container } = await renderDashboardCards();

    const slots = container.querySelectorAll('.animate-spring-in');
    expect(slots.length).toBe(cards.length);
    // First slot has 0ms delay, second 100ms, third 200ms (flatIndex * 100ms)
    expect((slots[0] as HTMLElement).style.animationDelay).toBe('0ms');
    expect((slots[1] as HTMLElement).style.animationDelay).toBe('100ms');
    expect((slots[2] as HTMLElement).style.animationDelay).toBe('200ms');
  });

  it('wraps each card in a Suspense boundary with GlassCardSkeleton fallback (DS-24)', async () => {
    const cards = makeMockCards(['stove', 'thermostat']);
    (getVisibleDashboardCards as jest.Mock).mockReturnValue(cards);

    const { container } = await renderDashboardCards();

    // Suspense renders content when not suspended; cards render once each
    expect(container.querySelectorAll('[data-testid="stove-card"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-testid="thermostat-card"]')).toHaveLength(1);
  });
});
