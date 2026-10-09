import { createElement } from 'react';
import { Flame, Moon, Send, Zap, type LucideIcon, type LucideProps } from 'lucide-react';

/** Endpoint of a command queued while offline (lib/pwa/backgroundSync.ts) → icon */
const COMMAND_ICONS: Record<string, LucideIcon> = {
  'stove/ignite': Flame,
  'stove/shutdown': Moon,
  'stove/set-power': Zap,
};

export interface QueuedCommandIconProps extends LucideProps {
  endpoint: string;
}

/** QueuedCommandIcon — the icon of an offline-queued command, picked from its endpoint (workspace ROADMAP M76). */
export default function QueuedCommandIcon({ endpoint, size = 16, ...props }: QueuedCommandIconProps) {
  return createElement(COMMAND_ICONS[endpoint] ?? Send, { size, 'aria-hidden': true, ...props });
}
