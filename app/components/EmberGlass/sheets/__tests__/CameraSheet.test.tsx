/**
 * CameraSheet — Jest unit tests
 *
 * Coverage:
 *   - loading skeleton / empty / error states
 *   - online camera: snapshot only while `active`, live start via stream route
 *   - "disconnected" / "off" cameras render an explicit offline state
 *   - monitoring toggle posts to the monitoring route and refreshes; disabled when disconnected
 *   - navigation buttons + camera picker
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/components/devices/camera/HlsPlayer', () => ({
  __esModule: true,
  default: ({ src }: { src: string }) => <div data-testid="hls-player" data-src={src} />,
}));

jest.mock('@/app/components/devices/camera/hooks/useCameraData', () => ({
  useCameraData: jest.fn(),
}));

import { CameraSheet } from '../CameraSheet';
import type { CameraSheetProps } from '../CameraSheet';
import type { CameraStatus } from '@/types/netatmoProxy';

function camera(overrides: Partial<CameraStatus> = {}): CameraStatus {
  return {
    camera_id: 'cam1',
    name: 'Ingresso',
    device_type: 'NACamera',
    status: 'on',
    sd_status: 'on',
    alim_status: 'on',
    firmware: '271',
    is_local: true,
    ...overrides,
  };
}

function renderSheet(overrides: Partial<CameraSheetProps> = {}) {
  const props: CameraSheetProps = {
    cameras: [camera()],
    loading: false,
    error: null,
    stale: false,
    lastUpdatedAt: 1700000000,
    active: true,
    onRefresh: jest.fn(async () => {}),
    onNavigate: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<CameraSheet {...props} />) };
}

describe('CameraSheet', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('shows skeleton while loading with no data', () => {
    renderSheet({ cameras: [], loading: true });
    expect(screen.getByTestId('camera-sheet-skeleton')).toBeInTheDocument();
  });

  test('shows empty state and retry when there are no cameras', () => {
    const { props } = renderSheet({ cameras: [] });
    expect(screen.getByTestId('camera-sheet-empty')).toHaveTextContent('Nessuna videocamera Netatmo trovata.');
    fireEvent.click(screen.getByTestId('sheet-btn-riprova'));
    expect(props.onRefresh).toHaveBeenCalled();
  });

  test('shows error state with message', () => {
    renderSheet({ cameras: [], error: 'Errore 502' });
    expect(screen.getByTestId('camera-sheet-error')).toHaveTextContent('Errore 502');
  });

  test('online camera renders the snapshot when active', () => {
    const { container } = renderSheet();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/api/v1/netatmo/camera/cam1/live/snapshot.jpg?t=1700000000',
    );
    expect(screen.getByTestId('camera-sheet-status')).toHaveTextContent('Attiva');
  });

  test('does not request the snapshot while the sheet is closed', () => {
    const { container } = renderSheet({ active: false });
    expect(container.querySelector('img')).toBeNull();
  });

  test('disconnected camera shows explicit offline state and disables monitoring', () => {
    const { container } = renderSheet({ cameras: [camera({ status: 'disconnected' })] });
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('camera-sheet-offline')).toHaveTextContent('Camera disconnessa');
    expect(screen.getByTestId('camera-sheet-status')).toHaveTextContent('Disconnessa');
    expect(screen.getByTestId('camera-sheet-monitoring')).toBeDisabled();
    expect(screen.queryByTestId('sheet-btn-guarda-live')).toBeNull();
  });

  test('monitoring off shows its own offline copy', () => {
    renderSheet({ cameras: [camera({ status: 'off' })] });
    expect(screen.getByTestId('camera-sheet-offline')).toHaveTextContent('Monitoraggio disattivato');
    expect(screen.getByTestId('camera-sheet-monitoring')).toHaveAttribute('aria-checked', 'false');
  });

  test('live button fetches the stream and mounts the player', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ proxy_streams: { high: '/api/v1/netatmo/camera/cam1/live/index.m3u8' } }),
    })) as unknown as typeof fetch;

    renderSheet();
    fireEvent.click(screen.getByTestId('sheet-btn-guarda-live'));

    expect(await screen.findByTestId('hls-player')).toHaveAttribute(
      'data-src',
      '/api/v1/netatmo/camera/cam1/live/index.m3u8',
    );
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/netatmo/camera/cam1/stream');
  });

  test('live failure shows an error banner', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch;

    renderSheet();
    fireEvent.click(screen.getByTestId('sheet-btn-guarda-live'));

    expect(await screen.findByTestId('camera-sheet-stream-error')).toHaveTextContent('Live non disponibile');
  });

  test('monitoring toggle posts to the monitoring route then refreshes', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch;

    const { props } = renderSheet();
    await act(async () => {
      fireEvent.click(screen.getByTestId('camera-sheet-monitoring'));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/netatmo/camera/cam1/monitoring',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ monitoring: 'off' }) }),
    );
    await waitFor(() => expect(props.onRefresh).toHaveBeenCalled());
  });

  test('monitoring toggle failure rolls back and shows an error', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch;

    renderSheet();
    await act(async () => {
      fireEvent.click(screen.getByTestId('camera-sheet-monitoring'));
    });

    expect(screen.getByTestId('camera-sheet-monitoring')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('camera-sheet-action-error')).toBeInTheDocument();
  });

  test('navigation buttons route to camera pages', () => {
    const { props } = renderSheet();
    fireEvent.click(screen.getByTestId('sheet-btn-eventi'));
    fireEvent.click(screen.getByTestId('sheet-btn-apri-pagina'));
    expect(props.onNavigate).toHaveBeenCalledWith('/camera/events');
    expect(props.onNavigate).toHaveBeenCalledWith('/camera');
  });

  test('camera picker switches the selected camera', () => {
    renderSheet({
      cameras: [camera(), camera({ camera_id: 'cam2', name: 'Garage', status: 'disconnected' })],
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Garage' }));
    expect(screen.getByTestId('camera-sheet-offline')).toHaveTextContent('Camera disconnessa');
  });

  test('stale data shows a warning', () => {
    renderSheet({ stale: true });
    expect(screen.getByTestId('camera-sheet-stale')).toBeInTheDocument();
  });
});

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('CameraSheet pending (ROADMAP M80)', () => {
  test('"Aggiorna" shows a spinner until the refresh ends', async () => {
    const d = deferred();
    const onRefresh = jest.fn(() => d.promise);
    renderSheet({ onRefresh });

    fireEvent.click(screen.getByTestId('sheet-btn-aggiorna'));
    expect(screen.getByTestId('sheet-btn-aggiorna')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('sheet-btn-spinner')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sheet-btn-aggiorna'));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await d.promise;
    });
    expect(screen.queryByTestId('sheet-btn-spinner')).toBeNull();
  });

  test('the monitoring switch shows a spinner while the command is running', async () => {
    const d = deferred<{ ok: boolean; json: () => Promise<object> }>();
    global.fetch = jest.fn(() => d.promise) as unknown as typeof fetch;
    renderSheet();

    fireEvent.click(screen.getByTestId('camera-sheet-monitoring'));
    expect(screen.getByTestId('camera-sheet-monitoring')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('inline-toggle-spinner')).toBeInTheDocument();

    await act(async () => {
      d.resolve({ ok: true, json: async () => ({}) });
      await d.promise;
    });
    await waitFor(() => expect(screen.queryByTestId('inline-toggle-spinner')).toBeNull());
  });
});
