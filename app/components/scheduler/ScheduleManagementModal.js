'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
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
          liquid
          className="animate-scale-in-center p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Gestisci Pianificazioni
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Modifica, elimina o cambia pianificazione attiva
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors text-neutral-600 dark:text-neutral-400"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Schedule Section */}
          {activeSchedule && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">
                Pianificazione Attiva
              </h4>
              <div className="p-4 bg-success-50/50 dark:bg-success-950/30 rounded-2xl border-2 border-success-300/50 dark:border-success-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success-500 shadow-glow-success animate-pulse" />
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
                          className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-300/50 dark:border-neutral-600/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                        {error && (
                          <p className="text-xs text-primary-600 dark:text-primary-400">
                            {error}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button liquid variant="success" size="sm" onClick={() => handleSaveEdit(activeSchedule.id)}>
                            Salva
                          </Button>
                          <Button liquid variant="secondary" size="sm" onClick={handleCancelEdit}>
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-success-800 dark:text-success-300">
                          {activeSchedule.name}
                        </span>
                        <button
                          onClick={() => handleStartEdit(activeSchedule)}
                          className="p-2 rounded-lg hover:bg-success-100/60 dark:hover:bg-success-900/40 transition-colors text-success-700 dark:text-success-400"
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
              <h4 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">
                Altre Pianificazioni
              </h4>
              <div className="space-y-3">
                {inactiveSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl rounded-2xl border border-neutral-300/40 dark:border-neutral-600/40"
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
                          className="w-full px-3 py-2 bg-white/80 dark:bg-neutral-700/80 rounded-xl border border-neutral-300/50 dark:border-neutral-600/50 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                        {error && (
                          <p className="text-xs text-primary-600 dark:text-primary-400">
                            {error}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button liquid variant="success" size="sm" onClick={() => handleSaveEdit(schedule.id)}>
                            Salva
                          </Button>
                          <Button liquid variant="secondary" size="sm" onClick={handleCancelEdit}>
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {schedule.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onSetActive(schedule.id)}
                            className="p-2 rounded-lg hover:bg-primary-100/60 dark:hover:bg-primary-900/40 transition-colors text-primary-600 dark:text-primary-400"
                            aria-label="Imposta come attiva"
                            title="Imposta come attiva"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(schedule)}
                            className="p-2 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors text-neutral-600 dark:text-neutral-400"
                            aria-label="Modifica nome"
                            title="Modifica nome"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(schedule)}
                            className="p-2 rounded-lg hover:bg-primary-100/60 dark:hover:bg-primary-900/40 transition-colors text-primary-600 dark:text-primary-400"
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
              <p className="text-neutral-500 dark:text-neutral-400">
                Nessuna pianificazione disponibile
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6">
            <Button
              liquid
              variant="secondary"
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
