'use client';

import { Card, Button } from '@/app/components/ui';

export default function NetatmoAuthCard() {
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI;
    const scope = 'read_thermostat write_thermostat';

    if (!clientId || !redirectUri) {
      alert('Configurazione Netatmo mancante. Verifica le variabili d\'ambiente.');
      return;
    }

    const authUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=random_state`;

    window.location.href = authUrl;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Card className="p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-info-100 to-info-200 rounded-3xl flex items-center justify-center">
            <span className="text-4xl">🌡️</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          Connetti Netatmo
        </h2>

        {/* Description */}
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Collega il tuo account Netatmo per controllare le temperature di tutte le stanze,
          gestire le valvole termostatiche e creare automazioni intelligenti con la stufa.
        </p>

        {/* Features */}
        <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
          <p className="text-sm font-semibold text-neutral-900 mb-3">
            Cosa puoi fare:
          </p>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="text-success-600 mt-0.5">✓</span>
              <span>Visualizzare temperature real-time di tutte le stanze</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success-600 mt-0.5">✓</span>
              <span>Controllare setpoint temperatura per ogni stanza</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success-600 mt-0.5">✓</span>
              <span>Gestire modalità riscaldamento globale</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success-600 mt-0.5">✓</span>
              <span>Creare automazioni stufa ↔ valvole (prossimamente)</span>
            </li>
          </ul>
        </div>

        {/* Connect Button */}
        <Button
          variant="primary"
          onClick={handleConnect}
          className="w-full sm:w-auto px-8"
        >
          🔗 Connetti con Netatmo
        </Button>

        {/* Info */}
        <p className="text-xs text-neutral-500 mt-6">
          Verrai reindirizzato al sito Netatmo per autorizzare l&apos;accesso.
          Nessuna password viene salvata, solo un token sicuro.
        </p>
      </Card>
    </div>
  );
}
