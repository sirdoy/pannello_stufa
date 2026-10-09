'use client';
/**
 * useAutomationSensors — sensors a condition can read (workspace ROADMAP M70).
 *
 * One request serves every condition row of the editor: the list is kept for a short
 * time at module level, so a rule with several sensor conditions (and the rows added
 * while editing) does not ask again.
 */
import { useEffect, useState } from 'react';
import type { AutomationSensor } from '@/types/automations';

const MAX_AGE_MS = 30_000;

let cached: { at: number; promise: Promise<AutomationSensor[]> } | null = null;

function loadSensors(): Promise<AutomationSensor[]> {
  if (cached && Date.now() - cached.at < MAX_AGE_MS) return cached.promise;
  const promise = fetch('/api/v1/automations/sensors').then(async (r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as { sensors?: AutomationSensor[] };
    return json.sensors ?? [];
  });
  const entry = { at: Date.now(), promise };
  cached = entry;
  // A failed load is not kept: the next row or the next open asks again.
  promise.catch(() => {
    if (cached === entry) cached = null;
  });
  return promise;
}

/** Test helper: forget the list. */
export function resetAutomationSensorsCache(): void {
  cached = null;
}

export interface AutomationSensorsResult {
  sensors: AutomationSensor[];
  loading: boolean;
  error: string | null;
}

export function useAutomationSensors(): AutomationSensorsResult {
  const [state, setState] = useState<AutomationSensorsResult>({ sensors: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    loadSensors()
      .then((sensors) => {
        if (active) setState({ sensors, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (active) setState({ sensors: [], loading: false, error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
