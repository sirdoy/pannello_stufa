'use client';
/**
 * CameraBody — state of a Netatmo camera (ROADMAP M84): power and SD card, with the way to the
 * camera page, where the live view and the events are.
 */

import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import { StatChip } from '../primitives/StatChip';
import type { RoomDevice } from '../types';

function onOff(v: unknown): string {
  return v === 'on' ? 'Ok' : v === 'off' ? 'Assente' : '—';
}

export function CameraBody({ device }: { device: RoomDevice }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        <StatChip label="Alimentazione" value={onOff(device.extra['power'])} />
        <StatChip label="Scheda SD" value={onOff(device.extra['sd'])} />
      </div>
      <Button variant="subtle" size="sm" fullWidth onClick={() => router.push('/camera')}>
        Apri telecamera
      </Button>
    </div>
  );
}
