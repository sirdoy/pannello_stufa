/**
 * SchedulerEngineBanner (ROADMAP V8): heartbeat of the stove engine on the Pi.
 */
import { act, render, screen } from '@testing-library/react';
import SchedulerEngineBanner from '../SchedulerEngineBanner';

type Handler = (payload: unknown) => void;
const handlers: Handler[] = [];
let readyState = 1; // ReadyState.OPEN

jest.mock('@/app/context/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    readyState,
    subscribe: (_topic: string, h: Handler) => handlers.push(h),
    unsubscribe: jest.fn(),
  }),
}));
jest.mock('@/lib/hooks/useWebSocketManager', () => ({ ReadyState: { OPEN: 1 } }));

const NOW = new Date('2026-09-29T12:00:00Z').getTime();
const secondsAgo = (s: number) => Math.floor((NOW - s * 1000) / 1000);

function health(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    initialized: true,
    started_at: secondsAgo(3600),
    last_tick_at: secondsAgo(30),
    last_action: 'no_op',
    tick_interval_s: 60,
    stale_after_s: 180,
    healthy: true,
    ...overrides,
  };
}

/** Let the mount-time fetch resolve and its state updates render. */
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function mockFetch(body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => body }) as never;
}

beforeEach(() => {
  handlers.length = 0;
  readyState = 1;
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

it('stays hidden while the engine ticks', async () => {
  mockFetch(health());
  render(<SchedulerEngineBanner variant="inline" />);
  await settle();
  expect(global.fetch).toHaveBeenCalledWith('/api/v1/thermorossi/scheduler/engine');
  expect(screen.queryByTestId('scheduler-engine-banner')).not.toBeInTheDocument();
});

it('shows the banner when the last tick is older than stale_after_s', async () => {
  mockFetch(health({ last_tick_at: secondsAgo(10 * 60), healthy: false }));
  render(<SchedulerEngineBanner variant="inline" />);
  expect(await screen.findByTestId('scheduler-engine-banner')).toHaveTextContent('Motore stufa fermo');
  expect(screen.getByTestId('scheduler-engine-banner')).toHaveTextContent('10 minuti');
});

it('a WS engine.tick clears the banner', async () => {
  mockFetch(health({ last_tick_at: secondsAgo(10 * 60), healthy: false }));
  render(<SchedulerEngineBanner variant="inline" />);
  await screen.findByTestId('scheduler-engine-banner');

  act(() => {
    handlers.forEach((h) =>
      h({ event: 'engine.tick', data: { action: 'no_op' }, timestamp: new Date(NOW).toISOString() })
    );
  });
  expect(screen.queryByTestId('scheduler-engine-banner')).not.toBeInTheDocument();
});

it('goes stale on the local clock without new requests', async () => {
  mockFetch(health({ last_tick_at: secondsAgo(0) }));
  render(<SchedulerEngineBanner variant="inline" />);
  await settle();
  expect(global.fetch).toHaveBeenCalledTimes(1);

  act(() => {
    jest.advanceTimersByTime(4 * 60 * 1000);
  });
  expect(screen.getByTestId('scheduler-engine-banner')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1); // WS open: no REST polling
});

it('no false alarm right after a backend restart (counts from started_at)', async () => {
  mockFetch(health({ last_tick_at: null, started_at: secondsAgo(20) }));
  render(<SchedulerEngineBanner variant="inline" />);
  await settle();
  expect(screen.queryByTestId('scheduler-engine-banner')).not.toBeInTheDocument();
});
