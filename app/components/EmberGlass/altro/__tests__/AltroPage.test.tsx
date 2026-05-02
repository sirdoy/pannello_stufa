/**
 * AltroPage unit tests (Phase 181 D-14 fourth bullet, body-level — at least 5 specs).
 *
 * Mocks getNavigationStructureWithPreferences and the /api/devices/config fetch
 * to isolate Dispositivi rendering from registry implementation details.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { AltroPage } from '../AltroPage';

jest.mock('@/lib/devices/deviceRegistry', () => ({
  getNavigationStructureWithPreferences: jest.fn(() => ({
    devices: [
      {
        id: 'stove',
        name: 'Stufa',
        icon: 'flame',
        color: 'primary',
        items: [{ label: 'Controllo', route: '/stove' }],
      },
      {
        id: 'thermostat',
        name: 'Termostato',
        icon: 'thermometer',
        color: 'climate',
        items: [{ label: 'Controllo', route: '/thermostat' }],
      },
    ],
    global: [],
    settings: [],
  })),
}));

beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ enabledDevices: ['stove', 'thermostat'] }),
  } as Response);
});

afterAll(() => {
  // @ts-expect-error — restore
  delete global.fetch;
});

describe('AltroPage', () => {
  test('1: renders 4 group titles (Dispositivi, Sistema, Impostazioni, Account)', async () => {
    render(<AltroPage />);
    // Group titles render inside CardHead (the styled label div with
    // letter-spacing: 0.2px). "Dispositivi" appears twice (group title +
    // Impostazioni "Dispositivi" row label) — assert at least one match for
    // the title text.
    const titles = await screen.findAllByText('Dispositivi');
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText('Impostazioni')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  test('2: Esci row links to /auth/logout with #ff8a4a label color', () => {
    render(<AltroPage />);
    const esci = screen.getByRole('link', { name: /esci/i });
    expect(esci).toHaveAttribute('href', '/auth/logout');
    // The labelColor='#ff8a4a' is set as inline style on the Pressable container.
    // Some browsers normalize to rgb(255, 138, 74); test either form.
    const colorRaw = esci.style.color;
    expect(colorRaw === '#ff8a4a' || colorRaw === 'rgb(255, 138, 74)').toBe(true);
  });

  test('3: always-present Sistema + Account links render (Log, Registro, Changelog, Esci)', () => {
    render(<AltroPage />);
    // Use exact-match regex so /log/i does not also match "Changelog".
    expect(screen.getByRole('link', { name: /^log$/i })).toHaveAttribute('href', '/log');
    expect(screen.getByRole('link', { name: /^registro$/i })).toHaveAttribute(
      'href',
      '/registry'
    );
    expect(screen.getByRole('link', { name: /^changelog$/i })).toHaveAttribute(
      'href',
      '/changelog'
    );
    expect(screen.getByRole('link', { name: /^esci$/i })).toHaveAttribute(
      'href',
      '/auth/logout'
    );
  });

  test('4: deferred settings routes are NOT rendered (UI-SPEC OQ-2)', () => {
    render(<AltroPage />);
    const allLinks = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(allLinks).not.toContain('/settings/account');
    expect(allLinks).not.toContain('/settings/gdpr');
    expect(allLinks).not.toContain('/settings/privacy');
  });

  test('5: Dispositivi rows render with Italian names from the mocked registry', async () => {
    render(<AltroPage />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /stufa/i })).toHaveAttribute('href', '/stove');
    });
    // Termostato matches both the Dispositivi row (/thermostat) and the
    // Impostazioni "Termostato" row (/settings/thermostat). Narrow by href.
    const termoLinks = screen.getAllByRole('link', { name: /termostato/i });
    const deviceTermo = termoLinks.find(
      (a) => a.getAttribute('href') === '/thermostat'
    );
    expect(deviceTermo).toBeDefined();
  });
});
