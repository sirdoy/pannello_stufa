'use client';
import { Edit2, Trash2 } from 'lucide-react';
import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';
import BottomSheet from '../ui/BottomSheet';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';

export default function IntervalBottomSheet({
  range,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!isOpen || !range) return null;

  // Calcola durata intervallo
  const getDuration = () => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const durationMin = endH * 60 + endM - (startH * 60 + startM);
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;
    return hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
      : `${minutes}min`;
  };

  const powerLabel = POWER_LABELS[range.power];
  const fanLabel = FAN_LABELS[range.fan];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${range.start} - ${range.end}`}
      icon="⏰"
      showCloseButton={true}
      showHandle={true}
      closeOnBackdrop={true}
    >
      {/* Durata */}
      <div className="text-sm text-slate-600 [html:not(.dark)_&]:text-slate-400 mb-6">
        {getDuration()}
      </div>

      {/* Potenza */}
      <div className="mb-5">
        <ProgressBar
          value={powerLabel.percent}
          gradient={powerLabel.gradient}
          size="md"
          animated
          leftContent={
            <>
              <span className="text-xl">⚡</span>
              <span className="text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300">
                Potenza
              </span>
            </>
          }
          rightContent={
            <>
              <span className="text-xs font-bold text-slate-600 [html:not(.dark)_&]:text-slate-400">
                P{range.power}
              </span>
              <span className="text-sm font-medium text-slate-900 [html:not(.dark)_&]:text-white">
                {powerLabel.text}
              </span>
            </>
          }
        />
      </div>

      {/* Ventola */}
      <div className="mb-6">
        <ProgressBar
          value={fanLabel.percent}
          color="info"
          size="md"
          animated
          leftContent={
            <>
              <span className="text-xl">💨</span>
              <span className="text-sm font-semibold text-slate-700 [html:not(.dark)_&]:text-slate-300">
                Ventola
              </span>
            </>
          }
          rightContent={
            <>
              <span className="text-xs font-bold text-slate-600 [html:not(.dark)_&]:text-slate-400">
                V{range.fan}
              </span>
              <span className="text-sm font-medium text-slate-900 [html:not(.dark)_&]:text-white">
                {fanLabel.text}
              </span>
            </>
          }
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onEdit}
          icon={<Edit2 />}
          iconPosition="left"
          liquid
          className="bg-ocean-500/10 [html:not(.dark)_&]:bg-ocean-500/20 text-ocean-600 [html:not(.dark)_&]:text-ocean-400 hover:bg-ocean-500/20 [html:not(.dark)_&]:hover:bg-ocean-500/30 ring-1 ring-ocean-500/30 [html:not(.dark)_&]:ring-ocean-500/40"
        >
          Modifica
        </Button>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onClick={onDelete}
          icon={<Trash2 />}
          iconPosition="left"
          liquid
          className="bg-ember-500/10 [html:not(.dark)_&]:bg-ember-500/20 text-ember-600 [html:not(.dark)_&]:text-ember-400 hover:bg-ember-500/20 [html:not(.dark)_&]:hover:bg-ember-500/30 ring-1 ring-ember-500/30 [html:not(.dark)_&]:ring-ember-500/40"
        >
          Elimina
        </Button>
      </div>
    </BottomSheet>
  );
}
