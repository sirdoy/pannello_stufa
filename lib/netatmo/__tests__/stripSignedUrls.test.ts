import { proxyEventSnapshots, stripSignedUrls } from '../stripSignedUrls';

describe('stripSignedUrls (S11)', () => {
  it('drops signed camera URL keys and keeps the proxy paths', () => {
    const out = stripSignedUrls({
      camera_id: 'c1',
      vpn_url: 'https://prodvpn.netatmo.net/restricted/x',
      vpn_streams: { high: 'https://prodvpn.netatmo.net/restricted/x/live/files/high/index.m3u8' },
      local_streams: { high: 'http://192.168.1.20/x/live/files/high/index.m3u8' },
      snapshot_url: 'https://prodvpn.netatmo.net/restricted/x/live/snapshot_720.jpg',
      proxy_streams: { high: '/api/v1/netatmo/camera/c1/live/high/index.m3u8' },
      snapshot_proxy_url: '/api/v1/netatmo/camera/c1/live/snapshot.jpg',
    });
    expect(out).toEqual({
      camera_id: 'c1',
      proxy_streams: { high: '/api/v1/netatmo/camera/c1/live/high/index.m3u8' },
      snapshot_proxy_url: '/api/v1/netatmo/camera/c1/live/snapshot.jpg',
    });
  });

  it('removes absolute URLs nested anywhere (gethomedata faces, vignettes, room status)', () => {
    const out = stripSignedUrls({
      body: {
        homes: [
          {
            persons: [{ id: 'p1', face: { id: 'f1', url: 'https://netatmocameraimage.blob.core.windows.net/x' } }],
            cameras: [{ id: 'c1', name: 'Garage', vpn_url: 'https://prodvpn.netatmo.net/restricted/x' }],
          },
        ],
      },
      rooms: [{ devices: [{ data: { vpn_url: 'https://x', is_reachable: true } }] }],
    });
    expect(JSON.stringify(out)).not.toMatch(/https?:\/\//);
    expect(out.body.homes[0]!.cameras[0]).toEqual({ id: 'c1', name: 'Garage' });
    expect(out.rooms[0]!.devices[0]!.data).toEqual({ is_reachable: true });
  });

  it('leaves primitives, null and relative paths untouched', () => {
    expect(stripSignedUrls(null)).toBeNull();
    expect(stripSignedUrls('/api/v1/x')).toBe('/api/v1/x');
    expect(stripSignedUrls([1, 'a'])).toEqual([1, 'a']);
  });
});

describe('proxyEventSnapshots (S11)', () => {
  it('points snapshot_url at the event snapshot proxy route', () => {
    const out = proxyEventSnapshots({
      events: [
        { event_id: 'e1', snapshot_url: 'https://netatmocameraimage.blob.core.windows.net/e1?sig=abc' },
        { event_id: 'e2', snapshot_url: null },
      ],
      count: 2,
    });
    expect(out.events[0]).toEqual({ event_id: 'e1', snapshot_url: '/api/v1/netatmo/camera/events/e1/snapshot' });
    expect(out.events[1]).toEqual({ event_id: 'e2' });
    expect(out.count).toBe(2);
  });
});
