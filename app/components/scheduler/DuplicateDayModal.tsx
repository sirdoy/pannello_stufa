'use client';

import { useState, useEffect } from 'react';
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

  // Reset selected days when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDays([]);
    }
  }, [isOpen]);

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
        className="p-6 animate-scale-in-center"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
        <div className="flex gap-2 mb-4">
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
        <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
          {availableDays.map(day => (
            <div
              key={day}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:hover:bg-slate-200 transition-colors"
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
