import {
  airLevel,
  co2Level,
  formatCo2,
  formatHumidity,
  formatPm25,
  formatTemperature,
  isAirSensor,
  pm25Level,
} from '../airQuality';

describe('airQuality (D10, IKEA ALPSTUGA)', () => {
  it('maps CO2 to the IKEA bands', () => {
    expect(co2Level(430)).toBe('good');
    expect(co2Level(999)).toBe('good');
    expect(co2Level(1000)).toBe('fair');
    expect(co2Level(1600)).toBe('poor');
    expect(co2Level(null)).toBeNull();
    expect(co2Level(undefined)).toBeNull();
  });

  it('maps PM2.5 to the IKEA bands', () => {
    expect(pm25Level(3)).toBe('good');
    expect(pm25Level(35)).toBe('good');
    expect(pm25Level(36)).toBe('fair');
    expect(pm25Level(86)).toBe('poor');
  });

  it('airLevel is the worst of CO2 and PM2.5', () => {
    expect(airLevel({ co2: 430, pm25: 3 })).toBe('good');
    expect(airLevel({ co2: 1200, pm25: 3 })).toBe('fair');
    expect(airLevel({ co2: 1200, pm25: 90 })).toBe('poor');
    expect(airLevel({ co2: null, pm25: 40 })).toBe('fair');
    expect(airLevel({})).toBeNull();
  });

  it('formats readings', () => {
    expect(formatTemperature(21.25)).toBe('21,3°');
    expect(formatHumidity(52)).toBe('52%');
    expect(formatCo2(430)).toBe('430 ppm');
    expect(formatPm25(3)).toBe('3 µg/m³');
    expect(formatCo2(null)).toBe('—');
  });

  it('recognizes environmentSensor', () => {
    expect(isAirSensor({ type: 'environmentSensor' })).toBe(true);
    expect(isAirSensor({ type: 'openCloseSensor' })).toBe(false);
  });
});
