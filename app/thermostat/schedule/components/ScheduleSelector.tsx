'use client';
import { useState } from 'react';
import { Select, Button, Text } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';
import { Check, RefreshCw } from 'lucide-react';

interface Schedule {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ScheduleSelectorProps {
  schedules?: Schedule[];
  activeSchedule?: Schedule | null;
  onScheduleChanged?: () => void;
}

/**
 * ScheduleSelector - Dropdown for switching between schedules
 */
export default function ScheduleSelector({
  schedules = [],
  activeSchedule,
  onScheduleChanged,
}: ScheduleSelectorProps) {
  const [switching, setSwitching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(activeSchedule?.id || '');

  const handleSwitch = async (): Promise<void> => {
    if (!selectedId || selectedId === activeSchedule?.id) return;

    try {
      setSwitching(true);
      setError(null);

      const res = await fetch(NETATMO_ROUTES.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: selectedId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Impossibile cambiare programmazione');
      }

      // Success - notify parent to refetch
      onScheduleChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setSwitching(false);
    }
  };

  // Build options array
  const options = schedules.map(s => ({
    value: s.id,
    label: s.name,
  }));

  const hasChanged = selectedId && selectedId !== activeSchedule?.id;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        {/* Schedule dropdown */}
        <div className="flex-1">
          <label className="block mb-1.5">
            <Text variant="label" size="sm">Programmazione attiva</Text>
          </label>
          <Select
            value={selectedId}
            onChange={(e) => setSelectedId(String(e.target.value))}
            options={options}
            disabled={switching || schedules.length === 0}
          />
        </div>

        {/* Apply button - only show when selection changed */}
        {hasChanged && (
          <Button
            variant="ember"
            onClick={handleSwitch}
            loading={switching}
            icon={(switching ? <RefreshCw className="animate-spin" /> : <Check />) as any}
          >
            Applica
          </Button>
        )}
      </div>

      {/* Active indicator */}
      {activeSchedule && !hasChanged && (
        <div className="flex items-center gap-2 text-sage-400">
          <Check size={16} />
          <Text variant="sage" size="sm">
            "{activeSchedule.name}" è la programmazione attiva
          </Text>
        </div>
      )}

      {/* Pending change indicator */}
      {hasChanged && !switching && (
        <Text variant="warning" size="sm">
          Premi "Applica" per cambiare programmazione
        </Text>
      )}

      {/* Error message */}
      {error && (
        <Text variant="danger" size="sm">{error}</Text>
      )}
    </div>
  );
}
