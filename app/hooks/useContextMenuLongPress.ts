'use client';

import { useLongPress as useLibLongPress, LongPressEventType, LongPressCallback } from 'use-long-press';
import { useCallback, useState } from 'react';
import { vibrateShort } from '@/lib/pwa/vibration';

/** useContextMenuLongPress options */
export interface UseContextMenuLongPressOptions {
  /** Time in ms before triggering (default: 500) */
  threshold?: number;
  /** Enable haptic feedback (default: true) */
  haptic?: boolean;
  /** Cancel if finger moves (default: true) */
  cancelOnMovement?: boolean;
}

/** useContextMenuLongPress return type */
export interface UseContextMenuLongPressReturn {
  bind: () => ReturnType<typeof useLibLongPress>;
  isPressed: boolean;
}

/**
 * useContextMenuLongPress Hook - Ember Noir Design System
 *
 * Provides long-press detection for context menu triggers on mobile.
 * Uses 500ms threshold (platform convention) with scale animation feedback.
 *
 * Different from useLongPress hook which is for continuous value adjustment.
 * This hook triggers ONCE after the threshold, ideal for context menus.
 *
 * @param onLongPress - Callback when long-press threshold is reached
 * @param options - Configuration options
 * @returns Event handlers and pressed state for animations
 *
 * @example
 * const { bind, isPressed } = useContextMenuLongPress(() => {
 *   openContextMenu();
 * });
 *
 * return (
 *   <div
 *     {...bind()}
 *     style={{
 *       transform: isPressed ? 'scale(0.95)' : 'scale(1)',
 *       transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
 *       WebkitUserSelect: 'none',
 *       userSelect: 'none',
 *       WebkitTouchCallout: 'none',
 *     }}
 *   >
 *     Content
 *   </div>
 * );
 */
export function useContextMenuLongPress(
  onLongPress: LongPressCallback,
  options: UseContextMenuLongPressOptions = {}
): UseContextMenuLongPressReturn {
  const { threshold = 500, haptic = true, cancelOnMovement = true } = options;
  const [isPressed, setIsPressed] = useState<boolean>(false);

  // Wrap callback to include haptic feedback
  const handleLongPress = useCallback(
    (event, meta) => {
      if (haptic) {
        vibrateShort();
      }
      setIsPressed(false);
      onLongPress?.(event, meta);
    },
    [haptic, onLongPress]
  );

  const bind = useLibLongPress(handleLongPress, {
    threshold,
    cancelOnMovement,
    // Track press state for scale animation
    onStart: () => setIsPressed(true),
    onFinish: () => setIsPressed(false),
    onCancel: () => setIsPressed(false),
    // Detect which event type triggered
    detect: LongPressEventType.Both,
  });

  return {
    bind,
    isPressed,
  };
}

/**
 * CSS properties to apply to elements with long-press to prevent iOS text selection
 *
 * @example
 * <div style={longPressPreventSelection}>Content</div>
 */
export const longPressPreventSelection: React.CSSProperties = {
  WebkitUserSelect: 'none' as const,
  userSelect: 'none' as const,
  WebkitTouchCallout: 'none' as const,
};

export default useContextMenuLongPress;
