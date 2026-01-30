'use client';

import { Select, Button } from '@/app/components/ui';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tutti i tipi' },
  { value: 'error', label: 'Errori' },
  { value: 'scheduler', label: 'Scheduler' },
  { value: 'maintenance', label: 'Manutenzione' },
  { value: 'test', label: 'Test' },
  { value: 'generic', label: 'Sistema' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tutti gli stati' },
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
  // Convert empty string from parent to 'all' for Select value
  const typeValue = type || 'all';
  const statusValue = status || 'all';

  // Convert 'all' back to empty string for parent
  const handleTypeChange = (value) => {
    onTypeChange(value === 'all' ? '' : value);
  };

  const handleStatusChange = (value) => {
    onStatusChange(value === 'all' ? '' : value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Type filter */}
      <div className="w-full sm:w-48">
        <Select
          value={typeValue}
          onChange={(e) => handleTypeChange(e.target.value)}
          options={TYPE_OPTIONS}
          label="Tipo"
          data-testid="history-filter"
        />
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-48">
        <Select
          value={statusValue}
          onChange={(e) => handleStatusChange(e.target.value)}
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
