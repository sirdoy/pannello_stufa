'use client';

import { APP_VERSION, VERSION_HISTORY } from '@/lib/version';
import Link from 'next/link';
import Modal from './ui/Modal';
import Card from './ui/Card';
import Button from './ui/Button';
import ActionButton from './ui/ActionButton';
import Heading from './ui/Heading';
import Text from './ui/Text';
import { X } from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dontShowAgain: () => void;
}

export default function WhatsNewModal({ isOpen, onClose, dontShowAgain }: WhatsNewModalProps) {
  // Prendi la versione corrente dal VERSION_HISTORY
  const currentVersionData = VERSION_HISTORY.find(v => v.version === APP_VERSION) || VERSION_HISTORY[0];

  if (!isOpen) return null;

  const getVersionIcon = (type: string) => {
    switch (type) {
      case 'major': return '🚀';
      case 'minor': return '✨';
      case 'patch': return '🔧';
      default: return '📦';
    }
  };

  const getVersionColor = (type: string) => {
    switch (type) {
      case 'major': return 'from-ember-500 to-flame-500';
      case 'minor': return 'from-sage-500 to-ocean-500';
      case 'patch': return 'from-ocean-500 to-ember-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getVersionTypeLabel = (type: string) => {
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
        variant="glass"
        className="overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] [html:not(.dark)_&]:before:from-black/[0.03] before:to-transparent before:pointer-events-none"
      >
        {/* Header con gradiente */}
        <div className={`relative bg-gradient-to-r ${getVersionColor(currentVersionData.type)} p-8 text-white z-10`}>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <Text as="span" className="text-5xl drop-shadow-lg">{getVersionIcon(currentVersionData.type)}</Text>
              <div>
                <Heading level={2} size="3xl" className="text-white">Novità!</Heading>
                <Text size="sm" className="text-white/90 mt-1">{getVersionTypeLabel(currentVersionData.type)}</Text>
              </div>
            </div>

            {/* Close button usando ActionButton */}
            <div className="bg-white/20 rounded-full">
              <ActionButton
                icon={<X className="text-white" />}
                variant="ghost"
                size="md"
                onClick={onClose}
                ariaLabel="Chiudi"
                className="bg-transparent hover:bg-white/20 ring-0"
              />
            </div>
          </div>

          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full relative z-10">
            <Text as="span" size="sm" weight="semibold" className="text-white">Versione {APP_VERSION}</Text>
            <Text as="span" size="xs" className="text-white/75">
              {new Date(currentVersionData.date).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)] relative z-10">
          <Heading level={3} size="xl" className="mb-4">Cosa c&apos;è di nuovo?</Heading>

          <ul className="space-y-3">
            {currentVersionData.changes.map((change, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <Text as="span" variant="sage" className="mt-1 group-hover:scale-125 transition-transform duration-200">✓</Text>
                <Text variant="secondary" className="flex-1">{change}</Text>
              </li>
            ))}
          </ul>

          {/* Link al changelog completo */}
          <div className="mt-6 p-4 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100 rounded-xl">
            <Link
              href="/changelog"
              onClick={onClose}
              className="flex items-center justify-between group hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-200 p-2 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <Text as="span" className="text-2xl">📋</Text>
                <Text as="span" variant="secondary" size="sm" weight="medium" className="group-hover:text-ember-400 [html:not(.dark)_&]:group-hover:text-ember-600">
                  Vedi changelog completo
                </Text>
              </div>
              <Text as="span" variant="tertiary" className="group-hover:text-ember-400 [html:not(.dark)_&]:group-hover:text-ember-600 group-hover:translate-x-1 transition-all duration-200">→</Text>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100/80 backdrop-blur-sm border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between relative z-10">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  dontShowAgain();
                }
              }}
              className="w-4 h-4 text-ember-600 border-slate-600 [html:not(.dark)_&]:border-slate-300 rounded focus:ring-ember-500"
            />
            <Text as="span" variant="tertiary" size="sm" className="group-hover:text-slate-200 [html:not(.dark)_&]:group-hover:text-slate-900">
              Non mostrare più per questa versione
            </Text>
          </label>

          <Button
            variant="ember"
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
