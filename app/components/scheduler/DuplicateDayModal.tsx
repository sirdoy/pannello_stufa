'use client';

import { useState } from 'react';
import { useDepsChanged } from '@/lib/hooks/useDepsChanged';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Checkbox from '../ui/Checkbox';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { X } from 'lucide-react';

const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export interface DuplicateDayModalProps {
  isOpen: boolean;
  sourceDay: string;
  excludeDays?: string[];
  onConfirm: (selectedDays: string[]) => void;
  onCancel: () => void;
}

export default function DuplicateDayModal({ isOpen, sourceDay, excludeDays = [], onConfirm, onCancel }: DuplicateDayModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Reset selected days when modal opens (during render, not in an effect)
  const openChanged = useDepsChanged([isOpen]);
  if (openChanged && isOpen) {
    setSelectedDays([]);
  }

  const availableDays = daysOfWeek.filter(day => !excludeDays.includes(day));

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectWeekdays = () => {
    const weekdays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
    setSelectedDays(weekdays.filter(day => availableDays.includes(day)));
  };

  const selectWeekend = () => {
    const weekend = ['Sabato', 'Domenica'];
    setSelectedDays(weekend.filter(day => availableDays.includes(day)));
  };

  const selectAll = () => {
    setSelectedDays([...availableDays]);
  };

  const handleConfirm = () => {
    if (selectedDays.length > 0) {
      onConfirm(selectedDays);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-md"
    >
      <Card
        variant="glass"
        className="animate-scale-in-center p-6"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Heading level={2} size="xl">
            Duplica {sourceDay}
          </Heading>
          <ActionButton
            icon={<X />}
            variant="ghost"
            size="md"
            onClick={onCancel}
            ariaLabel="Chiudi"
          />
        </div>

        {/* Description */}
        <Text variant="secondary" size="sm" className="mb-4">
          Seleziona i giorni su cui duplicare la pianificazione di {sourceDay}
        </Text>

        {/* Quick Actions */}
        <div className="mb-4 flex gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={selectWeekdays}
            className="flex-1"
          >
            Giorni feriali
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={selectWeekend}
            className="flex-1"
          >
            Weekend
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={selectAll}
            className="flex-1"
          >
            Tutti
          </Button>
        </div>

        {/* Day Selection */}
        <div className="mb-6 max-h-75 space-y-2 overflow-y-auto">
          {availableDays.map(day => (
            <div
              key={day}
              className="rounded-xl bg-white/3 p-3 transition-colors hover:bg-white/6"
            >
              <Checkbox
                id={`day-${day}`}
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
                label={day}
                variant="ocean"
              />
            </div>
          ))}
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
            variant="ember"
            onClick={handleConfirm}
            disabled={selectedDays.length === 0}
            className="flex-1"
          >
            Duplica {selectedDays.length > 0 && `su ${selectedDays.length} ${selectedDays.length === 1 ? 'giorno' : 'giorni'}`}
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
