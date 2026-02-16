/**
 * Device Event Logger
 *
 * Provides Firebase RTDB persistence and querying for device connection events.
 * Events are stored in date-keyed paths for efficient range queries.
 *
 * Phase 65: Device History Timeline
 */

import { adminDbSet, adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { format, eachDayOfInterval } from 'date-fns';
import type { DeviceEvent } from '@/app/components/devices/network/types';

/**
 * Device state for change detection
 */
interface DeviceState {
  active: boolean;
  lastSeen: number;
}

/**
 * Log a device event to Firebase RTDB
 * Events are stored in date-keyed paths: {env}/fritzbox/device_events/{YYYY-MM-DD}/{timestamp}_{mac}_{eventType}
 *
 * @param event - Device event to log
 */
export async function logDeviceEvent(event: DeviceEvent): Promise<void> {
  const dateKey = format(new Date(event.timestamp), 'yyyy-MM-dd');
  const macKey = event.deviceMac.replace(/:/g, '-'); // Firebase keys cannot contain colons
  const eventKey = `${event.timestamp}_${macKey}_${event.eventType}`;

  const basePath = getEnvironmentPath('fritzbox/device_events');
  const path = `${basePath}/${dateKey}/${eventKey}`;

  await adminDbSet(path, event);
}

/**
 * Generate array of date strings between start and end (inclusive)
 * Uses date-fns eachDayOfInterval for correctness
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of date strings
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dates = eachDayOfInterval({ start, end });
  return dates.map(date => format(date, 'yyyy-MM-dd'));
}

/**
 * Get device events within a time range
 * Queries all date nodes in range, merges results, filters by exact timestamp, and sorts newest first
 *
 * @param startTime - Start timestamp (Unix ms)
 * @param endTime - End timestamp (Unix ms)
 * @returns Array of device events sorted newest first
 */
export async function getDeviceEvents(startTime: number, endTime: number): Promise<DeviceEvent[]> {
  const startDate = format(new Date(startTime), 'yyyy-MM-dd');
  const endDate = format(new Date(endTime), 'yyyy-MM-dd');

  const dateRange = generateDateRange(startDate, endDate);
  const basePath = getEnvironmentPath('fritzbox/device_events');

  // Query all date nodes in parallel
  const dateQueries = dateRange.map(async (date) => {
    const path = `${basePath}/${date}`;
    const data = await adminDbGet(path);
    return data;
  });

  const results = await Promise.all(dateQueries);

  // Merge all events from all date nodes
  const allEvents: DeviceEvent[] = [];

  for (const dateData of results) {
    if (!dateData || typeof dateData !== 'object') {
      continue;
    }

    const events = Object.values(dateData) as DeviceEvent[];
    allEvents.push(...events);
  }

  // Filter events within exact timestamp range
  const filteredEvents = allEvents.filter(
    event => event.timestamp >= startTime && event.timestamp <= endTime
  );

  // Sort newest first
  filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

  return filteredEvents;
}

/**
 * Get current device states from Firebase
 * Returns Map keyed by MAC address
 *
 * @returns Map of device MAC to state
 */
export async function getDeviceStates(): Promise<Map<string, DeviceState>> {
  const path = getEnvironmentPath('fritzbox/device_states');
  const data = await adminDbGet(path);

  if (!data || typeof data !== 'object') {
    return new Map();
  }

  const states = new Map<string, DeviceState>();
  const statesObj = data as Record<string, DeviceState>;

  for (const [mac, state] of Object.entries(statesObj)) {
    states.set(mac, state);
  }

  return states;
}

/**
 * Update device states in Firebase
 * Converts Map to plain object for Firebase storage
 *
 * @param states - Map of device MAC to state
 */
export async function updateDeviceStates(states: Map<string, DeviceState>): Promise<void> {
  const path = getEnvironmentPath('fritzbox/device_states');

  // Convert Map to plain object
  const statesObj: Record<string, DeviceState> = {};
  for (const [mac, state] of states.entries()) {
    statesObj[mac] = state;
  }

  await adminDbSet(path, statesObj);
}
