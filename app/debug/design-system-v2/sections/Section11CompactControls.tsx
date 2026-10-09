'use client';

import React, { useState } from 'react';
import { Card, DeviceIcon, InlineSelect, RangeSlider, Text } from '@/app/components/ui';

const DEVICES = ['stove', 'thermostat', 'lights', 'camera', 'sonos', 'network', 'raspi', 'dirigera', 'tuya', 'weather'];

export function Section11CompactControls(): React.ReactElement {
  const [zone, setZone] = useState('sala');
  const [volume, setVolume] = useState(35);

  return (
    <section aria-labelledby="sec-11-heading" style={{ marginBottom: 48 }}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: 'var(--text-2)',
        }}
      >
        11 / CONTROLLI COMPATTI
      </p>
      <h2
        id="sec-11-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        InlineSelect, RangeSlider, DeviceIcon
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginBottom: 16 }}>
        I soli punti in cui si scrivono select e cursori nativi; le icone dei dispositivi vengono dall&apos;id
      </p>
      <Card variant="subtle" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {(['xs', 'sm', 'md'] as const).map((size) => (
            <InlineSelect
              key={size}
              size={size}
              aria-label={`Zona (${size})`}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              options={[
                { value: 'sala', label: 'Sala' },
                { value: 'cucina', label: 'Cucina' },
              ]}
            />
          ))}
          <InlineSelect aria-label="Disattivato" disabled defaultValue="" placeholder="Disattivato" options={[]} />
        </div>
        <div className="flex items-center gap-3">
          <RangeSlider
            aria-label="Volume di esempio"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1"
          />
          <Text as="span" variant="secondary" size="xs" className="min-w-8 text-right">{volume}%</Text>
        </div>
        <div className="flex flex-wrap gap-4">
          {DEVICES.map((device) => (
            <DeviceIcon key={device} device={device} className="text-(--text-2)" />
          ))}
        </div>
      </Card>
    </section>
  );
}
