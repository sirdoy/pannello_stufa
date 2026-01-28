'use client';

import { Select, Button } from '@/app/components/ui';

const TYPE_OPTIONS = [
  { value: '', label: 'Tutti gli eventi' },
  { value: 'mismatch', label: 'State Mismatch' },
  { value: 'error', label: 'Errori' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Tutte le severita' },
  { value: 'error', label: 'Solo errori' },
  { value: 'warning', label: 'Solo warning' },
  { value: 'success', label: 'Solo successi' },
];

export default function EventFilters({
  type,
  severity,
  onTypeChange,
  onSeverityChange,
}) {
  const isFiltered = type || severity;

  const handleClear = () => {
    onTypeChange('');
    onSeverityChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Type filter */}
      <div className="w-full sm:w-48">
        <Select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          options={TYPE_OPTIONS}
          label="Tipo evento"
          liquid
        />
      </div>

      {/* Severity filter */}
      <div className="w-full sm:w-48">
        <Select
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value)}
          options={SEVERITY_OPTIONS}
          label="Severita"
          liquid
        />
      </div>

      {/* Clear filters button */}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="flex-shrink-0 mt-6"
        >
          Pulisci filtri
        </Button>
      )}
    </div>
  );
}
