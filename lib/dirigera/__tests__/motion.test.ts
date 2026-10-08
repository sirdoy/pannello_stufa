import { formatLux, isMotionSensor, motionLabel, motionSummary } from '../motion';

describe('dirigera motion helpers', () => {
  it('recognises occupancy and legacy motion sensors', () => {
    expect(isMotionSensor({ type: 'occupancySensor' })).toBe(true);
    expect(isMotionSensor({ type: 'motionSensor' })).toBe(true);
    expect(isMotionSensor({ type: 'openCloseSensor' })).toBe(false);
  });

  it('labels the motion state', () => {
    expect(motionLabel({ is_detected: true })).toBe('Movimento');
    expect(motionLabel({ is_detected: false })).toBe('Fermo');
    expect(motionLabel({})).toBe('Fermo');
  });

  it('formats lux and keeps 0 as a reading', () => {
    expect(formatLux(22)).toBe('22 lux');
    expect(formatLux(0)).toBe('0 lux');
    expect(formatLux(null)).toBeNull();
    expect(formatLux(undefined)).toBeNull();
  });

  it('joins motion and light, or shows motion alone', () => {
    expect(motionSummary({ is_detected: true, light_level: 3 })).toBe('Movimento · 3 lux');
    expect(motionSummary({ is_detected: false, light_level: 0 })).toBe('Fermo · 0 lux');
    expect(motionSummary({ is_detected: false })).toBe('Fermo');
    expect(motionSummary({ is_detected: true, light_level: null })).toBe('Movimento');
  });
});
