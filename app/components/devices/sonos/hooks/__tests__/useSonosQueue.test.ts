/**
 * Tests for useSonosQueue Hook
 *
 * Validates initial state, on-demand fetching, load-more pagination,
 * hasMore flag, error handling, and query param forwarding.
 */

import { renderHook, act } from '@testing-library/react';

describe('useSonosQueue', () => {
  let useSonosQueue: typeof import('../useSonosQueue').useSonosQueue;

  beforeAll(async () => {
    const mod = await import('../useSonosQueue');
    useSonosQueue = mod.useSonosQueue;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Test 1: initial state has empty items, total 0, loading false', () => {
    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
  });

  it('Test 2: fetchInitial fetches first page and sets items/total', async () => {
    const mockItems = [
      { position: 1, title: 'Song 1', artist: 'Artist 1', album: null, album_art_url: null },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        group_id: 'RINCON_TEST',
        items: mockItems,
        total: 25,
        limit: 20,
        offset: 0,
      }),
    });

    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    await act(async () => {
      await result.current.fetchInitial();
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.title).toBe('Song 1');
    expect(result.current.total).toBe(25);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('Test 3: loadMore appends items to existing list', async () => {
    const page1Items = [
      { position: 1, title: 'Song 1', artist: 'Artist 1', album: null, album_art_url: null },
      { position: 2, title: 'Song 2', artist: 'Artist 2', album: null, album_art_url: null },
    ];
    const page2Items = [
      { position: 3, title: 'Song 3', artist: 'Artist 3', album: null, album_art_url: null },
      { position: 4, title: 'Song 4', artist: 'Artist 4', album: null, album_art_url: null },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          group_id: 'RINCON_TEST',
          items: page1Items,
          total: 5,
          limit: 20,
          offset: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          group_id: 'RINCON_TEST',
          items: page2Items,
          total: 5,
          limit: 20,
          offset: 2,
        }),
      });

    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    await act(async () => {
      await result.current.fetchInitial();
    });
    expect(result.current.items).toHaveLength(2);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[2]!.title).toBe('Song 3');
    expect(result.current.items[3]!.title).toBe('Song 4');
  });

  it('Test 4: hasMore is false when all items loaded', async () => {
    const mockItems = [
      { position: 1, title: 'Song 1', artist: 'Artist 1', album: null, album_art_url: null },
      { position: 2, title: 'Song 2', artist: 'Artist 2', album: null, album_art_url: null },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        group_id: 'RINCON_TEST',
        items: mockItems,
        total: 2,
        limit: 20,
        offset: 0,
      }),
    });

    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    await act(async () => {
      await result.current.fetchInitial();
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('Test 5: error state set on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal error' }),
    });

    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    await act(async () => {
      await result.current.fetchInitial();
    });

    expect(result.current.error).toBe('Queue non disponibile');
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('Test 6: fetchInitial resets items (does not append)', async () => {
    const firstItems = [
      { position: 1, title: 'Old Song', artist: 'Old Artist', album: null, album_art_url: null },
    ];
    const secondItems = [
      { position: 1, title: 'New Song', artist: 'New Artist', album: null, album_art_url: null },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          group_id: 'RINCON_TEST',
          items: firstItems,
          total: 1,
          limit: 20,
          offset: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          group_id: 'RINCON_TEST',
          items: secondItems,
          total: 1,
          limit: 20,
          offset: 0,
        }),
      });

    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    await act(async () => {
      await result.current.fetchInitial();
    });
    expect(result.current.items[0]!.title).toBe('Old Song');

    await act(async () => {
      await result.current.fetchInitial();
    });
    // Should reset — not append
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.title).toBe('New Song');
  });

  it('Test 7: passes limit=20 and offset as query params', async () => {
    const page1Items = Array.from({ length: 20 }, (_, i) => ({
      position: i + 1,
      title: `Song ${i + 1}`,
      artist: `Artist ${i + 1}`,
      album: null,
      album_art_url: null,
    }));

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          group_id: 'RINCON_TEST',
          items: page1Items,
          total: 40,
          limit: 20,
          offset: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          group_id: 'RINCON_TEST',
          items: [],
          total: 40,
          limit: 20,
          offset: 20,
        }),
      });

    const { result } = renderHook(() => useSonosQueue('RINCON_TEST'));

    await act(async () => {
      await result.current.fetchInitial();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_TEST/queue?limit=20&offset=0'
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_TEST/queue?limit=20&offset=20'
    );
  });
});
