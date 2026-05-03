'use client';
/**
 * Section08CardPrimitives — Phase 182 (DSREF-01, DSREF-02)
 *
 * 8 card primitive samples per SC-#1: GlassCard, CardHead, StatusDot,
 * InlineToggle, CircBtn, MiniStat, FlameViz, PlayingBars. Each sub-block
 * follows the D-11 fixed layout: name → description → live sample →
 * CodeSnippet. Inline-style + var(--token) discipline (D-02).
 *
 * Section number 08 per the orchestrator's research_reconciliation override
 * (existing page sections are 01-07; CONTEXT.md D-10 said "06/CARDS" but
 * those IDs collide with the existing sec-06-heading SHEET section).
 */
import React, { useState } from 'react';
import {
  GlassCard,
  CardHead,
  StatusDot,
  InlineToggle,
  CircBtn,
  MiniStat,
  FlameViz,
  PlayingBars,
} from '@/app/components/EmberGlass';
import { Flame, Plus, Minus } from 'lucide-react';
import { CodeSnippet } from './CodeSnippet';

export function Section08CardPrimitives(): React.ReactElement {
  // Isolated useState per stateful primitive — do NOT share state across primitives.
  const [toggleOn, setToggleOn] = useState(false);
  const [statusOn, setStatusOn] = useState(true);
  const [flameOn, setFlameOn] = useState(true);
  const [circBtnClicks, setCircBtnClicks] = useState(0);

  return (
    <section aria-labelledby="sec-08-heading" style={{ marginBottom: 48 }}>
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
        08 / CARDS
      </p>
      <h2
        id="sec-08-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.2,
          color: 'var(--text-1)',
          margin: '4px 0 8px',
        }}
      >
        Primitive carta
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 400,
          color: 'var(--text-2)',
          marginBottom: 24,
        }}
      >
        Componenti delle dashboard card
      </p>

      {/* === 1. GlassCard === */}
      <SubBlock
        name="GlassCard"
        description="Superficie 1:1 vetro, riceve tone wash e gestisce press scale via Pressable interno."
        sample={
          <GlassCard
            tone="var(--accent)"
            onOpen={() => undefined}
            style={{ width: 140, height: 140 }}
          >
            <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />
          </GlassCard>
        }
        code={
          '<GlassCard tone="var(--accent)" onOpen={() => openSheet()}>\n  <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />\n</GlassCard>'
        }
      />

      {/* === 2. CardHead === */}
      <SubBlock
        name="CardHead"
        description="Riga superiore card: icon tile colorato + label e slot destro opzionale."
        sample={
          <div style={{ width: 220 }}>
            <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />
          </div>
        }
        code={'<CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />'}
      />

      {/* === 3. StatusDot === */}
      <SubBlock
        name="StatusDot"
        description="Pallino di stato 8x8, glow attivo quando on. Color default var(--accent)."
        sample={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              aria-label={statusOn ? 'Set status off' : 'Set status on'}
              onClick={() => setStatusOn((v) => !v)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <StatusDot on={statusOn} color="var(--accent)" />
            </button>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-2)',
              }}
            >
              Click per togglare ({statusOn ? 'on' : 'off'})
            </span>
          </div>
        }
        code={'<StatusDot on={true} color="var(--accent)" />'}
      />

      {/* === 4. InlineToggle === */}
      <SubBlock
        name="InlineToggle"
        description="Switch inline 44x26, onChange riceve MouseEvent (NON boolean)."
        sample={
          <InlineToggle
            on={toggleOn}
            color="var(--accent)"
            onChange={(e) => {
              e.stopPropagation();
              setToggleOn((prev) => !prev);
            }}
          />
        }
        code={
          '<InlineToggle\n  on={on}\n  color="var(--accent)"\n  onChange={(e) => { e.stopPropagation(); setOn(prev => !prev); }}\n/>'
        }
      />

      {/* === 5. CircBtn === */}
      <SubBlock
        name="CircBtn"
        description="Pulsante circolare 34x34. Variante primary colorata da var(--accent)."
        sample={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CircBtn
              Icon={Plus}
              onClick={() => setCircBtnClicks((n) => n + 1)}
              primary
              tone="var(--accent)"
            />
            <CircBtn
              Icon={Minus}
              onClick={() => setCircBtnClicks((n) => n + 1)}
              tone="var(--accent)"
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-2)',
              }}
            >
              click count: {circBtnClicks}
            </span>
          </div>
        }
        code={
          '<CircBtn Icon={Plus} primary tone="var(--accent)" onClick={() => bump()} />\n<CircBtn Icon={Minus} tone="var(--accent)" onClick={() => bump()} />'
        }
      />

      {/* === 6. MiniStat === */}
      <SubBlock
        name="MiniStat"
        description="Stat compatta con label, valore e barra 0..1."
        sample={
          <div style={{ width: 140 }}>
            <MiniStat label="Potenza" value="3 / 5" bar={0.6} />
          </div>
        }
        code={'<MiniStat label="Potenza" value="3 / 5" bar={0.6} />'}
      />

      {/* === 7. FlameViz === */}
      <SubBlock
        name="FlameViz"
        description="Animazione fiamma 1:1 per la stufa, intensity 0..1 (default 0.6)."
        sample={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              aria-label={flameOn ? 'Spegni fiamma' : 'Accendi fiamma'}
              onClick={() => setFlameOn((v) => !v)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <FlameViz on={flameOn} intensity={0.7} />
            </button>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-2)',
              }}
            >
              Click per togglare ({flameOn ? 'on' : 'off'})
            </span>
          </div>
        }
        code={'<FlameViz on={isAccesa} intensity={0.7} />'}
      />

      {/* === 8. PlayingBars === */}
      <SubBlock
        name="PlayingBars"
        description="Indicatore audio 3 barre animate (Sonos)."
        sample={<PlayingBars />}
        code={'<PlayingBars />'}
        isLast
      />
    </section>
  );
}

/**
 * Internal sub-block component — applies the D-11 fixed layout.
 * Not exported (page-internal pattern only).
 */
interface SubBlockProps {
  name: string;
  description: string;
  sample: React.ReactNode;
  code: string;
  isLast?: boolean;
}

function SubBlock({ name, description, sample, code, isLast }: SubBlockProps): React.ReactElement {
  return (
    <>
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 400,
            color: 'var(--text-2)',
            marginTop: 4,
          }}
        >
          {description}
        </p>
        <div style={{ marginTop: 16 }}>{sample}</div>
        <div style={{ marginTop: 12 }}>
          <CodeSnippet code={code} />
        </div>
      </div>
      {!isLast && (
        <hr
          style={{
            border: 0,
            borderTop: '0.5px solid var(--glass-border)',
            margin: '24px 0',
          }}
        />
      )}
    </>
  );
}
