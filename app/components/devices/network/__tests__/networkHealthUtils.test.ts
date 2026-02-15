/**
 * Tests for Network Health Algorithm
 *
 * Validates health computation logic, hysteresis behavior, and DeviceCard mapping.
 */

import { computeNetworkHealth, mapHealthToDeviceCard } from '../networkHealthUtils';
import type { NetworkHealthStatus } from '../types';

describe('computeNetworkHealth', () => {
  it('returns immediate poor status when WAN disconnected (no hysteresis)', () => {
    const result = computeNetworkHealth({
      wanConnected: false,
      wanUptime: 86400, // 24h uptime
      downloadMbps: 10,
      uploadMbps: 5,
      linkSpeedMbps: 100,
      previousHealth: 'excellent',
      consecutiveReadings: 0,
    });

    expect(result.health).toBe('poor');
    expect(result.consecutiveReadings).toBe(0);
  });

  it('returns excellent for high uptime and low saturation', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400, // 24h
      downloadMbps: 50,
      uploadMbps: 30,
      linkSpeedMbps: 100, // 50% saturation
      previousHealth: 'excellent',
      consecutiveReadings: 2,
    });

    expect(result.health).toBe('excellent');
    expect(result.consecutiveReadings).toBe(3);
  });

  it('returns good for medium uptime and medium saturation', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 7200, // 2h
      downloadMbps: 70,
      uploadMbps: 40,
      linkSpeedMbps: 100, // 70% saturation
      previousHealth: 'good',
      consecutiveReadings: 1,
    });

    expect(result.health).toBe('good');
    expect(result.consecutiveReadings).toBe(2);
  });

  it('returns degraded for low uptime and high saturation', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 1200, // 20min
      downloadMbps: 85,
      uploadMbps: 50,
      linkSpeedMbps: 100, // 85% saturation
      previousHealth: 'degraded',
      consecutiveReadings: 0,
    });

    expect(result.health).toBe('degraded');
    expect(result.consecutiveReadings).toBe(1);
  });

  it('returns poor for very low uptime or very high saturation', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 300, // 5min
      downloadMbps: 95,
      uploadMbps: 80,
      linkSpeedMbps: 100, // 95% saturation
      previousHealth: 'poor',
      consecutiveReadings: 3,
    });

    expect(result.health).toBe('poor');
    expect(result.consecutiveReadings).toBe(4);
  });

  it('applies hysteresis: single reading does not change status', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400, // Excellent criteria
      downloadMbps: 50,
      uploadMbps: 30,
      linkSpeedMbps: 100,
      previousHealth: 'good', // Previous was good
      consecutiveReadings: 0,
    });

    // Should stay 'good' despite excellent criteria (first reading)
    expect(result.health).toBe('good');
    expect(result.consecutiveReadings).toBe(1);
  });

  it('applies hysteresis: 2 consecutive readings change status', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400, // Excellent criteria
      downloadMbps: 50,
      uploadMbps: 30,
      linkSpeedMbps: 100,
      previousHealth: 'good',
      consecutiveReadings: 1, // Second reading
    });

    // Should change to 'excellent' now (2 consecutive readings)
    expect(result.health).toBe('excellent');
    expect(result.consecutiveReadings).toBe(0);
  });

  it('uses default linkSpeed of 100 Mbps when undefined', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400,
      downloadMbps: 60,
      uploadMbps: 40,
      linkSpeedMbps: undefined, // Will default to 100
      previousHealth: 'good',
      consecutiveReadings: 1,
    });

    // 60 Mbps / 100 Mbps = 60% saturation < 70% → excellent
    expect(result.health).toBe('excellent');
  });

  it('resets consecutiveReadings when status changes', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400,
      downloadMbps: 50,
      uploadMbps: 30,
      linkSpeedMbps: 100,
      previousHealth: 'good',
      consecutiveReadings: 1,
    });

    expect(result.health).toBe('excellent');
    expect(result.consecutiveReadings).toBe(0); // Reset after change
  });

  it('calculates saturation using max of download and upload', () => {
    // Upload higher than download
    const result1 = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400,
      downloadMbps: 30,
      uploadMbps: 65, // Higher
      linkSpeedMbps: 100, // 65% saturation
      previousHealth: 'excellent',
      consecutiveReadings: 2,
    });

    expect(result1.health).toBe('excellent'); // < 70%

    // Download higher than upload
    const result2 = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400,
      downloadMbps: 75, // Higher
      uploadMbps: 30,
      linkSpeedMbps: 100, // 75% saturation
      previousHealth: 'good',
      consecutiveReadings: 1,
    });

    expect(result2.health).toBe('good'); // >= 70% but < 85%
  });
});

describe('mapHealthToDeviceCard', () => {
  it('maps excellent to ok', () => {
    expect(mapHealthToDeviceCard('excellent')).toBe('ok');
  });

  it('maps good to ok', () => {
    expect(mapHealthToDeviceCard('good')).toBe('ok');
  });

  it('maps degraded to warning', () => {
    expect(mapHealthToDeviceCard('degraded')).toBe('warning');
  });

  it('maps poor to critical', () => {
    expect(mapHealthToDeviceCard('poor')).toBe('critical');
  });
});
