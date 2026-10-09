'use client';

import { useRouter } from 'next/navigation';
import { Check, Clock, Construction, Drama, Home, Hourglass, Lightbulb, Palette, RefreshCw, Smartphone, Sunrise } from 'lucide-react';
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
      icon: Clock,
      title: 'Automazioni Temporizzate',
      description: 'Accendi e spegni le luci automaticamente in base all\'ora del giorno'
    },
    {
      icon: Sunrise,
      title: 'Alba e Tramonto',
      description: 'Regola le luci in base ai tempi di alba e tramonto della tua posizione'
    },
    {
      icon: Home,
      title: 'Presenza',
      description: 'Automazioni basate sulla presenza in casa (geofencing)'
    },
    {
      icon: Drama,
      title: 'Scene Dinamiche',
      description: 'Cambia automaticamente scene in base al momento della giornata'
    },
    {
      icon: Smartphone,
      title: 'Integrazione Sensori',
      description: 'Automazioni basate su sensori di movimento e luce'
    },
    {
      icon: RefreshCw,
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
      <Card className="mb-8 p-8">
        <div className="flex flex-col items-center text-center">
          <Construction size={32} className="mb-4 text-warning-400" aria-hidden="true" />
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
              icon={<Lightbulb size={16} />}
            >
              Controlla Luci
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/lights/scenes')}
              icon={<Palette size={16} />}
            >
              Vedi Scene
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
              <feature.icon size={24} className="mb-3 text-(--text-2)" aria-hidden="true" />
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
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-(--text-2)" aria-hidden="true" />
          <div>
            <Heading level={3} size="sm" className="mb-2">
              Nel Frattempo...
            </Heading>
            <Text variant="secondary" size="sm" className="mb-3">
              Puoi già utilizzare queste funzionalità:
            </Text>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-sage-500" aria-hidden="true" />
                <Text variant="secondary" size="sm" as="span">Controllo manuale di tutte le luci e stanze</Text>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-sage-500" aria-hidden="true" />
                <Text variant="secondary" size="sm" as="span">Attivazione rapida delle scene create nell&apos;app Philips Hue</Text>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-sage-500" aria-hidden="true" />
                <Text variant="secondary" size="sm" as="span">Regolazione luminosità e colore per ogni stanza</Text>
              </li>
              <li className="flex items-start gap-2">
                <Hourglass size={16} className="mt-0.5 shrink-0 text-warning-500" aria-hidden="true" />
                <Text variant="secondary" size="sm" as="span">Usa l&apos;app ufficiale Philips Hue per automazioni avanzate temporanee</Text>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
