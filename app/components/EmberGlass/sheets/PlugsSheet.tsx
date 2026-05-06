'use client';

/**
 * PlugsSheet — Plan 178-08 (SHEET-06 / CONTEXT D-09 / D-23).
 *
 * Presentational — receives tuyaData/cmds from parent (per quick task
 * 260506-d45 perf fix; reverses Phase 178 D-04). The dashboard TuyaCard already
 * mounts useTuyaData; this sheet body re-mounting it doubled the polling cost
 * on every open. The SelfFetch wrapper below preserves the zero-prop contract
 * for the design-system gallery (Section10SheetGallery). Mounted from
 * `TuyaCard` inside the Phase 175 `<Sheet>` primitive.
 *
 * Visual contract is verbatim from `.planning/inbox/ember-glass-design/project/components/sheets.jsx:400-466`:
 *   - 2-col summary grid (Accese / Consumo, gap 10, marginBottom 18)
 *   - Plug list rounded 18px container
 *   - 36×36 plug-tile (orange tint when on, neutral when off)
 *   - InlineToggle (#ffb84a) per row
 *
 * Tuya only (CONTEXT Out of Scope). DirigeraCard keeps `<SheetPlaceholderBody>`
 * because the Dirigera proxy is read-only at this milestone.
 *
 * Field adapter (RESEARCH Pitfall 8 + §"Field Gaps"):
 *   - `device_id` → `id`
 *   - `custom_name` → `name` (fallback to `device_id` when null)
 *   - `switch_on` → `on` (strict equality with `true`; null treated as off)
 *   - `power_w`   → `power` (null treated as 0 for UNREACHABLE plugs)
 *
 * Pitfall 8 deviation (formal scope reduction):
 *   `TuyaPlug` exposes no `room` field, and `useDeviceRegistry()` does not
 *   exist yet. The bundle's "{room} · {power}W" subtitle drops the `{room}`
 *   segment for Phase 178. Reintroducing it requires a device-registry
 *   join hook tracked under 178-CONTEXT.md `<deferred>` "PlugsSheet
 *   per-row room subtitle".
 *
 * Pitfall 10 (silent failure):
 *   `useTuyaCommands.togglePlug` is NOT wrapped in `useRetryableCommand`.
 *   Failures return `null`; the next 60s data tick (Phase 96 polling) reverts
 *   the optimistic toggle state. No per-toggle error UI.
 *
 * No manual memoization hooks (D-33 — React Compiler 1.0 discipline).
 */

import { Plug, TriangleAlert } from 'lucide-react';
import {
  useTuyaData,
  type UseTuyaDataReturn,
} from '@/app/components/devices/tuya/hooks/useTuyaData';
import {
  useTuyaCommands,
  type UseTuyaCommandsReturn,
} from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import { InlineToggle } from '../InlineToggle';

interface SimplePlug {
  id: string;
  name: string;
  on: boolean;
  power: number;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Total power formatter (bundle `sheets.jsx:432-433` verbatim).
 *   ≥1000W → "X.YY" + "kW" suffix (2 decimals, summary precision).
 *   <1000W → bare integer + "W" suffix.
 */
function formatPowerSummary(totalPower: number): { value: string; unit: 'kW' | 'W' } {
  if (totalPower >= 1000) {
    return { value: (totalPower / 1000).toFixed(2), unit: 'kW' };
  }
  return { value: String(totalPower), unit: 'W' };
}

/**
 * Per-row power formatter (bundle `sheets.jsx:457` verbatim).
 *   ≥1000W → "X.YkW" (1 decimal, row precision).
 *   <1000W → "{N}W".
 * Returns the unit-suffixed string so the caller can drop it directly into
 * the subtitle slot.
 */
function formatPowerRow(power: number): string {
  if (power >= 1000) {
    return `${(power / 1000).toFixed(1)}kW`;
  }
  return `${power}W`;
}

export interface PlugsSheetProps {
  tuyaData: UseTuyaDataReturn;
  cmds: UseTuyaCommandsReturn;
}

export function PlugsSheet({ tuyaData, cmds }: PlugsSheetProps) {
  // Loading skeleton (D-26) — sized to roughly match the final layout.
  if (tuyaData.loading && tuyaData.plugs === null) {
    return (
      <div
        data-testid="plugs-sheet-skeleton"
        style={{
          height: 520,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error / unreachable state (D-27)
  if (tuyaData.error && tuyaData.plugs === null) {
    return (
      <div
        data-testid="plugs-sheet-error"
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
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{tuyaData.error}</div>
      </div>
    );
  }

  // Field adapter — drops the bundle's `room` segment per Pitfall 8.
  const plugs: SimplePlug[] = (tuyaData.plugs ?? []).map((p) => ({
    id: p.device_id,
    name: p.custom_name ?? p.device_id,
    on: p.switch_on === true,
    power: typeof p.power_w === 'number' ? p.power_w : 0,
  }));

  const onCount = plugs.filter((p) => p.on).length;
  const totalPower = plugs.reduce((sum, p) => sum + p.power, 0);
  const summary = formatPowerSummary(totalPower);

  return (
    <div data-testid="plugs-sheet">
      {/* Summary 2-col grid (bundle sheets.jsx:412-440) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {/* Accese card — orange tint */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 18,
            background: 'rgba(255,184,74,0.08)', // AUDIT-EXCEPTION (sheets.jsx:419)
            border: '0.5px solid rgba(255,184,74,0.2)', // AUDIT-EXCEPTION
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
            data-testid="plugs-sheet-count"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 600,
              color: '#fff',
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            {onCount}
            <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>
              / {plugs.length}
            </span>
          </div>
        </div>

        {/* Consumo card — neutral white tint */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION
            border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
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
            Consumo
          </div>
          <div
            data-testid="plugs-sheet-consumption"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 600,
              color: '#fff',
              marginTop: 4,
              letterSpacing: -0.5,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {summary.value}
            <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>
              {summary.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Plug list (bundle sheets.jsx:441-465) */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION
          borderRadius: 18,
          border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
          overflow: 'hidden',
        }}
      >
        {plugs.map((p, i) => {
          const isLast = i === plugs.length - 1;
          // Pitfall 8 — drop room segment. Subtitle is power-only when on, empty when off.
          const subtitle = p.on && p.power > 0 ? formatPowerRow(p.power) : '';
          const slug = slugify(p.name);
          return (
            <div
              key={p.id}
              data-testid={`plugs-sheet-plug-${slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                gap: 12,
                borderBottom: isLast
                  ? 'none'
                  : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
              }}
            >
              {/* 36×36 plug tile — orange when on */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: p.on
                    ? 'rgba(255,184,74,0.18)' // AUDIT-EXCEPTION (sheets.jsx:447)
                    : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
                  color: p.on ? '#ffb84a' : 'rgba(255,255,255,0.3)', // AUDIT-EXCEPTION
                  border: p.on
                    ? '0.5px solid rgba(255,184,74,0.3)' // AUDIT-EXCEPTION
                    : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plug size={16} strokeWidth={2} />
              </div>

              {/* Name + subtitle (no room segment — Pitfall 8) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#fff',
                  }}
                >
                  {p.name}
                </div>
                <div
                  data-testid={`plugs-sheet-plug-${slug}-subtitle`}
                  style={{
                    fontSize: 11,
                    color: 'var(--text-2)',
                    marginTop: 2,
                  }}
                >
                  {subtitle}
                </div>
              </div>

              {/* Toggle — Tuya orange (#ffb84a). Pitfall 10: no retry wrapper. */}
              <div data-testid={`plugs-sheet-plug-${slug}-toggle`}>
                <InlineToggle
                  on={p.on}
                  color="#ffb84a"
                  onChange={() => {
                    void cmds.togglePlug(p.id, p.on);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * PlugsSheetSelfFetch — zero-prop wrapper preserving the Phase 178 D-04
 * contract for callers without a card-level mount (notably Section10SheetGallery
 * on /debug/design-system-v2). Production TuyaCard uses the prop-based
 * PlugsSheet directly.
 */
export function PlugsSheetSelfFetch() {
  const tuyaData = useTuyaData();
  const cmds = useTuyaCommands();
  return <PlugsSheet tuyaData={tuyaData} cmds={cmds} />;
}
