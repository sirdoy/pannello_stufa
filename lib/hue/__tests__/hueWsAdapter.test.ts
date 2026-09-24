import { adaptWsLights, adaptWsGroups } from '../hueWsAdapter';

describe('hueWsAdapter', () => {
  describe('adaptWsLights', () => {
    it('converts Bridge v1 lights dict to HueLight[]', () => {
      const result = adaptWsLights({
        '1': {
          state: { on: true, bri: 200, ct: 370, hue: 5000, sat: 150, colormode: 'ct', reachable: true },
          name: 'Luce Soggiorno',
          type: 'Extended color light',
          modelid: 'LCT016',
          custom_name: 'Luce Custom',
          device_type: 'hue_color',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        light_id: '1',
        name: 'Luce Soggiorno',
        on: true,
        brightness: 200,
        ct_mirek: 370,
        ct_kelvin: 2703,
        hue: 5000,
        saturation: 150,
        colormode: 'ct',
        reachable: true,
        capability_tier: 'color',
        room_id: null,
        room_name: null,
        model_id: 'LCT016',
        light_type: 'Extended color light',
        custom_name: 'Luce Custom',
        device_type: 'hue_color',
      });
    });

    it('derives capability_tier from light type', () => {
      const result = adaptWsLights({
        '1': { state: {}, name: 'A', type: 'Extended color light' },
        '2': { state: {}, name: 'B', type: 'Color temperature light' },
        '3': { state: {}, name: 'C', type: 'Dimmable light' },
      });

      expect(result[0]?.capability_tier).toBe('color');
      expect(result[1]?.capability_tier).toBe('ambiance');
      expect(result[2]?.capability_tier).toBe('white');
    });

    it('computes ct_kelvin from ct_mirek', () => {
      const result = adaptWsLights({
        '1': { state: { ct: 250 }, name: 'A', type: 'Color temperature light' },
      });
      expect(result[0]?.ct_kelvin).toBe(4000);
    });

    it('sets ct_kelvin to null when ct is null', () => {
      const result = adaptWsLights({
        '1': { state: { ct: null }, name: 'A', type: 'Dimmable light' },
      });
      expect(result[0]?.ct_kelvin).toBeNull();
    });

    it('returns empty array for null', () => {
      expect(adaptWsLights(null)).toEqual([]);
    });

    it('returns empty array for string', () => {
      expect(adaptWsLights('not-an-object')).toEqual([]);
    });

    it('returns empty array for array (already adapted)', () => {
      expect(adaptWsLights([{ light_id: '1' }])).toEqual([]);
    });

    it('defaults missing state fields gracefully', () => {
      const result = adaptWsLights({ '5': {} });
      expect(result[0]?.light_id).toBe('5');
      expect(result[0]?.on).toBe(false);
      expect(result[0]?.brightness).toBeNull();
      expect(result[0]?.name).toBe('Light 5');
    });
  });

  describe('adaptWsGroups', () => {
    it('converts Bridge v1 groups dict to HueGroup[]', () => {
      const result = adaptWsGroups({
        '1': {
          name: 'Soggiorno',
          lights: ['1', '2'],
          type: 'Room',
          class: 'Living room',
          state: { any_on: true, all_on: false },
          action: { bri: 200, ct: 370, colormode: 'ct' },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        group_id: '1',
        name: 'Soggiorno',
        type: 'Room',
        group_class: 'Living room',
        lights: ['1', '2'],
        any_on: true,
        all_on: false,
        brightness: 200,
        color_temp: 370,
        colormode: 'ct',
      });
    });

    it('returns empty array for null', () => {
      expect(adaptWsGroups(null)).toEqual([]);
    });

    it('returns empty array for array', () => {
      expect(adaptWsGroups([{ group_id: '1' }])).toEqual([]);
    });

    it('defaults missing fields gracefully', () => {
      const result = adaptWsGroups({ '3': {} });
      expect(result[0]?.group_id).toBe('3');
      expect(result[0]?.name).toBe('Group 3');
      expect(result[0]?.lights).toEqual([]);
      expect(result[0]?.any_on).toBe(false);
    });
  });

  // Current backend payload: backend/api/ws/manager.py _enrich_payload('hue') flattens
  // each entry to the REST item shape (HueLightStateResponse / HueGroupResponse).
  describe('backend flattened payload (REST item shape)', () => {
    const flatLight = {
      light_id: '7',
      name: 'Lampada Divano',
      on: true,
      brightness: 180,
      ct_mirek: 366,
      ct_kelvin: 2732,
      hue: 8402,
      saturation: 140,
      colormode: 'ct',
      reachable: true,
      capability_tier: 'color',
      room_id: '1',
      room_name: 'Soggiorno',
      model_id: 'LCT015',
      light_type: 'Extended color light',
      custom_name: 'Divano',
      device_type: 'lamp',
    };
    const flatGroup = {
      group_id: '1',
      name: 'Soggiorno',
      type: 'Room',
      group_class: 'Living room',
      lights: ['7'],
      any_on: true,
      all_on: true,
      brightness: 180,
      color_temp: 366,
      colormode: 'ct',
    };

    it('passes flattened lights through unchanged', () => {
      expect(adaptWsLights({ '7': flatLight })).toEqual([flatLight]);
    });

    it('passes flattened groups through unchanged', () => {
      expect(adaptWsGroups({ '1': flatGroup })).toEqual([flatGroup]);
    });
  });
});
