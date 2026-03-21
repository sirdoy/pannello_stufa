'use client';

import { Button, Divider, Text } from '../../../ui';
import type { HueScene } from '@/types/hueProxy';

/**
 * LightsScenes - Horizontal-scroll scene grid
 *
 * Displays room scenes in a horizontally scrollable grid:
 * - Snap-to-item scrolling (snap-x snap-mandatory)
 * - Scene buttons with icon and name
 * - Scroll indicator text if >3 scenes
 *
 * Follows Phase 58 orchestrator pattern: purely presentational (no state management)
 */

export interface LightsScenesProps {
  roomScenes: HueScene[];
  refreshing: boolean;
  onSceneActivate: (sceneId: string, groupId: string) => void;
}

export default function LightsScenes({
  roomScenes,
  refreshing,
  onSceneActivate,
}: LightsScenesProps) {
  if (roomScenes.length === 0) {
    return null;
  }

  return (
    <>
      <Divider label="Scene" variant="gradient" spacing="large" />

      {/* Scrollable container */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {roomScenes.map((scene) => (
            <Button
              key={scene.scene_id}
              variant="subtle"
              onClick={() => onSceneActivate(scene.scene_id, scene.group_id)}
              disabled={refreshing}
              aria-label={`Attiva scena ${scene.name}`}
              className="flex-shrink-0 w-32 sm:w-36 !p-4 flex-col !h-auto snap-start"
            >
              <span className="text-3xl mb-2" aria-hidden="true">🎨</span>
              <span className="text-xs font-semibold truncate w-full text-center">
                {scene.name}
              </span>
            </Button>
          ))}
        </div>

        {/* Scroll indicator */}
        {roomScenes.length > 3 && (
          <div className="text-center mt-2">
            <Text variant="tertiary" size="xs">
              ← Scorri per vedere tutte le {roomScenes.length} scene →
            </Text>
          </div>
        )}
      </div>
    </>
  );
}
