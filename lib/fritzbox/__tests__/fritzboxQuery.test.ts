import { pickQueryParams, NUMERIC_PARAM, BAND_PARAM, MAC_PARAM } from '../fritzboxQuery';

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
});
