'use client';

/**
 * NotificationSettingsForm
 *
 * React Hook Form component with Zod validation for notification preferences.
 * Provides type-level toggles, DND time inputs, and progressive disclosure for advanced settings.
 *
 * Features:
 * - Three semantic categories (Alerts, System, Routine)
 * - DND time windows with native HTML5 time inputs
 * - Per-type rate limit controls (advanced)
 * - Auto-detected timezone display
 * - Zod validation with inline error display
 *
 * Compatible with React Hook Form 7.x + Zod 3.x
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  notificationPreferencesSchema,
  getDefaultPreferences,
} from '@/lib/schemas/notificationPreferences';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Toggle from '@/app/components/ui/Toggle';
import Input from '@/app/components/ui/Input';
import { Heading, Text } from '@/app/components/ui';
import Skeleton from '@/app/components/ui/Skeleton';

interface NotificationPreferences {
  enabledTypes: Record<string, boolean>;
  dndWindows: Array<{
    enabled: boolean;
    start: string;
    end: string;
  }>;
  timezone: string;
  rateLimits?: Record<string, number>;
}

interface NotificationSettingsFormProps {
  initialValues?: NotificationPreferences;
  onSubmit: (data: NotificationPreferences) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
}

/**
 * Category metadata for UI rendering
 */
const CATEGORY_CONFIG = {
  alerts: {
    label: 'Alerts',
    description: 'Critical system alerts and errors (always important)',
    icon: '🚨',
    types: [
      { key: 'CRITICAL', label: 'Critical', description: 'Cannot be bypassed by DND' },
      { key: 'ERROR', label: 'Errors', description: 'System failures and issues' },
    ],
    defaultEnabled: true,
  },
  system: {
    label: 'System',
    description: 'Maintenance and system updates',
    icon: '⚙️',
    types: [
      { key: 'maintenance', label: 'Maintenance', description: 'Maintenance reminders' },
      { key: 'updates', label: 'Updates', description: 'System update notifications' },
    ],
    defaultEnabled: true,
  },
  routine: {
    label: 'Routine',
    description: 'Optional status updates (opt-in)',
    icon: '📊',
    types: [
      { key: 'scheduler_success', label: 'Scheduler Success', description: 'Scheduled task completions' },
      { key: 'status', label: 'Status Updates', description: 'General status changes' },
    ],
    defaultEnabled: false,
  },
};

/**
 * NotificationSettingsForm Component
 */
export default function NotificationSettingsForm({
  initialValues,
  onSubmit,
  isLoading = false,
  isSaving = false,
}: NotificationSettingsFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detectedTimezone, setDetectedTimezone] = useState('UTC');

  // Auto-detect timezone on mount
  useEffect(() => {
    if (typeof Intl !== 'undefined') {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(timezone);
    }
  }, []);

  // Get default preferences with detected timezone
  const defaultPreferences = getDefaultPreferences();
  defaultPreferences.timezone = detectedTimezone;

  // Initialize React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: initialValues || defaultPreferences,
    mode: 'onBlur',
  });

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  // Watch DND enabled state
  const dndWindows = watch('dndWindows') || [];
  const hasDndWindow = dndWindows.length > 0 && dndWindows[0]?.enabled;

  // Handle form submission
  const handleFormSubmit = async (data: NotificationPreferences) => {
    await onSubmit(data);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Notification Type Categories */}
      {Object.entries(CATEGORY_CONFIG).map(([categoryId, category]) => (
        <Card key={categoryId} variant="glass" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <Heading level={3} size="md">
                {category.label}
              </Heading>
              <Text variant="secondary" size="sm">
                {category.description}
              </Text>
            </div>
          </div>

          <div className="space-y-3">
            {category.types.map((type) => (
              <div key={type.key} className="flex items-start justify-between gap-4 py-2">
                <div className="flex-1">
                  <Text>{type.label}</Text>
                  <Text variant="secondary" size="sm">
                    {type.description}
                  </Text>
                </div>
                <Controller
                  name={`enabledTypes.${type.key}`}
                  control={control}
                  render={({ field }) => (
                    <Toggle
                      checked={field.value ?? category.defaultEnabled}
                      onChange={field.onChange}
                      label={type.label}
                      disabled={isSaving}
                      size="sm"
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* DND Hours Section */}
      <Card variant="glass" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌙</span>
          <div>
            <Heading level={3} size="md">
              Do Not Disturb Hours
            </Heading>
            <Text variant="secondary" size="sm">
              Suppress non-critical notifications during specific hours (CRITICAL alerts bypass DND)
            </Text>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable DND Toggle */}
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="flex-1">
              <Text>Enable DND</Text>
              <Text variant="secondary" size="sm">
                Activate Do Not Disturb mode
              </Text>
            </div>
            <Controller
              name="dndWindows"
              control={control}
              render={({ field }) => {
                const isEnabled = field.value?.[0]?.enabled ?? false;
                return (
                  <Toggle
                    checked={isEnabled}
                    onChange={(value) => {
                      if (value && field.value.length === 0) {
                        // Create first DND window with defaults
                        field.onChange([{
                          id: crypto.randomUUID(),
                          startTime: '22:00',
                          endTime: '08:00',
                          enabled: true,
                        }]);
                      } else if (value) {
                        // Enable existing window
                        const updated = [...field.value];
                        updated[0] = { ...updated[0], enabled: true };
                        field.onChange(updated);
                      } else {
                        // Disable existing window
                        const updated = [...field.value];
                        updated[0] = { ...updated[0], enabled: false };
                        field.onChange(updated);
                      }
                    }}
                    label="Enable DND"
                    disabled={isSaving}
                    size="sm"
                  />
                );
              }}
            />
          </div>

          {/* DND Time Inputs - only visible when enabled */}
          {hasDndWindow && (
            <div className="ml-4 pl-4 border-l-2 border-slate-700/50 [html:not(.dark)_&]:border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <Controller
                    name="dndWindows.0.startTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="time"
                        label="Start Time"
                        icon="🌅"
                        {...field}
                        disabled={isSaving}
                        className={errors.dndWindows?.[0]?.startTime ? 'border-ember-500' : ''}
                      />
                    )}
                  />
                  {errors.dndWindows?.[0]?.startTime && (
                    <Text variant="ember" size="sm" className="mt-1">
                      {errors.dndWindows[0].startTime.message}
                    </Text>
                  )}
                </div>

                {/* End Time */}
                <div>
                  <Controller
                    name="dndWindows.0.endTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="time"
                        label="End Time"
                        icon="🌄"
                        {...field}
                        disabled={isSaving}
                        className={errors.dndWindows?.[0]?.endTime ? 'border-ember-500' : ''}
                      />
                    )}
                  />
                  {errors.dndWindows?.[0]?.endTime && (
                    <Text variant="ember" size="sm" className="mt-1">
                      {errors.dndWindows[0].endTime.message}
                    </Text>
                  )}
                </div>
              </div>

              {/* Timezone Display */}
              <div className="p-3 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-lg">
                <Text variant="secondary" size="sm">
                  <span className="font-medium">Timezone:</span> {detectedTimezone} (auto-detected)
                </Text>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Progressive Disclosure - Advanced Settings */}
      <Card variant="glass" className="p-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <Heading level={3} size="md">
                Advanced Settings
              </Heading>
              <Text variant="secondary" size="sm">
                Rate limiting configuration (per notification type)
              </Text>
            </div>
          </div>
          <span className="text-2xl transition-transform duration-200" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 space-y-6">
            <Text variant="secondary" size="sm" className="mb-4">
              Limit the number of notifications per time window to prevent spam.
            </Text>

            {/* Rate Limits for each category */}
            {Object.entries(CATEGORY_CONFIG).map(([categoryId, category]) => (
              <div key={categoryId} className="space-y-4">
                <Text className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label} Rate Limits</span>
                </Text>

                <div className="ml-4 pl-4 border-l-2 border-slate-700/50 [html:not(.dark)_&]:border-slate-200 space-y-4">
                  {category.types.map((type) => (
                    <div key={type.key} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Controller
                        name={`rateLimits.${type.key}.windowMinutes`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            label={`${type.label} - Window (minutes)`}
                            min="1"
                            max="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                            disabled={isSaving}
                            className={errors.rateLimits?.[type.key]?.windowMinutes ? 'border-ember-500' : ''}
                          />
                        )}
                      />
                      <Controller
                        name={`rateLimits.${type.key}.maxPerWindow`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            label={`${type.label} - Max per Window`}
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                            disabled={isSaving}
                            className={errors.rateLimits?.[type.key]?.maxPerWindow ? 'border-ember-500' : ''}
                          />
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between gap-4">
        <Text variant="secondary" size="sm">
          {isDirty ? 'You have unsaved changes' : 'No changes to save'}
        </Text>
        <Button
          type="submit"
          variant="ember"
          size="md"
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Form-level Errors */}
      {errors.root && (
        <div className="p-4 bg-ember-500/10 [html:not(.dark)_&]:bg-ember-50 border border-ember-500/30 [html:not(.dark)_&]:border-ember-200 rounded-xl">
          <Text variant="ember" size="sm">
            {errors.root.message}
          </Text>
        </div>
      )}
    </form>
  );
}
