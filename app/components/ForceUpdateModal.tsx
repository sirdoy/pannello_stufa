'use client';

import { APP_VERSION } from '@/lib/version';
import Modal from './ui/Modal';
import Card from './ui/Card';
import Button from './ui/Button';
import Heading from './ui/Heading';
import Text from './ui/Text';

interface ForceUpdateModalProps {
  show: boolean;
  firebaseVersion: string;
}

/**
 * Modal bloccante per forzare aggiornamento applicazione
 * Non può essere chiusa dall'utente - solo con reload
 */
export default function ForceUpdateModal({ show, firebaseVersion }: ForceUpdateModalProps) {
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
      <Card className="p-8 border-4 border-ember-500">
        {/* Icon warning */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ember-500 to-flame-500 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🔄</span>
          </div>
        </div>

        {/* Header */}
        <Heading level={2} className="mb-4 text-center text-slate-900 ">
          Aggiornamento Disponibile
        </Heading>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <Text className="text-center text-slate-700 ">
            È disponibile una nuova versione dell&apos;applicazione. Per continuare ad utilizzare il pannello è necessario aggiornare.
          </Text>

          {/* Version info */}
          <div className="bg-slate-100 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <Text as="span" size="sm" className="text-slate-600 ">
                Versione attuale:
              </Text>
              <Text as="span" size="sm" className="text-slate-900 ">
                {APP_VERSION}
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text as="span" size="sm" className="text-slate-600 ">
                Nuova versione:
              </Text>
              <Text as="span" size="sm" variant="ember">
                {firebaseVersion}
              </Text>
            </div>
          </div>

          <Text size="sm" className="text-center italic text-slate-600 ">
            L&apos;aggiornamento richiede solo il ricaricamento della pagina.
          </Text>
        </div>

        {/* Action button - solo questo disponibile */}
        <Button
          variant="ember"
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
