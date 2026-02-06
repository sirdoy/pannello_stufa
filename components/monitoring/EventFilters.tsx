'use client';

import React from 'react';
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

interface EventFiltersProps {
  type: string;
  severity: string;
  onTypeChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
}

export default function EventFilters({
  type,
  severity,
  onTypeChange,
  onSeverityChange,
}: EventFiltersProps) {
  // Convert empty string from parent to 'all' for Select value
  const typeValue = type || 'all';
  const severityValue = severity || 'all';
  const isFiltered = type || severity;

  const handleClear = () => {
    onTypeChange('');
    onSeverityChange('');
  };

  // Convert 'all' back to empty string for parent
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onTypeChange(value === 'all' ? '' : value);
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSeverityChange(value === 'all' ? '' : value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Type filter */}
      <div className="w-full sm:w-48">
        <Select
          value={typeValue}
          onChange={handleTypeChange}
          options={TYPE_OPTIONS}
          label="Tipo evento"
          variant="default"
        />
      </div>

      {/* Severity filter */}
      <div className="w-full sm:w-48">
        <Select
          value={severityValue}
          onChange={handleSeverityChange}
          options={SEVERITY_OPTIONS}
          label="Severita"
          variant="default"
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
