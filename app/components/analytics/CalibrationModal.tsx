'use client';

import { useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
import Heading from '@/app/components/ui/Heading';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEstimate: number;
  currentCalibration?: {
    factor: number;
    lastDate: string;
    costPerKg: number;
  } | null;
  onCalibrate: (actualKg: number, costPerKg?: number) => Promise<void>;
}

export default function CalibrationModal({
  isOpen,
  onClose,
  currentEstimate,
  currentCalibration,
  onCalibrate,
}: CalibrationModalProps) {
  const [actualKg, setActualKg] = useState<number>(0);
  const [costPerKg, setCostPerKg] = useState<number>(currentCalibration?.costPerKg ?? 0.50);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (actualKg <= 0) return;
    setSubmitting(true);
    try {
      await onCalibrate(actualKg, costPerKg);
      onClose();
    } catch (error) {
      console.error('Calibration failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card variant="glass" padding={true} className="w-full max-w-md mx-4">
        <Heading level={3} variant="default" className="mb-4">
          Calibrate Pellet Estimate
        </Heading>

        <Text variant="secondary" size="sm" className="mb-4">
          Enter the actual amount of pellets you refilled today. This helps improve the accuracy of consumption estimates.
        </Text>

        {/* Current estimate display */}
        <div className="mb-4 p-3 rounded-lg bg-white/5">
          <Text variant="tertiary" size="xs">
            Current estimate for period
          </Text>
          <Text variant="ember" size="lg">
            {currentEstimate.toFixed(1)} kg
          </Text>
        </div>

        {/* Actual kg input */}
        <label>
          <Text variant="secondary" size="sm" className="mb-1 block">
            Actual pellet refill (kg)
          </Text>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="100"
            value={actualKg || ''}
            onChange={(e) => setActualKg(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:border-ember-500 focus:ring-1 focus:ring-ember-500 outline-none"
            placeholder="e.g., 15"
            aria-label="Actual pellet amount in kilograms"
          />
        </label>

        {/* Optional: cost per kg */}
        <label className="mt-3 block">
          <Text variant="secondary" size="sm" className="mb-1 block">
            Pellet cost (EUR/kg)
          </Text>
          <input
            type="number"
            step="0.05"
            min="0.10"
            max="5.00"
            value={costPerKg || ''}
            onChange={(e) => setCostPerKg(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:border-ember-500 focus:ring-1 focus:ring-ember-500 outline-none"
            placeholder="0.50"
            aria-label="Pellet cost per kilogram in euros"
          />
        </label>

        {/* Last calibration info */}
        {currentCalibration?.lastDate && (
          <Text variant="tertiary" size="xs" className="mt-3">
            Last calibrated: {new Date(currentCalibration.lastDate).toLocaleDateString()}
            {' '}(factor: {currentCalibration.factor.toFixed(2)}x)
          </Text>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="subtle" size="sm" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="ember"
            size="sm"
            onClick={handleSubmit}
            className="flex-1"
            disabled={!actualKg || actualKg <= 0 || submitting}
          >
            {submitting ? 'Saving...' : 'Calibrate'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
