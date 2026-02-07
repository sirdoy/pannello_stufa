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
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import { Heading, Text } from '@/app/components/ui';

export default function ThemeSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { theme, setTheme, isLoading: themeLoading } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
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
        <Card variant="glass">
          <Text variant="secondary">
            Devi essere autenticato per gestire il tema.
          </Text>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Tema" icon="🎨">
      {/* Description */}
      <Text variant="secondary">
        Scegli la modalità chiara o scura per l&apos;interfaccia
      </Text>

      {/* Theme Selector Card */}
      <Card variant="glass" className="p-6 sm:p-8">
        <Heading level={2} size="lg" className="mb-4">
          Modalità Interfaccia
        </Heading>

        <div className="space-y-4">
          {/* Light Mode Option */}
          <button
            onClick={() => handleThemeChange(THEMES.LIGHT)}
            disabled={isSaving}
            className={`
              w-full p-4 rounded-lg border-2 transition-all
              flex items-center justify-between
              ${theme === THEMES.LIGHT
                ? 'border-ember-500 bg-ember-50 [html:not(.dark)_&]:bg-ember-50 bg-ember-900/20'
                : 'border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 hover:border-slate-300 [html:not(.dark)_&]:hover:border-slate-300 hover:border-slate-600'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">☀️</div>
              <div className="text-left">
                <Text variant="body" as="div">
                  Modalità Chiara
                </Text>
                <Text variant="secondary" size="sm" as="div">
                  Sfondo chiaro con elementi glass
                </Text>
              </div>
            </div>
            {theme === THEMES.LIGHT && (
              <div className="flex items-center gap-2 text-ember-400 [html:not(.dark)_&]:text-ember-600">
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
                ? 'border-ember-500 bg-ember-50 [html:not(.dark)_&]:bg-ember-50 bg-ember-900/20'
                : 'border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 hover:border-slate-300 [html:not(.dark)_&]:hover:border-slate-300 hover:border-slate-600'
              }
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">🌙</div>
              <div className="text-left">
                <Text variant="body" as="div">
                  Modalità Scura
                </Text>
                <Text variant="secondary" size="sm" as="div">
                  Sfondo scuro con glass effect
                </Text>
              </div>
            </div>
            {theme === THEMES.DARK && (
              <div className="flex items-center gap-2 text-ember-400 [html:not(.dark)_&]:text-ember-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Status Message */}
        {isSaving && (
          <Banner variant="info" compact className="mt-4">
            Salvataggio tema in corso...
          </Banner>
        )}
      </Card>

      {/* Preview Card */}
      <Card variant="glass" className="p-6 sm:p-8">
        <Heading level={2} size="lg" className="mb-4">
          Preview Tema Corrente
        </Heading>

        <div className="space-y-4">
          {/* Sample elements */}
          <div className="p-4 backdrop-blur-md bg-white/10 [html:not(.dark)_&]:bg-white/10 bg-white/5 rounded-lg border border-white/20 [html:not(.dark)_&]:border-white/20 border-white/10">
            <Text variant="body" className="mb-2">
              Esempio Glass Effect
            </Text>
            <Text variant="secondary" size="sm">
              Questo è un esempio di come appare l&apos;effetto vetro (glass) con il tema {theme === THEMES.LIGHT ? 'chiaro' : 'scuro'}.
              Il blur e la trasparenza creano profondità visiva.
            </Text>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="ember" size="sm">
              Primario
            </Button>
            <Button variant="subtle" size="sm">
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
            <div className="p-3 bg-ember-50 [html:not(.dark)_&]:bg-ember-50 bg-ember-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Primary</Text>
              <Text variant="ember">Rosso</Text>
            </div>
            <div className="p-3 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 bg-ocean-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Info</Text>
              <Text variant="tertiary">Blu</Text>
            </div>
            <div className="p-3 bg-sage-50 [html:not(.dark)_&]:bg-sage-50 bg-sage-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Success</Text>
              <Text variant="sage">Verde</Text>
            </div>
            <div className="p-3 bg-warning-50 [html:not(.dark)_&]:bg-warning-50 bg-warning-900/20 rounded-lg">
              <Text variant="tertiary" size="xs" className="mb-1">Warning</Text>
              <Text variant="warning">Arancione</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card variant="glass" className="p-6 sm:p-8 bg-ocean-50/50 [html:not(.dark)_&]:bg-ocean-50/50 bg-ocean-900/10 border border-ocean-200 [html:not(.dark)_&]:border-ocean-200 border-ocean-800">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <Heading level={3} size="md" variant="info" className="mb-1">
              Sincronizzazione Multi-Device
            </Heading>
            <Text variant="info" size="sm">
              La tua preferenza tema viene salvata su Firebase e sincronizzata automaticamente su tutti i tuoi dispositivi.
            </Text>
          </div>
        </div>
      </Card>
    </SettingsLayout>
  );
}
