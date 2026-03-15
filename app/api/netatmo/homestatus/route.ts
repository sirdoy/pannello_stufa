import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { getProxyHomestatus } from '@/lib/netatmoProxy';
import type { DataFreshness } from '@/types/netatmoProxy';

// Battery classification utilities (pure functions, previously in netatmoApi)
function getModulesWithLowBattery(modules: any[]): any[] {
  return modules.filter(m => m.battery_state === 'low' || m.battery_state === 'very_low');
}
function hasAnyCriticalBattery(modules: any[]): boolean {
  return modules.some(m => m.battery_state === 'very_low');
}
function hasAnyLowBattery(modules: any[]): boolean {
  return modules.some(m => m.battery_state === 'low' || m.battery_state === 'very_low');
}

export const dynamic = 'force-dynamic';

interface StoveSyncData {
  enabled?: boolean;
  stoveMode?: string;
  stoveTemperature?: number;
  rooms?: Array<{ id: string }>;
  livingRoomId?: string;
}

interface Topology {
  rooms?: Array<{ id: string; name: string; type: string }>;
  modules?: Array<{ [key: string]: unknown }>;
}

interface EnrichedRoom {
  room_id: string;
  room_name: string;
  room_type: string;
  temperature?: number;
  setpoint?: number;
  mode?: string;
  heating?: boolean;
  endtime?: number;
  stoveSync?: boolean;
  stoveSyncSetpoint?: number;
}

interface ModuleWithStatus {
  [key: string]: unknown;
}

/**
 * GET /api/netatmo/homestatus
 * Retrieves real-time status of all rooms and modules via the Netatmo proxy.
 * Returns temperatures, setpoints, heating status, and module battery info.
 * Protected: Requires Auth0 authentication
 *
 * Migrated from direct Netatmo Cloud API to local proxy (Plan 75-02).
 * No longer requires OAuth tokens — proxy handles token lifecycle.
 */
export const GET = withAuthAndErrorHandler(async () => {
  // Fetch current room data from proxy
  const proxyResponse = await getProxyHomestatus();

  // Get topology from Firebase for room_type and module info
  const topologyPath = getEnvironmentPath('netatmo/topology');
  const topology = await adminDbGet(topologyPath) as Topology | null;

  // Get stove sync status for living room indicator
  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  const stoveSyncData = await adminDbGet(stoveSyncPath) as StoveSyncData | null;

  // Build synced room IDs list (multi-room + legacy single-room formats)
  const syncedRoomIds = stoveSyncData?.rooms?.map(r => r.id) ?? [];
  if (stoveSyncData?.livingRoomId && !syncedRoomIds.includes(stoveSyncData.livingRoomId)) {
    syncedRoomIds.push(stoveSyncData.livingRoomId);
  }

  // Map proxy rooms to EnrichedRoom format
  const enrichedRooms: EnrichedRoom[] = proxyResponse.rooms.map(proxyRoom => {
    // Lookup topology for room_type (proxy provides room_name directly)
    const topoRoom = topology?.rooms?.find(r => r.id === proxyRoom.room_id);

    const enriched: EnrichedRoom = {
      room_id: proxyRoom.room_id,
      room_name: proxyRoom.room_name ?? 'Sconosciuta',
      room_type: topoRoom?.type ?? 'unknown',
    };

    // Only include defined values (filter undefined for Firebase compatibility)
    if (proxyRoom.temperature !== null && proxyRoom.temperature !== undefined) {
      enriched.temperature = proxyRoom.temperature;
    }

    // Map proxy field name to frontend contract field name
    if (proxyRoom.therm_setpoint_temperature !== null && proxyRoom.therm_setpoint_temperature !== undefined) {
      enriched.setpoint = proxyRoom.therm_setpoint_temperature;
    }

    // Map heating_power_request > 0 to boolean heating flag
    enriched.heating = (proxyRoom.heating_power_request ?? 0) > 0;

    // Note: proxy does not provide per-room mode or endtime
    // These come from therm_mode at home level — omitted here pending Phase 76

    // StoveSync enrichment for synced rooms
    if (stoveSyncData?.enabled && stoveSyncData?.stoveMode && syncedRoomIds.includes(proxyRoom.room_id)) {
      enriched.stoveSync = true;
      enriched.stoveSyncSetpoint = stoveSyncData.stoveTemperature ?? 16;
    }

    return enriched;
  });

  // Get modules from Firebase topology (proxy homestatus does not include modules)
  const modulesFromTopology = (topology?.modules ?? []) as ModuleWithStatus[];

  // Battery classification using inlined pure utility functions
  const lowBatteryModules = getModulesWithLowBattery(modulesFromTopology as any);
  const hasCriticalBattery = hasAnyCriticalBattery(modulesFromTopology as any);
  const hasLowBattery = hasAnyLowBattery(modulesFromTopology as any);

  // Save current status to Firebase (same path as before)
  const statusToSave: Record<string, unknown> = {
    rooms: enrichedRooms,
    modules: modulesFromTopology,
    updated_at: Date.now(),
    hasLowBattery,
    hasCriticalBattery,
  };

  const currentStatusPath = getEnvironmentPath('netatmo/currentStatus');
  await adminDbSet(currentStatusPath, statusToSave);

  // Return response matching existing frontend contract + data_freshness
  const response: Record<string, unknown> = {
    rooms: enrichedRooms,
    modules: modulesFromTopology,
    lowBatteryModules,
    hasLowBattery,
    hasCriticalBattery,
    updated_at: Date.now(),
    data_freshness: proxyResponse.data_freshness as DataFreshness,
  };

  return success(response);
}, 'Netatmo/HomeStatus');
