'use client';
/**
 * Section09SheetPrimitives — Phase 182 (DSREF-01, DSREF-02)
 *
 * 7 sheet primitive samples: SheetRow, Stepper, Slider, BigSlider, RadialDial,
 * SheetBtn, QuickActionButton. Each sub-block follows D-11 layout with
 * isolated useState per stateful primitive. Inline-style + var(--token).
 *
 * Section number 09 per orchestrator's research_reconciliation override.
 */
import React, { useState } from 'react';
import {
  SheetRow,
  Stepper,
  Slider,
  BigSlider,
  RadialDial,
  SheetBtn,
  QuickActionButton,
} from '@/app/components/EmberGlass';
import { Settings } from 'lucide-react';
import { CodeSnippet } from './CodeSnippet';

export function Section09SheetPrimitives(): React.ReactElement {
  // Isolated useState per stateful primitive.
  const [stepVal, setStepVal] = useState(3);
  const [sliderVal, setSliderVal] = useState(40);
  const [bigSliderVal, setBigSliderVal] = useState(72);
  const [dialVal, setDialVal] = useState(22);
  const [qabActive, setQabActive] = useState(false);

  return (
    <section aria-labelledby="sec-09-heading" style={{ marginBottom: 48 }}>
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
        09 / SHEET
      </p>
      <h2
        id="sec-09-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.2,
          color: 'var(--text-1)',
          margin: '4px 0 8px',
        }}
      >
        Primitive sheet
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
        Componenti dei pannelli a comparsa
      </p>

      {/* === 1. SheetRow === */}
      <SubBlock
        name="SheetRow"
        description="Riga sheet con label, value opzionale e slot children destro."
        sample={
          <SheetRow label="Stato" value="Acceso">
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-2)',
              }}
            >
              3 / 5
            </span>
          </SheetRow>
        }
        code={'<SheetRow label="Stato" value="Acceso">\n  <span>3 / 5</span>\n</SheetRow>'}
      />

      {/* === 2. Stepper === */}
      <SubBlock
        name="Stepper"
        description="Stepper +/- discreto, onChange emette numero raw."
        sample={<Stepper value={stepVal} min={1} max={5} onChange={setStepVal} />}
        code={'<Stepper value={pwr} min={1} max={5} onChange={setPwr} />'}
      />

      {/* === 3. Slider === */}
      <SubBlock
        name="Slider"
        description="Slider compatto 140px, default color var(--accent)."
        sample={
          <Slider
            value={sliderVal}
            min={0}
            max={100}
            onChange={setSliderVal}
          />
        }
        code={
          '<Slider value={vol} min={0} max={100} onChange={setVol} color="var(--accent)" />'
        }
      />

      {/* === 4. BigSlider === */}
      <SubBlock
        name="BigSlider"
        description="Slider 72px con gradient color-mix var(--accent), label percentuale 28/600."
        sample={
          <div style={{ width: '100%', maxWidth: 360 }}>
            <BigSlider value={bigSliderVal} onChange={setBigSliderVal} />
          </div>
        }
        code={
          '<BigSlider value={brightness} onChange={setBrightness} color="var(--accent)" />'
        }
      />

      {/* === 5. RadialDial — extra breathing per CD-01 === */}
      <SubBlock
        name="RadialDial"
        description="Dial 220x220, valore centrale 68/600, color prop obbligatoria."
        sample={
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <RadialDial
              value={dialVal}
              min={7}
              max={30}
              onChange={setDialVal}
              color="var(--accent)"
              label="°C"
            />
          </div>
        }
        code={
          '<RadialDial value={target} min={7} max={30} onChange={setTarget} color="var(--accent)" label="°C" />'
        }
        extraTopGap
      />

      {/* === 6. SheetBtn === */}
      <SubBlock
        name="SheetBtn"
        description="Pulsante sheet con icon + label 14/500."
        sample={
          <SheetBtn
            Icon={Settings}
            label="Impostazioni"
            onClick={() => undefined}
          />
        }
        code={
          '<SheetBtn Icon={Settings} label="Impostazioni" onClick={() => navigate("/settings")} />'
        }
      />

      {/* === 7. QuickActionButton === */}
      <SubBlock
        name="QuickActionButton"
        description="Toggle quick-action; active drive lo stato visuale yellow."
        sample={
          <QuickActionButton
            active={qabActive}
            onClick={() => setQabActive((p) => !p)}
            label={qabActive ? 'Timer attivo' : 'Timer'}
          />
        }
        code={
          '<QuickActionButton active={timerOn} onClick={() => setTimerOn(p => !p)} label="Timer" />'
        }
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
  extraTopGap?: boolean;
}

function SubBlock({
  name,
  description,
  sample,
  code,
  isLast,
  extraTopGap,
}: SubBlockProps): React.ReactElement {
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
        <div style={{ marginTop: extraTopGap ? 24 : 16 }}>{sample}</div>
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
