/**
 * Rooms Proxy Client
 *
 * Thin wrapper around the shared HA proxy client.
 * No response transformation — all endpoints return data directly as-is.
 * Auth is handled by haGet/haPost/haPut/haDelete via X-API-Key header.
 *
 * Endpoints:
 *   /api/v1/rooms/                              - GET list, POST create
 *   /api/v1/rooms/{room_id}                     - GET single, PUT update, DELETE
 *   /api/v1/rooms/{room_id}/devices             - GET list, POST assign
 *   /api/v1/rooms/{room_id}/devices/{device_id} - DELETE remove
 *   /api/v1/rooms/{room_id}/status              - GET room status
 *   /api/v1/rooms/health                        - GET health stats
 *   /api/v1/rooms/house/status                  - GET house status
 */

import { haGet, haPost, haPut, haDelete } from '@/lib/haClient';
import type {
  Room,
  RoomCreate,
  RoomUpdate,
  DeviceAssignment,
  RoomsHealthResponse,
  RoomStatusResponse,
  HouseStatusResponse,
} from '@/types/rooms';
import type { RegistryDevice } from '@/types/registry';

/** Get all rooms */
async function getRooms(): Promise<Room[]> {
  return haGet<Room[]>('/api/v1/rooms/');
}

/** Create a new room */
async function createRoom(body: RoomCreate): Promise<Room> {
  return haPost<Room>('/api/v1/rooms/', body as unknown as Record<string, unknown>);
}

/** Get a single room by ID */
async function getRoom(roomId: number): Promise<Room> {
  return haGet<Room>(`/api/v1/rooms/${roomId}`);
}

/** Update a room's name and description */
async function updateRoom(roomId: number, body: RoomUpdate): Promise<Room> {
  return haPut<Room>(`/api/v1/rooms/${roomId}`, body as unknown as Record<string, unknown>);
}

/** Delete a room */
async function deleteRoom(roomId: number): Promise<void> {
  return haDelete(`/api/v1/rooms/${roomId}`);
}

/** Get devices assigned to a room */
async function getRoomDevices(roomId: number): Promise<RegistryDevice[]> {
  return haGet<RegistryDevice[]>(`/api/v1/rooms/${roomId}/devices`);
}

/** Assign a device to a room (moves from previous room if already assigned) */
async function assignDevice(roomId: number, body: { device_registry_id: number }): Promise<DeviceAssignment> {
  return haPost<DeviceAssignment>(`/api/v1/rooms/${roomId}/devices`, body as unknown as Record<string, unknown>);
}

/** Remove a device from a room */
async function removeDevice(roomId: number, deviceRegistryId: number): Promise<void> {
  return haDelete(`/api/v1/rooms/${roomId}/devices/${deviceRegistryId}`);
}

/** Get rooms health stats (room count, device count, orphans) */
async function getHealth(): Promise<RoomsHealthResponse> {
  return haGet<RoomsHealthResponse>('/api/v1/rooms/health');
}

/** Get whole-house status (all rooms with device statuses) */
async function getHouseStatus(): Promise<HouseStatusResponse> {
  return haGet<HouseStatusResponse>('/api/v1/rooms/house/status');
}

/** Get status for a single room's devices */
async function getRoomStatus(roomId: number): Promise<RoomStatusResponse> {
  return haGet<RoomStatusResponse>(`/api/v1/rooms/${roomId}/status`);
}

/** Rooms proxy client */
export const roomsProxy = {
  getRooms,
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomDevices,
  assignDevice,
  removeDevice,
  getHealth,
  getHouseStatus,
  getRoomStatus,
};
