'use client';

/**
 * Pagina Impostazioni Tema
 *
 * Gestione tema light/dark con:
 * - Toggle switch chiaro/scuro
 * - Preview effetto glass
 * - Sync Firebase multi-device
 */

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useTheme } from '@/app/context/ThemeContext';
import { THEMES } from '@/lib/themeService';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Skeleton from '@/app/components/ui/Skeleton';

export default function ThemeSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { theme, setTheme, isLoading: themeLoading } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (newTheme) => {
    setIsSaving(true);
    try {
      await setTheme(newTheme);
    } catch (error) {
      console.error('Errore cambio tema:', error);
      alert('Errore durante il salvataggio del tema');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (userLoading || themeLoading) {
    return (
      <SettingsLayout title="Tema" icon="🎨">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Tema" icon="🎨">
        <Card liquid>
          <p className="text-neutral-600 dark:text-neutral-400">
            Devi essere autenticato per gestire il tema.
          </p>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Tema" icon="🎨">
      {/* Description */}
      <div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Scegli la modalità chiara o scura per l&apos;interfaccia
        </p>
      </div>

      {/* Theme Selector Card */}
      <Card liquid className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Modalità Interfaccia
        </h2>

        <div className="space-y-4">
          {/* Light Mode Option */}
          <button
            onClick={() => handleThemeChange(THEMES.LIGHT)}
            disabled={isSaving}
            className={`
              w-full p-4 rounded-lg border-2 transition-all
              flex items-center justify-between
              ${theme === THEMES.LIGHT
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">☀️</div>
              <div className="text-left">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Modalità Chiara
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sfondo chiaro con elementi glass
                </div>
              </div>
            </div>
            {theme === THEMES.LIGHT && (
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          {/* Dark Mode Option */}
          <button
            onClick={() => handleThemeChange(THEMES.DARK)}
            disabled={isSaving}
            className={`
              w-full p-4 rounded-lg border-2 transition-all
              flex items-center justify-between
              ${theme === THEMES.DARK
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">🌙</div>
              <div className="text-left">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Modalità Scura
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sfondo scuro con glass effect
                </div>
              </div>
            </div>
            {theme === THEMES.DARK && (
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Status Message */}
        {isSaving && (
          <div className="mt-4 p-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
            <p className="text-sm text-info-700 dark:text-info-300">
              ⏳ Salvataggio tema in corso...
            </p>
          </div>
        )}
      </Card>

      {/* Preview Card */}
      <Card liquid className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Preview Tema Corrente
        </h2>

        <div className="space-y-4">
          {/* Sample elements */}
          <div className="p-4 backdrop-blur-md bg-white/10 dark:bg-white/5 rounded-lg border border-white/20 dark:border-white/10">
            <p className="text-neutral-900 dark:text-white font-medium mb-2">
              Esempio Glass Effect
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Questo è un esempio di come appare l&apos;effetto vetro (glass) con il tema {theme === THEMES.LIGHT ? 'chiaro' : 'scuro'}.
              Il blur e la trasparenza creano profondità visiva.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" size="sm">
              Primario
            </Button>
            <Button variant="secondary" size="sm">
              Secondario
            </Button>
            <Button variant="success" size="sm">
              Successo
            </Button>
            <Button variant="danger" size="sm">
              Pericolo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Primary</p>
              <p className="text-primary-600 dark:text-primary-400 font-semibold">Rosso</p>
            </div>
            <div className="p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Info</p>
              <p className="text-info-600 dark:text-info-400 font-semibold">Blu</p>
            </div>
            <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Success</p>
              <p className="text-success-600 dark:text-success-400 font-semibold">Verde</p>
            </div>
            <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Warning</p>
              <p className="text-warning-600 dark:text-warning-400 font-semibold">Arancione</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card liquid className="p-6 sm:p-8 bg-info-50/50 dark:bg-info-900/10 border border-info-200 dark:border-info-800">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-info-900 dark:text-info-300 mb-1">
              Sincronizzazione Multi-Device
            </h3>
            <p className="text-sm text-info-700 dark:text-info-400">
              La tua preferenza tema viene salvata su Firebase e sincronizzata automaticamente su tutti i tuoi dispositivi.
            </p>
          </div>
        </div>
      </Card>
    </SettingsLayout>
  );
}
