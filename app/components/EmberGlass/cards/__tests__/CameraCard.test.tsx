/**
 * CameraCard — Phase 177 (DASH-07) — Jest unit tests
 *
 * Coverage:
 *   - Snapshot <img> with cache-busting `?t=` query string built from useCameraData.
 *   - Mono label overlay reads `{name} · {resolution}` from the first camera.
 *   - LIVE pill (red 6×6 dot + 10px LIVE text) rendered in header right slot.
 *   - Tap opens placeholder Sheet with title "Camera".
 *   - Empty cameras array renders no <img> and dash placeholder label.
 */
import { fireEvent, render } from '@testing-library/react';

import CameraCard from '../CameraCard';

jest.mock('@/app/components/devices/camera/hooks/useCameraData', () => ({
  useCameraData: jest.fn(),
}));

import { useCameraData } from '@/app/components/devices/camera/hooks/useCameraData';

const mockedUseCameraData = useCameraData as jest.MockedFunction<typeof useCameraData>;

function buildReturn(overrides: Partial<ReturnType<typeof useCameraData>> = {}) {
  return {
    cameras: [],
    loading: false,
    error: null,
    connected: true,
    stale: false,
    dataFreshness: null,
    lastUpdatedAt: null,
    refresh: jest.fn(async () => {}),
    ...overrides,
  } as ReturnType<typeof useCameraData>;
}

describe('CameraCard (Phase 177 — DASH-07)', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    mockedUseCameraData.mockReset();
    // Sheet primitive scroll-locks the body and calls window.scrollTo on cleanup;
    // jsdom's noop scrollTo can warn — mock it (mirrors EmberGlass/Sheet.test.tsx).
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    document.body.removeAttribute('style');
    window.scrollTo = originalScrollTo;
  });

  test('(a) renders <img> with /api/camera/snapshot/{id}?t={lastUpdatedAt}', () => {
    mockedUseCameraData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cameras: [{ camera_id: 'cam1', name: 'INGRESSO', device_type: 'NACamera' } as any],
        lastUpdatedAt: 1700000000,
      })
    );

    const { container } = render(<CameraCard />);
    const img = container.querySelector('img');

    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/api/camera/snapshot/cam1?t=1700000000');
  });

  test('(b) renders mono label "{name} · {resolution}"', () => {
    mockedUseCameraData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cameras: [{ camera_id: 'cam1', name: 'INGRESSO', device_type: 'NACamera' } as any],
        lastUpdatedAt: 1700000000,
      })
    );

    const { getByText } = render(<CameraCard />);

    expect(getByText(/INGRESSO · NACamera/)).toBeInTheDocument();
  });

  test('(c) renders LIVE pill (text + dot)', () => {
    mockedUseCameraData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cameras: [{ camera_id: 'cam1', name: 'INGRESSO', device_type: 'NACamera' } as any],
        lastUpdatedAt: 1700000000,
      })
    );

    const { getByText, getByTestId } = render(<CameraCard />);

    expect(getByText('LIVE')).toBeInTheDocument();
    expect(getByTestId('live-dot')).toBeInTheDocument();
  });

  test('(d) clicking the card opens the placeholder sheet (dialog data-state flips to open)', () => {
    mockedUseCameraData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cameras: [{ camera_id: 'cam1', name: 'INGRESSO', device_type: 'NACamera' } as any],
        lastUpdatedAt: 1700000000,
      })
    );

    const { getByTestId, container } = render(<CameraCard />);

    // Sheet primitive uses forceMount — the dialog is always present, but its
    // data-state attribute flips closed → open, which is the auth signal.
    const dialogBefore = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogBefore?.getAttribute('data-state')).not.toBe('open');

    fireEvent.click(getByTestId('camera-card'));

    const dialogAfter = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogAfter).not.toBeNull();
    expect(dialogAfter?.getAttribute('data-state')).toBe('open');
    // Sheet body renders the placeholder copy (forceMount keeps it mounted).
    expect(dialogAfter?.textContent).toMatch(/Controlli in arrivo/i);
  });

  test('(e) empty cameras: no <img> rendered, label shows em-dash placeholder', () => {
    mockedUseCameraData.mockReturnValue(buildReturn({ cameras: [], lastUpdatedAt: null }));

    const { container, getByText } = render(<CameraCard />);

    expect(container.querySelector('img')).toBeNull();
    expect(getByText(/—/)).toBeInTheDocument();
  });
});
