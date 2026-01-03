'use client';

import { APP_VERSION } from '@/lib/version';
import Modal from './ui/Modal';
import Card from './ui/Card';
import Button from './ui/Button';

/**
 * Modal bloccante per forzare aggiornamento applicazione
 * Non può essere chiusa dall'utente - solo con reload
 */
export default function ForceUpdateModal({ show, firebaseVersion }) {
  if (!show) return null;

  const handleReload = () => {
    window.location.reload();
  };

  // Funzione no-op per onClose (modale bloccante)
  const noop = () => {};

  return (
    <Modal
      isOpen={show}
      onClose={noop}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      maxWidth="max-w-md"
      className="z-[10000]"
    >
      <Card solid className="p-8 border-4 border-primary-500">
        {/* Icon warning */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🔄</span>
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 text-center">
          Aggiornamento Disponibile
        </h2>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-neutral-700 dark:text-neutral-300 text-center">
            È disponibile una nuova versione dell&apos;applicazione. Per continuare ad utilizzare il pannello è necessario aggiornare.
          </p>

          {/* Version info */}
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Versione attuale:
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {APP_VERSION}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Nuova versione:
              </span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {firebaseVersion}
              </span>
            </div>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center italic">
            L&apos;aggiornamento richiede solo il ricaricamento della pagina.
          </p>
        </div>

        {/* Action button - solo questo disponibile */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleReload}
          icon="🔄"
        >
          Aggiorna Ora
        </Button>
      </Card>
    </Modal>
  );
}
