'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { X } from 'lucide-react';

interface ExistingSchedule {
  id: string;
  name: string;
}

export interface CreateScheduleModalProps {
  isOpen: boolean;
  existingSchedules?: ExistingSchedule[];
  onConfirm: (data: { name: string; copyFromId: string | null }) => void;
  onCancel: () => void;
}

export default function CreateScheduleModal({
  isOpen,
  existingSchedules = [],
  onConfirm,
  onCancel,
}: CreateScheduleModalProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'scratch' | 'copy'>('scratch');
  const [copyFromId, setCopyFromId] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setMode('scratch');
      setCopyFromId('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    // Validation
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Il nome è obbligatorio');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Il nome deve contenere almeno 2 caratteri');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Il nome non può superare 30 caratteri');
      return;
    }

    // Check for duplicate names
    const isDuplicate = existingSchedules.some(
      schedule => schedule.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError('Esiste già una pianificazione con questo nome');
      return;
    }

    if (mode === 'copy' && !copyFromId) {
      setError('Seleziona una pianificazione da copiare');
      return;
    }

    // Success - call onConfirm
    onConfirm({
      name: trimmedName,
      copyFromId: mode === 'copy' ? copyFromId : null,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-lg"
    >
      <Card
        variant="glass"
        className="animate-scale-in-center p-6 sm:p-8"
      >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <Heading level={3} size="xl">
                Crea Nuova Pianificazione
              </Heading>
              <Text variant="secondary" size="sm" className="mt-1">
                Configura una nuova pianificazione settimanale
              </Text>
            </div>
            <ActionButton
              icon={<X />}
              variant="ghost"
              size="md"
              onClick={onCancel}
              ariaLabel="Chiudi"
            />
          </div>

          {/* Body */}
          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <Text as="label" variant="secondary" size="sm" className="block mb-2">
                Nome Pianificazione <Text as="span" variant="ember">*</Text>
              </Text>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Es: Weekend, Inverno, Estate..."
                maxLength={30}
                autoFocus
              />
              {error && (
                <Text variant="ember" size="sm" className="mt-2 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{error}</span>
                </Text>
              )}
              <Text variant="tertiary" size="xs" className="mt-2">
                {name.length}/30 caratteri
              </Text>
            </div>

            {/* Mode Selection */}
            <div>
              <Text as="label" variant="secondary" size="sm" className="block mb-3">
                Modalità Creazione
              </Text>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as 'scratch' | 'copy')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <RadioGroupItem
                  value="scratch"
                >
                  <div>
                    <div className="font-medium">Da Zero</div>
                    <div className="text-sm text-neutral-400">Inizia con una pianificazione vuota</div>
                  </div>
                </RadioGroupItem>
                <RadioGroupItem
                  value="copy"
                >
                  <div>
                    <div className="font-medium">Copia Esistente</div>
                    <div className="text-sm text-neutral-400">Duplica una pianificazione</div>
                  </div>
                </RadioGroupItem>
              </RadioGroup>
            </div>

            {/* Copy From Dropdown (only when mode === 'copy') */}
            {mode === 'copy' && (
              <div className="animate-fade-in">
                <Select
                  label="Copia da"
                  icon="📋"
                  value={copyFromId}
                  onChange={(e) => {
                    setCopyFromId(e.target.value);
                    setError('');
                  }}
                  placeholder="Seleziona una pianificazione..."
                  options={existingSchedules.map((schedule) => ({
                    value: schedule.id,
                    label: schedule.name,
                  }))}
                  variant="ember"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="neutral"
              onClick={onCancel}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              variant="ember"
              onClick={handleConfirm}
              className="flex-1"
              disabled={!name.trim() || (mode === 'copy' && !copyFromId)}
            >
              Crea Pianificazione
            </Button>
          </div>
      </Card>
    </Modal>
  );
}
