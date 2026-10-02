/**
 * ROADMAP M56: the dashboard must not request the snapshot of a camera whose
 * status is not "on" (the backend answers 503 "Camera offline"), like CameraCard.
 */

import { render, screen } from '@testing-library/react';
import CameraDashboard from '@/app/(pages)/camera/CameraDashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/app/components/devices/camera/HlsPlayer', () => ({
  __esModule: true,
  default: () => null,
}));

function mockFetch(status: string): void {
  global.fetch = jest.fn((url: string) => {
    const body = url.includes('events')
      ? { events: [] }
      : {
          cameras: [{ camera_id: 'cam-1', name: 'Ingresso', type: 'NACamera', status }],
          data_freshness: null,
        };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  }) as unknown as typeof fetch;
}

describe('CameraDashboard snapshot (M56)', () => {
  it('renders the snapshot when the camera is on', async () => {
    mockFetch('on');
    render(<CameraDashboard />);
    const imgs = await screen.findAllByRole('img', { name: 'Ingresso' });
    expect(imgs[0]).toHaveAttribute('src', expect.stringContaining('cam-1'));
  });

  it('skips the snapshot request when the camera is disconnected', async () => {
    mockFetch('disconnected');
    render(<CameraDashboard />);
    expect(await screen.findByText('Snapshot non disponibile')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Ingresso' })).not.toBeInTheDocument();
  });
});
