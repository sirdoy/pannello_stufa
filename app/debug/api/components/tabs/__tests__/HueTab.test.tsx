import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HueTab from '../HueTab';

jest.mock('../ApiTab', () => ({
  EndpointCard: () => <div data-testid="endpoint-card" />,
  PostEndpointCard: ({ name, url, params, onExecute }: any) => {
    const defaults = (params ?? []).reduce(
      (acc: Record<string, string>, p: any) => ({ ...acc, [p.name]: p.defaultValue || 'test-id' }),
      {} as Record<string, string>
    );
    return (
      <div data-testid={`post-card-${name.toLowerCase().replace(/\s+/g, '-')}`}>
        <span data-testid={`url-${name.toLowerCase().replace(/\s+/g, '-')}`}>{url}</span>
        <span data-testid={`params-${name.toLowerCase().replace(/\s+/g, '-')}`}>
          {(params ?? []).map((p: any) => p.name).join(',')}
        </span>
        <button onClick={() => onExecute(defaults)}>Execute {name}</button>
      </div>
    );
  },
}));

const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

global.fetch = mockFetch;

// Suppress expected React warnings about infinite re-renders from the
// component's non-memoized useEffect dependencies (pre-existing issue).
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Maximum update depth')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe('HueTab (/debug/api)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('Control Light calls fetch with PUT method', () => {
    render(<HueTab autoRefresh={false} refreshTrigger={0} />);
    const button = screen.getByRole('button', { name: /Execute Control Light/i });
    fireEvent.click(button);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/hue/lights/'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('Control Room calls fetch with PUT method', () => {
    render(<HueTab autoRefresh={false} refreshTrigger={0} />);
    const button = screen.getByRole('button', { name: /Execute Control Room/i });
    fireEvent.click(button);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/hue/rooms/'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('Activate Scene calls correct URL with groupId and sceneId', () => {
    render(<HueTab autoRefresh={false} refreshTrigger={0} />);
    const button = screen.getByRole('button', { name: /Execute Activate Scene/i });
    fireEvent.click(button);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/hue/groups/test-id/scenes/test-id'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('Activate Scene card shows correct url label', () => {
    render(<HueTab autoRefresh={false} refreshTrigger={0} />);
    const urlSpan = screen.getByTestId('url-activate-scene');
    expect(urlSpan.textContent).toContain('groups/[groupId]/scenes/[sceneId]');
  });

  it('Activate Scene params include groupId and sceneId', () => {
    render(<HueTab autoRefresh={false} refreshTrigger={0} />);
    const paramsSpan = screen.getByTestId('params-activate-scene');
    expect(paramsSpan.textContent).toBe('groupId,sceneId');
  });
});
