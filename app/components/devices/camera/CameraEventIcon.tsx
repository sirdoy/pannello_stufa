import { createElement } from 'react';
import { Camera, Car, PawPrint, PersonStanding, Trees, User, type LucideIcon, type LucideProps } from 'lucide-react';

const EVENT_ICONS: Record<string, LucideIcon> = {
  person: User,
  human: PersonStanding,
  animal: PawPrint,
  vehicle: Car,
  movement: Camera,
  outdoor: Trees,
};

export interface CameraEventIconProps extends LucideProps {
  /** Netatmo camera event type (`person`, `animal`, `vehicle`, …) */
  type: string;
}

/** Icon of a Netatmo camera event, picked from its type (workspace ROADMAP M76). */
export default function CameraEventIcon({ type, size = 20, ...props }: CameraEventIconProps) {
  return createElement(EVENT_ICONS[type] ?? Camera, { size, 'aria-hidden': true, ...props });
}
