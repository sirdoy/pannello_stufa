'use client';

import { useEffect } from 'react';
import { APP_VERSION, VERSION_HISTORY } from '@/lib/version';
import Link from 'next/link';

export default function WhatsNewModal({ isOpen, onClose, dontShowAgain }) {
  // Prendi la versione corrente dal VERSION_HISTORY
  const currentVersionData = VERSION_HISTORY.find(v => v.version === APP_VERSION) || VERSION_HISTORY[0];

  // Chiudi modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVersionIcon = (type) => {
    switch (type) {
      case 'major': return '🚀';
      case 'minor': return '✨';
      case 'patch': return '🔧';
      default: return '📦';
    }
  };

  const getVersionColor = (type) => {
    switch (type) {
      case 'major': return 'from-primary-500 to-accent-500';
      case 'minor': return 'from-success-500 to-info-500';
      case 'patch': return 'from-info-500 to-primary-500';
      default: return 'from-neutral-500 to-neutral-600';
    }
  };

  const getVersionTypeLabel = (type) => {
    switch (type) {
      case 'major': return 'Major Release';
      case 'minor': return 'Aggiornamento';
      case 'patch': return 'Correzioni';
      default: return 'Release';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className={`relative bg-gradient-to-r ${getVersionColor(currentVersionData.type)} p-8 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl drop-shadow-lg">{getVersionIcon(currentVersionData.type)}</span>
                <div>
                  <h2 className="text-3xl font-bold">Novità!</h2>
                  <p className="text-white/90 text-sm mt-1">{getVersionTypeLabel(currentVersionData.type)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
                aria-label="Chiudi"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Version badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-sm font-semibold">Versione {APP_VERSION}</span>
              <span className="text-xs opacity-75">
                {new Date(currentVersionData.date).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)]">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Cosa c&apos;è di nuovo?</h3>

            <ul className="space-y-3">
              {currentVersionData.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="text-success-500 mt-1 group-hover:scale-125 transition-transform duration-200">✓</span>
                  <p className="text-neutral-700 flex-1">{change}</p>
                </li>
              ))}
            </ul>

            {/* Link al changelog completo */}
            <div className="mt-6 p-4 bg-neutral-50 rounded-xl">
              <Link
                href="/changelog"
                onClick={onClose}
                className="flex items-center justify-between group hover:bg-neutral-100 p-2 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-600">
                    Vedi changelog completo
                  </span>
                </div>
                <span className="text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200">→</span>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    dontShowAgain();
                  }
                }}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-600 group-hover:text-neutral-900">
                Non mostrare più per questa versione
              </span>
            </label>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors duration-200 active:scale-95"
            >
              Inizia ad usare
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
