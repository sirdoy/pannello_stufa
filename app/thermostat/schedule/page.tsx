'use client';
import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Heading, Text, Button, Skeleton } from '@/app/components/ui';
import { useScheduleData } from '@/lib/hooks/useScheduleData';
import { useRoomStatus } from '@/lib/hooks/useRoomStatus';
import ScheduleSelector from './components/ScheduleSelector';
import WeeklyTimeline from './components/WeeklyTimeline';
import ManualOverrideSheet from './components/ManualOverrideSheet';
import ActiveOverrideBadge from './components/ActiveOverrideBadge';
import { ArrowLeft, RefreshCw, Calendar, Flame } from 'lucide-react';

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

function ScheduleContent() {
  const router = useRouter();
  const { schedules, activeSchedule, loading, error, refetch } = useScheduleData();
  const { rooms, refetch: refetchRooms } = useRoomStatus();
  const [showOverrideSheet, setShowOverrideSheet] = useState<boolean>(false);

  // Find rooms with active override
  const roomsWithOverride = (rooms as Room[]).filter(r => r.mode === 'manual');

  if (loading) {
    return <Skeleton.SchedulePage />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/thermostat')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Termostato
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <Heading level={1} size="3xl" className="flex items-center gap-3">
              <Calendar className="text-ember-400" />
              Programmazione
            </Heading>
            <Text variant="secondary" className="mt-1">
              Vista dettagliata delle programmazioni settimanali
            </Text>
          </div>

          <Button
            variant="subtle"
            size="sm"
            onClick={refetch}
            icon={<RefreshCw size={16} /> as any}
          >
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Schedule selector card */}
      <Card variant="glass" className="p-5 sm:p-6 mb-6">
        <ScheduleSelector
          schedules={schedules as Schedule[]}
          activeSchedule={activeSchedule as Schedule}
          onScheduleChanged={refetch}
        />
      </Card>

      {/* Timeline card */}
      <Card variant="glass" className="p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2} size="xl">
            Programmazione Settimanale
          </Heading>
          {activeSchedule && (
            <Text variant="tertiary" size="sm">
              {(activeSchedule as Schedule).name}
            </Text>
          )}
        </div>

        <WeeklyTimeline schedule={activeSchedule as any} />
      </Card>

      {/* Active overrides section */}
      {roomsWithOverride.length > 0 && (
        <Card variant="elevated" className="p-5 sm:p-6 mb-6">
          <Heading level={3} size="lg" className="flex items-center gap-2 mb-4">
            <Flame className="text-ember-400" />
            Override Attivi
          </Heading>
          <div className="space-y-2">
            {roomsWithOverride.map(room => (
              <ActiveOverrideBadge
                key={room.id}
                room={room as Room}
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
    <Suspense fallback={<Skeleton.SchedulePage />}>
      <ScheduleContent />
    </Suspense>
  );
}
