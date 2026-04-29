'use client';
/**
 * LightBody — Phase 179 rooms body (Plan 179-06)
 * Bundle source: rooms.jsx:389-397
 * CONTEXT D-29: Luminosità slider (interactive, 250ms debounce per-group) +
 *               Temperatura slider (always disabled — no API).
 * D-54: Frozen copy — "Luminosità" (%), "Temperatura" (K, range 2200-6500).
 *
 * Pitfall 5: brightness 0-254 is already converted to 0-100 percent by the
 * aggregator before reaching LightBody. handleBrightnessChange expects a
 * STRING percent ("0" - "100") — call as String(debounced).
 *
 * Deferred: color-temp slider rendered but permanently disabled.
 *   No Hue color-temp endpoint in useLightsCommands. See CONTEXT Deferred section.
 *   The slider renders with disabled={true} + aria-disabled for visual fidelity
 *   with bundle (T-179-06-04 accepted).
 *
 * D-66/D-67: React Compiler auto-memoizes — no manual memo hooks.
 * D-67: inline event handlers allowed.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { SliderRow } from '../primitives/SliderRow';
import type { RoomDevice } from '../types';

export function LightBody({ device }: { device: RoomDevice }): JSX.Element {
  const router = useRouter();
  const data = useLightsData();
  // Pass full lightsData shape required by useLightsCommands (LightsSheet pattern)
  const cmds = useLightsCommands({
    lightsData: {
      setRefreshing: data.setRefreshing,
      setLoadingMessage: data.setLoadingMessage,
      setError: data.setError,
      fetchData: data.fetchData,
      groups: data.groups,
      checkConnection: data.checkConnection,
      connected: data.connected,
    },
    router,
  });

  const initialBrightness = (device.extra.brightness as number | undefined) ?? 0;
  const groupId = String(device.extra.groupId ?? '');

  const [pending, setPending] = useState<number>(initialBrightness);
  // 250ms debounce per CONTEXT D-29 / Phase 16.0 volume debounce timing.
  // T-179-06-02 mitigation: coalesces rapid slider drags into one command.
  const debounced = useDebounce(pending, 250);

  // Fire handleBrightnessChange when debounced value diverges from initial.
  // Gate: groupId non-empty + device must be on (disabled slider = no command).
  // Pitfall 5: pass String(debounced) — hook expects percent as string.
  useEffect(() => {
    if (!groupId) return;
    if (!device.on) return;
    if (debounced === initialBrightness) return;
    // T-179-06-03: String cast satisfies hook contract (expects "0"-"100" string)
    void cmds.handleBrightnessChange(groupId, String(debounced));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Luminosità: interactive when device.on; disabled when off */}
      <SliderRow
        label="Luminosità"
        value={pending}
        unit="%"
        tone={device.tone}
        disabled={!device.on}
        onChange={(next) => setPending(next)}
      />
      {/*
       * Temperatura: always disabled — no Hue color-temp endpoint in useLightsCommands.
       * Rendered for visual fidelity with bundle (D-29 / T-179-06-04 accepted).
       * Range 2200-6500K per D-54.
       */}
      <SliderRow
        label="Temperatura"
        value={2700}
        unit="K"
        min={2200}
        max={6500}
        tone={device.tone}
        disabled={true}
      />
    </div>
  );
}
