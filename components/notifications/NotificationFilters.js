'use client';

import { Select, Button } from '@/app/components/ui';

const TYPE_OPTIONS = [
  { value: '', label: 'Tutti i tipi' },
  { value: 'error', label: 'Errori' },
  { value: 'scheduler', label: 'Scheduler' },
  { value: 'maintenance', label: 'Manutenzione' },
  { value: 'test', label: 'Test' },
  { value: 'generic', label: 'Sistema' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'sent', label: 'Inviate' },
  { value: 'delivered', label: 'Consegnate' },
  { value: 'failed', label: 'Fallite' },
];

export default function NotificationFilters({
  type,
  status,
  onTypeChange,
  onStatusChange,
  onClear,
  isFiltered,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Type filter */}
      <div className="w-full sm:w-48">
        <Select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          options={TYPE_OPTIONS}
          label="Tipo"
          data-testid="history-filter"
        />
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-48">
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={STATUS_OPTIONS}
          label="Stato"
        />
      </div>

      {/* Clear filters button */}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={onClear}
          className="flex-shrink-0 mt-6"
        >
          Rimuovi filtri
        </Button>
      )}
    </div>
  );
}
