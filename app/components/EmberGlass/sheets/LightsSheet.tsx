'use client';

import { useRouter } from 'next/navigation';
import { Lightbulb, TriangleAlert } from 'lucide-react';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { InlineToggle } from '../InlineToggle';
import { QuickActionButton } from './primitives/QuickActionButton';
import { findSceneByName } from './lib/findSceneByName';
import type { HueGroup, HueLight } from '@/types/hueProxy';

/**
 * 4 hardcoded scene labels (D-21 frozen IT copy) paired with bundle-verbatim
 * gradients (UI-SPEC §Color verbatim, sheets.jsx:217-220). Order matters —
 * renders in row-major order across a 2-col grid.
 */
const SCENES: ReadonlyArray<{ name: string; gradient: string }> = [
  { name: 'Rilassante', gradient: 'linear-gradient(135deg, #ff8a5c, #b080ff)' },
  { name: 'Concentrato', gradient: 'linear-gradient(135deg, #fff3c4, #5eafff)' },
  { name: 'Cena', gradient: 'linear-gradient(135deg, #ffb84a, #ff8a5c)' },
  { name: 'Notte', gradient: 'linear-gradient(135deg, #2a3a6a, #b080ff)' },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * LightsSheet (SHEET-04 / CONTEXT D-07) — body-only component (D-04). Mounted
 * by Phase 177 `<LightsCard>` inside `<Sheet open onClose title="Luci">`. No
 * props; self-fetches via `useLightsData` + `useLightsCommands`.
 *
 * Visual contract verbatim from bundle
 * `.planning/inbox/ember-glass-design/project/components/sheets.jsx:199-297`.
 * Italian copy frozen at CONTEXT D-21 (`Accese`, `Tutte on`, `Tutte off`,
 * `Scene`, `Rilassante`, `Concentrato`, `Cena`, `Notte`).
 *
 * Pitfall 9 (Hue field gaps — RESEARCH §"Field Gaps → LightsSheet"):
 *   - `useLightsData().lights[]` exposes `room_id` / `room_name` but the bundle
 *     groups lights by Hue group membership, not room metadata. We honor the
 *     bundle: `byRoom` is built from `groups[]` filtered by `type === 'Room'`,
 *     and each group's `lights[]` (string[] of light_ids) is reverse-mapped
 *     against the global `lights[]` array.
 *   - Per-light row InlineToggle invokes `handleRoomToggle(group.group_id,
 *     !groupOn)` — semantically a ROOM-level write. The bundle visual implies
 *     per-light control, but the existing `useLightsCommands` surface only
 *     exposes a room-level toggle. Acceptable UX trade-off; documented in
 *     `<threat_model>` T-178-06-02 (accept).
 *
 * Scene activation: each of the 4 scene buttons looks up its match via
 * `findSceneByName(scenes, name)` (case-insensitive). On hit, the button
 * fires `handleSceneActivate(match.scene_id, primaryGroupId)` where
 * `primaryGroupId` is the first group with `type === 'Room'`. On miss OR
 * when no primary group exists, the button renders disabled (50% opacity,
 * `cursor: not-allowed`, `title="Crea scena '{name}' su Hue"`) and click
 * is a no-op (the native `disabled` attribute prevents click).
 *
 * Loading + error states (D-26 / D-27):
 *   - Loading skeleton renders ONLY when `loading && lights.length === 0
 *     && groups.length === 0` — i.e. the very first fetch with no cached
 *     data. Subsequent refreshes do not show a skeleton.
 *   - Error fallback renders when `error` is set and there is no cached
 *     data. The string error from the hook is passed through verbatim
 *     under the primary copy. No retry button — closing and reopening
 *     the sheet retries naturally (each open re-renders).
 *
 * RC-clean (D-33): no manual memoization hooks. React Compiler 1.0
 * auto-memoizes; inline arrow handlers are explicitly allowed (D-34).
 */
export function LightsSheet() {
  const router = useRouter();
  const lightsData = useLightsData();
  const cmds = useLightsCommands({
    lightsData: {
      setRefreshing: lightsData.setRefreshing,
      setLoadingMessage: lightsData.setLoadingMessage,
      setError: lightsData.setError,
      fetchData: lightsData.fetchData,
      groups: lightsData.groups,
      checkConnection: lightsData.checkConnection,
      connected: lightsData.connected,
    },
    router,
  });

  const lights: HueLight[] = lightsData.lights ?? [];
  const groups: HueGroup[] = lightsData.groups ?? [];
  const scenes = lightsData.scenes ?? [];

  // Loading skeleton (D-26) — first fetch only; later refreshes keep cached UI.
  if (lightsData.loading && lights.length === 0 && groups.length === 0) {
    return (
      <div
        data-testid="lights-sheet-skeleton"
        style={{
          height: 520,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (D-27) — only when the hook is in error AND has no cached data.
  const errorMessage = lightsData.error;
  if (errorMessage && lights.length === 0 && groups.length === 0) {
    return (
      <div
        data-testid="lights-sheet-error"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 0',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          Non raggiungibile. Riprova più tardi.
        </div>
        {typeof errorMessage === 'string' && errorMessage.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{errorMessage}</div>
        )}
      </div>
    );
  }

  const onCount = lights.filter((l) => l.on).length;
  const allOn = lights.length > 0 && onCount === lights.length;

  // byRoom mapping (Pitfall 9): reverse-map from groups, NOT lights.
  const byRoom: Array<{ name: string; group: HueGroup; lights: HueLight[] }> = [];
  for (const group of groups) {
    if (group.type !== 'Room') continue;
    const memberIds = group.lights ?? [];
    byRoom.push({
      name: group.name,
      group,
      lights: lights.filter((l) => memberIds.includes(l.light_id)),
    });
  }

  // Primary group for scene activation (UI-SPEC §"Claude's Discretion"):
  // first Room-type group. Falls back to undefined → all scenes disabled.
  const primaryGroup = groups.find((g) => g.type === 'Room');
  const primaryGroupId = primaryGroup?.group_id;

  return (
    <div data-testid="lights-sheet">
      {/* Summary header — 3-col grid (count card + Tutte on/off pills) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 10,
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 16,
            background:
              onCount > 0
                ? 'rgba(245,200,74,0.1)' // AUDIT-EXCEPTION (sheets.jsx:232) — Lights yellow tint
                : 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION
            border:
              onCount > 0
                ? '0.5px solid rgba(245,200,74,0.25)' // AUDIT-EXCEPTION
                : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Accese
          </div>
          <div
            data-testid="lights-sheet-count"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 600,
              color: '#fff', // AUDIT-EXCEPTION
              marginTop: 2,
              letterSpacing: -0.5,
            }}
          >
            {onCount}
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-2)',
                marginLeft: 4,
              }}
            >
              / {lights.length}
            </span>
          </div>
        </div>
        <QuickActionButton
          active={allOn}
          label="Tutte on"
          onClick={() => void cmds.handleAllLightsToggle(true)}
        />
        <QuickActionButton
          active={false}
          label="Tutte off"
          onClick={() => void cmds.handleAllLightsToggle(false)}
        />
      </div>

      {/* Scene strip — 11px caps eyebrow + 2-col grid of 4 scene buttons */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        Scene
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {SCENES.map((sc) => {
          const match = findSceneByName(scenes, sc.name);
          const disabled = !match || !primaryGroupId;
          return (
            <button
              key={sc.name}
              type="button"
              data-testid={`lights-sheet-scene-${slugify(sc.name)}`}
              data-sheet-focusable="true"
              data-disabled={disabled ? 'true' : 'false'}
              title={disabled ? `Crea scena '${sc.name}' su Hue` : undefined}
              disabled={disabled}
              onClick={() => {
                if (disabled || !match || !primaryGroupId) return;
                void cmds.handleSceneActivate(match.scene_id, primaryGroupId);
              }}
              style={{
                padding: 12,
                borderRadius: 14,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (sheets.jsx:256)
                border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  background: sc.gradient, // AUDIT-EXCEPTION — bundle scene gradient verbatim
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {sc.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Per-room sections — for each Room group, a labeled rounded list */}
      {byRoom.map((section) => {
        const groupOn = section.group.any_on === true;
        return (
          <div
            key={section.group.group_id}
            data-testid={`lights-sheet-room-${slugify(section.name)}`}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              {section.name}
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION (sheets.jsx:272)
                borderRadius: 16,
                border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                overflow: 'hidden',
              }}
            >
              {section.lights.map((l, i) => {
                const isLast = i === section.lights.length - 1;
                return (
                  <div
                    key={l.light_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 14px',
                      gap: 12,
                      borderBottom: isLast
                        ? 'none'
                        : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                    }}
                  >
                    {/* 32×32 bulb tile (yellow-on / grey-off) */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        flexShrink: 0,
                        background: l.on
                          ? 'rgba(245,200,74,0.18)' // AUDIT-EXCEPTION (sheets.jsx:280)
                          : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
                        color: l.on ? '#f5c84a' : 'rgba(255,255,255,0.3)', // AUDIT-EXCEPTION
                        border: l.on
                          ? '0.5px solid rgba(245,200,74,0.3)' // AUDIT-EXCEPTION
                          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: l.on
                          ? '0 0 12px rgba(245,200,74,0.25)' // AUDIT-EXCEPTION
                          : 'none',
                      }}
                    >
                      <Lightbulb size={15} strokeWidth={2} />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#fff', // AUDIT-EXCEPTION
                        fontWeight: 500,
                      }}
                    >
                      {l.name}
                    </div>
                    {/*
                     * Pitfall 9: InlineToggle's `onChange` receives a MouseEvent
                     * (not a boolean). The handler computes the next group state
                     * from the group's current `any_on` and fires
                     * `handleRoomToggle(group_id, !any_on)` — a ROOM-level write.
                     */}
                    <div
                      data-testid={`lights-sheet-light-${slugify(l.name)}-toggle`}
                    >
                      <InlineToggle
                        on={l.on}
                        color="#f5c84a"
                        onChange={() =>
                          void cmds.handleRoomToggle(
                            section.group.group_id,
                            !groupOn,
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
