/**
 * useUser / UserProvider (roadmap 8.9: replaces @auth0/nextjs-auth0/client).
 */

import { render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { UserProvider, useUser, type SessionUserProfile } from '@/lib/auth/useUser';

const USER: SessionUserProfile = { sub: 'user:7', email: 'a@b.c', name: 'A', nickname: 'a', picture: '', role: 'user' };

function mockFetch(status: number, body?: unknown) {
  const fn = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('useUser', () => {
  afterEach(() => jest.restoreAllMocks());

  it('loads the signed-in user from /auth/profile', async () => {
    const fetchMock = mockFetch(200, USER);
    const { result } = renderHook(() => useUser());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(USER);
    expect(result.current.error).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/auth/profile', expect.anything());
  });

  it('returns no user on 204 (signed out)', async () => {
    mockFetch(204);
    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('exposes an error on a failed request', async () => {
    mockFetch(500);
    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('shares one request across consumers under UserProvider', async () => {
    function Name() {
      const { user } = useUser();
      return <span>{user?.email ?? '-'}</span>;
    }
    // Requests must not scale with the number of consumers (StrictMode may
    // double-run the provider effect, so compare instead of asserting 1).
    const callsFor = async (consumers: number) => {
      const fetchMock = mockFetch(200, USER);
      const { unmount } = render(
        <UserProvider>
          {Array.from({ length: consumers }, (_, i) => <Name key={i} />)}
        </UserProvider>
      );
      await waitFor(() => expect(screen.getAllByText('a@b.c')).toHaveLength(consumers));
      unmount();
      return fetchMock.mock.calls.length;
    };

    const single = await callsFor(1);
    expect(await callsFor(3)).toBe(single);
  });

  it('renders a provided user immediately (dev bypass)', () => {
    mockFetch(200, USER);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider user={USER}>{children}</UserProvider>
    );
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(USER);
  });
});
