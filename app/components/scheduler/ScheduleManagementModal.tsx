'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Input from '../ui/Input';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { X, Pencil, Trash2, CheckCircle } from 'lucide-react';

interface Schedule {
  id: string;
  name: string;
  enabled?: boolean;
  isActive?: boolean;
}

interface ConfirmDeleteState {
  isOpen: boolean;
  schedule: Schedule | null;
}

export interface ScheduleManagementModalProps {
  isOpen: boolean;
  schedules?: Schedule[];
  activeScheduleId: string;
  onSetActive: (scheduleId: string) => void;
  onRename: (scheduleId: string, newName: string) => void;
  onDelete: (scheduleId: string) => void;
  onClose: () => void;
}

export default function ScheduleManagementModal({
  isOpen,
  schedules = [],
  activeScheduleId,
  onSetActive,
  onRename,
  onDelete,
  onClose,
}: ScheduleManagementModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({ isOpen: false, schedule: null });

  // Custom Escape key handler (handles nested modals)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDelete.isOpen) {
          setConfirmDelete({ isOpen: false, schedule: null });
        } else if (editingId) {
          setEditingId(null);
          setError('');
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, editingId, confirmDelete.isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setEditName(schedule.name);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setError('');
  };

  const handleSaveEdit = (scheduleId: string) => {
    const trimmedName = editName.trim();

    // Validation
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

    // Check for duplicate names (excluding current schedule)
    const isDuplicate = schedules.some(
      s => s.id !== scheduleId && s.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError('Esiste già una pianificazione con questo nome');
      return;
    }

    // Success
    onRename(scheduleId, trimmedName);
    setEditingId(null);
    setEditName('');
    setError('');
  };

  const handleDeleteRequest = (schedule: Schedule) => {
    setConfirmDelete({ isOpen: true, schedule });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.schedule) {
      onDelete(confirmDelete.schedule.id);
      setConfirmDelete({ isOpen: false, schedule: null });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, schedule: null });
  };

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);
  const inactiveSchedules = schedules.filter(s => s.id !== activeScheduleId);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-2xl"
        closeOnEscape={false} // Custom escape handler above
      >
        <Card
          variant="glass"
          className="animate-scale-in-center p-6 sm:p-8"
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Heading level={3} size="xl">
                Gestisci Pianificazioni
              </Heading>
              <Text variant="secondary" size="sm" className="mt-1">
                Modifica, elimina o cambia pianificazione attiva
              </Text>
            </div>
            <ActionButton
              icon={<X />}
              variant="ghost"
              size="md"
              onClick={onClose}
              ariaLabel="Chiudi"
            />
          </div>

          {/* Active Schedule Section */}
          {activeSchedule && (
            <div className="mb-6">
              <Text as="h4" variant="tertiary" size="sm" className="mb-3 tracking-wider uppercase">
                Pianificazione Attiva
              </Text>
              <div className="rounded-2xl border-2 border-sage-700/50 bg-sage-950/30 p-4 ">
                <div className="flex items-center gap-3">
                  <div className="shadow-glow-success size-3 animate-pulse rounded-full bg-sage-500" />
                  <div className="flex-1">
                    {editingId === activeSchedule.id ? (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            setError('');
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(activeSchedule.id);
                            }
                          }}
                          maxLength={30}
                          autoFocus
                          
                          error={error}
                        />
                        <div className="flex gap-2">
                          <Button variant="success" size="sm" onClick={() => handleSaveEdit(activeSchedule.id)}>
                            Salva
                          </Button>
                          <Button variant="subtle" size="sm" onClick={handleCancelEdit}>
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <Text as="span" variant="sage">
                          {activeSchedule.name}
                        </Text>
                        <ActionButton
                          icon={<Pencil />}
                          variant="ember"
                          size="sm"
                          onClick={() => handleStartEdit(activeSchedule)}
                          ariaLabel="Modifica nome"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inactive Schedules Section */}
          {inactiveSchedules.length > 0 && (
            <div>
              <Text as="h4" variant="tertiary" size="sm" className="mb-3 tracking-wider uppercase">
                Altre Pianificazioni
              </Text>
              <div className="space-y-3">
                {inactiveSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-2xl border border-slate-600/40 bg-slate-800/60 p-4 backdrop-blur-xl "
                  >
                    {editingId === schedule.id ? (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            setError('');
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(schedule.id);
                            }
                          }}
                          maxLength={30}
                          autoFocus
                          
                          error={error}
                        />
                        <div className="flex gap-2">
                          <Button variant="success" size="sm" onClick={() => handleSaveEdit(schedule.id)}>
                            Salva
                          </Button>
                          <Button variant="subtle" size="sm" onClick={handleCancelEdit}>
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="size-3 rounded-full bg-slate-500 " />
                          <Text as="span" className="truncate">
                            {schedule.name}
                          </Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <ActionButton
                            icon={<CheckCircle />}
                            variant="sage"
                            size="sm"
                            onClick={() => onSetActive(schedule.id)}
                            ariaLabel="Imposta come attiva"
                            title="Imposta come attiva"
                          />
                          <ActionButton
                            icon={<Pencil />}
                            variant="ember"
                            size="sm"
                            onClick={() => handleStartEdit(schedule)}
                            ariaLabel="Modifica nome"
                            title="Modifica nome"
                          />
                          <ActionButton
                            icon={<Trash2 />}
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRequest(schedule)}
                            ariaLabel="Elimina"
                            title="Elimina"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {schedules.length === 0 && (
            <div className="py-8 text-center">
              <Text variant="tertiary">
                Nessuna pianificazione disponibile
              </Text>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6">
            <Button
              variant="subtle"
              onClick={onClose}
              className="w-full"
            >
              Chiudi
            </Button>
          </div>
        </Card>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Elimina Pianificazione"
        message={`Sei sicuro di voler eliminare la pianificazione "${confirmDelete.schedule?.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        confirmVariant="danger"
        icon="🗑️"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
