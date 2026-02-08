/**
 * Netatmo Security Camera API Type Definitions
 *
 * Complete type definitions for Netatmo Security (Welcome, Presence) APIs
 * Based on: https://dev.netatmo.com/apidocumentation/security
 *
 * These types cover all properties accessed in the codebase.
 */

/** Camera from Netatmo Security API */
export interface Camera {
  id: string;
  name: string;
  type: string;
  status: string;
  sd_status?: string;
  alim_status?: string;
  is_local?: boolean;
  vpn_url?: string;
  local_url?: string;
  light_mode_status?: string;
  use_pin_code?: boolean;
  last_setup?: number;
  modules?: CameraModule[];
}

/** Camera Module (Indoor/Outdoor sirens, tags, etc) */
export interface CameraModule {
  id: string;
  name?: string;
  type: string;
  status?: string;
  battery_percent?: number;
  rf_strength?: number;
  last_setup?: number;
  last_activity?: number;
}

/** Camera Event from Netatmo Security API */
export interface CameraEvent {
  id: string;
  type: string;
  time: number;
  camera_id: string;
  device_id?: string;
  home_id?: string;
  home_name?: string;
  message?: string;
  sub_type?: number;
  category?: string;
  person_id?: string;
  is_arrival?: boolean;
  snapshot?: CameraSnapshot;
  vignette?: CameraSnapshot;
  video_id?: string;
  video_status?: string;
  event_list?: Array<{
    type: string;
    time: number;
    offset?: number;
    id?: string;
    message?: string;
    snapshot?: CameraSnapshot;
  }>;
}

/** Camera Snapshot or Vignette */
export interface CameraSnapshot {
  id: string;
  version?: number;
  key: string;
  url?: string;
  filename?: string;
}

/** Camera Person (face recognition) */
export interface CameraPerson {
  id: string;
  pseudo?: string;
  last_seen?: number;
  out_of_sight?: boolean;
  face?: {
    id: string;
    version?: number;
    key: string;
    url?: string;
  };
}

/** Camera Home (Security API) */
export interface CameraHome {
  id: string;
  name: string;
  place?: {
    city?: string;
    country?: string;
    timezone?: string;
  };
  cameras?: Camera[];
  persons?: CameraPerson[];
  events?: CameraEvent[];
  smoke_detectors?: Array<{
    id: string;
    type: string;
    last_setup?: number;
    name?: string;
  }>;
}

/** Camera Live Stream */
export interface CameraLiveStream {
  local_url?: string;
  vpn_url?: string;
}

/** Parsed Camera (cleaned for Firebase) */
export interface ParsedCamera {
  id: string;
  name: string;
  type: string;
  status: string;
  is_local: boolean;
  home_id: string;
  home_name: string;
  vpn_url?: string;
  local_url?: string;
  sd_status?: string;
  alim_status?: string;
  light_mode_status?: string;
}

/** Parsed Person (cleaned for Firebase) */
export interface ParsedPerson {
  id: string;
  name: string;
  out_of_sight: boolean;
  last_seen?: number;
  face?: {
    id: string;
    key: string;
  };
}

/** Camera Settings */
export interface CameraSettings {
  alim_status?: string;
  sd_status?: string;
  light_mode_status?: string;
  use_pin_code?: boolean;
}

/** Camera Events Query Response */
export interface CameraEventsResponse {
  home: {
    id: string;
    name: string;
    events: CameraEvent[];
  };
}
