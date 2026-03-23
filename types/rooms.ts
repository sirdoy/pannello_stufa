/**
 * Rooms API type definitions.
 * Source: docs/api/rooms.md
 */

export interface Room {
  id: number;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
  device_count?: number;
}

export interface RoomCreate {
  name: string;
  description?: string | null;
}

export interface RoomUpdate {
  name: string;
  description?: string | null;
}

export interface DeviceAssignment {
  device_registry_id: number;
  room_id: number;
  previous_room_id: number | null;
  assigned_at: number;
}

export interface RoomsHealthResponse {
  room_count: number;
  total_device_count: number;
  orphan_device_count: number;
}

export interface LightStatus {
  status: 'available';
  on: boolean;
  brightness: number | null;
  reachable: boolean;
}

export interface SensorStatus {
  status: 'available';
  temperature: number | null;
  humidity: number | null;
  battery_percentage: number | null;
  is_reachable: boolean;
}

export interface ThermostatStatus {
  status: 'available';
  setpoint_temp: number | null;
  measured_temp: number | null;
  heating: boolean | null;
}

export interface SpeakerStatus {
  status: 'available';
  playing: boolean;
  volume: number | null;
  group_name: string | null;
}

export interface StoveStatus {
  status: 'available';
  active: boolean;
  temperature: number | null;
  power_level: number | null;
}

export interface CameraStatus {
  status: 'available';
  vpn_url: string | null;
  is_reachable: boolean;
}

export interface DeviceStatus {
  device_registry_id: number;
  custom_name: string;
  provider_name: string;
  device_type: string;
  status: 'available' | 'unavailable';
  data: LightStatus | SensorStatus | ThermostatStatus | SpeakerStatus | StoveStatus | CameraStatus | null;
}

export interface RoomStatusResponse {
  room_id: number;
  room_name: string;
  devices: DeviceStatus[];
  device_count: number;
  available_count: number;
  unavailable_count: number;
}

export interface HouseStatusResponse {
  rooms: RoomStatusResponse[];
  total_devices: number;
  total_available: number;
  total_unavailable: number;
}
