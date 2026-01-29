'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { X } from 'lucide-react';

/**
 * CreateScheduleModal Component
 *
 * Modal for creating new schedule configurations.
 * Allows creating from scratch or copying from existing schedule.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Array} props.existingSchedules - Array of existing schedules for copy option
 * @param {Function} props.onConfirm - Callback with {name, copyFromId} or {name, copyFromId: null}
 * @param {Function} props.onCancel - Callback to close modal
 */
export default function CreateScheduleModal({
  isOpen,
  existingSchedules = [],
  onConfirm,
  onCancel,
}) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('scratch'); // 'scratch' or 'copy'
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

  const handleKeyPress = (e) => {
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
              variant="close"
              size="md"
              onClick={onCancel}
              ariaLabel="Chiudi"
            />
          </div>

          {/* Body */}
          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <Text as="label" variant="secondary" size="sm" weight="semibold" className="block mb-2">
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
                liquid
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
              <Text as="label" variant="secondary" size="sm" weight="semibold" className="block mb-3">
                Modalità Creazione
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* From Scratch */}
                <button
                  onClick={() => setMode('scratch')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    mode === 'scratch'
                      ? 'border-ember-500 bg-ember-50/50 [html:not(.dark)_&]:bg-ember-950/30'
                      : 'border-slate-300/50 [html:not(.dark)_&]:border-slate-600/50 hover:border-slate-400 [html:not(.dark)_&]:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      mode === 'scratch'
                        ? 'border-ember-500 bg-ember-500'
                        : 'border-slate-400 [html:not(.dark)_&]:border-slate-500'
                    }`}>
                      {mode === 'scratch' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Text weight="semibold" size="sm">
                        Da Zero
                      </Text>
                      <Text variant="secondary" size="xs" className="mt-1">
                        Inizia con una pianificazione vuota
                      </Text>
                    </div>
                  </div>
                </button>

                {/* Copy Existing */}
                <button
                  onClick={() => setMode('copy')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    mode === 'copy'
                      ? 'border-ember-500 bg-ember-50/50 [html:not(.dark)_&]:bg-ember-950/30'
                      : 'border-slate-300/50 [html:not(.dark)_&]:border-slate-600/50 hover:border-slate-400 [html:not(.dark)_&]:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      mode === 'copy'
                        ? 'border-ember-500 bg-ember-500'
                        : 'border-slate-400 [html:not(.dark)_&]:border-slate-500'
                    }`}>
                      {mode === 'copy' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Text weight="semibold" size="sm">
                        Copia Esistente
                      </Text>
                      <Text variant="secondary" size="xs" className="mt-1">
                        Duplica una pianificazione
                      </Text>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Copy From Dropdown (only when mode === 'copy') */}
            {mode === 'copy' && (
              <div className="animate-fade-in">
                <Text as="label" variant="secondary" size="sm" weight="semibold" className="block mb-2">
                  Copia da <Text as="span" variant="ember">*</Text>
                </Text>
                <select
                  value={copyFromId}
                  onChange={(e) => {
                    setCopyFromId(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-white/60 [html:not(.dark)_&]:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-300/50 [html:not(.dark)_&]:border-slate-600/50 focus:border-ember-500 [html:not(.dark)_&]:focus:border-ember-400 focus:ring-2 focus:ring-ember-500/20 [html:not(.dark)_&]:focus:ring-ember-400/20 text-slate-900 [html:not(.dark)_&]:text-white transition-all outline-none"
                >
                  <option value="">Seleziona una pianificazione...</option>
                  {existingSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-8">
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
