'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, Heading, Text } from '@/app/components/ui';

/**
 * Automation Page - Philips Hue automation (Phase 2)
 * Placeholder for future automation features
 */
export default function AutomationPage() {
  const router = useRouter();

  const futureFeatures = [
    {
      icon: '⏰',
      title: 'Automazioni Temporizzate',
      description: 'Accendi e spegni le luci automaticamente in base all\'ora del giorno'
    },
    {
      icon: '🌅',
      title: 'Alba e Tramonto',
      description: 'Regola le luci in base ai tempi di alba e tramonto della tua posizione'
    },
    {
      icon: '🏠',
      title: 'Presenza',
      description: 'Automazioni basate sulla presenza in casa (geofencing)'
    },
    {
      icon: '🎭',
      title: 'Scene Dinamiche',
      description: 'Cambia automaticamente scene in base al momento della giornata'
    },
    {
      icon: '📱',
      title: 'Integrazione Sensori',
      description: 'Automazioni basate su sensori di movimento e luce'
    },
    {
      icon: '🔄',
      title: 'Routine',
      description: 'Crea routine complesse con più azioni in sequenza'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/lights')}
          size="sm"
          className="mb-4"
        >
          ← Indietro
        </Button>

        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          🤖 Automazioni Philips Hue
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Controlla automaticamente le luci in base a orari, presenza e condizioni
        </p>
      </div>

      {/* Coming Soon Notice */}
      <Card className="p-8 mb-8 bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20 border-2 border-info-300 dark:border-info-700">
        <div className="flex flex-col items-center text-center">
          <div className="text-6xl mb-4">🚧</div>
          <Heading level={2} size="lg" className="mb-2">
            Funzionalità in Arrivo - Fase 2
          </Heading>
          <Text variant="secondary" className="mb-6 max-w-2xl">
            Le automazioni saranno disponibili nella prossima fase di sviluppo. Potrai creare regole personalizzate per controllare automaticamente le tue luci Philips Hue.
          </Text>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => router.push('/lights')}
            >
              💡 Controlla Luci
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/lights/scenes')}
            >
              🎨 Vedi Scene
            </Button>
          </div>
        </div>
      </Card>

      {/* Future Features Grid */}
      <div className="mb-8">
        <Heading level={2} size="md" className="mb-4">
          Funzionalità Pianificate
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {futureFeatures.map((feature, index) => (
            <Card
              key={index}
              className="p-6 opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <Heading level={3} size="sm" className="mb-2">
                {feature.title}
              </Heading>
              <Text variant="secondary" size="sm">
                {feature.description}
              </Text>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Alternatives */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <Heading level={3} size="sm" className="mb-2">
              Nel Frattempo...
            </Heading>
            <Text variant="secondary" size="sm" className="mb-3">
              Puoi già utilizzare queste funzionalità:
            </Text>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-success-500 font-bold">✓</span>
                <span>Controllo manuale di tutte le luci e stanze</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500 font-bold">✓</span>
                <span>Attivazione rapida delle scene create nell&apos;app Philips Hue</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500 font-bold">✓</span>
                <span>Regolazione luminosità e colore per ogni stanza</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning-500 font-bold">⏳</span>
                <span>Usa l&apos;app ufficiale Philips Hue per automazioni avanzate temporanee</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
