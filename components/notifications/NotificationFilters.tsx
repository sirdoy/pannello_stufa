'use client';

import React from 'react';
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

interface NotificationFiltersProps {
  type: string;
  status: string;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
  isFiltered: boolean;
}

export default function NotificationFilters({
  type,
  status,
  onTypeChange,
  onStatusChange,
  onClear,
  isFiltered,
}: NotificationFiltersProps) {
  // Convert empty string from parent to 'all' for Select value
  const typeValue = type || 'all';
  const statusValue = status || 'all';

  // Convert 'all' back to empty string for parent
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onTypeChange(value === 'all' ? '' : value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onStatusChange(value === 'all' ? '' : value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Type filter */}
      <div className="w-full sm:w-48">
        <Select
          value={typeValue}
          onChange={handleTypeChange}
          options={TYPE_OPTIONS}
          label="Tipo"
          icon="🔔"
          data-testid="history-filter"
        />
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-48">
        <Select
          value={statusValue}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
          label="Stato"
          icon="📮"
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
