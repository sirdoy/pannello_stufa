/**
 * InstallPrompt Component
 *
 * Bottom sheet PWA install prompt with:
 * - Slides up from bottom with backdrop
 * - Benefits list (offline, notifications, home screen)
 * - Native install button (Chrome/Android)
 * - Manual instructions (iOS)
 * - 30-day dismissal tracking
 *
 * Appears after 2+ visits if not dismissed or already installed.
 */

'use client';

import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { Download, Wifi, Bell, Smartphone, Share, X } from 'lucide-react';
import Button from '../ui/Button';
import { Heading, Text } from '../ui';
import { cn } from '@/lib/utils/cn';

export default function InstallPrompt() {
  const { canInstall, isIOS, install, dismiss } = useInstallPrompt();

  // Don't render if conditions not met
  if (!canInstall) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await install();
    if (!accepted) {
      // User dismissed the native prompt, close our UI
      dismiss();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[54] bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[55]',
          'max-w-2xl mx-auto',
          'bg-slate-900 border-t border-slate-700/50',
          '[html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-slate-200',
          'rounded-t-3xl',
          'shadow-liquid-xl',
          'animate-slide-up',
          'p-6 pb-8'
        )}
        role="dialog"
        aria-labelledby="install-prompt-title"
        aria-describedby="install-prompt-description"
      >
        {/* Drag handle (decorative) */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              'w-12 h-1.5 rounded-full',
              'bg-slate-700 [html:not(.dark)_&]:bg-slate-300'
            )}
            aria-hidden="true"
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center',
                'w-12 h-12 rounded-2xl',
                'bg-ember-500/20 border border-ember-500/30'
              )}
            >
              <Download
                size={24}
                className="text-ember-400 [html:not(.dark)_&]:text-ember-600"
                aria-hidden="true"
              />
            </div>
            <Heading
              level={2}
              size="lg"
              id="install-prompt-title"
              className="text-slate-100 [html:not(.dark)_&]:text-slate-900"
            >
              Installa Pannello Stufa
            </Heading>
          </div>

          {/* Close button */}
          <button
            onClick={dismiss}
            className={cn(
              'p-2 rounded-lg',
              'text-slate-400 hover:text-slate-200',
              'hover:bg-white/[0.06]',
              'transition-all duration-200',
              '[html:not(.dark)_&]:text-slate-500',
              '[html:not(.dark)_&]:hover:text-slate-700',
              '[html:not(.dark)_&]:hover:bg-black/[0.04]'
            )}
            aria-label="Chiudi"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Benefits */}
        <div id="install-prompt-description" className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <Wifi
              size={20}
              className="flex-shrink-0 mt-0.5 text-ocean-400 [html:not(.dark)_&]:text-ocean-600"
              aria-hidden="true"
            />
            <Text
              size="sm"
              className="text-slate-300 [html:not(.dark)_&]:text-slate-700"
            >
              Funziona anche offline
            </Text>
          </div>

          <div className="flex items-start gap-3">
            <Bell
              size={20}
              className="flex-shrink-0 mt-0.5 text-sage-400 [html:not(.dark)_&]:text-sage-600"
              aria-hidden="true"
            />
            <Text
              size="sm"
              className="text-slate-300 [html:not(.dark)_&]:text-slate-700"
            >
              Notifiche push in tempo reale
            </Text>
          </div>

          <div className="flex items-start gap-3">
            <Smartphone
              size={20}
              className="flex-shrink-0 mt-0.5 text-ember-400 [html:not(.dark)_&]:text-ember-600"
              aria-hidden="true"
            />
            <Text
              size="sm"
              className="text-slate-300 [html:not(.dark)_&]:text-slate-700"
            >
              Accesso rapido dalla home screen
            </Text>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isIOS ? (
            <>
              {/* iOS Manual Instructions */}
              <div
                className={cn(
                  'p-4 rounded-xl',
                  'bg-slate-800 border border-slate-700',
                  '[html:not(.dark)_&]:bg-slate-50 [html:not(.dark)_&]:border-slate-200'
                )}
              >
                <Text
                  size="sm"
                  className="font-semibold mb-2 text-slate-200 [html:not(.dark)_&]:text-slate-800"
                >
                  Come installare:
                </Text>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Text
                      size="sm"
                      className="text-slate-300 [html:not(.dark)_&]:text-slate-700"
                    >
                      1. Tocca
                    </Text>
                    <Share
                      size={16}
                      className="mt-0.5 text-ocean-400 [html:not(.dark)_&]:text-ocean-600"
                      aria-hidden="true"
                    />
                    <Text
                      size="sm"
                      className="text-slate-300 [html:not(.dark)_&]:text-slate-700"
                    >
                      nella barra del browser
                    </Text>
                  </div>
                  <Text
                    size="sm"
                    className="text-slate-300 [html:not(.dark)_&]:text-slate-700"
                  >
                    2. Seleziona &quot;Aggiungi alla schermata Home&quot;
                  </Text>
                </div>
              </div>

              {/* Dismiss button for iOS */}
              <Button
                variant="subtle"
                fullWidth
                onClick={dismiss}
              >
                Non ora
              </Button>
            </>
          ) : (
            <>
              {/* Native Install Button */}
              <Button
                variant="ember"
                fullWidth
                onClick={handleInstall}
              >
                Installa
              </Button>

              {/* Dismiss button */}
              <Button
                variant="subtle"
                fullWidth
                onClick={dismiss}
              >
                Non ora
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
