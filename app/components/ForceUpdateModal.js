'use client';

import { APP_VERSION } from '@/lib/version';

/**
 * Modal bloccante per forzare aggiornamento applicazione
 * Non può essere chiusa dall'utente - solo con reload
 */
export default function ForceUpdateModal({ show, firebaseVersion }) {
  if (!show) return null;

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Backdrop - non dismissible */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]" />

      {/* Modal - centrato e bloccante */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-primary-500">
          {/* Icon warning */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
              <span className="text-4xl">🔄</span>
            </div>
          </div>

          {/* Header */}
          <h2 className="text-2xl font-bold text-neutral-900 mb-4 text-center">
            Aggiornamento Disponibile
          </h2>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <p className="text-neutral-700 text-center">
              È disponibile una nuova versione dell&apos;applicazione. Per continuare ad utilizzare il pannello è necessario aggiornare.
            </p>

            {/* Version info */}
            <div className="bg-neutral-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-600">Versione attuale:</span>
                <span className="text-sm font-bold text-neutral-900">{APP_VERSION}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-600">Nuova versione:</span>
                <span className="text-sm font-bold text-primary-600">{firebaseVersion}</span>
              </div>
            </div>

            <p className="text-sm text-neutral-600 text-center italic">
              L&apos;aggiornamento richiede solo il ricaricamento della pagina.
            </p>
          </div>

          {/* Action button - solo questo disponibile */}
          <button
            onClick={handleReload}
            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-primary-600 hover:to-accent-600 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🔄 Aggiorna Ora
          </button>
        </div>
      </div>
    </>
  );
}
