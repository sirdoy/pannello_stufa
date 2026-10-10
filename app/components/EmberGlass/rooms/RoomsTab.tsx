'use client';
/**
 * RoomsTab — orchestrator of the /stanze route (ROADMAP M84).
 *
 * Rooms and their devices are the ones stored on the Pi (`useHouseStatus`); the provider hooks
 * give the live state of each device. One RoomCard per room, one shared RoomSheet.
 *
 * RC-clean: no manual memo hooks, React Compiler auto-memoizes.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2 } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useDirigeraFullData } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import { useCameraData } from '@/app/components/devices/camera/hooks/useCameraData';
import Banner from '@/app/components/ui/Banner';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';
import Skeleton from '@/app/components/ui/Skeleton';
import { roomConfig } from './lib/rooms-config';
import { buildRoomDevices } from './lib/buildRoomDevices';
import { useHouseStatus } from './useHouseStatus';
import { RoomCard } from './RoomCard';
import { RoomSheet } from './RoomSheet';
import { PageHeader } from '../PageHeader';
import type { LiveState } from './types';

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 } as const;

export function RoomsTab() {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const house = useHouseStatus();
  const { user } = useUser();
  const stove = useStoveData({ userId: user?.sub });
  const thermostat = useThermostatData();
  const lights = useLightsData();
  const tuya = useTuyaData();
  const sonos = useSonosFullData();
  const dirigera = useDirigeraFullData('all');
  const cameras = useCameraData();

  const live: LiveState = {
    // Before the first reading the stove status is unknown, not "off"
    stove:
      stove.initialLoading && !stove.unreachable
        ? null
        : {
            on: stove.isAccesa,
            powerLevel: stove.powerLevel,
            fanLevel: stove.fanLevel,
            unreachable: stove.unreachable,
          },
    thermostat: { topology: thermostat.topology, status: thermostat.status },
    lights: lights.loading ? null : lights.lights,
    plugs: tuya.plugs,
    sonos: sonos.data,
    sensors: dirigera.data?.sensors ?? null,
    cameras: cameras.loading ? null : cameras.cameras,
  };

  const rooms = (house.rooms ?? []).map((r, i) => ({
    config: roomConfig(r.room_id, r.room_name, i),
    devices: buildRoomDevices(r.devices, live),
  }));
  const selected = rooms.find((r) => r.config.id === selectedRoomId) ?? null;
  const eyebrow = house.rooms ? `${rooms.length} ${rooms.length === 1 ? 'stanza' : 'stanze'}` : undefined;

  return (
    <>
      <div>
        <PageHeader
          title="Stanze"
          eyebrow={eyebrow}
          actions={
            <Button
              variant="subtle"
              size="sm"
              aria-label="Gestisci stanze"
              data-testid="stanze-manage"
              onClick={() => router.push('/rooms')}
            >
              <Settings2 size={16} />
            </Button>
          }
        />

        {house.loading && !house.rooms ? (
          <div style={gridStyle} data-testid="stanze-loading">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-3xl" />
            ))}
          </div>
        ) : null}

        {!house.loading && house.error ? (
          <Banner
            variant="error"
            title={house.error}
            description="Il Pi non ha risposto. Riprova tra poco."
            actions={
              <Button variant="subtle" size="sm" onClick={() => void house.refetch()}>
                Riprova
              </Button>
            }
          />
        ) : null}

        {house.rooms && rooms.length === 0 ? (
          <EmptyState
            title="Nessuna stanza"
            description="Crea le stanze della casa e assegna i dispositivi."
            action={
              <Button variant="ember" size="sm" onClick={() => router.push('/rooms')}>
                Gestisci stanze
              </Button>
            }
          />
        ) : null}

        {rooms.length > 0 ? (
          <div style={gridStyle}>
            {rooms.map((r) => (
              <RoomCard
                key={r.config.id}
                room={r.config}
                devices={r.devices}
                onOpen={() => setSelectedRoomId(r.config.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Single shared RoomSheet: the key remounts it when the room changes */}
      <RoomSheet
        key={selectedRoomId ?? 'closed'}
        open={selected !== null}
        onClose={() => setSelectedRoomId(null)}
        room={selected?.config ?? null}
        devices={selected?.devices ?? []}
      />
    </>
  );
}
