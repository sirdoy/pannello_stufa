/**
 * Philips Hue v2 API Type Definitions
 *
 * Complete type definitions for Hue Bridge API v2 (CLIP API)
 * Based on: https://developers.meethue.com/develop/hue-api-v2/
 *
 * These types cover all properties accessed in the codebase.
 */

/** Hue Light (v2 API) */
export interface HueLight {
  id: string;
  id_v1?: string;
  owner: {
    rid: string;
    rtype: string;
  };
  metadata: {
    name: string;
    archetype?: string;
    fixed_mired?: number;
  };
  on?: {
    on: boolean;
  };
  dimming?: {
    brightness: number;
    min_dim_level?: number;
  };
  color_temperature?: {
    mirek: number;
    mirek_valid: boolean;
    mirek_schema?: {
      mirek_minimum: number;
      mirek_maximum: number;
    };
  };
  color?: {
    xy: {
      x: number;
      y: number;
    };
    gamut?: {
      red: { x: number; y: number };
      green: { x: number; y: number };
      blue: { x: number; y: number };
    };
    gamut_type?: string;
  } | null;
  dynamics?: {
    status: string;
    status_values: string[];
    speed: number;
    speed_valid: boolean;
  };
  alert?: {
    action_values: string[];
  };
  signaling?: {
    signal_values?: string[];
    status?: {
      signal?: string;
      estimated_end?: string;
    };
  };
  mode?: string;
  gradient?: {
    points: Array<{
      color: {
        xy: { x: number; y: number };
      };
    }>;
    points_capable?: number;
    mode?: string;
    mode_values?: string[];
    pixel_count?: number;
  };
  effects?: {
    effect_values?: string[];
    status?: string;
    status_values?: string[];
  };
  timed_effects?: {
    effect?: string;
    duration?: number;
    status_values?: string[];
  };
  powerup?: {
    preset?: string;
    configured?: boolean;
    on?: {
      mode?: string;
      on?: {
        on: boolean;
      };
    };
    dimming?: {
      mode?: string;
      dimming?: {
        brightness: number;
      };
    };
    color?: {
      mode?: string;
      color_temperature?: {
        mirek: number;
      };
    };
  };
  type: string;
}

/** Hue Room / Zone / Grouped Light (v2 API) */
export interface HueRoom {
  id: string;
  id_v1?: string;
  metadata: {
    name: string;
    archetype?: string;
  };
  services?: Array<{
    rid: string;
    rtype: string;
  }>;
  children?: Array<{
    rid: string;
    rtype: string;
  }>;
  grouped_services?: Array<{
    rid: string;
    rtype: string;
  }>;
  type: string;
}

/** Hue Grouped Light (v2 API) */
export interface HueGroupedLight {
  id: string;
  id_v1?: string;
  owner: {
    rid: string;
    rtype: string;
  };
  on?: {
    on: boolean;
  };
  dimming?: {
    brightness: number;
  };
  alert?: {
    action_values: string[];
  };
  signaling?: {
    signal_values?: string[];
  };
  type: string;
}

/** Hue Scene (v2 API) */
export interface HueScene {
  id: string;
  id_v1?: string;
  metadata: {
    name: string;
    image?: {
      rid: string;
      rtype: string;
    };
    appdata?: string;
  };
  group: {
    rid: string;
    rtype: string;
  };
  actions?: Array<{
    target: {
      rid: string;
      rtype: string;
    };
    action: {
      on?: {
        on: boolean;
      };
      dimming?: {
        brightness: number;
      };
      color?: {
        xy: {
          x: number;
          y: number;
        };
      };
      color_temperature?: {
        mirek: number;
      };
      gradient?: {
        points: Array<{
          color: {
            xy: { x: number; y: number };
          };
        }>;
      };
      effects?: {
        effect: string;
      };
      dynamics?: {
        duration: number;
      };
    };
  }>;
  palette?: {
    color: Array<{
      color: {
        xy: { x: number; y: number };
      };
      dimming: {
        brightness: number;
      };
    }>;
    dimming: Array<{
      brightness: number;
    }>;
    color_temperature: Array<{
      color_temperature: {
        mirek: number;
      };
    }>;
  };
  speed?: number;
  auto_dynamic?: boolean;
  type: string;
  status?: {
    active: string;
  };
}

/** Hue Bridge (v2 API) */
export interface HueBridge {
  id: string;
  bridge_id?: string;
  internalipaddress?: string;
  ipaddress: string;
  port?: number;
  modelid?: string;
  swversion?: string;
  time_zone?: {
    time_zone: string;
  };
  type?: string;
}

/** Hue Bridge Config (v1 API) */
export interface HueBridgeConfig {
  name: string;
  zigbeechannel?: number;
  bridgeid: string;
  mac: string;
  dhcp: boolean;
  ipaddress: string;
  netmask: string;
  gateway: string;
  proxyaddress?: string;
  proxyport?: number;
  UTC: string;
  localtime: string;
  timezone: string;
  modelid: string;
  datastoreversion?: string;
  swversion: string;
  apiversion: string;
  swupdate?: {
    updatestate: number;
    checkforupdate: boolean;
    devicetypes: {
      bridge: boolean;
      lights: string[];
      sensors: string[];
    };
    url: string;
    text: string;
    notify: boolean;
  };
  linkbutton: boolean;
  portalservices?: boolean;
  portalconnection?: string;
  portalstate?: {
    signedon: boolean;
    incoming: boolean;
    outgoing: boolean;
    communication: string;
  };
  factorynew?: boolean;
  replacesbridgeid?: string;
  backup?: {
    status: string;
    errorcode: number;
  };
  starterkitid?: string;
  whitelist?: Record<
    string,
    {
      'last use date': string;
      'create date': string;
      name: string;
    }
  >;
}

/** Hue Entertainment Configuration */
export interface HueEntertainment {
  id: string;
  metadata?: {
    name: string;
  };
  name?: string;
  class_name?: string;
  status?: string;
  active_streamer?: {
    rid: string;
    rtype: string;
  };
  stream_proxy?: {
    mode: string;
    node: {
      rid: string;
      rtype: string;
    };
  };
  channels?: Array<{
    channel_id: number;
    position: {
      x: number;
      y: number;
      z: number;
    };
    members: Array<{
      service: {
        rid: string;
        rtype: string;
      };
      index: number;
    }>;
  }>;
  locations?: {
    service_locations: Array<{
      service: {
        rid: string;
        rtype: string;
      };
      position: {
        x: number;
        y: number;
        z: number;
      };
      positions?: Array<{
        x: number;
        y: number;
        z: number;
      }>;
    }>;
  };
  light_services?: Array<{
    rid: string;
    rtype: string;
  }>;
  type: string;
}

/** Hue Button / Device (v2 API) */
export interface HueButton {
  id: string;
  id_v1?: string;
  owner?: {
    rid: string;
    rtype: string;
  };
  metadata?: {
    control_id: number;
  };
  button?: {
    button_report?: {
      updated: string;
      event: string;
    };
    repeat_interval?: number;
    event_values?: string[];
  };
  type: string;
}

/** Hue Motion Sensor (v2 API) */
export interface HueMotion {
  id: string;
  id_v1?: string;
  owner?: {
    rid: string;
    rtype: string;
  };
  enabled?: boolean;
  motion?: {
    motion: boolean;
    motion_valid: boolean;
    motion_report?: {
      changed: string;
      motion: boolean;
    };
  };
  sensitivity?: {
    status?: string;
    sensitivity?: number;
    sensitivity_max?: number;
  };
  type: string;
}
