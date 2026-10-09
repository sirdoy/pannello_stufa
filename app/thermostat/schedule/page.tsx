'use client';
import { Suspense, useState } from 'react';
import { Card, Heading, Text, Button, Skeleton } from '@/app/components/ui';
import { useScheduleData } from '@/lib/hooks/useScheduleData';
import { useRoomStatus } from '@/lib/hooks/useRoomStatus';
import ScheduleSelector from './components/ScheduleSelector';
import WeeklyTimeline from './components/WeeklyTimeline';
import ManualOverrideSheet from './components/ManualOverrideSheet';
import ActiveOverrideBadge from './components/ActiveOverrideBadge';
import { RefreshCw, Flame } from 'lucide-react';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

interface Room {
  id: string;
  name: string;
  mode?: string;
  [key: string]: unknown;
}

interface Schedule {
  id: string;
  name: string;
  [key: string]: unknown;
}

const PAGE_DESCRIPTION = 'Vista dettagliata delle programmazioni settimanali';

/** Loading state: the page header stays visible above the skeleton. */
function ScheduleFallback() {
  return (
    <>
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Programmazione" description={PAGE_DESCRIPTION} backHref="/thermostat" style={{ marginBottom: 0 }} />
      </div>
      <Skeleton.SchedulePage />
    </>
  );
}

function ScheduleContent() {
  const { schedules, activeSchedule, homeId, loading, error, refetch } = useScheduleData();
  const { rooms, refetch: refetchRooms } = useRoomStatus();
  const [showOverrideSheet, setShowOverrideSheet] = useState<boolean>(false);

  // Find rooms with active override
  const roomsWithOverride = (rooms as Room[]).filter(r => r.mode === 'manual');

  if (loading) {
    return <ScheduleFallback />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Programmazione" description={PAGE_DESCRIPTION} backHref="/thermostat" />
        <Card variant="elevated" className="p-6">
          <Text variant="danger">{error}</Text>
        </Card>
        <div className="mt-4">
          <Button variant="subtle" onClick={refetch}>
            <RefreshCw size={16} className="mr-2" />
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Programmazione"
        description={PAGE_DESCRIPTION}
        backHref="/thermostat"
        actions={
          <Button
            variant="subtle"
            size="sm"
            onClick={refetch}
            icon={<RefreshCw size={16} />}
          >
            Aggiorna
          </Button>
        }
      />

      {/* Schedule selector card */}
      <Card variant="glass" className="mb-6 p-5 sm:p-6">
        <ScheduleSelector
          schedules={schedules as Schedule[]}
          activeSchedule={activeSchedule as Schedule}
          onScheduleChanged={refetch}
          homeId={homeId ?? undefined}
        />
      </Card>

      {/* Timeline card */}
      <Card variant="glass" className="mb-6 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Heading level={2} size="xl">
            Programmazione Settimanale
          </Heading>
          {activeSchedule && (
            <Text variant="tertiary" size="sm">
              {activeSchedule.name}
            </Text>
          )}
        </div>

        <WeeklyTimeline schedule={activeSchedule} />
      </Card>

      {/* Active overrides section */}
      {roomsWithOverride.length > 0 && (
        <Card variant="elevated" className="mb-6 p-5 sm:p-6">
          <Heading level={3} size="lg" className="mb-4 flex items-center gap-2">
            <Flame className="text-ember-400" />
            Override Attivi
          </Heading>
          <div className="space-y-2">
            {roomsWithOverride.map(room => (
              <ActiveOverrideBadge
                key={room.id}
                room={room as Room}
                homeId={homeId ?? undefined}
                onCancelled={() => {
                  refetchRooms();
                  refetch(); // Also refresh schedules
                }}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Manual override button */}
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading level={3} size="lg" className="flex items-center gap-2">
              <Flame className="text-ember-400" />
              Override Manuale
            </Heading>
            <Text variant="secondary" size="sm" className="mt-1">
              Imposta una temperatura temporanea senza modificare la programmazione
            </Text>
          </div>
          <Button
            variant="ember"
            onClick={() => setShowOverrideSheet(true)}
          >
            Boost
          </Button>
        </div>
      </Card>

      {/* Override sheet */}
      <ManualOverrideSheet
        isOpen={showOverrideSheet}
        onClose={() => setShowOverrideSheet(false)}
        homeId={homeId ?? undefined}
        onOverrideCreated={() => {
          refetchRooms();
          refetch();
        }}
      />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleFallback />}>
      <ScheduleContent />
    </Suspense>
  );
}
