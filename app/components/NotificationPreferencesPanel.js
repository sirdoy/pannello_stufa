'use client';

/**
 * NotificationPreferencesPanel
 *
 * Pannello di gestione preferenze notifiche con toggle switches
 * Salva preferenze su Firebase per utente
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  getUserPreferences,
  updatePreferenceSection,
  resetPreferences,
  DEFAULT_PREFERENCES,
} from '@/lib/notificationPreferencesService';
import Card from './ui/Card';
import Button from './ui/Button';
import Banner from './ui/Banner';
import Skeleton from './ui/Skeleton';

/**
 * Toggle Switch Component
 */
function Toggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="font-medium text-neutral-800">{label}</div>
        {description && (
          <div className="text-sm text-neutral-600 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-primary-600' : 'bg-neutral-300'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

/**
 * Main NotificationPreferencesPanel Component
 */
export default function NotificationPreferencesPanel() {
  const { user, isLoading: userLoading } = useUser();

  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load preferences
  useEffect(() => {
    if (!user?.sub) {
      setIsLoading(false);
      return;
    }

    loadPreferences();
  }, [user?.sub]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await getUserPreferences(user.sub);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Errore caricamento preferenze');
      // Fallback a defaults
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  };

  // Save section preferences
  const saveSection = async (section, sectionPrefs) => {
    if (!user?.sub) return;

    setIsSaving(true);
    setError(null);

    try {
      await updatePreferenceSection(user.sub, section, sectionPrefs);

      // Update local state
      setPreferences(prev => ({
        ...prev,
        [section]: sectionPrefs,
      }));

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Errore salvataggio preferenze');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!user?.sub) return;
    if (!confirm('Ripristinare tutte le preferenze ai valori predefiniti?')) return;

    setIsSaving(true);
    setError(null);

    try {
      await resetPreferences(user.sub);
      setPreferences(DEFAULT_PREFERENCES);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error resetting preferences:', err);
      setError('Errore ripristino preferenze');
    } finally {
      setIsSaving(false);
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
        description="Impossibile caricare le preferenze. Riprova più tardi."
        liquid
      />
    );
  }

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

      {/* Errors Section */}
      <Card liquid className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <span>🚨</span>
              <span>Errori Stufa</span>
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Notifiche quando si verificano errori o allarmi
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-4">
          <Toggle
            label="Abilita notifiche errori"
            description="Ricevi notifiche per tutti gli errori della stufa"
            checked={preferences.errors?.enabled ?? true}
            onChange={(value) => saveSection('errors', {
              ...preferences.errors,
              enabled: value,
            })}
            disabled={isSaving}
          />

          {preferences.errors?.enabled && (
            <div className="ml-4 pl-4 border-l-2 border-neutral-200 space-y-1">
              <Toggle
                label="ℹ️ INFO"
                description="Notifiche informative (non critiche)"
                checked={preferences.errors?.severityLevels?.info ?? false}
                onChange={(value) => saveSection('errors', {
                  ...preferences.errors,
                  severityLevels: {
                    ...preferences.errors.severityLevels,
                    info: value,
                  },
                })}
                disabled={isSaving}
              />

              <Toggle
                label="⚠️ WARNING"
                description="Avvisi che richiedono attenzione"
                checked={preferences.errors?.severityLevels?.warning ?? true}
                onChange={(value) => saveSection('errors', {
                  ...preferences.errors,
                  severityLevels: {
                    ...preferences.errors.severityLevels,
                    warning: value,
                  },
                })}
                disabled={isSaving}
              />

              <Toggle
                label="❌ ERROR"
                description="Errori che possono influire sul funzionamento"
                checked={preferences.errors?.severityLevels?.error ?? true}
                onChange={(value) => saveSection('errors', {
                  ...preferences.errors,
                  severityLevels: {
                    ...preferences.errors.severityLevels,
                    error: value,
                  },
                })}
                disabled={isSaving}
              />

              <Toggle
                label="🚨 CRITICAL"
                description="Errori critici che richiedono intervento immediato"
                checked={preferences.errors?.severityLevels?.critical ?? true}
                onChange={(value) => saveSection('errors', {
                  ...preferences.errors,
                  severityLevels: {
                    ...preferences.errors.severityLevels,
                    critical: value,
                  },
                })}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Scheduler Section */}
      <Card liquid className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <span>⏰</span>
              <span>Scheduler Automatico</span>
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Notifiche per azioni eseguite automaticamente dallo scheduler
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-4">
          <Toggle
            label="Abilita notifiche scheduler"
            description="Ricevi notifiche per azioni automatiche dello scheduler"
            checked={preferences.scheduler?.enabled ?? true}
            onChange={(value) => saveSection('scheduler', {
              ...preferences.scheduler,
              enabled: value,
            })}
            disabled={isSaving}
          />

          {preferences.scheduler?.enabled && (
            <div className="ml-4 pl-4 border-l-2 border-neutral-200 space-y-1">
              <Toggle
                label="🔥 Accensione automatica"
                description="Notifica quando la stufa viene accesa dallo scheduler"
                checked={preferences.scheduler?.ignition ?? true}
                onChange={(value) => saveSection('scheduler', {
                  ...preferences.scheduler,
                  ignition: value,
                })}
                disabled={isSaving}
              />

              <Toggle
                label="🌙 Spegnimento automatico"
                description="Notifica quando la stufa viene spenta dallo scheduler"
                checked={preferences.scheduler?.shutdown ?? true}
                onChange={(value) => saveSection('scheduler', {
                  ...preferences.scheduler,
                  shutdown: value,
                })}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Maintenance Section */}
      <Card liquid className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <span>🔧</span>
              <span>Manutenzione</span>
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Promemoria per manutenzione periodica della stufa
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-4">
          <Toggle
            label="Abilita notifiche manutenzione"
            description="Ricevi promemoria quando si avvicina la pulizia"
            checked={preferences.maintenance?.enabled ?? true}
            onChange={(value) => saveSection('maintenance', {
              ...preferences.maintenance,
              enabled: value,
            })}
            disabled={isSaving}
          />

          {preferences.maintenance?.enabled && (
            <div className="ml-4 pl-4 border-l-2 border-neutral-200 space-y-1">
              <Toggle
                label="ℹ️ Promemoria 80%"
                description="Notifica quando raggiungi l&apos;80% delle ore utilizzo"
                checked={preferences.maintenance?.threshold80 ?? true}
                onChange={(value) => saveSection('maintenance', {
                  ...preferences.maintenance,
                  threshold80: value,
                })}
                disabled={isSaving}
              />

              <Toggle
                label="⚠️ Attenzione 90%"
                description="Notifica quando raggiungi il 90% delle ore utilizzo"
                checked={preferences.maintenance?.threshold90 ?? true}
                onChange={(value) => saveSection('maintenance', {
                  ...preferences.maintenance,
                  threshold90: value,
                })}
                disabled={isSaving}
              />

              <Toggle
                label="🚨 Urgente 100%"
                description="Notifica critica quando manutenzione richiesta (blocca accensione)"
                checked={preferences.maintenance?.threshold100 ?? true}
                onChange={(value) => saveSection('maintenance', {
                  ...preferences.maintenance,
                  threshold100: value,
                })}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          liquid
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isSaving}
          icon="↻"
        >
          Ripristina Predefinite
        </Button>
      </div>
    </div>
  );
}
