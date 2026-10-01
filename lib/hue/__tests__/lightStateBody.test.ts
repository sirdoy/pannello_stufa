import { normalizeLightStateBody } from '../lightStateBody';

describe('normalizeLightStateBody', () => {
  it('maps the legacy bridge keys to the backend names', () => {
    expect(normalizeLightStateBody({ on: true, bri: 10, ct: 300, sat: 5, hue: 1 })).toEqual({
      on: true,
      brightness: 10,
      color_temp: 300,
      saturation: 5,
      hue: 1,
    });
  });

  it('keeps canonical keys and drops the legacy duplicate', () => {
    expect(normalizeLightStateBody({ brightness: 20, bri: 10 })).toEqual({ brightness: 20 });
  });

  it('leaves canonical bodies unchanged', () => {
    const body = { on: false, xy: [0.3, 0.3] };
    expect(normalizeLightStateBody(body)).toEqual(body);
  });
});
