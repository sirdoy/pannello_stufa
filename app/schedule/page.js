'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Heading, Text, Button, Skeleton, ErrorAlert } from '@/app/components/ui';
import { useScheduleData } from '@/lib/hooks/useScheduleData';
import ScheduleSelector from './components/ScheduleSelector';
import WeeklyTimeline from './components/WeeklyTimeline';
import { ArrowLeft, RefreshCw, Calendar, Flame } from 'lucide-react';

function ScheduleContent() {
  const router = useRouter();
  const { schedules, activeSchedule, loading, error, refetch } = useScheduleData();

  if (loading) {
    return <Skeleton.SchedulePage />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorAlert message={error} />
        <div className="mt-4">
          <Button variant="secondary" onClick={refetch}>
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
              Visualizza e gestisci le programmazioni settimanali del termostato
            </Text>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            icon={<RefreshCw size={16} />}
          >
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Schedule selector card */}
      <Card variant="glass" className="p-5 sm:p-6 mb-6">
        <ScheduleSelector
          schedules={schedules}
          activeSchedule={activeSchedule}
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
              {activeSchedule.name}
            </Text>
          )}
        </div>

        <WeeklyTimeline schedule={activeSchedule} />
      </Card>

      {/* Manual override link */}
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
            onClick={() => {
              // Will be implemented in Plan 04
              // Opens ManualOverrideSheet
              console.log('TODO: Open override sheet');
            }}
          >
            Boost
          </Button>
        </div>
      </Card>
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
