'use client';

import { Select, Button } from '@/app/components/ui';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tutti gli eventi' },
  { value: 'mismatch', label: 'State Mismatch' },
  { value: 'error', label: 'Errori' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'Tutte le severita' },
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
  // Convert empty string from parent to 'all' for Select value
  const typeValue = type || 'all';
  const severityValue = severity || 'all';
  const isFiltered = type || severity;

  const handleClear = () => {
    onTypeChange('');
    onSeverityChange('');
  };

  // Convert 'all' back to empty string for parent
  const handleTypeChange = (value) => {
    onTypeChange(value === 'all' ? '' : value);
  };

  const handleSeverityChange = (value) => {
    onSeverityChange(value === 'all' ? '' : value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Type filter */}
      <div className="w-full sm:w-48">
        <Select
          value={typeValue}
          onChange={(e) => handleTypeChange(e.target.value)}
          options={TYPE_OPTIONS}
          label="Tipo evento"
          variant="glass"
        />
      </div>

      {/* Severity filter */}
      <div className="w-full sm:w-48">
        <Select
          value={severityValue}
          onChange={(e) => handleSeverityChange(e.target.value)}
          options={SEVERITY_OPTIONS}
          label="Severita"
          variant="glass"
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
