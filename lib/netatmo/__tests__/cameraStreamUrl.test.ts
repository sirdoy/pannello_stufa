import { pickStreamUrl } from '../cameraStreamUrl';

const proxy = { high: '/api/v1/netatmo/camera/c1/live/high/index.m3u8', medium: 'm', low: 'l' };

describe('pickStreamUrl', () => {
  it('uses the authenticated proxy_streams relay', () => {
    expect(pickStreamUrl({ proxy_streams: proxy })).toBe(proxy.high);
  });

  it('returns null when no proxy URL is available (signed URLs are never used, S11)', () => {
    expect(pickStreamUrl({})).toBeNull();
  });
});
