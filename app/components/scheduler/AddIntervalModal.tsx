'use client';

import { useState } from 'react';
import { useDepsChanged } from '@/lib/hooks/useDepsChanged';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import Banner from '../ui/Banner';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { AlertTriangle, Pencil, Plus, X } from 'lucide-react';
import { getPowerBadgeClass, getFanBadgeClass } from '@/lib/scheduler/schedulerStats';
import type { ScheduleInterval } from '@/lib/scheduler/schedulerService';

const DURATION_PRESETS = [
  { value: 15, label: '15 minuti' },
  { value: 30, label: '30 minuti' },
  { value: 60, label: '1 ora' },
  { value: 120, label: '2 ore' },
  { value: 'custom', label: 'Personalizzata' },
] as const;

export interface AddIntervalModalProps {
  isOpen: boolean;
  day: string;
  mode?: 'add' | 'edit';
  initialInterval?: ScheduleInterval | null;
  suggestedStart?: string;
  onConfirm: (interval: ScheduleInterval & { duration: number }) => void;
  onCancel: () => void;
  /**
   * Climate control is on: it decides power and fan, so the modal asks only
   * for the time range. A new slot is saved with these levels (the fallback
   * ones of climate control); an edited slot keeps the levels it had.
   */
  climateLevels?: { power: number; fan: number } | null;
}

export default function AddIntervalModal({
  isOpen,
  day,
  mode = 'add',
  initialInterval = null,
  suggestedStart = '00:00',
  onConfirm,
  onCancel,
  climateLevels = null,
}: AddIntervalModalProps) {
  const [inputMode, setInputMode] = useState<'duration' | 'endTime'>('duration');
  const [start, setStart] = useState(suggestedStart);
  const [end, setEnd] = useState('00:00');
  const [durationPreset, setDurationPreset] = useState<number | 'custom'>(30);
  const [customMinutes, setCustomMinutes] = useState(60);
  const [power, setPower] = useState(2);
  const [fan, setFan] = useState(3);

  // Update state when modal opens (or its inputs change while open), during render
  const openedOrChanged = useDepsChanged([isOpen, mode, initialInterval, suggestedStart]);
  if (openedOrChanged && isOpen) {
    if (mode === 'edit' && initialInterval) {
      // Edit mode: precompila con dati esistenti
      setStart(initialInterval.start);
      setEnd(initialInterval.end);
      setPower(initialInterval.power);
      setFan(initialInterval.fan);
      setInputMode('endTime'); // Default to endTime for edit

      // Calculate duration for duration mode
      const [startH, startM] = initialInterval.start.split(':').map(Number);
      const [endH, endM] = initialInterval.end.split(':').map(Number);
      const durationMin = (endH! * 60 + endM!) - (startH! * 60 + startM!);
      if ([15, 30, 60, 120].includes(durationMin)) {
        setDurationPreset(durationMin);
      } else {
        setDurationPreset('custom');
        setCustomMinutes(durationMin);
      }
    } else {
      // Add mode: reset to defaults
      setStart(suggestedStart);
      setDurationPreset(30);
      setCustomMinutes(60);
      setPower(climateLevels?.power ?? 2);
      setFan(climateLevels?.fan ?? 3);
      setInputMode('duration');
    }
  }

  // Calculate end time based on input mode
  const calculateEnd = () => {
    if (inputMode === 'endTime') {
      return end;
    }
    // Duration mode
    const minutes = durationPreset === 'custom' ? customMinutes : durationPreset;
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h! * 60 + m! + minutes;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  };

  const calculatedEnd = calculateEnd();

  // Validation
  const isValidInterval = () => {
    if (!start) return false;

    if (inputMode === 'duration') {
      if (durationPreset === 'custom' && (!customMinutes || customMinutes < 15)) return false;
    }

    // Check if end time wraps to next day (start > end means crossing midnight)
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = calculatedEnd.split(':').map(Number);
    const startMinutes = startH! * 60 + startM!;
    const endMinutes = endH! * 60 + endM!;

    // Don't allow intervals that cross midnight
    if (endMinutes <= startMinutes) return false;

    return true;
  };

  const handleConfirm = () => {
    if (!isValidInterval()) return;

    // Calculate duration from start/end
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = calculatedEnd.split(':').map(Number);
    const duration = (endH! * 60 + endM!) - (startH! * 60 + startM!);

    onConfirm({
      start,
      end: calculatedEnd,
      duration,
      power,
      fan,
    });
  };

  const powerOptions = [1, 2, 3, 4, 5];
  const fanOptions = [1, 2, 3, 4, 5, 6];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-lg"
    >
      <Card
        variant="glass"
        className="animate-scale-in-center p-6"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Heading
            id="add-interval-title"
            level={2}
            size="xl"
            className="flex items-center gap-2"
          >
            {mode === 'edit' ? <Pencil size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
            <span>{mode === 'edit' ? 'Modifica' : 'Aggiungi'} Intervallo - {day}</span>
          </Heading>
          <ActionButton
            icon={<X />}
            variant="ghost"
            size="md"
            onClick={onCancel}
            ariaLabel="Chiudi"
          />
        </div>

        {/* Form */}
        <div className="mb-6 space-y-4">
          {/* Start Time */}
          <Input
            type="time"
            label="Ora inizio"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />

          {/* Toggle: Duration vs End Time */}
          <div>
            <Text as="label" variant="secondary" size="sm" className="mb-2 block">
              Modalità Inserimento
            </Text>
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'duration' | 'endTime')} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="duration" className="flex-1">
                  Durata
                </TabsTrigger>
                <TabsTrigger value="endTime" className="flex-1">
                  Ora Fine
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Duration Mode */}
          {inputMode === 'duration' && (
            <>
              <Select
                label="Durata"
                value={durationPreset}
                onChange={(e) => setDurationPreset(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                options={DURATION_PRESETS.map(preset => ({
                  value: preset.value,
                  label: preset.label,
                }))}
                variant="ember"
              />

              {/* Custom Duration Input */}
              {durationPreset === 'custom' && (
                <Input
                  type="number"
                  label="Minuti"
                  min="15"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  placeholder="Es: 90 per 1h 30min"
                />
              )}
            </>
          )}

          {/* End Time Mode */}
          {inputMode === 'endTime' && (
            <Input
              type="time"
              label="Ora fine"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          )}

          {/* End Time Preview */}
          <Card variant="subtle" padding={false} className="p-4">
            <Text variant="secondary" size="sm" className="mb-1">
              {inputMode === 'duration' ? 'Orario fine calcolato:' : 'Orario fine selezionato:'}
            </Text>
            <Text size="xl" className="text-2xl">{calculatedEnd}</Text>
            {!isValidInterval() && (
              <Text variant="danger" size="sm" className="mt-2 flex items-center gap-1.5">
                <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
                {durationPreset === 'custom' && customMinutes < 15
                  ? 'Durata minima: 15 minuti'
                  : 'L\'intervallo non può attraversare la mezzanotte'}
              </Text>
            )}
          </Card>

          {climateLevels && (
            <Banner variant="info" compact title="Potenza e ventola le decide il clima">
              Con il clima stufa attivo la fascia dice solo quando la stufa è accesa.
            </Banner>
          )}

          {/* Power & Fan */}
          {!climateLevels && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${getPowerBadgeClass(power)}`}>
                    P{power}
                  </span>
                  <Text as="span" variant="secondary" size="sm">
                    Livello {power}
                  </Text>
                </div>
                <Select
                  label="Potenza"
                  value={power}
                  onChange={(e) => setPower(Number(e.target.value))}
                  options={powerOptions.map(p => ({
                    value: p,
                    label: `Livello ${p}`,
                  }))}
                  variant="ember"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${getFanBadgeClass(fan)}`}>
                    V{fan}
                  </span>
                  <Text as="span" variant="secondary" size="sm">
                    Livello {fan}
                  </Text>
                </div>
                <Select
                  label="Ventola"
                  value={fan}
                  onChange={(e) => setFan(Number(e.target.value))}
                  options={fanOptions.map(f => ({
                    value: f,
                    label: `Livello ${f}`,
                  }))}
                  variant="default"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="subtle"
            onClick={onCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            variant="success"
            onClick={handleConfirm}
            disabled={!isValidInterval()}
            className="flex-1"
          >
            {mode === 'edit' ? 'Salva Modifiche' : 'Aggiungi Intervallo'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
