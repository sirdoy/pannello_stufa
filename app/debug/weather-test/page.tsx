'use client';

import { useState } from 'react';
import { WeatherCard } from '@/app/components/weather';
import { PageLayout } from '@/app/components/ui';
import { Button } from '@/app/components/ui';

type TestState = 'loading' | 'error' | 'data';

// Mock weather data matching API response shape
const mockWeatherData = {
  current: {
    temperature: 18.5,
    feelsLike: 16.2,
    humidity: 65,
    windSpeed: 12,
    condition: { description: 'Parzialmente nuvoloso', code: 2 },
  },
  forecast: [
    { date: '2026-02-02', tempMax: 19.5, tempMin: 12.3, condition: { description: 'Sereno', icon: '01' }, weatherCode: 0, precipChance: 5, uvIndex: 4, airQuality: 28 },
    { date: '2026-02-03', tempMax: 21.0, tempMin: 14.5, condition: { description: 'Parzialmente nuvoloso', icon: '03' }, weatherCode: 2, precipChance: 15, uvIndex: 5, airQuality: 35 },
    { date: '2026-02-04', tempMax: 18.2, tempMin: 11.8, condition: { description: 'Pioggia leggera', icon: '10' }, weatherCode: 61, precipChance: 70, uvIndex: 2, airQuality: 22 },
    { date: '2026-02-05', tempMax: 15.0, tempMin: 9.5, condition: { description: 'Pioggia moderata', icon: '10' }, weatherCode: 63, precipChance: 85, uvIndex: 1, airQuality: 18 },
    { date: '2026-02-06', tempMax: 17.5, tempMin: 10.2, condition: { description: 'Nuvoloso', icon: '04' }, weatherCode: 3, precipChance: 20, uvIndex: 3, airQuality: 42 },
  ],
  cachedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  stale: false,
};

export default function WeatherTestPage() {
  const [state, setState] = useState<TestState>('data');

  return (
    <PageLayout title="Weather Card Test">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={state === 'loading' ? 'ember' : 'outline'}
            onClick={() => setState('loading')}
          >
            Loading
          </Button>
          <Button
            variant={state === 'error' ? 'ember' : 'outline'}
            onClick={() => setState('error')}
          >
            Error
          </Button>
          <Button
            variant={state === 'data' ? 'ember' : 'outline'}
            onClick={() => setState('data')}
          >
            Data
          </Button>
        </div>

        <WeatherCard
          weatherData={state === 'data' ? mockWeatherData : null}
          indoorTemp={20.5}
          isLoading={state === 'loading'}
          error={state === 'error' ? new Error('Connessione non riuscita') : null}
          onRetry={() => setState('loading')}
        />
      </div>
    </PageLayout>
  );
}
