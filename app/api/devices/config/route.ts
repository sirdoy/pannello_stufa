/**
 * Unified Device Config API
 *
 * Single endpoint for device configuration:
 * GET: Fetch unified device config (with on-demand migration)
 * POST: Update unified device config
 *
 * Firebase Path: users/{userId}/deviceConfig
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
} from '@/lib/core';
import {
  getUnifiedDeviceConfigAdmin,
  saveUnifiedDeviceConfigAdmin,
  getAllDevicesForSettings,
  getEnabledDevicesFromConfig,
} from '@/lib/services/unifiedDeviceConfigService';
import { DEFAULT_DEVICE_ORDER } from '@/lib/devices/deviceTypes';

interface DeviceConfigEntry {
  id: string;
  visible: boolean;
  order: number;
}

interface UpdateDeviceConfigBody {
  devices: DeviceConfigEntry[];
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/devices/config
 * Fetch unified device config for current user
 * Includes on-demand migration from old data structures
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  // Get config with automatic migration if needed
  const config = await getUnifiedDeviceConfigAdmin(userId);

  // Return full config plus enriched device list for UI
  return success({
    config,
    devices: getAllDevicesForSettings(config),
    enabledDevices: getEnabledDevicesFromConfig(config),
  });
}, 'Devices/GetConfig');

/**
 * POST /api/devices/config
 * Update unified device config for current user
 *
 * Body: {
 *   devices: [
 *     { id: 'stove', visible: true, order: 0 },
 *     ...
 *   ]
 * }
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = (await parseJsonOrThrow(request)) as UpdateDeviceConfigBody;
  const { devices } = body;

  // Validate devices array
  if (!devices || !Array.isArray(devices)) {
    return badRequest('devices must be an array');
  }

  // Validate each device entry
  const validIds = new Set(DEFAULT_DEVICE_ORDER);
  const seenIds = new Set<string>();

  for (const device of devices) {
    // Check required fields
    if (!device.id || typeof device.id !== 'string') {
      return badRequest('Each device must have a string id');
    }

    // Check valid device ID
    if (!validIds.has(device.id)) {
      return badRequest(`Invalid device id: ${device.id}`);
    }

    // Check for duplicates
    if (seenIds.has(device.id)) {
      return badRequest(`Duplicate device id: ${device.id}`);
    }
    seenIds.add(device.id);

    // Validate fields
    if (typeof device.visible !== 'boolean') {
      return badRequest(`Device ${device.id}: visible must be a boolean`);
    }
    if (typeof device.order !== 'number') {
      return badRequest(`Device ${device.id}: order must be a number`);
    }
  }

  // Ensure all devices are present
  for (const id of DEFAULT_DEVICE_ORDER) {
    if (!seenIds.has(id)) {
      return badRequest(`Missing device: ${id}`);
    }
  }

  // Save config
  const config = { devices };
  await saveUnifiedDeviceConfigAdmin(userId, config);

  return success({
    message: 'Configurazione aggiornata con successo',
    config: {
      ...config,
      version: 3,
    },
  });
}, 'Devices/UpdateConfig');
