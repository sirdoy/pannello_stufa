'use client';

import { useState } from 'react';
import TransitionLink from '@/app/components/TransitionLink';
import { usePageTransition, TRANSITION_TYPES } from '@/app/context/PageTransitionContext';
import { ArrowLeft, Check, Sparkles, Zap, Waves, Layers, Slash } from 'lucide-react';
import { Heading, Text, Card, Banner } from '@/app/components/ui';
import PageLayout from '@/app/components/ui/PageLayout';
import type { ReactNode } from 'react';

type TransitionType = typeof TRANSITION_TYPES[keyof typeof TRANSITION_TYPES];

interface TransitionConfig {
  type: TransitionType;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
}

interface DemoPage {
  href: string;
  label: string;
}

/**
 * Transitions Demo Page - Test cinematographic page transitions
 *
 * Questa pagina mostra tutti i tipi di transizioni disponibili
 * con esempi pratici e configurazione live.
 */
export default function TransitionsDebugPage() {
  const { transitionType, setTransitionType, direction, isTransitioning } = usePageTransition();
  const [selectedType, setSelectedType] = useState<TransitionType>(transitionType);

  const transitionsList: TransitionConfig[] = [
    {
      type: TRANSITION_TYPES.SLIDE_MORPH,
      name: 'Slide Morph',
      description: 'Slide laterale + scale + blur (iOS-style)',
      icon: <ArrowLeft className="size-6" />,
      color: 'ember',
    },
    {
      type: TRANSITION_TYPES.FADE_SCALE,
      name: 'Fade Scale',
      description: 'Zoom gentile con fade',
      icon: <Sparkles className="size-6" />,
      color: 'sage',
    },
    {
      type: TRANSITION_TYPES.EMBER_BURST,
      name: 'Ember Burst',
      description: 'Esplosione ember glow (spettacolare!)',
      icon: <Zap className="size-6" />,
      color: 'flame',
    },
    {
      type: TRANSITION_TYPES.LIQUID_FLOW,
      name: 'Liquid Flow',
      description: 'Flow liquido verticale',
      icon: <Waves className="size-6" />,
      color: 'ocean',
    },
    {
      type: TRANSITION_TYPES.STACK_LIFT,
      name: 'Stack Lift',
      description: 'Card lift con rotazione 3D',
      icon: <Layers className="size-6" />,
      color: 'ember',
    },
    {
      type: TRANSITION_TYPES.DIAGONAL_SWEEP,
      name: 'Diagonal Sweep',
      description: 'Wipe diagonale cinematografico',
      icon: <Slash className="size-6" />,
      color: 'flame',
    },
  ];

  const handleChangeType = (type: TransitionType): void => {
    setSelectedType(type);
    setTransitionType(type);
  };

  const demoPages: DemoPage[] = [
    { href: '/', label: 'Home' },
    { href: '/stove', label: 'Stufa' },
    { href: '/stove/scheduler', label: 'Scheduler' },
    { href: '/thermostat', label: 'Termostato' },
    { href: '/lights', label: 'Luci' },
    { href: '/settings/theme', label: 'Tema' },
  ];

  return (
    <PageLayout
      maxWidth="7xl"
      header={
        <PageLayout.Header
          title="Page Transitions Demo"
          description="Sistema di transizioni cinematografiche con View Transitions API + CSS fallback"
          backHref="/debug"
        />
      }
    >
      <div className="space-y-8">

      {/* Current Status */}
      <Card glow className="border-2 border-ember-500/20 p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`
              size-3 rounded-full
              ${isTransitioning ? 'animate-pulse-ember bg-ember-400' : 'bg-sage-400'}
            `} />
            <Text>
              Status: {isTransitioning ? 'Transitioning...' : 'Ready'}
            </Text>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Text variant="tertiary" className="mb-1">Transition Type:</Text>
              <Text className="text-ember-400">
                {selectedType}
              </Text>
            </div>
            <div>
              <Text variant="tertiary" className="mb-1">Direction:</Text>
              <Text className="text-ember-400">
                {direction}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Transition Types */}
      <div className="space-y-4">
        <Heading level={2}>Tipi di Transizione</Heading>
        <Text variant="tertiary">
          Seleziona un tipo di transizione, poi clicca su una delle pagine demo sotto
        </Text>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transitionsList.map((transition) => (
            <button
              key={transition.type}
              onClick={() => handleChangeType(transition.type)}
              className={`
                group
                relative
                rounded-2xl
                border-2
                p-6 text-left
                transition-all
                duration-300
                ${selectedType === transition.type
                  ? `
                    bg-${transition.color}-500/15
                    border-${transition.color}-500/50
                    shadow-glow-primary
                  `
                  : `
                    border-white/6
                    bg-white/3
                    hover:border-white/12
                    hover:bg-white/6
                    
                    
                  `
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  rounded-xl p-3
                  ${selectedType === transition.type
                    ? `bg-${transition.color}-400/20 text-${transition.color}-400`
                    : 'bg-white/6 text-(--text-2) group-hover:text-(--text-1)'
                  }
                  transition-colors
                `}>
                  {transition.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <Text className="mb-1">
                    {transition.name}
                  </Text>
                  <Text variant="tertiary" className="text-sm">
                    {transition.description}
                  </Text>
                </div>
              </div>

              {selectedType === transition.type && (
                <div className="
                  absolute -top-2 -right-2
                  flex size-6
                  items-center
                  justify-center
                  rounded-full bg-ember-500 text-xs
                  text-white shadow-ember-glow-sm
                ">
                  <Check size={14} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Pages */}
      <div className="space-y-4">
        <Heading level={2}>Test su Pagine Reali</Heading>
        <Text variant="tertiary">
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
                card-ember
                relative
                overflow-hidden
                p-6
                transition-all
                duration-300 hover:scale-102
                hover:shadow-card-hover
              "
            >
              {/* Background gradient on hover */}
              <div className="
                absolute inset-0
                bg-ember-500/5
                opacity-0 transition-opacity
                duration-300 group-hover:opacity-100
              "/>

              <div className="relative flex items-center gap-4">
                <div>
                  <Text className="mb-1">
                    {page.label}
                  </Text>
                  <Text variant="tertiary" className="text-sm">
                    {page.href}
                  </Text>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="
                absolute right-4 bottom-4
                translate-x-2 transform
                opacity-0 transition-all duration-300
                group-hover:translate-x-0 group-hover:opacity-100
              ">
                <ArrowLeft className="size-5 rotate-180 text-ember-400" />
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>

      {/* Browser Support Info */}
      <Banner
        variant="info"
        title="Browser Support"
      >
        <div className="mt-2 space-y-2 text-sm">
          <Text className="text-ocean-300">
            <strong className="text-ember-400">View Transitions API nativa:</strong> Chrome 111+, Edge 111+, Safari 18+
          </Text>
          <Text className="text-ocean-300">
            <strong className="text-ember-400">CSS Fallback:</strong> Tutti i browser moderni
          </Text>
          <Text className="text-ocean-300">
            <strong className="text-ember-400">Accessibilita:</strong> Rispetta automaticamente prefers-reduced-motion
          </Text>
        </div>
      </Banner>

      {/* Implementation Example */}
      <div className="space-y-4">
        <Heading level={2}>Come Usare</Heading>

        <Card variant="subtle" className="space-y-4 p-6">
          <div>
            <Text className="mb-2 text-ember-400">
              1. Import TransitionLink
            </Text>
            <pre className="overflow-x-auto rounded-xl bg-black/30 p-4 text-sm">
              <code className="text-sage-300">
{`import TransitionLink from '@/app/components/TransitionLink';`}
              </code>
            </pre>
          </div>

          <div>
            <Text className="mb-2 text-ember-400">
              2. Usa al posto di Link
            </Text>
            <pre className="overflow-x-auto rounded-xl bg-black/30 p-4 text-sm">
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
            <Text className="mb-2 text-ember-400">
              3. Cambia transizione globalmente
            </Text>
            <pre className="overflow-x-auto rounded-xl bg-black/30 p-4 text-sm">
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
