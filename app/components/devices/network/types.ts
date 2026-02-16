/**
 * Type definitions for NetworkCard data layer
 *
 * Defines all TypeScript interfaces for Fritz!Box network monitoring:
 * - API response types (bandwidth, devices, WAN)
 * - Sparkline data structures
 * - Health status types
 * - Hook return types
 */

import type { DeviceCategory } from '@/types/firebase/network';

// API response types (matching Fritz!Box API route responses from Phase 61)

export interface BandwidthData {
  download: number;    // Mbps
  upload: number;      // Mbps
  timestamp: number;   // Unix timestamp ms
}

export interface DeviceData {
  id: string;
  name: string;
  ip: string;
  mac: string;
  active: boolean;
  type?: 'lan' | 'wlan' | 'guest';
  bandwidth?: number;   // Mbps (may not be available yet)
  lastSeen?: number;    // Unix timestamp ms when last active
  category?: DeviceCategory;  // Device category (Phase 66)
}

export interface WanData {
  connected: boolean;
  uptime: number;       // Seconds
  externalIp?: string;
  linkSpeed?: number;   // Mbps
  dns?: string;         // DNS server(s), e.g. "8.8.8.8, 8.8.4.4"
  gateway?: string;     // Default gateway IP
  connectionType?: string;  // 'DHCP' | 'PPPoE' | 'Static'
  timestamp: number;
}

// Sparkline data point
export interface SparklinePoint {
  time: number;   // Unix timestamp ms
  mbps: number;
}

// Health status
export type NetworkHealthStatus = 'excellent' | 'good' | 'degraded' | 'poor';

// Maps to DeviceCard healthStatus prop
export type DeviceCardHealthStatus = 'ok' | 'warning' | 'error' | 'critical';

// Error types for Fritz!Box API
export interface NetworkError {
  type: 'setup' | 'timeout' | 'rate_limited' | 'generic';
  message: string;
  retryAfter?: number;
}

// Hook return type
export interface UseNetworkDataReturn {
  // Core data
  bandwidth: BandwidthData | null;
  devices: DeviceData[];
  wan: WanData | null;

  // Sparkline buffers
  downloadHistory: SparklinePoint[];
  uploadHistory: SparklinePoint[];

  // Status
  loading: boolean;
  connected: boolean;
  stale: boolean;
  lastUpdated: number | null;

  // Health
  health: NetworkHealthStatus;
  healthMapped: DeviceCardHealthStatus;

  // Error
  error: NetworkError | null;

  // Derived
  activeDeviceCount: number;

  // Actions
  updateDeviceCategory: (mac: string, category: DeviceCategory) => void;
}

// Commands return type
export interface UseNetworkCommandsReturn {
  navigateToNetwork: () => void;
}

// Bandwidth history types (Phase 64)

// Bandwidth history point for chart data
export interface BandwidthHistoryPoint {
  time: number;      // Unix timestamp ms
  download: number;  // Mbps
  upload: number;    // Mbps
}

// Time range options for bandwidth chart
export type BandwidthTimeRange = '1h' | '24h' | '7d';

// useBandwidthHistory return type
export interface UseBandwidthHistoryReturn {
  chartData: BandwidthHistoryPoint[];
  timeRange: BandwidthTimeRange;
  setTimeRange: (range: BandwidthTimeRange) => void;
  addDataPoint: (bandwidth: BandwidthData) => void;
  pointCount: number;          // Raw points in buffer before decimation
  isEmpty: boolean;            // No data collected yet
  isCollecting: boolean;       // < 10 points (chart not yet meaningful)
}

// Device history types (Phase 65)

// Device event for timeline
export interface DeviceEvent {
  deviceMac: string;
  deviceName: string;
  deviceIp: string;
  eventType: 'connected' | 'disconnected';
  timestamp: number; // Unix timestamp ms
}

// Time range options for device history
export type DeviceHistoryTimeRange = '1h' | '24h' | '7d';

// Bandwidth correlation types (Phase 67)

export interface CorrelationDataPoint {
  time: number;          // Unix timestamp ms (rounded to nearest minute)
  bandwidth: number;     // Download Mbps
  powerLevel: number;    // Stove power level (1-5)
}

export type CorrelationInsightLevel = 'strong-positive' | 'moderate-positive' | 'none' | 'moderate-negative' | 'strong-negative';

export interface CorrelationInsight {
  coefficient: number;           // Raw Pearson r (-1 to +1)
  level: CorrelationInsightLevel;
  description: string;           // Italian human-readable text
  dataPointCount: number;        // Number of paired points used
  activeHours: number;           // Approximate hours of stove activity
}

export type CorrelationStatus = 'ready' | 'collecting' | 'insufficient' | 'stove-off';

export interface UseBandwidthCorrelationReturn {
  chartData: CorrelationDataPoint[];
  insight: CorrelationInsight | null;
  status: CorrelationStatus;
  addDataPoint: (bandwidth: number, powerLevel: number | null, timestamp: number) => void;
  pointCount: number;
  minPoints: number;
}
