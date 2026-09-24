import { buildCacheKey, pickQueryParams, NUMERIC_PARAM, BAND_PARAM, MAC_PARAM } from '../fritzboxQuery';

describe('fritzboxQuery', () => {
  describe('pickQueryParams', () => {
    it('keeps only whitelisted, well-formed params in spec order', () => {
      const src = new URLSearchParams('offset=20&limit=10&band=5GHz&evil=1&hours=x');
      const out = pickQueryParams(src, { band: BAND_PARAM, hours: NUMERIC_PARAM, limit: NUMERIC_PARAM, offset: NUMERIC_PARAM });
      expect(out.toString()).toBe('band=5GHz&limit=10&offset=20');
    });

    it('validates MAC addresses', () => {
      expect(MAC_PARAM.test('AA:BB:CC:DD:EE:FF')).toBe(true);
      expect(MAC_PARAM.test('aa-bb-cc-dd-ee-ff')).toBe(true);
      expect(MAC_PARAM.test('AA:BB:CC:DD:EE')).toBe(false);
      expect(MAC_PARAM.test('AA:BB:CC:DD:EE:FF/x')).toBe(false);
    });
  });

  describe('buildCacheKey', () => {
    it('returns the base key when there are no params', () => {
      expect(buildCacheKey('wifi-clients', new URLSearchParams())).toBe('wifi-clients');
    });

    it('encodes params into a Firebase-safe key', () => {
      const key = buildCacheKey('wifi-clients', new URLSearchParams('band=2.4GHz&limit=10'));
      expect(key).not.toMatch(/[.$#[\]/]/);
      expect(key).toBe('wifi-clients--band-2_2e4GHz--limit-10');
    });

    it('is injective for values that differ only in special chars', () => {
      const a = buildCacheKey('k', new URLSearchParams({ mac: 'AA:BB:CC:DD:EE:FF' }));
      const b = buildCacheKey('k', new URLSearchParams({ mac: 'AA-BB-CC-DD-EE-FF' }));
      const c = buildCacheKey('k', new URLSearchParams({ band: '2.4GHz' }));
      const d = buildCacheKey('k', new URLSearchParams({ band: '2_4GHz' }));
      expect(a).not.toBe(b);
      expect(c).not.toBe(d);
    });
  });
});
