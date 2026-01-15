'use client';

import { APP_VERSION, VERSION_HISTORY } from '@/lib/version';
import Link from 'next/link';
import Modal from './ui/Modal';
import Card from './ui/Card';
import Button from './ui/Button';
import ActionButton from './ui/ActionButton';
import { X } from 'lucide-react';

export default function WhatsNewModal({ isOpen, onClose, dontShowAgain }) {
  // Prendi la versione corrente dal VERSION_HISTORY
  const currentVersionData = VERSION_HISTORY.find(v => v.version === APP_VERSION) || VERSION_HISTORY[0];

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
      case 'major': return 'from-ember-500 to-flame-500';
      case 'minor': return 'from-sage-500 to-ocean-500';
      case 'patch': return 'from-ocean-500 to-ember-500';
      default: return 'from-slate-500 to-slate-600';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      maxWidth="max-w-2xl"
    >
      <Card
        liquid
        className="overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.15] [html:not(.dark)_&]:before:from-white/[0.08] before:to-transparent before:pointer-events-none"
      >
        {/* Header con gradiente */}
        <div className={`relative bg-gradient-to-r ${getVersionColor(currentVersionData.type)} p-8 text-white z-10`}>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-5xl drop-shadow-lg">{getVersionIcon(currentVersionData.type)}</span>
              <div>
                <h2 className="text-3xl font-bold">Novità!</h2>
                <p className="text-white/90 text-sm mt-1">{getVersionTypeLabel(currentVersionData.type)}</p>
              </div>
            </div>

            {/* Close button usando ActionButton */}
            <div className="bg-white/20 rounded-full">
              <ActionButton
                icon={<X className="text-white" />}
                variant="close"
                size="md"
                onClick={onClose}
                ariaLabel="Chiudi"
                className="bg-transparent hover:bg-white/20 ring-0"
              />
            </div>
          </div>

          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full relative z-10">
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
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)] relative z-10">
          <h3 className="text-xl font-bold text-slate-900 [html:not(.dark)_&]:text-white mb-4">Cosa c&apos;è di nuovo?</h3>

          <ul className="space-y-3">
            {currentVersionData.changes.map((change, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <span className="text-sage-500 mt-1 group-hover:scale-125 transition-transform duration-200">✓</span>
                <p className="text-slate-700 [html:not(.dark)_&]:text-slate-300 flex-1">{change}</p>
              </li>
            ))}
          </ul>

          {/* Link al changelog completo */}
          <div className="mt-6 p-4 bg-slate-50 [html:not(.dark)_&]:bg-slate-800/50 rounded-xl">
            <Link
              href="/changelog"
              onClick={onClose}
              className="flex items-center justify-between group hover:bg-slate-100 [html:not(.dark)_&]:hover:bg-slate-700/50 p-2 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span className="text-sm font-medium text-slate-700 [html:not(.dark)_&]:text-slate-300 group-hover:text-ember-600 [html:not(.dark)_&]:group-hover:text-ember-400">
                  Vedi changelog completo
                </span>
              </div>
              <span className="text-slate-400 group-hover:text-ember-600 [html:not(.dark)_&]:group-hover:text-ember-400 group-hover:translate-x-1 transition-all duration-200">→</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/80 [html:not(.dark)_&]:bg-slate-800/50 backdrop-blur-sm border-t border-slate-200/50 [html:not(.dark)_&]:border-slate-700/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between relative z-10">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  dontShowAgain();
                }
              }}
              className="w-4 h-4 text-ember-600 border-slate-300 [html:not(.dark)_&]:border-slate-600 rounded focus:ring-ember-500"
            />
            <span className="text-sm text-slate-600 [html:not(.dark)_&]:text-slate-400 group-hover:text-slate-900 [html:not(.dark)_&]:group-hover:text-slate-200">
              Non mostrare più per questa versione
            </span>
          </label>

          <Button
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Inizia ad usare
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
