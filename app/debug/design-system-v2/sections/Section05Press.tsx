'use client';

import React from 'react';
import { Pressable } from '@/app/components/EmberGlass';

export function Section05Press(): React.ReactElement {
  return (
    <section aria-labelledby="sec-05-heading" style={{ marginBottom: 48 }}>
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
        05 / PRESS
      </p>
      <h2
        id="sec-05-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text-1)',
          margin: '4px 0 8px 0',
        }}
      >
        Animazione di pressione
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-2)',
          marginBottom: 16,
        }}
      >
        Tap o clicca per vedere scale(0.97) ↔ scale(1) con cubic-bezier(.34,1.56,.64,1) su 220ms
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Pressable
          as="div"
          data-testid="press-card-demo"
          className="glass-surface"
          style={{
            aspectRatio: '1 / 1',
            display: 'grid',
            placeItems: 'center',
            touchAction: 'manipulation',
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text-1)',
            }}
          >
            Card
          </span>
        </Pressable>
        <Pressable
          as="button"
          type="button"
          className="glass-surface press-anim"
          style={{
            height: 56,
            border: 0,
            color: 'var(--text-1)',
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          aria-label="Esempio bottone pressabile"
        >
          Pressable button
        </Pressable>
        <Pressable
          as="div"
          className="glass-surface"
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            justifySelf: 'center',
            touchAction: 'manipulation',
          }}
        />
      </div>
    </section>
  );
}
