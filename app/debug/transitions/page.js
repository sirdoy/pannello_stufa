'use client';

import { useState } from 'react';
import TransitionLink from '@/app/components/TransitionLink';
import { usePageTransition, TRANSITION_TYPES } from '@/app/context/PageTransitionContext';
import { ArrowLeft, Sparkles, Zap, Waves, Layers, Slash } from 'lucide-react';
import { Heading, Text, Card, Banner } from '@/app/components/ui';
import PageLayout from '@/app/components/ui/PageLayout';

/**
 * Transitions Demo Page - Test cinematographic page transitions
 *
 * Questa pagina mostra tutti i tipi di transizioni disponibili
 * con esempi pratici e configurazione live.
 */
export default function TransitionsDebugPage() {
  const { transitionType, setTransitionType, direction, isTransitioning } = usePageTransition();
  const [selectedType, setSelectedType] = useState(transitionType);

  const transitionsList = [
    {
      type: TRANSITION_TYPES.SLIDE_MORPH,
      name: 'Slide Morph',
      description: 'Slide laterale + scale + blur (iOS-style)',
      icon: <ArrowLeft className="w-6 h-6" />,
      color: 'ember',
    },
    {
      type: TRANSITION_TYPES.FADE_SCALE,
      name: 'Fade Scale',
      description: 'Zoom gentile con fade',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'sage',
    },
    {
      type: TRANSITION_TYPES.EMBER_BURST,
      name: 'Ember Burst',
      description: 'Esplosione ember glow (spettacolare!)',
      icon: <Zap className="w-6 h-6" />,
      color: 'flame',
    },
    {
      type: TRANSITION_TYPES.LIQUID_FLOW,
      name: 'Liquid Flow',
      description: 'Flow liquido verticale',
      icon: <Waves className="w-6 h-6" />,
      color: 'ocean',
    },
    {
      type: TRANSITION_TYPES.STACK_LIFT,
      name: 'Stack Lift',
      description: 'Card lift con rotazione 3D',
      icon: <Layers className="w-6 h-6" />,
      color: 'ember',
    },
    {
      type: TRANSITION_TYPES.DIAGONAL_SWEEP,
      name: 'Diagonal Sweep',
      description: 'Wipe diagonale cinematografico',
      icon: <Slash className="w-6 h-6" />,
      color: 'flame',
    },
  ];

  const handleChangeType = (type) => {
    setSelectedType(type);
    setTransitionType(type);
  };

  const demoPages = [
    { href: '/', label: 'Home', emoji: '🏠' },
    { href: '/stove', label: 'Stufa', emoji: '🔥' },
    { href: '/stove/scheduler', label: 'Scheduler', emoji: '⏰' },
    { href: '/thermostat', label: 'Termostato', emoji: '🌡️' },
    { href: '/lights', label: 'Luci', emoji: '💡' },
    { href: '/settings/theme', label: 'Tema', emoji: '🎨' },
  ];

  return (
    <PageLayout maxWidth="4xl">
      <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <TransitionLink
          href="/debug"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-ember-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <Text>Torna a Debug</Text>
        </TransitionLink>

        <div>
          <Heading level={1} className="mb-2">
            🎬 Page Transitions Demo
          </Heading>
          <Text variant="muted">
            Sistema di transizioni cinematografiche con View Transitions API + CSS fallback
          </Text>
        </div>
      </div>

      {/* Current Status */}
      <Card glow className="p-6 border-2 border-ember-500/20">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full
              ${isTransitioning ? 'bg-ember-400 animate-pulse-ember' : 'bg-sage-400'}
            `} />
            <Text weight="semibold">
              Status: {isTransitioning ? 'Transitioning...' : 'Ready'}
            </Text>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Text variant="muted" className="mb-1">Transition Type:</Text>
              <Text weight="semibold" className="text-ember-400">
                {selectedType}
              </Text>
            </div>
            <div>
              <Text variant="muted" className="mb-1">Direction:</Text>
              <Text weight="semibold" className="text-ember-400">
                {direction}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Transition Types */}
      <div className="space-y-4">
        <Heading level={2}>Tipi di Transizione</Heading>
        <Text variant="muted">
          Seleziona un tipo di transizione, poi clicca su una delle pagine demo sotto
        </Text>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transitionsList.map((transition) => (
            <button
              key={transition.type}
              onClick={() => handleChangeType(transition.type)}
              className={`
                relative
                p-6
                rounded-2xl
                text-left
                transition-all duration-300
                border-2
                group
                ${selectedType === transition.type
                  ? `
                    bg-${transition.color}-500/15
                    border-${transition.color}-500/50
                    shadow-glow-primary
                  `
                  : `
                    bg-white/[0.03]
                    border-white/[0.06]
                    hover:bg-white/[0.06]
                    hover:border-white/[0.12]
                    [html:not(.dark)_&]:bg-black/[0.02]
                    [html:not(.dark)_&]:border-black/[0.06]
                  `
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  p-3 rounded-xl
                  ${selectedType === transition.type
                    ? `bg-${transition.color}-400/20 text-${transition.color}-400`
                    : 'bg-white/[0.06] text-slate-400 group-hover:text-slate-300'
                  }
                  transition-colors
                `}>
                  {transition.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <Text weight="semibold" className="mb-1">
                    {transition.name}
                  </Text>
                  <Text variant="muted" className="text-sm">
                    {transition.description}
                  </Text>
                </div>
              </div>

              {selectedType === transition.type && (
                <div className="
                  absolute -top-2 -right-2
                  w-6 h-6
                  bg-ember-500
                  rounded-full
                  flex items-center justify-center
                  text-white text-xs
                  shadow-ember-glow-sm
                ">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Pages */}
      <div className="space-y-4">
        <Heading level={2}>Test su Pagine Reali</Heading>
        <Text variant="muted">
          Clicca su una pagina per vedere la transizione &quot;{selectedType}&quot; in azione
        </Text>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoPages.map((page) => (
            <TransitionLink
              key={page.href}
              href={page.href}
              transitionType={selectedType}
              className="
                group
                relative
                card-ember
                p-6
                hover:shadow-card-hover
                hover:scale-[1.02]
                transition-all duration-300
                overflow-hidden
              "
            >
              {/* Background gradient on hover */}
              <div className="
                absolute inset-0
                bg-gradient-to-br from-ember-500/5 to-flame-500/5
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
              " />

              <div className="relative flex items-center gap-4">
                <div className="text-4xl">
                  {page.emoji}
                </div>
                <div>
                  <Text weight="semibold" className="mb-1">
                    {page.label}
                  </Text>
                  <Text variant="muted" className="text-sm">
                    {page.href}
                  </Text>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="
                absolute bottom-4 right-4
                opacity-0 group-hover:opacity-100
                transform translate-x-2 group-hover:translate-x-0
                transition-all duration-300
              ">
                <ArrowLeft className="w-5 h-5 text-ember-400 rotate-180" />
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>

      {/* Browser Support Info */}
      <Banner
        variant="info"
        icon="ℹ️"
        title="Browser Support"
      >
        <div className="space-y-2 text-sm mt-2">
          <Text className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">
            <strong className="text-ember-400">View Transitions API nativa:</strong> Chrome 111+, Edge 111+, Safari 18+
          </Text>
          <Text className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">
            <strong className="text-ember-400">CSS Fallback:</strong> Tutti i browser moderni
          </Text>
          <Text className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">
            <strong className="text-ember-400">Accessibilita:</strong> Rispetta automaticamente prefers-reduced-motion
          </Text>
        </div>
      </Banner>

      {/* Implementation Example */}
      <div className="space-y-4">
        <Heading level={2}>Come Usare</Heading>

        <Card variant="subtle" className="p-6 space-y-4">
          <div>
            <Text weight="semibold" className="mb-2 text-ember-400">
              1. Import TransitionLink
            </Text>
            <pre className="bg-slate-950/50 p-4 rounded-xl overflow-x-auto text-sm">
              <code className="text-sage-300">
{`import TransitionLink from '@/app/components/TransitionLink';`}
              </code>
            </pre>
          </div>

          <div>
            <Text weight="semibold" className="mb-2 text-ember-400">
              2. Usa al posto di Link
            </Text>
            <pre className="bg-slate-950/50 p-4 rounded-xl overflow-x-auto text-sm">
              <code className="text-sage-300">
{`// Default transition (slide-morph)
<TransitionLink href="/stove">
  Go to Stove
</TransitionLink>

// Custom transition
<TransitionLink
  href="/stove"
  transitionType="ember-burst"
>
  Go to Stove with Ember Burst
</TransitionLink>`}
              </code>
            </pre>
          </div>

          <div>
            <Text weight="semibold" className="mb-2 text-ember-400">
              3. Cambia transizione globalmente
            </Text>
            <pre className="bg-slate-950/50 p-4 rounded-xl overflow-x-auto text-sm">
              <code className="text-sage-300">
{`import { usePageTransition, TRANSITION_TYPES } from '@/app/context/PageTransitionContext';

const { setTransitionType } = usePageTransition();

// Cambia tipo di transizione
setTransitionType(TRANSITION_TYPES.EMBER_BURST);`}
              </code>
            </pre>
          </div>
        </Card>
      </div>
      </div>
    </PageLayout>
  );
}
