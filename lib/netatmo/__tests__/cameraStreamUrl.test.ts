import { pickStreamUrl } from '../cameraStreamUrl';

const proxy = { high: '/api/v1/netatmo/camera/c1/live/high/index.m3u8', medium: 'm', low: 'l' };
const vpn = { high: 'https://prodvpn.netatmo.net/x/live/files/high/index.m3u8', medium: 'm', low: 'l' };
const local = { high: 'http://192.168.1.20/live/files/high/index.m3u8', medium: 'm', low: 'l' };

describe('pickStreamUrl', () => {
  it('prefers proxy_streams (browser-playable) over VPN and local URLs', () => {
    expect(pickStreamUrl({ proxy_streams: proxy, vpn_streams: vpn, local_streams: local, is_local: true }, true))
      .toBe(proxy.high);
  });

  it('never picks a LAN http URL from an https page (mixed content)', () => {
    expect(pickStreamUrl({ vpn_streams: vpn, local_streams: local, is_local: true }, true)).toBe(vpn.high);
  });

  it('uses the local URL from an http page when the camera is local and no proxy URL exists', () => {
    expect(pickStreamUrl({ vpn_streams: vpn, local_streams: local, is_local: true }, false)).toBe(local.high);
  });

  it('returns null when nothing is available', () => {
    expect(pickStreamUrl({}, true)).toBeNull();
  });
});
