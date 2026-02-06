'use client';

import { Card, Button, Heading, Text } from '@/app/components/ui';
import { getNetatmoAuthUrl } from '@/lib/netatmoCredentials';

export default function NetatmoAuthCard() {
  const handleConnect = () => {
    window.location.href = getNetatmoAuthUrl('netatmo_auth');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card className="p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-ocean-900/40 [html:not(.dark)_&]:from-ocean-100 to-ocean-800/40 [html:not(.dark)_&]:to-ocean-200 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">🌡️</span>
          </div>
        </div>

        {/* Title */}
        <Heading level={2} size="2xl" className="mb-3">
          Connetti Netatmo
        </Heading>

        {/* Description */}
        <Text variant="secondary" className="mb-6 leading-relaxed">
          Collega il tuo account Netatmo per controllare le temperature di tutte le stanze,
          gestire le valvole termostatiche e creare automazioni intelligenti con la stufa.
        </Text>

        {/* Features */}
        <div className="bg-slate-800/60 [html:not(.dark)_&]:bg-slate-50 rounded-2xl p-6 mb-8 text-left">
          <Text variant="body" size="sm" weight="semibold" className="mb-3">
            Cosa puoi fare:
          </Text>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Text variant="sage" size="sm" as="span" className="mt-0.5">✓</Text>
              <Text variant="secondary" size="sm" as="span">Visualizzare temperature real-time di tutte le stanze</Text>
            </li>
            <li className="flex items-start gap-2">
              <Text variant="sage" size="sm" as="span" className="mt-0.5">✓</Text>
              <Text variant="secondary" size="sm" as="span">Controllare setpoint temperatura per ogni stanza</Text>
            </li>
            <li className="flex items-start gap-2">
              <Text variant="sage" size="sm" as="span" className="mt-0.5">✓</Text>
              <Text variant="secondary" size="sm" as="span">Gestire modalità riscaldamento globale</Text>
            </li>
            <li className="flex items-start gap-2">
              <Text variant="sage" size="sm" as="span" className="mt-0.5">✓</Text>
              <Text variant="secondary" size="sm" as="span">Creare automazioni stufa ↔ valvole (prossimamente)</Text>
            </li>
            <li className="flex items-start gap-2">
              <Text variant="sage" size="sm" as="span" className="mt-0.5">✓</Text>
              <Text variant="secondary" size="sm" as="span">Visualizzare videocamere Welcome/Presence e eventi</Text>
            </li>
          </ul>
        </div>

        {/* Connect Button */}
        <Button
          variant="ember"
          onClick={handleConnect}
          className="w-full sm:w-auto px-8"
        >
          🔗 Connetti con Netatmo
        </Button>

        {/* Info */}
        <Text variant="tertiary" size="xs" className="mt-6">
          Verrai reindirizzato al sito Netatmo per autorizzare l&apos;accesso.
          Nessuna password viene salvata, solo un token sicuro.
        </Text>
      </Card>
    </div>
  );
}
