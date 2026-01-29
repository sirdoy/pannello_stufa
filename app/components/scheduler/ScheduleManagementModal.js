'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import { X, Pencil, Trash2, CheckCircle } from 'lucide-react';

/**
 * ScheduleManagementModal Component
 *
 * Modal for managing existing schedules: rename, delete, set as active.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Array} props.schedules - Array of schedule objects {id, name, enabled, isActive}
 * @param {string} props.activeScheduleId - ID of currently active schedule
 * @param {Function} props.onSetActive - Callback to set schedule as active (scheduleId)
 * @param {Function} props.onRename - Callback to rename schedule (scheduleId, newName)
 * @param {Function} props.onDelete - Callback to delete schedule (scheduleId)
 * @param {Function} props.onClose - Callback to close modal
 */
export default function ScheduleManagementModal({
  isOpen,
  schedules = [],
  activeScheduleId,
  onSetActive,
  onRename,
  onDelete,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, schedule: null });

  // Custom Escape key handler (handles nested modals)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
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

  const handleStartEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditName(schedule.name);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setError('');
  };

  const handleSaveEdit = (scheduleId) => {
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

  const handleDeleteRequest = (schedule) => {
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
          <div className="flex items-start justify-between mb-6">
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
              variant="close"
              size="md"
              onClick={onClose}
              ariaLabel="Chiudi"
            />
          </div>

          {/* Active Schedule Section */}
          {activeSchedule && (
            <div className="mb-6">
              <Text as="h4" variant="tertiary" size="sm" weight="semibold" className="uppercase tracking-wider mb-3">
                Pianificazione Attiva
              </Text>
              <div className="p-4 bg-sage-950/30 rounded-2xl border-2 border-sage-700/50 [html:not(.dark)_&]:bg-sage-50/50 [html:not(.dark)_&]:border-sage-300/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-sage-500 shadow-glow-success animate-pulse" />
                  <div className="flex-1">
                    {editingId === activeSchedule.id ? (
                      <div className="space-y-2">
                        <input
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
                          className="w-full px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ember-500/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-300/50 [html:not(.dark)_&]:text-slate-900"
                        />
                        {error && (
                          <Text variant="ember" size="xs">
                            {error}
                          </Text>
                        )}
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
                        <Text as="span" weight="semibold" variant="sage">
                          {activeSchedule.name}
                        </Text>
                        <button
                          onClick={() => handleStartEdit(activeSchedule)}
                          className="p-2 rounded-lg hover:bg-sage-900/40 transition-colors text-sage-400 [html:not(.dark)_&]:hover:bg-sage-100/60 [html:not(.dark)_&]:text-sage-700"
                          aria-label="Modifica nome"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
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
              <Text as="h4" variant="tertiary" size="sm" weight="semibold" className="uppercase tracking-wider mb-3">
                Altre Pianificazioni
              </Text>
              <div className="space-y-3">
                {inactiveSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 [html:not(.dark)_&]:bg-white/60 [html:not(.dark)_&]:border-slate-300/40"
                  >
                    {editingId === schedule.id ? (
                      <div className="space-y-2">
                        <input
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
                          className="w-full px-3 py-2 bg-slate-700/80 rounded-xl border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ember-500/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-300/50 [html:not(.dark)_&]:text-slate-900"
                        />
                        {error && (
                          <Text variant="ember" size="xs">
                            {error}
                          </Text>
                        )}
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
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-slate-500 [html:not(.dark)_&]:bg-slate-400" />
                          <Text as="span" weight="semibold" className="truncate">
                            {schedule.name}
                          </Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onSetActive(schedule.id)}
                            className="p-2 rounded-lg hover:bg-ember-900/40 transition-colors text-ember-400 [html:not(.dark)_&]:hover:bg-ember-100/60 [html:not(.dark)_&]:text-ember-600"
                            aria-label="Imposta come attiva"
                            title="Imposta come attiva"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(schedule)}
                            className="p-2 rounded-lg hover:bg-slate-700/60 transition-colors text-slate-400 [html:not(.dark)_&]:hover:bg-slate-200/60 [html:not(.dark)_&]:text-slate-600"
                            aria-label="Modifica nome"
                            title="Modifica nome"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(schedule)}
                            className="p-2 rounded-lg hover:bg-ember-900/40 transition-colors text-ember-400 [html:not(.dark)_&]:hover:bg-ember-100/60 [html:not(.dark)_&]:text-ember-600"
                            aria-label="Elimina"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {schedules.length === 0 && (
            <div className="text-center py-8">
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
