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
import { Card, Heading, Text } from '../ui';
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
        className="animate-fade-in fixed inset-0 z-54 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-55',
          'mx-auto max-w-2xl',
          'border-t border-white/8 bg-[rgba(28,25,23,0.92)]',
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
        <div className="mb-4 flex justify-center">
          <div
            className={cn(
              'h-1.5 w-12 rounded-full',
              'bg-white/20'
            )}
            aria-hidden="true"
          />
        </div>

        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center',
                'size-12 rounded-2xl',
                'border border-ember-500/30 bg-ember-500/20'
              )}
            >
              <Download
                size={24}
                className="text-ember-400 "
                aria-hidden="true"
              />
            </div>
            <Heading
              level={2}
              size="lg"
              id="install-prompt-title"
            >
              Installa Pannello Stufa
            </Heading>
          </div>

          {/* Close button */}
          <Button.Icon
            variant="ghost"
            size="sm"
            icon={<X size={20} />}
            onClick={dismiss}
            aria-label="Chiudi"
          />
        </div>

        {/* Benefits */}
        <div id="install-prompt-description" className="mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <Wifi
              size={20}
              className="mt-0.5 shrink-0 text-ocean-400 "
              aria-hidden="true"
            />
            <Text
              variant="secondary"
              size="sm"
            >
              Funziona anche offline
            </Text>
          </div>

          <div className="flex items-start gap-3">
            <Bell
              size={20}
              className="mt-0.5 shrink-0 text-sage-400 "
              aria-hidden="true"
            />
            <Text
              variant="secondary"
              size="sm"
            >
              Notifiche push in tempo reale
            </Text>
          </div>

          <div className="flex items-start gap-3">
            <Smartphone
              size={20}
              className="mt-0.5 shrink-0 text-ember-400 "
              aria-hidden="true"
            />
            <Text
              variant="secondary"
              size="sm"
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
              <Card variant="subtle">
                <Text
                  size="sm"
                  weight="semibold"
                  className="mb-2"
                >
                  Come installare:
                </Text>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Text
                      variant="secondary"
                      size="sm"
                    >
                      1. Tocca
                    </Text>
                    <Share
                      size={16}
                      className="mt-0.5 text-ocean-400 "
                      aria-hidden="true"
                    />
                    <Text
                      variant="secondary"
                      size="sm"
                    >
                      nella barra del browser
                    </Text>
                  </div>
                  <Text
                    variant="secondary"
                    size="sm"
                  >
                    2. Seleziona &quot;Aggiungi alla schermata Home&quot;
                  </Text>
                </div>
              </Card>

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
