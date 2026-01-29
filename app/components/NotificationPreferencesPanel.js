'use client';

/**
 * NotificationPreferencesPanel
 *
 * Pannello di gestione preferenze notifiche con toggle switches.
 * Uses real-time Firestore sync via useNotificationPreferences hook.
 * Changes propagate instantly across devices.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import {
  updatePreferenceSection,
  DEFAULT_PREFERENCES,
  NOTIFICATION_CATEGORIES_CONFIG,
} from '@/lib/notificationPreferencesService';
import Card from './ui/Card';
import Button from './ui/Button';
import Banner from './ui/Banner';
import Skeleton from './ui/Skeleton';
import Toggle from './ui/Toggle';
import { Heading, Text } from './ui';

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path (e.g., 'severityLevels.info')
 * @returns {any}
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path
 * @param {any} value - Value to set
 * @returns {Object} New object with value set
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const result = { ...obj };

  if (keys.length === 1) {
    result[keys[0]] = value;
    return result;
  }

  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;

  return result;
}

/**
 * PreferenceToggle - Wrapper for Toggle with label and description
 */
function PreferenceToggle({ label, description, checked, onChange, disabled = false, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <Text weight="medium" className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </Text>
        {description && (
          <Text variant="secondary" size="sm" className="mt-0.5">
            {description}
          </Text>
        )}
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={label}
        size="sm"
      />
    </div>
  );
}

/**
 * Category Section Component
 */
function CategorySection({ categoryId, config, preferences, onSave, isSaving }) {
  const categoryPrefs = preferences[categoryId] || {};
  const isEnabled = categoryPrefs.enabled ?? DEFAULT_PREFERENCES[categoryId]?.enabled ?? true;

  const handleFieldChange = (fieldKey, value) => {
    const newPrefs = setNestedValue(categoryPrefs, fieldKey, value);
    onSave(categoryId, newPrefs);
  };

  const masterField = config.fields.find(f => f.isMaster);
  const subFields = config.fields.filter(f => !f.isMaster);

  return (
    <Card liquid className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level={3} size="md" className="flex items-center gap-2">
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </Heading>
          <Text variant="secondary" size="sm" className="mt-1">
            {config.description}
          </Text>
        </div>
      </div>

      <div className="border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 mt-4">
        {/* Master Toggle */}
        {masterField && (
          <PreferenceToggle
            label={masterField.label}
            description={masterField.description}
            checked={getNestedValue(categoryPrefs, masterField.key) ?? getNestedValue(DEFAULT_PREFERENCES[categoryId], masterField.key) ?? true}
            onChange={(value) => handleFieldChange(masterField.key, value)}
            disabled={isSaving}
          />
        )}

        {/* Sub fields (only visible when master is enabled) */}
        {isEnabled && subFields.length > 0 && (
          <div className="ml-4 pl-4 border-l-2 border-slate-700/50 [html:not(.dark)_&]:border-slate-200 space-y-1">
            {subFields.map((field) => (
              <PreferenceToggle
                key={field.key}
                label={field.label}
                description={field.description}
                icon={field.icon}
                checked={getNestedValue(categoryPrefs, field.key) ?? getNestedValue(DEFAULT_PREFERENCES[categoryId], field.key) ?? true}
                onChange={(value) => handleFieldChange(field.key, value)}
                disabled={isSaving}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Main NotificationPreferencesPanel Component
 */
export default function NotificationPreferencesPanel() {
  const { user, isLoading: userLoading } = useUser();

  // Use real-time Firestore sync hook
  const {
    prefs: preferences,
    loading: isLoading,
    error: hookError,
    isSaving: hookSaving,
    savePreferences,
    resetToDefaults,
  } = useNotificationPreferences(user?.sub);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Sync hook error to local error state
  useEffect(() => {
    if (hookError) {
      setError('Errore sincronizzazione preferenze');
    }
  }, [hookError]);

  // Save section preferences using real-time sync
  const saveSection = async (section, sectionPrefs) => {
    if (!user?.sub) return;

    setError(null);

    try {
      // Update via Firestore - hook will sync automatically
      const updatedPrefs = {
        ...preferences,
        [section]: sectionPrefs,
      };

      await savePreferences(updatedPrefs);

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Errore salvataggio preferenze');
    }
  };

  // Reset to defaults using real-time sync
  const handleReset = async () => {
    if (!user?.sub) return;
    if (!confirm('Ripristinare tutte le preferenze ai valori predefiniti?')) return;

    setError(null);

    try {
      await resetToDefaults();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error resetting preferences:', err);
      setError('Errore ripristino preferenze');
    }
  };

  // Loading state
  if (userLoading || isLoading) {
    return (
      <Card liquid className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Banner
        variant="warning"
        icon="🔐"
        title="Autenticazione Richiesta"
        description="Devi effettuare il login per gestire le preferenze notifiche"
        liquid
      />
    );
  }

  // No preferences loaded
  if (!preferences) {
    return (
      <Banner
        variant="error"
        icon="⚠️"
        title="Errore Caricamento"
        description="Impossibile caricare le preferenze. Riprova piu tardi."
        liquid
      />
    );
  }

  // Categories to display in order
  const categoryOrder = ['stove', 'errors', 'scheduler', 'maintenance', 'netatmo', 'hue', 'system'];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <Banner
          variant="success"
          icon="✅"
          title="Salvato!"
          description="Preferenze aggiornate con successo"
          dismissible
          onDismiss={() => setSaveSuccess(false)}
          liquid
        />
      )}

      {/* Error Message */}
      {error && (
        <Banner
          variant="error"
          icon="⚠️"
          title="Errore"
          description={error}
          dismissible
          onDismiss={() => setError(null)}
          liquid
        />
      )}

      {/* Render each category */}
      {categoryOrder.map((categoryId) => {
        const config = NOTIFICATION_CATEGORIES_CONFIG[categoryId];
        if (!config) return null;

        return (
          <CategorySection
            key={categoryId}
            categoryId={categoryId}
            config={config}
            preferences={preferences}
            onSave={saveSection}
            isSaving={hookSaving}
          />
        );
      })}

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={hookSaving}
          icon="↻"
        >
          Ripristina Predefinite
        </Button>
      </div>
    </div>
  );
}
