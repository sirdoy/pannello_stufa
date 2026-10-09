'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, Heading, Text } from '@/app/components/ui';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

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
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Automazioni Philips Hue"
        description="Controlla automaticamente le luci in base a orari, presenza e condizioni"
        backHref="/lights"
      />

      {/* Coming Soon Notice */}
      <Card className="mb-8 border-2 border-ocean-300 border-ocean-700 bg-linear-to-br from-ocean-50 from-ocean-900/20 to-ocean-100 to-ocean-800/20 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-6xl">🚧</div>
          <Heading level={2} size="lg" className="mb-2">
            Funzionalità in Arrivo - Fase 2
          </Heading>
          <Text variant="secondary" className="mb-6 max-w-2xl">
            Le automazioni saranno disponibili nella prossima fase di sviluppo. Potrai creare regole personalizzate per controllare automaticamente le tue luci Philips Hue.
          </Text>
          <div className="flex gap-3">
            <Button
              variant="ember"
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {futureFeatures.map((feature, index) => (
            <Card
              key={index}
              className="p-6 opacity-60 transition-opacity hover:opacity-100"
            >
              <div className="mb-3 text-4xl">{feature.icon}</div>
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
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-sage-500">✓</span>
                <Text variant="secondary" size="sm" as="span">Controllo manuale di tutte le luci e stanze</Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-sage-500">✓</span>
                <Text variant="secondary" size="sm" as="span">Attivazione rapida delle scene create nell&apos;app Philips Hue</Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-sage-500">✓</span>
                <Text variant="secondary" size="sm" as="span">Regolazione luminosità e colore per ogni stanza</Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-warning-500">⏳</span>
                <Text variant="secondary" size="sm" as="span">Usa l&apos;app ufficiale Philips Hue per automazioni avanzate temporanee</Text>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
