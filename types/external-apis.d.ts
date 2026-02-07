/**
 * External API Type Augmentations
 *
 * These types extend interfaces for external APIs (Hue, Netatmo, Camera)
 * that don't have complete TypeScript definitions.
 *
 * Following Phase 40-07 pragmatic typing pattern.
 */

// Hue v2 API additional properties not in base definitions
declare global {
  interface HueLight {
    owner?: { rid: string; rtype: string };
    metadata?: { name: string; archetype?: string };
    dimming?: { brightness: number };
  }

  interface HueRoom {
    services?: Array<{ rid: string; rtype: string }>;
    metadata?: { name: string; archetype?: string };
  }

  interface HueScene {
    group?: { rid: string; rtype: string };
    metadata?: { name: string };
  }

  interface HueBridge {
    internalipaddress?: string;
  }
}

export {};
